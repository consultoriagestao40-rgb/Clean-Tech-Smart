import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = await pool.connect();

  try {
    // 1. Obter configurações de Z-API e destinatários do financeiro
    const sRes = await client.query('SELECT key, value FROM system_settings');
    const settings = {};
    for (const r of sRes.rows) {
      settings[r.key] = r.value;
    }

    const instanceId = settings.app_zapi_instance_id;
    const token = settings.app_zapi_token;
    const clientToken = settings.app_zapi_client_token;

    if (!instanceId || !token) {
      return res.status(400).json({ 
        success: false, 
        error: 'Instância ou Token Z-API não configurados em Configurações.' 
      });
    }

    // Verificar se já enviou hoje (a menos que seja forçado via body/query)
    const forceSend = req.body?.force === true || req.query?.force === 'true';
    const todayStr = new Date().toISOString().split('T')[0];

    if (!forceSend && settings.last_billing_whatsapp_date === todayStr) {
      return res.status(200).json({ 
        success: true, 
        skipped: true, 
        message: 'Aviso diário já foi enviado hoje para o financeiro.' 
      });
    }

    // 2. Destinatários do financeiro
    let rawRecipients = settings.app_notification_financial_recipients || settings.app_zapi_ticket_group_id || '5541984042835';
    let recipientsList = [];
    try {
      if (typeof rawRecipients === 'string' && rawRecipients.startsWith('[')) {
        recipientsList = JSON.parse(rawRecipients);
      } else {
        recipientsList = String(rawRecipients).split(/[,;\n]/).map(r => r.trim()).filter(Boolean);
      }
    } catch {
      recipientsList = String(rawRecipients).split(/[,;\n]/).map(r => r.trim()).filter(Boolean);
    }

    if (recipientsList.length === 0) {
      recipientsList = ['5541984042835'];
    }

    // 3. Buscar contratos ativos e faturas do mês corrente
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    const compStr = `${String(currentMonth).padStart(2, '0')}/${currentYear}`;

    const contractsRes = await client.query(`
      SELECT c.*, cl.name as client_name, cl.phone as client_phone
      FROM contracts c
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.status = 'Ativo'
      ORDER BY c.billing_day ASC, c.id ASC;
    `);

    const invoicesRes = await client.query(`
      SELECT * FROM invoices 
      WHERE (due_date >= $1 OR created_at >= $1)
    `, [`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`]);

    const invoices = invoicesRes.rows;

    // 4. Identificar contratos com faturamento pendente ou não baixado
    const pendingContracts = [];
    for (const ctr of contractsRes.rows) {
      const ctrInvoices = invoices.filter(i => i.contract_code === ctr.code);
      const isPaid = ctrInvoices.some(i => i.status === 'Paga');
      const isEmitted = ctrInvoices.length > 0;

      if (!isPaid) {
        pendingContracts.push({
          ...ctr,
          isEmitted,
          emittedStatus: isEmitted ? ctrInvoices[0].status : 'Não emitida'
        });
      }
    }

    if (pendingContracts.length === 0) {
      return res.status(200).json({ 
        success: true, 
        count: 0, 
        message: 'Nenhum contrato pendente de faturamento ou baixa hoje.' 
      });
    }

    // 5. Montar mensagem organizada e profissional para o WhatsApp do Financeiro
    const formattedDate = now.toLocaleDateString('pt-BR');
    let message = `*🔔 ALERTA DE FATURAMENTO DIÁRIO - FINANCEIRO* 💰📅\n`;
    message += `*Data:* ${formattedDate} | *Competência:* ${compStr}\n\n`;
    message += `Atenção, time financeiro! Constam contratos de locação aguardando emissão ou baixa no sistema:\n\n`;

    let totalPendingVal = 0;
    pendingContracts.forEach((c, idx) => {
      const val = parseFloat(c.total_rental_value || 0);
      totalPendingVal += val;
      const bDay = c.billing_day || 1;
      const dDay = c.due_day || 15;
      const isLate = currentDay > bDay;
      const isToday = currentDay === bDay;
      const timeTag = isToday ? '🔴 FATURAR HOJE' : isLate ? `⚠️ ATRASADO (Dia ${bDay})` : `Dia ${bDay}`;

      message += `${idx + 1}. *${c.code}* - ${c.client_name || 'Cliente'}\n`;
      message += `   💵 *Valor:* R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
      message += `   📅 *Faturamento:* ${timeTag} | *Vencimento:* Dia ${dDay}\n`;
      message += `   🧾 *Parcela:* ${c.current_installment || 1}/${c.total_installments || 12} (${c.payment_method || 'Boleto'})\n`;
      message += `   📌 *Status:* ${c.emittedStatus === 'Não emitida' ? '⚠️ Fatura Não Emitida' : `Fatura Emitida (${c.emittedStatus})`}\n\n`;
    });

    message += `📊 *Total Recorrente Pendente:* R$ ${totalPendingVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
    message += `⚠️ *Aviso do Sistema:* Esta mensagem é enviada diariamente para acompanhamento até que as faturas sejam emitidas e baixadas no sistema.\n`;
    message += `_Clean Tech Smart - Gestão de Contratos_`;

    // 6. Enviar via Z-API para cada destinatário do financeiro
    const zapiHeaders = { 'Content-Type': 'application/json' };
    if (clientToken) zapiHeaders['Client-Token'] = clientToken;

    const results = [];
    for (const item of recipientsList) {
      let target = String(item).trim();
      if (!target) continue;

      if (!target.includes('-group') && !target.includes('@')) {
        target = target.replace(/\D/g, '');
        if (target.length === 10 || target.length === 11) {
          target = '55' + target;
        }
      }

      try {
        const sendRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify({
            phone: target,
            message
          })
        });

        const sendData = await sendRes.text();
        results.push({ recipient: target, success: sendRes.ok, response: sendData });
      } catch (sendErr) {
        results.push({ recipient: target, success: false, error: sendErr.message });
      }
    }

    // 7. Atualizar a data do último envio diário
    await client.query(`
      INSERT INTO system_settings (key, value) VALUES ('last_billing_whatsapp_date', $1)
      ON CONFLICT (key) DO UPDATE SET value = $1;
    `, [todayStr]);

    return res.status(200).json({ 
      success: true, 
      count: pendingContracts.length, 
      total: totalPendingVal,
      results 
    });

  } catch (error) {
    console.error('Erro ao enviar alertas de faturamento:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
}
