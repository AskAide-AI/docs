#!/usr/bin/env node
// Prebuild gate: every hand-maintained content page must carry frontmatter
// with title, description, and sidebar_position. The generated contract mirror
// (docs/shared-contracts/api-definitions.md) is produced with frontmatter by
// scripts/sync-contracts.mjs and passes the same check.
//
// Pages listed in WAIVERS are skipped — use only while a frontmatter rollout
// is in progress, never as a permanent state.
import {readdirSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(repoRoot, 'docs');

const WAIVERS = new Set([]);

function collectFiles(dir, base) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full, `${base}/${entry}`));
    } else if (/\.(md|mdx)$/.test(entry)) {
      files.push(`${base}/${entry}`);
    }
  }
  return files;
}

const failures = [];
const files = collectFiles(docsDir, '');

for (const rel of files) {
  const id = rel.replace(/\.(md|mdx)$/, '');
  if (WAIVERS.has(id)) continue;
  const source = readFileSync(path.join(docsDir, rel), 'utf8');
  if (!source.startsWith('---\n')) {
    failures.push(`${id}: missing frontmatter block`);
    continue;
  }
  const close = source.indexOf('\n---', 3);
  if (close === -1) {
    failures.push(`${id}: frontmatter block never closes`);
    continue;
  }
  const block = source.slice(4, close);
  for (const field of ['title', 'description', 'sidebar_position']) {
    if (!new RegExp(`^${field}:`, 'm').test(block)) {
      failures.push(`${id}: frontmatter missing '${field}'`);
    }
  }
}

if (failures.length > 0) {
  console.error(
    `[check-docs-meta] ${failures.length} page(s) fail the frontmatter standard:\n  ${failures.join('\n  ')}`,
  );
  process.exit(1);
}
console.log(
  `[check-docs-meta] ${files.length} pages carry title/description/sidebar_position`,
);
