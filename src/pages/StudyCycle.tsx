import { Doughnut } from 'react-chartjs-2';
import { 
  Plus, 
  PencilSimple, 
  Play, 
  Stop, 
  ArrowsCounterClockwise 
} from 'phosphor-react';

const StudyCycle = () => {
  const cycleData = {
    labels: ['Matemática', 'Português', 'Biologia', 'História', 'Física', 'Química'],
    datasets: [
      {
        data: [90, 60, 45, 45, 30, 30],
        backgroundColor: [
          '#0e90e9', // Blue
          '#10b981', // Green
          '#f59e0b', // Amber
          '#8b5cf6', // Violet
          '#ef4444', // Red
          '#ec4899', // Pink
        ],
        borderWidth: 0,
        hoverOffset: 12,
      },
    ],
  };

  const subjects = [
    { name: 'Matemática', weight: '1:30h', color: 'bg-primary-500', progress: 65 },
    { name: 'Português', weight: '1:00h', color: 'bg-green-500', progress: 40 },
    { name: 'Biologia', weight: '0:45h', color: 'bg-amber-500', progress: 0 },
    { name: 'História', weight: '0:45h', color: 'bg-violet-500', progress: 0 },
    { name: 'Física', weight: '0:30h', color: 'bg-red-500', progress: 0 },
    { name: 'Química', weight: '0:30h', color: 'bg-pink-500', progress: 0 },
  ];

  return (
    <div className="flex flex-col gap-8 h-full animate-in zoom-in-95 duration-500">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-secondary-900">Ciclo de Estudos</h1>
          <p className="text-secondary-500 text-sm italic">Método de estudo contínuo e equilibrado.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-secondary-50 text-secondary-700 px-4 py-2.5 rounded-xl font-bold shadow-sm hover:bg-secondary-100 transition-all text-sm">
            <ArrowsCounterClockwise size={18} weight="bold" />
            Reiniciar Ciclo
          </button>
          <button className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-100 hover:scale-105 active:scale-95 transition-all text-sm">
            <Plus size={18} weight="bold" />
            Novo Ciclo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
        {/* Visual Cycle - Doughnut Chart */}
        <div className="flex flex-col items-center justify-center bg-white p-8 rounded-2xl border border-secondary-100 shadow-sm relative overflow-hidden group">
          {/* Glass Gradient Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 group-hover:opacity-40 transition-opacity"></div>
          
          <div className="w-full h-80 relative flex items-center justify-center">
            <Doughnut 
              data={cycleData} 
              options={{ 
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: { legend: { display: false } },
              }} 
            />
            {/* Center Text */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xs font-black text-secondary-400 uppercase tracking-widest">Studying</span>
              <span className="text-2xl font-black text-secondary-900">Matemática</span>
              <span className="text-lg font-bold text-primary-500">45:00</span>
            </div>
          </div>
          
          <div className="mt-8 flex gap-4 w-full justify-center">
            <button className="px-8 py-3 bg-primary-500 text-white rounded-xl font-black shadow-lg shadow-primary-100 hover:scale-110 active:scale-95 transition-all flex items-center gap-3">
              <Play size={20} weight="fill" />
              INICIAR CRONÔMETRO
            </button>
          </div>
        </div>

        {/* Subjects Table/Legent */}
        <div className="bg-white p-6 rounded-2xl border border-secondary-100 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-secondary-50 pb-4">
            <h2 className="text-lg font-bold text-secondary-800">Matérias do Ciclo</h2>
            <button className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-all">
              <PencilSimple size={18} weight="bold" />
            </button>
          </div>
          
          <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {subjects.map((subject, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary-50 transition-all border border-transparent hover:border-secondary-100 group">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-10 rounded-full ${subject.color}`}></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-secondary-800 tracking-tight">{subject.name}</span>
                    <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">{subject.weight} alocados</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">{subject.progress}% completado</span>
                  <div className="w-24 h-1.5 bg-secondary-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${subject.color} rounded-full transition-all duration-1000`} 
                      style={{ width: `${subject.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyCycle;
