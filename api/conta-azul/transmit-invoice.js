import { Pool } from 'pg';
import { findOrCreateContaAzulCustomer, createContaAzulSale } from './conta-azul.js';

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

  const { invoiceId } = req.body;
  if (!invoiceId) {
    return res.status(400).json({ error: 'ID da fatura não informado.' });
  }

  const client = await pool.connect();

  try {
    const invRes = await client.query(`
      SELECT i.*, 
             c.name as client_name, c.document as client_document, c.email as client_email, c.phone as client_phone
      FROM invoices i
      LEFT JOIN clients c ON i.client_id::text = c.id::text
      WHERE i.id = $1
    `, [invoiceId]);

    if (invRes.rows.length === 0) {
      return res.status(404).json({ error: 'Fatura não encontrada.' });
    }

    const inv = invRes.rows[0];

    // 1. Obter ou cadastrar cliente no Conta Azul
    const customerId = await findOrCreateContaAzulCustomer({
      name: inv.client_name,
      document: inv.client_document,
      email: inv.client_email,
      phone: inv.client_phone
    });

    // 2. Preparar payload de venda
    let partsList = [];
    if (inv.ncm_info) {
      try {
        partsList = JSON.parse(inv.ncm_info);
      } catch {}
    }

    const dueDate = inv.due_date ? new Date(inv.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const amount = Number(inv.amount || 0);

    const salePayload = {
      customer_id: customerId,
      emission: new Date().toISOString().split('T')[0],
      status: 'COMMITTED',
      notes: `Fatura #${inv.id} Clean Tech Smart${inv.budget_id ? ` (ref. Orçamento #${inv.budget_id})` : ''}`,
      payment: {
        type: 'BILL',
        installments: [
          {
            number: 1,
            value: amount,
            due_date: dueDate
          }
        ]
      }
    };

    if (inv.invoice_type === 'pecas' && partsList.length > 0) {
      salePayload.products = partsList.map(p => ({
        description: p.partName || p.part_name,
        quantity: Number(p.quantity || 1),
        value: Number(p.unitPrice || p.unit_price || 0),
        ncm: p.ncm ? String(p.ncm).replace(/\D/g, '') : undefined,
        cfop: p.cfop || '5102',
        simples_credit: !!p.simplesCredit
      }));
    } else {
      salePayload.services = [
        {
          description: inv.description,
          quantity: 1,
          value: amount
        }
      ];
    }

    // 3. Criar venda no Conta Azul
    const saleResult = await createContaAzulSale(salePayload);
    if (!saleResult.success || !saleResult.data?.id) {
      return res.status(400).json({ error: 'Erro ao criar venda no Conta Azul: ' + (saleResult.error || 'Falha') });
    }

    const saleId = String(saleResult.data.id);

    // 4. Salvar venda na fatura
    await client.query('UPDATE invoices SET conta_azul_sale_id = $1 WHERE id = $2', [saleId, invoiceId]);

    return res.status(200).json({
      success: true,
      saleId,
      saleData: saleResult.data
    });
  } catch (error) {
    console.error('Erro ao transmitir fatura:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
