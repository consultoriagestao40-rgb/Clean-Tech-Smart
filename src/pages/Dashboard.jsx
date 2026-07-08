import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Loader2, Filter, Eye, Check, X, FileDown } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function Dashboard() {
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    async function fetchBudgets() {
      try {
        const res = await fetch('/api/get-budgets');
        const data = await res.json();
        if (data.budgets) {
          setBudgets(data.budgets);
        }
      } catch (error) {
        console.error('Erro ao buscar orçamentos:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBudgets();
  }, []);

  const filteredBudgets = budgets.filter(b => 
    b.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(b.id).includes(searchTerm)
  );

  const handleViewDetails = async (id) => {
    setIsModalOpen(true);
    setIsDetailLoading(true);
    setSelectedBudget(null);
    try {
      const res = await fetch(`/api/get-budget-details?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedBudget(data);
      } else {
        alert('Erro ao carregar detalhes: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao carregar detalhes.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/update-budget-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Orçamento ${newStatus === 'Aprovado' ? 'aprovado' : 'rejeitado'} com sucesso!`);
        
        // Refresh local budgets list
        setBudgets(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
        
        // Update selected budget status in modal
        if (selectedBudget && selectedBudget.budget.id === id) {
          setSelectedBudget(prev => ({
            ...prev,
            budget: { ...prev.budget, status: newStatus }
          }));
        }
      } else {
        alert('Erro ao atualizar status: ' + data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao atualizar status.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGeneratePDF = (budgetData) => {
    const { budget, laborItems, partsItems } = budgetData;
    
    const element = document.createElement('div');
    element.className = 'p-8 bg-white font-sans text-gray-800 text-sm';
    element.style.width = '800px';
    
    element.innerHTML = `
      <div style="border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0;">Clean Tech Smart</h1>
            <p style="font-size: 12px; color: #4b5563; margin: 2px 0 0 0;">Soluções Inteligentes em Higiene e Limpeza</p>
          </div>
          <div style="text-align: right;">
            <h2 style="font-size: 18px; font-weight: bold; color: #2563eb; margin: 0;">PROPOSTA TÉCNICA / ORÇAMENTO</h2>
            <p style="font-size: 14px; font-weight: bold; color: #4b5563; margin: 5px 0 0 0;">Nº: #${budget.id}</p>
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <h3 style="font-size: 13px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; color: #1f2937; margin-bottom: 8px;">DADOS DO CLIENTE</h3>
          <p style="margin: 4px 0;"><strong>Cliente:</strong> ${budget.client_name || budget.client_id || 'Não informado'}</p>
          <p style="margin: 4px 0;"><strong>Documento:</strong> ${budget.client_document || '-'}</p>
          <p style="margin: 4px 0;"><strong>Endereço:</strong> ${budget.client_address || '-'}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="font-size: 13px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; color: #1f2937; margin-bottom: 8px;">DETALHES DA PROPOSTA</h3>
          <p style="margin: 4px 0;"><strong>Solicitante:</strong> ${budget.contact_name || '-'}</p>
          <p style="margin: 4px 0;"><strong>Contato:</strong> ${budget.contact_info || '-'}</p>
          <p style="margin: 4px 0;"><strong>Emissão:</strong> ${new Date(budget.created_at).toLocaleDateString('pt-BR')}</p>
          <p style="margin: 4px 0;"><strong>Tipo de Serviço:</strong> <span style="text-transform: capitalize;">${budget.service_type}</span></p>
        </div>
      </div>

      <h3 style="font-size: 13px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 25px; color: #1f2937;">MÃO DE OBRA</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6; text-align: left;">
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Descrição do Serviço</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; width: 100px; text-align: center;">Horas</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; width: 120px; text-align: right;">Valor Unitário</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; width: 120px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${laborItems.length === 0 ? '<tr><td colspan="4" style="padding: 8px; border: 1px solid #e5e7eb; text-align: center; color: #9ca3af;">Nenhuma hora técnica cobrada.</td></tr>' : 
            laborItems.map(item => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${item.description}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${Number(item.hours)}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">R$ ${Number(item.unit_price).toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold;">R$ ${(Number(item.hours) * Number(item.unit_price)).toFixed(2)}</td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>

      <h3 style="font-size: 13px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 25px; color: #1f2937;">PEÇAS E INSUMOS</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6; text-align: left;">
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Descrição da Peça</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; width: 100px; text-align: center;">Qtd.</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; width: 120px; text-align: right;">Valor Unitário</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; width: 120px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${partsItems.length === 0 ? '<tr><td colspan="4" style="padding: 8px; border: 1px solid #e5e7eb; text-align: center; color: #9ca3af;">Nenhuma peça incluída.</td></tr>' : 
            partsItems.map(item => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${item.part_name}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">R$ ${Number(item.unit_price).toFixed(2)}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold;">R$ ${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>

      <h3 style="font-size: 13px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-top: 25px; color: #1f2937;">DESLOCAMENTO / LOGÍSTICA</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6; text-align: left;">
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; text-align: center;">KM Inicial</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; text-align: center;">KM Final</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; text-align: center;">Distância</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; text-align: right;">Valor por KM</th>
            <th style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; text-align: right; width: 120px;">Total Deslocamento</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${budget.initial_km}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${budget.final_km}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${Math.max(0, budget.final_km - budget.initial_km)} km</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">R$ ${Number(budget.price_per_km).toFixed(2)}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold;">R$ ${Number(budget.total_logistics).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      ${budget.notes ? `
        <div style="margin-top: 25px; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
          <h4 style="font-weight: bold; margin: 0 0 5px 0; color: #374151; font-size: 12px;">Observações:</h4>
          <p style="margin: 0; color: #4b5563; font-style: italic; font-size: 11px;">${budget.notes}</p>
        </div>
      ` : ''}

      <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
        <div style="width: 300px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: #4b5563;">Mão de Obra:</span>
            <span style="font-weight: bold;">R$ ${Number(budget.total_labor).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span style="color: #4b5563;">Peças:</span>
            <span style="font-weight: bold;">R$ ${Number(budget.total_parts).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #bfdbfe;">
            <span style="color: #4b5563;">Deslocamento:</span>
            <span style="font-weight: bold;">R$ ${Number(budget.total_logistics).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; color: #1e3a8a;">
            <span>VALOR TOTAL:</span>
            <span>R$ ${Number(budget.grand_total).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;
    
    const opt = {
      margin:       10,
      filename:     `orcamento_${budget.id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(element).set(opt).save();
  };

  return (
    <div className="font-sans text-gray-800 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-1">Acompanhe todos os orçamentos de assistência técnica</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Link to="/servicos" className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Orçamento
          </Link>
        </div>
      </header>

      {/* Stats/Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-blue-50 p-3 rounded-lg mr-4">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Orçamentos</p>
            <p className="text-2xl font-bold text-gray-900">{budgets.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="bg-green-50 p-3 rounded-lg mr-4">
            <DollarSignIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Valor Total (Todos)</p>
            <p className="text-2xl font-bold text-gray-900">
              R$ {budgets.reduce((acc, curr) => acc + Number(curr.grand_total || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por ID, Cliente ou Contato..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium rounded-lg border border-gray-200 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">ID</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Data</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Cliente / Contato</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Tipo de Serviço</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Valor Total</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    <p>Carregando orçamentos...</p>
                  </td>
                </tr>
              ) : filteredBudgets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <p>Nenhum orçamento encontrado.</p>
                  </td>
                </tr>
              ) : (
                filteredBudgets.map((budget) => (
                  <tr key={budget.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">#{budget.id}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{budget.client_name || budget.client_id || 'Não informado'}</p>
                      <p className="text-xs text-gray-500">{budget.contact_name}</p>
                    </td>
                    <td className="px-6 py-4 capitalize">{budget.service_type}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      R$ {Number(budget.grand_total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        budget.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                        budget.status === 'Rejeitado' ? 'bg-red-100 text-red-800' :
                        budget.status === 'Rascunho' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {budget.status || 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleViewDetails(budget.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detalhes do Orçamento #{selectedBudget?.budget?.id}</h2>
                <p className="text-xs text-gray-500 mt-1">Criado em {selectedBudget?.budget && new Date(selectedBudget.budget.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-250px)] space-y-6">
              {isDetailLoading ? (
                <div className="py-20 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                  <p>Carregando informações...</p>
                </div>
              ) : selectedBudget ? (
                <>
                  {/* Grid Infos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dados do Cliente</h3>
                      <p className="font-semibold text-gray-800">{selectedBudget.budget.client_name || selectedBudget.budget.client_id || 'Não informado'}</p>
                      <p className="text-sm text-gray-600 mt-1"><strong>CNPJ/CPF:</strong> {selectedBudget.budget.client_document || '-'}</p>
                      <p className="text-sm text-gray-600 mt-1"><strong>Endereço:</strong> {selectedBudget.budget.client_address || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contato & Serviço</h3>
                      <p className="text-sm text-gray-800"><strong>Solicitante:</strong> {selectedBudget.budget.contact_name || '-'}</p>
                      <p className="text-sm text-gray-800 mt-1"><strong>Contato:</strong> {selectedBudget.budget.contact_info || '-'}</p>
                      <p className="text-sm text-gray-800 mt-1"><strong>Tipo de Serviço:</strong> <span className="capitalize">{selectedBudget.budget.service_type}</span></p>
                      <p className="text-sm text-gray-800 mt-1"><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                          selectedBudget.budget.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                          selectedBudget.budget.status === 'Rejeitado' ? 'bg-red-100 text-red-800' :
                          selectedBudget.budget.status === 'Rascunho' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedBudget.budget.status || 'Pendente'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Mão de Obra */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-1">Mão de Obra</h3>
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Descrição</th>
                          <th className="px-4 py-2 font-semibold text-center w-24">Horas</th>
                          <th className="px-4 py-2 font-semibold text-right w-32">Valor Unitário</th>
                          <th className="px-4 py-2 font-semibold text-right w-32">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBudget.laborItems.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-4 text-center text-gray-400">Nenhuma hora técnica cobrada.</td>
                          </tr>
                        ) : (
                          selectedBudget.laborItems.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="px-4 py-2">{item.description}</td>
                              <td className="px-4 py-2 text-center">{Number(item.hours)}</td>
                              <td className="px-4 py-2 text-right">R$ {Number(item.unit_price).toFixed(2)}</td>
                              <td className="px-4 py-2 text-right font-medium text-gray-800">R$ {(item.hours * item.unit_price).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Peças e Insumos */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-1">Peças e Insumos</h3>
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Peça / Insumo</th>
                          <th className="px-4 py-2 font-semibold text-center w-24">Quantidade</th>
                          <th className="px-4 py-2 font-semibold text-right w-32">Valor Unitário</th>
                          <th className="px-4 py-2 font-semibold text-right w-32">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBudget.partsItems.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-4 text-center text-gray-400">Nenhuma peça cobrada.</td>
                          </tr>
                        ) : (
                          selectedBudget.partsItems.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="px-4 py-2">{item.part_name}</td>
                              <td className="px-4 py-2 text-center">{item.quantity}</td>
                              <td className="px-4 py-2 text-right">R$ {Number(item.unit_price).toFixed(2)}</td>
                              <td className="px-4 py-2 text-right font-medium text-gray-800">R$ {(item.quantity * item.unit_price).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Deslocamento & Detalhes Finais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-1">Deslocamento / Logística</h3>
                        <div className="text-sm space-y-1.5 text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p><strong>KM Inicial / Final:</strong> {selectedBudget.budget.initial_km} / {selectedBudget.budget.final_km}</p>
                          <p><strong>Total de KM Rodados:</strong> {Math.max(0, selectedBudget.budget.final_km - selectedBudget.budget.initial_km)} km</p>
                          <p><strong>Valor por KM:</strong> R$ {Number(selectedBudget.budget.price_per_km).toFixed(2)}</p>
                          <p className="font-semibold text-blue-600 pt-1"><strong>Subtotal Logística:</strong> R$ {Number(selectedBudget.budget.total_logistics).toFixed(2)}</p>
                        </div>
                      </div>
                      {selectedBudget.budget.notes && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 mb-2 border-b pb-1">Observações Internas</h3>
                          <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-600 italic">
                            {selectedBudget.budget.notes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100/50 flex flex-col justify-between">
                      <div>
                        <h3 className="text-md font-semibold text-gray-800 mb-4">Resumo Financeiro</h3>
                        <div className="space-y-2 text-sm text-gray-600 mb-6">
                          <div className="flex justify-between">
                            <span>Subtotal Mão de Obra:</span>
                            <span className="font-medium text-gray-800">R$ {Number(selectedBudget.budget.total_labor).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Subtotal Peças:</span>
                            <span className="font-medium text-gray-800">R$ {Number(selectedBudget.budget.total_parts).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pb-3 border-b border-blue-100">
                            <span>Subtotal Logística:</span>
                            <span className="font-medium text-gray-800">R$ {Number(selectedBudget.budget.total_logistics).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-600 p-4 rounded-lg text-white">
                        <span className="block text-xs font-semibold uppercase tracking-wider opacity-90">Valor Total do Orçamento</span>
                        <span className="block text-3xl font-bold mt-1">R$ {Number(selectedBudget.budget.grand_total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center text-gray-400">
                  <p>Orçamento não pôde ser carregado.</p>
                </div>
              )}
            </div>

            {/* Footer / Ações */}
            <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50">
              <div>
                {selectedBudget && (selectedBudget.budget.status === 'Pendente' || selectedBudget.budget.status === 'Rascunho' || !selectedBudget.budget.status) && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedBudget.budget.id, 'Aprovado')}
                      disabled={isActionLoading}
                      className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Aprovar Orçamento
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedBudget.budget.id, 'Rejeitado')}
                      disabled={isActionLoading}
                      className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeitar Orçamento
                    </button>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                {selectedBudget && (
                  <button
                    onClick={() => handleGeneratePDF(selectedBudget)}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Gerar PDF
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-medium rounded-lg text-sm transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DollarSignIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}
