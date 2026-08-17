import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkClients() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM clients;");
    console.log("Clientes cadastrados no banco:", res.rows);
  } catch (error) {
    console.error(error);
  } finally {
    client.release();
    pool.end();
  }
}

checkClients();
