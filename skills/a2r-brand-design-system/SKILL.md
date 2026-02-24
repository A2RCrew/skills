---
name: a2r-brand-design-system
description: >
  A2R brand design system reference and enforcement guide. Provides color palettes, typography rules,
  logo usage, imagery patterns, UI component specs, and light/dark mode theming. Use when creating,
  reviewing, or modifying any visual design, UI, marketing material, presentation, email, social
  media asset, or web/app interface that must conform to A2R brand identity. Also use when generating
  CSS, design tokens, or component configurations for A2R.
---

# A2R Brand Design System

## Brand Identity Overview

**Vision**: To empower educational partners with AI, enabling them to create adaptive, personalized learning experiences that expand access and maximize student impact.

**Mission**: To pioneer a future where education is dynamic, deeply personalized, and borderless, continuously reinvented by the synergy of AI and human creativity.

**Purpose**: To harness advanced AI, enabling educational publishers and universities to revolutionize learning by delivering truly personalized and adaptive experiences at scale.

**Brand Pillars**: Dynamic, Reliable, Experienced, Trustworthy, Innovative.

> Source: A2R Brandbook (June 2025, The Branx Europe S.L.) — 55 pages.
> All fonts are SIL Open Font License.

---

## Quick Reference: Design Tokens

### Colors (16 values)

```json
{
  "core-blue":       "#2764F4",
  "silver-gray":     "#FBFCFD",
  "solid-black":     "#111218",
  "pure-white":      "#FFFFFF",
  "silver-gray-200": "#F1F1F1",
  "silver-gray-300": "#E6E6E9",
  "silver-gray-400": "#D0D0D4",
  "silver-gray-500": "#C6C6CA",
  "silver-gray-600": "#9F9FA4",
  "silver-gray-700": "#6F6F75",
  "silver-gray-800": "#35363B",
  "silver-gray-900": "#1E1F24",
  "silver-gray-950": "#121316",
  "fresh-green":     "#A1E8C9",
  "bright-yellow":   "#F7FF8E",
  "warm-orange":     "#FFCDBF"
}
```

### Typography Hierarchy

| Level | Font | Weight | Size | Line Height |
|-------|------|--------|------|-------------|
| Overline | Plus Jakarta Sans | Medium | 18px | 130% |
| Large Display | Faculty Glyphic | Regular | 72px | 110% |
| Title | Faculty Glyphic | Regular | 48px | 130% |
| Subtitle | Faculty Glyphic | Regular | 24px | 130% |
| Paragraph | Plus Jakarta Sans | Regular | 20px | 150% |
| Button & Link | Plus Jakarta Sans | Medium | 20px | — |

### Spacing

- Logo clear space: width of the "r" character in the wordmark
- Box Frame margin: 2X (X = node size)
- Grid gutter: = Box Frame node size
- Co-branding gap: 0.25X (X = A2R logo width)

---

## Workflow: Applying the Brand

### By task type:

**Web UI / App Interface**
1. Set up light/dark mode tokens → see `references/light-dark-mode.md`
2. Apply typography hierarchy → see `references/typography.md`
3. Configure colors with 60-30-10 rule → see `references/colors-and-tokens.md`
4. Use Phosphor Icons (Light) for UI icons → see `references/photography-and-iconography.md`
5. Apply buttons/tags styles → see `references/ui-components.md`

**Marketing Asset (Social Media, Banner, Presentation)**
1. Pick appropriate background from color palette → `references/colors-and-tokens.md`
2. Select logo version matching background → `references/logo-usage.md`
3. Apply typography (Faculty Glyphic for headlines, PJS for body) → `references/typography.md`
4. Add expanding shapes and/or flow textures → `references/imagery-and-shapes.md`
5. Use display icons for visual accents (NOT UI) → `references/photography-and-iconography.md`

**Hero Section / WebGL Shader Background**
1. Read `references/webgl-hero-shader.md` for complete source code and integration guide
2. Choose route-based color preset or define custom colorMultiplier/colorAddition
3. Set up raw-loader for .frag/.vert imports
4. Apply useShader hook with canvas + content overlay pattern

**Design Token / CSS Generation**
1. Copy JSON tokens from `references/colors-and-tokens.md`
2. Copy typography tokens from `references/typography.md`
3. Apply mode-aware CSS from `references/light-dark-mode.md`

**Brand Compliance Review**
1. Run through the checklist in this file (see below)
2. Cross-reference each section against the corresponding reference file

---

## Core Rules Summary

### Logo
- **Logomark** (symbol + wordmark) is the primary representation
- **Symbol** alone is acceptable for small spaces
- **Wordmark** alone is exceptional use only
- Exclusion zone = width of "r" character; nothing intrudes into this space
- Always maintain high contrast between logo and background
- On photos: darken with an overlay if needed for legibility

