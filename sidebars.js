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
          items: ['frontend/features/product-manual'],
        },
        {
          type: 'category',
          label: 'Development',
          items: ['frontend/development/setup', 'frontend/development/conventions'],
        },
        {
          type: 'category',
          label: 'Reference',
          items: ['frontend/reference/ai-research-prompt'],
        },
        {
          type: 'category',
          label: 'Audits',
          items: ['frontend/audits/code-audit', 'frontend/audits/production-readiness'],
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
          items: ['backend/features/question-generation-flow', 'backend/features/quiz-implementation'],
        },
        {
          type: 'category',
          label: 'Development',
          items: ['backend/development/setup', 'backend/development/module-reference', 'backend/development/testing'],
        },
        {
          type: 'category',
          label: 'Product',
          items: ['backend/product/product-introduction', 'backend/product/pricing', 'backend/product/growth-analysis', 'backend/product/PRODUCT-INTRODUCTION'],
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
          items: ['ai-service/development/setup', 'ai-service/development/integration-plan', 'ai-service/development/integration-plan-full'],
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
  ],
};

export default sidebars;
