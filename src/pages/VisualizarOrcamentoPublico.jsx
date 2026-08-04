import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Loader2, CheckCircle2, XCircle, Printer, 
  Check, MessageSquare, ChevronRight, Info, X
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
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* SIDEBAR NAVIGATION - Azul Claro da Paleta (#009AC7) */}
      <aside className="w-full md:w-80 bg-[#009AC7] text-white flex flex-col justify-between shrink-0 p-5 h-auto md:h-screen md:sticky md:top-0 border-r border-[#0088b3] shadow-md">
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Logotipo & Brand Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/20 shrink-0">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="h-10 max-w-[170px] object-contain bg-white/95 p-1.5 rounded-lg shadow-xs" />
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-8 h-8 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M30 15 L65 50 L50 65 L15 30 Z" fill="#ffffff" />
                  <path d="M50 35 L85 70 L70 85 L35 50 Z" fill="#e0f2fe" opacity="0.95" />
                </svg>
                <div className="text-left">
                  <h2 className="font-extrabold text-sm tracking-wide text-white uppercase leading-tight">Clean Tech Pro</h2>
                  <span className="text-cyan-100 text-[9px] font-bold uppercase tracking-wider block">Orçamento &amp; Contrato</span>
                </div>
              </div>
            )}
          </div>

          {/* Proposal Number & Client Name */}
          <div className="mb-6 shrink-0 text-left">
            <span className="text-xxs font-black text-white bg-white/20 border border-white/30 px-2 py-0.5 rounded uppercase tracking-wider block w-max">
              Orçamento nº #{String(budget.id).padStart(4, '0')}
            </span>
            <h3 className="font-extrabold text-white text-sm mt-1.5 line-clamp-2 uppercase" title={budget.client_name}>
              {budget.client_name || 'Cliente'}
            </h3>
          </div>

          {/* Sidebar Menu Tabs */}
          <nav className="space-y-1.5 overflow-y-auto flex-1 pr-1 text-left">
            <button 
              onClick={() => setActiveTab('budget')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'budget' ? 'bg-white text-[#009AC7] shadow-md font-extrabold' : 'text-cyan-50 hover:bg-white/10 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>1. Orçamento Técnico</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'chat' ? 'bg-white text-[#009AC7] shadow-md font-extrabold' : 'text-cyan-50 hover:bg-white/10 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>2. Conversa &amp; Feedback</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </nav>
        </div>

        {/* Sidebar Decision/Status Footer */}
        <div className="mt-6 pt-4 border-t border-white/20 shrink-0 bg-[#009AC7] w-full">
          {isApproved ? (
            <div className="bg-white/20 border border-white/30 p-4 rounded-2xl text-center text-white">
              <CheckCircle2 className="w-8 h-8 text-white mx-auto mb-2 animate-bounce" />
              <span className="text-xxs font-black text-white uppercase tracking-widest block">Orçamento Aprovado</span>
              <p className="text-cyan-100 text-xxs mt-1 font-semibold leading-relaxed">
                Assinatura eletrônica registrada com sucesso.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={() => setIsApproveOpen(true)}
                className="w-full py-2.5 bg-white text-[#009AC7] hover:bg-slate-50 font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Aprovar Orçamento
              </button>
              <button 
                onClick={() => setIsRejectOpen(true)}
                className="w-full py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs border border-white/20 transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                Solicitar Ajustes
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100 overflow-y-auto">
        {/* Top Header Bar - Azul Claro (#009AC7) */}
        <div className="bg-[#009AC7] text-white px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
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
        </div>

        {/* Content Tabs - Online PDF Sheet */}
        <div className="p-4 md:p-8 flex-1">
          {activeTab === 'budget' && (
            <div className="max-w-[870px] mx-auto bg-white p-8 md:p-12 shadow-xl rounded-xl border border-gray-200 text-slate-800 text-xs leading-relaxed space-y-6 printable-page text-left">
              
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
                  <div><span className="font-bold text-slate-700">Serviço:</span> {budget.service_type || 'Manutenção'}</div>
                </div>
              </div>

              {/* Dados do Equipamento */}
              {(budget.equipment_name || budget.equipment_model) && (
                <div className="space-y-2 text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: primaryColor }}>
                    DADOS DO EQUIPAMENTO
                  </span>
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr style={{ backgroundColor: primaryColor }} className="text-white">
                        <th className="p-2 text-left font-bold">EQUIPAMENTO / ATIVO</th>
                        <th className="p-2 text-left font-bold">MARCA</th>
                        <th className="p-2 text-left font-bold">MODELO</th>
                        <th className="p-2 text-left font-bold">Nº DE SÉRIE</th>
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
              )}

              {/* 01 - Mão de Obra */}
              <div className="space-y-3 text-left">
                <h3 className="font-extrabold text-slate-900 border-b border-slate-200 pb-1 text-sm uppercase">
                  01 - MÃO DE OBRA E SERVIÇOS TÉCNICOS
                </h3>
                {laborItems.length === 0 ? (
                  <p className="text-slate-400 italic text-xs">Nenhum serviço técnico cadastrado.</p>
                ) : (
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                        <th className="p-2 text-left border border-slate-300">DESCRIÇÃO DO SERVIÇO</th>
                        <th className="p-2 text-center border border-slate-300 w-28">QTD (HORAS)</th>
                        <th className="p-2 text-right border border-slate-300 w-32">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {laborItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-semibold border border-slate-300">{item.description}</td>
                          <td className="p-2 text-center border border-slate-300">{item.hours} hrs</td>
                          <td className="p-2 text-right font-bold border border-slate-300">
                            R$ {Number((item.hours || 0) * (item.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 02 - Peças */}
              <div className="space-y-3 text-left">
                <h3 className="font-extrabold text-slate-900 border-b border-slate-200 pb-1 text-sm uppercase">
                  02 - PEÇAS E INSUMOS APLICADOS
                </h3>
                {partsItems.length === 0 ? (
                  <p className="text-slate-400 italic text-xs">Nenhuma peça ou insumo cadastrado neste orçamento.</p>
                ) : (
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold">
                        <th className="p-2 text-left border border-slate-300">NOME DA PEÇA / COMPONENTE</th>
                        <th className="p-2 text-center border border-slate-300 w-28">QUANTIDADE</th>
                        <th className="p-2 text-right border border-slate-300 w-32">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partsItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-semibold border border-slate-300">{item.part_name}</td>
                          <td className="p-2 text-center border border-slate-300">{item.quantity} un</td>
                          <td className="p-2 text-right font-bold border border-slate-300">
                            R$ {Number((item.quantity || 0) * (item.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Deslocamento */}
              {travelKm > 0 && (
                <div className="space-y-3 text-left">
                  <h3 className="font-extrabold text-slate-900 border-b border-slate-200 pb-1 text-sm uppercase">
                    03 - LOGÍSTICA E DESLOCAMENTO TÉCNICO
                  </h3>
                  <table className="w-full max-w-md border-collapse border border-slate-300 text-xs">
                    <tbody>
                      <tr>
                        <td className="p-2 font-bold bg-slate-50 border border-slate-300">Quilometragem Total</td>
                        <td className="p-2 border border-slate-300">{travelKm} km</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold bg-slate-50 border border-slate-300">Valor por Quilômetro</td>
                        <td className="p-2 border border-slate-300">R$ {Number(budget.price_per_km || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /km</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold bg-slate-50 border border-slate-300">Total Logística</td>
                        <td className="p-2 font-bold border border-slate-300">R$ {Number(budget.total_logistics || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Total Box */}
              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <div className="bg-[#EEF2FF] border border-slate-300 p-4 rounded-xl text-right max-w-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">VALOR TOTAL DO ORÇAMENTO</span>
                  <span className="text-xl font-extrabold" style={{ color: primaryColor }}>
                    R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Seller / Footer Block */}
              <div className="pt-4 border-t border-slate-200 flex items-end justify-between">
                <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg max-w-xs text-xs text-slate-800 font-medium text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: primaryColor }}>
                    Atenciosamente,
                  </span>
                  <p className="font-bold">Clean Tech Pro</p>
                  <p className="text-slate-500">Atendimento Técnico Especializado</p>
                </div>

                <div className="text-right text-[10px] text-slate-400 space-y-1">
                  <p className="font-bold text-slate-700">Clean Tech Smart</p>
                  <p>Avenida Maringá, 1273 – Pinhais/PR</p>
                  <p>Contato: (41) 9 8508-3658</p>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'chat' && (
            <div className="max-w-[870px] mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-4 text-left">
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
