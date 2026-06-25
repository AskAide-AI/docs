# Multi-Expert Team Setup - Quick Start Guide

## What Has Been Set Up

### ✅ Expert Skills Created

**Frontend Experts** (in `project/.agent/skills/`):
- `frontend-design-expert` - UI/UX, component architecture, React 18, Tailwind CSS, HeadlessUI
- `cross-service-integration` - Service coordination, API contracts

**Backend Experts** (in `Backend/.agent/skills/`):
- `backend-api-expert` - REST API design, Express.js, error handling
- `ai-rag-expert` - RAG architecture, AI service integration

### ✅ Shared Contracts Created

**In `shared-contracts/` directory**:
- `data-models.ts` - Shared TypeScript interfaces for all data models
- `api-definitions.md` - Complete API documentation with request/response formats
- `integration-guide.md` - Comprehensive guide for using the multi-expert team

### ✅ AGENTS.md Updated

Both `project/AGENTS.md` and `Backend/AGENTS.md` have been updated with:
- Expert skills documentation
- Expert workflow guidance
- Cross-expert coordination commands
- MCP tool usage instructions

## How to Use - Quick Reference

### 1. Before Any Task - Load Expert Skill

```bash
# For frontend tasks
skill name="frontend-design-expert"

# For backend tasks
skill name="backend-api-expert"

# For AI tasks
skill name="ai-rag-expert"

# For cross-service integration
skill name="cross-service-integration"
```

### 2. Use MCP Tools for Code Analysis

```bash
# Find similar code
code-review-graph_semantic_search_nodes_tool query="your search term"

# Understand relationships
code-review-graph_query_graph_tool pattern="callers_of" target="functionName"

# Check impact
code-review-graph_get_impact_radius_tool changed_files=["path/to/file"]
```

### 3. Reference Shared Contracts

```bash
# Check data models
# Reference: shared-contracts/data-models.ts

# Check API definitions
# Reference: shared-contracts/api-definitions.md
```

### 4. Coordinate Between Experts

```bash
# Frontend to Backend
"Ask backend-api-expert about API contract for [feature]"

# Backend to Frontend
"Ask frontend-design-expert about data format requirements"

# Cross-service validation
"Validate this integration with cross-service-integration"
```

## Expert Team Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Expert Team                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend Repo          Backend Repo          Shared         │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │ Frontend      │◄────►│ Backend       │◄────►│ Contracts│  │
│  │ Experts      │      │ Experts      │      │          │  │
│  │              │      │              │      │ - Types  │  │
│  │ - Design     │      │ - API        │      │ - APIs   │  │
│  │ - Code Qlty  │      │ - AI RAG     │      │ - Guide  │  │
│  │ - State Mgmt │      │ - Security   │      │          │  │
│  │ - Testing    │      │ - Database   │      │          │  │
│  └──────────────┘      └──────────────┘      └──────────┘  │
│         │                      │                              │
│         └──────────┬───────────┘                              │
│                    ▼                                         │
│         ┌──────────────────────┐                             │
│         │ Cross-Service         │                             │
│         │ Integration Expert   │                             │
│         └──────────────────────┘                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Common Workflows

### Creating a New Feature

1. **Identify experts needed** (frontend + backend + integration)
2. **Load expert skills** for each domain
3. **Use MCP tools** to understand existing code
4. **Reference shared contracts** for data models and APIs
5. **Design and implement** following expert guidance
6. **Validate integration** with cross-service expert

### Integrating AI Services

1. **Load ai-rag-expert** skill
2. **Load backend-api-expert** skill
3. **Review AI service patterns**
4. **Design API endpoints** for AI integration
5. **Implement with proper error handling**
6. **Validate with cross-service integration**

### Frontend-Backend Integration

1. **Load frontend-design-expert** skill
2. **Load backend-api-expert** skill
3. **Review API contracts** in shared-contracts
4. **Design UI components** following patterns
5. **Implement API calls** with proper error handling
6. **Validate data flow** between services

## Expert Commands Reference

### Frontend Design Expert
- "Design a new component for [feature]"
- "Review this component for design issues"
- "Optimize this component's performance"
- "Improve accessibility of this component"

### Backend API Expert
- "Design API endpoint for [feature]"
- "Review this API endpoint for issues"
- "Optimize this database query"
- "Implement authentication for [endpoint]"

### AI RAG Expert
- "Design RAG system for [use case]"
- "Implement document upload for [feature]"
- "Optimize AI response quality"
- "Implement caching for AI operations"

### Cross-Service Integration
- "Design integration between [service A] and [service B]"
- "Validate API contract for [endpoint]"
- "Implement error handling for cross-service operation"
- "Test integration between services"

## Key Files Reference

### Expert Skills
- `project/.agent/skills/frontend-design-expert/SKILL.md`
- `project/.agent/skills/cross-service-integration/SKILL.md`
- `Backend/.agent/skills/backend-api-expert/SKILL.md`
- `Backend/.agent/skills/ai-rag-expert/SKILL.md`

### Shared Contracts
- `shared-contracts/data-models.ts` - TypeScript interfaces
- `shared-contracts/api-definitions.md` - API documentation
- `shared-contracts/integration-guide.md` - Integration guide

### Documentation
- `project/AGENTS.md` - Frontend expert guide
- `Backend/AGENTS.md` - Backend expert guide

## Next Steps

### Immediate Actions
1. ✅ Expert skills created
2. ✅ Shared contracts established
3. ✅ AGENTS.md updated
4. ✅ Integration guide written

### Recommended Next Actions
1. **Test the setup**: Try loading an expert skill and using MCP tools
2. **Create a feature**: Use the expert team to implement a small feature
3. **Refine skills**: Update expert skills based on your experience
4. **Share with team**: Document any new patterns discovered

### Continuous Improvement
- Review and update expert skills regularly
- Add new expert skills as needed
- Refine shared contracts as API evolves
- Collect feedback on expert effectiveness

## Support

For questions or issues:
1. Reference the integration guide: `shared-contracts/integration-guide.md`
2. Check expert skill files for detailed guidance
3. Use MCP tools to understand codebase structure
4. Coordinate between experts for complex tasks

## Summary

You now have a **multi-expert team architecture** set up with:
- ✅ 4 expert skills (2 frontend, 2 backend)
- ✅ Cross-service integration expert
- ✅ Shared contracts for consistency
- ✅ Comprehensive documentation
- ✅ MCP tool integration
- ✅ Expert coordination workflows

**Start using it today by loading an expert skill before your next task!**