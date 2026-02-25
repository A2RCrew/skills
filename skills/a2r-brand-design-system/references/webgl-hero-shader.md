# A2R WebGL Hero Shader Reference

> Source: A2R website source code (brand-approved canonical implementation)

## When to Use

- Building an A2R hero section with animated background
- Creating procedural WebGL backgrounds
- Replicating the fluid animation effect with mouse interaction
- Implementing route-based color transitions

## Architecture Overview

- **Raw WebGL** (no Three.js dependency) — WebGL2 with WebGL1 fallback
- **Custom GLSL shaders** — procedural animation, no textures required
- **React hook** (`useShader`) for lifecycle management
- **Full-screen quad** rendered via `TRIANGLE_STRIP` with 4 vertices
- **Performance**: renders at half resolution (`RESOLUTION_GRAIN = 2`)

---

## Source Code

All code blocks below are **verbatim canonical implementations**. Copy them exactly — do not summarize, paraphrase, or modify.

### 1. Fragment Shader (`fragmentShader.frag`)

```glsl
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color_multiplier;
uniform vec3 u_color_addition;
uniform vec2 u_mouse;
uniform vec2 u_mouse_trail[15];
uniform float u_trail_times[15];
uniform int u_trail_length;

float tanh(float x) {
    x = clamp(x, -10.0, 10.0);
    float ex = exp(2.0 * x);
    return (ex - 1.0) / (ex + 1.0);
}

vec2 tanh(vec2 v) {
    return vec2(tanh(v.x), tanh(v.y));
}

void main() {
    vec4 o;
    vec2 u = gl_FragCoord.xy;

    vec2 v = u_resolution;
    u = .15 * (u + u - v) / v.y;
    vec4 z = o = vec4(0.152, 0.39, 0.95, 0.2);

    vec2 mouse = (u_mouse - u_resolution * 0.5) / u_resolution.y * 0.3;
    float mouseDistance = length(u - mouse);

    vec2 mouseScreen = u_mouse;
    float mouseScreenDistance = length(gl_FragCoord.xy - mouseScreen);

    vec2 fluidDisplacement = vec2(0.0);

    vec2 toMouse = mouse - u;
    float swirl = exp(-mouseDistance * 4.0) * 0.15;
    fluidDisplacement += vec2(-toMouse.y, toMouse.x) * swirl;

    vec2 radialPush = normalize(u - mouse) * exp(-mouseDistance * 3.5) * 0.12;
    fluidDisplacement += radialPush;

    for(int i = 0; i < 12; i++) {
        if(i >= u_trail_length) break;

        vec2 trailPos = (u_mouse_trail[i] - u_resolution * 0.5) / u_resolution.y * 0.3;
        float trailDistance = length(u - trailPos);
        float trailAge = (u_time * 1000.0 - u_trail_times[i]) / 3000.0;

        if(trailAge < 1.0 && trailAge > 0.0 && trailDistance < 1.2) {
            vec2 trailDirection = vec2(0.0);
            if(i > 0 && i < u_trail_length) {
                vec2 prevPos = (u_mouse_trail[i-1] - u_resolution * 0.5) / u_resolution.y * 0.3;
                trailDirection = normalize(trailPos - prevPos);
            }

            float ageDecay = 1.0 - smoothstep(0.0, 1.0, trailAge);
            float distanceDecay = exp(-trailDistance * 2.5);
            float trailIntensity = ageDecay * distanceDecay * 0.08;

            fluidDisplacement += trailDirection * trailIntensity;

            vec2 toTrail = trailPos - u;
            float miniSwirl = exp(-trailDistance * 4.0) * trailIntensity * 0.4;
            fluidDisplacement += vec2(-toTrail.y, toTrail.x) * miniSwirl;
        }
    }

    float a = 0.2;
    float t = u_time;

    for(float i = 1.0; i < 22.0; i++) {
        v = cos(++t - 7. * u * pow(a += .03, i)) - 5. * u;

        float fluidFactor = 1.0 / (1.0 + i * 0.15);
        u += fluidDisplacement * fluidFactor * 0.1;

        u += tanh(40. * dot(u *= mat2(cos(i + .02 * t - vec4(0, 11, 33, 0))), u) * cos(1e2 * u.yx + t)) / 2e2 + .2 * a * u + cos(4. / exp(dot(o, o) / 1e2) + t) / 3e2;
        o += (1. + cos(z + t)) / length((1. + i * dot(v, v)) * sin(1.5 * u / (.5 - dot(u, u)) - 9. * u.yx + t));
    }

    o = 16.0 / (min(o, 13.) + 164. / o) - dot(u, u) / 250.;

    float glowDistance = mouseScreenDistance / max(u_resolution.x, u_resolution.y);

    float coreGlow = exp(-glowDistance * 200.0) * 0.4;
    float outerGlow = exp(-glowDistance * 80.0) * 0.2;
    float pulse = 1.0 + sin(u_time * 2.5) * 0.3;
    float totalGlow = (coreGlow + outerGlow) * pulse;

    o += vec4(totalGlow * 0.7, totalGlow * 0.8, totalGlow * 1.2, 0.0);

    for(int i = 0; i < 10; i++) {
        if(i >= u_trail_length) break;

        vec2 trailPos = (u_mouse_trail[i] - u_resolution * 0.5) / u_resolution.y * 0.3;
        float trailDistance = length(u - trailPos);
        float trailAge = (u_time * 1000.0 - u_trail_times[i]) / 3000.0;

        if(trailAge < 1.0 && trailAge > 0.0) {
            float wavePhase = trailDistance * 8.0 - (u_time - u_trail_times[i] / 1000.0) * 2.0;
            float wave = sin(wavePhase) * (1.0 - trailAge) * exp(-trailDistance * 3.0) * 0.02;

            o += vec4(wave * 0.4, wave * 0.6, wave * 1.0, 0.0);
        }
    }

    o.rgb = o.rgb * u_color_multiplier + u_color_addition;
    gl_FragColor = o;
}
```

