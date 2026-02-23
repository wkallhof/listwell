# Listwell — Design System

**Version:** 0.2 · Garage Door Green
**Last Updated:** February 2026
**Stack:** Next.js App Router · shadcn/ui · Tailwind CSS · PWA
**Platforms:** Mobile web (primary), Desktop web, iOS PWA, Android PWA

---

## Design Philosophy

Listwell is a tool, not a destination. The interface should feel like the most organized person you know — warm, competent, and quietly confident. The brand we call **Garage Door Green** is rooted in the real-world context where selling happens: garages, kitchens, living rooms. It's utilitarian warmth. A helpful friend, not a tech product.

### Principles

1. **Mobile-first, always.** Every layout starts at 375px. Desktop stretches gracefully but never redesigns.
2. **Content is the hero.** User photos and generated listings are the visual center. Chrome stays minimal.
3. **Show momentum.** Pipeline steps, status badges, and micro-progress signals keep the user confident that things are working.
4. **One primary action per screen.** Secondary actions exist but are visually subordinate.
5. **Magic, not machinery.** Never say "AI." Never explain the technology. The transformation from photos to listing should feel effortless — like it just happens.
6. **Sound like a person.** Every piece of copy — from generated listings to app microcopy — should read like a real human wrote it.

---

## Brand Identity

### Tagline

**Sell your stuff, not your Saturday.**

### Voice

Warm, direct, slightly casual. The tone of a friend who's good at this stuff and happy to help. Never corporate, never condescending, never "techy."

| Do | Don't |
|---|---|
| "Your listing is cooking. We'll ping you when it's ready." | "Your listing is being processed by our AI pipeline." |
| "3 similar items found — you're priced right." | "Our algorithm has analyzed comparable market data." |
| "Photos look great. Let's make them even better." | "Image enhancement is available for optimization." |
| "Something went wrong. Want to try again?" | "Error 500: Pipeline execution failed." |

### Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| **Display** | Fraunces (variable, opsz 9–144) | 500–700 | Hero headlines, marketing pages, landing sections |
| **Headings** | Fraunces | 600 | Section titles, card titles, price displays |
| **Body** | Instrument Sans | 400–500 | All body text, descriptions, UI labels |
| **UI Labels** | Instrument Sans | 500–600 | Buttons, navigation, form labels |
| **Data / Mono** | JetBrains Mono | 400–500 | Prices, stats, pipeline status, technical readouts |

**Type Scale (mobile-first):**

```
--text-xs:    0.75rem / 12px   — Fine print, timestamps
--text-sm:    0.82rem / 13px   — Captions, metadata, badge labels
--text-base:  0.9rem  / 14px   — Body text (mobile default)
--text-md:    1rem    / 16px   — Body text (desktop), prominent UI
--text-lg:    1.15rem / 18px   — Card titles, subheadings
--text-xl:    1.35rem / 22px   — Section headings
--text-2xl:   1.75rem / 28px   — Page titles
--text-3xl:   2.25rem / 36px   — Hero headings (mobile)
--text-4xl:   3rem    / 48px   — Hero headings (desktop)
--text-5xl:   3.75rem / 60px   — Marketing hero (desktop)
```

**Line heights:** Headings at 1.1–1.15. Body text at 1.6–1.7. UI labels at 1.3.

**Letter spacing:** Display type at -0.02em. Body at 0. Mono/labels at 0.02–0.04em. Uppercase labels at 0.08–0.12em.

---

## Color System

All colors defined as HSL for shadcn/ui CSS variable compatibility. Hex equivalents provided for design tools.

### Light Mode (Default)

