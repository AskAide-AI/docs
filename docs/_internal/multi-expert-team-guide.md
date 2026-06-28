# Multi-Expert Team Architecture - Complete Guide

## Overview

This project implements a **multi-expert team architecture** where different experts specialize in specific domains (frontend, backend, AI services) and coordinate with each other to deliver high-quality, integrated solutions.

## Expert Team Structure

### Frontend Experts (Frontend Repository)
- **frontend-design-expert**: UI/UX design, component architecture, Material UI integration
- **frontend-code-quality**: TypeScript, performance optimization, accessibility
- **frontend-state-management**: Redux patterns, local state, data flow
- **frontend-integration**: API calls, error handling, loading states
- **webapp-testing**: React testing patterns, component testing
- **accessibility-i18n**: A11y implementation, internationalization

### Backend Experts (This Repository)
- **backend-api-expert**: REST API design, Express.js architecture, error handling
- **ai-rag-expert**: RAG architecture, document processing, AI service integration
- **api-security**: JWT/role guard patterns, authentication, authorization
- **backend-testing**: Jest + ESM + Mongoose mock patterns
- **database-patterns**: Mongoose schema design, N+1 prevention, query optimization
- **deployment-ops**: Render deployment, Winston logging config

### Cross-Service Integration
- **cross-service-integration**: Service coordination, API contracts, data flow validation

## How to Use the Multi-Expert Team

### Step 1: Identify Your Task Type

Before starting any task, identify which expert(s) you need:

| Task Type | Primary Expert | Secondary Experts |
|-----------|----------------|-------------------|
| Create new UI component | frontend-design-expert | frontend-code-quality, cross-service-integration |
| Implement API endpoint | backend-api-expert | api-security, database-patterns |
| Integrate AI service | ai-rag-expert | backend-api-expert, cross-service-integration |
| Add authentication | api-security | backend-api-expert, frontend-integration |
| Optimize performance | frontend-code-quality | backend-api-expert |
| Implement state management | frontend-state-management | frontend-design-expert |

### Step 2: Load the Appropriate Expert Skill

Use the `skill` tool to load the expert skill before starting your task:

```bash
# Example: Load frontend design expert
skill name="frontend-design-expert"

# Example: Load backend API expert
skill name="backend-api-expert"

# Example: Load AI RAG expert
skill name="ai-rag-expert"

# Example: Load cross-service integration
skill name="cross-service-integration"
```

### Step 3: Follow Expert Workflow

Each expert skill provides a specific workflow. Follow it step-by-step:

#### Frontend Design Expert Workflow
1. Load `frontend-design-expert` skill
2. Review component patterns and Material UI usage
3. Use `semantic_search_nodes` to find similar components
4. Design component following established patterns
5. Validate with `cross-service-integration` for API contracts

#### Backend API Expert Workflow
1. Load `backend-api-expert` skill
2. Review API contracts in `shared-contracts/api-definitions.md`
3. Use `semantic_search_nodes` to find similar endpoints
4. Design endpoint following RESTful conventions
5. Validate with `cross-service-integration` expert

#### AI RAG Expert Workflow
1. Load `ai-rag-expert` skill
2. Review AI service patterns and requirements
3. Use `query_graph` to find existing AI integrations
4. Implement AI service integration with proper error handling
5. Validate with `backend-api-expert` for endpoint design

### Step 4: Use MCP Tools for Code Analysis

Before writing code, use MCP tools to understand the existing codebase:

```bash
# Find similar components/endpoints
code-review-graph_semantic_search_nodes_tool query="user authentication"

# Understand code relationships
code-review-graph_query_graph_tool pattern="callers_of" target="functionName"

# Check impact of changes
code-review-graph_get_impact_radius_tool changed_files=["path/to/file"]

# Find affected flows
code-review-graph_get_affected_flows_tool changed_files=["path/to/file"]
```

### Step 5: Coordinate Between Experts

For tasks that span multiple domains, coordinate between experts:

```bash
# Example: Frontend-Backend Integration
1. Load frontend-design-expert → Design UI component
2. Load cross-service-integration → Review API contracts
3. Load backend-api-expert → Validate endpoint design
4. Implement with guidance from all experts

# Example: Backend-AI Integration
1. Load backend-api-expert → Design API endpoint
2. Load ai-rag-expert → Design AI integration
3. Load cross-service-integration → Validate data flow
4. Implement with guidance from all experts
```

## Expert Coordination Commands

Use these commands to coordinate between experts:

### Frontend to Backend
- "Ask backend-api-expert about API contract for user authentication"
- "Validate this data model with backend-api-expert"
- "Coordinate error handling with backend-api-expert"

### Backend to Frontend
- "Ask frontend-design-expert about data format requirements"
- "Validate this response format with frontend-design-expert"
- "Coordinate loading states with frontend-design-expert"

### Backend to AI
- "Ask ai-rag-expert about document upload requirements"
- "Validate this AI integration with ai-rag-expert"
- "Coordinate error handling with ai-rag-expert"

### Cross-Service Validation
- "Validate this integration with cross-service-integration"
- "Check data flow between services with cross-service-integration"
- "Review API contracts with cross-service-integration"

## Shared Contracts

The `shared-contracts/` directory contains shared resources:

### data-models.ts
Shared TypeScript interfaces for all data models:
- User models (User, UserProfile, StudentProfile, TeacherProfile)
- API response models (APIResponse, PaginatedResponse)
- Content models (Subject, Chapter, Content)
- Question models (Question, QuestionPaper)
- Progress models (Progress, QuizAttempt)
- AI service models (AIDocument, AIQuery, AIRequest, AIResponse)
- And more...

### api-definitions.md
Complete API documentation with:
- Base URLs and authentication
- Common response formats
- All API endpoints with request/response examples
- Error codes and rate limiting
- Webhook events

**Always reference these files when implementing new features or API integrations.**

## Development Workflow Examples

### Example 1: Creating a New Feature

**Task**: Create a user profile feature

1. **Load Experts**:
   ```bash
   skill name="frontend-design-expert"
   skill name="backend-api-expert"
   skill name="cross-service-integration"
   ```

2. **Analyze Requirements**:
   - Use `semantic_search_nodes` to find existing user-related code
   - Review `shared-contracts/data-models.ts` for User interface
   - Review `shared-contracts/api-definitions.md` for user endpoints

3. **Design Backend**:
   - Follow `backend-api-expert` workflow
   - Design API endpoints following RESTful conventions
   - Implement proper authentication and validation

4. **Design Frontend**:
   - Follow `frontend-design-expert` workflow
   - Design UI components using Material UI
   - Implement proper state management

5. **Validate Integration**:
   - Use `cross-service-integration` to validate data flow
   - Test API contracts between frontend and backend
   - Ensure error handling is consistent

### Example 2: Integrating AI Service

**Task**: Add AI-powered question generation

1. **Load Experts**:
   ```bash
   skill name="ai-rag-expert"
   skill name="backend-api-expert"
   skill name="cross-service-integration"
   ```

2. **Analyze Requirements**:
   - Use `query_graph` to find existing AI integrations
   - Review AI service documentation
   - Review `shared-contracts/api-definitions.md` for AI endpoints

3. **Design AI Integration**:
   - Follow `ai-rag-expert` workflow
   - Design RAG architecture for question generation
   - Implement proper error handling and fallbacks

4. **Design API Endpoints**:
   - Follow `backend-api-expert` workflow
   - Design endpoints for AI service communication
   - Implement proper authentication and rate limiting

5. **Validate Integration**:
   - Use `cross-service-integration` to validate data flow
   - Test AI service integration
   - Ensure error handling is comprehensive

## Best Practices

### 1. Always Load Expert Skills First
Before starting any task, load the appropriate expert skill to get guidance on patterns, best practices, and workflows.

### 2. Use MCP Tools Before File Exploration
Always use `code-review-graph` tools before using Grep/Glob/Read to explore the codebase. The graph provides structural context that file scanning cannot.

### 3. Validate with Cross-Service Integration
For any task that involves multiple services, validate with `cross-service-integration` to ensure proper data flow and error handling.