### 2. Vertex Shader (`vertexShader.vert`)

```glsl
attribute vec4 a_position;
void main() {
    gl_Position = a_position;
}
```

### 3. `useShader` Hook (`useShader.ts`)

```typescript
'use client';

import { useEffect, useRef, useCallback, type RefObject } from 'react';

interface ShaderOptions {
  vertexSource: string;
  fragmentSource: string;
  colorMultiplier?: [number, number, number];
  colorAddition?: [number, number, number];
}

interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const TRAIL_LENGTH = 15;
const TRAIL_MAX_AGE_MS = 3000;
const LERP_FACTOR = 0.05;
const RESOLUTION_GRAIN = 2;
const DEFAULT_BG_HEX = '#2764F4';

export function useShader(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options?: ShaderOptions,
) {
  const rafRef = useRef<number>(0);
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);

  const trailRef = useRef<TrailPoint[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const targetColorMultiplier = useRef<[number, number, number]>(
    options?.colorMultiplier ?? [1, 1, 1],
  );
  const currentColorMultiplier = useRef<[number, number, number]>(
    options?.colorMultiplier ?? [1, 1, 1],
  );

  const targetColorAddition = useRef<[number, number, number]>(
    options?.colorAddition ?? [0, 0, 0],
  );
  const currentColorAddition = useRef<[number, number, number]>(
    options?.colorAddition ?? [0, 0, 0],
  );

  const targetBgColor = useRef<[number, number, number]>(hexToRgb(DEFAULT_BG_HEX));
  const currentBgColor = useRef<[number, number, number]>(hexToRgb(DEFAULT_BG_HEX));

  const updateColors = useCallback(
    (multiplier?: [number, number, number], addition?: [number, number, number]) => {
      if (multiplier) targetColorMultiplier.current = multiplier;
      if (addition) targetColorAddition.current = addition;
    },
    [],
  );

  const updateBackgroundColor = useCallback((hex: string) => {
    targetBgColor.current = hexToRgb(hex);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const contextAttributes: WebGLContextAttributes = {
      antialias: false,
      alpha: true,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: true,
      desynchronized: false,
      powerPreference: 'default',
      failIfMajorPerformanceCaveat: false,
    };

    let gl: WebGLRenderingContext | WebGL2RenderingContext | null =
      canvas.getContext('webgl2', contextAttributes) as WebGL2RenderingContext | null;
    if (!gl) {
      gl = canvas.getContext('webgl', contextAttributes) as WebGLRenderingContext | null;
    }
    if (!gl) return;

    glRef.current = gl;

    function compileShader(
      context: WebGLRenderingContext | WebGL2RenderingContext,
      type: number,
      source: string,
    ): WebGLShader | null {
      const shader = context.createShader(type);
      if (!shader) return null;
      context.shaderSource(shader, source);
      context.compileShader(shader);
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
        console.error('Shader compile error:', context.getShaderInfoLog(shader));
        context.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexSource = options?.vertexSource ?? '';
    const fragmentSource = options?.fragmentSource ?? '';

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uColorMultiplier = gl.getUniformLocation(program, 'u_color_multiplier');
    const uColorAddition = gl.getUniformLocation(program, 'u_color_addition');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uMouseTrail = gl.getUniformLocation(program, 'u_mouse_trail');
    const uTrailTimes = gl.getUniformLocation(program, 'u_trail_times');
    const uTrailLength = gl.getUniformLocation(program, 'u_trail_length');

    function resize() {
      if (!canvas || !gl) return;
      const { clientWidth, clientHeight } = canvas;
      const w = Math.floor(clientWidth / RESOLUTION_GRAIN);
      const h = Math.floor(clientHeight / RESOLUTION_GRAIN);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    resize();

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);

    const lastClientPos = { x: 0, y: 0 };

    function updateMouseFromClient(clientX: number, clientY: number, addTrail: boolean) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / RESOLUTION_GRAIN;
      const y = (rect.height - (clientY - rect.top)) / RESOLUTION_GRAIN;
      mouseRef.current = { x, y };

      if (addTrail) {
        const currentTime = Date.now();
        trailRef.current.push({ x, y, time: currentTime });
        if (trailRef.current.length > TRAIL_LENGTH) {
          trailRef.current.shift();
        }
        trailRef.current = trailRef.current.filter(
          (point) => currentTime - point.time < TRAIL_MAX_AGE_MS,
        );
      }
    }

    function onMouseMove(e: MouseEvent) {
      lastClientPos.x = e.clientX;
      lastClientPos.y = e.clientY;
      updateMouseFromClient(e.clientX, e.clientY, true);
    }

    function onScroll() {
      updateMouseFromClient(lastClientPos.x, lastClientPos.y, false);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll, { passive: true });

    function render() {
      if (!gl || !program) return;

      for (let i = 0; i < 3; i++) {
        currentColorMultiplier.current[i] = lerp(
          currentColorMultiplier.current[i],
          targetColorMultiplier.current[i],
          LERP_FACTOR,
        );
        currentColorAddition.current[i] = lerp(
          currentColorAddition.current[i],
          targetColorAddition.current[i],
          LERP_FACTOR,
        );
        currentBgColor.current[i] = lerp(
          currentBgColor.current[i],
          targetBgColor.current[i],
          LERP_FACTOR,
        );
      }

      gl.clearColor(
        currentBgColor.current[0],
        currentBgColor.current[1],
        currentBgColor.current[2],
        1.0,
      );
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      if (uResolution) {
        gl.uniform2f(uResolution, canvas!.width, canvas!.height);
      }
      if (uTime) {
        gl.uniform1f(uTime, performance.now() * 0.0005);
      }
      if (uColorMultiplier) {
        gl.uniform3fv(uColorMultiplier, currentColorMultiplier.current);
      }
      if (uColorAddition) {
        gl.uniform3fv(uColorAddition, currentColorAddition.current);
      }
      if (uMouse) {
        gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      }

      const trailPositions = new Float32Array(TRAIL_LENGTH * 2);
      const trailTimes = new Float32Array(TRAIL_LENGTH);
      const activeLength = Math.min(trailRef.current.length, TRAIL_LENGTH);

      for (let i = 0; i < activeLength; i++) {
        const point = trailRef.current[i];
        trailPositions[i * 2] = point.x;
        trailPositions[i * 2 + 1] = point.y;
        trailTimes[i] = point.time;
      }

      if (uMouseTrail) {
        gl.uniform2fv(uMouseTrail, trailPositions);
      }
      if (uTrailTimes) {
        gl.uniform1fv(uTrailTimes, trailTimes);
      }
      if (uTrailLength) {
        gl.uniform1i(uTrailLength, activeLength);
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (!prefersReducedMotion) {
        rafRef.current = requestAnimationFrame(render);
      }
    }

    if (prefersReducedMotion) {
      render();
    } else {
      rafRef.current = requestAnimationFrame(render);
    }

    function onContextLost(e: Event) {
      e.preventDefault();
      cancelAnimationFrame(rafRef.current);
    }

    function onContextRestored() {
      if (!prefersReducedMotion) {
        rafRef.current = requestAnimationFrame(render);
      }
    }

    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      resizeObserver.disconnect();

      if (gl) {
        if (buffer) gl.deleteBuffer(buffer);
        if (vertexShader) gl.deleteShader(vertexShader);
        if (fragmentShader) gl.deleteShader(fragmentShader);
        if (program) gl.deleteProgram(program);
      }

      glRef.current = null;
      programRef.current = null;
    };
  }, [canvasRef, options?.vertexSource, options?.fragmentSource]);

  return { updateColors, updateBackgroundColor };
}
```

