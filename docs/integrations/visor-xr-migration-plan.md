# Plan de Migración e Integración — Visor XR con VXR Core

Este documento define la estrategia técnica, quirúrgica e incremental para integrar **`@vxr/core` v0.1.0** dentro de la copia experimental de **Visor XR** (`PCPuma Visor arquitectonico`), respetando estrictamente la arquitectura existente y garantizando que no se pierda ninguna funcionalidad.

---

## 🎯 Principio Rector de la Integración

> **"Abstraer el trabajo repetitivo de Three.js sin obligar a la aplicación a abandonar su arquitectura de React 19 y R3F."**

Visor XR es una aplicación con interfaces ricas y componentes declarativos altamente especializados para arquitectura y Meta Quest 3S. La integración debe sustituir el código manual de bajo nivel de Three.js por los módulos estándar de VXR, sin alterar la experiencia de usuario ni la estructura de componentes.

---

## 1. MIGRAR AHORA (Fase Inmediata de Integración)

Esta fase reemplaza la fontanería de Three.js propensa a errores por los módulos probados de `@vxr/core`:

### A. Pipeline de Carga y Optimización de Modelos (`XRAssetManager`)
- **Archivo afectado**: `src/hooks/useModelLoader.ts`
- **Código a eliminar**:
  - Creación manual de `GLTFLoader` y `DRACOLoader`.
  - Configuración explícita de rutas CDN de decodificadores DRACO.
  - Recorrido recursivo manual de mallas para activar `frustumCulled`, `castShadow` y `receiveShadow`.
  - Cálculo manual de `Box3` envolvente y desplazamiento en $Y$ (`-box.min.y`) y en $X, Z$ (`-center.x`, `-center.z`).
  - Creación redundante de grupos de normalización.
- **Implementación con VXR**:
  - Instanciar `const assetManager = new XRAssetManager()`.
  - Cargar el modelo con `const loadedModel = await assetManager.loadGLTF(urlToLoad, { autoGround: true, autoCenter: true, onProgress })`.
  - Utilizar directamente `loadedModel.group` como el objeto de escena 3D a renderizar.

### B. Cálculo Estandarizado de Métricas Geométricas
- **Archivo afectado**: `src/utils/modelMetrics.ts`
- **Código a delegar en VXR**:
  - El cálculo de dimensiones físicas en metros (`width`, `height`, `depth`), centro geométrico, polígonos/triángulos, vértices y conteo de mallas pasa a ser provisto directamente por `loadedModel.metrics` de `@vxr/core`.
  - `modelMetrics.ts` conserva únicamente las reglas de negocio específicas de Visor XR:
    - Evaluación de umbral de rendimiento para Meta Quest (`isHeavy`: $>350k$ polígonos o $>35MB$).
    - Cálculo de escala óptima para maqueta de mesa (`recommendedScale`: $0.8 / \text{maxDim}$).

### C. Ciclo Estandarizado de Liberación de Memoria GPU (`disposeModel`)
- **Archivo afectado**: `src/hooks/useModelLoader.ts`
- **Código a eliminar**:
  - La función manual de recorrido y desecho de geometrías y materiales (`geometry.dispose()`, `material.dispose()`).
  - La llamada manual `dracoLoader.dispose()`.
- **Implementación con VXR**:
  - Invocar `assetManager.disposeModel(currentLoadedModel)` y `assetManager.dispose()` en la función de limpieza (`cleanup`) del `useEffect`.

---

## 2. MANTENER EN LA APLICACIÓN (Lógica Específica del Proyecto)

Las siguientes partes pertenecen legítimamente a la capa de producto de Visor XR y **NO deben ser reemplazadas**:

1. **Gestión de Estado de React**:
   - `useState` y `useRef` para controlar `isLoading`, `progress`, `error` y las referencias a URLs temporales (`URL.revokeObjectURL(prevBlobUrlRef)`).
2. **Soporte de Archivos Locales (`File` drag & drop)**:
   - La conversión de objetos `File` a URLs tipo blob y la extracción de `file.size`.
3. **Árbol Declarativo de R3F (`<Canvas>`)**:
   - La estructura de componentes de `@react-three/fiber` en `SceneCanvas.tsx`.
4. **Iluminación Arquitectónica Declarativa (`Lighting.tsx`)**:
   - Configuración JSX de sombras proyectadas con bias ajustado para maquetas arquitectónicas.
5. **Piso con Pedestal y Sombras Passthrough (`FloorGrid.tsx`)**:
   - El pedestal cilíndrico de diorama en modo maqueta, el plano de sombras semitransparente para AR y la superficie invisible de teletransporte.
6. **Lógica de Realidad Aumentada Passthrough**:
   - Detección de `session.mode === 'immersive-ar'` y conmutación de fondo y niebla transparentes en `useFrame`.
7. **Manipulación Bimanual (`TwoHandManipulator.tsx`)**:
   - Detección de botones squeeze en ambos mandos para escalar y rotar la maqueta en tiempo real con las dos manos.
8. **Navegación en Escala 1:1 (`TeleportManager.tsx` y `JoystickLocomotion.tsx`)**:
   - Sistemas de teletransporte parabólico y locomoción por joystick.
9. **Menú Flotante Espacial 3D (`VRFloatingMenu.tsx`)**:
   - Panel de control tridimensional en el espacio virtual.

---

## 3. NO MIGRAR (Decisiones Técnicas Excluidas)

Las siguientes migraciones fueron evaluadas y descartadas por ser técnicamente contraproducentes:

| Propuesta Descartada | Razón Técnica |
|---|---|
| **Reemplazar `<Canvas>` por `XRApp` imperativo** | Rompería la totalidad del árbol de componentes de React 19 (`TwoHandManipulator`, `VRFloatingMenu`, `OrbitControls`, `MetricsHUD`). Convertiría una aplicación modular en un script monolítico de Three.js. |
| **Reemplazar `@react-three/xr` por `XRSession`** | `XRSession` de VXR Core v0.1.0 solo soporta `immersive-vr` estándar; no soporta `immersive-ar` (cámaras de paso del Meta Quest 3S) ni provee sincronización reactiva con componentes de React. |
| **Reemplazar Drei `<OrbitControls>` por `XRApp.orbitControls`** | El componente de Drei está diseñado específicamente para sincronizarse con el ciclo de renderizado de R3F y respetar la cámara activa. |

---

## 4. POSIBLE FUTURA ABSTRACCIÓN (Para VXR v0.2+ y Módulos Satélite)

A partir de esta experiencia de integración, se identifican las siguientes oportunidades de abstracción:

1. **`@vxr/react` (Módulo Satélite)**:
   - Crear un hook oficial `useXRModel(url, options)` para que cualquier aplicación React/R3F pueda consumir el pipeline de assets de VXR con una sola línea de código.
2. **Soporte de AR Passthrough en `XRSession`**:
   - Extender `XRSession` para solicitar sesiones `immersive-ar` con `features: ['local-floor', 'hit-test']`.
3. **Módulo de Interacción Espacial (`@vxr/interactions`)**:
   - Estandarizar la manipulación bimanual de objetos (`TwoHandManipulator`) y teletransporte para cualquier visor WebXR.
4. **Módulo de Interfaz Espacial (`@vxr/ui`)**:
   - Abstraer menús flotantes 3D (`VRFloatingMenu`) para visores de inspección técnica.
