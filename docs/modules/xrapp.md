# Módulo: XRApp (`@vxr/core`)

La clase `XRApp` es la fachada principal y punto de entrada para aplicaciones construidas con VXR.

---

## Firma y Constructor

```typescript
export class XRApp {
  public readonly scene: XRScene;
  public readonly renderer: XRRenderer;
  public readonly session: XRSession;
  public readonly assets: XRAssetManager;
  public readonly controls: OrbitControls | null;

  constructor(options?: XRAppOptions);
}
```

### Opciones de Configuración (`XRAppOptions`)
| Opción | Tipo | Por Defecto | Descripción |
| :--- | :--- | :---: | :--- |
| `container` | `HTMLElement \| string` | `document.body` | Elemento o selector DOM donde se monta el canvas. |
| `canvas` | `HTMLCanvasElement` | `undefined` | Canvas existente opcional. |
| `cameraPosition` | `[number, number, number]` | `[0, 1.6, 3.5]` | Posición inicial de la cámara en metros. |
| `fov` | `number` | `60` | Campo de visión vertical en grados. |
| `near` | `number` | `0.1` | Plano de corte cercano en metros. |
| `far` | `number` | `200` | Plano de corte lejano en metros. |
| `enableShadows` | `boolean` | `true` | Activa mapas de sombra suaves. |
| `enableGrid` | `boolean` | `true` | Incluye rejilla y plano de suelo para sombras. |
| `autoOrbitControls`| `boolean` | `true` | Activa controles de ratón OrbitControls en PC. |
| `autoVRButton` | `boolean` | `true` | Inyecta el botón flotante ENTER VR en el DOM. |
| `pixelRatioCap` | `number` | `1.5` | Límite máximo de densidad de píxeles. |

---

## Métodos Principales

### `loadModel(source, options?): Promise<LoadedModel>`
Descarga un archivo glTF/GLB, lo coloca en el plano $Y=0$, calcula métricas, lo añade a la escena y ajusta el encuadre orbital.
```typescript
const model = await app.loadModel('/models/building.glb', {
  autoGround: true,
  autoCenter: true
});
```

### `resetCamera(targetPosition?, targetLookAt?): void`
Restablece la posición y el objetivo orbital a los valores iniciales.
```typescript
app.resetCamera();
```

### `raycastPointer(event, objects?, recursive?): THREE.Intersection[]`
Proyecta un rayo desde las coordenadas de pantalla de un evento de ratón o táctil.
```typescript
domElement.addEventListener('pointerdown', (event) => {
  const hits = app.raycastPointer(event, [model.group]);
  if (hits.length > 0) {
    console.log('Objeto tocado:', hits[0].object);
  }
});
```

### `raycastController(index, objects?, recursive?): THREE.Intersection[]`
Proyecta un rayo en 3D en la dirección que apunta el mando WebXR (0: primario, 1: secundario).

### `onControllerSelect(callback): () => void`
Registra un callback que se ejecuta al presionar el gatillo del mando en VR. Devuelve una función para desuscribirse.

### `onUpdate(callback): () => void`
Registra un hook por fotograma que recibe `(delta: number, elapsed: number)`.

### `start(): this` y `stop(): this`
Inicia o pausa el bucle de animación y renderizado.

### `dispose(): void`
Libera todos los recursos: destruye controles, cierra sesiones WebXR, limpia modelos y destruye el contexto WebGL.
