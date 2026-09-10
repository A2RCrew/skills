#!/usr/bin/env bash
# a2r-release-review · métricas de la ejecución.
# Uso: metrics.sh <dir-de-trabajo> <tokens-subagentes> [presupuesto-sesion] [restante-sesion]
# El tiempo sale del mtime de prescan.json (inicio) frente a ahora.
# Los tokens de los subagentes los suma el orquestador de los bloques <usage> de cada Agent.
set -uo pipefail
WORK="${1:?directorio de trabajo}"; SUB="${2:-0}"; TOTAL="${3:-}"; LEFT="${4:-}"
[ -f "$WORK/prescan.json" ] || { echo "no encuentro $WORK/prescan.json" >&2; exit 2; }
START=$(stat -f %m "$WORK/prescan.json" 2>/dev/null || stat -c %Y "$WORK/prescan.json")
NOW=$(date +%s); D=$((NOW-START)); M=$((D/60)); S=$((D%60))
printf 'Duración: %d min %02d s\n' "$M" "$S"
printf 'Tokens de los subagentes: %s\n' "$(printf "%'d" "$SUB" 2>/dev/null || echo "$SUB")"
if [ -n "$TOTAL" ] && [ -n "$LEFT" ]; then
  node -e "
    const t=$TOTAL,l=$LEFT,used=t-l;
    console.log('Contexto de la sesión: '+used.toLocaleString('es-ES')+' de '+t.toLocaleString('es-ES')+' tokens ('+(used/t*100).toFixed(1)+'%)');
  "
fi
echo "No se puede medir el porcentaje del plan del usuario: la skill solo ve el contador de sesión, no la cuota de la cuenta. Dilo así, sin estimarlo."
