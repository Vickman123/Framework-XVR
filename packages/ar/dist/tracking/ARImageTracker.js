import * as THREE from 'three';
import { MindARAdapter } from './adapters/MindARAdapter.js';
/**
 * ARImageTracker manages 6-DoF natural feature tracking of printed images,
 * anchoring 3D models rigidly to the physical picture in space.
 */
export class ARImageTracker {
    anchorGroup = new THREE.Group();
    adapter;
    isTracking = false;
    onStateChange;
    onTargetFound;
    onTargetLost;
    onTargetUpdate;
    constructor(options = {}) {
        this.anchorGroup.name = 'VXR_AR_ImageAnchor';
        this.anchorGroup.visible = false;
        this.anchorGroup.matrixAutoUpdate = false; // Directly driven by 6-DoF pose matrix
        this.adapter =
            options.adapter ||
                new MindARAdapter({
                    imageTargetSrc: options.targetSrc,
                    smoothingFactor: options.smoothingFactor ?? 0.35,
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
            onTargetFound: (targetId, transform) => {
                this.anchorGroup.visible = true;
                this.anchorGroup.matrix.copy(transform);
                if (this.onTargetFound)
                    this.onTargetFound(targetId, transform);
            },
            onTargetLost: (targetId) => {
                this.anchorGroup.visible = false;
                if (this.onTargetLost)
                    this.onTargetLost(targetId);
            },
            onTargetUpdate: (targetId, transform) => {
                this.anchorGroup.matrix.copy(transform);
                if (this.onTargetUpdate)
                    this.onTargetUpdate(targetId, transform);
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
    dispose() {
        this.stop();
        this.adapter.dispose();
        this.anchorGroup.clear();
    }
}
//# sourceMappingURL=ARImageTracker.js.map