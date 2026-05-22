import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID não fornecido' });

  const client = await pool.connect();

  try {
    const contractRes = await client.query(`
      SELECT c.*, cl.name as client_name 
      FROM contracts c
      JOIN clients cl ON c.client_id = cl.id
      WHERE c.id = $1
    `, [id]);
    
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ error: 'Contrato não encontrado' });
    }
    const contract = contractRes.rows[0];

    const invoicesRes = await client.query(`
      SELECT * FROM invoices WHERE contract_code = $1 ORDER BY due_date DESC
    `, [contract.code]);

    const historyRes = await client.query(`
      SELECT * FROM contract_history WHERE contract_id = $1 ORDER BY created_at DESC
    `, [id]);

    return res.status(200).json({ 
      success: true, 
      contract, 
      invoices: invoicesRes.rows, 
      history: historyRes.rows 
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error);
    return res.status(500).json({ error: 'Erro interno' });
  } finally {
    client.release();
  }
}
