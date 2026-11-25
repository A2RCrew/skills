import React from "react";
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FPS, MX, bodyFont, titleFont } from "./brand";
import { DarkBg, In, Logo, overline } from "./ui";
import timeline from "./timeline.json";

// timeline.json lo escribe build-timeline.mjs: duración de cada toma y de cada locución, en segundos.
type Scene = {
  n: string;
  label: string;
  title: string;
  voice: string;
  voiceDur: number;
  points: [number, string][];
  clip: string | null;
  clipDur: number;
  wait: boolean;
  after: string | null;
  outro: boolean;
  maxRate: number;
  doc: string[] | null;
  nuevo: boolean;
};
type T = {
  module: string;
  introTitle: string;
  introSub: string;
  outroTitle: string;
  intro: { voice: string; voiceDur: number };
  music: { file: string; dur: number; gain?: number } | null;
  scenes: Scene[];
};
const TL = timeline as unknown as T;

const LEAD = 0.5; // la voz entra medio segundo después del corte
const TAIL = 0.8;
const INTRO_TAIL = 1.2;
const OUTRO_CARD = 3.6; // cierre con el logo, después de la última escena
const f = (s: number) => Math.round(s * FPS);

/** La toma se acelera (hasta su maxRate) si dura bastante más que su locución. */
const rateOf = (s: Scene) => (s.clip ? Math.min(s.maxRate, Math.max(1, s.clipDur / (LEAD + s.voiceDur + TAIL + 1.2))) : 1);
/** Lo que dura una escena: la locución con sus márgenes, o la toma entera (ya acelerada) si dura más. */
const sceneLen = (s: Scene) => {
  const base = LEAD + s.voiceDur + TAIL + (s.doc ? 1 : 0);
  const len = Math.max(base, s.clip ? s.clipDur / rateOf(s) : 0);
  return f(len + (s.outro ? OUTRO_CARD : 0));
};

const introLen = f(LEAD + TL.intro.voiceDur + INTRO_TAIL);
const lens = TL.scenes.map(sceneLen);
const starts: number[] = [];
{
  let acc = introLen;
  for (const l of lens) {
    starts.push(acc);
    acc += l;
  }
}
export const TOTAL = starts[starts.length - 1] + lens[lens.length - 1];

// Todas las locuciones, con su fotograma de entrada: la música se aparta mientras hablan.
const VOICES = [
  { from: f(LEAD), dur: f(TL.intro.voiceDur) },
  ...TL.scenes.map((s, i) => ({ from: starts[i] + f(LEAD), dur: f(s.voiceDur) })),
];

// La pista y su duración las pone build-timeline.mjs a partir de plan.music; sin música, null.
const MUSIC = TL.music;
const MUSIC_LEN = MUSIC ? Math.floor(MUSIC.dur * FPS) : 0;
const MUSIC_XFADE = f(3);
// build-timeline.mjs mide los LUFS de la pista y deja aquí la ganancia que la iguala a la de referencia.
const MUSIC_GAIN = MUSIC?.gain ?? 1;

