import React from 'react';
import {
  Compass,
  Map,
  Layers,
  Sparkles,
  Building2,
  Video,
  Image,
  MapPin,
  FileText,
  ChevronRight,
  Smartphone,
  Monitor,
  Glasses,
  QrCode,
} from 'lucide-react';
import { CIUDAD_MADERAS_CORREGIDORA } from '../../data/developmentData';

interface LeftSidebarNavProps {
  activeView: string;
  onSelectView: (viewId: string) => void;
  onOpenQRModal?: () => void;
}

export const LeftSidebarNav: React.FC<LeftSidebarNavProps> = ({
  activeView,
  onSelectView,
  onOpenQRModal,
}) => {
  const menuItems = [
    { id: 'general', label: 'Vista general', icon: Compass },
    { id: 'masterplan', label: 'Master plan', icon: Map },
    { id: 'terrenos', label: 'Terrenos', icon: Layers },
    { id: 'amenidades', label: 'Amenidades', icon: Sparkles },
    { id: 'casas', label: 'Casas modelo', icon: Building2 },
    { id: 'recorrido', label: 'Recorrido virtual', icon: Video },
    { id: 'galeria', label: 'Galería', icon: Image },
    { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
    { id: 'documentos', label: 'Documentos', icon: FileText },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#05110d]/90 backdrop-blur-md border-r border-emerald-900/40 p-4 justify-between h-[calc(100vh-4rem)] select-none shrink-0 overflow-y-auto no-scrollbar">
      <div className="space-y-4">
        {/* Development Summary Card */}
        <div
          onClick={() => onSelectView('general')}
          className="relative overflow-hidden rounded-xl border border-emerald-800/40 bg-gradient-to-br from-emerald-950/60 to-[#071711] p-3 cursor-pointer group hover:border-teal-500/50 transition-all shadow-lg"
        >
          <div className="h-20 w-full rounded-lg overflow-hidden relative mb-2.5">
            <img
              src={CIUDAD_MADERAS_CORREGIDORA.heroImage}
              alt="Ciudad Maderas Corregidora"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <span className="absolute bottom-1.5 left-2 text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
              Querétaro
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider group-hover:text-teal-300 transition-colors">
                Ciudad Maderas Corregidora
              </h3>
              <p className="text-[11px] text-slate-400">
                {CIUDAD_MADERAS_CORREGIDORA.type}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-900/70 to-teal-950/40 text-teal-300 border border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.15)] font-semibold'
                    : 'text-slate-300 hover:bg-emerald-950/40 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* QR Code / Multi-Device Showcase Card (Image 1 reference) */}
      <div className="mt-4 pt-4 border-t border-emerald-900/40">
        <div
          onClick={onOpenQRModal}
          className="rounded-xl border border-emerald-800/40 bg-[#071812]/80 p-3 hover:border-emerald-600/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
              Explora en tu dispositivo
            </span>
          </div>

          {/* Device Icons */}
          <div className="flex items-center justify-around text-slate-400 py-1.5 mb-2.5 border-b border-emerald-900/30 text-[10px]">
            <div className="flex flex-col items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Móvil / Tablet</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Monitor className="w-3.5 h-3.5 text-teal-400" />
              <span>Computadora</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Glasses className="w-3.5 h-3.5 text-amber-300" />
              <span>Meta Quest</span>
            </div>
          </div>

          {/* QR Scan Area */}
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 bg-white p-1 rounded-lg flex items-center justify-center shrink-0 shadow-md">
              <QrCode className="w-full h-full text-slate-900" />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Escanea el código y explora este desarrollo en tu teléfono.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
