# Listwell — Design System

**Version:** 0.1 (MVP)
**Stack:** Next.js App Router · shadcn/ui · Tailwind CSS

---

## Design Philosophy

Listwell is a tool, not a destination. The UI should feel fast, quiet, and utilitarian — like a well-made camera app. Every screen exists to move the user toward one outcome: a finished listing they can copy and paste. Visual flourishes are stripped in favor of clarity, speed, and thumb-friendliness on mobile.

**Principles:**

1. **Mobile-first, always.** Every layout decision starts at 375px. Desktop is a stretched mobile layout, not a redesign.
2. **Content is the UI.** The user's photos and the generated listing are the visual stars. Chrome stays minimal.
3. **Progress over perfection.** Show momentum (pipeline steps, status badges) so the user knows things are happening.
4. **One action per screen.** Each screen has a single primary action. Secondary actions exist but are visually subordinate.

---

## Color Tokens

Built on shadcn/ui's CSS variable system. All colors are defined as HSL values in `globals.css` and consumed via Tailwind's `bg-primary`, `text-muted-foreground`, etc.

### Base Palette (Light Mode)

```css
:root {
  /* Backgrounds */
  --background: 0 0% 100%;           /* #FFFFFF — page background */
  --foreground: 240 10% 8%;          /* #131316 — primary text */

  --card: 0 0% 100%;                 /* #FFFFFF — card surfaces */
  --card-foreground: 240 10% 8%;

  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 8%;

  /* Brand / Primary — a warm teal-green */
  --primary: 168 60% 38%;            /* #279E89 — primary buttons, key actions */
  --primary-foreground: 0 0% 100%;   /* white text on primary */

  /* Secondary — neutral warm gray for secondary actions */
  --secondary: 240 5% 96%;           /* #F3F3F4 — secondary buttons, subtle fills */
  --secondary-foreground: 240 10% 25%;

  /* Muted — for backgrounds of less-important areas */
  --muted: 240 5% 96%;               /* #F3F3F4 */
  --muted-foreground: 240 5% 46%;    /* #6E6E76 — secondary text, captions */

  /* Accent — used for hover states, highlighted rows */
  --accent: 168 50% 95%;             /* very light teal tint */
  --accent-foreground: 168 60% 28%;

  /* Destructive */
  --destructive: 0 72% 51%;          /* #D93636 — delete actions, errors */
  --destructive-foreground: 0 0% 100%;

  /* Borders & Inputs */
  --border: 240 6% 90%;              /* #E4E4E7 */
  --input: 240 6% 90%;
  --ring: 168 60% 38%;               /* focus ring matches primary */

  --radius: 0.625rem;                /* 10px — default border radius */
}
```

### Base Palette (Dark Mode)

```css
.dark {
  --background: 240 10% 6%;          /* #0E0E11 */
  --foreground: 0 0% 95%;            /* #F2F2F2 */

  --card: 240 8% 10%;                /* #161619 */
  --card-foreground: 0 0% 95%;

  --popover: 240 8% 10%;
  --popover-foreground: 0 0% 95%;

  --primary: 168 55% 45%;            /* slightly lighter teal for dark bg */
  --primary-foreground: 0 0% 100%;

  --secondary: 240 6% 16%;
  --secondary-foreground: 0 0% 85%;

  --muted: 240 6% 16%;
  --muted-foreground: 240 5% 55%;

  --accent: 168 40% 14%;
  --accent-foreground: 168 55% 65%;

  --destructive: 0 62% 55%;
  --destructive-foreground: 0 0% 100%;

  --border: 240 6% 18%;
  --input: 240 6% 18%;
  --ring: 168 55% 45%;
}
```

### Status Colors

These are used for listing status badges and pipeline step indicators. Defined as standalone Tailwind classes, not CSS variables.

