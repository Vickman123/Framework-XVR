# Módulo: XRScene (`@vxr/core`)

Gestiona el grafo de escena, la iluminación predeterminada, los planos de sombras y los presets ambientales.

---

## Firma

```typescript
export class XRScene {
  public readonly nativeScene: THREE.Scene;
  public ambientLight: THREE.AmbientLight | null;
  public directionalLight: THREE.DirectionalLight | null;
  public hemiLight: THREE.HemisphereLight | null;

  constructor(options?: XRSceneOptions);
}
```

---

## Métodos

### `setEnvironmentPreset(preset: 'studio' | 'daylight' | 'dark'): void`
Modifica instantáneamente el fondo y las intensidades lumínicas:
- **`studio`**: Fondo gris pizarra `#0b0f19`, luz difusa neutral e iluminación solar equilibrada.
- **`daylight`**: Fondo cielo suave `#e2e8f0`, luz ambiental potente y sol cálido.
- **`dark`**: Fondo negro azabache `#020617`, luz ambiental reducida y reflector cian.

### `add(...objects: THREE.Object3D[]): this` y `remove(...): this`
Agrega o remueve objetos directamente en `nativeScene`.

### `setBackground(colorOrTexture): void`
Asigna un color hexadecimal, string o textura al fondo de la escena.

### `setGridVisible(visible: boolean): void`
Muestra u oculta la rejilla de referencia métrica del suelo.

### `dispose(): void`
Limpia geometrías y materiales del suelo y la rejilla y vacía la escena.
