import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Wrench, 
  Zap, 
  TrendingUp, 
  Sparkles, 
  ChevronRight, 
  Phone, 
  MessageSquare, 
  FileText, 
  Download, 
  Play, 
  Star, 
  ArrowRight, 
  Award, 
  BarChart3, 
  Gauge, 
  Droplet, 
  Volume2, 
  Layers, 
  Check, 
  HelpCircle, 
  ChevronDown, 
  Building2, 
  Warehouse, 
  ShoppingBag, 
  Hotel, 
  Factory,
  RefreshCw,
  Send,
  Calendar,
  DollarSign,
  Mail
} from 'lucide-react';

export default function LpTennantA260() {
  // Navigation & Mode States
  const [activeTab, setActiveTab] = useState('locacao'); // 'locacao' | 'venda' | 'assistencia'
  const [activePlan, setActivePlan] = useState('mensal'); // 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'longo_prazo'
  const [openFaq, setOpenFaq] = useState(null);
  const [activeVideo, setActiveVideo] = useState(0);
  const [selectedArea, setSelectedArea] = useState(2500); // m² para calculadora de ROI
  const [selectedCleaners, setSelectedCleaners] = useState(3); // funcionários atuais

  // Form State
  const [formState, setFormState] = useState({
    nome: '',
    empresa: '',
    telefone: '',
    cidade: 'Curitiba e Região',
    interesse: 'Locação',
    periodo: 'Mensal',
    mensagem: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Phone & Email contacts (Clean Tech Smart)
  const WHATSAPP_NUMBER = "5541985083658";
  const WHATSAPP_DISPLAY = "(41) 98508-3658";
  const EMAIL_CONTATO = "vendas@cleantechpro.com.br";

  // =========================================================================
  // 🔗 LINKS DAS IMAGENS (Cole aqui os links das suas fotos reais ou catálogo)
  // =========================================================================
  const FOTO_MAQUINA_PRINCIPAL = "https://www.tennantco.com/services/product/image.tennant-br.a260.image"; // Foto principal da A-260
  const FOTO_ASSISTENCIA_TECNICA = "https://www.tennantco.com/services/product/image.tennant-br.a260.image"; // Foto da oficina/técnico
  const FOTO_BANNER_VIDEO = "https://www.tennantco.com/services/product/image.tennant-br.a260.image"; // Foto capa dos vídeos

  // ROI Calculator Math
  const roiData = useMemo(() => {
    // Produtividade A-260: ~1.200 m²/h média real
    const horasComA260 = (selectedArea / 1200).toFixed(1);
    // Produtividade manual com mop/rodo: ~180 m²/h por funcionário
    const horasManual = (selectedArea / (selectedCleaners * 180)).toFixed(1);
    
    // Custo estimado por operador CLT em Curitiba (Salário + Encargos + VT + VR): ~R$ 3.200/mês
    const custoManualMensal = selectedCleaners * 3200;
    // Custo estimado de locação da A-260: ~R$ 3.490 a R$ 4.200 (mensal ou longo prazo)
    const custoLocacaoMensal = 3800;
    
    // Economia mensal líquida liberando mão de obra para outras tarefas
    const economiaMensal = Math.max(0, custoManualMensal - custoLocacaoMensal);
    const economiaAnual = economiaMensal * 12;
    const tempoEconomizadoPercent = Math.round(((horasManual - horasComA260) / (horasManual || 1)) * 100);

    return {
      horasComA260,
      horasManual,
      custoManualMensal,
      custoLocacaoMensal,
      economiaMensal,
      economiaAnual,
      tempoEconomizadoPercent: Math.max(50, Math.min(85, tempoEconomizadoPercent || 70))
    };
  }, [selectedArea, selectedCleaners]);

  // Video Gallery Data
  const videos = [
    {
      id: 0,
      title: "Tennant A-260 em Ação: Limpeza Profissional com 1 Toque",
      duracao: "1:45 min",
      tag: "Demonstração Prática",
      description: "Veja a alta capacidade de remoção de sujidades pesadas, secagem instantânea do piso com rodo Linatex e facilidade de manobra em corredores e galpões.",
      youtubeEmbedId: "dQw4w9WgXcQ", // Cole aqui o ID do vídeo do YouTube
      thumbnail: FOTO_BANNER_VIDEO
    },
    {
      id: 1,
      title: "Troca Rápida de Escova e Manutenção Diária Yellow-Touch Points",
      duracao: "2:10 min",
      tag: "Facilidade de Operação",
      description: "Demonstração dos pontos de toque amarelos da Tennant: remoção de escova e rodo sem necessidade de nenhuma ferramenta mecânica.",
      youtubeEmbedId: "dQw4w9WgXcQ",
      thumbnail: FOTO_BANNER_VIDEO
    },
    {
      id: 2,
      title: "Assistência Técnica Autorizada Clean Tech Smart em Curitiba",
      duracao: "2:30 min",
      tag: "Estrutura & Suporte",
      description: "Conheça nosso laboratório técnico, frota de atendimento in-company no Paraná e estoque de peças 100% originais a pronta entrega.",
      youtubeEmbedId: "dQw4w9WgXcQ",
      thumbnail: FOTO_ASSISTENCIA_TECNICA
    }
  ];

  // FAQ Data
  const faqs = [
    {
      q: "Qual a diferença entre a locação e a compra da Tennant A-260?",
      a: "Na locação, você não imobiliza capital, tem dedução de 100% das parcelas como despesa operacional (PIS/COFINS no Lucro Real), e a Clean Tech Smart assume toda a manutenção preventiva, corretiva e reposição de peças. Na compra, você adquire um ativo de altíssima durabilidade com garantia oficial e suporte de nossa equipe autorizada."
    },
    {
      q: "Como funciona a assistência técnica autorizada em Curitiba e Região?",
      a: "Somos assistência e representantes técnicos autorizados Tennant. Dispomos de oficina volante que atende diretamente no seu galpão/empresa em Curitiba, Região Metropolitana e interior do PR, além de laboratório próprio e peças de reposição 100% originais a pronta entrega."
    },
    {
      q: "Quais os prazos disponíveis para locação da lavadora?",
      a: "Oferecemos flexibilidade total: Diária (para limpezas pontuais e pós-obra), Semanal, Quinzenal, Mensal e contratos corporativos de longo prazo de 12, 24, 36, 48 até 60 meses com condições e valores altamente competitivos."
    },
    {
      q: "A máquina já vem pronta para uso com treinamento?",
      a: "Sim! Em qualquer modalidade (Venda ou Locação), nossos técnicos realizam a entrega técnica no seu estabelecimento, testando o equipamento e capacitando gratuitamente sua equipe de limpeza."
    },
    {
      q: "O que acontece se a máquina precisar de manutenção durante a locação?",
      a: "Nosso SLA de atendimento é prioritário. Enviamos um técnico autorizado ao local e, caso o reparo exija transporte da máquina, fornecemos um equipamento reserva para que sua operação nunca pare."
    }
  ];

  const handleWhatsAppRedirect = (customMsg = null) => {
    const text = customMsg || `Olá! Gostaria de uma proposta para a Lavadora Tennant A-260 (${activeTab.toUpperCase()}) em Curitiba e Região.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Envia lead para o backend do Clean Tech Smart
      const payload = {
        name: formState.nome,
        company: formState.empresa,
        phone: formState.telefone,
        contact_name: formState.nome,
        stage: 'inbox',
        value: activeTab === 'locacao' ? 4500 : 28000,
        label: `LP Tennant A-260 (${formState.interesse})`,
        notes: `Interesse: ${formState.interesse} | Período: ${formState.periodo} | Cidade: ${formState.cidade} | Mensagem: ${formState.mensagem}`
      };

      // Tenta salvar no endpoint do CRM
      try {
        await fetch('/api/crm/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Registro local ou offline:', err);
      }

      setSubmittedSuccess(true);
      
      // Abre também o WhatsApp com a mensagem personalizada pronta
      setTimeout(() => {
        const msg = `Olá! Meu nome é ${formState.nome} da empresa ${formState.empresa || 'N/A'}. Solicitei uma cotação da Tennant A-260 para ${formState.interesse} (${formState.periodo}) em ${formState.cidade}.`;
        handleWhatsAppRedirect(msg);
      }, 1200);

    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. TOP BAR DE AUTORIDADE OFICIAL TENNANT (FIXO)                            */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-b border-cyan-500/20 py-2 px-4 text-xs tracking-wide">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-cyan-300 font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-semibold text-white">REPRESENTANTE & ASSISTÊNCIA TÉCNICA AUTORIZADA TENNANT</span>
            <span className="hidden md:inline text-slate-400">| Atendimento em Curitiba, Região Metropolitana e todo o Paraná</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <a 
              href={`mailto:${EMAIL_CONTATO}`}
              className="hidden md:flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              {EMAIL_CONTATO}
            </a>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              Oficina Própria & Peças Originais
            </span>
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors font-semibold text-white flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5 text-cyan-400" /> (41) 98508-3658
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HEADER PRINCIPAL STICKY (IDENTIDADE VISUAL TENNANT + CLEAN TECH SMART) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logos Co-Branding */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Tennant Badge Icon */}
            <div className="flex items-center gap-2 bg-gradient-to-br from-cyan-600 to-teal-800 px-3.5 py-1.5 rounded-lg shadow-lg border border-cyan-400/30">
              <span className="text-white font-black tracking-widest text-lg font-mono">TENNANT</span>
            </div>
            
            <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>

            <div className="flex flex-col">
              <span className="font-bold text-white tracking-tight text-sm sm:text-base flex items-center gap-1.5">
                Clean Tech Smart
                <span className="bg-cyan-500/10 text-cyan-400 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">Autorizada</span>
              </span>
              <span className="text-[11px] text-slate-400">Locação, Vendas e Suporte Especializado</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#visao-geral" className="hover:text-cyan-400 transition-colors">Visão Geral</a>
            <a href="#modalidades" className="hover:text-cyan-400 transition-colors">Venda & Locação</a>
            <a href="#roi" className="hover:text-cyan-400 transition-colors">Calculadora ROI</a>
            <a href="#especificacoes" className="hover:text-cyan-400 transition-colors">Ficha Técnica</a>
            <a href="#assistencia" className="hover:text-cyan-400 transition-colors">Assistência Técnica</a>
            <a href="#videos" className="hover:text-cyan-400 transition-colors">Vídeos</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
          </nav>

          {/* Header Action Button */}
          <div className="flex items-center gap-3">
            <a
              href="#formulario-cotacao"
              className="hidden sm:inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-700 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              Solicitar Catálogo
            </a>

            <button
              onClick={() => handleWhatsAppRedirect()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-lg shadow-lg shadow-cyan-900/40 transition-all transform active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Simular Agora</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION - DESTAQUE MÁXIMO DA TENNANT A-260                         */}
      {/* ========================================================================= */}
      <section id="visao-geral" className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
        
        {/* Background Grid Pattern & Glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00838f08_1px,transparent_1px),linear-gradient(to_bottom,#00838f08_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 bg-cyan-950/80 border border-cyan-500/40 px-3.5 py-1.5 rounded-full text-cyan-300 text-xs font-semibold tracking-wide shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                LAVADORA DE PISO INDUSTRIAL DE OPERAÇÃO A PÉ
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Lavadora de Piso <br />
                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200 bg-clip-text text-transparent">
                  Tennant A-260
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                A solução compacta definitiva para limpeza pesada com operação simples de <strong className="text-white">1 toque</strong>. 
                Limpe até <strong className="text-cyan-400">2.000 m²/hora</strong>, reduza custos de mão de obra e eleve o padrão de higiene do seu negócio em Curitiba e Região.
              </p>

              {/* Key Technical Highlights Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                  <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge className="w-4 h-4" /> Produtividade
                  </div>
                  <div className="text-white text-lg font-extrabold mt-0.5">2.000 m²/h</div>
                  <div className="text-slate-400 text-[11px]">Rendimento Teórico</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                  <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Droplet className="w-4 h-4" /> Tanque
                  </div>
                  <div className="text-white text-lg font-extrabold mt-0.5">40L / 45L</div>
                  <div className="text-slate-400 text-[11px]">Solução / Recuperação</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl col-span-2 sm:col-span-1">
                  <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" /> Ultra Silenciosa
                  </div>
                  <div className="text-white text-lg font-extrabold mt-0.5">69 dBA</div>
                  <div className="text-slate-400 text-[11px]">Limpeza Diurna</div>
                </div>
              </div>

              {/* Pricing Anchor Card */}
              <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-2 border-cyan-500/40 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">Planos Flexíveis de Locação</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-slate-400 text-xs font-medium">A partir de</span>
                    <span className="text-3xl font-extrabold text-white font-mono">R$ 3.890</span>
                    <span className="text-slate-400 text-xs">/mês</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400 inline" /> Manutenção preventiva, corretiva e peças 100% inclusas
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleWhatsAppRedirect("Olá! Gostaria de simular a locação da Tennant A-260 a partir de R$ 3.890/mês.")}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Simular Proposta
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Entrega Técnica no Local</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Treinamento Gratuito</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Máquina Reserva Garantida</span>
              </div>
            </div>

            {/* Right Visual Image Column */}
            <div className="lg:col-span-5 relative">
              
              {/* Product Card Container */}
              <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-b from-slate-800 to-slate-950 shadow-2xl p-2 group">
                
                {/* Hero Machine Image */}
                <div className="relative rounded-2xl overflow-hidden bg-slate-900">
                  <img 
                    src={FOTO_MAQUINA_PRINCIPAL} 
                    alt="Lavadora de Piso Tennant A-260 de Operação a Pé" 
                    className="w-full h-auto object-cover object-center group-hover:scale-105 transition-transform duration-700 max-h-[420px] bg-slate-900"
                  />
                  
                  {/* Overlay Tag */}
                  <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-cyan-400" /> Linha Oficial Tennant
                  </div>

                  <div className="absolute bottom-4 right-4 bg-cyan-950/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold px-3 py-1 rounded-md">
                    Modelo A-260 (Bateria)
                  </div>
                </div>

                {/* Machine Quick Specs Bar */}
                <div className="p-4 grid grid-cols-3 gap-2 text-center">
                  <div className="border-r border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Faixa de Limpeza</span>
                    <p className="text-sm font-bold text-white font-mono">510 mm (20")</p>
                  </div>
                  <div className="border-r border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Largura Rodo</span>
                    <p className="text-sm font-bold text-white font-mono">772 mm</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Rotação Disco</span>
                    <p className="text-sm font-bold text-white font-mono">155 RPM</p>
                  </div>
                </div>
              </div>

              {/* Sub-Card Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-slate-900 border border-teal-500/40 p-4 rounded-2xl shadow-2xl hidden sm:flex items-center gap-3 backdrop-blur-md">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-white text-xs font-bold">Assistência Técnica Pronta</div>
                  <div className="text-slate-400 text-[11px]">Técnicos certificados em Curitiba</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MODALIDADES INTERATIVAS: LOCAÇÃO vs VENDA vs ASSISTÊNCIA               */}
      {/* ========================================================================= */}
      <section id="modalidades" className="py-20 bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Flexibilidade Comercial</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              Escolha a melhor modalidade para sua empresa
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Seja para locação flexível sem descapitalização ou para compra direta com garantia de fábrica, temos a solução ideal.
            </p>

            {/* Tab Selector Buttons */}
            <div className="mt-8 inline-flex p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
              <button
                onClick={() => setActiveTab('locacao')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'locacao'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Locação de Equipamentos
              </button>

              <button
                onClick={() => setActiveTab('venda')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'venda'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Venda & Aquisição
              </button>

              <button
                onClick={() => setActiveTab('assistencia')}
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'assistencia'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-900/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4" />
                Assistência Técnica
              </button>
            </div>
          </div>

          {/* TAB 1: LOCAÇÃO */}
          {activeTab === 'locacao' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Plan Period Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'diario', name: 'Diária', desc: 'Pontual / Pós-obra' },
                  { id: 'semanal', name: 'Semanal (7D)', desc: 'Demandas sazonais' },
                  { id: 'quinzenal', name: 'Quinzenal (15D)', desc: 'Paradas industriais' },
                  { id: 'mensal', name: 'Mensal', desc: 'Contrato contínuo', popular: true },
                  { id: 'longo_prazo', name: '12 a 60 Meses', desc: 'Menor custo mensal' },
                ].map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setActivePlan(plan.id)}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      activePlan === plan.id
                        ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-3 bg-cyan-500 text-slate-950 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full">
                        Mais Escolhido
                      </span>
                    )}
                    <div className="font-bold text-sm text-white">{plan.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{plan.desc}</div>
                  </button>
                ))}
              </div>

              {/* Detailed Plan Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Locação Curto Prazo */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Flexibilidade Máxima</div>
                    <h3 className="text-xl font-bold text-white mt-1">Locação Diária / Semanal</h3>
                    <p className="text-slate-400 text-xs mt-2">
                      Ideal para limpezas pós-obra, eventos, auditorias e paradas programadas de galpões.
                    </p>

                    <div className="my-6 border-t border-b border-slate-800 py-4">
                      <div className="text-2xl font-extrabold text-white font-mono">Consulte Valores</div>
                      <div className="text-xs text-slate-400">Entrega rápida em Curitiba e Região</div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Sem fidelidade de contrato</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Equipamento revisado e testado</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Escovas e rodos inclusos</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleWhatsAppRedirect("Olá! Gostaria de cotação para Locação Curta (Diária/Semanal) da Tennant A-260.")}
                    className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all"
                  >
                    Cotar Diária / Semanal
                  </button>
                </div>

                {/* Locação Mensal (Destaque) */}
                <div className="bg-gradient-to-b from-cyan-950/60 via-slate-950 to-slate-950 border-2 border-cyan-500 rounded-2xl p-6 flex flex-col justify-between relative shadow-2xl">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Melhor Custo-Benefício
                  </div>

                  <div>
                    <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Sem Burocracia</div>
                    <h3 className="text-xl font-bold text-white mt-1">Locação Mensal</h3>
                    <p className="text-slate-300 text-xs mt-2">
                      A escolha favorita de indústrias, condomínios e supermercados que buscam padrão contínuo de limpeza.
                    </p>

                    <div className="my-6 border-t border-b border-cyan-500/20 py-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-slate-400">A partir de</span>
                        <span className="text-3xl font-extrabold text-white font-mono">R$ 3.890</span>
                        <span className="text-xs text-slate-400">/mês</span>
                      </div>
                      <div className="text-xs text-teal-400 font-semibold mt-1">100% dedutível no IR (Lucro Real)</div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-200">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-400" /> Manutenção preventiva mensal inclusa</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-400" /> Troca de peças sem custo adicional</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-400" /> Máquina reserva em caso de pane</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-400" /> Treinamento gratuito de novos funcionários</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleWhatsAppRedirect("Olá! Gostaria de fechar o plano Mensal da Lavadora Tennant A-260.")}
                    className="mt-6 w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Solicitar Proposta Mensal
                  </button>
                </div>

                {/* Contratos Corporativos Longo Prazo */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Contratos de 12 a 60 Meses</div>
                    <h3 className="text-xl font-bold text-white mt-1">Frotas Corporativas</h3>
                    <p className="text-slate-400 text-xs mt-2">
                      Preços super reduzidos conforme tabela do sistema para contratos de 12, 24, 36, 48 e 60 meses.
                    </p>

                    <div className="my-6 border-t border-b border-slate-800 py-4">
                      <div className="text-2xl font-extrabold text-white font-mono">Descontos Progressivos</div>
                      <div className="text-xs text-slate-400">Condições especiais para 2 ou mais máquinas</div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Menor valor de parcela mensal</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Gestão completa de consumíveis (discos/escovas)</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Relatórios periódicos de telemetria/revisão</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleWhatsAppRedirect("Olá! Gostaria de consultar tabela de locação de 12 a 60 meses para a Tennant A-260.")}
                    className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all"
                  >
                    Ver Tabela 12-60 Meses
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: VENDA */}
          {activeTab === 'venda' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fadeIn">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 bg-teal-950 border border-teal-500/30 text-teal-300 text-xs font-bold px-3 py-1 rounded-full">
                  <Award className="w-3.5 h-3.5" /> Equipamento 0km com Garantia de Fábrica
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Aquisição Direta da Tennant A-260 com Entrega Técnica Autorizada
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Adquira a lavadora de piso mais resistente do mercado global com o respaldo da <strong className="text-white">Clean Tech Smart</strong>, sua parceira autorizada Tennant no Paraná.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-cyan-400 mb-2" />
                    <h4 className="text-white font-bold text-sm">Garantia Oficial Tennant</h4>
                    <p className="text-slate-400 text-xs mt-1">Proteção de fábrica com cobertura integral de componentes e mão de obra credenciada.</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-cyan-400 mb-2" />
                    <h4 className="text-white font-bold text-sm">Opções de Financiamento</h4>
                    <p className="text-slate-400 text-xs mt-1">Facilidade de pagamento via BNDES, FINAME, Cartão BNDES e parcelamento direto.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button
                    onClick={() => handleWhatsAppRedirect("Olá! Gostaria de receber uma proposta de VENDA/COMPRA da Lavadora Tennant A-260.")}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Solicitar Cotação de Venda
                  </button>

                  <a
                    href="#formulario-cotacao"
                    className="border border-slate-700 hover:border-slate-600 text-slate-300 px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Agendar Demonstração no Local
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <h4 className="text-white font-bold text-base mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  O que está incluso na Venda:
                </h4>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                    <span><strong>Entrega Técnica Gratuita:</strong> Desembarque, montagem e teste inicial executado por especialista.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                    <span><strong>Kit de Baterias e Carregador:</strong> Conjunto completo pronto para operação imediata.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                    <span><strong>Capacitação Operacional:</strong> Treinamento certificado de boas práticas e manutenção diária.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                    <span><strong>Acesso Prioritário a Peças:</strong> Tabela diferenciada para reposição de borrachas de rodo, escovas e químicos.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: ASSISTÊNCIA TÉCNICA */}
          {activeTab === 'assistencia' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fadeIn">
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center gap-2 bg-teal-950 border border-teal-500/30 text-teal-300 text-xs font-bold px-3 py-1 rounded-full">
                  <Wrench className="w-3.5 h-3.5" /> Assistência Técnica Oficial Tennant em Curitiba
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Sua máquina sempre operando com máxima eficiência
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Não arrisque a vida útil do seu equipamento com peças paralelas ou técnicos não certificados. Oferecemos suporte completo com técnicos treinados na fábrica da Tennant.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-xs font-bold">Oficina Volante (Atendimento In-Company)</h4>
                      <p className="text-slate-400 text-xs">Vans equipadas com ferramental de diagnóstico e peças para reparos no próprio galpão do cliente.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-xs font-bold">Estoque Local de Peças 100% Originais</h4>
                      <p className="text-slate-400 text-xs">Motores de vácuo, rodos Linatex, mangueiras, escovas e placas eletrônicas a pronta entrega.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white text-xs font-bold">Planos de Manutenção Preventiva PM</h4>
                      <p className="text-slate-400 text-xs">Evite paradas inesperadas com revisões periódicas programadas e relatórios de conformidade.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleWhatsAppRedirect("Olá! Preciso de ASSISTÊNCIA TÉCNICA / PEÇAS para lavadora Tennant.")}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2"
                  >
                    <Wrench className="w-4 h-4" />
                    Chamar Técnico Autorizado
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl">
                  <img 
                    src={FOTO_ASSISTENCIA_TECNICA} 
                    alt="Assistência Técnica Autorizada Tennant em Curitiba" 
                    className="w-full h-auto object-cover max-h-[400px] bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CALCULADORA DE ROI: QUANTA MÃO DE OBRA A TENNANT A-260 SUBSTITUI?      */}
      {/* ========================================================================= */}
      <section id="roi" className="py-20 bg-slate-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-teal-400 text-xs font-bold uppercase tracking-wider">Estudo de Retorno e Produtividade</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              Simulador de Economia & Mão de Obra
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Descubra quanto tempo e dinheiro sua empresa economiza ao substituir métodos manuais (mops e vassouras) pela tecnologia mecânica Tennant A-260.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-900 border border-cyan-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl">
            
            {/* Interactive Sliders Column */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Slider 1: Área a Limpar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label className="text-slate-300 font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    Área Total de Piso a Limpar:
                  </label>
                  <span className="text-cyan-400 font-mono font-extrabold text-base bg-cyan-950 px-3 py-1 rounded-lg border border-cyan-500/30">
                    {selectedArea.toLocaleString('pt-BR')} m²
                  </span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="10000" 
                  step="250"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>500 m² (Pequeno)</span>
                  <span>5.000 m² (Médio)</span>
                  <span>10.000 m² (Grande Galpão)</span>
                </div>
              </div>

              {/* Slider 2: Quantidade de Faxineiros Atuais */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center text-sm">
                  <label className="text-slate-300 font-semibold flex items-center gap-2">
                    <Factory className="w-4 h-4 text-cyan-400" />
                    Funcionários na Limpeza Manual:
                  </label>
                  <span className="text-teal-400 font-mono font-extrabold text-base bg-teal-950 px-3 py-1 rounded-lg border border-teal-500/30">
                    {selectedCleaners} {selectedCleaners === 1 ? 'operador' : 'operadores'}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="8" 
                  step="1"
                  value={selectedCleaners}
                  onChange={(e) => setSelectedCleaners(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1 operador</span>
                  <span>4 operadores</span>
                  <span>8 operadores</span>
                </div>
              </div>

              {/* Subtitution Comparison Box */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xl shrink-0">
                  1:3
                </div>
                <div className="text-xs">
                  <div className="text-white font-bold">Poder de Substituição Direta</div>
                  <div className="text-slate-400">
                    Uma única <strong className="text-cyan-300">Tennant A-260</strong> com 1 operador faz o trabalho equivalente a <strong className="text-white">3 a 4 pessoas</strong> com balde e mop, liberando sua equipe para outras atividades produtivas.
                  </div>
                </div>
              </div>

            </div>

            {/* Results & ROI Card Column */}
            <div className="lg:col-span-6 bg-gradient-to-br from-slate-950 via-cyan-950/30 to-slate-950 border-2 border-cyan-500/40 p-6 sm:p-8 rounded-2xl shadow-2xl flex flex-col justify-between space-y-6">
              
              <div>
                <span className="text-xs uppercase font-extrabold text-cyan-400 tracking-wider">Resultado da Estimativa</span>
                <h3 className="text-2xl font-extrabold text-white mt-1">Impacto Financeiro e Operacional</h3>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400">Economia Mensal Estimada</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 font-mono mt-1">
                    R$ {roiData.economiaMensal.toLocaleString('pt-BR')}
                  </div>
                  <span className="text-[10px] text-slate-500">por mês em custos operacionais</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400">Economia em 12 Meses</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono mt-1">
                    R$ {roiData.economiaAnual.toLocaleString('pt-BR')}
                  </div>
                  <span className="text-[10px] text-slate-500">no contrato anual</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400">Tempo com Limpeza Manual</span>
                  <div className="text-xl font-bold text-slate-300 font-mono mt-1">
                    ~{roiData.horasManual} horas
                  </div>
                  <span className="text-[10px] text-red-400">Demorado e cansativo</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400">Tempo com Tennant A-260</span>
                  <div className="text-xl font-bold text-teal-300 font-mono mt-1">
                    ~{roiData.horasComA260} horas
                  </div>
                  <span className="text-[10px] text-teal-400">Até {roiData.tempoEconomizadoPercent}% mais rápido</span>
                </div>

              </div>

              {/* Call to action inside ROI */}
              <button
                onClick={() => handleWhatsAppRedirect(`Olá! Simulei na calculadora uma área de ${selectedArea}m² com ${selectedCleaners} operadores e gostaria de uma proposta formal da Tennant A-260.`)}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                Receber Estudo de Viabilidade no WhatsApp
              </button>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FICHA TÉCNICA DETALHADA: ESPECIFICAÇÕES TENNANT A-260                  */}
      {/* ========================================================================= */}
      <section id="especificacoes" className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Engenharia de Precisão</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                Especificações Técnicas Completas
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Dados oficiais do fabricante Tennant Company para o modelo A-260 (Walk-Behind Scrubber).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="#formulario-cotacao"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                Baixar Datasheet PDF
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Especificação 1 */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold">
                <Gauge className="w-5 h-5" />
              </div>
              <h3 className="text-white font-bold text-base">Produtividade & Rendimento</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Produtividade Máxima Teórica:</span>
                  <span className="font-bold text-white font-mono">2.000 m²/h</span>
                </li>
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Produtividade Prática Estimada:</span>
                  <span className="font-bold text-white font-mono">640 - 1.200 m²/h</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Velocidade de Trabalho:</span>
                  <span className="font-bold text-white font-mono">Até 4,0 km/h</span>
                </li>
              </ul>
            </div>

            {/* Especificação 2 */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-white font-bold text-base">Cabeçote de Lavagem & Rodo</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Faixa de Limpeza:</span>
                  <span className="font-bold text-white font-mono">510 mm (20 polegadas)</span>
                </li>
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Largura do Rodo Traseiro:</span>
                  <span className="font-bold text-white font-mono">772 mm (Parabólico)</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Velocidade da Escova/Disco:</span>
                  <span className="font-bold text-white font-mono">155 RPM</span>
                </li>
              </ul>
            </div>

            {/* Especificação 3 */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold">
                <Droplet className="w-5 h-5" />
              </div>
              <h3 className="text-white font-bold text-base">Tanques de Água & Sucção</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Tanque de Solução (Limpa):</span>
                  <span className="font-bold text-white font-mono">40 Litros</span>
                </li>
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Tanque de Recuperação (Suja):</span>
                  <span className="font-bold text-white font-mono">45 Litros</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Abertura de Drenagem:</span>
                  <span className="font-bold text-white font-mono">Mangueira Frontal Rápida</span>
                </li>
              </ul>
            </div>

            {/* Especificação 4 */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-white font-bold text-base">Alimentação & Baterias</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Sistema Elétrico:</span>
                  <span className="font-bold text-white font-mono">24V (Baterias Tracionárias)</span>
                </li>
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Autonomia de Operação:</span>
                  <span className="font-bold text-white font-mono">Até 3.0 horas contínuas</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Carregador:</span>
                  <span className="font-bold text-white font-mono">Integrado Bivolt</span>
                </li>
              </ul>
            </div>

            {/* Especificação 5 */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold">
                <Volume2 className="w-5 h-5" />
              </div>
              <h3 className="text-white font-bold text-base">Dimensões, Peso & Ruído</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Dimensões (C x L x A):</span>
                  <span className="font-bold text-white font-mono">1.300 x 545 x 1.100 mm</span>
                </li>
                <li className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Peso com Baterias:</span>
                  <span className="font-bold text-white font-mono">141,5 kg</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Nível de Ruído no Operador:</span>
                  <span className="font-bold text-white font-mono">69 dBA</span>
                </li>
              </ul>
            </div>

            {/* Especificação 6 */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-950 text-teal-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-white font-bold text-base">Aplicações Recomendadas</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400" /> Galpões Industriais & Logísticos</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400" /> Supermercados & Atacarejos</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400" /> Condomínios & Estacionamentos</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-teal-400" /> Hospitais, Clínicas e Hotéis</li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SEÇÃO DE VÍDEOS & DEMONSTRAÇÃO VISUAL                                  */}
      {/* ========================================================================= */}
      <section id="videos" className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Veja na Prática</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              Vídeos Demonstrativos e Recursos
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Confira a simplicidade de operação de um botão e a qualidade de sucção e lavagem em pisos industriais.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Main Video Player Showcase */}
            <div className="lg:col-span-8 bg-slate-900 border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl p-2">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center group">
                
                <img 
                  src={videos[activeVideo].thumbnail} 
                  alt={videos[activeVideo].title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
                />

                {/* Video Overlay Glow */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                {/* Big Play Button */}
                <button 
                  onClick={() => handleWhatsAppRedirect(`Olá! Gostaria de agendar uma demonstração em vídeo ou presencial da Tennant A-260.`)}
                  className="absolute w-20 h-20 rounded-full bg-cyan-500/90 text-slate-950 flex items-center justify-center shadow-2xl shadow-cyan-500/50 hover:scale-110 transition-transform group-hover:bg-cyan-400"
                >
                  <Play className="w-8 h-8 fill-current ml-1" />
                </button>

                {/* Video Info Pill */}
                <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold text-cyan-300">
                  {videos[activeVideo].tag} • {videos[activeVideo].duracao}
                </div>

                {/* Bottom Video Title */}
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-white">{videos[activeVideo].title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-1">{videos[activeVideo].description}</p>
                </div>
              </div>
            </div>

            {/* Video Playlist Selector */}
            <div className="lg:col-span-4 space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selecione o Vídeo:</div>

              {videos.map((vid, idx) => (
                <button
                  key={vid.id}
                  onClick={() => setActiveVideo(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex gap-3 items-center ${
                    activeVideo === idx
                      ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="w-16 h-12 rounded-lg bg-slate-950 overflow-hidden shrink-0 relative border border-slate-800">
                    <img src={vid.thumbnail} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{vid.title}</div>
                    <div className="text-[11px] text-cyan-400 mt-0.5">{vid.duracao} • {vid.tag}</div>
                  </div>
                </button>
              ))}

              <div className="pt-2">
                <button
                  onClick={() => handleWhatsAppRedirect("Olá! Gostaria de agendar uma DEMONSTRAÇÃO PRÁTICA da Tennant A-260 na minha empresa.")}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Agendar Demonstração Gratuita no Local
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FORMULÁRIO DE CAPTURA & COTAÇÃO DIRETA (INTEGRADO AO CRM)              */}
      {/* ========================================================================= */}
      <section id="formulario-cotacao" className="py-20 bg-gradient-to-b from-slate-900 to-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Form Info Side */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full">
                <Send className="w-3.5 h-3.5" /> Atendimento Técnico Ágil
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Solicite uma Proposta Técnica & Comercial em até <span className="text-cyan-400">15 Minutos</span>
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                Preencha o formulário para receber a tabela oficial de locação, valores de aquisição ou agendar uma visita técnica no seu estabelecimento em Curitiba e Região Metropolitana.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Central WhatsApp & Atendimento</div>
                    <div className="text-sm font-bold text-white">(41) 98508-3658</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">E-mail Comercial & Cotações</div>
                    <a href={`mailto:${EMAIL_CONTATO}`} className="text-sm font-bold text-white hover:text-cyan-400 transition-colors">
                      {EMAIL_CONTATO}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Base Operacional e Showroom</div>
                    <div className="text-sm font-bold text-white">Curitiba & Região Metropolitana - PR</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Box */}
            <div className="lg:col-span-6">
              <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
                
                {submittedSuccess ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Solicitação Enviada com Sucesso!</h3>
                    <p className="text-slate-300 text-sm max-w-md mx-auto">
                      Nossos especialistas já receberam seus dados e estão gerando a proposta da Tennant A-260. Redirecionando para o WhatsApp...
                    </p>
                    <button
                      onClick={() => handleWhatsAppRedirect()}
                      className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-3 rounded-xl"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Falar com Consultor Agora
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Simule sem compromisso</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Seu Nome *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Carlos Silva"
                          value={formState.nome}
                          onChange={(e) => setFormState({ ...formState, nome: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Empresa / Condomínio</label>
                        <input
                          type="text"
                          placeholder="Ex: Indústria ABC Ltda"
                          value={formState.empresa}
                          onChange={(e) => setFormState({ ...formState, empresa: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Telefone *</label>
                        <input
                          type="tel"
                          required
                          placeholder="(41) 98508-3658"
                          value={formState.telefone}
                          onChange={(e) => setFormState({ ...formState, telefone: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Cidade / Região</label>
                        <input
                          type="text"
                          placeholder="Curitiba, S. José dos Pinhais..."
                          value={formState.cidade}
                          onChange={(e) => setFormState({ ...formState, cidade: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Interesse Principal</label>
                        <select
                          value={formState.interesse}
                          onChange={(e) => setFormState({ ...formState, interesse: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                        >
                          <option value="Locação">Locação de Equipamento</option>
                          <option value="Compra/Venda">Compra / Aquisição 0km</option>
                          <option value="Assistência Técnica">Assistência Técnica / Peças</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Período Desejado</label>
                        <select
                          value={formState.periodo}
                          onChange={(e) => setFormState({ ...formState, periodo: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                        >
                          <option value="Mensal">Mensal (Contínuo)</option>
                          <option value="Diária / Semanal">Diária / Semanal (Curto)</option>
                          <option value="12 a 36 Meses">12 a 36 Meses (Corporativo)</option>
                          <option value="48 a 60 Meses">48 a 60 Meses (Longo Prazo)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Observações ou Metragem do Piso</label>
                      <textarea
                        rows={2}
                        placeholder="Ex: Piso de epóxi em galpão de 3.000m², precisamos de entrega rápida..."
                        value={formState.mensagem}
                        onChange={(e) => setFormState({ ...formState, mensagem: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm font-sans"
                    >
                      {isSubmitting ? 'Gerando Proposta...' : 'Receber Proposta Completa no WhatsApp'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    <p className="text-center text-[11px] text-slate-500">
                      🔒 Seus dados estão 100% seguros. Não enviamos spam.
                    </p>
                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FAQ - PERGUNTAS FREQUENTES                                             */}
      {/* ========================================================================= */}
      <section id="faq" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Tire suas Dúvidas</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4"
                >
                  <span className="text-sm sm:text-base font-bold text-white">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-cyan-400 shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FOOTER COM CREDENCIAIS OFICIAIS                                       */}
      {/* ========================================================================= */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-white font-mono font-bold tracking-wider text-base bg-slate-900 px-3 py-1 rounded border border-slate-700">TENNANT</span>
            <div>
              <div className="text-white font-bold">Clean Tech Smart Equipamentos</div>
              <div className="text-slate-500">Representante e Assistência Técnica Autorizada Tennant - Curitiba/PR</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#visao-geral" className="hover:text-cyan-400">Início</a>
            <a href="#modalidades" className="hover:text-cyan-400">Locação & Venda</a>
            <a href="#roi" className="hover:text-cyan-400">Calculadora ROI</a>
            <a href="#assistencia" className="hover:text-cyan-400">Assistência</a>
            <a href="#formulario-cotacao" className="hover:text-cyan-400">Contato</a>
          </div>

          <div className="text-slate-500 text-[11px] text-center md:text-right">
            © {new Date().getFullYear()} Clean Tech Smart. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Floating Sticky Mobile WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        <button
          onClick={() => handleWhatsAppRedirect()}
          className="w-14 h-14 rounded-full bg-teal-500 text-slate-950 shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <MessageSquare className="w-7 h-7" />
        </button>
      </div>

    </div>
  );
}