| Status        | Light BG          | Light Text         | Dark BG           | Dark Text          | Usage                              |
|---------------|-------------------|--------------------|-------------------|--------------------|-------------------------------------|
| Processing    | `bg-amber-100`    | `text-amber-700`   | `bg-amber-900/30` | `text-amber-400`   | Listing is in the AI pipeline       |
| Ready         | `bg-emerald-100`  | `text-emerald-700` | `bg-emerald-900/30`| `text-emerald-400` | Listing generation complete         |
| Listed        | `bg-blue-100`     | `text-blue-700`    | `bg-blue-900/30`  | `text-blue-400`    | User marked as posted to marketplace|
| Sold          | `bg-purple-100`   | `text-purple-700`  | `bg-purple-900/30`| `text-purple-400`  | Sale completed                      |
| Archived      | `bg-gray-100`     | `text-gray-500`    | `bg-gray-800/30`  | `text-gray-500`    | Retired / withdrawn                 |
| Error         | `bg-red-100`      | `text-red-700`     | `bg-red-900/30`   | `text-red-400`     | Pipeline failure                    |
| Draft         | `bg-gray-100`     | `text-gray-600`    | `bg-gray-800/30`  | `text-gray-400`    | Created but not yet submitted       |

### Pipeline Step Indicators

Used in the processing state to show which step the agent is on.

| Step         | Icon (Lucide)     | Label           |
|--------------|-------------------|-----------------|
| PENDING      | `Clock`           | "Queued"        |
| ANALYZING    | `Eye`             | "Analyzing photos" |
| RESEARCHING  | `Search`          | "Researching prices" |
| GENERATING   | `PenLine`         | "Writing listing" |
| COMPLETE     | `CheckCircle`     | "Done"          |
| ERROR        | `AlertCircle`     | "Failed"        |

---

## Typography

Uses the system font stack via Tailwind's `font-sans`. No custom web fonts — keeps load time zero and matches platform conventions.

```css
--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
  "Liberation Mono", monospace;
```

### Type Scale

| Token                  | Tailwind Class     | Size   | Weight   | Line Height | Usage                                      |
|------------------------|--------------------|--------|----------|-------------|---------------------------------------------|
| Page Title             | `text-2xl`         | 24px   | `font-bold` (700) | 32px | Screen titles ("Your Listings")            |
| Section Heading        | `text-lg`          | 18px   | `font-semibold` (600) | 28px | Card section headers ("Price", "Description") |
| Card Title             | `text-base`        | 16px   | `font-medium` (500) | 24px | Listing card titles in the feed            |
| Body                   | `text-sm`          | 14px   | `font-normal` (400) | 20px | Descriptions, form labels, general content |
| Caption / Meta         | `text-xs`          | 12px   | `font-normal` (400) | 16px | Timestamps, badge text, helper text        |
| Price (large)          | `text-3xl`         | 30px   | `font-bold` (700) | 36px | Suggested price on detail screen           |
| Price (card)           | `text-lg`          | 18px   | `font-semibold` (600) | 28px | Price on feed cards                        |
| Mono / Code            | `text-xs font-mono`| 12px   | `font-normal` (400) | 16px | Pipeline step labels, debug info           |

### Text Color Assignments

| Role                | Class                        |
|---------------------|------------------------------|
| Primary text        | `text-foreground`            |
| Secondary text      | `text-muted-foreground`      |
| Disabled text       | `text-muted-foreground/50`   |
| Link text           | `text-primary`               |
| Error text          | `text-destructive`           |
| On-primary text     | `text-primary-foreground`    |

---

## Spacing

Use Tailwind's default spacing scale. These are the most commonly used values across the app.

| Token    | Value | Tailwind | Usage                                              |
|----------|-------|----------|----------------------------------------------------|
| `space-1`| 4px   | `p-1`   | Inner padding of badges, tight gaps                 |
| `space-2`| 8px   | `p-2`   | Icon padding, small gaps between inline elements    |
| `space-3`| 12px  | `p-3`   | Card inner padding (compact), gap in thumbnail grids|
| `space-4`| 16px  | `p-4`   | Standard card padding, section gaps                 |
| `space-5`| 20px  | `p-5`   | Page horizontal padding (mobile)                    |
| `space-6`| 24px  | `p-6`   | Generous card padding, vertical section spacing     |
| `space-8`| 32px  | `p-8`   | Major section breaks, top/bottom page padding       |

**Safe area insets:** All pages apply `pb-safe` (env(safe-area-inset-bottom)) for bottom navigation and notched devices. The page container uses `px-5` horizontal padding on mobile.

---

## Border Radius

| Token         | Value | Tailwind       | Usage                                     |
|---------------|-------|----------------|-------------------------------------------|
| Default       | 10px  | `rounded-[10px]` or `rounded-lg` | Cards, buttons, inputs       |
| Small         | 6px   | `rounded-md`   | Badges, chips, thumbnails                  |
| Full          | 9999px| `rounded-full` | Avatars, FAB, icon buttons                 |
| Image         | 8px   | `rounded-lg`   | Photo thumbnails, carousel images          |
| None          | 0     | `rounded-none` | Full-bleed images, edge-to-edge sections   |

