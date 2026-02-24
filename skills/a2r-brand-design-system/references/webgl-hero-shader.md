# A2R WebGL Hero Shader Reference

> Source: A2R website source code (brand-approved implementation)

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
- **Performance**: renders at half resolution (`resolutionGrain = 2`)

---

## Fragment Shader

135-line GLSL shader implementing procedural fluid dynamics with mouse interaction.

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

    // Fluid displacement system
    vec2 mouse = (u_mouse - u_resolution * 0.5) / u_resolution.y * 0.3;
    float mouseDistance = length(u - mouse);

    // Cursor coordinates in fragment space (unnormalized for glow)
    vec2 mouseScreen = u_mouse;
    float mouseScreenDistance = length(gl_FragCoord.xy - mouseScreen);

    // Fluid velocity field based on mouse
    vec2 fluidDisplacement = vec2(0.0);

    // Swirl effect around cursor (subtle)
    vec2 toMouse = mouse - u;
    float swirl = exp(-mouseDistance * 4.0) * 0.15;
    fluidDisplacement += vec2(-toMouse.y, toMouse.x) * swirl;

    // Radial push from cursor (subtle)
    vec2 radialPush = normalize(u - mouse) * exp(-mouseDistance * 3.5) * 0.12;
    fluidDisplacement += radialPush;

    // Mouse trail wake effect (visible and persistent)
    for(int i = 0; i < 12; i++) {
        if(i >= u_trail_length) break;

        vec2 trailPos = (u_mouse_trail[i] - u_resolution * 0.5) / u_resolution.y * 0.3;
        float trailDistance = length(u - trailPos);
        float trailAge = (u_time * 1000.0 - u_trail_times[i]) / 3000.0; // 3s duration

        if(trailAge < 1.0 && trailAge > 0.0 && trailDistance < 1.2) {
            // Create current in movement direction
            vec2 trailDirection = vec2(0.0);
            if(i > 0 && i < u_trail_length) {
                vec2 prevPos = (u_mouse_trail[i-1] - u_resolution * 0.5) / u_resolution.y * 0.3;
                trailDirection = normalize(trailPos - prevPos);
            }

            // Intensity decays smoothly with time and distance
            float ageDecay = 1.0 - smoothstep(0.0, 1.0, trailAge);
            float distanceDecay = exp(-trailDistance * 2.5);
            float trailIntensity = ageDecay * distanceDecay * 0.08;

            fluidDisplacement += trailDirection * trailIntensity;

            // Subtle swirl around each trail point
            vec2 toTrail = trailPos - u;
            float miniSwirl = exp(-trailDistance * 4.0) * trailIntensity * 0.4;
            fluidDisplacement += vec2(-toTrail.y, toTrail.x) * miniSwirl;
        }
    }

    float a = 0.2;
    float t = u_time;

    for(float i = 1.0; i < 22.0; i++) {
        v = cos(++t - 7. * u * pow(a += .03, i)) - 5. * u;

        // Apply subtle fluid displacement
        float fluidFactor = 1.0 / (1.0 + i * 0.15);
        u += fluidDisplacement * fluidFactor * 0.1;

        u += tanh(40. * dot(u *= mat2(cos(i + .02 * t - vec4(0, 11, 33, 0))), u) * cos(1e2 * u.yx + t)) / 2e2 + .2 * a * u + cos(4. / exp(dot(o, o) / 1e2) + t) / 3e2;
        o += (1. + cos(z + t)) / length((1. + i * dot(v, v)) * sin(1.5 * u / (.5 - dot(u, u)) - 9. * u.yx + t));
    }

    o = 16.0 / (min(o, 13.) + 164. / o) - dot(u, u) / 250.;

    // Cursor glow/spark using REAL screen coordinates
    float glowDistance = mouseScreenDistance / max(u_resolution.x, u_resolution.y);

    // Bright cursor core
    float coreGlow = exp(-glowDistance * 200.0) * 0.4;

    // Wider outer glow
    float outerGlow = exp(-glowDistance * 80.0) * 0.2;

    // Subtle pulsation
    float pulse = 1.0 + sin(u_time * 2.5) * 0.3;

    // Combine glows with pulsation
    float totalGlow = (coreGlow + outerGlow) * pulse;

    // Add blue-white electric glow
    o += vec4(totalGlow * 0.7, totalGlow * 0.8, totalGlow * 1.2, 0.0);

    // Subtle trail waves for visibility
    for(int i = 0; i < 10; i++) {
        if(i >= u_trail_length) break;

        vec2 trailPos = (u_mouse_trail[i] - u_resolution * 0.5) / u_resolution.y * 0.3;
        float trailDistance = length(u - trailPos);
        float trailAge = (u_time * 1000.0 - u_trail_times[i]) / 3000.0;

        if(trailAge < 1.0 && trailAge > 0.0) {
            // Expanding waves from each trail point
            float wavePhase = trailDistance * 8.0 - (u_time - u_trail_times[i] / 1000.0) * 2.0;
            float wave = sin(wavePhase) * (1.0 - trailAge) * exp(-trailDistance * 3.0) * 0.02;

            // Add subtle blue-tinted wave
            o += vec4(wave * 0.4, wave * 0.6, wave * 1.0, 0.0);
        }
    }

    // Apply color multiplier and addition
    o.rgb = o.rgb * u_color_multiplier + u_color_addition;
    gl_FragColor = o;
}
```

## Vertex Shader

Passthrough shader for full-screen quad:

```glsl
attribute vec4 a_position;
void main() {
    gl_Position = a_position;
}
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
| `default` (home) | `[1, 1, 1]` | `[0, 0, 0]` | Core Blue base |
| `projects` | `[0.54, 1.01, 0.42]` | `[0, 0, 0]` | Green tint |
| `solutions` | `[1.08, 1.1, 0.42]` | `[0, 0, 0]` | Yellow tint |
| `technology` | `[0.0, 1.13, 2.0]` | `[0, 0, 0]` | Cyan/teal tint |
| `about` | `[1, 0.482, 0.368]` | `[0, 0, 0]` | Orange/warm tint |

