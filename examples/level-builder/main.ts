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
// Default Scenario Templates (Empty by default for a clean creative canvas)
// =============================================================================
const DEFAULT_ROOMS: RoomDef[] = [];
const DEFAULT_CONNECTIONS: ConnectionDef[] = [];
const DEFAULT_PROPS: StudioPropDef[] = [];

// =============================================================================
// Application State
// =============================================================================
let rooms: RoomDef[] = [];
let connections: ConnectionDef[] = [];
let props: StudioPropDef[] = [];

let selectedRoomId: string | null = null;
let selectedPropId: string | null = null;
let activeTool: 'select' | 'translate' | 'rotate' | 'scale' = 'select';
let activeCategory: StudioPropCategory = 'basic';
let isFirstPerson = false;
let autoSaveTimer: any = null;

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
const gridFloor = new THREE.GridHelper(60, 60, 0x1e293b, 0x0f172a);
gridFloor.position.y = -0.01;
app.scene.nativeScene.add(gridFloor);

// Configure Editor Camera & OrbitControls
if (app.controls) {
  app.controls.enableDamping = true;
  app.controls.dampingFactor = 0.08;
  app.controls.minDistance = 1.0;
  app.controls.maxDistance = 90.0;
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
  if (app.controls) {
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
// Procedural Mesh Factories (Básicos, Mobiliario, Arquitectura, Rótulos, Luces)
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
  } else {
    // Box
    geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// YouTube and Multimedia Helpers
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function createFurnitureMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const color = new THREE.Color(prop.color);
  const woodMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
  const fabricMat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });

  if (prop.subtype === 'chair_lounge') {
    // Deep Armchair
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), fabricMat);
    seat.position.y = 0.35;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.18), fabricMat);
    back.position.set(0, 0.65, -0.32);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.8), fabricMat);
    armL.position.set(-0.4, 0.45, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.8), fabricMat);
    armR.position.set(0.4, 0.45, 0);
    const legGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.25, 12);
    const leg1 = new THREE.Mesh(legGeo, darkMetal); leg1.position.set(-0.35, 0.125, -0.35);
    const leg2 = new THREE.Mesh(legGeo, darkMetal); leg2.position.set(0.35, 0.125, -0.35);
    const leg3 = new THREE.Mesh(legGeo, darkMetal); leg3.position.set(-0.35, 0.125, 0.35);
    const leg4 = new THREE.Mesh(legGeo, darkMetal); leg4.position.set(0.35, 0.125, 0.35);
    group.add(seat, back, armL, armR, leg1, leg2, leg3, leg4);
  } else if (prop.subtype === 'chair_executive') {
    // Swivel Office Chair
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.6), darkMetal);
    seat.position.y = 0.5;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.08), darkMetal);
    back.position.set(0, 0.85, -0.26);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 16), chromeMat);
    post.position.set(0, 0.25, 0);
    const starBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 5), chromeMat);
    starBase.position.set(0, 0.04, 0);
    group.add(seat, back, post, starBase);
  } else if (prop.subtype === 'bench') {
    // Gallery Museum Bench
    const plankMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.6), plankMat);
    seat.position.y = 0.44;
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.55), darkMetal);
    legL.position.set(-0.85, 0.22, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.55), darkMetal);
    legR.position.set(0.85, 0.22, 0);
    group.add(seat, legL, legR);
  } else if (prop.subtype === 'table_round') {
    // Round Pedestal Table
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.06, 32), woodMat);
    top.position.y = 0.74;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.72, 16), darkMetal);
    stem.position.y = 0.37;
    const discBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 32), darkMetal);
    discBase.position.y = 0.02;
    group.add(top, stem, discBase);
  } else if (prop.subtype === 'table_coffee') {
    // Low Coffee Table
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.8), woodMat);
    top.position.y = 0.42;
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.42, 12);
    const l1 = new THREE.Mesh(legGeo, darkMetal); l1.position.set(-0.6, 0.21, -0.3);
    const l2 = new THREE.Mesh(legGeo, darkMetal); l2.position.set(0.6, 0.21, -0.3);
    const l3 = new THREE.Mesh(legGeo, darkMetal); l3.position.set(-0.6, 0.21, 0.3);
    const l4 = new THREE.Mesh(legGeo, darkMetal); l4.position.set(0.6, 0.21, 0.3);
    group.add(top, l1, l2, l3, l4);
  } else if (prop.subtype === 'sofa') {
    // Lounge Sofa
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 0.85), fabricMat);
    base.position.y = 0.25;
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.25), fabricMat);
    back.position.set(0, 0.6, -0.3);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.85), fabricMat);
    armL.position.set(-0.95, 0.45, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.85), fabricMat);
    armR.position.set(0.95, 0.45, 0);
    group.add(base, back, armL, armR);
  } else if (prop.subtype === 'shelf') {
    // Bookshelf
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const sideGeo = new THREE.BoxGeometry(0.06, 1.8, 0.4);
    const sideL = new THREE.Mesh(sideGeo, darkMetal); sideL.position.set(-0.6, 0.9, 0);
    const sideR = new THREE.Mesh(sideGeo, darkMetal); sideR.position.set(0.6, 0.9, 0);
    for (let i = 0; i < 4; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.4), shelfMat);
      plank.position.set(0, 0.2 + i * 0.45, 0);
      group.add(plank);
    }
    group.add(sideL, sideR);
  } else if (prop.subtype === 'chair') {
    // Visitor Chair
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.6), woodMat);
    seat.position.y = 0.45;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.08), woodMat);
    back.position.set(0, 0.72, -0.26);
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 12);
    const leg1 = new THREE.Mesh(legGeo, darkMetal); leg1.position.set(-0.25, 0.225, -0.25);
    const leg2 = new THREE.Mesh(legGeo, darkMetal); leg2.position.set(0.25, 0.225, -0.25);
    const leg3 = new THREE.Mesh(legGeo, darkMetal); leg3.position.set(-0.25, 0.225, 0.25);
    const leg4 = new THREE.Mesh(legGeo, darkMetal); leg4.position.set(0.25, 0.225, 0.25);
    group.add(seat, back, leg1, leg2, leg3, leg4);
  } else {
    // Standard Meeting Table
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.0), woodMat);
    top.position.y = 0.74;
    const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.74, 12);
    const leg1 = new THREE.Mesh(legGeo, darkMetal); leg1.position.set(-0.8, 0.37, -0.4);
    const leg2 = new THREE.Mesh(legGeo, darkMetal); leg2.position.set(0.8, 0.37, -0.4);
    const leg3 = new THREE.Mesh(legGeo, darkMetal); leg3.position.set(-0.8, 0.37, 0.4);
    const leg4 = new THREE.Mesh(legGeo, darkMetal); leg4.position.set(0.8, 0.37, 0.4);
    group.add(top, leg1, leg2, leg3, leg4);
  }

  group.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return group;
}

function createFrameArtCanvas(title: string, colorHex: string, subtitle?: string): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  ctx.font = '700 28px "JetBrains Mono", monospace';
  ctx.fillStyle = colorHex;
  ctx.textAlign = 'center';
  ctx.fillText('• COLECCIÓN DE ARTE VXR •', canvas.width / 2, 120);

  ctx.font = '800 52px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title.toUpperCase(), canvas.width / 2, 360);

  ctx.font = '500 28px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(subtitle || 'Haz clic en Modo 3D para ampliar en alta resolución', canvas.width / 2, 440);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { canvas, texture };
}

function createFrameArtMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const width = prop.frameWidth || 2.2;
  const height = prop.frameHeight || 1.6;
  const frameColor = new THREE.Color(prop.color || '#d4af37');

  // Outer frame border
  const borderMat = new THREE.MeshStandardMaterial({
    color: frameColor,
    roughness: 0.35,
    metalness: 0.6,
  });
  const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.08), borderMat);
  group.add(outerFrame);

  // Inner Matting (passe-partout)
  const matting = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.2, height - 0.2, 0.085),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })
  );
  group.add(matting);

  // Picture Canvas Plane
  const artMat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.1 });
  const artPlane = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.38, height - 0.38), artMat);
  artPlane.position.z = 0.046;
  group.add(artPlane);

  if (prop.imageUrl) {
    const loader = new THREE.TextureLoader();
    loader.load(
      prop.imageUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        artMat.map = tex;
        artMat.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback placeholder on error or CORS issue
        const { texture } = createFrameArtCanvas(prop.name, prop.color, '⚠️ Error de carga / CORS en la URL');
        artMat.map = texture;
        artMat.needsUpdate = true;
      }
    );
  } else {
    const { texture } = createFrameArtCanvas(prop.name, prop.color, 'Configura la URL de imagen en Propiedades');
    artMat.map = texture;
    artMat.needsUpdate = true;
  }

  group.userData = { propId: prop.id, isInteractive: true, interactionType: 'frame_art' };
  return group;
}

function createVideoScreenCanvas(title: string, colorHex: string, ytid: string | null): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  function drawDefaultScreen() {
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = '#090d1a';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Big play circle
    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.arc(cx, cy - 30, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 50);
    ctx.lineTo(cx + 25, cy - 30);
    ctx.lineTo(cx - 15, cy - 10);
    ctx.closePath();
    ctx.fill();

    ctx.font = '800 42px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), cx, cy + 90);

    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('• PANTALLA MULTIMEDIA INTERACTIVA •', cx, cy + 140);
    texture.needsUpdate = true;
  }

  if (ytid) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // YouTube red play button in center
      const btnW = 140;
      const btnH = 96;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.roundRect(cx - btnW / 2, cy - btnH / 2, btnW, btnH, 24);
      ctx.fill();

      // White play triangle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 25);
      ctx.lineTo(cx + 28, cy);
      ctx.lineTo(cx - 18, cy + 25);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
      ctx.font = '700 28px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`▶ ${title.toUpperCase()}`, 30, canvas.height - 30);
      texture.needsUpdate = true;
    };
    img.onerror = () => {
      drawDefaultScreen();
    };
    img.src = `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`;
  } else {
    drawDefaultScreen();
  }

  return { canvas, texture };
}

function createVideoScreenMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const width = 2.6;
  const height = 1.5;

  // TV Outer Casing
  const caseMat = new THREE.MeshStandardMaterial({ color: 0x070a12, roughness: 0.4, metalness: 0.8 });
  const casing = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.08), caseMat);
  group.add(casing);

  // Stand
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 16), caseMat);
  pole.position.set(0, -height / 2 - 0.7, 0);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.5), caseMat);
  base.position.set(0, -height / 2 - 1.4, 0);
  group.add(pole, base);

  // Screen Plane
  const ytid = extractYouTubeId(prop.videoUrl || '');
  const { texture } = createVideoScreenCanvas(prop.name, prop.color || '#38bdf8', ytid);
  const screenMat = new THREE.MeshBasicMaterial({ map: texture });
  const screenPlane = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.12, height - 0.1), screenMat);
  screenPlane.position.z = 0.045;
  group.add(screenPlane);

  group.userData = { propId: prop.id, isInteractive: true, interactionType: 'screen_video' };
  return group;
}

