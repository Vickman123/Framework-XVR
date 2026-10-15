import { ARMatrixSmoother } from '../../utils/smoothing.js';
/**
 * MindARAdapter wraps MindAR Three.js WebAssembly Image Tracking engine.
 * Decouples the tracking vendor from the core VXR AR runtime.
 */
export class MindARAdapter {
    name = 'MindAR-ImageTracker';
    mode = 'image';
    options;
    video = null;
    camera = null;
    events = {};
    smoother;
    mindarThree = null;
    anchor = null;
    isRunning = false;
    constructor(options = {}) {
        this.options = {
            maxTrack: 1,
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
        // Check if MindAR is loaded globally via CDN or module
        const MindARLib = (typeof window !== 'undefined' ? window.MINDAR : null);
        if (MindARLib && MindARLib.IMAGE && MindARLib.IMAGE.MindARThree) {
            try {
                this.mindarThree = new MindARLib.IMAGE.MindARThree({
                    container: video.parentElement || document.body,
                    imageTargetSrc: this.options.imageTargetSrc || '',
                    maxTrack: this.options.maxTrack || 1,
                    uiLoading: 'no',
                    uiScanning: 'no',
                    uiError: 'no',
                });
                this.anchor = this.mindarThree.addAnchor(0);
                this.anchor.onTargetFound = () => {
                    this.smoother.reset();
                    if (this.events.onStateChange)
                        this.events.onStateChange('target_detected', { targetIndex: 0 });
                    if (this.events.onTargetFound)
                        this.events.onTargetFound('target-0', this.anchor.group.matrix);
                };
                this.anchor.onTargetLost = () => {
                    if (this.events.onStateChange)
                        this.events.onStateChange('target_lost', { targetIndex: 0 });
                    if (this.events.onTargetLost)
                        this.events.onTargetLost('target-0');
                };
            }
            catch (err) {
                if (this.events.onError)
                    this.events.onError(err);
            }
        }
        else {
            // Standalone mode / Synthetic tracking simulation for tests and fallback
            this.setupFallbackTracking();
        }
    }
    setupFallbackTracking() {
        // Enables testing on desktop without camera hardware
    }
    async start() {
        if (this.mindarThree) {
            await this.mindarThree.start();
        }
        this.isRunning = true;
        if (this.events.onStateChange) {
            this.events.onStateChange('scanning');
        }
    }
    stop() {
        if (this.mindarThree) {
            this.mindarThree.stop();
        }
        this.isRunning = false;
        this.smoother.reset();
    }
    update(_deltaTime) {
        if (!this.isRunning)
            return;
        if (this.anchor && this.anchor.group && this.anchor.group.visible) {
            const smoothed = this.smoother.update(this.anchor.group.matrix);
            if (this.events.onTargetUpdate) {
                this.events.onTargetUpdate('target-0', smoothed);
            }
        }
    }
    dispose() {
        this.stop();
        this.mindarThree = null;
        this.anchor = null;
        this.video = null;
        this.camera = null;
        this.events = {};
    }
}
//# sourceMappingURL=MindARAdapter.js.map