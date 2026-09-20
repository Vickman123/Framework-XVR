import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Laptop } from '../entities/Laptop';

export interface StudentConfig {
  id: string;
  name: string;
  accountNumber: string;
  career: string;
  jacketColor: number;
  pantsColor: number;
  hairColor: number;
}

export class StudentNPC {
  public readonly config: StudentConfig;
  public readonly group: THREE.Group;

  // Contenedor del cuerpo procedural y modelo 3D realista
  private proceduralBody: THREE.Group = new THREE.Group();
  public customModel: THREE.Group | null = null;

  // Caché estático de animaciones FBX para que el segundo y tercer alumno no re-descarguen archivos
  private static cachedClips: Map<string, THREE.AnimationClip> = new Map();

  // Animaciones Mixamo esqueléticas
  public mixer: THREE.AnimationMixer | null = null;
  public actions: Map<string, THREE.AnimationAction> = new Map();
  public currentActionName: string | null = null;

  // Extremidades para animación procedural
  private leftLeg!: THREE.Group;
  private rightLeg!: THREE.Group;
  private leftKnee!: THREE.Group;
  private rightKnee!: THREE.Group;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;
  private head!: THREE.Group;
  private torso!: THREE.Group;

  // Globo de diálogo 3D
  private speechBubble!: THREE.Mesh;
  private speechCanvas!: HTMLCanvasElement;
  private speechCtx!: CanvasRenderingContext2D;
  private speechTex!: THREE.CanvasTexture;
  private speechTimer: number = 0;

  // Estado de locomoción
  public isWalking: boolean = false;
  public isSeated: boolean = false;
  private walkTime: number = 0;
  private targetPosition: THREE.Vector3 | null = null;
  private walkSpeed: number = 1.6;

  // Laptop en posesión
  public heldLaptop: Laptop | null = null;

  constructor(config: StudentConfig) {
    this.config = config;
    this.group = new THREE.Group();
    this.group.name = `StudentNPC_${this.config.name.replace(/\s+/g, '_')}`;

    this.buildHumanoidModel();
    this.buildSpeechBubble();
    this.loadAnimatedFBXModel();
  }

