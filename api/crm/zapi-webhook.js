import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: { rejectUnauthorized: false }
});

async function findLeadByPhone(dbClient, cleanPhone) {
  const suffix = cleanPhone.length >= 8 ? cleanPhone.slice(-8) : cleanPhone;
  const r = await dbClient.query(
    `SELECT * FROM leads WHERE phone = $1 OR replace(phone, '-', '') LIKE $2 LIMIT 1`,
    [cleanPhone, `%${suffix}`]
  );
  return r.rows[0] || null;
}

/**
 * Extract all relevant info from Z-API webhook payload.
 * Z-API sends different shapes depending on message type.
 * Ref: https://developer.z-api.io/en/webhooks/on-message-received
 */
function extractPayloadInfo(payload) {
  const msg = payload.message || payload;

  // Phone (sender or chat)
  let phone =
    payload.phone || payload.participantPhone || payload.from || payload.chatId ||
    msg.phone || msg.from || msg.chatId || '';

  // Sender name
  const senderName =
    payload.senderName || payload.senderShortName || payload.pushName ||
    msg.senderName || msg.pushName || '';

  // Determine if this message was sent BY US (fromMe)
  const fromMe = payload.fromMe === true || msg.fromMe === true;

  // ── Text message ─────────────────────────────────────────────
  let messageText =
    payload.text?.message ||
    msg.text?.message ||
    payload.body || msg.body ||
    payload.caption || msg.caption || '';

  // ── Media / File detection ───────────────────────────────────
  let mediaType = null;   // 'image' | 'audio' | 'video' | 'document' | 'sticker'
  let fileName = null;
  let mediaUrl = null;
  let mimeType = null;

  // Document
  const doc = payload.document || msg.document;
  if (doc) {
    mediaType = 'document';
    fileName  = payload.fileName || msg.fileName || doc.fileName || doc.name || 'documento';
    mediaUrl  = payload.documentUrl || msg.documentUrl || doc.url || doc.documentUrl || null;
    mimeType  = payload.mimeType || msg.mimeType || doc.mimeType || null;
    if (!messageText) messageText = payload.caption || msg.caption || '';
  }

  // Image
  const img = payload.image || msg.image;
  if (!mediaType && img) {
    mediaType = 'image';
    fileName  = payload.fileName || msg.fileName || img.fileName || 'imagem';
    mediaUrl  = payload.imageUrl || msg.imageUrl || img.url || img.imageUrl || null;
    mimeType  = payload.mimeType || msg.mimeType || img.mimeType || 'image/jpeg';
    if (!messageText) messageText = payload.caption || msg.caption || '';
  }

  // Audio / PTT
  const aud = payload.audio || msg.audio;
  if (!mediaType && aud) {
    mediaType = 'audio';
    fileName  = payload.fileName || msg.fileName || `audio_${Date.now()}.ogg`;
    mediaUrl  = payload.audioUrl || msg.audioUrl || aud.url || aud.audioUrl || null;
    mimeType  = payload.mimeType || msg.mimeType || aud.mimeType || 'audio/ogg';
  }

  // Video
  const vid = payload.video || msg.video;
  if (!mediaType && vid) {
    mediaType = 'video';
    fileName  = payload.fileName || msg.fileName || 'video';
    mediaUrl  = payload.videoUrl || msg.videoUrl || vid.url || vid.videoUrl || null;
    mimeType  = payload.mimeType || msg.mimeType || vid.mimeType || 'video/mp4';
    if (!messageText) messageText = payload.caption || msg.caption || '';
  }

  // Sticker
  if (!mediaType && (payload.sticker || msg.sticker)) {
    mediaType = 'sticker';
    fileName  = 'sticker';
    mediaUrl  = null;
  }

  return { phone, senderName, fromMe, messageText, mediaType, fileName, mediaUrl, mimeType };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let dbClient;
  try { dbClient = await pool.connect(); } catch (e) {
    console.error('[Webhook DB Error]:', e.message);
  }

  try {
    const payload = req.body || {};
    console.log('[Z-API Webhook Payload]:', JSON.stringify(payload).substring(0, 500));

    const { phone, senderName, fromMe, messageText, mediaType, fileName, mediaUrl, mimeType } = extractPayloadInfo(payload);

    if (!phone) {
      return res.status(200).json({ success: true, message: 'No phone detected' });
    }

    let cleanPhone = String(phone).split('@')[0].replace(/\D/g, '').trim();
    if (!cleanPhone) return res.status(200).json({ success: true, message: 'Empty phone digits' });

    if (cleanPhone.length === 11 && !cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('55')) cleanPhone = '55' + cleanPhone;

    if (!dbClient) {
      return res.status(200).json({ success: true, message: 'DB unavailable, skipping save' });
    }

    // Upsert lead
    let lead = await findLeadByPhone(dbClient, cleanPhone);
    if (!lead) {
      const ins = await dbClient.query(
        `INSERT INTO leads (phone, name, stage, value, assigned_to) VALUES ($1, $2, 'inbox', 0.00, NULL) RETURNING *`,
        [cleanPhone, senderName || `Lead WhatsApp (${cleanPhone})`]
      );
      lead = ins.rows[0];
    }

    const leadPhone = lead ? lead.phone : cleanPhone;

    // Build content string to save in crm_notes
    let contentToSave = null;

    if (mediaType) {
      let label;
      if (mediaType === 'document') {
        label = `[Arquivo: ${fileName || 'documento'}]`;
      } else if (mediaType === 'image') {
        label = `[Imagem: ${fileName || 'imagem'}]`;
      } else if (mediaType === 'audio') {
        label = `[Áudio]`;
      } else if (mediaType === 'video') {
        label = `[Vídeo]`;
      } else {
        label = `[${mediaType}]`;
      }

      const urlPart = mediaUrl ? ` ${mediaUrl}` : '';
      const captionPart = messageText ? ` ${messageText}` : '';
      contentToSave = `${label}${urlPart}${captionPart}`.trim();

    } else if (messageText && messageText.trim()) {
      contentToSave = messageText.replace('[WhatsApp]', '').trim();
    }

    if (contentToSave) {
      // Dedup: same phone + same content within last 15 seconds
      const dedupTime = new Date(Date.now() - 15000).toISOString();
      const noteCheck = await dbClient.query(
        `SELECT id FROM crm_notes WHERE lead_phone = $1 AND content = $2 AND created_at > $3`,
        [leadPhone, contentToSave, dedupTime]
      );

      if (noteCheck.rows.length === 0) {
        // If fromMe is true, save user_id non-null so it renders as sent by us (on right side)
        const userIdToSave = fromMe ? (lead?.assigned_to || 1) : null;

        await dbClient.query(
          `INSERT INTO crm_notes (lead_phone, content, user_id, created_at) VALUES ($1, $2, $3, NOW())`,
          [leadPhone, contentToSave, userIdToSave]
        );
        console.log(`[Webhook] Saved message for ${leadPhone} (fromMe: ${fromMe}, user_id: ${userIdToSave})`);
      } else {
        console.log('[Webhook] Duplicate message within 15s window, skipped duplicate insert');
      }
    }

    return res.status(200).json({ success: true, phone: cleanPhone, fromMe, mediaType: mediaType || 'text' });
  } catch (err) {
    console.error('[Z-API Webhook Error]:', err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (dbClient) dbClient.release();
  }
}
