import * as THREE from 'three';
import type { IARTrackerAdapter, ARMode, ARTrackerEvents } from '../../types.js';
import { ARMatrixSmoother } from '../../utils/smoothing.js';

export interface FiduciaryMarkerOptions {
  /** Marker identifier pattern (e.g. 0 to 999 or 'hiro') */
  markerId?: number | string;
  /** Physical marker width in meters (default: 0.15 for 15cm) */
  markerWidthMeters?: number;
  /** Smoothing factor (0.1 to 1.0) */
  smoothingFactor?: number;
}

/**
 * FiduciaryMarkerAdapter tracks high-contrast square fiduciary markers.
 */
export class FiduciaryMarkerAdapter implements IARTrackerAdapter {
  public readonly name = 'FiduciaryMarkerTracker';
  public readonly mode: ARMode = 'marker';

  private options: FiduciaryMarkerOptions;
  private video: HTMLVideoElement | null = null;
  private camera: THREE.Camera | null = null;
  private events: ARTrackerEvents = {};
  private smoother: ARMatrixSmoother;
  private isRunning = false;

  private anchorMatrix = new THREE.Matrix4();
  private isDetected = false;

  constructor(options: FiduciaryMarkerOptions = {}) {
    this.options = {
      markerId: 0,
      markerWidthMeters: 0.15,
      smoothingFactor: 0.35,
      ...options,
    };
    this.smoother = new ARMatrixSmoother(this.options.smoothingFactor);
  }

  public setEventListener(events: ARTrackerEvents): void {
    this.events = events;
  }

  public async init(video: HTMLVideoElement, camera: THREE.Camera): Promise<void> {
    this.video = video;
    this.camera = camera;
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    if (this.events.onStateChange) {
      this.events.onStateChange('scanning');
    }
  }

  public stop(): void {
    this.isRunning = false;
    this.isDetected = false;
    this.smoother.reset();
  }

  /**
   * Sets artificial or evaluated pose for testing and marker updates.
   */
  public setDetectedPose(position: THREE.Vector3, quaternion: THREE.Quaternion): void {
    this.anchorMatrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1));
    const smoothed = this.smoother.update(this.anchorMatrix);

    if (!this.isDetected) {
      this.isDetected = true;
      if (this.events.onStateChange) this.events.onStateChange('target_detected');
      if (this.events.onTargetFound) this.events.onTargetFound(String(this.options.markerId), smoothed);
    } else {
      if (this.events.onTargetUpdate) this.events.onTargetUpdate(String(this.options.markerId), smoothed);
    }
  }

  public setTargetLost(): void {
    if (this.isDetected) {
      this.isDetected = false;
      this.smoother.reset();
      if (this.events.onStateChange) this.events.onStateChange('target_lost');
      if (this.events.onTargetLost) this.events.onTargetLost(String(this.options.markerId));
    }
  }

  public update(_deltaTime: number): void {
    if (!this.isRunning) return;
  }

  /**
   * Generates a printable SVG data string for a fiduciary marker pattern.
   */
  public static generateMarkerSVG(markerId: number | string = 0, sizePx = 400): string {
    const border = sizePx * 0.2;
    const innerSize = sizePx - border * 2;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${sizePx} ${sizePx}">
  <!-- Outer White Margin -->
  <rect width="${sizePx}" height="${sizePx}" fill="#ffffff" />
  <!-- Thick Black Fiduciary Border -->
  <rect x="${border * 0.5}" y="${border * 0.5}" width="${sizePx - border}" height="${sizePx - border}" fill="#000000" />
  <!-- Inner White Field -->
  <rect x="${border}" y="${border}" width="${innerSize}" height="${innerSize}" fill="#ffffff" />
  <!-- Identification Geometry for Marker ID ${markerId} -->
  <rect x="${border + innerSize * 0.25}" y="${border + innerSize * 0.25}" width="${innerSize * 0.5}" height="${innerSize * 0.5}" fill="#000000" />
  <circle cx="${sizePx * 0.5}" cy="${sizePx * 0.5}" r="${innerSize * 0.15}" fill="#ffffff" />
  <text x="${sizePx * 0.5}" y="${sizePx - 8}" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle" fill="#333333">VXR AR MARKER #${markerId}</text>
</svg>`;
  }

  public dispose(): void {
    this.stop();
    this.video = null;
    this.camera = null;
    this.events = {};
  }
}
