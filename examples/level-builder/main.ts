import * as THREE from 'three';
import { XRApp, type RoomTheme, type WallDirection } from '@vxr/core';

// =============================================================================
// Interfaces & Types
// =============================================================================
interface RoomDef {
  id: string;
  name: string;
  theme: RoomTheme;
  dimensions: { width: number; depth: number; height: number };
  center: [number, number, number];
  doors: Array<{ wall: WallDirection; targetRoomId: string; width?: number; height?: number }>;
  spawnPoint?: [number, number, number];
}

interface ConnectionDef {
  id: string;
  fromRoomId: string;
  fromWall: WallDirection;
  toRoomId: string;
  toWall: WallDirection;
  width: number;
  height: number;
}

interface ExhibitDef {
  id: string;
  roomId: string;
  title: string;
  category: string;
  description: string;
  specs: string[];
  themeColor: string;
  relX: number;
  relZ: number;
  modelType: 'gem' | 'rings' | 'monolith' | 'custom';
}

// =============================================================================
// Preset Templates
// =============================================================================
const PRESETS: Record<string, { rooms: RoomDef[]; connections: ConnectionDef[]; exhibits: ExhibitDef[] }> = {
  museum: {
    rooms: [
      {
        id: 'lobby',
        name: 'Lobby & Recepción Principal',
        theme: 'gallery',
        dimensions: { width: 12, depth: 10, height: 3.8 },
        center: [0, 0, 0],
        doors: [{ wall: 'north', targetRoomId: 'archaeology', width: 2.4, height: 2.8 }],
        spawnPoint: [0, 1.6, 2],
      },
      {
        id: 'archaeology',
        name: 'Sala de Arqueología Prehispánica',
        theme: 'cozy',
        dimensions: { width: 14, depth: 12, height: 4.2 },
        center: [0, 0, -18],
        doors: [
          { wall: 'south', targetRoomId: 'lobby', width: 2.4, height: 2.8 },
          { wall: 'east', targetRoomId: 'art', width: 2.2, height: 2.6 },
        ],
        spawnPoint: [0, 1.6, -18],
      },
      {
        id: 'art',
        name: 'Galería de Arte Contemporáneo',
        theme: 'minimal',
        dimensions: { width: 10, depth: 10, height: 3.5 },
        center: [16, 0, -18],
        doors: [{ wall: 'west', targetRoomId: 'archaeology', width: 2.2, height: 2.6 }],
        spawnPoint: [16, 1.6, -18],
      },
    ],
    connections: [
      {
        id: 'conn-1',
        fromRoomId: 'lobby',
        fromWall: 'north',
        toRoomId: 'archaeology',
        toWall: 'south',
        width: 2.6,
        height: 3.2,
      },
      {
        id: 'conn-2',
        fromRoomId: 'archaeology',
        fromWall: 'east',
        toRoomId: 'art',
        toWall: 'west',
        width: 2.4,
        height: 3.0,
      },
    ],
    exhibits: [
      {
        id: 'ex-1',
        roomId: 'lobby',
        title: 'Códice Histórico Digital',
        category: 'PATRIMONIO CULTURAL',
        description: 'Reproducción interactiva de manuscrito pictográfico del siglo XVI.',
        specs: ['RESOLUCIÓN: 0.1mm', 'ORIGEN: México Central', 'MATERIAL: Piel de venado'],
        themeColor: '#f59e0b',
        relX: -3.0,
        relZ: 0,
        modelType: 'monolith',
      },
      {
        id: 'ex-2',
        roomId: 'archaeology',
        title: 'Reliquia Solar Ceremonal',
        category: 'ARQUEOLOGÍA 3D',
        description: 'Orfebrería con grabados astronómicos digitalizada por fotogrametría.',
        specs: ['ERA: Posclásico (~1250 d.C.)', 'ALEACIÓN: Oro y Cobre', 'PRECISIÓN: 50 micras'],
        themeColor: '#38bdf8',
        relX: 3.0,
        relZ: 0,
        modelType: 'gem',
      },
      {
        id: 'ex-3',
        roomId: 'art',
        title: 'Instalación Espacial Resonante',
        category: 'ARTE GENERATIVO',
        description: 'Estructura lumínica interactiva modulada por frecuencias armónicas.',
        specs: ['ILUMINACIÓN: RGB Fotométrico', 'AUDIO: Síntesis Web Audio', 'MODO: Tiempo Real'],
        themeColor: '#10b981',
        relX: 0,
        relZ: -2.5,
        modelType: 'rings',
      },
    ],
  },
  scifi: {
    rooms: [
      {
        id: 'airlock',
        name: 'Esclusa de Descontaminación',
        theme: 'minimal',
        dimensions: { width: 8, depth: 8, height: 3.2 },
        center: [0, 0, 0],
        doors: [{ wall: 'north', targetRoomId: 'fusion-lab', width: 2.2, height: 2.6 }],
        spawnPoint: [0, 1.6, 1],
      },
      {
        id: 'fusion-lab',
        name: 'Laboratorio de Fusión Nuclear',
        theme: 'scifi',
        dimensions: { width: 16, depth: 14, height: 4.5 },
        center: [0, 0, -18],
        doors: [
          { wall: 'south', targetRoomId: 'airlock', width: 2.2, height: 2.6 },
          { wall: 'east', targetRoomId: 'server-vault', width: 2.2, height: 2.6 },
        ],
        spawnPoint: [0, 1.6, -18],
      },
      {
        id: 'server-vault',
        name: 'Cámara de Supercómputo Cuántico',
        theme: 'scifi',
        dimensions: { width: 10, depth: 10, height: 3.6 },
        center: [17, 0, -18],
        doors: [{ wall: 'west', targetRoomId: 'fusion-lab', width: 2.2, height: 2.6 }],
        spawnPoint: [17, 1.6, -18],
      },
    ],
    connections: [
      {
        id: 'conn-1',
        fromRoomId: 'airlock',
        fromWall: 'north',
        toRoomId: 'fusion-lab',
        toWall: 'south',
        width: 2.4,
        height: 3.0,
      },
      {
        id: 'conn-2',
        fromRoomId: 'fusion-lab',
        fromWall: 'east',
        toRoomId: 'server-vault',
        toWall: 'west',
        width: 2.2,
        height: 2.8,
      },
    ],
    exhibits: [
      {
        id: 'ex-1',
        roomId: 'fusion-lab',
        title: 'Reactor Tokamak Magnético',
        category: 'FÍSICA CUÁNTICA',
        description: 'Confinamiento de plasma a 150M °C mediante bobinas superconductoras.',
        specs: ['CAMPO B: 5.3 Tesla', 'COMBUSTIBLE: D-T', 'EMISIONES: Cero CO₂'],
        themeColor: '#38bdf8',
        relX: 0,
        relZ: 0,
        modelType: 'rings',
      },
    ],
  },
  bim: {
    rooms: [
      {
        id: 'atrium',
        name: 'Átrio Central & Maqueta BIM',
        theme: 'office',
        dimensions: { width: 14, depth: 12, height: 4.0 },
        center: [0, 0, 0],
        doors: [{ wall: 'north', targetRoomId: 'terrace', width: 2.6, height: 3.0 }],
        spawnPoint: [0, 1.6, 2],
      },
      {
        id: 'terrace',
        name: 'Terraza Bioclimática',
        theme: 'gallery',
        dimensions: { width: 12, depth: 10, height: 3.6 },
        center: [0, 0, -18],
        doors: [{ wall: 'south', targetRoomId: 'atrium', width: 2.6, height: 3.0 }],
        spawnPoint: [0, 1.6, -18],
      },
    ],
    connections: [
      {
        id: 'conn-1',
        fromRoomId: 'atrium',
        fromWall: 'north',
        toRoomId: 'terrace',
        toWall: 'south',
        width: 2.8,
        height: 3.2,
      },
    ],
    exhibits: [
      {
        id: 'ex-1',
        roomId: 'atrium',
        title: 'Maqueta Arquitectónica LEED',
        category: 'EDIFICACIÓN SOSTENIBLE',
        description: 'Envolvente térmica de alta eficiencia con captación solar fotovoltaica.',
        specs: ['CERTIFICACIÓN: LEED Platinum', 'ESTRUCTURA: CLT Madera', 'ESCALA: 1:50'],
        themeColor: '#10b981',
        relX: 0,
        relZ: 0,
        modelType: 'monolith',
      },
    ],
  },
  empty: {
    rooms: [
      {
        id: 'room-1',
        name: 'Sala Principal',
        theme: 'gallery',
        dimensions: { width: 12, depth: 10, height: 3.8 },
        center: [0, 0, 0],
        doors: [],
        spawnPoint: [0, 1.6, 0],
      },
    ],
    connections: [],
    exhibits: [],
  },
};

