import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Loader2, CheckCircle2, XCircle, Printer, Clock, 
  HelpCircle, Shield, Check, FileCheck, ArrowRight, MessageSquare, 
  ChevronRight, Play, Info, Briefcase, FileSignature 
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

  useEffect(() => {
    fetchProposalDetails();
    fetchTemplates();
  }, [id]);

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
      const auditLog = `Aprovado por: ${signerName}${signerDocument ? ` (CPF/CNPJ: ${signerDocument})` : ''}`;
      const res = await fetch('/api/approve-rental-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'Fechada',
          approved_by: signerName + (signerDocument ? ` (${signerDocument})` : ''),
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

  const parseSpecsToHTML = (specsText) => {
    if (!specsText) return <p className="text-xs text-gray-400">Nenhuma especificação disponível.</p>;
    return specsText.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <div key={idx} className="flex items-start py-1 text-xs text-gray-700 gap-2">
            <span className="text-blue-500 font-extrabold">•</span>
            <span>{trimmed.substring(1).trim()}</span>
          </div>
        );
      }
      return <p key={idx} className="text-xs text-gray-800 py-1 font-semibold">{trimmed}</p>;
    });
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
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* SIDEBAR NAVIGATION (equal to smartbid) */}
      <aside className="w-full md:w-80 bg-slate-900 text-white flex flex-col justify-between shrink-0 p-5 md:min-h-screen border-r border-slate-800">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-md">
              CT
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide text-white uppercase">Clean Tech Smart</h2>
              <span className="text-slate-500 text-xxs font-bold uppercase tracking-wider block">Orçamento & Contrato</span>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-xxs font-black text-blue-400 bg-blue-950/70 border border-blue-900/50 px-2 py-0.5 rounded uppercase tracking-wider block w-max">
              Proposta nº #{String(p.id).padStart(4, '0')}
            </span>
            <h3 className="font-extrabold text-gray-100 text-sm mt-1.5 line-clamp-2 uppercase" title={p.client_name}>
              {p.client_name}
            </h3>
          </div>

          {/* Sidebar Menu Tabs */}
          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveTab('presentation')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'presentation' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4" />
                <span>1. Apresentação do Catálogo</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform`} />
            </button>

            <button 
              onClick={() => setActiveTab('proposal')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'proposal' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>2. Proposta Comercial</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform`} />
            </button>

            <button 
              onClick={() => setActiveTab('minuta')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'minuta' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <FileSignature className="w-4 h-4" />
                <span>3. Minuta de Contrato</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform`} />
            </button>

            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>4. Conversa & Feedback</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform`} />
            </button>
          </nav>
        </div>

        {/* Sidebar Decision/Status Footer */}
        <div className="mt-8 pt-5 border-t border-slate-800">
          {isApproved ? (
            <div className="bg-emerald-950/60 border border-emerald-800 p-4 rounded-2xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span className="text-xxs font-black text-emerald-400 uppercase tracking-widest block">Proposta Aprovada</span>
              <p className="text-slate-400 text-xxs mt-1 font-semibold leading-relaxed">
                Assinatura eletrônica registrada com sucesso no sistema.
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
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4 text-red-500" />
                Solicitar Ajustes
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 bg-slate-50 p-6 md:p-10 min-h-screen overflow-y-auto">
        
        {/* TAB 1: PRESENTATION & CATALOG SPECIFICATIONS */}
        {activeTab === 'presentation' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
              <div className="h-[360px] bg-white rounded-xl border border-gray-100 flex items-center justify-center p-6 mb-6">
                <img 
                  src={p.machine_photos?.[0] || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600'} 
                  alt={p.machine_name} 
                  className="max-h-full max-w-full object-contain hover:scale-102 transition-transform duration-200" 
                />
              </div>

              <div className="border-b border-gray-100 pb-4 mb-4">
                <span className="text-xxs font-black text-blue-600 bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded uppercase tracking-wider">
                  Equipamento Disponibilizado
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-2 uppercase tracking-wide">{p.machine_name || 'Equipamento'}</h2>
                <p className="text-xs text-gray-500 leading-relaxed mt-2 font-medium">
                  Equipamento de alta qualidade e rendimento, ideal para processos contínuos de higienização de pisos. Projetado especificamente para operações contínuas com alta durabilidade e baixos custos operacionais.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/30 flex items-center gap-3">
                  <span className="p-2 bg-blue-100/50 text-blue-600 rounded-lg text-xs font-black">✔</span>
                  <div>
                    <span className="text-xxs font-bold text-gray-400 block uppercase tracking-wider">Revisão Geral</span>
                    <span className="text-xs font-bold text-gray-700">100% Inspecionado</span>
                  </div>
                </div>
                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/30 flex items-center gap-3">
                  <span className="p-2 bg-blue-100/50 text-blue-600 rounded-lg text-xs font-black">✔</span>
                  <div>
                    <span className="text-xxs font-bold text-gray-400 block uppercase tracking-wider">Suporte Técnico</span>
                    <span className="text-xs font-bold text-gray-700">Atendimento 24/7</span>
                  </div>
                </div>
                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/30 flex items-center gap-3">
                  <span className="p-2 bg-blue-100/50 text-blue-600 rounded-lg text-xs font-black">✔</span>
                  <div>
                    <span className="text-xxs font-bold text-gray-400 block uppercase tracking-wider">Frota Backup</span>
                    <span className="text-xs font-bold text-gray-700">Substituição Imediata</span>
                  </div>
                </div>
              </div>

              {/* Specifications Box */}
              <div>
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Especificações Técnicas Completas</h3>
                <div className="bg-slate-50 border border-gray-100 rounded-xl p-4 space-y-1">
                  {parseSpecsToHTML(p.machine_specs)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMMERCIAL PROPOSAL DETAILS (WITHOUT TECHNICAL SPECS BOX) */}
        {activeTab === 'proposal' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150 text-left">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Core Pricing Info */}
              <div className="md:col-span-5 space-y-6">
                
                {/* Investment Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
                  <span className="text-xxs font-black text-blue-400 bg-blue-950/70 border border-blue-900 px-2 py-0.5 rounded uppercase tracking-wider">
                    Resumo do Aluguel
                  </span>
                  
                  <div className="mt-4">
                    <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Valor Mensal</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-bold text-slate-400">R$</span>
                      <span className="text-3xl font-black text-white">
                        {Number(p.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-slate-400">/mês</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-left">
                    <div>
                      <span className="text-xxs text-slate-400 font-bold block uppercase tracking-wider font-mono">Período</span>
                      <span className="text-xs font-bold mt-1 block text-slate-200">{formatPeriod(p.period_months)}</span>
                    </div>
                    <div>
                      <span className="text-xxs text-slate-400 font-bold block uppercase tracking-wider font-mono">Franquia</span>
                      <span className="text-xs font-bold mt-1 block text-slate-200">{p.hours_per_month || 'Livre'} h/mês</span>
                    </div>
                  </div>
                </div>

                {/* General Conditions */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-3.5">
                  <h4 className="text-xxs font-black text-gray-400 uppercase tracking-widest mb-2">Condições Comerciais</h4>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-gray-500">Região</span>
                    <span className="text-xs font-black text-gray-800">{p.region_used || 'Estado de São Paulo'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-gray-500">Entrega</span>
                    <span className="text-xs font-black text-gray-800">{p.delivery_time || 'Imediato'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-gray-500">Frete</span>
                    <span className="text-xs font-black text-gray-800">
                      {Number(p.freight_cost) > 0 ? `R$ ${Number(p.freight_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Incluso'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-xs font-bold text-gray-500">Validade</span>
                    <span className="text-xs font-black text-gray-800">{p.validity_days || '10'} dias</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Client details and plan comparison */}
              <div className="md:col-span-7 space-y-6">
                
                {/* Client Box */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-xxs font-black text-gray-400 uppercase tracking-widest mb-4">Dados de Faturamento</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 font-bold block uppercase tracking-wider">Locatária</span>
                      <span className="text-gray-800 font-bold mt-0.5 block">{p.client_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block uppercase tracking-wider">CNPJ/CPF</span>
                      <span className="text-gray-800 font-mono font-semibold mt-0.5 block">{p.client_document || '&mdash;'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block uppercase tracking-wider">Endereço</span>
                      <span className="text-gray-800 font-semibold mt-0.5 block">{p.client_address || '&mdash;'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block uppercase tracking-wider">Contato Comercial</span>
                      <span className="text-gray-800 font-semibold mt-0.5 block">{p.client_phone || p.client_email || '&mdash;'}</span>
                    </div>
                  </div>

                  {p.notes && (
                    <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl mt-4">
                      <span className="text-xxs font-black text-gray-400 uppercase tracking-widest block mb-1">Notas Comerciais</span>
                      <p className="text-xs text-gray-600 font-semibold leading-relaxed">{p.notes}</p>
                    </div>
                  )}
                </div>

                {/* Highlighted Plans Comparison table */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-xxs font-black text-gray-400 uppercase tracking-widest mb-3">Plano de Cobertura de Manutenção</h4>
                  <div className="border border-gray-150 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-250">
                        <tr>
                          <th className="px-4 py-2.5 font-bold text-gray-700">Tipo de Contrato</th>
                          <th className="px-4 py-2.5 font-bold text-gray-700">Cobertura</th>
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
                            <tr key={plan.id} className={`transition-colors ${isSel ? 'bg-amber-50 font-bold' : 'hover:bg-gray-50/20 text-gray-500'}`}>
                              <td className={`px-4 py-3 border-r border-gray-100 ${isSel ? 'text-amber-800 font-extrabold' : 'text-gray-900 font-semibold'}`}>
                                {isSel && '★ '}
                                {plan.title}
                              </td>
                              <td className={`px-4 py-3 ${isSel ? 'text-amber-950 font-medium' : 'text-gray-500'}`}>
                                {plan.desc}
                                {isSel && <span className="block mt-1 text-xxs font-black text-amber-800 bg-amber-100/60 border border-amber-200/50 px-2 py-0.5 rounded w-max uppercase tracking-wider">Selecionado</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 3: CONTRACT DRAFT MINUTA (15 CLAUSES SCROLLABLE PAGE) */}
        {activeTab === 'minuta' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
            <div className="bg-white border border-gray-250 shadow-md rounded-2xl p-8 md:p-12 text-left relative overflow-hidden font-serif leading-relaxed">
              
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
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150 text-left">
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
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
              {!isApproved && (
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

      </main>

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
