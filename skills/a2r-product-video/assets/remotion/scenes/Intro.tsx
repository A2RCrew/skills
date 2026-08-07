// A2R product-video — Intro title card. Parameterize per module via props.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { C, titleFont, bodyFont } from "../brand";
import { GridBg } from "../helpers";

type Props = {
  title: string;         // e.g. the module name: "Traducciones", "Texto a Voz", …
  subtitle?: string;     // one-line value proposition
  logoSrc?: string;      // staticFile name, e.g. "logo.png" (cropped from the app)
};

export const Intro: React.FC<Props> = ({ title, subtitle, logoSrc = "logo.png" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = (delay: number, dur = 22) => spring({ frame: f - delay, fps, config: { damping: 200 }, durationInFrames: dur });
  const logoS = s(0), titleS = s(8), subS = s(16);
  const barW = interpolate(s(12, 30), [0, 1], [0, 460]);

  return (
    <AbsoluteFill>
      <GridBg />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div
            style={{
              background: C.white, borderRadius: 18, padding: "24px 40px",
              boxShadow: "0 20px 60px rgba(17,18,24,0.12)", border: `1px solid ${C.silver300}`,
              opacity: logoS, transform: `translateY(${interpolate(logoS, [0, 1], [20, 0])}px)`,
            }}
          >
            <Img src={staticFile(logoSrc)} style={{ width: 300, display: "block" }} />
          </div>
          <div style={{ height: 6, background: C.coreBlue, width: barW, borderRadius: 3, marginTop: 34 }} />
          <div style={{ fontFamily: titleFont, fontSize: 96, color: C.black, marginTop: 30, lineHeight: 1.05, opacity: titleS, transform: `translateY(${interpolate(titleS, [0, 1], [26, 0])}px)` }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontFamily: bodyFont, fontSize: 27, color: C.silver800, marginTop: 18, maxWidth: 1100, opacity: subS, transform: `translateY(${interpolate(subS, [0, 1], [18, 0])}px)` }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
