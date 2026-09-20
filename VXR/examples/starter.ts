import { XRApp } from 'vxr';

// 1. Inicializar la aplicación VXR con botón WebXR y sombras
const app = new XRApp({
  container: '#app',
  autoVRButton: true,
  enableShadows: true,
  enableGrid: true,
  cameraPosition: [0, 1.6, 3.5], // Altura a nivel de ojos
});

async function main() {
  // 2. Cargar modelo 3D (GLTF/GLB) con auto-grounding a Y = 0
  const model = await app.loadModel('./models/scene.glb', {
    autoGround: true,
    autoCenter: true,
    onProgress: (percent) => console.log(`Cargando modelo: ${percent}%`),
  });

  console.log('Métricas del modelo cargado:', model.metrics);

  // 3. Registrar animación o lógica en cada frame
  app.onUpdate((delta, elapsed) => {
    // model.group.rotation.y += delta * 0.2;
  });

  // 4. Iniciar el bucle de renderizado WebGL / WebXR
  app.start();
}

main().catch(console.error);
