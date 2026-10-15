import * as THREE from 'three';
/**
 * ARMatrixSmoother applies temporal interpolation (Lerp + Slerp)
 * to 6-DoF transformation matrices to eliminate visual jitter.
 */
export class ARMatrixSmoother {
    currentMatrix = new THREE.Matrix4();
    targetMatrix = new THREE.Matrix4();
    currentPos = new THREE.Vector3();
    currentQuat = new THREE.Quaternion();
    currentScale = new THREE.Vector3(1, 1, 1);
    targetPos = new THREE.Vector3();
    targetQuat = new THREE.Quaternion();
    targetScale = new THREE.Vector3(1, 1, 1);
    hasInitialSample = false;
    smoothingFactor;
    /**
     * @param smoothingFactor Value between 0 (frozen) and 1 (instant/no smoothing). Default: 0.35
     */
    constructor(smoothingFactor = 0.35) {
        this.smoothingFactor = THREE.MathUtils.clamp(smoothingFactor, 0.05, 1.0);
    }
    /**
     * Feeds a new raw transformation matrix from the tracking engine.
     */
    update(rawMatrix) {
        this.targetMatrix.copy(rawMatrix);
        this.targetMatrix.decompose(this.targetPos, this.targetQuat, this.targetScale);
        if (!this.hasInitialSample) {
            this.currentPos.copy(this.targetPos);
            this.currentQuat.copy(this.targetQuat);
            this.currentScale.copy(this.targetScale);
            this.currentMatrix.copy(rawMatrix);
            this.hasInitialSample = true;
            return this.currentMatrix;
        }
        // Temporal Lerp for position and scale
        this.currentPos.lerp(this.targetPos, this.smoothingFactor);
        this.currentScale.lerp(this.targetScale, this.smoothingFactor);
        // Slerp for orientation quaternion
        this.currentQuat.slerp(this.targetQuat, this.smoothingFactor);
        this.currentMatrix.compose(this.currentPos, this.currentQuat, this.currentScale);
        return this.currentMatrix;
    }
    /**
     * Resets filter state when a target is lost or re-acquired.
     */
    reset() {
        this.hasInitialSample = false;
    }
    get matrix() {
        return this.currentMatrix;
    }
}
//# sourceMappingURL=smoothing.js.map