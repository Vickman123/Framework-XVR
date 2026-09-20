# Módulo Educativo: XRScene

> Guía de aprendizaje profundo sobre la escena, iluminación y entorno en VXR.

---

## 1. Qué problema resuelve
En Three.js, un `new THREE.Scene()` comienza completamente vacío y a oscuras. Cualquier modelo cargado con materiales PBR (`MeshStandardMaterial` o `MeshPhysicalMaterial`) se renderizará de color negro sólido hasta que se agreguen luces adecuadas. Además, los modelos parecen "flotar en la nada" sin una superficie de referencia que reciba sombras.

---

## 2. Qué hace
- Envuelve una instancia de `THREE.Scene`.
- Configura iluminación balanceada lista para producción:
  1. `AmbientLight`: Iluminación difusa para evitar sombras completamente negras.
  2. `DirectionalLight`: Luz solar principal orientada con sombras suaves (`PCFSoftShadowMap`).
  3. `HemisphereLight`: Rebote de color del suelo hacia la parte inferior del modelo.
- Añade un plano de suelo invisible con `ShadowMaterial` (solo dibuja las sombras proyectadas sobre el piso) y una rejilla `GridHelper`.
- Proporciona presets ambientales de un solo clic (`setEnvironmentPreset('studio' | 'daylight' | 'dark')`).

---

## 3. Cómo funciona internamente
`XRScene` utiliza composición sobre `THREE.Scene`:
```typescript
export class XRScene {
  public readonly nativeScene: THREE.Scene;
  // ... configura luces y mallas de suelo ...
}
```
Cuando llamas a `scene.add(mesh)`, el método simplemente ejecuta `this.nativeScene.add(mesh)` y retorna `this` para encadenamiento fluido (*method chaining*).

---

## 4. Qué parte corresponde a Three.js
- `THREE.Scene`: Estructura jerárquica de árbol de nodos (grafo de escena).
- `THREE.AmbientLight`, `THREE.DirectionalLight`, `THREE.HemisphereLight`: Clases nativas de iluminación matemática.
- `THREE.ShadowMaterial`: Material especial que renderiza exclusivamente el canal alfa de las sombras recibidas.

---

## 5. Qué parte corresponde a WebXR
- En WebXR AR (Passthrough), la escena debe poder hacer su fondo completamente transparente (`scene.background = null`) para permitir ver las cámaras del mundo real.
- La escala métrica: Three.js considera $1.0\text{ unidad} = 1\text{ metro}$ en WebXR. La rejilla de `XRScene` está calibrada en metros para que las dimensiones coincidan con el espacio físico real.

---

## 6. Cómo se haría sin VXR
```javascript
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f19);

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfffaed, 1.2);
sun.position.set(6, 12, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun);

const floorGeo = new THREE.PlaneGeometry(30, 30);
const floorMat = new THREE.ShadowMaterial({ opacity: 0.25 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
```

---

## 7. Cómo VXR lo simplifica
```typescript
// XRScene ya incluye iluminación, sombras y suelo configurados
const scene = app.scene;

// O cambiar de ambiente instantáneamente:
scene.setEnvironmentPreset('daylight');
scene.setGridVisible(false);
```

---

## 8. Errores comunes
1. **Configurar el bias de sombra en cero**: Provoca *Shadow Acne* (patrón de rayas oscuras artefactadas sobre superficies curvas). `XRScene` preconfigura `normalBias = 0.02` para evitarlo.
2. **Olvidar llamar a `receiveShadow = true` en el suelo**: Si el suelo no recibe sombras, los modelos parecen levitar.

---

## 9. Qué deberías estudiar para comprenderlo mejor
- **Pipeline de cálculo de sombras en Three.js**: Cómo se genera el mapa de profundidad desde el punto de vista de la luz (*Shadow Map Pass*) y cómo se proyecta en la cámara principal.
- **Diferencia entre luces difusas (Ambient/Hemi) y especulares (Directional/Point/Spot)**.

---

## 10. Lo que aprendí y Preguntas pendientes

### Lo que aprendí:
- Una buena iluminación predeterminada ahorra horas de depuración gráfica y asegura que cualquier archivo GLB se visualice con aspecto profesional desde el primer instante.

### Preguntas pendientes:
- *¿Deberíamos incorporar soporte para Image-Based Lighting (IBL) precalculado mediante `RoomEnvironment` en `XRScene` como hacía el proyecto de laboratorio PC PUMA?*
