import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Modalidades() {
  const [modalities, setModalities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', days_count: '' });

  useEffect(() => {
    fetchModalities();
  }, []);

  async function fetchModalities() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-modalities');
      const data = await res.json();
      if (data.modalities) {
        setModalities(data.modalities);
      }
    } catch (error) {
      console.error('Erro ao buscar modalidades:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-modality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          name: formData.name,
          days_count: parseInt(formData.days_count, 10)
        })
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ id: null, name: '', days_count: '' });
        fetchModalities();
      } else {
        const errorData = await response.json();
        alert('Erro ao salvar: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta modalidade?')) return;
    
    try {
      const response = await fetch('/api/delete-modality', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        fetchModalities();
      } else {
        alert('Erro ao excluir modalidade');
      }
    } catch (error) {
      alert('Erro de rede ao excluir');
    }
  };

  const openNewModality = () => {
    setFormData({ id: null, name: '', days_count: '' });
    setIsModalOpen(true);
  };

  const openEditModality = (mod) => {
    setFormData({ id: mod.id, name: mod.name, days_count: mod.days_count });
    setIsModalOpen(true);
  };

  const getBillingCycles = (days) => {
    const value = 30 / days;
    if (value >= 1) {
      return Math.round(value) + 'x ao mês';
    } else {
      return value.toFixed(2) + 'x ao mês';
    }
  };

  return (
    <div className="font-sans text-gray-800 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modalidades de Locação</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie as modalidades de acordo com seu negócio</p>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <button 
            onClick={openNewModality}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Modalidade
          </button>
        </div>
      </header>

      {/* Card da Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900">Modalidades Cadastradas</h2>
          <p className="text-sm text-gray-500">{modalities.length} modalidade(s) cadastrada(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-white border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Dias de Locação</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Ciclos de Faturamento/Mês</th>
                <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                  </td>
                </tr>
              ) : modalities.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-gray-400">
                    Nenhuma modalidade cadastrada.
                  </td>
                </tr>
              ) : (
                modalities.map((mod) => (
                  <tr key={mod.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">{mod.name}</td>
                    <td className="px-4 py-4">{mod.days_count} {mod.days_count === 1 ? 'dia' : 'dias'}</td>
                    <td className="px-4 py-4 text-gray-600 font-medium">{getBillingCycles(mod.days_count)}</td>
                    <td className="px-4 py-4 text-right flex justify-end space-x-2">
                      <button 
                        onClick={() => openEditModality(mod)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" 
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(mod.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" 
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{formData.id ? 'Editar Modalidade' : 'Nova Modalidade'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  placeholder="Ex: Mensal" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dias de Locação *</label>
                <input 
                  required 
                  type="number" 
                  min="1"
                  value={formData.days_count} 
                  onChange={e => setFormData({...formData, days_count: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                  placeholder="Ex: 30" 
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
