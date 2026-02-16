# Implementation Tasks

> Generated from docs/plan.md on 2026-02-15
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

### Wave 1: Foundation

- **Phase 0**: Project Foundation — must complete before all other work

### Wave 2: Auth & Core CRUD

- **Phase 1**: Authentication, Listings CRUD, All Core UI Screens

### Wave 3: AI Pipeline + Voice (parallel)

- **Phase 2**: AI Pipeline — Inngest, AgentSDK, Vision, Listing Generation
- **Phase 4**: Voice Input & Polish _(depends on Phase 1, independent of Phase 2)_

### Wave 4: Enhancement + Intelligence (parallel)

- **Phase 3**: Image Enhancement — Gemini API _(depends on Phase 2)_
- **Phase 5**: Listing Intelligence — Post-MVP _(depends on Phase 2)_

---

## Progress Summary

- Phase 0: [x] Complete
- Phase 1: [x] Complete
- Phase 2: [ ] Not Started
- Phase 3: [ ] Not Started
- Phase 4: [ ] Not Started
- Phase 5: [ ] Not Started
- **MVP Status:** Not Started

---

## Phase 0: Project Foundation

### 0.0 Pre-flight

- [x] 0.0.1: Read CLAUDE.md and confirm understanding of project conventions
- [x] 0.0.2: Verify no uncommitted changes in working directory

### 0.1 Project Initialization

- [x] 0.1.1: Initialize Next.js project with App Router and TypeScript (strict mode)
  - Files: package.json, tsconfig.json, next.config.ts, src/app/layout.tsx, src/app/page.tsx
  - Test: `npm run dev` starts without errors
- [x] 0.1.2: Configure ESLint with Next.js recommended rules
  - Files: eslint.config.mjs, package.json
  - Test: `npm run lint` passes
- [x] 0.1.3: Configure Prettier for code formatting
  - Files: .prettierrc, .prettierignore, package.json
  - Test: `npm run format` works
- [x] 0.1.4: Configure Vitest as test framework with React Testing Library
  - Files: vitest.config.ts, vitest.setup.ts, package.json
  - Test: `npm run test` executes (0 tests OK)
- [x] 0.1.5: Set up Tailwind CSS v4 with design system CSS variables from `docs/design-system.md`
  - Files: src/app/globals.css, tailwind.config.ts (if needed)
  - Screens: `docs/design-system.md` § Color Tokens, Typography
  - Test: Tailwind classes render correctly in dev

### 0.2 shadcn/ui & Design System

- [x] 0.2.1: Initialize shadcn/ui with project configuration
  - Files: components.json, src/lib/utils.ts
  - Test: shadcn CLI works (`npx shadcn@latest add button`)
