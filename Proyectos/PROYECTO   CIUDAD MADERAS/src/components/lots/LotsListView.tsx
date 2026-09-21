import React, { useState } from 'react';
import { X, Search, Box, Smartphone, MapPin } from 'lucide-react';
import { LOTS_DATA } from '../../data/lotsData';
import { PRIVADAS_LIST } from '../../data/privadasData';
import type { Lot, LotStatus } from '../../types/realEstate';

interface LotsListViewProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLot: (lot: Lot) => void;
  onView3D: (lot: Lot) => void;
  onViewAR: (lot: Lot) => void;
}

export const LotsListView: React.FC<LotsListViewProps> = ({
  isOpen,
  onClose,
  onSelectLot,
  onView3D,
  onViewAR,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LotStatus | 'all'>('all');
  const [privadaFilter, setPrivadaFilter] = useState<number | 'all'>('all');

  if (!isOpen) return null;

  const filteredLots = LOTS_DATA.filter((lot) => {
    const matchesSearch =
      lot.number.toString().includes(search) ||
      lot.privadaName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lot.status === statusFilter;
    const matchesPrivada = privadaFilter === 'all' || lot.privadaId === privadaFilter;
    return matchesSearch && matchesStatus && matchesPrivada;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#071711] border border-emerald-700/50 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-900/60 bg-[#05110d]">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Inventario de Terrenos · Ciudad Maderas Corregidora
            </h2>
            <p className="text-xs text-slate-400">
              Datos ilustrativos y disponibilidad demostrativa
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b border-emerald-900/40 bg-[#081812]/50 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por lote o privada..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#05110d] border border-emerald-800/60 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#05110d] border border-emerald-800/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="all">Todos los estatus</option>
              <option value="disponible">🟢 Disponible</option>
              <option value="apartado">🟡 Apartado</option>
              <option value="vendido">🔴 Vendido</option>
              <option value="proximamente">🔘 Próximamente</option>
            </select>

            {/* Privada Filter */}
            <select
              value={privadaFilter}
              onChange={(e) => setPrivadaFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-[#05110d] border border-emerald-800/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none max-w-[180px]"
            >
              <option value="all">Todas las privadas</option>
              {PRIVADAS_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number}. {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table / List */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          <div className="space-y-2">
            {filteredLots.map((lot) => {
              const statusPill =
                lot.status === 'disponible' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Disponible
                  </span>
                ) : lot.status === 'apartado' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Apartado
                  </span>
                ) : lot.status === 'vendido' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Vendido
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/40">
                    Próximamente
                  </span>
                );

              return (
                <div
                  key={lot.id}
                  className="bg-[#081b14]/70 hover:bg-[#0c261c] border border-emerald-900/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center font-bold text-slate-100">
                      {lot.number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          Lote {lot.number}
                        </span>
                        {statusPill}
                      </div>
                      <p className="text-xs text-slate-400">
                        Privada {lot.privadaName} • {lot.stage} • Orientación {lot.orientation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-900/40">
                    <div className="text-right sm:mr-4">
                      <span className="text-xs text-slate-400 block">Superficie</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {lot.surfaceM2} m²
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectLot(lot);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-teal-300 border border-emerald-700/60 text-xs font-medium flex items-center gap-1"
                        title="Localizar en mapa"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Mapa</span>
                      </button>

                      <button
                        onClick={() => {
                          onView3D(lot);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1 shadow"
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>3D</span>
                      </button>

                      <button
                        onClick={() => {
                          onViewAR(lot);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#081f17] hover:bg-teal-950 text-teal-300 border border-teal-500/50 text-xs font-bold flex items-center gap-1"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>AR</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
