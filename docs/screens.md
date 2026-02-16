# Listwell — Screens Specification

**Version:** 0.1 (MVP)
**UI Framework:** shadcn/ui + Tailwind CSS
**Reference:** Read `design-system.md` for all color tokens, spacing, typography, and component conventions before building any screen.

---

## Global Layout Shell

Every authenticated screen shares this structure:

```
<html> (ThemeProvider via next-themes, class strategy)
└── <body> (font-sans, bg-background, text-foreground, antialiased)
    └── <main> (mx-auto max-w-xl w-full min-h-svh)
        └── [Screen Content]
```

There is **no persistent navigation bar, tab bar, or sidebar.** Navigation is contextual: back arrows on sub-screens, the FAB on the feed. This is a single-purpose tool, not a multi-section app.

**Safe areas:** All screens apply `pb-safe` to account for iOS home indicators. Screens with a fixed bottom bar add additional padding to prevent content from being hidden behind it.

---

## Screen 1: Login / Register

**Route:** `/login`
**Purpose:** Authentication gate. Users see this if not logged in.
**Layout:** Centered vertically on the viewport, single card.

### Structure

```
<div> (min-h-svh flex items-center justify-center px-5)
└── <Card> (w-full max-w-sm)
    ├── <CardHeader>
    │   ├── App name — text-2xl font-bold text-center ("Listwell")
    │   └── Tagline — text-sm text-muted-foreground text-center
    │       ("Turn photos into listings")
    ├── <CardContent>
    │   ├── <Tabs> defaultValue="login"
    │   │   ├── <TabsList> (grid grid-cols-2 w-full)
    │   │   │   ├── <TabsTrigger value="login"> "Log in"
    │   │   │   └── <TabsTrigger value="register"> "Sign up"
    │   │   ├── <TabsContent value="login">
    │   │   │   ├── <Label> + <Input type="email" placeholder="Email">
    │   │   │   ├── <Label> + <Input type="password" placeholder="Password">
    │   │   │   └── <Button variant="default" className="w-full h-11"> "Log in"
    │   │   └── <TabsContent value="register">
    │   │       ├── <Label> + <Input type="email" placeholder="Email">
    │   │       ├── <Label> + <Input type="password" placeholder="Password">
    │   │       ├── <Label> + <Input type="password" placeholder="Confirm password">
    │   │       └── <Button variant="default" className="w-full h-11"> "Create account"
    │   └── Error display: <p className="text-sm text-destructive"> (conditionally rendered)
    └── <CardFooter>
        └── (empty for v1 — no social login, no forgot password)
```

### shadcn Components
`Card`, `CardHeader`, `CardContent`, `CardFooter`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Input`, `Label`, `Button`

### Data
- Form state: email, password, confirmPassword (register only)
- Error messages from BetterAuth
- Loading state on submit button (swap text for `Loader2` icon + "Logging in...")

### Behavior
- On successful auth → redirect to `/` (listings feed)
- On error → show inline error text below the form
- Tab switch clears error state

---

## Screen 2: Listings Feed (Home)

**Route:** `/`
**Purpose:** The home screen. Shows all user listings, sorted newest-first. Primary entry point for creating new listings.

### Structure

```
<div> (px-5 pt-8 pb-24)  ← pb-24 to clear FAB
├── <header> (flex items-center justify-between mb-6)
│   ├── <h1> "Your Listings" — text-2xl font-bold
│   └── <Button variant="ghost" size="icon"> <MoreVertical> (settings/overflow)
│
├── [Filter/Sort Row — optional v1]
│   └── <div> (flex gap-2 mb-4 overflow-x-auto)
│       └── <Badge variant="outline"> chips: "All" | "Ready" | "Processing" | "Listed" | "Sold"
│           Active chip: bg-primary text-primary-foreground
│
├── [Listings List]
│   ├── <div> (space-y-3)
│   │   └── [ListingCard] × N  (see component spec below)
│   │
│   ├── [Empty State — if no listings]
│   │   └── <div> (flex flex-col items-center justify-center py-16 text-center)
│   │       ├── <ImagePlus> icon (size={48}, text-muted-foreground/40)
│   │       ├── <p> "No listings yet" — text-lg font-medium text-muted-foreground
│   │       └── <p> "Tap + to create your first one" — text-sm text-muted-foreground
│   │
│   └── [Processing Skeleton — while polling]
│       └── <Card> with <Skeleton> blocks mimicking card layout
│
└── [FAB — Floating Action Button]
    └── <Button> (fixed bottom-6 right-5 z-50 h-14 w-14 rounded-full shadow-md)
        └── <Plus> icon (size={24})
