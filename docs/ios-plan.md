# Technical Implementation Plan — Listwell iOS

> Generated from docs/prd.md, docs/screens.md, docs/design-system.md, and existing web codebase on 2026-02-21
> Last updated: 2026-02-21

## Overview

Listwell iOS is a native SwiftUI app that replicates the full functionality of the existing Listwell web app. Users snap photos of items, optionally describe them via voice or text, and an AI agent handles product identification, pricing research, listing generation, and photo enhancement. The iOS app consumes the same Hono REST API (already deployed), using BetterAuth bearer token authentication. All business logic, AI pipeline, and background processing remain server-side — the iOS app is a pure client.

The technical approach uses SwiftUI (iOS 17+) with `@Observable` view models, native `URLSession` for networking, Keychain for secure token storage, `PhotosPicker` + `UIImagePickerController` for image capture, `SFSpeechRecognizer` for voice input, and APNs for push notifications. The app lives at `apps/ios/` in the existing Turborepo monorepo.

## Architecture Summary

The iOS app is a thin client that mirrors the web frontend's role: present UI, capture user input, and delegate all business logic to the Hono API. The same API endpoints, data models, and background job infrastructure power both clients.

### Key Components

| Component | Responsibility | Key Technologies |
| --------- | -------------- | ---------------- |
| UI Layer | All screens: feed, capture, describe, detail, enhancement | SwiftUI (iOS 17+), NavigationStack |
| State Management | Per-screen view models + shared app state | `@Observable` + `@MainActor`, `@Environment` |
| Networking | REST API communication with Hono backend | `URLSession` + `async/await`, `Codable` |
| Authentication | Login/register, token management | BetterAuth bearer tokens, Keychain (Security framework) |
| Image Capture | Camera + photo library access | `UIImagePickerController`, `PhotosPicker`, presigned URL upload |
| Voice Input | Speech-to-text for item descriptions | `SFSpeechRecognizer` (on-device), fallback to `/transcribe` API |
| Push Notifications | Alert when listing is ready | APNs + `UNUserNotificationCenter` |
| Image Caching | Efficient async image loading in feed/detail | Kingfisher (only third-party dependency) |
| Clipboard | Copy listings for marketplace paste | `UIPasteboard` |
| Dark Mode | Light/dark theme support | Asset Catalog color sets mapped from design system |
| Testing | Unit + UI testing | Swift Testing framework + XCTest (UI) |

### Data Flow

```
User captures photos + optional description
    → Presigned URL request: POST /upload/presign (bearer token)
    → Direct upload to R2/Blob storage via PUT to presigned URLs
    → Create listing: POST /listings (bearer token, image refs + description)
    → Server triggers Inngest listing.submitted event
    → iOS polls GET /listings/:id every 3-5s for pipeline status
    → Agent analyzes images → researches pricing → writes listing
    → Agent updates pipelineStep in DB as it progresses
    → Listing status transitions to READY
    → APNs push notification sent to device
    → User reviews listing, copies to clipboard
    → Optional: POST /listings/:id/enhance → Gemini enhancement
```

### API Integration

The iOS app communicates with the same Hono API the web app uses. Key differences from web:

| Concern | Web App | iOS App |
| ------- | ------- | ------- |
| Auth mechanism | Cookies via Next.js rewrites | Bearer token in `Authorization` header |
| Base URL | `/api/*` (proxied) | Direct to API server (e.g., `https://api.listwell.app/api/*`) |
| Image upload | XHR PUT to presigned URL | URLSession PUT to presigned URL |
| Push notifications | Web Push API (VAPID) | APNs device token |
| Voice input | MediaRecorder → POST /transcribe | SFSpeechRecognizer (on-device) with API fallback |

The BetterAuth bearer plugin is already configured on the API (`apps/api/src/auth.ts`). The iOS app will use `POST /auth/sign-in/email` and `POST /auth/sign-up/email` to obtain a bearer token, then include it in all subsequent requests.

### Screen Mapping

