import { Engine } from './core/Engine.js';

// Initialize the 3D interactive portfolio facility
window.addEventListener('DOMContentLoaded', () => {
  console.log('%c VICTOR CARREÑO // 3D INTERACTIVE FACILITY ', 'background: #00f0ff; color: #000; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
  console.log('Runtime: Three.js + WebXR + TypeScript + VXR Framework');

  const engine = new Engine();
  engine.start();

  // Expose engine instance for debugging / console inspection
  (window as unknown as { __ENGINE__: Engine }).__ENGINE__ = engine;
});
