import * as THREE from 'three';
import { materials } from '../world/Materials.js';
import { LightingManager } from '../world/Lighting.js';
import { WorldManager } from '../world/WorldManager.js';
import { PlayerController } from '../player/PlayerController.js';
import { InteractionSystem } from '../interaction/InteractionSystem.js';
import { WebXRManager } from '../xr/WebXRManager.js';
import { ModalManager } from '../ui/ModalManager.js';
import { HUD } from '../ui/HUD.js';
import { MobileControls } from '../ui/MobileControls.js';

export class Engine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public lighting: LightingManager;
  public worldManager: WorldManager;
  public playerController: PlayerController;
  public interactionSystem: InteractionSystem;
  public webxrManager: WebXRManager;
  public modalManager: ModalManager;
  public hud: HUD;
  public mobileControls: MobileControls;

  private clock: THREE.Clock = new THREE.Clock();

  constructor() {
    // 1. Core Three.js Scene & Camera setup
    this.scene = new THREE.Scene();

    // High-resolution procedural blue sky and vibrant green landscape (4096x2048, completely sharp, zero pixelation)
    const landscapeTexture = materials.createProceduralLandscapeTexture();
    this.scene.background = landscapeTexture;
    this.scene.environment = landscapeTexture;

    // Physical sky sphere with inverted scale for 100% reliable rendering through glass windows in all viewports & WebXR
    const skyGeo = new THREE.SphereGeometry(140, 64, 40);
    skyGeo.scale(-1, 1, 1);
    const skyMat = new THREE.MeshBasicMaterial({
      map: landscapeTexture,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    skyMesh.position.set(0, 14, 0); // Aligns the green horizon and rolling hills with window height
    skyMesh.rotation.y = Math.PI * 0.72; // Directs radiant sunlight through the observation windows
    this.scene.add(skyMesh);

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );

    // 2. High-Fidelity WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    const container = document.getElementById('canvas-container');
    if (container) {
      container.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }

    // 3. World & Subsystems Initialization
    this.lighting = new LightingManager();
    this.scene.add(this.lighting.lightsGroup);

    this.worldManager = new WorldManager();
    this.scene.add(this.worldManager.rootGroup);

    this.playerController = new PlayerController(this.camera, this.renderer.domElement, this.worldManager);
    this.interactionSystem = new InteractionSystem(this.camera, this.renderer.domElement);
    this.interactionSystem.setCandidates(this.worldManager.interactiveMeshes);

    this.webxrManager = new WebXRManager(this.renderer, this.scene, this.camera, this.worldManager);

    this.modalManager = new ModalManager();
    this.modalManager.setDependencies(this.playerController, this.worldManager);

    this.hud = new HUD();
    this.hud.setDependencies(this.playerController, this.worldManager);

    this.mobileControls = new MobileControls(this.playerController);

    // Connect interactions to modal manager
    this.interactionSystem.onInteract((_mesh, data) => {
      this.modalManager.open(data.type, data.data);
    });

    this.webxrManager.onVRInteract((_mesh, data) => {
      this.modalManager.open(data.type, data.data);
    });

    this.bindWindowResize();
  }

  private bindWindowResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public start(): void {
    this.clock.start();
    this.renderer.setAnimationLoop(() => this.render());
  }

  private render(): void {
    const delta = Math.min(this.clock.getDelta(), 0.1); // clamp delta against hitching

    if (!this.webxrManager.isPresenting) {
      // Desktop / Mobile First Person update
      if (!this.modalManager.isOpen) {
        this.playerController.update(delta);
      }
    } else {
      // WebXR VR mode update
      this.webxrManager.update(delta);
    }

    // Update 3D World (airlock doors, Earth globe, VXR core gyroscope, project holograms)
    const effectivePos = this.webxrManager.isPresenting
      ? this.webxrManager.xrRig.position
      : this.playerController.position;

    this.worldManager.update(effectivePos, delta);

    // Raycast interaction
    if (!this.webxrManager.isPresenting && !this.modalManager.isOpen) {
      this.interactionSystem.update();
    }

    // HUD update
    this.hud.update();

    // Render frame
    this.renderer.render(this.scene, this.camera);
  }
}
