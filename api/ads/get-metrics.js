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

    // Managed Campaigns list
    let managedCampaigns = [];
    if (settings.ads_managed_campaigns) {
      try {
        managedCampaigns = JSON.parse(settings.ads_managed_campaigns);
      } catch (e) {
        // fallback
      }
    }

    if (!managedCampaigns || managedCampaigns.length === 0) {
      managedCampaigns = [
        {
          id: "cmp-g1",
          name: "Google Search - Tennant A260 B2B",
          platform: "Google Ads",
          type: "Rede de Pesquisa",
          status: "active",
          isMonitored: true,
          targetCpa: 45.00,
          dailyBudget: 120.00,
          spentMonth: isCleanMode ? 0.00 : 1240.00,
          clicksMonth: isCleanMode ? 0 : 284,
          leadsMonth: isCleanMode ? 0 : 31,
          currentCpa: isCleanMode ? 0.00 : 40.00,
          healthStatus: "no_alvo"
        },
        {
          id: "cmp-g2",
          name: "Google Search - Venda de Equipamentos & Máquinas",
          platform: "Google Ads",
          type: "Rede de Pesquisa",
          status: "active",
          isMonitored: true,
          targetCpa: 75.00,
          dailyBudget: 60.00,
          spentMonth: isCleanMode ? 0.00 : 540.00,
          clicksMonth: isCleanMode ? 0 : 110,
          leadsMonth: isCleanMode ? 0 : 8,
          currentCpa: isCleanMode ? 0.00 : 67.50,
          healthStatus: "no_alvo"
        },
        {
          id: "cmp-g3",
          name: "Google Search - Institucional & Marca Clean Tech",
          platform: "Google Ads",
          type: "Branding",
          status: "active",
          isMonitored: false,
          targetCpa: 25.00,
          dailyBudget: 20.00,
          spentMonth: 0.00,
          clicksMonth: 0,
          leadsMonth: 0,
          currentCpa: 0.00,
          healthStatus: "ignorado_ia"
        },
        {
          id: "cmp-m1",
          name: "Meta Ads - Leads Form: Tennant A260 B2B (PR/SC)",
          platform: "Meta Ads",
          type: "Lead Ads & Instagram",
          status: "active",
          isMonitored: true,
          targetCpa: 45.00,
          dailyBudget: 80.00,
          spentMonth: isCleanMode ? 0.00 : 1090.00,
          clicksMonth: isCleanMode ? 0 : 410,
          leadsMonth: isCleanMode ? 0 : 23,
          currentCpa: isCleanMode ? 0.00 : 47.39,
          healthStatus: "no_alvo"
        },
        {
          id: "cmp-m2",
          name: "Meta Ads - Remarketing Vídeos LP & Calculadora ROI",
          platform: "Meta Ads",
          type: "Remarketing",
          status: "active",
          isMonitored: true,
          targetCpa: 35.00,
          dailyBudget: 30.00,
          spentMonth: 0.00,
          clicksMonth: 0,
          leadsMonth: 0,
          currentCpa: 0.00,
          healthStatus: "no_alvo"
        }
      ];
    } else if (isCleanMode) {
      managedCampaigns = managedCampaigns.map(c => ({
        ...c,
        spentMonth: 0.00,
        clicksMonth: 0,
        leadsMonth: 0,
        currentCpa: 0.00
      }));
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

    // Search terms analyzed by the Agent
    const searchTermsAnalysis = isCleanMode ? [] : [
      {
        id: "st-1",
        term: "locação lavadora de piso tennant a260 curitiba",
        campaign: "Google Search - Tennant A260 B2B",
        matchType: "Frase",
        impressions: 480,
        clicks: 42,
        cost: 168.00,
        conversions: 5,
        cpa: 33.60,
        ctr: 8.75,
        status: "excelente",
        recommendation: "add_exact_keyword",
        reason: "Alta intenção de contratação imediata e CPA 25% abaixo da meta!"
      }
    ];

    // Meta Ads Creatives & Campaign Performance
    const metaCreativesAnalysis = isCleanMode ? [] : [
      {
        id: "meta-c1",
        name: "Vídeo Demonstração Rodo Linatex - A260 em Galpão",
        adSet: "Diretores de Facilities & Operações PR/SC",
        spend: 420.00,
        leads: 11,
        cpl: 38.18,
        frequency: 1.8,
        ctr: 2.94,
        status: "excelente",
        aiInsight: "Criativo com maior taxa de retenção. Sugerido aumentar orçamento diário em 20%."
      }
    ];

    // Aggregated real performance
    const totalSpentGoogle = isCleanMode ? 0.00 : 1240.00;
    const totalSpentMeta = isCleanMode ? 0.00 : 1090.00;
    const totalSpent = totalSpentGoogle + totalSpentMeta;
    const leadsGoogle = 0;
    const leadsMeta = totalLeadsFromAds;
    const totalLeads = leadsGoogle + leadsMeta;
    const realCpa = (totalLeads > 0 && totalSpent > 0) ? (totalSpent / totalLeads) : 0;
    const realCtr = isCleanMode ? 0.00 : 3.65;
    const realConvRate = isCleanMode ? 0.00 : 6.2;
    const estimatedPipelineValue = totalLeads * 3890.00 * 0.35;
    const realRoas = totalSpent > 0 ? (estimatedPipelineValue / totalSpent) : 0;

    // Health Score calculation (0 to 100)
    let healthScore = 100;
    if (realCpa > targetCpa) healthScore -= 15;
    if (realCtr > 0 && realCtr < minCtr) healthScore -= 10;
    healthScore = Math.min(100, Math.max(10, healthScore));

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
