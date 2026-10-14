import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { XRApp, type RoomTheme, type WallDirection } from '@vxr/core';

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

export type StudioPropCategory = 'basic' | 'furniture' | 'architecture' | 'decoration' | 'exhibition' | 'model_glb';

export interface StudioPropDef {
  id: string;
  roomId: string;
  category: StudioPropCategory;
  subtype: string;
  name: string;
  relX: number;
  relY: number;
  relZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  color: string;
  text?: string;
  intensity?: number;
  textureUrl?: string;

  // Exhibition & Interactive properties
  imageUrl?: string;
  videoUrl?: string;
  videoId?: string;
  linkUrl?: string;
  frameWidth?: number;
  frameHeight?: number;
  interactionAction?: 'lightbox' | 'video_popup' | 'open_link' | 'none';

  // External model data
  modelUrl?: string;
}

// =============================================================================
// Application State
// =============================================================================
let rooms: RoomDef[] = [];
let connections: ConnectionDef[] = [];
let props: StudioPropDef[] = [];

let selectedRoomId: string | null = null;
let selectedPropId: string | null = null;
let activeTool: 'select' | 'translate' | 'rotate' | 'scale' = 'select';
let activeCategory: string = 'basic';
let autoSaveTimer: any = null;

// Navigation Modes: 'edit' | 'explore' | 'fly' | 'walk'
type NavMode = 'edit' | 'explore' | 'fly' | 'walk';
let activeNavMode: NavMode = 'edit';
let isPointerLocked = false;
let isNightTheme = true;
let snapEnabled = false;
let flySpeed = 8.0;

// Fly Controls State (Minecraft Creative Style)
const flyKeys: Record<string, boolean> = {
  KeyW: false, KeyA: false, KeyS: false, KeyD: false,
  KeyQ: false, KeyE: false, Space: false,
  ShiftLeft: false, ShiftRight: false,
};
const flyVelocity = new THREE.Vector3();
let flyPitch = 0;
let flyYaw = 0;

// Walk Mode (First Person FPS) State
let isFirstPerson = false;
const playerPos = new THREE.Vector3(0, 1.6, 2);
let playerYaw = 0;
let playerPitch = 0;
const keys: Record<string, boolean> = {};
let stepTimer = 0;

// Registry of Three.js objects
const propMeshMap = new Map<string, THREE.Object3D>();
const propCanvasMap = new Map<string, { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture }>();

// =============================================================================
// Initialize VXR Application & Three.js Environment
// =============================================================================
const container = document.getElementById('app') as HTMLElement;
const app = new XRApp({
  container,
  enableShadows: true,
  enableGrid: false,
  enableVR: true,
  autoVRButton: false, // Handled by top bar #btn-test-vr
  cameraPosition: [0, 22, 22],
  fov: 50,
});

app.scene.setEnvironmentPreset('studio');
app.scene.setBackground(0x060912);

// Add architectural grid floor
const gridFloor = new THREE.GridHelper(70, 70, 0x1e293b, 0x0f172a);
gridFloor.position.y = -0.01;
app.scene.nativeScene.add(gridFloor);

// Configure Editor Camera & OrbitControls
if (app.controls) {
  app.controls.enableDamping = true;
  app.controls.dampingFactor = 0.08;
  app.controls.minDistance = 1.0;
  app.controls.maxDistance = 120.0;
  app.controls.screenSpacePanning = true;
  app.controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };
  app.controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };
}

let scenario = app.createScenario('VXR Studio Level');

// =============================================================================
// Interactive 3D TransformControls (Gizmo)
// =============================================================================
const transformControls = new TransformControls(app.camera, app.renderer.nativeRenderer.domElement);
transformControls.size = 0.85;
app.scene.nativeScene.add(transformControls.getHelper());

transformControls.addEventListener('dragging-changed', (event) => {
  if (app.controls && activeNavMode !== 'fly' && activeNavMode !== 'walk') {
    app.controls.enabled = !event.value;
  }
});

transformControls.addEventListener('change', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  const mesh = propMeshMap.get(selectedPropId);
  const parentRoom = p?.roomId ? rooms.find((r) => r.id === p.roomId) : null;

  if (p && mesh) {
    const cx = parentRoom ? parentRoom.center[0] : 0;
    const cz = parentRoom ? parentRoom.center[2] : 0;

    // Sync mesh transform back to prop data model
    p.relX = parseFloat((mesh.position.x - cx).toFixed(2));
    p.relY = parseFloat(mesh.position.y.toFixed(2));
    p.relZ = parseFloat((mesh.position.z - cz).toFixed(2));

    p.rotX = parseFloat(THREE.MathUtils.radToDeg(mesh.rotation.x).toFixed(1));
    p.rotY = parseFloat(THREE.MathUtils.radToDeg(mesh.rotation.y).toFixed(1));
    p.rotZ = parseFloat(THREE.MathUtils.radToDeg(mesh.rotation.z).toFixed(1));

    p.scaleX = parseFloat(mesh.scale.x.toFixed(2));
    p.scaleY = parseFloat(mesh.scale.y.toFixed(2));
    p.scaleZ = parseFloat(mesh.scale.z.toFixed(2));

    updatePropertyInputs(p);
    triggerAutoSave();
  }
});

// =============================================================================
// Procedural Mesh Factories
// =============================================================================

function createBasicMesh(prop: StudioPropDef): THREE.Object3D {
  let geo: THREE.BufferGeometry;
  const color = new THREE.Color(prop.color);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.15,
  });

  if (prop.subtype === 'sphere') {
    geo = new THREE.SphereGeometry(0.7, 32, 16);
  } else if (prop.subtype === 'cylinder') {
    geo = new THREE.CylinderGeometry(0.6, 0.6, 1.4, 32);
  } else if (prop.subtype === 'plane') {
    geo = new THREE.BoxGeometry(2.0, 0.04, 2.0);
  } else if (prop.subtype === 'tube') {
    geo = new THREE.TorusGeometry(0.7, 0.2, 16, 32);
  } else if (prop.subtype === 'cone') {
    geo = new THREE.ConeGeometry(0.7, 1.4, 32);
  } else if (prop.subtype === 'torus') {
    geo = new THREE.TorusGeometry(0.7, 0.25, 16, 32);
  } else if (prop.subtype === 'pyramid') {
    geo = new THREE.ConeGeometry(0.85, 1.3, 4);
  } else {
    // Box
    geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Ergonomic Office Chair
function createModernChairMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const color = new THREE.Color(prop.color || '#1e293b');
  const darkMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.1 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  // 5-Star Chrome Base
  const baseGroup = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.35, 8), chromeMat);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = angle;
    arm.position.set(Math.cos(angle) * 0.18, 0.04, Math.sin(angle) * 0.18);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 8), wheelMat);
    wheel.position.set(Math.cos(angle) * 0.35, 0.025, Math.sin(angle) * 0.35);
    baseGroup.add(arm, wheel);
  }
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 16), chromeMat);
  stem.position.y = 0.25;
  baseGroup.add(stem);
  group.add(baseGroup);

  // Ergonomic Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.52), darkMat);
  seat.position.y = 0.5;
  group.add(seat);

  // Curved Mesh Backrest
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.65, 0.05), darkMat);
  back.position.set(0, 0.85, -0.24);
  back.rotation.x = -0.08;
  group.add(back);

  // Headrest
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.05), darkMat);
  headrest.position.set(0, 1.22, -0.28);
  group.add(headrest);

  // Armrests
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.3), darkMat);
  armL.position.set(-0.3, 0.65, -0.05);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.3), darkMat);
  armR.position.set(0.3, 0.65, -0.05);
  group.add(armL, armR);

  return group;
}

// Executive Minimalist Desk
function createExecutiveDeskMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const woodColor = new THREE.Color(prop.color || '#451a03');
  const woodMat = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.6 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.85, roughness: 0.25 });

  // Top Surface
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.85), woodMat);
  top.position.y = 0.74;
  group.add(top);

  // Steel Legs (Square tubular profiles)
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.75), steelMat);
  legL.position.set(-0.88, 0.36, 0);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.75), steelMat);
  legR.position.set(0.88, 0.36, 0);
  group.add(legL, legR);

  // Under-desk Drawer Unit
  const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.35, 0.65), woodMat);
  drawer.position.set(0.62, 0.52, 0);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.02), steelMat);
  handle.position.set(0.62, 0.55, 0.34);
  group.add(drawer, handle);

  return group;
}

// Museum Showcase Pedestal with Vitrine
function createMuseumPedestalMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const columnMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.35,
    roughness: 0.05,
    metalness: 0.1,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.15 });

  // White Column Plinth
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.95, 32), columnMat);
  plinth.position.y = 0.475;
  group.add(plinth);

  // Brass Trim Ring
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.03, 32), trimMat);
  ring.position.y = 0.965;
  group.add(ring);

  // Glass Vitrine Cube
  const glassBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), glassMat);
  glassBox.position.y = 1.30;
  group.add(glassBox);

  // Inner Artifact (Golden Scarab / Gem)
  const gem = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12), trimMat);
  gem.position.y = 1.15;
  group.add(gem);

  // Warm Spotlight inside
  const spot = new THREE.PointLight(0xffedd5, 1.2, 4);
  spot.position.y = 1.55;
  group.add(spot);

  return group;
}

// Modern Abstract Mobius Sculpture
function createAbstractSculptureMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2 });
  const mobiusMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.92,
    roughness: 0.12,
  });

  // Black Plinth Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 32), baseMat);
  base.position.y = 0.04;
  group.add(base);

  // Torus Knot Sculpture
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.42, 0.11, 128, 16, 2, 3), mobiusMat);
  knot.position.y = 0.65;
  knot.castShadow = true;
  group.add(knot);

  return group;
}

