# Arquitectura de Build y Runtime de VXR para Meta Quest

> **Documento de Diseño Técnico y Especificación Arquitectónica**  
> **Versión:** 0.2.0-draft  
> **Estado:** Propuesta en revisión (Fase 1 completada)

---

## 1. Visión y Objetivos

El propósito de esta extensión es dotar a **VXR** de una suite de compilación, diagnóstico e inicialización en tiempo de ejecución orientada a **Meta Quest Browser** mediante **WebXR**, conservando la filosofía central de VXR:
- **"Open Facade"**: El desarrollador conserva acceso irrestricto a Three.js (`THREE.Scene`, `THREE.WebGLRenderer`, `THREE.PerspectiveCamera`).
- **WebXR Nativo en la Web**: No se convierte VXR en un framework Android nativo cerrado. Se produce una aplicación WebXR optimizada para ejecutarse a altos fotogramas por segundo (72/90/120 Hz) directamente en el navegador del visor.
- **Sin Bloatware**: Cero dependencias nativas pesadas (sin Android SDK, NDK, Gradle o empaquetadores Java en esta fase).
- **Código Universal (Write Once, Run Everywhere)**: El mismo código de aplicación debe correr en Desktop (PC/Mac/móvil con OrbitControls/Pointer) y en Meta Quest (mandos 6DoF, WebXR `immersive-vr`) sin modificar una sola línea de lógica de usuario.

---

## 2. Auditoría del Estado Actual del Repositorio

| Componente | Estado Actual en el Código | Observaciones y Oportunidades |
|---|---|---|
| **Arquitectura de Paquetes** | Monorepo con npm workspaces (`packages/*`, `examples`). Código fuente duplicado entre `packages/core/src` y `VXR/src`. | El CLI y los nuevos módulos deben sincronizarse en ambas rutas para garantizar que tanto la compilación del workspace como el paquete empaquetado (`vxr-0.1.0.tgz`) tengan paridad exacta. |
| **Punto de Entrada** | `XRApp.ts` orquesta `XRScene`, `XRRenderer`, `XRSession`, `XRAssetManager`. | `XRApp` es el lugar idóneo para recibir la opción `runtime: 'auto' \| 'desktop' \| 'webxr'` sin alterar ninguna firma pública existente. |
| **WebXR (`XRSession.ts`)** | Soporta `immersive-vr`, controladores 6DoF (rayos láser, grips), eventos `sessionstart`/`sessionend` y botón HTML flotante `#vxr-vr-button`. | Requiere modularización para permitir negociación segura de framerate (72Hz/90Hz/120Hz en Quest), configuración de hand-tracking opcional y delegación en un `XRRuntime`. |
| **Renderizado (`XRRenderer.ts`)** | `WebGLRenderer` con `antialias: true`, shadows `PCFSoftShadowMap`, pixelRatio tope de 1.5, `setAnimationLoop`. | Requiere perfilado específico de Quest: en visores standalone el pixelRatio debe respetar el viewport del compositor WebXR y limitar sombras costosas. |
| **Carga de Modelos (`XRAssetManager.ts`)** | Carga GLTF/GLB, integra DRACOLoader (Google CDN), calcula `ModelMetrics` (volumen, vértices, triángulos, número de mallas), disposición GPU en `disposeObject`. | El cálculo de métricas es directamente reutilizable para el módulo `QuestBuildOptimizer` y el comando `vxr doctor`. |
| **Build & Tooling** | TypeScript 5.8 + Vite 6 en `examples/vite.config.ts`. Sin CLI existente. | Se puede incorporar un CLI liviano (`bin/vxr.js`) aprovechando el API programática de Vite y Node.js `fs/path`. |
| **Versiones** | `package.json` declara `0.1.0`. `roadmap-v0.2.md` proyecta `0.2.0`. Algunos walkthroughs mencionan `0.3.0`. | **Inconsistencia detectada:** Se mantiene `0.1.0` en los `package.json` actuales y se documentará la transición planificada a `0.2.0`. |

