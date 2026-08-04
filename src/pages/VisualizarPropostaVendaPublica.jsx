import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Loader2, CheckCircle2, XCircle, Printer, Clock, 
  HelpCircle, Shield, Check, FileCheck, ArrowRight, MessageSquare, 
  ChevronRight, ChevronLeft, Play, Info, Briefcase, FileSignature, X
} from 'lucide-react';

export default function VisualizarPropostaVendaPublica() {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [activeTab, setActiveTab] = useState('proposal'); // 'proposal' | 'specs' | 'chat'
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

  useEffect(() => {
    fetchProposalDetails();
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
      const res = await fetch(`/api/get-sales-proposal-details?id=${id}`);
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

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!signerName.trim()) {
      alert('Por favor, informe seu nome para assinar.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/approve-sales-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          feedback: `Proposta de Venda aprovada e assinada por ${signerName}${signerDocument ? ` (${signerDocument})` : ''}`
        })
      });
      if (res.ok) {
        setIsApproveOpen(false);
        fetchProposalDetails();
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
      const res = await fetch('/api/approve-sales-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          feedback: `[Solicitação de Ajustes]: ${feedbackNotes}`
        })
      });
      if (res.ok) {
        setIsRejectOpen(false);
        setFeedbackNotes('');
        fetchProposalDetails();
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
          <p className="text-sm font-medium">Carregando Proposta de Venda...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md text-center text-white space-y-4">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold">Proposta de Venda Indisponível</h2>
          <p className="text-xs text-slate-400">{error || 'A proposta solicitada não foi encontrada.'}</p>
        </div>
      </div>
    );
  }

  const p = proposal;
  const companyLogo = localStorage.getItem('app_company_logo') || '';
  const companyName = localStorage.getItem('app_company_name') || 'CLEAN TECH SMART';
  const companyCnpj = localStorage.getItem('app_company_cnpj') || '00.000.000/0001-00';
  const companyAddress = localStorage.getItem('app_company_address') || 'Rua Barão de Campinas, 715 - São Paulo, SP';
  const companyPhone = localStorage.getItem('app_company_phone') || '(11) 3320-8550';
  const companyEmail = localStorage.getItem('app_company_email') || 'info.brasil@tennantco.com';
  const primaryColor = localStorage.getItem('app_pdf_color') || '#009AC7';
  const emissao = new Date(p.created_at || new Date()).toLocaleDateString('pt-BR');
  const isApproved = p.status === 'Aprovada' || p.status === 'Fechada';

  const firstImage = p.machine_image ? p.machine_image.split('\n')[0].trim() : '';

  const parseSpecsToHTML = (rawSpecs) => {
    if (!rawSpecs) return '<p>Sem especificações cadastradas.</p>';
    let htmlContent = rawSpecs;
    if (rawSpecs.includes('{') && rawSpecs.includes('}')) {
      try {
        const parsed = JSON.parse(rawSpecs);
        if (Array.isArray(parsed)) {
          return `<ul style="list-style: none; padding: 0;">${parsed.map(item => `<li style="padding: 4px 0; border-bottom: 1px solid #f1f5f9;"><strong>${item.label || item.key}:</strong> ${item.value}</li>`).join('')}</ul>`;
        }
      } catch (e) {}
    }
    return htmlContent.replace(/\n/g, '<br/>');
  };

  const specsHTML = parseSpecsToHTML(p.machine_description);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* SIDEBAR NAVIGATION (Identical to VisualizarPropostaPublica) */}
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
              <span className="text-blue-300 text-[9px] font-bold uppercase tracking-wider block">Orçamento &amp; Contrato</span>
            </div>
          </div>

          <div className="mb-6 shrink-0">
            <span className="text-xxs font-black text-blue-400 bg-blue-950/70 border border-blue-900/50 px-2 py-0.5 rounded uppercase tracking-wider block w-max">
              Proposta de Venda nº #{String(p.id).padStart(4, '0')}
            </span>
            <h3 className="font-extrabold text-gray-100 text-sm mt-1.5 line-clamp-2 uppercase" title={p.client_razao_social || p.client_name}>
              {p.client_razao_social || p.client_name}
            </h3>
          </div>

          {/* Sidebar Menu Tabs */}
          <nav className="space-y-1.5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
            <button 
              onClick={() => setActiveTab('proposal')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'proposal' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>1. Proposta Comercial</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setActiveTab('specs')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'specs' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4" />
                <span>2. Ficha Técnica</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>3. Conversa &amp; Feedback</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </nav>
        </div>

        {/* Sidebar Decision/Status Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 shrink-0 bg-blue-900 w-full">
          {isApproved ? (
            <div className="bg-emerald-950/40 border border-emerald-900/60 p-4 rounded-2xl text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
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
                A validade desta proposta comercial expirou.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={() => setIsApproveOpen(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Aprovar Proposta
              </button>
              <button 
                onClick={() => setIsRejectOpen(true)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                Recusar / Pedir Ajustes
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-100 overflow-y-auto">
        {/* Top Header Bar with Print Button */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700">STATUS DO ORÇAMENTO:</span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {p.status || 'Rascunho'}
            </span>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg transition-all shadow-xs flex items-center space-x-2"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir / PDF</span>
          </button>
        </div>

        {/* Content Tabs */}
        <div className="p-4 md:p-8 flex-1">
          {activeTab === 'proposal' && (
            <div className="max-w-[870px] mx-auto bg-white p-8 md:p-12 shadow-xl rounded-xl border border-gray-200 text-slate-800 text-xs leading-relaxed space-y-6 printable-page">
              
              {/* 1. Header with Company Logo & Data */}
              <div className="flex items-center justify-between pb-5 border-b-2" style={{ borderColor: primaryColor }}>
                <div className="flex-1 text-left">
                  <h1 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">{companyName}</h1>
                  <p className="text-[11px] font-bold text-slate-700 mt-0.5">CNPJ: {companyCnpj}</p>
                  <p className="text-[10px] text-slate-500">{companyAddress}</p>
                  <p className="text-[10px] text-slate-500">Telefone: {companyPhone} {companyEmail ? `· Email: ${companyEmail}` : ''}</p>
                </div>
                {companyLogo && (
                  <div className="w-44 flex justify-end">
                    <img src={companyLogo} alt="Logo" className="max-h-20 max-w-[170px] object-contain" />
                  </div>
                )}
              </div>

              {/* 2. Proposal Title & Client Box */}
              <div className="text-center space-y-1 py-1">
                <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
                  PROPOSTA COMERCIAL DE VENDA DE EQUIPAMENTOS
                </h2>
                <p className="text-xs font-bold text-slate-600">Proposta nº #{String(p.id).padStart(4, '0')}</p>
                <p className="text-[11px] text-slate-400">Data de Emissão: {emissao}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2" style={{ borderLeft: `4px solid ${primaryColor}` }}>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: primaryColor }}>
                  Dados do Cliente
                </span>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  <div><span className="font-bold text-slate-700">Cliente:</span> {p.client_razao_social || p.client_name || 'Não informado'}</div>
                  <div><span className="font-bold text-slate-700">CNPJ/CPF:</span> {p.client_cnpj || '—'}</div>
                  <div><span className="font-bold text-slate-700">Endereço:</span> {p.client_address || '—'}</div>
                  <div><span className="font-bold text-slate-700">Contato:</span> {p.client_contact || '—'}</div>
                  <div><span className="font-bold text-slate-700">Telefone:</span> {p.client_phone || '—'}</div>
                  <div><span className="font-bold text-slate-700">Serviço:</span> Venda de Equipamento</div>
                </div>
              </div>

              {/* 3. Equipment Info & Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start py-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 border-b pb-1 mb-2">
                    {p.machine_name || 'Equipamento'}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: primaryColor }}>
                    Especificações Técnicas
                  </span>
                  <div className="text-xs text-slate-700 leading-snug space-y-1" dangerouslySetInnerHTML={{ __html: specsHTML }} />
                </div>

                {firstImage && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-center h-56">
                    <img src={firstImage} alt={p.machine_name} className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>

              {/* 4. Commercial Conditions Table */}
              <div className="pt-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider mb-3 font-serif" style={{ color: primaryColor }}>
                  VALORES E CONDIÇÕES DE VENDA
                </h3>

                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <tbody>
                    <tr>
                      <td className="w-48 p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Preço FOB</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.fob_price || 'A consultar'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Preço CIF</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.cif_price || 'A consultar'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Impostos</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.taxes_info || 'Conforme texto abaixo'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Valor da Proposta</td>
                      <td className="p-2.5 font-extrabold text-slate-900 border border-slate-300 bg-[#EEF2FF]">{p.proposal_value ? `R$ ${p.proposal_value}` : ''}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Forma de Pagamento</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.payment_terms || ''}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Prazo de entrega</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.delivery_time || ''}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Garantia</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.warranty || '12 Meses'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Validade da proposta</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.validity_days || '10 Dias'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-[#EEF2FF]"></td>
                      <td className="p-3 text-slate-800 border border-slate-300 bg-[#EEF2FF] align-top whitespace-pre-wrap min-h-[70px]">
                        {p.notes || '(Insira aqui o texto)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 5. Legal Terms Text */}
              <div className="text-[10px] text-slate-700 leading-relaxed text-justify space-y-2 italic">
                <p>
                  Todos os pedidos estão sujeitos aos nossos termos e condições gerais que se encontram registrados perante o <strong className="font-bold text-slate-900">9º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica da Capital – São Paulo</strong>, cuja cópia digitalizada está disponível no site: <u>www.alfatennant.com.br/terms</u> e também por e-mail ou correio quando solicitada. Os valores acima definidos englobam <strong className="font-bold text-slate-900">única e exclusivamente os impostos, taxas e demais encargos fiscais e tributários</strong>, incidentes nas alíquotas vigentes no Estado de origem (São Paulo) <strong className="font-bold text-slate-900">de responsabilidade da TENNANT COMPANY</strong>. Os demais tributos, inclusive os diferenciais de alíquota, que a lei atribuir como <strong className="font-bold text-slate-900">responsabilidade do comprador</strong>, quer por sua localização, quer por sua classificação (consumidor final, regime do simples, revenda, não contribuinte, dentre outros) não acarretarão quaisquer descontos nos valores acima definidos, nem mesmo serão atribuídas quaisquer responsabilidades pelo seu pagamento à <strong className="font-bold text-slate-900">TENNANT COMPANY</strong>.
                </p>
                <p className="pt-2 not-italic text-xs text-slate-800">
                  Agradecemos mais uma vez a oportunidade e nos colocamos à disposição para maiores esclarecimentos.
                </p>
              </div>

              {/* 6. Signature / Seller Block */}
              <div className="pt-3 border-t border-slate-200">
                <p className="font-semibold text-xs text-slate-800 mb-2">Atenciosamente,</p>
                <div className="bg-[#EEF2FF] border border-slate-300 p-3.5 rounded-lg max-w-xs text-xs text-slate-800 whitespace-pre-wrap font-medium">
                  {p.seller_info || '(Insira os dados do vendedor aqui)'}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-[870px] mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Ficha Técnica Detalhada do Equipamento</h3>
              <div className="text-xs text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: specsHTML }} />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="max-w-[870px] mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Conversa &amp; Observações</h3>
              <p className="text-xs text-slate-500">Histórico de observações e alinhamento comercial com o cliente.</p>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                {p.notes || 'Sem observações registradas.'}
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
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span>Aprovar e Assinar Proposta de Venda</span>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CPF ou CNPJ</label>
                <input
                  type="text"
                  placeholder="Ex: 59.563.026/0001-90"
                  value={signerDocument}
                  onChange={e => setSignerDocument(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
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
                <span>Solicitar Ajustes na Proposta</span>
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
                  placeholder="Ex: Solicitamos alteração na forma de pagamento ou desconto para pagamento à vista..."
                  value={feedbackNotes}
                  onChange={e => setFeedbackNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
