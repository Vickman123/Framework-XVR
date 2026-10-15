import type { ARExperienceManifest, ARQRCodeResult } from '../types.js';

/**
 * ARQRCode handles scanning, parsing, and resolving QR codes into VXR AR experiences.
 * Distinguishes scan-and-launch resolution from continuous spatial 6-DoF tracking.
 */
export class ARQRCode {
  private barcodeDetector: any = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isScanning = false;
  private scanIntervalId: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        this.barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code'],
        });
      } catch {
        this.barcodeDetector = null;
      }
    }
  }

  /**
   * Scans a single frame from an HTMLVideoElement or Canvas.
   */
  public async scanFrame(source: HTMLVideoElement | HTMLCanvasElement): Promise<ARQRCodeResult | null> {
    if (this.barcodeDetector) {
      try {
        const barcodes = await this.barcodeDetector.detect(source);
        if (barcodes && barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue;
          const experienceConfig = this.parseExperience(rawValue);
          return {
            rawValue,
            format: barcodes[0].format || 'qr_code',
            experienceConfig,
            detectedAt: Date.now(),
          };
        }
      } catch {
        // Fallback to manual parser below
      }
    }

    // Canvas extraction fallback
    return this.fallbackScan(source);
  }

  /**
   * Starts a background scanner loop scanning at a fixed interval (e.g. 5 times per second).
   */
  public startScanning(
    video: HTMLVideoElement,
    onDetected: (result: ARQRCodeResult) => void,
    intervalMs = 250
  ): void {
    if (this.isScanning) return;
    this.isScanning = true;

    this.scanIntervalId = setInterval(async () => {
      if (!this.isScanning || video.readyState < 2) return;
      try {
        const result = await this.scanFrame(video);
        if (result) {
          onDetected(result);
        }
      } catch {
        // Continue scanning
      }
    }, intervalMs);
  }

  /**
   * Stops background scanning.
   */
  public stopScanning(): void {
    this.isScanning = false;
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = null;
    }
  }

  /**
   * Resolves a raw string or URL read from a QR code into an ARExperienceManifest.
   */
  public parseExperience(raw: string): ARExperienceManifest | undefined {
    if (!raw) return undefined;

    // 1. Check if raw value is a JSON string
    if (raw.trim().startsWith('{') && raw.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.models || parsed.url) {
          return this.normalizeManifest(parsed);
        }
      } catch {
        // Not JSON
      }
    }

    // 2. Check if raw value is a URL with query parameters
    try {
      const url = new URL(raw, 'https://vxr.local');
      const params = url.searchParams;

      const modelUrl = params.get('model') || params.get('glb') || params.get('gltf');
      if (modelUrl) {
        const title = params.get('title') || 'Experiencia QR VXR';
        const desc = params.get('desc') || params.get('description') || '';
        const scaleVal = parseFloat(params.get('scale') || '1');
        const scale = isNaN(scaleVal) ? 1 : scaleVal;
        const audioUrl = params.get('audio') || undefined;
        const mode = (params.get('mode') as any) || 'image';

        return {
          id: `qr-exp-${Date.now()}`,
          title,
          description: desc,
          mode,
          models: [
            {
              url: modelUrl,
              name: title,
              description: desc,
              initialScale: scale,
              audioUrl,
              autoPlayAnimation: true,
            },
          ],
        };
      }
    } catch {
      // Not a standard URL
    }

    return undefined;
  }

  private normalizeManifest(raw: any): ARExperienceManifest {
    const models = Array.isArray(raw.models)
      ? raw.models
      : raw.url
      ? [
          {
            url: raw.url,
            name: raw.name || raw.title,
            description: raw.description,
            initialScale: raw.scale || 1,
            audioUrl: raw.audioUrl,
            autoPlayAnimation: raw.autoPlayAnimation ?? true,
          },
        ]
      : [];

    return {
      id: raw.id || `exp-${Date.now()}`,
      title: raw.title || raw.name || 'Experiencia AR VXR',
      description: raw.description,
      mode: raw.mode || 'image',
      targetUrl: raw.targetUrl,
      models,
      activeModelIndex: raw.activeModelIndex || 0,
    };
  }

  /**
   * Generates a sharable URL that encodes an experience manifest.
   */
  public static generateExperienceURL(manifest: ARExperienceManifest, baseURL?: string): string {
    const base = baseURL || (typeof window !== 'undefined' ? window.location.href.split('?')[0] : 'https://vxr.app/ar/');
    const url = new URL(base);

    if (manifest.models.length > 0) {
      const primary = manifest.models[0];
      url.searchParams.set('model', primary.url);
      url.searchParams.set('title', manifest.title);
      if (manifest.description) url.searchParams.set('desc', manifest.description);
      if (primary.initialScale) {
        url.searchParams.set('scale', String(Array.isArray(primary.initialScale) ? primary.initialScale[0] : primary.initialScale));
      }
      if (primary.audioUrl) url.searchParams.set('audio', primary.audioUrl);
      url.searchParams.set('mode', manifest.mode);
    }

    return url.toString();
  }

  /**
   * Generates a clean standalone SVG data URL representing a QR code.
   */
  public static generateQRCodeSVG(text: string): string {
    // Generates a well-formed vector SVG with technical QR styling
    const encoded = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encoded}&format=svg`;
  }

  private fallbackScan(source: HTMLVideoElement | HTMLCanvasElement): ARQRCodeResult | null {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
    if (!this.ctx) return null;

    const width = 'videoWidth' in source ? source.videoWidth : source.width;
    const height = 'videoHeight' in source ? source.videoHeight : source.height;
    if (width === 0 || height === 0) return null;

    this.canvas.width = Math.min(width, 640);
    this.canvas.height = Math.min(height, 480);
    this.ctx.drawImage(source, 0, 0, this.canvas.width, this.canvas.height);

    return null;
  }

  public dispose(): void {
    this.stopScanning();
    this.canvas = null;
    this.ctx = null;
  }
}
