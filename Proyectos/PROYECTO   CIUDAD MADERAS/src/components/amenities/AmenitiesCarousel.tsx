import React from 'react';
import { ChevronRight } from 'lucide-react';
import { AMENITIES_LIST } from '../../data/amenitiesData';
import type { Amenity } from '../../types/realEstate';

interface AmenitiesCarouselProps {
  onSelectAmenity: (amenity: Amenity) => void;
}

export const AmenitiesCarousel: React.FC<AmenitiesCarouselProps> = ({
  onSelectAmenity,
}) => {
  return (
    <div className="w-full bg-[#05110d]/95 border-t border-emerald-900/40 p-4 sm:p-5 select-none backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Carousel Container */}
        <div className="flex-1">
          <h2 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-200 mb-3 flex items-center gap-2">
            <span>Conoce las amenidades principales</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AMENITIES_LIST.slice(0, 4).map((amenity) => (
              <div
                key={amenity.id}
                onClick={() => onSelectAmenity(amenity)}
                className="group relative h-24 sm:h-28 rounded-xl overflow-hidden border border-emerald-800/40 hover:border-teal-400/70 transition-all cursor-pointer shadow-lg bg-[#071912]"
              >
                {/* Amenity Thumbnail */}
                <img
                  src={amenity.image}
                  alt={amenity.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Text and Chevron */}
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
                  <div className="truncate mr-1">
                    <span className="text-xs font-bold text-white block truncate drop-shadow">
                      {amenity.name}
                    </span>
                    <span className="text-[10px] text-teal-300 font-medium hidden sm:block truncate">
                      {amenity.tag}
                    </span>
                  </div>

                  <div className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-teal-400 group-hover:text-slate-950 text-white flex items-center justify-center shrink-0 transition-colors backdrop-blur-sm shadow">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Slogan Box (Image 1 reference) */}
        <div className="hidden lg:flex flex-col items-end text-right border-l border-emerald-900/40 pl-6 min-w-[200px]">
          <span className="text-[9px] uppercase tracking-[0.25em] font-medium text-emerald-400/90 mb-1">
            Naturaleza · Comunidad · Plusvalía
          </span>
          <span className="font-serif italic text-base sm:text-lg text-amber-200/90 tracking-wide">
            Tu historia, en un mejor lugar.
          </span>
        </div>
      </div>
    </div>
  );
};
