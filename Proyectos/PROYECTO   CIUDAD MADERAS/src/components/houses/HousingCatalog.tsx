import React from 'react';
import {
  Home,
  BedDouble,
  Bath,
  Car,
  Box,
  Smartphone,
  Eye,
  Sparkles,
} from 'lucide-react';
import { HOUSING_MODELS } from '../../data/housingModelsData';
import type { HousingModel } from '../../types/realEstate';

interface HousingCatalogProps {
  onSelectModel: (model: HousingModel) => void;
  onView3D: (model: HousingModel) => void;
  onViewAR: (model: HousingModel) => void;
}

export const HousingCatalog: React.FC<HousingCatalogProps> = ({
  onSelectModel,
  onView3D,
  onViewAR,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 select-none">
      {/* Title & Introduction */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-emerald-900/40 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-teal-400">
            Arquitectura & Diseño
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Modelos de Vivienda · Ciudad Maderas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Prototipos arquitectónicos contemporáneos diseñados para integrarse en las privadas de Ciudad Maderas Corregidora.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-200/90 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-full shrink-0">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Visor 3D y WebXR disponible</span>
        </div>
      </div>

      {/* Grid of House Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {HOUSING_MODELS.map((model) => (
          <div
            key={model.id}
            className="group bg-[#06140f]/90 border border-emerald-800/40 hover:border-teal-400/60 rounded-2xl overflow-hidden shadow-xl hover:shadow-[0_10px_30px_rgba(20,184,166,0.15)] flex flex-col justify-between transition-all duration-300"
          >
            <div>
              {/* Thumbnail with Badge */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src={model.thumbnail}
                  alt={model.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Category Badge */}
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 backdrop-blur-sm">
                  {model.category}
                </span>

                {/* Surface Tag */}
                <span className="absolute bottom-3 left-3 text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded-lg border border-white/20 backdrop-blur-sm">
                  {model.surfaceM2} m² Construcción
                </span>
              </div>

              {/* Card Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                    {model.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 italic">
                    {model.slogan}
                  </p>
                </div>

                {/* Specifications Row */}
                <div className="grid grid-cols-4 gap-1 text-[11px] text-slate-300 bg-[#081b14]/70 p-2 rounded-xl border border-emerald-900/40 text-center">
                  <div>
                    <Home className="w-3.5 h-3.5 mx-auto text-emerald-400 mb-0.5" />
                    <span className="font-semibold block">{model.levels}</span>
                    <span className="text-[9px] text-slate-400">Niveles</span>
                  </div>
                  <div>
                    <BedDouble className="w-3.5 h-3.5 mx-auto text-teal-400 mb-0.5" />
                    <span className="font-semibold block">{model.bedrooms}</span>
                    <span className="text-[9px] text-slate-400">Recámaras</span>
                  </div>
                  <div>
                    <Bath className="w-3.5 h-3.5 mx-auto text-blue-400 mb-0.5" />
                    <span className="font-semibold block">{model.bathrooms}</span>
                    <span className="text-[9px] text-slate-400">Baños</span>
                  </div>
                  <div>
                    <Car className="w-3.5 h-3.5 mx-auto text-amber-400 mb-0.5" />
                    <span className="font-semibold block">{model.parkingSpaces}</span>
                    <span className="text-[9px] text-slate-400">Autos</span>
                  </div>
                </div>

                {/* Brief description */}
                <p className="text-xs text-slate-400 line-clamp-2">
                  {model.description}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 pt-0 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Ver en 3D */}
                <button
                  onClick={() => onView3D(model)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow transition-all hover:scale-[1.02]"
                >
                  <Box className="w-3.5 h-3.5 text-slate-950" />
                  <span>Ver 3D</span>
                </button>

                {/* Ver en AR */}
                <button
                  onClick={() => onViewAR(model)}
                  className="w-full py-2 px-3 rounded-xl bg-[#081f17] hover:bg-teal-950 text-teal-300 border border-teal-500/50 hover:border-teal-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  <Smartphone className="w-3.5 h-3.5 text-teal-400" />
                  <span>Ver AR</span>
                </button>
              </div>

              {/* Ver Detalles */}
              <button
                onClick={() => onSelectModel(model)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#081912] hover:bg-emerald-950/70 border border-emerald-900/40 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver detalles & planos</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
