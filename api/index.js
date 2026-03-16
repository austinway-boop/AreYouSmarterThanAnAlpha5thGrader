const express = require("express");
const session = require("express-session");
const crypto = require("crypto");
const { pool, initDB } = require("./db");

const app = express();
app.use(express.json());

app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: true,
      sameSite: "lax",
    },
  })
);

let dbReady = false;
initDB().then(() => { dbReady = true; }).catch(console.error);

const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL;

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Step 1: redirect user to X authorization page
app.get("/api/auth/twitter", (req, res) => {
  const state = base64url(crypto.randomBytes(16));
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());

  req.session.oauthState = state;
  req.session.codeVerifier = codeVerifier;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: "tweet.read users.read",
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  res.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
});

// Step 2: handle callback from X
app.get("/api/auth/twitter/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || state !== req.session.oauthState) {
    return res.redirect("/?auth_error=1");
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: CALLBACK_URL,
        code_verifier: req.session.codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Token exchange failed:", err);
      return res.redirect("/?auth_error=1");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch user profile
    const userRes = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url,username", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      console.error("User fetch failed:", await userRes.text());
      return res.redirect("/?auth_error=1");
    }

    const userData = await userRes.json();
    const xId = userData.data.id;
    const xHandle = "@" + userData.data.username;
    const xName = userData.data.name;
    const xAvatar = userData.data.profile_image_url || "";

    // Upsert user in DB
    const dbRes = await pool.query(
      `INSERT INTO users (x_id, x_handle, x_name, x_avatar)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (x_id) DO UPDATE SET x_handle=$2, x_name=$3, x_avatar=$4
       RETURNING *`,
      [xId, xHandle, xName, xAvatar]
    );

    req.session.userId = dbRes.rows[0].id;
    req.session.user = {
      id: dbRes.rows[0].id,
      handle: xHandle,
      name: xName,
      avatar: xAvatar,
    };

    res.redirect("/?authenticated=1");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.redirect("/?auth_error=1");
  }
});

app.get("/api/auth/me", (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

app.get("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ═══════════ API ROUTES ═══════════

app.post("/api/results", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not authenticated" });

  const { grade_reached, passed_all, total_correct, total_questions, best_streak, language, answers } = req.body;

  try {
    await pool.query(
      `INSERT INTO results (user_id, grade_reached, passed_all, total_correct, total_questions, best_streak, language, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [req.session.user.id, grade_reached, passed_all, total_correct, total_questions, best_streak, language, JSON.stringify(answers)]
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
        r.grade_reached,
        r.passed_all,
        r.total_correct,
        r.total_questions,
        r.created_at
      FROM results r
      JOIN users u ON r.user_id = u.id
      ORDER BY u.id, r.created_at DESC
    `);

    const gradeRank = { "11": 5, "7": 4, "5": 3, "3": 2, "1": 1 };
    const sorted = result.rows.sort((a, b) => {
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
