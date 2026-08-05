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
    return res.status(400).json({ error: 'ID da proposta não fornecido.' });
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
        c.address as client_address
      FROM service_proposals p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proposta de serviço não encontrada.' });
    }

    return res.status(200).json({ proposal: rows[0] });
  } catch (error) {
    console.error('Erro ao buscar detalhes da proposta de serviço:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar detalhes.' });
  }
}
