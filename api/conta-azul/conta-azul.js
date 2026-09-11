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

    const now = Date.now();

    // 1. Se temos accessToken e ainda é válido (com margem de 60 segundos), retorna direto
    if (accessToken && expiresAt > (now + 60000)) {
      return accessToken;
    }

    // 2. Se está prestes a expirar ou expirou, tenta renovar com refresh_token
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

        // Se falhou ao renovar, mas outro processo concorrente já pode ter salvo um novo token:
        const checkRes = await client.query("SELECT value FROM system_settings WHERE key = 'conta_azul_access_token'");
        if (checkRes.rows.length > 0 && checkRes.rows[0].value && checkRes.rows[0].value !== accessToken) {
          return checkRes.rows[0].value;
        }

        // Se o accessToken ainda tem alguns instantes de validade
        if (accessToken && expiresAt > now) {
          return accessToken;
        }

        // Só remove se explicitamente for invalid_grant
        if (errText.includes('invalid_grant')) {
          await client.query("DELETE FROM system_settings WHERE key IN ('conta_azul_access_token', 'conta_azul_refresh_token', 'conta_azul_expires_at')");
        }
      }
    }

    // 3. Fallback: se ainda tem accessToken não expirado
    if (accessToken && expiresAt > now) {
      return accessToken;
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
        const list = Array.isArray(data) ? data : (data.content || data.items || data.pessoas || []);
        if (list.length > 0) {
          // Se tiver busca por documento, tenta encontrar exato
          if (documentClean) {
            const matchDoc = list.find(c => {
              const doc = (c.documento || c.document || c.cpf_cnpj || c.cpfCnpj || c.cnpj || c.cpf || '').replace(/\D/g, '');
              return doc === documentClean;
            });
            if (matchDoc) return matchDoc.id;
          }
          // Se tiver busca por nome
          if (clientName) {
            const matchName = list.find(c => {
              const n = (c.nome || c.name || c.razao_social || c.company_name || '').toLowerCase();
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
  }

  if (clientName) {
    const idByName = await trySearch(`${BASE_API_URL}/v1/pessoas?busca=${encodeURIComponent(clientName)}`);
    if (idByName) return idByName;
  }

  // 2. Se não encontrou nenhuma pessoa, cria via API v2 oficial (/v1/pessoas)
  const isCnpj = documentClean.length > 11;
  const v2Payload = {
    nome: clientName || 'Cliente Sem Nome',
    tipo_pessoa: isCnpj ? 'Jurídica' : 'Física',
    documento: documentClean || undefined,
    email: clientData.email || undefined,
    telefone: clientData.phone || undefined,
    perfis: [
      { tipo_perfil: 'Cliente' }
    ]
  };

  const createRes = await fetch(`${BASE_API_URL}/v1/pessoas`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(v2Payload)
  });

  if (createRes.ok) {
    const createdV2 = await createRes.json();
    if (createdV2?.id) return createdV2.id;
  }

  const errText = await createRes.text();
  console.warn('Resposta ao cadastrar pessoa no Conta Azul:', errText);

  // Se avisou que já existe ou deu duplicidade, faz varredura na listagem
  try {
    const listRes = await fetch(`${BASE_API_URL}/v1/pessoas?tamanho_pagina=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (listRes.ok) {
      const listData = await listRes.json();
      const items = Array.isArray(listData) ? listData : (listData.items || listData.content || []);
      const found = items.find(i => {
        const doc = (i.documento || i.cpf_cnpj || i.document || '').replace(/\D/g, '');
        const n = (i.nome || i.name || '').toLowerCase();
        return (documentClean && doc === documentClean) || (clientName && n.includes(clientName.toLowerCase()));
      });
      if (found?.id) return found.id;
    }
  } catch (scanErr) {
    console.warn('Erro na varredura de pessoas no Conta Azul:', scanErr);
  }

  throw new Error(`Falha no cadastro do cliente no Conta Azul: ${errText}`);
}

// Cria uma venda no Conta Azul (compatível com API v2 /v1/venda)
export async function createContaAzulSale(salePayload) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Conta Azul não autenticado ou token expirado.');

  try {
    // 1. Obter próximo número sequencial da venda no Conta Azul
    let saleNumber = salePayload.numero;
    if (!saleNumber) {
      try {
        const numRes = await fetch(`${BASE_API_URL}/v1/venda/proximo-numero`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (numRes.ok) {
          const numText = await numRes.text();
          saleNumber = parseInt(numText, 10) || undefined;
        }
      } catch (numErr) {
        console.warn('Erro ao obter proximo-numero:', numErr);
      }
    }

    // 2. Se a chamada enviou formato legado (customer_id, services/products), converter para formato API v2
    let v2Body = salePayload;
    if (salePayload.customer_id || !salePayload.id_cliente) {
      // Obter serviço padrão do catálogo da Conta Azul
      let serviceId = null;
      try {
        const sRes = await fetch(`${BASE_API_URL}/v1/servicos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          const items = Array.isArray(sData) ? sData : (sData.itens || sData.items || []);
          const isLocacao = (salePayload.services?.[0]?.description || '').toLowerCase().includes('loca');
          const matched = isLocacao
            ? (items.find(s => (s.descricao || '').toLowerCase().includes('loca')) || items[0])
            : (items.find(s => (s.descricao || '').toLowerCase().includes('manuten') || (s.descricao || '').toLowerCase().includes('assist')) || items[0]);
          if (matched?.id) serviceId = matched.id;
        }
      } catch (sErr) {
        console.warn('Erro ao buscar servicos no Conta Azul:', sErr);
      }

      // Montar itens no formato da API v2
      const servicesList = salePayload.services || [];
      const productsList = salePayload.products || [];
      const rawItems = [...servicesList, ...productsList];

      const v2Itens = rawItems.map(item => ({
        id: serviceId || '888d2fdd-4ea6-4151-8f4c-5ff4589de44e', // fallback para serviço de Locação existente
        descricao: item.description || 'Locação de Equipamento',
        valor: Number(item.value || 0),
        quantidade: Number(item.quantity || 1)
      }));

      // Calcular valor total e montar parcelas
      const installments = salePayload.payment?.installments || [];
      const totalVal = v2Itens.reduce((sum, it) => sum + (it.valor * it.quantidade), 0);

      const v2Parcelas = installments.length > 0
        ? installments.map(p => ({
            numero: p.number || 1,
            valor: Number(p.value || totalVal),
            data_vencimento: p.due_date || new Date().toISOString().split('T')[0]
          }))
        : [{
            numero: 1,
            valor: totalVal,
            data_vencimento: new Date().toISOString().split('T')[0]
          }];

      v2Body = {
        id_cliente: salePayload.customer_id,
        numero: saleNumber || 10000,
        situacao: 'EM_ANDAMENTO',
        data_venda: salePayload.emission || new Date().toISOString().split('T')[0],
        observacoes: salePayload.notes || '',
        itens: v2Itens,
        condicao_pagamento: {
          opcao_condicao_pagamento: `${v2Parcelas.length}x`,
          parcelas: v2Parcelas
        }
      };
    }

    // 3. Efetua a criação da venda na API v2 (/v1/venda)
    const res = await fetch(`${BASE_API_URL}/v1/venda`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(v2Body)
    });

    const responseBody = await res.text();
    let json;
    try {
      json = JSON.parse(responseBody);
    } catch {
      json = { raw: responseBody };
    }

    if (!res.ok) {
      console.error('Erro na criação de venda no Conta Azul (v2):', responseBody);
      return { success: false, error: responseBody, status: res.status };
    }

    return { success: true, data: json };
  } catch (err) {
    console.error('Exceção ao criar venda no Conta Azul:', err);
    return { success: false, error: err.message };
  }
}

