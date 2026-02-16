---
description: Build React components, pages, and layouts following the project's design system conventions
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npm run lint:*), Bash(npm run typecheck:*), AskUserQuestion
---

# Frontend Development Skill

## Overview

This skill guides frontend development, ensuring all React components, pages, and layouts adhere to the project's established design system and conventions defined in the PRD and screens documents.

## When to Use

Invoke this skill when:

- Creating new React components
- Building pages or layouts
- Implementing UI features
- Styling components according to the design system
- Working with the project's UI component library
- Adding loading states, empty states, or error handling UI

## Core References

**CRITICAL:** Before writing any frontend code, read these project documents:

| Document                | Purpose                                                 |
| ----------------------- | ------------------------------------------------------- |
| `docs/design-system.md` | Colors, typography, spacing, component patterns, tokens |
| `docs/screens.md`       | Component specifications, layouts, navigation           |
| `docs/prd.md`           | Tech stack, data model, core features, API routes       |
| `src/components/ui/`    | Primitive components (don't modify these)               |

## Workflow

### Step 1: Understand the Context

1. Read `docs/design-system.md` for the project's colors, typography, spacing, and component patterns
2. Read `docs/screens.md` for the specific screen/component layout being built
3. Check the component breakdown tables in screens.md for which UI primitives to use
4. Look at existing components in `src/components/` for established patterns

### Step 2: Plan the Component

Before writing code, confirm:

- [ ] Component location (features/, shared/, or layout/)
- [ ] Props interface design
- [ ] Which UI primitives to use (from screens.md component tables)
- [ ] Loading, empty, and error states needed
- [ ] Accessibility requirements (aria labels, focus management)

### Step 3: Implementation Checklist

Apply these rules from the project's design system:

#### Colors

- **Only use colors defined in `docs/design-system.md`** - never use raw/generic color values
- Use the project's semantic tokens (e.g., `bg-primary`, `text-muted-foreground`, `border-border`)
- Use the project's custom palette colors as defined in the design system
- NEVER use generic framework colors (e.g., `bg-blue-600`, `text-gray-500`) unless they are part of the design system

#### Typography

- Use the fonts, sizes, and weights defined in `docs/design-system.md`
- Follow the type scale hierarchy from the design system
- Use semantic text tokens when available (e.g., `text-foreground`, `text-muted-foreground`)

#### Spacing

- Follow the spacing scale defined in `docs/design-system.md`
- Use consistent page padding, card padding, section gaps as defined

#### Border Radius

- Follow the border radius tokens from the design system for each component type

#### Components

- Use the UI primitives and component patterns defined in `docs/screens.md`
- Follow the component structure and composition patterns established in the codebase
- Use the project's component library (shadcn/ui, etc.) as specified in the PRD

#### States

- **Loading**: Use skeleton loaders for page loads, spinners for actions
- **Empty**: Follow the empty state pattern from the design system (icon + title + description + CTA)
- **Error**: Inline for forms, toast for operations, full-page for critical errors

#### Icons

- Use only the icon library specified in the PRD/design system
- Follow the icon sizing scale from `docs/design-system.md`
- All icon-only buttons must have an `aria-label`

#### Mobile-First (if applicable per PRD)

- Minimum touch targets: 44x44px for all interactive elements
- Design for mobile first, then enhance for larger breakpoints
- Test responsive behavior across breakpoints

#### Accessibility

- Icon-only buttons need `aria-label`
- Form fields need `htmlFor` and `aria-describedby` for errors
- Loading states need `aria-busy="true"`
- Ensure keyboard navigation works for all interactive elements
- Use proper focus management (focus rings, focus trapping in modals)

### Step 4: File Structure

Follow the component organization defined in the PRD and existing codebase. A typical structure:

```
src/components/
├── ui/                    # Primitive components (don't modify)
├── layout/                # App shell, navigation, header
├── features/              # Feature-specific components
│   └── {feature-name}/    # Grouped by feature
└── shared/                # Cross-feature components
```

Component file pattern:

```tsx
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  /** JSDoc for prop */
  label: string;
  variant?: 'default' | 'compact';
}

export function ComponentName({ label, variant = 'default' }: ComponentNameProps) {
  return (
    <div className={cn('base-classes', variant === 'compact' && 'compact-classes')}>{label}</div>
  );
}
```

### Step 5: Verification

Before marking complete:

- [ ] No raw/generic colors used - only design system tokens
- [ ] Loading states implemented for async operations
- [ ] Empty states for lists/collections
- [ ] Error states handle failures gracefully
- [ ] Keyboard navigation works
- [ ] Icon buttons have aria-labels
- [ ] Touch targets meet minimum size (if mobile)
- [ ] Mobile responsive (test across breakpoints)

## Quick Reference: Common Patterns

### Button with Loading State

```tsx
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Saving...
</Button>
```

### Form Field with Error

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" aria-describedby="email-error" />
  {error && (
    <p id="email-error" className="text-sm text-destructive">
      {error}
    </p>
  )}
</div>
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <IconComponent className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-medium mb-2">No items yet</h3>
  <p className="text-sm text-muted-foreground mb-4 max-w-sm">Description here</p>
  <Button>Add Item</Button>
</div>
```

## Do NOT

- Modify files in `src/components/ui/` (primitive components)
- Use raw/generic colors not defined in the design system
- Skip loading/error/empty states
- Create icon buttons without aria-labels
- Use more than 2 primary buttons per view
- Animate on initial page load
- Forget mobile responsive behavior (if mobile is in scope)
- Ignore the touch target minimums (44x44px)
- Hardcode values that should come from the design system
