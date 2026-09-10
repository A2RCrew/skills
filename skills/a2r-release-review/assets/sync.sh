#!/usr/bin/env bash
# a2r-release-review · pone los árboles de trabajo al día antes de medir.
# Uso: sync.sh <repos-root> [rama] [repos.json]
# Los gates (lint, typecheck, tests) se ejecutan sobre el árbol local: si está atrasado, miden
# código que no es el que se sube. Este script hace fetch, guarda en stash lo que haya sin
# commitear, cambia a la rama pedida y hace pull --ff-only.
#
# ESCRIBE en los repos (stash, checkout, pull). Es la única parte de la skill que lo hace y
# requiere que el usuario lo haya autorizado en la entrevista. Nunca hace merge ni rebase: si la
# rama local ha divergido, lo dice y sigue con el resto.
set -uo pipefail
ROOT="${1:?repos root}"; BRANCH="${2:-develop}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CFG="${3:-$HERE/../references/repos.json}"
STAMP="a2r-release-review $(date +%Y-%m-%d\ %H:%M): guardado antes de actualizar"
KEYS=$(node -e "console.log(Object.keys(require('$CFG').repos).join(' '))")

printf '%s\n' "[" > /tmp/.a2r-sync-$$.json
first=1
for k in $KEYS; do
  dir="$ROOT/$(node -e "console.log(require('$CFG').repos['$k'].dir)")"
  [ -d "$dir/.git" ] || { echo "✗ $k: no existe $dir" >&2; continue; }
  git -C "$dir" fetch -q origin 2>/dev/null
  stashed="no"; diverged="no"
  dirty=$(git -C "$dir" status --porcelain)
  if [ -n "$dirty" ]; then
    n=$(printf '%s\n' "$dirty" | wc -l | tr -d ' ')
    if git -C "$dir" stash push -u -m "$STAMP" >/dev/null 2>&1; then
      stashed="sí ($n ficheros)"
      echo "⚠ $k: $n fichero(s) sin commitear guardados en stash. Recupéralos con: git -C $dir stash pop" >&2
      printf '%s\n' "$dirty" | sed 's/^/     /' >&2
    else stashed="falló"; echo "✗ $k: no se pudo guardar el stash, lo dejo como está" >&2; fi
  fi
  before=$(git -C "$dir" rev-parse --short HEAD)
  cur=$(git -C "$dir" branch --show-current)
  if [ "$cur" != "$BRANCH" ]; then
    if ! git -C "$dir" checkout -q "$BRANCH" 2>/dev/null; then
      echo "✗ $k: no pude cambiar de $cur a $BRANCH" >&2; diverged="sí"
    fi
  fi
  if [ "$diverged" = "no" ] && ! git -C "$dir" pull --ff-only -q origin "$BRANCH" 2>/dev/null; then
    diverged="sí"; echo "⚠ $k: la rama local ha divergido de origin/$BRANCH; NO hago merge ni rebase, resuélvelo tú" >&2
  fi
  after=$(git -C "$dir" rev-parse --short HEAD)
  al_dia=$([ "$after" = "$(git -C "$dir" rev-parse --short "origin/$BRANCH" 2>/dev/null)" ] && echo true || echo false)
  [ $first = 1 ] || echo ',' >> /tmp/.a2r-sync-$$.json; first=0
  printf '  {"repo":"%s","antes":"%s","despues":"%s","rama":"%s","stash":"%s","divergida":"%s","al_dia":%s}' \
    "$k" "$before" "$after" "$(git -C "$dir" branch --show-current)" "$stashed" "$diverged" "$al_dia" >> /tmp/.a2r-sync-$$.json
  if [ "$before" = "$after" ]; then echo "✔ $k: ya al día en $after" >&2
  else echo "✔ $k: $before → $after ($(git -C "$dir" rev-list --count "$before..$after" 2>/dev/null) commits)" >&2; fi
done
printf '\n]\n' >> /tmp/.a2r-sync-$$.json
cat /tmp/.a2r-sync-$$.json; rm -f /tmp/.a2r-sync-$$.json