```

### ListingCard Component

Each card in the feed:

```
<Card> (overflow-hidden)
└── <div> (flex gap-3 p-3)
    ├── [Thumbnail]
    │   └── <div> (h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted)
    │       └── <img> (object-cover w-full h-full) — primary image
    │       └── OR <Skeleton> if processing and no image yet
    │
    └── <div> (flex-1 min-w-0)
        ├── <div> (flex items-start justify-between gap-2)
        │   ├── <p> listing.title — text-base font-medium truncate
        │   │   └── OR "Processing..." in text-muted-foreground italic if PROCESSING
        │   └── <ListingStatusBadge status={listing.status}>
        │
        ├── [Price — only if status is READY or beyond]
        │   └── <p> "$XX" — text-lg font-semibold
        │
        ├── [Pipeline progress — only if status is PROCESSING]
        │   └── <div> (flex items-center gap-1.5 mt-1)
        │       ├── <Loader2> (size={14}, animate-spin, text-amber-600)
        │       └── <span> pipelineStep label — text-xs text-muted-foreground
        │
        └── <p> timeAgo(listing.createdAt) — text-xs text-muted-foreground mt-1
```

### shadcn Components
`Card`, `Badge`, `Button`, `Skeleton`

### Data Displayed
- Per card: thumbnail (primary image blobUrl), title, status, suggestedPrice, pipelineStep (if processing), createdAt
- Feed query: `GET /api/listings` → array of listings, sorted by createdAt desc

### Behavior
- Tap card → navigate to `/listings/[id]`
- Tap FAB → navigate to `/new` (capture screen)
- Poll or use event source for listings with status=PROCESSING to live-update pipeline step
- Pull-to-refresh (optional v1, nice-to-have)
- Overflow menu: "Settings" (future), "Log out"

---

## Screen 3: New Listing — Capture

**Route:** `/new`
**Purpose:** Photo capture/upload. First step of listing creation.

### Structure

```
<div> (min-h-svh flex flex-col)
├── <header> (flex items-center px-5 pt-4 pb-2)
│   ├── <Button variant="ghost" size="icon"> <ArrowLeft> ← back to feed
│   └── <h1> "Add Photos" — text-lg font-semibold ml-2
│
├── <div> (flex-1 px-5 py-4)
│   ├── [Photo Grid]
│   │   └── <div> (grid grid-cols-3 gap-2)
│   │       ├── [Captured Image Slot] × (0-5 filled)
│   │       │   └── <div> (aspect-square rounded-lg overflow-hidden relative)
│   │       │       ├── <img> (object-cover w-full h-full)
│   │       │       └── <Button variant="ghost" size="icon"> (absolute top-1 right-1)
│   │       │           └── <X> icon — remove this photo
│   │       │
│   │       └── [Empty Add Slot] — if < 5 photos
│   │           └── <div> (aspect-square rounded-lg border-2 border-dashed border-border
│   │                      flex items-center justify-center bg-muted/50 cursor-pointer)
│   │               └── <ImagePlus> icon (size={24}, text-muted-foreground)
│   │
│   ├── [Capture Buttons] (flex gap-3 mt-4)
│   │   ├── <Button variant="outline" className="flex-1 h-12">
│   │   │   ├── <Camera> icon
│   │   │   └── "Take Photo"
│   │   │       → triggers <input type="file" accept="image/*" capture="environment"> (hidden)
│   │   └── <Button variant="outline" className="flex-1 h-12">
│   │       ├── <ImagePlus> icon
│   │       └── "Choose from Library"
│   │           → triggers <input type="file" accept="image/*" multiple> (hidden)
│   │
│   └── <p> (text-xs text-muted-foreground mt-3 text-center)
│       "Add 3-5 photos from different angles for best results"
│
└── [Bottom Action Bar]
    └── <div> (fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg
               border-t px-5 py-3 pb-safe)
        └── <Button variant="default" className="w-full h-11"
                    disabled={photos.length === 0}>
            "Next" (or "Next — N photo(s)")
