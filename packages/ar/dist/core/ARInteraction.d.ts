import * as THREE from 'three';
import type { ARInteractionOptions } from '../types.js';
/**
 * ARInteraction provides touch and mouse gesture controls (drag-to-rotate,
 * pinch-to-scale, raycasting tap detection) on 3D AR content.
 */
export declare class ARInteraction {
    private domElement;
    private camera;
    private targetObject;
    private options;
    private isPointerDown;
    private lastPointerX;
    private lastPointerY;
    private initialPinchDist;
    private initialScale;
    private raycaster;
    private mouseVec;
    onModelTapped?: (intersection: THREE.Intersection) => void;
    private onPointerDownBound;
    private onPointerMoveBound;
    private onPointerUpBound;
    private onTouchStartBound;
    private onTouchMoveBound;
    private onTouchEndBound;
    private onWheelBound;
    constructor(domElement: HTMLElement, camera: THREE.Camera, options?: ARInteractionOptions);
    setTarget(object: THREE.Object3D | null): void;
    private bindEvents;
    private handlePointerDown;
    private handlePointerMove;
    private handlePointerUp;
    private handleTouchStart;
    private handleTouchMove;
    private handleTouchEnd;
    private handleWheel;
    private checkTap;
    private getTouchDistance;
    dispose(): void;
}
//# sourceMappingURL=ARInteraction.d.ts.map