# iOS Implementation Tasks

> Generated from docs/ios-plan.md on 2026-02-21
>
> **Instructions for Claude:** Complete tasks sequentially within each phase.
> Mark each task complete immediately after implementation.
> Build and run tests after each task. Commit after each working change.
> **All code must have tests with ≥80% coverage on affected files.**
>
> **UI Tasks:** Reference `docs/screens.md` for layout/component specs and
> `docs/design-system.md` for tokens, colors, typography, and component patterns.
> Reference `docs/ios-plan.md` § Design System Mapping for color token → Asset Catalog mapping
> and § Icon Mapping for Lucide → SF Symbols equivalents.

## Parallel Execution Waves

> Feature groups organized by dependency graph. Each wave's features can be built
> concurrently using git worktrees and separate Claude Code instances.
> Wave N+1 depends on Wave N being complete.

### Wave 1: Foundation

- **Phase 0**: Project Foundation — must complete before all other work

### Wave 2: Authentication

- **Phase 1**: Authentication — login/register, Keychain, auth state

### Wave 3: Core Screens

- **Phase 2**: Core Listing Screens — feed, capture, describe, detail, copy

### Wave 4: Pipeline + Enhancement + Voice/Push (parallel)

- **Phase 3**: Pipeline & Real-time Updates _(depends on Phase 2)_
- **Phase 4**: Image Enhancement _(depends on Phase 3)_
- **Phase 5**: Voice Input & Push Notifications _(depends on Phase 2, independent of Phases 3-4)_

### Wave 5: Polish

- **Phase 6**: Polish & Testing _(depends on Phases 3, 4, 5)_

---

## Progress Summary

- Phase 0: [ ] Not Started
- Phase 1: [ ] Not Started
- Phase 2: [ ] Not Started
- Phase 3: [ ] Not Started
- Phase 4: [ ] Not Started
- Phase 5: [ ] Not Started
- Phase 6: [ ] Not Started
- **MVP Status:** Not Started

---

## Phase 0: Project Foundation

### 0.0 Pre-flight

- [ ] 0.0.1: Read CLAUDE.md and ios-plan.md, confirm understanding of project conventions and iOS architecture
- [ ] 0.0.2: Verify no uncommitted changes in working directory

### 0.1 Xcode Project Setup

- [ ] 0.1.1: Create Xcode project with SwiftUI lifecycle at `apps/ios/Listwell/`
  - Files: Listwell.xcodeproj, ListwellApp.swift, ContentView.swift
  - Configure: iOS 17+ deployment target, Swift 5.9+, bundle identifier `com.listwell.app`
  - Test: Project builds and runs in simulator
- [ ] 0.1.2: Add Kingfisher via Swift Package Manager
  - Files: Listwell.xcodeproj (package dependency)
  - Package URL: `https://github.com/onevcat/Kingfisher.git`, version ~> 7.0
  - Test: `import KingfisherSwiftUI` compiles without errors
- [ ] 0.1.3: Create folder structure per ios-plan.md project structure
  - Folders: Models/, Services/, ViewModels/, Views/Auth/, Views/Feed/, Views/NewListing/, Views/Detail/, Views/Enhancement/, Views/Shared/, Utilities/, Resources/
  - Test: Folders exist in Xcode project navigator
- [ ] 0.1.4: Create unit test target `ListwellTests`
  - Files: ListwellTests/ target in Xcode project
  - Test: Empty test suite runs successfully

### 0.2 Design System

- [ ] 0.2.1: Create Asset Catalog color sets for all design system tokens (light + dark)
  - Files: Resources/Assets.xcassets/ — color sets: AccentColor, AppBackground, AppForeground, CardBackground, MutedBackground, MutedForeground, Destructive, BorderColor, SecondaryBackground, SecondaryForeground
  - Ref: `docs/ios-plan.md` § Design System Mapping, `docs/design-system.md` § Color Tokens
  - Test: All color sets defined with Both Appearances (Any + Dark)
- [ ] 0.2.2: Create Asset Catalog color sets for status badge colors
  - Files: Resources/Assets.xcassets/ — color set pairs (bg + fg): StatusProcessingBg/Fg, StatusReadyBg/Fg, StatusListedBg/Fg, StatusSoldBg/Fg, StatusErrorBg/Fg, StatusDraftBg/Fg, StatusArchivedBg/Fg
  - Ref: `docs/design-system.md` § Status Colors
  - Test: All status color sets defined with light + dark variants
- [ ] 0.2.3: Create `Constants.swift` with typography scale, spacing, and sizing constants
  - Files: Utilities/Constants.swift
  - Define: Font sizes matching web type scale (pageTitle: 24, sectionHeading: 18, cardTitle: 16, body: 14, caption: 12, priceLarge: 30), corner radii (default: 10, small: 6, image: 8), minimum tap target (44pt)
  - Ref: `docs/design-system.md` § Typography, § Spacing, § Border Radius
  - Test: Constants compile and are accessible from any view
- [ ] 0.2.4: Create `Color` extension for convenient access to custom color tokens
  - Files: Utilities/Constants.swift (extend)
  - Define: `Color.appBackground`, `Color.appForeground`, `Color.cardBackground`, `Color.mutedBackground`, `Color.mutedForeground`, `Color.destructive`, `Color.borderColor`
  - Test: `Color.appBackground` resolves correctly in SwiftUI preview

### 0.3 Networking Foundation

- [ ] 0.3.1: Create `APIClient` actor with URLSession, base URL configuration, and JSON encoding/decoding
  - Files: Services/APIClient.swift
  - Implement: `actor APIClient` with shared singleton, configurable base URL, JSONEncoder/JSONDecoder with iso8601 date strategy
  - Test: APIClient initializes without errors
- [ ] 0.3.2: Add generic request method to APIClient with bearer token injection
  - Files: Services/APIClient.swift
  - Implement: `func request<T: Decodable>(_ method: HTTPMethod, path: String, body: Encodable?, token: String?) async throws -> T`
  - Define: `HTTPMethod` enum (get, post, patch, delete), `APIError` enum (invalidResponse, httpError, decodingError, unauthorized)
  - Test: Request builds correct URLRequest with method, headers, body, and Authorization header
- [ ] 0.3.3: Add empty-response request method and raw data request method to APIClient
  - Files: Services/APIClient.swift
  - Implement: `func requestVoid(...)` for DELETE endpoints returning `{ success: true }`, `func requestData(...)` for raw data responses
  - Test: Void request handles 200 response without decoding body
- [ ] 0.3.4: Write tests for APIClient (request building, error handling, token injection)
  - Files: ListwellTests/Services/APIClientTests.swift
  - Test: Tests pass with ≥80% coverage using URLProtocol mock

### 0.4 Secure Storage

