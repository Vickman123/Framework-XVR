import type { RoomTheme, WallDirection } from '@vxr/core';

// =============================================================================
// Interfaces & Schema Types
// =============================================================================

export interface RoomDef {
  id: string;
  name: string;
  theme: RoomTheme;
  dimensions: { width: number; depth: number; height: number };
  center: [number, number, number];
  doors?: Array<{ wall: WallDirection; targetRoomId: string; width?: number; height?: number }>;
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
  imageUrl?: string;
  videoUrl?: string;
  videoId?: string;
  linkUrl?: string;
  frameWidth?: number;
  frameHeight?: number;
  interactionAction?: 'lightbox' | 'video_popup' | 'open_link' | 'none';
  modelUrl?: string;
}

export interface ExportedPropDef {
  id: string;
  roomId: string;
  name: string;
  category: StudioPropCategory;
  subtype: string;
  position: [number, number, number];        // Absolute world coordinates [X, Y, Z]
  relativePosition: [number, number, number];// Relative to room center [X, Y, Z]
  rotationDeg: [number, number, number];     // Euler angles in degrees [X, Y, Z]
  scale: [number, number, number];           // Scale multipliers [X, Y, Z]
  color: string;
  text?: string;
  intensity?: number;
  textureUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  modelUrl?: string;
}

export interface VXRSceneExport {
  schemaVersion: '1.0.0';
  generator: 'VXR Studio';
  exportedAt: string;
  projectName: string;
  environment: {
    preset: 'studio' | 'daylight' | 'dark';
    backgroundColor: string;
  };
  camera: {
    fov: number;
    initialPosition: [number, number, number];
    initialTarget: [number, number, number];
  };
  rooms: RoomDef[];
  connections: ConnectionDef[];
  props: ExportedPropDef[];
}

export interface SerializeSceneOptions {
  projectName?: string;
  rooms: RoomDef[];
  connections: ConnectionDef[];
  props: StudioPropDef[];
  environmentPreset?: string;
  backgroundColor?: string;
  fov?: number;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
}

// =============================================================================
// Single Source of Truth: serializeScene
// =============================================================================

export function serializeScene(options: SerializeSceneOptions): VXRSceneExport {
  const rooms = options.rooms || [];
  const connections = options.connections || [];
  const props = options.props || [];

  // Map each prop with clean absolute and relative coordinates
  const exportedProps: ExportedPropDef[] = props.map((p) => {
    const parentRoom = p.roomId ? rooms.find((r) => r.id === p.roomId) : (rooms.length > 0 ? rooms[0] : null);
    const cx = parentRoom ? parentRoom.center[0] : 0;
    const cz = parentRoom ? parentRoom.center[2] : 0;

    const absX = parseFloat((cx + (p.relX || 0)).toFixed(3));
    const absY = parseFloat((p.relY || 0).toFixed(3));
    const absZ = parseFloat((cz + (p.relZ || 0)).toFixed(3));

    return {
      id: p.id,
      roomId: p.roomId || (parentRoom ? parentRoom.id : ''),
      name: p.name || 'Objeto',
      category: p.category || 'basic',
      subtype: p.subtype || 'box',
      position: [absX, absY, absZ],
      relativePosition: [
        parseFloat((p.relX || 0).toFixed(3)),
        parseFloat((p.relY || 0).toFixed(3)),
        parseFloat((p.relZ || 0).toFixed(3)),
      ],
      rotationDeg: [
        parseFloat((p.rotX || 0).toFixed(1)),
        parseFloat((p.rotY || 0).toFixed(1)),
        parseFloat((p.rotZ || 0).toFixed(1)),
      ],
      scale: [
        parseFloat((p.scaleX || 1).toFixed(3)),
        parseFloat((p.scaleY || 1).toFixed(3)),
        parseFloat((p.scaleZ || 1).toFixed(3)),
      ],
      color: p.color || '#38bdf8',
      text: p.text || undefined,
      intensity: p.intensity,
      textureUrl: p.textureUrl || undefined,
      imageUrl: p.imageUrl || undefined,
      videoUrl: p.videoUrl || undefined,
      linkUrl: p.linkUrl || undefined,
      modelUrl: p.modelUrl || undefined,
    };
  });

  const preset = options.environmentPreset === 'daylight' ? 'daylight'
    : options.environmentPreset === 'dark' ? 'dark'
    : 'studio';

  return {
    schemaVersion: '1.0.0',
    generator: 'VXR Studio',
    exportedAt: new Date().toISOString(),
    projectName: options.projectName || 'Proyecto VXR',
    environment: {
      preset,
      backgroundColor: options.backgroundColor || '#080d1a',
    },
    camera: {
      fov: options.fov || 50,
      initialPosition: options.cameraPosition || [0, 16, 20],
      initialTarget: options.cameraTarget || [0, 0, 0],
    },
    rooms: JSON.parse(JSON.stringify(rooms)),
    connections: JSON.parse(JSON.stringify(connections)),
    props: exportedProps,
  };
}

