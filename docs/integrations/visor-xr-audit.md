# Auditoría Técnica de Visor XR & Mapeo con VXR Core

Este documento presenta la auditoría exhaustiva de la copia experimental de **Visor XR** (`PCPuma Visor arquitectonico`) y el mapeo comparativo frente a las capacidades actuales de **`@vxr/core` v0.1.0**.

---

## 1. Visión General del Proyecto Visor XR

**Visor XR** es una aplicación WebXR arquitectónica interactiva desarrollada con:
- **Framework React**: React 19 (`react`, `react-dom`)
- **Herramienta de Construcción**: Vite 8 + Tailwind CSS v4
- **Capa 3D / WebXR**: `@react-three/fiber` (R3F 9.7.0), `@react-three/drei` (10.7.8), `@react-three/xr` (6.6.30) y `three` (0.186.0)
- **Modos de Operación**:
  1. *Desktop 3D*: Catálogo, visor orbital, HUD de métricas, toolbar de encuadre/transformación.
  2. *VR Inmersivo - Modo Maqueta*: Modelo en escala diorama apoyado sobre pedestal con manipulación bimanual (escalar, rotar y mover con los dos mandos).
  3. *VR Inmersivo - Modo Escala 1:1*: Modelo en dimensiones reales con teletransporte y locomoción con joystick.
  4. *AR Passthrough*: Activación de cámaras de paso (passthrough) en Meta Quest 3S, fondo y niebla transparentes y sombras proyectadas en el suelo real.

---

## 2. Auditoría de los 18 Puntos Técnicos (Three.js & WebXR)

### 1. Inicialización de Three.js
- **Estado Actual en Visor XR**: Se inicializa de forma declarativa mediante `<Canvas>` de `@react-three/fiber` en `src/components/scene/SceneCanvas.tsx`. R3F orquesta internamente el contexto WebGL2, la cámara por defecto y el bucle de renderizado.
- **En VXR Core**: `XRApp` crea un `XRRenderer` imperativo con `new THREE.WebGLRenderer()`.

### 2. `THREE.Scene`
- **Estado Actual en Visor XR**: Creada automáticamente por R3F. En `SceneContent` se manipula reactivamente:
  - Fondo dinámico (`threeScene.background = defaultBg` en VR/Desktop; `null` en AR passthrough).
  - Niebla dinámica (`threeScene.fog = defaultFog` en VR/Desktop; `null` en AR).
  - Contiene `<Lighting>`, `<FloorGrid>`, `<ModelContainer>` y componentes XR.
- **En VXR Core**: `XRScene` encapsula `new THREE.Scene()`, gestiona presets de ambiente (`setEnvironment`) y fondo sólido.

### 3. `THREE.WebGLRenderer`
- **Estado Actual en Visor XR**: Configurado en `<Canvas gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} shadows>`. El flag `alpha: true` es crítico para el passthrough AR de Meta Quest. Se llama a `gl.setClearColor()` en cada frame según el modo.
- **En VXR Core**: `XRRenderer` encapsula el renderizador con `antialias: true`, `enableShadows: true` y `pixelRatioCap: 1.5`.

### 4. Cámara
- **Estado Actual en Visor XR**: Cámara en `<Canvas camera={{ position: [14, 11, 16], fov: 45, near: 0.1, far: 250 }}>`. Contiene función `frameModel()` que calcula la distancia de encuadre basada en la diagonal máxima del modelo (`Math.max(w, h, d)`) y el FOV.
- **En VXR Core**: `PerspectiveCamera` por defecto en `[0, 1.6, 3.5]`, `fov: 60`, `near: 0.1`, `far: 200`. No incluye cálculo automático de distancia de encuadre en v0.1.0.

### 5. `OrbitControls`
- **Estado Actual en Visor XR**: `<OrbitControls>` de `@react-three/drei` con `enableDamping`, `dampingFactor: 0.06`, límites de ángulo polar y distancias. Se desactiva reactivamente cuando la sesión XR está activa (`{!isXR && <OrbitControls ... />}`).
- **En VXR Core**: `XRApp` instancia `OrbitControls` imperativo cuando `autoOrbitControls: true` y lo desactiva en WebXR.

### 6. Bucle de Animación (`Animation Loop`)
- **Estado Actual en Visor XR**: Conducido por R3F mediante el hook `useFrame((state, delta) => ...)`. Múltiples componentes se suscriben de forma independiente:
  - `SceneContent`: Monitorea el estado de la sesión XR y conmuta AR/VR/Desktop.
  - `TwoHandManipulator`: Lee los botones squeeze/grip y aplica transformaciones a la maqueta.
  - `TeleportManager`: Calcula el arco parabólico de teletransporte.
  - `JoystickLocomotion`: Traduce y rota el origen (`XROrigin`).