| Web Screen | Route | iOS View | Notes |
| ---------- | ----- | -------- | ----- |
| Login/Register | `/login` | `LoginView` | Same tabs, email+password |
| Listings Feed | `/` | `FeedView` | NavigationStack root, FAB overlay |
| New Listing — Capture | `/new` | `CaptureView` | Camera + PhotosPicker |
| New Listing — Describe | `/new/describe` | `DescribeView` | TextEditor + mic button |
| New Listing — Submitted | `/new/submitted` (redirect to detail) | Inline in `ListingDetailView` | Shows processing state immediately |
| Listing Detail — Processing | `/listings/[id]` | `ListingDetailView` (processing state) | Pipeline steps + polling |
| Listing Detail — Ready | `/listings/[id]` | `ListingDetailView` (ready state) | Full listing with copy |
| Image Enhancement | Sheet over detail | `EnhancementSheet` | Bottom sheet presentation |

## Implementation Phases

### Phase 0: Project Foundation

**Goal:** Runnable Xcode project with networking, auth infrastructure, design system, and data models

- Create Xcode project at `apps/ios/Listwell/` with SwiftUI lifecycle
- Configure for iOS 17+ deployment target
- Set up Swift Package Manager with Kingfisher dependency
- Create folder structure: Views/, ViewModels/, Models/, Services/, Utilities/, Resources/
- Map design system color tokens to Asset Catalog color sets (light + dark)
- Define typography constants matching web design system
- Build `APIClient` actor with `URLSession`, `async/await`, bearer token injection
- Build `KeychainManager` for secure token storage
- Define all Swift `Codable` models matching API response shapes (Listing, ListingImage, Comparable, AgentLogEntry)
- Define enums for ListingStatus, PipelineStep, ImageType
- Create `.env` / configuration for API base URL
- Verify: project builds, tests run, previews render

### Phase 1: Authentication

**Goal:** Working login/register flow with persistent session via Keychain-stored bearer token
**Depends on:** Phase 0

- Build `AuthService` for BetterAuth email/password flows (sign-in, sign-up, sign-out, session check)
- Implement bearer token persistence in Keychain (save on login, load on app launch, clear on logout)
- Build `AuthState` observable for app-wide auth tracking (isLoggedIn, currentUser, token)
- Build `LoginView` with email/password form and login/register tabs (matching Screen 1 spec)
- Add form validation (email format, password length, confirm password match)
- Add error display (inline error text below form)
- Add loading state on submit buttons
- Build root `ContentView` that switches between `LoginView` and authenticated `MainView` based on auth state
- Verify: user can register, log in, persist session across app restarts, log out

### Phase 2: Core Listing Screens

**Goal:** User can browse listings, capture photos, describe items, submit for generation, and view completed listings with copy functionality
**Depends on:** Phase 1

- Build `ListingsService` for listings CRUD (GET /listings, POST /listings, GET /listings/:id, PATCH /listings/:id, DELETE /listings/:id)
- Build `ImageUploadService` for presigned URL flow (POST /upload/presign, PUT to presigned URL)
- Build `ListingCardView` component (thumbnail, title, price, status badge, pipeline indicator, time ago)
- Build `ListingStatusBadge` component with status-specific colors matching design system
- Build `FeedView` with listings list, empty state, pull-to-refresh, and FAB overlay
- Build `CaptureView` with photo grid, camera button (UIImagePickerController), gallery button (PhotosPicker), 1-5 photo limit
- Build `NewListingState` observable for multi-step flow (photos + description across views)
- Build `DescribeView` with photo thumbnail strip, TextEditor, Skip and Generate buttons
- Implement submission flow: compress images → request presigned URLs → upload to storage → POST /listings → navigate to detail
- Build `ListingDetailView` (ready state) with all sections: image carousel, title + copy, price card, description + copy, product details, comparables, market notes
- Build `ImageCarousel` with horizontal paging TabView and dot indicators
- Build `CopyButton` component with clipboard copy + haptic feedback + visual confirmation
- Build "Copy Full Listing" button with formatted clipboard output (matching `formatListingForClipboard`)
- Build dropdown menu actions (Mark as Listed, Mark as Sold, Archive, Delete with confirmation)
- Build delete confirmation alert
- Verify: full listing lifecycle — capture photos, describe, submit, view detail, copy listing, change status, delete

### Phase 3: Pipeline & Real-time Updates

