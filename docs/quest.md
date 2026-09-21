# Guía de Desarrollo y Despliegue en Meta Quest Browser con VXR

> **Objetivo:** Guía completa de ingeniería para concebir, desarrollar, diagnosticar y compilar experiencias WebXR de alto rendimiento para la familia de visores **Meta Quest 2, Meta Quest 3, Meta Quest 3S y Meta Quest Pro** mediante **VXR Framework**.

---

## 1. ¿Qué es VXR Quest Target?

**VXR Quest Target** (`vxr build --target quest`) es el canal de compilación y optimización de VXR diseñado para generar aplicaciones **WebXR** preparadas específicamente para el navegador nativo **Meta Quest Browser**.

A diferencia de las soluciones que intentan empaquetar aplicaciones en binarios Android nativos pesados (APKs con Unity o Unreal), VXR adopta el estándar de la **Web Abierta**:
- **Zero Install / Instant Access:** Los usuarios ingresan una URL o escanean un código QR y entran en realidad virtual inmediatamente.
- **Filosofía Open Facade:** Acceso irrestricto al motor gráfico Three.js (`THREE.Scene`, `THREE.WebGLRenderer`, `THREE.PerspectiveCamera`).
- **Arquitectura de Código Universal:** El mismo archivo TypeScript corre en Desktop (mouse/teclado con OrbitControls) y en Meta Quest (mandos 6DoF Touch y rayos láser) sin alterar la lógica de negocio.

---

## 2. Cómo Crear una Experiencia

Crear una experiencia compatible con Meta Quest requiere únicamente instanciar `XRApp`:

```typescript
import { XRApp } from 'vxr';

// 1. Instanciar la aplicación con runtime automático y perfilado Quest
const app = new XRApp({
  container: '#app',
  cameraPosition: [0, 1.6, 3],
  runtime: 'auto',              // 'auto' detecta Desktop vs WebXR automáticamente
  targetFrameRate: 90,          // Solicita 90 FPS en Meta Quest Browser
  questOptimization: true,      // Ajusta pixel ratio y mitigaciones térmicas
  enableShadows: true,
  autoVRButton: true,           // Inyecta el botón '🥽 ENTER VR'
});

// 2. Cargar modelo 3D con alineación al suelo
const model = await app.loadModel('/models/sculpture.glb', {
  autoGround: true,
  autoCenter: true,
});

// 3. Registrar interacción unificada (Desktop + Quest Controllers)
app.onControllerSelect((controllerIndex) => {
  const hits = app.raycastController(controllerIndex, [model.group]);
  if (hits.length > 0) {
    console.log('Objeto seleccionado con mando Quest!');
  }
});

// 4. Iniciar bucle de renderizado
app.start();
```

---

## 3. Cómo Ejecutar Localmente

Durante el desarrollo en tu ordenador:

```bash
# Iniciar servidor de desarrollo con Vite
npm run dev
```

El servidor Vite levantará la experiencia en `http://localhost:5173/`.
En tu ordenador, interactuarás en modo Desktop utilizando el ratón y los controles de órbita integrados de VXR.

---

## 4. Cómo Generar una Build

VXR CLI incluye comandos dedicados para compilar tu experiencia:

```bash
# 1. Compilación estándar para web plana
npx vxr build --target web

# 2. Compilación optimizada para Meta Quest Browser
npx vxr build --target quest

# 3. Compilación para Meta Quest con auditoría y presets de rendimiento activos
npx vxr build --target quest --optimize
```

### ¿Qué genera el target `quest` en `dist/`?
- **`index.html`**: Con meta tags `mobile-web-app-capable`, `theme-color` y enlace a manifiesto.
- **`manifest.webmanifest`**: Manifiesto PWA configurado con `"display": "fullscreen"`, `"orientation": "landscape"` y metadatos WebXR.
- **`QUEST_DEPLOY.md`**: Guía paso a paso para abrir la experiencia desde el visor.
- **`vxr-quest-report.json`**: Informe detallado del presupuesto de memoria y assets.
- **`vxr-quest-preset.json`**: (Si se usa `--optimize`) Parámetros recomendados de renderizado.

---

## 5. Cómo Desplegarla Mediante HTTPS

> [!IMPORTANT]
> **HTTPS es un requisito obligatorio del consorcio W3C para WebXR.**  
> Meta Quest Browser bloquea el acceso a sensores de orientación y visualización inmersiva si la página no se sirve bajo **HTTPS** (la única excepción es `http://localhost`).

### Métodos de Despliegue Recomendados:

1. **GitHub Pages (Producción / Gratis):**
   - Configura GitHub Pages en tu repositorio apuntando a la rama `main` o `gh-pages`.
   - Incluye el archivo `.nojekyll` para que los assets y bundles se sirvan directamente.
   - Tu URL `https://<usuario>.github.io/<repo>/` cuenta con certificado SSL automático de confianza.

2. **Vercel / Netlify (Despliegue Rápido):**
   ```bash
   npx vercel --prod
   ```
   Genera una URL HTTPS inmediata reconocida por Quest Browser.

3. **Prueba Inalámbrica Local con Túnel Seguro (Sin subir a internet):**
   Si deseas probar cambios en tu visor físico sin esperar al despliegue remoto:
   ```bash
   # En una terminal levantas Vite:
   npm run dev

   # En otra terminal levantas un túnel HTTPS con ngrok o Cloudflare:
   npx ngrok http 5173
   ```
   Abre la URL segura `https://xxxx.ngrok-free.app` directamente en Meta Quest Browser.

