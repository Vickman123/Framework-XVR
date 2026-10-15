import * as THREE from 'three';
import type { ARModelConfig } from '../types.js';
export interface ARActiveModel {
    config: ARModelConfig;
    root: THREE.Group;
    mixer: THREE.AnimationMixer | null;
    animations: THREE.AnimationClip[];
    audio: HTMLAudioElement | null;
    dispose: () => void;
}
/**
 * ARAssetManager handles 3D model loading (GLB/glTF), animation playback,
 * audio playback, and rigorous GPU memory disposal.
 */
export declare class ARAssetManager {
    private gltfLoader;
    private dracoLoader;
    private activeModels;
    constructor(dracoPath?: string);
    /**
     * Loads a GLB/GLTF model defined in an ARModelConfig.
     */
    loadModel(config: ARModelConfig): Promise<ARActiveModel>;
    /**
     * Updates all active animation mixers.
     */
    update(deltaTime: number): void;
    /**
     * Frees all GPU resources, materials, textures, and stops audio.
     */
    disposeModel(model: ARActiveModel): void;
    private disposeMaterial;
    /**
     * Disposes all loaded models and loaders.
     */
    dispose(): void;
}
//# sourceMappingURL=ARAssetManager.d.ts.map