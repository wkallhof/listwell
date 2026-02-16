# Listwell - Claude Code Instructions

## Project Overview

Listwell is a mobile-first progressive web app that turns photos of items into ready-to-post marketplace listings. Users snap photos, optionally describe items via voice or text, and an AI agent handles product identification, market pricing research, listing description writing, and photo enhancement. The output is a complete listing ready to copy into Facebook Marketplace, eBay, or Craigslist. Built as a personal tool with auth included for future multi-user expansion.

## Key Documents

| Document                                       | Purpose                                          |
| ---------------------------------------------- | ------------------------------------------------ |
| [docs/prd.md](docs/prd.md)                     | Product Requirements Document                    |
| [docs/screens.md](docs/screens.md)             | Screen specifications and component layouts       |
| [docs/design-system.md](docs/design-system.md) | Color tokens, typography, spacing, components     |
| [docs/selling-strategy.md](docs/selling-strategy.md) | Marketplace listing best practices for AI prompts |
| [docs/plan.md](docs/plan.md)                   | Technical implementation plan                    |
| [docs/tasks.md](docs/tasks.md)                 | Current task list and progress                   |

## Technology Stack

| Layer          | Technology                              | Notes                                    |
| -------------- | --------------------------------------- | ---------------------------------------- |
| Framework      | Next.js (App Router)                    | Server components by default             |
| Language       | TypeScript (strict mode)                | No `any` types                           |
| Database       | PostgreSQL (Neon prod / Docker local)   | Serverless driver for production         |
| ORM            | Drizzle ORM                             | Type-safe, zero runtime overhead         |
| Authentication | BetterAuth (email/password)             | Drizzle adapter, PostgreSQL provider     |
| UI Components  | shadcn/ui                               | Tailwind-based, accessible               |
| Styling        | Tailwind CSS                            | Design system tokens in globals.css      |
| Icons          | Lucide React                            | Default size={20}, stroke-width 2        |
| Image Storage  | Vercel Blob                             | Client uploads with presigned URLs       |
| Background Jobs| Inngest                                 | Event-driven, step functions             |
| AI Agent       | Vercel Sandbox + Claude AgentSDK        | Consolidated: image analysis + web research + listing generation in one session |
| Image Enhance  | Google Gemini API                       | Contextual photo cleanup                 |
| Voice-to-Text  | Whisper API or Deepgram (TBD)           | Mobile voice dictation                   |
| Notifications  | Web Push API + web-push                 | Service worker push notifications        |
| Dark Mode      | next-themes                             | Class strategy, system preference default|
| Toasts         | Sonner                                  | Top-center positioned                    |
| Testing        | Vitest + React Testing Library          | ≥80% coverage required                   |
| Hosting        | Vercel                                  | Production deployment                    |

## Project Structure

```
src/
├── app/
│   ├── globals.css              ← CSS variables (design system tokens)
│   ├── layout.tsx               ← ThemeProvider, fonts, metadata
│   ├── manifest.ts              ← PWA manifest
│   ├── login/
│   │   └── page.tsx             ← Login/Register screen
│   ├── (authenticated)/
│   │   ├── page.tsx             ← Listings Feed (home)
│   │   ├── new/
│   │   │   ├── page.tsx         ← Capture screen
│   │   │   ├── describe/
│   │   │   │   └── page.tsx     ← Describe screen
│   │   │   └── submitted/
│   │   │       └── page.tsx     ← Submitted confirmation
│   │   └── listings/
│   │       └── [id]/
│   │           └── page.tsx     ← Listing detail (processing/ready)
│   └── api/
│       ├── auth/[...all]/route.ts
│       ├── listings/
│       │   ├── route.ts         ← GET (list), POST (create)
│       │   └── [id]/
│       │       ├── route.ts     ← GET, PATCH, DELETE
│       │       ├── enhance/route.ts
│       │       └── images/route.ts
│       ├── inngest/route.ts
│       └── transcribe/route.ts
├── components/
│   ├── ui/                      ← shadcn/ui primitives
│   ├── listing-card.tsx
│   ├── listing-status-badge.tsx
│   ├── pipeline-steps.tsx
│   ├── image-carousel.tsx
│   ├── image-grid.tsx
│   ├── image-enhancement-sheet.tsx
│   ├── copy-button.tsx
│   ├── voice-input.tsx
│   ├── bottom-bar.tsx
│   ├── fab.tsx
│   ├── empty-state.tsx
│   ├── push-prompt.tsx
│   └── theme-provider.tsx
├── db/
│   ├── index.ts                 ← Drizzle client + Neon connection
│   └── schema.ts               ← All table definitions
├── inngest/
│   ├── client.ts                ← Inngest client
│   └── functions/
│       ├── generate-listing.ts  ← listing.generate function
│       └── enhance-image.ts     ← image.enhance function
├── lib/
│   ├── utils.ts                 ← cn() helper
│   ├── auth.ts                  ← BetterAuth server config
│   ├── auth-client.ts           ← BetterAuth client
│   ├── auth-middleware.ts       ← Route protection
│   ├── blob.ts                  ← Vercel Blob upload helpers
│   ├── notifications.ts         ← Web push helpers
│   ├── push-actions.ts          ← Push subscription server actions
│   ├── listing-actions.ts       ← Listing creation server actions
│   ├── listing-formatter.ts     ← Copy-to-clipboard formatting
│   ├── new-listing-context.tsx  ← Multi-step form state
│   └── ai/
│       ├── agent.ts             ← Vercel Sandbox + AgentSDK setup
│       ├── prompts/
│       │   └── listing-agent-prompt.ts ← Consolidated agent system prompt
│       ├── agent-output-schema.ts ← Structured output schema for agent results
│       ├── gemini.ts            ← Gemini image editing client
│       └── enhancement-prompt.ts← Gemini prompt template
└── types/
    └── index.ts                 ← Shared TypeScript types
public/
├── sw.js                        ← Service worker
├── icon-192x192.png
└── icon-512x512.png
docs/
├── prd.md
├── screens.md
├── design-system.md
├── selling-strategy.md
├── plan.md
└── tasks.md
migrations/                      ← Drizzle migration files
docker-compose.yml               ← Local PostgreSQL
drizzle.config.ts
```

