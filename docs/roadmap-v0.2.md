# VXR — Hoja de Ruta Técnica (Roadmap) v0.2.0

Este documento formaliza la propuesta arquitectónica y funcional para la versión **v0.2.0** de VXR, basada en los aprendizajes obtenidos de la auditoría de v0.1.0 y la validación en los tres laboratorios experimentales (`basic-viewer`, `architecture-viewer`, `interaction-lab`).

---

## Filosofía de Evolución

VXR no busca convertirse en un motor monolítico. La regla dorada de v0.2.0 es:
> **"Perfeccionar las abstracciones ergonómicas de visualización e interacción espacial sin inflar el runtime ni duplicar Three.js."**

---

## 1. Categorización de Funcionalidades

### 🔴 MUST HAVE (Imprescindibles para v0.2.0)

Estas características corrigen cuellos de botella ergonómicos o de estabilidad identificados durante la auditoría:

| Característica | Justificación Técnica | Módulo Afectado |
|---|---|---|
| **Laser Ray Dinámico (Depth Shortening)** | Actualmente el rayo láser mide 5 metros fijos y atraviesa objetos. Debe truncarse en `hit.distance` cuando impacta una malla interactiva, proyectando un retículo/punto en el punto de contacto. | `XRSession.ts` |
| **Configuración de Tonemapping y Precisión** | Permitir configurar `toneMapping` (`ACESFilmicToneMapping` vs `LinearToneMapping`) y `precision` (`mediump` para Quest) en `XRAppOptions`. | `XRRenderer.ts`, `XRAppOptions` |
| **Tipado Estricto de GLTF** | Reemplazar dependencias de tipos laxos por exportaciones limpias de `GLTF` con soporte opcional de genéricos (`LoadedModel<T>`). | `types.ts`, `XRAssetManager.ts` |
| **Manejo de Pérdida de Contexto WebGL** | Escuchar `webglcontextlost` y `webglcontextrestored` en `XRRenderer` para evitar congelamientos silenciosos si el sistema operativo recupera memoria GPU en visores standalone. | `XRRenderer.ts` |
| **Control de Animaciones GLTF Integrado** | Soporte nativo para reproducir animaciones embebidas en GLTF (`THREE.AnimationMixer`) sin obligar al usuario a programarlo manualmente en `app.onUpdate`. | `XRAssetManager.ts`, `XRApp.ts` |

---

### 🟡 SHOULD HAVE (Muy deseables para v0.2.0)

Mejoras que aumentan significativamente la calidad de la experiencia en visores WebXR sin romper la API existente:

| Característica | Justificación Técnica | Módulo Afectado |
|---|---|---|
| **Soporte de Botón Grip (`squeezestart` / `squeezeend`)** | Habilitar eventos para el botón de agarre lateral de los mandos Oculus Touch, esencial para mecánicas de agarrar objetos o teletransporte. | `XRSession.ts` |
| **Negociación de Tasa de Refresco (72Hz / 90Hz / 120Hz)** | Solicitar `session.updateTargetFrameRate(90)` en Quest si el visor lo soporta, mejorando la fluidez y reduciendo la cinetosis. | `XRSession.ts` |
| **Fallback Local para Decodificador DRACO** | Permitir empaquetar los decodificadores DRACO en `public/draco/` local para funcionamiento en redes cerradas o sin internet. | `XRAssetManager.ts` |
| **Manejador de Luces Dinámico** | Métodos convenientes para reubicar la luz solar o ajustar sombras según el tamaño del modelo cargado (`app.scene.adjustShadowBounds(model)`). | `XRScene.ts` |

---

### 🔵 FUTURE (Planificado para v0.3+ en paquetes separados)

Estas capacidades **no deben ingresar a `@vxr/core`**; se construirán como paquetes satélite en el monorepo:

| Módulo Satélite | Propósito | Estado |
|---|---|---|
| `@vxr/ui` | Menús espaciales 3D interactivos, paneles de texto renderizados sobre texturas dinámicas Canvas2D, botones cilíndricos. | Diseño conceptual |
| `@vxr/simulation` | Motor de tareas, checklist guiado para simuladores médicos/técnicos, máquina de estados finitos espacial. | Fase de requisitos |
| `@vxr/hands` | Detección de gestos de pellizco (*pinch*), puño y palma abierta mediante WebXR Hand Tracking API. | Prototipo externo |

---

### ⛔ DO NOT IMPLEMENT (Anti-Metas Explícitas)

Cualquier PR o propuesta que contenga los siguientes elementos será **rechazada** para mantener el Core ligero:

1. **Física Pesada Integrada (Rapier / PhysX / Cannon)**:
   - *Por qué no*: Agrega entre 1.5MB y 3MB de WebAssembly. Las experiencias de inspección arquitectónica y viewer no la necesitan. La física debe ser un conector opcional externo.
2. **Networking / Multiplayer en el Core**:
   - *Por qué no*: VXR es un framework de visualización y UX espacial. La sincronización de estados (WebRTC / WebSockets) depende de la infraestructura del cliente.
3. **Editor Visual Web (tipo Unity/PlayCanvas)**:
   - *Por qué no*: Distrae del objetivo de una API TypeScript ágil y declarativa para desarrolladores de código.
4. **Agentes de IA en el Core**:
   - *Por qué no*: La lógica cognitiva pertenece a la capa de aplicación o servicios de backend.

---

## 2. Criterios de Aceptación para v0.2.0

Para dar por aprobada la versión v0.2.0, el framework deberá superar los siguientes tests:

1. **Test de Regresión Visual**:
   - Los 3 ejemplos existentes (`basic-viewer`, `architecture-viewer`, `interaction-lab`) deben compilar y funcionar al 100% sin modificaciones de código que rompan compatibilidad.
2. **Test de Interacción Láser**:
   - En Meta Quest, el láser no debe atravesar paredes ni objetos marcados como interactuables; el punto de impacto debe colocarse sobre la superficie normal.
3. **Mapeo de Controladores**:
   - Un usuario debe poder capturar eventos de gatillo (`select`) y agarre (`squeeze`) en menos de 5 líneas de código:
   ```typescript
   app.session.onSelect((e, idx) => console.log('Gatillo', idx));
   app.session.onSqueeze((e, idx) => console.log('Agarre', idx));
   ```
4. **Reproducción de Animación**:
   - Cargar un modelo animado y reproducir su acción por defecto en una sola línea:
   ```typescript
   const model = await app.loadModel('robot.glb');
   model.playAnimation('Walk');
   ```

---

## 3. Matriz de Riesgos y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|---|---|---|---|
| Incompatibilidad de `updateTargetFrameRate` en navegadores móviles no-Chromium | Medio | Alta | Proteger la llamada con chequeo condicional de características: `if ('updateTargetFrameRate' in session)`. |
| Desbordamiento de memoria por animaciones no desechadas | Alto | Media | Registrar los `AnimationMixer` en el ciclo de `disposeModel()` del `XRAssetManager`. |
| Aumento de tamaño del bundle core | Alto | Baja | Mantener `@vxr/core` por debajo de 40KB gzipped (excluyendo Three.js). Realizar análisis de bundle en CI. |
