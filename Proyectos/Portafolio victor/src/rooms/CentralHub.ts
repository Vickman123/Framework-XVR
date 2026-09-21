import * as THREE from 'three';
import { materials } from '../world/Materials.js';
import { PORTFOLIO_DATA } from '../data/portfolioData.js';

export class CentralHub {
  public group: THREE.Group = new THREE.Group();
  public interactiveMeshes: THREE.Object3D[] = [];
  public holoRing!: THREE.Mesh;

  constructor() {
    this.buildHubArchitecture();
    this.buildReceptionDesk();
    this.buildDirectionalRunwayStripes();
    this.buildCeilingDome();
    this.buildFacilityWallSign();
  }

  private buildHubArchitecture(): void {
    // 1. Hub Floor (dark polished slate ceramic base)
    const floorGeo = new THREE.CylinderGeometry(9.5, 9.5, 0.2, 48);
    const floor = new THREE.Mesh(floorGeo, materials.floorMaterial);
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Inner circular floor boundary ring
    const ringGeo = new THREE.RingGeometry(3.6, 3.75, 48);
    const ring = new THREE.Mesh(ringGeo, materials.emissiveCyanMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.012;
    this.group.add(ring);

    // 2. Perimeter walls with alternating dark structural pillars & white vertical lightboxes (Image 2 & 3)
    const wallSegments = [
      { angle: Math.PI * 0.25 }, // NE
      { angle: Math.PI * 0.75 }, // SE
      { angle: Math.PI * 1.25 }, // SW
      { angle: Math.PI * 1.75 }, // NW
    ];

    wallSegments.forEach((seg) => {
      const segGroup = new THREE.Group();
      segGroup.rotation.y = seg.angle;

      // 1. Lower architectural wainscot panel (Y = 0 to 0.85m)
      const lowerWallGeo = new THREE.CylinderGeometry(9.5, 9.5, 0.85, 16, 1, true, -Math.PI / 6.2, Math.PI / 3.1);
      const lowerWall = new THREE.Mesh(lowerWallGeo, materials.wallMaterial);
      lowerWall.position.y = 0.425;

      // Lower window sill ledge
      const sill = new THREE.Mesh(
        new THREE.CylinderGeometry(9.44, 9.44, 0.08, 16, 1, true, -Math.PI / 6.2, Math.PI / 3.1),
        materials.metalTrimMaterial
      );
      sill.position.y = 0.85;

      // 2. Floor-to-ceiling crystal-clear panoramic observation window glass (Y = 0.85 to 3.35m)
      const glassGeo = new THREE.CylinderGeometry(9.5, 9.5, 2.5, 16, 1, true, -Math.PI / 6.2, Math.PI / 3.1);
      const glass = new THREE.Mesh(glassGeo, materials.windowGlassMaterial);
      glass.position.y = 2.1;

      // Horizontal window reinforcement mullion at eye level
      const midMullion = new THREE.Mesh(
        new THREE.CylinderGeometry(9.46, 9.46, 0.05, 16, 1, true, -Math.PI / 6.2, Math.PI / 3.1),
        materials.metalTrimMaterial
      );
      midMullion.position.y = 2.1;

      // 3. Upper ceiling bulkhead panel (Y = 3.35 to 4.1m)
      const upperWallGeo = new THREE.CylinderGeometry(9.5, 9.5, 0.75, 16, 1, true, -Math.PI / 6.2, Math.PI / 3.1);
      const upperWall = new THREE.Mesh(upperWallGeo, materials.wallMaterial);
      upperWall.position.y = 3.725;

      // Vertical structural pillars dividing the panoramic glass into 4 viewports per bay
      for (let p = -2; p <= 2; p++) {
        const pAngle = (p * Math.PI) / 20;
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.0, 0.32), materials.metalTrimMaterial);
        pillar.position.set(Math.sin(pAngle) * 9.42, 2.0, Math.cos(pAngle) * 9.42);
        pillar.rotation.y = pAngle;
        segGroup.add(pillar);
      }

      // Horizontal architectural dark baseboard along bottom of wall
      const baseboard = new THREE.Mesh(
        new THREE.CylinderGeometry(9.44, 9.44, 0.25, 16, 1, true, -Math.PI / 6.2, Math.PI / 3.1),
        materials.metalTrimMaterial
      );
      baseboard.position.y = 0.125;

      // Lower sill illuminated LED accent strip
      const sillGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(9.45, 9.45, 0.03, 16, 1, true, -Math.PI / 6.2, Math.PI / 3.1),
        materials.emissiveCyanMaterial
      );
      sillGlow.position.y = 0.88;

      // Upper window header illuminated LED light strip
      const strip = new THREE.Mesh(
        new THREE.CylinderGeometry(9.45, 9.45, 0.04, 16, 1, true, -Math.PI / 6.2, Math.PI / 3.1),
        materials.emissiveCyanMaterial
      );
      strip.position.y = 3.35;

      segGroup.add(lowerWall, sill, glass, midMullion, upperWall, baseboard, sillGlow, strip);
      this.group.add(segGroup);
    });
  }

  /**
   * Concentric Ceiling Dome with Center Insignia (Resident Evil NEST aesthetic - Image 3)
   */
  private buildCeilingDome(): void {
    const ceilingGroup = new THREE.Group();
    ceilingGroup.position.y = 4.1;

    // Outer acoustic ceiling disc
    const outerCeiling = new THREE.Mesh(
      new THREE.CylinderGeometry(9.5, 9.5, 0.15, 48),
      materials.ceilingMaterial
    );
    ceilingGroup.add(outerCeiling);

    // Tier 1: Outer recessed ring
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(6.5, 0.12, 16, 48),
      materials.metalTrimMaterial
    );
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = -0.05;
    ceilingGroup.add(ring1);

    // Tier 2: Middle concentric hazard ring
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(4.2, 0.1, 16, 48),
      materials.emissiveAmberMaterial
    );
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = -0.08;
    ceilingGroup.add(ring2);

    // Tier 3: Center Dome with Facility Emblem (Facing down into room)
    const domeTexture = materials.createDomeLogoTexture();
    const domeMesh = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 32),
      new THREE.MeshStandardMaterial({
        map: domeTexture,
        roughness: 0.3,
        metalness: 0.2,
        emissiveMap: domeTexture,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.35,
      })
    );
    domeMesh.rotation.x = Math.PI / 2;
    domeMesh.position.y = -0.1;
    ceilingGroup.add(domeMesh);

    // 12 Recessed downlight fixtures around the middle ring (Image 3)
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const fixture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16),
        materials.metalTrimMaterial
      );
      fixture.position.set(Math.cos(angle) * 5.2, -0.06, Math.sin(angle) * 5.2);

      const bulb = new THREE.Mesh(
        new THREE.CircleGeometry(0.08, 16),
        materials.emissiveCyanMaterial
      );
      bulb.rotation.x = Math.PI / 2;
      bulb.position.set(Math.cos(angle) * 5.2, -0.085, Math.sin(angle) * 5.2);

      ceilingGroup.add(fixture, bulb);
    }

    this.group.add(ceilingGroup);
  }

  /**
   * Umbrella-style Corporate Facility Wall Plaque (Image 1 & 2)
   */
  private buildFacilityWallSign(): void {
    const signGroup = new THREE.Group();
    signGroup.position.set(6.4, 2.3, -6.4); // North-East wall
    signGroup.rotation.y = -Math.PI / 4;

    const logoTexture = materials.createFacilityLogoTexture();
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: logoTexture,
      roughness: 0.2,
      metalness: 0.1,
      emissiveMap: logoTexture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.3,
    });

    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.05), plaqueMat);
    signGroup.add(plaque);

    // Brushed metal border frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.3, 1.15, 0.05), materials.metalTrimMaterial);
    frame.position.z = -0.03;
    signGroup.add(frame);

    this.group.add(signGroup);
  }

  /**
   * Sleek Angular Reception Counter with LED Under-glow (Image 1 & 2)
   */
  private buildReceptionDesk(): void {
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, 0, 0.2);

    // 1. Counter Body: Sleek dark charcoal/black desk with curved return
    const mainDesk = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.05, 0.9),
      materials.darkDeskMaterial
    );
    mainDesk.position.set(0, 0.525, 0);
    mainDesk.castShadow = true;
    mainDesk.receiveShadow = true;
    deskGroup.add(mainDesk);

    // Counter top ledge (polished surface)
    const topLedge = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.06, 1.05),
      materials.metalTrimMaterial
    );
    topLedge.position.set(0, 1.06, 0);
    deskGroup.add(topLedge);

    // 2. Under-counter Illuminated LED Strip (Image 1)
    const underGlow = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.04, 0.05),
      materials.emissiveCyanMaterial
    );
    underGlow.position.set(0, 0.1, 0.46);
    deskGroup.add(underGlow);

    // 3. Holographic Welcome Terminal Mounted on Desk
    const screenGeo = new THREE.PlaneGeometry(2.0, 1.25);
    const screenTexture = materials.createScreenTexture(
      PORTFOLIO_DATA.profile.name,
      'EXECUTIVE FACILITY NEXUS',
      undefined,
      [
        PORTFOLIO_DATA.profile.title,
        'Welcome to the interactive 3D laboratory.',
        'North: IT Operations · East: Technology & VXR',
        'South: Space Tech · West: Research Lab',
      ],
      '#00f0ff',
      512,
      360
    );

    const screenMat = materials.createScreenMaterial(screenTexture);

    const screenFront = new THREE.Mesh(screenGeo, screenMat);
    screenFront.position.set(0, 1.8, 0.05);

    screenFront.userData = {
      interactive: true,
      type: 'profile',
      data: PORTFOLIO_DATA.profile,
      promptText: 'VIEW EXECUTIVE DOSSIER',
      glowTarget: screenFront,
    };
    this.interactiveMeshes.push(screenFront);

    // Screen stand
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 16), materials.metalTrimMaterial);
    stand.position.set(0, 1.4, 0);
    deskGroup.add(stand);

    deskGroup.add(screenFront);

    // 4. Rotating 3D spatial emblem above terminal
    const logoGroup = new THREE.Group();
    logoGroup.position.set(0, 2.7, 0);
    logoGroup.name = 'hubLogo';

    const oct1 = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
    );
    const oct2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.16, 0),
      new THREE.MeshBasicMaterial({ color: 0xd97706, wireframe: true })
    );
    logoGroup.add(oct1, oct2);
    deskGroup.add(logoGroup);

    this.group.add(deskGroup);
  }

  /**
   * Industrial Runway Track Stripes on Floor (Image 1 & 3)
   */
  private buildDirectionalRunwayStripes(): void {
    const runways = [
      { angle: 0, length: 5.5, pos: [0, 0.015, -6.0] },          // North to Room 01
      { angle: -Math.PI / 2, length: 5.5, pos: [6.0, 0.015, 0] }, // East to Room 02
      { angle: Math.PI, length: 5.5, pos: [0, 0.015, 6.0] },          // South to Room 03
      { angle: Math.PI / 2, length: 5.5, pos: [-6.0, 0.015, 0] }, // West to Room 04
    ];

    runways.forEach((rw) => {
      const rwGroup = new THREE.Group();
      rwGroup.position.set(rw.pos[0], rw.pos[1], rw.pos[2]);
      rwGroup.rotation.y = rw.angle;

      // Central amber runway track (Image 1)
      const track = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, rw.length),
        materials.runwayStripeMaterial
      );
      track.rotation.x = -Math.PI / 2;
      rwGroup.add(track);

      // Flanking cyan boundary track lines
      const leftLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.04, rw.length),
        materials.emissiveCyanMaterial
      );
      leftLine.rotation.x = -Math.PI / 2;
      leftLine.position.x = -0.34;

      const rightLine = new THREE.Mesh(
        new THREE.PlaneGeometry(0.04, rw.length),
        materials.emissiveCyanMaterial
      );
      rightLine.rotation.x = -Math.PI / 2;
      rightLine.position.x = 0.34;

      rwGroup.add(leftLine, rightLine);
      this.group.add(rwGroup);
    });
  }

  public update(delta: number): void {
    const logo = this.group.getObjectByName('hubLogo');
    if (logo) {
      logo.rotation.y += delta * 0.6;
      logo.rotation.x += delta * 0.3;
      logo.position.y = 2.7 + Math.sin(Date.now() * 0.002) * 0.05;
    }
  }
}
