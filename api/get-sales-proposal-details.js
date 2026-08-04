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
    return res.status(400).json({ error: 'ID da proposta é obrigatório.' });
  }

  try {
    const { rows } = await pool.query(`
      SELECT 
        p.*,
        c.name as client_name,
        c.cnpj_cpf as client_cnpj,
        c.contact_name as client_contact,
        c.email as client_email,
        c.phone as client_phone,
        c.address as client_address,
        m.name as machine_name,
        m.image_url as machine_image,
        m.description as machine_description,
        m.specs as machine_specs
      FROM sales_proposals p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN machine_models m ON p.machine_model_id = m.id
      WHERE p.id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada.' });
    }

    return res.status(200).json({ proposal: rows[0] });
  } catch (error) {
    console.error('Erro ao buscar detalhes da proposta de venda:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar detalhes da proposta.' });
  }
}
