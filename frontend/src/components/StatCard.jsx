import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  colorScheme = 'beauty', // 'beauty', 'emerald', 'amber', 'purple', 'rose'
}) {
  const colorStyles = {
    beauty: {
      bg: 'bg-white',
      border: 'border-rose-100',
      iconBg: 'bg-rose-50 text-beauty-600 border-rose-100',
      valueColor: 'text-slate-900',
    },
    emerald: {
      bg: 'bg-white',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      valueColor: 'text-emerald-950',
    },
    amber: {
      bg: 'bg-white',
      border: 'border-amber-100',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      valueColor: 'text-amber-950',
    },
    purple: {
      bg: 'bg-white',
      border: 'border-purple-100',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      valueColor: 'text-purple-950',
    },
    rose: {
      bg: 'bg-white',
      border: 'border-rose-100',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      valueColor: 'text-rose-950',
    },
  };

  const style = colorStyles[colorScheme] || colorStyles.beauty;

  return (
    <div className={`p-5 rounded-2xl ${style.bg} border ${style.border} shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
          <h3 className={`text-xl sm:text-2xl font-bold mt-1.5 tracking-tight ${style.valueColor}`}>{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl border ${style.iconBg} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-semibold px-2 py-0.5 rounded-md ${
                trendPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