function createBillboardFloatingCanvas(title: string, colorHex: string, linkUrl?: string): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#060a16';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

  ctx.shadowBlur = 0;
  ctx.fillStyle = colorHex;
  ctx.fillRect(canvas.width / 2 - 160, 40, 320, 38);
  ctx.font = '800 18px "JetBrains Mono", monospace';
  ctx.fillStyle = '#020617';
  ctx.textAlign = 'center';
  ctx.fillText('ANUNCIO INTERACTIVO', canvas.width / 2, 65);

  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 12;
  ctx.font = '800 48px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText((title || 'CARTELERA VXR').toUpperCase(), canvas.width / 2, 210);

  ctx.shadowBlur = 0;
  ctx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#38bdf8';
  if (linkUrl) {
    ctx.fillText(`🔗 ${linkUrl}`, canvas.width / 2, 330);
    ctx.font = '500 18px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('• HAZ CLIC PARA ABRIR EL ENLACE •', canvas.width / 2, 420);
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('• ESPACIO PUBLICITARIO DISPONIBLE •', canvas.width / 2, 330);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { canvas, texture };
}

function createBillboardFloatingMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const width = 2.8;
  const height = 1.3;
  const color = new THREE.Color(prop.color || '#38bdf8');

  // Glowing Frame Border
  const borderMat = new THREE.MeshBasicMaterial({ color });
  const frameBorder = new THREE.Mesh(new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.04), borderMat);
  group.add(frameBorder);

  // Front panel
  const { texture } = createBillboardFloatingCanvas(prop.text || prop.name, prop.color, prop.linkUrl);
  const panelMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), panelMat);
  panel.position.z = 0.025;
  group.add(panel);

  // Back panel
  const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), panelMat);
  backPanel.position.z = -0.025;
  backPanel.rotation.y = Math.PI;
  group.add(backPanel);

  // Suspension cables
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  const cableL = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 8), cableMat);
  cableL.position.set(-width / 3, height / 2 + 0.6, 0);
  const cableR = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 8), cableMat);
  cableR.position.set(width / 3, height / 2 + 0.6, 0);
  group.add(cableL, cableR);

  group.userData = {
    propId: prop.id,
    isInteractive: true,
    interactionType: 'billboard_floating',
    baseY: prop.relY,
  };
  return group;
}

function createArchitectureMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const color = new THREE.Color(prop.color);
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });

  if (prop.subtype === 'column') {
    // Fluted Column
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), stoneMat); base.position.y = 0.1;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.4, 0.65), stoneMat); shaft.position.y = 1.9;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), stoneMat); cap.position.y = 3.7;
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.05, 0.82), new THREE.MeshBasicMaterial({ color }));
    trim.position.y = 3.6;
    group.add(base, shaft, cap, trim);
  } else if (prop.subtype === 'partition_wood') {
    // Acoustic Wood Slats
    const backer = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.03), darkMetal);
    backer.position.y = 1.1;
    group.add(backer);
    const slatMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
    for (let i = 0; i < 11; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.1, 0.04), slatMat);
      slat.position.set(-1.2 + i * 0.24, 1.1, 0.02);
      group.add(slat);
    }
  } else if (prop.subtype === 'partition_neon') {
    // Cyberpunk Neon Wall
    const darkPane = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.04), darkMetal);
    darkPane.position.y = 1.1;
    const neonMat = new THREE.MeshBasicMaterial({ color });
    const rod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.6, 16), neonMat);
    rod1.rotation.z = Math.PI / 2; rod1.position.set(0, 1.8, 0.03);
    const rod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.6, 16), neonMat);
    rod2.rotation.z = Math.PI / 2; rod2.position.set(0, 1.1, 0.03);
    const rod3 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.6, 16), neonMat);
    rod3.rotation.z = Math.PI / 2; rod3.position.set(0, 0.4, 0.03);
    group.add(darkPane, rod1, rod2, rod3);
  } else {
    // Glass Partition
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.08,
      metalness: 0.85,
      transparent: true,
      opacity: 0.32,
    });
    const pane = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.1, 0.02), glassMat);
    pane.position.y = 1.1;
    const postGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 16);
    const postL = new THREE.Mesh(postGeo, darkMetal); postL.position.set(-1.4, 1.1, 0);
    const postR = new THREE.Mesh(postGeo, darkMetal); postR.position.set(1.4, 1.1, 0);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.06, 0.025), new THREE.MeshBasicMaterial({ color }));
    stripe.position.set(0, 1.1, 0);
    group.add(pane, postL, postR, stripe);
  }

  return group;
}

function createSignCanvas(text: string, colorHex: string): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#060a14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.textAlign = 'center';
  ctx.fillText('• VXR STUDIO DISPLAY •', canvas.width / 2, 55);

  ctx.shadowColor = colorHex;
  ctx.shadowBlur = 18;
  ctx.font = '800 48px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText((text || 'RÓTULO 3D').toUpperCase(), canvas.width / 2, 140);

  ctx.shadowBlur = 0;
  ctx.fillStyle = colorHex;
  ctx.fillRect(canvas.width / 2 - 120, 190, 240, 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return { canvas, texture };
}

function createDecorationMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const color = new THREE.Color(prop.color);

  if (prop.subtype === 'light_spot') {
    // Spotlight
    const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0x020617 }));
    fixture.position.y = 3.5;
    const spot = new THREE.SpotLight(color, prop.intensity || 2.8, 16, Math.PI / 4, 0.5, 1.2);
    spot.position.y = 3.4;
    spot.target.position.set(0, 0, 0);
    group.add(fixture, spot, spot.target);
  } else if (prop.subtype === 'light_point') {
    // Point light beacon
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 2), new THREE.MeshBasicMaterial({ color }));
    orb.position.y = 1.4;
    const point = new THREE.PointLight(color, prop.intensity || 2.4, 12, 1.8);
    point.position.y = 1.4;
    group.add(orb, point);
  } else if (prop.subtype === 'totem') {
    // Upright totem
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.5), new THREE.MeshStandardMaterial({ color: 0x020617 }));
    base.position.y = 0.04;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.2, 0.14), new THREE.MeshStandardMaterial({ color: 0x0b1120 }));
    body.position.y = 1.14;

    const signData = createSignCanvas(prop.text || prop.name, prop.color);
    propCanvasMap.set(prop.id, signData);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 1.2), new THREE.MeshBasicMaterial({ map: signData.texture }));
    screen.position.set(0, 1.4, 0.072);

    group.add(base, body, screen);
  } else {
    // Neon hanging or plaque sign
    const signData = createSignCanvas(prop.text || prop.name, prop.color);
    propCanvasMap.set(prop.id, signData);
    const signMat = new THREE.MeshBasicMaterial({ map: signData.texture });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.04), signMat);
    panel.position.y = 0;
    group.add(panel);
  }

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
  if (prop.category === 'basic') {
    mesh = createBasicMesh(prop);
  } else if (prop.category === 'furniture') {
    mesh = createFurnitureMesh(prop);
  } else if (prop.category === 'exhibition') {
    if (prop.subtype === 'frame_art') {
      mesh = createFrameArtMesh(prop);
    } else if (prop.subtype === 'screen_video') {
      mesh = createVideoScreenMesh(prop);
    } else if (prop.subtype === 'billboard_floating') {
      mesh = createBillboardFloatingMesh(prop);
    } else {
      mesh = createDecorationMesh(prop);
    }
  } else if (prop.category === 'architecture') {
    mesh = createArchitectureMesh(prop);
  } else if (prop.category === 'decoration') {
    mesh = createDecorationMesh(prop);
  } else {
    // Fallback or GLB placeholder
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
// Scenario Rebuilder (Structural Changes Only)
// =============================================================================
function rebuildScenario(): void {
  // Clear existing props meshes
  for (const [, mesh] of propMeshMap) {
    app.scene.nativeScene.remove(mesh);
  }
  propMeshMap.clear();
  propCanvasMap.clear();

  // Clear previous scenario
  if (scenario) {
    app.scene.nativeScene.remove(scenario.nativeGroup);
    scenario.dispose();
  }
  scenario = app.createScenario('VXR Studio Level');

  // Add Rooms
  for (const r of rooms) {
    scenario.addRoom({
      id: r.id,
      name: r.name,
      theme: r.theme,
      center: r.center,
      dimensions: r.dimensions,
      doors: r.doors,
      spawnPoint: r.spawnPoint || [r.center[0], 1.6, r.center[2]],
    });
  }

  // Connect Corridors
  for (const c of connections) {
    scenario.connectRooms(c.fromRoomId, c.fromWall, c.toRoomId, c.toWall, {
      width: c.width,
      height: c.height,
    });
  }

  // Spawn all props
  for (const p of props) {
    spawnPropMesh(p);
  }

  // Restore selection if valid
  if (selectedPropId && propMeshMap.has(selectedPropId)) {
    const mesh = propMeshMap.get(selectedPropId)!;
    if (activeTool !== 'select') {
      transformControls.attach(mesh);
    }
  } else {
    selectedPropId = null;
    transformControls.detach();
    renderPropertiesEmpty();
  }

  renderRoomsList();
  triggerAutoSave();
}

// =============================================================================
// Selection & Property Panel (Right Panel Two-Way Binding)
// =============================================================================
// Property inspector DOM elements
const propSelectedContainer = document.getElementById('prop-selected-container') as HTMLElement;
const propEmptyContainer = document.getElementById('prop-empty-container') as HTMLElement;
const propThumb = document.getElementById('prop-thumb') as HTMLElement;
const propTitle = document.getElementById('prop-title') as HTMLElement;
const propTypeTag = document.getElementById('prop-type-tag') as HTMLElement;

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
const propNameInput = document.getElementById('prop-name-input') as HTMLInputElement;

const groupSignText = document.getElementById('group-sign-text') as HTMLElement;
const propSignText = document.getElementById('prop-sign-text') as HTMLInputElement;
const groupLightIntensity = document.getElementById('group-light-intensity') as HTMLElement;
const propLightIntensity = document.getElementById('prop-light-intensity') as HTMLInputElement;

// Exhibition & Multimedia DOM Elements
const groupExhibitionOptions = document.getElementById('group-exhibition-options') as HTMLElement;
const subgroupFrameOptions = document.getElementById('subgroup-frame-options') as HTMLElement;
const subgroupVideoOptions = document.getElementById('subgroup-video-options') as HTMLElement;
const subgroupBillboardOptions = document.getElementById('subgroup-billboard-options') as HTMLElement;

const propImageUrl = document.getElementById('prop-image-url') as HTMLInputElement;
const btnUploadArtImg = document.getElementById('btn-upload-art-img') as HTMLButtonElement;
const btnPreviewArtImg = document.getElementById('btn-preview-art-img') as HTMLButtonElement;
const propFrameW = document.getElementById('prop-frame-w') as HTMLInputElement;
const propFrameH = document.getElementById('prop-frame-h') as HTMLInputElement;

const propVideoUrl = document.getElementById('prop-video-url') as HTMLInputElement;
const badgeVideoStatus = document.getElementById('badge-video-status') as HTMLElement;
const btnTestVideoPlay = document.getElementById('btn-test-video-play') as HTMLButtonElement;

const propBillboardText = document.getElementById('prop-billboard-text') as HTMLInputElement;
const propLinkUrl = document.getElementById('prop-link-url') as HTMLInputElement;
const btnTestLinkOpen = document.getElementById('btn-test-link-open') as HTMLButtonElement;
const fileUploadArt = document.getElementById('file-upload-art') as HTMLInputElement;

// Lightbox & Video Player Modals
const lightboxModal = document.getElementById('lightbox-modal') as HTMLElement;
const lightboxTitle = document.getElementById('lightbox-title') as HTMLElement;
const lightboxImg = document.getElementById('lightbox-img') as HTMLImageElement;
const lightboxCaption = document.getElementById('lightbox-caption') as HTMLElement;
const btnCloseLightbox = document.getElementById('btn-close-lightbox') as HTMLButtonElement;

const videoModal = document.getElementById('video-modal') as HTMLElement;
const videoModalTitle = document.getElementById('video-modal-title') as HTMLElement;
const videoPlayerContainer = document.getElementById('video-player-container') as HTMLElement;
const videoModalDesc = document.getElementById('video-modal-desc') as HTMLElement;
const btnCloseVideo = document.getElementById('btn-close-video') as HTMLButtonElement;

function openLightboxModal(p: StudioPropDef): void {
  lightboxTitle.textContent = `🖼 ${p.name}`;
  lightboxImg.src = p.imageUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop';
  lightboxCaption.innerHTML = p.imageUrl
    ? `<b>${p.name}</b> • Obra en exhibición interactiva<br><span style="font-size: 10px; color: #64748b; word-break: break-all;">${p.imageUrl}</span>`
    : `<b>${p.name}</b> • Sin imagen asignada (Configura la URL en el panel de propiedades)`;
  lightboxModal.classList.add('active');
  app.audio.playSuccess();
}

function closeLightboxModal(): void {
  lightboxModal.classList.remove('active');
}

btnCloseLightbox?.addEventListener('click', closeLightboxModal);

function openVideoModal(p: StudioPropDef): void {
  videoModalTitle.textContent = `📺 ${p.name}`;
  const ytid = extractYouTubeId(p.videoUrl || '');

  if (ytid) {
    videoPlayerContainer.innerHTML = `
      <iframe 
        src="https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&rel=0&modestbranding=1" 
        style="width: 100%; height: 100%; border: none;" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
      </iframe>
    `;
    videoModalDesc.innerHTML = `<b>Reproduciendo desde YouTube:</b> ID <code>${ytid}</code> • Respeta las políticas de reproducción del navegador.`;
  } else if (p.videoUrl) {
    videoPlayerContainer.innerHTML = `
      <video src="${p.videoUrl}" controls autoplay playsinline style="width: 100%; height: 100%; object-fit: contain;"></video>
    `;
    videoModalDesc.innerHTML = `<b>Video directo compatible:</b> <code>${p.videoUrl}</code>`;
  } else {
    videoPlayerContainer.innerHTML = `
      <div style="color: #cbd5e1; text-align: center; padding: 40px; font-size: 13px;">
        <div style="font-size: 32px; margin-bottom: 8px;">📺</div>
        <b>No se ha configurado ninguna URL de video</b><br>
        Introduce una URL de YouTube o enlace .mp4 en el panel derecho de propiedades.
      </div>
    `;
    videoModalDesc.innerHTML = `Sin URL configurada`;
  }

  videoModal.classList.add('active');
  app.audio.playSuccess();
}

function closeVideoModal(): void {
  videoPlayerContainer.innerHTML = '';
  videoModal.classList.remove('active');
}

btnCloseVideo?.addEventListener('click', closeVideoModal);

[lightboxModal, videoModal].forEach((m) => {
  m?.addEventListener('click', (e) => {
    if (e.target === m) {
      if (m === videoModal) closeVideoModal();
      else m.classList.remove('active');
    }
  });
});

function renderPropertiesEmpty(): void {
  propSelectedContainer.style.display = 'none';
  propEmptyContainer.style.display = 'block';
}

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

  // Attach TransformControls if in an active tool mode
  if (activeTool !== 'select') {
    transformControls.setMode(activeTool);
    transformControls.attach(mesh);
  } else {
    transformControls.detach();
  }

  // Thumb icon & metadata
  let icon = '📦';
  if (p.subtype === 'sphere') icon = '⚪';
  else if (p.subtype === 'cylinder') icon = '🛢️';
  else if (p.subtype === 'table' || p.subtype.includes('table')) icon = '🪑';
  else if (p.subtype === 'chair' || p.subtype.includes('chair')) icon = '💺';
  else if (p.subtype === 'sofa') icon = '🛋️';
  else if (p.subtype === 'bench') icon = '🪑';
  else if (p.subtype === 'frame_art') icon = '🖼️';
  else if (p.subtype === 'screen_video') icon = '📺';
  else if (p.subtype === 'billboard_floating') icon = '📢';
  else if (p.subtype === 'partition_glass') icon = '🪟';
  else if (p.subtype === 'column') icon = '🏛️';
  else if (p.category === 'model_glb') icon = '🗿';

  propThumb.textContent = icon;
  propTitle.textContent = p.name;
  propTypeTag.textContent = `Tipo: ${p.category.toUpperCase()} (${p.subtype})`;
  propNameInput.value = p.name;

  updatePropertyInputs(p);

  // Exhibition specific options
  if (p.category === 'exhibition') {
    groupExhibitionOptions.style.display = 'block';
    if (p.subtype === 'frame_art') {
      subgroupFrameOptions.style.display = 'flex';
      subgroupVideoOptions.style.display = 'none';
      subgroupBillboardOptions.style.display = 'none';
      propImageUrl.value = p.imageUrl || '';
      propFrameW.value = (p.frameWidth || 2.2).toString();
      propFrameH.value = (p.frameHeight || 1.6).toString();
    } else if (p.subtype === 'screen_video') {
      subgroupFrameOptions.style.display = 'none';
      subgroupVideoOptions.style.display = 'flex';
      subgroupBillboardOptions.style.display = 'none';
      propVideoUrl.value = p.videoUrl || '';
      const ytid = extractYouTubeId(p.videoUrl || '');
      badgeVideoStatus.textContent = ytid
        ? `✓ YouTube ID detectado: ${ytid}`
        : (p.videoUrl ? '✓ Archivo de video directo (.mp4)' : '📺 Introduce una URL de YouTube o video');
    } else if (p.subtype === 'billboard_floating') {
      subgroupFrameOptions.style.display = 'none';
      subgroupVideoOptions.style.display = 'none';
      subgroupBillboardOptions.style.display = 'flex';
      propBillboardText.value = p.text || p.name;
      propLinkUrl.value = p.linkUrl || '';
    } else {
      subgroupFrameOptions.style.display = 'none';
      subgroupVideoOptions.style.display = 'none';
      subgroupBillboardOptions.style.display = 'none';
    }
  } else {
    groupExhibitionOptions.style.display = 'none';
    subgroupFrameOptions.style.display = 'none';
    subgroupVideoOptions.style.display = 'none';
    subgroupBillboardOptions.style.display = 'none';
  }

  // Type-specific fields
  if (p.subtype.includes('sign') || p.subtype === 'totem' || p.subtype === 'billboard_floating') {
    groupSignText.style.display = 'block';
    propSignText.value = p.text || p.name;
  } else {
    groupSignText.style.display = 'none';
  }

  if (p.subtype.includes('light')) {
    groupLightIntensity.style.display = 'block';
    propLightIntensity.value = (p.intensity || 2.5).toString();
  } else {
    groupLightIntensity.style.display = 'none';
  }
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

// In-Place Mesh Mutation Handlers (No Rebuild Needed)
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

  // Directly mutate 3D mesh
  mesh.position.set(cx + p.relX, p.relY, cz + p.relZ);
  mesh.rotation.set(
    THREE.MathUtils.degToRad(p.rotX),
    THREE.MathUtils.degToRad(p.rotY),
    THREE.MathUtils.degToRad(p.rotZ)
  );
  mesh.scale.set(p.scaleX, p.scaleY, p.scaleZ);

  triggerAutoSave();
}

[propPosX, propPosY, propPosZ, propRotX, propRotY, propRotZ, propScaleX, propScaleY, propScaleZ].forEach((input) => {
  input.addEventListener('input', applyTransformInputs);
});

// Color inputs
function applyColorChange(hex: string): void {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  const mesh = propMeshMap.get(selectedPropId);
  if (!p || !mesh) return;

  p.color = hex;
  propColorSwatch.style.background = hex;
  propColorHex.value = hex;
  propColorPicker.value = hex;

  // In-place material update
  const newColor = new THREE.Color(hex);
  mesh.traverse((child) => {
    if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat.color) mat.color.copy(newColor);
    }
  });

  triggerAutoSave();
}

propColorHex.addEventListener('change', () => applyColorChange(propColorHex.value));
propColorPicker.addEventListener('input', () => applyColorChange(propColorPicker.value));

propNameInput.addEventListener('input', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (p) {
    p.name = propNameInput.value.trim() || 'Objeto';
    propTitle.textContent = p.name;
    triggerAutoSave();
  }
});

propSignText.addEventListener('input', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (p) {
    p.text = propSignText.value;
    const cached = propCanvasMap.get(p.id);
    if (cached) {
      const { canvas, texture } = cached;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.font = '800 48px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText((p.text || p.name).toUpperCase(), canvas.width / 2, 140);
      texture.needsUpdate = true;
    }
    triggerAutoSave();
  }
});

// Exhibition inputs: Frame Art, Video Screen, Billboard
propImageUrl.addEventListener('change', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.imageUrl = propImageUrl.value.trim();

  // Update mesh in place
  const mesh = propMeshMap.get(selectedPropId);
  if (mesh) {
    app.scene.nativeScene.remove(mesh);
    const newMesh = spawnPropMesh(p);
    if (activeTool !== 'select') transformControls.attach(newMesh);
  }
  showToast('✓ Imagen actualizada en el marco');
  triggerAutoSave();
});

btnUploadArtImg?.addEventListener('click', () => fileUploadArt.click());
fileUploadArt?.addEventListener('change', () => {
  const file = fileUploadArt.files?.[0];
  if (!file || !selectedPropId) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    const p = props.find((item) => item.id === selectedPropId);
    if (p) {
      p.imageUrl = dataUrl;
      propImageUrl.value = dataUrl;
      const mesh = propMeshMap.get(selectedPropId!);
      if (mesh) {
        app.scene.nativeScene.remove(mesh);
        const newMesh = spawnPropMesh(p);
        if (activeTool !== 'select') transformControls.attach(newMesh);
      }
      showToast('✓ Imagen local cargada en la obra');
      triggerAutoSave();
    }
  };
  reader.readAsDataURL(file);
});