// Futuristic Holographic Cyber Server
function createCyberServerMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x090d18, metalness: 0.85, roughness: 0.3 });
  const neonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, transparent: true, opacity: 0.5, roughness: 0.1 });

  // Server Chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.7), bodyMat);
  body.position.y = 0.7;
  group.add(body);

  // Vertical Glowing Neon Corner Strips
  const offsets = [
    [-0.34, 0.7, -0.34], [0.34, 0.7, -0.34],
    [-0.34, 0.7, 0.34], [0.34, 0.7, 0.34]
  ];
  for (const [ox, oy, oz] of offsets) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.35, 0.02), neonMat);
    strip.position.set(ox, oy, oz);
    group.add(strip);
  }

  // Front Glass Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.3, 0.02), glassMat);
  door.position.set(0, 0.7, 0.355);
  group.add(door);

  // Top Holographic Display
  const holoScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  }));
  holoScreen.position.set(0, 1.6, 0);
  holoScreen.rotation.x = -0.25;
  group.add(holoScreen);

  return group;
}

// Slim Workstation Laptop
function createLaptopMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const aluMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.015, 0.32), aluMat);
  base.position.y = 0.008;
  group.add(base);

  // Angled Screen
  const screenLid = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.012), aluMat);
  screenLid.position.set(0, 0.16, -0.16);
  screenLid.rotation.x = -0.22;
  const screenGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.28), screenMat);
  screenGlow.position.set(0, 0.16, -0.15);
  screenGlow.rotation.x = -0.22;
  group.add(screenLid, screenGlow);

  return group;
}

// Classical Marble Statue / Bust on Plinth
function createStatueMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3, metalness: 0.05 });

  // Plinth Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.65), marbleMat);
  base.position.y = 0.45;
  group.add(base);

  // Torso / Bust
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.55, 16), marbleMat);
  torso.position.y = 1.15;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 16), marbleMat);
  head.position.y = 1.55;
  group.add(torso, head);

  return group;
}

// Interactive Multimedia Art Frame
function createFrameArtCanvas(title: string, colorHex: string): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#0a1020');
  gradient.addColorStop(0.5, '#1e293b');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = colorHex || '#38bdf8';
  ctx.lineWidth = 12;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title || 'Obra Maestra VXR', canvas.width / 2, canvas.height / 2);

  ctx.font = '24px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('Haz clic para ver en pantalla completa', canvas.width / 2, canvas.height / 2 + 50);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { canvas, texture };
}

function createFrameArtMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const w = prop.frameWidth || 2.2;
  const h = prop.frameHeight || 1.6;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.15, h + 0.15, 0.08), frameMat);
  group.add(frame);

  if (prop.imageUrl) {
    const loader = new THREE.TextureLoader();
    const picMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    loader.load(prop.imageUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      picMat.map = tex;
      picMat.needsUpdate = true;
    });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), picMat);
    pic.position.z = 0.045;
    group.add(pic);
  } else {
    const artData = createFrameArtCanvas(prop.name, prop.color);
    propCanvasMap.set(prop.id, artData);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: artData.texture }));
    pic.position.z = 0.045;
    group.add(pic);
  }

  return group;
}

// Video Screen & Billboard
function createVideoScreenMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 0.08), new THREE.MeshStandardMaterial({ color: 0x050811 }));
  group.add(frame);

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 640;
  screenCanvas.height = 360;
  const ctx = screenCanvas.getContext('2d')!;
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▶ REPRODUCTOR DE VIDEO', 320, 160);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(prop.videoUrl ? 'Haz clic para reproducir' : 'URL de YouTube requerida', 320, 205);

  const tex = new THREE.CanvasTexture(screenCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.65, 1.45), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.z = 0.045;
  group.add(screen);

  return group;
}

function createBillboardFloatingMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(prop.text || 'ANUNCIO VXR', 256, 120);

  ctx.font = '18px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🔗 Clic para abrir enlace', 256, 165);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.4, 0.06),
    new THREE.MeshStandardMaterial({ map: tex, emissive: 0x0c4a6e, emissiveIntensity: 0.35 })
  );
  group.add(mesh);
  return group;
}

function spawnPropMesh(prop: StudioPropDef): THREE.Object3D {
  const parentRoom = prop.roomId ? rooms.find((r) => r.id === prop.roomId) : (rooms.length > 0 ? rooms[0] : null);
  const cx = parentRoom ? parentRoom.center[0] : 0;
  const cz = parentRoom ? parentRoom.center[2] : 0;
  const worldX = cx + prop.relX;
  const worldY = prop.relY;
  const worldZ = cz + prop.relZ;

  let mesh: THREE.Object3D;
  if (prop.subtype === 'chair') {
    mesh = createModernChairMesh(prop);
  } else if (prop.subtype === 'desk') {
    mesh = createExecutiveDeskMesh(prop);
  } else if (prop.subtype === 'pedestal') {
    mesh = createMuseumPedestalMesh(prop);
  } else if (prop.subtype === 'sculpture') {
    mesh = createAbstractSculptureMesh(prop);
  } else if (prop.subtype === 'server') {
    mesh = createCyberServerMesh(prop);
  } else if (prop.subtype === 'laptop') {
    mesh = createLaptopMesh(prop);
  } else if (prop.subtype === 'statue') {
    mesh = createStatueMesh(prop);
  } else if (prop.subtype === 'panel' || prop.subtype === 'partition_glass') {
    mesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.2, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.05 })
    );
  } else if (prop.subtype === 'frame_art') {
    mesh = createFrameArtMesh(prop);
  } else if (prop.subtype === 'screen_video') {
    mesh = createVideoScreenMesh(prop);
  } else if (prop.subtype === 'billboard_floating') {
    mesh = createBillboardFloatingMesh(prop);
  } else {
    mesh = createBasicMesh(prop);
  }

  mesh.userData = { ...mesh.userData, propId: prop.id };
  mesh.position.set(worldX, worldY, worldZ);
  mesh.rotation.set(
    THREE.MathUtils.degToRad(prop.rotX || 0),
    THREE.MathUtils.degToRad(prop.rotY || 0),
    THREE.MathUtils.degToRad(prop.rotZ || 0)
  );
  mesh.scale.set(prop.scaleX || 1, prop.scaleY || 1, prop.scaleZ || 1);

  app.scene.nativeScene.add(mesh);
  propMeshMap.set(prop.id, mesh);
  return mesh;
}

// =============================================================================
// Scenario Rebuilder
// =============================================================================
function rebuildScenario(): void {
  // Clear scene meshes
  for (const [, mesh] of propMeshMap) {
    app.scene.nativeScene.remove(mesh);
  }
  propMeshMap.clear();

  scenario.clear();
  scenario = app.createScenario('VXR Studio Level');

  // Build rooms
  for (const r of rooms) {
    scenario.addRoom({
      id: r.id,
      name: r.name,
      theme: r.theme,
      dimensions: r.dimensions,
      center: r.center,
      doors: r.doors,
      spawnPoint: r.spawnPoint,
    });
  }

  // Connect rooms
  for (const c of connections) {
    scenario.connectRooms({
      fromRoomId: c.fromRoomId,
      fromWall: c.fromWall,
      toRoomId: c.toRoomId,
      toWall: c.toWall,
      width: c.width,
      height: c.height,
    });
  }

  scenario.build();

  // Respawn all props
  for (const p of props) {
    spawnPropMesh(p);
  }

  renderRoomsList();
  updateSceneStats();
}