// =============================================================================
// Application State
// =============================================================================
let rooms: RoomDef[] = JSON.parse(JSON.stringify(PRESETS.museum.rooms));
let connections: ConnectionDef[] = JSON.parse(JSON.stringify(PRESETS.museum.connections));
let exhibits: ExhibitDef[] = JSON.parse(JSON.stringify(PRESETS.museum.exhibits));
let selectedRoomId: string = rooms[0].id;
let isFirstPerson = false;
let activeExportTab: 'ts' | 'html' | 'json' = 'ts';

// Props meshes for rotation in render loop
const animatedProps: THREE.Object3D[] = [];

// =============================================================================
// Initialize VXR Application
// =============================================================================
const container = document.getElementById('app') as HTMLElement;
const app = new XRApp({
  container,
  enableShadows: true,
  enableGrid: false,
  enableVR: true,
  autoVRButton: true,
  cameraPosition: [0, 24, 24],
  fov: 50,
});

app.scene.setEnvironmentPreset('studio');
app.scene.setBackground(0x070c18);

let scenario = app.createScenario('Workshop Studio Level');

// =============================================================================
// First-Person Navigation Controller with PointerLock & Touch
// =============================================================================
const playerPos = new THREE.Vector3(0, 1.6, 2);
const playerVelocity = new THREE.Vector3();
let playerPitch = 0;
let playerYaw = 0;
let stepTimer = 0;
let isPointerLocked = false;
const keys: Record<string, boolean> = {};

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

document.addEventListener('pointerlockchange', () => {
  isPointerLocked = document.pointerLockElement === container;
});

container.addEventListener('click', (e) => {
  if (isFirstPerson && !isPointerLocked) {
    container.requestPointerLock?.();
  }

  // Raycasting for interactive pedestals
  const hits = app.raycastPointer(e);
  if (hits.length > 0) {
    for (const hit of hits) {
      for (const ex of app.exhibits) {
        if (hit.object === ex.screenMesh || ex.nativeGroup.getObjectById(hit.object.id)) {
          ex.inspect();
          app.audio.playClick();
          showToast(`Inspeccionando: ${ex.title}`);
          return;
        }
      }
    }
  }
});

