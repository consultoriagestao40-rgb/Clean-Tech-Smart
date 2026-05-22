import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Loader2, ArrowLeft, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Contratos() {
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [clientSearch, setClientSearch] = useState('');
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
    return true;
  });

  return (
    <div className="font-sans text-gray-800 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie seus contratos de locação</p>
          </div>
        </div>
      </header>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Lista de Contratos</h2>
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
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buscar por Cliente</label>
            <input 
              type="text" 
              placeholder="Nome do cliente..." 
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider"></th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider">Código</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider">Cliente</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider">Data</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider text-right">Valor Locação</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider text-right">Valor Serviços</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                    Nenhum contrato encontrado.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((ctr) => (
                  <tr key={ctr.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-gray-400">&gt;</td>
                    <td className="px-4 py-4 font-bold text-gray-900">{ctr.code}</td>
                    <td className="px-4 py-4 font-medium text-gray-800 uppercase">{ctr.client_name}</td>
                    <td className="px-4 py-4">{formatDate(ctr.start_date)}</td>
                    <td className="px-4 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                        {ctr.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-blue-600 font-medium">{formatCurrency(ctr.total_rental_value)}</td>
                    <td className="px-4 py-4 text-right text-blue-600 font-medium">{formatCurrency(ctr.total_services_value)}</td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => navigate(`/contratos/editar/${ctr.id}`)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="Editar Contrato"
                      >
                        <Edit className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
