import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import type { WorldManager } from '../world/WorldManager.js';
import type { InteractionCallback } from '../interaction/InteractionSystem.js';
import { soundManager } from '../core/AudioSystem.js';

export class WebXRManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private worldManager: WorldManager;

  public isPresenting: boolean = false;
  private controllers: THREE.XRTargetRaySpace[] = [];
  private controllerGrips: THREE.XRGripSpace[] = [];
  private onVRInteractCallback: InteractionCallback | null = null;

  // Player rig group for WebXR camera offset & movement
  public xrRig: THREE.Group = new THREE.Group();

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    worldManager: WorldManager
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.worldManager = worldManager;

    this.initWebXR();
  }

  public onVRInteract(cb: InteractionCallback): void {
    this.onVRInteractCallback = cb;
  }

  private initWebXR(): void {
    this.renderer.xr.enabled = true;

    // Attach rig to scene
    this.xrRig.position.set(0, 0, 0);
    this.xrRig.add(this.camera);
    this.scene.add(this.xrRig);

    // Setup VR Button
    const mountPoint = document.getElementById('vr-button-mount');
    if (mountPoint && 'xr' in navigator) {
      const vrBtn = VRButton.createButton(this.renderer);
      vrBtn.style.position = 'relative';
      vrBtn.style.bottom = 'auto';
      vrBtn.style.left = 'auto';
      vrBtn.style.background = 'rgba(0, 240, 255, 0.15)';
      vrBtn.style.border = '1px solid #00f0ff';
      vrBtn.style.color = '#fff';
      vrBtn.style.fontFamily = 'monospace';
      vrBtn.style.fontSize = '11px';
      vrBtn.style.padding = '8px 14px';
      vrBtn.style.borderRadius = '6px';
      mountPoint.appendChild(vrBtn);
    }

    this.renderer.xr.addEventListener('sessionstart', () => {
      this.isPresenting = true;
      document.body.classList.add('in-vr');
    });

    this.renderer.xr.addEventListener('sessionend', () => {
      this.isPresenting = false;
      document.body.classList.remove('in-vr');
    });

    this.setupControllers();
  }

  private setupControllers(): void {
    for (let i = 0; i < 2; i++) {
      const controller = this.renderer.xr.getController(i);
      this.controllers.push(controller);
      this.xrRig.add(controller);

      // Visible Laser pointer line
      const laserGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -4.5),
      ]);
      const laserMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.6,
      });
      const laser = new THREE.Line(laserGeo, laserMat);
      laser.name = 'laserLine';
      controller.add(laser);

      // Trigger select event
      controller.addEventListener('select', () => {
        this.handleControllerSelect(controller);
      });

      // Grips (controller physical mesh representation)
      const grip = this.renderer.xr.getControllerGrip(i);
      this.controllerGrips.push(grip);
      this.xrRig.add(grip);
    }
  }

  private handleControllerSelect(controller: THREE.XRTargetRaySpace): void {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    raycaster.far = 4.5;

    const hits = raycaster.intersectObjects(this.worldManager.interactiveMeshes, false);
    if (hits.length > 0) {
      const target = hits[0].object;
      if (target.userData && target.userData.interactive) {
        soundManager.playSelect();
        if (this.onVRInteractCallback) {
          this.onVRInteractCallback(target, target.userData);
        }
      }
    }
  }

  /**
   * Reads WebXR gamepad thumbstick input for smooth locomotion and snap turns in VR
   */
  public update(delta: number): void {
    if (!this.isPresenting) return;

    const session = this.renderer.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
      if (source.gamepad && source.gamepad.axes.length >= 4) {
        const axes = source.gamepad.axes;
        // Left hand thumbstick: Locomotion (axes[2], axes[3])
        if (source.handedness === 'left') {
          const moveX = axes[2];
          const moveZ = axes[3];

          if (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.camera.quaternion);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3(1, 0, 0);
            right.applyQuaternion(this.camera.quaternion);
            right.y = 0;
            right.normalize();

            const moveVec = forward.multiplyScalar(-moveZ).add(right.multiplyScalar(moveX));
            const proposed = this.xrRig.position.clone().add(moveVec.multiplyScalar(delta * 3.5));
            const clamped = this.worldManager.clampPosition(this.xrRig.position, proposed);
            this.xrRig.position.x = clamped.x;
            this.xrRig.position.z = clamped.z;
          }
        }

        // Right hand thumbstick: Snap turn (axes[2])
        if (source.handedness === 'right') {
          const turnX = axes[2];
          if (Math.abs(turnX) > 0.6) {
            this.xrRig.rotation.y -= Math.sign(turnX) * 0.04;
          }
        }
      }
    }
  }
}