---

## Shadows & Elevation

Minimal shadows. The app is mostly flat with border separation.

| Token         | Tailwind       | Usage                                         |
|---------------|----------------|-----------------------------------------------|
| Card          | `shadow-sm`    | Feed cards, detail cards                       |
| Elevated      | `shadow-md`    | FAB, bottom action bar, modals                 |
| Popover       | `shadow-lg`    | Dropdown menus, popovers, toasts               |
| None          | `shadow-none`  | Inline elements, flat sections                 |

---

## Iconography

**Library:** Lucide React (included with shadcn/ui)

**Default size:** `size={20}` (20×20px) for inline icons. `size={24}` for standalone/buttons.

**Stroke width:** Default (2px). Do not modify.

### Core Icon Map

| Context                  | Icon              | Notes                              |
|--------------------------|-------------------|------------------------------------|
| New Listing (FAB)        | `Plus`            | Inside rounded-full button         |
| Camera                   | `Camera`          | Capture button                     |
| Gallery / Upload         | `ImagePlus`       | Pick from photo library            |
| Voice / Mic              | `Mic`             | Voice dictation toggle             |
| Mic active (recording)   | `MicOff`          | Or pulsing `Mic` with red dot      |
| Copy                     | `Copy`            | Copy to clipboard                  |
| Copy success             | `Check`           | Briefly replaces `Copy` after tap  |
| Enhance image            | `Sparkles`        | AI image enhancement trigger       |
| Delete                   | `Trash2`          | Delete image or listing            |
| Back / Navigate back     | `ArrowLeft`       | Top-left back button               |
| Settings / More          | `MoreVertical`    | Overflow menu                      |
| External link            | `ExternalLink`    | Open comparable listing source     |
| Price / Dollar            | `DollarSign`     | Price section icon                 |
| Status: Processing       | `Loader2`         | Animated spin                      |
| Status: Ready            | `CheckCircle`     | Green                              |
| Status: Error            | `AlertCircle`     | Red                                |
| Close / Dismiss          | `X`               | Modal close, sheet dismiss         |

---

## Component Tokens & Conventions

### Buttons

| Variant       | shadcn variant   | Usage                                    |
|---------------|------------------|------------------------------------------|
| Primary       | `default`        | "Generate", "Copy Full Listing"          |
| Secondary     | `secondary`      | "Skip", "Cancel", secondary actions      |
| Ghost         | `ghost`          | Icon-only buttons, inline actions        |
| Destructive   | `destructive`    | "Delete Listing", "Delete Image"         |
| Outline       | `outline`        | "Enhance", bordered actions              |

All buttons use `rounded-lg` and `h-11` (44px) on mobile for tap target compliance. Icon-only buttons use `size="icon"` with `h-10 w-10`.

### Floating Action Button (FAB)

The primary "New Listing" trigger on the feed screen.

```
Position: fixed, bottom-6 right-5 (adjusted for safe area)
Size: h-14 w-14 (56px)
Shape: rounded-full
Color: bg-primary text-primary-foreground
Shadow: shadow-md
Icon: Plus (size={24})
z-index: 50
```

### Cards

All cards use the shadcn `<Card>` component.

```
Background: bg-card
Border: border border-border
Radius: rounded-lg (matched to --radius)
Padding: p-4 (standard) or p-3 (compact, e.g., feed cards)
Shadow: shadow-sm
```

### Badges (Status)

Use shadcn `<Badge>` with `variant="secondary"` as the base, then override colors per status using the Status Colors table above.

```
Font: text-xs font-medium
Padding: px-2.5 py-0.5
Radius: rounded-md
```

### Bottom Action Bar

Used on the listing detail screen for "Copy Full Listing" and on the capture screen for "Next".

```
Position: fixed bottom-0 left-0 right-0
Background: bg-background/80 backdrop-blur-lg
Border: border-t border-border
Padding: px-5 py-3 pb-safe
Shadow: shadow-md (upward)
z-index: 40
```

### Toast / Notifications

Use shadcn `<Sonner>` (toast). Positioned at top-center on mobile.

