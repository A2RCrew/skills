// A2R product-video — timeline helpers (EXAMPLE, adapt per module).
// Computes clip/scene durations in frames and sequential start offsets.
import data from "./data.json";

export { data };
export const FPS = data.fps;

type Clip = { srcStart: number; srcEnd: number; speed: number };
export const clipFrames = (c: Clip) => Math.round(((c.srcEnd - c.srcStart) / c.speed) * FPS);

// Doc-scroll duration derived from a target scroll SPEED (px/s) so pacing is
// consistent regardless of page count. Mirror the geometry used in DocScroll.tsx.
export function docScrollFrames(pages: number, pageW = 720) {
  const pageH = (pageW * 1754) / 1241, gap = 44, areaTop = 128;
  const content = pages * pageH + (pages - 1) * gap;
  const maxScroll = Math.max(0, content - (data.height - areaTop) + 70);
  const pxPerSec = data.scenes.docScrollSpeedPxPerSec ?? 130;
  return Math.round((maxScroll / pxPerSec) * FPS) + 24;
}

// Build an ordered list of scenes; comment out the ones a module doesn't need.
export const CLIP_FRAMES = data.clips.map(clipFrames);
export const SCENES: { key: string; dur: number }[] = [
  { key: "intro", dur: data.scenes.intro },
  // { key: "docOrig", dur: docScrollFrames(data.docOrig?.pages ?? 0) },   // optional: source doc
  ...data.clips.map((c: any, i: number) => ({ key: `clip:${c.key}`, dur: CLIP_FRAMES[i] })),
  // { key: "interstitial", dur: data.scenes.interstitial },              // optional: async wait
  // { key: "docResult", dur: docScrollFrames(data.doc?.pages ?? 0) },    // optional: result doc
  { key: "outro", dur: data.scenes.outro },
];

// cumulative start frames
export const STARTS: Record<string, number> = {};
let cur = 0;
for (const s of SCENES) { STARTS[s.key] = cur; cur += s.dur; }
export const TOTAL = cur;
