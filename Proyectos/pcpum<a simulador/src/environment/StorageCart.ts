import * as THREE from 'three';
import { events } from '../core/EventBus';

export type SlotLedState = 'empty' | 'charging' | 'full' | 'maintenance';

export class StorageCart {
  public readonly group: THREE.Group;
  
  // Puerta interactiva
  public readonly doorHinge: THREE.Group;
  public readonly doorHandle: THREE.Mesh;
  public isDoorOpen: boolean = false;
  private targetDoorAngle: number = 0;
  private currentDoorAngle: number = 0;

  // LEDs de cada slot
  private slotLeds: THREE.Mesh[] = [];

  // Hitboxes para detección directa de bahías con raycast
  private bayHitboxes: THREE.Mesh[] = [];

  // Posiciones relativas de los 5 slots dentro del carro
  private readonly slotLocalPositions: THREE.Vector3[] = [];

  // Ocupación de slots (almacena el id de la laptop o null)
  private occupiedSlots: Map<number, string | null> = new Map();

  // Dimensiones ampliadas (+35% ancho, +22% alto, +24% profundidad)
  public readonly cartWidth: number = 0.88;
  public readonly cartHeight: number = 1.28;
  public readonly cartDepth: number = 0.68;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'StorageCart_01';

    // 1. Chasis y estructura del carro móvil ampliado
    this.buildCartBody();

    // 2. Bahías interiores y repisas espaciosas (5 slots)
    this.buildSlots();

    // 3. Puerta batiente frontal transparente con manija ergonómica interactiva
    const { hinge, handle } = this.buildFrontDoor();
    this.doorHinge = hinge;
    this.doorHandle = handle;

    // 4. Ubicar el carro en su estación demarcada retirado del escritorio
    this.group.position.set(-1.85, 0, -1.65);
    this.group.rotation.y = Math.PI / 2; // Con el frente mirando hacia el pasillo del operador (+X)

