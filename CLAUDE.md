# Listwell - Claude Code Instructions

## Project Overview

Listwell is a mobile-first progressive web app that turns photos of items into ready-to-post marketplace listings. Users snap photos, optionally describe items via voice or text, and an AI agent handles product identification, market pricing research, listing description writing, and photo enhancement. The output is a complete listing ready to copy into Facebook Marketplace, eBay, or Craigslist. Built as a personal tool with auth included for future multi-user expansion.

## Architecture

Turborepo + pnpm monorepo with two apps and two shared packages:

- **`apps/web`** — Next.js frontend (App Router). No server-side business logic. Calls the Hono API via Next.js rewrites proxy (`/api/*` → API server). Server components use `apiFetch()` to forward cookies.
- **`apps/api`** — Hono REST API (`@hono/node-server`). All business logic: auth, CRUD, AI agent, image enhancement, Inngest jobs, push notifications. Runs on port 4000.
- **`packages/shared`** — Types (`AgentLogEntry`), Zod schemas (`listingAgentOutputSchema`), and utilities (`formatListingForClipboard`). Consumed as TS source (no build step).
- **`packages/db`** — Drizzle schema, client factory, and migrations. Uses `DB_DRIVER=neon` for production Neon driver, `postgres` for local dev.

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
| Monorepo       | Turborepo + pnpm                        | Workspace packages, parallel tasks       |
| Web Framework  | Next.js (App Router)                    | Frontend-only, proxies API via rewrites  |
| API Framework  | Hono + @hono/node-server                | Standalone REST API on port 4000         |
| Language       | TypeScript (strict mode)                | No `any` types                           |
| Database       | PostgreSQL (Neon prod / Docker local)   | Serverless driver for production         |
| ORM            | Drizzle ORM                             | Type-safe, zero runtime overhead         |
| Authentication | BetterAuth (email/password)             | Bearer plugin (API), cookies (web proxy) |
| UI Components  | shadcn/ui                               | Tailwind-based, accessible               |
| Styling        | Tailwind CSS                            | Design system tokens in globals.css      |
| Icons          | Lucide React                            | Default size={20}, stroke-width 2        |
| Image Storage  | Vercel Blob / Cloudflare R2             | Swappable via STORAGE_PROVIDER env var   |
| Background Jobs| Inngest                                 | Event-driven, step functions (in API)    |
| AI Agent       | Vercel Sandbox + Claude AgentSDK        | Consolidated: image analysis + web research + listing generation in one session |
| Image Enhance  | Google Gemini API                       | Contextual photo cleanup                 |
| Voice-to-Text  | Whisper API or Deepgram (TBD)           | Mobile voice dictation                   |
| Notifications  | Web Push API + web-push                 | Service worker push notifications        |
| Dark Mode      | next-themes                             | Class strategy, system preference default|
| Toasts         | Sonner                                  | Top-center positioned                    |
| Testing        | Vitest + React Testing Library          | ≥80% coverage required                   |
| Hosting        | Vercel (web) + Railway/Node (API)       | Separate deployments                     |

## Project Structure

```
listwell/
├── apps/
│   ├── web/                         ← Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── globals.css
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── manifest.ts
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── (authenticated)/
│   │   │   │       ├── page.tsx             ← Feed (uses apiFetch)
│   │   │   │       ├── new/page.tsx         ← Capture
│   │   │   │       ├── new/describe/page.tsx← Describe + submit
│   │   │   │       └── listings/[id]/page.tsx ← Detail (client fetch)
│   │   │   ├── components/
│   │   │   │   ├── ui/              ← shadcn/ui primitives
│   │   │   │   └── *.tsx            ← App components
│   │   │   └── lib/
│   │   │       ├── api.ts           ← apiFetch() for server components
│   │   │       ├── auth-client.ts   ← BetterAuth client
│   │   │       ├── auth-middleware.ts← Route protection middleware
│   │   │       ├── upload-client.ts ← Presigned URL upload
│   │   │       ├── new-listing-context.tsx
│   │   │       └── utils.ts
│   │   ├── public/
│   │   ├── next.config.ts           ← API rewrites proxy
│   │   ├── vitest.config.ts
│   │   └── package.json
│   │
│   └── api/                         ← Hono REST API
│       └── src/
│           ├── index.ts             ← Hono app + node-server (port 4000)
│           ├── auth.ts              ← BetterAuth config (bearer plugin)
│           ├── middleware/auth.ts    ← Session injection middleware
│           ├── routes/
│           │   ├── auth.ts          ← BetterAuth handler mount
│           │   ├── health.ts        ← GET /health
│           │   ├── listings.ts      ← GET/POST /listings
│           │   ├── listing-detail.ts← GET/PATCH/DELETE /listings/:id
│           │   ├── listing-images.ts← DELETE /listings/:id/images
│           │   ├── listing-enhance.ts← POST /listings/:id/enhance
│           │   ├── upload.ts        ← POST /upload/presign
│           │   ├── transcribe.ts    ← POST /transcribe
│           │   └── push.ts          ← POST/DELETE /push/subscribe
│           ├── inngest/
│           │   ├── client.ts
│           │   ├── handler.ts       ← serve() with inngest/hono
│           │   └── functions/
│           └── lib/
│               ├── blob.ts
│               ├── notifications.ts
│               └── ai/
│
├── packages/
│   ├── shared/                      ← Types, schemas, utilities
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts             ← AgentLogEntry
│   │       ├── listing-formatter.ts
│   │       └── schemas/
│   │           └── agent-output.ts  ← Zod schema + type
│   │
│   └── db/                          ← Drizzle schema + client
│       ├── src/
│       │   ├── index.ts             ← DB client factory
│       │   └── schema.ts            ← All table definitions
│       ├── drizzle.config.ts
│       └── migrations/
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── docker-compose.yml
├── docs/
└── CLAUDE.md
```

