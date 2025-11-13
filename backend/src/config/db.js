require('dotenv').config();
const { Pool } = require('pg');
const { types } = require('pg');

// L'OID (Object ID) pour le type DATE dans PostgreSQL est 1082.
// Cette ligne indique à node-postgres de retourner les colonnes de type DATE
// comme des chaînes de caractères brutes ('YYYY-MM-DD') au lieu de les parser.
// Cela évite tous les problèmes de conversion de fuseau horaire.
types.setTypeParser(1082, val => val);

const useSSL = process.env.DB_SSL === 'true';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: useSSL
    ? { rejectUnauthorized: false } // SSL prod / hosting
    : false,                        // local / Docker dev
});

module.exports = pool;