```

### shadcn Components
`Button`, `Card` (not needed — grid is raw divs)

### Data
- Client state: array of captured File objects + local preview URLs
- No server interaction yet — photos are held in memory/state

### Behavior
- "Take Photo" opens native camera (via hidden `<input capture="environment">`)
- "Choose from Library" opens gallery multi-select
- Tapping the empty grid slot also triggers gallery picker
- X button on a thumbnail removes it from the array
- "Next" → navigate to `/new/describe` with photos in state (or URL params / context)
- Min 1 photo to enable "Next", max 5

---

## Screen 4: New Listing — Describe

**Route:** `/new/describe`
**Purpose:** Optional voice/text description. Second step before submission.

### Structure

```
<div> (min-h-svh flex flex-col)
├── <header> (flex items-center px-5 pt-4 pb-2)
│   ├── <Button variant="ghost" size="icon"> <ArrowLeft> ← back to capture
│   └── <h1> "Describe It" — text-lg font-semibold ml-2
│
├── <div> (flex-1 px-5 py-4)
│   ├── [Photo Thumbnail Strip]
│   │   └── <div> (flex gap-2 overflow-x-auto pb-2)
│   │       └── <div> × N (h-16 w-16 rounded-lg overflow-hidden flex-shrink-0)
│   │           └── <img> (object-cover w-full h-full)
│   │
│   ├── [Description Input] (mt-4)
│   │   └── <div> (relative)
│   │       ├── <Textarea>
│   │       │   placeholder="Tell us about this item — brand, condition,
│   │       │               why you're selling... (optional)"
│   │       │   className="min-h-[160px] pr-12 text-base resize-none"
│   │       │   value={description}
│   │       │
│   │       └── [Mic Button] (absolute bottom-3 right-3)
│   │           └── <Button variant="ghost" size="icon"
│   │                       className={recording ? "text-destructive" : "text-muted-foreground"}>
│   │               └── <Mic> icon (or pulsing red state when recording)
│   │
│   ├── [Recording Indicator — only when recording]
│   │   └── <div> (flex items-center gap-2 mt-2)
│   │       ├── <span> (h-2 w-2 rounded-full bg-destructive animate-pulse)
│   │       └── <span> "Listening..." — text-sm text-muted-foreground
│   │
│   └── <p> (text-xs text-muted-foreground mt-3)
│       "More detail = better results. But you can also skip this."
│
└── [Bottom Action Bar]
    └── <div> (fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg
               border-t px-5 py-3 pb-safe flex gap-3)
        ├── <Button variant="secondary" className="flex-1 h-11">
        │   "Skip" → submits with no description
        └── <Button variant="default" className="flex-1 h-11">
            "Generate Listing"
```

### shadcn Components
`Button`, `Textarea`

### Data
- Client state: description text (from typing or voice transcription)
- Voice: POST to `/api/transcribe` with audio blob, returns text

### Behavior
- Mic button toggles recording on/off
- While recording, audio is streamed (Deepgram) or buffered (Whisper)
- Transcribed text appends to the textarea
- "Generate Listing" → uploads photos to Vercel Blob, creates listing via `POST /api/listings`, triggers Inngest event
- "Skip" → same as "Generate Listing" but with empty rawDescription
- After submission → navigate to `/new/submitted`

---

## Screen 5: New Listing — Submitted

**Route:** `/new/submitted`
**Purpose:** Confirmation that the job is queued. Brief interstitial before returning to feed.

### Structure

```
<div> (min-h-svh flex flex-col items-center justify-center px-5 text-center)
├── [Success Animation / Icon]
│   └── <div> (h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6)
│       └── <CheckCircle> icon (size={32}, text-primary)
│
├── <h1> "You're all set" — text-2xl font-bold
├── <p> (text-muted-foreground mt-2 max-w-xs)
│   "We're analyzing your photos and researching prices. This usually takes about a minute."
│
├── <p> (text-sm text-muted-foreground mt-1)
│   "You'll get a notification when it's ready."
│
└── <Button variant="default" className="mt-8 h-11 px-8">
    "Back to Listings" → navigate to "/"
