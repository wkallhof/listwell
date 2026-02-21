# Listwell

A mobile-first progressive web app that turns photos of items into ready-to-post marketplace listings. Snap photos, optionally describe the item via voice or text, and an AI agent handles product identification, market pricing research, listing description writing, and photo enhancement. The output is a complete listing ready to copy into Facebook Marketplace, eBay, Craigslist, or wherever you sell.

## How It Works

1. **Capture photos** of the item from different angles (1-5 photos)
2. **Optionally describe it** via voice dictation or text
3. **Tap "Generate"** and return to your feed
4. **AI agent works in the background** (30-90 seconds) — analyzing images, researching pricing, writing the listing, enhancing photos
5. **Get notified** when the listing is ready
6. **Review and copy** the complete listing into your marketplace of choice

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | [Turborepo](https://turbo.build) + [pnpm](https://pnpm.io) |
| Web | Next.js 16 (App Router) |
| API | [Hono](https://hono.dev) + @hono/node-server |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL ([Neon](https://neon.tech) prod / Docker local) |
| ORM | [Drizzle](https://orm.drizzle.team) |
| Auth | [BetterAuth](https://www.better-auth.com) (email/password + bearer) |
| UI | [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS v4 |
| Image Storage | Cloudflare R2 / Vercel Blob |
| Background Jobs | [Inngest](https://www.inngest.com) |
| AI Agent | Vercel Sandbox + Claude AgentSDK |
| Image Enhancement | Google Gemini API |
| Notifications | Web Push API |
| Testing | Vitest + React Testing Library |

## Architecture

```
listwell/
├── apps/
│   ├── web/          ← Next.js frontend (proxies /api/* to Hono)
│   └── api/          ← Hono REST API (auth, CRUD, AI, jobs)
├── packages/
│   ├── shared/       ← Types, Zod schemas, utilities
│   └── db/           ← Drizzle schema, client, migrations
├── turbo.json
├── pnpm-workspace.yaml
└── docker-compose.yml
```

- **`apps/web`** — Frontend only. Server components fetch data via `apiFetch()` which forwards cookies through a Next.js rewrites proxy. Client components use `fetch("/api/...")` directly.
- **`apps/api`** — All business logic: authentication, CRUD, AI agent orchestration, image enhancement, Inngest background jobs, push notifications. Runs on port 4000.
- **`packages/shared`** — Shared TypeScript types, Zod validation schemas, and utility functions consumed as TS source by both apps.
- **`packages/db`** — Drizzle ORM schema, database client factory, and migrations. Used by the API app.

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) 10+
- Docker (for local PostgreSQL)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/listwell.git
cd listwell

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with your web values
# Set up apps/api/.env with API values (see Environment Variables below)

# Start local PostgreSQL
docker compose up -d

# Push the database schema
pnpm --filter @listwell/db exec drizzle-kit push

# Start both dev servers
pnpm dev
```

The web app will be at [http://localhost:3000](http://localhost:3000) and the API at [http://localhost:4000](http://localhost:4000).

### Environment Variables

#### Web App (`apps/web/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | App URL (`http://localhost:3000` for dev) |
| `API_URL` | Hono API URL (`http://localhost:4000` for dev) |
| `BETTER_AUTH_SECRET` | Secret key for BetterAuth session encryption |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push VAPID public key |

#### API App (`apps/api/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (local: `postgresql://listwell:listwell@localhost:5433/listwell`) |
| `DB_DRIVER` | Set to `neon` for production Neon driver, omit for local |
| `BETTER_AUTH_SECRET` | Secret key for BetterAuth (same as web) |
| `WEB_URL` | Web app URL (`http://localhost:3000` for dev) |
| `STORAGE_PROVIDER` | `vercel-blob` or `r2` |
| `INNGEST_EVENT_KEY` | Inngest event key |
| `INNGEST_SIGNING_KEY` | Inngest signing key |
| `ANTHROPIC_API_KEY` | Claude API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push VAPID public key |
| `VAPID_PRIVATE_KEY` | Web push VAPID private key |

Storage-specific variables (R2 or Vercel Blob) are also required depending on `STORAGE_PROVIDER`.

## Development

```bash
pnpm dev              # Start web (3000) + API (4000) concurrently
pnpm build            # Production build (all apps)
pnpm lint             # ESLint (all apps)
pnpm typecheck        # TypeScript compiler check (all apps)
pnpm format           # Prettier
pnpm inngest:dev      # Start Inngest dev server
```

### Testing

```bash
pnpm test                                      # Run all tests
pnpm --filter @listwell/web test               # Web tests only
pnpm --filter @listwell/api test               # API tests only
pnpm --filter @listwell/web test -- --coverage  # Web tests with coverage
```

### Database

```bash
docker compose up -d                                          # Start local PostgreSQL
docker compose down                                           # Stop PostgreSQL
pnpm --filter @listwell/db exec drizzle-kit push              # Push schema
pnpm --filter @listwell/db exec drizzle-kit generate          # Generate migrations
pnpm --filter @listwell/db exec drizzle-kit migrate           # Run migrations
pnpm --filter @listwell/db exec drizzle-kit studio            # Database GUI
```

### Per-app Commands

```bash
pnpm --filter @listwell/web dev       # Web dev server only
pnpm --filter @listwell/api dev       # API dev server only
pnpm --filter @listwell/web build     # Build web only
pnpm --filter @listwell/api build     # Build API only
```

## License

Private project. All rights reserved.
