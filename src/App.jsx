import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import NewBudget from './pages/NewBudget';
import Clientes from './pages/Clientes';
import Equipamentos from './pages/Equipamentos';
import Modalidades from './pages/Modalidades';
import Templates from './pages/Templates';
import Contratos from './pages/Contratos';
import NovoContrato from './pages/NovoContrato';
import Faturas from './pages/Faturas';

function Placeholder({ title }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-500">Esta página está em construção.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="servicos" element={<NewBudget />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="equipamentos" element={<Equipamentos />} />
          <Route path="modalidades" element={<Modalidades />} />
          <Route path="templates" element={<Templates />} />
          <Route path="contratos" element={<Contratos />} />
          <Route path="contratos/novo" element={<NovoContrato />} />
          <Route path="contratos/editar/:id" element={<NovoContrato />} />
          <Route path="faturas" element={<Faturas />} />
          
          {/* Outras Rotas (Placeholders) */}
          <Route path="disponibilidade" element={<Placeholder title="Disponibilidade" />} />
          <Route path="relatorios" element={<Placeholder title="Relatórios" />} />
          <Route path="suporte" element={<Placeholder title="Suporte" />} />
          <Route path="usuarios" element={<Placeholder title="Gerenciar Usuários" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
