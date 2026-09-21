import React, { useState } from 'react';
import {
  Heart,
  Maximize2,
  Box,
  Smartphone,
  MapPin,
  Share2,
  MoreHorizontal,
  Home,
  Compass,
  Square,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { Lot } from '../../types/realEstate';

interface LotDetailCardProps {
  lot: Lot;
  onClose?: () => void;
  onView3D: (lot: Lot) => void;
  onViewAR: (lot: Lot) => void;
  onShare?: (lot: Lot) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (lotId: string) => void;
  isMobileDrawer?: boolean;
}

export const LotDetailCard: React.FC<LotDetailCardProps> = ({
  lot,
  onClose,
  onView3D,
  onViewAR,
  onShare,
  isFavorite = false,
  onToggleFavorite,
  isMobileDrawer = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShareClick = () => {
    if (onShare) {
      onShare(lot);
    } else if (navigator.share) {
      navigator.share({
        title: `Lote ${lot.number} - Ciudad Maderas Corregidora`,
        text: `Descubre el Lote ${lot.number} (${lot.surfaceM2}m²) en Privada ${lot.privadaName}, Ciudad Maderas Corregidora.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusBadge =
    lot.status === 'disponible' ? (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
        Disponible
      </span>
    ) : lot.status === 'apartado' ? (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/40">
        Apartado
      </span>
    ) : lot.status === 'vendido' ? (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-rose-500/20 text-rose-300 border border-rose-500/40">
        Vendido
      </span>
    ) : (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-slate-500/20 text-slate-300 border border-slate-500/40">
        Próximamente
      </span>
    );

  return (
    <div
      className={`bg-[#05130e]/95 backdrop-blur-xl border border-emerald-800/50 shadow-2xl overflow-hidden select-none flex flex-col justify-between ${
        isMobileDrawer
          ? 'w-full rounded-t-3xl p-5 border-b-0 max-h-[85vh] overflow-y-auto'
          : 'w-80 rounded-2xl p-4'
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Lote {lot.number}
            </h2>
            {statusBadge}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleFavorite && onToggleFavorite(lot.id)}
              className={`p-1.5 rounded-full transition-colors ${
                isFavorite
                  ? 'text-rose-400 bg-rose-950/40'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Subtitle / Privada & Stage */}
        <p className="text-xs text-slate-400 font-medium">
          Privada: <span className="text-slate-200 font-semibold">{lot.privadaName}</span> • {lot.stage}
        </p>

        {/* Image Preview with Zoom icon */}
        <div className="relative h-36 w-full rounded-xl overflow-hidden border border-emerald-900/60 group">
          <img
            src={lot.image}
            alt={`Lote ${lot.number}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <button
            onClick={() => onView3D(lot)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
            title="Ampliar vista"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-2 left-2 text-[10px] text-emerald-300 font-medium bg-black/60 px-2 py-0.5 rounded-full border border-emerald-700/40 backdrop-blur-sm">
            Vista perimetral simulada
          </div>
        </div>

        {/* Specifications 2x2 Grid (Image 1 reference) */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Superficie */}
          <div className="bg-[#081b14]/70 p-2.5 rounded-xl border border-emerald-900/50">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
              <Home className="w-3 h-3 text-emerald-400" />
              <span>Superficie</span>
            </div>
            <div className="text-sm font-bold text-slate-100">
              {lot.surfaceM2} m²
            </div>
          </div>

          {/* Tipo */}
          <div className="bg-[#081b14]/70 p-2.5 rounded-xl border border-emerald-900/50">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
              <ShieldCheck className="w-3 h-3 text-teal-400" />
              <span>Tipo</span>
            </div>
            <div className="text-sm font-bold text-slate-100">
              {lot.type}
            </div>
          </div>

          {/* Orientación */}
          <div className="bg-[#081b14]/70 p-2.5 rounded-xl border border-emerald-900/50">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
              <Compass className="w-3 h-3 text-amber-300" />
              <span>Orientación</span>
            </div>
            <div className="text-sm font-bold text-slate-100">
              {lot.orientation}
            </div>
          </div>

          {/* Forma */}
          <div className="bg-[#081b14]/70 p-2.5 rounded-xl border border-emerald-900/50">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
              <Square className="w-3 h-3 text-blue-400" />
              <span>Forma</span>
            </div>
            <div className="text-sm font-bold text-slate-100">
              {lot.shape}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons (Image 1 reference) */}
        <div className="space-y-2 pt-1">
          {/* Ver en 3D (Gold / Warm Accent) */}
          <button
            onClick={() => onView3D(lot)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Box className="w-4 h-4 text-slate-950" />
            <span>Ver en 3D</span>
          </button>

          {/* Ver en AR (Teal border / Dark transparent) */}
          <button
            onClick={() => onViewAR(lot)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#081f17]/80 hover:bg-teal-950/60 border border-teal-500/50 hover:border-teal-400 text-teal-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
          >
            <Smartphone className="w-4 h-4 text-teal-400" />
            <span>Ver en AR</span>
          </button>
        </div>

        {/* Secondary Actions Bar (Image 1 reference) */}
        <div className="pt-2 border-t border-emerald-900/50 flex items-center justify-between text-[11px] text-slate-300">
          <button
            onClick={() => {
              alert(`Ubicación: Lote ${lot.number}, Privada ${lot.privadaName}, Ciudad Maderas Corregidora.`);
            }}
            className="flex items-center gap-1 hover:text-teal-300 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ver ubicación</span>
          </button>

          <button
            onClick={handleShareClick}
            className="flex items-center gap-1 hover:text-teal-300 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-teal-400" />
            <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
          </button>

          <button
            onClick={() => onView3D(lot)}
            className="flex items-center gap-1 hover:text-teal-300 transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Más info</span>
          </button>
        </div>
      </div>
    </div>
  );
};