### 4. `WebGLHero` Component (`WebGLHero.tsx`)

```tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { useShader } from './useShader';
import vertexShader from '@/shaders/hero/vertexShader.vert';
import fragmentShader from '@/shaders/hero/fragmentShader.frag';

interface WebGLHeroProps {
  overline?: string;
  headline?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

export function WebGLHero({
  overline = 'BRAND VOICE GUIDE',
  headline = 'The voice behind A2R',
  subtitle = 'A living guide to how we write, speak, and sound — across every channel, audience, and moment.',
  ctaLabel,
  ctaHref,
  className,
}: WebGLHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    function onChange(e: MediaQueryListEvent) {
      setReducedMotion(e.matches);
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useShader(canvasRef, {
    vertexSource: vertexShader,
    fragmentSource: fragmentShader,
  });

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) {
      setShowFallback(true);
      return;
    }
    const gl =
      canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      setShowFallback(true);
    }
  }, [reducedMotion]);

  const shouldShowCanvas = !showFallback && !reducedMotion;

  return (
    <section
      className={cn(
        'relative flex min-h-screen items-center justify-center overflow-hidden',
        className,
      )}
      style={{ backgroundColor: '#2764F4' }}
    >
      {shouldShowCanvas && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-0 h-full w-full opacity-50"
          aria-hidden="true"
        />
      )}

      {(showFallback || reducedMotion) && (
        <div
          className="absolute inset-0 z-0 bg-gradient-to-br from-[#2764F4] via-[#1e50c8] to-[#162d6b]"
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        {overline && (
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/90">
            {overline}
          </p>
        )}

        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          {headline}
        </h1>

        {subtitle && (
          <p className="mt-6 text-lg leading-relaxed text-white/90 sm:text-xl">
            {subtitle}
          </p>
        )}

        {ctaLabel && (
          <div className="mt-10">
            {ctaHref ? (
              <a
                href={ctaHref}
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 py-3 text-sm font-normal uppercase tracking-wide text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {ctaLabel}
              </a>
            ) : (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 py-3 text-sm font-normal uppercase tracking-wide text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {ctaLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
```

