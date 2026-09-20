# ADR 004: Patrón Fachada Mediante `XRApp`

- **Estado**: Aprobado
- **Fecha**: 2026-09-17
- **Decisores**: Equipo VXR

---

## 1. Contexto
En Three.js convencional, iniciar una aplicación requiere que el usuario conozca, instancie y vincule manualmente objetos de diversas librerías (`Scene`, `WebGLRenderer`, `PerspectiveCamera`, `OrbitControls`, `GLTFLoader`, `VRButton`). Esto eleva la barrera de entrada y produce código duplicado no estandarizado.

## 2. Decisión
Introducir la clase **`XRApp`** como el punto de entrada orquestador (Fachada), manteniendo composición interna sobre `XRScene`, `XRRenderer`, `XRSession` y `XRAssetManager`.

## 3. Alternativas Consideradas
- **Arquitectura basada en funciones modulares sueltas**: `createScene()`, `createRenderer()`. Aunque modular, obliga al usuario a pasar manualmente referencias entre funciones.
- **Herencia monolítica**: Que `XRApp` herede de `THREE.Scene` o `THREE.WebGLRenderer`. Rechazada categóricamente porque viola el principio de responsabilidad única (*Single Responsibility Principle*).

## 4. Consecuencias
- **Positivas**:
  - Permite instanciar y ejecutar una experiencia funcional en solo 3 líneas de código:
    ```typescript
    const app = new XRApp();
    await app.loadModel('model.glb');
    app.start();
    ```
  - Expone los objetos nativos mediante getters (`nativeScene`, `nativeRenderer`, `camera`).
- **Negativas**:
  - Si no se cuida el diseño, la fachada puede tender a acumular demasiadas responsabilidades (*God Object*). Debe delegar estrictamente en sus subsistemas.
