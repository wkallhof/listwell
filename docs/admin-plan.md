# Admin Operations Dashboard — Technical Implementation Plan

> Generated from docs/admin-prd.md and docs/design-system.md on 2026-03-28
> Last updated: 2026-03-28

## Overview

The Admin Operations Dashboard repurposes the existing Next.js consumer web app (`apps/web`) into an internal business operations tool (`apps/admin`) while adding a new Astro-based marketing site (`apps/marketing`). The admin dashboard provides user management, credit/account management, revenue and cost tracking, margin analysis, user activity timelines for customer support, and error investigation. The iOS native app remains the sole consumer experience. The Hono API (`apps/api`) is extended with admin-specific routes protected by a `requireAdmin` middleware. A new `userActivityLog` table captures all user-facing events for timeline replay during support interactions.

## Architecture Summary

The system retains its existing architecture — Hono API serving both the iOS app and admin dashboard, with Inngest for background jobs — and adds:

1. **Admin role enforcement** at both API (middleware) and web (route protection) layers
2. **Activity logging** as side effects within existing API operations
3. **Cost tracking** by storing already-computed agent cost data that's currently discarded
4. **Admin-specific API routes** (`/admin/*`) for aggregated metrics, user management, and cross-user data access
5. **A static Astro marketing site** that's fully independent of the API

### Key Components

| Component | Responsibility | Key Technologies |
| --------- | -------------- | ---------------- |
| Admin Dashboard (`apps/admin`) | Internal ops UI: users, listings, metrics, activity timelines | Next.js App Router, shadcn/ui, Tailwind CSS, Recharts |
| API (`apps/api`) | Business logic, admin routes, activity logging, cost storage | Hono, Drizzle ORM, BetterAuth, Inngest |
| Marketing Site (`apps/marketing`) | Public landing page, legal pages, App Store link | Astro, Tailwind CSS |
| Database (`packages/db`) | Schema: new admin columns, activity log table | Drizzle ORM, PostgreSQL |
| Shared (`packages/shared`) | Types, schemas, utilities | TypeScript |

### Data Flow

```
Admin Dashboard
    → GET/POST /api/admin/* (via Next.js rewrite proxy)
    → Hono API (requireAdmin middleware)
    → PostgreSQL (Drizzle ORM)
    → Response with aggregated data / action confirmation

Activity Logging (side-effect within existing flows):
    User action (iOS or API) → API handler
    → Existing business logic (create listing, purchase credits, etc.)
    → INSERT into userActivityLog (fire-and-forget, non-blocking)

Cost Tracking:
    Inngest generate-listing function
    → Agent provider returns costUsd + token counts
    → UPDATE listing with cost columns (currently discarded, now stored)
```

## Implementation Phases

### Phase 0: Monorepo Restructure

**Goal:** Rename `apps/web` → `apps/admin`, scaffold `apps/marketing`, verify all tooling works.
**Depends on:** Nothing

- Rename directory and package name (`@listwell/web` → `@listwell/admin`)
- Update all references in `turbo.json`, root `package.json`, and `CLAUDE.md`
- Scaffold Astro project in `apps/marketing` with Tailwind CSS
- Add `@listwell/marketing` to workspace config
- Verify: `pnpm dev`, `pnpm build`, `pnpm typecheck` all succeed for all apps

### Phase 1: Admin Foundation

**Goal:** Schema changes deployed, admin auth working, admin app shell with navigation.
**Depends on:** Phase 0

- Add `role`, `suspended`, `suspendedReason` columns to `user` table
- Add `agentCostUsd`, `agentInputTokens`, `agentOutputTokens`, `agentProvider` columns to `listings` table
- Extend `creditTransactionTypeEnum` with `MANUAL_GRANT`, `MANUAL_DEDUCT`
- Add `adminUserId` and `reason` columns to `creditTransactions` table
- Create `userActivityLog` table with indexes
- Build `requireAdmin` middleware (wraps `requireAuth` + role check)
- Add suspension check to `POST /listings` endpoint
- Strip all consumer-facing pages from admin app
- Build admin layout with sidebar navigation (Dashboard, Users, Listings, Revenue & Costs, Activity)
- Build admin login page that redirects non-admins
- Verify: Admin can log in, see empty dashboard shell, non-admin gets 403

### Phase 2: Users & Account Management

