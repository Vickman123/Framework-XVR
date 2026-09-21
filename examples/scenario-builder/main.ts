import * as THREE from 'three';
import { XRApp, type RoomTheme } from '@vxr/core';

// 1. Initialize VXR Application
const container = document.getElementById('app') as HTMLElement;
const app = new XRApp({
  container,
  enableShadows: true,
  enableGrid: false,
  enableVR: true,
  autoVRButton: true,
  cameraPosition: [0, 16, 18],
  fov: 50,
});

// Configure base environment lighting
app.scene.setEnvironmentPreset('studio');
app.scene.setBackground(0x0a0f1d);

// 2. Build Multi-Room Scenario
const scenario = app.createScenario('VXR Multi-Room Facility');

// Room 01: Gallery / Reception Hub
const lobby = scenario.addRoom({
  id: 'lobby',
  name: 'Lobby & Galería',
  center: [0, 0, 0],
  dimensions: { width: 12, depth: 10, height: 3.8 },
  theme: 'gallery',
  doors: [
    { wall: 'north', targetRoomId: 'lab', width: 2.4, height: 2.8 },
  ],
  spawnPoint: [0, 1.6, 2],
});

// Room 02: Sci-Fi Innovation Lab
const lab = scenario.addRoom({
  id: 'lab',
  name: 'Laboratorio Sci-Fi',
  center: [0, 0, -18],
  dimensions: { width: 14, depth: 12, height: 4.2 },
  theme: 'scifi',
  doors: [
    { wall: 'south', targetRoomId: 'lobby', width: 2.4, height: 2.8 },
    { wall: 'east', targetRoomId: 'office', width: 2.2, height: 2.6 },
  ],
  spawnPoint: [0, 1.6, -18],
});

// Sci-Fi rotating reactor ring in lab
const reactorCore = new THREE.Group();
const ring1 = new THREE.Mesh(
  new THREE.TorusGeometry(1.4, 0.08, 16, 32),
  new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8 })
);
const ring2 = new THREE.Mesh(
  new THREE.TorusGeometry(1.0, 0.06, 16, 32),
  new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 0.6 })
);
reactorCore.add(ring1, ring2);
reactorCore.position.set(0, 2.0, 0);
lab.addDecoration(reactorCore);

// Room 03: Executive Office & Meeting Room
const office = scenario.addRoom({
  id: 'office',
  name: 'Sala Ejecutiva',
  center: [16, 0, -18],
  dimensions: { width: 10, depth: 10, height: 3.5 },
  theme: 'office',
  doors: [
    { wall: 'west', targetRoomId: 'lab', width: 2.2, height: 2.6 },
  ],
  spawnPoint: [16, 1.6, -18],
});

// Conference Table in Office
const table = new THREE.Mesh(
  new THREE.BoxGeometry(4.2, 0.1, 2.0),
  new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
);
table.position.y = 0.8;
table.castShadow = true;
table.receiveShadow = true;
office.addDecoration(table);

// 3. Connect Rooms with Automatic Corridors
scenario.connectRooms('lobby', 'north', 'lab', 'south', { width: 2.6, height: 3.2 });
scenario.connectRooms('lab', 'east', 'office', 'west', { width: 2.4, height: 3.0 });

// 4. Mount Interactive Interdisciplinary Exhibits
const exhibitRelic = app.addExhibit({
  id: 'exhibit-relic',
  title: 'Reliquia Solar Ancestral',
  category: 'ARQUEOLOGÍA & PATRIMONIO',
  description: 'Pieza de orfebrería ceremonial con grabados de alineación solar. Digitalizada mediante fotogrametría 3D.',
  specs: ['ÉPOCA: Posclásico (~1250 d.C.)', 'MATERIAL: Oro y Obsidiana', 'ESCÁNER: Resolución 0.1 mm', 'CUSTODIA: Museo Digital'],
  themeColor: '#f59e0b',
  position: [-3.2, 0, 0],
  onInspect: () => {
    tutorial.completeTask('inspect-relic');
  }
});

