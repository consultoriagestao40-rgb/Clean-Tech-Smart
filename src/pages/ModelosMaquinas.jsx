import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Edit, X, Trash2, Image, FileText, Layout, Info } from 'lucide-react';

export default function ModelosMaquinas() {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    photo_urls: '',
    technical_description: ''
  });

  useEffect(() => {
    fetchModels();
  }, []);

  async function fetchModels() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-machine-models');
      const data = await res.json();
      if (data.machineModels) setModels(data.machineModels);
    } catch (error) {
      console.error('Erro ao buscar modelos de máquinas:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (item) => {
    setFormData({
      id: item.id,
      name: item.name || '',
      photo_urls: item.photo_urls || '',
      technical_description: item.technical_description || ''
    });
    setIsModalOpen(true);
  };

  const openNewModel = () => {
    setFormData({
      id: null,
      name: '',
      photo_urls: '',
      technical_description: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/save-machine-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        fetchModels();
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
    if (!confirm('Tem certeza de que deseja excluir este modelo de máquina? Ele não estará mais selecionável em novas propostas.')) return;
    try {
      const response = await fetch('/api/delete-machine-model', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        fetchModels();
      } else {
        alert('Erro ao excluir registro.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao excluir.');
    }
  };

  const filtered = models.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.technical_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to extract first photo URL for preview
  const getFirstPhoto = (urlsString) => {
    if (!urlsString) return null;
    const urls = urlsString.split('\n').map(u => u.trim()).filter(Boolean);
    return urls.length > 0 ? urls[0] : null;
  };

  // Pre-fill model A260 Tennant for template convenience
  const fillA260Template = () => {
    setFormData({
      ...formData,
      name: 'Lavadora de Piso A260 Tennant',
      photo_urls: 'https://vendas.alfatennant.com.br/Imagens/Produtos/a260.png\nhttps://www.tennantco.com/-/media/tennant/tennantco/images/products/machines/a260/a260-hero.jpg',
      technical_description: `LAVADORA DE PISO DE OPERAÇÃO A PÉ A260 TENNANT

ESPECIFICAÇÕES TÉCNICAS:
- Faixa de limpeza: 600 mm / 650 mm
- Capacidade do tanque de solução: 60 L
- Capacidade do tanque de recolhimento: 65 L
- Nível de ruído: 65 dBA
- Produtividade teórica máx.: 2.600 m²/h
- Tipo de bateria: Selada (Gel) ou Monobloco 12V
- Tensão de alimentação: 24V (2x Baterias 12V)
- Motor de tração: Sim (Autopropelida com controle de velocidade)

CARACTERÍSTICAS & BENEFÍCIOS:
- Operação simples com painel intuitivo e controles ergonômicos.
- Manutenção diária simplificada com pontos amarelos de verificação.
- Elevada pressão de escova para remoção de sujeiras difíceis.
- Rodo parabólico de alta performance para secagem completa do piso.`
    });
  };

  return (
    <div className="font-sans text-gray-800 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Layout className="w-6 h-6 mr-2 text-blue-600" />
            Catálogo de Modelos (Propostas)
          </h1>
          <p className="text-sm text-gray-500 mt-1">Cadastre os modelos de máquinas com fotos e fichas técnicas para anexar automaticamente nas propostas em PDF</p>
        </div>
        
        <button 
          onClick={openNewModel}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm mt-4 md:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Cadastrar Modelo
        </button>
      </header>

      {/* Search Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar modelo cadastrado..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid of Models */}
      {isLoading ? (
        <div className="flex justify-center py-12 bg-white rounded-xl border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          <Layout className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          Nenhum modelo de máquina cadastrado no catálogo.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const firstPhoto = getFirstPhoto(item.photo_urls);
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  {/* Photo area */}
                  <div className="h-48 bg-gray-100 border-b border-gray-100 flex items-center justify-center relative overflow-hidden">
                    {firstPhoto ? (
                      <img src={firstPhoto} alt={item.name} className="w-full h-full object-contain p-2" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className={`absolute inset-0 flex-col items-center justify-center text-gray-400 bg-gray-50 ${firstPhoto ? 'hidden' : 'flex'}`}>
                      <Image className="w-10 h-10 mb-1" />
                      <span className="text-xs">Sem foto cadastrada</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>
                    
                    {item.technical_description ? (
                      <p className="text-xs text-gray-500 line-clamp-4 bg-gray-50 p-2.5 rounded border border-gray-100 font-mono whitespace-pre-line">
                        {item.technical_description}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Sem descrição técnica cadastrada.</p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <span className="text-xs text-gray-400">
                    ID #{item.id}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEdit(item)} 
                      className="flex items-center px-3 py-1.5 border border-gray-300 hover:bg-white text-gray-700 text-xs font-semibold rounded-lg transition-colors bg-white/60 shadow-xs"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="flex items-center px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg transition-colors bg-white/60 shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Layout className="w-5 h-5 mr-2 text-blue-600" />
                {formData.id ? 'Editar Modelo de Máquina' : 'Cadastrar Novo Modelo de Máquina'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Título/Modelo da Máquina *</label>
                  {!formData.id && (
                    <button 
                      type="button" 
                      onClick={fillA260Template}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Preencher Modelo A260 Tennant
                    </button>
                  )}
                </div>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium" 
                  placeholder="Ex: A260 Lavadora de Piso de Operação a Pé" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Links das Fotos (Um link por linha)</label>
                <textarea 
                  value={formData.photo_urls} 
                  onChange={e => setFormData({...formData, photo_urls: e.target.value})} 
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-mono" 
                  placeholder="https://exemplo.com/foto1.jpg&#10;https://exemplo.com/foto2.jpg"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Insira links diretos de imagens JPG/PNG para que sejam impressos no PDF.</span>
              </div>

              {getFirstPhoto(formData.photo_urls) && (
                <div className="p-2 border border-gray-100 rounded bg-gray-50 flex items-center space-x-2">
                  <div className="w-12 h-12 bg-white rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                    <img src={getFirstPhoto(formData.photo_urls)} className="w-full h-full object-contain" onError={e => e.target.src = 'https://placehold.co/100x100?text=Erro'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-600 block truncate">Pré-visualização da Imagem</span>
                    <span className="text-[10px] text-gray-400 truncate block">{getFirstPhoto(formData.photo_urls)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ficha / Descrição Técnica Completa</label>
                <textarea 
                  value={formData.technical_description} 
                  onChange={e => setFormData({...formData, technical_description: e.target.value})} 
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-mono" 
                  placeholder="ESPECIFICAÇÕES TÉCNICAS:&#10;- Faixa de limpeza: 600 mm&#10;- Bateria: 24V&#10;- Capacidade Tanque: 60 L..."
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Esta ficha técnica será impressa de forma estruturada no PDF da proposta comercial.</span>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center text-sm shadow-sm">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSaving ? 'Salvando...' : 'Salvar Modelo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
