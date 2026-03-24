import { useState } from 'react';
import { 
  Check, 
  Clock, 
  CalendarCheck, 
  ListChecks, 
  ArrowClockwise,
  WarningOctagon
} from 'phosphor-react';

const Reviews = () => {
  const [filter, setFilter] = useState('Hoje');

  const reviews = [
    { id: 1, status: 'Pendente', subject: 'Matemática', topic: 'Logaritmos', type: '24h', date: '24/03/2026', color: 'text-primary-500' },
    { id: 2, status: 'Atrasada', subject: 'Biologia', topic: 'Genética', type: '7d', date: '21/03/2026', color: 'text-red-500' },
    { id: 3, status: 'Pendente', subject: 'Português', topic: 'Concordância Nominal', type: '30d', date: '24/03/2026', color: 'text-green-500' },
    { id: 4, status: 'Pendente', subject: 'Física', topic: 'Eletrostática', type: '24h', date: '25/03/2026', color: 'text-amber-500' },
  ];

  const filteredReviews = filter === 'Hoje' 
    ? reviews.filter(r => r.date === '24/03/2026') 
    : filter === 'Atrasadas' 
    ? reviews.filter(r => r.status === 'Atrasada')
    : reviews;

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in duration-500">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-secondary-900 flex items-center gap-3">
            <ArrowClockwise size={28} className="text-primary-500" />
            Minhas Revisões
          </h1>
          <p className="text-secondary-500 text-sm">Gerencie seus ciclos de revisão espaçada.</p>
        </div>

        {/* Tab Filters */}
        <div className="bg-secondary-50 p-1 rounded-xl flex items-center gap-1 shadow-inner border border-secondary-100">
          {['Hoje', 'Atrasadas', 'Próximas'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === f 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-secondary-400 hover:text-secondary-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Small */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 flex items-center gap-4">
          <div className="p-2 bg-white rounded-lg text-primary-500 shadow-sm">
            <ListChecks size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest leading-none">Para Hoje</span>
            <div className="text-xl font-black text-primary-700">12 revisões</div>
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-4">
          <div className="p-2 bg-white rounded-lg text-red-500 shadow-sm">
            <WarningOctagon size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none">Atrasadas</span>
            <div className="text-xl font-black text-red-700">3 pendentes</div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-4">
          <div className="p-2 bg-white rounded-lg text-green-500 shadow-sm">
            <CalendarCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest leading-none">Concluídas</span>
            <div className="text-xl font-black text-green-700">85 totais</div>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="flex-1 bg-white border border-secondary-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-secondary-50/50 border-b border-secondary-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Matéria</th>
                <th className="px-6 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Tópico</th>
                <th className="px-6 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50">
              {filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-secondary-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${review.status === 'Atrasada' ? 'bg-red-500 animate-pulse' : 'bg-primary-500'}`}></div>
                      <span className={`text-xs font-bold ${review.status === 'Atrasada' ? 'text-red-600' : 'text-primary-600'}`}>{review.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-secondary-800">{review.subject}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-secondary-600">{review.topic}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-1 rounded-lg bg-secondary-50 text-secondary-500 text-[10px] font-black uppercase tracking-widest border border-secondary-100">
                      {review.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 bg-primary-100 text-primary-600 rounded-xl hover:bg-primary-500 hover:text-white shadow-sm transition-all">
                      <Check size={18} weight="bold" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredReviews.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="p-4 bg-secondary-50 rounded-full text-secondary-200">
                <ListChecks size={48} weight="duotone" />
              </div>
              <div>
                <h3 className="text-lg font-black text-secondary-800">Tudo em dia!</h3>
                <p className="text-sm text-secondary-400 font-medium">Você não possui revisões pendentes para este filtro.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
