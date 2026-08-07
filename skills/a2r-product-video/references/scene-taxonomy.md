# A2R product-video — scene taxonomy (the "grammar")

Every A2R product video is assembled from the same vocabulary of scenes, in this
order. **Mandatory** scenes anchor the format; **optional** scenes appear only if
the module needs them. Follow the *strategy*, not a fixed script — a module with
no file and no wait simply skips those scenes.

```
[Intro] → [Source doc?] → App-flow clips (steps) → [Processing?] → [Result reveal] → [Result doc?] → [Outro]
   M            O                    M                    O                 M               O            M
```

## Mandatory

- **Intro** — branded title card: logo chip, module name (Faculty Glyphic),
  one-line value proposition (Plus Jakarta Sans), a Core Blue accent bar. ~3s.
- **App-flow clips** — the real product, recorded viewport-only, full-bleed, with
  a virtual cursor. Split into **clips per step**, each with its own playback
  speed and one **lower-third caption** (`PASO N` overline + short title + optional
  subtitle). This is the spine of the video.
- **Result reveal** — the moment of success shown *in the app* (a "Publicado"
  row, a generated asset, a confirmation), framed with a `RESULTADO` caption.
- **Outro** — logo + tagline, Core Blue bar. ~3s.

## Optional (include when the module calls for it)

- **Source-doc scroll** — if the module consumes a document, show it scrolling
  BEFORE the upload step, with a banner ("this is the example file we'll use").
- **Processing interstitial** — if there's an async wait (queue/generation),
  bridge it with the spinner + progress card. Compress a multi-minute wait into
  a few seconds; never show real dead time.
- **Result-doc scroll** — if the module produces a viewable document/asset,
  scroll through it at the end to show quality/formatting/translation.

## Pacing rules

- **1920×1080 (or 1080×1920 for 9:16), 30 fps, silent by default** (strip the
  audio track after render; add a music bed only if the user opted in with their
  own track).
- App clips: speed up navigation (1.5–1.8×), **slow down explanatory steps** you
  want the viewer to understand (≈1.0–1.15×). Trim initial page-load dead time.
- Captions: min ~2s on screen; 2–4 word titles; never more than one per moment.
- Doc scroll: **~120–140 px/s**, ease-in then constant speed, **no end linger** —
  reach the end and cut (don't hold on a blank/cover page).
- Total length: as short as tells the story. A simple module ~45–75s; one with a
  source doc + wait + result doc can reach ~2–3 min. If the client wants "slower",
  extend doc scrolls first.

## Brand

- 60-30-10: Silver Gray `#FBFCFD` base, Core Blue `#2764F4` brand, Solid Black
  `#111218` text. Faculty Glyphic for titles, Plus Jakarta Sans for everything else.
- Reuse the real app logo (crop it from a screenshot) inside a white chip.
- Keep transitions calm: fade each scene in/out to the silver canvas.

See `a2r-brand-design-system` for the full palette/typography if you need more.
