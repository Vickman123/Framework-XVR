import * as THREE from 'three';
import type { IARTrackerAdapter, ARMode, ARTrackerEvents } from '../../types.js';
export interface FiduciaryMarkerOptions {
    /** Marker identifier pattern (e.g. 0 to 999 or 'hiro') */
    markerId?: number | string;
    /** Physical marker width in meters (default: 0.15 for 15cm) */
    markerWidthMeters?: number;
    /** Smoothing factor (0.1 to 1.0) */
    smoothingFactor?: number;
}
/**
 * FiduciaryMarkerAdapter tracks high-contrast square fiduciary markers.
 */
export declare class FiduciaryMarkerAdapter implements IARTrackerAdapter {
    readonly name = "FiduciaryMarkerTracker";
    readonly mode: ARMode;
    private options;
    private video;
    private camera;
    private events;
    private smoother;
    private isRunning;
    private anchorMatrix;
    private isDetected;
    constructor(options?: FiduciaryMarkerOptions);
    setEventListener(events: ARTrackerEvents): void;
    init(video: HTMLVideoElement, camera: THREE.Camera): Promise<void>;
    start(): Promise<void>;
    stop(): void;
    /**
     * Sets artificial or evaluated pose for testing and marker updates.
     */
    setDetectedPose(position: THREE.Vector3, quaternion: THREE.Quaternion): void;
    setTargetLost(): void;
    update(_deltaTime: number): void;
    /**
     * Generates a printable SVG data string for a fiduciary marker pattern.
     */
    static generateMarkerSVG(markerId?: number | string, sizePx?: number): string;
    dispose(): void;
}
//# sourceMappingURL=FiduciaryMarkerAdapter.d.ts.map