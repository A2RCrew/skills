// Prepara las tomas de cada escena para Remotion y escribe src/timeline.json.
// Uso: node build-timeline.mjs [--clips]   (--clips recorta, concatena y convierte; sin él, solo el timeline)
// plan.json: cada escena dice su toma y sus tramos [desde, hasta] en segundos desde el inicio de la acción.
// Estructura esperada: <proyecto>/grabacion/{plan.json, clips/, este script} y <proyecto>/remotion/
// (copia de assets/remotion-narrated), con las voces en remotion/public/audio.
// CROP: recorte de cada toma. Por defecto quita la barra lateral de A2R Studio (288 px) a 1600×900;
// si lo cambias, ajusta también SRC_W y SRC_H en src/Video.tsx.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const CLIPS = path.join(HERE, 'clips');
const PUB = path.join(HERE, '..', 'remotion', 'public');
const SRC = path.join(HERE, '..', 'remotion', 'src');
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a]);
const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());
const plan = JSON.parse(fs.readFileSync(path.join(HERE, 'plan.json'), 'utf8'));
fs.mkdirSync(path.join(PUB, 'clips'), { recursive: true });

if (process.argv.includes('--clips')) {
  for (const s of plan.scenes.filter((x) => x.seg.length)) {
    const { start } = JSON.parse(fs.readFileSync(path.join(CLIPS, `${s.clip}.json`), 'utf8'));
    const parts = s.seg.map(([a, b], i) => {
      const out = path.join(CLIPS, `_part-${s.n}-${i}.mp4`);
      // Sin la barra lateral (288 px): el contenido del módulo a 1312×900.
      ff('-ss', String(start + a), '-to', String(start + b), '-i', path.join(CLIPS, `${s.clip}.webm`), '-vf', `${process.env.CROP ?? 'crop=1312:900:288:0'},fps=30`, '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-an', out);
      return out;
    });
    const out = path.join(PUB, 'clips', `s${s.n}.mp4`);
    if (parts.length === 1) fs.copyFileSync(parts[0], out);
    else {
      const list = path.join(CLIPS, `_list-${s.n}.txt`);
      fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
      ff('-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out);
    }
    ff('-i', out, '-frames:v', '1', path.join(PUB, 'clips', `s${s.n}-first.png`));
    ff('-sseof', '-0.1', '-i', out, '-frames:v', '1', '-update', '1', path.join(PUB, 'clips', `s${s.n}-last.png`));
    console.log(s.n, s.clip, dur(out).toFixed(2));
  }
}

const voiceDur = (id) => dur(path.join(PUB, 'audio', `${id}.wav`));
const norm = (w) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]/g, '');
/** Cada punto entra cuando la voz dice su palabra clave (tiempos de Whisper). */
const points = (s) => {
  const words = JSON.parse(fs.readFileSync(path.join(PUB, 'audio', `${s.voice}.words.json`), 'utf8'));
  const total = voiceDur(s.voice);
  let from = 0;
  return s.points.map(([kw, text], i, all) => {
    const k = norm(kw);
    const idx = words.findIndex((w, j) => j >= from && norm(w.word) === k);
    if (idx >= 0) { from = idx + 1; return [Number(Math.max(0, words[idx].start - 0.15).toFixed(2)), text]; }
    console.warn('   sin palabra', s.voice, kw);
    return [Number(((total * (i + 0.5)) / all.length).toFixed(2)), text];
  });
};
// La música se iguala a la pista con la que se ajustaron los volúmenes de Video.tsx (−18,8 LUFS):
// cualquier pista suena igual de alta bajo la voz, sin tocar Video.tsx.
const MUSIC_REF_LUFS = -18.8;
const lufs = (f) => {
  const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = stderr?.match(/"input_i"\s*:\s*"(-?[\d.]+)"/);
  return m ? Number(m[1]) : null;
};
const music = (rel) => {
  const file = path.join(PUB, rel);
  if (!fs.existsSync(file)) {
    throw new Error(`Falta la pista ${file}: descárgala de la carpeta de música (references/narrated-walkthrough.md)`);
  }
  const l = lufs(file);
  const gain = l === null ? 1 : Number((10 ** ((MUSIC_REF_LUFS - l) / 20)).toFixed(3));
  console.log('música', rel, l === null ? 'sin medir' : `${l} LUFS`, '→ ganancia', gain);
  return { file: rel, dur: dur(file), gain };
};
const timeline = {
  module: plan.module, introTitle: plan.introTitle, introSub: plan.introSub, outroTitle: plan.outroTitle,
  intro: { voice: plan.intro, voiceDur: voiceDur(plan.intro) },
  // Música opcional: plan.music = "music/<pista>.mp3", dentro de remotion/public. Solo pistas con licencia.
  music: plan.music ? music(plan.music) : null,
  scenes: plan.scenes.map((s) => ({
    n: s.n, label: s.label, title: s.title, voice: s.voice, voiceDur: voiceDur(s.voice), points: points(s),
    clip: s.seg.length ? `s${s.n}` : null, clipDur: s.seg.length ? dur(path.join(PUB, 'clips', `s${s.n}.mp4`)) : 0,
    wait: !!s.wait, after: s.after ?? null, outro: !!s.outro, maxRate: s.maxRate ?? 1.5, doc: s.doc ?? null, nuevo: !!s.nuevo,
  })),
};
fs.writeFileSync(path.join(SRC, 'timeline.json'), JSON.stringify(timeline, null, 1));
console.log('timeline ok');
