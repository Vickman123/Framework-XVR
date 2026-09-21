import * as THREE from 'three';
import { materials } from '../world/Materials.js';
import { soundManager } from '../core/AudioSystem.js';

export interface DoorConfig {
  id: string;
  roomCode: string; // e.g. "ROOM 01"
  title: string; // e.g. "PROFESSIONAL & IT OPERATIONS"
  subtitle: string; // e.g. "UNAM PC PUMA · NOC LEADERSHIP · 300K+ USERS"
  category: string; // e.g. "ENTERPRISE SYSTEMS & INFRASTRUCTURE"
  accentHex: string; // e.g. "#00f0ff"
  accentMaterial: THREE.MeshStandardMaterial;
  clearance: string; // e.g. "CLEARANCE: LEVEL 01"
  highlights: string[];
  position: [number, number, number];
  rotationY: number;
}

export interface AirlockDoor {
  id: string;
  roomCode: string;
  roomName: string;
  group: THREE.Group;
  leftPanel: THREE.Mesh;
  rightPanel: THREE.Mesh;
  triggerPosition: THREE.Vector3;
  isOpen: boolean;
  openProgress: number; // 0 (closed) to 1 (open)
  statusIndicator?: THREE.Mesh;
  config: DoorConfig;
}

export class DoorSystem {
  public doors: AirlockDoor[] = [];
  public doorsGroup: THREE.Group = new THREE.Group();
  public interactiveMeshes: THREE.Object3D[] = [];

  constructor() {
    // Doors will be registered by WorldManager
  }

  /**
   * Generates a high-contrast glowing overhead sign texture for the doorway facing Central Hub
   */
  private createOverheadSignTexture(config: DoorConfig): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // 1. Deep sci-fi obsidian background
    ctx.fillStyle = '#080b12';
    ctx.fillRect(0, 0, 1024, 256);

