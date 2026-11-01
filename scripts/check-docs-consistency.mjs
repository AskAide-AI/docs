#!/usr/bin/env node
// Prebuild gate: every doc file in docs/ must have a sidebars row, and every
// sidebars id must resolve to a file. Formalizes the sidebars ↔ files check —
// a page added or moved without updating sidebars.js fails the deploy build
// instead of silently dropping out of the navigation.
import {readdirSync, statSync, existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(repoRoot, 'docs');
const sidebarsPath = path.join(repoRoot, 'sidebars.js');

/** Every doc id declared in sidebars.js (bare strings in items + link ids). */
function collectSidebarIds(node, ids) {
  if (typeof node === 'string') {
    ids.push(node);
  } else if (Array.isArray(node)) {
    node.forEach((child) => collectSidebarIds(child, ids));
  } else if (node && typeof node === 'object') {
    if (node.type === 'doc' && node.id) ids.push(node.id);
    if (node.link && node.link.id) ids.push(node.link.id);
    if (node.items) collectSidebarIds(node.items, ids);
    // traverse plain wrapper objects (e.g. the sidebar-name → items map)
    for (const [key, value] of Object.entries(node)) {
      if (!['type', 'link', 'items', 'id', 'label'].includes(key)) {
        collectSidebarIds(value, ids);
      }
    }
  }
  return ids;
}

/** Every content file under docs/, as its Docusaurus doc id. */
function collectFileIds(dir, base) {
  const ids = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const relBase = base === '' ? entry : `${base}/${entry}`;
    if (statSync(full).isDirectory()) {
      ids.push(...collectFileIds(full, relBase));
    } else if (/\.(md|mdx)$/.test(entry)) {
      ids.push(relBase.replace(/\.(md|mdx)$/, ''));
    }
  }
  return ids;
}

const {default: sidebars} = await import(pathToFileURL(sidebarsPath).href);
const sidebarIds = collectSidebarIds(sidebars, []);
const fileIds = collectFileIds(docsDir, '');

const duplicates = sidebarIds.filter(
  (id, i) => sidebarIds.indexOf(id) !== i,
);
const missingFromSidebars = fileIds.filter((id) => !sidebarIds.includes(id));
const danglingInSidebars = sidebarIds.filter(
  (id) => !fileIds.includes(id) && !existsSync(path.join(docsDir, `${id}.md`)),
);

let failed = false;
if (duplicates.length > 0) {
  console.error(
    `[check-docs-consistency] duplicate sidebars ids:\n  ${duplicates.join('\n  ')}`,
  );
  failed = true;
}
if (missingFromSidebars.length > 0) {
  console.error(
    `[check-docs-consistency] files with NO sidebars row (not in navigation):\n  ${missingFromSidebars.join('\n  ')}\n` +
      '  fix: add a row to sidebars.js',
  );
  failed = true;
}
if (danglingInSidebars.length > 0) {
  console.error(
    `[check-docs-consistency] sidebars ids that resolve to NO file:\n  ${danglingInSidebars.join('\n  ')}\n` +
      '  fix: remove or correct the row in sidebars.js',
  );
  failed = true;
}

if (failed) {
  process.exit(1);
} else {
  console.log(
    `[check-docs-consistency] ${fileIds.length} files ↔ ${sidebarIds.length} sidebars ids — consistent`,
  );
}
