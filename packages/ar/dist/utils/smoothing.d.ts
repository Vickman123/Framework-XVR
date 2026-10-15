import * as THREE from 'three';
/**
 * ARMatrixSmoother applies temporal interpolation (Lerp + Slerp)
 * to 6-DoF transformation matrices to eliminate visual jitter.
 */
export declare class ARMatrixSmoother {
    private currentMatrix;
    private targetMatrix;
    private currentPos;
    private currentQuat;
    private currentScale;
    private targetPos;
    private targetQuat;
    private targetScale;
    private hasInitialSample;
    private smoothingFactor;
    /**
     * @param smoothingFactor Value between 0 (frozen) and 1 (instant/no smoothing). Default: 0.35
     */
    constructor(smoothingFactor?: number);
    /**
     * Feeds a new raw transformation matrix from the tracking engine.
     */
    update(rawMatrix: THREE.Matrix4): THREE.Matrix4;
    /**
     * Resets filter state when a target is lost or re-acquired.
     */
    reset(): void;
    get matrix(): THREE.Matrix4;
}
//# sourceMappingURL=smoothing.d.ts.map