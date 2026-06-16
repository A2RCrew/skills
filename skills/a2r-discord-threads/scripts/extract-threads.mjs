#!/usr/bin/env node
// Extrae los hilos de los foros de asistencia del Discord de A2R en un rango de fechas.
// Uso: node extract-threads.mjs --from YYYY-MM-DD --to YYYY-MM-DD
import fs from 'fs';
import os from 'os';
import path from 'path';

// ---- args ----
function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const FROM = arg('from');
const TO = arg('to');
if (!FROM || !TO) {
  console.error('Faltan fechas. Uso: node extract-threads.mjs --from YYYY-MM-DD --to YYYY-MM-DD');
  process.exit(1);
}

// Validación estricta: exige formato YYYY-MM-DD y una fecha realmente existente
// (new Date() hace roll-over silencioso de fechas imposibles como 2026-13-40).
function parseStrictDate(s, label) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) {
    console.error(`Fecha ${label} inválida ("${s}"). Usa el formato YYYY-MM-DD.`);
    process.exit(1);
  }
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    console.error(`Fecha ${label} inexistente ("${s}").`);
    process.exit(1);
  }
  return { y, mo, d };
}

// El criterio de "fecha de creación" es hora local de A2R (Europe/Madrid),
// no UTC: un hilo creado a las 00:30 en España no debe caer en el día anterior.
function madridWallClockToUTC(dateStr, time) {
  const naive = new Date(`${dateStr}T${time}Z`).getTime(); // wall clock interpretado como UTC
  const sample = new Date(naive);
  const asUTC = new Date(sample.toLocaleString('en-US', { timeZone: 'UTC' }));
  const asMadrid = new Date(sample.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
  const offsetMs = asMadrid.getTime() - asUTC.getTime(); // ms que Madrid va por delante de UTC
  return naive - offsetMs; // UTC = wall - offset
}

parseStrictDate(FROM, 'inicio');
parseStrictDate(TO, 'fin');
const SINCE = madridWallClockToUTC(FROM, '00:00:00.000');
const UNTIL = madridWallClockToUTC(TO, '23:59:59.999');
if (Number.isNaN(SINCE) || Number.isNaN(UNTIL)) {
  console.error('Fechas inválidas. Usa el formato YYYY-MM-DD.');
  process.exit(1);
}
if (SINCE > UNTIL) {
  console.error(`El rango está invertido: la fecha de inicio (${FROM}) es posterior a la de fin (${TO}).`);
  process.exit(1);
}

// ---- credenciales ----
const credPath = path.join(os.homedir(), '.config', 'agent-messenger', 'discord-credentials.json');
let creds;
try {
  creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
} catch {
  console.error(`No se pudo leer ${credPath}. Ejecuta primero: npx -y agent-messenger discord auth extract`);
  process.exit(1);
}
const TOKEN = creds.token;
// Servidor de A2R (△² Ꝛ Framework). Fijo porque la skill es específica de A2R:
// así funciona aunque el "servidor activo" (current_server) de las credenciales
// de cada compañero sea otro. Solo cae a current_server si por algo faltara.
const A2R_GUILD = '1176965988114247680';
const GUILD = A2R_GUILD || creds.current_server;
const headers = { Authorization: TOKEN, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- nombres de cliente legibles ----
const DISPLAY = {
  mh: 'MH-Education', ie: 'IE', editex: 'Editex', edelvives: 'Edelvives',
  ilerna: 'Ilerna', sm: 'SM', oup: 'OUP', 'oup-uk': 'OUP UK', sanoma: 'Sanoma',
  uoc: 'UOC', iaas365: 'IaaS365', anaya: 'Anaya', universitasxxi: 'UniversitasXXI',
  gencat: 'GenCat', 'axia-sem': 'Axia SEM', kaizente: 'Kaizente',
};
function clientName(channelName) {
  let base = channelName
    .replace(/-asistencia-poc$/i, '')
    .replace(/-asistencia$/i, '')
    .replace(/-assistance$/i, '')
    .replace(/-poc$/i, '');
  return DISPLAY[base] || base.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---- fetch con reintento ante 429 ----
async function fetchRL(url) {
  for (let i = 0; i < 8; i++) {
    const res = await fetch(url, { headers });
    if (res.status === 429) {
      const j = await res.json().catch(() => ({}));
      await sleep((j.retry_after || 1) * 1000 + 300);
      continue;
    }
    return res;
  }
  return null;
}

async function getForumChannels() {
  const res = await fetchRL(`https://discord.com/api/v9/guilds/${GUILD}/channels`);
  if (!res || !res.ok) {
    console.error(`No se pudieron listar los canales del servidor (status ${res?.status}).`);
    process.exit(1);
  }
  const channels = await res.json();
  return channels
    .filter((c) => c.type === 15 && /(asistencia|assistance)/i.test(c.name))
    .map((c) => ({ id: c.id, name: c.name }));
}

async function getTagMap(channelId) {
  const res = await fetchRL(`https://discord.com/api/v9/channels/${channelId}`);
  if (!res || !res.ok) return {};
  const ch = await res.json();
  const map = {};
  for (const t of ch.available_tags || []) map[t.id] = t.name;
  return map;
}

const PAGINATION_CAP = 1000;
async function getThreads(channelId) {
  let all = [], offset = 0, capped = false;
  while (true) {
    const url = `https://discord.com/api/v9/channels/${channelId}/threads/search?sort_by=last_message_time&sort_order=desc&limit=25&offset=${offset}`;
    const res = await fetchRL(url);
    if (!res || !res.ok) {
      return { threads: all, error: res ? res.status : 'no-response', capped };
    }
    const data = await res.json();
    const threads = data.threads || [];
    all = all.concat(threads);
    if (!data.has_more || threads.length === 0) break;
    offset += threads.length;
    await sleep(400);
    if (offset > PAGINATION_CAP) { capped = true; break; }
  }
  return { threads: all, error: null, capped };
}

function createdMs(t) {
  if (t.thread_metadata?.create_timestamp) return new Date(t.thread_metadata.create_timestamp).getTime();
  return Number(BigInt(t.id) >> 22n) + 1420070400000; // fallback: snowflake
}

// ---- recolección ----
const forums = await getForumChannels();
const rows = [];
const failed = [];
const truncated = [];
for (const f of forums) {
  const tagMap = await getTagMap(f.id);
  await sleep(300);
  const { threads, error, capped } = await getThreads(f.id);
  if (error) failed.push({ name: f.name, status: error });
  if (capped) truncated.push(f.name);
  for (const t of threads) {
    const ms = createdMs(t);
    if (ms >= SINCE && ms <= UNTIL) {
      rows.push({
        client: clientName(f.name),
        title: t.name,
        tags: (t.applied_tags || []).map((id) => tagMap[id] || id),
        url: `https://discord.com/channels/${GUILD}/${t.id}`,
      });
    }
  }
  await sleep(500);
}

// ---- orden: primero Resuelto, luego alfabético por cliente ----
const isResuelto = (r) => r.tags.some((t) => /resuelto/i.test(t));
rows.sort((a, b) => {
  const ra = isResuelto(a), rb = isResuelto(b);
  if (ra !== rb) return ra ? -1 : 1;
  return a.client.localeCompare(b.client, 'es');
});

// ---- salida en tabla Markdown ----
const esc = (s) => String(s).replace(/\|/g, '\\|');
console.log(`\nHilos de foros de asistencia creados entre ${FROM} y ${TO} (${rows.length}):\n`);
console.log('| Cliente | Título | Etiqueta | Url |');
console.log('|---------|--------|----------|-----|');
for (const r of rows) {
  console.log(`| ${esc(r.client)} | ${esc(r.title)} | ${esc(r.tags.join(', '))} | ${r.url} |`);
}
console.log(`\nTOTAL: ${rows.length}`);
if (truncated.length) {
  console.error(`\n⚠️  Se alcanzó el tope de paginación (${PAGINATION_CAP} hilos) en: ${truncated.join(', ')}. Puede haber hilos no listados; reduce el rango de fechas para asegurar cobertura completa.`);
}
if (failed.length) {
  console.error(`\nForos no accesibles (omitidos): ${failed.map((f) => `${f.name} (${f.status})`).join(', ')}`);
}