// Obtém os detalhes atualizados de uma venda e da respectiva NF no Conta Azul (compatível com API v2)
export async function getContaAzulSaleDetails(saleIdOrNumber) {
  const token = await getValidAccessToken();
  if (!token) return { success: false, error: 'Não autenticado no Conta Azul' };

  const clean = String(saleIdOrNumber).trim().replace('#', '');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

  try {
    let saleData = null;
    let saleUuid = null;

    // 1. Se for formato UUID, tenta buscar direto pela rota /v1/venda/{id} (API v2)
    if (isUuid) {
      try {
        const res = await fetch(`${BASE_API_URL}/v1/venda/${clean}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (res.ok) {
          saleData = await res.json();
          saleUuid = clean;
        }
      } catch (e) {}
    }

    // 2. Se for número ou falhou por UUID, tenta varrer vendas recentes
    if (!saleData) {
      for (const page of [18, 17, 19, 1, 2]) {
        try {
          const listRes = await fetch(`${BASE_API_URL}/v1/venda/busca?tamanho_pagina=50&pagina=${page}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          if (listRes.ok) {
            const listJson = await listRes.json();
            const items = listJson.itens || [];
            const match = items.find(it => String(it.numero) === clean || String(it.id) === clean);
            if (match) {
              saleUuid = match.id;
              const detailRes = await fetch(`${BASE_API_URL}/v1/venda/${saleUuid}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
              });
              if (detailRes.ok) {
                saleData = await detailRes.json();
              }
              break;
            }
          }
        } catch (e) {}
      }
    }

    if (!saleData && !saleUuid) {
      return { success: false, error: 'Venda não localizada no Conta Azul' };
    }

    const v = saleData?.venda || saleData || {};
    const cliente = saleData?.cliente || {};
    const valorTotal = v.composicao_valor?.valor_liquido || v.composicao_valor?.valor_bruto || v.total || 0;
    const parcelas = v.condicao_pagamento?.parcelas || [];
    const situacao = v.situacao?.nome || v.status || 'FATURADO';

    // Buscar NF vinculada na API v2 (/v1/notas-fiscais)
    let nfInfo = {
      number: null,
      status: 'Não emitida',
      chave: null
    };

    if (saleUuid) {
      try {
        const saleDate = v.data_compromisso || new Date().toISOString().split('T')[0];
        const d = new Date(saleDate);
        const dStart = new Date(d.getTime() - 7 * 86400000).toISOString().split('T')[0];
        const dEnd = new Date(d.getTime() + 7 * 86400000).toISOString().split('T')[0];

        const nfRes = await fetch(`${BASE_API_URL}/v1/notas-fiscais?data_inicial=${dStart}&data_final=${dEnd}&id_venda=${saleUuid}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (nfRes.ok) {
          const nfData = await nfRes.json();
          if (nfData.itens && nfData.itens.length > 0) {
            const firstNf = nfData.itens[0];
            nfInfo.number = firstNf.numero_nota;
            nfInfo.status = firstNf.status === 'EMITIDA' ? 'Emitida / Autorizada' : firstNf.status;
            nfInfo.chave = firstNf.chave_acesso;
          }
        }
      } catch (nfErr) {
        console.warn('Erro ao consultar NF da venda:', nfErr);
      }
    }

    const printPdfUrl = `${BASE_API_URL}/v1/venda/${saleUuid}/imprimir`;

    const normalizedSale = {
      id: saleUuid || v.id,
      number: v.numero || clean,
      status: situacao,
      financial_status: situacao,
      total: valorTotal,
      due_date: parcelas.length > 0 ? parcelas[0].data_vencimento : null,
      emission: v.data_compromisso,
      pdf_url: printPdfUrl,
      nfe: {
        number: nfInfo.number,
        status: nfInfo.status,
        chave: nfInfo.chave,
        pdf_url: printPdfUrl
      },
      client: {
        name: cliente.nome,
        document: cliente.documento
      },
      installments: parcelas.map(p => ({
        id: p.id,
        number: p.numero,
        value: p.valor,
        due_date: p.data_vencimento,
        status: situacao === 'LIQUIDADO' || situacao === 'PAGO' ? 'PAID' : 'PENDING'
      }))
    };

    return {
      success: true,
      sale: normalizedSale
    };
  } catch (err) {
    console.error('Erro em getContaAzulSaleDetails:', err);
    return { success: false, error: err.message };
  }
}