// =============================================================================
// Validation & Restoration
// =============================================================================

export function validateSceneExport(scene: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!scene || typeof scene !== 'object') {
    return { valid: false, errors: ['El archivo no contiene un objeto JSON válido.'] };
  }

  if (scene.schemaVersion !== '1.0.0') {
    errors.push(`Versión de esquema incompatible: ${scene.schemaVersion || 'desconocida'}`);
  }

  if (!Array.isArray(scene.rooms)) {
    errors.push('La propiedad "rooms" debe ser un arreglo.');
  } else {
    for (const [idx, r] of scene.rooms.entries()) {
      if (!r.id) errors.push(`La sala en el índice ${idx} carece de identificador único (id).`);
      if (!r.dimensions || typeof r.dimensions.width !== 'number' || typeof r.dimensions.depth !== 'number') {
        errors.push(`La sala "${r.name || r.id}" tiene dimensiones inválidas.`);
      }
    }
  }

  if (!Array.isArray(scene.props)) {
    errors.push('La propiedad "props" debe ser un arreglo.');
  }

  return { valid: errors.length === 0, errors };
}

export function restoreSceneFromJSON(jsonString: string): { success: boolean; data?: VXRSceneExport; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = validateSceneExport(parsed);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(' | ') };
    }
    return { success: true, data: parsed as VXRSceneExport };
  } catch (err: any) {
    return { success: false, error: `Error de sintaxis JSON: ${err.message}` };
  }
}

// =============================================================================
// Generator 1: JSON Declarativo
// =============================================================================

export function generateJSONCode(scene: VXRSceneExport): string {
  return JSON.stringify(scene, null, 2);
}

// =============================================================================
// Generator 2: TypeScript / VXR Core
// =============================================================================