---

## 6. Cómo Abrirla desde Meta Quest Browser

1. Ponte el visor **Meta Quest 2, 3, 3S o Pro**.
2. Presiona el botón Oculus/Meta en el mando derecho para abrir el menú universal.
3. Abre la aplicación **Navegador** (*Meta Quest Browser*).
4. Escribe la dirección HTTPS de tu experiencia en la barra de búsqueda o agrégala a marcadores.
5. Cuando cargue la escena 3D, verás el botón flotante en la parte inferior: **"🥽 ENTER VR"**.
6. Apunta con el mando y pulsa el gatillo (*Trigger*).
7. La pantalla pasará de una ventana plana 2D a una inmersión completa 360° en 3D con mandos y rayos láser activos.

---

## 7. Limitaciones Técnicas de WebXR frente a Aplicaciones Nativas

Es importante comprender el perfil de hardware de los visores autónomos:

| Aspecto | WebXR en Meta Quest Browser | Aplicación Android Nativa (APK) |
|---|---|---|
| **Distribución** | Instantánea vía URL / Código QR (0 MB de instalación) | Descarga en App Store / SideQuest (cientos de MB a GB) |
| **API Gráfica** | WebGL2 (subconjunto de OpenGL ES 3.0) / WebGPU (en evolución) | Vulkan nativo / OpenGL ES 3.2 |
| **Draw Calls Recomendadas** | 80 – 150 llamadas por ojo | 200 – 400 llamadas por ojo |
| **Tasa de Refresco** | 72 Hz / 90 Hz / 120 Hz (negociable dinámicamente) | 72 Hz / 90 Hz / 120 Hz fija |
| **Texturas** | PNG, JPEG, WebP, KTX2 Basis Universal | ASTC comprimido nativo en memoria de texturas |
| **Acceso a Hardware** | Limitado por sandboxing del navegador (cámaras de passthrough sin acceso a píxeles crudos) | Acceso directo a NDK y APIs de bajo nivel de Meta |

---

## 8. Guía de Optimización para Meta Quest

Para mantener una experiencia fluida a 90 FPS sin provocar cinetosis ni sobrecalentamiento (*thermal throttling*):

1. **Presupuesto Poligonal:**
   - Mantén la escena total entre **300,000 y 700,000 triángulos**.
   - Usa `app.assets.loadModel()` para inspeccionar las métricas (`model.metrics.triangleCount`).
2. **Texturas y Resolución:**
   - La resolución máxima de textura recomendada para Quest es **2048 × 2048 px**. Evita texturas 4K o 8K sin comprimir.
   - Utiliza formatos optimizados como **WebP** o **KTX2**.
3. **Iluminación y Sombras:**
   - Las sombras dinámicas en tiempo real son la operación más costosa para el procesador gráfico Adreno del Quest.
   - Limita a **1 sola luz direccional** con `castShadow = true`.
   - Limita el mapa de sombra: `directionalLight.shadow.mapSize.set(1024, 1024)`.
4. **Pixel Ratio:**
   - Meta Quest 2 y 3 tienen pantallas de alta densidad física. Configurar `pixelRatio > 1.5` en WebXR provocará caídas severas de fotogramas.
   - VXR aplica automáticamente un `pixelRatioCap` conservador de **1.0 a 1.25** durante las sesiones WebXR.

---

## 9. VXR Doctor (`vxr doctor`)

Herramienta de diagnóstico proactivo integrada en el CLI:

```bash
npx vxr doctor
```

Analiza automáticamente:
- Compatibilidad del entorno Node.js y TypeScript.
- Dependencias fundamentales (`three`, `@vxr/core`).
- Presencia de `index.html` y punto de entrada.
- Detección de configuración WebXR (`immersive-vr`, controladores).
- Auditoría de assets (modelos mayores a 25MB, texturas mayores a 4MB).
- Requisitos de seguridad HTTPS.

Distingue rigurosamente entre:
- **✓ Comprobaciones locales estáticas**
- **💡 Recomendaciones de ingeniería de rendimiento**
- **ℹ Capacidades de hardware verificables únicamente en runtime** (90Hz/120Hz, Hand Tracking, etc.).

---

## 10. Diferencia entre WebXR y Aplicación Nativa

- **WebXR:** No requiere aprobación en la Meta Store, no requiere cuenta de desarrollador para distribución, se actualiza en el servidor en tiempo real sin requerir parches descargables del usuario y respeta la privacidad del usuario al no permitir rastreo indebido del entorno físico.
- **Nativa:** Justificada únicamente para juegos con gráficos AAA extremos que requieran shaders personalizados en Vulkan o motores de física masivos en C++. Para visualizadores arquitectónicos, catálogos 3D, simuladores de entrenamiento técnico y experiencias educativas, **WebXR con VXR es la solución óptima y más ágil**.

---

## 11. Futuro Target: Quest PWA (`vxr build --target quest-pwa`)

VXR incluye en su arquitectura la interfaz extensible `QuestPWATarget`.

En futuras versiones de VXR, este target permitirá:
1. Envolver el bundle WebXR en un paquete **WebAPK** firmado para Meta Quest.
2. Permitir que la experiencia figure como un icono instalable en la biblioteca de aplicaciones del visor (*Meta Horizon OS Library*).
3. Publicación directa en la **Meta Horizon Store** (App Lab / Horizon Store) como una aplicación PWA 2D con capacidad WebXR inmersiva.

Actualmente, ejecutar `vxr build --target quest` genera la PWA web 100% estándar requerida para este propósito.
