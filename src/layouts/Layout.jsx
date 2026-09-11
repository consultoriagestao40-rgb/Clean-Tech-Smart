import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PortalCliente from '../pages/PortalCliente';

export default function Layout() {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const forcePortal = searchParams.get('portal') === 'true';

  if (!token || forcePortal) {
    if (location.pathname === '/chamados' || location.pathname === '/chamados/') {
      return <PortalCliente />;
    }
    return <Navigate to="/login" replace />;
  }
  const [isCollapsed, setIsCollapsed] = useState(localStorage.getItem('sidebar_collapsed') === 'true');

  useEffect(() => {
    const handleCollapseChange = () => {
      setIsCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
    };
    
    window.addEventListener('sidebarCollapsedChanged', handleCollapseChange);
    return () => window.removeEventListener('sidebarCollapsedChanged', handleCollapseChange);
  }, []);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className={`flex-1 min-w-0 ${isCollapsed ? 'ml-20' : 'ml-64'} p-4 md:p-8 transition-all duration-300 overflow-x-hidden`}>
        <Outlet />
      </div>
    </div>
  );
}
