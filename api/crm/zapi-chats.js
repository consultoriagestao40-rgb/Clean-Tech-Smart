import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
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

  let instanceId = process.env.ZAPI_INSTANCE_ID || '3F718C3D9582E1963A49EAE0B2B942D4';
  let token = process.env.ZAPI_TOKEN || 'D4F38DEC6BD1906C37E044B4';
  let clientToken = process.env.ZAPI_CLIENT_TOKEN || 'F5c1b8f27f6b049c98c4e779d00f67552S';

  let dbClient;
  try {
    dbClient = await pool.connect();
  } catch (e) {
    console.error('[Z-API DB Connection Error]:', e.message);
  }

  try {
    if (dbClient) {
      try {
        const settingsRes = await dbClient.query(`SELECT key, value FROM system_settings WHERE key LIKE 'app_zapi%'`);
        if (settingsRes && settingsRes.rows) {
          settingsRes.rows.forEach(r => {
            if (r.key === 'app_zapi_instance_id' && r.value) instanceId = r.value;
            if (r.key === 'app_zapi_token' && r.value) token = r.value;
            if (r.key === 'app_zapi_client_token' && r.value) clientToken = r.value;
          });
        }
      } catch (settingsErr) {
        console.warn('[Z-API] system_settings query ignored:', settingsErr.message);
      }
    }

    const zapiHeaders = {};
    if (clientToken && clientToken.trim()) {
      zapiHeaders['Client-Token'] = clientToken.trim();
    }

    if (req.method === 'GET') {
      const { phone } = req.query;
      if (!phone) {
        return res.status(400).json({ error: 'Telefone obrigatório.' });
      }

      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length === 11 && !cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;
      if (cleanPhone.length === 10 && !cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;

      let zapiMsgs = [];

      try {
        const url1 = `https://api.z-api.io/instances/${instanceId}/token/${token}/chats/${cleanPhone}/messages?page=1&pageSize=40`;
        const res1 = await fetch(url1, { headers: zapiHeaders });
        if (res1.ok) {
          const d1 = await res1.json();
          zapiMsgs = Array.isArray(d1) ? d1 : (d1.messages || d1.value || []);
        }
      } catch (e) {}

      if (zapiMsgs.length === 0) {
        try {
          const url2 = `https://api.z-api.io/instances/${instanceId}/token/${token}/chat-messages/${cleanPhone}`;
          const res2 = await fetch(url2, { headers: zapiHeaders });
          if (res2.ok) {
            const d2 = await res2.json();
            zapiMsgs = Array.isArray(d2) ? d2 : (d2.messages || d2.value || []);
          }
        } catch (e) {}
      }

      const formattedZapi = zapiMsgs.map(m => {
        const isSent = m.fromMe || m.isSent;
        const text = m.body || m.text?.message || m.caption || m.message || '';
        return {
          id: m.messageId || m.id || Math.random().toString(),
          content: isSent ? `[WhatsApp] ${text}` : text,
          author_name: isSent ? 'Você' : (m.senderName || 'Cliente'),
          is_sent: isSent,
          created_at: m.moment ? new Date(m.moment * 1000).toISOString() : (m.timestamp ? new Date(m.timestamp * 1000).toISOString() : new Date().toISOString())
        };
      });

      let dbNotes = [];
      if (dbClient) {
        try {
          const notesRes = await dbClient.query(
            `SELECT id, lead_phone, user_id, content, created_at FROM crm_notes WHERE lead_phone = $1 ORDER BY created_at ASC`,
            [phone]
          );
          dbNotes = notesRes.rows;
        } catch (e) {}
      }

      const allMsgs = [...dbNotes, ...formattedZapi];
      const seen = new Set();
      const uniqueMsgs = [];
      for (const m of allMsgs) {
        const cleanTxt = (m.content || '').replace('[WhatsApp]', '').trim();
        if (cleanTxt && !seen.has(cleanTxt)) {
          seen.add(cleanTxt);
          uniqueMsgs.push(m);
        }
      }

      uniqueMsgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return res.status(200).json({ messages: uniqueMsgs });

    } else if (req.method === 'POST') {
      let chatsRes;
      try {
        chatsRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/chats?page=1&pageSize=50`, {
          headers: zapiHeaders
        });
      } catch (err) {
        return res.status(500).json({ error: 'Falha de conexão com a Z-API: ' + err.message });
      }

      if (!chatsRes.ok) {
        const errText = await chatsRes.text();
        return res.status(500).json({ error: `Erro Z-API HTTP ${chatsRes.status}: ${errText}` });
      }

      const chats = await chatsRes.json();
      const rawChats = Array.isArray(chats) ? chats : (chats.value || []);
      let syncedCount = 0;

      if (dbClient) {
        for (const chat of rawChats) {
          const rawPhone = chat.phone || chat.id || '';
          const cleanPhone = rawPhone.replace(/\D/g, '');
          if (!cleanPhone || cleanPhone.length < 10) continue;

          const name = chat.name || chat.contactName || `Lead ${cleanPhone}`;

          try {
            await dbClient.query(
              `INSERT INTO leads (phone, name, stage, value)
               VALUES ($1, $2, 'inbox', 0)
               ON CONFLICT (phone) DO UPDATE 
               SET name = EXCLUDED.name
               WHERE leads.name IS NULL OR leads.name LIKE 'Lead%'`,
              [cleanPhone, name]
            );
            syncedCount++;
          } catch (dbErr) {
            console.warn('[Z-API Lead Insert Warning]:', dbErr.message);
          }
        }
      }

      return res.status(200).json({ success: true, synced: syncedCount });
    }
  } catch (err) {
    console.error('[Z-API Handler Error]:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (dbClient) dbClient.release();
  }
}
