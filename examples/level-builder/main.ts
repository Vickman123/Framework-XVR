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

export type StudioPropCategory = 'basic' | 'furniture' | 'architecture' | 'decoration' | 'model_glb';

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
  // External model data
  modelUrl?: string;
}

// =============================================================================
// Default Scenario Templates
// =============================================================================
const DEFAULT_ROOMS: RoomDef[] = [
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
    doors: [{ wall: 'south', targetRoomId: 'lobby', width: 2.6, height: 2.8 }],
    spawnPoint: [0, 1.6, -18],
  },
];

const DEFAULT_CONNECTIONS: ConnectionDef[] = [
  {
    id: 'conn-1',
    fromRoomId: 'lobby',
    fromWall: 'north',
    toRoomId: 'archaeology',
    toWall: 'south',
    width: 2.6,
    height: 3.2,
  },
];

const DEFAULT_PROPS: StudioPropDef[] = [
  {
    id: 'prop-box-1',
    roomId: 'lobby',
    category: 'basic',
    subtype: 'box',
    name: 'Caja_01',
    relX: 0,
    relY: 0.6,
    relZ: -1.5,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    color: '#e0e0e0',
  },
  {
    id: 'prop-table-1',
    roomId: 'lobby',
    category: 'furniture',
    subtype: 'table',
    name: 'Mesa de Centro',
    relX: -3.2,
    relY: 0,
    relZ: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    color: '#78350f',
  },
  {
    id: 'prop-part-glass',
    roomId: 'lobby',
    category: 'architecture',
    subtype: 'partition_glass',
    name: 'Mampara Cristal',
    relX: 3.5,
    relY: 0,
    relZ: 0,
    rotX: 0,
    rotY: 90,
    rotZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    color: '#38bdf8',
  },
  {
    id: 'prop-sign-1',
    roomId: 'lobby',
    category: 'decoration',
    subtype: 'sign_plaque',
    name: 'Placa Bienvenida',
    relX: 0,
    relY: 2.2,
    relZ: -4.8,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    color: '#38bdf8',
    text: 'BIENVENIDOS A VXR STUDIO',
  },
];

// =============================================================================
// Application State
// =============================================================================
let rooms: RoomDef[] = JSON.parse(JSON.stringify(DEFAULT_ROOMS));
let connections: ConnectionDef[] = JSON.parse(JSON.stringify(DEFAULT_CONNECTIONS));
let props: StudioPropDef[] = JSON.parse(JSON.stringify(DEFAULT_PROPS));