export function generateTSCode(scene: VXRSceneExport): string {
  const bgHex = scene.environment.backgroundColor.replace('#', '0x');
  const camPos = scene.camera.initialPosition.join(', ');
  const camFov = scene.camera.fov;
  const envPreset = scene.environment.preset;

  const roomBlocks = scene.rooms.map((r) => {
    return `scenario.addRoom({
  id: '${escapeString(r.id)}',
  name: '${escapeString(r.name)}',
  theme: '${r.theme}',
  dimensions: { width: ${r.dimensions.width}, depth: ${r.dimensions.depth}, height: ${r.dimensions.height} },
  center: [${r.center.join(', ')}],
  spawnPoint: [${(r.spawnPoint || [r.center[0], 1.6, r.center[2]]).join(', ')}],
  ceiling: { enabled: false },
});`;
  }).join('\n\n');

  const connBlocks = scene.connections.map((c) => {
    return `scenario.connectRooms(
  '${escapeString(c.fromRoomId)}',
  '${c.fromWall}',
  '${escapeString(c.toRoomId)}',
  '${c.toWall}',
  { width: ${c.width}, height: ${c.height} }
);`;
  }).join('\n');

  const propBlocks = scene.props.map((p, idx) => {
    const rx = ((p.rotationDeg[0] * Math.PI) / 180).toFixed(4);
    const ry = ((p.rotationDeg[1] * Math.PI) / 180).toFixed(4);
    const rz = ((p.rotationDeg[2] * Math.PI) / 180).toFixed(4);

    return `// Objeto ${idx + 1}: ${p.name} (${p.category} / ${p.subtype})
{
  const obj = createPropMesh({
    subtype: '${escapeString(p.subtype)}',
    color: '${escapeString(p.color)}',
    name: '${escapeString(p.name)}',
    ${p.text ? `text: '${escapeString(p.text)}',` : ''}
    ${p.imageUrl ? `imageUrl: '${escapeString(p.imageUrl)}',` : ''}
    ${p.videoUrl ? `videoUrl: '${escapeString(p.videoUrl)}',` : ''}
    ${p.linkUrl ? `linkUrl: '${escapeString(p.linkUrl)}',` : ''}
  });
  obj.name = '${escapeString(p.name)}';
  obj.position.set(${p.position.join(', ')});
  obj.rotation.set(${rx}, ${ry}, ${rz});
  obj.scale.set(${p.scale.join(', ')});
  app.scene.nativeScene.add(obj);
}`;
  }).join('\n\n');

  return `/**
 * =============================================================================
 * Experiencia 3D & WebXR generada automáticamente por VXR Studio
 * Proyecto: ${escapeString(scene.projectName)}
 * Fecha de exportación: ${scene.exportedAt}
 * Versión de Esquema: ${scene.schemaVersion}
 * =============================================================================
 * Instrucciones de ejecución:
 *   1. Instala las dependencias en tu proyecto:
 *        npm install @vxr/core three
 *        npm install --save-dev @types/three typescript
 *   2. Compila o ejecuta con Vite, Webpack o ts-node.
 */

import * as THREE from 'three';
import { XRApp } from '@vxr/core';

// 1. Inicialización de la Aplicación VXR
const container = document.getElementById('app') || document.body;

const app = new XRApp({
  container,
  enableShadows: true,
  enableGrid: false,
  autoVRButton: true,
  cameraPosition: [${camPos}],
  fov: ${camFov},
});

app.scene.setEnvironmentPreset('${envPreset}');
app.scene.setBackground(${bgHex});

// Cuadrícula arquitectónica técnica
const gridHelper = new THREE.GridHelper(60, 60, 0x38bdf8, 0x334155);
gridHelper.position.y = 0;
app.scene.nativeScene.add(gridHelper);

// 2. Construcción de Arquitectura Espacial
const scenario = app.createScenario('${escapeString(scene.projectName)}');

${roomBlocks || '// No hay salas definidas'}

${connBlocks ? `// Conexiones de Pasillos entre Salas\n${connBlocks}` : '// Sin conexiones de pasillos'}

// 3. Fábrica de Objetos y Mobiliario Procedural
interface PropOptions {
  subtype: string;
  color: string;
  name: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
}

function createPropMesh(options: PropOptions): THREE.Object3D {
  const { subtype, color } = options;
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.35,
    metalness: 0.15,
  });

  if (subtype === 'sphere') {
    return new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 16), mat);
  } else if (subtype === 'cylinder') {
    return new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.4, 32), mat);
  } else if (subtype === 'plane') {
    return new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 2.0), mat);
  } else if (subtype === 'cone') {
    return new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 32), mat);
  } else if (subtype === 'torus') {
    return new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.25, 16, 32), mat);
  } else if (subtype === 'chair') {
    const chairGroup = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.6), mat);
    seat.position.y = 0.5;
    chairGroup.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.06), mat);
    back.position.set(0, 0.85, -0.27);
    chairGroup.add(back);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 }));
    base.position.y = 0.25;
    chairGroup.add(base);
    return chairGroup;
  } else if (subtype === 'desk') {
    const deskGroup = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.9), mat);
    top.position.y = 0.74;
    deskGroup.add(top);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
    for (const [lx, lz] of [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.74, 12), legMat);
      leg.position.set(lx, 0.37, lz);
      deskGroup.add(leg);
    }
    return deskGroup;
  } else if (subtype === 'pedestal') {
    const pedGroup = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.7), mat);
    base.position.y = 0.5;
    pedGroup.add(base);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.6, 0.66), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.3, roughness: 0.05 }));
    glass.position.y = 1.3;
    pedGroup.add(glass);
    return pedGroup;
  } else if (subtype === 'frame_art') {
    const frameGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.06), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }));
    frameGroup.add(frame);
    const canvasMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
    const canvas = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.08), canvasMat);
    canvas.position.z = 0.035;
    frameGroup.add(canvas);
    return frameGroup;
  } else {
    // Default box primitive
    return new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), mat);
  }
}

