# Arquitectura de VXR Framework

> Especificación técnica detallada de la arquitectura modular por capas de VXR.

---

## 1. Visión General de la Arquitectura

VXR está estructurado en una jerarquía estricta de capas que garantiza que el núcleo permanezca ligero, predecible y desacoplado, mientras que las herramientas de alto nivel se distribuyen en módulos especializados de inclusión voluntaria (*opt-in*).

```mermaid
graph TD
    subgraph CapaDeHardwareYPlataforma [Capa de Hardware y Plataforma]
        WebXR[WebXR Device API / Gamepad API]
        DOM[DOM / Teclado / Ratón / Pointer Lock]
        WebGL[WebGL2 / WebGPU / Canvas 3D]
    end

    subgraph CapaDeGraficos [Motor Gráfico Base]
        Three[Three.js Engine]
        ThreeScene[THREE.Scene / Meshes / Materials]
        ThreeRenderer[THREE.WebGLRenderer]
        ThreeCamera[THREE.PerspectiveCamera]
    end

    subgraph VXRCore [VXR Core (Runtime Fundamental)]
        Engine[VXR Engine & Loop]
        XRRig[XRRig & SessionManager]
        InputMgr[InputManager: Desktop + VR]
        Locomotion[Locomotion: Teleport + Snap Turn]
        Interactions[Spatial Interaction & Grabbables]
        EventBus[Typed EventBus]
    end

    subgraph VXRModules [Módulos Especializados VXR]
        VXRUI[@vxr/ui: Virtual Screens UV, WristHUD, 3D Menus]
        VXRSim[@vxr/simulation: Task Engine, Checklists, Scoring]
        VXRAssets[@vxr/assets: GLTF Loader, Metrics, Grounding, Disposal]
        VXRAudio[@vxr/audio: Procedural Web Audio Synthesizer]
    end

    subgraph CapaDeAplicacion [Capa de Aplicación y Soluciones]
        Visualizers[Visualizadores 3D / AEC / Maquetas]
        Simulators[Simuladores de Procedimiento e Inducción]
        Arcade[Experiencias Interactivas / Gamificación]
        ReactBridge[@vxr/react: Integración Declarativa R3F]
    end

    WebXR --> ThreeRenderer
    DOM --> InputMgr
    WebGL --> ThreeRenderer
    Three --> VXRCore
    VXRCore --> VXRModules
    VXRModules --> CapaDeAplicacion
```

---

## 2. Capas de la Arquitectura

### 2.1. Capa 0: Hardware y Navegador
- **WebXR Device API**: Provee acceso al visor (HMD), seguimiento de 6 grados de libertad (6DoF), espacios de referencia (`local-floor`), mandos y seguimiento de manos (*Hand Tracking*).
- **Gamepad API**: Lectura de botones, gatillos analógicos y thumbsticks.
- **Navegador Web**: Proporciona el bucle de eventos del DOM, `requestAnimationFrame`, `AudioContext` de la Web Audio API y el elemento `<canvas>`.

### 2.2. Capa 1: Motor Gráfico Base (Three.js)
Three.js permanece como el motor de renderizado indiscutible:
- VXR **no altera** la forma en que Three.js calcula la iluminación, proyecta sombras o compila shaders.
- Los objetos del mundo siguen siendo instancias estándar de `THREE.Object3D`, `THREE.Mesh` y `THREE.Group`.

### 2.3. Capa 2: VXR Core (El Runtime Fundamental)
El núcleo de VXR proporciona la infraestructura esencial requerida por cualquier aplicación interactiva XR:

```
┌────────────────────────────────────────────────────────────────────────┐
│                               VXR CORE                                 │
├───────────────────┬───────────────────┬────────────────────────────────┤
│    Lifecycle      │      XRRig &      │         Unified Input          │
│    & Loop         │  SessionManager   │  DesktopInput │ VRInput (Touch)│
├───────────────────┼───────────────────┼────────────────────────────────┤
│    Locomotion     │    Interaction    │           State & Comms        │
│ SnapTurn │ Teleport│Grabbables│Raycasts│      EventBus Singleton        │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

#### A. Ciclo de Vida y Bucle de Render (`Engine`)
- Orquesta el bucle unificado mediante `renderer.setAnimationLoop(callback)`.
- Mantiene una colección ordenada de componentes que implementan la interfaz `Updatable`:
  ```typescript
  export type Updatable = (delta: number, elapsedTime: number) => void;
  ```
- Gestiona un `THREE.Clock` de alta precisión, garantizando que todos los cálculos físicos, de movimiento y cinemática sean independientes de la tasa de fotogramas (*delta-time based*).

#### B. Plataforma Espacial (`XRRig`) y Sesión (`SessionManager`)
- **Jerarquía del Rig**:
  ```
  XRRig (THREE.Group)
  ├── Camera (THREE.PerspectiveCamera - controlada por HMD en VR)
  ├── LeftController (XRTargetRaySpace) -> Rayo Láser
  ├── LeftGrip (XRGripSpace) -> Malla visual / Menú en muñeca
  ├── RightController (XRTargetRaySpace) -> Rayo Láser / Apuntado
  ├── RightGrip (XRGripSpace) -> Malla visual / Herramienta activa
  ├── LeftHand (XRHandSpace) -> Soporte Hand Tracking
  └── RightHand (XRHandSpace) -> Soporte Hand Tracking
  ```
- **SessionManager**:
  - Solicita sesiones inmersivas (`immersive-vr`, `immersive-ar`) con características requeridas (`local-floor`, `hand-tracking`).
  - Negocia tasas de refresco óptimas mediante `session.updateTargetFrameRate(72 | 90)` para Meta Quest.
  - Detecta modo AR (Passthrough) y ajusta de forma transparente el fondo y la niebla de Three.js para no tapar las cámaras del visor.
  - Calibra el origen del operador al entrar en la sesión (reposicionamiento automático detrás del mostrador o frente a la mesa de inspección).

#### C. Subsistema de Entrada Unificado (`InputManager`)
Abstrae la disparidad entre ordenador de escritorio y visor inmersivo mediante la interfaz común `IInputSource`:
- **DesktopInput**:
  - Control de cámara en primera persona con Pointer Lock (`requestPointerLock`).
  - Movimiento tradicional WASD + teclado contextual (tecla `E` interactuar, `F` acción secundaria, `Q/R` rotar objeto inspeccionado).
- **VRInput**:
  - Identificación automática de lateralidad (`handedness: 'left' | 'right'`) evitando inversiones accidentales de mandos.
  - Lectura segura de thumbsticks según la especificación `xr-standard` con filtrado de zona muerta (*deadzone* de 0.15 a 0.20).
  - Emisión de impulsos hápticos calibrados (`triggerHaptic(intensity, duration)`).
  - Normalización de eventos: ambos sistemas emiten la misma señal hacia la lógica de la aplicación (`INTERACTION_TRIGGER`, `INTERACTION_GRAB`, `INTERACTION_INSPECT`).

#### D. Motor de Locomoción (`LocomotionManager`)
Diseñado para eliminar el mareo por movimiento (*motion sickness*):
1. **SnapTurnLatch (Giro Seguro por Pasos)**:
   - A diferencia de un simple temporizador de enfriamiento, implementa un **cerrojo de un solo disparo (*Single-Flick Latch*)**.
   - Al mover el joystick derecho más allá del umbral (p. ej. > 0.65), la rotación se ejecuta una sola vez (30° o 45°).
   - El sistema queda bloqueado hasta que el stick regresa físicamente a la zona neutra (< 0.28). Esto impide rotaciones continuas involuntarias que causan desorientación.
2. **TeleportArc (Teletransporte Parabólico)**:
   - Traza una parábola cinemática desde el mando hacia el plano del suelo.
   - Proyecta una retícula luminosa en el punto de impacto.
   - Al soltar el gatillo o el thumbstick, traslada la posición del `XRRig` instantáneamente.
3. **SmoothLocomotion (Desplazamiento Suave Opcional)**:
   - Locomoción analógica con el stick izquierdo, orientada por defecto hacia la mirada de la cabeza (*Head-Gaze Oriented*).

#### E. Motor de Interacción y Manipulación (`InteractionManager`)
1. **Interfaz `IGrabbable`**:
   Cualquier objeto que deba ser manipulado en la experiencia implementa este contrato:
   - `getRaycastTargets()`: Mallas activas para colisión.
   - `setHover(isHovered)`: Retroalimentación visual (material emisivo / resaltado).
   - `grab(holder)`: Anclaje al mando o a la cámara del jugador.
   - `release(dropPosition, dropRotation)`: Retorno a reposo o caída física.
   - `rotateHeld(delta)`: Capacidad de girar el objeto en las manos para inspeccionarlo detalladamente.
2. **Manipulación Bimanual (`TwoHandManipulator`)**:
   - Lectura simultánea de los grips izquierdo y derecho.
   - Detección de distancia entre ambas manos para aplicar escalado proporcional (*pinch-to-scale* con amortiguación).
   - Detección del ángulo relativo en el plano horizontal para rotar el modelo sobre el eje vertical $Y$.
   - Traslación coordinada basada en el punto medio entre ambas manos.
3. **Sistema de Encastre Magnético (`SnapTarget` / Bahías)**:
   - Detección de proximidad para acoplar objetos en ranuras predefinidas (por ejemplo: colocar una laptop en la bahía de un carro de carga o una tarjeta de identificación sobre un lector NFC).

#### F. Bus de Eventos Tipado (`EventBus`)
- Singleton centralizado que permite la comunicación desacoplada entre módulos.
- Permite que subsistemas como el gestor de tareas o la UI escuchen eventos como `OBJECT_GRABBED`, `NFC_SCANNED` o `TASK_STEP_COMPLETED` sin acoplarse con la escena 3D ni los controladores.

---

## 3. Módulos Especializados de VXR (Arquitectura de Paquetes)

Para evitar inflar el peso de las aplicaciones que solo requieren un visualizador estático, las capacidades avanzadas se distribuyen en módulos satélite:

```
@vxr/core ────────┬───► @vxr/ui
                  ├───► @vxr/simulation
                  ├───► @vxr/assets
                  └───► @vxr/audio
