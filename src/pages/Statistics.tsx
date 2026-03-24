import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  Clock, 
  CheckCircle, 
  TrendUp, 
  Target 
} from 'phosphor-react';
import KPICard from '../components/molecules/KPICard';

const Statistics = () => {
  // Mock data for Evolution Chart
  const evolutionData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
    datasets: [
      {
        label: 'Horas Estudadas',
        data: [4, 6, 5, 8, 4, 3, 2],
        borderColor: '#0e90e9',
        backgroundColor: 'rgba(14, 144, 233, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Mock data for Distribution Chart (Doughnut)
  const distributionData = {
    labels: ['Matemática', 'Português', 'Biologia', 'História', 'Física'],
    datasets: [
      {
        data: [35, 25, 15, 15, 10],
        backgroundColor: [
          '#0e90e9', // Blue
          '#10b981', // Green
          '#f59e0b', // Amber
          '#8b5cf6', // Violet
          '#ef4444', // Red
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-secondary-900">Estatísticas de Desempenho</h1>
        <p className="text-secondary-500 text-sm">Acompanhe sua evolução e métricas de estudo em tempo real.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total de Horas" 
          value="124h" 
          icon={<Clock size={20} weight="duotone" />} 
          trend={{ value: '12%', isPositive: true }}
        />
        <KPICard 
          title="Média Diária" 
          value="5.4h" 
          icon={<TrendUp size={20} weight="duotone" />} 
          trend={{ value: '0.5h', isPositive: true }}
        />
        <KPICard 
          title="Questões Feitas" 
          value="842" 
          icon={<Target size={20} weight="duotone" />} 
        />
        <KPICard 
          title="Taxa de Acerto" 
          value="78%" 
          icon={<CheckCircle size={20} weight="duotone" />} 
          trend={{ value: '3%', isPositive: true }}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Evolution (Large) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-secondary-100 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-secondary-800">Evolução de Estudos</h2>
          <div className="h-64">
            <Line 
              data={evolutionData} 
              options={{ 
                maintainAspectRatio: false,
                scales: { 
                  y: { beginAtZero: true, grid: { display: false } },
                  x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
        </div>

        {/* Distribution by Subject */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-secondary-100 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-secondary-800">Distribuição por Matéria</h2>
          <div className="h-64 flex items-center justify-center">
            <Doughnut 
              data={distributionData} 
              options={{ 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
                cutout: '70%',
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
