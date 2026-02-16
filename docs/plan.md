# Technical Implementation Plan

> Generated from docs/prd.md, docs/screens.md, and docs/design-system.md on 2026-02-15
> Last updated: 2026-02-15

## Overview

Listwell is a mobile-first PWA that turns photos of items into ready-to-post marketplace listings using AI. Users snap photos, optionally describe the item via voice or text, and an AI agent identifies the product, researches market pricing, writes a natural listing description, and optionally enhances photos. The output is a complete listing ready to copy into Facebook Marketplace, eBay, or Craigslist.

The technical approach uses Next.js App Router with server components for the frontend, Drizzle ORM with PostgreSQL (Neon in production, Docker locally) for data, BetterAuth for authentication, Inngest for background job orchestration, and a consolidated Vercel Sandbox + Claude AgentSDK environment for the entire listing generation pipeline — image analysis, web-based market research, and listing copy writing all happen within a single agent session so the agent maintains full context throughout. Google Gemini handles image enhancement as a separate user-initiated flow. Images are stored in Vercel Blob.

## Architecture Summary

The system follows a standard Next.js full-stack pattern with an asynchronous AI pipeline. The frontend is a mobile-optimized PWA. API route handlers manage CRUD operations and trigger background jobs. Inngest orchestrates the pipeline, but the core listing generation runs as a single consolidated agent session inside a Vercel Sandbox. Rather than splitting image analysis, market research, and listing generation into separate Inngest steps with data passed between them, one AgentSDK-powered agent handles the entire flow — analyzing images, browsing the web for pricing, and writing the listing — all within a single context window. This means the agent that notices a scratch during image analysis can naturally mention it in the description, and the agent that finds "listings with original case sell for 20% more" on eBay can look back at the photos to check if the case is present.

### Key Components

| Component | Responsibility | Key Technologies |
| --------- | -------------- | ---------------- |
| Frontend | Mobile-first PWA with listings feed, capture flow, detail views | Next.js App Router, React Server Components, shadcn/ui, Tailwind CSS |
| API Layer | RESTful endpoints for listings CRUD, image upload, transcription | Next.js Route Handlers, Vercel Blob |
| Auth | User authentication and session management | BetterAuth (email/password), Drizzle adapter |
| Data Layer | Listings, images, user data persistence | Drizzle ORM, PostgreSQL (Neon prod / Docker local) |
| AI Pipeline | Consolidated agent: image analysis, market research, listing generation in one session | Inngest (orchestration), Vercel Sandbox + Claude AgentSDK (execution) |
| Image Enhancement | AI-powered photo cleanup | Google Gemini API, Inngest |
| Voice Input | Speech-to-text for item descriptions | Whisper API or Deepgram (TBD) |
| Notifications | Alert user when listing is ready | Web Push API, Service Worker |

### Data Flow

```
User captures photos + optional description
    → POST /api/listings (uploads to Vercel Blob, creates DB record)
    → Inngest event: listing.submitted
    → Inngest Step 1: Vercel Sandbox spins up AgentSDK (consolidated agent session)
        → Agent analyzes images (identifies product, brand, model, condition)
        → Agent browses web for pricing (eBay sold, FB Marketplace, Amazon)
        → Agent writes listing (title, description, price) with full context
        → Agent updates pipelineStep in DB as it progresses
        → Returns structured result
    → Inngest Step 2: Save results to DB, mark READY, send push notification
    → User reviews listing on detail screen
    → Optional: POST /api/listings/[id]/enhance → Inngest → Gemini → enhanced image
    → User copies listing to marketplace
```

**Why a consolidated agent session:** The agent maintains full context across all three phases of work. The same agent that notices a scratch during image analysis can mention it naturally in the description. The agent that discovers "listings with original case sell for 20% more" on eBay can look back at the photos to check if the case is visible. This context continuity produces better listings than passing serialized data between separate steps. The completion step (DB save + push notification) remains a separate Inngest step for independent retry.

## Implementation Phases

### Phase 0: Project Foundation

**Goal:** Runnable Next.js project skeleton with dev tooling, database, and folder structure

- Initialize Next.js with App Router and TypeScript
- Configure ESLint, Prettier, and Vitest
- Set up Tailwind CSS with shadcn/ui and design system tokens
- Create folder structure per PRD conventions
- Set up Drizzle ORM with PostgreSQL (Docker Compose for local dev)
- Configure drizzle-kit for migrations
- Create initial schema (listings, listing_images tables)
- Set up .env.example with all required variables
- Verify: dev server, build, tests, lint, and typecheck all pass

### Phase 1: Authentication & Core CRUD

**Goal:** Working app where a user can log in, create listings with photo uploads, and browse their listings feed
**Depends on:** Phase 0

