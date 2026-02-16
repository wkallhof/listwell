---
description: Build React components, pages, and layouts following the project's design system conventions
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run lint:*), Bash(npm run typecheck:*), AskUserQuestion
---

# Frontend Development Command

Build React components, pages, and layouts following the project's established design system.

## Usage

```
/frontend-dev                    # Start guided component development
/frontend-dev ComponentName      # Create a specific component
/frontend-dev page /route-name   # Create a page component
```

## Workflow

1. **Read Design System**: Start by reading `docs/design-system.md` for colors, typography, spacing, component patterns
2. **Read Screens Spec**: Check `docs/screens.md` for component specifications and layouts
3. **Read PRD**: Check `docs/prd.md` for tech stack, data model, and feature requirements
4. **Check Existing Patterns**: Look at similar components in the existing codebase
5. **Plan Component**: Confirm location, props, states needed
6. **Implement**: Follow design system guidelines strictly
7. **Verify**: Run lint and typecheck, test responsiveness

## Key Files

- **Design System**: `docs/design-system.md` - Colors, typography, spacing, component patterns
- **Screens Spec**: `docs/screens.md` - Component breakdowns and layouts
- **PRD (Tech Stack)**: `docs/prd.md` - Data model, core features, API routes
- **Skill Definition**: `.claude/skills/frontend-dev/SKILL.md`

## Rules

- **Design System is the Source of Truth**: All colors, typography, spacing, and component patterns come from `docs/design-system.md` - never hardcode values not defined there
- **Screens Spec Defines Layout**: Follow `docs/screens.md` for component structure, page layouts, and navigation flows
- **PRD Defines Tech Stack**: Use only the framework, styling, and icon libraries specified in `docs/prd.md`
- **States**: Always implement loading, empty, and error states for dynamic content
- **Touch Targets**: Minimum 44x44px for all interactive elements (if mobile is in scope per PRD)
- **Accessibility**: Icon buttons need `aria-label`, form fields need proper labeling
- **Mobile-First**: If PRD targets mobile, design for mobile first and enhance for larger screens
- **No Raw Colors**: Never use generic color values - always use the project's design tokens

See `.claude/skills/frontend-dev/SKILL.md` for complete guidelines.
