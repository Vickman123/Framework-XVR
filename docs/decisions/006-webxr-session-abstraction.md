# ADR 006: Abstracción de Sesión WebXR y Rayos de Mandos

- **Estado**: Aprobado
- **Fecha**: 2026-09-17
- **Decisores**: Equipo VXR

---

## 1. Contexto
Conectar la WebXR Device API con Three.js exige negociar espacios de referencia (`local-floor`), gestionar el ciclo de vida del botón en el DOM, sincronizar estados de sesión y configurar controladores con rayos visibles para interactuar en el espacio tridimensional.

## 2. Decisión
Crear **`XRSession`** como un módulo especializado que:
1. Comprueba compatibilidad mediante `navigator.xr.isSessionSupported('immersive-vr')`.
2. Proporciona un botón reactivo estilizado (`createVRButton()`) que reacciona a los estados de soporte.
3. Preconfigura los mandos 0 y 1 con líneas visuales de rayo láser (`VXR_LaserRay`).
4. Ofrece el método de proyección `raycastController(index, objects)`.
5. Emite eventos limpios (`onStateChange`, `onSelect`).

## 3. Consecuencias
- **Positivas**:
  - Elimina la necesidad de importar y configurar manualmente `VRButton.js` de Three.js.
  - El raycasting espacial en VR funciona con la misma ergonomía que en PC de escritorio.
- **Negativas**:
  - En v0.1.0 la longitud del rayo es estática (3m); en v0.2.0 debe acortarse dinámicamente al colisionar con superficies cercanas.
