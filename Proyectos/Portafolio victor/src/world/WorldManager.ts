import * as THREE from 'three';
import { materials } from './Materials.js';
import { CentralHub } from '../rooms/CentralHub.js';
import { RoomProfessional } from '../rooms/RoomProfessional.js';
import { RoomTechnology } from '../rooms/RoomTechnology.js';
import { RoomInnovation } from '../rooms/RoomInnovation.js';
import { RoomLab } from '../rooms/RoomLab.js';
import { DoorSystem } from '../interaction/DoorSystem.js';
import { PORTFOLIO_DATA } from '../data/portfolioData.js';

export interface RoomZoneInfo {
  id: string;
  name: string;
  code: string;
  center: THREE.Vector3;
}

export class WorldManager {
  public rootGroup: THREE.Group = new THREE.Group();
  public centralHub: CentralHub;
  public roomProfessional: RoomProfessional;
  public roomTechnology: RoomTechnology;
  public roomInnovation: RoomInnovation;
  public roomLab: RoomLab;
  public doorSystem: DoorSystem;
  public interactiveMeshes: THREE.Object3D[] = [];

  // Exit Terminal
  public exitTerminalMesh!: THREE.Mesh;

  public roomsInfo: RoomZoneInfo[] = [
    { id: 'hub', name: 'CENTRAL OPERATIONS HUB', code: 'ZONE 00', center: new THREE.Vector3(0, 1.6, 0) },
    { id: 'professional', name: 'ROOM 01 // PROFESSIONAL & IT OPERATIONS', code: 'ZONE 01', center: new THREE.Vector3(0, 1.6, -22) },
    { id: 'technology', name: 'ROOM 02 // TECHNOLOGY & DEVELOPER LAB', code: 'ZONE 02', center: new THREE.Vector3(22, 1.6, 0) },
    { id: 'innovation', name: 'ROOM 03 // INNOVATION & SPACE SYSTEMS', code: 'ZONE 03', center: new THREE.Vector3(0, 1.6, 22) },
    { id: 'lab', name: 'ROOM 04 // EXPERIMENTAL RESEARCH LAB', code: 'ZONE 04', center: new THREE.Vector3(-22, 1.6, 0) },
  ];

  constructor() {
    this.doorSystem = new DoorSystem();
    this.centralHub = new CentralHub();
    this.roomProfessional = new RoomProfessional();
    this.roomTechnology = new RoomTechnology();
    this.roomInnovation = new RoomInnovation();
    this.roomLab = new RoomLab();

    this.assembleWorld();
    this.buildExteriorNature();
    this.buildCorridors();
    this.buildExitTerminal();
    this.registerDoors();
    this.collectInteractables();
  }

  private assembleWorld(): void {
    this.rootGroup.add(this.centralHub.group);
    this.rootGroup.add(this.roomProfessional.group);
    this.rootGroup.add(this.roomTechnology.group);
    this.rootGroup.add(this.roomInnovation.group);
    this.rootGroup.add(this.roomLab.group);
    this.rootGroup.add(this.doorSystem.doorsGroup);
  }

