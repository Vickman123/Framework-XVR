import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { XRScenario } from '../packages/core/dist/scenario/XRScenario.js';

test('XRScenario inter-room continuous traversal (no invisible walls)', async (t) => {
  await t.test('player walks seamlessly between Lobby and Lab through North corridor', () => {
    const scenario = new XRScenario('Test Facility');

    const lobby = scenario.addRoom({
      id: 'lobby',
      name: 'Lobby',
      center: [0, 0, 0],
      dimensions: { width: 12, depth: 10, height: 3.8 },
      doors: [{ wall: 'north', targetRoomId: 'lab', width: 2.4, height: 2.8 }],
    });

    const lab = scenario.addRoom({
      id: 'lab',
      name: 'Lab',
      center: [0, 0, -18],
      dimensions: { width: 14, depth: 12, height: 4.2 },
      doors: [{ wall: 'south', targetRoomId: 'lobby', width: 2.4, height: 2.8 }],
    });

    scenario.connectRooms('lobby', 'north', 'lab', 'south', { width: 2.6, height: 3.2 });

    // Step every 0.1m along Z from z = 2 (inside lobby) to z = -18 (inside lab)
    for (let z = 2.0; z >= -18.0; z -= 0.1) {
      const pos = new THREE.Vector3(0, 1.6, z);
      const walkable = scenario.isWalkable(pos, 0.35);
      assert.equal(
        walkable,
        true,
        `Invisible wall detected at z = ${z.toFixed(2)}m! Position must be walkable.`
      );
    }
  });

  await t.test('player walks seamlessly between Lab and Office through East corridor', () => {
    const scenario = new XRScenario('Test Facility');

    scenario.addRoom({
      id: 'lab',
      center: [0, 0, -18],
      dimensions: { width: 14, depth: 12, height: 4.2 },
      doors: [{ wall: 'east', targetRoomId: 'office', width: 2.2, height: 2.6 }],
    });

    scenario.addRoom({
      id: 'office',
      center: [16, 0, -18],
      dimensions: { width: 10, depth: 10, height: 3.5 },
      doors: [{ wall: 'west', targetRoomId: 'lab', width: 2.2, height: 2.6 }],
    });

    scenario.connectRooms('lab', 'east', 'office', 'west', { width: 2.4, height: 3.0 });

    // Step every 0.1m along X from x = 0 (inside lab) to x = 16 (inside office)
    for (let x = 0.0; x <= 16.0; x += 0.1) {
      const pos = new THREE.Vector3(x, 1.6, -18);
      const walkable = scenario.isWalkable(pos, 0.35);
      assert.equal(
        walkable,
        true,
        `Invisible wall detected at x = ${x.toFixed(2)}m! Position must be walkable.`
      );
    }
  });

  await t.test('clampMovement allows uninterrupted forward movement through doorways', () => {
    const scenario = new XRScenario('Test Facility');
    scenario.addRoom({
      id: 'lobby',
      center: [0, 0, 0],
      dimensions: { width: 12, depth: 10, height: 3.8 },
      doors: [{ wall: 'north', targetRoomId: 'lab', width: 2.4, height: 2.8 }],
    });
    scenario.addRoom({
      id: 'lab',
      center: [0, 0, -18],
      dimensions: { width: 14, depth: 12, height: 4.2 },
      doors: [{ wall: 'south', targetRoomId: 'lobby', width: 2.4, height: 2.8 }],
    });
    scenario.connectRooms('lobby', 'north', 'lab', 'south', { width: 2.6, height: 3.2 });

    let player = new THREE.Vector3(0, 1.6, 2.0);
    const step = 0.2;
    while (player.z > -17.0) {
      const proposed = new THREE.Vector3(player.x, player.y, player.z - step);
      const clamped = scenario.clampMovement(player, proposed, 0.35);
      // Ensure player made progress forward
      assert.ok(
        clamped.z < player.z,
        `Movement blocked at z = ${player.z.toFixed(2)}m! Clamped did not advance forward.`
      );
      player = clamped;
    }
    assert.ok(player.z <= -16.0, 'Player successfully traversed entire distance into Lab');
  });
});
