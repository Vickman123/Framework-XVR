import * as THREE from 'three';
import {
  ARExperience,
  ARSession,
  ARQRCode,
  FiduciaryMarkerAdapter,
  type ARExperienceManifest,
  type ARModelConfig,
  type ARMode,
} from '@vxr/ar';

// =============================================================================
// Available 3D Models in Framework
// =============================================================================
const MODELS: Record<string, ARModelConfig> = {
  robot: {
    url: '../model.glb',
    name: 'Robot Explorador VXR',
    description: 'Droide autónomo de inspección y teleoperación para entornos inmersivos.',
    initialScale: 0.85,
    initialRotationDeg: [0, 180, 0],
    autoPlayAnimation: true,
    infoCard: {
      title: '🤖 Robot Explorador Autónomo',
      subtitle: 'Pieza #01 · Simulación Robótica VXR',
      content:
        'Modelo 3D optimizado para WebGL y WebXR con esqueleto de animación integrado. Representa una sonda autónoma con sensores LIDAR frontales.',
      badge: 'Modelo Interactivo',
    },
  },
  building: {
    url: '../models/building.glb',
    name: 'Sede Corporativa VXR',
    description: 'Complejo arquitectónico bioclimático con estructura modular.',
    initialScale: 0.25,
    initialRotationDeg: [0, 45, 0],
    autoPlayAnimation: false,
    infoCard: {
      title: '🏢 Sede Corporativa Bioclimática',
      subtitle: 'Pieza #02 · Arquitectura Sostenible',
      content:
        'Diseño arquitectónico contemporáneo con paneles solares de doble capa, aislamiento pasivo y distribución espacial optimizada para recorridos en Realidad Aumentada.',
      badge: 'Arquitectura 3D',
    },
  },
  lab: {
    url: '../models/lab.glb',
    name: 'Laboratorio Tecnológico Sci-Fi',
    description: 'Módulo de investigación con cúpula de contención y sistemas de análisis molecular.',
    initialScale: 0.3,
    initialRotationDeg: [0, 0, 0],
    autoPlayAnimation: false,
    infoCard: {
      title: '🔬 Laboratorio Tecnológico',
      subtitle: 'Pieza #03 · Centro de Computación Espacial',
      content:
        'Entorno experimental de ciencia de materiales con bancos de prueba criogénicos, terminales holográficas y cámaras de vacío.',
      badge: 'Ciencia & Simulación',
    },
  },
};

// =============================================================================
// State & Active Controllers
// =============================================================================
let currentMode: ARMode | 'educational' = 'qr';
let currentModelId = 'robot';
let experience: ARExperience | null = null;
let isAnimationPlaying = true;
let isAudioActive = false;

const viewportContainer = document.getElementById('ar-viewport-container') as HTMLElement;
const statusDot = document.getElementById('status-dot') as HTMLElement;
const statusText = document.getElementById('status-text') as HTMLElement;
const trayHeadline = document.getElementById('tray-headline') as HTMLElement;
const trayIcon = document.getElementById('tray-icon') as HTMLElement;
const lblScale = document.getElementById('lbl-scale-factor') as HTMLElement;

// Toast Helper
const toastEl = document.getElementById('ar-toast') as HTMLElement;
const toastMsg = document.getElementById('ar-toast-msg') as HTMLElement;
let toastTimer: any = null;

function showToast(msg: string): void {
  if (!toastEl || !toastMsg) return;
  toastMsg.textContent = msg;
  toastEl.style.display = 'flex';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.style.display = 'none';
  }, 3000);
}