// =============================================================================
// Templates Loader (Museo, Sci-Fi Lab, Oficina, Cyberpunk, Blanco)
// =============================================================================
function loadTemplate(templateKey: string): void {
  app.audio.playWarp();

  if (templateKey === 'empty') {
    rooms = [];
    connections = [];
    props = [];
    selectedRoomId = null;
    selectedPropId = null;
    document.getElementById('lbl-project-name')!.textContent = 'Proyecto: Escenario en Blanco';
    rebuildScenario();
    app.resetCamera([0, 18, 16], [0, 0, 0]);
    showToast('✨ Escenario reiniciado en blanco');
    triggerAutoSave();
    return;
  }

  if (templateKey === 'museum') {
    rooms = [{
      id: 'room-museum',
      name: 'Galería de Arte Central',
      theme: 'gallery',
      dimensions: { width: 18, depth: 14, height: 4.5 },
      center: [0, 0, 0],
      doors: [],
      spawnPoint: [0, 1.6, 5],
    }];
    connections = [];
    props = [
      {
        id: 'prop-ped-1', roomId: 'room-museum', category: 'furniture', subtype: 'pedestal',
        name: 'Pedestal Escultura', relX: -4.0, relY: 0, relZ: -2.0,
        rotX: 0, rotY: 0, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, color: '#f8fafc'
      },
      {
        id: 'prop-sculp-1', roomId: 'room-museum', category: 'decoration', subtype: 'sculpture',
        name: 'Mobius Holográfico', relX: -4.0, relY: 1.25, relZ: -2.0,
        rotX: 0, rotY: 45, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, color: '#38bdf8'
      },
      {
        id: 'prop-ped-2', roomId: 'room-museum', category: 'furniture', subtype: 'pedestal',
        name: 'Pedestal Escultura Clásica', relX: 4.0, relY: 0, relZ: -2.0,
        rotX: 0, rotY: 0, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, color: '#f8fafc'
      },
      {
        id: 'prop-statue-1', roomId: 'room-museum', category: 'decoration', subtype: 'statue',
        name: 'Busto de Mármol', relX: 4.0, relY: 1.1, relZ: -2.0,
        rotX: 0, rotY: -30, rotZ: 0, scaleX: 0.9, scaleY: 0.9, scaleZ: 0.9, color: '#f1f5f9'
      },
      {
        id: 'prop-art-1', roomId: 'room-museum', category: 'exhibition', subtype: 'frame_art',
        name: 'Obra de Vanguardia', relX: 0, relY: 2.2, relZ: -6.8,
        rotX: 0, rotY: 0, rotZ: 0, scaleX: 1.2, scaleY: 1.2, scaleZ: 1, color: '#d97706',
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&auto=format&fit=crop'
      }
    ];
    document.getElementById('lbl-project-name')!.textContent = 'Proyecto: Museo Interdisciplinario';
  } else if (templateKey === 'scifi') {
    rooms = [{
      id: 'room-scifi',
      name: 'Laboratorio de Ciencias XR',
      theme: 'scifi',
      dimensions: { width: 16, depth: 12, height: 4.0 },
      center: [0, 0, 0],
      doors: [],
      spawnPoint: [0, 1.6, 4],
    }];
    connections = [];
    props = [
      {
        id: 'prop-server-1', roomId: 'room-scifi', category: 'decoration', subtype: 'server',
        name: 'Servidor Cuántico', relX: -5.0, relY: 0, relZ: -3.5,
        rotX: 0, rotY: 30, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, color: '#00f0ff'
      },
      {
        id: 'prop-desk-1', roomId: 'room-scifi', category: 'furniture', subtype: 'desk',
        name: 'Estación de Trabajo A', relX: -1.5, relY: 0, relZ: -2.0,
        rotX: 0, rotY: 0, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, color: '#111827'
      },
      {
        id: 'prop-laptop-1', roomId: 'room-scifi', category: 'furniture', subtype: 'laptop',
        name: 'Terminal Móvil', relX: -1.5, relY: 0.76, relZ: -2.0,
        rotX: 0, rotY: 10, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, color: '#38bdf8'
      },
      {
        id: 'prop-chair-1', roomId: 'room-scifi', category: 'furniture', subtype: 'chair',
        name: 'Silla Ergonómica', relX: -1.5, relY: 0, relZ: -1.2,
        rotX: 0, rotY: 180, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, color: '#1e293b'
      },
      {
        id: 'prop-video-1', roomId: 'room-scifi', category: 'exhibition', subtype: 'screen_video',
        name: 'Pantalla Holográfica', relX: 2.5, relY: 1.8, relZ: -5.8,
        rotX: 0, rotY: 0, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, color: '#0284c7',
        videoUrl: 'https://www.youtube.com/watch?v=k1BneeJTDcU'
      }
    ];
    document.getElementById('lbl-project-name')!.textContent = 'Proyecto: Laboratorio de Ciencias';
  } else if (templateKey === 'office') {
    rooms = [{
      id: 'room-office',
      name: 'Oficina Corporativa VXR',
      theme: 'office',
      dimensions: { width: 16, depth: 14, height: 3.8 },
      center: [0, 0, 0],
      doors: [],
      spawnPoint: [0, 1.6, 5],
    }];
    connections = [];
    props = [
      {
        id: 'prop-desk-off-1', roomId: 'room-office', category: 'furniture', subtype: 'desk',
        name: 'Escritorio Ejecutivo', relX: -3.0, relY: 0, relZ: -2.0,
        rotX: 0, rotY: 0, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, color: '#451a03'
      },
      {
        id: 'prop-chair-off-1', roomId: 'room-office', category: 'furniture', subtype: 'chair',
        name: 'Silla Directiva', relX: -3.0, relY: 0, relZ: -1.2,
        rotX: 0, rotY: 180, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, color: '#0f172a'
      },
      {
        id: 'prop-glass-1', roomId: 'room-office', category: 'architecture', subtype: 'partition_glass',
        name: 'Mampara Acristalada', relX: 0.5, relY: 0, relZ: -2.0,
        rotX: 0, rotY: 90, rotZ: 0, scaleX: 1, scaleY: 1, scaleZ: 1, color: '#38bdf8'
      }
    ];
    document.getElementById('lbl-project-name')!.textContent = 'Proyecto: Oficina Moderna';
  } else if (templateKey === 'cyber') {
    rooms = [{
      id: 'room-cyber',
      name: 'Showroom Espacial XR',
      theme: 'minimal',
      dimensions: { width: 20, depth: 16, height: 5.0 },
      center: [0, 0, 0],
      doors: [],
      spawnPoint: [0, 1.6, 6],
    }];
    connections = [];
    props = [
      {
        id: 'prop-bill-cyber', roomId: 'room-cyber', category: 'exhibition', subtype: 'billboard_floating',
        name: 'Cartelera Neón', relX: 0, relY: 2.6, relZ: -4.0,
        rotX: 0, rotY: 0, rotZ: 0, scaleX: 1.2, scaleY: 1.2, scaleZ: 1, color: '#00f0ff',
        text: 'VXR SPATIAL SHOWROOM 2026', linkUrl: 'https://github.com/Vickman123/Framework-XVR'
      },
      {
        id: 'prop-sculp-cyber', roomId: 'room-cyber', category: 'decoration', subtype: 'sculpture',
        name: 'Artefacto Flotante', relX: 0, relY: 1.0, relZ: 0,
        rotX: 0, rotY: 0, rotZ: 0, scaleX: 1.4, scaleY: 1.4, scaleZ: 1, color: '#7c3aed'
      }
    ];
    document.getElementById('lbl-project-name')!.textContent = 'Proyecto: Showroom Futurista';
  }

  selectedRoomId = rooms[0]?.id || null;
  selectedPropId = null;
  rebuildScenario();
  app.resetCamera([0, 18, 16], [0, 0, 0]);
  showToast(`🏛️ Plantilla cargada con éxito`);
  triggerAutoSave();
}

// =============================================================================
// Navigation Modes: Edit, Explore, Fly (Creative Minecraft), Walk
// =============================================================================
const btnModeEdit = document.getElementById('btn-mode-edit') as HTMLButtonElement;
const btnModeExplore = document.getElementById('btn-mode-explore') as HTMLButtonElement;
const btnModeFly = document.getElementById('btn-mode-fly') as HTMLButtonElement;
const btnModeWalk = document.getElementById('btn-mode-walk') as HTMLButtonElement;
const flyCallout = document.getElementById('fly-mode-callout') as HTMLElement;

function setNavMode(mode: NavMode): void {
  activeNavMode = mode;
  [btnModeEdit, btnModeExplore, btnModeFly, btnModeWalk].forEach((b) => b?.classList.remove('active'));

  if (mode === 'edit') {
    btnModeEdit?.classList.add('active');
    flyCallout?.classList.remove('show');
    if (app.controls) app.controls.enabled = true;
    if (selectedPropId && propMeshMap.has(selectedPropId)) {
      transformControls.attach(propMeshMap.get(selectedPropId)!);
    }
    if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock();
    isFirstPerson = false;
    showToast('↖ Modo Edición: Órbita con controles de transformación');
  } else if (mode === 'explore') {
    btnModeExplore?.classList.add('active');
    flyCallout?.classList.remove('show');
    if (app.controls) app.controls.enabled = true;
    transformControls.detach();
    if (document.exitPointerLock && document.pointerLockElement) document.exitPointerLock();
    isFirstPerson = false;
    showToast('👁 Modo Explorar: Órbita libre y suave');
  } else if (mode === 'fly') {
    btnModeFly?.classList.add('active');
    flyCallout?.classList.add('show');
    if (app.controls) app.controls.enabled = false;
    transformControls.detach();
    isFirstPerson = false;

    // Initialize fly orientation from current camera
    flyPitch = app.camera.rotation.x;
    flyYaw = app.camera.rotation.y;
    container.requestPointerLock?.();
    showToast('🛸 ¡Modo Vuelo Creativo Activo! Usa W,A,S,D para volar, Q/E subir/bajar');
  } else if (mode === 'walk') {
    btnModeWalk?.classList.add('active');
    flyCallout?.classList.remove('show');
    toggleFirstPersonMode(true);
  }
}

btnModeEdit?.addEventListener('click', () => setNavMode('edit'));
btnModeExplore?.addEventListener('click', () => setNavMode('explore'));
btnModeFly?.addEventListener('click', () => setNavMode('fly'));
btnModeWalk?.addEventListener('click', () => setNavMode('walk'));

// Pointer Lock Listener
document.addEventListener('pointerlockchange', () => {
  isPointerLocked = document.pointerLockElement === container;
});

// Mouse Movement in Fly and Walk Modes
window.addEventListener('mousemove', (e) => {
  if (!isPointerLocked) return;

  if (activeNavMode === 'fly') {
    const sensitivity = 0.0022;
    flyYaw -= e.movementX * sensitivity;
    flyPitch -= e.movementY * sensitivity;
    flyPitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, flyPitch));

    app.camera.rotation.order = 'YXZ';
    app.camera.rotation.y = flyYaw;
    app.camera.rotation.x = flyPitch;
  } else if (isFirstPerson) {
    const sensitivity = 0.0022;
    playerYaw -= e.movementX * sensitivity;
    playerPitch -= e.movementY * sensitivity;
    playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, playerPitch));
    app.camera.rotation.order = 'YXZ';
    app.camera.rotation.y = playerYaw;
    app.camera.rotation.x = playerPitch;
  }
});

