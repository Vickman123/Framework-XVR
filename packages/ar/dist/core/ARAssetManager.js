import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
/**
 * ARAssetManager handles 3D model loading (GLB/glTF), animation playback,
 * audio playback, and rigorous GPU memory disposal.
 */
export class ARAssetManager {
    gltfLoader;
    dracoLoader = null;
    activeModels = new Map();
    constructor(dracoPath) {
        this.gltfLoader = new GLTFLoader();
        const dPath = dracoPath || 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';
        try {
            this.dracoLoader = new DRACOLoader();
            this.dracoLoader.setDecoderPath(dPath);
            this.gltfLoader.setDRACOLoader(this.dracoLoader);
        }
        catch {
            // Graceful fallback if DRACOLoader fails to initialize in node/test env
            this.dracoLoader = null;
        }
    }
    /**
     * Loads a GLB/GLTF model defined in an ARModelConfig.
     */
    async loadModel(config) {
        const gltf = await new Promise((resolve, reject) => {
            this.gltfLoader.load(config.url, (data) => resolve(data), undefined, (err) => reject(new Error(`Error cargando modelo "${config.url}": ${err?.message || err}`)));
        });
        const rawScene = gltf.scene || gltf.scenes[0];
        // Traverse and configure materials/shadows
        rawScene.traverse((child) => {
            if (child.isMesh) {
                const mesh = child;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });
        // Compute bounding box and center
        const box = new THREE.Box3().setFromObject(rawScene);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);
        // Center geometry on X and Z, ground on Y = 0
        rawScene.position.set(-center.x, -box.min.y, -center.z);
        const root = new THREE.Group();
        root.name = `ARModel_${config.name || 'Untitled'}`;
        root.add(rawScene);
        // Apply initial scale
        if (config.initialScale) {
            if (Array.isArray(config.initialScale)) {
                root.scale.set(config.initialScale[0], config.initialScale[1], config.initialScale[2]);
            }
            else {
                root.scale.setScalar(config.initialScale);
            }
        }
        // Apply initial position
        if (config.initialPosition) {
            root.position.set(config.initialPosition[0], config.initialPosition[1], config.initialPosition[2]);
        }
        // Apply initial rotation
        if (config.initialRotationDeg) {
            root.rotation.set(THREE.MathUtils.degToRad(config.initialRotationDeg[0]), THREE.MathUtils.degToRad(config.initialRotationDeg[1]), THREE.MathUtils.degToRad(config.initialRotationDeg[2]));
        }
        // Setup Animation Mixer
        let mixer = null;
        const animations = gltf.animations || [];
        if (animations.length > 0) {
            mixer = new THREE.AnimationMixer(rawScene);
            if (config.autoPlayAnimation !== false) {
                const idx = config.animationIndex ?? 0;
                const clip = animations[idx] || animations[0];
                mixer.clipAction(clip).play();
            }
        }
        // Setup Optional Audio
        let audio = null;
        if (config.audioUrl && typeof Audio !== 'undefined') {
            try {
                audio = new Audio(config.audioUrl);
                audio.loop = true;
            }
            catch {
                audio = null;
            }
        }
        const activeModel = {
            config,
            root,
            mixer,
            animations,
            audio,
            dispose: () => this.disposeModel(activeModel),
        };
        this.activeModels.set(config.url, activeModel);
        return activeModel;
    }
    /**
     * Updates all active animation mixers.
     */
    update(deltaTime) {
        for (const [, model] of this.activeModels) {
            if (model.mixer) {
                model.mixer.update(deltaTime);
            }
        }
    }
    /**
     * Frees all GPU resources, materials, textures, and stops audio.
     */
    disposeModel(model) {
        if (model.audio) {
            model.audio.pause();
            model.audio.src = '';
            model.audio = null;
        }
        if (model.mixer) {
            model.mixer.stopAllAction();
            model.mixer = null;
        }
        model.root.traverse((child) => {
            if (child.isMesh) {
                const mesh = child;
                if (mesh.geometry) {
                    mesh.geometry.dispose();
                }
                if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                        for (const mat of mesh.material) {
                            this.disposeMaterial(mat);
                        }
                    }
                    else {
                        this.disposeMaterial(mesh.material);
                    }
                }
            }
        });
        if (model.root.parent) {
            model.root.parent.remove(model.root);
        }
        this.activeModels.delete(model.config.url);
    }
    disposeMaterial(mat) {
        for (const key of Object.keys(mat)) {
            const val = mat[key];
            if (val && typeof val === 'object' && 'isTexture' in val && typeof val.dispose === 'function') {
                val.dispose();
            }
        }
        mat.dispose();
    }
    /**
     * Disposes all loaded models and loaders.
     */
    dispose() {
        for (const [, model] of this.activeModels) {
            model.dispose();
        }
        this.activeModels.clear();
        if (this.dracoLoader) {
            this.dracoLoader.dispose();
            this.dracoLoader = null;
        }
    }
}
//# sourceMappingURL=ARAssetManager.js.map