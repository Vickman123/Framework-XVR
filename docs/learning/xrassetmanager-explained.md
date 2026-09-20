# Módulo Educativo: XRAssetManager

> Guía de aprendizaje profundo sobre la carga de modelos 3D, normalización espacial, cálculo de métricas y gestión de memoria GPU.

---

## 1. Qué problema resuelve
Al descargar modelos 3D de software de modelado (Blender, Revit, 3ds Max, SketchUp) o repositorios web (Sketchfab), el desarrollador se enfrenta a problemas sistemáticos:
1. **Modelos desalineados**: El origen de coordenadas (pivote) del modelo suele estar en cualquier sitio arbitrario, provocando que el modelo aparezca flotando a 5 metros en el aire o enterrado bajo el suelo.
2. **Falta de información dimensional**: No se sabe cuánto mide el modelo en metros reales ni cuántos polígonos tiene hasta recorrer manualmente todas las geometrías.
3. **Fugas de memoria (*Memory Leaks*)**: Reemplazar un modelo cargando otro nuevo en Three.js sin llamar a `.dispose()` en geometrías, materiales y texturas deja la memoria VRAM de la GPU ocupada. Tras cambiar 3 o 4 modelos en Meta Quest Browser, la pestaña se cierra por falta de memoria (*Out-of-Memory Crash*).

---

## 2. Qué hace
- Descarga y parsea archivos binarios glTF (`.glb`) y glTF estándar (`.gltf`).
- Integra soporte automático para compresión de geometría **DRACO** (`DRACOLoader`).
- **Auto-Grounding**: Calcula la caja envolvente tridimensional (`THREE.Box3`) y traslada el modelo en $Y$ para que su base descanse exactamente a ras de suelo ($Y = 0$).
- **Auto-Centering**: Centra el modelo en el origen horizontal ($X = 0, Z = 0$).
- **Metrics Evaluator**: Recorre la jerarquía y extrae dimensiones métricas reales ($X \times Y \times Z$), total de vértices, triángulos y número de mallas.
- **Disposal Manager**: Rutina exhaustiva de limpieza que libera geometrías y texturas GPU cuando el modelo ya no se utiliza.
- **Caché en memoria**: Evita re-descargar el mismo modelo si se solicita dos veces.

---

## 3. Cómo funciona internamente
```typescript
// 1. Calcular caja envolvente real
const initialBox = new THREE.Box3().setFromObject(rawScene);

// 2. Desplazar para apoyar en Y = 0 y centrar en X/Z
const offsetX = autoCenter ? -metrics.center[0] : 0;
const offsetY = autoGround ? -initialBox.min.y : 0;
const offsetZ = autoCenter ? -metrics.center[2] : 0;

rawScene.position.set(offsetX, offsetY, offsetZ);

// 3. Envolver en contenedor limpio
const rootGroup = new THREE.Group();
rootGroup.name = 'VXR_ModelContainer';
rootGroup.add(rawScene);
```

---

## 4. Qué parte corresponde a Three.js
- `GLTFLoader`: El parser que convierte el formato JSON/binario glTF en objetos de Three.js.
- `DRACOLoader`: El decodificador en WebAssembly de mallas comprimidas.
- `THREE.Box3`: La estructura matemática de caja alineada con los ejes (AABB - *Axis-Aligned Bounding Box*).
- `BufferGeometry.attributes.position`: El buffer de coordenadas de vértices.

---

## 5. Qué parte corresponde a WebXR
- La escala 1:1: WebXR requiere que las unidades de Three.js coincidan con metros reales para que los objetos se perciban con tamaño natural en la realidad virtual.
- La optimización de polígonos: Al conocer `metrics.triangleCount`, una aplicación XR puede alertar al usuario si el modelo supera los 250,000 polígonos recomendados para Meta Quest.

---

## 6. Cómo se haría sin VXR
```javascript
const loader = new GLTFLoader();
loader.load('edificio.glb', (gltf) => {
  const model = gltf.scene;

  // Calcular caja manualmente
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Desplazar manualmente
  model.position.set(-center.x, -box.min.y, -center.z);

  // Activar sombras manualmente en cada malla
  model.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);
});
```

---

## 7. Cómo VXR lo simplifica
```typescript
const model = await app.loadModel('edificio.glb');

console.log(model.metrics.dimensions); // { width: 12.4, height: 6.2, depth: 8.5 }
console.log(model.metrics.triangleCount); // 45,210
```

---

## 8. Errores comunes
1. **No llamar a `model.dispose()` al descargar una escena**: Provoca acumulación invisible de buffers en la GPU. `XRApp.loadModel()` llama a `dispose()` automáticamente en el modelo anterior antes de cargar el nuevo.
2. **Intentar leer dimensiones antes de que el modelo termine de parsearse**: Como la carga es asíncrona, siempre debe usarse `await app.loadModel()`.

---

## 9. Qué deberías estudiar para comprenderlo mejor
- **Especificación glTF 2.0 (Khronos Group)**: Comprender cómo almacena escenas, mallas, nodos, buffers de animación y materiales PBR.
- **Compresión DRACO**: Cómo reduce el tamaño de descarga de archivos 3D hasta un 80% mediante cuantización de vértices.

---

## 10. Lo que aprendí y Preguntas pendientes

### Lo que aprendí:
- El auto-grounding (`position.y = -box.min.y`) y el cálculo de métricas es una de las mayores comodidades que un framework de alto nivel puede ofrecer, transformando un modelo crudo en un objeto listo para inspección sin retoques manuales.

### Preguntas pendientes:
- *¿Deberíamos soportar carga directa desde `Blob` o `ArrayBuffer` para soportar modelos que provengan de IndexedDB o APIs REST?* (Fácilmente extensible en v0.2).