// Fly Keys
window.addEventListener('keydown', (e) => {
  if (['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())) return;
  if (flyKeys.hasOwnProperty(e.code)) flyKeys[e.code] = true;
  keys[e.code] = true;

  if (e.code === 'Escape') {
    if (activeNavMode === 'fly' || isFirstPerson) {
      setNavMode('edit');
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (flyKeys.hasOwnProperty(e.code)) flyKeys[e.code] = false;
  keys[e.code] = false;
});

// Fly Loop
function updateFlyControls(delta: number): void {
  if (activeNavMode !== 'fly') return;

  const speedMult = flyKeys.ShiftLeft || flyKeys.ShiftRight ? 2.5 : 1.0;
  const currentSpeed = flySpeed * speedMult;

  const forward = new THREE.Vector3();
  app.camera.getWorldDirection(forward);
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  const moveDir = new THREE.Vector3();
  if (flyKeys.KeyW) moveDir.add(forward);
  if (flyKeys.KeyS) moveDir.sub(forward);
  if (flyKeys.KeyD) moveDir.add(right);
  if (flyKeys.KeyA) moveDir.sub(right);
  if (flyKeys.KeyE || flyKeys.Space) moveDir.y += 1.0;
  if (flyKeys.KeyQ) moveDir.y -= 1.0;

  if (moveDir.lengthSq() > 0.001) {
    moveDir.normalize().multiplyScalar(currentSpeed * delta);
    app.camera.position.add(moveDir);
  }
}

// =============================================================================
// Minimap Radar ("Vista Superior")
// =============================================================================
const minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;

function drawMinimap(): void {
  if (!minimapCtx || !minimapCanvas) return;

  const w = minimapCanvas.width;
  const h = minimapCanvas.height;
  minimapCtx.fillStyle = '#040711';
  minimapCtx.fillRect(0, 0, w, h);

  // Subtle radar grid
  minimapCtx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  minimapCtx.lineWidth = 1;
  const cx = w / 2;
  const cy = h / 2;
  const scale = 3.2; // 3.2 pixels per meter

  for (let x = 0; x < w; x += 20) {
    minimapCtx.beginPath();
    minimapCtx.moveTo(x, 0);
    minimapCtx.lineTo(x, h);
    minimapCtx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    minimapCtx.beginPath();
    minimapCtx.moveTo(0, y);
    minimapCtx.lineTo(w, y);
    minimapCtx.stroke();
  }

  // Draw Rooms
  minimapCtx.strokeStyle = '#38bdf8';
  minimapCtx.lineWidth = 1.5;
  for (const r of rooms) {
    const rx = cx + r.center[0] * scale - (r.dimensions.width * scale) / 2;
    const ry = cy + r.center[2] * scale - (r.dimensions.depth * scale) / 2;
    const rw = r.dimensions.width * scale;
    const rh = r.dimensions.depth * scale;

    minimapCtx.fillStyle = 'rgba(2, 132, 199, 0.12)';
    minimapCtx.fillRect(rx, ry, rw, rh);
    minimapCtx.strokeRect(rx, ry, rw, rh);
  }

  // Draw Props
  for (const p of props) {
    const parentRoom = p.roomId ? rooms.find((r) => r.id === p.roomId) : null;
    const rcx = parentRoom ? parentRoom.center[0] : 0;
    const rcz = parentRoom ? parentRoom.center[2] : 0;
    const px = cx + (rcx + p.relX) * scale;
    const py = cy + (rcz + p.relZ) * scale;

    minimapCtx.fillStyle = p.id === selectedPropId ? '#f59e0b' : '#38bdf8';
    minimapCtx.beginPath();
    minimapCtx.arc(px, py, 2.5, 0, Math.PI * 2);
    minimapCtx.fill();
  }

  // Draw Camera position & view frustum cone
  const camX = cx + app.camera.position.x * scale;
  const camY = cy + app.camera.position.z * scale;

  const camDir = new THREE.Vector3();
  app.camera.getWorldDirection(camDir);
  const heading = Math.atan2(camDir.x, camDir.z);

  // View cone
  minimapCtx.fillStyle = 'rgba(56, 189, 248, 0.25)';
  minimapCtx.beginPath();
  minimapCtx.moveTo(camX, camY);
  minimapCtx.arc(camX, camY, 18, heading - 0.45, heading + 0.45);
  minimapCtx.closePath();
  minimapCtx.fill();

  // Camera dot
  minimapCtx.fillStyle = '#ffffff';
  minimapCtx.beginPath();
  minimapCtx.arc(camX, camY, 3, 0, Math.PI * 2);
  minimapCtx.fill();
}

// Minimap Click Teleport
minimapCanvas?.addEventListener('click', (e) => {
  const rect = minimapCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const cx = minimapCanvas.width / 2;
  const cy = minimapCanvas.height / 2;
  const scale = 3.2;

  const targetX = (mx - cx) / scale;
  const targetZ = (my - cy) / scale;

  if (activeNavMode === 'fly' || isFirstPerson) {
    app.camera.position.set(targetX, app.camera.position.y, targetZ);
  } else {
    app.resetCamera([targetX, 18, targetZ + 16], [targetX, 0, targetZ]);
  }
  showToast('📍 Cámara desplazada en el mapa');
});

// =============================================================================
// 3D Orientation Gizmo (Top Right Compass)
// =============================================================================
const orientCanvas = document.getElementById('orientation-gizmo') as HTMLCanvasElement;
const orientCtx = orientCanvas ? orientCanvas.getContext('2d') : null;

function drawOrientationGizmo(): void {
  if (!orientCtx || !orientCanvas) return;

  const w = orientCanvas.width;
  const h = orientCanvas.height;
  orientCtx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const r = 18;

  // Transform unit axes with camera inverse matrix
  const vX = new THREE.Vector3(1, 0, 0).applyMatrix4(app.camera.matrixWorldInverse);
  const vY = new THREE.Vector3(0, 1, 0).applyMatrix4(app.camera.matrixWorldInverse);
  const vZ = new THREE.Vector3(0, 0, 1).applyMatrix4(app.camera.matrixWorldInverse);

  const axes = [
    { vec: vX, label: 'X', color: '#ef4444' },
    { vec: vY, label: 'Y', color: '#22c55e' },
    { vec: vZ, label: 'Z', color: '#38bdf8' },
  ];

  // Sort by depth
  axes.sort((a, b) => a.vec.z - b.vec.z);

  for (const axis of axes) {
    const endX = cx + axis.vec.x * r;
    const endY = cy - axis.vec.y * r; // Invert Y for 2D screen

    orientCtx.strokeStyle = axis.color;
    orientCtx.lineWidth = 2.5;
    orientCtx.beginPath();
    orientCtx.moveTo(cx, cy);
    orientCtx.lineTo(endX, endY);
    orientCtx.stroke();

    // End circle with label
    orientCtx.fillStyle = axis.color;
    orientCtx.beginPath();
    orientCtx.arc(endX, endY, 5, 0, Math.PI * 2);
    orientCtx.fill();

    orientCtx.fillStyle = '#ffffff';
    orientCtx.font = 'bold 8px sans-serif';
    orientCtx.textAlign = 'center';
    orientCtx.textBaseline = 'middle';
    orientCtx.fillText(axis.label, endX, endY);
  }
}

// =============================================================================
// Right Panel Dock & Collapsible Manager
// =============================================================================
const panelProperties = document.getElementById('panel-properties') as HTMLElement;
const btnDockCollapse = document.getElementById('btn-dock-collapse') as HTMLButtonElement;
const lblPanelRightTitle = document.getElementById('lbl-panel-right-title') as HTMLElement;

function togglePanelCollapse(): void {
  const isCollapsed = panelProperties.classList.toggle('collapsed');
  btnDockCollapse.textContent = isCollapsed ? '»' : '«';
  btnDockCollapse.title = isCollapsed ? 'Mostrar panel inspector' : 'Ocultar panel inspector';

  // Force Three.js and browser layout update
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 260);
}

btnDockCollapse?.addEventListener('click', togglePanelCollapse);
document.getElementById('btn-collapse-right')?.addEventListener('click', togglePanelCollapse);

function setDockTab(tabKey: string): void {
  document.querySelectorAll('.dock-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach((tc) => tc.classList.remove('active'));

  const activeBtn = document.querySelector(`.dock-btn[data-dock-tab="${tabKey}"]`);
  activeBtn?.classList.add('active');

  const activeContent = document.getElementById(`tab-content-${tabKey}`);
  activeContent?.classList.add('active');

  // Ensure panel is expanded
  if (panelProperties.classList.contains('collapsed')) {
    panelProperties.classList.remove('collapsed');
    btnDockCollapse.textContent = '«';
    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 260);
  }

  const titles: Record<string, string> = {
    props: 'Propiedades',
    mats: 'Materiales & PBR',
    env: 'Entorno & Iluminación',
    scene: 'Jerarquía de Escena',
    settings: 'Configuración',
  };
  lblPanelRightTitle.textContent = titles[tabKey] || 'Propiedades';

  if (tabKey === 'scene') updateSceneTree();
}

document.querySelectorAll('.dock-btn[data-dock-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tabKey = btn.getAttribute('data-dock-tab')!;
    setDockTab(tabKey);
  });
});

// Top Nav Tabs
document.getElementById('top-tab-scene')?.addEventListener('click', () => setDockTab('props'));
document.getElementById('top-tab-resources')?.addEventListener('click', () => {
  document.getElementById('search-objects')?.focus();
});
document.getElementById('top-tab-lighting')?.addEventListener('click', () => setDockTab('env'));
document.getElementById('top-tab-environment')?.addEventListener('click', () => setDockTab('env'));
document.getElementById('top-tab-collaborate')?.addEventListener('click', () => {
  showToast('👥 Enlace de colaboración copiado al portapapeles');
});

// =============================================================================
// Scene Hierarchy Tree & Stats
// =============================================================================
function updateSceneTree(): void {
  const treeContainer = document.getElementById('scene-hierarchy-list');
  if (!treeContainer) return;
  treeContainer.innerHTML = '';

  for (const p of props) {
    const item = document.createElement('div');
    item.style.padding = '6px 8px';
    item.style.background = p.id === selectedPropId ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)';
    item.style.border = '1px solid ' + (p.id === selectedPropId ? '#38bdf8' : 'var(--vxr-border)');
    item.style.borderRadius = '6px';
    item.style.fontSize = '11px';
    item.style.color = '#fff';
    item.style.cursor = 'pointer';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.justifyContent = 'space-between';
    item.innerHTML = `<span>⬡ ${p.name}</span><span style="font-size: 9px; color: var(--vxr-text-dim);">${p.subtype}</span>`;

    item.addEventListener('click', () => {
      selectProp(p.id);
      focusSelectedProp();
      setDockTab('props');
    });

    treeContainer.appendChild(item);
  }
}

function updateSceneStats(): void {
  const statObjects = document.getElementById('stat-objects');
  const statRooms = document.getElementById('stat-rooms');
  if (statObjects) statObjects.textContent = props.length.toString();
  if (statRooms) statRooms.textContent = rooms.length.toString();
}

// =============================================================================
// Material & PBR Presets
// =============================================================================
document.querySelectorAll('[data-apply-tex]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!selectedPropId) {
      showToast('⚠️ Selecciona un objeto primero para aplicar la textura');
      return;
    }
    const mesh = propMeshMap.get(selectedPropId);
    if (!mesh) return;

    const texKey = btn.getAttribute('data-apply-tex');
    let texUrl = '';
    if (texKey === 'wood') texUrl = 'assets/textures/tex_wood_floor.jpg';
    else if (texKey === 'marble') texUrl = 'assets/textures/tex_marble_white.jpg';
    else if (texKey === 'cyber') texUrl = 'assets/textures/tex_cyber_grid.jpg';

    if (texUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(texUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        mesh.traverse((c) => {
          if ((c as THREE.Mesh).isMesh && (c as THREE.Mesh).material) {
            const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
            m.map = tex;
            m.needsUpdate = true;
          }
        });
        showToast(`✓ Textura ${texKey.toUpperCase()} aplicada`);
        triggerAutoSave();
      });
    }
  });
});

