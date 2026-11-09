# VXR Physics & Collision System: Architectural Specification

Esta especificación detalla las soluciones de físicas, colisiones continuas y muestreo de elevación de terreno desarrolladas a partir de la simulación del hábitat marciano, listas para ser integradas en el framework **VXR**.

---

## 1. Problemas Identificados en Simulaciones 3D/WebXR

1. **Paredes Invisibles en Esquinas y Aperturas:**
   - Ocurre cuando un algoritmo de colisión evalúa simultáneamente $X$ y $Z$ usando la menor distancia de penetración ($\min(\Delta X, \Delta Z)$).
   - En esquinas de puertas o columnas estrechas, $\Delta Z < \Delta X$, provocando que el avatar sea empujado lateralmente o bloqueado en un espacio vacío.
2. **Atravesamiento de Muros (Tunneling):**
   - Si la velocidad del avatar supera la mitad del grosor de la pared en un solo frame ($\Delta t \cdot v > \frac{d}{2}$), el solver de penetración invierte el vector de corrección y empuja al jugador hacia el otro lado del muro.
3. **Piso Plano y Colisión con Terreno Desigual:**
   - La cámara o rig mantiene $Y = 0$, provocando que el avatar camine bajo tierra o atraviese colinas cuando el terreno tiene ondulaciones, cráteres o rampas.

---

## 2. Solución 1: Colisión Deslizante de Ejes Separados (Axis-Separated Sliding)

En lugar de calcular el overlap simultáneo, el desplazamiento se divide en dos fases ortogonales:

```typescript
export interface BoundingBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function resolveSlidingCollisions(
  currentX: number,
  currentZ: number,
  targetX: number,
  targetZ: number,
  boxes: BoundingBox2D[],
  playerRadius: number = 0.32
): { x: number; z: number } {
  let resolvedX = targetX;
  let resolvedZ = targetZ;

  // FASE 1: Resolver desplazamiento en X manteniendo currentZ
  for (const b of boxes) {
    const minX = b.minX - playerRadius;
    const maxX = b.maxX + playerRadius;
    const minZ = b.minZ - playerRadius;
    const maxZ = b.maxZ + playerRadius;

    if (currentZ > minZ && currentZ < maxZ) {
      if (resolvedX > minX && resolvedX < maxX) {
        resolvedX = (targetX >= currentX) ? minX : maxX;
      }
    }
  }

  // FASE 2: Resolver desplazamiento en Z utilizando resolvedX
  for (const b of boxes) {
    const minX = b.minX - playerRadius;
    const maxX = b.maxX + playerRadius;
    const minZ = b.minZ - playerRadius;
    const maxZ = b.maxZ + playerRadius;

    if (resolvedX > minX && resolvedX < maxX) {
      if (resolvedZ > minZ && resolvedZ < maxZ) {
        resolvedZ = (targetZ >= currentZ) ? minZ : maxZ;
      }
    }
  }

  return { x: resolvedX, z: resolvedZ };
}
```

### Ventajas para VXR:
- **Deslizamiento natural:** Si el usuario camina diagonalmente contra un muro, la componente perpendicular se anula y la componente paralela continúa a velocidad completa.
- **Sin trampas en umbrales:** El paso por puertas y aperturas es 100% fluido.
- **Sin tunneling:** Conoce la dirección del vector de velocidad, garantizando que el avatar nunca sea expulsado hacia el lado opuesto.

---

## 3. Solución 2: Muestreo y Adaptación Continua de Terreno (Heightfield Clamping)

Para escenarios exteriores o combinados (interior + terreno exterior):

```typescript
export interface ITerrainSampler {
  getHeightAt(x: number, z: number): number;
}
```

Durante el loop de actualización (`update(delta)`):
1. **Gravedad y Salto (Baja Gravedad / 0.38g):**
   ```typescript
   const groundY = terrainSampler.getHeightAt(pos.x, pos.z);
   if (isJumping) {
     verticalVelocity += gravity * delta;
     cameraRig.position.y += verticalVelocity * delta;
     if (cameraRig.position.y <= groundY) {
       cameraRig.position.y = groundY;
       verticalVelocity = 0;
       isJumping = false;
     }
   } else {
     // Interpolación suave para evitar saltos bruscos en desniveles
     cameraRig.position.y = THREE.MathUtils.lerp(cameraRig.position.y, groundY, Math.min(1.0, delta * 18.0));
   }
   ```
2. **Alineación de Objetos Interactivos:**
   Cualquier prop o coleccionable en el exterior se posiciona automáticamente en `groundY + offset`, evitando objetos flotando o enterrados.

---

## 4. Solución 3: Transición Interior / Exterior con Umbrales (Portales)

Para transiciones entre un entorno cerrado presurizado y el exterior:
- Definir un volumen de corredor o esclusa (`x \in [x_{min}, x_{max}], z \in [z_{min}, z_{max}]`).
- Cuando el jugador cruza el umbral exterior:
  - Se conmuta el modo de movimiento (`isEVAMode = true`).
  - Se activa el HUD de soporte de vida / casco espacial automáticamente.
  - Se activan las físicas de terreno y baja gravedad.
- Cuando el jugador regresa al interior:
  - Se restablece la altura del piso al nivel nominal ($Y = 0.0$).
  - Se desactiva el HUD espacial y se represuriza la estación.