const exhibitReactor = app.addExhibit({
  id: 'exhibit-reactor',
  title: 'Reactor de Fusión Cuántica',
  category: 'FÍSICA & ENERGÍA LIMPIA',
  description: 'Dispositivo experimental de confinamiento magnético toroidal para generación de plasma a 150M °C sin carbono.',
  specs: ['TEMPERATURA: 150,000,000 °C', 'CAMPO B: 5.3 Tesla', 'COMBUSTIBLE: Deuterio-Tritio', 'EMISIÓN CO₂: Cero neto'],
  themeColor: '#38bdf8',
  position: [3.2, 0, -18],
  onInspect: () => {
    tutorial.completeTask('inspect-reactor');
  }
});

const exhibitArch = app.addExhibit({
  id: 'exhibit-arch',
  title: 'Prototipo Bioclimático Pasivo',
  category: 'ARQUITECTURA SOSTENIBLE',
  description: 'Maqueta interactiva de edificación modular con chimenea solar pasiva, captación pluvial y envolvente térmica.',
  specs: ['EFICIENCIA: Certificación LEED', 'MATERIAL: CLT y Tierra compactada', 'HUELLA: Carbono Negativo', 'ESCALA: 1:20'],
  themeColor: '#10b981',
  position: [16, 0, -21.2],
  onInspect: () => {
    tutorial.completeTask('inspect-arch');
  }
});

// 5. Interactive Guided Checklist Tutorial
const tutorial = app.createTutorial({
  title: 'Misión Interdisciplinaria',
  position: 'top-left',
  tasks: [
    { id: 'start-walk', title: 'Iniciar Recorrido', description: 'Pulsa el botón "Primera Persona" para comenzar el tour a pie.' },
    { id: 'inspect-relic', title: 'Examinar Reliquia de Arqueología', description: 'Haz clic en el pedestal dorado del Lobby.' },
    { id: 'cross-lab', title: 'Atravesar al Laboratorio', description: 'Cruza el pasillo norte hacia la sala de ciencias.' },
    { id: 'inspect-reactor', title: 'Inspeccionar Reactor de Fusión', description: 'Examina la consola de física cuántica.' },
    { id: 'inspect-arch', title: 'Auditar Maqueta Arquitectónica', description: 'Entra a la sala este e inspecciona el modelo sostenible.' },
    { id: 'drop-model', title: 'Importar Modelo 3D Local', description: 'Arrastra un archivo .glb a la ventana para medirlo en 3D.', optional: true }
  ],
  onAllComplete: () => {
    app.audio.playSuccess();
  }
});

// 6. Zero-Server Local 3D File Drag & Drop
app.enableLocalFileDrop({
  maxDimension: 2.2,
  targetPosition: [0, 1.2, -18],
  onModelLoaded: (loaded, file) => {
    tutorial.completeTask('drop-model');
    const { width, height, depth } = loaded.metrics.dimensions;
    alert(`🎉 ¡Modelo "${file.name}" cargado exitosamente!\n\n• Dimensiones: ${width.toFixed(2)}m × ${height.toFixed(2)}m × ${depth.toFixed(2)}m\n• Polígonos: ${loaded.metrics.triangleCount.toLocaleString()}\n• Vértices: ${loaded.metrics.vertexCount.toLocaleString()}\n\nColocado automáticamente en el Laboratorio.`);
  }
});

// 7. Raycasting for Exhibit Interactions
container.addEventListener('click', (e) => {
  const hits = app.raycastPointer(e);
  if (hits.length > 0) {
    for (const hit of hits) {
      for (const exhibit of app.exhibits) {
        if (hit.object === exhibit.screenMesh || exhibit.nativeGroup.getObjectById(hit.object.id)) {
          exhibit.inspect();
          app.audio.playClick();
          return;
        }
      }
    }
  }
});

// 8. Player Navigation & First-Person System
let isFirstPerson = false;
const playerPos = new THREE.Vector3(0, 1.6, 2);
const playerVelocity = new THREE.Vector3();
let playerPitch = 0;
let playerYaw = 0;
let stepTimer = 0;

