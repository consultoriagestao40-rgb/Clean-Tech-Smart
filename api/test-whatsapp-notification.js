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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const client = await pool.connect();
  try {
    const sRes = await client.query('SELECT key, value FROM system_settings');
    const settings = {};
    for (const r of sRes.rows) {
      settings[r.key] = r.value;
    }

    const instanceId = settings.app_zapi_instance_id;
    const token = settings.app_zapi_token;
    const clientToken = settings.app_zapi_client_token;

    if (!instanceId || !token) {
      return res.status(400).json({ error: 'Z-API Instância ID ou Token não configurados no sistema.' });
    }

    const body = req.body || {};
    const rawRecipient = body.recipient || body.customRecipient || body.recipients || settings.app_notification_financial_recipients || '5541984042835';

    let recipientsList = [];
    if (Array.isArray(rawRecipient)) {
      recipientsList = rawRecipient;
    } else {
      recipientsList = String(rawRecipient).split(/[,;\n]/).map(r => r.trim()).filter(Boolean);
    }

    if (recipientsList.length === 0) {
      return res.status(400).json({ error: 'Número de WhatsApp ou ID de Grupo é obrigatório para o teste.' });
    }

    const dateFormatted = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
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

      const testMessage = `*🧪 TESTE DE NOTIFICAÇÃO - CLEAN TECH SMART* 🤖💬
*Data/Hora:* ${dateFormatted}
*Canal:* Notificações do Financeiro (Vendas Faturadas)
*Destinatário:* ${target}

✅ *Parabéns! Sua integração com o WhatsApp (Z-API) está funcionando perfeitamente!*

Sempre que uma venda for faturada no Conta Azul, os dados completos da fatura e da venda serão enviados automaticamente para este contato.`;

      try {
        const sendRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
          method: 'POST',
          headers: zapiHeaders,
          body: JSON.stringify({
            phone: target,
            message: testMessage
          })
        });

        const sendData = await sendRes.text();
        if (!sendRes.ok) {
          results.push({ recipient: target, success: false, error: sendData });
        } else {
          let parsed;
          try { parsed = JSON.parse(sendData); } catch { parsed = sendData; }
          results.push({ recipient: target, success: true, response: parsed });
        }
      } catch (sendErr) {
        results.push({ recipient: target, success: false, error: sendErr.message });
      }
    }

    const hasSuccess = results.some(r => r.success);
    if (!hasSuccess) {
      const firstError = results[0]?.error || 'Erro ao enviar via Z-API';
      return res.status(400).json({ success: false, error: firstError, results });
    }

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('Erro no teste de WhatsApp:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
