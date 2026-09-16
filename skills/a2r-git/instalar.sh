#!/usr/bin/env bash
# Deja este repositorio con los hooks y la configuracion de A2R. Se puede
# ejecutar dos veces sin que pase nada.
#
#   instalar.sh [--ramas "main releases"] [--issue si|no] [--claude-push si|no]
#               [--correo "a2r.com binpar.com"]
#
# Sin opciones respeta lo que ya hubiera configurado, o pone lo de por defecto
# si es la primera vez.
set -euo pipefail

ramas=""; ramas_dada=""; issue=""; claude_push=""; correo=""; correo_dada=""
while [ $# -gt 0 ]; do
  case "$1" in
    --ramas) ramas="${2-}"; ramas_dada=si; shift 2 ;;
    --issue) issue="${2-}"; shift 2 ;;
    --claude-push) claude_push="${2-}"; shift 2 ;;
    --correo) correo="${2-}"; correo_dada=si; shift 2 ;;
    *) echo "Opcion desconocida: $1"; exit 1 ;;
  esac
done
for par in "issue:$issue" "claude-push:$claude_push"; do
  valor="${par#*:}"
  if [ -n "$valor" ] && [ "$valor" != si ] && [ "$valor" != no ]; then
    echo "--${par%%:*} solo admite si o no."
    exit 1
  fi
done

raiz="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")" && pwd)}"
repo="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Esto no es un repositorio de git."
  exit 1
}
cd "$repo"

# Todo esto vive en .git, que es tuyo y no viaja: el repositorio del cliente no
# se llena de ficheros de A2R, y cada uno configura su clon como quiera. El
# estandar no lo reparte el repositorio, lo reparte el plugin.
gitdir="$(git rev-parse --git-dir)"
mkdir -p "$gitdir/hooks"
for origen in "$raiz"/githooks/*; do
  destino="$gitdir/hooks/$(basename "$origen")"
  if [ -f "$destino" ] && ! cmp -s "$origen" "$destino"; then
    echo "hooks      $destino ya existe y es distinto, sin tocar"
    continue
  fi
  cp "$origen" "$destino"
  chmod +x "$destino"
done
echo "hooks      $gitdir/hooks al dia"

# Lo que cambia de un repositorio a otro vive aqui, no dentro de los hooks, para
# poder cambiarlo sin reinstalar nada.
conf="$gitdir/a2r.conf"
if [ -f "$conf" ]; then . "$conf"; fi
: "${RAMAS_PROTEGIDAS=main master releases}"
: "${ISSUE_OBLIGATORIA=si}"
: "${CLAUDE_PUEDE_PUSHEAR=si}"
: "${DOMINIOS_CORREO=}"
if [ "$ramas_dada" = si ]; then RAMAS_PROTEGIDAS="$ramas"; fi
if [ -n "$issue" ]; then ISSUE_OBLIGATORIA="$issue"; fi
if [ -n "$claude_push" ]; then CLAUDE_PUEDE_PUSHEAR="$claude_push"; fi
if [ "$correo_dada" = si ]; then DOMINIOS_CORREO="$correo"; fi

cat > "$conf" <<CONF
# Generado por /a2r-git:init. Local a este clon; lo leen los hooks.

# Ramas que no aceptan commit ni push directo. Vacio, ninguna.
RAMAS_PROTEGIDAS="$RAMAS_PROTEGIDAS"

# Exigir la referencia de Linear (A2R-123) al final del asunto.
ISSUE_OBLIGATORIA=$ISSUE_OBLIGATORIA

# Dejar que Claude Code haga git push, o reservarlo a una persona.
CLAUDE_PUEDE_PUSHEAR=$CLAUDE_PUEDE_PUSHEAR

# Dominios de correo admitidos para commitear. Vacio, no se comprueba.
DOMINIOS_CORREO="$DOMINIOS_CORREO"
CONF
echo "reglas     ramas protegidas: ${RAMAS_PROTEGIDAS:-ninguna} | referencia de Linear: $ISSUE_OBLIGATORIA | push de Claude: $CLAUDE_PUEDE_PUSHEAR | correo: ${DOMINIOS_CORREO:-cualquiera}"

# Mejor enterarse ahora que en el primer commit rechazado.
if [ -n "$DOMINIOS_CORREO" ]; then
  actual="$(git config user.email 2>/dev/null || true)"
  encaja=no
  for dominio in $DOMINIOS_CORREO; do
    case "$actual" in *"@$dominio") encaja=si ;; esac
  done
  if [ "$encaja" = no ]; then
    echo "correo     ${actual:-sin configurar} no vale aqui, ajustalo antes de commitear:"
    echo "           git config user.email tu.nombre@${DOMINIOS_CORREO%% *}"
  fi
fi

# En settings.local.json, que es el de cada uno y no se commitea: como se porta
# tu agente es cosa tuya, no del equipo.
if [ "$CLAUDE_PUEDE_PUSHEAR" = no ]; then
  if command -v python3 >/dev/null; then
    mkdir -p .claude
    python3 "$raiz/registrar-hook-claude.py" .claude/settings.local.json
    # Es tuyo, asi que no deberia acabar en el repositorio de nadie.
    if ! git check-ignore -q .claude/settings.local.json; then
      echo "claude     .claude/settings.local.json no esta ignorado, anadelo a tu"
      echo "           excludesfile o al .gitignore del proyecto"
    fi
  else
    echo "claude     sin python3 para tocar .claude/settings.local.json, anadelo a mano"
  fi
fi

git config pull.rebase true
git config merge.ff only
git config rerere.enabled true
echo "config     pull.rebase, merge.ff only, rerere"

if grep -q '^## Git' CLAUDE.md 2>/dev/null; then
  echo "contexto   CLAUDE.md ya tenia la seccion ## Git"
else
  cat "$raiz/CLAUDE-git.md" >> CLAUDE.md
  echo "contexto   seccion ## Git anadida a CLAUDE.md"
fi

echo
echo "Esto es tu clon. Cada uno lo ejecuta en el suyo, y lo que tiene que valer"
echo "para todos (proteger main, exigir revision) va en los rulesets de GitHub."