| Type    | Icon            | Duration |
|---------|-----------------|----------|
| Success | `CheckCircle`   | 3s       |
| Error   | `AlertCircle`   | 5s       |
| Info    | `Info`          | 3s       |
| Copied  | `Check`         | 2s       |

---

## Image Display Conventions

### Thumbnail Grid (Capture Screen)

```
Layout: CSS Grid, grid-cols-3, gap-2
Size: Square aspect ratio (aspect-square)
Radius: rounded-lg
Fit: object-cover
Empty slot: dashed border, bg-muted, center icon (ImagePlus)
Max slots: 5
```

### Image Carousel (Detail Screen)

```
Layout: Horizontal scroll snap (scroll-snap-x mandatory)
Size: Full width, aspect-[4/3]
Radius: rounded-none (full-bleed) or rounded-lg with mx-5 margin
Pagination: Dots below, centered, active dot = bg-primary
```

### Enhancement Comparison

```
Layout: Side-by-side on landscape, stacked on portrait
Labels: "Original" / "Enhanced" — text-xs text-muted-foreground
Radius: rounded-lg
Border: Enhanced version gets a subtle ring-2 ring-primary/20 when selected
```

---

## Motion & Transitions

Keep animations minimal and functional. No decorative motion.

| Element                  | Animation                        | Duration | Easing           |
|--------------------------|----------------------------------|----------|------------------|
| Page transitions         | None (instant navigation)        | —        | —                |
| Toast entry              | Slide down from top              | 200ms    | ease-out         |
| Toast exit               | Fade out                         | 150ms    | ease-in          |
| FAB press                | Scale down to 0.95               | 100ms    | ease-in-out      |
| Copy button feedback     | Icon swap (Copy → Check)         | instant  | —                |
| Processing spinner       | `Loader2` with `animate-spin`    | continuous | linear         |
| Image thumbnail add      | Fade in + slight scale up        | 200ms    | ease-out         |
| Sheet / Drawer open      | Slide up from bottom             | 250ms    | ease-out         |
| Skeleton loading         | shadcn `<Skeleton>` pulse        | continuous | ease-in-out    |

---

## Responsive Breakpoints

Mobile-first. Only two real breakpoints matter for this app.

| Breakpoint | Tailwind | Width  | Layout Changes                                  |
|------------|----------|--------|--------------------------------------------------|
| Mobile     | default  | < 640px| Single column, full-width cards, FAB visible     |
| Tablet+    | `sm:`    | ≥ 640px| Max-width container (512px), centered, FAB stays |
| Desktop    | `md:`    | ≥ 768px| Max-width container (576px), slightly more padding|

The app never goes wider than `max-w-xl` (576px) centered. On large screens, it's a centered phone-width column with a subtle background. This is intentional — it's a mobile tool that also works in a browser.

```
Container: mx-auto max-w-xl w-full px-5 sm:px-6
```

---

## Accessibility

- All interactive elements must have minimum 44×44px tap targets
- Color contrast ratios meet WCAA AA (4.5:1 for body text, 3:1 for large text)
- Focus rings use `ring-2 ring-ring ring-offset-2` (shadcn default)
- Images in listings include alt text (AI-generated from image analysis)
- Status badges use text labels, never color alone
- Voice input button has clear recording state (color change + label)
- All icon buttons have `aria-label`

---

## Dark Mode

Supported from day one via `next-themes`. Toggle is in settings (not prominent). The app respects system preference by default.

Implementation: `class` strategy on `<html>`. All colors reference CSS variables that swap in `.dark`. No hardcoded colors in components.

---

## File & Folder Conventions

```
src/
  app/
    globals.css          ← CSS variables defined here
    layout.tsx           ← ThemeProvider, font, metadata
  components/
    ui/                  ← shadcn/ui primitives (button, card, badge, etc.)
    listing-card.tsx     ← Feed card component
    listing-status.tsx   ← Status badge with color logic
    pipeline-steps.tsx   ← Processing step indicators
    image-carousel.tsx   ← Detail screen carousel
    image-grid.tsx       ← Capture screen thumbnail grid
    copy-button.tsx      ← Copy-to-clipboard with feedback
    voice-input.tsx      ← Mic button + recording state
    bottom-bar.tsx       ← Fixed bottom action bar
    fab.tsx              ← Floating action button
  lib/
    utils.ts             ← cn() helper (shadcn default)
```