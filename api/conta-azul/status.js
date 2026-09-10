import { getValidAccessToken, getSetting } from './conta-azul.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const token = await getValidAccessToken();
    const connectedAt = await getSetting('conta_azul_connected_at');
    const isConnected = !!token;

    return res.status(200).json({
      success: true,
      connected: isConnected,
      connectedAt: connectedAt || null
    });
  } catch (error) {
    console.error('Erro ao verificar status do Conta Azul:', error);
    return res.status(200).json({
      success: true,
      connected: false,
      error: error.message
    });
  }
}