```css
:root {
  /* --- Primary --- */
  --primary:            166 62% 38%;      /* #259E89 · Teal Pine */
  --primary-foreground: 0 0% 100%;        /* #FFFFFF */
  --primary-hover:      166 62% 30%;      /* #1E7D6C · Teal Pine dark */
  --primary-light:      166 50% 95%;      /* #E8F7F3 · Teal tint for highlights */
  --primary-glow:       166 62% 38% / 12%; /* Pine with opacity for glows */

  /* --- Backgrounds --- */
  --background:         36 18% 95%;       /* #F4F1EB · Warm Linen */
  --background-warm:    36 18% 91%;       /* #EDE9E0 · Linen warm (sections) */
  --background-bright:  36 18% 98%;       /* #FDFCFA · Linen bright (cards, alt) */

  /* --- Surfaces --- */
  --card:               0 0% 100%;        /* #FFFFFF */
  --card-foreground:    160 6% 18%;       /* #2C2E2D */
  --popover:            0 0% 100%;        /* #FFFFFF */
  --popover-foreground: 160 6% 18%;       /* #2C2E2D */

  /* --- Text --- */
  --foreground:         160 6% 18%;       /* #2C2E2D · Primary text */
  --muted-foreground:   160 4% 36%;       /* #585E5C · Secondary text */
  --faint-foreground:   160 3% 55%;       /* #8A8F8D · Tertiary/placeholder */

  /* --- Borders --- */
  --border:             160 8% 90%;       /* ~rgba(27,43,40,0.08) */
  --border-strong:      160 8% 82%;       /* ~rgba(27,43,40,0.14) */
  --input:              160 8% 90%;       /* Same as border */
  --ring:               166 62% 38%;      /* Primary for focus rings */

  /* --- Semantic --- */
  --destructive:        4 72% 51%;        /* #D4453B · Alert Red */
  --destructive-foreground: 0 0% 100%;    /* #FFFFFF */
  --gold:               43 80% 55%;       /* #E8B931 · Sold Gold / warnings */
  --gold-soft:          43 80% 55% / 15%; /* Gold tint */

  /* --- Shed (dark accent for hero/footer/dark sections) --- */
  --shed:               160 22% 14%;      /* #1B2B28 · Deep Shed */
  --shed-deep:          160 25% 8%;       /* #0F1B18 · Deepest */
  --shed-foreground:    36 18% 95%;       /* Linen on shed */

  /* --- shadcn mapped --- */
  --secondary:          36 18% 91%;       /* Warm Linen */
  --secondary-foreground: 160 6% 18%;
  --accent:             166 50% 95%;      /* Teal tint */
  --accent-foreground:  166 62% 28%;
  --muted:              36 12% 92%;
}
```

### Dark Mode

```css
.dark, [data-theme="dark"] {
  /* --- Primary --- */
  --primary:            166 55% 45%;      /* #34B89E · Brighter teal for dark bg */
  --primary-foreground: 160 25% 8%;       /* #0F1B18 */
  --primary-hover:      166 55% 52%;      /* #3DCBAF */
  --primary-light:      166 40% 12%;      /* Dark teal tint */
  --primary-glow:       166 55% 45% / 15%;

  /* --- Backgrounds --- */
  --background:         160 15% 6%;       /* #0D1210 · Deep forest */
  --background-warm:    160 12% 8%;       /* #111916 */
  --background-bright:  160 10% 10%;      /* #151C19 */

  /* --- Surfaces --- */
  --card:               160 10% 10%;      /* #151C19 */
  --card-foreground:    36 12% 88%;       /* #E0DCD4 */
  --popover:            160 10% 10%;
  --popover-foreground: 36 12% 88%;

  /* --- Text --- */
  --foreground:         36 12% 90%;       /* #E4E0D8 · Primary text */
  --muted-foreground:   36 6% 55%;        /* #908D87 · Secondary text */
  --faint-foreground:   36 4% 40%;        /* #696662 · Tertiary */

  /* --- Borders --- */
  --border:             160 8% 16%;       /* Subtle edge */
  --border-strong:      160 8% 22%;       /* Emphasized edge */
  --input:              160 8% 16%;
  --ring:               166 55% 45%;

  /* --- Semantic --- */
  --destructive:        4 72% 55%;        /* Slightly lighter red */
  --destructive-foreground: 0 0% 100%;
  --gold:               43 75% 55%;
  --gold-soft:          43 75% 55% / 15%;

  /* --- Shed (inverts to lighter for dark-on-dark sections) --- */
  --shed:               36 12% 90%;       /* Linen text on dark */
  --shed-deep:          160 15% 4%;       /* Deepest black */
  --shed-foreground:    160 15% 6%;

  /* --- shadcn mapped --- */
  --secondary:          160 10% 12%;
  --secondary-foreground: 36 12% 88%;
  --accent:             166 40% 12%;
  --accent-foreground:  166 55% 60%;
  --muted:              160 8% 14%;
}
```