- **En VXR Core**: Centralizado en `XRRenderer.setAnimationLoop` y suscripción con `app.onUpdate((delta, elapsed) => ...)`.

### 7. WebXR
- **Estado Actual en Visor XR**: Orquestado por `@react-three/xr` v6 con `xrStore = createXRStore({ controller: true, hand: false })`.
  - Soporta `enterVR()` y `enterAR()` con detección de passthrough.
  - Hook `useWebXRSupport()` consulta `navigator.xr.isSessionSupported('immersive-vr')` y `'immersive-ar'`.
  - `<XR store={xrStore}><XROrigin ... />...</XR>` posiciona al usuario en el espacio virtual.
- **En VXR Core**: `XRSession` soporta `immersive-vr` y controladores con láser visual. No soporta AR passthrough ni está ligado a React.

### 8. `GLTFLoader` / GLB / GLTF
- **Estado Actual en Visor XR**: `useModelLoader.ts` crea `new GLTFLoader()` directamente en un efecto de React. Carga desde ruta remota, relativa o desde objeto `File` local vía `URL.createObjectURL(file)`.
- **En VXR Core**: `XRAssetManager` crea y gestiona una instancia reutilizable de `GLTFLoader`.

### 9. DRACO
- **Estado Actual en Visor XR**: En `useModelLoader.ts`, se crea `new DRACOLoader()` con ruta CDN de Google:
  `dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')`. Se vincula a `loader.setDRACOLoader(dracoLoader)` y se libera en el cleanup con `dracoLoader.dispose()`.
- **En VXR Core**: `XRAssetManager` ya incluye exactamente la misma configuración de `DRACOLoader` y su ciclo de desecho.

### 10. Raycasting
- **Estado Actual en Visor XR**:
  - `TeleportManager.tsx`: Usa `THREE.Raycaster` para intersecar un plano matemático infinito (`THREE.Plane(0, 1, 0, 0)`) y colocar el retículo de teletransporte.
  - Menú 3D flotante (`VRFloatingMenu.tsx`): Usa eventos R3F de puntero (`onClick`, `onPointerOver`, `onPointerOut`) en mallas y grupos 3D.
- **En VXR Core**: `XRApp` provee `raycastPointer(event, targets)` y `raycastController(index, targets)`.

### 11. Selección de Objetos
- **Estado Actual en Visor XR**: En desktop se selecciona a nivel de catálogo de proyectos o archivo local. Dentro de la escena 3D no hay selección de submallas individuales (a diferencia de `architecture-viewer`); se interactúa con el modelo como una unidad completa.
- **En VXR Core**: `raycastPointer` permite obtener la lista de intersecciones para selección de submallas.

### 12. Iluminación
- **Estado Actual en Visor XR**: `Lighting.tsx` contiene:
  - `<hemisphereLight args={[0xffffff, 0x444950, 0.75]} />`
  - `<directionalLight position={[15, 25, 12]} intensity={1.2} castShadow ... />` con shadow map de 1024x1024 y bias de -0.0005.
  - `<directionalLight position={[-12, 10, -10]} intensity={0.35} />` (relleno).
- **En VXR Core**: `XRScene` incluye luz ambiental, luz solar direccional y luz de relleno, con presets de color e intensidad.

### 13. Grid y Suelo
- **Estado Actual en Visor XR**: `FloorGrid.tsx` combina:
  - Rejilla infinita Drei `<Grid args={[80, 80]} ... />` (oculta en AR).
  - Plano receptor de sombras transparentes `<shadowMaterial opacity={...} />`.
  - Pedestal diorama cilíndrico en modo maqueta VR.
  - Malla invisible `<TeleportTarget>` para teletransporte en Escala 1:1.
- **En VXR Core**: `XRScene` incluye un `THREE.GridHelper` simple de 20x20m.

### 14. Resize de Ventana
- **Estado Actual en Visor XR**: Manejado automáticamente por el `<Canvas>` de R3F usando un `ResizeObserver`.
- **En VXR Core**: Manejado por `XRRenderer.handleResize(camera)` y listener en `XRApp`.

### 15. Dispose y Liberación de Memoria GPU
- **Estado Actual en Visor XR**: En `useModelLoader.ts`, se recorre la escena previa liberando `mesh.geometry.dispose()` y `mesh.material.dispose()`, se revocan URLs de blobs (`URL.revokeObjectURL`) y se llama a `dracoLoader.dispose()`.
- **En VXR Core**: `XRAssetManager.disposeModel(model)` y `XRAssetManager.dispose()` encapsulan esta misma rutina.

### 16. Gestión de Modelos y Métricas
- **Estado Actual en Visor XR**:
  - `computeModelMetrics(loadedScene, fileSizeBytes)` en `src/utils/modelMetrics.ts`: calcula dimensiones de AABB, centro volumétrico, conteo de vértices, triángulos y mallas, además de `isHeavy` (>350k polígonos) y `recommendedScale` (`0.8 / maxDim`).
  - Optimización de mallas: `mesh.frustumCulled = true`, `mesh.castShadow = true`, `mesh.receiveShadow = true`.
  - Auto-grounding: `loadedScene.position.set(-center[0], -box.min.y, -center[2])`.
  - Envoltura en grupo contenedor `ModelRootContainer`.
