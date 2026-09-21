import * as THREE from 'three';
import { events } from '../core/EventBus';

export class Counter {
  public readonly group: THREE.Group;
  public readonly deliverySurfaceY: number = 1.05;
  public readonly credentialTrayWorldPos = new THREE.Vector3(0.38, 1.08, 0.12);
  private trayBorderMat!: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Counter_PC_PUMA';

    this.createMainCounter();
    this.createDeliveryZone();
    this.createCredentialTray();
    this.createSideCounter();

    events.on('CREDENTIAL_TRAY_HIGHLIGHT', (active: boolean) => {
      this.setTrayHighlight(active);
    });
  }

  private createMainCounter(): void {
    const counterWidth = 3.2;
    const counterHeight = 1.05;
    const counterDepth = 0.75;

    // Cuerpo principal del mostrador (acabado azul institucional)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x002B49,
      roughness: 0.5,
      metalness: 0.1
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(counterWidth, counterHeight, counterDepth),
      bodyMat
    );
    body.position.set(0, counterHeight / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);

    // Sombra de contacto / Ambient Occlusion suave bajo el mostrador (estilo RTX)
    const shadowGeo = new THREE.PlaneGeometry(counterWidth + 0.35, counterDepth + 0.35);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(128, 64, 10, 128, 64, 125);
    grad.addColorStop(0, 'rgba(10, 15, 26, 0.7)');
    grad.addColorStop(0.55, 'rgba(10, 15, 26, 0.32)');
    grad.addColorStop(1, 'rgba(10, 15, 26, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const contactShadow = new THREE.Mesh(
      shadowGeo,
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.002, 0);
    this.group.add(contactShadow);

    // Encimera / Superficie de trabajo (cubierta superior)
    const topMat = new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      roughness: 0.22,
      metalness: 0.18
    });

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(counterWidth + 0.1, 0.05, counterDepth + 0.1),
      topMat
    );
    top.position.set(0, counterHeight + 0.025, 0);
    top.castShadow = true;
    top.receiveShadow = true;
    this.group.add(top);

    // Franja dorada frontal
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xD59F0F,
      roughness: 0.3,
      metalness: 0.4
    });

    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(counterWidth, 0.06, 0.02),
      goldTrimMat
    );
    trim.position.set(0, 0.85, counterDepth / 2 + 0.01);
    this.group.add(trim);

    // Panel frontal con logotipo / rótulo PC PUMA
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 512;
    logoCanvas.height = 128;
    const ctx = logoCanvas.getContext('2d')!;
    ctx.fillStyle = '#002B49';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('• PC PUMA •', 256, 75);

    const logoTex = new THREE.CanvasTexture(logoCanvas);
    const logoMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.3),
      new THREE.MeshStandardMaterial({ map: logoTex, roughness: 0.4 })
    );
    logoMesh.position.set(0, 0.55, counterDepth / 2 + 0.01);
    this.group.add(logoMesh);
  }

  private createDeliveryZone(): void {
    // Zona de entrega y devolución demarcada en el mostrador (frente a la posición del estudiante)
    const padCanvas = document.createElement('canvas');
    padCanvas.width = 512;
    padCanvas.height = 512;
    const ctx = padCanvas.getContext('2d')!;

    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#D59F0F';
    ctx.lineWidth = 8;
    ctx.setLineDash([20, 10]);
    ctx.strokeRect(10, 10, 492, 492);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ZONA DE ENTREGA', 256, 230);
    ctx.fillText('Y RECEPCIÓN', 256, 270);

    const padTex = new THREE.CanvasTexture(padCanvas);
    const pad = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.5),
      new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.6 })
    );
    pad.rotation.x = -Math.PI / 2;
    // Ubicado a la derecha del operador (frente al estudiante que atiende)
    pad.position.set(0.65, 1.077, 0.05);
    pad.receiveShadow = true;
    this.group.add(pad);
  }

  private createCredentialTray(): void {
    // Bandeja de entrega de credencial frente al estudiante
    const trayW = 0.28;
    const trayH = 0.20;
    const trayCanvas = document.createElement('canvas');
    trayCanvas.width = 512;
    trayCanvas.height = 384;
    const ctx = trayCanvas.getContext('2d')!;

    // Fondo azul UNAM elegante
    ctx.fillStyle = '#001E33';
    ctx.fillRect(0, 0, 512, 384);

    // Borde dorado
    ctx.strokeStyle = '#D59F0F';
    ctx.lineWidth = 12;
    ctx.strokeRect(8, 8, 496, 368);

    // Icono y texto
    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪪 BANDEJA DE ENTREGA', 256, 115);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('DEVOLVER CREDENCIAL', 256, 195);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('▼ ENTREGAR / SOLTAR AQUÍ ▼', 256, 280);

    const trayTex = new THREE.CanvasTexture(trayCanvas);
    const trayMat = new THREE.MeshStandardMaterial({
      map: trayTex,
      roughness: 0.35,
      metalness: 0.2
    });

    const trayMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(trayW, trayH),
      trayMat
    );
    trayMesh.rotation.x = -Math.PI / 2;
    trayMesh.position.set(0.38, 1.078, 0.12);
    trayMesh.receiveShadow = true;
    this.group.add(trayMesh);

    // Borde luminoso de acrílico/LED que brilla cuando el alumno espera credencial
    this.trayBorderMat = new THREE.MeshStandardMaterial({
      color: 0xD59F0F,
      emissive: 0xD59F0F,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.6
    });
    const trayBorder = new THREE.Mesh(
      new THREE.BoxGeometry(trayW + 0.02, 0.012, trayH + 0.02),
      this.trayBorderMat
    );
    trayBorder.position.set(0.38, 1.074, 0.12);
    trayBorder.receiveShadow = true;
    this.group.add(trayBorder);
  }

  public setTrayHighlight(active: boolean): void {
    if (this.trayBorderMat) {
      this.trayBorderMat.emissive.setHex(active ? 0x10B981 : 0xD59F0F);
      this.trayBorderMat.emissiveIntensity = active ? 0.95 : 0.35;
    }
  }

  private createSideCounter(): void {
    // Estación y bahía de estacionamiento de piso para el Carro 01
    const padCanvas = document.createElement('canvas');
    padCanvas.width = 512;
    padCanvas.height = 512;
    const ctx = padCanvas.getContext('2d')!;

    // Fondo gris oscuro
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, 512, 512);

    // Borde de precaución industrial amarillo y negro
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 14;
    ctx.strokeRect(8, 8, 496, 496);

    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESTACIÓN CARRO 01', 256, 120);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('PC PUMA • RESGUARDO', 256, 256);
    ctx.fillText('Y RECARGA ACTIVA', 256, 290);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('ALIMENTACIÓN 120V OK', 256, 410);

    const padTex = new THREE.CanvasTexture(padCanvas);
    const bayPad = new THREE.Mesh(
      new THREE.PlaneGeometry(1.05, 1.25),
      new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.6 })
    );
    bayPad.rotation.x = -Math.PI / 2;
    bayPad.position.set(-1.85, 0.002, -1.65);
    bayPad.receiveShadow = true;
    this.group.add(bayPad);

    // Zoclo / tope metálico en el piso para asegurar las ruedas del carro
    const stopperMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      roughness: 0.4,
      metalness: 0.5
    });
    const stopper = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.03, 1.15),
      stopperMat
    );
    stopper.position.set(-2.28, 0.015, -1.65);
    stopper.castShadow = true;
    this.group.add(stopper);

    // Caja de alimentación eléctrica en la pared con LED de energía
    const powerBoxMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const powerBox = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.20, 0.08), powerBoxMat);
    powerBox.position.set(-2.38, 0.65, -1.65);
    this.group.add(powerBox);

    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x10B981,
      emissive: 0x10B981,
      emissiveIntensity: 0.9
    });
    const powerLed = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), ledMat);
    powerLed.position.set(-2.32, 0.70, -1.65);
    this.group.add(powerLed);
  }
}