### Status Colors (both modes)

These remain consistent across themes with minor luminance adjustments.

| Status | Light BG | Light Text | Dark BG | Dark Text | Usage |
|--------|----------|------------|---------|-----------|-------|
| **Processing** | `hsl(43 80% 55% / 0.12)` | `hsl(43 75% 40%)` | `hsl(43 75% 55% / 0.12)` | `hsl(43 70% 65%)` | Pipeline in progress |
| **Ready** | `hsl(166 62% 38% / 0.1)` | `hsl(166 62% 32%)` | `hsl(166 55% 45% / 0.12)` | `hsl(166 55% 55%)` | Listing complete |
| **Listed** | `hsl(220 65% 55% / 0.1)` | `hsl(220 65% 42%)` | `hsl(220 60% 55% / 0.12)` | `hsl(220 55% 65%)` | Posted to marketplace |
| **Sold** | `hsl(270 45% 55% / 0.1)` | `hsl(270 40% 42%)` | `hsl(270 40% 55% / 0.12)` | `hsl(270 35% 65%)` | Transaction complete |
| **Archived** | `hsl(160 4% 55% / 0.08)` | `hsl(160 4% 50%)` | `hsl(160 4% 40% / 0.1)` | `hsl(160 4% 55%)` | Hidden from feed |
| **Error** | `hsl(4 72% 51% / 0.1)` | `hsl(4 72% 45%)` | `hsl(4 72% 55% / 0.12)` | `hsl(4 65% 65%)` | Pipeline failure |

---

## Spacing System

Base unit: `4px`. Follows Tailwind's default spacing scale.

```
--space-0:   0
--space-0.5: 2px     — Hairline gaps
--space-1:   4px     — Tight inner padding
--space-1.5: 6px     — Badge padding, chip gaps
--space-2:   8px     — Inner card padding (tight), icon gaps
--space-3:   12px    — Standard inner padding
--space-4:   16px    — Card padding, list item spacing
--space-5:   20px    — Section inner spacing
--space-6:   24px    — Card padding (comfortable), inter-card gap
--space-8:   32px    — Section gaps, major spacing
--space-10:  40px    — Large section padding
--space-12:  48px    — Page section spacing (mobile)
--space-16:  64px    — Page section spacing (desktop)
--space-20:  80px    — Hero padding
--space-24:  96px    — Major marketing section padding (desktop)
```

**Usage patterns:**
- Card internal padding: `space-4` (mobile), `space-6` (desktop)
- Between cards in a list: `space-3`
- Section vertical padding: `space-12` (mobile), `space-16` to `space-24` (desktop)
- Between section heading and content: `space-8`
- Inline element gaps (icon + text): `space-2`
- Form field gaps: `space-4`

---

## Border Radius

```
--radius-sm:   6px    — Badges, chips, small tags
--radius:      10px   — Default: cards, buttons, inputs (shadcn --radius)
--radius-md:   12px   — Image thumbnails, listing cards
--radius-lg:   16px   — Modal sheets, large cards
--radius-xl:   20px   — Marketing cards, feature blocks
--radius-2xl:  24px   — Phone frames, hero elements
--radius-full: 9999px — Pills, FAB, avatar, circular elements
```

In `tailwind.config`:
```js
borderRadius: {
  DEFAULT: '10px',  // var(--radius)
  sm: '6px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
}
```

---

## Shadows

Warm-shifted shadows using the shed color, not pure black.

