import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { events } from '../core/EventBus';

export class DesktopControls {
  public readonly controls: PointerLockControls;
  public isLocked: boolean = false;

  private camera: THREE.PerspectiveCamera;

  // Movimiento
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private rotateLeft: boolean = false;
  private rotateRight: boolean = false;
  private distanceIn: boolean = false;
  private distanceOut: boolean = false;
  private hasGameStarted: boolean = false;

  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();

  // Límites espaciales de la zona del operador (detrás del mostrador)
  private readonly bounds = {
    minX: -2.4,
    maxX: 2.4,
    minZ: -3.4,
    maxZ: -0.6
  };

  private blocker: HTMLElement | null;
  private startBtn: HTMLElement | null;

  constructor(camera: THREE.PerspectiveCamera, _domElement?: HTMLElement) {
    this.camera = camera;

    this.controls = new PointerLockControls(this.camera, document.body);

    this.blocker = document.getElementById('blocker');
    this.startBtn = document.getElementById('btn-start');

    this.setupPointerLock();
    this.setupKeyboard();
  }

  private setupPointerLock(): void {
    if (this.startBtn && this.blocker) {
      this.startBtn.addEventListener('click', () => {
        if (!this.hasGameStarted) {
          this.hasGameStarted = true;
          events.emit('SIMULATION_STARTED');
        }
        this.controls.lock();
      });

      this.controls.addEventListener('lock', () => {
        this.isLocked = true;
        if (!this.hasGameStarted) {
          this.hasGameStarted = true;
          events.emit('SIMULATION_STARTED');
        }
        if (this.blocker) {
          this.blocker.style.opacity = '0';
          setTimeout(() => {
            if (this.blocker) this.blocker.style.display = 'none';
          }, 300);
        }
        events.emit('DESKTOP_LOCKED', true);
      });

      this.controls.addEventListener('unlock', () => {
        this.isLocked = false;
        if (this.blocker) {
          this.blocker.style.display = 'flex';
          setTimeout(() => {
            if (this.blocker) this.blocker.style.opacity = '1';
          }, 10);
        }
        events.emit('DESKTOP_LOCKED', false);
      });
    }
  }

  private setupKeyboard(): void {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
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
        case 'KeyE':
          // Disparar interacción (tomar o soltar)
          events.emit('INTERACTION_TRIGGER');
          break;
        case 'KeyF':
          // Acción inteligente rápida: Guardar/Tomar en Carro 01 o Colocar credencial en NFC
          events.emit('INTERACTION_SMART_ACTION');
          events.emit('INTERACTION_PLACE_NFC');
          break;
        case 'KeyQ':
          this.rotateLeft = true;
          break;
        case 'KeyR':
          this.rotateRight = true;
          break;
        case 'KeyX':
          this.distanceIn = true; // Acercar objeto
          break;
        case 'KeyY':
        case 'KeyZ':
          this.distanceOut = true; // Alejar objeto
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
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
        case 'KeyQ':
          this.rotateLeft = false;
          break;
        case 'KeyR':
          this.rotateRight = false;
          break;
        case 'KeyX':
          this.distanceIn = false;
          break;
        case 'KeyY':
        case 'KeyZ':
          this.distanceOut = false;
          break;
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      if (this.isLocked && event.button === 0) {
        // Click izquierdo activa interacción si el cursor está capturado
        events.emit('INTERACTION_TRIGGER');
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (this.isLocked) {
        // Rueda arriba: acercar (+delta); Rueda abajo: alejar (-delta)
        const deltaDist = event.deltaY < 0 ? 0.045 : -0.045;
        events.emit('INTERACTION_ADJUST_DISTANCE', deltaDist);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('wheel', onWheel, { passive: true });
  }

  public update(delta: number): void {
    if (!this.isLocked) return;

    // Fricción / desaceleración suave
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    const walkSpeed = 3.5;
    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * walkSpeed * 10.0 * delta;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x -= this.direction.x * walkSpeed * 10.0 * delta;
    }

    // Desplazar cámara usando los vectores de PointerLockControls
    const moveDist = this.velocity.length() * delta;
    if (moveDist > 0.005) {
      events.emit('PLAYER_MOVED', moveDist);
    }

    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);

    // Rotación de objeto en manos con teclas Q y R
    if (this.rotateLeft) {
      events.emit('INTERACTION_ROTATE_HELD', -2.5 * delta);
    }
    if (this.rotateRight) {
      events.emit('INTERACTION_ROTATE_HELD', 2.5 * delta);
    }

    // Ajuste de distancia de objeto en manos con teclas X y Y (o Z)
    if (this.distanceIn) {
      events.emit('INTERACTION_ADJUST_DISTANCE', 0.6 * delta);
    }
    if (this.distanceOut) {
      events.emit('INTERACTION_ADJUST_DISTANCE', -0.6 * delta);
    }

    // Mantener altura fija de pie (1.65m)
    this.camera.position.y = 1.65;

    // Restricciones de colisión en el área del operador
    this.camera.position.x = THREE.MathUtils.clamp(
      this.camera.position.x,
      this.bounds.minX,
      this.bounds.maxX
    );
    this.camera.position.z = THREE.MathUtils.clamp(
      this.camera.position.z,
      this.bounds.minZ,
      this.bounds.maxZ
    );
  }
}