```

### shadcn Components
`Button`

### Data
- None displayed. This is a static confirmation.

### Behavior
- "Back to Listings" → navigate to `/`
- The new listing appears in the feed with status=PROCESSING
- Auto-redirect to feed after 3 seconds (optional)

---

## Screen 6: Listing Detail — Processing

**Route:** `/listings/[id]` (when `status === "PROCESSING"`)
**Purpose:** Shows real-time pipeline progress while the agent works.

### Structure

```
<div> (min-h-svh px-5 pt-4 pb-8)
├── <header> (flex items-center pb-4)
│   ├── <Button variant="ghost" size="icon"> <ArrowLeft> ← back to feed
│   └── <h1> "Generating..." — text-lg font-semibold ml-2
│
├── [Photo Preview]
│   └── <div> (aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-6)
│       └── <img> (object-cover w-full h-full) — first uploaded image
│
├── [Pipeline Steps]
│   └── <Card>
│       └── <CardContent className="py-4">
│           └── <div> (space-y-4)
│               └── [StepRow] × 4
│                   └── <div> (flex items-center gap-3)
│                       ├── [Step Icon]
│                       │   ├── Completed: <CheckCircle> (size={20}, text-emerald-500)
│                       │   ├── Active: <Loader2> (size={20}, text-primary, animate-spin)
│                       │   └── Pending: <Circle> (size={20}, text-muted-foreground/30)
│                       ├── <span> step label — text-sm
│                       │   Active: font-medium text-foreground
│                       │   Completed: text-muted-foreground
│                       │   Pending: text-muted-foreground/50
│                       └── [Duration — if completed]
│                           └── <span> "12s" — text-xs text-muted-foreground
│
│   Steps in order:
│   1. "Analyzing photos"      (ANALYZING)
│   2. "Researching prices"    (RESEARCHING)
│   3. "Writing listing"       (GENERATING)
│   4. "Finishing up"          (COMPLETE)
│
├── [Error State — if pipelineStep === ERROR]
│   └── <Card> (border-destructive)
│       └── <CardContent className="py-4">
│           ├── <div> (flex items-center gap-2)
│           │   ├── <AlertCircle> (text-destructive)
│           │   └── <p> "Something went wrong" — font-medium
│           ├── <p> pipelineError — text-sm text-muted-foreground mt-2
│           └── <Button variant="outline" className="mt-3"> "Retry"
│
└── <p> (text-xs text-muted-foreground text-center mt-6)
    "This usually takes 30-90 seconds"
