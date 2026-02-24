# A2R UI Components

> Source: A2R Brandbook pp. 53-55 (June 2025, The Branx Europe S.L.)

## Tags

- **Text**: Always UPPERCASE
- **Typeface**: Plus Jakarta Sans (secondary typeface)
- **Shape**: Pill/capsule shape with rounded ends
- **Border**: Thin outline border
- **Background**: Transparent (outlined style)
- **Purpose**: Categorize or label information, making complex systems navigable

### Tag Styling

Tags use an **outlined rounded pill** style: fully rounded corners (`rounded-full`), thin `border-white` border, transparent background, uppercase text in Plus Jakarta Sans.

#### HTML/CSS Reference

```html
<span class="a2r-tag">Innovación Educativa</span>
```

```css
.a2r-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;          /* fully rounded pill */
  border: 1px solid currentColor; /* thin outline */
  background: transparent;
  padding: 1rem 2rem;             /* py-4 px-8 in Tailwind units */
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 500;               /* Medium */
  font-size: 1rem;                /* base, scales up at xl/2xl */
  text-transform: uppercase;
  white-space: nowrap;
  width: fit-content;
  letter-spacing: 0.02em;
  transition: color 0.25s, box-shadow 0.25s;
}
```

#### Tailwind Utility Reference

```html
<span class="inline-flex items-center justify-center rounded-full
  border border-white bg-transparent
  px-8 py-4 text-base xl:text-base 2xl:text-lg
  font-normal text-white uppercase whitespace-nowrap w-fit
  transition-[color,box-shadow]">
  Innovación Educativa
</span>
```

#### Responsive Font Size

| Breakpoint | Font Size |
|------------|-----------|
| Default – xl | `text-base` (1rem / 16px) |
| 2xl+ | `text-lg` (1.125rem / 18px) |

#### Color Variants

| Context | Border | Text |
|---------|--------|------|
| On dark background | `border-white` | `text-white` |
| On light background | `border-solid-black` (`#111218`) | `text-solid-black` |
| On Core Blue background | `border-white` | `text-white` |

### Examples
- `WHAT WE DO`
- `A2R LEARNING`
- `EDUCATIVE LANDSCAPE`
- `INNOVACIÓN EDUCATIVA`

## Buttons

Three variants, all using Plus Jakarta Sans Medium in UPPERCASE.

| Variant | Fill | Text Color | Border | Use Case |
|---------|------|-----------|--------|----------|
| **Primary (Black)** | Solid Black (`#111218`) | White | None | Primary actions |
| **Primary (Blue)** | Core Blue (`#2764F4`) | White | None | Brand-focused CTAs |
| **Ghost (Outlined)** | Transparent | Solid Black | Thin border | Secondary actions |

### Button Shape
- Pill/capsule shape with fully rounded ends (`rounded-full`) — same as tags but with filled background
- All text is UPPERCASE in Plus Jakarta Sans Medium

### Button Styling

Buttons share the same **outlined rounded pill** base as tags, but add a filled background for primary variants.

#### HTML/CSS Reference

```html
<!-- Primary Black -->
<button class="a2r-btn a2r-btn--primary-black">Get Started</button>

<!-- Primary Blue -->
<button class="a2r-btn a2r-btn--primary-blue">Learn More</button>

<!-- Ghost / Outlined -->
<button class="a2r-btn a2r-btn--ghost">Contact Us</button>
```

```css
.a2r-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;          /* fully rounded pill */
  padding: 1rem 2rem;             /* py-4 px-8 in Tailwind units */
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 500;               /* Medium */
  font-size: 1rem;                /* base, scales up at xl/2xl */
  text-transform: uppercase;
  white-space: nowrap;
  width: fit-content;
  cursor: pointer;
  transition: color 0.25s, background-color 0.25s, box-shadow 0.25s;
}

/* Primary Black */
.a2r-btn--primary-black {
  background: #111218;
  color: #FFFFFF;
  border: none;
}

/* Primary Blue */
.a2r-btn--primary-blue {
  background: #2764F4;
  color: #FFFFFF;
  border: none;
}

/* Ghost / Outlined */
.a2r-btn--ghost {
  background: transparent;
  color: #111218;
  border: 1px solid #111218;
}

/* Ghost — dark mode */
[data-theme="dark"] .a2r-btn--ghost {
  color: #FFFFFF;
  border-color: #FFFFFF;
}
```

#### Tailwind Utility Reference

```html
<!-- Primary Black -->
<button class="inline-flex items-center justify-center rounded-full
  bg-solid-black text-white border-none
  px-8 py-4 text-base xl:text-base 2xl:text-lg
  font-medium uppercase whitespace-nowrap w-fit
  transition-[color,background-color,box-shadow]">
  Get Started
</button>

<!-- Primary Blue -->
<button class="inline-flex items-center justify-center rounded-full
  bg-core-blue text-white border-none
  px-8 py-4 text-base xl:text-base 2xl:text-lg
  font-medium uppercase whitespace-nowrap w-fit
  transition-[color,background-color,box-shadow]">
  Learn More
</button>

<!-- Ghost / Outlined -->
<button class="inline-flex items-center justify-center rounded-full
  bg-transparent text-solid-black border border-solid-black
  dark:text-white dark:border-white
  px-8 py-4 text-base xl:text-base 2xl:text-lg
  font-medium uppercase whitespace-nowrap w-fit
  transition-[color,background-color,box-shadow]">
  Contact Us
</button>
```