```css
/* Light mode */
--shadow-xs:  0 1px 2px hsl(160 22% 14% / 0.04);
--shadow-sm:  0 1px 3px hsl(160 22% 14% / 0.06), 0 1px 2px hsl(160 22% 14% / 0.04);
--shadow-md:  0 4px 12px hsl(160 22% 14% / 0.06), 0 2px 4px hsl(160 22% 14% / 0.03);
--shadow-lg:  0 8px 24px hsl(160 22% 14% / 0.08), 0 4px 8px hsl(160 22% 14% / 0.04);
--shadow-xl:  0 20px 48px hsl(160 22% 14% / 0.1), 0 8px 16px hsl(160 22% 14% / 0.05);
--shadow-primary: 0 2px 12px hsl(166 62% 38% / 0.25), 0 1px 3px hsl(166 62% 38% / 0.15);

/* Dark mode */
--shadow-xs:  0 1px 2px hsl(0 0% 0% / 0.2);
--shadow-sm:  0 1px 3px hsl(0 0% 0% / 0.3);
--shadow-md:  0 4px 12px hsl(0 0% 0% / 0.3);
--shadow-lg:  0 8px 24px hsl(0 0% 0% / 0.4);
--shadow-xl:  0 20px 48px hsl(0 0% 0% / 0.5);
--shadow-primary: 0 2px 12px hsl(166 55% 45% / 0.2), 0 1px 3px hsl(166 55% 45% / 0.1);
```

---

## Iconography

**Library:** Lucide React
**Sizes:** 18px inline (with text), 20px standard, 24px standalone/nav
**Stroke:** 2px default, 1.5px for dense UI

**Core icon map:**

| Context | Icon | Notes |
|---------|------|-------|
| New listing FAB | `Plus` | Inside circular/rounded button |
| Camera capture | `Camera` | Primary capture action |
| Gallery picker | `ImagePlus` | Secondary import action |
| Voice input | `Mic` | Recording state: `MicOff` |
| Copy action | `Copy` | Inline with copy buttons |
| Copied confirmation | `Check` | Replaces Copy briefly |
| Enhance photo | `Sparkles` | Contextual on images |
| Price / money | `DollarSign` | Price displays |
| Market research | `TrendingUp` | Comparable data |
| Back navigation | `ChevronLeft` | Top-left header |
| Overflow menu | `MoreHorizontal` | Top-right header |
| Delete | `Trash2` | Destructive actions |
| Edit | `Pencil` | Inline edit toggles |
| Status: Processing | `Loader2` | Animated spin |
| Status: Ready | `CheckCircle2` | |
| Status: Error | `AlertCircle` | |
| External link | `ExternalLink` | Comparable listing links |

---

## Component Reference

Built on shadcn/ui primitives. All components respect light/dark mode via CSS variables.

### Buttons

| Variant | Usage | Style |
|---------|-------|-------|
| **Primary** | Main CTA ("Generate," "Get Started," "Copy Full Listing") | `bg-primary text-primary-foreground` · Pill radius on marketing, default radius in app |
| **Secondary** | Supportive actions ("Copy Title," "Try Again") | `bg-secondary text-secondary-foreground border border-border` |
| **Ghost** | Tertiary, nav links, inline actions | Transparent, text-only, hover reveals background |
| **Destructive** | Delete actions | `bg-destructive text-destructive-foreground` |

**Sizes:**
- `sm`: 32px height, text-sm, px-3
- `default`: 40px height, text-base, px-4
- `lg`: 48px height, text-md, px-6 (marketing CTAs)

### Cards

- **Listing Card (Feed):** Thumbnail left/top, title, price (mono), status badge. Border + subtle shadow. Tap target is entire card.
- **Feature Card (Marketing):** Icon top, heading, description. Border, hover lifts border color toward primary.
- **Stat Card (Marketing):** Large number (Fraunces), label, description. Accent background optional.
- **Pricing Card (Marketing):** Tier name, price (Fraunces), feature list, CTA button. Featured tier gets primary border + shadow.

### Badges

Small pill-shaped status indicators. Use the status color system defined above.

```
padding: 0.15rem 0.55rem
font-size: --text-xs (0.75rem)
font-weight: 600
border-radius: --radius-sm (6px)
text-transform: uppercase
letter-spacing: 0.04em
```

### Inputs

