import { defineConfig, Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

function serveStaticFolder(prefix: string, folderPath: string) {
  return (req: any, res: any, next: any) => {
    const url = req.url || '';
    if (!url.startsWith(prefix)) return next();

    let subPath = url.slice(prefix.length).split('?')[0];
    if (subPath === '' || subPath === '/') {
      if (!url.endsWith('/')) {
        res.statusCode = 301;
        res.setHeader('Location', prefix + '/');
        res.end();
        return;
      }
      subPath = '/index.html';
    }

    const filePath = path.join(folderPath, subPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.md': 'text/markdown; charset=utf-8',
        '.webmanifest': 'application/manifest+json; charset=utf-8',
        '.wasm': 'application/wasm',
        '.glb': 'model/gltf-binary',
        '.gltf': 'model/gltf+json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.mp3': 'audio/mpeg',
        '.ogg': 'audio/ogg',
        '.wav': 'audio/wav',
        '.bin': 'application/octet-stream',
      };
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    next();
  };
}

function resolveFolder(relativePath: string): string {
  const p1 = path.resolve(__dirname, '..', relativePath);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve(__dirname, '../Proyectos', relativePath);
  if (fs.existsSync(p2)) return p2;
  return p1;
}

const serveReferenceProjectsPlugin: Plugin = {
  name: 'serve-reference-projects',
  configureServer(server) {
    // Clean sanitized routes for case studies
    server.middlewares.use(
      serveStaticFolder('/projects/cad-viewer', resolveFolder('PCPuma Visor arquitectonico/dist'))
    );
    server.middlewares.use(
      serveStaticFolder('/projects/cyber-arcade', resolveFolder('shooter simulator/docs'))
    );
    server.middlewares.use(
      serveStaticFolder('/projects/tech-simulator', resolveFolder('pcpum<a simulador/docs'))
    );
    // Backward compatibility aliases
    server.middlewares.use(
      serveStaticFolder('/projects/visor-xr', resolveFolder('PCPuma Visor arquitectonico/dist'))
    );
    server.middlewares.use(
      serveStaticFolder('/projects/virus-purge', resolveFolder('shooter simulator/docs'))
    );
    server.middlewares.use(
      serveStaticFolder('/projects/simulador-pcpuma', resolveFolder('pcpum<a simulador/docs'))
    );
    server.middlewares.use(
      serveStaticFolder('/docs', path.resolve(__dirname, '../docs'))
    );
  },
};

export default defineConfig({
  base: './',
  plugins: [serveReferenceProjectsPlugin],
  resolve: {
    alias: {
      '@vxr/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        basicViewer: path.resolve(__dirname, 'basic-viewer/index.html'),
        architectureViewer: path.resolve(__dirname, 'architecture-viewer/index.html'),
        interactionLab: path.resolve(__dirname, 'interaction-lab/index.html'),
        scenarioBuilder: path.resolve(__dirname, 'scenario-builder/index.html'),
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