- [ ] 0.4.1: Create `KeychainManager` enum with save, retrieve, and delete operations
  - Files: Services/KeychainManager.swift
  - Implement: `save(token:forKey:)`, `retrieve(forKey:) -> String?`, `delete(forKey:)` using Security framework
  - Use `kSecAttrAccessibleWhenUnlocked` for token accessibility
  - Define: `KeychainError` enum (duplicateItem, itemNotFound, unexpectedStatus)
  - Test: Can save, retrieve, and delete a test token
- [ ] 0.4.2: Write tests for KeychainManager
  - Files: ListwellTests/Services/KeychainManagerTests.swift
  - Test: Save + retrieve returns same value, delete removes item, retrieve on missing key returns nil

### 0.5 Data Models

- [ ] 0.5.1: Create `ListingStatus` and `PipelineStep` enums with Codable conformance
  - Files: Models/Enums.swift
  - ListingStatus cases: draft, processing, ready, listed, sold, archived
  - PipelineStep cases: pending, analyzing, researching, generating, complete, error
  - ImageType cases: original, enhanced
  - Use `String` raw values matching API uppercase format (e.g., "DRAFT", "PROCESSING")
  - Test: Decoding from JSON string "PROCESSING" produces `.processing`
- [ ] 0.5.2: Create `Listing` Codable model matching API response shape
  - Files: Models/Listing.swift
  - Fields: id, userId, rawDescription?, title?, description?, suggestedPrice?, priceRangeLow?, priceRangeHigh?, category?, condition?, brand?, model?, researchNotes?, comparables?, status, pipelineStep, pipelineError?, agentLog?, inngestRunId?, createdAt, updatedAt, images?
  - Test: Decodes from sample JSON matching GET /listings/:id response
- [ ] 0.5.3: Create `ListingImage` Codable model
  - Files: Models/ListingImage.swift
  - Fields: id, listingId, type (ImageType), blobUrl, blobKey, parentImageId?, sortOrder, isPrimary, geminiPrompt?, createdAt
  - Test: Decodes from sample JSON
- [ ] 0.5.4: Create `Comparable` and `AgentLogEntry` Codable models
  - Files: Models/Comparable.swift, Models/AgentLogEntry.swift
  - Comparable fields: title, price, source, url?, condition?, soldDate?
  - AgentLogEntry fields: ts (TimeInterval), type (String), content (String)
  - Test: Both decode from sample JSON
- [ ] 0.5.5: Create `User` Codable model for auth responses
  - Files: Models/User.swift
  - Fields: id, name, email, createdAt, updatedAt
  - Test: Decodes from BetterAuth session response JSON
- [ ] 0.5.6: Create request/response DTOs for API interactions
  - Files: Models/APIModels.swift
  - Define: `CreateListingRequest` (description?, images: [ImageRef]), `ImageRef` (key, url, filename), `PresignRequest` (files: [FileInfo]), `FileInfo` (filename, contentType), `PresignResponse` (uploads: [PresignedUpload]), `PresignedUpload` (presignedUrl, key, publicUrl), `PatchListingRequest` (title?, description?, suggestedPrice?, status?, retry?), `EnhanceRequest` (imageId), `AuthRequest` (email, password, name?), `AuthResponse` (session, token, user)
  - Test: All DTOs encode/decode correctly
- [ ] 0.5.7: Write comprehensive tests for all data models
  - Files: ListwellTests/Models/ModelDecodingTests.swift
  - Test: Tests pass with ≥80% coverage, including edge cases (null optionals, empty arrays, unknown enum values)

### 0.6 Utilities

- [ ] 0.6.1: Create `ListingFormatter` with `formatForClipboard` function
  - Files: Utilities/ListingFormatter.swift
  - Implement: Matches web `formatListingForClipboard` output — "Title - $Price\n\nDescription\n\nCondition: X | Brand: Y | Model: Z"
  - Test: Formatted output matches expected string for sample listing
- [ ] 0.6.2: Create `TimeAgo` utility for relative date formatting
  - Files: Utilities/TimeAgo.swift
  - Implement: Uses `RelativeDateTimeFormatter` for "2 hours ago", "3 days ago" etc.
  - Test: Produces expected relative strings for various date offsets

**Phase 0 Checkpoint:**

- [ ] Xcode project builds and runs in simulator (iOS 17+)
- [ ] All design system color tokens mapped to Asset Catalog (light + dark)
- [ ] APIClient actor compiles with URLSession + bearer token injection
- [ ] KeychainManager saves/retrieves/deletes tokens
- [ ] All Codable models decode from sample API JSON
- [ ] ListingFormatter produces correct clipboard output
- [ ] Test target runs successfully with ≥80% coverage on Phase 0 code
- [ ] Commit: "chore(ios): complete project foundation (Phase 0)"

---

## Phase 1: Authentication

### 1.1 Auth Service

- [ ] 1.1.1: Create `AuthService` with sign-in method using BetterAuth bearer plugin
  - Files: Services/AuthService.swift
  - Implement: `func signIn(email:password:) async throws -> AuthResponse` — POST `/api/auth/sign-in/email`
  - Parse bearer token from response and return alongside user data
  - Test: Successful sign-in returns token and user (mock URLProtocol)
- [ ] 1.1.2: Add sign-up method to AuthService
  - Files: Services/AuthService.swift
  - Implement: `func signUp(email:password:name:) async throws -> AuthResponse` — POST `/api/auth/sign-up/email`
  - Test: Successful sign-up returns token and user
- [ ] 1.1.3: Add sign-out and session check methods to AuthService
  - Files: Services/AuthService.swift
  - Implement: `func signOut() async throws` — POST `/api/auth/sign-out`, `func getSession(token:) async throws -> User` — GET `/api/auth/get-session`
  - Test: Sign-out clears session, getSession validates token
- [ ] 1.1.4: Write tests for AuthService (sign-in, sign-up, sign-out, error cases)
  - Files: ListwellTests/Services/AuthServiceTests.swift
  - Test: Tests pass with ≥80% coverage, including 401 handling and network errors

### 1.2 Auth State & View Model

- [ ] 1.2.1: Create `AuthState` observable for app-wide auth tracking
  - Files: ViewModels/AuthViewModel.swift
  - Implement: `@Observable @MainActor final class AuthState` with properties: `isLoggedIn`, `currentUser: User?`, `token: String?`, `isLoading`, `errorMessage: String?`
  - On init: check Keychain for existing token → validate with getSession → set isLoggedIn
  - Test: AuthState initializes correctly from Keychain state
- [ ] 1.2.2: Add login, register, and logout actions to AuthState
  - Files: ViewModels/AuthViewModel.swift
  - Implement: `func login(email:password:)` — calls AuthService, saves token to Keychain, sets user; `func register(email:password:name:)` — same flow; `func logout()` — clears Keychain, resets state
  - Test: Login saves token to Keychain, logout clears it
