// A2R, en oscuro: el estilo del vídeo narrado del cambio de modelo.
import { continueRender, delayRender, staticFile } from "remotion";

export const titleFont = "A2R Faculty Glyphic";
export const bodyFont = "A2R Plus Jakarta Sans";

const FACES: [string, string, string][] = [
  [titleFont, "FacultyGlyphic-Regular.ttf", "400"],
  [bodyFont, "PlusJakartaSans-Regular.ttf", "400"],
  [bodyFont, "PlusJakartaSans-Medium.ttf", "500"],
  [bodyFont, "PlusJakartaSans-SemiBold.ttf", "600"],
  [bodyFont, "PlusJakartaSans-Bold.ttf", "700"],
];

if (typeof window !== "undefined" && typeof FontFace !== "undefined") {
  const handle = delayRender("Loading A2R brand fonts");
  Promise.all(
    FACES.map(([family, file, weight]) =>
      new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format("truetype")`, { weight, style: "normal" })
        .load()
        .then((loaded) => {
          document.fonts.add(loaded);
        }),
    ),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const MX = 120;

export const C = {
  bg: "#070B16",
  panel: "#0E1525",
  panel2: "#121B2F",
  line: "#22304D",
  text: "#F4F6FB",
  muted: "#A4AFC6",
  dim: "#6B7894",
  coreBlue: "#2764F4",
  blueInk: "#93B1F9", // azul de marca legible sobre oscuro (EVA-25)
  green: "#7FDDB5",
  amber: "#F5C26B",
  red: "#F59A9A",
};
