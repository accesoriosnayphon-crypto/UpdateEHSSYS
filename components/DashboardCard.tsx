
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, colorClass }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-medium-text">{title}</p>
        <p className="text-3xl font-bold text-dark-text">{value}</p>
      </div>
      <div className={`p-4 rounded-full ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
};

export default DashboardCard;