import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Loader2, CheckCircle2, XCircle, Printer, Clock, 
  HelpCircle, Shield, Check, FileCheck, ArrowRight, MessageSquare, 
  ChevronRight, ChevronLeft, Play, Info, Briefcase, FileSignature 
} from 'lucide-react';

export default function VisualizarOrcamentoPublico() {
  const { id } = useParams();
  const [budgetData, setBudgetData] = useState(null);
  const [activeTab, setActiveTab] = useState('budget'); // 'presentation' | 'budget' | 'chat'
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

  // Active photo gallery state for catalog presentation
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    fetchBudgetDetails();
  }, [id]);

  const fetchBudgetDetails = async () => {
    try {
      const res = await fetch(`/api/get-budget-details?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setBudgetData(data);
        // If has associated machine catalog model, set active tab to presentation by default
        if (data.budget?.machine_model_id) {
          setActiveTab('presentation');
        } else {
          setActiveTab('budget');
        }
      } else {
        setError('Não foi possível carregar os detalhes deste orçamento.');
      }
    } catch (e) {
      console.error(e);
      setError('Erro de rede ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
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
      const res = await fetch('/api/approve-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'Aprovado',
          approved_by: signerName + (signerDocument ? ` (CPF/CNPJ: ${signerDocument})` : ''),
          client_feedback: 'Orçamento assinado e aprovado digitalmente pelo cliente.'
        })
      });
      if (res.ok) {
        setIsApproveOpen(false);
        fetchBudgetDetails();
        setActiveTab('budget');
      } else {
        alert('Erro ao enviar aprovação do orçamento.');
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
      alert('Por favor, descreva o motivo da rejeição ou os ajustes solicitados.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/approve-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'Rejeitado',
          approved_by: 'Cliente',
          client_feedback: feedbackNotes
        })
      });
      if (res.ok) {
        setIsRejectOpen(false);
        setFeedbackNotes('');
        fetchBudgetDetails();
        setActiveTab('chat');
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!feedbackNotes.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/approve-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: budgetData.budget.status || 'Pendente',
          approved_by: 'Cliente (Mensagem)',
          client_feedback: feedbackNotes
        })
      });
      if (res.ok) {
        setFeedbackNotes('');
        fetchBudgetDetails();
      } else {
        alert('Erro ao enviar mensagem.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao enviar mensagem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseSpecsToHTML = (text) => {
    if (!text) return <p className="text-xs text-gray-450">Nenhuma especificação disponível.</p>;
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
      return <p key={idx} className="text-xs text-gray-600 leading-relaxed py-1">{trimmed}</p>;
    });
  };

  const getGeneralDescription = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    const descLines = [];
    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
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
    return descLines.join('\n\n');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-xs font-semibold mt-3">Carregando orçamento técnico...</p>
      </div>
    );
  }

  if (error || !budgetData || !budgetData.budget) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <XCircle className="w-14 h-14 text-red-500 mb-4" />
        <h1 className="text-xl font-bold">Link de Orçamento Inválido</h1>
        <p className="text-slate-400 text-sm mt-2 max-w-md">{error || 'Não localizamos o orçamento especificado.'}</p>
      </div>
    );
  }

  const { budget, laborItems, partsItems } = budgetData;
  const isApproved = budget.status === 'Aprovado';
  const isRejected = budget.status === 'Rejeitado';

  // Handle parsing of photo URLs properly
  const photoArray = typeof budget.machine_model_photos === 'string' 
    ? budget.machine_model_photos.split('\n').map(u => u.trim()).filter(Boolean) 
    : (Array.isArray(budget.machine_model_photos) ? budget.machine_model_photos.map(u => u.trim()).filter(Boolean) : []);
  const mainPhoto = photoArray[0] || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600';

  // Calculate logistics details
  const travelKm = Math.max(0, (budget.final_km || 0) - (budget.initial_km || 0));

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* SIDEBAR NAVIGATION */}
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
              Orçamento nº #{String(budget.id).padStart(4, '0')}
            </span>
            <h3 className="font-extrabold text-gray-100 text-sm mt-1.5 line-clamp-2 uppercase" title={budget.client_name}>
              {budget.client_name || budget.client_id}
            </h3>
          </div>

          {/* Sidebar Menu Tabs with internal scrolling */}
          <nav className="space-y-1.5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
            {budget.machine_model_id && (
              <button 
                onClick={() => setActiveTab('presentation')}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'presentation' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4" />
                  <span>1. Apresentação do Equipamento</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <button 
              onClick={() => setActiveTab('budget')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'budget' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>{budget.machine_model_id ? '2.' : '1.'} Orçamento Técnico</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>{budget.machine_model_id ? '3.' : '2.'} Conversa & Feedback</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </nav>
        </div>

        {/* Sidebar Decision/Status Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 shrink-0 bg-blue-900 w-full">
          {isApproved ? (
            <div className="bg-emerald-950/40 border border-emerald-900/60 p-4 rounded-2xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 animate-bounce" />
              <span className="text-xxs font-black text-emerald-400 uppercase tracking-widest block">Orçamento Aprovado</span>
              <p className="text-slate-400 text-xxs mt-1 font-semibold leading-relaxed">
                Aprovação e assinatura digital registradas com sucesso.
              </p>
            </div>
          ) : isRejected ? (
            <div className="bg-red-950/40 border border-red-900/60 p-4 rounded-2xl text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <span className="text-xxs font-black text-red-400 uppercase tracking-widest block">Orçamento Recusado</span>
              <p className="text-slate-400 text-xxs mt-1 font-semibold leading-relaxed">
                O orçamento foi recusado pelo cliente. Novo ajuste pendente.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={() => setIsApproveOpen(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Aprovar Orçamento
              </button>
              <button 
                onClick={() => setIsRejectOpen(true)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4 text-red-500" />
                Recusar / Pedir Ajustes
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 flex flex-col min-h-0 bg-slate-50 relative overflow-y-auto">
        
        {/* Info Top Banner */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-10 shrink-0 shadow-xxs">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status do Orçamento</span>
              <span className={`text-xs font-black uppercase tracking-wide ${isApproved ? 'text-emerald-600' : isRejected ? 'text-red-500' : 'text-amber-500'}`}>
                {budget.status || 'Pendente'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-white border border-gray-250 text-gray-700 hover:bg-gray-50 text-xxs font-extrabold rounded-lg shadow-xxs transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
            </button>
          </div>
        </header>

        {/* Content Tabs */}
        <div className="flex-1">

          {/* TAB 1: CATALOG PRESENTATION */}
          {activeTab === 'presentation' && budget.machine_model_id && (
            <div className="w-full py-8 px-4 flex flex-col items-center animate-in fade-in duration-150">
              
              {/* Product presentation layout */}
              <div className="bg-white rounded-2xl border border-gray-250 shadow-lg p-6 md:p-10 max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative text-left">
                
                {/* Ribbon badge */}
                <div className="absolute top-5 right-5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3.5 py-1 text-[10px] font-black uppercase tracking-wider">
                  Catálogo Comercial
                </div>

                {/* Left: Product Images Gallery */}
                <div className="md:col-span-6 space-y-4">
                  <div className="bg-slate-50 border border-gray-150 rounded-2xl p-6 flex items-center justify-center h-64 md:h-80 shadow-inner relative group">
                    <img 
                      src={photoArray[activePhotoIndex] || mainPhoto} 
                      alt={budget.machine_model_name} 
                      className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105" 
                    />
                    
                    {photoArray.length > 1 && (
                      <>
                        <button 
                          onClick={() => setActivePhotoIndex(prev => prev === 0 ? photoArray.length - 1 : prev - 1)}
                          className="absolute left-3 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md transition-all active:scale-95"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setActivePhotoIndex(prev => prev === photoArray.length - 1 ? 0 : prev + 1)}
                          className="absolute right-3 p-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-md transition-all active:scale-95"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {photoArray.length > 1 && (
                    <div className="flex gap-2 justify-center overflow-x-auto py-1">
                      {photoArray.map((url, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setActivePhotoIndex(idx)}
                          className={`w-14 h-14 bg-white border rounded-lg p-1 flex items-center justify-center shrink-0 transition-all ${activePhotoIndex === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <img src={url} alt="Thumbnail" className="max-h-full max-w-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Technical specifications */}
                <div className="md:col-span-6 space-y-6">
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-900 leading-tight tracking-tight uppercase">
                      {budget.machine_model_name}
                    </h1>
                  </div>

                  {/* General descriptive text block */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-150/70 text-gray-650 text-xs leading-relaxed space-y-3 whitespace-pre-line font-medium">
                    {getGeneralDescription(budget.machine_model_technical_description) || 'Equipamento corporativo de alto desempenho de limpeza, projetado com a mais moderna tecnologia para a higienização ágil de grandes áreas de piso.'}
                  </div>

                  {/* Technical values table */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-gray-900 border-b border-gray-200 pb-1 mb-2 uppercase tracking-wide">Ficha Técnica do Modelo</h3>
                    <div className="max-h-48 overflow-y-auto pr-1">
                      {parseSpecsToHTML(budget.machine_model_technical_description)}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL BUDGET DETAILS */}
          {activeTab === 'budget' && (
            <div className="w-full py-8 px-4 flex justify-center animate-in fade-in duration-150">
              
              {/* Virtual A4 sheet */}
              <div className="bg-white rounded-2xl border border-gray-250 shadow-lg p-8 md:p-12 space-y-8 relative w-full max-w-4xl font-sans leading-relaxed text-gray-800 text-left">
                
                {/* Header */}
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
                  <h1 className="text-base font-extrabold uppercase text-slate-800 tracking-wider">Orçamento Técnico de Serviços</h1>
                  <span className="text-xxs font-bold text-slate-400 block mt-1">Orçamento nº #{String(budget.id).padStart(4, '0')} • Data: {new Date(budget.created_at || new Date()).toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Cliente details container */}
                <div className="border border-gray-150 rounded-xl p-4 bg-slate-50/50 mb-6 text-left">
                  <div className="text-xxs font-extrabold text-blue-600 uppercase tracking-widest border-b border-gray-200/80 pb-1.5 mb-3">Dados do Cliente</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-gray-700 font-semibold">
                    <div><b>Cliente:</b> {budget.client_name || budget.client_id || 'Não informado'}</div>
                    <div><b>CNPJ/CPF:</b> {budget.client_document || '—'}</div>
                    <div><b>Endereço:</b> {budget.client_address || '—'}</div>
                    <div><b>Contato:</b> {budget.contact_name || '—'}</div>
                    <div><b>Telefone/Info:</b> {budget.contact_info || '—'}</div>
                    <div><b>Serviço Solicitado:</b> <span className="capitalize">{budget.service_type || 'Manutenção'}</span></div>
                  </div>
                </div>

                {/* Equipamento Relacionado */}
                {(budget.equipment_name || budget.equipment_model) && (
                  <div className="border border-gray-150 rounded-xl p-4 bg-slate-50/50 mb-6 text-left">
                    <div className="text-xxs font-extrabold text-blue-600 uppercase tracking-widest border-b border-gray-200/80 pb-1.5 mb-3">Equipamento Relacionado</div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-gray-700 font-semibold">
                      <div><b>Nome:</b> {budget.equipment_name || '—'}</div>
                      <div><b>Marca:</b> {budget.equipment_brand || '—'}</div>
                      <div><b>Modelo:</b> {budget.equipment_model || '—'}</div>
                      <div><b>Nº Série:</b> {budget.equipment_serial_number || '—'}</div>
                    </div>
                  </div>
                )}

                {/* Items and costs table */}
                <div className="space-y-6 text-xs text-gray-700 font-medium leading-relaxed">
                  
                  <div>
                    <h3 className="font-extrabold text-gray-900 border-b border-gray-250 pb-1 mb-2 text-sm uppercase">01 - MÃO DE OBRA E SERVIÇOS TÉCNICOS</h3>
                    {laborItems.length === 0 ? (
                      <p className="pl-4 text-gray-400 italic">Nenhum serviço técnico cadastrado.</p>
                    ) : (
                      <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xxs bg-white ml-4">
                        <table className="w-full text-left text-xs text-gray-650 border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-150 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                              <th className="px-4 py-2 w-7/12">Descrição do Serviço</th>
                              <th className="px-4 py-2 text-center w-2/12">Qtd (Horas)</th>
                              <th className="px-4 py-2 text-right w-3/12">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 font-semibold">
                            {laborItems.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="px-4 py-2.5 font-bold text-gray-800">{item.description}</td>
                                <td className="px-4 py-2.5 text-center">{item.hours} hrs</td>
                                <td className="px-4 py-2.5 text-right font-black text-gray-900">
                                  R$ {Number((item.hours || 0) * (item.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-gray-900 border-b border-gray-250 pb-1 mb-2 text-sm uppercase">02 - PEÇAS E INSUMOS APLICADOS</h3>
                    {partsItems.length === 0 ? (
                      <p className="pl-4 text-gray-400 italic">Nenhuma peça ou insumo cadastrado neste orçamento.</p>
                    ) : (
                      <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xxs bg-white ml-4">
                        <table className="w-full text-left text-xs text-gray-650 border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-150 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                              <th className="px-4 py-2 w-7/12">Nome da Peça / Componente</th>
                              <th className="px-4 py-2 text-center w-2/12">Quantidade</th>
                              <th className="px-4 py-2 text-right w-3/12">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 font-semibold">
                            {partsItems.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="px-4 py-2.5 font-bold text-gray-800">{item.part_name}</td>
                                <td className="px-4 py-2.5 text-center">{item.quantity} un</td>
                                <td className="px-4 py-2.5 text-right font-black text-gray-900">
                                  R$ {Number((item.quantity || 0) * (item.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Deslocamento */}
                  {travelKm > 0 && (
                    <div>
                      <h3 className="font-extrabold text-gray-900 border-b border-gray-250 pb-1 mb-2 text-sm uppercase">03 - LOGÍSTICA E DESLOCAMENTO TÉCNICO</h3>
                      <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xxs bg-white ml-4 max-w-xl">
                        <table className="w-full text-left text-xs text-gray-650 border-collapse">
                          <tbody className="divide-y divide-gray-150 font-semibold">
                            <tr>
                              <td className="px-4 py-2 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide w-1/2">Quilometragem Total</td>
                              <td className="px-4 py-2 text-gray-900 font-bold">{travelKm} km ({budget.initial_km} km a {budget.final_km} km)</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide">Valor por Quilômetro</td>
                              <td className="px-4 py-2 text-gray-900 font-bold">R$ {Number(budget.price_per_km || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /km</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide">Total Logística</td>
                              <td className="px-4 py-2 font-black text-gray-900">R$ {Number(budget.total_logistics || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Financial Summary */}
                  <div>
                    <h3 className="font-extrabold text-gray-900 border-b border-gray-250 pb-1 mb-2 text-sm uppercase">04 - RESUMO FINANCEIRO GERAL</h3>
                    <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xxs bg-white ml-4 max-w-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <tbody className="divide-y divide-gray-150 font-semibold text-gray-700">
                          <tr>
                            <td className="px-4 py-2.5 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide w-1/2">Total de Mão de Obra</td>
                            <td className="px-4 py-2.5 text-right text-gray-900">R$ {Number(budget.total_labor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide">Total de Peças e Insumos</td>
                            <td className="px-4 py-2.5 text-right text-gray-900">R$ {Number(budget.total_parts || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2.5 font-bold text-gray-500 bg-gray-50 uppercase text-[9px] tracking-wide">Total de Deslocamento</td>
                            <td className="px-4 py-2.5 text-right text-gray-900">R$ {Number(budget.total_logistics || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                          <tr className="bg-slate-50 font-black">
                            <td className="px-4 py-3 font-bold text-gray-800 uppercase text-[10px] tracking-wider">INVESTIMENTO TOTAL GERAL</td>
                            <td className="px-4 py-3 text-right text-blue-600 text-sm">
                              R$ {Number(budget.grand_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notes */}
                  {budget.notes && (
                    <div className="bg-blue-50/20 rounded-xl border border-blue-100/50 p-4 ml-4">
                      <span className="font-extrabold text-[10px] uppercase tracking-wider text-blue-900 block mb-1">Observações do Orçamento</span>
                      <p className="text-gray-650 font-semibold text-xs leading-relaxed whitespace-pre-line">
                        {budget.notes}
                      </p>
                    </div>
                  )}

                </div>

                {/* Footer and Signatures */}
                <div className="pt-8 border-t border-gray-150 mt-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xxs font-extrabold text-gray-500">
                    <div className="space-y-1">
                      <div className="h-0.5 bg-gray-300 w-48 mx-auto mb-1"></div>
                      <span className="block uppercase tracking-wider">Clean Tech Pro</span>
                      <span className="block font-medium text-gray-400">Responsável Técnico</span>
                    </div>
                    <div className="space-y-1">
                      {isApproved ? (
                        <div className="text-emerald-600 font-bold flex flex-col items-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-0.5" />
                          <span>Assinado Digitalmente</span>
                        </div>
                      ) : (
                        <div className="h-0.5 bg-gray-300 w-48 mx-auto mb-1"></div>
                      )}
                      <span className="block uppercase tracking-wider">{budget.client_name || 'Cliente'}</span>
                      <span className="block font-medium text-gray-400">Aprovação do Cliente</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: CONVERSATION & FEEDBACK */}
          {activeTab === 'chat' && (
            <div className="w-full py-8 px-4 flex justify-center animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-gray-250 shadow-lg p-6 md:p-8 max-w-3xl w-full text-left">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Histórico de Negociação & Decisões
                </h3>

                {/* Comments/Logs log block */}
                <div className="bg-slate-50/50 border border-gray-150 rounded-xl p-4 mb-6 max-h-[350px] overflow-y-auto">
                  {budget.notes && budget.notes.includes('--- Histórico') ? (
                    <div className="space-y-4">
                      {budget.notes.split('--- Histórico de Decisão ---').map((chunk, idx) => {
                        const trimmed = chunk.trim();
                        if (!trimmed) return null;
                        if (idx === 0) {
                          return (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-150 text-xs">
                              <span className="text-gray-400 text-[10px] font-bold block mb-1">Observações Iniciais:</span>
                              <p className="text-gray-650 font-semibold leading-relaxed whitespace-pre-line">{trimmed}</p>
                            </div>
                          );
                        }
                        const lines = trimmed.split('\n');
                        const headerLine = lines[0];
                        const feedbackLine = lines.slice(1).join('\n');
                        const isApp = headerLine.includes('Aprovado');
                        
                        return (
                          <div key={idx} className={`p-3 rounded-lg border text-xs ${isApp ? 'bg-emerald-50/40 border-emerald-100' : 'bg-red-50/30 border-red-100'}`}>
                            <span className="text-gray-400 text-[10px] font-bold block mb-1">{isApp ? 'Aprovação Registrada:' : 'Feedback/Rejeição Registrada:'}</span>
                            <h4 className="font-extrabold text-gray-800">{headerLine}</h4>
                            {feedbackLine && <p className="text-gray-650 font-semibold mt-1 bg-white/75 p-2 rounded border border-gray-100/50">{feedbackLine}</p>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                      Nenhuma conversa ou feedback registrado neste orçamento.
                    </div>
                  )}
                </div>

                {/* Send message form */}
                {!isApproved && !isRejected && (
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div>
                      <label className="block text-xxs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">Enviar Mensagem / Solicitar Alteração</label>
                      <textarea
                        value={feedbackNotes}
                        onChange={e => setFeedbackNotes(e.target.value)}
                        placeholder="Escreva sua observação técnica, dúvida ou ajuste solicitado no orçamento..."
                        rows={4}
                        className="w-full p-3.5 border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !feedbackNotes.trim()}
                        className="px-6 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-98 flex items-center gap-1.5"
                      >
                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Enviar Mensagem
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* APPROVE MODAL */}
      {isApproveOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                Aprovar Orçamento de Serviços
              </h2>
              <button 
                type="button"
                onClick={() => setIsApproveOpen(false)} 
                className="text-gray-450 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleApprove}>
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Ao preencher os dados abaixo e clicar em confirmar, você declara estar de acordo com os serviços descritos no Orçamento nº #{String(budget.id).padStart(4, '0')}.
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Seu Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={signerName} 
                    onChange={e => setSignerName(e.target.value)}
                    placeholder="Nome de quem está autorizando"
                    className="w-full h-10 px-3 border border-gray-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">CPF / CNPJ (Opcional)</label>
                  <input 
                    type="text" 
                    value={signerDocument} 
                    onChange={e => setSignerDocument(e.target.value)}
                    placeholder="Documento para registro da assinatura"
                    className="w-full h-10 px-3 border border-gray-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-5 flex justify-end gap-2.5 border-t border-gray-100 bg-gray-50">
                <button 
                  type="button" 
                  onClick={() => setIsApproveOpen(false)} 
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {isSubmitting ? 'Assinando...' : 'Assinar & Aprovar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT/ADJUSTMENTS MODAL */}
      {isRejectOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Recusar Orçamento
              </h2>
              <button 
                type="button"
                onClick={() => setIsRejectOpen(false)} 
                className="text-gray-450 hover:text-gray-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleReject}>
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Por favor, descreva abaixo as alterações necessárias ou o motivo para recusar este orçamento técnico. Nosso time será notificado para realizar os devidos ajustes.
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Motivo / Alterações Solicitadas</label>
                  <textarea 
                    required
                    value={feedbackNotes} 
                    onChange={e => setFeedbackNotes(e.target.value)}
                    placeholder="Descreva detalhadamente o que precisa ser ajustado..."
                    rows={4}
                    className="w-full p-3 border border-gray-250 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-5 flex justify-end gap-2.5 border-t border-gray-100 bg-gray-50">
                <button 
                  type="button" 
                  onClick={() => setIsRejectOpen(false)} 
                  className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {isSubmitting ? 'Enviando...' : 'Confirmar Rejeição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