// =============================================================================
// Initialize AR Experience
// =============================================================================
async function startARExperience(mode: ARMode | 'educational', modelKey: string): Promise<void> {
  // Clean prior instance if exists
  if (experience) {
    experience.destroy();
    experience = null;
  }

  const modelConfig = MODELS[modelKey] || MODELS.robot;
  const actualMode: ARMode = mode === 'educational' ? 'marker' : mode;

  // Build manifest
  const manifest: ARExperienceManifest = {
    id: `exp-${mode}-${Date.now()}`,
    title: modelConfig.name || 'Experiencia VXR AR',
    description: modelConfig.description,
    mode: actualMode,
    targetUrl: actualMode === 'image' ? '../vxr-logo.png' : undefined,
    models: [modelConfig],
  };

  try {
    statusDot.className = 'status-dot scanning';
    statusText.textContent = 'Solicitando permisos de cámara...';

    experience = new ARExperience({
      container: viewportContainer,
      manifest,
      interactionOptions: {
        enableRotate: true,
        enablePinchScale: true,
        minScale: 0.1,
        maxScale: 6.0,
      },
      onStateChange: (st: any) => {
        if (st === 'target_detected') {
          statusDot.className = 'status-dot active';
          statusText.textContent = '¡Objetivo Detectado! Modelo 3D acoplado en tiempo real';
          showToast('✓ Objetivo detectado en cámara');
        } else if (st === 'target_lost') {
          statusDot.className = 'status-dot scanning';
          statusText.textContent = 'Buscando objetivo... Apunta la cámara a la imagen o marcador';
        } else if (st === 'scanning') {
          statusDot.className = 'status-dot scanning';
          statusText.textContent =
            actualMode === 'qr'
              ? 'Apunta la cámara a un código QR o toca la pantalla'
              : 'Escaneando entorno en busca del objetivo visual...';
        } else if (st === 'error') {
          statusDot.className = 'status-dot error';
          statusText.textContent = 'Error en el sensor de cámara';
        }
      },
    });

    await experience.init();
    experience.start();

    // Hook model tap for educational info card
    experience.interaction.onModelTapped = () => {
      if (modelConfig.infoCard) {
        showInfoCard(modelConfig.infoCard);
      }
    };

    updateTrayUI(modelConfig);
    showToast(`✓ Experiencia iniciada en ${getModeLabel(mode)}`);

    // If educational mode, show info card immediately
    if (mode === 'educational' && modelConfig.infoCard) {
      setTimeout(() => showInfoCard(modelConfig.infoCard!), 600);
    }
  } catch (err: any) {
    statusDot.className = 'status-dot error';
    statusText.textContent = `Error: ${err.message || 'Cámara no disponible'}`;
    showToast(`⚠ Error: ${err.message}`);
  }
}

function updateTrayUI(model: ARModelConfig): void {
  if (trayHeadline) trayHeadline.textContent = model.name || 'Modelo 3D';
  if (trayIcon) {
    trayIcon.textContent = currentModelId === 'building' ? '🏢' : currentModelId === 'lab' ? '🔬' : '🤖';
  }
}

function getModeLabel(m: string): string {
  if (m === 'qr') return 'Modo QR';
  if (m === 'image') return 'Modo Image Tracking';
  if (m === 'marker') return 'Modo Marcador Fiduciario';
  return 'Modo Educativo';
}

// =============================================================================
// Mode Switching Tabs
// =============================================================================
document.querySelectorAll('[data-ar-mode]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-ar-mode]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    currentMode = btn.getAttribute('data-ar-mode') as any;
    startARExperience(currentMode, currentModelId);
    updateTargetModalContent(currentMode);
  });
});

// Model Switcher Pills
document.querySelectorAll('[data-model-id]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('[data-model-id]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    currentModelId = btn.getAttribute('data-model-id') || 'robot';
    const config = MODELS[currentModelId];
    if (experience && config) {
      await experience.loadModel(config);
      updateTrayUI(config);
      showToast(`Cargado: "${config.name}"`);
    }
  });
});