let selectedRoomId: string = rooms[0].id;
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
  const parentRoom = rooms.find((r) => r.id === p?.roomId);

  if (p && mesh && parentRoom) {
    // Sync mesh transform back to prop data model
    p.relX = parseFloat((mesh.position.x - parentRoom.center[0]).toFixed(2));
    p.relY = parseFloat(mesh.position.y.toFixed(2));
    p.relZ = parseFloat((mesh.position.z - parentRoom.center[2]).toFixed(2));

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

function createFurnitureMesh(prop: StudioPropDef): THREE.Object3D {
  const group = new THREE.Group();
  const color = new THREE.Color(prop.color);
  const woodMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });

  if (prop.subtype === 'chair') {
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.6), woodMat);
    seat.position.y = 0.45;
    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.08), woodMat);
    back.position.set(0, 0.72, -0.26);
    // 4 Legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 12);
    const leg1 = new THREE.Mesh(legGeo, darkMetal); leg1.position.set(-0.25, 0.225, -0.25);
    const leg2 = new THREE.Mesh(legGeo, darkMetal); leg2.position.set(0.25, 0.225, -0.25);
    const leg3 = new THREE.Mesh(legGeo, darkMetal); leg3.position.set(-0.25, 0.225, 0.25);
    const leg4 = new THREE.Mesh(legGeo, darkMetal); leg4.position.set(0.25, 0.225, 0.25);
    group.add(seat, back, leg1, leg2, leg3, leg4);
  } else if (prop.subtype === 'sofa') {
    // Lounge Sofa
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.8), woodMat);
    base.position.y = 0.25;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.25), woodMat);
    back.position.set(0, 0.6, -0.28);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.8), woodMat);
    armL.position.set(-0.85, 0.45, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.8), woodMat);
    armR.position.set(0.85, 0.45, 0);
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
  } else {
    // Table
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), woodMat);
    top.position.y = 0.72;
    const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.72, 12);
    const leg1 = new THREE.Mesh(legGeo, darkMetal); leg1.position.set(-0.7, 0.36, -0.35);
    const leg2 = new THREE.Mesh(legGeo, darkMetal); leg2.position.set(0.7, 0.36, -0.35);
    const leg3 = new THREE.Mesh(legGeo, darkMetal); leg3.position.set(-0.7, 0.36, 0.35);
    const leg4 = new THREE.Mesh(legGeo, darkMetal); leg4.position.set(0.7, 0.36, 0.35);
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
  const parentRoom = rooms.find((r) => r.id === prop.roomId) || rooms[0];
  const worldX = parentRoom.center[0] + prop.relX;
  const worldY = prop.relY;
  const worldZ = parentRoom.center[2] + prop.relZ;

  let mesh: THREE.Object3D;
  if (prop.category === 'basic') {
    mesh = createBasicMesh(prop);
  } else if (prop.category === 'furniture') {
    mesh = createFurnitureMesh(prop);
  } else if (prop.category === 'architecture') {
    mesh = createArchitectureMesh(prop);
  } else if (prop.category === 'decoration') {
    mesh = createDecorationMesh(prop);
  } else {
    // Fallback or GLB placeholder
    mesh = createBasicMesh(prop);
  }

  mesh.userData = { propId: prop.id };
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
  else if (p.subtype === 'table') icon = '🪑';
  else if (p.subtype === 'partition_glass') icon = '🪟';
  else if (p.subtype === 'column') icon = '🏛️';
  else if (p.category === 'model_glb') icon = '🗿';

  propThumb.textContent = icon;
  propTitle.textContent = p.name;
  propTypeTag.textContent = `Tipo: ${p.category.toUpperCase()}`;
  propNameInput.value = p.name;

  updatePropertyInputs(p);

  // Type-specific fields
  if (p.subtype.includes('sign') || p.subtype === 'totem') {
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
  const parentRoom = rooms.find((r) => r.id === p?.roomId);
  if (!p || !mesh || !parentRoom) return;

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
  mesh.position.set(parentRoom.center[0] + p.relX, p.relY, parentRoom.center[2] + p.relZ);
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

// Keyboard Shortcuts: Q, W, E, R, F, Delete
window.addEventListener('keydown', (e) => {
  if (['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())) return;

  if (e.code === 'KeyQ') setToolMode('select');
  else if (e.code === 'KeyW') setToolMode('translate');
  else if (e.code === 'KeyE') setToolMode('rotate');
  else if (e.code === 'KeyR') setToolMode('scale');
  else if (e.code === 'KeyF') {
    if (selectedPropId && propMeshMap.has(selectedPropId)) {
      const mesh = propMeshMap.get(selectedPropId)!;
      app.resetCamera([mesh.position.x, mesh.position.y + 4, mesh.position.z + 6], [mesh.position.x, mesh.position.y, mesh.position.z]);
    }
  } else if (e.code === 'Delete' || e.code === 'Backspace') {
    if (selectedPropId) deleteProp(selectedPropId);
  }
});

// Viewport Click Raycast Selection
container.addEventListener('click', (e) => {
  if (isFirstPerson) return;
  // If user is dragging gizmo, don't deselect
  if (transformControls.dragging) return;

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

// Bottom Camera Floating Bar
document.getElementById('btn-cam-home')?.addEventListener('click', () => {
  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  app.resetCamera([activeRoom.center[0], 18, activeRoom.center[2] + 16], [activeRoom.center[0], 0, activeRoom.center[2]]);
  app.audio.playClick();
});

document.getElementById('btn-cam-focus')?.addEventListener('click', () => {
  if (selectedPropId && propMeshMap.has(selectedPropId)) {
    const mesh = propMeshMap.get(selectedPropId)!;
    app.resetCamera([mesh.position.x, mesh.position.y + 3.5, mesh.position.z + 5], [mesh.position.x, mesh.position.y, mesh.position.z]);
  }
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
  app.resetCamera([0, 22, 22], [0, 0, -4]);
  showToast('Vista en Perspectiva 3D');
});

btnProjOrtho?.addEventListener('click', () => {
  btnProjOrtho.classList.add('active');
  btnProjPersp.classList.remove('active');
  // Position camera directly overhead for 2D top-down floor plan
  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  app.resetCamera([activeRoom.center[0], 32, activeRoom.center[2]], [activeRoom.center[0], 0, activeRoom.center[2]]);
  showToast('Vista Cenital (Planta 2D)');
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
  // Mobiliario
  { category: 'furniture', subtype: 'table', name: 'Mesa', icon: '🪑' },
  { category: 'furniture', subtype: 'chair', name: 'Silla', icon: '💺' },
  { category: 'furniture', subtype: 'sofa', name: 'Sofá', icon: '🛋️' },
  { category: 'furniture', subtype: 'shelf', name: 'Estante', icon: '📚' },
  // Arquitectura
  { category: 'architecture', subtype: 'partition_glass', name: 'Mampara Cristal', icon: '🪟' },
  { category: 'architecture', subtype: 'partition_wood', name: 'Mampara Madera', icon: '🪵' },
  { category: 'architecture', subtype: 'partition_neon', name: 'Mampara Neón', icon: '⚡' },
  { category: 'architecture', subtype: 'column', name: 'Columna', icon: '🏛️' },
  // Decoración
  { category: 'decoration', subtype: 'sign_neon', name: 'Rótulo Neón', icon: '🏷️' },
  { category: 'decoration', subtype: 'sign_plaque', name: 'Placa Pared', icon: '📌' },
  { category: 'decoration', subtype: 'totem', name: 'Tótem 3D', icon: '🪧' },
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
  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

  const offset = 1.2;
  const relX = parseFloat(((Math.random() - 0.5) * offset).toFixed(2));
  const relZ = parseFloat(((Math.random() - 0.5) * offset).toFixed(2));
  let relY = 0.6;
  let color = '#e0e0e0';

  if (item.category === 'furniture') { relY = 0; color = '#78350f'; }
  else if (item.category === 'architecture') { relY = 0; color = '#38bdf8'; }
  else if (item.category === 'decoration') { relY = 1.8; color = '#38bdf8'; }

  const newProp: StudioPropDef = {
    id: `prop-${Date.now().toString(36)}`,
    roomId: activeRoom.id,
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
    text: 'ZONA DE EXHIBICIÓN',
    intensity: 2.5,
  };

  props.push(newProp);
  spawnPropMesh(newProp);
  selectProp(newProp.id);
  app.audio.playSuccess();
  showToast(`¡${newProp.name} añadido a ${activeRoom.name}!`);
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

fileGlbInput.addEventListener('change', async () => {
  const file = fileGlbInput.files?.[0];
  if (!file) return;

  try {
    showToast('Cargando modelo 3D...');
    const loaded = await app.assets.loadModel(file, { autoGround: true, autoCenter: true });
    const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];

    const newProp: StudioPropDef = {
      id: `prop-glb-${Date.now().toString(36)}`,
      roomId: activeRoom.id,
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
    loaded.group.position.set(activeRoom.center[0], 0, activeRoom.center[2]);
    app.scene.nativeScene.add(loaded.group);

    props.push(newProp);
    propMeshMap.set(newProp.id, loaded.group);

    selectProp(newProp.id);
    app.audio.playSuccess();
    showToast(`¡Modelo "${newProp.name}" integrado al proyecto!`);
    triggerAutoSave();
  } catch (err: any) {
    console.error('Error cargando modelo GLB:', err);
    showToast('Error al procesar el archivo GLB.');
  }
});

// Rooms List Rendering
const roomsListEl = document.getElementById('rooms-list') as HTMLElement;
const roomsCountBadge = document.getElementById('rooms-count-badge') as HTMLElement;

function renderRoomsList(): void {
  roomsListEl.innerHTML = '';
  roomsCountBadge.textContent = rooms.length.toString();

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
      selectedRoomId = r.id;
      renderRoomsList();
      app.resetCamera([r.center[0], 18, r.center[2] + 16], [r.center[0], 0, r.center[2]]);
      app.audio.playClick();
    });

    card.querySelector('[data-del-room]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (rooms.length <= 1) {
        alert('El escenario debe contener al menos una sala.');
        return;
      }
      rooms = rooms.filter((item) => item.id !== r.id);
      connections = connections.filter((c) => c.fromRoomId !== r.id && c.toRoomId !== r.id);
      props = props.filter((p) => p.roomId !== r.id);
      selectedRoomId = rooms[0].id;
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

btnAddRoomDialog.addEventListener('click', () => {
  addRoomModal.classList.add('active');
});
btnCloseRoomModal.addEventListener('click', () => {
  addRoomModal.classList.remove('active');
});

document.querySelectorAll('.btn-dir-room').forEach((btn) => {
  btn.addEventListener('click', () => {
    const dir = btn.getAttribute('data-dir') as WallDirection;
    const parentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
    const newId = `room-${Date.now().toString(36)}`;
    const newW = parseFloat(modalRoomW.value) || 12;
    const newD = parseFloat(modalRoomD.value) || 10;
    const newH = 3.8;

    let posX = parentRoom.center[0];
    let posZ = parentRoom.center[2];
    let fromWall: WallDirection = 'north';
    let toWall: WallDirection = 'south';

    const gap = 6.0;
    if (dir === 'north') {
      posZ -= (parentRoom.dimensions.depth / 2 + newD / 2 + gap);
      fromWall = 'north'; toWall = 'south';
    } else if (dir === 'south') {
      posZ += (parentRoom.dimensions.depth / 2 + newD / 2 + gap);
      fromWall = 'south'; toWall = 'north';
    } else if (dir === 'east') {
      posX += (parentRoom.dimensions.width / 2 + newW / 2 + gap);
      fromWall = 'east'; toWall = 'west';
    } else if (dir === 'west') {
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
    showToast(`¡Sala añadida al ${dir.toUpperCase()} con pasillo automático!`);
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

btnTest3D.addEventListener('click', () => {
  isFirstPerson = !isFirstPerson;
  app.audio.playWarp();

  if (isFirstPerson) {
    lblBtn3D.textContent = 'Modo Editor';
    btnTest3D.style.borderColor = '#38bdf8';
    btnTest3D.style.background = 'rgba(56, 189, 248, 0.2)';
    if (app.controls) app.controls.enabled = false;
    transformControls.detach();

    const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
    playerPos.set(activeRoom.center[0], 1.6, activeRoom.center[2]);
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
});

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
app.onUpdate((delta) => {
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
    if (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
      rooms = data.rooms;
      connections = data.connections || [];
      props = data.props || [];
      selectedRoomId = rooms[0].id;
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
        selectedRoomId = rooms[0].id;
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
  if (confirm('¿Deseas reiniciar la escena a un lienzo en blanco?')) {
    rooms = [
      {
        id: 'room-1',
        name: 'Sala Principal',
        theme: 'gallery',
        dimensions: { width: 12, depth: 10, height: 3.8 },
        center: [0, 0, 0],
        doors: [],
        spawnPoint: [0, 1.6, 0],
      },
    ];
    connections = [];
    props = [];
    selectedRoomId = rooms[0].id;
    selectedPropId = null;
    rebuildScenario();
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
    code += `// Objeto: ${p.name} (${p.category} / ${p.subtype})\n`;
    code += `const obj_${p.id.replace(/-/g, '_')} = new THREE.Mesh(\n`;
    code += `  new THREE.BoxGeometry(1.2, 1.2, 1.2),\n`;
    code += `  new THREE.MeshStandardMaterial({ color: '${p.color}' })\n`;
    code += `);\n`;
    code += `obj_${p.id.replace(/-/g, '_')}.position.set(${x}, ${y}, ${z});\n`;
    code += `app.scene.nativeScene.add(obj_${p.id.replace(/-/g, '_')});\n\n`;
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
// App Startup (Restore auto-save if present, build initial scenario)
// =============================================================================
restoreFromAutoSave();
renderAssetCatalog();
rebuildScenario();
app.start();
