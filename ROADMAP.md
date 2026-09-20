# Roadmap de Desarrollo de VXR

> Plan de ejecución por fases, hitos de ingeniería, gestión de riesgos técnicos y directrices sobre decisiones diferidas.

---

## 📅 Visión General de las Fases

```
+---------------------------------------------------------------------------------------+
| FASE 0: Investigación, Análisis y Especificación Arquitectónica (COMPLETADA)           |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| FASE 1: VXR Core Foundation (Núcleo, Entrada Unificada, Rig y Ciclo de Vida)         |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| FASE 2: Toolkit de Interacción Espacial y Locomoción (Agarre, Teleport, Snap Turn)   |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| FASE 3: Interfaces Diegéticas y Pantallas 3D (@vxr/ui: Canvas UV, Wrist HUD, Menús)   |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| FASE 4: Framework de Simulación y Capacitación (@vxr/simulation: Tasks, Checklists)   |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| FASE 5: Assets, Audio Procedimental y Perfiles Quest (@vxr/assets, @vxr/audio)        |
+---------------------------------------------------------------------------------------+
                                           │
                                           ▼
+---------------------------------------------------------------------------------------+
| FASE 6: Adaptador React Three Fiber (@vxr/react) y Migración de Laboratorios         |
+---------------------------------------------------------------------------------------+
```

---

## 🚀 Detalle de Fases y Entregables

### Fase 0: Investigación y Análisis de Referencia (Hito Actual)
- **Objetivo**: Diseccionar exhaustivamente los tres proyectos de laboratorio existentes (`/PCPuma Visor arquitectonico`, `/shooter simulator`, `/pcpum<a simulador`), identificar patrones duplicados, resolver discrepancias de diseño y documentar la arquitectura fundacional de VXR.
- **Entregables**:
  - `README.md`
  - `VISION.md`
  - `ROADMAP.md`
  - `docs/architecture.md`
  - `docs/api.md`
  - `docs/decisions/001-framework-scope.md`

---

### Fase 1: VXR Core Foundation (El Núcleo Mínimo Viable)
- **Objetivo**: Construir el motor base agnóstico en TypeScript sin dependencias externas más allá de Three.js.
- **Módulos clave**:
  - `Engine`: Bucle de animación unificado (`setAnimationLoop`), reloj de alta precisión, registro de componentes actualizables (`Updatables`).
  - `XRRig`: Plataforma jerárquica que ancla la cámara, los mandos (`XRTargetRaySpace`, `XRGripSpace`) y las manos (`XRHandSpace`), permitiendo traslación y rotación coherente del jugador en el espacio del mundo.
  - `SessionManager`: Negociación segura de sesiones WebXR (`immersive-vr`, `immersive-ar`), detección de capacidades, calibración de espacio de referencia (`local-floor`) y ajuste automático de tasa de refresco (72Hz / 90Hz / 120Hz).
  - `InputManager` + `IInputSource`: Abstracción completa de entrada.
    - `DesktopInput`: Teclado WASD, PointerLockControls, eventos de ratón.
    - `VRInput`: Lectura normalizada de mandos Meta Quest Touch con `gp.mapping === 'xr-standard'`, zonas muertas y retroalimentación háptica.
  - `EventBus`: Sistema de publicación/suscripción tipado para desacoplar componentes sin generar dependencias circulares.

---

