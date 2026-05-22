import { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Plus, Trash2, Printer, Ban, Package, Wrench, History, Loader2, Calendar } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function NovoContrato() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [contract, setContract] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isSvcModalOpen, setIsSvcModalOpen] = useState(false);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (id) fetchDetails();
    else {
      // Setup para "Novo Contrato" vazio (MVP Simplificado para focar na UX de edição)
      setIsLoading(false);
    }
  }, [id]);

  async function fetchDetails() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/get-contract-details?id=${id}`);
      const data = await res.json();
      if (data.contract) {
        setContract(data.contract);
        setInvoices(data.invoices || []);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '-';
  const formatDateTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleString('pt-BR') : '-';

  const handleEmitContract = async () => {
    setIsGeneratingPDF(true);
    try {
      // 1. Buscar o template padrão
      const res = await fetch('/api/get-templates');
      const data = await res.json();
      const defaultTemplate = data.templates?.find(t => t.is_default);

      if (!defaultTemplate) {
        alert('Nenhum Template Padrão encontrado. Vá em Templates e marque um como Padrão.');
        setIsGeneratingPDF(false);
        return;
      }

      // 2. Construir o HTML
      let htmlContent = `
        <div style="padding: 40px; font-family: sans-serif; color: #333; line-height: 1.6;">
          <h1 style="text-align: center; margin-bottom: 30px; font-size: 24px;">CONTRATO DE LOCAÇÃO - ${displayContract.code}</h1>
          
          <div style="margin-bottom: 20px; font-size: 14px;">
            <p><strong>CLIENTE:</strong> ${displayContract.client_name}</p>
            <p><strong>DATA:</strong> ${formatDate(displayContract.start_date)}</p>
            <p><strong>VALOR TOTAL:</strong> ${formatCurrency(parseFloat(displayContract.total_rental_value) + parseFloat(displayContract.total_services_value))}</p>
          </div>
          
          <hr style="border: 1px solid #eee; margin-bottom: 20px;" />
      `;

      // Mesclar cláusulas
      const clauses = typeof defaultTemplate.clauses === 'string' ? JSON.parse(defaultTemplate.clauses) : defaultTemplate.clauses;
      
      clauses.forEach(clause => {
        let content = clause.content || '';
        // Motor de substituição (Mail Merge)
        content = content.replace(/{{CLIENT_NAME}}/g, displayContract.client_name);
        content = content.replace(/{{CONTRACT_CODE}}/g, displayContract.code);
        content = content.replace(/{{START_DATE}}/g, formatDate(displayContract.start_date));
        content = content.replace(/{{TOTAL_VALUE}}/g, formatCurrency(parseFloat(displayContract.total_rental_value) + parseFloat(displayContract.total_services_value)));
        
        htmlContent += `
          <h3 style="margin-top: 20px; font-size: 16px;">${clause.title}</h3>
          <p style="font-size: 14px; text-align: justify; margin-bottom: 15px;">${content.replace(/\n/g, '<br/>')}</p>
        `;
      });

      htmlContent += `
          <div style="margin-top: 60px; display: flex; justify-content: space-between;">
             <div style="border-top: 1px solid #333; width: 45%; text-align: center; padding-top: 10px;">Assinatura Contratante</div>
             <div style="border-top: 1px solid #333; width: 45%; text-align: center; padding-top: 10px;">Assinatura Contratada</div>
          </div>
        </div>
      `;

      // 3. Importar dinamicamente e gerar PDF
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt = {
        margin:       10,
        filename:     \`Contrato_\${displayContract.code}.pdf\`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Criar elemento virtual
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      
      await html2pdf().from(element).set(opt).save();

    } catch (error) {
      console.error(error);
      alert('Erro ao gerar PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  // Mock dados caso seja novo (para não quebrar a tela)
  const displayContract = contract || {
    code: 'Novo', start_date: new Date(), client_name: 'Selecione um cliente...', total_rental_value: 0, total_services_value: 0, total_venal_value: 0, status: 'Reserva',
    equipments: [], services: []
  };

  return (
    <div className="font-sans text-gray-800 max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* HEADER DE AÇÕES */}
      <header className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/contratos')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{displayContract.code !== 'Novo' ? displayContract.code : 'Novo Contrato'}</h1>
            <p className="text-sm text-gray-500">Detalhes do contrato</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full hidden md:inline-block">
            {displayContract.status}
          </span>
          <button onClick={() => alert('Modo de Edição ativado (Em breve)')} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center transition-colors">
            <Edit className="w-4 h-4 mr-2" /> Editar
          </button>
          <button onClick={handleEmitContract} disabled={isGeneratingPDF} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center transition-colors disabled:opacity-50">
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
            {isGeneratingPDF ? 'Gerando...' : 'Emitir Contrato'}
          </button>
          <button onClick={() => { if(confirm('Tem certeza que deseja cancelar este contrato?')) alert('Contrato cancelado com sucesso.') }} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 flex items-center transition-colors">
            <Ban className="w-4 h-4 mr-2" /> Cancelar Contrato
          </button>
        </div>
      </header>

      {/* INFORMAÇÕES GERAIS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Informações Gerais</h2>
        <p className="text-sm text-gray-500 mb-6">Dados principais do contrato</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center"><Calendar className="w-4 h-4 mr-1"/> Data do Contrato</p>
            <p className="text-sm text-gray-900 font-medium">{formatDate(displayContract.start_date)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Cliente</p>
            <p className="text-sm text-gray-900 font-medium">{displayContract.client_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Valor Total Locação</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(displayContract.total_rental_value)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Valor Total Serviços</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(displayContract.total_services_value)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Valor Total Venal</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(displayContract.total_venal_value)}</p>
          </div>
        </div>
      </div>

      {/* EQUIPAMENTOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center"><Package className="w-5 h-5 mr-2 text-indigo-600"/> Equipamentos</h2>
            <p className="text-sm text-gray-500 mt-1">Lista de equipamentos deste contrato</p>
          </div>
          <button onClick={() => setIsEqModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Equipamento
          </button>
        </div>
        <div className="p-6 overflow-x-auto">
          {displayContract.equipments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm">Nenhum equipamento adicionado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Equipamento</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Modalidade</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Prev. Entrega</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Valor Locação</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {displayContract.equipments.map((eq, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 font-medium text-gray-900">Eq ID: {eq.equipment_id}</td>
                    <td className="py-4 text-blue-600 font-medium">Mod: {eq.modality_id}</td>
                    <td className="py-4">{formatDate(displayContract.start_date)}</td>
                    <td className="py-4 font-bold">{formatCurrency(eq.price)}</td>
                    <td className="py-4 text-right">
                      <button onClick={() => setIsEqModalOpen(true)} className="text-gray-400 hover:text-blue-500 mr-3"><Edit className="w-4 h-4 inline" /></button>
                      <button className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SERVIÇOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center"><Wrench className="w-5 h-5 mr-2 text-green-600"/> Serviços</h2>
            <p className="text-sm text-gray-500 mt-1">Serviços adicionais do contrato</p>
          </div>
          <button onClick={() => setIsSvcModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Serviço
          </button>
        </div>
        <div className="p-6">
           {displayContract.services.length === 0 ? (
            <p className="text-center text-gray-400 text-sm">Nenhum serviço adicionado ainda.</p>
          ) : (
            <ul className="space-y-4">
              {displayContract.services.map((svc, i) => (
                <li key={i} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{svc.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-gray-900">{formatCurrency(svc.price)}</span>
                    <button className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* HISTÓRICOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100">
           <h2 className="text-lg font-bold text-gray-900">Histórico de Cobranças</h2>
           <p className="text-sm text-gray-500">Períodos faturados e valores recebidos</p>
        </div>
        <div className="p-6 text-center text-sm text-gray-500">
          {invoices.length === 0 ? "Nenhuma fatura emitida ainda." : (
            <ul className="text-left space-y-2">
              {invoices.map(inv => (
                <li key={inv.id} className="flex justify-between border-b pb-2">
                  <span>{formatDate(inv.due_date)} - {inv.description}</span>
                  <span className="font-bold">{formatCurrency(inv.amount)} - {inv.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h2 className="text-lg font-bold text-gray-900 flex items-center"><History className="w-5 h-5 mr-2 text-gray-600" /> Histórico de Atividades</h2>
        </div>
        <div className="p-6">
          {history.length === 0 ? (
            <p className="text-center text-sm text-gray-500">Sem atividades recentes.</p>
          ) : (
             <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Data/Hora</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Ação</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Status</th>
                  <th className="pb-3 font-semibold text-gray-500 text-xs">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-b border-gray-50">
                    <td className="py-4">{formatDateTime(h.created_at)}</td>
                    <td className="py-4 font-medium text-gray-900">{h.action}</td>
                    <td className="py-4"><span className="px-2 py-1 bg-gray-100 text-xs rounded-full">{h.status}</span></td>
                    <td className="py-4">{h.user_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL EQUIPAMENTO */}
      {isEqModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-1">Editar Equipamento</h2>
            <p className="text-sm text-gray-500 mb-6">Atualize as informações do equipamento no contrato</p>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="font-bold text-gray-900">A Gás (GLP)</p>
                <p className="text-xs text-gray-500">Série: 0000012522256</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Modalidade</label>
                <select className="w-full px-3 py-2 border rounded-lg"><option>Anual</option></select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Previsão Entrega</label>
                  <input type="date" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Previsão Retirada</label>
                  <input type="date" className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Horímetro Saída</label>
                  <input type="number" defaultValue={0} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Horímetro Retorno</label>
                  <input type="number" defaultValue={0} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Valor Locação</label>
                <input type="text" defaultValue="R$ 1.300,00" className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsEqModalOpen(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={() => setIsEqModalOpen(false)} className="px-4 py-2 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700">Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SERVIÇO */}
      {isSvcModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-1">Adicionar Serviço</h2>
            <p className="text-sm text-gray-500 mb-6">Selecione um serviço do catálogo e configure os detalhes</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Serviço *</label>
                <select className="w-full px-3 py-2 border rounded-lg"><option>Selecione um serviço...</option></select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Valor *</label>
                <input type="text" defaultValue="R$ 0,00" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Descrição</label>
                <input type="text" placeholder="Detalhes adicionais do serviço" className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsSvcModalOpen(false)} className="px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={() => setIsSvcModalOpen(false)} className="px-4 py-2 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700">Adicionar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
