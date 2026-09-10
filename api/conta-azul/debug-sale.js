import { getValidAccessToken, BASE_API_URL } from './conta-azul.js';

export default async function handler(req, res) {
  try {
    const token = await getValidAccessToken();
    if (!token) return res.status(401).json({ error: 'Sem token' });

    const numberQueryRes = await fetch(`${BASE_API_URL}/v1/sales?number=141`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const numberQueryText = await numberQueryRes.text();

    const listRes = await fetch(`${BASE_API_URL}/v1/sales?page=1&size=20`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listText = await listRes.text();

    return res.status(200).json({
      numberQuery: {
        status: numberQueryRes.status,
        body: numberQueryText
      },
      listRecent: {
        status: listRes.status,
        body: listText
      }
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
