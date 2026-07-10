import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const client = await pool.connect();

  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID da categoria é obrigatório.' });
    }

    await client.query(`
      DELETE FROM equipment_categories
      WHERE id = $1
    `, [id]);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return res.status(500).json({ error: 'Erro interno ao excluir categoria' });
  } finally {
    client.release();
  }
}
