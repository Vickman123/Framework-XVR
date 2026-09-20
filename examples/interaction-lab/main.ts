import { XRApp } from '@vxr/core';
import * as THREE from 'three';

interface LabItem {
  name: string;
  mesh: THREE.Mesh;
  state: string;
  interact: () => void;
  update?: (delta: number, elapsed: number) => void;
}

let app: XRApp;
const interactiveItems: LabItem[] = [];
const interactiveMeshes: THREE.Mesh[] = [];

let hoveredItem: LabItem | null = null;
let lastHitDistance: number | null = null;

async function bootstrap() {
  console.log('[VXR Interaction Lab] Inicializando laboratorio de interacción espacial...');

  // 1. Instanciar aplicación VXR
  app = new XRApp({
    container: '#app',
    cameraPosition: [0, 1.6, 2.5],
    enableShadows: true,
    enableGrid: true,
    autoOrbitControls: true,
    autoVRButton: true,
  });

  // 2. Construir estación de trabajo e instrumentos interactivos 3D
  setupEnvironment();
  setupInteractiveProps();

  // 3. Configurar eventos de interacción en Desktop y WebXR
  setupInteractions();

  // 4. Bucle de actualización por fotograma
  app.onUpdate((delta, elapsed) => {
    // Actualizar animaciones internas de props
    for (const item of interactiveItems) {
      if (item.update) item.update(delta, elapsed);
    }

    // En WebXR, verificar raycast continuo del mando para hover
    if (app.session.isPresenting) {
      document.getElementById('hud-mode')!.textContent = 'WebXR 6DoF';
      checkVRHover();
    }
  });

  // Actualizar modo en el HUD al cambiar estado de sesión
  app.session.onStateChange((isVR) => {
    const badge = document.getElementById('hud-mode');
    if (badge) {
      badge.textContent = isVR ? 'WebXR 6DoF' : 'Desktop';
      badge.style.color = isVR ? '#10b981' : '#38bdf8';
    }
    logEvent(isVR ? 'Sesión WebXR iniciada.' : 'Sesión WebXR finalizada.');
  });

  // 5. Iniciar la aplicación
  app.start();
  logEvent('Laboratorio operativo.');
}

/**
 * Crea una mesa de trabajo tecnológica con iluminación de estudio.
 */
function setupEnvironment(): void {
  // Consola / Pedestal de trabajo
  const tableGeo = new THREE.BoxGeometry(2.6, 0.85, 0.9);
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.8,
  });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, 0.85 / 2, 0);
  table.receiveShadow = true;
  table.castShadow = true;
  app.scene.add(table);

  // Borde luminoso en la mesa
  const trimGeo = new THREE.BoxGeometry(2.62, 0.02, 0.92);
  const trimMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const trim = new THREE.Mesh(trimGeo, trimMat);
  trim.position.set(0, 0.84, 0);
  app.scene.add(trim);
}

/**
 * Construye 3 instrumentos interactivos con comportamientos diferenciados.
 */
