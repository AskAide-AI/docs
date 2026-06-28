const sidebars = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Frontend',
      link: {type: 'doc', id: 'frontend/overview'},
      items: [
        'frontend/architecture',
        {
          type: 'category',
          label: 'Features',
          items: [
            'frontend/features/product-manual',
            'frontend/features/study-session-flow',
            'frontend/features/features',
          ],
        },
        {
          type: 'category',
          label: 'Product',
          items: ['frontend/product/product-overview', 'frontend/product/project-overview'],
        },
        {
          type: 'category',
          label: 'Development',
          items: [
            'frontend/development/setup',
            'frontend/development/conventions',
            'frontend/development/pages-and-routes',
            'frontend/development/component-library',
            'frontend/development/state-management',
            'frontend/development/forms-and-validation',
            'frontend/development/styling-guide',
            'frontend/development/api-integration',
            'frontend/development/quiz-module-api',
            'frontend/development/teacher-dashboard-api',
            'frontend/development/performance',
            'frontend/development/accessibility',
            'frontend/development/seo-checklist',
            'frontend/development/testing',
            'frontend/development/testing-strategy',
            'frontend/development/dependencies',
            'frontend/development/deployment',
            'frontend/development/troubleshooting',
            'frontend/development/refactoring-guide',
            'frontend/development/proposed-changes',
            'frontend/development/changelog',
          ],
        },
        {
          type: 'category',
          label: 'Reference',
          items: ['frontend/reference/ai-research-prompt', 'frontend/reference/progress'],
        },
        {
          type: 'category',
          label: 'Audits',
          items: [
            'frontend/audits/code-audit',
            'frontend/audits/frontend-audit',
            'frontend/audits/production-readiness',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Backend',
      link: {type: 'doc', id: 'backend/overview'},
      items: [
        'backend/architecture',
        {
          type: 'category',
          label: 'Features',
          items: [
            'backend/features/question-generation-flow',
            'backend/features/quiz-implementation',
            'backend/features/question-selection',
            'backend/features/features',
          ],
        },
        {
          type: 'category',
          label: 'Development',
          items: [
            'backend/development/setup',
            'backend/development/module-reference',
            'backend/development/api-documentation',
            'backend/development/authentication',
            'backend/development/security',
            'backend/development/error-handling',
            'backend/development/testing',
            'backend/development/testing-strategy',
            'backend/development/quiz-test-cases',
            'backend/development/dependencies',
            'backend/development/deployment',
            'backend/development/troubleshooting',
            'backend/development/api-changelog',
            'backend/development/changelog',
          ],
        },
        {
          type: 'category',
          label: 'Reference',
          items: [
            'backend/reference/system-design',
            'backend/reference/database-schema',
            'backend/reference/progress',
          ],
        },
        {
          type: 'category',
          label: 'Product',
          items: [
            'backend/product/pricing',
            'backend/product/growth-analysis',
            'backend/product/PRODUCT-INTRODUCTION',
            'backend/product/backend-overview-for-pm',
          ],
        },
        {
          type: 'category',
          label: 'Audits',
          items: ['backend/audits/audit-report', 'backend/audits/data-gap-analysis', 'backend/audits/production-readiness'],
        },
      ],
    },
    {
      type: 'category',
      label: 'AI Service',
      link: {type: 'doc', id: 'ai-service/overview'},
      items: [
        'ai-service/architecture',
        {
          type: 'category',
          label: 'Features',
          items: ['ai-service/features/ai-features-quickref', 'ai-service/features/cross-repo-map'],
        },
        {
          type: 'category',
          label: 'Development',
          items: [
            'ai-service/development/setup',
            'ai-service/development/integration-plan',
            'ai-service/development/integration-plan-full',
            'ai-service/development/eval-readme',
            'ai-service/development/troubleshooting',
            'ai-service/development/testing-strategy',
          ],
        },
        {
          type: 'category',
          label: 'Reference',
          items: ['ai-service/reference/documentation'],
        },
        {
          type: 'category',
          label: 'Audits',
          items: ['ai-service/audits/dataset-audit', 'ai-service/audits/production-readiness'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Shared Contracts',
      link: {type: 'doc', id: 'shared-contracts/overview'},
      items: [
        'shared-contracts/api-definitions',
        'shared-contracts/integration-guide',
        {
          type: 'category',
          label: 'Development',
          items: ['shared-contracts/development/quick-start', 'shared-contracts/development/mcp-setup'],
        },
        {
          type: 'category',
          label: 'Product',
          items: [
            'shared-contracts/product/competitor-feature-matrix',
            'shared-contracts/product/competitor-research',
            'shared-contracts/product/duplicate-questions-investigation',
            'shared-contracts/product/growth-strategy',
          ],
        },
        {
          type: 'category',
          label: 'Audits',
          items: ['shared-contracts/audits/pre-launch-audit-report', 'shared-contracts/audits/product-audit-report'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Guides & Reference',
      items: [
        'reference/getting-started',
        'reference/user-guide',
        'reference/developer-guide',
        'reference/api-reference',
        'reference/integration',
        'reference/multi-expert-team-guide',
      ],
    },
  ],
};

export default sidebars;
