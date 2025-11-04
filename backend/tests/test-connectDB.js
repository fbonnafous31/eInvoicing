// test-pg-direct.js
const { Pool } = require('pg');
const { types } = require('pg');

// Pour gérer les dates correctement
types.setTypeParser(1082, val => val);

const pool = new Pool({
  user: 'TON_DB_USER',
  host: 'TON_DB_HOST',
  database: 'TON_DB_NAME',
  password: 'TON_DB_PASSWORD',
  port: Number('TON_DB_PORT'),
  ssl: {
    rejectUnauthorized: false // nécessaire pour Render
  },
});

(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Connexion DB OK", res.rows[0]);
  } catch (err) {
    console.error("❌ Erreur DB", err);
  } finally {
    await pool.end();
  }
})();