---

## 3. Arquitectura Propuesta

```
                                  ┌──────────────────────────┐
                                  │      CLI de VXR          │
                                  │   (bin/vxr.js / cli/)    │
                                  └─────────────┬────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
        ┌─────────────────┐           ┌───────────────────┐          ┌───────────────────┐
        │   vxr doctor    │           │ vxr build --target│          │ vxr build --target│
        │                 │           │        web        │          │       quest       │
        └────────┬────────┘           └─────────┬─────────┘          └─────────┬─────────┘
                 │                              │                              │
                 ▼                              ▼                              ▼
      ┌─────────────────────┐        ┌─────────────────────┐        ┌─────────────────────┐
      │  VXRDoctor Engine   │        │     WebTarget       │        │    QuestTarget      │
      │ - Env check (TS/3JS)│        │  - Bundling estándar│        │ - PWA WebManifest   │
      │ - WebXR & HTTPS     │        │  - Assets copia pura│        │ - Meta tags WebXR   │
      │ - Static asset scan │        │  - HTML boilerplate │        │ - Quest Build Opt.  │
      │ - Quest perf audit  │        └─────────────────────┘        │ - Runtime preset inj│
      └─────────────────────┘                                       └──────────┬──────────┘
                                                                               │
                                                                               ▼
                                                                    ┌─────────────────────┐
                                                                    │ QuestBuildOptimizer │
                                                                    │ - Texture budget    │
                                                                    │ - Mesh / Poly check │
                                                                    │ - Non-destructive   │
                                                                    └─────────────────────┘

────────────────────────────────────────────────────────────────────────────────────────────────
                                RUNTIME ARQUITECTURA (VXR Core)

                                    ┌───────────────────────┐
                                    │         XRApp         │
                                    │    (Open Facade)      │
                                    └───────────┬───────────┘
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │    XRRuntime System   │
                                    │      (Strategy)       │
                                    └───────┬───────┬───────┘
                                            │       │
                        ┌───────────────────┘       └───────────────────┐
                        ▼                                               ▼
             ┌─────────────────────┐                         ┌─────────────────────┐
             │   DesktopRuntime    │                         │    WebXRRuntime     │
             │ - OrbitControls     │                         │ - WebXR Session Mgr │
             │ - Mouse/Touch rays  │                         │ - 6DoF Controllers  │
             │ - 60 FPS loop       │                         │ - Quest 72/90/120Hz │
             │ - Canvas fallback   │                         │ - Adaptive PixelR.  │
             └─────────────────────┘                         └─────────────────────┘
```

---

## 4. Diseño del Sistema de CLI (`vxr`)

### 4.1. Comandos y Sintaxis
```bash
# Diagnóstico integral del proyecto y compatibilidad Quest
vxr doctor

# Compilación estándar para la web
vxr build
vxr build --target web

# Compilación web optimizada para Meta Quest Browser
vxr build --target quest

# Compilación para Meta Quest con auditoría y optimizaciones recomendadas
vxr build --target quest --optimize
```

### 4.2. Jerarquía Extensible de Targets (`BuildTarget`)
```typescript
export interface BuildOptions {
  projectRoot: string;
  outDir: string;
  optimize?: boolean;
  target: 'web' | 'quest' | 'quest-pwa';
}

export interface BuildResult {
  target: string;
  outputDirectory: string;
  files: string[];
  warnings: string[];
  recommendations: string[];
}

export interface BuildTarget {
  readonly name: string;
  build(options: BuildOptions): Promise<BuildResult>;
}
```
1. **`WebTarget`**: Compila mediante Vite la aplicación web tradicional hacia `dist/`, generando `index.html`, bundles JS/CSS limpios y copiando assets.
2. **`QuestTarget`**: Hereda o envuelve la compilación web, e inyecta:
   - `manifest.webmanifest` con `"display": "fullscreen"`, `"orientation": "landscape"`, `"theme_color": "#070b14"`.
   - Meta tags en `index.html`: `<meta name="mobile-web-app-capable" content="yes">`, `<meta name="theme-color" content="#070b14">`, flags WebXR.
   - Documento descriptivo `dist/QUEST_DEPLOY.md` con instrucciones paso a paso para abrir la URL HTTPS en Meta Quest Browser.
   - Ejecución del `QuestBuildOptimizer`.
