import * as THREE from 'three';

export interface IGrabbable {
  readonly id: string;
  readonly group: THREE.Group;
  getRaycastTargets(): THREE.Object3D[];
  setHover(hovered: boolean): void;
  grab(holder: THREE.Object3D): void;
  release(dropPosition?: THREE.Vector3, dropRotation?: THREE.Euler): void;
  isGrabbed(): boolean;
  update(delta: number): void;
  rotateHeld?(deltaAngle: number): void;
  adjustDistance?(deltaDistance: number): void;
}

export interface LaptopConfig {
  id: string;
  slotIndex: number;
  tag: string;
  initialPosition: THREE.Vector3;
  initialRotation?: THREE.Euler;
  isMaintenance?: boolean;
  startsClosed?: boolean;
}

export class Laptop implements IGrabbable {
  public readonly id: string;
  public readonly slotIndex: number;
  public readonly tag: string;
  public readonly isMaintenance: boolean;
  public readonly group: THREE.Group;
  
  private baseMesh!: THREE.Mesh;
  private lidGroup!: THREE.Group;
  private materialsToHighlight: THREE.MeshStandardMaterial[] = [];
  private screenCanvas!: HTMLCanvasElement;
  private screenTex!: THREE.CanvasTexture;
  private screenMat!: THREE.MeshStandardMaterial;
  
  private _isGrabbed: boolean = false;
  private isClosed: boolean = false;

  // Offset relativo cuando está en la mano / vista
  private holdOffset = new THREE.Vector3(0, -0.12, -0.45);
  private holdRotation = new THREE.Euler(0.15, 0, 0);

  constructor(config: LaptopConfig) {
    this.id = config.id;
    this.slotIndex = config.slotIndex;
    this.tag = config.tag;
    this.isMaintenance = !!config.isMaintenance;
    this.isClosed = !!config.startsClosed;

    this.group = new THREE.Group();
    this.group.name = `Laptop_${this.tag}`;

    this.buildLaptopGeometry();
    
    // Posicionar
    this.group.position.copy(config.initialPosition);
    if (config.initialRotation) {
      this.group.rotation.copy(config.initialRotation);
    }
  }

