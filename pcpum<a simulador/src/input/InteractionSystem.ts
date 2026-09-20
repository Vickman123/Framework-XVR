import * as THREE from 'three';
import { Laptop, IGrabbable } from '../entities/Laptop';
import { Credential } from '../entities/Credential';
import { NFCScanner } from '../entities/NFCScanner';
import { events } from '../core/EventBus';
import { XRManager } from '../xr/XRManager';
import { ComputerPlaceholder } from '../entities/ComputerPlaceholder';
import { StorageCart } from '../environment/StorageCart';
import { inventory } from '../inventory/InventoryManager';

export class InteractionSystem {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private xrManager: XRManager;
  private computer?: ComputerPlaceholder;
  private cart?: StorageCart;
  private nfcScanner?: NFCScanner;
  private credential?: Credential;

  private grabbables: IGrabbable[] = [];
  private raycaster = new THREE.Raycaster();

  private hoveredGrabbable: IGrabbable | null = null;
  private heldGrabbable: IGrabbable | null = null;

  private isHoveringScreen: boolean = false;
  private lastScreenUV: THREE.Vector2 | null = null;

  private isHoveringCartDoor: boolean = false;
  private isHoveringNFCPlacement: boolean = false;
  private isHoveringCart: boolean = false;
  private hoveredBayIndex: number | null = null;
  private isStudentWaitingCredential: boolean = false;

