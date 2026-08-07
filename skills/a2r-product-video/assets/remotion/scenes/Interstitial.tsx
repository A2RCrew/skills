// A2R product-video — "processing" interstitial to bridge a real wait
// (job queue, generation, upload) without dead air. Optional scene: use only for
// modules that have an async wait. Compresses e.g. a 4-min wait into ~4s.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { C, titleFont, bodyFont } from "../brand";
import { GridBg, CornerMarks } from "../helpers";

type Props = {
  dur: number;
  title?: string;        // "Procesando…"
  subtitle?: React.ReactNode;
  statusChain?: string;  // "Subiendo → Generando → Publicado"
  seconds?: number;      // real processing seconds, shown compressed
};

export const Interstitial: React.FC<Props> = ({
  dur, title = "Procesando…", subtitle, statusChain, seconds,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame: f, fps, config: { damping: 200 }, durationInFrames: 20 });
  const prog = interpolate(f, [10, dur - 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const spin = (f / fps) * 360;
  const mins = seconds != null ? Math.floor(seconds / 60) : null;
  const secs = seconds != null ? seconds % 60 : null;

  return (
    <AbsoluteFill>
      <GridBg />
      <CornerMarks />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ width: 900, background: C.white, borderRadius: 24, padding: "56px 64px", boxShadow: "0 30px 80px rgba(17,18,24,0.16)", border: `1px solid ${C.silver300}`, transform: `translateY(${interpolate(card, [0, 1], [30, 0])}px)`, opacity: card, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ position: "relative", width: 92, height: 92, marginBottom: 26 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `8px solid ${C.silver300}` }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "8px solid transparent", borderTopColor: C.coreBlue, borderRightColor: C.coreBlue, transform: `rotate(${spin}deg)` }} />
          </div>
          <div style={{ fontFamily: titleFont, fontSize: 46, color: C.black }}>{title}</div>
          {subtitle ? <div style={{ fontFamily: bodyFont, fontSize: 24, color: C.silver800, marginTop: 12 }}>{subtitle}</div> : null}
          <div style={{ width: "100%", height: 12, background: C.silver200, borderRadius: 8, marginTop: 34, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${prog * 100}%`, background: C.coreBlue, borderRadius: 8 }} />
          </div>
          {(statusChain || seconds != null) ? (
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 14 }}>
              <span style={{ fontFamily: bodyFont, fontSize: 19, color: C.silver700 }}>{statusChain}</span>
              {seconds != null ? <span style={{ fontFamily: bodyFont, fontSize: 19, color: C.silver700 }}>{`≈ ${mins} min ${secs}s de proceso`}</span> : null}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
