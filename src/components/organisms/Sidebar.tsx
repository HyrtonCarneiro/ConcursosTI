import { NavLink } from 'react-router-dom';
import { 
  SquaresFour, 
  CalendarBlank, 
  Path, 
  CircleNotch, 
  ArrowClockwise, 
  History, 
  Trophy, 
  ChartLineUp, 
  GearSix,
} from 'phosphor-react';
import Logo from '../atoms/Logo';

const navItems = [
  { path: '/dashboard', label: 'Visão Geral', icon: SquaresFour },
  { path: '/calendario', label: 'Calendário', icon: CalendarBlank },
  { path: '/trilha', label: 'Trilha Semanal', icon: Path },
  { path: '/ciclo', label: 'Ciclo de Estudos', icon: CircleNotch },
  { path: '/revisoes', label: 'Revisões', icon: ArrowClockwise },
  { path: '/historico', label: 'Histórico de Ações', icon: History },
  { path: '/conquistas', label: 'Conquistas', icon: Trophy },
  { path: '/estatisticas', label: 'Estatísticas', icon: ChartLineUp },
];

const Sidebar = () => {
  return (
    <aside className="w-64 h-full bg-white border-r border-secondary-100 flex flex-col shadow-sm">
      {/* Logo Area */}
      <div className="p-6">
        <Logo />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-primary-50 text-primary-600 font-semibold' 
                  : 'text-secondary-500 hover:bg-secondary-50 hover:text-primary-500'
              }`
            }
          >
            <item.icon size={22} weight="duotone" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings / Logout (Bottom) */}
      <div className="p-4 border-t border-secondary-100 mt-auto">
        <NavLink
          to="/config"
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive 
                ? 'bg-primary-50 text-primary-600 font-semibold' 
                : 'text-secondary-500 hover:bg-secondary-50 hover:text-primary-500'
            }`
          }
        >
          <GearSix size={22} weight="duotone" />
          <span className="text-sm">Configurações</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
