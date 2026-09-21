import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sun,
  Moon,
  Compass,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  List,
  Eye,
} from 'lucide-react';
import { AMENITIES_LIST } from '../../data/amenitiesData';
import { LOTS_DATA } from '../../data/lotsData';
import { PRIVADAS_LIST } from '../../data/privadasData';
import { AmenityPin } from './AmenityPin';
import { StatusLegendBar } from './StatusLegendBar';
import type {
  Lot,
  Amenity,
  Privada,
  LotStatus,
  MasterplanViewMode,
  TimeOfDay,
} from '../../types/realEstate';

interface MasterplanCanvasProps {
  selectedLot: Lot | null;
  onSelectLot: (lot: Lot) => void;
  onSelectAmenity: (amenity: Amenity) => void;
  onOpenPrivadasList: () => void;
  onOpenLotsList: () => void;
  viewMode: MasterplanViewMode;
  onViewModeChange: (mode: MasterplanViewMode) => void;
  timeOfDay: TimeOfDay;
  onToggleTimeOfDay: () => void;
  filterStatus: LotStatus | 'all';
  onFilterStatusChange: (status: LotStatus | 'all') => void;
  activePrivada?: Privada | null;
}

export const MasterplanCanvas: React.FC<MasterplanCanvasProps> = ({
  selectedLot,
  onSelectLot,
  onSelectAmenity,
  onOpenPrivadasList,
  onOpenLotsList,
  viewMode,
  onViewModeChange,
  timeOfDay,
  onToggleTimeOfDay,
  filterStatus,
  onFilterStatusChange,
  activePrivada,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and zoom transform state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);

  const isNight = timeOfDay === 'noche';

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.35, 3.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.35, 0.8));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch gesture handlers (Mobile-First touch pan & pinch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialPinchDistRef.current;
      setZoom((prevZoom) => Math.min(Math.max(prevZoom * factor, 0.8), 3.5));
      initialPinchDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    initialPinchDistRef.current = null;
  };

  // Focus on active privada when changed
  useEffect(() => {
    if (activePrivada) {
      setZoom(1.8);
      // Pan towards privada coords
      setPan({
        x: (50 - activePrivada.coords.x) * 8,
        y: (50 - activePrivada.coords.y) * 6,
      });
    }
  }, [activePrivada]);

  // Filter lots by status
  const visibleLots = LOTS_DATA.filter((lot) => {
    if (filterStatus !== 'all' && lot.status !== filterStatus) return false;
    return true;
  });

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors duration-700 ${
        isNight ? 'bg-[#030b08]' : 'bg-[#071710]'
      }`}
    >
      {/* Dynamic Background Mesh / Satellite Base */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="relative w-[1200px] h-[800px] max-w-none max-h-none pointer-events-auto">
          {/* Real Masterplan Image as High-Resolution Ground */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-emerald-800/30">
            <img
              src="images/masterplan-corregidora.png"
              alt="Masterplan Ciudad Maderas Corregidora"
              className={`w-full h-full object-contain filter transition-all duration-700 ${
                isNight
                  ? 'brightness-[0.7] contrast-125 saturate-125 hue-rotate-15'
                  : 'brightness-[0.92] contrast-105'
              } ${viewMode === 'satelital' ? 'opacity-95' : 'opacity-85'}`}
            />
            {/* Atmospheric overlay */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${
                isNight
                  ? 'bg-gradient-to-b from-blue-950/40 via-emerald-950/30 to-black/60 mix-blend-multiply'
                  : 'bg-gradient-to-t from-emerald-950/20 via-transparent to-transparent'
              }`}
            />
          </div>

          {/* Interactive Amenity Markers */}
          {AMENITIES_LIST.map((amenity) => (
            <AmenityPin
              key={amenity.id}
              amenity={amenity}
              onSelect={onSelectAmenity}
            />
          ))}

          {/* Interactive Lots Layer */}
          {visibleLots.map((lot) => {
            const isSelected = selectedLot?.id === lot.id;
            const statusColor =
              lot.status === 'disponible'
                ? '#10b981'
                : lot.status === 'apartado'
                ? '#eab308'
                : lot.status === 'vendido'
                ? '#ef4444'
                : '#94a3b8';

            return (
              <div
                key={lot.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLot(lot);
                }}
                style={{
                  left: `${lot.coords.x}%`,
                  top: `${lot.coords.y}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
              >
                {/* Lot Dot / Pin */}
                <div className="relative flex items-center justify-center">
                  {isSelected && (
                    <span
                      style={{ borderColor: statusColor }}
                      className="absolute -inset-2 rounded-full border-2 animate-ping"
                    />
                  )}
                  <div
                    style={{
                      backgroundColor: statusColor,
                      boxShadow: isSelected
                        ? `0 0 16px ${statusColor}`
                        : `0 0 8px rgba(0,0,0,0.5)`,
                    }}
                    className={`rounded-full border border-white flex items-center justify-center transition-all ${
                      isSelected
                        ? 'w-6 h-6 scale-125 z-20'
                        : 'w-4 h-4 hover:scale-130'
                    }`}
                  >
                    <span className="text-[8px] font-black text-slate-950">
                      {lot.number}
                    </span>
                  </div>

                  {/* Lot hover label */}
                  <div className="absolute bottom-full mb-1 bg-black/90 text-white text-[10px] px-2 py-0.5 rounded border border-emerald-500/50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                    Lote {lot.number} · {lot.surfaceM2} m²
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Left View Controls (Inspired by Image 1) */}
      <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2">
        <div className="flex items-center bg-[#071711]/90 backdrop-blur-md border border-emerald-800/60 rounded-2xl p-1 shadow-xl">
          <button
            onClick={() => onViewModeChange('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              viewMode === '3d'
                ? 'bg-teal-500/25 text-teal-300 border border-teal-500/60 shadow-[0_0_12px_rgba(20,184,166,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mapa 3D</span>
          </button>
          <button
            onClick={() => onViewModeChange('satelital')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              viewMode === 'satelital'
                ? 'bg-teal-500/25 text-teal-300 border border-teal-500/60 shadow-[0_0_12px_rgba(20,184,166,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vista satelital</span>
          </button>
          <button
            onClick={onOpenLotsList}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide text-slate-400 hover:text-slate-200 transition-all"
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* Top Right Controls (Day/Night & Compass Dial) */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
        {/* Day / Night Toggle Pill */}
        <div className="flex items-center bg-[#071711]/90 backdrop-blur-md border border-emerald-800/60 rounded-2xl p-1 shadow-xl">
          <button
            onClick={onToggleTimeOfDay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              !isNight
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Día</span>
          </button>
          <button
            onClick={onToggleTimeOfDay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isNight
                ? 'bg-blue-500/25 text-blue-300 border border-blue-400/50 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-blue-300" />
            <span>Noche</span>
          </button>
        </div>

        {/* Compass Indicator */}
        <div className="hidden sm:flex flex-col items-center justify-center w-10 h-10 rounded-full bg-[#071711]/90 border border-emerald-800/60 text-slate-300 shadow-xl backdrop-blur-md">
          <span className="text-[10px] font-bold text-teal-400">_N_</span>
          <Compass className="w-4 h-4 text-emerald-400 -mt-0.5" />
        </div>
      </div>

      {/* Territorial Orientation Tags (Image 1 reference) */}
      <div className="hidden md:flex absolute top-16 right-36 z-20 items-center gap-1 text-[11px] font-medium text-slate-300/80 bg-black/40 px-2.5 py-1 rounded-full border border-emerald-800/30 backdrop-blur-sm pointer-events-none">
        <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
        <span>Corregidora, Qro.</span>
      </div>

      <div className="hidden md:flex absolute bottom-20 left-48 z-20 items-center gap-1 text-[11px] font-medium text-slate-300/80 bg-black/40 px-2.5 py-1 rounded-full border border-emerald-800/30 backdrop-blur-sm pointer-events-none">
        <span>Libramiento Sur-Poniente</span>
        <ArrowDownLeft className="w-3.5 h-3.5 text-teal-400" />
      </div>

      {/* Floating Vertical Navigation / Zoom Tools (Left Side) */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2.5 rounded-xl bg-[#071711]/90 hover:bg-emerald-900/60 text-slate-200 border border-emerald-800/60 shadow-xl backdrop-blur-md transition-colors"
          title="Acercar mapa"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 rounded-xl bg-[#071711]/90 hover:bg-emerald-900/60 text-slate-200 border border-emerald-800/60 shadow-xl backdrop-blur-md transition-colors"
          title="Alejar mapa"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2.5 rounded-xl bg-[#071711]/90 hover:bg-emerald-900/60 text-slate-200 border border-emerald-800/60 shadow-xl backdrop-blur-md transition-colors"
          title="Centrar vista"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenPrivadasList}
          className="p-2.5 rounded-xl bg-[#071711]/90 hover:bg-emerald-900/60 text-teal-400 border border-emerald-800/60 shadow-xl backdrop-blur-md transition-colors"
          title="Ver 45 Privadas"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop Quick Reference: 45 Privadas (Image 1 and 2 right overlay) */}
      <div
        onClick={onOpenPrivadasList}
        className="hidden xl:block absolute top-16 right-4 z-20 w-48 max-h-[380px] overflow-y-auto no-scrollbar bg-[#06140f]/90 border border-emerald-800/40 rounded-2xl p-2.5 shadow-2xl backdrop-blur-md cursor-pointer group hover:border-teal-500/40 transition-colors"
      >
        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-emerald-900/50">
          <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300">
            Privadas (45)
          </span>
          <span className="text-[9px] text-slate-400 group-hover:text-white">
            Ver todas →
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-mono text-slate-300">
          {PRIVADAS_LIST.slice(0, 30).map((p) => (
            <div
              key={p.id}
              className="truncate hover:text-teal-300 transition-colors"
            >
              {p.number}. {p.name.toUpperCase()}
            </div>
          ))}
        </div>
        <div className="mt-2 text-center text-[9px] text-emerald-400 font-semibold pt-1 border-t border-emerald-900/40">
          + 15 privadas más
        </div>
      </div>

      {/* Bottom Status Filter Bar */}
      <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-30 flex justify-center">
        <StatusLegendBar
          selectedStatus={filterStatus}
          onSelectStatus={onFilterStatusChange}
        />
      </div>
    </div>
  );
};
