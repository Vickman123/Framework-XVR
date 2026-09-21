import React from 'react';
import {
  Map,
  Layers,
  Building2,
  TreePine,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { CIUDAD_MADERAS_CORREGIDORA } from '../../data/developmentData';
import { AMENITIES_LIST } from '../../data/amenitiesData';
import type { Amenity } from '../../types/realEstate';

interface DevelopmentOverviewProps {
  onGoToMasterplan: () => void;
  onGoToLots: () => void;
  onGoToHouses: () => void;
  onSelectAmenity: (amenity: Amenity) => void;
}

export const DevelopmentOverview: React.FC<DevelopmentOverviewProps> = ({
  onGoToMasterplan,
  onGoToLots,
  onGoToHouses,
  onSelectAmenity,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 select-none text-slate-100">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden border border-emerald-800/50 bg-gradient-to-br from-[#061912] via-[#082218] to-[#040e0a] p-6 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-600/50 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <TreePine className="w-3.5 h-3.5 text-amber-300" />
            <span>Desarrollo Residencial en Corregidora, Querétaro</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {CIUDAD_MADERAS_CORREGIDORA.name} <br />
            <span className="bg-gradient-to-r from-teal-300 via-emerald-400 to-amber-300 bg-clip-text text-transparent">
              {CIUDAD_MADERAS_CORREGIDORA.subname}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
            Explora una comunidad residencial de primer nivel con Family Club privado, áreas verdes centrales, urbanización de alto estándar y acceso directo sobre Libramiento Sur-Poniente.
          </p>

          {/* Slogan pill */}
          <p className="font-serif italic text-base sm:text-lg text-amber-200/90">
            "{CIUDAD_MADERAS_CORREGIDORA.tagline}"
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              onClick={onGoToMasterplan}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-900/40 transition-all hover:scale-105"
            >
              <Map className="w-4 h-4 text-slate-950" />
              <span>Explorar Masterplan 3D</span>
            </button>

            <button
              onClick={onGoToLots}
              className="px-6 py-3 rounded-2xl bg-[#081f17] hover:bg-emerald-950 border border-emerald-600/60 text-teal-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105"
            >
              <Layers className="w-4 h-4" />
              <span>Ver Terrenos Disponibles</span>
            </button>

            <button
              onClick={onGoToHouses}
              className="px-6 py-3 rounded-2xl bg-[#081f17] hover:bg-emerald-950 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105"
            >
              <Building2 className="w-4 h-4" />
              <span>Modelos de Casa</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Key Metrics / Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#06140f]/90 border border-emerald-900/50 rounded-2xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-teal-400 mx-auto flex items-center justify-center mb-2">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-white block">45</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Privadas Residenciales</span>
        </div>

        <div className="bg-[#06140f]/90 border border-emerald-900/50 rounded-2xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 mx-auto flex items-center justify-center mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-white block">5</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Macro Amenidades</span>
        </div>

        <div className="bg-[#06140f]/90 border border-emerald-900/50 rounded-2xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-amber-400 mx-auto flex items-center justify-center mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-white block">24 / 7</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Seguridad & Control</span>
        </div>

        <div className="bg-[#06140f]/90 border border-emerald-900/50 rounded-2xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-blue-400 mx-auto flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-white block">Alta</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Plusvalía Garantizada</span>
        </div>
      </div>

      {/* Featured Amenities Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Amenidades Destacadas
          </h2>
          <button
            onClick={onGoToMasterplan}
            className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
          >
            <span>Ver todas en mapa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {AMENITIES_LIST.slice(0, 3).map((amenity) => (
            <div
              key={amenity.id}
              onClick={() => onSelectAmenity(amenity)}
              className="group bg-[#06140f]/90 border border-emerald-800/40 hover:border-teal-400/60 rounded-2xl overflow-hidden cursor-pointer shadow-xl transition-all"
            >
              <div className="h-44 w-full relative overflow-hidden">
                <img
                  src={amenity.image}
                  alt={amenity.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06140f] via-transparent to-transparent" />
                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/60 border border-white/20 backdrop-blur-sm">
                  {amenity.tag}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                  {amenity.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {amenity.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Disclaimer */}
      <div className="p-4 rounded-2xl bg-[#05110d]/60 border border-emerald-950 text-[11px] text-slate-500 text-center leading-relaxed">
        {CIUDAD_MADERAS_CORREGIDORA.disclaimer}
      </div>
    </div>
  );
};
