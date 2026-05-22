import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Loader2, Filter } from 'lucide-react';

export default function Dashboard() {
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    b.client_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(b.id).includes(searchTerm)
  );

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    <p>Carregando orçamentos...</p>
                  </td>
                </tr>
              ) : filteredBudgets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
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
                      <p className="font-medium text-gray-800">{budget.client_id || 'Não informado'}</p>
                      <p className="text-xs text-gray-500">{budget.contact_name}</p>
                    </td>
                    <td className="px-6 py-4 capitalize">{budget.service_type}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      R$ {Number(budget.grand_total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                        Pendente
                      </span>
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

// Pequeno ícone auxiliar local, pois não importamos DollarSign diretamente
function DollarSignIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );
}