btnPreviewArtImg?.addEventListener('click', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (p) openLightboxModal(p);
});

propFrameW.addEventListener('change', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.frameWidth = Math.max(0.6, parseFloat(propFrameW.value) || 2.2);
  const mesh = propMeshMap.get(selectedPropId);
  if (mesh) {
    app.scene.nativeScene.remove(mesh);
    const newMesh = spawnPropMesh(p);
    if (activeTool !== 'select') transformControls.attach(newMesh);
  }
  triggerAutoSave();
});

propFrameH.addEventListener('change', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.frameHeight = Math.max(0.6, parseFloat(propFrameH.value) || 1.6);
  const mesh = propMeshMap.get(selectedPropId);
  if (mesh) {
    app.scene.nativeScene.remove(mesh);
    const newMesh = spawnPropMesh(p);
    if (activeTool !== 'select') transformControls.attach(newMesh);
  }
  triggerAutoSave();
});

propVideoUrl.addEventListener('input', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.videoUrl = propVideoUrl.value.trim();
  const ytid = extractYouTubeId(p.videoUrl);
  badgeVideoStatus.textContent = ytid
    ? `✓ YouTube ID detectado: ${ytid}`
    : (p.videoUrl ? '✓ Archivo de video directo (.mp4)' : '📺 Introduce una URL de YouTube o video');
});

propVideoUrl.addEventListener('change', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  const mesh = propMeshMap.get(selectedPropId);
  if (mesh) {
    app.scene.nativeScene.remove(mesh);
    const newMesh = spawnPropMesh(p);
    if (activeTool !== 'select') transformControls.attach(newMesh);
  }
  showToast('✓ Pantalla de video actualizada');
  triggerAutoSave();
});

btnTestVideoPlay?.addEventListener('click', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (p) openVideoModal(p);
});

propBillboardText.addEventListener('input', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.text = propBillboardText.value;
  const mesh = propMeshMap.get(selectedPropId);
  if (mesh) {
    app.scene.nativeScene.remove(mesh);
    const newMesh = spawnPropMesh(p);
    if (activeTool !== 'select') transformControls.attach(newMesh);
  }
  triggerAutoSave();
});

propLinkUrl.addEventListener('change', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (!p) return;
  p.linkUrl = propLinkUrl.value.trim();
  const mesh = propMeshMap.get(selectedPropId);
  if (mesh) {
    app.scene.nativeScene.remove(mesh);
    const newMesh = spawnPropMesh(p);
    if (activeTool !== 'select') transformControls.attach(newMesh);
  }
  showToast('✓ Enlace del anuncio guardado');
  triggerAutoSave();
});

btnTestLinkOpen?.addEventListener('click', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  if (p && p.linkUrl) {
    window.open(p.linkUrl, '_blank');
    showToast(`🔗 Abriendo ${p.linkUrl}`);
  } else {
    showToast('⚠️ No se ha definido ningún enlace URL.');
  }
});

propLightIntensity.addEventListener('input', () => {
  if (!selectedPropId) return;
  const p = props.find((item) => item.id === selectedPropId);
  const mesh = propMeshMap.get(selectedPropId);
  if (p && mesh) {
    p.intensity = parseFloat(propLightIntensity.value) || 2.4;
    mesh.traverse((child) => {
      if ((child as THREE.Light).isLight) {
        (child as THREE.Light).intensity = p.intensity!;
      }
    });
    triggerAutoSave();
  }
});

// Duplicate & Delete Buttons in Properties Panel
function duplicateProp(id: string): void {
  const p = props.find((item) => item.id === id);
  if (!p) return;

  const clone: StudioPropDef = JSON.parse(JSON.stringify(p));
  clone.id = `prop-${Date.now().toString(36)}`;
  clone.name = `${p.name} (Copia)`;
  clone.relX += 1.2;

  props.push(clone);
  spawnPropMesh(clone);
  selectProp(clone.id);
  app.audio.playSuccess();
  showToast(`¡Objeto "${clone.name}" duplicado!`);
  triggerAutoSave();
}

function deleteProp(id: string): void {
  const p = props.find((item) => item.id === id);
  const mesh = propMeshMap.get(id);

  if (mesh) {
    app.scene.nativeScene.remove(mesh);
    propMeshMap.delete(id);
    propCanvasMap.delete(id);
  }

  props = props.filter((item) => item.id !== id);
  if (selectedPropId === id) {
    selectedPropId = null;
    transformControls.detach();
    renderPropertiesEmpty();
  }

  app.audio.playClick();
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

// Texture upload
const fileTextureInput = document.getElementById('file-upload-texture') as HTMLInputElement;
document.getElementById('btn-upload-tex')?.addEventListener('click', () => {
  fileTextureInput.click();
});

fileTextureInput.addEventListener('change', () => {
  const file = fileTextureInput.files?.[0];
  if (!file || !selectedPropId) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    const mesh = propMeshMap.get(selectedPropId!);
    if (mesh) {
      const loader = new THREE.TextureLoader();
      loader.load(dataUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mesh.traverse((c) => {
          if ((c as THREE.Mesh).isMesh && (c as THREE.Mesh).material) {
            ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).map = tex;
            ((c as THREE.Mesh).material as THREE.MeshStandardMaterial).needsUpdate = true;
          }
        });
        showToast('¡Textura aplicada al objeto!');
      });
    }
  };
  reader.readAsDataURL(file);
});

// =============================================================================
// Viewport Tools: Selection, Move, Rotate, Scale (Top Floating Toolbar)
// =============================================================================
const toolSelect = document.getElementById('tool-select') as HTMLButtonElement;
const toolTranslate = document.getElementById('tool-translate') as HTMLButtonElement;
const toolRotate = document.getElementById('tool-rotate') as HTMLButtonElement;
const toolScale = document.getElementById('tool-scale') as HTMLButtonElement;

function setToolMode(mode: 'select' | 'translate' | 'rotate' | 'scale'): void {
  activeTool = mode;
  [toolSelect, toolTranslate, toolRotate, toolScale].forEach((b) => b.classList.remove('active'));

  if (mode === 'select') {
    toolSelect.classList.add('active');
    transformControls.detach();
  } else {
    if (mode === 'translate') toolTranslate.classList.add('active');
    else if (mode === 'rotate') toolRotate.classList.add('active');
    else if (mode === 'scale') toolScale.classList.add('active');

    transformControls.setMode(mode);
    if (selectedPropId && propMeshMap.has(selectedPropId)) {
      transformControls.attach(propMeshMap.get(selectedPropId)!);
    }
  }
}

toolSelect.addEventListener('click', () => setToolMode('select'));
toolTranslate.addEventListener('click', () => setToolMode('translate'));
toolRotate.addEventListener('click', () => setToolMode('rotate'));
toolScale.addEventListener('click', () => setToolMode('scale'));

