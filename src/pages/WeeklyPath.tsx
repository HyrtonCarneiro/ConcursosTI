import { 
  Plus, 
  Check, 
  PencilSimple, 
  Trash,
  DotsThreeVertical,
  CaretLeft,
  CaretRight
} from 'phosphor-react';

const WeeklyPath = () => {
  const weekDays = [
    { day: 'Segunda', date: '15 Jul', tasks: [
      { id: 1, subject: 'Matemática', title: 'Logaritmos e Exponenciais', color: 'bg-primary-500' },
      { id: 2, subject: 'Biologia', title: 'Citologia e Membrana', color: 'bg-green-500' }
    ]},
    { day: 'Terça', date: '16 Jul', tasks: [
      { id: 3, subject: 'História', title: 'Revolução Francesa', color: 'bg-violet-500' }
    ]},
    { day: 'Quarta', date: '17 Jul', tasks: [
      { id: 4, subject: 'Física', title: 'Cinemática Vetorial', color: 'bg-red-500' },
      { id: 5, subject: 'Português', title: 'Sintaxe da Oração', color: 'bg-emerald-500' }
    ]},
    { day: 'Quinta', date: '18 Jul', tasks: [] },
    { day: 'Sexta', date: '19 Jul', tasks: [] },
    { day: 'Sábado', date: '20 Jul', tasks: [] },
    { day: 'Domingo', date: '21 Jul', tasks: [] },
  ];

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-secondary-900">Minha Trilha</h1>
          <div className="flex items-center gap-2 text-secondary-400 text-sm font-semibold">
            <CaretLeft size={14} weight="bold" />
            <span>15 de Jul - 21 de Jul</span>
            <CaretRight size={14} weight="bold" />
          </div>
        </div>
        
        <button className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-100 hover:scale-105 active:scale-95 transition-all text-sm">
          <Plus size={18} weight="bold" />
          Nova Atividade
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full min-w-max">
          {weekDays.map((column, idx) => (
            <div key={idx} className="w-80 flex flex-col gap-3 bg-secondary-50/50 p-3 rounded-2xl border border-secondary-50 h-full">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-secondary-800 uppercase tracking-tight">{column.day}</span>
                  <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">{column.date}</span>
                </div>
                <button className="p-1 hover:bg-white rounded-lg text-secondary-300 hover:text-secondary-500 transition-all">
                  <Plus size={16} weight="bold" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                {column.tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="bg-white p-4 rounded-xl shadow-sm border border-secondary-100 flex flex-col gap-2 group hover:border-primary-200 hover:shadow-md transition-all relative overflow-hidden"
                  >
                    {/* Color bar indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${task.color}`}></div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-opacity-10 ${task.color.replace('bg-', 'text-')} bg-current`}>
                        {task.subject}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:bg-green-50 text-green-500 rounded-lg">
                          <Check size={14} weight="bold" />
                        </button>
                        <button className="p-1 hover:bg-secondary-50 text-secondary-300 rounded-lg">
                          <PencilSimple size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-bold text-secondary-800 leading-tight">
                      {task.title}
                    </h4>
                  </div>
                ))}

                {column.tasks.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-secondary-100 rounded-xl p-6 text-center">
                    <span className="text-xs text-secondary-300 font-medium">Nenhuma atividade</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyPath;