document.querySelectorAll('[data-apply-mat]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!selectedPropId) {
      showToast('⚠️ Selecciona un objeto primero');
      return;
    }
    const mesh = propMeshMap.get(selectedPropId);
    if (!mesh) return;

    const matKey = btn.getAttribute('data-apply-mat');
    mesh.traverse((c) => {
      if ((c as THREE.Mesh).isMesh && (c as THREE.Mesh).material) {
        const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
        m.map = null;
        if (matKey === 'gold') {
          m.color.set(0xf59e0b);
          m.metalness = 0.95;
          m.roughness = 0.15;
        } else if (matKey === 'chrome') {
          m.color.set(0xffffff);
          m.metalness = 1.0;
          m.roughness = 0.05;
        } else if (matKey === 'glass') {
          m.color.set(0x38bdf8);
          m.transparent = true;
          m.opacity = 0.4;
          m.roughness = 0.1;
        }
        m.needsUpdate = true;
      }
    });
    showToast(`✓ Acabado ${matKey?.toUpperCase()} aplicado`);
    triggerAutoSave();
  });
});

// Day / Night Theme Toggle
const btnThemeToggle = document.getElementById('btn-theme-toggle') as HTMLButtonElement;
btnThemeToggle?.addEventListener('click', () => {
  isNightTheme = !isNightTheme;
  if (isNightTheme) {
    app.scene.setBackground(0x060912);
    app.scene.setEnvironmentPreset('studio');
    showToast('🌙 Modo Cyberpunk Noche');
  } else {
    app.scene.setBackground(0x1e293b);
    app.scene.setEnvironmentPreset('city');
    showToast('☀️ Modo Estudio Fotográfico Día');
  }
});

// Bottom Center Toolbar
const toolIslandSelect = document.getElementById('tool-select') as HTMLButtonElement;
const toolIslandTranslate = document.getElementById('tool-translate') as HTMLButtonElement;
const toolIslandRotate = document.getElementById('tool-rotate') as HTMLButtonElement;
const toolIslandScale = document.getElementById('tool-scale') as HTMLButtonElement;
const toolDuplicate = document.getElementById('tool-duplicate') as HTMLButtonElement;
const toolDelete = document.getElementById('tool-delete') as HTMLButtonElement;
const toolAlign = document.getElementById('tool-align') as HTMLButtonElement;
const toolGroup = document.getElementById('tool-group') as HTMLButtonElement;
const toolSnap = document.getElementById('tool-snap') as HTMLButtonElement;

function setToolMode(mode: 'select' | 'translate' | 'rotate' | 'scale'): void {
  activeTool = mode;
  [toolIslandSelect, toolIslandTranslate, toolIslandRotate, toolIslandScale].forEach((b) => b?.classList.remove('active'));

  if (mode === 'select') {
    toolIslandSelect?.classList.add('active');
    transformControls.detach();
  } else {
    if (mode === 'translate') toolIslandTranslate?.classList.add('active');
    else if (mode === 'rotate') toolIslandRotate?.classList.add('active');
    else if (mode === 'scale') toolIslandScale?.classList.add('active');

    transformControls.setMode(mode);
    if (selectedPropId && propMeshMap.has(selectedPropId)) {
      transformControls.attach(propMeshMap.get(selectedPropId)!);
    }
  }
}

toolIslandSelect?.addEventListener('click', () => setToolMode('select'));
toolIslandTranslate?.addEventListener('click', () => setToolMode('translate'));
toolIslandRotate?.addEventListener('click', () => setToolMode('rotate'));
toolIslandScale?.addEventListener('click', () => setToolMode('scale'));
toolDuplicate?.addEventListener('click', () => {
  if (selectedPropId) duplicateProp(selectedPropId);
});
toolDelete?.addEventListener('click', () => {
  if (selectedPropId) deleteProp(selectedPropId);
});
toolAlign?.addEventListener('click', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  const mesh = propMeshMap.get(selectedPropId);
  if (p && mesh) {
    p.relY = 0;
    mesh.position.y = 0;
    updatePropertyInputs(p);
    showToast('⬡ Objeto alineado al suelo (Y=0)');
    triggerAutoSave();
  }
});
toolGroup?.addEventListener('click', () => {
  showToast('⛶ Agrupación espacial activada');
});
toolSnap?.addEventListener('click', () => {
  snapEnabled = !snapEnabled;
  transformControls.setTranslationSnap(snapEnabled ? 0.5 : null);
  transformControls.setRotationSnap(snapEnabled ? THREE.MathUtils.degToRad(15) : null);
  toolSnap.classList.toggle('active', snapEnabled);
  showToast(snapEnabled ? '⩪ Ajuste a cuadrícula (Snap: 0.5m / 15°) ACTIVO' : '⩪ Ajuste libre desactivado');
});

// Viewport Quick Actions (Top Right)
document.getElementById('btn-grid-toggle')?.addEventListener('click', () => {
  gridFloor.visible = !gridFloor.visible;
  showToast(gridFloor.visible ? '▦ Cuadrícula visible' : '▦ Cuadrícula oculta');
});
document.getElementById('btn-fullscreen-toggle')?.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});
document.getElementById('btn-cam-home')?.addEventListener('click', () => {
  const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
  const cx = activeRoom ? activeRoom.center[0] : 0;
  const cz = activeRoom ? activeRoom.center[2] : 0;
  app.resetCamera([cx, 18, cz + 16], [cx, 0, cz]);
  showToast('🏠 Vista de cámara centrada');
});
document.getElementById('btn-cam-snapshot')?.addEventListener('click', () => {
  const dataUrl = app.renderer.nativeRenderer.domElement.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `vxr-studio-${Date.now()}.png`;
  a.click();
  showToast('📷 Captura de pantalla guardada');
});

// Perspective Dropdown
const btnProjDropdown = document.getElementById('btn-proj-dropdown') as HTMLButtonElement;
const projSelectorMenu = document.getElementById('proj-selector-menu') as HTMLElement;
const lblCurrentProj = document.getElementById('lbl-current-proj') as HTMLElement;

btnProjDropdown?.addEventListener('click', () => {
  projSelectorMenu.classList.toggle('show');
});
document.querySelectorAll('[data-proj-set]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const proj = btn.getAttribute('data-proj-set');
    projSelectorMenu.classList.remove('show');
    if (proj === 'top') {
      lblCurrentProj.textContent = 'Superior (Top)';
      app.resetCamera([0, 30, 0], [0, 0, 0]);
    } else if (proj === 'front') {
      lblCurrentProj.textContent = 'Frontal';
      app.resetCamera([0, 2, 22], [0, 2, 0]);
    } else if (proj === 'side') {
      lblCurrentProj.textContent = 'Lateral';
      app.resetCamera([22, 2, 0], [0, 2, 0]);
    } else {
      lblCurrentProj.textContent = 'Perspectiva';
      app.resetCamera([0, 18, 16], [0, 0, 0]);
    }
  });
});

// Template Switcher Dropdown in Top Bar
const btnProjectSelect = document.getElementById('btn-project-select') as HTMLButtonElement;
const projectSelectorDropdown = document.getElementById('project-selector-dropdown') as HTMLElement;

btnProjectSelect?.addEventListener('click', () => {
  projectSelectorDropdown.classList.toggle('show');
});
document.querySelectorAll('[data-template-load]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tKey = btn.getAttribute('data-template-load')!;
    projectSelectorDropdown?.classList.remove('show');
    document.getElementById('welcome-modal')?.classList.remove('active');
    loadTemplate(tKey);
  });
});

// Primitives Click Handlers
document.querySelectorAll('[data-primitive]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const prim = btn.getAttribute('data-primitive')!;
    insertObjectFromCatalog({ category: 'basic', subtype: prim, name: prim.charAt(0).toUpperCase() + prim.slice(1) });
  });
});

// Presets Click Handlers
document.querySelectorAll('[data-preset-model]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const model = btn.getAttribute('data-preset-model')!;
    if (model === 'chair') insertObjectFromCatalog({ category: 'furniture', subtype: 'chair', name: 'Silla Ergonómica' });
    else if (model === 'desk') insertObjectFromCatalog({ category: 'furniture', subtype: 'desk', name: 'Escritorio Ejecutivo' });
    else if (model === 'pedestal') insertObjectFromCatalog({ category: 'furniture', subtype: 'pedestal', name: 'Pedestal Vitrina' });
    else if (model === 'sculpture') insertObjectFromCatalog({ category: 'decoration', subtype: 'sculpture', name: 'Escultura Mobius' });
    else if (model === 'server') insertObjectFromCatalog({ category: 'decoration', subtype: 'server', name: 'Servidor Holográfico' });
    else if (model === 'laptop') insertObjectFromCatalog({ category: 'furniture', subtype: 'laptop', name: 'Laptop Workstation' });
    else if (model === 'statue') insertObjectFromCatalog({ category: 'decoration', subtype: 'statue', name: 'Busto Esculpido' });
    else if (model === 'panel') insertObjectFromCatalog({ category: 'architecture', subtype: 'partition_glass', name: 'Panel Acristalado' });
  });
});

// Catalog Insertion
function insertObjectFromCatalog(item: { category: StudioPropCategory; subtype: string; name: string }): void {
  const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
  const roomId = activeRoom ? activeRoom.id : '';
  const roomName = activeRoom ? activeRoom.name : 'el lienzo';

  const offset = 1.0;
  const relX = parseFloat(((Math.random() - 0.5) * offset).toFixed(2));
  const relZ = parseFloat(((Math.random() - 0.5) * offset).toFixed(2));

  const newProp: StudioPropDef = {
    id: `prop-${Date.now().toString(36)}`,
    roomId,
    category: item.category,
    subtype: item.subtype,
    name: `${item.name}`,
    relX,
    relY: 0,
    relZ,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    color: '#38bdf8',
  };

  props.push(newProp);
  spawnPropMesh(newProp);
  selectProp(newProp.id);
  app.audio.playSuccess();
  showToast(`¡${newProp.name} añadido a ${roomName}!`);
  triggerAutoSave();
}

