import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const client = await pool.connect();

  try {
    const { id, contract_code, client_id, description, amount, due_date, payment_date, status } = req.body;
    
    if (!client_id || !description || !amount || !due_date) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    let result;

    if (id) {
      result = await client.query(`
        UPDATE invoices 
        SET contract_code = $1, client_id = $2, description = $3, amount = $4, due_date = $5, payment_date = $6, status = $7
        WHERE id = $8
        RETURNING *;
      `, [contract_code, client_id, description, amount, due_date, payment_date, status || 'Pendente', id]);
    } else {
      result = await client.query(`
        INSERT INTO invoices (contract_code, client_id, description, amount, due_date, payment_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `, [contract_code, client_id, description, amount, due_date, payment_date, status || 'Pendente']);
    }
    
    return res.status(200).json({ success: true, invoice: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar fatura:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar fatura' });
  } finally {
    client.release();
  }
}
