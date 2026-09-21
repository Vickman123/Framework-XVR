import fs from 'fs';
import path from 'path';
import type { BuildOptions, BuildResult, BuildTarget } from './BuildTarget.js';

/**
 * WebTarget produces a clean, standard Web production build.
 */
export class WebTarget implements BuildTarget {
  public readonly name = 'web';
  public readonly description = 'Standard production web build (HTML5 + WebGL + Three.js)';

  public async build(options: BuildOptions): Promise<BuildResult> {
    const startTime = Date.now();
    const root = path.resolve(options.projectRoot || process.cwd());
    const outDir = path.resolve(root, options.outDir || 'dist');
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Ensure index.html exists in project root
    const indexPath = path.join(root, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error(`[VXR CLI] No index.html found in project root: ${root}`);
    }

    // Dynamic import of Vite to keep CLI lightweight
    const { build: viteBuild } = await import('vite');

    const hasViteConfig =
      fs.existsSync(path.join(root, 'vite.config.ts')) ||
      fs.existsSync(path.join(root, 'vite.config.js')) ||
      fs.existsSync(path.join(root, 'vite.config.mjs'));

    const viteConfig: any = {
      root,
      base: './',
      logLevel: options.verbose ? 'info' : 'warn',
      build: {
        outDir,
        emptyOutDir: true,
      },
    };

    if (hasViteConfig) {
      // Let Vite load the project's config
    } else {
      viteConfig.configFile = false;
    }

    console.info(`[VXR CLI] Building for target "web" into: ${path.relative(process.cwd(), outDir) || './dist'}`);
    await viteBuild(viteConfig);

    // Collect generated output files
    const generatedFiles: string[] = [];
    let totalBytes = 0;

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          generatedFiles.push(path.relative(outDir, full));
          totalBytes += fs.statSync(full).size;
        }
      }
    };
    walk(outDir);

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      target: 'web',
      outputDirectory: outDir,
      generatedFiles,
      warnings,
      recommendations,
      stats: {
        totalFiles: generatedFiles.length,
        totalBytes,
        glbCount: generatedFiles.filter((f) => f.endsWith('.glb') || f.endsWith('.gltf')).length,
        textureCount: generatedFiles.filter((f) => /\.(png|jpg|jpeg|webp|hdr)$/i.test(f)).length,
        buildDurationMs: durationMs,
      },
    };
  }
}
