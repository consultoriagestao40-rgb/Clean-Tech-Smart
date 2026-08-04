import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

async function findClientByPhone(dbClient, rawPhone) {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;
  
  try {
    const result = await dbClient.query('SELECT id, name, phone FROM clients');
    for (const row of result.rows) {
      if (!row.phone) continue;
      const clientDigits = row.phone.replace(/\D/g, '');
      if (clientDigits.length >= 8 && digits.length >= 8) {
        const suffix1 = clientDigits.slice(-8);
        const suffix2 = digits.slice(-8);
        if (suffix1 === suffix2) {
          return row;
        }
      }
    }
  } catch (e) {}
  return null;
}

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let dbClient;
  try {
    dbClient = await pool.connect();
  } catch (e) {
    console.error('[Z-API Webhook DB Connection Error]:', e.message);
  }

  try {
    const payload = req.body || {};
    
    let phone = payload.phone || payload.participantPhone || payload.from || payload.chatId;
    let senderName = payload.senderName || payload.senderShortName || payload.pushName;
    let messageText = payload.text?.message || payload.body || payload.caption || '';

    if (payload.message) {
      phone = phone || payload.message.phone || payload.message.from || payload.message.chatId;
      senderName = senderName || payload.message.senderName || payload.message.pushName;
      messageText = messageText || payload.message.text?.message || payload.message.body || payload.message.caption || '';
    }

    if (!phone && typeof payload === 'object') {
      for (const k in payload) {
        if ((k.toLowerCase().includes('phone') || k.toLowerCase().includes('from')) && typeof payload[k] === 'string') {
          phone = payload[k];
          break;
        }
      }
    }

    if (!phone) {
      return res.status(200).json({ success: true, message: 'Payload received, no phone detected' });
    }

    let cleanPhone = String(phone).split('@')[0].replace(/\D/g, '').trim();
    if (!cleanPhone) {
      return res.status(200).json({ success: true, message: 'Empty phone digits' });
    }

    if (cleanPhone.length === 11 && !cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;

    if (dbClient) {
      let currentLead;
      const suffix = cleanPhone.length >= 8 ? cleanPhone.slice(-8) : cleanPhone;
      
      const checkRes = await dbClient.query(
        `SELECT * FROM leads WHERE phone = $1 OR replace(phone, '-', '') LIKE $2 LIMIT 1`,
        [cleanPhone, `%${suffix}`]
      );

      if (checkRes.rows.length === 0) {
        const matchedClient = await findClientByPhone(dbClient, cleanPhone);
        const initialName = senderName || (matchedClient ? matchedClient.name : `Lead WhatsApp (${cleanPhone})`);

        const insertRes = await dbClient.query(
          `INSERT INTO leads (phone, name, stage, value, assigned_to) 
           VALUES ($1, $2, 'inbox', 0.00, NULL) 
           RETURNING *`,
          [cleanPhone, initialName]
        );
        currentLead = insertRes.rows[0];
      } else {
        currentLead = checkRes.rows[0];
      }

      const leadPhoneToSave = currentLead ? currentLead.phone : cleanPhone;

      if (messageText) {
        const cleanMessageText = messageText.trim();
        
        const noteCheck = await dbClient.query(
          'SELECT id FROM crm_notes WHERE lead_phone = $1 AND content = $2',
          [leadPhoneToSave, `[WhatsApp] ${cleanMessageText}`]
        );

        if (noteCheck.rows.length === 0) {
          await dbClient.query(
            `INSERT INTO crm_notes (lead_phone, content, user_id, created_at) 
             VALUES ($1, $2, NULL, NOW())`,
            [leadPhoneToSave, `[WhatsApp] ${cleanMessageText}`]
          );
        }
      }
    }

    return res.status(200).json({ success: true, phone: cleanPhone });
  } catch (err) {
    console.error('[Z-API Webhook Error]:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (dbClient) dbClient.release();
  }
}