- [x] 0.2.2: Install core shadcn/ui components needed for Phase 1
  - Components: Button, Card, CardHeader, CardContent, CardFooter, Badge, Input, Label, Tabs, TabsList, TabsTrigger, TabsContent, Textarea, Skeleton, DropdownMenu, Sheet, AlertDialog, Sonner (toast)
  - Files: src/components/ui/*
  - Test: Components import without errors
- [x] 0.2.3: Configure next-themes for dark mode support (class strategy)
  - Files: src/app/layout.tsx, src/components/theme-provider.tsx
  - Screens: `docs/design-system.md` § Dark Mode
  - Test: Dark mode toggle switches theme correctly
- [x] 0.2.4: Apply design system color tokens (light + dark) to globals.css
  - Files: src/app/globals.css
  - Screens: `docs/design-system.md` § Color Tokens
  - Test: CSS variables defined for both :root and .dark

### 0.3 Project Structure

- [x] 0.3.1: Create folder structure per PRD conventions
  - Folders: src/app/, src/components/ui/, src/components/, src/lib/, src/db/, src/inngest/, src/types/
  - Test: Folders exist
- [x] 0.3.2: Verify build succeeds with `npm run build`
- [x] 0.3.3: Verify dev server starts without errors
- [x] 0.3.4: Verify test runner executes successfully

### 0.4 Database Setup

- [x] 0.4.1: Create Docker Compose file for local PostgreSQL
  - Files: docker-compose.yml
  - Test: `docker compose up -d` starts PostgreSQL
- [x] 0.4.2: Install Drizzle ORM and Neon serverless driver
  - Files: package.json
  - Test: Packages installed
- [x] 0.4.3: Configure Drizzle with Neon serverless driver
  - Files: src/db/index.ts, drizzle.config.ts
  - Test: DB connection works (select 1)
- [x] 0.4.4: Create Drizzle schema for listings table with all fields from PRD data model
  - Fields: id (cuid), userId, rawDescription, title, description, suggestedPrice, priceRangeLow, priceRangeHigh, category, condition, brand, model, researchNotes, comparables (json), status (enum), pipelineStep (enum), pipelineError, inngestRunId, createdAt, updatedAt
  - Files: src/db/schema.ts
  - Test: TypeScript compiles, schema exports correctly
- [x] 0.4.5: Create Drizzle schema for listing_images table with all fields from PRD data model
  - Fields: id (cuid), listingId (FK), type (enum: ORIGINAL/ENHANCED), blobUrl, blobKey, parentImageId (FK to self), sortOrder, isPrimary, geminiPrompt, createdAt
  - Files: src/db/schema.ts
  - Test: TypeScript compiles, relations defined correctly
- [x] 0.4.6: Run initial migration to create tables
  - Files: migrations/
  - Test: `npx drizzle-kit push` or `npx drizzle-kit migrate` succeeds
- [x] 0.4.7: Write tests for schema validation and basic DB operations
  - Files: src/db/__tests__/schema.test.ts
  - Test: Tests pass with ≥80% coverage on schema

### 0.5 Development Tooling

- [x] 0.5.1: Create .env.example with all required environment variables
  - Vars: DATABASE_URL, NEXT_PUBLIC_APP_URL, BETTER_AUTH_SECRET, VERCEL_BLOB_READ_WRITE_TOKEN, INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
  - Files: .env.example, .gitignore
- [x] 0.5.2: Create .env.local from .env.example with local development values
  - Files: .env.local
- [x] 0.5.3: Update .gitignore for Next.js, env files, and node_modules
  - Files: .gitignore

**Phase 0 Checkpoint:**

- [x] Fresh clone + `npm install` + `docker compose up -d` + `npm run dev` works
- [x] All scripts functional: dev, build, test, lint, typecheck
- [x] Database connection verified with local PostgreSQL
- [x] Design system tokens applied (light + dark mode)
- [x] shadcn/ui components installed and importable
- [x] Code coverage infrastructure configured (≥80% threshold)
- [x] Commit: "chore: complete project foundation (Phase 0)"

---

## Phase 1: Authentication & Core CRUD

### 1.1 Authentication

- [x] 1.1.1: Install and configure BetterAuth with Drizzle adapter (PostgreSQL provider)
  - Files: src/lib/auth.ts, src/lib/auth-client.ts, package.json
  - Test: Auth instance created without errors
- [x] 1.1.2: Create BetterAuth API route handler
  - Files: src/app/api/auth/[...all]/route.ts
  - Test: GET /api/auth/ok returns 200
- [x] 1.1.3: Generate and run BetterAuth database tables migration
  - Files: src/db/schema.ts (add auth tables if needed), migrations/
  - Test: Auth tables exist in database
- [x] 1.1.4: Create auth middleware for protecting routes
  - Files: src/lib/auth-middleware.ts, src/middleware.ts
  - Test: Unauthenticated requests redirect to /login
- [x] 1.1.5: Build Login/Register screen with Tabs component
  - Files: src/app/login/page.tsx
  - Screens: `docs/screens.md` § Screen 1: Login/Register — `docs/design-system.md`
  - Test: Login and register forms render, tab switching works
- [x] 1.1.6: Implement login form submission with BetterAuth client
  - Files: src/app/login/page.tsx
  - Test: Successful login redirects to /, error shows inline message
- [x] 1.1.7: Implement register form submission with BetterAuth client
  - Files: src/app/login/page.tsx
  - Test: Successful registration redirects to /, error shows inline message
- [x] 1.1.8: Write tests for auth flow (login, register, protected routes)
  - Files: src/app/login/__tests__/page.test.tsx, src/lib/__tests__/auth.test.ts
  - Test: Tests pass with ≥80% coverage

### 1.2 Listings API

- [x] 1.2.1: Create listings API route — GET /api/listings (list all user listings)
  - Files: src/app/api/listings/route.ts
  - Test: Returns array of listings filtered by authenticated user, sorted by createdAt desc
- [x] 1.2.2: Create listings API route — POST /api/listings (create listing + upload images)
  - Files: src/app/api/listings/route.ts
  - Test: Creates listing record, uploads images to Vercel Blob, returns listing
- [x] 1.2.3: Create listing detail API route — GET /api/listings/[id]
  - Files: src/app/api/listings/[id]/route.ts
  - Test: Returns full listing with images, only if owned by authenticated user
- [x] 1.2.4: Create listing update API route — PATCH /api/listings/[id]
  - Files: src/app/api/listings/[id]/route.ts
  - Test: Updates listing fields (status, manual edits), validates ownership
- [x] 1.2.5: Create listing delete API route — DELETE /api/listings/[id]
  - Files: src/app/api/listings/[id]/route.ts
  - Test: Deletes listing and associated images from DB and Vercel Blob
- [x] 1.2.6: Create image delete API route — DELETE /api/listings/[id]/images
  - Files: src/app/api/listings/[id]/images/route.ts
  - Test: Deletes specific enhanced image variant, validates ownership
- [x] 1.2.7: Implement Vercel Blob upload helper for listing images
  - Files: src/lib/blob.ts
  - Test: Upload function stores image and returns URL + key
- [x] 1.2.8: Write tests for all listings API routes
  - Files: src/app/api/listings/__tests__/route.test.ts, src/app/api/listings/[id]/__tests__/route.test.ts
  - Test: Tests pass with ≥80% coverage

### 1.3 Shared Components

- [x] 1.3.1: Create ListingStatusBadge component with status color mapping
  - Files: src/components/listing-status-badge.tsx
  - Screens: `docs/screens.md` § Shared Components — `docs/design-system.md` § Status Colors
  - Test: Renders correct colors/icons for each status (DRAFT, PROCESSING, READY, LISTED, SOLD, ARCHIVED, ERROR)
- [x] 1.3.2: Create CopyButton component with clipboard + toast feedback
  - Files: src/components/copy-button.tsx
  - Screens: `docs/screens.md` § CopyButton — `docs/design-system.md`
  - Test: Copies text, shows Check icon for 2s, triggers Sonner toast
- [x] 1.3.3: Create BottomBar component (fixed bottom action container)
  - Files: src/components/bottom-bar.tsx
  - Screens: `docs/screens.md` § BottomBar — `docs/design-system.md` § Bottom Action Bar
  - Test: Renders fixed at bottom with blur backdrop
- [x] 1.3.4: Create EmptyState component
  - Files: src/components/empty-state.tsx
  - Screens: `docs/screens.md` § EmptyState — `docs/design-system.md`
  - Test: Renders icon, title, and description centered
- [x] 1.3.5: Create FAB (Floating Action Button) component
  - Files: src/components/fab.tsx
  - Screens: `docs/screens.md` § FAB — `docs/design-system.md` § Floating Action Button
  - Test: Renders fixed bottom-right with Plus icon
- [x] 1.3.6: Write tests for all shared components
  - Files: src/components/__tests__/*.test.tsx
  - Test: Tests pass with ≥80% coverage

### 1.4 Listings Feed Screen

- [x] 1.4.1: Create ListingCard component for feed display
  - Files: src/components/listing-card.tsx
  - Screens: `docs/screens.md` § ListingCard Component — `docs/design-system.md`
  - Test: Renders thumbnail, title, price, status badge, pipeline progress, timeAgo
- [x] 1.4.2: Build Listings Feed page (home screen) with header, filter row, and cards
  - Files: src/app/(authenticated)/page.tsx
  - Screens: `docs/screens.md` § Screen 2: Listings Feed — `docs/design-system.md`
  - Test: Fetches and displays listings, shows empty state when no listings
- [x] 1.4.3: Add overflow menu with logout action
  - Files: src/app/(authenticated)/page.tsx
  - Test: Dropdown shows, logout works
- [x] 1.4.4: Write tests for listings feed
  - Files: src/app/(authenticated)/__tests__/page.test.tsx, src/components/__tests__/listing-card.test.tsx
  - Test: Tests pass with ≥80% coverage

### 1.5 New Listing Flow

- [x] 1.5.1: Build New Listing — Capture screen with photo grid and camera/gallery buttons
  - Files: src/app/(authenticated)/new/page.tsx, src/components/image-grid.tsx
  - Screens: `docs/screens.md` § Screen 3: New Listing — Capture — `docs/design-system.md`
  - Test: Can add/remove photos (1-5), Take Photo triggers camera input, Choose from Library triggers gallery
- [x] 1.5.2: Build New Listing — Describe screen with text area and thumbnail strip
  - Files: src/app/(authenticated)/new/describe/page.tsx
  - Screens: `docs/screens.md` § Screen 4: New Listing — Describe — `docs/design-system.md`
  - Test: Text area works, thumbnail strip shows captured photos, Skip and Generate buttons work
- [x] 1.5.3: Implement listing submission flow (upload images to Blob, create listing via API)
  - Files: src/app/(authenticated)/new/describe/page.tsx, src/lib/listing-actions.ts
  - Test: Photos uploaded to Vercel Blob, listing created in DB with status DRAFT
- [x] 1.5.4: Build New Listing — Submitted confirmation screen
  - Files: src/app/(authenticated)/new/submitted/page.tsx
  - Screens: `docs/screens.md` § Screen 5: New Listing — Submitted — `docs/design-system.md`
  - Test: Shows confirmation message, "Back to Listings" navigates to feed
- [x] 1.5.5: Create state management for multi-step new listing flow (photos + description across screens)
  - Files: src/lib/new-listing-context.tsx
  - Test: State persists across capture → describe → submit
- [x] 1.5.6: Write tests for new listing flow
  - Files: src/app/(authenticated)/new/__tests__/*.test.tsx
  - Test: Tests pass with ≥80% coverage

### 1.6 Listing Detail Screen

- [x] 1.6.1: Build image carousel component with scroll-snap and dot indicators
  - Files: src/components/image-carousel.tsx
  - Screens: `docs/screens.md` § Image Carousel — `docs/design-system.md` § Image Display Conventions
  - Test: Swipe between images, dots indicate current image
- [x] 1.6.2: Build Listing Detail — Ready page with all sections
  - Sections: status badge, title + copy, price card, description + copy, product details grid, comparables list, market notes
  - Files: src/app/(authenticated)/listings/[id]/page.tsx
  - Screens: `docs/screens.md` § Screen 7: Listing Detail — Ready — `docs/design-system.md`
  - Test: All sections render with listing data
- [x] 1.6.3: Implement "Copy Full Listing" bottom bar action
  - Files: src/app/(authenticated)/listings/[id]/page.tsx
  - Test: Copies formatted title + price + description to clipboard, shows toast
- [x] 1.6.4: Implement dropdown menu actions (Mark as Listed, Mark as Sold, Archive, Delete)
  - Files: src/app/(authenticated)/listings/[id]/page.tsx
  - Test: Status updates via PATCH, delete shows confirmation dialog then deletes
- [x] 1.6.5: Build delete listing confirmation dialog
  - Files: src/app/(authenticated)/listings/[id]/page.tsx
  - Screens: `docs/screens.md` § Confirmation Dialogs — Delete Listing
  - Test: Dialog shows, cancel dismisses, confirm deletes and navigates to feed
- [x] 1.6.6: Write tests for listing detail screen
  - Files: src/app/(authenticated)/listings/[id]/__tests__/page.test.tsx
  - Test: Tests pass with ≥80% coverage

### 1.7 PWA Configuration

- [x] 1.7.1: Create web app manifest with Listwell branding and design system colors
  - Files: src/app/manifest.ts
  - Screens: `docs/design-system.md` § Color Tokens
  - Test: Manifest accessible at /manifest.webmanifest
- [x] 1.7.2: Create service worker shell for basic asset caching
  - Files: public/sw.js
  - Test: Service worker registers on page load
- [x] 1.7.3: Add viewport meta tags for edge-to-edge display on notched phones
  - Files: src/app/layout.tsx
  - Test: viewport-fit=cover applied, safe area insets respected

**Phase 1 Checkpoint:**

- [x] User can register and log in with email/password
- [x] Listings feed displays all user listings with status badges
- [x] User can capture photos, describe item, and submit a new listing
- [x] Listing detail shows all generated content with copy functionality
- [x] PWA manifest and service worker are functional
- [x] App is responsive and follows design system
- [x] All tests pass with ≥80% code coverage on Phase 1 code
- [x] No TypeScript errors
- [x] Commit: "feat: complete auth and core CRUD (Phase 1)"

---

## Phase 2: AI Pipeline

### 2.1 Inngest Setup

- [ ] 2.1.1: Install Inngest SDK and configure client
  - Files: src/inngest/client.ts, package.json
  - Test: Inngest client initializes without errors
- [ ] 2.1.2: Create Inngest serve route handler
  - Files: src/app/api/inngest/route.ts
  - Test: GET /api/inngest returns Inngest dashboard info
- [ ] 2.1.3: Write tests for Inngest setup
  - Files: src/inngest/__tests__/client.test.ts
  - Test: Tests pass

### 2.2 Consolidated Agent Setup

- [ ] 2.2.1: Install Anthropic SDK and AgentSDK packages
  - Files: package.json
  - Test: Packages installed, imports resolve
- [ ] 2.2.2: Set up Vercel Sandbox + AgentSDK integration
  - Files: src/lib/ai/agent.ts
  - Test: Sandbox environment can be created, agent session starts
- [ ] 2.2.3: Build agent system prompt that covers the full listing generation pipeline
  - Responsibilities: image analysis (product identification, brand, model, condition), web research (eBay sold listings, FB Marketplace, Amazon comps), and listing writing (title, description, price, market notes)
  - Files: src/lib/ai/prompts/listing-agent-prompt.ts
  - Ref: `docs/selling-strategy.md` — all sections (title construction, description voice/tone, pricing strategy, condition assessment, category tactics, market notes template)
  - Test: Prompt includes all selling strategy rules, structured output format is defined
- [ ] 2.2.4: Define structured output schema for agent results
  - Fields: title, description, suggestedPrice, priceRangeLow, priceRangeHigh, category, condition, brand, model, researchNotes, comparables[], pipelineStep progress callbacks
  - Files: src/lib/ai/agent-output-schema.ts
  - Test: Schema validates expected agent output structure
- [ ] 2.2.5: Write tests for agent setup and prompt
  - Files: src/lib/ai/__tests__/agent.test.ts
  - Test: Tests pass with ≥80% coverage

### 2.3 Listing Generate Inngest Function

- [ ] 2.3.1: Implement `run-agent` Inngest step — spins up Vercel Sandbox with AgentSDK, passes image URLs + user description, agent performs full pipeline (analyze → research → write) in one session
  - Files: src/inngest/functions/generate-listing.ts
  - Test: Agent returns structured result with all listing fields populated
- [ ] 2.3.2: Add pipelineStep progress updates within agent execution — agent updates DB directly as it transitions between analyzing, researching, and generating phases
  - Files: src/inngest/functions/generate-listing.ts, src/lib/ai/agent.ts
  - Test: pipelineStep updates to ANALYZING → RESEARCHING → GENERATING during agent run
- [ ] 2.3.3: Implement `complete` Inngest step (separate from agent) — save structured results to DB, mark status READY
  - Files: src/inngest/functions/generate-listing.ts
  - Test: Listing record updated with all generated fields, status = READY, pipelineStep = COMPLETE
- [ ] 2.3.4: Wire up full `listing.generate` function with both Inngest steps
  - Files: src/inngest/functions/generate-listing.ts
  - Test: End-to-end: run-agent returns results → complete saves to DB
- [ ] 2.3.5: Register generate-listing function in Inngest serve route
  - Files: src/app/api/inngest/route.ts
  - Test: Function appears in Inngest dev dashboard
- [ ] 2.3.6: Write tests for generate-listing Inngest function
  - Files: src/inngest/functions/__tests__/generate-listing.test.ts
  - Test: Tests pass with ≥80% coverage

### 2.4 Pipeline Status & UI

- [ ] 2.4.1: Update listing creation flow to trigger `listing.submitted` Inngest event after upload
  - Files: src/app/api/listings/route.ts (POST handler)
  - Test: Creating a listing sends Inngest event with listingId and imageUrls
- [ ] 2.4.2: Verify pipelineStep updates propagate from agent execution to the DB
  - Files: src/inngest/functions/generate-listing.ts
  - Test: pipelineStep transitions visible in DB: ANALYZING → RESEARCHING → GENERATING → COMPLETE
- [ ] 2.4.3: Build Listing Detail — Processing screen with live pipeline step indicators
  - Files: src/app/(authenticated)/listings/[id]/page.tsx, src/components/pipeline-steps.tsx
  - Screens: `docs/screens.md` § Screen 6: Listing Detail — Processing — `docs/design-system.md`
  - Test: Shows step icons (completed/active/pending), step labels, active spinner
- [ ] 2.4.4: Implement polling for pipeline status updates (poll GET /api/listings/[id] every 3-5s)
  - Files: src/app/(authenticated)/listings/[id]/page.tsx
  - Test: Status transitions from PROCESSING to READY auto-refreshes the view
- [ ] 2.4.5: Build error state with retry button
  - Files: src/app/(authenticated)/listings/[id]/page.tsx
  - Screens: `docs/screens.md` § Screen 9: Error Recovery — `docs/design-system.md`
  - Test: Error card shows pipelineError, retry resets pipeline and re-triggers Inngest
- [ ] 2.4.6: Write tests for pipeline UI
  - Files: src/components/__tests__/pipeline-steps.test.tsx
  - Test: Tests pass with ≥80% coverage

### 2.5 Push Notifications

- [ ] 2.5.1: Generate VAPID keys and add to environment variables
  - Files: .env.example, .env.local
  - Test: Keys generated and stored
- [ ] 2.5.2: Install web-push library and create notification helper
  - Files: src/lib/notifications.ts, package.json
  - Test: Can send test notification
- [ ] 2.5.3: Add push subscription management (subscribe/unsubscribe server actions)
  - Files: src/lib/push-actions.ts, src/db/schema.ts (push_subscriptions table)
  - Test: Subscription stored in DB, can be retrieved by userId
- [ ] 2.5.4: Update service worker to handle push events and notification clicks
  - Files: public/sw.js
  - Test: Push event displays notification, click opens app
- [ ] 2.5.5: Add push subscription prompt in the app (after first listing submission)
  - Files: src/components/push-prompt.tsx
  - Test: Prompt shows, user can accept or dismiss
- [ ] 2.5.6: Trigger push notification in Inngest `complete` step (the separate step after agent execution)
  - Files: src/inngest/functions/generate-listing.ts
  - Test: Notification sent when listing status transitions to READY
- [ ] 2.5.7: Write tests for push notification system
  - Files: src/lib/__tests__/notifications.test.ts
  - Test: Tests pass with ≥80% coverage

**Phase 2 Checkpoint:**

- [ ] Submitting photos triggers consolidated agent pipeline in Vercel Sandbox
- [ ] Agent analyzes images, researches pricing, and writes listing in one session with full context
- [ ] Pipeline progress displays live on the processing screen (agent updates pipelineStep in DB)
- [ ] Completed listings have AI-generated title, description, price, comparables, and market notes
- [ ] Push notification fires when listing is ready
- [ ] Error state shows with retry capability
- [ ] All tests pass with ≥80% code coverage on Phase 2 code
- [ ] No TypeScript errors
- [ ] Commit: "feat: complete AI pipeline (Phase 2)"

---

## Phase 3: Image Enhancement

### 3.1 Gemini Integration

- [ ] 3.1.1: Install Google Generative AI SDK and create Gemini image editing helper
  - Files: src/lib/ai/gemini.ts, package.json
  - Test: Gemini client initializes with API key
- [ ] 3.1.2: Create image enhancement prompt template informed by selling strategy
  - Files: src/lib/ai/enhancement-prompt.ts
  - Ref: `docs/selling-strategy.md` § Image Enhancement Guidance
  - Test: Prompt generates contextual enhancement instructions
- [ ] 3.1.3: Implement `image.enhance` Inngest function with steps: download-original, enhance-with-gemini, upload-enhanced
  - Files: src/inngest/functions/enhance-image.ts
  - Test: Given test image, returns enhanced version stored in Vercel Blob with new ListingImage record
- [ ] 3.1.4: Register enhance-image function in Inngest serve route
  - Files: src/app/api/inngest/route.ts
  - Test: Function appears in Inngest dev dashboard
- [ ] 3.1.5: Create enhancement API route — POST /api/listings/[id]/enhance
  - Files: src/app/api/listings/[id]/enhance/route.ts
  - Test: Triggers Inngest image.enhance.requested event with correct payload
- [ ] 3.1.6: Write tests for Gemini integration and enhance function
  - Files: src/inngest/functions/__tests__/enhance-image.test.ts, src/lib/ai/__tests__/gemini.test.ts
  - Test: Tests pass with ≥80% coverage

### 3.2 Enhancement UI

- [ ] 3.2.1: Build Image Enhancement Sheet component (bottom drawer over detail screen)
  - Files: src/components/image-enhancement-sheet.tsx
  - Screens: `docs/screens.md` § Screen 8: Image Enhancement — `docs/design-system.md`
  - Test: Sheet opens from detail screen, shows original image, enhance button, variants grid
- [ ] 3.2.2: Add "Enhance" button overlay on original images in the detail screen carousel
  - Files: src/app/(authenticated)/listings/[id]/page.tsx, src/components/image-carousel.tsx
  - Screens: `docs/screens.md` § Screen 7: Image Carousel → Enhance Button
  - Test: Enhance button visible on ORIGINAL type images only, opens enhancement sheet
- [ ] 3.2.3: Implement enhancement request flow (trigger API, show loading state, display result)
  - Files: src/components/image-enhancement-sheet.tsx
  - Test: "Generate Enhanced Version" triggers API, shows spinner, displays enhanced image on completion
- [ ] 3.2.4: Implement enhanced variant deletion with undo toast
  - Files: src/components/image-enhancement-sheet.tsx
  - Screens: `docs/screens.md` § Confirmation Dialogs — Delete Enhanced Image
  - Test: Trash icon deletes variant, Sonner toast shows "Image deleted" with Undo button
- [ ] 3.2.5: Write tests for enhancement UI components
  - Files: src/components/__tests__/image-enhancement-sheet.test.tsx
  - Test: Tests pass with ≥80% coverage

**Phase 3 Checkpoint:**

- [ ] Tapping "Enhance" on an original image opens enhancement sheet
- [ ] "Generate Enhanced Version" produces a Gemini-enhanced image
- [ ] Multiple variants can be generated per original
- [ ] Enhanced variants can be deleted with undo
- [ ] Originals are never modified
- [ ] All tests pass with ≥80% code coverage on Phase 3 code
- [ ] No TypeScript errors
- [ ] Commit: "feat: complete image enhancement (Phase 3)"

---

## Phase 4: Voice Input & Polish

### 4.1 Voice-to-Text

- [ ] 4.1.1: Evaluate and select voice-to-text provider (Whisper API vs. Deepgram)
  - Test: Build quick test of both, compare quality and UX on mobile
- [ ] 4.1.2: Implement `/api/transcribe` endpoint — accepts audio blob, returns transcript
  - Files: src/app/api/transcribe/route.ts
  - Test: POST with audio file returns text transcription
- [ ] 4.1.3: Build voice-input component with mic button, recording state, and live indicator
  - Files: src/components/voice-input.tsx
  - Screens: `docs/screens.md` § Screen 4: Mic Button, Recording Indicator — `docs/design-system.md`
  - Test: Mic toggles recording, red pulse when active, "Listening..." text shown
- [ ] 4.1.4: Integrate voice input into Describe screen — recorded audio → transcription → appends to textarea
  - Files: src/app/(authenticated)/new/describe/page.tsx
  - Test: Speak → tap stop → transcript text appears in textarea
- [ ] 4.1.5: Write tests for voice input components and API
  - Files: src/components/__tests__/voice-input.test.tsx, src/app/api/transcribe/__tests__/route.test.ts
  - Test: Tests pass with ≥80% coverage

### 4.2 Listing Editing

- [ ] 4.2.1: Add inline editing capability for title and description on the listing detail screen
  - Files: src/app/(authenticated)/listings/[id]/page.tsx
  - Test: Tap to edit title/description, save persists via PATCH API
- [ ] 4.2.2: Add price editing on listing detail screen
  - Files: src/app/(authenticated)/listings/[id]/page.tsx
  - Test: Tap suggested price to edit, save persists

### 4.3 Copy & UX Polish

- [ ] 4.3.1: Refine "Copy Full Listing" formatting for marketplace paste (title + price + description)
  - Files: src/lib/listing-formatter.ts
  - Test: Formatted output matches expected marketplace-friendly format
- [ ] 4.3.2: Add toast messages for all actions per screens.md toast table
  - Files: src/app/layout.tsx, relevant pages
  - Screens: `docs/screens.md` § Toast Messages
  - Test: Each action triggers correct toast type and message
- [ ] 4.3.3: Add loading and skeleton states across all screens
  - Screens: `docs/design-system.md` § Motion & Transitions
  - Test: Skeleton loading appears while data loads
- [ ] 4.3.4: Optimize image loading (lazy loading, proper sizing, blur placeholders)
  - Test: Images load progressively, LCP improved
- [ ] 4.3.5: Add mobile UX polish — FAB press scale, sheet transitions, smooth scrolling
  - Screens: `docs/design-system.md` § Motion & Transitions
  - Test: Animations match design system spec

**Phase 4 Checkpoint:**

- [ ] Voice input works on mobile (tap mic → speak → transcript appears)
- [ ] Listings can be manually edited after generation
- [ ] Copy formatting is clean for marketplace paste
- [ ] All toasts fire correctly per spec
- [ ] Performance is good on mobile (fast loads, smooth scrolling)
- [ ] All tests pass with ≥80% code coverage on Phase 4 code
- [ ] No TypeScript errors
- [ ] Commit: "feat: complete voice input and polish (Phase 4)"

---

## Post-MVP Tasks

> Do not start these until MVP checkpoints (Phases 0-3) are all verified.

## Phase 5: Listing Intelligence

### 5.1 Enhanced Prompts

- [ ] 5.1.1: Refine consolidated agent system prompt with advanced selling strategy rules (the base selling strategy is integrated in Phase 2; this adds deeper category-specific tactics, seasonal timing, and cross-posting guidance)
  - Files: src/lib/ai/prompts/listing-agent-prompt.ts
  - Ref: `docs/selling-strategy.md` — all sections
  - Test: Generated listings show improved category-specific tactics and market awareness
- [ ] 5.1.2: Add pricing strategy suggestions in market notes (OBO, firm, bundle discount recommendations)
  - Files: src/inngest/functions/generate-listing.ts
  - Ref: `docs/selling-strategy.md` § Pricing Strategy, § Market Notes Template
  - Test: Market notes include pricing tactic advice
- [ ] 5.1.3: Add platform-specific optimization notes (Facebook Marketplace, eBay, Craigslist tips)
  - Files: src/inngest/functions/generate-listing.ts
  - Ref: `docs/selling-strategy.md` § Platform-Specific Optimization
  - Test: Market notes include platform-specific advice
- [ ] 5.1.4: Add relisting reminder to market notes
  - Ref: `docs/selling-strategy.md` § The Relisting Reminder
  - Test: Every market notes section includes relisting advice

### 5.2 Quality & Refinement

- [ ] 5.2.1: Refine Gemini enhancement prompts based on category-specific guidance
  - Files: src/lib/ai/enhancement-prompt.ts
  - Ref: `docs/selling-strategy.md` § Image Enhancement Guidance, § Category-Specific Notes
  - Test: Enhancement prompts include category-specific instructions
- [ ] 5.2.2: Add listing quality score / checklist on detail screen
  - Files: src/components/listing-quality.tsx, src/app/(authenticated)/listings/[id]/page.tsx
  - Test: Quality score reflects completeness of listing (photos, description length, price research)

**Phase 5 Checkpoint:**

- [ ] Generated listings follow full selling strategy guide
- [ ] Market notes include pricing tactics and platform-specific advice
- [ ] Image enhancement uses category-aware prompts
- [ ] All tests pass with ≥80% code coverage
- [ ] Commit: "feat: complete listing intelligence (Phase 5)"

---

## Task Log

| Task  | Completed | Commit | Notes |
| ----- | --------- | ------ | ----- |
| 0.0.1 | 2026-02-15 | (phase commit) | Read CLAUDE.md |
| 0.0.2 | 2026-02-15 | (phase commit) | Working tree clean |
| 0.1.1 | 2026-02-15 | (phase commit) | Next.js 16.1.6, App Router, TS strict |
| 0.1.2 | 2026-02-15 | (phase commit) | ESLint + eslint-config-prettier |
| 0.1.3 | 2026-02-15 | (phase commit) | Prettier + tailwindcss plugin |
| 0.1.4 | 2026-02-15 | (phase commit) | Vitest 4 + RTL + jsdom 26 |
| 0.1.5 | 2026-02-15 | (phase commit) | Tailwind v4 + design system HSL tokens |
| 0.2.1 | 2026-02-15 | (phase commit) | shadcn/ui new-york style |
| 0.2.2 | 2026-02-15 | (phase commit) | 12 core components installed |
| 0.2.3 | 2026-02-15 | (phase commit) | next-themes class strategy |
| 0.2.4 | 2026-02-15 | (phase commit) | Light + dark tokens from design-system.md |
| 0.3.1 | 2026-02-15 | (phase commit) | All folders created per PRD |
| 0.3.2 | 2026-02-15 | (phase commit) | Build passes |
| 0.3.3 | 2026-02-15 | (phase commit) | Dev server starts |
| 0.3.4 | 2026-02-15 | (phase commit) | Test runner passes |
| 0.4.1 | 2026-02-15 | (phase commit) | Docker Compose on port 5433 |
| 0.4.2 | 2026-02-15 | (phase commit) | drizzle-orm + @neondatabase/serverless + postgres |
| 0.4.3 | 2026-02-15 | (phase commit) | Neon for prod, postgres.js for local |
| 0.4.4 | 2026-02-15 | (phase commit) | 20-field listings table with enums |
| 0.4.5 | 2026-02-15 | (phase commit) | listing_images with FK + self-ref relation |
| 0.4.6 | 2026-02-15 | (phase commit) | drizzle-kit push succeeded |
| 0.4.7 | 2026-02-15 | (phase commit) | 20 tests passing |
| 0.5.1 | 2026-02-15 | (phase commit) | All 10 env vars documented |
| 0.5.2 | 2026-02-15 | (phase commit) | Local dev values |
| 0.5.3 | 2026-02-15 | (phase commit) | Next.js + env + coverage ignores |
| 1.1.1 | 2026-02-15 | (batch) | BetterAuth + Drizzle adapter |
| 1.1.2 | 2026-02-15 | (batch) | Auth catch-all route handler |
| 1.1.3 | 2026-02-15 | (batch) | Auth tables in schema.ts + push |
| 1.1.4 | 2026-02-15 | (batch) | Middleware + route protection |
| 1.1.5 | 2026-02-15 | (batch) | Login/Register page w/ Tabs |
| 1.1.6 | 2026-02-15 | (batch) | Login form + BetterAuth client |
| 1.1.7 | 2026-02-15 | (batch) | Register form + validation |
| 1.1.8 | 2026-02-15 | (batch) | 46 tests passing |
| 1.2.1 | 2026-02-15 | (batch) | GET /api/listings |
| 1.2.2 | 2026-02-15 | (batch) | POST /api/listings + Blob upload |
| 1.2.3 | 2026-02-15 | (batch) | GET /api/listings/[id] |
| 1.2.4 | 2026-02-15 | (batch) | PATCH /api/listings/[id] |
| 1.2.5 | 2026-02-15 | (batch) | DELETE /api/listings/[id] + Blob cleanup |
| 1.2.6 | 2026-02-15 | (batch) | DELETE /api/listings/[id]/images |
| 1.2.7 | 2026-02-15 | (batch) | Blob upload/delete helpers |
| 1.2.8 | 2026-02-15 | (batch) | 20 API + blob tests |
| 1.3.1 | 2026-02-15 | (batch) | ListingStatusBadge w/ 7 statuses |
| 1.3.2 | 2026-02-15 | (batch) | CopyButton w/ clipboard + toast |
| 1.3.3 | 2026-02-15 | (batch) | BottomBar fixed container |
| 1.3.4 | 2026-02-15 | (batch) | EmptyState centered placeholder |
| 1.3.5 | 2026-02-15 | (batch) | FAB floating action button |
| 1.3.6 | 2026-02-15 | (batch) | 23 component tests |
| 1.4.1 | 2026-02-15 | (batch) | ListingCard component |
| 1.4.2 | 2026-02-15 | (batch) | Feed page w/ server fetch |
| 1.4.3 | 2026-02-15 | (batch) | Overflow menu + logout |
| 1.4.4 | 2026-02-15 | (batch) | 9 feed + card tests |
| 1.5.1 | 2026-02-15 | (batch) | Capture page + ImageGrid |
| 1.5.2 | 2026-02-15 | (batch) | Describe page w/ textarea + thumbnails |
| 1.5.3 | 2026-02-15 | (batch) | createListing server action |
| 1.5.4 | 2026-02-15 | (batch) | Submitted confirmation page |
| 1.5.5 | 2026-02-15 | (batch) | NewListingProvider context |
| 1.5.6 | 2026-02-15 | (batch) | 32 new listing flow tests |
| 1.6.1 | 2026-02-15 | (batch) | ImageCarousel w/ scroll-snap + dots |
| 1.6.2 | 2026-02-15 | (batch) | Full detail page w/ all sections |
| 1.6.3 | 2026-02-15 | (batch) | Copy Full Listing + formatter |
| 1.6.4 | 2026-02-15 | (batch) | Dropdown menu status actions |
| 1.6.5 | 2026-02-15 | (batch) | AlertDialog delete confirmation |
| 1.6.6 | 2026-02-15 | (batch) | 17 detail + carousel + formatter tests |
| 1.7.1 | 2026-02-15 | (batch) | PWA manifest w/ branding |
| 1.7.2 | 2026-02-15 | (batch) | Service worker asset caching |
| 1.7.3 | 2026-02-15 | (batch) | Viewport meta + SW registration |
| 2.1.1 |           |        |       |
| 2.1.2 |           |        |       |
| 2.1.3 |           |        |       |
| 2.2.1 |           |        |       |
| 2.2.2 |           |        |       |
| 2.2.3 |           |        |       |
| 2.2.4 |           |        |       |
| 2.2.5 |           |        |       |
| 2.3.1 |           |        |       |
| 2.3.2 |           |        |       |
| 2.3.3 |           |        |       |
| 2.3.4 |           |        |       |
| 2.3.5 |           |        |       |
| 2.3.6 |           |        |       |
| 2.4.1 |           |        |       |
| 2.4.2 |           |        |       |
| 2.4.3 |           |        |       |
| 2.4.4 |           |        |       |
| 2.4.5 |           |        |       |
| 2.4.6 |           |        |       |
| 2.5.1 |           |        |       |
| 2.5.2 |           |        |       |
| 2.5.3 |           |        |       |
| 2.5.4 |           |        |       |
| 2.5.5 |           |        |       |
| 2.5.6 |           |        |       |
| 2.5.7 |           |        |       |
| 3.1.1 |           |        |       |
| 3.1.2 |           |        |       |
| 3.1.3 |           |        |       |
| 3.1.4 |           |        |       |
| 3.1.5 |           |        |       |
| 3.1.6 |           |        |       |
| 3.2.1 |           |        |       |
| 3.2.2 |           |        |       |
| 3.2.3 |           |        |       |
| 3.2.4 |           |        |       |
| 3.2.5 |           |        |       |
| 4.1.1 |           |        |       |
| 4.1.2 |           |        |       |
| 4.1.3 |           |        |       |
| 4.1.4 |           |        |       |
| 4.1.5 |           |        |       |
| 4.2.1 |           |        |       |
| 4.2.2 |           |        |       |
| 4.3.1 |           |        |       |
| 4.3.2 |           |        |       |
| 4.3.3 |           |        |       |
| 4.3.4 |           |        |       |
| 4.3.5 |           |        |       |
| 5.1.1 |           |        |       |
| 5.1.2 |           |        |       |
| 5.1.3 |           |        |       |
| 5.1.4 |           |        |       |
| 5.2.1 |           |        |       |
| 5.2.2 |           |        |       |
