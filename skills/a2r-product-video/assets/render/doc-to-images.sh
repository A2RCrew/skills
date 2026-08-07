#!/bin/bash
# A2R product-video — turn a document into page PNGs for a Remotion scroll scene.
#
# Converts .docx/.pptx/.xlsx/.pdf -> PDF (LibreOffice) -> page PNGs (poppler).
# Use it on the SOURCE file (to show the "before") and/or the TRANSLATED/result
# file downloaded from the app (to show the "after").
#
# Requires: LibreOffice (soffice) and poppler (pdftoppm).
#   macOS: /Applications/LibreOffice.app/Contents/MacOS/soffice ; brew install poppler
#
# Usage:
#   ./doc-to-images.sh <input-file> <output-dir> [dpi]
# Output: <output-dir>/page-1.png ... page-N.png  (also prints the page count)

set -e
IN="$1"; OUT="$2"; DPI="${3:-150}"
SOFFICE="${SOFFICE:-/Applications/LibreOffice.app/Contents/MacOS/soffice}"
[ -x "$SOFFICE" ] || SOFFICE="$(command -v soffice || command -v libreoffice)"

[ -z "$IN" ] || [ -z "$OUT" ] && { echo "usage: doc-to-images.sh <input> <outdir> [dpi]"; exit 1; }
mkdir -p "$OUT"
ext="${IN##*.}"

if [ "$ext" = "pdf" ] || [ "$ext" = "PDF" ]; then
  PDF="$IN"
else
  "$SOFFICE" --headless --convert-to pdf --outdir "$OUT" "$IN" \
    -env:UserInstallation=file:///tmp/lo_a2r_video_profile >/dev/null 2>&1
  PDF="$OUT/$(basename "${IN%.*}").pdf"
fi

rm -f "$OUT"/page-*.png
pdftoppm -png -r "$DPI" "$PDF" "$OUT/page"
# pdftoppm zero-pads (page-01); normalize to page-1, page-2, ...
i=1
for f in $(ls "$OUT"/page-*.png | sort -V); do
  mv -f "$f" "$OUT/page-$i.png.tmp"; i=$((i+1))
done
i=1
for f in $(ls "$OUT"/page-*.png.tmp | sort -V); do
  mv -f "$f" "$OUT/page-$i.png"; i=$((i+1))
done
echo "pages: $(ls "$OUT"/page-*.png | wc -l | tr -d ' ')  ->  $OUT"
