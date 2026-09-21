import React from 'react';
import {
  X,
  Box,
  Smartphone,
  BedDouble,
  Bath,
  Car,
  Home,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import type { HousingModel } from '../../types/realEstate';

interface HouseDetailModalProps {
  isOpen?: boolean;
  model: HousingModel | null;
  onClose: () => void;
  onView3D: (model: HousingModel) => void;
  onViewAR: (model: HousingModel) => void;
}

export const HouseDetailModal: React.FC<HouseDetailModalProps> = ({
  isOpen = true,
  model,
  onClose,
  onView3D,
  onViewAR,
}) => {
  if (!isOpen || !model) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#071711] border border-emerald-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none">
        {/* Header Preview */}
        <div className="relative h-56 w-full overflow-hidden bg-slate-900 shrink-0">
          <img
            src={model.thumbnail}
            alt={model.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071711] via-black/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-6 right-6">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 mb-1 backdrop-blur-sm">
              {model.category}
            </span>
            <h2 className="text-2xl font-bold text-white tracking-wide">
              {model.name}
            </h2>
            <p className="text-xs text-amber-200/90 italic">
              {model.slogan}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Key Specs Row */}
          <div className="grid grid-cols-4 gap-2 bg-[#091f16]/60 p-3 rounded-xl border border-emerald-900/50 text-center">
            <div>
              <Home className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
              <span className="text-sm font-bold text-white block">{model.surfaceM2} m²</span>
              <span className="text-[10px] text-slate-400">Construcción</span>
            </div>
            <div>
              <BedDouble className="w-4 h-4 mx-auto text-teal-400 mb-1" />
              <span className="text-sm font-bold text-white block">{model.bedrooms}</span>
              <span className="text-[10px] text-slate-400">Recámaras</span>
            </div>
            <div>
              <Bath className="w-4 h-4 mx-auto text-blue-400 mb-1" />
              <span className="text-sm font-bold text-white block">{model.bathrooms}</span>
              <span className="text-[10px] text-slate-400">Baños</span>
            </div>
            <div>
              <Car className="w-4 h-4 mx-auto text-amber-400 mb-1" />
              <span className="text-sm font-bold text-white block">{model.parkingSpaces}</span>
              <span className="text-[10px] text-slate-400">Autos</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1.5">
              Concepto Arquitectónico
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
              {model.description}
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-2">
              Distribución & Acabados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {model.features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 bg-[#081a13]/70 p-2.5 rounded-xl border border-emerald-900/40 text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rooms for 3D Walkthrough */}
          {model.rooms && model.rooms.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-teal-400" />
                <span>Puntos del Recorrido 3D</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {model.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-2 rounded-xl bg-[#081b14] border border-emerald-800/40 text-center"
                  >
                    <span className="text-xs font-bold text-white block truncate">
                      {room.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                      {room.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-emerald-900/60 bg-[#05110d] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onViewAR(model);
                onClose();
              }}
              className="py-2.5 px-4 rounded-xl bg-[#081f17] hover:bg-teal-950 text-teal-300 border border-teal-500/50 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <Smartphone className="w-4 h-4 text-teal-400" />
              <span>Ver en AR</span>
            </button>

            <button
              onClick={() => {
                onView3D(model);
                onClose();
              }}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all"
            >
              <Box className="w-4 h-4 text-slate-950" />
              <span>Recorrer en 3D</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
