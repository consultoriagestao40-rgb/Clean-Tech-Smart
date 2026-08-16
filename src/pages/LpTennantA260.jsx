import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Wrench, 
  Zap, 
  TrendingUp, 
  Phone, 
  MessageSquare, 
  FileText, 
  Download, 
  Play, 
  ArrowRight, 
  Award, 
  BarChart3, 
  Gauge, 
  Droplet, 
  Volume2, 
  Layers, 
  Check, 
  ChevronDown, 
  Building2, 
  Factory,
  RefreshCw,
  Send,
  Calendar,
  DollarSign,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Edit,
  ExternalLink
} from 'lucide-react';

export default function LpTennantA260() {
  // =========================================================================
  // 📞 DADOS DE CONTATO & EMPRESA
  // =========================================================================
  const WHATSAPP_NUMBER = "5541985083658";
  const WHATSAPP_DISPLAY = "(41) 98508-3658";
  const EMAIL_CONTATO = "vendas@cleantechpro.com.br";

  // Logos Oficiais
  const LOGO_ALFA_TENNANT = "https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png";
  const [companyLogo, setCompanyLogo] = useState(localStorage.getItem('app_company_logo') || '');

  // =========================================================================
  // 📷 FOTOS OFICIAIS DO CATÁLOGO DE MÁQUINAS DO SISTEMA
  // =========================================================================
  const DEFAULT_PHOTOS = [
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-main.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-solution-tank.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-handle.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-in-use.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg"
  ];

  const [photoUrlsText, setPhotoUrlsText] = useState(() => {
    return localStorage.getItem('lp_a260_photo_urls') || DEFAULT_PHOTOS.join('\n');
  });
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isEditingPhotos, setIsEditingPhotos] = useState(false);
  const [catalogModel, setCatalogModel] = useState(null);

  // Lista de URLs de fotos
  const photoList = useMemo(() => {
    const list = photoUrlsText.split('\n').map(u => u.trim()).filter(Boolean);
    return list.length > 0 ? list : DEFAULT_PHOTOS;
  }, [photoUrlsText]);

  // Busca fotos e dados atualizados do Catálogo de Modelos do sistema
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/get-machine-models');
        if (res.ok) {
          const data = await res.json();
          if (data.machineModels && data.machineModels.length > 0) {
            const foundA260 = data.machineModels.find(m => 
              m.name.toLowerCase().includes('a260') || 
              m.name.toLowerCase().includes('a-260')
            );
            if (foundA260) {
              setCatalogModel(foundA260);
              if (foundA260.photo_urls && !localStorage.getItem('lp_a260_photo_urls')) {
                setPhotoUrlsText(foundA260.photo_urls);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar modelo do catálogo:', err);
      }
    }
    loadCatalog();
  }, []);

  const handleSavePhotoUrls = (e) => {
    e.preventDefault();
    localStorage.setItem('lp_a260_photo_urls', photoUrlsText);
    setIsEditingPhotos(false);
    setActivePhotoIndex(0);
  };

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % photoList.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + photoList.length) % photoList.length);
  };

  // ROI Calculator States
  const [selectedArea, setSelectedArea] = useState(2500); // m²
  const [selectedCleaners, setSelectedCleaners] = useState(3); // faxineiros manuais
  const [openFaq, setOpenFaq] = useState(null);

  // Form State
  const [formState, setFormState] = useState({
    nome: '',
    empresa: '',
    telefone: '',
    cidade: 'Curitiba e Região Metropolitana',
    interesse: 'Locação',
    periodo: 'Mensal',
    mensagem: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // ROI Math
  const roiData = useMemo(() => {
    const horasComA260 = (selectedArea / 1200).toFixed(1);
    const horasManual = (selectedArea / (selectedCleaners * 180)).toFixed(1);
    const custoManualMensal = selectedCleaners * 3200; // Custo com encargos por operador
    const custoLocacaoMensal = 3890; // Preço âncora mensal
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

  // FAQ Data
  const faqs = [
    {
      q: "Qual a diferença entre a locação e a compra da Tennant A260?",
      a: "Na locação você não mobiliza capital, deduz as parcelas no IR (Lucro Real) e a Clean Tech Smart assume 100% da manutenção preventiva, corretiva e peças de reposição com máquina reserva garantida. Na compra direta, você adquire um ativo de altíssima durabilidade com garantia oficial e suporte de fábrica."
    },
    {
      q: "Como funciona a assistência técnica autorizada em Curitiba e Região?",
      a: "Somos representantes e assistência técnica autorizada Tennant. Dispomos de técnicos certificados, oficina móvel (atendimento no seu galpão/empresa) e peças 100% originais em estoque local a pronta entrega."
    },
    {
      q: "Quais os planos de locação disponíveis no sistema?",
      a: "Disponibilizamos planos: Diário (pós-obra e eventos), Semanal (7 dias), Quinzenal (15 dias), Mensal e contratos corporativos de 12, 24, 36, 48 até 60 meses com descontos progressivos."
    },
    {
      q: "A entrega técnica e o treinamento dos funcionários estão inclusos?",
      a: "Sim! Em qualquer contratação (locação ou venda), realizamos a entrega técnica no seu estabelecimento e treinamos gratuitamente seus operadores para extrair o máximo rendimento do equipamento."
    }
  ];

  const handleWhatsAppRedirect = (customMsg = null) => {
    const text = customMsg || `Olá! Gostaria de receber uma proposta para a Lavadora Tennant A260 em Curitiba e Região.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        name: formState.nome,
        company: formState.empresa,
        phone: formState.telefone,
        contact_name: formState.nome,
        stage: 'inbox',
        value: formState.interesse === 'Locação' ? 3890 : 35000,
        label: `LP Tennant A260 (${formState.interesse})`,
        notes: `Interesse: ${formState.interesse} | Período: ${formState.periodo} | Cidade: ${formState.cidade} | Mensagem: ${formState.mensagem}`
      };

      try {
        await fetch('/api/crm/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn('Registro local de lead:', err);
      }

      setSubmittedSuccess(true);
      
      setTimeout(() => {
        const msg = `Olá! Meu nome é ${formState.nome} da empresa ${formState.empresa || 'N/A'}. Solicitei informações sobre a Lavadora Tennant A260 para ${formState.interesse} (${formState.periodo}) em ${formState.cidade}.`;
        handleWhatsAppRedirect(msg);
      }, 1000);

    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased">
      
      {/* ========================================================================= */}
      {/* 1. TOP UTILITY BAR (Estilo Oficial Tennant)                                */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-cyan-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-semibold text-white">REPRESENTANTE & ASSISTÊNCIA TÉCNICA AUTORIZADA TENNANT</span>
            <span className="hidden md:inline text-slate-400">| Atendimento em Curitiba, Região Metropolitana e Paraná</span>
          </div>

          <div className="flex items-center gap-6 text-slate-300">
            <a 
              href={`mailto:${EMAIL_CONTATO}`} 
              className="hidden sm:flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              {EMAIL_CONTATO}
            </a>

            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 hover:text-cyan-300 font-semibold text-white transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              Entre em contato: {WHATSAPP_DISPLAY}
            </a>

            <span className="text-slate-500 hidden lg:inline">Português - BR</span>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HEADER PRINCIPAL (CLONE IDENTIDADE VISUAL TENNANT / ALFA + CLEAN TECH) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Area */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Logo Alfa Tennant Oficial */}
            <div className="flex items-center">
              <img 
                src={LOGO_ALFA_TENNANT} 
                alt="Alfa by Tennant Company" 
                className="h-9 sm:h-11 object-contain"
              />
            </div>

            <div className="h-8 w-px bg-slate-300 hidden sm:block"></div>

            {/* Clean Tech Smart Logo & Badge */}
            <div className="flex items-center gap-3">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt="Clean Tech Smart" 
                  className="h-8 sm:h-10 object-contain max-w-[140px]" 
                />
              ) : (
                <div className="flex flex-col">
                  <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">Clean Tech Smart</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Equipamentos & Serviços</span>
                </div>
              )}
              
              <span className="hidden md:inline-flex bg-cyan-50 text-cyan-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-cyan-300">
                Autorizada
              </span>
            </div>

          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <a href="#hero-pdp" className="hover:text-[#eb6420] transition-colors">Máquinas</a>
            <a href="#locacao" className="hover:text-[#eb6420] transition-colors">Locação</a>
            <a href="#venda" className="hover:text-[#eb6420] transition-colors">Vendas</a>
            <a href="#assistencia" className="hover:text-[#eb6420] transition-colors">Assistência Técnica</a>
            <a href="#roi" className="hover:text-[#eb6420] transition-colors">Calculadora ROI</a>
            <a href="#especificacoes" className="hover:text-[#eb6420] transition-colors">Especificações</a>
          </nav>

          {/* Search / CTA Button */}
          <div className="flex items-center gap-3">
            <a
              href="#formulario-cotacao"
              className="bg-[#eb6420] hover:bg-[#d45311] text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-5 py-3 rounded shadow-sm transition-all"
            >
              Solicitar Cotação
            </a>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. BREADCRUMB NAVEGAÇÃO (Padrão Tennant)                                    */}
      {/* ========================================================================= */}
      <div className="bg-slate-50 border-b border-slate-200 py-2.5 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <a href="#hero-pdp" className="hover:text-[#eb6420]">Home</a>
          <span>/</span>
          <a href="#hero-pdp" className="hover:text-[#eb6420]">Máquinas</a>
          <span>/</span>
          <a href="#hero-pdp" className="hover:text-[#eb6420]">Lavadoras</a>
          <span>/</span>
          <span className="text-slate-900 font-semibold">A260 Lavadora de piso de operação a pé</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PRODUCT HERO SECTION - CLONE IDÊNTICO AO LINK DA TENNANT A260           */}
      {/* ========================================================================= */}
      <section id="hero-pdp" className="py-10 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* LEFT COLUMN: CARROSSEL DE FOTOS COM THUMBNAILS & GERENCIADOR */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Main Product Image Display com botões < e > */}
              <div className="relative bg-white border border-slate-200 rounded-lg p-6 sm:p-10 flex items-center justify-center min-h-[380px] sm:min-h-[460px] shadow-sm group">
                
                <img 
                  src={photoList[activePhotoIndex] || DEFAULT_PHOTOS[0]} 
                  alt="A260 Lavadora de piso de operação a pé Tennant" 
                  className="max-h-[380px] w-auto object-contain transition-transform duration-300"
                />

                {/* Seta Esquerda */}
                {photoList.length > 1 && (
                  <button
                    onClick={prevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-slate-300 text-slate-700 hover:text-black hover:bg-white flex items-center justify-center shadow-md opacity-80 hover:opacity-100 transition-opacity"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Seta Direita */}
                {photoList.length > 1 && (
                  <button
                    onClick={nextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-slate-300 text-slate-700 hover:text-black hover:bg-white flex items-center justify-center shadow-md opacity-80 hover:opacity-100 transition-opacity"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Badge Autorizada */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded shadow-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  Garantia & Assistência Autorizada Tennant
                </div>

                {/* Contador de Fotos */}
                {photoList.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white text-xs font-mono px-2.5 py-1 rounded">
                    {activePhotoIndex + 1} / {photoList.length}
                  </div>
                )}
              </div>

              {/* Thumbnails Gallery Strip (Exatamente como na foto enviada) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {photoList.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`w-16 h-16 rounded border-2 p-1 bg-white transition-all flex items-center justify-center shrink-0 ${
                        activePhotoIndex === idx 
                          ? 'border-[#00838f] shadow-sm ring-2 ring-cyan-100' 
                          : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="" className="max-h-full max-w-full object-contain" />
                    </button>
                  ))}
                </div>

                {/* Botão de Edição Rápida de Fotos */}
                <button
                  onClick={() => setIsEditingPhotos(!isEditingPhotos)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#eb6420] bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded transition-colors"
                  title="Gerenciar links de imagens desta máquina"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Gerenciar Fotos ({photoList.length})</span>
                </button>

              </div>

              {/* Box de Edição de Links (Um link por linha como no Catálogo) */}
              {isEditingPhotos && (
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 space-y-3 mt-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-cyan-600" />
                      Links das Fotos (Um link por linha)
                    </span>
                    <button 
                      onClick={() => setIsEditingPhotos(false)}
                      className="text-xs text-slate-400 hover:text-slate-700"
                    >
                      Fechar
                    </button>
                  </div>
                  
                  <p className="text-xs text-slate-600">
                    Cole as URLs diretas das imagens abaixo, <strong>uma por linha</strong>. O carrossel atualizará instantaneamente.
                  </p>

                  <textarea
                    rows={5}
                    value={photoUrlsText}
                    onChange={(e) => setPhotoUrlsText(e.target.value)}
                    placeholder="https://.../a260-main.jpg&#10;https://.../a260-tank.jpg&#10;https://.../a260-handle.jpg"
                    className="w-full bg-white border border-slate-300 rounded p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#eb6420]"
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrlsText(DEFAULT_PHOTOS.join('\n'));
                        localStorage.removeItem('lp_a260_photo_urls');
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5"
                    >
                      Restaurar Padrão Oficial
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePhotoUrls}
                      className="bg-[#eb6420] hover:bg-[#d45311] text-white text-xs font-bold px-4 py-1.5 rounded transition-colors"
                    >
                      Salvar Fotos
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: DETALHES TÉCNICOS & CTA OFICIAL (IDÊNTICO AO LINK TENNANT) */}
            <div className="lg:col-span-6 space-y-6">
              
              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans">
                  A260
                </h1>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-700 mt-1">
                  Lavadora de piso de operação a pé
                </h2>
              </div>

              {/* Descrição Oficial */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                A lavadora de pisos A260 à bateria foi desenvolvida para ambientes que requerem excelente resultado de limpeza com agilidade e facilidade de operação. Com nível de ruído de <strong className="text-slate-900">69 dBA</strong>, é ideal para hospitais, lojas de varejo, shoppings, indústrias e qualquer outro ambiente pequeno e médio com fluxo de pessoas.
              </p>

              {/* Especificações de Destaque da Tennant */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">FAIXA DE LIMPEZA</span>
                  <span className="text-sm font-semibold text-slate-700">510 MM</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">CAPACIDADE DO TANQUE DE SOLUÇÃO</span>
                  <span className="text-sm font-semibold text-slate-700">45 L</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">PRODUTIVIDADE TEÓRICA</span>
                  <span className="text-sm font-semibold text-slate-700">ATÉ 2.000 M²/H</span>
                </div>
              </div>

              {/* Destaques Técnicos do Catálogo */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs text-slate-700">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 text-cyan-700" />
                  Diferenciais do Modelo A260:
                </div>
                <p>• <strong>Poder de sucção:</strong> Rodo parabólico com lâminas Linatex® de 4 lados para secagem imediata.</p>
                <p>• <strong>Fácil operação:</strong> Painel com botão único start-stop e indicador de bateria.</p>
                <p>• <strong>Protetor anti-respingo:</strong> Mantém a água na área de sucção evitando poças.</p>
                <p>• <strong>Manutenção simplificada:</strong> Pontos amarelos Yellow-Touch sem ferramentas.</p>
              </div>

              {/* Card de Preço Âncora & Locação */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase text-slate-500">Planos de Locação Mensal</div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs text-slate-500">A partir de</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">R$ 3.890,00</span>
                    <span className="text-xs text-slate-500">/mês</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Manutenção preventiva, corretiva e peças inclusas
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <button
                    onClick={() => handleWhatsAppRedirect("Olá! Gostaria de uma proposta de locação da Tennant A260 a partir de R$ 3.890/mês.")}
                    className="w-full bg-[#eb6420] hover:bg-[#d45311] text-white font-bold text-xs uppercase px-5 py-3 rounded shadow transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Simular no WhatsApp
                  </button>
                </div>
              </div>

              {/* Botão de Ação Primário Tennant Oficial (Laranja #eb6420) */}
              <div className="pt-2">
                <a
                  href="#formulario-cotacao"
                  className="inline-block w-full sm:w-auto text-center bg-[#eb6420] hover:bg-[#d45311] text-white font-bold text-sm uppercase tracking-wider px-8 py-3.5 rounded shadow-md transition-all"
                >
                  SOLICITAR INFORMAÇÕES
                </a>
              </div>

              {/* Quick Links Oficiais Tennant */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-4 text-xs font-semibold text-cyan-800 border-t border-slate-200">
                <a href="#locacao" className="hover:underline flex items-center gap-1">
                  Explore as opções de locação <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a href="#venda" className="hover:underline flex items-center gap-1">
                  Venda & Financiamento <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a href="#assistencia" className="hover:underline flex items-center gap-1">
                  Plano de serviços & Assistência <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TABS DE NAVEGAÇÃO DE CONTEÚDO                                           */}
      {/* ========================================================================= */}
      <div className="bg-slate-100 border-y border-slate-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto py-3 text-xs sm:text-sm font-bold text-slate-600 no-scrollbar">
            {[
              { id: 'locacao', label: 'Planos de Locação' },
              { id: 'venda', label: 'Venda 0km' },
              { id: 'assistencia', label: 'Assistência Técnica' },
              { id: 'roi', label: 'Calculadora de ROI' },
              { id: 'especificacoes', label: 'Ficha Técnica' },
              { id: 'faq', label: 'Dúvidas' }
            ].map(tab => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className="whitespace-nowrap px-3 py-1.5 rounded hover:text-[#eb6420] hover:bg-white transition-all"
              >
                {tab.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. SEÇÃO: PLANOS DE LOCAÇÃO                                               */}
      {/* ========================================================================= */}
      <section id="locacao" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[#eb6420] text-xs font-bold uppercase tracking-wider">Locação Sem Burocracia</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Planos de Locação da Tennant A260
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Opções flexíveis da nossa tabela: Diária, Semanal, Quinzenal, Mensal e contratos corporativos de 12 a 60 meses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Curto Prazo */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500">Curto Prazo</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Diária / Semanal / Quinzenal</h3>
                <p className="text-xs text-slate-600 mt-2">
                  Perfeito para limpezas pós-obra, paradas industriais, auditorias e eventos.
                </p>

                <div className="my-5 py-3 border-y border-slate-200">
                  <div className="text-xl font-bold text-slate-900 font-mono">Consulte Valores</div>
                  <div className="text-[11px] text-slate-500">Entrega rápida em Curitiba e Região Metropolitana</div>
                </div>

                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Sem fidelidade contratual</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Escovas e rodos inclusos</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Suporte técnico imediato</li>
                </ul>
              </div>

              <button
                onClick={() => handleWhatsAppRedirect("Olá! Gostaria de cotar LOCAÇÃO CURTO PRAZO (Diária/Semanal) da Tennant A260.")}
                className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded transition-colors"
              >
                Cotar Curto Prazo
              </button>
            </div>

            {/* Mensal - Destaque */}
            <div className="bg-white border-2 border-[#eb6420] rounded-lg p-6 flex flex-col justify-between shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#eb6420] text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded shadow">
                Mais Escolhido
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-[#eb6420]">Contrato Contínuo</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Locação Mensal</h3>
                <p className="text-xs text-slate-600 mt-2">
                  A solução favorita de indústrias, condomínios, supermercados e shoppings de Curitiba.
                </p>

                <div className="my-5 py-3 border-y border-orange-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-500">A partir de</span>
                    <span className="text-3xl font-black text-slate-900 font-mono">R$ 3.890</span>
                    <span className="text-xs text-slate-500">/mês</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">100% dedutível no IR (Lucro Real)</div>
                </div>

                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Manutenção preventiva mensal inclusa</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Peças e consumíveis inclusos</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Máquina reserva garantida em caso de pane</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Treinamento gratuito da equipe</li>
                </ul>
              </div>

              <button
                onClick={() => handleWhatsAppRedirect("Olá! Gostaria de fechar o plano de LOCAÇÃO MENSAL da Tennant A260.")}
                className="mt-6 w-full py-3 bg-[#eb6420] hover:bg-[#d45311] text-white font-bold text-xs uppercase rounded shadow transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Contratar Locação Mensal
              </button>
            </div>

            {/* Longo Prazo 12 a 60 Meses */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500">Frotas Corporativas</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Contratos de 12 a 60 Meses</h3>
                <p className="text-xs text-slate-600 mt-2">
                  Condições especiais com a menor parcela mensal da nossa tabela para frotas de máquinas.
                </p>

                <div className="my-5 py-3 border-y border-slate-200">
                  <div className="text-xl font-bold text-slate-900 font-mono">Descontos Progressivos</div>
                  <div className="text-[11px] text-slate-500">12, 24, 36, 48 e 60 meses</div>
                </div>

                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Menor custo unitário por metro quadrado</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Gestão integrada de manutenção preventiva</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Renovação programada de frota</li>
                </ul>
              </div>

              <button
                onClick={() => handleWhatsAppRedirect("Olá! Gostaria de consultar tabela de 12 a 60 meses para a Tennant A260.")}
                className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded transition-colors"
              >
                Tabela 12 a 60 Meses
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SEÇÃO: VENDA & AQUISIÇÃO 0KM                                           */}
      {/* ========================================================================= */}
      <section id="venda" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <span className="text-[#eb6420] text-xs font-bold uppercase tracking-wider">Aquisição Direta</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Compre a Tennant A260 com Entrega Técnica e Garantia Oficial
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Adquira a lavadora de pisos mais confiável do mundo com a segurança de comprar através do <strong className="text-slate-900">Representante Autorizado Clean Tech Smart</strong> no Paraná.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                  <ShieldCheck className="w-6 h-6 text-[#eb6420] mb-2" />
                  <h3 className="font-bold text-slate-900 text-sm">Garantia Oficial de Fábrica</h3>
                  <p className="text-xs text-slate-500 mt-1">Cobertura total contra defeitos de fabricação e peças originais.</p>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                  <DollarSign className="w-6 h-6 text-emerald-600 mb-2" />
                  <h3 className="font-bold text-slate-900 text-sm">Financiamento Facilitado</h3>
                  <p className="text-xs text-slate-500 mt-1">Opções via BNDES, FINAME, Cartão BNDES e parcelamento direto.</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleWhatsAppRedirect("Olá! Gostaria de receber uma cotação de VENDA/COMPRA da Tennant A260 0km.")}
                  className="bg-[#eb6420] hover:bg-[#d45311] text-white font-bold text-xs uppercase px-6 py-3 rounded shadow transition-all"
                >
                  Solicitar Cotação de Venda
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase text-[#eb6420]">
                O que você recebe na Compra:
              </h3>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Entrega Técnica no Local:</strong> Desembarque, montagem e teste prático em sua empresa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Conjunto de Baterias & Carregador Bivolt:</strong> Sistema completo pronto para operar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Treinamento Certificado:</strong> Capacitação prática de boas práticas para sua equipe.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Desconto Vitalício em Peças:</strong> Tabela especial para escovas, borrachas de rodo e químicos.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SEÇÃO: ASSISTÊNCIA TÉCNICA AUTORIZADA TENNANT EM CURITIBA              */}
      {/* ========================================================================= */}
      <section id="assistencia" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <span className="text-[#eb6420] text-xs font-bold uppercase tracking-wider">Suporte Técnico Especializado</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Assistência Técnica Autorizada Tennant em Curitiba & Região
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Manutenção preventiva e corretiva com técnicos credenciados pela fábrica e peças 100% originais para garantir que sua operação nunca pare.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 p-3 rounded">
                  <Wrench className="w-5 h-5 text-[#eb6420] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-slate-900 text-xs font-bold">Oficina Volante (Atendimento In-Company)</h3>
                    <p className="text-slate-500 text-xs">Vans equipadas para manutenção rápida direto no galpão do cliente.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 p-3 rounded">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-slate-900 text-xs font-bold">Peças 100% Originais em Estoque Local</h3>
                    <p className="text-slate-500 text-xs">Motores de sucção, borrachas Linatex, discos, escovas e placas a pronta entrega.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 p-3 rounded">
                  <Clock className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-slate-900 text-xs font-bold">Planos de Manutenção Preventiva PM</h3>
                    <p className="text-slate-500 text-xs">Revisões periódicas programadas com emissão de laudo técnico de conformidade.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleWhatsAppRedirect("Olá! Preciso de ASSISTÊNCIA TÉCNICA / PEÇAS para lavadora Tennant em Curitiba.")}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase px-6 py-3 rounded shadow transition-all flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  Chamar Técnico Autorizado
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-100 border border-slate-200 rounded-lg p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm uppercase">
                Central de Peças e Atendimento Rápido:
              </h3>
              <p className="text-xs text-slate-600">
                Atendemos chamados de manutenção para toda a linha Tennant / Alfa em Curitiba, São José dos Pinhais, Araucária, Pinhais, Colombo, Campo Largo, Ponta Grossa e litoral.
              </p>

              <div className="bg-white p-4 rounded border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Telefone / WhatsApp:</span>
                  <span className="font-bold text-slate-900">{WHATSAPP_DISPLAY}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">E-mail:</span>
                  <span className="font-bold text-slate-900">{EMAIL_CONTATO}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SLA de Atendimento:</span>
                  <span className="font-bold text-emerald-700">Prioritário em até 24h</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. CALCULADORA DE ROI (MÃO DE OBRA SUBSTITUÍDA & ECONOMIA)                 */}
      {/* ========================================================================= */}
      <section id="roi" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[#eb6420] text-xs font-bold uppercase tracking-wider">Estudo de Produtividade & Economia</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Quanta mão de obra a Tennant A260 substitui?
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Simule a economia real de trocar a limpeza manual de balde e vassoura pelo rendimento mecânico da A260.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm">
            
            {/* Sliders */}
            <div className="lg:col-span-6 space-y-6">
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                  <label className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#eb6420]" />
                    Área Total a Limpar:
                  </label>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">
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
                  className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-[#eb6420]"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-800">
                  <label className="flex items-center gap-2">
                    <Factory className="w-4 h-4 text-emerald-600" />
                    Funcionários na Limpeza Manual:
                  </label>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">
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
                  className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div className="bg-orange-50 border border-orange-200 p-4 rounded text-xs text-orange-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#eb6420]" /> 1 Máquina = Trabalho de 3 a 4 Operadores
                </div>
                <p className="text-slate-700">
                  A A260 lava e seca o piso simultaneamente a <strong className="text-slate-900">2.000 m²/hora</strong>, liberando sua equipe para outras atividades e eliminando poças de água.
                </p>
              </div>

            </div>

            {/* Resultado */}
            <div className="lg:col-span-6 bg-slate-900 text-white p-6 rounded-lg space-y-5">
              <span className="text-xs uppercase font-bold text-orange-400">Resultado Estimado</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 p-3.5 rounded border border-slate-700">
                  <span className="text-[11px] text-slate-400">Economia Mensal Estimada:</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    R$ {roiData.economiaMensal.toLocaleString('pt-BR')}
                  </div>
                  <span className="text-[10px] text-slate-500">por mês em folha/encargos</span>
                </div>

                <div className="bg-slate-800 p-3.5 rounded border border-slate-700">
                  <span className="text-[11px] text-slate-400">Economia em 12 Meses:</span>
                  <div className="text-2xl font-black text-cyan-300 font-mono mt-1">
                    R$ {roiData.economiaAnual.toLocaleString('pt-BR')}
                  </div>
                  <span className="text-[10px] text-slate-500">no contrato anual</span>
                </div>
              </div>

              <button
                onClick={() => handleWhatsAppRedirect(`Olá! Simulei uma área de ${selectedArea}m² com ${selectedCleaners} faxineiros e gostaria de validar a economia da Tennant A260.`)}
                className="w-full py-3 bg-[#eb6420] hover:bg-[#d45311] text-white font-bold text-xs uppercase rounded transition-colors flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Receber Proposta com Estudo de ROI
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FICHA TÉCNICA OFICIAL (TABELA TENNANT)                                */}
      {/* ========================================================================= */}
      <section id="especificacoes" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[#eb6420] text-xs font-bold uppercase tracking-wider">Dados Oficiais</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Especificações Técnicas da Tennant A260
              </h2>
            </div>

            <a
              href="#formulario-cotacao"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#eb6420] bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded transition-colors"
            >
              <Download className="w-4 h-4" />
              Solicitar Catálogo Completo em PDF
            </a>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-100 text-slate-900 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Característica</th>
                  <th className="px-5 py-3">Especificação Oficial Tennant A260</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">Faixa de Limpeza (Disco)</td>
                  <td className="px-5 py-3 font-mono">510 mm (20 polegadas)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">Largura do Rodo Traseiro</td>
                  <td className="px-5 py-3 font-mono">772 mm (Formato parabólico com lâminas Linatex®)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">Capacidade do Tanque de Solução (Água Limpa)</td>
                  <td className="px-5 py-3 font-mono">45 Litros</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">Capacidade do Tanque de Recuperação (Água Suja)</td>
                  <td className="px-5 py-3 font-mono">45 Litros</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">Produtividade Máxima Teórica</td>
                  <td className="px-5 py-3 font-mono">Até 2.000 m²/hora</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">Produtividade Prática Estimada</td>
                  <td className="px-5 py-3 font-mono">640 - 1.200 m²/hora</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">Rotação da Escova / Disco</td>
                  <td className="px-5 py-3 font-mono">155 RPM</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">Nível de Ruído no Operador</td>
                  <td className="px-5 py-3 font-mono">69 dBA (Silenciosa para limpeza diurna)</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">Fonte de Energia & Baterias</td>
                  <td className="px-5 py-3 font-mono">Sistema 24V com carregador inteligente integrado</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">Dimensões (Comprimento x Largura x Altura)</td>
                  <td className="px-5 py-3 font-mono">1.300 x 545 x 1.100 mm</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">Peso Operacional (com baterias)</td>
                  <td className="px-5 py-3 font-mono">141,5 kg</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FORMULÁRIO DE COTAÇÃO & CAPTURA DE LEADS (CONECTADO AO CRM)           */}
      {/* ========================================================================= */}
      <section id="formulario-cotacao" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-white border-2 border-slate-200 rounded-xl p-6 sm:p-10 shadow-sm">
            
            <div className="text-center mb-8">
              <span className="text-[#eb6420] text-xs font-bold uppercase tracking-wider">Atendimento Rápido</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Solicite uma Proposta da Tennant A260
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Preencha os campos abaixo para receber a cotação oficial em minutos pelo WhatsApp ou e-mail.
              </p>
            </div>

            {submittedSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Solicitação Enviada com Sucesso!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Seus dados foram recebidos pela nossa equipe comercial. Redirecionando para o WhatsApp...
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Seu Nome *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Oliveira"
                      value={formState.nome}
                      onChange={(e) => setFormState({ ...formState, nome: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#eb6420]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Empresa / Condomínio</label>
                    <input
                      type="text"
                      placeholder="Ex: Condomínio ou Indústria Ltda"
                      value={formState.empresa}
                      onChange={(e) => setFormState({ ...formState, empresa: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#eb6420]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Telefone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="(41) 98508-3658"
                      value={formState.telefone}
                      onChange={(e) => setFormState({ ...formState, telefone: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#eb6420]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cidade / Região</label>
                    <input
                      type="text"
                      placeholder="Curitiba, Araucária, SJP..."
                      value={formState.cidade}
                      onChange={(e) => setFormState({ ...formState, cidade: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#eb6420]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Interesse</label>
                    <select
                      value={formState.interesse}
                      onChange={(e) => setFormState({ ...formState, interesse: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#eb6420]"
                    >
                      <option value="Locação">Locação de Equipamento</option>
                      <option value="Venda 0km">Compra Direta / Aquisição</option>
                      <option value="Assistência Técnica">Assistência Técnica / Peças</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Período de Locação</label>
                    <select
                      value={formState.periodo}
                      onChange={(e) => setFormState({ ...formState, periodo: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#eb6420]"
                    >
                      <option value="Mensal">Mensal (Contínuo)</option>
                      <option value="Diária / Semanal">Diária / Semanal (Curto)</option>
                      <option value="12 a 36 Meses">12 a 36 Meses (Corporativo)</option>
                      <option value="48 a 60 Meses">48 a 60 Meses (Longo Prazo)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observações ou Metragem do Piso</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Galpão de 3.000m² em Curitiba..."
                    value={formState.mensagem}
                    onChange={(e) => setFormState({ ...formState, mensagem: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#eb6420] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#eb6420] hover:bg-[#d45311] text-white font-bold text-xs uppercase tracking-wider rounded shadow transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Processando...' : 'Receber Proposta no WhatsApp'}
                  <ArrowRight className="w-4 h-4" />
                </button>

              </form>
            )}

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. FAQ - DÚVIDAS FREQUENTES                                              */}
      {/* ========================================================================= */}
      <section id="faq" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10">
            <span className="text-[#eb6420] text-xs font-bold uppercase tracking-wider">Esclareça suas Dúvidas</span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Perguntas Frequentes</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                
                {openFaq === index && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. FOOTER CORPORATIVO OFICIAL                                            */}
      {/* ========================================================================= */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <img src={LOGO_ALFA_TENNANT} alt="Alfa Tennant" className="h-8 object-contain brightness-0 invert" />
            <div className="border-l border-slate-700 pl-4">
              <div className="text-white font-bold">Clean Tech Smart Equipamentos</div>
              <div className="text-slate-500 text-[11px]">Representante e Assistência Técnica Autorizada Tennant - Curitiba/PR</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-300">
            <a href="#hero-pdp" className="hover:text-white">A260</a>
            <a href="#locacao" className="hover:text-white">Locação</a>
            <a href="#venda" className="hover:text-white">Vendas</a>
            <a href="#assistencia" className="hover:text-white">Assistência</a>
            <a href="#formulario-cotacao" className="hover:text-white">Contato</a>
          </div>

          <div className="text-slate-500 text-[11px] text-center md:text-right">
            WhatsApp: {WHATSAPP_DISPLAY} | {EMAIL_CONTATO}<br />
            © {new Date().getFullYear()} Clean Tech Smart. Todos os direitos reservados.
          </div>

        </div>
      </footer>

      {/* Floating Sticky Mobile WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50 sm:hidden">
        <button
          onClick={() => handleWhatsAppRedirect()}
          className="w-14 h-14 rounded-full bg-emerald-500 text-white shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <MessageSquare className="w-7 h-7" />
        </button>
      </div>

    </div>
  );
}
