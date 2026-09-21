import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Smartphone,
  RefreshCw,
  Box,
  Scale,
  Sparkles,
} from 'lucide-react';
import { WebXRARBridge } from '../../xvr/WebXRARBridge';
import type { HousingModel, Lot } from '../../types/realEstate';

interface ARViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  model?: HousingModel | null;
  lot?: Lot | null;
}

export const ARViewModal: React.FC<ARViewModalProps> = ({
  isOpen,
  onClose,
  model,
  lot,
}) => {
  const [hasNativeAR, setHasNativeAR] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [arStep, setArStep] = useState<'scan' | 'placed'>('scan');
  const [scaleMode, setScaleMode] = useState<'1:1' | 'table'>('1:1');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check native WebXR AR
  useEffect(() => {
    if (!isOpen) return;
    WebXRARBridge.isARSupported().then(setHasNativeAR);
  }, [isOpen]);

  // Request camera stream for mobile AR preview
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('[ARViewModal] Camera access rejected or unavailable:', err);
      setCameraError('No se pudo acceder a la cámara. Revisa los permisos de tu navegador.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  const targetTitle = model
    ? model.name
    : lot
    ? `Lote ${lot.number} (${lot.surfaceM2}m²)`
    : 'Modelo Arquitectónico';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md select-none text-slate-100">
      <div className="relative w-full max-w-2xl h-[90vh] bg-[#06140f] border border-emerald-700/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Camera Feed or Simulated Ground Background */}
        <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#081e15] to-[#040e0a]">
              <div className="w-20 h-20 rounded-full bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-teal-400 mb-4 shadow-[0_0_25px_rgba(20,184,166,0.3)] animate-pulse">
                <Smartphone className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Experiencia de Realidad Aumentada
              </h3>
              <p className="text-xs text-slate-300 max-w-md mb-6 leading-relaxed">
                Proyecta el modelo en escala real (1:1) sobre tu terreno o en maqueta de mesa utilizando la cámara de tu dispositivo móvil.
              </p>
              <button
                onClick={startCamera}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-teal-900/40 transition-transform active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>Activar Cámara del Teléfono</span>
              </button>
              {cameraError && (
                <p className="text-xs text-rose-400 mt-3 font-medium">{cameraError}</p>
              )}
            </div>
          )}

          {/* AR Simulated Overlay Grid / Reticle */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {arStep === 'scan' ? (
                /* Scanning Reticle */
                <div className="relative flex flex-col items-center animate-pulse">
                  <div className="w-48 h-48 border-2 border-dashed border-teal-400 rounded-3xl flex items-center justify-center">
                    <Box className="w-12 h-12 text-teal-300/80" />
                  </div>
                  <span className="text-xs font-semibold text-white bg-black/60 px-3 py-1 rounded-full mt-4 backdrop-blur-sm border border-emerald-500/40">
                    Apunta la cámara hacia el suelo o terreno
                  </span>
                </div>
              ) : (
                /* 3D Placed Ghost Model */
                <div className="relative flex flex-col items-center">
                  <div className="w-64 h-64 border-2 border-emerald-400 rounded-3xl bg-emerald-500/10 backdrop-blur-[2px] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    {model?.thumbnail ? (
                      <img
                        src={model.thumbnail}
                        alt="3D AR Model"
                        className="w-48 h-48 object-contain filter drop-shadow-2xl"
                      />
                    ) : (
                      <Box className="w-20 h-20 text-emerald-300 animate-bounce" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-emerald-300 bg-black/70 px-3 py-1 rounded-full mt-3 border border-emerald-400">
                    {targetTitle} · Escala {scaleMode}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top Floating Bar */}
        <div className="relative z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-teal-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-white block">
                AR Visor · {targetTitle}
              </span>
              <span className="text-[10px] text-teal-300">
                {hasNativeAR ? 'WebXR Passthrough Disponible' : 'Modo Cámara Móvil'}
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom AR Interaction Controls */}
        <div className="relative z-10 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col items-center gap-3">
          {cameraActive && (
            <div className="flex items-center gap-2 bg-[#06140f]/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-emerald-800/60">
              {/* Scale Toggle */}
              <button
                onClick={() => setScaleMode(scaleMode === '1:1' ? 'table' : '1:1')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-slate-200 hover:text-teal-300"
              >
                <Scale className="w-3.5 h-3.5 text-teal-400" />
                <span>Escala: {scaleMode === '1:1' ? '1:1 Real' : 'Maqueta'}</span>
              </button>

              <div className="h-4 w-[1px] bg-emerald-800" />

              {/* Action Placed / Rescan */}
              {arStep === 'scan' ? (
                <button
                  onClick={() => setArStep('placed')}
                  className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold uppercase tracking-wider"
                >
                  Colocar Casa
                </button>
              ) : (
                <button
                  onClick={() => setArStep('scan')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reubicar</span>
                </button>
              )}
            </div>
          )}

          {/* Workflow Explanation Banner */}
          <div className="w-full bg-[#05110d]/90 border border-emerald-900/60 rounded-2xl p-2.5 text-center text-[11px] text-slate-400 flex items-center justify-around font-mono">
            <span>1. Cámara</span>
            <span>→</span>
            <span>2. Terreno</span>
            <span>→</span>
            <span>3. Colocar Modelo</span>
            <span>→</span>
            <span>4. Visualizar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