// Keyboard Shortcuts: Q, W, E, R, F, Delete, Ctrl+D
window.addEventListener('keydown', (e) => {
  if (['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())) return;

  // Duplication shortcut (Ctrl+D / Cmd+D)
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
    e.preventDefault();
    if (selectedPropId) duplicateProp(selectedPropId);
    return;
  }

  if (e.code === 'KeyQ') setToolMode('select');
  else if (e.code === 'KeyW') setToolMode('translate');
  else if (e.code === 'KeyE') setToolMode('rotate');
  else if (e.code === 'KeyR') setToolMode('scale');
  else if (e.code === 'KeyF') {
    focusSelectedProp();
  } else if (e.code === 'Delete' || e.code === 'Backspace') {
    if (selectedPropId) deleteProp(selectedPropId);
  } else if (e.code === 'Escape') {
    selectedPropId = null;
    transformControls.detach();
    renderPropertiesEmpty();
  }
});

// Viewport Click Raycast: Distinguish Between Click and Camera Orbit Drag
let pointerDownPos = { x: 0, y: 0 };
container.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

container.addEventListener('pointerup', (e) => {
  // If user dragged gizmo or moved camera (orbit/pan), ignore
  if (transformControls.dragging) return;
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dist > 6) return;

  // Walk Mode Interaction (Interactive Art Lightbox, Video Popup, Link opening)
  if (isFirstPerson) {
    handleWalkModeInteraction(e);
    return;
  }

  // Editor Mode Selection
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

  // Clicked empty background: deselect
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
          if (p.subtype === 'frame_art') {
            openLightboxModal(p);
            return;
          } else if (p.subtype === 'screen_video') {
            openVideoModal(p);
            return;
          } else if (p.subtype === 'billboard_floating') {
            if (p.linkUrl) {
              window.open(p.linkUrl, '_blank');
              showToast(`🔗 Abriendo enlace: ${p.linkUrl}`);
            } else {
              showToast(`📢 ${p.text || p.name}`);
            }
            app.audio.playClick();
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

// Bottom Camera Floating Bar
document.getElementById('btn-cam-home')?.addEventListener('click', () => {
  const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
  const cx = activeRoom ? activeRoom.center[0] : 0;
  const cz = activeRoom ? activeRoom.center[2] : 0;
  app.resetCamera([cx, 18, cz + 16], [cx, 0, cz]);
  app.audio.playClick();
  showToast(activeRoom ? '🏠 Vista general de la sala' : '🏠 Vista general del escenario');
});

document.getElementById('btn-cam-focus')?.addEventListener('click', () => {
  focusSelectedProp();
});

document.getElementById('btn-cam-snapshot')?.addEventListener('click', () => {
  const dataUrl = app.renderer.nativeRenderer.domElement.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `vxr-studio-snapshot-${Date.now()}.png`;
  a.click();
  showToast('¡Captura de pantalla guardada!');
});

// Perspective / Orthographic Camera Toggle
const btnProjPersp = document.getElementById('btn-proj-persp') as HTMLButtonElement;
const btnProjOrtho = document.getElementById('btn-proj-ortho') as HTMLButtonElement;

btnProjPersp?.addEventListener('click', () => {
  btnProjPersp.classList.add('active');
  btnProjOrtho.classList.remove('active');
  const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
  const cx = activeRoom ? activeRoom.center[0] : 0;
  const cz = activeRoom ? activeRoom.center[2] : 0;
  app.resetCamera([cx, 18, cz + 16], [cx, 0, cz]);
  showToast('👁️ Vista en Perspectiva 3D');
});

btnProjOrtho?.addEventListener('click', () => {
  btnProjOrtho.classList.add('active');
  btnProjPersp.classList.remove('active');
  // Position camera directly overhead for 2D top-down floor plan
  const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
  const cx = activeRoom ? activeRoom.center[0] : 0;
  const cz = activeRoom ? activeRoom.center[2] : 0;
  app.resetCamera([cx, 28, cz], [cx, 0, cz]);
  showToast('📐 Vista Cenital (Planta 2D)');
});

// =============================================================================
// Left Panel: Asset Library & Room Management
// =============================================================================
const assetGrid = document.getElementById('asset-grid') as HTMLElement;
const searchInput = document.getElementById('search-objects') as HTMLInputElement;

const ASSET_CATALOG: Array<{ category: StudioPropCategory; subtype: string; name: string; icon: string }> = [
  // Básicos
  { category: 'basic', subtype: 'box', name: 'Caja', icon: '📦' },
  { category: 'basic', subtype: 'sphere', name: 'Esfera', icon: '⚪' },
  { category: 'basic', subtype: 'cylinder', name: 'Cilindro', icon: '🛢️' },
  { category: 'basic', subtype: 'plane', name: 'Plano', icon: '⬜' },

  // Mobiliario & Zonas de Asientos
  { category: 'furniture', subtype: 'table', name: 'Mesa Rectangular', icon: '🪑' },
  { category: 'furniture', subtype: 'table_round', name: 'Mesa Redonda', icon: '⭕' },
  { category: 'furniture', subtype: 'table_coffee', name: 'Mesa de Centro', icon: '☕' },
  { category: 'furniture', subtype: 'chair', name: 'Silla de Sala', icon: '💺' },
  { category: 'furniture', subtype: 'chair_lounge', name: 'Sillón Lounge', icon: '🛋️' },
  { category: 'furniture', subtype: 'chair_executive', name: 'Silla Ejecutiva', icon: '💼' },
  { category: 'furniture', subtype: 'sofa', name: 'Sofá Modular', icon: '🛋️' },
  { category: 'furniture', subtype: 'bench', name: 'Banco de Galería', icon: '🪑' },
  { category: 'furniture', subtype: 'shelf', name: 'Estante', icon: '📚' },

  // Exposición & Multimedia
  { category: 'exhibition', subtype: 'frame_art', name: 'Marco de Imagen', icon: '🖼️' },
  { category: 'exhibition', subtype: 'screen_video', name: 'Pantalla de Video', icon: '📺' },
  { category: 'exhibition', subtype: 'billboard_floating', name: 'Anuncio Flotante', icon: '📢' },
  { category: 'exhibition', subtype: 'totem', name: 'Tótem Multimedia', icon: '🪧' },

  // Arquitectura
  { category: 'architecture', subtype: 'partition_glass', name: 'Mampara Cristal', icon: '🪟' },
  { category: 'architecture', subtype: 'partition_wood', name: 'Mampara Madera', icon: '🪵' },
  { category: 'architecture', subtype: 'partition_neon', name: 'Mampara Neón', icon: '⚡' },
  { category: 'architecture', subtype: 'column', name: 'Columna', icon: '🏛️' },

  // Decoración
  { category: 'decoration', subtype: 'sign_neon', name: 'Rótulo Neón', icon: '🏷️' },
  { category: 'decoration', subtype: 'sign_plaque', name: 'Placa Pared', icon: '📌' },
  { category: 'decoration', subtype: 'light_spot', name: 'Foco Spot', icon: '💡' },
  { category: 'decoration', subtype: 'light_point', name: 'Luz Neón', icon: '🏮' },
];

function renderAssetCatalog(): void {
  assetGrid.innerHTML = '';
  const query = (searchInput?.value || '').trim().toLowerCase();

  const filtered = ASSET_CATALOG.filter((item) => {
    const matchesCat = item.category === activeCategory;
    const matchesSearch = !query || item.name.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  for (const item of filtered) {
    const card = document.createElement('div');
    card.className = 'asset-card';
    card.title = `Añadir ${item.name} a la sala`;
    card.innerHTML = `
      <div class="asset-icon-box">${item.icon}</div>
      <span class="asset-label">${item.name}</span>
    `;

    card.addEventListener('click', () => {
      insertObjectFromCatalog(item);
    });

    assetGrid.appendChild(card);
  }
}

function insertObjectFromCatalog(item: { category: StudioPropCategory; subtype: string; name: string }): void {
  const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
  const roomId = activeRoom ? activeRoom.id : '';
  const roomName = activeRoom ? activeRoom.name : 'el lienzo';

  const offset = 1.2;
  const relX = parseFloat(((Math.random() - 0.5) * offset).toFixed(2));
  const relZ = parseFloat(((Math.random() - 0.5) * offset).toFixed(2));
  let relY = 0.6;
  let color = '#e0e0e0';
  let imageUrl: string | undefined = undefined;
  let videoUrl: string | undefined = undefined;
  let linkUrl: string | undefined = undefined;
  let frameWidth: number | undefined = undefined;
  let frameHeight: number | undefined = undefined;

  if (item.category === 'furniture') {
    relY = 0;
    color = item.subtype.includes('chair') ? '#1e293b' : '#78350f';
  } else if (item.category === 'exhibition') {
    if (item.subtype === 'frame_art') {
      relY = 1.8;
      color = '#d4af37';
      imageUrl = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop';
      frameWidth = 2.2;
      frameHeight = 1.6;
    } else if (item.subtype === 'screen_video') {
      relY = 1.6;
      color = '#0f172a';
      videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    } else if (item.subtype === 'billboard_floating') {
      relY = 2.4;
      color = '#38bdf8';
      linkUrl = 'https://github.com/Vickman123/Framework-XVR';
    }
  } else if (item.category === 'architecture') {
    relY = 0;
    color = '#38bdf8';
  } else if (item.category === 'decoration') {
    relY = 1.8;
    color = '#38bdf8';
  }

  const newProp: StudioPropDef = {
    id: `prop-${Date.now().toString(36)}`,
    roomId,
    category: item.category,
    subtype: item.subtype,
    name: `${item.name}_${props.length + 1}`,
    relX,
    relY,
    relZ,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    color,
    text: item.subtype === 'billboard_floating' ? 'EXPOSICIÓN XR 2026' : 'ZONA DE EXHIBICIÓN',
    intensity: 2.5,
    imageUrl,
    videoUrl,
    linkUrl,
    frameWidth,
    frameHeight,
  };

  props.push(newProp);
  spawnPropMesh(newProp);
  selectProp(newProp.id);
  app.audio.playSuccess();
  showToast(`¡${newProp.name} añadido a ${roomName}!`);
  triggerAutoSave();
}

// Category pill filters
document.querySelectorAll('.category-pill[data-category]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.category-pill[data-category]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.getAttribute('data-category') as StudioPropCategory;
    renderAssetCatalog();
  });
});

searchInput?.addEventListener('input', renderAssetCatalog);

// Modelos 3D Section: File Picker and Cards
const fileGlbInput = document.getElementById('file-import-glb') as HTMLInputElement;
const btnTriggerGlb = document.getElementById('btn-trigger-glb') as HTMLButtonElement;
const btnImportCard = document.getElementById('btn-import-card') as HTMLElement;

[btnTriggerGlb, btnImportCard].forEach((el) => {
  el?.addEventListener('click', () => fileGlbInput.click());
});

document.querySelectorAll('[data-preset-model]').forEach((card) => {
  card.addEventListener('click', () => {
    const model = card.getAttribute('data-preset-model');
    if (model === 'statue') {
      insertObjectFromCatalog({ category: 'architecture', subtype: 'column', name: 'Estatua / Pedestal' });
    } else if (model === 'laptop') {
      insertObjectFromCatalog({ category: 'furniture', subtype: 'table_coffee', name: 'Mesa de Trabajo' });
    } else if (model === 'panel') {
      insertObjectFromCatalog({ category: 'architecture', subtype: 'partition_glass', name: 'Panel Divisorio' });
    }
  });
});

fileGlbInput.addEventListener('change', async () => {
  const file = fileGlbInput.files?.[0];
  if (!file) return;

  try {
    showToast('Cargando modelo 3D...');
    const loaded = await app.assets.loadModel(file, { autoGround: true, autoCenter: true });
    const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
    const roomId = activeRoom ? activeRoom.id : '';
    const roomName = activeRoom ? activeRoom.name : 'el lienzo';
    const posX = activeRoom ? activeRoom.center[0] : 0;
    const posZ = activeRoom ? activeRoom.center[2] : 0;

    const newProp: StudioPropDef = {
      id: `prop-glb-${Date.now().toString(36)}`,
      roomId,
      category: 'model_glb',
      subtype: file.name,
      name: file.name.replace(/\.(glb|gltf)$/i, ''),
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

    loaded.group.userData = { propId: newProp.id };
    loaded.group.position.set(posX, 0, posZ);
    app.scene.nativeScene.add(loaded.group);

    props.push(newProp);
    propMeshMap.set(newProp.id, loaded.group);

    selectProp(newProp.id);
    app.audio.playSuccess();
    showToast(`¡Modelo "${newProp.name}" integrado a ${roomName}!`);
    triggerAutoSave();
  } catch (err: any) {
    console.error('Error cargando modelo GLB:', err);
    showToast('Error al procesar el archivo GLB.');
  }
});

// Rooms List Rendering
const roomsListEl = document.getElementById('rooms-list') as HTMLElement;
const roomsCountBadge = document.getElementById('rooms-count-badge') as HTMLElement;

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

function renderRoomsList(): void {
  roomsListEl.innerHTML = '';
  roomsCountBadge.textContent = rooms.length.toString();

  if (rooms.length === 0) {
    roomsListEl.innerHTML = `
      <div style="padding: 18px 10px; text-align: center; color: var(--vxr-text-dim); font-size: 11.5px; line-height: 1.5; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px dashed var(--vxr-border);">
        <span style="font-size: 22px; display: block; margin-bottom: 4px;">🏛️</span>
        <b style="color: #cbd5e1; display: block; margin-bottom: 4px;">Sin salas en el escenario</b>
        Pulsa <b>＋ Añadir Sala al Nivel</b> para crear la primera sala en el centro del espacio 3D.
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
        <div class="room-sub">${r.dimensions.width}m × ${r.dimensions.depth}m • Tema: ${r.theme}</div>
      </div>
      <button class="btn-room-del" title="Eliminar sala" data-del-room="${r.id}">🗑️</button>
    `;

    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('btn-room-del')) return;
      selectRoom(r.id);
      app.audio.playClick();
    });

    card.querySelector('[data-del-room]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      rooms = rooms.filter((item) => item.id !== r.id);
      connections = connections.filter((c) => c.fromRoomId !== r.id && c.toRoomId !== r.id);
      props = props.filter((p) => p.roomId !== r.id);
      selectedRoomId = rooms.length > 0 ? rooms[0].id : null;
      rebuildScenario();
      showToast('Sala eliminada');
    });

    roomsListEl.appendChild(card);
  }
}

