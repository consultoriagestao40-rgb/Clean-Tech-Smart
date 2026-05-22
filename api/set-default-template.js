import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const client = await pool.connect();

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

    await client.query('BEGIN');
    // Set all to false
    await client.query('UPDATE contract_templates SET is_default = FALSE');
    // Set the specific one to true
    await client.query('UPDATE contract_templates SET is_default = TRUE WHERE id = $1', [id]);
    await client.query('COMMIT');
    
    return res.status(200).json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao definir template padrão:', error);
    return res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
}
