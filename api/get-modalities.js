import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const client = await pool.connect();

  try {
    const result = await client.query('SELECT * FROM modalities ORDER BY days_count DESC;');
    return res.status(200).json({ success: true, modalities: result.rows });
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar modalidades' });
  } finally {
    client.release();
  }
}
