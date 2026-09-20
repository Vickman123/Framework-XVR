import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { events } from '../core/EventBus';

export interface XRControllerData {
  index: number;
  controller: THREE.XRTargetRaySpace;
  grip: THREE.XRGripSpace;
  ray: THREE.Line;
}

export class XRManager {
  public isXRPresenting: boolean = false;
  public controllers: XRControllerData[] = [];
  public hands: THREE.XRHandSpace[] = [];

  private renderer: THREE.WebGLRenderer;
  private xrRig: THREE.Group;

  // Control de giro Snap anti-mareo para WebXR (Meta Quest)
  private hasSnapTurned: boolean = false;
  private snapTurnCooldown: number = 0;

  constructor(renderer: THREE.WebGLRenderer, xrRig: THREE.Group) {
    this.renderer = renderer;
    this.xrRig = xrRig;

    this.setupVRButton();
    this.setupControllers();
    this.setupHands();
    this.setupSessionListeners();
  }

  private setupVRButton(): void {
    const button = VRButton.createButton(this.renderer);
    button.id = 'VRButton';
    document.body.appendChild(button);

    // Detección reactiva de disponibilidad WebXR para activar estilos azules
    const checkState = () => {
      if (button.textContent && button.textContent.toUpperCase().includes('ENTER')) {
        button.classList.add('vr-ready');
      } else {
        button.classList.remove('vr-ready');
      }
    };
    checkState();

    const observer = new MutationObserver(checkState);
    observer.observe(button, { childList: true, characterData: true, subtree: true });
  }

