# ADR 002: Three.js como Cimiento Gráfico Fundamental

- **Estado**: Aprobado
- **Fecha**: 2026-09-17
- **Decisores**: Equipo VXR

---

## 1. Contexto
Al plantear un framework XR moderno para la web, se evaluaron dos alternativas principales:
1. Construir un motor de renderizado desde cero sobre WebGL2 o WebGPU.
2. Construir una capa de abstracción de alto nivel sobre **Three.js**.

## 2. Decisión
Construir VXR estrictamente sobre **Three.js** como motor de renderizado gráfico de bajo nivel.

## 3. Alternativas Consideradas
- **Babylon.js**: Excelente motor, pero con un runtime significativamente más pesado y un ecosistema web menos extendido en visualización ligera.
- **WebGL2 / WebGPU desde cero**: Desarrollar compiladores de shaders, pipelines de sombras y parsers de materiales PBR requeriría años de desarrollo sin aportar valor diferencial a la interacción XR.

## 4. Consecuencias
- **Positivas**:
  - Acceso inmediato al soporte maduro de materiales PBR, GLTF, DRACO y optimizaciones gráficas de Three.js.
  - Compatibilidad total: cualquier material, geometría o plugin de Three.js puede utilizarse directamente en VXR.
- **Negativas**:
  - Dependencia de los ciclos de lanzamiento y posibles cambios menores en la API interna de Three.js.
