import * as THREE from 'three';
import { XRApp, type RoomTheme, type WallDirection, type EnvironmentPreset } from '@vxr/core';

// =============================================================================
// Interfaces & Types
// =============================================================================
export interface RoomDef {
  id: string;
  name: string;
  theme: RoomTheme;
  dimensions: { width: number; depth: number; height: number };
  center: [number, number, number];
  doors: Array<{ wall: WallDirection; targetRoomId: string; width?: number; height?: number }>;
  spawnPoint?: [number, number, number];
}

export interface ConnectionDef {
  id: string;
  fromRoomId: string;
  fromWall: WallDirection;
  toRoomId: string;
  toWall: WallDirection;
  width: number;
  height: number;
}

export type StudioPropType = 'partition' | 'sign' | 'light' | 'exhibit' | 'column';

export interface StudioPropDef {
  id: string;
  roomId: string;
  type: StudioPropType;
  subtype: string;
  name: string;
  relX: number;
  relY: number;
  relZ: number;
  rotationY: number; // degrees 0-360
  width: number;
  height: number;
  color: string;
  text?: string;
  intensity?: number;
  // exhibit metadata
  category?: string;
  description?: string;
  specs?: string[];
}

// =============================================================================
// Preset Templates (Enriched with Partitions, 3D Signs, Lights & Columns)
// =============================================================================
const PRESETS: Record<string, { rooms: RoomDef[]; connections: ConnectionDef[]; props: StudioPropDef[] }> = {
  museum: {
    rooms: [
      {
        id: 'lobby',
        name: 'Lobby & Recepción Principal',
        theme: 'gallery',
        dimensions: { width: 12, depth: 10, height: 3.8 },
        center: [0, 0, 0],
        doors: [{ wall: 'north', targetRoomId: 'archaeology', width: 2.6, height: 2.8 }],
        spawnPoint: [0, 1.6, 2],
      },
      {
        id: 'archaeology',
        name: 'Sala de Arqueología Prehispánica',
        theme: 'cozy',
        dimensions: { width: 14, depth: 12, height: 4.2 },
        center: [0, 0, -18],
        doors: [
          { wall: 'south', targetRoomId: 'lobby', width: 2.6, height: 2.8 },
          { wall: 'east', targetRoomId: 'art', width: 2.4, height: 2.6 },
        ],
        spawnPoint: [0, 1.6, -18],
      },
      {
        id: 'art',
        name: 'Galería de Arte Contemporáneo',
        theme: 'minimal',
        dimensions: { width: 10, depth: 10, height: 3.5 },
        center: [16, 0, -18],
        doors: [{ wall: 'west', targetRoomId: 'archaeology', width: 2.4, height: 2.6 }],
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
    props: [
      // Lobby Props
      {
        id: 'prop-lobby-sign',
        roomId: 'lobby',
        type: 'sign',
        subtype: 'wall_plaque',
        name: 'Placa de Bienvenida',
        relX: 0,
        relY: 2.1,
        relZ: -4.8,
        rotationY: 0,
        width: 2.8,
        height: 0.9,
        color: '#38bdf8',
        text: 'MUSEO NACIONAL VXR',
      },
      {
        id: 'prop-lobby-part',
        roomId: 'lobby',
        type: 'partition',
        subtype: 'glass',
        name: 'Mampara Divisoria Cristal',
        relX: -3.2,
        relY: 0,
        relZ: 1.0,
        rotationY: 90,
        width: 3.4,
        height: 2.2,
        color: '#38bdf8',
      },
      {
        id: 'prop-lobby-exhibit',
        roomId: 'lobby',
        type: 'exhibit',
        subtype: 'monolith',
        name: 'Códice Histórico Digital',
        relX: -3.2,
        relY: 0,
        relZ: -1.2,
        rotationY: 0,
        width: 1.0,
        height: 1.8,
        color: '#f59e0b',
        category: 'PATRIMONIO CULTURAL',
        description: 'Reproducción interactiva de manuscrito pictográfico del siglo XVI.',
        specs: ['RESOLUCIÓN: 0.1mm', 'ORIGEN: México Central', 'MATERIAL: Piel de venado'],
      },
      {
        id: 'prop-lobby-spot',
        roomId: 'lobby',
        type: 'light',
        subtype: 'spot',
        name: 'Foco Cenital Vitrina',
        relX: -3.2,
        relY: 3.4,
        relZ: -1.2,
        rotationY: 0,
        width: 0.5,
        height: 0.5,
        color: '#ffffff',
        intensity: 2.8,
      },
      // Archaeology Props
      {
        id: 'prop-arch-totem',
        roomId: 'archaeology',
        type: 'sign',
        subtype: 'totem',
        name: 'Tótem Guía Arqueología',
        relX: 0,
        relY: 0,
        relZ: 4.8,
        rotationY: 180,
        width: 0.8,
        height: 2.2,
        color: '#f59e0b',
        text: 'SALA ARQUEOLOGÍA',
      },
      {
        id: 'prop-arch-part',
        roomId: 'archaeology',
        type: 'partition',
        subtype: 'wood',
        name: 'Mampara Acústica de Roble',
        relX: -4.5,
        relY: 0,
        relZ: 0,
        rotationY: 0,
        width: 3.8,
        height: 2.4,
        color: '#f59e0b',
      },
      {
        id: 'prop-arch-exhibit',
        roomId: 'archaeology',
        type: 'exhibit',
        subtype: 'gem',
        name: 'Reliquia Solar Ceremonial',
        relX: 3.5,
        relY: 0,
        relZ: 0,
        rotationY: 0,
        width: 1.0,
        height: 1.8,
        color: '#38bdf8',
        category: 'ARQUEOLOGÍA 3D',
        description: 'Orfebrería con grabados astronómicos digitalizada por fotogrametría.',
        specs: ['ERA: Posclásico (~1250 d.C.)', 'ALEACIÓN: Oro y Cobre', 'PRECISIÓN: 50 micras'],
      },
      {
        id: 'prop-arch-col1',
        roomId: 'archaeology',
        type: 'column',
        subtype: 'pillar',
        name: 'Columna Este',
        relX: 4.8,
        relY: 0,
        relZ: 4.0,
        rotationY: 0,
        width: 0.8,
        height: 4.2,
        color: '#cbd5e1',
      },
      {
        id: 'prop-arch-col2',
        roomId: 'archaeology',
        type: 'column',
        subtype: 'pillar',
        name: 'Columna Oeste',
        relX: -4.8,
        relY: 0,
        relZ: 4.0,
        rotationY: 0,
        width: 0.8,
        height: 4.2,
        color: '#cbd5e1',
      },
      // Art Gallery Props
      {
        id: 'prop-art-sign',
        roomId: 'art',
        type: 'sign',
        subtype: 'neon_hanging',
        name: 'Rótulo Neón Galería',
        relX: 0,
        relY: 2.5,
        relZ: -3.8,
        rotationY: 0,
        width: 2.6,
        height: 0.8,
        color: '#10b981',
        text: 'ARTE GENERATIVO XR',
      },
      {
        id: 'prop-art-part',
        roomId: 'art',
        type: 'partition',
        subtype: 'neon',
        name: 'Mampara Neón Holográfica',
        relX: 2.8,
        relY: 0,
        relZ: 0,
        rotationY: 90,
        width: 3.2,
        height: 2.2,
        color: '#10b981',
      },
      {
        id: 'prop-art-light',
        roomId: 'art',
        type: 'light',
        subtype: 'point',
        name: 'Luz Neón Esmeralda',
        relX: 0,
        relY: 2.0,
        relZ: -1.0,
        rotationY: 0,
        width: 0.4,
        height: 0.4,
        color: '#10b981',
        intensity: 2.4,
      },
      {
        id: 'prop-art-exhibit',
        roomId: 'art',
        type: 'exhibit',
        subtype: 'rings',
        name: 'Instalación Espacial Resonante',
        relX: 0,
        relY: 0,
        relZ: -1.0,
        rotationY: 0,
        width: 1.0,
        height: 1.8,
        color: '#10b981',
        category: 'ARTE GENERATIVO',
        description: 'Estructura lumínica interactiva modulada por frecuencias armónicas.',
        specs: ['ILUMINACIÓN: RGB Fotométrico', 'AUDIO: Síntesis Web Audio', 'MODO: Tiempo Real'],
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
    props: [
      {
        id: 'scifi-airlock-totem',
        roomId: 'airlock',
        type: 'sign',
        subtype: 'totem',
        name: 'Acceso Restringido',
        relX: -2.2,
        relY: 0,
        relZ: -2.0,
        rotationY: 45,
        width: 0.8,
        height: 2.0,
        color: '#ec4899',
        text: 'NIVEL DE SEGURIDAD 4',
      },
      {
        id: 'scifi-airlock-part',
        roomId: 'airlock',
        type: 'partition',
        subtype: 'mesh',
        name: 'Mampara Rejilla Descontaminación',
        relX: 2.4,
        relY: 0,
        relZ: 0,
        rotationY: 90,
        width: 3.0,
        height: 2.4,
        color: '#38bdf8',
      },
      {
        id: 'scifi-lab-sign',
        roomId: 'fusion-lab',
        type: 'sign',
        subtype: 'neon_hanging',
        name: 'Rótulo Reactor',
        relX: 0,
        relY: 3.2,
        relZ: 0,
        rotationY: 0,
        width: 3.2,
        height: 0.9,
        color: '#38bdf8',
        text: 'FUSION REACTOR 01',
      },
      {
        id: 'scifi-lab-exhibit',
        roomId: 'fusion-lab',
        type: 'exhibit',
        subtype: 'rings',
        name: 'Reactor Tokamak Magnético',
        relX: 0,
        relY: 0,
        relZ: 0,
        rotationY: 0,
        width: 1.2,
        height: 2.0,
        color: '#38bdf8',
        category: 'FÍSICA CUÁNTICA',
        description: 'Confinamiento de plasma a 150M °C mediante bobinas superconductoras.',
        specs: ['CAMPO B: 5.3 Tesla', 'COMBUSTIBLE: D-T', 'EMISIONES: Cero CO₂'],
      },
      {
        id: 'scifi-lab-spot',
        roomId: 'fusion-lab',
        type: 'light',
        subtype: 'spot',
        name: 'Foco Spot Reactor',
        relX: 0,
        relY: 4.2,
        relZ: 0,
        rotationY: 0,
        width: 0.5,
        height: 0.5,
        color: '#38bdf8',
        intensity: 3.5,
      },
      {
        id: 'scifi-vault-part',
        roomId: 'server-vault',
        type: 'partition',
        subtype: 'neon',
        name: 'Mampara Servidores',
        relX: 0,
        relY: 0,
        relZ: -3.0,
        rotationY: 0,
        width: 4.2,
        height: 2.4,
        color: '#a855f7',
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
    props: [
      {
        id: 'bim-totem',
        roomId: 'atrium',
        type: 'sign',
        subtype: 'totem',
        name: 'Directorio Edificio LEED',
        relX: -3.8,
        relY: 0,
        relZ: 2.5,
        rotationY: 45,
        width: 0.8,
        height: 2.2,
        color: '#10b981',
        text: 'EDIFICIO VXR TOWER',
      },
      {
        id: 'bim-glass-part',
        roomId: 'atrium',
        type: 'partition',
        subtype: 'glass',
        name: 'Mampara Acristalada Atrio',
        relX: 4.0,
        relY: 0,
        relZ: 0,
        rotationY: 90,
        width: 4.5,
        height: 2.4,
        color: '#38bdf8',
      },
      {
        id: 'bim-exhibit',
        roomId: 'atrium',
        type: 'exhibit',
        subtype: 'monolith',
        name: 'Maqueta Arquitectónica LEED',
        relX: 0,
        relY: 0,
        relZ: 0,
        rotationY: 0,
        width: 1.0,
        height: 1.8,
        color: '#10b981',
        category: 'EDIFICACIÓN SOSTENIBLE',
        description: 'Envolvente térmica de alta eficiencia con captación solar fotovoltaica.',
        specs: ['CERTIFICACIÓN: LEED Platinum', 'ESTRUCTURA: CLT Madera', 'ESCALA: 1:50'],
      },
      {
        id: 'bim-terrace-part',
        roomId: 'terrace',
        type: 'partition',
        subtype: 'wood',
        name: 'Celosía de Madera Bioclimática',
        relX: 0,
        relY: 0,
        relZ: -3.5,
        rotationY: 0,
        width: 4.8,
        height: 2.2,
        color: '#f59e0b',
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
    props: [],
  },
};

// =============================================================================
// Application State
// =============================================================================
let rooms: RoomDef[] = JSON.parse(JSON.stringify(PRESETS.museum.rooms));
let connections: ConnectionDef[] = JSON.parse(JSON.stringify(PRESETS.museum.connections));
let props: StudioPropDef[] = JSON.parse(JSON.stringify(PRESETS.museum.props));
let selectedRoomId: string = rooms[0].id;
let selectedPropId: string | null = null;
let isFirstPerson = false;
let activeExportTab: 'ts' | 'html' | 'json' = 'ts';

// Meshes & textures tracking
const animatedProps: THREE.Object3D[] = [];
const propMeshMap = new Map<string, THREE.Object3D>();
const propCanvasMap = new Map<string, { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture }>();

// =============================================================================
// Initialize VXR Application
// =============================================================================
const container = document.getElementById('app') as HTMLElement;
const app = new XRApp({
  container,
  enableShadows: true,
  enableGrid: false,
  enableVR: true,
  autoVRButton: false, // We use custom #btn-vr-mode in Studio top bar
  cameraPosition: [0, 24, 24],
  fov: 50,
});

app.scene.setEnvironmentPreset('studio');
app.scene.setBackground(0x070c18);

let scenario = app.createScenario('VXR Studio Level');

// Selection Box Outline Helper
const selectionHelper = new THREE.Group();
selectionHelper.name = 'VXR_SelectionHelper';
selectionHelper.visible = false;
app.scene.nativeScene.add(selectionHelper);

function buildSelectionHelperBox(): void {
  selectionHelper.clear();
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(boxGeo);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    linewidth: 2,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
  });
  const wireframe = new THREE.LineSegments(edges, lineMat);
  wireframe.renderOrder = 999;
  selectionHelper.add(wireframe);

  // Bottom glowing ring
  const ringGeo = new THREE.RingGeometry(0.5, 0.58, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
    depthTest: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.48;
  ring.renderOrder = 999;
  selectionHelper.add(ring);
}
buildSelectionHelperBox();

// =============================================================================
// First-Person Navigation Controller with PointerLock & XRInput
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

document.addEventListener('mousemove', (e) => {
  if (!isFirstPerson || !isPointerLocked) return;
  playerYaw -= (e.movementX || 0) * 0.0024;
  playerPitch -= (e.movementY || 0) * 0.0024;
  playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, playerPitch));
});

// Click in 3D Canvas
container.addEventListener('click', (e) => {
  if (isFirstPerson) {
    if (!isPointerLocked) {
      container.requestPointerLock?.();
    }
    // Inspect exhibits in FPS mode
    const hits = app.raycastPointer(e);
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
    return;
  }

  // Drone / Editor Mode: Raycast Selection for any prop
  const hits = app.raycastPointer(e);
  if (hits.length > 0) {
    for (const hit of hits) {
      // Traverse up to find prop root
      let curr: THREE.Object3D | null = hit.object;
      while (curr && curr !== app.scene.nativeScene) {
        if (curr.userData && curr.userData.propId) {
          selectProp(curr.userData.propId);
          app.audio.playClick();
          return;
        }
        curr = curr.parent;
      }
    }
  }
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

// Render Loop & Updates
app.onUpdate((delta, elapsed) => {
  // Animate custom rotating props
  for (let i = 0; i < animatedProps.length; i++) {
    animatedProps[i].rotation.y = elapsed * (0.8 + (i % 3) * 0.2);
  }

  // Update selection helper position if a prop is selected
  if (selectedPropId && selectionHelper.visible) {
    const mesh = propMeshMap.get(selectedPropId);
    if (mesh) {
      const p = props.find((item) => item.id === selectedPropId);
      if (p) {
        selectionHelper.position.copy(mesh.position);
        selectionHelper.rotation.y = mesh.rotation.y;
        const boxW = Math.max(0.6, p.width * 1.05);
        const boxH = Math.max(0.6, p.height * 1.05);
        selectionHelper.scale.set(boxW, boxH, boxW);
      }
    }
  }

  // First person walk mode
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
// Procedural Canvas & Texture Factory for 3D Signs
// =============================================================================
function createSignCanvasTexture(
  text: string,
  colorHex: string,
  subtype: string
): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Background
  const isPlaque = subtype === 'wall_plaque';
  ctx.fillStyle = isPlaque ? '#090e1a' : '#030712';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative border
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = isPlaque ? 5 : 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // High-tech corner brackets
  const cornerLen = 28;
  ctx.fillStyle = colorHex;
  ctx.fillRect(10, 10, cornerLen, 6);
  ctx.fillRect(10, 10, 6, cornerLen);
  ctx.fillRect(canvas.width - 10 - cornerLen, 10, cornerLen, 6);
  ctx.fillRect(canvas.width - 16, 10, 6, cornerLen);
  ctx.fillRect(10, canvas.height - 16, cornerLen, 6);
  ctx.fillRect(10, canvas.height - 10 - cornerLen, 6, cornerLen);
  ctx.fillRect(canvas.width - 10 - cornerLen, canvas.height - 16, cornerLen, 6);
  ctx.fillRect(canvas.width - 16, canvas.height - 10 - cornerLen, 6, cornerLen);

  // Header Subtitle / Category
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tag = subtype === 'totem' ? '• WAYFINDING XR •' : (isPlaque ? 'SISTEMA SEÑALÉTICA' : 'VXR STUDIO DISPLAY');
  ctx.fillText(tag, canvas.width / 2, 55);

  // Main Text with Neon Glow
  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 18;
  ctx.font = '800 50px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText((text || 'RÓTULO 3D').toUpperCase(), canvas.width / 2, 140);

  // Baseline Accent Bar
  ctx.shadowBlur = 0;
  ctx.fillStyle = colorHex;
  ctx.fillRect(canvas.width / 2 - 140, 192, 280, 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return { canvas, texture };
}

function updateSignTexture(prop: StudioPropDef): void {
  const cached = propCanvasMap.get(prop.id);
  if (!cached) return;

  const { canvas, texture } = cached;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const isPlaque = prop.subtype === 'wall_plaque';
  ctx.fillStyle = isPlaque ? '#090e1a' : '#030712';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = prop.color;
  ctx.lineWidth = isPlaque ? 5 : 8;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  const cornerLen = 28;
  ctx.fillStyle = prop.color;
  ctx.fillRect(10, 10, cornerLen, 6);
  ctx.fillRect(10, 10, 6, cornerLen);
  ctx.fillRect(canvas.width - 10 - cornerLen, 10, cornerLen, 6);
  ctx.fillRect(canvas.width - 16, 10, 6, cornerLen);
  ctx.fillRect(10, canvas.height - 16, cornerLen, 6);
  ctx.fillRect(10, canvas.height - 10 - cornerLen, 6, cornerLen);
  ctx.fillRect(canvas.width - 10 - cornerLen, canvas.height - 16, cornerLen, 6);
  ctx.fillRect(canvas.width - 16, canvas.height - 10 - cornerLen, 6, cornerLen);

  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tag = prop.subtype === 'totem' ? '• WAYFINDING XR •' : (isPlaque ? 'SISTEMA SEÑALÉTICA' : 'VXR STUDIO DISPLAY');
  ctx.fillText(tag, canvas.width / 2, 55);

  ctx.shadowColor = prop.color;
  ctx.shadowBlur = 18;
  ctx.font = '800 50px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText((prop.text || prop.name || 'RÓTULO 3D').toUpperCase(), canvas.width / 2, 140);

  ctx.shadowBlur = 0;
  ctx.fillStyle = prop.color;
  ctx.fillRect(canvas.width / 2 - 140, 192, 280, 4);

  texture.needsUpdate = true;
}

// =============================================================================
// Procedural 3D Mesh Factories
// =============================================================================

/**
 * Creates 3D Partitions / Mamparas (Glass, Acoustic Wood, Cyberpunk Neon, Industrial Mesh)
 */
function createPartitionMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  group.userData = { propId: prop.id, type: 'partition' };

  const w = prop.width || 2.5;
  const h = prop.height || 2.2;
  const postRadius = 0.04;
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 });
  const accentColor = new THREE.Color(prop.color);

  // Left & Right Support Posts
  const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, h, 16);
  const leftPost = new THREE.Mesh(postGeo, darkMetal);
  leftPost.position.set(-w / 2, h / 2, 0);
  const rightPost = new THREE.Mesh(postGeo, darkMetal);
  rightPost.position.set(w / 2, h / 2, 0);

  // Footplates
  const footGeo = new THREE.BoxGeometry(0.12, 0.04, 0.4);
  const leftFoot = new THREE.Mesh(footGeo, darkMetal);
  leftFoot.position.set(-w / 2, 0.02, 0);
  const rightFoot = new THREE.Mesh(footGeo, darkMetal);
  rightFoot.position.set(w / 2, 0.02, 0);

  group.add(leftPost, rightPost, leftFoot, rightFoot);

  if (prop.subtype === 'glass') {
    // Glass Panel
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.08,
      metalness: 0.85,
      transparent: true,
      opacity: 0.32,
    });
    const paneGeo = new THREE.BoxGeometry(w - 0.08, h - 0.1, 0.02);
    const pane = new THREE.Mesh(paneGeo, glassMat);
    pane.position.set(0, h / 2, 0);

    // Frosted stripes
    const frostMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.45,
    });
    const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.06, 0.024), frostMat);
    stripe1.position.set(0, h * 0.45, 0);
    const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.04, 0.024), frostMat);
    stripe2.position.set(0, h * 0.55, 0);

    group.add(pane, stripe1, stripe2);
  } else if (prop.subtype === 'wood') {
    // Acoustic Wood Slats
    const backer = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.08, h - 0.1, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    );
    backer.position.set(0, h / 2, 0);
    group.add(backer);

    const slatCount = Math.max(4, Math.floor(w / 0.22));
    const slatW = 0.09;
    const slatMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // warm oak/walnut
      roughness: 0.7,
      metalness: 0.1,
    });
    const slatGeo = new THREE.BoxGeometry(slatW, h - 0.14, 0.03);

    for (let i = 0; i < slatCount; i++) {
      const slat = new THREE.Mesh(slatGeo, slatMat);
      const x = -((slatCount - 1) * 0.2) / 2 + i * 0.2;
      slat.position.set(x, h / 2, 0.015);
      group.add(slat);
    }
  } else if (prop.subtype === 'neon') {
    // Cyberpunk Neon Dividing Wall
    const darkPane = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.08, h - 0.1, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.5, metalness: 0.6 })
    );
    darkPane.position.set(0, h / 2, 0);

    const neonMat = new THREE.MeshBasicMaterial({ color: accentColor });
    const topRod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, w - 0.1, 16), neonMat);
    topRod.rotation.z = Math.PI / 2;
    topRod.position.set(0, h - 0.1, 0.02);

    const midRod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, w - 0.1, 16), neonMat);
    midRod.rotation.z = Math.PI / 2;
    midRod.position.set(0, h * 0.5, 0.02);

    const botRod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, w - 0.1, 16), neonMat);
    botRod.rotation.z = Math.PI / 2;
    botRod.position.set(0, 0.1, 0.02);

    group.add(darkPane, topRod, midRod, botRod);
  } else {
    // Industrial Mesh
    const frameGeo = new THREE.BoxGeometry(w - 0.08, h - 0.1, 0.03);
    const wireGeo = new THREE.WireframeGeometry(frameGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.65 });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    wireMesh.position.set(0, h / 2, 0);

    const centerPane = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.1, h - 0.12, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.7, transparent: true, opacity: 0.5 })
    );
    centerPane.position.set(0, h / 2, 0);

    group.add(wireMesh, centerPane);
  }

  return group;
}

