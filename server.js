require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const path = require("path");
const { pool, initDB } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ═══════════ PASSPORT TWITTER ═══════════

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    async (token, tokenSecret, profile, done) => {
      try {
        const xId = profile.id;
        const xHandle = "@" + profile.username;
        const xName = profile.displayName;
        const xAvatar = profile.photos?.[0]?.value || "";

        const res = await pool.query(
          `INSERT INTO users (x_id, x_handle, x_name, x_avatar)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (x_id) DO UPDATE SET x_handle=$2, x_name=$3, x_avatar=$4
           RETURNING *`,
          [xId, xHandle, xName, xAvatar]
        );
        return done(null, res.rows[0]);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, res.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

// ═══════════ AUTH ROUTES ═══════════

app.get("/auth/twitter", passport.authenticate("twitter"));

app.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", { failureRedirect: "/?auth_error=1" }),
  (req, res) => res.redirect("/?authenticated=1")
);

app.get("/auth/me", (req, res) => {
  if (req.isAuthenticated()) {
    const u = req.user;
    res.json({ id: u.id, handle: u.x_handle, name: u.x_name, avatar: u.x_avatar });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// ═══════════ API ROUTES ═══════════

app.post("/api/results", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });

  const { grade_reached, passed_all, total_correct, total_questions, best_streak, language, answers } = req.body;

  try {
    await pool.query(
      `INSERT INTO results (user_id, grade_reached, passed_all, total_correct, total_questions, best_streak, language, answers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [req.user.id, grade_reached, passed_all, total_correct, total_questions, best_streak, language, JSON.stringify(answers)]
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

// ═══════════ STATIC FILES ═══════════

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ═══════════ START ═══════════

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
