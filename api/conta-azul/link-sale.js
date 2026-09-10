import { Pool } from 'pg';
import { getContaAzulSaleDetails, getValidAccessToken, BASE_API_URL } from './conta-azul.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  const client = await pool.connect();

  try {
    // GET: Listar vendas recentes do Conta Azul para o usuário escolher e vincular
    if (req.method === 'GET') {
      const { invoiceId } = req.query;
      if (!invoiceId) {
        return res.status(400).json({ error: 'ID da fatura não informado.' });
      }

      const invRes = await client.query(`
        SELECT i.*, c.name as client_name, c.document as client_document
        FROM invoices i
        LEFT JOIN clients c ON i.client_id::text = c.id::text
        WHERE i.id = $1
      `, [invoiceId]);

      if (invRes.rows.length === 0) {
        return res.status(404).json({ error: 'Fatura não encontrada.' });
      }

      const inv = invRes.rows[0];
      const token = await getValidAccessToken();
      if (!token) {
        return res.status(401).json({ error: 'Conta Azul não conectado.' });
      }

      const listRes = await fetch(`${BASE_API_URL}/v1/sales?page=1&size=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!listRes.ok) {
        const errText = await listRes.text();
        return res.status(500).json({ error: 'Erro ao buscar vendas no Conta Azul: ' + errText });
      }

      const listData = await listRes.json();
      const rawSales = Array.isArray(listData) ? listData : (listData.content || listData.items || []);

      const invAmount = Number(inv.amount || 0);
      const invClientName = (inv.client_name || '').toLowerCase();
      const invDocClean = (inv.client_document || '').replace(/\D/g, '');

      // Formatar e classificar vendas por relevância para esta fatura
      const sales = rawSales.map(s => {
        const custName = (s.customer?.name || s.customer_name || '').toLowerCase();
        const total = Number(s.total || s.value || 0);
        
        let matchScore = 0;
        if (invClientName && custName && (custName.includes(invClientName) || invClientName.includes(custName))) {
          matchScore += 50;
        }
        if (Math.abs(total - invAmount) < 0.05) {
          matchScore += 40;
        }

        return {
          id: s.id,
          number: s.number,
          customerName: s.customer?.name || s.customer_name || 'Cliente',
          total: total,
          emission: s.emission,
          status: s.status,
          financialStatus: s.financial_status,
          matchScore
        };
      }).sort((a, b) => b.matchScore - a.matchScore);

      return res.status(200).json({
        success: true,
        invoice: inv,
        suggestedSales: sales.slice(0, 15)
      });
    }

    // POST: Vincular uma venda específica
    if (req.method === 'POST') {
      const { invoiceId, saleIdOrNumber } = req.body;
      if (!invoiceId || !saleIdOrNumber) {
        return res.status(400).json({ error: 'ID da fatura e Número/ID da venda são obrigatórios.' });
      }

      const cleanInput = String(saleIdOrNumber).trim().replace('#', '');
      const token = await getValidAccessToken();
      if (!token) {
        return res.status(401).json({ error: 'Conta Azul não autenticado.' });
      }

      // 1. Tentar buscar direto pelo ID informado
      let caSale = null;
      const directRes = await getContaAzulSaleDetails(cleanInput);
      if (directRes.success && directRes.sale) {
        caSale = directRes.sale;
      } else {
        // 2. Tentar achar na lista de vendas por número da venda ou por número de NF
        try {
          const listRes = await fetch(`${BASE_API_URL}/v1/sales?page=1&size=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (listRes.ok) {
            const listData = await listRes.json();
            const items = Array.isArray(listData) ? listData : (listData.content || listData.items || []);
            
            // Buscar por number ou id
            let found = items.find(s => String(s.number) === cleanInput || String(s.id) === cleanInput);
            
            // Se não achou por número da venda, pode ser que o usuário digitou o número da NF
            if (!found) {
              for (const item of items) {
                // Se o item tiver nfe/nfse detalhada
                if (item.nfe?.number === cleanInput || item.nfse?.number === cleanInput) {
                  found = item;
                  break;
                }
              }
            }

            if (found) {
              // Buscar detalhes completos da venda encontrada
              const fullDetails = await getContaAzulSaleDetails(found.id);
              caSale = (fullDetails.success && fullDetails.sale) ? fullDetails.sale : found;
            }
          }
        } catch (err) {
          console.warn('Aviso ao listar vendas para encontrar número:', err);
        }
      }

      const saleIdToSave = caSale ? String(caSale.id) : cleanInput;

      // 3. Atualizar a fatura no banco de dados com a venda vinculada
      let updateQuery = 'UPDATE invoices SET conta_azul_sale_id = $1';
      const params = [saleIdToSave];

      // Se a venda no Conta Azul já estiver quitada / paga
      if (caSale) {
        const rawStatus = (caSale.status || '').toUpperCase();
        const rawFinStatus = (caSale.financial_status || '').toUpperCase();
        const rawPayStatus = (caSale.payment_status || '').toUpperCase();
        
        const installments = Array.isArray(caSale.installments) ? caSale.installments : (Array.isArray(caSale.payment?.installments) ? caSale.payment.installments : []);
        const allInstallmentsPaid = installments.length > 0 && installments.every(inst => {
          const st = (inst.status || '').toUpperCase();
          return st === 'ACQUITTED' || st === 'PAID' || st === 'LIQUIDATED' || st === 'BAIXADO';
        });

        const isCaPaid = rawStatus === 'PAID' || rawStatus === 'ACQUITTED' || 
                         rawFinStatus === 'PAID' || rawFinStatus === 'ACQUITTED' ||
                         rawPayStatus === 'PAID' || rawPayStatus === 'ACQUITTED' ||
                         allInstallmentsPaid;

        if (isCaPaid) {
          let caPaymentDate = caSale.payment_date || (installments.length > 0 ? (installments[0].payment_date || installments[0].date) : null);
          if (caPaymentDate) caPaymentDate = caPaymentDate.split('T')[0];
          else caPaymentDate = new Date().toISOString().split('T')[0];

          updateQuery += ', status = $2, payment_date = COALESCE(payment_date, $3)';
          params.push('Paga', caPaymentDate);
        }
      }

      updateQuery += ` WHERE id = $${params.length + 1} RETURNING *;`;
      params.push(invoiceId);

      const result = await client.query(updateQuery, params);

      return res.status(200).json({
        success: true,
        invoice: result.rows[0],
        caSale
      });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro ao vincular venda do Conta Azul:', error);
    return res.status(500).json({ error: 'Erro interno: ' + error.message });
  } finally {
    client.release();
  }
}