/**
 * Creates 3D Signs / Letreros (Neon Hanging, Wall Plaque, Wayfinding Totem)
 */
function createSignMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  group.userData = { propId: prop.id, type: 'sign' };

  const w = prop.width || 2.4;
  const h = prop.height || 0.8;
  const accentColor = new THREE.Color(prop.color);

  // Generate dynamic canvas texture
  const signData = createSignCanvasTexture(prop.text || prop.name, prop.color, prop.subtype);
  propCanvasMap.set(prop.id, signData);

  const signMat = new THREE.MeshBasicMaterial({
    map: signData.texture,
    toneMapped: false,
  });

  if (prop.subtype === 'totem') {
    // Upright Floor Totem Monolith
    const baseGeo = new THREE.BoxGeometry(0.9, 0.08, 0.6);
    const baseMesh = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 }));
    baseMesh.position.y = 0.04;

    const bodyGeo = new THREE.BoxGeometry(0.8, 2.2, 0.16);
    const bodyMesh = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.4, metalness: 0.7 }));
    bodyMesh.position.y = 1.14;

    // Display Screen Face
    const screenGeo = new THREE.PlaneGeometry(0.74, 1.3);
    const screenMesh = new THREE.Mesh(screenGeo, signMat);
    screenMesh.position.set(0, 1.4, 0.082);

    // Glowing base indicator
    const ledGeo = new THREE.BoxGeometry(0.74, 0.03, 0.164);
    const ledMesh = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: accentColor }));
    ledMesh.position.set(0, 0.12, 0);

    group.add(baseMesh, bodyMesh, screenMesh, ledMesh);
  } else if (prop.subtype === 'neon_hanging') {
    // Suspended Ceiling Neon Sign
    const panelGeo = new THREE.BoxGeometry(w, h, 0.08);
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.9 });
    const edgeMat = new THREE.MeshBasicMaterial({ color: accentColor });

    const panelMesh = new THREE.Mesh(panelGeo, [
      edgeMat, // Right
      edgeMat, // Left
      edgeMat, // Top
      edgeMat, // Bottom
      signMat, // Front
      signMat, // Back
    ]);
    panelMesh.position.y = 0;

    // Suspension cables going up
    const cableGeo = new THREE.CylinderGeometry(0.008, 0.008, 1.6, 8);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
    const cable1 = new THREE.Mesh(cableGeo, cableMat);
    cable1.position.set(-w * 0.4, 0.8 + h / 2, 0);
    const cable2 = new THREE.Mesh(cableGeo, cableMat);
    cable2.position.set(w * 0.4, 0.8 + h / 2, 0);

    group.add(panelMesh, cable1, cable2);
  } else {
    // Wall Plaque with Metallic Standoffs
    const plaqueGeo = new THREE.BoxGeometry(w, h, 0.04);
    const backMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
    const frontMat = signMat;

    const plaqueMesh = new THREE.Mesh(plaqueGeo, [backMat, backMat, backMat, backMat, frontMat, backMat]);
    plaqueMesh.position.y = 0;

    // 4 Corner Standoff Spacers
    const spacerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 12);
    const spacerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    spacerGeo.rotateX(Math.PI / 2);

    const s1 = new THREE.Mesh(spacerGeo, spacerMat);
    s1.position.set(-w / 2 + 0.06, h / 2 - 0.06, -0.04);
    const s2 = new THREE.Mesh(spacerGeo, spacerMat);
    s2.position.set(w / 2 - 0.06, h / 2 - 0.06, -0.04);
    const s3 = new THREE.Mesh(spacerGeo, spacerMat);
    s3.position.set(-w / 2 + 0.06, -h / 2 + 0.06, -0.04);
    const s4 = new THREE.Mesh(spacerGeo, spacerMat);
    s4.position.set(w / 2 - 0.06, -h / 2 + 0.06, -0.04);

    group.add(plaqueMesh, s1, s2, s3, s4);
  }

  return group;
}

