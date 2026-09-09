#!/usr/bin/env bash
# a2r-release-review · archiva una revisión en el disco local.
# Uso: archive.sh <dir-de-trabajo> [repos-root] [fecha YYYY-MM-DD]
#   <dir-de-trabajo>: donde están report.html, report.md, report.json y las carpetas por repo
# Destino: <repos-root>/release-reviews/revision-<fecha>-v<versión de nimrod-multitenant>/
# La versión sale SIEMPRE del package.json de nimrod-multitenant: es la versión del producto.
# Antes de copiar pasa el redactor: si tiene que enmascarar algo, avisa y lo deja enmascarado.
set -uo pipefail
WORK="${1:?directorio de trabajo de la revisión}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${2:-${REPOS_ROOT:-$(dirname "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")}}"
DATE="${3:-$(date +%Y-%m-%d)}"

MT="$ROOT/nimrod-multitenant/package.json"
[ -f "$MT" ] || { echo "no encuentro $MT: nimrod-multitenant marca la versión del producto" >&2; exit 2; }
VERSION=$(node -p "require('$MT').version")
DEST="$ROOT/release-reviews/revision-$DATE-v$VERSION"

if [ -d "$DEST" ]; then
  echo "⚠ ya existe $DEST" >&2
  DEST="$DEST-$(date +%H%M)"
  echo "  → archivo en $DEST" >&2
fi
mkdir -p "$DEST"

# Redactor como puerta: enmascara in situ cualquier valor de credencial que se haya colado.
LEAKED=0
for f in report.html report.md report.json; do
  [ -f "$WORK/$f" ] || continue
  if ! node "$HERE/redact.mjs" "$WORK/$f" --in-place 2>>"$DEST/redaccion.log"; then LEAKED=1; fi
done
if [ "$LEAKED" = 1 ]; then
  echo "⚠ el redactor tuvo que enmascarar credenciales: revisa $DEST/redaccion.log y corrige el texto." >&2
  echo "  Esto cuenta como FALLO de la revisión, no como salvaguarda que funcionó." >&2
else
  echo "sin secretos en el informe" > "$DEST/redaccion.log"
fi

# El informe y sus datos. NO se copian diff.patch ni added-lines.txt: llevan el diff en crudo.
for f in report.html report.md report.json; do
  [ -f "$WORK/$f" ] && cp "$WORK/$f" "$DEST/revision-$DATE-v$VERSION.${f##*.}"
done
mkdir -p "$DEST/datos"
for d in "$WORK"/*/; do
  repo=$(basename "$d"); [ -f "$d/meta.json" ] || continue
  mkdir -p "$DEST/datos/$repo"
  cp "$d/meta.json" "$DEST/datos/$repo/" 2>/dev/null
  cp "$d/usecases.json" "$d/commits.tsv" "$d/signals.tsv" "$d/signal-secrets.txt" "$DEST/datos/$repo/" 2>/dev/null
done
cp "$WORK"/review-*.json "$WORK"/verify-*.json "$WORK"/verdicts.json "$DEST/datos/" 2>/dev/null

cat > "$DEST/README.md" <<MD
# Revisión $DATE · v$VERSION

- Informe: \`revision-$DATE-v$VERSION.html\` (ábrelo en el navegador) y \`.md\`
- Datos: \`datos/\` — meta.json y casos de uso por repo, JSON de revisores y verificadores
- Secretos: \`redaccion.log\`
- Artefacto publicado: ver \`artifact-url.txt\` si existe

Los artefactos de fase 0 con el diff en crudo NO se archivan aquí; se quedan en el directorio
de trabajo de la ejecución.
MD

echo "✔ archivado en $DEST" >&2
echo "$DEST"