// Tray Actions: Reset, Animation, Audio
document.getElementById('btn-reset-transform')?.addEventListener('click', () => {
  if (experience && experience.currentModel) {
    const root = experience.currentModel.root;
    root.rotation.set(0, currentModelId === 'robot' ? Math.PI : 0, 0);
    root.scale.setScalar(MODELS[currentModelId]?.initialScale ? (MODELS[currentModelId].initialScale as number) : 1);
    if (lblScale) lblScale.textContent = '1.00x';
    showToast('↺ Transformación restablecida');
  }
});

document.getElementById('btn-toggle-anim')?.addEventListener('click', () => {
  if (experience && experience.currentModel && experience.currentModel.mixer) {
    isAnimationPlaying = !isAnimationPlaying;
    if (isAnimationPlaying) {
      experience.currentModel.mixer.timeScale = 1;
      showToast('▶ Animación reanudada');
    } else {
      experience.currentModel.mixer.timeScale = 0;
      showToast('⏸ Animación pausada');
    }
  } else {
    showToast('Este modelo no tiene clips de animación activos');
  }
});

document.getElementById('btn-toggle-audio')?.addEventListener('click', () => {
  isAudioActive = !isAudioActive;
  showToast(isAudioActive ? '🔊 Audio activado' : '🔇 Audio silenciado');
});

// Exit / Dispose
document.getElementById('btn-exit')?.addEventListener('click', () => {
  if (experience) {
    experience.destroy();
    experience = null;
    statusDot.className = 'status-dot';
    statusText.textContent = 'Experiencia detenida. Cámara y memoria GPU liberadas.';
    showToast('✓ Sesión AR cerrada y recursos liberados');
  }
});

// =============================================================================
// Modals: Targets, Capabilities, InfoCard
// =============================================================================
const modalTargets = document.getElementById('modal-targets') as HTMLElement;
const modalCaps = document.getElementById('modal-caps') as HTMLElement;
const modalInfoCard = document.getElementById('modal-infocard') as HTMLElement;

document.getElementById('btn-targets')?.addEventListener('click', () => {
  updateTargetModalContent(currentMode);
  modalTargets.classList.add('active');
});
document.getElementById('btn-close-targets-modal')?.addEventListener('click', () => modalTargets.classList.remove('active'));

document.getElementById('btn-capabilities')?.addEventListener('click', async () => {
  await renderCapabilitiesModal();
  modalCaps.classList.add('active');
});
document.getElementById('btn-close-caps-modal')?.addEventListener('click', () => modalCaps.classList.remove('active'));
document.getElementById('btn-close-infocard')?.addEventListener('click', () => modalInfoCard.classList.remove('active'));
document.getElementById('btn-infocard-action')?.addEventListener('click', () => modalInfoCard.classList.remove('active'));

// Close modals on background click
[modalTargets, modalCaps, modalInfoCard].forEach((m) => {
  m.addEventListener('click', (e) => {
    if (e.target === m) m.classList.remove('active');
  });
});

function updateTargetModalContent(mode: string): void {
  const previewImg = document.getElementById('target-preview-img') as HTMLImageElement;
  const previewDesc = document.getElementById('target-preview-desc') as HTMLElement;
  const btnDownload = document.getElementById('btn-download-target') as HTMLAnchorElement;

  if (mode === 'qr') {
    const launchUrl = window.location.href;
    const qrSrc = ARQRCode.generateQRCodeSVG(launchUrl);
    if (previewImg) previewImg.src = qrSrc;
    if (previewDesc) previewDesc.textContent = 'Código QR para abrir esta experiencia en tu smartphone';
    if (btnDownload) {
      btnDownload.href = qrSrc;
      btnDownload.download = 'vxr-ar-qrcode.svg';
      btnDownload.textContent = '💾 Descargar Código QR (SVG)';
    }
  } else if (mode === 'marker' || mode === 'educational') {
    const svgStr = FiduciaryMarkerAdapter.generateMarkerSVG(101, 320);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    if (previewImg) previewImg.src = url;
    if (previewDesc) previewDesc.textContent = 'Marcador Fiduciario de Alto Contraste (ID #101)';
    if (btnDownload) {
      btnDownload.href = url;
      btnDownload.download = 'vxr-marker-101.svg';
      btnDownload.textContent = '💾 Descargar / Imprimir Marcador (SVG)';
    }
  } else {
    // Image Tracking Target
    if (previewImg) previewImg.src = '../vxr-logo.png';
    if (previewDesc) previewDesc.textContent = 'Imagen Objetivo (Logotipo VXR de Alto Contraste)';
    if (btnDownload) {
      btnDownload.href = '../vxr-logo.png';
      btnDownload.download = 'vxr-logo-target.png';
      btnDownload.textContent = '💾 Descargar Imagen Objetivo';
    }
  }
}

