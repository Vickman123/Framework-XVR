#!/usr/bin/env node

import { runCLI } from '../dist/cli/vxr.js';

runCLI().catch((err) => {
  console.error('[VXR CLI Fatal Error]:', err);
  process.exit(1);
});
