# Listwell Admin Operations Dashboard — Product Requirements Document

**Version:** 0.1
**Author:** Wade Kallhoff
**Date:** March 2026

---

## What Is This

The Admin Operations Dashboard is an internal web application for managing the business side of Listwell. It provides visibility into users, revenue, costs, and margins — and gives the operator customer support tools to manage accounts, investigate errors, and allocate credits.

This replaces the consumer-facing PWA. The iOS native app is now the sole consumer experience. The existing Next.js app (`apps/web`) is repurposed as this admin dashboard, reusing its auth, API proxy, shadcn/ui, and Tailwind infrastructure.

---

## Who It's For

The Listwell operator (you). One person managing a small but growing user base, needing real-time awareness of:

- How much money the app is generating
- How much AI processing costs
- Whether users are having problems
- The ability to act on any of the above quickly

This is not a multi-tenant admin panel. There's no team permissions model. It's a single-operator tool with admin access gated by a role flag on the user record.

---

## Strategic Context

The consumer web app is being retired in favor of iOS-only distribution. Reasons:

- Eliminates the need to support web-based payments (Apple IAP is the sole payment channel)
- Reduces maintenance surface area
- The web app can be revived later if needed — the API is client-agnostic

The admin dashboard reuses the web app's infrastructure (Next.js, shadcn/ui, API proxy) so nothing is thrown away.

---

## Monorepo Restructure

The `apps/` directory is reorganized to reflect the new app topology:

```
apps/
├── admin/       ← Renamed from apps/web. Next.js admin dashboard.
├── api/         ← Unchanged. Hono REST API.
├── ios/         ← Unchanged. SwiftUI consumer app.
└── marketing/   ← New. Astro static marketing site.
```

### Rename: `apps/web` → `apps/admin`

- Rename the directory
- Update `package.json` name from `@listwell/web` to `@listwell/admin`
- Update all references in `turbo.json`, `pnpm-workspace.yaml`, root `package.json` scripts
- Update `CLAUDE.md` project structure and commands
- Update any CI/CD or deployment configs that reference `@listwell/web`

### New: `apps/marketing`

