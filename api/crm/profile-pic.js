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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { phone } = req.query || {};
  if (!phone) {
    return res.status(400).json({ error: 'Phone parameter is required' });
  }

  let dbClient;
  try {
    dbClient = await pool.connect();
  } catch (e) {
    console.error('[profile-pic] DB error:', e.message);
  }

  try {
    const rawDigits = phone.replace(/\D/g, '');
    if (!rawDigits || rawDigits.length < 8) {
      return res.status(200).json({ profile_pic_url: null });
    }

    const cleanPhone = rawDigits.startsWith('55') ? rawDigits : '55' + rawDigits;

    // Check DB cache first
    if (dbClient) {
      const dbRes = await dbClient.query(
        `SELECT profile_pic_url FROM leads WHERE phone = $1 OR replace(phone, '-', '') LIKE '%' || $2 LIMIT 1`,
        [phone, cleanPhone.slice(-8)]
      );
      if (dbRes.rows.length > 0 && dbRes.rows[0].profile_pic_url) {
        return res.status(200).json({ profile_pic_url: dbRes.rows[0].profile_pic_url });
      }
    }

    // Get Z-API credentials
    let instanceId = '3F718C3D9582E1963A49EAE0B2B942D4';
    let token = 'D4F38DEC6BD1906C37E044B4';
    let clientToken = 'F5c1b8f27f6b049c98c4e779d00f67552S';

    if (dbClient) {
      const settingsRes = await dbClient.query(`SELECT key, value FROM system_settings WHERE key LIKE 'app_zapi%'`);
      settingsRes.rows.forEach(r => {
        if (r.key === 'app_zapi_instance_id' && r.value) instanceId = r.value;
        if (r.key === 'app_zapi_token' && r.value) token = r.value;
        if (r.key === 'app_zapi_client_token' && r.value) clientToken = r.value;
      });
    }

    const zapiHeaders = {};
    if (clientToken) zapiHeaders['Client-Token'] = clientToken.trim();

    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/profile-picture?phone=${cleanPhone}`;
    const zapiRes = await fetch(zapiUrl, { headers: zapiHeaders });
    
    if (zapiRes.ok) {
      const data = await zapiRes.json();
      const picUrl = (data && data.link && data.link !== 'null') ? data.link : null;

      if (picUrl && dbClient) {
        // Save to DB cache
        await dbClient.query(
          `UPDATE leads SET profile_pic_url = $1 WHERE phone = $2 OR replace(phone, '-', '') LIKE '%' || $3`,
          [picUrl, phone, cleanPhone.slice(-8)]
        );
      }

      return res.status(200).json({ profile_pic_url: picUrl });
    }

    return res.status(200).json({ profile_pic_url: null });
  } catch (err) {
    console.error('[profile-pic] Error:', err.message);
    return res.status(200).json({ profile_pic_url: null });
  } finally {
    if (dbClient) dbClient.release();
  }
}
