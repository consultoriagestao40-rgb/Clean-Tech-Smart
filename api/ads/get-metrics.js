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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let dbClient;
  try {
    dbClient = await pool.connect();
    
    // Ensure table for ads_logs if not exists
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS ads_optimization_logs (
        id SERIAL PRIMARY KEY,
        action_type VARCHAR(50) NOT NULL,
        platform VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        details JSONB,
        savings_estimated NUMERIC(10,2) DEFAULT 0,
        applied_by VARCHAR(50) DEFAULT 'Agente IA',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Fetch settings
    const settingsRes = await dbClient.query("SELECT key, value FROM system_settings WHERE key LIKE 'ads_%' OR key LIKE 'app_%'");
    const settings = {};
    for (const row of settingsRes.rows) {
      settings[row.key] = row.value;
    }

    // Fetch recent optimization logs
    const logsRes = await dbClient.query("SELECT * FROM ads_optimization_logs ORDER BY created_at DESC LIMIT 30");

    // Fetch leads generated from ads in CRM if available
    let totalLeadsFromAds = 0;
    try {
      const leadsRes = await dbClient.query(`
        SELECT COUNT(*) as total FROM leads 
        WHERE (label ILIKE '%google%' OR label ILIKE '%meta%' OR label ILIKE '%ads%' OR label ILIKE '%lp%')
      `);
      totalLeadsFromAds = parseInt(leadsRes.rows[0]?.total || '0', 10);
    } catch (e) {
      // fallback
    }

    // Default target configurations
    const targetCpa = parseFloat(settings.ads_target_cpa || '45.00');
    const targetRoas = parseFloat(settings.ads_target_roas || '4.5');
    const minCtr = parseFloat(settings.ads_min_ctr || '3.0');
    const targetConvRate = parseFloat(settings.ads_target_conv_rate || '5.5');
    const dailyBudgetGoogle = parseFloat(settings.ads_daily_budget_google || '120.00');
    const dailyBudgetMeta = parseFloat(settings.ads_daily_budget_meta || '80.00');
    const autopilotEnabled = settings.ads_autopilot_enabled === 'true';
    const autoNegateThresholdSpend = parseFloat(settings.ads_negate_spend_threshold || '50.00');
    const autoNegateClicksThreshold = parseInt(settings.ads_negate_clicks_threshold || '12', 10);

    const isCleanMode = settings.ads_clean_data_mode !== 'false'; // Por padrão ativado o modo de dados reais zerados

    // Managed Campaigns list with real active operational metrics
    let managedCampaigns = [
      {
        id: "cmp-custom-altura",
        name: "[SEARCH [ALTURA]",
        platform: "Google Ads",
        type: "Rede de Pesquisa",
        status: "active",
        isMonitored: true,
        targetCpa: 45.00,
        dailyBudget: 50.00,
        spentMonth: 0.00,
        clicksMonth: 0,
        leadsMonth: 0,
        currentCpa: 0.00,
        ctr: 0.00,
        qualityScore: 0,
        healthStatus: "no_alvo"
      },
      {
        id: "cmp-custom-limpeza",
        name: "[SEARCH [LIMPEZA]",
        platform: "Google Ads",
        type: "Rede de Pesquisa",
        status: "active",
        isMonitored: true,
        targetCpa: 45.00,
        dailyBudget: 50.00,
        spentMonth: 0.00,
        clicksMonth: 0,
        leadsMonth: 0,
        currentCpa: 0.00,
        ctr: 0.00,
        qualityScore: 0,
        healthStatus: "no_alvo"
      }
    ];

    if (settings.ads_managed_campaigns) {
      try {
        const parsed = JSON.parse(settings.ads_managed_campaigns);
        if (Array.isArray(parsed) && parsed.length > 0) {
          managedCampaigns = parsed;
        }
      } catch (e) {
        // use default
      }
    }

    // Negative keywords list saved
    let negativeKeywords = [];
    if (settings.ads_negative_keywords) {
      try {
        negativeKeywords = JSON.parse(settings.ads_negative_keywords);
      } catch (e) {
        negativeKeywords = settings.ads_negative_keywords.split('\n').map(s => s.trim()).filter(Boolean);
      }
    } else {
      negativeKeywords = [
        "grátis", "download", "conserto caseiro", "manual pdf", "usada olx", 
        "trabalho servente", "vagas de emprego", "peça usada mercado livre", "como fabricar"
      ];
    }

    // Search terms analyzed by the Agent for the active campaigns
    let searchTermsAnalysis = [];
    if (settings.ads_synced_keywords) {
      try {
        const parsed = JSON.parse(settings.ads_synced_keywords);
        if (Array.isArray(parsed) && parsed.length > 0) {
          searchTermsAnalysis.push(...parsed);
        }
      } catch (e) {
        // ignore
      }
    }

    // Meta Ads Creatives & Campaign Performance
    let metaCreativesAnalysis = [];
    if (settings.ads_meta_creatives) {
      try {
        const parsed = JSON.parse(settings.ads_meta_creatives);
        if (Array.isArray(parsed)) metaCreativesAnalysis = parsed;
      } catch(e) {}
    }

    // Aggregated real performance across active campaigns (0 contratos fechados no CRM)
    const totalSpentGoogle = managedCampaigns.filter(c => c.platform === 'Google Ads').reduce((acc, c) => acc + (Number(c.spentMonth) || 0), 0);
    const totalSpentMeta = managedCampaigns.filter(c => c.platform === 'Meta Ads').reduce((acc, c) => acc + (Number(c.spentMonth) || 0), 0);
    const totalSpent = totalSpentGoogle + totalSpentMeta;
    const totalClicks = managedCampaigns.reduce((acc, c) => acc + (Number(c.clicksMonth) || 0), 0);
    const leadsGoogle = totalLeadsFromAds;
    const leadsMeta = 0;
    const totalLeads = leadsGoogle + leadsMeta;
    const realCpa = totalLeads > 0 ? (totalSpent / totalLeads) : 0;
    const realCtr = totalClicks > 0 ? (managedCampaigns[0]?.ctr || 0) : 0.0;
    const realConvRate = totalClicks > 0 ? ((totalLeads / totalClicks) * 100) : 0.0;
    const totalNewContracts = 0; // Nenhum contrato fechado no CRM
    const totalCac = 0.00; // Sem fechamento
    const averageTicket = 3890.00;
    const averageLtv = 0.00;
    const ltvCacRatio = 0.0;
    const estimatedPipelineValue = 0.00;
    const realRoas = 0.0;

    // Health Score calculation (0 to 100)
    let healthScore = 50; // Aguardando primeiros dados de conversão real no CRM não fechar contratos
    if (totalNewContracts === 0) healthScore = 48;

    // Calculate actual savings from database optimization logs
    let actualSavings = 0;
    if (logsRes && logsRes.rows) {
      actualSavings = logsRes.rows.reduce((acc, log) => acc + (parseFloat(log.savings_estimated) || 0), 0);
    }

    return res.status(200).json({
      success: true,
      data: {
        healthScore,
        targets: {
          targetCpa,
          targetRoas,
          minCtr,
          targetConvRate,
          dailyBudgetGoogle,
          dailyBudgetMeta,
          autopilotEnabled,
          autoNegateThresholdSpend,
          autoNegateClicksThreshold
        },
        realMetrics: {
          totalSpent,
          totalSpentGoogle,
          totalSpentMeta,
          totalLeads,
          leadsGoogle,
          leadsMeta,
          realCpa: Number(realCpa.toFixed(2)),
          realCtr,
          realConvRate,
          realRoas: Number(realRoas.toFixed(1)),
          estimatedPipelineValue: Number(estimatedPipelineValue.toFixed(2)),
          estimatedSavingsThisMonth: isCleanMode ? actualSavings : 860.00
        },
        apiCredentials: {
          googleCustomerId: settings.ads_google_customer_id || '',
          googleDeveloperToken: settings.ads_google_developer_token ? '••••••••••••' : '',
          googleTagId: settings.ads_google_tag_id || settings.app_google_tag_id || '',
          googleConversionLabel: settings.ads_google_conversion_label || '',
          googleConnected: Boolean(settings.ads_google_customer_id || settings.ads_google_tag_id),
          metaAdAccountId: settings.ads_meta_ad_account_id || '',
          metaPixelId: settings.ads_meta_pixel_id || '',
          metaCapiToken: settings.ads_meta_capi_token ? '••••••••••••' : '',
          metaConnected: Boolean(settings.ads_meta_ad_account_id || settings.ads_meta_pixel_id)
        },
        searchTermsAnalysis,
        metaCreativesAnalysis,
        managedCampaigns,
        negativeKeywords,
        recentLogs: logsRes.rows
      }
    });

  } catch (error) {
    console.error('Erro na API get-metrics:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (dbClient) dbClient.release();
  }
}
