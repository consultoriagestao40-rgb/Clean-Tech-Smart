import { setSetting } from './conta-azul.js';

export default async function handler(req, res) {
  const { code, error, error_description } = req.query || {};

  if (error) {
    console.error('Erro retornado no callback do Conta Azul:', error, error_description);
    return res.redirect(`/faturas?conta_azul=erro&msg=${encodeURIComponent(error_description || error)}`);
  }

  if (!code) {
    return res.redirect('/faturas?conta_azul=erro&msg=codigo_nao_fornecido');
  }

  const clientId = process.env.CONTA_AZUL_CLIENT_ID || '5ngbq1tfnlm0aklaa8tun7v8vu';
  const clientSecret = process.env.CONTA_AZUL_CLIENT_SECRET || '12682kvjplg1cfokkj97qgllce92e9mi9vt59b3i9bef9556o5gh';
  const host = req.headers.host || 'clean-tech-smart.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = process.env.CONTA_AZUL_REDIRECT_URI || `${protocol}://${host}/api/conta-azul/callback`;

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenRes = await fetch('https://api-v2.contaazul.com/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri
      })
    });

    const responseText = await tokenRes.text();
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch {
      console.error('Resposta não-JSON do token do Conta Azul:', responseText);
      return res.redirect(`/faturas?conta_azul=erro&msg=${encodeURIComponent('Resposta inválida do Conta Azul')}`);
    }

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Erro na troca do token do Conta Azul:', tokenData);
      return res.redirect(`/faturas?conta_azul=erro&msg=${encodeURIComponent(tokenData.message || tokenData.error || 'Falha ao autenticar')}`);
    }

    const expiresAt = Date.now() + (Number(tokenData.expires_in || 3600) * 1000);

    await setSetting('conta_azul_access_token', tokenData.access_token);
    if (tokenData.refresh_token) {
      await setSetting('conta_azul_refresh_token', tokenData.refresh_token);
    }
    await setSetting('conta_azul_expires_at', String(expiresAt));
    await setSetting('conta_azul_connected_at', new Date().toISOString());

    let targetRedirect = '/faturas?conta_azul=sucesso';
    const rawState = req.query.state;
    if (rawState) {
      try {
        const decoded = JSON.parse(Buffer.from(rawState, 'base64').toString('utf-8'));
        if (decoded.returnTo) {
          targetRedirect = decoded.returnTo;
        }
      } catch (e) {
        // state simples
      }
    }

    return res.redirect(targetRedirect);
  } catch (err) {
    console.error('Exceção no callback do Conta Azul:', err);
    return res.redirect(`/faturas?conta_azul=erro&msg=${encodeURIComponent(err.message)}`);
  }
}
