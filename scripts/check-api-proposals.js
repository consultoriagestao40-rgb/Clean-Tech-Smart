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

async function checkApiProposals() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT rp.*, 
             c.name as client_name, 
             mm.name as machine_name,
             r.code as rental_code
      FROM rental_proposals rp
      LEFT JOIN clients c ON rp.client_id::text = c.id::text
      LEFT JOIN machine_models mm ON rp.machine_model_id = mm.id
      LEFT JOIN rental_prices r ON rp.rental_price_id = r.id
      ORDER BY rp.created_at DESC
    `);
    console.log("Query executada com sucesso. Linhas:", rows);
  } catch (error) {
    console.error("Erro na Query:", error);
  } finally {
    client.release();
    pool.end();
  }
}

checkApiProposals();
