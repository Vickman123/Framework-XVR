import * as THREE from 'three';

/**
 * ARMatrixSmoother applies temporal interpolation (Lerp + Slerp)
 * to 6-DoF transformation matrices to eliminate visual jitter.
 */
export class ARMatrixSmoother {
  private currentMatrix = new THREE.Matrix4();
  private targetMatrix = new THREE.Matrix4();

  private currentPos = new THREE.Vector3();
  private currentQuat = new THREE.Quaternion();
  private currentScale = new THREE.Vector3(1, 1, 1);

  private targetPos = new THREE.Vector3();
  private targetQuat = new THREE.Quaternion();
  private targetScale = new THREE.Vector3(1, 1, 1);

  private hasInitialSample = false;
  private smoothingFactor: number;

  /**
   * @param smoothingFactor Value between 0 (frozen) and 1 (instant/no smoothing). Default: 0.35
   */
  constructor(smoothingFactor = 0.35) {
    this.smoothingFactor = THREE.MathUtils.clamp(smoothingFactor, 0.05, 1.0);
  }

  /**
   * Feeds a new raw transformation matrix from the tracking engine.
   */
  public update(rawMatrix: THREE.Matrix4): THREE.Matrix4 {
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
  public reset(): void {
    this.hasInitialSample = false;
  }

  public get matrix(): THREE.Matrix4 {
    return this.currentMatrix;
  }
}
