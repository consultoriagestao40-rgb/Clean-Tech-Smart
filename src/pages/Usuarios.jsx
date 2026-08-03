import { useState, useEffect } from 'react';
import { 
  UserPlus, Search, Edit2, Trash2, X, Shield, 
  Mail, Key, User, Loader2, CheckCircle, AlertCircle 
} from 'lucide-react';

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Administrador');

  // Currently logged in user to prevent self-deletion
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/get-users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('Administrador');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // blank to keep unchanged
    setRole(user.role || 'Administrador');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role) {
      alert('Nome, E-mail e Perfil são obrigatórios.');
      return;
    }

    if (!selectedUser && !password.trim()) {
      alert('Senha é obrigatória para novos usuários.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser?.id,
          name,
          email,
          password: password.trim() || null,
          role
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar usuário.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (String(id) === String(loggedInUser.id)) {
      alert('Você não pode excluir o seu próprio usuário logado!');
      return;
    }

    if (!confirm('Deseja realmente excluir este usuário?')) return;

    try {
      const res = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        fetchUsers();
      } else {
        alert('Erro ao excluir usuário.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de rede ao excluir.');
    }
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term)
    );
  });

  const getRoleBadgeClass = (userRole) => {
    switch (userRole) {
      case 'Super Admin':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Administrador':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Técnico':
        return 'bg-slate-50 text-slate-700 border-slate-100';
      case 'Comercial':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Financeiro':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Title Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-xxs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Controle de Usuários e Perfis
          </h1>
          <p className="text-xs text-gray-500 mt-1">Gerencie as credenciais e permissões de acesso ao sistema Clean Tech Smart</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Filter and Table Block */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xxs overflow-hidden">
        
        {/* Search */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou perfil..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
            />
          </div>
          <span className="text-xxs font-black text-slate-400 uppercase tracking-wider">
            Total: {filteredUsers.length} Usuários
          </span>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                <th className="px-6 py-3.5">Nome</th>
                <th className="px-6 py-3.5">E-mail</th>
                <th className="px-6 py-3.5">Perfil / Acesso</th>
                <th className="px-6 py-3.5">Data Cadastro</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                    Nenhum usuário cadastrado encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 text-blue-700 font-extrabold rounded-full flex items-center justify-center text-[11px] uppercase">
                        {u.name.substring(0, 2)}
                      </div>
                      <div>
                        <p>{u.name}</p>
                        {String(u.id) === String(loggedInUser.id) && (
                          <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">Logado (Você)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-semibold">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getRoleBadgeClass(u.role)}`}>
                        {u.role || 'Administrador'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Usuário"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          disabled={String(u.id) === String(loggedInUser.id)}
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40 rounded-lg transition-colors"
                          title={String(u.id) === String(loggedInUser.id) ? "Você não pode deletar a si mesmo" : "Excluir Usuário"}
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
        </div>

      </div>

      {/* User Save Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-slate-50">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Cristiano Godoi"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="Ex: cristiano.godoi@hotmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Profile / Role Dropdown */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Perfil de Acesso</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Super Admin">Super Admin (Acesso Total)</option>
                  <option value="Administrador">Administrador (Mesa Geral)</option>
                  <option value="Técnico">Técnico (Apenas Chamados Móveis)</option>
                  <option value="Comercial">Comercial (Propostas, CRM, Orçamentos)</option>
                  <option value="Financeiro">Financeiro (Faturas, Contratos)</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Senha de Acesso</label>
                  {selectedUser && (
                    <span className="text-[8px] text-slate-400 font-bold uppercase">Deixe em branco para manter</span>
                  )}
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required={!selectedUser}
                    placeholder={selectedUser ? "••••••••" : "Defina a senha"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-3 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-1/2 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {isSaving ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
