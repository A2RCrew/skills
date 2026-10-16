---
name: obs-transcript
description: Generate meeting notes (summary, attendees, next steps per person/company, full per-speaker transcript) in Markdown from an OBS recording of a video call (Teams, Zoom, etc.). Use when the user runs /obs-transcript or asks to transcribe / take notes of a recorded meeting.
argument-hint: "[filtro opcional, p.ej. 'la reunión de hace 10 min' o 'la de ayer con el cliente']"
---

# /obs-transcript

Turns an OBS recording into `<transcripts_dir>/<name>.md` in the current repo, Gemini-notes style, with per-speaker turns.

Helper: `$H` = `uv run --script <base>/scripts/obs_transcript.py`, where `<base>` is this skill's **Base directory** (Claude Code shows it on invocation and it differs per machine; never hardcode a user path). Python deps are auto-installed by uv. All output is JSON.

**Requirements:** macOS on Apple Silicon (Whisper runs on MLX), OBS Studio, and `brew install uv ffmpeg tesseract`. Everything runs locally: no audio or video leaves the machine. If a tool is missing, tell the user the exact `brew install` and stop.

How speakers are found (two independent signals; in internal benchmarks they agreed on 95% (Teams, 6 people) and 98.5% (Discord, 3 people) of speech):
1. **Video:** the call app marks the active speaker; the helper samples at 2 fps.
   - *Auto mode* (Teams, Zoom grids with name labels): finds the highlight border and OCRs the tile's name label.
   - *Regions mode* (`--regions`, for Discord or anything without labels / with a fixed layout): checks the ring colour inside named bboxes that you define.
2. **Voice:** speech is cut into chunks at pauses. Chunks with clear video evidence teach each person's voiceprint (ECAPA). Everything else — layout hidden, screen share, own tile — is classified by voice. Isolated flips are smoothed.

