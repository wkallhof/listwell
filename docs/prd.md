# Listwell — Product Requirements Document

**Version:** 0.1 (MVP)
**Author:** Wade Evanhoff
**Date:** February 2026

---

## What Is This

Listwell is a mobile-first progressive web app that turns photos of stuff you want to sell into ready-to-post marketplace listings. You snap some pictures, optionally say a few words about the item, and an AI agent handles the rest — identifying the product, researching market pricing, writing a natural-sounding listing description, and cleaning up the photos. The output is a complete listing you copy into Facebook Marketplace, eBay, Craigslist, or wherever you sell.

The core value proposition is eliminating the friction that stops people from actually listing things. Most people have stuff sitting around they'd sell if it didn't take 30 minutes to research pricing, write a decent description, and make photos look presentable. Listwell compresses that into a tap-and-wait experience.

---

## Who It's For

Initially, this is a personal tool. The user is someone who has a pile of things to get rid of, knows they have value, but doesn't want to spend time on each listing. The interface assumes a single motivated seller, not a professional reseller operation.

Auth is included from the start (BetterAuth, username + password) to scope data properly and leave the door open for a multi-user future without retrofitting.

---

## Core User Flow

1. **Open app** → see your listings feed (past listings with status)
2. **Tap "New Listing"** → camera/gallery picker opens
3. **Capture 1-5 photos** from different angles
4. **Optionally describe it** via voice dictation or typing ("It's a Dewalt drill, works fine, just don't use it anymore")
5. **Tap "Generate"** → request queued, you're returned to the feed
6. **Agent works in background** (30-90 seconds) — analyzing images, browsing the web for pricing, writing the listing, enhancing photos
7. **Push notification** when the listing is ready
8. **Review the listing** — title, description, suggested price with range, comparable sales, market notes
9. **Optionally enhance images** — run any original image through the AI image editor to get a cleaner version. You can generate multiple variants per image, keep the ones you like, delete the rest. Originals are never modified or replaced.
10. **Copy the listing** (full or by section) and paste it into your marketplace of choice

---

## Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| ORM | Drizzle |
| Database (local) | PostgreSQL via Docker Compose |
| Database (production) | Neon |
| Image Storage | Vercel Blob |
| Auth | BetterAuth (username + password) |
| Background Jobs | Inngest |
| AI Agent Runtime | Vercel Sandbox + Claude Code AgentSDK |
| Image Analysis | Claude Vision (via AgentSDK) |
| Image Enhancement | Google Gemini API (native image generation/editing) |
| Voice-to-Text | Deepgram or OpenAI Whisper API (TBD — evaluate both) |
| Hosting | Vercel |

### Why Inngest + Vercel Sandbox + AgentSDK

The listing generation pipeline is not a simple chain of API calls. The research step in particular benefits from an autonomous agent that can browse the web the way a human would — searching eBay sold listings, checking Facebook Marketplace, reading product reviews, comparing prices across sources. Claude Code running in a Vercel Sandbox via AgentSDK gives us that capability.

Inngest handles the orchestration: receiving the job, managing retries, tracking status, and triggering the push notification on completion. The user submits their photos and gets back to their day. The agent does the work asynchronously.

This architecture also means the pipeline can evolve. Today the agent searches for prices. Tomorrow it could check if the item is recalled, look up shipping weight estimates, or suggest which marketplace would sell it fastest — all without changing the user-facing flow.

### Pipeline Sequence

```
User submits photos + description
        │
        ▼
  Inngest receives job
        │
        ▼
  Vercel Sandbox spins up with AgentSDK
        │
        ├── Step 1: Image Analysis (Claude Vision)
        │   Identify product, brand, model, condition, features
        │
        ├── Step 2: Market Research (Agent browses web)
        │   Search eBay sold listings, FB Marketplace, Amazon
        │   Find comparable sales, assess demand, note pricing patterns
        │
        ├── Step 3: Listing Generation (Claude)
        │   Write title, description, suggest price
        │   Voice: authentic, human, first-person
        │
        └── Step 4: Complete
            Save results to DB
            Trigger push notification
            Listing marked READY

  ─── Image Enhancement (separate, user-initiated) ───
  User taps "Enhance" on any original image
        │
        ▼
  Gemini API generates enhanced version
  Saved as new image variant (original untouched)
  User can generate multiple, keep/delete freely
```

