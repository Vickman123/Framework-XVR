import * as THREE from 'three';

// =============================================================================
// VXR AR Core Types & Contracts
// =============================================================================

export type ARMode = 'qr' | 'image' | 'marker' | 'webxr';

export type ARTrackingState =
  | 'uninitialized'
  | 'requesting_camera'
  | 'scanning'
  | 'target_detected'
  | 'target_lost'
  | 'error';

export interface ARCameraOptions {
  /** Optional container element where the video preview is rendered */
  container?: HTMLElement;
  /** Custom HTMLVideoElement to reuse */
  videoElement?: HTMLVideoElement;
  /** Preferred camera facing mode ('environment' for rear, 'user' for selfie) */
  facingMode?: 'environment' | 'user';
  /** Desired video capture width (default: 1280) */
  idealWidth?: number;
  /** Desired video capture height (default: 720) */
  idealHeight?: number;
}

export interface ARSessionCapabilities {
  /** Indicates whether the application is running in a secure HTTPS context */
  isSecureContext: boolean;
  /** Indicates whether navigator.mediaDevices and getUserMedia are supported */
  hasCameraSupport: boolean;
  /** Indicates whether WebXR is supported by the browser */
  hasWebXRSupport: boolean;
  /** Indicates whether WebXR 'immersive-ar' session is supported */
  hasWebXRARSupport: boolean;
  /** Indicates whether the native BarcodeDetector API is available */
  hasBarcodeDetector: boolean;
  /** Human-readable technical diagnostics and recommendations */
  recommendations: string[];
}

export interface ARInfoCardAction {
  label: string;
  actionId: string;
  onClick?: () => void;
}

export interface ARInfoCard {
  title: string;
  subtitle?: string;
  content: string;
  badge?: string;
  actions?: ARInfoCardAction[];
}

export interface ARModelConfig {
  /** URL or relative path to .glb or .gltf 3D asset */
  url: string;
  /** Display title for the model */
  name?: string;
  /** Detailed description or history */
  description?: string;
  /** Initial scale multiplier or 3D vector [x, y, z] */
  initialScale?: number | [number, number, number];
  /** Initial relative position [x, y, z] in meters */
  initialPosition?: [number, number, number];
  /** Initial relative rotation in Euler degrees [x, y, z] */
  initialRotationDeg?: [number, number, number];
  /** Whether to automatically play the first animation clip found */
  autoPlayAnimation?: boolean;
  /** Specific animation index to play */
  animationIndex?: number;
  /** Optional audio file URL associated with this model */
  audioUrl?: string;
  /** Informational card popup */
  infoCard?: ARInfoCard;
}

export interface ARExperienceManifest {
  /** Unique identifier */
  id: string;
  /** Human-readable title */
  title: string;
  /** Detailed description */
  description?: string;
  /** Operating AR mode */
  mode: ARMode;
  /** Target image or marker file URL (.mind, .png, etc.) */
  targetUrl?: string;
  /** Expected visual aspect ratio of the target image (width / height) */
  targetAspectRatio?: number;
  /** Physical target width in meters (e.g. 0.2 for 20cm paper print) */
  physicalTargetWidthMeters?: number;
  /** Array of 3D models included in this experience */
  models: ARModelConfig[];
  /** Index of the active model initially loaded */
  activeModelIndex?: number;
}

export interface ARTrackerEvents {
  onStateChange?: (state: ARTrackingState, details?: any) => void;
  onTargetFound?: (targetId: string, transform: THREE.Matrix4) => void;
  onTargetLost?: (targetId: string) => void;
  onTargetUpdate?: (targetId: string, transform: THREE.Matrix4) => void;
  onError?: (error: Error) => void;
}

/**
 * Common pluggable interface for tracking engines (MindAR, Fiduciary, WebXR).
 */
export interface IARTrackerAdapter {
  readonly name: string;
  readonly mode: ARMode;
  init(video: HTMLVideoElement, camera: THREE.Camera): Promise<void>;
  start(): Promise<void>;
  stop(): void;
  update(deltaTime: number): void;
  setEventListener(events: ARTrackerEvents): void;
  dispose(): void;
}

export interface ARQRCodeResult {
  rawValue: string;
  format: string;
  experienceConfig?: ARExperienceManifest;
  detectedAt: number;
}

export interface ARInteractionOptions {
  enableRotate?: boolean;
  enablePinchScale?: boolean;
  minScale?: number;
  maxScale?: number;
  rotateSpeed?: number;
  pinchSpeed?: number;
}

export interface ARExperienceOptions {
  /** Target container element where canvas and video reside */
  container?: HTMLElement;
  /** Experience manifest or configuration */
  manifest?: ARExperienceManifest;
  /** Custom tracker adapter to override defaults */
  trackerAdapter?: IARTrackerAdapter;
  /** Camera configuration */
  cameraOptions?: ARCameraOptions;
  /** Interaction configuration */
  interactionOptions?: ARInteractionOptions;
  /** Callback for tracking state transitions */
  onStateChange?: (state: ARTrackingState, details?: any) => void;
}
