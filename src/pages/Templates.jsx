import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, ArrowLeft, Star, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    clauses: []
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-templates');
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ id: null, name: '', clauses: [] });
        fetchTemplates();
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
    if (!confirm('Tem certeza que deseja excluir este template?')) return;
    try {
      const response = await fetch('/api/delete-template', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) fetchTemplates();
    } catch (error) {
      alert('Erro de rede ao excluir');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const response = await fetch('/api/set-default-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) fetchTemplates();
    } catch (error) {
      alert('Erro de rede ao definir padrão');
    }
  };

  const openNewTemplate = () => {
    setFormData({ id: null, name: '', clauses: [{ title: '', content: '' }] });
    setIsModalOpen(true);
  };

  const openEditTemplate = (tpl) => {
    // Garantir que clauses seja array
    const parsedClauses = typeof tpl.clauses === 'string' ? JSON.parse(tpl.clauses) : tpl.clauses;
    setFormData({ 
      id: tpl.id, 
      name: tpl.name, 
      clauses: parsedClauses && parsedClauses.length > 0 ? parsedClauses : [{ title: '', content: '' }] 
    });
    setIsModalOpen(true);
  };

  // Funções para manipular cláusulas
  const addClause = () => {
    setFormData(prev => ({
      ...prev,
      clauses: [...prev.clauses, { title: '', content: '' }]
    }));
  };

  const updateClause = (index, field, value) => {
    const newClauses = [...formData.clauses];
    newClauses[index][field] = value;
    setFormData(prev => ({ ...prev, clauses: newClauses }));
  };

  const removeClause = (index) => {
    const newClauses = formData.clauses.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, clauses: newClauses }));
  };

  return (
    <div className="font-sans text-gray-800 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Templates de Contrato</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie os templates de impressão de contratos</p>
          </div>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button 
            onClick={openNewTemplate}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </button>
        </div>
      </header>

      {/* Grid de Templates */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum template cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(tpl => (
            <div 
              key={tpl.id} 
              className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between transition-all hover:shadow-md ${tpl.is_default ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'}`}
            >
              <div>
                <h3 className="font-bold text-gray-900 flex items-start justify-between">
                  <span className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-gray-500" />
                    {tpl.name}
                  </span>
                  {tpl.is_default && <Star className="w-5 h-5 text-blue-500 fill-blue-500 flex-shrink-0 ml-2" />}
                </h3>
              </div>
              <div className="flex space-x-2 mt-6">
                <button 
                  onClick={() => openEditTemplate(tpl)}
                  className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                  title="Editar Template"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleSetDefault(tpl.id)}
                  className={`p-2 border rounded-lg transition-colors ${tpl.is_default ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-gray-400 bg-white hover:bg-gray-50 border-gray-200'}`}
                  title="Marcar como Padrão"
                >
                  <Star className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(tpl.id)}
                  className="p-2 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors"
                  title="Excluir Template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição (Complexo) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center p-4 z-50 overflow-y-auto pt-10 pb-10">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col animate-in fade-in zoom-in-95 duration-200 my-auto max-h-full">
            <div className="p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">{formData.id ? 'Editar Template' : 'Novo Template'}</h2>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Template *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-gray-900 bg-blue-50/30" 
                  placeholder="Ex: Template Padrão - Locação de Equipamentos" 
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Cláusulas do Contrato</h3>
                  <button 
                    type="button" 
                    onClick={addClause}
                    className="flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Adicionar Cláusula
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.clauses.map((clause, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative group">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-gray-700">Cláusula {index + 1}</span>
                        <button 
                          type="button" 
                          onClick={() => removeClause(index)}
                          className="text-red-400 hover:text-red-600 p-1 transition-colors"
                          title="Remover Cláusula"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          placeholder="Título da Cláusula (Ex: CLÁUSULA 01 - OBJETO DE LOCAÇÃO)" 
                          value={clause.title}
                          onChange={e => updateClause(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        />
                        <textarea 
                          placeholder="Texto da cláusula..." 
                          value={clause.content}
                          onChange={e => updateClause(index, 'content', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px] resize-y bg-white"
                        ></textarea>
                      </div>
                    </div>
                  ))}
                  
                  {formData.clauses.length === 0 && (
                    <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
                      Nenhuma cláusula adicionada. Clique no botão acima para adicionar.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 shrink-0 flex justify-end space-x-3 bg-white rounded-b-xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={handleSave} disabled={isSaving || !formData.name} className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isSaving ? 'Salvando...' : 'Salvar Template'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
