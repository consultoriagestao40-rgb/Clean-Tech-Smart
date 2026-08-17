import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Wrench, 
  Zap, 
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
  DollarSign, 
  Mail, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Star,
  Maximize2,
  X,
  ShoppingCart,
  Briefcase
} from 'lucide-react';

export default function LpTennantA260() {
  // =========================================================================
  // 📞 DADOS DE CONTATO & EMPRESA (100% WhatsApp & E-mail - Sem formulários)
  // =========================================================================
  const WHATSAPP_NUMBER = localStorage.getItem('lp_a260_whatsapp') || "5541985083658";
  const WHATSAPP_DISPLAY = localStorage.getItem('lp_a260_whatsapp_display') || "(41) 98508-3658";
  const EMAIL_CONTATO = localStorage.getItem('lp_a260_email') || "vendas@cleantechpro.com.br";

  // Logos Oficiais
  const LOGO_ALFA_TENNANT = "https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png";
  const [companyLogo] = useState(localStorage.getItem('app_company_logo') || '');

  // =========================================================================
  // 1. 📷 FOTOS OFICIAIS DA MÁQUINA
  // =========================================================================
  const DEFAULT_PHOTOS = [
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-main.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-solution-tank.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-control-panel.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg",
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-in-use.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg"
  ];

  const [photoUrlsText, setPhotoUrlsText] = useState(() => {
    const saved = localStorage.getItem('lp_a260_photo_urls');
    if (saved && !saved.includes('a260-handle')) {
      return saved;
    }
    return DEFAULT_PHOTOS.join('\n');
  });
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const photoList = useMemo(() => {
    const list = photoUrlsText.split('\n').map(u => u.trim()).filter(Boolean);
    return list.length > 0 ? list : DEFAULT_PHOTOS;
  }, [photoUrlsText]);

  // =========================================================================
  // 2. 🎥 VÍDEOS DEMONSTRATIVOS (Links do YouTube configurados no painel)
  // =========================================================================
  const DEFAULT_VIDEOS = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  ];

  const [videoUrlsText] = useState(() => {
    return localStorage.getItem('lp_a260_video_urls') || DEFAULT_VIDEOS.join('\n');
  });

  // Helper universal para vídeos: Google Drive, YouTube ou MP4 direto
  const parseVideoEmbed = (url) => {
    if (!url) return null;
    const trimmed = url.trim();

    // 1. Google Drive (drive.google.com/file/d/... ou drive.google.com/open?id=...)
    const driveMatch1 = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch1 && driveMatch1[1]) {
      return `https://drive.google.com/file/d/${driveMatch1[1]}/preview`;
    }

    const driveMatch2 = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch2 && driveMatch2[1] && trimmed.includes('drive.google.com')) {
      return `https://drive.google.com/file/d/${driveMatch2[1]}/preview`;
    }

    // 2. YouTube
    const ytMatch = trimmed.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    if (ytMatch && ytMatch[2].length === 11) {
      return `https://www.youtube.com/embed/${ytMatch[2]}`;
    }

    // 3. Fallback / URL Direta
    return trimmed;
  };

  const videoList = useMemo(() => {
    const lines = videoUrlsText.split('\n').map(u => u.trim()).filter(Boolean);
    return lines.map((link, idx) => ({
      id: idx,
      url: link,
      embedUrl: parseVideoEmbed(link),
      title: idx === 0 ? "Demonstração da Tennant A260: Operação & Sucção Linatex" : `Vídeo Demonstrativo da Lavadora Tennant #${idx + 1}`
    }));
  }, [videoUrlsText]);

  // =========================================================================
  // 3. 💬 PRINTS DE DEPOIMENTOS DE CLIENTES (Configurados no painel)
  // =========================================================================
  const DEFAULT_TESTIMONIALS = [
    "https://www.tennantco.com/content/dam/alfa/Products/Machines/scrubber-walk-behinds/a260/images/a260-in-use.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg"
  ];

  const [testimonialUrlsText] = useState(() => {
    return localStorage.getItem('lp_a260_testimonials_urls') || DEFAULT_TESTIMONIALS.join('\n');
  });
  const [zoomedImage, setZoomedImage] = useState(null);

  const testimonialList = useMemo(() => {
    const list = testimonialUrlsText.split('\n').map(u => u.trim()).filter(Boolean);
    return list.length > 0 ? list : DEFAULT_TESTIMONIALS;
  }, [testimonialUrlsText]);

  // Sincroniza fotos com o catálogo de máquinas do banco de dados
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/get-machine-models');
        if (res.ok) {
          const data = await res.json();
          if (data.machineModels && data.machineModels.length > 0) {
            const foundA260 = data.machineModels.find(m => 
              m.name?.toLowerCase().includes('a260') || 
              m.name?.toLowerCase().includes('a-260')
            );
            if (foundA260?.photo_urls && !localStorage.getItem('lp_a260_photo_urls')) {
              setPhotoUrlsText(foundA260.photo_urls);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar modelo do catálogo:', err);
      }
    }
    loadCatalog();
  }, []);

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % photoList.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + photoList.length) % photoList.length);
  };

  // Tabs de Conteúdo
  const [activeTab, setActiveTab] = useState('locacao');

  // ROI Calculator States
  const [selectedArea, setSelectedArea] = useState(2500); // m²
  const [selectedCleaners, setSelectedCleaners] = useState(3); // faxineiros manuais
  const [openFaq, setOpenFaq] = useState(null);

  // ROI Math
  const roiData = useMemo(() => {
    const horasComA260 = (selectedArea / 1200).toFixed(1);
    const horasManual = (selectedArea / (selectedCleaners * 180)).toFixed(1);
    const custoManualMensal = selectedCleaners * 3200;
    const custoLocacaoMensal = 3890;
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

  // Função WhatsApp Direto
  const handleWhatsAppRedirect = (customMsg = null) => {
    const text = customMsg || `Olá! Gostaria de informações e proposta para a Lavadora Tennant A260 em Curitiba e Região.`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // FAQ Data
  const faqs = [
    {
      q: "Qual a diferença entre a locação e a compra da Tennant A260?",
      a: "Na locação você não imobiliza capital, tem dedução de 100% das parcelas no IR (Lucro Real) e a Clean Tech Smart assume toda a manutenção preventiva, corretiva e peças de reposição com máquina reserva garantida. Na compra direta, você adquire um ativo de altíssima durabilidade com garantia oficial e suporte de fábrica."
    },
    {
      q: "Como funciona a assistência técnica autorizada em Curitiba e Região?",
      a: "Somos representantes e assistência técnica autorizada Tennant no Paraná. Dispomos de técnicos certificados, oficina móvel (atendimento no seu galpão/empresa) e peças 100% originais a pronta entrega."
    },
    {
      q: "Quais os planos de locação disponíveis?",
      a: "Oferecemos planos: Diário (pós-obra e eventos), Semanal (7 dias), Quinzenal (15 dias), Mensal e contratos corporativos de 12, 24, 36, 48 até 60 meses com descontos progressivos."
    },
    {
      q: "A entrega técnica e o treinamento dos funcionários estão inclusos?",
      a: "Sim! Em qualquer contratação (locação ou venda), realizamos a entrega técnica no seu estabelecimento e treinamos gratuitamente seus operadores."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[#212529] font-sans antialiased">
      
      {/* ========================================================================= */}
      {/* 1. TOP BAR INSTITUCIONAL COM LOGOS E CONTATO DIRETO                       */}
      {/* ========================================================================= */}
      <div className="bg-[#007481] text-white py-3.5 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Logos e Autoridade Autorizada */}
          <div className="flex items-center gap-4 sm:gap-6">
            <img 
              src={LOGO_ALFA_TENNANT} 
              alt="Alfa by Tennant Company" 
              className="h-8 sm:h-10 object-contain brightness-0 invert"
            />
            
            <div className="h-7 w-px bg-teal-300/40 hidden sm:block"></div>
            
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt="Clean Tech Smart" 
                className="h-8 sm:h-9 object-contain brightness-0 invert max-w-[140px]" 
              />
            ) : (
              <div className="text-white font-extrabold text-sm sm:text-base tracking-tight">
                Clean Tech Smart
              </div>
            )}
            
            <span className="hidden lg:inline text-xs font-semibold text-teal-100 pl-3 border-l border-teal-300/40">
              Representante & Assistência Técnica Autorizada Tennant • Curitiba/PR
            </span>
          </div>

          {/* Contatos Diretos (WhatsApp & E-mail) */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <a 
              href={`mailto:${EMAIL_CONTATO}`}
              className="hidden md:flex items-center gap-1.5 text-teal-100 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {EMAIL_CONTATO}
            </a>

            <button
              onClick={() => handleWhatsAppRedirect()}
              className="flex items-center gap-2 bg-[#eb6420] hover:bg-[#d65715] text-white px-4 py-2 rounded-full font-bold shadow-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp: {WHATSAPP_DISPLAY}</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRODUCT DISPLAY (HERO PDP)                                             */}
      {/* ========================================================================= */}
      <section id="hero-pdp" className="py-6 sm:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* LEFT COLUMN: FOTO GRANDE COM CONTROLES + MINIATURAS EMBAIXO */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Foto Principal */}
              <div className="relative bg-white flex items-center justify-center min-h-[380px] sm:min-h-[460px] group select-none">
                
                <img 
                  src={photoList[activePhotoIndex] || DEFAULT_PHOTOS[0]} 
                  alt="A260 Lavadora de piso de operação a pé" 
                  className="max-h-[440px] w-auto object-contain transition-opacity duration-300"
                />

                {/* Seta Esquerda */}
                {photoList.length > 1 && (
                  <button
                    onClick={prevPhoto}
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 p-2 transition-colors cursor-pointer"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                )}

                {/* Seta Direita */}
                {photoList.length > 1 && (
                  <button
                    onClick={nextPhoto}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 p-2 transition-colors cursor-pointer"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                )}
              </div>

              {/* Faixa de Miniaturas (Idêntico ao print) */}
              <div className="flex items-center gap-3 overflow-x-auto py-1">
                {photoList.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 border p-1 bg-white transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                      activePhotoIndex === idx 
                        ? 'border-[#007481] border-2 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={url} alt="" className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>

            </div>

            {/* RIGHT COLUMN: HEADLINE ELEGANTE + NOME DA MÁQUINA + ESPECIFICAÇÕES + BOTÃO */}
            <div className="lg:col-span-6 space-y-5 pt-1">
              
              {/* Headline Comercial Limpa e de Alto Impacto com cores em destaque */}
              <div className="space-y-2 pb-1">
                <div className="flex items-center gap-1.5 text-[#eb6420] text-xs font-black uppercase tracking-wider">
                  <span>★ A Lavadora Mais Vendida da Tennant</span>
                  <span>•</span>
                  <span>Líder Global</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  Máxima eficiência na limpeza de pisos: substitua até <span className="text-[#007481] font-black">4 auxiliares de limpeza</span> e reduza em até <span className="text-[#eb6420] font-black">60% os custos</span> com a lavadora mais vendida da Tennant.
                </h1>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed pt-1">
                  A <strong className="text-gray-900">Tennant A-260</strong> limpa até <strong className="text-[#007481]">2.000 m²/h</strong> com operação ultra simples de 1 botão, baixo ruído (69 dBA) e secagem imediata.
                </p>
              </div>

              {/* Nome da Máquina e Categoria Oficial */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#212529] tracking-tight">
                  A260
                </h2>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-0.5">
                  Lavadora de piso de operação a pé
                </h3>
              </div>

              {/* Botão Oficial Laranja Tennant Arredondado (Pill Button / Rounded Full) */}
              <div className="pt-3">
                <button
                  onClick={() => handleWhatsAppRedirect("Olá! Gostaria de SOLICITAR DEMONSTRAÇÃO / COTAÇÃO para a Lavadora Tennant A260.")}
                  className="bg-[#eb6420] hover:bg-[#d65715] text-white font-bold text-sm tracking-wider uppercase px-10 py-4 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center justify-center"
                >
                  SOLICITAR DEMONSTRAÇÃO / COTAÇÃO
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DOBRA 2: INDICADORES DE DESEMPENHO (GRID RÁPIDO)                       */}
      {/* ========================================================================= */}
      <section className="py-10 bg-gray-50 border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-6">
            <span className="text-[#007481] text-xs font-bold uppercase tracking-wider block">Alta Produtividade & Eficiência</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-0.5">Indicadores de Desempenho (Grid Rápido)</h2>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-100 text-gray-900 uppercase font-bold text-[11px] border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Indicador</th>
                  <th className="px-5 py-3.5">Especificação</th>
                  <th className="px-5 py-3.5">Benefício Prático</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-5 py-3.5 font-bold text-gray-900">Produtividade Teórica</td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-[#007481]">Até 2.000 m²/h</td>
                  <td className="px-5 py-3.5 text-gray-700">Substitui equipes manuais (até 4 auxiliares) e reduz o tempo de operação</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-bold text-gray-900">Faixa de Limpeza</td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-gray-800">510 mm (disco)</td>
                  <td className="px-5 py-3.5 text-gray-700">Agilidade em corredores e áreas médias</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-bold text-gray-900">Capacidade dos Tanques</td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-gray-800">40L (Solução) / 45L (Recuperação)</td>
                  <td className="px-5 py-3.5 text-gray-700">Maior autonomia sem paradas frequentes</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-bold text-gray-900">Nível de Ruído</td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-emerald-700">Até 69 dBA</td>
                  <td className="px-5 py-3.5 text-gray-700">Operação ultra silenciosa para <strong>Supermercados em horário de pico</strong>, <strong>Hospitais</strong>, <strong>Áreas Administrativas</strong> e <strong>Indústrias</strong></td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-bold text-gray-900">Alimentação</td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-[#eb6420]">Bateria (sem cabo)</td>
                  <td className="px-5 py-3.5 text-gray-700">Total mobilidade sem risco de tropeços</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Destaque Criativo por Segmento de Atuação */}
          <div className="mt-10">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-[#eb6420] text-xs font-black uppercase tracking-wider">Aplicações Práticas no Seu Negócio</span>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">Onde a Tennant A260 Entrega Resultados Imbatíveis</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Supermercados */}
              <div className="bg-white border-2 border-orange-200 hover:border-[#eb6420] rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between relative group">
                <div className="absolute -top-2.5 right-4 bg-[#eb6420] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Mais Vendida
                </div>
                <div>
                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#eb6420] flex items-center justify-center mb-3">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">Supermercados & Atacarejos</h4>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Manobra fácil entre gôndolas e caixas. <strong>Piso seco no mesmo instante</strong>, eliminando o risco de escorregões de clientes mesmo com a loja cheia.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-bold text-[#eb6420]">
                  ✓ Zero interdição de corredores
                </div>
              </div>

              {/* Card 2: Hospitais & Clínicas */}
              <div className="bg-white border border-gray-200 hover:border-[#007481] rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#007481] flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">Hospitais & Clínicas</h4>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Nível de ruído de <strong>69 dBA</strong> permite higienização diurna. A sucção parabólica recolhe 100% da água suja, atendendo rigorosos padrões sanitários.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-bold text-[#007481]">
                  ✓ Controle de infecção e ruído
                </div>
              </div>

              {/* Card 3: Áreas Administrativas */}
              <div className="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-gray-800 flex items-center justify-center mb-3">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">Áreas Administrativas</h4>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Halls, recepções e escritórios limpos e secos rapidamente sem atrapalhar reuniões ou atendimento ao público.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-bold text-gray-700">
                  ✓ Ambiente corporativo impecável
                </div>
              </div>

              {/* Card 4: Indústrias & Logística */}
              <div className="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-gray-800 flex items-center justify-center mb-3">
                    <Factory className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">Indústrias & Galpões</h4>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    Produtividade de <strong>2.000 m²/h</strong> com pressão de escova para remoção de poeira pesada e marcas leves com agilidade.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-bold text-gray-700">
                  ✓ Alta durabilidade e produtividade
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SEÇÃO DE VÍDEOS & PRINTS DE DEPOIMENTOS DE CLIENTES                    */}
      {/* ========================================================================= */}
      <section id="videos-depoimentos" className="py-14 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* BLOCO 1: VÍDEOS DEMONSTRATIVOS */}
          <div>
            <div className="mb-6">
              <span className="text-[#007481] text-xs font-bold uppercase tracking-wider">Demonstrações em Vídeo</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-0.5">Vídeos da Lavadora Tennant A260</h2>
            </div>

            {/* Grid de Players de Vídeo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videoList.map((vid) => (
                <div key={vid.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="aspect-video bg-black w-full relative">
                      {vid.embedUrl && (vid.embedUrl.includes('drive.google.com') || vid.embedUrl.includes('youtube.com') || vid.embedUrl.includes('/preview')) ? (
                        <iframe
                          src={vid.embedUrl}
                          title={vid.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; allow-same-origin; allow-scripts"
                          allowFullScreen
                          className="w-full h-full border-0"
                        ></iframe>
                      ) : vid.url.endsWith('.mp4') || vid.url.endsWith('.webm') ? (
                        <video
                          src={vid.url}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 text-center">
                          <Play className="w-12 h-12 text-[#eb6420] mb-2" />
                          <span className="text-xs">{vid.url}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm">{vid.title}</h3>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => handleWhatsAppRedirect(`Olá! Assisti ao vídeo da Tennant A260 e gostaria de agendar uma demonstração no meu local.`)}
                      className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded transition-colors cursor-pointer"
                    >
                      Agendar Demonstração Prática no Local
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BLOCO 2: PRINTS DE DEPOIMENTOS DE CLIENTES */}
          <div className="pt-6 border-t border-gray-200">
            <div className="mb-6">
              <span className="text-[#eb6420] text-xs font-bold uppercase tracking-wider">Prova Social & Avaliações</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-0.5">Depoimentos & Prints de Clientes Satisfeitos</h2>
              <p className="text-xs text-gray-500 mt-1">Veja o que síndicos, gerentes de facilities e diretores de indústrias dizem sobre nosso atendimento.</p>
            </div>

            {/* Grid de Prints de Depoimentos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {testimonialList.map((url, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative cursor-pointer"
                  onClick={() => setZoomedImage(url)}
                >
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden relative">
                    <img src={url} alt={`Depoimento Cliente ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Maximize2 className="w-4 h-4" /> Clique para Ampliar
                    </div>
                  </div>
                  <div className="p-3 text-xs bg-white flex items-center justify-between">
                    <span className="font-semibold text-gray-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cliente Verificado Curitiba
                    </span>
                    <span className="text-[10px] text-gray-400">Ver Print</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Modal de Zoom de Imagem */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg p-2 overflow-hidden" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={zoomedImage} alt="Depoimento Ampliado" className="max-h-[80vh] w-auto mx-auto object-contain rounded" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TABS INFORMATIVAS (Planos de Locação, Venda, Assistência, ROI)          */}
      {/* ========================================================================= */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Seletor de Abas */}
          <div className="flex items-center gap-2 border-b border-gray-300 pb-px mb-8 overflow-x-auto">
            {[
              { id: 'locacao', label: 'Planos de Locação (Diário a 60 Meses)' },
              { id: 'venda', label: 'Venda de Máquinas Novas' },
              { id: 'assistencia', label: 'Assistência Técnica Autorizada' },
              { id: 'roi', label: 'Calculadora de ROI & Mão de Obra' },
              { id: 'especificacoes', label: 'Ficha Técnica Completa' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#007481] text-[#007481] bg-gray-50 rounded-t'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ABA 1: PLANOS DE LOCAÇÃO */}
          {activeTab === 'locacao' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Curto Prazo */}
                <div className="bg-gray-50 border border-gray-200 rounded p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-gray-500">Curto Prazo</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">Diária / Semanal / Quinzenal</h3>
                    <p className="text-xs text-gray-600 mt-2">
                      Ideal para limpezas pós-obra, paradas industriais, auditorias e demandas pontuais.
                    </p>
                    <div className="my-4 py-3 border-y border-gray-200">
                      <div className="text-lg font-bold text-gray-900">Consulte Valores</div>
                      <div className="text-[11px] text-gray-500">Entrega técnica rápida em Curitiba e Região</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWhatsAppRedirect("Olá! Gostaria de consultar valores para LOCAÇÃO DIÁRIA/SEMANAL da Tennant A260.")}
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs uppercase rounded transition-colors cursor-pointer"
                  >
                    Cotar no WhatsApp
                  </button>
                </div>

                {/* Mensal */}
                <div className="bg-white border-2 border-[#eb6420] rounded p-6 shadow-md flex flex-col justify-between relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#eb6420] text-white text-[10px] font-bold uppercase px-3 py-0.5 rounded">
                    Mais Escolhido
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-[#eb6420]">Contrato Contínuo</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">Locação Mensal</h3>
                    <p className="text-xs text-gray-600 mt-2">
                      A escolha padrão de indústrias, condomínios e supermercados.
                    </p>
                    <div className="my-4 py-3 border-y border-orange-100">
                      <div className="text-2xl font-black text-gray-900 font-mono">R$ 3.890,00<span className="text-xs font-normal text-gray-500">/mês</span></div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-1">Manutenção e peças 100% inclusas</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWhatsAppRedirect("Olá! Gostaria de contratar a LOCAÇÃO MENSAL da Tennant A260 a partir de R$ 3.890/mês.")}
                    className="w-full py-2.5 bg-[#eb6420] hover:bg-[#d65715] text-white font-bold text-xs uppercase rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contratar no WhatsApp
                  </button>
                </div>

                {/* Longo Prazo 12 a 60 Meses */}
                <div className="bg-gray-50 border border-gray-200 rounded p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-gray-500">Frotas Corporativas</span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">12 a 60 Meses</h3>
                    <p className="text-xs text-gray-600 mt-2">
                      Descontos progressivos da nossa tabela para contratos de longo prazo.
                    </p>
                    <div className="my-4 py-3 border-y border-gray-200">
                      <div className="text-lg font-bold text-gray-900">Menor Parcela Mensal</div>
                      <div className="text-[11px] text-gray-500">Gestão de manutenção preventiva inclusa</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWhatsAppRedirect("Olá! Gostaria de consultar a tabela de 12 a 60 meses para a Tennant A260.")}
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs uppercase rounded transition-colors cursor-pointer"
                  >
                    Consultar Tabela 12-60M
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ABA 2: VENDA DE MÁQUINA NOVA */}
          {activeTab === 'venda' && (
            <div className="bg-gray-50 border border-gray-200 rounded p-8 shadow-sm space-y-6">
              <div className="max-w-3xl">
                <h3 className="text-xl font-bold text-gray-900">Aquisição Direta de Máquina Nova Tennant A260</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Compre com garantia de fábrica, entrega técnica autorizada e treinamento gratuito no seu estabelecimento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-white border border-gray-200 p-4 rounded">
                  <ShieldCheck className="w-5 h-5 text-[#007481] mb-2" />
                  <div className="font-bold text-gray-900">Garantia Oficial Tennant</div>
                  <p className="text-gray-500 mt-1">Proteção completa e técnicos treinados na fábrica.</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded">
                  <DollarSign className="w-5 h-5 text-emerald-600 mb-2" />
                  <div className="font-bold text-gray-900">Financiamento BNDES / FINAME</div>
                  <p className="text-gray-500 mt-1">Linhas facilitadas para empresas e indústrias.</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded">
                  <CheckCircle2 className="w-5 h-5 text-[#eb6420] mb-2" />
                  <div className="font-bold text-gray-900">Entrega Técnica Grátis</div>
                  <p className="text-gray-500 mt-1">Desembarque e treinamento de operadores no local.</p>
                </div>
              </div>

              <button
                onClick={() => handleWhatsAppRedirect("Olá! Gostaria de receber uma proposta para COMPRA de Máquina Nova Tennant A260.")}
                className="bg-[#eb6420] hover:bg-[#d65715] text-white font-bold text-xs uppercase px-6 py-3 rounded shadow-sm cursor-pointer"
              >
                Solicitar Cotação de Máquina Nova no WhatsApp
              </button>
            </div>
          )}

          {/* ABA 3: ASSISTÊNCIA TÉCNICA */}
          {activeTab === 'assistencia' && (
            <div className="bg-gray-50 border border-gray-200 rounded p-8 shadow-sm space-y-6">
              <div className="max-w-3xl">
                <h3 className="text-xl font-bold text-gray-900">Assistência Técnica Autorizada Tennant em Curitiba</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Atendimento ágil in-company com oficina volante e peças 100% originais em estoque local.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-white border border-gray-200 rounded space-y-1">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-[#007481]" /> Atendimento In-Company
                  </div>
                  <p className="text-gray-600">Nossa van equipada vai até o seu galpão para diagnóstico e reparo imediato.</p>
                </div>

                <div className="p-4 bg-white border border-gray-200 rounded space-y-1">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Peças Originais a Pronta Entrega
                  </div>
                  <p className="text-gray-600">Lâminas Linatex, motores de vácuo, escovas e baterias em estoque em Curitiba.</p>
                </div>
              </div>

              <button
                onClick={() => handleWhatsAppRedirect("Olá! Preciso de ASSISTÊNCIA TÉCNICA / PEÇAS para lavadora Tennant em Curitiba.")}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs uppercase px-6 py-3 rounded cursor-pointer"
              >
                Chamar Técnico Autorizado no WhatsApp
              </button>
            </div>
          )}

          {/* ABA 4: CALCULADORA DE ROI */}
          {activeTab === 'roi' && (
            <div className="bg-gray-50 border border-gray-200 rounded p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-5">
                <h3 className="text-lg font-bold text-gray-900">Simulador de Economia de Mão de Obra</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-800">
                    <span>Área Total a Limpar:</span>
                    <span className="font-mono text-[#007481]">{selectedArea.toLocaleString('pt-BR')} m²</span>
                  </div>
                  <input 
                    type="range" min="500" max="10000" step="250" value={selectedArea}
                    onChange={(e) => setSelectedArea(Number(e.target.value))}
                    className="w-full accent-[#007481]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-800">
                    <span>Funcionários na Limpeza Manual:</span>
                    <span className="font-mono text-emerald-700">{selectedCleaners} auxiliares</span>
                  </div>
                  <input 
                    type="range" min="1" max="8" step="1" value={selectedCleaners}
                    onChange={(e) => setSelectedCleaners(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div className="text-xs text-gray-600 bg-orange-50 p-3 rounded border border-orange-200">
                  💡 <strong>1 Lavadora Tennant A260</strong> faz o trabalho de 3 a 4 auxiliares de limpeza com balde/mop, limpando 2.000 m²/h com piso seco na hora.
                </div>
              </div>

              <div className="lg:col-span-6 bg-gray-900 text-white p-6 rounded space-y-4">
                <span className="text-xs font-bold uppercase text-orange-400">Estimativa Financeira</span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-gray-400">Economia Mensal Estimada:</span>
                    <div className="text-2xl font-black text-emerald-400 font-mono">R$ {roiData.economiaMensal.toLocaleString('pt-BR')}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-400">Economia Anual (12M):</span>
                    <div className="text-2xl font-black text-cyan-300 font-mono">R$ {roiData.economiaAnual.toLocaleString('pt-BR')}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleWhatsAppRedirect(`Olá! Simulei na calculadora uma área de ${selectedArea}m² com ${selectedCleaners} auxiliares de limpeza e gostaria de proposta para a Tennant A260.`)}
                  className="w-full py-2.5 bg-[#eb6420] hover:bg-[#d65715] text-white font-bold text-xs uppercase rounded cursor-pointer"
                >
                  Validar Estudo no WhatsApp
                </button>
              </div>
            </div>
          )}

          {/* ABA 5: ESPECIFICAÇÕES TÉCNICAS */}
          {activeTab === 'especificacoes' && (
            <div className="bg-white border border-gray-200 rounded overflow-x-auto shadow-sm">
              <table className="w-full text-xs text-left text-gray-700">
                <thead className="bg-gray-100 text-gray-900 uppercase font-bold text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3">Característica</th>
                    <th className="px-5 py-3">Especificação Oficial Tennant A260</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-5 py-3 font-semibold text-gray-900">Faixa de Limpeza</td>
                    <td className="px-5 py-3 font-mono">510 mm (20 polegadas)</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-gray-900">Largura do Rodo</td>
                    <td className="px-5 py-3 font-mono">772 mm (Lâminas Linatex® de 4 lados)</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-gray-900">Tanque de Solução</td>
                    <td className="px-5 py-3 font-mono">40 Litros (Opção 45L)</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-gray-900">Tanque de Recuperação</td>
                    <td className="px-5 py-3 font-mono">45 Litros</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-gray-900">Produtividade Máxima Teórica</td>
                    <td className="px-5 py-3 font-mono">Até 2.000 m²/h</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-gray-900">Nível de Ruído</td>
                    <td className="px-5 py-3 font-mono">69 dBA (Silenciosa para limpeza diurna)</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 font-semibold text-gray-900">Operação</td>
                    <td className="px-5 py-3 font-mono">Botão único One-Touch Start/Stop</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FAQ SIMPLES (Dúvidas Rápidas)                                          */}
      {/* ========================================================================= */}
      <section className="py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Perguntas Frequentes</h2>
          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-gray-800 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-3.5 pb-3.5 text-xs text-gray-600 border-t border-gray-100 pt-2 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER CORPORATIVO (Sem formulários - Apenas Contato Direto)           */}
      {/* ========================================================================= */}
      <footer className="bg-gray-900 text-gray-400 py-10 text-xs border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <img src={LOGO_ALFA_TENNANT} alt="Alfa Tennant" className="h-8 object-contain brightness-0 invert" />
            <div className="border-l border-gray-700 pl-4">
              <div className="text-white font-bold">Clean Tech Smart Equipamentos</div>
              <div className="text-gray-500 text-[11px]">Representante e Assistência Técnica Autorizada Tennant - Curitiba/PR</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-gray-300">
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp: {WHATSAPP_DISPLAY}
            </a>
            <a 
              href={`mailto:${EMAIL_CONTATO}`} 
              className="hover:text-white flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> {EMAIL_CONTATO}
            </a>
          </div>

          <div className="text-gray-500 text-[11px] text-center md:text-right">
            © {new Date().getFullYear()} Clean Tech Smart. Todos os direitos reservados.
          </div>

        </div>
      </footer>

      {/* Botão Flutuante do WhatsApp */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => handleWhatsAppRedirect()}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="hidden sm:inline text-xs">Fale no WhatsApp</span>
        </button>
      </div>

    </div>
  );
}