document.addEventListener('mousemove', (e) => {
  if (!isFirstPerson || !isPointerLocked) return;
  playerYaw -= (e.movementX || 0) * 0.0024;
  playerPitch -= (e.movementY || 0) * 0.0024;
  playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, playerPitch));
});

// Drag & Drop Local 3D Model (.glb)
app.enableLocalFileDrop({
  maxDimension: 2.4,
  onModelLoaded: (loaded, file) => {
    app.audio.playSuccess();
    const selRoom = rooms.find((r) => r.id === selectedRoomId);
    showToast(`🎉 ¡Modelo "${file.name}" cargado en ${selRoom ? selRoom.name : 'la sala'}!`);
  },
});

// Update Loop
app.onUpdate((delta, elapsed) => {
  // Animate custom props
  for (let i = 0; i < animatedProps.length; i++) {
    animatedProps[i].rotation.y = elapsed * (0.8 + i * 0.2);
  }

  if (isFirstPerson) {
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYaw);

    const inputDir = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp']) inputDir.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) inputDir.sub(forward);
    if (keys['KeyD'] || keys['ArrowRight']) inputDir.add(right);
    if (keys['KeyA'] || keys['ArrowLeft']) inputDir.sub(right);

    const isMoving = inputDir.lengthSq() > 0.001;
    if (isMoving) {
      inputDir.normalize().multiplyScalar(4.5);

      stepTimer += delta;
      if (stepTimer >= 0.42) {
        app.audio.playStep();
        stepTimer = 0;
      }
    } else {
      stepTimer = 0.35;
    }

    playerVelocity.x += (inputDir.x - playerVelocity.x) * Math.min(delta * 10, 1.0);
    playerVelocity.z += (inputDir.z - playerVelocity.z) * Math.min(delta * 10, 1.0);

    // Continuous Collision Resolution without invisible walls
    const proposed = playerPos.clone();
    proposed.x += playerVelocity.x * delta;
    proposed.z += playerVelocity.z * delta;

    const clamped = app.constrainToScenario(playerPos, proposed, 0.35);
    playerPos.x = clamped.x;
    playerPos.z = clamped.z;
    playerPos.y = 1.6;

    app.camera.position.copy(playerPos);
    const euler = new THREE.Euler(playerPitch, playerYaw, 0, 'YXZ');
    app.camera.quaternion.setFromEuler(euler);
  }
});

// =============================================================================
// Scenario Builder & Real-Time Sync
// =============================================================================
function createPropMesh(type: 'gem' | 'rings' | 'monolith' | 'custom', colorHex: string): THREE.Object3D {
  const group = new THREE.Group();
  const color = new THREE.Color(colorHex);

  if (type === 'gem') {
    const geo = new THREE.OctahedronGeometry(0.7, 0);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 1.7;
    group.add(mesh);
    animatedProps.push(mesh);
  } else if (type === 'rings') {
    const r1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.06, 16, 32),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8 })
    );
    const r2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.05, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 0.5 })
    );
    r2.rotation.x = Math.PI / 3;
    group.add(r1, r2);
    group.position.y = 1.7;
    animatedProps.push(group);
  } else {
    // Monolith
    const geo = new THREE.BoxGeometry(0.6, 1.4, 0.2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 1.7;

    const core = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 0.22),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9 })
    );
    core.position.y = 1.7;
    group.add(mesh, core);
    animatedProps.push(group);
  }

  return group;
}

function rebuildScenario(): void {
  // 1. Dispose old exhibits & clear props
  animatedProps.length = 0;
  for (const ex of app.exhibits) {
    ex.dispose();
  }
  app.exhibits.length = 0;

  // 2. Clear old scenario
  if (scenario) {
    app.scene.nativeScene.remove(scenario.nativeGroup);
    scenario.dispose();
  }
  scenario = app.createScenario('Workshop Studio Level');

  // 3. Add Rooms
  for (const r of rooms) {
    const room = scenario.addRoom({
      id: r.id,
      name: r.name,
      theme: r.theme,
      center: r.center,
      dimensions: r.dimensions,
      doors: r.doors,
      spawnPoint: r.spawnPoint || [r.center[0], 1.6, r.center[2]],
    });

    // Add decorative ceiling tag or lighting
    if (r.theme === 'scifi') {
      const grid = new THREE.GridHelper(Math.max(r.dimensions.width, r.dimensions.depth), 12, 0x00f0ff, 0x1e293b);
      grid.position.set(0, 0.01, 0);
      room.addDecoration(grid);
    }
  }

  // 4. Connect Corridors
  for (const conn of connections) {
    scenario.connectRooms(
      conn.fromRoomId,
      conn.fromWall,
      conn.toRoomId,
      conn.toWall,
      { width: conn.width, height: conn.height }
    );
  }

  // 5. Mount Exhibits
  for (const ex of exhibits) {
    const parentRoom = rooms.find((r) => r.id === ex.roomId);
    if (!parentRoom) continue;

    const posX = parentRoom.center[0] + ex.relX;
    const posZ = parentRoom.center[2] + ex.relZ;

    const exhibitInstance = app.addExhibit({
      id: ex.id,
      title: ex.title,
      category: ex.category,
      description: ex.description,
      specs: ex.specs,
      themeColor: ex.themeColor,
      position: [posX, 0, posZ],
    });

    // Add 3D prop above pedestal
    const prop = createPropMesh(ex.modelType, ex.themeColor);
    prop.position.set(posX, 0, posZ);
    app.scene.nativeScene.add(prop);
    animatedProps.push(prop);
  }

  // Update UI & metrics
  renderRoomsList();
  renderCorridorsList();
  renderExhibitsList();
  updateStats();
}

