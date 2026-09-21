import * as THREE from 'three';
import { materials } from '../world/Materials.js';
import { PORTFOLIO_DATA } from '../data/portfolioData.js';

export class RoomInnovation {
  public group: THREE.Group = new THREE.Group();
  public interactiveMeshes: THREE.Object3D[] = [];
  public earthMesh!: THREE.Mesh;
  public earthAtmosphere!: THREE.Mesh;
  public satelliteOrbitGroup: THREE.Group = new THREE.Group();
  public holoObjects: THREE.Group[] = [];

  constructor() {
    // Room is centered at [0, 0, 22]
    this.group.position.set(0, 0, 22);
    this.buildRoomArchitecture();
    this.buildEarthCenterpiece();
    this.buildSpaceTechStations();
  }

  private buildRoomArchitecture(): void {
    const width = 16;
    const depth = 16;
    const height = 4.8;

    // Floor
    const floorGeo = new THREE.BoxGeometry(width, 0.2, depth);
    const floor = new THREE.Mesh(floorGeo, materials.floorMaterial);
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling with starry viewport look
    const ceilingGeo = new THREE.BoxGeometry(width, 0.2, depth);
    const ceiling = new THREE.Mesh(ceilingGeo, materials.ceilingMaterial);
    ceiling.position.y = height + 0.1;
    this.group.add(ceiling);

    // South Wall (Back) - Grand Panoramic Aerospace Observation Window overlooking exterior forest
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0, 0, depth / 2);

    // Lower wainscot panel
    const lowerSill = new THREE.Mesh(new THREE.BoxGeometry(width, 0.85, 0.3), materials.wallMaterial);
    lowerSill.position.set(0, 0.425, 0);

    const sillLedge = new THREE.Mesh(new THREE.BoxGeometry(width + 0.1, 0.08, 0.38), materials.metalTrimMaterial);
    sillLedge.position.set(0, 0.85, 0);

