// A2R product-video — data builder (EXAMPLE, adapt per module).
// Probes recording duration(s), copies media into public/, and writes src/data.json.
// Run from the recording project root:  node build-data.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const R = __dirname;                        // your Remotion project root
const pub = path.join(R, "public");
fs.mkdirSync(pub, { recursive: true });

// --- media inputs (edit paths) ---
const REC = "/path/to/recordings";          // where record-*.mjs saved the .webm
const LOGO = "/path/to/logo-crop.png";       // crop the app logo from a screenshot

// copy the screen recording(s)
fs.copyFileSync(path.join(REC, "flow.webm"), path.join(pub, "flow.webm"));
if (fs.existsSync(LOGO)) fs.copyFileSync(LOGO, path.join(pub, "logo.png"));

// OPTIONAL: copy document page images produced by doc-to-images.sh
const copyPages = (srcDir, dstSub) => {
  if (!fs.existsSync(srcDir)) return 0;
  const dst = path.join(pub, dstSub); fs.mkdirSync(dst, { recursive: true });
  const ps = fs.readdirSync(srcDir).filter((f) => /^page-\d+\.png$/.test(f)).sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)));
  ps.forEach((p, i) => fs.copyFileSync(path.join(srcDir, p), path.join(dst, `page-${i + 1}.png`)));
  return ps.length;
};
const nOrig = copyPages("/path/to/source-pages", "doc-orig");
const nTrad = copyPages("/path/to/result-pages", "doc");

const dur = (f) => parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${f}"`).toString().trim());

const data = {
  fps: 30, width: 1920, height: 1080,
  module: { title: "Nombre del módulo", subtitle: "Propuesta de valor en una línea", tagline: "A2R Studio" },
  processingSeconds: null, // set if the module has an async wait (for the interstitial)
  // Split the recording into clips: each has its own playback speed + captions.
  // srcStart/srcEnd are ABSOLUTE seconds in flow.webm. Trim initial page-load dead time.
  clips: [
    { key: "browse", src: "flow.webm", srcStart: 5.0, srcEnd: 18.0, speed: 1.7, captions: [
      { a: 5.0, b: 12.0, step: "PASO 1", title: "Entramos al módulo" },
      { a: 12.0, b: 18.0, step: "PASO 2", title: "Vista general", sub: "…" },
    ]},
    { key: "config", src: "flow.webm", srcStart: 18.0, srcEnd: 34.0, speed: 1.1, captions: [
      { a: 18.0, b: 26.0, step: "PASO 3", title: "Configuración", sub: "Explica las opciones sin correr" },
    ]},
    // add more clips…
  ],
  docOrig: nOrig ? { pages: nOrig } : null,   // source doc scroll (optional)
  doc: nTrad ? { pages: nTrad } : null,       // result doc scroll (optional)
  scenes: { intro: 96, outro: 96, interstitial: 132, docScrollSpeedPxPerSec: 130 },
};

// clip durations in frames
data.flowDur = dur(path.join(pub, "flow.webm"));
fs.writeFileSync(path.join(R, "src", "data.json"), JSON.stringify(data, null, 2));
console.log("data.json written. flowDur", data.flowDur.toFixed(2), "orig", nOrig, "trad", nTrad);
