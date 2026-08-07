// A2R product-video — shared scene helpers.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./brand";

/** Fade a scene in/out at its edges (local-frame based). Wrap every scene with it. */
export const FadeScene: React.FC<{ dur: number; children: React.ReactNode; fade?: number }>
= ({ dur, children, fade = 10 }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, fade, dur - fade, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/** Silver-gray background with a faint, vignetted grid — the A2R "canvas". */
export const GridBg: React.FC<{ color?: string }> = ({ color = C.silver }) => (
  <AbsoluteFill style={{ backgroundColor: color }}>
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${C.silver300} 1px, transparent 1px), linear-gradient(90deg, ${C.silver300} 1px, transparent 1px)`,
        backgroundSize: "64px 64px",
        opacity: 0.5,
        maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.9), transparent 78%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.9), transparent 78%)",
      }}
    />
  </AbsoluteFill>
);

/** Brand "box frame" corner marks. */
export const CornerMarks: React.FC<{ inset?: number; size?: number; color?: string }>
= ({ inset = 22, size = 12, color = C.silver400 }) => {
  const base: React.CSSProperties = { position: "absolute", width: size, height: size, background: color };
  return (
    <>
      <div style={{ ...base, left: inset, top: inset }} />
      <div style={{ ...base, right: inset, top: inset }} />
      <div style={{ ...base, left: inset, bottom: inset }} />
      <div style={{ ...base, right: inset, bottom: inset }} />
    </>
  );
};

// Redaction overlay — hide real/sensitive data in a recording.
// PREFER demo data while recording; use this only for fixed on-screen regions
// (client name, email, PII). Coordinates are in composition px (e.g. 1920x1080),
// times in seconds within the CURRENT scene. `mode:'box'` is 100% reliable at
// render; `mode:'blur'` is best-effort. Render a still to confirm placement.
export type Region = { fromSec: number; toSec: number; x: number; y: number; w: number; h: number; mode?: "box" | "blur"; label?: string };

export const Redaction: React.FC<{ regions: Region[] }> = ({ regions }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <>
      {regions.filter((r) => t >= r.fromSec && t < r.toSec).map((r, i) => (
        <div
          key={i}
          style={{
            position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            ...(r.mode === "blur"
              ? { backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", background: "rgba(17,18,24,0.10)" }
              : { background: C.black }),
            color: C.white, fontSize: 14, letterSpacing: 1,
          }}
        >
          {r.label ?? ""}
        </div>
      ))}
    </>
  );
};
