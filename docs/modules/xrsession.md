# Módulo: XRSession (`@vxr/core`)

Gestiona la conexión con la WebXR Device API, el ciclo de vida de la sesión inmersiva, los mandos 6DoF y los rayos láser.

---

## Firma

```typescript
export class XRSession {
  public readonly controllers: THREE.XRTargetRaySpace[];
  public readonly grips: THREE.XRGripSpace[];
  public readonly controllerGroup: THREE.Group;
  public get isPresenting(): boolean;
  public get currentSession(): globalThis.XRSession | null;

  constructor(renderer: THREE.WebGLRenderer);
}
```

---

## Métodos

### `checkVRSupport(): Promise<boolean>`
Consulta asíncronamente si el navegador y el hardware soportan sesiones inmersivas (`immersive-vr`).

### `enterVR()` y `exitVR()`
Inicia o termina la sesión WebXR con espacio de referencia `local-floor`.

### `createVRButton(container?): HTMLElement`
Genera un botón flotante reactivo con estilos profesionales:
- Muestra `🥽 ENTER VR` si el hardware es compatible.
- Muestra `VR NOT SUPPORTED` deshabilitado en navegadores no compatibles.
- Conmuta a `❌ EXIT VR` durante la inmersión.

### `raycastController(controllerIndex, objects, recursive?): THREE.Intersection[]`
Proyecta un rayo desde la posición y orientación física del mando WebXR en el espacio 3D.

### `onSelect(callback): () => void`
Emite un evento cada vez que el usuario presiona el gatillo en VR, entregando el índice del mando (0 o 1) y el objeto `XRTargetRaySpace`.
