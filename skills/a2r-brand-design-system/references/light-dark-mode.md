# A2R Light/Dark Mode Theming Guide

> Consolidated from: A2R Brandbook pp. 20-21 (colors), 29-30 (text on backgrounds), 48 (grid)
> June 2025, The Branx Europe S.L.

## Light Mode

| Element | Value | Token |
|---------|-------|-------|
| Background | Silver Gray `#FBFCFD` or Pure White `#FFFFFF` | `--a2r-bg` |
| Primary text | Solid Black `#111218` | `--a2r-text-primary` |
| Secondary text | Silver Gray 800 `#35363B` | `--a2r-text-secondary` |
| Grid lines | Silver Gray 300 `#E6E6E9` | `--a2r-grid` |
| Borders / dividers | Silver Gray 300 `#E6E6E9` or Silver Gray 500 `#C6C6CA` | `--a2r-border` |
| Logo version | Solid Black (`*_SolidBlack`) | — |
| Accent highlight | Core Blue `#2764F4` | `--a2r-accent` |
| Surface (cards) | Pure White `#FFFFFF` or Silver Gray 200 `#F1F1F1` | `--a2r-surface` |

## Dark Mode

| Element | Value | Token |
|---------|-------|-------|
| Background | Solid Black `#111218` | `--a2r-bg` |
| Primary text | Silver Gray `#FBFCFD` or Pure White `#FFFFFF` | `--a2r-text-primary` |
| Secondary text | Silver Gray 500 `#C6C6CA` | `--a2r-text-secondary` |
| Grid lines | Silver Gray 800 `#35363B` | `--a2r-grid` |
| Borders / dividers | Silver Gray 800 `#35363B` | `--a2r-border` |
| Logo version | Silver Gray or White (`*_White`) | — |
| Accent highlight | Core Blue `#2764F4` | `--a2r-accent` |
| Surface (cards) | Silver Gray 800 `#35363B` | `--a2r-surface` |

## Both Modes (Invariant)

- **Core Blue** (`#2764F4`) works as accent/highlight in both modes
- **Accent color backgrounds** (Fresh Green, Bright Yellow, Warm Orange) always use **Solid Black text**
- **Buttons** are mode-independent: Black fill, Blue fill, or Ghost outlined style
- **Display icons**: Use Solid Black variant in light mode, White variant in dark mode

## CSS Custom Properties (Mode-Aware)

```css
:root {
  /* Light mode (default) */
  --a2r-bg: #FBFCFD;
  --a2r-text-primary: #111218;
  --a2r-text-secondary: #35363B;
  --a2r-grid: #E6E6E9;
  --a2r-border: #E6E6E9;
  --a2r-surface: #FFFFFF;
  --a2r-accent: #2764F4;
}

[data-theme="dark"] {
  --a2r-bg: #111218;
  --a2r-text-primary: #FBFCFD;
  --a2r-text-secondary: #C6C6CA;
  --a2r-grid: #35363B;
  --a2r-border: #35363B;
  --a2r-surface: #35363B;
  --a2r-accent: #2764F4;
}
```

## Component-Level Switching

| Component | Light Mode | Dark Mode |
|-----------|-----------|-----------|
| Page background | `#FBFCFD` | `#111218` |
| Card surface | `#FFFFFF` | `#35363B` |
| Primary text | `#111218` | `#FBFCFD` |
| Secondary text | `#35363B` | `#C6C6CA` |
| Borders | `#E6E6E9` | `#35363B` |
| Grid overlay | `#E6E6E9` on `#FBFCFD` | `#35363B` on `#111218` |
| Logo | `*_SolidBlack` | `*_White` |
| Display icons | Solid Black SVG/PNG | White PNG |
| Accent (links, highlights) | `#2764F4` | `#2764F4` |
| Tag border | `#111218` | `#FBFCFD` |
| Button (primary black) | Black fill, white text | Black fill, white text |
| Button (primary blue) | Blue fill, white text | Blue fill, white text |
| Button (ghost) | Black border + text | White border + text |

## Decision Tree: When to Use Which Mode

| Context | Mode |
|---------|------|
| Web application / SaaS | Support BOTH (user preference or OS setting) |
| Marketing website | Support BOTH or light-only |
| Print materials | Light mode only |
| Email signatures | Light mode only |
| Social media posts | Either (match platform context) |
| Presentations | Match audience/venue (default: light) |
