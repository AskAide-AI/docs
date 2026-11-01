# AskAide AI Docs

The public documentation website for AskAide AI, built with [Docusaurus](https://docusaurus.io/) 3.
This repo uses **npm** (lockfile is `package-lock.json`; there is no `yarn.lock`).

## Installation

```bash
npm install
```

## Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command runs the prebuild gates (contract-sync check, docs↔sidebars consistency, frontmatter check), generates static content into the `build` directory, then runs the postbuild redirect check. The output can be served with `npm run serve`.

## Deployment

Fully automatic — there is **no `gh-pages` branch and no manual deploy step**:

1. Push to `main`.
2. GitHub Actions runs `.github/workflows/deploy.yml`: `npm ci` → `npm run build` → publish `build/` with `actions/deploy-pages@v4`.
3. The site goes live at `https://askaide-ai.github.io/docs/`.

If a build fails (broken links, drift, missing frontmatter), the deploy fails — fix and push again.

## Generated content — do not hand-edit

`docs/shared-contracts/api-definitions.md` is a generated mirror of the canonical contract in the sibling `shared-contracts` repo. To change it, edit `../shared-contracts/api-definitions.md` and run:

```bash
npm run sync:contracts
```
