import * as THREE from 'three';
import type { ARExperienceOptions, ARTrackingState, ARModelConfig } from '../types.js';
import { ARCamera } from './ARCamera.js';
import { ARAssetManager, type ARActiveModel } from './ARAssetManager.js';
import { ARInteraction } from './ARInteraction.js';
import { ARImageTracker } from '../tracking/ARImageTracker.js';
import { ARMarkerTracker } from '../tracking/ARMarkerTracker.js';
import { ARQRCode } from '../tracking/ARQRCode.js';
/**
 * ARExperience is the primary entry point and lifecycle orchestrator for VXR AR.
 *
 * It brings together camera video feeds, WebGL/Three.js rendering,
 * spatial tracking (Image, Marker, QR), 3D asset management, and gesture interactions.
 */
export declare class ARExperience {
    readonly scene: THREE.Scene;
    readonly camera: THREE.PerspectiveCamera;
    readonly renderer: THREE.WebGLRenderer;
    readonly arCamera: ARCamera;
    readonly assets: ARAssetManager;
    readonly interaction: ARInteraction;
    imageTracker: ARImageTracker | null;
    markerTracker: ARMarkerTracker | null;
    qrScanner: ARQRCode | null;
    private manifest;
    private container;
    private canvas;
    private isRunning;
    private animFrameId;
    private clock;
    private currentState;
    private activeModel;
    private onStateChangeCb?;
    constructor(options?: ARExperienceOptions);
    private setupLighting;
    private setState;
    /**
     * Initializes camera, verifies permissions, sets up trackers, and appends canvas to DOM.
     */
    init(): Promise<void>;
    /**
     * Loads a model by index from the manifest and attaches it to the active tracking anchor.
     */
    loadModelByIndex(index: number): Promise<ARActiveModel | null>;
    /**
     * Loads and displays a 3D model config.
     */
    loadModel(config: ARModelConfig): Promise<ARActiveModel>;
    /**
     * Starts the continuous rendering and tracking loop.
     */
    start(): void;
    /**
     * Stops rendering and pauses tracking.
     */
    stop(): void;
    private onWindowResize;
    get state(): ARTrackingState;
    get currentModel(): ARActiveModel | null;
    /**
     * Completely destroys experience, stops camera tracks, disposes Three.js objects,
     * GPU textures, audio and event listeners to ensure ZERO memory leaks.
     */
    destroy(): void;
}
//# sourceMappingURL=ARExperience.d.ts.map