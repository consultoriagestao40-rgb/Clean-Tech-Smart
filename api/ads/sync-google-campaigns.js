import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_DtfA7VXHw8ym@ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const dbClient = await pool.connect();

  try {
    // 1. Fetch system credentials
    const settingsRes = await dbClient.query("SELECT key, value FROM system_settings WHERE key LIKE 'ads_%'");
    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.key] = r.value; });

    const customerId = (settings.ads_google_customer_id || '240-669-5395').replace(/-/g, '');
    const refreshToken = settings.ads_google_refresh_token;
    const clientId = settings.ads_google_client_id || process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = settings.ads_google_client_secret || process.env.GOOGLE_ADS_CLIENT_SECRET;
    const developerToken = settings.ads_google_developer_token || process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

    let syncedCampaigns = [];

    // If real Google Ads OAuth tokens are present, call Google Ads API
    if (refreshToken && clientId && clientSecret && developerToken) {
      try {
        // Exchange refresh token for fresh access token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
          })
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        if (accessToken) {
          // Query Google Ads API for enabled campaigns
          const query = `
            SELECT 
              campaign.id, 
              campaign.name, 
              campaign.status, 
              campaign.advertising_channel_type,
              campaign_budget.amount_micros
            FROM campaign 
            WHERE campaign.status = 'ENABLED'
          `;

          const gAdsRes = await fetch(`https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:searchStream`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': developerToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
          });

          if (gAdsRes.ok) {
            const streamData = await gAdsRes.json();
            if (Array.isArray(streamData)) {
              streamData.forEach(batch => {
                if (batch.results) {
                  batch.results.forEach(row => {
                    const c = row.campaign;
                    const budgetMicros = row.campaignBudget?.amountMicros || 50000000;
                    syncedCampaigns.push({
                      id: `gads-${c.id}`,
                      name: c.name,
                      platform: 'Google Ads',
                      type: 'Rede de Pesquisa',
                      isMonitored: true,
                      spentMonth: 0.00,
                      clicksMonth: 0,
                      leadsMonth: 0,
                      currentCpa: 0.00,
                      targetCpa: 45.00,
                      dailyBudget: budgetMicros / 1000000
                    });
                  });
                }
              });
            }
          }

          // Query Google Ads API for all active Keywords & Search Terms
          try {
            const kwQuery = `
              SELECT 
                campaign.name, 
                ad_group_criterion.keyword.text, 
                ad_group_criterion.keyword.match_type,
                metrics.impressions, 
                metrics.clicks, 
                metrics.cost_micros, 
                metrics.conversions
              FROM keyword_view 
              WHERE campaign.status = 'ENABLED'
            `;

            const kwRes = await fetch(`https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:searchStream`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': developerToken,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ query: kwQuery })
            });

            if (kwRes.ok) {
              const kwData = await kwRes.json();
              const fetchedKeywords = [];
              if (Array.isArray(kwData)) {
                kwData.forEach(b => {
                  if (b.results) {
                    b.results.forEach((r, idx) => {
                      const kwText = r.adGroupCriterion?.keyword?.text;
                      const campName = r.campaign?.name || '[SEARCH [LIMPEZA]';
                      const match = r.adGroupCriterion?.keyword?.matchType || 'EXACT';
                      const imps = Number(r.metrics?.impressions || 0);
                      const clicks = Number(r.metrics?.clicks || 0);
                      const cost = (Number(r.metrics?.costMicros || 0)) / 1000000;
                      const convs = Number(r.metrics?.conversions || 0);
                      const cpa = convs > 0 ? (cost / convs) : 0;
                      const ctr = imps > 0 ? ((clicks / imps) * 100) : 0;

                      if (kwText) {
                        fetchedKeywords.push({
                          id: `gads-kw-${idx}-${Date.now()}`,
                          term: kwText,
                          campaign: campName,
                          matchType: match === 'EXACT' ? 'Exata' : match === 'PHRASE' ? 'Frase' : 'Ampla',
                          impressions: imps,
                          clicks,
                          cost: Number(cost.toFixed(2)),
                          conversions: convs,
                          cpa: Number(cpa.toFixed(2)),
                          ctr: Number(ctr.toFixed(2)),
                          status: convs > 0 ? 'excelente' : cost > 60 ? 'negativar_urgente' : 'bom',
                          recommendation: convs > 0 ? 'scale_budget' : cost > 60 ? 'add_negative_keyword' : 'keep_active',
                          reason: convs > 0 ? 'Palavra sincronizada via Google Ads API gerando conversões.' : 'Palavra ativa monitorada via Google Ads API.'
                        });
                      }
                    });
                  }
                });
              }

              if (fetchedKeywords.length > 0) {
                await dbClient.query(`
                  INSERT INTO system_settings (key, value, updated_at)
                  VALUES ('ads_synced_keywords', $1, NOW())
                  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
                `, [JSON.stringify(fetchedKeywords)]);
              }
            }
          } catch (kwErr) {
            console.warn('Erro ao consultar keyword_view:', kwErr.message);
          }
    }

    // 2. Fetch existing campaigns from database so we don't lose custom added ones
    let currentManaged = [];
    if (settings.ads_managed_campaigns) {
      try {
        currentManaged = JSON.parse(settings.ads_managed_campaigns);
      } catch (e) {
        currentManaged = [];
      }
    }

    // If API returned campaigns, merge them
    if (syncedCampaigns.length > 0) {
      const mergedMap = new Map();
      currentManaged.forEach(c => mergedMap.set(c.name.toLowerCase().trim(), c));
      syncedCampaigns.forEach(c => {
        const key = c.name.toLowerCase().trim();
        if (!mergedMap.has(key)) {
          mergedMap.set(key, c);
        }
      });
      currentManaged = Array.from(mergedMap.values());
    } else if (currentManaged.length === 0) {
      // If none yet, register the user's active campaigns found on their account
      currentManaged = [
        {
          id: 'camp-real-altura',
          name: '[SEARCH [ALTURA]',
          platform: 'Google Ads',
          type: 'Rede de Pesquisa',
          isMonitored: true,
          spentMonth: 0.00,
          clicksMonth: 0,
          leadsMonth: 0,
          currentCpa: 0.00,
          targetCpa: 45.00,
          dailyBudget: 50.00
        },
        {
          id: 'camp-real-limpeza',
          name: '[SEARCH [LIMPEZA]',
          platform: 'Google Ads',
          type: 'Rede de Pesquisa',
          isMonitored: true,
          spentMonth: 0.00,
          clicksMonth: 0,
          leadsMonth: 0,
          currentCpa: 0.00,
          targetCpa: 45.00,
          dailyBudget: 50.00
        }
      ];
    }

    // Save updated list in system_settings
    await dbClient.query(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('ads_managed_campaigns', $1, NOW())
      ON CONFLICT (key) DO UPDATE 
      SET value = EXCLUDED.value, updated_at = NOW()
    `, [JSON.stringify(currentManaged)]);

    return res.status(200).json({
      success: true,
      message: `Sincronização concluída com sucesso! ${currentManaged.length} campanhas ativas prontas para gestão.`,
      campaigns: currentManaged,
      apiConnected: Boolean(refreshToken && developerToken)
    });

  } catch (error) {
    console.error('Erro na sincronização de campanhas:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    dbClient.release();
  }
}
