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

    let freshAccess = null;
    if (refreshResult && refreshResult.status === 200) {
      const parsed = JSON.parse(refreshResult.body);
      freshAccess = parsed.access_token;
      const newRefresh = parsed.refresh_token;
      const newExpires = Date.now() + (Number(parsed.expires_in || 3600) * 1000);

      const updateClient = await pool.connect();
      await updateClient.query("UPDATE system_settings SET value = $1 WHERE key = 'conta_azul_access_token'", [freshAccess]);
      await updateClient.query("UPDATE system_settings SET value = $1 WHERE key = 'conta_azul_refresh_token'", [newRefresh]);
      await updateClient.query("UPDATE system_settings SET value = $1 WHERE key = 'conta_azul_expires_at'", [String(newExpires)]);
      updateClient.release();
    }

    const testToken = freshAccess || tokenMap.conta_azul_access_token;

    // Testar nas duas APIs: api.contaazul.com e api-v2.contaazul.com
    const resV1 = await fetch('https://api.contaazul.com/v1/sales?number=141', {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    const textV1 = await resV1.text();

    const resV2 = await fetch('https://api-v2.contaazul.com/v1/sales?number=141', {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    const textV2 = await resV2.text();

    const resV2List = await fetch('https://api-v2.contaazul.com/v1/sales', {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    const textV2List = await resV2List.text();

    const resV1List = await fetch('https://api.contaazul.com/v1/sales', {
      headers: { 'Authorization': `Bearer ${testToken}` }
    });
    const textV1List = await resV1List.text();

    return res.status(200).json({
      resV1: { status: resV1.status, body: textV1 },
      resV2: { status: resV2.status, body: textV2 },
      resV1List: { status: resV1List.status, body: textV1List.slice(0, 300) },
      resV2List: { status: resV2List.status, body: textV2List.slice(0, 300) }
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
