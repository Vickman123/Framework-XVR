# Visión de VXR (Virtual eXperience Runtime)

> Documento de visión estratégica, definición de alcance y filosofía arquitectónica.

---

## 1. Declaración de Intenciones

**VXR** es un framework de alto nivel diseñado para acelerar la construcción de **experiencias XR interactivas, simuladores formativos, herramientas de capacitación y visualizadores 3D profesionales** que corren de manera nativa en la web utilizando **Three.js** y **WebXR**.

### Lo que VXR ES:
- Una capa de abstracción centrada en la **experiencia del usuario y la interacción espacial**.
- Un conjunto de patrones probados en producción para **Meta Quest (navegador autónomo)** y **navegadores de escritorio**.
- Una arquitectura modular que estandariza la entrada de usuario, la navegación, la manipulación de objetos, las interfaces diegéticas (en el mundo 3D) y los sistemas de tareas/evaluación.
- Una base sólida para proyectos serios: capacitación industrial, simuladores de procedimientos, recorridos de arquitectura e ingeniería (AEC) y visualización científica/comercial.

### Lo que VXR NO ES:
- **NO es un reemplazo de Three.js**: No compite con Three.js ni duplica sus clases matemáticas, estructuras de escena o sistema de materiales.
- **NO es un motor genérico de videojuegos**: No intenta clonar Unity, Unreal Engine ni Godot.
- **NO es un framework genérico de VR/AR para todo propósito**: No busca soportar interfaces 2D tradicionales en el DOM ni complejas simulaciones de física masiva (destrucción de vóxeles, dinámicas de fluidos).
- **NO es exclusivo de React**: Aunque ofrece enlaces con React Three Fiber, su núcleo vive en TypeScript puro para garantizar portabilidad y rendimiento sin ataduras.

---

## 2. El Problema que VXR Resuelve

El ecosistema actual de WebXR sufre de un abismo evidente entre las herramientas disponibles:

```
+-----------------------------------------------------------------------+
| Nivel Alto: Motores Cerrados / Pesados                                |
| (Unity WebGL, Unreal Pixel Streaming, Wonderland Engine)              |
| Problemas: Runtimes pesados (30-100MB), tiempos de carga lentos,     |
| licencias comerciales, ecosistema web aislado o dependencias binarias.|
+-----------------------------------------------------------------------+
                                  ▲
                         EL VACÍO QUE CUBRE VXR
                                  ▼
+-----------------------------------------------------------------------+
| Nivel Bajo: Three.js + WebXR Device API                                |
| Problemas: Tareas repetitivas, sin estándares de interacción,        |
| manipulación manual de Gamepad API, raycasters frágiles, náusea por   |
| giros mal implementados, fugas de memoria al cambiar modelos GLTF.   |
+-----------------------------------------------------------------------+
```

### Problemas concretos identificados en los proyectos de laboratorio:

1. **Reinvención continua del sistema de entrada (Input Fragmentation)**:
   En cada proyecto se vuelve a escribir el código para escuchar `session.inputSources`, leer botones de disparo y empuñadura (*squeeze*), mapear sticks analógicos con zonas muertas y detectar si el usuario usa ratón de PC o mandos Touch de Meta Quest.
2. **Locomoción y problemas de cinetosis (*Motion Sickness*)**:
   Implementar un giro por pasos (*snap turn*) seguro requiere un pestillo (*latch*) para evitar que un stick inclinado gire la cámara 30 veces en un segundo. La teletransportación requiere arcos parabólicos, retículas reactivas y validación de superficies transitables.
3. **Manipulación de objetos tridimensionales**:
   El agarre de objetos (*grabbables*), el escalado bimanual (*pinch-to-scale*), la rotación sobre ejes locales y el encaje en ranuras (*slot snapping*) demandan cientos de líneas de matemáticas complejas que terminan acopladas a la lógica de negocio.
4. **Interfaces de usuario dentro del mundo 3D (Spatial & Diegetic UI)**:
   HTML/CSS sobre el DOM no funciona dentro de un visor WebXR inmersivo. El desarrollador se ve obligado a dibujar en elementos `<canvas>` 2D, transferirlos a `CanvasTexture` y mapear intersecciones UV de raycast a coordenadas de pantalla manualmente.
5. **Simulaciones estructuradas y flujos de capacitación**:
   No existe en la web un estándar para definir pasos de una tarea, listas de verificación (*checklists*), detección de errores del operador y métricas de evaluación sin construir un sistema a medida desde cero.
6. **Optimización crítica para Meta Quest**:
   Los visores autónomos tienen presupuestos estrictos de CPU y GPU móvil (chips Snapdragon XR2/Adreno). Errores como usar mapas de sombra excesivos, no liberar texturas/geometrías (`dispose()`) o no fijar la tasa de refresco a 72Hz provocan caídas drásticas de fotogramas y rechazo del usuario.

---

## 3. Relación con las Tecnologías Base

### 3.1. Relación con Three.js
**Three.js es el cimiento de renderizado gráfico de VXR.**
- VXR utiliza las estructuras nativas de Three.js: `THREE.Scene`, `THREE.WebGLRenderer`, `THREE.PerspectiveCamera`, `THREE.Group`, `THREE.Mesh`, `THREE.Raycaster`, etc.
- **Regla de oro**: VXR no envuelve clases de Three.js solo por crear una capa sintáctica. Si un usuario quiere agregar una luz o cambiar un material PBR, usa Three.js directamente.
- VXR añade comportamiento, ciclo de vida y orquestación a los nodos de Three.js mediante composición y gestores (*managers*).

