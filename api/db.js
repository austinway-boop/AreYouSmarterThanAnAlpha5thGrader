const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        x_id TEXT UNIQUE NOT NULL,
        x_handle TEXT,
        x_name TEXT,
        x_avatar TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        grade_reached TEXT,
        passed_all BOOLEAN DEFAULT FALSE,
        total_correct INTEGER,
        total_questions INTEGER,
        best_streak INTEGER,
        language TEXT DEFAULT 'en',
        answers JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Database tables ready");
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