// GLB Local Importer
const fileGlbInput = document.getElementById('file-import-glb') as HTMLInputElement;
document.getElementById('btn-trigger-glb')?.addEventListener('click', () => fileGlbInput.click());
document.getElementById('btn-import-card')?.addEventListener('click', () => fileGlbInput.click());

fileGlbInput?.addEventListener('change', async () => {
  const file = fileGlbInput.files?.[0];
  if (!file) return;

  try {
    showToast('Cargando modelo 3D...');
    const loaded = await app.assets.loadModel(file, { autoGround: true, autoCenter: true });
    const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
    const roomId = activeRoom ? activeRoom.id : '';

    const newProp: StudioPropDef = {
      id: `prop-glb-${Date.now().toString(36)}`,
      roomId,
      category: 'model_glb',
      subtype: 'custom_glb',
      name: file.name.replace(/\.[^/.]+$/, ''),
      relX: 0,
      relY: 0,
      relZ: 0,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scaleX: 1,
      scaleY: 1,
      scaleZ: 1,
      color: '#ffffff',
    };

    props.push(newProp);
    loaded.userData = { ...loaded.userData, propId: newProp.id };
    app.scene.nativeScene.add(loaded);
    propMeshMap.set(newProp.id, loaded);

    selectProp(newProp.id);
    showToast(`✓ Modelo 3D "${file.name}" cargado con éxito`);
    triggerAutoSave();
  } catch (err: any) {
    showToast('Error al importar archivo GLB/GLTF');
  }
});

// Selection & Properties
const propSelectedContainer = document.getElementById('prop-selected-container') as HTMLElement;
const propEmptyContainer = document.getElementById('prop-empty-container') as HTMLElement;
const propThumb = document.getElementById('prop-thumb') as HTMLElement;
const propTitle = document.getElementById('prop-title') as HTMLElement;
const propTypeTag = document.getElementById('prop-type-tag') as HTMLElement;
const propNameInput = document.getElementById('prop-name-input') as HTMLInputElement;

const propPosX = document.getElementById('prop-pos-x') as HTMLInputElement;
const propPosY = document.getElementById('prop-pos-y') as HTMLInputElement;
const propPosZ = document.getElementById('prop-pos-z') as HTMLInputElement;
const propRotX = document.getElementById('prop-rot-x') as HTMLInputElement;
const propRotY = document.getElementById('prop-rot-y') as HTMLInputElement;
const propRotZ = document.getElementById('prop-rot-z') as HTMLInputElement;
const propScaleX = document.getElementById('prop-scale-x') as HTMLInputElement;
const propScaleY = document.getElementById('prop-scale-y') as HTMLInputElement;
const propScaleZ = document.getElementById('prop-scale-z') as HTMLInputElement;

const propColorSwatch = document.getElementById('prop-color-swatch') as HTMLElement;
const propColorHex = document.getElementById('prop-color-hex') as HTMLInputElement;
const propColorPicker = document.getElementById('prop-color-picker') as HTMLInputElement;

function selectProp(id: string): void {
  selectedPropId = id;
  const p = props.find((item) => item.id === id);
  const mesh = propMeshMap.get(id);

  if (!p || !mesh) {
    renderPropertiesEmpty();
    transformControls.detach();
    return;
  }

  propEmptyContainer.style.display = 'none';
  propSelectedContainer.style.display = 'flex';

  if (activeTool !== 'select' && activeNavMode === 'edit') {
    transformControls.setMode(activeTool);
    transformControls.attach(mesh);
  } else {
    transformControls.detach();
  }

  propTitle.textContent = p.name;
  propTypeTag.textContent = `Tipo: ${p.category.toUpperCase()} (${p.subtype})`;
  propNameInput.value = p.name;
  updatePropertyInputs(p);
}

function renderPropertiesEmpty(): void {
  propSelectedContainer.style.display = 'none';
  propEmptyContainer.style.display = 'block';
}

function updatePropertyInputs(p: StudioPropDef): void {
  propPosX.value = p.relX.toFixed(2);
  propPosY.value = p.relY.toFixed(2);
  propPosZ.value = p.relZ.toFixed(2);

  propRotX.value = p.rotX.toFixed(1);
  propRotY.value = p.rotY.toFixed(1);
  propRotZ.value = p.rotZ.toFixed(1);

  propScaleX.value = p.scaleX.toFixed(2);
  propScaleY.value = p.scaleY.toFixed(2);
  propScaleZ.value = p.scaleZ.toFixed(2);

  propColorSwatch.style.background = p.color;
  propColorHex.value = p.color;
  propColorPicker.value = p.color;
}

function applyTransformInputs(): void {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  const mesh = propMeshMap.get(selectedPropId);
  if (!p || !mesh) return;

  const parentRoom = p.roomId ? rooms.find((r) => r.id === p.roomId) : null;
  const cx = parentRoom ? parentRoom.center[0] : 0;
  const cz = parentRoom ? parentRoom.center[2] : 0;

  p.relX = parseFloat(propPosX.value) || 0;
  p.relY = parseFloat(propPosY.value) || 0;
  p.relZ = parseFloat(propPosZ.value) || 0;

  p.rotX = parseFloat(propRotX.value) || 0;
  p.rotY = parseFloat(propRotY.value) || 0;
  p.rotZ = parseFloat(propRotZ.value) || 0;

  p.scaleX = Math.max(0.05, parseFloat(propScaleX.value) || 1);
  p.scaleY = Math.max(0.05, parseFloat(propScaleY.value) || 1);
  p.scaleZ = Math.max(0.05, parseFloat(propScaleZ.value) || 1);

  mesh.position.set(cx + p.relX, p.relY, cz + p.relZ);
  mesh.rotation.set(
    THREE.MathUtils.degToRad(p.rotX),
    THREE.MathUtils.degToRad(p.rotY),
    THREE.MathUtils.degToRad(p.rotZ)
  );
  mesh.scale.set(p.scaleX, p.scaleY, p.scaleZ);
  triggerAutoSave();
}

[
  propPosX, propPosY, propPosZ,
  propRotX, propRotY, propRotZ,
  propScaleX, propScaleY, propScaleZ
].forEach((input) => input?.addEventListener('input', applyTransformInputs));

propNameInput?.addEventListener('input', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (p) {
    p.name = propNameInput.value;
    propTitle.textContent = p.name;
    triggerAutoSave();
  }
});

propColorPicker?.addEventListener('input', () => {
  const hex = propColorPicker.value;
  propColorHex.value = hex;
  propColorSwatch.style.background = hex;
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  const mesh = propMeshMap.get(selectedPropId);
  if (p && mesh) {
    p.color = hex;
    mesh.traverse((c) => {
      if ((c as THREE.Mesh).isMesh && (c as THREE.Mesh).material) {
        ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).color.set(hex);
      }
    });
    triggerAutoSave();
  }
});

function duplicateProp(id: string): void {
  const original = props.find((item) => item.id === id);
  if (!original) return;

  const copy: StudioPropDef = {
    ...original,
    id: `prop-${Date.now().toString(36)}`,
    name: `${original.name} (Copia)`,
    relX: parseFloat((original.relX + 0.6).toFixed(2)),
    relZ: parseFloat((original.relZ + 0.6).toFixed(2)),
  };

  props.push(copy);
  spawnPropMesh(copy);
  selectProp(copy.id);
  app.audio.playSuccess();
  showToast(`¡${copy.name} duplicado!`);
  triggerAutoSave();
}

function deleteProp(id: string): void {
  const idx = props.findIndex((item) => item.id === id);
  if (idx === -1) return;

  const mesh = propMeshMap.get(id);
  if (mesh) {
    app.scene.nativeScene.remove(mesh);
    propMeshMap.delete(id);
  }

  props.splice(idx, 1);
  if (selectedPropId === id) {
    selectedPropId = null;
    transformControls.detach();
    renderPropertiesEmpty();
  }
  showToast('Objeto eliminado');
  triggerAutoSave();
}

document.getElementById('btn-prop-duplicate')?.addEventListener('click', () => {
  if (selectedPropId) duplicateProp(selectedPropId);
});
document.getElementById('btn-prop-delete')?.addEventListener('click', () => {
  if (selectedPropId) deleteProp(selectedPropId);
});
document.getElementById('btn-quick-delete')?.addEventListener('click', () => {
  if (selectedPropId) deleteProp(selectedPropId);
});

// Viewport Raycast Selection
let pointerDownPos = { x: 0, y: 0 };
container.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

