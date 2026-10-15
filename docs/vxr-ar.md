# VXR AR — Sistema de Realidad Aumentada Web

Módulo independiente de Realidad Aumentada (`@vxr/ar`) para el ecosistema **VXR Core**. Permite crear experiencias inmersivas 6-DoF directamente en el navegador web móvil y de escritorio sin instalar aplicaciones nativas.

---

## 🎯 Visión y Objetivos

VXR AR amplía el alcance de VXR permitiendo interactuar con el entorno físico a través de la cámara del dispositivo:
1. **Acceso Universal sin Apps**: Ejecución directa en iOS Safari, Android Chrome y navegadores de escritorio vía WebRTC y WebGL.
2. **Doble Paradigma de Tracking**:
   - **QR Scan-to-Launch**: Escaneo rápido de códigos QR para resolver manifiestos y desplegar experiencias 3D interactivas.
   - **6-DoF Continuous Tracking**: Seguimiento continuo de imágenes impresas (Natural Feature Tracking con MindAR) y marcadores fiduciarios con matriz de transformación en tiempo real.
3. **Estabilidad Visual Avanzada**: Algoritmo `ARMatrixSmoother` con interpolación esférica (Slerp) y lineal (Lerp) para erradicar el temblor o jittering de la cámara.
4. **Ciclo de Vida Riguroso**: Gestión automática de recursos Three.js con desasignación completa de geometrías, texturas, shaders y buffers (`dispose`) para prevenir fugas de memoria en dispositivos móviles.

---

## 🏗️ Arquitectura del Sistema

```
                  ┌────────────────────────────────────────┐
                  │             ARExperience               │
                  │   (Orquestador Principal del Ciclo)    │
                  └──────────────────┬─────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     ARCamera     │       │    ARSession     │       │  ARAssetManager  │
│ WebRTC Feed      │       │ Permisos, HTTPS  │       │ Modelos GLTF/GLB │
│ Video Fitting    │       │ Diagnóstico WebXR│       │ Mixer & Limpieza │
└──────────────────┘       └──────────────────┘       └──────────────────┘
         │                           │                           │
         ▼                           ▼                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Motor de Tracking                             │
│  ┌──────────────────────┐                     ┌─────────────────────┐  │
│  │   ARImageTracker     │                     │   ARMarkerTracker   │  │
│  │  (MindAR Adapter)    │                     │ (Fiduciary Adapter) │  │
│  └──────────┬───────────┘                     └──────────┬──────────┘  │
│             └───────────────────┬────────────────────────┘             │
│                                 ▼                                      │
│                        ARMatrixSmoother                                │
│                   (Anti-Jitter Lerp / Slerp)                           │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   ARInteraction (Gestos & Raycast)                     │
│               Drag-to-Rotate • Pinch-to-Scale • Tap Raycast            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Componentes y API Pública

### 1. `ARExperience`
Orquestador principal que enlaza la cámara de video, el renderizador WebGL de Three.js, los sistemas de tracking y la interacción.

```typescript
import { ARExperience, ARMode } from '@vxr/ar';

const ar = new ARExperience({
  container: '#ar-container',
  mode: ARMode.IMAGE_TRACKING,
  camera: { facingMode: 'environment', targetFps: 60 },
  enableGestures: true
});

await ar.init();
await ar.loadModel('./models/robot.glb', { scale: 0.5, autoPlayAnimation: true });
ar.start();
```

#### Métodos Principales:
- `init(): Promise<void>`: Solicita permisos de cámara, inicializa Three.js y configura el motor de seguimiento.
- `start(): void`: Inicia el bucle de renderizado y el procesamiento de video.
- `stop(): void`: Detiene el bucle y pausa el tracking.
- `loadModel(url: string, config?: ARModelConfig): Promise<THREE.Group>`: Carga y asocia un modelo 3D al ancla activa.
- `setMode(mode: ARMode): Promise<void>`: Cambia dinámicamente entre modo QR, seguimiento de imagen o marcador fiduciario.
- `dispose(): void`: Cierra la cámara, libera memoria de GPU (materiales, texturas, geometrías) y destruye eventos del DOM.

---

### 2. `ARCamera`
Gestiona el flujo de video en vivo del hardware mediante `navigator.mediaDevices.getUserMedia`.

```typescript
import { ARCamera } from '@vxr/ar';

