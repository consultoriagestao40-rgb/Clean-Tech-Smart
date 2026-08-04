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

  try {
    const { rows } = await pool.query(`
      SELECT 
        p.*,
        c.name as client_name,
        c.razao_social as client_razao_social,
        c.document as client_cnpj,
        c.contact_person as client_contact,
        c.email as client_email,
        c.phone as client_phone,
        c.address as client_address,
        m.name as machine_name,
        m.photo_urls as machine_image,
        m.technical_description as machine_description
      FROM sales_proposals p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN machine_models m ON p.machine_model_id = m.id
      ORDER BY p.created_at DESC
    `);
    return res.status(200).json({ proposals: rows });
  } catch (error) {
    console.error('Erro ao buscar propostas de venda:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar propostas de venda.' });
  }
}
