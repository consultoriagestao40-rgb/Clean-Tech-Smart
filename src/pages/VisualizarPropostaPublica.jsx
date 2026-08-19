import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Loader2, CheckCircle2, XCircle, Printer, 
  Check, MessageSquare, ChevronRight, Info, FileSignature, X
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
  const [selectedOptionToApprove, setSelectedOptionToApprove] = useState('all');
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
      let optionText = selectedOptionToApprove;
      if (selectedOptionToApprove === 'all') {
        optionText = 'Pacote Completo / Todas as Opções';
      } else if (proposal?.items && Array.isArray(proposal.items)) {
        const found = proposal.items.find(i => String(i.id) === String(selectedOptionToApprove));
        if (found) {
          optionText = `${found.machine_name || proposal.machine_name} (${formatPeriod(found.period_months)} - R$ ${Number(found.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
        }
      }

      const res = await fetch('/api/approve-rental-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'Fechada',
          approved_by: signerName + (signerDocument ? ` (CPF/CNPJ: ${signerDocument})` : ''),
          approved_option: optionText,
          client_feedback: `Proposta assinada e aprovada digitalmente pelo cliente. [Opção: ${optionText}]`
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
    if (m === 30) return 'Mensal Avulso (01 mês)';
    if (m === 12) return '12 Meses';
    return `${m} Meses`;
  };

  const getRentalValueInfo = (months) => {
    const m = Number(months);
    if (m === 1) {
      return {
        label: 'VALOR DIÁRIO',
        labelTitle: 'Valor Diário (R$)',
        priceTitle: 'PREÇO DIÁRIO:',
        suffix: '/ dia',
        unit: 'dia',
        shortUnit: 'dia'
      };
    }
    if (m === 7) {
      return {
        label: 'VALOR SEMANAL',
        labelTitle: 'Valor Semanal (R$)',
        priceTitle: 'PREÇO SEMANAL:',
        suffix: '/ semana',
        unit: 'semana',
        shortUnit: 'sem'
      };
    }
    if (m === 15) {
      return {
        label: 'VALOR QUINZENAL',
        labelTitle: 'Valor Quinzenal (R$)',
        priceTitle: 'PREÇO QUINZENAL:',
        suffix: '/ quinzena',
        unit: 'quinzena',
        shortUnit: 'quinzena'
      };
    }
    return {
      label: 'VALOR MENSAL',
      labelTitle: 'Valor Mensal (R$)',
      priceTitle: 'PREÇO MENSAL:',
      suffix: '/ mês',
      unit: 'mês',
      shortUnit: 'mês'
    };
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
  const valInfo = getRentalValueInfo(p.period_months);
  const companyLogo = localStorage.getItem('app_company_logo') || '';
  const companyName = localStorage.getItem('app_company_name') || 'CLEAN TECH PRO';
  const companyCnpj = localStorage.getItem('app_company_cnpj') || '43.158.052/0001-01';
  const companyAddress = localStorage.getItem('app_company_address') || 'Avenida Maringá, 1273 – Emiliano Perneta Pinhais/PR, CEP 83325-212';
  const companyPhone = localStorage.getItem('app_company_phone') || '41 9 8508-3658';
  const companyEmail = localStorage.getItem('app_company_email') || 'vendas@cleantechpro.com.br';
  const primaryColor = localStorage.getItem('app_pdf_color') || '#009AC7';
  const emissao = new Date(p.created_at || new Date()).toLocaleDateString('pt-BR');
  const isApproved = p.status === 'Aprovada' || p.status === 'Fechada';

  // Parse Machine Photo — same logic as PDF generator in PropostasLocacao.jsx
  // machine_photos is a newline-separated string from mm.photo_urls
  const photosList = (p.machine_photos || p.machine_image || '').split('\n').map(u => u.trim()).filter(Boolean);
  const mainPhoto = photosList.length > 0 ? photosList[0] : 'https://placehold.co/400x300?text=Equipamento';

  const parseSpecsToHTML = (rawSpecs) => {
    if (!rawSpecs) return '<p class="italic text-slate-400">Consulte a ficha técnica anexa.</p>';
    let htmlContent = rawSpecs;
  const parseSpecsToHTML = (text) => {
    if (!text) return '';
    let htmlContent = '';
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      if (trimmed.includes(':')) {
        const [key, ...valParts] = trimmed.split(':');
        const val = valParts.join(':').trim();
        const cleanKey = key.replace(/^[-\s*•]+/, '').trim();
        htmlContent += `
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; padding:2px 0; font-size:9px; line-height:1.25;">
            <span style="font-weight:600; color:#475569; width:52%;">${cleanKey}</span>
            <span style="color:#0f172a; width:48%; text-align:right; font-weight:600;">${val}</span>
          </div>
        `;
      } else if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        const cleanLine = trimmed.replace(/^[-\s*•]+/, '').trim();
        htmlContent += `
          <div style="display:flex; align-items:start; padding:1.5px 0; font-size:9px; color:#334155; line-height:1.25;">
            <span style="color:${primaryColor}; margin-right:4px; font-weight:bold;">•</span>
            <span>${cleanLine}</span>
          </div>
        `;
      } else if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
        htmlContent += `
          <div style="font-weight:800; color:${primaryColor}; font-size:9px; text-transform:uppercase; border-bottom:1px solid ${primaryColor}; padding-bottom:2px; margin-top:5px; margin-bottom:3px; letter-spacing:0.5px;">
            ${trimmed}
          </div>
        `;
      } else {
        htmlContent += `
          <p style="font-size:9px; color:#475569; padding:1.5px 0; line-height:1.25;">${trimmed}</p>
        `;
      }
    }
    return htmlContent;
  };

  const specsHTML = parseSpecsToHTML(p.machine_technical_description || p.machine_specs);

  const formatHoursForPeriod = (hours, period) => {
    const pVal = Number(period);
    if (!hours || hours === '100 horas/mês' || hours === '100 horas/mes' || hours === '100h/mês') {
      if (pVal === 1) return '5 horas/dia';
      if (pVal === 7) return '25 horas/semana';
      if (pVal === 15) return '50 horas/quinzena';
      return '100 horas/mês';
    }
    return hours;
  };

  // Generate EXACT same PDF HTML as PropostasLocacao.jsx system view
  const handlePrintPDF = () => {
    const introText = 'Equipamento de alta qualidade e rendimento, ideal para processos contínuos de higienização de pisos.';
    const isMultiOption = p.items && Array.isArray(p.items) && p.items.length > 1;

    const financialSectionHTML = isMultiOption ? `
      <div style="margin-bottom: 10px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
          <div style="width:3px; height:12px; background:${primaryColor}; border-radius:2px;"></div>
          <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0f172a;">
            Quadro Comparativo de Opções e Prazos de Locação
          </span>
        </div>
        <div style="border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; background:#fff;">
          <table style="width:100%; border-collapse:collapse; font-size:9.5px; text-align:left;">
            <thead>
              <tr style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:#fff; font-size:8.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">
                <th style="padding:6px 8px; text-align:center; width:70px; border-right:1px solid rgba(255,255,255,0.15);">Opção</th>
                <th style="padding:6px 10px; border-right:1px solid rgba(255,255,255,0.15);">Equipamento / Modelo</th>
                <th style="padding:6px 10px; border-right:1px solid rgba(255,255,255,0.15);">Prazo / Período</th>
                <th style="padding:6px 10px; border-right:1px solid rgba(255,255,255,0.15);">Tipo Contrato & Horas</th>
                <th style="padding:6px 6px; text-align:center; width:40px; border-right:1px solid rgba(255,255,255,0.15);">Qtd</th>
                <th style="padding:6px 10px; text-align:right; width:135px;">Valor da Locação</th>
              </tr>
            </thead>
            <tbody>
              ${p.items.map((item, idx) => {
                const itemValInfo = getRentalValueInfo(item.period_months);
                return `
                  <tr style="font-size:9.5px; ${idx % 2 === 1 ? 'background:#f8fafc;' : 'background:#ffffff;'} border-bottom:1px solid #e2e8f0;">
                    <td style="padding:6px 8px; text-align:center; border-right:1px solid #e2e8f0;">
                      <span style="display:inline-block; padding:2px 6px; background:#e0f2fe; color:#0284c7; font-weight:800; border-radius:4px; font-size:9px;">Opção #${idx + 1}</span>
                    </td>
                    <td style="padding:6px 10px; font-weight:700; color:#0f172a; border-right:1px solid #e2e8f0;">
                      ${item.machine_name || p.machine_name || 'Equipamento'}
                    </td>
                    <td style="padding:6px 10px; font-weight:600; color:#1e293b; border-right:1px solid #e2e8f0;">
                      ${formatPeriod(item.period_months)}
                    </td>
                    <td style="padding:6px 10px; color:#334155; font-size:9px; border-right:1px solid #e2e8f0; line-height:1.25;">
                      <span style="font-weight:700; color:#0f172a;">${item.contract_type || '0 - Sem cobertura'}</span><br/>
                      <span style="color:#64748b; font-weight:500; font-size:8.5px;">${formatHoursForPeriod(item.hours_per_month, item.period_months)}</span>
                    </td>
                    <td style="padding:6px 6px; text-align:center; font-weight:700; color:#0f172a; border-right:1px solid #e2e8f0;">
                      ${item.quantity || 1}
                    </td>
                    <td style="padding:6px 10px; text-align:right; font-weight:800; color:${primaryColor}; font-size:11px; white-space:nowrap;">
                      R$ ${Number(item.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span style="font-size:8.5px; font-weight:600; color:#64748b;">${itemValInfo.suffix}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div style="margin-bottom: 10px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
          <div style="width:3px; height:12px; background:${primaryColor}; border-radius:2px;"></div>
          <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0f172a;">
            Condições Gerais de Fornecimento
          </span>
        </div>
        <div style="border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; background:#fff;">
          <table style="width:100%; border-collapse:collapse; font-size:9px;">
            <tr>
              <td style="padding:5px 8px; background:#f8fafc; font-weight:700; color:#475569; width:120px; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0; text-transform:uppercase; font-size:8.5px;">Região Utilizada</td>
              <td style="padding:5px 8px; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">${p.region_used || 'Curitiba e Região'}</td>
              <td style="padding:5px 8px; background:#f8fafc; font-weight:700; color:#475569; width:120px; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0; text-transform:uppercase; font-size:8.5px;">Tempo de Entrega</td>
              <td style="padding:5px 8px; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0;">${p.delivery_time || 'Imediato'}</td>
            </tr>
            <tr>
              <td style="padding:5px 8px; background:#f8fafc; font-weight:700; color:#475569; border-right:1px solid #e2e8f0; text-transform:uppercase; font-size:8.5px; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">Custo do Frete</td>
              <td style="padding:5px 8px; font-weight:700; color:#0f172a; border-right:1px solid #e2e8f0; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">${Number(p.freight_cost) > 0 ? `R$ ${Number(p.freight_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Incluso'}</td>
              <td style="padding:5px 8px; background:#f8fafc; font-weight:700; color:#475569; border-right:1px solid #e2e8f0; text-transform:uppercase; font-size:8.5px; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">Validade Proposta</td>
              <td style="padding:5px 8px; font-weight:700; color:#0f172a; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">${p.validity_days || '10 dias'}</td>
            </tr>
            ${p.notes ? `
            <tr>
              <td style="padding:5px 8px; background:#f8fafc; font-weight:700; color:#475569; border-right:1px solid #e2e8f0; text-transform:uppercase; font-size:8.5px;">Observações</td>
              <td colspan="3" style="padding:5px 8px; color:#334155; font-size:9px; font-style:italic;">${p.notes}</td>
            </tr>` : ''}
          </table>
        </div>
      </div>
    ` : `
      <div style="margin-bottom: 12px;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:5px;">
          <div style="width:3px; height:12px; background:${primaryColor}; border-radius:2px;"></div>
          <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#0f172a;">
            Valores e Condições de Locação
          </span>
        </div>
        <div style="border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; background:#fff;">
          <table style="width:100%; border-collapse:collapse; font-size:9.5px;">
            <tr>
              <td style="padding:6px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:9px; text-transform:uppercase; width:160px; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">${valInfo.label}</td>
              <td style="padding:6px 10px; font-size:12px; color:${primaryColor}; font-weight:800; border-bottom:1px solid #e2e8f0;">R$ ${Number(p.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span style="font-size:9px; font-weight:600; color:#64748b;">${valInfo.suffix}</span></td>
            </tr>
            <tr>
              <td style="padding:5px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:8.5px; text-transform:uppercase; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">Tipo de Contrato</td>
              <td style="padding:5px 10px; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0;">${p.contract_type || '0 - Sem cobertura'}</td>
            </tr>
            <tr>
              <td style="padding:5px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:8.5px; text-transform:uppercase; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">Período / Franquia</td>
              <td style="padding:5px 10px; font-weight:600; color:#0f172a; border-bottom:1px solid #e2e8f0;">${formatPeriod(p.period_months)} • ${formatHoursForPeriod(p.hours_per_month, p.period_months)}</td>
            </tr>
            <tr>
              <td style="padding:5px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:8.5px; text-transform:uppercase; border-bottom:1px solid #e2e8f0; border-right:1px solid #e2e8f0;">Região / Entrega</td>
              <td style="padding:5px 10px; font-weight:600; color:#0f172a; border-bottom:1px solid #e2e8f0;">${p.region_used || 'Curitiba e Região'} • Entrega: ${p.delivery_time || 'Imediato'}</td>
            </tr>
            <tr>
              <td style="padding:5px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:8.5px; text-transform:uppercase; border-right:1px solid #e2e8f0; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">Frete / Validade</td>
              <td style="padding:5px 10px; font-weight:600; color:#0f172a; ${p.notes ? 'border-bottom:1px solid #e2e8f0;' : ''}">${Number(p.freight_cost) > 0 ? `R$ ${Number(p.freight_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Incluso'} • Validade: ${p.validity_days || '10 dias'}</td>
            </tr>
            ${p.notes ? `
            <tr>
              <td style="padding:5px 10px; background:#f8fafc; font-weight:700; color:#475569; font-size:8.5px; text-transform:uppercase; border-right:1px solid #e2e8f0;">Observações</td>
              <td style="padding:5px 10px; color:#475569; font-size:9px;">${p.notes}</td>
            </tr>` : ''}
          </table>
        </div>
      </div>
    `;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Proposta de Locação #${String(p.id).padStart(4,'0')}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}
body {
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 10px;
  line-height: 1.35;
  padding-top: 50px;
}
.print-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #0f172a;
  color: #fff;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 999;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
}
.btn-print {
  background: ${primaryColor};
  color: #fff;
  border: none;
  padding: 8px 22px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.btn-print:hover {
  filter: brightness(1.1);
}
.page {
  background: #fff;
  width: 210mm;
  height: 296mm;
  max-height: 296mm;
  margin: 15px auto;
  padding: 11mm 15mm;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}
@media print {
  .print-bar, .no-print { display: none !important; }
  body { background: #fff !important; padding-top: 0 !important; }
  .page {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 10mm 12mm !important;
    border-radius: 0 !important;
    width: 210mm !important;
    height: 297mm !important;
    max-height: 297mm !important;
    page-break-after: always !important;
    page-break-inside: avoid !important;
    break-after: page !important;
    break-inside: avoid !important;
  }
  .page:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
  }
  @page {
    size: A4 portrait;
    margin: 0;
  }
}
</style>
</head>
<body>
<div class="print-bar no-print">
  <strong>📄 Proposta de Locação #${String(p.id).padStart(4,'0')} &mdash; ${p.client_name}</strong>
  <button class="btn-print" onclick="window.print()">🖨️&nbsp; Salvar / Imprimir PDF</button>
</div>

<!-- PAGE 1: Presentation & Technical Specs -->
<div class="page">
  <div>
    <!-- Header -->
    <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid ${primaryColor}; padding-bottom:8px; margin-bottom:10px;">
      <div style="flex:1; text-align:left;">
        <h1 style="font-size:15px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:0.5px; margin:0;">${companyName}</h1>
        <div style="font-size:9.5px; font-weight:700; color:#1e293b; margin-top:2px;">CNPJ: ${companyCnpj}</div>
        <div style="font-size:8.5px; color:#64748b; margin-top:1px;">${companyAddress} • Tel: ${companyPhone} ${companyEmail ? `• ${companyEmail}` : ''}</div>
      </div>
      ${companyLogo ? `
        <div style="max-width:140px; display:flex; justify-content:flex-end;">
          <img src="${companyLogo}" alt="Logo" style="max-height:50px; max-width:140px; object-fit:contain;" />
        </div>
      ` : ''}
    </div>

    <!-- Title -->
    <div style="text-align:center; margin-bottom:10px;">
      <h2 style="font-size:13px; font-weight:800; color:#0f172a; text-transform:uppercase; margin:0 0 2px 0; letter-spacing:0.5px;">Proposta Comercial de Locação de Equipamentos</h2>
      <div style="font-size:9.5px; font-weight:700; color:#475569;">Proposta nº #${String(p.id).padStart(4,'0')} • Data: ${emissao}</div>
    </div>

    <!-- Client Box -->
    <div style="margin-bottom:10px; border-left:4px solid ${primaryColor}; border-radius:6px; padding:7px 12px; background:#f8fafc; border:1px solid #cbd5e1; border-left-width:4px;">
      <div style="font-size:9.5px; font-weight:800; text-transform:uppercase; color:${primaryColor}; margin-bottom:4px; letter-spacing:0.5px;">Dados do Cliente</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 20px; font-size:9px;">
        <div><b>Cliente:</b> ${p.client_razao_social || p.client_name || 'Não informado'}</div>
        <div><b>CNPJ/CPF:</b> ${p.client_document || '&mdash;'}</div>
        <div><b>Endereço:</b> ${p.client_address || '&mdash;'}</div>
        <div><b>Contato:</b> ${p.client_contact || (p.client_email ? p.client_email.split('@')[0] : '&mdash;')}</div>
        <div><b>Telefone:</b> ${p.client_phone || p.client_email || '&mdash;'}</div>
        <div><b>Serviço:</b> Locação de Equipamento</div>
      </div>
    </div>

    <!-- 2-Column Grid for Image + Specs -->
    <div style="display:grid; grid-template-columns:1fr 1.2fr; gap:16px; align-items:start;">
      <!-- Coluna Esquerda: Imagem e Diferenciais -->
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="height:140px; background:#fff; border:1px solid #e2e8f0; border-radius:6px; display:flex; align-items:center; justify-content:center; padding:6px;">
          <img src="${mainPhoto}" alt="${p.machine_name}" style="max-height:100%; max-width:100%; object-fit:contain; mix-blend-multiply;" />
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 10px; font-size:8.5px; color:#475569; line-height:1.35;">
          <h4 style="font-weight:800; color:#0f172a; margin-bottom:4px; text-transform:uppercase; font-size:8.5px; border-bottom:1px solid #cbd5e1; padding-bottom:2px;">Diferenciais Operacionais</h4>
          <p style="margin-bottom:2px;">• Alta produtividade e rendimento em grandes áreas.</p>
          <p style="margin-bottom:2px;">• Facilidade de operação com controles intuitivos.</p>
          <p style="margin-bottom:2px;">• Robustez construtiva Tennant líder mundial.</p>
          <p>• Suporte técnico especializado e peças originais.</p>
        </div>
      </div>

      <!-- Coluna Direita: Nome e Ficha Técnica -->
      <div>
        <h3 style="font-size:12px; font-weight:800; color:#0f172a; margin-bottom:3px; border-bottom:2px solid ${primaryColor}; padding-bottom:3px; text-transform:uppercase;">
          ${p.machine_name}
        </h3>
        <p style="font-size:8.5px; color:#64748b; line-height:1.25; margin-bottom:6px; font-style:italic;">
          ${introText}
        </p>
        <div>
          <div style="font-size:8.5px; font-weight:800; color:${primaryColor}; text-transform:uppercase; border-bottom:1px solid #cbd5e1; padding-bottom:2px; margin-bottom:4px; letter-spacing:0.5px;">Especificações Técnicas</div>
          ${specsHTML || '<p style="color:#94a3b8; font-style:italic; font-size:8.5px;">Consulte a ficha técnica anexa.</p>'}
        </div>
      </div>
    </div>
  </div>

  <!-- Page 1 Footer Note -->
  <div style="border-top:1px solid #e2e8f0; padding-top:4px; text-align:right; font-size:8px; color:#94a3b8;">
    Página 1 de 2 • Proposta Comercial #${String(p.id).padStart(4,'0')}
  </div>
</div>

<!-- PAGE 2: Financial Terms & Conditions -->
<div class="page" style="page-break-before:always;">
  <div>
    <!-- Page 2 Header -->
    <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:6px; margin-bottom:10px;">
      <span style="font-size:9.5px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:1px;">Valores e Condições de Locação</span>
      <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" style="max-height:24px; object-fit:contain;" />
    </div>

    <!-- Financial & Conditions Tables -->
    ${financialSectionHTML}

    <!-- Legal text -->
    <p style="font-size:7.5px; color:#64748b; line-height:1.3; margin-bottom:8px; text-align:justify;">
      Todos os pedidos estão sujeitos aos nossos termos e condições gerais que se encontram registrados perante o <b>3º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica da Capital &ndash; São Paulo</b>, cuja cópia digitalizada está disponível no site: <i>www.alfatennant.com.br/terms</i> e também por e-mail ou correio quando solicitada. Os valores acima definidos englobam única e exclusivamente os impostos, taxas e demais encargos fiscais e tributários incidentes nas alíquotas vigentes no Estado de origem (São Paulo) de responsabilidade da <b>TENNANT COMPANY</b>.
    </p>

    <!-- Contract Types Table -->
    <div style="margin-bottom:8px;">
      <div style="font-size:8px; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:3px; letter-spacing:0.5px;">* Tabela Descritiva de Tipos de Contrato</div>
      <table style="width:100%; border-collapse:collapse; border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; font-size:7.5px;">
        <thead>
          <tr style="background:${primaryColor}; color:#fff; font-size:7.5px; font-weight:700;">
            <th style="width:110px; padding:3px 6px; text-align:left; border-right:1px solid rgba(255,255,255,0.2);">Tipo de Contrato</th>
            <th style="padding:3px 6px; text-align:left;">Descrição de Cobertura</th>
          </tr>
        </thead>
        <tbody>
          <tr ${p.contract_type?.startsWith('0') ? 'style="background-color:#fef9c3; font-weight:bold; color:#854d0e;"' : 'style="background:#fff;"'}>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; font-weight:700;">${p.contract_type?.startsWith('0') ? '★ ' : ''}0 - Sem Cobertura</td>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0;">Incluso: Somente locação do Equipamento. ${p.contract_type?.startsWith('0') ? '(PLANO SELECIONADO)' : ''}</td>
          </tr>
          <tr ${p.contract_type?.startsWith('1') ? 'style="background-color:#fef9c3; font-weight:bold; color:#854d0e;"' : 'style="background:#f8fafc;"'}>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; font-weight:700;">${p.contract_type?.startsWith('1') ? '★ ' : ''}1 - Ouro</td>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0;">Incluso: Manutenção, Mão de Obra, Peças, Água Destilada e Deslocamento do técnico autorizado TENNANT COMPANY. Não incluso: Combustíveis e Químicos. ${p.contract_type?.startsWith('1') ? '(PLANO SELECIONADO)' : ''}</td>
          </tr>
          <tr ${p.contract_type?.startsWith('2') ? 'style="background-color:#fef9c3; font-weight:bold; color:#854d0e;"' : 'style="background:#fff;"'}>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; font-weight:700;">${p.contract_type?.startsWith('2') ? '★ ' : ''}2 - Prata</td>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0;">Incluso: Igual ao Ouro. Não incluso: Combustíveis, Químicos, Escovas e Discos. ${p.contract_type?.startsWith('2') ? '(PLANO SELECIONADO)' : ''}</td>
          </tr>
          <tr ${p.contract_type?.startsWith('3') ? 'style="background-color:#fef9c3; font-weight:bold; color:#854d0e;"' : 'style="background:#f8fafc;"'}>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; font-weight:700;">${p.contract_type?.startsWith('3') ? '★ ' : ''}3 - Bronze</td>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0;">Incluso: Igual ao Ouro. Não incluso: Combustíveis, Água Destilada, Químicos, Escovas, Discos e Baterias. ${p.contract_type?.startsWith('3') ? '(PLANO SELECIONADO)' : ''}</td>
          </tr>
          <tr ${p.contract_type?.startsWith('4') ? 'style="background-color:#fef9c3; font-weight:bold; color:#854d0e;"' : 'style="background:#fff;"'}>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; font-weight:700;">${p.contract_type?.startsWith('4') ? '★ ' : ''}4 - MOB</td>
            <td style="padding:3px 6px; border-top:1px solid #e2e8f0;">Incluso: Somente Manutenção, Mão de Obra, e Deslocamento do técnico autorizado TENNANT COMPANY. ${p.contract_type?.startsWith('4') ? '(PLANO SELECIONADO)' : ''}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Page 2 Footer -->
  <div>
    <div style="display:grid; grid-template-columns:1.4fr 1fr; gap:20px; align-items:end; border-top:1px solid #cbd5e1; padding-top:8px;">
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:6px 10px; font-size:8.5px;">
        <span style="display:block; margin-bottom:2px; color:${primaryColor}; font-weight:800; text-transform:uppercase; font-size:8px; letter-spacing:0.5px;">Dados do Vendedor</span>
        <div style="white-space:pre-line; color:#334155; line-height:1.3;">${p.seller_info || 'Alfa Tennant\nAtendimento Comercial'}</div>
      </div>
      
      <div style="text-align:right;">
        <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" style="max-height:28px; margin-bottom:3px; object-fit:contain;" />
        <div style="font-size:7.5px; color:#94a3b8; line-height:1.2;">
          Rua Barão de Campinas, 715 • São Paulo, SP<br>
          Vendas: (11) 3320-8550
        </div>
      </div>
    </div>

    <div style="border-top:1px solid #f1f5f9; margin-top:6px; padding-top:3px; text-align:right; font-size:8px; color:#94a3b8;">
      Página 2 de 2 • Proposta Comercial #${String(p.id).padStart(4,'0')}
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
    } else {
      alert('O bloqueador de pop-ups impediu a abertura. Por favor, permita pop-ups para este site.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">

      {/* 1. TOP HEADER BAR - FULL WIDTH ACROSS TOP (#009AC7) */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#009AC7] text-white px-6 flex items-center justify-between z-50 shadow-md no-print">
        <div className="flex items-center space-x-3 text-left">
          <span className="text-xs font-bold text-white">
            📄 Proposta de Locação #{String(p.id).padStart(4, '0')} &mdash; {p.client_razao_social || p.client_name}
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

      {/* 2. SIDEBAR NAVIGATION - BELOW THE TOP BAR (WHITE BG) - NO LOGO */}
      <aside className="fixed top-14 left-0 w-72 bottom-0 bg-white border-r border-gray-200 p-5 flex flex-col justify-between z-40 overflow-y-auto no-print">
        <div className="flex-1 flex flex-col min-h-0 text-left">
          
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-3 pt-2">
            NAVEGAÇÃO DA PROPOSTA
          </span>

          {/* Proposal Navigation Tabs */}
          <nav className="space-y-1.5 flex-1 pr-1">
            <button
              onClick={() => setActiveTab('presentation')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                activeTab === 'presentation' 
                  ? 'bg-sky-50 text-[#009AC7] border-l-4 border-[#009AC7] shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4" />
                <span>1. Apresentação Catálogo</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-0.5 transition-transform" />
            </button>

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
                <span>2. Proposta Comercial</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => setActiveTab('minuta')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                activeTab === 'minuta' 
                  ? 'bg-sky-50 text-[#009AC7] border-l-4 border-[#009AC7] shadow-xs' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSignature className="w-4 h-4" />
                <span>3. Minuta de Contrato</span>
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
                <span>4. Conversa &amp; Feedback</span>
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
            <div className="space-y-6">
              
              {/* PAGE 1: Presentation & Technical Specs */}
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
                    PROPOSTA COMERCIAL DE LOCAÇÃO DE EQUIPAMENTOS
                  </h2>
                  <p className="text-xs font-bold text-slate-600">Proposta nº #{String(p.id).padStart(4, '0')}</p>
                  <p className="text-[11px] text-slate-400">Data: {emissao}</p>
                </div>

                {/* Client Data Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2" style={{ borderLeft: `4px solid ${primaryColor}` }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: primaryColor }}>
                    DADOS DO CLIENTE
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

                {/* Equipment Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2 text-left">
                  <div className="md:col-span-5 space-y-4">
                    <div className="h-56 bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-center">
                      <img src={mainPhoto} alt={p.machine_name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5">
                      <h4 className="font-bold text-slate-900 uppercase text-[10px] border-b border-slate-200 pb-1 mb-1">DIFERENCIAIS</h4>
                      <p>• Alta produtividade e eficiência em grandes áreas.</p>
                      <p>• Facilidade de operação e controles simples.</p>
                      <p>• Robustez construtiva Tennant reconhecida.</p>
                      <p>• Suporte técnico e peças originais Alfa Tennant.</p>
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-900 border-b-2 pb-1.5 uppercase" style={{ borderColor: primaryColor }}>
                      {p.machine_name || 'Equipamento'}
                    </h3>
                    <p className="text-[11px] text-slate-500 italic leading-relaxed">
                      {p.machine_technical_description || 'Equipamento de alta qualidade e rendimento, ideal para processos contínuos de higienização de pisos.'}
                    </p>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: primaryColor }}>
                        ESPECIFICAÇÕES TÉCNICAS
                      </span>
                      <div className="text-xs text-slate-700 space-y-1" dangerouslySetInnerHTML={{ __html: specsHTML }} />
                    </div>
                  </div>
                </div>

              </div>

              {/* PAGE 2: Financial Terms & Conditions */}
              <div className="bg-white p-8 md:p-12 shadow-xl rounded-xl border border-gray-200 text-slate-800 text-xs leading-relaxed space-y-6 printable-page text-left">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase text-slate-500" style={{ color: primaryColor }}>Valores e Condições de Locação</span>
                  <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" className="h-8 object-contain" />
                </div>

                <div className="space-y-6">
                  {p.items && p.items.length > 1 ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider mb-3 pb-1 border-b-2" style={{ color: primaryColor, borderColor: primaryColor }}>
                          Quadro Comparativo de Opções e Prazos de Locação
                        </h3>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                          <table className="w-full border-collapse text-xs">
                            <thead>
                              <tr style={{ backgroundColor: primaryColor }} className="text-white text-[11px] uppercase font-extrabold tracking-wider">
                                <th className="p-3 text-center w-20 border-r border-white/20">Opção</th>
                                <th className="p-3 text-left border-r border-white/20">Equipamento / Modelo</th>
                                <th className="p-3 text-left border-r border-white/20">Prazo / Período</th>
                                <th className="p-3 text-left border-r border-white/20">Tipo Contrato & Horas</th>
                                <th className="p-3 text-center w-14 border-r border-white/20">Qtd</th>
                                <th className="p-3 text-right">Valor da Locação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {p.items.map((item, idx) => {
                                const itemValInfo = getRentalValueInfo(item.period_months);
                                return (
                                  <tr key={item.id || idx} className={`text-xs hover:bg-slate-50/80 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}>
                                    <td className="p-3 text-center border-r border-slate-100">
                                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-extrabold" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                                        Opção #{idx + 1}
                                      </span>
                                    </td>
                                    <td className="p-3 font-bold text-slate-900 border-r border-slate-100">
                                      {item.machine_name || p.machine_name || 'Equipamento'}
                                    </td>
                                    <td className="p-3 font-semibold text-slate-800 border-r border-slate-100">
                                      {formatPeriod(item.period_months)}
                                    </td>
                                    <td className="p-3 text-[11px] text-slate-600 border-r border-slate-100 leading-tight">
                                      <div className="font-bold text-slate-800">{item.contract_type || '0 - Sem Cobertura'}</div>
                                      <div className="text-slate-500 text-[10px] mt-0.5">{formatHoursForPeriod(item.hours_per_month, item.period_months)}</div>
                                    </td>
                                    <td className="p-3 text-center font-bold text-slate-900 border-r border-slate-100">
                                      {item.quantity || 1}
                                    </td>
                                    <td className="p-3 text-right font-extrabold text-sm whitespace-nowrap" style={{ color: primaryColor }}>
                                      R$ {Number(item.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-[11px] font-semibold text-slate-500">{itemValInfo.suffix}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider mb-3 pb-1 border-b-2" style={{ color: primaryColor, borderColor: primaryColor }}>
                          Condições Gerais de Fornecimento
                        </h3>
                        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                          <table className="w-full border-collapse text-xs">
                            <tbody className="divide-y divide-slate-100">
                              <tr>
                                <td className="w-48 p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Região Utilizada</td>
                                <td className="p-3 font-semibold text-slate-900 border-r border-slate-100">{p.region_used || 'Curitiba e Região'}</td>
                                <td className="w-48 p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Tempo de Entrega</td>
                                <td className="p-3 font-semibold text-slate-900">{p.delivery_time || 'Imediato'}</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Custo do Frete</td>
                                <td className="p-3 font-semibold text-slate-900 border-r border-slate-100">
                                  {Number(p.freight_cost) > 0 ? `R$ ${Number(p.freight_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Incluso'}
                                </td>
                                <td className="p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Validade da Proposta</td>
                                <td className="p-3 font-semibold text-slate-900">{p.validity_days || '10 dias'}</td>
                              </tr>
                              {p.notes && (
                                <tr>
                                  <td className="p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Observações</td>
                                  <td colSpan={3} className="p-3 font-normal text-slate-700 whitespace-pre-wrap leading-relaxed">{p.notes}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider mb-3 pb-1 border-b-2" style={{ color: primaryColor, borderColor: primaryColor }}>
                        Valores e Condições de Locação
                      </h3>
                      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                        <table className="w-full border-collapse text-xs">
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="w-52 p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">{valInfo.label}</td>
                              <td className="p-3 font-extrabold text-base text-slate-900" style={{ color: primaryColor }}>
                                R$ {Number(p.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs font-semibold text-slate-500">{valInfo.suffix}</span>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Tipo de Contrato</td>
                              <td className="p-3 font-bold text-slate-900">{p.contract_type || '0 - Sem Cobertura'}</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Período de Locação</td>
                              <td className="p-3 font-semibold text-slate-900">{formatPeriod(p.period_months)}</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Franquia de Horas</td>
                              <td className="p-3 font-semibold text-slate-900">{formatHoursForPeriod(p.hours_per_month, p.period_months)}</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Região Utilizada</td>
                              <td className="p-3 font-semibold text-slate-900">{p.region_used || 'Curitiba e Região'}</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Tempo de Entrega</td>
                              <td className="p-3 font-semibold text-slate-900">{p.delivery_time || 'Imediato'}</td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Custo do Frete</td>
                              <td className="p-3 font-semibold text-slate-900">
                                {Number(p.freight_cost) > 0 ? `R$ ${Number(p.freight_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Incluso'}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Validade da Proposta</td>
                              <td className="p-3 font-semibold text-slate-900">{p.validity_days || '10 dias'}</td>
                            </tr>
                            {p.notes && (
                              <tr>
                                <td className="p-3 font-bold text-slate-600 bg-slate-50/80 border-r border-slate-100 uppercase text-[10px] tracking-wider">Observações</td>
                                <td className="p-3 font-normal text-slate-700 whitespace-pre-wrap leading-relaxed">{p.notes}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-600 leading-relaxed text-justify italic">
                    Todos os pedidos estão sujeitos aos nossos termos e condições gerais que se encontram registrados perante o <strong className="font-bold text-slate-900">3º Oficial de Registro de Títulos e Documentos e Civil de Pessoa Jurídica da Capital – São Paulo</strong>, cuja cópia digitalizada está disponível no site: <u>www.alfatennant.com.br/terms</u> e também por e-mail ou correio quando solicitada.
                  </p>

                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-2">* TABELA DESCRITIVA DE TIPOS DE CONTRATO</span>
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

                  <div className="pt-4 flex items-end justify-between border-t border-slate-200">
                    <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg max-w-xs text-xs text-slate-800 font-medium">
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: primaryColor }}>
                        Dados do Vendedor
                      </span>
                      <div className="whitespace-pre-line leading-relaxed">{p.seller_info || 'Alfa Tennant\nAtendimento Comercial'}</div>
                    </div>

                    <div className="text-right text-[10px] text-slate-400 space-y-1">
                      <img src="https://www.tennantco.com/content/dam/resources/images/alfa-tennant-logo-150x70.png" alt="Alfa Tennant" className="h-8 object-contain ml-auto mb-1" />
                      <p className="font-bold text-slate-700">Rua Barão de Campinas, 715</p>
                      <p>São Paulo, SP - 01201-902</p>
                      <p>Vendas: (11) 3320-8550</p>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {activeTab === 'presentation' && (
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-md border border-slate-200 space-y-4 text-left">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Catálogo de Equipamentos</h3>
              <h4 className="text-base font-extrabold text-[#009AC7]">{p.machine_name}</h4>
              <div className="flex justify-center py-4">
                <img src={mainPhoto} alt={p.machine_name} className="max-h-72 object-contain mix-blend-multiply" />
              </div>
              <div className="text-xs text-slate-700 leading-relaxed space-y-1" dangerouslySetInnerHTML={{ __html: specsHTML }} />
            </div>
          )}

          {/* 3. MINUTA DE CONTRATO COMPLETA 100% IDENTICAL TO OFFICIAL CLAUSES */}
          {activeTab === 'minuta' && (
            <div className="bg-white p-8 md:p-12 shadow-xl rounded-xl border border-gray-200 text-slate-800 text-xs leading-relaxed space-y-6 printable-page text-left">
              <div className="text-center border-b pb-4 mb-6">
                <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900">
                  MINUTA DO CONTRATO PADRÃO DE LOCAÇÃO DE BENS MÓVEIS E OUTROS
                </h2>
                <p className="text-xs font-bold text-slate-600 mt-1">Registrado perante o 3º Oficial de Registro de Títulos e Documentos da Capital – São Paulo</p>
              </div>

              {/* Preâmbulo */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider block text-[#009AC7]">
                  PREÂMBULO DO CONTRATO DE LOCAÇÃO Nº #{String(p.id).padStart(4, '0')}
                </span>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  <div><span className="font-bold text-slate-700">LOCADORA:</span> {companyName} (CNPJ: {companyCnpj})</div>
                  <div><span className="font-bold text-slate-700">LOCATÁRIA:</span> {p.client_razao_social || p.client_name} (CNPJ: {p.client_document || '—'})</div>
                  <div><span className="font-bold text-slate-700">OBJETO:</span> Locação de 01 {p.machine_name}</div>
                  <div><span className="font-bold text-slate-700">VIGÊNCIA:</span> {formatPeriod(p.period_months)}</div>
                  <div><span className="font-bold text-slate-700">{valInfo.priceTitle}</span> R$ {Number(p.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {valInfo.suffix}</div>
                  <div><span className="font-bold text-slate-700">FORO:</span> Pinhais / PR</div>
                </div>
              </div>

              {/* Cláusulas I a XV Exatas do Usuário */}
              <div className="space-y-4 text-xs text-slate-700 leading-relaxed pt-2">
                
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA I – DO(S) BEM(NS) MÓVEL(IS)</h4>
                  <p>1.1. A LOCADORA é legítima proprietária do(s) bem(ns) móvel(is) descritos no campo 01 do preâmbulo do presente Contrato.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA II - DO OBJETO</h4>
                  <p>2.1. Constitui objeto do presente contrato a locação do(s) bem(ns) móvel(is) descrito(s) na Cláusula I, de propriedade da LOCADORA, que serão explorados pela LOCATÁRIA para fins presentes em seu escopo de atuação. Os bens ora locados serão utilizados pela LOCATÁRIA no local/endereço identificado no campo 02 do preâmbulo deste Contrato.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA III - DO PRAZO</h4>
                  <p>3.1. O prazo de vigência do presente contrato será aquele estabelecido no campo 03 do preâmbulo deste Instrumento, comprometendo-se a LOCATÁRIA a devolver o(s) bem(s) objeto do presente Contrato ao fim da vigência deste Contrato nas mesmas condições do recebimento, salvo os desgastes decorrentes do uso natural do(s) mesmo(s).</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA IV - DA RENOVAÇÃO</h4>
                  <p>4.1. Findo o prazo de vigência do presente contrato, as Partes, de comum acordo, deliberarão sobre a renovação da locação em questão.</p>
                  <p>4.2. Caso as partes decidam pela prorrogação do prazo, sem alterações no contrato vigente (além de valores a serem praticados e prazo), tal renovação poderá ser feita automaticamente por igual período mediante manifestação das partes, podendo esta manifestação ser feita por meio de e-mail. No caso de renovação automática e, por prazos indeterminado, a multa estabelecida no campo 5, passa a não mais vigorar.</p>
                  <p>4.2.A. Caso as partes decidam pela prorrogação do prazo, porém, com alteração de alguma das cláusulas vigentes (exceto as mencionadas acima), tal prorrogação será feita mediante a assinatura de um Termo Aditivo ao contrato vigente.</p>
                  <p>4.3. Caso as Partes decidam pela não renovação do Contrato, a LOCATÁRIA deverá emitir Nota Fiscal de retorno referente à nota fiscal de remessa de locação recebida no momento da entrega do equipamento da LOCADORA. Caso não seja feita a nota fiscal de devolução e/ou solicitada à retirada do(s) bens pela LOCATÁRIA, o contrato será renovado automaticamente por prazo indeterminado, gerando a cobrança mensal do aluguel, até a emissão da nota fiscal de devolução e respectiva devolução do equipamento locado.</p>
                  <p>4.4. Caso a LOCATÁRIA seja isenta, esta deverá emitir a nota fiscal avulsa ou declaração (de acordo com a legislação vigente em seu Estado de origem).</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA V - DO VALOR DA LOCAÇÃO</h4>
                  <p>5.1. A LOCATÁRIA pagará pela locação supra o valor mensal definido no campo 04 do preâmbulo deste Contrato, mediante depósito para crédito da LOCADORA em conta corrente por esta indicada, ou mediante o pagamento de boleto bancário emitido pela LOCADORA.</p>
                  <p>5.2. A primeira fatura de locação será emitida juntamente com o documento fiscal de remessa de locação, com o prazo de pagamento indicado no preâmbulo 4 deste contrato, sendo as demais faturas emitidas nos meses subsequentes.</p>
                  <p>5.3. O não pagamento do aluguel na respectiva data de vencimento implicará na incidência de multa moratória de 2% (dois por cento) sobre o valor em atraso, além de juros de mora de 1% (um por cento) ao mês. Os juros de mora serão calculados “pro rata die” pelo período entre a data de vencimento do aluguel e data do seu efetivo pagamento.</p>
                  <p>5.4. Caso sejam criados novos tributos, extintos os atuais ou alteradas suas alíquotas, bases de cálculo ou interpretação legal durante a vigência deste contrato, o valor do aluguel poderá ser ajustado somente se houver impacto comprovado nos custos da locação.</p>
                  <p>5.4.1. O reajuste deverá ser comprovado documentalmente pela parte interessada e limited ao valor efetivo da variação tributária.</p>
                  <p>5.4.2. Em caso de redução da carga tributária, as partes deverão rever o valor do aluguel para manter o equilíbrio econômico do contrato.</p>
                  <p>5.5. Os aluguéis serão devidos pela LOCATÁRIA, independente do uso ou não dos bens, seja por motivo de manutenção, reparos ou qualquer outra razão, não podendo a LOCATÁRIA, em hipótese alguma, reter os pagamentos dos aluguéis, a que título for.</p>
                  <p>5.5.1. Na hipótese de o equipamento permanecer inoperante por período superior a 48 horas úteis após o chamado técnico, a LOCATÁRIA ficará isenta do pagamento do aluguel proporcional aos dias de inoperância, ou fará jus à substituição imediata do equipamento por outro em perfeitas condições de uso.</p>
                  <p>5.6. O valor a ser pago pela LOCATÁRIA a título de locação dos bens, não inclui cobertura securitária de riscos relacionados com a operação dos bens, que será de exclusiva responsabilidade da LOCATÁRIA, bem como, não inclui outras despesas além das que estiverem expressamente previstas neste contrato.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA VI - DO REAJUSTE</h4>
                  <p>6.1. O valor do aluguel definido no preambulo e no Anexo I do presente contrato será reajustado anualmente (a cada 12 meses a contar da data de recebimento dos bens locados) conforme variação do Índice IPCA do mesmo período, ou por outro índice que venha substitui-lo.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA VII - DA CONSERVAÇÃO</h4>
                  <p>7.1. A LOCATÁRIA declara haver recebido na data e nas condições declaradas no anexo II, os bens móveis em perfeito estado de funcionalidade, cabendo-lhe trazer os bens locados em perfeito estado de funcionamento para assim restituí-los quando findo ou rescindido este contrato, livre e desembaraçado de quaisquer ônus.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA VIII – DA CONSERVAÇÃO DOS BENS LOCADOS</h4>
                  <p>8.0. A LOCADORA efetuará a manutenção do(s) bem(ns) ora objeto do presente contrato, decorrentes do uso e desgaste natural do(s) bem(ns), de acordo com a contratação do seguinte formato de manutenção pela LOCATÁRIA, especificados no Anexo I: Incluso: Mão de Obra de Manutenção Preventiva e Corretiva, e Deslocamento do Técnico Autorizado CLEAN TECH PRO.</p>
                  <p>8.0.1. O prazo máximo para o início do atendimento técnico será de até 48 horas úteis e o prazo máximo para solução definitiva do problema será de 72 horas úteis. O descumprimento sujeitará a LOCADORA à multa de 10% do valor mensal do aluguel por ocorrência.</p>
                  <p>8.1. Não incluso: peças desgastadas pelo uso diário, como refil de borrachas de rodo e mangueiras, Combustíveis, Água destilada, Químicos, Escovas, Discos e Baterias.</p>
                  <p>8.2. A LOCATÁRIA arcará com quaisquer custos havidos com manutenção corretiva decorrente de mau uso ou uso inadequado dos bens, em desconformidade com as instruções de operação e de manutenção dos bens descritas no manual do operador fornecido pelo fabricante. Também caracteriza mau uso, o não seguimento das manutenções diárias atribuídas ao operador, como por exemplo limpeza do equipamento, completar o nível de água das baterias, detecção de vazamentos entre outros descritos e assim especificados no manual do operador. Alguns outros exemplos de mau uso: Usar o equipamento com os discos ou escovas em mau estado ou gastos, causando danos na manta agulhada; usar a lavadora para remoção de cera em qualquer uma de suas etapas; transitar em pisos danificados ou irregulares como paralelepípedos e bloquetes; uso em rampas além do limite especificado no manual do operador; choques mecânicos contra obstáculos; quedas; recolhimento de produtos inflamáveis ou reagentes; uso de detergentes ou produtos químicos que produzam excesso de espuma ou ataquem componentes do equipamento; ligação em tensão incorreta; uso de extensões, plugues e tomadas em mau estado ou fora das especificações. Os custos para reparos de danos causados por estas condições não estão inclusos na espécie de manutenção contratada. Assim, ocorrendo o desaparecimento, perecimento não natural, destruição, mau uso, extravio ou de qualquer forma a inutilização de qualquer parte ou acessório que pertença ao(s) bem(s) locado(s), será emitida nota fiscal e fatura dos respectivos itens e realizada a troca pela LOCADORA.</p>
                  <p>8.2.1. Qualquer dano ou defeito será objeto de vistoria técnica conjunta, com emissão de relatório de constatação assinado por representantes de ambas as partes. Na ausência de assinatura conjunta, não poderá a LOCADORA imputar responsabilidade à LOCATÁRIA.</p>
                  <p>8.3. A LOCADORA fará o fornecimento integral de todo o ferramental, peças e equipamentos necessários à efetiva prestação de serviços de manutenção, de acordo com o modelo contratado pela LOCATÁRIA no Anexo I, assim como solicitará que um técnico forneça instruções de operações dos bens e treinamento dos operadores dos bens locados.</p>
                  <p>8.4. Toda e qualquer peça ou acessório de reposição introduzida nos BENS locados ficará sendo de exclusiva propriedade da LOCADORA e parte do respectivo bem, para todos os efeitos contratuais e legais, renunciando expressamente a LOCATÁRIA a todo e qualquer direito de indenização ou retenção.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA IX – OBRIGAÇÕES DA LOCADORA</h4>
                  <p>9.1. São obrigações da LOCADORA:</p>
                  <p>a) Realizar, no início da locação, a entrega do(s) bem(ns) móvel(is);</p>
                  <p>b) Guardar absoluto sigilo com relação a todas as informações sobre as atividades e o processo produtivo da LOCATÁRIA;</p>
                  <p>c) Fornecer à LOCATÁRIA, no ato da entrega dos BENS locados, as instruções de operação e de manutenção dos bens, em conformidade com as condições determinadas pelos fabricantes dos mesmos;</p>
                  <p>d) Realizar a manutenção preventiva de itens pré-definidos, de acordo com o modelo de equipamento e intensidade de uso. A manutenção preventiva poderá a critério da LOCADORA ocorrer simultaneamente à visita corretiva;</p>
                  <p>e) Realizar a manutenção corretiva que consiste em serviços de correção, consertos e reparação dos equipamentos relacionados no Anexo I, assim como a mão-de-obra para substituição de consumíveis e peças descritas. Esses serviços devem ser solicitados pela LOCATÁRIA através do nosso Portal Pós-Venda e obedecerão aos critérios de atendimento, no que se refere ao tempo necessário de deslocamento do profissional da LOCADORA ao local, sendo de em média até 02 dias úteis para o primeiro atendimento (48 horas) e o prazo de em média 72 horas úteis para o equipamento estar operativo.</p>
                  <p>f) Em caso de falha que impeça o uso do equipamento por mais de 48 horas, a LOCADORA fornecerá, sem custo adicional, equipamento de substituição equivalente, até o restabelecimento do original.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA X – OBRIGAÇÕES DA LOCATÁRIA</h4>
                  <p>10.1. São obrigações da LOCATÁRIA:</p>
                  <p>a) Vistoriar o(s) bem(ns) móvel(is) por ocasião da sua entrega pela LOCADORA, comprometendo-se a devolvê-lo(s) nas mesmas condições do recebimento, salvo desgastes decorrentes do uso natural do(s) bem(ns);</p>
                  <p>b) Promover e responder pela guarda e vigilância do(s) bem(ns), zelando pela sua integridade e segurança contra roubo, furto, vandalismo ou depredações, devendo conservá-lo(s) em área coberta; sejam quais forem os causadores, eventos e circunstâncias em que os mesmos se verifiquem, ainda que resultantes de caso fortuito ou força maior dos quais dará a LOCATÁRIA ciência à LOCADORA, de imediato e por escrito;</p>
                  <p>c) Assegurar que a utilização do(s) bem(ns) seja realizada dentro de limites de aplicação usuais para equipamentos similares, não os submetendo à utilização em condições adversas, ambientes agressivos ou acima de sua capacidade especificada pelo(s) fabricante(s) no manual de utilização;</p>
                  <p>d) Seguir rigorosamente as instruções de operação e de manutenção do(s) bem(ns), em conformidade com as condições determinadas pelo(s) fabricante(s) dos mesmos, sendo que a LOCADORA se reserva o direito de fiscalizar a utilização do(s) bem(ns), podendo solicitar à LOCATÁRIA correções na sua operação ou manutenção, no que deverá ser prontamente atendida;</p>
                  <p>e) Para a execução dos itens d) e e) da Cláusula IX, a LOCATÁRIA deverá permitir o acesso dos técnicos da LOCADORA aos equipamentos, permitindo desta forma que a manutenção seja realizada conforme planejado. A LOCATÁRIA deverá ainda disponibilizar local arejado, com iluminação adequada, seguro, protegido de sol e chuva atendendo desta forma todas as exigências de segurança do trabalho;</p>
                  <p>f) Não efetuar alterações ou adaptações que modifiquem as características técnicas do(s) bem(ns);</p>
                  <p>g) Defender e fazer valer os direitos de propriedade da LOCADORA sobre o(s) bem(ns), não permitindo em hipótese alguma, direta ou indiretamente, que se constituam ônus, penhor, caução de qualquer direito de terceiros sobre os mesmos;</p>
                  <p>h) Arcar com quaisquer custos havidos em decorrência de mau uso do(s) bem(ns), inclusive os de manutenção corretiva;</p>
                  <p>i) Manter o(s) bem(s) no local indicado no campo 02 do preâmbulo deste Contrato durante todo o prazo de sua vigência, salvo se prévia e expressamente autorizado pela LOCADORA seu transporte para outro local devidamente identificado;</p>
                  <p>j) Responsabilizar-se pelas despesas relativas ou decorrentes deste contrato como as de registro e averbação em Cartório de Títulos e Documentos, licenças, autorizações e registros que são ou venham a ser necessários para a utilização dos bens locados;</p>
                  <p>k) Ao término do contrato de locação, a LOCATÁRIA obrigatoriamente deverá emitir a nota fiscal de retorno de locação ou declaração de transporte, de acordo com a legislação fiscal vigente, para que a LOCADORA possa fazer a retirada e posterior transporte do equipamento locado para sua base e desta forma encerrar fiscalmente o processo de locação. Caso esta nota fiscal de retorno não seja emitida, a LOCADORA não poderá retirar o equipamento do local de uso do equipamento, e consequentemente manterá a emissão da cobrança até o encerramento deste processo;</p>
                  <p>l) Ao término da locação, será feita uma vistoria no equipamento, no local de uso do equipamento, para identificação de eventuais danos / avarias / itens faltantes que possam ter sido causados por mau uso do equipamento. Esta vistoria deve ser realizada acompanhada de um responsável da LOCATÁRIA que assinará o relatório de vistoria. Caso sejam constatadas tais ocorrências será apresentada ao cliente a relação de peças com avarias para posterior cobrança.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA XI - DA RESCISÃO OU RESILIÇÃO</h4>
                  <p>11.1. Na hipótese de inadimplemento de qualquer cláusula ou condição avençada, este contrato poderá, a critério exclusivo da parte inocente, ser considerado rescindido, independentemente da interpelação judicial ou extrajudicial, desde que tenha dado previamente à outra parte prazo razoável para sanar a irregularidade e a mesma não tenha sido sanada no prazo.</p>
                  <p>11.2. Em caso de rescisão antecipada deste contrato por inadimplemento das partes em qualquer de suas obrigações avençadas neste instrumento, a parte que provocou a rescisão por tal motivo fica obrigada a indenizar a outra nos exatos termos do artigo 570 do Código Civil Brasileiro.</p>
                  <p>11.3. O presente contrato, podendo ser rompido, antes do seu término, por qualquer das Partes, imotivadamente, ou seja, independentemente de justo motivo, mediante comunicação escrita, com antecedência mínima de 30 (trinta) dias, a partir do recebimento da comunicação.</p>
                  <p>11.3.1. Fica sujeita ao pagamento de multa contratual no valor equivalente ao número de aluguéis vincendos indicados no campo 05 do preâmbulo deste Contrato, vigentes à data da notificação com tal propósito.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA XII - DAS DISPOSIÇÕES GERAIS</h4>
                  <p>12.1. A LOCATÁRIA não poderá sublocar, subarrendar ou emprestar, no todo ou em parte, o(s) bem(ns) móvel(is) (ou parte deles), objeto deste contrato, bem como seus acessórios e equipamentos, em conjunto ou separadamente, salvo se prévia e expressamente autorizado pela LOCADORA, permanecendo, em qualquer hipótese, como responsável pelo integral cumprimento deste Contrato.</p>
                  <p>12.1.1. O bem locado poderá ser utilizado por empresas do mesmo grupo econômico da LOCATÁRIA, ou por empresas contratadas para execução de seus serviços, sem que isso caracterize sublocação.</p>
                  <p>12.1.2. Caso a LOCATÁRIA perca o contrato público ou privado ao qual o bem estava vinculado, poderá rescindir o presente contrato sem multa, desde que comunique a LOCADORA com antecedência mínima de 30 (trinta) dias e devolva o bem conforme as condições contratadas.</p>
                  <p>12.2. Concordam as partes que eventuais citações, intimações e notificações decorrentes do presente instrumento poderão ser feitas por correspondências escritas com aviso de recebimento (AR), através de Cartório de Títulos e Documentos ou correspondências sob protocolo, nas pessoas de seus representantes legais.</p>
                  <p>12.3. Os documentos abaixo relacionados, na forma de anexo(s), cujos termos as PARTES, neste ato, declaram conhecer e se obrigam a cumprir, constituem parte integrante deste contrato: Anexo I – Proposta Comercial; e Anexo II – Declaração de recebimento dos Bens.</p>
                  <p>12.4. Autorização e Poderes – As Partes declaram possui plena capacidade e autoridade para celebrar o Contrato e realizar todas as operações aqui previstas.</p>
                  <p>12.5. Ausência de Violação e Consentimentos – A celebração e formalização do Contrato não violam quaisquer disposições de lei ou obrigações contratuais anteriores.</p>
                  <p>12.6. Propriedade Intelectual – As Partes não poderão se utilizar de qualquer propriedade intelectual de titularidade da outra Parte sem autorização expressa por escrito.</p>
                  <p>12.7. Melhores Esforços – As Partes envidarão os seus melhores esforços para atingir o objeto do Contrato.</p>
                  <p>12.8. Sucessão – O Contrato obriga as Partes e seus sucessores, a qualquer título.</p>
                  <p>12.9. Confidencialidade – As Partes reconhecem que as informações relacionadas ao Contrato possuem natureza estritamente confidencial.</p>
                  <p>12.9.1. A LOCADORA compromete-se a manter sigilo absoluto sobre todas as informações, dados e processos operacionais da LOCATÁRIA por 5 (cinco) anos após o término do contrato.</p>
                  <p>12.10. Novação – A eventual liberalidade de uma parte não constituirá novação contratual.</p>
                  <p>12.11. Proteção de Dados – As Partes declaram estar em conformidade com a Lei Geral de Proteção de Dados Pessoais (“LGPD”) Lei 13.709/2018.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA XIII - ALTERAÇÕES CONTRATUAIS</h4>
                  <p>13.1. Qualquer alteração deste contrato, somente será válida se efetuada por escrito, através de documento assinado por ambas as partes.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA XIV – VALOR DO CONTRATO</h4>
                  <p>14.1. O valor total do presente contrato indicado no preâmbulo deste Contrato leva em conta o prazo estipulado e o valor do aluguel descrito na Cláusula V. Tal valor é indicativo.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b pb-1 mb-1">CLÁUSULA XV - DO FORO</h4>
                  <p>15.1. As partes elegem o foro da cidade de Pinhais/PR, para dirimir quaisquer dúvidas ou conflitos decorrentes do presente instrumento.</p>
                </div>

              </div>

              <div className="pt-6 border-t border-slate-200 text-center text-xs font-semibold text-slate-600">
                Pinhais, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
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
              {p.items && p.items.length > 1 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block font-bold text-slate-800">Selecione a Opção Aprovada *</label>
                  <select
                    value={selectedOptionToApprove}
                    onChange={e => setSelectedOptionToApprove(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none bg-white font-medium text-slate-800"
                  >
                    <option value="all">Pacote Completo / Todas as Opções</option>
                    {p.items.map((item, idx) => (
                      <option key={item.id || idx} value={item.id || idx}>
                        Opção #{idx + 1}: {item.machine_name || p.machine_name} ({formatPeriod(item.period_months)} - R$ {Number(item.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500">
                    Indique se você está aprovando uma opção específica ou o conjunto de opções.
                  </p>
                </div>
              )}

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
