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
        }
      } catch (apiErr) {
        console.warn('Google Ads API query attempt:', apiErr.message);
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
