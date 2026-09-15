---
description: Monta este repositorio con los hooks de git y la configuracion del estandar de A2R.
allowed-tools: Bash
---

Ejecuta `${CLAUDE_PLUGIN_ROOT}/instalar.sh` y ensena su salida.

Si el script dice que algun hook ya existia y es distinto, abrelo, comparalo con
el de `${CLAUDE_PLUGIN_ROOT}/githooks/` y anade lo que falte sin quitar lo que
hubiera: puede ser una comprobacion propia del proyecto.

Al terminar, recuerda que `.githooks/` hay que commitearlo para que le llegue al
resto del equipo, y que los rulesets de GitHub se activan a mano.
