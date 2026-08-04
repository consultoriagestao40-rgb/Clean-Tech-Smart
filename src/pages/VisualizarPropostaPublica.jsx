import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Loader2, CheckCircle2, XCircle, Printer, Clock, 
  Check, ArrowRight, MessageSquare, ChevronRight, Info, FileSignature, X 
} from 'lucide-react';

export default function VisualizarPropostaPublica() {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [activeTab, setActiveTab] = useState('proposal'); // 'presentation' | 'proposal' | 'minuta' | 'chat'
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
        setActiveTab('proposal');
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

  const formatPeriod = (months) => {
    const m = Number(months);
    if (m === 1) return 'Diário (1 dia)';
    if (m === 7) return 'Semanal (7 dias)';
    if (m === 15) return 'Quinzenal (15 dias)';
    if (m === 30) return 'Mensal Avulso';
    return `${m} Meses`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#009AC7] mx-auto" />
          <p className="text-sm font-medium">Carregando Proposta de Locação...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md text-center text-white space-y-4">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold">Proposta de Locação Indisponível</h2>
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

  const photoArray = p.machine_photo_urls || [];
  const mainPhoto = photoArray[0] || p.machine_image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800';

  const parseSpecsToHTML = (rawSpecs) => {
    if (!rawSpecs) return <p className="text-slate-400 italic text-xs">Consulte a ficha técnica anexa.</p>;
    return rawSpecs.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1.5" />;
      if (trimmed.includes(':')) {
        const [key, ...valParts] = trimmed.split(':');
        const val = valParts.join(':').trim();
        const cleanKey = key.replace(/^[-\s*•]+/, '').trim();
        return (
          <div key={idx} className="flex border-b border-slate-100 py-1.5 text-xs hover:bg-slate-50/50">
            <span className="font-semibold text-slate-500 w-1/2">{cleanKey}</span>
            <span className="text-slate-900 w-1/2 font-bold">{val}</span>
          </div>
        );
      }
      return (
        <div key={idx} className="flex items-start py-1 text-xs text-slate-700">
          <span className="text-[#009AC7] mr-2 font-bold">•</span>
          <span className="font-medium text-slate-800">{trimmed.replace(/^[-\s*•]+/, '')}</span>
        </div>
      );
    });
  };

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
              Proposta nº #{String(p.id).padStart(4, '0')}
            </span>
            <h3 className="font-extrabold text-white text-sm mt-1.5 line-clamp-2 uppercase" title={p.client_razao_social || p.client_name}>
              {p.client_razao_social || p.client_name}
            </h3>
          </div>

          {/* Sidebar Menu Tabs */}
          <nav className="space-y-1.5 overflow-y-auto flex-1 pr-1 text-left">
            <button 
              onClick={() => setActiveTab('presentation')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'presentation' ? 'bg-white text-[#009AC7] shadow-md font-extrabold' : 'text-cyan-50 hover:bg-white/10 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4" />
                <span>1. Apresentação do Catálogo</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setActiveTab('proposal')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'proposal' ? 'bg-white text-[#009AC7] shadow-md font-extrabold' : 'text-cyan-50 hover:bg-white/10 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>2. Proposta Comercial</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setActiveTab('minuta')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'minuta' ? 'bg-white text-[#009AC7] shadow-md font-extrabold' : 'text-cyan-50 hover:bg-white/10 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <FileSignature className="w-4 h-4" />
                <span>3. Minuta de Contrato</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeTab === 'chat' ? 'bg-white text-[#009AC7] shadow-md font-extrabold' : 'text-cyan-50 hover:bg-white/10 hover:text-white'}`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>4. Conversa &amp; Feedback</span>
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
              <span className="text-xxs font-black text-white uppercase tracking-widest block">Proposta Aprovada</span>
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
                Aprovar Proposta
              </button>
              <button 
                onClick={() => setIsRejectOpen(true)}
                className="w-full py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs border border-white/20 transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
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
              📄 Proposta de Locação #{String(p.id).padStart(4, '0')} &mdash; {p.client_razao_social || p.client_name}
            </span>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-white text-[#009AC7] hover:bg-slate-50 text-xs font-extrabold rounded-lg flex items-center space-x-2 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Salvar / Imprimir PDF</span>
          </button>
        </div>

        {/* Content Tabs - PDF Sheet Online */}
        <div className="p-4 md:p-8 flex-1">
          {activeTab === 'proposal' && (
            <div className="max-w-[870px] mx-auto bg-white p-8 md:p-12 shadow-xl rounded-xl border border-gray-200 text-slate-800 text-xs leading-relaxed space-y-8 printable-page text-left">
              
              {/* PAGE 1: Presentation & Technical Specs */}
              <div>
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

                {/* Proposal Title */}
                <div className="text-center my-6 space-y-1">
                  <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
                    PROPOSTA COMERCIAL DE LOCAÇÃO DE EQUIPAMENTOS
                  </h2>
                  <p className="text-xs font-bold text-slate-600">Proposta nº #{String(p.id).padStart(4, '0')}</p>
                  <p className="text-[11px] text-slate-400">Data: {emissao}</p>
                </div>

                {/* Client Data Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 mb-8" style={{ borderLeft: `4px solid ${primaryColor}` }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: primaryColor }}>
                    Dados do Cliente
                  </span>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    <div><span className="font-bold text-slate-700">Cliente:</span> {p.client_razao_social || p.client_name || 'Não informado'}</div>
                    <div><span className="font-bold text-slate-700">CNPJ/CPF:</span> {p.client_document || '—'}</div>
                    <div><span className="font-bold text-slate-700">Endereço:</span> {p.client_address || '—'}</div>
                    <div><span className="font-bold text-slate-700">Contato:</span> {p.client_contact || (p.client_email ? p.client_email.split('@')[0] : '—')}</div>
                    <div><span className="font-bold text-slate-700">Telefone:</span> {p.client_phone || p.client_email || '—'}</div>
                    <div><span className="font-bold text-slate-700">Serviço:</span> Locação de Equipamento</div>
                  </div>
                </div>

                {/* 01 - DO OBJETO E ESCOPO */}
                <div className="space-y-4 text-left">
                  <h3 className="font-extrabold text-slate-900 border-b border-slate-200 pb-1 text-sm uppercase">
                    01 - DO OBJETO E ESCOPO
                  </h3>
                  <p className="text-xs text-slate-700 font-medium">
                    1.1. Constitui objeto desta Proposta Comercial a locação temporária do seguinte equipamento de alta performance:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
                    {/* Equipment Image: Floating without background box, vertically centered */}
                    <div className="flex items-center justify-center self-center h-full w-full py-2">
                      <img
                        src={mainPhoto}
                        alt={p.machine_name}
                        className="max-h-[300px] w-auto max-w-full object-contain mix-blend-multiply"
                        style={{ mixBlendMode: 'multiply' }}
                      />
                    </div>

                    {/* Technical Specs & Equipment Name */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-extrabold text-slate-900 border-b-2 pb-1.5 uppercase" style={{ borderColor: primaryColor }}>
                        {p.machine_name || 'Equipamento'}
                      </h4>
                      <p className="text-[11px] text-slate-500 italic leading-snug">
                        {p.machine_technical_description || 'Equipamento de alta qualidade e rendimento, ideal para processos contínuos de higienização de pisos.'}
                      </p>
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: primaryColor }}>
                          Especificações Técnicas
                        </span>
                        <div className="space-y-1">
                          {parseSpecsToHTML(p.machine_technical_description)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* PAGE 2: Financial Terms & Conditions */}
              <div className="pt-8 border-t border-slate-200 space-y-6 text-left">
                <h3 className="text-sm font-extrabold uppercase tracking-wider font-serif" style={{ color: primaryColor }}>
                  Valores e Condições de Locação
                </h3>

                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <tbody>
                    <tr>
                      <td className="w-48 p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Valor Mensal</td>
                      <td className="p-2.5 font-extrabold text-slate-900 border border-slate-300 bg-[#EEF2FF]" style={{ color: primaryColor }}>
                        R$ {Number(p.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / mês
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Tipo de Contrato*</td>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.contract_type || '0 - Sem Cobertura'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Período de Locação</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{formatPeriod(p.period_months)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Horas/Mês</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.hours_per_month || 'Livre'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Região Utilizada</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.region_used || 'São Paulo'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Tempo de Entrega</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.delivery_time || 'A combinar'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Custo do Frete</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">
                        {Number(p.freight_cost) > 0 ? `R$ ${Number(p.freight_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Incluso'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">Validade da proposta</td>
                      <td className="p-2.5 font-semibold text-slate-800 border border-slate-300 bg-[#EEF2FF]">{p.validity_days || '10 dias'}</td>
                    </tr>
                    {p.notes && (
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800 border border-slate-300 bg-white">OBSERVAÇÃO</td>
                        <td className="p-2.5 font-normal text-slate-700 border border-slate-300 bg-[#EEF2FF] whitespace-pre-wrap">{p.notes}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <p className="text-[10px] text-slate-600 leading-relaxed text-justify italic">
                  Todos os pedidos estão sujeitos aos nossos termos e condições gerais que se encontram registrados perante o <strong className="font-bold text-slate-900">3º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica da Capital – São Paulo</strong>, cuja cópia digitalizada está disponível no site: <u>www.alfatennant.com.br/terms</u> e também por e-mail ou correio quando solicitada. Os valores acima definidos englobam única e exclusivamente os impostos, taxas e demais encargos fiscais e tributários, incidentes nas alíquotas vigentes no Estado de origem (São Paulo) de responsabilidade da <strong className="font-bold text-slate-900">TENNANT COMPANY</strong>.
                </p>

                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-2">* Tabela Descritiva de Tipos de Contrato</span>
                  <table className="w-full border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr style={{ backgroundColor: primaryColor }} className="text-white">
                        <th className="w-36 p-2 text-left font-bold">Tipo de Contrato</th>
                        <th className="p-2 text-left font-bold">Descrição de Cobertura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className={p.contract_type?.startsWith('0') ? 'bg-amber-100 font-bold text-amber-900' : ''}>
                        <td className="p-2 font-bold">{p.contract_type?.startsWith('0') ? '★ ' : ''}0 - Sem Cobertura</td>
                        <td className="p-2">Incluso: Somente locação do Equipamento. {p.contract_type?.startsWith('0') ? '(PLANO SELECIONADO)' : ''}</td>
                      </tr>
                      <tr className={p.contract_type?.startsWith('1') ? 'bg-amber-100 font-bold text-amber-900' : ''}>
                        <td className="p-2 font-bold">{p.contract_type?.startsWith('1') ? '★ ' : ''}1 - Ouro</td>
                        <td className="p-2">Incluso: Manutenção, Mão de Obra, Peças, Água Destilada e Deslocamento do técnico autorizado TENNANT COMPANY. Não incluso: Combustíveis e Químicos. {p.contract_type?.startsWith('1') ? '(PLANO SELECIONADO)' : ''}</td>
                      </tr>
                      <tr className={p.contract_type?.startsWith('2') ? 'bg-amber-100 font-bold text-amber-900' : ''}>
                        <td className="p-2 font-bold">{p.contract_type?.startsWith('2') ? '★ ' : ''}2 - Prata</td>
                        <td className="p-2">Incluso: Igual ao Ouro. Não incluso: Combustíveis, Químicos, Escovas e Discos. {p.contract_type?.startsWith('2') ? '(PLANO SELECIONADO)' : ''}</td>
                      </tr>
                      <tr className={p.contract_type?.startsWith('3') ? 'bg-amber-100 font-bold text-amber-900' : ''}>
                        <td className="p-2 font-bold">{p.contract_type?.startsWith('3') ? '★ ' : ''}3 - Bronze</td>
                        <td className="p-2">Incluso: Igual ao Ouro. Não incluso: Combustíveis, Água Destilada, Químicos, Escovas, Discos e Baterias. {p.contract_type?.startsWith('3') ? '(PLANO SELECIONADO)' : ''}</td>
                      </tr>
                      <tr className={p.contract_type?.startsWith('4') ? 'bg-amber-100 font-bold text-amber-900' : ''}>
                        <td className="p-2 font-bold">{p.contract_type?.startsWith('4') ? '★ ' : ''}4 - MOB</td>
                        <td className="p-2">Incluso: Somente Manutenção, Mão de Obra, e Deslocamento do técnico autorizado TENNANT COMPANY. {p.contract_type?.startsWith('4') ? '(PLANO SELECIONADO)' : ''}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Seller Signature Block */}
                <div className="pt-4 flex items-end justify-between border-t border-slate-200">
                  <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg max-w-xs text-xs text-slate-800 font-medium">
                    <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: primaryColor }}>
                      Dados do Vendedor
                    </span>
                    <div className="whitespace-pre-line leading-relaxed">{p.seller_info || 'Alfa Tennant\nAtendimento Comercial'}</div>
                  </div>

                  <div className="text-right text-[10px] text-slate-400 space-y-1">
                    <p className="font-bold text-slate-700">Clean Tech Smart</p>
                    <p>Rua Barão de Campinas, 715 - São Paulo, SP</p>
                    <p>Vendas: (11) 3320-8550</p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeTab === 'presentation' && (
            <div className="max-w-[870px] mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-4 text-left">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Catálogo de Equipamentos</h3>
              <h4 className="text-base font-extrabold text-[#009AC7]">{p.machine_name}</h4>
              <div className="flex justify-center py-4">
                <img src={mainPhoto} alt={p.machine_name} className="max-h-72 object-contain mix-blend-multiply" />
              </div>
              <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                {parseSpecsToHTML(p.machine_technical_description)}
              </div>
            </div>
          )}

          {activeTab === 'minuta' && (
            <div className="max-w-[870px] mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-4 text-left">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Minuta de Contrato de Locação</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Minuta padrão de contrato registrada perante o Registro de Títulos e Documentos.
              </p>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="max-w-[870px] mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-4 text-left">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Conversa &amp; Observações</h3>
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
                <CheckCircle2 className="w-5 h-5 text-[#009AC7]" />
                <span>Aprovar e Assinar Proposta</span>
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
                  placeholder="Ex: Solicitamos alteração na forma de pagamento ou desconto..."
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
