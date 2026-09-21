import React from 'react';
import { X, Heart, Box, Trash2, MapPin } from 'lucide-react';
import { LOTS_DATA } from '../../data/lotsData';
import type { Lot } from '../../types/realEstate';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteLotIds: string[];
  onSelectLot: (lot: Lot) => void;
  onRemoveFavorite: (lotId: string) => void;
  onView3D: (lot: Lot) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favoriteLotIds,
  onSelectLot,
  onRemoveFavorite,
  onView3D,
}) => {
  if (!isOpen) return null;

  const favoriteLots = LOTS_DATA.filter((l) => favoriteLotIds.includes(l.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="bg-[#071711] border border-emerald-700/50 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-900/60 bg-[#05110d]">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Mis Terrenos Guardados ({favoriteLots.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2.5">
          {favoriteLots.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Heart className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs">No tienes terrenos guardados todavía.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Haz clic en el icono de corazón en cualquier lote para guardarlo aquí.
              </p>
            </div>
          ) : (
            favoriteLots.map((lot) => (
              <div
                key={lot.id}
                className="bg-[#081b14]/70 border border-emerald-900/40 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Lote {lot.number} · {lot.surfaceM2} m²
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Privada {lot.privadaName} • {lot.stage}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectLot(lot);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-teal-300 border border-emerald-700/60 text-xs"
                    title="Ver en Masterplan"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      onView3D(lot);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold"
                    title="Ver 3D"
                  >
                    <Box className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onRemoveFavorite(lot.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400"
                    title="Eliminar de favoritos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
