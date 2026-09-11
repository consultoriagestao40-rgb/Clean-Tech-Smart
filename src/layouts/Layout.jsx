import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PortalCliente from '../pages/PortalCliente';
import { Wrench, FileText, LogOut, Menu, X, ShieldCheck } from 'lucide-react';

export default function Layout() {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forcePortal = searchParams.get('portal') === 'true';

  // Responsive state for mobile PWA view (Jaime / Field Technicians)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Public portal routing protection
  const isPublicPortalRoute = 
    location.pathname === '/chamado' || 
    location.pathname === '/chamado/' ||
    location.pathname === '/chamados' || 
    location.pathname === '/chamados/' ||
    location.pathname.startsWith('/portal') ||
    location.pathname.startsWith('/abrir-chamado');

  if (!token || forcePortal) {
    if (isPublicPortalRoute) {
      return <PortalCliente />;
    }
    return <Navigate to="/login" replace />;
  }

  // Auto-redirect to technician panel on mobile if landing on root or dashboard
  if (isMobile && (location.pathname === '/' || location.pathname === '/dashboard')) {
    return <Navigate to="/tecnico" replace />;
  }

  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('sidebar_collapsed') === 'true');

  useEffect(() => {
    const handleCollapseChange = () => {
      setIsCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
    };
    
    window.addEventListener('sidebarCollapsedChanged', handleCollapseChange);
    return () => window.removeEventListener('sidebarCollapsedChanged', handleCollapseChange);
  }, []);

  const loggedInUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{"name": "Usuário"}');
    } catch {
      return { name: "Usuário" };
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isTecnicoActive = location.pathname === '/tecnico';
  const isOrcamentoActive = location.pathname === '/servicos';

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 min-h-screen">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Header (PWA Mode for Technicians) */}
      {isMobile && (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <img 
              src="/cleantechpro-official-logo.png" 
              alt="Clean Tech Pro" 
              className="h-7 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3 text-blue-800" />
              <span className="text-[10px] font-black text-blue-900 tracking-wider">TENNANT</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate">
              {loggedInUser.name.split(' ')[0]}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 transition-all duration-300 overflow-x-hidden ${
        isMobile 
          ? 'w-full p-2 pb-24' 
          : `${isCollapsed ? 'ml-20' : 'ml-64'} p-4 md:p-8`
      }`}>
        <Outlet />
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Technician / Field Mode) */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-2xl safe-area-bottom">
          <Link
            to="/tecnico"
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all ${
              isTecnicoActive
                ? 'bg-blue-900 text-white font-black shadow-md'
                : 'text-slate-600 hover:bg-slate-100 font-bold'
            }`}
          >
            <Wrench className={`w-5 h-5 ${isTecnicoActive ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className="text-[11px] mt-0.5">Atender Chamados</span>
          </Link>

          <div className="w-[1px] h-8 bg-slate-200 mx-1" />

          <Link
            to="/servicos"
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all ${
              isOrcamentoActive
                ? 'bg-[#eb6420] text-white font-black shadow-md'
                : 'text-slate-600 hover:bg-slate-100 font-bold'
            }`}
          >
            <FileText className={`w-5 h-5 ${isOrcamentoActive ? 'text-white' : 'text-slate-500'}`} />
            <span className="text-[11px] mt-0.5">Fazer Orçamento</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