/**
 * Creates 3D Lights (Ceiling Track Spotlight, Point Neon Accent Lantern)
 */
function createLightMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  group.userData = { propId: prop.id, type: 'light' };

  const color = new THREE.Color(prop.color);
  const intensity = prop.intensity || 2.4;

  if (prop.subtype === 'spot') {
    // Spotlight Fixture
    const mountGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
    const mount = new THREE.Mesh(mountGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 }));

    const bodyGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.22, 16);
    bodyGeo.rotateX(Math.PI / 6);
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.8, roughness: 0.3 }));
    body.position.set(0, -0.12, 0.04);

    const lensGeo = new THREE.CircleGeometry(0.075, 16);
    lensGeo.rotateX(-Math.PI / 3);
    const lens = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color }));
    lens.position.set(0, -0.21, 0.09);

    // Three.js Spotlight
    const spot = new THREE.SpotLight(color, intensity, 16, Math.PI / 4, 0.45, 1.2);
    spot.position.set(0, -0.22, 0.1);
    spot.target.position.set(0, -3.5, 0.5);
    spot.castShadow = true;
    spot.shadow.mapSize.width = 512;
    spot.shadow.mapSize.height = 512;

    // Translucent light cone volume
    const coneGeo = new THREE.ConeGeometry(1.4, 3.2, 16, 1, true);
    coneGeo.rotateX(Math.PI);
    const coneMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, -1.7, 0.2);

    group.add(mount, body, lens, spot, spot.target, cone);
  } else {
    // Point Neon Lantern / Beacon
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 16);
    const post = new THREE.Mesh(postGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
    post.position.y = 0.6;

    const orbGeo = new THREE.OctahedronGeometry(0.18, 2);
    const orbMat = new THREE.MeshBasicMaterial({ color });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 1.3;

    const haloGeo = new THREE.TorusGeometry(0.28, 0.015, 16, 32);
    const halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
    halo.position.y = 1.3;
    halo.rotation.x = Math.PI / 4;

    const point = new THREE.PointLight(color, intensity, 12, 1.8);
    point.position.y = 1.3;

    group.add(post, orb, halo, point);
    animatedProps.push(orb, halo);
  }

  return group;
}

