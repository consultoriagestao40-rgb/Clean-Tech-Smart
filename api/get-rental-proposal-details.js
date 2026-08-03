import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'ID da proposta inválido.' });
  }

  try {
    const { rows } = await pool.query(`
      SELECT rp.*, 
             c.name as client_name, c.document as client_document, c.email as client_email, c.phone as client_phone, c.address as client_address, c.contact_person as client_contact, c.razao_social as client_razao_social,
             mm.name as machine_name, mm.photo_urls as machine_photos, mm.technical_description as machine_specs,
             r.code as rental_code, r.list_price as rental_list_price
      FROM rental_proposals rp
      LEFT JOIN clients c ON rp.client_id::text = c.id::text
      LEFT JOIN machine_models mm ON rp.machine_model_id = mm.id
      LEFT JOIN rental_prices r ON rp.rental_price_id = r.id
      WHERE rp.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada.' });
    }

    return res.status(200).json({ proposal: rows[0] });
  } catch (error) {
    console.error('Erro ao buscar detalhes da proposta:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar detalhes.' });
  }
}