// =============================================================================
// UI Renderers & Dom Bindings
// =============================================================================
const roomsListEl = document.getElementById('rooms-list') as HTMLElement;
const corridorsListEl = document.getElementById('corridors-list') as HTMLElement;
const exhibitsListEl = document.getElementById('exhibits-list') as HTMLElement;
const statRoomsEl = document.getElementById('stat-rooms') as HTMLElement;
const statAreaEl = document.getElementById('stat-area') as HTMLElement;
const statExhibitsEl = document.getElementById('stat-exhibits') as HTMLElement;
const statConnectionsEl = document.getElementById('stat-connections') as HTMLElement;
const roomsCounterBadge = document.getElementById('rooms-counter-badge') as HTMLElement;
const exhibitsCounterBadge = document.getElementById('exhibits-counter-badge') as HTMLElement;

function updateStats(): void {
  statRoomsEl.textContent = rooms.length.toString();
  roomsCounterBadge.textContent = rooms.length.toString();
  statExhibitsEl.textContent = exhibits.length.toString();
  exhibitsCounterBadge.textContent = exhibits.length.toString();
  statConnectionsEl.textContent = connections.length.toString();

  let totalArea = 0;
  for (const r of rooms) {
    totalArea += r.dimensions.width * r.dimensions.depth;
  }
  statAreaEl.textContent = `${totalArea} m²`;
}

function renderRoomsList(): void {
  roomsListEl.innerHTML = '';
  const fromSelect = document.getElementById('conn-from-room') as HTMLSelectElement;
  const toSelect = document.getElementById('conn-to-room') as HTMLSelectElement;
  const exhibitRoomSelect = document.getElementById('exhibit-room') as HTMLSelectElement;

  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';
  exhibitRoomSelect.innerHTML = '';

  for (const r of rooms) {
    // Fill sidebar room card
    const card = document.createElement('div');
    card.className = `item-card ${r.id === selectedRoomId ? 'active' : ''}`;
    card.innerHTML = `
      <div class="item-info">
        <span class="item-title">${r.name}</span>
        <span class="item-meta">${r.dimensions.width}m × ${r.dimensions.depth}m • Tema: ${r.theme}</span>
      </div>
      <button class="item-del-btn" title="Eliminar sala" data-del="${r.id}">✕</button>
    `;

    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('item-del-btn')) return;
      selectRoom(r.id);
    });

    card.querySelector('.item-del-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteRoom(r.id);
    });

    roomsListEl.appendChild(card);

    // Populate selects
    const optFrom = new Option(r.name, r.id);
    const optTo = new Option(r.name, r.id);
    const optEx = new Option(r.name, r.id);
    fromSelect.add(optFrom);
    toSelect.add(optTo);
    exhibitRoomSelect.add(optEx);
  }

  if (toSelect.options.length > 1) {
    toSelect.selectedIndex = 1;
  }
}

function renderCorridorsList(): void {
  corridorsListEl.innerHTML = '';
  if (connections.length === 0) {
    corridorsListEl.innerHTML = '<div style="font-size: 11.5px; color: #64748b; padding: 6px 0;">No hay pasillos conectados.</div>';
    return;
  }

  for (const c of connections) {
    const fromR = rooms.find((r) => r.id === c.fromRoomId);
    const toR = rooms.find((r) => r.id === c.toRoomId);
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-info">
        <span class="item-title">${fromR?.name || c.fromRoomId} ➔ ${toR?.name || c.toRoomId}</span>
        <span class="item-meta">Muro ${c.fromWall} a Muro ${c.toWall} • Ancho: ${c.width}m</span>
      </div>
      <button class="item-del-btn" title="Eliminar pasillo" data-del="${c.id}">✕</button>
    `;

    card.querySelector('.item-del-btn')?.addEventListener('click', () => {
      connections = connections.filter((conn) => conn.id !== c.id);
      app.audio.playClick();
      rebuildScenario();
      showToast('Pasillo eliminado');
    });

    corridorsListEl.appendChild(card);
  }
}

function renderExhibitsList(): void {
  exhibitsListEl.innerHTML = '';
  if (exhibits.length === 0) {
    exhibitsListEl.innerHTML = '<div style="font-size: 11.5px; color: #64748b; padding: 6px 0;">No hay exhibidores en el nivel.</div>';
    return;
  }

  for (const ex of exhibits) {
    const parentRoom = rooms.find((r) => r.id === ex.roomId);
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-info">
        <span class="item-title" style="color: ${ex.themeColor};">${ex.title}</span>
        <span class="item-meta">En: ${parentRoom?.name || ex.roomId} • [${ex.category}]</span>
      </div>
      <button class="item-del-btn" title="Eliminar exhibidor" data-del="${ex.id}">✕</button>
    `;

    card.querySelector('.item-del-btn')?.addEventListener('click', () => {
      exhibits = exhibits.filter((item) => item.id !== ex.id);
      app.audio.playClick();
      rebuildScenario();
      showToast('Exhibidor retirado');
    });

    exhibitsListEl.appendChild(card);
  }
}

