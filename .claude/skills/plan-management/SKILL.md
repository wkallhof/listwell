---
description: Generate technical implementation plan and task list from PRD and screens documents
---

# Plan Management Skill

## Overview

This skill generates a technical implementation plan and granular task list from the PRD and screens documents. It bridges the gap between requirements documentation and actual development work.

## Purpose

Transform product requirements into:

1. **Technical Plan** (`docs/plan.md`) - High-level implementation approach with phases
2. **Task List** (`docs/tasks.md`) - Granular, executable tasks with checkboxes
3. **Project Context** (`CLAUDE.md`) - Updated persistent context for all sessions

## When to Use

- After PRD is substantially complete
- Before starting any implementation work
- When requirements change significantly (use `/plan refresh`)

## Workflow Modes

### Mode 1: Initial Planning (`/plan`)

Full plan generation from scratch:

1. **Gather Requirements**
   - Read `docs/prd.md` completely - contains all technical decisions
   - Read `docs/screens.md` for UI/UX specifications
   - Read `docs/design-system.md` for design tokens, typography, color system, and component patterns
   - Identify tech stack, phases, and constraints

2. **Research Library Documentation**
   - For each technology in the stack, fetch current documentation:
     - Use `mcp__context7__resolve-library-id` to find Context7 library IDs
     - Use `mcp__context7__query-docs` to fetch setup guides and best practices
     - Use `WebSearch` as fallback for libraries not in Context7
   - Focus on: framework setup, configuration patterns, integration approaches
   - Note any version-specific considerations or breaking changes

3. **Generate Plan**
   - Create `docs/plan.md` using PLAN-TEMPLATE.md
   - Define phases aligned with PRD development phases
   - Mark MVP boundary clearly
   - List external dependencies
   - Incorporate best practices discovered during documentation research

4. **User Approval**
   - Present plan summary
   - Wait for explicit approval before proceeding
   - Allow user to request changes

5. **Generate Tasks**
   - Create `docs/tasks.md` using TASKS-TEMPLATE.md
   - Break each phase into 10-15 minute tasks
   - Include file references and verification steps
   - Add phase checkpoints
   - **Generate Parallel Execution Waves** — analyze feature group dependencies and group phases/features into waves that can be built concurrently across git worktrees with separate Claude Code instances
   - For UI tasks, annotate with references to `docs/screens.md` and `docs/design-system.md`

6. **Update Context**
   - Update `CLAUDE.md` with project conventions
   - Include tech stack, structure, and session protocol

7. **Report Summary**
   - Total phases and tasks
   - MVP scope
   - Estimated task count per phase

### Mode 2: Refresh Planning (`/plan refresh`)

Update existing plan while preserving progress:

1. **Read Current State**
   - Parse `docs/plan.md` for phases and structure
   - Parse `docs/tasks.md` for completion status
   - Identify completed vs pending tasks

2. **Detect Changes**
   - Compare PRD/screens to existing plan
   - Note new requirements or decisions
   - Identify obsolete tasks

3. **Update Documents**
   - Preserve all completed tasks (checked items)
   - Regenerate incomplete tasks if requirements changed
   - Add new phases/tasks as needed
   - Remove obsolete uncompleted tasks

4. **Update Context**
   - Refresh `CLAUDE.md` if conventions changed

## Input Requirements

### Required Files

| File                    | Purpose                                               |
| ----------------------- | ----------------------------------------------------- |
| `docs/prd.md`           | Product requirements and technical stack              |
| `docs/screens.md`       | UI/UX specifications and screen flows                 |
| `docs/design-system.md` | Design tokens, colors, typography, component patterns |

### Optional Files (for refresh)

| File            | Purpose                      |
| --------------- | ---------------------------- |
| `docs/plan.md`  | Existing plan to update      |
| `docs/tasks.md` | Existing tasks with progress |

## Output Files

### docs/plan.md

**Location:** docs/ folder
**Purpose:** Technical approach bridging requirements to implementation

Key sections:

- Overview and architecture summary
- Implementation phases with dependencies
- MVP boundary definition
- External dependencies
- Open questions

### docs/tasks.md

**Location:** docs/ folder
**Purpose:** Granular, executable task list with checkboxes

Key sections:

- Progress summary by phase
- Phase-grouped tasks with numbering
- File references for each task
- Verification steps
- Phase checkpoints
- Task log for tracking

### CLAUDE.md

**Location:** Project root
**Purpose:** Persistent context for all Claude Code sessions

Key sections:

- Project overview
- Tech stack
- Project structure
- Commands and conventions
- Session protocol

## Task Granularity Guidelines

### Good Task Size (10-15 minutes)

- "Create user model with ORM schema"
- "Add authentication API route"
- "Write unit tests for data service layer"

### Too Large (break down further)

- "Implement the entire auth feature"
- "Build the dashboard system"
- "Set up the database"

### Too Small (combine with related work)

- "Add a single import statement"
- "Fix a typo"
- "Change a variable name"

## Phase Structure

### Phase 0: Project Foundation (Always First)

Every plan starts with Phase 0 covering:

- Project initialization
- TypeScript/tooling configuration
- Folder structure creation
- Basic scripts verification

### Subsequent Phases

Align with PRD development phases:

- Phase 1: MVP core features
- Phase 2+: Post-MVP features

### MVP Boundary

Always explicitly mark:

- Which phases are MVP
- Which are post-MVP
- Concrete acceptance criteria for MVP completion (from PRD)

## Constraints

1. **No Code Writing** - This skill generates plans only, not implementation
2. **Task Time Limit** - Each task should be completable in 10-15 minutes
3. **File References** - Tasks must reference affected files when known
4. **Sequential Within Phase** - Tasks within a phase should be sequential
5. **Phase Dependencies** - Later phases can depend on earlier ones
6. **Test Coverage** - Every task that produces code must include tests achieving ≥80% coverage on affected files. Plan tasks accordingly (include test-writing steps within each feature task, not as separate test-only phases)

## Integration with /execute

The tasks generated by `/plan` are designed to be executed with the `/execute` skill:

- Task numbering enables precise targeting (e.g., `/execute 0.1.1`)
- Phase checkpoints provide natural stopping points
- File references guide implementation
- Verification steps confirm completion

## Templates

Use these templates when generating output:

- Plan structure: `PLAN-TEMPLATE.md`
- Tasks structure: `TASKS-TEMPLATE.md`
- CLAUDE.md structure: `CLAUDE-TEMPLATE.md`
