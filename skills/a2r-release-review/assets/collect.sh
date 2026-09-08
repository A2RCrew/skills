#!/usr/bin/env bash
# a2r-release-review · Fase 0 (determinista, sin modelo)
# Uso: collect.sh <rango-git> <dir-salida>
#   rango-git: "origin/main..HEAD", "v2.54.0..HEAD", "origin/main..origin/develop"
# Solo lee el repo y ejecuta checks. Nunca escribe en el árbol de trabajo ni en git.
set -uo pipefail

RANGE="${1:?rango git, p.ej. origin/main..HEAD}"
OUT="${2:?directorio de salida}"
mkdir -p "$OUT"
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BASE_REF="${RANGE%%..*}"
HEAD_REF="${RANGE##*..}"
[ "$BASE_REF" = "$HEAD_REF" ] && HEAD_REF="HEAD"

git fetch -q origin --tags 2>/dev/null || true
BASE_SHA=$(git rev-parse "$BASE_REF") || { echo "ref base inválida: $BASE_REF" >&2; exit 2; }
HEAD_SHA=$(git rev-parse "$HEAD_REF") || { echo "ref head inválida: $HEAD_REF" >&2; exit 2; }
MERGE_BASE=$(git merge-base "$BASE_SHA" "$HEAD_SHA")
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "?")
LAST_TAG=$(git describe --tags --abbrev=0 --match 'v*' "$BASE_SHA" 2>/dev/null || echo "")
DIRTY=$(git status --porcelain | wc -l | tr -d ' ')

log() { printf '%s\n' "$*" >&2; }
run() { # run <nombre> <cmd...>  → guarda log y exit code
  local name="$1"; shift
  log "▶ $name"
  ( "$@" ) > "$OUT/$name.log" 2>&1
  local rc=$?
  echo "$rc" > "$OUT/$name.rc"
  log "  ↳ rc=$rc"
}

# ── Diff y commits ──────────────────────────────────────────────────────────
git diff --name-status "$MERGE_BASE" "$HEAD_SHA" > "$OUT/files.tsv"
git diff --stat "$MERGE_BASE" "$HEAD_SHA" > "$OUT/stat.txt"
git diff "$MERGE_BASE" "$HEAD_SHA" > "$OUT/diff.patch"
git diff "$MERGE_BASE" "$HEAD_SHA" | grep -E '^\+[^+]' > "$OUT/added-lines.txt" || true
git log --no-merges --format='%H%x09%an%x09%ad%x09%s' --date=short "$MERGE_BASE..$HEAD_SHA" > "$OUT/commits.tsv"
git log --merges --format='%H%x09%s' "$MERGE_BASE..$HEAD_SHA" > "$OUT/merges.tsv"
git log --no-merges --format='%H%n%B%n==END==' "$MERGE_BASE..$HEAD_SHA" > "$OUT/commits-full.txt"

# Commits sin A2R-nnn ni en su mensaje ni en el merge que los trajo
: > "$OUT/commits-without-issue.tsv"
awk 'BEGIN{RS="==END==\n"} NF { if ($0 !~ /[Aa]2[Rr]-[0-9]+/) { n=split($0, L, "\n"); print L[1] "\t" L[2] } }' \
  "$OUT/commits-full.txt" | while IFS=$'\t' read -r sha subj; do
    [ -z "$sha" ] && continue
    m=$(git log --merges --ancestry-path --format='%s' "$sha..$HEAD_SHA" 2>/dev/null | tail -1)
    if ! grep -qiE 'a2r-[0-9]+' <<<"$m"; then printf '%s\t%s\n' "$sha" "$subj" >> "$OUT/commits-without-issue.tsv"; fi
  done

# Conventional commits: asuntos que no siguen type(scope)?: ...
grep -vE $'\t(feat|fix|chore|docs|refactor|perf|test|build|ci|style|revert)(\\([^)]*\\))?!?: ' "$OUT/commits.tsv" \
  | cut -f1,4 > "$OUT/commits-nonconventional.tsv" || true

