#!/usr/bin/env node
// a2r-release-review · redactor de secretos.
// Uso:  redact.mjs <fichero> [--in-place] [--json]      (o por stdin si <fichero> es "-")
// Sustituye cualquier valor que parezca un secreto por ‹SECRETO REDACTADO · <tipo> · #<huella>›
// y escribe en stderr un inventario de qué se redactó (tipo, huella, cuántas veces).
// La huella son 4 hex de sha256 del valor: permite correlacionar apariciones sin revelar nada.
// Código de salida: 0 sin secretos, 3 si redactó algo (para poder usarlo como puerta).
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const file = args[0];
const inPlace = args.includes('--in-place');
const asJson = args.includes('--json');
if (!file) { console.error('uso: redact.mjs <fichero|-> [--in-place] [--json]'); process.exit(2); }

// Placeholders que NO son secretos (ejemplos, fixtures, variables sin resolver)
const PLACEHOLDER_WORD = '(?:tu|tus|your|my|mi|dummy|example|ejemplo|sample|fake|falso|test|prueba|changeme|cambiame|replace|reemplazar|redacted|redactado|placeholder|todo|pending|here|aqui|value|valor|key|clave|token|secret|secreto|password|contrasena|xxx+|yyy+|zzz+|123+|abc+|none|null|undefined|true|false)';
const PLACEHOLDER = new RegExp(
  `^(?:x{3,}|\\*{3,}|\\.{3,}|-{3,}|_{3,}|<[^>]*>|\\{\\{.*\\}\\}|\\$\\{.*\\}|%[A-Z_]+%|\\d+|` +
  `${PLACEHOLDER_WORD}(?:[-_. ]?${PLACEHOLDER_WORD})*)$`, 'i');

// [nombre, regexp, índice del grupo que contiene el valor a ocultar]
const RULES = [
  ['clave-privada', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g, 0],
  ['anthropic-api-key', /\bsk-ant-[A-Za-z0-9_\-]{16,}/g, 0],
  ['openrouter-api-key', /\bsk-or-(?:v\d-)?[A-Za-z0-9_\-]{16,}/g, 0],
  ['openai-api-key', /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_\-]{20,}/g, 0],
  ['github-token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{50,}/g, 0],
  ['slack-token', /\bxox[baprse]-[A-Za-z0-9-]{10,}/g, 0],
  ['aws-access-key-id', /\b(?:AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{16}\b/g, 0],
  ['google-api-key', /\bAIza[0-9A-Za-z_\-]{35}\b/g, 0],
  ['elevenlabs-api-key', /\bsk_[a-f0-9]{40,}\b/g, 0],
  ['jwt', /\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}/g, 0],
  ['bearer', /\b[Bb]earer\s+([A-Za-z0-9._\-]{20,})/g, 1],
  ['url-con-credenciales', /\b([a-z][a-z0-9+.\-]*:\/\/[^\s:@/]+:)([^\s@/]{4,})@/g, 2],
  // Asignaciones genéricas: TOKEN=, apiKey: "...", password: '...'
  ['credencial-en-asignacion',
    /\b([A-Za-z_][A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|APIKEY|API_KEY|ACCESS_KEY|PRIVATE_KEY|CREDENTIAL|CLIENT_SECRET|AUTH)[A-Za-z0-9_]*)\s*[:=]\s*["']([^"'\s]{8,})["']/gi, 2],
  ['credencial-en-env', /^\s*([A-Za-z_][A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|APIKEY|API_KEY|ACCESS_KEY|PRIVATE_KEY|CREDENTIAL|CLIENT_SECRET)[A-Za-z0-9_]*)=(?!\s*$)([^\s#]{8,})/gim, 2],
];

const fingerprint = (v) => createHash('sha256').update(v).digest('hex').slice(0, 4);

// Identificadores, no secretos: valor con separadores cuyos segmentos son palabras cortas de letras.
// Cubre 'x-ratelimit-remaining-tokens', 'application/json', 'user_access_token_header'.
// NO cubre blobs hex/base64 (sin separadores, o con segmentos largos y mezcla de dígitos).
const IDENTIFIER = /^[A-Za-z]{1,12}(?:[-_./][A-Za-z]{1,12})+$/;

export function redact(input) {
  let text = input;
  const found = [];
  for (const [kind, re, group] of RULES) {
    text = text.replace(re, (match, ...groups) => {
      const value = group === 0 ? match : groups[group - 1];
      const v = value?.trim();
      if (!v || PLACEHOLDER.test(v)) return match;
      // Las reglas genéricas (por nombre de variable) admiten falsos positivos: filtra identificadores.
      if (kind.startsWith('credencial-en-') && IDENTIFIER.test(v)) return match;
      const fp = fingerprint(value);
      found.push({ kind, fingerprint: fp, length: value.length });
      const mask = `‹SECRETO REDACTADO · ${kind} · #${fp}›`;
      return group === 0 ? mask : match.replace(value, mask);
    });
  }
  const inventory = {};
  for (const f of found) {
    const key = `${f.kind}#${f.fingerprint}`;
    inventory[key] ??= { kind: f.kind, fingerprint: f.fingerprint, length: f.length, occurrences: 0 };
    inventory[key].occurrences++;
  }
  return { text, inventory: Object.values(inventory) };
}

// ¿Se ha invocado como programa? Comparar rutas reales: si la skill se usa por un symlink
// (~/.claude/skills/... → el repo), process.argv[1] e import.meta.url NO coinciden y el bloque
// se saltaba en silencio, dejando el informe sin redactar.
const invokedAsScript = (() => {
  if (!process.argv[1]) return false;
  try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
})();
if (invokedAsScript) {
  const input = file === '-' ? readFileSync(0, 'utf8') : readFileSync(file, 'utf8');
  const { text, inventory } = redact(input);
  if (inPlace && file !== '-') writeFileSync(file, text); else if (!asJson) process.stdout.write(text);
  if (asJson) process.stdout.write(JSON.stringify(inventory, null, 2) + '\n');
  if (inventory.length) {
    console.error(`⚠ ${inventory.length} secreto(s) redactado(s)${file !== '-' ? ' en ' + file : ''}:`);
    for (const i of inventory) console.error(`   ${i.kind} · huella #${i.fingerprint} · ${i.length} caracteres · ${i.occurrences} aparición(es)`);
    process.exit(3);
  }
  console.error(`✔ sin secretos${file !== '-' ? ' en ' + file : ''}`);
}