function selectRoom(id: string): void {
  selectedRoomId = id;
  const r = rooms.find((room) => room.id === id);
  if (!r) return;

  const roomNameInput = document.getElementById('room-name') as HTMLInputElement;
  const roomThemeSelect = document.getElementById('room-theme') as HTMLSelectElement;
  const roomWidthInput = document.getElementById('room-width') as HTMLInputElement;
  const roomDepthInput = document.getElementById('room-depth') as HTMLInputElement;
  const roomHeightInput = document.getElementById('room-height') as HTMLInputElement;
  const lblWidth = document.getElementById('lbl-width') as HTMLElement;
  const lblDepth = document.getElementById('lbl-depth') as HTMLElement;
  const lblHeight = document.getElementById('lbl-height') as HTMLElement;
  const btnDelete = document.getElementById('btn-delete-room') as HTMLButtonElement;
  const editorTitle = document.getElementById('room-editor-title') as HTMLElement;

  roomNameInput.value = r.name;
  roomThemeSelect.value = r.theme;
  roomWidthInput.value = r.dimensions.width.toString();
  roomDepthInput.value = r.dimensions.depth.toString();
  roomHeightInput.value = r.dimensions.height.toString();
  lblWidth.textContent = `${r.dimensions.width}m`;
  lblDepth.textContent = `${r.dimensions.depth}m`;
  lblHeight.textContent = `${r.dimensions.height}m`;

  editorTitle.textContent = `Modificar: ${r.name}`;
  btnDelete.style.display = rooms.length > 1 ? 'block' : 'none';

  renderRoomsList();

  if (!isFirstPerson) {
    app.resetCamera([r.center[0], 18, r.center[2] + 16], [r.center[0], 0, r.center[2]]);
  }
}

function deleteRoom(id: string): void {
  if (rooms.length <= 1) {
    alert('El nivel debe tener al menos una sala.');
    return;
  }
  rooms = rooms.filter((r) => r.id !== id);
  connections = connections.filter((c) => c.fromRoomId !== id && c.toRoomId !== id);
  exhibits = exhibits.filter((e) => e.roomId !== id);
  selectedRoomId = rooms[0].id;
  app.audio.playClick();
  rebuildScenario();
  showToast('Sala eliminada');
}

// =============================================================================
// UI Event Handlers (Sliders, Buttons, Tabs)
// =============================================================================
// Sliders live label updating
const roomWidthInput = document.getElementById('room-width') as HTMLInputElement;
const roomDepthInput = document.getElementById('room-depth') as HTMLInputElement;
const roomHeightInput = document.getElementById('room-height') as HTMLInputElement;
const lblWidth = document.getElementById('lbl-width') as HTMLElement;
const lblDepth = document.getElementById('lbl-depth') as HTMLElement;
const lblHeight = document.getElementById('lbl-height') as HTMLElement;

roomWidthInput.addEventListener('input', () => {
  lblWidth.textContent = `${roomWidthInput.value}m`;
  updateCurrentRoomDimensions();
});
roomDepthInput.addEventListener('input', () => {
  lblDepth.textContent = `${roomDepthInput.value}m`;
  updateCurrentRoomDimensions();
});
roomHeightInput.addEventListener('input', () => {
  lblHeight.textContent = `${roomHeightInput.value}m`;
  updateCurrentRoomDimensions();
});

function updateCurrentRoomDimensions(): void {
  const r = rooms.find((room) => room.id === selectedRoomId);
  if (!r) return;
  r.dimensions.width = parseFloat(roomWidthInput.value);
  r.dimensions.depth = parseFloat(roomDepthInput.value);
  r.dimensions.height = parseFloat(roomHeightInput.value);
  rebuildScenario();
}

// Room Name & Theme change
const roomNameInput = document.getElementById('room-name') as HTMLInputElement;
const roomThemeSelect = document.getElementById('room-theme') as HTMLSelectElement;

roomNameInput.addEventListener('change', () => {
  const r = rooms.find((room) => room.id === selectedRoomId);
  if (!r) return;
  r.name = roomNameInput.value.trim() || 'Sala';
  renderRoomsList();
});

roomThemeSelect.addEventListener('change', () => {
  const r = rooms.find((room) => room.id === selectedRoomId);
  if (!r) return;
  r.theme = roomThemeSelect.value as RoomTheme;
  rebuildScenario();
});

