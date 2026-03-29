# Admin Operations Dashboard — Implementation Tasks

> Generated from docs/admin-plan.md on 2026-03-28
>
> **Instructions for Claude:** Complete tasks sequentially within each phase.
> Mark each task complete immediately after implementation.
> Run tests after each task. Commit after each working change.
> **All code must have tests with ≥80% coverage on affected files.**
>
> **UI Tasks:** Any task involving frontend components or pages should reference
> `docs/design-system.md` for tokens, colors, typography, and component patterns.

## Parallel Execution Waves

> Feature groups organized by dependency graph. Each wave's features can be built
> concurrently using git worktrees and separate Claude Code instances.
> Wave N+1 depends on Wave N being complete.

### Wave 1: Monorepo Restructure

- **Phase 0**: Rename apps/web → apps/admin, scaffold apps/marketing — must complete before all other work

### Wave 2: Foundation + Marketing (parallel)

- **Phase 1**: Admin Foundation (schema, auth, app shell)
- **Phase 5**: Marketing Site (Astro landing page + legal pages)

### Wave 3: Admin Features (parallel)

- **Phase 2**: Users & Account Management _(depends on Phase 1)_
- **Phase 3**: Dashboard & Metrics _(depends on Phase 1)_
- **Phase 4**: Listings & Error Investigation _(depends on Phase 1)_

---

## Progress Summary

- Phase 0: [x] Complete
- Phase 1: [x] Complete
- Phase 2: [x] Complete
- Phase 3: [ ] Not Started
- Phase 4: [ ] Not Started
- Phase 5: [x] Complete
- **MVP Status:** Not Started

---

## Phase 0: Monorepo Restructure

### 0.0 Pre-flight

- [x] 0.0.1: Read CLAUDE.md, admin-prd.md, and admin-plan.md to confirm understanding
- [x] 0.0.2: Verify no uncommitted changes in working directory

### 0.1 Rename apps/web → apps/admin

- [x] 0.1.1: Rename `apps/web` directory to `apps/admin`
  - Files: `apps/admin/` (renamed from `apps/web/`)
  - Test: Directory exists at new path
- [x] 0.1.2: Update package name in `apps/admin/package.json` from `@listwell/web` to `@listwell/admin`
  - Files: `apps/admin/package.json`
  - Test: `pnpm install` succeeds
- [x] 0.1.3: Update all references to `@listwell/web` in root `package.json`, `turbo.json`, and any scripts
  - Files: `package.json`, `turbo.json`
  - Test: `pnpm build` succeeds
- [x] 0.1.4: Update `CLAUDE.md` project structure section to reflect `apps/admin` naming and commands
  - Files: `CLAUDE.md`
  - Test: Documentation matches actual structure
- [x] 0.1.5: Verify all workspace commands work with the renamed package
  - Test: `pnpm --filter @listwell/admin dev`, `pnpm --filter @listwell/admin build`, `pnpm --filter @listwell/admin typecheck` all succeed

### 0.2 Scaffold apps/marketing

- [x] 0.2.1: Initialize Astro project in `apps/marketing` with static output mode
  - Files: `apps/marketing/package.json`, `apps/marketing/astro.config.mjs`, `apps/marketing/tsconfig.json`
  - Test: `pnpm --filter @listwell/marketing dev` starts the Astro dev server
- [x] 0.2.2: Add Tailwind CSS integration to the Astro project
  - Files: `apps/marketing/src/styles/global.css`, Astro config
  - Test: Tailwind classes render correctly in dev mode
- [x] 0.2.3: Create minimal placeholder landing page
  - Files: `apps/marketing/src/pages/index.astro`, `apps/marketing/src/layouts/BaseLayout.astro`
  - Test: Landing page renders at `localhost:4321`
- [x] 0.2.4: Update `CLAUDE.md` with marketing app commands and structure
  - Files: `CLAUDE.md`
  - Test: Documentation is accurate

### 0.3 Verify Monorepo