Known highlight colours: Teams dark `138,127,245` (default; the user's own tile never lights up → `--me`); Discord `40,155,90` green ring around the avatar (own avatar does light up → **no** `--me`).

## 1. Global config (asked once)

`~/.config/obs-transcript/config.json` holds `obs_dir` and `me` (the user's display name in calls).

- Run `$H obs-dir`. It auto-detects the folder from OBS's active profile and saves it. `newly_detected: true` → mention it in one line. `obs_dir: null` → ask, then `$H set-obs-dir <path>`.
- If `me` is missing, take it from the self-view tile in step 4 (it usually matches the account name, e.g. "Ana García") and save it in that JSON.

## 2. Pick the recording

`$H list -n 10` → path, ended_at, minutes_ago, duration, cached_transcript, plus `now`.

- If `$ARGUMENTS` is non-empty, use it to filter/rank candidates (relative time like "hace 10 min" vs `minutes_ago`; dates; duration). File names are OBS **start** timestamps (`YYYY-MM-DD HH-MM-SS`).
- Always ask with **AskUserQuestion**, offering the **2–3 best candidates**. Label: `HH:MM · <duration>` (+ hoy/ayer/date). Description: file name, minutes ago, "(ya transcrita)" if cached. Mark the best one "(Recommended)". Ask even when there is only one candidate.

## 3. Repo config (asked once per repo)

Read `.claude/obs-transcript.json` at the repo root (git root, else cwd). If it exists, don't ask anything.

If it's missing: reuse an existing `docs/transcripts`, `docs/meetings`, `docs/reuniones`, `meetings` or `transcripts` folder. If none exists, ask with AskUserQuestion: `docs/transcripts/` (Recommended), `docs/meetings/`, or outside the repo. Then write:

```json
{ "transcripts_dir": "docs/transcripts", "naming": "{date}-{time}-{slug}.md", "language": "es", "glossary": {} }
```

Naming: `{date}`=`YYYY-MM-DD`, `{time}`=`HHMM` of the recording **start**; `{slug}` = kebab-case ASCII ≤6 words `<org-or-counterpart>-<topic>` (e.g. `acme-kickoff-despliegue-aws`). On collision, append `-2`.

`glossary` maps recurring ASR mistakes to the right term (`"LCR": "ECR"`, `"Get Hub": "GitHub"`, misheard names). It is per repo and grows every run (step 6).

## 4. Look at the video (always)

`$H frames "<path>" -n 4` → 4 stills + a contact sheet. **Read them** (images) to get:
- **Attendees:** exact tile labels (e.g. `Pérez López, Marta`) — including people with camera off and avatar-only tiles. Also scan the sheet: layouts change (someone turns on a camera, screen share, zoom). Anyone on screen is an attendee even if silent.
- **Self tile** → `me`. Organisation hints: backgrounds/logos, shirts, email domains in chat, guest icons.
- **Context:** window/meeting title, chat messages (project codes, emails), the app.
- **Late start:** if the in-call timer is already running in the first frame, the recording started mid-meeting — say so in the notes.
- **Highlight colour:** if the app isn't Teams dark theme, read the speaking-border colour from a frame and pass `--highlight R,G,B`.
- **No name labels on tiles (Discord avatars, Meet bubbles)** → regions mode:
  1. Extract a full-res frame with `ffmpeg -ss <t> -i <video> -frames:v 1 f.png`, and crop/zoom to map each avatar to a person (member list, hover names, sidebar).
  2. Write `regions.json` = `[{"name": "Ana", "bbox": [x0, y0, x1, y1]}, ...]` in **source pixels**. Each bbox must cover the avatar plus its ring, without overlapping its neighbours.
  3. Sanity-check: crop each bbox from a frame where someone is speaking and confirm the ring falls inside.

## 5. Transcribe

```
# Teams / labelled grids
$H transcribe "<path>" --names "<label1>;<label2>;..." --me "<me>" \
  --glossary <repo>/.claude/obs-transcript.json [--prompt "<jargon, companies>"] [--language es]
# Discord / fixed layouts
$H transcribe "<path>" --regions <regions.json> --highlight 40,155,90 --names "<n1>;<n2>" \
  --glossary <repo>/.claude/obs-transcript.json
```

Run it in the background. It takes ~2 min per 20 min of call on Apple Silicon (Whisper large-v3 + video scan + voiceprints); the first run downloads ~3.5 GB of models. Results are cached in `~/.cache/obs-transcript/<file>/`: `speakers.json` (video timeline) and `asr-*.json` (words). Re-running with other `--names/--me/--glossary/--regions` only redoes the merge and voiceprints (~30 s). `--force` redoes everything; `--raw` keeps fillers; `--no-voice` skips voiceprints.

Check `meta`:
- `label_sources`: how many chunks came from `video`, `voice`, `silent-tile` (own tile), `smoothed` and `carry`. If `carry` is large, coverage is poor; say so in the notes.
- `talk_time` per person; a known attendee with 0 is fine if they were silent.
- `highlight_coverage` < 0.3 → no usable highlight (audio-only call, unknown colour, screen share all the time). Fix `--highlight` or use `--no-video` and attribute by content, marking it *(?)*.
- `unmatched_ocr` → if a real name shows up there, add it to `--names`.

## 6. Review and fix

Read the full `transcript.md`. Then:
- **Glossary:** add every recurring ASR error you spot (jargon, acronyms, names) to the repo `glossary` and re-run step 5. It's instant, and future meetings in this repo benefit.
- Don't hand-edit the transcript text. Do fix obvious misattributions in the **notes** (e.g. a reply clearly from the other side).

## 7. Write the notes

Spanish unless the meeting was in another language. Use `[nombre propio] — [organización]` roles inferred from what each person says and does.

```markdown
---
date: YYYY-MM-DD
start: "HH:MM"
duration: <meta.duration>
source: "<recording path>"
platform: <Teams/Zoom/...>
project: "<if visible>"
tags: [...]
---

# <Título descriptivo>

> <late-start warning if applicable>
> Transcripción local (Whisper large-v3). Hablantes identificados por el indicador de "hablando" de <app> y, donde no se ve, por huella de voz; puede haber errores puntuales en los cambios de turno.

## Resumen
<1 línea de contexto + bullets por tema, con los términos clave en negrita>

### Decisiones

## Integrantes
| Persona | Organización | Rol en la reunión | Tiempo hablando |
<everyone on screen + people mentioned, marking who didn't attend; "Last, First" → "First Last"; nicknames in parentheses if the user uses them>

## Próximos pasos
### <Organización / persona>   (our side first; one section per person or organisation)
- [ ] **<quién> — <cuándo>:** <acción concreta>

### Dudas abiertas

## Transcripción completa
```

Write everything above the transcript with the Write tool, then `cat <cache>/transcript.md >> <file>` (never retype the transcript).

## 8. Finish

Reply in 2–3 lines: link to the file, the attendees, the most urgent next step, and the late-start warning if any.

## Tip for the user (mention once, only if a recording had no speaker highlight)

In OBS → Settings → Output → Advanced → Recording, enable audio tracks 1+2 and put the mic only on track 2 (Edit → Advanced Audio Properties). That isolates the user's own voice.
