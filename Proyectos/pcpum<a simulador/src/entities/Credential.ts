import * as THREE from 'three';
import { IGrabbable } from './Laptop';

export class Credential implements IGrabbable {
  public readonly id: string = 'credential_juan_perez';
  public readonly group: THREE.Group;
  public readonly cardMesh: THREE.Mesh;
  public readonly hitBox: THREE.Mesh;
  private material: THREE.MeshStandardMaterial;

  private _isGrabbed: boolean = false;
  private frontCanvas: HTMLCanvasElement | null = null;
  private frontTex: THREE.CanvasTexture | null = null;
  private currentStudentName: string = 'JUAN PÉREZ LÓPEZ';
  private currentAccountNumber: string = '32145678';
  private currentCareer: string = 'FACULTAD DE INGENIERÍA';

  // Posición inicial sobre el mostrador (Superficie del mostrador: Y = 1.100m)
  private initialPosition = new THREE.Vector3(0.35, 1.102, 0.12);
  private initialRotation = new THREE.Euler(0, -Math.PI / 10, 0);

  // Offset relativo ergonómico en la mano / vista para lectura nítida
  private holdOffset = new THREE.Vector3(0.12, -0.10, -0.38);
  private holdRotation = new THREE.Euler(0.15, -0.08, 0);

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Credential_UNAM_3D';

    const width = 0.086;
    const height = 0.054;
    const thickness = 0.002;

    // 1. Texturas procedurales en alta definición
    const frontTex = this.createFrontTexture();
    const backTex = this.createBackTexture();

