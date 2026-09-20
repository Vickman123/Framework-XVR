import * as THREE from 'three';
import { events } from '../core/EventBus';
import { Credential } from './Credential';

export class NFCScanner {
  public readonly group: THREE.Group;
  public readonly targetPad: THREE.Mesh;
  public readonly statusLed: THREE.Mesh;
  public readonly scannerLight: THREE.PointLight;
  public readonly placementHitBox: THREE.Mesh;

  private ledMat: THREE.MeshStandardMaterial;
  private padMat: THREE.MeshStandardMaterial;

  // Estado del lector
  private isScanning: boolean = false;
  private scanCooldown: number = 0;
  private lastScannedId: string | null = null;
  private hasScannedCurrentPlacement: boolean = false;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'NFC_Scanner_Device';

    // 1. Base del lector sobre el mostrador (16cm x 16cm x 2.5cm)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.35,
      metalness: 0.7
    });

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.025, 0.16),
      baseMat
    );
    base.position.y = 0.0125;
    base.castShadow = true;
    base.receiveShadow = true;
    this.group.add(base);

    // Bisel decorativo dorado UNAM
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(0.165, 0.006, 0.165),
      new THREE.MeshStandardMaterial({ color: 0xD59F0F, metalness: 0.8, roughness: 0.3 })
    );
    trim.position.y = 0.018;
    this.group.add(trim);

    // 2. Diana / Superficie táctil de lectura NFC
    const padCanvas = document.createElement('canvas');
    padCanvas.width = 256;
    padCanvas.height = 256;
    const ctx = padCanvas.getContext('2d')!;

    ctx.fillStyle = '#002B49';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#D59F0F';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(128, 128, 90, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NFC', 128, 115);
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('((•))', 128, 175);

    const padTex = new THREE.CanvasTexture(padCanvas);
    this.padMat = new THREE.MeshStandardMaterial({
      map: padTex,
      roughness: 0.4,
      emissive: 0x00B4D8,
      emissiveIntensity: 0.25
    });

    // Carga asistida de diana NFC personalizada
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      'textures/nfc_pad.png',
      (customPadTex) => {
        this.padMat.map = customPadTex;
        this.padMat.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    this.targetPad = new THREE.Mesh(
      new THREE.PlaneGeometry(0.13, 0.13),
      this.padMat
    );
    this.targetPad.rotation.x = -Math.PI / 2;
    this.targetPad.position.y = 0.026;
    this.targetPad.receiveShadow = true;
    this.group.add(this.targetPad);

    // 3. LED RGB de estado
    this.ledMat = new THREE.MeshStandardMaterial({
      color: 0x00B4D8,
      emissive: 0x00B4D8,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });

    this.statusLed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.005, 16),
      this.ledMat
    );
    this.statusLed.position.set(0, 0.027, 0.065);
    this.group.add(this.statusLed);

    // Luz ambiental puntual emitida por el lector
    this.scannerLight = new THREE.PointLight(0x00B4D8, 1.0, 0.8);
    this.scannerLight.position.set(0, 0.08, 0);
    this.group.add(this.scannerLight);

    // 4. Hitbox generosa para colocación de credencial
    const hitBoxGeo = new THREE.BoxGeometry(0.32, 0.25, 0.32);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
    this.placementHitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    this.placementHitBox.position.set(0, 0.10, 0);
    this.placementHitBox.name = 'NFC_Placement_HitBox';
    this.group.add(this.placementHitBox);

    // 5. Ubicación física sobre el mostrador: más cerca del operador (Z: -0.20m, Superficie a 1.100m)
    this.group.position.set(0.10, 1.100, -0.20);
  }

  public getPlacementTargets(): THREE.Object3D[] {
    return [this.placementHitBox, this.targetPad, this.group];
  }

  public checkProximity(credentialPos: THREE.Vector3, credentialId: string): boolean {
    const scannerWorldPos = new THREE.Vector3();
    this.group.getWorldPosition(scannerWorldPos);

    const dist = scannerWorldPos.distanceTo(credentialPos);

    // Detección cuando la tarjeta está sobre el sensor (<= 20 cm)
    if (dist <= 0.20) {
      if (!this.hasScannedCurrentPlacement && this.scanCooldown <= 0) {
        this.hasScannedCurrentPlacement = true;
        this.triggerScan(credentialId);
        return true;
      }
    } else if (dist > 0.32) {
      // Cuando la credencial se aleja físicamente, habilitar el siguiente escaneo
      this.hasScannedCurrentPlacement = false;
    }

    return false;
  }

  public snapCredential(credential: Credential): void {
    const scannerWorldPos = new THREE.Vector3();
    this.group.getWorldPosition(scannerWorldPos);

    // Posar plana exactamente sobre la diana
    const dropPos = new THREE.Vector3(scannerWorldPos.x, 1.127, scannerWorldPos.z);
    const dropRot = new THREE.Euler(0, 0, 0);
    credential.release(dropPos, dropRot);

    this.hasScannedCurrentPlacement = true;
    this.triggerScan(credential.id);
  }

  public triggerScan(credentialId: string): void {
    if (this.scanCooldown > 0 && this.lastScannedId === credentialId) return;

    this.isScanning = true;
    this.scanCooldown = 2.5; // Tiempo de enfriamiento
    this.lastScannedId = credentialId;

    // Cambiar LED a verde brillante de lectura exitosa
    this.ledMat.color.setHex(0x10B981);
    this.ledMat.emissive.setHex(0x10B981);
    this.ledMat.emissiveIntensity = 1.6;
    this.scannerLight.color.setHex(0x10B981);
    this.scannerLight.intensity = 2.5;

    events.emit('CREDENTIAL_SCANNED', {
      id: credentialId,
      studentName: 'Juan Pérez López',
      accountNumber: '32145678',
      faculty: 'Facultad de Ingeniería',
      status: 'ACTIVO'
    });

    // Restaurar a estado idle tras 1.4 segundos
    setTimeout(() => {
      this.resetToIdle();
    }, 1400);
  }

  private resetToIdle(): void {
    this.isScanning = false;
    this.ledMat.color.setHex(0x00B4D8);
    this.ledMat.emissive.setHex(0x00B4D8);
    this.ledMat.emissiveIntensity = 0.9;
    this.scannerLight.color.setHex(0x00B4D8);
    this.scannerLight.intensity = 1.0;
  }

  public update(delta: number): void {
    if (this.scanCooldown > 0) {
      this.scanCooldown -= delta;
    }

    if (!this.isScanning) {
      const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
      this.ledMat.emissiveIntensity = 0.6 + pulse * 0.4;
    }
  }

  public getLastScannedId(): string | null {
    return this.lastScannedId;
  }
}