  private nfcSnapCooldown: number = 0;
  private heldHolder: THREE.Object3D | null = null;

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene, xrManager: XRManager) {
    this.camera = camera;
    this.scene = scene;
    this.xrManager = xrManager;

    this.setupEventListeners();
  }

  public registerGrabbable(grabbable: IGrabbable): void {
    this.grabbables.push(grabbable);
  }

  public unregisterGrabbable(grabbable: IGrabbable): void {
    const idx = this.grabbables.indexOf(grabbable);
    if (idx !== -1) {
      this.grabbables.splice(idx, 1);
    }
  }

  public setComputer(computer: ComputerPlaceholder): void {
    this.computer = computer;
  }

  public setCart(cart: StorageCart): void {
    this.cart = cart;
  }

  public setNFCScanner(scanner: NFCScanner): void {
    this.nfcScanner = scanner;
  }

  public setCredential(credential: Credential): void {
    this.credential = credential;
  }

  private setupEventListeners(): void {
    // 1. Disparo principal en escritorio (Tecla E o Click)
    events.on('INTERACTION_TRIGGER', () => {
      this.handleAction(this.camera);
    });

    // 2. Acción inteligente dedicada (Tecla F): Guardar en Carro / Tomar equipo / Colocar NFC / Entregar Credencial
    events.on('INTERACTION_SMART_ACTION', () => {
      this.handleSmartAction(this.camera);
    });

    // Escucha de estado de espera de credencial por el alumno
    events.on('CREDENTIAL_TRAY_HIGHLIGHT', (active: boolean) => {
      this.isStudentWaitingCredential = active;
    });
    events.on('STUDENT_RECEIVED_CREDENTIAL', () => {
      this.isStudentWaitingCredential = false;
    });
    events.on('STUDENT_RECEIVED_CREDENTIAL_RETURN', () => {
      this.isStudentWaitingCredential = false;
    });
    events.on('STUDENT_RECEIVED_CREDENTIAL_REJECTED', () => {
      this.isStudentWaitingCredential = false;
    });

    // Retrocompatibilidad con evento NFC
    events.on('INTERACTION_PLACE_NFC', () => {
      if (this.heldGrabbable instanceof Credential && !this.isStudentWaitingCredential) {
        this.placeCredentialOnNFC();
      }
    });

    // 3. Desactivar interacción si el alumno toma el equipo prestado
    events.on('STUDENT_RECEIVED_LAPTOP', (data: { laptopId: string }) => {
      const laptop = this.grabbables.find((g) => g.id === data.laptopId);
      if (laptop) {
        this.unregisterGrabbable(laptop);
      }
    });

    // 4. Re-activar interacción cuando el alumno devuelve la laptop al mostrador
    events.on('LAPTOP_RETURNED_TO_COUNTER', (data: { laptopId: string; laptop?: any }) => {
      if (data.laptop && !this.grabbables.includes(data.laptop)) {
        this.registerGrabbable(data.laptop);
      }
    });

    // 5. Disparo y Agarre en VR con mandos (Hold-to-Grab)
    events.on('VR_TRIGGER_DOWN', (data: { controllerIndex: number; controller: THREE.Object3D }) => {
      this.handleAction(data.controller);
    });

    events.on('VR_TRIGGER_UP', (data: { controllerIndex: number; controller: THREE.Object3D }) => {
      this.handleVRRelease(data.controller);
    });

    events.on('VR_GRIP_DOWN', (data: { controllerIndex: number; controller: THREE.Object3D }) => {
      if (this.heldGrabbable instanceof Laptop && (this.isHoveringCart || this.isNearCart())) {
        this.dockLaptopToCart(this.hoveredBayIndex || undefined);
      } else {
        this.handleAction(data.controller);
      }
    });

    events.on('VR_GRIP_UP', (data: { controllerIndex: number; controller: THREE.Object3D }) => {
      this.handleVRRelease(data.controller);
    });

    // 6. Disparo con Hand Tracking
    events.on('VR_HAND_PINCH_START', (data: { handIndex: number; hand: THREE.Object3D }) => {
      this.handleAction(data.hand);
    });

    events.on('VR_HAND_PINCH_END', (data: { handIndex: number; hand: THREE.Object3D }) => {
      this.handleVRRelease(data.hand);
    });

    // 7. Rotación de objeto sostenido desde teclado (Q/R)
    events.on('INTERACTION_ROTATE_HELD', (deltaAngle: number) => {
      if (this.heldGrabbable) {
        this.heldGrabbable.rotateHeld?.(deltaAngle);
      }
    });

    // 8. Ajuste de distancia de objeto sostenido desde teclado (X/Y) o rueda de ratón
    events.on('INTERACTION_ADJUST_DISTANCE', (deltaDistance: number) => {
      if (this.heldGrabbable) {
        this.heldGrabbable.adjustDistance?.(deltaDistance);
      }
    });
  }

  private handleAction(holder: THREE.Object3D): void {
    // A) Si estamos sosteniendo un objeto:
    if (this.heldGrabbable) {
      // Caso 1: Credencial apuntando o cerca del lector NFC -> Colocar en NFC
      if (this.heldGrabbable instanceof Credential && (this.isHoveringNFCPlacement || this.isNearNFCScanner())) {
        this.placeCredentialOnNFC();
        return;
      }

      // Caso 2: Laptop apuntando directamente al Carro 01 -> Guardar en bahía
      if (this.heldGrabbable instanceof Laptop && this.isHoveringCart) {
        this.dockLaptopToCart(this.hoveredBayIndex || undefined);
        return;
      }

      // Caso 3: Soltar / Entregar en el mostrador o espacio libre
      this.releaseObject();
      return;
    }

    // B) Si las manos están libres:
    // 1. Apuntando directamente a un objeto agarrable (Laptop o Credencial) -> Tomar
    if (this.hoveredGrabbable && !this.hoveredGrabbable.isGrabbed()) {
      // Si la laptop está dentro del carro y la puerta está cerrada, abrirla automáticamente
      if (this.cart && !this.cart.isDoorOpen && this.isLaptopInsideCart(this.hoveredGrabbable)) {
        this.cart.openDoor();
      }
      this.grabObject(this.hoveredGrabbable, holder);
      return;
    }

    // 2. Apuntando a una bahía ocupada del carro -> Tomar equipo de esa bahía
    if (this.hoveredBayIndex && this.cart && this.cart.isSlotOccupied(this.hoveredBayIndex)) {
      this.takeLaptopFromCart(holder, this.hoveredBayIndex);
      return;
    }

    // 3. Apuntando a la pantalla interactiva -> Click en UI
    if (this.isHoveringScreen && this.computer && this.lastScreenUV) {
      this.computer.screenUI.handlePointerClick(this.lastScreenUV.x, this.lastScreenUV.y);
      return;
    }

    // 4. Apuntando a la manija de la puerta del carro -> Abrir / Cerrar
    if (this.isHoveringCartDoor && this.cart) {
      this.cart.toggleDoor();
      return;
    }
  }

  private handleSmartAction(holder: THREE.Object3D): void {
    // A) Sosteniendo credencial:
    if (this.heldGrabbable instanceof Credential) {
      if (this.isStudentWaitingCredential || this.isNearStudent()) {
        this.deliverCredentialToTray();
      } else {
        this.placeCredentialOnNFC();
      }
      return;
    }

    // B) Sosteniendo laptop -> Guardar en Carro 01
    if (this.heldGrabbable instanceof Laptop) {
      if (this.isHoveringCart || this.isNearCart()) {
        this.dockLaptopToCart(this.hoveredBayIndex || undefined);
      } else {
        this.releaseObject();
      }
      return;
    }

    // C) Manos libres:
    if (!this.heldGrabbable) {
      // Cerca del carro o apuntando al carro -> Tomar laptop disponible
      if (this.isHoveringCart || this.isNearCart() || this.hoveredBayIndex) {
        this.takeLaptopFromCart(holder, this.hoveredBayIndex || undefined);
        return;
      }

      // Cerca del lector NFC con credencial colocada -> Retirar credencial
      if (this.isNearNFCScanner() && this.credential && !this.credential.isGrabbed()) {
        this.grabObject(this.credential, holder);
        return;
      }
    }
  }

  public dockLaptopToCart(targetSlot?: number): void {
    if (!this.cart || !(this.heldGrabbable instanceof Laptop)) return;

    const laptop = this.heldGrabbable;
    this.heldGrabbable = null;

    // 1. Abrir puerta automáticamente si está cerrada
    if (!this.cart.isDoorOpen) {
      this.cart.openDoor();
    }

    // 2. Determinar la bahía a utilizar
    let finalSlot = targetSlot;
    if (!finalSlot) {
      if (!this.cart.isSlotOccupied(laptop.slotIndex)) {
        finalSlot = laptop.slotIndex;
      } else {
        finalSlot = this.cart.getFirstAvailableSlot();
      }
    }

    // 3. Posicionar y orientar en la bahía
    const slotPos = this.cart.getSlotWorldPosition(finalSlot);
    const cartEuler = this.cart.getWorldEuler();

    this.scene.attach(laptop.group);
    laptop.setOpen(false); // Se cierra automáticamente al resguardarse
    laptop.release(slotPos, cartEuler);

    // 4. Actualizar estado en inventario y en el carro
    const status = laptop.isMaintenance ? 'MANTENIMIENTO' : 'DISPONIBLE';
    inventory.updateStatus(laptop.id, status);
    this.cart.setSlotOccupied(finalSlot, laptop.id);

    // 5. Emitir eventos
    events.emit('LAPTOP_SNAPPED_TO_CART', {
      id: laptop.id,
      slotIndex: finalSlot
    });

    events.emit('OBJECT_RELEASED', {
      id: laptop.id,
      name: laptop.tag
    });
  }

  public takeLaptopFromCart(holder: THREE.Object3D, slotIndex?: number): void {
    if (!this.cart) return;

    let targetLaptop: Laptop | null = null;
    let targetSlot = slotIndex;

    if (!targetSlot) {
      // Buscar primera laptop disponible en el carro (preferencia Laptop 02)
      for (let i = 1; i <= 5; i++) {
        const lap = this.grabbables.find(
          (g) => g instanceof Laptop && g.slotIndex === i && !g.isGrabbed()
        ) as Laptop | undefined;
        if (lap) {
          targetLaptop = lap;
          targetSlot = i;
          break;
        }
      }
    } else {
      targetLaptop = this.grabbables.find(
        (g) => g instanceof Laptop && g.slotIndex === targetSlot && !g.isGrabbed()
      ) as Laptop || null;
    }

    if (targetLaptop) {
      if (!this.cart.isDoorOpen) {
        this.cart.openDoor();
      }
      this.grabObject(targetLaptop, holder);
      if (targetSlot) {
        this.cart.setSlotOccupied(targetSlot, null);
      }
    }
  }

  private isLaptopInsideCart(target: IGrabbable): boolean {
    if (!this.cart || !(target instanceof Laptop)) return false;
    const lapWorld = new THREE.Vector3();
    target.group.getWorldPosition(lapWorld);
    const cartWorld = new THREE.Vector3();
    this.cart.group.getWorldPosition(cartWorld);
    return lapWorld.distanceTo(cartWorld) < 0.8;
  }

  private isNearCart(): boolean {
    if (!this.cart) return false;
    const cartPos = new THREE.Vector3();
    this.cart.group.getWorldPosition(cartPos);
    return this.camera.position.distanceTo(cartPos) < 2.5;
  }

  private grabObject(target: IGrabbable, holder: THREE.Object3D): void {
    this.heldGrabbable = target;
    this.heldHolder = holder;
    this.nfcSnapCooldown = 1.0; // Enfriamiento para permitir alejar la credencial sin auto-snap
    target.grab(holder);

    if (target instanceof Laptop) {
      inventory.updateStatus(target.id, 'EN_MANOS');
      if (this.cart) {
        this.cart.setSlotOccupied(target.slotIndex, null);
      }
      events.emit('OBJECT_GRABBED', {
        id: target.id,
        name: `${target.tag} (${target.isMaintenance ? 'Mantenimiento' : 'Disponible'})`
      });
    } else if (target instanceof Credential) {
      events.emit('OBJECT_GRABBED', {
        id: target.id,
        name: 'Credencial UNAM (Juan Pérez López)'
      });
    } else {
      events.emit('OBJECT_GRABBED', {
        id: target.id,
        name: target.id
      });
    }
  }

  public placeCredentialOnNFC(): void {
    if (!(this.heldGrabbable instanceof Credential) || !this.nfcScanner) return;

    const cred = this.heldGrabbable;
    this.heldGrabbable = null;
    this.heldHolder = null;

    // Preservar transformaciones de mundo
    this.scene.attach(cred.group);

    // Acoplar al lector NFC
    this.nfcScanner.snapCredential(cred);

    events.emit('OBJECT_RELEASED', {
      id: cred.id,
      name: 'Credencial UNAM'
    });
  }

  public deliverCredentialToTray(): void {
    if (!(this.heldGrabbable instanceof Credential)) return;

    const cred = this.heldGrabbable;
    this.heldGrabbable = null;
    this.heldHolder = null;

    this.scene.attach(cred.group);
    // Acoplar al centro de la nueva Bandeja de Entrega frente al alumno
    const targetPos = new THREE.Vector3(0.38, 1.102, 0.12);
    const targetRot = new THREE.Euler(0, -Math.PI / 10, 0);
    cred.release(targetPos, targetRot);

    events.emit('OBJECT_RELEASED', {
      id: cred.id,
      name: 'Credencial UNAM'
    });
  }

  private isNearStudent(): boolean {
    const credPos = new THREE.Vector3();
    if (this.credential) {
      this.credential.group.getWorldPosition(credPos);
    }
    const studentPos = new THREE.Vector3(0.65, 1.1, 0.55);
    return credPos.distanceTo(studentPos) < 1.35;
  }

  private isNearNFCScanner(): boolean {
    if (!this.nfcScanner || !this.credential) return false;
    if (this.nfcSnapCooldown > 0) return false;

    const credPos = new THREE.Vector3();
    const scanPos = new THREE.Vector3();
    this.credential.group.getWorldPosition(credPos);
    this.nfcScanner.group.getWorldPosition(scanPos);
    return credPos.distanceTo(scanPos) < 0.20;
  }

  private handleVRRelease(controller: THREE.Object3D): void {
    if (!this.heldGrabbable) return;

    // Verificar que el evento de liberación pertenezca al mando que sostiene
    if (this.heldHolder && this.heldHolder !== controller) {
      const isSameRoot = this.heldHolder.parent === controller.parent;
      if (!isSameRoot) return;
    }

    const obj = this.heldGrabbable;

    // 1. Si es Credencial y está cerca de la diana NFC (< 20 cm) -> Magnet snap
    if (obj instanceof Credential) {
      if (this.nfcScanner && this.nfcSnapCooldown <= 0) {
        const scannerPos = new THREE.Vector3();
        this.nfcScanner.group.getWorldPosition(scannerPos);
        const cardPos = new THREE.Vector3();
        obj.group.getWorldPosition(cardPos);

        if (cardPos.distanceTo(scannerPos) < 0.20) {
          this.placeCredentialOnNFC();
          return;
        }
      }
      this.releaseObject();
      return;
    }

    // 2. Si es Laptop y está cerca/mirando al Carro 01 -> Docking
    if (obj instanceof Laptop) {
      if (this.cart && (this.isHoveringCart || this.isNearCart())) {
        this.dockLaptopToCart(this.hoveredBayIndex || undefined);
        return;
      }
      this.releaseObject();
      return;
    }

    this.releaseObject();
  }

  private releaseObject(): void {
    if (!this.heldGrabbable) return;

    const objectToRelease = this.heldGrabbable;
    this.heldGrabbable = null;
    this.heldHolder = null;

    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    objectToRelease.group.getWorldPosition(worldPos);
    objectToRelease.group.getWorldQuaternion(worldQuat);

    // Reasociar a la escena principal preservando coordenadas mundiales
    this.scene.attach(objectToRelease.group);

    if (objectToRelease instanceof Laptop) {
      // 1. Snapping al carro SOLAMENTE si el jugador está mirando directamente al carro
      if (this.cart && this.isHoveringCart) {
        const nearest = this.cart.findNearestSlot(worldPos, 0.75);
        if (nearest) {
          this.dockLaptopToCart(nearest.slotIndex);
          return;
        }
      }

      // 2. Colocar sobre el mostrador en la ZONA DE ENTREGA Y RECEPCIÓN para entrega a Juan o inspección
      const restX = THREE.MathUtils.clamp(worldPos.x, -0.4, 0.9);
      const restZ = THREE.MathUtils.clamp(worldPos.z, -0.4, 0.4);
      const targetPos = new THREE.Vector3(restX, 1.101, restZ);
      objectToRelease.release(targetPos, new THREE.Euler(0, -Math.PI / 8, 0));
      inventory.updateStatus(objectToRelease.id, 'EN_MOSTRADOR');

      events.emit('OBJECT_RELEASED', {
        id: objectToRelease.id,
        name: objectToRelease.tag
      });
    } else if (objectToRelease instanceof Credential) {
      // 1. Si se suelta cerca del lector NFC (< 22 cm) y el cooldown expiró -> Imán NFC
      if (this.nfcScanner && this.nfcSnapCooldown <= 0) {
        const scannerPos = new THREE.Vector3();
        this.nfcScanner.group.getWorldPosition(scannerPos);
        if (worldPos.distanceTo(scannerPos) < 0.22) {
          this.nfcScanner.snapCredential(objectToRelease);
          events.emit('OBJECT_RELEASED', { id: objectToRelease.id, name: 'Credencial UNAM' });
          return;
        }
      }

      // 2. Si se suelta en la mitad derecha del mostrador o cerca de la bandeja -> Imán automático a la Bandeja de Entrega
      const trayPos = new THREE.Vector3(0.38, 1.08, 0.12);
      const distToTray = worldPos.distanceTo(trayPos);
      const isTowardStudent = worldPos.x > 0.10 && worldPos.z > -0.35 && worldPos.z < 0.50;

      if (distToTray < 0.50 || isTowardStudent) {
        objectToRelease.release(new THREE.Vector3(0.38, 1.102, 0.12), new THREE.Euler(0, -Math.PI / 10, 0));
        events.emit('OBJECT_RELEASED', { id: objectToRelease.id, name: 'Credencial UNAM' });
        return;
      }

      // 3. De lo contrario sobre el mostrador en la ubicación del operador
      const restX = THREE.MathUtils.clamp(worldPos.x, -0.4, 0.9);
      const restZ = THREE.MathUtils.clamp(worldPos.z, -0.4, 0.4);
      objectToRelease.release(new THREE.Vector3(restX, 1.102, restZ));

      events.emit('OBJECT_RELEASED', {
        id: objectToRelease.id,
        name: 'Credencial UNAM'
      });
    } else {
      objectToRelease.release();
      events.emit('OBJECT_RELEASED', { id: objectToRelease.id, name: objectToRelease.id });
    }
  }

  public update(delta: number): void {
    // 0. Reducir cooldown de proximidad NFC
    if (this.nfcSnapCooldown > 0) {
      this.nfcSnapCooldown -= delta;
    }

    // 1. Proximidad NFC continua
    if (this.nfcScanner && this.credential) {
      const credWorldPos = new THREE.Vector3();
      this.credential.group.getWorldPosition(credWorldPos);
      this.nfcScanner.checkProximity(credWorldPos, this.credential.id);
      this.nfcScanner.update(delta);
    }

    // 2. Configurar rayos según el modo (VR o Escritorio)
    const rays: { origin: THREE.Vector3; direction: THREE.Vector3 }[] = [];
    if (this.xrManager.isXRPresenting) {
      rays.push(...this.xrManager.getActiveRaycasters());
    } else {
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
      rays.push({
        origin: this.raycaster.ray.origin,
        direction: this.raycaster.ray.direction
      });
    }

    // 3. Caso: Si YA estamos sosteniendo un objeto
    if (this.heldGrabbable) {
      this.heldGrabbable.update(delta);

      // Rotación con mando derecho en VR (Botón B horario, Botón A anti-horario, o stick)
      const gamepads = this.xrManager.getControllerGamepads();
      if (gamepads.right && gamepads.right.buttons) {
        const btnA = gamepads.right.buttons[4]?.pressed; // Botón A (inferior)
        const btnB = gamepads.right.buttons[5]?.pressed; // Botón B (superior)
        const stickX = Math.abs(gamepads.right.axes?.[2] || 0) > 0.25 ? gamepads.right.axes[2] : 0;
        const rotSpeed = 2.5 * delta;

        if (btnB) {
          this.heldGrabbable.rotateHeld?.(rotSpeed);
        } else if (btnA) {
          this.heldGrabbable.rotateHeld?.(-rotSpeed);
        } else if (stickX !== 0) {
          this.heldGrabbable.rotateHeld?.(stickX * rotSpeed);
        }
      }

      // Acercar / Alejar con mando izquierdo en VR (Botón X acercar, Botón Y alejar)
      if (gamepads.left && gamepads.left.buttons) {
        const btnX = gamepads.left.buttons[4]?.pressed; // Botón X (inferior)
        const btnY = gamepads.left.buttons[5]?.pressed; // Botón Y (superior)
        const distSpeed = 0.45 * delta;

        if (btnX) {
          this.heldGrabbable.adjustDistance?.(distSpeed); // Acercar hacia la vista
        } else if (btnY) {
          this.heldGrabbable.adjustDistance?.(-distSpeed); // Alejar de la vista
        }
      }

      // A) Sosteniendo credencial:
      if (this.heldGrabbable instanceof Credential && this.nfcScanner) {
        let hitNFC = false;
        for (const ray of rays) {
          this.raycaster.set(ray.origin, ray.direction);
          this.raycaster.far = 3.0;
          const hits = this.raycaster.intersectObjects(this.nfcScanner.getPlacementTargets(), true);
          if (hits.length > 0) {
            hitNFC = true;
            break;
          }
        }

        this.isHoveringNFCPlacement = hitNFC;
        if (this.isStudentWaitingCredential) {
          events.emit('OBJECT_HOVER_START', {
            id: 'deliver_student_card',
            prompt: '[Q/R] Rotar | [X/Y] Zoom | [F] Entregar al Alumno | [E] Dejar en Bandeja',
            key: 'F'
          });
        } else if (hitNFC || this.isNearNFCScanner()) {
          events.emit('OBJECT_HOVER_START', {
            id: 'nfc_placement',
            prompt: '[Q/R] Rotar | [X/Y o Rueda] Zoom | [F] Colocar en NFC | [E] Soltar',
            key: 'F'
          });
        } else {
          events.emit('OBJECT_HOVER_START', {
            id: 'holding_card',
            prompt: '[Q/R] Rotar | [X/Y o Rueda] Zoom | [E] Soltar en Mostrador | [F] Lector NFC',
            key: 'E'
          });
        }
        return;
      }

      // B) Sosteniendo Laptop:
      if (this.heldGrabbable instanceof Laptop && this.cart) {
        let targetedBay: number | null = null;
        let hitCartBody = false;

        for (const ray of rays) {
          this.raycaster.set(ray.origin, ray.direction);
          this.raycaster.far = 3.5;

          // Probar hitboxes de bahías
          const bayHits = this.raycaster.intersectObjects(this.cart.getBayHitboxes(), true);
          if (bayHits.length > 0 && bayHits[0].object.userData?.slotIndex) {
            targetedBay = bayHits[0].object.userData.slotIndex;
            hitCartBody = true;
            break;
          }

          // Probar estructura del carro
          const cartHits = this.raycaster.intersectObject(this.cart.group, true);
          if (cartHits.length > 0) {
            hitCartBody = true;
            break;
          }
        }

        this.hoveredBayIndex = targetedBay;
        this.isHoveringCart = hitCartBody;

        if (hitCartBody) {
          const bayLabel = targetedBay ? `Bahía 0${targetedBay}` : 'Bahía del Carro 01';
          events.emit('OBJECT_HOVER_START', {
            id: 'dock_laptop',
            prompt: `[Q/R] Rotar | [X/Y o Rueda] Zoom | [F] Guardar en ${bayLabel} | [E] Entregar`,
            key: 'F'
          });
        } else {
          events.emit('OBJECT_HOVER_START', {
            id: 'holding_laptop',
            prompt: '[Q/R] Rotar | [X/Y o Rueda] Zoom | [E] Entregar en Mostrador | [F] Carro',
            key: 'E'
          });
        }
        return;
      }

      return;
    }

    // 4. Caso: Manos libres (Raycast estándar para interactuar)
    let hitScreen = false;
    let hitDoor = false;
    let detectedBayIndex: number | null = null;
    let detectedGrabbable: IGrabbable | null = null;

    for (const ray of rays) {
      this.raycaster.set(ray.origin, ray.direction);
      this.raycaster.far = 3.5;

      // A. Detección de Objetos Agarrables con prioridad (Laptops o Credencial)
      for (const grabbable of this.grabbables) {
        const hits = this.raycaster.intersectObjects(grabbable.getRaycastTargets(), true);
        if (hits.length > 0) {
          detectedGrabbable = grabbable;
          break;
        }
      }
      if (detectedGrabbable) break;

      // B. Detección de Bahías del Carro 01
      if (this.cart) {
        const bayHits = this.raycaster.intersectObjects(this.cart.getBayHitboxes(), true);
        if (bayHits.length > 0 && bayHits[0].object.userData?.slotIndex) {
          detectedBayIndex = bayHits[0].object.userData.slotIndex;
          break;
        }
      }

      // C. Detección de la Pantalla de la Computadora
      if (this.computer) {
        const screenHits = this.raycaster.intersectObject(this.computer.screenMesh, false);
        if (screenHits.length > 0 && screenHits[0].uv) {
          hitScreen = true;
          this.lastScreenUV = screenHits[0].uv;
          this.computer.screenUI.handlePointerMove(screenHits[0].uv.x, screenHits[0].uv.y);
          break;
        }
      }

      // D. Detección de la Puerta / Manija del Carro
      if (this.cart) {
        const doorHits = this.raycaster.intersectObjects([this.cart.doorHandle, this.cart.doorHinge], true);
        if (doorHits.length > 0) {
          hitDoor = true;
          break;
        }
      }
    }

    this.hoveredBayIndex = detectedBayIndex;

    // Actualizar estado de pantalla
    if (hitScreen !== this.isHoveringScreen) {
      this.isHoveringScreen = hitScreen;
      if (this.isHoveringScreen) {
        events.emit('OBJECT_HOVER_START', { id: 'computer_screen', prompt: 'Interactuar con Pantalla PC PUMA', key: 'E' });
      } else {
        events.emit('OBJECT_HOVER_END', 'computer_screen');
      }
    }

    // Actualizar estado de puerta del carro
    if (hitDoor !== this.isHoveringCartDoor) {
      this.isHoveringCartDoor = hitDoor;
      if (this.isHoveringCartDoor && this.cart) {
        const actionLabel = this.cart.isDoorOpen ? 'Cerrar Carro 01' : 'Abrir Carro 01';
        events.emit('OBJECT_HOVER_START', { id: 'cart_door', prompt: actionLabel, key: 'E' });
      } else {
        events.emit('OBJECT_HOVER_END', 'cart_door');
      }
    }

    // Actualizar estado de bahía apuntada (si no se apuntó directamente a la malla de la laptop)
    if (detectedBayIndex && !detectedGrabbable && this.cart) {
      const isOccupied = this.cart.isSlotOccupied(detectedBayIndex);
      if (isOccupied) {
        events.emit('OBJECT_HOVER_START', {
          id: `bay_${detectedBayIndex}`,
          prompt: `[E] o [F] Tomar Laptop 0${detectedBayIndex}`,
          key: 'E'
        });
        return;
      }
    }

    // Actualizar estado de objetos agarrables
    if (detectedGrabbable !== this.hoveredGrabbable) {
      if (this.hoveredGrabbable) {
        this.hoveredGrabbable.setHover(false);
        events.emit('OBJECT_HOVER_END', this.hoveredGrabbable.id);
      }

      this.hoveredGrabbable = detectedGrabbable;

      if (this.hoveredGrabbable) {
        this.hoveredGrabbable.setHover(true);
        let promptText = 'Tomar Objeto';
        let keyBadge = 'E';

        if (this.hoveredGrabbable instanceof Laptop) {
          promptText = `[E] Tomar ${this.hoveredGrabbable.tag}  |  [F] Extraer rápido`;
          keyBadge = 'E';
        } else if (this.hoveredGrabbable instanceof Credential) {
          promptText = 'Tomar Credencial UNAM';
          keyBadge = 'E';
        }

        events.emit('OBJECT_HOVER_START', {
          id: this.hoveredGrabbable.id,
          prompt: promptText,
          key: keyBadge
        });
      }
    }
  }
}