- **En VXR Core**: `XRAssetManager.loadGLTF()` realiza exactamente la misma optimización, auto-grounding, centrado y cálculo de métricas.

### 17. Eventos de Interacción Espacial
- **Estado Actual en Visor XR**:
  - Lectura directa de `session.inputSources[].gamepad`:
    - Botón 1 (Squeeze / Grip): Manipulación bimanual en `TwoHandManipulator`.
    - Botón 0 (Trigger) / Thumbstick Y: Teletransporte en `TeleportManager`.
    - Thumbstick axes (X, Y): Locomoción continua y giro snap en `JoystickLocomotion`.
- **En VXR Core**: `XRSession.onSelect()` captura el gatillo principal. No tiene listeners para el botón grip ni lectura de ejes analógicos de joystick en v0.1.0.

### 18. Otras Partes Específicas
- **AR Passthrough**: Conmutación en tiempo real de niebla, fondo y transparencia de sombras al entrar en `immersive-ar`.
- **Modos de Visualización**: Conmutación entre Maqueta (pedestal + escala reducida) y Escala 1:1 (altura de piso + teletransporte).

---

## 3. Tabla de Mapeo VXR vs Visor XR

| Componente Visor XR | Equivalente VXR Core v0.1.0 | ¿Reemplazar? | Justificación Técnica |
|---|---|---|---|
| **Carga de Modelos y GLTF (`useModelLoader.ts`)** | `XRAssetManager.loadGLTF` | **SÍ (Núcleo de Carga)** | `XRAssetManager` ya incluye la configuración de `GLTFLoader`, `DRACOLoader`, optimización de mallas (`frustumCulled`, sombras), auto-grounding (`-box.min.y`), centrado y cálculo de métricas base. Integrarlo elimina más de 80 líneas de código duplicado. |
| **Cálculo de Métricas Geométricas (`modelMetrics.ts`)** | `XRAssetManager.computeMetrics` | **SÍ (Base Geométrica)** | VXR computa de forma estandarizada dimensiones, centro, vértices, triángulos y mallas. Visor XR simplemente agrega sus reglas de negocio (`isHeavy`, `recommendedScale`). |
| **Liberación de Memoria GPU (`disposeModel`)** | `XRAssetManager.disposeModel` | **SÍ** | VXR dispone geometrías, materiales y texturas con algoritmo idéntico y validado contra fugas en Quest. |
| **Verificación de Soporte WebXR (`useWebXRSupport.ts`)** | `XRSession` / Nativo | **NO** | `useWebXRSupport` es un hook React puro que evalúa tanto `immersive-vr` como `immersive-ar`. `XRSession` en v0.1.0 no soporta AR. |
| **Canvas / Renderer / Scene (`SceneCanvas.tsx`)** | `XRRenderer` / `XRScene` | **NO** | Visor XR está construido sobre React 19 y `@react-three/fiber` declarativo. Destruir `<Canvas>` obligaría a reescribir todos los componentes hijos de React, violando la regla principal de no rediseñar la app. |
| **Iluminación (`Lighting.tsx`)** | `XRScene` | **NO** | Las luces están declaradas como componentes JSX de R3F integrados al árbol de renderizado. |
| **Piso y Pedestal (`FloorGrid.tsx`)** | `XRScene.enableGrid` | **NO** | Contiene el pedestal diorama de maqueta, `TeleportTarget` y soporte de sombras AR transparentes que VXR Core no tiene. |
| **Sesión WebXR (`xrStore.ts`, `WebXRButton.tsx`)** | `XRSession` | **NO** | Utiliza `@react-three/xr` v6 con soporte de AR passthrough y disparo reactivo desde botones React en el DOM. |
| **Manipulación Bimanual (`TwoHandManipulator.tsx`)** | N/A | **NO** | Lógica de agarre bimanual con matriz de transformación de mandos; VXR Core no tiene física ni manipulación de 2 manos en v0.1.0. |
| **Locomoción (`TeleportManager`, `JoystickLocomotion`)** | N/A | **NO** | Mecánicas de navegación espacial de visor arquitectónico; pertenecen a la aplicación. |
| **Menú Espacial 3D (`VRFloatingMenu.tsx`)** | N/A | **NO** | Interfaz 3D con `@react-three/drei` Text. Pertenecerá a `@vxr/ui` en v0.3+. |
| **Controles de Órbita Desktop** | `XRApp.orbitControls` | **NO** | Drei `<OrbitControls>` se integra reactivamente con el estado de R3F. |