- Integrate BetterAuth with Drizzle adapter (email/password)
- Create auth API route handler (`/api/auth/[...all]`)
- Build Login/Register screen (Screen 1 from screens.md)
- Add auth middleware for protected routes
- Implement Vercel Blob image upload in listing creation
- Build listings API routes (GET, POST, PATCH, DELETE)
- Build Listings Feed screen (Screen 2) with ListingCard, StatusBadge, FAB
- Build New Listing — Capture screen (Screen 3) with photo grid
- Build New Listing — Describe screen (Screen 4) with text input (no voice yet)
- Build New Listing — Submitted screen (Screen 5)
- Build Listing Detail — Ready screen (Screen 7) with copy functionality
- Build shared components: CopyButton, BottomBar, EmptyState, ListingStatusBadge
- Set up PWA manifest and service worker shell
- Verify: User can register, log in, upload photos, create a listing (manual data entry), view feed, view detail, copy listing text

### Phase 2: AI Pipeline

**Goal:** End-to-end AI-powered listing generation from photos
**Depends on:** Phase 1

- Set up Inngest client and serve route (`/api/inngest`)
- Set up Vercel Sandbox + AgentSDK consolidated environment
- Build agent system prompt incorporating selling strategy guide, image analysis, web research, and listing generation into a single agent session
- Implement `listing.generate` Inngest function with two steps:
  - `run-agent`: Spin up Vercel Sandbox with AgentSDK — agent analyzes images, browses web for pricing, writes listing, updates pipelineStep in DB as it progresses
  - `complete`: Save structured results to DB, mark status READY, send push notification
- Add pipeline status tracking (agent updates pipelineStep field directly during execution)
- Build Listing Detail — Processing screen (Screen 6) with live pipeline steps
- Implement polling/SSE for real-time status updates on processing listings
- Build error state and retry functionality (Screen 9)
- Integrate Web Push notifications for listing completion
- Update listing creation flow to trigger Inngest event after upload
- Verify: Submit photos → consolidated agent analyzes, researches, generates with full context → listing appears as READY with title, description, price, comparables, market notes

### Phase 3: Image Enhancement

**Goal:** User-initiated AI image enhancement with Gemini
**Depends on:** Phase 2

- Integrate Google Gemini API for image editing
- Implement `image.enhance` Inngest function with steps:
  - `download-original`: Fetch from Vercel Blob
  - `enhance-with-gemini`: Send to Gemini with contextual prompt informed by selling strategy
  - `upload-enhanced`: Store result in Vercel Blob, create ListingImage record
- Build Image Enhancement sheet UI (Screen 8)
- Add "Enhance" button to image carousel on detail screen
- Support multiple enhanced variants per original image
- Support deleting enhanced variants (with undo toast)
- Verify: Tap Enhance on original → Gemini generates cleaner version → displayed alongside original → can generate multiple, keep/delete

### Phase 4: Voice Input & Polish

**Goal:** Voice dictation for descriptions and refined mobile experience
**Depends on:** Phase 1

- Evaluate and integrate voice-to-text provider (Whisper API or Deepgram)
- Build voice recording UI with live feedback indicator
- Implement `/api/transcribe` endpoint
- Add voice input to Describe screen (mic button, recording state, transcript append)
- Add listing editing capability (manual tweaks to AI-generated content)
- Refine copy-to-clipboard formatting for different marketplaces
- Mobile UX polish: animations, transitions per design system
- Performance optimization (image loading, lazy loading, skeleton states)
- Verify: Tap mic → speak → text appears → generates listing with voice context

### Phase 5: Listing Intelligence (Post-MVP)

**Goal:** Marketplace-optimized listings using selling strategy research
**Depends on:** Phase 2

- Integrate selling strategy guide into listing generation prompts
- Add pricing strategy suggestions (OBO, firm, bundle discounts)
- Add platform-specific optimization notes in market notes
- Add listing quality score / checklist
- Refine Gemini enhancement prompts based on category-specific guidance
- Verify: Generated listings follow selling strategy best practices, market notes include actionable platform-specific tips

---

## MVP Boundary

**MVP includes:** Phases 0-3
**Post-MVP:** Phases 4-5

**MVP is complete when:**

- [ ] User can register and log in with email/password
- [ ] User can capture 1-5 photos and submit for listing generation
- [ ] AI pipeline analyzes images, researches pricing, and generates a complete listing
- [ ] User can view pipeline progress in real-time
- [ ] User can view completed listings with title, description, price, comparables, and market notes
- [ ] User can copy full listing or individual sections to clipboard
- [ ] User can enhance images with AI and manage enhanced variants
- [ ] Push notifications alert user when listing generation is complete
- [ ] App is installable as a PWA on mobile
- [ ] All Phase 0-3 checkpoints pass
- [ ] Application can be deployed to Vercel and used for core workflow

## External Dependencies

