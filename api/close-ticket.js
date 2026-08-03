import { Pool } from 'pg';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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

  const {
    id,
    evidence_photos,
    client_signature,
    signed_by_name,
    signed_by_document,
    resolution_notes,
    internal_notes
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID do chamado é obrigatório.' });
  }

  const client = await pool.connect();

  try {
    const result = await client.query(`
      UPDATE service_tickets
      SET status = 'Concluído',
          evidence_photos = $1,
          client_signature = $2,
          signed_by_name = $3,
          signed_by_document = $4,
          resolution_notes = $5,
          internal_notes = COALESCE($6, internal_notes),
          closed_at = NOW(),
          updated_at = NOW()
      WHERE id = $7
      RETURNING *;
    `, [
      evidence_photos || null,
      client_signature || null,
      signed_by_name || null,
      signed_by_document || null,
      resolution_notes || null,
      internal_notes || null,
      Number(id)
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chamado não encontrado.' });
    }

    return res.status(200).json({ success: true, ticket: result.rows[0] });
  } catch (error) {
    console.error('Erro ao fechar chamado:', error);
    return res.status(500).json({ error: 'Erro interno ao fechar chamado' });
  } finally {
    client.release();
  }
}
