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
    const { id, name, email, phone, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'O nome do técnico é obrigatório.' });
    }

    let result;

    if (id) {
      result = await client.query(`
        UPDATE technicians
        SET name = $1, email = $2, phone = $3, status = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING *;
      `, [name.trim(), email || null, phone || null, status || 'Ativo', id]);
    } else {
      result = await client.query(`
        INSERT INTO technicians (name, email, phone, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `, [name.trim(), email || null, phone || null, status || 'Ativo']);
    }

    return res.status(200).json({ success: true, technician: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar técnico:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar técnico' });
  } finally {
    client.release();
  }
}