```

### 3.1. `@vxr/ui`: Interfaces Diegéticas y Pantallas 3D
Especializado en la creación de interfaces dentro del espacio tridimensional:
- **`VirtualScreen`**:
  - Encapsula un lienzo `<canvas>` 2D renderizado como textura en una malla 3D.
  - **Traductor UV-a-Pantalla**: Cuando el rayo interactivo impacta la malla, VXR lee `intersection.uv`, calcula las coordenadas en píxeles:
    $$x = \text{uv.x} \times \text{anchoCanvas}$$
    $$y = (1 - \text{uv.y}) \times \text{altoCanvas}$$
    y despacha eventos virtuales de `pointermove`, `pointerdown` y `click` sobre la jerarquía de botones de la interfaz 2D.
- **`DirtyCanvasTexture`**:
  - Sistema de bandera de ensuciado (`isDirty`). Solo envía la textura a la memoria de la GPU cuando los datos en pantalla cambian realmente, protegiendo los valiosos milisegundos de renderizado en Meta Quest.
- **`VRWristHUD`**:
  - Panel ultracompacto (256x128 px) anclado ergonómicamente a la muñeca izquierda del usuario para consultar estado, puntuación o ayuda en tiempo real.
- **`SpatialMenu`**:
  - Menús holográficos flotantes en el espacio con botones tridimensionales, soporte de hover lumínico y clics espaciales.

### 3.2. `@vxr/simulation`: Motor de Tareas y Capacitación
Convierte una escena 3D en un simulador formativo estructurado:
- **`TaskEngine`**:
  - Máquina de estados finita que define el flujo secuencial de una práctica formativa.
  - Valida requisitos previos antes de autorizar el avance al siguiente paso.
- **`ChecklistManager`**:
  - Mantiene el estado visual de la lista de tareas obligatorias del operador y emite retroalimentación cuando un paso se completa conforme o con errores.
- **`ScoreManager`**:
  - Algoritmo de evaluación en tiempo real: puntuación base, racha (*streak multiplier*), temporizador de turno, deducciones por negligencia y clasificación final del operador (p. ej. "Operador Experto", "En Inducción").
- **`DialogueBubble`**:
  - Sistema de globos de diálogo diegéticos con *billboarding* para personajes NPC guiados.

### 3.3. `@vxr/assets`: Pipeline de Modelos y Gestión de Memoria
- **`ModelLoader`**:
  - Carga asistida de archivos GLTF y GLB con decodificación DRACO y KTX2 integrada.
  - **Ground Alignment**: Calcula la caja envolvente (`THREE.Box3`) y ajusta la posición de la malla para que su base descanse exactamente sobre el plano $Y = 0$, eliminando modelos flotantes o enterrados.
  - **Metrics Evaluator**: Analiza volumen ($X \times Y \times Z$ en metros), número de vértices y polígonos, emitiendo una advertencia de rendimiento si el modelo excede los límites recomendados para Quest (> 250,000 triángulos).
- **`DisposalManager`**:
  - Recorre exhaustivamente la jerarquía de objetos y libera mallas, geometrías, materiales y texturas de la GPU de manera determinista al descargar un proyecto:
    ```typescript
    mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
    else mesh.material.dispose();
    ```

### 3.4. `@vxr/audio`: Síntesis Procedimental y Audio Espacial
- **`ProceduralAudioSynthesizer`**:
  - Generador de audio de latencia cero implementado con la **Web Audio API** nativa.
  - Crea efectos sonoros mediante osciladores sintetizados, filtros pasobanda y ráfagas de ruido blanco: pitidos de confirmación, alarmas de error, disparos, zumbidos electromagnéticos y clics de interfaz.
  - **Cero dependencias de archivos**: No requiere descargar decenas de archivos `.mp3` o `.wav`, reduciendo drásticamente el peso de la aplicación y eliminando tiempos de carga de red.
- **Audio Espacializado**:
  - Integración transparente con `THREE.PositionalAudio` y `THREE.AudioListener` para posicionar fuentes sonoras en coordenadas 3D del mundo.

---

## 4. Gestión de Rendimiento y Memoria en Meta Quest

Meta Quest es un dispositivo autónomo con un chip móvil que renderiza en estéreo (dos pantallas a alta resolución) a 72, 90 o 120 fotogramas por segundo. VXR incorpora una disciplina de ingeniería estricta:

1. **Evitar la recolección de basura (*Garbage Collection Free Loop*)**:
   - En el bucle de actualización no se crea ningún objeto temporal.
   - VXR mantiene variables vectoriales y matrices pre-asignadas en memoria interna (*Vector Pools*):
     ```typescript
     // Correcto en VXR:
     private static tempVec = new THREE.Vector3();
     private static tempMatrix = new THREE.Matrix4();
     ```
2. **Perfil Gráfico para Dispositivos Móviles**:
   - Forzar `precision: 'mediump'` en shaders de fragmentos si el dispositivo es un visor autónomo.
   - Limitar `setPixelRatio` a un máximo de 1.5 en visores (evitando el colapso por saturación de píxeles).
   - Uso de `LinearToneMapping` en simuladores de alto rendimiento o `ACESFilmicToneMapping` calibrado con sombras suaves y sesgo normal (`normalBias: 0.035`) para eliminar artefactos (*shadow acne*).
3. **Frustum Culling Mandatorio**:
   - Todas las mallas importadas son marcadas con `frustumCulled = true` para evitar que la GPU procese geometrías que se encuentran fuera del campo de visión del usuario.
