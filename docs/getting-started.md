# Guía de Inicio Rápido con VXR Core

Aprende a construir tu primera experiencia 3D y WebXR en menos de 5 minutos utilizando `@vxr/core`.

---

## 1. Requisitos Previos
- **Node.js** v18 o superior.
- Navegador moderno con soporte WebGL2 (Chrome, Edge, Firefox, Safari o Meta Quest Browser).
- Para pruebas en realidad virtual: visor **Meta Quest 2, 3 o 3S** o PCVR con soporte WebXR.

---

## 2. Instalación en tu Proyecto

Si utilizas un proyecto Vite + TypeScript:

```bash
npm install three @types/three
npm install @vxr/core
```

---

## 3. Tu Primera Aplicación en 3 Líneas

Crea un archivo `index.html`:
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mi Primera App VXR</title>
  <style>
    body { margin: 0; overflow: hidden; background: #0b0f19; }
    #app { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

En `src/main.ts`:
```typescript
import { XRApp } from '@vxr/core';

async function main() {
  // 1. Instanciar la aplicación
  const app = new XRApp({
    container: '#app',
    enableShadows: true,
    enableGrid: true
  });

  // 2. Cargar tu modelo 3D (GLB o GLTF)
  const model = await app.loadModel('/models/mi-modelo.glb');
  console.log('Dimensiones:', model.metrics.dimensions);

  // 3. Iniciar el bucle de renderizado
  app.start();
}

window.addEventListener('DOMContentLoaded', main);
```

---

## 4. Agregar Interacción

### Selección con Ratón en PC
```typescript
window.addEventListener('pointerdown', (event) => {
  const hits = app.raycastPointer(event);
  if (hits.length > 0) {
    console.log('Objeto seleccionado:', hits[0].object.name);
  }
});
```

### Selección con Mandos en WebXR
```typescript
app.onControllerSelect((controllerIndex) => {
  const hits = app.raycastController(controllerIndex);
  if (hits.length > 0) {
    console.log('Impacto con rayo láser en VR:', hits[0].object.name);
  }
});
```

### Actualización por Fotograma
```typescript
app.onUpdate((delta, elapsed) => {
  // delta = segundos transcurridos desde el frame anterior
  // Rotar el modelo suavemente:
  if (app.model) {
    app.model.group.rotation.y += delta * 0.2;
  }
});
```

---

## 5. Probar en Meta Quest

WebXR exige un **contexto seguro (HTTPS o localhost)**.
Al desarrollar en local con Vite:
1. Agrega `@vitejs/plugin-basic-ssl` a tu configuración de Vite.
2. Inicia con `vite --host`.
3. Abre el navegador **Meta Quest Browser** en el visor.
4. Escribe la dirección IP local de tu ordenador (ej. `https://192.168.1.50:5173`).
5. Pulsa el botón flotante **🥽 ENTER VR**.
