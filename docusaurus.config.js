// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';
import {RETIRED_REDIRECTS} from './scripts/lib/retired-redirects.mjs';

const config = {
  title: 'AskAide AI Docs',
  tagline: 'All-in-one learning platform documentation',
  favicon: 'img/favicon.ico',

  url: 'https://askaide-ai.github.io',
  baseUrl: '/docs/',

  organizationName: 'AskAide-AI',
  projectName: 'docs',

  onBrokenLinks: 'throw',

  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        // Old paths live in scripts/lib/retired-redirects.mjs (single source of
        // truth shared with the postbuild check-redirects gate). They are
        // BASE-URL-RELATIVE: the plugin strips baseUrl from every route path
        // before calling createRedirects (verified in the 3.10.1 plugin source
        // — lib/index.js feeds it removePrefix(path, baseUrl)). With baseUrl
        // '/docs/', writing '/docs/…' here would emit redirects under
        // /docs/docs/… on the deployed site.
        createRedirects: (path) => {
          const oldPaths = RETIRED_REDIRECTS.filter((r) => r.to === path).map(
            (r) => r.from,
          );
          return oldPaths.length > 0 ? oldPaths : undefined;
        },
      },
    ],
  ],

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'AskAide AI Docs',
      logo: {
        alt: 'AskAide AI Logo',
        src: 'img/logo.svg',
      },
      items: [
        {to: '/', label: 'Home', position: 'left'},
        {to: '/frontend/overview', label: 'Frontend', position: 'left'},
        {to: '/backend/overview', label: 'Backend', position: 'left'},
        {to: '/ai-service/overview', label: 'AI Service', position: 'left'},
        {to: '/shared-contracts/overview', label: 'Contracts', position: 'left'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Frontend', to: '/frontend/overview'},
            {label: 'Backend', to: '/backend/overview'},
            {label: 'AI Service', to: '/ai-service/overview'},
            {label: 'Shared Contracts', to: '/shared-contracts/overview'},
          ],
        },
        {
          title: 'Repos',
          items: [
            {label: 'Frontend', href: 'https://github.com/AskAide-AI/frontend'},
            {label: 'Backend', href: 'https://github.com/AskAide-AI/Backend'},
            {label: 'AI Service', href: 'https://github.com/AskAide-AI/ai-service'},
            {label: 'Contracts', href: 'https://github.com/AskAide-AI/shared-contracts'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} AskAide AI`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
