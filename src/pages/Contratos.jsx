import React, { useState, useEffect } from 'react';
import { Plus, Loader2, ArrowLeft, Edit, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Contratos() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});
  
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

  return (
    <div className="font-sans text-gray-800 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista de Contratos</h1>
          <p className="text-sm text-gray-500">{filteredContracts.length} contrato(s) registrado(s)</p>
        </div>
        <button 
          onClick={() => navigate('/contratos/novo')}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm mt-4 md:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Contrato
        </button>
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
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider text-right">Valor Serviços</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider text-right">Valor Venal</th>
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
                filteredContracts.map((ctr) => (
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
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                          {ctr.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-blue-600 font-bold">{formatCurrency(ctr.total_rental_value)}</td>
                      <td className="px-4 py-4 text-right text-blue-400 font-medium">{formatCurrency(ctr.total_services_value)}</td>
                      <td className="px-4 py-4 text-right text-gray-500 font-medium">{formatCurrency(ctr.total_venal_value)}</td>
                      <td className="px-4 py-4 text-center">
                        <button 
                          onClick={() => navigate(`/contratos/editar/${ctr.id}`)}
                          className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors inline-flex" 
                          title="Editar Contrato"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Linha Expandida */}
                    {expandedRows[ctr.id] && (
                      <tr className="bg-gray-50/50">
                        <td colSpan="9" className="px-8 py-6 border-b border-gray-100">
                          <h4 className="text-sm font-bold text-gray-700 mb-3">Equipamentos do Contrato:</h4>
                          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                              <p className="font-bold text-gray-900 text-sm">A Gás (GLP)</p>
                              <p className="text-xs text-gray-500 mt-1">Nº Série: 0000012522256 • Tipo: empilhadeira</p>
                              <p className="text-sm text-blue-600 font-semibold mt-2">Locação: {formatCurrency(ctr.total_rental_value)}</p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <span className="text-blue-500 text-xs font-medium mb-2">Anual</span>
                              <p className="text-xs text-gray-500">Prev. Entrega: {formatDate(ctr.start_date)}</p>
                              <p className="text-xs text-gray-500">Prev. Retirada: -</p>
                            </div>
                            <div>
                               <button 
                                onClick={() => navigate(`/contratos/editar/${ctr.id}`)}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                               >
                                 <Edit className="w-4 h-4 mr-2 text-gray-500" />
                                 Editar
                               </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
