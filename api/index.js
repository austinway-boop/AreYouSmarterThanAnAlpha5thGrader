const express = require("express");
const { OAuth } = require("oauth");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const { pool, initDB } = require("./db");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);

let dbReady = false;
initDB().then(() => { dbReady = true; }).catch(console.error);

const CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;
const COOKIE_SECRET = process.env.SESSION_SECRET || "fallback-secret";

const oa = new OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  CONSUMER_KEY,
  CONSUMER_SECRET,
  "1.0A",
  CALLBACK_URL,
  "HMAC-SHA1"
);

// Encrypt/decrypt helpers for storing oauth_token_secret in a cookie
function encrypt(text) {
  const key = crypto.scryptSync(COOKIE_SECRET, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  const key = crypto.scryptSync(COOKIE_SECRET, "salt", 32);
  const [ivHex, encrypted] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// Signed cookie for authenticated user (stateless session replacement)
function setUserCookie(res, user) {
  const payload = JSON.stringify(user);
  const encrypted = encrypt(payload);
  res.cookie("authed_user", encrypted, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function getUserFromCookie(req) {
  const val = req.cookies?.authed_user;
  if (!val) return null;
  try {
    return JSON.parse(decrypt(val));
  } catch {
    return null;
  }
}

// ═══════════ OAUTH 1.0a ROUTES ═══════════

// Step 1: Get request token, redirect to X
app.get("/api/auth/twitter", (req, res) => {
  console.log("OAuth1a start - key:", CONSUMER_KEY?.substring(0, 6) + "...", "callback:", CALLBACK_URL);
  oa.getOAuthRequestToken((err, oauthToken, oauthTokenSecret) => {
    if (err) {
      console.error("Request token error:", JSON.stringify(err));
      return res.status(500).json({ error: "Failed to get request token", detail: err?.statusCode, message: err?.data });
    }

    // Store the secret in an encrypted cookie
    const encryptedSecret = encrypt(oauthTokenSecret);
    res.cookie("oauth_token_secret", encryptedSecret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 10 * 60 * 1000, // 10 min
      path: "/",
    });

    res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`);
  });
});

// Step 2: Callback from X after user authorizes
app.get("/api/auth/twitter/callback", (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;

  if (!oauth_token || !oauth_verifier) {
    return res.redirect("/?auth_error=missing_params");
  }

  // Read the encrypted secret from cookie
  const encryptedSecret = req.cookies?.oauth_token_secret;
  if (!encryptedSecret) {
    console.error("No oauth_token_secret cookie found");
    return res.redirect("/?auth_error=no_cookie");
  }

  let oauthTokenSecret;
  try {
    oauthTokenSecret = decrypt(encryptedSecret);
  } catch (e) {
    console.error("Failed to decrypt oauth_token_secret:", e.message);
    return res.redirect("/?auth_error=decrypt_failed");
  }

  // Exchange for access token
  oa.getOAuthAccessToken(
    oauth_token,
    oauthTokenSecret,
    oauth_verifier,
    async (err, accessToken, accessTokenSecret, results) => {
      if (err) {
        console.error("Access token error:", JSON.stringify(err));
        return res.redirect("/?auth_error=access_token_failed");
      }

      const xId = results.user_id;
      const screenName = results.screen_name;
      const xHandle = "@" + screenName;

      let xAvatar = "";
      let followersCount = 0;
      try {
        const profileData = await new Promise((resolve) => {
          oa.get(
            `https://api.twitter.com/1.1/users/show.json?screen_name=${screenName}`,
            accessToken, accessTokenSecret,
            (pErr, pData) => {
              if (pErr) { resolve(null); return; }
              try { resolve(JSON.parse(pData)); } catch { resolve(null); }
            }
          );
        });
        if (profileData?.profile_image_url_https) {
          xAvatar = profileData.profile_image_url_https.replace("_normal", "");
        }
        if (profileData?.followers_count != null) {
          followersCount = profileData.followers_count;
        }
      } catch (e) {
        console.error("Profile fetch error (non-fatal):", e.message);
      }

      try {
        const dbRes = await pool.query(
          `INSERT INTO users (x_id, x_handle, x_name, x_avatar, followers_count)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (x_id) DO UPDATE SET x_handle=$2, x_name=$3, x_avatar=$4, followers_count=$5
           RETURNING *`,
          [xId, xHandle, screenName, xAvatar, followersCount]
        );

        const user = {
          id: dbRes.rows[0].id,
          handle: xHandle,
          name: screenName,
          avatar: xAvatar,
        };

        // Clear the temp cookie, set the auth cookie
        res.clearCookie("oauth_token_secret", { path: "/" });
        setUserCookie(res, user);

        res.redirect("/?authenticated=1");
      } catch (dbErr) {
        console.error("DB error:", dbErr);
        res.redirect("/?auth_error=db_failed");
      }
    }
  );
});

