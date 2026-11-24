// Tiempos por palabra de cada locución con Whisper. Con ellos, cada punto de la columna
// izquierda entra justo cuando la voz dice su palabra clave.
//
// Uso: node whisper.mjs <dir-audio> [id,id...]
//   Escribe <id>.words.json y <id>.txt junto a cada <id>.wav.
//
// Clave: OPENAI_API_KEY en el entorno, o NIMROD_MT_DIR con la ruta del repo nimrod-multitenant,
// y entonces se lee de su .env. Idioma: WHISPER_LANG (es).
import fs from 'node:fs';
import path from 'node:path';

const MT = process.env.NIMROD_MT_DIR;

function readKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const file = MT && path.join(MT, '.env');
  if (file && fs.existsSync(file)) {
    return fs.readFileSync(file, 'utf8').match(/^OPENAI_API_KEY=["']?([^"'\n]+)/m)?.[1];
  }
  return undefined;
}

const key = readKey();
if (!key) throw new Error('Sin clave: define OPENAI_API_KEY o NIMROD_MT_DIR');
const LANG = process.env.WHISPER_LANG ?? 'es';

const [dir, only] = process.argv.slice(2);
if (!dir) throw new Error('Uso: node whisper.mjs <dir-audio> [id,id...]');

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.wav'))) {
  const id = f.replace('.wav', '');
  if (only && !only.split(',').includes(id)) continue;
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(path.join(dir, f))]), f);
  form.append('model', 'whisper-1');
  form.append('language', LANG);
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const j = await r.json();
  if (!j.words) {
    console.error(id, JSON.stringify(j).slice(0, 200));
    continue;
  }
  fs.writeFileSync(path.join(dir, `${id}.words.json`), JSON.stringify(j.words));
  fs.writeFileSync(path.join(dir, `${id}.txt`), j.text);
  console.log(id, '·', j.text);
}
