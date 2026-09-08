#!/usr/bin/env bash
# a2r-release-review · pre-escaneo de todos los repos para la entrevista.
# Uso: prescan.sh <repos-root> <out-dir> [repos.json]
# Solo lectura (git fetch incluido). Escribe <out-dir>/prescan.json y <out-dir>/prescan-<repo>/usecases.*
set -uo pipefail
ROOT="${1:?repos root}"; OUT="${2:?out dir}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CFG="${3:-$HERE/../references/repos.json}"
mkdir -p "$OUT"
KEYS=$(node -e "console.log(Object.keys(require('$CFG').repos).join(' '))")
cfg() { node -e "const r=require('$CFG').repos['$1'];const v=r['$2'];console.log(v==null?'':(typeof v==='object'?JSON.stringify(v):v))"; }

echo '{ "repos_root": "'"$ROOT"'", "generated_at": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'", "repos": {' > "$OUT/prescan.json"
first=1
for k in $KEYS; do
  dir="$ROOT/$(cfg "$k" dir)"; range="$(cfg "$k" default_range)"; note="$(cfg "$k" range_note)"
  [ $first = 1 ] || echo ',' >> "$OUT/prescan.json"; first=0
  if [ ! -d "$dir/.git" ]; then
    printf '  "%s": { "present": false, "dir": "%s" }' "$k" "$dir" >> "$OUT/prescan.json"; echo "✗ $k: no existe en $dir" >&2; continue
  fi
  ( cd "$dir" && git fetch -q --tags origin 2>/dev/null || true )
  base="${range%%..*}"; head="${range##*..}"
  bsha=$(cd "$dir" && git rev-parse -q --verify "$base^{commit}" 2>/dev/null || echo "")
  hsha=$(cd "$dir" && git rev-parse -q --verify "$head^{commit}" 2>/dev/null || echo "")
  commits=0; files=0; mb=""
  if [ -n "$bsha" ] && [ -n "$hsha" ]; then
    mb=$(cd "$dir" && git merge-base "$bsha" "$hsha")
    commits=$(cd "$dir" && git rev-list --count --no-merges "$mb..$hsha")
    files=$(cd "$dir" && git diff --name-only "$mb" "$hsha" | wc -l | tr -d ' ')
  fi
  last_tag=$(cd "$dir" && git describe --tags --abbrev=0 --match 'v*' origin/main 2>/dev/null || echo "")
  alt=""; altc=0
  if [ "$commits" = 0 ] && [ -n "$last_tag" ]; then alt="$last_tag..origin/main"; altc=$(cd "$dir" && git rev-list --count --no-merges "$last_tag..origin/main" 2>/dev/null || echo 0); fi
  dirty=$(cd "$dir" && git status --porcelain | wc -l | tr -d ' ')
  branch=$(cd "$dir" && git branch --show-current)
  version=$(cd "$dir" && node -p "require('./package.json').version" 2>/dev/null || echo "")
  mig=0; migdirs="[]"; idx_active=0
  if [[ "$(cfg "$k" features)" == *migrations* ]] && [ -n "$mb" ]; then
    migdirs=$(cd "$dir" && git diff --name-only "$mb" "$hsha" -- scripts/migrations/migration | awk -F/ 'NF>4 && $4!="tools" {print $4}' | sort -u | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.stringify(s.trim().split("\n").filter(Boolean))))')
    mig=$(node -e "console.log($migdirs.length)")
    idx_active=$(cd "$dir" && git show "$hsha:scripts/migrations/migration/index.ts" 2>/dev/null | grep -cE '^\s*(await|run[A-Z])' || true)
  fi
  ucjson="{}"
  if [ "$commits" != 0 ]; then
    mkdir -p "$OUT/prescan-$k"
    node "$HERE/usecases.mjs" "$k" "$dir" "$mb" "$hsha" "$OUT/prescan-$k" >/dev/null 2>&1 && \
      ucjson=$(node -e "const s=require('$OUT/prescan-$k/usecases.json');console.log(JSON.stringify(Object.fromEntries(Object.entries(s.use_cases).map(([k,v])=>[k,{files:v.files,commits:v.commits,issues:v.issues}]))))")
  fi
  printf '  "%s": { "present": true, "dir": "%s", "branch": "%s", "version": "%s", "range": "%s", "range_note": %s, "base_sha": "%s", "head_sha": "%s", "merge_base": "%s", "commits": %s, "files": %s, "last_tag": "%s", "alt_range": "%s", "alt_commits": %s, "dirty": %s, "pending_migration_dirs": %s, "index_ts_active_lines": %s, "use_cases": %s }' \
    "$k" "$dir" "$branch" "$version" "$range" "$(node -e "console.log(JSON.stringify(process.argv[1]||null))" "$note")" "$bsha" "$hsha" "$mb" "$commits" "$files" "$last_tag" "$alt" "$altc" "$dirty" "$migdirs" "$idx_active" "$ucjson" >> "$OUT/prescan.json"
  echo "✔ $k [$branch] $range → $commits commits, $files ficheros${last_tag:+, último tag $last_tag}${alt:+, alternativa $alt ($altc)}${mig:+, migraciones pendientes $mig}" >&2
done
echo '} }' >> "$OUT/prescan.json"
node -e "
const p=require('$OUT/prescan.json');const r=p.repos;
let files=0, ucs=new Set(), mig=0, repos=0;
for (const [k,v] of Object.entries(r)) { if(!v.present||!v.commits) continue; repos++; files+=v.files; Object.keys(v.use_cases||{}).forEach(u=>ucs.add(u)); mig+=(v.pending_migration_dirs||[]).length; }
const depth = (files>60 || ucs.size>=3 || mig>0 || repos>=3) ? 'detallado' : 'breve';
const reasons=[]; if(files>60) reasons.push(files+' ficheros'); if(ucs.size>=3) reasons.push(ucs.size+' casos de uso'); if(mig>0) reasons.push(mig+' migraciones pendientes'); if(repos>=3) reasons.push(repos+' repos con cambios');
p.recommendation={repos_with_changes:repos, files_total:files, use_cases:[...ucs], pending_migrations:mig, report_depth:depth, reasons};
require('fs').writeFileSync('$OUT/prescan.json', JSON.stringify(p,null,2)+'\n');
console.error('→ recomendación: informe '+depth+(reasons.length?' ('+reasons.join(', ')+')':''));
"
cat "$OUT/prescan.json"