**Goal:** Full user management with credit operations, suspension, and activity timeline.
**Depends on:** Phase 1

- Build `GET /admin/users` API route (paginated, searchable, sortable)
- Build `GET /admin/users/:id` API route (user detail with credits, listings, activity)
- Build `POST /admin/users/:id/credits` API route (grant/deduct with reason + audit)
- Build `POST /admin/users/:id/suspend` API route (suspend/unsuspend with reason)
- Build `GET /admin/users/:id/activity` API route (paginated activity timeline)
- Build `GET /admin/activity` API route (global activity feed)
- Instrument existing API operations to write activity log events:
  - Auth: account creation, login
  - Listings: creation, submission, pipeline transitions, completion, errors
  - Credits: purchase, usage, refund, free grant
  - Images: enhancement requested/completed/failed
- Build users list page with data table (search, sort, filter)
- Build user detail page with tabs (overview, credits, listings, activity)
- Build credit grant/deduct modal with reason field
- Build suspend/unsuspend controls with reason field
- Build activity timeline component (per-user and global views)
- Verify: Can view all users, grant credits, suspend a user, view full activity timeline

### Phase 3: Dashboard & Metrics

**Goal:** Business metrics dashboard with revenue, costs, and margin analysis.
**Depends on:** Phase 1

- Wire up cost tracking in generate-listing Inngest function (store `costUsd`, token counts, provider)
- Investigate E2B provider cost data availability; implement or document limitation
- Build `GET /admin/dashboard` API route (aggregated metrics with period params)
- Build `GET /admin/revenue` API route (revenue aggregation by period)
- Build `GET /admin/costs` API route (cost aggregation by period)
- Build dashboard page with primary metric cards (revenue, net revenue, costs, margin)
- Build secondary metric cards (users, listings, credits)
- Build time-series charts using Recharts (revenue vs costs, listings per day, signups per day)
- Add period toggles (daily, weekly, monthly)
- Verify: Dashboard shows real metrics, charts render correctly, period toggles work

### Phase 4: Listings & Error Investigation

**Goal:** Admin visibility into all listings with error investigation tools.
**Depends on:** Phase 1

- Build `GET /admin/listings` API route (all users, paginated, filterable)
- Build `GET /admin/listings/:id` API route (full detail with admin-only fields)
- Build listings list page with data table and quick filter tabs (All, Processing, Errored, Ready)
- Build admin listing detail page (full listing + cost info + agent log + transcript link)
- Build agent log viewer component (timestamped entries, collapsible)
- Build errored listings quick view (filtered list with error messages, refund status)
- Verify: Can browse all listings, filter to errors, view agent log and transcript for any listing

### Phase 5: Marketing Site

**Goal:** Public-facing Astro site with landing page and required legal pages.
**Depends on:** Phase 0

- Build landing page: hero section, how-it-works steps, benefits, App Store badge, footer
- Build privacy policy page
- Build terms of service page
- Build support page (email + FAQ)
- Apply design system tokens (Tailwind, brand colors, typography)
- Configure Vercel deployment (or static host)
- Verify: All pages render, responsive on mobile, App Store link works

---

## MVP Boundary

**MVP includes:** Phases 0–4
**Post-MVP:** Phase 5 (Marketing Site — can be built anytime, fully independent)

**MVP is complete when:**

- [ ] Admin can log in and non-admin users are rejected
- [ ] Admin can view all users, search/filter, and see user details
- [ ] Admin can grant/deduct credits with a reason
- [ ] Admin can suspend/unsuspend users
- [ ] Admin can view the full activity timeline for any user
- [ ] Dashboard shows revenue, costs, margin, and key metrics
- [ ] Admin can browse all listings across users and filter by status
- [ ] Admin can view agent logs and error details for any listing
- [ ] Listing creation is blocked for suspended users
- [ ] AI processing costs are tracked per listing
- [ ] All Phase 0–4 checkpoints pass
- [ ] Application can be deployed and used for core admin workflows

## External Dependencies

| Dependency | Purpose | Version | Notes |
| ---------- | ------- | ------- | ----- |
| recharts | Time-series charts for dashboard | ^2.x | Already available via shadcn/ui charts |
| @tanstack/react-table | Data tables with sorting/filtering/pagination | ^8.x | Used by shadcn/ui DataTable component |
| astro | Static site generator for marketing | ^5.x | New dependency for `apps/marketing` |
| @astrojs/tailwind | Tailwind CSS integration for Astro | ^6.x | Astro Tailwind integration |

