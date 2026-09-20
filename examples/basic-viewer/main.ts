import { XRApp } from '@vxr/core';

async function bootstrap() {
  console.log('[VXR Basic Viewer] Inicializando visor fundamental...');

  // 1. Instanciar la aplicación VXR Core
  const app = new XRApp({
    container: '#app',
    cameraPosition: [4, 2.5, 5],
    enableShadows: true,
    enableGrid: true,
    autoOrbitControls: true,
    autoVRButton: true,
  });

  try {
    // 2. Cargar modelo 3D con auto-grounding y centrado automático
    const model = await app.loadModel('/models/basic.glb', {
      autoGround: true,
      autoCenter: true,
    });

    // 3. Mostrar métricas del modelo en el HUD
    const { dimensions, triangleCount, vertexCount, meshCount } = model.metrics;
    const dimEl = document.getElementById('metric-dim');
    const meshesEl = document.getElementById('metric-meshes');
    const trisEl = document.getElementById('metric-tris');
    const vertsEl = document.getElementById('metric-verts');

    if (dimEl) dimEl.textContent = `${dimensions.width}m × ${dimensions.height}m × ${dimensions.depth}m`;
    if (meshesEl) meshesEl.textContent = meshCount.toString();
    if (trisEl) trisEl.textContent = triangleCount.toLocaleString();
    if (vertsEl) vertsEl.textContent = vertexCount.toLocaleString();

    // 4. Enlazar botón de Reset de Cámara nativo de VXR
    const resetBtn = document.getElementById('btn-reset-camera');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        app.resetCamera([4, 2.5, 5], [0, dimensions.height * 0.4, 0]);
      });
    }

    // 5. Iniciar bucle de renderizado
    app.start();
    console.log('[VXR Basic Viewer] Aplicación en ejecución.');
  } catch (error) {
    console.error('[VXR Basic Viewer] Error al cargar la experiencia:', error);
    const dimEl = document.getElementById('metric-dim');
    if (dimEl) dimEl.textContent = 'Error al cargar';
  }
}

window.addEventListener('DOMContentLoaded', bootstrap);
