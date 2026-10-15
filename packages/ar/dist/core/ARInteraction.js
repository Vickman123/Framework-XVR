import * as THREE from 'three';
/**
 * ARInteraction provides touch and mouse gesture controls (drag-to-rotate,
 * pinch-to-scale, raycasting tap detection) on 3D AR content.
 */
export class ARInteraction {
    domElement;
    camera;
    targetObject = null;
    options;
    // Interaction State
    isPointerDown = false;
    lastPointerX = 0;
    lastPointerY = 0;
    initialPinchDist = 0;
    initialScale = 1;
    // Raycaster for Taps
    raycaster = new THREE.Raycaster();
    mouseVec = new THREE.Vector2();
    // Callbacks
    onModelTapped;
    // Bound Event Listeners for clean disposal
    onPointerDownBound;
    onPointerMoveBound;
    onPointerUpBound;
    onTouchStartBound;
    onTouchMoveBound;
    onTouchEndBound;
    onWheelBound;
    constructor(domElement, camera, options = {}) {
        this.domElement = domElement;
        this.camera = camera;
        this.options = {
            enableRotate: options.enableRotate !== false,
            enablePinchScale: options.enablePinchScale !== false,
            minScale: options.minScale ?? 0.1,
            maxScale: options.maxScale ?? 8.0,
            rotateSpeed: options.rotateSpeed ?? 0.008,
            pinchSpeed: options.pinchSpeed ?? 0.005,
        };
        this.onPointerDownBound = this.handlePointerDown.bind(this);
        this.onPointerMoveBound = this.handlePointerMove.bind(this);
        this.onPointerUpBound = this.handlePointerUp.bind(this);
        this.onTouchStartBound = this.handleTouchStart.bind(this);
        this.onTouchMoveBound = this.handleTouchMove.bind(this);
        this.onTouchEndBound = this.handleTouchEnd.bind(this);
        this.onWheelBound = this.handleWheel.bind(this);
        this.bindEvents();
    }
    setTarget(object) {
        this.targetObject = object;
        if (object) {
            this.initialScale = object.scale.x;
        }
    }
    bindEvents() {
        this.domElement.addEventListener('pointerdown', this.onPointerDownBound);
        window.addEventListener('pointermove', this.onPointerMoveBound);
        window.addEventListener('pointerup', this.onPointerUpBound);
        this.domElement.addEventListener('touchstart', this.onTouchStartBound, { passive: false });
        window.addEventListener('touchmove', this.onTouchMoveBound, { passive: false });
        window.addEventListener('touchend', this.onTouchEndBound);
        this.domElement.addEventListener('wheel', this.onWheelBound, { passive: false });
    }
    handlePointerDown(e) {
        if (e.pointerType === 'touch')
            return; // Handled by touch events for multi-touch support
        this.isPointerDown = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
        // Check tap raycast
        this.checkTap(e.clientX, e.clientY);
    }
    handlePointerMove(e) {
        if (!this.isPointerDown || !this.targetObject || !this.options.enableRotate)
            return;
        const deltaX = e.clientX - this.lastPointerX;
        const deltaY = e.clientY - this.lastPointerY;
        this.targetObject.rotation.y += deltaX * this.options.rotateSpeed;
        this.targetObject.rotation.x += deltaY * (this.options.rotateSpeed * 0.5);
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
    }
    handlePointerUp() {
        this.isPointerDown = false;
    }
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.lastPointerX = e.touches[0].clientX;
            this.lastPointerY = e.touches[0].clientY;
            this.isPointerDown = true;
            this.checkTap(e.touches[0].clientX, e.touches[0].clientY);
        }
        else if (e.touches.length === 2 && this.options.enablePinchScale) {
            e.preventDefault();
            this.initialPinchDist = this.getTouchDistance(e.touches[0], e.touches[1]);
            if (this.targetObject) {
                this.initialScale = this.targetObject.scale.x;
            }
        }
    }
    handleTouchMove(e) {
        if (!this.targetObject)
            return;
        if (e.touches.length === 1 && this.isPointerDown && this.options.enableRotate) {
            const deltaX = e.touches[0].clientX - this.lastPointerX;
            const deltaY = e.touches[0].clientY - this.lastPointerY;
            this.targetObject.rotation.y += deltaX * this.options.rotateSpeed;
            this.targetObject.rotation.x += deltaY * (this.options.rotateSpeed * 0.5);
            this.lastPointerX = e.touches[0].clientX;
            this.lastPointerY = e.touches[0].clientY;
        }
        else if (e.touches.length === 2 && this.options.enablePinchScale && this.initialPinchDist > 0) {
            e.preventDefault();
            const currentDist = this.getTouchDistance(e.touches[0], e.touches[1]);
            const factor = currentDist / this.initialPinchDist;
            const newScale = THREE.MathUtils.clamp(this.initialScale * factor, this.options.minScale, this.options.maxScale);
            this.targetObject.scale.setScalar(newScale);
        }
    }
    handleTouchEnd() {
        this.isPointerDown = false;
        this.initialPinchDist = 0;
    }
    handleWheel(e) {
        if (!this.targetObject || !this.options.enablePinchScale)
            return;
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const newScale = THREE.MathUtils.clamp(this.targetObject.scale.x * zoomFactor, this.options.minScale, this.options.maxScale);
        this.targetObject.scale.setScalar(newScale);
    }
    checkTap(clientX, clientY) {
        if (!this.targetObject || !this.onModelTapped)
            return;
        const rect = this.domElement.getBoundingClientRect();
        this.mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouseVec, this.camera);
        const intersects = this.raycaster.intersectObject(this.targetObject, true);
        if (intersects.length > 0) {
            this.onModelTapped(intersects[0]);
        }
    }
    getTouchDistance(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    dispose() {
        this.domElement.removeEventListener('pointerdown', this.onPointerDownBound);
        window.removeEventListener('pointermove', this.onPointerMoveBound);
        window.removeEventListener('pointerup', this.onPointerUpBound);
        this.domElement.removeEventListener('touchstart', this.onTouchStartBound);
        window.removeEventListener('touchmove', this.onTouchMoveBound);
        window.removeEventListener('touchend', this.onTouchEndBound);
        this.domElement.removeEventListener('wheel', this.onWheelBound);
        this.targetObject = null;
    }
}
//# sourceMappingURL=ARInteraction.js.map