# ADR 005: Pipeline de Carga Inteligente, Auto-Grounding y Disposal

- **Estado**: Aprobado
- **Fecha**: 2026-09-17
- **Decisores**: Equipo VXR

---

## 1. Contexto
En visualización 3D y simuladores, los modelos importados rara vez tienen un pivote alineado con la base real del objeto físico, provocando que aparezcan flotando o enterrados. Además, la falta de una rutina estricta de `dispose()` satura rápidamente la memoria VRAM en visores autónomos como Meta Quest.

## 2. Decisión
Incorporar en **`XRAssetManager`**:
1. Soporte automático de compresión **DRACO**.
2. **Auto-Grounding**: Cálculo de la caja envolvente (`THREE.Box3`) y ajuste automático de posición para apoyar la base a $Y = 0$.
3. **Auto-Centering**: Centrado horizontal a $X = 0, Z = 0$.
4. **Cálculo de métricas**: Dimensiones ($X \times Y \times Z$ en metros), conteo de triángulos, vértices y mallas.
5. **Disposal profundo**: Liberación de geometrías, materiales y texturas al descargar o reemplazar un modelo.

## 3. Consecuencias
- **Positivas**:
  - Todo modelo cargado se posiciona de forma coherente en el mundo sin necesidad de ajustes manuales.
  - Protección robusta contra fugas de memoria (*memory leaks*) en Meta Quest.
- **Negativas**:
  - Para casos especiales donde un objeto debe conservar su posición original según coordenadas GIS/CAD globales, el desarrollador debe poder desactivar el ajuste pasando `{ autoGround: false, autoCenter: false }`.
