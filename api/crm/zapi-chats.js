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

  let dbClient;
  try {
    dbClient = await pool.connect();
  } catch (e) {
    console.error('[Z-API DB Connection Error]:', e.message);
  }

  try {
    if (req.method === 'GET') {
      const { phone } = req.query || {};
      if (!phone) {
        return res.status(400).json({ error: 'Telefone é obrigatório.' });
      }

      if (!dbClient) {
        return res.status(200).json({ messages: [] });
      }

      const digits = phone.replace(/\D/g, '');
      const suffix = digits.length >= 8 ? digits.slice(-8) : digits;

      const queryParams = [phone];
      let sqlWhere = `WHERE lead_phone = $1`;

      if (suffix && suffix.length >= 8) {
        sqlWhere += ` OR right(regexp_replace(lead_phone, '\\D', '', 'g'), 8) = $2`;
        queryParams.push(suffix);
      }

      const notesRes = await dbClient.query(
        `SELECT id, lead_phone, user_id, content, created_at 
         FROM crm_notes 
         ${sqlWhere}
         ORDER BY created_at ASC`,
        queryParams
      );

      const formattedNotes = notesRes.rows.map(n => {
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

      formattedNotes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return res.status(200).json({ messages: formattedNotes });

    } else if (req.method === 'POST') {
      // Sync chats from Z-API
      let instanceId = '3F718C3D9582E1963A49EAE0B2B942D4';
      let token = 'D4F38DEC6BD1906C37E044B4';
      let clientToken = 'F5c1b8f27f6b049c98c4e779d00f67552S';

      if (dbClient) {
        try {
          const settingsRes = await dbClient.query(`SELECT key, value FROM system_settings WHERE key LIKE 'app_zapi%'`);
          settingsRes.rows.forEach(r => {
            if (r.key === 'app_zapi_instance_id' && r.value) instanceId = r.value;
            if (r.key === 'app_zapi_token' && r.value) token = r.value;
            if (r.key === 'app_zapi_client_token' && r.value) clientToken = r.value;
          });
        } catch (e) {}
      }

      const zapiHeaders = {};
      if (clientToken && clientToken.trim()) {
        zapiHeaders['Client-Token'] = clientToken.trim();
      }

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
            `SELECT phone FROM leads WHERE phone = $1 OR right(regexp_replace(phone, '\\D', '', 'g'), 8) = $2 LIMIT 1`,
            [cleanPhone, suffix]
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