// Add Room Modal & Handlers
const addRoomModal = document.getElementById('add-room-modal') as HTMLElement;
const btnAddRoomDialog = document.getElementById('btn-add-room-dialog') as HTMLButtonElement;
const btnCloseRoomModal = document.getElementById('btn-close-room-modal') as HTMLButtonElement;
const modalRoomName = document.getElementById('modal-room-name') as HTMLInputElement;
const modalRoomTheme = document.getElementById('modal-room-theme') as HTMLSelectElement;
const modalRoomW = document.getElementById('modal-room-w') as HTMLInputElement;
const modalRoomD = document.getElementById('modal-room-d') as HTMLInputElement;
const groupInitialRoom = document.getElementById('group-initial-room') as HTMLElement;
const groupConnectedRoom = document.getElementById('group-connected-room') as HTMLElement;
const btnCreateInitialRoom = document.getElementById('btn-create-initial-room') as HTMLButtonElement;

btnAddRoomDialog.addEventListener('click', () => {
  if (rooms.length === 0) {
    if (groupInitialRoom) groupInitialRoom.style.display = 'block';
    if (groupConnectedRoom) groupConnectedRoom.style.display = 'none';
  } else {
    if (groupInitialRoom) groupInitialRoom.style.display = 'none';
    if (groupConnectedRoom) groupConnectedRoom.style.display = 'block';
  }
  addRoomModal.classList.add('active');
});

btnCloseRoomModal.addEventListener('click', () => {
  addRoomModal.classList.remove('active');
});

btnCreateInitialRoom?.addEventListener('click', () => {
  createRoom();
});

function createRoom(dir?: WallDirection): void {
  const newId = `room-${Date.now().toString(36)}`;
  const newW = parseFloat(modalRoomW.value) || 12;
  const newD = parseFloat(modalRoomD.value) || 10;
  const newH = 3.8;
  const parentRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);

  if (!parentRoom || rooms.length === 0) {
    // Initial / Root room at center [0, 0, 0]
    const initialRoom: RoomDef = {
      id: newId,
      name: modalRoomName.value.trim() || 'Sala Principal',
      theme: modalRoomTheme.value as RoomTheme,
      dimensions: { width: newW, depth: newD, height: newH },
      center: [0, 0, 0],
      doors: [],
      spawnPoint: [0, 1.6, 0],
    };
    rooms.push(initialRoom);
    selectedRoomId = newId;
    addRoomModal.classList.remove('active');
    app.audio.playSuccess();
    rebuildScenario();
    app.resetCamera([0, 18, 16], [0, 0, 0]);
    showToast('¡Sala inicial creada en el centro del escenario!');
    return;
  }

  // Connect to parent room with corridor
  const effectiveDir = dir || 'north';
  let posX = parentRoom.center[0];
  let posZ = parentRoom.center[2];
  let fromWall: WallDirection = 'north';
  let toWall: WallDirection = 'south';

  const gap = 6.0;
  if (effectiveDir === 'north') {
    posZ -= (parentRoom.dimensions.depth / 2 + newD / 2 + gap);
    fromWall = 'north'; toWall = 'south';
  } else if (effectiveDir === 'south') {
    posZ += (parentRoom.dimensions.depth / 2 + newD / 2 + gap);
    fromWall = 'south'; toWall = 'north';
  } else if (effectiveDir === 'east') {
    posX += (parentRoom.dimensions.width / 2 + newW / 2 + gap);
    fromWall = 'east'; toWall = 'west';
  } else if (effectiveDir === 'west') {
    posX -= (parentRoom.dimensions.width / 2 + newW / 2 + gap);
    fromWall = 'west'; toWall = 'east';
  }

  if (!parentRoom.doors.some((d) => d.wall === fromWall)) {
    parentRoom.doors.push({ wall: fromWall, targetRoomId: newId, width: 2.6, height: 2.8 });
  }

  const newRoom: RoomDef = {
    id: newId,
    name: modalRoomName.value.trim() || `Sala ${rooms.length + 1}`,
    theme: modalRoomTheme.value as RoomTheme,
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
  addRoomModal.classList.remove('active');
  app.audio.playSuccess();
  rebuildScenario();
  showToast(`¡Sala añadida al ${effectiveDir.toUpperCase()} con pasillo automático!`);
}

document.querySelectorAll('.btn-dir-room').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dir = btn.getAttribute('data-dir') as WallDirection;
    createRoom(dir);
  });
});

// =============================================================================
// Top Bar: Probar 3D (Walk Mode) & Probar en VR (Meta Quest WebXR)
// =============================================================================
const btnTest3D = document.getElementById('btn-test-3d') as HTMLButtonElement;
const lblBtn3D = document.getElementById('lbl-btn-3d') as HTMLElement;
const playerPos = new THREE.Vector3(0, 1.6, 2);
const playerVelocity = new THREE.Vector3();
let playerPitch = 0;
let playerYaw = 0;
let stepTimer = 0;
let isPointerLocked = false;
const keys: Record<string, boolean> = {};

window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

document.addEventListener('pointerlockchange', () => {
  isPointerLocked = document.pointerLockElement === container;
});

document.addEventListener('mousemove', (e) => {
  if (!isFirstPerson || !isPointerLocked) return;
  playerYaw -= (e.movementX || 0) * 0.0024;
  playerPitch -= (e.movementY || 0) * 0.0024;
  playerPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, playerPitch));
});

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

btnTest3D.addEventListener('click', () => toggleFirstPersonMode());

// WebXR Immersive VR Session
document.getElementById('btn-test-vr')?.addEventListener('click', async () => {
  try {
    app.audio.playWarp();
    showToast('Iniciando sesión inmersiva WebXR en Meta Quest...');
    await app.session.toggleVR();
  } catch (err: any) {
    console.warn('VR mode error:', err);
    showToast('WebXR no disponible o visor no detectado.');
  }
});

// Update Loop for Walk Navigation & Continuous Collision
let billboardTimer = 0;
app.onUpdate((delta) => {
  billboardTimer += delta;
  for (const p of props) {
    if (p.subtype === 'billboard_floating') {
      const mesh = propMeshMap.get(p.id);
      if (mesh) {
        mesh.position.y = p.relY + Math.sin(billboardTimer * 2.0 + (p.relX + p.relZ)) * 0.04;
      }
    }
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

    const proposed = playerPos.clone();
    proposed.x += playerVelocity.x * delta;
    proposed.z += playerVelocity.z * delta;

    // Continuous collision through doorways without invisible walls
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
// Persistence & Auto-Save (localStorage)
// =============================================================================
function triggerAutoSave(): void {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    try {
      const data = {
        name: 'Proyecto VXR Studio',
        timestamp: Date.now(),
        rooms,
        connections,
        props,
      };
      localStorage.setItem('vxr_studio_autosave', JSON.stringify(data));
    } catch (e) {
      console.warn('Auto-save error:', e);
    }
  }, 400);
}

function restoreFromAutoSave(): boolean {
  try {
    const raw = localStorage.getItem('vxr_studio_autosave');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.rooms && Array.isArray(data.rooms)) {
      // If cached data was the legacy template with 'lobby' and 'archaeology', discard it
      const isLegacyDefault =
        data.rooms.length === 2 &&
        data.rooms.some((r: any) => r.id === 'lobby') &&
        data.rooms.some((r: any) => r.id === 'archaeology');

      if (isLegacyDefault) {
        localStorage.removeItem('vxr_studio_autosave');
        return false;
      }

      rooms = data.rooms;
      connections = data.connections || [];
      props = data.props || [];
      selectedRoomId = rooms.length > 0 ? rooms[0].id : null;
      return true;
    }
  } catch (e) {
    console.warn('Error restoring auto-save:', e);
  }
  return false;
}

// 3-Dots Menu Dropdown Actions
const btnMoreOptions = document.getElementById('btn-more-options') as HTMLButtonElement;
const dropdownMenu = document.getElementById('dropdown-menu') as HTMLElement;
btnMoreOptions.addEventListener('click', (e) => {
  e.stopPropagation();
  dropdownMenu.classList.toggle('show');
});

document.addEventListener('click', () => {
  dropdownMenu.classList.remove('show');
});

document.getElementById('btn-menu-save')?.addEventListener('click', () => {
  triggerAutoSave();
  showToast('💾 Proyecto guardado en memoria local del navegador');
});

const fileImportJson = document.getElementById('file-import-json') as HTMLInputElement;
document.getElementById('btn-menu-import')?.addEventListener('click', () => {
  fileImportJson.click();
});

fileImportJson.addEventListener('change', () => {
  const file = fileImportJson.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (data.rooms && Array.isArray(data.rooms)) {
        rooms = data.rooms;
        connections = data.connections || [];
        props = data.props || [];
        selectedRoomId = rooms.length > 0 ? rooms[0].id : null;
        selectedPropId = null;
        rebuildScenario();
        app.audio.playSuccess();
        showToast(`¡Proyecto "${data.name || file.name}" cargado!`);
      }
    } catch {
      alert('Archivo JSON no válido.');
    }
  };
  reader.readAsText(file);
});

document.getElementById('btn-menu-empty')?.addEventListener('click', () => {
  if (confirm('¿Deseas reiniciar la escena a un lienzo completamente en blanco?')) {
    rooms = [];
    connections = [];
    props = [];
    selectedRoomId = null;
    selectedPropId = null;
    rebuildScenario();
    app.resetCamera([0, 22, 22], [0, 0, 0]);
    localStorage.removeItem('vxr_studio_autosave');
    showToast('Lienzo en blanco creado');
  }
});

let isMuted = false;
document.getElementById('btn-menu-sound')?.addEventListener('click', () => {
  isMuted = app.audio.toggleMute();
  document.getElementById('lbl-sound-status')!.textContent = isMuted ? 'MUTE' : 'ON';
  showToast(isMuted ? '🔇 Audio silenciado' : '🔊 Audio activado');
});

// =============================================================================
// Export Engine (TypeScript, HTML Standalone, Declarative JSON)
// =============================================================================
const exportModal = document.getElementById('export-modal') as HTMLElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
const btnCloseExport = document.getElementById('btn-close-export') as HTMLButtonElement;
const exportCodeDisplay = document.getElementById('export-code-display') as HTMLElement;
let activeExportTab: 'ts' | 'html' | 'json' = 'ts';

btnExport.addEventListener('click', () => {
  app.audio.playClick();
  updateExportDisplay();
  exportModal.classList.add('active');
});

btnCloseExport.addEventListener('click', () => {
  exportModal.classList.remove('active');
});

document.querySelectorAll('[data-export-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-export-tab]').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeExportTab = btn.getAttribute('data-export-tab') as any;
    updateExportDisplay();
  });
});

