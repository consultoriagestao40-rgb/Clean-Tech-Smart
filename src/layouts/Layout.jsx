import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

function adjustColorBrightness(hex, percent) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt((R * (100 + percent)) / 100);
  G = parseInt((G * (100 + percent)) / 100);
  B = parseInt((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = R > 0 ? R : 0;
  G = G > 0 ? G : 0;
  B = B > 0 ? B : 0;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

function applyTheme(color) {
  const hoverColor = adjustColorBrightness(color, -20);
  const lightColor = adjustColorBrightness(color, 85);
  
  let styleEl = document.getElementById('dynamic-theme-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-theme-style';
    document.head.appendChild(styleEl);
  }
  
  styleEl.innerHTML = `
    /* Override tailwind text colors */
    .text-blue-600 { color: ${color} !important; }
    .text-blue-500 { color: ${color} !important; }
    .text-blue-700 { color: ${hoverColor} !important; }
    .text-blue-400 { color: ${color} !important; opacity: 0.8; }
    
    /* Override tailwind backgrounds */
    .bg-blue-600 { background-color: ${color} !important; }
    .hover\\:bg-blue-700:hover { background-color: ${hoverColor} !important; }
    .bg-blue-50 { background-color: ${lightColor} !important; }
    .hover\\:bg-blue-50:hover { background-color: ${lightColor} !important; }
    .bg-blue-700 { background-color: ${hoverColor} !important; }
    .bg-blue-800 { background-color: ${hoverColor} !important; }
    .bg-blue-900 { background-color: ${hoverColor} !important; }
    
    /* Override tailwind borders and rings */
    .border-blue-500 { border-color: ${color} !important; }
    .border-blue-600 { border-color: ${color} !important; }
    .focus\\:ring-blue-500:focus { --tw-ring-color: ${color} !important; }
    .focus\\:border-blue-500:focus { border-color: ${color} !important; }
    
    /* Custom buttons and print elements */
    .btn-print { color: ${color} !important; }
    .btn-print:hover { background-color: ${lightColor} !important; }
    .print-bar { background-color: ${color} !important; }
    .sumbox { background: linear-gradient(135deg, ${color}, ${hoverColor}) !important; }
    .box-title { color: ${color} !important; }
    .sec { color: ${color} !important; }
    .sec::after { background-color: ${color} !important; opacity: 0.2; }
    thead tr { background-color: ${color} !important; }
  `;
}

export default function Layout() {
  useEffect(() => {
    const handleThemeChange = () => {
      const color = localStorage.getItem('app_theme_color') || '#2563eb'; // default tailwind blue-600
      applyTheme(color);
    };
    
    handleThemeChange();
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
