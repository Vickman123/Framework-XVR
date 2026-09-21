import * as THREE from 'three';
import { materials } from '../world/Materials.js';
import { PORTFOLIO_DATA, CertificationItem } from '../data/portfolioData.js';

export class RoomLab {
  public group: THREE.Group = new THREE.Group();
  public interactiveMeshes: THREE.Object3D[] = [];

  constructor() {
    // Room is centered at [-22, 0, 0]
    this.group.position.set(-22, 0, 0);
    this.buildRoomArchitecture();
    this.buildEducationStation();
    this.buildCertificationsWall();
    this.buildElectronicsWorkbench();
    this.buildEvolutionArchiveWall();
  }

  private buildRoomArchitecture(): void {
    const width = 16;
    const depth = 16;
    const height = 4.2;

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

    // West Wall (Far back left)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, depth), materials.wallMaterial);
    westWall.position.set(-width / 2, height / 2, 0);
    this.group.add(westWall);

    // North Wall (Back)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.3), materials.wallMaterial);
    northWall.position.set(0, height / 2, -depth / 2);
    this.group.add(northWall);

    // South Wall (Front)
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.3), materials.wallMaterial);
    southWall.position.set(0, height / 2, depth / 2);
    this.group.add(southWall);

    // East Wall (Entryway with doorway opening at center)
    const leftEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, (depth - 3.6) / 2), materials.wallMaterial);
    leftEastWall.position.set(width / 2, height / 2, -(depth / 4 + 0.9));

    const rightEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, (depth - 3.6) / 2), materials.wallMaterial);
    rightEastWall.position.set(width / 2, height / 2, depth / 4 + 0.9);

    const overDoorEast = new THREE.Mesh(new THREE.BoxGeometry(0.3, height - 3.2, 3.6), materials.wallMaterial);
    overDoorEast.position.set(width / 2, height - (height - 3.2) / 2, 0);

    this.group.add(leftEastWall, rightEastWall, overDoorEast);

    // Amber/Purple accent strips for experimental vibe
    const stripGeo = new THREE.BoxGeometry(width - 0.2, 0.06, 0.1);
    const strip = new THREE.Mesh(stripGeo, materials.emissiveAmberMaterial);
    strip.position.set(0, height - 0.2, -depth / 2 + 0.2);
    this.group.add(strip);
  }

  /**
   * Station for UPIICSA Computer Science Degree
   */
  private buildEducationStation(): void {
    const edu = PORTFOLIO_DATA.education;
    const eduGroup = new THREE.Group();
    eduGroup.position.set(-5.5, 0, -4.5);
    eduGroup.rotation.y = Math.PI / 4;

    // Pedestal
    const ped = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 0.6), materials.metalTrimMaterial);
    ped.position.y = 0.5;
    eduGroup.add(ped);

    // Screen
    const screenTex = materials.createScreenTexture(
      edu.degree,
      `${edu.institution} // ${edu.period}`,
      undefined,
      [
        'FOCUS: Advanced Software Engineering & Systems',
        'STATUS: Graduated with Professional Distinction',
        '› Distributed Systems · Database Architecture',
      ],
      '#a855f7',
      512,
      320
    );

    const screenMat = materials.createScreenMaterial(screenTex);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), screenMat);
    screen.position.set(0, 1.6, 0.1);
    screen.rotation.x = -Math.PI / 8;

    screen.userData = {
      interactive: true,
      type: 'education',
      data: edu,
      promptText: 'VIEW EDUCATION & ACADEMIC DOSSIER',
      glowTarget: screen,
    };
    this.interactiveMeshes.push(screen);

    eduGroup.add(screen);
    this.group.add(eduGroup);
  }

  /**
   * Wall with industry certifications: IBM, Cisco, Cloud, Alibaba
   */
  private buildCertificationsWall(): void {
    const certs = PORTFOLIO_DATA.certifications;
    const certsGroup = new THREE.Group();
    certsGroup.position.set(-7.7, 2.1, 1.5);
    certsGroup.rotation.y = Math.PI / 2;

    const certScreenTex = materials.createScreenTexture(
      'INDUSTRY CERTIFICATIONS & SPECIALIZATIONS',
      'VALIDATED COMPUTING CREDENTIALS',
      undefined,
      certs.map((c: CertificationItem) => `${c.year} · ${c.name} (${c.issuer})`),
      '#f59e0b',
      512,
      340
    );

    const certScreenMat = materials.createScreenMaterial(certScreenTex);

    const certScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), certScreenMat);
    certScreen.userData = {
      interactive: true,
      type: 'certifications',
      data: certs,
      promptText: 'VIEW CERTIFICATIONS & ACCREDITATIONS',
      glowTarget: certScreen,
    };
    this.interactiveMeshes.push(certScreen);

    certsGroup.add(certScreen);
    this.group.add(certsGroup);
  }

  /**
   * Electronics & Hardware Prototyping Workbench (IoT, ESP32, Robotics)
   */
  private buildElectronicsWorkbench(): void {
    const benchGroup = new THREE.Group();
    benchGroup.position.set(0, 0, 5.5);
    benchGroup.rotation.y = Math.PI;

    // Workbench Table
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.15, 1.4), materials.darkPanelMaterial);
    tableTop.position.y = 0.95;
    benchGroup.add(tableTop);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.95, 0.12);
    const legMat = materials.metalTrimMaterial;
    const legPositions = [
      [-1.7, 0.475, -0.55],
      [1.7, 0.475, -0.55],
      [-1.7, 0.475, 0.55],
      [1.7, 0.475, 0.55],
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      benchGroup.add(leg);
    });

    // Microcontroller board props on workbench
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.04, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.4 })
    );
    board.position.set(-0.6, 1.05, 0);
    benchGroup.add(board);

    // Oscilloscope / Diagnostic screen on bench
    const oscScreenTex = materials.createScreenTexture(
      'IOT & EMBEDDED HARDWARE LAB',
      'TELEMETRY · SENSORS · ROBOTICS',
      undefined,
      [
        'PROTOCOLS: UART, I2C, SPI, MQTT, WebSockets',
        'PLATFORMS: ESP32, Arduino, Raspberry Pi',
        'ROBOTICS: Actuators, telemetry feedback',
      ],
      '#10b981',
      512,
      280
    );

    const oscScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.9),
      materials.createScreenMaterial(oscScreenTex)
    );
    oscScreen.position.set(0.7, 1.5, -0.2);
    oscScreen.rotation.x = -0.15;

    oscScreen.userData = {
      interactive: true,
      type: 'iot',
      data: {
        title: 'IoT & Embedded Robotics',
        category: 'Hardware & Telemetry',
        badge: 'Experimental Prototyping',
        description:
          'Prototyping workbench exploring physical computing, microcontrollers (ESP32/Arduino), sensor networks, and real-time telemetry streaming into WebGL 3D environments.',
        highlights: [
          'Interfacing physical sensors with 3D digital twins',
          'Low-latency serial communication pipelines',
          'Embedded robotics and autonomous logic',
        ],
      },
      promptText: 'VIEW IOT & HARDWARE PROTOTYPES',
      glowTarget: oscScreen,
    };
    this.interactiveMeshes.push(oscScreen);

    benchGroup.add(oscScreen);
    this.group.add(benchGroup);
  }

  /**
   * The North wall features Victor's Professional Evolution Archive Wall
   */
  private buildEvolutionArchiveWall(): void {
    const archiveGroup = new THREE.Group();
    archiveGroup.position.set(0, 2.2, -7.7);

    const archiveTex = materials.createScreenTexture(
      'PROFESSIONAL EVOLUTION ARCHIVE',
      'RETROSPECTIVE & FUTURE HORIZONS',
      undefined,
      [
        '2020-2024 › Software Engineering Foundations at UPIICSA IPN',
        '2022-2023 › Systems Analysis & Aerospace Operations with AEM',
        '2024-2025 › Space Tech Labs & WebXR Engine Research',
        '2025-2026 › Enterprise UNAM IT Service Leadership & Digital Innovation',
        'FORWARD   › Pioneering Next-Generation Spatial Computing & WebXR',
      ],
      '#a855f7',
      512,
      320
    );

    const archiveScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 2.6),
      materials.createScreenMaterial(archiveTex)
    );

    archiveScreen.userData = {
      interactive: true,
      type: 'archive',
      data: {
        title: 'Professional Evolution Archive',
        category: 'Career Retrospective',
        badge: 'Narrative Archive',
        description:
          "A chronological trajectory demonstrating the convergence of enterprise software architecture, aerospace systems engineering, and cutting-edge WebXR spatial graphics. Victor's journey exemplifies bridging complex systems operations with immersive spatial computing.",
        highlights: [
          'Full lifecycle ownership from code to enterprise deployment',
          'Creator of open-source spatial computing frameworks',
          'Proven leadership coordinating multi-institutional stakeholders',
        ],
      },
      promptText: 'INSPECT PROFESSIONAL EVOLUTION ARCHIVE',
      glowTarget: archiveScreen,
    };
    this.interactiveMeshes.push(archiveScreen);

    archiveGroup.add(archiveScreen);
    this.group.add(archiveGroup);
  }

  public update(delta: number): void {
    // Subtle animations if needed
  }
}
