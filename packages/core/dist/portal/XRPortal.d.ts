import * as THREE from 'three';
export interface XRPortalOptions {
    /** Target experience destination URL */
    url: string;
    /** Experience title to display */
    title: string;
    /** Category or mode tag (e.g. 'Simulation', 'Arcade FPS') */
    category?: string;
    /** Platform compatibility badge (e.g. 'QUEST 3S / PC') */
    badge?: string;
    /** Primary accent color (Hex string or numeric) */
    color?: string | number;
    /** Emissive Three.js color */
    emissiveColor?: number;
    /** Icon/Emoji representation */
    icon?: string;
    /** Physical position in world coordinates [x, y, z] */
    position?: [number, number, number];
    /** Rotation around Y axis in radians */
    rotationY?: number;
    /** Micro-artifact 3D floating shape: 'crystal' | 'laptop' | 'cube' | 'torus' */
    artifactType?: 'crystal' | 'laptop' | 'cube' | 'torus';
    /** Whether the portal is locked or in development */
    isUpcoming?: boolean;
}
/**
 * XRPortal represents a standalone sci-fi teleportation monolith with emissive bevels,
 * custom glass textures, floating procedural 3D artifacts, and a safe WebXR exit-to-navigate protocol.
 */
export declare class XRPortal {
    readonly group: THREE.Group;
    readonly options: XRPortalOptions;
    readonly artifact: THREE.Group;
    readonly screenMesh: THREE.Mesh;
    readonly frameMesh: THREE.Mesh;
    private canvas;
    private texture;
    constructor(options: XRPortalOptions);
    private drawPortalTexture;
    private createArtifact;
    /**
     * Updates animations per frame (floating artifacts rotation).
     */
    update(delta: number, elapsed: number): void;
    /**
     * Safely redirects the browser to the portal's target URL,
     * properly terminating active WebXR sessions first to avoid headset hang-ups.
     */
    navigate(renderer?: THREE.WebGLRenderer): void;
    dispose(): void;
}
//# sourceMappingURL=XRPortal.d.ts.map