**Goal:** Live pipeline progress display during listing generation with error handling and retry
**Depends on:** Phase 2

- Build `PipelineStepsView` component showing step indicators (completed/active/pending) with labels
- Add processing state to `ListingDetailView` — show photo preview, pipeline steps, time estimate
- Implement polling in `ListingDetailViewModel` (GET /listings/:id every 3-5 seconds when status is PROCESSING)
- Auto-transition from processing to ready view when pipelineStep reaches COMPLETE
- Build error state card (destructive border, error message, retry + delete buttons)
- Implement retry (PATCH /listings/:id with retry flag to re-trigger Inngest)
- Add agent log display (scrollable log of agent activity entries)
- Verify: submit listing → see live pipeline progress → auto-transition to ready state; error → retry works

### Phase 4: Image Enhancement

**Goal:** User-initiated AI image enhancement with Gemini via the existing API
**Depends on:** Phase 3

- Build `EnhancementSheet` view (presented as .sheet from detail screen)
- Show original image with "Original" label
- Build enhanced variants grid (2-column layout with delete button on each)
- Implement "Generate Enhanced Version" button → POST /listings/:id/enhance
- Add loading state while enhancement processes (poll for new image appearing)
- Implement variant deletion → DELETE /listings/:id/images?imageId=X
- Add "Enhance" button overlay on original images in the carousel
- Verify: tap Enhance on original → sheet opens → generate enhanced version → displays alongside original → can delete variants

### Phase 5: Voice Input & Push Notifications

**Goal:** Voice dictation for descriptions and APNs push notification support
**Depends on:** Phase 2

- Build `SpeechRecognizer` service using `SFSpeechRecognizer` with real-time partial results
- Request speech recognition + microphone permissions
- Add mic button to `DescribeView` with recording state indicator (pulsing red dot)
- Append transcribed text to description TextEditor in real-time
- Implement fallback to server-side transcription (POST /transcribe with audio data) for better accuracy option
- Set up APNs entitlement and capability in Xcode project
- Build `PushNotificationManager` using `UNUserNotificationCenter` for permission + registration
- Send APNs device token to API: POST /push/subscribe (extend endpoint to accept APNs tokens)
- **API change:** Update `apps/api/src/routes/push.ts` to accept `{ type: "apns", deviceToken }` alongside existing web push format
- **API change:** Update `apps/api/src/lib/notifications.ts` to send APNs notifications via `apn` package alongside web push
- **API change:** Update `packages/db/src/schema.ts` push_subscriptions table to include `type` column ("web" | "apns") and `deviceToken` field
- Handle notification tap → deep link to listing detail via NavigationPath
- Add push permission prompt after first listing submission
- Verify: voice input works (speak → text appears); push notification received when listing ready → tap opens detail

### Phase 6: Polish & Testing

**Goal:** Refined mobile experience with haptics, animations, inline editing, and comprehensive test coverage
**Depends on:** Phases 3, 4, 5

- Add inline editing for title, description, and price on listing detail (tap to edit, save via PATCH)
- Add haptic feedback on key actions (copy, submit, status change) via `.sensoryFeedback`
- Add smooth transitions: sheet presentation, navigation, loading states
- Add skeleton loading views for feed and detail screens
- Optimize image loading (Kingfisher caching, JPEG compression before upload)
- Add pull-to-refresh on feed
- Add app icon and launch screen
- Write unit tests for all services (APIClient, AuthService, ListingsService, KeychainManager)
- Write unit tests for all view models
- Write unit tests for data model decoding
- Write UI tests for critical flows (login, create listing, copy listing)
- Verify: all tests pass with ≥80% coverage, app feels polished on device

---

## MVP Boundary

**MVP includes:** Phases 0-4
**Post-MVP:** Phases 5-6

**MVP is complete when:**

- [ ] User can register and log in with email/password (bearer token auth)
- [ ] Session persists across app restarts via Keychain
- [ ] User can capture 1-5 photos via camera or photo library
- [ ] User can optionally describe item via text
- [ ] Submitting creates a listing and triggers AI pipeline
- [ ] Pipeline progress displays live with step indicators
- [ ] Completed listings show title, description, price, comparables, market notes
- [ ] User can copy full listing or individual sections to clipboard
- [ ] User can enhance images with AI and manage enhanced variants
- [ ] User can change listing status (Listed, Sold, Archive) and delete listings
- [ ] App supports light and dark mode
- [ ] All Phase 0-4 checkpoints pass