  private buildLaptopGeometry(): void {
    const width = 0.32;
    const depth = 0.22;
    const thickness = 0.016;

    // Color del chasis: oscuro/aluminio institucional
    const chassisMat = new THREE.MeshStandardMaterial({
      color: this.isMaintenance ? 0x3b3f46 : 0x475569,
      roughness: 0.35,
      metalness: 0.8
    });
    this.materialsToHighlight.push(chassisMat);

    // 1. BASE DE LA LAPTOP
    const baseGeo = new THREE.BoxGeometry(width, thickness, depth);
    this.baseMesh = new THREE.Mesh(baseGeo, chassisMat);
    this.baseMesh.position.y = thickness / 2;
    this.baseMesh.castShadow = true;
    this.baseMesh.receiveShadow = true;
    this.group.add(this.baseMesh);

    // Teclado integrado
    const keyboardMat = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.7
    });
    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.88, 0.002, depth * 0.48),
      keyboardMat
    );
    keyboard.position.set(0, thickness + 0.001, -depth * 0.08);
    this.group.add(keyboard);

    // Touchpad
    const trackpad = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.32, 0.001, depth * 0.28),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
    );
    trackpad.position.set(0, thickness + 0.001, depth * 0.28);
    this.group.add(trackpad);

    // Etiqueta de inventario institucional PC PUMA
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 256;
    tagCanvas.height = 64;
    const tagCtx = tagCanvas.getContext('2d')!;
    tagCtx.fillStyle = this.isMaintenance ? '#DC2626' : '#D59F0F';
    tagCtx.fillRect(0, 0, 256, 64);
    tagCtx.fillStyle = this.isMaintenance ? '#FFFFFF' : '#002B49';
    tagCtx.font = 'bold 22px monospace';
    tagCtx.textAlign = 'center';
    tagCtx.fillText(this.isMaintenance ? `${this.tag} [FALLA]` : this.tag, 128, 40);

    const tagTex = new THREE.CanvasTexture(tagCanvas);
    const tagMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.02),
      new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.5 })
    );
    tagMesh.rotation.x = -Math.PI / 2;
    tagMesh.position.set(width * 0.34, thickness + 0.0015, depth * 0.32);
    this.group.add(tagMesh);

    // 2. BISAGRA Y PANTALLA ABATIBLE
    this.lidGroup = new THREE.Group();
    this.lidGroup.position.set(0, thickness, -depth / 2);

    // Tapa
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.8
    });
    this.materialsToHighlight.push(lidMat);

    const lidMesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, depth, 0.008),
      lidMat
    );
    lidMesh.position.set(0, depth / 2, 0);
    lidMesh.castShadow = true;
    this.lidGroup.add(lidMesh);

    // Pantalla activa (display interior)
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 512;
    this.screenCanvas.height = 320;
    this.drawNormalScreen();

    this.screenTex = new THREE.CanvasTexture(this.screenCanvas);
    this.screenMat = new THREE.MeshStandardMaterial({
      map: this.screenTex,
      emissive: this.isMaintenance ? 0x7f1d1d : 0x1e3a8a,
      emissiveIntensity: 0.45,
      roughness: 0.2
    });

    // Carga asistida de fondo de pantalla personalizado
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      'textures/laptop_wallpaper.png',
      (wallpaperTex) => {
        this.screenMat.map = wallpaperTex;
        this.screenMat.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.92, depth * 0.86),
      this.screenMat
    );
    screenMesh.position.set(0, depth / 2, 0.005);
    this.lidGroup.add(screenMesh);

    // Sticker / Logo institucional en el exterior de la tapa (visible cuando está cerrada o desde atrás)
    const lidLogoMat = new THREE.MeshStandardMaterial({
      transparent: true,
      roughness: 0.35,
      metalness: 0.2
    });
    texLoader.load(
      'textures/laptop_lid_logo.png',
      (lidTex) => {
        lidLogoMat.map = lidTex;
        lidLogoMat.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback al logo principal PC PUMA
        texLoader.load('pc_puma_logo.png', (pumaTex) => {
          lidLogoMat.map = pumaTex;
          lidLogoMat.needsUpdate = true;
        });
      }
    );
    const lidLogoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.06),
      lidLogoMat
    );
    lidLogoMesh.position.set(0, depth / 2, -0.005);
    lidLogoMesh.rotation.y = Math.PI;
    this.lidGroup.add(lidLogoMesh);

    // Ajustar ángulo de apertura inicial
    if (this.isClosed) {
      this.lidGroup.rotation.x = 0; // Cerrada para entrar en la ranura
    } else {
      this.lidGroup.rotation.x = THREE.MathUtils.degToRad(65); // Abierta a 115°
    }

    this.group.add(this.lidGroup);

    // Habilitar sombras
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  public setOpen(open: boolean): void {
    this.isClosed = !open;
    const targetAngle = open ? THREE.MathUtils.degToRad(65) : 0;
    this.lidGroup.rotation.x = targetAngle;
  }

  public getRaycastTargets(): THREE.Object3D[] {
    return [this.baseMesh, this.lidGroup];
  }

  public setHover(hovered: boolean): void {
    const emissiveColor = hovered ? 0xD59F0F : 0x000000;
    const emissiveIntensity = hovered ? 0.35 : 0.0;

    for (const mat of this.materialsToHighlight) {
      mat.emissive.setHex(emissiveColor);
      mat.emissiveIntensity = emissiveIntensity;
    }
  }

  public grab(holder: THREE.Object3D): void {
    if (this._isGrabbed) return;

    this._isGrabbed = true;
    this.setHover(false);

    // Abrir automáticamente la pantalla para que el jugador la examine
    this.setOpen(true);

    holder.add(this.group);
    const isCamera = holder instanceof THREE.Camera;
    if (isCamera) {
      this.group.position.copy(this.holdOffset);
      this.group.rotation.copy(this.holdRotation);
    } else {
      // Posición ergonómica natural sobre el mando VR
      this.group.position.set(0, 0.02, -0.22);
      this.group.rotation.set(0.1, 0, 0);
    }
  }

  public rotateHeld(deltaAngle: number): void {
    if (!this._isGrabbed) return;
    this.group.rotation.y += deltaAngle;
  }

  public adjustDistance(deltaDistance: number): void {
    if (!this._isGrabbed) return;
    const isCamera = this.group.parent instanceof THREE.Camera;
    const minZ = isCamera ? -0.85 : -0.55;
    const maxZ = isCamera ? -0.22 : -0.08;
    this.group.position.z = THREE.MathUtils.clamp(this.group.position.z + deltaDistance, minZ, maxZ);
  }

  public release(dropPosition?: THREE.Vector3, dropRotation?: THREE.Euler): void {
    if (!this._isGrabbed) return;

    this._isGrabbed = false;

    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    this.group.getWorldPosition(worldPos);
    this.group.getWorldQuaternion(worldQuat);

    if (dropPosition) {
      this.group.position.copy(dropPosition);
    } else {
      const restY = worldPos.y > 0.9 ? 1.075 : 0.02;
      this.group.position.set(worldPos.x, restY, worldPos.z);
    }

    if (dropRotation) {
      this.group.rotation.copy(dropRotation);
    } else {
      const euler = new THREE.Euler().setFromQuaternion(worldQuat, 'YXZ');
      this.group.rotation.set(0, euler.y, 0);
    }
  }

  public isGrabbed(): boolean {
    return this._isGrabbed;
  }

  public update(_delta: number): void {}

  private drawNormalScreen(): void {
    const sCtx = this.screenCanvas.getContext('2d')!;
    if (this.isMaintenance) {
      sCtx.fillStyle = '#450a0a';
      sCtx.fillRect(0, 0, 512, 320);
      sCtx.fillStyle = '#EF4444';
      sCtx.font = 'bold 30px sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText('EN MANTENIMIENTO', 256, 120);
      sCtx.fillStyle = '#FFFFFF';
      sCtx.font = '18px monospace';
      sCtx.fillText('Falla reportada en bisagra', 256, 170);
      sCtx.fillText(`ID: ${this.tag}`, 256, 210);
    } else {
      sCtx.fillStyle = '#002B49';
      sCtx.fillRect(0, 0, 512, 320);
      sCtx.fillStyle = '#D59F0F';
      sCtx.font = 'bold 28px sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText('PC PUMA OS', 256, 120);
      sCtx.fillStyle = '#FFFFFF';
      sCtx.font = '20px sans-serif';
      sCtx.fillText(`${this.tag} • DISPONIBLE`, 256, 165);
      sCtx.fillStyle = '#38BDF8';
      sCtx.font = '16px monospace';
      sCtx.fillText('Batería: 100% | Red UNAM OK', 256, 220);
    }
  }

  public setVisualDefect(hasDefect: boolean, defectText: string = 'FISURA EN PANEL LCD'): void {
    const sCtx = this.screenCanvas.getContext('2d')!;
    if (hasDefect) {
      sCtx.fillStyle = '#0f172a';
      sCtx.fillRect(0, 0, 512, 320);

      // Líneas estilizadas de fractura / fisura en el cristal
      sCtx.strokeStyle = '#EF4444';
      sCtx.lineWidth = 4;
      sCtx.beginPath();
      sCtx.moveTo(80, 40);
      sCtx.lineTo(210, 150);
      sCtx.lineTo(170, 190);
      sCtx.lineTo(320, 280);
      sCtx.moveTo(210, 150);
      sCtx.lineTo(310, 120);
      sCtx.lineTo(440, 170);
      sCtx.stroke();

      // Grietas secundarias
      sCtx.strokeStyle = '#FCA5A5';
      sCtx.lineWidth = 2;
      sCtx.beginPath();
      sCtx.moveTo(210, 150);
      sCtx.lineTo(240, 220);
      sCtx.moveTo(310, 120);
      sCtx.lineTo(360, 60);
      sCtx.stroke();

      // Banner de advertencia de daño
      sCtx.fillStyle = '#DC2626';
      sCtx.fillRect(40, 95, 432, 50);
      sCtx.fillStyle = '#FFFFFF';
      sCtx.font = 'bold 22px sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText('⚠ DAÑO FÍSICO DETECTADO', 256, 128);

      sCtx.fillStyle = '#F8FAFC';
      sCtx.font = 'bold 16px monospace';
      sCtx.fillText(defectText, 256, 180);

      sCtx.fillStyle = '#D59F0F';
      sCtx.font = 'bold 14px sans-serif';
      sCtx.fillText('ART. 24 REGLAMENTO PC PUMA • REQUIERE SANCIÓN', 256, 220);

      this.screenMat.emissive.setHex(0x991b1b);
      this.screenMat.emissiveIntensity = 0.7;
    } else {
      this.drawNormalScreen();
      this.screenMat.emissive.setHex(this.isMaintenance ? 0x7f1d1d : 0x1e3a8a);
      this.screenMat.emissiveIntensity = 0.45;
    }
    this.screenTex.needsUpdate = true;
  }
}
