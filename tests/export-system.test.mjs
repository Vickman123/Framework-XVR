import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {
  serializeScene,
  generateJSONCode,
  generateTSCode,
  generateHTMLCode,
  validateSceneExport,
  restoreSceneFromJSON,
  highlightSyntax,
} from '../examples/level-builder/exportScene.ts';

test('VXR Studio Export System Suite', async (t) => {
  // ---------------------------------------------------------------------------
  // 1. Mandatory Test Scene Creation
  // ---------------------------------------------------------------------------
  const mandatorySceneInput = {
    projectName: 'Auditorium Pro',
    rooms: [
      {
        id: 'room-office-main',
        name: 'Oficina Ejecutiva VXR',
        theme: 'office',
        dimensions: { width: 12, depth: 10, height: 4 },
        center: [0, 0, 0],
        doors: [],
        spawnPoint: [0, 1.6, 3],
      },
    ],
    connections: [],
    props: [
      {
        id: 'box-red-1',
        roomId: 'room-office-main',
        category: 'basic',
        subtype: 'box',
        name: 'Caja Roja Tech',
        relX: 2,
        relY: 0.6,
        relZ: 1,
        rotX: 0,
        rotY: 45,
        rotZ: 0,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        color: '#ff4444',
      },
      {
        id: 'sphere-cyan-1',
        roomId: 'room-office-main',
        category: 'basic',
        subtype: 'sphere',
        name: 'Esfera Cian Escala 1.5',
        relX: -2,
        relY: 1,
        relZ: -1,
        rotX: 15,
        rotY: 30,
        rotZ: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        scaleZ: 1.5,
        color: '#00ffff',
      },
    ],
  };

  const serializedScene = serializeScene(mandatorySceneInput);

  await t.test('1. Mandatory Scene: Serialization produces schemaVersion 1.0.0 and correct metadata', () => {
    assert.equal(serializedScene.schemaVersion, '1.0.0');
    assert.equal(serializedScene.projectName, 'Auditorium Pro');
    assert.equal(serializedScene.generator, 'VXR Studio');
    assert.equal(serializedScene.rooms.length, 1);
    assert.equal(serializedScene.props.length, 2);

    const room = serializedScene.rooms[0];
    assert.equal(room.dimensions.width, 12);
    assert.equal(room.dimensions.depth, 10);
    assert.equal(room.dimensions.height, 4);
    assert.equal(room.theme, 'office');
  });

  await t.test('2. Mandatory Scene: Prop coordinates, scale, color and custom rotation are strictly preserved', () => {
    const box = serializedScene.props.find((p) => p.id === 'box-red-1');
    assert.ok(box, 'Box must exist in exported props');
    assert.deepEqual(box.position, [2, 0.6, 1]);
    assert.deepEqual(box.rotationDeg, [0, 45, 0]);
    assert.equal(box.color, '#ff4444');
    assert.equal(box.subtype, 'box');

    const sphere = serializedScene.props.find((p) => p.id === 'sphere-cyan-1');
    assert.ok(sphere, 'Sphere must exist in exported props');
    assert.deepEqual(sphere.position, [-2, 1, -1]);
    assert.deepEqual(sphere.scale, [1.5, 1.5, 1.5]);
    assert.deepEqual(sphere.rotationDeg, [15, 30, 0]);
    assert.equal(sphere.color, '#00ffff');
    assert.equal(sphere.subtype, 'sphere');
  });

  await t.test('3. JSON Generator: Output is valid, parseable, and matches schema', () => {
    const jsonStr = generateJSONCode(serializedScene);
    assert.ok(jsonStr && typeof jsonStr === 'string');

    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.schemaVersion, '1.0.0');
    assert.equal(parsed.projectName, 'Auditorium Pro');
    assert.equal(parsed.rooms.length, 1);
    assert.equal(parsed.props.length, 2);

    const validation = validateSceneExport(parsed);
    assert.equal(validation.valid, true);
    assert.equal(validation.errors.length, 0);
  });

  await t.test('4. TypeScript Generator: Produces valid code using @vxr/core and Three.js APIs', () => {
    const tsCode = generateTSCode(serializedScene);
    assert.ok(tsCode && typeof tsCode === 'string');

    // Check essential imports and API calls
    assert.ok(tsCode.includes("import * as THREE from 'three';"), 'Must import THREE');
    assert.ok(tsCode.includes("import { XRApp } from '@vxr/core';"), 'Must import XRApp');
    assert.ok(tsCode.includes("scenario.addRoom({"), 'Must call scenario.addRoom');
    assert.ok(tsCode.includes("width: 12, depth: 10, height: 4"), 'Must configure room dimensions');
    assert.ok(tsCode.includes("'#ff4444'"), 'Must contain box color #ff4444');
    assert.ok(tsCode.includes("'#00ffff'"), 'Must contain sphere color #00ffff');
    assert.ok(tsCode.includes("obj.position.set(2, 0.6, 1);"), 'Must position box at [2, 0.6, 1]');
    assert.ok(tsCode.includes("obj.position.set(-2, 1, -1);"), 'Must position sphere at [-2, 1, -1]');
    assert.ok(tsCode.includes("obj.scale.set(1.5, 1.5, 1.5);"), 'Must scale sphere by [1.5, 1.5, 1.5]');
    assert.ok(tsCode.includes("app.start();"), 'Must invoke app.start()');
  });

  await t.test('5. TypeScript Generator: Generated code compiles without syntax or type errors', () => {
    const tsCode = generateTSCode(serializedScene);
    const result = ts.transpileModule(tsCode, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ESNext,
      },
      reportDiagnostics: true,
    });

    assert.equal(result.diagnostics.length, 0, `TS code should compile with 0 diagnostics. Found: ${result.diagnostics.length}`);
    assert.ok(result.outputText && result.outputText.length > 500, 'Must produce valid JavaScript output');
  });

  await t.test('6. HTML Generator: Produces complete, well-formed HTML5 document with Three.js importmap and OrbitControls', () => {
    const htmlCode = generateHTMLCode(serializedScene);
    assert.ok(htmlCode && typeof htmlCode === 'string');

    // Structural HTML5 checks
    assert.ok(htmlCode.startsWith('<!DOCTYPE html>'), 'Must start with <!DOCTYPE html>');
    assert.ok(htmlCode.includes('<html lang="es">'), 'Must contain <html>');
    assert.ok(htmlCode.includes('<title>Auditorium Pro — Experiencia 3D VXR</title>'), 'Must contain scene title');
    assert.ok(htmlCode.includes('<script type="importmap">'), 'Must include importmap');
    assert.ok(htmlCode.includes('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js'), 'Must link modern Three.js ES module');
    assert.ok(htmlCode.includes('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/'), 'Must link Three.js addons');
    assert.ok(htmlCode.includes('OrbitControls'), 'Must instantiate OrbitControls');
    assert.ok(htmlCode.includes('AmbientLight'), 'Must create AmbientLight');
    assert.ok(htmlCode.includes('DirectionalLight'), 'Must create DirectionalLight');
    assert.ok(htmlCode.includes('HemisphereLight'), 'Must create HemisphereLight');
    assert.ok(htmlCode.includes('renderer.setAnimationLoop('), 'Must create animation loop');
    assert.ok(htmlCode.includes('</html>'), 'Must close </html>');
  });

  await t.test('7. Multi-Room Traversal: 2 rooms connected by corridor generate connectRooms in TS and corridors in HTML', () => {
    const twoRoomsScene = serializeScene({
      projectName: 'Double Chamber Experience',
      rooms: [
        {
          id: 'room-a',
          name: 'Galería A',
          theme: 'gallery',
          dimensions: { width: 14, depth: 12, height: 4 },
          center: [0, 0, 0],
          doors: [{ wall: 'north', targetRoomId: 'room-b', width: 2.6, height: 3.2 }],
        },
        {
          id: 'room-b',
          name: 'Laboratorio B',
          theme: 'scifi',
          dimensions: { width: 16, depth: 12, height: 4 },
          center: [0, 0, -22],
          doors: [{ wall: 'south', targetRoomId: 'room-a', width: 2.6, height: 3.2 }],
        },
      ],
      connections: [
        {
          id: 'conn-a-b',
          fromRoomId: 'room-a',
          fromWall: 'north',
          toRoomId: 'room-b',
          toWall: 'south',
          width: 2.6,
          height: 3.2,
        },
      ],
      props: [],
    });

    const tsCode = generateTSCode(twoRoomsScene);
    assert.ok(tsCode.includes("scenario.connectRooms("), 'TS must call scenario.connectRooms');
    assert.ok(tsCode.includes("'room-a'"), 'TS connectRooms must reference room-a');
    assert.ok(tsCode.includes("'north'"), 'TS connectRooms must reference north wall');
    assert.ok(tsCode.includes("'room-b'"), 'TS connectRooms must reference room-b');
    assert.ok(tsCode.includes("'south'"), 'TS connectRooms must reference south wall');
    assert.ok(tsCode.includes("width: 2.6, height: 3.2"), 'TS connectRooms must set width and height');

    const htmlCode = generateHTMLCode(twoRoomsScene);
    assert.ok(htmlCode.includes('"fromRoomId":"room-a"'), 'HTML must include connection data for room-a');
    assert.ok(htmlCode.includes('"toRoomId":"room-b"'), 'HTML must include connection data for room-b');
  });

  await t.test('8. Round-Trip Re-Import: restoreSceneFromJSON accurately recovers project rooms and props', () => {
    const jsonStr = generateJSONCode(serializedScene);
    const restored = restoreSceneFromJSON(jsonStr);

    assert.equal(restored.success, true);
    assert.ok(restored.data);

    const recovered = restored.data;
    assert.equal(recovered.projectName, 'Auditorium Pro');
    assert.equal(recovered.rooms.length, 1);
    assert.equal(recovered.rooms[0].name, 'Oficina Ejecutiva VXR');
    assert.equal(recovered.rooms[0].dimensions.width, 12);
    assert.equal(recovered.rooms[0].dimensions.depth, 10);

    assert.equal(recovered.props.length, 2);
    const recoveredBox = recovered.props.find((p) => p.id === 'box-red-1');
    assert.ok(recoveredBox);
    assert.deepEqual(recoveredBox.position, [2, 0.6, 1]);
    assert.equal(recoveredBox.color, '#ff4444');

    const recoveredSphere = recovered.props.find((p) => p.id === 'sphere-cyan-1');
    assert.ok(recoveredSphere);
    assert.deepEqual(recoveredSphere.position, [-2, 1, -1]);
    assert.deepEqual(recoveredSphere.scale, [1.5, 1.5, 1.5]);
    assert.equal(recoveredSphere.color, '#00ffff');
  });

  await t.test('9. Schema Validator: Safely catches corrupt or invalid JSON inputs', () => {
    const badJson = restoreSceneFromJSON('{ invalid json: [ }');
    assert.equal(badJson.success, false);
    assert.ok(badJson.error.includes('Error de sintaxis JSON'));

    const badSchema = restoreSceneFromJSON(JSON.stringify({ schemaVersion: '9.9.9', rooms: [] }));
    assert.equal(badSchema.success, false);
    assert.ok(badSchema.error.includes('Versión de esquema incompatible'));

    const missingRooms = restoreSceneFromJSON(JSON.stringify({ schemaVersion: '1.0.0', rooms: 'not an array' }));
    assert.equal(missingRooms.success, false);
    assert.ok(missingRooms.error.includes('rooms'));
  });

  await t.test('10. Syntax Highlighter: Produces highlighted tokens without throwing', () => {
    const highlightedTS = highlightSyntax("import { XRApp } from '@vxr/core';\nconst val = 42;", 'ts');
    assert.ok(highlightedTS.includes('<span class="hl-keyword">import</span>'));
    assert.ok(highlightedTS.includes('<span class="hl-keyword">const</span>'));
    assert.ok(highlightedTS.includes('<span class="hl-number">42</span>'));

    const highlightedJSON = highlightSyntax('{"name": "VXR", "count": 10}', 'json');
    assert.ok(highlightedJSON.includes('<span class="hl-func">&quot;name&quot;</span>'));
    assert.ok(highlightedJSON.includes('<span class="hl-number">10</span>'));

    const highlightedHTML = highlightSyntax('<div class="scene"><span>Test</span></div>', 'html');
    assert.ok(highlightedHTML.includes('&lt;<span class="hl-tag">div</span>'));
  });
});
