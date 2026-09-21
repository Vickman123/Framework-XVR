import * as THREE from 'three';
import { ComputerScreenUI } from '../computer/ComputerScreenUI';

export class ComputerPlaceholder {
  public readonly group: THREE.Group;
  public readonly screenMesh: THREE.Mesh;
  public readonly screenUI: ComputerScreenUI;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Operator_Computer';

    // 1. Inicializar la interfaz interactiva en canvas
    this.screenUI = new ComputerScreenUI();

    // 2. Crear soporte y pantalla física ampliada (32 pulgadas ergonómica)
    const { monitorGroup, screenMesh } = this.createMonitor();
    this.screenMesh = screenMesh;
    this.group.add(monitorGroup);

    // 3. Periféricos (Teclado, Mouse, Gabinete)
    this.createPeripherals();

    // 4. Posicionar el conjunto de cómputo sobre el mostrador a la izquierda del operador
    this.group.position.set(-0.55, 1.075, -0.05);
  }

  private createMonitor() {
    const monitorGroup = new THREE.Group();

    // Base del monitor ampliada
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.3, metalness: 0.7 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.018, 24), baseMat);
    base.position.y = 0.009;
    base.receiveShadow = true;
    monitorGroup.add(base);

    // Brazo / Soporte vertical más robusto y ergonómico
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.04), baseMat);
    arm.position.set(0, 0.19, 0.03);
    arm.castShadow = true;
    monitorGroup.add(arm);

    // Marco del monitor ampliado (Formato profesional de 32", 16:9 estilizado)
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.52, 0.025),
      new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.4 })
    );
    bezel.position.set(0, 0.38, 0);
    bezel.castShadow = true;
    monitorGroup.add(bezel);

    // Borde biselado dorado UNAM en marco inferior
    const goldAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.008, 0.027),
      new THREE.MeshStandardMaterial({ color: 0xD59F0F, metalness: 0.6, roughness: 0.3 })
    );
    goldAccent.position.set(0, 0.125, 0);
    monitorGroup.add(goldAccent);

    // Pantalla activa ampliada (conectada a ComputerScreenUI)
    const screenMat = new THREE.MeshStandardMaterial({
      map: this.screenUI.texture,
      roughness: 0.15,
      metalness: 0.05,
      emissive: 0xffffff,
      emissiveMap: this.screenUI.texture,
      emissiveIntensity: 0.85
    });

    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.82, 0.48),
      screenMat
    );
    // Orientado hacia el operador (mirando hacia -Z)
    screenMesh.position.set(0, 0.38, -0.013);
    screenMesh.rotation.y = Math.PI;
    screenMesh.name = 'Computer_Screen';
    monitorGroup.add(screenMesh);

    return { monitorGroup, screenMesh };
  }

  private createPeripherals(): void {
    // Teclado ergonómico
    const keyboardMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 });
    const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.015, 0.15), keyboardMat);
    keyboard.position.set(0, 0.008, -0.22);
    keyboard.castShadow = true;
    this.group.add(keyboard);

    // Mouse y alfombrilla
    const padMat = new THREE.MeshStandardMaterial({ color: 0x002B49, roughness: 0.8 });
    const mousePad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.002, 0.22), padMat);
    mousePad.position.set(0.32, 0.001, -0.22);
    this.group.add(mousePad);

    const mouseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
    const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.1), mouseMat);
    mouse.position.set(0.32, 0.013, -0.22);
    mouse.castShadow = true;
    this.group.add(mouse);

    // Gabinete CPU compacto
    const cpuMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.4, metalness: 0.6 });
    const cpu = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.38), cpuMat);
    cpu.position.set(-0.52, 0.175, 0.0);
    cpu.castShadow = true;
    this.group.add(cpu);
  }
}
