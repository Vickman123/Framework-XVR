import React from 'react';
import type { LotStatus } from '../../types/realEstate';

interface StatusLegendBarProps {
  selectedStatus: LotStatus | 'all';
  onSelectStatus: (status: LotStatus | 'all') => void;
  counts?: Record<LotStatus, number>;
}

export const StatusLegendBar: React.FC<StatusLegendBarProps> = ({
  selectedStatus,
  onSelectStatus,
  counts,
}) => {
  const statuses: { id: LotStatus; label: string; color: string; border: string; bg: string }[] = [
    {
      id: 'disponible',
      label: 'Disponible',
      color: 'bg-emerald-500',
      border: 'border-emerald-500/60',
      bg: 'hover:bg-emerald-950/80',
    },
    {
      id: 'apartado',
      label: 'Apartado',
      color: 'bg-amber-400',
      border: 'border-amber-400/60',
      bg: 'hover:bg-amber-950/80',
    },
    {
      id: 'vendido',
      label: 'Vendido',
      color: 'bg-rose-500',
      border: 'border-rose-500/60',
      bg: 'hover:bg-rose-950/80',
    },
    {
      id: 'proximamente',
      label: 'Próximamente',
      color: 'bg-slate-400',
      border: 'border-slate-400/60',
      bg: 'hover:bg-slate-800/80',
    },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 bg-[#06140f]/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-emerald-900/50 shadow-xl overflow-x-auto no-scrollbar select-none">
      <button
        onClick={() => onSelectStatus('all')}
        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold tracking-wide transition-all uppercase ${
          selectedStatus === 'all'
            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Todos
      </button>

      <div className="h-4 w-[1px] bg-emerald-900/60" />

      {statuses.map((item) => {
        const isSelected = selectedStatus === item.id;
        const count = counts ? counts[item.id] : undefined;

        return (
          <button
            key={item.id}
            onClick={() => onSelectStatus(isSelected ? 'all' : item.id)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
              isSelected
                ? `bg-emerald-950/90 text-white border ${item.border} shadow-md`
                : `text-slate-300 ${item.bg}`
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${item.color} shadow-sm shrink-0`} />
            <span className="whitespace-nowrap">{item.label}</span>
            {count !== undefined && (
              <span className="text-[10px] opacity-75 font-mono">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