### Colors (60-30-10)
- **60%** Silver Gray (`#FBFCFD`) — backgrounds, base surfaces
- **30%** Core Blue (`#2764F4`) — brand recognition, key sections
- **10%** Solid Black (`#111218`) — text, anchoring, contrast
- Accents (Green, Yellow, Orange) used sparingly; max ONE per visual
- Exception: banners may use accent colors as predominant tones
- Text on accent backgrounds is always Solid Black

### Typography
- **Faculty Glyphic** (Regular only): titles, display text, headlines
- **Plus Jakarta Sans** (Extralight/Regular/Bold): body, overlines, buttons
- Overlines and buttons: always UPPERCASE in Plus Jakarta Sans
- Faculty uppercase: short headlines only (2-4 words)
- Highlight keywords in Core Blue; on blue backgrounds, highlight in white
- Text alignment: left or centered preferred

### Imagery
- Expanding shapes: always expand L-to-R or T-to-B; never big-to-small
- Flow shapes: NEVER used alone — always combine with geometric shapes
- Combined: monochromatic; flow lighter than geometric
- No multi-color shapes, no gradients/textures on expanding shapes
- Grid: Silver Gray 300 lines on Silver Gray (light), Silver Gray 800 on Solid Black (dark)

### Photography
- Clean, polished, approachable, professional
- Natural light, contemporary architecture
- Collaboration, learning, subtle tech integration

---

## Light/Dark Mode Quick Reference

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | `#FBFCFD` Silver Gray | `#111218` Solid Black |
| Primary text | `#111218` Solid Black | `#FBFCFD` Silver Gray |
| Secondary text | `#35363B` Silver Gray 800 | `#C6C6CA` Silver Gray 500 |
| Grid lines | `#E6E6E9` Silver Gray 300 | `#35363B` Silver Gray 800 |
| Borders | `#E6E6E9` or `#C6C6CA` | `#35363B` |
| Logo | `*_SolidBlack` | `*_White` |
| Accent | `#2764F4` Core Blue | `#2764F4` Core Blue |
| Display icons | Solid Black variant | White variant |
| Surface (cards) | `#FFFFFF` or `#F1F1F1` | `#35363B` |
| Ghost button | Black border + text | White border + text |

**Mode decision**: Web/app = both modes; print = light; email signatures = light.

→ Full details in `references/light-dark-mode.md`

---

## Asset Inventory

### Logos (18 files)
```
assets/logos/svg/
  BrandSymbol_{PureBlack,SolidBlack,White}.svg
  LogoMark_{PureBlack,PureWhite,SolidBlack}.svg
  Wordmark_{PureBlack,SolidBlack,White}.svg
assets/logos/png/
  (same 9 variants in PNG format)
```

### Expanding Shapes (90 files)
```
assets/shapes/expanding/svg/ExpandingShape{Black,Blue,Green,Orange,Yellow}{1-6}.svg  (30)
assets/shapes/expanding/png/ExpandingShape{Black,Blue,Green,Orange,Yellow}{1-6}.png  (60)
```

### Flow Shapes (15+ files)
```
assets/shapes/flow/Flow{Black,Blue,Green,Orange,Yellow}{1-3}.png
```

### Integrated Shapes (12 files)
```
assets/shapes/integrated/Integrated shape {1-6}.png
assets/shapes/integrated/Integrated shape {1-6}@2x.png
```

### Display Icons (27 files)
```
assets/icons/solid-black/svg/{Arrow Right,Chart,Check,Download,Power,Search,Sparks,Text Align,Text Box}.svg  (9)
assets/icons/solid-black/png/{name}@4x.png  (9)
assets/icons/white/png/{name}@4x.png  (9)
```

### Fonts
```
assets/fonts/FacultyGlyphic-Regular.ttf
assets/fonts/PlusJakartaSans/PlusJakartaSans-VariableFont_wght.ttf
assets/fonts/PlusJakartaSans/PlusJakartaSans-Italic-VariableFont_wght.ttf
assets/fonts/PlusJakartaSans/static/PlusJakartaSans-{ExtraLight,Regular,Medium,Bold,ExtraBold,...}.ttf
```

### Animations (9 files)
```
assets/animations/gif/V{1,2} {Blanco,Negro}.gif   (4)
assets/animations/mp4/V{1,2} {Blanco,Negro}.mp4   (4)
assets/animations/mp4/Logo Reveal A2R.mp4          (1)
```

### Naming Conventions
- Logo variants: `{Component}_{ColorVersion}.{ext}` (e.g., `LogoMark_SolidBlack.svg`)
- Shapes: `ExpandingShape{Color}{Step}.{ext}` (e.g., `ExpandingShapeBlue3.svg`)
- Flow: `Flow{Color}{Variant}.png` (e.g., `FlowBlue2.png`)
- Icons: `{Name}.svg` / `{Name}@4x.png`
- Spinners: `V{version} {Blanco|Negro}.{gif|mp4}` (Blanco=white, Negro=black)