function setupInteractiveProps(): void {
  const tableTopY = 0.85;

  // -------------------------------------------------------------
  // Prop 1: Cubo de Diagnóstico (Estados: NORMAL, DIAGNOSTIC, OVERLOAD)
  // -------------------------------------------------------------
  const cubeGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.2,
    metalness: 0.3,
    emissive: 0x0284c7,
    emissiveIntensity: 0.15,
  });
  const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
  cubeMesh.position.set(-0.7, tableTopY + 0.12, 0);
  cubeMesh.castShadow = true;
  app.scene.add(cubeMesh);

  let cubeStateIdx = 0;
  const cubeStates = [
    { label: 'NORMAL', color: 0x0284c7, emissive: 0.15 },
    { label: 'DIAGNÓSTICO', color: 0xf59e0b, emissive: 0.4 },
    { label: 'SOBRECARGA', color: 0xef4444, emissive: 0.7 },
  ];

  let cubeScalePunch = 1.0;

  const cubeItem: LabItem = {
    name: 'Cubo de Diagnóstico',
    mesh: cubeMesh,
    state: cubeStates[0].label,
    interact: () => {
      cubeStateIdx = (cubeStateIdx + 1) % cubeStates.length;
      const current = cubeStates[cubeStateIdx];
      cubeItem.state = current.label;
      cubeMat.color.setHex(current.color);
      cubeMat.emissive.setHex(current.color);
      cubeMat.emissiveIntensity = current.emissive;
      cubeScalePunch = 1.25; // Salto de escala
      logEvent(`Cubo conmuta a modo: ${current.label}`);
      updateHUD();
    },
    update: (delta) => {
      // Retorno elástico de escala
      if (cubeScalePunch > 1.0) {
        cubeScalePunch = Math.max(1.0, cubeScalePunch - delta * 2.0);
        cubeMesh.scale.setScalar(cubeScalePunch);
      }
      cubeMesh.rotation.y += delta * 0.25;
    },
  };
  registerItem(cubeItem);

  // -------------------------------------------------------------
  // Prop 2: Esfera de Calibración (Ciclo de Frecuencias y Pulso)
  // -------------------------------------------------------------
  const sphereGeo = new THREE.SphereGeometry(0.14, 32, 32);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0x10b981,
    emissiveIntensity: 0.2,
  });
  const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
  sphereMesh.position.set(0, tableTopY + 0.16, 0);
  sphereMesh.castShadow = true;
  app.scene.add(sphereMesh);

  let sphereFreqIdx = 0;
  const sphereFreqs = ['100 MHz (Calibrado)', '250 MHz (Alta Precisión)', '500 MHz (Turbo)'];
  const sphereColors = [0x10b981, 0x06b6d4, 0xa855f7];

  const sphereItem: LabItem = {
    name: 'Esfera de Calibración',
    mesh: sphereMesh,
    state: sphereFreqs[0],
    interact: () => {
      sphereFreqIdx = (sphereFreqIdx + 1) % sphereFreqs.length;
      sphereItem.state = sphereFreqs[sphereFreqIdx];
      sphereMat.color.setHex(sphereColors[sphereFreqIdx]);
      sphereMat.emissive.setHex(sphereColors[sphereFreqIdx]);
      logEvent(`Esfera ajustada a: ${sphereItem.state}`);
      updateHUD();
    },
    update: (_delta, elapsed) => {
      // Levitar suavemente en Y
      sphereMesh.position.y = tableTopY + 0.16 + Math.sin(elapsed * 2.5) * 0.025;
    },
  };
  registerItem(sphereItem);

  // -------------------------------------------------------------
  // Prop 3: Módulo Giratorio / Turbina (Rotación con Clic)
  // -------------------------------------------------------------
  const rotorGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.22, 16);
  const rotorMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.3,
    metalness: 0.6,
    emissive: 0xf97316,
    emissiveIntensity: 0.15,
  });
  const rotorMesh = new THREE.Mesh(rotorGeo, rotorMat);
  rotorMesh.position.set(0.7, tableTopY + 0.11, 0);
  rotorMesh.castShadow = true;
  app.scene.add(rotorMesh);

  let isRotorSpinning = false;
  let rotorSpeed = 0;

  const rotorItem: LabItem = {
    name: 'Turbina Modular',
    mesh: rotorMesh,
    state: 'Detenida',
    interact: () => {
      isRotorSpinning = !isRotorSpinning;
      rotorItem.state = isRotorSpinning ? 'En Rotación (Activa)' : 'Detenida';
      rotorMat.emissiveIntensity = isRotorSpinning ? 0.6 : 0.15;
      logEvent(isRotorSpinning ? 'Turbina activada: Girando.' : 'Turbina desactivada.');
      updateHUD();
    },
    update: (delta) => {
      if (isRotorSpinning) {
        rotorSpeed = Math.min(6.0, rotorSpeed + delta * 3.0);
      } else {
        rotorSpeed = Math.max(0.0, rotorSpeed - delta * 3.0);
      }
      rotorMesh.rotation.y += rotorSpeed * delta;
    },
  };
  registerItem(rotorItem);
}

function registerItem(item: LabItem): void {
  interactiveItems.push(item);
  interactiveMeshes.push(item.mesh);
}

