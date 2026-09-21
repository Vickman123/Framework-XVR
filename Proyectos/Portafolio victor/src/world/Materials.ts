import * as THREE from 'three';

/**
 * Procedural texture and PBR material generator for the dark futuristic laboratory.
 * All textures are generated procedurally on HTML5 Canvas to eliminate external dependencies.
 */
export class MaterialFactory {
  private static instance: MaterialFactory;

  // Cached materials
  public floorMaterial!: THREE.MeshStandardMaterial;
  public wallMaterial!: THREE.MeshStandardMaterial;
  public darkPanelMaterial!: THREE.MeshStandardMaterial;
  public metalTrimMaterial!: THREE.MeshStandardMaterial;
  public darkGlassMaterial!: THREE.MeshPhysicalMaterial;
  public windowGlassMaterial!: THREE.MeshStandardMaterial;
  public emissiveCyanMaterial!: THREE.MeshStandardMaterial;
  public emissiveEmeraldMaterial!: THREE.MeshStandardMaterial;
  public emissiveAmberMaterial!: THREE.MeshStandardMaterial;
  public ceilingMaterial!: THREE.MeshStandardMaterial;
  public runwayStripeMaterial!: THREE.MeshStandardMaterial;
  public darkDeskMaterial!: THREE.MeshStandardMaterial;
  public whiteLightboxMaterial!: THREE.MeshStandardMaterial;

  private constructor() {
    this.initMaterials();
  }

  public static getInstance(): MaterialFactory {
    if (!MaterialFactory.instance) {
      MaterialFactory.instance = new MaterialFactory();
    }
    return MaterialFactory.instance;
  }

