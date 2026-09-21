import React, { useState } from 'react';
import { X, Search, MapPin, Layers } from 'lucide-react';
import { PRIVADAS_LIST } from '../../data/privadasData';
import type { Privada } from '../../types/realEstate';

interface PrivadasListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrivada: (privada: Privada) => void;
  selectedPrivadaId?: number | null;
}

export const PrivadasListModal: React.FC<PrivadasListModalProps> = ({
  isOpen,
  onClose,
  onSelectPrivada,
  selectedPrivadaId,
}) => {
  const [filter, setFilter] = useState('');
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all');

  if (!isOpen) return null;

  const filtered = PRIVADAS_LIST.filter((p) => {
    const matchesName = p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.number.toString().includes(filter);
    const matchesStage = selectedStage === 'all' || p.stage === selectedStage;
    return matchesName && matchesStage;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#071711] border border-emerald-700/50 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/60 bg-[#05110d]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/50 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Privadas Residenciales (45 Clusters)
              </h2>
              <p className="text-xs text-slate-400">
                Master Plan Ciudad Maderas Corregidora
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-emerald-900/40 bg-[#081812]/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre (ej. Aliso, Maple) o número..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-[#05110d] border border-emerald-800/60 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['all', 1, 2, 3, 4] as const).map((stage) => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStage === stage
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                    : 'text-slate-400 hover:text-white bg-[#05110d]'
                }`}
              >
                {stage === 'all' ? 'Todas' : `Etapa ${stage}`}
              </button>
            ))}
          </div>
        </div>

        {/* Privadas Grid */}
        <div className="p-4 overflow-y-auto max-h-[55vh] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filtered.map((privada) => {
            const isSelected = selectedPrivadaId === privada.id;
            return (
              <div
                key={privada.id}
                onClick={() => {
                  onSelectPrivada(privada);
                  onClose();
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-900/40 border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]'
                    : 'bg-[#081b14]/70 border-emerald-900/40 hover:border-emerald-700/70 hover:bg-[#0c221a]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-[11px] font-bold text-emerald-300">
                      {privada.number}
                    </span>
                    <h3 className="text-xs font-bold text-slate-100">
                      {privada.name}
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-slate-300 border border-emerald-900">
                    Etapa {privada.stage}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-emerald-900/40 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{privada.lotCount} Lotes</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {privada.availableCount} Disponibles
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
