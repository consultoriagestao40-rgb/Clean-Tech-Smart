import { getValidAccessToken, BASE_API_URL } from './conta-azul.js';

export default async function handler(req, res) {
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    const dbClient = await pool.connect();
    const tokenRows = await dbClient.query("SELECT key, value FROM system_settings WHERE key LIKE 'conta_azul%'");
    dbClient.release();

    const tokenMap = {};
    tokenRows.rows.forEach(r => { tokenMap[r.key] = r.value; });

    // Testar renovar token
    const clientId = process.env.CONTA_AZUL_CLIENT_ID || '5ngbq1tfnlm0aklaa8tun7v8vu';
    const clientSecret = process.env.CONTA_AZUL_CLIENT_SECRET || '12682kvjplg1cfokkj97qgllce92e9mi9vt59b3i9bef9556o5gh';
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    let refreshResult = null;
    if (tokenMap.conta_azul_refresh_token) {
      const rfRes = await fetch('https://api-v2.contaazul.com/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenMap.conta_azul_refresh_token
        })
      });
      refreshResult = {
        status: rfRes.status,
        body: await rfRes.text()
      };
    }

    return res.status(200).json({
      tokenMap: {
        hasAccess: !!tokenMap.conta_azul_access_token,
        hasRefresh: !!tokenMap.conta_azul_refresh_token,
        expiresAt: tokenMap.conta_azul_expires_at,
        timeNow: Date.now(),
        isExpired: Number(tokenMap.conta_azul_expires_at || 0) <= Date.now()
      },
      refreshResult
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