All other dependencies (Next.js, Hono, Drizzle, shadcn/ui, BetterAuth, Inngest) are already in the project.

## Open Questions

- [ ] **E2B cost data:** Does Claude CLI's `--output-format stream-json` include token usage? If not, E2B-processed listings will have `agentCostUsd = 0` until the provider is updated or replaced.
- [ ] **Apple IAP price mapping:** The $4.99 price for 5 credits needs to be stored/configured somewhere for revenue calculations. Hard-code initially or make it configurable?
- [ ] **Listing cost backfill:** Existing listings have no cost data. Accept that historical data starts from when cost tracking is implemented (recommended) or attempt transcript parsing?
- [ ] **Apple commission rate:** Using 30% (standard). If enrolled in Small Business Program (15%), this should be configurable.

## Technology References

| Technology | Purpose | Documentation |
| ---------- | ------- | ------------- |
| Astro | Marketing site static generator | https://docs.astro.build |
| Recharts | Dashboard charts | https://recharts.org |
| TanStack Table | Data tables | https://tanstack.com/table |
| shadcn/ui DataTable | Pre-built table component | https://ui.shadcn.com/docs/components/data-table |
| shadcn/ui Charts | Pre-built chart components | https://ui.shadcn.com/docs/components/chart |
| Drizzle ORM | Schema migrations, queries | https://orm.drizzle.team |
| Hono | API framework | https://hono.dev |
| BetterAuth | Authentication | https://better-auth.com |

## Parallel Execution Waves

> Phases grouped by dependency graph for concurrent development using git worktrees
> and multiple Claude Code instances. Wave N+1 depends on Wave N being complete.

| Wave | Phases | Feature Groups |
| ---- | ------ | -------------- |
| 1 | 0 | Monorepo Restructure |
| 2 | 1, 5 | Admin Foundation, Marketing Site |
| 3 | 2, 3, 4 | Users & Account Management, Dashboard & Metrics, Listings & Error Investigation |

**Wave 2 parallelism:** Phase 1 (admin schema + auth + shell) and Phase 5 (Astro marketing site) are completely independent after the monorepo restructure.

**Wave 3 parallelism:** Phases 2, 3, and 4 all depend on Phase 1 (schema + admin middleware + app shell) but are independent of each other. Phase 2 builds user management, Phase 3 builds the dashboard/metrics, and Phase 4 builds listings/errors — each touches different API routes and different admin pages.

## Notes for Implementation

### Admin App (apps/admin)
- Desktop-first layout (sidebar nav), NOT mobile-first like the consumer app
- Use shadcn/ui DataTable for all list views (built on TanStack Table)
- Use shadcn/ui Charts for dashboard (built on Recharts)
- Keep the existing design system tokens — they work fine for admin UI
- `apiFetch()` pattern stays the same for server components
- API proxy rewrites stay the same (`/api/*` → Hono on port 4000)

### Admin API Routes
- All admin routes grouped under `/admin` prefix in a single route file (or split by resource)
- `requireAdmin` middleware applied to `/admin/*` path in `index.ts`
- Admin routes can access any user's data (no `userId` scoping like consumer routes)
- Activity log writes should be non-blocking — use fire-and-forget inserts, don't let logging failures break the primary operation

### Activity Log Instrumentation
- Add a thin `logActivity()` helper that accepts `userId`, `eventType`, `description`, optional `resourceType`/`resourceId`/`metadata`
- Call it as a side effect in existing route handlers and Inngest functions
- Wrap in try/catch — never let logging failures propagate to the user
- For pipeline events, call from within the Inngest function steps

### Schema Migration Strategy
- Use `drizzle-kit push` for development
- The `creditTransactionTypeEnum` needs to be extended with new values — Drizzle handles this with ALTER TYPE
- BetterAuth manages the `user` table — adding columns should be done carefully to avoid conflicts. Add them via Drizzle schema and push; BetterAuth ignores unknown columns

### Marketing Site
- Completely independent of the API — no auth, no API calls
- Static HTML/CSS output, deployable anywhere
- Share Tailwind color tokens via CSS variables (copy relevant values, don't import from shared package)
- Keep it minimal — Astro with zero client-side JS
