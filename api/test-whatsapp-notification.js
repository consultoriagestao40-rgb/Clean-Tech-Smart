import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { recipient, type } = req.body;
  if (!recipient) {
    return res.status(400).json({ error: 'Número de WhatsApp ou ID de Grupo é obrigatório para o teste.' });
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

    let phone = String(recipient).trim();
    if (!phone.includes('-group') && !phone.includes('@')) {
      phone = phone.replace(/\D/g, '');
      if (phone.length === 10 || phone.length === 11) {
        phone = '55' + phone;
      }
    }

    const dateFormatted = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const testMessage = `*🧪 TESTE DE NOTIFICAÇÃO - CLEAN TECH SMART* 🤖💬
*Data/Hora:* ${dateFormatted}
*Canal:* Notificações do Financeiro (Vendas Faturadas)
*Destinatário:* ${phone}

✅ *Parabéns! Sua integração com o WhatsApp (Z-API) está funcionando perfeitamente!*

Sempre que uma venda for faturada no Conta Azul, os dados completos da fatura e da venda serão enviados automaticamente para este contato.`;

    const zapiHeaders = { 'Content-Type': 'application/json' };
    if (clientToken) zapiHeaders['Client-Token'] = clientToken;

    const sendRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
      method: 'POST',
      headers: zapiHeaders,
      body: JSON.stringify({
        phone: phone,
        message: testMessage
      })
    });

    const sendData = await sendRes.text();
    if (!sendRes.ok) {
      return res.status(400).json({ error: 'Falha ao enviar mensagem via Z-API: ' + sendData });
    }

    return res.status(200).json({ success: true, response: sendData, recipient: phone });
  } catch (error) {
    console.error('Erro no teste de WhatsApp:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
