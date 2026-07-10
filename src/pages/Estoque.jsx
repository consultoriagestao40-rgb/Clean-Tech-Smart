import { useState, useEffect, useRef } from 'react';
import { 
  Boxes, 
  Upload, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  AlertTriangle, 
  Loader2, 
  FileText, 
  CheckCircle,
  TrendingDown
} from 'lucide-react';

export default function Estoque() {
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [pageInputVal, setPageInputVal] = useState('1');
  
  // Stats
  const [totalItems, setTotalItems] = useState(0);
  const [inStockCount, setInStockCount] = useState(0);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Modals / Editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    sku: '',
    name: '',
    description: '',
    unit_price: 0,
    quantity: 0,
    min_quantity: 5,
    ncm: ''
  });

  // Inline Inventory Editing
  const [editingPartId, setEditingPartId] = useState(null);
  const [inlineQuantity, setInlineQuantity] = useState(0);
  const [inlinePrice, setInlinePrice] = useState(0);
  const [isSavingInline, setIsSavingInline] = useState(false);

  // Import Excel State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: '' });
  const [importReport, setImportReport] = useState(null);
  const fileInputRef = useRef(null);

  const fetchParts = async () => {
    try {
      const res = await fetch('/api/get-parts');
      const data = await res.json();
      if (data.parts) {
        setParts(data.parts);
        calculateStats(data.parts);
      }
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  useEffect(() => {
    setPageInputVal(String(currentPage));
  }, [currentPage]);

  const calculateStats = (items) => {
    let value = 0;
    let inStock = 0;
    let lowStock = 0;

    items.forEach(item => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unit_price || 0);
      value += qty * price;
      if (qty > 0) inStock++;
      if (qty <= Number(item.min_quantity || 0)) lowStock++;
    });

    setTotalItems(items.length);
    setInStockCount(inStock);
    setTotalStockValue(value);
    setLowStockCount(lowStock);
  };

  const handleOpenNew = () => {
    setFormData({
      id: null,
      sku: '',
      name: '',
      description: '',
      unit_price: 0,
      quantity: 0,
      min_quantity: 5,
      ncm: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (part) => {
    setFormData({
      id: part.id,
      sku: part.sku || '',
      name: part.name,
      description: part.description || '',
      unit_price: Number(part.unit_price || 0),
      quantity: Number(part.quantity || 0),
      min_quantity: Number(part.min_quantity || 0),
      ncm: part.ncm || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/save-part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchParts();
      } else {
        const error = await res.json();
        alert('Erro ao salvar item: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao salvar item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta peça do estoque?')) return;
    try {
      const res = await fetch('/api/delete-part', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchParts();
      } else {
        alert('Erro ao excluir peça.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao excluir.');
    }
  };

  // Start inline editing for inventory count
  const handleStartInlineEdit = (part) => {
    setEditingPartId(part.id);
    setInlineQuantity(Number(part.quantity || 0));
    setInlinePrice(Number(part.unit_price || 0));
  };

  const handleSaveInline = async (part) => {
    setIsSavingInline(true);
    try {
      const res = await fetch('/api/save-part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...part,
          quantity: inlineQuantity,
          unit_price: inlinePrice
        })
      });
      if (res.ok) {
        setEditingPartId(null);
        fetchParts();
      } else {
        alert('Erro ao salvar contagem de estoque.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede.');
    } finally {
      setIsSavingInline(false);
    }
  };

  // Load SheetJS dynamically and handle file uploading
  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportReport(null);
    setImportProgress({ current: 0, total: 0, status: 'Carregando biblioteca do Excel...' });

    try {
      // 1. Carrega o XLSX via CDN
      const XLSX = await new Promise((resolve, reject) => {
        if (window.XLSX) {
          resolve(window.window.XLSX);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = () => resolve(window.XLSX);
        script.onerror = (err) => reject(err);
        document.body.appendChild(script);
      });

      setImportProgress({ current: 0, total: 0, status: 'Lendo arquivo Excel...' });

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            alert('A planilha importada está vazia.');
            setIsImporting(false);
            return;
          }

          setImportProgress({ current: 0, total: jsonData.length, status: 'Mapeando colunas...' });

          // 2. Mapeamento de colunas flexível (Tenta encontrar SKU, Nome, Descrição, Preço, NCM e Qtd)
          const mappedParts = jsonData.map(row => {
            const keys = Object.keys(row);
            
            // SKU (Coluna A - índice 0 - PRODUTO)
            let skuKey = keys[0];
            if (!skuKey || !/produto|sku|c[oó]d/i.test(skuKey)) {
              skuKey = keys.find(k => /produto|sku|c[oó]d(igo)?|ref(er[eê]ncia)?/i.test(k));
            }
            
            // Nome/Descrição (Coluna B - índice 1 - DESCRIÇÃO)
            let nameKey = keys[1];
            if (!nameKey || !/descri/i.test(nameKey)) {
              nameKey = keys.find(k => k !== skuKey && /descri[cç][aã]o|nome|item/i.test(k));
            }
            
            // NCM (Coluna C - índice 2 - NCM)
            let ncmKey = keys[2];
            if (!ncmKey || !/ncm/i.test(ncmKey)) {
              ncmKey = keys.find(k => /ncm/i.test(k));
            }
            
            // Preço (Coluna L - índice 11 - VL TOTAL)
            let priceKey = keys[11];
            if (!priceKey) {
              priceKey = keys.find(k => /vl\s*total|total/i.test(k)) || keys.find(k => /pre[cç]o|valor/i.test(k));
            }
            
            // Quantidade
            const qtyKey = keys.find(k => /qtd|quant(idade)?|estoque/i.test(k));
            
            // Descrição adicional
            const descKey = keys.find(k => k !== nameKey && k !== skuKey && /detalhes|obs|especifica[cç][aã]o/i.test(k));

            // Função para parsear valor monetário em BRL para float
            const parseBRLFloat = (val) => {
              if (val === undefined || val === null) return 0;
              let str = String(val).trim();
              str = str.replace(/R\$\s*/g, '');
              if (str.includes(',')) {
                str = str.replace(/\./g, '');
                str = str.replace(',', '.');
              }
              return parseFloat(str) || 0;
            };

            return {
              sku: skuKey ? String(row[skuKey] || '').trim() : '',
              name: nameKey ? String(row[nameKey] || '').trim() : 'Peça sem nome',
              description: descKey ? String(row[descKey] || '').trim() : '',
              unit_price: priceKey ? parseBRLFloat(row[priceKey]) : 0,
              quantity: qtyKey ? parseInt(row[qtyKey], 10) || 0 : 0,
              ncm: ncmKey ? String(row[ncmKey] || '').trim() : ''
            };
          });

          // Filtra itens vazios (que não tem nome ou sku)
          const validParts = mappedParts.filter(p => p.name || p.sku);

          // 3. Enviar em lotes de 1000 itens para a API (Evita estouro de timeout e limites do Vercel)
          const BATCH_SIZE = 1000;
          const totalRows = validParts.length;
          let importedCount = 0;

          for (let i = 0; i < totalRows; i += BATCH_SIZE) {
            const batch = validParts.slice(i, i + BATCH_SIZE);
            setImportProgress({
              current: i,
              total: totalRows,
              status: `Enviando lote (${i} a ${Math.min(i + BATCH_SIZE, totalRows)} de ${totalRows} itens)...`
            });

            const res = await fetch('/api/import-parts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ parts: batch })
            });

            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || 'Erro ao enviar lote.');
            }

            importedCount += batch.length;
          }

          setImportProgress({ current: totalRows, total: totalRows, status: 'Finalizando importação...' });
          setImportReport({ count: importedCount });
          fetchParts();
        } catch (error) {
          console.error(error);
          alert('Erro ao processar os dados da planilha: ' + error.message);
        } finally {
          setIsImporting(false);
          // Limpa o input do arquivo
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error(error);
      alert('Erro ao inicializar importador de planilha.');
      setIsImporting(false);
    }
  };

  // Pagination & Filtering
  const filteredParts = parts.filter(p => 
    (p.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.sku?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredParts.slice(indexOfFirstItem, indexOfLastItem);

  const formatBRL = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Boxes className="w-7 h-7 text-blue-600 mr-2" />
            Estoque de Peças e Insumos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie o catálogo de peças da empresa, faça importação via Excel e realize o inventário.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleExcelImport} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting}
            className="flex items-center px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 disabled:opacity-50 border border-green-200 rounded-xl font-medium transition-all shadow-sm text-sm"
          >
            {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {isImporting ? 'Importando...' : 'Importar Excel'}
          </button>
          <button 
            onClick={handleOpenNew}
            className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Peça
          </button>
        </div>
      </div>

      {/* Progress or Report Alert */}
      {isImporting && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-blue-800 animate-pulse">
          <div className="flex items-center mb-3">
            <Loader2 className="w-5 h-5 mr-3 animate-spin text-blue-600" />
            <h3 className="font-semibold text-blue-900">Importação de Peças em Andamento</h3>
          </div>
          <p className="text-sm text-blue-700">{importProgress.status}</p>
          {importProgress.total > 0 && (
            <div className="mt-3 w-full bg-blue-100 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {importReport && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-green-800 flex justify-between items-center animate-in fade-in duration-300">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Importação Concluída com Sucesso!</h3>
              <p className="text-sm text-green-700">Foram importadas/atualizadas {importReport.count} peças no banco de dados.</p>
            </div>
          </div>
          <button onClick={() => setImportReport(null)} className="p-1 text-green-600 hover:text-green-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Stats Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Catálogo Base</span>
            <span className="block text-2xl font-bold text-gray-800">{totalItems} itens</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
          <div className="p-3 rounded-xl bg-green-50 text-green-600 mr-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Itens em Estoque</span>
            <span className="block text-2xl font-bold text-gray-800">{inStockCount} itens</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 mr-4">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Valor do Estoque</span>
            <span className="block text-2xl font-bold text-gray-800">R$ {formatBRL(totalStockValue)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center">
          <div className="p-3 rounded-xl bg-red-50 text-red-600 mr-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Abaixo do Mínimo</span>
            <span className="block text-2xl font-bold text-red-600">{lowStockCount} itens</span>
          </div>
        </div>
      </div>

      {/* List Table and Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Buscar por SKU, Nome ou Descrição..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-gray-50/50" 
            />
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Exibir</span>
            <select 
              value={itemsPerPage} 
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value={20}>20 itens</option>
              <option value={50}>50 itens</option>
              <option value={100}>100 itens</option>
              <option value={200}>200 itens</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <span>Carregando peças em estoque...</span>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold w-36">SKU / Código</th>
                  <th className="px-6 py-4 font-semibold w-32">NCM</th>
                  <th className="px-6 py-4 font-semibold">Nome da Peça / Descrição</th>
                  <th className="px-6 py-4 font-semibold w-40 text-right">Preço Unitário</th>
                  <th className="px-6 py-4 font-semibold w-40 text-center">Estoque Atual</th>
                  <th className="px-6 py-4 font-semibold w-36 text-center">Mín. Alerta</th>
                  <th className="px-6 py-4 font-semibold w-32 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                      Nenhuma peça encontrada no catálogo.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((part) => {
                    const isEditing = editingPartId === part.id;
                    const isLowStock = Number(part.quantity || 0) <= Number(part.min_quantity || 0);
                    
                    return (
                      <tr 
                        key={part.id} 
                        className={`hover:bg-gray-50/50 transition-colors ${
                          isLowStock && Number(part.quantity || 0) > 0 ? 'bg-yellow-50/10' : 
                          isLowStock && Number(part.quantity || 0) === 0 ? 'bg-red-50/5' : ''
                        }`}
                      >
                        <td className="px-6 py-4 font-mono font-medium text-gray-900">
                          {part.sku || <span className="text-gray-300 font-sans italic text-xs">Sem SKU</span>}
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-gray-500 text-xs">
                          {part.ncm || <span className="text-gray-300 font-sans italic">-</span>}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{part.name}</p>
                          {part.description && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{part.description}</p>}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {isEditing ? (
                            <div className="flex items-center justify-end">
                              <span className="text-xs text-gray-400 mr-1">R$</span>
                              <input 
                                type="number" 
                                step="0.01"
                                value={inlinePrice} 
                                onChange={e => setInlinePrice(parseFloat(e.target.value) || 0)} 
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm text-right bg-white" 
                              />
                            </div>
                          ) : (
                            <span className="text-gray-900">R$ {formatBRL(part.unit_price)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <input 
                              type="number" 
                              value={inlineQuantity} 
                              onChange={e => setInlineQuantity(parseInt(e.target.value, 10) || 0)} 
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm text-center bg-white" 
                            />
                          ) : (
                            <div className="flex items-center justify-center space-x-1.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                Number(part.quantity || 0) === 0 ? 'bg-red-100 text-red-800' :
                                isLowStock ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {part.quantity || 0} un
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                            {part.min_quantity || 0} un
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex justify-end space-x-1">
                              <button 
                                onClick={() => handleSaveInline(part)} 
                                disabled={isSavingInline}
                                className="p-1 bg-green-50 hover:bg-green-100 text-green-600 rounded transition-colors"
                                title="Confirmar"
                              >
                                {isSavingInline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button 
                                onClick={() => setEditingPartId(null)} 
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end space-x-1">
                              <button 
                                onClick={() => handleStartInlineEdit(part)} 
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs rounded transition-colors font-medium"
                                title="Inventariar / Contar"
                              >
                                Contar
                              </button>
                              <button 
                                onClick={() => handleOpenEdit(part)} 
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar Cadastro"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(part.id)} 
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-500">
                Exibindo {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredParts.length)} de {filteredParts.length} peças.
              </span>
              <div className="flex items-center space-x-1.5 text-xs text-gray-500 border-l border-gray-200 pl-4">
                <span>Exibir:</span>
                <select 
                  value={itemsPerPage} 
                  onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-xs font-medium"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
                <span>linhas</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-gray-100 disabled:opacity-50 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold transition-colors"
              >
                Anterior
              </button>
              
              <div className="flex items-center space-x-1.5 text-xs text-gray-600 px-2">
                <span>Página</span>
                <input 
                  type="text" 
                  value={pageInputVal}
                  onChange={e => setPageInputVal(e.target.value)}
                  onBlur={() => {
                    let pageNum = parseInt(pageInputVal, 10);
                    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
                    if (pageNum > totalPages) pageNum = totalPages;
                    setCurrentPage(pageNum);
                    setPageInputVal(String(pageNum));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      let pageNum = parseInt(pageInputVal, 10);
                      if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
                      if (pageNum > totalPages) pageNum = totalPages;
                      setCurrentPage(pageNum);
                      setPageInputVal(String(pageNum));
                      e.target.blur();
                    }
                  }}
                  className="w-12 px-1 py-0.5 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                />
                <span>de {totalPages}</span>
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-gray-100 disabled:opacity-50 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit / New Part Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {formData.id ? 'Editar Cadastro da Peça' : 'Cadastrar Nova Peça'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código SKU *</label>
                  <input 
                    type="text" 
                    value={formData.sku} 
                    onChange={e => setFormData({ ...formData, sku: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                    placeholder="Ex: PC-9988" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NCM</label>
                  <input 
                    type="text" 
                    value={formData.ncm} 
                    onChange={e => setFormData({ ...formData, ncm: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                    placeholder="Ex: 68053090" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Peça / Produto *</label>
                <input 
                  required
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                  placeholder="Ex: Motor de Aspiração 1000W" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Adicional</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white resize-none h-20" 
                  placeholder="Ex: Compatível com lavadoras da marca Alfa" 
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Preço Unit. (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.unit_price} 
                    onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })} 
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white text-right" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Qtd. Estoque</label>
                  <input 
                    type="number" 
                    value={formData.quantity} 
                    onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })} 
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white text-center" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Mín. Alerta</label>
                  <input 
                    type="number" 
                    value={formData.min_quantity} 
                    onChange={e => setFormData({ ...formData, min_quantity: parseInt(e.target.value, 10) || 0 })} 
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white text-center" 
                  />
                </div>
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
                  {isSaving ? 'Salvando...' : 'Salvar Peça'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
