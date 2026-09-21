import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Amenity } from '../../types/realEstate';

interface AmenityPinProps {
  amenity: Amenity;
  onSelect: (amenity: Amenity) => void;
  isCompact?: boolean;
}

export const AmenityPin: React.FC<AmenityPinProps> = ({
  amenity,
  onSelect,
  isCompact = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        left: `${amenity.coords.x}%`,
        top: `${amenity.coords.y}%`,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(amenity);
      }}
    >
      {/* Visual Marker / Pin */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing Aura */}
        <span
          style={{ borderColor: amenity.pinColor, backgroundColor: `${amenity.pinColor}33` }}
          className="absolute -inset-2 rounded-full border animate-ping opacity-60"
        />

        {/* Pin Center Circle */}
        <div
          style={{ backgroundColor: amenity.pinColor }}
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.6)] border-2 border-white/90 text-sm transition-transform duration-200 group-hover:scale-125"
        >
          <span>{amenity.icon}</span>
        </div>

        {/* Connector Line on Hover / Large View */}
        <div className="hidden sm:block absolute bottom-full mb-1 w-[2px] h-4 bg-emerald-400/80 pointer-events-none" />

        {/* Floating Callout Card (Inspired by Image 1) */}
        <div
          className={`absolute bottom-full mb-5 -translate-x-1/2 left-1/2 min-w-44 max-w-56 bg-[#081711]/95 border border-emerald-500/40 rounded-xl p-2 shadow-2xl backdrop-blur-md transition-all duration-200 pointer-events-auto ${
            isHovered || !isCompact ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none hidden sm:block'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs">{amenity.icon}</span>
            <span className="text-xs font-bold text-slate-100 truncate">
              {amenity.name}
            </span>
          </div>

          <div className="h-20 w-full rounded-lg overflow-hidden relative mb-1.5 border border-emerald-900/60">
            <img
              src={amenity.image}
              alt={amenity.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          <div className="flex items-center justify-between text-[10px] text-teal-300 font-semibold uppercase tracking-wider">
            <span>Explorar amenidad</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
