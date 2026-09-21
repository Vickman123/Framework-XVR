import * as THREE from 'three';
import { materials } from '../world/Materials.js';
import { PORTFOLIO_DATA } from '../data/portfolioData.js';
import { ProjectCard3D } from '../projects/ProjectCard3D.js';

export class RoomTechnology {
  public group: THREE.Group = new THREE.Group();
  public interactiveMeshes: THREE.Object3D[] = [];
  public projectCards: ProjectCard3D[] = [];
  public vxrCoreGroup: THREE.Group = new THREE.Group();
  private vxrRings: THREE.Mesh[] = [];

  constructor() {
    // Room is centered at [22, 0, 0]
    this.group.position.set(22, 0, 0);
    this.buildRoomArchitecture();
    this.buildVxrCenterpiece();
    this.buildProjectStations();
    this.buildDeveloperStackWall();
  }

  private buildRoomArchitecture(): void {
    const width = 18;
    const depth = 16;
    const height = 4.5;

    // Floor
    const floorGeo = new THREE.BoxGeometry(width, 0.2, depth);
    const floor = new THREE.Mesh(floorGeo, materials.floorMaterial);
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling
    const ceilingGeo = new THREE.BoxGeometry(width, 0.2, depth);
    const ceiling = new THREE.Mesh(ceilingGeo, materials.ceilingMaterial);
    ceiling.position.y = height + 0.1;
    this.group.add(ceiling);

    // East Wall (Far right) - Panoramic Observation Window overlooking exterior forest
    const windowGroup = new THREE.Group();
    windowGroup.position.set(width / 2, 0, 0);
    windowGroup.rotation.y = -Math.PI / 2;

    const lowerSill = new THREE.Mesh(new THREE.BoxGeometry(depth, 0.85, 0.3), materials.wallMaterial);
    lowerSill.position.set(0, 0.425, 0);

    const sillLedge = new THREE.Mesh(new THREE.BoxGeometry(depth + 0.1, 0.08, 0.38), materials.metalTrimMaterial);
    sillLedge.position.set(0, 0.85, 0);

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(depth - 0.2, 2.6), materials.windowGlassMaterial);
    glass.position.set(0, 2.15, -0.05);

    const midRail = new THREE.Mesh(new THREE.BoxGeometry(depth, 0.05, 0.12), materials.metalTrimMaterial);
    midRail.position.set(0, 2.15, 0);

    const upperBulk = new THREE.Mesh(new THREE.BoxGeometry(depth, 0.75, 0.3), materials.wallMaterial);
    upperBulk.position.set(0, 3.825, 0);

