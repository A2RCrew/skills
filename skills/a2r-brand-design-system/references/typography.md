# A2R Typography

> Source: A2R Brandbook pp. 25-32 (June 2025, The Branx Europe S.L.)

## Main Typeface: Faculty Glyphic

- **Style**: Slab-like extensions, strong vertical stress, sharp angular terminals
- **Character**: Refined yet contemporary; geometric clarity and precision
- **Usage**: Titles and display texts only
- **Weights available**: Regular only (single weight maintains visual consistency)
- **License**: SIL Open Font License

### Font file

```
assets/fonts/FacultyGlyphic-Regular.ttf
```

## CSS Variable Naming (Production)

In the A2R website, fonts are registered as CSS custom properties:

```css
--font-display: 'Faculty Glyphic';
--font-sans: 'Plus Jakarta Sans';
```

Usage in Tailwind: `font-display` for Faculty Glyphic, `font-sans` for Plus Jakarta Sans.

## Secondary Typeface: Plus Jakarta Sans

- **Style**: Clean sans-serif, modern, highly legible
- **Character**: Modernity, cleanliness, simplicity
- **Usage**: Body text, overlines, and buttons
- **Weights used**: Extralight, Regular (default), Bold (emphasis)

> **Production note**: The A2R website loads Plus Jakarta Sans weights 200-800 via variable font for full flexibility, though the brand hierarchy primarily uses Extralight (200), Regular (400), Medium (500), and Bold (700).
- **Overlines & buttons**: Always set in UPPERCASE
- **License**: SIL Open Font License

### Font files

```
assets/fonts/PlusJakartaSans/PlusJakartaSans-VariableFont_wght.ttf
assets/fonts/PlusJakartaSans/PlusJakartaSans-Italic-VariableFont_wght.ttf
assets/fonts/PlusJakartaSans/static/PlusJakartaSans-ExtraLight.ttf
assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Regular.ttf
assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Medium.ttf
assets/fonts/PlusJakartaSans/static/PlusJakartaSans-Bold.ttf
assets/fonts/PlusJakartaSans/static/PlusJakartaSans-ExtraBold.ttf
(+ italic variants for each weight)
```

## Typeface Hierarchy

| Level | Font | Weight | Size | Line Height | Notes |
|-------|------|--------|------|-------------|-------|
| Overline | Plus Jakarta Sans | Medium | 18px | 130% | Always UPPERCASE |
| Large Display | Faculty Glyphic | Regular | 72px | 110% | Hero sections, major headlines |
| Title | Faculty Glyphic | Regular | 48px | 130% | Page/section titles |
| Subtitle | Faculty Glyphic | Regular | 24px | 130% | Secondary headings |
| Paragraph | Plus Jakarta Sans | Regular | 20px | 150% | Body text |
| Button & Link | Plus Jakarta Sans | Medium | 20px | — | Always UPPERCASE |

> L = % Line Height. These are reference values to understand the brand hierarchy, not strict web font sizes.

## Typography Tokens (JSON)

```json
{
  "typography": {
    "overline": {
      "fontFamily": "Plus Jakarta Sans",
      "fontWeight": 500,
      "fontSize": "18px",
      "lineHeight": "130%",
      "textTransform": "uppercase"
    },
    "large-display": {
      "fontFamily": "Faculty Glyphic",
      "fontWeight": 400,
      "fontSize": "72px",
      "lineHeight": "110%"
    },
    "title": {
      "fontFamily": "Faculty Glyphic",
      "fontWeight": 400,
      "fontSize": "48px",
      "lineHeight": "130%"
    },
    "subtitle": {
      "fontFamily": "Faculty Glyphic",
      "fontWeight": 400,
      "fontSize": "24px",
      "lineHeight": "130%"
    },
    "paragraph": {
      "fontFamily": "Plus Jakarta Sans",
      "fontWeight": 400,
      "fontSize": "20px",
      "lineHeight": "150%"
    },
    "button": {
      "fontFamily": "Plus Jakarta Sans",
      "fontWeight": 500,
      "fontSize": "20px",
      "textTransform": "uppercase"
    }
  }
}
```

## Heading Defaults (Production)

All headings in the A2R website use:
- `line-height: 130%` (`leading-[130%]`)
- `text-wrap: balance` (`text-balance`)

## Text on Backgrounds

| Background | Text Color | Notes |
|------------|-----------|-------|
| Core Blue (`#2764F4`) | Silver Gray / White | High contrast white text |
| Solid Black (`#111218`) | Silver Gray / White | Light text on dark |
| Silver Gray (`#FBFCFD`) | Solid Black (`#111218`) | Dark text on light |
| Fresh Green (`#A1E8C9`) | Solid Black | Dark text on accent |
| Bright Yellow (`#F7FF8E`) | Solid Black | Dark text on accent |
| Warm Orange (`#FFCDBF`) | Solid Black | Dark text on accent |

## Text Highlighting

Use color to highlight key words. The highlight color must clearly stand out from surrounding text.

- **On Silver Gray background**: Highlight word in Core Blue (`#2764F4`)
- **On Solid Black background**: Highlight word in Core Blue (`#2764F4`)
- **On Core Blue background**: Highlight word in Pure White (`#FFFFFF`)

## Text Alignment

- Preferred: **left-aligned** or **centered**
- Always pursue optimal legibility
- No definitive rule, but avoid right-aligned or justified text

## Use of Uppercase

- **Faculty Glyphic in uppercase**: For short, high-impact headlines (2-4 words). Best for large displays, hero sections, social media posts, bold communications.
  - Examples: "EXPAND HOW YOU LEARN", "A FRAMEWORK FOR GROWTH", "HOW IT WORKS"
- **Plus Jakarta Sans in uppercase**: For overlines and buttons. Adds emphasis and impact.
  - Examples: "A2R LEARNING", "GET A DEMO", "LEARN MORE"
