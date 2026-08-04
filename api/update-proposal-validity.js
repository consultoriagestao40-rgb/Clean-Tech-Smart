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

  const { id, validity_days, type } = req.body;

  if (!id || !validity_days) {
    return res.status(400).json({ error: 'ID e validade são obrigatórios.' });
  }

  const table = type === 'sales' ? 'sales_proposals' : 'rental_proposals';

  try {
    const { rows } = await pool.query(`
      UPDATE ${table}
      SET validity_days = $1
      WHERE id = $2
      RETURNING *
    `, [validity_days, id]);

    if (rows.length === 0) {
      const fallbackTable = table === 'sales_proposals' ? 'rental_proposals' : 'sales_proposals';
      const fallbackRes = await pool.query(`
        UPDATE ${fallbackTable}
        SET validity_days = $1
        WHERE id = $2
        RETURNING *
      `, [validity_days, id]);

      if (fallbackRes.rows.length === 0) {
        return res.status(404).json({ error: 'Proposta não encontrada.' });
      }
      return res.status(200).json({ success: true, proposal: fallbackRes.rows[0] });
    }

    return res.status(200).json({ success: true, proposal: rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar validade:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar validade.' });
  }
}