- Height: 44px (thumb-friendly mobile)
- Border: `border-input`, focus: `ring-2 ring-ring ring-offset-2`
- Background: `bg-background` (light) / `bg-card` (dark)
- Placeholder: `text-faint-foreground`

### Toast Notifications

| Event | Message | Type | Duration |
|-------|---------|------|----------|
| Copy title | "Title copied" | success | 2s |
| Copy description | "Description copied" | success | 2s |
| Copy full listing | "Listing copied to clipboard" | success | 2s |
| Listing submitted | "Your listing is cooking..." | info | 3s |
| Listing ready | "Your listing is ready!" | success | 4s |
| Enhancement done | "Enhanced photo ready" | success | 3s |
| Enhancement fail | "That didn't work — want to try again?" | error | 5s |
| Pipeline error | "Something went wrong. We'll look into it." | error | 5s |
| Delete confirm | "Listing deleted" | neutral | 3s |

### Floating Action Button (FAB)

- Size: 56px diameter
- Position: Bottom-right, 20px inset, above safe area
- Background: `bg-primary`
- Icon: `Plus`, 24px, white
- Shadow: `shadow-primary`
- z-index: 50

### Bottom Navigation (App only — if needed)

Reserved for future multi-section navigation. Current MVP is single-stack with back navigation.

---

## Motion & Animation

### Philosophy

Movement should feel organic and purposeful. Speed communicates confidence — things happen quickly because the tool knows what it's doing. No bouncy or playful easing; smooth and warm.

### Timing

```
--duration-fast:    120ms   — Hover states, button feedback
--duration-normal:  200ms   — Transitions, fades, color changes
--duration-slow:    350ms   — Sheet open/close, page transitions
--duration-reveal:  650ms   — Scroll reveal, staggered entry
```

### Easing

```
--ease-out:     cubic-bezier(0.16, 1, 0.3, 1)     — Primary easing for most transitions
--ease-in-out:  cubic-bezier(0.45, 0, 0.55, 1)     — Symmetric transitions
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1)  — Subtle overshoot for success states
```

### Patterns

- **Scroll reveal:** Elements fade up 24–32px with `--duration-reveal` and `--ease-out`. Stagger siblings by 80ms.
- **Button press:** Scale to 0.97 on active, return on release. Duration: `--duration-fast`.
- **Loading spinner:** `Loader2` icon with CSS `animation: spin 1s linear infinite`.
- **Pipeline progress:** Sequential step indicators animate in with stagger.
- **Copy confirmation:** Icon cross-fades from Copy to Check, auto-reverts after 2s.
- **Toast entry:** Slide up from bottom + fade in, 350ms. Exit: fade out 200ms.
- **Sheet (enhancement, detail expand):** Slide up from bottom, 350ms, ease-out. Backdrop fades in.

---

## Responsive Breakpoints

```
sm:   640px    — Large phones landscape
md:   768px    — Tablets, small laptops
lg:   1024px   — Desktop
xl:   1280px   — Wide desktop
```

### App Layout Rules

- **Max content width in app:** `max-w-lg` (512px). The app is a phone-width column on all devices.
- **Max content width on marketing pages:** `max-w-5xl` (1080px) for content, `max-w-6xl` (1152px) for grids.
- **Mobile padding:** `px-4` (16px) sides.
- **Desktop padding:** `px-6` (24px) sides, centered.

### App vs. Marketing

| Property | App | Marketing Site |
|----------|-----|----------------|
| Max width | 512px | 1080px |
| Background | `--background` | `--background` with section alternation |
| Button radius | `--radius` (10px) | `--radius-full` (pill) |
| Typography ceiling | `--text-2xl` | `--text-5xl` |
| Sections | Card-based feed | Full-bleed alternating sections |
| Dark sections | Rare (modal overlays) | Hero, features, footer use `--shed` |

---

## Image Guidelines

### App Photography

- Images come from the user's phone camera — don't design for perfection.
- Thumbnail aspect ratio: 1:1 square crop in feed cards.
- Listing detail: Original aspect ratio preserved in carousel.
- Enhanced images sit alongside originals, never replace them.

