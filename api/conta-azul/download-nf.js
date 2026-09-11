import { Pool } from 'pg';
import { getContaAzulSaleDetails, getValidAccessToken, BASE_API_URL } from './conta-azul.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

function formatCurrency(val) {
  const num = parseFloat(val || 0);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCnpjCpf(val) {
  const clean = String(val || '').replace(/\D/g, '');
  if (clean.length === 14) {
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }
  if (clean.length === 11) {
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  return val || '';
}

function formatCep(val) {
  const clean = String(val || '').replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }
  return val || '';
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  if (isoStr.includes('-')) {
    const datePart = isoStr.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return isoStr;
}

function formatTime(isoStr) {
  if (!isoStr) return '';
  if (isoStr.includes('T')) {
    const timePart = isoStr.split('T')[1];
    return timePart.substring(0, 8);
  }
  return '';
}

function formatChave(chave) {
  const clean = String(chave || '').replace(/\D/g, '');
  return clean.replace(/(\d{4})/g, '$1 ').trim();
}

function parseXmlField(xml, tag, parentContext = null) {
  const target = parentContext ? parentContext : xml;
  const match = target.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
  return match ? match[1].trim() : '';
}

export default async function handler(req, res) {
  const { invoiceId, saleId, type } = req.query;

  if (!invoiceId && !saleId) {
    return res.status(400).json({ error: 'Informe o ID da fatura ou da venda.' });
  }

  const client = await pool.connect();

  try {
    let targetSaleId = saleId;
    let inv = null;

    if (invoiceId) {
      const invRes = await client.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
      if (invRes.rows.length === 0) {
        return res.status(404).json({ error: 'Fatura não encontrada.' });
      }
      inv = invRes.rows[0];
      targetSaleId = inv.conta_azul_sale_id;
    }

    if (!targetSaleId) {
      return res.status(400).json({ error: 'Esta fatura ainda não possui venda vinculada no Conta Azul.' });
    }

    let token = await getValidAccessToken();

    // Se a sessão expirou, redireciona para autorização com retorno automático
    if (!token) {
      const host = req.headers.host || 'clean-tech-smart.vercel.app';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const redirectUri = process.env.CONTA_AZUL_REDIRECT_URI || `${protocol}://${host}/api/conta-azul/callback`;
      const returnTo = req.url || `/api/conta-azul/download-nf?invoiceId=${invoiceId}`;
      const state = Buffer.from(JSON.stringify({ returnTo })).toString('base64');

      const authUrl = `https://login.contaazul.com/#/oauth/authorize?` + new URLSearchParams({
        response_type: 'code',
        client_id: process.env.CONTA_AZUL_CLIENT_ID || '5ngbq1tfnlm0aklaa8tun7v8vu',
        redirect_uri: redirectUri,
        state: state,
        scope: 'openid profile aws.cognito.signin.user.admin'
      }).toString();

      if (req.query.format === 'json') {
        return res.status(401).json({ error: 'Conta Azul não autenticado ou sessão expirada.', authUrl });
      }
      return res.redirect(authUrl);
    }

    // 1. Obter detalhes da venda e da NF no Conta Azul
    const caResult = await getContaAzulSaleDetails(targetSaleId);
    if (!caResult.success || !caResult.sale) {
      return res.status(404).json({ error: 'Venda não localizada no Conta Azul: ' + (caResult.error || 'Erro desconhecido') });
    }

    const s = caResult.sale;
    let chaveAcesso = s.nfe?.chave || null;

    // Se ainda não temos a chave de acesso, tenta buscar nas notas fiscais do Conta Azul
    if (!chaveAcesso && s.id) {
      try {
        const saleDate = s.emission || new Date().toISOString().split('T')[0];
        const d = new Date(saleDate);
        const dStart = new Date(d.getTime() - 7 * 86400000).toISOString().split('T')[0];
        const dEnd = new Date(d.getTime() + 7 * 86400000).toISOString().split('T')[0];

        const nfRes = await fetch(`${BASE_API_URL}/v1/notas-fiscais?data_inicial=${dStart}&data_final=${dEnd}&id_venda=${s.id}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (nfRes.ok) {
          const nfData = await nfRes.json();
          if (nfData.itens && nfData.itens.length > 0) {
            chaveAcesso = nfData.itens[0].chave_acesso;
            s.nfe.number = nfData.itens[0].numero_nota;
            s.nfe.status = nfData.itens[0].status;
          }
        }
      } catch (e) {}
    }

    // Se for solicitado debug para inspecionar endpoints e dados da NF no Conta Azul
    if (req.query.debug === '1') {
      const probeUrls = [
        `${BASE_API_URL}/v1/notas-fiscais/${chaveAcesso}/pdf`,
        `${BASE_API_URL}/v1/notas-fiscais/${chaveAcesso}/danfe`,
        `${BASE_API_URL}/v1/notas-fiscais/${chaveAcesso}/imprimir`,
        `${BASE_API_URL}/v1/notas-fiscais/${chaveAcesso}/download`,
        `${BASE_API_URL}/v1/venda/${targetSaleId}/imprimir`,
        `${BASE_API_URL}/v1/notas-fiscais?id_venda=${targetSaleId}`
      ];
      const results = {};
      for (const u of probeUrls) {
        try {
          const r = await fetch(u, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': '*/*' } });
          const contentType = r.headers.get('content-type') || '';
          results[u] = { status: r.status, ok: r.ok, contentType };
          if (contentType.includes('json')) {
            results[u].body = await r.json();
          } else if (contentType.includes('pdf')) {
            results[u].isPdf = true;
          }
        } catch (err) {
          results[u] = { error: err.message };
        }
      }
      return res.json({ chaveAcesso, sale: s, probes: results });
    }

    // 2. Se temos a chave de acesso, tenta primeiro obter o PDF nativo oficial da Conta Azul
    let nativePdfBuffer = null;
    if (chaveAcesso) {
      const candidatePdfUrls = [
        `${BASE_API_URL}/v1/notas-fiscais/${chaveAcesso}/pdf`,
        `${BASE_API_URL}/v1/notas-fiscais/${chaveAcesso}/danfe`,
        `${BASE_API_URL}/v1/notas-fiscais/${chaveAcesso}/imprimir`,
        `${BASE_API_URL}/v1/notas-fiscais/${chaveAcesso}/download`
      ];

      for (const pdfUrl of candidatePdfUrls) {
        try {
          const pdfRes = await fetch(pdfUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/pdf, */*'
            }
          });
          const ct = pdfRes.headers.get('content-type') || '';
          if (pdfRes.ok && ct.includes('pdf')) {
            nativePdfBuffer = await pdfRes.arrayBuffer();
            break;
          }
        } catch (e) {}
      }

      // Se a Conta Azul retornou o PDF nativo oficial (141_0.pdf)
      if (nativePdfBuffer && type !== 'xml') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${s.nfe?.number || '141'}_0.pdf"`);
        return res.send(Buffer.from(nativePdfBuffer));
      }
    }

    // 3. Se não tiver endpoint de PDF binário na Conta Azul, busca o XML oficial da NF-e
    let xmlData = null;
    if (chaveAcesso) {
      try {
        const xmlRes = await fetch(`${BASE_API_URL}/v1/notas-fiscais/${chaveAcesso}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (xmlRes.ok) {
          xmlData = await xmlRes.text();
        }
      } catch (xmlErr) {
        console.warn('Erro ao buscar XML da NF-e:', xmlErr);
      }
    }

    // Se o usuário solicitou o download do XML da SEFAZ
    if (type === 'xml' && xmlData) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="NFe_${chaveAcesso}.xml"`);
      return res.send(xmlData);
    }

    // Se temos o XML da NF-e, renderizamos o DANFE oficial idêntico ao modelo SEFAZ
    if (xmlData) {
      // Extração de dados da NFe
      const nProt = parseXmlField(xmlData, 'nProt');
      const dhRecbto = parseXmlField(xmlData, 'dhRecbto');
      const nNF = parseXmlField(xmlData, 'nNF') || s.nfe?.number || '141';
      const serie = parseXmlField(xmlData, 'serie') || '0';
      const tpNF = parseXmlField(xmlData, 'tpNF') || '1';
      const natOp = parseXmlField(xmlData, 'natOp') || 'Venda de Mercadorias / Produtos';
      const dhEmi = parseXmlField(xmlData, 'dhEmi') || new Date().toISOString();
      const dhSaiEnt = parseXmlField(xmlData, 'dhSaiEnt') || dhEmi;

      // Emitente
      const emitMatch = xmlData.match(/<emit>([\s\S]*?)<\/emit>/);
      const emitXml = emitMatch ? emitMatch[1] : '';
      const emitNome = parseXmlField(emitXml, 'xNome') || 'CLEAN TECH PRO - LOCACOES E ASSISTENCIA TECNICA LTDA';
      const emitFant = parseXmlField(emitXml, 'xFant') || 'CLEAN TECH PRO';
      const emitCnpj = parseXmlField(emitXml, 'CNPJ') || '43158052000101';
      const emitIe = parseXmlField(emitXml, 'IE') || '9110140336';
      const emitLgr = parseXmlField(emitXml, 'xLgr') || 'Avenida Maringa';
      const emitNro = parseXmlField(emitXml, 'nro') || '1273';
      const emitCpl = parseXmlField(emitXml, 'xCpl') || 'LADO A';
      const emitBairro = parseXmlField(emitXml, 'xBairro') || 'Emiliano Perneta';
      const emitMun = parseXmlField(emitXml, 'xMun') || 'Pinhais';
      const emitUf = parseXmlField(emitXml, 'UF') || 'PR';
      const emitCep = parseXmlField(emitXml, 'CEP') || '83324432';
      const emitFone = parseXmlField(emitXml, 'fone') || '4192239200';

      // Destinatário
      const destMatch = xmlData.match(/<dest>([\s\S]*?)<\/dest>/);
      const destXml = destMatch ? destMatch[1] : '';
      const destNome = parseXmlField(destXml, 'xNome') || s.client?.name || 'Cliente';
      const destCnpj = parseXmlField(destXml, 'CNPJ') || parseXmlField(destXml, 'CPF') || s.client?.document || '';
      const destIe = parseXmlField(destXml, 'IE') || 'ISENTO';
      const destLgr = parseXmlField(destXml, 'xLgr') || '';
      const destNro = parseXmlField(destXml, 'nro') || '';
      const destBairro = parseXmlField(destXml, 'xBairro') || '';
      const destMun = parseXmlField(destXml, 'xMun') || '';
      const destUf = parseXmlField(destXml, 'UF') || '';
      const destCep = parseXmlField(destXml, 'CEP') || '';
      const destFone = parseXmlField(destXml, 'fone') || '';

      // Totais
      const totalMatch = xmlData.match(/<ICMSTot>([\s\S]*?)<\/ICMSTot>/);
      const totXml = totalMatch ? totalMatch[1] : '';
      const vBC = parseXmlField(totXml, 'vBC') || '0.00';
      const vICMS = parseXmlField(totXml, 'vICMS') || '0.00';
      const vBCST = parseXmlField(totXml, 'vBCST') || '0.00';
      const vST = parseXmlField(totXml, 'vST') || '0.00';
      const vProd = parseXmlField(totXml, 'vProd') || String(s.total || 0);
      const vFrete = parseXmlField(totXml, 'vFrete') || '0.00';
      const vSeg = parseXmlField(totXml, 'vSeg') || '0.00';
      const vDesc = parseXmlField(totXml, 'vDesc') || '0.00';
      const vIPI = parseXmlField(totXml, 'vIPI') || '0.00';
      const vNF = parseXmlField(totXml, 'vNF') || String(s.total || 0);

      const emitIm = parseXmlField(emitXml, 'IM') || '84054';

      // Itens
      const detMatches = xmlData.match(/<det\b[\s\S]*?<\/det>/g) || [];
      const itens = detMatches.map(detXml => {
        const qCom = parseXmlField(detXml, 'qCom') || '1';
        const vUnCom = parseXmlField(detXml, 'vUnCom') || '0';
        return {
          cProd: parseXmlField(detXml, 'cProd'),
          xProd: parseXmlField(detXml, 'xProd'),
          NCM: parseXmlField(detXml, 'NCM'),
          CFOP: parseXmlField(detXml, 'CFOP') || '5102',
          uCom: parseXmlField(detXml, 'uCom') || 'JG',
          qCom: parseFloat(qCom).toFixed(0),
          vUnCom: parseFloat(vUnCom).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
          vProd: parseXmlField(detXml, 'vProd') || '0',
          vBC: parseXmlField(detXml, 'vBC') || '0.00',
          vICMS: parseXmlField(detXml, 'vICMS') || '0.00',
          vIPI: parseXmlField(detXml, 'vIPI') || '0.00',
          pICMS: parseXmlField(detXml, 'pICMS') || '0',
          pIPI: parseXmlField(detXml, 'pIPI') || '0',
          CST: parseXmlField(detXml, 'CSOSN') || parseXmlField(detXml, 'CST') || '0102'
        };
      });

      // Duplicatas
      const dupMatches = xmlData.match(/<dup\b[\s\S]*?<\/dup>/g) || [];
      const duplicatas = dupMatches.map(dupXml => ({
        nDup: parseXmlField(dupXml, 'nDup') || '001',
        dVenc: parseXmlField(dupXml, 'dVenc') || '',
        vDup: parseXmlField(dupXml, 'vDup') || vNF
      }));

      if (duplicatas.length === 0 && s.due_date) {
        duplicatas.push({ nDup: '001', dVenc: s.due_date, vDup: vNF });
      }

      // Dados Adicionais
      const infCpl = (parseXmlField(xmlData, 'infCpl') || '')
        .replace(/#/g, '<br/>')
        .trim() || 'DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL.<br/>NAO GERA DIREITO A CREDITO FISCAL DE IPI.';

      const htmlDanfe = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>DANFE NF-e Nº ${nNF} - Série ${serie} - ${destNome}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 7.5px; color: #000; background: #525659; padding: 10px 0; }
    .danfe-sheet { width: 204mm; max-width: 204mm; margin: 0 auto; background: #fff; padding: 3mm 4mm; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    .b { font-weight: bold; }
    .border { border: 1px solid #000; }
    .border-b { border-bottom: 1px solid #000; }
    .border-r { border-right: 1px solid #000; }
    .border-t { border-top: 1px solid #000; }
    .border-l { border-left: 1px solid #000; }
    .title-box { font-size: 5.5px; font-weight: bold; text-transform: uppercase; color: #000; padding: 1px 2px 0; display: block; line-height: 1; }
    .value-box { font-size: 8px; font-weight: bold; padding: 0.5px 2px 1px; min-height: 11px; line-height: 1.15; word-break: break-word; }
    .table-danfe { width: 100%; border-collapse: collapse; }
    .table-danfe th, .table-danfe td { border: 1px solid #000; padding: 1.5px 2px; font-size: 6.8px; text-align: left; }
    .table-danfe th { font-size: 5.8px; text-transform: uppercase; font-weight: bold; background: #fff; }
    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .canhoto { border-bottom: 1px dashed #000; padding-bottom: 2px; margin-bottom: 2px; }
    .sec-title { font-size: 6px; font-weight: bold; margin-bottom: 1px; text-transform: uppercase; }
    
    /* Top Bar */
    .top-actions { position: sticky; top: 0; z-index: 1000; background: #1e293b; color: #fff; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.2); max-width: 204mm; margin: 0 auto 10px; border-radius: 6px; }
    .top-btn { padding: 6px 14px; border-radius: 4px; font-size: 11px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; border: none; }
    .btn-print { background: #0284c7; color: #fff; }
    .btn-print:hover { background: #0369a1; }
    .btn-xml { background: #334155; color: #fff; border: 1px solid #64748b; }
    .btn-xml:hover { background: #475569; }

    @media print {
      @page { size: A4 portrait; margin: 3mm 4mm; }
      html, body { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; background: #fff !important; overflow: hidden !important; }
      .danfe-sheet { width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; page-break-after: avoid !important; page-break-inside: avoid !important; }
      .no-print { display: none !important; }
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
</head>
<body>

  <!-- Barra de Ações Superior -->
  <div class="top-actions no-print">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 13px; font-weight: bold; color: #38bdf8;">DANFE NF-e Nº ${nNF}</span>
      <span style="font-size: 10px; background: #0f766e; color: #ccfbf1; padding: 2px 8px; font-weight: bold; border-radius: 12px;">AUTORIZADA SEFAZ</span>
    </div>
    <div style="display: flex; gap: 10px;">
      <a href="/api/conta-azul/download-nf?invoiceId=${inv?.id || ''}&type=xml" target="_blank" class="top-btn btn-xml">
        📥 Baixar XML SEFAZ
      </a>
      <button onclick="window.print()" class="top-btn btn-print">
        🖨️ Imprimir / Salvar PDF
      </button>
    </div>
  </div>

  <div class="danfe-sheet">
    
    <!-- 1. CANHOTO DE RECEBIMENTO -->
    <div class="canhoto">
      <div style="display: flex; gap: 3px; align-items: stretch;">
        <div class="border" style="flex: 1;">
          <div style="padding: 1px 3px; font-size: 6.5px; line-height: 1.15;">
            RECEBEMOS DE <b>${emitNome}</b> OS PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO.
          </div>
          <div style="display: flex; border-top: 1px solid #000; min-height: 20px;">
            <div style="width: 130px; border-right: 1px solid #000; padding: 1px 3px;">
              <span class="title-box">DATA DE RECEBIMENTO</span>
            </div>
            <div style="flex: 1; padding: 1px 3px;">
              <span class="title-box">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</span>
            </div>
          </div>
        </div>
        <div class="border text-center" style="width: 110px; display: flex; flex-direction: column; justify-content: center; padding: 2px;">
          <div style="font-size: 7.5px; font-weight: bold;">NF-e</div>
          <div style="font-size: 10px; font-weight: 900; margin: 1px 0;">Nº ${nNF}</div>
          <div style="font-size: 7.5px; font-weight: bold;">SÉRIE: ${serie}</div>
        </div>
      </div>
    </div>

    <!-- 2. CABEÇALHO DO EMITENTE & DANFE & CHAVE -->
    <div style="display: flex; gap: 3px; margin-bottom: 2px;">
      <!-- Emitente -->
      <div class="border" style="flex: 1.1; padding: 3px; display: flex; align-items: center; gap: 6px;">
        <img src="/cleantechpro-official-logo.png" alt="Clean Tech Pro" style="height: 50px; width: 60px; object-fit: contain;" onerror="this.style.display='none'" />
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; text-align: center;">
          <div style="font-size: 8.5px; font-weight: 900; text-transform: uppercase; margin-bottom: 1px; line-height: 1.15;">${emitNome}</div>
          <div style="font-size: 7.5px; color: #111; line-height: 1.25;">
            ${emitLgr}, ${emitNro}${emitCpl ? ', ' + emitCpl : ''}<br/>
            ${emitBairro} - ${formatCep(emitCep)}<br/>
            ${emitMun} - ${emitUf}<br/>
            ${emitFone}
          </div>
        </div>
      </div>

      <!-- DANFE Box -->
      <div class="border text-center" style="width: 105px; padding: 3px; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px;">DANFE</div>
        <div style="font-size: 6.5px; font-weight: bold; line-height: 1.05;">DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</div>
        <div style="margin: 2px 0; font-size: 7.5px; line-height: 1.2;">
          <div style="display: flex; justify-content: center; align-items: center; gap: 4px;">
            <div style="text-align: left; font-size: 7px;">
              <div>0 - ENTRADA</div>
              <div>1 - SAÍDA</div>
            </div>
            <span style="border: 1px solid #000; padding: 1px 5px; font-weight: 900; font-size: 9.5px;">${tpNF}</span>
          </div>
        </div>
        <div>
          <div style="font-size: 9.5px; font-weight: 900;">Nº ${nNF}</div>
          <div style="font-size: 7.5px; font-weight: bold;">SÉRIE: ${serie}</div>
          <div style="font-size: 6.5px;">FOLHA 1 / 1</div>
        </div>
      </div>

      <!-- Chave & Código de Barras -->
      <div class="border" style="flex: 1.25; padding: 3px; display: flex; flex-direction: column; justify-content: space-between; text-align: center;">
        <div style="display: flex; justify-content: center; height: 38px; margin-bottom: 1px;">
          <svg id="barcode"></svg>
        </div>
        <div class="border-t" style="padding-top: 1px;">
          <span class="title-box">CHAVE DE ACESSO</span>
          <div style="font-size: 8px; font-weight: 900; letter-spacing: 0.2px; font-family: monospace;">
            ${formatChave(chaveAcesso)}
          </div>
        </div>
        <div style="font-size: 6px; color: #333; line-height: 1.05; margin-top: 1px;">
          Consulta de autenticidade no portal nacional da NF-e<br/>
          <b>www.nfe.fazenda.gov.br/portal</b> ou no site da Sefaz Autorizadora.
        </div>
      </div>
    </div>

    <!-- 3. NATUREZA DA OPERAÇÃO & PROTOCOLO -->
    <div style="display: flex; gap: 3px; margin-bottom: 2px;">
      <div class="border" style="flex: 1.4;">
        <span class="title-box">NATUREZA DA OPERAÇÃO</span>
        <div class="value-box">${natOp}</div>
      </div>
      <div class="border" style="flex: 1;">
        <span class="title-box">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
        <div class="value-box">${nProt} ${dhRecbto ? '- ' + formatDate(dhRecbto) + ' ' + formatTime(dhRecbto) : ''}</div>
      </div>
    </div>

    <!-- 4. INSCRIÇÃO ESTADUAL & CNPJ -->
    <div style="display: flex; gap: 3px; margin-bottom: 2px;">
      <div class="border" style="flex: 1;">
        <span class="title-box">INSCRIÇÃO ESTADUAL</span>
        <div class="value-box">${emitIe}</div>
      </div>
      <div class="border" style="flex: 1;">
        <span class="title-box">INSCRIÇÃO ESTADUAL DO SUBST. TRIBUT.</span>
        <div class="value-box">-</div>
      </div>
      <div class="border" style="flex: 1;">
        <span class="title-box">CNPJ</span>
        <div class="value-box">${formatCnpjCpf(emitCnpj)}</div>
      </div>
    </div>

    <!-- 5. DESTINATÁRIO / REMETENTE -->
    <div style="margin-bottom: 2px;">
      <div class="sec-title">DESTINATÁRIO / REMETENTE</div>
      <div class="border">
        <!-- Linha 1 -->
        <div style="display: flex; border-bottom: 1px solid #000;">
          <div style="flex: 2.2; border-right: 1px solid #000;">
            <span class="title-box">NOME / RAZÃO SOCIAL</span>
            <div class="value-box">${destNome}</div>
          </div>
          <div style="flex: 1.2; border-right: 1px solid #000;">
            <span class="title-box">CNPJ / CPF</span>
            <div class="value-box">${formatCnpjCpf(destCnpj)}</div>
          </div>
          <div style="width: 80px;">
            <span class="title-box">DATA DA EMISSÃO</span>
            <div class="value-box text-center">${formatDate(dhEmi)}</div>
          </div>
        </div>
        <!-- Linha 2 -->
        <div style="display: flex; border-bottom: 1px solid #000;">
          <div style="flex: 2.2; border-right: 1px solid #000;">
            <span class="title-box">ENDEREÇO</span>
            <div class="value-box">${destLgr}${destNro ? ' , ' + destNro : ''}</div>
          </div>
          <div style="flex: 1.2; border-right: 1px solid #000;">
            <span class="title-box">BAIRRO / DISTRITO</span>
            <div class="value-box">${destBairro}</div>
          </div>
          <div style="flex: 0.8; border-right: 1px solid #000;">
            <span class="title-box">CEP</span>
            <div class="value-box">${formatCep(destCep)}</div>
          </div>
          <div style="width: 80px;">
            <span class="title-box">DATA ENTRADA / SAÍDA</span>
            <div class="value-box text-center">${formatDate(dhSaiEnt)}</div>
          </div>
        </div>
        <!-- Linha 3 -->
        <div style="display: flex;">
          <div style="flex: 1.5; border-right: 1px solid #000;">
            <span class="title-box">MUNICÍPIO</span>
            <div class="value-box">${destMun}</div>
          </div>
          <div style="flex: 1; border-right: 1px solid #000;">
            <span class="title-box">FONE / FAX</span>
            <div class="value-box">${destFone}</div>
          </div>
          <div style="width: 30px; border-right: 1px solid #000;">
            <span class="title-box">UF</span>
            <div class="value-box text-center">${destUf}</div>
          </div>
          <div style="flex: 1; border-right: 1px solid #000;">
            <span class="title-box">INSCRIÇÃO ESTADUAL</span>
            <div class="value-box">${destIe}</div>
          </div>
          <div style="width: 80px;">
            <span class="title-box">HORA DA SAÍDA</span>
            <div class="value-box text-center">${formatTime(dhSaiEnt)}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. FATURA / DUPLICATAS -->
    <div style="margin-bottom: 2px;">
      <div class="sec-title">FATURA / DUPLICATA</div>
      <div class="border" style="display: flex; flex-wrap: wrap; min-height: 22px; padding: 2px 4px;">
        ${duplicatas.map(d => `
          <div style="margin-right: 20px; line-height: 1.15;">
            <div style="font-size: 6.5px; color: #000;">${d.nDup}</div>
            <div style="font-size: 6.5px; color: #000;">${formatDate(d.dVenc)}</div>
            <div style="font-size: 7.5px; font-weight: bold; color: #000;">${formatCurrency(d.vDup)}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 7. CÁLCULO DO IMPOSTO -->
    <div style="margin-bottom: 2px;">
      <div class="sec-title">CÁLCULO DO IMPOSTO</div>
      <div class="border">
        <div style="display: flex; border-bottom: 1px solid #000;">
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">BASE DE CÁLCULO DO ICMS</span><div class="value-box text-right">${formatCurrency(vBC)}</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">VALOR DO ICMS</span><div class="value-box text-right">${formatCurrency(vICMS)}</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">BASE DE CÁLCULO DO ICMS SUBST.</span><div class="value-box text-right">${formatCurrency(vBCST)}</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">VALOR DO ICMS SUBST.</span><div class="value-box text-right">${formatCurrency(vST)}</div></div>
          <div style="flex: 1;"><span class="title-box">VALOR TOTAL DOS PRODUTOS</span><div class="value-box text-right">${formatCurrency(vProd)}</div></div>
        </div>
        <div style="display: flex;">
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">VALOR DO FRETE</span><div class="value-box text-right">${formatCurrency(vFrete)}</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">VALOR DO SEGURO</span><div class="value-box text-right">${formatCurrency(vSeg)}</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">DESCONTO</span><div class="value-box text-right">${formatCurrency(vDesc)}</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">OUTRAS DESPESAS ACESSÓRIAS</span><div class="value-box text-right">0,00</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">VALOR TOTAL DO IPI</span><div class="value-box text-right">${formatCurrency(vIPI)}</div></div>
          <div style="flex: 1.2; background: #fff;"><span class="title-box" style="font-weight: 900;">VALOR TOTAL DA NOTA</span><div class="value-box text-right" style="font-size: 9px; font-weight: 900;">${formatCurrency(vNF)}</div></div>
        </div>
      </div>
    </div>

    <!-- 8. TRANSPORTADOR / VOLUMES TRANSPORTADOS -->
    <div style="margin-bottom: 2px;">
      <div class="sec-title">TRANSPORTADOR / VOLUMES TRANSPORTADOS</div>
      <div class="border">
        <div style="display: flex; border-bottom: 1px solid #000;">
          <div style="flex: 2; border-right: 1px solid #000;"><span class="title-box">NOME / RAZÃO SOCIAL</span><div class="value-box">-</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">FRETE POR CONTA</span><div class="value-box">9 - SEM FRETE</div></div>
          <div style="flex: 0.8; border-right: 1px solid #000;"><span class="title-box">CÓDIGO ANTT</span><div class="value-box">-</div></div>
          <div style="flex: 0.8; border-right: 1px solid #000;"><span class="title-box">PLACA DO VEÍCULO</span><div class="value-box">-</div></div>
          <div style="width: 30px; border-right: 1px solid #000;"><span class="title-box">UF</span><div class="value-box">-</div></div>
          <div style="flex: 1.2;"><span class="title-box">CNPJ / CPF</span><div class="value-box">-</div></div>
        </div>
        <div style="display: flex; border-bottom: 1px solid #000;">
          <div style="flex: 2.2; border-right: 1px solid #000;"><span class="title-box">ENDEREÇO</span><div class="value-box">-</div></div>
          <div style="flex: 1.5; border-right: 1px solid #000;"><span class="title-box">MUNICÍPIO</span><div class="value-box">-</div></div>
          <div style="width: 30px; border-right: 1px solid #000;"><span class="title-box">UF</span><div class="value-box">-</div></div>
          <div style="flex: 1.2;"><span class="title-box">INSCRIÇÃO ESTADUAL</span><div class="value-box">-</div></div>
        </div>
        <div style="display: flex;">
          <div style="flex: 0.6; border-right: 1px solid #000;"><span class="title-box">QUANTIDADE</span><div class="value-box text-center">0</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">ESPÉCIE</span><div class="value-box">-</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">MARCA</span><div class="value-box">-</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">NUMERAÇÃO</span><div class="value-box">-</div></div>
          <div style="flex: 1; border-right: 1px solid #000;"><span class="title-box">PESO BRUTO</span><div class="value-box text-right">0,000</div></div>
          <div style="flex: 1;"><span class="title-box">PESO LÍQUIDO</span><div class="value-box text-right">0,000</div></div>
        </div>
      </div>
    </div>

    <!-- 9. DADOS DOS PRODUTOS / SERVIÇOS -->
    <div style="margin-bottom: 2px;">
      <div class="sec-title">DADOS DOS PRODUTOS / SERVIÇOS</div>
      <table class="table-danfe">
        <thead>
          <tr>
            <th style="width: 55px;">CÓDIGO</th>
            <th>DESCRIÇÃO DOS PRODUTOS / SERVIÇOS</th>
            <th style="width: 44px; text-align: center;">NCM/SH</th>
            <th style="width: 28px; text-align: center;">CSOSN</th>
            <th style="width: 28px; text-align: center;">CFOP</th>
            <th style="width: 22px; text-align: center;">UNID</th>
            <th style="width: 26px; text-align: right;">QUANT.</th>
            <th style="width: 50px; text-align: right;">VALOR UNITÁRIO</th>
            <th style="width: 50px; text-align: right;">VALOR TOTAL</th>
            <th style="width: 42px; text-align: right;">BASE CÁLCULO</th>
            <th style="width: 36px; text-align: right;">VALOR ICMS</th>
            <th style="width: 36px; text-align: right;">VALOR IPI</th>
            <th style="width: 30px; text-align: right;">ALÍQUOTA ICMS %</th>
            <th style="width: 30px; text-align: right;">ALÍQUOTA IPI %</th>
          </tr>
        </thead>
        <tbody>
          ${itens.map(it => `
            <tr>
              <td>${it.cProd}</td>
              <td><b>${it.xProd}</b></td>
              <td class="text-center">${it.NCM}</td>
              <td class="text-center">${it.CST}</td>
              <td class="text-center">${it.CFOP}</td>
              <td class="text-center">${it.uCom}</td>
              <td class="text-right">${it.qCom}</td>
              <td class="text-right">${it.vUnCom}</td>
              <td class="text-right"><b>${formatCurrency(it.vProd)}</b></td>
              <td class="text-right">${formatCurrency(it.vBC)}</td>
              <td class="text-right">${formatCurrency(it.vICMS)}</td>
              <td class="text-right">${formatCurrency(it.vIPI)}</td>
              <td class="text-right">${parseFloat(it.pICMS).toFixed(0)}</td>
              <td class="text-right">${parseFloat(it.pIPI).toFixed(0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- 10. CÁLCULO DO ISSQN -->
    <div style="margin-bottom: 2px;">
      <div class="sec-title">CÁLCULO DO ISSQN</div>
      <div class="border" style="display: flex;">
        <div style="flex: 1.2; border-right: 1px solid #000;">
          <span class="title-box">INSCRIÇÃO MUNICIPAL</span>
          <div class="value-box">${emitIm}</div>
        </div>
        <div style="flex: 1.2; border-right: 1px solid #000;">
          <span class="title-box">VALOR TOTAL DOS SERVIÇOS</span>
          <div class="value-box text-right"></div>
        </div>
        <div style="flex: 1.2; border-right: 1px solid #000;">
          <span class="title-box">BASE DE CÁLCULO DO ISSQN</span>
          <div class="value-box text-right"></div>
        </div>
        <div style="flex: 1;">
          <span class="title-box">VALOR DO ISSQN</span>
          <div class="value-box text-right">0,00</div>
        </div>
      </div>
    </div>

    <!-- 11. DADOS ADICIONAIS -->
    <div>
      <div class="sec-title">DADOS ADICIONAIS</div>
      <div class="border" style="display: flex; min-height: 48px; height: 48px;">
        <div style="flex: 2; border-right: 1px solid #000; padding: 2px 4px;">
          <span class="title-box">INFORMAÇÕES COMPLEMENTARES</span>
          <div style="font-size: 6.8px; line-height: 1.25; color: #000; font-family: monospace; margin-top: 1px;">
            ${infCpl}
          </div>
        </div>
        <div style="flex: 1; padding: 2px 4px;">
          <span class="title-box">RESERVADO AO FISCO</span>
        </div>
      </div>
    </div>

  </div>

  <script>
    window.addEventListener('load', function() {
      if (typeof JsBarcode !== 'undefined') {
        JsBarcode("#barcode", "${chaveAcesso}", {
          format: "CODE128",
          width: 1.0,
          height: 34,
          displayValue: false,
          margin: 0
        });
      }
    });
  </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(htmlDanfe);
    }

    // Fallback: se não tiver XML gerado ainda no Conta Azul
    return res.status(404).json({
      error: 'Nota Fiscal ainda não autorizada ou sem XML disponível no Conta Azul.',
      saleNumber: s.number,
      nfeStatus: s.nfe?.status || 'Pendente'
    });
  } catch (error) {
    console.error('Erro ao baixar/renderizar DANFE do Conta Azul:', error);
    return res.status(500).json({ error: 'Erro interno: ' + error.message });
  } finally {
    client.release();
  }
}
