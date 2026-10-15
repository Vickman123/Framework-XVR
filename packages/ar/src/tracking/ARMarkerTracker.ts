import * as THREE from 'three';
import type { IARTrackerAdapter, ARTrackerEvents, ARTrackingState } from '../types.js';
import { FiduciaryMarkerAdapter, type FiduciaryMarkerOptions } from './adapters/FiduciaryMarkerAdapter.js';

export interface ARMarkerTrackerOptions extends FiduciaryMarkerOptions {
  adapter?: IARTrackerAdapter;
}

/**
 * ARMarkerTracker manages fiducial marker recognition and 6-DoF pose tracking.
 */
export class ARMarkerTracker {
  public readonly anchorGroup = new THREE.Group();
  private adapter: IARTrackerAdapter;
  private isTracking = false;

  public onStateChange?: (state: ARTrackingState, details?: any) => void;
  public onTargetFound?: (markerId: string, transform: THREE.Matrix4) => void;
  public onTargetLost?: (markerId: string) => void;
  public onTargetUpdate?: (markerId: string, transform: THREE.Matrix4) => void;

  constructor(options: ARMarkerTrackerOptions = {}) {
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
      onTargetFound: (markerId, transform) => {
        this.anchorGroup.visible = true;
        this.anchorGroup.matrix.copy(transform);
        if (this.onTargetFound) this.onTargetFound(markerId, transform);
      },
      onTargetLost: (markerId) => {
        this.anchorGroup.visible = false;
        if (this.onTargetLost) this.onTargetLost(markerId);
      },
      onTargetUpdate: (markerId, transform) => {
        this.anchorGroup.matrix.copy(transform);
        if (this.onTargetUpdate) this.onTargetUpdate(markerId, transform);
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

  /**
   * Generates a printable SVG string for the marker pattern.
   */
  public generatePrintableMarkerSVG(markerId: number | string = 0, sizePx = 400): string {
    return FiduciaryMarkerAdapter.generateMarkerSVG(markerId, sizePx);
  }

  public dispose(): void {
    this.stop();
    this.adapter.dispose();
    this.anchorGroup.clear();
  }
}