container.addEventListener('pointerup', (e) => {
  if (transformControls.dragging) return;
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dist > 6) return;

  if (activeNavMode === 'walk' || isFirstPerson) {
    handleWalkModeInteraction(e);
    return;
  }

  if (activeNavMode === 'fly') {
    container.requestPointerLock?.();
    return;
  }

  const hits = app.raycastPointer(e);
  if (hits.length > 0) {
    for (const hit of hits) {
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

  selectedPropId = null;
  transformControls.detach();
  renderPropertiesEmpty();
});

function handleWalkModeInteraction(e: MouseEvent | PointerEvent): void {
  const hits = app.raycastPointer(e);
  if (hits.length === 0) return;

  for (const hit of hits) {
    let curr: THREE.Object3D | null = hit.object;
    while (curr && curr !== app.scene.nativeScene) {
      if (curr.userData && curr.userData.propId) {
        const p = props.find((item) => item.id === curr.userData.propId);
        if (p) {
          if (p.subtype === 'frame_art' && p.imageUrl) {
            const lb = document.getElementById('lightbox-modal');
            const lbImg = document.getElementById('lightbox-img') as HTMLImageElement;
            if (lb && lbImg) {
              lbImg.src = p.imageUrl;
              lb.classList.add('active');
            }
            return;
          } else if (p.subtype === 'screen_video') {
            const vm = document.getElementById('video-modal');
            const vp = document.getElementById('video-player-container');
            const ytid = extractYouTubeId(p.videoUrl || '');
            if (vm && vp) {
              if (ytid) {
                vp.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${ytid}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope" allowfullscreen></iframe>`;
              } else {
                vp.innerHTML = `<video controls autoplay style="width: 100%; height: 100%; object-fit: contain;"><source src="${p.videoUrl}" type="video/mp4"></video>`;
              }
              vm.classList.add('active');
            }
            return;
          }
        }
      }
      curr = curr.parent;
    }
  }
}

function focusSelectedProp(): void {
  if (!selectedPropId) return;
  const mesh = propMeshMap.get(selectedPropId);
  if (!mesh) return;

  const box = new THREE.Box3().setFromObject(mesh);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const dist = Math.max(size.length() * 1.8, 3.5);

  app.resetCamera(
    [center.x + dist * 0.7, center.y + dist * 0.5, center.z + dist * 0.8],
    [center.x, center.y, center.z]
  );
  showToast(`🎯 Enfocado: ${mesh.name || 'Objeto'}`);
}

// Rooms List UI
function renderRoomsList(): void {
  const roomsListEl = document.getElementById('rooms-list') as HTMLElement;
  const roomsCountBadge = document.getElementById('rooms-count-badge') as HTMLElement;
  if (!roomsListEl) return;

  roomsListEl.innerHTML = '';
  if (roomsCountBadge) roomsCountBadge.textContent = rooms.length.toString();

  if (rooms.length === 0) {
    roomsListEl.innerHTML = `
      <div style="padding: 16px; border: 1px dashed var(--vxr-border); border-radius: 10px; text-align: center; color: var(--vxr-text-dim); font-size: 11.5px;">
        No hay salas creadas aún.<br>
        <span style="color: var(--vxr-cyan); font-weight: 700;">Haz clic en el botón de abajo para empezar.</span>
      </div>
    `;
    return;
  }

  for (const r of rooms) {
    const card = document.createElement('div');
    card.className = `room-card ${r.id === selectedRoomId ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="room-thumb">🏛️</div>
      <div class="room-meta">
        <div class="room-name">${r.name}</div>
        <div class="room-sub">${r.dimensions.width}m x ${r.dimensions.depth}m · Tema: ${r.theme}</div>
      </div>
      <button class="btn-room-del" title="Eliminar sala">🗑️</button>
    `;

    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.btn-room-del')) {
        deleteRoom(r.id);
        return;
      }
      selectRoom(r.id);
    });

    roomsListEl.appendChild(card);
  }
}

function selectRoom(roomId: string | null): void {
  selectedRoomId = roomId;
  renderRoomsList();
  if (roomId) {
    const r = rooms.find((item) => item.id === roomId);
    if (r) {
      app.resetCamera([r.center[0], 18, r.center[2] + 16], [r.center[0], 0, r.center[2]]);
    }
  }
}

function deleteRoom(roomId: string): void {
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx === -1) return;

  rooms.splice(idx, 1);
  connections = connections.filter((c) => c.fromRoomId !== roomId && c.toRoomId !== roomId);
  props = props.filter((p) => p.roomId !== roomId);

  if (selectedRoomId === roomId) {
    selectedRoomId = rooms.length > 0 ? rooms[0].id : null;
  }

  rebuildScenario();
  showToast('Sala eliminada del escenario');
  triggerAutoSave();
}

// Add Room Modal
const addRoomModal = document.getElementById('add-room-modal') as HTMLElement;
const btnAddRoomDialog = document.getElementById('btn-add-room-dialog') as HTMLButtonElement;
const btnCloseRoomModal = document.getElementById('btn-close-room-modal') as HTMLButtonElement;
const groupInitialRoom = document.getElementById('group-initial-room') as HTMLElement;
const groupConnectedRoom = document.getElementById('group-connected-room') as HTMLElement;
const btnCreateInitialRoom = document.getElementById('btn-create-initial-room') as HTMLButtonElement;

btnAddRoomDialog?.addEventListener('click', () => {
  if (rooms.length === 0) {
    groupInitialRoom.style.display = 'block';
    groupConnectedRoom.style.display = 'none';
  } else {
    groupInitialRoom.style.display = 'none';
    groupConnectedRoom.style.display = 'block';
  }
  addRoomModal.classList.add('active');
});

btnCloseRoomModal?.addEventListener('click', () => addRoomModal.classList.remove('active'));

btnCreateInitialRoom?.addEventListener('click', () => {
  const name = (document.getElementById('modal-room-name') as HTMLInputElement).value || 'Sala Central';
  const theme = (document.getElementById('modal-room-theme') as HTMLSelectElement).value as RoomTheme;
  const w = parseInt((document.getElementById('modal-room-w') as HTMLInputElement).value) || 12;
  const d = parseInt((document.getElementById('modal-room-d') as HTMLInputElement).value) || 10;

  const newRoom: RoomDef = {
    id: `room-${Date.now().toString(36)}`,
    name,
    theme,
    dimensions: { width: w, depth: d, height: 4 },
    center: [0, 0, 0],
    doors: [],
    spawnPoint: [0, 1.6, 0],
  };

  rooms.push(newRoom);
  selectedRoomId = newRoom.id;
  addRoomModal.classList.remove('active');
  rebuildScenario();
  app.resetCamera([0, 18, 16], [0, 0, 0]);
  showToast(`¡${newRoom.name} creada en el centro!`);
  triggerAutoSave();
});

document.querySelectorAll('.btn-dir-room').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dir = btn.getAttribute('data-dir') as WallDirection;
    const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : rooms[0];
    if (!activeRoom) return;

    const name = (document.getElementById('modal-room-name') as HTMLInputElement).value || 'Nueva Sala';
    const theme = (document.getElementById('modal-room-theme') as HTMLSelectElement).value as RoomTheme;
    const w = parseInt((document.getElementById('modal-room-w') as HTMLInputElement).value) || 12;
    const d = parseInt((document.getElementById('modal-room-d') as HTMLInputElement).value) || 10;

    let cx = activeRoom.center[0];
    let cz = activeRoom.center[2];
    const spacing = 4;

    if (dir === 'north') cz -= (activeRoom.dimensions.depth / 2 + d / 2 + spacing);
    else if (dir === 'south') cz += (activeRoom.dimensions.depth / 2 + d / 2 + spacing);
    else if (dir === 'east') cx += (activeRoom.dimensions.width / 2 + w / 2 + spacing);
    else if (dir === 'west') cx -= (activeRoom.dimensions.width / 2 + w / 2 + spacing);

    const newRoom: RoomDef = {
      id: `room-${Date.now().toString(36)}`,
      name,
      theme,
      dimensions: { width: w, depth: d, height: 4 },
      center: [cx, 0, cz],
      doors: [],
      spawnPoint: [cx, 1.6, cz],
    };

    rooms.push(newRoom);
    connections.push({
      id: `conn-${Date.now().toString(36)}`,
      fromRoomId: activeRoom.id,
      fromWall: dir,
      toRoomId: newRoom.id,
      toWall: dir === 'north' ? 'south' : dir === 'south' ? 'north' : dir === 'east' ? 'west' : 'east',
      width: 3.0,
      height: 3.0,
    });

    selectedRoomId = newRoom.id;
    addRoomModal.classList.remove('active');
    rebuildScenario();
    showToast(`¡${newRoom.name} conectada al ${dir}!`);
    triggerAutoSave();
  });
});

// First Person Walk Mode
const lblBtn3D = document.getElementById('lbl-btn-3d') as HTMLElement;
const btnTest3D = document.getElementById('btn-test-3d') as HTMLButtonElement;

function toggleFirstPersonMode(forceState?: boolean): void {
  const target = forceState !== undefined ? forceState : !isFirstPerson;
  if (isFirstPerson === target) return;
  isFirstPerson = target;
  app.audio.playWarp();

  if (isFirstPerson) {
    lblBtn3D.textContent = 'Modo Editor';
    btnTest3D.style.borderColor = '#38bdf8';
    btnTest3D.style.background = 'rgba(56, 189, 248, 0.2)';
    if (app.controls) app.controls.enabled = false;
    transformControls.detach();

    const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
    const spawnX = activeRoom ? activeRoom.center[0] : 0;
    const spawnZ = activeRoom ? activeRoom.center[2] : 2;
    playerPos.set(spawnX, 1.6, spawnZ);
    playerPitch = 0;
    playerYaw = 0;
    app.camera.position.copy(playerPos);
    container.requestPointerLock?.();
    showToast('🚶 ¡Modo Paseo Activo! Usa W,A,S,D para caminar');
  } else {
    lblBtn3D.textContent = 'Probar 3D';
    btnTest3D.style.borderColor = '';
    btnTest3D.style.background = '';
    if (document.exitPointerLock) document.exitPointerLock();
    if (app.controls) {
      app.controls.enabled = true;
      app.resetCamera([0, 22, 22], [0, 0, -4]);
    }
    if (selectedPropId && propMeshMap.has(selectedPropId)) {
      transformControls.attach(propMeshMap.get(selectedPropId)!);
    }
    showToast('🛸 Modo Editor / Vista Aérea');
  }
}

btnTest3D?.addEventListener('click', () => toggleFirstPersonMode());

// WebXR Immersive Session
document.getElementById('btn-test-vr')?.addEventListener('click', async () => {
  try {
    app.audio.playWarp();
    showToast('Iniciando sesión WebXR en Meta Quest...');
    await app.session.toggleVR();
  } catch (err: any) {
    showToast('WebXR no disponible o visor no detectado.');
  }
});

// Auto-Save in LocalStorage
function triggerAutoSave(): void {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    const data = { rooms, connections, props };
    localStorage.setItem('vxr_studio_autosave', JSON.stringify(data));
  }, 1000);
}

function restoreFromAutoSave(): boolean {
  try {
    const raw = localStorage.getItem('vxr_studio_autosave');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.rooms || !Array.isArray(data.rooms)) return false;

    // Purge legacy template
    if (data.rooms.length === 2 && data.rooms.some((r: any) => r.id === 'lobby')) {
      localStorage.removeItem('vxr_studio_autosave');
      return false;
    }

    rooms = data.rooms;
    connections = data.connections || [];
    props = data.props || [];
    selectedRoomId = rooms.length > 0 ? rooms[0].id : null;
    return true;
  } catch (err) {
    return false;
  }
}