/**
 * Creates Modular Architectural Columns / Pilares
 */
function createColumnMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  group.userData = { propId: prop.id, type: 'column' };

  const w = prop.width || 0.8;
  const h = prop.height || 3.8;
  const color = new THREE.Color(prop.color);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.2 });

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.24, w), stoneMat);
  base.position.y = 0.12;

  // Shaft with fluting
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(w * 0.82, h - 0.48, w * 0.82), stoneMat);
  shaft.position.y = h / 2;

  // Capital Top
  const cap = new THREE.Mesh(new THREE.BoxGeometry(w, 0.24, w), stoneMat);
  cap.position.y = h - 0.12;

  // Glowing LED Trim ring on Capital
  const trimGeo = new THREE.BoxGeometry(w + 0.02, 0.04, w + 0.02);
  const trimMat = new THREE.MeshBasicMaterial({ color });
  const trim = new THREE.Mesh(trimGeo, trimMat);
  trim.position.y = h - 0.22;

  group.add(base, shaft, cap, trim);
  return group;
}

/**
 * Creates Interactive Pedestal Exhibits with 3D Holographic Geometry
 */
function createExhibitMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  group.userData = { propId: prop.id, type: 'exhibit' };
  const color = new THREE.Color(prop.color);

  if (prop.subtype === 'gem') {
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
  } else if (prop.subtype === 'rings') {
    const r1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.06, 16, 32),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8 })
    );
    const r2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.05, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 0.5 })
    );
    r2.rotation.x = Math.PI / 3;
    const subGroup = new THREE.Group();
    subGroup.add(r1, r2);
    subGroup.position.y = 1.7;
    group.add(subGroup);
    animatedProps.push(subGroup);
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

    const subGroup = new THREE.Group();
    subGroup.add(mesh, core);
    group.add(subGroup);
    animatedProps.push(subGroup);
  }

  return group;
}

