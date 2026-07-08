import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Loader2, Filter, Eye, Check, X, FileDown } from 'lucide-react';

export default function Dashboard() {
  const formatBRL = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

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

    const laborRows = laborItems.length === 0
      ? `<tr><td colspan="4" class="empty">Nenhuma hora técnica cobrada.</td></tr>`
      : laborItems.map(item => `
          <tr>
            <td>${item.description}</td>
            <td class="center">${Number(item.hours)}</td>
            <td class="right">R$ ${formatBRL(item.unit_price)}</td>
            <td class="right bold">R$ ${formatBRL(Number(item.hours) * Number(item.unit_price))}</td>
          </tr>`).join('');

    const partsRows = partsItems.length === 0
      ? `<tr><td colspan="4" class="empty">Nenhuma peça incluída.</td></tr>`
      : partsItems.map(item => `
          <tr>
            <td>${item.part_name}</td>
            <td class="center">${item.quantity}</td>
            <td class="right">R$ ${formatBRL(item.unit_price)}</td>
            <td class="right bold">R$ ${formatBRL(Number(item.quantity) * Number(item.unit_price))}</td>
          </tr>`).join('');

    const dist = Math.max(0, (budget.final_km || 0) - (budget.initial_km || 0));
    const emissao = new Date(budget.created_at).toLocaleDateString('pt-BR');
    const geradoEm = new Date().toLocaleString('pt-BR');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Orçamento #${String(budget.id).padStart(4,'0')} - Clean Tech Smart</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}

body{font-family:'Inter',Arial,sans-serif;background:#f1f5f9;color:#1e293b;font-size:13px;line-height:1.6}
.print-bar{position:fixed;top:0;left:0;right:0;background:#1e3a8a;color:#fff;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;z-index:999;font-size:13px}
.print-bar strong{font-weight:600}
.btn-print{background:#fff;color:#1e3a8a;border:none;padding:8px 20px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer}
.btn-print:hover{background:#dbeafe}
body{padding-top:50px}
.page{background:#fff;max-width:870px;margin:20px auto;padding:52px 60px;box-shadow:0 4px 24px rgba(0,0,0,.08);border-radius:12px}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:22px;border-bottom:3px solid #1e40af;margin-bottom:30px}
.co-name{font-size:24px;font-weight:800;color:#1e3a8a;letter-spacing:-0.5px}
.co-sub{font-size:11px;color:#64748b;margin-top:2px}
.doc-label{font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;text-align:right}
.doc-num{font-size:24px;font-weight:800;color:#0f172a;text-align:right;margin-top:2px}
.doc-date{font-size:11px;color:#64748b;text-align:right;margin-top:2px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:28px}
.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px}
.box-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#1e40af;padding-bottom:8px;border-bottom:1px solid #e2e8f0;margin-bottom:10px}
.row{display:flex;gap:6px;font-size:12px;margin-bottom:4px}
.row b{color:#475569;font-weight:600;min-width:76px}
.badge{display:inline-block;background:#dbeafe;color:#1e40af;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:600}
.sec{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#1e40af;margin:26px 0 10px;display:flex;align-items:center;gap:8px}
.sec::after{content:'';flex:1;height:1px;background:#e2e8f0}
table{width:100%;border-collapse:collapse;margin-bottom:4px}
thead tr{background:#1e3a8a;color:#fff}
thead th{padding:9px 12px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;text-align:left}
th.right,td.right{text-align:right}
th.center,td.center{text-align:center}
tbody tr{border-bottom:1px solid #f1f5f9}
tbody tr:nth-child(even){background:#f8fafc}
tbody td{padding:9px 12px;color:#334155;font-size:12px}
td.bold{font-weight:700}
td.empty{text-align:center;color:#94a3b8;font-style:italic;padding:12px}
.sumwrap{display:flex;justify-content:flex-end;margin-top:28px}
.sumbox{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;border-radius:12px;padding:22px 26px;min-width:280px}
.sum-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;opacity:.75;margin-bottom:14px}
.sum-row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:7px;opacity:.9}
.sum-div{border:none;border-top:1px solid rgba(255,255,255,.3);margin:10px 0}
.sum-total{display:flex;justify-content:space-between;font-size:19px;font-weight:800}
.notes{background:#fefce8;border:1px solid #fde047;border-left:4px solid #eab308;border-radius:6px;padding:13px 16px;margin-top:20px;font-size:12px;color:#713f12}
.notes b{display:block;margin-bottom:3px;font-size:10px;text-transform:uppercase;letter-spacing:.5px}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end;font-size:10px;color:#94a3b8}
.sig{text-align:center}
.sig .line{width:180px;border-top:1px solid #cbd5e1;margin:0 auto 5px}
@media print{
  .print-bar,.no-print{display:none!important}
  body{background:#fff;padding-top:0}
  .page{box-shadow:none;margin:0;padding:30px 40px;border-radius:0;max-width:100%}
  @page{margin:10mm 12mm}
}
</style>
</head>
<body>
<div class="print-bar no-print">
  <strong>📄 Orçamento #${String(budget.id).padStart(4,'0')} &mdash; Clean Tech Smart</strong>
  <button class="btn-print" onclick="window.print()">⬇️&nbsp; Salvar / Imprimir como PDF</button>
</div>
<div class="page">
  <div class="header">
    <div>
      <div class="co-name">Clean Tech Smart</div>
      <div class="co-sub">Soluções Inteligentes em Higiene e Limpeza</div>
    </div>
    <div>
      <div class="doc-label">Proposta Técnica</div>
      <div class="doc-num">#${String(budget.id).padStart(4,'0')}</div>
      <div class="doc-date">Emitido em ${emissao}</div>
    </div>
  </div>

  <div class="grid3">
    <div class="box">
      <div class="box-title">Dados do Cliente</div>
      <div class="row"><b>Cliente:</b>${budget.client_name || budget.client_id || 'Não informado'}</div>
      <div class="row"><b>Documento:</b>${budget.client_document || '&mdash;'}</div>
      <div class="row"><b>Endereço:</b>${budget.client_address || '&mdash;'}</div>
    </div>
    <div class="box">
      <div class="box-title">Ativo / Equipamento</div>
      ${budget.equipment_name ? `
        <div class="row"><b>Nome:</b>${budget.equipment_name}</div>
        <div class="row"><b>Marca/Mod:</b>${budget.equipment_brand || '&mdash;'} ${budget.equipment_model ? `/ ${budget.equipment_model}` : ''}</div>
        <div class="row"><b>Nº Série:</b>${budget.equipment_serial_number || '&mdash;'}</div>
      ` : `
        <div class="row" style="color:#94a3b8;font-style:italic;">Nenhum equipamento associado</div>
      `}
    </div>
    <div class="box">
      <div class="box-title">Detalhes da Proposta</div>
      <div class="row"><b>Solicitante:</b>${budget.contact_name || '&mdash;'}</div>
      <div class="row"><b>Contato:</b>${budget.contact_info || '&mdash;'}</div>
      <div class="row"><b>Serviço:</b><span style="text-transform:capitalize">${budget.service_type}</span></div>
      <div class="row"><b>Status:</b><span class="badge">${budget.status || 'Pendente'}</span></div>
    </div>
  </div>

  <div class="sec">Mão de Obra</div>
  <table>
    <thead><tr>
      <th>Descrição do Serviço</th>
      <th class="center" style="width:80px">Horas</th>
      <th class="right" style="width:130px">Valor/Hora</th>
      <th class="right" style="width:130px">Total</th>
    </tr></thead>
    <tbody>${laborRows}</tbody>
  </table>

  <div class="sec">Peças e Insumos</div>
  <table>
    <thead><tr>
      <th>Descrição da Peça</th>
      <th class="center" style="width:80px">Qtd.</th>
      <th class="right" style="width:130px">Valor Unit.</th>
      <th class="right" style="width:130px">Total</th>
    </tr></thead>
    <tbody>${partsRows}</tbody>
  </table>

  <div class="sec">Deslocamento / Logística</div>
  <table>
    <thead><tr>
      <th class="center">KM Inicial</th>
      <th class="center">KM Final</th>
      <th class="center">Distância</th>
      <th class="right">Valor/KM</th>
      <th class="right" style="width:130px">Total</th>
    </tr></thead>
    <tbody>
      <tr>
        <td class="center">${budget.initial_km || 0}</td>
        <td class="center">${budget.final_km || 0}</td>
        <td class="center">${dist} km</td>
        <td class="right">R$ ${formatBRL(budget.price_per_km || 0)}</td>
        <td class="right bold">R$ ${formatBRL(budget.total_logistics || 0)}</td>
      </tr>
    </tbody>
  </table>

  ${budget.notes ? `<div class="notes"><b>Observações:</b>${budget.notes}</div>` : ''}

  <div class="sumwrap">
    <div class="sumbox">
      <div class="sum-title">Resumo Financeiro</div>
      <div class="sum-row"><span>Mão de Obra</span><span>R$ ${formatBRL(budget.total_labor || 0)}</span></div>
      <div class="sum-row"><span>Peças e Insumos</span><span>R$ ${formatBRL(budget.total_parts || 0)}</span></div>
      <div class="sum-row"><span>Deslocamento</span><span>R$ ${formatBRL(budget.total_logistics || 0)}</span></div>
      <hr class="sum-div">
      <div class="sum-total"><span>Total Geral</span><span>R$ ${formatBRL(budget.grand_total || 0)}</span></div>
    </div>
  </div>

  <div class="footer">
    <div>
      <div>Clean Tech Smart &mdash; Soluções Inteligentes em Higiene e Limpeza</div>
      <div>Gerado em ${geradoEm}</div>
    </div>
    <div class="sig">
      <div class="line"></div>
      <div>Assinatura do Responsável</div>
    </div>
  </div>
</div>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      alert('Por favor, permita pop-ups para este site e tente novamente.');
    }
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
              R$ {formatBRL(budgets.reduce((acc, curr) => acc + Number(curr.grand_total || 0), 0))}
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
                      R$ {formatBRL(budget.grand_total)}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Dados do Cliente</h3>
                      <p className="font-semibold text-gray-800">{selectedBudget.budget.client_name || selectedBudget.budget.client_id || 'Não informado'}</p>
                      <p className="text-sm text-gray-600 mt-1"><strong>CNPJ/CPF:</strong> {selectedBudget.budget.client_document || '-'}</p>
                      <p className="text-sm text-gray-600 mt-1"><strong>Endereço:</strong> {selectedBudget.budget.client_address || '-'}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ativo / Equipamento</h3>
                      {selectedBudget.budget.equipment_name ? (
                        <>
                          <p className="font-semibold text-gray-800">{selectedBudget.budget.equipment_name}</p>
                          <p className="text-sm text-gray-600 mt-1"><strong>Marca/Modelo:</strong> {selectedBudget.budget.equipment_brand || '-'} {selectedBudget.budget.equipment_model ? `/ ${selectedBudget.budget.equipment_model}` : ''}</p>
                          <p className="text-sm text-gray-600 mt-1"><strong>Nº de Série:</strong> {selectedBudget.budget.equipment_serial_number || '-'}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Nenhum equipamento associado</p>
                      )}
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
                              <td className="px-4 py-2 text-right">R$ {formatBRL(item.unit_price)}</td>
                              <td className="px-4 py-2 text-right font-medium text-gray-800">R$ {formatBRL(item.hours * item.unit_price)}</td>
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
                              <td className="px-4 py-2 text-right">R$ {formatBRL(item.unit_price)}</td>
                              <td className="px-4 py-2 text-right font-medium text-gray-800">R$ {formatBRL(item.quantity * item.unit_price)}</td>
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
                          <p><strong>Valor por KM:</strong> R$ {formatBRL(selectedBudget.budget.price_per_km)}</p>
                          <p className="font-semibold text-blue-600 pt-1"><strong>Subtotal Logística:</strong> R$ {formatBRL(selectedBudget.budget.total_logistics)}</p>
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
                            <span className="font-medium text-gray-800">R$ {formatBRL(selectedBudget.budget.total_labor)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Subtotal Peças:</span>
                            <span className="font-medium text-gray-800">R$ {formatBRL(selectedBudget.budget.total_parts)}</span>
                          </div>
                          <div className="flex justify-between pb-3 border-b border-blue-100">
                            <span>Subtotal Logística:</span>
                            <span className="font-medium text-gray-800">R$ {formatBRL(selectedBudget.budget.total_logistics)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-600 p-4 rounded-lg text-white">
                        <span className="block text-xs font-semibold uppercase tracking-wider opacity-90">Valor Total do Orçamento</span>
                        <span className="block text-3xl font-bold mt-1">R$ {formatBRL(selectedBudget.budget.grand_total)}</span>
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
