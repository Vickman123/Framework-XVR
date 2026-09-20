# Especificación de la API de VXR (TypeScript)

> Contratos de interfaces, firmas de métodos y ejemplos prácticos de la API pública propuesta para VXR.

---

## 1. Contratos Fundamentales del Core (`@vxr/core`)

### 1.1. Inicialización del Motor (`VXREngine`)

```typescript
export interface VXREngineOptions {
  containerId?: string;
  canvas?: HTMLCanvasElement;
  enableShadows?: boolean;
  pixelRatioCap?: number;
  questOptimizations?: boolean;
  antialias?: boolean;
  toneMapping?: THREE.ToneMapping;
  toneMappingExposure?: number;
}

export class VXREngine {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly xrRig: THREE.Group;
  public readonly sessionManager: SessionManager;
  public readonly inputManager: InputManager;
  public readonly locomotion: LocomotionManager;
  public readonly interactions: InteractionManager;

  constructor(options?: VXREngineOptions);

  /** Registra un bucle de actualización por fotograma */
  public addUpdatable(callback: (delta: number, elapsed: number) => void): () => void;

  /** Inicia el bucle de animación compatible con WebGL y WebXR */
  public start(): void;

  /** Detiene el bucle y destruye recursos asociados */
  public dispose(): void;
}
```

---

### 1.2. Abstracción de Entrada (`IInputSource`)

```typescript
export interface Vector2D {
  x: number;
  z: number;
}

export interface LookDelta {
  x: number;
  y: number;
}

export interface IInputSource {
  init(): void;
  update(delta: number): void;
  dispose(): void;

  /** Vector de movimiento normalizado (WASD o thumbstick izquierdo) */
  getMovement(): Vector2D;

  /** Desplazamiento angular de mirada (ratón de PC) */
  getLookDelta(): LookDelta;

  /** Estados y eventos de acción rápida */
  isActionHeld(actionName: string): boolean;
  consumeAction(actionName: string): boolean;

  /** Ejecución de pulsos hápticos en mandos (si está soportado) */
  triggerHaptic?(intensity: number, durationMs: number, hand: 'left' | 'right'): void;
}
```

---

### 1.3. Objetos Agarrables e Interactivos (`IGrabbable`)

```typescript
export interface GrabbableOptions {
  id: string;
  rootMesh?: THREE.Object3D;
  holdOffset?: THREE.Vector3;
  holdRotation?: THREE.Euler;
  allowRotationInspection?: boolean;
  snapSound?: boolean;
  highlightEmissiveColor?: number;
}

export interface IGrabbable {
  readonly id: string;
  readonly group: THREE.Group;

  /** Mallas sobre las que se realiza la prueba de raycast */
  getRaycastTargets(): THREE.Object3D[];

  /** Activa o desactiva la retroalimentación de hover (iluminación) */
  setHover(hovered: boolean): void;

  /** Ancla el objeto a un punto de sujeción (mando o mano del jugador) */
  grab(holder: THREE.Object3D): void;

  /** Suelta el objeto en una posición y rotación específica */
  release(dropPosition?: THREE.Vector3, dropRotation?: THREE.Euler): void;

  /** Consulta si el objeto está actualmente sostenido */
  isGrabbed(): boolean;

  /** Rota el objeto sobre su eje local para inspeccionarlo */
  rotateHeld(deltaAngle: number): void;

  /** Actualización por fotograma (interpolaciones, físicas suaves) */
  update(delta: number): void;
}
```

---

### 1.4. Zonas de Encastre Magnético (`SnapTarget`)

```typescript
export interface SnapTargetOptions {
  id: string;
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  acceptedTypes: string[];
  radius?: number; // Radio de atracción magnética en metros
  onSnap?: (grabbable: IGrabbable) => void;
  onUnsnap?: (grabbable: IGrabbable) => void;
}

export class SnapTarget {
  public readonly id: string;
  public readonly position: THREE.Vector3;
  public occupiedBy: IGrabbable | null;

  constructor(options: SnapTargetOptions);
  public checkProximity(grabbable: IGrabbable): boolean;
  public snap(grabbable: IGrabbable): void;
  public release(): void;
}
```

---

## 2. API de Módulos Especializados

### 2.1. `@vxr/ui`: Pantallas Virtuales Diegéticas (`VirtualScreen`)

```typescript
export interface VirtualScreenOptions {
  widthPx: number;
  heightPx: number;
  meshWidthMeters: number;
  meshHeightMeters: number;
  interactive?: boolean;
}

export class VirtualScreen {
  public readonly mesh: THREE.Mesh;
  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  public readonly texture: THREE.CanvasTexture;

  constructor(options: VirtualScreenOptions);

  /** Marca el canvas para actualización en el siguiente fotograma (evita coste continuo) */
  public markDirty(): void;

  /** Traduce la coordenada UV de un impacto de raycast a eventos de interfaz en 2D */
  public handleRaycastPointer(uv: THREE.Vector2, eventType: 'move' | 'down' | 'up' | 'click'): void;

  /** Añade un botón virtual con área de impacto y callback */
  public registerButton(button: {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    onClick: () => void;
  }): void;
}
```

---

### 2.2. `@vxr/simulation`: Motor de Tareas y Capacitación (`TaskEngine`)

```typescript
export interface TaskStep {
  id: string;
  title: string;
  description: string;
  requiredEvents: string[]; // Eventos del EventBus requeridos para completar el paso
  pointsReward: number;
  isOptional?: boolean;
  onEnter?: () => void;
  onComplete?: () => void;
}

export class TaskEngine {
  public currentStepIndex: number;
  public isCompleted: boolean;

  constructor(steps: TaskStep[]);

  public start(): void;
  public completeCurrentStep(): void;
  public failStep(reason: string, penaltyPoints?: number): void;
  public getProgressPercentage(): number;
  public onStepChanged(callback: (step: TaskStep) => void): () => void;
}
```

