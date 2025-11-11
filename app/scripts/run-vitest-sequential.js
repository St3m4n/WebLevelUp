import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, '..');
const sourceRoot = path.join(workspaceRoot, 'src');
const testPattern = /\.(test|spec)\.[tj]sx?$/i;

/**
 * Recursively collect test files relative to the workspace root.
 * @param {string} dir Absolute directory path.
 * @param {string[]} bucket Collector array.
 */
function collectTests(dir, bucket) {
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      collectTests(absolute, bucket);
    } else if (testPattern.test(entry)) {
      bucket.push(path.relative(workspaceRoot, absolute));
    }
  }
}

const testFiles = [];
collectTests(sourceRoot, testFiles);

testFiles.sort((a, b) => a.localeCompare(b));

if (testFiles.length === 0) {
  console.log('No test files found.');
  process.exit(0);
}

const extraArgs = process.argv.slice(2);
const vitestEntry = path.join(workspaceRoot, 'node_modules', 'vitest', 'vitest.mjs');

for (const file of testFiles) {
  console.log(`\n[36m▶ Running[0m ${file}`);
  const result = spawnSync(
    process.execPath,
    ['--max-old-space-size=2048', vitestEntry, 'run', file, ...extraArgs],
    {
      stdio: 'inherit',
      cwd: workspaceRoot,
    }
  );

  if (result.status !== 0) {
      if (result.error) {
        console.error(result.error);
      }
    console.error(`\n[31m✖ Tests failed in ${file}[0m`);
    process.exit(result.status ?? 1);
  }
}

console.log('\n[32m✔ All tests completed successfully[0m');
