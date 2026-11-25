#!/bin/zsh
# Hoja de 6 fotogramas de una toma, para revisarla sin ver el vídeo entero.
# Uso: sheet.sh <dir-clips> <toma> t1 t2 t3 t4 t5 t6
#   Los tiempos son segundos desde el inicio de la acción (el `start` de <toma>.json).
#   Deja <dir-clips>/../check/<toma>-sheet.png.
# CROP: recorte de la toma. Por defecto quita la barra lateral de A2R Studio (288 px) a 1600×900.
D=$1; n=$2; shift 2
CROP=${CROP:-crop=1312:900:288:0}
S=$(node -e "console.log(require('$D/$n.json').start)")
mkdir -p $D/../check; i=0; args=()
for t in "$@"; do
  ffmpeg -y -loglevel error -ss $(echo "$S+$t"|bc) -i $D/$n.webm -frames:v 1 -vf "$CROP,scale=656:-1" $D/../check/$n-$i.png
  args+=(-i $D/../check/$n-$i.png); i=$((i+1))
done
ffmpeg -y -loglevel error "${args[@]}" -filter_complex "[0][1][2]hstack=3[a];[3][4][5]hstack=3[b];[a][b]vstack" $D/../check/$n-sheet.png && echo $D/../check/$n-sheet.png