### 5. TypeScript Declarations (`types.d.ts`)

```typescript
declare module '*.frag' {
  const value: string;
  export default value;
}

declare module '*.vert' {
  const value: string;
  export default value;
}

declare module '*.glsl' {
  const value: string;
  export default value;
}
```

### 6. Next.js Config for Shader Loading

```typescript
// next.config.ts
turbopack: {
  rules: {
    '*.{glsl,vs,fs,vert,frag}': {
      loaders: ['raw-loader'],
      as: '*.js',
    },
  },
},
// Also add webpack fallback:
webpack: (config) => {
  config.module.rules.push({
    test: /\.(glsl|vs|fs|vert|frag)$/,
    use: ['raw-loader'],
  });
  return config;
},
```

---

## Critical Replication Rules

These rules **MUST** be followed for the shader to look identical to the canonical implementation. If any rule is violated, the visual result will differ.

### Background and Opacity

- The `<section>` **MUST** have `style={{ backgroundColor: '#2764F4' }}` as an inline style (not a CSS class)
- The `<canvas>` **MUST** have the class `opacity-50` (50% opacity)
- This creates the correct visual effect: Core Blue background blends with the procedural shader animation at 50%
- Without `opacity-50`, the shader is too intense and dark
- Without the `#2764F4` background, transparent shader regions show the body color

### WebGL Context Attributes

- `alpha: true` — **MANDATORY**. Allows the canvas to be semi-transparent and show the section background
- `preserveDrawingBuffer: true` — **MANDATORY** for mobile stability
- `antialias: false` — performance optimization
- `depth: false`, `stencil: false` — not needed for a 2D quad

### Mouse Tracking

- The `mousemove` listener is registered on **`window`**, NOT on the canvas. This is **CRITICAL** because the content (`z-10`) is above the canvas (`z-0`), and if the listener were on the canvas, it would not receive mouse events
- Y coordinates are **INVERTED**: `y = (rect.height - (clientY - rect.top)) / RESOLUTION_GRAIN` — WebGL has Y=0 at the bottom, the browser has Y=0 at the top
- Coordinates are **DIVIDED** by `RESOLUTION_GRAIN` (2) because the canvas renders at half resolution
- A `lastClientPos` is maintained to recalculate mouse position on scroll events without the user having moved the mouse