const camera = new ARCamera({
  facingMode: 'environment', // o 'user' para cámara frontal
  targetFps: 60,
  idealWidth: 1280,
  idealHeight: 720
});

const videoElement = await camera.start();
camera.fitElement(container);
```

#### Características:
- Selección automática de cámara trasera (`facingMode: { ideal: 'environment' }`).
- Ajuste proporcional en pantalla con `object-fit: cover` para evitar deformaciones ópticas.
- Detención de pistas y liberación limpia de hardware al invocar `camera.stop()`.

---

### 3. `ARQRCode`
Diferenciación entre el modo **Scan-to-Launch** y el seguimiento continuo. Diseñado para escanear un código en una parada o museo, resolver los datos del modelo 3D y desplegar la experiencia.

```typescript
import { ARQRCode } from '@vxr/ar';

// 1. Escaneo en tiempo real sobre frame de video
const detector = new ARQRCode();
const result = await detector.scanFrame(videoElement);

if (result) {
  console.log('Detectado:', result.rawValue);
  const manifest = ARQRCode.parseUrlParams(result.rawValue);
}

// 2. Generación procedural de código QR en SVG imprimible
const svgString = ARQRCode.generateQRSVG('https://miapp.com/ar?model=robot.glb');
```

#### Estrategia Híbrida de Escaneo:
1. **API Nativa `BarcodeDetector`**: Detección acelerada por hardware en navegadores compatibles (Chrome Android, macOS).
2. **Fallback por Canvas**: Análisis de luminancia por software cuando la API nativa no está presente.

---

### 4. `ARImageTracker` y MindAR Adapter
Seguimiento 6-DoF de imágenes naturales (pósters, cuadros, empaques) mediante redes neuronales convolucionales y extracción de características locales.

```typescript
import { ARImageTracker } from '@vxr/ar';

const tracker = new ARImageTracker({
  targetSrc: './targets/mona-lisa.mind',
  filterMinCF: 0.001,
  filterBeta: 1000
});

tracker.on('targetFound', ({ targetIndex }) => {
  console.log('Imagen encontrada, anclando modelo 3D');
});

tracker.on('targetLost', () => {
  console.log('Imagen fuera del campo de visión');
});
```

---

### 5. `ARMarkerTracker` y Marcadores Fiduciarios
Seguimiento de marcadores cuadrados de alto contraste procedimentales.

```typescript
import { ARMarkerTracker } from '@vxr/ar';

const markerTracker = new ARMarkerTracker({
  markerPattern: '010101',
  dictionaryName: 'AR_MARKER_4X4'
});

// Generación de marcador imprimible
const svgMarker = markerTracker.generatePrintableMarker();
```

---

### 6. `ARAssetManager`
Gestión avanzada de modelos 3D y audio para AR:
- **Cargador GLTF/GLB**: Configurado con descompresor **DRACOLoader** para modelos optimizados de bajo peso.
- **Auto-centrado y Escala**: Centrado automático mediante cálculo de `Box3` y normalización de altura.
- **Reproductor de Animaciones**: Gestión interna de `AnimationMixer` para ciclos de animación automáticos.
- **Liberación de Memoria GPU (`dispose`)**:
  ```typescript
  // Limpieza recursiva profunda
  assetManager.disposeObject(modelGroup);
  // Libera geometrías, materiales (albedo, normalMap, roughnessMap), texturas y canvas
  ```

---

### 7. `ARMatrixSmoother` (Anti-Jitter)
Filtro de suavizado temporal para matrices de transformación 4x4.
- **Posición y Escala**: Interpolación lineal (`lerp`) con factor de amortiguación configurable.
- **Orientación**: Descomposición en cuaterniones e interpolación esférica (`slerp`) que elimina los saltos angulares de baja iluminación.

```typescript
import { ARMatrixSmoother } from '@vxr/ar';

