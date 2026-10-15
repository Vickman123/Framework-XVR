import type { ARCameraOptions } from '../types.js';

/**
 * ARCamera manages device camera feeds via getUserMedia,
 * handles orientation adjustments, creates/attaches the background video element,
 * and cleanly stops hardware tracks on session termination.
 */
export class ARCamera {
  public readonly video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private options: ARCameraOptions;
  private isStarted = false;

  constructor(options: ARCameraOptions = {}) {
    this.options = {
      facingMode: 'environment',
      idealWidth: 1280,
      idealHeight: 720,
      ...options,
    };

    if (this.options.videoElement) {
      this.video = this.options.videoElement;
    } else {
      this.video = document.createElement('video');
      this.video.setAttribute('playsinline', 'true');
      this.video.setAttribute('webkit-playsinline', 'true');
      this.video.muted = true;
      this.video.autoplay = true;
      this.applyDefaultVideoStyles();
    }
  }

  private applyDefaultVideoStyles(): void {
    this.video.style.position = 'absolute';
    this.video.style.top = '0';
    this.video.style.left = '0';
    this.video.style.width = '100%';
    this.video.style.height = '100%';
    this.video.style.objectFit = 'cover';
    this.video.style.zIndex = '0';
    this.video.style.pointerEvents = 'none';
  }

  /**
   * Starts video streaming from the requested camera sensor.
   */
  public async start(): Promise<HTMLVideoElement> {
    if (this.isStarted && this.stream) {
      return this.video;
    }

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: this.options.facingMode },
        width: { ideal: this.options.idealWidth },
        height: { ideal: this.options.idealHeight },
      },
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;

      await new Promise<void>((resolve, reject) => {
        this.video.onloadedmetadata = () => {
          this.video.play().then(() => resolve()).catch(reject);
        };
        this.video.onerror = (e) => reject(new Error(`Error cargando video de cámara: ${e}`));
      });

      if (this.options.container && !this.options.videoElement) {
        this.options.container.appendChild(this.video);
      }

      this.isStarted = true;
      return this.video;
    } catch (err: any) {
      this.stop();
      throw new Error(`No se pudo inicializar la cámara: ${err.message || err.name}`);
    }
  }

  /**
   * Returns current video feed aspect ratio (width / height).
   */
  public getAspectRatio(): number {
    if (this.video.videoWidth && this.video.videoHeight) {
      return this.video.videoWidth / this.video.videoHeight;
    }
    return 16 / 9;
  }

  /**
   * Stops video stream and releases camera hardware lock.
   */
  public stop(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }

    if (this.video.srcObject) {
      this.video.srcObject = null;
    }

    if (this.video.parentElement && !this.options.videoElement) {
      this.video.parentElement.removeChild(this.video);
    }

    this.isStarted = false;
  }

  public get active(): boolean {
    return this.isStarted;
  }
}
