import * as THREE from 'three';
import { Engine } from './core/Engine';
import { XRManager } from './xr/XRManager';
import { Room } from './environment/Room';
import { Counter } from './environment/Counter';
import { StorageCart } from './environment/StorageCart';
import { ComputerPlaceholder } from './entities/ComputerPlaceholder';
import { Laptop } from './entities/Laptop';
import { Credential } from './entities/Credential';
import { NFCScanner } from './entities/NFCScanner';
import { audio } from './audio/AudioManager';
import { DesktopControls } from './input/DesktopControls';
import { InteractionSystem } from './input/InteractionSystem';
import { DesktopHUD } from './ui/DesktopHUD';
import { ChecklistUI } from './ui/ChecklistUI';
import { NPCManager } from './npc/NPCManager';
import { LoanManager, loanManager } from './loan/LoanManager';
import { ScoreManager, scoreManager } from './score/ScoreManager';

export class App {
  public readonly engine: Engine;
  public readonly xrManager: XRManager;
  public readonly room: Room;
  public readonly counter: Counter;
  public readonly cart: StorageCart;
  public readonly computer: ComputerPlaceholder;
  public readonly nfcScanner: NFCScanner;
  public readonly credential: Credential;
  public readonly laptops: Laptop[] = [];
  public readonly desktopControls: DesktopControls;
  public readonly interactionSystem: InteractionSystem;
  public readonly hud: DesktopHUD;
  public readonly checklistUI: ChecklistUI;
  public readonly loanManager: LoanManager;
  public readonly npcManager: NPCManager;
  public readonly scoreManager: ScoreManager;

  constructor() {
    console.log('[PC PUMA XR] Iniciando Fase 6: Sistema Competitivo de Puntuación y Evaluación Integral...');

    // 0. Inicializar sintetizador de audio procedural institucional
    audio.playClickSound();

    // 1. Motor Gráfico Three.js con WebXR
    this.engine = new Engine('app');

    // 2. Gestor WebXR (Meta Quest 3S / Mandos / Hand Tracking)
    this.xrManager = new XRManager(this.engine.renderer, this.engine.xrRig);

    // 3. Entorno Arquitectónico PC PUMA (8m x 8m)
    this.room = new Room();
    this.engine.scene.add(this.room.group);

    // 4. Mostrador de Atención
    this.counter = new Counter();
    this.engine.scene.add(this.counter.group);

    // 5. Carro de Almacenamiento Tecnológico 3D (Carro 01)
    this.cart = new StorageCart();
    this.engine.scene.add(this.cart.group);

    // 6. Computadora del Operador con Monitor Ampliado (32 pulgadas)
    this.computer = new ComputerPlaceholder();
    this.engine.scene.add(this.computer.group);

    // 7. Lector NFC Físico sobre el mostrador
    this.nfcScanner = new NFCScanner();
    this.engine.scene.add(this.nfcScanner.group);

    // 8. Credencial Universitaria UNAM 3D (aparece al presentarse el alumno)
    this.credential = new Credential();
    this.credential.group.visible = false;
    this.engine.scene.add(this.credential.group);

    // 9. Capa de Interacción Unificada
    this.interactionSystem = new InteractionSystem(
      this.engine.camera,
      this.engine.scene,
      this.xrManager
    );
    this.interactionSystem.setComputer(this.computer);
    this.interactionSystem.setCart(this.cart);
    this.interactionSystem.setNFCScanner(this.nfcScanner);
    this.interactionSystem.setCredential(this.credential);
    this.interactionSystem.registerGrabbable(this.credential);

    // 10. Instanciación del Inventario Inicial (Laptops 01 a 05)
    this.setupLaptops();

    // 11. Gestor de Flujo de Préstamo y Alumno NPC (Juan Pérez López)
    this.loanManager = loanManager;
    this.npcManager = new NPCManager(this.engine.scene);
    this.npcManager.setCredential(this.credential);
    this.npcManager.setLaptops(this.laptops);

    // 12. Gestor de Puntuación, Temporizador y Racha (Fase 6)
    this.scoreManager = scoreManager;

    // 13. Controles de Escritorio (WASD + Mouse Look)
    this.desktopControls = new DesktopControls(this.engine.camera);

    // 14. Interfaz HUD y Retícula Contextual
    this.hud = new DesktopHUD();

    // 15. Sistema de Inducción / Tutorial Interactivo y Checklist
    this.checklistUI = new ChecklistUI();

    // 16. Bucle de Actualización (Tick)
    this.engine.addUpdatable((delta) => {
      this.xrManager.updateLocomotion(delta);
      this.desktopControls.update(delta);
      this.interactionSystem.update(delta);
      this.cart.update(delta);
      this.npcManager.update(delta, this.engine.camera.position);
      this.scoreManager.update(delta);
      this.hud.update();
    });

    console.log('[PC PUMA XR] Fase 6 activa y totalmente operativa.');
  }

  private setupLaptops(): void {
    const cartEuler = new THREE.Euler(0, this.cart.group.rotation.y, 0);

    // Laptop 01: Inicialmente sobre el mostrador en la zona de entrega
    const lap01 = new Laptop({
      id: 'laptop_01',
      slotIndex: 1,
      tag: 'PC-PUMA-01',
      initialPosition: new THREE.Vector3(0.65, 1.08, 0.05),
      initialRotation: new THREE.Euler(0, -Math.PI / 8, 0),
      startsClosed: false
    });
    this.laptops.push(lap01);
    this.engine.scene.add(lap01.group);
    this.interactionSystem.registerGrabbable(lap01);

    // Laptops 02, 03, 04, 05: Ubicadas en las bahías del Carro 01
    const cartLaptops = [
      { slot: 2, tag: 'PC-PUMA-02', isMaintenance: false },
      { slot: 3, tag: 'PC-PUMA-03', isMaintenance: true },  // Laptop con incidencia para pruebas
      { slot: 4, tag: 'PC-PUMA-04', isMaintenance: false },
      { slot: 5, tag: 'PC-PUMA-05', isMaintenance: false }
    ];

    cartLaptops.forEach((cfg) => {
      const slotPos = this.cart.getSlotWorldPosition(cfg.slot);
      const laptop = new Laptop({
        id: `laptop_0${cfg.slot}`,
        slotIndex: cfg.slot,
        tag: cfg.tag,
        initialPosition: slotPos,
        initialRotation: cartEuler,
        isMaintenance: cfg.isMaintenance,
        startsClosed: true
      });

      this.laptops.push(laptop);
      this.engine.scene.add(laptop.group);
      this.interactionSystem.registerGrabbable(laptop);
      this.cart.setSlotOccupied(cfg.slot, laptop.id);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