- [ ] 1.2.3: Update `ContentView` to switch between LoginView and MainView based on AuthState
  - Files: ContentView.swift, ListwellApp.swift
  - Implement: Inject `AuthState` via `.environment()` in App, ContentView checks `authState.isLoggedIn`
  - Show splash/loading while checking Keychain token on startup
  - Test: ContentView shows LoginView when not logged in, MainView when logged in

### 1.3 Login UI

- [ ] 1.3.1: Build `LoginView` with email and password fields and login/register tab picker
  - Files: Views/Auth/LoginView.swift
  - Implement: `Picker` or segmented control for "Log in" / "Sign up" tabs, email `TextField`, password `SecureField`, confirm password (register only), submit `Button`
  - Ref: `docs/screens.md` § Screen 1: Login/Register — `docs/design-system.md`
  - Match: Centered vertically, card-like container, app name "Listwell" + tagline at top
  - Test: Both tabs render correct fields, tab switching works
- [ ] 1.3.2: Add form validation to LoginView
  - Files: Views/Auth/LoginView.swift
  - Implement: Email format validation, password minimum length (8 chars), confirm password match on register tab
  - Disable submit button until validation passes
  - Test: Submit disabled with invalid email, enabled with valid inputs
- [ ] 1.3.3: Wire LoginView to AuthState actions with loading and error states
  - Files: Views/Auth/LoginView.swift
  - Implement: Submit calls `authState.login()` or `authState.register()`, show `ProgressView` on button while loading, show error text below form on failure, clear error on tab switch
  - Test: Successful login transitions to MainView, error shows inline message
- [ ] 1.3.4: Write tests for LoginView
  - Files: ListwellTests/Views/LoginViewTests.swift
  - Test: Tests pass with ≥80% coverage — form rendering, validation, error display

**Phase 1 Checkpoint:**

- [ ] User can register with email/password
- [ ] User can log in with email/password
- [ ] Bearer token persists in Keychain across app restarts
- [ ] App shows login screen when no valid token, main screen when authenticated
- [ ] Logout clears token and returns to login
- [ ] Form validation works (email format, password length, confirm match)
- [ ] Error messages display inline below form
- [ ] All tests pass with ≥80% code coverage on Phase 1 code
- [ ] Commit: "feat(ios): complete authentication (Phase 1)"

---

## Phase 2: Core Listing Screens

### 2.1 Listings Service

- [ ] 2.1.1: Create `ListingsService` with fetch all listings method
  - Files: Services/ListingsService.swift
  - Implement: `func fetchListings(token:) async throws -> [Listing]` — GET `/api/listings`
  - Test: Returns decoded array of listings
- [ ] 2.1.2: Add fetch single listing method to ListingsService
  - Files: Services/ListingsService.swift
  - Implement: `func fetchListing(id:token:) async throws -> Listing` — GET `/api/listings/:id`
  - Test: Returns listing with images array populated
- [ ] 2.1.3: Add create listing method to ListingsService
  - Files: Services/ListingsService.swift
  - Implement: `func createListing(description:images:token:) async throws -> Listing` — POST `/api/listings`
  - Test: Creates listing with image refs, returns listing with status PROCESSING
- [ ] 2.1.4: Add update and delete listing methods to ListingsService
  - Files: Services/ListingsService.swift
  - Implement: `func updateListing(id:updates:token:) async throws -> Listing` — PATCH `/api/listings/:id`, `func deleteListing(id:token:) async throws` — DELETE `/api/listings/:id`
  - Test: Update changes status, delete returns success
- [ ] 2.1.5: Write tests for ListingsService
  - Files: ListwellTests/Services/ListingsServiceTests.swift
  - Test: Tests pass with ≥80% coverage

### 2.2 Image Upload Service

- [ ] 2.2.1: Create `ImageUploadService` with presigned URL request method
  - Files: Services/ImageUploadService.swift
  - Implement: `func requestPresignedURLs(files:token:) async throws -> [PresignedUpload]` — POST `/api/upload/presign`
  - Test: Returns presigned URLs for given file info
- [ ] 2.2.2: Add direct upload to presigned URL method
  - Files: Services/ImageUploadService.swift
  - Implement: `func uploadImage(data:contentType:to presignedUrl:) async throws` — PUT to presigned URL with image data body and Content-Type header
  - Test: Upload completes without error (mock)
- [ ] 2.2.3: Add full upload flow method combining presign + upload + image compression
  - Files: Services/ImageUploadService.swift
  - Implement: `func uploadImages(_ images: [UIImage], token:) async throws -> [ImageRef]` — compress to JPEG (0.8 quality, max 2048px), request presigned URLs, upload each in parallel with TaskGroup, return ImageRef array
  - Helper: `func compressImage(_ image: UIImage, maxDimension: CGFloat, quality: CGFloat) -> Data`
  - Test: Full flow returns ImageRef array with keys and URLs
- [ ] 2.2.4: Write tests for ImageUploadService
  - Files: ListwellTests/Services/ImageUploadServiceTests.swift
  - Test: Tests pass with ≥80% coverage, including compression and parallel upload

### 2.3 Shared Components

- [ ] 2.3.1: Build `ListingStatusBadge` view with status-specific colors and optional icon
  - Files: Views/Shared/ListingStatusBadge.swift
  - Implement: Takes `ListingStatus`, renders rounded capsule with status color bg/fg from Asset Catalog. PROCESSING shows `ProgressView` inline, ERROR shows `exclamationmark.circle.fill`
  - Ref: `docs/screens.md` § ListingStatusBadge, `docs/design-system.md` § Status Colors
  - Test: Renders correct colors for each of 7 statuses
- [ ] 2.3.2: Build `CopyButton` view with clipboard, haptic, and visual feedback
  - Files: Views/Shared/CopyButton.swift
  - Implement: Button with `doc.on.doc` icon, on tap: copy text to `UIPasteboard.general.string`, swap icon to `checkmark` for 2s, trigger `.sensoryFeedback(.success)`
  - Ref: `docs/screens.md` § CopyButton
  - Test: Tap copies text to pasteboard, icon toggles
- [ ] 2.3.3: Build `EmptyStateView` with icon, title, and description
  - Files: Views/Shared/EmptyStateView.swift
  - Implement: Centered VStack with SF Symbol icon (48pt, muted), title text, description text
  - Ref: `docs/screens.md` § EmptyState
  - Test: Renders icon, title, and description
- [ ] 2.3.4: Build `FABButton` (Floating Action Button) view
  - Files: Views/Shared/FABButton.swift
  - Implement: Circle button (56pt), accent color, `plus` SF Symbol (24pt), positioned bottom-trailing with padding. Scale-down animation on press.
  - Ref: `docs/screens.md` § FAB, `docs/design-system.md` § Floating Action Button
  - Test: Renders at bottom-right, tap triggers action
- [ ] 2.3.5: Build `CameraView` UIViewControllerRepresentable for camera capture
  - Files: Views/Shared/CameraView.swift
  - Implement: Wraps `UIImagePickerController` with `.camera` source type, returns captured `UIImage` via binding, handles cancel
  - Test: Representable creates UIImagePickerController with camera source