---

### 2.3. `@vxr/assets`: Carga y Métricas de Modelos (`ModelLoader`)

```typescript
export interface ModelMetrics {
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  center: [number, number, number];
  vertexCount: number;
  triangleCount: number;
  meshCount: number;
  isHeavy: boolean;
  recommendedScale: number;
  fileSizeBytes?: number;
}

export interface LoadModelResult {
  scene: THREE.Group;
  metrics: ModelMetrics;
  dispose: () => void;
}

export class ModelLoader {
  constructor(options?: { dracoPath?: string });

  /** Carga un modelo desde URL o archivo File local (arrastrado al navegador) */
  public load(source: string | File, onProgress?: (percent: number) => void): Promise<LoadModelResult>;
}
```

---

## 3. Ejemplos Prácticos de Uso

### Ejemplo 1: Inicialización Básica de una Experiencia VXR

```typescript
import { VXREngine } from '@vxr/core';
import * as THREE from 'three';

// 1. Inicializar el motor con ajustes automáticos para Meta Quest y PC
const engine = new VXREngine({
  containerId: 'app',
  enableShadows: true,
  questOptimizations: true
});

// 2. Añadir iluminación estándar Three.js
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
const sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
sunLight.position.set(5, 10, 7);
sunLight.castShadow = true;
engine.scene.add(ambientLight, sunLight);

// 3. Crear un suelo interactivo compatible con teletransporte
const floorGeo = new THREE.PlaneGeometry(20, 20);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
engine.scene.add(floor);

// 4. Iniciar la experiencia
engine.start();
console.log('Experiencia VXR iniciada correctamente.');
```

---

### Ejemplo 2: Creación de un Objeto Agarrable con Bahía de Encastre

```typescript
import { GrabbableBase, SnapTarget } from '@vxr/core';
import * as THREE from 'three';

// 1. Crear un objeto interactivo (Herramienta o Componente)
class WrenchTool extends GrabbableBase {
  constructor() {
    const geo = new THREE.BoxGeometry(0.08, 0.25, 0.04);
    const mat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    super({
      id: 'tool_wrench_01',
      rootMesh: mesh,
      allowRotationInspection: true
    });
  }
}

const tool = new WrenchTool();
engine.interactions.registerGrabbable(tool);
engine.scene.add(tool.group);

// 2. Crear una zona de encastre magnético en una mesa de trabajo
const toolSlot = new SnapTarget({
  id: 'slot_workbench_01',
  position: new THREE.Vector3(0.5, 0.9, -0.4),
  acceptedTypes: ['tool_wrench_01'],
  radius: 0.15,
  onSnap: (item) => {
    console.log(`Herramienta acoplada en la bahía: ${item.id}`);
  }
});
engine.interactions.registerSnapTarget(toolSlot);
```

---

### Ejemplo 3: Monitor Virtual Interactivo en 3D (`VirtualScreen`)

```typescript
import { VirtualScreen } from '@vxr/ui';
import * as THREE from 'three';

// 1. Crear pantalla virtual de 1024x640 proyectada sobre un plano 3D de 0.8m x 0.5m
const screen = new VirtualScreen({
  widthPx: 1024,
  heightPx: 640,
  meshWidthMeters: 0.8,
  meshHeightMeters: 0.5,
  interactive: true
});

screen.mesh.position.set(0, 1.2, -1.0);
engine.scene.add(screen.mesh);

// 2. Dibujar interfaz 2D dentro del lienzo del monitor
const ctx = screen.ctx;
ctx.fillStyle = '#0f172a';
ctx.fillRect(0, 0, 1024, 640);

ctx.fillStyle = '#38bdf8';
ctx.font = 'bold 36px sans-serif';
ctx.fillText('TERMINAL DE CONTROL DE OPERACIONES', 60, 80);

// 3. Registrar un botón táctil con coordenadas 2D en el monitor
screen.registerButton({
  id: 'btn_confirm_loan',
  x: 60,
  y: 450,
  w: 280,
  h: 70,
  onClick: () => {
    console.log('Botón presionado con el rayo láser desde WebXR o ratón de PC');
  }
});

// 4. Marcar para transferir los cambios de dibujo a la GPU
screen.markDirty();
```

---

### Ejemplo 4: Configuración de un Procedimiento de Capacitación (`TaskEngine`)

```typescript
import { TaskEngine } from '@vxr/simulation';
import { events } from '@vxr/core';

// 1. Definir el protocolo formativo oficial paso a paso
const trainingProtocol = new TaskEngine([
  {
    id: 'step_scan_id',
    title: '1. Identificación del Alumno',
    description: 'Solicita la credencial institucional y colócala en el lector NFC.',
    requiredEvents: ['NFC_SCANNED'],
    pointsReward: 50
  },
  {
    id: 'step_inspect_laptop',
    title: '2. Inspección Técnica del Equipo',
    description: 'Abre la laptop y comprueba que la pantalla y teclado no presenten daños.',
    requiredEvents: ['LAPTOP_INSPECTION_CONFIRMED'],
    pointsReward: 100
  },
  {
    id: 'step_deliver',
    title: '3. Entrega de Equipo',
    description: 'Entrega la laptop y devuelve la credencial al estudiante.',
    requiredEvents: ['LAPTOP_DELIVERED', 'CREDENTIAL_RETURNED'],
    pointsReward: 100
  }
]);

// 2. Reaccionar a cambios en la guía de inducción
trainingProtocol.onStepChanged((currentStep) => {
  console.log(`Nuevo paso activo: ${currentStep.title}`);
});

trainingProtocol.start();
```
