import React, { useState } from 'react';
import { X, Smartphone, Copy, Check } from 'lucide-react';
import { CIUDAD_MADERAS_CORREGIDORA } from '../../data/developmentData';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ciudaddmaderas.com';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="bg-[#071711] border border-emerald-700/50 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-400">
            <Smartphone className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Acceso Móvil Instantáneo
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="mx-auto w-52 h-52 bg-white p-4 rounded-2xl shadow-xl flex items-center justify-center border-4 border-emerald-500/20">
          {/* High-contrast crisp SVG QR Code */}
          <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 fill-current">
            {/* Corner Markers */}
            <rect x="0" y="0" width="30" height="30" rx="4" />
            <rect x="6" y="6" width="18" height="18" fill="white" />
            <rect x="10" y="10" width="10" height="10" />

            <rect x="70" y="0" width="30" height="30" rx="4" />
            <rect x="76" y="6" width="18" height="18" fill="white" />
            <rect x="80" y="10" width="10" height="10" />

            <rect x="0" y="70" width="30" height="30" rx="4" />
            <rect x="6" y="76" width="18" height="18" fill="white" />
            <rect x="10" y="80" width="10" height="10" />

            {/* Pattern Dots */}
            <rect x="40" y="10" width="8" height="8" />
            <rect x="52" y="10" width="8" height="8" />
            <rect x="40" y="25" width="8" height="8" />
            <rect x="52" y="35" width="8" height="8" />
            <rect x="10" y="45" width="8" height="8" />
            <rect x="25" y="45" width="8" height="8" />
            <rect x="40" y="50" width="12" height="12" />
            <rect x="60" y="50" width="8" height="8" />
            <rect x="80" y="45" width="8" height="8" />
            <rect x="70" y="60" width="8" height="8" />
            <rect x="40" y="70" width="8" height="8" />
            <rect x="55" y="75" width="12" height="8" />
            <rect x="80" y="80" width="10" height="10" />
          </svg>
        </div>

        <div>
          <h3 className="text-base font-bold text-white">
            {CIUDAD_MADERAS_CORREGIDORA.name} {CIUDAD_MADERAS_CORREGIDORA.subname}
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Escanea desde tu iPhone o Android para recorrer el masterplan y casas en 3D/AR en tu teléfono sin instalar aplicaciones.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="w-full py-2.5 px-4 rounded-xl bg-[#0a231a] hover:bg-emerald-950 border border-emerald-700/60 text-teal-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? '¡Enlace Copiado al Portapapeles!' : 'Copiar Enlace'}</span>
        </button>
      </div>
    </div>
  );
};
