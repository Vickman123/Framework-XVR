# ADR 007: Fronteras de Primitivas de Interacción y Qué Permanece Fuera del Core

- **Estado**: Aprobado
- **Fecha**: 2026-09-17
- **Decisores**: Equipo VXR

---

## 1. Contexto
Durante el desarrollo del `Architecture Viewer` y el `XR Interaction Lab`, surgieron necesidades de selección, cambio de colores de highlight, paneles laterales y telemetría de eventos. Existía la tentación de agregar gestores visuales de UI, física compleja o estilos de resaltado dentro de `@vxr/core`.

## 2. Decisión
Establecer una frontera estricta:
1. **Permanece en el Core**:
   - `raycastPointer(event, objects)`: Matemáticas para transformar clics del DOM en intersecciones 3D.
   - `raycastController(index, objects)`: Matemáticas para proyectar rayos desde la orientación física del mando.
   - `onControllerSelect(callback)`: Normalización de eventos de gatillo en WebXR.
2. **Queda fuera del Core**:
   - *Estilos de Highlight*: Cambiar materiales, colores emisivos o siluetas pertenece a la lógica de la aplicación o a un paquete satélite (`@vxr/ui`).
   - *Paneles DOM*: Toda la UI HTML/CSS permanece en la capa de aplicación.
   - *Física rígida pesada*: No se integrará Rapier, PhysX ni Cannon en el Core.

## 3. Consecuencias
- **Positivas**:
  - `@vxr/core` se mantiene ultraligero (< 15KB gzipped), rápido de compilar y libre de dependencias innecesarias.
  - Los desarrolladores tienen libertad total para diseñar sus propios estilos visuales y esquemas de selección.
- **Negativas**:
  - Los ejemplos deben escribir unas pocas líneas de código para memorizar y restaurar el material previo al aplicar highlight.
