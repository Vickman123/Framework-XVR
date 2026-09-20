import * as THREE from 'three';

export class Room {
  public readonly group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Room_PC_PUMA';

    this.createFloor();
    this.createCeiling();
    this.createWalls();
    this.createInstitutionalSign();
    this.createCeilingLamps();
    this.createStudentZonePlaceholders();
  }

  private createFloor(): void {
    // Piso de loseta vinílica institucional de 8m x 8m
    const floorGeo = new THREE.PlaneGeometry(8, 8, 32, 32);
    
    // Generar textura de losetas procedural para evitar cargar archivos externos
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 0, 512, 512);
    
    // Cuadrícula sutil de juntas
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 4;
    const tileSize = 64;
    for (let x = 0; x <= 512; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const floorTex = new THREE.CanvasTexture(canvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(4, 4);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.35,
      metalness: 0.12
    });

    // Carga asistida de loseta personalizada si se sube a public/textures/floor_tiles.png
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      'textures/floor_tiles.png',
      (customFloorTex) => {
        customFloorTex.wrapS = THREE.RepeatWrapping;
        customFloorTex.wrapT = THREE.RepeatWrapping;
        customFloorTex.repeat.set(4, 4);
        floorMat.map = customFloorTex;
        floorMat.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);
  }

  private createCeiling(): void {
    const ceilingGeo = new THREE.PlaneGeometry(8, 8);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.8
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 3.2;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);
  }

  private createWalls(): void {
    const wallHeight = 3.2;
    const wallLength = 8;
    const wallThickness = 0.2;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xEEF2F6,
      roughness: 0.85
    });

    // Franja azul institucional UNAM
    const unamBlueMat = new THREE.MeshStandardMaterial({
      color: 0x002B49,
      roughness: 0.6
    });

    // Franja dorada UNAM
    const unamGoldMat = new THREE.MeshStandardMaterial({
      color: 0xD59F0F,
      roughness: 0.4,
      metalness: 0.3
    });

    const createWallSegment = (posX: number, posZ: number, rotY: number) => {
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(wallLength, wallHeight, wallThickness),
        wallMat
      );
      wallMesh.position.set(posX, wallHeight / 2, posZ);
      wallMesh.rotation.y = rotY;
      wallMesh.receiveShadow = true;
      this.group.add(wallMesh);

      // Franja azul institucional en la parte media
      const blueStripe = new THREE.Mesh(
        new THREE.BoxGeometry(wallLength, 0.28, wallThickness + 0.01),
        unamBlueMat
      );
      blueStripe.position.set(posX, 1.25, posZ);
      blueStripe.rotation.y = rotY;
      this.group.add(blueStripe);

      // Franja dorada decorativa
      const goldStripe = new THREE.Mesh(
        new THREE.BoxGeometry(wallLength, 0.06, wallThickness + 0.012),
        unamGoldMat
      );
      goldStripe.position.set(posX, 1.42, posZ);
      goldStripe.rotation.y = rotY;
      this.group.add(goldStripe);

      // Zoclo inferior
      const baseboard = new THREE.Mesh(
        new THREE.BoxGeometry(wallLength, 0.12, wallThickness + 0.015),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
      );
      baseboard.position.set(posX, 0.06, posZ);
      baseboard.rotation.y = rotY;
      this.group.add(baseboard);
    };

    // Pared trasera (detrás del operador, Z = -4)
    createWallSegment(0, -4, 0);

    // Pared frontal (al fondo de la zona de estudiantes, Z = 4)
    createWallSegment(0, 4, 0);

    // Pared izquierda (X = -4)
    createWallSegment(-4, 0, Math.PI / 2);

    // Pared derecha (X = 4)
    createWallSegment(4, 0, Math.PI / 2);
  }

  private createInstitutionalSign(): void {
    // Letrero 3D en la pared trasera del operador
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 256;
    const ctx = signCanvas.getContext('2d')!;

    ctx.fillStyle = '#002B49';
    ctx.fillRect(0, 0, 1024, 256);

    // Borde dorado
    ctx.strokeStyle = '#D59F0F';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 1012, 244);

    // Texto institucional
    ctx.fillStyle = '#D59F0F';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UNIVERSIDAD NACIONAL AUTÓNOMA DE MÉXICO', 512, 60);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 80px sans-serif';
    ctx.fillText('PC PUMA', 512, 150);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 30px sans-serif';
    ctx.fillText('MÓDULO DE PRÉSTAMO Y OPERACIÓN TECNOLÓGICA', 512, 205);

    const signTexture = new THREE.CanvasTexture(signCanvas);
    const signGeo = new THREE.PlaneGeometry(3.2, 0.8);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTexture,
      roughness: 0.3,
      metalness: 0.1
    });

    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      'images/wall_banner.png',
      (bannerTex) => {
        signMat.map = bannerTex;
        signMat.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 2.3, -3.88);
    this.group.add(signMesh);

    // Cartel / Póster de reglamento en la pared lateral (X = -3.88, Z = -0.6)
    const posterCanvas = document.createElement('canvas');
    posterCanvas.width = 512;
    posterCanvas.height = 768;
    const pCtx = posterCanvas.getContext('2d')!;

    pCtx.fillStyle = '#FFFFFF';
    pCtx.fillRect(0, 0, 512, 768);

    pCtx.fillStyle = '#002B49';
    pCtx.fillRect(0, 0, 512, 110);

    pCtx.fillStyle = '#D59F0F';
    pCtx.font = 'bold 24px sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillText('REGLAMENTO OFICIAL', 256, 45);

    pCtx.fillStyle = '#FFFFFF';
    pCtx.font = 'bold 20px sans-serif';
    pCtx.fillText('PRÉSTAMO DE EQUIPO DE CÓMPUTO', 256, 85);

    pCtx.fillStyle = '#1E293B';
    pCtx.font = '16px sans-serif';
    pCtx.textAlign = 'left';
    const rules = [
      '1. Presentar credencial UNAM vigente.',
      '2. Revisión visual del equipo entregado.',
      '3. Uso exclusivo en áreas autorizadas.',
      '4. Devolver con batería completa.',
      '5. Reportar cualquier falla al operador.'
    ];
    rules.forEach((rule, idx) => {
      pCtx.fillText(rule, 35, 160 + idx * 45);
    });

    const posterTex = new THREE.CanvasTexture(posterCanvas);
    const posterMat = new THREE.MeshStandardMaterial({
      map: posterTex,
      roughness: 0.4
    });

    texLoader.load(
      'images/rules_poster.png',
      (customPosterTex) => {
        posterMat.map = customPosterTex;
        posterMat.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    const posterMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.25), posterMat);
    posterMesh.position.set(-3.88, 1.85, -0.6);
    posterMesh.rotation.y = Math.PI / 2;
    this.group.add(posterMesh);
  }

  private createCeilingLamps(): void {
    // 4 Paneles LED empotrados con bisel de aluminio y difusor acrílico brillante
    const lampPositions = [
      [-1.8, 3.18, -1.5],
      [1.8, 3.18, -1.5],
      [-1.8, 3.18, 1.8],
      [1.8, 3.18, 1.8]
    ];

    const frameGeo = new THREE.BoxGeometry(1.24, 0.04, 0.64);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.25
    });

    const panelGeo = new THREE.BoxGeometry(1.16, 0.035, 0.56);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0xFFFBF2,
      emissiveIntensity: 1.5,
      roughness: 0.15
    });

    lampPositions.forEach(([x, y, z]) => {
      const lampGroup = new THREE.Group();
      const frame = new THREE.Mesh(frameGeo, frameMat);
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.y = -0.005;
      lampGroup.add(frame);
      lampGroup.add(panel);
      lampGroup.position.set(x, y, z);
      this.group.add(lampGroup);
    });
  }

  private createStudentZonePlaceholders(): void {
    // Mesas de trabajo en la zona de estudiantes (Z > 1.8)
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0xCBD5E1,
      roughness: 0.45,
      metalness: 0.1
    });
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.7
    });

    const createTable = (x: number, z: number) => {
      const tableGroup = new THREE.Group();
      
      // Sombra de contacto / Ambient Occlusion suave bajo la mesa
      const tableShadowGeo = new THREE.PlaneGeometry(2.0, 1.1);
      const tableShadowCanvas = document.createElement('canvas');
      tableShadowCanvas.width = 128;
      tableShadowCanvas.height = 64;
      const tsCtx = tableShadowCanvas.getContext('2d')!;
      const tsGrad = tsCtx.createRadialGradient(64, 32, 5, 64, 32, 58);
      tsGrad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
      tsGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.2)');
      tsGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      tsCtx.fillStyle = tsGrad;
      tsCtx.fillRect(0, 0, 128, 64);
      const tableShadowTex = new THREE.CanvasTexture(tableShadowCanvas);
      const tableShadow = new THREE.Mesh(
        tableShadowGeo,
        new THREE.MeshBasicMaterial({ map: tableShadowTex, transparent: true, depthWrite: false })
      );
      tableShadow.rotation.x = -Math.PI / 2;
      tableShadow.position.set(0, 0.002, 0);
      tableGroup.add(tableShadow);

      // Superficie
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.9), tableMat);
      top.position.y = 0.74;
      top.castShadow = true;
      top.receiveShadow = true;
      tableGroup.add(top);

      // 4 Patas
      const legPositions = [
        [-0.82, 0.36, -0.37],
        [0.82, 0.36, -0.37],
        [-0.82, 0.36, 0.37],
        [0.82, 0.36, 0.37]
      ];

      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.72), legMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        tableGroup.add(leg);
      });

      tableGroup.position.set(x, 0, z);
      this.group.add(tableGroup);
    };

    // Sillas institucionales para los alumnos
    const chairSeatMat = new THREE.MeshStandardMaterial({
      color: 0x002B49, // Azul UNAM
      roughness: 0.5
    });
    const chairFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      metalness: 0.8,
      roughness: 0.3
    });

    const createChair = (x: number, z: number, rotY: number = 0) => {
      const chairGroup = new THREE.Group();
      
      // Asiento (0.42m x 0.04m x 0.42m) a altura de asiento estándar (0.44m)
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), chairSeatMat);
      seat.position.y = 0.44;
      seat.castShadow = true;
      chairGroup.add(seat);

      // Respaldo ergonómico
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.35, 0.03), chairSeatMat);
      back.position.set(0, 0.70, -0.19);
      back.castShadow = true;
      chairGroup.add(back);

      // 4 Patas tubulares
      const legPositions = [
        [-0.18, 0.22, -0.18],
        [0.18, 0.22, -0.18],
        [-0.18, 0.22, 0.18],
        [0.18, 0.22, 0.18]
      ];
      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.44), chairFrameMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        chairGroup.add(leg);
      });

      // Postes verticales de respaldo
      [-0.18, 0.18].forEach((lx) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28), chairFrameMat);
        post.position.set(lx, 0.56, -0.19);
        chairGroup.add(post);
      });

      chairGroup.position.set(x, 0, z);
      chairGroup.rotation.y = rotY;
      this.group.add(chairGroup);
    };

    // Dos mesas para estudiantes al fondo
    createTable(-1.6, 2.6);
    createTable(1.6, 2.6);

    // Sillas posicionadas frente a las mesas
    createChair(-1.6, 2.05, 0);       // Puesto de Juan Pérez López
    createChair(-1.6, 3.15, Math.PI); // Puesto opuesto
    createChair(1.6, 2.05, 0);        // Mesa derecha
    createChair(1.6, 3.15, Math.PI);  // Mesa derecha opuesto

    this.createEntranceDoor();
  }

  private createEntranceDoor(): void {
    const doorGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x002B49, roughness: 0.4 });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.1, transparent: true, opacity: 0.55 });

    // Puerta doble institucional
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.05), doorMat);
    doorMesh.position.set(0, 1.2, 0);
    doorGroup.add(doorMesh);

    // Ventanas de vidrio
    const glass1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.95, 0.06), glassMat);
    glass1.position.set(-0.32, 1.35, 0);
    doorGroup.add(glass1);

    const glass2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.95, 0.06), glassMat);
    glass2.position.set(0.32, 1.35, 0);
    doorGroup.add(glass2);

    // Marco exterior
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.07), frameMat);
    frame.position.set(0, 1.25, -0.01);
    doorGroup.add(frame);

    // Letrero superior de acceso
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext('2d')!;
    ctx.fillStyle = '#002B49';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#D59F0F';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 506, 122);
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ACCESO GENERAL', 256, 48);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('SALA DE ESTUDIO PC PUMA', 256, 92);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(0, 2.62, -0.04);
    sign.rotation.y = Math.PI; // Mirando hacia el interior de la sala
    doorGroup.add(sign);

    doorGroup.position.set(0.65, 0, 3.88);
    this.group.add(doorGroup);
  }
}