- [ ] 2.3.6: Write tests for all shared components
  - Files: ListwellTests/Views/SharedComponentTests.swift
  - Test: Tests pass with ≥80% coverage

### 2.4 Feed Screen

- [ ] 2.4.1: Create `FeedViewModel` observable for feed data management
  - Files: ViewModels/FeedViewModel.swift
  - Implement: `@Observable @MainActor final class FeedViewModel` — properties: `listings: [Listing]`, `isLoading`, `errorMessage`, methods: `func loadListings()`, `func refresh()`
  - Uses AuthState token for API calls
  - Test: loadListings fetches and stores listings
- [ ] 2.4.2: Build `ListingCardView` for feed display
  - Files: Views/Feed/ListingCardView.swift
  - Implement: HStack with thumbnail (80x80, rounded, Kingfisher for async loading), VStack with title (or "Processing..." italic when processing), status badge, price (if ready+), pipeline step text + spinner (if processing), relative time
  - Ref: `docs/screens.md` § ListingCard Component
  - Test: Renders all states — processing with spinner, ready with price, sold with badge
- [ ] 2.4.3: Build `FeedView` with listings list, empty state, and FAB
  - Files: Views/Feed/FeedView.swift
  - Implement: NavigationStack root, ScrollView with LazyVStack of ListingCardViews, EmptyStateView when no listings ("No listings yet" + "Tap + to create your first one"), FAB overlay, `.refreshable` for pull-to-refresh, `.task` for initial load
  - Ref: `docs/screens.md` § Screen 2: Listings Feed
  - Test: Shows listings, shows empty state, FAB visible
- [ ] 2.4.4: Add header with title and overflow menu to FeedView
  - Files: Views/Feed/FeedView.swift
  - Implement: HStack with "Your Listings" title (text-2xl bold), Menu with "Log out" item (calls authState.logout())
  - Ref: `docs/screens.md` § Screen 2: header
  - Test: Title renders, logout menu item works
- [ ] 2.4.5: Add navigation from feed cards to listing detail
  - Files: Views/Feed/FeedView.swift
  - Implement: `NavigationLink` or `.navigationDestination` — tap card navigates to `ListingDetailView(listingId:)`
  - Test: Tap card pushes detail view
- [ ] 2.4.6: Write tests for FeedView and FeedViewModel
  - Files: ListwellTests/Views/FeedViewTests.swift, ListwellTests/ViewModels/FeedViewModelTests.swift
  - Test: Tests pass with ≥80% coverage

### 2.5 New Listing — Capture

- [ ] 2.5.1: Create `NewListingViewModel` observable for multi-step new listing flow
  - Files: ViewModels/NewListingViewModel.swift
  - Implement: `@Observable @MainActor final class NewListingViewModel` — properties: `selectedImages: [UIImage]`, `description: String`, `isSubmitting`, `errorMessage`, `submittedListingId: String?`, methods: `addImage(_:)`, `removeImage(at:)`, `reset()`
  - Max 5 images, min 1 to proceed
  - Test: Can add/remove images, respects 5 limit
- [ ] 2.5.2: Build `PhotoGridView` component for image thumbnail grid
  - Files: Views/NewListing/PhotoGridView.swift
  - Implement: LazyVGrid (3 columns, spacing 8) with image thumbnails (aspect ratio 1:1, rounded 8pt, object-fit cover) + remove button (X) overlay on each. Empty add slot with dashed border and `photo.badge.plus` icon when < 5 photos.
  - Ref: `docs/screens.md` § Screen 3: Photo Grid
  - Test: Grid shows images, X button removes, empty slot shows when under limit
- [ ] 2.5.3: Build `CaptureView` with photo grid and capture buttons
  - Files: Views/NewListing/CaptureView.swift
  - Implement: Navigation bar with back button + "Add Photos" title. PhotoGridView. Two buttons: "Take Photo" (camera SF Symbol, presents CameraView sheet) and "Choose from Library" (photo.badge.plus, presents PhotosPicker). Bottom bar with "Next" button (disabled when 0 photos, shows count "Next — N photo(s)"). Helper text: "Add 3-5 photos from different angles for best results"
  - Ref: `docs/screens.md` § Screen 3: New Listing — Capture
  - Test: Camera/gallery buttons trigger respective pickers, Next enabled only with ≥1 photo
- [ ] 2.5.4: Write tests for CaptureView and PhotoGridView
  - Files: ListwellTests/Views/CaptureViewTests.swift
  - Test: Tests pass with ≥80% coverage

### 2.6 New Listing — Describe & Submit

- [ ] 2.6.1: Build `DescribeView` with photo strip and text editor
  - Files: Views/NewListing/DescribeView.swift
  - Implement: Navigation bar with back + "Describe It" title. Horizontal ScrollView of photo thumbnails (64x64, rounded). TextEditor with placeholder "Tell us about this item — brand, condition, why you're selling... (optional)" (min height 160pt). Helper text: "More detail = better results. But you can also skip this." Bottom bar with "Skip" (secondary) and "Generate Listing" (primary) buttons.
  - Ref: `docs/screens.md` § Screen 4: New Listing — Describe
  - Test: Thumbnail strip shows photos, text editor accepts input, both buttons present
- [ ] 2.6.2: Implement listing submission flow in NewListingViewModel
  - Files: ViewModels/NewListingViewModel.swift
  - Implement: `func submitListing(token:) async throws` — compress images → upload via ImageUploadService → create listing via ListingsService → set `submittedListingId`
  - Show upload progress via `uploadProgress: Double` property
  - Test: Submission calls upload + create in sequence, sets listingId on success
- [ ] 2.6.3: Wire DescribeView submission to navigate to listing detail
  - Files: Views/NewListing/DescribeView.swift
  - Implement: "Generate Listing" and "Skip" both call `viewModel.submitListing()`. Show loading overlay during submission. On success, navigate to `ListingDetailView(listingId:)` and reset NewListingViewModel.
  - Test: Submit shows loading, navigates on success, shows error on failure
- [ ] 2.6.4: Write tests for DescribeView and submission flow
  - Files: ListwellTests/Views/DescribeViewTests.swift, ListwellTests/ViewModels/NewListingViewModelTests.swift
  - Test: Tests pass with ≥80% coverage

### 2.7 Listing Detail — Ready State

- [ ] 2.7.1: Create `ListingDetailViewModel` observable for detail screen data
  - Files: ViewModels/ListingDetailViewModel.swift
  - Implement: `@Observable @MainActor final class ListingDetailViewModel` — properties: `listing: Listing?`, `isLoading`, `errorMessage`, methods: `func loadListing(id:)`, `func updateStatus(_:)`, `func deleteListing()`, `func copyFullListing()`
  - Test: loadListing fetches and stores listing data
