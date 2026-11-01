// Shared logic for generating docs/shared-contracts/api-definitions.md from the
// canonical contract in the sibling shared-contracts repo.
//
// The mirror is a BUILD ARTIFACT: canonical source + a deterministic MDX-safety
// transform + standard frontmatter. Never hand-edit the mirror — edit the
// canonical in ../shared-contracts and run `npm run sync:contracts`.
//
// Transform (deterministic and idempotent — running it twice is a no-op):
//   1. Drop any frontmatter the canonical may carry (the mirror gets its own).
//   2. Outside fenced code blocks:
//      a. In GFM table rows, escape unescaped `|` inside inline-code spans as
//         `\|`. GitHub-Flavored Markdown splits a table cell at EVERY pipe,
//         even inside backticks, so a span like `source (office|parent)` splits
//         the cell mid-span and leaves later braces bare — the exact cause of
//         the 2026-10 MDX build failure at api-definitions.md:561
//         ("Unexpected end of file in expression", the fees day-book cell
//         `student:{name,admissionNo,classSection}`).
//      b. Escape bare `{` and `<` outside inline-code spans as `\{` / `\<`.
//         MDX parses a bare `{` as the start of a JSX expression; a bare `<`
//         followed by a letter starts JSX. Both must be literal here.
//   3. Fenced code blocks (``` / ~~~) pass through untouched.
import { createHash } from 'node:crypto';

// sidebar_position 560 = the mirror's index in the hand-maintained sidebars.js
// order (position = index+1, gaps of 10) — same convention as the frontmatter
// pass in scripts/apply-frontmatter.mjs. If the sidebars order changes, update
// this constant and re-run npm run sync:contracts.
export const MIRROR_FRONTMATTER = [
  '---',
  'title: AskAide AI Platform — API Contracts',
  'description: Canonical API contracts for the Backend and AI Service — endpoint catalog, auth model, token rules, and the shared response envelope.',
  'sidebar_position: 560',
  '---',
  '',
  '',
].join('\n');

/** Escape bare `{` / `<` outside inline code, and unescaped `|` inside inline
 *  code on table rows. Idempotent: already-escaped chars are left alone. */
function mdxSafeLine(line) {
  const isTableRow = line.trimStart().startsWith('|');
  let out = '';
  let inSpan = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const prev = i > 0 ? line[i - 1] : '';
    if (c === '`') {
      inSpan = !inSpan;
      out += c;
    } else if (inSpan) {
      out += isTableRow && c === '|' && prev !== '\\' ? '\\|' : c;
    } else if ((c === '{' || c === '<') && prev !== '\\') {
      out += '\\' + c;
    } else {
      out += c;
    }
  }
  return out;
}

/** Deterministic MDX-safe body from the canonical markdown source. */
export function mdxSafeBody(canonicalSource) {
  let body = canonicalSource;
  // 1) Strip canonical frontmatter, if the canonical ever gains one.
  if (body.startsWith('---\n')) {
    const close = body.indexOf('\n---', 3);
    if (close !== -1) {
      const nextNewline = body.indexOf('\n', close + 1);
      if (nextNewline !== -1) body = body.slice(nextNewline + 1);
    }
  }
  const lines = body.split('\n');
  const out = [];
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      out.push(line);
    } else if (inFence) {
      out.push(line);
    } else {
      out.push(mdxSafeLine(line));
    }
  }
  return out.join('\n');
}

/** Full mirror file content for a given canonical source string. */
export function generateMirrorContent(canonicalSource) {
  return MIRROR_FRONTMATTER + mdxSafeBody(canonicalSource);
}

/** sha256 hex digest of the canonical source (sidecar provenance). */
export function sourceHash(canonicalSource) {
  return createHash('sha256').update(canonicalSource, 'utf8').digest('hex');
}
