import * as THREE from 'three';
import { ARCamera } from './ARCamera.js';
import { ARSession } from './ARSession.js';
import { ARAssetManager } from './ARAssetManager.js';
import { ARInteraction } from './ARInteraction.js';
import { ARImageTracker } from '../tracking/ARImageTracker.js';
import { ARMarkerTracker } from '../tracking/ARMarkerTracker.js';
import { ARQRCode } from '../tracking/ARQRCode.js';
/**
 * ARExperience is the primary entry point and lifecycle orchestrator for VXR AR.
 *
 * It brings together camera video feeds, WebGL/Three.js rendering,
 * spatial tracking (Image, Marker, QR), 3D asset management, and gesture interactions.
 */
export class ARExperience {
    scene;
    camera;
    renderer;
    arCamera;
    assets;
    interaction;
    imageTracker = null;
    markerTracker = null;
    qrScanner = null;
    manifest = null;
    container;
    canvas;
    isRunning = false;
    animFrameId = null;
    clock = new THREE.Clock();
    currentState = 'uninitialized';
    activeModel = null;
    onStateChangeCb;
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.manifest = options.manifest || null;
        this.onStateChangeCb = options.onStateChange;
        // 1. Setup Three.js Scene
        this.scene = new THREE.Scene();
        // 2. Setup Perspective Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000);
        this.camera.position.set(0, 0, 0);
        // 3. Setup Transparent WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.canvas = this.renderer.domElement;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '1';
        this.canvas.style.pointerEvents = 'auto';
        // 4. Setup Lighting
        this.setupLighting();
        // 5. Initialize Subsystems
        this.arCamera = new ARCamera({
            container: this.container,
            ...options.cameraOptions,
        });
        this.assets = new ARAssetManager();
        this.interaction = new ARInteraction(this.canvas, this.camera, options.interactionOptions);
        // 6. Handle Resizing
        window.addEventListener('resize', this.onWindowResize);
    }
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        this.scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(2, 4, 3);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 20;
        this.scene.add(dirLight);
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        hemiLight.position.set(0, 10, 0);
        this.scene.add(hemiLight);
    }
    setState(state, details) {
        this.currentState = state;
        if (this.onStateChangeCb) {
            this.onStateChangeCb(state, details);
        }
    }
    /**
     * Initializes camera, verifies permissions, sets up trackers, and appends canvas to DOM.
     */
    async init() {
        this.setState('requesting_camera');
        // 1. Verify Capabilities
        const caps = await ARSession.checkCapabilities();
        if (!caps.isSecureContext) {
            console.warn('VXR AR: Ejecutando en contexto no seguro (HTTP). La cámara puede fallar.');
        }
        // 2. Start Camera Feed
        const video = await this.arCamera.start();
        // 3. Append Canvas to container
        if (!this.canvas.parentElement) {
            this.container.appendChild(this.canvas);
        }
        // 4. Configure Tracking Engine based on manifest
        const mode = this.manifest?.mode || 'image';
        if (mode === 'image') {
            this.imageTracker = new ARImageTracker({
                targetSrc: this.manifest?.targetUrl,
            });
            this.imageTracker.onStateChange = (st, dt) => this.setState(st, dt);
            await this.imageTracker.init(video, this.camera);
            this.scene.add(this.imageTracker.anchorGroup);
            this.interaction.setTarget(this.imageTracker.anchorGroup);
        }
        else if (mode === 'marker') {
            this.markerTracker = new ARMarkerTracker();
            this.markerTracker.onStateChange = (st, dt) => this.setState(st, dt);
            await this.markerTracker.init(video, this.camera);
            this.scene.add(this.markerTracker.anchorGroup);
            this.interaction.setTarget(this.markerTracker.anchorGroup);
        }
        else if (mode === 'qr') {
            this.qrScanner = new ARQRCode();
        }
        // 5. Load Initial Model if specified in manifest
        if (this.manifest && this.manifest.models.length > 0) {
            const idx = this.manifest.activeModelIndex || 0;
            await this.loadModelByIndex(idx);
        }
        this.onWindowResize();
        this.setState('scanning');
    }
    /**
     * Loads a model by index from the manifest and attaches it to the active tracking anchor.
     */
    async loadModelByIndex(index) {
        if (!this.manifest || !this.manifest.models[index])
            return null;
        const config = this.manifest.models[index];
        return this.loadModel(config);
    }
    /**
     * Loads and displays a 3D model config.
     */
    async loadModel(config) {
        if (this.activeModel) {
            this.activeModel.dispose();
            this.activeModel = null;
        }
        const model = await this.assets.loadModel(config);
        this.activeModel = model;
        // Attach to active anchor group
        if (this.imageTracker) {
            this.imageTracker.anchorGroup.add(model.root);
        }
        else if (this.markerTracker) {
            this.markerTracker.anchorGroup.add(model.root);
        }
        else {
            // Default world position for QR launch
            this.scene.add(model.root);
            model.root.position.set(0, 0, -1.5);
        }
        return model;
    }
    /**
     * Starts the continuous rendering and tracking loop.
     */
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.clock.start();
        if (this.imageTracker)
            this.imageTracker.start();
        if (this.markerTracker)
            this.markerTracker.start();
        const renderLoop = () => {
            if (!this.isRunning)
                return;
            this.animFrameId = requestAnimationFrame(renderLoop);
            const deltaTime = this.clock.getDelta();
            // Update active tracker
            if (this.imageTracker)
                this.imageTracker.update(deltaTime);
            if (this.markerTracker)
                this.markerTracker.update(deltaTime);
            // Update animations
            this.assets.update(deltaTime);
            // Render Scene
            this.renderer.render(this.scene, this.camera);
        };
        renderLoop();
    }
    /**
     * Stops rendering and pauses tracking.
     */
    stop() {
        this.isRunning = false;
        if (this.animFrameId !== null) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        if (this.imageTracker)
            this.imageTracker.stop();
        if (this.markerTracker)
            this.markerTracker.stop();
    }
    onWindowResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    };
    get state() {
        return this.currentState;
    }
    get currentModel() {
        return this.activeModel;
    }
    /**
     * Completely destroys experience, stops camera tracks, disposes Three.js objects,
     * GPU textures, audio and event listeners to ensure ZERO memory leaks.
     */
    destroy() {
        this.stop();
        window.removeEventListener('resize', this.onWindowResize);
        this.arCamera.stop();
        this.interaction.dispose();
        this.assets.dispose();
        if (this.imageTracker) {
            this.imageTracker.dispose();
            this.imageTracker = null;
        }
        if (this.markerTracker) {
            this.markerTracker.dispose();
            this.markerTracker = null;
        }
        if (this.qrScanner) {
            this.qrScanner.dispose();
            this.qrScanner = null;
        }
        // Clean Three.js Scene
        this.scene.clear();
        this.renderer.dispose();
        if (this.canvas.parentElement) {
            this.canvas.parentElement.removeChild(this.canvas);
        }
    }
}
//# sourceMappingURL=ARExperience.js.map