- [ ] 2.7.2: Build `ImageCarouselView` with horizontal paging and dot indicators
  - Files: Views/Detail/ImageCarouselView.swift
  - Implement: TabView with `.tabViewStyle(.page(indexDisplayMode: .never))` for swipe between images. Kingfisher `KFImage` for async loading. Custom dot indicators below (active = accent color, inactive = muted). Aspect ratio 4:3.
  - Ref: `docs/screens.md` § Image Carousel, `docs/design-system.md` § Image Display Conventions
  - Test: Carousel shows images, dots reflect current page
- [ ] 2.7.3: Build `ProductDetailsView` for brand/model/condition/category grid
  - Files: Views/Detail/ProductDetailsView.swift
  - Implement: Card-like container with 2-column grid. Each cell: label (caption, muted, uppercase) + value (body, medium weight). Fields: Brand, Model, Condition, Category.
  - Ref: `docs/screens.md` § Screen 7: Product Details
  - Test: Renders all 4 detail fields
- [ ] 2.7.4: Build `ComparablesView` for market comparable listings
  - Files: Views/Detail/ComparablesView.swift
  - Implement: "Market Comparables" heading. List of comparable cards — each shows title (truncated), source text (muted), price (semibold), external link button (opens URL in Safari via `Link`).
  - Ref: `docs/screens.md` § Screen 7: Comparable Listings
  - Test: Renders comparables with title, price, source
- [ ] 2.7.5: Build `ListingDetailView` (ready state) assembling all sections
  - Files: Views/Detail/ListingDetailView.swift
  - Implement: ScrollView with sections: ImageCarouselView, status badge + category row, title + CopyButton, price card (suggested price large + market range), description + CopyButton, ProductDetailsView, ComparablesView, market notes (researchNotes text). Bottom bar with "Copy Full Listing" button (doc.on.doc icon). `.task` loads listing on appear.
  - Ref: `docs/screens.md` § Screen 7: Listing Detail — Ready
  - Test: All sections render with sample listing data
- [ ] 2.7.6: Add dropdown menu actions to ListingDetailView
  - Files: Views/Detail/ListingDetailView.swift
  - Implement: Navigation bar trailing `Menu` with items: "Mark as Listed" (if READY), "Mark as Sold" (if LISTED), "Archive", "Delete Listing" (destructive). Status changes call `viewModel.updateStatus()`. Delete shows `.confirmationDialog`.
  - Ref: `docs/screens.md` § Screen 7: DropdownMenu
  - Test: Menu items show for correct statuses, delete shows confirmation
- [ ] 2.7.7: Implement "Copy Full Listing" action with ListingFormatter
  - Files: Views/Detail/ListingDetailView.swift
  - Implement: Bottom bar button calls `ListingFormatter.formatForClipboard(listing)`, copies to `UIPasteboard.general.string`, triggers haptic feedback, shows brief "Copied!" feedback
  - Test: Copy puts formatted text on pasteboard
- [ ] 2.7.8: Write tests for ListingDetailView and all detail sub-components
  - Files: ListwellTests/Views/ListingDetailViewTests.swift, ListwellTests/ViewModels/ListingDetailViewModelTests.swift
  - Test: Tests pass with ≥80% coverage

**Phase 2 Checkpoint:**

- [ ] Listings feed displays user's listings with status badges and thumbnails
- [ ] Empty state shows when no listings exist
- [ ] User can capture photos via camera and photo library (1-5 photos)
- [ ] User can describe item via text editor
- [ ] Submission compresses, uploads images, and creates listing
- [ ] Listing detail shows all sections (images, title, price, description, details, comparables, notes)
- [ ] Copy full listing and individual section copy work with haptic feedback
- [ ] Status can be changed (Listed, Sold, Archive) and listings can be deleted
- [ ] Pull-to-refresh works on feed
- [ ] All tests pass with ≥80% code coverage on Phase 2 code
- [ ] Commit: "feat(ios): complete core listing screens (Phase 2)"

---

## Phase 3: Pipeline & Real-time Updates

### 3.1 Pipeline UI Components

- [ ] 3.1.1: Build `PipelineStepsView` with step indicators matching web processing screen
  - Files: Views/Detail/PipelineStepsView.swift
  - Implement: VStack of step rows. Each row: HStack with icon + label + optional duration. Icon states: completed = `checkmark.circle.fill` (green), active = `ProgressView()` (accent), pending = `circle` (muted/30%). Labels: "Analyzing photos", "Researching prices", "Writing listing", "Finishing up". Active step has bold text, completed has muted text, pending has muted/50%.
  - Ref: `docs/screens.md` § Screen 6: Pipeline Steps, `docs/design-system.md` § Pipeline Step Indicators
  - Test: Renders correct icons/styles for each step state based on current pipelineStep
- [ ] 3.1.2: Build agent log view for real-time activity display
  - Files: Views/Detail/AgentLogView.swift
  - Implement: ScrollView with VStack of log entries. Each entry: HStack with type icon (status = info, search = magnifyingglass, fetch = arrow.down, text = text.bubble, write = pencil, complete = checkmark, error = exclamationmark.triangle) + content text (caption size) + relative time. Auto-scrolls to bottom on new entries.
  - Test: Renders log entries with correct icons

### 3.2 Processing State

- [ ] 3.2.1: Add processing state branch to ListingDetailView
  - Files: Views/Detail/ListingDetailView.swift
  - Implement: When `listing.status == .processing`, show: photo preview (first image, 4:3 aspect ratio), PipelineStepsView, AgentLogView (if agentLog not empty), helper text "This usually takes 30-90 seconds". Switch to ready layout when status becomes .ready.
  - Ref: `docs/screens.md` § Screen 6: Listing Detail — Processing
  - Test: Processing status shows pipeline view, ready status shows full detail
- [ ] 3.2.2: Implement polling in ListingDetailViewModel
  - Files: ViewModels/ListingDetailViewModel.swift
  - Implement: When listing status is `.processing`, start Timer/Task that calls `loadListing()` every 4 seconds. Cancel polling when status is no longer `.processing` or view disappears. Use `Task` with `try await Task.sleep` in a while loop, checking for cancellation.
  - Test: Polling triggers repeated fetches, stops when status changes to READY
- [ ] 3.2.3: Add auto-transition from processing to ready view
  - Files: ViewModels/ListingDetailViewModel.swift
  - Implement: When polled listing shows `pipelineStep == .complete` and `status == .ready`, stop polling and update view to ready state (already handled by SwiftUI reactivity)
  - Test: View transitions from processing to ready when API returns READY status

### 3.3 Error State

- [ ] 3.3.1: Build error state card in ListingDetailView
  - Files: Views/Detail/ListingDetailView.swift
  - Implement: When `listing.pipelineStep == .error`, show card with destructive border, `exclamationmark.circle.fill` icon (red), "Generation failed" title, `pipelineError` message, two buttons: "Retry" (primary) and "Delete" (ghost/destructive).
  - Ref: `docs/screens.md` § Screen 9: Error Recovery
  - Test: Error card renders with error message and both buttons