// =============================================================================
// Scenario Builder & Real-Time Sync
// =============================================================================
function rebuildScenario(): void {
  // 1. Dispose old exhibits & clear props
  animatedProps.length = 0;
  for (const ex of app.exhibits) {
    ex.dispose();
  }
  app.exhibits.length = 0;

  for (const [, mesh] of propMeshMap) {
    app.scene.nativeScene.remove(mesh);
  }
  propMeshMap.clear();
  propCanvasMap.clear();

  // 2. Clear old scenario
  if (scenario) {
    app.scene.nativeScene.remove(scenario.nativeGroup);
    scenario.dispose();
  }
  scenario = app.createScenario('VXR Studio Level');

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

  // 5. Mount Props (Partitions, Signs, Lights, Exhibits, Columns)
  for (const p of props) {
    const parentRoom = rooms.find((r) => r.id === p.roomId);
    if (!parentRoom) continue;

    const worldX = parentRoom.center[0] + p.relX;
    const worldY = p.relY || 0;
    const worldZ = parentRoom.center[2] + p.relZ;

    let mesh: THREE.Object3D;
    if (p.type === 'partition') {
      mesh = createPartitionMesh(p);
    } else if (p.type === 'sign') {
      mesh = createSignMesh(p);
    } else if (p.type === 'light') {
      mesh = createLightMesh(p);
    } else if (p.type === 'column') {
      mesh = createColumnMesh(p);
    } else {
      // Exhibit
      mesh = createExhibitMesh(p);
      app.addExhibit({
        id: p.id,
        title: p.name,
        category: p.category || 'EXHIBICIÓN 3D',
        description: p.description || 'Elemento interactivo.',
        specs: p.specs || ['FORMATO: VXR Standard', 'MODO: Inspección 3D'],
        themeColor: p.color,
        position: [worldX, 0, worldZ],
      });
    }

    mesh.position.set(worldX, worldY, worldZ);
    mesh.rotation.y = THREE.MathUtils.degToRad(p.rotationY || 0);

    app.scene.nativeScene.add(mesh);
    propMeshMap.set(p.id, mesh);
  }

  // 6. Update Selection & UI Lists
  if (selectedPropId && propMeshMap.has(selectedPropId)) {
    updateSelectionHelper();
  } else {
    selectedPropId = null;
    selectionHelper.visible = false;
    renderInspectorEmpty();
  }

  renderRoomsList();
  renderCorridorsList();
  renderPropsList();
  updateStats();
}

// =============================================================================
// UI Renderers & Dom Bindings
// =============================================================================
const roomsListEl = document.getElementById('rooms-list') as HTMLElement;
const corridorsListEl = document.getElementById('corridors-list') as HTMLElement;
const propsListEl = document.getElementById('props-list') as HTMLElement;
const statRoomsEl = document.getElementById('stat-rooms') as HTMLElement;
const statAreaEl = document.getElementById('stat-area') as HTMLElement;
const statPropsEl = document.getElementById('stat-props') as HTMLElement;
const statConnectionsEl = document.getElementById('stat-connections') as HTMLElement;
const roomsCounterBadge = document.getElementById('rooms-counter-badge') as HTMLElement;
const objectsCounterBadge = document.getElementById('objects-counter-badge') as HTMLElement;

function updateStats(): void {
  statRoomsEl.textContent = rooms.length.toString();
  roomsCounterBadge.textContent = rooms.length.toString();
  statPropsEl.textContent = props.length.toString();
  objectsCounterBadge.textContent = props.length.toString();
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

  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';

  for (const r of rooms) {
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

    fromSelect.add(new Option(r.name, r.id));
    toSelect.add(new Option(r.name, r.id));
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

function renderPropsList(): void {
  propsListEl.innerHTML = '';
  if (props.length === 0) {
    propsListEl.innerHTML = '<div style="font-size: 11.5px; color: #64748b; padding: 6px 0;">No hay objetos colocados. Haz clic en la bandeja inferior para añadir uno.</div>';
    return;
  }

  for (const p of props) {
    const parentRoom = rooms.find((r) => r.id === p.roomId);
    const card = document.createElement('div');
    card.className = `prop-item-card ${p.id === selectedPropId ? 'selected' : ''}`;

    let typeIcon = '📦';
    let typeLabel = 'Objeto';
    if (p.type === 'partition') { typeIcon = '🪟'; typeLabel = 'Mampara'; }
    else if (p.type === 'sign') { typeIcon = '🏷️'; typeLabel = 'Rótulo'; }
    else if (p.type === 'light') { typeIcon = '💡'; typeLabel = 'Luz'; }
    else if (p.type === 'column') { typeIcon = '🏛️'; typeLabel = 'Columna'; }
    else if (p.type === 'exhibit') { typeIcon = '💎'; typeLabel = 'Vitrina'; }

    card.innerHTML = `
      <div class="prop-info-col">
        <span class="prop-title" style="color: ${p.color};">${typeIcon} ${p.name}</span>
        <span class="prop-meta">En: ${parentRoom?.name || p.roomId} • [${typeLabel}]</span>
      </div>
      <button class="item-del-btn" title="Eliminar objeto" data-del-prop="${p.id}">✕</button>
    `;

    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('item-del-btn')) return;
      selectProp(p.id);
      activateTab('inspector');
    });

    card.querySelector('[data-del-prop]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteProp(p.id);
    });

    propsListEl.appendChild(card);
  }
}

// =============================================================================
// Selection & Inspector Engine
// =============================================================================
const inspectorBadge = document.getElementById('inspector-badge') as HTMLElement;
const inspectorEmpty = document.getElementById('inspector-empty') as HTMLElement;
const inspectorFields = document.getElementById('inspector-fields') as HTMLElement;
const propNameInput = document.getElementById('prop-name') as HTMLInputElement;
const groupPropText = document.getElementById('group-prop-text') as HTMLElement;
const propTextInput = document.getElementById('prop-text') as HTMLInputElement;
const propPosX = document.getElementById('prop-pos-x') as HTMLInputElement;
const propPosZ = document.getElementById('prop-pos-z') as HTMLInputElement;
const propPosY = document.getElementById('prop-pos-y') as HTMLInputElement;
const lblPropX = document.getElementById('lbl-prop-x') as HTMLElement;
const lblPropZ = document.getElementById('lbl-prop-z') as HTMLElement;
const lblPropY = document.getElementById('lbl-prop-y') as HTMLElement;
const propRotY = document.getElementById('prop-rotation-y') as HTMLInputElement;
const lblPropRot = document.getElementById('lbl-prop-rot') as HTMLElement;
const groupPropDims = document.getElementById('group-prop-dims') as HTMLElement;
const propWidth = document.getElementById('prop-width') as HTMLInputElement;
const lblPropW = document.getElementById('lbl-prop-w') as HTMLElement;
const propHeight = document.getElementById('prop-height') as HTMLInputElement;
const lblPropH = document.getElementById('lbl-prop-h') as HTMLElement;
const propColorInput = document.getElementById('prop-color-input') as HTMLInputElement;
const propColorPreset = document.getElementById('prop-color-preset') as HTMLSelectElement;
const groupPropIntensity = document.getElementById('group-prop-intensity') as HTMLElement;
const propIntensity = document.getElementById('prop-intensity') as HTMLInputElement;
const lblPropIntensity = document.getElementById('lbl-prop-intensity') as HTMLElement;
const btnDuplicateProp = document.getElementById('btn-duplicate-prop') as HTMLButtonElement;
const btnDeleteProp = document.getElementById('btn-delete-prop') as HTMLButtonElement;

