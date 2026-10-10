import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { XRInput } from '../packages/core/dist/input/XRInput.js';

test('XRInput Multiplatform Action Mapping Suite', async (t) => {
  await t.test('initializes with default bindings and inactive states', () => {
    const input = new XRInput();
    assert.equal(input.isPressed('fire'), false);
    assert.equal(input.isJustPressed('fire'), false);
    assert.equal(input.isJustReleased('fire'), false);
    assert.equal(input.getValue('fire'), 0);

    const move = input.getVector('move');
    assert.equal(move.x, 0);
    assert.equal(move.y, 0);
    input.dispose();
  });

  await t.test('handles digital key press transitions (justPressed, held, justReleased)', () => {
    const input = new XRInput();

    // Frame 0: Key down
    input.simulateKey('Space', true);
    input.update(0.016);

    assert.equal(input.isPressed('jump'), true, 'jump should be pressed');
    assert.equal(input.isJustPressed('jump'), true, 'jump should be justPressed on frame 1');
    assert.equal(input.isJustReleased('jump'), false);

    // Frame 1: Still held
    input.update(0.016);
    assert.equal(input.isPressed('jump'), true, 'jump should remain pressed on frame 2');
    assert.equal(input.isJustPressed('jump'), false, 'jump should no longer be justPressed on frame 2');
    assert.equal(input.isJustReleased('jump'), false);

    // Frame 2: Key up
    input.simulateKey('Space', false);
    input.update(0.016);
    assert.equal(input.isPressed('jump'), false, 'jump should be released');
    assert.equal(input.isJustPressed('jump'), false);
    assert.equal(input.isJustReleased('jump'), true, 'jump should be justReleased on release frame');

    // Frame 3: Inactive
    input.update(0.016);
    assert.equal(input.isPressed('jump'), false);
    assert.equal(input.isJustReleased('jump'), false);

    input.dispose();
  });

  await t.test('computes normalized 2D movement vector from keyboard inputs', () => {
    const input = new XRInput();

    // Move forward (W)
    input.simulateKey('KeyW', true);
    input.update(0.016);
    let move = input.getVector('move');
    assert.equal(move.x, 0);
    assert.equal(move.y, 1);

    // Move diagonally forward-right (W + D)
    input.simulateKey('KeyD', true);
    input.update(0.016);
    move = input.getVector('move');
    assert.ok(Math.abs(move.x - Math.SQRT1_2) < 0.001, `x=${move.x} should be ~0.707`);
    assert.ok(Math.abs(move.y - Math.SQRT1_2) < 0.001, `y=${move.y} should be ~0.707`);

    // Release all
    input.simulateKey('KeyW', false);
    input.simulateKey('KeyD', false);
    input.update(0.016);
    move = input.getVector('move');
    assert.equal(move.x, 0);
    assert.equal(move.y, 0);

    input.dispose();
  });

  await t.test('maps mouse buttons to fire and altFire actions', () => {
    const input = new XRInput();

    // Left click (Button 0) -> fire
    input.simulateMouseButton(0, true);
    input.update(0.016);
    assert.equal(input.isPressed('fire'), true);
    assert.equal(input.isJustPressed('fire'), true);

    // Right click (Button 2) -> altFire
    input.simulateMouseButton(2, true);
    input.update(0.016);
    assert.equal(input.isPressed('altFire'), true);

    input.simulateMouseButton(0, false);
    input.simulateMouseButton(2, false);
    input.update(0.016);
    assert.equal(input.isPressed('fire'), false);
    assert.equal(input.isPressed('altFire'), false);
    assert.equal(input.isJustReleased('fire'), true);

    input.dispose();
  });

  await t.test('tracks mouse movement delta for camera look', () => {
    const input = new XRInput(null, null, { mouseSensitivity: 0.002 });

    input.simulateMouseMove(50, -30);
    input.update(0.016);

    const look = input.getVector('look');
    assert.ok(Math.abs(look.x - 50 * 0.002) < 0.0001);
    assert.ok(Math.abs(look.y - 30 * 0.002) < 0.0001);

    // Mouse delta auto-clears on next frame if no further motion
    input.update(0.016);
    const lookReset = input.getVector('look');
    assert.equal(lookReset.x, 0);
    assert.equal(lookReset.y, 0);

    input.dispose();
  });

  await t.test('dispatches action events to subscribers', () => {
    const input = new XRInput();
    const events = [];

    const unsub = input.onAction('fire', (e) => {
      events.push(e);
    });

    input.simulateMouseButton(0, true);
    input.update(0.016);

    assert.equal(events.length, 1);
    assert.equal(events[0].action, 'fire');
    assert.equal(events[0].pressed, true);
    assert.equal(events[0].device, 'mouse');

    input.simulateMouseButton(0, false);
    input.update(0.016);

    assert.equal(events.length, 2);
    assert.equal(events[1].pressed, false);

    unsub();
    input.simulateMouseButton(0, true);
    input.update(0.016);
    assert.equal(events.length, 2, 'Unsubscribed listener should not receive further events');

    input.dispose();
  });

  await t.test('calculates horizontal world movement direction relative to camera', () => {
    const input = new XRInput();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);

    // Default camera at origin looking down -Z
    camera.position.set(0, 1.6, 0);
    camera.lookAt(0, 1.6, -10);
    camera.updateMatrixWorld();

    // Move forward (W: x=0, y=1)
    input.simulateKey('KeyW', true);
    input.update(0.016);

    const dir = input.getMovementDirection(camera);
    assert.ok(Math.abs(dir.x) < 0.001);
    assert.ok(Math.abs(dir.y) < 0.001, 'Movement must stay on X-Z ground plane');
    assert.ok(Math.abs(dir.z - -1) < 0.001, `Forward direction should be -Z, got ${dir.z}`);

    // Move right (D: x=1, y=0)
    input.simulateKey('KeyW', false);
    input.simulateKey('KeyD', true);
    input.update(0.016);

    const rightDir = input.getMovementDirection(camera);
    assert.ok(Math.abs(rightDir.x - 1) < 0.001, `Right direction should be +X, got ${rightDir.x}`);
    assert.ok(Math.abs(rightDir.z) < 0.001);

    input.dispose();
  });

  await t.test('processes simulated WebXR motion controllers with thumbsticks and buttons', () => {
    // Mock minimal XRSession with 2 controllers
    const mockControllers = [
      {
        name: 'VXR_Controller_0',
        inputSource: {
          handedness: 'right',
          gamepad: {
            axes: [0, 0, 0.85, 0], // Right thumbstick tilted right (snap turn trigger)
            buttons: [
              { value: 0.9, pressed: true },  // Trigger: fire
              { value: 0.0, pressed: false }, // Grip
              { value: 0.0, pressed: false }, // Touchpad
              { value: 0.0, pressed: false }, // Stick press
              { value: 1.0, pressed: true },  // A button: jump
            ],
          },
        },
      },
      {
        name: 'VXR_Controller_1',
        inputSource: {
          handedness: 'left',
          gamepad: {
            axes: [0, 0, 0, -0.75], // Left thumbstick tilted forward (axes[3] = -0.75)
            buttons: [
              { value: 0.0, pressed: false },
              { value: 0.95, pressed: true }, // Grip: altFire
            ],
          },
        },
      },
    ];

    const mockSession = {
      isPresenting: true,
      controllers: mockControllers,
      onSelect: () => () => {},
    };

    const input = new XRInput(null, mockSession, {
      thumbstickDeadzone: 0.15,
      snapTurnAngle: 45,
    });

    input.update(0.016);

    // Verify left thumbstick locomotion
    const move = input.getVector('move');
    assert.ok(move.y > 0.5, `Left stick forward should produce positive move.y, got ${move.y}`);

    // Verify right trigger -> fire
    assert.equal(input.isPressed('fire'), true);
    assert.ok(input.getValue('fire') >= 0.85);

    // Verify left grip -> altFire
    assert.equal(input.isPressed('altFire'), true);

    // Verify right primary button -> jump
    assert.equal(input.isPressed('jump'), true);

    // Verify snap turn angle consumed
    const snap = input.consumeSnapTurn();
    assert.equal(snap, -45, 'Right stick flick right should consume -45 deg snap turn');
    assert.equal(input.consumeSnapTurn(), 0, 'Subsequent read should be 0');

    input.dispose();
  });
});
