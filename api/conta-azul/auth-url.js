export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientId = process.env.CONTA_AZUL_CLIENT_ID || '5ngbq1tfnlm0aklaa8tun7v8vu';
  const host = req.headers.host || 'clean-tech-smart.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  // Prefer standard configured redirect uri or fallback to current host
  const redirectUri = process.env.CONTA_AZUL_REDIRECT_URI || `${protocol}://${host}/api/conta-azul/callback`;
  const state = Math.random().toString(36).substring(2, 15);

  const authUrl = `https://login.contaazul.com/#/oauth/authorize?` + new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state,
    scope: 'openid profile aws.cognito.signin.user.admin'
  }).toString();

  return res.status(200).json({
    success: true,
    authUrl,
    redirectUri,
    clientId
  });
}