3. **`QuestPWATarget` (Placeholder para Fase 7)**:
   - Interfaz arquitectónica lista para conectar empaquetadores WebAPK / PWA 2D para la tienda Oculus/Meta Horizon Store sin incluir dependencias nativas pesadas en esta etapa.

---

## 5. Módulo `QuestBuildOptimizer`

Analiza de manera estática y no destructiva los recursos del proyecto:
- **Presupuesto de Geometría**:
  - Advierte si algún modelo `.glb` / `.gltf` excede 20 MB o ~500k polígonos recomendados para GPU móvil Adreno 740/XR2.
- **Presupuesto de Texturas**:
  - Detecta texturas superiores a 2048x2048 px o archivos PNG/JPG mayores a 4 MB sin compresión KTX2/WebP.
- **Presupuesto de Iluminación y Sombras**:
  - Sugiere limitar mapas de sombra a un tamaño máximo de 1024 o 2048 y evitar más de 2 luces emisoras de sombras dinámicas.
- **Comportamiento No Destructivo**:
  - `vxr build --target quest`: Realiza escaneo pasivo, advertencias en consola y reporte en `dist/vxr-quest-report.json`.
  - `vxr build --target quest --optimize`: Inyecta ajustes de configuración en el runtime de salida (pixelRatio 1.0, sombras conservadoras) sin corromper ni sobrescribir los modelos originales del usuario.

---

## 6. Módulo `VXR Doctor` (`vxr doctor`)

Ejecuta un diagnóstico por capas con diferenciación rigurosa:

```
VXR Doctor
────────────────────────────────────────────────────
[Local Environment]
  ✓ Node.js (v20.x detectado)
  ✓ TypeScript (v5.8.x detectado)
  ✓ Three.js (^0.174.0 disponible)
  ✓ VXR Core (@vxr/core importable)

[Project Configuration]
  ✓ index.html presente en la raíz del proyecto
  ✓ Punto de entrada JavaScript/TypeScript válido
  ✓ Directorio de assets localizado

[WebXR & Quest Preparedness]
  ✓ Invocación de navigator.xr o XRSession detectada
  ✓ VR Button / Entrypoint configurado
  ✓ Requisito HTTPS (WebXR exige origen seguro o localhost)
  ⚠ 1 modelo GLB de gran tamaño detectado (sample.glb > 25MB)
  💡 Recomendación: Reducir resolución de texturas a máximo 2048x2048 para Quest

[Hardware Capabilities Note]
  ℹ Las tasas de refresco de 90Hz/120Hz, el Hand Tracking real y la GPU Adreno
    solo se verifican en tiempo de ejecución (runtime) dentro del visor físico.
────────────────────────────────────────────────────
Resultado: Proyecto listo para WebXR en Meta Quest (con 1 sugerencia de optimización).
```

---

## 7. Abstracción de Runtime (`XRRuntime`)

### 7.1. Interfaz y Estrategia
```typescript
export interface XRRuntime {
  readonly id: 'desktop' | 'webxr';
  readonly isVRSupported: boolean;
  init(app: XRApp): Promise<void>;
  update(delta: number, elapsed: number): void;
  dispose(): void;
}
```

### 7.2. Implementaciones
- **`DesktopRuntime`**:
  - Activa `OrbitControls`.
  - Procesa eventos de mouse y touch para `raycastPointer()`.
  - Mantiene el bucle a 60 FPS.
