import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const DashboardCard = ({
  title,
  value,
  subvalue,
  icon: Icon,
  variant = 'cyan', // cyan, emerald, crimson, amber, purple
  trend, // { type: 'up' | 'down' | 'neutral', label: '+12% vs last hr' }
  badge,
  onClick,
}) => {
  const variantStyles = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/50',
      glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
      valueColor: 'text-cyan-400',
      lineGradient: 'from-cyan-500/60 to-transparent',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      glow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
      valueColor: 'text-emerald-400',
      lineGradient: 'from-emerald-500/60 to-transparent',
    },
    crimson: {
      border: 'border-rose-500/20 hover:border-rose-500/50',
      glow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.15)]',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
      valueColor: 'text-rose-400',
      lineGradient: 'from-rose-500/60 to-transparent',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/50',
      glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
      valueColor: 'text-amber-400',
      lineGradient: 'from-amber-500/60 to-transparent',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/50',
      glow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]',
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
      valueColor: 'text-purple-400',
      lineGradient: 'from-purple-500/60 to-transparent',
    },
  };

  const current = variantStyles[variant] || variantStyles.cyan;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#0f172a]/90 to-[#0b1120]/90 backdrop-blur-md p-5 border transition-all duration-300 ${
        current.border
      } ${current.glow} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Decorative top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${current.lineGradient}`}></div>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400">
              {title}
            </span>
            {badge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {badge}
              </span>
            )}
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${current.valueColor}`}>
            {value}
          </div>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${current.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subvalue || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
          {subvalue && <span className="text-slate-400">{subvalue}</span>}
          {trend && (
            <div
              className={`flex items-center space-x-1 ${
                trend.type === 'up'
                  ? 'text-emerald-400'
                  : trend.type === 'down'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {trend.type === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend.type === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {trend.type === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              <span>{trend.label}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardCard;
