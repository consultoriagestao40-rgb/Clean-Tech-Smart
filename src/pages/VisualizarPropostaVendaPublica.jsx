import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Loader2, CheckCircle2, XCircle, Printer, 
  Check, MessageSquare, ChevronRight, Info, X
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

  useEffect(() => {
    fetchProposalDetails();
  }, [id]);

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

  // Generate EXACT same PDF HTML as PropostasVenda.jsx system view
  const handlePrintPDF = () => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Proposta de Venda #${String(p.id).padStart(4,'0')}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
body{font-family:'Inter',sans-serif;background:#f1f5f9;color:#1e293b;font-size:12px;line-height:1.5}
.page{background:#fff;max-width:870px;margin:20px auto;padding:52px 60px;box-shadow:0 4px 24px rgba(0,0,0,.08);border-radius:12px}
.header-bar{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ${primaryColor};padding-bottom:20px;margin-bottom:25px}
.company-info{flex:1;text-align:left}
.company-name{font-size:20px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;margin:0}
.company-meta{font-size:10px;color:#475569;margin-top:3px}
.logo-img{max-height:80px;max-width:180px;object-fit:contain}
.title-block{text-align:center;margin-bottom:20px}
.title-block h2{font-size:15px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px 0}
.title-block .sub{font-size:11px;font-weight:600;color:#475569}
.title-block .date{font-size:10px;color:#64748b;margin-top:2px}
.client-box{background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid ${primaryColor};border-radius:4px;padding:14px 18px;margin-bottom:20px}
.client-box .box-label{font-size:10px;font-weight:700;text-transform:uppercase;color:${primaryColor};letter-spacing:0.5px;margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:5px}
.client-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px 28px;font-size:11px}
.client-grid b{color:#334155}
.eq-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center;margin-bottom:20px}
.eq-title{font-size:14px;font-weight:700;color:#0f172a;border-bottom:2px solid ${primaryColor};padding-bottom:6px;margin-bottom:10px;text-transform:uppercase}
.spec-label{font-size:10px;font-weight:700;text-transform:uppercase;color:${primaryColor};letter-spacing:0.5px;margin-bottom:6px}
.spec-content{font-size:11px;color:#475569;line-height:1.55}
.machine-img{max-height:320px;max-width:100%;object-fit:contain;display:block;margin:0 auto}
.conditions-title{font-size:13px;font-weight:800;text-transform:uppercase;color:${primaryColor};letter-spacing:0.5px;margin-bottom:12px;font-family:'Outfit',sans-serif}
.table-cond{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:18px}
.table-cond td{padding:8px 12px;border:1px solid #cbd5e1}
.table-cond td:first-child{font-weight:700;color:#334155;background:#fff;width:170px}
.table-cond td:last-child{background:#EEF2FF;color:#0f172a}
.legal{font-size:9.5px;color:#64748b;line-height:1.55;text-align:justify;font-style:italic;margin-bottom:14px}
.legal b{font-style:normal;color:#0f172a}
.thanks{font-size:12px;color:#0f172a;font-style:normal;margin-bottom:12px}
.seller-box{background:#EEF2FF;border:1px solid #cbd5e1;border-radius:6px;padding:12px 16px;font-size:11px;max-width:280px;white-space:pre-wrap}
@media print{body{background:#fff}@page{margin:10mm 12mm}.page{box-shadow:none;margin:0;border-radius:0;padding:20mm 22mm}}
</style>
</head>
<body>
<div class="page">
  <div class="header-bar">
    <div class="company-info">
      <h1 class="company-name">${companyName}</h1>
      <div class="company-meta">CNPJ: ${companyCnpj}</div>
      <div class="company-meta">${companyAddress}</div>
      <div class="company-meta">Telefone: ${companyPhone}${companyEmail ? ' · Email: ' + companyEmail : ''}</div>
    </div>
    ${companyLogo ? `<img src="${companyLogo}" alt="Logo" class="logo-img" />` : ''}
  </div>

  <div class="title-block">
    <h2>PROPOSTA COMERCIAL DE VENDA DE EQUIPAMENTOS</h2>
    <div class="sub">Proposta nº #${String(p.id).padStart(4,'0')}</div>
    <div class="date">Data de Emissão: ${emissao}</div>
  </div>

  <div class="client-box">
    <div class="box-label">Dados do Cliente</div>
    <div class="client-grid">
      <div><b>Cliente:</b> ${p.client_razao_social || p.client_name || 'Não informado'}</div>
      <div><b>CNPJ/CPF:</b> ${p.client_cnpj || '—'}</div>
      <div><b>Endereço:</b> ${p.client_address || '—'}</div>
      <div><b>Contato:</b> ${p.client_contact || '—'}</div>
      <div><b>Telefone:</b> ${p.client_phone || '—'}</div>
      <div><b>Serviço:</b> Venda de Equipamento</div>
    </div>
  </div>

  <div class="eq-grid">
    <div>
      <div class="eq-title">${p.machine_name || 'Equipamento'}</div>
      <div class="spec-label">Especificações Técnicas</div>
      <div class="spec-content">${specsHTML}</div>
    </div>
    ${firstImage ? `<div style="display:flex;align-items:center;justify-content:center;height:100%"><img src="${firstImage}" alt="${p.machine_name}" class="machine-img" style="mix-blend-mode:multiply" /></div>` : ''}
  </div>

  <div class="conditions-title">VALORES E CONDIÇÕES DE VENDA</div>
  <table class="table-cond">
    <tbody>
      <tr><td>Preço FOB</td><td>${p.fob_price || 'A consultar'}</td></tr>
      <tr><td>Preço CIF</td><td>${p.cif_price || 'A consultar'}</td></tr>
      <tr><td>Impostos</td><td>${p.taxes_info || 'Conforme texto abaixo'}</td></tr>
      <tr><td>Valor da Proposta</td><td><b>${p.proposal_value ? 'R$ ' + p.proposal_value : ''}</b></td></tr>
      <tr><td>Forma de Pagamento</td><td>${p.payment_terms || ''}</td></tr>
      <tr><td>Prazo de entrega</td><td>${p.delivery_time || ''}</td></tr>
      <tr><td>Garantia</td><td>${p.warranty || '12 Meses'}</td></tr>
      <tr><td>Validade da proposta</td><td>${p.validity_days || '10 Dias'}</td></tr>
      <tr><td></td><td style="white-space:pre-wrap;min-height:60px">${p.notes || ''}</td></tr>
    </tbody>
  </table>

  <p class="legal">Todos os pedidos estão sujeitos aos nossos termos e condições gerais que se encontram registrados perante o <b>9º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica da Capital – São Paulo</b>, cuja cópia digitalizada está disponível no site: <u>www.alfatennant.com.br/terms</u> e também por e-mail ou correio quando solicitada. Os valores acima definidos englobam <b>única e exclusivamente os impostos, taxas e demais encargos fiscais e tributários</b>, incidentes nas alíquotas vigentes no Estado de origem (São Paulo) <b>de responsabilidade da TENNANT COMPANY</b>. Os demais tributos, inclusive os diferenciais de alíquota, que a lei atribuir como <b>responsabilidade do comprador</b>, quer por sua localização, quer por sua classificação (consumidor final, regime do simples, revenda, não contribuinte, dentre outros) não acarretarão quaisquer descontos nos valores acima definidos, nem mesmo serão atribuídas quaisquer responsabilidades pelo seu pagamento à <b>TENNANT COMPANY</b>.</p>
  <p class="thanks">Agradecemos mais uma vez a oportunidade e nos colocamos à disposição para maiores esclarecimentos.</p>
  <p style="font-size:12px;font-weight:600;color:#0f172a;margin-bottom:8px">Atenciosamente,</p>
  <div class="seller-box">${p.seller_info || ''}</div>
</div>
<script>window.onload=function(){window.print();}</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* 1. TOP HEADER BAR - FULL WIDTH ACROSS TOP (#009AC7) */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#009AC7] text-white px-6 flex items-center justify-between z-50 shadow-md no-print">
        <div className="flex items-center space-x-3 text-left">
          <span className="text-xs font-bold text-white">
            📄 Proposta de Venda #{String(p.id).padStart(4, '0')} &mdash; {p.client_razao_social || p.client_name}
          </span>
        </div>

        <button
          onClick={handlePrintPDF}
          className="px-4 py-1.5 bg-white text-[#009AC7] hover:bg-slate-50 text-xs font-extrabold rounded-lg flex items-center space-x-2 transition-all shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Salvar / Imprimir PDF</span>
        </button>
      </header>

      {/* 2. SIDEBAR NAVIGATION - BELOW THE TOP BAR (WHITE BG) */}
      <aside className="fixed top-14 left-0 w-72 bottom-0 bg-white border-r border-gray-200 p-5 flex flex-col justify-between z-40 overflow-y-auto no-print">
        <div className="flex-1 flex flex-col min-h-0 text-left">
          
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-3 pt-2">
            NAVEGAÇÃO DA PROPOSTA
          </span>

          {/* Proposal Navigation Tabs */}
          <nav className="space-y-1.5 flex-1 pr-1">
            <button
              onClick={() => setActiveTab('proposal')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                activeTab === 'proposal' 
                  ? 'bg-sky-50 text-[#009AC7] border-l-4 border-[#009AC7] shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>1. Proposta Comercial</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                activeTab === 'specs' 
                  ? 'bg-sky-50 text-[#009AC7] border-l-4 border-[#009AC7] shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4" />
                <span>2. Ficha Técnica</span>
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
                <span>3. Conversa &amp; Feedback</span>
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
              <span className="text-xxs font-black text-emerald-700 uppercase tracking-wider block">Proposta Aprovada</span>
              <p className="text-slate-500 text-[10px] mt-0.5 font-medium">Assinatura eletrônica registrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <button 
                onClick={() => setIsApproveOpen(true)}
                className="w-full py-2.5 bg-[#009AC7] hover:bg-[#0088b3] text-white font-extrabold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Aprovar Proposta
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
          {activeTab === 'proposal' && (
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

              {/* Proposal Title */}
              <div className="text-center my-4 space-y-1">
                <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
                  PROPOSTA COMERCIAL DE VENDA DE EQUIPAMENTOS
                </h2>
                <p className="text-xs font-bold text-slate-600">Proposta nº #{String(p.id).padStart(4, '0')}</p>
                <p className="text-[11px] text-slate-400">Data de Emissão: {emissao}</p>
              </div>

              {/* Client Data Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2" style={{ borderLeft: `4px solid ${primaryColor}` }}>
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: primaryColor }}>
                  DADOS DO CLIENTE
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

              {/* Equipment Info & Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-2 text-left">
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
                  <div className="flex items-center justify-center self-center h-full w-full py-2">
                    <img
                      src={firstImage}
                      alt={p.machine_name}
                      className="max-h-[340px] w-auto max-w-full object-contain mix-blend-multiply"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  </div>
                )}
              </div>

              {/* Commercial Conditions Table */}
              <div className="pt-2 text-left">
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

              {/* Legal Terms Text */}
              <div className="text-[10px] text-slate-700 leading-relaxed text-justify space-y-2 italic">
                <p>
                  Todos os pedidos estão sujeitos aos nossos termos e condições gerais que se encontram registrados perante o <strong className="font-bold text-slate-900">9º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica da Capital – São Paulo</strong>, cuja cópia digitalizada está disponível no site: <u>www.alfatennant.com.br/terms</u> e também por e-mail ou correio quando solicitada. Os valores acima definidos englobam <strong className="font-bold text-slate-900">única e exclusivamente os impostos, taxas e demais encargos fiscais e tributários</strong>, incidentes nas alíquotas vigentes no Estado de origem (São Paulo) <strong className="font-bold text-slate-900">de responsabilidade da TENNANT COMPANY</strong>.
                </p>
                <p className="pt-2 not-italic text-xs text-slate-800">
                  Agradecemos mais uma vez a oportunidade e nos colocamos à disposição para maiores esclarecimentos.
                </p>
              </div>

              {/* Signature Block */}
              <div className="pt-3 border-t border-slate-200 text-left">
                <p className="font-semibold text-xs text-slate-800 mb-2">Atenciosamente,</p>
                <div className="bg-[#EEF2FF] border border-slate-300 p-3.5 rounded-lg max-w-xs text-xs text-slate-800 whitespace-pre-wrap font-medium">
                  {p.seller_info || '(Insira os dados do vendedor aqui)'}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'specs' && (
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-4 text-left">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Ficha Técnica Detalhada</h3>
              <div className="text-xs text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: specsHTML }} />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-4 text-left">
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
                  placeholder="Ex: Solicitamos alteração na forma de pagamento..."
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