/**
 * Manejadores de interacción unificada (Desktop Pointer + WebXR Controllers).
 */
function setupInteractions(): void {
  const dom = app.renderer.domElement;

  // A. Movimiento de puntero (Desktop Hover)
  dom.addEventListener('pointermove', (e: PointerEvent) => {
    if (app.session.isPresenting) return; // En VR se usa raycast de mandos

    const hits = app.raycastPointer(e, interactiveMeshes);
    if (hits.length > 0) {
      const hitMesh = hits[0].object as THREE.Mesh;
      const item = interactiveItems.find((i) => i.mesh === hitMesh) || null;
      lastHitDistance = hits[0].distance;
      setHoveredItem(item);
    } else {
      lastHitDistance = null;
      setHoveredItem(null);
    }
  });

  // B. Clic con ratón (Desktop Clic)
  dom.addEventListener('pointerdown', (e: PointerEvent) => {
    if (app.session.isPresenting || e.button !== 0) return;

    const hits = app.raycastPointer(e, interactiveMeshes);
    if (hits.length > 0) {
      const hitMesh = hits[0].object as THREE.Mesh;
      const item = interactiveItems.find((i) => i.mesh === hitMesh);
      if (item) {
        item.interact();
      }
    }
  });

  // C. Disparo del gatillo en WebXR (VR Controller Trigger Select)
  app.onControllerSelect((index) => {
    const hits = app.raycastController(index, interactiveMeshes);
    if (hits.length > 0) {
      const hitMesh = hits[0].object as THREE.Mesh;
      const item = interactiveItems.find((i) => i.mesh === hitMesh);
      if (item) {
        item.interact();
      }
    }
  });
}

/**
 * Comprueba colisión continua de los rayos de los mandos en WebXR para hover.
 */
function checkVRHover(): void {
  let foundHit = false;

  for (let i = 0; i < 2; i++) {
    const hits = app.raycastController(i, interactiveMeshes);
    if (hits.length > 0) {
      const hitMesh = hits[0].object as THREE.Mesh;
      const item = interactiveItems.find((it) => it.mesh === hitMesh) || null;
      lastHitDistance = hits[0].distance;
      setHoveredItem(item);
      foundHit = true;
      break;
    }
  }

  if (!foundHit) {
    lastHitDistance = null;
    setHoveredItem(null);
  }
}

function setHoveredItem(item: LabItem | null): void {
  if (hoveredItem === item) return;

  // Restaurar previo
  if (hoveredItem) {
    const mat = hoveredItem.mesh.material as THREE.MeshStandardMaterial;
    if (mat) mat.emissiveIntensity = 0.15;
  }

  hoveredItem = item;

  // Resaltar nuevo
  if (hoveredItem) {
    const mat = hoveredItem.mesh.material as THREE.MeshStandardMaterial;
    if (mat) mat.emissiveIntensity = 0.55;
  }

  updateHUD();
}

function updateHUD(): void {
  const targetEl = document.getElementById('hud-target');
  const distEl = document.getElementById('hud-dist');
  const stateEl = document.getElementById('hud-state');

  if (hoveredItem) {
    if (targetEl) targetEl.textContent = hoveredItem.name;
    if (distEl) distEl.textContent = lastHitDistance !== null ? `${lastHitDistance.toFixed(2)}m` : '-';
    if (stateEl) stateEl.textContent = hoveredItem.state;
  } else {
    if (targetEl) targetEl.textContent = 'Ninguno';
    if (distEl) distEl.textContent = '-';
    if (stateEl) stateEl.textContent = '-';
  }
}

function logEvent(msg: string): void {
  const list = document.getElementById('log-list');
  if (!list) return;

  const now = new Date();
  const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const li = document.createElement('li');
  li.className = 'log-item';
  li.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-msg">${msg}</span>`;

  list.insertBefore(li, list.firstChild);

  // Mantener máximo 4 elementos
  while (list.children.length > 4) {
    list.removeChild(list.lastChild!);
  }
}

window.addEventListener('DOMContentLoaded', bootstrap);