function renderInspectorEmpty(): void {
  inspectorBadge.textContent = 'Ninguno';
  inspectorEmpty.style.display = 'block';
  inspectorFields.style.display = 'none';
}

function selectProp(id: string): void {
  selectedPropId = id;
  const p = props.find((item) => item.id === id);
  if (!p) {
    renderInspectorEmpty();
    return;
  }

  // Populate Inspector
  inspectorEmpty.style.display = 'none';
  inspectorFields.style.display = 'flex';
  inspectorBadge.textContent = p.type.toUpperCase();

  propNameInput.value = p.name;

  // Text for signs
  if (p.type === 'sign') {
    groupPropText.style.display = 'block';
    propTextInput.value = p.text || p.name;
  } else {
    groupPropText.style.display = 'none';
  }

  // Transforms
  propPosX.value = p.relX.toString();
  lblPropX.textContent = `${p.relX.toFixed(1)}m`;
  propPosZ.value = p.relZ.toString();
  lblPropZ.textContent = `${p.relZ.toFixed(1)}m`;
  propPosY.value = (p.relY || 0).toString();
  lblPropY.textContent = `${(p.relY || 0).toFixed(1)}m`;

  propRotY.value = (p.rotationY || 0).toString();
  lblPropRot.textContent = `${p.rotationY || 0}°`;

  // Dimensions
  if (p.type === 'partition' || p.type === 'sign' || p.type === 'column') {
    groupPropDims.style.display = 'block';
    propWidth.value = p.width.toString();
    lblPropW.textContent = `${p.width.toFixed(1)}m`;
    propHeight.value = p.height.toString();
    lblPropH.textContent = `${p.height.toFixed(1)}m`;
  } else {
    groupPropDims.style.display = 'none';
  }

  // Colors
  propColorInput.value = p.color;
  propColorPreset.value = p.color;

  // Intensity for lights
  if (p.type === 'light') {
    groupPropIntensity.style.display = 'block';
    const intensity = p.intensity || 2.4;
    propIntensity.value = intensity.toString();
    lblPropIntensity.textContent = intensity.toFixed(1);
  } else {
    groupPropIntensity.style.display = 'none';
  }

  updateSelectionHelper();
  renderPropsList();
}

function updateSelectionHelper(): void {
  if (!selectedPropId) {
    selectionHelper.visible = false;
    return;
  }

  const p = props.find((item) => item.id === selectedPropId);
  const mesh = propMeshMap.get(selectedPropId);
  if (!p || !mesh) {
    selectionHelper.visible = false;
    return;
  }

  selectionHelper.visible = true;
  selectionHelper.position.copy(mesh.position);
  selectionHelper.rotation.y = mesh.rotation.y;
  const boxW = Math.max(0.6, p.width * 1.05);
  const boxH = Math.max(0.6, p.height * 1.05);
  selectionHelper.scale.set(boxW, boxH, boxW);
}

// Inspector Input Handlers
propNameInput.addEventListener('input', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.name = propNameInput.value.trim() || 'Objeto';
  renderPropsList();
});

propTextInput.addEventListener('input', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p || p.type !== 'sign') return;
  p.text = propTextInput.value;
  updateSignTexture(p);
});

propPosX.addEventListener('input', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.relX = parseFloat(propPosX.value);
  lblPropX.textContent = `${p.relX.toFixed(1)}m`;

  const parentRoom = rooms.find((r) => r.id === p.roomId);
  const mesh = propMeshMap.get(p.id);
  if (mesh && parentRoom) {
    mesh.position.x = parentRoom.center[0] + p.relX;
  }
  updateSelectionHelper();
});

propPosZ.addEventListener('input', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.relZ = parseFloat(propPosZ.value);
  lblPropZ.textContent = `${p.relZ.toFixed(1)}m`;

  const parentRoom = rooms.find((r) => r.id === p.roomId);
  const mesh = propMeshMap.get(p.id);
  if (mesh && parentRoom) {
    mesh.position.z = parentRoom.center[2] + p.relZ;
  }
  updateSelectionHelper();
});

propPosY.addEventListener('input', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.relY = parseFloat(propPosY.value);
  lblPropY.textContent = `${p.relY.toFixed(1)}m`;

  const mesh = propMeshMap.get(p.id);
  if (mesh) {
    mesh.position.y = p.relY;
  }
  updateSelectionHelper();
});

propRotY.addEventListener('input', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.rotationY = parseFloat(propRotY.value);
  lblPropRot.textContent = `${p.rotationY}°`;

  const mesh = propMeshMap.get(p.id);
  if (mesh) {
    mesh.rotation.y = THREE.MathUtils.degToRad(p.rotationY);
  }
  updateSelectionHelper();
});

document.querySelectorAll('.btn-rot-preset').forEach((btn) => {
  btn.addEventListener('click', () => {
    const p = props.find((item) => item.id === selectedPropId);
    if (!p) return;
    const deg = parseInt(btn.getAttribute('data-rot') || '0', 10);
    p.rotationY = deg;
    propRotY.value = deg.toString();
    lblPropRot.textContent = `${deg}°`;

    const mesh = propMeshMap.get(p.id);
    if (mesh) {
      mesh.rotation.y = THREE.MathUtils.degToRad(deg);
    }
    updateSelectionHelper();
    app.audio.playClick();
  });
});

propWidth.addEventListener('input', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.width = parseFloat(propWidth.value);
  lblPropW.textContent = `${p.width.toFixed(1)}m`;
  rebuildScenario();
});

propHeight.addEventListener('input', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.height = parseFloat(propHeight.value);
  lblPropH.textContent = `${p.height.toFixed(1)}m`;
  rebuildScenario();
});

propColorInput.addEventListener('input', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.color = propColorInput.value;
  propColorPreset.value = p.color;
  if (p.type === 'sign') updateSignTexture(p);
  else rebuildScenario();
});

propColorPreset.addEventListener('change', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.color = propColorPreset.value;
  propColorInput.value = p.color;
  if (p.type === 'sign') updateSignTexture(p);
  else rebuildScenario();
});

propIntensity.addEventListener('input', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p || p.type !== 'light') return;
  p.intensity = parseFloat(propIntensity.value);
  lblPropIntensity.textContent = p.intensity.toFixed(1);

  const mesh = propMeshMap.get(p.id);
  if (mesh) {
    mesh.traverse((child) => {
      if ((child as THREE.Light).isLight) {
        (child as THREE.Light).intensity = p.intensity!;
      }
    });
  }
});

btnDuplicateProp.addEventListener('click', () => {
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;

  const clone: StudioPropDef = JSON.parse(JSON.stringify(p));
  clone.id = `prop-${Date.now().toString(36)}`;
  clone.name = `${p.name} (Copia)`;
  clone.relX += 1.2;

  props.push(clone);
  selectedPropId = clone.id;
  app.audio.playSuccess();
  rebuildScenario();
  selectProp(clone.id);
  showToast(`¡Objeto duplicado exitosamente!`);
});

btnDeleteProp.addEventListener('click', () => {
  if (!selectedPropId) return;
  deleteProp(selectedPropId);
});

function deleteProp(id: string): void {
  props = props.filter((p) => p.id !== id);
  if (selectedPropId === id) {
    selectedPropId = null;
    selectionHelper.visible = false;
    renderInspectorEmpty();
  }
  app.audio.playClick();
  rebuildScenario();
  showToast('Objeto eliminado');
}

