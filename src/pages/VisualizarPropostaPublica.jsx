import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Loader2, CheckCircle2, XCircle, Printer, Clock, 
  HelpCircle, Shield, Check, FileCheck, ArrowRight, MessageSquare, 
  ChevronRight, ChevronLeft, Play, Info, Briefcase, FileSignature 
} from 'lucide-react';

export default function VisualizarPropostaPublica() {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('presentation'); // 'presentation' | 'proposal' | 'minuta' | 'chat'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals for actions
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  
  // Form fields
  const [signerName, setSignerName] = useState('');
  const [signerDocument, setSignerDocument] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  // Slide Deck Presentation player state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Active photo gallery state for catalog presentation
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    fetchProposalDetails();
    fetchTemplates();
  }, [id]);

  useEffect(() => {
    if (!proposal) return;
    
    const calculateTimeLeft = () => {
      const createdAtDate = new Date(proposal.created_at || new Date());
      const validityDaysNum = parseInt(proposal.validity_days) || 10;
      const expirationDate = new Date(createdAtDate.getTime() + (validityDaysNum * 24 * 60 * 60 * 1000));
      const diffTime = expirationDate.getTime() - new Date().getTime();
      
      if (diffTime <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [proposal]);

  const fetchProposalDetails = async () => {
    try {
      const res = await fetch(`/api/get-rental-proposal-details?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setProposal(data.proposal);
      } else {
        setError('Não foi possível carregar os detalhes desta proposta.');
      }
    } catch (e) {
      console.error(e);
      setError('Erro de rede ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/get-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Erro ao buscar templates:', err);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!signerName.trim()) {
      alert('Por favor, informe seu nome para assinar.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/approve-rental-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'Fechada',
          approved_by: signerName + (signerDocument ? ` (CPF/CNPJ: ${signerDocument})` : ''),
          client_feedback: 'Proposta assinada e aprovada digitalmente pelo cliente.'
        })
      });
      if (res.ok) {
        setIsApproveOpen(false);
        fetchProposalDetails();
        setActiveTab('minuta'); // switch to contract draft
      } else {
        alert('Erro ao enviar aprovação da proposta.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao aprovar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!feedbackNotes.trim()) {
      alert('Por favor, descreva as alterações solicitadas.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/approve-rental-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'Negociação',
          approved_by: 'Cliente',
          client_feedback: feedbackNotes
        })
      });
      if (res.ok) {
        setIsRejectOpen(false);
        setFeedbackNotes('');
        fetchProposalDetails();
        setActiveTab('chat'); // switch to conversation tab
      } else {
        alert('Erro ao enviar observações.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao enviar feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPeriod = (months) => {
    const m = Number(months);
    if (m === 1) return 'Diário (1 dia)';
    if (m === 7) return 'Semanal (7 dias)';
    if (m === 15) return 'Quinzenal (15 dias)';
    if (m === 30) return 'Mensal Avulso';
    return `${m} Meses`;
  };

  const parseSpecsToHTML = (text) => {
    if (!text) return <p className="text-xs text-gray-400">Nenhuma especificação disponível.</p>;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1.5" />;
      if (trimmed.includes(':')) {
        const [key, ...valParts] = trimmed.split(':');
        const val = valParts.join(':').trim();
        const cleanKey = key.replace(/^[-\s*•]+/, '').trim();
        return (
          <div key={idx} className="flex border-b border-gray-100 py-2 text-xs hover:bg-gray-50/50">
            <span className="font-semibold text-gray-500 w-1/2">{cleanKey}</span>
            <span className="text-gray-950 w-1/2 font-bold">{val}</span>
          </div>
        );
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        return (
          <div key={idx} className="flex items-start py-1.5 text-xs text-gray-700">
            <span className="text-blue-500 mr-2 font-bold">•</span>
            <span className="font-medium text-gray-800">{trimmed.replace(/^[-\s*•]+/, '')}</span>
          </div>
        );
      }
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
        return (
          <h4 key={idx} className="font-bold text-blue-900 text-xs mt-4 mb-2 uppercase tracking-wide border-b border-blue-100 pb-1">
            {trimmed}
          </h4>
        );
      }
    });
  };
  const getGeneralDescription = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    const descLines = [];
    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Stop when we hit structured lists or sub-headers
      if (trimmed.toUpperCase().includes('ESPECIFICAÇÕES TÉCNICAS') || 
          trimmed.toUpperCase().includes('CARACTERÍSTICAS') || 
          trimmed.toUpperCase().includes('BENEFÍCIOS') ||
          (trimmed.includes(':') && !trimmed.toLowerCase().startsWith('http')) || 
          trimmed.startsWith('-') || 
          trimmed.startsWith('*') ||
          trimmed.startsWith('•')) {
        break;
      }
      descLines.push(trimmed);
    }
    // Filter out title line if it matches or contains the machine name
    return descLines.join('\n\n');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 font-semibold text-sm">Carregando painel da proposta...</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <XCircle className="w-14 h-14 text-red-500 mb-4" />
        <h1 className="text-xl font-bold">Link de Proposta Comercial Inválido</h1>
        <p className="text-slate-400 text-sm mt-2 max-w-md">{error || 'Não localizamos a proposta especificada.'}</p>
      </div>
    );
  }

  const p = proposal;
  const isApproved = p.status === 'Fechada' || p.status === 'Contrato';

  // Handle parsing of photo URLs properly (split on \n to fix broken image)
  const photoArray = typeof p.machine_photos === 'string' 
    ? p.machine_photos.split('\n').map(u => u.trim()).filter(Boolean) 
    : (Array.isArray(p.machine_photos) ? p.machine_photos.map(u => u.trim()).filter(Boolean) : []);
  const mainPhoto = photoArray[0] || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600';

  // Expiration properties
  const createdAtDate = new Date(p.created_at || new Date());
  const validityDaysNum = parseInt(p.validity_days) || 10;
  const expirationDate = new Date(createdAtDate.getTime() + (validityDaysNum * 24 * 60 * 60 * 1000));
  const expirationFormatted = expirationDate.toLocaleDateString('pt-BR');

  // Generate populated minuta
  const defaultTemplate = templates.find(t => t.is_default) || templates[0];
  let minutaHTML = '';
  if (defaultTemplate && defaultTemplate.clauses) {
    const formattedDate = new Date().toLocaleDateString('pt-BR');
    const monthlyFormatted = `R$ ${Number(p.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    
    minutaHTML = defaultTemplate.clauses.map((clause) => {
      let content = clause.content || '';
      content = content.replace(/{{CLIENT_NAME}}/g, p.client_name || '');
      content = content.replace(/{{START_DATE}}/g, formattedDate);
      content = content.replace(/{{TOTAL_VALUE}}/g, monthlyFormatted);
      
      return `
        <div style="margin-bottom: 20px; font-family: 'Inter', sans-serif;">
          <h4 style="font-size: 13px; font-weight: 700; color: #1e293b; text-transform: uppercase; margin-bottom: 8px;">${clause.title}</h4>
          <p style="font-size: 12px; color: #475569; line-height: 1.6; text-align: justify; white-space: pre-line;">${content}</p>
        </div>
      `;
    }).join('');
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* SIDEBAR NAVIGATION (equal to smartbid) */}
      {/* SIDEBAR NAVIGATION (equal to smartbid) */}
      <aside className="w-full md:w-80 bg-blue-900 text-white flex flex-col justify-between shrink-0 p-5 h-auto md:h-screen md:sticky md:top-0 border-r border-blue-950/40">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/60 shrink-0">
            <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 15 L65 50 L50 65 L15 30 Z" fill="#009AC7" />
              <path d="M50 35 L85 70 L70 85 L35 50 Z" fill="#00c0f0" opacity="0.95" />
            </svg>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide text-white uppercase leading-tight">Clean Tech Pro</h2>
              <span className="text-blue-300 text-[9px] font-bold uppercase tracking-wider block">Orçamento & Contrato</span>
            </div>
          </div>

          <div className="mb-6 shrink-0">
            <span className="text-xxs font-black text-blue-400 bg-blue-950/70 border border-blue-900/50 px-2 py-0.5 rounded uppercase tracking-wider block w-max">
              Proposta nº #{String(p.id).padStart(4, '0')}
            </span>
            <h3 className="font-extrabold text-gray-100 text-sm mt-1.5 line-clamp-2 uppercase" title={p.client_name}>
              {p.client_name}
            </h3>
          </div>

          {/* Sidebar Menu Tabs with internal scrolling if needed */}
          <nav className="space-y-1.5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
            <button 
              onClick={() => setActiveTab('presentation')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'presentation' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4" />
                <span>1. Apresentação do Catálogo</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setActiveTab('proposal')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'proposal' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>2. Proposta Comercial</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setActiveTab('minuta')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'minuta' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <FileSignature className="w-4 h-4" />
                <span>3. Minuta de Contrato</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>4. Conversa & Feedback</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </nav>
        </div>

        {/* Sidebar Decision/Status Footer - fixed at the bottom */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 shrink-0 bg-blue-900 w-full">
          {isApproved ? (
            <div className="bg-emerald-950/40 border border-emerald-900/60 p-4 rounded-2xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 animate-bounce" />
              <span className="text-xxs font-black text-emerald-400 uppercase tracking-widest block">Proposta Aprovada</span>
              <p className="text-slate-400 text-xxs mt-1 font-semibold leading-relaxed">
                Assinatura eletrônica registrada com sucesso no sistema.
              </p>
            </div>
          ) : timeLeft.expired ? (
            <div className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <span className="text-xxs font-black text-red-400 uppercase tracking-widest block">Proposta Expirada</span>
              <p className="text-slate-400 text-xxs mt-1 font-semibold leading-relaxed">
                A validade desta proposta expirou em {expirationFormatted}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={() => setIsApproveOpen(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Aprovar Proposta
              </button>
              <button 
                onClick={() => setIsRejectOpen(true)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4 text-red-500" />
                Solicitar Ajustes
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* HEADER / COUNTDOWN & MAIN VIEWPORTS */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar with Live Countdown (equal to smartbid) */}
        <header className="bg-blue-900 border-b border-blue-950/40 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-white">
          <div className="text-center sm:text-left">
            <h2 className="font-extrabold text-sm text-slate-100 tracking-wide uppercase">
              {p.client_name}
            </h2>
            <p className="text-xxs text-slate-500 font-bold mt-0.5">
              Proposta nº #{String(p.id).padStart(4, '0')} • Revisão R01
            </p>
          </div>

          {/* Smartbid style live countdown timer */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xxs text-slate-400 font-bold uppercase tracking-widest block">Validade da Proposta</span>
              <span className="text-xs font-black text-slate-200">{expirationFormatted}</span>
            </div>
            
            {timeLeft.expired ? (
              <div className="px-4 py-2 bg-red-650 text-white font-black rounded-lg text-xxs uppercase tracking-wider shadow-sm animate-pulse">
                Expirada
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="bg-slate-900 border border-slate-800/80 rounded px-2.5 py-1 text-center min-w-[36px]">
                  <span className="text-xs font-black text-white block leading-tight">{timeLeft.days}</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Dias</span>
                </div>
                <span className="text-slate-600 font-bold">:</span>
                <div className="bg-slate-900 border border-slate-800/80 rounded px-2.5 py-1 text-center min-w-[36px]">
                  <span className="text-xs font-black text-white block leading-tight">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Hrs</span>
                </div>
                <span className="text-slate-600 font-bold">:</span>
                <div className="bg-slate-900 border border-slate-800/80 rounded px-2.5 py-1 text-center min-w-[36px]">
                  <span className="text-xs font-black text-white block leading-tight">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Min</span>
                </div>
                <span className="text-slate-600 font-bold">:</span>
                <div className="bg-slate-900 border border-slate-800/80 rounded px-2.5 py-1 text-center min-w-[36px]">
                  <span className="text-xs font-black text-white block leading-tight">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Seg</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* VIEWPORTS */}
        <div className="flex-1 bg-[#001f2a] p-0 overflow-y-auto">
          
          {/* TAB 1: PRESENTATION & CATALOG SPECIFICATIONS */}
          {activeTab === 'presentation' && (
            <div className="w-full animate-in fade-in duration-150 text-left">
              
              <div className="bg-white min-h-[calc(100vh-70px)] p-6 md:p-10 space-y-6 border-b border-gray-200 w-full">
                <div className="border-b border-gray-150 pb-4">
                  <span className="text-xxs font-black text-blue-600 bg-blue-50 border border-blue-100/50 px-2.5 py-0.5 rounded uppercase tracking-wider">
                    Catálogo de Equipamentos
                  </span>
                  <h2 className="text-xl font-black text-gray-900 mt-2 uppercase tracking-wide">
                    {p.machine_name || 'Equipamento'}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Interactive photo gallery */}
                  <div className="md:col-span-5 space-y-4">
                    <div className="relative h-[300px] bg-white border border-gray-150 rounded-xl flex items-center justify-center p-4 shadow-xxs overflow-hidden">
                      <img 
                        src={photoArray[activePhotoIndex] || mainPhoto} 
                        alt={p.machine_name} 
                        className="max-h-full max-w-full object-contain" 
                      />
                      
                      {/* Chevron Navigation Controls */}
                      {photoArray.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActivePhotoIndex(prev => (prev === 0 ? photoArray.length - 1 : prev - 1))}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors shadow-sm z-10"
                            title="Foto Anterior"
                          >
                            <ChevronLeft className="w-4.5 h-4.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePhotoIndex(prev => (prev === photoArray.length - 1 ? 0 : prev + 1))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors shadow-sm z-10"
                            title="Próxima Foto"
                          >
                            <ChevronRight className="w-4.5 h-4.5" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnail list if there are multiple photos */}
                    {photoArray.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                        {photoArray.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActivePhotoIndex(idx)}
                            className={`w-16 h-12 bg-white border-2 rounded-lg flex items-center justify-center p-1 shrink-0 transition-all ${activePhotoIndex === idx ? 'border-blue-600 scale-102' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <img src={url} alt={`Preview ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Structured technical specifications list */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="bg-slate-50 border border-gray-100 rounded-xl p-4 md:p-5">
                      <h3 className="text-xs font-extrabold text-blue-900 uppercase tracking-widest border-b border-blue-100 pb-2 mb-3">
                        Especificações Técnicas
                      </h3>
                      <div className="space-y-0.5 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin">
                        {parseSpecsToHTML(p.machine_specs)}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: COMMERCIAL PROPOSAL DETAILS (CLONED FROM PRINTED PDF STRUCTURE, NO TECHNICAL SPECS TEXTBOX) */}
          {activeTab === 'proposal' && (
            <div className="w-full py-8 px-4 flex justify-center animate-in fade-in duration-150">
              
              {/* Virtual A4 sheet representing the PDF structure */}
              <div className="bg-white rounded-2xl border border-gray-250 shadow-lg p-8 md:p-12 space-y-8 relative w-full max-w-4xl font-sans leading-relaxed text-gray-800 text-left">
                
                {/* Header matching printed proposal */}
                <div className="flex justify-between items-center border-b-2 border-blue-600 pb-5 mb-5 gap-4">
                  <div className="text-left">
                    <h2 className="text-base font-extrabold text-gray-900 tracking-wide uppercase">CLEAN TECH PRO</h2>
                    <span className="text-xxs font-bold text-gray-500 block uppercase tracking-wider mt-0.5">CNPJ: 43.158.052/0001-01</span>
                    <span className="text-xxs text-gray-400 block font-medium">Avenida Maringá, 1273 – Emiliano Perneta Pinhais/PR</span>
                  </div>
                  
                  <div className="flex justify-end shrink-0">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M30 15 L65 50 L50 65 L15 30 Z" fill="#009AC7" />
                        <path d="M50 35 L85 70 L70 85 L35 50 Z" fill="#004054" opacity="0.85" />
                      </svg>
                      <div className="text-left leading-none">
                        <span className="text-lg font-black text-[#004054] tracking-tight block">CLEANTECH<span className="text-[#009AC7]">PRO</span></span>
                        <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest block mt-0.5">A REVOLUÇÃO NO MERCADO DE LOCAÇÕES</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h1 className="text-base font-extrabold uppercase text-slate-800 tracking-wider">Proposta Comercial de Locação de Equipamentos</h1>
                  <span className="text-xxs font-bold text-slate-400 block mt-1">Proposta nº #{String(p.id).padStart(4, '0')} • Data: {new Date(p.created_at || new Date()).toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Cliente details container */}
                <div className="border border-gray-150 rounded-xl p-4 bg-slate-50/50 mb-6 text-left">
                  <div className="text-xxs font-extrabold text-blue-600 uppercase tracking-widest border-b border-gray-200/80 pb-1.5 mb-3">Dados do Cliente</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-gray-700 font-semibold">
                    <div><b>Cliente:</b> {p.client_razao_social || p.client_name || 'Não informado'}</div>
                    <div><b>CNPJ/CPF:</b> {p.client_document || 'Isento'}</div>
                    <div><b>Endereço:</b> {p.client_address || '&mdash;'}</div>
                    <div><b>Telefone:</b> {p.client_phone || '&mdash;'}</div>
                    <div><b>E-mail:</b> {p.client_email || '&mdash;'}</div>
                    <div><b>Contato:</b> {p.client_contact || p.client_email?.split('@')[0] || '&mdash;'}</div>
                  </div>
                </div>

                {/* Structured Clauses instead of Dashboard Grid */}
                <div className="space-y-6 text-xs text-gray-700 font-medium leading-relaxed">
                  
                  <div>
                    <h3 className="font-extrabold text-gray-900 border-b border-gray-250 pb-1 mb-2 text-sm uppercase">01 - DO OBJETO E ESCOPO</h3>
                    <p className="pl-4">
                      1.1. Constitui objeto desta Proposta Comercial a locação temporária do seguinte equipamento de alta performance:
                    </p>
                    
                    {/* Machine Photo and Paragraph Description Grid matching the PDF Print layout */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mt-4 pl-4 mb-4">
                      
                      {/* Left: Machine Photo */}
                      <div className="md:col-span-4 bg-white border border-gray-150 rounded-xl p-3 flex items-center justify-center h-48 shadow-xxs">
                        <img src={mainPhoto} alt={p.machine_name} className="max-h-full max-w-full object-contain" />
                      </div>

                      {/* Right: Machine Title & Description */}
                      <div className="md:col-span-8 space-y-2">
                        <h4 className="text-xs font-black text-gray-900 border-b border-blue-200 pb-1 uppercase tracking-wide">
                          {p.machine_name || 'Equipamento'}
                        </h4>
                        
                        <div className="text-gray-600 text-[11px] font-semibold leading-relaxed space-y-2 whitespace-pre-line">
                          {getGeneralDescription(p.machine_specs) || 'Equipamento de alta qualidade e rendimento, ideal para processos contínuos de higienização de pisos.'}
                        </div>
                      </div>

                    </div>

                    <p className="pl-4 mt-4">
                      1.2. O escopo compreende a disponibilização do equipamento em plenas condições de operação, acompanhado dos seguintes diferenciais operacionais inclusos:
                    </p>
                    <ul className="pl-8 list-disc mt-1 space-y-0.5 text-gray-600">
                      <li>Revisão técnica preventiva realizada antes da entrega.</li>
                      <li>Suporte técnico ágil para atendimento e resolução de eventuais chamados.</li>
                      <li>Frota de backup disponível em caso de indisponibilidade prolongada.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 border-b border-gray-250 pb-1 mb-2 text-sm uppercase">02 - DAS CONDIÇÕES E INVESTIMENTO</h3>
                    <p className="pl-4 mb-3">
                      2.1. Os valores referentes aos serviços de locação e as condições logísticas acordadas estão descritos no resumo comercial abaixo:
                    </p>
                    
                    <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xxs bg-white ml-4 max-w-2xl">
                      <table className="w-full text-left text-xs text-gray-650 border-collapse">
                        <tbody className="divide-y divide-gray-150 font-semibold">
                          <tr>
                            <td className="px-3.5 py-2 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide w-1/2">Investimento Mensal</td>
                            <td className="px-3.5 py-2 font-black text-blue-600 text-sm">
                              R$ {Number(p.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3.5 py-2 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide">Plano de Manutenção</td>
                            <td className="px-3.5 py-2 font-bold text-gray-800">{p.contract_type}</td>
                          </tr>
                          <tr>
                            <td className="px-3.5 py-2 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide">Período de Locação</td>
                            <td className="px-3.5 py-2 font-bold text-gray-800">{formatPeriod(p.period_months)}</td>
                          </tr>
                          <tr>
                            <td className="px-3.5 py-2 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide">Franquia de Horas</td>
                            <td className="px-3.5 py-2 font-bold text-gray-800">{p.hours_per_month || 'Franquia Livre'}</td>
                          </tr>
                          <tr>
                            <td className="px-3.5 py-2 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide">Região de Uso Autorizada</td>
                            <td className="px-3.5 py-2 font-semibold text-gray-700">{p.region_used || 'Estado de São Paulo'}</td>
                          </tr>
                          <tr>
                            <td className="px-3.5 py-2 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide">Tempo de Entrega</td>
                            <td className="px-3.5 py-2 font-semibold text-gray-700">{p.delivery_time || 'Imediato'}</td>
                          </tr>
                          <tr>
                            <td className="px-3.5 py-2 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide">Custo de Frete</td>
                            <td className="px-3.5 py-2 font-semibold text-gray-700">
                              {Number(p.freight_cost) > 0 ? `R$ ${Number(p.freight_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Incluso'}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3.5 py-2 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide">Validade desta Proposta</td>
                            <td className="px-3.5 py-2 font-semibold text-gray-700">{p.validity_days || '10'} dias</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 border-b border-gray-250 pb-1 mb-2 text-sm uppercase">03 - COBERTURAS DO PLANO ESCOLHIDO</h3>
                    <p className="pl-4 mb-3">
                      3.1. A cobertura de manutenção associada ao plano contratado está descrita na tabela comparativa abaixo:
                    </p>
                    
                    <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xxs bg-white ml-4">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 border-b border-gray-250">
                          <tr>
                            <th className="px-4 py-2 font-bold text-gray-700 w-1/3">Tipo de Contrato</th>
                            <th className="px-4 py-2 font-bold text-gray-700">Descrição de Cobertura</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {[
                            { id: '0', title: '0 - Sem Cobertura', desc: 'Incluso somente aluguel da máquina.' },
                            { id: '1', title: '1 - Ouro', desc: 'Incluso: Manutenção, peças, água destilada e deslocamento do técnico.' },
                            { id: '2', title: '2 - Prata', desc: 'Incluso preventivas e corretivas. Não incluso: escovas e discos.' },
                            { id: '3', title: '3 - Bronze', desc: 'Incluso preventivas. Não incluso baterias e consumíveis.' },
                            { id: '4', title: '4 - MOB', desc: 'Incluso somente mão de obra de manutenção.' }
                          ].map(plan => {
                            const isSel = p.contract_type?.startsWith(plan.id);
                            return (
                              <tr key={plan.id} className={`transition-colors ${isSel ? 'bg-yellow-50 font-bold' : 'hover:bg-gray-50/20 text-gray-500'}`}>
                                <td className={`px-4 py-3 border-r border-gray-150 ${isSel ? 'text-amber-800 font-extrabold' : 'text-gray-900 font-semibold'}`}>
                                  {isSel && '★ '}
                                  {plan.title}
                                </td>
                                <td className={`px-4 py-3 ${isSel ? 'text-amber-950 font-semibold' : 'text-gray-500'}`}>
                                  {plan.desc}
                                  {isSel && <span className="block mt-1 text-[10px] font-black text-amber-800 bg-amber-100/50 border border-amber-200/50 px-2 py-0.5 rounded w-max uppercase tracking-wider">Selecionado</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Seller Box Footer */}
                <div className="flex justify-between items-end gap-6 pt-5 border-t border-gray-200 mt-8 text-xxs font-bold text-gray-500">
                  <div className="text-left leading-relaxed">
                    <b>Dados do Vendedor</b><br />
                    {p.seller_info || 'Alfa Tennant\nAtendimento Comercial\n(11) 3320-8550'}
                  </div>
                  <div className="text-right text-[10px] font-bold text-slate-400">
                    Pinhais/PR, {new Date(p.created_at || new Date()).toLocaleDateString('pt-BR')}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: CONTRACT DRAFT MINUTA (15 CLAUSES SCROLLABLE PAGE) */}
          {activeTab === 'minuta' && (
            <div className="w-full py-8 px-4 flex justify-center animate-in fade-in duration-150">
              <div className="bg-white border border-gray-250 shadow-lg rounded-2xl p-8 md:p-12 text-left relative overflow-hidden font-serif leading-relaxed w-full max-w-4xl">
                
                {/* Watermark/Pre-contract stamp */}
                <div className="absolute top-10 right-10 border-4 border-dashed border-slate-300 text-slate-300/80 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transform rotate-6 select-none pointer-events-none">
                  {isApproved ? 'Minuta Aprovada' : 'Minuta Pré-Contratual'}
                </div>

                <div className="border-b border-gray-200 pb-6 mb-8 text-center">
                  <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800">Minuta de Contrato de Locação</h2>
                  <p className="text-xs text-gray-400 mt-2 font-sans font-bold">PADRÃO ALFA TENNANT — 15 CLÁUSULAS CONTRATUAIS</p>
                </div>

                {/* Render dynamic clauses */}
                {minutaHTML ? (
                  <div 
                    className="space-y-6 text-gray-700 text-xs overflow-y-auto max-h-[650px] pr-3 scrollbar-thin font-sans"
                    dangerouslySetInnerHTML={{ __html: minutaHTML }}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-400 text-xs font-sans font-semibold">
                    Nenhuma minuta contratual disponível. O administrador precisa semear o template padrão no sistema.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CHAT / CONVERSATION & DECISIONS HISTORY */}
          {activeTab === 'chat' && (
            <div className="w-full py-8 px-4 flex justify-center animate-in fade-in duration-150 text-left">
              <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm w-full max-w-4xl">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Histórico de Negociação & Decisões
                </h3>

                {/* Notes field showing logs */}
                {p.notes ? (
                  <div className="bg-slate-50 border border-gray-100 rounded-xl p-5 space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin">
                    <div className="text-xs text-gray-700 leading-relaxed font-semibold whitespace-pre-wrap">
                      {p.notes}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400 text-xs font-bold">
                    Nenhuma conversa ou decisão registrada até o momento nesta proposta.
                  </div>
                )}

                {/* Quick feedback box for client */}
                {!isApproved && !timeLeft.expired && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-700 mb-2">Enviar Mensagem / Solicitar Alteração</h4>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="Escreva sua observação comercial, dúvida ou ajuste solicitado..."
                        value={feedbackNotes}
                        onChange={e => setFeedbackNotes(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-250 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-semibold"
                      />
                      <button 
                        onClick={handleReject}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* APPROVE MODAL */}
      {isApproveOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-xxs">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Aprovar Proposta Comercial</h3>
            </div>
            
            <form onSubmit={handleApprove} className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Ao preencher os dados abaixo e clicar em confirmar, você declara estar de acordo com os termos comerciais descritos na Proposta de Locação nº #{String(p.id).padStart(4, '0')}.
              </p>

              <div>
                <label className="block text-xxs font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Seu Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Alisson Ferreira"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  className="w-full h-10 px-3.5 border border-gray-250 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-xxs font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">CPF / CNPJ (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ex: 07.061.471/0001-59"
                  value={signerDocument}
                  onChange={e => setSignerDocument(e.target.value)}
                  className="w-full h-10 px-3.5 border border-gray-250 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsApproveOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Assinando...
                    </>
                  ) : (
                    <>
                      Confirmar Aprovação
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {isRejectOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-xxs">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Solicitar Ajustes na Proposta</h3>
            </div>
            
            <form onSubmit={handleReject} className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed">
                Por favor, nos informe detalhadamente quais pontos comerciais ou especificações técnicas precisam ser ajustados para a revisão.
              </p>

              <div>
                <label className="block text-xxs font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Descreva os ajustes solicitados</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Ex: Preciso de alteração nas condições de frete e no prazo de vigência para 24 meses..."
                  value={feedbackNotes}
                  onChange={e => setFeedbackNotes(e.target.value)}
                  className="w-full p-3 border border-gray-250 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Observações
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
