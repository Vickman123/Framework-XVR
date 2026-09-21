import React from 'react';
import { Home, Map, Layers, Building2, Sparkles } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const items = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'masterplan', label: 'Mapa', icon: Map },
    { id: 'terrenos', label: 'Terrenos', icon: Layers },
    { id: 'casas', label: 'Casas', icon: Building2 },
    { id: 'amenidades', label: 'Amenidades', icon: Sparkles },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#06120e]/95 backdrop-blur-xl border-t border-emerald-800/40 px-2 py-1.5 flex items-center justify-around select-none shadow-[0_-4px_25px_rgba(0,0,0,0.5)]">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
              isActive
                ? 'text-teal-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isActive && (
              <span className="absolute -top-1.5 w-6 h-1 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
            )}
            <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-teal-300' : ''}`} />
            <span className="text-[10px] tracking-wide mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
