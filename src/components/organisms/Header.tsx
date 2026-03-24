import { Bell, CaretDown, MagnifyingGlass } from 'phosphor-react';

interface HeaderProps {
  projectTitle: string;
  userName: string;
}

const Header = ({ projectTitle, userName }: HeaderProps) => {
  return (
    <header className="h-16 w-full bg-white border-b border-secondary-100 px-6 flex items-center justify-between shadow-sm z-10">
      {/* Project Title (Left) */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-secondary-800">{projectTitle}</h2>
      </div>

      {/* Actions & Profile (Right) */}
      <div className="flex items-center gap-4">
        {/* Search Bar - Optional but good for premium feel */}
        <div className="hidden md:flex items-center bg-secondary-50 border border-secondary-100 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
          <MagnifyingGlass size={18} className="text-secondary-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none outline-none text-sm px-2 text-secondary-600 w-48"
          />
        </div>

        {/* Notifications */}
        <button className="p-2 text-secondary-500 hover:bg-secondary-50 rounded-xl transition-all relative">
          <Bell size={22} weight="duotone" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <button className="flex items-center gap-3 p-1 pl-3 hover:bg-secondary-50 rounded-xl transition-all">
          <span className="text-sm font-medium text-secondary-700 hidden sm:inline">{userName}</span>
          <div className="w-9 h-9 bg-primary-100 text-primary-600 flex items-center justify-center rounded-xl font-bold border border-primary-200 uppercase">
            {userName.charAt(0)}
          </div>
          <CaretDown size={14} className="text-secondary-400" />
        </button>
      </div>
    </header>
  );
};

export default Header;
