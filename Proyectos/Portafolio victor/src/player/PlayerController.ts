import * as THREE from 'three';
import { soundManager } from '../core/AudioSystem.js';
import type { WorldManager } from '../world/WorldManager.js';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public domElement: HTMLElement;
  public worldManager: WorldManager;

  // Motion state
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.6, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private isSprinting: boolean = false;

  // External touch joystick vector
  public touchMoveVector: THREE.Vector2 = new THREE.Vector2();

  // Rotation state
  public pitch: number = 0; // up/down
  public yaw: number = 0;   // left/right
  public isLocked: boolean = false;

  // Configuration
  private walkSpeed: number = 4.8;
  private sprintSpeed: number = 8.0;
  private damping: number = 10.0;
  private mouseSensitivity: number = 0.0022;

  // Touch look tracking
  private activeTouchId: number | null = null;
  private lastTouchX: number = 0;
  private lastTouchY: number = 0;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, worldManager: WorldManager) {
    this.camera = camera;
    this.domElement = domElement;
    this.worldManager = worldManager;

    this.camera.position.copy(this.position);
    this.bindKeyboard();
    this.bindMouse();
    this.bindTouch();
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.isSprinting = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.moveForward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.moveBackward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.moveLeft = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.moveRight = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.isSprinting = false;
          break;
      }
    });
  }

  private bindMouse(): void {
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      this.yaw -= movementX * this.mouseSensitivity;
      this.pitch -= movementY * this.mouseSensitivity;

      // Clamp vertical pitch so user cannot flip upside down
      this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
    });
  }

  private bindTouch(): void {
    // Touch drag for looking around on mobile
    window.addEventListener(
      'touchstart',
      (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          const target = t.target as HTMLElement | null;

          // Ignore touches on UI controls (joystick, action button, HUD buttons, modals, overlays)
          if (
            target &&
            target.closest(
              '#mobile-controls, #joystick-zone, #mobile-action-btn, .hud-btn, #modal-container, #instructions-overlay, #orientation-overlay, button, a'
            )
          ) {
            continue;
          }

          // If touch is on right 65% of screen and no look touch active, claim it
          if (t.clientX > window.innerWidth * 0.35 && this.activeTouchId === null) {
            this.activeTouchId = t.identifier;
            this.lastTouchX = t.clientX;
            this.lastTouchY = t.clientY;
          }
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === this.activeTouchId) {
            const dx = t.clientX - this.lastTouchX;
            const dy = t.clientY - this.lastTouchY;
            this.lastTouchX = t.clientX;
            this.lastTouchY = t.clientY;

            // Responsive touch look sensitivity
            this.yaw -= dx * 0.0042;
            this.pitch -= dy * 0.0042;
            this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
          }
        }
      },
      { passive: true }
    );

    const endTouch = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.activeTouchId) {
          this.activeTouchId = null;
        }
      }
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);
  }

  public requestPointerLock(): void {
    soundManager.resumeContext();
    if (this.domElement && typeof this.domElement.requestPointerLock === 'function') {
      try {
        const p = this.domElement.requestPointerLock();
        if (p && typeof (p as Promise<void>).catch === 'function') {
          (p as Promise<void>).catch(() => {});
        }
      } catch {
        // Ignored on mobile touch devices
      }
    }
  }

  public unlockPointer(): void {
    if (document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Teleports player smoothly to a specific waypoint coordinates
   */
  public teleportTo(targetPos: THREE.Vector3, targetYaw?: number): void {
    soundManager.playWarp();
    this.position.copy(targetPos);
    this.position.y = 1.6;
    this.velocity.set(0, 0, 0);
    if (targetYaw !== undefined) {
      this.yaw = targetYaw;
      this.pitch = 0;
    }
    this.camera.position.copy(this.position);
  }

  public update(delta: number): void {
    // 1. Calculate desired movement direction relative to camera yaw
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);

    // Rotate vectors by yaw (horizontal direction only)
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const input = new THREE.Vector3();

    // Keyboard inputs
    if (this.moveForward) input.add(forward);
    if (this.moveBackward) input.sub(forward);
    if (this.moveRight) input.add(right);
    if (this.moveLeft) input.sub(right);

    // Mobile touch joystick input
    if (this.touchMoveVector.lengthSq() > 0.01) {
      const touchForward = forward.clone().multiplyScalar(-this.touchMoveVector.y);
      const touchRight = right.clone().multiplyScalar(this.touchMoveVector.x);
      input.add(touchForward).add(touchRight);
    }

    if (input.lengthSq() > 0.001) {
      input.normalize();
      const speed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;
      input.multiplyScalar(speed);

      // Trigger footstep sound
      soundManager.triggerFootstep(Date.now());
    }

    // 2. Velocity smoothing and damping
    this.velocity.x += (input.x - this.velocity.x) * Math.min(delta * this.damping, 1.0);
    this.velocity.z += (input.z - this.velocity.z) * Math.min(delta * this.damping, 1.0);

    // 3. Propose new position and check collision bounds
    const proposed = this.position.clone();
    proposed.x += this.velocity.x * delta;
    proposed.z += this.velocity.z * delta;

    const clamped = this.worldManager.clampPosition(this.position, proposed);
    this.position.x = clamped.x;
    this.position.z = clamped.z;
    this.position.y = 1.6; // keep eye height

    // 4. Update Camera position & rotation
    this.camera.position.copy(this.position);

    // Apply Euler rotation in YXZ order
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }
}
