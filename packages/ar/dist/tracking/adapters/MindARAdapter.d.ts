import * as THREE from 'three';
import type { IARTrackerAdapter, ARMode, ARTrackerEvents } from '../../types.js';
export interface MindARAdapterOptions {
    /** URL or path to the compiled .mind binary target */
    imageTargetSrc?: string;
    /** Maximum number of targets to track simultaneously */
    maxTrack?: number;
    /** Filter factor for temporal matrix smoothing (0.1 to 1.0) */
    smoothingFactor?: number;
    /** Whether to enable debug overlay */
    uiDebug?: boolean;
}
/**
 * MindARAdapter wraps MindAR Three.js WebAssembly Image Tracking engine.
 * Decouples the tracking vendor from the core VXR AR runtime.
 */
export declare class MindARAdapter implements IARTrackerAdapter {
    readonly name = "MindAR-ImageTracker";
    readonly mode: ARMode;
    private options;
    private video;
    private camera;
    private events;
    private smoother;
    private mindarThree;
    private anchor;
    private isRunning;
    constructor(options?: MindARAdapterOptions);
    setEventListener(events: ARTrackerEvents): void;
    init(video: HTMLVideoElement, camera: THREE.Camera): Promise<void>;
    private setupFallbackTracking;
    start(): Promise<void>;
    stop(): void;
    update(_deltaTime: number): void;
    dispose(): void;
}
//# sourceMappingURL=MindARAdapter.d.ts.map