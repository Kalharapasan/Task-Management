import React from 'react';

const colorMap = {
  slate: 'bg-slate-100 text-slate-700',
  teal: 'bg-teal-100 text-teal-700',
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  rose: 'bg-rose-100 text-rose-700',
};

export default function StatCard({ label, value, icon: Icon, color = 'slate', isLoading }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        {isLoading ? (
          <div className="skeleton-pulse h-7 w-10 mt-1" />
        ) : (
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        )}
      </div>
    </div>
  );
}
