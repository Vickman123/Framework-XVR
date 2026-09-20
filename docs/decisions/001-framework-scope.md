# ADR 001: Definición del Alcance Arquitectónico y Fronteras de VXR Core

- **Estado**: Aprobado
- **Fecha**: 2026-09-16
- **Contexto**: Inicio del diseño y especificación del framework VXR

---

## 1. Contexto y Problemática

El análisis técnico de los tres proyectos experimentales de referencia (`/PCPuma Visor arquitectonico`, `/shooter simulator` y `/pcpum<a simulador`) reveló que:

1. **Patrones duplicados**: Los tres proyectos reimplementan de forma independiente rutinas críticas de interacción WebXR:
   - Lectura de ejes de thumbsticks y zonas muertas en mandos Meta Quest.
   - Algoritmos de giro por pasos (*snap turn*) para evitar el mareo.
   - Raycasting con rayos láser visibles y retículas de impacto.
   - Detección de sesiones inmersivas y adaptación de fondos/niebla para Realidad Aumentada (Passthrough).
   - Rutinas agresivas de liberación de memoria (`dispose()`) para evitar el cierre forzado del navegador en visores autónomos.
2. **Disparidad de tecnologías base**:
   - `PCPuma Visor arquitectonico` depende de **React 19, React Three Fiber y `@react-three/xr`**.
   - `shooter simulator` y `pcpum<a simulador` están escritos en **TypeScript puro sobre Three.js nativo**.
3. **Peligro de dispersión (Feature Creep)**:
   Si un framework XR intenta abarcar todo (motores de física pesada, editores de shaders, herramientas de red multiusuario y gestores de UI 2D para la web), se vuelve inmanejable, pesado y lento, perdiendo su ventaja frente a motores establecidos como Unity o Unreal Engine.

---

## 2. Decisión Arquitectónica

Se aprueba formalmente que:

1. **VXR Core será agnóstico de frameworks de UI**:
   El núcleo (`@vxr/core`) estará escrito exclusivamente en **TypeScript moderno y Three.js**. No tendrá dependencias de React, Vue, Angular ni Svelte. Esto permite que cualquier proyecto web pueda adoptarlo sin sobrecoste.
2. **React Three Fiber será soportado mediante un paquete adaptador opcional**:
   Se creará `@vxr/react` para desarrolladores que prefieran sintaxis declarativa JSX, pero este paquete será un consumidor del Core, nunca una dependencia del mismo.
3. **Delimitación estricta de responsabilidades**:
   - **Pertenece a Three.js**: Renderizado, mallas, geometrías, materiales PBR, shaders, iluminación, sombras, transformaciones matriciales y matemáticas fundamentales (`Vector3`, `Quaternion`, `Matrix4`).
   - **Pertenece a WebXR**: La negociación del contexto de hardware (`XRSession`), espacios de referencia (`local-floor`), seguimiento 6DoF y lectura de estados de botones crudos en la Gamepad API.
   - **Pertenece a VXR Core**:
     - Gestión del `XRRig` (cámara, mandos y manos unificados).
     - Abstracción de entrada (`IInputSource`) que unifica teclado/ratón en PC con mandos Touch en WebXR.
     - Locomoción anti-mareo (`SnapTurnLatch`, `TeleportArc`, `SmoothLocomotion`).
     - Contrato de manipulación de objetos espaciales (`IGrabbable`, `TwoHandManipulator`, `SnapTarget`).
     - Bucle de ciclo de vida con temporizador de alta precisión (`VXREngine`, `Updatable`).
     - Bus de eventos desacoplado (`EventBus`).
   - **Pertenece a Módulos Satélite Opcionales**:
     - `@vxr/ui`: Pantallas virtuales interactivas 3D con proyección UV a canvas, HUDs de muñeca y menús flotantes.
     - `@vxr/simulation`: Motor de pasos de tareas, listas de verificación de procedimientos y métricas de calificación.
     - `@vxr/assets`: Gestor de carga GLTF/GLB con auto-grounding, DRACO, evaluación de métricas y recolector de memoria.
     - `@vxr/audio`: Sintetizador de audio procedimental con Web Audio API pura.
4. **Quedan fuera del alcance del framework**:
   - Motores de física de cuerpos rígidos masivos (como Rapier o PhysX). Se favorece la física cinemática y de proximidad.
   - Editores visuales de escenas basados en navegador.
   - Red multijugador en tiempo real dentro del core.

---

## 3. Justificación y Beneficios

1. **Rendimiento predecible en Meta Quest**:
   Al eliminar el peso del vDOM de React del bucle de animación principal y evitar asignaciones de memoria dinámicas (*zero GC allocations*), VXR garantiza que las experiencias mantengan los 72Hz / 90Hz requeridos para una experiencia inmersiva confortable.
2. **Reutilización máxima**:
   Cualquier objeto interactivo (`Grabbable`), pantalla virtual (`VirtualScreen`) o protocolo de capacitación (`TaskEngine`) podrá compartirse directamente entre un visualizador arquitectónico, un juego de acción cibernética o un simulador de laboratorio sin reescribir código.
3. **Distribución web sin fricción**:
   El peso del bundle final de una aplicación VXR es de apenas unos pocos kilobytes sobre Three.js, cargando en fracciones de segundo frente a los cientos de megabytes habituales de compilaciones WebGL tradicionales de motores propietarios.

---

## 4. Consecuencias Negativas y Mitigaciones

- **Consecuencia**: Los desarrolladores que utilicen React Three Fiber necesitarán instalar `@vxr/react` además de `@vxr/core`.
  - **Mitigación**: Diseñar `@vxr/react` con hooks ergonómicos (`useGrabbable`, `useVirtualScreen`) que expongan el poder del núcleo con sintaxis idiomática de React.
- **Consecuencia**: No contar con un motor de física pesada limita aplicaciones como simulaciones de choques o demolición de estructuras.
  - **Mitigación**: El 95% de los simuladores profesionales y visualizadores solo requieren agarre, colocación magnética (*snap*) y colisión por rayos/cajas delimitadoras. Para casos complejos de física masiva, VXR permitirá conectar librerías externas de física mediante componentes de extensión.
