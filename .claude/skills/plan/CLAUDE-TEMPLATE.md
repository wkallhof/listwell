# CLAUDE.md Template

Use this template when generating or updating `CLAUDE.md` for the project.

---

```markdown
# {Project Name} - Claude Code Instructions

## Project Overview

{One paragraph describing what this project does. Include target users and key capabilities.}

## Key Documents

| Document                           | Purpose                         |
| ---------------------------------- | ------------------------------- |
| [docs/prd.md](docs/prd.md)         | Product Requirements Document   |
| [docs/screens.md](docs/screens.md) | Screen specifications and flows |
| [docs/plan.md](docs/plan.md)       | Technical implementation plan   |
| [docs/tasks.md](docs/tasks.md)     | Current task list and progress  |

## Technology Stack

| Layer          | Technology                | Notes |
| -------------- | ------------------------- | ----- |
| Runtime        | {from PRD}                | -     |
| Framework      | {from PRD}                | -     |
| Language       | {from PRD}                | -     |
| Database       | {from PRD, if applicable} | -     |
| ORM            | {from PRD, if applicable} | -     |
| Authentication | {from PRD, if applicable} | -     |
| Styling        | {from PRD}                | -     |
| Testing        | {from PRD}                | -     |

## Project Structure
```

{Project structure from PRD or as defined in plan - fill in based on actual tech stack}
src/
├── {framework pages directory}
├── components/
│ ├── ui/
│ └── features/
├── lib/
├── services/
└── types/
tests/
├── unit/
└── e2e/
docs/
├── prd.md
├── screens.md
└── design-system.md

````

## Available Commands

### Development

```bash
{Fill in based on actual package.json scripts from PRD tech stack}
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Run linter
npm run typecheck  # Run type checker
npm run format     # Format code
````

### Testing

```bash
npm run test       # Run all tests
{Add other test scripts as defined in project}
```

### Database (if applicable)

```bash
{Fill in based on ORM/database tooling from PRD}
```

### Claude Code Skills

```
/plan              # Generate implementation plan
/plan refresh      # Update plan preserving progress
/execute           # Execute next task from docs/tasks.md
/execute phase     # Execute entire current phase
/frontend-dev      # Guided component development
/review-pr         # Review and fix PR feedback
```

## Design Principles

{Pull from PRD design principles}

1. **{Principle 1}** - {Brief explanation}
2. **{Principle 2}** - {Brief explanation}
3. **{Principle 3}** - {Brief explanation}

## Code Conventions

### General

- Use ES modules (import/export), not CommonJS
- Prefer named exports over default exports
- Use early returns to reduce nesting
- Maximum file length: 300 lines (split if larger)

### TypeScript

- Strict mode enabled - no `any` types
- Define interfaces for all props and function parameters
- Use `type` for unions/intersections, `interface` for object shapes
- Prefer `unknown` over `any` when type is truly unknown

### React (if applicable)

- Functional components only
- Props interface named `{Component}Props`
- Use server components by default (App Router)
- Colocate component, styles, and tests when possible

### Testing

- **Minimum 80% code coverage on all files** — enforced per task on affected files
- Test file naming: `{name}.test.ts` or `{name}.spec.ts`
- Each function/component should have at least one test
- Use descriptive test names: "should {behavior} when {condition}"
- Prefer integration tests over unit tests for UI
- Run `npm run test -- --coverage` to verify coverage thresholds

### Git

- Commit after each completed task
- Commit message format: `type(scope): description`
- Types: feat, fix, refactor, test, docs, chore
- Include task number in commit: `feat(scope): description (1.2.1)`

## Current Focus

See [docs/tasks.md](docs/tasks.md) for current implementation status.

**Current Phase:** {Phase N}
**MVP Status:** {Not Started | In Progress | Complete}

## Session Protocol

### Starting a Session

1. Read this file (CLAUDE.md)
2. Read docs/tasks.md to find next incomplete task
3. State which task you'll work on
4. State your implementation approach
5. Wait for approval before writing code

### During Implementation

1. Work on ONE task at a time
2. Write code following conventions above
3. Run `npm run test` and `npm run typecheck`
4. If tests fail, fix before continuing
5. Mark task complete in docs/tasks.md immediately

### Completing a Task

1. Ensure all tests pass
2. Mark task as complete in docs/tasks.md
3. Update Task Log with date and commit hash
4. Commit with descriptive message
5. Stop and report what you did

### If Uncertain

- Ask clarifying questions before implementing
- Reference PRD for requirements guidance
- When in doubt, prefer simpler solutions
- Check docs/plan.md for phase goals and context

## Do NOT

- Modify multiple tasks without approval
- Skip tests or type checking
- Make architectural changes not covered by PRD
- Install new dependencies without discussing first
- Create files outside the defined structure
- Use `any` types in TypeScript
- Write code that doesn't match existing patterns

## Environment Variables

Required variables (see .env.example):

```
DATABASE_URL=          # Database connection string (if applicable)
{Other required vars from PRD}
```

Optional variables:

```
{Optional vars}
```

## Troubleshooting

### Common Issues

**Database connection fails (if applicable):**

- Ensure database server is running
- Check DATABASE_URL in .env

**Tests fail on fresh clone:**

- Run `npm install`
- Run `npm run db:migrate`
- Check .env has all required variables

**TypeScript errors:**

- Run `npm run typecheck` for details
- Ensure strict mode is respected

```

---

## Template Usage Notes

### When to Update CLAUDE.md

Update during `/plan` when:
- Tech stack is defined from PRD
- Project structure is defined
- New commands are available
- Conventions are established

Update during `/plan refresh` when:
- PRD changes tech decisions
- Project structure evolves
- New patterns emerge

### Section Priority

Always include:
1. Project Overview
2. Tech Stack
3. Commands
4. Session Protocol
5. Do NOT section

Include if applicable:
- Project Structure (after structure defined)
- Code Conventions (project-specific)
- Environment Variables

### Session Protocol

The session protocol is critical for consistent AI-assisted development. Include:
- Clear start/stop procedures
- Single-task focus
- Approval gates
- Error handling
```
