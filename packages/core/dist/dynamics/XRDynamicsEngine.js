import * as THREE from 'three';
/**
 * XRDynamicsEngine manages gameplay loops, calibration sessions, score tracking,
 * combo streaks, and interactive target node generation in 3D WebXR environments.
 */
export class XRDynamicsEngine {
    score = 0;
    streak = 1;
    nodesCleared = 0;
    isRunning = false;
    timeRemaining = 60;
    scene;
    options;
    activeNodes = new Map();
    timerInterval = null;
    nodeContainer;
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = {
            duration: options.duration ?? 60,
            maxNodes: options.maxNodes ?? 5,
            basePoints: options.basePoints ?? 100,
        };
        this.nodeContainer = new THREE.Group();
        this.nodeContainer.name = 'VXR_Dynamics_Nodes';
        this.scene.add(this.nodeContainer);
    }
    /**
     * Starts the dynamics challenge loop.
     */
    start() {
        this.stop();
        this.score = 0;
        this.streak = 1;
        this.nodesCleared = 0;
        this.timeRemaining = this.options.duration;
        this.isRunning = true;
        this.spawnBatch(3);
        this.timerInterval = window.setInterval(() => {
            this.timeRemaining--;
            if (this.timeRemaining <= 0) {
                this.complete();
            }
        }, 1000);
    }
    /**
     * Spawns a floating interactive 3D node around the player.
     */
    spawnNode() {
        const id = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        // Geometry: Pulsing Icosahedron / Orb
        const geo = new THREE.IcosahedronGeometry(0.24, 1);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.8,
        });
        const mesh = new THREE.Mesh(geo, mat);
        // Random spherical coordinates in front of player
        const radius = 2.2 + Math.random() * 3.5;
        const angle = (Math.random() - 0.5) * Math.PI * 0.9;
        const height = 0.8 + Math.random() * 1.6;
        mesh.position.set(Math.sin(angle) * radius, height, -Math.cos(angle) * radius);
        mesh.userData = {
            isDynamicNode: true,
            nodeId: id,
        };
        this.nodeContainer.add(mesh);
        const node = {
            mesh,
            id,
            points: this.options.basePoints,
            createdAt: Date.now(),
        };
        this.activeNodes.set(id, node);
        return node;
    }
    spawnBatch(count) {
        for (let i = 0; i < count; i++) {
            if (this.activeNodes.size < this.options.maxNodes) {
                this.spawnNode();
            }
        }
    }
    /**
     * Registers a hit/interaction on a dynamic node.
     */
    hitNode(nodeMesh) {
        const id = nodeMesh.userData.nodeId;
        const node = this.activeNodes.get(id);
        if (!node)
            return 0;
        const gained = node.points * this.streak;
        this.score += gained;
        this.streak = Math.min(this.streak + 1, 5);
        this.nodesCleared++;
        // Remove from scene with cleanup
        this.nodeContainer.remove(node.mesh);
        node.mesh.geometry.dispose();
        node.mesh.material.dispose();
        this.activeNodes.delete(id);
        // Maintain node count if game active
        if (this.isRunning && this.activeNodes.size < 3) {
            this.spawnNode();
        }
        return gained;
    }
    /**
     * Per-frame animation tick for active nodes.
     */
    update(delta, elapsed) {
        let idx = 0;
        this.activeNodes.forEach(node => {
            node.mesh.rotation.y += delta * 1.5;
            node.mesh.rotation.x += delta * 0.8;
            node.mesh.position.y += Math.sin(elapsed * 2.0 + idx) * 0.002;
            idx++;
        });
    }
    /**
     * Completes the challenge when time expires.
     */
    complete() {
        this.isRunning = false;
        if (this.timerInterval !== null) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    /**
     * Resets and stops the dynamic session.
     */
    stop() {
        this.complete();
        this.activeNodes.forEach(node => {
            this.nodeContainer.remove(node.mesh);
            node.mesh.geometry.dispose();
            node.mesh.material.dispose();
        });
        this.activeNodes.clear();
    }
    dispose() {
        this.stop();
        this.scene.remove(this.nodeContainer);
    }
}
//# sourceMappingURL=XRDynamicsEngine.js.map