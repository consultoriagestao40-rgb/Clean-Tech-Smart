import { Pool } from 'pg';
import { getContaAzulSaleDetails, getValidAccessToken, SALES_API_URL, BASE_API_URL } from './conta-azul.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  const { invoiceId, saleId } = req.query;

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
        return res.status(401).json({
          error: 'Conta Azul não autenticado ou sessão expirada.',
          authUrl
        });
      }

      // Redireciona diretamente para o fluxo de autorização do Conta Azul
      return res.redirect(authUrl);
    }

    // 1. Obter detalhes da venda no Conta Azul
    const caResult = await getContaAzulSaleDetails(targetSaleId);
    if (!caResult.success || !caResult.sale) {
      return res.status(404).json({ error: 'Venda não localizada no Conta Azul: ' + (caResult.error || 'Erro desconhecido') });
    }

    const s = caResult.sale;
    let pdfUrl = s.nfe?.pdf_url || s.nfe?.danfe_url || s.nfe?.danfe_link || s.nfe?.link_danfe || s.nfe?.url ||
                 s.nfse?.pdf_url || s.nfse?.url || s.invoice_pdf_url || s.pdf_url || s.danfe_url || null;
    const nfNumber = s.nfe?.number || s.nfse?.number || s.invoice_number || s.number || 'NF';

    // 2. Se não encontrou URL direta no objeto da venda, tenta buscar nos sub-recursos
    if (!pdfUrl && s.id) {
      try {
        const nfeRes = await fetch(`${SALES_API_URL}/v1/sales/${s.id}/nfe`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (nfeRes.ok) {
          const nfeData = await nfeRes.json();
          pdfUrl = nfeData.pdf_url || nfeData.danfe_url || nfeData.danfe_link || nfeData.url || null;
        }
      } catch (e) {}

      if (!pdfUrl) {
        try {
          const nfseRes = await fetch(`${SALES_API_URL}/v1/sales/${s.id}/nfse`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (nfseRes.ok) {
            const nfseData = await nfseRes.json();
            pdfUrl = nfseData.pdf_url || nfseData.url || null;
          }
        } catch (e) {}
      }
    }

    // Se ainda não tem PDF gerado
    if (!pdfUrl) {
      const isHtml = (req.headers.accept || '').includes('text/html') || !req.headers.accept;
      if (isHtml) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nota Fiscal - Clean Tech Smart</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; padding: 20px; }
              .card { background: white; padding: 36px 32px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06); max-width: 480px; text-align: center; border: 1px solid #e2e8f0; }
              .icon { font-size: 44px; margin-bottom: 16px; }
              h1 { font-size: 20px; margin: 0 0 10px; color: #0f172a; font-weight: 700; }
              p { font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 20px; }
              .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 12px; margin-bottom: 20px; border: 1px solid #fde68a; }
              .btn { display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; transition: background 0.2s; }
              .btn:hover { background: #0369a1; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">📄</div>
              <h1>Nota Fiscal no Conta Azul</h1>
              <span class="badge">Venda #${s.number || targetSaleId} &bull; Status NF: ${s.nfe?.status || s.nfse?.status || 'Aguardando Emissão / Autorização'}</span>
              <p>O arquivo PDF da Nota Fiscal ainda não está disponível via download direto. Verifique se a emissão da NF já foi autorizada pela SEFAZ ou prefeitura no portal do Conta Azul.</p>
              <a href="https://app.contaazul.com" target="_blank" rel="noopener noreferrer" class="btn">Abrir Conta Azul</a>
            </div>
          </body>
          </html>
        `);
      }

      return res.status(404).json({
        error: 'Nota Fiscal ainda não disponível para download no Conta Azul.',
        saleNumber: s.number,
        nfeStatus: s.nfe?.status || s.nfse?.status || 'Não emitida'
      });
    }

    // 3. Obter e entregar o PDF diretamente para o navegador
    if (pdfUrl.startsWith('/')) {
      pdfUrl = `${SALES_API_URL}${pdfUrl}`;
    }

    try {
      const fetchHeaders = {};
      if (pdfUrl.includes('contaazul.com')) {
        fetchHeaders['Authorization'] = `Bearer ${token}`;
      }

      const pdfFetch = await fetch(pdfUrl, { headers: fetchHeaders });
      const contentType = pdfFetch.headers.get('content-type') || '';

      if (pdfFetch.ok && (contentType.includes('pdf') || contentType.includes('octet-stream'))) {
        const pdfBuffer = await pdfFetch.arrayBuffer();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="NF_${nfNumber}_CleanTech.pdf"`);
        return res.send(Buffer.from(pdfBuffer));
      }
    } catch (streamErr) {
      console.warn('Falha no proxy de PDF, redirecionando para URL direta:', streamErr.message);
    }

    // Redirecionamento fallback caso o proxy direto não seja necessário
    return res.redirect(pdfUrl);
  } catch (error) {
    console.error('Erro ao baixar NF do Conta Azul:', error);
    return res.status(500).json({ error: 'Erro interno ao processar download da NF: ' + error.message });
  } finally {
    client.release();
  }
}