  private initMaterials(): void {
    // 1. Sleek high-contrast dark graphite / polished slate laboratory floor
    const floorTexture = this.createGridTexture('#1a202c', '#242c3d', '#10141e', 1024, 16);
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(12, 12);

    const floorRoughness = this.createNoiseTexture(512, 0.15, 0.4);
    floorRoughness.wrapS = THREE.RepeatWrapping;
    floorRoughness.wrapT = THREE.RepeatWrapping;
    floorRoughness.repeat.set(12, 12);

    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughnessMap: floorRoughness,
      roughness: 0.22, // Polished glossy lab floor reflecting walls and LEDs
      metalness: 0.5,
      color: 0x202634,
    });

    // 2. Clean white modular laboratory wall panels with defined structural seams
    const wallTexture = this.createPanelTexture('#f1f5f9', '#ffffff', '#94a3b8', 512);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(4, 2);

    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      roughness: 0.45,
      metalness: 0.1,
      color: 0xf1f5f9,
    });

    // 3. Crisp dark titanium console & pedestal housings
    this.darkPanelMaterial = new THREE.MeshStandardMaterial({
      color: 0x283040,
      roughness: 0.35,
      metalness: 0.6,
    });

    // 4. Dark brushed titanium structural frames & door trims
    this.metalTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x333d4e,
      roughness: 0.2,
      metalness: 0.85,
    });

    // 5. Clean white modular acoustic ceiling
    const ceilingTexture = this.createGridTexture('#f8fafc', '#ffffff', '#e2e8f0', 512, 8);
    ceilingTexture.wrapS = THREE.RepeatWrapping;
    ceilingTexture.wrapT = THREE.RepeatWrapping;
    ceilingTexture.repeat.set(8, 8);

    this.ceilingMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTexture,
      roughness: 0.5,
      metalness: 0.05,
      color: 0xffffff,
    });

    // 6. High-tech crystal glass with subtle cyan edge refraction
    this.darkGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe0f7fa,
      transparent: true,
      opacity: 0.3,
      roughness: 0.04,
      metalness: 0.05,
      transmission: 0.9,
      ior: 1.52,
    });

    // 6b. Crystal clear architectural window glass for observation bays overlooking the exterior forest
    this.windowGlassMaterial = new THREE.MeshStandardMaterial({
      color: 0xdff4f9,
      transparent: true,
      opacity: 0.22,
      roughness: 0.05,
      metalness: 0.15,
      depthWrite: false, // Ensures exterior panorama and sky sphere render 100% cleanly
    });

    // 7. Bright vibrant LED indicator strips
    this.emissiveCyanMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.8,
      roughness: 0.1,
    });

    this.emissiveEmeraldMaterial = new THREE.MeshStandardMaterial({
      color: 0x00e676,
      emissive: 0x00e676,
      emissiveIntensity: 2.6,
      roughness: 0.1,
    });

    this.emissiveAmberMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb300,
      emissive: 0xffb300,
      emissiveIntensity: 2.5,
      roughness: 0.1,
    });

    // 8. Industrial runway stripe (hazard amber / orange like Image 1 & 3)
    this.runwayStripeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.2,
    });

    // 9. Sleek black/charcoal executive reception desk (Image 1 & 2)
    this.darkDeskMaterial = new THREE.MeshStandardMaterial({
      color: 0x141822,
      roughness: 0.18,
      metalness: 0.85,
    });

    // 10. White illuminated lightbox wall panel (Image 2 & 3)
    this.whiteLightboxMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xdbeafe,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.05,
    });
  }

  /**
   * Generates Umbrella-style Facility Wall Insignia (Image 1 & 2)
   */
  public createFacilityLogoTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Clean white acrylic backing
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1024, 256);

    // Subtle brushed metal border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 1020, 252);

    // Draw Octagonal Umbrella-style Technological Emblem
    const centerX = 130;
    const centerY = 128;
    const radius = 75;
    const segments = 8;

    for (let i = 0; i < segments; i++) {
      const angle1 = (i * Math.PI * 2) / segments;
      const angle2 = ((i + 1) * Math.PI * 2) / segments;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle1, angle2);
      ctx.closePath();

      // Alternating Red and White segments (Iconic Umbrella Corporation look)
      ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Outer border ring on emblem
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Bold Corporate Typography (Image 1 & 2)
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 52px "Inter", sans-serif';
    ctx.letterSpacing = '0.04em';
    ctx.fillText('VICTOR CARREÑO', 240, 115);

    ctx.fillStyle = '#334155';
    ctx.font = '700 21px "JetBrains Mono", monospace';
    ctx.letterSpacing = '0.12em';
    ctx.fillText('OPERATIONS & SPATIAL SYSTEMS LAB', 244, 156);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.letterSpacing = '0.15em';
    ctx.fillText('HIGH-LEVEL WEBXR · ENTERPRISE UNAM IT INFRASTRUCTURE', 245, 186);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates the concentric ceiling dome emblem from Resident Evil NEST (Image 3)
   */
  public createDomeLogoTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Outer dark titanium base
    ctx.fillStyle = '#181e2b';
    ctx.fillRect(0, 0, 512, 512);

    const cx = 256;
    const cy = 256;

    // Concentric metallic rings
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.arc(cx, cy, 230, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#d97706'; // Hazard orange ring (Image 3)
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.stroke();

    // White disc
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.fill();

    // Center Umbrella-style technological emblem (Image 3)
    const segments = 8;
    const radius = 60;
    for (let i = 0; i < segments; i++) {
      const a1 = (i * Math.PI * 2) / segments;
      const a2 = ((i + 1) * Math.PI * 2) / segments;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, a1, a2);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Generates a high-tech grid texture with panel bevels
   */
  public createGridTexture(
    baseColor: string,
    panelColor: string,
    borderColor: string,
    size: number = 512,
    gridCount: number = 8
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    const cellSize = size / gridCount;
    const padding = 2;

    for (let x = 0; x < gridCount; x++) {
      for (let y = 0; y < gridCount; y++) {
        const px = x * cellSize;
        const py = y * cellSize;

        // Border shadow
        ctx.fillStyle = borderColor;
        ctx.fillRect(px, py, cellSize, cellSize);

        // Main tile
        ctx.fillStyle = panelColor;
        ctx.fillRect(px + padding, py + padding, cellSize - padding * 2, cellSize - padding * 2);

        // Subtle technical rivet in corner
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(px + padding + 4, py + padding + 4, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Generates a wall panel texture with vertical seams
   */
  public createPanelTexture(
    baseColor: string,
    seamColor: string,
    grooveColor: string,
    size: number = 512
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // Vertical panel partitions
    const panels = 4;
    const panelWidth = size / panels;

    for (let i = 0; i <= panels; i++) {
      const x = i * panelWidth;
      // Groove shadow
      ctx.fillStyle = grooveColor;
      ctx.fillRect(x - 2, 0, 4, size);

      // Highlight seam
      ctx.fillStyle = seamColor;
      ctx.fillRect(x - 1, 0, 1, size);
    }

    // Horizontal architectural accent lines
    ctx.fillStyle = grooveColor;
    ctx.fillRect(0, size * 0.25 - 1, size, 2);
    ctx.fillRect(0, size * 0.75 - 1, size, 2);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Generates a procedural noise map for realistic roughness
   */
  public createNoiseTexture(size: number = 256, minVal: number = 0.3, maxVal: number = 0.8): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const v = Math.floor((minVal + Math.random() * (maxVal - minVal)) * 255);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Generates dynamic high-density canvas textures for screens
   */
  public createScreenTexture(
    title: string,
    subtitle: string,
    primaryMetric?: { val: string; lbl: string },
    bullets?: string[],
    accentColor: string = '#00f0ff',
    width: number = 512,
    height: number = 384
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Screen dark background
    ctx.fillStyle = '#090c14';
    ctx.fillRect(0, 0, width, height);

    // Subtle technical grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Top status bar
    ctx.fillStyle = '#111522';
    ctx.fillRect(0, 0, width, 44);

    // Status indicator
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(24, 22, 5, 0, Math.PI * 2);
    ctx.fill();

    // Top header text
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title.toUpperCase(), 40, 26);

    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('STATUS: ONLINE // 60 FPS', width - 170, 26);

    // Subtitle / category
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillStyle = accentColor;
    ctx.fillText(subtitle, 24, 76);

    // Primary Metric if present
    let startY = 110;
    if (primaryMetric) {
      ctx.fillStyle = '#131826';
      ctx.beginPath();
      ctx.roundRect(24, startY - 14, width - 48, 86, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.stroke();

      ctx.font = 'bold 36px "JetBrains Mono", monospace';
      ctx.fillStyle = accentColor;
      ctx.fillText(primaryMetric.val, 40, startY + 36);

      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(primaryMetric.lbl.toUpperCase(), 40, startY + 58);

      startY += 105;
    }

    // Bullets / content lines
    if (bullets && bullets.length > 0) {
      ctx.font = '12px "Inter", sans-serif';
      bullets.forEach((line, index) => {
        const lineY = startY + index * 26;
        if (lineY < height - 50) {
          ctx.fillStyle = accentColor;
          ctx.fillText('›', 24, lineY);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(line, 40, lineY);
        }
      });
    }

    // Bottom action prompt bar
    ctx.fillStyle = '#0c0f1a';
    ctx.fillRect(0, height - 36, width, 36);
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = accentColor;
    ctx.fillText('[ E ] PRESS TO ACCESS FULL DOSSIER', 24, height - 14);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Creates a self-illuminating high-clarity screen material from a canvas texture
   */
  public createScreenMaterial(texture: THREE.CanvasTexture): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.15,
      metalness: 0.1,
      emissiveMap: texture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.45,
    });
  }

  /**
   * Generates procedural Earth texture for Room 03 Innovation
   */
  public createEarthTextures(): { dayMap: THREE.CanvasTexture; nightMap: THREE.CanvasTexture } {
    const width = 1024;
    const height = 512;

    // 1. Day map (oceans, continents, landmasses)
    const dayCanvas = document.createElement('canvas');
    dayCanvas.width = width;
    dayCanvas.height = height;
    const dCtx = dayCanvas.getContext('2d')!;

    // Deep ocean
    dCtx.fillStyle = '#071529';
    dCtx.fillRect(0, 0, width, height);

    // Procedural continents using noise / bezier shapes
    dCtx.fillStyle = '#1c3426'; // Land green/slate
    this.drawContinents(dCtx, width, height);

    // Mountain/ridge shading
    dCtx.fillStyle = '#2b4737';
    this.drawMountainRidges(dCtx, width, height);

    // 2. Night lights map (glowing city clusters)
    const nightCanvas = document.createElement('canvas');
    nightCanvas.width = width;
    nightCanvas.height = height;
    const nCtx = nightCanvas.getContext('2d')!;

    nCtx.fillStyle = '#000000';
    nCtx.fillRect(0, 0, width, height);

    // Golden / cyan city dots
    nCtx.fillStyle = '#ffd166';
    this.drawCityLights(nCtx, width, height);

    return {
      dayMap: new THREE.CanvasTexture(dayCanvas),
      nightMap: new THREE.CanvasTexture(nightCanvas),
    };
  }

  private drawContinents(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // North America
    ctx.beginPath();
    ctx.ellipse(w * 0.25, h * 0.35, w * 0.12, h * 0.18, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // South America
    ctx.beginPath();
    ctx.ellipse(w * 0.32, h * 0.65, w * 0.08, h * 0.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Europe
    ctx.beginPath();
    ctx.ellipse(w * 0.52, h * 0.32, w * 0.08, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Africa
    ctx.beginPath();
    ctx.ellipse(w * 0.53, h * 0.58, w * 0.11, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Asia
    ctx.beginPath();
    ctx.ellipse(w * 0.72, h * 0.34, w * 0.18, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Australia
    ctx.beginPath();
    ctx.ellipse(w * 0.82, h * 0.72, w * 0.07, h * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMountainRidges(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.beginPath();
    ctx.ellipse(w * 0.22, h * 0.36, w * 0.04, h * 0.15, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(w * 0.70, h * 0.38, w * 0.08, h * 0.06, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawCityLights(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const points = [
      [w * 0.22, h * 0.35], [w * 0.26, h * 0.38], [w * 0.28, h * 0.32], // North America
      [w * 0.26, h * 0.48], // Mexico City
      [w * 0.34, h * 0.68], [w * 0.33, h * 0.74], // South America
      [w * 0.50, h * 0.30], [w * 0.52, h * 0.28], [w * 0.54, h * 0.32], // Europe
      [w * 0.53, h * 0.46], [w * 0.55, h * 0.75], // Africa
      [w * 0.74, h * 0.35], [w * 0.80, h * 0.36], [w * 0.72, h * 0.46], // Asia
      [w * 0.84, h * 0.74], // Australia
    ];

    points.forEach(([x, y]) => {
      ctx.fillStyle = '#ffeaa7';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Cluster dots
      for (let i = 0; i < 6; i++) {
        const ox = (Math.random() - 0.5) * 20;
        const oy = (Math.random() - 0.5) * 20;
        ctx.fillStyle = 'rgba(255, 234, 167, 0.7)';
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  /**
   * Generates an ultra-crisp, high-resolution (4096x2048) procedural sky & green landscape panorama.
   * Features a clean vibrant azure/sky blue gradient, warm sunny corona, soft clouds,
   * distant rolling mountain silhouettes, and lush emerald green forest hills. Zero pixelation.
   */
  public createProceduralLandscapeTexture(): THREE.CanvasTexture {
    const width = 4096;
    const height = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 1. Sky Gradient (from zenith azure blue to warm horizon sky blue)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 1100);
    skyGrad.addColorStop(0.0, '#0284c7'); // Rich royal azure blue
    skyGrad.addColorStop(0.35, '#0ea5e9'); // Vibrant sky blue
    skyGrad.addColorStop(0.70, '#38bdf8'); // Clear bright cyan blue
    skyGrad.addColorStop(0.92, '#7dd3fc'); // Pale bright sunny blue
    skyGrad.addColorStop(1.0, '#dbeafe'); // Horizon warm atmospheric haze
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, 1150);

    // 2. Radiant Sunny Solar Corona & Disc (at x = 2700, y = 460)
    const sunX = 2700;
    const sunY = 460;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 650);
    sunGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    sunGrad.addColorStop(0.08, 'rgba(255, 253, 230, 0.95)');
    sunGrad.addColorStop(0.20, 'rgba(254, 240, 138, 0.55)');
    sunGrad.addColorStop(0.45, 'rgba(253, 224, 71, 0.15)');
    sunGrad.addColorStop(0.75, 'rgba(224, 242, 254, 0.05)');
    sunGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 650, 0, Math.PI * 2);
    ctx.fill();

    // 3. Subtle soft cumulus clouds drifting in the sunny sky
    const drawCloud = (cx: number, cy: number, w: number, h: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, w * 0.6);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const cloudPuffs = [
      [800, 380, 260, 60, 0.45],
      [980, 360, 200, 50, 0.35],
      [1600, 480, 320, 70, 0.4],
      [1800, 470, 220, 55, 0.35],
      [3400, 420, 280, 65, 0.4],
      [3600, 410, 220, 50, 0.3],
      [400, 520, 250, 55, 0.35],
      [2200, 380, 300, 60, 0.3],
    ];
    cloudPuffs.forEach(([cx, cy, w, h, a]) => drawCloud(cx, cy, w, h, a));

    // 4. Distant Mountain Silhouettes (Layer 1: Blue-green mist)
    ctx.fillStyle = '#115e59';
    ctx.beginPath();
    ctx.moveTo(0, 1100);
    for (let x = 0; x <= width; x += 30) {
      const y = 980 + Math.sin(x * 0.003) * 60 + Math.sin(x * 0.007) * 35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, 1200);
    ctx.lineTo(0, 1200);
    ctx.closePath();
    ctx.fill();

    // Atmospheric haze wash over distant mountains
    const hazeGrad = ctx.createLinearGradient(0, 940, 0, 1120);
    hazeGrad.addColorStop(0, 'rgba(219, 234, 254, 0.0)');
    hazeGrad.addColorStop(1, 'rgba(219, 234, 254, 0.45)');
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, 940, width, 180);

    // 5. Rolling Mid-Distance Green Hills (Layer 2: Emerald forest hills)
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(0, 1150);
    for (let x = 0; x <= width; x += 25) {
      const y = 1040 + Math.sin(x * 0.004 + 1.2) * 55 + Math.cos(x * 0.009) * 25;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, 1300);
    ctx.lineTo(0, 1300);
    ctx.closePath();
    ctx.fill();

    // 6. Near Forest Ridge & Lush Tree Crowns (Layer 3)
    const treeGrad = ctx.createLinearGradient(0, 1080, 0, 1350);
    treeGrad.addColorStop(0, '#166534');
    treeGrad.addColorStop(1, '#14532d');
    ctx.fillStyle = treeGrad;
    ctx.beginPath();
    ctx.moveTo(0, 1250);
    for (let x = 0; x <= width; x += 20) {
      const y = 1100 + Math.sin(x * 0.006 + 2.5) * 45;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, 1400);
    ctx.lineTo(0, 1400);
    ctx.closePath();
    ctx.fill();

    // Vibrant procedural tree crowns along the tree ridge
    const greenHues = ['#16a34a', '#15803d', '#22c55e', '#166534', '#4ade80'];
    for (let x = 0; x < width; x += 16) {
      const baseY = 1100 + Math.sin(x * 0.006 + 2.5) * 45;
      const r = 12 + ((x * 17) % 18);
      const color = greenHues[(x / 16) % greenHues.length];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, baseY + r * 0.2, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Ground Grassland Terrain (Layer 4: from y = 1180 to 2048)
    const groundGrad = ctx.createLinearGradient(0, 1180, 0, 2048);
    groundGrad.addColorStop(0.0, '#16a34a'); // Vibrant summer grass
    groundGrad.addColorStop(0.25, '#15803d'); // Deep green turf
    groundGrad.addColorStop(0.65, '#166534'); // Forest floor
    groundGrad.addColorStop(1.0, '#14532d'); // Rich dark meadow
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 1180, width, height - 1180);

    // Subtle fine grass texture across foreground
    ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
    for (let y = 1220; y < height; y += 8) {
      ctx.fillRect(0, y, width, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}

export const materials = MaterialFactory.getInstance();
