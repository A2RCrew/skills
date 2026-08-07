# A2R product-video — assembling & rendering in Remotion

## Project setup

```bash
npx create-video@latest --yes --blank --no-tailwind a2r-video-remotion
cd a2r-video-remotion && npm i && npm i @remotion/google-fonts
```

Copy the composition assets into `src/`:

```
assets/remotion/brand.ts            -> src/brand.ts
assets/remotion/helpers.tsx         -> src/helpers.tsx
assets/remotion/scenes/*            -> src/scenes/*
assets/remotion/Video.example.tsx   -> src/Video.tsx        (adapt)
assets/remotion/Root.example.tsx    -> src/Root.tsx         (adapt)
assets/remotion/timeline.example.ts -> src/timeline.ts      (adapt)
assets/remotion/build-data.example.mjs -> build-data.mjs    (adapt)
assets/remotion/remotion.config.ts  -> remotion.config.ts
```

Put media in `public/`: the recording(s) `*.webm`, `logo.png` (cropped from the
app), and page images under `public/doc-orig/`, `public/doc/` if used.

## Data-driven

`build-data.mjs` probes recording durations (ffprobe), copies media into
`public/`, and writes `src/data.json`. The composition reads `data.json` and the
`timeline.ts` computes scene durations + start offsets. This keeps timing in one
place — tune pacing by editing `data.json`, not the components.

## Scenes (all in `assets/remotion/scenes/`)

- **Intro / Outro** — props: `title`, `subtitle`/`tagline`, `logoSrc`.
- **SceneVideo** — plays a `clip` (`src`, `srcStart`, `srcEnd`, `speed`,
  `captions[]`) full-bleed with a top progress bar and timed lower-third. Split
  one recording into several clips to pace each step differently.
- **Interstitial** — spinner + progress card for async waits (optional).
- **DocScroll** — smooth page scroll (optional). Props include `folder`, `pages`,
  `title`, `chipLabel`, `rightNote`, `introNote`.

Wrap every scene in `FadeScene` and lay them out with `<Sequence>` back-to-back.

### Redaction (hide sensitive data)

Prefer recording with demo/anonymized data so nothing sensitive is ever captured.
If a fixed on-screen region must be hidden, overlay `Redaction` (from `helpers`)
as a sibling AFTER the clip inside the same `<Sequence>`:

```tsx
<Sequence from={start} durationInFrames={dur}>
  <FadeScene dur={dur}>
    <SceneVideo clip={clip} dur={dur} />
    <Redaction regions={[
      { fromSec: 2, toSec: 9, x: 320, y: 250, w: 520, h: 40, mode: "box", label: "CLIENTE" },
    ]} />
  </FadeScene>
</Sequence>
```

Coordinates are composition px (1920×1080); times are seconds within the scene.
`mode:"box"` (solid bar) is 100% reliable at render; `mode:"blur"` is best-effort.
If the sensitive content moves/scrolls, trim that moment instead of masking.
Always verify placement with `remotion still`.

## Pacing knobs

- Clip `speed`: 1.5–1.8× for navigation, ≈1.0–1.15× for steps to understand.
- Caption windows (`a`,`b` in source seconds): keep ≥2s on screen after the
  speed-up divides them.
- Doc scroll: set `docScrollSpeedPxPerSec` (≈120–140) in `data.json`; derive the
  scene frame length with `docScrollFrames()` so pacing is page-count-independent.
  The scroll ramps in then holds constant speed and cuts at the end (no linger).

## Validate with stills (fast) before full render

```bash
npx remotion still A2RVideo out/still.png --frame=<N>
```

Render a handful of frames (one per scene) to check fonts load, video decodes,
images resolve, and captions align — much faster than a full render.

## Audio (optional — off by default)

The A2R default is **silent**. Only add audio if the user opted in (Paso 0), and
only with a music track the user supplied/approved — never download licensed music.

To add a music bed, drop the file in `public/` and add one `<Audio>` at the top of
the composition (it plays across the whole video):

```tsx
import { Audio, staticFile } from "remotion";
// inside A2RVideo, as the first child:
<Audio src={staticFile("music.mp3")} volume={0.5} />
```

## Render + audio handling

```bash
npx remotion render A2RVideo out/video.mp4
```

- **Silent (default):** Remotion muxes a silent AAC track; strip it for a truly
  audio-less file, then confirm only a video stream remains:

  ```bash
  ffmpeg -y -i out/video.mp4 -c:v copy -an out/video_final.mp4
  ffprobe -v error -show_entries stream=codec_type -of default=noprint_wrappers=1:nokey=1 out/video_final.mp4  # -> only "video"
  ```

- **With music:** do NOT strip audio; ship `out/video.mp4` as-is.

## Aspect ratio (16:9 and/or 9:16)

Timing/pacing is aspect-independent; only layout changes. Drive it from
`data.json`:

- **16:9** (default): `width: 1920, height: 1080`.
- **9:16** (social): `width: 1080, height: 1920`. The app recording is 16:9, so
  don't `objectFit: cover` it full-bleed (it would crop badly). Instead place the
  recording in a rounded "device card" centered on the silver canvas (scale to the
  1080 width) and let captions sit below it. Doc-scroll and title/interstitial
  scenes already center their content and adapt. Render a `remotion still` in 9:16
  first to check the app clip is legible; if not, record that flow at a portrait
  viewport or zoom the relevant region.

Render both by editing `data.json` (or add a second Composition id) and rendering
twice.

## Fonts

`@remotion/google-fonts/FacultyGlyphic` (titles) and `/PlusJakartaSans` (body)
are the A2R faces and load during render (needs network). If a render must be
fully offline, vendor the TTFs and load with `@remotion/fonts` instead.
