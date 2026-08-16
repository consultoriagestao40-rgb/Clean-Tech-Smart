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
import Estoque from './pages/Estoque';
import Chamados from './pages/Chamados';
import Tecnicos from './pages/Tecnicos';
import Crm from './pages/Crm';
import Configuracoes from './pages/Configuracoes';
import TabelaLocacao from './pages/TabelaLocacao';
import ModelosMaquinas from './pages/ModelosMaquinas';
import PropostasLocacao from './pages/PropostasLocacao';
import PropostasVenda from './pages/PropostasVenda';
import PropostasServicos from './pages/PropostasServicos';
import VisualizarPropostaPublica from './pages/VisualizarPropostaPublica';
import VisualizarPropostaVendaPublica from './pages/VisualizarPropostaVendaPublica';
import VisualizarPropostaServicoPublica from './pages/VisualizarPropostaServicoPublica';
import VisualizarOrcamentoPublico from './pages/VisualizarOrcamentoPublico';
import TecnicoPainel from './pages/TecnicoPainel';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';
import LpTennantA260 from './pages/LpTennantA260';
import ConfigurarLpTennantA260 from './pages/ConfigurarLpTennantA260';

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
          <Route path="crm" element={<Crm />} />
          <Route path="faturas" element={<Faturas />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="chamados" element={<Chamados />} />
          <Route path="tecnicos" element={<Tecnicos />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="configurar-lp-a260" element={<ConfigurarLpTennantA260 />} />
          <Route path="marketing-lp" element={<ConfigurarLpTennantA260 />} />
          <Route path="tabela-locacao" element={<TabelaLocacao />} />
          <Route path="modelos-maquinas" element={<ModelosMaquinas />} />
          <Route path="proposta-locacao" element={<PropostasLocacao />} />
          <Route path="proposta-venda" element={<PropostasVenda />} />
          <Route path="proposta-servico" element={<PropostasServicos />} />
          
          {/* Outras Rotas (Placeholders) */}
          <Route path="disponibilidade" element={<Placeholder title="Disponibilidade" />} />
          <Route path="relatorios" element={<Placeholder title="Relatórios" />} />
          <Route path="suporte" element={<Placeholder title="Suporte" />} />
          <Route path="usuarios" element={<Usuarios />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/visualizar-proposta/:id" element={<VisualizarPropostaPublica />} />
        <Route path="/visualizar-proposta-venda/:id" element={<VisualizarPropostaVendaPublica />} />
        <Route path="/visualizar-proposta-servico/:id" element={<VisualizarPropostaServicoPublica />} />
        <Route path="/visualizar-orcamento/:id" element={<VisualizarOrcamentoPublico />} />
        <Route path="/tecnico" element={<TecnicoPainel />} />
        
        {/* Landing Pages Públicas de Alta Conversão */}
        <Route path="/lp/tennant-a260" element={<LpTennantA260 />} />
        <Route path="/tennant-a260" element={<LpTennantA260 />} />
        <Route path="/lavadora-tennant-a260" element={<LpTennantA260 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
