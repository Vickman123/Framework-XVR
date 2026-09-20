# Módulo: XRAssetManager (`@vxr/core`)

Pipeline de importación de modelos glTF/GLB con descompresión DRACO, auto-grounding, métricas y gestión de memoria GPU.

---

## Firma

```typescript
export class XRAssetManager {
  constructor(defaultDracoPath?: string);

  public loadModel(source: string | File, options?: LoadModelOptions): Promise<LoadedModel>;
  public computeMetrics(object: THREE.Object3D): ModelMetrics;
  public disposeObject(root: THREE.Object3D): void;
  public dispose(): void;
}
```

---

## Métricas del Modelo (`ModelMetrics`)
El objeto `LoadedModel.metrics` expone:
```typescript
interface ModelMetrics {
  dimensions: {
    width: number;   // Ancho X en metros
    height: number;  // Altura Y en metros
    depth: number;   // Profundidad Z en metros
  };
  center: [number, number, number]; // Centro volumétrico
  vertexCount: number;              // Total de vértices
  triangleCount: number;            // Total de polígonos
  meshCount: number;                // Cantidad de mallas
}
```

---

## Auto-Grounding y Centrado
Por defecto:
- `autoGround: true`: Desplaza el modelo en el eje vertical $Y$ de forma que `box.min.y = 0`. El modelo se apoya automáticamente en el suelo sin importar el pivote con el que fue exportado.
- `autoCenter: true`: Centra el modelo en el origen $X = 0, Z = 0$.

## Limpieza de Memoria (`disposeObject`)
Recorre recursivamente la jerarquía y ejecuta `.dispose()` sobre geometrías, materiales y texturas GPU (`map`, `normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`, `emissiveMap`), protegiendo los visores autónomos contra cierres por falta de memoria VRAM.
