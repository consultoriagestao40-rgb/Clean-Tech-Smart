import { Pool } from 'pg';
import { getContaAzulSaleDetails } from './conta-azul.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const client = await pool.connect();

  try {
    // 1. Garantir que as colunas existem na tabela invoices
    await client.query(`
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS budget_id INT;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(50);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS conta_azul_sale_id VARCHAR(100);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ncm_info TEXT;
    `);

    // 2. Buscar faturas que ainda estão pendentes/vencidas e possuem venda no Conta Azul
    const pendingRes = await client.query(`
      SELECT id, conta_azul_sale_id, status 
      FROM invoices 
      WHERE conta_azul_sale_id IS NOT NULL 
        AND status != 'Paga';
    `);

    const invoicesToCheck = pendingRes.rows;
    let updatedCount = 0;

    for (const inv of invoicesToCheck) {
      try {
        const caResult = await getContaAzulSaleDetails(inv.conta_azul_sale_id);
        if (caResult.success && caResult.sale) {
          const s = caResult.sale;

          const rawStatus = (s.status || '').toUpperCase();
          const rawFinStatus = (s.financial_status || '').toUpperCase();
          const rawPayStatus = (s.payment_status || '').toUpperCase();

          const installments = Array.isArray(s.installments) ? s.installments : (Array.isArray(s.payment?.installments) ? s.payment.installments : []);
          const allInstallmentsPaid = installments.length > 0 && installments.every(inst => {
            const st = (inst.status || '').toUpperCase();
            return st === 'ACQUITTED' || st === 'PAID' || st === 'LIQUIDATED' || st === 'BAIXADO';
          });

          const isPaid = rawStatus === 'PAID' || rawStatus === 'ACQUITTED' ||
                        rawFinStatus === 'PAID' || rawFinStatus === 'ACQUITTED' ||
                        rawPayStatus === 'PAID' || rawPayStatus === 'ACQUITTED' ||
                        allInstallmentsPaid;

          if (isPaid) {
            let caPaymentDate = s.payment_date || (installments.length > 0 ? (installments[0].payment_date || installments[0].date) : null);
            if (caPaymentDate) {
              caPaymentDate = caPaymentDate.split('T')[0];
            } else {
              caPaymentDate = new Date().toISOString().split('T')[0];
            }

            await client.query(`
              UPDATE invoices 
              SET status = 'Paga', payment_date = $1 
              WHERE id = $2
            `, [caPaymentDate, inv.id]);

            updatedCount++;
          }
        }
      } catch (err) {
        console.warn(`Erro ao verificar venda ${inv.conta_azul_sale_id} no Conta Azul:`, err.message);
      }
    }

    return res.status(200).json({
      success: true,
      totalChecked: invoicesToCheck.length,
      updatedCount
    });
  } catch (error) {
    console.error('Erro na sincronização em lote com o Conta Azul:', error);
    return res.status(500).json({ error: 'Erro interno ao sincronizar faturas: ' + error.message });
  } finally {
    client.release();
  }
}
