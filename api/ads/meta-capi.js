import crypto from 'crypto';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

function hashSha256(val) {
  if (!val) return null;
  return crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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
    const { 
      eventName = 'Lead', 
      sourceUrl = 'https://cleantechsmart.cleantechpro.com.br', 
      email, 
      phone, 
      name,
      customData = {} 
    } = req.body || {};

    dbClient = await pool.connect();
    const settingsRes = await dbClient.query("SELECT key, value FROM system_settings WHERE key IN ('ads_meta_pixel_id', 'ads_meta_capi_token')");
    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.key] = r.value; });

    const pixelId = settings.ads_meta_pixel_id || '1085367677533423';
    const capiToken = settings.ads_meta_capi_token;

    if (!capiToken || !pixelId) {
      return res.status(400).json({ error: 'Meta CAPI token or Pixel ID not configured.' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Mozilla/5.0';

    const userData = {
      client_ip_address: ip,
      client_user_agent: userAgent
    };

    if (email) {
      userData.em = [hashSha256(email)];
    }
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      userData.ph = [hashSha256(cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`)];
    }
    if (name) {
      const parts = name.trim().split(' ');
      userData.fn = [hashSha256(parts[0])];
      if (parts.length > 1) {
        userData.ln = [hashSha256(parts[parts.length - 1])];
      }
    }

    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: sourceUrl,
          user_data: userData,
          custom_data: customData
        }
      ]
    };

    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${capiToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const fbJson = await fbRes.json();
    return res.status(fbRes.ok ? 200 : 400).json(fbJson);

  } catch (error) {
    console.error('Erro no Meta CAPI:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (dbClient) dbClient.release();
  }
}
