/**
 * VXR Core: High-level WebXR and 3D simulation layer for Three.js
 */

export { XRApp } from './XRApp.js';
export { XRScene } from './XRScene.js';
export type { XRSceneOptions, EnvironmentPreset } from './XRScene.js';
export { XRRenderer } from './XRRenderer.js';
export { XRSession } from './XRSession.js';
export type { SessionStateCallback, ControllerSelectCallback } from './XRSession.js';
export { XRAssetManager } from './XRAssetManager.js';

export type {
  XRAppOptions,
  LoadedModel,
  LoadModelOptions,
  ModelMetrics,
  UpdatableCallback,
} from './types.js';
