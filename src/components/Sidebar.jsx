import { useState, useEffect } from 'react';
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
  Boxes,
  ClipboardList,
  Kanban,
  Settings,
  Coins,
  ChevronLeft,
  ChevronRight,
  Layout
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const [logo, setLogo] = useState(localStorage.getItem('app_company_logo') || '');
  const [zoom, setZoom] = useState(parseInt(localStorage.getItem('app_company_logo_zoom') || '100', 10));
  
  // Collapse State
  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('sidebar_collapsed') === 'true');

  useEffect(() => {
    const handleLogoChange = () => {
      setLogo(localStorage.getItem('app_company_logo') || '');
      setZoom(parseInt(localStorage.getItem('app_company_logo_zoom') || '100', 10));
    };
    window.addEventListener('logoChanged', handleLogoChange);
    return () => window.removeEventListener('logoChanged', handleLogoChange);
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
    window.dispatchEvent(new Event('sidebarCollapsedChanged'));
  };

  const menuPrincipal = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Contratos', path: '/contratos', icon: <FileText size={20} /> },
    { name: 'Proposta Locação', path: '/proposta-locacao', icon: <FileText size={20} /> },
    { name: 'CRM', path: '/crm', icon: <Kanban size={20} /> },
    { name: 'Faturas', path: '/faturas', icon: <DollarSign size={20} /> },
    { name: 'Clientes', path: '/clientes', icon: <Users size={20} /> },
    { name: 'Técnicos', path: '/tecnicos', icon: <User size={20} /> },
    { name: 'Equipamentos', path: '/equipamentos', icon: <Package size={20} /> },
    { name: 'Tabela Locação', path: '/tabela-locacao', icon: <Coins size={20} /> },
    { name: 'Catálogo Máquinas', path: '/modelos-maquinas', icon: <Layout size={20} /> },
    { name: 'Estoque', path: '/estoque', icon: <Boxes size={20} /> },
    { name: 'Chamados', path: '/chamados', icon: <ClipboardList size={20} /> },
    { name: 'Modalidades', path: '/modalidades', icon: <Tags size={20} /> },
    { name: 'Templates', path: '/templates', icon: <FileBox size={20} /> },
    { name: 'Disponibilidade', path: '/disponibilidade', icon: <Calendar size={20} /> },
    { name: 'Relatórios', path: '/relatorios', icon: <BarChart size={20} /> },
    { name: 'Suporte', path: '/suporte', icon: <HelpCircle size={20} /> },
  ];

  const administracao = [
    { name: 'Configurações', path: '/configuracoes', icon: <Settings size={20} /> },
    { name: 'Gerenciar Usuários', path: '/usuarios', icon: <UserCog size={20} /> },
  ];

  const renderLinks = (links) => {
    return links.map((link) => {
      const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
      
      return (
        <Link 
          key={link.name} 
          to={link.path}
          className={`flex items-center px-4 py-2.5 rounded-lg mb-1 transition-all ${
            isCollapsed ? 'justify-center' : ''
          } ${
            isActive 
              ? 'bg-blue-50 text-blue-600 font-medium' 
              : 'text-blue-500 hover:bg-gray-50'
          }`}
          title={isCollapsed ? link.name : ''}
        >
          <span className={`${isCollapsed ? 'mr-0' : 'mr-3'} ${isActive ? 'text-blue-600' : 'text-blue-400'} transition-all`}>
            {link.icon}
          </span>
          {!isCollapsed && <span className="truncate text-sm">{link.name}</span>}
        </Link>
      );
    });
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto custom-scrollbar transition-all duration-300 z-40`}>
      
      {/* Collapse Toggle Button */}
      <button 
        onClick={toggleCollapse}
        className="absolute top-6 -right-3 bg-white border border-gray-300 rounded-full p-1 cursor-pointer hover:bg-gray-100 shadow-sm text-gray-500 hover:text-gray-700 z-50 transition-transform duration-200"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo Area */}
      <div className="px-4 py-4 min-h-[96px] flex items-center justify-center border-b border-gray-100 mb-4 overflow-hidden">
        {logo ? (
          <img 
            src={logo} 
            alt="Logo" 
            className="max-h-16 w-auto max-w-full object-contain transition-all" 
            style={{ 
              transform: `scale(${(isCollapsed ? 0.7 : 1) * (zoom / 100)})`, 
              transition: 'transform 0.1s' 
            }} 
          />
        ) : (
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight text-center w-full transition-all">
            {isCollapsed ? (
              <span className="text-blue-600 font-extrabold text-xl">CT</span>
            ) : (
              <>
                <span className="text-blue-600">Clean Tech</span> Smart
              </>
            )}
          </h2>
        )}
      </div>

      {/* Menu Principal */}
      <div className="flex-1 px-4">
        <div className="mb-6">
          {isCollapsed ? (
            <div className="border-t border-gray-100 my-4" />
          ) : (
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Menu Principal
            </p>
          )}
          <nav>
            {renderLinks(menuPrincipal)}
          </nav>
        </div>

        {/* Administração */}
        <div className="mb-6 border-t border-gray-100 pt-6">
          {isCollapsed ? (
            <div className="border-t border-gray-100 my-4" />
          ) : (
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Administração
            </p>
          )}
          <nav>
            {renderLinks(administracao)}
          </nav>
        </div>
      </div>

      {/* User Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 mt-auto">
        <div className={`flex items-center text-blue-500 px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer mb-2 transition-colors ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? 'Cristiano Magalhães da Silva' : ''}>
          <User size={20} className={`${isCollapsed ? 'mr-0' : 'mr-3'} text-blue-400`} />
          {!isCollapsed && <span className="text-sm font-medium truncate">Cristiano Magalhães...</span>}
        </div>
        
        <button className={`w-full flex items-center text-gray-600 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : ''}`} title={isCollapsed ? 'Sair' : ''}>
          <LogOut size={20} className={`${isCollapsed ? 'mr-0' : 'mr-3'} text-gray-500`} />
          {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
