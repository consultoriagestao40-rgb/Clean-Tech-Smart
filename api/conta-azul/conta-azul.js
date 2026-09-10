import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

const CLIENT_ID = process.env.CONTA_AZUL_CLIENT_ID || '5ngbq1tfnlm0aklaa8tun7v8vu';
const CLIENT_SECRET = process.env.CONTA_AZUL_CLIENT_SECRET || '12682kvjplg1cfokkj97qgllce92e9mi9vt59b3i9bef9556o5gh';
export const BASE_API_URL = 'https://api-v2.contaazul.com';
export const SALES_API_URL = 'https://api.contaazul.com';

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
      ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP;
    `, [key, value]);
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

    // Se temos accessToken e expiresAt é futuro, faz verificação rápida de validade
    if (accessToken && expiresAt > Date.now()) {
      try {
        const testRes = await fetch(`${SALES_API_URL}/v1/sales?size=1`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (testRes.ok || testRes.status === 200) {
          return accessToken;
        }
      } catch (e) {
        // ignora erro de rede temporario
      }
    }

    // Se o token falhou ou expirou, tenta renovar com refresh_token
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
      } else {
        const errText = await tokenRes.text();
        console.warn('Falha ao renovar token no Conta Azul:', errText);
        if (errText.includes('invalid_grant') || tokenRes.status === 400 || tokenRes.status === 401) {
          // Tokens revogados ou expirados definitivamente: limpar para forçar reconexão limpa
          await client.query("DELETE FROM system_settings WHERE key IN ('conta_azul_access_token', 'conta_azul_refresh_token', 'conta_azul_expires_at')");
        }
      }
    }

    return null;
  } finally {
    client.release();
  }
}

// Busca ou cadastra cliente no Conta Azul (compatível com v2 /v1/pessoas e v1 /v1/customers)
export async function findOrCreateContaAzulCustomer(clientData) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Conta Azul não autenticado ou token expirado.');

  const documentClean = (clientData.document || '').replace(/\D/g, '');
  const clientName = (clientData.name || '').trim();

  // Helper para testar múltiplos endpoints de busca
  async function trySearch(url) {
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.content || data.items || data.pessoas || data.customers || []);
        if (list.length > 0) {
          // Se tiver busca por documento, tenta encontrar exato
          if (documentClean) {
            const matchDoc = list.find(c => {
              const doc = (c.document || c.cpf_cnpj || c.cpfCnpj || c.cnpj || c.cpf || '').replace(/\D/g, '');
              return doc === documentClean;
            });
            if (matchDoc) return matchDoc.id;
          }
          // Se tiver busca por nome
          if (clientName) {
            const matchName = list.find(c => {
              const n = (c.name || c.nome || c.razao_social || c.company_name || '').toLowerCase();
              return n.includes(clientName.toLowerCase()) || clientName.toLowerCase().includes(n);
            });
            if (matchName) return matchName.id;
          }
          return list[0].id;
        }
      }
    } catch (e) {
      console.warn(`Aviso na busca Conta Azul (${url}):`, e.message);
    }
    return null;
  }

  // 1. Busca na API v2 (/v1/pessoas) por documento e nome
  if (documentClean) {
    const idByDoc = await trySearch(`${BASE_API_URL}/v1/pessoas?busca=${encodeURIComponent(documentClean)}`);
    if (idByDoc) return idByDoc;
    
    // Tenta formato formatado caso o Conta Azul espere com pontuação
    const formattedDoc = clientData.document?.trim();
    if (formattedDoc && formattedDoc !== documentClean) {
      const idByFmtDoc = await trySearch(`${BASE_API_URL}/v1/pessoas?busca=${encodeURIComponent(formattedDoc)}`);
      if (idByFmtDoc) return idByFmtDoc;
    }
  }

  if (clientName) {
    const idByName = await trySearch(`${BASE_API_URL}/v1/pessoas?busca=${encodeURIComponent(clientName)}`);
    if (idByName) return idByName;
  }

  // 2. Busca de fallback na rota /v1/customers
  if (documentClean) {
    const idByCustDoc = await trySearch(`${BASE_API_URL}/v1/customers?search=${encodeURIComponent(documentClean)}`) ||
                        await trySearch(`${BASE_API_URL}/v1/customers?document=${encodeURIComponent(documentClean)}`);
    if (idByCustDoc) return idByCustDoc;
  }

  if (clientName) {
    const idByCustName = await trySearch(`${BASE_API_URL}/v1/customers?name=${encodeURIComponent(clientName)}`) ||
                         await trySearch(`${BASE_API_URL}/v1/customers?search=${encodeURIComponent(clientName)}`);
    if (idByCustName) return idByCustName;
  }

  // 3. Se não encontrou nenhuma pessoa, tenta criar
  const isCnpj = documentClean.length > 11;
  const newCustomerPayload = {
    name: clientName || 'Cliente Sem Nome',
    company_name: isCnpj ? clientName : undefined,
    person_type: isCnpj ? 'LEGAL' : 'NATURAL',
    document: documentClean || undefined,
    email: clientData.email || undefined,
    business_phone: clientData.phone || undefined,
    mobile_phone: clientData.phone || undefined
  };

  // Tenta criar primeiro via /v1/pessoas (API v2)
  const v2Payload = {
    nome: clientName || 'Cliente Sem Nome',
    tipo_pessoa: isCnpj ? 'JURIDICA' : 'FISICA',
    cpf_cnpj: documentClean || undefined,
    email: clientData.email || undefined,
    telefone: clientData.phone || undefined
  };

  try {
    const v2Res = await fetch(`${BASE_API_URL}/v1/pessoas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(v2Payload)
    });

    if (v2Res.ok) {
      const createdV2 = await v2Res.json();
      if (createdV2?.id) return createdV2.id;
    }
  } catch (errV2) {
    console.warn('Tentativa via /v1/pessoas falhou, tentando /v1/customers:', errV2.message);
  }

  // Fallback para /v1/customers
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
    console.warn('Resposta ao cadastrar cliente no Conta Azul:', errText);

    // Se avisou que já existe ou está duplicado, faz varredura ampla para pegar o ID existente
    if (errText.toLowerCase().includes('existe') || errText.toLowerCase().includes('duplicad') || errText.toLowerCase().includes('already') || createRes.status === 400 || createRes.status === 409) {
      // Tenta listar as pessoas mais recentes
      try {
        const listRes = await fetch(`${BASE_API_URL}/v1/pessoas?tamanho_pagina=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          const items = Array.isArray(listData) ? listData : (listData.content || listData.items || []);
          const found = items.find(i => {
            const doc = (i.cpf_cnpj || i.document || '').replace(/\D/g, '');
            const n = (i.nome || i.name || '').toLowerCase();
            return (documentClean && doc === documentClean) || (clientName && n.includes(clientName.toLowerCase()));
          });
          if (found?.id) return found.id;
        }
      } catch (scanErr) {
        console.warn('Erro na varredura:', scanErr);
      }
    }

    throw new Error(`Falha no cadastro do cliente no Conta Azul: ${errText}`);
  }

  const created = await createRes.json();
  return created.id;
}

// Cria uma venda no Conta Azul (Venda de Serviços ou Venda de Produtos)
export async function createContaAzulSale(salePayload) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Conta Azul não autenticado ou token expirado.');

  const res = await fetch(`${SALES_API_URL}/v1/sales`, {
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

// Obtém os detalhes atualizados de uma venda e da respectiva NF no Conta Azul (por UUID ou por número de venda)
export async function getContaAzulSaleDetails(saleIdOrNumber) {
  const token = await getValidAccessToken();
  if (!token) return { success: false, error: 'Não autenticado no Conta Azul' };

  const clean = String(saleIdOrNumber).trim().replace('#', '');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

  try {
    // 1. Se for formato UUID, tenta buscar direto pela rota /v1/sales/{id}
    if (isUuid) {
      const res = await fetch(`${SALES_API_URL}/v1/sales/${clean}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const saleData = await res.json();
        return { success: true, sale: saleData };
      }
    }

    // 2. Se for número ou falhou por UUID, tenta buscar por query ?number=...
    const numRes = await fetch(`${SALES_API_URL}/v1/sales?number=${encodeURIComponent(clean)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (numRes.ok) {
      const numData = await numRes.json();
      const numItems = Array.isArray(numData) ? numData : (numData.content || numData.items || []);
      if (numItems.length > 0) {
        const detailRes = await fetch(`${SALES_API_URL}/v1/sales/${numItems[0].id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (detailRes.ok) {
          const fullSale = await detailRes.json();
          return { success: true, sale: fullSale };
        }
        return { success: true, sale: numItems[0] };
      }
    }

    // 3. Fallback: varredura em lista de vendas recentes
    const listRes = await fetch(`${SALES_API_URL}/v1/sales?page=1&size=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      const items = Array.isArray(listData) ? listData : (listData.content || listData.items || []);
      const found = items.find(s => String(s.number) === clean || String(s.id) === clean);
      if (found) {
        const detailRes = await fetch(`${SALES_API_URL}/v1/sales/${found.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (detailRes.ok) {
          const fullSale = await detailRes.json();
          return { success: true, sale: fullSale };
        }
        return { success: true, sale: found };
      }
    }

    return { success: false, error: 'Venda não localizada no Conta Azul' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