## Available Commands

### Development

```bash
npm run dev        # Start Next.js dev server
npm run build      # Production build
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript compiler check
npm run format     # Run Prettier
```

### Testing

```bash
npm run test              # Run all tests
npm run test -- --coverage # Run with coverage report
```

### Database

```bash
docker compose up -d              # Start local PostgreSQL
npx drizzle-kit push              # Push schema to database
npx drizzle-kit generate          # Generate migration files
npx drizzle-kit migrate           # Run migrations
npx drizzle-kit studio            # Open Drizzle Studio
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

1. **Mobile-first, always.** Every layout starts at 375px. Max-width is `max-w-xl` (576px) centered. No desktop redesign.
2. **Content is the UI.** User photos and generated listings are the visual stars. Chrome stays minimal.
3. **One action per screen.** Each screen has a single primary action. Secondary actions are visually subordinate.
4. **Progress over perfection.** Show momentum with pipeline steps, status badges, and loading states.

## Code Conventions

### General

- Use ES modules (import/export), not CommonJS
- Prefer named exports over default exports
- Use early returns to reduce nesting
- Maximum file length: 300 lines (split if larger)

### TypeScript

- Strict mode enabled — no `any` types
- Define interfaces for all props and function parameters
- Use `type` for unions/intersections, `interface` for object shapes
- Prefer `unknown` over `any` when type is truly unknown

### React / Next.js

- Functional components only
- Props interface named `{Component}Props`
- Use server components by default (App Router)
- Only use `"use client"` when interactivity is required (forms, state, event handlers)
- Colocate component, styles, and tests when possible

### UI / Styling

- All colors via CSS variables (never hardcoded hex/hsl in components)
- Reference `docs/design-system.md` for all tokens
- Reference `docs/screens.md` for component layouts
- All interactive elements: minimum 44x44px tap targets
- Safe area insets: `pb-safe` on all pages
- Page container: `mx-auto max-w-xl w-full px-5`

### Testing

- **Minimum 80% code coverage on all files** — enforced per task on affected files
- Test file naming: `{name}.test.ts` or `{name}.test.tsx`
- Each function/component should have at least one test
- Use descriptive test names: "should {behavior} when {condition}"
- Prefer integration tests over unit tests for UI
- Run `npm run test -- --coverage` to verify coverage thresholds

### Git

- Commit after each completed task
- Commit message format: `type(scope): description`
- Types: feat, fix, refactor, test, docs, chore
- Include task number in commit: `feat(auth): implement login form (1.1.6)`

## Current Focus

See [docs/tasks.md](docs/tasks.md) for current implementation status.

**Current Phase:** Phase 0
**MVP Status:** Not Started

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
- Hardcode colors — use CSS variables
- Use default exports — use named exports

## Environment Variables

Required variables (see .env.example):

```
DATABASE_URL=                    # PostgreSQL connection string
NEXT_PUBLIC_APP_URL=             # App URL (http://localhost:3000 for dev)
BETTER_AUTH_SECRET=              # BetterAuth secret key
VERCEL_BLOB_READ_WRITE_TOKEN=   # Vercel Blob storage token
INNGEST_EVENT_KEY=               # Inngest event key
INNGEST_SIGNING_KEY=             # Inngest signing key
ANTHROPIC_API_KEY=               # Claude API key
GEMINI_API_KEY=                  # Google Gemini API key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=    # Web push VAPID public key
VAPID_PRIVATE_KEY=               # Web push VAPID private key
```

## Troubleshooting

### Database connection fails

- Ensure Docker is running: `docker compose up -d`
- Check DATABASE_URL in .env.local
- For Neon: ensure connection string includes `?sslmode=require`

### Tests fail on fresh clone

- Run `npm install`
- Run `docker compose up -d`
- Run `npx drizzle-kit push`
- Check .env.local has all required variables

### TypeScript errors

- Run `npm run typecheck` for details
- Ensure strict mode is respected
- Check that all imports resolve correctly