// =============================================================================
// Quick Shelf (1-Click Asset Palette)
// =============================================================================
document.querySelectorAll('.quick-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const type = chip.getAttribute('data-quick-type') as StudioPropType;
    const subtype = chip.getAttribute('data-quick-sub') || 'default';
    const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

    // Smart default names & dimensions
    let name = 'Nuevo Objeto';
    let width = 2.4;
    let height = 2.0;
    let color = '#38bdf8';
    let text = 'ZONA DE EXHIBICIÓN';
    let relY = 0;
    let intensity = 2.4;

    if (type === 'partition') {
      if (subtype === 'glass') { name = 'Mampara Cristal'; color = '#38bdf8'; width = 3.2; height = 2.2; }
      else if (subtype === 'wood') { name = 'Mampara Madera'; color = '#f59e0b'; width = 3.6; height = 2.4; }
      else if (subtype === 'neon') { name = 'Mampara Neón'; color = '#a855f7'; width = 3.0; height = 2.2; }
      else { name = 'Mampara Rejilla'; color = '#38bdf8'; width = 2.8; height = 2.4; }
    } else if (type === 'sign') {
      if (subtype === 'neon_hanging') { name = 'Rótulo Neón'; color = '#38bdf8'; width = 2.6; height = 0.8; relY = 2.5; text = 'RÓTULO NEÓN XR'; }
      else if (subtype === 'wall_plaque') { name = 'Placa Señalética'; color = '#f59e0b'; width = 2.4; height = 0.8; relY = 2.0; text = 'ACCESO PRINCIPAL'; }
      else { name = 'Tótem Señalético'; color = '#10b981'; width = 0.8; height = 2.2; relY = 0; text = 'PUNTO INFORMATIVO'; }
    } else if (type === 'light') {
      if (subtype === 'spot') { name = 'Foco Spot Cenital'; color = '#ffffff'; width = 0.5; height = 0.5; relY = 3.5; intensity = 3.0; }
      else { name = 'Luz Acento Neón'; color = '#38bdf8'; width = 0.4; height = 0.4; relY = 0; intensity = 2.4; }
    } else if (type === 'column') {
      name = 'Columna Modular'; color = '#cbd5e1'; width = 0.8; height = activeRoom.dimensions.height; relY = 0;
    } else if (type === 'exhibit') {
      name = 'Vitrina Pedestal'; color = '#38bdf8'; width = 1.0; height = 1.8; relY = 0;
    }

    // Slightly staggered offset around center
    const offsetSpread = 1.5;
    const relX = (Math.random() - 0.5) * offsetSpread;
    const relZ = (Math.random() - 0.5) * offsetSpread;

    const newProp: StudioPropDef = {
      id: `prop-${Date.now().toString(36)}`,
      roomId: activeRoom.id,
      type,
      subtype,
      name,
      relX: parseFloat(relX.toFixed(1)),
      relY,
      relZ: parseFloat(relZ.toFixed(1)),
      rotationY: 0,
      width,
      height,
      color,
      text,
      intensity,
      category: 'EXHIBICIÓN 3D',
      description: 'Elemento interactivo.',
      specs: ['MODO: Interactivo', 'FORMATO: VXR Standard'],
    };

    props.push(newProp);
    selectedPropId = newProp.id;
    app.audio.playSuccess();
    rebuildScenario();
    activateTab('inspector');
    selectProp(newProp.id);
    showToast(`¡${name} añadido en ${activeRoom.name}!`);
  });
});

// =============================================================================
// Room & Corridor Management Handlers
// =============================================================================
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
  props = props.filter((p) => p.roomId !== id);
  selectedRoomId = rooms[0].id;
  selectedPropId = null;
  app.audio.playClick();
  rebuildScenario();
  showToast('Sala eliminada');
}

// Room dimension sliders
const roomWidthInput = document.getElementById('room-width') as HTMLInputElement;
const roomDepthInput = document.getElementById('room-depth') as HTMLInputElement;
const roomHeightInput = document.getElementById('room-height') as HTMLInputElement;
const lblWidth = document.getElementById('lbl-width') as HTMLElement;
const lblDepth = document.getElementById('lbl-depth') as HTMLElement;
const lblHeight = document.getElementById('lbl-height') as HTMLElement;

function updateCurrentRoomDimensions(): void {
  const r = rooms.find((room) => room.id === selectedRoomId);
  if (!r) return;
  r.dimensions.width = parseFloat(roomWidthInput.value);
  r.dimensions.depth = parseFloat(roomDepthInput.value);
  r.dimensions.height = parseFloat(roomHeightInput.value);
  rebuildScenario();
}

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

    const gap = 6.0;
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

    if (!parentRoom.doors.some((d) => d.wall === fromWall)) {
      parentRoom.doors.push({ wall: fromWall, targetRoomId: newId, width: 2.6, height: 2.8 });
    }

    const newRoom: RoomDef = {
      id: newId,
      name: `Sala ${rooms.length + 1} (${dir?.toUpperCase()})`,
      theme: parentRoom.theme,
      dimensions: { width: newW, depth: newD, height: newH },
      center: [posX, 0, posZ],
      doors: [{ wall: toWall, targetRoomId: parentRoom.id, width: 2.6, height: 2.8 }],
      spawnPoint: [posX, 1.6, posZ],
    };

    rooms.push(newRoom);

    connections.push({
      id: `conn-${Date.now()}`,
      fromRoomId: parentRoom.id,
      fromWall,
      toRoomId: newId,
      toWall,
      width: 2.6,
      height: 3.0,
    });

    selectedRoomId = newId;
    app.audio.playSuccess();
    rebuildScenario();
    showToast(`¡Sala añadida al ${dir?.toUpperCase()} con pasillo automático!`);
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

// =============================================================================
// Environment Controls Tab
// =============================================================================
const envPresetSelect = document.getElementById('env-preset') as HTMLSelectElement;
const envLightIntensity = document.getElementById('env-light-intensity') as HTMLInputElement;
const lblLightIntensity = document.getElementById('lbl-light-intensity') as HTMLElement;
const envAmbientIntensity = document.getElementById('env-ambient-intensity') as HTMLInputElement;
const lblAmbientIntensity = document.getElementById('lbl-ambient-intensity') as HTMLElement;
const envShadowsSelect = document.getElementById('env-shadows') as HTMLSelectElement;

envPresetSelect?.addEventListener('change', () => {
  const preset = envPresetSelect.value as EnvironmentPreset;
  app.scene.setEnvironmentPreset(preset);
  if (preset === 'daylight') {
    app.scene.setBackground(0xe2e8f0);
  } else if (preset === 'dark') {
    app.scene.setBackground(0x020617);
  } else {
    app.scene.setBackground(0x070c18);
  }
  app.audio.playClick();
  showToast(`Entorno cambiado a: ${envPresetSelect.options[envPresetSelect.selectedIndex].text}`);
});

envLightIntensity?.addEventListener('input', () => {
  const val = parseFloat(envLightIntensity.value);
  lblLightIntensity.textContent = val.toFixed(1);
  if (app.scene.directionalLight) {
    app.scene.directionalLight.intensity = val;
  }
});

envAmbientIntensity?.addEventListener('input', () => {
  const val = parseFloat(envAmbientIntensity.value);
  lblAmbientIntensity.textContent = val.toFixed(1);
  if (app.scene.ambientLight) {
    app.scene.ambientLight.intensity = val;
  }
});

envShadowsSelect?.addEventListener('change', () => {
  const enabled = envShadowsSelect.value === 'true';
  app.renderer.nativeRenderer.shadowMap.enabled = enabled;
  app.scene.nativeScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = enabled;
      child.receiveShadow = enabled;
    }
  });
  showToast(enabled ? 'Sombras en tiempo real activadas' : 'Sombras desactivadas (Alto rendimiento)');
});

