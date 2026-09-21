# 🌌 VXR — High-Level WebXR & 3D Interactive Framework for Three.js

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r174-black.svg?logo=three.js)](https://threejs.org/)
[![WebXR](https://img.shields.io/badge/WebXR-Device%20API-orange.svg)](https://immersiveweb.dev/)
[![Meta Quest](https://img.shields.io/badge/Meta%20Quest-2%20%7C%203%20%7C%203S%20%7C%20Pro-0081fb.svg?logo=meta)](https://www.meta.com/quest/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **VXR (Virtual & Extended Reality Framework)** es una capa de abstracción de alto nivel en TypeScript construida **sobre Three.js y la WebXR Device API**.
>
> Diseñada para crear visualizadores arquitectónicos, simuladores técnicos interactivos y videojuegos inmersivos en minutos, eliminando más del **70% del código repetitivo** de configuración de WebGL, auto-grounding y mandos de realidad virtual.

🌐 **Demo & Catálogo Interactivo en Vivo**:  
👉 **[https://vickman123.github.io/Framework-XVR/](https://vickman123.github.io/Framework-XVR/)**

---

## ⚡ Cómo Usar VXR en CUALQUIER Proyecto (Sin Descargar la Web)

Puedes utilizar VXR como dependencia directa en cualquier proyecto nuevo de Node.js / Vite / Webpack **sin clonar el repositorio ni descargar el sitio web**:

### 1. Instalación Directa con npm desde GitHub

En la terminal de tu proyecto ejecuta:

```bash
npm install github:Vickman123/Framework-XVR
npm install three @types/three
```

¡Listo! Ya tienes VXR disponible como paquete npm (`vxr`) listo para importar:

```typescript
import { XRApp } from 'vxr';
```

---

### Otras Formas de Instalación

* **Opción A (Carpeta Standalone `VXR/`)**:  
  Copia la carpeta [`VXR/`](./VXR) dentro de tu nuevo proyecto y ejecuta `npm install ./VXR`.
* **Opción B (Archivo Comprimido `.tgz`)**:  
  Copia el archivo [`VXR/vxr-0.1.0.tgz`](./VXR/vxr-0.1.0.tgz) (32 KB) y ejecuta `npm install ./vxr-0.1.0.tgz`.

---

## 🚀 Código de Inicio Rápido (En 4 líneas)

Crea una experiencia 3D interactiva completa para PC y Meta Quest en un archivo `main.ts`:

```typescript
import { XRApp } from 'vxr';

// 1. Inicializar la app (Renderer WebGL2, Escena, Luces, Cámara, OrbitControls y WebXR)
const app = new XRApp({
  container: '#app',       // Contenedor DOM o selector (por defecto document.body)
  autoVRButton: true,      // Crea el botón flotante 'ENTER VR'
  enableShadows: true,     // Sombras suaves PCF Soft automáticas
  enableGrid: true,        // Rejilla de suelo métrica
  pixelRatioCap: 1.5,      // Límite de resolución para Meta Quest (evita sobrecalentamiento)
});

// 2. Cargar modelo GLTF/GLB con auto-grounding (lo apoya exactamente en Y = 0)
await app.loadModel('./models/edificio.glb', {
  autoGround: true,
  autoCenter: true,
  onProgress: (p) => console.log(`Cargando: ${p}%`),
});

// 3. Iniciar el bucle de renderizado WebGL / WebXR
app.start();
```

---

## 🎯 Interacción Unificada: Desktop + Meta Quest VR

En VXR, el mismo código de interacción funciona tanto con el ratón en escritorio como con los punteros láser en los mandos de realidad virtual:

```typescript
// Clic con ratón en PC o Touch en móvil
window.addEventListener('click', (event) => {
  const hits = app.raycastPointer(event);
  if (hits.length > 0) {
    console.log('Objeto seleccionado:', hits[0].object.name);
  }
});

// Gatillo en mandos de Meta Quest (WebXR)
app.session.onSelect((event, controllerIndex) => {
  const hits = app.raycastController(controllerIndex);
  if (hits.length > 0) {
    console.log('Impacto con rayo láser:', hits[0].object.name);
  }
});

// Lógica de actualización frame a frame
app.onUpdate((delta, elapsed) => {
  // delta = tiempo transcurrido en segundos
});
```

---

## 🏛️ Módulos y Arquitectura (Patrón Fachada Abierta)

VXR **NO oculta Three.js**. Tienes acceso directo a la API nativa de Three.js en cualquier momento:

```
┌─────────────────────────────────────────────────────────────┐
│                 Tu Aplicación / Experiencia                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       XRApp (Fachada)                       │
│   • Orquestación de ciclo de vida                           │
│   • app.raycastPointer() / app.raycastController()          │
│   • app.loadModel() / app.onUpdate()                        │
└───────┬──────────────┬──────────────┬──────────────┬────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
  │  XRScene  │  │XRRenderer │  │ XRSession │  │XRAssetMgr │
  │• THREE.   │  │• WebGL2   │  │• WebXR VR │  │• GLTF     │
  │  Scene    │  │• Shadows  │  │• Laser Ray│  │• DRACO    │
  │• Presets  │  │• PixelCap │  │• VR Button│  │• Grounding│
  │• Luces    │  │• XR Loop  │  │• Squeeze  │  │• Métricas │
  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
        │              │              │              │
        └──────────────┴───────┬──────┴──────────────┘
                               ▼
               ┌──────────────────────────────┐
               │    Three.js (r174) & WebXR   │
               └──────────────────────────────┘
```

* `app.threeScene` → Acceso nativo a `THREE.Scene`.
* `app.threeRenderer` → Acceso nativo a `THREE.WebGLRenderer`.
* `app.camera` → Acceso nativo a `THREE.PerspectiveCamera`.
* `app.orbitControls` → Controles orbitales de escritorio.
* `app.scene` → Módulo [`XRScene`](./docs/learning/xrscene-explained.md) (luces, presets y grid).
* `app.renderer` → Módulo [`XRRenderer`](./docs/learning/xrrenderer-explained.md) (resize y bucle).
* `app.session` → Módulo [`XRSession`](./docs/learning/xrsession-explained.md) (mandos, rayos láser y VR button).
* `app.assets` → Módulo [`XRAssetManager`](./docs/learning/xrassetmanager-explained.md) (GLTF, DRACO, métricas).
* `app.scenario` → Módulo [`XRScenario` / `XRRoom`](./docs/guides/scenario-and-rooms.md) (salas 3D procedimentales y colisiones).

---

## 🏛️ Creación Rápida de Escenarios y Salas 3D (`v0.2.0`)

Diseñado especialmente para principiantes y personas con poca experiencia en programación. Crea salas completas con paredes, suelos, techos, lámparas y vanos de puertas calculados automáticamente:

```typescript
import { XRApp } from 'vxr';

const app = new XRApp({ enableVR: true });
const scenario = app.createScenario('Campus Virtual');

// 1. Crear Sala Galería
const lobby = scenario.addRoom({
  id: 'lobby',
  dimensions: { width: 12, depth: 10, height: 3.5 },
  theme: 'gallery', // 'gallery' | 'scifi' | 'office' | 'cozy' | 'minimal'
  doors: [{ wall: 'north', targetRoomId: 'lab' }]
});

// 2. Crear Sala Laboratorio
const lab = scenario.addRoom({
  id: 'lab',
  center: [0, 0, -18],
  dimensions: { width: 14, depth: 12, height: 4.2 },
  theme: 'scifi',
  doors: [{ wall: 'south', targetRoomId: 'lobby' }]
});

// 3. Conectar automáticamente con un pasillo iluminado
scenario.connectRooms('lobby', 'north', 'lab', 'south');

// 4. Colisiones de pared automáticas (el jugador no puede atravesar muros)
app.onUpdate((delta) => {
  const proposedPos = player.position.clone().add(velocity.multiplyScalar(delta));
  const safePos = app.constrainToScenario(player.position, proposedPos);
  player.position.copy(safePos);
});

app.start();

// O si prefieres no programar, cárgalo directo de un archivo JSON:
await app.loadScenario('./escenario.json');
```

---

## 🎮 Catálogo Interactivo de Experiencias

El repositorio incluye un catálogo interactivo con **7 experiencias en vivo** listas para probar:

| Experiencia | Categoría | Tecnologías | Descripción |
|---|---|---|---|
| **📐 Basic Viewer** | Demo Core | `@vxr/core`, Three.js | Carga rápida GLTF/GLB, auto-grounding y reset orbital. |
| **🏛️ Architecture Viewer** | Demo Core | `@vxr/core`, Three.js | Inspección de mallas CAD/BIM con raycast, highlight y presets de luz. |
| **⚡ XR Interaction Lab** | Demo Core | `@vxr/core`, WebXR | Interacción física dual: hover/clic en PC y mandos con láser en VR. |
| **🏛️ Scenario & Room Builder** | Demo Core v0.2 | `@vxr/core`, WebXR | Creación de salas procedimentales, vanos de puertas, pasillos y colisiones AABB. |
| **🏢 PCPuma Visor XR** | Referencia | React 19, R3F, Quest AR | Visor arquitectónico con manipulación bimanual y passthrough AR. |
| **👾 Virus Purge** | Referencia | Three.js, WebXR | Videojuego arcade shooter FPS inmersivo en el ciberespacio. |
| **💻 Simulador PC PUMA** | Referencia | Three.js, WebXR | Simulador interactivo de ensamble, mantenimiento y tareas guiadas. |

🌐 **Prueba el catálogo en vivo**: [https://vickman123.github.io/Framework-XVR/](https://vickman123.github.io/Framework-XVR/)

---

## 📚 Centro de Documentación

Toda la documentación técnica y pedagógica está disponible en la carpeta [`docs/`](./docs):

* 🚀 **[Guía de Inicio Rápido (Getting Started)](./docs/getting-started.md)**: Configura tu proyecto en 5 minutos.
* 🏛️ **[Guía: Escenarios y Salas 3D (Scenario & Rooms)](./docs/guides/scenario-and-rooms.md)**: Tutorial paso a paso para crear salas y mapas transitables.
* 📖 **[Referencia de la API v0.1.0](./docs/api-reference.md)**: Documentación exhaustiva de todas las clases y métodos.
* 🏗️ **[Especificación de Arquitectura](./docs/architecture.md)**: Diseño por capas y principios.
* 🧠 **[Modo Aprendizaje (Learning Mode)](./docs/learning/)**:
  * [XRApp Explicado](./docs/learning/xrapp-explained.md)
  * [XRScene Explicado](./docs/learning/xrscene-explained.md)
  * [XRRenderer Explicado](./docs/learning/xrrenderer-explained.md)
  * [XRSession Explicado](./docs/learning/xrsession-explained.md)
  * [XRAssetManager Explicado](./docs/learning/xrassetmanager-explained.md)
  * [5 Retos Prácticos Three.js vs VXR](./docs/learning/learning-challenges.md)
* ⚖️ **[Decisiones de Arquitectura (ADRs)](./docs/decisions/)**:
  * [ADR 001: Alcance del Core](./docs/decisions/001-framework-scope.md)
  * [ADR 002: Elección de Three.js](./docs/decisions/002-why-threejs-foundation.md)
  * [ADR 003: Tipado Estricto](./docs/decisions/003-typescript-strict-typing.md)
  * [ADR 004: Patrón Fachada Abierta](./docs/decisions/004-facade-pattern-xrapp.md)
  * [ADR 005: Auto-Grounding de Assets](./docs/decisions/005-asset-pipeline-grounding.md)
  * [ADR 006: Abstracción de Sesión WebXR](./docs/decisions/006-webxr-session-abstraction.md)
  * [ADR 007: Límite de Interacción](./docs/decisions/007-interaction-primitives-boundary.md)
* 🔍 **[Auditoría Técnica v0.1.0](./docs/audit/v0.1.0-audit.md)**: Diagnóstico de 8 fases sobre hardware Quest y fugas GPU.
* 🗺️ **[Hoja de Ruta v0.2.0 (Roadmap)](./docs/roadmap-v0.2.md)**: Planificación de próximas capacidades.

---

## 💻 Desarrollo Local

Para correr el proyecto, el catálogo y las demos en tu máquina:

```bash
# 1. Clonar el repositorio
git clone git@github.com:Vickman123/Framework-XVR.git
cd Framework-XVR

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abre en tu navegador:  
👉 `http://localhost:5173/` (o desde tu Meta Quest en la IP local que muestre la terminal).

### Comandos Disponibles

```bash
npm run dev           # Inicia el catálogo de experiencias en modo desarrollo
npm run build         # Compila @vxr/core, el paquete VXR y el Playground
npm run build:pages   # Genera la distribución completa lista para GitHub Pages
```

---

## 📄 Licencia

MIT © 2026 VXR Framework
