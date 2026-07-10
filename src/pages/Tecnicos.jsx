import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

export default function Tecnicos() {
  const [technicians, setTechnicians] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    status: 'Ativo'
  });

  const fetchTechnicians = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-technicians');
      const data = await res.json();
      if (data.success) {
        setTechnicians(data.technicians);
      }
    } catch (err) {
      console.error('Erro ao buscar técnicos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleOpenNew = () => {
    setFormData({
      id: null,
      name: '',
      email: '',
      phone: '',
      status: 'Ativo'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tech) => {
    setFormData({
      id: tech.id,
      name: tech.name,
      email: tech.email || '',
      phone: tech.phone || '',
      status: tech.status || 'Ativo'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('O nome do técnico é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/save-technician', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchTechnicians();
      } else {
        alert('Erro ao salvar técnico.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao salvar técnico.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir este técnico?')) return;
    try {
      const res = await fetch('/api/delete-technician', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchTechnicians();
      } else {
        alert('Erro ao excluir técnico.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de rede ao excluir técnico.');
    }
  };

  const filteredTechnicians = technicians.filter(t => 
    (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = technicians.filter(t => t.status === 'Ativo').length;

  return (
    <div className="font-sans text-gray-800 space-y-6">
      
      {/* Upper Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Total de Técnicos</span>
            <span className="text-2xl font-bold text-gray-900">{technicians.length}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block">Técnicos Ativos</span>
            <span className="text-2xl font-bold text-green-600">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* Header and Quick Add */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cadastro de Técnicos</h1>
          <p className="text-xs text-gray-500 mt-1">Gerencie a lista de técnicos responsáveis pelos atendimentos e chamados de manutenção.</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-sm text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Técnico
        </button>
      </div>

      {/* Search Filter Box */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar técnico por nome, email ou telefone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-gray-50/50" 
          />
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span>Carregando técnicos...</span>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nome do Técnico</th>
                  <th className="px-6 py-4 font-semibold">Telefone</th>
                  <th className="px-6 py-4 font-semibold">E-mail</th>
                  <th className="px-6 py-4 font-semibold w-32">Status</th>
                  <th className="px-6 py-4 font-semibold w-28 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTechnicians.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                      Nenhum técnico cadastrado.
                    </td>
                  </tr>
                ) : (
                  filteredTechnicians.map((tech) => (
                    <tr key={tech.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {tech.name}
                      </td>
                      <td className="px-6 py-4">
                        {tech.phone ? (
                          <span className="flex items-center">
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            {tech.phone}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic">Sem telefone</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tech.email ? (
                          <span className="flex items-center">
                            <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            {tech.email}
                          </span>
                        ) : (
                          <span className="text-gray-300 italic">Sem e-mail</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          tech.status === 'Ativo' 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : 'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {tech.status === 'Ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-1">
                          <button 
                            onClick={() => handleOpenEdit(tech)} 
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar Técnico"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(tech.id)} 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir Técnico"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {formData.id ? 'Editar Técnico' : 'Cadastrar Novo Técnico'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nome Completo *</label>
                <input 
                  required
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                  placeholder="Ex: Cristiano da Silva"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Telefone</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                  placeholder="Ex: (31) 98888-8888"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">E-mail</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                  placeholder="Ex: tecnico@cleantech.com.br"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Status</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({ ...formData, status: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center text-sm shadow-sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSaving ? 'Salvando...' : 'Salvar Técnico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