// Placement Buttons (Add Room Adjacent)
document.querySelectorAll('.placement-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dir = btn.getAttribute('data-dir');
    const parentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
    const newId = `room-${Date.now().toString(36)}`;
    const newW = 12;
    const newD = 10;
    const newH = 3.8;

    let posX = parentRoom.center[0];
    let posZ = parentRoom.center[2];
    let fromWall: WallDirection = 'north';
    let toWall: WallDirection = 'south';

    const gap = 6.0; // Distance between room walls for corridor
    if (dir === 'north') {
      posZ -= (parentRoom.dimensions.depth / 2 + newD / 2 + gap);
      fromWall = 'north';
      toWall = 'south';
    } else if (dir === 'south') {
      posZ += (parentRoom.dimensions.depth / 2 + newD / 2 + gap);
      fromWall = 'south';
      toWall = 'north';
    } else if (dir === 'east') {
      posX += (parentRoom.dimensions.width / 2 + newW / 2 + gap);
      fromWall = 'east';
      toWall = 'west';
    } else if (dir === 'west') {
      posX -= (parentRoom.dimensions.width / 2 + newW / 2 + gap);
      fromWall = 'west';
      toWall = 'east';
    }

    // Register door on parent room
    if (!parentRoom.doors.some((d) => d.wall === fromWall)) {
      parentRoom.doors.push({ wall: fromWall, targetRoomId: newId, width: 2.4, height: 2.8 });
    }

    const newRoom: RoomDef = {
      id: newId,
      name: `Sala ${rooms.length + 1} (${dir.toUpperCase()})`,
      theme: parentRoom.theme,
      dimensions: { width: newW, depth: newD, height: newH },
      center: [posX, 0, posZ],
      doors: [{ wall: toWall, targetRoomId: parentRoom.id, width: 2.4, height: 2.8 }],
      spawnPoint: [posX, 1.6, posZ],
    };

    rooms.push(newRoom);

    // Auto-connect with corridor
    connections.push({
      id: `conn-${Date.now()}`,
      fromRoomId: parentRoom.id,
      fromWall,
      toRoomId: newId,
      toWall,
      width: 2.4,
      height: 3.0,
    });

    selectedRoomId = newId;
    app.audio.playSuccess();
    rebuildScenario();
    showToast(`¡Sala añadida al ${dir.toUpperCase()} con pasillo automático!`);
  });
});

// Add Connection Button
const btnAddConn = document.getElementById('btn-add-connection') as HTMLButtonElement;
const connFromSelect = document.getElementById('conn-from-room') as HTMLSelectElement;
const connFromWallSelect = document.getElementById('conn-from-wall') as HTMLSelectElement;
const connToSelect = document.getElementById('conn-to-room') as HTMLSelectElement;
const connToWallSelect = document.getElementById('conn-to-wall') as HTMLSelectElement;
const connWidthInput = document.getElementById('conn-width') as HTMLInputElement;

btnAddConn.addEventListener('click', () => {
  const fromId = connFromSelect.value;
  const toId = connToSelect.value;
  if (fromId === toId) {
    alert('Selecciona dos salas diferentes para conectar con pasillo.');
    return;
  }

  const fromWall = connFromWallSelect.value as WallDirection;
  const toWall = connToWallSelect.value as WallDirection;
  const w = parseFloat(connWidthInput.value);

  // Ensure door configs exist on rooms
  const fromR = rooms.find((r) => r.id === fromId);
  const toR = rooms.find((r) => r.id === toId);
  if (fromR && !fromR.doors.some((d) => d.wall === fromWall)) {
    fromR.doors.push({ wall: fromWall, targetRoomId: toId, width: w, height: 2.8 });
  }
  if (toR && !toR.doors.some((d) => d.wall === toWall)) {
    toR.doors.push({ wall: toWall, targetRoomId: fromId, width: w, height: 2.8 });
  }

  connections.push({
    id: `conn-${Date.now()}`,
    fromRoomId: fromId,
    fromWall,
    toRoomId: toId,
    toWall,
    width: w,
    height: 3.0,
  });

  app.audio.playSuccess();
  rebuildScenario();
  showToast('¡Pasillo conectado con éxito!');
});

// Add Exhibit Button
const btnAddExhibit = document.getElementById('btn-add-exhibit') as HTMLButtonElement;
const exRoomSelect = document.getElementById('exhibit-room') as HTMLSelectElement;
const exTitleInput = document.getElementById('exhibit-title') as HTMLInputElement;
const exCatInput = document.getElementById('exhibit-category') as HTMLInputElement;
const exDescInput = document.getElementById('exhibit-desc') as HTMLTextAreaElement;
const exColorSelect = document.getElementById('exhibit-color') as HTMLSelectElement;
const exTypeSelect = document.getElementById('exhibit-model-type') as HTMLSelectElement;
const exPosX = document.getElementById('exhibit-pos-x') as HTMLInputElement;
const exPosZ = document.getElementById('exhibit-pos-z') as HTMLInputElement;

btnAddExhibit.addEventListener('click', () => {
  const roomId = exRoomSelect.value;
  const title = exTitleInput.value.trim() || 'Objeto 3D';
  const category = exCatInput.value.trim() || 'EXHIBICIÓN';
  const desc = exDescInput.value.trim() || 'Elemento interactivo de práctica.';
  const color = exColorSelect.value;
  const modelType = exTypeSelect.value as any;
  const relX = parseFloat(exPosX.value);
  const relZ = parseFloat(exPosZ.value);

  exhibits.push({
    id: `ex-${Date.now()}`,
    roomId,
    title,
    category,
    description: desc,
    specs: ['TIPO: Interactivo', 'FORMATO: VXR Standard', 'MODO: Inspección 3D'],
    themeColor: color,
    relX,
    relZ,
    modelType,
  });

  app.audio.playSuccess();
  rebuildScenario();
  showToast(`¡Exhibidor "${title}" colocado!`);
});

