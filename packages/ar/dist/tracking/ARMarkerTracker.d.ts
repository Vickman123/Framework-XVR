import * as THREE from 'three';
import type { IARTrackerAdapter, ARTrackingState } from '../types.js';
import { type FiduciaryMarkerOptions } from './adapters/FiduciaryMarkerAdapter.js';
export interface ARMarkerTrackerOptions extends FiduciaryMarkerOptions {
    adapter?: IARTrackerAdapter;
}
/**
 * ARMarkerTracker manages fiducial marker recognition and 6-DoF pose tracking.
 */
export declare class ARMarkerTracker {
    readonly anchorGroup: THREE.Group<THREE.Object3DEventMap>;
    private adapter;
    private isTracking;
    onStateChange?: (state: ARTrackingState, details?: any) => void;
    onTargetFound?: (markerId: string, transform: THREE.Matrix4) => void;
    onTargetLost?: (markerId: string) => void;
    onTargetUpdate?: (markerId: string, transform: THREE.Matrix4) => void;
    constructor(options?: ARMarkerTrackerOptions);
    private setupAdapterEvents;
    init(video: HTMLVideoElement, camera: THREE.Camera): Promise<void>;
    start(): Promise<void>;
    stop(): void;
    update(deltaTime: number): void;
    /**
     * Generates a printable SVG string for the marker pattern.
     */
    generatePrintableMarkerSVG(markerId?: number | string, sizePx?: number): string;
    dispose(): void;
}
//# sourceMappingURL=ARMarkerTracker.d.ts.map