const musicVolume = (fr: number) => {
  const duck = VOICES.reduce((m, v) => {
    const k = interpolate(fr, [v.from - 12, v.from, v.from + v.dur, v.from + v.dur + 18], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return Math.max(m, k);
  }, 0);
  const base = interpolate(duck, [0, 1], [0.32, 0.1]);
  const fade = interpolate(fr, [0, f(1.5), TOTAL - f(3.5), TOTAL], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return base * fade * MUSIC_GAIN;
};

// ── Piezas ──

const SRC_W = 1312;
const SRC_H = 900;
const FRAME = { left: 600, top: 150, width: 1200, height: Math.round((1200 * SRC_H) / SRC_W) };

/** La toma recortada (sin la barra lateral) y, al acabarse, su último fotograma quieto. */
const Clip: React.FC<{ name: string; dur: number; len: number; rate?: number }> = ({ name, dur, len, rate = 1 }) => {
  const clipFrames = f(dur / rate) - 1;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={Math.min(clipFrames, len)}>
        <OffthreadVideo src={staticFile(`clips/${name}.mp4`)} playbackRate={rate} muted style={{ width: "100%", height: "100%" }} />
      </Sequence>
      {len > clipFrames && (
        <Sequence from={clipFrames}>
          <Img src={staticFile(`clips/${name}-last.png`)} style={{ width: "100%", height: "100%" }} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const Frame: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = "#fff" }) => (
  <div
    style={{
      position: "absolute",
      ...FRAME,
      borderRadius: 16,
      overflow: "hidden",
      border: `1.5px solid ${C.line}`,
      boxShadow: "0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(147,177,249,0.06)",
      background: bg,
    }}
  >
    {children}
  </div>
);

/** Píldora sobre el marco: «2 minutos después» al entrar, o «En segundo plano» en las esperas. */
const Pill: React.FC<{ text: string; from: number; to: number; tone: "blue" | "amber" }> = ({ text, from, to, tone }) => {
  const fr = useCurrentFrame();
  const o = interpolate(fr, [from, from + 8, to - 8, to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const color = tone === "blue" ? C.blueInk : C.amber;
  return (
    <div
      style={{
        position: "absolute",
        left: FRAME.left,
        top: FRAME.top - 62,
        ...overline,
        fontSize: 16,
        color: tone === "blue" ? C.bg : color,
        background: tone === "blue" ? C.blueInk : "transparent",
        border: `1.5px solid ${color}`,
        borderRadius: 999,
        padding: "8px 18px",
        opacity: o,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {tone === "amber" && <Spinner color={color} />}
      {text}
    </div>
  );
};

const Spinner: React.FC<{ color: string }> = ({ color }) => {
  const fr = useCurrentFrame();
  return (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        borderTopColor: "transparent",
        display: "inline-block",
        transform: `rotate(${fr * 12}deg)`,
      }}
    />
  );
};

const SceneHeader: React.FC<{ n: string; label: string; title: string; nuevo?: boolean }> = ({ n, label, title, nuevo }) => (
  <>
    <div style={{ position: "absolute", left: MX, top: 150, display: "flex", gap: 14, alignItems: "center", ...overline, color: C.muted }}>
      <span style={{ color: C.blueInk }}>{n}</span>
      <span style={{ width: 26, height: 1.5, background: C.dim }} />
      <span>{label}</span>
    </div>
    {nuevo && (
      <div style={{ position: "absolute", left: MX, top: 104 }}>
        <In at={-0.2}>
          <span style={{ ...overline, fontSize: 14, color: C.bg, background: C.blueInk, borderRadius: 999, padding: "6px 14px" }}>Nuevo</span>
        </In>
      </div>
    )}
    <div style={{ position: "absolute", left: MX, top: 204, width: 430 }}>
      <In at={-0.3}>
        <div style={{ fontFamily: titleFont, fontSize: 46, color: C.text, lineHeight: 1.14 }}>{title}</div>
      </In>
    </div>
  </>
);

/** Lo que cuenta la voz, en la columna izquierda; cada punto entra al decir su palabra. */
const Points: React.FC<{ points: [number, string][]; t: number }> = ({ points, t }) => (
  <div style={{ position: "absolute", left: MX, top: 470, width: 430 }}>
    {points.map(([at, text], i) => {
      const p = interpolate(t, [at, at + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.22, 1, 0.36, 1) });
      return (
        <div key={i} style={{ display: "flex", gap: 14, marginBottom: 22, opacity: p, transform: `translateX(${(1 - p) * -16}px)` }}>
          <span style={{ width: 8, height: 8, marginTop: 13, borderRadius: 2, background: C.blueInk, flex: "none" }} />
          <span style={{ fontFamily: bodyFont, fontSize: 26, lineHeight: 1.32, color: C.text }}>{text}</span>
        </div>
      );
    })}
  </div>
);

/** Las páginas del documento exportado, a dos columnas, con un desplazamiento lento. */
const DocScroll: React.FC<{ pages: string[]; len: number }> = ({ pages, len }) => {
  const fr = useCurrentFrame();
  const PW = 520;
  const PH = Math.round((PW * 1169) / 827);
  const GAP = 44;
  const rows = Math.ceil(pages.length / 2);
  const total = rows * PH + (rows + 1) * GAP;
  const max = Math.max(0, total - FRAME.height);
  const y = interpolate(fr, [f(1.6), len - f(1.4)], [0, max], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  return (
    <AbsoluteFill style={{ background: "#E7EAF0" }}>
      <div style={{ position: "absolute", top: GAP - y, left: 0, right: 0, display: "grid", gridTemplateColumns: `${PW}px ${PW}px`, gap: GAP, justifyContent: "center" }}>
        {pages.map((p) => (
          <Img key={p} src={staticFile(`docs/${p}`)} style={{ width: PW, height: PH, background: "#fff", boxShadow: "0 10px 30px rgba(7,11,22,0.22)" }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Fade: React.FC<{ dur: number; children: React.ReactNode; out?: boolean }> = ({ dur, children, out = true }) => {
  const fr = useCurrentFrame();
  const o = out
    ? interpolate(fr, [0, 10, dur - 10, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(fr, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const StepScene: React.FC<{ s: Scene; len: number }> = ({ s, len }) => {
  const fr = useCurrentFrame();
  const t = fr / FPS - LEAD;
  const body = s.outro ? len - f(OUTRO_CARD) : len;
  return (
    <AbsoluteFill>
      <SceneHeader n={s.n} label={s.label} title={s.title} nuevo={s.nuevo} />
      <Points points={s.points} t={t} />
      {s.after && <Pill text={s.after} from={0} to={f(2.6)} tone="blue" />}
      {s.wait && <Pill text="En segundo plano" from={0} to={body} tone="amber" />}
      <Frame bg={s.doc ? "#E7EAF0" : "#fff"}>
        {s.clip && <Clip name={s.clip} dur={s.clipDur} len={len} rate={rateOf(s)} />}
        {s.doc && <DocScroll pages={s.doc} len={body} />}
      </Frame>
      <Sequence from={f(LEAD)}>
        <Audio src={staticFile(`audio/${s.voice}.wav`)} />
      </Sequence>
      {s.outro && (
        <Sequence from={body}>
          <Fade dur={f(OUTRO_CARD)} out={false}>
            <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center" }}>
              <DarkBg />
              <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
                <Logo width={120} />
                <div style={{ ...overline, color: C.blueInk, marginTop: 44 }}>{TL.module} · A2R</div>
                <div style={{ fontFamily: titleFont, fontSize: 60, color: C.text, marginTop: 18 }}>{TL.outroTitle}</div>
              </AbsoluteFill>
            </AbsoluteFill>
          </Fade>
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const Intro: React.FC = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: MX, top: 300 }}>
      <In at={-0.4}>
        <Logo width={96} />
      </In>
      <In at={-0.1}>
        <div style={{ ...overline, color: C.blueInk, marginTop: 56 }}>{TL.module} · A2R</div>
      </In>
      <In at={0.2}>
        <div style={{ fontFamily: titleFont, fontSize: 96, color: C.text, lineHeight: 1.05, marginTop: 20, maxWidth: 1500 }}>{TL.introTitle}</div>
      </In>
      <In at={0.8}>
        <div style={{ fontFamily: bodyFont, fontSize: 32, color: C.muted, marginTop: 28 }}>{TL.introSub}</div>
      </In>
    </div>
  </AbsoluteFill>
);

const ProgressBar: React.FC = () => {
  const fr = useCurrentFrame();
  const end = TOTAL - f(OUTRO_CARD);
  const p = interpolate(fr, [introLen, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const vis = interpolate(fr, [introLen, introLen + 12, end - 12, end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: MX, top: 1036, width: 1920 - 2 * MX, height: 3, background: C.line, opacity: vis }}>
      <div style={{ width: `${p * 100}%`, height: 3, background: C.coreBlue }} />
    </div>
  );
};

export const Walkthrough: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <DarkBg />
    <ProgressBar />
    {/* Si la pista dura menos que el vídeo, se repite con un fundido cruzado de MUSIC_XFADE. */}
    {MUSIC && Array.from({ length: Math.ceil(TOTAL / (MUSIC_LEN - MUSIC_XFADE)) }, (_, k) => {
      const from = k * (MUSIC_LEN - MUSIC_XFADE);
      return (
        <Sequence key={k} from={from} durationInFrames={MUSIC_LEN}>
          <Audio
            src={staticFile(MUSIC.file)}
            volume={(fr) =>
              musicVolume(from + fr) *
              interpolate(fr, [0, k === 0 ? 1 : MUSIC_XFADE, MUSIC_LEN - MUSIC_XFADE, MUSIC_LEN], [k === 0 ? 1 : 0, 1, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            }
          />
        </Sequence>
      );
    })}
    <Sequence durationInFrames={introLen}>
      <Fade dur={introLen}>
        <Intro />
      </Fade>
      <Sequence from={f(LEAD)}>
        <Audio src={staticFile(`audio/${TL.intro.voice}.wav`)} />
      </Sequence>
    </Sequence>
    {TL.scenes.map((s, i) => (
      <Sequence key={s.n} from={starts[i]} durationInFrames={lens[i]}>
        <Fade dur={lens[i]} out={!s.outro}>
          <StepScene s={s} len={lens[i]} />
        </Fade>
      </Sequence>
    ))}
  </AbsoluteFill>
);