// Export Modal
const exportModal = document.getElementById('export-modal') as HTMLElement;
const exportCodeDisplay = document.getElementById('export-code-display') as HTMLElement;
let activeExportTab: 'ts' | 'html' | 'json' = 'ts';

document.getElementById('btn-export')?.addEventListener('click', () => {
  exportModal.classList.add('active');
  updateExportCode();
});

document.getElementById('btn-close-export')?.addEventListener('click', () => {
  exportModal.classList.remove('active');
});

function updateExportCode(): void {
  if (activeExportTab === 'ts') {
    exportCodeDisplay.textContent = generateTSCode();
  } else if (activeExportTab === 'html') {
    exportCodeDisplay.textContent = generateHTMLCode();
  } else {
    exportCodeDisplay.textContent = JSON.stringify({ rooms, connections, props }, null, 2);
  }
}

document.querySelectorAll('[data-export-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-export-tab]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeExportTab = btn.getAttribute('data-export-tab') as any;
    updateExportCode();
  });
});

function generateTSCode(): string {
  return `import { XRApp } from '@vxr/core';\n\nconst app = new XRApp({ container: document.body, enableVR: true });\nconst scenario = app.createScenario('VXR Experience');\n\n${JSON.stringify({ rooms, props }, null, 2)}\n\nscenario.build();\napp.start();`;
}

function generateHTMLCode(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>VXR Experience</title></head><body><script src="https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.min.js"></script></body></html>`;
}

document.getElementById('btn-copy-code')?.addEventListener('click', () => {
  navigator.clipboard.writeText(exportCodeDisplay.textContent || '');
  showToast('✓ Código copiado al portapapeles');
});

document.getElementById('btn-download-file')?.addEventListener('click', () => {
  const content = exportCodeDisplay.textContent || '';
  const filename = activeExportTab === 'ts' ? 'experiencia-vxr.ts' : activeExportTab === 'html' ? 'experiencia.html' : 'escenario.json';
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  showToast(`¡Archivo "${filename}" descargado!`);
});

// Toast Helper
const toastEl = document.getElementById('toast') as HTMLElement;
const toastMsg = document.getElementById('toast-msg') as HTMLElement;
let toastTimeout: any;

function showToast(msg: string): void {
  if (!toastEl || !toastMsg) return;
  toastMsg.textContent = msg;
  toastEl.style.display = 'flex';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toastEl.style.display = 'none'; }, 2800);
}

// Welcome Modal Controller
const welcomeModal = document.getElementById('welcome-modal') as HTMLElement;
document.getElementById('btn-close-welcome')?.addEventListener('click', () => welcomeModal.classList.remove('active'));
document.getElementById('btn-welcome-blank')?.addEventListener('click', () => {
  welcomeModal.classList.remove('active');
  loadTemplate('empty');
});
document.getElementById('btn-welcome-learn')?.addEventListener('click', () => {
  welcomeModal.classList.remove('active');
  startTutorial();
});

document.getElementById('btn-menu-welcome')?.addEventListener('click', () => {
  dropdownMenu.classList.remove('show');
  welcomeModal.classList.add('active');
});

// 3-Dots Dropdown Menu
const btnMoreOptions = document.getElementById('btn-more-options') as HTMLButtonElement;
const dropdownMenu = document.getElementById('dropdown-menu') as HTMLElement;
btnMoreOptions?.addEventListener('click', () => dropdownMenu.classList.toggle('show'));

document.getElementById('btn-menu-empty')?.addEventListener('click', () => {
  dropdownMenu.classList.remove('show');
  loadTemplate('empty');
});

// Close modals when clicking backdrop
[addRoomModal, exportModal, welcomeModal].forEach((m) => {
  m?.addEventListener('click', (e) => {
    if (e.target === m) m.classList.remove('active');
  });
});

// Guided Interactive Tutorial
const tutorialCard = document.getElementById('tutorial-card') as HTMLElement;
const tutStepBadge = document.getElementById('tut-step-badge') as HTMLElement;
const tutProgressFill = document.getElementById('tut-progress-fill') as HTMLElement;
const tutHeadline = document.getElementById('tut-headline') as HTMLElement;
const tutDescription = document.getElementById('tut-description') as HTMLElement;
const btnTutPrev = document.getElementById('btn-tut-prev') as HTMLButtonElement;
const btnTutAuto = document.getElementById('btn-tut-auto') as HTMLButtonElement;
const btnTutNext = document.getElementById('btn-tut-next') as HTMLButtonElement;

let currentTutStep = 0;
const TUTORIAL_STEPS = [
  {
    title: 'Paso 1 de 6',
    headline: '1. Estructura y Espacio 3D',
    description: 'VXR Studio organiza las experiencias en salas 3D. Pulsa "＋ Añadir Sala al Nivel" para crear tu primera sala en el centro del escenario.',
    auto: () => {
      loadTemplate('museum');
    }
  },
  {
    title: 'Paso 2 de 6',
    headline: '2. Navegación de Cámara',
    description: 'Arrastra con clic izquierdo para orbitar, rueda para zoom y clic derecho para pan. Pulsa "Volar" para el modo creativo libre.',
    auto: () => {
      app.resetCamera([0, 18, 16], [0, 0, 0]);
    }
  },
  {
    title: 'Paso 3 de 6',
    headline: '3. Catálogo de Modelos',
    description: 'Inserta mobiliario, pedestales con vitrina o esculturas abstractas desde el panel izquierdo.',
    auto: () => {
      insertObjectFromCatalog({ category: 'furniture', subtype: 'chair', name: 'Silla Ergonómica' });
    }
  },
  {
    title: 'Paso 4 de 6',
    headline: '4. Materiales y Texturas PBR',
    description: 'En el dock derecho, abre la pestaña "Materiales" para aplicar mármol, madera o acabados metálicos.',
    auto: () => {
      setDockTab('mats');
    }
  },
  {
    title: 'Paso 5 de 6',
    headline: '5. Modo Creativo de Vuelo',
    description: 'Activa "🛸 Volar" para explorar tu entorno libremente con controles estilo Minecraft (W,A,S,D + Q/E).',
    auto: () => {
      setNavMode('fly');
    }
  },
  {
    title: 'Paso 6 de 6',
    headline: '6. Inmersión WebXR en Meta Quest',
    description: '¡Tu experiencia espacial está lista! Pulsa "Probar en VR" para abrirla de inmediato en tu visor.',
    auto: () => {
      showToast('🎉 ¡Tutorial completado con éxito!');
    }
  }
];

function renderTutStep(): void {
  const s = TUTORIAL_STEPS[currentTutStep];
  tutStepBadge.textContent = s.title;
  tutProgressFill.style.width = `${((currentTutStep + 1) / TUTORIAL_STEPS.length) * 100}%`;
  tutHeadline.textContent = s.headline;
  tutDescription.textContent = s.description;
  btnTutPrev.disabled = currentTutStep === 0;
}

function startTutorial(): void {
  currentTutStep = 0;
  tutorialCard.style.display = 'block';
  renderTutStep();
}

btnTutPrev?.addEventListener('click', () => {
  if (currentTutStep > 0) {
    currentTutStep--;
    renderTutStep();
  }
});
btnTutNext?.addEventListener('click', () => {
  if (currentTutStep < TUTORIAL_STEPS.length - 1) {
    currentTutStep++;
    renderTutStep();
  } else {
    tutorialCard.style.display = 'none';
    showToast('🎉 ¡Felicitaciones! Has completado el tutorial de VXR Studio.');
  }
});
btnTutAuto?.addEventListener('click', () => {
  TUTORIAL_STEPS[currentTutStep].auto();
  if (currentTutStep < TUTORIAL_STEPS.length - 1) {
    currentTutStep++;
    renderTutStep();
  }
});
document.getElementById('btn-tut-close')?.addEventListener('click', () => tutorialCard.style.display = 'none');
document.getElementById('btn-top-tutorial')?.addEventListener('click', startTutorial);

// =============================================================================
// App Update Loop
// =============================================================================
let billboardTimer = 0;
let fpsCounter = 0;
let fpsTimer = 0;

app.onUpdate((delta) => {
  billboardTimer += delta;
  fpsTimer += delta;
  fpsCounter++;

  if (fpsTimer >= 1.0) {
    const fpsEl = document.getElementById('stat-fps');
    if (fpsEl) fpsEl.textContent = fpsCounter.toString();
    fpsCounter = 0;
    fpsTimer = 0;
  }

  // Floating billboard floating animation
  for (const p of props) {
    if (p.subtype === 'billboard_floating') {
      const mesh = propMeshMap.get(p.id);
      if (mesh) {
        mesh.position.y = p.relY + Math.sin(billboardTimer * 2.0 + (p.relX + p.relZ)) * 0.05;
      }
    }
  }

  // Update Fly Mode (Minecraft Creative)
  if (activeNavMode === 'fly') {
    updateFlyControls(delta);
  }

  // Update Walk Mode (FPS)
  if (isFirstPerson) {
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerYaw);

    const inputDir = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp']) inputDir.add(forward);
    if (keys['KeyS'] || keys['ArrowDown']) inputDir.sub(forward);
    if (keys['KeyD'] || keys['ArrowRight']) inputDir.add(right);
    if (keys['KeyA'] || keys['ArrowLeft']) inputDir.sub(right);

    if (inputDir.lengthSq() > 0.001) {
      inputDir.normalize().multiplyScalar(4.5 * delta);
      playerPos.add(inputDir);
      app.camera.position.copy(playerPos);
    }
  }

  // Update Orientation Gizmo & Minimap
  drawOrientationGizmo();
  drawMinimap();
});

// =============================================================================
// App Startup
// =============================================================================
restoreFromAutoSave();
rebuildScenario();
app.start();

// Show welcome dialog on first visit
const dismissed = localStorage.getItem('vxr_studio_welcome_dismissed');
if (!dismissed && welcomeModal) {
  welcomeModal.classList.add('active');
}