```

### shadcn Components
`Card`, `CardContent`, `Button`, `Skeleton`

### Data
- Listing: status, pipelineStep, pipelineError, first image blobUrl
- Poll `GET /api/listings/[id]` every 3-5 seconds, or use Server-Sent Events
- When status transitions to READY → auto-navigate to the detail-ready view (or re-render)

---

## Screen 7: Listing Detail — Ready

**Route:** `/listings/[id]` (when `status === "READY" | "LISTED" | "SOLD"`)
**Purpose:** The payoff screen. Displays the complete AI-generated listing with copy functionality.

### Structure

```
<div> (pb-28)  ← padding for bottom action bar
├── <header> (flex items-center justify-between px-5 pt-4 pb-2)
│   ├── <Button variant="ghost" size="icon"> <ArrowLeft>
│   └── <DropdownMenu>
│       ├── <DropdownMenuTrigger>
│       │   └── <Button variant="ghost" size="icon"> <MoreVertical>
│       └── <DropdownMenuContent>
│           ├── <DropdownMenuItem> "Mark as Listed"  (if READY)
│           ├── <DropdownMenuItem> "Mark as Sold"    (if LISTED)
│           ├── <DropdownMenuItem> "Archive"
│           └── <DropdownMenuItem className="text-destructive"> "Delete Listing"
│
├── [Image Carousel]
│   └── <div> (overflow-x-auto scroll-snap-x-mandatory flex)
│       └── <div> × N (scroll-snap-align-center flex-shrink-0 w-full)
│           └── <div> (aspect-[4/3] bg-muted relative)
│               ├── <img> (object-cover w-full h-full)
│               └── [Enhance Button — on ORIGINAL images only]
│                   └── <Button variant="secondary" size="sm"
│                               className="absolute bottom-3 right-3">
│                       ├── <Sparkles> icon (size={14})
│                       └── "Enhance"
│   └── [Dot Indicators]
│       └── <div> (flex justify-center gap-1.5 mt-3)
│           └── <span> × N (h-1.5 w-1.5 rounded-full)
│               Active: bg-primary
│               Inactive: bg-muted-foreground/30
│
├── <div> (px-5 space-y-5 mt-4)
│
│   ├── [Status Badge Row]
│   │   └── <div> (flex items-center gap-2)
│   │       ├── <ListingStatusBadge status={listing.status}>
│   │       └── <span> listing.category — text-xs text-muted-foreground
│
│   ├── [Title Section]
│   │   └── <div> (flex items-start justify-between gap-2)
│   │       ├── <h2> listing.title — text-xl font-bold leading-tight
│   │       └── <CopyButton text={listing.title} label="title">
│
│   ├── [Price Card]
│   │   └── <Card>
│   │       └── <CardContent className="py-4">
│   │           ├── <div> (flex items-baseline justify-between)
│   │           │   ├── <span> "$" + listing.suggestedPrice — text-3xl font-bold
│   │           │   └── <span> "suggested price" — text-xs text-muted-foreground
│   │           └── <div> (flex items-center gap-1 mt-1)
│   │               └── <span> "Market range: $LOW – $HIGH"
│   │                   — text-sm text-muted-foreground
│
│   ├── [Description Section]
│   │   └── <div>
│   │       ├── <div> (flex items-center justify-between mb-2)
│   │       │   ├── <h3> "Description" — text-lg font-semibold
│   │       │   └── <CopyButton text={listing.description} label="description">
│   │       └── <div> (text-sm text-foreground leading-relaxed whitespace-pre-wrap)
│   │           listing.description
│
│   ├── [Product Details]
│   │   └── <Card>
│   │       └── <CardContent className="py-4">
│   │           └── <div> (grid grid-cols-2 gap-y-3 gap-x-4)
│   │               ├── [DetailRow label="Brand" value={listing.brand}]
│   │               ├── [DetailRow label="Model" value={listing.model}]
│   │               ├── [DetailRow label="Condition" value={listing.condition}]
│   │               └── [DetailRow label="Category" value={listing.category}]
│   │
│   │   DetailRow:
│   │   ├── <span> label — text-xs text-muted-foreground uppercase tracking-wide
│   │   └── <span> value — text-sm font-medium
│
│   ├── [Comparable Listings]
│   │   └── <div>
│   │       ├── <h3> "Market Comparables" — text-lg font-semibold mb-3
│   │       └── <div> (space-y-2)
│   │           └── [ComparableCard] × N
│   │               └── <Card>
│   │                   └── <CardContent className="py-3 px-4">
│   │                       └── <div> (flex items-center justify-between)
│   │                           ├── <div>
│   │                           │   ├── <p> comp.title — text-sm font-medium truncate
│   │                           │   └── <p> comp.source — text-xs text-muted-foreground
│   │                           ├── <p> "$" + comp.price — text-sm font-semibold
│   │                           └── <a href={comp.link} target="_blank">
│   │                               └── <ExternalLink> (size={14}, text-muted-foreground)
│
│   └── [Market Notes]
│       └── <div>
│           ├── <h3> "Market Notes" — text-lg font-semibold mb-2
│           └── <p> listing.researchNotes
│               — text-sm text-muted-foreground leading-relaxed
│
└── [Bottom Action Bar]
    └── <div> (fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg
               border-t px-5 py-3 pb-safe)
        └── <Button variant="default" className="w-full h-11">
            ├── <Copy> icon (size={16})
            └── "Copy Full Listing"
            → copies title + price + description formatted for marketplace paste
```

### CopyButton Component

Small inline copy trigger used next to title and description:

```
<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
  └── <Copy> (size={14})   → on click, switches to <Check> for 2 seconds
