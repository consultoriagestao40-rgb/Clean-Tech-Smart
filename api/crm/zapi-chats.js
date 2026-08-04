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
          content: text,
          author_name: isSent ? 'Você' : (m.senderName || 'Cliente'),
          is_sent: isSent,
          created_at: m.moment ? new Date(m.moment * 1000).toISOString() : (m.timestamp ? new Date(m.timestamp * 1000).toISOString() : new Date().toISOString())
        };
      });

      let dbNotes = [];
      if (dbClient) {
        try {
          const digits = phone.replace(/\D/g, '');
          const suffix = digits.length >= 8 ? digits.slice(-8) : digits;
          const notesRes = await dbClient.query(
            `SELECT id, lead_phone, user_id, content, created_at 
             FROM crm_notes 
             WHERE lead_phone = $1 
                OR replace(lead_phone, '-', '') LIKE $2 
                OR replace($1, '-', '') LIKE '%' || right(replace(lead_phone, '-', ''), 8)
             ORDER BY created_at ASC`,
            [phone, `%${suffix}`]
          );
          dbNotes = notesRes.rows.map(n => {
            const isSent = n.user_id !== null && n.user_id !== undefined;
            const rawContent = n.content || '';

            const isFileMatch  = rawContent.match(/\[Arquivo:\s*([^\]]+)\]/);
            const isImageMatch = rawContent.match(/\[Imagem(?::\s*([^\]]+))?\]/);
            const isAudio      = /\[Áudio\]/i.test(rawContent);
            const isVideo      = /\[Vídeo\]/i.test(rawContent);

            const urlMatch = rawContent.match(/https?:\/\/[^\s]+/);
            const mediaUrl = urlMatch ? urlMatch[0] : null;

            let text = rawContent
              .replace('[WhatsApp]', '')
              .replace(/\[Arquivo:[^\]]*\]/g, '')
              .replace(/\[Imagem:[^\]]*\]/g, '')
              .replace(/\[Áudio\]/gi, '')
              .replace(/\[Vídeo\]/gi, '')
              .replace(/https?:\/\/[^\s]+/g, '')
              .trim();

            const isWhatsApp = rawContent.startsWith('[WhatsApp]') ||
              isFileMatch !== null || isImageMatch !== null || isAudio || isVideo ||
              n.user_id === null;

            return {
              id: `db_${n.id}`,
              content: text,
              author_name: isSent ? 'Você' : 'Cliente',
              is_sent: isSent,
              is_whatsapp: isWhatsApp,
              user_id: n.user_id,
              created_at: n.created_at,
              is_file:  !!isFileMatch  && !isAudio,
              is_image: !!isImageMatch && !isAudio,
              is_audio: isAudio,
              is_video: isVideo,
              file_name: isFileMatch?.[1] || isImageMatch?.[1] || null,
              media_url: mediaUrl
            };
          });
        } catch (e) { console.error('[zapi-chats] DB notes error:', e.message); }
      }

      // Auto-sync Z-API live messages into DB if missing
      if (dbClient && formattedZapi.length > 0) {
        const existingTexts = new Set(dbNotes.map(n => n.content.trim()));
        for (const zm of formattedZapi) {
          if (!zm.content || !zm.content.trim()) continue;
          const trimmed = zm.content.trim();
          if (!existingTexts.has(trimmed)) {
            try {
              const insertRes = await dbClient.query(
                `INSERT INTO crm_notes (lead_phone, user_id, content, created_at)
                 VALUES ($1, $2, $3, $4::timestamp)
                 RETURNING id`,
                [phone, zm.is_sent ? 1 : null, `[WhatsApp] ${trimmed}`, zm.created_at]
              );
              existingTexts.add(trimmed);
              dbNotes.push({
                id: `db_${insertRes.rows[0].id}`,
                content: trimmed,
                author_name: zm.author_name,
                is_sent: zm.is_sent,
                is_whatsapp: true,
                user_id: zm.is_sent ? 1 : null,
                created_at: zm.created_at,
                is_file: false,
                is_image: false,
                is_audio: false,
                is_video: false,
                file_name: null,
                media_url: null
              });
            } catch (insErr) {
              console.error('[zapi-chats] Auto insert error:', insErr.message);
            }
          }
        }
      }

      // Sort chronologically
      dbNotes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return res.status(200).json({ messages: dbNotes });

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
      const chatsList = Array.isArray(chats) ? chats : (chats.chats || chats.value || []);

      let syncedCount = 0;
      if (dbClient) {
        for (const chat of chatsList) {
          const rawPhone = chat.phone || chat.id || chat.chatId || '';
          if (!rawPhone) continue;
          let cleanPhone = String(rawPhone).split('@')[0].replace(/\D/g, '').trim();
          if (!cleanPhone) continue;
          if (cleanPhone.length === 11 && !cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;
          if (cleanPhone.length === 10 && !cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;

          const leadName = chat.name || chat.contactName || chat.pushName || `Lead ${cleanPhone}`;
          const suffix = cleanPhone.length >= 8 ? cleanPhone.slice(-8) : cleanPhone;

          const leadCheck = await dbClient.query(
            `SELECT phone FROM leads WHERE phone = $1 OR replace(phone, '-', '') LIKE $2 LIMIT 1`,
            [cleanPhone, `%${suffix}`]
          );

          if (leadCheck.rows.length === 0) {
            await dbClient.query(
              `INSERT INTO leads (phone, name, stage, value) VALUES ($1, $2, 'inbox', 0.00)`,
              [cleanPhone, leadName]
            );
            syncedCount++;
          }
        }
      }

      return res.status(200).json({ success: true, synced: syncedCount, total: chatsList.length });
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Erro na API crm/zapi-chats:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (dbClient) dbClient.release();
  }
}
