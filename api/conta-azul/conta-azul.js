import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

const CLIENT_ID = process.env.CONTA_AZUL_CLIENT_ID || '5ngbq1tfnlm0aklaa8tun7v8vu';
const CLIENT_SECRET = process.env.CONTA_AZUL_CLIENT_SECRET || '12682kvjplg1cfokkj97qgllce92e9mi9vt59b3i9bef9556o5gh';
const BASE_API_URL = 'https://api-v2.contaazul.com';

// Garante que a tabela system_settings existe
export async function ensureSettingsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Salva valor nas configurações
export async function setSetting(key, value) {
  const client = await pool.connect();
  try {
    await ensureSettingsTable(client);
    await client.query(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
    `, [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]);
  } finally {
    client.release();
  }
}

// Recupera valor das configurações
export async function getSetting(key) {
  const client = await pool.connect();
  try {
    await ensureSettingsTable(client);
    const res = await client.query('SELECT value FROM system_settings WHERE key = $1', [key]);
    return res.rows.length > 0 ? res.rows[0].value : null;
  } finally {
    client.release();
  }
}

// Obtém token de acesso válido, renovando automaticamente se necessário
export async function getValidAccessToken() {
  const client = await pool.connect();
  try {
    await ensureSettingsTable(client);
    const res = await client.query(`
      SELECT key, value FROM system_settings 
      WHERE key IN ('conta_azul_access_token', 'conta_azul_refresh_token', 'conta_azul_expires_at')
    `);

    const tokens = {};
    res.rows.forEach(r => { tokens[r.key] = r.value; });

    let accessToken = tokens.conta_azul_access_token;
    const refreshToken = tokens.conta_azul_refresh_token;
    const expiresAt = Number(tokens.conta_azul_expires_at || 0);

    // Se ainda for válido por pelo menos mais 1 minuto
    if (accessToken && expiresAt > Date.now() + 60000) {
      return accessToken;
    }

    // Se temos refresh token, renova
    if (refreshToken) {
      const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
      const tokenRes = await fetch(`${BASE_API_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const newAccess = tokenData.access_token;
        const newRefresh = tokenData.refresh_token || refreshToken;
        const newExpires = Date.now() + (Number(tokenData.expires_in || 3600) * 1000);

        await setSetting('conta_azul_access_token', newAccess);
        await setSetting('conta_azul_refresh_token', newRefresh);
        await setSetting('conta_azul_expires_at', String(newExpires));

        return newAccess;
      }
    }

    return null;
  } finally {
    client.release();
  }
}

// Busca ou cadastra cliente no Conta Azul
export async function findOrCreateContaAzulCustomer(clientData) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Conta Azul não autenticado ou token expirado.');

  const documentClean = (clientData.document || '').replace(/\D/g, '');
  
  // 1. Tenta buscar cliente existente pelo documento ou nome
  if (documentClean) {
    try {
      const searchRes = await fetch(`${BASE_API_URL}/v1/customers?document=${encodeURIComponent(documentClean)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (searchRes.ok) {
        const customers = await searchRes.json();
        if (Array.isArray(customers) && customers.length > 0) {
          return customers[0].id;
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar cliente por documento no Conta Azul:', e.message);
    }
  }

  // 2. Se não encontrou, busca por nome/razão social
  if (clientData.name) {
    try {
      const searchRes = await fetch(`${BASE_API_URL}/v1/customers?name=${encodeURIComponent(clientData.name.trim())}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (searchRes.ok) {
        const customers = await searchRes.json();
        if (Array.isArray(customers) && customers.length > 0) {
          return customers[0].id;
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar cliente por nome no Conta Azul:', e.message);
    }
  }

  // 3. Cadastra o novo cliente no Conta Azul
  const isCnpj = documentClean.length > 11;
  const newCustomerPayload = {
    name: clientData.name || 'Cliente Sem Nome',
    company_name: isCnpj ? (clientData.name || '') : undefined,
    person_type: isCnpj ? 'LEGAL' : 'NATURAL',
    document: documentClean || undefined,
    email: clientData.email || undefined,
    business_phone: clientData.phone || undefined,
    mobile_phone: clientData.phone || undefined
  };

  const createRes = await fetch(`${BASE_API_URL}/v1/customers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newCustomerPayload)
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('Erro ao cadastrar cliente no Conta Azul:', errText);
    throw new Error(`Falha ao cadastrar cliente no Conta Azul: ${errText}`);
  }

  const created = await createRes.json();
  return created.id;
}

// Cria uma venda no Conta Azul (Venda de Serviços ou Venda de Produtos)
export async function createContaAzulSale(salePayload) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Conta Azul não autenticado ou token expirado.');

  const res = await fetch(`${BASE_API_URL}/v1/sales`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(salePayload)
  });

  const responseBody = await res.text();
  let json;
  try {
    json = JSON.parse(responseBody);
  } catch {
    json = { raw: responseBody };
  }

  if (!res.ok) {
    console.error('Erro na criação de venda no Conta Azul:', responseBody);
    return { success: false, error: responseBody, status: res.status };
  }

  return { success: true, data: json };
}

// Obtém os detalhes atualizados de uma venda e da respectiva NF no Conta Azul
export async function getContaAzulSaleDetails(saleId) {
  const token = await getValidAccessToken();
  if (!token) return { success: false, error: 'Não autenticado no Conta Azul' };

  try {
    const res = await fetch(`${BASE_API_URL}/v1/sales/${saleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err };
    }

    const saleData = await res.json();
    return { success: true, sale: saleData };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
