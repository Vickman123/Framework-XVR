import * as THREE from 'three';
import type { IARTrackerAdapter, ARTrackerEvents, ARTrackingState } from '../types.js';
import { MindARAdapter } from './adapters/MindARAdapter.js';

export interface ARImageTrackerOptions {
  /** Target image source (.mind file) */
  targetSrc?: string;
  /** Custom tracker adapter */
  adapter?: IARTrackerAdapter;
  /** Smoothing interpolation factor */
  smoothingFactor?: number;
}

/**
 * ARImageTracker manages 6-DoF natural feature tracking of printed images,
 * anchoring 3D models rigidly to the physical picture in space.
 */
export class ARImageTracker {
  public readonly anchorGroup = new THREE.Group();
  private adapter: IARTrackerAdapter;
  private isTracking = false;

  public onStateChange?: (state: ARTrackingState, details?: any) => void;
  public onTargetFound?: (targetId: string, transform: THREE.Matrix4) => void;
  public onTargetLost?: (targetId: string) => void;
  public onTargetUpdate?: (targetId: string, transform: THREE.Matrix4) => void;

  constructor(options: ARImageTrackerOptions = {}) {
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

  private setupAdapterEvents(): void {
    const events: ARTrackerEvents = {
      onStateChange: (state, details) => {
        if (state === 'target_detected') {
          this.anchorGroup.visible = true;
        } else if (state === 'target_lost') {
          this.anchorGroup.visible = false;
        }
        if (this.onStateChange) this.onStateChange(state, details);
      },
      onTargetFound: (targetId, transform) => {
        this.anchorGroup.visible = true;
        this.anchorGroup.matrix.copy(transform);
        if (this.onTargetFound) this.onTargetFound(targetId, transform);
      },
      onTargetLost: (targetId) => {
        this.anchorGroup.visible = false;
        if (this.onTargetLost) this.onTargetLost(targetId);
      },
      onTargetUpdate: (targetId, transform) => {
        this.anchorGroup.matrix.copy(transform);
        if (this.onTargetUpdate) this.onTargetUpdate(targetId, transform);
      },
    };

    this.adapter.setEventListener(events);
  }

  public async init(video: HTMLVideoElement, camera: THREE.Camera): Promise<void> {
    await this.adapter.init(video, camera);
  }

  public async start(): Promise<void> {
    await this.adapter.start();
    this.isTracking = true;
  }

  public stop(): void {
    this.adapter.stop();
    this.anchorGroup.visible = false;
    this.isTracking = false;
  }

  public update(deltaTime: number): void {
    if (this.isTracking) {
      this.adapter.update(deltaTime);
    }
  }

  public dispose(): void {
    this.stop();
    this.adapter.dispose();
    this.anchorGroup.clear();
  }
}
