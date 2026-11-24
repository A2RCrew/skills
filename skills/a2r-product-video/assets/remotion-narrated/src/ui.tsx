import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, MX, bodyFont, titleFont } from "./brand";

/** Retardo de la voz al empezar cada escena (s). */
export const LEAD = 0.4;

export const useT = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

export const prog = (t: number, at: number, dur = 0.7) =>
  interpolate(t, [at, at + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });

/** Entra con un fundido y un desliz corto a los `at` segundos de la voz. */
export const In: React.FC<{ at: number; y?: number; x?: number; dur?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  at,
  y = 18,
  x = 0,
  dur = 0.7,
  style,
  children,
}) => {
  const t = useT() - LEAD;
  const p = prog(t, at, dur);
  return <div style={{ opacity: p, transform: `translate(${(1 - p) * x}px, ${(1 - p) * y}px)`, ...style }}>{children}</div>;
};

export const SceneFade: React.FC<{ dur: number; fadeOut?: boolean; children: React.ReactNode }> = ({ dur, fadeOut = true, children }) => {
  const f = useCurrentFrame();
  const fade = 10;
  const opacity = fadeOut
    ? interpolate(f, [0, fade, dur - fade, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(f, [0, fade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/** Lienzo oscuro con resplandor azul y retícula muy tenue. */
export const DarkBg: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 55% at 72% 8%, rgba(39,100,244,0.22), rgba(39,100,244,0) 70%)" }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 50% 40% at 10% 100%, rgba(39,100,244,0.10), rgba(39,100,244,0) 70%)" }} />
    <AbsoluteFill
      style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        backgroundPosition: "40px 40px",
      }}
    />
  </AbsoluteFill>
);

export const overline: React.CSSProperties = {
  fontFamily: bodyFont,
  fontWeight: 600,
  fontSize: 18,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

/** «03 — LISTADO» arriba a la izquierda, y la parte a la derecha. */
export const Header: React.FC<{ n: string; label: string; part?: string }> = ({ n, label, part }) => (
  <>
    <div style={{ position: "absolute", left: MX, top: 64, display: "flex", gap: 14, alignItems: "center", ...overline, color: C.muted }}>
      <span style={{ color: C.blueInk }}>{n}</span>
      <span style={{ width: 26, height: 1.5, background: C.dim }} />
      <span>{label}</span>
    </div>
    {part && (
      <div style={{ position: "absolute", right: MX, top: 58, ...overline, fontSize: 15, color: C.blueInk, border: `1.5px solid ${C.line}`, borderRadius: 999, padding: "8px 16px" }}>
        {part}
      </div>
    )}
  </>
);

export const Heading: React.FC<{ children: React.ReactNode; at?: number; size?: number; top?: number; width?: number }> = ({
  children,
  at = -0.2,
  size = 54,
  top = 104,
  width = 1500,
}) => (
  <div style={{ position: "absolute", left: MX, top, width }}>
    <In at={at}>
      <div style={{ fontFamily: titleFont, fontSize: size, color: C.text, lineHeight: 1.12 }}>{children}</div>
    </In>
  </div>
);

export const B: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.blueInk }) => <span style={{ color }}>{children}</span>;

export const Logo: React.FC<{ width?: number; style?: React.CSSProperties }> = ({ width = 110, style }) => (
  <Img src={staticFile("img/LogoMark_PureWhite.svg")} style={{ width, ...style }} />
);

/** Marco de pantalla para las tomas y las imágenes fijas. */
export const Screen: React.FC<{ left: number; top: number; width: number; height: number; children: React.ReactNode; at?: number }> = ({
  left,
  top,
  width,
  height,
  children,
  at = -0.3,
}) => (
  <div style={{ position: "absolute", left, top, width, height }}>
    <In at={at} y={26} style={{ width: "100%", height: "100%" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 16,
          overflow: "hidden",
          border: `1.5px solid ${C.line}`,
          boxShadow: "0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(147,177,249,0.06)",
          background: "#fff",
        }}
      >
        {children}
      </div>
    </In>
  </div>
);

/** Un punto de la revisión en la columna izquierda: código EVA y lo que cambió. */
export const Point: React.FC<{ at: number; code: string; children: React.ReactNode; active?: [number, number] }> = ({ at, code, children, active }) => {
  const t = useT() - LEAD;
  const on = active ? t >= active[0] && t < active[1] : false;
  return (
    <In at={at} x={-18} y={0} style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <span
          style={{
            ...overline,
            fontSize: 14,
            letterSpacing: "0.08em",
            color: on ? C.bg : C.blueInk,
            background: on ? C.blueInk : "transparent",
            border: `1.5px solid ${on ? C.blueInk : C.line}`,
            borderRadius: 999,
            padding: "6px 11px",
            whiteSpace: "nowrap",
            marginTop: 2,
          }}
        >
          {code}
        </span>
        <span style={{ fontFamily: bodyFont, fontSize: 25, lineHeight: 1.32, color: on ? C.text : C.muted, fontWeight: on ? 600 : 400 }}>{children}</span>
      </div>
    </In>
  );
};

export const Points: React.FC<{ children: React.ReactNode; top?: number; width?: number }> = ({ children, top = 250, width = 440 }) => (
  <div style={{ position: "absolute", left: MX, top, width }}>{children}</div>
);

/** Caja con borde fino y nodos en las esquinas, la del sistema A2R. */
export const Box: React.FC<{ style?: React.CSSProperties; children: React.ReactNode; hi?: boolean }> = ({ style, children, hi }) => {
  const nc = hi ? C.blueInk : C.dim;
  const n: React.CSSProperties = { position: "absolute", width: 8, height: 8, background: nc };
  return (
    <div style={{ position: "relative", background: hi ? "rgba(39,100,244,0.10)" : C.panel, border: `1.5px solid ${hi ? C.coreBlue : C.line}`, ...style }}>
      <div style={{ ...n, left: -4.5, top: -4.5 }} />
      <div style={{ ...n, right: -4.5, top: -4.5 }} />
      <div style={{ ...n, left: -4.5, bottom: -4.5 }} />
      <div style={{ ...n, right: -4.5, bottom: -4.5 }} />
      {children}
    </div>
  );
};

export const BoxLabel: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.muted }) => (
  <div style={{ ...overline, fontSize: 15, color, marginBottom: 12 }}>{children}</div>
);

export const Body: React.FC<{ children: React.ReactNode; size?: number; color?: string }> = ({ children, size = 28, color = C.text }) => (
  <div style={{ fontFamily: bodyFont, fontSize: size, lineHeight: 1.35, color }}>{children}</div>
);