    // Inicializar estado de ocupación por defecto (Slot 1 vacío; 2, 3, 4, 5 ocupados)
    this.occupiedSlots.set(1, null);
    this.occupiedSlots.set(2, 'laptop_02');
    this.occupiedSlots.set(3, 'laptop_03');
    this.occupiedSlots.set(4, 'laptop_04');
    this.occupiedSlots.set(5, 'laptop_05');
  }

  private buildCartBody(): void {
    const width = this.cartWidth;
    const height = this.cartHeight;
    const depth = this.cartDepth;

    // Cuerpo principal azul institucional UNAM
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x001E33,
      roughness: 0.4,
      metalness: 0.5
    });

    // Techo superior
    const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, depth), bodyMat);
    top.position.y = height;
    top.castShadow = true;
    this.group.add(top);

    // Letrero institucional superior
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext('2d')!;
    ctx.fillStyle = '#002B49';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CARRO 01 • RESGUARDO', 256, 52);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('PC PUMA TECNOLOGÍA UNAM', 256, 92);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.85, 0.13),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 })
    );
    sign.position.set(0, height + 0.085, depth / 2 + 0.002);
    this.group.add(sign);

    // Base inferior del chasis
    const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, depth), bodyMat);
    base.position.y = 0.14;
    base.castShadow = true;
    this.group.add(base);

    // Pared trasera (fondo)
    const back = new THREE.Mesh(new THREE.BoxGeometry(width, height - 0.14, 0.03), bodyMat);
    back.position.set(0, (height + 0.14) / 2, -depth / 2 + 0.015);
    back.castShadow = true;
    this.group.add(back);

    // Pared izquierda
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.03, height - 0.14, depth), bodyMat);
    leftWall.position.set(-width / 2 + 0.015, (height + 0.14) / 2, 0);
    leftWall.castShadow = true;
    this.group.add(leftWall);

    // Pared derecha
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.03, height - 0.14, depth), bodyMat);
    rightWall.position.set(width / 2 - 0.015, (height + 0.14) / 2, 0);
    rightWall.castShadow = true;
    this.group.add(rightWall);

    // 4 Ruedas de goma industriales giratorias
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.8 });
    const wheelPositions = [
      [-width / 2 + 0.10, -depth / 2 + 0.10],
      [width / 2 - 0.10, -depth / 2 + 0.10],
      [-width / 2 + 0.10, depth / 2 - 0.10],
      [width / 2 - 0.10, depth / 2 - 0.10]
    ];

    wheelPositions.forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 16), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.06, wz);
      wheel.castShadow = true;
      this.group.add(wheel);
    });

    // Sombra de contacto / Ambient Occlusion suave bajo el carro móvil
    const cartShadowGeo = new THREE.PlaneGeometry(width + 0.25, depth + 0.25);
    const cartShadowCanvas = document.createElement('canvas');
    cartShadowCanvas.width = 128;
    cartShadowCanvas.height = 128;
    const csCtx = cartShadowCanvas.getContext('2d')!;
    const cGrad = csCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
    cGrad.addColorStop(0, 'rgba(15, 23, 42, 0.65)');
    cGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.25)');
    cGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    csCtx.fillStyle = cGrad;
    csCtx.fillRect(0, 0, 128, 128);
    const cartShadowTex = new THREE.CanvasTexture(cartShadowCanvas);
    const cartShadow = new THREE.Mesh(
      cartShadowGeo,
      new THREE.MeshBasicMaterial({ map: cartShadowTex, transparent: true, depthWrite: false })
    );
    cartShadow.rotation.x = -Math.PI / 2;
    cartShadow.position.set(0, 0.002, 0);
    this.group.add(cartShadow);

    // Manillar de empuje metálico ergonómico dorado
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xD59F0F, metalness: 0.8, roughness: 0.3 });
    const pushBar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, width * 0.75), handleMat);
    pushBar.rotation.z = Math.PI / 2;
    pushBar.position.set(0, height - 0.06, -depth / 2 - 0.07);
    this.group.add(pushBar);
  }

  private buildSlots(): void {
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.5,
      roughness: 0.5
    });

    // 5 Compartimentos amplios y cómodos
    const slotCount = 5;
    const startY = 0.28;
    const shelfSpacing = 0.19;

    for (let i = 0; i < slotCount; i++) {
      const y = startY + (i * shelfSpacing);

      // Repisa amplia (0.80m de ancho x 0.60m de profundidad)
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.015, 0.60), shelfMat);
      shelf.position.set(0, y, 0);
      shelf.receiveShadow = true;
      this.group.add(shelf);

      // Guías de acoplamiento laterales sutiles para laptops
      const railMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
      const railLeft = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.35), railMat);
      railLeft.position.set(-0.20, y + 0.01, 0.02);
      this.group.add(railLeft);

      const railRight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 0.35), railMat);
      railRight.position.set(0.20, y + 0.01, 0.02);
      this.group.add(railRight);

      // Posición de reposo de la laptop en esta ranura
      this.slotLocalPositions.push(new THREE.Vector3(0, y + 0.015, 0.02));

      // Hitbox invisible de interacción para raycast directo a la bahía
      const hitboxGeo = new THREE.BoxGeometry(0.78, 0.17, 0.58);
      const hitboxMat = new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 });
      const bayHitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
      bayHitbox.position.set(0, y + 0.09, 0.02);
      bayHitbox.userData = { isBayHitbox: true, slotIndex: i + 1 };
      this.group.add(bayHitbox);
      this.bayHitboxes.push(bayHitbox);

      // Rótulo del número de bahía (BAHÍA 01 a 05) en placa dorada
      const numCanvas = document.createElement('canvas');
      numCanvas.width = 160;
      numCanvas.height = 80;
      const ctx = numCanvas.getContext('2d')!;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, 160, 80);
      ctx.strokeStyle = '#D59F0F';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 152, 72);
      ctx.fillStyle = '#D59F0F';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`0${i + 1}`, 80, 52);

      const numTex = new THREE.CanvasTexture(numCanvas);
      const numMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.09, 0.045),
        new THREE.MeshStandardMaterial({ map: numTex, roughness: 0.3 })
      );
      numMesh.position.set(-0.32, y + 0.05, this.cartDepth / 2 - 0.035);
      this.group.add(numMesh);

      // LED indicador de carga ampliado
      let ledColor = 0x10B981;
      let ledEmissive = 0x10B981;
      let emissiveIntensity = 0.9;
      if (i === 0) {
        // Slot 1 vacío inicialmente
        ledColor = 0x334155;
        ledEmissive = 0x000000;
        emissiveIntensity = 0.0;
      } else if (i === 2) {
        // Slot 3 en mantenimiento
        ledColor = 0xF59E0B;
        ledEmissive = 0xF59E0B;
      }

      const ledMat = new THREE.MeshStandardMaterial({
        color: ledColor,
        emissive: ledEmissive,
        emissiveIntensity: emissiveIntensity
      });
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 16), ledMat);
      led.position.set(-0.23, y + 0.05, this.cartDepth / 2 - 0.035);
      this.group.add(led);
      this.slotLeds.push(led);
    }
  }

  private buildFrontDoor() {
    const hinge = new THREE.Group();
    // Pivote de la bisagra en el marco izquierdo frontal
    hinge.position.set(-this.cartWidth / 2 + 0.015, (this.cartHeight + 0.14) / 2, this.cartDepth / 2);
    this.group.add(hinge);

    // Puerta acrílica ahumada ampliada
    const doorWidth = this.cartWidth - 0.04; // 0.84m
    const doorHeight = this.cartHeight - 0.18; // 1.10m

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.55
    });

    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, doorHeight, 0.014),
      doorMat
    );
    // Trasladar la mitad del ancho para que rote desde la bisagra izquierda
    doorPanel.position.set(doorWidth / 2, 0, 0);
    doorPanel.castShadow = true;
    hinge.add(doorPanel);

    // Manija ergonómica dorada más grande y fácil de presionar
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xD59F0F,
      roughness: 0.2,
      metalness: 0.8
    });
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.24, 0.05),
      handleMat
    );
    handle.position.set(doorWidth - 0.05, 0, 0.035);
    handle.name = 'CartDoor_Handle';
    hinge.add(handle);

    return { hinge, handle };
  }

  public openDoor(): void {
    if (!this.isDoorOpen) {
      this.isDoorOpen = true;
      this.targetDoorAngle = -THREE.MathUtils.degToRad(110);
      events.emit('CART_DOOR_TOGGLED', true);
    }
  }

  public closeDoor(): void {
    if (this.isDoorOpen) {
      this.isDoorOpen = false;
      this.targetDoorAngle = 0;
      events.emit('CART_DOOR_TOGGLED', false);
    }
  }

  public toggleDoor(): void {
    if (this.isDoorOpen) {
      this.closeDoor();
    } else {
      this.openDoor();
    }
  }

  public getSlotWorldPosition(slotIndex: number): THREE.Vector3 {
    const local = this.slotLocalPositions[slotIndex - 1] || this.slotLocalPositions[0];
    const worldPos = local.clone();
    this.group.localToWorld(worldPos);
    return worldPos;
  }

  public getWorldEuler(): THREE.Euler {
    return new THREE.Euler(0, this.group.rotation.y, 0);
  }

  public getBayHitboxes(): THREE.Mesh[] {
    return this.bayHitboxes;
  }

  public setSlotOccupied(slotIndex: number, laptopId: string | null): void {
    this.occupiedSlots.set(slotIndex, laptopId);
    if (laptopId) {
      if (laptopId.includes('03')) {
        this.setSlotLed(slotIndex, 'maintenance');
      } else {
        this.setSlotLed(slotIndex, 'charging');
      }
    } else {
      this.setSlotLed(slotIndex, 'empty');
    }
  }

  public isSlotOccupied(slotIndex: number): boolean {
    return !!this.occupiedSlots.get(slotIndex);
  }

  public getFirstAvailableSlot(): number {
    for (let i = 1; i <= 5; i++) {
      if (!this.isSlotOccupied(i)) {
        return i;
      }
    }
    return 1;
  }

  public setSlotLed(slotIndex: number, state: SlotLedState): void {
    const led = this.slotLeds[slotIndex - 1];
    if (!led) return;
    const mat = led.material as THREE.MeshStandardMaterial;
    if (state === 'charging' || state === 'full') {
      mat.color.setHex(0x10B981);
      mat.emissive.setHex(0x10B981);
      mat.emissiveIntensity = 0.9;
    } else if (state === 'maintenance') {
      mat.color.setHex(0xF59E0B);
      mat.emissive.setHex(0xF59E0B);
      mat.emissiveIntensity = 0.9;
    } else {
      mat.color.setHex(0x334155);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0.0;
    }
  }

  public findNearestSlot(worldPos: THREE.Vector3, maxDistance = 1.2): { slotIndex: number; position: THREE.Vector3 } | null {
    let bestSlot = -1;
    let minDistance = Infinity;

    for (let i = 1; i <= 5; i++) {
      const slotPos = this.getSlotWorldPosition(i);
      const d = worldPos.distanceTo(slotPos);
      if (d < minDistance && d <= maxDistance) {
        minDistance = d;
        bestSlot = i;
      }
    }

    if (bestSlot !== -1) {
      return {
        slotIndex: bestSlot,
        position: this.getSlotWorldPosition(bestSlot)
      };
    }
    return null;
  }

  public update(delta: number): void {
    // Animación suave de apertura y cierre de la puerta
    const speed = 7.0;
    this.currentDoorAngle = THREE.MathUtils.lerp(
      this.currentDoorAngle,
      this.targetDoorAngle,
      delta * speed
    );
    this.doorHinge.rotation.y = this.currentDoorAngle;
  }
}