function generateTSCode(): string {
  let code = `// =====================================================================\n`;
  code += `// EXPERIENCIA CREADA CON VXR STUDIO\n`;
  code += `// Framework: VXR (High-Level WebXR & Three.js)\n`;
  code += `// =====================================================================\n\n`;
  code += `import * as THREE from 'three';\n`;
  code += `import { XRApp } from 'vxr';\n\n`;
  code += `const app = new XRApp({\n`;
  code += `  container: '#app',\n`;
  code += `  enableVR: true,\n`;
  code += `  autoVRButton: true,\n`;
  code += `  enableShadows: true,\n`;
  code += `  pixelRatioCap: 1.25,\n`;
  code += `});\n\n`;
  code += `const scenario = app.createScenario('Mi Escenario VXR');\n\n`;

  for (const r of rooms) {
    code += `scenario.addRoom({\n`;
    code += `  id: '${r.id}',\n`;
    code += `  name: '${r.name}',\n`;
    code += `  theme: '${r.theme}',\n`;
    code += `  center: [${r.center.join(', ')}],\n`;
    code += `  dimensions: { width: ${r.dimensions.width}, depth: ${r.dimensions.depth}, height: ${r.dimensions.height} },\n`;
    code += `  doors: ${JSON.stringify(r.doors)},\n`;
    code += `});\n\n`;
  }

  for (const c of connections) {
    code += `scenario.connectRooms('${c.fromRoomId}', '${c.fromWall}', '${c.toRoomId}', '${c.toWall}', { width: ${c.width}, height: ${c.height} });\n`;
  }
  code += `\n`;

  for (const p of props) {
    const parentRoom = rooms.find((r) => r.id === p.roomId);
    const x = ((parentRoom?.center[0] || 0) + p.relX).toFixed(2);
    const y = p.relY.toFixed(2);
    const z = ((parentRoom?.center[2] || 0) + p.relZ).toFixed(2);
    const varName = `obj_${p.id.replace(/-/g, '_')}`;

    code += `// Objeto: ${p.name} (${p.category} / ${p.subtype})\n`;
    if (p.subtype === 'frame_art') {
      const w = p.frameWidth || 2.2;
      const h = p.frameHeight || 1.6;
      code += `const ${varName} = new THREE.Group();\n`;
      code += `const border_${varName} = new THREE.Mesh(\n`;
      code += `  new THREE.BoxGeometry(${w}, ${h}, 0.08),\n`;
      code += `  new THREE.MeshStandardMaterial({ color: '${p.color}', metalness: 0.6, roughness: 0.35 })\n`;
      code += `);\n`;
      code += `${varName}.add(border_${varName});\n`;
      code += `const matting_${varName} = new THREE.Mesh(\n`;
      code += `  new THREE.BoxGeometry(${(w - 0.2).toFixed(2)}, ${(h - 0.2).toFixed(2)}, 0.085),\n`;
      code += `  new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 })\n`;
      code += `);\n`;
      code += `${varName}.add(matting_${varName});\n`;
      code += `const artMat_${varName} = new THREE.MeshStandardMaterial({ roughness: 0.3 });\n`;
      if (p.imageUrl) {
        code += `new THREE.TextureLoader().load('${p.imageUrl}', (tex) => {\n`;
        code += `  tex.colorSpace = THREE.SRGBColorSpace;\n`;
        code += `  artMat_${varName}.map = tex;\n`;
        code += `  artMat_${varName}.needsUpdate = true;\n`;
        code += `});\n`;
      }
      code += `const artPlane_${varName} = new THREE.Mesh(\n`;
      code += `  new THREE.PlaneGeometry(${(w - 0.38).toFixed(2)}, ${(h - 0.38).toFixed(2)}),\n`;
      code += `  artMat_${varName}\n`;
      code += `);\n`;
      code += `artPlane_${varName}.position.z = 0.046;\n`;
      code += `${varName}.add(artPlane_${varName});\n`;
      code += `${varName}.position.set(${x}, ${y}, ${z});\n`;
      code += `${varName}.rotation.set(${((p.rotX * Math.PI) / 180).toFixed(3)}, ${((p.rotY * Math.PI) / 180).toFixed(3)}, ${((p.rotZ * Math.PI) / 180).toFixed(3)});\n`;
      code += `app.scene.nativeScene.add(${varName});\n\n`;
    } else if (p.subtype === 'screen_video') {
      code += `const ${varName} = new THREE.Mesh(\n`;
      code += `  new THREE.BoxGeometry(2.6, 1.5, 0.08),\n`;
      code += `  new THREE.MeshStandardMaterial({ color: 0x070a12, roughness: 0.4, metalness: 0.8 })\n`;
      code += `);\n`;
      code += `${varName}.position.set(${x}, ${y}, ${z});\n`;
      code += `${varName}.rotation.set(${((p.rotX * Math.PI) / 180).toFixed(3)}, ${((p.rotY * Math.PI) / 180).toFixed(3)}, ${((p.rotZ * Math.PI) / 180).toFixed(3)});\n`;
      code += `${varName}.userData = { videoUrl: '${p.videoUrl || ''}' };\n`;
      code += `app.scene.nativeScene.add(${varName});\n\n`;
    } else if (p.subtype === 'billboard_floating') {
      code += `const ${varName} = new THREE.Mesh(\n`;
      code += `  new THREE.BoxGeometry(2.8, 1.3, 0.04),\n`;
      code += `  new THREE.MeshBasicMaterial({ color: '${p.color}' })\n`;
      code += `);\n`;
      code += `${varName}.position.set(${x}, ${y}, ${z});\n`;
      code += `${varName}.rotation.set(${((p.rotX * Math.PI) / 180).toFixed(3)}, ${((p.rotY * Math.PI) / 180).toFixed(3)}, ${((p.rotZ * Math.PI) / 180).toFixed(3)});\n`;
      code += `${varName}.userData = { linkUrl: '${p.linkUrl || ''}', text: '${p.text || p.name}' };\n`;
      code += `app.scene.nativeScene.add(${varName});\n\n`;
    } else {
      code += `const ${varName} = new THREE.Mesh(\n`;
      code += `  new THREE.BoxGeometry(1.2, 1.2, 1.2),\n`;
      code += `  new THREE.MeshStandardMaterial({ color: '${p.color}' })\n`;
      code += `);\n`;
      code += `${varName}.position.set(${x}, ${y}, ${z});\n`;
      code += `${varName}.rotation.set(${((p.rotX * Math.PI) / 180).toFixed(3)}, ${((p.rotY * Math.PI) / 180).toFixed(3)}, ${((p.rotZ * Math.PI) / 180).toFixed(3)});\n`;
      code += `app.scene.nativeScene.add(${varName});\n\n`;
    }
  }

  code += `app.start();\n`;
  return code;
}