// Preset Template Selector
const presetSelect = document.getElementById('select-preset') as HTMLSelectElement;
presetSelect.addEventListener('change', () => {
  const p = PRESETS[presetSelect.value];
  if (!p) return;

  rooms = JSON.parse(JSON.stringify(p.rooms));
  connections = JSON.parse(JSON.stringify(p.connections));
  exhibits = JSON.parse(JSON.stringify(p.exhibits));
  selectedRoomId = rooms[0].id;

  app.audio.playWarp();
  rebuildScenario();
  showToast(`Plantilla "${presetSelect.options[presetSelect.selectedIndex].text}" cargada.`);
});

// Sound Test Buttons in Audio Tab
document.getElementById('btn-sound-step')?.addEventListener('click', () => app.audio.playStep());
document.getElementById('btn-sound-click')?.addEventListener('click', () => app.audio.playClick());
document.getElementById('btn-sound-teleport')?.addEventListener('click', () => app.audio.playWarp());
document.getElementById('btn-sound-fanfare')?.addEventListener('click', () => app.audio.playSuccess());

// Sound Toggle
const btnSoundToggle = document.getElementById('btn-sound-toggle') as HTMLButtonElement;
btnSoundToggle.addEventListener('click', () => {
  const isMuted = app.audio.toggleMute();
  btnSoundToggle.textContent = isMuted ? '🔇 Sonido: Silenciado' : '🔊 Sonido: ON';
  btnSoundToggle.style.color = isMuted ? '#f87171' : '#cbd5e1';
});

// Camera Mode Toggle
const btnCamMode = document.getElementById('btn-camera-mode') as HTMLButtonElement;
const camModeText = document.getElementById('cam-mode-text') as HTMLElement;

btnCamMode.addEventListener('click', () => {
  isFirstPerson = !isFirstPerson;
  app.audio.playWarp();

  if (isFirstPerson) {
    camModeText.textContent = 'Modo Drone / Editor';
    btnCamMode.style.background = 'rgba(56, 189, 248, 0.2)';
    btnCamMode.style.borderColor = '#38bdf8';
    if (app.controls) app.controls.enabled = false;

    // Spawn player in active room
    const r = rooms.find((room) => room.id === selectedRoomId) || rooms[0];
    playerPos.set(r.center[0], 1.6, r.center[2]);
    playerPitch = 0;
    playerYaw = 0;
    app.camera.position.copy(playerPos);
    container.requestPointerLock?.();
    showToast('🚶 ¡Modo Paseo Activo! Usa W,A,S,D para caminar');
  } else {
    camModeText.textContent = 'Modo Paseo (FPS)';
    btnCamMode.style.background = '';
    btnCamMode.style.borderColor = '';
    if (document.exitPointerLock) document.exitPointerLock();
    if (app.controls) {
      app.controls.enabled = true;
      app.resetCamera([0, 24, 24], [0, 0, -6]);
    }
    showToast('🛸 Modo Editor / Vista Aérea');
  }
});

// Sidebar Tabs Switching
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const tab = btn.getAttribute('data-tab');
    document.getElementById('tab-content-rooms')!.style.display = tab === 'rooms' ? 'flex' : 'none';
    document.getElementById('tab-content-doors')!.style.display = tab === 'doors' ? 'flex' : 'none';
    document.getElementById('tab-content-exhibits')!.style.display = tab === 'exhibits' ? 'flex' : 'none';
    document.getElementById('tab-content-audio')!.style.display = tab === 'audio' ? 'flex' : 'none';
  });
});

// Toggle Sidebar Drawer
const sidebar = document.getElementById('sidebar') as HTMLElement;
const btnToggleDrawer = document.getElementById('btn-toggle-drawer') as HTMLButtonElement;
btnToggleDrawer.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  btnToggleDrawer.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
});

// =============================================================================
// Code Exporter Engine (TypeScript, Standalone HTML, Declarative JSON)
// =============================================================================
const exportModal = document.getElementById('export-modal') as HTMLElement;
const btnOpenExport = document.getElementById('btn-export-project') as HTMLButtonElement;
const btnCloseModal = document.getElementById('btn-close-modal') as HTMLButtonElement;
const exportCodeDisplay = document.getElementById('export-code-display') as HTMLElement;
const btnCopyCode = document.getElementById('btn-copy-code') as HTMLButtonElement;
const btnDownloadFile = document.getElementById('btn-download-file') as HTMLButtonElement;

btnOpenExport.addEventListener('click', () => {
  app.audio.playClick();
  updateExportDisplay();
  exportModal.classList.add('active');
});

btnCloseModal.addEventListener('click', () => {
  exportModal.classList.remove('active');
});

exportModal.addEventListener('click', (e) => {
  if (e.target === exportModal) exportModal.classList.remove('active');
});

document.querySelectorAll('[data-export-tab]').forEach((tabBtn) => {
  tabBtn.addEventListener('click', () => {
    document.querySelectorAll('[data-export-tab]').forEach((b) => b.classList.remove('active'));
    tabBtn.classList.add('active');
    activeExportTab = tabBtn.getAttribute('data-export-tab') as any;
    updateExportDisplay();
  });
});

