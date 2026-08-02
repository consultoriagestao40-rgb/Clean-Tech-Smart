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

  const { id, name, photo_urls, technical_description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'O nome do modelo de máquina é obrigatório.' });
  }

  try {
    if (id) {
      // Update
      const { rows } = await pool.query(
        `UPDATE machine_models 
         SET name = $1, photo_urls = $2, technical_description = $3 
         WHERE id = $4 
         RETURNING *`,
        [name, photo_urls, technical_description, id]
      );
      return res.status(200).json({ machineModel: rows[0] });
    } else {
      // Insert
      const { rows } = await pool.query(
        `INSERT INTO machine_models (name, photo_urls, technical_description) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [name, photo_urls, technical_description]
      );
      return res.status(201).json({ machineModel: rows[0] });
    }
  } catch (error) {
    console.error('Erro ao salvar modelo de máquina:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar modelo de máquina.' });
  }
}
