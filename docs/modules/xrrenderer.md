# Módulo: XRRenderer (`@vxr/core`)

Encapsula `THREE.WebGLRenderer`, la cámara principal, el redimensionamiento responsivo y el bucle de animación WebXR.

---

## Firma

```typescript
export class XRRenderer {
  public readonly nativeRenderer: THREE.WebGLRenderer;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly container: HTMLElement;
  public get domElement(): HTMLCanvasElement;

  constructor(options?: XRAppOptions);
}
```

---

## Capacidades Principales

### Bucle de Animación Unificado (`start` / `stop`)
Utiliza `renderer.setAnimationLoop()` internamente para garantizar que la animación funcione tanto en monitores tradicionales como en visores estéreo WebXR sincronizados a 72/90Hz.

### Registro de Callbacks (`addUpdatable`)
```typescript
const unsubscribe = app.renderer.addUpdatable((delta, elapsed) => {
  // delta = segundos desde el frame anterior
  // elapsed = segundos totales desde el inicio
});
```

### Protección de Pixel Ratio
Calcula `Math.min(window.devicePixelRatio, pixelRatioCap)` evitando que pantallas de alta densidad o visores autónomos saturen la tasa de fill-rate de la GPU.
