import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const client = await pool.connect();

  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
    }

    // Tenta inserir a categoria
    const result = await client.query(`
      INSERT INTO equipment_categories (name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING *;
    `, [name.trim()]);
    
    return res.status(200).json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar categoria:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar categoria' });
  } finally {
    client.release();
  }
}