async function renderCapabilitiesModal(): Promise<void> {
  const capsList = document.getElementById('caps-list') as HTMLElement;
  if (!capsList) return;

  capsList.innerHTML = '<div style="color: #94a3b8;">Analizando capacidades de hardware y navegador...</div>';
  const caps = await ARSession.checkCapabilities();

  capsList.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
      <span>🔒 Contexto Seguro (HTTPS / Localhost)</span>
      <b style="color: ${caps.isSecureContext ? '#10b981' : '#ef4444'}">${caps.isSecureContext ? 'OK' : 'INSEGURO'}</b>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
      <span>📷 Acceso a Cámara (getUserMedia)</span>
      <b style="color: ${caps.hasCameraSupport ? '#10b981' : '#ef4444'}">${caps.hasCameraSupport ? 'COMPATIBLE' : 'NO SOPORTADO'}</b>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
      <span>🥽 WebXR Immersive AR (Nativo)</span>
      <b style="color: ${caps.hasWebXRARSupport ? '#10b981' : '#f59e0b'}">${caps.hasWebXRARSupport ? 'ACTIVO' : 'FALLBACK WASM'}</b>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
      <span>📱 Hardware BarcodeDetector (QR)</span>
      <b style="color: ${caps.hasBarcodeDetector ? '#10b981' : '#38bdf8'}">${caps.hasBarcodeDetector ? 'NATIVO' : 'CANVAS FAST'}</b>
    </div>
    ${
      caps.recommendations.length > 0
        ? `<div style="margin-top: 6px; padding: 8px 12px; background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; border-radius: 4px; font-size: 11px; line-height: 1.5; color: #cbd5e1;">
            <b>Nota Técnica:</b><br/>${caps.recommendations.join('<br/>• ')}
           </div>`
        : ''
    }
  `;
}

function showInfoCard(card: { title: string; subtitle?: string; content: string }): void {
  const tEl = document.getElementById('infocard-title');
  const sEl = document.getElementById('infocard-subtitle');
  const bEl = document.getElementById('infocard-body');

  if (tEl) tEl.textContent = card.title;
  if (sEl) sEl.textContent = card.subtitle || '';
  if (bEl) bEl.textContent = card.content;

  modalInfoCard.classList.add('active');
}

// =============================================================================
// URL Parameter Parser & Auto-Launcher
// =============================================================================
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const requestedModel = urlParams.get('model') || urlParams.get('glb');
  const requestedMode = urlParams.get('mode') as ARMode;

  if (requestedMode && ['qr', 'image', 'marker', 'educational'].includes(requestedMode)) {
    currentMode = requestedMode;
    document.querySelectorAll('[data-ar-mode]').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-ar-mode') === requestedMode);
    });
  }

  if (requestedModel) {
    MODELS.custom = {
      url: requestedModel,
      name: urlParams.get('title') || 'Experiencia Externa',
      description: urlParams.get('desc') || '',
      initialScale: parseFloat(urlParams.get('scale') || '1') || 1,
      autoPlayAnimation: true,
    };
    currentModelId = 'custom';
  }

  // Launch initial experience
  startARExperience(currentMode, currentModelId);
});
