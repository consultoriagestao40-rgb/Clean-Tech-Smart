import React, { useState, useEffect } from 'react';
import { Plus, Loader2, ArrowLeft, Edit, ChevronDown, ChevronRight, Package, Printer, Play, Square, CheckCircle, Ban, Trash2, DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Contratos() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(null);
  
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [clientSearch, setClientSearch] = useState('');
  const [equipSearch, setEquipSearch] = useState('');
  const [serieSearch, setSerieSearch] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchContracts();
  }, []);

  async function fetchContracts() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-contracts');
      const data = await res.json();
      if (data.contracts) {
        setContracts(data.contracts);
      }
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrintContract = async (ctr) => {
    setIsGeneratingPDF(ctr.id);
    const companyLogo = localStorage.getItem('app_company_logo') || '';
    const companyName = localStorage.getItem('app_company_name') || 'Clean Tech Pro';
    const companyCnpj = localStorage.getItem('app_company_cnpj') || '00.000.000/0001-00';
    const companyAddress = localStorage.getItem('app_company_address') || 'Curitiba - PR';
    const companyPhone = localStorage.getItem('app_company_phone') || '41984042835';
    try {
      // 1. Fetch default template
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

      // Fetch client list
      const cliRes = await fetch('/api/get-clients');
      const cliData = await cliRes.json();
      const client = cliData.clients?.find(c => String(c.id) === String(ctr.client_id)) || {};

      // Get modalities and equipments to show details
      const eqRes = await fetch('/api/get-equipments');
      const eqData = await eqRes.json();
      const dbEquipments = eqData.equipments || [];

      const modRes = await fetch('/api/get-modalities');
      const modData = await modRes.json();
      const dbModalities = modData.modalities || [];

      // 2. Build the HTML clauses
      const clauses = typeof defaultTemplate.clauses === 'string' ? JSON.parse(defaultTemplate.clauses) : defaultTemplate.clauses;
      
      const clausesHtml = clauses.map(clause => {
        let content = clause.content || '';
        // Substitutions
        content = content.replace(/{{CLIENT_NAME}}/g, ctr.client_name);
        content = content.replace(/{{CONTRACT_CODE}}/g, ctr.code);
        content = content.replace(/{{START_DATE}}/g, formatDate(ctr.start_date));
        content = content.replace(/{{TOTAL_VALUE}}/g, formatCurrency(parseFloat(ctr.total_rental_value) + parseFloat(ctr.total_services_value)));
        
        return `
          <p style="font-weight: bold; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase;">${clause.title}:</p>
          <p style="margin-top: 0; margin-bottom: 10px;">${content.replace(/\n/g, '<br/>')}</p>
        `;
      }).join('');

      // Equipments table HTML
      const parsedEquipments = typeof ctr.equipments === 'string' ? JSON.parse(ctr.equipments) : ctr.equipments || [];
      const equipmentsHtml = parsedEquipments.map(eq => {
         const foundEq = dbEquipments.find(e => String(e.id) === String(eq.equipment_id)) || {};
         const foundMod = dbModalities.find(m => String(m.id) === String(eq.modality_id)) || {};
         return `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 5px;">${foundEq.name || 'Desconhecido'}</td>
            <td style="padding: 8px 5px; text-align: right;">${formatCurrency(foundEq.list_price || 0)}</td>
            <td style="padding: 8px 5px;">${foundEq.serial_number || '-'}</td>
            <td style="padding: 8px 5px;">${foundMod.name || '-'}</td>
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
      <strong>${ctr.client_name.toUpperCase()}</strong><br/>
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
        fetchContracts();
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
        fetchContracts();
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
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const filteredContracts = contracts.filter(c => {
    if (statusFilter !== 'Todos' && c.status !== statusFilter) return false;
    if (clientSearch && !c.client_name?.toLowerCase().includes(clientSearch.toLowerCase())) return false;
    // Omitindo filtro complexo de equipamentos no frontend para o MVP
    return true;
  });

  const totalRevenue = filteredContracts.reduce((acc, c) => acc + parseFloat(c.total_rental_value || 0), 0);
  const totalCost = filteredContracts.reduce((acc, c) => acc + parseFloat(c.cost_value || 0), 0);
  const totalTax = filteredContracts.reduce((acc, c) => acc + (parseFloat(c.total_rental_value || 0) * (parseFloat(c.tax_cost_percent || 0) / 100)), 0);
  const totalMarginVal = totalRevenue - totalCost - totalTax;
  const totalMarginPct = totalRevenue > 0 ? (totalMarginVal / totalRevenue) * 100 : 0;

  return (
    <div className="font-sans text-gray-800 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Contratos e Minutas</h1>
          <p className="text-sm text-gray-500">Gerencie os contratos de locação ativos, reservas e encerramentos, além de emitir as minutas correspondentes</p>
        </div>
        <button 
          onClick={() => navigate('/contratos/novo')}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm mt-4 md:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
        </button>
      </div>

      {/* Cards de Métricas Consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Receita */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Receita Mensal Total</p>
            <h3 className="text-xl font-black text-blue-600 mt-1">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Custos */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custo de Operação</p>
            <h3 className="text-xl font-black text-red-500 mt-1">{formatCurrency(totalCost)}</h3>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-xl shadow-sm">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Impostos */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Imposto Estimado</p>
            <h3 className="text-xl font-black text-amber-500 mt-1">{formatCurrency(totalTax)}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl shadow-sm">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Margem Bruta */}
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

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
            >
              <option value="Todos">Todos</option>
              <option value="Reserva">Reserva</option>
              <option value="Ativo">Ativo</option>
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar por Equipamento</label>
            <input 
              type="text" 
              placeholder="Marca, modelo ou tipo..." 
              value={equipSearch}
              onChange={e => setEquipSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar por Nº de Série</label>
            <input 
              type="text" 
              placeholder="Número de série..." 
              value={serieSearch}
              onChange={e => setSerieSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider">Código</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider">Cliente</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider">Data</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider text-right">Valor Locação</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider text-right">Margem Bruta</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider text-right">Vencimento</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-gray-400">
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

                  return (
                    <React.Fragment key={ctr.id}>
                      <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors bg-white">
                        <td className="px-4 py-4 text-gray-400 text-center">
                          <button onClick={() => toggleRow(ctr.id)} className="p-1 hover:bg-gray-200 rounded transition-colors">
                            {expandedRows[ctr.id] ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </button>
                        </td>
                        <td className="px-4 py-4 font-bold text-gray-900">{ctr.code}</td>
                        <td className="px-4 py-4 font-medium text-gray-800 uppercase">{ctr.client_name}</td>
                        <td className="px-4 py-4 text-gray-500">{formatDate(ctr.start_date)}</td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            ctr.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                            ctr.status === 'Reserva' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ctr.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-blue-600 font-bold">{formatCurrency(ctr.total_rental_value)}</td>
                        <td className={`px-4 py-4 text-right font-bold ${margVal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(margVal)} <span className="text-xs font-semibold">({margPct.toFixed(0)}%)</span>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-gray-700">{formatDate(ctr.expiry_date)}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center items-center space-x-1">
                          <button 
                            onClick={() => handlePrintContract(ctr)}
                            disabled={isGeneratingPDF === ctr.id}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                            title="Imprimir Contrato (Gerar Minuta)"
                          >
                            {isGeneratingPDF === ctr.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            ) : (
                              <Printer className="w-4 h-4" />
                            )}
                          </button>
                          {ctr.status === 'Reserva' && (
                            <button 
                              onClick={() => handleUpdateStatus(ctr.id, 'Ativo')}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" 
                              title="Ativar Contrato"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {ctr.status === 'Ativo' && (
                            <button 
                              onClick={() => handleUpdateStatus(ctr.id, 'Encerrado')}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                              title="Encerrar Contrato"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => navigate(`/contratos/editar/${ctr.id}`)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                            title="Editar Contrato"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteContract(ctr.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                            title="Excluir Contrato"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Linha Expandida */}
                    {expandedRows[ctr.id] && (
                      <tr className="bg-gray-50/50">
                        <td colSpan="9" className="px-8 py-6 border-b border-gray-100">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Bloco 1: Equipamentos */}
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Equipamentos da Locação</h4>
                              <div className="space-y-3">
                                {(!ctr.equipments || ctr.equipments.length === 0) ? (
                                  <p className="text-sm text-gray-400">Nenhum equipamento vinculado.</p>
                                ) : (
                                  ctr.equipments.map((eq, i) => (
                                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
                                      <div>
                                        <p className="font-bold text-gray-900 text-sm">Preço de Locação: {formatCurrency(eq.price)}</p>
                                        <p className="text-xs text-gray-500 mt-1">Prev. Entrega: {formatDate(eq.prev_entrega)} • Prev. Retirada: {formatDate(eq.prev_retirada)}</p>
                                      </div>
                                      <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-semibold">Ativo</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            
                            {/* Bloco 2: Resumo Financeiro & Margem */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-2">Painel Financeiro & Margem Bruta</h4>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-xs text-gray-400 font-medium">Vencimento do Contrato</p>
                                  <p className="font-semibold text-red-600 mt-0.5">{formatDate(ctr.expiry_date)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400 font-medium">Próximo Reajuste</p>
                                  <p className="font-semibold text-orange-600 mt-0.5">{formatDate(ctr.readjustment_date)}</p>
                                </div>
                              </div>
                              
                              <div className="border-t pt-3 space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                  <span>Receita de Locação:</span>
                                  <span className="font-semibold text-gray-950">{formatCurrency(ctr.total_rental_value)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Custo de Operação (Pago):</span>
                                  <span className="font-semibold text-red-500">-{formatCurrency(ctr.cost_value)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Imposto Estimado ({ctr.tax_cost_percent || 0}%):</span>
                                  <span className="font-semibold text-amber-500">-{formatCurrency(parseFloat(ctr.total_rental_value || 0) * (parseFloat(ctr.tax_cost_percent || 0) / 100))}</span>
                                </div>
                                
                                <div className="flex justify-between border-t pt-2 font-bold text-gray-900">
                                  <span>Margem Bruta Mensal:</span>
                                  <span className={parseFloat(ctr.total_rental_value || 0) - parseFloat(ctr.cost_value || 0) - (parseFloat(ctr.total_rental_value || 0) * (parseFloat(ctr.tax_cost_percent || 0) / 100)) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                    {formatCurrency(parseFloat(ctr.total_rental_value || 0) - parseFloat(ctr.cost_value || 0) - (parseFloat(ctr.total_rental_value || 0) * (parseFloat(ctr.tax_cost_percent || 0) / 100)))} 
                                    <span className="text-xs ml-1 font-semibold">
                                      ({ctr.total_rental_value > 0 ? (((parseFloat(ctr.total_rental_value || 0) - parseFloat(ctr.cost_value || 0) - (parseFloat(ctr.total_rental_value || 0) * (parseFloat(ctr.tax_cost_percent || 0) / 100))) / parseFloat(ctr.total_rental_value)) * 100).toFixed(1) : '0.0'}%)
                                    </span>
                                  </span>
                                </div>
                              </div>
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
    </div>
  );
}
