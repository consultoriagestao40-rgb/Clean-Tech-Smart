import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Edit, Trash2, X, ShieldCheck, Key, Send, CheckCircle2, Lock } from 'lucide-react';

export default function Clientes() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null, 
    name: '', 
    razao_social: '', 
    document: '', 
    email: '', 
    phone: '', 
    status: 'Ativo', 
    contact_person: '', 
    address: '',
    password: '',
    lgpd_accepted: true
  });

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-clients');
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleEdit = (client) => {
    setFormData({
      id: client.id,
      name: client.name || '',
      razao_social: client.razao_social || '',
      document: client.document || '',
      email: client.email || '',
      phone: client.phone || '',
      status: client.status || 'Ativo',
      contact_person: client.contact_person || '',
      address: client.address || '',
      password: '',
      lgpd_accepted: !!client.lgpd_accepted
    });
    setIsModalOpen(true);
  };

  const openNewClient = () => {
    setFormData({ 
      id: null, 
      name: '', 
      razao_social: '', 
      document: '', 
      email: '', 
      phone: '', 
      status: 'Ativo', 
      contact_person: '', 
      address: '',
      password: '',
      lgpd_accepted: true 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ id: null, name: '', document: '', email: '', phone: '', status: 'Ativo', contact_person: '', address: '' });
        fetchClients();
      } else {
        const errorData = await response.json();
        alert('Erro ao salvar: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error(error);
      alert('Erro de rede ao salvar cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const sendPortalAccess = (client) => {
    const rawPhone = String(client.phone || '').replace(/\D/g, '');
    const phoneWithDdi = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    const portalUrl = 'https://cleantechsmart.cleantechpro.com.br/chamados';
    const message = `Olá ${client.name || 'Cliente'}! Segue seu link de acesso exclusivo ao Portal do Cliente Clean Tech Pro (Assistência Técnica Autorizada Tennant):\n\n🔗 Acesse: ${portalUrl}\n👤 Login: ${client.email || client.document || 'Seu E-mail ou CNPJ'}\n\nNo portal você pode abrir chamados de manutenção com agilidade, acompanhar ordens de serviço e consultar o histórico e custos do seu parque de máquinas.`;
    
    if (rawPhone.length >= 10) {
      window.open(`https://wa.me/${phoneWithDdi}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      navigator.clipboard.writeText(message);
      alert('Mensagem e link do portal copiados para a área de transferência!');
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document?.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes & Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie a carteira de clientes, libere acessos ao portal e valide conformidade LGPD</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button 
            onClick={openNewClient}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </button>
        </div>
      </header>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por Nome ou CNPJ/CPF..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">Nome / Razão Social</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Documento</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Contato</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Status & LGPD</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Ações & Acesso</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                    <p>Carregando clientes...</p>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <p>Nenhum cliente encontrado.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <p>{client.name}</p>
                      {client.razao_social && <p className="text-xs text-gray-400 font-normal">{client.razao_social}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{client.document || '-'}</td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium">{client.contact_person || '-'}</p>
                      <p className="text-xs text-gray-500">{client.email || '-'} | {client.phone || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${client.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {client.status}
                        </span>
                        {client.lgpd_accepted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                            <ShieldCheck className="w-3 h-3 text-teal-600" /> LGPD OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Pendente LGPD
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => sendPortalAccess(client)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                          title="Enviar link e dados de acesso do portal via WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Mandar Acesso</span>
                        </button>
                        <button 
                          onClick={() => handleEdit(client)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" 
                          title="Editar cliente"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{formData.id ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia / Nome *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Nome fantasia ou Nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                  <input 
                    type="text" 
                    value={formData.razao_social}
                    onChange={e => setFormData({...formData, razao_social: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Razão social jurídica"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento (CPF/CNPJ)</label>
                <input 
                  type="text" 
                  value={formData.document}
                  onChange={e => setFormData({...formData, document: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa de Contato</label>
                <input 
                  type="text" 
                  value={formData.contact_person}
                  onChange={e => setFormData({...formData, contact_person: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Nome de quem atende"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone/Celular</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo (para cálculo de KM)</label>
                <textarea 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-16"
                  placeholder="Rua, Número, Bairro, Cidade - Estado"
                ></textarea>
              </div>

              {/* Seção Credenciais do Portal do Cliente & LGPD */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-[#007481]" /> Acesso ao Portal do Cliente
                  </div>
                  <span className="text-[11px] text-gray-500">cleantechsmart.cleantechpro.com.br/chamados</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Senha do Portal (Opcional - caso queira definir)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder={formData.id ? "Deixe em branco para manter a senha atual" : "Definir senha inicial de acesso"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#007481] focus:outline-none"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.lgpd_accepted}
                      onChange={e => setFormData({ ...formData, lgpd_accepted: e.target.checked })}
                      className="mt-0.5 rounded text-[#007481] focus:ring-[#007481] w-4 h-4"
                    />
                    <span className="text-xs text-gray-600 leading-tight">
                      <strong>Consentimento LGPD validado:</strong> O cliente autorizou o armazenamento de dados cadastrais e de equipamentos estritamente para ordens de serviço, suporte técnico e garantias (Lei 13.709/2018).
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg font-medium transition-colors flex items-center"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isSaving ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