- **`WebXRRuntime`**:
  - Encapsula `XRSession` y controladores 6DoF (`THREE.XRTargetRaySpace`).
  - Escucha `sessionstart` y `sessionend`.
  - Al iniciar sesión en Meta Quest Browser:
    - Negocia de forma segura la tasa de refresco (`session.updateTargetFrameRate(90)` con fallback condicional).
    - Ajusta el pixel ratio óptimo para evitar caídas de fotogramas.
  - Al salir de sesión, transiciona limpiamente a modo de escritorio sin reiniciar la escena.

### 7.3. Compatibilidad Total con la API Existente
`XRApp` preserva intactos todos sus métodos y propiedades:
- `app.session` (instancia de `XRSession`)
- `app.raycastPointer()`
- `app.raycastController()`
- `app.start()`
- `app.controls`
- `app.camera`
- `app.nativeScene`
- `app.nativeRenderer`
- `app.assets`
- `app.onUpdate()`
- `app.onControllerSelect()`

---

## 8. Archivos que se Modificarán y Archivos Nuevos

### Archivos Nuevos
1. `packages/core/src/runtime/XRRuntime.ts` y `VXR/src/runtime/XRRuntime.ts`: Interfaz base de runtime.
2. `packages/core/src/runtime/DesktopRuntime.ts` y `VXR/src/runtime/DesktopRuntime.ts`: Runtime para navegador de escritorio.
3. `packages/core/src/runtime/WebXRRuntime.ts` y `VXR/src/runtime/WebXRRuntime.ts`: Runtime con soporte avanzado para Meta Quest.
4. `packages/core/src/runtime/questDetection.ts` y `VXR/src/runtime/questDetection.ts`: Detección de capabilities WebXR en runtime (sin depender únicamente de User-Agent).
5. `src/cli/index.ts` o `packages/cli/`:
   - `src/cli/vxr.ts`: Punto de entrada de la herramienta CLI.
   - `src/cli/commands/doctor.ts`: Implementación de `vxr doctor`.
   - `src/cli/commands/build.ts`: Orquestador del comando `vxr build`.
   - `src/cli/targets/BuildTarget.ts`: Interfaz común de target.
   - `src/cli/targets/WebTarget.ts`: Target web estándar.
   - `src/cli/targets/QuestTarget.ts`: Target optimizado para Meta Quest.
   - `src/cli/targets/QuestPWATarget.ts`: Placeholder y especificación para futura PWA.
   - `src/cli/optimizer/QuestBuildOptimizer.ts`: Analizador de presupuestos de assets.
6. `bin/vxr.js`: Ejecutable Node.js con shebang `#!/usr/bin/env node`.
7. `examples/quest-basic/`:
   - `index.html`: Boilerplate HTML limpio con WebXR y viewport.
   - `main.ts`: Experiencia interactiva (escena, luces, modelo, interacción dual desktop/Quest, botón VR).
   - `package.json`: Configuración local de ejemplo.
8. `docs/quest.md`: Guía exhaustiva para desarrolladores sobre Meta Quest Browser, HTTPS y optimización.
9. `tests/cli.test.ts`: Pruebas automatizadas para el CLI, doctor, targets y optimizador.

### Archivos que se Modificarán
1. `packages/core/src/types.ts` y `VXR/src/types.ts`: Incorporación de `runtime?: 'auto' | 'desktop' | 'webxr' | XRRuntime` y opciones de Quest en `XRAppOptions`.
2. `packages/core/src/XRApp.ts` y `VXR/src/XRApp.ts`: Integración de la capa `XRRuntime` preservando 100% la API pública.
3. `packages/core/src/XRSession.ts` y `VXR/src/XRSession.ts`: Soporte para negociación de framerate y detección segura de capacidades.
4. `packages/core/src/XRRenderer.ts` y `VXR/src/XRRenderer.ts`: Ajuste adaptativo de pixel ratio para Quest.
5. `packages/core/src/index.ts` y `VXR/src/index.ts`: Exportación de tipos y clases de `XRRuntime`.
6. `package.json` (raíz) y `VXR/package.json`: Registro de `"bin": { "vxr": "./bin/vxr.js" }` y scripts correspondientes.
7. `README.md`: Documentación de comandos CLI y flujo de trabajo para Meta Quest.