  private setupControllers(): void {
    const createLaserRay = () => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -2.5)
      ]);
      const material = new THREE.LineBasicMaterial({
        color: 0x0076F5,
        transparent: true,
        opacity: 0.75
      });
      const line = new THREE.Line(geometry, material);
      line.name = 'LaserRay';
      return line;
    };

    for (let i = 0; i < 2; i++) {
      // Ray space (apuntador)
      const controller = this.renderer.xr.getController(i);
      const ray = createLaserRay();
      controller.add(ray);
      this.xrRig.add(controller);

      // Grip space (agarre de mando)
      const grip = this.renderer.xr.getControllerGrip(i);
      
      // Malla visual básica de mando (placeholder cilíndrico ergonómico)
      const gripMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.025, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5, metalness: 0.8 })
      );
      gripMesh.rotation.x = Math.PI / 4;
      grip.add(gripMesh);
      this.xrRig.add(grip);

      // Eventos de interacción en VR
      controller.addEventListener('selectstart', () => {
        events.emit('VR_TRIGGER_DOWN', { controllerIndex: i, controller });
      });

      controller.addEventListener('selectend', () => {
        events.emit('VR_TRIGGER_UP', { controllerIndex: i, controller });
      });

      controller.addEventListener('squeezestart', () => {
        events.emit('VR_GRIP_DOWN', { controllerIndex: i, controller });
      });

      controller.addEventListener('squeezeend', () => {
        events.emit('VR_GRIP_UP', { controllerIndex: i, controller });
      });

      this.controllers.push({
        index: i,
        controller,
        grip,
        ray
      });
    }
  }

  private setupHands(): void {
    // Soporte para Hand Tracking en Meta Quest
    for (let i = 0; i < 2; i++) {
      const hand = this.renderer.xr.getHand(i);
      this.xrRig.add(hand);
      this.hands.push(hand);

      hand.addEventListener('pinchstart', () => {
        events.emit('VR_HAND_PINCH_START', { handIndex: i, hand });
      });

      hand.addEventListener('pinchend', () => {
        events.emit('VR_HAND_PINCH_END', { handIndex: i, hand });
      });
    }
  }

  private setupSessionListeners(): void {
    this.renderer.xr.addEventListener('sessionstart', () => {
      this.isXRPresenting = true;
      // Opción A: Calibración de posición y orientación para Meta Quest
      // Sitúa el centro del área de juego detrás del mostrador (Z = -1.35m)
      // y orienta 180° (Math.PI) para mirar de frente al mostrador y al alumno
      this.xrRig.position.set(0, 0, -1.35);
      this.xrRig.rotation.y = Math.PI;

      console.log('[XRManager] WebXR Session activa en Meta Quest / Visor con calibración de operador.');
      events.emit('XR_SESSION_STATE', true);
      events.emit('SIMULATION_STARTED');
      const blocker = document.getElementById('blocker');
      if (blocker) blocker.style.display = 'none';
    });

    this.renderer.xr.addEventListener('sessionend', () => {
      this.isXRPresenting = false;
      this.xrRig.position.set(0, 0, 0);
      this.xrRig.rotation.y = 0;
      console.log('[XRManager] WebXR Session finalizada.');
      events.emit('XR_SESSION_STATE', false);
    });
  }

  public getActiveRaycasters(): { origin: THREE.Vector3; direction: THREE.Vector3 }[] {
    const rays: { origin: THREE.Vector3; direction: THREE.Vector3 }[] = [];

    for (const ctrlData of this.controllers) {
      const tempMatrix = new THREE.Matrix4();
      tempMatrix.identity().extractRotation(ctrlData.controller.matrixWorld);

      const origin = new THREE.Vector3();
      ctrlData.controller.getWorldPosition(origin);

      const direction = new THREE.Vector3(0, 0, -1).applyMatrix4(tempMatrix);
      rays.push({ origin, direction });
    }

    return rays;
  }

  public getControllerGamepads(): {
    right?: Gamepad;
    left?: Gamepad;
  } {
    const session = this.renderer.xr.getSession();
    if (!session) return {};

    const result: { right?: Gamepad; left?: Gamepad } = {};
    for (const source of session.inputSources) {
      if (source.gamepad) {
        if (source.handedness === 'right') {
          result.right = source.gamepad;
        } else if (source.handedness === 'left') {
          result.left = source.gamepad;
        }
      }
    }
    return result;
  }

  public updateLocomotion(delta: number): void {
    if (!this.isXRPresenting) return;

    if (this.snapTurnCooldown > 0) {
      this.snapTurnCooldown -= delta;
    }

    const { left, right } = this.getControllerGamepads();

    // Desplazamiento con thumbstick del mando izquierdo (con filtro anti-drift)
    if (left && left.axes && left.axes.length >= 2) {
      const rawX = left.axes.length >= 4 && Math.abs(left.axes[2]) > 0.15 ? left.axes[2] : left.axes[0];
      const rawZ = left.axes.length >= 4 && Math.abs(left.axes[3]) > 0.15 ? left.axes[3] : left.axes[1];
      const deadzone = 0.20;

      let stickX = 0;
      let stickZ = 0;
      if (Math.abs(rawX) > deadzone) stickX = rawX;
      if (Math.abs(rawZ) > deadzone) stickZ = rawZ;

      if (stickX !== 0 || stickZ !== 0) {
        const speed = 2.0 * delta;
        const cameraDirection = new THREE.Vector3();
        this.renderer.xr.getCamera().getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        const rightVec = new THREE.Vector3();
        rightVec.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();

        // Invertir los ejes de traslación para que adelante sea avanzar hacia el frente y derecha sea hacia la derecha
        this.xrRig.position.addScaledVector(cameraDirection, stickZ * speed);
        this.xrRig.position.addScaledVector(rightVec, -stickX * speed);

        // Limitar dentro del área de servicio del operador (detrás del mostrador)
        this.xrRig.position.x = THREE.MathUtils.clamp(this.xrRig.position.x, -2.4, 2.4);
        this.xrRig.position.z = THREE.MathUtils.clamp(this.xrRig.position.z, -3.4, -0.6);
      }
    }

    // Giro Snap de Confort (30° por pulsación) con thumbstick del mando derecho
    // Elimina 100% el giro continuo accidental y el mareo por movimiento en Meta Quest
    if (right && right.axes && right.axes.length >= 2) {
      const rawTurnX = right.axes.length >= 4 && Math.abs(right.axes[2]) > 0.15 ? right.axes[2] : right.axes[0];
      const snapThreshold = 0.55;
      const releaseThreshold = 0.20;

      if (rawTurnX < -snapThreshold) {
        if (!this.hasSnapTurned && this.snapTurnCooldown <= 0) {
          // Snap Turn Izquierda (+30°)
          this.xrRig.rotation.y += Math.PI / 6;
          this.hasSnapTurned = true;
          this.snapTurnCooldown = 0.25;
        }
      } else if (rawTurnX > snapThreshold) {
        if (!this.hasSnapTurned && this.snapTurnCooldown <= 0) {
          // Snap Turn Derecha (-30°)
          this.xrRig.rotation.y -= Math.PI / 6;
          this.hasSnapTurned = true;
          this.snapTurnCooldown = 0.25;
        }
      } else if (Math.abs(rawTurnX) < releaseThreshold) {
        // La palanca regresó a zona neutral: desbloquear para el siguiente snap
        this.hasSnapTurned = false;
      }
    }
  }
}
