# Módulo Educativo: XRRenderer

> Guía de aprendizaje profundo sobre el renderizado WebGL, la cámara y el bucle de animación en VXR.

---

## 1. Qué problema resuelve
En el desarrollo de aplicaciones web 3D es común cometer tres errores críticos:
1. **Ignorar el Pixel Ratio**: Dejar que el renderizador use el `devicePixelRatio` nativo en pantallas 4K o visores VR como Meta Quest puede colapsar la GPU móvil al intentar dibujar 8 millones de píxeles a 90 FPS.
2. **Manejo incorrecto del bucle en VR**: Usar `window.requestAnimationFrame()` clásico no funciona dentro de un visor WebXR inmersivo; es obligatorio usar `renderer.setAnimationLoop()`.
3. **Mala gestión del redimensionamiento**: Si no se actualiza la matriz de proyección de la cámara (`camera.updateProjectionMatrix()`) al cambiar el tamaño de ventana, la imagen se deforma o se estira.

---

## 2. Qué hace
- Configura un `THREE.WebGLRenderer` calibrado para alto rendimiento.
- Establece un tope de seguridad para el pixel ratio (`pixelRatioCap`, por defecto 1.5).
- Configura espacio de color estándar moderno (`outputColorSpace = THREE.SRGBColorSpace`) y curva de respuesta fotográfica (`ACESFilmicToneMapping`).
- Gestiona automáticamente el evento `window.resize` manteniendo la relación de aspecto de la cámara sin deformación.
- Orquesta el bucle `setAnimationLoop` calculando el tiempo delta y total con `THREE.Clock`, despachando eventos a todos los componentes `Updatable`.

---

## 3. Cómo funciona internamente
```typescript
this.nativeRenderer.setAnimationLoop(() => {
  const delta = this.clock.getDelta();
  const elapsed = this.clock.getElapsedTime();

  // 1. Ejecutar callbacks registrados
  for (const updateFn of this.updatables) {
    updateFn(delta, elapsed);
  }

  // 2. Ejecutar render hook (OrbitControls + renderizado de escena)
  renderHook(delta, elapsed);
});
```

---

## 4. Qué parte corresponde a Three.js
- `THREE.WebGLRenderer`: La API que compila programas GLSL y se comunica con WebGL2.
- `THREE.PerspectiveCamera`: La cámara que define el campo de visión (FOV), los planos de corte (*near/far*) y la matriz de vista/proyección.
- `THREE.Clock`: El temporizador de precisión basado en `performance.now()`.

---

## 5. Qué parte corresponde a WebXR
- La instrucción `renderer.xr.enabled = true`.
- Cuando la sesión WebXR se activa, Three.js reemplaza internamente la cámara del usuario por la `THREE.ArrayCamera` estereoscópica generada por el visor (un ojo izquierdo y un ojo derecho), sincronizando la tasa de refresco a 72Hz, 90Hz o 120Hz directamente con el hardware del casco.

---

## 6. Cómo se haría sin VXR
```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  renderer.render(scene, camera);
});
```

---

## 7. Cómo VXR lo simplifica
```typescript
// XRRenderer se inicializa y gestiona todo automáticamente
app.renderer.addUpdatable((delta, elapsed) => {
  // Lógica personalizada que corre cada fotograma a velocidad constante
});
```

---

## 8. Errores comunes
1. **Usar `clock.getDelta()` múltiples veces en un mismo frame**: `getDelta()` calcula la diferencia desde la última vez que fue llamado. Si se invoca dos veces en el mismo fotograma, la segunda llamada devolverá casi 0. `XRRenderer` lo llama exactamente una vez por fotograma y lo pasa a los callbacks.
2. **Crear objetos (`new THREE.Vector3()`) dentro del bucle**: Causa recolección de basura (*Garbage Collection*) y micro-congelamientos de pantalla en Meta Quest.

---

## 9. Qué deberías estudiar para comprenderlo mejor
- **El bucle de animación WebXR**: Por qué WebXR exige su propio bucle sincronizado con la pantalla del casco (*V-Sync* de baja persistencia).
- **Mapeo tonal (*Tone Mapping*)**: Cómo comprime Three.js los valores de luz de alto rango dinámico (HDR) para que queden dentro de los límites visibles de una pantalla estándar.

---

## 10. Lo que aprendí y Preguntas pendientes

### Lo que aprendí:
- La limitación de `devicePixelRatio` a 1.5 es uno de los secretos más importantes de optimización en WebGL móvil: reduce el número de fragmentos dibujados en un 50% con una pérdida visual imperceptible.

### Preguntas pendientes:
- *¿Deberíamos permitir cambiar el modo de tone mapping en tiempo de ejecución para proyectos que requieran máxima tasa de FPS en cascos antiguos?*