const smoother = new ARMatrixSmoother({
  positionFactor: 0.15,
  rotationFactor: 0.20,
  scaleFactor: 0.15
});

// En cada frame de tracking:
smoother.smooth(rawMatrix, smoothedMatrix);
```

---

### 8. `ARInteraction`
Control gestual unificado para pantalla táctil y ratón:
- **Arrastre con un dedo / Clic primario**: Rotación horizontal y vertical del modelo 3D sobre su centro de masa.
- **Pellizco con dos dedos / Rueda de ratón**: Escalado progresivo con límites elásticos configurables (`minScale`, `maxScale`).
- **Tap / Clic simple**: Raycasting de precisión contra las mallas 3D del modelo con retorno del punto de impacto y normal.

---

### 9. `ARSession`
Diagnóstico y verificación previa de compatibilidad del entorno:

```typescript
import { ARSession } from '@vxr/ar';

const caps = await ARSession.checkCapabilities();
console.log('HTTPS seguro:', caps.isSecureContext);
console.log('Cámara disponible:', caps.hasCamera);
console.log('BarcodeDetector nativo:', caps.hasBarcodeDetector);
console.log('WebXR immersive-ar:', caps.hasWebXRAR);

// Solicitar permisos explícitamente con diálogo contextual
const granted = await ARSession.requestCameraPermission();
```

---

## 🎨 Guía de Preparación de Imágenes Objetivo

Para obtener un seguimiento 6-DoF estable y sin pérdidas de detección:

| Criterio | Recomendación | A Evitar |
| :--- | :--- | :--- |
| **Contraste** | Alto contraste lumínico y cromático | Imágenes monótonas o pasteles tenues |
| **Textura / Detalles** | Patrones asimétricos, bordes definidos, texto, líneas | Gradientes suaves, cielo liso, patrones geométricos repetitivos (ajedrez uniforme) |
| **Reflectividad** | Superficie mate impresa en papel no brillante | Plastificados de alto brillo, pantallas con reflejo directo de luces |
| **Resolución** | Entre 800x800 px y 1500x1500 px | Imágenes pixeladas (<300 px) o excesivamente pesadas (>4000 px) |

---

## 📱 Matriz de Compatibilidad

| Plataforma / Navegador | Cámara WebRTC | QR Scan-to-Launch | Tracking de Imágenes | WebXR AR |
| :--- | :---: | :---: | :---: | :---: |
| **Android (Chrome / Edge)** | ✅ 100% | ✅ Nativo (`BarcodeDetector`) | ✅ 60 FPS (WASM) | ✅ Soportado |
| **iOS (Safari)** | ✅ 100% (iOS 14.3+) | ✅ Fallback Canvas | ✅ 60 FPS (WASM) | ⚠️ Experimental |
| **Desktop (Chrome / Firefox)** | ✅ 100% | ✅ Soportado | ✅ 60 FPS (WebCam) | ❌ N/A |
| **Meta Quest Browser** | ✅ Soportado | ✅ Soportado | ✅ Soportado | ✅ `immersive-ar` Passthrough |

---

## 🧪 Pruebas Automatizadas

El módulo cuenta con una suite completa de pruebas unitarias e integración en `tests/ar-system.test.mjs`:
- Inicialización y ciclo de vida de `ARExperience`.
- Detección de capacidades en `ARSession`.
- Transformación y filtrado anti-jitter en `ARMatrixSmoother`.
- Carga y auto-centrado de geometrías en `ARAssetManager`.
- Generación de SVG de marcadores fiduciarios y QR.
- Verificación de liberación de memoria de GPU.

Para ejecutar las pruebas:
```bash
npm test
```