# ── Partición por áreas ─────────────────────────────────────────────────────
mkdir -p "$OUT/areas"; rm -f "$OUT/areas/"*.txt
area_of() {
  case "$1" in
    scripts/migrations/*) echo migrations ;;
    *text-to-speech-v2*|*textToSpeechWorksV2*|*tts*) echo tts-v2 ;;
    src/app/api/*) echo api ;;
    src/lib/directus.ts|src/middleware.ts|src/app/\(auth\)/*|*sso*|*auth*) echo auth ;;
    src/data/*) echo data ;;
    src/lib/actions/*|src/validation/*) echo actions ;;
    src/components/*) echo components ;;
    src/app/*) echo app ;;
    src/lib/*|src/utils/*|src/hooks/*|src/types/*) echo lib ;;
    messages/*.json|src/i18n/*) echo i18n ;;
    src/model/*|src/models/*) echo data ;;
    scripts/*|.github/*|deploy/*|Dockerfile*|package.json|pnpm-lock.yaml|*.config.*|tsconfig*|.env*) echo scripts-ci ;;
    docs/*|*.md) echo docs ;;
    test/*|*.test.*|*.spec.*|vitest*) echo tests ;;
    *) echo other ;;
  esac
}
: > "$OUT/areas.tsv"
while IFS=$'\t' read -r status path rest; do
  [ -z "$path" ] && continue
  # renames: "R100  old  new" → usar destino
  case "$status" in R*|C*) path="$rest" ;; esac
  a=$(area_of "$path")
  printf '%s\t%s\t%s\n' "$a" "$status" "$path" >> "$OUT/areas.tsv"
  echo "$path" >> "$OUT/areas/$a.txt"
done < "$OUT/files.tsv"

# ── Señales por grep sobre líneas añadidas (candidatas, NO hallazgos) ───────
sig() { # sig <nombre> <regex-extendida>
  grep -nE "$2" "$OUT/added-lines.txt" > "$OUT/signal-$1.txt" 2>/dev/null || true
  echo "$1"$'\t'"$(wc -l < "$OUT/signal-$1.txt" | tr -d ' ')" >> "$OUT/signals.tsv"
}
: > "$OUT/signals.tsv"
sig destructive-migration '(deleteField|deleteCollection|deleteItems?\(|deleteRelation|dropField|DROP (TABLE|COLUMN)|updateField\([^)]*type)'
sig accesslevel-no-slash 'accessLevel["'"'"']?\s*[:=]\s*["'"'"'][a-z0-9_-]+["'"'"']'
sig english-error-match '(includes|match|test|startsWith|indexOf)\(\s*[/"'"'"'][^)]*(does not exist|do not exist|not found|forbidden|permission)'
sig secrets '(sk-[A-Za-z0-9]{20,}|sk-ant-[A-Za-z0-9-]{20,}|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}|xox[bpa]-[A-Za-z0-9-]+|-----BEGIN [A-Z ]*PRIVATE KEY)'
grep -nE '(pnpm|npm|yarn)\s+run\s+migrate\b' "$OUT/added-lines.txt" | grep -vE '^[0-9]+:\+\s*(\*|//|#|-|\|)' > "$OUT/signal-run-migrate.txt" || true
echo run-migrate$'\t'"$(wc -l < "$OUT/signal-run-migrate.txt" | tr -d ' ')" >> "$OUT/signals.tsv"
sig console-log 'console\.(log|debug)\('
sig admin-token '(admin_access|ADMIN_TOKEN|DIRECTUS_ADMIN|static_token)'
sig empty-list-as-nodata '(length\s*===?\s*0|\.length\s*\?|!\w+\.length)'
sig tts-projection 'fields\s*[:=]\s*\['
sig ts-ignore '@ts-(ignore|nocheck|expect-error)|as any|eslint-disable'

# Variables de entorno nuevas sin definir en ningún .env*
grep -oE 'process\.env\.[A-Z0-9_]+' "$OUT/added-lines.txt" | sort -u | sed 's/process\.env\.//' > "$OUT/env-used-added.txt" || true
: > "$OUT/env-new-undefined.txt"
while read -r v; do
  [ -z "$v" ] && continue
  if ! grep -qsE "^\s*$v\s*=" .env* 2>/dev/null && ! git grep -qE "process\.env\.$v\b" "$MERGE_BASE" -- . 2>/dev/null; then
    echo "$v" >> "$OUT/env-new-undefined.txt"
  fi
done < "$OUT/env-used-added.txt"

# package.json deps cambiadas sin lockfile
PKG_CHANGED=$(grep -cE $'\tpackage\\.json$' "$OUT/files.tsv" || true)
LOCK_CHANGED=$(grep -cE $'\tpnpm-lock\\.yaml$' "$OUT/files.tsv" || true)
DEPS_CHANGED=0
if [ "${PKG_CHANGED:-0}" -gt 0 ]; then
  git diff "$MERGE_BASE" "$HEAD_SHA" -- package.json | grep -E '^[+-]\s+"[@a-z]' | grep -vE '"(version|name)"' | grep -qE '"' && DEPS_CHANGED=1
fi

# ── Migraciones tocadas ─────────────────────────────────────────────────────
MIG_FILES=()
while read -r p; do MIG_FILES+=("$p"); done < <(awk -F'\t' '$1=="migrations" && $2!="D" {print $3}' "$OUT/areas.tsv" | grep -vE 'migration/(index|models)\.ts$' || true)
INDEX_CHANGED=$(grep -cE $'\tscripts/migrations/migration/index\\.ts$' "$OUT/files.tsv" || true)
git diff "$MERGE_BASE" "$HEAD_SHA" -- scripts/migrations/migration/index.ts > "$OUT/index-ts.diff" 2>/dev/null || true
# Líneas ejecutables (no comentadas) añadidas al index: cada una es una migración que correrá en el próximo migrate
grep -E '^\+\s*(await|run|import|[a-zA-Z])' "$OUT/index-ts.diff" | grep -vE '^\+\s*//' > "$OUT/index-ts-added-active.txt" || true

# ── Checks deterministas ────────────────────────────────────────────────────
if [ "${SKIP_INSTALL:-0}" != "1" ]; then run pnpm-install pnpm install --frozen-lockfile --prefer-offline; fi
run lint pnpm lint --max-warnings=0
CHANGED_TS=()
while read -r p; do [ -f "$p" ] && CHANGED_TS+=("$p"); done < <(awk -F'\t' '$2!="D" {print $3}' "$OUT/areas.tsv" | grep -E '\.(ts|tsx|js|jsx|mjs)$' || true)
if [ ${#CHANGED_TS[@]} -gt 0 ]; then run lint-changed pnpm exec eslint --max-warnings=0 "${CHANGED_TS[@]}"; else echo n/a > "$OUT/lint-changed.rc"; fi
if [ -s "$OUT/areas/i18n.txt" ]; then
  run i18n-parity-repo npx tsx scripts/checkTranslationParity.ts --quiet
  # Paridad solo de las claves añadidas en el rango: cada clave nueva debe existir en los 5 locales
  git diff "$MERGE_BASE" "$HEAD_SHA" -- 'messages/*.json' | grep -oE '^\+[[:space:]]*"[^"]+"[[:space:]]*:' | sed -E 's/^\+[[:space:]]*"([^"]+)".*/\1/' | sort -u > "$OUT/i18n-added-keys.txt" || true
  node -e '
    const fs=require("fs"); const [keysFile,out]=process.argv.slice(1);
    const locales=["es-ES","en-US","en-GB","ca-ES","eu-es"];
    const names=o=>{const out=new Set();(function walk(x){if(x&&typeof x==="object")for(const k of Object.keys(x)){out.add(k);walk(x[k]);}})(o);return out;};
    const dicts=Object.fromEntries(locales.map(l=>{try{return [l,names(JSON.parse(fs.readFileSync(`messages/${l}.json`,"utf8")))]}catch{return [l,null]}}));
    const keys=fs.readFileSync(keysFile,"utf8").split("\n").filter(Boolean);
    const rows=[];
    for(const k of keys){const miss=locales.filter(l=>dicts[l]&&!dicts[l].has(k));if(miss.length)rows.push(`${k}\t${miss.join(",")}`);}
    fs.writeFileSync(out,rows.join("\n")+(rows.length?"\n":""));
    console.log(`${keys.length} claves añadidas, ${rows.length} sin paridad`);
    process.exit(rows.length?1:0);
  ' "$OUT/i18n-added-keys.txt" "$OUT/i18n-added-keys-missing.tsv" > "$OUT/i18n-parity-range.log" 2>&1; echo $? > "$OUT/i18n-parity-range.rc"
fi
run tsc pnpm exec tsc --noEmit --pretty false
run circular-deps pnpm detect-circular-deps
if [ "${SKIP_TESTS:-0}" != "1" ]; then run vitest pnpm exec vitest run --reporter=dot; else echo skipped > "$OUT/vitest.rc"; fi
if [ ${#MIG_FILES[@]} -gt 0 ]; then
  run migration-grants    npx tsx scripts/checkMigrationFieldGrants.ts "${MIG_FILES[@]}"
  run migration-placement npx tsx scripts/checkMigrationPlacement.ts "${MIG_FILES[@]}"
  run migration-bench     npx tsx scripts/checkMigrationBench.ts "${MIG_FILES[@]}"
  run migration-tests     pnpm exec vitest run --project node scripts/migrations --reporter=dot
fi
if [ "${INDEX_CHANGED:-0}" -gt 0 ]; then run migration-index-comments pnpm run check:migration-comments; fi

# ── meta.json ───────────────────────────────────────────────────────────────
rc_of() { cat "$OUT/$1.rc" 2>/dev/null || echo "n/a"; }
cat > "$OUT/meta.json" <<JSON
{
  "repo": "$(basename "$REPO_ROOT")",
  "range": "$RANGE",
  "base_sha": "$BASE_SHA",
  "head_sha": "$HEAD_SHA",
  "merge_base": "$MERGE_BASE",
  "package_version": "$VERSION",
  "last_tag_on_base": "$LAST_TAG",
  "worktree_dirty_files": $DIRTY,
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "node": "$(node -v 2>/dev/null)",
  "pnpm": "$(pnpm -v 2>/dev/null)",
  "counts": {
    "commits": $(wc -l < "$OUT/commits.tsv" | tr -d ' '),
    "merges": $(wc -l < "$OUT/merges.tsv" | tr -d ' '),
    "files": $(wc -l < "$OUT/files.tsv" | tr -d ' '),
    "added_lines": $(wc -l < "$OUT/added-lines.txt" | tr -d ' '),
    "commits_without_issue": $(wc -l < "$OUT/commits-without-issue.tsv" | tr -d ' '),
    "commits_nonconventional": $(wc -l < "$OUT/commits-nonconventional.tsv" | tr -d ' '),
    "migration_files": ${#MIG_FILES[@]},
    "index_ts_changed": ${INDEX_CHANGED:-0},
    "index_ts_added_active_lines": $(wc -l < "$OUT/index-ts-added-active.txt" | tr -d ' '),
    "env_new_undefined": $(wc -l < "$OUT/env-new-undefined.txt" | tr -d ' '),
    "package_json_changed": ${PKG_CHANGED:-0},
    "lockfile_changed": ${LOCK_CHANGED:-0},
    "deps_changed": $DEPS_CHANGED
  },
  "checks": {
    "install": "$(rc_of pnpm-install)",
    "lint": "$(rc_of lint)",
    "lint_changed": "$(rc_of lint-changed)",
    "i18n_parity_range": "$(rc_of i18n-parity-range)",
    "i18n_parity_repo": "$(rc_of i18n-parity-repo)",
    "tsc": "$(rc_of tsc)",
    "circular_deps": "$(rc_of circular-deps)",
    "vitest": "$(rc_of vitest)",
    "migration_grants": "$(rc_of migration-grants)",
    "migration_placement": "$(rc_of migration-placement)",
    "migration_bench": "$(rc_of migration-bench)",
    "migration_tests": "$(rc_of migration-tests)",
    "migration_index_comments": "$(rc_of migration-index-comments)"
  }
}
JSON

log "✔ Fase 0 completada → $OUT"
awk -F'\t' '{c[$1]++} END {for (a in c) printf "  %-12s %d ficheros\n", a, c[a]}' "$OUT/areas.tsv" >&2
cat "$OUT/meta.json"
