# 🌌 VXR Core v0.1.0 — Paquete Listo para Compartir e Integrar

**VXR (Virtual & Extended Reality Framework)** es una capa de abstracción de alto nivel en **TypeScript sobre Three.js y WebXR Device API**, diseñada para acelerar el desarrollo de experiencias 3D interactivas, visualizadores CAD/BIM y simuladores inmersivos para **Meta Quest** y navegadores web.

Esta carpeta `VXR` es un **paquete independiente y autónomo**, listo para ser copiado, compartido o instalado en cualquier nuevo proyecto.

---

## 📦 Contenido de este Paquete

```
VXR/
├── dist/                # Código JavaScript compilado (ESM) y tipos TypeScript (.d.ts)
├── src/                 # Código fuente original en TypeScript
├── examples/            # Ejemplo básico de uso (starter.ts)
├── package.json         # Definición del paquete npm ('vxr')
├── tsconfig.json        # Configuración de compilación
├── README.md            # Esta guía de uso
└── vxr-0.1.0.tgz        # Archivo comprimido instalable con npm
```

---

## 🚀 Cómo Usar VXR en un Nuevo Proyecto

Tienes **3 formas sencillas** de utilizar esta carpeta en tu nuevo proyecto:

### Opción 1: Copiar la carpeta `VXR` a tu nuevo proyecto (Recomendada)

1. Copia la carpeta `VXR` dentro de tu nuevo proyecto (por ejemplo, en la raíz de tu proyecto o dentro de `packages/` o `libs/`).
2. En la terminal de tu nuevo proyecto ejecuta:
   ```bash
   npm install ./VXR
   npm install three @types/three
   ```
3. ¡Listo! Ya puedes importar `vxr` en cualquier archivo `.ts` o `.js`:
   ```typescript
   import { XRApp } from 'vxr';
   ```

---

### Opción 2: Instalar desde el archivo comprimido `.tgz`

1. En la carpeta `VXR` se incluye el archivo pre-empaquetado `vxr-0.1.0.tgz`.
2. Cópialo a tu nuevo proyecto y ejecuta:
   ```bash
   npm install ./vxr-0.1.0.tgz
   npm install three @types/three
   ```

---

### Opción 3: Referencia directa en tu `package.json`

En el `package.json` de tu nuevo proyecto agrega:

```json
{
  "dependencies": {
    "vxr": "file:./VXR",
    "three": "^0.174.0"
  },
  "devDependencies": {
    "@types/three": "^0.174.0"
  }
}
```
Y luego ejecuta:
```bash
npm install
```

---

## ⚡ Código de Inicio Rápido (En 4 líneas)

Crea un archivo `main.ts` en tu nuevo proyecto:

```typescript
import { XRApp } from 'vxr';

// 1. Instanciar la app (configura Renderer WebGL2, Escena, Luces, Cámara y WebXR)
const app = new XRApp({
  container: '#app',       // Elemento DOM donde montar el canvas (o document.body)
  autoVRButton: true,      // Botón flotante 'ENTER VR' para Meta Quest
  enableShadows: true,     // Sombras PCF Soft en tiempo real
  enableGrid: true,        // Rejilla métrica de suelo
  pixelRatioCap: 1.5,      // Límite óptimo para Meta Quest (evita sobrecalentamiento)
});

// 2. Cargar modelo 3D con auto-grounding (lo apoya exactamente en Y = 0)
await app.loadModel('./models/mi-modelo.glb', {
  autoGround: true,
  autoCenter: true,
  onProgress: (p) => console.log(`Cargando: ${p}%`),
});

// 3. Iniciar el bucle de renderizado
app.start();
```

---

## 🎮 Interacción Unificada: Desktop + WebXR

VXR provee raycasting estandarizado que responde al ratón en PC y a los punteros láser en mandos de Meta Quest:

```typescript
// Clic con ratón en Desktop
window.addEventListener('click', (event) => {
  const hits = app.raycastPointer(event);
  if (hits.length > 0) {
    console.log('Objeto clickeado:', hits[0].object.name);
  }
});

// Gatillo en mandos de Meta Quest
app.session.onSelect((event, controllerIndex) => {
  const hits = app.raycastController(controllerIndex);
  if (hits.length > 0) {
    console.log('Objeto impactado por el láser:', hits[0].object.name);
  }
});

// Animación frame a frame
app.onUpdate((delta, elapsed) => {
  // delta = tiempo transcurrido en segundos
});
```

---

## 🛠️ Acceso Directo a Three.js (Fachada Abierta)

VXR **NO oculta Three.js**. Tienes acceso directo a los objetos nativos en cualquier momento:

- `app.threeScene` → Acceso a `THREE.Scene`
- `app.threeRenderer` → Acceso a `THREE.WebGLRenderer`
- `app.camera` → Acceso a `THREE.PerspectiveCamera`
- `app.orbitControls` → Controles orbitales de ratón
- `app.scene` → Módulo `XRScene` de VXR
- `app.assets` → Módulo `XRAssetManager` de VXR
- `app.session` → Módulo `XRSession` de VXR
- `app.scenario` → Módulo `XRScenario` / `XRRoom` (Salas 3D procedimentales)
- `app.audio` → Módulo `XRAudio` (Síntesis de sonido Web Audio, 0 MB)
- `app.addExhibit()` → Módulo `XRExhibit` (Pedestales 3D con pantallas informativas)
- `app.createTutorial()` → Módulo `XRTutorial` (Misiones educativas y checklist HUD)
- `app.enableLocalFileDrop()` → Carga directa de modelos 3D sin servidor

---

## 🏛️ Creación de Museos y Prácticas Interdisciplinarias

```typescript
import { XRApp } from 'vxr';

const app = new XRApp({ enableVR: true });

// 1. Crear Sala de Museo
const sala = app.createRoom({
  name: 'Sala de Ciencias',
  dimensions: { width: 12, depth: 10 },
  theme: 'scifi' // 'gallery' | 'scifi' | 'office' | 'cozy' | 'minimal'
});

// 2. Montar Pedestal Interactivo
app.addExhibit({
  title: 'Espécimen Criogénico A-102',
  category: 'INVESTIGACIÓN BIOLÓGICA',
  specs: ['ESTADO: Preservado', 'TEMP: -196 °C'],
  position: [0, 0, -2]
});

// 3. Crear Guía de Misiones Educativas
const tutorial = app.createTutorial({
  title: 'Práctica de Laboratorio',
  tasks: [
    { id: '1', title: 'Explorar la sala' },
    { id: '2', title: 'Examinar el espécimen' }
  ]
});

// 4. Arrastrar y soltar modelos 3D (.glb) desde la PC
app.enableLocalFileDrop({ maxDimension: 2.0 });

app.start();
```

---

## 🔄 Recompilar VXR (Opcional)

Si en el futuro modificas algún archivo dentro de `VXR/src/`, puedes recompilar el paquete ejecutando dentro de `VXR/`:

```bash
cd VXR
npm run build
```
Esto regenerará automáticamente los archivos en `VXR/dist/`.

---

## 📋 Requisitos
- **Node.js**: v18 o superior
- **Three.js**: `>= 0.170.0`