---

## Brand Compliance Checklist

When reviewing or producing any A2R artifact, verify:

- [ ] **Logo**: Correct version for background? Clear space respected? No distortion?
- [ ] **Colors**: Follows 60-30-10 rule? Max one accent per visual? All HEX values match brand palette?
- [ ] **Typography**: Faculty Glyphic for titles/display only? Plus Jakarta Sans for body? Correct weights?
- [ ] **Uppercase**: Only short headlines (2-4 words) in Faculty uppercase? Overlines/buttons in PJS uppercase?
- [ ] **Text contrast**: Text color appropriate for background? (See color pairing matrix)
- [ ] **Highlighting**: Keywords highlighted in Core Blue? (White on blue backgrounds?)
- [ ] **Shapes**: Expanding shapes in flat single color? Direction L-to-R or T-to-B? No big-to-small?
- [ ] **Flow shapes**: Combined with geometric (never alone)? Lighter tone? Monochromatic?
- [ ] **Grid**: Correct line color for mode? (SG300 on light, SG800 on dark)
- [ ] **Icons**: Display icons for graphic use only (not UI)? Phosphor Light for UI icons?
- [ ] **Photography**: Clean, natural, collaborative? No overshadowing tech?
- [ ] **Light/dark mode**: Correct token values per mode? Logo version matches? Ghost buttons adapt?
- [ ] **Co-branding**: 0.25X gap? "x" separator? Partner logo not taller than A2R?
- [ ] **Buttons**: Pill shape? Uppercase PJS Medium? Correct fill variant?
- [ ] **Tags**: Pill shape? Uppercase PJS? Thin border? Transparent fill?

---

## Reference Files Index

| File | Topic | Read when... |
|------|-------|-------------|
| `references/colors-and-tokens.md` | Full color specs, JSON tokens, CSS/Tailwind | Setting up color system, generating tokens |
| `references/typography.md` | Typefaces, hierarchy, text rules, font paths | Configuring typography, checking text styling |
| `references/logo-usage.md` | Logo suite, clear space, co-branding, animations | Placing logo, choosing version, co-branding |
| `references/imagery-and-shapes.md` | Box frame, expanding shapes, flow, grid, shaders | Creating visuals with brand shapes |
| `references/photography-and-iconography.md` | Photo style, display icons, Phosphor fallback | Selecting photos, choosing icon approach |
| `references/ui-components.md` | Tags, buttons, email signatures, social media | Building UI components, social media assets |
| `references/light-dark-mode.md` | Consolidated light/dark theming guide | Implementing theme switching, CSS variables |
| `references/webgl-hero-shader.md` | WebGL hero shader source, configs, integration | Creating hero sections with procedural animation |

---

## Examples

### Example 1: Landing page hero section

**Request**: "Create a hero section for the A2R website"

**Expected behavior**: Use Silver Gray (`#FBFCFD`) background. Large Display headline in Faculty Glyphic Regular 72px. Overline in Plus Jakarta Sans Medium 18px uppercase. Core Blue CTA button (pill shape, PJS Medium uppercase). LogoMark_SolidBlack in header with clear space. Optional: expanding blue shapes as decorative elements (L-to-R direction). Optional: For an animated WebGL hero background, see `references/webgl-hero-shader.md` for the procedural fluid shader with mouse interaction.

### Example 2: Dark mode dashboard

**Request**: "Generate CSS variables for A2R dark mode"

**Expected behavior**: Reference `references/light-dark-mode.md`. Output `[data-theme="dark"]` block with Solid Black background, Silver Gray primary text, Silver Gray 500 secondary text, Silver Gray 800 borders/grid, Core Blue accent. Note that ghost buttons switch to white border + text.

### Example 3: Social media post with shapes

**Request**: "Design an Instagram post for A2R"

**Expected behavior**: Choose one brand color background (e.g., Core Blue). Add expanding shapes in single color (e.g., blue arrows, L-to-R). Optionally overlay flow texture in lighter tone. Headline in Faculty Glyphic uppercase (2-4 words). Use white text on blue background. Include brand icon (blue bg + white symbol) as profile reference.

---

## Source Traceability

| Skill Section | Brandbook Pages |
|---------------|----------------|
| Brand Identity | pp. 4-7 |
| Logo Usage | pp. 9-17 |
| Colors & Tokens | pp. 19-23 |
| Typography | pp. 25-32 |
| Photography | p. 34 |
| Imagery & Shapes | pp. 36-48 |
| Iconography | pp. 49-51 |
| UI Components (Tags, Buttons) | p. 53 |
| Social Media | p. 54 |
| Email Signatures | p. 55 |
| Light/Dark Mode | Synthesized from pp. 20-21, 29-30, 48 |
| WebGL Hero Shader | A2R website source code (brand-approved implementation) |
