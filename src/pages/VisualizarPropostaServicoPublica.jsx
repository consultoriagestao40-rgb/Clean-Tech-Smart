import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Loader2, CheckCircle2, XCircle, Printer, 
  Check, MessageSquare, ChevronRight, Info, ShieldCheck, X
} from 'lucide-react';

export default function VisualizarPropostaServicoPublica() {
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const [activeTab, setActiveTab] = useState('proposal'); // 'proposal' | 'scope' | 'chat'
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
      const res = await fetch(`/api/get-service-proposal-details?id=${id}`);
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
      const res = await fetch('/api/approve-service-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          feedback: `Proposta de Serviço aprovada e assinada por ${signerName}${signerDocument ? ` (${signerDocument})` : ''}`
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
      const res = await fetch('/api/approve-service-proposal', {
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
          <p className="text-sm font-medium">Carregando Proposta de Serviço...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md text-center text-white space-y-4">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold">Proposta de Serviço Indisponível</h2>
          <p className="text-xs text-slate-400">{error || 'A proposta solicitada não foi encontrada.'}</p>
        </div>
      </div>
    );
  }

  const p = proposal;
  const companyLogo = localStorage.getItem('app_company_logo') || '';
  const companyName = localStorage.getItem('app_company_name') || 'CLEAN TECH PRO';
  const companyCnpj = localStorage.getItem('app_company_cnpj') || '43.158.052/0001-01';
  const companyAddress = localStorage.getItem('app_company_address') || 'Avenida Maringá, 1273 – Emiliano Perneta Pinhais/PR, CEP 83325-212';
  const companyPhone = localStorage.getItem('app_company_phone') || '41 9 8508-3658';
  const companyEmail = localStorage.getItem('app_company_email') || 'vendas@cleantechpro.com.br';
  const primaryColor = localStorage.getItem('app_pdf_color') || '#009AC7';
  const emissao = new Date(p.created_at || new Date()).toLocaleDateString('pt-BR');
  const isApproved = p.status === 'Aprovada' || p.status === 'Fechada';

  const parseEquipmentsList = (raw) => {
    if (!raw) return [{ qty: '02 un.', name: 'Lavadoras de Piso Industriais — Modelo Brava' }];
    if (typeof raw === 'string' && raw.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch(e) {}
    }
    const lines = String(raw).split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [{ qty: '02 un.', name: 'Lavadoras de Piso Industriais — Modelo Brava' }];
    return lines.map(line => {
      const match = line.match(/^(\d+\s*(?:un\.|unidades|pcs)?)\s*[-—–]?\s*(.*)$/i);
      if (match) {
        return { qty: match[1], name: match[2] || line };
      }
      return { qty: '01 un.', name: line };
    });
  };

  const eqList = parseEquipmentsList(p.machines_included);

  const handlePrintPDF = () => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Proposta de Serviços #${String(p.id).padStart(4,'0')}</title>
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
.sec-title{font-size:12px;font-weight:800;text-transform:uppercase;color:${primaryColor};letter-spacing:0.5px;margin:18px 0 8px 0;border-bottom:1.5px solid ${primaryColor};padding-bottom:4px;font-family:'Outfit',sans-serif}
.subsec-title{font-size:11px;font-weight:700;color:#0f172a;margin:10px 0 4px 0}
.scope-text{font-size:11px;color:#475569;line-height:1.55;white-space:pre-wrap;margin-bottom:10px}
.table-cond{width:100%;border-collapse:collapse;font-size:11px;margin:12px 0 18px 0}
.table-cond th{background:${primaryColor};color:#fff;padding:8px 12px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase}
.table-cond td{padding:8px 12px;border:1px solid #cbd5e1}
.info-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:11px}
.info-row b{color:#334155}
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
    <h2>PROPOSTA COMERCIAL DE PRESTAÇÃO DE SERVIÇOS RECORRENTES</h2>
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
      <div><b>Serviço:</b> Manutenção Recorrente Mensal</div>
    </div>
  </div>

  <div class="sec-title">1. EQUIPAMENTOS COBERTOS</div>
  <table class="table-cond">
    <thead>
      <tr>
        <th style="width:80px;text-align:center">Qtd</th>
        <th>Equipamento / Modelo</th>
      </tr>
    </thead>
    <tbody>
      ${eqList.map(eq => `
        <tr>
          <td style="text-align:center"><b>${eq.qty || '01 un.'}</b></td>
          <td><b>${eq.name || ''}</b></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="sec-title">2. ESCOPO DOS SERVIÇOS</div>
  <div class="subsec-title">2.1. Manutenção Preventiva</div>
  <div class="scope-text">${p.preventive_scope || ''}</div>

  <div class="subsec-title">2.2. Manutenção Corretiva & Gestão via Portal do Cliente</div>
  <div class="scope-text">${p.corrective_scope || ''}</div>

  <div class="subsec-title">2.3. Atendimentos em Finais de Semana e Feriados</div>
  <div class="scope-text">${p.extra_hours_scope || ''}</div>

  <div class="sec-title">3. CONDIÇÕES COMERCIAIS</div>
  <table class="table-cond">
    <thead>
      <tr>
        <th style="width:50px;text-align:center">Item</th>
        <th>Descrição do Serviço</th>
        <th style="width:80px;text-align:center">Qtd</th>
        <th style="width:120px;text-align:right">Valor Mensal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align:center"><b>01</b></td>
        <td>${p.service_description || ''}</td>
        <td style="text-align:center">${p.quantity || '02 un.'}</td>
        <td style="text-align:right"><b>${p.monthly_value || 'R$ 3.000,00'}</b></td>
      </tr>
    </tbody>
  </table>

  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;margin-bottom:16px space-y-1">
    <div class="info-row"><span><b>Peças de Reposição:</b></span><span>${p.parts_notes || 'Faturadas à parte mediante aprovação.'}</span></div>
    <div class="info-row"><span><b>Vigência do Contrato:</b></span><span><b>${p.contract_months || '12 meses'}</b></span></div>
    <div class="info-row"><span><b>Forma de Pagamento:</b></span><span>${p.payment_terms || 'Mensal via boleto bancário / PIX'}</span></div>
    <div class="info-row"><span><b>Validade da Proposta:</b></span><span>${p.validity_days || '15 dias'}</span></div>
  </div>

  ${p.notes ? `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:11px;color:#78350f">
      <b>Observações Complementares:</b><br/>${p.notes}
    </div>
  ` : ''}

  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:15px">
    <div style="background:#EEF2FF;border:1px solid #cbd5e1;border-radius:6px;padding:12px 16px;font-size:11px;max-width:300px">
      <b style="color:${primaryColor};text-transform:uppercase;font-size:10px;display:block;margin-bottom:4px">Atenciosamente,</b>
      <div style="white-space:pre-wrap">${p.seller_info || 'Clean Tech Pro\nAtendimento Comercial & Serviços'}</div>
    </div>
    <div style="text-align:right">
      <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" style="max-height:40px;margin-bottom:6px;object-fit:contain" />
      <div style="font-size:9px;color:#94a3b8;line-height:1.3">
        Rua Barão de Campinas, 715<br>
        São Paulo, SP - 01201-902<br>
        Vendas: (11) 3320-8550
      </div>
    </div>
  </div>
</div>
<script>window.onload=function(){window.print();}</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      
      {/* 1. TOP HEADER BAR - FULL WIDTH ACROSS TOP (#009AC7) */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#009AC7] text-white px-6 flex items-center justify-between z-50 shadow-md no-print">
        <div className="flex items-center space-x-3 text-left">
          <span className="text-xs font-bold text-white">
            📄 Proposta de Serviços #{String(p.id).padStart(4, '0')} &mdash; {p.client_razao_social || p.client_name}
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

      {/* 2. SIDEBAR NAVIGATION */}
      <aside className="fixed top-14 left-0 w-72 bottom-0 bg-white border-r border-gray-200 p-5 flex flex-col justify-between z-40 overflow-y-auto no-print">
        <div className="flex-1 flex flex-col min-h-0 text-left">
          
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-3 pt-2">
            NAVEGAÇÃO DA PROPOSTA
          </span>

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
              onClick={() => setActiveTab('scope')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                activeTab === 'scope' 
                  ? 'bg-sky-50 text-[#009AC7] border-l-4 border-[#009AC7] shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4" />
                <span>2. Escopo Técnico</span>
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

        {/* Decision Footer */}
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

      {/* 3. MAIN CONTENT */}
      <main className="pl-72 pt-14 min-h-screen bg-slate-100 p-6 flex justify-center">
        <div className="w-full max-w-[870px] my-4">
          {activeTab === 'proposal' && (
            <div className="bg-white p-8 md:p-12 shadow-xl rounded-xl border border-gray-200 text-slate-800 text-xs leading-relaxed space-y-6 printable-page text-left">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b-2" style={{ borderColor: primaryColor }}>
                <div className="flex-1 text-left">
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
                  PROPOSTA COMERCIAL DE PRESTAÇÃO DE SERVIÇOS RECORRENTES
                </h2>
                <p className="text-xs font-bold text-slate-600">Proposta nº #{String(p.id).padStart(4, '0')}</p>
                <p className="text-[11px] text-slate-400">Data de Emissão: {emissao}</p>
              </div>

              {/* Client Box */}
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
                  <div><span className="font-bold text-slate-700">Serviço:</span> Manutenção Recorrente Mensal</div>
                </div>
              </div>

              {/* 1. Equipamentos Cobertos */}
              <div className="space-y-2 text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1 text-[#009AC7]">
                  1. EQUIPAMENTOS COBERTOS
                </h3>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="p-2 text-center w-24 font-bold uppercase text-[10px] border border-slate-300">QTD</th>
                      <th className="p-2 text-left font-bold uppercase text-[10px] border border-slate-300">EQUIPAMENTO / MODELO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eqList.map((eq, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-center font-bold border border-slate-300 text-[#009AC7]">{eq.qty || '01 un.'}</td>
                        <td className="p-2 font-semibold border border-slate-300 text-slate-800">{eq.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 2. Escopo Resumido */}
              <div className="space-y-3 text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1 text-[#009AC7]">
                  2. ESCOPO DOS SERVIÇOS
                </h3>

                <div>
                  <h4 className="font-bold text-slate-800 text-xs">2.1. Manutenção Preventiva</h4>
                  <p className="text-slate-600 whitespace-pre-wrap mt-0.5">{p.preventive_scope}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-xs">2.2. Manutenção Corretiva & Gestão via Portal do Cliente</h4>
                  <p className="text-slate-600 whitespace-pre-wrap mt-0.5">{p.corrective_scope}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-xs">2.3. Atendimentos em Finais de Semana e Feriados</h4>
                  <p className="text-slate-600 whitespace-pre-wrap mt-0.5">{p.extra_hours_scope}</p>
                </div>
              </div>

              {/* 3. Condições Comerciais */}
              <div className="pt-2 text-left space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-1 text-[#009AC7]">
                  3. CONDIÇÕES COMERCIAIS
                </h3>

                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-[#009AC7] text-white">
                      <th className="p-2 text-center w-12 font-bold uppercase text-[10px]">ITEM</th>
                      <th className="p-2 text-left font-bold uppercase text-[10px]">DESCRIÇÃO DO SERVIÇO</th>
                      <th className="p-2 text-center w-20 font-bold uppercase text-[10px]">QTD</th>
                      <th className="p-2 text-right w-32 font-bold uppercase text-[10px]">VALOR MENSAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2.5 text-center font-bold border border-slate-300">01</td>
                      <td className="p-2.5 border border-slate-300 font-medium">{p.service_description}</td>
                      <td className="p-2.5 text-center border border-slate-300 font-medium">{p.quantity || '02 un.'}</td>
                      <td className="p-2.5 text-right font-extrabold border border-slate-300 text-slate-900">{p.monthly_value || 'R$ 3.000,00'}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div><span className="font-bold text-slate-700">Peças de Reposição:</span> {p.parts_notes}</div>
                  <div><span className="font-bold text-slate-700">Vigência do Contrato:</span> <strong>{p.contract_months || '12 meses'}</strong></div>
                  <div><span className="font-bold text-slate-700">Forma de Pagamento:</span> {p.payment_terms || 'Mensal via boleto bancário / PIX'}</div>
                  <div><span className="font-bold text-slate-700">Validade da Proposta:</span> {p.validity_days || '15 dias'}</div>
                </div>
              </div>

              {/* Signature Block */}
              <div className="pt-3 border-t border-slate-200 text-left flex justify-between items-end">
                <div className="bg-[#EEF2FF] border border-slate-300 p-3.5 rounded-lg max-w-xs text-xs text-slate-800 whitespace-pre-wrap font-medium">
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: primaryColor }}>
                    Atenciosamente,
                  </span>
                  {p.seller_info || 'Clean Tech Pro\nAtendimento Comercial & Serviços'}
                </div>
                <div className="text-right">
                  <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" className="max-h-10 mb-1 ml-auto object-contain" />
                  <div className="text-[9px] text-slate-400 leading-tight">
                    Rua Barão de Campinas, 715<br/>
                    São Paulo, SP - 01201-902<br/>
                    Vendas: (11) 3320-8550
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'scope' && (
            <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-6 text-left text-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Detalhamento do Escopo Técnico</h3>
              
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">2.1. Manutenção Preventiva</h4>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{p.preventive_scope}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">2.2. Manutenção Corretiva & Gestão via Portal do Cliente</h4>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{p.corrective_scope}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">2.3. Atendimentos em Finais de Semana e Feriados</h4>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{p.extra_hours_scope}</p>
              </div>
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
                  placeholder="Ex: Solicitamos alteração na condição comercial..."
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