  private buildHumanoidModel(): void {
    const skinMat = new THREE.MeshBasicMaterial({ color: 0xF5D0C5, fog: false });
    const jacketMat = new THREE.MeshBasicMaterial({ color: this.config.jacketColor, fog: false });
    const pantsMat = new THREE.MeshBasicMaterial({ color: this.config.pantsColor, fog: false });
    const hairMat = new THREE.MeshBasicMaterial({ color: this.config.hairColor, fog: false });
    const shoeMat = new THREE.MeshBasicMaterial({ color: 0xF8FAFC, fog: false });
    const backpackMat = new THREE.MeshBasicMaterial({ color: 0x334155, fog: false });

    // 1. TORSO Y CUELLO
    this.torso = new THREE.Group();
    this.torso.position.set(0, 0.82, 0);

    // Chamarra institucional
    const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.22), jacketMat);
    jacket.position.y = 0.26;
    this.torso.add(jacket);

    // Franja dorada decorativa en chamarra
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(0.384, 0.04, 0.224),
      new THREE.MeshBasicMaterial({ color: 0xD59F0F, fog: false })
    );
    trim.position.y = 0.22;
    this.torso.add(trim);

    // Mochila en espalda
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.38, 0.14), backpackMat);
    backpack.position.set(0, 0.28, -0.16);
    backpack.castShadow = true;
    this.torso.add(backpack);

    // Cuello
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08), skinMat);
    neck.position.y = 0.56;
    this.torso.add(neck);

    this.proceduralBody.add(this.torso);

    // 2. CABEZA Y CABELLO
    this.head = new THREE.Group();
    this.head.position.set(0, 1.45, 0);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.22, 0.20), skinMat);
    headMesh.position.y = 0.11;
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Cabello estilizado
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.10, 0.22), hairMat);
    hair.position.y = 0.21;
    this.head.add(hair);

    // Ojos estilizados
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1E293B });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), eyeMat);
    leftEye.position.set(-0.05, 0.12, 0.105);
    this.head.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), eyeMat);
    rightEye.position.set(0.05, 0.12, 0.105);
    this.head.add(rightEye);

    this.proceduralBody.add(this.head);

    // 3. BRAZOS ARTICULADOS EN HOMBROS
    const buildArm = (isLeft: boolean) => {
      const armPivot = new THREE.Group();
      const xSign = isLeft ? -1 : 1;
      armPivot.position.set(xSign * 0.24, 1.34, 0);

      // Manga / Brazo superior
      const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.26, 0.11), jacketMat);
      sleeve.position.y = -0.13;
      sleeve.castShadow = true;
      armPivot.add(sleeve);

      // Mano
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.09), skinMat);
      hand.position.y = -0.32;
      hand.castShadow = true;
      armPivot.add(hand);

      this.proceduralBody.add(armPivot);
      return armPivot;
    };

    this.leftArm = buildArm(true);
    this.rightArm = buildArm(false);

    // 4. PIERNAS ARTICULADAS (CADERA + RODILLA)
    const buildLeg = (isLeft: boolean) => {
      const hipPivot = new THREE.Group();
      const xSign = isLeft ? -1 : 1;
      hipPivot.position.set(xSign * 0.11, 0.82, 0);

      // Muslo (Thigh) - longitud 0.38m
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.13), pantsMat);
      thigh.position.y = -0.19;
      thigh.castShadow = true;
      hipPivot.add(thigh);

      // Rodilla articulada a -0.38m de la cadera
      const kneePivot = new THREE.Group();
      kneePivot.position.set(0, -0.38, 0);

      // Pantorrilla (Shin) - longitud 0.38m
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.12), pantsMat);
      shin.position.y = -0.19;
      shin.castShadow = true;
      kneePivot.add(shin);

      // Zapato en la base de la pantorrilla
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.18), shoeMat);
      shoe.position.set(0, -0.38, 0.02);
      shoe.castShadow = true;
      kneePivot.add(shoe);

      hipPivot.add(kneePivot);
      this.proceduralBody.add(hipPivot);

      if (isLeft) {
        this.leftKnee = kneePivot;
      } else {
        this.rightKnee = kneePivot;
      }

      return hipPivot;
    };

    this.leftLeg = buildLeg(true);
    this.rightLeg = buildLeg(false);

    this.group.add(this.proceduralBody);
  }

  // Crea un bucle de respiración natural y reposada (3.0s) a partir de la pose anatómica erguida
  private createNaturalBreathingIdle(sourceClip: THREE.AnimationClip): THREE.AnimationClip {
    const duration = 3.0;
    const tracks: THREE.KeyframeTrack[] = [];

    for (const track of sourceClip.tracks) {
      if (track instanceof THREE.VectorKeyframeTrack) {
        const x0 = track.values[0];
        const y0 = track.values[1];
        const z0 = track.values[2];

        const isHips = track.name.toLowerCase().includes('hips');
        if (isHips) {
          // Respiración suave en Y: sube 3.5mm al inhalar (t=1.5s) y regresa a su base (t=3.0s)
          const times = [0, 1.5, duration];
          const values = [
            x0, y0, z0,
            x0, y0 + 0.0035, z0,
            x0, y0, z0
          ];
          tracks.push(new THREE.VectorKeyframeTrack(track.name, times, values));
        } else {
          tracks.push(new THREE.VectorKeyframeTrack(track.name, [0, duration], [x0, y0, z0, x0, y0, z0]));
        }
      } else if (track instanceof THREE.QuaternionKeyframeTrack) {
        const q0 = new THREE.Quaternion(
          track.values[0],
          track.values[1],
          track.values[2],
          track.values[3]
        );

        const isSpine = track.name.toLowerCase().includes('spine');
        if (isSpine) {
          // Expansión torácica sutil al inhalar (~0.8 grados hacia atrás)
          const qBreath = q0.clone().multiply(
            new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.015)
          );
          const times = [0, 1.5, duration];
          const values = [
            q0.x, q0.y, q0.z, q0.w,
            qBreath.x, qBreath.y, qBreath.z, qBreath.w,
            q0.x, q0.y, q0.z, q0.w
          ];
          tracks.push(new THREE.QuaternionKeyframeTrack(track.name, times, values));
        } else {
          tracks.push(new THREE.QuaternionKeyframeTrack(
            track.name,
            [0, duration],
            [q0.x, q0.y, q0.z, q0.w, q0.x, q0.y, q0.z, q0.w]
          ));
        }
      }
    }

    return new THREE.AnimationClip('idle', duration, tracks);
  }

  private loadAnimatedFBXModel(): void {
    const fbxLoader = new FBXLoader();
    const texLoader = new THREE.TextureLoader();

    // 1. Cargar el modelo base esquelético con animación de caminata
    fbxLoader.load(
      'models/animations/Walking.fbx',
      (object) => {
        // Al cargar el modelo animado, ocultar cuerpo procedural
        this.proceduralBody.visible = false;
        const model = object;
        model.name = 'AnimatedStudentModel';

        // Escalar a altura estándar de estudiante universitario (~1.73m)
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const targetHeight = 1.73;
        const scale = size.y > 0 ? targetHeight / size.y : 1;
        model.scale.set(scale, scale, scale);

        // Alinear pies con el suelo (Y = 0) y centrar
        const scaledBox = new THREE.Box3().setFromObject(model);
        model.position.y = -scaledBox.min.y;
        model.position.x = 0;
        model.position.z = 0;

        // Cargar textura institucional UNAM con espacio de color SRGB
        const studentTexture = texLoader.load('textures/student_texture.png');
        studentTexture.colorSpace = THREE.SRGBColorSpace;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.SkinnedMesh;
            if (mesh.geometry) {
              mesh.geometry.computeVertexNormals();
            }
            mesh.material = new THREE.MeshBasicMaterial({
              map: studentTexture,
              fog: false,
              side: THREE.DoubleSide
            });
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          }
        });

        // Crear el mezclador de animaciones
        const mixer = new THREE.AnimationMixer(model);
        this.mixer = mixer;

        // Listener para encadenar transiciones como Stand To Sit ('sit') -> Writing ('write')
        mixer.addEventListener('finished', (e: any) => {
          if (e.action && e.action.getClip().name === 'sit') {
            if (this.isSeated) {
              this.playAnimation('write', 0.35);
            }
          }
        });

        // Registrar clips si ya estaban en caché estático
        if (StudentNPC.cachedClips.size > 0) {
          StudentNPC.cachedClips.forEach((clip, name) => {
            const action = mixer.clipAction(clip);
            if (name === 'sit') {
              action.setLoop(THREE.LoopOnce, 1);
              action.clampWhenFinished = true;
            } else {
              action.setLoop(THREE.LoopRepeat, Infinity);
            }
            this.actions.set(name, action);
          });
        }

        // Clip 1: Caminata In-Place (Walking)
        if (model.animations && model.animations.length > 0 && !this.actions.has('walk')) {
          const walkClip = this.makeInPlace(model.animations[0].clone(), 'walk');
          StudentNPC.cachedClips.set('walk', walkClip);
          const walkAction = mixer.clipAction(walkClip);
          walkAction.setLoop(THREE.LoopRepeat, Infinity);
          this.actions.set('walk', walkAction);

          // Clip de Idle preliminar con respiración reposada
          const tempIdleClip = this.createNaturalBreathingIdle(model.animations[0]);
          tempIdleClip.name = 'temp_idle';
          StudentNPC.cachedClips.set('temp_idle', tempIdleClip);
          const tempIdleAction = mixer.clipAction(tempIdleClip);
          tempIdleAction.setLoop(THREE.LoopRepeat, Infinity);
          this.actions.set('temp_idle', tempIdleAction);
        }

        this.customModel = model;
        this.group.add(model);

        if (this.speechBubble) {
          this.speechBubble.position.y = targetHeight + 0.35;
        }

        // Clip 2: Escribir / Teclear en laptop (Writing)
        if (!this.actions.has('write')) {
          fbxLoader.load('models/animations/Writing.fbx', (animObj) => {
            if (animObj.animations && animObj.animations.length > 0) {
              const writeClip = animObj.animations[0].clone();
              writeClip.name = 'write';
              StudentNPC.cachedClips.set('write', writeClip);
              const writeAction = mixer.clipAction(writeClip);
              writeAction.setLoop(THREE.LoopRepeat, Infinity);
              this.actions.set('write', writeAction);

              // Si ya estaba sentado mientras cargaba la animación, comenzar tecleo
              if (this.isSeated && this.currentActionName !== 'sit') {
                this.playAnimation('write', 0.35);
              }
            }
          });
        }

        // Clip 3: Sentarse en la silla (Stand To Sit) y extracción de postura Idle natural
        if (!this.actions.has('idle') || !this.actions.has('sit')) {
          fbxLoader.load('models/animations/Stand To Sit.fbx', (animObj) => {
            if (animObj.animations && animObj.animations.length > 0) {
              // Generar clip 'idle' con respiración fluida y calmada (3.0s continuos)
              const idleClip = this.createNaturalBreathingIdle(animObj.animations[0]);
              StudentNPC.cachedClips.set('idle', idleClip);
              const idleAction = mixer.clipAction(idleClip);
              idleAction.setLoop(THREE.LoopRepeat, Infinity);
              this.actions.set('idle', idleAction);

              const sitClip = animObj.animations[0].clone();
              sitClip.name = 'sit';
              StudentNPC.cachedClips.set('sit', sitClip);
              const sitAction = mixer.clipAction(sitClip);
              sitAction.setLoop(THREE.LoopOnce, 1);
              sitAction.clampWhenFinished = true;
              this.actions.set('sit', sitAction);

              // Si el alumno no está caminando ni sentado, reproducir idle de inmediato
              if (!this.isWalking && !this.isSeated) {
                this.playAnimation('idle', 0.4);
              }
            }
          });
        }

        // Clip 4: Caminata con estilo al retirarse (Swagger Walk)
        if (!this.actions.has('swagger')) {
          fbxLoader.load('models/animations/Swagger Walk.fbx', (animObj) => {
            if (animObj.animations && animObj.animations.length > 0) {
              const swaggerClip = this.makeInPlace(animObj.animations[0].clone(), 'swagger');
              StudentNPC.cachedClips.set('swagger', swaggerClip);
              const swaggerAction = mixer.clipAction(swaggerClip);
              swaggerAction.setLoop(THREE.LoopRepeat, Infinity);
              this.actions.set('swagger', swaggerAction);
            }
          });
        }

        // Si ya había una caminata en curso al cargarse, reproducir walk; de lo contrario idle
        if (this.isSeated) {
          if (this.actions.has('sit')) {
            this.playAnimation('sit', 0.2);
          } else if (this.actions.has('write')) {
            this.playAnimation('write', 0.3);
          }
        } else if (this.isWalking) {
          this.playAnimation('walk');
        } else {
          this.playAnimation('idle');
        }

        console.log('[StudentNPC] Modelo animado FBX y clips Mixamo cargados con éxito.');
      },
      undefined,
      (err) => {
        console.warn('[StudentNPC] Walking.fbx no disponible. Usando student.glb de respaldo...', err);
        this.loadCustomGLTFModel();
      }
    );
  }

  // Convierte animaciones con Root Motion en animaciones In-Place para que Three.js controle la posición
  private makeInPlace(clip: THREE.AnimationClip, newName: string): THREE.AnimationClip {
    clip.name = newName;
    for (const track of clip.tracks) {
      if (track.name.endsWith('.position')) {
        const vals = track.values;
        const x0 = vals[0];
        const z0 = vals[2];
        for (let i = 0; i < vals.length; i += 3) {
          vals[i] = x0; // Bloquea avance en X
          // vals[i + 1] es Y: se mantiene intacto para conservar el rebote natural de la cadera
          vals[i + 2] = z0; // Bloquea avance en Z para caminata in-place
        }
      }
    }
    return clip;
  }

  public playAnimation(name: string, fadeDuration: number = 0.35): void {
    if (!this.mixer) return;

    let targetName = name;
    // Fallbacks si la animación solicitada aún está cargando
    if (targetName === 'idle' && !this.actions.has('idle') && this.actions.has('temp_idle')) {
      targetName = 'temp_idle';
    } else if (targetName === 'swagger' && !this.actions.has('swagger')) {
      targetName = 'walk';
    } else if (targetName === 'write' && !this.actions.has('write')) {
      targetName = 'idle';
    } else if (targetName === 'sit' && !this.actions.has('sit')) {
      targetName = this.actions.has('write') ? 'write' : 'idle';
    }

    if (this.currentActionName === targetName) return;

    const nextAction = this.actions.get(targetName);
    if (!nextAction) return;

    if (this.currentActionName) {
      const prevAction = this.actions.get(this.currentActionName);
      if (prevAction) {
        prevAction.fadeOut(fadeDuration);
      }
    }

    nextAction.reset().fadeIn(fadeDuration).play();
    this.currentActionName = targetName;
  }

  public stopAnimation(fadeDuration: number = 0.35): void {
    if (this.currentActionName) {
      const action = this.actions.get(this.currentActionName);
      if (action) {
        action.fadeOut(fadeDuration);
      }
      this.currentActionName = null;
    }
  }

  private loadCustomGLTFModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      'models/student.glb',
      (gltf) => {
        // Al cargar con éxito el modelo 3D realista, ocultar el cuerpo de bloques procedural
        this.proceduralBody.visible = false;

        const model = gltf.scene;
        model.name = 'CustomStudentModel';

        // Calcular caja delimitadora para escalar a altura estándar de estudiante universitario (~1.73m)
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);

        const targetHeight = 1.73;
        const scale = size.y > 0 ? targetHeight / size.y : 1;
        model.scale.set(scale, scale, scale);

        // Alinear base de los pies con el suelo (Y = 0) y centrar X/Z
        const scaledBox = new THREE.Box3().setFromObject(model);
        model.position.y = -scaledBox.min.y;
        model.position.x = 0;
        model.position.z = 0;

        const texLoader = new THREE.TextureLoader();
        const studentTexture = texLoader.load('textures/student_texture.png');
        studentTexture.colorSpace = THREE.SRGBColorSpace;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshBasicMaterial({
              map: studentTexture,
              fog: false,
              side: THREE.DoubleSide
            });
            mesh.castShadow = false;
            mesh.receiveShadow = false;
          }
        });

        this.customModel = model;
        this.group.add(model);

        // Ajustar posición del globo de texto sobre la cabeza del nuevo modelo
        if (this.speechBubble) {
          this.speechBubble.position.y = targetHeight + 0.35;
        }

        console.log(`[StudentNPC] Modelo 3D student.glb cargado como respaldo (altura: ${targetHeight}m).`);
      },
      undefined,
      (err) => {
        console.warn('[StudentNPC] student.glb no encontrado o error de carga. Usando cuerpo procedural de respaldo.', err);
        this.proceduralBody.visible = true;
      }
    );
  }

  private buildSpeechBubble(): void {
    this.speechCanvas = document.createElement('canvas');
    this.speechCanvas.width = 512;
    this.speechCanvas.height = 256;
    this.speechCtx = this.speechCanvas.getContext('2d')!;

    this.speechTex = new THREE.CanvasTexture(this.speechCanvas);
    this.speechTex.generateMipmaps = false;
    this.speechTex.minFilter = THREE.LinearFilter;

    const mat = new THREE.MeshBasicMaterial({
      map: this.speechTex,
      transparent: true,
      depthWrite: false,
      fog: false
    });

    this.speechBubble = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), mat);
    this.speechBubble.position.set(0, 2.05, 0);
    this.speechBubble.visible = false;
    this.group.add(this.speechBubble);
  }

  public say(text: string, durationSec: number = 4.5): void {
    const ctx = this.speechCtx;
    const w = this.speechCanvas.width;
    const h = this.speechCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Globo estilo institucional blanco y azul PC PUMA
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.strokeStyle = '#0076F5';
    ctx.lineWidth = 5;

    // Cuerpo del globo
    ctx.beginPath();
    ctx.roundRect(10, 10, w - 20, h - 50, 24);
    ctx.fill();
    ctx.stroke();

    // Piquito inferior del globo
    ctx.beginPath();
    ctx.moveTo(w / 2 - 20, h - 50);
    ctx.lineTo(w / 2, h - 10);
    ctx.lineTo(w / 2 + 20, h - 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nombre del Alumno en azul institucional
    ctx.fillStyle = '#003B7A';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.config.name} (${this.config.career})`, w / 2, 50);

    // Texto del mensaje en gris oscuro de alto contraste
    ctx.fillStyle = '#1E293B';
    ctx.font = '600 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    // Auto-salto de línea sencillo
    const words = text.split(' ');
    let line = '';
    let y = 95;
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > w - 60 && i > 0) {
        ctx.fillText(line, w / 2, y);
        line = words[i] + ' ';
        y += 32;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, w / 2, y);

    this.speechTex.needsUpdate = true;
    this.speechBubble.visible = true;
    this.speechTimer = durationSec;
  }

  public setTarget(target: THREE.Vector3, speed: number = 1.6, animationName: 'walk' | 'swagger' = 'walk'): void {
    this.targetPosition = target.clone();
    this.walkSpeed = speed;
    this.isWalking = true;
    this.playAnimation(animationName);
  }

  public receiveLaptop(laptop: Laptop): void {
    this.heldLaptop = laptop;
    // Emparentar la laptop a los brazos del estudiante
    this.group.add(laptop.group);
    laptop.group.position.set(0, 1.05, 0.28);
    laptop.group.rotation.set(0.2, 0, 0);
    laptop.setOpen(false); // Cerrada mientras camina

    // Poner brazos en postura de cargar laptop
    this.leftArm.rotation.x = -Math.PI / 3;
    this.rightArm.rotation.x = -Math.PI / 3;
  }

  public sitAtDesk(chairPos: THREE.Vector3): void {
    this.isSeated = true;
    this.isWalking = false;
    this.targetPosition = null;

    // Posicionarse en la silla y orientarse hacia la mesa (+Z)
    this.group.position.set(chairPos.x, 0, chairPos.z);
    this.group.rotation.set(0, 0, 0);

    if (this.mixer) {
      if (this.actions.has('sit')) {
        // Reproducir transición de sentarse (Stand To Sit); al finalizar encadena a 'write'
        this.playAnimation('sit', 0.25);
      } else if (this.actions.has('write')) {
        this.playAnimation('write', 0.35);
      } else {
        this.playAnimation('idle', 0.35);
      }
    } else if (this.customModel) {
      // Para modelo 3D estático, se posiciona frente a la mesa
      this.group.position.set(chairPos.x, 0, chairPos.z);
    } else {
      // Altura del asiento anatómica para cuerpo procedural
      this.group.position.set(chairPos.x, -0.36, chairPos.z);

      this.leftLeg.rotation.x = -Math.PI / 2;
      this.rightLeg.rotation.x = -Math.PI / 2;
      this.leftKnee.rotation.x = Math.PI / 2;
      this.rightKnee.rotation.x = Math.PI / 2;
    }

    // Colocar la laptop abierta sobre la mesa justo frente al alumno
    if (this.heldLaptop) {
      const parentScene = this.group.parent;
      if (parentScene) {
        parentScene.add(this.heldLaptop.group);
      }
      this.heldLaptop.group.position.set(chairPos.x, 0.77, chairPos.z + 0.35);
      this.heldLaptop.group.rotation.set(0, Math.PI, 0); // Orientada hacia el estudiante
      this.heldLaptop.setOpen(true);
    }

    // Brazos descansando sobre la mesa
    if (this.leftArm && this.rightArm) {
      this.leftArm.rotation.x = -Math.PI / 2.7;
      this.rightArm.rotation.x = -Math.PI / 2.7;
    }
  }

  public standFromDesk(): void {
    this.isSeated = false;
    this.isWalking = false;
    this.targetPosition = null;

    // Regresar a postura de pie sobre el suelo y activar idle natural
    this.group.position.y = 0;
    this.playAnimation('idle', 0.4);

    if (this.leftLeg) this.leftLeg.rotation.set(0, 0, 0);
    if (this.rightLeg) this.rightLeg.rotation.set(0, 0, 0);
    if (this.leftKnee) this.leftKnee.rotation.set(0, 0, 0);
    if (this.rightKnee) this.rightKnee.rotation.set(0, 0, 0);

    // Si tiene laptop sobre la mesa, cerrarla y recogerla en brazos
    if (this.heldLaptop) {
      this.heldLaptop.setOpen(false);
      this.group.add(this.heldLaptop.group);
      this.heldLaptop.group.position.set(0, 1.05, 0.28);
      this.heldLaptop.group.rotation.set(0.2, 0, 0);

      // Brazos en postura de sujeción
      if (this.leftArm && this.rightArm) {
        this.leftArm.rotation.x = -Math.PI / 3;
        this.rightArm.rotation.x = -Math.PI / 3;
      }
    }
  }

  public returnLaptopToCounter(): Laptop | null {
    if (!this.heldLaptop) return null;

    const laptop = this.heldLaptop;
    this.heldLaptop = null;

    // Depositar sobre la superficie del mostrador (Y = 1.101m) en la zona de atención
    const parentScene = this.group.parent;
    if (parentScene) {
      parentScene.add(laptop.group);
    }
    laptop.group.position.set(0.65, 1.101, 0.05);
    laptop.group.rotation.set(0, -Math.PI / 8, 0);
    laptop.setOpen(false);

    // Brazos a posición natural
    this.leftArm.rotation.x = 0;
    this.rightArm.rotation.x = 0;

    return laptop;
  }

  public exitRoom(doorPos: THREE.Vector3): void {
    this.setTarget(doorPos, 1.35, 'swagger');
  }

  public update(delta: number, cameraPosition: THREE.Vector3): void {
    // 0. Actualizar mezclador de animaciones Mixamo
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // 1. Temporizador del globo de diálogo
    if (this.speechTimer > 0) {
      this.speechTimer -= delta;
      if (this.speechTimer <= 0) {
        this.speechBubble.visible = false;
      }
    }

    // 2. Hacer que el globo de diálogo siempre mire hacia la cámara (Billboard horizontal exacto)
    if (this.speechBubble.visible) {
      const bubbleWorldPos = new THREE.Vector3();
      this.speechBubble.getWorldPosition(bubbleWorldPos);
      this.speechBubble.lookAt(cameraPosition.x, bubbleWorldPos.y, cameraPosition.z);
    }

    // 3. Animación si está sentado en la mesa de estudio
    if (this.isSeated) {
      this.walkTime += delta * 5.0;
      if (this.customModel && !this.mixer) {
        this.customModel.position.y = Math.sin(this.walkTime * 2.0) * 0.003;
      }
      if (this.leftArm && this.rightArm) {
        this.leftArm.rotation.x = -Math.PI / 2.7 + Math.sin(this.walkTime * 2.5) * 0.03;
        this.rightArm.rotation.x = -Math.PI / 2.7 + Math.cos(this.walkTime * 2.5) * 0.03;
      }
      return;
    }

    // 4. Respiración sutil / Idle si está de pie esperando
    if (!this.isWalking && !this.isSeated) {
      if (this.mixer && (this.actions.has('idle') || this.actions.has('temp_idle'))) {
        if (this.currentActionName !== 'idle' && this.currentActionName !== 'temp_idle' && this.currentActionName !== 'sit') {
          this.playAnimation('idle', 0.4);
        }
      }
      this.walkTime += delta * 1.8;
      if (this.customModel && !this.mixer) {
        this.customModel.position.y = Math.sin(this.walkTime) * 0.005;
      }
      this.torso.position.y = 0.82 + Math.sin(this.walkTime) * 0.005;
      return;
    }

    // 5. Animación y desplazamiento si está caminando
    if (this.isWalking && this.targetPosition) {
      const currentPos = this.group.position;
      const dir = new THREE.Vector3().subVectors(this.targetPosition, currentPos);
      dir.y = 0; // Solo en plano horizontal
      const dist = dir.length();

      if (dist > 0.08) {
        dir.normalize();
        
        // Orientación del cuerpo hacia el objetivo
        const angle = Math.atan2(dir.x, dir.z);
        this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, angle, delta * 8.0);

        // Desplazamiento
        currentPos.addScaledVector(dir, this.walkSpeed * delta);

        // Animación de caminado
        this.walkTime += delta * 7.5;

        // Oscilación del modelo 3D estático (si no hay esqueleto Mixamo)
        if (this.customModel && !this.mixer) {
          this.customModel.position.y = Math.abs(Math.sin(this.walkTime)) * 0.025;
          this.customModel.rotation.z = Math.sin(this.walkTime * 0.5) * 0.02;
        }

        // Animación procedural de extremidades (si se usa cuerpo de bloques)
        const legSwing = Math.sin(this.walkTime) * 0.55;
        this.leftLeg.rotation.x = legSwing;
        this.rightLeg.rotation.x = -legSwing;
        this.leftKnee.rotation.x = Math.max(0, -legSwing * 0.5);
        this.rightKnee.rotation.x = Math.max(0, legSwing * 0.5);

        // Si no está cargando una laptop, balancear brazos naturalmente
        if (!this.heldLaptop && this.leftArm && this.rightArm) {
          this.leftArm.rotation.x = -legSwing * 0.45;
          this.rightArm.rotation.x = legSwing * 0.45;
        }

        // Cadencia vertical del torso procedural
        this.torso.position.y = 0.82 + Math.abs(Math.sin(this.walkTime)) * 0.03;
      } else {
        // Llegó al objetivo con precisión
        currentPos.x = this.targetPosition.x;
        currentPos.z = this.targetPosition.z;
        this.isWalking = false;
        this.targetPosition = null;

        if (!this.isSeated) {
          this.playAnimation('idle', 0.4);
        }

        if (this.customModel && !this.mixer) {
          this.customModel.position.y = 0;
          this.customModel.rotation.z = 0;
        }
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.leftKnee.rotation.x = 0;
        this.rightKnee.rotation.x = 0;
        if (!this.heldLaptop && this.leftArm && this.rightArm) {
          this.leftArm.rotation.x = 0;
          this.rightArm.rotation.x = 0;
        }
        this.torso.position.y = 0.82;
      }
    }
  }
}