- [ ] 3.3.2: Implement retry action
  - Files: ViewModels/ListingDetailViewModel.swift
  - Implement: `func retryGeneration()` — PATCH `/api/listings/:id` with `{ pipelineStep: "PENDING", pipelineError: null, status: "PROCESSING", retry: true }`. Resume polling after retry.
  - Test: Retry resets pipeline state and restarts polling
- [ ] 3.3.3: Write tests for pipeline views and polling logic
  - Files: ListwellTests/Views/PipelineStepsViewTests.swift, ListwellTests/ViewModels/ListingDetailViewModelPollingTests.swift
  - Test: Tests pass with ≥80% coverage

**Phase 3 Checkpoint:**

- [ ] Processing state shows live pipeline step indicators
- [ ] Polling fetches updated listing every 4 seconds during processing
- [ ] View auto-transitions from processing to ready when pipeline completes
- [ ] Agent log entries display in scrollable view
- [ ] Error state shows with error message, retry button, and delete button
- [ ] Retry resets pipeline and restarts polling
- [ ] All tests pass with ≥80% code coverage on Phase 3 code
- [ ] Commit: "feat(ios): complete pipeline & real-time updates (Phase 3)"

---

## Phase 4: Image Enhancement

### 4.1 Enhancement Service

- [ ] 4.1.1: Add enhancement methods to ListingsService
  - Files: Services/ListingsService.swift
  - Implement: `func enhanceImage(listingId:imageId:token:) async throws` — POST `/api/listings/:id/enhance`, `func deleteImage(listingId:imageId:token:) async throws` — DELETE `/api/listings/:id/images?imageId=X`
  - Test: Enhance returns success, delete returns success

### 4.2 Enhancement UI

- [ ] 4.2.1: Create `EnhancementViewModel` observable for enhancement sheet state
  - Files: ViewModels/EnhancementViewModel.swift
  - Implement: `@Observable @MainActor final class EnhancementViewModel` — properties: `originalImage: ListingImage`, `enhancedVariants: [ListingImage]`, `isEnhancing`, `errorMessage`. Methods: `func requestEnhancement(listingId:token:)`, `func deleteVariant(_:listingId:token:)`, `func pollForNewVariant(listingId:token:)`
  - Polling: After requesting enhancement, poll GET /listings/:id every 3s until a new enhanced image appears for this original
  - Test: Enhancement request triggers API call, polling detects new variant
- [ ] 4.2.2: Build `EnhancementSheet` view with original image and variants grid
  - Files: Views/Enhancement/EnhancementSheet.swift
  - Implement: Presented as `.sheet`. Header: "Enhance Photo" + "AI will clean up lighting and background". Original image with "Original" label overlay (top-left, dark semi-transparent pill). Enhanced variants section: "Enhanced versions" label + 2-column LazyVGrid of variant thumbnails. Each variant has trash button overlay (top-right). "Generate Enhanced Version" button with `wand.and.stars` icon. Loading state: `ProgressView` + "Enhancing..." while processing. "Done" button at bottom.
  - Ref: `docs/screens.md` § Screen 8: Image Enhancement
  - Test: Sheet renders original, shows variants grid, enhance button triggers request
- [ ] 4.2.3: Add "Enhance" button overlay to original images in ImageCarouselView
  - Files: Views/Detail/ImageCarouselView.swift
  - Implement: On images where `type == .original`, overlay a "Enhance" button (secondary style, small, `wand.and.stars` icon) at bottom-right with padding. Tap opens `EnhancementSheet` as `.sheet`, passing the original image.
  - Ref: `docs/screens.md` § Screen 7: Enhance button on carousel
  - Test: Enhance button visible only on ORIGINAL images, tapping opens sheet
- [ ] 4.2.4: Implement variant deletion with confirmation
  - Files: Views/Enhancement/EnhancementSheet.swift
  - Implement: Trash button on variant calls `viewModel.deleteVariant()`. Show brief undo-style alert/toast. On confirm, delete via API and remove from local array.
  - Test: Delete removes variant from UI and calls API
- [ ] 4.2.5: Write tests for EnhancementSheet, EnhancementViewModel
  - Files: ListwellTests/Views/EnhancementSheetTests.swift, ListwellTests/ViewModels/EnhancementViewModelTests.swift
  - Test: Tests pass with ≥80% coverage

**Phase 4 Checkpoint:**

- [ ] "Enhance" button appears on original images in carousel
- [ ] Enhancement sheet opens showing original image
- [ ] "Generate Enhanced Version" triggers API and shows loading
- [ ] Enhanced variants appear in grid after processing
- [ ] Variants can be deleted with confirmation
- [ ] Multiple variants can be generated per original
- [ ] Original images are never modified
- [ ] All tests pass with ≥80% code coverage on Phase 4 code
- [ ] Commit: "feat(ios): complete image enhancement (Phase 4)"

---

## Phase 5: Voice Input & Push Notifications

### 5.1 Voice Input (iOS-side)

- [ ] 5.1.1: Build `SpeechRecognizer` service with SFSpeechRecognizer
  - Files: Services/SpeechRecognizer.swift
  - Implement: `@Observable @MainActor final class SpeechRecognizer` — properties: `transcript`, `isRecording`, `errorMessage`. Methods: `func requestPermissions() async -> Bool` (speech + microphone), `func startRecording() throws` (install audio tap, create recognition task with partial results), `func stopRecording()` (stop audio engine, cancel task)
  - Use `SFSpeechAudioBufferRecognitionRequest` with `shouldReportPartialResults = true`
  - Test: SpeechRecognizer initializes, permission methods callable
- [ ] 5.1.2: Add Info.plist entries for speech and microphone permissions
  - Files: Info.plist
  - Keys: `NSSpeechRecognitionUsageDescription` = "Listwell uses speech recognition to describe your items by voice", `NSMicrophoneUsageDescription` = "Listwell needs microphone access for voice descriptions"
  - Test: Permission prompts show correct description text
- [ ] 5.1.3: Add mic button and recording indicator to DescribeView
  - Files: Views/NewListing/DescribeView.swift
  - Implement: Mic button inside or adjacent to TextEditor (bottom-right overlay). When recording: pulsing red dot indicator + "Listening..." text below TextEditor. Tap toggles `speechRecognizer.startRecording()` / `stopRecording()`. Transcribed text appends to description TextEditor in real-time.
  - Ref: `docs/screens.md` § Screen 4: Mic Button, Recording Indicator
  - Test: Mic button toggles recording state, UI shows recording indicator
- [ ] 5.1.4: Write tests for SpeechRecognizer and voice input integration
  - Files: ListwellTests/Services/SpeechRecognizerTests.swift
  - Test: Tests pass with ≥80% coverage on SpeechRecognizer

