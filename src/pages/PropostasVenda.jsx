import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Edit, X, Trash2, FileText, ArrowLeft, Printer, Check, Link2, ShoppingCart, Clock } from 'lucide-react';

export default function PropostasVenda() {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'pdf'
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Form Dependencies
  const [clients, setClients] = useState([]);
  const [machineModels, setMachineModels] = useState([]);

  // Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    client_id: '',
    machine_model_id: '',
    fob_price: 'A consultar',
    cif_price: 'A consultar',
    taxes_info: 'Conforme texto abaixo',
    proposal_value: '',
    payment_terms: '',
    delivery_time: '',
    warranty: '12 Meses',
    validity_days: '10 Dias',
    notes: '',
    seller_info: 'Cristiano Magalhães\nContato Comercial\ncristiano@cleantechpro.com.br',
    status: 'Rascunho'
  });

  // Share Validity Modal States (Identical to PropostasLocacao)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareProposalId, setShareProposalId] = useState(null);
  const [shareValidityDays, setShareValidityDays] = useState('10 dias');
  const [isSavingShare, setIsSavingShare] = useState(false);

  useEffect(() => {
    fetchProposals();
    loadFormDependencies();
  }, []);

  async function fetchProposals() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-sales-proposals');
      const data = await res.json();
      if (data.proposals) setProposals(data.proposals);
    } catch (error) {
      console.error('Erro ao buscar propostas de venda:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFormDependencies() {
    try {
      const clientsRes = await fetch('/api/get-clients');
      const clientsData = await clientsRes.json();
      if (clientsData.clients) setClients(clientsData.clients);

      const machinesRes = await fetch('/api/get-machine-models');
      const machinesData = await machinesRes.json();
      if (machinesData.machineModels) setMachineModels(machinesData.machineModels);
    } catch (error) {
      console.error('Erro ao carregar dependências:', error);
    }
  }

  function handleOpenCreateModal() {
    setFormData({
      id: null,
      client_id: '',
      machine_model_id: '',
      fob_price: 'A consultar',
      cif_price: 'A consultar',
      taxes_info: 'Conforme texto abaixo',
      proposal_value: '',
      payment_terms: '',
      delivery_time: '',
      warranty: '12 Meses',
      validity_days: '10 Dias',
      notes: '',
      seller_info: 'Cristiano Magalhães\nContato Comercial\ncristiano@cleantechpro.com.br',
      status: 'Rascunho'
    });
    setIsModalOpen(true);
  }

  function handleOpenEditModal(p) {
    setFormData({
      id: p.id,
      client_id: p.client_id || '',
      machine_model_id: p.machine_model_id || '',
      fob_price: p.fob_price || 'A consultar',
      cif_price: p.cif_price || 'A consultar',
      taxes_info: p.taxes_info || 'Conforme texto abaixo',
      proposal_value: p.proposal_value || '',
      payment_terms: p.payment_terms || '',
      delivery_time: p.delivery_time || '',
      warranty: p.warranty || '12 Meses',
      validity_days: p.validity_days || '10 Dias',
      notes: p.notes || '',
      seller_info: p.seller_info || 'Cristiano Magalhães\nContato Comercial\ncristiano@cleantechpro.com.br',
      status: p.status || 'Rascunho'
    });
    setIsModalOpen(true);
  }

  async function handleSaveProposal(e) {
    e.preventDefault();
    if (!formData.client_id || !formData.machine_model_id) {
      alert('Por favor, selecione o Cliente e o Equipamento.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/save-sales-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchProposals();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar proposta de venda.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão ao salvar proposta.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProposal(id) {
    if (!confirm('Deseja realmente excluir esta Proposta de Venda?')) return;
    try {
      const res = await fetch('/api/delete-sales-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchProposals();
      } else {
        alert('Erro ao excluir proposta.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão ao excluir proposta.');
    }
  }

  function handleExportSalesProposalPDF(p) {
    const companyLogo = localStorage.getItem('app_company_logo') || '';
    const companyName = localStorage.getItem('app_company_name') || 'CLEAN TECH SMART';
    const companyCnpj = localStorage.getItem('app_company_cnpj') || '00.000.000/0001-00';
    const companyAddress = localStorage.getItem('app_company_address') || 'Rua Barão de Campinas, 715 - São Paulo, SP';
    const companyPhone = localStorage.getItem('app_company_phone') || '(11) 3320-8550';
    const companyEmail = localStorage.getItem('app_company_email') || 'info.brasil@tennantco.com';
    const primaryColor = localStorage.getItem('app_pdf_color') || '#009AC7';
    const emissao = new Date(p.created_at || new Date()).toLocaleDateString('pt-BR');
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
  
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:15px">
    <div style="background:#EEF2FF;border:1px solid #cbd5e1;border-radius:6px;padding:12px 16px;font-size:11px;max-width:280px">
      <b style="color:${primaryColor};text-transform:uppercase;font-size:10px;display:block;margin-bottom:4px">Atenciosamente,</b>
      <div style="white-space:pre-wrap">${p.seller_info || 'Alfa Tennant\nAtendimento Comercial'}</div>
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
  }

  function handleOpenPrintView(p) {
    handleExportSalesProposalPDF(p);
  }

  function handleShareProposalLink(p) {
    setShareProposalId(p.id);
    setShareValidityDays(p.validity_days || '10 dias');
    setIsShareModalOpen(true);
  }

  const handleConfirmShare = async (e) => {
    e.preventDefault();
    if (!shareProposalId) return;
    setIsSavingShare(true);
    try {
      await fetch('/api/update-proposal-validity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shareProposalId, validity_days: shareValidityDays, type: 'sales' })
      });
      const publicUrl = `${window.location.origin}/visualizar-proposta-venda/${shareProposalId}`;
      navigator.clipboard.writeText(publicUrl);
      alert(`Link público da Proposta de Venda nº #${String(shareProposalId).padStart(4, '0')} copiado para a área de transferência!\n\nValidade atualizada para ${shareValidityDays}.\n\n${publicUrl}`);
      setIsShareModalOpen(false);
      fetchProposals();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar validade da proposta.');
    } finally {
      setIsSavingShare(false);
    }
  };

  const filteredProposals = proposals.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      String(p.id).includes(term) ||
      (p.client_name && p.client_name.toLowerCase().includes(term)) ||
      (p.machine_name && p.machine_name.toLowerCase().includes(term)) ||
      (p.proposal_value && p.proposal_value.toLowerCase().includes(term))
    );
  });

  // Render PDF Print View
  if (viewMode === 'pdf' && selectedProposal) {
    const p = selectedProposal;
    const companyLogo = localStorage.getItem('app_company_logo') || '';
    const companyName = localStorage.getItem('app_company_name') || 'CLEAN TECH SMART';
    const companyCnpj = localStorage.getItem('app_company_cnpj') || '00.000.000/0001-00';
    const companyAddress = localStorage.getItem('app_company_address') || 'Rua Barão de Campinas, 715 - São Paulo, SP';
    const companyPhone = localStorage.getItem('app_company_phone') || '(11) 3320-8550';
    const companyEmail = localStorage.getItem('app_company_email') || 'info.brasil@tennantco.com';
    const primaryColor = localStorage.getItem('app_pdf_color') || '#009AC7';
    const emissao = new Date(p.created_at || new Date()).toLocaleDateString('pt-BR');

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
      <div className="min-h-screen bg-slate-100 font-sans pb-12">
        {/* Top Print Bar - Identical to PropostasLocacao */}
        <div className="fixed top-0 left-0 right-0 bg-[#009AC7] text-white px-6 py-3 flex items-center justify-between z-50 shadow-md no-print">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Lista</span>
            </button>
            <span className="text-xs font-bold text-white">
              📄 Proposta de Venda #{String(p.id).padStart(4, '0')} &mdash; {p.client_razao_social || p.client_name}
            </span>
          </div>
          <button
            onClick={() => handleExportSalesProposalPDF(p)}
            className="px-4 py-1.5 bg-white text-[#009AC7] hover:bg-slate-50 text-xs font-extrabold rounded-lg flex items-center space-x-2 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>🖨️&nbsp; Salvar / Imprimir PDF</span>
          </button>
        </div>

        {/* Printable Sheet */}
        <div className="pt-16 px-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-2">
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
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-800 space-y-6">
      {/* Top Title Bar - Header Card */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2.5">
            <ShoppingCart className="w-6 h-6 text-[#009AC7]" />
            <span>Propostas de Venda</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Elabore e gerencie propostas comerciais de venda de equipamentos com a tabela padrão Alfa Tennant.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center px-4 py-2.5 bg-[#009AC7] hover:bg-[#0088b3] text-white font-bold rounded-lg transition-colors shadow-sm shrink-0 whitespace-nowrap text-sm mt-4 md:mt-0"
        >
          <Plus className="w-4 h-4 mr-2 shrink-0" />
          <span>Nova Proposta de Venda</span>
        </button>
      </header>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center space-x-3">
        <Search className="w-5 h-5 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Buscar por cliente, equipamento, valor ou número da proposta..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
        />
      </div>

      {/* Proposals List */}
      {isLoading ? (
        <div className="py-16 text-center text-gray-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#009AC7]" />
          <p className="text-sm font-medium">Carregando propostas de venda...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3 shadow-xs">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-700">Nenhuma Proposta de Venda cadastrada</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Clique no botão acima para elaborar sua primeira proposta comercial de venda de equipamentos.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200 uppercase text-[10px] font-bold text-gray-400 tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Proposta</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Equipamento</th>
                  <th className="px-5 py-3.5">Valor da Proposta</th>
                  <th className="px-5 py-3.5">Garantia</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProposals.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-900 whitespace-nowrap">
                      #{String(p.id).padStart(4, '0')}
                    </td>
                    <td className="px-5 py-4 min-w-[160px]">
                      <span className="font-bold text-gray-900 block truncate">{p.client_razao_social || p.client_name || 'Sem Cliente'}</span>
                      <span className="text-[11px] text-gray-400 block">{p.client_cnpj || ''}</span>
                    </td>
                    <td className="px-5 py-4 min-w-[160px]">
                      <span className="font-semibold text-gray-800 block truncate">{p.machine_name || 'Sem Máquina'}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-[#009AC7] whitespace-nowrap">
                      {p.proposal_value ? `R$ ${p.proposal_value}` : 'A consultar'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-600 whitespace-nowrap">
                      {p.warranty || '12 Meses'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        p.status === 'Aprovada'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {p.status || 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => handleOpenPrintView(p)}
                        className="p-2 text-slate-600 hover:text-[#009AC7] hover:bg-sky-50 rounded-xl transition-all"
                        title="Imprimir / Gerar PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShareProposalLink(p)}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Compartilhar Link Público"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                        title="Editar Proposta"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProposal(p.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir Proposta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- MODAL FORM CREATE / EDIT ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl border border-gray-200 flex flex-col overflow-hidden text-left">
            {/* Header */}
            <div className="bg-[#0B141B] px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center space-x-2.5">
                <ShoppingCart className="w-5 h-5 text-[#009AC7]" />
                <h3 className="font-bold text-sm text-white">
                  {formData.id ? `Editar Proposta de Venda nº #${String(formData.id).padStart(4,'0')}` : 'Nova Proposta de Venda'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveProposal} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              
              {/* Section 1: Cliente e Equipamento */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#009AC7]" />
                  <span>1. Cliente e Equipamento</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cliente *</label>
                    <select
                      value={formData.client_id}
                      onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    >
                      <option value="">Selecione um Cliente...</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.document ? `(${c.document})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Equipamento / Modelo *</label>
                    <select
                      value={formData.machine_model_id}
                      onChange={e => setFormData({ ...formData, machine_model_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    >
                      <option value="">Selecione um Equipamento...</option>
                      {machineModels.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Tabela de Valores e Condições de Venda */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4 text-[#009AC7]" />
                    <span>2. Valores e Condições de Venda (Tabela Comercial)</span>
                  </h4>
                  <span className="text-[10px] text-gray-400 font-semibold">Tabela editável</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Preço FOB</label>
                    <input
                      type="text"
                      value={formData.fob_price}
                      onChange={e => setFormData({ ...formData, fob_price: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Preço CIF</label>
                    <input
                      type="text"
                      value={formData.cif_price}
                      onChange={e => setFormData({ ...formData, cif_price: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Impostos</label>
                    <input
                      type="text"
                      value={formData.taxes_info}
                      onChange={e => setFormData({ ...formData, taxes_info: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Valor da Proposta (Digitado manual) *</label>
                    <input
                      type="text"
                      placeholder="Ex: 50.000,00"
                      value={formData.proposal_value}
                      onChange={e => setFormData({ ...formData, proposal_value: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-[#009AC7] focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento (Digitado manual)</label>
                    <input
                      type="text"
                      placeholder="Ex: 30/60/90 dias ou À Vista via PIX"
                      value={formData.payment_terms}
                      onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Prazo de entrega (Digitado manual)</label>
                    <input
                      type="text"
                      placeholder="Ex: 15 dias úteis ou Imediato"
                      value={formData.delivery_time}
                      onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Garantia</label>
                    <input
                      type="text"
                      value={formData.warranty}
                      onChange={e => setFormData({ ...formData, warranty: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Validade da proposta</label>
                    <input
                      type="text"
                      value={formData.validity_days}
                      onChange={e => setFormData({ ...formData, validity_days: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Observações Adicionais (Espaço Livre na Tabela)</label>
                  <textarea
                    rows={3}
                    placeholder="Insira aqui o texto de observações adicionais..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dados do Vendedor (Assinatura)</label>
                  <textarea
                    rows={2}
                    value={formData.seller_info}
                    onChange={e => setFormData({ ...formData, seller_info: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3 shrink-0 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#009AC7] hover:bg-[#0088b3] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSaving ? 'Salvando...' : 'Salvar Proposta de Venda'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL DEFINE VALIDITY & SHARE LINK (Identical 1:1 to PropostasLocacao) ---------------- */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Definir Validade &amp; Compartilhar Link
              </h2>
              <button 
                type="button"
                onClick={() => setIsShareModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleConfirmShare}>
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Defina o prazo de validade/expiração do link público antes de compartilhá-lo com seu cliente.
                </p>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">PRAZO DE VALIDADE</label>
                  <select 
                    value={shareValidityDays} 
                    onChange={e => setShareValidityDays(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="5 dias">5 dias</option>
                    <option value="10 dias">10 dias</option>
                    <option value="15 dias">15 dias</option>
                    <option value="30 dias">30 dias</option>
                    <option value="60 dias">60 dias</option>
                  </select>
                </div>

                <div className="p-3 bg-cyan-50/50 border border-cyan-100 rounded-lg text-[11px] text-cyan-800 italic leading-relaxed">
                  * Ao confirmar, a validade da proposta comercial será atualizada no banco de dados e o link público será copiado automaticamente para sua área de transferência.
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex justify-end space-x-2 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSavingShare}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#009AC7] hover:bg-[#0088b3] rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {isSavingShare ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Confirmar &amp; Copiar Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