// 4. Instanciación de Objetos en la Escena
${propBlocks || '// No hay objetos adicionales'}

// 5. Iniciar Renderizado WebGL y WebXR
app.start();
console.log('✓ Experiencia VXR iniciada: "${escapeString(scene.projectName)}"');
`;
}

// =============================================================================
// Generator 3: HTML Autónomo (1 solo archivo)
// =============================================================================

export function generateHTMLCode(scene: VXRSceneExport): string {
  const safeTitle = escapeHTML(scene.projectName || 'Experiencia VXR');
  const bg = scene.environment.backgroundColor || '#080d1a';
  const camPos = scene.camera.initialPosition;
  const camFov = scene.camera.fov;
  const camTarget = scene.camera.initialTarget;

  // JSON safe payload for the client runtime
  const roomsJSON = JSON.stringify(scene.rooms);
  const connectionsJSON = JSON.stringify(scene.connections);
  const propsJSON = JSON.stringify(scene.props);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>${safeTitle} — Experiencia 3D VXR</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: ${bg};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      color: #fff;
    }
    #canvas-container {
      width: 100%;
      height: 100%;
      display: block;
      position: absolute;
      inset: 0;
    }
    /* Floating Minimal HUD */
    .hud-overlay {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 100;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .hud-title-box {
      background: rgba(8, 13, 26, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 10px;
      padding: 10px 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    }
    .hud-title {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .hud-badge {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.2);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.4);
    }
    .hud-sub {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .hud-tips {
      background: rgba(8, 13, 26, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 10.5px;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      gap: 10px;
      width: fit-content;
    }
    /* WebGL Error Banner */
    #webgl-error {
      display: none;
      position: absolute;
      inset: 0;
      background: #080d1a;
      z-index: 1000;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 24px;
      text-align: center;
    }
    #webgl-error h2 { font-size: 20px; color: #ef4444; margin-bottom: 8px; }
    #webgl-error p { font-size: 13px; color: #94a3b8; max-width: 480px; line-height: 1.6; }
  </style>

  <!-- Modern Three.js via Official ES Module Import Maps -->
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
      }
    }
  </script>
</head>
<body>
  <div id="canvas-container"></div>

  <!-- Minimalist HUD -->
  <div class="hud-overlay">
    <div class="hud-title-box">
      <div class="hud-title">
        <span>${safeTitle}</span>
        <span class="hud-badge">VXR 3D</span>
      </div>
      <div class="hud-sub">Exportado desde VXR Studio · Three.js Autónomo</div>
    </div>
    <div class="hud-tips">
      <span>🖱️ Clic izquierdo: Rotar</span>
      <span>•</span>
      <span>🖱️ Clic derecho: Mover (Pan)</span>
      <span>•</span>
      <span>🔍 Rueda: Zoom</span>
    </div>
  </div>

  <!-- WebGL Error Container -->
  <div id="webgl-error">
    <h2>⚠️ WebGL no disponible</h2>
    <p>Tu navegador o dispositivo no tiene activada la aceleración de hardware para WebGL. Actívala en la configuración para ver esta experiencia 3D.</p>
  </div>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    // 1. Validar compatibilidad WebGL
    const container = document.getElementById('canvas-container');
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL deshabilitado');
    } catch (e) {
      document.getElementById('webgl-error').style.display = 'flex';
      throw e;
    }

    // 2. Escena, Cámara y Renderizador
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('${bg}');

    const camera = new THREE.PerspectiveCamera(${camFov}, window.innerWidth / window.innerHeight, 0.1, 250);
    camera.position.set(${camPos[0]}, ${camPos[1]}, ${camPos[2]});

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 3. Controles OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(${camTarget[0]}, ${camTarget[1]}, ${camTarget[2]});
    controls.minDistance = 1.0;
    controls.maxDistance = 150.0;
    controls.screenSpacePanning = true;

    // 4. Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    dirLight.position.set(12, 22, 16);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.5);
    scene.add(hemiLight);

    // 5. Cuadrícula de Referencia y Ejes
    const grid = new THREE.GridHelper(60, 60, 0x38bdf8, 0x334155);
    grid.position.y = 0;
    scene.add(grid);

    const axes = new THREE.AxesHelper(5);
    axes.position.set(0, 0.01, 0);
    scene.add(axes);

    // 6. Temas Visuales para Salas
    const THEMES = {
      gallery: { floor: 0xe2d9cc, wall: 0xf8fafc, trim: 0xcbd5e1 },
      scifi: { floor: 0x0f172a, wall: 0x1e293b, trim: 0x00f0ff },
      office: { floor: 0x334155, wall: 0xf1f5f9, trim: 0x94a3b8 },
      cozy: { floor: 0x78350f, wall: 0xfef3c7, trim: 0x92400e },
      minimal: { floor: 0x18181b, wall: 0x27272a, trim: 0x52525b },
    };

    // 7. Carga de Datos de la Escena
    const roomsData = ${roomsJSON};
    const connectionsData = ${connectionsJSON};
    const propsData = ${propsJSON};

    // Construir Salas Arquitectónicas
    for (const r of roomsData) {
      const theme = THEMES[r.theme] || THEMES.gallery;
      const w = r.dimensions.width;
      const d = r.dimensions.depth;
      const h = r.dimensions.height || 4;
      const cx = r.center[0];
      const cz = r.center[2];
      const wallT = 0.25;

      const roomGroup = new THREE.Group();
      roomGroup.position.set(cx, 0, cz);

      // Suelo
      const floorGeo = new THREE.BoxGeometry(w, 0.2, d);
      const floorMat = new THREE.MeshStandardMaterial({ color: theme.floor, roughness: 0.5 });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(0, -0.1, 0);
      floorMesh.receiveShadow = true;
      roomGroup.add(floorMesh);

      // Muros perimetrales
      const wallMat = new THREE.MeshStandardMaterial({ color: theme.wall, roughness: 0.85 });

      // Muro Norte
      const wN = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallT), wallMat);
      wN.position.set(0, h / 2, -d / 2 + wallT / 2);
      wN.castShadow = true;
      roomGroup.add(wN);

      // Muro Sur
      const wS = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallT), wallMat);
      wS.position.set(0, h / 2, d / 2 - wallT / 2);
      wS.castShadow = true;
      roomGroup.add(wS);

      // Muro Este
      const wE = new THREE.Mesh(new THREE.BoxGeometry(wallT, h, d), wallMat);
      wE.position.set(w / 2 - wallT / 2, h / 2, 0);
      wE.castShadow = true;
      roomGroup.add(wE);

      // Muro Oeste
      const wW = new THREE.Mesh(new THREE.BoxGeometry(wallT, h, d), wallMat);
      wW.position.set(-w / 2 + wallT / 2, h / 2, 0);
      wW.castShadow = true;
      roomGroup.add(wW);

      scene.add(roomGroup);
    }

    // Construir Pasillos entre Salas Conectadas
    for (const c of connectionsData) {
      const fromRoom = roomsData.find((r) => r.id === c.fromRoomId);
      const toRoom = roomsData.find((r) => r.id === c.toRoomId);
      if (!fromRoom || !toRoom) continue;

      const corridorGroup = new THREE.Group();
      const midX = (fromRoom.center[0] + toRoom.center[0]) / 2;
      const midZ = (fromRoom.center[2] + toRoom.center[2]) / 2;
      const dx = Math.abs(fromRoom.center[0] - toRoom.center[0]);
      const dz = Math.abs(fromRoom.center[2] - toRoom.center[2]);

      const corridorLen = Math.max(dx, dz, 2);
      const corridorW = c.width || 3.0;

      const fGeo = dx >= dz
        ? new THREE.BoxGeometry(corridorLen, 0.2, corridorW)
        : new THREE.BoxGeometry(corridorW, 0.2, corridorLen);
      const fMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
      const fMesh = new THREE.Mesh(fGeo, fMat);
      fMesh.position.set(midX, -0.1, midZ);
      fMesh.receiveShadow = true;
      scene.add(fMesh);
    }

    // Fábrica de Objetos Procedurales
    function createMesh(p) {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(p.color || '#38bdf8'),
        roughness: 0.35,
        metalness: 0.15,
      });

      if (p.subtype === 'sphere') {
        return new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 16), mat);
      } else if (p.subtype === 'cylinder') {
        return new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.4, 32), mat);
      } else if (p.subtype === 'plane') {
        return new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 2.0), mat);
      } else if (p.subtype === 'cone') {
        return new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 32), mat);
      } else if (p.subtype === 'torus') {
        return new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.25, 16, 32), mat);
      } else if (p.subtype === 'chair') {
        const chairGroup = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.6), mat);
        seat.position.y = 0.5;
        chairGroup.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.06), mat);
        back.position.set(0, 0.85, -0.27);
        chairGroup.add(back);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 }));
        base.position.y = 0.25;
        chairGroup.add(base);
        return chairGroup;
      } else if (p.subtype === 'desk') {
        const deskGroup = new THREE.Group();
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.9), mat);
        top.position.y = 0.74;
        deskGroup.add(top);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 });
        for (const [lx, lz] of [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.74, 12), legMat);
          leg.position.set(lx, 0.37, lz);
          deskGroup.add(leg);
        }
        return deskGroup;
      } else if (p.subtype === 'pedestal') {
        const pedGroup = new THREE.Group();
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.7), mat);
        base.position.y = 0.5;
        pedGroup.add(base);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.6, 0.66), new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, roughness: 0.05 }));
        glass.position.y = 1.3;
        pedGroup.add(glass);
        return pedGroup;
      } else if (p.subtype === 'frame_art') {
        const frameGroup = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.06), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }));
        frameGroup.add(frame);
        const canvasMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color || '#38bdf8') });
        const canvas = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.08), canvasMat);
        canvas.position.z = 0.035;
        frameGroup.add(canvas);
        return frameGroup;
      } else {
        return new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), mat);
      }
    }

    // Instanciar Objetos
    for (const p of propsData) {
      const obj = createMesh(p);
      obj.name = p.name;
      obj.position.set(p.position[0], p.position[1], p.position[2]);
      obj.rotation.set(
        (p.rotationDeg[0] * Math.PI) / 180,
        (p.rotationDeg[1] * Math.PI) / 180,
        (p.rotationDeg[2] * Math.PI) / 180
      );
      obj.scale.set(p.scale[0], p.scale[1], p.scale[2]);
      obj.castShadow = true;
      obj.receiveShadow = true;
      scene.add(obj);
    }

    // 8. Bucle de Renderizado Continuo
    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    // 9. Manejador de Redimensionamiento
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    console.log('✓ Escena 3D VXR cargada con éxito.');
  </script>
</body>
</html>`;
}

