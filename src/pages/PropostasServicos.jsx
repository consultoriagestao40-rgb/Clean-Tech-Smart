import { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Loader2, Printer, Link2, Edit, Trash2, X, Check, ShoppingBag, ShieldCheck, Clock
} from 'lucide-react';

export default function PropostasServicos() {
  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState([]);
  const [machineModels, setMachineModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Default values matching user spec exactly
  const defaultFormData = {
    id: null,
    client_id: '',
    machines_included: '02 Lavadoras de Piso Industriais — Modelo Brava',
    preventive_scope: 'Execução das rotinas de revisão técnica e conservação rigorosamente de acordo com o Manual do Fabricante da Lavadora Brava (checagem periódica de motores de tração/aspiração, sistema de rodo e borrachas, vedações, escovas, circuito de água/detergente e parte elétrica).\n\nCronograma estruturado para garantir máxima disponibilidade e vida útil dos equipamentos.',
    corrective_scope: 'Abertura e Gestão de Chamados: Todo o processo de abertura de incidentes, acompanhamento e histórico de manutenção é realizado diretamente pelo Portal do Cliente Clean Tech Pro.\n\nPlano de Manutenção Corretiva: A partir do registro no portal, a equipe técnica elabora o plano de ação e diagnóstico para a correção da falha.\n\nSLA de Atendimento: Atendimento presencial em até 24 horas úteis após a abertura do chamado no portal.',
    extra_hours_scope: 'A cobertura padrão do contrato engloba atendimentos em dias úteis, em horário comercial.\n\nAtendimentos emergenciais aos finais de semana e feriados: Geram cobrança de taxa extra de atendimento/hora técnica especial, faturada à parte.',
    service_description: 'Plano de Manutenção Preventiva (Manual Brava) + Atendimento Corretivo via Portal para 02 Lavadoras Brava',
    quantity: '02 un.',
    monthly_value: 'R$ 3.000,00',
    contract_months: '12 (doze) meses',
    payment_terms: 'Faturamento até todo dia 25 de cada mês com vencimento até o 5º dia útil do mês subsequente',
    validity_days: '15 dias',
    parts_notes: 'Peças de Reposição: Peças com desgaste natural ou danificadas serão orçadas e faturadas à parte, mediante aprovação prévia do cliente no portal.',
    notes: '',
    seller_info: 'Clean Tech Pro\nAtendimento Comercial & Serviços',
    status: 'Rascunho'
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareProposalId, setShareProposalId] = useState(null);
  const [shareValidityDays, setShareValidityDays] = useState('15 dias');
  const [isSavingShare, setIsSavingShare] = useState(false);

  useEffect(() => {
    fetchProposals();
    fetchClients();
    fetchMachineModels();
  }, []);

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-service-proposals');
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (e) {
      console.error('Erro ao buscar propostas de serviço:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/get-clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch (e) {
      console.error('Erro ao buscar clientes:', e);
    }
  };

  const fetchMachineModels = async () => {
    try {
      const res = await fetch('/api/get-machine-models');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.models || data.machines || []);
        setMachineModels(list);
      }
    } catch (e) {
      console.error('Erro ao buscar catálogo de máquinas:', e);
    }
  };

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

  const formatEquipmentsSummary = (raw) => {
    const list = parseEquipmentsList(raw);
    return list.map(item => `${item.qty ? item.qty + ' ' : ''}${item.name}`).join(' | ');
  };

  const [equipmentItems, setEquipmentItems] = useState([
    { qty: '02 un.', name: 'Lavadoras de Piso Industriais — Modelo Brava' }
  ]);

  const handleOpenCreateModal = () => {
    setFormData(defaultFormData);
    setEquipmentItems([{ qty: '02 un.', name: 'Lavadoras de Piso Industriais — Modelo Brava' }]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    const eqList = parseEquipmentsList(p.machines_included);
    setFormData({
      id: p.id,
      client_id: p.client_id || '',
      machines_included: JSON.stringify(eqList),
      preventive_scope: p.preventive_scope || defaultFormData.preventive_scope,
      corrective_scope: p.corrective_scope || defaultFormData.corrective_scope,
      extra_hours_scope: p.extra_hours_scope || defaultFormData.extra_hours_scope,
      service_description: p.service_description || defaultFormData.service_description,
      quantity: p.quantity || defaultFormData.quantity,
      monthly_value: p.monthly_value || defaultFormData.monthly_value,
      contract_months: p.contract_months || defaultFormData.contract_months,
      payment_terms: p.payment_terms || defaultFormData.payment_terms,
      validity_days: p.validity_days || defaultFormData.validity_days,
      parts_notes: p.parts_notes || defaultFormData.parts_notes,
      notes: p.notes || '',
      seller_info: p.seller_info || defaultFormData.seller_info,
      status: p.status || 'Rascunho'
    });
    setEquipmentItems(eqList);
    setIsModalOpen(true);
  };

  const handleAddEquipmentRow = () => {
    const updated = [...equipmentItems, { qty: '01 un.', name: '' }];
    setEquipmentItems(updated);
    setFormData(prev => ({ ...prev, machines_included: JSON.stringify(updated) }));
  };

  const handleRemoveEquipmentRow = (index) => {
    if (equipmentItems.length <= 1) return;
    const updated = equipmentItems.filter((_, i) => i !== index);
    setEquipmentItems(updated);
    setFormData(prev => ({ ...prev, machines_included: JSON.stringify(updated) }));
  };

  const handleUpdateEquipmentRow = (index, field, value) => {
    const updated = equipmentItems.map((item, i) => i === index ? { ...item, [field]: value } : item);
    setEquipmentItems(updated);
    setFormData(prev => ({ ...prev, machines_included: JSON.stringify(updated) }));
  };

  const handleSaveProposal = async (e) => {
    e.preventDefault();
    if (!formData.client_id) {
      alert('Por favor, selecione um cliente.');
      return;
    }

    const payload = {
      ...formData,
      machines_included: JSON.stringify(equipmentItems)
    };

    setIsSaving(true);
    try {
      const res = await fetch('/api/save-service-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchProposals();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar proposta de serviço.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão ao salvar proposta.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProposal = async (id) => {
    if (!confirm('Deseja realmente excluir esta Proposta de Serviço?')) return;
    try {
      const res = await fetch('/api/delete-service-proposal', {
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
  };

  const handleExportServiceProposalPDF = (p) => {
    const companyLogo = localStorage.getItem('app_company_logo') || '';
    const companyName = localStorage.getItem('app_company_name') || 'CLEAN TECH PRO';
    const companyCnpj = localStorage.getItem('app_company_cnpj') || '43.158.052/0001-01';
    const companyAddress = localStorage.getItem('app_company_address') || 'Avenida Maringá, 1273 – Emiliano Perneta Pinhais/PR, CEP 83325-212';
    const companyPhone = localStorage.getItem('app_company_phone') || '41 9 8508-3658';
    const companyEmail = localStorage.getItem('app_company_email') || 'vendas@cleantechpro.com.br';
    const primaryColor = localStorage.getItem('app_pdf_color') || '#009AC7';
    const emissao = new Date(p.created_at || new Date()).toLocaleDateString('pt-BR');
    const eqList = parseEquipmentsList(p.machines_included);

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
    <div class="info-row"><span><b>Condição de Faturamento:</b></span><span>${p.payment_terms || 'Faturamento até todo dia 25 de cada mês com vencimento até o 5º dia útil do mês subsequente'}</span></div>
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

  const handleShareProposalLink = (p) => {
    setShareProposalId(p.id);
    setShareValidityDays(p.validity_days || '15 dias');
    setIsShareModalOpen(true);
  };

  const handleConfirmShare = async (e) => {
    e.preventDefault();
    if (!shareProposalId) return;
    setIsSavingShare(true);
    try {
      await fetch('/api/update-proposal-validity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shareProposalId, validity_days: shareValidityDays, type: 'service' })
      });
      const publicUrl = `${window.location.origin}/visualizar-proposta-servico/${shareProposalId}`;
      navigator.clipboard.writeText(publicUrl);
      alert(`Link público da Proposta de Serviço nº #${String(shareProposalId).padStart(4, '0')} copiado para a área de transferência!\n\nValidade atualizada para ${shareValidityDays}.\n\n${publicUrl}`);
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
      (p.machines_included && p.machines_included.toLowerCase().includes(term)) ||
      (p.monthly_value && p.monthly_value.toLowerCase().includes(term))
    );
  });

  return (
    <div className="font-sans text-gray-800 space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-[#009AC7]" />
            <span>Propostas de Serviços Recorrentes</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Elabore propostas comerciais mensais de manutenção preventiva, corretiva e gestão de frota.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center px-4 py-2.5 bg-[#009AC7] hover:bg-[#0088b3] text-white font-bold rounded-lg transition-colors shadow-sm shrink-0 whitespace-nowrap text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Nova Proposta de Serviço</span>
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

      {/* Proposals Table */}
      {isLoading ? (
        <div className="py-16 text-center text-gray-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#009AC7]" />
          <p className="text-sm font-medium">Carregando propostas de serviço...</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3 shadow-xs">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-700">Nenhuma Proposta de Serviço cadastrada</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Clique no botão acima para elaborar sua primeira proposta recorrente mensal de manutenção.
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
                  <th className="px-5 py-3.5">Equipamentos Cobertos</th>
                  <th className="px-5 py-3.5">Valor Mensal</th>
                  <th className="px-5 py-3.5">Vigência</th>
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
                    <td className="px-5 py-4 min-w-[200px]">
                      <span className="font-semibold text-gray-800 block truncate">{formatEquipmentsSummary(p.machines_included)}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-[#009AC7] whitespace-nowrap">
                      {p.monthly_value || 'R$ 3.000,00'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-600 whitespace-nowrap">
                      {p.contract_months || '12 meses'}
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
                        onClick={() => handleExportServiceProposalPDF(p)}
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

      {/* Modal Form Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl border border-gray-200 flex flex-col overflow-hidden text-left">
            <div className="bg-[#0B141B] px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-[#009AC7]" />
                <h3 className="font-bold text-sm text-white">
                  {formData.id ? `Editar Proposta de Serviço nº #${String(formData.id).padStart(4,'0')}` : 'Nova Proposta de Serviços Recorrentes'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProposal} className="p-6 space-y-6 overflow-y-auto text-xs">
              {/* Cliente */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cliente *</label>
                <select
                  required
                  value={formData.client_id}
                  onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none bg-white text-slate-800"
                >
                  <option value="">Selecione o Cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.razao_social ? `(${c.razao_social})` : ''} - {c.document || ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 1. Equipamentos Cobertos */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-[#009AC7] text-xs uppercase tracking-wider">
                    1. EQUIPAMENTOS COBERTOS (CADA TIPO EM UMA LINHA) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEquipmentRow}
                    className="px-2.5 py-1 bg-[#009AC7] hover:bg-[#0088b3] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Equipamento</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-1">
                    <div className="col-span-3">Qtd</div>
                    <div className="col-span-8">Descrição / Equipamento / Modelo</div>
                    <div className="col-span-1 text-center">Ação</div>
                  </div>

                  {equipmentItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <input
                          type="text"
                          required
                          value={item.qty}
                          onChange={e => handleUpdateEquipmentRow(idx, 'qty', e.target.value)}
                          placeholder="Ex: 02 un."
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009AC7] focus:outline-none bg-white text-xs font-bold text-[#009AC7]"
                        />
                      </div>
                      <div className="col-span-8 space-y-1">
                        {machineModels.length > 0 && (
                          <select
                            onChange={e => {
                              if (e.target.value) {
                                handleUpdateEquipmentRow(idx, 'name', e.target.value);
                              }
                            }}
                            className="w-full px-2.5 py-1 text-[11px] font-medium border border-slate-200 rounded-md bg-slate-100/80 text-slate-600 focus:ring-1 focus:ring-[#009AC7] focus:outline-none"
                          >
                            <option value="">-- Selecionar do Catálogo de Máquinas --</option>
                            {machineModels.map(m => {
                              const modelLabel = m.name || m.model_name || m.model || '';
                              const brandLabel = m.brand ? ` (${m.brand})` : '';
                              return (
                                <option key={m.id} value={`${modelLabel}${brandLabel}`}>
                                  {modelLabel}{brandLabel}
                                </option>
                              );
                            })}
                          </select>
                        )}
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={e => handleUpdateEquipmentRow(idx, 'name', e.target.value)}
                          placeholder="Ex: Lavadoras de Piso Industriais — Modelo Brava"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009AC7] focus:outline-none bg-white text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          disabled={equipmentItems.length <= 1}
                          onClick={() => handleRemoveEquipmentRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 transition-colors"
                          title="Remover linha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Escopos dos Serviços */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 text-xs block uppercase tracking-wider text-[#009AC7]">
                  2. ESCOPO DOS SERVIÇOS
                </span>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">2.1. Manutenção Preventiva</label>
                  <textarea
                    rows={3}
                    value={formData.preventive_scope}
                    onChange={e => setFormData({ ...formData, preventive_scope: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">2.2. Manutenção Corretiva & Gestão via Portal do Cliente (SLA)</label>
                  <textarea
                    rows={4}
                    value={formData.corrective_scope}
                    onChange={e => setFormData({ ...formData, corrective_scope: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">2.3. Atendimentos em Finais de Semana e Feriados</label>
                  <textarea
                    rows={3}
                    value={formData.extra_hours_scope}
                    onChange={e => setFormData({ ...formData, extra_hours_scope: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. Condições Comerciais */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 text-xs block uppercase tracking-wider text-[#009AC7]">
                  3. CONDIÇÕES COMERCIAIS
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Descrição do Serviço (Tabela)</label>
                    <input
                      type="text"
                      value={formData.service_description}
                      onChange={e => setFormData({ ...formData, service_description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quantidade</label>
                    <input
                      type="text"
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Valor Mensal (R$)</label>
                    <input
                      type="text"
                      value={formData.monthly_value}
                      onChange={e => setFormData({ ...formData, monthly_value: e.target.value })}
                      placeholder="Ex: R$ 3.000,00"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vigência do Contrato</label>
                    <input
                      type="text"
                      value={formData.contract_months}
                      onChange={e => setFormData({ ...formData, contract_months: e.target.value })}
                      placeholder="Ex: 12 (doze) meses"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Validade da Proposta</label>
                    <input
                      type="text"
                      value={formData.validity_days}
                      onChange={e => setFormData({ ...formData, validity_days: e.target.value })}
                      placeholder="Ex: 15 dias"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Condição de Faturamento / Pagamento</label>
                    <textarea
                      rows={2}
                      value={formData.payment_terms}
                      onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                      placeholder="Ex: Faturamento até todo dia 25 de cada mês com vencimento até o 5º dia útil do mês subsequente"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Regra para Peças de Reposição</label>
                    <input
                      type="text"
                      value={formData.parts_notes}
                      onChange={e => setFormData({ ...formData, parts_notes: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Vendedor & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dados do Vendedor / Atendimento</label>
                  <textarea
                    rows={2}
                    value={formData.seller_info}
                    onChange={e => setFormData({ ...formData, seller_info: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status da Proposta</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#009AC7] focus:outline-none bg-white"
                  >
                    <option value="Rascunho">Rascunho</option>
                    <option value="Enviada">Enviada</option>
                    <option value="Negociação">Negociação</option>
                    <option value="Aprovada">Aprovada</option>
                    <option value="Fechada">Fechada</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#009AC7] hover:bg-[#0088b3] text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSaving ? 'Salvando...' : 'Salvar Proposta de Serviço'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL DEFINE VALIDITY & SHARE LINK (Identical 1:1 to PropostasLocacao / PropostasVenda) ---------------- */}
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