```

Uses `navigator.clipboard.writeText()`. Shows a `<Sonner>` toast: "Copied!"

### shadcn Components
`Card`, `CardContent`, `Button`, `Badge`, `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `Sonner` (toast)

### Data
- Full listing object from `GET /api/listings/[id]`
- Images array (sorted by sortOrder, with type ORIGINAL / ENHANCED)
- Comparables array from listing.comparables JSON

### Behavior
- Carousel: horizontal scroll-snap, swipe between images
- "Enhance" button on each original image → opens enhancement sheet (Screen 8)
- "Copy Full Listing" → formats and copies: `{title}\n${price}\n\n{description}`
- Dropdown menu actions → PATCH listing status
- "Delete Listing" → confirmation dialog → DELETE listing → navigate to feed

---

## Screen 8: Image Enhancement

**Route:** Rendered as a `<Sheet>` (bottom drawer) over the listing detail screen, not a separate route.
**Purpose:** AI image enhancement with before/after comparison.

### Structure

```
<Sheet>
├── <SheetHeader>
│   ├── <SheetTitle> "Enhance Photo"
│   └── <SheetDescription> "AI will clean up lighting and background"
│
├── <SheetContent className="h-[85svh]" side="bottom">
│   ├── [Original Image]
│   │   └── <div> (aspect-[4/3] rounded-lg overflow-hidden bg-muted)
│   │       ├── <img> original image
│   │       └── <span> "Original" — absolute top-2 left-2
│   │           text-xs bg-black/50 text-white px-2 py-0.5 rounded
│   │
│   ├── [Enhanced Variants — if any exist]
│   │   └── <div> (mt-4)
│   │       ├── <p> "Enhanced versions" — text-sm font-medium mb-2
│   │       └── <div> (grid grid-cols-2 gap-2)
│   │           └── [VariantCard] × N
│   │               └── <div> (aspect-[4/3] rounded-lg overflow-hidden relative
│   │                          ring-2 ring-transparent hover:ring-primary/30)
│   │                   ├── <img> enhanced variant
│   │                   └── <Button variant="ghost" size="icon"
│   │                               className="absolute top-1 right-1 h-7 w-7
│   │                                          bg-black/40 text-white">
│   │                       └── <Trash2> (size={14}) — delete this variant
│   │
│   ├── [Enhance Action]
│   │   └── <Button variant="outline" className="w-full h-11 mt-4">
│   │       ├── <Sparkles> icon
│   │       └── "Generate Enhanced Version"
│   │       → triggers POST /api/listings/[id]/enhance
│   │
│   ├── [Enhancement In Progress — when running]
│   │   └── <div> (flex items-center justify-center gap-2 py-8)
│   │       ├── <Loader2> (animate-spin, text-primary)
│   │       └── <span> "Enhancing..." — text-sm text-muted-foreground
│   │
│   └── <SheetFooter>
│       └── <Button variant="secondary" className="w-full"> "Done"
```

### shadcn Components
`Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `Button`

### Data
- Original image: blobUrl, id
- Enhanced variants: array of ListingImage records where parentImageId === original image id
- Enhancement status: idle / processing / done / error

### Behavior
- "Generate Enhanced Version" → POST `/api/listings/[id]/enhance` with imageId
- Poll or wait for Inngest completion, then fetch and display new variant
- Delete variant → DELETE `/api/listings/[id]/images` with variant imageId
- User can generate multiple variants (no hard limit, but UI shows max ~4 in grid)
- "Done" closes the sheet, returns to listing detail
- Original image is never modified or deletable from this screen

---

## Screen 9: Listing Detail — Error Recovery

Not a separate screen — it's the error state within Screen 6 (Processing). When `pipelineStep === "ERROR"`, the pipeline steps card shows the failure point and a retry button.

### Error Card Structure
```
<Card className="border-destructive/50">
└── <CardContent className="py-4">
    ├── <div> (flex items-start gap-3)
    │   ├── <AlertCircle> (size={20}, text-destructive, flex-shrink-0, mt-0.5)
    │   └── <div>
    │       ├── <p> "Generation failed" — text-sm font-medium
    │       └── <p> listing.pipelineError — text-sm text-muted-foreground mt-1
    └── <div> (flex gap-2 mt-4)
        ├── <Button variant="default" size="sm"> "Retry"
        │   → PATCH listing to reset pipeline, re-trigger Inngest
        └── <Button variant="ghost" size="sm"> "Delete"
            → DELETE listing, navigate to feed
