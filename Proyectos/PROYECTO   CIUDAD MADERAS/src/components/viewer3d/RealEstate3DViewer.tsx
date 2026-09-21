import React, { useState } from 'react';
import {
  ArrowLeft,
  Sun,
  Moon,
  Camera,
  Smartphone,
  Glasses,
  RotateCcw,
} from 'lucide-react';
import { useXVR } from '../../xvr/useXVR';
import { RoomNavigator } from './RoomNavigator';
import type { HousingModel, HousingRoom, Lot, TimeOfDay } from '../../types/realEstate';

interface RealEstate3DViewerProps {
  model: HousingModel;
  associatedLot?: Lot | null;
  onBack: () => void;
  onOpenAR: (model: HousingModel) => void;
}

export const RealEstate3DViewer: React.FC<RealEstate3DViewerProps> = ({
  model,
  associatedLot,
  onBack,
  onOpenAR,
}) => {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('dia');
  const [activeRoomId, setActiveRoomId] = useState<string>(
    model.rooms && model.rooms.length > 0 ? model.rooms[0].id : 'fachada'
  );
  const [snapshotPreview, setSnapshotPreview] = useState<string | null>(null);

  const isNight = timeOfDay === 'noche';

  // Instantiate XVR 3D engine
  const {
    containerRef,
    isLoading,
    progress,
    error,
    metrics,
    hasVRSupport,
    enterVR,
    resetView,
    navigateToRoom,
    captureSnapshot,
  } = useXVR({
    modelUrl: model.modelGlb,
    isNight,
  });

  const handleSelectRoom = (room: HousingRoom) => {
    setActiveRoomId(room.id);
    navigateToRoom(room.cameraPosition, room.cameraTarget);
  };

  const handleTakeSnapshot = () => {
    const dataUrl = captureSnapshot();
    if (dataUrl) {
      setSnapshotPreview(dataUrl);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#030907] select-none text-slate-100 flex flex-col justify-between">
      {/* 3D Canvas Mounting Container (Managed by XVR) */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
      />

      {/* Top Floating Controls Bar */}
      <div className="relative z-30 p-4 flex items-center justify-between pointer-events-auto">
        {/* Back Button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#06140f]/90 hover:bg-emerald-950 border border-emerald-800/60 shadow-xl backdrop-blur-md text-xs font-semibold text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Volver al Masterplan</span>
          </button>

          <div className="bg-[#06140f]/90 border border-emerald-800/60 rounded-xl px-3 py-1.5 backdrop-blur-md hidden md:block">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {model.name}
              </span>
              <span className="text-[10px] text-teal-300 font-semibold px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-700/50">
                {model.surfaceM2} m²
              </span>
              {associatedLot && (
                <span className="text-[10px] text-amber-300 font-medium">
                  • Asignado a Lote {associatedLot.number}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Tools (Day/Night, Snapshot, WebXR VR) */}
        <div className="flex items-center gap-2">
          {/* Day/Night Toggle */}
          <button
            onClick={() => setTimeOfDay(isNight ? 'dia' : 'noche')}
            className="p-2 rounded-xl bg-[#06140f]/90 hover:bg-emerald-950 border border-emerald-800/60 shadow-xl backdrop-blur-md text-slate-200 transition-colors"
            title="Cambiar iluminación"
          >
            {isNight ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-300" />
            )}
          </button>

          {/* Snapshot Button */}
          <button
            onClick={handleTakeSnapshot}
            className="p-2 rounded-xl bg-[#06140f]/90 hover:bg-emerald-950 border border-emerald-800/60 shadow-xl backdrop-blur-md text-slate-200 transition-colors"
            title="Tomar captura"
          >
            <Camera className="w-4 h-4 text-teal-300" />
          </button>

          {/* Reset Camera */}
          <button
            onClick={resetView}
            className="p-2 rounded-xl bg-[#06140f]/90 hover:bg-emerald-950 border border-emerald-800/60 shadow-xl backdrop-blur-md text-slate-200 transition-colors"
            title="Restablecer cámara"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>

          {/* WebXR VR Button for Meta Quest */}
          <button
            onClick={enterVR}
            disabled={!hasVRSupport}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${
              hasVRSupport
                ? 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white border border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.4)]'
                : 'bg-[#081a13] text-slate-500 border border-emerald-900/40 cursor-not-allowed'
            }`}
            title={hasVRSupport ? 'Entrar en Realidad Virtual con Meta Quest' : 'WebXR no detectado'}
          >
            <Glasses className="w-4 h-4" />
            <span>{hasVRSupport ? 'Meta Quest VR' : 'VR Listo'}</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 border-3 border-emerald-500/20 border-t-teal-400 rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-white tracking-wider uppercase">
            Cargando Modelo 3D con XVR...
          </p>
          <div className="w-48 h-1.5 bg-emerald-950 rounded-full mt-3 overflow-hidden border border-emerald-800/40">
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-200"
            />
          </div>
          <span className="text-xs text-slate-400 mt-2 font-mono">{progress}%</span>
        </div>
      )}

      {/* Error Fallback */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-rose-950/90 border border-rose-600/60 rounded-2xl px-6 py-4 max-w-md text-center shadow-2xl">
          <p className="text-xs font-semibold text-rose-200 mb-2">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-bold"
          >
            Regresar al Masterplan
          </button>
        </div>
      )}

      {/* Bottom Floating Navigation & Actions */}
      <div className="relative z-30 p-4 flex flex-col items-center gap-3 pointer-events-auto">
        {/* Room Navigator Hotspots */}
        {model.rooms && model.rooms.length > 0 && (
          <RoomNavigator
            rooms={model.rooms}
            activeRoomId={activeRoomId}
            onSelectRoom={handleSelectRoom}
          />
        )}

        {/* Bottom Toolbar & AR Trigger */}
        <div className="flex items-center gap-2 bg-[#06140f]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-emerald-800/60 shadow-xl">
          {metrics && (
            <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-400 px-2 font-mono">
              <span>{metrics.triangleCount.toLocaleString()} Triángulos</span>
              <span>•</span>
              <span>{metrics.dimensions.width}m × {metrics.dimensions.height}m</span>
            </div>
          )}

          <button
            onClick={() => onOpenAR(model)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Ver en AR</span>
          </button>
        </div>
      </div>

      {/* Snapshot Preview Modal */}
      {snapshotPreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#071711] border border-emerald-700/50 rounded-2xl max-w-lg w-full p-4 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Captura 3D del Modelo
            </h3>
            <div className="rounded-xl overflow-hidden border border-emerald-900/60">
              <img src={snapshotPreview} alt="Captura 3D" className="w-full h-auto" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSnapshotPreview(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cerrar
              </button>
              <a
                href={snapshotPreview}
                download={`${model.name}-3D.jpg`}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
              >
                Descargar Imagen
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
