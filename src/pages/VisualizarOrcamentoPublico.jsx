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

  const handlePrintPDF = () => {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Orçamento #${String(budget.id).padStart(4,'0')}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
body{font-family:'Inter',sans-serif;background:#f1f5f9;color:#1e293b;font-size:12px;line-height:1.5}
.page{background:#fff;max-width:870px;margin:20px auto;padding:52px 60px;box-shadow:0 4px 24px rgba(0,0,0,.08);border-radius:12px;position:relative}
.header{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:2px solid ${primaryColor};margin-bottom:20px}
.logo-img{max-height:60px;object-fit:contain}
.box-title{font-size:11px;font-weight:700;text-transform:uppercase;color:${primaryColor};letter-spacing:0.5px;margin-bottom:8px}
.section-label{font-size:11px;font-weight:700;text-transform:uppercase;color:${primaryColor};margin-bottom:6px;display:block}
.table-custom{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11px}
.table-custom th{background:${primaryColor};color:#fff;padding:8px;text-align:left;font-weight:700;font-size:10px;text-transform:uppercase}
.table-custom td{padding:8px;border:1px solid #cbd5e1}
.summary-box{background:${primaryColor};color:#fff;padding:16px;border-radius:12px;width:280px;margin-left:auto;margin-top:16px;font-size:11px}
.summary-row{display:flex;justify-content:space-between;margin-bottom:6px}
.summary-total{display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.3);padding-top:8px;font-size:14px;font-weight:800}
@media print{
  body{background:#fff}
  .page{box-shadow:none;margin:0;padding:20px 30px;border-radius:0;max-width:100%}
  @page{margin:10mm 12mm}
}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div style="flex:1;text-align:center">
      <h1 style="font-size:20px;font-weight:800;color:#0f172a;text-transform:uppercase;margin:0">${companyName}</h1>
      <div style="font-size:11px;font-weight:bold;color:#1e293b;margin-top:4px">CNPJ: ${companyCnpj}</div>
      <div style="font-size:10px;color:#475569;margin-top:2px">${companyAddress}</div>
      <div style="font-size:10px;color:#475569;margin-top:2px">Telefone: ${companyPhone} ${companyEmail ? '· Email: ' + companyEmail : ''}</div>
    </div>
    ${companyLogo ? `<div style="width:180px;display:flex;justify-content:flex-end"><img src="${companyLogo}" alt="Logo" class="logo-img" /></div>` : ''}
  </div>

  <div style="text-align:center;margin-bottom:20px">
    <h2 style="font-size:15px;font-weight:800;color:#0f172a;text-transform:uppercase;margin:0 0 4px 0">PROPOSTA COMERCIAL DE PRESTAÇÃO DE SERVIÇOS</h2>
    <div style="font-size:11px;font-weight:bold;color:#475569">Proposta nº #${String(budget.id).padStart(4,'0')}</div>
    <div style="font-size:10px;color:#64748b;margin-top:2px">Data: ${emissao}</div>
  </div>

  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid ${primaryColor};border-radius:4px;padding:14px 18px;margin-bottom:20px">
    <div class="box-title">Dados do Cliente</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 28px;font-size:11px">
      <div><b>Cliente:</b> ${budget.client_name || 'Não informado'}</div>
      <div><b>CNPJ/CPF:</b> ${budget.client_document || '—'}</div>
      <div><b>Endereço:</b> ${budget.client_address || '—'}</div>
      <div><b>Contato:</b> ${budget.contact_name || '—'}</div>
      <div><b>Telefone:</b> ${budget.contact_info || '—'}</div>
      <div><b>Serviço:</b> ${budget.service_type || 'Venda'}</div>
    </div>
  </div>

  <span class="section-label">Dados do Equipamento</span>
  <table class="table-custom">
    <thead>
      <tr><th>EQUIPAMENTO / ATIVO</th><th>MARCA</th><th>MODELO</th><th>Nº DE SÉRIE</th></tr>
    </thead>
    <tbody>
      <tr>
        <td><b>${budget.equipment_name || 'Nenhum equipamento associado'}</b></td>
        <td>${budget.equipment_brand || '—'}</td>
        <td>${budget.equipment_model || '—'}</td>
        <td>${budget.equipment_serial_number || '—'}</td>
      </tr>
    </tbody>
  </table>

  <span class="section-label">Mão de Obra</span>
  <table class="table-custom">
    <thead>
      <tr><th>DESCRIÇÃO DO SERVIÇO</th><th style="text-align:center;width:80px">HORAS</th><th style="text-align:right;width:110px">VALOR/HORA</th><th style="text-align:right;width:110px">TOTAL</th></tr>
    </thead>
    <tbody>
      ${laborItems.length === 0 ? '<tr><td colSpan="4" style="color:#94a3b8;font-style:italic">Nenhum serviço cadastrado</td></tr>' : laborItems.map(item => `
        <tr>
          <td><b>${item.description}</b></td>
          <td style="text-align:center">${item.hours}</td>
          <td style="text-align:right">R$ ${Number(item.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right"><b>R$ ${Number((item.hours || 0) * (item.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <span class="section-label">Peças e Insumos</span>
  <table class="table-custom">
    <thead>
      <tr><th>DESCRIÇÃO DA PEÇA</th><th style="text-align:center;width:80px">QTD.</th><th style="text-align:right;width:110px">VALOR UNIT.</th><th style="text-align:right;width:110px">TOTAL</th></tr>
    </thead>
    <tbody>
      ${partsItems.length === 0 ? '<tr><td colSpan="4" style="color:#94a3b8;font-style:italic">Nenhuma peça cadastrada</td></tr>' : partsItems.map(item => `
        <tr>
          <td><b>${item.part_name}</b></td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">R$ ${Number(item.unit_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right"><b>R$ ${Number((item.quantity || 0) * (item.unit_price || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <span class="section-label">Deslocamento / Logística</span>
  <table class="table-custom">
    <thead>
      <tr><th style="text-align:center">KM INICIAL</th><th style="text-align:center">KM FINAL</th><th style="text-align:center">DISTÂNCIA</th><th style="text-align:right">VALOR/KM</th><th style="text-align:right">TOTAL</th></tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align:center">${budget.initial_km || 0}</td>
        <td style="text-align:center">${budget.final_km || 0}</td>
        <td style="text-align:center">${travelKm} km</td>
        <td style="text-align:right">R$ ${Number(budget.price_per_km || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td style="text-align:right"><b>R$ ${travelTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></td>
      </tr>
    </tbody>
  </table>

  ${budget.notes ? `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-bottom:16px;font-size:11px;color:#78350f">
      <b>OBSERVAÇÕES:</b><br/>${budget.notes}
    </div>
  ` : ''}

  <div class="summary-box">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:4px;margin-bottom:8px">RESUMO FINANCEIRO</div>
    <div class="summary-row"><span>Mão de Obra</span><b>R$ ${laborTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>
    <div class="summary-row"><span>Peças e Insumos</span><b>R$ ${partsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>
    <div class="summary-row"><span>Deslocamento</span><b>R$ ${travelTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>
    <div class="summary-total"><span>Total Geral</span><span>R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:15px">
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;font-size:11px;max-width:280px">
      <b style="color:${primaryColor};text-transform:uppercase;font-size:10px;display:block;margin-bottom:4px">Atenciosamente,</b>
      <b>Clean Tech Pro</b><br/>
      <span style="color:#64748b">Atendimento Técnico Especializado</span>
    </div>
    <div style="text-align:right;font-size:10px;color:#94a3b8">
      <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" style="max-height:35px;margin-bottom:4px;object-fit:contain" /><br/>
      <b>Clean Tech Smart</b><br/>
      Avenida Maringá, 1273 – Pinhais/PR<br/>
      Contato: (41) 9 8508-3658
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
            📄 Orçamento #{String(budget.id).padStart(4, '0')} &mdash; {budget.client_name || 'Clean Tech Pro'}
          </span>
        </div>

        <button
          onClick={handlePrintPDF}
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
