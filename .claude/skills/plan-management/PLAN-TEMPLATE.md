# Plan Template

Use this template when generating `docs/plan.md` from PRD and screens documents.

---

```markdown
# Technical Implementation Plan

> Generated from docs/prd.md, docs/screens.md, and docs/design-system.md on {DATE}
> Last updated: {DATE}

## Overview

{2-3 sentence summary of what we're building and the core technical approach. Reference the PRD's project description and key design principles.}

## Architecture Summary

{Brief description of the system architecture based on the tech stack defined in the PRD.}

### Key Components

| Component | Responsibility | Key Technologies |
| --------- | -------------- | ---------------- |
| {Name}    | {What it does} | {Stack from PRD} |
| {Name}    | {What it does} | {Stack from PRD} |
| {Name}    | {What it does} | {Stack from PRD} |

### Data Flow

{Describe how data moves through the system. Can be prose or simple notation like:}
```

User → {Frontend} → {API Layer} → {Services} → {Data Store}

```

## Implementation Phases

### Phase 0: Project Foundation

**Goal:** Runnable project skeleton with dev tooling

- Initialize project with framework from PRD
- Configure language/type system
- Set up linter and formatter
- Configure test framework
- Create folder structure per PRD
- Set up data layer (database/ORM/API connections as needed)
- Verify: dev server, tests, and build all work

### Phase 1: {Core Feature Name - from PRD}

**Goal:** {What this phase achieves - align with PRD MVP scope}
**Depends on:** Phase 0

- {High-level work item from PRD}
- {High-level work item from PRD}
- {High-level work item from PRD}
- Verify: {How we know this phase is complete - concrete criteria}

### Phase 2: {Feature Name}

**Goal:** {What this phase achieves}
**Depends on:** Phase {N}

- {High-level work item}
- {High-level work item}
- Verify: {Concrete completion criteria}

{Continue phases as needed...}

---

## MVP Boundary

**MVP includes:** Phases 0-{X}
**Post-MVP:** Phases {X+1}+

**MVP is complete when:**

- [ ] {Concrete acceptance criterion from PRD}
- [ ] {Concrete acceptance criterion from PRD}
- [ ] {Concrete acceptance criterion from PRD}
- [ ] All Phase 0-{X} checkpoints pass
- [ ] Application can be deployed and used for core workflows

## External Dependencies

| Dependency | Purpose          | Version   | Documentation |
| ---------- | ---------------- | --------- | ------------- |
| {Package}  | {Why we need it} | {Version} | {Link}        |
| {Service}  | {Why we need it} | -         | {Link}        |

## Open Questions

{List any unresolved decisions that may affect implementation.}

- [ ] {Question that needs resolution}
- [ ] {Question that needs resolution}

## Technology References

{Link to key technologies from the PRD stack.}

| Technology | Purpose | Documentation |
| ---------- | ------- | ------------- |
| {Framework} | {Purpose} | {Link} |
| {Library}   | {Purpose} | {Link} |
{Continue for each technology in the PRD stack...}

## Parallel Execution Waves

> Phases grouped by dependency graph for concurrent development using git worktrees
> and multiple Claude Code instances. Wave N+1 depends on Wave N being complete.

| Wave | Phases | Feature Groups |
| ---- | ------ | -------------- |
| 1    | 0      | Project Foundation |
| 2    | {N}, {M}, {P} | {Feature A}, {Feature B}, {Feature C} |
| 3    | {X}, {Y} | {Feature D}, {Feature E} |
{Continue as needed...}

## Notes for Implementation

{Any additional context that will help during implementation. Include:}

- Key design principles to follow (reference `docs/design-system.md` for UI work)
- Known constraints or limitations
- Integration points to be careful about
- Performance considerations
```

---

## Template Usage Notes

### Phase Alignment

Map phases to PRD development phases:

| PRD Phase     | Plan Phases | Scope                      |
| ------------- | ----------- | -------------------------- |
| Phase 1 (MVP) | 0-N         | Foundation + core features |
| Phase 2       | N+1-M       | Extended features          |
| Phase 3+      | M+1-P       | Advanced features          |

### MVP Boundary

The MVP boundary should:

- Align with PRD Phase 1 requirements
- Include all "must have" features
- Exclude "nice to have" features
- Be achievable with the defined tech stack

### External Dependencies

Include:

- npm/pip/cargo packages beyond the core framework
- Database systems
- External services (APIs, cloud services)
- Development tools (Docker, etc.)

### Open Questions

Add items here when:

- PRD has ambiguous requirements
- Technical decisions need user input
- Integration details are unclear

### Verification Criteria

Each phase verification should be:

- Concrete and testable
- Not dependent on subjective judgment
- Runnable as a checklist
