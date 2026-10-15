import * as THREE from 'three';
import { FiduciaryMarkerAdapter } from './adapters/FiduciaryMarkerAdapter.js';
/**
 * ARMarkerTracker manages fiducial marker recognition and 6-DoF pose tracking.
 */
export class ARMarkerTracker {
    anchorGroup = new THREE.Group();
    adapter;
    isTracking = false;
    onStateChange;
    onTargetFound;
    onTargetLost;
    onTargetUpdate;
    constructor(options = {}) {
        this.anchorGroup.name = 'VXR_AR_MarkerAnchor';
        this.anchorGroup.visible = false;
        this.anchorGroup.matrixAutoUpdate = false;
        this.adapter =
            options.adapter ||
                new FiduciaryMarkerAdapter({
                    markerId: options.markerId || 0,
                    markerWidthMeters: options.markerWidthMeters || 0.15,
                    smoothingFactor: options.smoothingFactor || 0.35,
                });
        this.setupAdapterEvents();
    }
    setupAdapterEvents() {
        const events = {
            onStateChange: (state, details) => {
                if (state === 'target_detected') {
                    this.anchorGroup.visible = true;
                }
                else if (state === 'target_lost') {
                    this.anchorGroup.visible = false;
                }
                if (this.onStateChange)
                    this.onStateChange(state, details);
            },
            onTargetFound: (markerId, transform) => {
                this.anchorGroup.visible = true;
                this.anchorGroup.matrix.copy(transform);
                if (this.onTargetFound)
                    this.onTargetFound(markerId, transform);
            },
            onTargetLost: (markerId) => {
                this.anchorGroup.visible = false;
                if (this.onTargetLost)
                    this.onTargetLost(markerId);
            },
            onTargetUpdate: (markerId, transform) => {
                this.anchorGroup.matrix.copy(transform);
                if (this.onTargetUpdate)
                    this.onTargetUpdate(markerId, transform);
            },
        };
        this.adapter.setEventListener(events);
    }
    async init(video, camera) {
        await this.adapter.init(video, camera);
    }
    async start() {
        await this.adapter.start();
        this.isTracking = true;
    }
    stop() {
        this.adapter.stop();
        this.anchorGroup.visible = false;
        this.isTracking = false;
    }
    update(deltaTime) {
        if (this.isTracking) {
            this.adapter.update(deltaTime);
        }
    }
    /**
     * Generates a printable SVG string for the marker pattern.
     */
    generatePrintableMarkerSVG(markerId = 0, sizePx = 400) {
        return FiduciaryMarkerAdapter.generateMarkerSVG(markerId, sizePx);
    }
    dispose() {
        this.stop();
        this.adapter.dispose();
        this.anchorGroup.clear();
    }
}
//# sourceMappingURL=ARMarkerTracker.js.map