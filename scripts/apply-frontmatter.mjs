#!/usr/bin/env node
// One-shot migration: prepend standard frontmatter (title from the page's H1,
// description from scripts/lib/frontmatter-descriptions.mjs, sidebar_position
// from the sidebars.js order with gaps of 10) to every hand-maintained content
// page. The generated contract mirror is skipped — scripts/sync-contracts.mjs
// owns its frontmatter.
//
// Idempotent: pages that already have frontmatter are reported and skipped.
// Run: node scripts/apply-frontmatter.mjs [--check]
import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {DESCRIPTIONS} from './lib/frontmatter-descriptions.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(repoRoot, 'docs');
const GENERATED = new Set(['shared-contracts/api-definitions']);

function collectSidebarIds(node, ids) {
  if (typeof node === 'string') ids.push(node);
  else if (Array.isArray(node)) node.forEach((n) => collectSidebarIds(n, ids));
  else if (node && typeof node === 'object') {
    if (node.type === 'doc' && node.id) ids.push(node.id);
    if (node.link && node.link.id) ids.push(node.link.id);
    if (node.items) collectSidebarIds(node.items, ids);
    for (const [key, value] of Object.entries(node)) {
      if (!['type', 'link', 'items', 'id', 'label'].includes(key)) {
        collectSidebarIds(value, ids);
      }
    }
  }
  return ids;
}

function findFile(id) {
  for (const ext of ['.md', '.mdx']) {
    const p = path.join(docsDir, id + ext);
    try {
      return {path: p, source: readFileSync(p, 'utf8')};
    } catch {
      /* try next */
    }
  }
  return null;
}

const {default: sidebars} = await import(pathToFileURL(path.join(repoRoot, 'sidebars.js')).href);
const orderedIds = collectSidebarIds(sidebars, []);

const checkOnly = process.argv.includes('--check');
const problems = [];
let written = 0;
let skipped = 0;

for (let i = 0; i < orderedIds.length; i++) {
  const id = orderedIds[i];
  if (GENERATED.has(id)) {
    console.log(`[apply-frontmatter] ${id}: generated mirror — skipped (owned by sync-contracts)`);
    continue;
  }
  const file = findFile(id);
  if (!file) {
    problems.push(`${id}: no file found`);
    continue;
  }
  const {source} = file;
  if (source.startsWith('---\n')) {
    console.log(`[apply-frontmatter] ${id}: already has frontmatter — skipped`);
    skipped += 1;
    continue;
  }
  const h1 = (source.match(/^# (.+)$/m) || [])[1];
  if (!h1) {
    problems.push(`${id}: no H1 to derive the title from`);
    continue;
  }
  const title = h1.replace(/`/g, '').trim();
  const description = DESCRIPTIONS[id];
  if (!description) {
    problems.push(`${id}: no description in scripts/lib/frontmatter-descriptions.mjs`);
    continue;
  }
  if (title.length > 60) problems.push(`${id}: title ${title.length} chars (> 60): "${title}"`);
  if (description.length < 120 || description.length > 155) {
    problems.push(`${id}: description ${description.length} chars (need 120-155)`);
  }
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `sidebar_position: ${(i + 1) * 10}`,
    '---',
    '',
    '',
  ].join('\n');
  if (!checkOnly) {
    writeFileSync(file.path, frontmatter + source);
    console.log(`[apply-frontmatter] ${id}: written (position ${(i + 1) * 10})`);
    written += 1;
  } else {
    console.log(`[apply-frontmatter] ${id}: OK (position ${(i + 1) * 10}, title ${title.length}c, desc ${description.length}c)`);
  }
}

if (problems.length > 0) {
  console.error(`\n[apply-frontmatter] ${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`\n[apply-frontmatter] done: ${written} written, ${skipped} already had frontmatter${checkOnly ? ' (check mode — nothing written)' : ''}`);