A lightweight Astro site for the public-facing marketing presence. See [Marketing Site](#marketing-site) section below.

---

## Marketing Site

### Purpose

A simple, fast, static marketing site that tells potential users what Listwell does and sends them to the App Store. This is the public face of the product — what you'd link to from social media, the App Store marketing URL field, or anywhere you need a web presence.

### Technology

**Astro** — static site generator. No client-side JavaScript framework needed. Outputs plain HTML/CSS with zero JS by default. Fast, simple, cheap to host.

- Astro with static output mode
- Tailwind CSS (shared design tokens where applicable)
- Deployed to Vercel (or any static host)
- Workspace package: `@listwell/marketing`

### Pages

**Landing Page (`/`):**
- Hero section: headline, subheadline, App Store download button
- "How it works" — 3-4 step visual walkthrough (snap photos → AI generates listing → copy to marketplace)
- Key benefits (saves time, AI pricing research, photo enhancement)
- Social proof section (placeholder for future testimonials/stats)
- Footer with links (privacy policy, terms, support email)

**Privacy Policy (`/privacy`):**
- Required for App Store submission
- Standard privacy policy covering data collection, usage, third-party services (Apple IAP, AI processing)

**Terms of Service (`/terms`):**
- Standard terms for a consumer app

**Support (`/support`):**
- Simple page with support email and/or FAQ
- Required for App Store — the support URL field

### Design

- Clean, minimal, modern — consistent with the Listwell brand
- Mobile-responsive (potential users may land here from phone)
- Dark/light mode optional (nice-to-have, not required)
- App Store badge prominently placed
- No signup forms, no web app login — this site has zero interactive features

### Non-Goals

- Blog or content marketing
- SEO-optimized landing pages for specific keywords
- Analytics or tracking (can be added later)
- User accounts or any authenticated features

---

## Admin Access

### Role Model

A `role` column is added to the `user` table with values `user` (default) and `admin`. Admin role is assigned directly via database update — there is no self-service admin signup.

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'your@email.com';
```

### Auth Flow

Admins log in with the same email/password auth as regular users. The API checks the `role` field and rejects non-admin requests to admin endpoints with 403. The web app redirects non-admin users to a "not authorized" page.

### Admin API Middleware

A new `requireAdmin` middleware wraps `requireAuth` and additionally checks `user.role === 'admin'`. All admin routes use this middleware.

---

## Core Features

### 1. Dashboard (Home)

The landing page after admin login. Shows key business metrics at a glance.

**Primary Metrics (top cards):**
- **Total Revenue** — Sum of all Apple IAP purchases (gross)
- **Net Revenue** — After Apple's 30% commission
- **Total AI Costs** — Sum of all agent processing costs
- **Margin** — Net Revenue minus Total AI Costs

**Secondary Metrics:**
- Total users / new users (last 7 days / 30 days)
- Total listings created / completed / errored
- Credits purchased / credits used / credits remaining (system-wide)
- Average cost per listing

**Charts:**
- Revenue vs. costs over time (daily, weekly, monthly toggles)
- Listings created per day
- New user signups per day

**Quick Actions:**
- Link to users list
- Link to errored listings
- Link to recent activity

---

### 2. Users

**Users List View:**
- Table with columns: name, email, signup date, last active, credit balance, total listings, status
- Search by name or email
- Sort by any column
- Filter by: has credits, has listings, signed up in date range

**User Detail View:**
- Profile info (name, email, signup date, last active)
- Credit balance with full transaction history (type, amount, date, associated listing, Apple transaction ID)
- All listings with status badges
- Ability to click through to any listing detail

**User Actions:**
- **Grant Credits** — Add credits to a user's balance with a required reason (e.g., "compensation for failed listing", "beta tester reward"). Creates a `MANUAL_GRANT` credit transaction.
- **Deduct Credits** — Remove credits with a required reason. Creates a `MANUAL_DEDUCT` credit transaction. Cannot go below zero.
- **Suspend User** — Blocks the user from creating new listings. Existing listings are unaffected. The user can still log in and view their listings, but the "create listing" endpoint returns 403 with a message. Requires a reason. Recorded in the user's activity timeline.
- **Unsuspend User** — Restores full access. Requires a reason. Recorded in the user's activity timeline.

**Suspension Enforcement:**
- A `suspended` boolean flag on the `user` table (default `false`)
- A `suspendedReason` text field (set when suspended, cleared when unsuspended)
- The `POST /listings` endpoint checks suspension status before accepting new listings
- The iOS app receives a clear error message it can display to the user
- Suspension does NOT block login, viewing existing listings, purchasing credits, or image enhancement on existing listings

---

### 3. Listings (Admin View)

**All Listings View:**
- Table showing listings across ALL users (not just the admin's)
- Columns: thumbnail, title, user, status, pipeline status, cost, created date
- Filter by: status, pipeline status, user, date range, has error
- Sort by any column
- Quick filter tabs: All, Processing, Errored, Ready

**Listing Detail View (Admin):**
- Everything the user sees (images, title, description, pricing, comparables, research notes)
- Plus admin-only info:
  - Processing cost (tokens used, USD cost)
  - Agent log with timestamps
  - Link to full agent transcript
  - Pipeline error details (if errored)
  - Credit transaction associated with this listing
  - User who created it (link to user detail)

---

### 4. Revenue & Costs

**Revenue Tracking:**
- Every `PURCHASE` credit transaction represents an Apple IAP
- Revenue per purchase = price paid by user (e.g., $4.99 for 5 credits)
- Net revenue = gross × 0.70 (Apple takes 30%)
- Track by: day, week, month, all-time
- Show: gross revenue, Apple commission, net revenue

**Cost Tracking:**
- Per-listing AI processing cost stored when the agent completes
- Source: token usage from the Anthropic API provider (already calculated, currently discarded)
- For E2B provider: parse Claude CLI output for usage data, or estimate from transcript
- Stored on the listing record: `agentCostUsd`, `agentInputTokens`, `agentOutputTokens`
- Aggregated: total costs by day/week/month, average cost per listing

**Margin View:**
- Net revenue minus AI costs = operating margin
- Displayed as: absolute dollars, percentage, trend over time
- Per-listing economics: revenue per credit used vs. cost per listing

**Note on cost completeness:** AI processing (Claude API) is the only cost tracked initially. Storage, compute, and other infrastructure costs are excluded — they're negligible at current scale and can be added later.

---

### 5. User Activity Timeline

A chronological log of everything a user has done in the app — the primary tool for customer support. When a user calls in with a problem, the admin pulls up their timeline and replays their experience.

**Tracked Events (automatic, system-generated):**
- Account created
- Login / session start
- Credits purchased (Apple IAP)
- Free credits granted (initial signup bonus)
- Listing created (photos uploaded, description submitted)
- Listing submitted to pipeline
- Pipeline step transitions (analyzing → researching → generating → complete/error)
- Listing ready (agent finished successfully)
- Listing errored (with error message)
- Credit used (deducted for listing)
- Credit refunded (pipeline failure)
- Image enhancement requested / completed / failed
- Account suspended / unsuspended by admin
- Credits manually granted/deducted by admin (with reason)

**Timeline View (on User Detail page):**
- Reverse-chronological feed of all events for that user
- Each entry: timestamp, event type, description, associated resource (listing, transaction)
- Click any listing or transaction reference to jump to its detail view
- Filter by event type or date range
- Visual distinction between user-initiated events, system events, and admin actions

**Goal:** An admin should be able to reconstruct exactly what happened during a user's session — what they submitted, what the system did, where it broke — without asking the user to explain.

**Schema:**
```
userActivityLog:
  id, userId, eventType, description, resourceType, resourceId, metadata (json), createdAt
```

The activity log is append-only and write-heavy. Events are written by the API as side effects of existing operations (listing creation, pipeline steps, purchases, etc.) — not by a separate event bus. Admin-initiated actions (credit grants, suspensions) are also recorded here with the admin's identity in metadata.

---

### 6. Error Investigation

**Errored Listings View:**
- Filtered view of all listings with `pipelineStatus = 'ERROR'`
- Shows: user, listing thumbnail, error message, date, whether credit was refunded
- Click through to full listing detail with agent log and transcript

**Agent Log Inspection:**
- The `agentLog` JSON field contains timestamped entries of what the agent did
- The `agentTranscriptUrl` links to the full JSONL transcript
- Admin can view both inline to diagnose what went wrong

**Goal:** When a user reports "my listing failed," the admin can find it in seconds, see exactly what happened, and decide whether to grant replacement credits.

---

## Data Model Changes

### Modified Tables

**`user` table:**
- Add `role` column: `text("role").notNull().default("user")` — values: `user`, `admin`
- Add `suspended` column: `boolean("suspended").notNull().default(false)`
- Add `suspendedReason` column: `text("suspended_reason")` — nullable, set when suspended

**`listings` table:**
- Add `agentCostUsd` column: `real("agent_cost_usd")` — nullable, set on agent completion
- Add `agentInputTokens` column: `integer("agent_input_tokens")` — nullable
- Add `agentOutputTokens` column: `integer("agent_output_tokens")` — nullable
- Add `agentProvider` column: `text("agent_provider")` — which provider processed this listing

**`creditTransactions` table:**
- Add transaction types: `MANUAL_GRANT`, `MANUAL_DEDUCT` (in addition to existing FREE_GRANT, PURCHASE, USAGE, REFUND)
- Add `adminUserId` column: `text("admin_user_id")` — nullable, set for admin-initiated transactions
- Add `reason` column: `text("reason")` — nullable, required for manual transactions

### New Tables

**`userActivityLog`:**
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| userId | text | FK to user — the user whose timeline this event belongs to |
| eventType | text | e.g., ACCOUNT_CREATED, LISTING_SUBMITTED, PIPELINE_ERROR, CREDITS_PURCHASED, SUSPENDED, MANUAL_CREDIT_GRANT |
| description | text | Human-readable summary of what happened |
| resourceType | text | e.g., "listing", "creditTransaction", "image" — nullable |
| resourceId | text | ID of the associated resource — nullable |
| metadata | json | Event-specific structured data (e.g., admin ID for admin actions, error details for failures, token counts for pipeline events) |
| createdAt | timestamp | Indexed for efficient timeline queries |

Indexes: `(userId, createdAt DESC)` for fast user timeline lookups, `(eventType, createdAt DESC)` for filtering by event type across users.

---

## API Routes (Admin)

All admin routes are prefixed with `/admin` and use the `requireAdmin` middleware.

| Route | Method | Purpose |
|-------|--------|---------|
| `/admin/dashboard` | GET | Aggregated metrics for dashboard |
| `/admin/users` | GET | Paginated user list with search/filter |
| `/admin/users/:id` | GET | User detail with credits and listings |
| `/admin/users/:id/credits` | POST | Grant or deduct credits (with reason) |
| `/admin/users/:id/suspend` | POST | Suspend or unsuspend user (with reason) |
| `/admin/users/:id/activity` | GET | Paginated activity timeline for a user |
| `/admin/listings` | GET | All listings across all users with filters |
| `/admin/listings/:id` | GET | Listing detail with admin-only fields |
| `/admin/revenue` | GET | Revenue aggregation (by period) |
| `/admin/costs` | GET | Cost aggregation (by period) |
| `/admin/activity` | GET | Global activity feed across all users (filterable) |

---

## Admin App Changes (`apps/admin`, formerly `apps/web`)

### What Gets Removed

All consumer-facing pages and components:
- Login/register (replaced with admin login)
- Listings feed, new listing flow, capture, describe
- Listing detail (consumer version)
- Preferences, push notification prompts
- Voice input, image carousel (consumer context)
- Service worker, PWA manifest, offline concerns
- Any client-side listing creation logic

### What Gets Kept

- Next.js App Router infrastructure
- shadcn/ui component library
- Tailwind CSS with design system tokens
- API proxy rewrites (`/api/*` → Hono API)
- `apiFetch()` for server component data fetching
- BetterAuth client (for admin login)
- Dark mode support (next-themes)

### What Gets Built

- Admin layout with sidebar navigation
- Dashboard page with metric cards and charts
- Users list and detail pages
- Listings list and detail pages (admin view)
- Revenue & costs page
- User activity timeline (per-user and global views)
- Credit management modals
- Suspend/unsuspend user controls
- Admin login page (same auth, but redirects non-admins)

---

## UI Approach

The admin dashboard follows a standard internal-tool layout:

- **Sidebar navigation** — Dashboard, Users, Listings, Revenue & Costs, Activity
- **Data tables** — shadcn/ui `DataTable` with sorting, filtering, pagination
- **Metric cards** — Key numbers with trend indicators
- **Charts** — Simple line/bar charts for time-series data (Recharts, already a shadcn/ui chart dependency)
- **Detail pages** — Clean layouts showing all relevant info for a user or listing
- **Modals** — For actions like granting credits (form with amount + reason)

Mobile-first is NOT a priority for this app. It's a desktop/laptop tool. Standard responsive behavior from shadcn/ui is sufficient.

---

## Pipeline Cost Tracking (Implementation Detail)

The agent providers already compute cost data, but it's currently discarded. The fix:

1. **Anthropic API provider** — Already calculates `costUsd` from token counts. Pass it through.
2. **E2B provider** — Currently hardcodes `costUsd: 0`. Investigate whether Claude CLI's `--output-format stream-json` includes usage/cost data. If yes, parse it. If no, estimate from transcript size or fall back to 0 with a TODO.
3. **Generate-listing Inngest function** — Currently destructures `{ output, transcriptUrl }` from agent result and discards `costUsd`. Update to also store `costUsd`, `inputTokens`, `outputTokens`, and `provider` on the listing record.

This is a low-effort, high-value change since the infrastructure already exists.

---

## Non-Goals (v1)

- Multi-admin team with granular permissions
- Automated alerting or paging
- Direct user communication (email/push from admin)
- Automated cost optimization or budget caps
- Customer-facing support portal
- Export to CSV/spreadsheets
- Revenue forecasting or projections
- A/B testing or feature flags management

---

## Build Strategy

### Phase 0 — Monorepo Restructure

Rename and scaffold before building anything.

- Rename `apps/web` → `apps/admin` (directory, package name, all references)
- Scaffold `apps/marketing` as an Astro project with Tailwind
- Update `turbo.json`, workspace config, root scripts, `CLAUDE.md`
- Verify `pnpm dev`, `pnpm build`, `pnpm typecheck` still work across all apps

### Phase 1 — Foundation

Schema changes, admin auth, API infrastructure, and the admin app shell.

- Add `role`, `suspended`, `suspendedReason` columns to users
- Add cost columns to listings
- Create `userActivityLog` table
- Build `requireAdmin` middleware
- Add suspension check to `POST /listings`
- Strip consumer pages from admin app
- Build admin layout with sidebar navigation
- Admin login flow (reject non-admins)

### Phase 2 — Users & Account Management

The most immediately useful feature — see your users, manage credits, and handle abuse.

- Users list with search and filters
- User detail with credit history, listings, and activity timeline
- Grant/deduct credits
- Suspend/unsuspend users
- Activity timeline view (per-user and global)
- Instrument existing API operations to write activity log events

### Phase 3 — Dashboard & Metrics

The birds-eye view of the business.

- Dashboard page with metric cards
- Revenue tracking and aggregation
- Cost tracking (wire up pipeline cost storage)
- Margin calculation
- Time-series charts

### Phase 4 — Listings & Error Investigation

Admin visibility into all listings and the ability to diagnose problems.

- All-listings view with filters
- Admin listing detail with cost and agent log info
- Errored listings quick filter
- Agent transcript viewer

### Phase 5 — Marketing Site

Build out the public-facing Astro site.

- Landing page with hero, how-it-works, benefits, App Store link
- Privacy policy page
- Terms of service page
- Support page
- Deploy configuration

---

## Open Items

- **E2B cost data** — Does Claude CLI output token usage in its JSON stream? Needs investigation. If not, we may need to switch fully to the Anthropic API provider or accept estimated costs for E2B-processed listings.
- **Apple IAP price mapping** — The current credit pack is $4.99 for 5 credits. This price needs to be stored or configured somewhere for revenue calculations. If pricing changes or new tiers are added, the revenue calculation needs to handle historical prices.
- **Chart library** — shadcn/ui has a charts component built on Recharts. Confirm it meets the needs for time-series revenue/cost/margin charts.
- **Listing cost backfill** — Existing listings have no cost data. Decide whether to backfill from transcripts or accept that historical data starts from when cost tracking is implemented.
