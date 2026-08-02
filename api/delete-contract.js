import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID não fornecido' });

  const client = await pool.connect();

  try {
    // Delete contract history first
    await client.query('DELETE FROM contract_history WHERE contract_id = $1', [id]);
    
    // Delete invoices linked to this contract code
    const contractRes = await client.query('SELECT code FROM contracts WHERE id = $1', [id]);
    if (contractRes.rows.length > 0) {
      const code = contractRes.rows[0].code;
      await client.query('DELETE FROM invoices WHERE contract_code = $1', [code]);
    }

    // Delete the contract itself
    await client.query('DELETE FROM contracts WHERE id = $1', [id]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir contrato:', error);
    return res.status(500).json({ error: 'Erro interno ao excluir contrato' });
  } finally {
    client.release();
  }
}
