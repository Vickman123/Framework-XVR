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
export { XRRoom } from './scenario/XRRoom.js';
export { XRScenario } from './scenario/XRScenario.js';

export type {
  XRAppOptions,
  LoadedModel,
  LoadModelOptions,
  ModelMetrics,
  UpdatableCallback,
} from './types.js';

export type {
  RoomTheme,
  WallDirection,
  DoorConfig,
  XRRoomDimensions,
  RoomFloorOptions,
  RoomWallsOptions,
  RoomCeilingOptions,
  RoomLightingOptions,
  XRRoomOptions,
  WalkableAABB,
  DoorAperture,
  CorridorOptions,
  ScenarioRoomJSON,
  ScenarioConnectionJSON,
  ScenarioJSON,
} from './scenario/types.js';