## External Dependencies

| Dependency | Purpose | Version | Documentation |
| ---------- | ------- | ------- | ------------- |
| SwiftUI | UI framework | iOS 17+ | developer.apple.com/documentation/swiftui |
| Foundation / URLSession | Networking | iOS 17+ | developer.apple.com/documentation/foundation/urlsession |
| Security (Keychain) | Secure token storage | iOS 17+ | developer.apple.com/documentation/security |
| PhotosUI (PhotosPicker) | Photo library access | iOS 17+ | developer.apple.com/documentation/photosui |
| AVFoundation | Camera capture | iOS 17+ | developer.apple.com/documentation/avfoundation |
| Speech (SFSpeechRecognizer) | Voice-to-text | iOS 17+ | developer.apple.com/documentation/speech |
| UserNotifications | Push notification handling | iOS 17+ | developer.apple.com/documentation/usernotifications |
| Kingfisher | Async image loading + caching | ~7.x | github.com/onevcat/Kingfisher |
| Swift Testing | Unit test framework | Xcode 16+ | developer.apple.com/documentation/testing |
| XCTest | UI test framework | Xcode 16+ | developer.apple.com/documentation/xctest |

### Server-Side Changes Required (in apps/api/)

| Change | Purpose | Files |
| ------ | ------- | ----- |
| APNs notification sending | Send push to iOS devices | apps/api/src/lib/notifications.ts, package.json (add `apn`) |
| Push subscription type | Distinguish web push vs APNs tokens | packages/db/src/schema.ts (push_subscriptions) |
| Push subscribe endpoint | Accept APNs device tokens | apps/api/src/routes/push.ts |

## Open Questions

- [ ] BetterAuth bearer token flow: Verify that `POST /auth/sign-in/email` returns a bearer token directly (vs. setting cookies). May need to test the bearer plugin behavior.
- [ ] APNs authentication: Use APNs authentication key (`.p8` file) vs. certificates. Key-based is recommended (no expiration).
- [ ] App Store distribution: When to submit for TestFlight / App Store review. Need Apple Developer Program membership.
- [ ] Image compression: Optimal JPEG quality for upload (0.7-0.8 range). Need to balance file size vs. AI analysis quality.
- [ ] Deep linking scheme: `listwell://listings/:id` vs. Universal Links for notification deep linking.

## Technology References

| Technology | Purpose | Documentation |
| ---------- | ------- | ------------- |
| SwiftUI | Declarative UI framework | developer.apple.com/documentation/swiftui |
| @Observable macro | Modern state management | developer.apple.com/documentation/observation |
| NavigationStack | Programmatic navigation | developer.apple.com/documentation/swiftui/navigationstack |
| URLSession async/await | Modern networking | developer.apple.com/documentation/foundation/urlsession |
| Keychain Services | Secure credential storage | developer.apple.com/documentation/security/keychain_services |
| PhotosPicker | Native photo selection | developer.apple.com/documentation/photosui/photospicker |
| SFSpeechRecognizer | On-device speech recognition | developer.apple.com/documentation/speech/sfspeechrecognizer |
| APNs | Apple Push Notification service | developer.apple.com/documentation/usernotifications |
| Kingfisher | Image downloading/caching | github.com/onevcat/Kingfisher |
| Swift Testing | Modern test framework | developer.apple.com/documentation/testing |
| BetterAuth | Authentication (API-side) | better-auth.com/docs |
| Hono | REST API framework (API-side) | hono.dev |

## Parallel Execution Waves

> Phases grouped by dependency graph for concurrent development.
> Wave N+1 depends on Wave N being complete.

| Wave | Phases | Feature Groups |
| ---- | ------ | -------------- |
| 1 | 0 | Project Foundation — must complete first |
| 2 | 1 | Authentication — all screens depend on auth |
| 3 | 2 | Core Listing Screens — all CRUD + UI |
| 4 | 3, 4, 5 | Pipeline UI (depends on Phase 2), Image Enhancement (depends on Phase 3), Voice & Push (depends on Phase 2) — can partially parallelize |
| 5 | 6 | Polish & Testing — depends on all features being built |

