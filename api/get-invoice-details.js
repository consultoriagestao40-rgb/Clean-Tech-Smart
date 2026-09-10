import { Pool } from 'pg';
import { getContaAzulSaleDetails } from './conta-azul/conta-azul.js';

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
  if (!id) {
    return res.status(400).json({ error: 'ID da fatura não informado.' });
  }

  const client = await pool.connect();

  try {
    // 1. Buscar dados da fatura e do cliente
    const invRes = await client.query(`
      SELECT 
        i.*,
        c.name as client_name,
        c.document as client_document,
        c.email as client_email,
        c.phone as client_phone,
        c.address as client_address
      FROM invoices i
      LEFT JOIN clients c ON i.client_id::text = c.id::text
      WHERE i.id = $1;
    `, [id]);

    if (invRes.rows.length === 0) {
      return res.status(404).json({ error: 'Fatura não encontrada.' });
    }

    const invoice = invRes.rows[0];

    // 2. Buscar dados do orçamento caso a fatura tenha vindo de um orçamento
    let budget = null;
    let equipment = null;
    let laborItems = [];
    let partsItems = [];

    if (invoice.budget_id) {
      const budgetRes = await client.query(`
        SELECT b.*,
               e.name as equipment_name, e.brand as equipment_brand, e.model as equipment_model, e.serial_number as equipment_serial_number,
               m.name as machine_model_name
        FROM budgets b
        LEFT JOIN equipments e ON b.equipment_id = e.id
        LEFT JOIN machine_models m ON b.machine_model_id = m.id
        WHERE b.id = $1
      `, [invoice.budget_id]);

      if (budgetRes.rows.length > 0) {
        budget = budgetRes.rows[0];
        equipment = {
          name: budget.equipment_name || budget.machine_model_name || 'Equipamento',
          brand: budget.equipment_brand || '',
          model: budget.equipment_model || '',
          serialNumber: budget.equipment_serial_number || 'S/N'
        };

        const laborRes = await client.query('SELECT * FROM budget_labor WHERE budget_id = $1 ORDER BY id ASC', [invoice.budget_id]);
        laborItems = laborRes.rows;

        const partsRes = await client.query('SELECT * FROM budget_parts WHERE budget_id = $1 ORDER BY id ASC', [invoice.budget_id]);
        partsItems = partsRes.rows;
      }
    }

    // 3. Processar itens fiscais salvos na fatura (se houver)
    let parsedNcmInfo = [];
    if (invoice.ncm_info) {
      try {
        parsedNcmInfo = JSON.parse(invoice.ncm_info);
      } catch (e) {
        console.warn('Erro ao fazer parse de ncm_info:', e);
      }
    }

    // 4. Buscar dados em tempo real do Conta Azul (se houver venda vinculada)
    let contaAzulInfo = null;
    if (invoice.conta_azul_sale_id) {
      try {
        const caResult = await getContaAzulSaleDetails(invoice.conta_azul_sale_id);
        if (caResult.success && caResult.sale) {
          const s = caResult.sale;
          
          // Mapeamento de status da Nota Fiscal
          let nfStatus = 'Não emitida';
          let nfNumber = s.nfe?.number || s.nfse?.number || s.invoice_number || null;
          let nfUrl = s.nfe?.pdf_url || s.nfse?.pdf_url || s.invoice_pdf_url || null;
          
          if (s.nfe?.status || s.nfse?.status) {
            const rawStatus = (s.nfe?.status || s.nfse?.status || '').toUpperCase();
            if (rawStatus.includes('AUTHORIZED') || rawStatus.includes('EMITTED') || rawStatus.includes('EMITIDA')) {
              nfStatus = 'Emitida / Autorizada';
            } else if (rawStatus.includes('REQUESTED') || rawStatus.includes('PROCESSING') || rawStatus.includes('SOLICITADA')) {
              nfStatus = 'Solicitada';
            } else if (rawStatus.includes('CANCELLED') || rawStatus.includes('CANCELADA')) {
              nfStatus = 'Cancelada';
            } else {
              nfStatus = rawStatus;
            }
          }

          // Se no Conta Azul a venda foi quitada/paga e aqui ainda está pendente, sincroniza
          const isCaPaid = s.status === 'PAID' || s.financial_status === 'PAID' || s.payment_status === 'PAID';
          if (isCaPaid && invoice.status !== 'Paga') {
            await client.query(`
              UPDATE invoices 
              SET status = 'Paga', payment_date = COALESCE(payment_date, CURRENT_DATE) 
              WHERE id = $1
            `, [invoice.id]);
            invoice.status = 'Paga';
            invoice.payment_date = new Date().toISOString().split('T')[0];
          }

          contaAzulInfo = {
            saleId: s.id || invoice.conta_azul_sale_id,
            saleNumber: s.number || invoice.conta_azul_sale_id,
            saleStatus: s.status || 'COMMITTED',
            nfNumber: nfNumber,
            nfStatus: nfStatus,
            nfUrl: nfUrl,
            emissionDate: s.emission || null,
            totalValue: s.total || invoice.amount
          };
        }
      } catch (caErr) {
        console.warn('Não foi possível obter dados do Conta Azul para a fatura:', caErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      invoice,
      client: {
        id: invoice.client_id,
        name: invoice.client_name,
        document: invoice.client_document,
        email: invoice.client_email,
        phone: invoice.client_phone,
        address: invoice.client_address
      },
      budget,
      equipment,
      laborItems,
      partsItems,
      parsedNcmInfo,
      contaAzulInfo
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da fatura:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar detalhes da fatura: ' + error.message });
  } finally {
    client.release();
  }
}
