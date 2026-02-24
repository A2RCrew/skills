# A2R Imagery and Shapes

> Source: A2R Brandbook pp. 36-48 (June 2025, The Branx Europe S.L.)

## The Box Frame

A core element of A2R's visual language. Inspired by the editing frame used to select text.

**Composition**: 4 square nodes (corners) + an outline box connecting them.

**Usage**:
- Framing key elements: copy, images, brand shapes
- Anchor in presentations and bullet points
- Symbolizes precision and adaptability

### Box Frame Grid System

| Orientation | Columns | Gutter |
|-------------|---------|--------|
| Vertical | 4 columns | = size of Box Frame node |
| Horizontal | 8 columns | = size of Box Frame node |

**Margin**: Maintain a clear margin of **2X** around the Box Frame, where X is the size of the node.

## Expanding Geometric Shapes

Dynamic shapes representing expansion and evolution of learning. Three families, each with 6 expansion steps (1 = smallest, 6 = largest), available in 5 colors.

### Shape Families

| Family | Description | Visual |
|--------|-------------|--------|
| **Arrows** | Triangular/arrow-like forms expanding | Chevron-like progressions |
| **Rectangles** | Rectangular forms expanding | Block/square progressions |
| **Ellipses** | Oval/circular forms expanding | Elliptical progressions |

### Available Colors

Each family × 6 steps × 5 colors = 30 SVG + 60 PNG variants.

| Color | Asset prefix |
|-------|-------------|
| Black | `ExpandingShapeBlack` |
| Blue | `ExpandingShapeBlue` |
| Green | `ExpandingShapeGreen` |
| Orange | `ExpandingShapeOrange` |
| Yellow | `ExpandingShapeYellow` |

### Direction Rules

- **Left-to-right**: Reflect natural reading progression (primary)
- **Top-to-bottom**: Vertical layouts (secondary)
- **Mirror/center**: Expansion from the center outward (alternative)
- **NEVER big-to-small** (right-to-left contraction)
- Maintain consistent direction within a single composition

### Flexibility

Shapes adapt to the space they occupy. They must:
- Always feel dynamic and in harmony with the design
- **Maintain smoothness** — avoid making them too edgy
- NOT be stretched too thin or disproportionately

## Flow Shapes

Abstract, fluid shapes symbolizing the adaptable and dynamic nature of A2R's technology.

### Key Rules

- Designed in brand colors but with a **subtly lighter and brighter tone**
- **NEVER use flow shapes alone** — always combine with geometric expanding shapes
- Can be used as background or integrated within geometric patterns

### Available Flow Colors

| Color | Files |
|-------|-------|
| Black | `FlowBlack1.png` — `FlowBlack3.png` |
| Blue | `FlowBlue1.png` — `FlowBlue3.png` |
| Green | `FlowGreen1.png` — `FlowGreen3.png` |
| Orange | `FlowOrange1.png` — `FlowOrange3.png` |
| Yellow | `FlowYellow1.png` — `FlowYellow3.png` |

## Geometric + Flow Combined

The best visual expression combines both shape types.

### Recommendations

- **Color combinations must be monochromatic** to maintain visual harmony
- **Flow shapes should be in a lighter tone** than geometric shapes (creates depth and contrast)
- **Animated flow shapes**: Use moderate speed for fluidity and smoothness
- **Integration options**: Flow as background, OR flow integrated within geometric shape patterns

### Integrated Shape Assets

Pre-combined geometric + flow shapes (6 designs, each with @2x variant):
```
assets/shapes/integrated/Integrated shape 1.png — Integrated shape 6.png
assets/shapes/integrated/Integrated shape 1@2x.png — Integrated shape 6@2x.png
```

## Shaders (shaders.a2r.studio)

Four preset configurations for the interactive shader tool:

### Preset 1: Core Blue + Square
```json
{
  "effect": "effect5",
  "backgroundColor": "#2764f4",
  "highlightColor": "#739AF8",
  "horizontalElements": 12,
  "verticalElements": 2,
  "expansionRatio": 1.5,
  "gridPattern": "squares",
  "frostedGlass": true,
  "shapeColor": "#000000"
}
```

### Preset 2: Solid Black + Ellipses
```json
{
  "effect": "effect6",
  "backgroundColor": "#111218",
  "highlightColor": "#525259",
  "horizontalElements": 6,
  "verticalElements": 1,
  "expansionRatio": 1.52,
  "gridPattern": "ellipses",
  "frostedGlass": true,
  "shapeColor": "#000000"
}
```

### Preset 3: Yellow Bright + Square
```json
{
  "effect": "effect8",
  "backgroundColor": "#F7FF8E",
  "highlightColor": "#f7f18e",
  "horizontalElements": 12,
  "verticalElements": 2,
  "expansionRatio": 1.27,
  "gridPattern": "squares",
  "forceShapeColor": true,
  "shapeColor": "#f7f18e"
}
```

### Preset 4: Fresh Green + Trapezium
```json
{
  "effect": "effect6",
  "backgroundColor": "#111218",
  "highlightColor": "#525259",
  "horizontalElements": 6,
  "verticalElements": 1,
  "expansionRatio": 1.52,
  "gridPattern": "ellipses",
  "frostedGlass": true,
  "shapeColor": "#000000"
}
```

## Usage DON'Ts

1. **No multi-color shapes** — avoid using multiple colors within brand shapes
2. **No gradients, textures, or effects** on expanding shapes — keep them flat
3. **Ensure text legibility** — adjust contrast or placement when text overlays shapes
4. **Consistent expansion direction** — always L-to-R and T-to-B within a composition
5. **No thin/stretched shapes** — maintain smoothness and proportion
6. **Never big-to-small** — shapes must always expand, never contract

## Grid

Notebook-inspired grid pattern for backgrounds. Provides subtle visual structure.

| Mode | Grid Line Color | Background Color |
|------|----------------|-----------------|
| Light | Silver Gray 300 (`#E6E6E9`) | Silver Gray (`#FBFCFD`) |
| Dark | Silver Gray 800 (`#35363B`) | Solid Black (`#111218`) |

Use with discretion. The grid provides order and rhythm without overwhelming content.

## Shape Asset Paths

### Expanding Shapes — SVG
```
assets/shapes/expanding/svg/ExpandingShape{Color}{1-6}.svg
```
(30 files: 5 colors × 6 steps)

### Expanding Shapes — PNG
```
assets/shapes/expanding/png/ExpandingShape{Color}{1-6}.png
```
(60 files: 5 colors × 6 steps × 2 — some @2x variants)

### Flow Shapes
```
assets/shapes/flow/Flow{Color}{1-3}.png
```
(15+ files: 5 colors × 3 variants)

### Integrated Shapes
```
assets/shapes/integrated/Integrated shape {1-6}.png
assets/shapes/integrated/Integrated shape {1-6}@2x.png
```
(12 files)