    // 2. Subtle architectural grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // 3. Tech hazard diagonal stripes in top-right corner
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(880 + i * 20, 0);
      ctx.lineTo(905 + i * 20, 0);
      ctx.lineTo(845 + i * 20, 60);
      ctx.lineTo(820 + i * 20, 60);
      ctx.fill();
    }

    // 4. Glowing vertical accent bar on left
    ctx.fillStyle = config.accentHex;
    ctx.fillRect(20, 18, 10, 220);

    // 5. Top Status Row
    ctx.fillStyle = config.accentHex;
    ctx.beginPath();
    ctx.arc(52, 40, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('FACILITY SECTOR ARCHITECTURE', 68, 44);

    // Clearance badge
    ctx.strokeStyle = config.accentHex;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(730, 28, 265, 26);
    ctx.strokeRect(730, 28, 265, 26);

    ctx.fillStyle = config.accentHex;
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText(config.clearance.toUpperCase(), 746, 45);

    // 6. Main Room Code & Title
    ctx.font = '900 34px "JetBrains Mono", monospace';
    ctx.fillStyle = config.accentHex;
    const codeText = `${config.roomCode} // `;
    ctx.fillText(codeText, 52, 108);

    const codeWidth = ctx.measureText(codeText).width;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(config.title, 52 + codeWidth, 108);

    // 7. Glowing separator gradient line
    const grad = ctx.createLinearGradient(52, 0, 990, 0);
    grad.addColorStop(0, config.accentHex);
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(52, 126, 940, 2);

    // 8. Subtitle / Sector Scope
    ctx.font = '600 17px "Inter", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(config.subtitle, 52, 162);

    // 9. Bottom Telemetry & Navigation Prompt Bar
    ctx.fillStyle = '#101420';
    ctx.fillRect(52, 196, 940, 38);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeRect(52, 196, 940, 38);

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('● AIRLOCK ACTIVE', 68, 220);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText('AUTOMATED DUAL SLIDING SYSTEM', 220, 220);

    ctx.fillStyle = config.accentHex;
    ctx.fillText('[ WALK FORWARD TO ENTER SECTOR ] ›››', 700, 220);

    // 10. Outer neon frame border with corner accents
    ctx.strokeStyle = config.accentHex;
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 1012, 244);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates a sign for the rear face of the door (facing anyone returning to Central Hub)
   */
  private createReverseSignTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#080b12';
    ctx.fillRect(0, 0, 1024, 256);

    // Tech grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Right accent bar
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(994, 18, 10, 220);

    // Top status
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(52, 40, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('FACILITY TRANSIT WAYPOINT', 68, 44);

    ctx.fillStyle = '#00f0ff';
    ctx.fillText('[ SECTOR EXIT PORTAL ]', 780, 44);

    // Main Return Title
    ctx.font = '900 36px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('◄◄ ', 52, 108);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('CENTRAL ROTUNDA // MAIN HUB', 115, 108);

    ctx.fillStyle = '#00f0ff';
    ctx.fillText(' ◄◄', 880, 108);

    // Separator
    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.fillRect(52, 126, 940, 2);

    // Subtitle
    ctx.font = '600 17px "Inter", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('EXECUTIVE RECEPTION · SECTORS 01 - 04 ACCESS · CONTACT DOSSIER', 52, 162);

    // Bottom telemetry
    ctx.fillStyle = '#101420';
    ctx.fillRect(52, 196, 940, 38);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.strokeRect(52, 196, 940, 38);

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#22c55e';
    ctx.fillText('● ROTUNDA ACCESS UNRESTRICTED', 68, 220);

    ctx.fillStyle = '#00f0ff';
    ctx.fillText('[ ENTER TO RETURN TO CENTRAL FACILITY NEXUS ]', 580, 220);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 1012, 244);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates a high-tech standing directory kiosk display texture
   */
  private createDirectoryBoardTexture(config: DoorConfig): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 512, 768);

    // Large background numeral watermark
    const num = config.roomCode.replace(/[^0-9]/g, '');
    ctx.font = '900 190px "JetBrains Mono", monospace';
    ctx.fillStyle = config.accentHex;
    ctx.globalAlpha = 0.07;
    ctx.textAlign = 'center';
    ctx.fillText(num, 256, 440);
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'left';

    // Top header block
    ctx.fillStyle = '#111726';
    ctx.fillRect(0, 0, 512, 72);
    ctx.fillStyle = config.accentHex;
    ctx.fillRect(0, 0, 512, 4);

    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = config.accentHex;
    ctx.fillText('SECTOR DIRECTORY & MANIFEST', 24, 32);

    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`[ ${config.roomCode} ]`, 24, 54);

    ctx.fillStyle = '#22c55e';
    ctx.fillText('● ONLINE', 420, 54);

    // Title & Category
    ctx.font = config.title.length > 25 ? '900 20px "JetBrains Mono", monospace' : '900 23px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(config.title, 24, 114);

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = config.accentHex;
    ctx.fillText(config.category, 24, 140);

    // Divider
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(24, 154, 464, 1);

    // Subtitle / brief
    ctx.font = '13px "Inter", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(config.subtitle, 24, 180);

    // Exhibits header
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('KEY SECTOR EXHIBITS & CAPABILITIES:', 24, 222);

    // 4 Highlights Cards
    config.highlights.forEach((h, idx) => {
      const cardY = 242 + idx * 86;
      ctx.fillStyle = '#101522';
      ctx.fillRect(24, cardY, 464, 74);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.strokeRect(24, cardY, 464, 74);

      // Left accent bar
      ctx.fillStyle = config.accentHex;
      ctx.fillRect(24, cardY, 4, 74);

      // Index number
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = config.accentHex;
      ctx.fillText(`0${idx + 1}`, 38, cardY + 28);

      // Highlight text
      ctx.font = '600 13px "Inter", sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(h, 72, cardY + 44);
    });

    // Bottom action bar
    ctx.fillStyle = '#12192a';
    ctx.fillRect(24, 608, 464, 126);
    ctx.strokeStyle = config.accentHex;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(24, 608, 464, 126);

    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillStyle = config.accentHex;
    ctx.fillText('[ E ] OPEN SECTOR DOSSIER', 42, 646);

    ctx.font = '12px "Inter", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Walk forward through airlock to explore in 3D.', 42, 676);
    ctx.fillText('Proximity sensors will automatically slide doors.', 42, 700);

    // Outer border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 508, 764);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates a glowing floor runway decal pointing visitors into the door
   */
  private createFloorDecalTexture(config: DoorConfig): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a0e18';
    ctx.fillRect(0, 0, 512, 256);

    // Outer glow border
    ctx.strokeStyle = config.accentHex;
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, 496, 240);

    // Inner dotted border
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, 480, 224);
    ctx.setLineDash([]);

    // Chevrons pointing forward
    ctx.fillStyle = config.accentHex;
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▲ ▲ ▲ ▲ ▲', 256, 54);

    // Room code and Title
    ctx.font = '900 24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${config.roomCode} : ${config.title}`, 256, 110);

    // Category
    ctx.font = 'bold 14px "Inter", sans-serif';
    ctx.fillStyle = config.accentHex;
    ctx.fillText(config.category, 256, 146);

    // Prompt
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('AUTOMATED ENTRY // STEP FORWARD TO ACTUATE', 256, 192);
    ctx.fillText('▲ ▲ ▲', 256, 222);

    ctx.textAlign = 'left';
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Creates and registers a sliding airlock door with:
   * - Forward-projected overhead illuminated lightbox sign (completely clear of beam/wall clipping)
   * - Forward standing directory kiosk angled towards Central Hub
   * - Floor runway guidance decal
   * - Status indicator beacon on the front of the frame
   */
  public createAirlock(config: DoorConfig): AirlockDoor {
    const group = new THREE.Group();
    group.position.set(config.position[0], config.position[1], config.position[2]);
    group.rotation.y = config.rotationY;

    // 1. Door Portal Frame
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.4), materials.metalTrimMaterial);
    frameLeft.position.set(-1.6, 1.6, 0);

    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, 0.4), materials.metalTrimMaterial);
    frameRight.position.set(1.6, 1.6, 0);

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.4, 0.4), materials.metalTrimMaterial);
    frameTop.position.set(0, 3.2, 0);

    // 2. Overhead Illuminated Lightbox Sign - BROUGHT FORWARD INTO CENTRAL HUB (Z = +0.50)
    // Mounted on dual cantilever architectural brackets extending from frame (Z = 0.15) to Z = 0.50
    const armLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.45), materials.metalTrimMaterial);
    armLeft.position.set(-1.2, 3.52, 0.28);

    const armRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.45), materials.metalTrimMaterial);
    armRight.position.set(1.2, 3.52, 0.28);

    // Front Sign Housing Box (floating cleanly in front of portal frame)
    const signHousingGeo = new THREE.BoxGeometry(3.3, 0.65, 0.14);
    const signHousingMat = materials.darkDeskMaterial;
    const signHousing = new THREE.Mesh(signHousingGeo, signHousingMat);
    signHousing.position.set(0, 3.52, 0.50);

    // Top glowing LED strip on forward sign
    const signTopStrip = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.04, 0.16), config.accentMaterial);
    signTopStrip.position.set(0, 3.86, 0.50);

    // Bottom downlight LED strip under forward sign
    const signBottomStrip = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, 0.15), config.accentMaterial);
    signBottomStrip.position.set(0, 3.18, 0.50);

    // Front Display Face (Facing Central Hub, angled slightly down toward player)
    const frontTex = this.createOverheadSignTexture(config);
    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.18,
      metalness: 0.1,
      emissiveMap: frontTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.85, // Ultra-crisp, bright glow
    });
    const frontSignMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.58), frontMat);
    frontSignMesh.position.set(0, 3.52, 0.58);
    frontSignMesh.rotation.x = 0.06; // Angled 3.5° downward toward approaching player

    // Rear Sign (Facing into Corridor/Room on return journey)
    const backArmLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.3), materials.metalTrimMaterial);
    backArmLeft.position.set(-1.2, 3.52, -0.25);
    const backArmRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.3), materials.metalTrimMaterial);
    backArmRight.position.set(1.2, 3.52, -0.25);

    const backHousing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.62, 0.12), materials.darkDeskMaterial);
    backHousing.position.set(0, 3.52, -0.32);

    const backTex = this.createReverseSignTexture();
    const backMat = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.2,
      metalness: 0.1,
      emissiveMap: backTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.8,
    });
    const backSignMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.55), backMat);
    backSignMesh.position.set(0, 3.52, -0.39);
    backSignMesh.rotation.y = Math.PI;

    // Door Status Indicator Beacon (Mounted cleanly on front face of portal beam at Z = 0.22)
    const indicatorGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 16);
    const indicatorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.accentHex),
      emissive: new THREE.Color(config.accentHex),
      emissiveIntensity: 2.0,
      roughness: 0.15,
    });
    const statusIndicator = new THREE.Mesh(indicatorGeo, indicatorMat);
    statusIndicator.position.set(0, 3.18, 0.22);
    statusIndicator.rotation.x = Math.PI / 2;

    // 3. Sliding Door Panels
    const panelGeo = new THREE.BoxGeometry(1.4, 3.0, 0.12);
    const leftPanel = new THREE.Mesh(panelGeo, materials.darkPanelMaterial);
    leftPanel.position.set(-0.7, 1.5, 0);

    const rightPanel = new THREE.Mesh(panelGeo, materials.darkPanelMaterial);
    rightPanel.position.set(0.7, 1.5, 0);

    // Vertical glowing decorative grooves
    const leftGroove = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.4, 0.13), config.accentMaterial);
    leftGroove.position.set(-0.6, 1.5, 0);
    leftPanel.add(leftGroove);

    const rightGroove = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.4, 0.13), config.accentMaterial);
    rightGroove.position.set(0.6, 1.5, 0);
    rightPanel.add(rightGroove);

    // 4. Standing Directory Kiosk - BROUGHT FORWARD & ANGLED (X = 1.90, Z = 1.00)
    // Completely unclipped from perimeter walls, angled 25° toward Central Hub
    const dirGroup = new THREE.Group();
    dirGroup.position.set(1.90, 0, 1.00);
    dirGroup.rotation.y = -Math.PI / 7.2; // Angled 25° inward toward player

    // Directory Base Stand
    const dirBase = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.1, 0.25), materials.metalTrimMaterial);
    dirBase.position.y = 0.05;
    dirGroup.add(dirBase);

    const dirPole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.12), materials.metalTrimMaterial);
    dirPole.position.y = 0.45;
    dirGroup.add(dirPole);

    // Directory Board Housing
    const dirHousing = new THREE.Mesh(new THREE.BoxGeometry(1.00, 1.74, 0.08), materials.darkDeskMaterial);
    dirHousing.position.y = 1.68;
    dirGroup.add(dirHousing);

    // Glowing border frame around directory
    const dirBorder = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.03, 0.09), config.accentMaterial);
    dirBorder.position.y = 2.56;
    dirGroup.add(dirBorder);

    const dirBorderBottom = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.03, 0.09), config.accentMaterial);
    dirBorderBottom.position.y = 0.8;
    dirGroup.add(dirBorderBottom);

    // Directory Display Panel
    const dirTex = this.createDirectoryBoardTexture(config);
    const dirMat = new THREE.MeshStandardMaterial({
      map: dirTex,
      roughness: 0.18,
      metalness: 0.1,
      emissiveMap: dirTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.75,
    });
    const dirScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 1.68), dirMat);
    dirScreen.position.set(0, 1.68, 0.045);

    dirScreen.userData = {
      interactive: true,
      type: 'generic',
      data: {
        badge: `${config.roomCode} // SECTOR MANIFEST`,
        title: config.title,
        category: config.category,
        description: `${config.subtitle}. Walk forward through the automated airlock to explore this specialized division in full 3D.`,
        highlights: config.highlights,
      },
      promptText: `INSPECT ${config.roomCode} DIRECTORY`,
      glowTarget: dirScreen,
    };
    this.interactiveMeshes.push(dirScreen);
    dirGroup.add(dirScreen);

    // 5. Floor Runway Guidance Decal (in front of door on Hub floor)
    const floorDecalTex = this.createFloorDecalTexture(config);
    const floorDecalMat = new THREE.MeshStandardMaterial({
      map: floorDecalTex,
      transparent: true,
      opacity: 0.95,
      roughness: 0.2,
      metalness: 0.1,
      emissiveMap: floorDecalTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.75,
      depthWrite: false, // Zero flickering with runway stripes
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    const floorDecal = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), floorDecalMat);
    floorDecal.rotation.x = -Math.PI / 2;
    floorDecal.position.set(0, 0.022, 1.45);

    // 6. Assemble all components
    group.add(
      frameLeft,
      frameRight,
      frameTop,
      armLeft,
      armRight,
      signHousing,
      signTopStrip,
      signBottomStrip,
      frontSignMesh,
      backArmLeft,
      backArmRight,
      backHousing,
      backSignMesh,
      statusIndicator,
      leftPanel,
      rightPanel,
      dirGroup,
      floorDecal
    );

    this.doorsGroup.add(group);

    const door: AirlockDoor = {
      id: config.id,
      roomCode: config.roomCode,
      roomName: config.title,
      group,
      leftPanel,
      rightPanel,
      triggerPosition: new THREE.Vector3(config.position[0], config.position[1], config.position[2]),
      isOpen: false,
      openProgress: 0,
      statusIndicator,
      config,
    };

    this.doors.push(door);
    return door;
  }

  /**
   * Updates door sliding animations and LED status lights based on player proximity
   */
  public update(playerPos: THREE.Vector3, delta: number): void {
    const openDistSq = 4.2 * 4.2;
    const closeDistSq = 5.5 * 5.5;

    for (const door of this.doors) {
      const distSq = playerPos.distanceToSquared(door.triggerPosition);

      if (distSq < openDistSq && !door.isOpen) {
        door.isOpen = true;
        soundManager.playDoor();

        // Switch status beacon to bright emerald green
        if (door.statusIndicator) {
          const mat = door.statusIndicator.material as THREE.MeshStandardMaterial;
          mat.color.setHex(0x00e676);
          mat.emissive.setHex(0x00e676);
        }
      } else if (distSq > closeDistSq && door.isOpen) {
        door.isOpen = false;
        soundManager.playDoor();

        // Revert status beacon to sector accent color
        if (door.statusIndicator) {
          const mat = door.statusIndicator.material as THREE.MeshStandardMaterial;
          const hexNum = parseInt(door.config.accentHex.replace('#', '0x'), 16);
          mat.color.setHex(hexNum);
          mat.emissive.setHex(hexNum);
        }
      }

      // Smooth slide animation
      const target = door.isOpen ? 1 : 0;
      const speed = 2.5; // opens in ~0.4s
      door.openProgress = THREE.MathUtils.lerp(door.openProgress, target, delta * speed);

      // Slide left panel to X = -0.7 - (1.3 * progress)
      // Slide right panel to X = 0.7 + (1.3 * progress)
      door.leftPanel.position.x = -0.7 - 1.3 * door.openProgress;
      door.rightPanel.position.x = 0.7 + 1.3 * door.openProgress;
    }
  }
}
