// ═══════════════════════════════════════════════════
// db.js — PostgreSQL Database Connection
// ═══════════════════════════════════════════════════
//
// This module creates a "pool" of database connections.
// A pool = a set of reusable connections (like a parking lot
// of cars). Instead of connecting/disconnecting each time,
// we grab a free connection, use it, then return it.
//
// WHY a pool?
//   - Connecting to a DB is slow (~100ms)
//   - A pool keeps connections ready to go
//   - Handles multiple users at the same time
//

const { Pool } = require("pg");

// ── Create the connection pool ──
// DATABASE_URL comes from docker-compose environment variable:
//   postgresql://skybook:skybook123@db:5432/skybook
//
// If DATABASE_URL is not set (running locally without Docker),
// fall back to localhost defaults.
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://skybook:skybook123@localhost:5432/skybook",
});

// ── Helper: run a SQL query ──
// Usage:  const result = await db.query("SELECT * FROM flights");
//         const rows = result.rows;
const query = (text, params) => pool.query(text, params);

// ── Test the connection on startup ──
async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("  ✅ Database connected:", result.rows[0].now);
    return true;
  } catch (err) {
    console.error("  ❌ Database connection failed:", err.message);
    return false;
  }
}

module.exports = { query, pool, testConnection };
