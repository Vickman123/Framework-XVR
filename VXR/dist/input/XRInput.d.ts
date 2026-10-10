import * as THREE from 'three';
import type { XRSession } from '../XRSession.js';
import type { ActionCallback, Vector2D, XRButtonBindings, XRInputOptions } from './types.js';
/**
 * XRInput provides a high-level, hardware-agnostic semantic action abstraction
 * for desktop keyboards/mice, touchscreens, and WebXR 6DoF motion controllers.
 *
 * It bridges PC and Meta Quest VR inputs into unified actions like 'move', 'look',
 * and 'fire', allowing identical game mechanics to work anywhere seamlessly.
 *
 * @example
 * ```typescript
 * const input = new XRInput(canvas, app.session);
 *
 * app.onUpdate((delta) => {
 *   const move = input.getVector('move');
 *   if (input.isJustPressed('fire')) {
 *     player.shoot();
 *   }
 * });
 * ```
 */
export declare class XRInput {
    options: Required<Omit<XRInputOptions, 'domElement' | 'keyBindings' | 'mouseButtonBindings' | 'xrButtonBindings'>> & {
        domElement: HTMLElement | null;
        keyBindings: Record<string, string[]>;
        mouseButtonBindings: Record<number, string>;
        xrButtonBindings: Required<XRButtonBindings>;
    };
    private xrSession;
    private domElement;
    private activeKeys;
    private activeMouseButtons;
    private mouseDelta;
    private _isPointerLocked;
    private actionStates;
    private prevActionPressed;
    private vectorStates;
    private actionListeners;
    private snapCooldownTimer;
    private snapTurnPending;
    private cleanupCallbacks;
    private tempForward;
    private tempRight;
    private tempDirection;
    constructor(domElement?: HTMLElement | null, xrSession?: XRSession | null, options?: XRInputOptions);
    private setupDesktopListeners;
    private setupXRListeners;
    /**
     * Requests pointer lock on the target canvas element for first-person mouse look.
     */
    requestPointerLock(): void;
    /**
     * Exits pointer lock.
     */
    exitPointerLock(): void;
    /**
     * Whether pointer lock is currently active on the canvas.
     */
    get isPointerLocked(): boolean;
    /**
     * Returns whether a given action is currently pressed / active.
     */
    isPressed(action: string): boolean;
    /**
     * Returns true ONLY during the exact frame the action transitioned from released to pressed.
     */
    isJustPressed(action: string): boolean;
    /**
     * Returns true ONLY during the exact frame the action transitioned from pressed to released.
     */
    isJustReleased(action: string): boolean;
    /**
     * Returns the analog intensity value of an action between 0.0 and 1.0 (e.g. trigger depth).
     */
    getValue(action: string): number;
    /**
     * Returns the current 2D vector for directional actions (e.g. 'move' or 'look').
     */
    getVector(action: string): Vector2D;
    /**
     * Returns any pending snap turn rotation in degrees triggered during this frame.
     * Resets to 0 after read.
     */
    consumeSnapTurn(): number;
    /**
     * Subscribes to changes in an action state (pressed or released).
     * @returns Unsubscribe function.
     */
    onAction(action: string, callback: ActionCallback): () => void;
    /**
     * Subscribes to when an action is pressed down.
     */
    onActionDown(action: string, callback: () => void): () => void;
    /**
     * Subscribes to when an action is released.
     */
    onActionUp(action: string, callback: () => void): () => void;
    /**
     * Computes a normalized world-space movement vector based on the player's
     * current 'move' action and the horizontal orientation of a reference camera.
     *
     * @param camera The active camera (Desktop or WebXR eye camera)
     * @returns THREE.Vector3 direction vector on the X-Z ground plane
     */
    getMovementDirection(camera: THREE.Camera): THREE.Vector3;
    /**
     * Evaluates hardware state, processes WebXR gamepads, calculates transitions,
     * and fires action events. Must be called once per frame.
     *
     * @param delta Time in seconds since previous frame
     */
    update(delta: number): void;
    private pollDesktop;
    private pollXR;
    private isKeyActive;
    private dispatchAction;
    private dispatchImmediateAction;
    /**
     * Simulates a key event for unit tests or virtual on-screen keyboards.
     */
    simulateKey(code: string, pressed: boolean): void;
    /**
     * Simulates a mouse button event for unit tests.
     */
    simulateMouseButton(button: number, pressed: boolean): void;
    /**
     * Simulates mouse delta movement for unit tests.
     */
    simulateMouseMove(deltaX: number, deltaY: number): void;
    /**
     * Releases all event listeners and state maps.
     */
    dispose(): void;
}
//# sourceMappingURL=XRInput.d.ts.map