// =============================================================================
// Top Bar Controls (VR Mode, Presets, Import, Camera, Sound)
// =============================================================================
// WebXR Immersive VR Testing
document.getElementById('btn-vr-mode')?.addEventListener('click', async () => {
  try {
    app.audio.playWarp();
    showToast('Iniciando sesión inmersiva WebXR...');
    await app.session.toggleVR();
  } catch (err: any) {
    console.warn('VR mode toggle error:', err);
    showToast('WebXR no disponible en este dispositivo o visor no detectado.');
  }
});

// Preset Template Selector
const presetSelect = document.getElementById('select-preset') as HTMLSelectElement;
presetSelect.addEventListener('change', () => {
  const p = PRESETS[presetSelect.value];
  if (!p) return;

  rooms = JSON.parse(JSON.stringify(p.rooms));
  connections = JSON.parse(JSON.stringify(p.connections));
  props = JSON.parse(JSON.stringify(p.props));
  selectedRoomId = rooms[0].id;
  selectedPropId = null;

  app.audio.playWarp();
  rebuildScenario();
  showToast(`Plantilla "${presetSelect.options[presetSelect.selectedIndex].text}" cargada.`);
});

// Import JSON Project
const btnImport = document.getElementById('btn-import-project') as HTMLButtonElement;
const fileImport = document.getElementById('file-import-json') as HTMLInputElement;

btnImport?.addEventListener('click', () => {
  fileImport.click();
});

fileImport?.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target?.result as string);
      if (data.rooms && Array.isArray(data.rooms)) {
        rooms = data.rooms;
        connections = data.connections || [];
        props = data.props || [];

        // Legacy exhibit conversion if needed
        if (data.exhibits && Array.isArray(data.exhibits) && props.length === 0) {
          props = data.exhibits.map((ex: any) => ({
            id: ex.id || `prop-${Date.now()}`,
            roomId: ex.roomId,
            type: 'exhibit',
            subtype: ex.modelType || 'gem',
            name: ex.title,
            relX: ex.relX || 0,
            relY: 0,
            relZ: ex.relZ || 0,
            rotationY: 0,
            width: 1.0,
            height: 1.8,
            color: ex.themeColor || '#38bdf8',
            category: ex.category,
            description: ex.description,
            specs: ex.specs,
          }));
        }

        selectedRoomId = rooms[0].id;
        selectedPropId = null;
        rebuildScenario();
        app.audio.playSuccess();
        showToast(`Escenario "${data.name || file.name}" cargado con éxito!`);
      } else {
        alert('El archivo JSON no tiene un formato de escenario válido.');
      }
    } catch {
      alert('Error al leer el archivo JSON.');
    }
  };
  reader.readAsText(file);
});

// Audio Tab Sound Test Buttons
document.getElementById('btn-sound-step')?.addEventListener('click', () => app.audio.playStep());
document.getElementById('btn-sound-click')?.addEventListener('click', () => app.audio.playClick());
document.getElementById('btn-sound-teleport')?.addEventListener('click', () => app.audio.playWarp());
document.getElementById('btn-sound-fanfare')?.addEventListener('click', () => app.audio.playSuccess());

// Sound Mute Toggle
const btnSoundToggle = document.getElementById('btn-sound-toggle') as HTMLButtonElement;
btnSoundToggle.addEventListener('click', () => {
  const isMuted = app.audio.toggleMute();
  btnSoundToggle.textContent = isMuted ? '🔇 Silenciado' : '🔊 ON';
  btnSoundToggle.style.color = isMuted ? '#f87171' : '#cbd5e1';
});

// Camera Mode Toggle (Drone vs Walk)
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

// Sidebar Tab Switching
function activateTab(tab: string): void {
  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tab);
  });
  document.getElementById('tab-content-rooms')!.style.display = tab === 'rooms' ? 'flex' : 'none';
  document.getElementById('tab-content-doors')!.style.display = tab === 'doors' ? 'flex' : 'none';
  document.getElementById('tab-content-objects')!.style.display = tab === 'objects' ? 'flex' : 'none';
  document.getElementById('tab-content-inspector')!.style.display = tab === 'inspector' ? 'flex' : 'none';
  document.getElementById('tab-content-environment')!.style.display = tab === 'environment' ? 'flex' : 'none';
  document.getElementById('tab-content-audio')!.style.display = tab === 'audio' ? 'flex' : 'none';
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.getAttribute('data-tab');
    if (tab) activateTab(tab);
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
  code += `// EXPERIENCIA 3D / XR GENERADA CON VXR STUDIO\n`;
  code += `// Framework: VXR (High-Level WebXR & Three.js)\n`;
  code += `// =====================================================================\n\n`;
  code += `import * as THREE from 'three';\n`;
  code += `import { XRApp } from 'vxr';\n\n`;
  code += `// 1. Inicializar la aplicación con soporte WebXR y optimizaciones\n`;
  code += `const app = new XRApp({\n`;
  code += `  container: '#app',\n`;
  code += `  enableVR: true,\n`;
  code += `  autoVRButton: true,\n`;
  code += `  enableShadows: true,\n`;
  code += `  pixelRatioCap: 1.25,\n`;
  code += `});\n\n`;
  code += `// 2. Crear el escenario multi-sala\n`;
  code += `const scenario = app.createScenario('Escenario VXR Studio');\n\n`;

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

  if (props.length > 0) {
    code += `// 4. Montar elementos y objetos del estudio (mamparas, letreros, luces)\n`;
    for (const p of props) {
      const parentR = rooms.find((r) => r.id === p.roomId);
      const posX = ((parentR?.center[0] || 0) + p.relX).toFixed(2);
      const posY = (p.relY || 0).toFixed(2);
      const posZ = ((parentR?.center[2] || 0) + p.relZ).toFixed(2);

      if (p.type === 'exhibit') {
        code += `app.addExhibit({\n`;
        code += `  title: '${p.name}',\n`;
        code += `  category: '${p.category || 'EXHIBICIÓN'}',\n`;
        code += `  description: '${p.description || ''}',\n`;
        code += `  specs: ${JSON.stringify(p.specs || [])},\n`;
        code += `  themeColor: '${p.color}',\n`;
        code += `  position: [${posX}, 0, ${posZ}],\n`;
        code += `});\n\n`;
      } else {
        code += `// Elemento: ${p.name} (${p.type})\n`;
        code += `const prop_${p.id.replace(/-/g, '_')} = new THREE.Group();\n`;
        code += `prop_${p.id.replace(/-/g, '_')}.position.set(${posX}, ${posY}, ${posZ});\n`;
        code += `prop_${p.id.replace(/-/g, '_')}.rotation.y = THREE.MathUtils.degToRad(${p.rotationY || 0});\n`;
        code += `app.scene.nativeScene.add(prop_${p.id.replace(/-/g, '_')});\n\n`;
      }
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
  <title>Mi Experiencia VXR Studio</title>
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
    <h2 style="font-size: 16px; color: #38bdf8;">Experiencia Creada con VXR Studio</h2>
    <p style="color: #94a3b8; font-size: 12px;">Haz clic y arrastra para orbitar la cámara o entra en VR si cuentas con visor.</p>
  </div>

  <script type="module">
    console.log("¡Experiencia VXR Studio cargada exitosamente!");
    ${tsCode.replace(/import \* as THREE from 'three';/, '// Three.js cargado vía CDN').replace(/import { XRApp } from 'vxr';/, '// Framework VXR Core')}
  </script>
</body>
</html>`;
}

function generateJSONCode(): string {
  const data = {
    name: 'VXR Studio Scene Export',
    version: '2.0.0',
    generator: 'VXR Studio',
    created: new Date().toISOString(),
    rooms,
    connections,
    props,
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
    filename = 'experiencia-vxr-studio.ts';
    mimeType = 'text/typescript';
  } else if (activeExportTab === 'html') {
    content = generateHTMLStandaloneCode();
    filename = 'mi-experiencia-vxr-studio.html';
    mimeType = 'text/html';
  } else {
    content = generateJSONCode();
    filename = 'escenario-studio.json';
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
