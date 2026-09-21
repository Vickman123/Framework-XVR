import { XRApp, type LoadedModel, type ModelMetrics } from 'vxr';

export interface XVRViewerConfig {
  container: HTMLElement;
  initialModelUrl?: string;
  enableShadows?: boolean;
  enableGrid?: boolean;
  isNight?: boolean;
  onProgress?: (percent: number) => void;
  onLoaded?: (loaded: LoadedModel) => void;
  onError?: (err: Error) => void;
}

/**
 * XVRViewerBridge integrates the XVR Framework (XRApp, XRScene, XRRenderer, XRSession, XRAssetManager)
 * into the Ciudad Maderas Real Estate application.
 */
export class XVRViewerBridge {
  private app: XRApp | null = null;
  private currentLoadedModel: LoadedModel | null = null;
  private isNightMode: boolean = false;
  private config: XVRViewerConfig;

  constructor(config: XVRViewerConfig) {
    this.config = config;
    this.isNightMode = !!config.isNight;
    this.initApp();
  }

  private initApp(): void {
    try {
      this.app = new XRApp({
        container: this.config.container,
        enableShadows: this.config.enableShadows !== false,
        enableGrid: this.config.enableGrid !== false,
        cameraPosition: [12, 9, 14],
        fov: 45,
        near: 0.1,
        far: 250,
        autoVRButton: false, // We control the UI button in React with real estate styling
        autoOrbitControls: true,
      });

      // Apply initial environment
      this.setNightMode(this.isNightMode);

      // Start XVR animation loop
      this.app.start();

      // Load initial model if specified
      if (this.config.initialModelUrl) {
        this.loadModel(this.config.initialModelUrl);
      }
    } catch (err: any) {
      console.error('[XVRViewerBridge] Error initializing XVR app:', err);
      if (this.config.onError) {
        this.config.onError(err);
      }
    }
  }

  /**
   * Loads a 3D GLB/GLTF model into the XVR scene.
   */
  public async loadModel(url: string | File): Promise<LoadedModel | null> {
    if (!this.app) return null;

    try {
      const loaded = await this.app.loadModel(url, {
        autoGround: true,
        autoCenter: true,
        onProgress: (percent) => {
          if (this.config.onProgress) {
            this.config.onProgress(percent);
          }
        },
      });

      this.currentLoadedModel = loaded;

      // Adjust camera to frame model nicely
      const maxDim = Math.max(
        loaded.metrics.dimensions.width,
        loaded.metrics.dimensions.height,
        loaded.metrics.dimensions.depth,
        2
      );
      const camDist = maxDim * 1.6;
      this.app.resetCamera(
        [camDist * 0.7, camDist * 0.5, camDist * 0.8],
        [0, loaded.metrics.dimensions.height * 0.35, 0]
      );

      if (this.config.onLoaded) {
        this.config.onLoaded(loaded);
      }

      return loaded;
    } catch (err: any) {
      console.error('[XVRViewerBridge] Failed to load model via XVR:', err);
      if (this.config.onError) {
        this.config.onError(err);
      }
      return null;
    }
  }

  /**
   * Toggles day/night lighting presets in XVR scene.
   */
  public setNightMode(isNight: boolean): void {
    this.isNightMode = isNight;
    if (!this.app) return;

    if (isNight) {
      // Night preset: Deep blue ambient, cool moonlight directional
      this.app.scene.setEnvironmentPreset('dark');
      this.app.scene.setBackground(0x060d13);
      if (this.app.scene.directionalLight) {
        this.app.scene.directionalLight.color.setHex(0x60a5fa);
        this.app.scene.directionalLight.intensity = 0.8;
      }
    } else {
      // Day preset: Warm natural sunlight
      this.app.scene.setEnvironmentPreset('daylight');
      this.app.scene.setBackground(0x0a1410);
      if (this.app.scene.directionalLight) {
        this.app.scene.directionalLight.color.setHex(0xfffaed);
        this.app.scene.directionalLight.intensity = 1.3;
      }
    }
  }

  /**
   * Smoothly navigates the camera to a specific room / vantage point.
   */
  public navigateToRoom(cameraPosition: [number, number, number], cameraTarget: [number, number, number]): void {
    if (!this.app) return;
    this.app.resetCamera(cameraPosition, cameraTarget);
  }

  /**
   * Enters WebXR Immersive VR mode using XVR session manager.
   */
  public async enterVR(): Promise<void> {
    if (!this.app) return;
    await this.app.session.enterVR();
  }

  /**
   * Checks whether the current device supports WebXR VR.
   */
  public async checkVRSupport(): Promise<boolean> {
    if (!this.app) return false;
    return await this.app.session.checkVRSupport();
  }

  /**
   * Captures a high-resolution snapshot from the XVR canvas.
   */
  public captureSnapshot(): string | null {
    if (!this.app) return null;
    try {
      this.app.renderer.render(this.app.scene.nativeScene);
      return this.app.renderer.domElement.toDataURL('image/jpeg', 0.95);
    } catch (e) {
      console.error('[XVRViewerBridge] Snapshot capture failed:', e);
      return null;
    }
  }

  /**
   * Resets the view to default perspective.
   */
  public resetView(): void {
    if (!this.app) return;
    if (this.currentLoadedModel) {
      const maxDim = Math.max(
        this.currentLoadedModel.metrics.dimensions.width,
        this.currentLoadedModel.metrics.dimensions.height,
        this.currentLoadedModel.metrics.dimensions.depth,
        2
      );
      const camDist = maxDim * 1.6;
      this.app.resetCamera(
        [camDist * 0.7, camDist * 0.5, camDist * 0.8],
        [0, this.currentLoadedModel.metrics.dimensions.height * 0.35, 0]
      );
    } else {
      this.app.resetCamera([12, 9, 14], [0, 1, 0]);
    }
  }

  /**
   * Disposes the XVR app, WebGL context, and memory.
   */
  public dispose(): void {
    if (this.app) {
      this.app.dispose();
      this.app = null;
    }
    this.currentLoadedModel = null;
  }

  public get metrics(): ModelMetrics | null {
    return this.currentLoadedModel?.metrics || null;
  }

  public get nativeApp(): XRApp | null {
    return this.app;
  }
}