### Image Enhancement — Separate From Pipeline

Image enhancement is intentionally decoupled from the main pipeline. It's a user-initiated action, not an automatic step. Reasons:

- The user should control which images get enhanced and approve the results
- Enhancement can be iterative — run it multiple times, keep the best output
- Original images are sacred and never modified
- The Gemini image editing API prompt will be informed by marketplace selling best practices (researched separately)

The enhancement approach is contextual, not clinical. The goal isn't a white-background product shot — it's making your real-world photo look like it was taken in a slightly nicer spot in your house. Buyers on Facebook Marketplace want to see the actual item in a real setting. They're suspicious of overly polished product photography. The enhancement should clean things up (better lighting, less clutter, nicer composition) while keeping it authentic.

---

## Data Model

### Listings

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| userId | string | FK to user (BetterAuth) |
| rawDescription | text | User's voice/typed input |
| title | string | AI-generated listing title |
| description | text | AI-generated listing body |
| suggestedPrice | float | Recommended list price |
| priceRangeLow | float | Low end of market range |
| priceRangeHigh | float | High end of market range |
| category | string | Product category |
| condition | string | New / Like New / Good / Fair / Poor |
| brand | string | Detected brand |
| model | string | Detected model |
| researchNotes | text | Agent's market analysis summary |
| comparables | json | Array of comparable listings found |
| status | enum | DRAFT / PROCESSING / READY / LISTED / SOLD / ARCHIVED |
| pipelineStep | enum | PENDING / ANALYZING / RESEARCHING / GENERATING / COMPLETE / ERROR |
| pipelineError | text | Error message if pipeline fails |
| inngestRunId | string | Inngest run ID for status tracking |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### Listing Images

| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| listingId | string | FK to listing |
| type | enum | ORIGINAL / ENHANCED |
| blobUrl | string | Vercel Blob URL |
| blobKey | string | Vercel Blob storage key |
| parentImageId | string | FK to original image (for enhanced variants) |
| sortOrder | int | Display order |
| isPrimary | boolean | Hero image for listing |
| geminiPrompt | text | Prompt used for enhancement (if enhanced) |
| createdAt | timestamp | |

This model means an original image can have 0-N enhanced variants. The user picks which ones to use. Deleting an enhanced image doesn't touch the original. The `parentImageId` relationship lets us show "original → enhanced options" in the UI.

---

## Voice-to-Text

The description input supports both typing and voice dictation. Voice is the primary expected input method on mobile — it's faster and more natural when you're standing in front of the thing you're selling.

Two options under evaluation:

**OpenAI Whisper API** — battle-tested, good accuracy, simple file upload, ~$0.006/minute. Synchronous.

**Deepgram** — faster (real-time websocket streaming), good for live transcription as you speak, slightly more complex integration but better UX since you'd see words appearing in real-time.

For MVP, the deciding factor is UX feel. If we want "tap mic, talk, see text appear live" then Deepgram. If we're fine with "tap mic, talk, tap stop, wait a beat, see transcript" then Whisper is simpler. Either way the implementation is a thin wrapper — record audio on the client, send to API, receive text.

Browser-native Web Speech API is not used due to inconsistent quality and lack of punctuation handling.

---

## Listing Voice & Tone

The generated listing text should read like a real person wrote it — because the whole point is to replace the work a real person would do, not to sound like an AI or a brand.

Principles:

- **First-person perspective.** "I bought this a couple years ago" not "This item was purchased."
- **Honest about condition.** Don't oversell. If there's a scratch, mention it. Buyers trust sellers who acknowledge imperfections.
- **Believable reason for selling.** Not forced or elaborate. "Doesn't fit my routine anymore" / "Upgrading and don't need two" / "Clearing out the garage" — the kind of thing a normal person would say.
- **Conversational but not sloppy.** Short paragraphs, no bullet points (those look like a business wrote it), no ALL CAPS, no excessive exclamation marks.
- **Searchable title.** Include brand, product name, key specs. Think about what a buyer would type into the search bar.
- **End with an invitation.** "Message me with any questions" or "Happy to send more pics."

A future iteration will incorporate research on proven marketplace listing strategies — what drives clicks, what converts to sales, what pricing tactics work (e.g., pricing just below round numbers, including "OBO", cross-posting language). That research will be woven into the prompt engineering for listing generation.

---

## PWA Configuration

Listwell is a PWA optimized for add-to-homescreen on iOS and Android. It is not an offline-first app — all core functionality requires an internet connection.

PWA features used:

- **Web App Manifest** — standalone display, portrait orientation, theme colors
- **Service Worker** — push notification support, basic asset caching for fast launch
- **Push Notifications** — notify user when a listing is ready (via web push API + service worker)
- **Viewport** — `viewport-fit=cover` for edge-to-edge on notched phones, safe area insets respected

PWA features NOT used (v1):

- Offline queueing
- Background sync
- Persistent local storage of listing data

---

## Screens

### 1. Listings Feed (Home)

The main screen. Shows all your listings in reverse chronological order. Each card shows a thumbnail, title (or "Processing..."), price, and status badge (Processing / Ready / Listed / Sold). A floating action button opens the new listing flow.

### 2. New Listing — Capture

Full-screen image capture. Grid of photo thumbnails with Camera and Gallery buttons. Supports `capture="environment"` for direct camera access on mobile. Minimum 1 image, recommend 3-5 for best results.

### 3. New Listing — Describe

Thumbnail strip of captured photos at top. Large text area with a mic button for voice dictation. This step is optional — the user can skip straight to generate. Brief helper text explains that more detail improves results.

### 4. New Listing — Submitted

Brief confirmation that the listing is being generated. User is encouraged to go do something else. Returns to the listings feed where the new entry shows as "Processing."

### 5. Listing Detail — Ready

The payoff screen. Shows:

- Image carousel (originals, with "Enhance" button on each)
- Generated title with copy button
- Price card (suggested price + range)
- Generated description with copy button
- Product details (brand, model, condition, category)
- Comparable listings found during research (title, price, source, link)
- Market notes from the agent's research
- "Copy Full Listing" button at the bottom

### 6. Image Enhancement

Accessed from the listing detail screen. Select an original image → tap Enhance → Gemini generates a cleaned-up version → displayed alongside the original for comparison. User can:

- Accept and save the enhanced version
- Generate another variant (try again)
- Delete an enhanced version they don't like
- Return to the listing without enhancing

Enhanced images are displayed in a gallery below the original they derive from.

### 7. Login / Register

