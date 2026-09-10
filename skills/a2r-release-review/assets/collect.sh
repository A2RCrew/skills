#!/usr/bin/env bash
# a2r-release-review · Fase 0 (determinista, sin modelo) para UN repositorio.
# Uso: collect.sh <repo-key> <rango-git> <dir-salida> [repos.json]
#   repo-key: clave en references/repos.json (nimrod-multitenant, nimrod-api, …)
#   rango:    "origin/main..origin/develop", "v2.0.0..origin/main", …
# Variables: REPOS_ROOT (padre de los repos; por defecto el padre del repo actual),
#            SKIP_INSTALL=1, SKIP_TESTS=1, SKIP_LINT=1
# Solo lee el repo y ejecuta checks. Nunca escribe en el árbol de trabajo ni en git.
set -uo pipefail
# pnpm en modo no interactivo: sin esto, tras un pull que cambie el lockfile pide confirmación para
# purgar node_modules, aborta por no tener terminal (ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY) y
# tumba en cadena install, lint, typecheck y tests. Cualquier orden pnpm hace ese chequeo antes.
export CI="${CI:-true}"
REPO_KEY="${1:?repo-key}"; RANGE="${2:?rango git}"; OUT="${3:?dir salida}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CFG="${4:-$HERE/../references/repos.json}"
mkdir -p "$OUT"
cfg() { node -e "const r=require('$CFG').repos['$REPO_KEY'];if(!r){console.error('repo desconocido: $REPO_KEY');process.exit(2)};const v=r['$1'];console.log(v==null?'':(typeof v==='object'?JSON.stringify(v):v))"; }
ROOT="${REPOS_ROOT:-$(dirname "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")}"
REPO_DIR="$ROOT/$(cfg dir)"
[ -d "$REPO_DIR/.git" ] || { echo "no existe el repo: $REPO_DIR" >&2; exit 2; }
cd "$REPO_DIR"
FEATURES="$(cfg features)"
has() { [[ "$FEATURES" == *"\"$1\""* ]]; }

BASE_REF="${RANGE%%..*}"; HEAD_REF="${RANGE##*..}"; [ "$BASE_REF" = "$HEAD_REF" ] && HEAD_REF="HEAD"
git fetch -q --tags origin 2>/dev/null || true
BASE_SHA=$(git rev-parse "$BASE_REF^{commit}") || { echo "ref base inválida: $BASE_REF" >&2; exit 2; }
HEAD_SHA=$(git rev-parse "$HEAD_REF^{commit}") || { echo "ref head inválida: $HEAD_REF" >&2; exit 2; }
MERGE_BASE=$(git merge-base "$BASE_SHA" "$HEAD_SHA")
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "?")
LAST_TAG=$(git describe --tags --abbrev=0 --match 'v*' "$BASE_SHA" 2>/dev/null || echo "")
DIRTY=$(git status --porcelain | wc -l | tr -d ' ')

log() { printf '%s\n' "$*" >&2; }
run() { # run <nombre> <cmd string> [args...]  → log + rc
  local name="$1" cmd="$2"; shift 2
  [ -z "$cmd" ] && { echo "n/a" > "$OUT/$name.rc"; return; }
  log "▶ [$REPO_KEY] $name"
  ( bash -c "$cmd \"\$@\"" _ "$@" ) > "$OUT/$name.log" 2>&1; local rc=$?
  echo "$rc" > "$OUT/$name.rc"; log "  ↳ rc=$rc"
}

# ── Diff y commits ──────────────────────────────────────────────────────────
git diff --name-status "$MERGE_BASE" "$HEAD_SHA" > "$OUT/files.tsv"
git diff --stat "$MERGE_BASE" "$HEAD_SHA" > "$OUT/stat.txt"
git diff "$MERGE_BASE" "$HEAD_SHA" > "$OUT/diff.patch"
git diff "$MERGE_BASE" "$HEAD_SHA" | grep -E '^\+[^+]' > "$OUT/added-lines.txt" || true
git log --no-merges --format='%H%x09%an%x09%ad%x09%s' --date=short "$MERGE_BASE..$HEAD_SHA" > "$OUT/commits.tsv"
git log --merges --format='%H%x09%s' "$MERGE_BASE..$HEAD_SHA" > "$OUT/merges.tsv"
git log --no-merges --format='%H%n%B%n==END==' "$MERGE_BASE..$HEAD_SHA" > "$OUT/commits-full.txt"

