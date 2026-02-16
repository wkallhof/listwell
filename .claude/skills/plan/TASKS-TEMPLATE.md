# Tasks Template

Use this template when generating `docs/tasks.md` from the plan.

---

```markdown
# Implementation Tasks

> Generated from docs/plan.md on {DATE}
>
> **Instructions for Claude:** Complete tasks sequentially within each phase.
> Mark each task complete immediately after implementation.
> Run tests after each task. Commit after each working change.
> **All code must have tests with ≥80% coverage on affected files.**
>
> **UI Tasks:** Any task involving frontend components or pages should reference
> `docs/screens.md` for layout/component specs and `docs/design-system.md` for
> tokens, colors, typography, and component patterns. Use the `/frontend-dev` skill.

## Parallel Execution Waves

> Feature groups organized by dependency graph. Each wave's features can be built
> concurrently using git worktrees and separate Claude Code instances.
> Wave N+1 depends on Wave N being complete.

### Wave 1: {Foundation}

- **Phase 0**: {Project Foundation} — must complete before all other work

### Wave 2: {Independent feature groups after foundation}

- **Phase {N}**: {Feature Group A}
- **Phase {M}**: {Feature Group B}
- **Phase {P}**: {Feature Group C}

### Wave 3: {Features depending on Wave 2}

- **Phase {X}**: {Feature Group D} _(depends on Phase {N})_
- **Phase {Y}**: {Feature Group E} _(depends on Phase {M})_

{Continue waves as needed...}

---

## Progress Summary

- Phase 0: [ ] Not Started / [~] In Progress / [x] Complete
- Phase 1: [ ] Not Started
- Phase 2: [ ] Not Started
  {Continue for all phases...}
- **MVP Status:** Not Started

---

## Phase 0: Project Foundation

### 0.0 Pre-flight

- [ ] 0.0.1: Read CLAUDE.md and confirm understanding of project conventions
- [ ] 0.0.2: Verify no uncommitted changes in working directory

### 0.1 Project Initialization

- [ ] 0.1.1: Initialize project with framework from PRD
  - Files: package.json, {config files per framework}
  - Test: Project created with expected structure
- [ ] 0.1.2: Configure language/type system per PRD
  - Files: {language config file}
  - Test: Type checker passes
- [ ] 0.1.3: Set up linter with framework-recommended rules
  - Files: {linter config}, package.json
  - Test: Linter passes
- [ ] 0.1.4: Set up code formatter
  - Files: {formatter config}, package.json
  - Test: Formatter works
- [ ] 0.1.5: Configure test framework per PRD
  - Files: {test config}, package.json
  - Test: Test runner executes (0 tests OK)

### 0.2 Project Structure

- [ ] 0.2.1: Create folder structure per PRD
  - Folders: {directories per PRD project structure}
- [ ] 0.2.2: Create placeholder index files for main modules
  - Files: {module entry points}
- [ ] 0.2.3: Verify build succeeds
- [ ] 0.2.4: Verify dev server starts without errors
- [ ] 0.2.5: Verify test runner executes successfully

### 0.3 Data Layer Setup (if applicable per PRD)

- [ ] 0.3.1: Install ORM/database tooling per PRD
  - Files: package.json
- [ ] 0.3.2: Configure database connection
  - Files: {db config file}, .env.example
- [ ] 0.3.3: Create initial schema file
  - Files: {schema file path}
- [ ] 0.3.4: Set up migrations (if applicable)
  - Files: {ORM config file}
  - Test: Migration command works

### 0.4 Development Tooling

- [ ] 0.4.1: Add pre-commit hooks (husky + lint-staged)
  - Files: .husky/pre-commit, package.json
- [ ] 0.4.2: Create .env.example with required variables
  - Files: .env.example, .gitignore
- [ ] 0.4.3: Update README with setup instructions
  - Files: README.md

**Phase 0 Checkpoint:**

- [ ] Fresh clone + dependency install + dev server works
- [ ] All scripts functional: dev, build, test, lint, typecheck
- [ ] Data layer connection verified (if applicable)
- [ ] Code coverage infrastructure configured (≥80% threshold)
- [ ] Commit: "chore: complete project foundation (Phase 0)"

---

## Phase 1: {Feature Name from Plan}

### 1.1 {Sub-feature or Layer}

- [ ] 1.1.1: {Specific task - verb + noun + context}
  - Files: {paths}
  - Test: {how to verify}
- [ ] 1.1.2: {Specific task}
  - Files: {paths}
  - Test: {how to verify}
- [ ] 1.1.3: Write tests for {component/function}
  - Files: {test paths}
  - Test: Tests pass

### 1.2 {Sub-feature or Layer — UI}

- [ ] 1.2.1: {Specific UI task}
  - Files: {paths}
  - Screens: `docs/screens.md` § {Section Name} — `docs/design-system.md`
  - Test: {how to verify}
- [ ] 1.2.2: {Specific UI task}
  - Files: {paths}
  - Screens: `docs/screens.md` § {Section Name} — `docs/design-system.md`

{Continue sub-sections as needed...}

**Phase 1 Checkpoint:**

- [ ] {Concrete verification from plan}
- [ ] All tests pass with ≥80% code coverage on phase code
- [ ] No TypeScript errors
- [ ] Commit: "feat: complete {feature} (Phase 1)"

---

## Phase 2: {Feature Name from Plan}

{Continue same pattern...}

---

## Post-MVP Tasks

> Do not start these until MVP checkpoints are all verified.

### {Future Phase}: {Feature}

- [ ] {Task}

---

## Task Log

| Task  | Completed | Commit | Notes |
| ----- | --------- | ------ | ----- |
| 0.0.1 |           |        |       |
| 0.0.2 |           |        |       |
| 0.1.1 |           |        |       |

{Continue for all tasks...}
```

