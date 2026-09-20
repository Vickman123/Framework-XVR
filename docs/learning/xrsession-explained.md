# Módulo Educativo: XRSession

> Guía de aprendizaje profundo sobre la pasarela WebXR, mandos 6DoF y raycasting espacial.

---

## 1. Qué problema resuelve
La **WebXR Device API** es una API nativa del navegador de bajo nivel. Trabajar directamente con ella implica:
- Consultar `navigator.xr.isSessionSupported('immersive-vr')`.
- Solicitar la sesión negociando características opcionales (`local-floor`, `bounded-floor`, `hand-tracking`).
- Conectar la sesión al contexto WebGL mediante `renderer.xr.setSession()`.
- Gestionar manualmente los controladores `XRTargetRaySpace` y `XRGripSpace` para cada mano.
- Crear y posicionar geometrías de rayos láser visibles para que el usuario sepa hacia dónde apunta.
- Manejar el estado del botón en el DOM para indicar si el dispositivo soporta o no VR.

`XRSession` encapsula esta complejidad y la reduce a una API limpia con rayos láser automáticos y detección de clics de gatillo.

---

## 2. Qué hace
- Comprueba si el hardware y navegador soportan VR (`checkVRSupport()`).
- Solicita y gestiona el ciclo de vida de la sesión (`enterVR()`, `exitVR()`, `toggleVR()`).
- Inyecta un botón flotante estilizado (`createVRButton()`) que reacciona a la disponibilidad de VR y cambia a "EXIT VR" durante la inmersión.
- Configura automáticamente 2 mandos espaciales con rayos láser cian visibles (`VXR_LaserRay`).
- Ofrece el método `raycastController(index, objects)` para consultar qué objeto 3D está atravesando el rayo del mando en el mundo.
- Emite eventos cuando el usuario aprieta el gatillo del mando (`onSelect`).

---

## 3. Cómo funciona internamente
Para proyectar un rayo en 3D desde la posición y orientación física del mando:
```typescript
public raycastController(controllerIndex: number, objects: THREE.Object3D[]): THREE.Intersection[] {
  const controller = this.controllers[controllerIndex];
  if (!controller) return [];

  // 1. Extraer rotación del mando en coordenadas del mundo
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  // 2. Obtener posición física de la mano
  const origin = new THREE.Vector3();
  controller.getWorldPosition(origin);

  // 3. Proyectar hacia adelante (eje -Z local)
  const direction = new THREE.Vector3(0, 0, -1).applyMatrix4(tempMatrix).normalize();

  // 4. Ejecutar raycast nativo de Three.js
  const raycaster = new THREE.Raycaster();
  raycaster.set(origin, direction);
  return raycaster.intersectObjects(objects, true);
}
```

---

## 4. Qué parte corresponde a Three.js
- `renderer.xr.getController(i)`: Devuelve un `THREE.Group` cuya matriz se actualiza con la orientación del rayo del mando.
- `renderer.xr.getControllerGrip(i)`: Devuelve la posición de la empuñadura (donde se coloca el modelo 3D del mando o la mano).
- `THREE.Raycaster`: El algoritmo geométrico de intersección rayo-triángulo.

---

## 5. Qué parte corresponde a WebXR
- `navigator.xr.requestSession('immersive-vr')`: Petición oficial de toma de control del visor.
- La noción de `XRReferenceSpace`: `local-floor` sitúa el origen de coordenadas $Y=0$ en el suelo físico de la habitación calibrado por el usuario con el sistema Guardián de Meta Quest.
- La transmisión continua de la pose 6DoF de cabeza y mandos (posición $X, Y, Z$ y cuaternión de orientación $Q_x, Q_y, Q_z, Q_w$).

---

## 6. Cómo se haría sin VXR
```javascript
// Comprobar soporte
if (navigator.xr) {
  navigator.xr.isSessionSupported('immersive-vr').then(supported => {
    if (supported) {
      const btn = document.createElement('button');
      btn.textContent = 'ENTER VR';
      btn.onclick = () => {
        navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['local-floor']
        }).then(session => renderer.xr.setSession(session));
      };
      document.body.appendChild(btn);
    }
  });
}

// Crear rayos láser manuales
const controller = renderer.xr.getController(0);
const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-3)]);
const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ffff }));
controller.add(line);
scene.add(controller);
```

---

## 7. Cómo VXR lo simplifica
```typescript
// XRSession se encarga de los controladores, rayos láser y botón VR
const app = new XRApp({ autoVRButton: true });

// Detectar clics del gatillo en VR en 1 línea
app.onControllerSelect((index) => {
  const hits = app.raycastController(index, [misObjetos]);
  if (hits.length > 0) {
    console.log('Objeto apuntado en VR:', hits[0].object);
  }
});
```

---

## 8. Errores comunes
1. **No usar HTTPS o localhost**: WebXR está **restringido a contextos seguros**. En conexiones HTTP normales (incluso en red local), `navigator.xr` será `undefined`.
2. **Asumir que el mando 0 siempre es la mano derecha**: En WebXR, el orden de conexión puede variar. `handedness` debe verificarse en experiencias complejas.

---

## 9. Qué deberías estudiar para comprenderlo mejor
- **Especificación WebXR Device API del W3C**: Sesiones, espacios de referencia (`viewer`, `local`, `local-floor`, `unbounded`).
- **Matrices de transformación local vs mundial (`matrix` vs `matrixWorld`)**: Cómo Three.js hereda las coordenadas espaciales en el grafo de escena.

---

## 10. Lo que aprendí y Preguntas pendientes

### Lo que aprendí:
- Tener rayos láser visibles preconfigurados y una función `raycastController` lista para usar convierte una experiencia de escritorio en una experiencia VR funcional inmediatamente sin escribir cientos de líneas de matemáticas matriciales.

### Preguntas pendientes:
- *¿Deberíamos acortar dinámicamente la longitud del rayo láser visual cuando el rayo impacte contra un objeto, para que no lo atraviese visualmente?* (Recomendación destacada para v0.2).