    // Panoramic observation glass
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.2, 2.6), materials.windowGlassMaterial);
    glass.position.set(0, 2.15, -0.05);

    // Horizontal reinforcement rail at eye level
    const midRail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, 0.12), materials.metalTrimMaterial);
    midRail.position.set(0, 2.15, 0);

    // Upper bulkhead
    const upperBulk = new THREE.Mesh(new THREE.BoxGeometry(width, 0.75, 0.3), materials.wallMaterial);
    upperBulk.position.set(0, 3.825, 0);

    // Vertical structural mullions
    for (let x = -width / 2 + 2.6; x < width / 2; x += 2.6) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.18, height, 0.34), materials.metalTrimMaterial);
      mullion.position.set(x, height / 2, 0);
      windowGroup.add(mullion);
    }

    // Glowing accent strips
    const sillStrip = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.03, 0.05), materials.emissiveCyanMaterial);
    sillStrip.position.set(0, 0.89, -0.15);

    const topStrip = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.04, 0.05), materials.emissiveCyanMaterial);
    topStrip.position.set(0, 3.44, -0.15);

    windowGroup.add(lowerSill, sillLedge, glass, midRail, upperBulk, sillStrip, topStrip);
    this.group.add(windowGroup);

    // East Wall (Right)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, depth), materials.wallMaterial);
    eastWall.position.set(width / 2, height / 2, 0);
    this.group.add(eastWall);

    // West Wall (Left)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, depth), materials.wallMaterial);
    westWall.position.set(-width / 2, height / 2, 0);
    this.group.add(westWall);

    // North Wall (Front with doorway opening)
    const leftFrontWall = new THREE.Mesh(new THREE.BoxGeometry((width - 3.6) / 2, height, 0.3), materials.wallMaterial);
    leftFrontWall.position.set(-(width / 4 + 0.9), height / 2, -depth / 2);

    const rightFrontWall = new THREE.Mesh(new THREE.BoxGeometry((width - 3.6) / 2, height, 0.3), materials.wallMaterial);
    rightFrontWall.position.set(width / 4 + 0.9, height / 2, -depth / 2);

    const overDoorNorth = new THREE.Mesh(new THREE.BoxGeometry(3.6, height - 3.2, 0.3), materials.wallMaterial);
    overDoorNorth.position.set(0, height - (height - 3.2) / 2, -depth / 2);

    this.group.add(leftFrontWall, rightFrontWall, overDoorNorth);

    // Laboratory observation dome with cyan illuminated rim
    const skyDome = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 4.5, 0.05, 32),
      new THREE.MeshBasicMaterial({ color: 0x0c1524 })
    );
    skyDome.position.y = height - 0.05;

    const skyRing = new THREE.Mesh(
      new THREE.RingGeometry(4.35, 4.5, 32),
      materials.emissiveCyanMaterial
    );
    skyRing.rotation.x = Math.PI / 2;
    skyRing.position.y = height - 0.04;

    this.group.add(skyDome, skyRing);
  }

  /**
   * Centerpiece: 3D rotating Earth globe with atmosphere and orbiting satellites
   */
  private buildEarthCenterpiece(): void {
    const centerGroup = new THREE.Group();
    centerGroup.position.set(0, 0, 0);

    // Holographic Base Ring
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.5, 32);
    const baseMesh = new THREE.Mesh(baseGeo, materials.metalTrimMaterial);
    baseMesh.position.y = 0.25;
    baseMesh.castShadow = true;
    centerGroup.add(baseMesh);

    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.62, 0.03, 16, 48),
      materials.emissiveCyanMaterial
    );
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.5;
    centerGroup.add(baseRing);

    // 3D Earth Globe
    const { dayMap } = materials.createEarthTextures();
    const globeGeo = new THREE.SphereGeometry(1.1, 48, 48);
    const globeMat = new THREE.MeshStandardMaterial({
      map: dayMap,
      roughness: 0.6,
      metalness: 0.2,
      emissive: new THREE.Color(0x0a1c30),
      emissiveIntensity: 0.5,
    });

    this.earthMesh = new THREE.Mesh(globeGeo, globeMat);
    this.earthMesh.position.set(0, 2.3, 0);
    this.earthMesh.castShadow = true;

    // Outer atmospheric glow shell
    const atmoGeo = new THREE.SphereGeometry(1.15, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    this.earthAtmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    this.earthMesh.add(this.earthAtmosphere);

    // Orbital trajectory rings
    const orbit1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.65, 0.015, 12, 64),
      materials.emissiveCyanMaterial
    );
    orbit1.rotation.x = Math.PI / 3;
    orbit1.rotation.y = Math.PI / 6;

    const orbit2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.015, 12, 64),
      materials.emissiveAmberMaterial
    );
    orbit2.rotation.x = -Math.PI / 4;
    orbit2.rotation.y = -Math.PI / 5;

    this.satelliteOrbitGroup.position.set(0, 2.3, 0);
    this.satelliteOrbitGroup.add(orbit1, orbit2);

    // Micro satellite meshes orbiting
    const sat1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.06, 0.06),
      materials.metalTrimMaterial
    );
    sat1.position.set(1.65, 0, 0);
    orbit1.add(sat1);

    const sat2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.06, 0.06),
      materials.metalTrimMaterial
    );
    sat2.position.set(-1.9, 0, 0);
    orbit2.add(sat2);

    centerGroup.add(this.earthMesh);
    centerGroup.add(this.satelliteOrbitGroup);

    // Earth console interaction
    const earthScreenTex = materials.createScreenTexture(
      'ORBITAL TELEMETRY & EARTH OBSERVATION',
      'SPACE TECHNOLOGY & AEROSPACE SYSTEMS',
      undefined,
      [
        'ORBITAL TRACKING: LEO CONSTELLATIONS',
        'AGENCIA ESPACIAL MEXICANA: MISSION SYSTEMS',
        'SPACE TECH LABS: RESEARCH INITIATIVES',
      ],
      '#38bdf8',
      512,
      280
    );

    const earthScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 1.0),
      materials.createScreenMaterial(earthScreenTex)
    );
    earthScreen.position.set(0, 1.1, 1.8);
    earthScreen.rotation.x = -Math.PI / 6;

    earthScreen.userData = {
      interactive: true,
      type: 'project',
      data: PORTFOLIO_DATA.projects.find((p) => p.id === 'space-tech-labs'),
      promptText: 'INSPECT SPACE TECH LABS & ORBITAL RESEARCH',
      glowTarget: earthScreen,
    };
    this.interactiveMeshes.push(earthScreen);
    centerGroup.add(earthScreen);

    this.group.add(centerGroup);
  }

  /**
   * Holographic pedestals for Space Tech Labs, AEM, and GeoGPT
   */
  private buildSpaceTechStations(): void {
    const stations = [
      {
        id: 'space-tech-labs',
        pos: [-5.2, 0, 3.5],
        rotY: Math.PI / 4,
        proj: PORTFOLIO_DATA.projects.find((p) => p.id === 'space-tech-labs')!,
        color: '#38bdf8',
      },
      {
        id: 'aem-enmice',
        pos: [5.2, 0, 3.5],
        rotY: -Math.PI / 4,
        proj: PORTFOLIO_DATA.projects.find((p) => p.id === 'aem-enmice')!,
        color: '#818cf8',
      },
      {
        id: 'geogpt',
        pos: [0, 0, 6.2],
        rotY: Math.PI,
        proj: PORTFOLIO_DATA.projects.find((p) => p.id === 'geogpt')!,
        color: '#a855f7',
      },
    ];

    stations.forEach((st) => {
      const group = new THREE.Group();
      group.position.set(st.pos[0], st.pos[1], st.pos[2]);
      group.rotation.y = st.rotY;

      // Base pedestal
      const ped = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.8), materials.darkPanelMaterial);
      ped.position.y = 0.45;
      ped.castShadow = true;
      group.add(ped);

      // Angled display screen
      const screenTex = materials.createScreenTexture(
        st.proj.title,
        st.proj.category,
        undefined,
        [
          st.proj.description.slice(0, 60) + '...',
          `HIGHLIGHT: ${st.proj.highlights[0] || 'Scientific Platform'}`,
        ],
        st.color,
        512,
        320
      );

      const screenMat = materials.createScreenMaterial(screenTex);

      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), screenMat);
      screen.position.set(0, 1.45, 0.2);
      screen.rotation.x = -Math.PI / 8;

      screen.userData = {
        interactive: true,
        type: 'project',
        data: st.proj,
        promptText: `INSPECT ${st.proj.title.toUpperCase()}`,
        glowTarget: screen,
      };
      this.interactiveMeshes.push(screen);
      group.add(screen);

      // Floating 3D holographic object above terminal
      const holoObj = new THREE.Group();
      holoObj.position.set(0, 2.3, 0);

      if (st.id === 'space-tech-labs') {
        // Satellite dish / telescope wireframe
        const dish = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.05, 0.25, 16, 1, true),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true })
        );
        dish.rotation.x = Math.PI / 4;
        holoObj.add(dish);
      } else if (st.id === 'aem-enmice') {
        // Geometric rocket / mission marker
        const marker = new THREE.Mesh(
          new THREE.ConeGeometry(0.2, 0.6, 6),
          new THREE.MeshBasicMaterial({ color: 0x818cf8, wireframe: true })
        );
        holoObj.add(marker);
      } else {
        // GeoGPT: Nested neural sphere
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true })
        );
        holoObj.add(sphere);
      }

      holoObj.name = 'stationHolo';
      group.add(holoObj);
      this.holoObjects.push(holoObj);

      this.group.add(group);
    });
  }

  public update(delta: number): void {
    if (this.earthMesh) {
      this.earthMesh.rotation.y += delta * 0.12;
    }
    if (this.satelliteOrbitGroup) {
      this.satelliteOrbitGroup.rotation.y += delta * 0.25;
    }
    this.holoObjects.forEach((obj) => {
      obj.rotation.y += delta * 0.6;
      obj.position.y = 2.3 + Math.sin(Date.now() * 0.002) * 0.05;
    });
  }
}
