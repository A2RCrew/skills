#!/bin/zsh
# Busca en el vídeo final nombres que no deben salir: OCR a 2 fotogramas por segundo con Tesseract.
# Uso: ocr-nombres.sh <video.mp4> <dir-trabajo>
#   Deja el texto de cada fotograma en <dir-trabajo>/ocr.txt y enseña las líneas sospechosas.
# NAMES: expresión de grep -E (sin distinguir mayúsculas) con lo que no puede aparecer. Por defecto
#   solo lleva marcas internas: añade siempre los clientes y los compañeros cuyos nombres salgan en
#   PRE (por ejemplo en «Creado por»), p. ej. NAMES='cliente1|cliente2|nombre apellido|humo|e2e'.
# OCR_LANG: idioma de Tesseract. Por defecto eng, porque spa no siempre está instalado y, si
#   falta, Tesseract falla sin avisar.
V=$1; D=$2; mkdir -p $D/f
NAMES=${NAMES:-'humo|e2e|local ·|prueba|a2r-[0-9]'}
OCR_LANG=${OCR_LANG:-eng}
ffmpeg -y -loglevel error -i $V -vf fps=2 $D/f/%05d.png
: > $D/ocr.txt
for f in $D/f/*.png; do
  t=$(tesseract $f - -l $OCR_LANG 2>/dev/null | tr '\n' ' ')
  echo "$(basename $f .png) $t" >> $D/ocr.txt
done
grep -inE "$NAMES" $D/ocr.txt | cut -c1-220
echo "fotogramas: $(ls $D/f | wc -l)"