### Resolution

- `RESOLUTION_GRAIN = 2`: the canvas renders at half CSS resolution (`clientWidth / 2`, `clientHeight / 2`)
- `devicePixelRatio` is **NOT** used — only CSS space
- `ResizeObserver` is used for resizing, not the `resize` event

### Time

- `performance.now() * 0.0005` — converts milliseconds to "slow seconds" so the animation is smooth, not frenetic

### Trail (Mouse Wake)

- Maximum 15 points stored
- Points expire after 3000ms
- `Date.now()` for timestamps (epoch milliseconds), **NOT** `performance.now()`
- The shader receives timestamps as float via `u_trail_times`

### Fallback

- If WebGL is unavailable OR the user has `prefers-reduced-motion: reduce`, a static CSS gradient is shown: `bg-gradient-to-br from-[#2764F4] via-[#1e50c8] to-[#162d6b]`
- With `prefers-reduced-motion`, a single frame of the shader is rendered and animation stops

### Z-index

- Canvas: `z-0` (background)
- Content: `z-10` (foreground)
- Section: `overflow-hidden` to prevent canvas overflow

---

## Recommended File Structure

```
src/
├── shaders/
│   ├── hero/
│   │   ├── fragmentShader.frag
│   │   └── vertexShader.vert
│   └── types.d.ts
├── components/
│   └── hero/
│       ├── WebGLHero.tsx
│       └── useShader.ts
```

---

## Route-Based Color Presets

From `src/lib/shaderConfigs.ts`:

```typescript
interface ShaderConfig {
  backgroundColor: string;
  colorMultiplier: [number, number, number];
  colorAddition: [number, number, number];
}
```

| Route | colorMultiplier | colorAddition | Visual Effect |
|-------|----------------|---------------|---------------|
| `default` (home) | `[1, 1, 1]` | `[0, 0, 0]` | Core Blue base (identity) |
| `projects` | `[0.54, 1.01, 0.42]` | `[0, 0, 0]` | Green tint |
| `solutions` | `[1.08, 1.1, 0.42]` | `[0, 0, 0]` | Yellow tint |
| `technology` | `[0.0, 1.13, 2.0]` | `[0, 0, 0]` | Cyan/teal tint |
| `about` | `[1, 0.482, 0.368]` | `[0, 0, 0]` | Orange/warm tint |

All routes share `backgroundColor: '#2764f4'` (Core Blue). The hero background color is the **same in light and dark mode** — it does not change with theme.

---

## Default Shader Settings (Home Page)

These are the initial values used on the home/index route. Always use these as the starting point:

```typescript
{
  backgroundColor: '#2764f4',       // Core Blue — section background
  colorMultiplier: [1, 1, 1],       // No color shift (identity)
  colorAddition: [0, 0, 0],         // No color offset
}
```

The shader's base color palette (blues encoded in the fragment shader's `vec4 z = o = vec4(0.152, 0.39, 0.95, 0.2)`) combined with `colorMultiplier: [1,1,1]` produces the brand's signature blue fluid animation.

---

## Implementation Checklist

To replicate the A2R hero shader in a new project:

1. [ ] Copy all 6 source files exactly as shown above (no modifications)
2. [ ] Install `raw-loader` and configure both Turbopack and webpack for `.frag`/`.vert` imports
3. [ ] Add `types.d.ts` so TypeScript recognizes shader imports
4. [ ] Set `style={{ backgroundColor: '#2764F4' }}` on the `<section>` (inline, not CSS class)
5. [ ] Add `opacity-50` class to the `<canvas>` element
6. [ ] Verify WebGL context uses `alpha: true` and `preserveDrawingBuffer: true`
7. [ ] Confirm mouse listener is on `window`, not on the canvas
8. [ ] Confirm Y-axis inversion and `RESOLUTION_GRAIN` division in mouse coordinates
9. [ ] Verify `ResizeObserver` is used (not window `resize` event)
10. [ ] Define route-based `ShaderConfig` presets (or use single default)
11. [ ] Wire `updateColors()` to route changes for smooth color transitions
12. [ ] Test reduced-motion fallback (single frame + gradient)
13. [ ] Test on mobile — ensure no flickering (`preserveDrawingBuffer: true`)
14. [ ] Handle WebGL context loss/restoration events
