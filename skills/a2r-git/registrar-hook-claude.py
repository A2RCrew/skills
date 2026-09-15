#!/usr/bin/env python3
"""Anade el hook PreToolUse de A2R a un settings.json de Claude Code.

Se fusiona en lugar de sobrescribir: en ese fichero puede haber permisos y
hooks tuyos que no son nuestros. Si el hook ya esta, no hace nada.
"""
import json
import sys

RUTA_HOOK = "$CLAUDE_PROJECT_DIR/.git/hooks/claude-sin-push"

destino = sys.argv[1]

try:
    with open(destino, encoding="utf-8") as f:
        ajustes = json.load(f)
except FileNotFoundError:
    ajustes = {}
except json.JSONDecodeError as e:
    print(f"claude     {destino} no es JSON valido ({e}), sin tocar")
    sys.exit(0)

entradas = ajustes.setdefault("hooks", {}).setdefault("PreToolUse", [])

ya_esta = any(
    "claude-sin-push" in h.get("command", "")
    for entrada in entradas
    for h in entrada.get("hooks", [])
)
if ya_esta:
    print(f"claude     {destino} ya cortaba el push del agente")
    sys.exit(0)

entradas.append({
    "matcher": "Bash",
    "hooks": [{"type": "command", "command": RUTA_HOOK}],
})

with open(destino, "w", encoding="utf-8") as f:
    json.dump(ajustes, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"claude     {destino} corta el push del agente")