: > "$OUT/commits-without-issue.tsv"
awk 'BEGIN{RS="==END==\n"} NF { if ($0 !~ /[Aa]2[Rr]-[0-9]+/) { split($0, L, "\n"); print L[1] "\t" L[2] } }' "$OUT/commits-full.txt" \
| while IFS=$'\t' read -r sha subj; do
    [ -z "$sha" ] && continue
    m=$(git log --merges --ancestry-path --format='%s' "$sha..$HEAD_SHA" 2>/dev/null | tail -1)
    grep -qiE 'a2r-[0-9]+' <<<"$m" || printf '%s\t%s\n' "$sha" "$subj" >> "$OUT/commits-without-issue.tsv"
  done
grep -vE $'\t(feat|fix|chore|docs|refactor|perf|test|build|ci|style|revert)(\\([^)]*\\))?!?: ' "$OUT/commits.tsv" | cut -f1,4 > "$OUT/commits-nonconventional.tsv" || true

# ── Casos de uso y áreas ────────────────────────────────────────────────────
node "$HERE/usecases.mjs" "$REPO_KEY" "$REPO_DIR" "$MERGE_BASE" "$HEAD_SHA" "$OUT" >&2 || log "  ↳ usecases.mjs falló"
node "$HERE/blastRadius.mjs" "$REPO_KEY" "$REPO_DIR" "$MERGE_BASE" "$HEAD_SHA" "$OUT" >&2 || log "  ↳ blastRadius.mjs falló"
area_of() {
  case "$1" in
    scripts/migrations/*) echo migrations ;;
    src/model/*|src/models/*) echo directus-model ;;
    src/app/api/*) echo api ;;
    src/data/*) echo data ;;
    src/lib/actions/*|src/validation/*|src/application/*|src/domain/*) echo actions ;;
    src/components/*) echo components ;;
    src/tasks/*|src/handlers/*|src/infrastructure/*) echo tasks ;;
    src/*) echo src ;;
    messages/*.json) echo i18n ;;
    deploy/*|Dockerfile*|.github/*|scripts/*|package.json|pnpm-lock.yaml|*.config.*|tsconfig*|.env*) echo scripts-ci ;;
    dist/*) echo dist ;;
    docs/*|*.md) echo docs ;;
    test/*|tests/*|__tests__/*|*.test.*|*.spec.*) echo tests ;;
    *) echo other ;;
  esac
}
: > "$OUT/areas.tsv"; mkdir -p "$OUT/areas"; rm -f "$OUT/areas/"*.txt
while IFS=$'\t' read -r status path rest; do
  [ -z "$path" ] && continue; case "$status" in R*|C*) path="$rest" ;; esac
  a=$(area_of "$path"); printf '%s\t%s\t%s\n' "$a" "$status" "$path" >> "$OUT/areas.tsv"; echo "$path" >> "$OUT/areas/$a.txt"
done < "$OUT/files.tsv"

# ── Señales por grep sobre líneas añadidas (candidatas, NO hallazgos) ───────
: > "$OUT/signals.tsv"
sig() { grep -nE "$2" "$OUT/added-lines.txt" > "$OUT/signal-$1.txt" 2>/dev/null || true; echo "$1"$'\t'"$(wc -l < "$OUT/signal-$1.txt" | tr -d ' ')" >> "$OUT/signals.tsv"; }
sig destructive-migration '(deleteField|deleteCollection|deleteItems?\(|deleteRelation|dropField|DROP (TABLE|COLUMN)|updateField\([^)]*type)'
sig accesslevel-no-slash 'accessLevel["'"'"']?\s*[:=]\s*["'"'"'][a-z0-9_-]+["'"'"']'
sig english-error-match '(includes|match|test|startsWith|indexOf)\(\s*[/"'"'"'][^)]*(does not exist|do not exist|not found|forbidden|permission)'
# Secretos: se registra QUÉ y DÓNDE, nunca el valor. signal-secrets.txt lleva fichero, línea y tipo;
# el valor solo existe como huella (4 hex de sha256) para poder correlacionar apariciones.
node "$HERE/scanSecrets.mjs" "$REPO_DIR" "$MERGE_BASE" "$HEAD_SHA" "$OUT" >/dev/null 2>>"$OUT/scan-secrets.log" || true
echo secrets$'\t'"$(wc -l < "$OUT/signal-secrets.txt" 2>/dev/null | tr -d ' ' || echo 0)" >> "$OUT/signals.tsv"
grep -nE '(pnpm|npm|yarn)\s+run\s+migrate\b' "$OUT/added-lines.txt" | grep -vE '^[0-9]+:\+\s*(\*|//|#|-|\|)' > "$OUT/signal-run-migrate.txt" || true
echo run-migrate$'\t'"$(wc -l < "$OUT/signal-run-migrate.txt" | tr -d ' ')" >> "$OUT/signals.tsv"
sig console-log 'console\.(log|debug|error|warn)\('
sig admin-token '(admin_access|ADMIN_TOKEN|DIRECTUS_ADMIN|static_token)'
sig empty-list-as-nodata '(length\s*===?\s*0|\.length\s*\?|!\w+\.length)'
sig directus-fields 'fields\s*[:=]\s*\['
sig ts-ignore '@ts-(ignore|nocheck|expect-error)|as any|eslint-disable'
sig process-exit 'process\.exit\('
sig raw-exec '\b(exec|execFile|spawn|execSync)\('
sig raw-fetch-timeout '(setGlobalDispatcher|AbortSignal\.timeout|new AbortController)'
sig any-type ':\s*any\b'
sig status-published "status['\"]?\s*[:=]\s*['\"]published['\"]"

# Variables de entorno nuevas sin definir en .env*, deploy/ ni en la base
grep -oE 'process\.env\.[A-Z0-9_]+' "$OUT/added-lines.txt" | sort -u | sed 's/process\.env\.//' > "$OUT/env-used-added.txt" || true
: > "$OUT/env-new-undefined.txt"
while read -r v; do
  [ -z "$v" ] && continue
  if ! grep -qsE "^\s*$v\s*=" .env* 2>/dev/null && ! grep -rqsE "\b$v\b" deploy/ 2>/dev/null && ! git grep -qE "process\.env\.$v\b" "$MERGE_BASE" -- . 2>/dev/null; then echo "$v" >> "$OUT/env-new-undefined.txt"; fi
done < "$OUT/env-used-added.txt"
# Nuevas claves zod requeridas en config (workers): candidatas a romper el arranque si no están en la task definition
git diff "$MERGE_BASE" "$HEAD_SHA" -- 'src/config/**' 'src/infrastructure/config/**' | grep -E '^\+.*z\.(string|number|enum|coerce)' | grep -vE 'optional\(|default\(' > "$OUT/env-zod-required-added.txt" || true

PKG_CHANGED=$(grep -cE $'\tpackage\\.json$' "$OUT/files.tsv" || true); LOCK_CHANGED=$(grep -cE $'\tpnpm-lock\\.yaml$' "$OUT/files.tsv" || true); DEPS_CHANGED=0
if [ "${PKG_CHANGED:-0}" -gt 0 ]; then git diff "$MERGE_BASE" "$HEAD_SHA" -- package.json | grep -E '^[+-]\s+"[@a-z]' | grep -vE '"(version|name|packageManager)"' | grep -qE '"' && DEPS_CHANGED=1; fi
DIST_CHANGED=$(grep -cE $'\tdist/' "$OUT/files.tsv" || true)
DEPLOY_CHANGED=$(grep -cE $'\tdeploy/' "$OUT/files.tsv" || true)
DOCKERFILE_CHANGED=$(grep -cE $'\t(deploy/docker/)?Dockerfile' "$OUT/files.tsv" || true)

# ── Hooks por feature ───────────────────────────────────────────────────────
MIG_FILES=(); INDEX_CHANGED=0
if has migrations; then
  while read -r p; do MIG_FILES+=("$p"); done < <(awk -F'\t' '$1=="migrations" && $2!="D" {print $3}' "$OUT/areas.tsv" | grep -vE 'migration/(index|models)\.ts$' || true)
  INDEX_CHANGED=$(grep -cE $'\tscripts/migrations/migration/index\\.ts$' "$OUT/files.tsv" || true)
  git diff "$MERGE_BASE" "$HEAD_SHA" -- scripts/migrations/migration/index.ts > "$OUT/index-ts.diff" 2>/dev/null || true
  grep -E '^\+\s*(await|run[A-Z]|import|[a-zA-Z])' "$OUT/index-ts.diff" | grep -vE '^\+\s*//' > "$OUT/index-ts-added-active.txt" || true
  # La lista autorizada de migraciones PENDIENTES son las líneas DESCOMENTADAS de index.ts:
  # los desarrolladores comentan la suya tras desplegarla, y el comentario dice en qué entornos.
  # (Antes se buscaba `^\s*(await|run…)`, que no casa con `migrateResult.migration_X = await …`
  #  y daba una sola línea cuando había seis: la revisión de migraciones miraba el conjunto
  #  equivocado, las carpetas tocadas por el diff en vez de las que se van a ejecutar.)
  git diff --name-only "$MERGE_BASE" "$HEAD_SHA" -- scripts/migrations/migration | awk -F/ 'NF>4 && $4!="tools" {print $4}' | sort -u > "$OUT/migration-dirs.txt" || true
  IDX=$(git show "$HEAD_SHA:scripts/migrations/migration/index.ts" 2>/dev/null)
  printf '%s\n' "$IDX" | grep -nE '^[[:space:]]*migrateResult\.[A-Za-z0-9_]+[[:space:]]*=[[:space:]]*await' > "$OUT/index-ts-active-at-head.txt" || true
  printf '%s\n' "$IDX" | grep -oE '^[[:space:]]*migrateResult\.(migration_[0-9A-Za-z_]+)' | sed -E 's/.*migrateResult\.migration_//' | tr '_' '-' | sed -E 's/^([0-9]{4})-([0-9]{2})-([0-9]{2})/\1-\2-\3/' | sort -u > "$OUT/migrations-pending.txt" || true
  printf '%s\n' "$IDX" | grep -oE '^[[:space:]]*//[[:space:]]*migrateResult\.(migration_[0-9A-Za-z_]+)' | sed -E 's/.*migrateResult\.migration_//' | tr '_' '-' | sort -u > "$OUT/migrations-deployed.txt" || true
  # cruce con las carpetas que toca el diff
  comm -13 "$OUT/migrations-pending.txt" <(sort -u "$OUT/migration-dirs.txt" 2>/dev/null || true) > "$OUT/migrations-changed-already-deployed.txt" || true
  comm -23 "$OUT/migrations-pending.txt" <(sort -u "$OUT/migration-dirs.txt" 2>/dev/null || true) > "$OUT/migrations-pending-foreign.txt" || true
  # Colecciones/campos que crean las migraciones del rango (para cruzar con otros repos)
  for f in "${MIG_FILES[@]}"; do git show "$HEAD_SHA:$f" 2>/dev/null; done | grep -oE "(collection|field)\s*:\s*['\"][A-Za-z0-9_]+['\"]" | sed -E "s/.*['\"]([A-Za-z0-9_]+)['\"]/\1/" | sort -u > "$OUT/migration-identifiers.txt" || true
fi
if has directus-model; then
  git diff "$MERGE_BASE" "$HEAD_SHA" -- 'src/model/directus*.ts' 'src/model/*.ts' 'src/infrastructure/directus/schema.ts' > "$OUT/directus-model.diff" 2>/dev/null || true
  grep -E '^[+-]\s+[a-zA-Z_]+\??:' "$OUT/directus-model.diff" | sed -E 's/^([+-])\s+([a-zA-Z_]+).*/\1\t\2/' | sort -u > "$OUT/directus-model-fields.tsv" || true
fi

# ── Checks deterministas ────────────────────────────────────────────────────
# Dos `pnpm install` simultáneos contra el mismo almacén se pisan: uno decide purgar node_modules
# mientras el otro escribe y el proceso muere sin dejar meta.json. Cerrojo por mkdir (atómico).
if [ "${SKIP_INSTALL:-0}" != 1 ]; then
  LOCK="${TMPDIR:-/tmp}/a2r-release-review-pnpm.lock"
  for _ in $(seq 1 600); do mkdir "$LOCK" 2>/dev/null && break; sleep 1; done
  trap 'rmdir "$LOCK" 2>/dev/null' EXIT INT TERM
  run install "$(cfg install)"
  rmdir "$LOCK" 2>/dev/null; trap - EXIT INT TERM
fi
if [ "${SKIP_LINT:-0}" != 1 ]; then
  run lint "$(cfg lint)"
  CHANGED_TS=(); while read -r p; do [ -f "$p" ] && CHANGED_TS+=("$p"); done < <(awk -F'\t' '$2!="D" {print $3}' "$OUT/areas.tsv" | grep -E '\.(ts|tsx|js|jsx|mjs)$' | grep -vE '^dist/' || true)
  if [ ${#CHANGED_TS[@]} -gt 0 ] && [ -n "$(cfg lint_files)" ]; then run lint-changed "$(cfg lint_files)" "${CHANGED_TS[@]}"; else echo n/a > "$OUT/lint-changed.rc"; fi
else echo skipped > "$OUT/lint.rc"; echo skipped > "$OUT/lint-changed.rc"; fi
run typecheck "$(cfg typecheck)"
if [ "${SKIP_TESTS:-0}" != 1 ]; then run test "$(cfg test)"; else echo skipped > "$OUT/test.rc"; fi
for name in $(node -e "console.log(Object.keys($(cfg extra_checks)).join(' '))"); do run "$name" "$(node -e "console.log($(cfg extra_checks)['$name'])")"; done
if has migrations && [ ${#MIG_FILES[@]} -gt 0 ]; then
  run migration-grants    "npx tsx scripts/checkMigrationFieldGrants.ts" "${MIG_FILES[@]}"
  run migration-placement "npx tsx scripts/checkMigrationPlacement.ts" "${MIG_FILES[@]}"
  run migration-bench     "npx tsx scripts/checkMigrationBench.ts" "${MIG_FILES[@]}"
  run migration-tests     "pnpm exec vitest run --project node scripts/migrations --reporter=dot"
fi
if has migrations && [ "${INDEX_CHANGED:-0}" -gt 0 ]; then run migration-index-comments "pnpm run check:migration-comments"; fi
if has i18n && [ -s "$OUT/areas/i18n.txt" ]; then
  run i18n-parity-repo "npx tsx scripts/checkTranslationParity.ts --quiet"
  git diff "$MERGE_BASE" "$HEAD_SHA" -- 'messages/*.json' | grep -oE '^\+[[:space:]]*"[^"]+"[[:space:]]*:' | sed -E 's/^\+[[:space:]]*"([^"]+)".*/\1/' | sort -u > "$OUT/i18n-added-keys.txt" || true
  node -e '
    const fs=require("fs"); const [keysFile,out]=process.argv.slice(1); const locales=["es-ES","en-US","en-GB","ca-ES","eu-es"];
    const names=o=>{const s=new Set();(function w(x){if(x&&typeof x==="object")for(const k of Object.keys(x)){s.add(k);w(x[k]);}})(o);return s;};
    const d=Object.fromEntries(locales.map(l=>{try{return [l,names(JSON.parse(fs.readFileSync(`messages/${l}.json`,"utf8")))]}catch{return [l,null]}}));
    const keys=fs.readFileSync(keysFile,"utf8").split("\n").filter(Boolean); const rows=[];
    for(const k of keys){const miss=locales.filter(l=>d[l]&&!d[l].has(k));if(miss.length)rows.push(`${k}\t${miss.join(",")}`);}
    fs.writeFileSync(out,rows.join("\n")+(rows.length?"\n":"")); console.log(`${keys.length} claves añadidas, ${rows.length} sin paridad`); process.exit(rows.length?1:0);
  ' "$OUT/i18n-added-keys.txt" "$OUT/i18n-added-keys-missing.tsv" > "$OUT/i18n-parity-range.log" 2>&1; echo $? > "$OUT/i18n-parity-range.rc"
fi

# ── meta.json ───────────────────────────────────────────────────────────────
node -e '
const fs=require("fs"); const out=process.argv[1]; const rc=n=>{try{return fs.readFileSync(`${out}/${n}.rc`,"utf8").trim()}catch{return "n/a"}};
const cnt=n=>{try{return fs.readFileSync(`${out}/${n}`,"utf8").split("\n").filter(Boolean).length}catch{return 0}};
const checks={}; for (const f of fs.readdirSync(out).filter(f=>f.endsWith(".rc"))) checks[f.replace(/\.rc$/,"")]=rc(f.replace(/\.rc$/,""));
let uc={}; try{uc=Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(`${out}/usecases.json`,"utf8")).use_cases).map(([k,v])=>[k,{files:v.files,commits:v.commits,issues:v.issues}]))}catch{}
let blast={}; try{const b=JSON.parse(fs.readFileSync(`${out}/blast-radius.json`,"utf8"));blast={...b.resumen,superficies:b.superficies.map(r=>({path:r.path,riesgo:r.riesgo,cambio:r.cambio,casos_afectados:r.casos_afectados,importadores:r.importadores_directos,declarado:r.declarado}))}}catch{}
const meta={repo:process.argv[2],repo_dir:process.argv[3],range:process.argv[4],base_sha:process.argv[5],head_sha:process.argv[6],merge_base:process.argv[7],package_version:process.argv[8],last_tag_on_base:process.argv[9],worktree_dirty_files:+process.argv[10],generated_at:new Date().toISOString(),
 counts:{commits:cnt("commits.tsv"),merges:cnt("merges.tsv"),files:cnt("files.tsv"),added_lines:cnt("added-lines.txt"),commits_without_issue:cnt("commits-without-issue.tsv"),commits_nonconventional:cnt("commits-nonconventional.tsv"),migration_files:+process.argv[11],migration_dirs:cnt("migration-dirs.txt"),index_ts_changed:+process.argv[12],index_ts_added_active_lines:cnt("index-ts-added-active.txt"),index_ts_active_at_head:cnt("index-ts-active-at-head.txt"),env_new_undefined:cnt("env-new-undefined.txt"),env_zod_required_added:cnt("env-zod-required-added.txt"),package_json_changed:+process.argv[13],lockfile_changed:+process.argv[14],deps_changed:+process.argv[15],dist_changed:+process.argv[16],deploy_changed:+process.argv[17],dockerfile_changed:+process.argv[18],directus_model_fields_changed:cnt("directus-model-fields.tsv")},
 use_cases:uc, superficies_compartidas:blast, checks};
fs.writeFileSync(`${out}/meta.json`, JSON.stringify(meta,null,2)+"\n"); console.log(JSON.stringify(meta.checks));
' "$OUT" "$REPO_KEY" "$REPO_DIR" "$RANGE" "$BASE_SHA" "$HEAD_SHA" "$MERGE_BASE" "$VERSION" "$LAST_TAG" "$DIRTY" "${#MIG_FILES[@]}" "${INDEX_CHANGED:-0}" "${PKG_CHANGED:-0}" "${LOCK_CHANGED:-0}" "$DEPS_CHANGED" "${DIST_CHANGED:-0}" "${DEPLOY_CHANGED:-0}" "${DOCKERFILE_CHANGED:-0}"
if [ -s "$OUT/signal-secrets.txt" ]; then
  log "⚠ [$REPO_KEY] posibles secretos en el diff: $(wc -l < "$OUT/signal-secrets.txt" | tr -d ' ') (ver signal-secrets.txt: tipo y ubicación, sin valores)"
fi
log "✔ [$REPO_KEY] fase 0 completada → $OUT"
log "  ℹ $OUT/diff.patch y added-lines.txt contienen el diff en crudo: son material de trabajo, NUNCA se copian al informe."
