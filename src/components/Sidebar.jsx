import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  DollarSign, 
  Users, 
  Package, 
  Tags, 
  Wrench, 
  FileBox, 
  Calendar, 
  BarChart, 
  HelpCircle, 
  UserCog, 
  LogOut,
  User,
  Boxes
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const menuPrincipal = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Contratos', path: '/contratos', icon: <FileText size={20} /> },
    { name: 'Faturas', path: '/faturas', icon: <DollarSign size={20} /> },
    { name: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
    { name: 'Equipamentos', path: '/equipamentos', icon: <Package size={20} /> },
    { name: 'Estoque', path: '/estoque', icon: <Boxes size={20} /> },
    { name: 'Modalidades', path: '/modalidades', icon: <Tags size={20} /> },
    { name: 'Serviços', path: '/servicos', icon: <Wrench size={20} /> },
    { name: 'Templates', path: '/templates', icon: <FileBox size={20} /> },
    { name: 'Disponibilidade', path: '/disponibilidade', icon: <Calendar size={20} /> },
    { name: 'Relatórios', path: '/relatorios', icon: <BarChart size={20} /> },
    { name: 'Suporte', path: '/suporte', icon: <HelpCircle size={20} /> },
  ];

  const administracao = [
    { name: 'Gerenciar Usuários', path: '/usuarios', icon: <UserCog size={20} /> },
  ];

  const renderLinks = (links) => {
    return links.map((link) => {
      const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
      
      return (
        <Link 
          key={link.name} 
          to={link.path}
          className={`flex items-center px-4 py-2.5 rounded-lg mb-1 transition-colors ${
            isActive 
              ? 'bg-blue-50 text-blue-600 font-medium' 
              : 'text-blue-500 hover:bg-gray-50'
          }`}
        >
          <span className={`mr-3 ${isActive ? 'text-blue-600' : 'text-blue-400'}`}>
            {link.icon}
          </span>
          {link.name}
        </Link>
      );
    });
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto custom-scrollbar">
      {/* Logo Area */}
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
          <span className="text-blue-600">Clean Tech</span> Smart
        </h2>
      </div>

      {/* Menu Principal */}
      <div className="flex-1 px-4">
        <div className="mb-6">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Menu Principal
          </p>
          <nav>
            {renderLinks(menuPrincipal)}
          </nav>
        </div>

        {/* Administração */}
        <div className="mb-6 border-t border-gray-100 pt-6">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Administração
          </p>
          <nav>
            {renderLinks(administracao)}
          </nav>
        </div>
      </div>

      {/* User Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 mt-auto">
        <div className="flex items-center text-blue-500 px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer mb-2 transition-colors">
          <User size={20} className="mr-3 text-blue-400" />
          <span className="text-sm font-medium truncate">Cristiano Magalhães da Sil...</span>
        </div>
        <button className="w-full flex items-center text-gray-600 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors">
          <LogOut size={20} className="mr-3 text-gray-500" />
          <span className="text-sm font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
