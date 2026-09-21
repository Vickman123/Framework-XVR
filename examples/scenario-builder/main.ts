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

// Pedestal sculpture in center of Lobby
const pedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(0.8, 1.0, 0.9, 16),
  new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.2 })
);
pedestal.position.y = 0.45;
pedestal.castShadow = true;
pedestal.receiveShadow = true;

const gem = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.5, 0),
  new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9 })
);
gem.position.y = 1.35;
gem.castShadow = true;
lobby.addDecoration(pedestal);
lobby.addDecoration(gem);

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

// 4. Player Navigation & First-Person System
let isFirstPerson = false;
const playerPos = new THREE.Vector3(0, 1.6, 2);
const playerVelocity = new THREE.Vector3();
let playerPitch = 0;
let playerYaw = 0;

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

// 5. Update Loop with Automated Scenario Collision Checking
app.onUpdate((delta, elapsed) => {
  // Rotate gem and reactor core
  gem.rotation.y = elapsed * 1.2;
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

    if (inputDir.lengthSq() > 0.001) {
      inputDir.normalize().multiplyScalar(4.5);
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

    // Apply to camera
    app.camera.position.copy(playerPos);
    const euler = new THREE.Euler(playerPitch, playerYaw, 0, 'YXZ');
    app.camera.quaternion.setFromEuler(euler);
  }
});

// 6. UI Controls & Interactions
const btnToggleCam = document.getElementById('btn-toggle-cam') as HTMLButtonElement;
const selectRoom = document.getElementById('select-room') as HTMLSelectElement;
const selectTheme = document.getElementById('select-theme') as HTMLSelectElement;
const btnAddRoom = document.getElementById('btn-add-room') as HTMLButtonElement;
const metricRoomsCount = document.getElementById('metric-rooms-count') as HTMLElement;
const codeModal = document.getElementById('code-modal') as HTMLElement;
const btnShowCode = document.getElementById('btn-show-code') as HTMLButtonElement;
const btnCloseModal = document.getElementById('btn-close-modal') as HTMLButtonElement;
const codeDisplay = document.getElementById('code-display') as HTMLElement;

// Toggle First Person / Drone Orbit Mode
btnToggleCam.addEventListener('click', () => {
  isFirstPerson = !isFirstPerson;
  if (isFirstPerson) {
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

  const spawn = targetRoom.getSpawnPosition();
  if (isFirstPerson) {
    playerPos.copy(spawn);
    app.camera.position.copy(playerPos);
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

  // Re-instantiate room with new theme keeping dimensions and doors
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

  // Add room
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

  // Connect corridor from lobby East to lounge West
  scenario.connectRooms('lobby', 'east', 'lounge', 'west', { width: 2.2, height: 3.0 });

  // Update UI dropdown
  const opt = document.createElement('option');
  opt.value = 'lounge';
  opt.textContent = '🛋️ Sala 04: Lounge & Descanso';
  selectRoom.appendChild(opt);
  selectRoom.value = 'lounge';
  metricRoomsCount.textContent = '4';
  btnAddRoom.disabled = true;
  btnAddRoom.style.opacity = '0.5';

  // Smooth camera transition
  if (!isFirstPerson) {
    app.resetCamera([14, 14, 12], [14, 0, 0]);
  }
});

// Show Code / JSON Modal
const sampleCode = `// ===============================================
// EJEMPLO DE CÓDIGO CON VXR (3 LÍNEAS POR SALA)
// ===============================================
import { XRApp } from 'vxr';

const app = new XRApp({ enableVR: true });
const scenario = app.createScenario('Mi Espacio 3D');

// 1. Crear Sala Galería
scenario.addRoom({
  id: 'lobby',
  dimensions: { width: 12, depth: 10 },
  theme: 'gallery',
  doors: [{ wall: 'north', targetRoomId: 'lab' }]
});

// 2. Crear Sala Laboratorio
scenario.addRoom({
  id: 'lab',
  center: [0, 0, -18],
  dimensions: { width: 14, depth: 12 },
  theme: 'scifi',
  doors: [{ wall: 'south', targetRoomId: 'lobby' }]
});

// 3. Conectar automáticamente con un pasillo
scenario.connectRooms('lobby', 'north', 'lab', 'south');

app.start();

// ===============================================
// O DIRECTO DESDE UN ARCHIVO JSON (Sin programar)
// ===============================================
await app.loadScenario('./escenario.json');`;

codeDisplay.textContent = sampleCode;

btnShowCode.addEventListener('click', () => {
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
