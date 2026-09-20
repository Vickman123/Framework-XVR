# ADR 003: Adopción Estricta de TypeScript

- **Estado**: Aprobado
- **Fecha**: 2026-09-17
- **Decisores**: Equipo VXR

---

## 1. Contexto
Las aplicaciones 3D y WebXR implican estructuras matemáticas complejas (vectores, matrices, cuaterniones, jerarquías de mallas y estados de sesión asíncronos). Los errores de tipado o acceso a propiedades nulas en tiempo de ejecución suelen manifestarse como cierres inesperados de la sesión inmersiva o caídas catastróficas de fotogramas.

## 2. Decisión
Desarrollar todo el código de VXR Core y sus ejemplos en **TypeScript con `strict: true`**, emitiendo definiciones `.d.ts` y mapas de origen (*source maps*).

## 3. Alternativas Consideradas
- **JavaScript puro con JSDoc**: Menos fricción inicial de compilación, pero nula seguridad en tiempo de desarrollo y refactorizaciones frágiles en APIs espaciales complejas.

## 4. Consecuencias
- **Positivas**:
  - Autocompletado inteligente en el IDE para todas las opciones de `XRAppOptions` y `LoadModelOptions`.
  - Detección estricta de `null` y `undefined` (por ejemplo, al verificar si la sesión XR o el modelo 3D están activos).
- **Negativas**:
  - Requiere un paso de compilación (`tsc`) antes de publicar y empaquetar.
