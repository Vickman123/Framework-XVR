import * as THREE from 'three';
import type { IARTrackerAdapter, ARTrackingState } from '../types.js';
export interface ARImageTrackerOptions {
    /** Target image source (.mind file) */
    targetSrc?: string;
    /** Custom tracker adapter */
    adapter?: IARTrackerAdapter;
    /** Smoothing interpolation factor */
    smoothingFactor?: number;
}
/**
 * ARImageTracker manages 6-DoF natural feature tracking of printed images,
 * anchoring 3D models rigidly to the physical picture in space.
 */
export declare class ARImageTracker {
    readonly anchorGroup: THREE.Group<THREE.Object3DEventMap>;
    private adapter;
    private isTracking;
    onStateChange?: (state: ARTrackingState, details?: any) => void;
    onTargetFound?: (targetId: string, transform: THREE.Matrix4) => void;
    onTargetLost?: (targetId: string) => void;
    onTargetUpdate?: (targetId: string, transform: THREE.Matrix4) => void;
    constructor(options?: ARImageTrackerOptions);
    private setupAdapterEvents;
    init(video: HTMLVideoElement, camera: THREE.Camera): Promise<void>;
    start(): Promise<void>;
    stop(): void;
    update(deltaTime: number): void;
    dispose(): void;
}
//# sourceMappingURL=ARImageTracker.d.ts.map