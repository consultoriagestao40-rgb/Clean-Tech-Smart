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

  const client = await pool.connect();

  try {
    const result = await client.query(`
      SELECT * FROM rental_prices
      ORDER BY code ASC
    `);
    
    return res.status(200).json({ rentalPrices: result.rows });
  } catch (error) {
    console.error('Erro ao buscar tabela de locação:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar tabela de locação' });
  } finally {
    client.release();
  }
}