All routes use `backgroundColor: '#2764f4'` (Core Blue) as the WebGL clear color.

---

## useShader Hook Integration

Key patterns from the `useShader` React hook (332 lines):

### Initialization
- **WebGL2 preferred**, falls back to WebGL1: `canvas.getContext('webgl2', attrs) ?? canvas.getContext('webgl', attrs)`
- **Resolution grain**: `resolutionGrain = 2` — renders at half resolution for performance
- **Context attributes**: `antialias: false`, `alpha: true`, `depth: false`, `preserveDrawingBuffer: true` (critical for mobile)

### Render Loop
- **Time conversion**: `time *= 0.0005` (milliseconds to slow seconds)
- **Color interpolation**: LERP with factor `0.05` for smooth route transitions
  ```typescript
  colorMultiplierRef.current[i] +=
    (targetColorMultiplierRef.current[i] - colorMultiplierRef.current[i]) * 0.05;
  ```
- **Full-screen quad**: `gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)` with vertices `[-1,-1, 1,-1, -1,1, 1,1]`

### Mouse Tracking
- **Window-level listener** (`window.addEventListener('mousemove', ...)`) — tracks mouse even over overlaid elements
- **15-point trail buffer** with `Date.now()` timestamps
- **3000ms expiry**: points older than 3 seconds are filtered out
- **Y-axis inversion**: `rect.height - (event.clientY - rect.top)` for WebGL coordinate system

### Cleanup
- Cancels animation frame, removes event listeners
- Deletes WebGL resources: buffer, program, shaders
- Context loss/restoration event handlers for mobile stability

### Return Value
```typescript
return { updateColors, updateBackgroundColor };
```
- `updateColors(multiplier, addition)`: sets target colors for LERP interpolation
- `updateBackgroundColor(hex)`: updates the WebGL clear color

---

## Hero Component Integration

From `src/components/shared/Hero.tsx`:

### Layout Structure
```tsx
<section className="relative grid h-screen ...">
  {/* Content at z-10 */}
  <motion.div className="relative z-10 ...">
    <Badge />      {/* Optional tagline */}
    <h1 />         {/* Title in font-display (Faculty Glyphic) */}
    <Button />     {/* CTA buttons */}
  </motion.div>

  {/* Canvas at z-0 (behind content) */}
  <canvas className="absolute inset-0 z-0 h-full w-full" />
</section>
```

### Shader Imports (via raw-loader)
```typescript
import vertexShader from '@/shaders/hero/vertexShader.vert';
import fragmentShader from '@/shaders/hero/fragmentShader.frag';
```

Requires Next.js config for Turbopack:
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
```

### Route-Aware Color Switching
`AnimatedHero.tsx` wraps `Hero` and:
1. Reads current pathname
2. Maps route to shader config key (`home` → `default`, others by name)
3. Calls `getShaderConfig(configKey)` to get color presets
4. Passes `shaderConfig` prop to `Hero`, which triggers `updateColors()` via `useEffect`

---

## Implementation Checklist

To replicate the A2R hero shader in a new project:

1. [ ] Copy `fragmentShader.frag` and `vertexShader.vert` to your shaders directory
2. [ ] Install `raw-loader` and configure your bundler for `.frag`/`.vert` imports
3. [ ] Implement or copy the `useShader` hook
4. [ ] Create a canvas element with `absolute inset-0 z-0` positioning
5. [ ] Overlay content with `relative z-10`
6. [ ] Define route-based `ShaderConfig` presets (or use a single default)
7. [ ] Wire `updateColors()` to route changes for smooth color transitions
8. [ ] Add `will-change: transform` and `transform: translateZ(0)` to canvas for GPU compositing
9. [ ] Test on mobile — ensure `preserveDrawingBuffer: true` is set
10. [ ] Handle WebGL context loss events for mobile stability
