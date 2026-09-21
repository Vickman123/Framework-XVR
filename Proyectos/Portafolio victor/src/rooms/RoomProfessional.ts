import * as THREE from 'three';
import { materials } from '../world/Materials.js';
import { PORTFOLIO_DATA, MetricItem, TimelineMilestone } from '../data/portfolioData.js';

export class RoomProfessional {
  public group: THREE.Group = new THREE.Group();
  public interactiveMeshes: THREE.Object3D[] = [];
  private serverLedMeshes: THREE.Mesh[] = [];

  constructor() {
    // Room is centered at [0, 0, -22]
    this.group.position.set(0, 0, -22);
    this.buildRoomArchitecture();
    this.buildMetricsWall();
    this.buildTimelineStations();
    this.buildServerRacks();
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

    // North Wall (Back)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.3), materials.wallMaterial);
    backWall.position.set(0, height / 2, -depth / 2);
    this.group.add(backWall);

    // East Wall (Right)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, depth), materials.wallMaterial);
    eastWall.position.set(width / 2, height / 2, 0);
    this.group.add(eastWall);

    // West Wall (Left)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, depth), materials.wallMaterial);
    westWall.position.set(-width / 2, height / 2, 0);
    this.group.add(westWall);

    // South Wall (Front with doorway opening)
    const leftFrontWall = new THREE.Mesh(new THREE.BoxGeometry((width - 3.6) / 2, height, 0.3), materials.wallMaterial);
    leftFrontWall.position.set(-(width / 4 + 0.9), height / 2, depth / 2);

    const rightFrontWall = new THREE.Mesh(new THREE.BoxGeometry((width - 3.6) / 2, height, 0.3), materials.wallMaterial);
    rightFrontWall.position.set(width / 4 + 0.9, height / 2, depth / 2);

    const overDoorWall = new THREE.Mesh(new THREE.BoxGeometry(3.6, height - 3.2, 0.3), materials.wallMaterial);
    overDoorWall.position.set(0, height - (height - 3.2) / 2, depth / 2);

    this.group.add(leftFrontWall, rightFrontWall, overDoorWall);

    // Emissive architectural crown strips
    const crownNorth = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.08, 0.1), materials.emissiveCyanMaterial);
    crownNorth.position.set(0, height - 0.2, -depth / 2 + 0.2);
    this.group.add(crownNorth);

    // Room overhead designation sign
    const signTex = materials.createScreenTexture(
      'ROOM 01 // ENTERPRISE IT & OPERATIONS',
      'PC PUMA / UNAM ITIL SERVICE CONTROL',
      undefined,
      ['SYSTEMS: HIGH AVAILABILITY', 'MONITORING: ACTIVE'],
      '#00f0ff',
      512,
      128
    );
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.8),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signMesh.position.set(0, 3.4, depth / 2 - 0.2);
    signMesh.rotation.y = Math.PI;
    this.group.add(signMesh);
  }

  /**
   * The North wall features 4 physical high-density wall-mounted displays
   */
  private buildMetricsWall(): void {
    const metrics = PORTFOLIO_DATA.metrics;
    const startX = -5.4;
    const spacing = 3.6;

    metrics.forEach((metric: MetricItem, idx: number) => {
      const x = startX + idx * spacing;
      const displayGroup = new THREE.Group();
      displayGroup.position.set(x, 2.0, -7.7);

      // Angled display backing frame
      const frameGeo = new THREE.BoxGeometry(3.2, 2.1, 0.15);
      const frame = new THREE.Mesh(frameGeo, materials.metalTrimMaterial);
      displayGroup.add(frame);

      // Screen canvas
      const screenTex = materials.createScreenTexture(
        `METRIC 0${idx + 1} // ${metric.category}`,
        metric.label,
        { val: metric.value, lbl: metric.label },
        [
          metric.description.slice(0, 50) + '...',
          'TAP [E] FOR FULL INFRASTRUCTURE IMPACT',
        ],
        '#00f0ff',
        512,
        340
      );

      const screenMat = materials.createScreenMaterial(screenTex);

      const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.9), screenMat);
      screen.position.z = 0.08;

      // Interaction data
      screen.userData = {
        interactive: true,
        type: 'metric',
        data: metric,
        promptText: `VIEW METRIC: ${metric.value} ${metric.label.toUpperCase()}`,
        glowTarget: screen,
      };
      this.interactiveMeshes.push(screen);

      displayGroup.add(screen);
      this.group.add(displayGroup);
    });
  }

  /**
   * The East wall hosts the physical career timeline (2022 -> 2026)
   */
  private buildTimelineStations(): void {
    const timeline = PORTFOLIO_DATA.timeline;
    const startZ = -5.5;
    const spacing = 2.8;

    timeline.forEach((milestone: TimelineMilestone, idx: number) => {
      const z = startZ + idx * spacing;
      const stationGroup = new THREE.Group();
      stationGroup.position.set(7.6, 0, z);
      stationGroup.rotation.y = -Math.PI / 2; // facing inward

      // Timeline Pedestal
      const ped = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.4), materials.darkPanelMaterial);
      ped.position.set(0, 0.5, 0);
      stationGroup.add(ped);

      // Glowing year tag
      const yearGeo = new THREE.BoxGeometry(0.6, 0.2, 0.42);
      const yearMesh = new THREE.Mesh(yearGeo, materials.emissiveCyanMaterial);
      yearMesh.position.set(-0.6, 0.95, 0);
      stationGroup.add(yearMesh);

      // Console screen
      const screenTex = materials.createScreenTexture(
        `${milestone.year} // ${milestone.organization}`,
        milestone.role,
        undefined,
        [
          milestone.description.slice(0, 60) + '...',
          `› ${milestone.highlights[0] || 'Leadership & Engineering'}`,
        ],
        '#00f0ff',
        512,
        300
      );

      const screenMat = materials.createScreenMaterial(screenTex);

      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), screenMat);
      screen.position.set(0, 1.6, -0.05);
      screen.rotation.x = -0.15;

      screen.userData = {
        interactive: true,
        type: 'timeline',
        data: milestone,
        promptText: `TIMELINE [${milestone.year}]: ${milestone.organization}`,
        glowTarget: screen,
      };
      this.interactiveMeshes.push(screen);

      stationGroup.add(screen);
      this.group.add(stationGroup);
    });
  }

  /**
   * The West wall features enterprise server racks with blinking diagnostic LEDs
   */
  private buildServerRacks(): void {
    const rackCount = 5;
    const startZ = -5.5;
    const spacing = 2.6;

    for (let i = 0; i < rackCount; i++) {
      const z = startZ + i * spacing;
      const rackGroup = new THREE.Group();
      rackGroup.position.set(-7.5, 0, z);
      rackGroup.rotation.y = Math.PI / 2;

      // Server rack chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.2, 0.8), materials.metalTrimMaterial);
      chassis.position.y = 1.6;
      rackGroup.add(chassis);

      // Dark glass door
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.0), materials.darkGlassMaterial);
      glass.position.set(0, 1.6, 0.41);
      rackGroup.add(glass);

      // Horizontal server blades inside rack
      for (let b = 0; b < 8; b++) {
        const bladeY = 0.5 + b * 0.32;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.7), materials.darkPanelMaterial);
        blade.position.set(0, bladeY, 0);
        rackGroup.add(blade);

        // Blinking LED dots on blade front
        const ledGeo = new THREE.BoxGeometry(0.04, 0.04, 0.02);
        const ledColor = Math.random() > 0.3 ? materials.emissiveCyanMaterial : materials.emissiveEmeraldMaterial;
        const led = new THREE.Mesh(ledGeo, ledColor);
        led.position.set(-0.6 + (b % 3) * 0.15, bladeY, 0.36);
        rackGroup.add(led);
        this.serverLedMeshes.push(led);
      }

      this.group.add(rackGroup);
    }
  }

  public update(delta: number): void {
    // Pulse server LEDs
    if (Math.random() < 0.1) {
      const idx = Math.floor(Math.random() * this.serverLedMeshes.length);
      const led = this.serverLedMeshes[idx];
      if (led) {
        led.visible = !led.visible;
      }
    }
  }
}