### 5.2 Push Notifications (iOS-side)

- [ ] 5.2.1: Add Push Notifications capability and entitlement to Xcode project
  - Files: Listwell.entitlements, Xcode project settings
  - Enable: Push Notifications capability, Background Modes → Remote notifications
  - Test: Entitlement file exists with aps-environment key
- [ ] 5.2.2: Build `PushNotificationManager` for APNs registration and handling
  - Files: Services/PushNotificationManager.swift
  - Implement: `func requestPermission() async -> Bool` (requestAuthorization for alert, badge, sound), `func registerForRemoteNotifications()` (calls `UIApplication.shared.registerForRemoteNotifications()`), store device token on successful registration
  - Test: Permission request method callable
- [ ] 5.2.3: Create `AppDelegate` for push notification delegate methods
  - Files: ListwellApp.swift (add @UIApplicationDelegateAdaptor)
  - Implement: `didRegisterForRemoteNotificationsWithDeviceToken` — convert token to hex string, send to API via POST /push/subscribe with `{ type: "apns", deviceToken }`. `didFailToRegisterForRemoteNotificationsWithError` — log error. `userNotificationCenter(_:willPresent:)` — show banner in foreground. `userNotificationCenter(_:didReceive:)` — extract listingId from payload, post notification to navigate to detail.
  - Test: Token conversion produces correct hex string
- [ ] 5.2.4: Add deep linking from push notification tap to listing detail
  - Files: Views/Feed/FeedView.swift or ContentView.swift
  - Implement: Listen for `NotificationCenter` post from AppDelegate. When received, push `ListingDetailView(listingId:)` onto NavigationPath.
  - Test: Notification with listingId triggers navigation
- [ ] 5.2.5: Add push permission prompt after first listing submission
  - Files: Views/NewListing/DescribeView.swift or Views/Detail/ListingDetailView.swift
  - Implement: After first successful listing submission (check UserDefaults flag), show `.alert` asking to enable notifications. If accepted, call `PushNotificationManager.requestPermission()` and register.
  - Test: Prompt shows on first submission, not on subsequent ones

### 5.3 API Changes for APNs (Server-side)

- [ ] 5.3.1: Update push_subscriptions schema to support APNs tokens
  - Files: packages/db/src/schema.ts
  - Add: `type` column (text, default "web"), `deviceToken` column (text, nullable)
  - Run: `pnpm --filter @listwell/db exec drizzle-kit generate` and `drizzle-kit push`
  - Test: Migration succeeds, new columns exist
- [ ] 5.3.2: Update push subscribe/unsubscribe routes to accept APNs device tokens
  - Files: apps/api/src/routes/push.ts
  - POST /push/subscribe: Accept either `{ endpoint, p256dh, auth }` (web) or `{ type: "apns", deviceToken }` (iOS). Store with appropriate type.
  - DELETE /push/subscribe: Accept either `{ endpoint }` (web) or `{ deviceToken }` (iOS). Delete matching subscription.
  - Test: Both web push and APNs subscriptions can be created/deleted
