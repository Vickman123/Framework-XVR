# Bitácora de Aprendizaje y Evolución Arquitectónica (Learning Changelog)

Este documento registra cronológicamente las decisiones técnicas, lecciones aprendidas y descubrimientos conceptuales durante la génesis y maduración de VXR.

---

## [v0.1.0] — Génesis de VXR Core (2026)

### Contexto de Origen
El proyecto surgió tras analizar tres aplicaciones experimentales preexistentes en Three.js / WebXR:
1. `projects/visor-xr`: Visor arquitectónico con carga de modelos y navegación en primera persona.
2. `projects/virus-purge`: Shooter inmersivo con raycasting de controladores y dinámicas de juego.
3. `projects/simulador-pcpuma`: Simulador interactivo con checklist y manipulación de partes.

**Diagnóstico Inicial:**
- Más del 65% del código inicial en los tres proyectos era boilerplate repetitivo: inicialización de WebGLRenderer, configuración de luces, listeners de resize, creación del botón WebXR, carga de GLTFLoader y cálculo de vectores para raycasting.
- Cada proyecto resolvía el centrado de modelos y la detección de impactos de forma ligeramente distinta y propensa a bugs de escala.
- Fuga masiva de memoria GPU al reiniciar o cambiar de modelos por falta de llamadas explícitas a `.dispose()`.

---

### Descubrimientos Clave y Decisiones

#### 1. El Costo Silencioso del `devicePixelRatio` en VR
* **Descubrimiento:** En visores como Meta Quest 2 y 3, un `window.devicePixelRatio` descontrolado (o superior a 2.0) provoca que el chip Qualcomm Snapdragon XR2 intente renderizar a resoluciones gigantescas que sobrecalientan la GPU y disparan caídas de frames (framerate drops).
* **Solución VXR:** Establecer un límite rígido (`pixelRatioCap: 1.5`) por defecto en `XRRenderer`. El resultado fue una estabilidad de 72/90 FPS constante en los laboratorios de prueba.

#### 2. La Falacia de "Reinventar Three.js"
* **Aprendizaje:** Intentar crear un motor 3D desde cero o esconder completamente las clases de Three.js detrás de wrappers herméticos genera fricción inmediata y quita superpoderes al desarrollador.
* **Decisión:** VXR adopta el patrón **Fachada Abierta**. VXR abstrae el 80% del trabajo aburrido (setup, luces, centrado, raycast, loop), pero expone directamente `app.camera`, `app.threeScene` y `app.threeRenderer` para que cualquier shader, plugin o librería de Three.js siga funcionando sin adaptadores.

#### 3. El Desafío del Raycasting Unificado (Pantalla vs Espacio 3D)
* **Descubrimiento:** En aplicaciones multiplataforma (PC + Casco VR), los desarrolladores suelen escribir dos sistemas de interacción completamente divergentes:
  - Uno usando `THREE.Raycaster` con coordenadas normalizadas del ratón `(x, y) \in [-1, 1]`.
  - Otro usando la matriz de transformación del mando en WebXR para extraer origen y dirección en coordenadas de mundo.
* **Solución VXR:** Se crearon dos métodos paralelos en `XRApp`:
  - `app.raycastPointer(event, targets)`: Abstrae el cálculo de coordenadas normalizadas de pantalla.
  - `app.raycastController(index, targets)`: Abstrae la extracción de la matriz de mundo del láser.
  Ambos devuelven el mismo array estándar de `THREE.Intersection[]`, permitiendo que la lógica de negocio (resaltar objetos, abrir fichas) sea idéntica.

#### 4. Auto-Grounding Geométrico
* **Problema Común:** Los artistas 3D exportan modelos en Blender o 3ds Max con el origen en el centro de masa, haciendo que al cargarlos en Three.js el modelo aparezca enterrado en el piso (la mitad por debajo de $Y = 0$).
* **Solución VXR:** `XRAssetManager.groundObject()` calcula automáticamente el `Box3` envolvente del modelo y calcula el desplazamiento vertical negativo de su punto mínimo (`box.min.y`), elevando el grupo exactamente a la superficie de referencia.

#### 5. Separación Estricta de Responsabilidades: UI y Física Fuera del Core
* **Lección:** La tentación común al crear un framework XR es incluir física (Rapier) y paneles de interfaz de usuario en el núcleo.
* **Resultado:** La auditoría confirmó que mantener `@vxr/core` enfocado exclusivamente en render, escena, sesión y assets previene el bloatware y permite crear módulos satélite limpios (`@vxr/ui`, `@vxr/simulation`).

---

## Cronología de Hitos

- **Hito 1 (Análisis)**: Auditoría y mapeo de patrones en proyectos de referencia.
- **Hito 2 (Core v0.1.0)**: Construcción de `XRApp`, `XRScene`, `XRRenderer`, `XRSession`, `XRAssetManager`.
- **Hito 3 (Playground)**: Creación de suite de validación con Vite multi-página (`basic-viewer`, `architecture-viewer`, `interaction-lab`).
- **Hito 4 (Auditoría Técnica & Learning Mode)**: Documentación de arquitectura, 7 Decision Records (ADRs), 5 guías de aprendizaje a fondo, y suite de retos pedagógicos.
