import * as THREE from 'three';
import { materials } from '../world/Materials.js';
import type { ProjectItem } from '../data/portfolioData.js';

export class ProjectCard3D {
  public group: THREE.Group = new THREE.Group();
  public screenMesh!: THREE.Mesh;
  public holoGroup: THREE.Group = new THREE.Group();
  public interactiveMeshes: THREE.Object3D[] = [];

  constructor(public project: ProjectItem, position: [number, number, number], rotationY: number = 0) {
    this.group.position.set(position[0], position[1], position[2]);
    this.group.rotation.y = rotationY;
    this.buildTerminal();
    this.buildHologram();
  }

  private buildTerminal(): void {
    // 1. Pedestal base
    const baseGeo = new THREE.BoxGeometry(1.6, 0.15, 1.2);
    const baseMesh = new THREE.Mesh(baseGeo, materials.metalTrimMaterial);
    baseMesh.position.y = 0.075;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // 2. Vertical stand pillar
    const pillarGeo = new THREE.BoxGeometry(0.4, 1.0, 0.3);
    const pillarMesh = new THREE.Mesh(pillarGeo, materials.darkPanelMaterial);
    pillarMesh.position.set(0, 0.6, 0);
    pillarMesh.castShadow = true;
    this.group.add(pillarMesh);

    // Subtle emissive vertical line on stand
    const stripGeo = new THREE.BoxGeometry(0.04, 0.9, 0.31);
    const stripMesh = new THREE.Mesh(stripGeo, materials.emissiveCyanMaterial);
    stripMesh.position.set(0, 0.6, 0);
    this.group.add(stripMesh);

    // 3. Angled monitor console frame
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(0, 1.25, 0.1);
    consoleGroup.rotation.x = -Math.PI / 8; // Angled upward comfortably for viewer

    const frameGeo = new THREE.BoxGeometry(1.9, 1.25, 0.08);
    const frameMesh = new THREE.Mesh(frameGeo, materials.metalTrimMaterial);
    frameMesh.castShadow = true;
    consoleGroup.add(frameMesh);

    // 4. Screen with dynamic CanvasTexture
    const screenTexture = materials.createScreenTexture(
      this.project.title,
      this.project.category,
      undefined,
      [
        `STACK: ${this.project.technologies.slice(0, 3).join(' · ')}`,
        this.project.description.slice(0, 75) + '...',
        `HIGHLIGHT: ${this.project.highlights[0] || 'WebXR Native'}`,
      ],
      this.project.color || '#00f0ff',
      512,
      340
    );

    const screenMaterial = materials.createScreenMaterial(screenTexture);

    const screenGeo = new THREE.PlaneGeometry(1.8, 1.15);
    this.screenMesh = new THREE.Mesh(screenGeo, screenMaterial);
    this.screenMesh.position.z = 0.045;

    // Attach interaction metadata to screen mesh
    this.screenMesh.userData = {
      interactive: true,
      type: 'project',
      data: this.project,
      promptText: `INSPECT ${this.project.title.toUpperCase()}`,
      glowTarget: this.screenMesh,
    };
    this.interactiveMeshes.push(this.screenMesh);

    consoleGroup.add(this.screenMesh);
    this.group.add(consoleGroup);
  }

  private buildHologram(): void {
    this.holoGroup.position.set(0, 2.3, 0);

    // Base holo projector emitter ring
    const ringGeo = new THREE.TorusGeometry(0.35, 0.02, 16, 32);
    const ringMesh = new THREE.Mesh(ringGeo, materials.emissiveCyanMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    this.holoGroup.add(ringMesh);

    // Custom 3D holographic model depending on project
    if (this.project.id === 'virus-purge') {
      // Viral pathogen sphere with spikes
      const coreGeo = new THREE.IcosahedronGeometry(0.3, 1);
      const holoMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      });
      const core = new THREE.Mesh(coreGeo, holoMat);
      core.name = 'holoCore';

      // Spikes
      for (let i = 0; i < 12; i++) {
        const spikeGeo = new THREE.ConeGeometry(0.04, 0.18, 6);
        const spikeMat = new THREE.MeshBasicMaterial({ color: 0xff3366, wireframe: true });
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        const phi = Math.acos(-1 + (2 * i) / 12);
        const theta = Math.sqrt(12 * Math.PI) * phi;
        spike.position.setFromSphericalCoords(0.32, phi, theta);
        spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spike.position.clone().normalize());
        core.add(spike);
      }
      this.holoGroup.add(core);
    } else if (this.project.id === 'visor-xr') {
      // 3D CAD Torus Knot wireframe
      const knotGeo = new THREE.TorusKnotGeometry(0.24, 0.07, 64, 16);
      const knotMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        wireframe: true,
        transparent: true,
        opacity: 0.75,
      });
      const knot = new THREE.Mesh(knotGeo, knotMat);
      knot.name = 'holoCore';
      this.holoGroup.add(knot);
    } else if (this.project.id === 'simulador-pcpuma') {
      // Virtual workstation console
      const lapGroup = new THREE.Group();
      lapGroup.name = 'holoCore';

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.02, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true })
      );
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.28, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
      );
      screen.position.set(0, 0.14, -0.15);
      screen.rotation.x = -0.2;
      lapGroup.add(base, screen);
      this.holoGroup.add(lapGroup);
    } else {
      // Default abstract geometric octahedron
      const octGeo = new THREE.OctahedronGeometry(0.28, 0);
      const octMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.7,
      });
      const oct = new THREE.Mesh(octGeo, octMat);
      oct.name = 'holoCore';
      this.holoGroup.add(oct);
    }

    this.group.add(this.holoGroup);
  }

  public update(delta: number): void {
    const core = this.holoGroup.getObjectByName('holoCore');
    if (core) {
      core.rotation.y += delta * 0.8;
      core.rotation.x += delta * 0.4;
      core.position.y = Math.sin(Date.now() * 0.002) * 0.05;
    }
  }
}
