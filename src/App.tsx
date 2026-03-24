import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/templates/DashboardLayout';
import Statistics from './pages/Statistics';
import Calendar from './pages/Calendar';
import WeeklyPath from './pages/WeeklyPath';
import StudyCycle from './pages/StudyCycle';
import Reviews from './pages/Reviews';
import ActionHistory from './pages/ActionHistory';
import Achievements from './pages/Achievements';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/estatisticas" replace />} />
        <Route path="dashboard" element={<Navigate to="/estatisticas" replace />} />
        <Route path="calendario" element={<Calendar />} />
        <Route path="trilha" element={<WeeklyPath />} />
        <Route path="ciclo" element={<StudyCycle />} />
        <Route path="revisoes" element={<Reviews />} />
        <Route path="historico" element={<ActionHistory />} />
        <Route path="conquistas" element={<Achievements />} />
        <Route path="estatisticas" element={<Statistics />} />
        <Route path="config" element={<div className="p-8"><h1 className="text-2xl font-bold">Configurações</h1><p>Página em desenvolvimento...</p></div>} />
      </Route>
    </Routes>
  );
}

export default App;
