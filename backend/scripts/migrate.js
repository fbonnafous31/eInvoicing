const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config();

const MIGRATIONS_DIR = path.join(__dirname, "../../sql/migrations");
const INFRASTRUCTURE_SQL = path.join(
  __dirname,
  "../../sql/infrastructure/create_migrations_table.sql"
);

async function run() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD || undefined,
    port: Number(process.env.DB_PORT),
    ssl: process.env.DB_SSL === "true"
  });

  await client.connect();
  console.log("✅ Connected to database");

  // 1️⃣ Table migrations
  const infraSQL = fs.readFileSync(INFRASTRUCTURE_SQL, "utf8");
  await client.query(infraSQL);

  // 2️⃣ Migrations déjà exécutées
  const { rows } = await client.query("SELECT name FROM migrations");
  const executed = rows.map(r => r.name);

  // 3️⃣ Exécution des migrations
  const files = fs.readdirSync(MIGRATIONS_DIR).sort();

  for (const file of files) {
    if (executed.includes(file)) {
      console.log(`⏭️  Skipping ${file}`);
      continue;
    }

    console.log(`🚀 Running ${file}`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO migrations(name) VALUES($1)",
        [file]
      );
      await client.query("COMMIT");
      console.log(`✅ Applied ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }

  await client.end();
  console.log("🎉 Migrations complete");
}

run().catch(err => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});