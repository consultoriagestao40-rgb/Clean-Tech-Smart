import React, { useState, useEffect } from 'react';
import { 
  Plus, Loader2, ArrowLeft, Edit, ChevronDown, ChevronRight, Package, Printer, Play, 
  Square, CheckCircle, Ban, Trash2, DollarSign, TrendingUp, TrendingDown, Percent, 
  Calendar, Clock, AlertTriangle, Bell, Eye, FileText, CheckCircle2, AlertCircle, 
  CreditCard, Send, RefreshCw, X, ShieldCheck, Sparkles, Building2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Contratos() {
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [dbClients, setDbClients] = useState([]);
  const [dbEquipments, setDbEquipments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(null);
  const [isSendingWhatsapp, setIsSendingWhatsapp] = useState(false);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [clientSearch, setClientSearch] = useState('');
  const [equipSearch, setEquipSearch] = useState('');
  const [serieSearch, setSerieSearch] = useState('');

  // Modal de Cadastro Direto de Contrato em Andamento
  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [isSavingDirectContract, setIsSavingDirectContract] = useState(false);
  const [directForm, setDirectForm] = useState({
    client_id: '',
    client_name: '',
    equipment_id: '',
    equipment_name: '',
    serial_number: '',
    monthly_value: '',
    payment_method: 'Boleto', // Boleto, Pix, Transferência
    total_installments: 12,
    current_installment: 1,
    billing_day: 5,
    due_day: 15,
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    cost_value: 0,
    tax_cost_percent: 8,
    observations: ''
  });

  // Modal de Detalhes do Contrato
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedContractForDetails, setSelectedContractForDetails] = useState(null);

  // Modal de Emissão Rápida de Fatura
  const [isEmitModalOpen, setIsEmitModalOpen] = useState(false);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const [contractToEmit, setContractToEmit] = useState(null);
  const [emitForm, setEmitForm] = useState({
    contract_code: '',
    client_id: '',
    description: '',
    amount: '',
    due_date: '',
    installment_number: '',
    payment_method: 'Boleto'
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
    // Disparo diário automático para o financeiro no WhatsApp (se ainda não enviado hoje)
    triggerDailyWhatsappCheck();
  }, []);

  async function fetchAllData() {
    setIsLoading(true);
    try {
      const [cRes, iRes, clRes, eqRes] = await Promise.all([
        fetch('/api/get-contracts'),
        fetch('/api/get-invoices'),
        fetch('/api/get-clients'),
        fetch('/api/get-equipments')
      ]);

      if (cRes.ok) {
        const data = await cRes.json();
        if (data.contracts) setContracts(data.contracts);
      }
      if (iRes.ok) {
        const data = await iRes.json();
        if (data.invoices) setInvoices(data.invoices);
      }
      if (clRes.ok) {
        const data = await clRes.json();
        if (data.clients) setDbClients(data.clients);
      }
      if (eqRes.ok) {
        const data = await eqRes.json();
        if (data.equipments) setDbEquipments(data.equipments);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function triggerDailyWhatsappCheck() {
    try {
      await fetch('/api/contracts/send-billing-whatsapp');
    } catch (e) {
      console.error('Erro ao verificar alerta diário:', e);
    }
  }

  async function handleManualSendWhatsappAlert() {
    setIsSendingWhatsapp(true);
    try {
      const res = await fetch('/api/contracts/send-billing-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Alerta de faturamento enviado com sucesso no WhatsApp do Financeiro!\n${data.count} contrato(s) sinalizados.`);
      } else {
        alert('Erro ao enviar alerta: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar com o serviço de WhatsApp.');
    } finally {
      setIsSendingWhatsapp(false);
    }
  }

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Impressão de Minuta (Mantida integralmente)
  const handlePrintContract = async (ctr) => {
    setIsGeneratingPDF(ctr.id);
    const companyLogo = localStorage.getItem('app_company_logo') || '';
    const companyName = localStorage.getItem('app_company_name') || 'Clean Tech Pro';
    const companyCnpj = localStorage.getItem('app_company_cnpj') || '00.000.000/0001-00';
    const companyAddress = localStorage.getItem('app_company_address') || 'Curitiba - PR';
    const companyPhone = localStorage.getItem('app_company_phone') || '41984042835';
    try {
      const res = await fetch('/api/get-templates');
      const data = await res.json();
      let defaultTemplate = data.templates?.find(t => t.is_default);
      
      if (!defaultTemplate && data.templates?.length > 0) {
        defaultTemplate = data.templates[0];
      }

      if (!defaultTemplate) {
        alert('Nenhum Template cadastrado. Vá em Templates e crie um novo.');
        setIsGeneratingPDF(null);
        return;
      }

      const client = dbClients.find(c => String(c.id) === String(ctr.client_id)) || {};

      let dbModalities = [];
      try {
        const modRes = await fetch('/api/get-modalities');
        const modData = await modRes.json();
        dbModalities = modData.modalities || [];
      } catch (e) {
        console.error(e);
      }

      const clauses = typeof defaultTemplate.clauses === 'string' ? JSON.parse(defaultTemplate.clauses) : defaultTemplate.clauses || [];
      
      const clausesHtml = clauses.map(clause => {
        let content = clause.content || '';
        content = content.replace(/{{CLIENT_NAME}}/g, ctr.client_name || '');
        content = content.replace(/{{CONTRACT_CODE}}/g, ctr.code || '');
        content = content.replace(/{{START_DATE}}/g, formatDate(ctr.start_date));
        content = content.replace(/{{TOTAL_VALUE}}/g, formatCurrency(parseFloat(ctr.total_rental_value || 0) + parseFloat(ctr.total_services_value || 0)));
        
        return `
          <p style="font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase;">${clause.title}:</p>
          <p style="margin-top: 0; margin-bottom: 10px;">${content.replace(/\n/g, '<br/>')}</p>
        `;
      }).join('');

      const parsedEquipments = typeof ctr.equipments === 'string' ? JSON.parse(ctr.equipments) : ctr.equipments || [];
      const equipmentsHtml = parsedEquipments.map(eq => {
         const foundEq = dbEquipments.find(e => String(e.id) === String(eq.equipment_id)) || {};
         const foundMod = dbModalities.find(m => String(m.id) === String(eq.modality_id)) || {};
         return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 5px;">${eq.name || foundEq.name || 'Equipamento'}</td>
            <td style="padding: 8px 5px; text-align: right;">${formatCurrency(foundEq.list_price || 0)}</td>
            <td style="padding: 8px 5px;">${eq.serial_number || foundEq.serial_number || '-'}</td>
            <td style="padding: 8px 5px;">${foundMod.name || 'Locação Mensal'}</td>
            <td style="padding: 8px 5px; text-align: right;">1,00</td>
            <td style="padding: 8px 5px; text-align: right;">${formatCurrency(eq.price)}</td>
            <td style="padding: 8px 5px;">${formatDate(eq.prev_retirada)}</td>
          </tr>
         `;
      }).join('');

      const parsedServices = typeof ctr.services === 'string' ? JSON.parse(ctr.services) : ctr.services || [];
      const servicesHtml = parsedServices.map(svc => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 5px;">${svc.description || 'Serviço'}</td>
          <td style="padding: 8px 5px; text-align: right;">${formatCurrency(svc.price)}</td>
        </tr>
      `).join('');

      const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Contrato ${ctr.code}</title>
  <style>
    body { font-family: sans-serif; font-size: 12px; color: #374151; line-height: 1.5; margin: 40px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px; }
    .logo { max-height: 60px; }
    .company-details { text-align: right; font-size: 11px; color: #6b7280; }
    .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 20px; color: #111827; text-transform: uppercase; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .info-table td { padding: 5px; border: 1px solid #e5e7eb; }
    .label { font-weight: bold; color: #4b5563; background: #f9fafb; width: 150px; }
    .table-title { font-weight: bold; font-size: 12px; border-bottom: 1px solid #374151; padding-bottom: 3px; margin: 20px 0 10px 0; color: #111827; text-transform: uppercase; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: #f3f4f6; padding: 6px 5px; border-bottom: 2px solid #e5e7eb; text-align: left; font-size: 11px; }
    .items-table td { padding: 6px 5px; border-bottom: 1px solid #e5e7eb; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 50px; page-break-inside: avoid; }
    .signature-box { width: 45%; border-top: 1px solid #9ca3af; text-align: center; padding-top: 10px; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${companyLogo ? `<img src="${companyLogo}" class="logo" />` : `<h2 style="margin: 0; color: #2563eb;">${companyName}</h2>`}
    </div>
    <div class="company-details">
      <strong>${companyName}</strong><br/>
      CNPJ: ${companyCnpj}<br/>
      Endereço: ${companyAddress}<br/>
      Tel: ${companyPhone}
    </div>
  </div>

  <div class="title">Instrumento Particular de Contrato de Locação e Outros Pactos</div>

  <table class="info-table">
    <tr>
      <td class="label">Contrato Nº</td>
      <td><strong>${ctr.code}</strong></td>
      <td class="label">Data de Início</td>
      <td>${formatDate(ctr.start_date)}</td>
    </tr>
    <tr>
      <td class="label">Locatário</td>
      <td colspan="3"><strong style="text-transform: uppercase;">${ctr.client_name}</strong></td>
    </tr>
    <tr>
      <td class="label">CNPJ/CPF</td>
      <td>${client.document || '-'}</td>
      <td class="label">Telefone</td>
      <td>${client.phone || '-'}</td>
    </tr>
    <tr>
      <td class="label">Endereço</td>
      <td colspan="3">${client.address || '-'}</td>
    </tr>
  </table>

  <div class="table-title">Equipamentos Locados</div>
  <table class="items-table">
    <thead>
      <tr>
        <th>Descrição do Equipamento</th>
        <th style="text-align: right;">Valor de Tabela</th>
        <th>Nº de Série</th>
        <th>Modalidade</th>
        <th style="text-align: right;">Qtd</th>
        <th style="text-align: right;">Valor Aluguel</th>
        <th>Previsão Devolução</th>
      </tr>
    </thead>
    <tbody>
      ${equipmentsHtml}
    </tbody>
  </table>

  ${parsedServices.length > 0 ? `
    <div class="table-title">Serviços Contratados</div>
    <table class="items-table" style="width: 50%;">
      <thead>
        <tr>
          <th>Descrição do Serviço</th>
          <th style="text-align: right;">Valor Mensal</th>
        </tr>
      </thead>
      <tbody>
        ${servicesHtml}
      </tbody>
    </table>
  ` : ''}

  <div class="table-title">Condições Contratuais / Cláusulas</div>
  <div style="text-align: justify; font-size: 11px;">
    ${clausesHtml}
  </div>

  <div class="signature-row">
    <div class="signature-box">
      <strong>${companyName.toUpperCase()}</strong><br/>
      Locadora
    </div>
    <div class="signature-box">
      <strong>${(ctr.client_name || '').toUpperCase()}</strong><br/>
      Locatário
    </div>
  </div>
</body>
</html>`;

      const win = window.open('', '_blank');
      win.document.write(printHtml);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 500);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar impressão do contrato.');
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!confirm(`Deseja alterar o status deste contrato para "${newStatus}"?`)) return;
    try {
      const response = await fetch('/api/update-contract-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (response.ok) {
        fetchAllData();
      } else {
        const error = await response.json();
        alert('Erro ao alterar status: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede.');
    }
  };

  const handleDeleteContract = async (id) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este contrato e todas as suas faturas?')) return;
    try {
      const response = await fetch('/api/delete-contract', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        fetchAllData();
      } else {
        const error = await response.json();
        alert('Erro ao excluir contrato: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao excluir contrato.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    if (typeof dateStr === 'string' && dateStr.includes('-') && dateStr.length === 10) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Mês e Ano corrente
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1 a 12
  const currentYear = today.getFullYear();
  const currentCompetenceCode = `${String(currentMonth).padStart(2, '0')}/${currentYear}`;

  // Faturas do contrato
  const getContractInvoices = (contractCode) => {
    if (!contractCode) return [];
    return invoices.filter(inv => inv.contract_code === contractCode);
  };

  // Encontra a fatura da competência atual deste contrato (se existir)
  const getMonthInvoice = (ctr) => {
    const ctrInvoices = getContractInvoices(ctr.code);
    return ctrInvoices.find(inv => {
      if (inv.description && inv.description.includes(currentCompetenceCode)) return true;
      if (inv.due_date) {
        const d = new Date(inv.due_date);
        if (d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear) return true;
      }
      return false;
    });
  };

  // ----------------------------------------------------
  // CADASTRO DIRETO DE CONTRATO EM ANDAMENTO
  // ----------------------------------------------------
  const handleSaveDirectContract = async (e) => {
    e.preventDefault();

    if (!directForm.client_id && !directForm.client_name) {
      alert('Por favor, informe ou selecione o cliente.');
      return;
    }
    if (!directForm.monthly_value || parseFloat(directForm.monthly_value) <= 0) {
      alert('Por favor, informe o valor mensal da locação.');
      return;
    }
    if (!directForm.billing_day || !directForm.due_day) {
      alert('Por favor, informe o dia do faturamento e o dia do vencimento.');
      return;
    }

    setIsSavingDirectContract(true);
    try {
      const monthlyVal = parseFloat(directForm.monthly_value || 0);
      const costVal = parseFloat(directForm.cost_value || 0);
      const taxPct = parseFloat(directForm.tax_cost_percent || 8);
      const totalInst = parseInt(directForm.total_installments || 12);
      const currInst = parseInt(directForm.current_installment || 1);

      let calculatedExpiry = directForm.expiry_date;
      if (!calculatedExpiry && directForm.start_date) {
        const dtEnd = new Date(directForm.start_date);
        dtEnd.setMonth(dtEnd.getMonth() + totalInst);
        calculatedExpiry = dtEnd.toISOString().split('T')[0];
      }

      const dtReadjust = new Date(directForm.start_date || new Date());
      dtReadjust.setFullYear(dtReadjust.getFullYear() + 1);

      let selectedEqName = directForm.equipment_name;
      if (directForm.equipment_id) {
        const found = dbEquipments.find(eq => String(eq.id) === String(directForm.equipment_id));
        if (found) {
          selectedEqName = found.name;
        }
      }
      if (!selectedEqName) selectedEqName = 'Equipamento de Locação';

      const equipments = [{
        equipment_id: directForm.equipment_id || null,
        name: selectedEqName,
        serial_number: directForm.serial_number || '-',
        price: monthlyVal,
        prev_entrega: directForm.start_date,
        prev_retirada: calculatedExpiry
      }];

      const payload = {
        client_id: directForm.client_id || 'new',
        client_name: directForm.client_name,
        start_date: directForm.start_date,
        expiry_date: calculatedExpiry,
        readjustment_date: dtReadjust.toISOString().split('T')[0],
        status: 'Ativo',
        total_rental_value: monthlyVal,
        total_services_value: 0,
        total_venal_value: monthlyVal * 10,
        cost_value: costVal,
        tax_cost_percent: taxPct,
        billing_day: parseInt(directForm.billing_day),
        due_day: parseInt(directForm.due_day),
        payment_method: directForm.payment_method || 'Boleto',
        total_installments: totalInst,
        current_installment: currInst,
        equipments,
        services: [],
        observations: directForm.observations || `Contrato em andamento cadastrado diretamente (Parcela ${currInst}/${totalInst})`
      };

      const res = await fetch('/api/save-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Contrato ${data.contract?.code || ''} cadastrado com sucesso!`);
        setIsDirectModalOpen(false);
        setDirectForm({
          client_id: '',
          client_name: '',
          equipment_id: '',
          equipment_name: '',
          serial_number: '',
          monthly_value: '',
          payment_method: 'Boleto',
          total_installments: 12,
          current_installment: 1,
          billing_day: 5,
          due_day: 15,
          start_date: new Date().toISOString().split('T')[0],
          expiry_date: '',
          cost_value: 0,
          tax_cost_percent: 8,
          observations: ''
        });
        fetchAllData();
      } else {
        const err = await res.json();
        alert('Erro ao salvar contrato: ' + (err.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      alert('Erro de comunicação ao salvar contrato.');
    } finally {
      setIsSavingDirectContract(false);
    }
  };

  // ----------------------------------------------------
  // EMISSÃO RÁPIDA DE FATURA RECORRENTE
  // ----------------------------------------------------
  const handleOpenEmitModal = (ctr) => {
    const dueDay = ctr.due_day || 15;
    const dueDateObj = new Date(currentYear, today.getMonth(), dueDay);
    const dueDateStr = dueDateObj.toISOString().split('T')[0];

    const currentInst = ctr.current_installment || 1;
    const totalInst = ctr.total_installments || 12;
    const instStr = `${String(currentInst).padStart(2, '0')}/${String(totalInst).padStart(2, '0')}`;

    setContractToEmit(ctr);
    setEmitForm({
      contract_code: ctr.code,
      client_id: ctr.client_id,
      description: `Locação Mensal - Parcela ${instStr} (${currentCompetenceCode}) - ${ctr.code}`,
      amount: parseFloat(ctr.total_rental_value || 0),
      due_date: dueDateStr,
      installment_number: instStr,
      payment_method: ctr.payment_method || 'Boleto'
    });
    setIsEmitModalOpen(true);
  };

  const handleSaveEmitInvoice = async (e) => {
    e.preventDefault();
    if (!emitForm.due_date || !emitForm.amount) {
      alert('Data de vencimento e valor são obrigatórios.');
      return;
    }

    setIsSavingInvoice(true);
    try {
      const res = await fetch('/api/save-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emitForm,
          status: 'Pendente',
          invoice_type: 'locacao'
        })
      });

      if (res.ok) {
        alert(`Fatura emitida com sucesso para o contrato ${emitForm.contract_code}!`);
        setIsEmitModalOpen(false);
        if (contractToEmit?.id) {
          setExpandedRows(prev => ({ ...prev, [contractToEmit.id]: true }));
        }
        fetchAllData();
      } else {
        const err = await res.json();
        alert('Erro ao emitir fatura: ' + (err.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao emitir fatura.');
    } finally {
      setIsSavingInvoice(false);
    }
  };

  // Filtros
  const filteredContracts = contracts.filter(c => {
    if (statusFilter !== 'Todos' && c.status !== statusFilter) return false;
    if (clientSearch && !c.client_name?.toLowerCase().includes(clientSearch.toLowerCase())) return false;
    if (equipSearch) {
      const parsedEqs = typeof c.equipments === 'string' ? JSON.parse(c.equipments || '[]') : c.equipments || [];
      const matchEq = parsedEqs.some(eq => (eq.name || '').toLowerCase().includes(equipSearch.toLowerCase()));
      if (!matchEq) return false;
    }
    if (serieSearch) {
      const parsedEqs = typeof c.equipments === 'string' ? JSON.parse(c.equipments || '[]') : c.equipments || [];
      const matchSerie = parsedEqs.some(eq => (eq.serial_number || '').toLowerCase().includes(serieSearch.toLowerCase()));
      if (!matchSerie) return false;
    }
    return true;
  });

  const totalRevenue = filteredContracts.reduce((acc, c) => acc + parseFloat(c.total_rental_value || 0), 0);
  const totalCost = filteredContracts.reduce((acc, c) => acc + parseFloat(c.cost_value || 0), 0);
  const totalTax = filteredContracts.reduce((acc, c) => acc + (parseFloat(c.total_rental_value || 0) * (parseFloat(c.tax_cost_percent || 0) / 100)), 0);
  const totalMarginVal = totalRevenue - totalCost - totalTax;
  const totalMarginPct = totalRevenue > 0 ? (totalMarginVal / totalRevenue) * 100 : 0;

  return (
    <div className="font-sans text-gray-800 max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header Limpo e Moderno */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Gestão de Contratos e Minutas
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gerencie contratos de locação ativos, faturamento recorrente, parcelas e minutas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleManualSendWhatsappAlert}
            disabled={isSendingWhatsapp}
            className="flex items-center px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded-xl transition-all shadow-sm active:scale-95 text-xs disabled:opacity-50"
            title="Dispara alerta diário dos contratos pendentes para o celular do time financeiro"
          >
            {isSendingWhatsapp ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin text-emerald-600" />
            ) : (
              <Send className="w-4 h-4 mr-1.5 text-emerald-600" />
            )}
            Avisar Financeiro WhatsApp
          </button>

          <button 
            onClick={() => setIsDirectModalOpen(true)}
            className="flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow active:scale-95 text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Cadastrar Contrato em Andamento
          </button>

          <button 
            onClick={() => navigate('/contratos/novo')}
            className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow text-xs"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Novo por Proposta
          </button>
        </div>
      </div>

      {/* Cards de Métricas Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receita Mensal Total</p>
            <h3 className="text-xl font-black text-blue-600 mt-1">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custo de Operação</p>
            <h3 className="text-xl font-black text-red-500 mt-1">{formatCurrency(totalCost)}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-xl shadow-sm">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imposto Estimado</p>
            <h3 className="text-xl font-black text-amber-500 mt-1">{formatCurrency(totalTax)}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl shadow-sm">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Margem Bruta Acumulada</p>
            <h3 className={`text-xl font-black mt-1 ${totalMarginVal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(totalMarginVal)} <span className="text-xs font-semibold">({totalMarginPct.toFixed(1)}%)</span>
            </h3>
          </div>
          <div className={`p-3 rounded-xl shadow-sm ${totalMarginVal >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Card com Tabela Organizada */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 font-medium"
            >
              <option value="Todos">Todos</option>
              <option value="Ativo">Ativo</option>
              <option value="Reserva">Reserva</option>
              <option value="Encerrado">Encerrado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar por Cliente</label>
            <input 
              type="text" 
              placeholder="Nome do cliente..." 
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar por Equipamento</label>
            <input 
              type="text" 
              placeholder="Marca, modelo ou tipo..." 
              value={equipSearch}
              onChange={e => setEquipSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar por Nº de Série</label>
            <input 
              type="text" 
              placeholder="Número de série..." 
              value={serieSearch}
              onChange={e => setSerieSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Tabela com Colunas Separadas e Vencimento Dedicado */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-[11px] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-3 w-8 text-center" title="Clique para ver faturas">Faturas</th>
                <th className="px-3 py-3">Código</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-3 py-3">Início</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Parcela</th>
                <th className="px-3 py-3">Pagamento</th>
                <th className="px-3 py-3">Quando Fatura</th>
                <th className="px-4 py-3 bg-red-50/40 text-red-800 border-x border-red-100">Vencimento Fatura</th>
                <th className="px-3 py-3 text-right">Valor Locação</th>
                <th className="px-3 py-3 text-right">Margem Bruta</th>
                <th className="px-3 py-3 text-right">Término Contrato</th>
                <th className="px-3 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="13" className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    Carregando contratos...
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-4 py-12 text-center text-gray-400">
                    Nenhum contrato encontrado.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((ctr) => {
                  const rVal = parseFloat(ctr.total_rental_value || 0);
                  const cVal = parseFloat(ctr.cost_value || 0);
                  const tPct = parseFloat(ctr.tax_cost_percent || 0);
                  const margVal = rVal - cVal - (rVal * tPct / 100);
                  const margPct = rVal > 0 ? (margVal / rVal) * 100 : 0;

                  const ctrInvoices = getContractInvoices(ctr.code);
                  const monthInvoice = getMonthInvoice(ctr);
                  const isPendingInvoice = ctr.status === 'Ativo' && !monthInvoice;

                  return (
                    <React.Fragment key={ctr.id}>
                      <tr className="hover:bg-gray-50/80 transition-colors bg-white text-xs">
                        
                        {/* 1. Setinha Faturas */}
                        <td className="px-3 py-3.5 text-center">
                          <button 
                            onClick={() => toggleRow(ctr.id)} 
                            className={`p-1.5 rounded-lg transition-all ${
                              expandedRows[ctr.id] 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title={expandedRows[ctr.id] ? "Ocultar faturas emitidas" : "Ver faturas emitidas deste contrato"}
                          >
                            {expandedRows[ctr.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>

                        {/* 2. Código */}
                        <td className="px-3 py-3.5 font-bold">
                          <button
                            onClick={() => {
                              setSelectedContractForDetails(ctr);
                              setIsDetailsModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-bold"
                            title="Clique para ver dados do contrato"
                          >
                            {ctr.code}
                          </button>
                        </td>

                        {/* 3. Cliente */}
                        <td className="px-4 py-3.5 font-semibold text-gray-900 uppercase">
                          {ctr.client_name}
                        </td>

                        {/* 4. Início */}
                        <td className="px-3 py-3.5 text-gray-500 whitespace-nowrap">
                          {formatDate(ctr.start_date)}
                        </td>

                        {/* 5. Status Limpo */}
                        <td className="px-3 py-3.5">
                          <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${
                            ctr.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                            ctr.status === 'Reserva' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ctr.status}
                          </span>
                        </td>

                        {/* 6. Parcela */}
                        <td className="px-3 py-3.5 font-bold text-gray-700 whitespace-nowrap">
                          {ctr.current_installment || 1} / {ctr.total_installments || 12}
                        </td>

                        {/* 7. Forma de Pagamento */}
                        <td className="px-3 py-3.5 text-gray-600 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-medium">
                            {ctr.payment_method || 'Boleto'}
                          </span>
                        </td>

                        {/* 8. Quando Fatura */}
                        <td className="px-3 py-3.5 text-gray-700 whitespace-nowrap font-medium">
                          Todo dia {ctr.billing_day || '-'}
                        </td>

                        {/* 9. VENCIMENTO DA FATURA (COLUNA SEPARADA COM ALERTA EM VERMELHO!) */}
                        <td className="px-4 py-3.5 bg-red-50/20 border-x border-red-100 whitespace-nowrap">
                          {isPendingInvoice ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-100 text-red-700 border border-red-300 shadow-sm animate-pulse">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                                Pendente (Vence dia {ctr.due_day || 15})
                              </span>
                              <button
                                onClick={() => handleOpenEmitModal(ctr)}
                                className="text-[10px] font-bold text-red-600 hover:text-red-800 underline ml-1"
                              >
                                + Emitir Fatura
                              </button>
                            </div>
                          ) : monthInvoice ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                                monthInvoice.status === 'Paga' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {formatDate(monthInvoice.due_date)} ({monthInvoice.status})
                              </span>
                              <span className="text-[10px] text-gray-400 ml-1">#FAT-{monthInvoice.id}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 font-medium">Dia {ctr.due_day || '-'}</span>
                          )}
                        </td>

                        {/* 10. Valor Locação */}
                        <td className="px-3 py-3.5 text-right text-blue-600 font-bold whitespace-nowrap">
                          {formatCurrency(ctr.total_rental_value)}
                        </td>

                        {/* 11. Margem Bruta */}
                        <td className={`px-3 py-3.5 text-right font-bold whitespace-nowrap ${margVal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(margVal)} <span className="text-[10px] font-semibold">({margPct.toFixed(0)}%)</span>
                        </td>

                        {/* 12. Término Contrato */}
                        <td className="px-3 py-3.5 text-right font-medium text-gray-700 whitespace-nowrap">
                          {formatDate(ctr.expiry_date)}
                        </td>

                        {/* 13. Ações */}
                        <td className="px-3 py-3.5 text-center">
                          <div className="flex justify-center items-center space-x-1">
                            {/* Ver Dados do Contrato (Modal) */}
                            <button
                              onClick={() => {
                                setSelectedContractForDetails(ctr);
                                setIsDetailsModalOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver Detalhes do Contrato (Equipamentos & Margem)"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Imprimir Minuta */}
                            <button 
                              onClick={() => handlePrintContract(ctr)}
                              disabled={isGeneratingPDF === ctr.id}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                              title="Imprimir Minuta do Contrato"
                            >
                              {isGeneratingPDF === ctr.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              ) : (
                                <Printer className="w-4 h-4" />
                              )}
                            </button>

                            {/* Ativar / Encerrar */}
                            {ctr.status === 'Reserva' && (
                              <button 
                                onClick={() => handleUpdateStatus(ctr.id, 'Ativo')}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" 
                                title="Ativar Contrato"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {ctr.status === 'Ativo' && (
                              <button 
                                onClick={() => handleUpdateStatus(ctr.id, 'Encerrado')}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                title="Encerrar Contrato"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}

                            {/* Editar */}
                            <button 
                              onClick={() => navigate(`/contratos/editar/${ctr.id}`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                              title="Editar Contrato"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Excluir */}
                            <button 
                              onClick={() => handleDeleteContract(ctr.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                              title="Excluir Contrato"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* LINHA EXPANDIDA: FATURAS EMITIDAS */}
                      {expandedRows[ctr.id] && (
                        <tr className="bg-slate-50/70 border-b border-gray-200">
                          <td colSpan="13" className="px-6 py-5">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                              
                              {/* Header da Expansão */}
                              <div className="px-5 py-3.5 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shadow-sm">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                      Faturas Emitidas — {ctr.code}
                                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                        {ctr.client_name}
                                      </span>
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Faturamento: todo dia {ctr.billing_day || '-'} • Vencimento: dia {ctr.due_day || '-'} • Forma: {ctr.payment_method || 'Boleto'} • Valor: {formatCurrency(ctr.total_rental_value)}
                                      {ctr.total_installments ? ` • Parcela Atual: ${ctr.current_installment || 1}/${ctr.total_installments}` : ''}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenEmitModal(ctr)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 whitespace-nowrap"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Emitir Fatura deste Mês
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedContractForDetails(ctr);
                                      setIsDetailsModalOpen(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Ver Dados do Contrato
                                  </button>
                                </div>
                              </div>

                              {/* Tabela de Faturas Emitidas */}
                              <div className="overflow-x-auto">
                                {ctrInvoices.length === 0 ? (
                                  <div className="py-8 text-center px-4">
                                    <p className="text-sm font-medium text-gray-600">Nenhuma fatura emitida ainda para este contrato.</p>
                                    <p className="text-xs text-gray-400 mt-1">Gere a primeira fatura mensal para iniciar o controle de cobranças e faturamento.</p>
                                    <button
                                      onClick={() => handleOpenEmitModal(ctr)}
                                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Emitir Primeira Fatura
                                    </button>
                                  </div>
                                ) : (
                                  <table className="w-full text-left text-xs text-gray-600">
                                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase font-bold text-[11px]">
                                      <tr>
                                        <th className="px-4 py-3">Código</th>
                                        <th className="px-4 py-3">Parcela / Descrição</th>
                                        <th className="px-4 py-3">Forma Pagto</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                        <th className="px-4 py-3">Vencimento</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Conta Azul</th>
                                        <th className="px-4 py-3 text-center">Ações</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {ctrInvoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                                          <td className="px-4 py-3 font-bold text-gray-900">#FAT-{inv.id}</td>
                                          <td className="px-4 py-3 font-medium text-gray-800">
                                            {inv.installment_number && (
                                              <span className="font-bold text-blue-700 mr-1.5 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                {inv.installment_number}
                                              </span>
                                            )}
                                            {inv.description}
                                          </td>
                                          <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-medium">
                                              {inv.payment_method || ctr.payment_method || 'Boleto'}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-right font-bold text-blue-600">
                                            {formatCurrency(inv.amount)}
                                          </td>
                                          <td className="px-4 py-3 font-medium text-gray-700">
                                            {formatDate(inv.due_date)}
                                          </td>
                                          <td className="px-4 py-3">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                              inv.status === 'Paga' ? 'bg-emerald-100 text-emerald-800' :
                                              inv.status === 'Faturada' ? 'bg-blue-100 text-blue-800' :
                                              inv.status === 'Vencida' ? 'bg-red-100 text-red-800' :
                                              'bg-amber-100 text-amber-800'
                                            }`}>
                                              {inv.status || 'Pendente'}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3">
                                            {inv.conta_azul_sale_id ? (
                                              <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                                                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Sincronizada
                                              </span>
                                            ) : (
                                              <span className="text-gray-400 text-[11px]">Não enviada</span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-center">
                                            <button
                                              onClick={() => navigate('/faturas')}
                                              className="text-blue-600 hover:text-blue-800 font-bold text-[11px] hover:underline"
                                            >
                                              Abrir no Faturas
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CADASTRO DIRETO DE CONTRATO EM ANDAMENTO */}
      {/* ======================================================== */}
      {isDirectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-gray-100 p-6 space-y-5">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Cadastrar Contrato em Andamento
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Cadastre diretamente um contrato ativo para controlar o faturamento recorrente, parcelas e alertas mensais.
                </p>
              </div>
              <button 
                onClick={() => setIsDirectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDirectContract} className="space-y-4">
              
              {/* Bloco 1: Cliente */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <select
                      value={directForm.client_id}
                      onChange={e => {
                        const selId = e.target.value;
                        const cli = dbClients.find(c => String(c.id) === String(selId));
                        setDirectForm(prev => ({
                          ...prev,
                          client_id: selId,
                          client_name: cli ? cli.name : ''
                        }));
                      }}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                    >
                      <option value="">Selecione um cliente cadastrado...</option>
                      {dbClients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Ou digite o nome do cliente..."
                      value={directForm.client_name}
                      onChange={e => setDirectForm(prev => ({ ...prev, client_name: e.target.value, client_id: '' }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2: Equipamento e Série */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Equipamento da Locação
                  </label>
                  <select
                    value={directForm.equipment_id}
                    onChange={e => {
                      const selId = e.target.value;
                      const eq = dbEquipments.find(item => String(item.id) === String(selId));
                      setDirectForm(prev => ({
                        ...prev,
                        equipment_id: selId,
                        equipment_name: eq ? eq.name : prev.equipment_name,
                        serial_number: eq?.serial_number || prev.serial_number
                      }));
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium mb-1.5"
                  >
                    <option value="">Selecione do inventário ou digite abaixo...</option>
                    {dbEquipments.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.name} ({eq.serial_number || 'S/N'})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Descrição manual do equipamento..."
                    value={directForm.equipment_name}
                    onChange={e => setDirectForm(prev => ({ ...prev, equipment_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nº de Série / Patrimônio
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SN-849202"
                    value={directForm.serial_number}
                    onChange={e => setDirectForm(prev => ({ ...prev, serial_number: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Bloco 3: Valor Mensal & Forma de Pagamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Valor Mensal (R$) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      value={directForm.monthly_value}
                      onChange={e => setDirectForm(prev => ({ ...prev, monthly_value: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-blue-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tipo de Pagamento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={directForm.payment_method}
                    onChange={e => setDirectForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-gray-800"
                  >
                    <option value="Boleto">Boleto Bancário</option>
                    <option value="Pix">Pix</option>
                    <option value="Transferência">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              {/* Bloco 4: Controle de Parcelas em Andamento (ex: 9/12) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Controle de Parcelas em Andamento (ex: 9/12)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Parcela Atual em Curso</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 9"
                      value={directForm.current_installment}
                      onChange={e => setDirectForm(prev => ({ ...prev, current_installment: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-blue-700 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Total de Parcelas / Duração</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 12"
                      value={directForm.total_installments}
                      onChange={e => setDirectForm(prev => ({ ...prev, total_installments: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  📌 O contrato será registrado na parcela <strong>{directForm.current_installment || 1}/{directForm.total_installments || 12}</strong>. A partir desse input, o sistema contabiliza as parcelas futuras no faturamento recorrente.
                </p>
              </div>

              {/* Bloco 5: Dias de Cobrança e Prazos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Quando Fatura <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      placeholder="Dia 05"
                      value={directForm.billing_day}
                      onChange={e => setDirectForm(prev => ({ ...prev, billing_day: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">Dia do mês</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Quando Vence <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      placeholder="Dia 15"
                      value={directForm.due_day}
                      onChange={e => setDirectForm(prev => ({ ...prev, due_day: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">Dia do mês</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={directForm.start_date}
                    onChange={e => setDirectForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Término (Validade)
                  </label>
                  <input
                    type="date"
                    value={directForm.expiry_date}
                    onChange={e => setDirectForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Bloco 6: Custos e Impostos (Opcional) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Custo Operacional Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={directForm.cost_value}
                    onChange={e => setDirectForm(prev => ({ ...prev, cost_value: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Imposto Estimado (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="8.0"
                    value={directForm.tax_cost_percent}
                    onChange={e => setDirectForm(prev => ({ ...prev, tax_cost_percent: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDirectModalOpen(false)}
                  className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingDirectContract}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingDirectContract ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cadastrando Contrato...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Salvar e Ativar Contrato
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DETALHES DO CONTRATO (Equipamentos & Financeiro) */}
      {/* ======================================================== */}
      {isDetailsModalOpen && selectedContractForDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto border border-gray-100 p-6 space-y-6">
            
            {/* Header do Modal */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      Contrato {selectedContractForDetails.code}
                    </h2>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      selectedContractForDetails.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                      selectedContractForDetails.status === 'Reserva' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedContractForDetails.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium uppercase mt-0.5">
                    {selectedContractForDetails.client_name}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid 1: Informações Gerais & Regras de Cobrança */}
            <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-gray-400 font-semibold uppercase">Forma de Pagamento</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{selectedContractForDetails.payment_method || 'Boleto'}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase">Controle de Parcelas</p>
                <p className="font-bold text-blue-600 text-sm mt-0.5">
                  {selectedContractForDetails.current_installment || 1} / {selectedContractForDetails.total_installments || 12}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase">Dia Faturamento</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">Todo dia {selectedContractForDetails.billing_day || '-'}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase">Dia Vencimento</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">Todo dia {selectedContractForDetails.due_day || '-'}</p>
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase">Início da Locação</p>
                <p className="font-bold text-gray-900 mt-0.5">{formatDate(selectedContractForDetails.start_date)}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase">Vencimento Contrato</p>
                <p className="font-bold text-red-600 mt-0.5">{formatDate(selectedContractForDetails.expiry_date)}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase">Próximo Reajuste</p>
                <p className="font-bold text-orange-600 mt-0.5">{formatDate(selectedContractForDetails.readjustment_date)}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase">Total Faturas</p>
                <p className="font-bold text-emerald-600 mt-0.5">
                  {getContractInvoices(selectedContractForDetails.code).length} emitidas
                </p>
              </div>
            </div>

            {/* Grid 2: Equipamentos da Locação & Painel Financeiro */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Equipamentos */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Equipamentos da Locação</h4>
                {(() => {
                  const eqs = typeof selectedContractForDetails.equipments === 'string' 
                    ? JSON.parse(selectedContractForDetails.equipments || '[]') 
                    : selectedContractForDetails.equipments || [];

                  if (eqs.length === 0) {
                    return <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl">Nenhum equipamento vinculado.</p>;
                  }

                  return eqs.map((eq, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{eq.name || 'Equipamento'}</p>
                        {eq.serial_number && <p className="text-xs text-gray-500 mt-0.5">Nº Série: {eq.serial_number}</p>}
                        <p className="text-xs text-blue-600 font-semibold mt-1">Preço Locação: {formatCurrency(eq.price)}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Entrega: {formatDate(eq.prev_entrega)} • Retirada: {formatDate(eq.prev_retirada)}
                        </p>
                      </div>
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold">Ativo</span>
                    </div>
                  ));
                })()}
              </div>

              {/* Resumo Financeiro & Margem Bruta */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-2">
                  Painel Financeiro & Margem Bruta
                </h4>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Receita Mensal de Locação:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(selectedContractForDetails.total_rental_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo de Operação (Pago):</span>
                    <span className="font-semibold text-red-500">-{formatCurrency(selectedContractForDetails.cost_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Imposto Estimado ({selectedContractForDetails.tax_cost_percent || 0}%):</span>
                    <span className="font-semibold text-amber-500">
                      -{formatCurrency(parseFloat(selectedContractForDetails.total_rental_value || 0) * (parseFloat(selectedContractForDetails.tax_cost_percent || 0) / 100))}
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-2 font-black text-gray-900 text-base">
                    <span>Margem Bruta Mensal:</span>
                    {(() => {
                      const r = parseFloat(selectedContractForDetails.total_rental_value || 0);
                      const c = parseFloat(selectedContractForDetails.cost_value || 0);
                      const t = parseFloat(selectedContractForDetails.tax_cost_percent || 0);
                      const m = r - c - (r * t / 100);
                      const pct = r > 0 ? (m / r) * 100 : 0;
                      return (
                        <span className={m >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {formatCurrency(m)} <span className="text-xs font-semibold">({pct.toFixed(1)}%)</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  handlePrintContract(selectedContractForDetails);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir Minuta
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-semibold rounded-xl text-xs transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    navigate(`/contratos/editar/${selectedContractForDetails.id}`);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  Editar Contrato Completo
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: EMISSÃO RÁPIDA DE FATURA RECORRENTE */}
      {/* ======================================================== */}
      {isEmitModalOpen && contractToEmit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 p-6 space-y-4">
            
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Emitir Fatura Mensal
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Contrato {contractToEmit.code} — {contractToEmit.client_name}
                </p>
              </div>
              <button 
                onClick={() => setIsEmitModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmitInvoice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição / Competência</label>
                <input
                  type="text"
                  required
                  value={emitForm.description}
                  onChange={e => setEmitForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Número Parcela</label>
                  <input
                    type="text"
                    placeholder="Ex: 09/12"
                    value={emitForm.installment_number}
                    onChange={e => setEmitForm(prev => ({ ...prev, installment_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Forma de Pagamento</label>
                  <select
                    value={emitForm.payment_method}
                    onChange={e => setEmitForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Boleto">Boleto</option>
                    <option value="Pix">Pix</option>
                    <option value="Transferência">Transferência</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Valor da Fatura (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={emitForm.amount}
                    onChange={e => setEmitForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={emitForm.due_date}
                    onChange={e => setEmitForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEmitModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-semibold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingInvoice}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSavingInvoice ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Emitindo...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Emitir Fatura
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
