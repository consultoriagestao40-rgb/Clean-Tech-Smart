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
    return res.status(400).json({ error: 'ID não informado.' });
  }

  try {
    const isApproval = !feedback?.includes('[Solicitação de Ajustes]');
    const newStatus = isApproval ? 'Aprovada' : 'Negociação';

    const { rows } = await pool.query(`
      UPDATE service_proposals
      SET status = $1,
          notes = CASE 
            WHEN notes IS NULL OR notes = '' THEN $2
            ELSE notes || E'\n' || $2
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [newStatus, feedback || '', id]);

    return res.status(200).json({ proposal: rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar status da proposta de serviço:', error);
    return res.status(500).json({ error: 'Erro interno ao processar aprovação.' });
  }
}
