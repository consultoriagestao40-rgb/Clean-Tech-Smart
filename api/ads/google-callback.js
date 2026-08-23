import { Pool } from 'pg';
import { signToken } from '../_utils/auth.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  const { code, error } = req.query || {};

  if (error) {
    return res.redirect(`/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect('/login?error=no_code_provided');
  }

  const dbClient = await pool.connect();

  try {
    const settingsRes = await dbClient.query("SELECT key, value FROM system_settings WHERE key LIKE 'ads_%'");
    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.key] = r.value; });

    const clientId = settings.ads_google_client_id || process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = settings.ads_google_client_secret || process.env.GOOGLE_ADS_CLIENT_SECRET;
    const host = req.headers.host || 'cleantechsmart.cleantechpro.com.br';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/ads/google-callback`;

    let appToken = null;
    let appUser = null;

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

        // Get Google Profile info
        try {
          const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            const userEmail = (profile.email || 'consultoria.gestao4.0@gmail.com').toLowerCase().trim();
            const userName = profile.name || 'Cristiano Silva';

            // Find or create in users table
            const userCheck = await dbClient.query("SELECT * FROM users WHERE LOWER(email) = $1", [userEmail]);
            if (userCheck.rows.length > 0) {
              appUser = {
                id: userCheck.rows[0].id,
                name: userCheck.rows[0].name,
                email: userCheck.rows[0].email,
                role: userCheck.rows[0].role || 'admin'
              };
            } else {
              const insertRes = await dbClient.query(`
                INSERT INTO users (name, email, role, password_hash, created_at)
                VALUES ($1, $2, 'admin', 'google_oauth_authenticated', NOW())
                RETURNING id, name, email, role
              `, [userName, userEmail]);
              appUser = insertRes.rows[0];
            }

            appToken = signToken(appUser);
          }
        } catch (profileErr) {
          console.warn('Erro ao obter perfil do Google:', profileErr.message);
        }
      }
    }

    if (appToken && appUser) {
      return res.redirect(`/login?google_token=${encodeURIComponent(appToken)}&google_user=${encodeURIComponent(JSON.stringify(appUser))}`);
    }

    return res.redirect('/agente-ads?tab=campanhas&google_auth=success');
  } catch (err) {
    console.error('Erro no callback do Google OAuth:', err);
    return res.redirect(`/login?error=${encodeURIComponent(err.message)}`);
  } finally {
    dbClient.release();
  }
}
