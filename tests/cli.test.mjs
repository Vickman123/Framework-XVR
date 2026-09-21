import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { VXRDoctor } from '../dist/cli/commands/doctor.js';
import { VXRBuildCommand } from '../dist/cli/commands/build.js';
import { QuestBuildOptimizer } from '../dist/cli/optimizer/QuestBuildOptimizer.js';

describe('VXR CLI & Quest Build System Tests', () => {
  const rootDir = process.cwd();
  const questBasicDir = path.join(rootDir, 'examples/quest-basic');

  test('VXR Doctor analyzes project structure and reports valid environment', () => {
    const report = VXRDoctor.run(rootDir);
    assert.ok(report, 'Report should be defined');
    assert.ok(Array.isArray(report.checks), 'Checks should be an array');
    assert.ok(report.checks.length > 5, 'Should have evaluated at least 5 check items');

    const nodeCheck = report.checks.find((c) => c.name === 'Node.js');
    assert.ok(nodeCheck, 'Should include Node.js check');
    assert.equal(nodeCheck.status, 'ok', 'Node.js version check should pass');

    const entryCheck = report.checks.find((c) => c.name.includes('Entry Point'));
    assert.ok(entryCheck, 'Should include entry point check');
    assert.equal(entryCheck.status, 'ok', 'Entry point check should pass');

    const webxrCheck = report.checks.find((c) => c.name.includes('WebXR'));
    assert.ok(webxrCheck, 'Should include WebXR configuration check');

    assert.ok(Array.isArray(report.runtimeNotes), 'Runtime notes should be listed');
    assert.ok(report.runtimeNotes.length > 0, 'Must note that 90Hz/120Hz requires runtime physical device verification');
  });

  test('QuestBuildOptimizer evaluates asset budgets without destructive modifications', () => {
    const audit = QuestBuildOptimizer.analyzeDirectory(questBasicDir);
    assert.ok(audit, 'Audit report should be generated');
    assert.equal(typeof audit.totalSizeBytes, 'number');
    assert.ok(Array.isArray(audit.warnings));
    assert.ok(Array.isArray(audit.recommendations));
    assert.ok(['Optimal', 'Acceptable', 'NeedsOptimization'].includes(audit.questBudgetScore));
  });

  test('QuestBuildOptimizer generates valid WebManifest for Meta Quest Browser', () => {
    const manifest = QuestBuildOptimizer.generateQuestManifest('Test Project');
    assert.equal(manifest.name, 'Test Project');
    assert.equal(manifest.display, 'fullscreen');
    assert.equal(manifest.orientation, 'landscape');
    assert.ok(manifest.meta_quest, 'Should include meta_quest WebXR hints');
    assert.equal(manifest.meta_quest.mode, 'webxr');
    assert.equal(manifest.meta_quest.recommended_fps, 90);
  });

  test('BuildTarget "web" produces standard production artifacts', async () => {
    const builder = new VXRBuildCommand();
    const result = await builder.execute({
      projectRoot: questBasicDir,
      target: 'web',
      outDir: 'dist',
    });

    assert.equal(result.success, true);
    assert.equal(result.target, 'web');
    assert.ok(fs.existsSync(path.join(result.outputDirectory, 'index.html')));
    assert.ok(fs.existsSync(path.join(result.outputDirectory, 'assets')));
  });

  test('BuildTarget "quest" produces WebXR PWA artifacts with manifest and deploy guide', async () => {
    const builder = new VXRBuildCommand();
    const result = await builder.execute({
      projectRoot: questBasicDir,
      target: 'quest',
      outDir: 'dist',
      optimize: true,
    });

    assert.equal(result.success, true);
    assert.equal(result.target, 'quest');

    const outDir = result.outputDirectory;
    assert.ok(fs.existsSync(path.join(outDir, 'index.html')), 'index.html must exist');
    assert.ok(fs.existsSync(path.join(outDir, 'manifest.webmanifest')), 'manifest.webmanifest must exist');
    assert.ok(fs.existsSync(path.join(outDir, 'QUEST_DEPLOY.md')), 'QUEST_DEPLOY.md must exist');
    assert.ok(fs.existsSync(path.join(outDir, 'vxr-quest-report.json')), 'vxr-quest-report.json must exist');
    assert.ok(fs.existsSync(path.join(outDir, 'vxr-quest-preset.json')), 'vxr-quest-preset.json must exist when --optimize');

    const htmlContent = fs.readFileSync(path.join(outDir, 'index.html'), 'utf-8');
    assert.ok(htmlContent.includes('rel="manifest"'), 'index.html must link manifest.webmanifest');
    assert.ok(htmlContent.includes('mobile-web-app-capable'), 'index.html must include mobile-web-app-capable meta tag');
  });

  test('BuildTarget rejects unknown target names gracefully', async () => {
    const builder = new VXRBuildCommand();
    await assert.rejects(
      async () => {
        await builder.execute({
          projectRoot: questBasicDir,
          target: 'unsupported-platform',
        });
      },
      /Target desconocido: "unsupported-platform"/
    );
  });

  test('BuildTarget "quest-pwa" returns placeholder warning without crashing', async () => {
    const builder = new VXRBuildCommand();
    const result = await builder.execute({
      projectRoot: questBasicDir,
      target: 'quest-pwa',
    });

    assert.equal(result.success, false);
    assert.equal(result.target, 'quest-pwa');
    assert.ok(result.warnings.some((w) => w.includes('placeholder')));
  });
});
