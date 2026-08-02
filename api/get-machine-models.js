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
    const { rows } = await pool.query('SELECT * FROM machine_models ORDER BY name ASC');
    return res.status(200).json({ machineModels: rows });
  } catch (error) {
    console.error('Erro ao buscar modelos de máquinas:', error);
    return res.status(500).json({ error: 'Erro ao buscar modelos de máquinas.' });
  }
}
