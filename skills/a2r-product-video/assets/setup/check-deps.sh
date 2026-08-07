#!/bin/bash
# A2R product-video — dependency doctor.
# Verifies the host tools and npm packages the workflow needs, and installs the
# ones that are safely auto-installable. Run it at the START of the workflow.
#
#   bash check-deps.sh [recorder-project-dir] [remotion-project-dir]
#
# It NEVER touches production or the app — it only checks/install local tooling.

set -u
REC_DIR="${1:-}"
REM_DIR="${2:-}"
ok=0; warn=0

say()  { printf "  %s\n" "$1"; }
good() { printf "  ✔ %s\n" "$1"; }
miss() { printf "  ✗ MISSING: %s\n" "$1"; warn=$((warn+1)); }

echo "== Host tools =="
command -v node >/dev/null && good "node $(node -v)" || miss "Node.js (https://nodejs.org)"
command -v ffmpeg >/dev/null && good "ffmpeg" || miss "ffmpeg  (brew install ffmpeg)"
command -v pdftoppm >/dev/null && good "poppler (pdftoppm)" || miss "poppler (brew install poppler) — only needed for document scroll scenes"
if [ -x "/Applications/LibreOffice.app/Contents/MacOS/soffice" ] || command -v soffice >/dev/null || command -v libreoffice >/dev/null; then
  good "LibreOffice (soffice)"
else miss "LibreOffice (https://www.libreoffice.org) — only needed for document scroll scenes"; fi
if [ -d "/Applications/Google Chrome.app" ] || command -v google-chrome >/dev/null; then
  good "Google Chrome"
else miss "Google Chrome — required for viewport-only recording via channel:'chrome'"; fi

echo "== Recorder project (playwright-core + playwright ffmpeg) =="
if [ -n "$REC_DIR" ] && [ -d "$REC_DIR" ]; then
  ( cd "$REC_DIR"
    [ -f package.json ] || { npm init -y >/dev/null 2>&1; npm pkg set type=module >/dev/null 2>&1; }
    node -e "require.resolve('playwright-core')" 2>/dev/null && echo "  ✔ playwright-core" || { echo "  … installing playwright-core"; npm i playwright-core --no-audit --no-fund --loglevel=error; }
    npx --yes playwright install ffmpeg >/dev/null 2>&1 && echo "  ✔ playwright ffmpeg" || echo "  ! run: npx playwright install ffmpeg"
  )
else say "skip (pass the recorder project dir to auto-install)"; fi

echo "== Remotion project (@remotion + google-fonts) =="
if [ -n "$REM_DIR" ] && [ -d "$REM_DIR" ]; then
  ( cd "$REM_DIR"
    node -e "require.resolve('@remotion/google-fonts/package.json')" 2>/dev/null && echo "  ✔ @remotion/google-fonts" || { echo "  … installing @remotion/google-fonts"; npm i @remotion/google-fonts --no-audit --no-fund --loglevel=error; }
  )
else say "skip (create with: npx create-video@latest --yes --blank --no-tailwind)"; fi

echo
if [ "$warn" -gt 0 ]; then
  echo "⚠ $warn missing host tool(s). Install the required ones before recording/rendering."
else
  echo "✔ All host tools present."
fi
