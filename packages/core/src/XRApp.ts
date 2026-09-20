import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRScene } from './XRScene.js';
import { XRRenderer } from './XRRenderer.js';
import { XRSession, ControllerSelectCallback } from './XRSession.js';
import { XRAssetManager } from './XRAssetManager.js';
import type {
  LoadedModel,
  LoadModelOptions,
  UpdatableCallback,
  XRAppOptions,
} from './types.js';

/**
 * XRApp is the high-level entry point for VXR applications.
 *
 * It orchestrates scene setup, WebGL rendering, WebXR session negotiation,
 * desktop navigation controls, 3D asset loading, and unified pointer/controller raycasting.
 *
 * @example
 * ```typescript
 * const app = new XRApp();
 * await app.loadModel("./model.glb");
 * app.start();
 * ```
 */
export class XRApp {
  /** The encapsulated scene manager */
  public readonly scene: XRScene;

  /** The encapsulated WebGL and WebXR renderer */
  public readonly renderer: XRRenderer;

  /** The WebXR session and VR button manager */
  public readonly session: XRSession;

  /** The 3D model asset loader and memory manager */
  public readonly assets: XRAssetManager;

  /** Desktop orbit controls active when not in WebXR */
  public readonly controls: OrbitControls | null = null;

  /** Initial camera position for reset */
  private initialCameraPosition: [number, number, number];

  /** Initial look-at target for reset */
  private initialCameraTarget: [number, number, number] = [0, 0.8, 0];

  /** Active model currently loaded via loadModel, if any */
  private currentModel: LoadedModel | null = null;

  constructor(options: XRAppOptions = {}) {
    // 1. Initialize core subsystems
    this.scene = new XRScene({
      enableShadows: options.enableShadows,
      enableGrid: options.enableGrid,
    });

    this.renderer = new XRRenderer(options);

    this.session = new XRSession(this.renderer.nativeRenderer);

    this.assets = new XRAssetManager();

    // 2. Attach WebXR controllers to scene so laser rays render automatically
    this.scene.nativeScene.add(this.session.controllerGroup);

    // 3. Store initial camera transforms
    this.initialCameraPosition = options.cameraPosition ?? [0, 1.6, 3.5];

    // 4. Setup desktop OrbitControls if enabled
    if (options.autoOrbitControls !== false) {
      this.controls = new OrbitControls(
        this.renderer.camera,
        this.renderer.domElement
      );
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.minDistance = 0.5;
      this.controls.maxDistance = 100;
      this.controls.target.set(
        this.initialCameraTarget[0],
        this.initialCameraTarget[1],
        this.initialCameraTarget[2]
      );
    }

    // 5. Mount floating VR Button if enabled
    if (options.autoVRButton !== false) {
      this.session.createVRButton(this.renderer.container);
    }

    // 6. Disable orbit controls during active VR sessions to avoid conflicts
    this.session.onStateChange((isVR) => {
      if (this.controls) {
        this.controls.enabled = !isVR;
      }
    });
  }

  /**
   * Convenience getter for the primary PerspectiveCamera.
   */
  public get camera(): THREE.PerspectiveCamera {
    return this.renderer.camera;
  }

  /**
   * Convenience getter for the underlying THREE.Scene.
   */
  public get nativeScene(): THREE.Scene {
    return this.scene.nativeScene;
  }

  /**
   * Convenience getter for the underlying THREE.WebGLRenderer.
   */
  public get nativeRenderer(): THREE.WebGLRenderer {
    return this.renderer.nativeRenderer;
  }

  /**
   * Currently loaded 3D model, if any.
   */
  public get model(): LoadedModel | null {
    return this.currentModel;
  }

  /**
   * WebXR controller spaces (0: primary, 1: secondary).
   */
  public get controllers(): THREE.XRTargetRaySpace[] {
    return this.session.controllers;
  }

