// A2R product-video — Outro / closing card.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, titleFont } from "../brand";
import { GridBg } from "../helpers";

type Props = { tagline?: string; logoSrc?: string };

export const Outro: React.FC<Props> = ({ tagline = "A2R Studio", logoSrc = "logo.png" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = spring({ frame: f, fps, config: { damping: 200 }, durationInFrames: 20 });
  const tagS = spring({ frame: f - 8, fps, config: { damping: 200 }, durationInFrames: 20 });
  return (
    <AbsoluteFill>
      <GridBg />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ background: C.white, borderRadius: 18, padding: "24px 42px", boxShadow: "0 20px 60px rgba(17,18,24,0.12)", border: `1px solid ${C.silver300}`, opacity: logoS, transform: `scale(${interpolate(logoS, [0, 1], [0.92, 1])})` }}>
          <Img src={staticFile(logoSrc)} style={{ width: 300, display: "block" }} />
        </div>
        <div style={{ height: 5, width: 300, background: C.coreBlue, borderRadius: 3, marginTop: 30, opacity: tagS }} />
        <div style={{ fontFamily: titleFont, fontSize: 40, color: C.black, marginTop: 28, opacity: tagS, textAlign: "center", maxWidth: 1200 }}>
          {tagline}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