// Input tracking
const keys: Record<string, boolean> = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Mouse look with pointer lock
let isPointerLocked = false;
document.addEventListener('pointerlockchange', () => {
  isPointerLocked = document.pointerLockElement === container;
});

container.addEventListener('click', () => {
  if (isFirstPerson && !isPointerLocked) {
    container.requestPointerLock?.();
  }
});

document.addEventListener('mousemove', (e) => {
  if (!isFirstPerson || !isPointerLocked) return;
  playerYaw -= (e.movementX || 0) * 0.0024;
  playerPitch -= (e.movementY || 0) * 0.0024;
  playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, playerPitch));
});

// Mobile Virtual Touch Controls
const touchMove = new THREE.Vector2();
const joystickZone = document.getElementById('mobile-joystick');
const joystickKnob = document.getElementById('joystick-knob');
let isMobile = false;

if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  isMobile = true;
  if (joystickZone) joystickZone.style.display = 'block';

  let joystickTouchId: number | null = null;
  let center = { x: 0, y: 0 };
  const maxRadius = 38;

  joystickZone?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    joystickTouchId = t.identifier;
    const rect = joystickZone!.getBoundingClientRect();
    center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    updateKnob(t.clientX, t.clientY);
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joystickTouchId) {
        updateKnob(t.clientX, t.clientY);
      }
    }
  }, { passive: false });

  const endDrag = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId) {
        joystickTouchId = null;
        if (joystickKnob) joystickKnob.style.transform = 'translate(-50%, -50%)';
        touchMove.set(0, 0);
      }
    }
  };
  window.addEventListener('touchend', endDrag);
  window.addEventListener('touchcancel', endDrag);

  function updateKnob(cx: number, cy: number) {
    const dx = cx - center.x;
    const dy = cy - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, maxRadius);
    const ang = Math.atan2(dy, dx);
    const kx = Math.cos(ang) * clamped;
    const ky = Math.sin(ang) * clamped;
    if (joystickKnob) {
      joystickKnob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
    }
    touchMove.set(kx / maxRadius, ky / maxRadius);
  }

  // Right side touch look
  let lookTouchId: number | null = null;
  let lastTouch = { x: 0, y: 0 };

  window.addEventListener('touchstart', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.clientX > window.innerWidth * 0.4 && lookTouchId === null) {
        lookTouchId = t.identifier;
        lastTouch = { x: t.clientX, y: t.clientY };
      }
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouchId) {
        const dx = t.clientX - lastTouch.x;
        const dy = t.clientY - lastTouch.y;
        lastTouch = { x: t.clientX, y: t.clientY };
        playerYaw -= dx * 0.005;
        playerPitch -= dy * 0.005;
        playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, playerPitch));
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId) {
        lookTouchId = null;
      }
    }
  });
}

// 9. Update Loop with Automated Scenario Collision Checking & Procedural Sound
app.onUpdate((delta, elapsed) => {
  // Rotate gem and reactor core
  reactorCore.rotation.x = elapsed * 0.8;
  reactorCore.rotation.y = elapsed * 1.5;

  if (isFirstPerson) {
    // 1. Calculate direction vectors relative to player yaw
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYaw);

    const inputDir = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp']) inputDir.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) inputDir.sub(forward);
    if (keys['KeyD'] || keys['ArrowRight']) inputDir.add(right);
    if (keys['KeyA'] || keys['ArrowLeft']) inputDir.sub(right);

    // Mobile touch vector
    if (touchMove.lengthSq() > 0.01) {
      inputDir.add(forward.clone().multiplyScalar(-touchMove.y));
      inputDir.add(right.clone().multiplyScalar(touchMove.x));
    }

    const isMoving = inputDir.lengthSq() > 0.001;
    if (isMoving) {
      inputDir.normalize().multiplyScalar(4.5);

      // Footstep sound synthesis
      stepTimer += delta;
      if (stepTimer >= 0.42) {
        app.audio.playStep();
        stepTimer = 0;
      }
    } else {
      stepTimer = 0.35;
    }

    // Velocity smoothing
    playerVelocity.x += (inputDir.x - playerVelocity.x) * Math.min(delta * 10, 1.0);
    playerVelocity.z += (inputDir.z - playerVelocity.z) * Math.min(delta * 10, 1.0);

    // 2. Continuous Wall-Slide Collision Resolution
    const proposed = playerPos.clone();
    proposed.x += playerVelocity.x * delta;
    proposed.z += playerVelocity.z * delta;

    const clamped = app.constrainToScenario(playerPos, proposed, 0.35);
    playerPos.x = clamped.x;
    playerPos.z = clamped.z;
    playerPos.y = 1.6;

    // Trigger mission progress when entering rooms
    if (playerPos.z < -10) {
      tutorial.completeTask('cross-lab');
    }

    // Apply to camera
    app.camera.position.copy(playerPos);
    const euler = new THREE.Euler(playerPitch, playerYaw, 0, 'YXZ');
    app.camera.quaternion.setFromEuler(euler);
  }
});

