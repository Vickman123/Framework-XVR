import type { ARCameraOptions } from '../types.js';
/**
 * ARCamera manages device camera feeds via getUserMedia,
 * handles orientation adjustments, creates/attaches the background video element,
 * and cleanly stops hardware tracks on session termination.
 */
export declare class ARCamera {
    readonly video: HTMLVideoElement;
    private stream;
    private options;
    private isStarted;
    constructor(options?: ARCameraOptions);
    private applyDefaultVideoStyles;
    /**
     * Starts video streaming from the requested camera sensor.
     */
    start(): Promise<HTMLVideoElement>;
    /**
     * Returns current video feed aspect ratio (width / height).
     */
    getAspectRatio(): number;
    /**
     * Stops video stream and releases camera hardware lock.
     */
    stop(): void;
    get active(): boolean;
}
//# sourceMappingURL=ARCamera.d.ts.map