function generateTypeScriptCode(): string {
  let code = `// =====================================================================\n`;
  code += `// EXPERIENCIA 3D / XR GENERADA CON VXR LEVEL BUILDER\n`;
  code += `// Framework: VXR (High-Level WebXR & Three.js)\n`;
  code += `// =====================================================================\n\n`;
  code += `import { XRApp } from 'vxr';\n\n`;
  code += `// 1. Inicializar la aplicación con soporte WebXR para Meta Quest y Desktop\n`;
  code += `const app = new XRApp({\n`;
  code += `  container: '#app',\n`;
  code += `  enableVR: true,\n`;
  code += `  autoVRButton: true,\n`;
  code += `  enableShadows: true,\n`;
  code += `  pixelRatioCap: 1.25,\n`;
  code += `});\n\n`;
  code += `// 2. Crear el escenario multi-sala\n`;
  code += `const scenario = app.createScenario('Mi Nivel Interactivo');\n\n`;

  for (const r of rooms) {
    code += `// Sala: ${r.name}\n`;
    code += `scenario.addRoom({\n`;
    code += `  id: '${r.id}',\n`;
    code += `  name: '${r.name}',\n`;
    code += `  theme: '${r.theme}',\n`;
    code += `  center: [${r.center.join(', ')}],\n`;
    code += `  dimensions: { width: ${r.dimensions.width}, depth: ${r.dimensions.depth}, height: ${r.dimensions.height} },\n`;
    code += `  doors: ${JSON.stringify(r.doors)},\n`;
    code += `});\n\n`;
  }

  code += `// 3. Conectar salas mediante pasillos\n`;
  for (const c of connections) {
    code += `scenario.connectRooms('${c.fromRoomId}', '${c.fromWall}', '${c.toRoomId}', '${c.toWall}', { width: ${c.width}, height: ${c.height} });\n`;
  }
  code += `\n`;

  if (exhibits.length > 0) {
    code += `// 4. Montar pedestales interactivos con audio y fichas HUD\n`;
    for (const ex of exhibits) {
      const parentR = rooms.find((r) => r.id === ex.roomId);
      const posX = (parentR?.center[0] || 0) + ex.relX;
      const posZ = (parentR?.center[2] || 0) + ex.relZ;
      code += `app.addExhibit({\n`;
      code += `  title: '${ex.title}',\n`;
      code += `  category: '${ex.category}',\n`;
      code += `  description: '${ex.description}',\n`;
      code += `  specs: ${JSON.stringify(ex.specs)},\n`;
      code += `  themeColor: '${ex.themeColor}',\n`;
      code += `  position: [${posX.toFixed(1)}, 0, ${posZ.toFixed(1)}],\n`;
      code += `});\n\n`;
    }
  }

  code += `// 5. Iniciar la experiencia inmersiva\n`;
  code += `app.start();\n`;
  return code;
}

function generateHTMLStandaloneCode(): string {
  const tsCode = generateTypeScriptCode();
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mi Experiencia VXR</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #app { width: 100%; height: 100%; overflow: hidden; background: #050811; }
    .hud { position: fixed; top: 16px; left: 16px; color: #fff; font-family: sans-serif; font-size: 13px; z-index: 10; pointer-events: none; }
  </style>
  <!-- Three.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <div class="hud">
    <h2 style="font-size: 16px; color: #38bdf8;">Experiencia Creada con VXR</h2>
    <p style="color: #94a3b8; font-size: 12px;">Haz clic y arrastra para orbitar la cámara o entra en VR si cuentas con visor.</p>
  </div>

  <script type="module">
    // Código TypeScript transpilado para ejecución nativa inmediata
    console.log("¡Experiencia VXR cargada exitosamente!");
    ${tsCode.replace(/import { XRApp } from 'vxr';/, '// Framework cargado vía CDN')}
  </script>
</body>
</html>`;
}

function generateJSONCode(): string {
  const data = {
    name: 'Workshop Level Export',
    author: 'VXR Workshop Attendee',
    created: new Date().toISOString(),
    rooms,
    connections,
    exhibits,
  };
  return JSON.stringify(data, null, 2);
}

function updateExportDisplay(): void {
  if (activeExportTab === 'ts') {
    exportCodeDisplay.textContent = generateTypeScriptCode();
  } else if (activeExportTab === 'html') {
    exportCodeDisplay.textContent = generateHTMLStandaloneCode();
  } else {
    exportCodeDisplay.textContent = generateJSONCode();
  }
}

btnCopyCode.addEventListener('click', () => {
  const code = exportCodeDisplay.textContent || '';
  navigator.clipboard.writeText(code).then(() => {
    showToast('¡Código copiado al portapapeles! 🚀');
  });
});

btnDownloadFile.addEventListener('click', () => {
  let content = '';
  let filename = '';
  let mimeType = 'text/plain';

  if (activeExportTab === 'ts') {
    content = generateTypeScriptCode();
    filename = 'experiencia-vxr.ts';
    mimeType = 'text/typescript';
  } else if (activeExportTab === 'html') {
    content = generateHTMLStandaloneCode();
    filename = 'mi-experiencia-vxr.html';
    mimeType = 'text/html';
  } else {
    content = generateJSONCode();
    filename = 'escenario.json';
    mimeType = 'application/json';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`¡Archivo "${filename}" descargado con éxito!`);
});

// Toast notification helper
const toastEl = document.getElementById('toast') as HTMLElement;
const toastMsg = document.getElementById('toast-msg') as HTMLElement;
let toastTimeout: any;

function showToast(msg: string): void {
  toastMsg.textContent = msg;
  toastEl.style.display = 'flex';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.style.display = 'none';
  }, 3000);
}

// =============================================================================
// Initial Scenario Build
// =============================================================================
rebuildScenario();
selectRoom(rooms[0].id);
app.start();
