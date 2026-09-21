# 🏛️ Guía: Sistema de Creación de Escenarios y Salas 3D (`XRRoom` & `XRScenario`)

> **VXR Framework v0.2.0**  
> *Una solución ultra-accesible para crear espacios arquitectónicos 3D, salas interconectadas y mapas transitables sin modelado previo ni físicas complejas.*

---

## 🎯 1. ¿Qué es el Sistema de Escenarios de VXR?

Tradicionalmente en Three.js o WebGL, construir una sala interactiva transitable requería:
- Calcular manualmente las mallas de cada pared, suelo y techo.
- Hacer operaciones booleanas o partir la geometría a mano para dejar el hueco de una puerta.
- Configurar shaders, texturas y fuentes de iluminación individualmente.
- Integrar un motor de físicas pesado (Cannon.js, Rapier o Ammo.js) solo para evitar que la cámara atraviese las paredes.

Con **VXR**, puedes crear salas habitables completas con **una sola llamada**, conectar salas mediante pasillos automáticos, o incluso cargar un mapa completo desde un archivo de texto **`escenario.json`** sin tocar una sola línea de código Three.js.

---

## 🚀 2. Tu Primera Sala en 3 Líneas de Código

```typescript
import { XRApp } from 'vxr';

const app = new XRApp({ enableVR: true });

// 1. Crear una sala con tema predeterminado
const sala = app.createRoom({
  name: 'Lobby Principal',
  dimensions: { width: 12, depth: 10, height: 3.5 },
  theme: 'gallery',
});

// 2. Iniciar la aplicación
app.start();
```

¡Eso es todo! VXR genera automáticamente:
- **Piso** sólido con recepción de sombras.
- **4 Paredes** con grosor realista y zoclos estéticos.
- **Techo** con lámpara plafón central.
- **Luz puntual** cenital calibrada con atenuación cuadrática.
- **Límites transitables AABB** calculados para colisión.

---

## 🎨 3. Presets Temáticos Integrados

No necesitas configurar materiales, rugosidades ni colores a mano. VXR incluye 5 temas preconfigurados:

| Preset | Nombre | Paredes | Suelo | Lámpara / Acento |
| :--- | :--- | :--- | :--- | :--- |
| `'gallery'` | **Galería de Arte** | Blanco museo mate | Madera clara / roble | Luz cálida cenital |
| `'scifi'` | **Laboratorio Futurista** | Grafito oscuro metálico | Piso con rejilla neón | Luz azul cian emisiva |
| `'office'` | **Oficina Corporativa** | Gris claro acústico | Alfombra azul oscuro | Luz blanca difusa |
| `'cozy'` | **Lounge Acogedor** | Lino marfil cálido | Tablones de nogal | Luz ámbar suave |
| `'minimal'` | **Minimalismo Tech** | Gris grafito profundo | Cemento pulido oscuro | Luz blanca de contraste |

### Uso del tema:
```typescript
const lab = app.createRoom({
  name: 'Laboratorio de Pruebas',
  theme: 'scifi', // 'gallery' | 'scifi' | 'office' | 'cozy' | 'minimal'
});
```

---

## 🚪 4. Puertas Inteligentes sin Matemáticas

Si quieres colocar una puerta en cualquier pared, solo indica el punto cardinal (`'north'`, `'south'`, `'east'`, o `'west'`). VXR dividirá la pared de forma matemática en **sección izquierda**, **sección derecha**, **dintel superior** y **jambas de marco**, abriendo el paso exactamente en las coordenadas elegidas:

```typescript
const sala = app.createRoom({
  dimensions: { width: 12, depth: 10, height: 3.5 },
  doors: [
    {
      wall: 'north',      // 'north' | 'south' | 'east' | 'west'
      width: 2.4,         // Ancho del vano en metros (default: 2.2m)
      height: 2.8,        // Altura de paso (default: 2.6m)
      offset: 0,          // Desplazamiento desde el centro de la pared (opcional)
      targetRoomId: 'lab' // Sala a la que conecta (opcional)
    },
    {
      wall: 'east',
      width: 2.0,
      height: 2.6,
    }
  ]
});
```

---

## 🌉 5. Conectar Salas con Pasillos Automáticos

Para vincular dos salas separadas en el espacio, usa `app.connectRooms(...)`. VXR construirá un pasillo techado, con suelo, paredes laterales y lámparas, conectando ambos vanos de puerta:

