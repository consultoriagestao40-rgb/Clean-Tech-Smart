import { getValidAccessToken, BASE_API_URL } from './conta-azul.js';

export default async function handler(req, res) {
  try {
    const token = await getValidAccessToken();
    if (!token) return res.status(401).json({ error: 'Sem token' });

    const resV1Sales = await fetch(`https://api.contaazul.com/v1/sales?number=141`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const textV1Sales = await resV1Sales.text();

    const resV1SalesList = await fetch(`https://api.contaazul.com/v1/sales?size=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const textV1SalesList = await resV1SalesList.text();

    const resV2Vendas = await fetch(`https://api-v2.contaazul.com/v1/vendas?numero=141`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const textV2Vendas = await resV2Vendas.text();

    return res.status(200).json({
      v1SalesByNumber: {
        status: resV1Sales.status,
        body: textV1Sales
      },
      v1SalesList: {
        status: resV1SalesList.status,
        body: textV1SalesList
      },
      v2Vendas: {
        status: resV2Vendas.status,
        body: textV2Vendas
      }
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