### 4. Reference Shared Contracts
Always reference `shared-contracts/` files when implementing new features or API integrations to ensure consistency across services.

### 5. Coordinate Between Experts
For tasks that span multiple domains, coordinate between experts to ensure all aspects are covered.

### 6. Follow Expert Workflows
Each expert skill provides a specific workflow. Follow it step-by-step to ensure quality and consistency.

## Troubleshooting

### Issue: Expert Skill Not Loading
**Solution**: Ensure the skill file exists in `.agent/skills/` directory and has the correct structure.

### Issue: MCP Tools Not Working
**Solution**: Ensure the code-review-graph is built and up-to-date. Run `code-review-graph_build_or_update_graph_tool` if needed.

### Issue: Cross-Service Integration Failing
**Solution**: Validate API contracts in `shared-contracts/api-definitions.md` and ensure data models match between services.

### Issue: Expert Coordination Confusion
**Solution**: Use the expert coordination commands to clarify responsibilities and validate decisions.

## Expert Skills Location

### Frontend Repository
```
.agent/skills/
├── frontend-design-expert/
│   └── SKILL.md
├── frontend-code-quality/
│   └── SKILL.md
├── frontend-state-management/
│   └── SKILL.md
├── frontend-integration/
│   └── SKILL.md
├── webapp-testing/
│   └── SKILL.md
├── accessibility-i18n/
│   └── SKILL.md
└── cross-service-integration/
    └── SKILL.md
```

### Backend Repository (This Repo)
```
.agent/skills/
├── backend-api-expert/
│   └── SKILL.md
├── ai-rag-expert/
│   └── SKILL.md
├── api-security/
│   └── SKILL.md
├── backend-testing/
│   └── SKILL.md
├── database-patterns/
│   └── SKILL.md
└── deployment-ops/
    └── SKILL.md
```

## Shared Contracts Location

```
shared-contracts/
├── data-models.ts           # Shared TypeScript interfaces
├── api-definitions.md       # Complete API documentation
├── integration-guide.md     # Comprehensive integration guide
└── QUICK_START.md          # Quick reference guide
```

## Quick Reference

### Load Expert Skills
```bash
skill name="frontend-design-expert"
skill name="backend-api-expert"
skill name="ai-rag-expert"
skill name="cross-service-integration"
```

### Use MCP Tools
```bash
code-review-graph_semantic_search_nodes_tool query="search term"
code-review-graph_query_graph_tool pattern="callers_of" target="functionName"
code-review-graph_get_impact_radius_tool changed_files=["path/to/file"]
code-review-graph_get_affected_flows_tool changed_files=["path/to/file"]
```

### Expert Coordination
```bash
"Ask backend-api-expert about API contract"
"Validate with cross-service-integration"
"Check shared-contracts for data models"
```

## Continuous Improvement

### Regular Tasks
- Review and update expert skills based on new patterns discovered
- Refine MCP tool usage based on project needs
- Update shared contracts as API evolves
- Collect feedback from team on expert effectiveness

### Learning Sources
- React documentation and best practices
- Express.js and Node.js best practices
- AI/ML integration patterns
- Microservices architecture patterns
- Distributed systems principles

## Summary

The multi-expert team architecture enables next-level development by ensuring that every task is approached with the right expertise, proper coordination between services, and adherence to established patterns and best practices. By following this guide, you can leverage the full power of the expert team to deliver high-quality, integrated solutions.

### Key Benefits
- ✅ **Expert Guidance**: Each task gets expert-level guidance
- ✅ **Consistent Patterns**: Established patterns across the codebase
- ✅ **Cross-Service Coordination**: Proper integration between services
- ✅ **Quality Assurance**: Built-in quality checks and validation
- ✅ **Efficient Development**: Faster development with expert workflows
- ✅ **Knowledge Sharing**: Expert knowledge codified in skills

### Getting Started
1. Load an expert skill before your next task
2. Use MCP tools to understand the codebase
3. Reference shared contracts for consistency
4. Coordinate between experts for complex tasks
5. Follow expert workflows for best results

**Start using the multi-expert team today!** 🚀