---

## Template Usage Notes

### Task Numbering

Format: `{Phase}.{Section}.{Task}`

Examples:

- `0.1.1` - Phase 0, Section 1, Task 1
- `1.2.3` - Phase 1, Section 2, Task 3
- `2.0.1` - Phase 2, Section 0, Task 1

### Task Format

Each task should include:

```markdown
- [ ] {N.N.N}: {Action verb} {what} {context}
  - Files: {comma-separated file paths}
  - Test: {how to verify completion}
```

**For UI tasks**, add a Screens line pointing to the relevant section in screens.md and the design system:

```markdown
- [ ] {N.N.N}: {Action verb} {UI component/page} {context}
  - Files: {comma-separated file paths}
  - Screens: `docs/screens.md` § {Section Name} — `docs/design-system.md`
  - Test: {how to verify completion}
```

### Action Verbs

Use consistent verbs:

- **Create** - New file/component
- **Add** - New functionality to existing file
- **Configure** - Set up tooling/settings
- **Implement** - Build feature logic
- **Write** - Tests or documentation
- **Update** - Modify existing code
- **Integrate** - Connect components
- **Verify** - Run checks/tests

### File References

Be specific when known:

- `src/components/Button.tsx` (good)
- `src/components/` (too vague)
- `{TBD}` (OK when location unknown)

### Test/Verification

Types of verification:

- `Test: npm run test passes`
- `Test: Component renders without errors`
- `Test: API returns expected response`
- `Test: Manual verification in browser`
- `Test: TypeScript compiles without errors`

**Coverage requirement:** Every task that adds or modifies code must include tests achieving ≥80% coverage on the affected files. Use `npm run test -- --coverage` to verify.

### Progress Summary Update

When updating docs/tasks.md during execution:

```markdown
## Progress Summary

- Phase 0: [x] Complete
- Phase 1: [~] In Progress (5/12 tasks)
- Phase 2: [ ] Not Started
- **MVP Status:** In Progress
```

### Checkpoint Tasks

Every phase ends with:

1. Verification checklist
2. All tests pass confirmation
3. Commit instruction

### Task Log Usage

Update after each task:

```markdown
| Task  | Completed  | Commit | Notes                    |
| ----- | ---------- | ------ | ------------------------ |
| 0.1.1 | 2024-01-15 | abc123 |                          |
| 0.1.2 | 2024-01-15 | abc123 | Combined with 0.1.1      |
| 0.1.3 | 2024-01-15 | def456 | Chose ESLint flat config |
```

### Blocked Tasks

When a task is blocked:

```markdown
- [ ] 1.2.1: {Task description}
  - Files: {paths}
  - **BLOCKED:** {reason}
```

### Skipped Tasks

When a task becomes unnecessary:

```markdown
- [~] 1.2.1: {Task description} - SKIPPED: {reason}
```
