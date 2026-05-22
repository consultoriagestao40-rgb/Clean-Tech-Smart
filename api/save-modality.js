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
    const { id, name, days_count } = req.body;
    
    if (!name || days_count === undefined) {
      return res.status(400).json({ error: 'Nome e quantidade de dias são obrigatórios.' });
    }

    let result;

    if (id) {
      result = await client.query(`
        UPDATE modalities 
        SET name = $1, days_count = $2
        WHERE id = $3
        RETURNING *;
      `, [name, days_count, id]);
    } else {
      result = await client.query(`
        INSERT INTO modalities (name, days_count)
        VALUES ($1, $2)
        RETURNING *;
      `, [name, days_count]);
    }
    
    return res.status(200).json({ success: true, modality: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar modalidade:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar modalidade' });
  } finally {
    client.release();
  }
}
