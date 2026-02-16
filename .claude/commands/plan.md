---
description: Generate technical implementation plan and task list from PRD and screens documents
argument-hint: [refresh]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(ls:*), Bash(mkdir:*), AskUserQuestion, mcp__context7__resolve-library-id, mcp__context7__query-docs, WebSearch
---

# Plan Management Command

Generate a technical implementation plan and granular task list from the PRD and screens documents, preparing the project for incremental AI-assisted development.

## Usage

| Command         | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| `/plan`         | Generate docs/plan.md and docs/tasks.md from PRD and screens |
| `/plan refresh` | Update existing plan/tasks, preserving completed items       |

## Examples

```
/plan           # Initial planning - generate docs/plan.md and docs/tasks.md
/plan refresh   # Update after PRD changes, keep completed tasks
```

## Workflow

### Initial Run (`/plan`)

1. Read `docs/prd.md` completely - contains all technical decisions and requirements
2. Read `docs/screens.md` for UI/UX specifications and information architecture
3. Read `docs/design-system.md` for design tokens, color system, typography, spacing, and component patterns
4. **Research library documentation** for all key technologies in the stack:
   - Use `mcp__context7__resolve-library-id` to find library IDs
   - Use `mcp__context7__query-docs` to fetch current best practices and setup guides
   - Use `WebSearch` as fallback for libraries not in Context7
   - Focus on: framework setup, configuration patterns, integration approaches
5. Generate `docs/plan.md` following the plan template (incorporate library best practices)
6. Wait for user approval of plan
7. After approval, generate `docs/tasks.md` following the tasks template — **include Parallel Execution Waves section** analyzing feature group dependencies for concurrent agent execution
8. Update `CLAUDE.md` with project context
9. Report summary of phases, task count, and wave breakdown

### Refresh Run (`/plan refresh`)

1. Read current `docs/plan.md` and `docs/tasks.md`
2. Read `docs/prd.md`, `docs/screens.md`, and `docs/design-system.md` for any updates
3. Preserve completed tasks (checked items)
4. Regenerate incomplete tasks if requirements changed
5. Recalculate Parallel Execution Waves based on updated dependencies
6. Update `CLAUDE.md` if stack or conventions changed

## Output Files

| File            | Location     | Purpose                                                    |
| --------------- | ------------ | ---------------------------------------------------------- |
| `docs/plan.md`  | docs/ folder | Technical approach bridging requirements to implementation |
| `docs/tasks.md` | docs/ folder | Granular, executable task list with checkboxes             |
| `CLAUDE.md`     | Project root | Persistent context for all Claude Code sessions            |

## Constraints

- Do not write any application code during planning
- Each task must be completable in 10-15 minutes
- Tasks must reference affected files when known
- Phase 0 always covers project scaffolding
- MVP boundary must be explicitly marked

## Key Files

- **Skill definition**: `.claude/skills/plan-management/SKILL.md`
- **Plan template**: `.claude/skills/plan-management/PLAN-TEMPLATE.md`
- **Tasks template**: `.claude/skills/plan-management/TASKS-TEMPLATE.md`
- **CLAUDE.md template**: `.claude/skills/plan-management/CLAUDE-TEMPLATE.md`
- **PRD**: `docs/prd.md`
- **Screens**: `docs/screens.md`
- **Design System**: `docs/design-system.md`
