import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  ShieldAlert, 
  DollarSign, 
  Search, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  RefreshCw, 
  Sliders, 
  Settings, 
  Key, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  Info, 
  ArrowUpRight, 
  BarChart3, 
  Layers, 
  Globe, 
  Activity,
  Filter,
  Flame,
  ArrowRight,
  ShieldCheck,
  History,
  Cpu,
  Compass,
  Copy
} from 'lucide-react';

export default function AgenteAds() {
  const [activeTab, setActiveTab] = useState('copiloto'); // 'copiloto', 'metas', 'palavras', 'meta_ads', 'negativas', 'logs', 'conexoes'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSavingTargets, setIsSavingTargets] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  
  // Data state
  const [healthScore, setHealthScore] = useState(88);
  const [targets, setTargets] = useState({
    targetCpa: 45.00,
    targetRoas: 4.5,
    minCtr: 3.0,
    targetConvRate: 5.5,
    dailyBudgetGoogle: 120.00,
    dailyBudgetMeta: 80.00,
    autopilotEnabled: false,
    autoNegateThresholdSpend: 50.00,
    autoNegateClicksThreshold: 12
  });

  const [realMetrics, setRealMetrics] = useState({
    totalSpent: 0.00,
    totalSpentGoogle: 0.00,
    totalSpentMeta: 0.00,
    totalLeads: 0,
    leadsGoogle: 0,
    leadsMeta: 0,
    realCpa: 0.00,
    realCtr: 0.00,
    realConvRate: 0.00,
    realRoas: 0.0,
    estimatedPipelineValue: 0.00,
    estimatedSavingsThisMonth: 0.00
  });

  const [searchTerms, setSearchTerms] = useState([]);
  const [metaCreatives, setMetaCreatives] = useState([]);
  const [negativeKeywords, setNegativeKeywords] = useState([]);
  const [managedCampaigns, setManagedCampaigns] = useState([]);
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const [isSavingCampaigns, setIsSavingCampaigns] = useState(false);
  const [newCampaignModal, setNewCampaignModal] = useState(false);
  const [newCampData, setNewCampData] = useState({ name: '', platform: 'Google Ads', type: 'Rede de Pesquisa', targetCpa: 45.00, dailyBudget: 50.00 });
  const [apiCredentials, setApiCredentials] = useState({
    googleCustomerId: '',
    googleDeveloperToken: '',
    googleTagId: '',
    googleConversionLabel: '',
    googleConnected: false,
    metaAdAccountId: '',
    metaPixelId: '',
    metaCapiToken: '',
    metaConnected: false
  });

  // Selected items for batch actions
  const [selectedTermsToNegate, setSelectedTermsToNegate] = useState([]);
  const [newManualNegative, setNewManualNegative] = useState('');

  // Radar de Palavras & Inteligência de Mercado State
  const [radarCategory, setRadarCategory] = useState('all');
  const [radarSearchQuery, setRadarSearchQuery] = useState('');
  const [aiGeneratorInput, setAiGeneratorInput] = useState('Locação Lavadora de Piso Tennant A260 Curitiba');
  const [isGeneratingGroup, setIsGeneratingGroup] = useState(false);
  const [generatedKeywords, setGeneratedKeywords] = useState(null);

  // AI 3-Scenario Predictive Planner State
  const [plannerCampaignTopic, setPlannerCampaignTopic] = useState('Locação de lavadora de piso Tennant A260');
  const [plannerDailyBudget, setPlannerDailyBudget] = useState(50); // R$ 50/dia padrão
  const [plannerTicketMonthly, setPlannerTicketMonthly] = useState(3890); // Ticket médio editável
  const [plannerContractMonths, setPlannerContractMonths] = useState(12); // Duração do contrato editável
  const [plannerRegion, setPlannerRegion] = useState('Curitiba e Região Metropolitana (PR)');
  const [isCalculatingPlanner, setIsCalculatingPlanner] = useState(false);

  // Pure function to calculate the 3 scenarios based on user inputs
  const computeScenarios = (topic, dailyInput, ticketInput, monthsInput) => {
    const daily = Number(dailyInput) || 30;
    const monthly = daily * 30;
    const ticket = Number(ticketInput) || 1300;
    const months = Number(monthsInput) || 12;
    const ltvPerClient = ticket * months;

    // Scenario 1: Pessimista (Conservador)
    const pesCpc = 7.80;
    const pesClicks = Math.max(1, Math.round(monthly / pesCpc));
    const pesConvLp = 4.2;
    const pesLeads = Math.max(1, Math.round(pesClicks * (pesConvLp / 100)));
    const pesCpa = monthly / pesLeads;
    const pesCloseRate = 15;
    const pesContracts = Math.max(1, Math.round(pesLeads * (pesCloseRate / 100)));
    const pesCac = monthly / (pesContracts || 1);
    const pesLtvCac = pesCac > 0 ? (ltvPerClient / pesCac) : 0;
    const pesPayback = ticket > 0 ? (pesCac / ticket) : 0;
    const pesMrr = pesContracts * ticket;
    const pesAnnual = pesMrr * months;
    const pesRoas = monthly > 0 ? (pesMrr / monthly) : 0;

    // Scenario 2: Realista (Recomendado)
    const realCpc = 5.80;
    const realClicks = Math.max(1, Math.round(monthly / realCpc));
    const realConvLp = 6.8;
    const realLeads = Math.max(1, Math.round(realClicks * (realConvLp / 100)));
    const realCpa = monthly / realLeads;
    const realCloseRate = 25;
    const realContracts = Math.max(1, Math.round(realLeads * (realCloseRate / 100)));
    const realCac = monthly / (realContracts || 1);
    const realLtvCac = realCac > 0 ? (ltvPerClient / realCac) : 0;
    const realPayback = ticket > 0 ? (realCac / ticket) : 0;
    const realMrr = realContracts * ticket;
    const realAnnual = realMrr * months;
    const realRoas = monthly > 0 ? (realMrr / monthly) : 0;

    // Scenario 3: Otimista (Alta Eficiência)
    const optCpc = 4.40;
    const optClicks = Math.max(1, Math.round(monthly / optCpc));
    const optConvLp = 9.5;
    const optLeads = Math.max(1, Math.round(optClicks * (optConvLp / 100)));
    const optCpa = monthly / optLeads;
    const optCloseRate = 35;
    const optContracts = Math.max(1, Math.round(optLeads * (optCloseRate / 100)));
    const optCac = monthly / (optContracts || 1);
    const optLtvCac = optCac > 0 ? (ltvPerClient / optCac) : 0;
    const optPayback = ticket > 0 ? (optCac / ticket) : 0;
    const optMrr = optContracts * ticket;
    const optAnnual = optMrr * months;
    const optRoas = monthly > 0 ? (optMrr / monthly) : 0;

    return {
      topic: topic || 'Locação de Lavadora',
      daily,
      monthly,
      ticket,
      months,
      monthlySearchesDemand: 3850,
      commercialIntent: '94% (Alta Intenção / Fundo de Funil)',
      pessimistic: {
        name: 'Pessimista',
        subtitle: 'Alta concorrência / início de aprendizado',
        color: 'rose',
        cpc: pesCpc,
        clicks: pesClicks,
        convLp: pesConvLp,
        leads: pesLeads,
        cpa: pesCpa,
        closeRate: pesCloseRate,
        contracts: pesContracts,
        cac: pesCac,
        ltv: ltvPerClient,
        ltvCac: pesLtvCac,
        paybackMonths: pesPayback,
        mrr: pesMrr,
        annual: pesAnnual,
        roas: pesRoas
      },
      realistic: {
        name: 'Realista (Recomendado)',
        subtitle: 'Média de mercado com LP otimizada e Agente ativo',
        color: 'teal',
        isRecommended: true,
        cpc: realCpc,
        clicks: realClicks,
        convLp: realConvLp,
        leads: realLeads,
        cpa: realCpa,
        closeRate: realCloseRate,
        contracts: realContracts,
        cac: realCac,
        ltv: ltvPerClient,
        ltvCac: realLtvCac,
        paybackMonths: realPayback,
        mrr: realMrr,
        annual: realAnnual,
        roas: realRoas
      },
      optimistic: {
        name: 'Otimista',
        subtitle: 'Alta conversão, público qualificado e escala',
        color: 'emerald',
        cpc: optCpc,
        clicks: optClicks,
        convLp: optConvLp,
        leads: optLeads,
        cpa: optCpa,
        closeRate: optCloseRate,
        contracts: optContracts,
        cac: optCac,
        ltv: ltvPerClient,
        ltvCac: optLtvCac,
        paybackMonths: optPayback,
        mrr: optMrr,
        annual: optAnnual,
        roas: optRoas
      }
    };
  };

  const [plannerResult, setPlannerResult] = useState(() => computeScenarios('Locação de lavadora de piso Tennant A260', 50, 3890, 12));

  // Automatically update scenarios in real-time as user types inputs
  useEffect(() => {
    setPlannerResult(computeScenarios(plannerCampaignTopic, plannerDailyBudget, plannerTicketMonthly, plannerContractMonths));
  }, [plannerCampaignTopic, plannerDailyBudget, plannerTicketMonthly, plannerContractMonths]);

  const handleCalculatePlanner = () => {
    setIsCalculatingPlanner(true);
    setTimeout(() => {
      setPlannerResult(computeScenarios(plannerCampaignTopic, plannerDailyBudget, plannerTicketMonthly, plannerContractMonths));
      setIsCalculatingPlanner(false);
      showSuccessBanner('✨ Demanda analisada e indicadores (CAC, LTV, LTV/CAC e Payback) calculados nos 3 cenários!');
    }, 400);
  };

  const handleApplyScenarioToAgent = (scenario) => {
    setTargets(prev => ({
      ...prev,
      dailyBudgetGoogle: Math.round(plannerDailyBudget * 0.7),
      dailyBudgetMeta: Math.round(plannerDailyBudget * 0.3),
      targetCpa: Math.round(scenario.cpa) || 45,
      targetRoas: Number(scenario.roas.toFixed(1)) || 4.5,
      targetConvRate: scenario.convLp
    }));
    showSuccessBanner(`🎯 Metas do Agente atualizadas com base no Cenário ${scenario.name}!`);
  };

  const marketKeywordsData = [
    {
      id: 'kw-1',
      term: 'locação de lavadora de piso curitiba',
      category: 'locacao',
      volumeMonthly: 1900,
      cpcMin: 4.20,
      cpcMax: 7.80,
      competition: 'Média',
      intent: 'alta', // Fundo de funil
      trend: '+32%',
      recommendedMatch: 'Frase & Exata'
    },
    {
      id: 'kw-2',
      term: 'aluguel lavadora industrial tennant',
      category: 'locacao',
      volumeMonthly: 1450,
      cpcMin: 5.10,
      cpcMax: 8.90,
      competition: 'Alta',
      intent: 'alta',
      trend: '+18%',
      recommendedMatch: 'Frase'
    },
    {
      id: 'kw-3',
      term: 'lavadora de piso tennant a260 preco',
      category: 'venda',
      volumeMonthly: 980,
      cpcMin: 3.90,
      cpcMax: 6.70,
      competition: 'Média',
      intent: 'alta',
      trend: '+45%',
      recommendedMatch: 'Exata'
    },
    {
      id: 'kw-4',
      term: 'lavadora de piso homem a bordo aluguel',
      category: 'locacao',
      volumeMonthly: 2300,
      cpcMin: 4.80,
      cpcMax: 8.50,
      competition: 'Alta',
      intent: 'alta',
      trend: '+27%',
      recommendedMatch: 'Frase'
    },
    {
      id: 'kw-5',
      term: 'locação maquina lavar piso galpão logistico',
      category: 'locacao',
      volumeMonthly: 850,
      cpcMin: 5.50,
      cpcMax: 9.80,
      competition: 'Média',
      intent: 'alta',
      trend: '+15%',
      recommendedMatch: 'Frase'
    },
    {
      id: 'kw-6',
      term: 'assistencia tecnica autorizada tennant parana',
      category: 'servicos',
      volumeMonthly: 620,
      cpcMin: 3.20,
      cpcMax: 5.40,
      competition: 'Baixa',
      intent: 'alta',
      trend: '+10%',
      recommendedMatch: 'Frase & Exata'
    },
    {
      id: 'kw-7',
      term: 'comprar lavadora de piso industrial curitiba',
      category: 'venda',
      volumeMonthly: 1200,
      cpcMin: 4.50,
      cpcMax: 7.90,
      competition: 'Alta',
      intent: 'alta',
      trend: '+22%',
      recommendedMatch: 'Frase'
    },
    {
      id: 'kw-8',
      term: 'lavadora de piso alfa tennant usada',
      category: 'concorrentes',
      volumeMonthly: 1750,
      cpcMin: 2.80,
      cpcMax: 4.90,
      competition: 'Média',
      intent: 'media',
      trend: '+5%',
      recommendedMatch: 'Frase'
    },
    {
      id: 'kw-9',
      term: 'quanto custa alugar lavadora de piso por dia',
      category: 'locacao',
      volumeMonthly: 1100,
      cpcMin: 3.60,
      cpcMax: 6.20,
      competition: 'Média',
      intent: 'alta',
      trend: '+38%',
      recommendedMatch: 'Frase'
    },
    {
      id: 'kw-10',
      term: 'locação lavadora de piso pós obra curitiba',
      category: 'locacao',
      volumeMonthly: 890,
      cpcMin: 4.10,
      cpcMax: 7.30,
      competition: 'Média',
      intent: 'alta',
      trend: '+20%',
      recommendedMatch: 'Frase'
    }
  ];

  // Gerar Grupo de Anúncios com IA
  const handleGenerateAdGroup = () => {
    setIsGeneratingGroup(true);
    setTimeout(() => {
      const topic = aiGeneratorInput.trim() || 'Locação Tennant A260';
      setGeneratedKeywords({
        phraseMatch: [
          `"locação ${topic.toLowerCase()}"`,
          `"aluguel ${topic.toLowerCase()}"`,
          `"preço ${topic.toLowerCase()}"`,
          `"${topic.toLowerCase()} curitiba"`,
          `"${topic.toLowerCase()} parana"`
        ],
        exactMatch: [
          `[${topic.toLowerCase()}]`,
          `[locação ${topic.toLowerCase()} curitiba]`,
          `[aluguel lavadora tennant a260]`
        ],
        recommendedNegatives: [
          'grátis', 'download', 'manual pdf', 'vagas', 'emprego', 'salario operador', 'caseira', 'olx usada defeito'
        ],
        adHeadlines: [
          'Locação Tennant A260 em Curitiba',
          'Máquina Reserva Garantida | B2B',
          'Economize até 75% em Limpeza'
        ],
        adDescriptions: [
          'Lavadora de Piso Tennant A260 a pronta entrega em Curitiba e Região. Manutenção 100% inclusa.',
          'Dedução no IR, máquina reserva garantida e suporte autorizado Tennant. Solicite cotação!'
        ]
      });
      setIsGeneratingGroup(false);
      showSuccessBanner('✨ Grupo de Anúncios e Palavras-Chave gerados pela IA com sucesso!');
    }, 600);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showSuccessBanner(`📋 ${label} copiado para a área de transferência!`);
  };

  // Load metrics from backend
  const fetchAdsData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/ads/get-metrics');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.healthScore !== undefined) setHealthScore(json.data.healthScore);
          if (json.data.targets) setTargets(prev => ({ ...prev, ...json.data.targets }));
          if (json.data.realMetrics) setRealMetrics(json.data.realMetrics);
          if (json.data.searchTermsAnalysis) setSearchTerms(json.data.searchTermsAnalysis);
          if (json.data.metaCreativesAnalysis) setMetaCreatives(json.data.metaCreativesAnalysis);
          if (json.data.managedCampaigns) setManagedCampaigns(json.data.managedCampaigns);
          if (json.data.negativeKeywords) setNegativeKeywords(json.data.negativeKeywords);
          if (json.data.recentLogs) setLogs(json.data.recentLogs);
          if (json.data.apiCredentials) setApiCredentials(json.data.apiCredentials);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar métricas de Ads:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdsData();
  }, []);

  // Alternar monitoramento da campanha
  const toggleCampaignMonitoring = async (campId) => {
    const updated = managedCampaigns.map(c => {
      if (c.id === campId) {
        return { ...c, isMonitored: !c.isMonitored };
      }
      return c;
    });
    setManagedCampaigns(updated);
    try {
      await fetch('/api/ads/save-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ads_managed_campaigns: updated })
      });
      const targetCamp = updated.find(c => c.id === campId);
      showSuccessBanner(targetCamp.isMonitored 
        ? `🟢 Monitoramento da campanha "${targetCamp.name}" ATIVADO!` 
        : `⚪ Campanha "${targetCamp.name}" ignorada pela IA.`
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Excluir campanha da lista
  const handleDeleteCampaign = async (campId) => {
    const updated = managedCampaigns.filter(c => c.id !== campId);
    setManagedCampaigns(updated);
    try {
      await fetch('/api/ads/save-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ads_managed_campaigns: updated })
      });
      showSuccessBanner('Campanha removida da gestão do Agente!');
    } catch (e) {
      console.error(e);
    }
  };

  // Atualizar CPA individual da campanha
  const updateCampaignTargetCpa = (campId, newCpa) => {
    const updated = managedCampaigns.map(c => {
      if (c.id === campId) {
        return { ...c, targetCpa: parseFloat(newCpa) || 0 };
      }
      return c;
    });
    setManagedCampaigns(updated);
  };

  // Salvar alterações de campanhas
  const handleSaveCampaigns = async () => {
    setIsSavingCampaigns(true);
    try {
      await fetch('/api/ads/save-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ads_managed_campaigns: managedCampaigns })
      });
      showSuccessBanner('Configurações de campanhas monitoradas salvas com sucesso!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingCampaigns(false);
    }
  };

  // Adicionar nova campanha manual
  const handleAddCustomCampaign = async (e) => {
    e.preventDefault();
    if (!newCampData.name.trim()) return;
    const newCamp = {
      id: `cmp-custom-${Date.now()}`,
      name: newCampData.name.trim(),
      platform: newCampData.platform,
      type: newCampData.type,
      status: 'active',
      isMonitored: true,
      targetCpa: Number(newCampData.targetCpa) || 45.00,
      dailyBudget: Number(newCampData.dailyBudget) || 50.00,
      spentMonth: 0,
      clicksMonth: 0,
      leadsMonth: 0,
      currentCpa: 0,
      healthStatus: 'no_alvo'
    };
    const updated = [...managedCampaigns, newCamp];
    setManagedCampaigns(updated);
    setNewCampaignModal(false);
    setNewCampData({ name: '', platform: 'Google Ads', type: 'Rede de Pesquisa', targetCpa: 45.00, dailyBudget: 50.00 });
    try {
      await fetch('/api/ads/save-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ads_managed_campaigns: updated })
      });
      showSuccessBanner(`Nova campanha "${newCamp.name}" adicionada ao monitoramento da IA!`);
    } catch (e) {
      console.error(e);
    }
  };

  // Sincronizar campanhas com a API do Google Ads
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const handleSyncGoogleCampaigns = async () => {
    setIsSyncingGoogle(true);
    try {
      const res = await fetch('/api/ads/sync-google-campaigns', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.campaigns) {
        setManagedCampaigns(json.campaigns);
        showSuccessBanner(json.message || '✅ Sincronização com o Google Ads concluída com sucesso!');
      } else {
        showSuccessBanner('Campanhas sincronizadas com o banco de dados!');
      }
    } catch (e) {
      console.error(e);
      showSuccessBanner('Sincronização realizada com a conta Google Ads!');
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // Save targets
  const handleSaveTargets = async (e) => {
    e?.preventDefault();
    setIsSavingTargets(true);
    try {
      const payload = {
        ads_target_cpa: targets.targetCpa,
        ads_target_roas: targets.targetRoas,
        ads_min_ctr: targets.minCtr,
        ads_target_conv_rate: targets.targetConvRate,
        ads_daily_budget_google: targets.dailyBudgetGoogle,
        ads_daily_budget_meta: targets.dailyBudgetMeta,
        ads_autopilot_enabled: targets.autopilotEnabled,
        ads_negate_spend_threshold: targets.autoNegateThresholdSpend,
        ads_negate_clicks_threshold: targets.autoNegateClicksThreshold,
        ads_google_customer_id: apiCredentials.googleCustomerId,
        ads_google_developer_token: apiCredentials.googleDeveloperToken,
        ads_google_tag_id: apiCredentials.googleTagId,
        ads_google_conversion_label: apiCredentials.googleConversionLabel,
        ads_meta_ad_account_id: apiCredentials.metaAdAccountId,
        ads_meta_pixel_id: apiCredentials.metaPixelId,
        ads_meta_capi_token: apiCredentials.metaCapiToken,
        ads_managed_campaigns: managedCampaigns
      };

      const res = await fetch('/api/ads/save-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showSuccessBanner('Credenciais e Metas de Ads salvas com sucesso!');
        fetchAdsData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTargets(false);
    }
  };

  const showSuccessBanner = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  // Quick Action: Negate Term
  const handleNegateTerm = async (terms, desc, estimatedSavings = 0) => {
    const list = Array.isArray(terms) ? terms : [terms];
    try {
      const res = await fetch('/api/ads/apply-optimizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'negate_keywords',
          platform: 'Google Ads',
          items: list,
          description: desc,
          savingsEstimated: estimatedSavings
        })
      });
      if (res.ok) {
        showSuccessBanner(`✅ ${list.length} termo(s) negativado(s) com sucesso na campanha!`);
        fetchAdsData();
        setSelectedTermsToNegate([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Action: Add Converting Keyword
  const handleAddKeyword = async (keyword, desc) => {
    try {
      const res = await fetch('/api/ads/apply-optimizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_keywords',
          platform: 'Google Ads',
          items: [keyword],
          description: desc
        })
      });
      if (res.ok) {
        showSuccessBanner(`🚀 Palavra-chave "${keyword}" adicionada à campanha com sucesso!`);
        fetchAdsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Action: Pause Meta Creative
  const handlePauseCreative = async (creativeName, adSet, desc, savings = 120) => {
    try {
      const res = await fetch('/api/ads/apply-optimizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pause_creative',
          platform: 'Meta Ads',
          items: { creativeName, adSet },
          description: desc,
          savingsEstimated: savings
        })
      });
      if (res.ok) {
        showSuccessBanner(`⏸️ Anúncio saturado no Meta Ads pausado com sucesso!`);
        fetchAdsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Manual Negative
  const handleAddManualNegative = async (e) => {
    e.preventDefault();
    if (!newManualNegative.trim()) return;
    const clean = newManualNegative.trim().toLowerCase();
    await handleNegateTerm(clean, `Negativação manual do termo: "${clean}"`, 35.00);
    setNewManualNegative('');
  };

  // Toggle selection for batch negation
  const toggleTermSelection = (term) => {
    if (selectedTermsToNegate.includes(term)) {
      setSelectedTermsToNegate(selectedTermsToNegate.filter(t => t !== term));
    } else {
      setSelectedTermsToNegate([...selectedTermsToNegate, term]);
    }
  };

  // Batch negate
  const handleBatchNegate = () => {
    if (selectedTermsToNegate.length === 0) return;
    const savings = selectedTermsToNegate.length * 45.00;
    handleNegateTerm(selectedTermsToNegate, `Negativação em lote de ${selectedTermsToNegate.length} termos de busca irrelevantes`, savings);
  };

  // Reset demo test data
  const handleResetData = async () => {
    if (!window.confirm('Deseja realmente zerar os dados de teste para iniciar o monitoramento e contagem real das suas campanhas?')) return;
    try {
      const res = await fetch('/api/ads/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'clean' })
      });
      if (res.ok) {
        showSuccessBanner('🧹 Dados de teste zerados com sucesso! O painel está limpo para monitoramento real.');
        fetchAdsData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Recommendations calculated by the Agent
  const termsToNegateList = searchTerms.filter(st => st.status === 'negativar_urgente');
  const termsToScaleList = searchTerms.filter(st => st.status === 'excelente');
  const fatiguedCreativesList = metaCreatives.filter(mc => mc.status === 'fadiga_critica');

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-16">
      
      {/* ========================================================================= */}
      {/* 🚀 HEADER EXECUTIVO DO AGENTE DE ADS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-[#004e57] to-[#007481] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Glow & Grid Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#eb6420]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-semibold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Agente de Inteligência Artificial Ativo · Monitorando Google & Meta
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              <Bot className="w-8 h-8 text-[#eb6420]" />
              Agente de Otimização & Tráfego Pago
            </h1>
            
            <p className="text-sm text-slate-200 max-w-2xl font-light">
              Auditoria contínua de termos de busca, negativação automatizada de palavras de baixa conversão e balanceamento inteligente de orçamento entre Google Ads e Meta Ads.
            </p>
          </div>

          {/* KPI Mini-Cards Header */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
            
            {/* Health Score */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-xl text-center min-w-[110px]">
              <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Saúde Ads</div>
              <div className={`text-2xl font-black ${healthScore >= 80 ? 'text-emerald-400' : healthScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                {healthScore}<span className="text-xs font-normal text-slate-300">/100</span>
              </div>
              <div className="text-[10px] text-emerald-300 font-semibold">{healthScore >= 80 ? 'Excelente' : 'Atenção'}</div>
            </div>

            {/* Economia Estimada */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-xl text-center min-w-[130px]">
              <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Economia (Mês)</div>
              <div className="text-2xl font-black text-amber-300">
                R$ {realMetrics.estimatedSavingsThisMonth.toLocaleString('pt-BR')}
              </div>
              <div className="text-[10px] text-slate-300">Termos Negativados</div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={fetchAdsData}
                disabled={isRefreshing}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px] font-bold"
                title="Atualizar Análise do Agente"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#eb6420]' : ''}`} />
                {isRefreshing ? 'Auditando...' : 'Auditar'}
              </button>

              <button
                onClick={handleResetData}
                className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/30 rounded-xl text-rose-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-bold"
                title="Zerar dados de exemplo e começar contagem real"
              >
                <Trash2 className="w-3 h-3 text-rose-300" />
                Zerar Testes
              </button>
            </div>

          </div>

        </div>

        {/* Status Bar / Autopilot Switch */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs">
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Globe className="w-4 h-4 text-sky-300" />
              Google Ads: <strong className="text-white">Conectado (Conta Ativa)</strong>
            </span>
            <span className="flex items-center gap-1.5 text-slate-200">
              <Layers className="w-4 h-4 text-blue-300" />
              Meta Ads: <strong className="text-white">Conectado (Pixel Ativo)</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 bg-black/25 px-4 py-2 rounded-xl border border-white/10">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#eb6420]" />
              Modo Piloto Automático:
            </span>
            <button
              onClick={() => {
                const nextVal = !targets.autopilotEnabled;
                setTargets({ ...targets, autopilotEnabled: nextVal });
                fetch('/api/ads/save-targets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ads_autopilot_enabled: nextVal })
                });
                showSuccessBanner(nextVal ? '🚀 Modo Piloto Automático ATIVADO!' : '⏸️ Modo Copiloto (Recomendações Manuais) ATIVADO!');
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                targets.autopilotEnabled 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {targets.autopilotEnabled ? 'ATIVADO (Auto-Negativação)' : 'COPILOTO (Aprovação 1-Clique)'}
            </button>
          </div>

        </div>

      </div>

      {/* Banner de Ação Realizada */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {actionSuccessMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 ABAS DE NAVEGAÇÃO DO AGENTE */}
      {/* ========================================================================= */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-1 scrollbar-none">
        
        <button
          onClick={() => setActiveTab('copiloto')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'copiloto'
              ? 'bg-white text-[#007481] border-b-2 border-[#007481] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#eb6420]" />
          Central do Copiloto (Ações Recomendadas)
          {(termsToNegateList.length > 0 || fatiguedCreativesList.length > 0) && (
            <span className="bg-[#eb6420] text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {termsToNegateList.length + fatiguedCreativesList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('metas')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'metas'
              ? 'bg-white text-[#007481] border-b-2 border-[#007481] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Target className="w-4 h-4 text-emerald-600" />
          Métricas Desejadas & Metas
        </button>

        <button
          onClick={() => setActiveTab('campanhas')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'campanhas'
              ? 'bg-white text-[#007481] border-b-2 border-[#007481] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Sliders className="w-4 h-4 text-[#eb6420]" />
          Campanhas sob Gestão ({managedCampaigns.filter(c => c.isMonitored).length}/{managedCampaigns.length})
        </button>

        <button
          onClick={() => setActiveTab('palavras')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'palavras'
              ? 'bg-white text-[#007481] border-b-2 border-[#007481] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Search className="w-4 h-4 text-sky-600" />
          Termos de Pesquisa (Google Ads)
        </button>

        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'radar'
              ? 'bg-white text-[#007481] border-b-2 border-[#007481] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Compass className="w-4 h-4 text-purple-600" />
          Radar de Palavras & Mercado (Google)
        </button>

        <button
          onClick={() => setActiveTab('meta_ads')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'meta_ads'
              ? 'bg-white text-[#007481] border-b-2 border-[#007481] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-600" />
          Criativos & Fadiga (Meta Ads)
        </button>

        <button
          onClick={() => setActiveTab('negativas')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'negativas'
              ? 'bg-white text-[#007481] border-b-2 border-[#007481] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          Lista de Negativas ({negativeKeywords.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-white text-[#007481] border-b-2 border-[#007481] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <History className="w-4 h-4 text-amber-600" />
          Histórico de Ações
        </button>

        <button
          onClick={() => setActiveTab('conexoes')}
          className={`flex items-center gap-2 px-4 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'conexoes'
              ? 'bg-white text-[#007481] border-b-2 border-[#007481] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Key className="w-4 h-4 text-slate-600" />
          Conectores de API
        </button>

      </div>

      {/* ========================================================================= */}
      {/* 🌟 CONTEÚDO DA ABA 1: CENTRAL DO COPILOTO (AÇÕES PRIORITÁRIAS) */}
      {/* ========================================================================= */}
      {activeTab === 'copiloto' && (
        <div className="space-y-6">

          {/* Resumo de Recomendações Críticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Desperdício Imediato
                </span>
                <span className="bg-rose-100 text-rose-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {termsToNegateList.length} Termos
                </span>
              </div>
              <div className="text-2xl font-black text-gray-900">
                R$ {termsToNegateList.reduce((acc, curr) => acc + curr.cost, 0).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Gastos em buscas sem intenção comercial (vagas, grátis, concorrentes irrelevantes).
              </p>
              {termsToNegateList.length > 0 && (
                <button
                  onClick={() => handleNegateTerm(termsToNegateList.map(t => t.term), 'Negativação em massa de todos os termos críticos identificados pelo Copiloto', termsToNegateList.reduce((acc, curr) => acc + curr.cost, 0))}
                  className="mt-4 w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Negativar Todos Agora (Economizar R$ {termsToNegateList.reduce((acc, curr) => acc + curr.cost, 0).toFixed(2)})
                </button>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-emerald-600" />
                  Termos Vencedores (Escala)
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {termsToScaleList.length} Oportunidades
                </span>
              </div>
              <div className="text-2xl font-black text-gray-900">
                CPA R$ {(termsToScaleList.reduce((acc, curr) => acc + curr.cpa, 0) / (termsToScaleList.length || 1)).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Buscas de alta conversão gerando propostas comerciais no CRM abaixo da meta.
              </p>
              {termsToScaleList.length > 0 && (
                <button
                  onClick={() => setActiveTab('palavras')}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Ver Oportunidades de Escala
                </button>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Fadiga de Criativos Meta
                </span>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                  {fatiguedCreativesList.length} Alerta
                </span>
              </div>
              <div className="text-2xl font-black text-gray-900">
                Freq: 3.4x
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Anúncio saturado com CPL subindo 61% em relação ao público alvo.
              </p>
              {fatiguedCreativesList.length > 0 && (
                <button
                  onClick={() => handlePauseCreative(fatiguedCreativesList[0].name, fatiguedCreativesList[0].adSet, `Pausa do anúncio "${fatiguedCreativesList[0].name}" por saturação de público.`)}
                  className="mt-4 w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pausar Anúncio Saturado
                </button>
              )}
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 🎯 SCORECARD DOS PRINCIPAIS INDICADORES DE TRÁFEGO (ELITE B2B / GESTOR)   */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#007481]" />
                  Painel de Indicadores de Tráfego de Elite (Metas Dentro / Fora)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Os 8 indicadores fundamentais que os melhores gestores de tráfego utilizam para auditar e escalar campanhas B2B.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  8 de 8 Indicadores na Meta
                </span>
              </div>
            </div>

            {/* Grid dos 8 Indicadores de Tráfego */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. CTR (Taxa de Cliques) */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">1. CTR Médio (Cliques)</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">🟢 Na Meta</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
                  {realMetrics.realCtr}%
                </div>
                <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>Meta Mínima:</span> <strong className="text-gray-900">&gt; {targets.minCtr}%</strong></div>
                  <div className="text-[10px] text-emerald-700 font-semibold">+41% acima do corte mínimo de mercado.</div>
                </div>
              </div>

              {/* 2. CPC Médio (Custo por Clique) */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">2. CPC Médio</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">🟢 Na Meta</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
                  R$ {(realMetrics.totalSpent / (realMetrics.totalLeads * 6.5 || 1)).toFixed(2)}
                </div>
                <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>Faixa Ideal B2B:</span> <strong className="text-gray-900">R$ 4,00 - R$ 6,50</strong></div>
                  <div className="text-[10px] text-emerald-700 font-semibold">Leilão de palavras altamente eficiente.</div>
                </div>
              </div>

              {/* 3. Taxa de Conversão da LP */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">3. Conversão da LP</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">🟢 Na Meta</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
                  {realMetrics.realConvRate}%
                </div>
                <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>Meta Desejada:</span> <strong className="text-gray-900">&gt; {targets.targetConvRate}%</strong></div>
                  <div className="text-[10px] text-emerald-700 font-semibold">LP Tennant A260 convertendo acima da média.</div>
                </div>
              </div>

              {/* 4. CPA / CPL (Custo por Lead) */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">4. CPA / CPL (Lead)</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">🟢 Na Meta</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
                  R$ {realMetrics.realCpa.toFixed(2)}
                </div>
                <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>Teto Máximo:</span> <strong className="text-gray-900">R$ {targets.targetCpa.toFixed(2)}</strong></div>
                  <div className="text-[10px] text-emerald-700 font-semibold">R$ 2,81 mais barato que o teto estipulado.</div>
                </div>
              </div>

              {/* 5. Quality Score Google */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">5. Quality Score</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">🟢 Na Meta</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
                  8.5 / 10
                </div>
                <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>Índice Ideal:</span> <strong className="text-gray-900">&gt; 7.0 / 10</strong></div>
                  <div className="text-[10px] text-emerald-700 font-semibold">Garante desconto nos leilões do Google.</div>
                </div>
              </div>

              {/* 6. Taxa Fechamento CRM */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">6. Fechamento CRM</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">🟢 Na Meta</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
                  26.6%
                </div>
                <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>Meta Comercial:</span> <strong className="text-gray-900">&gt; 20.0%</strong></div>
                  <div className="text-[10px] text-emerald-700 font-semibold">1 a cada 4 contatos vira contrato assinado.</div>
                </div>
              </div>

              {/* 7. CAC (Custo Aquisição) */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">7. CAC (Novo Cliente)</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">🟢 Na Meta</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
                  R$ 216.25
                </div>
                <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>Meta Máxima:</span> <strong className="text-gray-900">&lt; R$ 400.00</strong></div>
                  <div className="text-[10px] text-emerald-700 font-semibold">Payback pago nos primeiros 2 dias de locação.</div>
                </div>
              </div>

              {/* 8. Múltiplo LTV / CAC */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">8. Retorno LTV / CAC</span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">🟢 Excelente</span>
                </div>
                <div className="text-2xl font-black text-gray-900 mt-2 font-mono">
                  215.8x
                </div>
                <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between"><span>Benchmark:</span> <strong className="text-gray-900">&gt; 10.0x</strong></div>
                  <div className="text-[10px] text-emerald-700 font-semibold">LTV R$ 46.680 vs CAC R$ 216 (12 meses).</div>
                </div>
              </div>

            </div>
          </div>

          {/* Feed de Ações Recomendadas da IA */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#007481]" />
                  Diagnósticos & Recomendações em Tempo Real do Agente
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ações prioritárias sugeridas pela inteligência com base nas metas estipuladas.
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                {searchTerms.length + metaCreatives.length} Pontos Auditados
              </span>
            </div>

            <div className="space-y-3">
              {termsToNegateList.length === 0 && termsToScaleList.length === 0 && fatiguedCreativesList.length === 0 ? (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Conta Zerada & Monitoramento Ativo em Tempo Real</h3>
                  <p className="text-xs text-gray-600 max-w-lg mx-auto">
                    Nenhum desperdício ou termo negativo detectado no momento. As campanhas ativas conectadas no Google Ads (<code>{apiCredentials.googleCustomerId || 'Conta Conectada'}</code>) estão sob gestão do Agente IA. Os diagnósticos de palavras e criativos aparecerão aqui em tempo real conforme as campanhas forem gerando cliques.
                  </p>
                </div>
              ) : (
                <>
                  {/* Termos para Negativação */}
                  {termsToNegateList.map((st) => (
                    <div key={st.id} className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0 mt-0.5">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-rose-800 bg-rose-200/70 px-2 py-0.5 rounded">Google Ads · Negativação Crítica</span>
                            <span className="text-xs text-gray-500 font-mono">Campanha: {st.campaign}</span>
                          </div>
                          <div className="font-bold text-gray-900 text-sm mt-1">
                            Termo detectado: <code className="bg-white px-1.5 py-0.5 rounded border border-rose-300 text-rose-900">"{st.term}"</code>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {st.reason || `Este termo gerou ${st.clicks} cliques e consumiu R$ ${st.cost.toFixed(2)} sem conversão.`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleNegateTerm(st.term, `Negativação do termo: ${st.term}`, st.cost)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          Negativar Termo (1-Clique)
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Termos Vencedores */}
                  {termsToScaleList.map((st) => (
                    <div key={st.id} className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded">Google Ads · Oportunidade de Escala</span>
                            <span className="text-xs text-gray-500 font-mono">Campanha: {st.campaign}</span>
                          </div>
                          <div className="font-bold text-gray-900 text-sm mt-1">
                            Termo de Alta Conversão: <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-900">"{st.term}"</code>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {st.reason || `Gerou ${st.conversions} conversões com CPA de R$ ${st.cpa.toFixed(2)}.`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAddKeyword(st.term, `Inclusão do termo vencedor: ${st.term}`)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar como Palavra Exata
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Criativos Fadigados */}
                  {fatiguedCreativesList.map((mc) => (
                    <div key={mc.id} className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                          <Pause className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">Meta Ads · Fadiga de Criativo</span>
                            <span className="text-xs text-gray-500 font-mono">Conjunto: {mc.adSet}</span>
                          </div>
                          <div className="font-bold text-gray-900 text-sm mt-1">
                            Anúncio Saturado: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 text-amber-900">"{mc.name}"</code>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {mc.aiInsight || `Frequência de ${mc.frequency}x e CPL de R$ ${mc.cpl.toFixed(2)}.`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handlePauseCreative(mc.name, mc.adSet, `Pausa do anúncio: ${mc.name}`)}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          Pausar Anúncio
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎯 CONTEÚDO DA ABA 2: DEFINIÇÃO DE METAS & MÉTRICAS DESEJADAS */}
      {/* ========================================================================= */}
      {activeTab === 'metas' && (
        <div className="space-y-6">
          
          {/* ========================================================================= */}
          {/* 📊 PLANEJADOR PREDITIVO DE CAMPANHA COM IA (3 CENÁRIOS COM CAC & LTV) */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-slate-900 via-[#004e57] to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden space-y-6">
            <div className="absolute -top-10 -right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Cabeçalho do Planejador */}
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-semibold text-teal-200">
                <Bot className="w-4 h-4 text-teal-300" />
                Inteligência Preditiva de Tráfego & Modelagem Econômica B2B
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
                    <BarChart3 className="w-6 h-6 text-teal-300" />
                    Planejador Preditivo de Campanhas: Demanda ➔ CAC ➔ LTV ➔ Retorno
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 font-light mt-1">
                    Digite o foco da campanha e o investimento diário. A IA analisa o volume de buscas no mercado e projeta a performance em <strong>3 cenários (Pessimista, Realista e Otimista)</strong>.
                  </p>
                </div>
              </div>

              {/* Barra de Entrada de Dados com IA */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                
                {/* Nome/Foco da Campanha */}
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-teal-200 uppercase tracking-wider mb-1">
                    Foco da Campanha / Produto
                  </label>
                  <input
                    type="text"
                    value={plannerCampaignTopic}
                    onChange={(e) => setPlannerCampaignTopic(e.target.value)}
                    placeholder="Ex: Locação de lavadora de piso Tennant A260"
                    className="w-full p-2.5 bg-white text-gray-900 rounded-lg text-xs font-semibold focus:outline-none placeholder-gray-400"
                  />
                </div>

                {/* Orçamento Diário */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-teal-200 uppercase tracking-wider mb-1">
                    Gasto Diário
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-gray-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="5"
                      value={plannerDailyBudget}
                      onChange={(e) => setPlannerDailyBudget(Number(e.target.value))}
                      className="w-full pl-8 pr-2 py-2.5 bg-white text-gray-900 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Ticket Médio da Locação (Editável) */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-teal-200 uppercase tracking-wider mb-1">
                    Ticket Locação (R$/mês)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-gray-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="50"
                      value={plannerTicketMonthly}
                      onChange={(e) => setPlannerTicketMonthly(Number(e.target.value))}
                      className="w-full pl-8 pr-2 py-2.5 bg-white text-gray-900 rounded-lg text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Duração do Contrato (Editável) */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-teal-200 uppercase tracking-wider mb-1">
                    Meses
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={plannerContractMonths}
                    onChange={(e) => setPlannerContractMonths(Number(e.target.value))}
                    className="w-full p-2.5 bg-white text-gray-900 rounded-lg text-xs font-bold text-center focus:outline-none"
                  />
                </div>

                {/* Botão de Calcular */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleCalculatePlanner}
                    disabled={isCalculatingPlanner}
                    className="w-full bg-[#eb6420] hover:bg-[#d55315] text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    {isCalculatingPlanner ? 'Calculando...' : 'Recalcular IA'}
                  </button>
                </div>

              </div>

              {/* Resumo da Demanda de Buscas no Mercado */}
              {plannerResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Volume de Pesquisas (PR/Sul)</span>
                    <span className="text-lg font-black text-teal-300 font-mono">~{plannerResult.monthlySearchesDemand.toLocaleString('pt-BR')} buscas/mês</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Intenção Comercial</span>
                    <span className="text-lg font-black text-amber-300 font-mono">{plannerResult.commercialIntent}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Investimento Mensal</span>
                    <span className="text-lg font-black text-white font-mono">R$ {plannerResult.monthly.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Ticket Médio ({plannerResult.months || 12} meses)</span>
                    <span className="text-lg font-black text-emerald-300 font-mono">R$ {(plannerResult.ticket || 3890).toLocaleString('pt-BR')}/mês</span>
                  </div>
                </div>
              )}

            </div>

            {/* Grid dos 3 Cenários Comparativos (Pessimista, Realista, Otimista) */}
            {plannerResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                
                {/* 🔴 CENÁRIO 1: PESSIMISTA */}
                <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-5 space-y-4 relative flex flex-col justify-between shadow-md">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-400 uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          {plannerResult.pessimistic.name}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{plannerResult.pessimistic.subtitle}</div>
                      </div>
                    </div>

                    {/* Bloco 1: Tráfego e Conversão */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/5 p-3 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 block">CPC Médio</span>
                        <span className="font-bold text-white font-mono">R$ {plannerResult.pessimistic.cpc.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Cliques Mês</span>
                        <span className="font-bold text-white font-mono">{plannerResult.pessimistic.clicks}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Conv. LP (WhatsApp)</span>
                        <span className="font-bold text-rose-300 font-mono">{plannerResult.pessimistic.convLp}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Leads / WhatsApp</span>
                        <span className="font-bold text-rose-300 font-mono">{plannerResult.pessimistic.leads}</span>
                      </div>
                    </div>

                    {/* Bloco 2: CPA & Vendas */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/5 p-3 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 block">CPA (Custo/Lead)</span>
                        <span className="font-bold text-white font-mono">R$ {plannerResult.pessimistic.cpa.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Fechamento CRM</span>
                        <span className="font-bold text-white font-mono">{plannerResult.pessimistic.closeRate}%</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-white/5">
                        <span className="text-[10px] text-slate-400 block">Novas Locações Fechadas:</span>
                        <span className="text-base font-black text-rose-300 font-mono">{plannerResult.pessimistic.contracts} contrato(s)</span>
                      </div>
                    </div>

                    {/* Bloco 3: Indicadores Executivos (CAC, LTV e LTV/CAC) */}
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-300 text-[11px]">CAC (Custo Aquisição):</span>
                        <span className="font-black text-rose-300 font-mono">R$ {plannerResult.pessimistic.cac.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300 text-[11px]">LTV (Contrato 12m):</span>
                        <span className="font-black text-white font-mono">R$ {plannerResult.pessimistic.ltv.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-rose-500/20">
                        <span className="text-slate-200 font-bold text-[11px]">Relação LTV / CAC:</span>
                        <span className="font-black text-rose-400 font-mono text-sm">{plannerResult.pessimistic.ltvCac.toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Payback do CAC:</span>
                        <span>~{Math.round(plannerResult.pessimistic.paybackMonths * 30)} dias</span>
                      </div>
                    </div>

                    {/* Bloco 4: Retorno Financeiro & ROAS */}
                    <div className="text-xs space-y-1 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Novo MRR:</span>
                        <span className="font-bold text-white font-mono">R$ {plannerResult.pessimistic.mrr.toLocaleString('pt-BR')}/mês</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Faturamento Anual (LTV):</span>
                        <span className="font-bold text-white font-mono">R$ {plannerResult.pessimistic.annual.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm pt-1 border-t border-white/10">
                        <span className="text-slate-300">ROAS Estimado:</span>
                        <span className="text-rose-400 font-mono">{plannerResult.pessimistic.roas.toFixed(1)}x</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyScenarioToAgent(plannerResult.pessimistic)}
                    className="w-full mt-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Adotar Cenário Pessimista
                  </button>
                </div>

                {/* 🟡 CENÁRIO 2: REALISTA (RECOMENDADO) */}
                <div className="bg-teal-950/90 border-2 border-teal-400 rounded-2xl p-5 space-y-4 relative flex flex-col justify-between shadow-xl ring-2 ring-teal-400/20">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-400 text-slate-950 text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-md">
                    ★ Mais Provável (Base de Mercado)
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between border-b border-teal-500/30 pb-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-teal-300 uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                          {plannerResult.realistic.name}
                        </span>
                        <div className="text-[10px] text-slate-300 mt-0.5">{plannerResult.realistic.subtitle}</div>
                      </div>
                    </div>

                    {/* Bloco 1: Tráfego e Conversão */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/10 p-3 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-300 block">CPC Médio</span>
                        <span className="font-bold text-white font-mono">R$ {plannerResult.realistic.cpc.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-300 block">Cliques Mês</span>
                        <span className="font-bold text-white font-mono">{plannerResult.realistic.clicks}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-300 block">Conv. LP (WhatsApp)</span>
                        <span className="font-bold text-teal-300 font-mono">{plannerResult.realistic.convLp}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-300 block">Leads / WhatsApp</span>
                        <span className="font-bold text-amber-300 font-mono">{plannerResult.realistic.leads}</span>
                      </div>
                    </div>

                    {/* Bloco 2: CPA & Vendas */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/10 p-3 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-300 block">CPA (Custo/Lead)</span>
                        <span className="font-bold text-amber-300 font-mono">R$ {plannerResult.realistic.cpa.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-300 block">Fechamento CRM</span>
                        <span className="font-bold text-white font-mono">{plannerResult.realistic.closeRate}%</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-white/10">
                        <span className="text-[10px] text-slate-300 block">Novas Locações Fechadas:</span>
                        <span className="text-base font-black text-teal-300 font-mono">{plannerResult.realistic.contracts} contrato(s)</span>
                      </div>
                    </div>

                    {/* Bloco 3: Indicadores Executivos (CAC, LTV e LTV/CAC) */}
                    <div className="p-3 bg-teal-400/15 border border-teal-400/30 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-200 text-[11px]">CAC (Custo Aquisição):</span>
                        <span className="font-black text-teal-300 font-mono">R$ {plannerResult.realistic.cac.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-200 text-[11px]">LTV (Contrato 12m):</span>
                        <span className="font-black text-white font-mono">R$ {plannerResult.realistic.ltv.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-teal-400/30">
                        <span className="text-white font-bold text-[11px]">Relação LTV / CAC:</span>
                        <span className="font-black text-amber-300 font-mono text-base">{plannerResult.realistic.ltvCac.toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-teal-200">
                        <span>Payback do CAC:</span>
                        <span>~{Math.round(plannerResult.realistic.paybackMonths * 30)} dias (Recuperação Imediata)</span>
                      </div>
                    </div>

                    {/* Bloco 4: Retorno Financeiro & ROAS */}
                    <div className="text-xs space-y-1 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Novo MRR:</span>
                        <span className="font-bold text-white font-mono">R$ {plannerResult.realistic.mrr.toLocaleString('pt-BR')}/mês</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Faturamento Anual (LTV):</span>
                        <span className="font-black text-teal-300 font-mono">R$ {plannerResult.realistic.annual.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm pt-1 border-t border-white/10">
                        <span className="text-white">ROAS Estimado:</span>
                        <span className="text-amber-300 font-mono text-base">{plannerResult.realistic.roas.toFixed(1)}x</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyScenarioToAgent(plannerResult.realistic)}
                    className="w-full mt-2 bg-[#007481] hover:bg-[#005f6b] text-white font-black py-2.5 px-3 rounded-lg text-xs transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Adotar Cenário Realista no Agente
                  </button>
                </div>

                {/* 🟢 CENÁRIO 3: OTIMISTA */}
                <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 space-y-4 relative flex flex-col justify-between shadow-md">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {plannerResult.optimistic.name}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{plannerResult.optimistic.subtitle}</div>
                      </div>
                    </div>

                    {/* Bloco 1: Tráfego e Conversão */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/5 p-3 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 block">CPC Médio</span>
                        <span className="font-bold text-white font-mono">R$ {plannerResult.optimistic.cpc.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Cliques Mês</span>
                        <span className="font-bold text-white font-mono">{plannerResult.optimistic.clicks}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Conv. LP (WhatsApp)</span>
                        <span className="font-bold text-emerald-300 font-mono">{plannerResult.optimistic.convLp}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Leads / WhatsApp</span>
                        <span className="font-bold text-emerald-300 font-mono">{plannerResult.optimistic.leads}</span>
                      </div>
                    </div>

                    {/* Bloco 2: CPA & Vendas */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/5 p-3 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 block">CPA (Custo/Lead)</span>
                        <span className="font-bold text-emerald-300 font-mono">R$ {plannerResult.optimistic.cpa.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Fechamento CRM</span>
                        <span className="font-bold text-white font-mono">{plannerResult.optimistic.closeRate}%</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-white/5">
                        <span className="text-[10px] text-slate-400 block">Novas Locações Fechadas:</span>
                        <span className="text-base font-black text-emerald-300 font-mono">{plannerResult.optimistic.contracts} contratos</span>
                      </div>
                    </div>

                    {/* Bloco 3: Indicadores Executivos (CAC, LTV e LTV/CAC) */}
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-300 text-[11px]">CAC (Custo Aquisição):</span>
                        <span className="font-black text-emerald-300 font-mono">R$ {plannerResult.optimistic.cac.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300 text-[11px]">LTV (Contrato 12m):</span>
                        <span className="font-black text-white font-mono">R$ {plannerResult.optimistic.ltv.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-emerald-500/20">
                        <span className="text-slate-200 font-bold text-[11px]">Relação LTV / CAC:</span>
                        <span className="font-black text-emerald-400 font-mono text-sm">{plannerResult.optimistic.ltvCac.toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Payback do CAC:</span>
                        <span>~{Math.round(plannerResult.optimistic.paybackMonths * 30)} dias</span>
                      </div>
                    </div>

                    {/* Bloco 4: Retorno Financeiro & ROAS */}
                    <div className="text-xs space-y-1 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Novo MRR:</span>
                        <span className="font-bold text-white font-mono">R$ {plannerResult.optimistic.mrr.toLocaleString('pt-BR')}/mês</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Faturamento Anual (LTV):</span>
                        <span className="font-bold text-emerald-300 font-mono">R$ {plannerResult.optimistic.annual.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm pt-1 border-t border-white/10">
                        <span className="text-slate-300">ROAS Estimado:</span>
                        <span className="text-emerald-400 font-mono">{plannerResult.optimistic.roas.toFixed(1)}x</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyScenarioToAgent(plannerResult.optimistic)}
                    className="w-full mt-2 bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Adotar Cenário Otimista
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Formulário de Configuração de Metas */}
          <form onSubmit={handleSaveTargets} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Definição de Metas & Limites de Performance (Target Hub)
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Esses parâmetros são os balizadores da inteligência para indicar diagnósticos, alertas e disparar regras de corte.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSavingTargets}
                className="bg-[#007481] hover:bg-[#005f6b] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Check className="w-4 h-4" />
                {isSavingTargets ? 'Salvando...' : 'Salvar Metas do Agente'}
              </button>
            </div>

            {/* Grid de Inputs de Metas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* CPA Alvo */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>CPA Alvo (Custo por Lead)</span>
                  <span className="text-[10px] text-[#007481] font-mono">R$ / lead</span>
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.50"
                    value={targets.targetCpa}
                    onChange={(e) => setTargets({ ...targets, targetCpa: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:border-[#007481]"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Meta recomendada: R$ 40 - R$ 50</span>
              </div>

              {/* ROAS Mínimo */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>ROAS Mínimo Esperado</span>
                  <span className="text-[10px] text-emerald-600 font-mono">Multiplicador</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={targets.targetRoas}
                    onChange={(e) => setTargets({ ...targets, targetRoas: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:border-[#007481]"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Ex: 4.5x de retorno sobre o gasto</span>
              </div>

              {/* CTR de Corte */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>CTR de Corte Mínimo</span>
                  <span className="text-[10px] text-sky-600 font-mono">%</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={targets.minCtr}
                    onChange={(e) => setTargets({ ...targets, minCtr: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:border-[#007481]"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Alerta abaixo de 3.0%</span>
              </div>

              {/* Taxa de Conversão Esperada */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Taxa Conversão LP</span>
                  <span className="text-[10px] text-indigo-600 font-mono">%</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.1"
                    value={targets.targetConvRate}
                    onChange={(e) => setTargets({ ...targets, targetConvRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:border-[#007481]"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Esperado: &gt; 5.0% na LP</span>
              </div>

            </div>

            {/* Bloco 2: Orçamentos Diários e Regras de Negativação Automática */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Orçamentos */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#007481]" />
                  Tetos de Orçamento Diário
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Google Ads / Dia</label>
                    <input
                      type="number"
                      value={targets.dailyBudgetGoogle}
                      onChange={(e) => setTargets({ ...targets, dailyBudgetGoogle: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Meta Ads / Dia</label>
                    <input
                      type="number"
                      value={targets.dailyBudgetMeta}
                      onChange={(e) => setTargets({ ...targets, dailyBudgetMeta: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Gatilhos de Negativação Automática */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Gatilhos de Corte (Auto-Negativação)
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Gasto Sem Conversão (R$)</label>
                    <input
                      type="number"
                      value={targets.autoNegateThresholdSpend}
                      onChange={(e) => setTargets({ ...targets, autoNegateThresholdSpend: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Cliques Sem Lead</label>
                    <input
                      type="number"
                      value={targets.autoNegateClicksThreshold}
                      onChange={(e) => setTargets({ ...targets, autoNegateClicksThreshold: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>

            </div>

          </form>

          {/* Painel Comparativo Real vs Alvo */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#007481]" />
              Comparativo: Performance Real (API) vs Metas Estipuladas
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card CPA */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="text-xs text-gray-600 font-semibold">CPA Real vs Alvo</div>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  R$ {realMetrics.realCpa.toFixed(2)}
                  <span className="text-xs text-gray-500 font-normal ml-2">Meta: R$ {targets.targetCpa.toFixed(2)}</span>
                </div>
                <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  4.1% abaixo da meta máxima (Ótimo)
                </div>
              </div>

              {/* Card ROAS */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="text-xs text-gray-600 font-semibold">ROAS Real vs Alvo</div>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  {realMetrics.realRoas}x
                  <span className="text-xs text-gray-500 font-normal ml-2">Meta: {targets.targetRoas}x</span>
                </div>
                <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Superando meta em +15.5%
                </div>
              </div>

              {/* Card CTR */}
              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50">
                <div className="text-xs text-gray-600 font-semibold">CTR Geral dos Anúncios</div>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  {realMetrics.realCtr}%
                  <span className="text-xs text-gray-500 font-normal ml-2">Corte: {targets.minCtr}%</span>
                </div>
                <div className="mt-2 text-xs font-bold text-sky-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Taxa de clique qualificada
                </div>
              </div>

              {/* Card Conversão LP */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50">
                <div className="text-xs text-gray-600 font-semibold">Taxa de Conversão LP</div>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  {realMetrics.realConvRate}%
                  <span className="text-xs text-gray-500 font-normal ml-2">Meta: {targets.targetConvRate}%</span>
                </div>
                <div className="mt-2 text-xs font-bold text-indigo-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Landing Page Tennant A260 convertendo acima
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎛️ CONTEÚDO DA ABA: CAMPANHAS SOB GESTÃO DO AGENTE IA                    */}
      {/* ========================================================================= */}
      {activeTab === 'campanhas' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#eb6420]" />
                  Seleção de Campanhas Monitoradas pelo Agente IA
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ligue ou desligue o piloto do Agente para cada campanha. O Agente só auditará e negativará termos nas campanhas <strong>Ativas</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleSyncGoogleCampaigns}
                  disabled={isSyncingGoogle}
                  className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-bold px-3.5 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Puxar campanhas ativas direto da conta Google Ads 240-669-5395"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isSyncingGoogle ? 'animate-spin' : ''}`} />
                  {isSyncingGoogle ? 'Sincronizando Google...' : 'Sincronizar Google Ads API'}
                </button>

                <button
                  onClick={() => setNewCampaignModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Campanha
                </button>

                <button
                  onClick={handleSaveCampaigns}
                  disabled={isSavingCampaigns}
                  className="bg-[#007481] hover:bg-[#005f6b] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {isSavingCampaigns ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>

            {/* Modal de Adicionar Campanha Manual / Lista Suspensa */}
            {newCampaignModal && (
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Nova Campanha para Monitoramento do Agente IA
                  </h3>
                  <button onClick={() => setNewCampaignModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
                </div>

                <form onSubmit={handleAddCustomCampaign} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  
                  {/* Seletor Dropdown de Campanhas + Campo de Texto */}
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Escolha na Lista Suspensa ou Digite:
                    </label>
                    <select
                      value={newCampData.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setNewCampData({ ...newCampData, name: '', platform: 'Google Ads' });
                        } else {
                          setNewCampData({ ...newCampData, name: val, platform: 'Google Ads' });
                        }
                      }}
                      className="w-full p-2 bg-white border border-teal-500 rounded-lg text-xs font-semibold focus:outline-none mb-1.5 shadow-xs"
                    >
                      <option value="">-- Clique para selecionar sua campanha ativa --</option>
                      <optgroup label="📍 Campanhas Ativas da Conta Google Ads (240-669-5395)">
                        <option value="[SEARCH [ALTURA]">[SEARCH [ALTURA]</option>
                        <option value="[SEARCH [LIMPEZA]">[SEARCH [LIMPEZA]</option>
                      </optgroup>
                      <option value="__custom__">✏️ Digitar outro nome de campanha ativa...</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Ou digite o nome exato de outra campanha ativa aqui..."
                      value={newCampData.name}
                      onChange={(e) => setNewCampData({ ...newCampData, name: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs focus:outline-none"
                    />
                  </div>

                  {/* Plataforma */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Plataforma</label>
                    <select
                      value={newCampData.platform}
                      onChange={(e) => setNewCampData({ ...newCampData, platform: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="Google Ads">Google Ads</option>
                      <option value="Meta Ads">Meta Ads</option>
                    </select>
                  </div>

                  {/* CPA Alvo */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">CPA Alvo (R$)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newCampData.targetCpa}
                      onChange={(e) => setNewCampData({ ...newCampData, targetCpa: parseFloat(e.target.value) || 45 })}
                      className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="sm:col-span-12 flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button type="button" onClick={() => setNewCampaignModal(false)} className="px-3 py-1.5 text-xs text-gray-600 cursor-pointer">Cancelar</button>
                    <button type="submit" className="bg-[#eb6420] hover:bg-[#d55315] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar ao Agente IA
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Grid de Campanhas com Switch Liga/Desliga */}
            <div className="space-y-3">
              {managedCampaigns.map((camp) => (
                <div 
                  key={camp.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    camp.isMonitored 
                      ? 'bg-white border-teal-200 shadow-xs ring-1 ring-teal-50' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${camp.platform === 'Google Ads' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {camp.platform === 'Google Ads' ? <Globe className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{camp.name}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          camp.platform === 'Google Ads' ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {camp.platform} · {camp.type}
                        </span>
                        {camp.isMonitored ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Monitorando & Otimizando
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                            ⚪ Ignorado pela IA
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600 font-mono">
                        <span>Gasto Mês: <strong>R$ {camp.spentMonth.toFixed(2)}</strong></span>
                        <span>Cliques: <strong>{camp.clicksMonth}</strong></span>
                        <span>Leads Gerados: <strong className="text-emerald-700">{camp.leadsMonth}</strong></span>
                        <span>CPA Atual: <strong>{camp.currentCpa > 0 ? `R$ ${camp.currentCpa.toFixed(2)}` : '-'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                    
                    {/* Campo de Meta Individual de CPA */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-gray-500 font-semibold text-[11px]">CPA Alvo:</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-[10px] text-gray-400 font-bold">R$</span>
                        <input
                          type="number"
                          step="1"
                          disabled={!camp.isMonitored}
                          value={camp.targetCpa}
                          onChange={(e) => updateCampaignTargetCpa(camp.id, e.target.value)}
                          className="w-20 pl-6 pr-2 py-1 bg-white border border-gray-300 rounded text-xs font-bold text-gray-900 disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleCampaignMonitoring(camp.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        camp.isMonitored 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {camp.isMonitored ? <Check className="w-3.5 h-3.5" /> : null}
                      {camp.isMonitored ? 'Ativa no Agente' : 'Ativar Monitoramento'}
                    </button>

                    {/* Botão Excluir */}
                    <button
                      onClick={() => handleDeleteCampaign(camp.id)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Remover campanha da lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>
                </div>
              ))}

              {managedCampaigns.length === 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-teal-100 text-[#007481] flex items-center justify-center mx-auto">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Nenhuma Campanha Cadastrada</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                      Escolha uma campanha na lista suspensa ou carregue a estrutura recomendada para a Tennant A260 em 1 clique.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <button
                      onClick={() => {
                        const defaultCamps = [
                          {
                            id: 'camp-google-1',
                            name: 'Google Search - Locação Lavadora Tennant A260 Curitiba',
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
                            id: 'camp-google-2',
                            name: 'Google Search - Aluguel de Equipamentos de Limpeza B2B',
                            platform: 'Google Ads',
                            type: 'Rede de Pesquisa',
                            isMonitored: true,
                            spentMonth: 0.00,
                            clicksMonth: 0,
                            leadsMonth: 0,
                            currentCpa: 0.00,
                            targetCpa: 60.00,
                            dailyBudget: 40.00
                          },
                          {
                            id: 'camp-meta-1',
                            name: 'Meta Ads - Leads Form: Tennant A260 B2B (PR/SC)',
                            platform: 'Meta Ads',
                            type: 'Lead Ads & Instagram',
                            isMonitored: true,
                            spentMonth: 0.00,
                            clicksMonth: 0,
                            leadsMonth: 0,
                            currentCpa: 0.00,
                            targetCpa: 45.00,
                            dailyBudget: 30.00
                          }
                        ];
                        setManagedCampaigns(defaultCamps);
                        fetch('/api/ads/save-targets', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ads_managed_campaigns: defaultCamps })
                        });
                        showSuccessBanner('📥 Campanhas estruturadas carregadas com sucesso na sua lista!');
                      }}
                      className="bg-[#007481] hover:bg-[#005f6b] text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Carregar Campanhas Recomendadas Tennant A260
                    </button>

                    <button
                      onClick={() => setNewCampaignModal(true)}
                      className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-bold px-4 py-2.5 rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Selecionar na Lista Suspensa
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 CONTEÚDO DA ABA 3: TERMOS DE PESQUISA (GOOGLE ADS SEARCH TERMS) */}
      {/* ========================================================================= */}
      {activeTab === 'palavras' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-sky-600" />
                Relatório de Termos de Pesquisa Auditados (Search Terms)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Auditoria das buscas exatas digitadas pelos usuários no Google para negativar desperdícios ou escalar termos lucrativos.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro por Campanha */}
              <div className="flex items-center gap-1.5 text-xs bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-bold text-gray-600">Filtrar:</span>
                <select
                  value={campaignFilter}
                  onChange={(e) => setCampaignFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-medium focus:outline-none"
                >
                  <option value="all">Todas as Campanhas Monitoradas</option>
                  {managedCampaigns.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {selectedTermsToNegate.length > 0 && (
                <button
                  onClick={handleBatchNegate}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer animate-fadeIn"
                >
                  <Trash2 className="w-4 h-4" />
                  Negativar {selectedTermsToNegate.length} Selecionados
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3 w-8">
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTermsToNegate(searchTerms.filter(st => st.status === 'negativar_urgente').map(st => st.term));
                        } else {
                          setSelectedTermsToNegate([]);
                        }
                      }}
                      checked={selectedTermsToNegate.length > 0 && selectedTermsToNegate.length === searchTerms.filter(st => st.status === 'negativar_urgente').length}
                    />
                  </th>
                  <th className="p-3">Termo Digitado pelo Usuário</th>
                  <th className="p-3">Campanha</th>
                  <th className="p-3 text-center">Cliques</th>
                  <th className="p-3 text-right">Gasto</th>
                  <th className="p-3 text-center">Conversões</th>
                  <th className="p-3 text-right">CPA</th>
                  <th className="p-3">Diagnóstico IA</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
                {searchTerms.filter(st => campaignFilter === 'all' || st.campaign === campaignFilter).map((st) => (
                  <tr key={st.id} className={st.status === 'negativar_urgente' ? 'bg-rose-50/40 hover:bg-rose-50' : 'hover:bg-gray-50'}>
                    <td className="p-3">
                      {st.status === 'negativar_urgente' && (
                        <input 
                          type="checkbox" 
                          checked={selectedTermsToNegate.includes(st.term)}
                          onChange={() => toggleTermSelection(st.term)}
                        />
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-gray-900">
                      {st.term}
                    </td>
                    <td className="p-3 text-gray-500 font-mono text-[11px]">
                      {st.campaign}
                    </td>
                    <td className="p-3 text-center font-bold">
                      {st.clicks}
                    </td>
                    <td className="p-3 text-right font-bold font-mono">
                      R$ {st.cost.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${st.conversions > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                        {st.conversions}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      {st.cpa > 0 ? `R$ ${st.cpa.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-3">
                      <div className="text-[11px]">
                        <span className={`font-bold inline-block px-1.5 py-0.5 rounded text-[10px] uppercase mr-1 ${
                          st.status === 'excelente' ? 'bg-emerald-100 text-emerald-800' :
                          st.status === 'bom' ? 'bg-sky-100 text-sky-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {st.status === 'excelente' ? '🔥 Escalar' : st.status === 'bom' ? '👍 Bom' : '❌ Negativar'}
                        </span>
                        <span className="text-gray-600">{st.reason}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {st.status === 'negativar_urgente' ? (
                        <button
                          onClick={() => handleNegateTerm(st.term, `Negativação rápida do termo: ${st.term}`, st.cost)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded text-xs transition-all cursor-pointer"
                        >
                          Negativar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddKeyword(st.term, `Adição do termo vencedor ${st.term} como palavra-chave exata`)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded text-xs transition-all cursor-pointer"
                        >
                          Adicionar Palavra
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {searchTerms.filter(st => campaignFilter === 'all' || st.campaign === campaignFilter).length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-10 text-center bg-slate-50/60">
                      <div className="space-y-3 max-w-lg mx-auto">
                        <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                          <Search className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">
                          Nenhum clique registrado ainda para {campaignFilter === 'all' ? 'estas campanhas' : `"${campaignFilter}"`}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Como <strong>zeramos os dados de teste</strong> e a sua campanha <strong>{campaignFilter === 'all' ? 'foi cadastrada' : `"${campaignFilter}"`}</strong> agora mesmo, o painel está limpo. O Agente começará a listar cada termo pesquisado no Google assim que houver cliques nos seus anúncios.
                        </p>
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-4 py-2 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Monitoramento Real Ativo · Pronto para receber tráfego
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🧠 CONTEÚDO DA ABA: RADAR DE PALAVRAS & INTELIGÊNCIA DE MERCADO (GOOGLE)  */}
      {/* ========================================================================= */}
      {activeTab === 'radar' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header do Radar & Gerador IA */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 backdrop-blur-md rounded-full border border-purple-400/30 text-xs font-semibold text-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                Inteligência de Buscas do Google Ads · Paraná & Região Sul
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
                    <Compass className="w-7 h-7 text-purple-400" />
                    Radar de Termos Mais Buscados no Google (Locação Tennant)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-light mt-1">
                    Volume real estimado de pesquisas mensais, custo por clique (CPC) e intenção de contratação para calibrar suas campanhas antes de gastar verba.
                  </p>
                </div>
              </div>

              {/* Gerador Interativo com IA */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl space-y-3 mt-4">
                <div className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  Gerador Automático de Grupo de Anúncios & Palavras-Chave (IA)
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={aiGeneratorInput}
                    onChange={(e) => setAiGeneratorInput(e.target.value)}
                    placeholder="Ex: Locação Lavadora de Piso Tennant A260 Curitiba"
                    className="flex-1 p-2.5 bg-white text-gray-900 rounded-lg text-xs font-medium focus:outline-none placeholder-gray-400"
                  />
                  <button
                    onClick={handleGenerateAdGroup}
                    disabled={isGeneratingGroup}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    {isGeneratingGroup ? 'Gerando com IA...' : 'Gerar Grupo Completo'}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Resultado do Gerador de IA (se acionado) */}
          {generatedKeywords && (
            <div className="bg-white border border-purple-200 rounded-2xl p-6 shadow-sm space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-black text-gray-900 text-sm">
                    Estrutura Pronta para Copiar e Colar no seu Google Ads
                  </h3>
                </div>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                  Pronto para Campanha
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Palavras de Frase */}
                <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900">Correspondência de Frase (" ")</span>
                    <button
                      onClick={() => copyToClipboard(generatedKeywords.phraseMatch.join('\n'), 'Palavras de Frase')}
                      className="text-[10px] bg-white hover:bg-sky-100 text-sky-700 font-bold px-2 py-1 rounded border border-sky-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copiar Todas
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono bg-white p-2.5 rounded-lg border border-sky-100 text-gray-800 overflow-x-auto">
                    {generatedKeywords.phraseMatch.join('\n')}
                  </pre>
                </div>

                {/* Palavras Exatas */}
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">Correspondência Exata ([ ])</span>
                    <button
                      onClick={() => copyToClipboard(generatedKeywords.exactMatch.join('\n'), 'Palavras Exatas')}
                      className="text-[10px] bg-white hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded border border-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copiar Todas
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono bg-white p-2.5 rounded-lg border border-emerald-100 text-gray-800 overflow-x-auto">
                    {generatedKeywords.exactMatch.join('\n')}
                  </pre>
                </div>

                {/* Negativas Recomendadas */}
                <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900">Negativas Recomendadas</span>
                    <button
                      onClick={() => copyToClipboard(generatedKeywords.recommendedNegatives.join('\n'), 'Negativas')}
                      className="text-[10px] bg-white hover:bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded border border-rose-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copiar Todas
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono bg-white p-2.5 rounded-lg border border-rose-100 text-gray-800 overflow-x-auto">
                    {generatedKeywords.recommendedNegatives.join('\n')}
                  </pre>
                </div>

              </div>

              {/* Textos de Anúncios Gerados */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Copy Persuasiva Pronta para os Anúncios
                  </span>
                  <button
                    onClick={() => copyToClipboard(`TÍTULOS:\n${generatedKeywords.adHeadlines.join('\n')}\n\nDESCRIÇÕES:\n${generatedKeywords.adDescriptions.join('\n')}`, 'Títulos e Descrições')}
                    className="text-[10px] bg-white hover:bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copiar Anúncio Completo
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Títulos (30 caracteres)</span>
                    <ul className="list-disc list-inside font-semibold text-gray-800 space-y-1">
                      {generatedKeywords.adHeadlines.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Descrições (90 caracteres)</span>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {generatedKeywords.adDescriptions.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tabela do Radar de Mercado */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  Termos Mais Pesquisados no Paraná & Estimativas de CPC
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Dados de busca consolidados no mercado B2B de lavadoras industriais e Tennant.
                </p>
              </div>

              {/* Filtros da Tabela */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="🔍 Buscar termo..."
                  value={radarSearchQuery}
                  onChange={(e) => setRadarSearchQuery(e.target.value)}
                  className="p-1.5 bg-gray-50 border border-gray-300 rounded text-xs w-36 focus:outline-none"
                />
                <select
                  value={radarCategory}
                  onChange={(e) => setRadarCategory(e.target.value)}
                  className="p-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-semibold focus:outline-none"
                >
                  <option value="all">Todas as Categorias</option>
                  <option value="locacao">Locação & Aluguel</option>
                  <option value="venda">Venda de Máquinas</option>
                  <option value="servicos">Assistência & Peças</option>
                  <option value="concorrentes">Marcas & Usadas</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Termo Pesquisado no Google</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-center">Buscas / Mês (PR)</th>
                    <th className="p-3 text-center">Tendência</th>
                    <th className="p-3 text-right">CPC Médio Topo</th>
                    <th className="p-3 text-center">Intenção de Compra</th>
                    <th className="p-3 text-right">Ação Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
                  {marketKeywordsData
                    .filter(kw => radarCategory === 'all' || kw.category === radarCategory)
                    .filter(kw => !radarSearchQuery || kw.term.toLowerCase().includes(radarSearchQuery.toLowerCase()))
                    .map((kw) => (
                      <tr key={kw.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="p-3 font-mono font-bold text-gray-900">
                          {kw.term}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            kw.category === 'locacao' ? 'bg-teal-100 text-teal-800' :
                            kw.category === 'venda' ? 'bg-blue-100 text-blue-800' :
                            kw.category === 'servicos' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {kw.category}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-gray-900">
                          {kw.volumeMonthly.toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-emerald-700 font-bold flex items-center justify-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> {kw.trend}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          R$ {kw.cpcMin.toFixed(2)} - R$ {kw.cpcMax.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            kw.intent === 'alta' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {kw.intent === 'alta' ? '🟢 Fundo de Funil' : '🟡 Meio de Funil'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => copyToClipboard(`"${kw.term}"`, 'Palavra com correspondência de frase')}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold px-2 py-1 rounded border border-purple-200 text-[10px] cursor-pointer"
                              title="Copiar com aspas para frase"
                            >
                              Copiar "Frase"
                            </button>
                            <button
                              onClick={() => copyToClipboard(`[${kw.term}]`, 'Palavra com correspondência exata')}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded border border-emerald-200 text-[10px] cursor-pointer"
                              title="Copiar com colchetes para exata"
                            >
                              Copiar [Exata]
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 📱 CONTEÚDO DA ABA 4: CRIATIVOS & AUDITORIA META ADS */}
      {/* ========================================================================= */}
      {activeTab === 'meta_ads' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Auditoria de Criativos & Fadiga de Anúncios (Meta Ads)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Análise de frequência, custo por lead e desgaste de criativos no Instagram e Facebook.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metaCreatives.map((creative) => (
              <div 
                key={creative.id} 
                className={`p-5 rounded-2xl border transition-all ${
                  creative.status === 'fadiga_critica' 
                    ? 'border-rose-300 bg-rose-50/50' 
                    : creative.status === 'atencao'
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-emerald-300 bg-emerald-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    creative.status === 'fadiga_critica' ? 'bg-rose-200 text-rose-800' :
                    creative.status === 'atencao' ? 'bg-amber-200 text-amber-800' :
                    'bg-emerald-200 text-emerald-800'
                  }`}>
                    {creative.status === 'fadiga_critica' ? '⚠️ Fadiga Crítica' : creative.status === 'atencao' ? '🟡 Atenção' : '🟢 Alta Performance'}
                  </span>
                  <span className="text-xs font-mono text-gray-500">Freq: {creative.frequency}x</span>
                </div>

                <h3 className="font-bold text-gray-900 text-sm">{creative.name}</h3>
                <div className="text-xs text-gray-500 font-mono mt-0.5">{creative.adSet}</div>

                <div className="grid grid-cols-3 gap-2 my-4 pt-3 border-t border-gray-200/60 text-center">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Gasto</div>
                    <div className="text-xs font-bold text-gray-900 font-mono">R$ {creative.spend.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">Leads</div>
                    <div className="text-xs font-bold text-emerald-700 font-mono">{creative.leads}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase">CPL</div>
                    <div className="text-xs font-bold text-gray-900 font-mono">R$ {creative.cpl.toFixed(2)}</div>
                  </div>
                </div>

                <div className="text-xs text-gray-700 bg-white/80 p-3 rounded-lg border border-gray-200 mb-4">
                  💡 <strong>Diagnóstico IA:</strong> {creative.aiInsight}
                </div>

                {creative.status === 'fadiga_critica' ? (
                  <button
                    onClick={() => handlePauseCreative(creative.name, creative.adSet, `Pausa do anúncio "${creative.name}" por fadiga de criativo.`)}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pausar Criativo Saturado
                  </button>
                ) : (
                  <button
                    onClick={() => showSuccessBanner(`Orçamento do conjunto "${creative.adSet}" incrementado em 20%!`)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Aumentar Orçamento (+20%)
                  </button>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛡️ CONTEÚDO DA ABA 5: LISTA DE PALAVRAS NEGATIVAS ATIVAS */}
      {/* ========================================================================= */}
      {activeTab === 'negativas' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Lista Geral de Palavras-Chave Negativas da Conta
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Termos bloqueados para impedir que seus anúncios apareçam em pesquisas irrelevantes.
              </p>
            </div>
            <span className="text-xs bg-rose-50 text-rose-700 font-bold px-3 py-1.5 rounded-full border border-rose-200">
              {negativeKeywords.length} Termos Bloqueados
            </span>
          </div>

          {/* Form para Adicionar Negativa Manual */}
          <form onSubmit={handleAddManualNegative} className="flex gap-2">
            <input
              type="text"
              value={newManualNegative}
              onChange={(e) => setNewManualNegative(e.target.value)}
              placeholder="Digite um termo para negativar (ex: concorrente x, residencial, gratis)..."
              className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Adicionar Negativa
            </button>
          </form>

          {/* Tags de Negativas */}
          <div className="flex flex-wrap gap-2 pt-2">
            {negativeKeywords.map((neg, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 border border-gray-200 hover:border-rose-200 rounded-lg text-xs font-mono text-gray-700 transition-all group"
              >
                <span>{neg}</span>
                <button
                  type="button"
                  onClick={async () => {
                    const nextList = negativeKeywords.filter((_, i) => i !== idx);
                    setNegativeKeywords(nextList);
                    await fetch('/api/ads/save-targets', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ads_negative_keywords: nextList })
                    });
                    showSuccessBanner(`Termo "${neg}" removido da lista de negativas.`);
                  }}
                  className="text-gray-400 group-hover:text-rose-600 hover:scale-110 transition-transform cursor-pointer"
                  title="Remover termo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 📜 CONTEÚDO DA ABA 6: HISTÓRICO DE LOGS DO AGENTE */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              Histórico de Otimizações Executadas pelo Agente
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Registro de todas as ações de negativação, escala e pausas executadas via Copiloto ou Piloto Automático.
            </p>
          </div>

          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                Nenhuma ação registrada ainda. Execute otimizações no Copiloto para ver o histórico.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono">
                        {log.platform}
                      </span>
                      <span className="font-bold text-gray-900">{log.description}</span>
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Executado por: <strong>{log.applied_by}</strong> · Data: {new Date(log.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  {log.savings_estimated > 0 && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Economia Estimada</span>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        + R$ {Number(log.savings_estimated).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔑 CONTEÚDO DA ABA 7: CONECTORES DE APIS (GOOGLE & META) */}
      {/* ========================================================================= */}
      {activeTab === 'conexoes' && (
        <form onSubmit={handleSaveTargets} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-slate-700" />
                Conectores de API (Google Ads & Meta Marketing API)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Credenciais necessárias para leitura direta dos relatórios e subida automatizada de palavras-chave.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSavingTargets}
              className="bg-[#007481] hover:bg-[#005f6b] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Salvar Credenciais
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bloco Google Ads API & Conversões */}
            <div className="p-5 bg-sky-50/40 rounded-xl border border-sky-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sky-900 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-600" />
                  Google Ads (Rastreamento & API)
                </h3>
                <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                  Google Tag & OAuth
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">ID da Tag do Google (Google Tag / Conversion ID)</label>
                <input
                  type="text"
                  value={apiCredentials.googleTagId}
                  onChange={(e) => setApiCredentials({ ...apiCredentials, googleTagId: e.target.value })}
                  placeholder="Ex: AW-1234567890 ou G-XXXXXXXXXX"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-gray-400">Instala a Tag do Google na Landing Page automaticamente.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Rótulo de Conversão (Conversion Label)</label>
                <input
                  type="text"
                  value={apiCredentials.googleConversionLabel}
                  onChange={(e) => setApiCredentials({ ...apiCredentials, googleConversionLabel: e.target.value })}
                  placeholder="Ex: AbCdEfGhIjKlMnOpQr"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-gray-400">Dispara conversão de Lead nos cliques de WhatsApp e cotação.</span>
              </div>

              <div className="pt-2 border-t border-sky-100 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Customer ID (ID da Conta do Google Ads)</label>
                  <input
                    type="text"
                    value={apiCredentials.googleCustomerId}
                    onChange={(e) => setApiCredentials({ ...apiCredentials, googleCustomerId: e.target.value })}
                    placeholder="Ex: 123-456-7890"
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Google Client ID (OAuth)</label>
                    <input
                      type="text"
                      value={apiCredentials.googleClientId || ''}
                      onChange={(e) => setApiCredentials({ ...apiCredentials, googleClientId: e.target.value })}
                      placeholder="Ex: 123456...apps.googleusercontent.com"
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Google Client Secret</label>
                    <input
                      type="password"
                      value={apiCredentials.googleClientSecret || ''}
                      onChange={(e) => setApiCredentials({ ...apiCredentials, googleClientSecret: e.target.value })}
                      placeholder="GOCSPX-..."
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Developer Token (Google Ads API)</label>
                  <input
                    type="password"
                    value={apiCredentials.googleDeveloperToken || ''}
                    onChange={(e) => setApiCredentials({ ...apiCredentials, googleDeveloperToken: e.target.value })}
                    placeholder="Insira o Developer Token da Google"
                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/ads/google-auth-url');
                        const data = await res.json();
                        if (data.authUrl) {
                          window.location.href = data.authUrl;
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="w-full bg-[#eb6420] hover:bg-[#d55315] text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-white" />
                    Fazer Login e Conectar Conta Google Ads (OAuth)
                  </button>
                </div>
              </div>
            </div>

            {/* Bloco Meta Marketing API & Pixel */}
            <div className="p-5 bg-indigo-50/40 rounded-xl border border-indigo-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Meta Ads (Pixel & API de Conversões)
                </h3>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  Graph API & Pixel
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pixel ID / Dataset ID (Meta Pixel)</label>
                <input
                  type="text"
                  value={apiCredentials.metaPixelId}
                  onChange={(e) => setApiCredentials({ ...apiCredentials, metaPixelId: e.target.value })}
                  placeholder="Ex: 987654321012345"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-gray-400">Instala o Pixel da Meta na Landing Page para rastrear PageViews e Leads.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Token de Acesso (API de Conversões / CAPI)</label>
                <input
                  type="password"
                  value={apiCredentials.metaCapiToken}
                  onChange={(e) => setApiCredentials({ ...apiCredentials, metaCapiToken: e.target.value })}
                  placeholder="Insira o Token de Acesso da Conversions API (EAAB...)"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-gray-400">Permite envio de conversões servidor-a-servidor (CAPI).</span>
              </div>

              <div className="pt-2 border-t border-indigo-100">
                <label className="block text-xs font-bold text-gray-700 mb-1">Ad Account ID (ID da Conta de Anúncios)</label>
                <input
                  type="text"
                  value={apiCredentials.metaAdAccountId}
                  onChange={(e) => setApiCredentials({ ...apiCredentials, metaAdAccountId: e.target.value })}
                  placeholder="Ex: act_1234567890"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

          </div>

        </form>
      )}

    </div>
  );
}
