import * as THREE from 'three';
import { ARMatrixSmoother } from '../../utils/smoothing.js';
/**
 * FiduciaryMarkerAdapter tracks high-contrast square fiduciary markers.
 */
export class FiduciaryMarkerAdapter {
    name = 'FiduciaryMarkerTracker';
    mode = 'marker';
    options;
    video = null;
    camera = null;
    events = {};
    smoother;
    isRunning = false;
    anchorMatrix = new THREE.Matrix4();
    isDetected = false;
    constructor(options = {}) {
        this.options = {
            markerId: 0,
            markerWidthMeters: 0.15,
            smoothingFactor: 0.35,
            ...options,
        };
        this.smoother = new ARMatrixSmoother(this.options.smoothingFactor);
    }
    setEventListener(events) {
        this.events = events;
    }
    async init(video, camera) {
        this.video = video;
        this.camera = camera;
    }
    async start() {
        this.isRunning = true;
        if (this.events.onStateChange) {
            this.events.onStateChange('scanning');
        }
    }
    stop() {
        this.isRunning = false;
        this.isDetected = false;
        this.smoother.reset();
    }
    /**
     * Sets artificial or evaluated pose for testing and marker updates.
     */
    setDetectedPose(position, quaternion) {
        this.anchorMatrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
        const smoothed = this.smoother.update(this.anchorMatrix);
        if (!this.isDetected) {
            this.isDetected = true;
            if (this.events.onStateChange)
                this.events.onStateChange('target_detected');
            if (this.events.onTargetFound)
                this.events.onTargetFound(String(this.options.markerId), smoothed);
        }
        else {
            if (this.events.onTargetUpdate)
                this.events.onTargetUpdate(String(this.options.markerId), smoothed);
        }
    }
    setTargetLost() {
        if (this.isDetected) {
            this.isDetected = false;
            this.smoother.reset();
            if (this.events.onStateChange)
                this.events.onStateChange('target_lost');
            if (this.events.onTargetLost)
                this.events.onTargetLost(String(this.options.markerId));
        }
    }
    update(_deltaTime) {
        if (!this.isRunning)
            return;
    }
    /**
     * Generates a printable SVG data string for a fiduciary marker pattern.
     */
    static generateMarkerSVG(markerId = 0, sizePx = 400) {
        const border = sizePx * 0.2;
        const innerSize = sizePx - border * 2;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">
  <!-- Outer White Margin -->
  <rect width="${sizePx}" height="${sizePx}" fill="#ffffff" />
  <!-- Thick Black Fiduciary Border -->
  <rect x="${border * 0.5}" y="${border * 0.5}" width="${sizePx - border}" height="${sizePx - border}" fill="#000000" />
  <!-- Inner White Field -->
  <rect x="${border}" y="${border}" width="${innerSize}" height="${innerSize}" fill="#ffffff" />
  <!-- Identification Geometry for Marker ID ${markerId} -->
  <rect x="${border + innerSize * 0.25}" y="${border + innerSize * 0.25}" width="${innerSize * 0.5}" height="${innerSize * 0.5}" fill="#000000" />
  <circle cx="${sizePx * 0.5}" cy="${sizePx * 0.5}" r="${innerSize * 0.15}" fill="#ffffff" />
  <text x="${sizePx * 0.5}" y="${sizePx - 8}" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle" fill="#333333">VXR AR MARKER #${markerId}</text>
</svg>`;
    }
    dispose() {
        this.stop();
        this.video = null;
        this.camera = null;
        this.events = {};
    }
}
//# sourceMappingURL=FiduciaryMarkerAdapter.js.map