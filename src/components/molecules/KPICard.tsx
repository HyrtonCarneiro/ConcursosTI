import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const KPICard = ({ title, value, icon, trend }: KPICardProps) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-secondary-100 flex flex-col gap-3 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">{title}</span>
        <div className="p-2 bg-primary-50 text-primary-500 rounded-xl">
          {icon}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-black text-secondary-900">{value}</h3>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
            trend.isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
    </div>
  );
};

export default KPICard;
