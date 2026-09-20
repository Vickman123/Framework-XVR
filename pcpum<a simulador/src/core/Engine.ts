import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type Updatable = (delta: number, elapsedTime: number) => void;

export class Engine {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly xrRig: THREE.Group;
  
  private clock: THREE.Clock;
  private updatables: Set<Updatable> = new Set();
  private container: HTMLElement;

  constructor(containerId: string = 'app') {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Contenedor DOM con id '${containerId}' no encontrado.`);
    }
    this.container = container;

    // 1. Reloj de alta precisión
    this.clock = new THREE.Clock();

    // 2. Escena 3D
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a111a);
    this.scene.fog = new THREE.FogExp2(0x0a111a, 0.028);

    // 3. Cámara en primera persona
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.05, 50);
    this.camera.position.set(0, 1.65, -1.2); // Altura de los ojos del operador
    this.camera.lookAt(0, 1.3, 0.5); // Mirando al mostrador

    // 4. Plataforma XR Rig para anclar la cámara y los mandos/manos
    this.xrRig = new THREE.Group();
    this.xrRig.name = 'XR_Rig';
    this.xrRig.add(this.camera);
    this.scene.add(this.xrRig);

    // 5. Renderer WebGL + WebXR calibrado para calidad cinematográfica RTX en móvil
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Penumbra suave estilo ray tracing
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; // Curva de respuesta fotográfica cinematográfica
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.xr.enabled = true; // Activar capacidad WebXR

    this.container.appendChild(this.renderer.domElement);

    // 6. Event listeners de redimensionamiento
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // 7. Iluminación IBL + Luces físicas
    this.setupLighting();

    // 8. Iniciar bucle de renderizado compatible con WebXR
    this.startLoop();
  }

  private setupLighting(): void {
    // 1. Image-Based Lighting (IBL) precalculado con RoomEnvironment:
    // Otorga a todos los materiales PBR reflejos Fresnel de estudio, brillo metálico realista y rebote difuso natural (0 costo por frame en Meta Quest)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    this.scene.environment = envTexture;
    this.scene.environmentIntensity = 0.92;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 2. Simulación de rebote de luz global (GI Bounced Light):
    // Luz superior blanco neutro institucional (5000K) + rebote difuso suave reflejado por el piso
    const hemiLight = new THREE.HemisphereLight(0xF8FAFC, 0xCBD5E1, 0.72);
    hemiLight.position.set(0, 3.2, 0);
    this.scene.add(hemiLight);

    // 3. Luz clave principal (Key Light) de techo sobre la zona de atención al cliente
    const keySpot = new THREE.SpotLight(0xFFFAF0, 3.0); // 4500K blanco cálido institucional
    keySpot.position.set(0, 3.15, 0.2);
    keySpot.target.position.set(0, 1.0, 0.15);
    keySpot.angle = Math.PI / 2.8;
    keySpot.penumbra = 0.65; // Transición gradual suave en bordes de sombra
    keySpot.castShadow = true;
    keySpot.shadow.mapSize.width = 1024;
    keySpot.shadow.mapSize.height = 1024;
    keySpot.shadow.camera.near = 0.4;
    keySpot.shadow.camera.far = 5.2;
    keySpot.shadow.bias = -0.0002;
    keySpot.shadow.normalBias = 0.035; // Crucial: elimina acné de sombras en personajes y superficies curvas
    keySpot.shadow.radius = 2.0; // Suavizado de penumbra tipo área de luz física
    this.scene.add(keySpot);
    this.scene.add(keySpot.target);

    // 4. Luces de relleno secundarias (Fill Lights) simulando los paneles LED de la sala (sin sombras = 0 impacto en Quest)
    // Relleno zona operador y muro UNAM
    const fillOperator = new THREE.DirectionalLight(0xE2E8F0, 0.42);
    fillOperator.position.set(-1.5, 3.0, -2.5);
    this.scene.add(fillOperator);

    // Relleno pasillo de entrada del estudiante
    const fillEntrance = new THREE.DirectionalLight(0xE8F0FE, 0.45);
    fillEntrance.position.set(1.5, 3.0, 2.8);
    this.scene.add(fillEntrance);

    // Luz de acento sutil en el mostrador para resaltar credenciales y laptops
    const counterAccent = new THREE.PointLight(0xFFFFFF, 0.5, 3.2, 1.4);
    counterAccent.position.set(0, 2.0, 0.0);
    this.scene.add(counterAccent);
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  public addUpdatable(fn: Updatable): void {
    this.updatables.add(fn);
  }

  public removeUpdatable(fn: Updatable): void {
    this.updatables.delete(fn);
  }

  private startLoop(): void {
    // setAnimationLoop es requerido para WebXR (funciona tanto en 2D como en visores XR)
    this.renderer.setAnimationLoop((_time, _frame) => {
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();

      // Ejecutar lógica de componentes actualizables
      for (const updatable of this.updatables) {
        updatable(delta, elapsed);
      }

      // Renderizar escena
      this.renderer.render(this.scene, this.camera);
    });
  }
}