## Notes for Implementation

### Project Structure

```
apps/ios/
├── Listwell/
│   ├── Listwell.xcodeproj
│   ├── Listwell/
│   │   ├── ListwellApp.swift              ← App entry point
│   │   ├── ContentView.swift              ← Auth gate (login vs main)
│   │   ├── Info.plist
│   │   ├── Resources/
│   │   │   └── Assets.xcassets/           ← Colors, app icon, images
│   │   ├── Models/
│   │   │   ├── Listing.swift              ← Codable listing model
│   │   │   ├── ListingImage.swift         ← Codable image model
│   │   │   ├── Comparable.swift           ← Market comparable
│   │   │   ├── AgentLogEntry.swift        ← Pipeline log entry
│   │   │   ├── User.swift                 ← Auth user model
│   │   │   └── Enums.swift                ← ListingStatus, PipelineStep, ImageType
│   │   ├── Services/
│   │   │   ├── APIClient.swift            ← URLSession actor, bearer auth
│   │   │   ├── AuthService.swift          ← Login/register/logout
│   │   │   ├── ListingsService.swift      ← Listings CRUD
│   │   │   ├── ImageUploadService.swift   ← Presigned URL upload flow
│   │   │   ├── SpeechRecognizer.swift     ← SFSpeechRecognizer wrapper
│   │   │   ├── PushNotificationManager.swift  ← APNs registration
│   │   │   └── KeychainManager.swift      ← Secure token storage
│   │   ├── ViewModels/
│   │   │   ├── AuthViewModel.swift
│   │   │   ├── FeedViewModel.swift
│   │   │   ├── NewListingViewModel.swift
│   │   │   ├── ListingDetailViewModel.swift
│   │   │   └── EnhancementViewModel.swift
│   │   ├── Views/
│   │   │   ├── Auth/
│   │   │   │   └── LoginView.swift
│   │   │   ├── Feed/
│   │   │   │   ├── FeedView.swift
│   │   │   │   └── ListingCardView.swift
│   │   │   ├── NewListing/
│   │   │   │   ├── CaptureView.swift
│   │   │   │   ├── DescribeView.swift
│   │   │   │   └── PhotoGridView.swift
│   │   │   ├── Detail/
│   │   │   │   ├── ListingDetailView.swift
│   │   │   │   ├── ImageCarouselView.swift
│   │   │   │   ├── PipelineStepsView.swift
│   │   │   │   ├── ComparablesView.swift
│   │   │   │   └── ProductDetailsView.swift
│   │   │   ├── Enhancement/
│   │   │   │   └── EnhancementSheet.swift
│   │   │   └── Shared/
│   │   │       ├── ListingStatusBadge.swift
│   │   │       ├── CopyButton.swift
│   │   │       ├── EmptyStateView.swift
│   │   │       ├── FABButton.swift
│   │   │       └── CameraView.swift
│   │   └── Utilities/
│   │       ├── ListingFormatter.swift     ← formatListingForClipboard equivalent
│   │       ├── TimeAgo.swift              ← Relative date formatting
│   │       └── Constants.swift            ← API base URL, colors, sizing
│   └── ListwellTests/
│       ├── Services/
│       ├── ViewModels/
│       └── Models/
```

### Design System Mapping

Map web CSS variables to iOS Asset Catalog color sets:

| Web Token | iOS Color Set Name | Light | Dark |
| --------- | ------------------ | ----- | ---- |
| `--primary` | `AccentColor` | #279E89 (teal) | slightly lighter teal |
| `--background` | `AppBackground` | #FFFFFF | #0E0E11 |
| `--foreground` | `AppForeground` | #131316 | #F2F2F2 |
| `--card` | `CardBackground` | #FFFFFF | #161619 |
| `--muted` | `MutedBackground` | #F3F3F4 | dark gray |
| `--muted-foreground` | `MutedForeground` | #6E6E76 | lighter gray |
| `--destructive` | `Destructive` | #D93636 | lighter red |
| `--border` | `BorderColor` | #E4E4E7 | dark border |
| Status: Processing | `StatusProcessing` | amber-100/700 | amber-900/400 |
| Status: Ready | `StatusReady` | emerald-100/700 | emerald-900/400 |
| Status: Listed | `StatusListed` | blue-100/700 | blue-900/400 |
| Status: Sold | `StatusSold` | purple-100/700 | purple-900/400 |
| Status: Error | `StatusError` | red-100/700 | red-900/400 |

