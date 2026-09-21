import * as THREE from 'three';
import { XRApp } from '@vxr/core';

async function bootstrap() {
  console.log('[VXR Quest Basic] Inicializando experiencia...');

  // 1. Instanciar XRApp con runtime auto-detectable y perfilado Quest
  const app = new XRApp({
    container: '#app',
    cameraPosition: [0, 1.6, 2.5],
    runtime: 'auto',
    targetFrameRate: 90,
    questOptimization: true,
    enableShadows: true,
    enableGrid: true,
    autoVRButton: true,
  });

  const targets: THREE.Mesh[] = [];

  // 2. Crear objetos interactivos en el espacio 3D
  const createInteractiveCube = (x: number, y: number, z: number, color: number, name: string) => {
    const geometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.25,
      metalness: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = name;
    app.scene.add(mesh);
    targets.push(mesh);
    return mesh;
  };

  const cubeA = createInteractiveCube(-0.6, 1.3, -1.2, 0x38bdf8, 'Cubo Cian');
  const cubeB = createInteractiveCube(0.0, 1.4, -1.2, 0x10b981, 'Cubo Esmeralda');
  const cubeC = createInteractiveCube(0.6, 1.3, -1.2, 0xa855f7, 'Cubo Violeta');

  // Pedestal decorativo
  const pedestalGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.8, 32);
  const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(0, 0.4, -1.2);
  pedestal.receiveShadow = true;
  app.scene.add(pedestal);

  // 3. Función unificada de interacción (funciona tanto con Mouse como con Mandos Quest)
  const onHitObject = (mesh: THREE.Mesh) => {
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.color.setHex(Math.random() * 0xffffff);

    // Salto visual breve
    const origY = mesh.position.y;
    mesh.position.y += 0.08;
    setTimeout(() => { mesh.position.y = origY; }, 120);

    // Audio sintetizado procedural de VXR (cero descargas externas)
    try {
      app.audio.playBeep(520 + Math.random() * 200, 0.08, 'sine');
    } catch {}

    const statusEl = document.getElementById('interact-status');
    if (statusEl) {
      statusEl.textContent = `¡Impacto en ${mesh.name}!`;
    }
  };

  // 4. Interacción 1: Desktop (Mouse / Pointer)
  window.addEventListener('pointerdown', (event) => {
    if (app.session.isPresenting) return; // Si está en VR, el puntero lo maneja el mando
    const hits = app.raycastPointer(event, targets);
    if (hits.length > 0) {
      onHitObject(hits[0].object as THREE.Mesh);
    }
  });

  // 5. Interacción 2: Meta Quest Controllers (WebXR 6DoF)
  app.onControllerSelect((controllerIndex) => {
    const hits = app.raycastController(controllerIndex, targets);
    if (hits.length > 0) {
      onHitObject(hits[0].object as THREE.Mesh);
    }
  });

  // 6. Monitorear transición de sesión VR para actualizar HUD
  app.session.onStateChange((isVR) => {
    const modeEl = document.getElementById('runtime-mode');
    if (modeEl) {
      modeEl.textContent = isVR ? '🥽 Meta Quest VR (90Hz Target)' : '🖥️ Desktop (OrbitControls)';
      modeEl.style.color = isVR ? '#38bdf8' : '#10b981';
    }
  });

  // 7. Animación sutil de rotación
  app.onUpdate((delta) => {
    cubeA.rotation.y += delta * 0.8;
    cubeB.rotation.x += delta * 0.6;
    cubeC.rotation.y += delta * 0.9;
  });

  // 8. Intentar cargar modelo GLB adicional si está disponible
  try {
    await app.loadModel('/model.glb', {
      autoGround: true,
      autoCenter: true,
    });
  } catch {
    // Si no existe, los cubos interactivos y el pedestal proveen la experiencia completa
  }

  // 9. Iniciar el bucle de renderizado universal
  app.start();
  console.log('[VXR Quest Basic] Experiencia en ejecución.');
}

window.addEventListener('DOMContentLoaded', bootstrap);
