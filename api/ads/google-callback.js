import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  const { code, error } = req.query || {};

  if (error) {
    return res.redirect(`/agente-ads?tab=conexoes&error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect('/agente-ads?tab=conexoes&error=no_code_provided');
  }

  const dbClient = await pool.connect();

  try {
    const settingsRes = await dbClient.query("SELECT key, value FROM system_settings WHERE key LIKE 'ads_%'");
    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.key] = r.value; });

    const clientId = settings.ads_google_client_id || process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = settings.ads_google_client_secret || process.env.GOOGLE_ADS_CLIENT_SECRET;
    const redirectUri = 'https://clean-tech-smart.vercel.app/api/ads/google-callback';

    if (clientId && clientSecret) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenRes.json();

      if (tokenData.refresh_token) {
        await dbClient.query(`
          INSERT INTO system_settings (key, value, updated_at)
          VALUES ('ads_google_refresh_token', $1, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `, [tokenData.refresh_token]);
      }

      if (tokenData.access_token) {
        await dbClient.query(`
          INSERT INTO system_settings (key, value, updated_at)
          VALUES ('ads_google_access_token', $1, NOW())
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        `, [tokenData.access_token]);
      }
    }

    return res.redirect('/agente-ads?tab=campanhas&google_auth=success');
  } catch (err) {
    console.error('Erro no callback do Google OAuth:', err);
    return res.redirect(`/agente-ads?tab=conexoes&error=${encodeURIComponent(err.message)}`);
  } finally {
    dbClient.release();
  }
}
