import React from 'react';
import { X, CheckCircle, MapPin } from 'lucide-react';
import type { Amenity } from '../../types/realEstate';

interface AmenityDetailModalProps {
  isOpen?: boolean;
  amenity: Amenity | null;
  onClose: () => void;
  onLocateOnMap?: (amenity: Amenity) => void;
}

export const AmenityDetailModal: React.FC<AmenityDetailModalProps> = ({
  isOpen = true,
  amenity,
  onClose,
  onLocateOnMap,
}) => {
  if (!isOpen || !amenity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#071711] border border-emerald-700/50 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none">
        {/* Header Image with Gradient & Close Button */}
        <div className="relative h-52 w-full overflow-hidden bg-slate-900 shrink-0">
          <img
            src={amenity.image}
            alt={amenity.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071711] via-black/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge & Title in Header */}
          <div className="absolute bottom-3 left-4 right-4">
            <span
              style={{ backgroundColor: `${amenity.pinColor}40`, borderColor: amenity.pinColor }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white border mb-1.5 backdrop-blur-sm"
            >
              <span>{amenity.icon}</span>
              <span>{amenity.tag}</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              {amenity.name}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
            {amenity.description}
          </p>

          {/* Features Checklist */}
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5">
              Equipamiento & Características
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {amenity.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-[#091f16]/60 p-2.5 rounded-xl border border-emerald-900/40 text-slate-200"
                >
                  <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-slate-500 italic pt-2 border-t border-emerald-900/40">
            * Amenidad proyectada para Ciudad Maderas Corregidora. Renders y características con fines ilustrativos (DEMO).
          </p>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-emerald-900/60 bg-[#05110d] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
          >
            Cerrar
          </button>

          {onLocateOnMap && (
            <button
              onClick={() => {
                onLocateOnMap(amenity);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-teal-900/40"
            >
              <MapPin className="w-4 h-4" />
              <span>Localizar en Masterplan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
