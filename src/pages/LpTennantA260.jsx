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
  Briefcase,
  Power,
  Video
} from 'lucide-react';
import CleanTechLogo from '../components/CleanTechLogo';

// Ícone Oficial do WhatsApp em SVG
function WhatsAppIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

export default function LpTennantA260() {
  // =========================================================================
  // 📞 DADOS DE CONTATO & EMPRESA (100% WhatsApp & E-mail - Sem formulários)
  // =========================================================================
  const WHATSAPP_NUMBER = localStorage.getItem('lp_a260_whatsapp') || "5541985083658";
  const WHATSAPP_DISPLAY = localStorage.getItem('lp_a260_whatsapp_display') || "(41) 98508-3658";
  const EMAIL_CONTATO = localStorage.getItem('lp_a260_email') || "vendas@cleantechpro.com.br";
  const rentalPrice = localStorage.getItem('lp_a260_rental_price') || "3.890,00";

  // Logos Oficiais em Alta Definição (HD 4K Transparentes)
  const LOGO_ALFA_TENNANT = "/alfa-tennant-logo-hd.png";
  const LOGO_CLEANTECH_DEFAULT = "/cleantechpro-official-white.png";
  const [companyLogo, setCompanyLogo] = useState(LOGO_CLEANTECH_DEFAULT);

  useEffect(() => {
    const handleLogo = () => {
      setCompanyLogo(LOGO_CLEANTECH_DEFAULT);
    };
    window.addEventListener('logoChanged', handleLogo);
    return () => window.removeEventListener('logoChanged', handleLogo);
  }, []);

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
  // 2. 🎥 VÍDEOS DEMONSTRATIVOS (YOUTUBE SHORTS OFICIAIS)
  // =========================================================================
  const DEFAULT_VIDEOS = [
    "https://youtube.com/shorts/fixjCwf2FFY?feature=share",
    "https://youtube.com/shorts/s1BI9PJNkYo?feature=share",
    "https://youtube.com/shorts/sUPsu0DBjC0?feature=share",
    "https://youtube.com/shorts/BAv-ekdc5dI?feature=share",
    "https://youtube.com/shorts/Ba5_Fg5zC5k?feature=share",
    "https://youtube.com/shorts/EIw3bS5l-BI?feature=share",
    "https://youtube.com/shorts/LzwI-B6_3Gk?feature=share",
    "https://youtube.com/shorts/eizkMAlmmg4?feature=share",
    "https://youtube.com/shorts/NLkTf9sqtBU?feature=share",
    "https://youtube.com/shorts/RkWoJxATqyk?feature=share"
  ];

  const [videoUrlsText, setVideoUrlsText] = useState(() => {
    const saved = localStorage.getItem('lp_a260_video_urls');
    if (saved && !saved.includes('dQw4w9WgXcQ') && !saved.includes('drive.google.com')) {
      return saved;
    }
    return DEFAULT_VIDEOS.join('\n');
  });

  // Helper universal para vídeos: YouTube (Watch, Shorts, Embed), Google Drive ou MP4 direto
  const parseVideoEmbed = (url) => {
    if (!url) return null;
    const trimmed = url.trim();

    // 1. YouTube (watch?v=ID, youtu.be/ID, shorts/ID, embed/ID)
    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1&playsinline=1`;
    }

    // 2. Google Drive (drive.google.com/file/d/ID, docs.google.com/file/d/ID, open?id=ID, uc?id=ID, etc.)
    const driveMatch1 = trimmed.match(/(?:drive|docs)\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (driveMatch1 && driveMatch1[1]) {
      return `https://drive.google.com/file/d/${driveMatch1[1]}/preview`;
    }

    const driveMatch2 = trimmed.match(/(?:drive|docs)\.google\.com\/[a-zA-Z0-9_/?&=#%+-]*[?&]id=([a-zA-Z0-9_-]+)/i);
    if (driveMatch2 && driveMatch2[1]) {
      return `https://drive.google.com/file/d/${driveMatch2[1]}/preview`;
    }

    // 3. Fallback direto se for MP4/WebM
    if (trimmed.endsWith('.mp4') || trimmed.endsWith('.webm') || trimmed.includes('.mp4?') || trimmed.includes('.webm?')) {
      return trimmed;
    }

    return trimmed;
  };

  const [showAllVideos, setShowAllVideos] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  const videoTitles = [
    "Lavagem & Secagem de Alta Performance - Tennant A260",
    "Operação Contínua em Galpão Logístico",
    "Demonstração do Rodo Parabólico Linatex em Ação",
    "Manobrabilidade e Limpeza em Espaços Industriais",
    "Painel Intuitivo Touch e Sistema de 1 Botão",
    "Poder de Sucção: Piso 100% Seco sem Rastros",
    "Eficiência Operacional: Substitui até 5 Serventes",
    "Abastecimento e Esvaziamento Rápido dos Tanques",
    "Troca e Manutenção Simplificada da Escova",
    "Demonstração Completa da Tennant A260 em Operação"
  ];

  const videoList = useMemo(() => {
    const lines = videoUrlsText ? videoUrlsText.split('\n').map(u => u.trim()).filter(Boolean) : [];
    const sourceList = lines.length > 0 ? lines : DEFAULT_VIDEOS;
    return sourceList.map((link, idx) => ({
      id: idx,
      url: link,
      embedUrl: parseVideoEmbed(link),
      title: videoTitles[idx % videoTitles.length] || `Vídeo Demonstrativo #${idx + 1}`
    }));
  }, [videoUrlsText]);



  // =========================================================================
  // 🏷️ RASTREAMENTO & TAGS DE ANÚNCIOS (GOOGLE ADS & META PIXEL)
  // =========================================================================
  const [googleTagId, setGoogleTagId] = useState(localStorage.getItem('ads_google_tag_id') || '');
  const [googleConversionLabel, setGoogleConversionLabel] = useState(localStorage.getItem('ads_google_conversion_label') || '');
  const [metaPixelId, setMetaPixelId] = useState(localStorage.getItem('ads_meta_pixel_id') || '');

  // Sincroniza fotos, vídeos e tags remotas com a base de dados
  useEffect(() => {
    async function loadRemoteSettings() {
      try {
        const res = await fetch('/api/get-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            if (data.settings.lp_a260_video_urls) {
              setVideoUrlsText(data.settings.lp_a260_video_urls);
              localStorage.setItem('lp_a260_video_urls', data.settings.lp_a260_video_urls);
            }
            if (data.settings.lp_a260_photo_urls) {
              setPhotoUrlsText(data.settings.lp_a260_photo_urls);
              localStorage.setItem('lp_a260_photo_urls', data.settings.lp_a260_photo_urls);
            }
            if (data.settings.app_company_logo) {
              setCompanyLogo(data.settings.app_company_logo);
              localStorage.setItem('app_company_logo', data.settings.app_company_logo);
            }
            if (data.settings.ads_google_tag_id) {
              setGoogleTagId(data.settings.ads_google_tag_id);
              localStorage.setItem('ads_google_tag_id', data.settings.ads_google_tag_id);
            }
            if (data.settings.ads_google_conversion_label) {
              setGoogleConversionLabel(data.settings.ads_google_conversion_label);
              localStorage.setItem('ads_google_conversion_label', data.settings.ads_google_conversion_label);
            }
            if (data.settings.ads_meta_pixel_id) {
              setMetaPixelId(data.settings.ads_meta_pixel_id);
              localStorage.setItem('ads_meta_pixel_id', data.settings.ads_meta_pixel_id);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao buscar configurações remotas:', err);
      }
    }
    loadRemoteSettings();
  }, []);

  // Injeção da Tag do Google (gtag.js)
  useEffect(() => {
    if (googleTagId && !document.getElementById('google-tag-script')) {
      const s = document.createElement('script');
      s.id = 'google-tag-script';
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${googleTagId}`;
      document.head.appendChild(s);

      const inline = document.createElement('script');
      inline.id = 'google-tag-inline';
      inline.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${googleTagId}');
      `;
      document.head.appendChild(inline);
    }
  }, [googleTagId]);

  // Injeção do Meta Pixel (fbq)
  useEffect(() => {
    if (metaPixelId && !document.getElementById('meta-pixel-script')) {
      const s = document.createElement('script');
      s.id = 'meta-pixel-script';
      s.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${metaPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(s);
    }
  }, [metaPixelId]);

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % photoList.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + photoList.length) % photoList.length);
  };

  // Tabs de Conteúdo
  const [activeTab, setActiveTab] = useState('locacao');

  // ROI Calculator States
  const [selectedArea, setSelectedArea] = useState(3000); // m² padrão
  const [produtividadeManual, setProdutividadeManual] = useState(1200); // m²/dia por servente manual (padrão 1.200 m²)
  const [custoServenteOrganico, setCustoServenteOrganico] = useState(4200); // Custo médio por servente orgânico (salário + 100% encargos)
  const [openFaq, setOpenFaq] = useState(null);

  // ROI Math (Baseado na produtividade por servente vs. Tennant A260)
  const roiData = useMemo(() => {
    const area = Math.max(100, Number(selectedArea) || 3000);
    const prodServente = Math.max(400, Number(produtividadeManual) || 1200);
    const custoServente = Math.max(1000, Number(custoServenteOrganico) || 4200);

    // 1. Limpeza Manual Tradicional (sem máquina):
    // Quantidade de serventes calculada pela produtividade diária por servente
    const serventesSemMaquina = Math.max(1, Math.ceil(area / prodServente));
    const custoTotalManual = serventesSemMaquina * custoServente;
    const custoPorM2Manual = custoTotalManual / area;

    // 2. Com a Lavadora Tennant A260 (Mecanizada):
    // 1 operador com a A260 (2.000 m²/h) cobre com facilidade até 6.000 m² de piso por dia
    const prodA260Dia = 6000;
    const serventesComMaquina = Math.max(1, Math.ceil(area / prodA260Dia));
    const custoMaoDeObraComMaquina = serventesComMaquina * custoServente;
    const custoEquipamentoInterno = serventesComMaquina * 2000; // R$ 2.000/mês (Depreciação + Manutenção - embutido internamente no cálculo sem exposição aberta)
    const custoTotalComMaquina = custoMaoDeObraComMaquina + custoEquipamentoInterno;
    const custoPorM2ComMaquina = custoTotalComMaquina / area;

    // 3. Supressão de Serventes & Economia Gerada:
    const serventesPoupados = Math.max(0, serventesSemMaquina - serventesComMaquina);
    const economiaMensal = Math.max(0, custoTotalManual - custoTotalComMaquina);
    const economiaAnual = economiaMensal * 12;
    const percentualEconomia = custoTotalManual > 0 
      ? Math.max(0, Math.round(((custoTotalManual - custoTotalComMaquina) / custoTotalManual) * 100))
      : 0;
    const economiaPorM2 = Math.max(0, custoPorM2Manual - custoPorM2ComMaquina);

    // Tempo diário estimado
    const horasManualDia = (area / (serventesSemMaquina * (prodServente / 8))).toFixed(1);
    const horasComA260Dia = (area / 1600).toFixed(1);
    const ganhoVelocidade = Math.round(((horasManualDia - horasComA260Dia) / (horasManualDia || 1)) * 100);

    return {
      area,
      prodServente,
      prodA260Dia,
      custoServente,
      serventesSemMaquina,
      custoTotalManual,
      custoPorM2Manual,
      serventesComMaquina,
      custoTotalComMaquina,
      custoPorM2ComMaquina,
      economiaMensal,
      economiaAnual,
      percentualEconomia,
      economiaPorM2,
      serventesPoupados,
      horasManualDia,
      horasComA260Dia,
      ganhoVelocidade: Math.max(60, Math.min(85, ganhoVelocidade || 75))
    };
  }, [selectedArea, produtividadeManual, custoServenteOrganico]);

  // Função WhatsApp Direto com Disparo de Conversão Oficial
  const handleWhatsAppRedirect = (customMsg = null) => {
    // 1. Disparo de Conversão Google Ads
    try {
      if (typeof window.gtag === 'function' && googleTagId) {
        const sendTo = googleConversionLabel ? `${googleTagId}/${googleConversionLabel}` : googleTagId;
        window.gtag('event', 'conversion', {
          'send_to': sendTo,
          'event_category': 'WhatsApp',
          'event_label': customMsg || 'Contato WhatsApp Tennant A260'
        });
      }
    } catch (e) {
      console.warn('Google Ads tag conversion error:', e);
    }

    // 2. Disparo de Conversão Meta Pixel (Lead & Contact)
    try {
      if (typeof window.fbq === 'function' && metaPixelId) {
        window.fbq('track', 'Lead', {
          content_name: 'Tennant A260',
          content_category: 'Lavadora de Piso Industrial',
          value: 3890.00,
          currency: 'BRL'
        });
        window.fbq('track', 'Contact');
      }
    } catch (e) {
      console.warn('Meta Pixel lead event error:', e);
    }

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

  // =========================================================================
  // ⏳ CONTADOR REGRESSIVO DE PROMOÇÃO DE FEIRA (Sempre 7 dias restantes)
  // =========================================================================
  const [timeLeft, setTimeLeft] = useState(() => {
    let target = localStorage.getItem('lp_a260_promo_deadline');
    if (!target || parseInt(target, 10) < Date.now()) {
      target = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('lp_a260_promo_deadline', target.toString());
    }
    const diff = Math.max(0, parseInt(target, 10) - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60)
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      let target = localStorage.getItem('lp_a260_promo_deadline');
      if (!target || parseInt(target, 10) < Date.now()) {
        target = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem('lp_a260_promo_deadline', target.toString());
      }
      const diff = Math.max(0, parseInt(target, 10) - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#212529] font-sans antialiased w-full overflow-x-clip notranslate" translate="no">
      
      {/* ========================================================================= */}
      {/* 1. TOP BAR INSTITUCIONAL CONGELADA (NOTRANSLATE ANTI-TRADUTOR SAFARI/CHROME)*/}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#007481] text-white shadow-[0_8px_25px_-4px_rgba(0,0,0,0.18),0_4px_10px_-2px_rgba(0,0,0,0.1)] border-b border-[#005f6b]/35 w-full notranslate" translate="no">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 sm:h-22 md:h-24 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* LADO ESQUERDO: Logotipo Oficial Clean Tech Pro + Destaque no Desktop */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0 notranslate" translate="no">
            <img 
              src={companyLogo || LOGO_CLEANTECH_DEFAULT} 
              alt="Clean Tech Pro" 
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto max-h-[50px] sm:max-h-[60px] md:max-h-[70px] object-contain shrink-0 drop-shadow-xs" 
            />

            {/* Destaque no Header Desktop (Idêntico ao print aprovado) */}
            <div className="hidden md:flex flex-col justify-center text-left pl-3.5 lg:pl-5 border-l-2 border-teal-300/40 leading-snug shrink-0 notranslate" translate="no">
              <span className="font-extrabold text-white text-xs sm:text-sm lg:text-base tracking-wide">
                Representante & Assistência Técnica Autorizada Tennant
              </span>
              <span className="text-[11px] sm:text-xs text-teal-200 font-semibold tracking-normal">
                Curitiba & Região Metropolitana • Paraná
              </span>
            </div>
          </div>

          {/* LADO DIREITO: Timer + Ações */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0 notranslate" translate="no">
            
            {/* E-mail (Desktop XL) */}
            <a 
              href={`mailto:${EMAIL_CONTATO}`}
              className="hidden 2xl:flex items-center gap-2 text-teal-100 hover:text-white transition-colors text-xs font-medium shrink-0"
            >
              <Mail className="w-4 h-4 text-teal-200" />
              <span>{EMAIL_CONTATO}</span>
            </a>

            {/* Contador Regressivo Promocional (Visível no Mobile e Desktop) */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-full text-[11px] sm:text-xs md:text-sm font-mono border border-teal-300/30 text-teal-50 shrink-0 shadow-inner">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
              <span className="font-bold text-white">{String(timeLeft.days).padStart(2, '0')}d</span>
              <span className="text-teal-300/40">:</span>
              <span className="font-bold text-white">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span className="text-teal-300/40">:</span>
              <span className="font-bold text-white">{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span className="text-teal-300/40">:</span>
              <span className="font-black text-amber-300">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>

            {/* Desktop CTA: Botão WhatsApp Oficial com Número Formatado */}
            <div className="hidden sm:block shrink-0">
              <button
                onClick={() => handleWhatsAppRedirect("Olá! Gostaria de aproveitar a CONDIÇÃO ESPECIAL DE FEIRA da Tennant A260.")}
                className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-full font-bold shadow-md transition-all text-xs md:text-sm shrink-0 whitespace-nowrap cursor-pointer hover:shadow-lg"
              >
                <WhatsAppIcon className="w-4 h-4 md:w-5 md:h-5 text-white shrink-0" />
                <span>{WHATSAPP_DISPLAY}</span>
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. PRODUCT DISPLAY (HERO PDP)                                             */}
      {/* ========================================================================= */}
      <section id="hero-pdp" className="pt-28 sm:pt-32 md:pt-36 lg:pt-40 pb-6 sm:pb-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* DESTAQUE OFICIAL NO MOBILE (ABAIXO DO MENU E ACIMA DA FOTO DA MÁQUINA) */}
          <div className="md:hidden mb-4 text-center notranslate" translate="no">
            <div className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-50 via-sky-50 to-teal-50/60 border border-[#007481]/30 px-3.5 py-2 rounded-xl shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#007481] shrink-0" />
              <div className="text-[11px] sm:text-xs font-black text-gray-900 tracking-tight leading-tight">
                <span className="text-gray-800 font-bold">Representante & Assistência Técnica</span>{' '}
                <span className="text-[#007481] font-black underline decoration-teal-400">Autorizada Tennant</span>{' '}
                <span className="text-teal-800 font-bold">• PR</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            
            {/* LEFT COLUMN: FOTO GRANDE COM SELO DE FEIRA E CONTROLES DIRETOS */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Foto Principal com Selo de Promoção de Feira e Navegação Integrada */}
              <div className="relative bg-white flex flex-col items-center justify-center pt-8 pb-6 px-4 min-h-[360px] sm:min-h-[480px] group select-none rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                
                {/* Badge Oficial Promoção de Feira Piscante */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 pointer-events-none select-none">
                  <div className="bg-gradient-to-r from-red-600 via-orange-600 to-[#eb6420] text-white font-black text-xs uppercase px-3.5 sm:px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white tracking-wider animate-pulse">
                    <span>🔥</span>
                    <span>Promoção de Feira</span>
                  </div>
                </div>

                <img 
                  src={photoList[activePhotoIndex] || DEFAULT_PHOTOS[0]} 
                  alt="A260 Lavadora de piso de operação a pé" 
                  className="max-h-[280px] sm:max-h-[440px] w-auto object-contain transition-opacity duration-300 mt-6 sm:mt-2"
                />

                {/* Seta Esquerda na Foto */}
                {photoList.length > 1 && (
                  <button
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 w-9 h-9 sm:w-12 sm:h-12 rounded-full shadow-md flex items-center justify-center transition-all cursor-pointer border border-gray-100"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
                  </button>
                )}

                {/* Seta Direita na Foto */}
                {photoList.length > 1 && (
                  <button
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 w-9 h-9 sm:w-12 sm:h-12 rounded-full shadow-md flex items-center justify-center transition-all cursor-pointer border border-gray-100"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
                  </button>
                )}

                {/* Indicadores de Pontos (Dots) na Base da Foto */}
                {photoList.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-full">
                    {photoList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`transition-all rounded-full cursor-pointer ${
                          activePhotoIndex === idx
                            ? 'w-5 sm:w-6 h-2 bg-white'
                            : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`Ver foto ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: HEADLINE ELEGANTE + NOME DA MÁQUINA + ESPECIFICAÇÕES + BOTÃO */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-5 pt-1">
              
              {/* Headline Comercial Limpa e de Alto Impacto com cores em destaque */}
              <div className="space-y-2 pb-1">
                <div className="flex items-center gap-1.5 text-[#eb6420] text-xs font-black uppercase tracking-wider">
                  <span>★ A Lavadora Mais Vendida da Tennant</span>
                  <span>•</span>
                  <span>Líder Global</span>
                </div>
                <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  Máxima eficiência na limpeza de pisos: substitua até <span className="text-[#007481] font-black">4 auxiliares de limpeza</span> e reduza em até <span className="text-[#eb6420] font-black">60% os custos</span> com a lavadora mais vendida da Tennant.
                </h1>
                <p className="text-gray-700 text-xs sm:text-base leading-relaxed pt-1">
                  A <strong className="text-gray-900">Tennant A-260</strong> limpa até <strong className="text-[#007481]">2.000 m²/h</strong> com operação ultra simples de 1 botão, baixo ruído (69 dBA) e secagem imediata.
                </p>
              </div>

              {/* Nome da Máquina e Categoria Oficial */}
              <div>
                <h2 className="text-2xl sm:text-4xl font-bold text-[#212529] tracking-tight">
                  A260
                </h2>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mt-0.5">
                  Lavadora de piso de operação a pé
                </h3>
              </div>

              {/* Botão Oficial Laranja Tennant Arredondado (Pill Button / Rounded Full) */}
              <div className="pt-2 sm:pt-3">
                <button
                  onClick={() => handleWhatsAppRedirect("Olá! Gostaria de SOLICITAR DEMONSTRAÇÃO / COTAÇÃO para a Lavadora Tennant A260.")}
                  className="w-full sm:w-auto bg-[#eb6420] hover:bg-[#d65715] text-white font-black text-xs sm:text-sm tracking-wider uppercase px-6 sm:px-10 py-3.5 sm:py-4 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center justify-center text-center"
                >
                  SOLICITAR DEMONSTRAÇÃO / COTAÇÃO
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DOBRA 2: COMPARATIVO DE PRODUTIVIDADE HUMANO VS. TENNANT A260 (PREMIUM) */}
      {/* ========================================================================= */}
      <section className="py-10 sm:py-14 bg-gradient-to-b from-gray-50 to-white border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
          
          {/* Header da Seção */}
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#007481] bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              ⚡ Eficiência Comprovada em Números
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Produtividade Comparada: <span className="text-[#007481]">Tennant A260</span> vs. <span className="text-gray-500">Limpeza Manual</span>
            </h2>
            <p className="text-xs sm:text-base text-gray-600">
              Entenda como 1 operador com a Tennant A260 entrega o mesmo rendimento de até 4 auxiliares de limpeza com padrão profissional e piso seco instantaneamente.
            </p>
          </div>

          {/* Destaque Visual 1 vs 1 (Cards Comparativos de Alto Impacto Alinhados com a Tabela) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full">
            
            {/* Card Limpeza Manual */}
            <div className="bg-white border-2 border-red-100 rounded-2xl p-5 sm:p-8 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-100 text-red-700 text-[9px] sm:text-[10px] font-black uppercase px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-bl-lg">
                Método Tradicional
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-base sm:text-lg">
                    🪣
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Limpeza Manual (Mop & Balde)</h3>
                    <p className="text-xs text-gray-500">1 Auxiliar de Limpeza</p>
                  </div>
                </div>

                <div className="space-y-2.5 sm:space-y-3 py-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100">
                    <span className="text-gray-600">Rendimento Médio:</span>
                    <span className="font-bold text-gray-900">~280 m²/hora</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100">
                    <span className="text-gray-600">Tempo para 2.000 m²:</span>
                    <span className="font-bold text-red-600">Mais de 7 Horas (ou 4 pessoas)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100">
                    <span className="text-gray-600">Secagem do Piso:</span>
                    <span className="font-bold text-gray-700">30 a 45 min molhado</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100">
                    <span className="text-gray-600">Qualidade da Água:</span>
                    <span className="text-gray-700">Espalha água suja do balde</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-red-100 text-xs font-semibold text-red-700 flex items-center gap-1.5">
                <span>✕ Alto custo com encargos, faltas e esforço repetitivo</span>
              </div>
            </div>

            {/* Card Tennant A260 */}
            <div className="bg-white border-2 border-teal-500 rounded-2xl p-5 sm:p-8 shadow-md flex flex-col justify-between relative overflow-hidden ring-4 ring-teal-50">
              <div className="absolute top-0 right-0 bg-[#007481] text-white text-[9px] sm:text-[10px] font-black uppercase px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-bl-lg">
                ⚡ Alta Performance
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-50 text-[#007481] flex items-center justify-center font-black text-base sm:text-lg">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">Lavadora Tennant A260</h3>
                    <p className="text-xs font-semibold text-[#007481]">1 Único Operador</p>
                  </div>
                </div>

                <div className="space-y-2.5 sm:space-y-3 py-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100">
                    <span className="text-gray-600">Rendimento Efetivo:</span>
                    <span className="font-black text-[#007481] text-sm sm:text-base font-mono">Até 2.000 m²/hora</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100">
                    <span className="text-gray-600">Tempo para 2.000 m²:</span>
                    <span className="font-bold text-emerald-700">Apenas 1 Hora (7x mais rápido)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100">
                    <span className="text-gray-600">Secagem do Piso:</span>
                    <span className="font-bold text-emerald-700">Seco Instantaneamente</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-gray-100">
                    <span className="text-gray-600">Qualidade da Água:</span>
                    <span className="text-gray-700">Água limpa contínua e sucção total</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-teal-100 text-xs font-bold text-[#007481] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Economia de até 60% na folha e zero risco de quedas</span>
              </div>
            </div>

          </div>

          {/* Tabela Executiva Comparativa Detalhada com Suporte Touch/Mobile */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-gray-100 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-gray-900 text-xs sm:text-base">Quadro Comparativo de Especificações & Benefícios</h3>
              <span className="text-[10px] sm:text-xs font-semibold text-gray-500">Padrão Técnico Industrial Tennant</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm min-w-[550px]">
                <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-[10px] sm:text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="px-4 sm:px-6 py-3">Indicador</th>
                    <th className="px-4 sm:px-6 py-3 text-[#007481]">Tennant A260</th>
                    <th className="px-4 sm:px-6 py-3 text-gray-600">Limpeza Humana Manual</th>
                    <th className="px-4 sm:px-6 py-3 text-emerald-700">Ganho Real para Sua Empresa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 font-bold text-gray-900">Produtividade por Hora</td>
                    <td className="px-4 sm:px-6 py-3.5 font-mono font-bold text-[#007481]">Até 2.000 m²/h</td>
                    <td className="px-4 sm:px-6 py-3.5 text-gray-600">~280 m²/h por pessoa</td>
                    <td className="px-4 sm:px-6 py-3.5 font-semibold text-emerald-700">⚡ 7x mais veloz (economiza 6h diárias)</td>
                  </tr>
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 font-bold text-gray-900">Secagem do Piso</td>
                    <td className="px-4 sm:px-6 py-3.5 font-semibold text-[#007481]">Secagem Imediata (Rodo Parabólico)</td>
                    <td className="px-4 sm:px-6 py-3.5 text-gray-600">Piso molhado por 30-45 min</td>
                    <td className="px-4 sm:px-6 py-3.5 font-semibold text-emerald-700">Zero interdição e risco zero de quedas de clientes</td>
                  </tr>
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 font-bold text-gray-900">Capacidade dos Tanques</td>
                    <td className="px-4 sm:px-6 py-3.5 font-mono font-semibold text-gray-800">45L (Água Limpa / Solução) / 45L (Recuperação)</td>
                    <td className="px-4 sm:px-6 py-3.5 text-gray-600">Balde de 10L a 15L</td>
                    <td className="px-4 sm:px-6 py-3.5 text-gray-700">Autonomia prolongada de 45L sem idas e vindas para troca de água</td>
                  </tr>
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 font-bold text-gray-900">Nível de Ruído & Turnos</td>
                    <td className="px-4 sm:px-6 py-3.5 font-mono font-semibold text-emerald-700">69 dBA (Ultra Silenciosa)</td>
                    <td className="px-4 sm:px-6 py-3.5 text-gray-600">Ruído e movimentação intensa</td>
                    <td className="px-4 sm:px-6 py-3.5 text-gray-700">Limpeza em horário comercial sem incomodar público/pacientes</td>
                  </tr>
                  <tr className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5 font-bold text-gray-900">Alimentação & Segurança</td>
                    <td className="px-4 sm:px-6 py-3.5 font-mono font-semibold text-[#eb6420]">Bateria (100% sem cabo)</td>
                    <td className="px-4 sm:px-6 py-3.5 text-gray-600">Esforço físico repetitivo</td>
                    <td className="px-4 sm:px-6 py-3.5 text-gray-700">Total ergonomia e sem risco de tropeços de pedestres</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-[10px] text-gray-400 text-center py-1 sm:hidden bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1">
              👉 Deslize para o lado para ver todos os dados da tabela
            </div>
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
      {/* 💰 CALCULADORA INTERATIVA DE ROI & ECONOMIA DE MÃO DE OBRA                */}
      {/* ========================================================================= */}
      <section id="calculadora-roi" className="py-10 sm:py-16 bg-white border-b border-gray-200 w-full notranslate" translate="no">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 w-full">
          
          {/* Header da Calculadora */}
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#007481] bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
              📊 Simulador Financeiro de Viabilidade & ROI
            </span>
            <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              Compare os Custos: <span className="text-red-600">Limpeza Manual</span> vs. <span className="text-[#007481]">Tennant A260</span>
            </h2>
            <p className="text-xs sm:text-base text-gray-600 leading-relaxed">
              Veja a redução real de custo mensal e por m² ao substituir equipes manuais por 1 lavadora automática de alto rendimento.
            </p>
          </div>

          {/* Controle de Área Interativo */}
          <div className="bg-gradient-to-br from-teal-50/70 via-white to-gray-50 border-2 border-teal-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs sm:text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                  <span>📏 Qual o tamanho da área total do seu piso a ser limpa diariamente?</span>
                </label>
                <span className="text-[11px] text-gray-500 block">
                  Base de cálculo: Custo médio por servente próprio/orgânico de <strong>R$ 4.200,00/mês</strong> (salário + 100% encargos, benefícios e EPIs).
                </span>
              </div>
              
              {/* Badge com Valor Selecionado */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="font-mono text-base sm:text-xl font-black text-[#007481] bg-white px-4 py-1.5 rounded-xl border-2 border-[#007481]/30 shadow-xs">
                  {selectedArea.toLocaleString('pt-BR')} m²
                </span>
              </div>
            </div>

            {/* Slider de Área */}
            <div className="space-y-2 pt-1">
              <input 
                type="range" min="500" max="12000" step="250" value={selectedArea}
                onChange={(e) => setSelectedArea(Number(e.target.value))}
                className="w-full accent-[#007481] cursor-pointer h-2.5 bg-gray-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 font-semibold">
                <span>500 m² (Pequeno)</span>
                <span>3.000 m² (Médio)</span>
                <span>6.000 m² (Grande)</span>
                <span>12.000 m² (Centro Logístico)</span>
              </div>
            </div>

            {/* Botões Rápidos de Metragem (Presets) - Visíveis apenas em telas maiores para manter mobile super limpo */}
            <div className="hidden sm:flex pt-2 flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-gray-500">Atalhos Rápidos:</span>
              {[
                { label: '1.500 m² (Supermercado / Loja)', value: 1500 },
                { label: '3.000 m² (Galpão / Logística)', value: 3000 },
                { label: '5.000 m² (Indústria / Fábrica)', value: 5000 },
                { label: '8.000 m² (Centro de Distribuição)', value: 8000 }
              ].map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setSelectedArea(preset.value)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer border ${
                    selectedArea === preset.value
                      ? 'bg-[#007481] text-white border-[#007481] shadow-xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#007481] hover:text-[#007481]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Controle 2: Produtividade por Servente Manual */}
            <div className="pt-3 border-t border-gray-200/70 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
                    <span>⚡ Produtividade Média da Limpeza Manual por Servente:</span>
                  </label>
                  <span className="text-[11px] text-gray-500 block">
                    Em média, 1 servente limpa cerca de <strong>1.000 a 1.500 m²/dia</strong> com mop/rodo em turno integral.
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs sm:text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-lg border border-gray-300 shadow-xs">
                    {produtividadeManual.toLocaleString('pt-BR')} m²/dia por pessoa
                  </span>
                </div>
              </div>

              <input 
                type="range" min="800" max="1800" step="100" value={produtividadeManual}
                onChange={(e) => setProdutividadeManual(Number(e.target.value))}
                className="w-full accent-gray-700 cursor-pointer h-2 bg-gray-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 font-medium">
                <span>800 m²/dia (Piso Muito Sujo)</span>
                <span>1.200 m²/dia (Padrão de Mercado)</span>
                <span>1.800 m²/dia (Limpeza Leve)</span>
              </div>
            </div>

          </div>

          {/* Comparativo Lado a Lado de Custos (Antes vs Depois) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* CARD 1: CENÁRIO MANUAL (SEM MÁQUINA) */}
            <div className="lg:col-span-6 bg-white border-2 border-red-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-red-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
                    <h3 className="text-sm sm:text-base font-black text-red-950 uppercase tracking-wide">
                      Limpeza Manual Tradicional (Mop / Rodo)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
                    Cenário Atual
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center bg-red-50/50 p-2.5 rounded-xl text-xs sm:text-sm">
                    <span className="text-gray-700 font-medium">⚡ Produtividade por Pessoa:</span>
                    <span className="font-bold text-gray-900 font-mono">
                      {roiData.prodServente.toLocaleString('pt-BR')} m²/dia
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-red-50/50 p-2.5 rounded-xl text-xs sm:text-sm">
                    <span className="text-gray-700 font-medium">👥 Serventes Necessários:</span>
                    <span className="font-bold text-red-700 font-mono">
                      {roiData.serventesSemMaquina} {roiData.serventesSemMaquina === 1 ? 'servente' : 'serventes'}
                      <span className="text-[10px] text-gray-500 font-normal ml-1">({selectedArea}m² ÷ {roiData.prodServente}m²)</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-red-50/50 p-2.5 rounded-xl text-xs sm:text-sm">
                    <span className="text-gray-700 font-medium">💼 Custo por Servente (Orgânico):</span>
                    <span className="font-semibold text-gray-900 font-mono">
                      R$ {roiData.custoServente.toLocaleString('pt-BR')},00 / mês
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-red-100/60 p-3 rounded-xl">
                    <span className="text-xs sm:text-sm font-bold text-red-950">💸 Custo Total Mensal:</span>
                    <span className="font-mono text-base sm:text-xl font-black text-red-700">
                      R$ {roiData.custoTotalManual.toLocaleString('pt-BR')},00
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl text-xs sm:text-sm border border-gray-200">
                    <span className="text-gray-700 font-bold">📐 Custo Médio por m² de Piso:</span>
                    <span className="font-mono font-black text-gray-900 text-sm sm:text-base">
                      R$ {roiData.custoPorM2Manual.toFixed(2).replace('.', ',')} / m²
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-600 space-y-1">
                  <div className="flex items-center gap-1.5 text-red-700 font-semibold">
                    <span>⚠️ Piso molhado por horas com risco de acidentes</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-red-700 font-semibold">
                    <span>⚠️ Esforço físico repetitivo, faltas e atestados</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <span>• Rendimento médio manual: ~1.200 m²/dia por pessoa</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: CENÁRIO COM TENNANT A260 (CLEAN TECH) */}
            <div className="lg:col-span-6 bg-gradient-to-br from-[#007481] via-[#005a64] to-[#00424a] text-white border-2 border-teal-400/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-teal-300/30 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
                    <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                      Com Lavadora Tennant A260 (Clean Tech)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/40">
                    Alta Eficiência
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center bg-white/10 p-2.5 rounded-xl text-xs sm:text-sm">
                    <span className="text-teal-100 font-medium">⚡ Produtividade da Tennant A260:</span>
                    <span className="font-bold text-white font-mono">
                      2.000 m²/h (até 6.000 m²/dia)
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white/10 p-2.5 rounded-xl text-xs sm:text-sm">
                    <span className="text-teal-100 font-medium">👤 Equipe Necessária com Máquina:</span>
                    <span className="font-bold text-emerald-300 font-mono">
                      {roiData.serventesComMaquina} {roiData.serventesComMaquina === 1 ? 'operador' : 'operadores'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white/10 p-2.5 rounded-xl text-xs sm:text-sm">
                    <span className="text-teal-100 font-medium">🚀 Supressão de Mão de Obra:</span>
                    <span className="font-bold text-amber-300 font-mono">
                      {roiData.serventesPoupados > 0 ? `-${roiData.serventesPoupados} ${roiData.serventesPoupados === 1 ? 'servente' : 'serventes'}` : 'Equipe otimizada'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-emerald-950/40 border border-emerald-400/30 p-3 rounded-xl">
                    <span className="text-xs sm:text-sm font-bold text-teal-100">💰 Custo Operacional Mensal Total:</span>
                    <span className="font-mono text-base sm:text-xl font-black text-emerald-300">
                      R$ {roiData.custoTotalComMaquina.toLocaleString('pt-BR')},00
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white/15 p-2.5 rounded-xl text-xs sm:text-sm border border-white/20">
                    <span className="text-teal-100 font-bold">📐 Custo Médio por m² de Piso:</span>
                    <span className="font-mono font-black text-white text-sm sm:text-base">
                      R$ {roiData.custoPorM2ComMaquina.toFixed(2).replace('.', ',')} / m²
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-teal-400/30 text-[11px] text-teal-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <span>✓ Piso 100% lavado e seco instantaneamente</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <span>✓ Redução de custo por m² de R$ {roiData.custoPorM2Manual.toFixed(2).replace('.', ',')} para R$ {roiData.custoPorM2ComMaquina.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-teal-200">
                    <span>• Rendimento da A260: até 2.000 m²/h (cobre até 6.000 m²/dia por turno)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* CARD RESUMO EXECUTIVO: ECONOMIA E BOTÃO DE VALIDAÇÃO */}
          <div className="bg-gradient-to-r from-[#003d44] via-[#005761] to-[#007481] text-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-teal-300/30 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-gray-900 font-black text-xs px-2.5 py-0.5 rounded uppercase">
                  Resultado Financeiro
                </span>
                <span className="text-xs text-teal-200">
                  Economia gerada pela supressão de serventes:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-white/10 p-3.5 rounded-xl border border-white/20">
                  <span className="text-[11px] text-teal-100 block">Economia Mensal em Folha:</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                    R$ {roiData.economiaMensal.toLocaleString('pt-BR')}
                    <span className="text-xs text-teal-200 font-normal"> / mês</span>
                  </div>
                  <span className="text-[10px] text-teal-200 block mt-0.5">
                    Redução de até {roiData.percentualEconomia}% no custo de mão de obra
                  </span>
                </div>

                <div className="bg-white/10 p-3.5 rounded-xl border border-white/20">
                  <span className="text-[11px] text-teal-100 block">Economia Anual (12 Meses):</span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                    R$ {roiData.economiaAnual.toLocaleString('pt-BR')}
                    <span className="text-xs text-teal-200 font-normal"> / ano</span>
                  </div>
                  <span className="text-[10px] text-teal-200 block mt-0.5">
                    Custo por m² cai de R$ {roiData.custoPorM2Manual.toFixed(2).replace('.', ',')} para R$ {roiData.custoPorM2ComMaquina.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {roiData.serventesPoupados > 0 && (
                <p className="text-xs text-teal-100 leading-relaxed pt-1">
                  💡 Sua empresa suprime <strong>{roiData.serventesPoupados} {roiData.serventesPoupados === 1 ? 'servente' : 'serventes'}</strong> da rotina pesada de limpeza, gerando economia imediata no custo por m² de piso.
                </p>
              )}
            </div>

            <div className="lg:col-span-5 flex flex-col justify-center space-y-2.5">
              <button
                onClick={() => handleWhatsAppRedirect(`Olá! Simulei na Calculadora de ROI uma área de ${selectedArea}m² (Custo manual de R$ ${roiData.custoTotalManual.toLocaleString('pt-BR')}/mês com ${roiData.serventesSemMaquina} serventes vs Tennant A260 R$ ${roiData.custoTotalComMaquina.toLocaleString('pt-BR')}/mês com ${roiData.serventesComMaquina} operador). Gostaria de validar minha economia de R$ ${roiData.economiaMensal.toLocaleString('pt-BR')}/mês.`)}
                className="w-full py-4 px-6 bg-[#eb6420] hover:bg-[#d65715] active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-lg hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
              >
                <WhatsAppIcon className="w-5 h-5 text-white shrink-0" />
                <span>Validar Estudo no WhatsApp</span>
              </button>
              <span className="text-[11px] text-teal-200 text-center block">
                Atendimento rápido com consultores especializados em Curitiba e Região.
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🚀 CTA INTERMEDIÁRIO: MEIO DA PÁGINA (ALTO IMPACTO)                       */}
      {/* ========================================================================= */}
      <section className="py-12 bg-gradient-to-r from-[#007481] via-[#005e69] to-[#004750] text-white shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300 bg-black/20 px-3 py-1 rounded-full border border-amber-300/30">
                ⚡ Demonstração Gratuita no Seu Estabelecimento
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Veja a Tennant A260 em Ação no Seu Piso Real
              </h3>
              <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
                Levamos a máquina até sua empresa em Curitiba e Região Metropolitana. Teste o rendimento de 2.000 m²/h e a secagem imediata sem custo ou compromisso.
              </p>
            </div>

            <div className="shrink-0">
              <button
                onClick={() => handleWhatsAppRedirect("Olá! Gostaria de agendar uma DEMONSTRAÇÃO PRÁTICA da Tennant A260 no meu espaço.")}
                className="w-full sm:w-auto bg-[#eb6420] hover:bg-[#d65715] text-white font-black text-xs sm:text-sm uppercase tracking-wider px-8 sm:px-10 py-4 rounded-full shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer flex items-center justify-center gap-3"
              >
                <WhatsAppIcon className="w-5 h-5 text-white" />
                <span>Agendar Demonstração no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DOBRA 3: DIFERENCIAIS OPERACIONAIS (POR QUE ESCOLHER A TENNANT A260?)   */}
      {/* ========================================================================= */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header da Seção */}
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#eb6420] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              ★ Engenharia de Alta Confiabilidade
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Diferenciais Operacionais: <span className="text-[#007481]">Por Que Escolher a A260?</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Projetada pela Tennant para simplificar a rotina da sua equipe, reduzir custos de manutenção e garantir pisos secos e higienizados na primeira passada.
            </p>
          </div>

          {/* Grid de 4 Diferenciais Premium */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Diferencial 1: One-Touch */}
            <div className="bg-gradient-to-b from-gray-50 to-white border-2 border-gray-100 hover:border-[#007481] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#007481] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Power className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#007481] block">
                  Simplicidade Absoluta
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  Operação "One-Touch" (Start/Stop)
                </h3>
                <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                  Painel simplificado com acionamento em <strong>um único botão</strong> e indicador de bateria em LED. Reduz o tempo de treinamento do operador a poucos minutos.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-teal-700">
                <span>Treinamento Rápido</span>
                <Check className="w-4 h-4 text-[#007481]" />
              </div>
            </div>

            {/* Diferencial 2: Lâminas Linatex */}
            <div className="bg-gradient-to-b from-gray-50 to-white border-2 border-gray-100 hover:border-[#007481] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#007481] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Droplet className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#007481] block">
                  Secagem Imediata
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  Lâminas Linatex® de Alta Performance
                </h3>
                <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                  Rodo parabólico de <strong>772 mm com borracha de 4 lados</strong> de uso. Recolhe 100% da água na primeira passada, liberando o piso imediatamente para o tráfego.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-teal-700">
                <span>Zero Risco de Quedas</span>
                <Check className="w-4 h-4 text-[#007481]" />
              </div>
            </div>

            {/* Diferencial 3: Pontos Amarelos */}
            <div className="bg-gradient-to-b from-gray-50 to-white border-2 border-gray-100 hover:border-[#eb6420] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#eb6420] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#eb6420] block">
                  Manutenção Sem Ferramentas
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  Pontos Amarelos (Yellow Touch Points)
                </h3>
                <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                  Pontos de toque e checagem <strong>codificados em amarelo</strong> para rápida inspeção diária, aumentando a vida útil do equipamento e eliminando paradas desnecessárias.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-[#eb6420]">
                <span>Zero Ferramentas</span>
                <Check className="w-4 h-4 text-[#eb6420]" />
              </div>
            </div>

            {/* Diferencial 4: Protetor Anti-Respingo */}
            <div className="bg-gradient-to-b from-gray-50 to-white border-2 border-gray-100 hover:border-[#007481] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#007481] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#007481] block">
                  Proteção de Patrimônio
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  Protetor Anti-Respingo Inteligente
                </h3>
                <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                  Mantém a solução química e a água <strong>100% concentradas na área de escovação</strong>, evitando respingos em rodapés, gôndolas, móveis e vitrines.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-teal-700">
                <span>Protege Móveis & Paredes</span>
                <Check className="w-4 h-4 text-[#007481]" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SEÇÃO DE VÍDEOS & PRINTS DE DEPOIMENTOS DE CLIENTES (MOBILE & DESKTOP) */}
      {/* ========================================================================= */}
      <section id="videos-depoimentos" className="py-10 sm:py-14 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* BLOCO 1: VÍDEOS DEMONSTRATIVOS */}
          <div>
            <div className="mb-6">
              <span className="text-[#007481] text-xs font-bold uppercase tracking-wider">Demonstrações em Vídeo</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-0.5">Vídeos da Lavadora Tennant A260</h2>
            </div>

            {videoList.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-3 shadow-xs">
                <Video className="w-12 h-12 text-[#007481] mx-auto stroke-1" />
                <h3 className="font-bold text-gray-900 text-base">Vídeos Demonstrativos Oficiais (YouTube)</h3>
                <p className="text-xs text-gray-500">
                  Os vídeos de demonstração da Tennant A260 em operação são carregados diretamente dos links do YouTube cadastrados no painel.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Gostaria de receber os vídeos de demonstração da Tennant A260 no meu WhatsApp.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 text-white" />
                  <span>Solicitar Vídeos no WhatsApp</span>
                </a>
              </div>
            ) : (
              /* Grid de Players de Vídeo no Formato Vertical (2 colunas no celular, 4 no desktop) */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {(showAllVideos ? videoList : videoList.slice(0, 8)).map((vid) => (
                  <div 
                    key={vid.id} 
                    className="bg-white border border-gray-200 hover:border-[#007481] rounded-xl sm:rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="aspect-[9/16] bg-black w-full relative overflow-hidden flex items-center justify-center">
                        {vid.embedUrl && (vid.embedUrl.includes('drive.google.com') || vid.embedUrl.includes('docs.google.com') || vid.embedUrl.includes('youtube') || vid.embedUrl.includes('/preview') || vid.embedUrl.includes('/embed/')) ? (
                          <iframe
                            src={vid.embedUrl}
                            title={vid.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading="lazy"
                            className="w-full h-full border-0 absolute inset-0 pointer-events-auto"
                          ></iframe>
                        ) : vid.url.endsWith('.mp4') || vid.url.endsWith('.webm') ? (
                          <video
                            src={vid.url}
                            controls
                            playsInline
                            className="w-full h-full object-cover absolute inset-0"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white p-2 text-center absolute inset-0 cursor-pointer" onClick={() => setActiveVideoModal(vid)}>
                            <Play className="w-10 h-10 text-[#eb6420] mb-2 drop-shadow-md" />
                            <span className="text-[11px] font-bold text-teal-200">Clique para Assistir</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 sm:p-3 bg-white border-t border-gray-100 flex items-center justify-between gap-1">
                        <h3 className="font-bold text-gray-900 text-[11px] sm:text-xs line-clamp-2 leading-tight">{vid.title}</h3>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveVideoModal(vid); }}
                          className="text-[10px] bg-teal-50 text-[#007481] px-2 py-1 rounded font-bold hover:bg-teal-100 shrink-0 cursor-pointer"
                        >
                          ▶ Expandir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botão de Ver Mais / Menos se houver mais de 8 vídeos */}
            {videoList.length > 8 && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowAllVideos(!showAllVideos)}
                  className="bg-white hover:bg-teal-50 text-[#007481] border-2 border-[#007481] px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow cursor-pointer inline-flex items-center gap-2"
                >
                  <span>{showAllVideos ? '▲ Mostrar Menos Vídeos' : `▼ Ver Todos os Vídeos de Demonstração (${videoList.length} vídeos)`}</span>
                </button>
              </div>
            )}

            {/* MODAL FULLSCREEN DE VÍDEO (SEM SAIR DA PÁGINA) */}
            {activeVideoModal && (
              <div 
                className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
                onClick={() => setActiveVideoModal(null)}
              >
                <div 
                  className="bg-black border border-white/20 rounded-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Topo do Modal */}
                  <div className="p-3 bg-[#007481] text-white flex items-center justify-between text-xs sm:text-sm font-bold">
                    <span className="truncate pr-4">{activeVideoModal.title}</span>
                    <button
                      onClick={() => setActiveVideoModal(null)}
                      className="bg-black/40 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center font-black cursor-pointer shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Player do Vídeo */}
                  <div className="aspect-[9/16] sm:aspect-video w-full bg-black flex items-center justify-center">
                    {activeVideoModal.embedUrl ? (
                      <iframe
                        src={activeVideoModal.embedUrl}
                        title={activeVideoModal.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full border-0"
                      ></iframe>
                    ) : (
                      <video
                        src={activeVideoModal.url}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DOBRA 5: MODELOS DE NEGÓCIO / FORMAS DE AQUISIÇÃO                      */}
      {/* ========================================================================= */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Header da Seção */}
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Formas de Aquisição: <span className="text-[#007481]">Locação ou Venda Direta</span>
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Escolha a modalidade ideal para a realidade da sua empresa: locação com redução de CAPEX ou venda direta de fábrica com garantia oficial.
            </p>
          </div>

          {/* Grid dos 2 Modelos Principais com Largura Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
            
            {/* Opção 1: Locação / Outsourcing */}
            <div className="bg-white border-2 border-[#eb6420] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-md flex flex-col justify-between relative overflow-hidden ring-4 ring-orange-50/50">
              
              <div>
                {/* Badge no Topo Sem Sobrepor */}
                <div className="mb-4 inline-flex items-center gap-1.5 self-start bg-[#eb6420] text-white text-[11px] font-black uppercase px-3.5 py-1 rounded-full shadow-xs tracking-wider">
                  ★ Mais Escolhido por Empresas
                </div>
                
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-100 text-[#eb6420] flex items-center justify-center font-black shrink-0">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Locação / Outsourcing Operacional</h3>
                      <span className="text-xs font-bold text-[#eb6420]">Redução Total de CAPEX • 100% OPEX</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Linhas de locação mensal com <strong>manutenção inclusa</strong> para reduzir custos operacionais e evitar imobilização de capital.
                  </p>

                  <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Manutenção 100% inclusa:</strong> Peças, escovas e borrachas sem surpresas no caixa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Benefício Fiscal:</strong> Mensalidade 100% dedutível no IRPJ/CSLL (Lucro Real)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Substituição Imediata:</strong> Garantia de continuidade sem parada de operação</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Entrega técnica e treinamento:</strong> Gratuitos no seu estabelecimento</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleWhatsAppRedirect("Olá! Gostaria de uma proposta de LOCAÇÃO / OUTSOURCING para a Tennant A260.")}
                  className="w-full py-3.5 sm:py-4 px-4 bg-[#eb6420] hover:bg-[#d65715] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer text-center"
                >
                  <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
                  <span>Cotar Plano de Locação no WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Opção 2: Venda Direta de Fábrica */}
            <div className="bg-white border-2 border-teal-200 hover:border-[#007481] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-md flex flex-col justify-between relative overflow-hidden transition-all ring-4 ring-teal-50/50">
              
              <div>
                {/* Badge no Topo Sem Sobrepor */}
                <div className="mb-4 inline-flex items-center gap-1.5 self-start bg-[#007481] text-white text-[11px] font-black uppercase px-3.5 py-1 rounded-full shadow-xs tracking-wider">
                  ★ Faturamento Direto de Fábrica
                </div>

                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-teal-50 text-[#007481] flex items-center justify-center font-black shrink-0">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Venda Direta de Máquina Nova</h3>
                      <span className="text-xs font-bold text-[#007481]">Garantia Oficial de Fábrica Tennant</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Adquira a Tennant A260 nova com garantia oficial de fábrica e entrega técnica com treinamento no local.
                  </p>

                  <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Garantia Oficial Tennant:</strong> Rede autorizada com técnicos certificados de fábrica</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Parcelamento Facilitado:</strong> Condições especiais via BNDES, FINAME e Bancos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Estoque de Peças Genuínas:</strong> Fornecimento contínuo de escovas, rodos e detergentes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Assistência no Paraná:</strong> Atendimento ágil em Curitiba e Região</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleWhatsAppRedirect("Olá! Gostaria de receber uma proposta de COMPRA de Máquina Nova Tennant A260.")}
                  className="w-full py-3.5 sm:py-4 px-4 bg-[#007481] hover:bg-[#005a64] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer text-center"
                >
                  <WhatsAppIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
                  <span>Solicitar Cotação de Venda no WhatsApp</span>
                </button>
              </div>
            </div>

          </div>

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
      {/* 🏁 CTA FINAL: FECHAMENTO & ATENDIMENTO DIRETO (PADRONIZADO #007481)       */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-18 bg-gradient-to-br from-[#007481] via-[#005a64] to-[#003d44] text-white border-t border-teal-700/50 shadow-inner">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xs px-4 py-1.5 rounded-full text-xs font-semibold text-white border border-white/20 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Representante & Assistência Técnica Autorizada Tennant • Curitiba/PR</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Pronto para Reduzir até 60% dos Custos na Limpeza de Pisos?
          </h2>

          <p className="text-xs sm:text-base text-teal-100 max-w-2xl mx-auto leading-relaxed">
            Fale diretamente com nossos consultores técnicos. Receba uma cotação sob medida para compra ou locação com suporte oficial e entrega imediata.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleWhatsAppRedirect("Olá! Gostaria de falar com um consultor técnico para receber cotação da Tennant A260.")}
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs sm:text-sm uppercase tracking-wider px-10 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5 text-white" />
              <span>Falar no WhatsApp: {WHATSAPP_DISPLAY}</span>
            </button>

            <a
              href={`mailto:${EMAIL_CONTATO}`}
              className="w-full sm:w-auto bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm px-8 py-4 rounded-full transition-all border border-white/30 flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4 text-teal-200" />
              <span>{EMAIL_CONTATO}</span>
            </a>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-[11px] text-teal-100">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Atendimento Ágil no Paraná
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Máquinas a Pronta Entrega
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Suporte & Peças Originais
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER CORPORATIVO (PADRONIZADO COM IDENTIDADE TENNANT / CLEAN TECH)   */}
      {/* ========================================================================= */}
      <footer className="bg-[#002f35] text-teal-100 py-10 text-xs border-t border-[#004750]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <img src={LOGO_ALFA_TENNANT} alt="Alfa Tennant" className="h-8 object-contain brightness-0 invert" />
            <div className="border-l border-teal-700/60 pl-4">
              <div className="text-white font-bold">Clean Tech Smart Equipamentos</div>
              <div className="text-teal-300 text-[11px]">Representante e Assistência Técnica Autorizada Tennant - Curitiba/PR</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-teal-100">
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
              <Mail className="w-3.5 h-3.5 text-teal-300" /> {EMAIL_CONTATO}
            </a>
          </div>

          <div className="text-teal-400 text-[11px] text-center md:text-right">
            © {new Date().getFullYear()} Clean Tech Smart. Todos os direitos reservados.
          </div>

        </div>
      </footer>

      {/* Botão Flutuante Circular Oficial do WhatsApp (Ícone Redondinho) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => handleWhatsAppRedirect()}
          className="w-14 h-14 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer group"
          aria-label="WhatsApp"
          title="Falar no WhatsApp"
        >
          <WhatsAppIcon className="w-8 h-8 text-white group-hover:scale-105 transition-transform" />
        </button>
      </div>

    </div>
  );
}