// 10. UI Controls & Interactions
const btnToggleCam = document.getElementById('btn-toggle-cam') as HTMLButtonElement;
const btnToggleSound = document.getElementById('btn-toggle-sound') as HTMLButtonElement;
const selectRoom = document.getElementById('select-room') as HTMLSelectElement;
const selectTheme = document.getElementById('select-theme') as HTMLSelectElement;
const btnAddRoom = document.getElementById('btn-add-room') as HTMLButtonElement;
const metricRoomsCount = document.getElementById('metric-rooms-count') as HTMLElement;
const codeModal = document.getElementById('code-modal') as HTMLElement;
const btnShowCode = document.getElementById('btn-show-code') as HTMLButtonElement;
const btnCloseModal = document.getElementById('btn-close-modal') as HTMLButtonElement;
const codeDisplay = document.getElementById('code-display') as HTMLElement;

// Sound toggle button
if (btnToggleSound) {
  btnToggleSound.addEventListener('click', () => {
    const isMuted = app.audio.toggleMute();
    btnToggleSound.textContent = isMuted ? '🔇 Sonido: Silenciado' : '🔊 Sonido Procedural: ON';
    btnToggleSound.style.color = isMuted ? '#f87171' : '#38bdf8';
  });
}

// Toggle First Person / Drone Orbit Mode
btnToggleCam.addEventListener('click', () => {
  isFirstPerson = !isFirstPerson;
  app.audio.playWarp();
  if (isFirstPerson) {
    tutorial.completeTask('start-walk');
    btnToggleCam.textContent = '🛸 Modo Drone / Vista Aérea';
    btnToggleCam.classList.remove('vxr-btn-primary');
    btnToggleCam.style.background = 'rgba(56, 189, 248, 0.2)';
    if (app.controls) app.controls.enabled = false;
    playerPos.set(0, 1.6, 2);
    playerPitch = 0;
    playerYaw = 0;
    app.camera.position.copy(playerPos);
    if (!isMobile) container.requestPointerLock?.();
  } else {
    btnToggleCam.textContent = '🚶 Primera Persona';
    btnToggleCam.classList.add('vxr-btn-primary');
    btnToggleCam.style.background = '';
    if (document.exitPointerLock) document.exitPointerLock();
    if (app.controls) {
      app.controls.enabled = true;
      app.resetCamera([0, 18, 16], [5, 0, -9]);
    }
  }
});

// Teleport to room
selectRoom.addEventListener('change', () => {
  const roomId = selectRoom.value;
  const targetRoom = scenario.getRoom(roomId);
  if (!targetRoom) return;

  app.audio.playWarp();
  const spawn = targetRoom.getSpawnPosition();
  if (isFirstPerson) {
    playerPos.copy(spawn);
    app.camera.position.copy(playerPos);
    if (roomId === 'lab') tutorial.completeTask('cross-lab');
  } else {
    app.resetCamera([spawn.x, 14, spawn.z + 12], [spawn.x, 0, spawn.z]);
  }
});

