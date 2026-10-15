import type { ARSessionCapabilities } from '../types.js';
/**
 * ARSession evaluates device capabilities, permissions, secure contexts (HTTPS),
 * and potential WebXR support before launching experiences.
 */
export declare class ARSession {
    /**
     * Evaluates browser, camera, and WebXR capabilities asynchronously.
     */
    static checkCapabilities(): Promise<ARSessionCapabilities>;
    /**
     * Prompts the user for camera access permissions.
     * Throws an informative error if the user denies or camera is unavailable.
     */
    static requestCameraPermission(): Promise<boolean>;
}
//# sourceMappingURL=ARSession.d.ts.map