// Localhost dev auto-login
app.get("/api/auth/dev", async (req, res) => {
  const host = req.hostname;
  if (host !== "localhost" && host !== "127.0.0.1") {
    return res.status(403).json({ error: "Dev auth only available on localhost" });
  }
  try {
    const dbRes = await pool.query(
      `INSERT INTO users (x_id, x_handle, x_name, x_avatar)
       VALUES ('dev_local', '@localhost', 'Local Dev', '')
       ON CONFLICT (x_id) DO UPDATE SET x_handle='@localhost'
       RETURNING *`
    );
    const user = { id: dbRes.rows[0].id, handle: "@localhost", name: "Local Dev", avatar: "" };
    setUserCookie(res, user);
    res.json(user);
  } catch (err) {
    console.error("Dev auth error:", err);
    res.status(500).json({ error: "Dev auth failed" });
  }
});

// Auth status
app.get("/api/auth/me", async (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  // Verify user still exists in DB
  try {
    const check = await pool.query("SELECT id FROM users WHERE id = $1", [user.id]);
    if (check.rows.length === 0) {
      res.clearCookie("authed_user", { path: "/" });
      return res.status(401).json({ error: "User not found" });
    }
  } catch (e) {
    // DB error — still return user from cookie as fallback
  }

  res.json(user);
});

// Logout
app.get("/api/auth/logout", (req, res) => {
  res.clearCookie("authed_user", { path: "/" });
  res.redirect("/");
});

// Health check / debug
app.get("/api/health", async (req, res) => {
  const user = getUserFromCookie(req);
  let dbOk = false;
  let userCount = 0;
  let resultCount = 0;
  try {
    const u = await pool.query("SELECT count(*) FROM users");
    const r = await pool.query("SELECT count(*) FROM results");
    userCount = parseInt(u.rows[0].count);
    resultCount = parseInt(r.rows[0].count);
    dbOk = true;
  } catch (e) {
    dbOk = false;
  }
  res.json({ dbOk, dbReady, userCount, resultCount, authed: !!user, user: user || null });
});

// ═══════════ API ROUTES ═══════════

app.post("/api/results", async (req, res) => {
  const user = getUserFromCookie(req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  // Verify user still exists in DB (may have been deleted)
  try {
    const check = await pool.query("SELECT id FROM users WHERE id = $1", [user.id]);
    if (check.rows.length === 0) {
      res.clearCookie("authed_user", { path: "/" });
      return res.status(401).json({ error: "User not found. Please log in again." });
    }
  } catch (e) {
    console.error("User check error:", e);
  }

  const { grade_reached, passed_all, total_correct, total_questions, best_streak, language, answers } = req.body;

  try {
    await pool.query(
      `INSERT INTO results (user_id, grade_reached, passed_all, total_correct, total_questions, best_streak, language, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [user.id, grade_reached, passed_all, total_correct, total_questions, best_streak, language, JSON.stringify(answers)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Error saving results:", err);
    res.status(500).json({ error: "Failed to save results" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (u.id)
        u.x_handle as handle,
        u.x_avatar as avatar,
        u.followers_count,
        r.grade_reached,
        r.passed_all,
        r.total_correct,
        r.total_questions,
        r.created_at
      FROM users u
      LEFT JOIN results r ON r.user_id = u.id
      ORDER BY u.id, r.created_at DESC NULLS LAST
    `);

    const gradeRank = { "11": 5, "7": 4, "5": 3, "3": 2, "1": 1, "0": 0 };
    const sorted = result.rows.sort((a, b) => {
      const aPlayed = a.grade_reached != null;
      const bPlayed = b.grade_reached != null;
      if (aPlayed !== bPlayed) return bPlayed - aPlayed;
      const fa = a.followers_count || 0;
      const fb = b.followers_count || 0;
      if (fb !== fa) return fb - fa;
      const ra = a.passed_all ? 99 : (gradeRank[a.grade_reached] || 0);
      const rb = b.passed_all ? 99 : (gradeRank[b.grade_reached] || 0);
      if (rb !== ra) return rb - ra;
      return (b.total_correct || 0) - (a.total_correct || 0);
    });

    res.json(sorted.slice(0, 20));
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

module.exports = app;
