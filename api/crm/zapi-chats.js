import { query } from '../_utils/db.js';

export default async function handler(req, res) {
  let instanceId = process.env.ZAPI_INSTANCE_ID || '3F718C3D9582E1963A49EAE0B2B942D4';
  let token = process.env.ZAPI_TOKEN || 'D4F38DEC6BD1906C37E044B4';
  let clientToken = process.env.ZAPI_CLIENT_TOKEN || '';

  try {
    const settingsRes = await query(`SELECT key, value FROM settings WHERE key LIKE 'app_zapi%'`);
    settingsRes.rows.forEach(r => {
      if (r.key === 'app_zapi_instance_id' && r.value) instanceId = r.value;
      if (r.key === 'app_zapi_token' && r.value) token = r.value;
      if (r.key === 'app_zapi_client_token' && r.value) clientToken = r.value;
    });
  } catch (e) {
    console.warn('[Z-API] Settings query error:', e);
  }

  const zapiHeaders = {};
  if (clientToken) zapiHeaders['Client-Token'] = clientToken;

  if (req.method === 'GET') {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Telefone obrigatório.' });
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11 && !cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;

    try {
      let zapiMsgs = [];

      // 1. Try Z-API chats/{phone}/messages endpoint
      try {
        const url1 = `https://api.z-api.io/instances/${instanceId}/token/${token}/chats/${cleanPhone}/messages?page=1&pageSize=40`;
        const res1 = await fetch(url1, { headers: zapiHeaders });
        if (res1.ok) {
          const d1 = await res1.json();
          zapiMsgs = Array.isArray(d1) ? d1 : (d1.messages || d1.value || []);
        }
      } catch (e) {}

      // 2. Fallback to Z-API chat-messages/{phone} endpoint
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

      // Format messages
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

      // Also get saved DB notes/webhooks
      let dbNotes = [];
      try {
        const notesRes = await query(
          `SELECT id, lead_phone, user_id, content, created_at FROM crm_notes WHERE lead_phone = $1 ORDER BY created_at ASC`,
          [phone]
        );
        dbNotes = notesRes.rows;
      } catch (e) {}

      // Merge both sources smoothly
      const allMsgs = [...dbNotes, ...formattedZapi];
      // Deduplicate by clean content
      const seen = new Set();
      const uniqueMsgs = [];
      for (const m of allMsgs) {
        const cleanTxt = (m.content || '').replace('[WhatsApp]', '').trim();
        if (cleanTxt && !seen.has(cleanTxt)) {
          seen.add(cleanTxt);
          uniqueMsgs.push(m);
        }
      }

      // Sort by created_at
      uniqueMsgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      return res.status(200).json({ messages: uniqueMsgs });
    } catch (err) {
      console.error('[Z-API] Erro no handler:', err);
      return res.status(500).json({ error: err.message, messages: [] });
    }
  } else if (req.method === 'POST') {
    // SYNC REAL WHATSAPP CHATS TO CRM INBOX
    try {
      const chatsRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/chats?page=1&pageSize=50`, {
        headers: zapiHeaders
      });

      if (!chatsRes.ok) {
        return res.status(500).json({ error: 'Erro ao consultar Z-API.' });
      }

      const chats = await chatsRes.json();
      const rawChats = Array.isArray(chats) ? chats : (chats.value || []);
      let syncedCount = 0;

      for (const chat of rawChats) {
        const rawPhone = chat.phone || chat.id || '';
        const cleanPhone = rawPhone.replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 10) continue;

        const name = chat.name || chat.contactName || `Lead ${cleanPhone}`;

        await query(
          `INSERT INTO crm_contacts (phone, name, stage, value)
           VALUES ($1, $2, 'inbox', 0)
           ON CONFLICT (phone) DO UPDATE 
           SET name = EXCLUDED.name
           WHERE crm_contacts.name IS NULL OR crm_contacts.name LIKE 'Lead%'`,
          [cleanPhone, name]
        );

        syncedCount++;
      }

      return res.status(200).json({ success: true, synced: syncedCount });
    } catch (err) {
      console.error('[Z-API Sync] Erro ao sincronizar:', err);
      return res.status(500).json({ error: err.message });
    }
  }
}
