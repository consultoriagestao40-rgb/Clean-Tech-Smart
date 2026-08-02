import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { rows } = await pool.query(`
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
    return res.status(200).json({ proposals: rows });
  } catch (error) {
    console.error('Erro ao buscar propostas de locação:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar propostas.' });
  }
}
