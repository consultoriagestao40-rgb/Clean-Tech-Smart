import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Edit, X, Trash2, Image, FileText, Layout, Info, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ModelosMaquinas() {
  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Viewing details state
  const [viewingModel, setViewingModel] = useState(null);
  const [rentalPrices, setRentalPrices] = useState([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    photo_urls: '',
    technical_description: '',
    rental_price_id: ''
  });

  useEffect(() => {
    fetchModels();
    fetchRentalPrices();
  }, []);

  async function fetchRentalPrices() {
    try {
      const res = await fetch('/api/get-rental-prices');
      const data = await res.json();
      if (data.rentalPrices) setRentalPrices(data.rentalPrices);
    } catch (e) {
      console.error(e);
    }
  }

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
      technical_description: item.technical_description || '',
      rental_price_id: item.rental_price_id || ''
    });
    setIsModalOpen(true);
  };

  const openNewModel = () => {
    setFormData({
      id: null,
      name: '',
      photo_urls: '',
      technical_description: '',
      rental_price_id: ''
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

  const handleViewModel = (item) => {
    setViewingModel(item);
    setActivePhotoIndex(0);
  };

  const renderSpecs = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;
      if (trimmed.includes(':')) {
        const [key, ...valParts] = trimmed.split(':');
        const val = valParts.join(':').trim();
        const cleanKey = key.replace(/^[-\s*]+/, '').trim();
        return (
          <div key={idx} className="flex border-b border-gray-100 py-2 text-sm hover:bg-gray-50/50">
            <span className="font-semibold text-gray-500 w-1/2">{cleanKey}</span>
            <span className="text-gray-900 w-1/2 font-medium">{val}</span>
          </div>
        );
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        return (
          <div key={idx} className="flex items-start py-1.5 text-sm text-gray-700">
            <span className="text-blue-500 mr-2 font-bold">•</span>
            <span>{trimmed.replace(/^[-\s*•]+/, '')}</span>
          </div>
        );
      }
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
        return (
          <h4 key={idx} className="font-bold text-blue-900 text-sm mt-5 mb-2.5 uppercase tracking-wide border-b border-blue-100 pb-1.5">
            {trimmed}
          </h4>
        );
      }
      return <p key={idx} className="text-sm text-gray-600 py-1">{trimmed}</p>;
    });
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
              <div 
                key={item.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div onClick={() => handleViewModel(item)} className="cursor-pointer flex-1 flex flex-col">
                  {/* Photo area */}
                  <div className="h-48 bg-white border-b border-gray-100 flex items-center justify-center relative overflow-hidden">
                    {firstPhoto ? (
                      <img src={firstPhoto} alt={item.name} className="w-full h-full object-contain p-2 group-hover:scale-[1.03] transition-transform duration-300" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className={`absolute inset-0 flex-col items-center justify-center text-gray-400 bg-white ${firstPhoto ? 'hidden' : 'flex'}`}>
                      <Image className="w-10 h-10 mb-1" />
                      <span className="text-xs">Sem foto cadastrada</span>
                    </div>
                    {/* Visual Hover Badge */}
                    <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Visualizar Ficha
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                        <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors">{item.name}</h3>
                        {item.rental_code && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ {item.rental_code}
                          </span>
                        )}
                      </div>
                      {item.technical_description ? (
                        <p className="text-xs text-gray-500 line-clamp-4 bg-gray-50 p-2.5 rounded border border-gray-100 font-mono whitespace-pre-line">
                          {item.technical_description}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Sem descrição técnica cadastrada.</p>
                      )}
                    </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço da Tabela de Locação Vinculado (Opcional)</label>
                <select 
                  value={formData.rental_price_id || ''} 
                  onChange={e => setFormData({...formData, rental_price_id: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs bg-white"
                >
                  <option value="">Vincular Automaticamente / Selecionar Código da Tabela...</option>
                  {rentalPrices.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.code} - {r.description} (12M: R$ {Number(r.price_12 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-400 mt-1 block">Ao vincular, o sistema selecionará este preço da tabela automaticamente ao criar propostas comerciais de locação.</span>
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

      {/* Viewing Details Modal */}
      {viewingModel && (() => {
        const photos = (viewingModel.photo_urls || '').split('\n').map(u => u.trim()).filter(Boolean);
        const activePhoto = photos.length > 0 ? photos[activePhotoIndex] : null;

        const nextPhoto = () => {
          setActivePhotoIndex((prev) => (prev + 1) % photos.length);
        };

        const prevPhoto = () => {
          setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
        };

        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex flex-col md:flex-row min-h-[550px] max-h-[85vh]">
              
              {/* Left Column: Photo gallery */}
              <div className="w-full md:w-1/2 bg-white border-r border-gray-100 flex flex-col justify-between p-6 relative min-h-[350px] md:min-h-0">
                <button 
                  onClick={() => setViewingModel(null)}
                  className="md:hidden absolute top-4 right-4 bg-white/80 backdrop-blur-xs text-gray-500 hover:text-gray-700 p-2 rounded-full shadow-xs border border-gray-200 z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Main Active Photo */}
                <div className="flex-1 flex items-center justify-center relative group/gallery min-h-[220px]">
                  {activePhoto ? (
                    <img 
                      src={activePhoto} 
                      alt={viewingModel.name} 
                      className="max-w-full max-h-[320px] object-contain p-2 rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Image className="w-16 h-16 mb-2 text-gray-300" />
                      <span className="text-sm">Nenhuma foto cadastrada</span>
                    </div>
                  )}

                  {/* Arrow controls if more than 1 photo */}
                  {photos.length > 1 && (
                    <>
                      <button 
                        onClick={prevPhoto}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full border border-gray-200 shadow-sm transition-all hover:scale-105"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={nextPhoto}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full border border-gray-200 shadow-sm transition-all hover:scale-105"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails list */}
                {photos.length > 1 && (
                  <div className="flex space-x-2 mt-4 overflow-x-auto py-1 justify-center max-w-full">
                    {photos.map((photo, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-14 h-14 bg-white rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all p-0.5 ${idx === activePhotoIndex ? 'border-blue-500 scale-105 shadow-xs' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <img src={photo} alt="" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Spec sheet / details */}
              <div className="w-full md:w-1/2 flex flex-col justify-between p-8">
                {/* Title */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block">Catálogo Comercial</span>
                    <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{viewingModel.name}</h2>
                  </div>
                  <button 
                    onClick={() => setViewingModel(null)} 
                    className="hidden md:flex text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Technical Specifications Container */}
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[350px] md:max-h-[380px]">
                  {viewingModel.technical_description ? (
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                      {renderSpecs(viewingModel.technical_description)}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400 italic text-sm">
                      <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      Nenhuma especificação ou descrição técnica cadastrada.
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="pt-6 border-t border-gray-100 flex justify-end mt-4">
                  <button 
                    onClick={() => {
                      setViewingModel(null);
                      handleEdit(viewingModel);
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Ficha Técnica
                  </button>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
