// Single source of truth for retired/moved page redirects.
//
// Consumed by:
//  - docusaurus.config.js  → @docusaurus/plugin-client-redirects createRedirects
//  - scripts/check-redirects.mjs (postbuild gate) → asserts each old path
//    produced a redirect stub in build/ pointing at the recorded target
//
// Paths are BASE-URL-RELATIVE (no '/docs' prefix): the redirects plugin strips
// baseUrl from every route path before matching (verified in the 3.10.1 plugin
// source — lib/index.js feeds createRedirects removePrefix(path, baseUrl)).
// Writing '/docs/…' here would emit redirects under /docs/docs/… on the site.
//
// A client-redirect stub can only point at ONE target (the plugin's
// redirectValidation requires `to` to be a string), so retired pages redirect
// to their single best replacement.
export const RETIRED_REDIRECTS = [
  // frontend per-feature API references moved out of development/
  {
    from: '/frontend/development/quiz-module-api',
    to: '/frontend/reference/quiz-module-api',
  },
  {
    from: '/frontend/development/teacher-dashboard-api',
    to: '/frontend/reference/teacher-dashboard-api',
  },
  // backend/features/question-selection.md retired — near-duplicate of the
  // generation flow; its unique Fisher-Yates fact was folded into that page
  {
    from: '/backend/features/question-selection',
    to: '/backend/features/question-generation-flow',
  },
  // ai-service/development/integration-plan.md retired — proposed-not-built
  // plan carrying AI-chat artifacts; the quickref catalogs what actually exists
  {
    from: '/ai-service/development/integration-plan',
    to: '/ai-service/features/ai-features-quickref',
  },
  // shared-contracts/development/mcp-setup.md retired — internal workspace
  // tooling, meaningless to a public reader
  {
    from: '/shared-contracts/development/mcp-setup',
    to: '/shared-contracts/overview',
  },
  // ai-service/reference/documentation.md retired — systematically stale;
  // overview is the service landing and links onward to the lld page
  {
    from: '/ai-service/reference/documentation',
    to: '/ai-service/overview',
  },
  // src/pages/markdown-page.mdx — Docusaurus template demo deleted
  {
    from: '/markdown-page',
    to: '/intro',
  },
];