// Change theme of selected room
selectTheme.addEventListener('change', () => {
  const roomId = selectRoom.value;
  const newTheme = selectTheme.value as RoomTheme;
  const oldRoom = scenario.getRoom(roomId);
  if (!oldRoom) return;

  app.audio.playClick();
  const options = {
    id: oldRoom.id,
    name: oldRoom.name,
    dimensions: oldRoom.dimensions,
    center: [oldRoom.center.x, oldRoom.center.y, oldRoom.center.z] as [number, number, number],
    doors: oldRoom.doors,
    theme: newTheme,
  };

  scenario.removeRoom(roomId);
  scenario.addRoom(options);
});

// Dynamically add a 4th Room
let addedRoom = false;
btnAddRoom.addEventListener('click', () => {
  if (addedRoom) {
    alert('¡La 4ª sala ya ha sido añadida!');
    return;
  }
  addedRoom = true;
  app.audio.playSuccess();

  const lounge = scenario.addRoom({
    id: 'lounge',
    name: 'Sala 04: Lounge & Descanso',
    center: [14, 0, 0],
    dimensions: { width: 10, depth: 8, height: 3.4 },
    theme: 'cozy',
    doors: [
      { wall: 'west', targetRoomId: 'lobby', width: 2.2, height: 2.6 },
    ],
    spawnPoint: [14, 1.6, 0],
  });

  scenario.connectRooms('lobby', 'east', 'lounge', 'west', { width: 2.2, height: 3.0 });

  const opt = document.createElement('option');
  opt.value = 'lounge';
  opt.textContent = '🛋️ Sala 04: Lounge & Descanso';
  selectRoom.appendChild(opt);
  selectRoom.value = 'lounge';
  metricRoomsCount.textContent = '4';
  btnAddRoom.disabled = true;
  btnAddRoom.style.opacity = '0.5';

  if (!isFirstPerson) {
    app.resetCamera([14, 14, 12], [14, 0, 0]);
  }
});

// Show Code / JSON Modal
const sampleCode = `// ===============================================
// VXR: PROYECTO INTERDISCIPLINARIO COMPLETO
// ===============================================
import { XRApp } from 'vxr';

const app = new XRApp({ enableVR: true });
const scenario = app.createScenario('Museo & Lab');

// 1. Crear Salas y Conectarlas
scenario.addRoom({ id: 'lobby', theme: 'gallery', doors: [{ wall: 'north', targetRoomId: 'lab' }] });
scenario.addRoom({ id: 'lab', center: [0, 0, -18], theme: 'scifi', doors: [{ wall: 'south', targetRoomId: 'lobby' }] });
scenario.connectRooms('lobby', 'north', 'lab', 'south');

// 2. Añadir Pedestal Interactivo (Arqueología / Historia)
app.addExhibit({
  title: 'Reliquia Solar Ancestral',
  category: 'ARQUEOLOGÍA',
  description: 'Digitalización 3D por fotogrametría.',
  specs: ['ÉPOCA: ~1250 d.C.', 'MATERIAL: Oro'],
  position: [-3.2, 0, 0]
});

// 3. Crear Guía de Práctica / Misiones para Alumnos
const tutorial = app.createTutorial({
  title: 'Misión del Estudiante',
  tasks: [
    { id: '1', title: 'Explorar el Lobby' },
    { id: '2', title: 'Inspeccionar la Reliquia' }
  ]
});

// 4. Activar Arrastrar y Soltar 3D (Drag & Drop local)
app.enableLocalFileDrop({ maxDimension: 2.0 });

// 5. Iniciar Aplicación y Sonido Procedural
app.start();`;

codeDisplay.textContent = sampleCode;

btnShowCode.addEventListener('click', () => {
  app.audio.playClick();
  codeModal.style.display = 'flex';
});

btnCloseModal.addEventListener('click', () => {
  codeModal.style.display = 'none';
});

codeModal.addEventListener('click', (e) => {
  if (e.target === codeModal) codeModal.style.display = 'none';
});

// Start VXR App
app.start();