- [x] 0.3.1: Run full workspace validation
  - Test: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm test` all succeed across all apps

**Phase 0 Checkpoint:**

- [x] `apps/web` no longer exists, `apps/admin` is functional
- [x] `apps/marketing` builds and serves a placeholder page
- [x] All workspace scripts work correctly
- [x] `CLAUDE.md` updated with new structure
- [x] Commit: `chore: rename apps/web to apps/admin, scaffold apps/marketing (Phase 0)`

---

## Phase 1: Admin Foundation

### 1.1 Schema Changes

- [x] 1.1.1: Add `role` column to `user` table with default `"user"`
  - Files: `packages/db/src/schema.ts`
  - Test: `pnpm --filter @listwell/db exec drizzle-kit push` succeeds, column exists
- [x] 1.1.2: Add `suspended` (boolean, default false) and `suspendedReason` (text, nullable) columns to `user` table
  - Files: `packages/db/src/schema.ts`
  - Test: Schema push succeeds
- [x] 1.1.3: Add `agentCostUsd` (real), `agentInputTokens` (integer), `agentOutputTokens` (integer), `agentProvider` (text) columns to `listings` table — all nullable
  - Files: `packages/db/src/schema.ts`
  - Test: Schema push succeeds
- [x] 1.1.4: Extend `creditTransactionTypeEnum` with `MANUAL_GRANT` and `MANUAL_DEDUCT` values
  - Files: `packages/db/src/schema.ts`
  - Test: Schema push succeeds, enum has new values
- [x] 1.1.5: Add `adminUserId` (text, nullable) and `reason` (text, nullable) columns to `creditTransactions` table
  - Files: `packages/db/src/schema.ts`
  - Test: Schema push succeeds
- [x] 1.1.6: Create `userActivityLog` table with id, userId, eventType, description, resourceType, resourceId, metadata (json), createdAt. Add indexes on (userId, createdAt) and (eventType, createdAt)
  - Files: `packages/db/src/schema.ts`
  - Test: Schema push succeeds, table and indexes exist
- [x] 1.1.7: Add relations for `userActivityLog` (user relation) and update `userRelations` to include activity logs
  - Files: `packages/db/src/schema.ts`
  - Test: TypeScript compiles, `pnpm typecheck` passes

### 1.2 Admin API Middleware

- [x] 1.2.1: Update `SessionUser` interface in auth middleware to include `role` field
  - Files: `apps/api/src/middleware/auth.ts`
  - Test: TypeScript compiles
- [x] 1.2.2: Create `requireAdmin` middleware that wraps `requireAuth` and checks `user.role === "admin"`; returns 403 if not admin
  - Files: `apps/api/src/middleware/admin.ts`
  - Test: Unit test — returns 403 for non-admin, passes through for admin
- [x] 1.2.3: Add suspension check to `POST /listings` route — return 403 with message if user is suspended
  - Files: `apps/api/src/routes/listings.ts`
  - Test: Unit test — suspended user gets 403, non-suspended user proceeds normally
- [x] 1.2.4: Mount `requireAdmin` middleware on `/admin/*` paths in API index
  - Files: `apps/api/src/index.ts`
  - Test: Unauthenticated/non-admin requests to `/admin/*` return 401/403

### 1.3 Activity Log Helper

- [x] 1.3.1: Create `logActivity()` helper function that inserts into `userActivityLog` with try/catch (fire-and-forget, never throws)
  - Files: `apps/api/src/lib/activity-log.ts`
  - Test: Unit test — writes to DB, swallows errors gracefully
- [x] 1.3.2: Define activity event type constants (ACCOUNT_CREATED, LOGIN, LISTING_CREATED, LISTING_SUBMITTED, PIPELINE_ANALYZING, PIPELINE_RESEARCHING, PIPELINE_GENERATING, PIPELINE_COMPLETE, PIPELINE_ERROR, CREDITS_PURCHASED, CREDITS_USED, CREDITS_REFUNDED, CREDITS_FREE_GRANT, IMAGE_ENHANCE_REQUESTED, IMAGE_ENHANCE_COMPLETED, IMAGE_ENHANCE_FAILED, ACCOUNT_SUSPENDED, ACCOUNT_UNSUSPENDED, MANUAL_CREDIT_GRANT, MANUAL_CREDIT_DEDUCT)
  - Files: `apps/api/src/lib/activity-log.ts`
  - Test: TypeScript compiles, constants exported

### 1.4 Strip Consumer Pages

- [x] 1.4.1: Remove all consumer-facing page directories and components from admin app: `(authenticated)/`, `login/`, consumer components (ListingCard, ImageCarousel, AgentActivityLog, PipelineSteps, VoiceInput, PushPrompt, etc.)
  - Files: `apps/admin/src/app/`, `apps/admin/src/components/`
  - Test: No build errors after removal
- [x] 1.4.2: Remove service worker, PWA manifest, and offline-related code
  - Files: `apps/admin/src/app/manifest.ts`, any SW files, related imports
  - Test: `pnpm --filter @listwell/admin build` succeeds
- [x] 1.4.3: Remove consumer-specific lib files (new-listing-context, upload-client, voice-related) but keep api.ts, auth-client.ts, auth-middleware.ts, utils.ts
  - Files: `apps/admin/src/lib/`
  - Test: No import errors, build succeeds

### 1.5 Admin App Shell

- [x] 1.5.1: Create admin layout with sidebar navigation component (Dashboard, Users, Listings, Revenue & Costs, Activity). Use Lucide icons. Desktop-first with collapsible sidebar.
  - Files: `apps/admin/src/components/admin-sidebar.tsx`, `apps/admin/src/app/(admin)/layout.tsx`
  - Design: `docs/design-system.md` — use existing color tokens, desktop layout
  - Test: Component renders, navigation links work
- [x] 1.5.2: Create admin login page that checks user role after auth — redirect non-admins to an "unauthorized" message
  - Files: `apps/admin/src/app/login/page.tsx`, `apps/admin/src/lib/auth-middleware.ts`
  - Test: Admin user proceeds to dashboard, non-admin sees unauthorized message
- [x] 1.5.3: Create placeholder pages for each sidebar section (Dashboard, Users, Listings, Revenue & Costs, Activity) with section titles
  - Files: `apps/admin/src/app/(admin)/page.tsx`, `apps/admin/src/app/(admin)/users/page.tsx`, `apps/admin/src/app/(admin)/listings/page.tsx`, `apps/admin/src/app/(admin)/revenue/page.tsx`, `apps/admin/src/app/(admin)/activity/page.tsx`
  - Test: Each page renders, sidebar highlights active section
- [x] 1.5.4: Update Next.js middleware to protect admin routes — redirect unauthenticated users to login
  - Files: `apps/admin/src/middleware.ts` or `apps/admin/src/lib/auth-middleware.ts`
  - Test: Unauthenticated access redirects to login

**Phase 1 Checkpoint:**

- [x] Database schema has all new columns and tables
- [x] Admin middleware returns 403 for non-admin users
- [x] Suspended users cannot create listings (API returns 403)
- [x] Admin app shows login → sidebar layout → placeholder pages
- [x] `logActivity()` helper is functional
- [x] All tests pass, `pnpm typecheck` clean
- [x] Commit: `feat(admin): schema changes, admin auth, and app shell (Phase 1)`

---

## Phase 2: Users & Account Management

### 2.1 Admin User API Routes

- [x] 2.1.1: Create `GET /admin/users` route — paginated list with search (name/email), sort, and filters (has credits, has listings, date range). Join userCredits for balance. Return total count for pagination.
  - Files: `apps/api/src/routes/admin/users.ts`
  - Test: Unit tests — pagination works, search filters correctly, sort applies
- [x] 2.1.2: Create `GET /admin/users/:id` route — user detail with credit balance, transaction history, listing summary, and recent activity
  - Files: `apps/api/src/routes/admin/users.ts`
  - Test: Unit test — returns complete user detail
- [x] 2.1.3: Create `POST /admin/users/:id/credits` route — grant or deduct credits. Body: `{ action: "grant" | "deduct", amount: number, reason: string }`. Creates credit transaction with `adminUserId`, updates balance, logs activity.
  - Files: `apps/api/src/routes/admin/users.ts`
  - Test: Unit tests — grant increases balance, deduct decreases, deduct below zero returns 400, reason required
- [x] 2.1.4: Create `POST /admin/users/:id/suspend` route — toggle suspension. Body: `{ action: "suspend" | "unsuspend", reason: string }`. Updates user record, logs activity.
  - Files: `apps/api/src/routes/admin/users.ts`
  - Test: Unit tests — suspend sets flag, unsuspend clears it, reason required
- [x] 2.1.5: Create `GET /admin/users/:id/activity` route — paginated activity timeline for a specific user, newest first. Filter by eventType and date range.
  - Files: `apps/api/src/routes/admin/users.ts`
  - Test: Unit test — returns paginated, filtered results
- [x] 2.1.6: Create `GET /admin/activity` route — global activity feed across all users, paginated, filterable by eventType and date range
  - Files: `apps/api/src/routes/admin/activity.ts`
  - Test: Unit test — returns cross-user activity feed
- [x] 2.1.7: Mount admin user and activity routes in API index
  - Files: `apps/api/src/index.ts`
  - Test: Routes respond to requests

### 2.2 Activity Log Instrumentation

- [x] 2.2.1: Add activity logging to auth flow — ACCOUNT_CREATED on signup, LOGIN on sign-in
  - Files: `apps/api/src/auth.ts` or BetterAuth hooks
  - Test: Activity log entry created on signup and login
- [x] 2.2.2: Add activity logging to listing creation — LISTING_CREATED when POST /listings succeeds
  - Files: `apps/api/src/routes/listings.ts`
  - Test: Activity log entry created with listing ID
- [x] 2.2.3: Add activity logging to credit operations — CREDITS_PURCHASED, CREDITS_USED, CREDITS_REFUNDED, CREDITS_FREE_GRANT
  - Files: `apps/api/src/routes/credits.ts`, `apps/api/src/routes/apple-purchase.ts`, `apps/api/src/routes/listings.ts`
  - Test: Activity log entries created for each credit operation type
- [x] 2.2.4: Add activity logging to Inngest pipeline — LISTING_SUBMITTED, PIPELINE_ANALYZING, PIPELINE_RESEARCHING, PIPELINE_GENERATING, PIPELINE_COMPLETE, PIPELINE_ERROR
  - Files: `apps/api/src/inngest/functions/generate-listing.ts`
  - Test: Activity log entries created at each pipeline step
- [x] 2.2.5: Add activity logging to image enhancement — IMAGE_ENHANCE_REQUESTED, IMAGE_ENHANCE_COMPLETED, IMAGE_ENHANCE_FAILED
  - Files: `apps/api/src/inngest/functions/enhance-image.ts` or `apps/api/src/routes/listing-enhance.ts`
  - Test: Activity log entries created for enhancement lifecycle

### 2.3 Users List Page

- [x] 2.3.1: Install and configure shadcn/ui DataTable component (TanStack Table) in admin app if not already present
  - Files: `apps/admin/src/components/ui/data-table.tsx`, `apps/admin/package.json`
  - Test: DataTable component renders
- [x] 2.3.2: Build users list page with DataTable — columns: name, email, signup date, credit balance, total listings, status (suspended badge). Server-side pagination via `apiFetch()`.
  - Files: `apps/admin/src/app/(admin)/users/page.tsx`, `apps/admin/src/app/(admin)/users/columns.tsx`
  - Design: `docs/design-system.md`
  - Test: Table renders with data, pagination works
- [x] 2.3.3: Add search input (name/email) and filter controls to users list
  - Files: `apps/admin/src/app/(admin)/users/page.tsx`
  - Test: Search filters the table, filters apply correctly

### 2.4 User Detail Page

- [x] 2.4.1: Build user detail page with overview tab — profile info, credit balance card, quick stats (total listings, errors, last active)
  - Files: `apps/admin/src/app/(admin)/users/[id]/page.tsx`
  - Design: `docs/design-system.md`
  - Test: Page renders user data correctly
- [x] 2.4.2: Build credit transaction history tab on user detail — table of all transactions with type, amount, balance after, date, associated listing link, Apple transaction ID
  - Files: `apps/admin/src/app/(admin)/users/[id]/page.tsx` or sub-component
  - Test: Transaction history renders correctly
- [x] 2.4.3: Build listings tab on user detail — table of user's listings with status, pipeline status, created date. Click through to admin listing detail.
  - Files: `apps/admin/src/app/(admin)/users/[id]/page.tsx` or sub-component
  - Test: Listings table renders, links work
- [x] 2.4.4: Build activity timeline tab on user detail — reverse-chronological feed with event type icons, descriptions, resource links. Filter by event type.
  - Files: `apps/admin/src/app/(admin)/users/[id]/page.tsx`, `apps/admin/src/components/activity-timeline.tsx`
  - Design: `docs/design-system.md` — visual distinction between user events, system events, admin actions
  - Test: Timeline renders, filtering works, links navigate correctly

### 2.5 User Actions

- [x] 2.5.1: Build credit grant/deduct modal — form with action selector (grant/deduct), amount input, required reason textarea. Calls POST /admin/users/:id/credits.
  - Files: `apps/admin/src/components/credit-action-modal.tsx`
  - Test: Modal opens, validates inputs, submits successfully, balance updates
- [x] 2.5.2: Build suspend/unsuspend controls on user detail — button with confirmation dialog and required reason. Calls POST /admin/users/:id/suspend.
  - Files: `apps/admin/src/components/suspend-action.tsx`
  - Test: Suspend toggles correctly, reason required, status badge updates

### 2.6 Global Activity Page

- [x] 2.6.1: Build global activity page using the activity timeline component — shows cross-user activity feed with user name/link, filterable by event type and date range
  - Files: `apps/admin/src/app/(admin)/activity/page.tsx`
  - Test: Global feed renders, filters work, user links navigate to user detail

**Phase 2 Checkpoint:**

- [x] Users list shows all users with search, sort, filter, pagination
- [x] User detail shows overview, credit history, listings, and full activity timeline
- [x] Admin can grant/deduct credits with a reason
- [x] Admin can suspend/unsuspend users with a reason
- [x] Activity log captures all key user events (auth, listings, credits, images)
- [x] Global activity feed works
- [x] All tests pass with ≥80% coverage on new files
- [x] Commit: `feat(admin): users and account management (Phase 2)`

---

## Phase 3: Dashboard & Metrics

### 3.1 Cost Tracking Plumbing

- [ ] 3.1.1: Update generate-listing Inngest function to store `costUsd`, `inputTokens`, `outputTokens`, and `provider` from agent result on the listing record
  - Files: `apps/api/src/inngest/functions/generate-listing.ts`
  - Test: After agent completes, listing has cost columns populated
- [ ] 3.1.2: Investigate E2B provider cost data — check if Claude CLI stream-json output includes usage/token data. If yes, parse and return in `costUsd`. If no, document the limitation and leave as 0.
  - Files: `apps/api/src/lib/ai/providers/e2b.ts`
  - Test: Document findings; if parseable, unit test the parsing
- [ ] 3.1.3: Verify Anthropic API provider cost calculation is accurate and passes through correctly
  - Files: `apps/api/src/lib/ai/providers/anthropic-api.ts`, `apps/api/src/lib/ai/agent.ts`
  - Test: Cost data flows from provider → agent → Inngest function → listing record

### 3.2 Dashboard API Routes

- [ ] 3.2.1: Create `GET /admin/dashboard` route — returns aggregated metrics: total users, new users (7d/30d), total listings by status, total credits (purchased/used/remaining), total revenue, total costs, margin. Accept `period` query param.
  - Files: `apps/api/src/routes/admin/dashboard.ts`
  - Test: Unit tests — returns correct aggregations
- [ ] 3.2.2: Create `GET /admin/revenue` route — revenue aggregation by period (daily/weekly/monthly). Each data point: date, gross revenue, apple commission (30%), net revenue. Revenue = count of PURCHASE transactions × $4.99.
  - Files: `apps/api/src/routes/admin/dashboard.ts`
  - Test: Unit test — correct revenue calculation with Apple commission
- [ ] 3.2.3: Create `GET /admin/costs` route — cost aggregation by period. Each data point: date, total cost, listing count, average cost per listing. Source: sum of `agentCostUsd` from listings.
  - Files: `apps/api/src/routes/admin/dashboard.ts`
  - Test: Unit test — correct cost aggregation
- [ ] 3.2.4: Mount dashboard routes in API index
  - Files: `apps/api/src/index.ts`
  - Test: Routes respond

### 3.3 Dashboard Page

- [ ] 3.3.1: Build primary metric cards — Total Revenue (gross), Net Revenue (after Apple 30%), Total AI Costs, Margin (net revenue - costs). Each card shows current value and trend indicator.
  - Files: `apps/admin/src/app/(admin)/page.tsx`, `apps/admin/src/components/metric-card.tsx`
  - Design: `docs/design-system.md`
  - Test: Cards render with correct values from API
- [ ] 3.3.2: Build secondary metric cards — Total Users, New Users (30d), Listings Created, Listings Errored, Credits Purchased, Average Cost per Listing
  - Files: `apps/admin/src/app/(admin)/page.tsx`
  - Test: Cards render correctly
- [ ] 3.3.3: Build revenue vs costs time-series chart using Recharts (via shadcn/ui Charts). Two lines: net revenue and AI costs over time. Include margin area between them.
  - Files: `apps/admin/src/app/(admin)/page.tsx`, `apps/admin/src/components/revenue-cost-chart.tsx`
  - Test: Chart renders with data, responsive
- [ ] 3.3.4: Build listings per day bar chart and new signups per day chart
  - Files: `apps/admin/src/components/listings-chart.tsx`, `apps/admin/src/components/signups-chart.tsx`
  - Test: Charts render with data
- [ ] 3.3.5: Add period toggle (daily, weekly, monthly) that controls all charts and metric cards
  - Files: `apps/admin/src/app/(admin)/page.tsx`
  - Test: Period toggle changes data in charts and cards

### 3.4 Revenue & Costs Detail Page

- [ ] 3.4.1: Build revenue & costs page with detailed breakdown — revenue table (by day/week/month: purchases, gross, commission, net), costs table (by day/week/month: listings processed, total cost, avg cost), margin summary
  - Files: `apps/admin/src/app/(admin)/revenue/page.tsx`
  - Design: `docs/design-system.md`
  - Test: Tables render with data, calculations are correct

**Phase 3 Checkpoint:**

- [ ] Agent processing costs are stored on listing records
- [ ] Dashboard shows revenue, costs, margin with metric cards
- [ ] Time-series charts display correctly with period toggles
- [ ] Revenue & costs detail page shows full breakdown
- [ ] All tests pass with ≥80% coverage on new files
- [ ] Commit: `feat(admin): dashboard and metrics (Phase 3)`

---

## Phase 4: Listings & Error Investigation

### 4.1 Admin Listing API Routes

- [ ] 4.1.1: Create `GET /admin/listings` route — all listings across all users, paginated, with filters (status, pipelineStep, userId, date range, hasError). Join user for name/email. Return total count.
  - Files: `apps/api/src/routes/admin/listings.ts`
  - Test: Unit tests — pagination, filters, and sorting work correctly
- [ ] 4.1.2: Create `GET /admin/listings/:id` route — full listing detail including admin-only fields (cost, tokens, provider, agent log, transcript URL, pipeline error, credit transaction, user info)
  - Files: `apps/api/src/routes/admin/listings.ts`
  - Test: Unit test — returns complete listing detail with admin fields
- [ ] 4.1.3: Mount admin listing routes in API index
  - Files: `apps/api/src/index.ts`
  - Test: Routes respond

### 4.2 Listings List Page

- [ ] 4.2.1: Build admin listings list page with DataTable — columns: thumbnail, title, user (link), status badge, pipeline status badge, cost, created date. Server-side pagination.
  - Files: `apps/admin/src/app/(admin)/listings/page.tsx`, `apps/admin/src/app/(admin)/listings/columns.tsx`
  - Design: `docs/design-system.md`
  - Test: Table renders with data across all users
- [ ] 4.2.2: Add quick filter tabs (All, Processing, Errored, Ready) and additional filters (user, date range)
  - Files: `apps/admin/src/app/(admin)/listings/page.tsx`
  - Test: Tabs filter correctly, additional filters work

### 4.3 Admin Listing Detail Page

- [ ] 4.3.1: Build admin listing detail page — images, title, description, pricing, comparables, research notes (all existing listing data)
  - Files: `apps/admin/src/app/(admin)/listings/[id]/page.tsx`
  - Design: `docs/design-system.md`
  - Test: Page renders listing content correctly
- [ ] 4.3.2: Add admin-only section — processing cost card (tokens, USD), agent provider, credit transaction link, user link
  - Files: `apps/admin/src/app/(admin)/listings/[id]/page.tsx`
  - Test: Admin fields render when data exists
- [ ] 4.3.3: Build agent log viewer component — timestamped log entries with type icons, expandable/collapsible. Renders `agentLog` JSON field.
  - Files: `apps/admin/src/components/agent-log-viewer.tsx`
  - Test: Component renders log entries correctly, expand/collapse works
- [ ] 4.3.4: Add pipeline error details section — shown when pipelineStep is ERROR. Displays error message, whether credit was refunded, link to agent transcript.
  - Files: `apps/admin/src/app/(admin)/listings/[id]/page.tsx`
  - Test: Error section shows for errored listings, hidden for others

**Phase 4 Checkpoint:**

- [ ] Admin can browse all listings across all users
- [ ] Quick filter tabs work (All, Processing, Errored, Ready)
- [ ] Admin listing detail shows full content plus admin-only fields
- [ ] Agent log viewer displays timestamped entries
- [ ] Error investigation workflow works (filter errors → view detail → see agent log → check refund)
- [ ] All tests pass with ≥80% coverage on new files
- [ ] Commit: `feat(admin): listings and error investigation (Phase 4)`

---

## Phase 5: Marketing Site

### 5.1 Site Structure

- [x] 5.1.1: Create base layout with shared head (meta tags, fonts, favicon), header (logo + nav), and footer (links to privacy, terms, support, copyright)
  - Files: `apps/marketing/src/layouts/BaseLayout.astro`, `apps/marketing/src/components/Header.astro`, `apps/marketing/src/components/Footer.astro`
  - Test: Layout renders with header and footer
- [x] 5.1.2: Set up brand design tokens in Tailwind config — colors (teal pine, warm linen, shed), typography (Fraunces, Instrument Sans), spacing
  - Files: `apps/marketing/src/styles/global.css`, `apps/marketing/tailwind.config.mjs` (or Astro Tailwind config)
  - Test: Brand colors and fonts render correctly

### 5.2 Landing Page

- [x] 5.2.1: Build hero section — headline, subheadline ("Sell your stuff, not your Saturday"), App Store download badge, background with shed color
  - Files: `apps/marketing/src/pages/index.astro`, `apps/marketing/src/components/Hero.astro`
  - Design: `docs/design-system.md` — Marketing tokens (Fraunces display, pill buttons, shed hero bg)
  - Test: Hero renders, App Store badge links correctly
- [x] 5.2.2: Build "How it works" section — 3-4 step visual walkthrough (snap photos → AI generates → copy to marketplace). Icons or illustrations.
  - Files: `apps/marketing/src/components/HowItWorks.astro`
  - Test: Section renders with steps
- [x] 5.2.3: Build key benefits section — time savings, AI pricing research, photo enhancement. Feature cards.
  - Files: `apps/marketing/src/components/Benefits.astro`
  - Test: Benefits section renders
- [x] 5.2.4: Build social proof placeholder section — space for future testimonials/stats. Can show a simple stat like "Listings generated" or be a placeholder.
  - Files: `apps/marketing/src/components/SocialProof.astro`
  - Test: Section renders

### 5.3 Legal & Support Pages

- [x] 5.3.1: Build privacy policy page with standard content covering data collection, Apple IAP, AI processing, third-party services
  - Files: `apps/marketing/src/pages/privacy.astro`
  - Test: Page renders, content is complete
- [x] 5.3.2: Build terms of service page with standard consumer app terms
  - Files: `apps/marketing/src/pages/terms.astro`
  - Test: Page renders, content is complete
- [x] 5.3.3: Build support page with support email and basic FAQ
  - Files: `apps/marketing/src/pages/support.astro`
  - Test: Page renders, email link works

### 5.4 Polish & Deploy

- [x] 5.4.1: Verify mobile responsiveness on all pages (375px and up)
  - Test: All pages render correctly at mobile widths
- [x] 5.4.2: Add meta tags (Open Graph, Twitter cards) for social sharing
  - Files: `apps/marketing/src/layouts/BaseLayout.astro`
  - Test: Meta tags present in HTML output
- [x] 5.4.3: Verify static build output and configure for deployment
  - Test: `pnpm --filter @listwell/marketing build` produces static files in `dist/`

**Phase 5 Checkpoint:**

- [x] Landing page renders with hero, how-it-works, benefits, footer
- [x] Privacy policy, terms, and support pages are complete
- [x] All pages are mobile-responsive
- [x] Static build produces deployable output
- [x] Commit: `feat(marketing): landing page and legal pages (Phase 5)`

---

## Task Log

| Task | Completed | Commit | Notes |
| ---- | --------- | ------ | ----- |
| 0.0.1 | 2026-03-28 | 5c1fe8e | Read all docs |
| 0.0.2 | 2026-03-28 | 5c1fe8e | Clean working directory |
| 0.1.1 | 2026-03-28 | 5c1fe8e | Renamed apps/web → apps/admin |
| 0.1.2 | 2026-03-28 | 5c1fe8e | Updated package name |
| 0.1.3 | 2026-03-28 | 5c1fe8e | Updated tsconfig, drizzle.config, .env.example, README |
| 0.1.4 | 2026-03-28 | 5c1fe8e | Updated CLAUDE.md |
| 0.1.5 | 2026-03-28 | 5c1fe8e | All workspace commands verified |
| 0.2.1 | 2026-03-28 | | Astro project scaffolded |
| 0.2.2 | 2026-03-28 | | Tailwind v4 via @tailwindcss/vite |
| 0.2.3 | 2026-03-28 | | Placeholder landing page |
| 0.2.4 | 2026-03-28 | | CLAUDE.md updated with marketing |
| 0.3.1 | 2026-03-28 | | build, typecheck, test all pass |
| 1.1.1 | 2026-03-28 | | role column on user table |
| 1.1.2 | 2026-03-28 | | suspended + suspendedReason on user |
| 1.1.3 | 2026-03-28 | | cost columns on listings |
| 1.1.4 | 2026-03-28 | | MANUAL_GRANT, MANUAL_DEDUCT enum values |
| 1.1.5 | 2026-03-28 | | adminUserId + reason on creditTransactions |
| 1.1.6 | 2026-03-28 | | userActivityLog table with indexes |
| 1.1.7 | 2026-03-28 | | activityLogs relation on user |
| 1.2.1 | 2026-03-28 | | role field on SessionUser |
| 1.2.2 | 2026-03-28 | | requireAdmin middleware |
| 1.2.3 | 2026-03-28 | | suspension check on POST /listings |
| 1.2.4 | 2026-03-28 | | /admin/* middleware mount |
| 1.3.1 | 2026-03-28 | | logActivity() helper |
| 1.3.2 | 2026-03-28 | | 20 event type constants |
| 1.4.1 | 2026-03-28 | | Removed (authenticated)/, consumer components |
| 1.4.2 | 2026-03-28 | | Removed SW, manifest, PWA icons |
| 1.4.3 | 2026-03-28 | | Removed new-listing-context, upload-client |
| 1.5.1 | 2026-03-28 | | Sidebar + admin layout |
| 1.5.2 | 2026-03-28 | | Admin login with role check |
| 1.5.3 | 2026-03-28 | | Placeholder pages for all sections |
| 1.5.4 | 2026-03-28 | | Next.js middleware route protection |
| 2.1.1 | | | |
| 2.1.2 | | | |
| 2.1.3 | | | |
| 2.1.4 | | | |
| 2.1.5 | | | |
| 2.1.6 | | | |
| 2.1.7 | | | |
| 2.2.1 | | | |
| 2.2.2 | | | |
| 2.2.3 | | | |
| 2.2.4 | | | |
| 2.2.5 | | | |
| 2.3.1 | | | |
| 2.3.2 | | | |
| 2.3.3 | | | |
| 2.4.1 | | | |
| 2.4.2 | | | |
| 2.4.3 | | | |
| 2.4.4 | | | |
| 2.5.1 | | | |
| 2.5.2 | | | |
| 2.6.1 | | | |
| 3.1.1 | | | |
| 3.1.2 | | | |
| 3.1.3 | | | |
| 3.2.1 | | | |
| 3.2.2 | | | |
| 3.2.3 | | | |
| 3.2.4 | | | |
| 3.3.1 | | | |
| 3.3.2 | | | |
| 3.3.3 | | | |
| 3.3.4 | | | |
| 3.3.5 | | | |
| 3.4.1 | | | |
| 4.1.1 | | | |
| 4.1.2 | | | |
| 4.1.3 | | | |
| 4.2.1 | | | |
| 4.2.2 | | | |
| 4.3.1 | | | |
| 4.3.2 | | | |
| 4.3.3 | | | |
| 4.3.4 | | | |
| 5.1.1 | 2026-03-28 | | BaseLayout, Header, Footer with fonts + meta |
| 5.1.2 | 2026-03-28 | | Tailwind v4 @theme tokens (pine, linen, shed) |
| 5.2.1 | 2026-03-28 | | Hero section with App Store CTA |
| 5.2.2 | 2026-03-28 | | 4-step how-it-works with icons |
| 5.2.3 | 2026-03-28 | | 4 benefit cards |
| 5.2.4 | 2026-03-28 | | Stats section with CTA |
| 5.3.1 | 2026-03-28 | | Privacy policy (data, IAP, third-party) |
| 5.3.2 | 2026-03-28 | | Terms of service |
| 5.3.3 | 2026-03-28 | | Support page with FAQ |
| 5.4.1 | 2026-03-28 | | Mobile-responsive via Tailwind breakpoints |
| 5.4.2 | 2026-03-28 | | OG + Twitter Card meta tags |
| 5.4.3 | 2026-03-28 | | Static build verified (4 pages in dist/) |