Simple email + password auth via BetterAuth. No social login for v1. Minimal UI — just enough to get in.

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/*` | Various | BetterAuth handlers |
| `/api/listings` | GET | List all user listings |
| `/api/listings` | POST | Create listing + upload images + trigger Inngest |
| `/api/listings/[id]` | GET | Get listing detail |
| `/api/listings/[id]` | PATCH | Update listing (manual edits, status changes) |
| `/api/listings/[id]` | DELETE | Delete listing + images |
| `/api/listings/[id]/enhance` | POST | Trigger image enhancement for a specific original image |
| `/api/listings/[id]/images` | DELETE | Delete a specific enhanced image variant |
| `/api/inngest` | POST | Inngest webhook endpoint |
| `/api/transcribe` | POST | Voice-to-text (proxies to Whisper or Deepgram) |

---

## Inngest Functions

### `listing.generate`

**Trigger:** `listing.submitted` event
**Input:** `{ listingId, imageUrls[], rawDescription? }`
**Steps:**

1. `analyze-images` — Download images from Blob, send to Claude Vision, extract product details
2. `research-pricing` — Spin up Vercel Sandbox with AgentSDK, agent browses web for pricing data
3. `generate-listing` — Pass analysis + research to Claude, generate title/description/price
4. `notify-complete` — Update DB status, send web push notification

Each step is independently retryable. If step 2 fails, step 1 doesn't re-run.

### `image.enhance`

**Trigger:** `image.enhance.requested` event
**Input:** `{ listingId, imageId, blobUrl }`
**Steps:**

1. `download-original` — Fetch image from Vercel Blob
2. `enhance-with-gemini` — Send to Gemini image editing API with contextual prompt
3. `upload-enhanced` — Store result in Vercel Blob, create ListingImage record linked to original

---

## Non-Goals (v1)

- Direct posting to any marketplace via API
- Inventory tracking or sales tracking
- Multi-user teams or shared listings
- Offline functionality
- Shipping label generation or cost estimation
- Buyer communication management
- Listing templates or batch processing
- Mobile app store distribution (App Store / Play Store)

---

## Open Items & Future Research

- **Marketplace listing strategy research.** Deep research into what makes listings convert on Facebook Marketplace, eBay, Craigslist. Pricing psychology, photo count/quality impact, title keyword strategy, description length, time-of-day posting. This research will directly inform the AI prompts for listing generation and image enhancement.
- **Voice-to-text provider selection.** Evaluate Deepgram vs. Whisper for real-time transcription quality on mobile. Build a quick test of each before committing.
- **Gemini image editing prompt tuning.** The "make it look like it's in a nicer spot in my house" prompt needs iteration. Test with real product photos across categories (electronics, furniture, tools, clothing) to find the right balance of enhancement vs. authenticity.
- **Agent research quality.** The AgentSDK-powered research step is the highest-value and highest-risk part of the pipeline. Needs testing to validate that the agent reliably finds good pricing data, handles edge cases (obscure items, items with no comps), and stays within reasonable time bounds.
- **Push notification reliability.** Web push on iOS (Safari 16.4+) has quirks. Test thoroughly on both iOS and Android.

---

## Build Strategy

### Phase 1 — Foundation

Stand up the project scaffold, database, auth, and image upload. Get a working app where you can log in, upload photos, and see them stored. No AI yet.

- Next.js project with App Router
- Drizzle schema + Neon connection (Docker Compose for local)
- BetterAuth integration
- Vercel Blob image upload
- Basic listings CRUD UI
- PWA manifest + service worker shell

### Phase 2 — AI Pipeline

Wire up the Inngest background job system and the core agent pipeline. This is where the magic happens.

- Inngest setup + webhook route
- Vercel Sandbox + AgentSDK integration
- Image analysis step (Claude Vision)
- Web research step (agent browsing)
- Listing generation step (Claude)
- Pipeline status tracking in the UI
- Push notifications on completion

### Phase 3 — Image Enhancement

Add the Gemini-powered image enhancement as a user-initiated feature.

- Gemini API integration for image editing
- Enhancement UI (compare original vs. enhanced, generate variants, keep/delete)
- Prompt engineering for "realistic but cleaner" product photos

### Phase 4 — Voice & Polish

Add voice input and refine the overall experience.

- Voice-to-text integration (Whisper or Deepgram)
- Recording UI with live feedback
- Listing editing (manual tweaks to AI-generated content)
- Copy-to-clipboard refinements
- Performance optimization
- Mobile UX polish (animations, haptics, gestures)

### Phase 5 — Listing Intelligence

Incorporate marketplace research findings into the product.

- Refined prompts based on marketplace strategy research
- Pricing strategy suggestions (OBO, firm, bundle discounts)
- Platform-specific listing optimization ("for eBay, emphasize shipping; for FB Marketplace, emphasize local pickup")
- Listing quality score / checklist