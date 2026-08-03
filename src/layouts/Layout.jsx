import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Layout() {
  const token = localStorage.getItem('token');

  if (!token) {
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
      <div className={`flex-1 ${isCollapsed ? 'ml-20' : 'ml-64'} p-8 overflow-y-auto transition-all duration-300`}>
        <Outlet />
      </div>
    </div>
  );
}