---

## 9. Dependencias Necesarias

Para mantener VXR ligero y fiel a su filosofía:
- **Para Runtime (`@vxr/core` / `vxr`)**: **CERO dependencias adicionales**. Se utiliza únicamente `three` (ya existente) y las APIs estándar del navegador (`WebXR Device API`, `DOM`, `WebGL2`).
- **Para Herramientas CLI**:
  - `commander` o parser CLI nativo Node.js sin dependencias para procesar argumentos (`build`, `doctor`, flags). Se propone usar un parser ligero sin dependencias externas pesadas o una dependencia estándar probada como `commander`.
  - Reutilización de `vite` (ya presente en devDependencies) para el empaquetado de producción.

---

## 10. Matriz de Riesgos y Mitigaciones

| Riesgo Técnico | Impacto | Mitigación Arquitectónica |
|---|---|---|
| **Requisito HTTPS en Meta Quest** | Crítico | WebXR en Meta Quest Browser exige **HTTPS obligatorio** (salvo `localhost`). Si el desarrollador prueba desde su PC en red local (`http://192.168.x.x`), WebXR fallará silenciosamente. `vxr doctor` y `dist/QUEST_DEPLOY.md` documentan explícitamente soluciones como túneles seguros (`ngrok`, `cloudflared`), HTTPS local (`vite-plugin-basic-ssl`), o despliegue en GitHub Pages/Vercel. |
| **Pérdida de Rendimiento en Visores Standalone** | Alto | El procesador móvil de Quest sufre si se superan los límites de draw calls o si se usan texturas 4K sin comprimir. `QuestBuildOptimizer` advierte proactivamente sobre tamaños de textura y conteo de triángulos. |
| **Incompatibilidad de `updateTargetFrameRate`** | Medio | Protegido con verificación de características: `if ('updateTargetFrameRate' in session)`. Jamás asume que 90Hz o 120Hz están disponibles sin comprobar `session.supportedFrameRates`. |
| **Rotura de la Fachada Open Facade** | Crítico | `XRApp` no oculta Three.js. Todos los getters (`app.nativeScene`, `app.nativeRenderer`, `app.camera`, `app.session`) permanecen idénticos. |

---

## 11. Resumen: Qué Queda Dentro de VXR vs Qué Depende de Herramientas Externas

### Dentro de VXR:
- Abstracción de runtime adaptativo (`XRRuntime`, `DesktopRuntime`, `WebXRRuntime`).
- Detección de capacidades WebXR y optimización de renderizado para Quest en runtime.
- Herramienta CLI (`vxr build`, `vxr doctor`).
- Orquestador de targets (`WebTarget`, `QuestTarget`).
- Analizador de presupuestos de recursos (`QuestBuildOptimizer`).
- Generación de manifiestos web PWA para Meta Quest Browser (`manifest.webmanifest`).
- Ejemplo completo multiplataforma (`examples/quest-basic/`).

### Dependencias de Herramientas Externas (Documentadas, no simuladas):
- **Certificados SSL / Túnel HTTPS**: El desarrollador debe proveer un entorno HTTPS seguro (GitHub Pages, Vercel, o `mkcert`/`ngrok`) para probar en el visor físico.
- **Compresión Binaria de Mallas y Texturas (Avanzada)**: Compresión KTX2/Basis Universal y simplificación de mallas con `gltfpack` son herramientas externas de línea de comandos. VXR las recomienda en `docs/quest.md` sin forzarlas ni simularlas.
- **Empaquetado Android Nativo / APK (Fase Futura)**: Generación de WebAPK mediante Bubblewrap o Android SDK queda claramente demarcada para futuras versiones y documentada como un target extensible (`QuestPWATarget`).
