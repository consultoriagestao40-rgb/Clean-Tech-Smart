import { Pool } from 'pg';
import { getValidAccessToken, findOrCreateContaAzulCustomer, createContaAzulSale } from './conta-azul/conta-azul.js';

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

  const {
    budgetId,
    dueDate,
    clientData,
    services,
    parts,
    sendToContaAzul
  } = req.body;

  if (!budgetId) {
    return res.status(400).json({ error: 'ID do orçamento é obrigatório.' });
  }

  if (!dueDate) {
    return res.status(400).json({ error: 'Data de vencimento é obrigatória.' });
  }

  const client = await pool.connect();

  try {
    // 1. Garantir que as colunas adicionais existem na tabela invoices
    await client.query(`
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS budget_id INT;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(50);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS conta_azul_sale_id VARCHAR(100);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ncm_info TEXT;
    `);

    // 2. Verificar orçamento no banco
    const budgetRes = await client.query(`
      SELECT b.*, c.name as client_name, c.document as client_document, c.email as client_email, c.phone as client_phone
      FROM budgets b
      LEFT JOIN clients c ON b.client_id::text = c.id::text
      WHERE b.id = $1
    `, [budgetId]);
    if (budgetRes.rows.length === 0) {
      return res.status(404).json({ error: 'Orçamento não encontrado.' });
    }

    const budget = budgetRes.rows[0];
    if (budget.status !== 'Aprovado') {
      return res.status(400).json({ error: 'Apenas orçamentos com status Aprovado podem gerar faturas.' });
    }

    const resolvedClient = {
      id: clientData?.id || budget.client_id,
      name: clientData?.name || budget.client_name,
      document: clientData?.document || budget.client_document,
      email: clientData?.email || budget.client_email,
      phone: clientData?.phone || budget.client_phone
    };

    const createdInvoices = [];
    const contaAzulSales = [];
    let contaAzulCustomerId = null;
    let contaAzulError = null;

    // 3. Se solicitado envio ao Conta Azul, verificar token e cliente
    if (sendToContaAzul) {
      try {
        const token = await getValidAccessToken();
        if (token) {
          contaAzulCustomerId = await findOrCreateContaAzulCustomer(resolvedClient);
        }
      } catch (caErr) {
        console.warn('Aviso: Conta Azul não pode preparar cliente:', caErr.message);
        contaAzulError = caErr.message;
      }
    }

    // 4. Criar Fatura de Serviços (se valor > 0)
    const servicesAmount = Number(services?.amount || 0);
    if (servicesAmount > 0) {
      const serviceDesc = services?.description || `Serviço de manutenção ref. Orçamento #${budgetId}`;
      let caSaleId = null;

      // Integração Conta Azul para Serviços
      if (sendToContaAzul && contaAzulCustomerId) {
        try {
          const salePayload = {
            customer_id: contaAzulCustomerId,
            emission: new Date().toISOString().split('T')[0],
            status: 'COMMITTED',
            notes: `Fatura de Serviços gerada a partir do Orçamento #${budgetId} do Clean Tech Smart`,
            services: [
              {
                description: serviceDesc,
                quantity: 1,
                value: servicesAmount
              }
            ],
            payment: {
              type: 'BILL',
              installments: [
                {
                  number: 1,
                  value: servicesAmount,
                  due_date: dueDate
                }
              ]
            }
          };

          const saleResult = await createContaAzulSale(salePayload);
          if (saleResult.success && saleResult.data?.id) {
            caSaleId = String(saleResult.data.id);
            contaAzulSales.push({ type: 'services', id: caSaleId });
          }
        } catch (err) {
          console.error('Erro ao criar venda de serviços no Conta Azul:', err);
        }
      }

      // Salvar na tabela invoices
      const initialStatus = caSaleId ? 'Faturada' : 'Pendente';
      const invRes = await client.query(`
        INSERT INTO invoices (
          contract_code, client_id, description, amount, due_date, status, budget_id, invoice_type, conta_azul_sale_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'servicos', $8)
        RETURNING *;
      `, [
        `ORC-${budgetId}-SERV`,
        resolvedClient.id,
        serviceDesc,
        servicesAmount,
        dueDate,
        initialStatus,
        budgetId,
        caSaleId
      ]);

      createdInvoices.push(invRes.rows[0]);
    }

    // 5. Criar Fatura de Peças (se valor > 0)
    const partsAmount = Number(parts?.total || 0);
    const partsList = Array.isArray(parts?.items) ? parts.items : [];

    if (partsAmount > 0 && partsList.length > 0) {
      const partsSummary = partsList.map(p => `${p.quantity}x ${p.partName} (NCM: ${p.ncm || 'N/A'}, CFOP: ${p.cfop || '5102'})`).join('; ');
      const partsDesc = `Orçamento #${budgetId} - Peças de reposição: ${partsSummary}`;
      let caSaleId = null;

      // Integração Conta Azul para Peças / Produtos
      if (sendToContaAzul && contaAzulCustomerId) {
        try {
          const salePayload = {
            customer_id: contaAzulCustomerId,
            emission: new Date().toISOString().split('T')[0],
            status: 'COMMITTED',
            notes: `Fatura de Peças gerada a partir do Orçamento #${budgetId} do Clean Tech Smart`,
            products: partsList.map(item => ({
              description: item.partName,
              quantity: Number(item.quantity || 1),
              value: Number(item.unitPrice || 0),
              ncm: item.ncm ? String(item.ncm).replace(/\D/g, '') : undefined,
              cfop: item.cfop || '5102',
              simples_credit: !!item.simplesCredit
            })),
            payment: {
              type: 'BILL',
              installments: [
                {
                  number: 1,
                  value: partsAmount,
                  due_date: dueDate
                }
              ]
            }
          };

          const saleResult = await createContaAzulSale(salePayload);
          if (saleResult.success && saleResult.data?.id) {
            caSaleId = String(saleResult.data.id);
            contaAzulSales.push({ type: 'parts', id: caSaleId });
          }
        } catch (err) {
          console.error('Erro ao criar venda de peças no Conta Azul:', err);
        }
      }

      // Salvar na tabela invoices
      const initialStatusParts = caSaleId ? 'Faturada' : 'Pendente';
      const invRes = await client.query(`
        INSERT INTO invoices (
          contract_code, client_id, description, amount, due_date, status, budget_id, invoice_type, conta_azul_sale_id, ncm_info
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pecas', $8, $9)
        RETURNING *;
      `, [
        `ORC-${budgetId}-PECA`,
        resolvedClient.id,
        `Orçamento #${budgetId} - Venda de Peças (${partsList.length} itens)`,
        partsAmount,
        dueDate,
        initialStatusParts,
        budgetId,
        caSaleId,
        JSON.stringify(partsList)
      ]);

      createdInvoices.push(invRes.rows[0]);
    }

    return res.status(200).json({
      success: true,
      invoices: createdInvoices,
      contaAzulSales,
      contaAzulError
    });
  } catch (error) {
    console.error('Erro ao gerar fatura do orçamento:', error);
    return res.status(500).json({ error: 'Erro interno ao gerar fatura: ' + error.message });
  } finally {
    client.release();
  }
}
