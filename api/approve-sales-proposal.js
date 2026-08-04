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

  const { id, feedback } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID da proposta é obrigatório.' });
  }

  try {
    const { rows } = await pool.query(`
      UPDATE sales_proposals
      SET status = 'Aprovada',
          notes = COALESCE(notes, '') || E'\n[Aprovação Digital]: ' || $2
      WHERE id = $1
      RETURNING *
    `, [id, feedback || 'Proposta de Venda assinada e aprovada digitalmente pelo cliente.']);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada.' });
    }

    return res.status(200).json({ proposal: rows[0] });
  } catch (error) {
    console.error('Erro ao aprovar proposta de venda:', error);
    return res.status(500).json({ error: 'Erro interno ao aprovar proposta.' });
  }
}
