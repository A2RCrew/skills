#!/usr/bin/env bash
# Deja este repositorio con los hooks y la configuracion de A2R. Se puede
# ejecutar dos veces sin que pase nada.
set -euo pipefail

raiz="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")" && pwd)}"
repo="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Esto no es un repositorio de git."
  exit 1
}
cd "$repo"

# Los hooks se versionan en .githooks para que los tenga todo el equipo, no
# solo quien ejecute esto. .git/hooks no viaja con el repositorio.
mkdir -p .githooks
for origen in "$raiz"/githooks/*; do
  destino=".githooks/$(basename "$origen")"
  if [ -f "$destino" ] && ! cmp -s "$origen" "$destino"; then
    echo "hooks      $destino ya existe y es distinto, sin tocar"
    continue
  fi
  cp "$origen" "$destino"
  chmod +x "$destino"
done
echo "hooks      .githooks/ al dia"

git config core.hooksPath .githooks
git config pull.rebase true
git config merge.ff only
git config rerere.enabled true
echo "config     core.hooksPath, pull.rebase, merge.ff only, rerere"

if grep -q '^## Git' CLAUDE.md 2>/dev/null; then
  echo "contexto   CLAUDE.md ya tenia la seccion ## Git"
else
  cat "$raiz/CLAUDE-git.md" >> CLAUDE.md
  echo "contexto   seccion ## Git anadida a CLAUDE.md"
fi

echo
echo "Falta commitear .githooks/ para que le llegue al resto del equipo."
