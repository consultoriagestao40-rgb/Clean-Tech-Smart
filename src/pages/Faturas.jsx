import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, DollarSign, Loader2, Plus, Edit, ExternalLink, RefreshCw, Eye, Trash2, X, Receipt, Check, FileDown, Wrench, Package, Building2, User, Printer, Link2, Send, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function Faturas() {
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [periodoFilter, setPeriodoFilter] = useState('Todos');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [clientFilter, setClientFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Conta Azul State
  const [contaAzulConnected, setContaAzulConnected] = useState(false);
  const [isConnectingContaAzul, setIsConnectingContaAzul] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Modal Detalhes da Fatura & Conta Azul
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailedInvoice, setDetailedInvoice] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSyncingContaAzul, setIsSyncingContaAzul] = useState(false);

  // Modal Vinculação de Venda Manual / Existente do Conta Azul
  const [isLinkSaleModalOpen, setIsLinkSaleModalOpen] = useState(false);
  const [linkSaleInput, setLinkSaleInput] = useState('');
  const [isLinkingSale, setIsLinkingSale] = useState(false);
  const [suggestedSales, setSuggestedSales] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isTransmittingToCA, setIsTransmittingToCA] = useState(false);

  // Modal para fins de teste/inserção rápida
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({ client_id: '', description: '', amount: '', due_date: '', status: 'Pendente' });
  const [isSaving, setIsSaving] = useState(false);

  // Modal Faturamento de Locação & Conta Azul
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [rentalProposals, setRentalProposals] = useState([]);
  const [isLoadingRentalProposals, setIsLoadingRentalProposals] = useState(false);
  const [selectedRentalProposalId, setSelectedRentalProposalId] = useState('');
  const [rentalInvoiceForm, setRentalInvoiceForm] = useState({
    dueDate: '',
    amount: '',
    description: '',
    sendToContaAzul: true
  });
  const [isSubmittingRentalInvoice, setIsSubmittingRentalInvoice] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    checkContaAzul();

    // Checar se veio com comando de faturar locação específica
    const faturarLocacaoId = searchParams.get('faturar_locacao');
    if (faturarLocacaoId) {
      handleOpenRentalModal(faturarLocacaoId);
    }

    // Checar retorno de autorização do Conta Azul
    const caStatus = searchParams.get('conta_azul');
    if (caStatus === 'sucesso') {
      alert('🎉 Conta Azul conectado com sucesso! Sincronizando faturas...');
      syncPendingInvoicesSilently();
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
      // Se conectado, sincroniza baixas pendentes em segundo plano
      if (data.connected) {
        syncPendingInvoicesSilently();
      }
    } catch (e) {
      console.warn('Erro ao checar status do Conta Azul:', e);
    }
  }

  async function syncPendingInvoicesSilently() {
    try {
      const res = await fetch('/api/conta-azul/sync-invoices', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.updatedCount > 0) {
        fetchInvoices();
      }
    } catch (e) {
      console.warn('Sincronização em segundo plano:', e);
    }
  }

  async function handleSyncAllInvoicesFromContaAzul() {
    setIsSyncingAll(true);
    try {
      const res = await fetch('/api/conta-azul/sync-invoices', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchInvoices();
        if (data.paidCount > 0 || data.faturadaCount > 0 || data.dueDateUpdatedCount > 0) {
          alert(`🎉 Sincronização concluída com sucesso!\n` +
            (data.paidCount > 0 ? `• ${data.paidCount} fatura(s) baixada(s)/conciliada(s) como PAGA(s)\n` : '') +
            (data.faturadaCount > 0 ? `• ${data.faturadaCount} fatura(s) atualizada(s) para FATURADA\n` : '') +
            (data.dueDateUpdatedCount > 0 ? `• ${data.dueDateUpdatedCount} data(s) de vencimento sincronizada(s) do Conta Azul` : '')
          );
        } else {
          alert('Tudo atualizado! Nenhuma nova alteração no Conta Azul no momento.');
        }
      } else {
        alert('Erro ao sincronizar com Conta Azul: ' + (data.error || 'Erro'));
      }
    } catch (e) {
      alert('Erro de conexão ao sincronizar faturas do Conta Azul');
    } finally {
      setIsSyncingAll(false);
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

  const formatRentalPeriod = (months) => {
    const m = Number(months);
    if (m === 1) return 'Diária (1 dia)';
    if (m === 7) return 'Semanal (7 dias)';
    if (m === 15) return 'Quinzenal (15 dias)';
    if (m === 30) return 'Mensal Avulso (01 mês)';
    if (m === 12) return '12 Meses';
    return `${m} Meses`;
  };

  const isRentalAvulsa = (months) => {
    const m = Number(months);
    return m === 1 || m === 7 || m === 15 || m === 30;
  };

  const handleOpenRentalModal = async (preselectedProposalId = null) => {
    setIsRentalModalOpen(true);
    setIsLoadingRentalProposals(true);
    try {
      const res = await fetch('/api/get-rental-proposals');
      const data = await res.json();
      if (data.proposals) {
        // Filtrar apenas propostas aprovadas / fechadas / contrato
        const approved = data.proposals.filter(p => 
          ['Fechada', 'Aprovada', 'Contrato'].includes(p.status)
        );
        setRentalProposals(approved);

        if (preselectedProposalId) {
          const prop = approved.find(p => String(p.id) === String(preselectedProposalId));
          if (prop) selectProposalToInvoice(prop);
        } else if (approved.length > 0) {
          selectProposalToInvoice(approved[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar propostas de locação:', err);
    } finally {
      setIsLoadingRentalProposals(false);
    }
  };

  const selectProposalToInvoice = (prop) => {
    setSelectedRentalProposalId(String(prop.id));
    const periodStr = formatRentalPeriod(prop.period_months);
    const machineName = prop.equipment_name 
      ? `${prop.machine_name || 'Máquina'} (Ativo: ${prop.equipment_name}${prop.equipment_serial ? ' - S/N: ' + prop.equipment_serial : ''})` 
      : (prop.machine_name || 'Equipamento de Locação');
    
    // Vencimento padrão: hoje + 7 dias
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 7);
    const dueStr = defaultDue.toISOString().split('T')[0];

    setRentalInvoiceForm({
      dueDate: dueStr,
      amount: String(prop.monthly_value || ''),
      description: `Locação: ${machineName} - Período: ${periodStr} (Ref. Proposta #${prop.id})`,
      sendToContaAzul: contaAzulConnected
    });
  };

  const handleProposalChange = (e) => {
    const id = e.target.value;
    setSelectedRentalProposalId(id);
    const prop = rentalProposals.find(p => String(p.id) === String(id));
    if (prop) selectProposalToInvoice(prop);
  };

  const handleSubmitRentalInvoice = async (e) => {
    e.preventDefault();
    if (!selectedRentalProposalId) {
      alert('Selecione uma proposta de locação.');
      return;
    }
    if (!rentalInvoiceForm.dueDate) {
      alert('Informe a data de vencimento da fatura.');
      return;
    }
    if (!rentalInvoiceForm.amount || Number(rentalInvoiceForm.amount) <= 0) {
      alert('Informe um valor válido para a fatura.');
      return;
    }

    setIsSubmittingRentalInvoice(true);
    try {
      const payload = {
        proposalId: Number(selectedRentalProposalId),
        dueDate: rentalInvoiceForm.dueDate,
        amount: Number(rentalInvoiceForm.amount),
        description: rentalInvoiceForm.description,
        sendToContaAzul: rentalInvoiceForm.sendToContaAzul
      };

      const res = await fetch('/api/generate-invoice-from-rental-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        let msg = '✅ Fatura de locação gerada com sucesso!';
        if (data.contaAzulSaleId) {
          msg += `\n\n🎉 Venda de locação criada no Conta Azul (ID: ${data.contaAzulSaleId})!`;
        } else if (rentalInvoiceForm.sendToContaAzul && data.contaAzulError) {
          msg += `\n\n⚠️ Aviso Conta Azul: ${data.contaAzulError}`;
        }
        alert(msg);
        setIsRentalModalOpen(false);
        fetchInvoices();
      } else {
        alert('Erro ao gerar fatura: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao faturar proposta de locação.');
    } finally {
      setIsSubmittingRentalInvoice(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const filteredInvoices = invoices.filter(inv => {
    // 1. Filtro de Status
    if (statusFilter !== 'Todos' && inv.status !== statusFilter) return false;

    // 2. Filtro de Cliente
    if (clientFilter !== 'Todos') {
      const matchClientId = String(inv.client_id) === String(clientFilter);
      const matchClientName = (inv.client_name || '').toLowerCase() === String(clientFilter).toLowerCase();
      if (!matchClientId && !matchClientName) return false;
    }

    // 3. Busca por texto
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchClient = (inv.client_name || '').toLowerCase().includes(q);
      const matchDesc = (inv.description || '').toLowerCase().includes(q);
      const matchContract = (inv.contract_code || '').toLowerCase().includes(q);
      const matchBudget = inv.budget_id && String(inv.budget_id).includes(q);
      const matchSale = inv.conta_azul_sale_id && String(inv.conta_azul_sale_id).toLowerCase().includes(q);
      if (!matchClient && !matchDesc && !matchContract && !matchBudget && !matchSale) {
        return false;
      }
    }

    // 4. Filtro de Período (7 dias, 14 dias, este mês, este ano, personalizado)
    if (periodoFilter !== 'Todos') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Coleta as datas relevantes da fatura (vencimento ou emissão)
      const datesToTest = [];
      if (inv.due_date) {
        const dParts = String(inv.due_date).split('T')[0].split('-');
        if (dParts.length === 3) {
          datesToTest.push(new Date(Number(dParts[0]), Number(dParts[1]) - 1, Number(dParts[2])));
        }
      }
      if (inv.created_at) {
        datesToTest.push(new Date(inv.created_at));
      }

      if (datesToTest.length === 0) return false;

      if (periodoFilter === '7d') {
        const matches = datesToTest.some(d => {
          const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= -7 && diffDays <= 7;
        });
        if (!matches) return false;
      } else if (periodoFilter === '14d') {
        const matches = datesToTest.some(d => {
          const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= -14 && diffDays <= 14;
        });
        if (!matches) return false;
      } else if (periodoFilter === 'mes') {
        const curMonth = today.getMonth();
        const curYear = today.getFullYear();
        const matches = datesToTest.some(d => d.getMonth() === curMonth && d.getFullYear() === curYear);
        if (!matches) return false;
      } else if (periodoFilter === 'ano') {
        const curYear = today.getFullYear();
        const matches = datesToTest.some(d => d.getFullYear() === curYear);
        if (!matches) return false;
      } else if (periodoFilter === 'custom') {
        const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : null;
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : null;

        const matches = datesToTest.some(d => {
          if (start && d < start) return false;
          if (end && d > end) return false;
          return true;
        });
        if (!matches) return false;
      }
    }

    return true;
  });

  const summary = {
    total: {
      count: filteredInvoices.length,
      amount: filteredInvoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0)
    },
    pendentes: {
      count: filteredInvoices.filter(i => i.status === 'Pendente').length,
      amount: filteredInvoices.filter(i => i.status === 'Pendente').reduce((acc, i) => acc + (Number(i.amount) || 0), 0)
    },
    faturadas: {
      count: filteredInvoices.filter(i => i.status === 'Faturada').length,
      amount: filteredInvoices.filter(i => i.status === 'Faturada').reduce((acc, i) => acc + (Number(i.amount) || 0), 0)
    },
    pagas: {
      count: filteredInvoices.filter(i => i.status === 'Paga').length,
      amount: filteredInvoices.filter(i => i.status === 'Paga').reduce((acc, i) => acc + (Number(i.amount) || 0), 0)
    },
    vencidas: {
      count: filteredInvoices.filter(i => i.status === 'Vencida').length,
      amount: filteredInvoices.filter(i => i.status === 'Vencida').reduce((acc, i) => acc + (Number(i.amount) || 0), 0)
    },
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

  const handleOpenLinkSaleModal = async (invoiceId) => {
    setIsLinkSaleModalOpen(true);
    setLinkSaleInput('');
    setSuggestedSales([]);
    setIsLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/conta-azul/link-sale?invoiceId=${invoiceId}`);
      const data = await res.json();
      if (data.success && data.suggestedSales) {
        setSuggestedSales(data.suggestedSales);
      }
    } catch (err) {
      console.warn('Erro ao buscar sugestões de vendas do Conta Azul:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleConfirmLinkSale = async (saleIdOrNumber) => {
    if (!saleIdOrNumber || !selectedInvoice?.id) return;
    setIsLinkingSale(true);
    try {
      const res = await fetch('/api/conta-azul/link-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          saleIdOrNumber: String(saleIdOrNumber).trim()
        })
      });

      let data;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        throw new Error(rawText || `Servidor retornou status HTTP ${res.status}`);
      }

      if (data.success) {
        alert('🎉 Venda vinculada com sucesso! Os dados fiscais e status foram sincronizados com o Conta Azul.');
        setIsLinkSaleModalOpen(false);
        const updatedInv = { ...selectedInvoice, conta_azul_sale_id: data.invoice?.conta_azul_sale_id || saleIdOrNumber };
        setSelectedInvoice(updatedInv);
        handleViewInvoiceDetails(updatedInv);
        fetchInvoices();
      } else {
        alert('Erro ao vincular venda: ' + (data.error || 'Falha ao vincular'));
      }
    } catch (err) {
      alert('Erro ao vincular venda do Conta Azul: ' + err.message);
    } finally {
      setIsLinkingSale(false);
    }
  };

  const handleTransmitInvoiceNow = async (invoiceId) => {
    if (!invoiceId) return;
    if (!confirm('Deseja transmitir os dados desta fatura para gerar a venda no Conta Azul agora?')) return;
    setIsTransmittingToCA(true);
    try {
      const res = await fetch('/api/conta-azul/transmit-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId })
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 Fatura transmitida ao Conta Azul com sucesso! Venda #' + (data.saleData?.number || data.saleId) + ' gerada.');
        const updatedInv = { ...selectedInvoice, conta_azul_sale_id: data.saleId };
        setSelectedInvoice(updatedInv);
        handleViewInvoiceDetails(updatedInv);
        fetchInvoices();
      } else {
        alert('Erro ao transmitir fatura ao Conta Azul: ' + (data.error || 'Falha'));
      }
    } catch (err) {
      alert('Erro de conexão ao transmitir fatura: ' + err.message);
    } finally {
      setIsTransmittingToCA(false);
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
          {/* Status Conta Azul & Sincronização de Baixas */}
          {contaAzulConnected ? (
            <div className="flex items-center space-x-2">
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

              <button
                type="button"
                onClick={handleSyncAllInvoicesFromContaAzul}
                disabled={isSyncingAll}
                className="flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors shadow-xs"
                title="Buscar baixas e conciliações bancárias no Conta Azul e marcar faturas como Pagas"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                {isSyncingAll ? 'Sincronizando...' : 'Sincronizar Baixas'}
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

          <button 
            type="button"
            onClick={() => handleOpenRentalModal()}
            className="flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-xs"
            title="Faturar proposta de locação aprovada (avulsa ou contrato)"
          >
            <Building2 className="w-4 h-4 mr-1.5" />
            Faturar Locação
          </button>

          <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-xs">
            <Plus className="w-4 h-4 mr-2" />
            Nova Fatura Manual
          </button>
        </div>
      </header>

      {/* Barra de Filtros Avançados */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
        {/* Linha 1: Busca e Seletores Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Busca por texto */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, descrição, contrato..."
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Cliente */}
          <div className="lg:col-span-3">
            <select 
              value={clientFilter} 
              onChange={e => setClientFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Todos">Todos os Clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Status */}
          <div className="lg:col-span-2">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Todos">Status: Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Faturada">Faturada</option>
              <option value="Paga">Paga</option>
              <option value="Vencida">Vencida</option>
            </select>
          </div>

          {/* Filtro por Período */}
          <div className="lg:col-span-3">
            <select 
              value={periodoFilter} 
              onChange={e => setPeriodoFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Todos">Período: Todos</option>
              <option value="7d">Últimos / Próx. 7 Dias</option>
              <option value="14d">Últimos / Próx. 14 Dias</option>
              <option value="mes">Este Mês</option>
              <option value="ano">Este Ano</option>
              <option value="custom">Personalizado...</option>
            </select>
          </div>
        </div>

        {/* Linha 2: Botões Rápidos de Período & Período Personalizado */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-gray-500 mr-1">Atalhos de Período:</span>
            {[
              { id: 'Todos', label: 'Todos' },
              { id: '7d', label: '7 dias' },
              { id: '14d', label: '14 dias' },
              { id: 'mes', label: 'Este Mês' },
              { id: 'ano', label: 'Este Ano' },
              { id: 'custom', label: 'Personalizado' },
            ].map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setPeriodoFilter(preset.id)}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                  periodoFilter === preset.id
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Range de Datas Customizado */}
          {periodoFilter === 'custom' && (
            <div className="flex items-center gap-2 text-xs bg-blue-50/70 border border-blue-200 px-3 py-1.5 rounded-lg animate-in fade-in">
              <span className="font-semibold text-blue-900">De:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="font-semibold text-blue-900">Até:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-blue-200 rounded text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Limpar Filtros */}
          {(statusFilter !== 'Todos' || clientFilter !== 'Todos' || periodoFilter !== 'Todos' || searchQuery.trim()) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('Todos');
                setClientFilter('Todos');
                setPeriodoFilter('Todos');
                setCustomStartDate('');
                setCustomEndDate('');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline flex items-center ml-auto"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Cartões de Resumo com Quantidades e Valores Financeiros */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex flex-col justify-between relative overflow-hidden hover:border-gray-300 transition-all">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total</span>
              <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              {formatCurrency(summary.total.amount)}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Quantidade</span>
            <span className="font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
              {summary.total.count} {summary.total.count === 1 ? 'fatura' : 'faturas'}
            </span>
          </div>
        </div>

        {/* Pendentes */}
        <div className="bg-white rounded-xl shadow-xs border border-amber-100/80 p-4 flex flex-col justify-between relative overflow-hidden hover:border-amber-300 transition-all">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pendentes</span>
              <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl md:text-2xl font-black text-amber-600 tracking-tight">
              {formatCurrency(summary.pendentes.amount)}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-50 flex items-center justify-between text-xs text-gray-500">
            <span>Quantidade</span>
            <span className="font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              {summary.pendentes.count} {summary.pendentes.count === 1 ? 'fatura' : 'faturas'}
            </span>
          </div>
        </div>

        {/* Faturadas */}
        <div className="bg-white rounded-xl shadow-xs border border-blue-100/80 p-4 flex flex-col justify-between relative overflow-hidden hover:border-blue-300 transition-all">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Faturadas</span>
              <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl md:text-2xl font-black text-blue-600 tracking-tight">
              {formatCurrency(summary.faturadas.amount)}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-blue-50 flex items-center justify-between text-xs text-gray-500">
            <span>Quantidade</span>
            <span className="font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {summary.faturadas.count} {summary.faturadas.count === 1 ? 'fatura' : 'faturas'}
            </span>
          </div>
        </div>

        {/* Pagas */}
        <div className="bg-white rounded-xl shadow-xs border border-emerald-100/80 p-4 flex flex-col justify-between relative overflow-hidden hover:border-emerald-300 transition-all">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Pagas</span>
              <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl md:text-2xl font-black text-emerald-600 tracking-tight">
              {formatCurrency(summary.pagas.amount)}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-emerald-50 flex items-center justify-between text-xs text-gray-500">
            <span>Quantidade</span>
            <span className="font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {summary.pagas.count} {summary.pagas.count === 1 ? 'fatura' : 'faturas'}
            </span>
          </div>
        </div>

        {/* Vencidas / Atrasadas */}
        <div className="bg-white rounded-xl shadow-xs border border-red-100/80 p-4 flex flex-col justify-between relative overflow-hidden hover:border-red-300 transition-all col-span-2 md:col-span-1">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Atrasadas</span>
              <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl md:text-2xl font-black text-red-600 tracking-tight">
              {formatCurrency(summary.vencidas.amount)}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-red-50 flex items-center justify-between text-xs text-gray-500">
            <span>Quantidade</span>
            <span className="font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
              {summary.vencidas.count} {summary.vencidas.count === 1 ? 'fatura' : 'faturas'}
            </span>
          </div>
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
              <thead className="border-b border-gray-200 bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-left">Cliente</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-left">Descrição</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right whitespace-nowrap">Valor</th>
                  <th className="px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center whitespace-nowrap">Vencimento</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider text-center whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-4 font-semibold text-gray-800 whitespace-nowrap">{inv.client_name}</td>
                    <td className="px-4 py-4">
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
                        {inv.rental_proposal_id && (
                          <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-purple-600" />
                            Locação #{inv.rental_proposal_id}
                            {inv.rental_period_months ? ` (${formatRentalPeriod(inv.rental_period_months)})` : ''}
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
                    <td className="px-6 py-4 text-right font-bold text-gray-900 whitespace-nowrap">{formatCurrency(inv.amount)}</td>
                    <td className="px-6 py-4 text-center text-gray-600 whitespace-nowrap">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        inv.status === 'Paga' ? 'bg-green-100 text-green-700' :
                        inv.status === 'Faturada' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        inv.status === 'Vencida' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleViewInvoiceDetails(inv)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Visualizar Detalhes da Fatura"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.conta_azul_sale_id ? (
                          <a
                            href={`/api/conta-azul/download-nf?invoiceId=${inv.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg transition-colors inline-flex items-center"
                            title="Baixar / Exportar Nota Fiscal (Conta Azul)"
                          >
                            <FileDown className="w-4 h-4" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg"
                            title="Fatura ainda sem venda vinculada no Conta Azul"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        )}
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
                      (detailedInvoice?.invoice?.status || selectedInvoice.status) === 'Paga' ? 'bg-green-100 text-green-800' :
                      (detailedInvoice?.invoice?.status || selectedInvoice.status) === 'Faturada' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      (detailedInvoice?.invoice?.status || selectedInvoice.status) === 'Vencida' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {detailedInvoice?.invoice?.status || selectedInvoice.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedInvoice.created_at ? `Emitida em ${new Date(selectedInvoice.created_at).toLocaleDateString('pt-BR')}` : ''}
                    {(detailedInvoice?.invoice?.due_date || selectedInvoice.due_date) ? ` &bull; Vencimento: ${formatDate(detailedInvoice?.invoice?.due_date || selectedInvoice.due_date)}` : ''}
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
                      {detailedInvoice?.contaAzulInfo?.nfStatus ? (
                        <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded-full ${
                          detailedInvoice.contaAzulInfo.nfStatus.includes('Emitida') ? 'bg-green-100 text-green-800' :
                          detailedInvoice.contaAzulInfo.nfStatus.includes('Solicitada') ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {detailedInvoice.contaAzulInfo.nfStatus.includes('Emitida') && <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />}
                          {detailedInvoice.contaAzulInfo.nfStatus}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          {selectedInvoice.conta_azul_sale_id ? 'Aguardando sincronização' : 'Pendente de emissão'}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-500 block mb-0.5">Número da NF</span>
                      {detailedInvoice?.contaAzulInfo?.nfNumber ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 font-mono">
                            NF #{detailedInvoice.contaAzulInfo.nfNumber}
                          </span>
                          <a 
                            href={`/api/conta-azul/download-nf?invoiceId=${selectedInvoice.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-cyan-700 hover:text-cyan-900 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 font-semibold inline-flex items-center text-[11px]" 
                            title="Baixar PDF da Nota Fiscal"
                          >
                            <FileDown className="w-3.5 h-3.5 mr-1" />
                            Baixar NF
                          </a>
                        </div>
                      ) : selectedInvoice.conta_azul_sale_id ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="text-gray-500 italic">Vinculada</span>
                          <a 
                            href={`/api/conta-azul/download-nf?invoiceId=${selectedInvoice.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-cyan-700 hover:text-cyan-900 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 font-semibold inline-flex items-center text-[11px]" 
                            title="Baixar ou verificar Nota Fiscal"
                          >
                            <FileDown className="w-3.5 h-3.5 mr-1" />
                            Baixar NF
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Aguardando emissão no CA</span>
                      )}
                    </div>
                  </div>

                  {(!selectedInvoice.conta_azul_sale_id && !detailedInvoice?.contaAzulInfo?.saleNumber) ? (
                    <div className="mt-3 pt-3 border-t border-cyan-200/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/90 p-3 rounded-lg border border-cyan-200 shadow-xs">
                        <div>
                          <p className="text-xs font-bold text-amber-800 flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                            Venda ainda não vinculada ao Conta Azul
                          </p>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            Como a NF foi emitida direto no Conta Azul, vincule o número da venda/NF para sincronizar o status da nota e as baixas de pagamento.
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenLinkSaleModal(selectedInvoice.id)}
                            className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-semibold flex items-center shadow-xs transition-all"
                          >
                            <Link2 className="w-3.5 h-3.5 mr-1.5" />
                            Vincular Venda / NF
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransmitInvoiceNow(selectedInvoice.id)}
                            disabled={isTransmittingToCA}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center shadow-xs transition-all disabled:opacity-50"
                            title="Criar a venda automaticamente no Conta Azul agora"
                          >
                            {isTransmittingToCA ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                Transmitindo...
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5 mr-1.5" />
                                Transmitir ao CA
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenLinkSaleModal(selectedInvoice.id)}
                        className="text-[11px] text-cyan-700 hover:text-cyan-900 underline inline-flex items-center"
                      >
                        <Link2 className="w-3 h-3 mr-1" />
                        Alterar ou re-vincular venda no Conta Azul
                      </button>
                    </div>
                  )}
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
                    ) : (detailedInvoice?.rentalProposal || selectedInvoice.rental_proposal_id) ? (
                      <>
                        <p className="font-bold text-purple-700 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-purple-600" />
                          Proposta de Locação #{detailedInvoice?.rentalProposal?.id || selectedInvoice.rental_proposal_id}
                        </p>
                        <p className="text-gray-800 font-medium mt-0.5">
                          {detailedInvoice?.rentalProposal?.machine_name || detailedInvoice?.equipment?.name || 'Equipamento de Locação'}
                        </p>
                        <p className="text-gray-500">
                          {detailedInvoice?.rentalProposal?.period_months ? `Período: ${formatRentalPeriod(detailedInvoice.rentalProposal.period_months)}` : ''}
                          {detailedInvoice?.rentalProposal?.equipment_name ? ` • Ativo: ${detailedInvoice.rentalProposal.equipment_name}` : ''}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500 italic">Fatura manual avulsa</p>
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
                    <span className="text-xs font-bold text-gray-600">
                      {selectedInvoice.invoice_type === 'servicos' ? 'Prestação de Serviços' : selectedInvoice.invoice_type === 'pecas' ? 'Venda de Peças / Mercadorias' : selectedInvoice.invoice_type === 'locacao' ? 'Locação de Equipamentos' : 'Geral'}
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
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleExportPDF(detailedInvoice)}
                  disabled={isDetailLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                >
                  <FileDown className="w-4 h-4 mr-1.5" />
                  Exportar Fatura PDF
                </button>

                {selectedInvoice.conta_azul_sale_id && (
                  <a
                    href={`/api/conta-azul/download-nf?invoiceId=${selectedInvoice.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                    title="Baixar Nota Fiscal emitida no Conta Azul"
                  >
                    <FileDown className="w-4 h-4 mr-1.5" />
                    Baixar NF (Conta Azul)
                  </a>
                )}
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

      {/* Modal de Vinculação de Venda do Conta Azul */}
      {isLinkSaleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-cyan-700 to-blue-700 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Link2 className="w-5 h-5 text-cyan-200" />
                <h3 className="font-bold text-base">Vincular Venda do Conta Azul</h3>
              </div>
              <button
                onClick={() => setIsLinkSaleModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <p className="text-gray-600 text-xs leading-relaxed">
                Informe o <strong>Número da Venda</strong> ou o <strong>Número da NF</strong> emitida no Conta Azul para a Fatura #{selectedInvoice?.id} ({formatCurrency(selectedInvoice?.amount)}).
              </p>

              {/* Input manual */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Número da Venda ou da NF no Conta Azul
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Ex: 45 ou 1002"
                    value={linkSaleInput}
                    onChange={(e) => setLinkSaleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmLinkSale(linkSaleInput);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-hidden font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleConfirmLinkSale(linkSaleInput)}
                    disabled={isLinkingSale || !linkSaleInput.trim()}
                    className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white rounded-lg font-semibold text-xs transition-all flex items-center shrink-0"
                  >
                    {isLinkingSale ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Link2 className="w-4 h-4 mr-1" />}
                    Vincular
                  </button>
                </div>
              </div>

              {/* Sugestões automáticas trazidas do Conta Azul */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Vendas Recentes no Conta Azul
                  </span>
                  {isLoadingSuggestions && (
                    <span className="text-xs text-cyan-600 flex items-center">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Buscando...
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {suggestedSales.length > 0 ? (
                    suggestedSales.map((sale) => (
                      <div 
                        key={sale.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                          sale.matchScore > 30 ? 'bg-cyan-50/80 border-cyan-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="mr-2 overflow-hidden">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-gray-900 font-mono">Venda #{sale.number}</span>
                            {sale.matchScore > 30 && (
                              <span className="text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded">
                                Sugerida
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 font-medium truncate max-w-[210px] mt-0.5">{sale.customerName}</p>
                          <p className="text-gray-500 text-[11px]">
                            {formatCurrency(sale.total)} • {formatDate(sale.emission)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConfirmLinkSale(sale.number || sale.id)}
                          disabled={isLinkingSale}
                          className="px-3 py-1.5 bg-white hover:bg-cyan-700 hover:text-white text-cyan-800 border border-cyan-300 font-bold rounded-lg text-xs transition-colors shadow-xs shrink-0"
                        >
                          Vincular
                        </button>
                      </div>
                    ))
                  ) : !isLoadingSuggestions ? (
                    <p className="text-xs text-gray-400 italic py-2 text-center">
                      Nenhuma venda recente encontrada. Digite o número acima.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLinkSaleModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Fechar
              </button>
      {/* Modal Faturar Proposta de Locação */}
      {isRentalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-5 h-5 text-indigo-200" />
                <div>
                  <h3 className="font-bold text-base">Faturar Proposta de Locação</h3>
                  <p className="text-xs text-indigo-200">Geração de fatura e criação automática de venda no Conta Azul</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRentalModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRentalInvoice} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
              {isLoadingRentalProposals ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                  <span className="text-xs text-gray-500 font-medium">Carregando propostas de locação aprovadas...</span>
                </div>
              ) : rentalProposals.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                  <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-gray-700">Nenhuma proposta de locação aprovada encontrada</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Apenas propostas com status <strong>Fechada</strong>, <strong>Aprovada</strong> ou <strong>Contrato</strong> podem ser faturadas.
                  </p>
                  <Link
                    to="/proposta-locacao"
                    className="inline-flex items-center mt-4 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs hover:bg-indigo-100"
                  >
                    Ver Propostas de Locação
                  </Link>
                </div>
              ) : (
                <>
                  {/* Seletor de Proposta */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Selecione a Proposta de Locação Aprovada
                    </label>
                    <select
                      value={selectedRentalProposalId}
                      onChange={handleProposalChange}
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      {rentalProposals.map(p => {
                        const isAvulsa = isRentalAvulsa(p.period_months);
                        const periodStr = formatRentalPeriod(p.period_months);
                        const machine = p.machine_name || 'Equipamento';
                        const val = formatCurrency(p.monthly_value);
                        return (
                          <option key={p.id} value={p.id}>
                            #{p.id} - {p.client_name} • {machine} • {periodStr} ({val}) {isAvulsa ? '⭐ [Avulsa]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Card de Resumo da Proposta Selecionada */}
                  {(() => {
                    const currentProp = rentalProposals.find(p => String(p.id) === String(selectedRentalProposalId));
                    if (!currentProp) return null;

                    const isAvulsa = isRentalAvulsa(currentProp.period_months);
                    const periodStr = formatRentalPeriod(currentProp.period_months);

                    return (
                      <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-indigo-950 text-sm">{currentProp.client_name}</span>
                            {isAvulsa ? (
                              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-emerald-300">
                                Locação Avulsa
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                                Contrato Longo Prazo
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-indigo-700 font-mono text-sm">
                            {formatCurrency(currentProp.monthly_value)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-gray-700 pt-1 border-t border-indigo-100">
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Máquina / Modelo</span>
                            <span className="font-semibold text-gray-800">{currentProp.machine_name || 'Não informado'}</span>
                            {currentProp.equipment_name && (
                              <span className="block text-gray-500 text-[11px]">Ativo: {currentProp.equipment_name}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Período de Uso</span>
                            <span className="font-semibold text-gray-800">{periodStr}</span>
                            <span className="block text-gray-500 text-[11px]">{isAvulsa ? 'Sem recorrência contratual' : `${currentProp.period_months} parcelas mensais`}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Campos da Fatura */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Data de Vencimento *
                      </label>
                      <input
                        type="date"
                        required
                        value={rentalInvoiceForm.dueDate}
                        onChange={e => setRentalInvoiceForm({ ...rentalInvoiceForm, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Valor da Fatura (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={rentalInvoiceForm.amount}
                        onChange={e => setRentalInvoiceForm({ ...rentalInvoiceForm, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Descrição da Fatura *
                    </label>
                    <input
                      type="text"
                      required
                      value={rentalInvoiceForm.description}
                      onChange={e => setRentalInvoiceForm({ ...rentalInvoiceForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      placeholder="Ex: Locação de Equipamento..."
                    />
                  </div>

                  {/* Integração Conta Azul */}
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rentalInvoiceForm.sendToContaAzul}
                        onChange={e => setRentalInvoiceForm({ ...rentalInvoiceForm, sendToContaAzul: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <span className="font-bold text-xs text-gray-800">
                        Criar venda e lançar financeiro automaticamente no Conta Azul
                      </span>
                    </label>

                    {contaAzulConnected ? (
                      <p className="text-[11px] text-emerald-700 flex items-center font-medium pl-6">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                        Conta Azul Conectado — A venda será lançada via API oficial com status de faturamento.
                      </p>
                    ) : (
                      <p className="text-[11px] text-amber-700 flex items-center font-medium pl-6">
                        <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
                        Conta Azul não conectado. A fatura será registrada apenas no Clean Tech Smart.
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRentalModalOpen(false)}
                  disabled={isSubmittingRentalInvoice}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                {rentalProposals.length > 0 && (
                  <button
                    type="submit"
                    disabled={isSubmittingRentalInvoice}
                    className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center"
                  >
                    {isSubmittingRentalInvoice ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Gerando Fatura & Venda...
                      </>
                    ) : (
                      <>
                        <Building2 className="w-3.5 h-3.5 mr-1.5" />
                        Gerar Fatura & Venda no Conta Azul
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
