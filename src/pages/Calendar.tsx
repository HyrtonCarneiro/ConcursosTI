import { useState } from 'react';
import { 
  CaretLeft, 
  CaretRight, 
  Plus,
  DotsThreeVertical
} from 'phosphor-react';

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState('Julho 2024');
  
  // Mock days (7x5 grid)
  const days = Array.from({ length: 35 }, (_, i) => ({
    day: (i % 31) + 1,
    isCurrentMonth: i >= 0 && i < 31,
    isToday: i === 14,
    events: i === 10 ? [{ title: 'Revisão Física', color: 'bg-red-500' }] : 
             i === 14 ? [{ title: 'Simulado Enem', color: 'bg-primary-500' }] : [],
  }));

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-secondary-900">{currentMonth}</h1>
          <div className="flex items-center bg-white border border-secondary-100 rounded-xl p-1 shadow-sm">
            <button className="p-1.5 hover:bg-secondary-50 rounded-lg text-secondary-600 transition-all">
              <CaretLeft size={18} weight="bold" />
            </button>
            <button className="px-3 py-1.5 hover:bg-secondary-50 rounded-lg text-sm font-bold text-secondary-600 transition-all">
              Hoje
            </button>
            <button className="p-1.5 hover:bg-secondary-50 rounded-lg text-secondary-600 transition-all">
              <CaretRight size={18} weight="bold" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select className="bg-white border border-secondary-100 rounded-xl px-4 py-2 text-sm font-semibold text-secondary-700 outline-none focus:ring-2 focus:ring-primary-100 shadow-sm transition-all">
            <option>Mês</option>
            <option>Semana</option>
            <option>Dia</option>
            <option>Lista</option>
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white border border-secondary-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-secondary-50">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-secondary-400 uppercase tracking-widest bg-secondary-50/30">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="flex-1 grid grid-cols-7">
          {days.map((d, i) => (
            <div 
              key={i} 
              className={`min-h-[100px] p-2 border-r border-b border-secondary-50 last:border-r-0 relative group hover:bg-secondary-50/50 transition-all ${
                !d.isCurrentMonth ? 'bg-secondary-50/30' : ''
              }`}
            >
              <span className={`text-xs font-bold ${
                d.isToday 
                  ? 'bg-primary-500 text-white w-6 h-6 flex items-center justify-center rounded-lg shadow-md' 
                  : d.isCurrentMonth ? 'text-secondary-700' : 'text-secondary-300'
              }`}>
                {d.day}
              </span>

              {/* Events inside cell */}
              <div className="mt-2 space-y-1">
                {d.events.map((event, idx) => (
                  <div 
                    key={idx} 
                    className={`${event.color} text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center justify-between truncate`}
                  >
                    <span>{event.title}</span>
                  </div>
                ))}
              </div>

              {/* Action on hover */}
              <button className="absolute top-2 right-2 p-1 text-secondary-300 opacity-0 group-hover:opacity-100 hover:text-secondary-500 transition-all">
                <Plus size={14} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary-500 text-white rounded-2xl shadow-xl shadow-primary-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20 group">
        <Plus size={28} weight="bold" className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
};

export default Calendar;
