import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
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

  const dbClient = await pool.connect();

  try {
    const settingsRes = await dbClient.query("SELECT key, value FROM system_settings WHERE key LIKE 'ads_%'");
    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.key] = r.value; });

    const clientId = settings.ads_google_client_id || process.env.GOOGLE_ADS_CLIENT_ID;
    const host = req.headers.host || 'cleantechsmart.cleantechpro.com.br';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/ads/google-callback`;

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/adwords email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: 'agente_ads_google_connect'
    }).toString();

    return res.status(200).json({
      success: true,
      authUrl,
      clientIdConfigured: Boolean(settings.ads_google_client_id || process.env.GOOGLE_ADS_CLIENT_ID)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    dbClient.release();
  }
}