| Dependency | Purpose | Version | Documentation |
| ---------- | ------- | ------- | ------------- |
| next | App framework | ^15 | nextjs.org/docs |
| react / react-dom | UI library | ^19 | react.dev |
| tailwindcss | Utility CSS | ^4 | tailwindcss.com |
| shadcn/ui | Component library | latest | ui.shadcn.com |
| drizzle-orm | Type-safe ORM | latest | orm.drizzle.team |
| drizzle-kit | Migration tooling | latest | orm.drizzle.team |
| @neondatabase/serverless | Neon PostgreSQL driver | latest | neon.tech/docs |
| better-auth | Authentication | latest | better-auth.com |
| inngest | Background job orchestration | latest | inngest.com/docs |
| @vercel/blob | Image storage | latest | vercel.com/docs/storage/vercel-blob |
| @anthropic-ai/sdk | Claude API client | latest | docs.anthropic.com |
| @anthropic-ai/claude-code | AgentSDK | latest | docs.anthropic.com/en/docs/agents |
| @google/generative-ai | Gemini API client | latest | ai.google.dev |
| web-push | Push notification server | latest | github.com/web-push-libs/web-push |
| next-themes | Dark mode support | latest | github.com/pacocoursey/next-themes |
| lucide-react | Icon library | latest | lucide.dev |
| sonner | Toast notifications | latest | sonner.emilkowal.ski |
| vitest | Test framework | latest | vitest.dev |
| @testing-library/react | Component testing | latest | testing-library.com |
| Docker Compose | Local PostgreSQL | - | docs.docker.com/compose |

## Open Questions

- [ ] Voice-to-text provider: Deepgram (real-time streaming) vs. OpenAI Whisper (simpler, batch). Decide before Phase 4.
- [ ] Vercel Sandbox availability and pricing for AgentSDK execution. Validate during Phase 2.
- [ ] Gemini image editing API prompt tuning — needs iteration with real product photos across categories.
- [ ] Push notification reliability on iOS Safari 16.4+ — test thoroughly during Phase 2.
- [ ] Agent research quality — how well does AgentSDK find pricing data for obscure items? Test during Phase 2.

## Technology References

| Technology | Purpose | Documentation |
| ---------- | ------- | ------------- |
| Next.js App Router | Full-stack framework | nextjs.org/docs |
| Drizzle ORM | Type-safe database access | orm.drizzle.team |
| BetterAuth | Authentication | better-auth.com/docs |
| Inngest | Background jobs | inngest.com/docs |
| Vercel Blob | Image storage | vercel.com/docs/storage/vercel-blob |
| Claude AgentSDK | Autonomous AI agent | docs.anthropic.com/en/docs/agents |
| Claude Vision | Image analysis | docs.anthropic.com |
| Google Gemini | Image enhancement | ai.google.dev |
| shadcn/ui | UI components | ui.shadcn.com |
| Tailwind CSS | Styling | tailwindcss.com |
| Web Push API | Notifications | developer.mozilla.org/en-US/docs/Web/API/Push_API |

## Parallel Execution Waves

> Phases grouped by dependency graph for concurrent development using git worktrees
> and multiple Claude Code instances. Wave N+1 depends on Wave N being complete.

| Wave | Phases | Feature Groups |
| ---- | ------ | -------------- |
| 1    | 0      | Project Foundation — must complete first |
| 2    | 1      | Auth & Core CRUD — all UI and API depends on foundation |
| 3    | 2, 4   | AI Pipeline (depends on Phase 1), Voice & Polish (depends on Phase 1) — can run in parallel |
| 4    | 3, 5   | Image Enhancement (depends on Phase 2), Listing Intelligence (depends on Phase 2) — can run in parallel |

## Notes for Implementation

- **Design system first.** All UI work must reference `docs/design-system.md` for color tokens, typography, spacing, and component patterns. Use `docs/screens.md` for exact layout specifications.
- **Mobile-first, always.** Every layout starts at 375px. The app never goes wider than `max-w-xl` (576px) centered.
- **No persistent nav.** Navigation is contextual (back arrows, FAB). This is a single-purpose tool.
- **Server components by default.** Only use client components when interactivity is required (forms, state, event handlers).
- **Selling strategy integration.** The `docs/selling-strategy.md` document should be used to inform AI prompts for listing generation, pricing recommendations, and image enhancement. It defines title construction rules, description voice/tone, pricing psychology, and category-specific tactics.
- **Image originals are sacred.** Enhanced images are always new records linked to the original via `parentImageId`. Originals are never modified or deleted during enhancement.
- **Consolidated agent pipeline.** The listing generation agent runs in a single Vercel Sandbox session covering image analysis, web research, and listing writing. This maximizes context continuity and listing quality. The completion step (DB save + push notification) is a separate Inngest step for independent retry. If the agent step fails, the entire agent reruns (~30-90s), which is acceptable for a personal tool where quality matters most.
- **Auth from day one.** Even though this is initially a personal tool, auth is included to scope data properly and enable multi-user future.
