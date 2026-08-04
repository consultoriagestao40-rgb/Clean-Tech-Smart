import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Loader2, CheckCircle2, XCircle, Printer, 
  Check, MessageSquare, ChevronRight, X
} from 'lucide-react';

export default function VisualizarOrcamentoPublico() {
  const { id } = useParams();
  const [budgetData, setBudgetData] = useState(null);
  const [activeTab, setActiveTab] = useState('budget'); // 'budget' | 'chat'
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
    fetchBudgetDetails();
  }, [id]);

  const fetchBudgetDetails = async () => {
    try {
      const res = await fetch(`/api/get-budget-details?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setBudgetData(data);
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
      alert('Por favor, descreva os ajustes solicitados.');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#009AC7] mx-auto" />
          <p className="text-sm font-medium">Carregando Orçamento Técnico...</p>
        </div>
      </div>
    );
  }

  if (error || !budgetData || !budgetData.budget) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md text-center text-white space-y-4">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold">Orçamento Indisponível</h2>
          <p className="text-xs text-slate-400">{error || 'O orçamento solicitado não foi encontrado.'}</p>
        </div>
      </div>
    );
  }

  const { budget, laborItems = [], partsItems = [], travelKm = 0 } = budgetData;
  const companyLogo = localStorage.getItem('app_company_logo') || '';
  const companyName = localStorage.getItem('app_company_name') || 'CLEAN TECH PRO';
  const companyCnpj = localStorage.getItem('app_company_cnpj') || '43.158.052/0001-01';
  const companyAddress = localStorage.getItem('app_company_address') || 'Avenida Maringá, 1273 – Emiliano Perneta Pinhais/PR, CEP 83325-212';
  const companyPhone = localStorage.getItem('app_company_phone') || '41 9 8508-3658';
  const companyEmail = localStorage.getItem('app_company_email') || 'vendas@cleantechpro.com.br';
  const primaryColor = localStorage.getItem('app_pdf_color') || '#009AC7';
  const emissao = new Date(budget.created_at || new Date()).toLocaleDateString('pt-BR');
  const isApproved = budget.status === 'Aprovado' || budget.status === 'Fechado';

  const laborTotal = laborItems.reduce((acc, item) => acc + ((item.hours || 0) * (item.unit_price || 0)), 0);
  const partsTotal = partsItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.unit_price || 0)), 0);
  const travelTotal = Number(budget.total_logistics || 0);
  const grandTotal = laborTotal + partsTotal + travelTotal;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* Print-only CSS to hide sidebar, top bar, and force 100% width document */}
      <style>{`
        @media print {
          header, aside, .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .printable-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          @page {
            margin: 10mm 12mm;
          }
        }
      `}</style>
      
      {/* 1. TOP HEADER BAR - FULL WIDTH ACROSS TOP (#009AC7) */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#009AC7] text-white px-6 flex items-center justify-between z-50 shadow-md no-print">
        <div className="flex items-center space-x-3 text-left">
          <span className="text-xs font-bold text-white">
            📄 Orçamento #{String(budget.id).padStart(4, '0')} &mdash; {budget.client_name || 'Clean Tech Pro'}
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 bg-white text-[#009AC7] hover:bg-slate-50 text-xs font-extrabold rounded-lg flex items-center space-x-2 transition-all shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Salvar / Imprimir como PDF</span>
        </button>
      </header>

      {/* 2. SIDEBAR NAVIGATION - BELOW THE TOP BAR (WHITE BG) */}
      <aside className="fixed top-14 left-0 w-72 bottom-0 bg-white border-r border-gray-200 p-5 flex flex-col justify-between z-40 overflow-y-auto no-print">
        <div className="flex-1 flex flex-col min-h-0 text-left">
          
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-3 pt-2">
            NAVEGAÇÃO DO ORÇAMENTO
          </span>

          {/* Proposal Navigation Tabs */}
          <nav className="space-y-1.5 flex-1 pr-1">
            <button
              onClick={() => setActiveTab('budget')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                activeTab === 'budget' 
                  ? 'bg-sky-50 text-[#009AC7] border-l-4 border-[#009AC7] shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>1. Orçamento Técnico</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                activeTab === 'chat' 
                  ? 'bg-sky-50 text-[#009AC7] border-l-4 border-[#009AC7] shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>2. Conversa &amp; Feedback</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </nav>
        </div>

        {/* Sidebar Decision/Status Footer */}
        <div className="pt-4 border-t border-gray-150 shrink-0 bg-white w-full">
          {isApproved ? (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <span className="text-xxs font-black text-emerald-700 uppercase tracking-wider block">Orçamento Aprovado</span>
              <p className="text-slate-500 text-[10px] mt-0.5 font-medium">Assinatura eletrônica registrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={() => setIsApproveOpen(true)}
                className="w-full py-2.5 bg-[#009AC7] hover:bg-[#0088b3] text-white font-extrabold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Aprovar Orçamento
              </button>
              <button 
                onClick={() => setIsRejectOpen(true)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                Solicitar Ajustes
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 3. MAIN CONTENT VIEWPORT */}
      <main className="pl-72 pt-14 min-h-screen bg-slate-100 p-6 flex justify-center">
        <div className="w-full max-w-[870px] my-4">
          {activeTab === 'budget' && (
            <div className="bg-white p-8 md:p-12 shadow-xl rounded-xl border border-gray-200 text-slate-800 text-xs leading-relaxed space-y-6 printable-page text-left">
              
              {/* Header with Logo */}
              <div className="flex items-center justify-between pb-5 border-b-2" style={{ borderColor: primaryColor }}>
                <div className="flex-1 text-center">
                  <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">{companyName}</h1>
                  <p className="text-[11px] font-bold text-slate-700 mt-1">CNPJ: {companyCnpj}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{companyAddress}</p>
                  <p className="text-[10px] text-slate-500">Telefone: {companyPhone} {companyEmail ? `· Email: ${companyEmail}` : ''}</p>
                </div>
                {companyLogo && (
                  <div className="w-44 flex justify-end">
                    <img src={companyLogo} alt="Logo" className="max-h-20 max-w-[180px] object-contain" />
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="text-center my-4 space-y-1">
                <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
                  PROPOSTA COMERCIAL DE PRESTAÇÃO DE SERVIÇOS
                </h2>
                <p className="text-xs font-bold text-slate-600">Proposta nº #{String(budget.id).padStart(4, '0')}</p>
                <p className="text-[11px] text-slate-400">Data: {emissao}</p>
              </div>

              {/* Dados do Cliente Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2" style={{ borderLeft: `4px solid ${primaryColor}` }}>
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: primaryColor }}>
                  DADOS DO CLIENTE
                </span>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  <div><span className="font-bold text-slate-700">Cliente:</span> {budget.client_name || 'Não informado'}</div>
                  <div><span className="font-bold text-slate-700">CNPJ/CPF:</span> {budget.client_document || '—'}</div>
                  <div><span className="font-bold text-slate-700">Endereço:</span> {budget.client_address || '—'}</div>
                  <div><span className="font-bold text-slate-700">Contato:</span> {budget.contact_name || '—'}</div>
                  <div><span className="font-bold text-slate-700">Telefone:</span> {budget.contact_info || '—'}</div>
                  <div><span className="font-bold text-slate-700">Serviço:</span> {budget.service_type || 'Venda'}</div>
                </div>
              </div>

              {/* Dados do Equipamento */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: primaryColor }}>
                  DADOS DO EQUIPAMENTO
                </span>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr style={{ backgroundColor: primaryColor }} className="text-white">
                      <th className="p-2 text-left font-bold uppercase text-[10px]">EQUIPAMENTO / ATIVO</th>
                      <th className="p-2 text-left font-bold uppercase text-[10px]">MARCA</th>
                      <th className="p-2 text-left font-bold uppercase text-[10px]">MODELO</th>
                      <th className="p-2 text-left font-bold uppercase text-[10px]">Nº DE SÉRIE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 font-semibold border border-slate-300">{budget.equipment_name || 'Nenhum equipamento associado'}</td>
                      <td className="p-2 border border-slate-300">{budget.equipment_brand || '—'}</td>
                      <td className="p-2 border border-slate-300">{budget.equipment_model || '—'}</td>
                      <td className="p-2 border border-slate-300">{budget.equipment_serial_number || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mão de Obra */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: primaryColor }}>
                  MÃO DE OBRA
                </span>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr style={{ backgroundColor: primaryColor }} className="text-white">
                      <th className="p-2 text-left font-bold uppercase text-[10px]">DESCRIÇÃO DO SERVIÇO</th>
                      <th className="p-2 text-center font-bold uppercase text-[10px] w-24">HORAS</th>
                      <th className="p-2 text-right font-bold uppercase text-[10px] w-32">VALOR/HORA</th>
                      <th className="p-2 text-right font-bold uppercase text-[10px] w-32">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laborItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-2 text-slate-400 italic border border-slate-300">Nenhum serviço cadastrado</td>
                      </tr>
                    ) : (
                      laborItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-semibold border border-slate-300">{item.description}</td>
                          <td className="p-2 text-center border border-slate-300">{item.hours}</td>
                          <td className="p-2 text-right border border-slate-300">R$ {Number(item.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-bold border border-slate-300">
                            R$ {Number((item.hours || 0) * (item.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Peças e Insumos */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: primaryColor }}>
                  PEÇAS E INSUMOS
                </span>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr style={{ backgroundColor: primaryColor }} className="text-white">
                      <th className="p-2 text-left font-bold uppercase text-[10px]">DESCRIÇÃO DA PEÇA</th>
                      <th className="p-2 text-center font-bold uppercase text-[10px] w-24">QTD.</th>
                      <th className="p-2 text-right font-bold uppercase text-[10px] w-32">VALOR UNIT.</th>
                      <th className="p-2 text-right font-bold uppercase text-[10px] w-32">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partsItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-2 text-slate-400 italic border border-slate-300">Nenhuma peça cadastrada</td>
                      </tr>
                    ) : (
                      partsItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-semibold border border-slate-300">{item.part_name}</td>
                          <td className="p-2 text-center border border-slate-300">{item.quantity}</td>
                          <td className="p-2 text-right border border-slate-300">R$ {Number(item.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 text-right font-bold border border-slate-300">
                            R$ {Number((item.quantity || 0) * (item.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Deslocamento / Logística */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: primaryColor }}>
                  DESLOCAMENTO / LOGÍSTICA
                </span>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr style={{ backgroundColor: primaryColor }} className="text-white">
                      <th className="p-2 text-center font-bold uppercase text-[10px]">KM INICIAL</th>
                      <th className="p-2 text-center font-bold uppercase text-[10px]">KM FINAL</th>
                      <th className="p-2 text-center font-bold uppercase text-[10px]">DISTÂNCIA</th>
                      <th className="p-2 text-right font-bold uppercase text-[10px]">VALOR/KM</th>
                      <th className="p-2 text-right font-bold uppercase text-[10px]">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 text-center border border-slate-300">{budget.initial_km || 0}</td>
                      <td className="p-2 text-center border border-slate-300">{budget.final_km || 0}</td>
                      <td className="p-2 text-center border border-slate-300">{travelKm} km</td>
                      <td className="p-2 text-right border border-slate-300">R$ {Number(budget.price_per_km || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right font-bold border border-slate-300">R$ {travelTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Observações */}
              {budget.notes && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 text-left text-xs space-y-1">
                  <span className="font-bold text-amber-900 uppercase text-[10px] block">OBSERVAÇÕES:</span>
                  <p className="text-amber-900 font-semibold whitespace-pre-wrap">{budget.notes}</p>
                </div>
              )}

              {/* Resumo Financeiro Box (Solid Cyan #009AC7) */}
              <div className="pt-4 flex justify-end">
                <div className="bg-[#009AC7] text-white p-5 rounded-2xl text-right w-72 shadow-md space-y-2 text-xs">
                  <span className="font-bold uppercase tracking-wider text-cyan-100 text-[10px] block border-b border-white/20 pb-1">
                    RESUMO FINANCEIRO
                  </span>
                  <div className="flex justify-between text-cyan-50">
                    <span>Mão de Obra</span>
                    <span className="font-bold">R$ {laborTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-cyan-50">
                    <span>Peças e Insumos</span>
                    <span className="font-bold">R$ {partsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-cyan-50">
                    <span>Deslocamento</span>
                    <span className="font-bold">R$ {travelTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t border-white/30 pt-2 flex justify-between items-center text-sm">
                    <span className="font-black text-white uppercase">Total Geral</span>
                    <span className="font-extrabold text-white text-base">R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Footer Block */}
              <div className="pt-4 border-t border-slate-200 flex items-end justify-between text-left">
                <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg max-w-xs text-xs text-slate-800 font-medium">
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: primaryColor }}>
                    Atenciosamente,
                  </span>
                  <p className="font-bold">Clean Tech Pro</p>
                  <p className="text-slate-500">Atendimento Técnico Especializado</p>
                </div>

                <div className="text-right text-[10px] text-slate-400 space-y-1">
                  <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" className="h-8 object-contain ml-auto mb-1" />
                  <p className="font-bold text-slate-700">Clean Tech Smart</p>
                  <p>Avenida Maringá, 1273 – Pinhais/PR</p>
                  <p>Contato: (41) 9 8508-3658</p>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-4 text-left">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Conversa &amp; Observações</h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                {budget.notes || 'Sem observações registradas.'}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL APPROVE */}
      {isApproveOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 space-y-4 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-[#009AC7]" />
                <span>Aprovar e Assinar Orçamento</span>
              </h3>
              <button onClick={() => setIsApproveOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApprove} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo do Responsável *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sandro / Deborah Cristina"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  placeholder="Ex: 59.563.026/0001-90"
                  value={signerDocument}
                  onChange={e => setSignerDocument(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApproveOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#009AC7] hover:bg-[#0088b3] text-white font-bold rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Assinando...' : 'Confirmar Aprovação'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REJECT / ADJUST */}
      {isRejectOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 space-y-4 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                <span>Solicitar Ajustes no Orçamento</span>
              </h3>
              <button onClick={() => setIsRejectOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Descreva as alterações ou negociações desejadas *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ex: Solicitamos alteração nos prazos ou peças..."
                  value={feedbackNotes}
                  onChange={e => setFeedbackNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar Observações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
