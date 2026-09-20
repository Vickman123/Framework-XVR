# VXR Documentation Index

Bienvenido al centro de documentación y aprendizaje de **VXR (Virtual & Extended Reality Framework)**.

VXR es una capa/framework de alto nivel construida en **TypeScript sobre Three.js y la WebXR Device API**, diseñada para acelerar la creación de simuladores interactivos, visores de arquitectura y experiencias inmersivas multiplataforma (Web / Desktop / VR Standalone).

---

## 🗺️ Mapa de Navegación de la Documentación

### 1. Introducción y Comienzo Rápido
- **[Guía de Inicio Rápido (Getting Started)](./getting-started.md)**: Configura tu primera escena VXR y carga un modelo 3D en menos de 5 minutos.
- **[Referencia Completa de la API v0.1.0](./api-reference.md)**: Documentación exhaustiva de todas las clases, métodos, propiedades y firmas de tipo de `@vxr/core`.

### 2. Fundamentos de Arquitectura y Decisiones (ADRs)
- **[Especificación de Arquitectura de VXR](./architecture.md)**: Capas del sistema, responsabilidades y flujo de ejecución.
- **Registros de Decisiones de Arquitectura (ADRs)**:
  - [ADR 001: Alcance del Framework y Delimitación](./decisions/001-framework-scope.md)
  - [ADR 002: Elección de Three.js como Base](./decisions/002-why-threejs-foundation.md)
  - [ADR 003: Tipado Estricto en TypeScript](./decisions/003-typescript-strict-typing.md)
  - [ADR 004: Patrón Fachada Abierta en XRApp](./decisions/004-facade-pattern-xrapp.md)
  - [ADR 005: Pipeline de Carga y Auto-Grounding de Assets](./decisions/005-asset-pipeline-grounding.md)
  - [ADR 006: Abstracción de Sesión y Controladores WebXR](./decisions/006-webxr-session-abstraction.md)
  - [ADR 007: Límite de Primitivas de Interacción](./decisions/007-interaction-primitives-boundary.md)

### 3. Modo Aprendizaje (Learning Mode — Módulos a Fondo)
Guías pedagógicas que explican qué hace cada clase interna, el porqué de cada decisión de diseño, y qué problema de Three.js resuelve:
- **[XRApp Explicado en Detalle](./learning/xrapp-explained.md)**
- **[XRScene Explicado en Detalle](./learning/xrscene-explained.md)**
- **[XRRenderer Explicado en Detalle](./learning/xrrenderer-explained.md)**
- **[XRSession Explicado en Detalle](./learning/xrsession-explained.md)**
- **[XRAssetManager Explicado en Detalle](./learning/xrassetmanager-explained.md)**
- **[Retos Prácticos de Aprendizaje (Challenges)](./learning/learning-challenges.md)**: 5 ejercicios comparativos para consolidar conceptos.

### 4. Auditoría Técnica y Diagnóstico
- **[Auditoría Técnica v0.1.0 (Reporte Exhaustivo)](./audit/v0.1.0-audit.md)**:
  - Inventario completo de clases y métodos.
  - Evaluación de ergonomía de la API pública.
  - Análisis de Three.js y WebXR (fugas de memoria, límites de hardware en Meta Quest).
  - Puntuación de madurez arquitectónica y riesgos.

### 5. Evolución y Futuro
- **[Hoja de Ruta v0.2.0 (Roadmap)](./roadmap-v0.2.md)**: Planificación de funcionalidades categorizadas en *MUST HAVE*, *SHOULD HAVE*, *FUTURE* y *DO NOT IMPLEMENT*.
- **[Bitácora de Aprendizaje (Learning Changelog)](./changelog-learning.md)**: Historia de evolución conceptual, hallazgos técnicos y lecciones aprendidas.

---

## 📦 Estructura del Monorepo

```
Framework VCXR/
├── packages/
│   └── core/                 # Código fuente de @vxr/core v0.1.0
│       ├── src/              # Implementación TypeScript
│       └── dist/             # Bundle compilado CJS/ESM
├── examples/                 # VXR Playground (Vite multi-página)
│   ├── basic-viewer/         # Validador de carga de modelos e iluminación
│   ├── architecture-viewer/  # Validador de inspección espacial y métricas
│   └── interaction-lab/      # Validador de raycasting y controladores WebXR
├── docs/                     # Documentación técnica, ADRs y Learning Mode
├── projects/                 # Proyectos de referencia de laboratorio (intactos)
│   ├── visor-xr/
│   ├── virus-purge/
│   └── simulador-pcpuma/
├── README.md                 # Presentación del proyecto
├── VISION.md                 # Misión, problema y principios rectores
└── ROADMAP.md                # Visión de versiones a largo plazo
```
