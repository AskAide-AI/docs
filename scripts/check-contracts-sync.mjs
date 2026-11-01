#!/usr/bin/env node
// Local drift gate (prebuild/prestart): regenerates each registered mirror in
// memory and byte-compares it with the file on disk. Exit 1 on drift.
//
// Skipped in CI BY DESIGN: .github/workflows/deploy.yml checks out only this
// repo, while the canonical lives in the separate shared-contracts repo
// (git@github.com:AskAide-AI/shared-contracts.git). Drift can only originate
// from local edits — exactly where this gate runs. CI guards the mirror's MDX
// compilability by building it; this gate guards its content freshness.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateMirrorContent } from './lib/contracts-mirror.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIRROR_PAIRS = [
  {
    name: 'api-definitions',
    source: path.resolve(repoRoot, '..', 'shared-contracts', 'api-definitions.md'),
    mirror: path.join(repoRoot, 'docs', 'shared-contracts', 'api-definitions.md'),
  },
];

let failed = false;

for (const pair of MIRROR_PAIRS) {
  if (!existsSync(pair.source)) {
    console.log(
      `[check-contracts-sync] ${pair.name}: canonical not found (${pair.source}) — skipped (CI checks out only this repo)`,
    );
    continue;
  }
  const expected = generateMirrorContent(readFileSync(pair.source, 'utf8'));
  const actual = existsSync(pair.mirror) ? readFileSync(pair.mirror, 'utf8') : null;
  if (actual === expected) {
    console.log(`[check-contracts-sync] ${pair.name}: mirror in sync`);
  } else {
    console.error(
      `[check-contracts-sync] ${pair.name}: mirror DRIFTED from ../shared-contracts/api-definitions.md\n` +
        `  fix: run \`npm run sync:contracts\` (never hand-edit docs/shared-contracts/api-definitions.md)`,
    );
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
