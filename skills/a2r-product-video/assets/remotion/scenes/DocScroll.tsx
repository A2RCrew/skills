// A2R product-video — smooth vertical scroll through a document's page images.
// Optional scene: use for modules that produce (or consume) a viewable document.
// Show the SOURCE before the flow ("before") and/or the RESULT after ("after").
//
// Pacing rule: scroll should be slow enough to APPRECIATE layout (not read fully),
// ~120-140 px/s. It ramps in then holds CONSTANT speed (no end deceleration) so it
// does not linger on the last page — it reaches the end and the scene cuts.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing, spring } from "remotion";
import { C, titleFont, bodyFont } from "../brand";
import { GridBg } from "../helpers";

type Props = {
  dur: number;
  folder: string;       // public subfolder with page-1.png..page-N.png
  pages: number;
  pageW?: number;
  title: string;        // "Documento original" / "Documento traducido"
  chipLabel: string;    // "Español" / "Inglés (GB)"
  chipColor?: string;
  chipText?: string;
  rightNote: string;    // "antes de traducir" / "formato preservado"
  introNote?: string;   // optional banner shown for the first ~2.5s
};

export const DocScroll: React.FC<Props> = ({
  dur, folder, pages, pageW = 720, title, chipLabel,
  chipColor = C.coreBlue, chipText = C.white, rightNote, introNote,
}) => {
  const f = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const pageH = (pageW * 1754) / 1241; // A4 ratio; adjust if your pages differ
  const gap = 44;
  const content = pages * pageH + (pages - 1) * gap;
  const areaTop = 128;
  const areaH = height - areaTop;
  const maxScroll = Math.max(0, content - areaH + 70);

  const startHold = 12;
  // ease-in ramp, then constant speed to the end (bezier ends linear -> no linger)
  const scroll = interpolate(f, [startHold, dur], [0, maxScroll], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.28, 0, 1, 1),
  });
  const curPage = Math.min(pages, Math.max(1, Math.floor((scroll + areaH * 0.4) / (pageH + gap)) + 1));
  const headerS = spring({ frame: f, fps, config: { damping: 200 }, durationInFrames: 16 });
  const banner = introNote ? interpolate(f, [4, 16, 66, 80], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  return (
    <AbsoluteFill>
      <GridBg />
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "50%", top: areaTop, transform: `translate(-50%, ${-scroll}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap }}>
          {Array.from({ length: pages }).map((_, i) => (
            <Img key={i} src={staticFile(`${folder}/page-${i + 1}.png`)} style={{ width: pageW, height: pageH, borderRadius: 6, background: C.white, boxShadow: "0 20px 50px rgba(17,18,24,0.18)" }} />
          ))}
        </div>
      </AbsoluteFill>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: areaTop + 30, background: `linear-gradient(${C.silver} 62%, rgba(251,252,253,0))` }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 70, background: `linear-gradient(rgba(251,252,253,0), ${C.silver})` }} />

      <div style={{ position: "absolute", top: 40, left: 56, right: 56, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: headerS, transform: `translateY(${interpolate(headerS, [0, 1], [-16, 0])}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 8, height: 40, background: C.coreBlue, borderRadius: 4 }} />
          <div style={{ fontFamily: titleFont, fontSize: 40, color: C.black }}>{title}</div>
          <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 18, letterSpacing: 1.5, textTransform: "uppercase", color: chipText, background: chipColor, padding: "6px 14px", borderRadius: 999 }}>{chipLabel}</div>
        </div>
        <div style={{ fontFamily: bodyFont, fontSize: 22, color: C.silver700 }}>
          Página <b style={{ color: C.black }}>{curPage}</b> / {pages} · {rightNote}
        </div>
      </div>

      {introNote ? (
        <div style={{ position: "absolute", left: "50%", bottom: 70, transform: `translateX(-50%) translateY(${interpolate(banner, [0, 1], [16, 0])}px)`, opacity: banner, background: C.black, color: C.white, borderRadius: 999, padding: "14px 30px", fontFamily: bodyFont, fontSize: 24, boxShadow: "0 16px 44px rgba(17,18,24,0.28)", display: "flex", alignItems: "center", gap: 12, whiteSpace: "nowrap" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.coreBlue, display: "inline-block" }} />
          {introNote}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