- [ ] 5.3.3: Install `apn` package and add APNs notification sending
  - Files: apps/api/src/lib/notifications.ts, apps/api/package.json
  - Install: `apn` or `@parse/node-apn` package
  - Implement: `sendAPNsNotification(deviceToken, payload)` alongside existing `sendPushNotification`. In the notify function, query push_subscriptions for userId, send to both web push and APNs subscribers.
  - Configure: APNs auth key (`.p8` file path, key ID, team ID) from env vars
  - Add env vars: `APNS_KEY_PATH`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`
  - Test: APNs notification helper sends without error (mock)
- [ ] 5.3.4: Write tests for updated push routes and APNs integration
  - Files: apps/api/src/routes/__tests__/push.test.ts, apps/api/src/lib/__tests__/notifications.test.ts
  - Test: Tests pass with ≥80% coverage on modified files

**Phase 5 Checkpoint:**

- [ ] Voice input works: tap mic → speak → transcript appears in real-time
- [ ] Speech recognition permissions requested with proper descriptions
- [ ] APNs device token registered with API after permission granted
- [ ] Push notification received when listing generation completes
- [ ] Tapping notification navigates to listing detail screen
- [ ] Push permission prompt appears after first listing submission
- [ ] API supports both web push and APNs subscriptions
- [ ] All tests pass with ≥80% code coverage on Phase 5 code
- [ ] Commit: "feat(ios): complete voice input and push notifications (Phase 5)"

---

## Phase 6: Polish & Testing

### 6.1 Inline Editing

- [ ] 6.1.1: Add inline editing for listing title on detail screen
  - Files: Views/Detail/ListingDetailView.swift
  - Implement: Tap title text → switch to TextField with save/cancel. Save calls PATCH /listings/:id with new title. Cancel reverts to original.
  - Test: Tap activates edit mode, save persists change
- [ ] 6.1.2: Add inline editing for listing description on detail screen
  - Files: Views/Detail/ListingDetailView.swift
  - Implement: Tap description → switch to TextEditor with save/cancel. Save calls PATCH.
  - Test: Edit mode works, save persists
- [ ] 6.1.3: Add inline editing for suggested price on detail screen
  - Files: Views/Detail/ListingDetailView.swift
  - Implement: Tap price → switch to TextField with numeric keyboard (.decimalPad). Save calls PATCH with suggestedPrice.
  - Test: Price edit accepts numeric input, save persists

### 6.2 UX Polish

- [ ] 6.2.1: Add haptic feedback to key actions throughout the app
  - Files: Various views
  - Implement: `.sensoryFeedback(.success, trigger:)` on: copy actions, listing submission, status changes, enhancement complete. `.sensoryFeedback(.warning, trigger:)` on: delete confirmation. `.sensoryFeedback(.selection, trigger:)` on: tab switches, photo selection.
  - Test: Haptic triggers fire on correct actions
- [ ] 6.2.2: Add smooth transitions and animations
  - Files: Various views
  - Implement: `.animation(.easeOut(duration: 0.2))` on list changes, `.transition(.opacity)` on state changes (processing → ready), sheet presentation with medium detent for enhancement, scale animation on FAB press (`.scaleEffect(isPressed ? 0.95 : 1.0)`)
  - Ref: `docs/design-system.md` § Motion & Transitions
  - Test: Transitions animate smoothly in simulator
- [ ] 6.2.3: Add skeleton loading views for feed and detail screens
  - Files: Views/Feed/FeedView.swift, Views/Detail/ListingDetailView.swift
  - Implement: While `isLoading`, show placeholder rectangles with `.redacted(reason: .placeholder)` modifier. Feed: 3-4 card skeletons. Detail: image placeholder + text block placeholders.
  - Test: Skeletons show during loading, content replaces them
- [ ] 6.2.4: Optimize image loading with Kingfisher configuration
  - Files: ListwellApp.swift or dedicated config
  - Implement: Configure Kingfisher cache limits (memory: 100MB, disk: 500MB), set default placeholder images, add fade-in transition on image load, configure downsampling for thumbnails (80x80 in feed cards)
  - Test: Images load with placeholder, cache works across app restart
- [ ] 6.2.5: Add app icon and launch screen
  - Files: Resources/Assets.xcassets/AppIcon.appiconset/, LaunchScreen.storyboard or Info.plist
  - Implement: App icon (1024x1024 source), launch screen with app name centered on accent color background
  - Test: Icon shows on home screen, launch screen displays on cold start

### 6.3 Comprehensive Testing

- [ ] 6.3.1: Write comprehensive unit tests for all services
  - Files: ListwellTests/Services/*.swift
  - Cover: APIClient (all request variants, error handling, token injection), AuthService (sign-in, sign-up, sign-out, session check), ListingsService (all CRUD operations), ImageUploadService (presign, upload, compress), KeychainManager (save, retrieve, delete, overwrite)
  - Test: ≥80% coverage on all service files
- [ ] 6.3.2: Write comprehensive unit tests for all view models
  - Files: ListwellTests/ViewModels/*.swift
  - Cover: AuthViewModel (login, register, logout, session restore), FeedViewModel (load, refresh, error handling), NewListingViewModel (add/remove images, submit flow), ListingDetailViewModel (load, poll, retry, update status, delete, copy), EnhancementViewModel (enhance, poll, delete variant)
  - Test: ≥80% coverage on all view model files
- [ ] 6.3.3: Write unit tests for models and utilities
  - Files: ListwellTests/Models/*.swift, ListwellTests/Utilities/*.swift
  - Cover: All Codable models with sample JSON (including edge cases: null fields, empty arrays, unknown enum values), ListingFormatter (various listing states), TimeAgo (various date offsets)
  - Test: ≥80% coverage
- [ ] 6.3.4: Write UI tests for critical user flows
  - Files: ListwellUITests/
  - Cover: Login flow (enter credentials → submit → feed appears), Create listing flow (tap FAB → add photo → describe → submit), Copy listing (tap listing → tap copy → pasteboard updated), Logout (menu → log out → login screen)
  - Test: All UI test cases pass in simulator

**Phase 6 Checkpoint:**

- [ ] Inline editing works for title, description, and price
- [ ] Haptic feedback fires on copy, submit, status change, and delete
- [ ] Animations are smooth (FAB press, state transitions, sheet presentation)
- [ ] Skeleton loading shows during data fetches
- [ ] Images load efficiently with caching (Kingfisher configured)
- [ ] App icon and launch screen are configured
- [ ] Unit test coverage ≥80% on all services, view models, and models
- [ ] UI tests pass for login, create listing, copy listing, logout flows
- [ ] No compiler warnings
- [ ] Commit: "feat(ios): complete polish and testing (Phase 6)"

---

## Task Log

| Task  | Completed | Commit | Notes |
| ----- | --------- | ------ | ----- |
| 0.0.1 |           |        |       |
| 0.0.2 |           |        |       |
| 0.1.1 |           |        |       |
| 0.1.2 |           |        |       |
| 0.1.3 |           |        |       |
| 0.1.4 |           |        |       |
| 0.2.1 |           |        |       |
| 0.2.2 |           |        |       |
| 0.2.3 |           |        |       |
| 0.2.4 |           |        |       |
| 0.3.1 |           |        |       |
| 0.3.2 |           |        |       |
| 0.3.3 |           |        |       |
| 0.3.4 |           |        |       |
| 0.4.1 |           |        |       |
| 0.4.2 |           |        |       |
| 0.5.1 |           |        |       |
| 0.5.2 |           |        |       |
| 0.5.3 |           |        |       |
| 0.5.4 |           |        |       |
| 0.5.5 |           |        |       |
| 0.5.6 |           |        |       |
| 0.5.7 |           |        |       |
| 0.6.1 |           |        |       |
| 0.6.2 |           |        |       |
| 1.1.1 |           |        |       |
| 1.1.2 |           |        |       |
| 1.1.3 |           |        |       |
| 1.1.4 |           |        |       |
| 1.2.1 |           |        |       |
| 1.2.2 |           |        |       |
| 1.2.3 |           |        |       |
| 1.3.1 |           |        |       |
| 1.3.2 |           |        |       |
| 1.3.3 |           |        |       |
| 1.3.4 |           |        |       |
| 2.1.1 |           |        |       |
| 2.1.2 |           |        |       |
| 2.1.3 |           |        |       |
| 2.1.4 |           |        |       |
| 2.1.5 |           |        |       |
| 2.2.1 |           |        |       |
| 2.2.2 |           |        |       |
| 2.2.3 |           |        |       |
| 2.2.4 |           |        |       |
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
| 2.6.1 |           |        |       |
| 2.6.2 |           |        |       |
| 2.6.3 |           |        |       |
| 2.6.4 |           |        |       |
| 2.7.1 |           |        |       |
| 2.7.2 |           |        |       |
| 2.7.3 |           |        |       |
| 2.7.4 |           |        |       |
| 2.7.5 |           |        |       |
| 2.7.6 |           |        |       |
| 2.7.7 |           |        |       |
| 2.7.8 |           |        |       |
| 3.1.1 |           |        |       |
| 3.1.2 |           |        |       |
| 3.2.1 |           |        |       |
| 3.2.2 |           |        |       |
| 3.2.3 |           |        |       |
| 3.3.1 |           |        |       |
| 3.3.2 |           |        |       |
| 3.3.3 |           |        |       |
| 4.1.1 |           |        |       |
| 4.2.1 |           |        |       |
| 4.2.2 |           |        |       |
| 4.2.3 |           |        |       |
| 4.2.4 |           |        |       |
| 4.2.5 |           |        |       |
| 5.1.1 |           |        |       |
| 5.1.2 |           |        |       |
| 5.1.3 |           |        |       |
| 5.1.4 |           |        |       |
| 5.2.1 |           |        |       |
| 5.2.2 |           |        |       |
| 5.2.3 |           |        |       |
| 5.2.4 |           |        |       |
| 5.2.5 |           |        |       |
| 5.3.1 |           |        |       |
| 5.3.2 |           |        |       |
| 5.3.3 |           |        |       |
| 5.3.4 |           |        |       |
| 6.1.1 |           |        |       |
| 6.1.2 |           |        |       |
| 6.1.3 |           |        |       |
| 6.2.1 |           |        |       |
| 6.2.2 |           |        |       |
| 6.2.3 |           |        |       |
| 6.2.4 |           |        |       |
| 6.2.5 |           |        |       |
| 6.3.1 |           |        |       |
| 6.3.2 |           |        |       |
| 6.3.3 |           |        |       |
| 6.3.4 |           |        |       |
