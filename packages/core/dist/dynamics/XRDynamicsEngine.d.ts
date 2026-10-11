import * as THREE from 'three';
export interface XRDynamicsOptions {
    /** Target duration of a dynamic challenge in seconds (Default: 60) */
    duration?: number;
    /** Maximum concurrent active 3D target nodes (Default: 5) */
    maxNodes?: number;
    /** Custom score multipliers */
    basePoints?: number;
}
export interface XRDynamicNode {
    mesh: THREE.Mesh;
    id: string;
    points: number;
    createdAt: number;
}
/**
 * XRDynamicsEngine manages gameplay loops, calibration sessions, score tracking,
 * combo streaks, and interactive target node generation in 3D WebXR environments.
 */
export declare class XRDynamicsEngine {
    score: number;
    streak: number;
    nodesCleared: number;
    isRunning: boolean;
    timeRemaining: number;
    private scene;
    private options;
    private activeNodes;
    private timerInterval;
    private nodeContainer;
    constructor(scene: THREE.Scene, options?: XRDynamicsOptions);
    /**
     * Starts the dynamics challenge loop.
     */
    start(): void;
    /**
     * Spawns a floating interactive 3D node around the player.
     */
    spawnNode(): XRDynamicNode;
    spawnBatch(count: number): void;
    /**
     * Registers a hit/interaction on a dynamic node.
     */
    hitNode(nodeMesh: THREE.Object3D): number;
    /**
     * Per-frame animation tick for active nodes.
     */
    update(delta: number, elapsed: number): void;
    /**
     * Completes the challenge when time expires.
     */
    complete(): void;
    /**
     * Resets and stops the dynamic session.
     */
    stop(): void;
    dispose(): void;
}
//# sourceMappingURL=XRDynamicsEngine.d.ts.map