import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  ARSession,
  ARMatrixSmoother,
  ARQRCode,
  MindARAdapter,
  FiduciaryMarkerAdapter,
  ARImageTracker,
  ARMarkerTracker,
  ARAssetManager,
  TargetCompiler,
} from '../packages/ar/dist/index.js';

test('VXR AR: Web Augmented Reality Suite', async (t) => {
  // ---------------------------------------------------------------------------
  // 1. ARSession Capabilities & Diagnostics
  // ---------------------------------------------------------------------------
  await t.test('1. ARSession evaluates capabilities and security contexts accurately', async () => {
    const caps = await ARSession.checkCapabilities();

    assert.equal(typeof caps.isSecureContext, 'boolean');
    assert.equal(typeof caps.hasCameraSupport, 'boolean');
    assert.equal(typeof caps.hasWebXRSupport, 'boolean');
    assert.equal(typeof caps.hasWebXRARSupport, 'boolean');
    assert.equal(typeof caps.hasBarcodeDetector, 'boolean');
    assert.ok(Array.isArray(caps.recommendations));
  });

  // ---------------------------------------------------------------------------
  // 2. ARMatrixSmoother (Anti-Jitter Filter)
  // ---------------------------------------------------------------------------
  await t.test('2. ARMatrixSmoother interpolates 6-DoF transformation matrices smoothly', () => {
    const smoother = new ARMatrixSmoother(0.5);

    // Initial pose: at [0, 0, -2]
    const m1 = new THREE.Matrix4().makeTranslation(0, 0, -2);
    const out1 = smoother.update(m1);
    const pos1 = new THREE.Vector3().setFromMatrixPosition(out1);
    assert.equal(pos1.x, 0);
    assert.equal(pos1.y, 0);
    assert.equal(pos1.z, -2);

    // Sudden noisy jump to [10, 0, -2]
    const m2 = new THREE.Matrix4().makeTranslation(10, 0, -2);
    const out2 = smoother.update(m2);
    const pos2 = new THREE.Vector3().setFromMatrixPosition(out2);

    // With 0.5 smoothing, position should be smoothly halfway (5, not 10)
    assert.equal(pos2.x, 5);
    assert.equal(pos2.y, 0);
    assert.equal(pos2.z, -2);

    // Reset filter
    smoother.reset();
    const m3 = new THREE.Matrix4().makeTranslation(3, 3, 3);
    const out3 = smoother.update(m3);
    const pos3 = new THREE.Vector3().setFromMatrixPosition(out3);
    assert.equal(pos3.x, 3);
    assert.equal(pos3.y, 3);
    assert.equal(pos3.z, 3);
  });

  // ---------------------------------------------------------------------------
  // 3. ARQRCode Parsing & Resolution
  // ---------------------------------------------------------------------------
  await t.test('3. ARQRCode resolves JSON manifests and query parameters into experiences', () => {
    const qr = new ARQRCode();

    // A: JSON String Payload
    const jsonPayload = JSON.stringify({
      title: 'Dinosaurio T-Rex',
      description: 'Fósil Cretácico',
      mode: 'image',
      url: 'https://cdn.vxr.app/trex.glb',
      scale: 1.2,
    });
    const exp1 = qr.parseExperience(jsonPayload);
    assert.ok(exp1, 'Must parse valid JSON manifest');
    assert.equal(exp1.title, 'Dinosaurio T-Rex');
    assert.equal(exp1.models.length, 1);
    assert.equal(exp1.models[0].url, 'https://cdn.vxr.app/trex.glb');
    assert.equal(exp1.models[0].initialScale, 1.2);

    // B: URL with Query Parameters
    const urlPayload = 'https://vxr.app/ar/?model=https://cdn.vxr.app/robot.glb&title=Robot%20XR&scale=0.75&mode=marker';
    const exp2 = qr.parseExperience(urlPayload);
    assert.ok(exp2, 'Must parse URL query parameters');
    assert.equal(exp2.title, 'Robot XR');
    assert.equal(exp2.models[0].url, 'https://cdn.vxr.app/robot.glb');
    assert.equal(exp2.models[0].initialScale, 0.75);
    assert.equal(exp2.mode, 'marker');

    // C: Generate Sharable Experience URL
    const generatedUrl = ARQRCode.generateExperienceURL(exp2, 'https://myar.app/');
    assert.ok(generatedUrl.includes('model=https%3A%2F%2Fcdn.vxr.app%2Frobot.glb'));
    assert.ok(generatedUrl.includes('title=Robot+XR'));
    assert.ok(generatedUrl.includes('mode=marker'));

    // D: Generate QR SVG string
    const svgUrl = ARQRCode.generateQRCodeSVG('https://vxr.app/');
    assert.ok(svgUrl.includes('api.qrserver.com'));

    qr.dispose();
  });

  // ---------------------------------------------------------------------------
  // 4. MindARAdapter Lifecycle & State Management
  // ---------------------------------------------------------------------------
  await t.test('4. MindARAdapter manages lifecycle, smoothing, and tracker events', async () => {
    const adapter = new MindARAdapter({
      imageTargetSrc: 'targets.mind',
      smoothingFactor: 0.4,
    });

    let stateReported = '';
    adapter.setEventListener({
      onStateChange: (state) => {
        stateReported = state;
      },
    });

    assert.equal(adapter.name, 'MindAR-ImageTracker');
    assert.equal(adapter.mode, 'image');

    await adapter.start();
    assert.equal(stateReported, 'scanning');

    adapter.stop();
    adapter.dispose();
  });

  // ---------------------------------------------------------------------------
  // 5. FiduciaryMarkerAdapter & Printable Marker Generator
  // ---------------------------------------------------------------------------
  await t.test('5. FiduciaryMarkerAdapter generates printable SVG and emits 6-DoF events', async () => {
    const adapter = new FiduciaryMarkerAdapter({
      markerId: 42,
      markerWidthMeters: 0.2,
      smoothingFactor: 0.5,
    });

    let targetFoundId = '';
    let targetLostId = '';
    let lastPosition = null;

    adapter.setEventListener({
      onTargetFound: (id, matrix) => {
        targetFoundId = id;
        lastPosition = new THREE.Vector3().setFromMatrixPosition(matrix);
      },
      onTargetLost: (id) => {
        targetLostId = id;
      },
    });

    await adapter.start();

    // Trigger pose detection at [1, 2, -3]
    const detectedPos = new THREE.Vector3(1, 2, -3);
    const detectedQuat = new THREE.Quaternion();
    adapter.setDetectedPose(detectedPos, detectedQuat);

    assert.equal(targetFoundId, '42');
    assert.ok(lastPosition);
    assert.equal(lastPosition.x, 1);
    assert.equal(lastPosition.y, 2);
    assert.equal(lastPosition.z, -3);

    // Trigger target lost
    adapter.setTargetLost();
    assert.equal(targetLostId, '42');

    // Generate Printable SVG
    const svg = FiduciaryMarkerAdapter.generateMarkerSVG(42, 300);
    assert.ok(svg.startsWith('<svg'), 'Must produce valid SVG markup');
    assert.ok(svg.includes('VXR AR MARKER #42'), 'Must label marker with ID');
    assert.ok(svg.includes('fill="#000000"'), 'Must contain fiduciary black border');

    adapter.dispose();
  });

  // ---------------------------------------------------------------------------
  // 6. ARImageTracker Anchoring & Group Visibility
  // ---------------------------------------------------------------------------
  await t.test('6. ARImageTracker rigidly couples 3D anchor group to 6-DoF target matrix', () => {
    let adapterEvents = null;
    const mockAdapter = {
      name: 'MockTracker',
      mode: 'image',
      init: async () => {},
      start: async () => {},
      stop: () => {},
      update: () => {},
      setEventListener: (ev) => {
        adapterEvents = ev;
      },
      dispose: () => {},
    };

    const tracker = new ARImageTracker({ adapter: mockAdapter });
    assert.equal(tracker.anchorGroup.visible, false, 'Anchor group must start hidden');

    // Simulate target found at [0, 1.5, -1]
    const testMatrix = new THREE.Matrix4().makeTranslation(0, 1.5, -1);
    adapterEvents.onTargetFound('target-0', testMatrix);

    assert.equal(tracker.anchorGroup.visible, true, 'Anchor group must become visible upon targetFound');
    const groupPos = new THREE.Vector3().setFromMatrixPosition(tracker.anchorGroup.matrix);
    assert.equal(groupPos.y, 1.5);
    assert.equal(groupPos.z, -1);

    // Simulate target lost
    adapterEvents.onTargetLost('target-0');
    assert.equal(tracker.anchorGroup.visible, false, 'Anchor group must hide upon targetLost');

    tracker.dispose();
  });

  // ---------------------------------------------------------------------------
  // 7. ARMarkerTracker
  // ---------------------------------------------------------------------------
  await t.test('7. ARMarkerTracker exposes printable marker generation and anchor group', () => {
    const markerTracker = new ARMarkerTracker({ markerId: 77 });
    assert.equal(markerTracker.anchorGroup.name, 'VXR_AR_MarkerAnchor');

    const svg = markerTracker.generatePrintableMarkerSVG(77);
    assert.ok(svg.includes('VXR AR MARKER #77'));

    markerTracker.dispose();
  });

  // ---------------------------------------------------------------------------
  // 8. ARAssetManager Memory Disposal & Cleanliness
  // ---------------------------------------------------------------------------
  await t.test('8. ARAssetManager frees GPU textures and geometries completely', () => {
    const assetManager = new ARAssetManager();

    // Create a mock hierarchy with geometry and material
    const group = new THREE.Group();
    const geo = new THREE.BoxGeometry(1, 1, 1);
    let disposedGeo = false;
    geo.dispose = () => {
      disposedGeo = true;
    };

    const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    let disposedMat = false;
    mat.dispose = () => {
      disposedMat = true;
    };

    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    const activeModel = {
      config: { url: 'mock.glb' },
      root: group,
      mixer: null,
      animations: [],
      audio: null,
      dispose: () => {},
    };

    assetManager.disposeModel(activeModel);
    assert.equal(disposedGeo, true, 'Geometry must be disposed');
    assert.equal(disposedMat, true, 'Material must be disposed');

    assetManager.dispose();
  });

  // ---------------------------------------------------------------------------
  // 9. TargetCompiler
  // ---------------------------------------------------------------------------
  await t.test('9. TargetCompiler provides diagnostic quality evaluation APIs', () => {
    assert.equal(typeof TargetCompiler.evaluateImageQuality, 'function');
  });
});
