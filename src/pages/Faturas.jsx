import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, DollarSign, Loader2, Plus, Edit, ExternalLink, RefreshCw, Eye, Trash2, X, Receipt, Check, FileDown, Wrench, Package, Building2, User, Printer } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function Faturas() {
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [periodoFilter, setPeriodoFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Conta Azul State
  const [contaAzulConnected, setContaAzulConnected] = useState(false);
  const [isConnectingContaAzul, setIsConnectingContaAzul] = useState(false);

  // Modal Detalhes da Fatura & Conta Azul
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailedInvoice, setDetailedInvoice] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSyncingContaAzul, setIsSyncingContaAzul] = useState(false);

  // Modal para fins de teste/inserção rápida
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({ client_id: '', description: '', amount: '', due_date: '', status: 'Pendente' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    checkContaAzul();

    // Checar retorno de autorização do Conta Azul
    const caStatus = searchParams.get('conta_azul');
    if (caStatus === 'sucesso') {
      alert('🎉 Conta Azul conectado com sucesso!');
    } else if (caStatus === 'erro') {
      const msg = searchParams.get('msg') || 'Erro desconhecido';
      alert('⚠️ Erro ao conectar com o Conta Azul: ' + msg);
    }
  }, []);

  async function checkContaAzul() {
    try {
      const res = await fetch('/api/conta-azul/status');
      const data = await res.json();
      setContaAzulConnected(!!data.connected);
    } catch (e) {
      console.warn('Erro ao checar status do Conta Azul:', e);
    }
  }

  async function handleConnectContaAzul() {
    setIsConnectingContaAzul(true);
    try {
      const res = await fetch('/api/conta-azul/auth-url');
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert('Erro ao obter link de conexão com Conta Azul');
      }
    } catch (e) {
      alert('Erro de conexão ao iniciar login no Conta Azul');
    } finally {
      setIsConnectingContaAzul(false);
    }
  }

  async function fetchInvoices() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-invoices');
      const data = await res.json();
      if (data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchClients() {
    try {
      const res = await fetch('/api/get-clients');
      const data = await res.json();
      if (data.clients) setClients(data.clients);
    } catch (error) {}
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter !== 'Todos' && inv.status !== statusFilter) return false;
    // Lógica simples de período omitida para o MVP
    return true;
  });

  const summary = {
    total: filteredInvoices.length,
    pendentes: filteredInvoices.filter(i => i.status === 'Pendente').length,
    pagas: filteredInvoices.filter(i => i.status === 'Paga').length,
    vencidas: filteredInvoices.filter(i => i.status === 'Vencida').length,
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        client_id: parseInt(formData.client_id),
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        status: formData.status
      };
      const res = await fetch('/api/save-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchInvoices();
      }
    } catch (error) {
      alert('Erro ao salvar fatura');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsPaid = async (inv) => {
    if (!confirm('Marcar esta fatura como Paga?')) return;
    try {
      const payload = { ...inv, status: 'Paga', payment_date: new Date().toISOString().split('T')[0] };
      const res = await fetch('/api/save-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) fetchInvoices();
    } catch (error) {
      alert('Erro ao atualizar status da fatura');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) return;
    try {
      const res = await fetch('/api/delete-invoice', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchInvoices();
      } else {
        alert('Erro ao excluir fatura');
      }
    } catch (error) {
      alert('Erro de conexão ao excluir fatura');
    }
  };

  const handleViewInvoiceDetails = async (inv) => {
    setSelectedInvoice(inv);
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    setDetailedInvoice(null);

    try {
      const res = await fetch(`/api/get-invoice-details?id=${inv.id}`);
      const data = await res.json();
      if (data.success) {
        setDetailedInvoice(data);
        if (data.invoice?.status !== inv.status) {
          fetchInvoices();
        }
      }
    } catch (e) {
      console.error('Erro ao buscar detalhes da fatura:', e);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSyncContaAzulDetails = async (invoiceId) => {
    setIsSyncingContaAzul(true);
    try {
      const res = await fetch(`/api/get-invoice-details?id=${invoiceId}`);
      const data = await res.json();
      if (data.success) {
        setDetailedInvoice(data);
        fetchInvoices();
        alert('Dados sincronizados com o Conta Azul com sucesso!');
      } else {
        alert('Erro ao sincronizar com Conta Azul: ' + (data.error || 'Erro'));
      }
    } catch (e) {
      alert('Erro de conexão ao sincronizar com Conta Azul');
    } finally {
      setIsSyncingContaAzul(false);
    }
  };

  const handleExportPDF = (data) => {
    const inv = data?.invoice || selectedInvoice;
    const client = data?.client || {};
    const equipment = data?.equipment || {};
    const budget = data?.budget || {};
    const contaAzul = data?.contaAzulInfo || {};
    const parts = data?.parsedNcmInfo?.length > 0 ? data.parsedNcmInfo : (data?.partsItems || []);

    const companyName = 'CLEAN TECH PRO';
    const companySub = 'LOCAÇÃO, VENDA E MANUTENÇÃO DE EQUIPAMENTOS';
    const companyLogo = localStorage.getItem('app_company_logo') || '';
    const companyColor = localStorage.getItem('app_primary_color') || '#0284c7';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita popups para gerar o PDF da fatura.');
      return;
    }

    let itemsHtml = '';
    if (inv.invoice_type === 'servicos') {
      itemsHtml = `
        <table class="items-table">
          <thead>
            <tr>
              <th>Descrição do Serviço</th>
              <th style="width: 80px; text-align: center;">Qtd</th>
              <th style="width: 140px; text-align: right;">Valor Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${inv.description}</strong>
                ${equipment.name ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">Ativo: ${equipment.name} ${equipment.serialNumber ? `(Série: ${equipment.serialNumber})` : ''}</div>` : ''}
              </td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right; font-weight: bold;">${formatCurrency(inv.amount)}</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (parts.length > 0) {
      itemsHtml = `
        <table class="items-table">
          <thead>
            <tr>
              <th>Item / Peça de Reposição</th>
              <th style="width: 100px;">NCM</th>
              <th style="width: 70px;">CFOP</th>
              <th style="width: 50px; text-align: center;">Qtd</th>
              <th style="width: 110px; text-align: right;">Unitário</th>
              <th style="width: 110px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${parts.map(p => `
              <tr>
                <td><strong>${p.partName || p.part_name}</strong></td>
                <td>${p.ncm || '-'}</td>
                <td>${p.cfop || '5102'}</td>
                <td style="text-align: center;">${p.quantity}</td>
                <td style="text-align: right;">${formatCurrency(p.unitPrice || p.unit_price)}</td>
                <td style="text-align: right; font-weight: bold;">${formatCurrency(p.total || (Number(p.quantity) * Number(p.unitPrice || p.unit_price)))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      itemsHtml = `
        <table class="items-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th style="width: 140px; text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${inv.description}</strong></td>
              <td style="text-align: right; font-weight: bold;">${formatCurrency(inv.amount)}</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Fatura #${inv.id} - ${companyName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; font-size: 13px; line-height: 1.5; padding: 30px; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${companyColor}; padding-bottom: 20px; margin-bottom: 25px; }
    .company-title { font-size: 20px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
    .company-sub { font-size: 10px; font-weight: 600; color: #64748b; letter-spacing: 0.5px; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; border-radius: 20px; text-transform: uppercase; }
    .badge-paid { background: #dcfce7; color: #166534; }
    .badge-pending { background: #fef9c3; color: #854d0e; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; font-size: 12px; }
    .box-title { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
    .items-table th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
    .items-table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    .total-box { display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin-bottom: 25px; }
    .total-title { font-size: 13px; font-weight: 800; color: #166534; text-transform: uppercase; }
    .total-val { font-size: 24px; font-weight: 900; color: #166534; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px; }
    @media print {
      body { background: #fff; padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 15px; display: flex; justify-content: flex-end; gap: 10px;">
    <button onclick="window.print()" style="padding: 8px 16px; background: ${companyColor}; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px;">
      Imprimir / Salvar PDF
    </button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="company-title">${companyName}</div>
        <div class="company-sub">${companySub}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Fatura de Cobrança nº #${inv.id}</div>
      </div>
      <div style="text-align: right;">
        <span class="badge ${inv.status === 'Paga' ? 'badge-paid' : 'badge-pending'}">${inv.status}</span>
        <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Vencimento: <strong>${formatDate(inv.due_date)}</strong></div>
        ${inv.payment_date ? `<div style="font-size: 11px; color: #166534;">Pago em: ${formatDate(inv.payment_date)}</div>` : ''}
      </div>
    </div>

    <div class="grid">
      <div class="box">
        <div class="box-title">Dados do Cliente</div>
        <p><strong>${client.name || inv.client_name}</strong></p>
        <p>Documento: ${client.document || 'Não informado'}</p>
        <p>Telefone: ${client.phone || '-'}</p>
        <p>Email: ${client.email || '-'}</p>
      </div>
      <div class="box">
        <div class="box-title">Dados da Operação / Ativo</div>
        ${budget.id ? `<p>Orçamento Vinculado: <strong>#${budget.id}</strong> (${budget.service_type || 'Manutenção'})</p>` : ''}
        ${equipment.name ? `<p>Equipamento: <strong>${equipment.name}</strong></p>` : ''}
        ${equipment.serialNumber ? `<p>Nº de Série: ${equipment.serialNumber}</p>` : ''}
        ${contaAzul.saleNumber ? `<p style="color: #0284c7; font-weight: 600;">Conta Azul: Venda #${contaAzul.saleNumber} ${contaAzul.nfNumber ? `| NF: #${contaAzul.nfNumber}` : ''}</p>` : ''}
      </div>
    </div>

    <div>
      <div style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px;">Detalhamento da Fatura</div>
      ${itemsHtml}
    </div>

    <div class="total-box">
      <div>
        <div class="total-title">Valor Total da Fatura</div>
        <div style="font-size: 11px; color: #15803d;">Referente aos itens e serviços discriminados acima</div>
      </div>
      <div class="total-val">${formatCurrency(inv.amount)}</div>
    </div>

    <div class="box" style="margin-bottom: 25px;">
      <div class="box-title">Instruções para Pagamento</div>
      <p>Favorecido: <strong>CLEAN TECH PRO EQUIPAMENTOS LTDA</strong></p>
      <p>Chave PIX: <strong>financeiro@grupojvsserv.com.br</strong> (ou conforme boleto bancário)</p>
      <p style="font-size: 11px; color: #64748b; margin-top: 4px;">Em caso de dúvidas fiscais ou emissão de segunda via, entre em contato com nosso departamento financeiro.</p>
    </div>

    <div class="footer">
      ${companyName} &bull; Sistema de Gestão Financeira &bull; Documento emitido em ${new Date().toLocaleString('pt-BR')}
    </div>
  </div>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="font-sans text-gray-800 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faturas</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          {/* Status Conta Azul */}
          {contaAzulConnected ? (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Conta Azul Conectado</span>
              <button 
                onClick={handleConnectContaAzul}
                disabled={isConnectingContaAzul}
                title="Reconectar ou trocar conta do Conta Azul"
                className="ml-1 text-emerald-600 hover:text-emerald-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleConnectContaAzul}
              disabled={isConnectingContaAzul}
              className="flex items-center px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              {isConnectingContaAzul ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-1.5" />
              )}
              Conectar Conta Azul
            </button>
          )}

          <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-xs">
            <Plus className="w-4 h-4 mr-2" />
            Nova Fatura Manual
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filtros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Período</label>
            <select 
              value={periodoFilter} onChange={e => setPeriodoFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos</option>
              <option value="Este Mês">Este Mês</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
            <select 
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Paga">Paga</option>
              <option value="Vencida">Vencida</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cartões de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500">Total de Faturas</span>
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{summary.total}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500">Pendentes</span>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{summary.pendentes}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500">Pagas</span>
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{summary.pagas}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500">Vencidas</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-2xl font-bold text-red-500">{summary.vencidas}</span>
        </div>
      </div>

      {/* Tabela de Faturas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Todas as Faturas</h2>
        </div>
        
        <div className="overflow-x-auto p-6 pt-0 mt-4">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center p-12 text-gray-400">
              Nenhuma fatura encontrada com os filtros aplicados
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Cliente</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Descrição</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Valor</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Vencimento</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4 font-medium text-gray-800">{inv.client_name}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-gray-800">{inv.description}</span>
                        {inv.contract_code && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
                            {inv.contract_code}
                          </span>
                        )}
                        {inv.budget_id && (
                          <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                            Orç. #{inv.budget_id}
                          </span>
                        )}
                        {inv.conta_azul_sale_id && (
                          <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Conta Azul
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right font-bold text-gray-900">{formatCurrency(inv.amount)}</td>
                    <td className="py-4">{formatDate(inv.due_date)}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        inv.status === 'Paga' ? 'bg-green-100 text-green-700' :
                        inv.status === 'Vencida' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleViewInvoiceDetails(inv)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Visualizar Detalhes da Fatura"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.status !== 'Paga' && (
                          <button
                            onClick={() => handleMarkAsPaid(inv)}
                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Marcar como Paga"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Excluir Fatura"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Detalhes da Fatura & Conta Azul */}
      {isDetailModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-gray-900">Fatura #{selectedInvoice.id}</h2>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      selectedInvoice.status === 'Paga' ? 'bg-green-100 text-green-800' :
                      selectedInvoice.status === 'Vencida' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedInvoice.created_at ? `Emitida em ${new Date(selectedInvoice.created_at).toLocaleDateString('pt-BR')}` : ''}
                    {selectedInvoice.due_date ? ` &bull; Vencimento: ${formatDate(selectedInvoice.due_date)}` : ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/60 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {isDetailLoading ? (
              <div className="p-12 text-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-sm">Consultando dados completos e sincronizando com o Conta Azul...</p>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto max-h-[calc(100vh-220px)] space-y-5">
                
                {/* 1. Card Conta Azul & Dados Fiscais */}
                <div className="bg-gradient-to-br from-cyan-50/70 to-blue-50/70 border border-cyan-200/80 rounded-xl p-4">
                  <div className="flex items-center justify-between border-b border-cyan-100 pb-2.5 mb-3">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-cyan-700" />
                      <span className="text-xs font-bold text-cyan-900 uppercase tracking-wider">Integração Conta Azul & Fiscal</span>
                    </div>
                    {selectedInvoice.conta_azul_sale_id && (
                      <button
                        type="button"
                        onClick={() => handleSyncContaAzulDetails(selectedInvoice.id)}
                        disabled={isSyncingContaAzul}
                        className="flex items-center text-xs text-cyan-700 hover:text-cyan-900 bg-white/80 px-2 py-1 rounded-md border border-cyan-200 transition-colors font-medium"
                        title="Atualizar status direto da API do Conta Azul"
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${isSyncingContaAzul ? 'animate-spin' : ''}`} />
                        Atualizar do Conta Azul
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 block mb-0.5">Venda no Conta Azul</span>
                      {detailedInvoice?.contaAzulInfo?.saleNumber || selectedInvoice.conta_azul_sale_id ? (
                        <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-cyan-200 font-mono">
                          #{detailedInvoice?.contaAzulInfo?.saleNumber || selectedInvoice.conta_azul_sale_id}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Não transmitida ao Conta Azul</span>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-500 block mb-0.5">Status da Nota Fiscal (NF)</span>
                      {detailedInvoice?.contaAzulInfo ? (
                        <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded-full ${
                          detailedInvoice.contaAzulInfo.nfStatus.includes('Emitida') ? 'bg-green-100 text-green-800' :
                          detailedInvoice.contaAzulInfo.nfStatus.includes('Solicitada') ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {detailedInvoice.contaAzulInfo.nfStatus.includes('Emitida') && <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />}
                          {detailedInvoice.contaAzulInfo.nfStatus}
                        </span>
                      ) : (
                        <span className="text-gray-400">Pendente de emissão</span>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-500 block mb-0.5">Número da NF</span>
                      {detailedInvoice?.contaAzulInfo?.nfNumber ? (
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 font-mono">
                            NF #{detailedInvoice.contaAzulInfo.nfNumber}
                          </span>
                          {detailedInvoice.contaAzulInfo.nfUrl && (
                            <a 
                              href={detailedInvoice.contaAzulInfo.nfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:text-blue-800 p-0.5" 
                              title="Baixar PDF da NF"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Aguardando emissão no CA</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Dados do Cliente e Equipamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                  <div>
                    <span className="font-bold text-gray-500 uppercase tracking-wider block mb-1">Cliente / Tomador</span>
                    <p className="font-bold text-gray-900 text-sm">{detailedInvoice?.client?.name || selectedInvoice.client_name}</p>
                    <p className="text-gray-600 mt-0.5">Doc: {detailedInvoice?.client?.document || 'Não informado'}</p>
                    {detailedInvoice?.client?.phone && <p className="text-gray-500">Tel: {detailedInvoice.client.phone}</p>}
                    {detailedInvoice?.client?.email && <p className="text-gray-500 truncate">Email: {detailedInvoice.client.email}</p>}
                  </div>

                  <div>
                    <span className="font-bold text-gray-500 uppercase tracking-wider block mb-1">Origem & Equipamento</span>
                    {detailedInvoice?.budget?.id ? (
                      <>
                        <p className="font-bold text-blue-700">Orçamento #{detailedInvoice.budget.id} ({detailedInvoice.budget.service_type || 'Manutenção'})</p>
                        <p className="text-gray-800 font-medium mt-0.5">
                          {detailedInvoice.equipment?.name || 'Equipamento não especificado'}
                        </p>
                        <p className="text-gray-500">Série: {detailedInvoice.equipment?.serialNumber || 'S/N'}</p>
                      </>
                    ) : (
                      <p className="text-gray-500 italic">Fatura avulsa / Contrato de locação</p>
                    )}
                  </div>
                </div>

                {/* 3. Detalhamento do que foi Vendido / Faturado */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-100/70 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center">
                      <Package className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                      Itens Faturados
                    </span>
                    <span className="text-xs text-gray-500">
                      {selectedInvoice.invoice_type === 'servicos' ? 'Prestação de Serviços' : selectedInvoice.invoice_type === 'pecas' ? 'Venda de Peças / Mercadorias' : 'Geral'}
                    </span>
                  </div>

                  <div className="p-4">
                    {/* Se tiver itens de peças detalhados */}
                    {detailedInvoice?.parsedNcmInfo && detailedInvoice.parsedNcmInfo.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 text-gray-500">
                              <th className="pb-2 font-semibold">Peça / Produto</th>
                              <th className="pb-2 font-semibold">NCM</th>
                              <th className="pb-2 font-semibold">CFOP</th>
                              <th className="pb-2 font-semibold w-12 text-center">Qtd</th>
                              <th className="pb-2 font-semibold text-right">Unitário</th>
                              <th className="pb-2 font-semibold text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {detailedInvoice.parsedNcmInfo.map((p, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="py-2 font-medium text-gray-800">{p.partName}</td>
                                <td className="py-2 text-gray-600 font-mono">{p.ncm || '-'}</td>
                                <td className="py-2 text-gray-600 font-mono">{p.cfop || '5102'}</td>
                                <td className="py-2 text-center">{p.quantity}</td>
                                <td className="py-2 text-right">{formatCurrency(p.unitPrice)}</td>
                                <td className="py-2 text-right font-bold text-gray-900">{formatCurrency(p.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Caso seja serviço ou fatura simples */
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
                        <p className="font-semibold text-gray-900">{selectedInvoice.description}</p>
                        {selectedInvoice.contract_code && (
                          <span className="text-gray-500 text-2xs mt-1 block">Contrato: {selectedInvoice.contract_code}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Valor Total e Vencimento */}
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Valor Total</span>
                    <p className="text-xs text-emerald-700">
                      Vencimento: <strong>{formatDate(selectedInvoice.due_date)}</strong>
                      {selectedInvoice.payment_date && ` &bull; Pago em: ${formatDate(selectedInvoice.payment_date)}`}
                    </p>
                  </div>
                  <div className="text-2xl font-black text-emerald-900">
                    {formatCurrency(selectedInvoice.amount)}
                  </div>
                </div>

              </div>
            )}

            {/* Footer Ações */}
            <div className="flex flex-wrap items-center justify-between p-6 border-t border-gray-100 bg-gray-50 gap-2">
              <div>
                <button
                  type="button"
                  onClick={() => handleExportPDF(detailedInvoice)}
                  disabled={isDetailLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                >
                  <FileDown className="w-4 h-4 mr-1.5" />
                  Exportar PDF
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {selectedInvoice.status !== 'Paga' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleMarkAsPaid(selectedInvoice);
                    }}
                    className="flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Marcar como Paga
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-medium rounded-lg text-xs transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fatura Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Nova Fatura Manual</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Cliente</label>
                <select required value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Descrição</label>
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: Mensalidade" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Valor (R$)</label>
                  <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Vencimento</label>
                  <input required type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-blue-600 rounded-lg">Salvar Fatura</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
