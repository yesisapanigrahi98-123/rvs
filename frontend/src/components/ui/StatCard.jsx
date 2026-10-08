import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  color = 'cyan',
  loading = false 
}) => {
  if (loading) {
    return (
      <div className={`stat-card color-${color} loading`}>
        <div className="stat-skeleton" />
        <div className="stat-skeleton" style={{ width: '60%' }} />
        <div className="stat-skeleton" style={{ width: '40%' }} />
      </div>
    );
  }

  return (
    <div className={`stat-card color-${color}`}>
      <div className="stat-header">
        <div className={`stat-icon color-${color}`}>
          {Icon && <Icon className="w-5 h-5" aria-hidden="true" />}
        </div>
        {trend && (
          <div className={`stat-trend ${trendUp ? 'trend-up' : 'trend-down'} color-${color}`}>
            {trendUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        <span className="stat-label">{label}</span>
        <span className="stat-glow-bar" />
      </div>
    </div>
  );
};

export default StatCard;