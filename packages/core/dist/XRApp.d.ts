import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRScene } from './XRScene.js';
import { XRRenderer } from './XRRenderer.js';
import { XRSession, ControllerSelectCallback } from './XRSession.js';
import { XRAssetManager } from './XRAssetManager.js';
import type { LoadedModel, LoadModelOptions, UpdatableCallback, XRAppOptions } from './types.js';
/**
 * XRApp is the high-level entry point for VXR applications.
 *
 * It orchestrates scene setup, WebGL rendering, WebXR session negotiation,
 * desktop navigation controls, 3D asset loading, and unified pointer/controller raycasting.
 *
 * @example
 * ```typescript
 * const app = new XRApp();
 * await app.loadModel("./model.glb");
 * app.start();
 * ```
 */
export declare class XRApp {
    /** The encapsulated scene manager */
    readonly scene: XRScene;
    /** The encapsulated WebGL and WebXR renderer */
    readonly renderer: XRRenderer;
    /** The WebXR session and VR button manager */
    readonly session: XRSession;
    /** The 3D model asset loader and memory manager */
    readonly assets: XRAssetManager;
    /** Desktop orbit controls active when not in WebXR */
    readonly controls: OrbitControls | null;
    /** Initial camera position for reset */
    private initialCameraPosition;
    /** Initial look-at target for reset */
    private initialCameraTarget;
    /** Active model currently loaded via loadModel, if any */
    private currentModel;
    constructor(options?: XRAppOptions);
    /**
     * Convenience getter for the primary PerspectiveCamera.
     */
    get camera(): THREE.PerspectiveCamera;
    /**
     * Convenience getter for the underlying THREE.Scene.
     */
    get nativeScene(): THREE.Scene;
    /**
     * Convenience getter for the underlying THREE.WebGLRenderer.
     */
    get nativeRenderer(): THREE.WebGLRenderer;
    /**
     * Currently loaded 3D model, if any.
     */
    get model(): LoadedModel | null;
    /**
     * WebXR controller spaces (0: primary, 1: secondary).
     */
    get controllers(): THREE.XRTargetRaySpace[];
    /**
     * Resets camera and orbit target to default coordinates or specific target.
     */
    resetCamera(targetPosition?: [number, number, number], targetLookAt?: [number, number, number]): void;
    /**
     * Casts a ray from screen coordinates (mouse or touch) and returns intersecting 3D objects.
     *
     * @param event MouseEvent or PointerEvent from DOM.
     * @param objects List of 3D objects to test (defaults to scene children).
     * @param recursive Test children recursively (default: true).
     */
    raycastPointer(event: MouseEvent | PointerEvent | {
        clientX: number;
        clientY: number;
    }, objects?: THREE.Object3D[], recursive?: boolean): THREE.Intersection[];
    /**
     * Casts a ray along the pointing orientation of a WebXR controller.
     *
     * @param controllerIndex 0 (primary/right) or 1 (secondary/left).
     * @param objects List of 3D objects to test (defaults to scene children).
     * @param recursive Test children recursively (default: true).
     */
    raycastController(controllerIndex: number, objects?: THREE.Object3D[], recursive?: boolean): THREE.Intersection[];
    /**
     * Subscribes to controller trigger click events in WebXR.
     * @returns Unsubscribe function.
     */
    onControllerSelect(callback: ControllerSelectCallback): () => void;
    /**
     * Asynchronously loads a glTF/GLB model, aligns it at ground level (Y = 0),
     * adds it to the scene, and adjusts camera framing.
     *
     * @param source URL string or File object.
     * @param options Configuration for grounding, centering, and progress.
     */
    loadModel(source: string | File, options?: LoadModelOptions): Promise<LoadedModel>;
    /**
     * Registers a callback executed on every frame before rendering.
     * @returns Unsubscribe function to remove the callback.
     */
    onUpdate(callback: UpdatableCallback): () => void;
    /**
     * Starts the animation loop and rendering.
     */
    start(): this;
    /**
     * Pauses the animation loop.
     */
    stop(): this;
    /**
     * Disposes the application, closing sessions, clearing models, and releasing WebGL resources.
     */
    dispose(): void;
}
//# sourceMappingURL=XRApp.d.ts.map