  /**
   * Creates 3D lush green terrain and stylized trees visible through all laboratory observation windows
   */
  private buildExteriorNature(): void {
    const natureGroup = new THREE.Group();

    // 1. Expansive Lush Green Grass Terrain Plane
    const terrainGeo = new THREE.RingGeometry(9.3, 130, 48, 8);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x1e5631, // Deep vibrant lawn & meadow green
      roughness: 0.85,
      metalness: 0.05,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.05;
    terrain.receiveShadow = true;
    natureGroup.add(terrain);

    // 2. Procedural 3D stylized trees positioned outside window bays
    const treeTrunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.8, 8);
    const treeTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.9,
    });

    const coneGeo1 = new THREE.ConeGeometry(1.7, 2.4, 8);
    const coneGeo2 = new THREE.ConeGeometry(1.3, 1.9, 8);
    const coneGeo3 = new THREE.ConeGeometry(0.9, 1.4, 8);

    const foliageColors = [0x16a34a, 0x22c55e, 0x15803d, 0x166534, 0x4ade80];

    // Tree positions scattered around the 4 Central Hub window bays (NE, SE, SW, NW) and along corridors
    const treePositions: [number, number][] = [
      // NE Window Bay (x > 0, z < 0)
      [14, -14], [18, -12], [22, -18], [12, -20], [16, -26], [24, -22],
      // SE Window Bay (x > 0, z > 0)
      [14, 14], [19, 13], [23, 19], [13, 21], [17, 27], [25, 23],
      // SW Window Bay (x < 0, z > 0)
      [-14, 14], [-18, 13], [-23, 19], [-13, 21], [-17, 27], [-25, 23],
      // NW Window Bay (x < 0, z < 0)
      [-14, -14], [-18, -12], [-22, -18], [-12, -20], [-16, -26], [-24, -22],
      // Corridors & Wing viewports
      [7, -12], [-7, -12], [7, 12], [-7, 12],
      [12, -6], [12, 6], [-12, -6], [-12, 6],
      [0, -32], [4, -34], [-4, -34],
      [0, 32], [4, 34], [-4, 34],
    ];

    treePositions.forEach(([tx, tz], i) => {
      const tree = new THREE.Group();
      const scale = 0.85 + ((i * 7) % 5) * 0.1;
      tree.position.set(tx, 0, tz);
      tree.scale.set(scale, scale, scale);

      // Trunk
      const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
      trunk.position.y = 1.4;
      trunk.castShadow = true;
      tree.add(trunk);

      // 3 layered foliage cones
      const col1 = foliageColors[i % foliageColors.length];
      const col2 = foliageColors[(i + 1) % foliageColors.length];
      const col3 = foliageColors[(i + 2) % foliageColors.length];

      const c1 = new THREE.Mesh(coneGeo1, new THREE.MeshStandardMaterial({ color: col1, roughness: 0.7 }));
      c1.position.y = 2.8;
      c1.castShadow = true;

      const c2 = new THREE.Mesh(coneGeo2, new THREE.MeshStandardMaterial({ color: col2, roughness: 0.7 }));
      c2.position.y = 4.0;
      c2.castShadow = true;

      const c3 = new THREE.Mesh(coneGeo3, new THREE.MeshStandardMaterial({ color: col3, roughness: 0.7 }));
      c3.position.y = 5.0;
      c3.castShadow = true;

      tree.add(c1, c2, c3);
      natureGroup.add(tree);
    });

    this.rootGroup.add(natureGroup);
  }

  private buildCorridors(): void {
    // 4 Corridors connecting Hub to each room
    const corridorsConfig = [
      { name: 'North Corridor', pos: [0, 0, -11.5], size: [3.4, 3.6, 6.0], rotY: 0 },
      { name: 'East Corridor', pos: [11.0, 0, 0], size: [3.4, 3.6, 5.0], rotY: Math.PI / 2 },
      { name: 'South Corridor', pos: [0, 0, 11.5], size: [3.4, 3.6, 6.0], rotY: 0 },
      { name: 'West Corridor', pos: [-11.0, 0, 0], size: [3.4, 3.6, 5.0], rotY: Math.PI / 2 },
    ];

    corridorsConfig.forEach((cfg) => {
      const corrGroup = new THREE.Group();
      corrGroup.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      corrGroup.rotation.y = cfg.rotY;

      const [w, h, d] = cfg.size;

      // Floor
      const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.floorMaterial);
      floor.position.y = -0.1;
      corrGroup.add(floor);

      // Ceiling
      const ceiling = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), materials.ceilingMaterial);
      ceiling.position.y = h + 0.1;
      corrGroup.add(ceiling);

      // Left Wall with Panoramic Forest Windows
      const leftLower = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, d), materials.wallMaterial);
      leftLower.position.set(-w / 2, 0.425, 0);

      const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(d, 2.0), materials.windowGlassMaterial);
      leftGlass.rotation.y = Math.PI / 2;
      leftGlass.position.set(-w / 2 + 0.05, 1.85, 0);

      const leftUpper = new THREE.Mesh(new THREE.BoxGeometry(0.3, h - 2.85, d), materials.wallMaterial);
      leftUpper.position.set(-w / 2, 2.85 + (h - 2.85) / 2, 0);

      const leftSill = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, d), materials.emissiveCyanMaterial);
      leftSill.position.set(-w / 2 + 0.1, 0.86, 0);

      // Right Wall with Panoramic Forest Windows
      const rightLower = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.85, d), materials.wallMaterial);
      rightLower.position.set(w / 2, 0.425, 0);

      const rightGlass = new THREE.Mesh(new THREE.PlaneGeometry(d, 2.0), materials.windowGlassMaterial);
      rightGlass.rotation.y = -Math.PI / 2;
      rightGlass.position.set(w / 2 - 0.05, 1.85, 0);

      const rightUpper = new THREE.Mesh(new THREE.BoxGeometry(0.3, h - 2.85, d), materials.wallMaterial);
      rightUpper.position.set(w / 2, 2.85 + (h - 2.85) / 2, 0);

      const rightSill = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, d), materials.emissiveCyanMaterial);
      rightSill.position.set(w / 2 - 0.1, 0.86, 0);

      // Structural frame mullions along corridors
      for (let z = -d / 2; z <= d / 2; z += 1.5) {
        const postL = new THREE.Mesh(new THREE.BoxGeometry(0.34, h, 0.16), materials.metalTrimMaterial);
        postL.position.set(-w / 2, h / 2, z);
        const postR = new THREE.Mesh(new THREE.BoxGeometry(0.34, h, 0.16), materials.metalTrimMaterial);
        postR.position.set(w / 2, h / 2, z);
        corrGroup.add(postL, postR);
      }

      corrGroup.add(leftLower, leftGlass, leftUpper, leftSill, rightLower, rightGlass, rightUpper, rightSill);

      // Central industrial runway track (Image 1 & 3)
      const runway = new THREE.Mesh(new THREE.PlaneGeometry(0.6, d), materials.runwayStripeMaterial);
      runway.rotation.x = -Math.PI / 2;
      runway.position.y = 0.012;

      const leftTrack = new THREE.Mesh(new THREE.PlaneGeometry(0.04, d), materials.emissiveCyanMaterial);
      leftTrack.rotation.x = -Math.PI / 2;
      leftTrack.position.set(-0.34, 0.015, 0);

      const rightTrack = new THREE.Mesh(new THREE.PlaneGeometry(0.04, d), materials.emissiveCyanMaterial);
      rightTrack.rotation.x = -Math.PI / 2;
      rightTrack.position.set(0.34, 0.015, 0);

      corrGroup.add(runway, leftTrack, rightTrack);
      this.rootGroup.add(corrGroup);
    });
  }

  private buildExitTerminal(): void {
    // Dedicated Exit & Contact Terminal kiosk in the Central Hub area
    const exitGroup = new THREE.Group();
    exitGroup.position.set(0, 0, 6.2);
    exitGroup.rotation.y = Math.PI; // Facing inward toward center

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.5), materials.metalTrimMaterial);
    base.position.y = 0.45;
    exitGroup.add(base);

    const screenTex = materials.createScreenTexture(
      'FACILITY EXIT TERMINAL',
      'VICTOR CARREÑO // CONTACT DOSSIER',
      undefined,
      [
        'LINKEDIN: linkedin.com/in/victorcarg',
        'GITHUB:   github.com/Vickman123',
        'EMAIL:    victorcarg@gmail.com',
        '[ E ] OPEN EXECUTIVE CONTACT DOSSIER',
      ],
      '#00f0ff',
      512,
      300
    );

    const screenMat = materials.createScreenMaterial(screenTex);

    this.exitTerminalMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), screenMat);
    this.exitTerminalMesh.position.set(0, 1.4, 0.05);
    this.exitTerminalMesh.rotation.x = -Math.PI / 8;

    this.exitTerminalMesh.userData = {
      interactive: true,
      type: 'exit',
      data: PORTFOLIO_DATA.profile,
      promptText: 'OPEN EXIT TERMINAL & CONTACT DOSSIER',
      glowTarget: this.exitTerminalMesh,
    };
    this.interactiveMeshes.push(this.exitTerminalMesh);

    exitGroup.add(this.exitTerminalMesh);
    this.rootGroup.add(exitGroup);
  }

  private registerDoors(): void {
    // 4 Airlock doors at the boundaries of Central Hub and Corridors with illuminated signs
    this.doorSystem.createAirlock({
      id: 'door-room1',
      roomCode: 'ROOM 01',
      title: 'PROFESSIONAL & IT OPERATIONS',
      subtitle: 'UNAM PC PUMA · NOC LEADERSHIP · 300K+ USERS',
      category: 'ENTERPRISE SYSTEMS & INFRASTRUCTURE',
      accentHex: '#00f0ff',
      accentMaterial: materials.emissiveCyanMaterial,
      clearance: 'CLEARANCE: LEVEL 01',
      highlights: [
        'UNAM PC PUMA Operations Lead',
        '300,000+ Active Users Infrastructure',
        '72 Campuses High-Availability NOC',
        '6,000+ Enterprise Systems & Servers',
      ],
      position: [0, 0, -9.0],
      rotationY: 0,
    });

    this.doorSystem.createAirlock({
      id: 'door-room2',
      roomCode: 'ROOM 02',
      title: 'TECHNOLOGY & SPATIAL COMPUTING',
      subtitle: 'VXR FRAMEWORK · WEBXR ENGINES · THREE.JS',
      category: 'SPATIAL COMPUTING & GAME ENGINES',
      accentHex: '#00e676',
      accentMaterial: materials.emissiveEmeraldMaterial,
      clearance: 'CLEARANCE: LEVEL 02',
      highlights: [
        'VXR Open-Source WebXR Framework',
        'Virus Purge 3D FPS WebXR Game',
        'Interactive 3D Model Inspection Viewer',
        'PC PUMA High-Fidelity Operator Sim',
      ],
      position: [9.0, 0, 0],
      rotationY: -Math.PI / 2,
    });

    this.doorSystem.createAirlock({
      id: 'door-room3',
      roomCode: 'ROOM 03',
      title: 'INNOVATION & AEROSPACE',
      subtitle: 'AGENCIA ESPACIAL MEXICANA · SATELLITES · AI',
      category: 'AEROSPACE & GEOSPATIAL INTELLIGENCE',
      accentHex: '#38bdf8',
      accentMaterial: materials.emissiveCyanMaterial,
      clearance: 'CLEARANCE: LEVEL 03',
      highlights: [
        'Agencia Espacial Mexicana (AEM) ENMICE',
        'Space Tech Labs Lead Developer',
        'Orbital Satellite Telemetry Visualizer',
        'GeoGPT Geospatial AI Exploration',
      ],
      position: [0, 0, 9.0],
      rotationY: Math.PI,
    });

    this.doorSystem.createAirlock({
      id: 'door-room4',
      roomCode: 'ROOM 04',
      title: 'EXPERIMENTAL LAB & ARCHIVE',
      subtitle: 'UPIICSA IPN · CERTIFICATIONS · IOT HARDWARE',
      category: 'ACADEMIA, CERTIFICATIONS & HARDWARE',
      accentHex: '#f59e0b',
      accentMaterial: materials.emissiveAmberMaterial,
      clearance: 'CLEARANCE: LEVEL 04',
      highlights: [
        'IPN UPIICSA Computer Systems Engineering',
        'IBM, Cisco, Cloud & Cyber Certifications',
        'IoT Hardware, ESP32 & Robotics Bench',
        'Evolution Archive & Early XR Prototypes',
      ],
      position: [-9.0, 0, 0],
      rotationY: Math.PI / 2,
    });
  }

  private collectInteractables(): void {
    this.interactiveMeshes.push(...this.centralHub.interactiveMeshes);
    this.interactiveMeshes.push(...this.roomProfessional.interactiveMeshes);
    this.interactiveMeshes.push(...this.roomTechnology.interactiveMeshes);
    this.interactiveMeshes.push(...this.roomInnovation.interactiveMeshes);
    this.interactiveMeshes.push(...this.roomLab.interactiveMeshes);
    this.interactiveMeshes.push(...this.doorSystem.interactiveMeshes);
  }

  /**
   * Identifies which room/zone the player is currently in
   */
  public getCurrentZone(playerPos: THREE.Vector3): RoomZoneInfo {
    const x = playerPos.x;
    const z = playerPos.z;

    if (z <= -13) {
      return this.roomsInfo[1]; // Room 01: Professional
    } else if (x >= 13) {
      return this.roomsInfo[2]; // Room 02: Technology
    } else if (z >= 13) {
      return this.roomsInfo[3]; // Room 03: Innovation
    } else if (x <= -13) {
      return this.roomsInfo[4]; // Room 04: Lab
    }
    return this.roomsInfo[0]; // Central Hub
  }

  /**
   * Robust boundary collision checking ensuring the player stays inside walkable bounds
   */
  public clampPosition(currentPos: THREE.Vector3, proposedPos: THREE.Vector3): THREE.Vector3 {
    const x = proposedPos.x;
    const z = proposedPos.z;
    const r = 0.45; // player radius

    // Zone 1: Central Hub (Circle around 0,0 radius ~8.8)
    const distFromOrigin = Math.sqrt(x * x + z * z);
    if (distFromOrigin <= 8.5) {
      return proposedPos;
    }

    // Corridor North: X in [-1.5, 1.5], Z in [-14.5, -8.0]
    if (Math.abs(x) <= 1.5 && z <= -8.0 && z >= -14.5) {
      return proposedPos;
    }

    // Room 01 (North): X in [-7.2, 7.2], Z in [-29.2, -14.0]
    if (Math.abs(x) <= 7.2 && z <= -14.0 && z >= -29.2) {
      return proposedPos;
    }

    // Corridor East: Z in [-1.5, 1.5], X in [8.0, 13.5]
    if (Math.abs(z) <= 1.5 && x >= 8.0 && x <= 13.5) {
      return proposedPos;
    }

    // Room 02 (East): X in [13.0, 30.2], Z in [-7.2, 7.2]
    if (x >= 13.0 && x <= 30.2 && Math.abs(z) <= 7.2) {
      return proposedPos;
    }

    // Corridor South: X in [-1.5, 1.5], Z in [8.0, 14.5]
    if (Math.abs(x) <= 1.5 && z >= 8.0 && z <= 14.5) {
      return proposedPos;
    }

    // Room 03 (South): X in [-7.2, 7.2], Z in [14.0, 29.2]
    if (Math.abs(x) <= 7.2 && z >= 14.0 && z <= 29.2) {
      return proposedPos;
    }

    // Corridor West: Z in [-1.5, 1.5], X in [-13.5, -8.0]
    if (Math.abs(z) <= 1.5 && x <= -8.0 && x >= -13.5) {
      return proposedPos;
    }

    // Room 04 (West): X in [-29.2, -13.0], Z in [-7.2, 7.2]
    if (x <= -13.0 && x >= -29.2 && Math.abs(z) <= 7.2) {
      return proposedPos;
    }

    // If out of bounds, slide along axes or retain current valid position
    const tryX = new THREE.Vector3(proposedPos.x, proposedPos.y, currentPos.z);
    if (this.isWalkable(tryX)) return tryX;

    const tryZ = new THREE.Vector3(currentPos.x, proposedPos.y, proposedPos.z);
    if (this.isWalkable(tryZ)) return tryZ;

    return currentPos.clone();
  }

  private isWalkable(pos: THREE.Vector3): boolean {
    const x = pos.x;
    const z = pos.z;
    if (Math.sqrt(x * x + z * z) <= 8.5) return true;
    if (Math.abs(x) <= 1.5 && z <= -8.0 && z >= -14.5) return true;
    if (Math.abs(x) <= 7.2 && z <= -14.0 && z >= -29.2) return true;
    if (Math.abs(z) <= 1.5 && x >= 8.0 && x <= 13.5) return true;
    if (x >= 13.0 && x <= 30.2 && Math.abs(z) <= 7.2) return true;
    if (Math.abs(x) <= 1.5 && z >= 8.0 && z <= 14.5) return true;
    if (Math.abs(x) <= 7.2 && z >= 14.0 && z <= 29.2) return true;
    if (Math.abs(z) <= 1.5 && x <= -8.0 && x >= -13.5) return true;
    if (x <= -13.0 && x >= -29.2 && Math.abs(z) <= 7.2) return true;
    return false;
  }

  public update(playerPos: THREE.Vector3, delta: number): void {
    this.centralHub.update(delta);
    this.roomProfessional.update(delta);
    this.roomTechnology.update(delta);
    this.roomInnovation.update(delta);
    this.roomLab.update(delta);
    this.doorSystem.update(playerPos, delta);
  }
}