### Icon Mapping (Lucide → SF Symbols)

| Web (Lucide) | iOS (SF Symbols) | Usage |
| ------------ | ---------------- | ----- |
| `Plus` | `plus` | FAB, add photo |
| `Camera` | `camera` | Camera button |
| `ImagePlus` | `photo.badge.plus` | Gallery/upload |
| `Mic` | `mic` | Voice input |
| `MicOff` | `mic.slash` | Stop recording |
| `Copy` | `doc.on.doc` | Copy to clipboard |
| `Check` | `checkmark` | Copy success |
| `Sparkles` | `wand.and.stars` | Enhance |
| `Trash2` | `trash` | Delete |
| `ArrowLeft` | `chevron.left` | Back (native) |
| `MoreVertical` | `ellipsis` | Menu |
| `ExternalLink` | `arrow.up.right` | Open URL |
| `Loader2` | `ProgressView()` | Loading spinner |
| `CheckCircle` | `checkmark.circle.fill` | Complete |
| `AlertCircle` | `exclamationmark.circle.fill` | Error |
| `X` | `xmark` | Close/dismiss |
| `DollarSign` | `dollarsign` | Price |
| `Eye` | `eye` | Analyzing |
| `Search` | `magnifyingglass` | Researching |
| `PenLine` | `pencil.line` | Writing |
| `Clock` | `clock` | Queued |

### Key Patterns

- **View model ownership:** Views create their own `@State private var viewModel = XxxViewModel()`. Shared state uses `@Environment`.
- **Async data loading:** Use `.task { }` modifier on views — automatically cancelled when view disappears.
- **Navigation:** Single `NavigationStack` with typed `NavigationPath`. Feed is root, all other views are pushed.
- **Image compression:** `UIImage.jpegData(compressionQuality: 0.8)` before upload. Max dimension resize to 2048px.
- **Error handling:** View models expose `errorMessage: String?` — views show alert or inline text.
- **Haptics:** Use `.sensoryFeedback(.success, trigger:)` for copy, submit, status change actions.
- **Safe areas:** SwiftUI handles safe areas automatically. Use `.ignoresSafeArea()` only for full-bleed images.
- **Pull-to-refresh:** Use `.refreshable { }` modifier on List/ScrollView.

### API Endpoint Quick Reference

All endpoints require `Authorization: Bearer <token>` except auth routes.

| Endpoint | Method | Request | Response |
| -------- | ------ | ------- | -------- |
| `/auth/sign-in/email` | POST | `{ email, password }` | Session + token |
| `/auth/sign-up/email` | POST | `{ email, password, name }` | Session + token |
| `/listings` | GET | — | `Listing[]` |
| `/listings` | POST | `{ description?, images: [{key, url, filename}] }` | `Listing` |
| `/listings/:id` | GET | — | `Listing` (with images) |
| `/listings/:id` | PATCH | `{ title?, description?, suggestedPrice?, status?, retry? }` | `Listing` |
| `/listings/:id` | DELETE | — | `{ success: true }` |
| `/listings/:id/images` | DELETE | `?imageId=X` | `{ success: true }` |
| `/listings/:id/enhance` | POST | `{ imageId }` | `{ status: "processing" }` |
| `/upload/presign` | POST | `{ files: [{filename, contentType}] }` | `{ uploads: [{presignedUrl, key, publicUrl}] }` |
| `/transcribe` | POST | FormData with `audio` file | `{ text }` |
| `/push/subscribe` | POST | `{ endpoint, p256dh, auth }` or `{ type: "apns", deviceToken }` | `{ success: true }` |
| `/push/subscribe` | DELETE | `{ endpoint }` or `{ deviceToken }` | `{ success: true }` |
| `/health` | GET | — | `{ status: "ok" }` |
