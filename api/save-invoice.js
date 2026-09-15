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
    const { 
      id, contract_code, client_id, description, amount, due_date, payment_date, status,
      payment_method, installment_number, invoice_type, conta_azul_sale_id
    } = req.body;
    
    if (!client_id || !description || !amount || !due_date) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }

    await client.query(`
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(50);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS installment_number VARCHAR(50);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS conta_azul_sale_id VARCHAR(100);
    `);

    let result;

    if (id) {
      result = await client.query(`
        UPDATE invoices 
        SET contract_code = $1, client_id = $2, description = $3, amount = $4, due_date = $5, payment_date = $6, status = $7,
            payment_method = $8, installment_number = $9, invoice_type = $10, conta_azul_sale_id = $11
        WHERE id = $12
        RETURNING *;
      `, [
        contract_code, client_id, description, amount, due_date, payment_date, status || 'Pendente',
        payment_method || 'Boleto', installment_number || null, invoice_type || 'locacao', conta_azul_sale_id || null,
        id
      ]);
    } else {
      result = await client.query(`
        INSERT INTO invoices (
          contract_code, client_id, description, amount, due_date, payment_date, status,
          payment_method, installment_number, invoice_type, conta_azul_sale_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `, [
        contract_code, client_id, description, amount, due_date, payment_date, status || 'Pendente',
        payment_method || 'Boleto', installment_number || null, invoice_type || 'locacao', conta_azul_sale_id || null
      ]);

      // Se informou parcela e tem contract_code, atualiza a current_installment do contrato
      if (contract_code && installment_number) {
        const instNum = parseInt(installment_number.split('/')[0]);
        if (!isNaN(instNum)) {
          await client.query(`
            UPDATE contracts 
            SET current_installment = GREATEST(COALESCE(current_installment, 0), $1)
            WHERE code = $2
          `, [instNum, contract_code]);
        }
      }
    }
    
    return res.status(200).json({ success: true, invoice: result.rows[0] });
  } catch (error) {
    console.error('Erro ao salvar fatura:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar fatura' });
  } finally {
    client.release();
  }
}
