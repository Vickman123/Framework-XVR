/**
 * VXR AR: Augmented Reality and Vision Tracking Layer for Three.js and VXR Core
 */

// Core Subsystems
export { ARExperience } from './core/ARExperience.js';
export { ARCamera } from './core/ARCamera.js';
export { ARSession } from './core/ARSession.js';
export { ARAssetManager, type ARActiveModel } from './core/ARAssetManager.js';
export { ARInteraction } from './core/ARInteraction.js';

// Tracking Subsystems
export { ARImageTracker, type ARImageTrackerOptions } from './tracking/ARImageTracker.js';
export { ARMarkerTracker, type ARMarkerTrackerOptions } from './tracking/ARMarkerTracker.js';
export { ARQRCode } from './tracking/ARQRCode.js';

// Tracking Adapters
export { MindARAdapter, type MindARAdapterOptions } from './tracking/adapters/MindARAdapter.js';
export { FiduciaryMarkerAdapter, type FiduciaryMarkerOptions } from './tracking/adapters/FiduciaryMarkerAdapter.js';

// Utilities
export { ARMatrixSmoother } from './utils/smoothing.js';
export { TargetCompiler, type TargetImageQuality } from './utils/targetCompiler.js';

// Public Types & Interfaces
export type {
  ARMode,
  ARTrackingState,
  ARCameraOptions,
  ARSessionCapabilities,
  ARInfoCardAction,
  ARInfoCard,
  ARModelConfig,
  ARExperienceManifest,
  ARTrackerEvents,
  IARTrackerAdapter,
  ARQRCodeResult,
  ARInteractionOptions,
  ARExperienceOptions,
} from './types.js';