```typescript
// 1. Crear el escenario
const scenario = app.createScenario('Campus Virtual');

// 2. Sala 01 (Centro [0, 0, 0])
const lobby = scenario.addRoom({
  id: 'lobby',
  center: [0, 0, 0],
  dimensions: { width: 10, depth: 10 },
  doors: [{ wall: 'north', targetRoomId: 'lab' }],
});

// 3. Sala 02 (Separada hacia el Norte en Z = -16m)
const lab = scenario.addRoom({
  id: 'lab',
  center: [0, 0, -16],
  dimensions: { width: 12, depth: 12 },
  theme: 'scifi',
  doors: [{ wall: 'south', targetRoomId: 'lobby' }],
});

// 4. Generar el pasillo intermedio
scenario.connectRooms('lobby', 'north', 'lab', 'south', {
  width: 2.4, // Ancho de paso
  height: 3.0 // Altura
});
```

---

## 🛡️ 6. Colisiones de Pared Automáticas (*Wall-Slide*)

No necesitas instalar Cannon.js ni configurar máscaras de colisión. VXR calcula el volumen transitable de cada sala y pasillo. 

En tu bucle de movimiento (teclado, ratón o joystick táctil móvil), simplemente pasa la posición propuesta a `app.constrainToScenario(...)`:

```typescript
app.onUpdate((delta) => {
  // Posición deseada tras aplicar velocidad
  const proposed = playerPos.clone().add(velocity.multiplyScalar(delta));

  // VXR comprueba si choca con alguna pared y desliza suavemente al avatar
  const safePosition = app.constrainToScenario(playerPos, proposed, 0.35);

  playerPos.copy(safePosition);
  app.camera.position.copy(playerPos);
});
```

> **¿Cómo funciona el deslizamiento?**  
> Si intentas caminar en diagonal hacia una pared, VXR verifica si el movimiento en el eje X es seguro, luego en el eje Z. Esto permite deslizarse de forma natural sobre las superficies sin quedarse trabado ni atravesar el muro.

---

## 📄 7. Creación de Mapas Sin Código (`escenario.json`)

Cualquier persona sin conocimientos de programación puede diseñar un mapa escribiendo un archivo JSON sencillo:

### `mi-mapa.json`:
```json
{
  "name": "Museo Virtual Interactivo",
  "rooms": [
    {
      "id": "recepcion",
      "name": "Recepción y Bienvenida",
      "dimensions": { "width": 12, "depth": 10, "height": 3.8 },
      "center": [0, 0, 0],
      "theme": "gallery",
      "doors": [
        { "wall": "north", "targetRoomId": "exposicion" }
      ]
    },
    {
      "id": "exposicion",
      "name": "Sala de Innovación",
      "dimensions": { "width": 16, "depth": 14, "height": 4.5 },
      "center": [0, 0, -18],
      "theme": "scifi",
      "doors": [
        { "wall": "south", "targetRoomId": "recepcion" }
      ]
    }
  ],
  "connections": [
    {
      "fromRoom": "recepcion",
      "fromWall": "north",
      "toRoom": "exposicion",
      "toWall": "south"
    }
  ],
  "defaultSpawnRoom": "recepcion"
}
```

### Cargarlo en VXR con 1 sola línea:
```typescript
await app.loadScenario('./mi-mapa.json');
```

---

## 📖 8. Referencia de la API

### Métodos en `XRApp`
- `app.createRoom(options: XRRoomOptions): XRRoom` — Crea y monta una sala en la escena.
- `app.createScenario(name?: string): XRScenario` — Crea un contenedor multizona de salas.
- `app.connectRooms(roomA, wallA, roomB, wallB, options?): void` — Conecta dos salas con un pasillo.
- `app.loadScenario(configOrUrl): Promise<XRScenario>` — Carga un escenario desde un objeto o URL JSON.
- `app.teleportToRoom(roomId: string): void` — Teletransporta la cámara al punto de spawn de la sala.
- `app.constrainToScenario(currentPos, proposedPos, radius?): THREE.Vector3` — Resuelve colisiones contra paredes.

### Métodos en `XRRoom`
- `room.addDecoration(object3D, relativePosition?): void` — Agrega un modelo 3D o mueble en coordenadas locales de la sala.
- `room.getSpawnPosition(): THREE.Vector3` — Obtiene las coordenadas mundiales del punto de aparición.
- `room.containsPoint(x, z, margin?): boolean` — Comprueba si un punto 2D está dentro de la sala o en sus vanos de puerta.
- `room.dispose(): void` — Libera geometrías, materiales y luces de la memoria WebGL.