function generateHTMLCode(): string {
  const ts = generateTSCode();
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Experiencia VXR Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #app { width: 100%; height: 100%; overflow: hidden; background: #050811; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.min.js"></script>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    console.log("¡Experiencia VXR cargada!");
    ${ts.replace(/import \* as THREE from 'three';/, '// Three.js vía CDN').replace(/import { XRApp } from 'vxr';/, '// Framework VXR Core')}
  </script>
</body>
</html>`;
}

function generateJSONCode(): string {
  return JSON.stringify({ name: 'VXR Studio Export', version: '2.0.0', rooms, connections, props }, null, 2);
}

function updateExportDisplay(): void {
  if (activeExportTab === 'ts') exportCodeDisplay.textContent = generateTSCode();
  else if (activeExportTab === 'html') exportCodeDisplay.textContent = generateHTMLCode();
  else exportCodeDisplay.textContent = generateJSONCode();
}

document.getElementById('btn-copy-code')?.addEventListener('click', () => {
  const code = exportCodeDisplay.textContent || '';
  navigator.clipboard.writeText(code).then(() => showToast('¡Código copiado al portapapeles! 🚀'));
});

document.getElementById('btn-download-file')?.addEventListener('click', () => {
  let content = '';
  let filename = '';
  let mime = 'text/plain';

  if (activeExportTab === 'ts') { content = generateTSCode(); filename = 'experiencia-vxr.ts'; mime = 'text/typescript'; }
  else if (activeExportTab === 'html') { content = generateHTMLCode(); filename = 'experiencia-vxr.html'; mime = 'text/html'; }
  else { content = generateJSONCode(); filename = 'escenario-vxr.json'; mime = 'application/json'; }

  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  showToast(`¡Archivo "${filename}" descargado!`);
});

// Toast notification helper
const toastEl = document.getElementById('toast') as HTMLElement;
const toastMsg = document.getElementById('toast-msg') as HTMLElement;
let toastTimeout: any;

function showToast(msg: string): void {
  toastMsg.textContent = msg;
  toastEl.style.display = 'flex';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toastEl.style.display = 'none'; }, 2800);
}

// =============================================================================
// Welcome Modal Controller (2 Options: Learn vs Skip)
// =============================================================================
const welcomeModal = document.getElementById('welcome-modal') as HTMLElement;
const btnCloseWelcome = document.getElementById('btn-close-welcome') as HTMLButtonElement;
const btnWelcomeLearn = document.getElementById('btn-welcome-learn') as HTMLElement;
const btnWelcomeSkip = document.getElementById('btn-welcome-skip') as HTMLElement;
const chkWelcomeDismiss = document.getElementById('chk-welcome-dismiss') as HTMLInputElement;

function showWelcomeIfNeeded(): void {
  const dismissed = localStorage.getItem('vxr_studio_welcome_dismissed');
  if (!dismissed && welcomeModal) {
    welcomeModal.classList.add('active');
  }
}

function dismissWelcome(): void {
  if (chkWelcomeDismiss?.checked) {
    localStorage.setItem('vxr_studio_welcome_dismissed', 'true');
  }
  welcomeModal?.classList.remove('active');
}

btnCloseWelcome?.addEventListener('click', dismissWelcome);
welcomeModal?.addEventListener('click', (e) => {
  if (e.target === welcomeModal) dismissWelcome();
});

btnWelcomeSkip?.addEventListener('click', () => {
  dismissWelcome();
  app.audio.playClick();
  showToast('🚀 ¡Bienvenido al lienzo de diseño libre!');
});

btnWelcomeLearn?.addEventListener('click', () => {
  dismissWelcome();
  startTutorial();
});

// =============================================================================
// Guided Interactive Tutorial Controller (6 Real Steps on Live 3D Scene)
// =============================================================================
const tutorialCard = document.getElementById('tutorial-card') as HTMLElement;
const tutStepBadge = document.getElementById('tut-step-badge') as HTMLElement;
const tutProgressFill = document.getElementById('tut-progress-fill') as HTMLElement;
const tutHeadline = document.getElementById('tut-headline') as HTMLElement;
const tutDescription = document.getElementById('tut-description') as HTMLElement;
const btnTutPrev = document.getElementById('btn-tut-prev') as HTMLButtonElement;
const btnTutAuto = document.getElementById('btn-tut-auto') as HTMLButtonElement;
const btnTutNext = document.getElementById('btn-tut-next') as HTMLButtonElement;
const btnTutRestart = document.getElementById('btn-tut-restart') as HTMLButtonElement;
const btnTutClose = document.getElementById('btn-tut-close') as HTMLButtonElement;

interface TutorialStep {
  title: string;
  headline: string;
  description: string;
  targetSelector?: string;
  validate: () => boolean;
  autoComplete: () => void;
}

let currentTutStepIndex = 0;
let currentHighlightedEl: HTMLElement | null = null;

function clearTutorialHighlight(): void {
  if (currentHighlightedEl) {
    currentHighlightedEl.classList.remove('tutorial-target-highlight');
    currentHighlightedEl = null;
  }
}

function setTutorialHighlight(selector?: string): void {
  clearTutorialHighlight();
  if (!selector) return;
  const el = document.querySelector(selector) as HTMLElement;
  if (el) {
    el.classList.add('tutorial-target-highlight');
    currentHighlightedEl = el;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Paso 1 de 6',
    headline: '1. Estructura y Espacio 3D',
    description: 'VXR Studio organiza las experiencias en salas 3D. Pulsa "＋ Añadir Sala al Nivel" para crear tu primera sala en el centro del escenario y comenzar tu diseño.',
    targetSelector: '#btn-add-room-dialog',
    validate: () => rooms.length > 0 && selectedRoomId !== null,
    autoComplete: () => {
      if (rooms.length === 0) {
        rooms.push({
          id: 'room-main',
          name: 'Sala Principal',
          theme: 'gallery',
          dimensions: { width: 14, depth: 10, height: 4 },
          center: [0, 0, 0],
          doors: [],
          spawnPoint: [0, 1.6, 0],
        });
        selectedRoomId = 'room-main';
        rebuildScenario();
      } else {
        selectRoom(rooms[0].id);
      }
      showToast('✓ Sala Principal creada en el centro del escenario');
    },
  },
  {
    title: 'Paso 2 de 6',
    headline: '2. Navegación de Cámara 3D',
    description: 'Aprende a moverte: Arrastra con clic izquierdo para orbitar, gira la rueda del ratón para zoom, y mantén el botón derecho para desplazamiento lateral (pan). Pulsa 🏠 en la barra inferior para centrar la cámara.',
    targetSelector: '.viewport-bottom-bar',
    validate: () => true,
    autoComplete: () => {
      const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
      const cx = activeRoom ? activeRoom.center[0] : 0;
      const cz = activeRoom ? activeRoom.center[2] : 0;
      app.resetCamera([cx, 18, cz + 16], [cx, 0, cz]);
      showToast('🏠 Vista general de la cámara centrada');
    },
  },
  {
    title: 'Paso 3 de 6',
    headline: '3. Añadir Marco de Imagen',
    description: 'Ve a la pestaña "Exposición" en el catálogo de objetos de la izquierda y haz clic en "Marco de Imagen". Se generará un marco tridimensional biselado con paspartú.',
    targetSelector: '[data-category="exhibition"]',
    validate: () => props.some((p) => p.subtype === 'frame_art'),
    autoComplete: () => {
      document.querySelectorAll('.category-pill').forEach((p) => p.classList.remove('active'));
      const pill = document.querySelector('[data-category="exhibition"]') as HTMLElement;
      if (pill) pill.classList.add('active');
      activeCategory = 'exhibition';
      renderAssetCatalog();

      let art = props.find((p) => p.subtype === 'frame_art');
      if (!art) {
        const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
        const roomId = activeRoom ? activeRoom.id : '';
        const depth = activeRoom ? activeRoom.dimensions.depth : 10;
        art = {
          id: `prop-${Date.now().toString(36)}`,
          roomId,
          category: 'exhibition',
          subtype: 'frame_art',
          name: 'Obra Maestra 01',
          relX: 0,
          relY: 2.0,
          relZ: -depth / 2 + 0.15,
          rotX: 0,
          rotY: 0,
          rotZ: 0,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
          color: '#d4af37',
          frameWidth: 2.4,
          frameHeight: 1.8,
        };
        props.push(art);
        spawnPropMesh(art);
      }
      selectProp(art.id);
      focusSelectedProp();
      showToast('🖼️ Marco de Imagen colocado en el escenario');
    },
  },
  {
    title: 'Paso 4 de 6',
    headline: '4. Configurar Imagen de la Obra',
    description: 'En el panel derecho "Propiedades", introduce una URL de imagen o pulsa "📁 Subir Archivo" para mostrar tu fotografía o ilustración en el marco 3D.',
    targetSelector: '#panel-properties',
    validate: () => {
      const art = props.find((p) => p.subtype === 'frame_art');
      return !!(art && art.imageUrl);
    },
    autoComplete: () => {
      let art = props.find((p) => p.subtype === 'frame_art');
      if (!art) {
        TUTORIAL_STEPS[2].autoComplete();
        art = props.find((p) => p.subtype === 'frame_art')!;
      }
      art.imageUrl = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&auto=format&fit=crop';
      art.name = 'Retrato Clásico en Óleo';
      propImageUrl.value = art.imageUrl;
      const mesh = propMeshMap.get(art.id);
      if (mesh) {
        app.scene.nativeScene.remove(mesh);
        const newMesh = spawnPropMesh(art);
        if (activeTool !== 'select') transformControls.attach(newMesh);
      }
      selectProp(art.id);
      showToast('🎨 ¡Imagen de alta resolución cargada en el marco!');
      triggerAutoSave();
    },
  },
  {
    title: 'Paso 5 de 6',
    headline: '5. Pantalla de Video & Anuncios',
    description: 'Enriquece tu nivel multimedia: añade una "Pantalla de Video" (con enlace a YouTube o MP4) o un "Anuncio Flotante" con efecto neón y enlace interactivo.',
    targetSelector: '[data-category="exhibition"]',
    validate: () => props.some((p) => p.subtype === 'screen_video' || p.subtype === 'billboard_floating'),
    autoComplete: () => {
      const activeRoom = selectedRoomId ? rooms.find((r) => r.id === selectedRoomId) : (rooms.length > 0 ? rooms[0] : null);
      const roomId = activeRoom ? activeRoom.id : '';
      const depth = activeRoom ? activeRoom.dimensions.depth : 10;
      if (!props.some((p) => p.subtype === 'screen_video')) {
        const videoProp: StudioPropDef = {
          id: `prop-${Date.now().toString(36)}_vid`,
          roomId,
          category: 'exhibition',
          subtype: 'screen_video',
          name: 'Pantalla Principal XR',
          relX: -3.5,
          relY: 1.5,
          relZ: -depth / 2 + 0.8,
          rotX: 0,
          rotY: 15,
          rotZ: 0,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
          color: '#0084ff',
          videoUrl: 'https://www.youtube.com/watch?v=k1BneeJTDcU',
        };
        props.push(videoProp);
        spawnPropMesh(videoProp);
      }
      if (!props.some((p) => p.subtype === 'billboard_floating')) {
        const billboardProp: StudioPropDef = {
          id: `prop-${Date.now().toString(36)}_bb`,
          roomId,
          category: 'exhibition',
          subtype: 'billboard_floating',
          name: 'Cartelera Holográfica',
          text: 'VXR CORE EXPERIENCE 2026',
          linkUrl: 'https://github.com/Vickman123/Framework-XVR',
          relX: 3.2,
          relY: 2.4,
          relZ: -depth / 2 + 0.8,
          rotX: 0,
          rotY: -15,
          rotZ: 0,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
          color: '#38bdf8',
        };
        props.push(billboardProp);
        spawnPropMesh(billboardProp);
      }
      showToast('📺 Pantalla de video y anuncio flotante colocados');
      triggerAutoSave();
    },
  },
  {
    title: 'Paso 6 de 6',
    headline: '6. Inmersión 3D & Meta Quest',
    description: '¡Tu sala interactiva está lista! Pulsa "▷ Probar 3D" para caminar en primera persona con colisiones, o entra en WebXR si dispones de unas Meta Quest. Haz clic sobre las obras para abrirlas en Lightbox o reproducir el video.',
    targetSelector: '#btn-test-3d',
    validate: () => isFirstPerson,
    autoComplete: () => {
      toggleFirstPersonMode(true);
      showToast('🚶 ¡Caminando por tu sala 3D! Haz clic en los cuadros para interactuar.');
    },
  },
];

function renderTutorialStep(): void {
  const step = TUTORIAL_STEPS[currentTutStepIndex];
  if (!step) return;

  tutStepBadge.textContent = step.title;
  tutProgressFill.style.width = `${((currentTutStepIndex + 1) / TUTORIAL_STEPS.length) * 100}%`;
  tutHeadline.textContent = step.headline;
  tutDescription.textContent = step.description;

  btnTutPrev.disabled = currentTutStepIndex === 0;
  btnTutPrev.style.opacity = currentTutStepIndex === 0 ? '0.4' : '1';

  if (currentTutStepIndex === TUTORIAL_STEPS.length - 1) {
    btnTutNext.textContent = '¡Finalizar Tutorial! 🎉';
  } else {
    btnTutNext.textContent = 'Validar & Continuar →';
  }

  setTutorialHighlight(step.targetSelector);
}

function startTutorial(): void {
  currentTutStepIndex = 0;
  tutorialCard.style.display = 'block';
  renderTutorialStep();
  app.audio.playClick();
  showToast('🎓 Tutorial interactivo iniciado');
}

function closeTutorial(): void {
  tutorialCard.style.display = 'none';
  clearTutorialHighlight();
  showToast('Tutorial cerrado. Puedes reabrirlo con el botón "Tutorial"');
}

btnTutRestart?.addEventListener('click', () => {
  currentTutStepIndex = 0;
  renderTutorialStep();
  app.audio.playClick();
  showToast('🔄 Tutorial reiniciado al paso 1');
});

btnTutClose?.addEventListener('click', closeTutorial);

btnTutPrev?.addEventListener('click', () => {
  if (currentTutStepIndex > 0) {
    currentTutStepIndex--;
    renderTutorialStep();
    app.audio.playClick();
  }
});

btnTutAuto?.addEventListener('click', () => {
  const step = TUTORIAL_STEPS[currentTutStepIndex];
  if (step) {
    step.autoComplete();
    app.audio.playSuccess();
    if (currentTutStepIndex < TUTORIAL_STEPS.length - 1) {
      setTimeout(() => {
        currentTutStepIndex++;
        renderTutorialStep();
      }, 700);
    }
  }
});

btnTutNext?.addEventListener('click', () => {
  if (currentTutStepIndex === TUTORIAL_STEPS.length - 1) {
    closeTutorial();
    app.audio.playSuccess();
    showToast('🎉 ¡Felicitaciones! Has completado el tutorial de VXR Studio.');
    return;
  }

  const step = TUTORIAL_STEPS[currentTutStepIndex];
  const isValid = step.validate();
  if (isValid) {
    currentTutStepIndex++;
    renderTutorialStep();
    app.audio.playSuccess();
  } else {
    showToast('💡 Acción validada. Avanzando al siguiente paso...');
    currentTutStepIndex++;
    renderTutorialStep();
  }
});

document.getElementById('btn-top-tutorial')?.addEventListener('click', startTutorial);
document.getElementById('btn-menu-tutorial')?.addEventListener('click', () => {
  dropdownMenu.classList.remove('show');
  startTutorial();
});

// =============================================================================
// App Startup (Restore auto-save if present, build initial scenario, show welcome)
// =============================================================================
restoreFromAutoSave();
renderAssetCatalog();
rebuildScenario();
app.start();
showWelcomeIfNeeded();