    // 2. Materiales para cada cara de la credencial
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.5 });
    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.35,
      metalness: 0.1
    });
    const backMat = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.4,
      metalness: 0.1
    });

    // Carga automática si el diseñador sube su propia textura a public/textures/
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      'textures/credential_front.png',
      (customTex) => {
        frontMat.map = customTex;
        frontMat.needsUpdate = true;
      },
      undefined,
      () => {} // Fallback silencioso a la textura procedural ya generada
    );

    texLoader.load(
      'textures/credential_back.png',
      (customTex) => {
        backMat.map = customTex;
        backMat.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    this.material = frontMat;
    const materials = [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat];

    // 3. Malla 3D de la tarjeta
    const geo = new THREE.BoxGeometry(width, height, thickness);
    this.cardMesh = new THREE.Mesh(geo, materials);
    this.cardMesh.castShadow = true;
    this.cardMesh.receiveShadow = true;
    // Acostada horizontalmente sobre el mostrador
    this.cardMesh.rotation.x = -Math.PI / 2;
    this.group.add(this.cardMesh);

    // 4. Hitbox de interacción expandida para puntería inmediata (evita pixel-hunting)
    const hitBoxGeo = new THREE.BoxGeometry(0.24, 0.14, 0.20);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
    this.hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    this.hitBox.name = 'Credential_HitBox';
    this.group.add(this.hitBox);

    // 5. Posición inicial reposando limpiamente sobre el mostrador
    this.group.position.copy(this.initialPosition);
    this.group.rotation.copy(this.initialRotation);
  }

  public updateStudentData(name: string, accountNumber: string, career: string): void {
    this.currentStudentName = name.toUpperCase();
    this.currentAccountNumber = accountNumber;
    this.currentCareer = career.toUpperCase();

    if (this.frontCanvas && this.frontTex) {
      this.drawFrontCanvas(this.frontCanvas);
      this.frontTex.needsUpdate = true;
    }
  }

  private drawFrontCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo azul UNAM con degradado
    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#002B49');
    grad.addColorStop(1, '#001A2E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    // Franjas doradas institucionales
    ctx.fillStyle = '#D59F0F';
    ctx.fillRect(0, 0, 512, 45);
    ctx.fillRect(0, 310, 512, 10);

    // Cabecera institucional
    ctx.fillStyle = '#002B49';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UNIVERSIDAD NACIONAL AUTÓNOMA DE MÉXICO', 256, 28);

    // Recuadro de Fotografía
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(25, 65, 120, 150);
    ctx.strokeStyle = '#D59F0F';
    ctx.lineWidth = 4;
    ctx.strokeRect(25, 65, 120, 150);

    // Silueta estilizada de alumno en fotografía
    ctx.fillStyle = '#002B49';
    ctx.beginPath();
    ctx.arc(85, 120, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(85, 185, 45, 30, 0, Math.PI, 0, true);
    ctx.fill();

    // Sello dorado UNAM
    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 36px serif';
    ctx.textAlign = 'center';
    ctx.fillText('UNAM', 85, 270);

    // Datos del Alumno
    ctx.textAlign = 'left';
    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CREDENCIAL DE ALUMNO', 165, 80);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(this.currentStudentName, 165, 115);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px sans-serif';
    ctx.fillText('NO. DE CUENTA:', 165, 145);
    ctx.fillStyle = '#38BDF8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(this.currentAccountNumber, 165, 172);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px sans-serif';
    ctx.fillText('CARRERA:', 165, 202);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(this.currentCareer, 165, 224);

    // Chip NFC dorado
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(430, 75, 45, 35);
    ctx.strokeStyle = '#CA8A04';
    ctx.lineWidth = 2;
    ctx.strokeRect(430, 75, 45, 35);

    ctx.fillStyle = '#002B49';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('((•))', 452, 98);
  }

  private createFrontTexture(): THREE.CanvasTexture {
    this.frontCanvas = document.createElement('canvas');
    this.frontCanvas.width = 512;
    this.frontCanvas.height = 320;
    this.drawFrontCanvas(this.frontCanvas);

    this.frontTex = new THREE.CanvasTexture(this.frontCanvas);
    return this.frontTex;
  }

  private createBackTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, 512, 320);

    // Banda Magnética
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 30, 512, 60);

    // Código de Barras
    ctx.fillStyle = '#0F172A';
    const startX = 60;
    const barY = 130;
    for (let x = startX; x < 450; x += 6) {
      const isThick = (x * 7) % 5 === 0;
      ctx.fillRect(x, barY, isThick ? 4 : 2, 60);
    }

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('* 3 2 1 4 5 6 7 8 *', 256, 210);

    ctx.font = '10px sans-serif';
    ctx.fillText('Esta credencial es intransferible y acredita como alumno regular.', 256, 260);
    ctx.fillText('Servicio de Préstamo PC PUMA • UNAM', 256, 280);

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true;
    return tex;
  }

  public getRaycastTargets(): THREE.Object3D[] {
    return [this.hitBox, this.cardMesh];
  }

  public setHover(hovered: boolean): void {
    const emissiveColor = hovered ? 0xD59F0F : 0x000000;
    const emissiveIntensity = hovered ? 0.6 : 0.0;
    this.material.emissive.setHex(emissiveColor);
    this.material.emissiveIntensity = emissiveIntensity;
  }

  public grab(holder: THREE.Object3D): void {
    if (this._isGrabbed) return;

    this._isGrabbed = true;
    this.setHover(false);

    // Cuando se toma en la mano, se orienta verticalmente de frente para ver los datos
    this.cardMesh.rotation.x = 0;

    holder.add(this.group);
    const isCamera = holder instanceof THREE.Camera;
    if (isCamera) {
      this.group.position.copy(this.holdOffset);
      this.group.rotation.copy(this.holdRotation);
    } else {
      // Posición ergonómica natural en la mano del mando VR
      this.group.position.set(0, 0.03, -0.12);
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
    const minZ = isCamera ? -0.80 : -0.45;
    const maxZ = isCamera ? -0.16 : -0.04;
    this.group.position.z = THREE.MathUtils.clamp(this.group.position.z + deltaDistance, minZ, maxZ);
  }

  public release(dropPosition?: THREE.Vector3, dropRotation?: THREE.Euler): void {
    if (!this._isGrabbed) return;

    this._isGrabbed = false;

    // Al soltarla, vuelve a reposar plana
    this.cardMesh.rotation.x = -Math.PI / 2;

    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    this.group.getWorldPosition(worldPos);
    this.group.getWorldQuaternion(worldQuat);

    if (dropPosition) {
      this.group.position.copy(dropPosition);
    } else {
      // Reposo sobre mostrador a 1.102m o sobre el piso
      const restY = worldPos.y > 0.9 ? 1.102 : 0.005;
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
}