// =============================================================================
// Syntax Highlighter for Code Viewer
// =============================================================================

export function highlightSyntax(code: string, format: 'ts' | 'html' | 'json'): string {
  if (!code) return '';

  const escaped = escapeHTML(code);

  if (format === 'json') {
    return escaped
      .replace(/(&quot;(?:(?!&quot;).)*&quot;)\s*:/g, '<span class="hl-func">$1</span>:')
      .replace(/:\s*(&quot;(?:(?!&quot;).)*&quot;)/g, ': <span class="hl-string">$1</span>')
      .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="hl-number">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="hl-keyword">$1</span>');
  }

  if (format === 'ts') {
    // Keywords
    let result = escaped.replace(
      /\b(import|export|from|const|let|var|function|return|if|else|new|type|interface|as|true|false|async|await)\b/g,
      '<span class="hl-keyword">$1</span>'
    );
    // Comments
    result = result.replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>');
    // Strings
    result = result.replace(/('(?:\\'|[^'])*')/g, '<span class="hl-string">$1</span>');
    // Numbers
    result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>');
    return result;
  }

  if (format === 'html') {
    let result = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, (m) => `<span class="hl-comment">${m}</span>`);
    result = result.replace(/([a-zA-Z\-]+)=(&quot;(?:(?!&quot;).)*&quot;)/g, (_, attr, val) => `<span class="hl-func">${attr}</span>=<span class="hl-string">${val}</span>`);
    result = result.replace(/(&lt;\/?)([a-zA-Z0-9\-]+)/g, (_, prefix, tag) => `${prefix}<span class="hl-tag">${tag}</span>`);
    return result;
  }

  return escaped;
}

// =============================================================================
// String Utility Helpers
// =============================================================================

function escapeString(str: string): string {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
