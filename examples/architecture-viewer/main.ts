import { XRApp, LoadedModel } from '@vxr/core';
import * as THREE from 'three';

let app: XRApp;
let currentModel: LoadedModel | null = null;
let selectedMesh: THREE.Mesh | null = null;
let originalMaterial: THREE.Material | THREE.Material[] | null = null;
let highlightMaterial: THREE.MeshStandardMaterial;

let isGridVisible = true;
let isModelVisible = true;

async function bootstrap() {
  console.log('[VXR Architecture Viewer] Inicializando visor arquitectónico profesional...');

  // 1. Instanciar aplicación VXR con configuración de sombras de alta calidad
  app = new XRApp({
    container: '#app',
    cameraPosition: [7, 5, 8],
    enableShadows: true,
    enableGrid: true,
    autoOrbitControls: true,
    autoVRButton: true,
  });

  // Material de resaltado para piezas seleccionadas (cian arquitectónico emisivo)
  highlightMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0284c7,
    emissiveIntensity: 0.45,
    roughness: 0.3,
    metalness: 0.5,
  });

  try {
    // 2. Cargar modelo arquitectónico
    currentModel = await app.loadModel('/models/building.glb', {
      autoGround: true,
      autoCenter: true,
    });

    // 3. Poblar métricas globales en la barra lateral
    const { dimensions, triangleCount, meshCount } = currentModel.metrics;
    document.getElementById('meta-dim')!.textContent = `${dimensions.width}m × ${dimensions.height}m × ${dimensions.depth}m`;
    document.getElementById('meta-meshes')!.textContent = meshCount.toString();
    document.getElementById('meta-tris')!.textContent = triangleCount.toLocaleString();

    // 4. Configurar eventos de interacción y herramientas
    setupInteractions();
    setupUIControls();

    // 5. Iniciar la aplicación
    app.start();
    console.log('[VXR Architecture Viewer] Visor arquitectónico activo.');
  } catch (error) {
    console.error('[VXR Architecture Viewer] Error al cargar edificio:', error);
  }
}

/**
 * Configura la selección y highlight de componentes en Desktop y WebXR.
 */
function setupInteractions(): void {
  if (!currentModel) return;

  // A. Selección con ratón en escritorio
  const dom = app.renderer.domElement;
  dom.addEventListener('pointerdown', (event: PointerEvent) => {
    // Solo clic izquierdo
    if (event.button !== 0) return;

    const hits = app.raycastPointer(event, [currentModel!.group], true);
    if (hits.length > 0) {
      const hitObject = hits[0].object;
      if ((hitObject as THREE.Mesh).isMesh) {
        selectMesh(hitObject as THREE.Mesh);
      }
    }
  });

  // B. Selección con rayo de mandos en WebXR
  app.onControllerSelect((index) => {
    if (!currentModel) return;
    const hits = app.raycastController(index, [currentModel.group], true);
    if (hits.length > 0) {
      const hitObject = hits[0].object;
      if ((hitObject as THREE.Mesh).isMesh) {
        selectMesh(hitObject as THREE.Mesh);
      }
    }
  });
}

/**
 * Aplica highlight a una malla y actualiza el panel inspector.
 */
function selectMesh(mesh: THREE.Mesh): void {
  // Restaurar malla previa si existía
  deselectMesh();

  selectedMesh = mesh;
  originalMaterial = mesh.material;
  mesh.material = highlightMaterial;

  // Actualizar panel lateral inspector
  const detailsEl = document.getElementById('inspector-details');
  const emptyEl = document.getElementById('inspector-empty');
  if (detailsEl && emptyEl) {
    emptyEl.style.display = 'none';
    detailsEl.style.display = 'block';
  }

  const name = mesh.name || `Elemento_${mesh.id}`;
  const geomType = mesh.geometry?.type || 'BufferGeometry';
  const posAttr = mesh.geometry?.attributes.position;
  const verts = posAttr ? posAttr.count.toLocaleString() : '-';
  const tris = mesh.geometry?.index
    ? (mesh.geometry.index.count / 3).toLocaleString()
    : posAttr
    ? (posAttr.count / 3).toLocaleString()
    : '-';

  const matType = Array.isArray(originalMaterial)
    ? `${originalMaterial.length} materiales`
    : originalMaterial
    ? originalMaterial.type
    : 'Unknown';

  document.getElementById('obj-name')!.textContent = name;
  document.getElementById('obj-geom')!.textContent = geomType;
  document.getElementById('obj-tris')!.textContent = tris;
  document.getElementById('obj-verts')!.textContent = verts;
  document.getElementById('obj-mat')!.textContent = matType;
}

/**
 * Restaura el material original de la malla seleccionada.
 */
function deselectMesh(): void {
  if (selectedMesh && originalMaterial) {
    selectedMesh.material = originalMaterial;
    selectedMesh = null;
    originalMaterial = null;
  }

  const detailsEl = document.getElementById('inspector-details');
  const emptyEl = document.getElementById('inspector-empty');
  if (detailsEl && emptyEl) {
    detailsEl.style.display = 'none';
    emptyEl.style.display = 'block';
  }
}

/**
 * Vincula los botones de la interfaz lateral a los métodos de VXR Core.
 */
function setupUIControls(): void {
  // 1. Deseleccionar
  document.getElementById('btn-deselect')?.addEventListener('click', () => {
    deselectMesh();
  });

  // 2. Toggle Rejilla
  const gridBtn = document.getElementById('btn-toggle-grid');
  gridBtn?.addEventListener('click', () => {
    isGridVisible = !isGridVisible;
    app.scene.setGridVisible(isGridVisible);
    gridBtn.classList.toggle('toggle-active', isGridVisible);
  });

  // 3. Toggle Modelo
  const modelBtn = document.getElementById('btn-toggle-model');
  modelBtn?.addEventListener('click', () => {
    if (currentModel) {
      isModelVisible = !isModelVisible;
      currentModel.group.visible = isModelVisible;
      modelBtn.classList.toggle('toggle-active', isModelVisible);
    }
  });

  // 4. Reset Encuadre
  document.getElementById('btn-reset-view')?.addEventListener('click', () => {
    if (currentModel) {
      const h = currentModel.metrics.dimensions.height;
      app.resetCamera([7, 5, 8], [0, h * 0.4, 0]);
    } else {
      app.resetCamera();
    }
  });

  // 5. Presets de Ambiente e Iluminación
  const studioBtn = document.getElementById('env-studio');
  const daylightBtn = document.getElementById('env-daylight');
  const darkBtn = document.getElementById('env-dark');

  const setEnvActive = (activeBtn: HTMLElement) => {
    [studioBtn, daylightBtn, darkBtn].forEach((b) => b?.classList.remove('vxr-btn-primary'));
    activeBtn.classList.add('vxr-btn-primary');
  };

  studioBtn?.addEventListener('click', () => {
    app.scene.setEnvironmentPreset('studio');
    setEnvActive(studioBtn);
  });

  daylightBtn?.addEventListener('click', () => {
    app.scene.setEnvironmentPreset('daylight');
    setEnvActive(daylightBtn);
  });

  darkBtn?.addEventListener('click', () => {
    app.scene.setEnvironmentPreset('dark');
    setEnvActive(darkBtn);
  });
}

window.addEventListener('DOMContentLoaded', bootstrap);
