#!/usr/bin/env node
// Regenerates docs/shared-contracts/api-definitions.md from the canonical
// contract at ../shared-contracts/api-definitions.md.
//
//   npm run sync:contracts
//
// The mirror is a build artifact — never hand-edit it. The transform is
// deterministic (see scripts/lib/contracts-mirror.mjs); a sidecar
// api-definitions.sync.json records the canonical source hash and sync time.
//
// Mirror pairs owned by this script are registered in MIRROR_PAIRS below.
// A second pair (ai-service eval README → docs/ai-service/development/eval-readme.md)
// is planned but NOT registered: its prerequisite is a one-line `/v1` backport
// into ../ai-service/eval/README.md:86 in the ai-service repo. Syncing before
// that backport would propagate a wrong endpoint path into the public docs.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateMirrorContent,
  sourceHash,
} from './lib/contracts-mirror.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Register future mirror pairs here; each entry is synced by the same loop.
const MIRROR_PAIRS = [
  {
    name: 'api-definitions',
    source: path.resolve(repoRoot, '..', 'shared-contracts', 'api-definitions.md'),
    mirror: path.join(repoRoot, 'docs', 'shared-contracts', 'api-definitions.md'),
    sidecar: path.join(repoRoot, 'docs', 'shared-contracts', 'api-definitions.sync.json'),
  },
];

let failed = false;

for (const pair of MIRROR_PAIRS) {
  if (!existsSync(pair.source)) {
    console.error(`[sync-contracts] canonical source missing: ${pair.source}`);
    failed = true;
    continue;
  }
  const canonical = readFileSync(pair.source, 'utf8');
  const content = generateMirrorContent(canonical);

  const before = existsSync(pair.mirror) ? readFileSync(pair.mirror, 'utf8') : null;
  if (before === content) {
    console.log(`[sync-contracts] ${pair.name}: mirror already up to date`);
  } else {
    writeFileSync(pair.mirror, content);
    console.log(
      `[sync-contracts] ${pair.name}: regenerated mirror (${content.split('\n').length} lines)`,
    );
  }

  // Sidecar provenance — rewritten only when the mirror actually changed, so
  // repeat runs are a clean no-op in git.
  if (before !== content) {
    const provenance = {
      generator: 'scripts/sync-contracts.mjs',
      source: path.relative(path.dirname(pair.mirror), pair.source),
      sourceHash: sourceHash(canonical),
      sourceBytes: Buffer.byteLength(canonical, 'utf8'),
      syncedAt: new Date().toISOString(),
    };
    writeFileSync(pair.sidecar, JSON.stringify(provenance, null, 2) + '\n');
    console.log(`[sync-contracts] ${pair.name}: sidecar updated (sourceHash ${provenance.sourceHash.slice(0, 12)}…)`);
  }
}

process.exit(failed ? 1 : 0);
