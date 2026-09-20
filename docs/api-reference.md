# VXR Core v0.1.0 — API Reference

Esta es la referencia completa y exhaustiva de la API pública expuesta por `@vxr/core` v0.1.0.

---

## Índice

1. [Punto de Entrada (`@vxr/core`)](#punto-de-entrada-vxrcore)
2. [`XRApp`](#xrapp)
3. [`XRScene`](#xrscene)
4. [`XRRenderer`](#xrrenderer)
5. [`XRSession`](#xrsession)
6. [`XRAssetManager`](#xrassetmanager)
7. [Tipos e Interfaces](#tipos-e-interfaces)
   - [`XRAppOptions`](#xrappoptions)
   - [`LoadedModel`](#loadedmodel)
   - [`LoadModelOptions`](#loadmodeloptions)
   - [`ModelMetrics`](#modelmetrics)
   - [`XRSceneOptions`](#xrsceneoptions)
   - [`EnvironmentPreset`](#environmentpreset)
   - [`UpdatableCallback`](#updatablecallback)
   - [`SessionStateCallback`](#sessionstatecallback)
   - [`ControllerSelectCallback`](#controllerselectcallback)

---

## Punto de Entrada (`@vxr/core`)

```typescript
import {
  XRApp,
  XRScene,
  XRRenderer,
  XRSession,
  XRAssetManager,
  // Types
  type XRAppOptions,
  type XRSceneOptions,
  type EnvironmentPreset,
  type LoadedModel,
  type LoadModelOptions,
  type ModelMetrics,
  type UpdatableCallback,
  type SessionStateCallback,
  type ControllerSelectCallback,
} from '@vxr/core';
```

---

## `XRApp`

Clase fachada orquestadora de alto nivel. Inicializa la escena, cámara, renderizador, controles de órbita para escritorio, botón WebXR y gestor de assets.

### Constructor

```typescript
new XRApp(options?: XRAppOptions): XRApp
```

**Parámetros:**
- `options` *(opcional)*: Objeto [`XRAppOptions`](#xrappoptions) que define opciones de contenedor, cámara, sombras, grid, WebXR y controles.

### Propiedades Públicas

| Propiedad | Tipo | Descripción |
|---|---|---|
| `scene` | `XRScene` | Instancia de la abstracción de escena VXR. |
| `renderer` | `XRRenderer` | Instancia del renderizador optimizado VXR. |
| `session` | `XRSession` | Gestor del ciclo de vida WebXR y controladores. |
| `assets` | `XRAssetManager` | Gestor de carga de modelos 3D y optimización de memoria. |
| `camera` | `THREE.PerspectiveCamera` | Cámara Three.js configurada a nivel de ojos humano (1.6m). |
| `threeScene` | `THREE.Scene` | Acceso directo de conveniencia a la escena subyacente de Three.js. |
| `threeRenderer` | `THREE.WebGLRenderer` | Acceso directo de conveniencia al renderizador Three.js. |
| `orbitControls` | `OrbitControls \| null` | Controles de órbita activos en modo escritorio (inactivos en VR). |
| `isRunning` | `boolean` | `true` si el animation loop está activo. |

### Métodos Públicos

#### `loadModel(path: string, options?: LoadModelOptions): Promise<LoadedModel>`
Carga un modelo GLTF/GLB, calcula sus métricas geométricas, lo centra, lo apoya en Y=0 (auto-grounding) y lo añade directamente a la escena.

```typescript
const model = await app.loadModel('/models/robot.glb', {
  autoGround: true,
  autoCenter: true,
  onProgress: (p) => console.log(`Cargando: ${p}%`),
});
```

#### `start(): void`
Inicia el bucle de renderizado mediante `threeRenderer.setAnimationLoop`.

```typescript
app.start();
```

#### `stop(): void`
Detiene el bucle de renderizado.

```typescript
app.stop();
```

#### `onUpdate(callback: UpdatableCallback): () => void`
Registra una función a ejecutar en cada frame. Retorna una función de desuscripción para limpiar el callback.

```typescript
const unsubscribe = app.onUpdate((delta, elapsed) => {
  rotor.rotation.y += delta * 2.0;
});

// Para desuscribir:
unsubscribe();
```

#### `raycastPointer(event: MouseEvent | TouchEvent | { clientX: number; clientY: number }, targetObjects?: THREE.Object3D[]): THREE.Intersection[]`
Ejecuta un raycast en espacio de pantalla 2D proyectado al mundo 3D (para escritorio o móvil).
- Si `targetObjects` no se especifica, busca intersecciones en todos los hijos de la escena.
- Retorna la lista ordenada de intersecciones de Three.js.

```typescript
window.addEventListener('click', (e) => {
  const hits = app.raycastPointer(e, [interactiveGroup]);
  if (hits.length > 0) {
    console.log('Objeto clickeado:', hits[0].object.name);
  }
});
```

#### `raycastController(controllerIndex?: number, targetObjects?: THREE.Object3D[]): THREE.Intersection[]`
Ejecuta un raycast 3D desde el rayo del controlador WebXR especificado (`0` = primario, `1` = secundario).

```typescript
const hits = app.raycastController(0, interactables);
if (hits.length > 0) {
  // Objeto apuntado por el láser del visor VR
}
```

#### `getControllerRay(controllerIndex?: number): THREE.Ray | null`
Retorna el rayo 3D (`origin` y `direction`) del controlador WebXR indicado en coordenadas de mundo.

#### `setEnvironment(preset: EnvironmentPreset): void`
Cambia el preset de iluminación y fondo de la escena (`'studio'`, `'outdoor'`, `'dark'`, `'neutral'`).

```typescript
app.setEnvironment('dark');
```

#### `setClearColor(color: number | string, alpha?: number): void`
Ajusta el color de fondo y transparencia del renderizador.

```typescript
app.setClearColor(0x101015, 1.0);
```

#### `getPerformanceMetrics(): PerformanceMetrics`
Retorna métricas de rendimiento y memoria en tiempo real:
```typescript
interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  memoryGeometries?: number;
  memoryTextures?: number;
}
```

#### `dispose(): void`
Libera todos los recursos GPU, destruye geometrías, materiales, event listeners de ventana y detiene el animation loop.

---

## `XRScene`

Abstracción de la escena 3D. Controla la jerarquía de nodos, presets de iluminación calibrados, piso de referencia y fondo.

### Constructor

```typescript
new XRScene(options?: XRSceneOptions): XRScene
```

### Propiedades Públicas

| Propiedad | Tipo | Descripción |
|---|---|---|
| `threeScene` | `THREE.Scene` | Instancia de `THREE.Scene` nativa. |
| `gridHelper` | `THREE.GridHelper \| null` | Grid de referencia métrico de 20x20m (si fue habilitado). |
| `ambientLight` | `THREE.AmbientLight` | Luz ambiental base. |
| `directionalLight` | `THREE.DirectionalLight` | Luz solar principal con configuración de sombras en alta definición. |
| `fillLight` | `THREE.DirectionalLight` | Luz de relleno suave opuesta a la luz principal. |

### Métodos Públicos

#### `add(...objects: THREE.Object3D[]): void`
Añade uno o varios objetos 3D a la escena.

#### `remove(...objects: THREE.Object3D[]): void`
Remueve uno o varios objetos 3D de la escena.

#### `setEnvironment(preset: EnvironmentPreset): void`
Aplica configuraciones predeterminadas de color de fondo, intensidad de luz y sombras:
- `'studio'`: Fondo gris azulado (#181820), luz cálida (1.5x), luz de relleno fresca.
- `'outdoor'`: Fondo celeste (#87ceeb), luz solar intensa (2.0x), relleno ambiental.
- `'dark'`: Fondo negro (#08080c), iluminación tenue dramática (0.4x).
- `'neutral'`: Fondo gris neutro (#222226), balance fotográfico (1.0x).

#### `enableGrid(enabled: boolean): void`
Alterna la visibilidad del grid de suelo métrico.

#### `setBackground(color: number | string): void`
Establece un color sólido de fondo en la escena Three.js.

#### `dispose(): void`
Recorre y destruye todas las luces y helpers registrados.

---

## `XRRenderer`

Abstracción de `THREE.WebGLRenderer` con optimizaciones de hardware preconfiguradas para WebXR móvil (Meta Quest 2/3/Pro).

### Constructor

```typescript
new XRRenderer(canvas?: HTMLCanvasElement, options?: {
  antialias?: boolean;
  enableShadows?: boolean;
  pixelRatioCap?: number;
  container?: HTMLElement | string;
}): XRRenderer
```

### Propiedades Públicas

| Propiedad | Tipo | Descripción |
|---|---|---|
| `threeRenderer` | `THREE.WebGLRenderer` | Instancia nativa configurada con WebXR habilitado (`xr.enabled = true`). |
| `canvas` | `HTMLCanvasElement` | Canvas de renderizado WebGL2. |
| `container` | `HTMLElement` | Elemento DOM que contiene el canvas. |
| `pixelRatioCap` | `number` | Límite superior para `devicePixelRatio` (por defecto `1.5`). |

### Métodos Públicos

#### `render(scene: THREE.Scene, camera: THREE.Camera): void`
Ejecuta el renderizado de un frame.

#### `setAnimationLoop(callback: (time: number, frame?: XRFrame) => void): void`
Registra el callback del bucle nativo compatible con WebXR (`requestVideoFrameCallback` / `XRSession.requestAnimationFrame`).

#### `handleResize(camera: THREE.PerspectiveCamera): void`
Actualiza el tamaño del viewport y la relación de aspecto (`aspect`) de la cámara al redimensionar la ventana.

#### `getPerformanceMetrics(): RenderMetrics`
Retorna métricas de GPU (`drawCalls`, `triangles`, `geometries`, `textures`).

#### `dispose(): void`
Destruye el contexto WebGL (`forceContextLoss`), elimina el canvas del DOM si fue inyectado por VXR y desvincula listeners.

---

## `XRSession`

Abstracción del ciclo de vida WebXR, botón de entrada VR y gestión de controladores con punteros láser interactivos.

### Constructor

```typescript
new XRSession(renderer: THREE.WebGLRenderer, scene: THREE.Scene): XRSession
```

### Propiedades Públicas

| Propiedad | Tipo | Descripción |
|---|---|---|
| `active` | `boolean` | `true` si el visor está actualmente en una sesión inmersiva (`immersive-vr`). |
| `session` | `any` | Objeto de sesión WebXR nativo de la API del navegador. |
| `controller1` | `THREE.XRTargetRaySpace \| null` | Rayo de objetivo del controlador 0 (mano derecha/primaria). |
| `controller2` | `THREE.XRTargetRaySpace \| null` | Rayo de objetivo del controlador 1 (mano izquierda/secundaria). |
| `controllerGrip1` | `THREE.XRGripSpace \| null` | Pose del agarre físico del controlador 0. |
| `controllerGrip2` | `THREE.XRGripSpace \| null` | Pose del agarre físico del controlador 1. |

### Métodos Públicos

#### `initControllers(): void`
Construye la jerarquía visual de los controladores, genera las líneas de láser (geometría de 5 metros semitransparente) y enlaza eventos de entrada de WebXR.

#### `createVRButton(): HTMLElement`
Crea el botón accesible "ENTER VR" o "VR NOT SUPPORTED" con estilos modernos preconfigurados y lógica de solicitud de sesión inmersiva.

#### `onStateChange(callback: SessionStateCallback): () => void`
Registra un listener que se dispara al entrar o salir de una sesión inmersiva. Retorna función de desuscripción.

```typescript
app.session.onStateChange((active, session) => {
  if (active) {
    console.log('Entrando a WebXR Inmersivo');
  } else {
    console.log('Regresando a modo escritorio');
  }
});
```

#### `onSelect(callback: ControllerSelectCallback): () => void`
Registra un listener para el evento de gatillo principal (`selectstart` / `select`) del controlador VR.

```typescript
app.session.onSelect((event, controllerIndex) => {
  console.log(`Gatillo presionado en controlador: ${controllerIndex}`);
});
```

#### `getControllerRay(controllerIndex: number): THREE.Ray | null`
Calcula y retorna el rayo matemático 3D (`THREE.Ray`) proyectado desde la punta del controlador en el espacio de mundo.

#### `raycast(controllerIndex: number, targetObjects: THREE.Object3D[]): THREE.Intersection[]`
Calcula intersecciones entre el rayo del controlador y los objetos provistos.

#### `dispose(): void`
Cierra la sesión WebXR si está activa, remueve los controladores de la escena y elimina listeners.

---

## `XRAssetManager`

Gestor de carga de modelos 3D con integración opcional de DRACO y utilidades geométricas de normalización y limpieza.

### Constructor

```typescript
new XRAssetManager(dracoPath?: string): XRAssetManager
```

**Parámetros:**
- `dracoPath` *(opcional)*: URL o ruta local a los decodificadores DRACO WebAssembly. Si se omite, usa CDN oficial de Three.js.

### Propiedades Públicas

| Propiedad | Tipo | Descripción |
|---|---|---|
| `gltfLoader` | `GLTFLoader` | Instancia nativa de `three/addons/loaders/GLTFLoader.js`. |
| `dracoLoader` | `DRACOLoader \| null` | Instancia de `DRACOLoader` configurada. |

### Métodos Públicos

#### `loadGLTF(path: string, options?: LoadModelOptions): Promise<LoadedModel>`
Carga un archivo `.glb` o `.gltf`. Aplica automáticamente `autoGround` (Y=0) y `autoCenter` (X=0, Z=0) si están activados, genera sombras en los meshes hijos, y computa el reporte de métricas.

#### `computeMetrics(object: THREE.Object3D): ModelMetrics`
Calcula recursivamente:
- Dimensiones de la caja envolvente (AABB) en metros (`width`, `height`, `depth`).
- Centro geométrico en coordenadas locales.
- Conteo total de vértices, triángulos y mallas individuales.

#### `groundObject(object: THREE.Object3D): void`
Ajusta la posición vertical del objeto para que su punto más bajo coincida exactamente con el plano $Y = 0$.

#### `centerObject(object: THREE.Object3D): void`
Desplaza el objeto en los ejes $X$ y $Z$ para que su centro coincida con el origen $(0, 0)$.

#### `disposeModel(model: LoadedModel): void`
Recorre la jerarquía del modelo liberando `geometry.dispose()`, `material.dispose()`, y texturas GPU asociadas (`map`, `normalMap`, etc.).

#### `dispose(): void`
Destruye la instancia del decodificador DRACO si fue instanciada.

---

## Tipos e Interfaces

### `XRAppOptions`

```typescript
export interface XRAppOptions {
  /** Contenedor DOM (selector CSS o elemento) donde montar el canvas. Por defecto: document.body */
  container?: HTMLElement | string;

  /** Canvas HTML personalizado. Si se omite, se crea uno automáticamente. */
  canvas?: HTMLCanvasElement;

  /** Activar cálculo y mapeo de sombras PCF Soft. Por defecto: true */
  enableShadows?: boolean;

  /** Activar plano y rejilla métrica de suelo. Por defecto: true */
  enableGrid?: boolean;

  /** Límite superior para devicePixelRatio (preserva batería en VR). Por defecto: 1.5 */
  pixelRatioCap?: number;

  /** Posición inicial de la cámara [x, y, z] en metros. Por defecto: [0, 1.6, 3.5] */
  cameraPosition?: [number, number, number];

  /** Campo de visión vertical en grados. Por defecto: 60 */
  fov?: number;

  /** Plano cercano de corte en metros. Por defecto: 0.1 */
  near?: number;

  /** Plano lejano de corte en metros. Por defecto: 200 */
  far?: number;

  /** Activar antialiasing WebGL. Por defecto: true */
  antialias?: boolean;

  /** Habilitar controles de ratón OrbitControls en escritorio. Por defecto: true */
  autoOrbitControls?: boolean;

  /** Montar botón flotante 'ENTER VR'. Por defecto: true */
  autoVRButton?: boolean;
}
```

### `LoadedModel`

```typescript
export interface LoadedModel {
  /** Grupo contenedor raíz con posicionamiento normalizado */
  group: THREE.Group;

  /** Métricas geométricas computadas */
  metrics: ModelMetrics;

  /** Objeto crudo devuelto por GLTFLoader */
  rawGltf: GLTF;

  /** Función para liberar memoria GPU de este modelo específico */
  dispose: () => void;
}
```

### `LoadModelOptions`

```typescript
export interface LoadModelOptions {
  /** Apoyar la base del modelo sobre el suelo Y = 0. Por defecto: true */
  autoGround?: boolean;

  /** Centrar el modelo en X = 0, Z = 0. Por defecto: true */
  autoCenter?: boolean;

  /** Ruta personalizada a los decodificadores DRACO */
  dracoPath?: string;

  /** Callback de progreso de descarga (0 a 100) */
  onProgress?: (percent: number) => void;
}
```

### `ModelMetrics`

```typescript
export interface ModelMetrics {
  /** Dimensiones físicas de la caja envolvente en metros */
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  /** Coordenadas del centro volumétrico */
  center: [number, number, number];
  /** Conteo total de vértices en todas las mallas */
  vertexCount: number;
  /** Conteo total de polígonos / triángulos */
  triangleCount: number;
  /** Número de nodos THREE.Mesh individuales en la jerarquía */
  meshCount: number;
}
```

### `XRSceneOptions`

```typescript
export interface XRSceneOptions {
  /** Habilitar rejilla de suelo de 20x20m. Por defecto: true */
  enableGrid?: boolean;
  /** Preset de iluminación inicial. Por defecto: 'studio' */
  preset?: EnvironmentPreset;
}
```

### `EnvironmentPreset`

```typescript
export type EnvironmentPreset = 'studio' | 'outdoor' | 'dark' | 'neutral';
```

### `UpdatableCallback`

```typescript
export type UpdatableCallback = (delta: number, elapsed: number) => void;
```

### `SessionStateCallback`

```typescript
export type SessionStateCallback = (active: boolean, session: XRSession | null) => void;
```

### `ControllerSelectCallback`

```typescript
export type ControllerSelectCallback = (event: THREE.Event, controllerIndex: number) => void;
```