    for (let z = -depth / 2 + 2.6; z < depth / 2; z += 2.6) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.18, height, 0.34), materials.metalTrimMaterial);
      mullion.position.set(z, height / 2, 0);
      windowGroup.add(mullion);
    }

    const sillStrip = new THREE.Mesh(new THREE.BoxGeometry(depth - 0.2, 0.03, 0.05), materials.emissiveEmeraldMaterial);
    sillStrip.position.set(0, 0.89, -0.15);

    const topStrip = new THREE.Mesh(new THREE.BoxGeometry(depth - 0.2, 0.04, 0.05), materials.emissiveEmeraldMaterial);
    topStrip.position.set(0, 3.44, -0.15);

    windowGroup.add(lowerSill, sillLedge, glass, midRail, upperBulk, sillStrip, topStrip);
    this.group.add(windowGroup);

    // North Wall (Back)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.3), materials.wallMaterial);
    northWall.position.set(0, height / 2, -depth / 2);
    this.group.add(northWall);

    // South Wall (Front)
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.3), materials.wallMaterial);
    southWall.position.set(0, height / 2, depth / 2);
    this.group.add(southWall);

    // West Wall (Entryway with door opening at center)
    const leftWestWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, (depth - 3.6) / 2), materials.wallMaterial);
    leftWestWall.position.set(-width / 2, height / 2, -(depth / 4 + 0.9));

    const rightWestWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, (depth - 3.6) / 2), materials.wallMaterial);
    rightWestWall.position.set(-width / 2, height / 2, depth / 4 + 0.9);

    const overDoorWest = new THREE.Mesh(new THREE.BoxGeometry(0.3, height - 3.2, 3.6), materials.wallMaterial);
    overDoorWest.position.set(-width / 2, height - (height - 3.2) / 2, 0);

    this.group.add(leftWestWall, rightWestWall, overDoorWest);

    // Glowing floor accent ring under VXR engine
    const floorHoloRing = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 2.5, 48),
      materials.emissiveEmeraldMaterial
    );
    floorHoloRing.rotation.x = -Math.PI / 2;
    floorHoloRing.position.set(0, 0.015, 0);
    this.group.add(floorHoloRing);
  }

  /**
   * The VXR Framework Core is the pulsating centerpiece of Room 02
   */
  private buildVxrCenterpiece(): void {
    const vxr = PORTFOLIO_DATA.vxrFramework;
    this.vxrCoreGroup.position.set(0, 0, 0);

    // 1. Center Pedestal Base with glass emitter column
    const pedGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.6, 8);
    const ped = new THREE.Mesh(pedGeo, materials.metalTrimMaterial);
    ped.position.y = 0.3;
    ped.castShadow = true;
    this.vxrCoreGroup.add(ped);

    // Glass cylinder housing
    const columnGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.2, 24);
    const column = new THREE.Mesh(columnGeo, materials.darkGlassMaterial);
    column.position.y = 1.2;
    this.vxrCoreGroup.add(column);

    // 2. 3D Floating Gyroscope / Engine Core
    const coreNode = new THREE.Group();
    coreNode.name = 'gyroNode';
    coreNode.position.set(0, 2.2, 0);

    // Outer ring
    const r1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.65, 0.025, 16, 48),
      materials.emissiveCyanMaterial
    );
    // Mid ring
    const r2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.025, 16, 48),
      materials.emissiveEmeraldMaterial
    );
    r2.rotation.x = Math.PI / 3;
    // Inner ring
    const r3 = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.02, 16, 48),
      materials.emissiveAmberMaterial
    );
    r3.rotation.y = Math.PI / 3;

    // Glowing crystalline nucleus
    const nucGeo = new THREE.DodecahedronGeometry(0.2, 0);
    const nucMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.0,
      wireframe: true,
    });
    const nucleus = new THREE.Mesh(nucGeo, nucMat);

    coreNode.add(r1, r2, r3, nucleus);
    this.vxrRings.push(r1, r2, r3);
    this.vxrCoreGroup.add(coreNode);

    // 3. VXR Floating Architecture Terminal Screen
    const archScreenGroup = new THREE.Group();
    archScreenGroup.position.set(0, 1.8, 2.2);
    archScreenGroup.rotation.y = Math.PI; // Facing back into the room

    const screenTex = materials.createScreenTexture(
      'VXR // EXTENDED REALITY FRAMEWORK',
      'HIGH-LEVEL THREE.JS & WEBXR RUNTIME',
      undefined,
      [
        'Application  › User Simulation Logic',
        '   ↓',
        'XRApp        › Unified Engine Orchestrator',
        '   ↓',
        'XRScene · XRRenderer · XRSession · XRAssetManager',
        '   ↓',
        'Three.js WebGL + WebXR Device API',
      ],
      '#10b981',
      512,
      400
    );

    const screenMat = materials.createScreenMaterial(screenTex);

    const archScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), screenMat);
    archScreen.userData = {
      interactive: true,
      type: 'vxr',
      data: vxr,
      promptText: 'OPEN VXR CORE SPECIFICATION',
      glowTarget: archScreen,
    };
    this.interactiveMeshes.push(archScreen);

    // Stand for architecture screen
    const archStand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 0.1), materials.metalTrimMaterial);
    archStand.position.y = -0.8;
    archScreenGroup.add(archStand, archScreen);

    this.vxrCoreGroup.add(archScreenGroup);
    this.group.add(this.vxrCoreGroup);
  }

  /**
   * 3 Physical Display Stations for flagship projects:
   * 1. Virus Purge
   * 2. XR Model Viewer
   * 3. PC PUMA Operator Simulator
   */
  private buildProjectStations(): void {
    const projects = PORTFOLIO_DATA.projects;
    const flagshipIds = ['virus-purge', 'visor-xr', 'simulador-pcpuma'];

    const stationsConfig = [
      { id: 'virus-purge', pos: [-4.2, 0, -5.2], rotY: Math.PI / 6 },
      { id: 'visor-xr', pos: [4.2, 0, -5.2], rotY: -Math.PI / 6 },
      { id: 'simulador-pcpuma', pos: [6.2, 0, 1.8], rotY: -Math.PI / 2 },
    ];

    stationsConfig.forEach((cfg) => {
      const proj = projects.find((p) => p.id === cfg.id);
      if (proj) {
        const card = new ProjectCard3D(proj, cfg.pos as [number, number, number], cfg.rotY);
        this.projectCards.push(card);
        this.group.add(card.group);
        this.interactiveMeshes.push(...card.interactiveMeshes);
      }
    });
  }

  /**
   * The North wall features the full Developer Skill Matrix Wall
   */
  private buildDeveloperStackWall(): void {
    const wallGroup = new THREE.Group();
    wallGroup.position.set(0, 2.2, -7.7);

    const titleTex = materials.createScreenTexture(
      'ENGINEERING STACK & CAPABILITIES',
      'FULL-STACK · COMPUTER GRAPHICS · SPATIAL RUNTIMES',
      undefined,
      [
        'LANGUAGES: TypeScript, JavaScript, Python, C++, GLSL',
        'SPATIAL / 3D: Three.js, WebXR, WebGL, VXR Framework, Blender',
        'FRONTEND: React, Vue.js, Vite, Tailwind CSS, Next.js',
        'BACKEND / CLOUD: Node.js, Express, Docker, AWS, Alibaba Cloud',
        'PRACTICES: ITIL Service Delivery, Microservices, CI/CD',
      ],
      '#10b981',
      512,
      300
    );

    const titleMat = materials.createScreenMaterial(titleTex);

    const display = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.8), titleMat);
    display.userData = {
      interactive: true,
      type: 'skills',
      data: PORTFOLIO_DATA.skills,
      promptText: 'VIEW FULL TECHNICAL STACK & ARCHITECTURE',
      glowTarget: display,
    };
    this.interactiveMeshes.push(display);

    wallGroup.add(display);
    this.group.add(wallGroup);
  }

  public update(delta: number): void {
    // Animate VXR core rings
    if (this.vxrRings.length >= 3) {
      this.vxrRings[0].rotation.z += delta * 0.8;
      this.vxrRings[1].rotation.x += delta * 1.1;
      this.vxrRings[2].rotation.y += delta * 0.6;
    }

    // Animate project station holograms
    this.projectCards.forEach((card) => card.update(delta));
  }
}
