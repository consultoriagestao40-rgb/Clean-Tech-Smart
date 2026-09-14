import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // CORS support
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const client = await pool.connect();
  try {
    const sRes = await client.query('SELECT key, value FROM system_settings');
    const settings = {};
    for (const r of sRes.rows) {
      settings[r.key] = r.value;
    }

    const instanceId = settings.app_zapi_instance_id;
    const token = settings.app_zapi_token;
    const clientToken = settings.app_zapi_client_token;

    if (!instanceId || !token) {
      return res.status(400).json({ error: 'Instância ou Token Z-API não configurados.' });
    }

    const zapiHeaders = {};
    if (clientToken) zapiHeaders['Client-Token'] = clientToken;

    // Tentar endpoint de grupos do Z-API
    const zRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/groups`, {
      headers: zapiHeaders
    });

    let groups = [];
    if (zRes.ok) {
      const data = await zRes.json();
      if (Array.isArray(data)) {
        groups = data.map(g => ({
          name: g.name || 'Grupo sem nome',
          phone: g.phone || g.id || '',
          isGroup: true
        })).filter(g => g.phone);
      }
    } else {
      // Fallback para chats
      const cRes = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/chats`, {
        headers: zapiHeaders
      });
      if (cRes.ok) {
        const chats = await cRes.json();
        if (Array.isArray(chats)) {
          groups = chats
            .filter(c => c.isGroup || (c.phone && (c.phone.includes('-group') || c.phone.includes('-'))))
            .map(g => ({
              name: g.name || 'Grupo sem nome',
              phone: g.phone || g.id || '',
              isGroup: true
            }));
        }
      }
    }

    return res.status(200).json({
      success: true,
      count: groups.length,
      groups: groups
    });
  } catch (error) {
    console.error('Erro ao buscar grupos no Z-API:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}
