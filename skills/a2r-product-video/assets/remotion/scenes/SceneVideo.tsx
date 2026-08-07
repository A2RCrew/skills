// A2R product-video — plays a slice ("clip") of a screen recording full-bleed,
// with a top progress bar and a timed lower-third caption per step.
// Split one recording into several clips to give each step its own pace + caption
// (e.g. slow down the configuration step, speed up navigation).
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { C, bodyFont, titleFont } from "../brand";

type Caption = { a: number; b: number; step?: string; title: string; sub?: string };
// a,b are ABSOLUTE seconds in the source recording (same axis as srcStart/srcEnd).
export type Clip = { src: string; srcStart: number; srcEnd: number; speed: number; captions: Caption[] };

const secToFrame = (clip: Clip, sec: number, fps: number) =>
  Math.round(((sec - clip.srcStart) / clip.speed) * fps);

const LowerThird: React.FC<{ clip: Clip }> = ({ clip }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = clip.captions
    .map((c) => ({ c, from: secToFrame(clip, c.a, fps), to: secToFrame(clip, c.b, fps) }))
    .find(({ from, to }) => f >= from && f < to);
  if (!active) return null;
  const local = f - active.from, len = active.to - active.from;
  const appear = interpolate(local, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const disappear = interpolate(local, [len - 8, len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = Math.min(appear, disappear);
  const { c } = active;
  return (
    <div style={{ position: "absolute", left: 56, bottom: 56, opacity: op, transform: `translateY(${interpolate(appear, [0, 1], [24, 0])}px)`, display: "flex", borderRadius: 16, overflow: "hidden", boxShadow: "0 18px 50px rgba(17,18,24,0.28)", maxWidth: 1040 }}>
      <div style={{ width: 8, background: C.coreBlue }} />
      <div style={{ background: C.black, padding: "18px 30px 20px 26px" }}>
        {c.step ? <div style={{ fontFamily: bodyFont, color: C.coreBlue, fontWeight: 700, fontSize: 18, letterSpacing: 3, textTransform: "uppercase" }}>{c.step}</div> : null}
        <div style={{ fontFamily: titleFont, color: C.white, fontSize: 40, lineHeight: 1.15, marginTop: c.step ? 4 : 0 }}>{c.title}</div>
        {c.sub ? <div style={{ fontFamily: bodyFont, color: C.silver400, fontSize: 22, marginTop: 8 }}>{c.sub}</div> : null}
      </div>
    </div>
  );
};

export const SceneVideo: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = interpolate(f, [0, dur], [0, 1], { extrapolateRight: "clamp" });
  const intro = spring({ frame: f, fps, config: { damping: 200 }, durationInFrames: 16 });
  return (
    <AbsoluteFill style={{ backgroundColor: C.silver }}>
      <AbsoluteFill style={{ transform: `scale(${interpolate(intro, [0, 1], [1.02, 1])})` }}>
        <OffthreadVideo
          src={staticFile(clip.src)}
          startFrom={Math.round(clip.srcStart * fps)}
          endAt={Math.round(clip.srcEnd * fps)}
          playbackRate={clip.speed}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "rgba(17,18,24,0.10)" }}>
        <div style={{ height: "100%", width: `${progress * 100}%`, background: C.coreBlue }} />
      </div>
      <LowerThird clip={clip} />
    </AbsoluteFill>
  );
};
