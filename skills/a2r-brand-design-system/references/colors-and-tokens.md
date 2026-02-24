# A2R Colors and Design Tokens

> Source: A2R Brandbook pp. 19-23 (June 2025, The Branx Europe S.L.)

## Main Colors

| Name | HEX | RGB | CMYK | Role |
|------|------|-----|------|------|
| Core Blue | `#2764F4` | 39, 100, 244 | 84%, 59%, 0%, 4% | Primary brand color; trust, innovation |
| Silver Gray | `#FBFCFD` | 251, 252, 253 | 1%, 0%, 0%, 1% | Light background / base |
| Solid Black | `#111218` | 17, 18, 24 | 29%, 25%, 0%, 91% | Dark background / text |

## Gray Scale

| Name | HEX | RGB | CMYK |
|------|------|-----|------|
| Pure White | `#FFFFFF` | 255, 255, 255 | 0%, 0%, 0%, 0% |
| Silver Gray 200 | `#F1F1F1` | 241, 241, 241 | 0%, 0%, 0%, 5% |
| Silver Gray 300 | `#E6E6E9` | 230, 230, 233 | 1%, 1%, 0%, 9% |
| Silver Gray 500 | `#C6C6CA` | 198, 198, 202 | 2%, 2%, 0%, 21% |
| Silver Gray 800 | `#35363B` | 53, 54, 59 | 10%, 8%, 0%, 77% |

## Extended Gray Scale (Production)

Additional gray values used in the A2R website. These interpolate between the brand book values for finer UI control.

| Name | HEX | Source |
|------|------|--------|
| Silver Gray 400 | `#D0D0D4` | Website production |
| Silver Gray 600 | `#9F9FA4` | Website production |
| Silver Gray 700 | `#6F6F75` | Website production |
| Silver Gray 900 | `#1E1F24` | Website production |
| Silver Gray 950 | `#121316` | Website production |

## Accent Colors

Use sparingly. Maximum ONE accent color per visual to prevent clutter. Exception: attention-grabbing banners may use accents as predominant tones.

| Name | HEX | RGB | CMYK |
|------|------|-----|------|
| Fresh Green | `#A1E8C9` | 161, 232, 201 | 31%, 0%, 13%, 9% |
| Bright Yellow | `#F7FF8E` | 247, 255, 142 | 3%, 0%, 44%, 0% |
| Warm Orange | `#FFCDBF` | 255, 205, 191 | 0%, 20%, 25%, 0% |

## 60-30-10 Rule

Apply to all brand communication: website, landing pages, social media, ads, presentations.

- **60% — Silver Gray** (`#FBFCFD`): backgrounds, base surfaces
- **30% — Core Blue** (`#2764F4`): brand recognition, key sections, CTAs
- **10% — Solid Black** (`#111218`): anchoring, text, contrast elements
- **Accents** (Fresh Green, Bright Yellow, Warm Orange): within the 10% slice, used sparingly

> The brand is understood as lightweight and clear, aiming to facilitate the comprehension of information. Blue enhances brand recognition; Solid Black conveys trustworthiness and experience.

## Color Pairing Matrix

| Background | Primary Text | Accent/Highlight | Logo Version |
|------------|-------------|-------------------|--------------|
| Silver Gray / White | Solid Black | Core Blue | Solid Black |
| Solid Black | Silver Gray / White | Core Blue | Silver Gray / White |
| Core Blue | Silver Gray / White | — | Silver Gray / White |
| Fresh Green | Solid Black | — | Solid Black |
| Bright Yellow | Solid Black | — | Solid Black |
| Warm Orange | Solid Black | — | Solid Black |

## Design Tokens (JSON)

```json
{
  "color": {
    "core-blue": { "value": "#2764F4" },
    "silver-gray": { "value": "#FBFCFD" },
    "solid-black": { "value": "#111218" },
    "pure-white": { "value": "#FFFFFF" },
    "silver-gray-200": { "value": "#F1F1F1" },
    "silver-gray-300": { "value": "#E6E6E9" },
    "silver-gray-400": { "value": "#D0D0D4" },
    "silver-gray-500": { "value": "#C6C6CA" },
    "silver-gray-600": { "value": "#9F9FA4" },
    "silver-gray-700": { "value": "#6F6F75" },
    "silver-gray-800": { "value": "#35363B" },
    "silver-gray-900": { "value": "#1E1F24" },
    "silver-gray-950": { "value": "#121316" },
    "fresh-green": { "value": "#A1E8C9" },
    "bright-yellow": { "value": "#F7FF8E" },
    "warm-orange": { "value": "#FFCDBF" }
  }
}
```

## CSS Custom Properties

```css
:root {
  --a2r-core-blue: #2764F4;
  --a2r-silver-gray: #FBFCFD;
  --a2r-solid-black: #111218;
  --a2r-pure-white: #FFFFFF;
  --a2r-silver-gray-200: #F1F1F1;
  --a2r-silver-gray-300: #E6E6E9;
  --a2r-silver-gray-500: #C6C6CA;
  --a2r-silver-gray-800: #35363B;
  --a2r-fresh-green: #A1E8C9;
  --a2r-bright-yellow: #F7FF8E;
  --a2r-warm-orange: #FFCDBF;
}
```

## Tailwind Config Snippet

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'a2r-blue': '#2764F4',
        'a2r-silver': '#FBFCFD',
        'a2r-black': '#111218',
        'a2r-white': '#FFFFFF',
        'a2r-silver-200': '#F1F1F1',
        'a2r-silver-300': '#E6E6E9',
        'a2r-silver-500': '#C6C6CA',
        'a2r-silver-800': '#35363B',
        'a2r-green': '#A1E8C9',
        'a2r-yellow': '#F7FF8E',
        'a2r-orange': '#FFCDBF',
      },
    },
  },
};
```

## Tailwind v4 Theme Block

For Tailwind v4 projects using CSS-first configuration with `@theme`:

```css
@theme {
  --color-primary: #2764f4;
  --color-gray-200: #f1f1f1;
  --color-gray-300: #e6e6e9;
  --color-gray-400: #d0d0d4;
  --color-gray-500: #c6c6ca;
  --color-gray-600: #9f9fa4;
  --color-gray-700: #6f6f75;
  --color-gray-800: #35363b;
  --color-gray-900: #1e1f24;
  --color-gray-950: #121316;
  --color-background: #fbfcfd;
  --color-foreground: #111218;
  --color-accent-green: #a1e8c9;
  --color-accent-yellow: #f7ff8e;
  --color-accent-orange: #ffcdbf;
}
```
