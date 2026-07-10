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
    const { id, name, document, email, phone, status, contact_person, address, razao_social } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'O nome do cliente é obrigatório.' });
    }

    let result;

    if (id) {
      // Atualizar cliente existente
      result = await client.query(`
        UPDATE clients 
        SET name = $1, document = $2, email = $3, phone = $4, status = $5, contact_person = $6, address = $7, razao_social = $8
        WHERE id = $9
        RETURNING *;
      `, [name, document, email, phone, status || 'Ativo', contact_person, address, razao_social, id]);
    } else {
      // Inserir novo cliente
      result = await client.query(`
        INSERT INTO clients (name, document, email, phone, status, contact_person, address, razao_social)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `, [name, document, email, phone, status || 'Ativo', contact_person, address, razao_social]);
    }
    
    return res.status(200).json({ success: true, client: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar cliente:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar cliente' });
  } finally {
    client.release();
  }
}
