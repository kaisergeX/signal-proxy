// DO NOT run this script on local. Only for CD pipeline. It will update `@kaiverse/*` packages's `jsr.json`.

// Purpose: Ensure the version of the @kaiverse/signal-react and @kaiverse/signal align in the jsr.json file.
// and also the `imports` version is correct since JSR doesn't support "workspaces:*" yet.
// Related: https://github.com/jsr-io/jsr/issues/448

import signalPackage from '../packages/signal/package.json';
import {readFileSync, writeFileSync} from 'fs';
import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';

const filename = fileURLToPath(import.meta.url);

const jsrPaths = ['../packages/signal/jsr.json', '../packages/signal-react/jsr.json'] as const;

if (!signalPackage.version) {
  throw new Error('[@kaiverse/signal] package.json does not have a version');
}

function updateDepsVersion() {
  try {
    const dir = dirname(filename);

    for (const jsrRelativePath of jsrPaths) {
      const jsrPath = resolve(dir, jsrRelativePath);
      const jsrContent = readFileSync(jsrPath, 'utf-8');
      const updatedJsrContent = jsrContent.replace(/\$\{version\}/g, signalPackage.version);
      writeFileSync(jsrPath, updatedJsrContent, 'utf-8');
    }
  } catch (error) {
    throw new Error('[updateDepsVersion] Error: ' + error.message);
  }
}

updateDepsVersion();
