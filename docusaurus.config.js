// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

const config = {
  title: 'AskAide AI Docs',
  tagline: 'All-in-one learning platform documentation',
  favicon: 'img/favicon.ico',

  url: 'https://AskAide-AI.github.io',
  baseUrl: '/docs/',

  organizationName: 'AskAide-AI',
  projectName: 'docs',

  onBrokenLinks: 'warn',

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
        {to: '/frontend', label: 'Frontend', position: 'left'},
        {to: '/backend', label: 'Backend', position: 'left'},
        {to: '/ai-service', label: 'AI Service', position: 'left'},
        {to: '/shared-contracts', label: 'Contracts', position: 'left'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Frontend', to: '/frontend'},
            {label: 'Backend', to: '/backend'},
            {label: 'AI Service', to: '/ai-service'},
            {label: 'Shared Contracts', to: '/shared-contracts'},
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