### Marketing Photography

- Lifestyle-first: real items in real settings (garage, kitchen counter, desk).
- Never sterile product shots on white backgrounds.
- Warm natural light, slight depth of field.
- Phone mockups showing the Listwell interface are a primary marketing asset.

---

## Dark Mode Implementation Notes

### Toggle Behavior

- Respect `prefers-color-scheme` system preference by default.
- Allow manual override stored in localStorage (key: `listwell-theme`).
- Toggle in app settings. Marketing site follows system only (no toggle).

### CSS Strategy

```css
/* globals.css */
:root { /* light mode variables */ }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark mode variables */ }
}

[data-theme="dark"] { /* dark mode variables (forced) */ }
[data-theme="light"] { /* light mode variables (forced) */ }
```

### Dark Mode Considerations

- Backgrounds shift from warm linen to deep forest green-black (not pure black — maintains the warmth).
- Primary teal gets brighter (+10% lightness) to maintain contrast on dark backgrounds.
- Cards use `--card` (slightly lighter than background) to create subtle layering.
- Borders lighten to `16%–22%` lightness range for visibility.
- Shadows get darker and more diffuse. On OLED, shadows are nearly invisible — rely on border differentiation instead.
- Status badge backgrounds get slightly more opacity to read on dark surfaces.
- Marketing dark sections (hero, features) on the dark-mode site use `--shed-deep` to differentiate from the already-dark background.

---

## Accessibility Requirements

- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text (both themes).
- Focus rings: 2px solid `--ring` with 2px offset. Visible in both modes.
- Touch targets: Minimum 44×44px on all interactive elements.
- Reduced motion: Respect `prefers-reduced-motion` — disable scroll reveals, simplify transitions to opacity-only.
- Screen reader: All icons have `aria-label` or are `aria-hidden` with adjacent text label.
- Color alone never conveys meaning — status badges include text labels, not just color.

---

## File Structure Reference

```
app/
├── globals.css              ← CSS variables (light + dark), base styles
├── layout.tsx               ← Theme provider wrapper, font imports
├── (marketing)/
│   ├── page.tsx             ← Landing page
│   └── layout.tsx           ← Marketing layout (wider, section-based)
└── (app)/
    ├── layout.tsx           ← App layout (narrow, card-based, bottom nav)
    ├── page.tsx             ← Listings feed
    ├── new/                 ← Capture → Describe → Submitted
    └── listings/[id]/       ← Listing detail, enhancement
```

### Font Loading

```tsx
// layout.tsx
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
```

### Tailwind Config Extensions

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        pine: {
          DEFAULT: 'hsl(var(--primary))',
          light: 'hsl(var(--primary-light))',
          glow: 'hsl(var(--primary-glow))',
        },
        shed: {
          DEFAULT: 'hsl(var(--shed))',
          deep: 'hsl(var(--shed-deep))',
        },
        gold: {
          DEFAULT: 'hsl(var(--gold))',
          soft: 'hsl(var(--gold-soft))',
        },
      },
    },
  },
};
```

---

## Quick Reference: Marketing vs. App Tokens

| Token | Marketing (Light) | Marketing (Dark) | App (Light) | App (Dark) |
|-------|-------------------|-------------------|-------------|------------|
| Page bg | `--background` (Linen) | `--shed-deep` (Forest) | `--background` (Linen) | `--background` (Forest) |
| Card bg | `white` | `--card` | `white` | `--card` |
| Primary CTA | Pill, `shadow-primary` | Pill, `shadow-primary` | Rounded, no shadow | Rounded, no shadow |
| Hero sections | `--shed` bg, linen text | `--shed-deep` bg, linen text | N/A | N/A |
| Body text | `--foreground` | `--foreground` | `--foreground` | `--foreground` |
| Muted text | `--muted-foreground` | `--muted-foreground` | `--muted-foreground` | `--muted-foreground` |

---

*This document is the single source of truth for all Listwell visual decisions. When in doubt, reference the principles at the top: warm, competent, quiet, mobile-first, and never say AI.*