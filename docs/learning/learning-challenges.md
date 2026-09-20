# Learning Challenges: Dominando Three.js, WebXR y VXR

> Retos prácticos diseñados para comprender qué ocurre debajo del capó de VXR antes de delegar en sus abstracciones.

---

## Reto 1: Implementar un Raycaster Manual con Three.js

### El Ejercicio:
Crea una función en JavaScript/TypeScript que reciba un evento de ratón `MouseEvent` y una lista de mallas, calcule las coordenadas normalizadas de dispositivo (NDC: de -1 a +1), proyecte un rayo desde la cámara y devuelva el primer objeto impactado.

### Solución en Three.js Puro:
```javascript
function raycastManual(event, camera, domElement, objects) {
  // 1. Obtener la posición del canvas en el viewport del navegador
  const rect = domElement.getBoundingClientRect();

  // 2. Traducir coordenadas de píxeles (clientX, clientY) a espacio NDC [-1, 1]
  const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // 3. Crear el raycaster y orientarlo desde la cámara
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

  // 4. Calcular intersecciones ordenadas por distancia
  const intersections = raycaster.intersectObjects(objects, true);

  return intersections.length > 0 ? intersections[0] : null;
}
```

### Cómo lo abstrae VXR:
```typescript
// En VXR Core, todo el cálculo matemático y el bounding rect se resuelven en 1 llamada:
const hits = app.raycastPointer(event, misObjetos);
if (hits.length > 0) {
  console.log('Impacto en:', hits[0].object);
}
```

---

## Reto 2: Explicar la Diferencia entre Scene, Camera y Renderer

### La Pregunta:
¿Cuál es la responsabilidad exacta de `THREE.Scene`, `THREE.PerspectiveCamera` y `THREE.WebGLRenderer`, y cómo se comunican?

### La Explicación Fundamental:
1. **`THREE.Scene` (El Qué)**:
   - Es una estructura de datos abstracta en árbol (grafo de escena).
   - Contiene mallas, materiales, texturas y luces.
   - **No sabe nada de píxeles ni pantallas**. Solo sabe dónde están los objetos en el espacio tridimensional cartesiano ($X, Y, Z$) y quién es hijo de quién.
2. **`THREE.PerspectiveCamera` (El Desde Dónde)**:
   - Es una definición matemática de un punto de observación.
   - Contiene la matriz de vista (posición y rotación del observador) y la matriz de proyección (FOV, relación de aspecto y planos de corte).
   - **No dibuja nada**. Solo calcula la transformación de coordenadas del mundo 3D a coordenadas del espacio de proyección (frustum).
3. **`THREE.WebGLRenderer` (El Cómo se Dibuja)**:
   - Es el motor que traduce los datos matemáticos en comandos GPU.
   - Toma la `Scene` y la `Camera`, descarta los objetos que caen fuera de la vista (*frustum culling*), compila los shaders GLSL, calcula las sombras y dibuja los píxeles de color en el lienzo `<canvas>` mediante WebGL.

### En VXR:
`XRScene`, `XRRenderer` y `XRApp` respetan rigurosamente esta división:
```
XRScene (Contenido y luces) + Camera (Punto de vista) ──► XRRenderer (Dibuja en pantalla)
```

---

## Reto 3: Animación Fluida con `setAnimationLoop` y `THREE.Clock`

### El Ejercicio:
Crea un bucle de animación que rote un cubo a exactamente $45^\circ$ por segundo, garantizando que rote a la misma velocidad en un monitor de 60Hz, en un visor de 90Hz o durante una caída temporal de fotogramas.

### Solución en Three.js Puro:
```javascript
const clock = new THREE.Clock();
const cube = new THREE.Mesh(geo, mat);
scene.add(cube);

const velocidadRadianesPorSegundo = (45 * Math.PI) / 180; // ~0.785 rad/s

renderer.setAnimationLoop(() => {
  // delta es el tiempo exacto transcurrido en segundos desde el último frame
  const delta = clock.getDelta();

  // Multiplicar siempre por delta para ser independiente de la tasa de FPS
  cube.rotation.y += velocidadRadianesPorSegundo * delta;

  renderer.render(scene, camera);
});
```

### Cómo lo abstrae VXR:
```typescript
// XRApp orquesta el bucle WebXR y te entrega el delta ya calculado:
app.onUpdate((delta, elapsed) => {
  cube.rotation.y += delta * 0.785;
});
```

---

## Reto 4: Detectar un Controller Select en WebXR sin VXR

### El Ejercicio:
Detecta cuándo el usuario aprieta el gatillo del mando de Meta Quest, obtén su posición en el espacio 3D y dispara un rayo hacia adelante.

### Solución en Three.js Puro:
```javascript
const controller = renderer.xr.getController(0);

controller.addEventListener('select', () => {
  // 1. Extraer rotación del mando en el mundo
  const tempMatrix = new THREE.Matrix4();
  tempMatrix.identity().extractRotation(controller.matrixWorld);

  // 2. Extraer posición física del mando
  const origin = new THREE.Vector3();
  controller.getWorldPosition(origin);

  // 3. Proyectar hacia el frente local (-Z)
  const direction = new THREE.Vector3(0, 0, -1).applyMatrix4(tempMatrix).normalize();

  // 4. Proyectar rayo
  const raycaster = new THREE.Raycaster(origin, direction);
  const hits = raycaster.intersectObjects(scene.children);
  if (hits.length > 0) {
    console.log('Gatillo presionado impactando en:', hits[0].object);
  }
});
scene.add(controller);
```

### Cómo lo abstrae VXR:
```typescript
// En VXR Core:
app.onControllerSelect((controllerIndex) => {
  const hits = app.raycastController(controllerIndex, [misObjetos]);
  if (hits.length > 0) {
    console.log('Gatillo presionado impactando en:', hits[0].object);
  }
});
```

---

## Reto 5: Auto-Grounding Matemático de un Modelo 3D

### El Ejercicio:
Dado un modelo 3D con un origen de pivote arbitrario, trasládalo para que su cara inferior repose exactamente sobre el plano $Y = 0$.

### Solución en Three.js Puro:
```javascript
const box = new THREE.Box3().setFromObject(loadedScene);
// box.min.y es la altura del vértice más bajo de toda la jerarquía
loadedScene.position.y = -box.min.y;
```

### Cómo lo abstrae VXR:
`XRAssetManager` y `XRApp.loadModel` aplican este cálculo automáticamente de manera predeterminada (`autoGround: true`), de modo que ningún modelo 3D importado quede flotando o enterrado.
