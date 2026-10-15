/**
 * VXR AR: Augmented Reality and Vision Tracking Layer for Three.js and VXR Core
 */
// Core Subsystems
export { ARExperience } from './core/ARExperience.js';
export { ARCamera } from './core/ARCamera.js';
export { ARSession } from './core/ARSession.js';
export { ARAssetManager } from './core/ARAssetManager.js';
export { ARInteraction } from './core/ARInteraction.js';
// Tracking Subsystems
export { ARImageTracker } from './tracking/ARImageTracker.js';
export { ARMarkerTracker } from './tracking/ARMarkerTracker.js';
export { ARQRCode } from './tracking/ARQRCode.js';
// Tracking Adapters
export { MindARAdapter } from './tracking/adapters/MindARAdapter.js';
export { FiduciaryMarkerAdapter } from './tracking/adapters/FiduciaryMarkerAdapter.js';
// Utilities
export { ARMatrixSmoother } from './utils/smoothing.js';
export { TargetCompiler } from './utils/targetCompiler.js';
//# sourceMappingURL=index.js.map