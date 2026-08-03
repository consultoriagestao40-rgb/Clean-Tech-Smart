import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

async function findClientByPhone(dbClient, rawPhone) {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;
  
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
  return null;
}

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

  const dbClient = await pool.connect();

  try {
    const payload = req.body || {};
    
    // Z-API payload structure can vary depending on webhook configuration
    // We parse variables robustly to support both standard and nested message payloads
    let phone = payload.phone;
    let senderName = payload.senderName || payload.senderShortName;
    let messageText = payload.text?.message || '';

    if (payload.message) {
      phone = phone || payload.message.phone;
      senderName = senderName || payload.message.senderName || payload.message.senderShortName;
      messageText = messageText || payload.message.text?.message || payload.message.messageText || '';
    }

    if (!phone) {
      return res.status(200).json({ success: true, message: 'Payload received, no phone detected' });
    }

    // Clean phone number (remove @c.us etc if appended by Z-API)
    const cleanPhone = phone.split('@')[0].trim();

    // 1. Check if lead already exists in CRM
    const checkRes = await dbClient.query('SELECT * FROM leads WHERE phone = $1', [cleanPhone]);

    let currentLead;

    if (checkRes.rows.length === 0) {
      // Lead doesn't exist, create it in CRM under 'inbox' stage
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

    // 2. Save message content as a note under CRM notes if text is present
    if (messageText) {
      const cleanMessageText = messageText.trim();
      
      // Avoid duplicate note entries from duplicate Z-API webhooks delivery retries
      const noteCheck = await dbClient.query(
        'SELECT id FROM crm_notes WHERE lead_phone = $1 AND content = $2',
        [cleanPhone, `[WhatsApp] ${cleanMessageText}`]
      );

      if (noteCheck.rows.length === 0) {
        await dbClient.query(
          `INSERT INTO crm_notes (lead_phone, content, user_id, created_at) 
           VALUES ($1, $2, NULL, NOW())`,
          [cleanPhone, `[WhatsApp] ${cleanMessageText}`]
        );
      }
    }

    return res.status(200).json({ success: true, leadId: currentLead.phone });
  } catch (error) {
    console.error('Erro no webhook da Z-API:', error);
    return res.status(500).json({ error: 'Erro interno ao processar webhook' });
  } finally {
    dbClient.release();
  }
}