```

---

## Shared Components Reference

### ListingStatusBadge

Maps listing.status to the correct badge colors from the design system:

```tsx
// Props: { status: ListingStatus }
// Returns: <Badge> with status-specific colors

DRAFT       → variant="secondary", gray colors
PROCESSING  → variant="secondary", amber colors + Loader2 icon
READY       → variant="secondary", emerald colors
LISTED      → variant="secondary", blue colors
SOLD        → variant="secondary", purple colors
ARCHIVED    → variant="secondary", gray colors, muted
ERROR       → variant="secondary", red colors + AlertCircle icon
```

### CopyButton

Reusable copy-to-clipboard button with feedback:

```tsx
// Props: { text: string, label?: string }
// On click: copies text, swaps icon to Check for 2s, shows toast

<Button variant="ghost" size="icon" className="h-8 w-8">
  {copied ? <Check size={14} /> : <Copy size={14} />}
</Button>
```

### BottomBar

Fixed bottom action container:

```tsx
// Props: { children: ReactNode }
<div className="fixed bottom-0 left-0 right-0 z-40
                bg-background/80 backdrop-blur-lg border-t border-border
                px-5 py-3 pb-safe">
  {children}
</div>
```

### EmptyState

Centered placeholder for empty screens:

```tsx
// Props: { icon: LucideIcon, title: string, description: string }
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon size={48} className="text-muted-foreground/40 mb-4" />
  <p className="text-lg font-medium text-muted-foreground">{title}</p>
  <p className="text-sm text-muted-foreground mt-1">{description}</p>
</div>
```

---

## Confirmation Dialogs

### Delete Listing

Triggered from the listing detail dropdown menu.

```
<AlertDialog>
├── <AlertDialogContent>
│   ├── <AlertDialogHeader>
│   │   ├── <AlertDialogTitle> "Delete this listing?"
│   │   └── <AlertDialogDescription>
│   │       "This will permanently delete the listing and all its images."
│   └── <AlertDialogFooter>
│       ├── <AlertDialogCancel> "Cancel"
│       └── <AlertDialogAction className="bg-destructive"> "Delete"
```

### Delete Enhanced Image

Triggered from the enhancement sheet.

```
No dialog — direct action with undo via toast:
<Sonner> "Image deleted" + "Undo" button (5s window)
```

---

## Toast Messages

All toasts use `<Sonner>` positioned at top-center.

| Trigger                        | Message                    | Type    | Duration |
|-------------------------------|----------------------------|---------|----------|
| Copy title                    | "Title copied"             | success | 2s       |
| Copy description              | "Description copied"       | success | 2s       |
| Copy full listing             | "Listing copied to clipboard" | success | 2s    |
| Listing submitted             | "Generating your listing..." | info  | 3s       |
| Listing ready (if on feed)    | "Your listing is ready!"   | success | 4s       |
| Enhancement complete          | "Enhanced photo ready"     | success | 3s       |
| Enhancement failed            | "Enhancement failed — try again" | error | 5s  |
| Pipeline error                | "Something went wrong"     | error   | 5s       |
| Delete enhanced image         | "Image deleted" + Undo     | info    | 5s       |
| Listing deleted               | "Listing deleted"          | success | 3s       |
| Status changed                | "Marked as [status]"       | success | 2s       |

---

## Navigation Map

```
/login ──────────────────────────────── (unauthenticated)
   │
   ▼
/ (Feed) ◄──────────────────────────── (authenticated, home)
   │
   ├── tap card ──► /listings/[id]
   │                  ├── PROCESSING → pipeline progress view
   │                  ├── READY/LISTED/SOLD → full listing detail
   │                  │     └── Enhance button → Sheet overlay
   │                  └── back arrow → /
   │
   ├── tap FAB ───► /new (Capture)
   │                  └── Next → /new/describe (Describe)
   │                              ├── Generate → /new/submitted → /
   │                              └── Skip → /new/submitted → /
   │
   └── overflow → settings (future)
```