### Fase 2: Toolkit de Interacción Espacial y Locomoción
- **Objetivo**: Proveer los bloques de construcción para moverse e interactuar en el espacio sin fatiga ni cinetosis.
- **Módulos clave**:
  - `Locomotion`:
    - `SnapTurnLatch`: Giro por pasos (30° o 45°) con cerrojo de retorno al centro (*single-flick latch*) para evitar giros continuos involuntarios.
    - `SmoothLocomotion`: Desplazamiento analógico orientado a la dirección de la cabeza (*head-gaze*) o del mando.
    - `TeleportArc`: Trazado parabólico con detección de colisión contra planos o mallas de suelo, con retícula visual reactiva.
  - `Interaction`:
    - `RaycastManager`: Cola optimizada de rayos espaciales para escritorio y mandos VR, con caché de intersecciones.
    - `Grabbable`: Interfaz y clase base para objetos manipulables: soporte de agarre con mando o gesto de pellizco (*hand pinch*), offset de agarre ergonómico, rotación local y modo inspección.
    - `TwoHandManipulator`: Transformación espacial bimanual (separar manos = escalar, mover ambas = trasladar, girar = rotación en Y).
    - `SnapTarget` / `SlotSystem`: Puntos de atracción magnética para acoplar objetos en estanterías, carros o estaciones de trabajo.

---

### Fase 3: Interfaces Diegéticas y Pantallas 3D (`@vxr/ui`)
- **Objetivo**: Resolver la interacción con interfaces gráficas dentro de la inmersión 3D.
- **Módulos clave**:
  - `VirtualScreen`: Proyección de interfaces `<canvas>` sobre mallas 3D (pantallas de computadoras, quioscos interactivos). Mapeo automático de intersecciones de raycast UV `(u, v)` a coordenadas `(x, y)` de canvas con dispatch de eventos táctiles/ratón.
  - `DirtyCanvasTexture`: Textura de Three.js optimizada con bandera de ensuciado (`isDirty`) para evitar transferencias redundantes CPU -> GPU en cada fotograma.
  - `VRWristHUD`: Interfaz compacta diegética anclada a la muñeca o al mando del usuario, ideal para métricas de salud, inventario o estado actual de la tarea.
  - `SpatialMenu`: Paneles flotantes 3D en el espacio con botones interactivos con estados de reposo, hover y activación con sonido háptico.

---

### Fase 4: Framework de Simulación y Capacitación (`@vxr/simulation`)
- **Objetivo**: Estandarizar la lógica de negocio para simuladores educativos y de entrenamiento profesional.
- **Módulos clave**:
  - `TaskEngine` / `StepStateMachine`: Definición declarativa de procedimientos paso a paso con validaciones previas (*prerequisites*), acciones requeridas y transiciones de estado.
  - `ChecklistManager`: Sincronización bidireccional entre las acciones realizadas en el mundo 3D y la lista de verificación visual para el operador.
  - `ScoreManager`: Motor de evaluación con puntuación base, multiplicadores de racha, penalizaciones por infracción o error de protocolo y cálculo de rangos de certificación.
  - `DialogueBubble`: Globos de diálogo espacializados para personajes no jugables (NPCs) con temporizador automático y orientación hacia la cámara (*billboarding*).

---

### Fase 5: Pipeline de Assets, Audio y Presets de Rendimiento (`@vxr/assets`, `@vxr/audio`)
- **Objetivo**: Automatizar la carga de recursos y garantizar la tasa de fotogramas en hardware limitado.
- **Módulos clave**:
  - `ModelLoader`: Carga de modelos GLTF/GLB con soporte para compresión DRACO/KTX2, cálculo automático de métricas (caja envolvente, dimensiones reales en metros, conteo de triángulos/vértices), centrado automático y anclaje a ras de suelo (`y = 0`).
  - `DisposalManager`: Recolector agresivo de memoria GPU para geometrías, materiales, texturas y buffers al cambiar de nivel o modelo, evitando fugas en el navegador de Meta Quest.
  - `ProceduralAudioSynthesizer`: Generador de efectos de audio en tiempo real con Web Audio API pura (disparos, pitidos de confirmación, alarmas, clics mecánicos) sin necesidad de cargar archivos MP3/WAV pesados.
  - `QuestPreset`: Configuración predefinida recomendada para WebGLRenderer en Quest (`precision: 'mediump'`, `setPixelRatio(1.5)`, sombras optimizadas con sesgo normal y `LinearToneMapping`).

---