### Production Implementation

The A2R website uses CVA (class-variance-authority) for type-safe button variants.
Ghost buttons in dark mode switch to white border + white text.
Default transition duration: 250ms.
Border radius: `0.625rem` base with `sm/md/lg/xl` scale variants.

### Phosphor Icons in Next.js

Use the SSR-compatible import for server-rendered pages:
```tsx
import { ArrowRight } from '@phosphor-icons/react/ssr';
```
Default size: 16/24/32px. Default weight: Light.

## Boxes / Cards

Boxes and cards use a **thin border with decorative corner squares** — four small solid squares positioned at each corner of the container. This style applies **only to boxes and cards**, NOT to lists or tables.

- **Border**: 1px solid line
- **Corner markers**: 4 small squares (`size-2` / 0.5rem / 8px), one at each corner, offset by `-1` (−0.25rem / −4px)
- **Padding**: `p-2` (0.5rem) inner padding
- **Min height**: `min-h-96` (24rem) recommended for content boxes
- **Scope**: Use on content boxes, feature cards, section containers. Do NOT apply to lists, tables, or inline elements.

### HTML/CSS Reference

```html
<div class="a2r-box">
  <div class="a2r-box__corner a2r-box__corner--tl"></div>
  <div class="a2r-box__corner a2r-box__corner--tr"></div>
  <div class="a2r-box__corner a2r-box__corner--bl"></div>
  <div class="a2r-box__corner a2r-box__corner--br"></div>
  <!-- content here -->
</div>
```

```css
.a2r-box {
  position: relative;
  border: 1px solid #111218;
  padding: 0.5rem;               /* p-2 */
  min-height: 24rem;             /* min-h-96 */
}

.a2r-box__corner {
  position: absolute;
  width: 0.5rem;                 /* size-2 */
  height: 0.5rem;
  background: #111218;
}

.a2r-box__corner--tl { top: -0.25rem;    left: -0.25rem; }
.a2r-box__corner--tr { top: -0.25rem;    right: -0.25rem; }
.a2r-box__corner--bl { bottom: -0.25rem; left: -0.25rem; }
.a2r-box__corner--br { bottom: -0.25rem; right: -0.25rem; }

/* Dark mode */
[data-theme="dark"] .a2r-box {
  border-color: #FFFFFF;
}
[data-theme="dark"] .a2r-box__corner {
  background: #FFFFFF;
}
```

### Tailwind Utility Reference

```html
<div class="relative border border-black dark:border-white p-2 min-h-96">
  <!-- Top-left corner -->
  <div class="absolute -top-1 -left-1 size-2 bg-black dark:bg-white"></div>
  <!-- Top-right corner -->
  <div class="absolute -top-1 -right-1 size-2 bg-black dark:bg-white"></div>
  <!-- Bottom-left corner -->
  <div class="absolute -bottom-1 -left-1 size-2 bg-black dark:bg-white"></div>
  <!-- Bottom-right corner -->
  <div class="absolute -right-1 -bottom-1 size-2 bg-black dark:bg-white"></div>
  <!-- content here -->
</div>
```

### When to Use

| Element | Corner-square border? |
|---------|----------------------|
| Content boxes / cards | Yes |
| Feature sections | Yes |
| Grid cells (layout containers) | Yes |
| Lists (`<ul>`, `<ol>`) | No — use plain styling |
| Tables (`<table>`) | No — use plain styling |
| Inline elements | No |

## Social Media

### LinkedIn
- **Banner**: Grid pattern background (brand grid with expanding shapes)
- **Profile picture**: Brand icon (Core Blue bg + white symbol)
- **Content**: Mix of typography cards, photography, and shape-based posts

### Instagram
- **Posts**: Mix of typography, photography, and shapes
- **Stories**: Photography with brand overlays
- **Profile**: Brand icon

## Email Signatures

Two variants based on team role:

### Management & Communication Teams
- Includes **personal photo** (circular crop)
- Name, title, contact info
- A2R logomark
- Grid/brand visual element
- Phone, email, LinkedIn links

### Technical Teams
- **Simpler layout** without photo
- A2R logomark (larger, centered)
- Name, title
- Phone, email, LinkedIn links
- Clean, minimal design

### Signature Builder
An HTML-based tool is available at `assets/` source directory (`Signature/index.html` in the brand source) for generating branded email signatures.

## Logo Animations in UI

| Animation | Use Case | Format |
|-----------|----------|--------|
| Spinner V1/V2 (White) | Loading states on dark backgrounds | GIF / MP4 |
| Spinner V1/V2 (Black) | Loading states on light backgrounds | GIF / MP4 |
| Logo Reveal | App launch, video intros | MP4 |
