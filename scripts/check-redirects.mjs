#!/usr/bin/env node
// Postbuild gate: for every recorded old path in scripts/lib/retired-redirects.mjs,
// assert that build/<oldPath>/index.html exists and is a redirect stub pointing
// at the recorded target.
//
// Guards the silent-drop risk in @docusaurus/plugin-client-redirects: its
// filterUnwantedRedirects (lib/collectRedirects.js:123-133 in 3.10.1) quietly
// drops a redirect whose from-path would override an existing route — e.g. a
// wrong old-path spelling that collides with a live route — without failing
// the build. This gate makes any such drop loud.
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {RETIRED_REDIRECTS} from './lib/retired-redirects.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(repoRoot, 'build');
const baseUrl = '/docs/';

if (!existsSync(buildDir)) {
  console.error(
    '[check-redirects] build/ not found — run this after `npm run build` (it is wired as the postbuild hook)',
  );
  process.exit(1);
}

let failed = false;
for (const {from, to} of RETIRED_REDIRECTS) {
  const stubPath = path.join(buildDir, from, 'index.html');
  if (!existsSync(stubPath)) {
    console.error(
      `[check-redirects] MISSING stub: ${from} → ${to}\n` +
        `  expected ${path.relative(repoRoot, stubPath)}\n` +
        `  the redirects plugin silently drops redirects that would override an existing route — check the from-path spelling and that the source page is really gone`,
    );
    failed = true;
    continue;
  }
  const html = readFileSync(stubPath, 'utf8');
  const expectedUrl = `${baseUrl.replace(/\/$/, '')}${to}`;
  const hasRefresh =
    html.includes('http-equiv="refresh"') && html.includes(`url=${expectedUrl}`);
  const hasCanonical = html.includes(`href="${expectedUrl}"`);
  if (!hasRefresh || !hasCanonical) {
    console.error(
      `[check-redirects] WRONG stub: ${from}\n` +
        `  expected a refresh+canonical redirect to ${expectedUrl}\n` +
        `  found: ${html.slice(0, 400).replace(/\s+/g, ' ')}`,
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log(
  `[check-redirects] ${RETIRED_REDIRECTS.length} redirect stubs present and pointing at their recorded targets`,
);