### 3.2. Relación con WebXR
**WebXR es la pasarela de comunicación con el hardware.**
- VXR gestiona el ciclo de vida de la sesión (`navigator.xr.requestSession`), la solicitud de espacios de referencia (`local-floor`, `bounded-floor`), los listeners de conexión de mandos y la configuración de frecuencias de refresco (`updateTargetFrameRate` a 72Hz / 90Hz).
- VXR normaliza los eventos crudos (`selectstart`, `squeezestart`, `gamepad.axes`) transformándolos en eventos de alto nivel: `onGrab`, `onRelease`, `onInspect`, `onSmartAction`, `onPointerHover`.

### 3.3. Relación con React Three Fiber (R3F)
**R3F es un consumidor y adaptador opcional de VXR, no su núcleo.**
- Como demostró el proyecto de referencia `/PCPuma Visor arquitectonico`, R3F es excelente para catálogos web, configuradores reactivos y aplicaciones donde la UI DOM convive con el lienzo 3D.
- Sin embargo, atar VXR exclusivamente a React obligaría a proyectos de simulación procedimental (como `/shooter simulator` y `/pcpum<a simulador`) a asumir el coste del reconciliador de React, renderizados innecesarios y dependencias pesadas.
- **Estrategia**: El Core de VXR se construye en TypeScript agnóstico. Posteriormente, se ofrecerá un paquete `@vxr/react` con hooks (`useVXR`, `useGrabbable`, `useLocomotion`) y componentes declarativos (`<VXRCanvas>`, `<XRRig>`, `<VirtualScreen>`).

---

## 4. Matriz de Responsabilidades y Alcance

Para mantener el framework enfocado y ligero, establecemos límites estrictos:

| Funcionalidad | ¿Pertenece a VXR Core? | ¿Pertenece a Three.js? | ¿Módulo Opcional VXR? |
| :--- | :---: | :---: | :---: |
| **Grafo de escena, Mallas, Shaders, Materiales PBR** | ❌ | ✅ | ❌ |
| **Render loop y pipeline WebGL/WebGPU** | ❌ | ✅ | ❌ |
| **Matemáticas 3D (Vector3, Matrix4, Quaternion, Euler)** | ❌ | ✅ | ❌ |
| **Gestión de XR Rig y espacios de referencia** | ✅ | ❌ | ❌ |
| **Abstracción de entrada unificada (Desktop / XR)** | ✅ | ❌ | ❌ |
| **Locomoción (Teleport con arco, Snap Turn, Smooth)** | ✅ | ❌ | ❌ |
| **Sistema de objetos agarrables (*Grabbables*)** | ✅ | ❌ | ❌ |
| **Bus de eventos interno de la experiencia (`EventBus`)** | ✅ | ❌ | ❌ |
| **Carga de modelos con métricas y auto-alineado** | ❌ | ❌ | ✅ (`@vxr/assets`) |
| **Pantallas virtuales e interfaces espaciales (UV Canvas)** | ❌ | ❌ | ✅ (`@vxr/ui`) |
| **Motor de tareas, checklists y evaluación de capacitación** | ❌ | ❌ | ✅ (`@vxr/simulation`) |
| **Sintetizador procedimental de audio Web Audio API** | ❌ | ❌ | ✅ (`@vxr/audio`) |
| **Física rígida pesada (Rapier / PhysX / Cannon)** | ❌ | ❌ | ❌ (Plugins de terceros) |

---

## 5. Enfoque de Experiencias Objetivo

VXR no persigue ser una solución para cualquier cosa en 3D. Se optimiza con precisión quirúrgica para cinco familias de aplicaciones:

1. **Visualizadores 3D Interactivos**:
   - Inspección de modelos arquitectónicos, industriales o de producto.
   - Modos duales: Maqueta sobre mesa (*Diorama Mode*) vs Escala real 1:1 (*Walkthrough Mode*).
   - Manipulación espacial con dos manos (escalar, rotar, mover en el aire).
   - Cálculo instantáneo de métricas (dimensiones físicas, conteo de triángulos, advertencias de rendimiento).
2. **Simuladores de Procedimientos**:
   - Recreación fidedigna de estaciones de trabajo (mostradores, tableros, consolas técnicas).
   - Interacción con instrumental, equipos y periféricos (lectores NFC, laptops, botones físicos, palancas).
   - Lógica de encaje en ranuras o bahías de almacenamiento con retroalimentación visual y háptica.
3. **Herramientas Educativas y de Capacitación**:
   - Guiado paso a paso con listas de verificación (*checklists*).
   - Validación de requisitos normativos antes de habilitar la siguiente acción.
   - Detección de fallos o conductas no reglamentarias del operador.
   - Evaluación final con calificación cuantitativa, tiempo de turno y racha de aciertos.
4. **Terminales y Sistemas Diegéticos en VR**:
   - Monitores de computadora en 3D que funcionan como software real dentro de la simulación.
   - Mapeo de clics mediante rayos láser hacia coordenadas de textura 2D en tiempo real.
   - Menús en la muñeca (*Wrist HUD*) con visualización rápida de estado sin saturar el campo de visión.
5. **Experiencias Profesionales WebXR Multiplataforma**:
   - Código que funciona con total naturalidad con **Ratón + Teclado (WASD + Pointer Lock)** en PC de oficina y con **Mandos + Seguimiento de Manos** al ponerse un Meta Quest 3S.
   - Cero fricción de instalación: se distribuye mediante un enlace HTTPS estándar.
