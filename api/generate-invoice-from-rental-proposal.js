import { Pool } from 'pg';
import { getValidAccessToken, findOrCreateContaAzulCustomer, createContaAzulSale } from './conta-azul/conta-azul.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

function formatPeriodLabel(months) {
  const m = Number(months);
  if (m === 1) return 'Diária (1 dia)';
  if (m === 7) return 'Semanal (7 dias)';
  if (m === 15) return 'Quinzenal (15 dias)';
  if (m === 30) return 'Mensal Avulso (01 mês)';
  if (m === 12) return '12 Meses';
  return `${m} Meses`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const {
    proposalId,
    dueDate,
    amount,
    description,
    sendToContaAzul,
    clientData
  } = req.body;

  if (!proposalId) {
    return res.status(400).json({ error: 'ID da proposta de locação é obrigatório.' });
  }

  if (!dueDate) {
    return res.status(400).json({ error: 'Data de vencimento é obrigatória.' });
  }

  const client = await pool.connect();

  try {
    // 1. Garantir que as colunas existem nas tabelas
    await client.query(`
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS rental_proposal_id INT;
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(50);
      ALTER TABLE invoices ADD COLUMN IF NOT EXISTS conta_azul_sale_id VARCHAR(100);
      ALTER TABLE rental_proposals ADD COLUMN IF NOT EXISTS invoice_id INT;
      ALTER TABLE rental_proposals ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMP;
    `);

    // 2. Buscar proposta de locação e dados do cliente
    const propRes = await client.query(`
      SELECT rp.*, 
             c.name as client_name, 
             c.document as client_document, 
             c.email as client_email, 
             c.phone as client_phone,
             c.address as client_address,
             c.city as client_city,
             c.state as client_state,
             c.zip_code as client_zip_code,
             mm.name as machine_name,
             eq.name as equipment_name,
             eq.serial_number as equipment_serial
      FROM rental_proposals rp
      LEFT JOIN clients c ON rp.client_id::text = c.id::text
      LEFT JOIN machine_models mm ON rp.machine_model_id = mm.id
      LEFT JOIN equipments eq ON rp.equipment_id = eq.id
      WHERE rp.id = $1
    `, [proposalId]);

    if (propRes.rows.length === 0) {
      return res.status(404).json({ error: 'Proposta de locação não encontrada.' });
    }

    const proposal = propRes.rows[0];

    const resolvedClient = {
      id: clientData?.id || proposal.client_id,
      name: clientData?.name || proposal.client_name || 'Cliente Sem Nome',
      document: clientData?.document || proposal.client_document || '',
      email: clientData?.email || proposal.client_email || '',
      phone: clientData?.phone || proposal.client_phone || '',
      address: proposal.client_address || '',
      city: proposal.client_city || '',
      state: proposal.client_state || '',
      zip_code: proposal.client_zip_code || ''
    };

    const finalAmount = parseFloat(amount || proposal.monthly_value || 0);
    if (finalAmount <= 0) {
      return res.status(400).json({ error: 'O valor da locação deve ser maior que zero.' });
    }

    const periodLabel = formatPeriodLabel(proposal.period_months);
    const machineDesc = proposal.equipment_name 
      ? `${proposal.machine_name || 'Equipamento'} (Ativo: ${proposal.equipment_name}${proposal.equipment_serial ? ' - S/N: ' + proposal.equipment_serial : ''})`
      : (proposal.machine_name || 'Equipamento de Locação');

    const finalDescription = description || `Locação: ${machineDesc} - Período: ${periodLabel} (Ref. Proposta #${proposalId})`;

    let caSaleId = null;
    let contaAzulError = null;

    // 3. Se solicitado envio ao Conta Azul
    if (sendToContaAzul) {
      try {
        const token = await getValidAccessToken();
        if (token) {
          const contaAzulCustomerId = await findOrCreateContaAzulCustomer(resolvedClient);
          
          if (contaAzulCustomerId) {
            const salePayload = {
              customer_id: contaAzulCustomerId,
              emission: new Date().toISOString().split('T')[0],
              status: 'COMMITTED',
              notes: `Locação ref. Proposta de Locação #${proposalId} - Clean Tech Smart`,
              services: [
                {
                  description: `Locação de Equipamento - ${machineDesc} (${periodLabel})`,
                  quantity: 1,
                  value: finalAmount
                }
              ],
              payment: {
                type: 'BILL',
                installments: [
                  {
                    number: 1,
                    value: finalAmount,
                    due_date: dueDate
                  }
                ]
              }
            };

            const saleResult = await createContaAzulSale(salePayload);
            if (saleResult.success && saleResult.data?.id) {
              caSaleId = String(saleResult.data.id);
            } else {
              contaAzulError = saleResult.error || 'Falha ao criar venda no Conta Azul';
            }
          } else {
            contaAzulError = 'Não foi possível vincular o cliente no Conta Azul';
          }
        } else {
          contaAzulError = 'Conta Azul não conectado ou autenticação expirada';
        }
      } catch (caErr) {
        console.warn('Erro ao integrar proposta de locação no Conta Azul:', caErr);
        contaAzulError = caErr.message;
      }
    }

    // 4. Inserir fatura na tabela invoices
    const initialStatus = caSaleId ? 'Faturada' : 'Pendente';
    const invRes = await client.query(`
      INSERT INTO invoices (
        contract_code, client_id, description, amount, due_date, status, invoice_type, rental_proposal_id, conta_azul_sale_id
      ) VALUES ($1, $2, $3, $4, $5, $6, 'locacao', $7, $8)
      RETURNING *;
    `, [
      `LOC-${proposalId}`,
      resolvedClient.id,
      finalDescription,
      finalAmount,
      dueDate,
      initialStatus,
      proposalId,
      caSaleId
    ]);

    const createdInvoice = invRes.rows[0];

    // 5. Vincular fatura na proposta de locação
    await client.query(`
      UPDATE rental_proposals
      SET invoice_id = $1, invoiced_at = NOW()
      WHERE id = $2
    `, [createdInvoice.id, proposalId]);

    return res.status(200).json({
      success: true,
      invoice: createdInvoice,
      contaAzulSaleId: caSaleId,
      contaAzulError: contaAzulError
    });
  } catch (error) {
    console.error('Erro ao gerar fatura de locação:', error);
    return res.status(500).json({ error: 'Erro interno ao gerar fatura: ' + error.message });
  } finally {
    client.release();
  }
}