## Available Commands

### Development

```bash
pnpm dev              # Start both web (3000) and API (4000) via Turborepo
pnpm inngest:dev      # Start Inngest dev server pointing at API
pnpm build            # Production build (all apps)
pnpm lint             # Run ESLint (all apps)
pnpm typecheck        # Run TypeScript compiler check (all apps)
pnpm format           # Run Prettier
```

### Testing

```bash
pnpm test                                    # Run all tests (all apps)
pnpm --filter @listwell/web test             # Run web tests only
pnpm --filter @listwell/api test             # Run API tests only
pnpm --filter @listwell/web test -- --coverage # Web tests with coverage
```

### Database

```bash
docker compose up -d                                         # Start local PostgreSQL
pnpm --filter @listwell/db exec drizzle-kit push             # Push schema to database
pnpm --filter @listwell/db exec drizzle-kit generate         # Generate migration files
pnpm --filter @listwell/db exec drizzle-kit migrate          # Run migrations
pnpm --filter @listwell/db exec drizzle-kit studio           # Open Drizzle Studio
```

### Per-app Commands

```bash
pnpm --filter @listwell/web dev       # Start Next.js dev server only
pnpm --filter @listwell/api dev       # Start Hono API dev server only
pnpm --filter @listwell/web build     # Build web app only
pnpm --filter @listwell/api build     # Build API app only
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

### React / Next.js (apps/web)

- Functional components only
- Props interface named `{Component}Props`
- Server components use `apiFetch()` from `@/lib/api` for data fetching
- Client components use `fetch("/api/...")` (proxied to Hono API)
- Only use `"use client"` when interactivity is required
- No server actions — all mutations go through the API

### Hono API (apps/api)

- Routes use `requireAuth` middleware for protected endpoints
- Access authenticated user via `c.get("user")`
- Return JSON responses with `c.json(data, statusCode)`
- All business logic lives in the API, not in the web app

### Shared Packages

- `@listwell/shared` — import types, schemas, utilities
- `@listwell/db` — import DB client and schema (API only)
- Packages consumed as TS source (no build step, workspace resolution)

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
- Run `pnpm --filter @listwell/web test -- --coverage` to verify coverage thresholds

### Git

- Commit after each completed task
- Commit message format: `type(scope): description`
- Types: feat, fix, refactor, test, docs, chore
- Include task number in commit: `feat(auth): implement login form (1.1.6)`

## Current Focus

See [docs/tasks.md](docs/tasks.md) for current implementation status.

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
3. Run `pnpm test` and `pnpm typecheck`
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

### Web App (`apps/web/.env.local`)

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:4000           # Hono API URL for rewrites proxy
BETTER_AUTH_SECRET=                     # BetterAuth secret key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=           # Web push VAPID public key
```

### API App (`apps/api/.env` or environment)

```
DATABASE_URL=                           # PostgreSQL connection string
DB_DRIVER=                              # "neon" for production, omit for local
BETTER_AUTH_SECRET=                     # BetterAuth secret key (same as web)
WEB_URL=http://localhost:3000           # Web app URL for CORS + notifications
STORAGE_PROVIDER=                       # "vercel-blob" or "r2"
VERCEL_BLOB_READ_WRITE_TOKEN=           # (when using vercel-blob)
CLOUDFLARE_ACCOUNT_ID=                  # (when using r2)
R2_ACCESS_KEY_ID=                       # (when using r2)
R2_SECRET_ACCESS_KEY=                   # (when using r2)
R2_BUCKET_NAME=                         # (when using r2)
R2_PUBLIC_URL=                          # (when using r2)
INNGEST_EVENT_KEY=                      # Inngest event key
INNGEST_SIGNING_KEY=                    # Inngest signing key
ANTHROPIC_API_KEY=                      # Claude API key
GEMINI_API_KEY=                         # Google Gemini API key
VAPID_PRIVATE_KEY=                      # Web push VAPID private key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=           # Web push VAPID public key
```

## Troubleshooting

### Database connection fails

- Ensure Docker is running: `docker compose up -d`
- Check DATABASE_URL in API env
- Local PostgreSQL runs on port 5433 (not 5432)
- For Neon: ensure connection string includes `?sslmode=require`

### Tests fail on fresh clone

- Run `pnpm install`
- Run `docker compose up -d`
- Run `pnpm --filter @listwell/db exec drizzle-kit push`
- Check env files have all required variables

### TypeScript errors

- Run `pnpm typecheck` for details
- Clean `.next` cache if stale references: `rm -rf apps/web/.next`
- Ensure strict mode is respected
- Check that all imports resolve correctly

### API not responding

- Ensure API is running: `pnpm --filter @listwell/api dev`
- Check `API_URL` in `apps/web/.env.local` points to `http://localhost:4000`
- Verify CORS config in API allows web origin