  /**
   * Resets camera and orbit target to default coordinates or specific target.
   */
  public resetCamera(
    targetPosition?: [number, number, number],
    targetLookAt?: [number, number, number]
  ): void {
    const pos = targetPosition ?? this.initialCameraPosition;
    const look = targetLookAt ?? this.initialCameraTarget;

    this.renderer.camera.position.set(pos[0], pos[1], pos[2]);
    if (this.controls) {
      this.controls.target.set(look[0], look[1], look[2]);
      this.controls.update();
    } else {
      this.renderer.camera.lookAt(look[0], look[1], look[2]);
    }
  }

  /**
   * Casts a ray from screen coordinates (mouse or touch) and returns intersecting 3D objects.
   *
   * @param event MouseEvent or PointerEvent from DOM.
   * @param objects List of 3D objects to test (defaults to scene children).
   * @param recursive Test children recursively (default: true).
   */
  public raycastPointer(
    event: MouseEvent | PointerEvent | { clientX: number; clientY: number },
    objects?: THREE.Object3D[],
    recursive: boolean = true
  ): THREE.Intersection[] {
    const dom = this.renderer.domElement;
    const rect = dom.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), this.renderer.camera);

    const targets = objects ?? this.scene.nativeScene.children;
    return raycaster.intersectObjects(targets, recursive);
  }

  /**
   * Casts a ray along the pointing orientation of a WebXR controller.
   *
   * @param controllerIndex 0 (primary/right) or 1 (secondary/left).
   * @param objects List of 3D objects to test (defaults to scene children).
   * @param recursive Test children recursively (default: true).
   */
  public raycastController(
    controllerIndex: number,
    objects?: THREE.Object3D[],
    recursive: boolean = true
  ): THREE.Intersection[] {
    const targets = objects ?? this.scene.nativeScene.children;
    return this.session.raycastController(controllerIndex, targets, recursive);
  }

  /**
   * Subscribes to controller trigger click events in WebXR.
   * @returns Unsubscribe function.
   */
  public onControllerSelect(callback: ControllerSelectCallback): () => void {
    return this.session.onSelect(callback);
  }

  /**
   * Asynchronously loads a glTF/GLB model, aligns it at ground level (Y = 0),
   * adds it to the scene, and adjusts camera framing.
   *
   * @param source URL string or File object.
   * @param options Configuration for grounding, centering, and progress.
   */
  public async loadModel(
    source: string | File,
    options: LoadModelOptions = {}
  ): Promise<LoadedModel> {
    // Dispose previous model if present
    if (this.currentModel) {
      this.scene.remove(this.currentModel.group);
      this.currentModel.dispose();
      this.currentModel = null;
    }

    const loaded = await this.assets.loadModel(source, options);
    this.currentModel = loaded;
    this.scene.add(loaded.group);

    // Frame camera nicely toward the model center
    if (this.controls) {
      const height = loaded.metrics.dimensions.height;
      this.initialCameraTarget = [0, height * 0.4, 0];
      this.controls.target.set(0, height * 0.4, 0);
      this.controls.update();
    }

    return loaded;
  }

  /**
   * Registers a callback executed on every frame before rendering.
   * @returns Unsubscribe function to remove the callback.
   */
  public onUpdate(callback: UpdatableCallback): () => void {
    return this.renderer.addUpdatable(callback);
  }

  /**
   * Starts the animation loop and rendering.
   */
  public start(): this {
    this.renderer.start((_delta, _elapsed) => {
      // Update OrbitControls on desktop
      if (this.controls && this.controls.enabled) {
        this.controls.update();
      }

      // Render the scene
      this.renderer.render(this.scene.nativeScene);
    });
    return this;
  }

  /**
   * Pauses the animation loop.
   */
  public stop(): this {
    this.renderer.stop();
    return this;
  }

  /**
   * Disposes the application, closing sessions, clearing models, and releasing WebGL resources.
   */
  public dispose(): void {
    this.stop();
    if (this.controls) {
      this.controls.dispose();
    }
    this.session.dispose();
    this.assets.dispose();
    this.scene.dispose();
    this.renderer.dispose();
    this.currentModel = null;
  }
}
