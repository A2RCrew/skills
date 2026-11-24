// Locución de cada escena con Gemini TTS, por la Interactions API. Por defecto es la voz de los
// walkthroughs de A2R: Sulafat, en es-ES, con gemini-3.8-flash-tts.
//
// Uso: node tts.mjs <guion.json> <dir-salida> [id,id...]
//   guion.json: [{ "id": "v00", "text": "…", "style": "…" }]  (style es opcional y se suma al base)
//   dir-salida: normalmente ../remotion/public/audio, que es donde lee build-timeline.mjs
//   Con ids al final solo se rehacen esas locuciones.
//
// Clave: GOOGLE_GENERATIVE_AI_API_KEY en el entorno, o NIMROD_API_DIR con la ruta del repo
// nimrod-api, y entonces se lee de su .env.local. La clave nunca se imprime.
// Opcionales: TTS_VOICE (Sulafat), TTS_LANG (es-ES), TTS_MODEL (gemini-3.8-flash-tts) y
// TTS_STYLE (el estilo base de la locutora).
// Necesita ffmpeg, ffprobe y el paquete @google/genai (npm i @google/genai junto a este script,
// o el que ya tiene instalado nimrod-api).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const API = process.env.NIMROD_API_DIR;

function loadGenAI() {
  try {
    return createRequire(import.meta.url)('@google/genai');
  } catch {
    if (API) return createRequire(path.join(API, 'package.json'))('@google/genai');
    throw new Error('Falta @google/genai: npm i @google/genai, o define NIMROD_API_DIR');
  }
}

function readKey() {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const file = API && path.join(API, '.env.local');
  if (file && fs.existsSync(file)) {
    return fs.readFileSync(file, 'utf8').match(/^GOOGLE_GENERATIVE_AI_API_KEY=["']?([^"'\n]+)/m)?.[1];
  }
  return undefined;
}

const key = readKey();
if (!key) throw new Error('Sin clave: define GOOGLE_GENERATIVE_AI_API_KEY o NIMROD_API_DIR');
const { GoogleGenAI } = loadGenAI();
const client = new GoogleGenAI({ apiKey: key });

const VOICE = process.env.TTS_VOICE ?? 'Sulafat';
const LANG = process.env.TTS_LANG ?? 'es-ES';
const MODEL = process.env.TTS_MODEL ?? 'gemini-3.8-flash-tts';
const BASE_STYLE =
  process.env.TTS_STYLE ??
  'Locutora española de un vídeo de producto. Tono cercano, seguro y tranquilo, con una sonrisa ligera; ritmo pausado, sin prisa, pronunciación clara de España.';

const [guionPath, OUT, only] = process.argv.slice(2);
if (!guionPath || !OUT) throw new Error('Uso: node tts.mjs <guion.json> <dir-salida> [id,id...]');
const guion = JSON.parse(fs.readFileSync(guionPath, 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

for (const s of guion) {
  if (only && !only.split(',').includes(s.id)) continue;
  const style = [BASE_STYLE, s.style].filter(Boolean).join(' ');
  let interaction;
  for (let i = 0; i < 3; i++) {
    try {
      interaction = await client.interactions.create({
        model: MODEL,
        input: [{ type: 'user_input', content: [{ type: 'text', text: s.text, annotations: [{ type: 'speech_metadata', style }] }] }],
        response_format: { type: 'audio', mime_type: 'audio/l16' },
        generation_config: { temperature: 1, speech_config: [{ voice: VOICE, language: LANG }] },
      });
      if (interaction.output_audio?.data) break;
    } catch (e) {
      console.warn(s.id, 'reintento', i, e.message?.slice(0, 120));
    }
  }
  const data = interaction?.output_audio?.data;
  if (!data) {
    console.error(s.id, 'sin audio');
    continue;
  }
  // Llega PCM de 16 bits, 24 kHz y mono. Se pasa a WAV sin los silencios del principio y del final.
  const pcm = path.join(OUT, `${s.id}.pcm`);
  fs.writeFileSync(pcm, Buffer.from(data, 'base64'));
  const wav = path.join(OUT, `${s.id}.wav`);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm,
    '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse',
    wav,
  ]);
  fs.rmSync(pcm);
  const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString().trim();
  console.log(s.id, 'ok', Number(dur).toFixed(2), 's');
}
