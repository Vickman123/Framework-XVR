import * as THREE from 'three';

export class LightingManager {
  public ambientLight!: THREE.AmbientLight;
  public dirLight!: THREE.DirectionalLight;
  public lightsGroup: THREE.Group = new THREE.Group();

  constructor() {
    this.initLighting();
  }

  private initLighting(): void {
    // 1. Balanced clean ambient light with zero glare (lets shadows and silhouettes define 3D geometry)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.15);
    this.lightsGroup.add(this.ambientLight);

    // 2. High-precision directional light casting soft contact shadows
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.position.set(6, 26, 6);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 60;
    this.dirLight.shadow.camera.left = -35;
    this.dirLight.shadow.camera.right = 35;
    this.dirLight.shadow.camera.top = 35;
    this.dirLight.shadow.camera.bottom = -35;
    this.dirLight.shadow.bias = -0.0003;
    this.lightsGroup.add(this.dirLight);

    // Soft fill directional light from opposite angle
    const fillLight = new THREE.DirectionalLight(0xdbe4ee, 0.6);
    fillLight.position.set(-8, 20, -8);
    this.lightsGroup.add(fillLight);

    // 3. Central Hub Lighting
    const hubDownlight = new THREE.PointLight(0xffffff, 1.8, 26, 0.8);
    hubDownlight.position.set(0, 4.0, 0);
    this.lightsGroup.add(hubDownlight);

    const hubCyanGlow = new THREE.PointLight(0x00f0ff, 1.4, 14, 1.0);
    hubCyanGlow.position.set(0, 2.2, 0);
    this.lightsGroup.add(hubCyanGlow);

    // Focused downlight onto the reception counter (Image 1 & 2)
    const deskSpot = new THREE.SpotLight(0xffffff, 2.8, 12, Math.PI / 4, 0.4, 1.0);
    deskSpot.position.set(0, 3.8, 1.6);
    deskSpot.target.position.set(0, 0.9, 0.2);
    this.lightsGroup.add(deskSpot);
    this.lightsGroup.add(deskSpot.target);

    // 4. Room 01 (Professional & IT Operations - North, [0, 0, -22])
    const r1CeilingLight = new THREE.PointLight(0xffffff, 1.8, 24, 0.8);
    r1CeilingLight.position.set(0, 3.8, -22);
    this.lightsGroup.add(r1CeilingLight);

    const r1MetricsLight = new THREE.SpotLight(0x00f0ff, 2.2, 18, Math.PI / 3, 0.3, 0.9);
    r1MetricsLight.position.set(0, 3.8, -19);
    r1MetricsLight.target.position.set(0, 2.0, -29.5);
    this.lightsGroup.add(r1MetricsLight);
    this.lightsGroup.add(r1MetricsLight.target);

    const r1RackLight = new THREE.PointLight(0x00f0ff, 1.5, 16, 1.0);
    r1RackLight.position.set(-6.0, 2.5, -22);
    this.lightsGroup.add(r1RackLight);

    const r1TimelineLight = new THREE.PointLight(0x38bdf8, 1.5, 16, 1.0);
    r1TimelineLight.position.set(6.0, 2.5, -22);
    this.lightsGroup.add(r1TimelineLight);

    // 5. Room 02 (Technology & Developer Lab - East, [22, 0, 0])
    const r2CeilingLight = new THREE.PointLight(0xffffff, 1.9, 24, 0.8);
    r2CeilingLight.position.set(22, 4.0, 0);
    this.lightsGroup.add(r2CeilingLight);

    const r2CoreGlow = new THREE.PointLight(0x00e676, 1.8, 16, 0.9);
    r2CoreGlow.position.set(22, 2.4, 0);
    this.lightsGroup.add(r2CoreGlow);

    const r2Station1 = new THREE.PointLight(0x00f0ff, 1.5, 14, 1.0);
    r2Station1.position.set(17.8, 3.0, -5.2);
    this.lightsGroup.add(r2Station1);

    const r2Station2 = new THREE.PointLight(0x00e676, 1.5, 14, 1.0);
    r2Station2.position.set(26.2, 3.0, -5.2);
    this.lightsGroup.add(r2Station2);

    const r2StackWall = new THREE.PointLight(0xffffff, 1.5, 14, 1.0);
    r2StackWall.position.set(22, 3.0, -7.0);
    this.lightsGroup.add(r2StackWall);

    // 6. Room 03 (Innovation & Aerospace - South, [0, 0, 22])
    const r3CeilingLight = new THREE.PointLight(0xffffff, 1.8, 24, 0.8);
    r3CeilingLight.position.set(0, 4.2, 22);
    this.lightsGroup.add(r3CeilingLight);

    const r3EarthLight = new THREE.PointLight(0x38bdf8, 2.0, 16, 0.9);
    r3EarthLight.position.set(0, 2.4, 22);
    this.lightsGroup.add(r3EarthLight);

    const r3StationsLight = new THREE.PointLight(0x818cf8, 1.5, 16, 1.0);
    r3StationsLight.position.set(0, 3.2, 26);
    this.lightsGroup.add(r3StationsLight);

    // 7. Room 04 (Experimental Lab - West, [-22, 0, 0])
    const r4CeilingLight = new THREE.PointLight(0xffffff, 1.8, 24, 0.8);
    r4CeilingLight.position.set(-22, 3.8, 0);
    this.lightsGroup.add(r4CeilingLight);

    const r4WorkbenchLight = new THREE.PointLight(0xffb300, 1.8, 14, 1.0);
    r4WorkbenchLight.position.set(-22, 3.0, 5.5);
    this.lightsGroup.add(r4WorkbenchLight);

    const r4CertsLight = new THREE.PointLight(0xa855f7, 1.8, 16, 1.0);
    r4CertsLight.position.set(-27.5, 2.8, 0);
    this.lightsGroup.add(r4CertsLight);

    // 8. Corridors & Airlocks
    this.createCorridorLight([0, 3.2, -11.5], 0x00f0ff);  // North Corridor
    this.createCorridorLight([11.0, 3.2, 0], 0x00e676);   // East Corridor
    this.createCorridorLight([0, 3.2, 11.5], 0x38bdf8);   // South Corridor
    this.createCorridorLight([-11.0, 3.2, 0], 0xa855f7);  // West Corridor
  }

  private createCorridorLight(pos: [number, number, number], color: number): void {
    const whiteDown = new THREE.PointLight(0xffffff, 1.6, 14, 0.8);
    whiteDown.position.set(pos[0], pos[1], pos[2]);
    this.lightsGroup.add(whiteDown);

    const accent = new THREE.PointLight(color, 1.2, 10, 1.1);
    accent.position.set(pos[0], pos[1] - 0.4, pos[2]);
    this.lightsGroup.add(accent);
  }
}