### Fase 6: Adaptador React y Modernización de Proyectos de Laboratorio
- **Objetivo**: Crear la capa declarativa `@vxr/react` para React Three Fiber y probar el framework migrando selectivamente módulos de los tres proyectos de laboratorio.
- **Módulos clave**:
  - Hooks de conveniencia: `useVXR()`, `useGrabbable()`, `useVirtualScreen()`, `useTaskStep()`.
  - Componentes: `<VXRProvider>`, `<XRRig>`, `<InteractiveScreen>`, `<SnapZone>`.
  - Migración piloto: Refactorizar `/PCPuma Visor arquitectonico` y `/pcpum<a simulador` como consumidores oficiales de los paquetes `@vxr/*`.

---

## ⚠️ Riesgos Técnicos y Estrategias de Mitigación

| Riesgo Técnico | Impacto | Estrategia de Mitigación en VXR |
| :--- | :--- | :--- |
| **Micro-pausas por Garbage Collection (GC)** | Alto (Caída de FPS en Quest que provoca mareo). | Cero asignaciones `new THREE.Vector3()` o `new THREE.Matrix4()` dentro del bucle `update()`. Reutilización estricta de objetos temporales en memoria estática interna (*vector pools*). |
| **Sobrecarga de subida de texturas de Canvas** | Medio-Alto (Retardo al interactuar con pantallas virtuales). | Implementar patrón `DirtyCanvas`: únicamente marcar `texture.needsUpdate = true` cuando el contenido visual del canvas haya mutado realmente, limitando la resolución máxima a 1024x640. |
| **Fugas de memoria GPU al alternar modelos** | Alto (El navegador Meta Quest Browser crashea por Out-Of-Memory tras abrir 3-4 modelos). | Unificar la rutina de destrucción `dispose()` implementada en `useModelLoader` dentro del `DisposalManager` central de VXR. |
| **Incompatibilidad de mapeo en mandos XR** | Medio (Comportamiento anómalo en cascos que no sean Quest). | Priorizar el estándar oficial del W3C `xr-standard` y proveer un perfil de mapeo alternativo configurable (*fallback controller mapping*). |
| **Carga de CPU en cálculos de colisión y raycast** | Medio (Pérdida de rendimiento con escenas de alta densidad poligonal). | Raycast limitado a listas filtradas de mallas interactivas (`interactiveLayer`), en lugar de recorrer toda la jerarquía de la escena. |

---

## 🚫 Decisiones que NO Deben Tomarse Prematuramente

Para garantizar la estabilidad y evitar la trampa del *overengineering*, las siguientes decisiones quedan explícitamente **pospuestas**:

1. **NO casar el Core de VXR con ningún framework de frontend**:
   El Core será 100% TypeScript independiente. No asumir React, Vue, Svelte ni Solid en el núcleo.
2. **NO integrar un motor de física rígida pesada (Rapier / PhysX / Cannon) en el Core**:
   Los simuladores de capacitación y visualizadores requieren *física cinemática* (agarrar, soltar, detectar solapamiento de cajas y encaje en ranuras). Un motor de dinámica de cuerpos rígidos añade 2-4MB al bundle y penaliza la CPU móvil innecesariamente. La física pesada podrá ser un plugin opcional externo.
3. **NO crear un formato de archivo 3D propietario ni escena personalizada**:
   VXR utiliza el estándar abierto de la industria **glTF / GLB (Khronos Group)**. Cualquier metadato extra se añadirá mediante atributos de objeto o extensiones estándar.
4. **NO construir un editor visual 3D propietario en esta etapa**:
   Herramientas como Blender o editores web existentes cubren la edición de geometría. VXR es un framework de código para desarrolladores, no una suite visual en la nube.
5. **NO incluir sincronización de red / multijugador en el Core**:
   VXR Core resolverá impecablemente la experiencia de un solo usuario en su estación de trabajo o visor. El soporte multiusuario (WebSockets / WebRTC) se explorará en una etapa avanzada como capa superior.
