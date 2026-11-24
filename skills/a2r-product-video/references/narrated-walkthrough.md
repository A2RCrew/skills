# Walkthrough narrado

Es el formato de los vídeos para clientes de Generación de actividades (4:41) y Evaluaciones
(3:45). Tienen fondo oscuro de marca, la toma del producto en un marco a la derecha y, a la
izquierda, el paso, su título y unos puntos que entran cuando la voz los nombra. Llevan locución
de principio a fin y, si hay pista con licencia, música por debajo.

La locución manda: cada escena dura lo que su voz más un margen. Si la toma es más larga, se
acelera hasta un tope, y si es más corta, se queda quieta en su último fotograma.

## Carpetas del proyecto

```
<proyecto>/
  grabacion/
    guion.json            locuciones, una por escena (assets/narrated/guion.example.json)
    plan.json             escenas, tomas, tramos y puntos (assets/narrated/plan.example.json)
    tts.mjs  whisper.mjs  build-timeline.mjs   (de assets/narrated/)
    clips/                lo que deja la grabación: <toma>.webm y <toma>.json
    check/                hojas de fotogramas y OCR
  remotion/               copia de assets/remotion-narrated/ (después, npm i)
    public/audio/         <id>.wav y <id>.words.json
    public/clips/         lo que prepara build-timeline.mjs
    public/docs/          páginas PNG de los documentos que se enseñan
    public/music/         la pista, si la hay
    src/timeline.json     lo escribe build-timeline.mjs
```

## Orden de trabajo

1. **Guion.** Escribe `guion.json` con la voz de marca (`a2r-brand-voice`): tuteo, frases
   cortas y una o tres frases por escena. `v00` presenta el módulo y la última escena cierra
   con el lema. Para un vídeo de 4 a 5 minutos salen unas 600 palabras. Enséñaselo al usuario
   antes de grabar.
2. **Plan.** Escribe `plan.json`. De cada escena, mira:
   - `voice`: el id de su locución.
   - `clip`: el nombre de la toma.
   - `seg`: los tramos `[desde, hasta]` en segundos desde el `start` de la toma. Puede haber
     varios tramos, y se concatenan.
   - `points`: pares `[palabra clave, texto]`. Cada texto entra cuando Whisper oye la palabra
     clave en la locución. Elige palabras que suenen tal cual.
   - Opcionales:
     - `wait` pone la píldora «En segundo plano».
     - `after` pone una píldora al entrar, por ejemplo «Unos minutos después».
     - `nuevo` pone la píldora «Nuevo».
     - `doc` es una lista de PNG de `public/docs`, en lugar de toma. En ese caso, `seg` va
       vacío.
     - `maxRate` es la aceleración máxima de la toma (1,5 por defecto).
     - `outro` añade el cierre con el logo tras esa escena.
   - `music` va en la raíz: `"music/<pista>.mp3"` o `null`.
3. **Datos y grabación.** Prepara los datos DEMO y graba las tomas según
   [a2r-platform.md](a2r-platform.md) y `assets/playwright/walk-example.ts`. Revisa cada toma
   con `assets/checks/sheet.sh <dir-clips> <toma> t1…t6` antes de seguir. Ajustar tramos es
   barato; regrabar, no.
4. **Voz.** Lánzala con `node tts.mjs guion.json ../remotion/public/audio` y escucha cada
   pista. Para rehacer solo algunas: `node tts.mjs guion.json ../remotion/public/audio v03,v07`.
5. **Tiempos.** `node whisper.mjs ../remotion/public/audio` deja los tiempos de cada palabra.
   Si `build-timeline` dice «sin palabra», cambia la palabra clave por una que se oiga igual.
6. **Montaje.** `node build-timeline.mjs --clips` recorta, quita la barra lateral, concatena
   y escribe `src/timeline.json`. Sin `--clips` solo recalcula el timeline, por ejemplo
   después de rehacer una voz.
7. **Revisión.** Abre `npx remotion studio`. Saca un fotograma suelto con
   `npx remotion still Walkthrough --frame=<n> out/f.png` y compruébalo en cada escena que
   tenga algo tapado o renombrado.
8. **Render y volumen.**

   ```bash
   npx remotion render Walkthrough out/video.mp4
   ffmpeg -i out/video.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 out/final.mp4
   ```

   La voz sale de Gemini sobre −26 dB, así que `loudnorm` a −16 LUFS es obligatorio.
9. **Nombres.** Lanza `NAMES='…' assets/checks/ocr-nombres.sh out/final.mp4 ../grabacion/check/ocr`.
   Si sale un nombre, regraba o renombra esa toma. No lo tapes con un parche negro.

## Voz

- Por defecto es Gemini `gemini-3.8-flash-tts`, con la voz **Sulafat** en `es-ES`. El estilo
  base va en `tts.mjs` y cada locución puede añadir el suyo en `style`.
- La clave sale de `GOOGLE_GENERATIVE_AI_API_KEY` o del `.env.local` de nimrod-api
  (`NIMROD_API_DIR`). Para Whisper hace falta `OPENAI_API_KEY`, o el `.env` de
  nimrod-multitenant (`NIMROD_MT_DIR`).
- En inglés: `TTS_LANG=en-GB`, `WHISPER_LANG=en` y un `TTS_STYLE` en inglés. Los textos fijos
  del vídeo están en castellano en `Video.tsx`: las píldoras «Nuevo», «En segundo plano» y
  «Unos minutos después».

## Música

- Solo una pista con licencia: libre de derechos o comprada para uso comercial, aportada o
  aprobada por el usuario. Nunca descargues música con derechos.
- Va en `remotion/public/music/` y se indica en `plan.music`. Suena a 0,32 y baja a 0,10
  mientras habla la voz. Si es más corta que el vídeo, se repite con un fundido cruzado de
  3 s.

## Ritmo y montaje (constantes de `Video.tsx`)

- La voz entra 0,5 s después del corte (`LEAD`) y la escena sigue 0,8 s después de que acabe
  (`TAIL`).
- El cierre con el logo dura 3,6 s (`OUTRO_CARD`).
- Las tomas van recortadas a 1312×900, sin la barra lateral, en un marco de 1200 px a la
  derecha. Si cambias `CROP`, ajusta `SRC_W` y `SRC_H`.
- Los documentos se enseñan a dos columnas, con un desplazamiento lento.
- Tienes 30 fps, 1920×1080 y la barra de progreso abajo.
