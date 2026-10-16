#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = ["mlx-whisper", "numpy", "pillow", "scipy", "speechbrain", "torch", "torchaudio", "soundfile"]
# ///
"""OBS meeting recordings: locate dir, list, transcribe with per-speaker turns.

Speakers come from the video: video-call apps (Teams, Zoom...) draw a coloured border on the
active speaker's tile; we detect it per frame and OCR the tile's name label (tesseract).
"""
import argparse
import configparser
import difflib
import hashlib
import json
import os
import platform
import re
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

CONFIG_DIR = Path.home() / ".config" / "obs-transcript"
CONFIG_FILE = CONFIG_DIR / "config.json"
CACHE_DIR = Path.home() / ".cache" / "obs-transcript"
VIDEO_EXT = {".mov", ".mkv", ".mp4", ".flv", ".ts", ".m4v"}
MODEL = "mlx-community/whisper-large-v3-mlx"
# Teams active-speaker border (dark theme); override with --highlight
HIGHLIGHT = (138, 127, 245)
FPS = 2


# ---------- config / OBS dir ----------

def load_config():
    return json.loads(CONFIG_FILE.read_text()) if CONFIG_FILE.exists() else {}


def save_config(cfg):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2, ensure_ascii=False))


def obs_base():
    if platform.system() == "Darwin":
        return Path.home() / "Library" / "Application Support" / "obs-studio"
    if platform.system() == "Windows":
        return Path(os.environ.get("APPDATA", "")) / "obs-studio"
    return Path.home() / ".config" / "obs-studio"


def read_ini(path):
    cp = configparser.RawConfigParser(strict=False)
    cp.optionxform = str
    cp.read(path, encoding="utf-8-sig")
    return cp


def detect_obs_dir():
    base = obs_base()
    profile_dir = None
    for name in ("user.ini", "global.ini"):  # OBS 30+ moved [Basic] to user.ini
        p = base / name
        if p.exists():
            cp = read_ini(p)
            if cp.has_option("Basic", "ProfileDir"):
                profile_dir = cp.get("Basic", "ProfileDir")
                break
    profiles = base / "basic" / "profiles"
    candidates = [profiles / profile_dir] if profile_dir else []
    candidates += sorted(profiles.glob("*")) if profiles.exists() else []
    for prof in candidates:
        ini = prof / "basic.ini"
        if not ini.exists():
            continue
        cp = read_ini(ini)
        if cp.get("Output", "Mode", fallback="Simple") == "Advanced":
            keys = [("AdvOut", "RecFilePath"), ("AdvOut", "FFFilePath"), ("SimpleOutput", "FilePath")]
        else:
            keys = [("SimpleOutput", "FilePath"), ("AdvOut", "RecFilePath")]
        for sec, key in keys:
            if cp.has_option(sec, key) and Path(cp.get(sec, key)).is_dir():
                return cp.get(sec, key)
    fallback = Path.home() / ("Movies" if platform.system() == "Darwin" else "Videos")
    return str(fallback) if fallback.is_dir() else None


def get_obs_dir(refresh=False):
    cfg = load_config()
    if not refresh and cfg.get("obs_dir") and Path(cfg["obs_dir"]).is_dir():
        return cfg["obs_dir"], False
    d = detect_obs_dir()
    if d:
        cfg["obs_dir"] = d
        cfg["detected_at"] = datetime.now().isoformat(timespec="seconds")
        save_config(cfg)
    return d, True


# ---------- helpers ----------

def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height",
         "-of", "json", str(path)], capture_output=True, text=True, timeout=30).stdout
    j = json.loads(out or "{}")
    v = next((s for s in j.get("streams", []) if s.get("codec_type") == "video"), None)
    return {"duration": float(j.get("format", {}).get("duration", 0) or 0),
            "video": (v["width"], v["height"]) if v else None}


def fmt_dur(s):
    s = int(s or 0)
    return f"{s // 3600}h{(s % 3600) // 60:02d}m" if s >= 3600 else f"{s // 60}m{s % 60:02d}s"


def ts(sec):
    sec = int(sec)
    return f"{sec // 3600:02d}:{(sec % 3600) // 60:02d}:{sec % 60:02d}"


def cache_dir(video):
    st = Path(video).stat()
    key = hashlib.sha1(f"{Path(video).resolve()}|{st.st_size}|{int(st.st_mtime)}".encode()).hexdigest()[:12]
    return CACHE_DIR / f"{Path(video).stem.replace(' ', '_')}-{key}"


# ---------- commands: dir / list / frames ----------

def cmd_obs_dir(args):
    d, fresh = get_obs_dir(args.refresh)
    print(json.dumps({"obs_dir": d, "newly_detected": fresh, "config": str(CONFIG_FILE)}, ensure_ascii=False))


def cmd_set_obs_dir(args):
    cfg = load_config()
    cfg["obs_dir"] = str(Path(args.path).expanduser().resolve())
    save_config(cfg)
    print(json.dumps(cfg, ensure_ascii=False))


def cmd_list(args):
    d, _ = get_obs_dir()
    if not d:
        sys.exit("OBS recordings dir not found; use set-obs-dir")
    files = [p for p in Path(d).iterdir() if p.is_file() and p.suffix.lower() in VIDEO_EXT]
    files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    now = datetime.now()
    out = []
    for p in files[: args.n]:
        st = p.stat()
        end = datetime.fromtimestamp(st.st_mtime)
        out.append({
            "path": str(p), "name": p.name,
            "ended_at": end.isoformat(timespec="minutes"),
            "minutes_ago": int((now - end).total_seconds() // 60),
            "duration": fmt_dur(probe(p)["duration"]),
            "size_mb": round(st.st_size / 1e6),
            "cached_transcript": (cache_dir(p) / "transcript.md").exists(),
        })
    print(json.dumps({"obs_dir": d, "now": now.isoformat(timespec="minutes"), "recordings": out}, indent=2, ensure_ascii=False))


def cmd_frames(args):
    """Evenly spaced stills (+ contact sheet) so the caller can see attendees, title, chat."""
    video = Path(args.file).expanduser()
    info = probe(video)
    out = cache_dir(video) / "frames"
    out.mkdir(parents=True, exist_ok=True)
    paths = []
    for i in range(args.n):
        t = info["duration"] * (i + 0.5) / args.n
        p = out / f"frame_{int(t):05d}.jpg"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(t), "-i", str(video),
                        "-frames:v", "1", "-vf", "scale=1600:-1", str(p)], check=True)
        paths.append(str(p))
    sheet = out / "sheet.jpg"
    step = max(info["duration"] / 36, 1)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(video), "-vf",
                    f"fps=1/{step:.2f},scale=320:-1,tile=6x6", "-frames:v", "1", str(sheet)], check=True)
    print(json.dumps({"frames": paths, "sheet": str(sheet)}))


# ---------- speaker detection (video) ----------

def ocr_label(img):
    from PIL import ImageOps
    g = img.convert("L")
    g = g.resize((g.width * 3, g.height * 3))
    g = ImageOps.invert(g)
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        g.save(f.name)
        txt = subprocess.run(["tesseract", f.name, "-", "--psm", "7"], capture_output=True, text=True).stdout
    os.unlink(f.name)
    txt = re.sub(r"[^\wÀ-ÿ,.' -]", " ", txt)
    # drop trailing icon garbage (single chars)
    words = [w for w in txt.split() if len(w) > 1 or w.isalpha() and w.isupper()]
    while words and len(words[-1]) <= 2 and not words[-1][0].isupper():
        words.pop()
    return " ".join(words).strip(" ,.")


def label_hash(img):
    import numpy as np
    a = np.asarray(img.convert("L").resize((24, 4))).astype(int)
    return "".join("1" if v else "0" for v in (a > a.mean()).flatten())


def detect_speakers(video, size, color, tol):
    import numpy as np
    from PIL import Image
    from scipy import ndimage

    w, h = size
    proc = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-i", str(video), "-vf", f"fps={FPS}",
                             "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    frame_bytes = w * h * 3
    c = np.array(color, dtype=np.int16)
    cache, timeline, i = {}, [], 0
    while True:
        buf = proc.stdout.read(frame_bytes)
        if len(buf) < frame_bytes:
            break
        t = i / FPS
        i += 1
        a = np.frombuffer(buf, np.uint8).reshape(h, w, 3)
        mask = (np.abs(a.astype(np.int16) - c).max(axis=2) < tol)
        if mask.sum() < 300:
            timeline.append({"t": t, "speakers": []})
            continue
        lab, n = ndimage.label(ndimage.binary_dilation(mask, iterations=1))
        names = []
        for sl in ndimage.find_objects(lab):
            y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
            bw, bh = x1 - x0, y1 - y0
            if bw < 120 or bh < 70:
                continue
            fill = mask[y0:y1, x0:x1].mean()
            if fill > 0.25:  # solid purple = button, not a tile border
                continue
            # name label: bottom-left strip of the tile
            crop = Image.fromarray(a[int(y1 - bh * 0.15):y1 - 3, x0 + 3:int(x0 + bw * 0.8)])
            key = (label_hash(crop), bw // 20, bh // 20)
            if key not in cache:
                cache[key] = ocr_label(crop)
            names.append(cache[key] or "?")
        timeline.append({"t": t, "speakers": names})
    proc.wait()
    return timeline


def detect_regions(video, size, regions, color, tol, min_px=40):
    """Fixed-layout apps (Discord avatars, pinned grids): speaking = ring colour inside a named bbox."""
    import numpy as np
    w, h = size
    proc = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-i", str(video), "-vf", f"fps={FPS}",
                             "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    c = np.array(color, dtype=np.int16)
    timeline, i = [], 0
    while True:
        buf = proc.stdout.read(w * h * 3)
        if len(buf) < w * h * 3:
            break
        a = np.frombuffer(buf, np.uint8).reshape(h, w, 3)
        names = []
        for r in regions:
            x0, y0, x1, y1 = r["bbox"]
            sub = a[y0:y1, x0:x1].astype(np.int16)
            if (np.abs(sub - c).max(axis=2) < tol).sum() >= min_px:
                names.append(r["name"])
        timeline.append({"t": i / FPS, "speakers": names})
        i += 1
    proc.wait()
    return timeline


def _norm(x):
    import unicodedata
    x = unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode().lower()
    return [t for t in re.split(r"[^a-z]+", x) if len(t) > 1]


def name_score(ocr, name):
    """Mean best fuzzy match of the name's tokens inside the OCR string (robust to OCR junk)."""
    nt, ot = _norm(name), _norm(ocr)
    if not nt or not ot:
        return 0.0
    return sum(max(difflib.SequenceMatcher(None, a, b).ratio() for b in ot) for a in nt) / len(nt)


def pretty(name):
    if "," in name:  # Teams 'Last, First'
        last, first = [p.strip() for p in name.split(",", 1)]
        return f"{first} {last}".strip()
    return name


def canonical_names(timeline, known=None):
    """Map every OCR string to a known attendee name (or None). Without a list, cluster frequent strings."""
    cnt = Counter(n for e in timeline for n in e["speakers"] if n and n != "?")
    if not known:
        total = sum(cnt.values()) or 1
        known = []
        for s, c in cnt.most_common():
            if c / total < 0.02:
                break
            if all(name_score(s, k) < 0.6 for k in known):
                known.append(s)
        known = [pretty(k) for k in known]
    out = {}
    for s in cnt:
        best = max(known, key=lambda k: name_score(s, k), default=None)
        out[s] = best if best and name_score(s, best) >= 0.6 else None
    return out, known


# ---------- ASR ----------

def run_asr(wav, model, language, prompt):
    import mlx_whisper
    kw = dict(path_or_hf_repo=model, language=language, word_timestamps=True,
              condition_on_previous_text=False, hallucination_silence_threshold=2.0, verbose=None)
    if prompt:
        kw["initial_prompt"] = prompt
    r = mlx_whisper.transcribe(str(wav), **kw)
    words, last, reps = [], None, 0
    for s in r["segments"]:
        if s.get("no_speech_prob", 0) > 0.6 and s.get("avg_logprob", 0) < -1:
            continue
        txt = s["text"].strip()
        reps = reps + 1 if txt == last else 0
        last = txt
        if reps >= 2:  # whisper loop
            continue
        for w in s.get("words", []):
            words.append({"w": w["word"], "s": w["start"], "e": w["end"]})
    return words


# ---------- merge ----------

def speaker_track(timeline, names, people, me=None, switch_cost=3.0):
    """Viterbi over frames: one speaker per frame, switching is penalised (kills flicker).
    Frames with no highlighted tile favour `me` (own tile is not highlighted; mic goes straight to OBS)."""
    states = list(people) + ([me] if me and me not in people else [])
    if not states:
        return []
    obs = []
    for e in timeline:
        obs.append({names.get(n) for n in e["speakers"]} - {None})
    INF = float("inf")
    cost = [0.0] * len(states)
    back = []
    for o in obs:
        em = []
        for st in states:
            if o:
                em.append(0.0 if st in o else 1.0)
            else:
                em.append(0.3 if st == me else 0.6)
        best_prev = min(range(len(states)), key=lambda i: cost[i])
        new, bp = [], []
        for j in range(len(states)):
            stay, sw = cost[j], cost[best_prev] + switch_cost
            if stay <= sw:
                new.append(stay + em[j]); bp.append(j)
            else:
                new.append(sw + em[j]); bp.append(best_prev)
        cost, _ = new, back.append(bp)
    j = min(range(len(states)), key=lambda i: cost[i])
    path = [0] * len(obs)
    for t in range(len(obs) - 1, -1, -1):
        path[t] = states[j]
        j = back[t][j]
    return path


def assign(words, track, lag=0.6):
    """Speaker per word from the smoothed track; highlight trails speech by ~lag s."""
    if not track:
        return words
    for w in words:
        k = min(len(track) - 1, int(((w["s"] + w["e"]) / 2 + lag) * FPS))
        w["spk"] = track[k]
    # absorb runs < 4 words into the surrounding speaker
    runs = []
    for w in words:
        if runs and runs[-1][0] == w["spk"]:
            runs[-1][1].append(w)
        else:
            runs.append([w["spk"], [w]])
    for i in range(1, len(runs) - 1):
        if len(runs[i][1]) < 4 and runs[i - 1][0] == runs[i + 1][0]:
            for w in runs[i][1]:
                w["spk"] = runs[i - 1][0]
    snap_boundaries(words)
    return words


def snap_boundaries(words, back=2.5, fwd=1.0):
    """Move each speaker change to the most plausible cut nearby: after . ? ! or the longest pause.
    Highlight lags voice, so search mostly backwards."""
    i = 1
    while i < len(words):
        if words[i]["spk"] == words[i - 1]["spk"]:
            i += 1
            continue
        t0 = words[i]["s"]
        best, best_score = i, -1.0
        for j in range(max(1, i - 12), min(len(words), i + 5)):
            if not (t0 - back <= words[j]["s"] <= t0 + fwd):
                continue
            prev = words[j - 1]
            gap = words[j]["s"] - prev["e"]
            score = gap + (1.0 if prev["w"].strip()[-1:] in ".?!" else 0) + (0.5 if words[j]["w"].strip()[:1] in "¿¡" else 0)
            if score > best_score:
                best, best_score = j, score
        new_spk, old_spk = words[i]["spk"], words[i - 1]["spk"]
        lo, hi = min(best, i), max(best, i)
        for k in range(lo, hi):
            words[k]["spk"] = new_spk if best < i else old_spk
        i = hi + 1


FILLERS = re.compile(r"(?i)(^|[\s,¿¡])(e+h*|ee+|mm+|eh+m*)[,.]?(?=\s|$)")
REPEAT = re.compile(r"(?i)\b(\w+)(,?\s+\1\b)+")


def clean_text(t, glossary):
    t = re.sub(r"\.{3,}", "…", t)
    t = FILLERS.sub(r"\1", t)
    t = REPEAT.sub(r"\1", t)  # 'que, que, que' -> 'que'
    for wrong, right in glossary.items():
        t = re.sub(rf"(?<!\w){re.escape(wrong)}(?!\w)", right, t)
    t = re.sub(r"\s+([,.?!])", r"\1", t)
    t = re.sub(r"([,.])\1+", r"\1", t)
    t = re.sub(r"\s{2,}", " ", t).strip(" ,")
    return t[:1].upper() + t[1:]


def make_chunks(words, pause=0.2, max_len=3.0):
    """Split speech at pauses: a speaker change almost always sits on one."""
    chunks, cur = [], []
    for w in words:
        if cur and (w["s"] - cur[-1]["e"] > pause or w["e"] - cur[0]["s"] > max_len
                    or cur[-1]["w"].strip()[-1:] in ".?!"):
            chunks.append(cur)
            cur = []
        cur.append(w)
    if cur:
        chunks.append(cur)
    return chunks


def visual_votes(chunk, timeline, names, lag=0.6):
    votes, n = Counter(), 0
    k0, k1 = int((chunk[0]["s"] + lag) * FPS), int((chunk[-1]["e"] + lag) * FPS)
    for k in range(max(0, k0), min(len(timeline), k1 + 1)):
        n += 1
        for raw in timeline[k]["speakers"]:
            nm = names.get(raw, raw)
            if nm and nm != "?":
                votes[nm] += 1
    return votes, n


def embed_chunks(wav, chunks):
    import numpy as np
    import soundfile as sf
    import torch
    from speechbrain.inference.speaker import EncoderClassifier
    enc = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb",
                                         savedir=str(CACHE_DIR / "models" / "ecapa"), run_opts={"device": "cpu"})
    audio, sr = sf.read(str(wav), dtype="float32")
    out = []
    for ch in chunks:
        s, e = int(ch[0]["s"] * sr), int(ch[-1]["e"] * sr)
        seg = audio[s:e]
        if len(seg) < sr * 0.6:  # too short for a reliable voiceprint
            out.append(None)
            continue
        with torch.no_grad():
            v = enc.encode_batch(torch.from_numpy(seg).unsqueeze(0)).squeeze().numpy()
        out.append(v / np.linalg.norm(v))
    return out


def label_chunks(chunks, timeline, names, people, me, embs):
    """1) video evidence where clear; 2) voiceprints learnt from those chunks label the rest."""
    import numpy as np
    labels, source = [], []
    for ch in chunks:
        votes, n = visual_votes(ch, timeline, names)
        top = votes.most_common(2)
        if top and top[0][1] >= 2 and (len(top) == 1 or top[0][1] >= 2 * top[1][1]):
            labels.append(top[0][0]); source.append("video")
        elif me and n >= 2 and not votes:
            labels.append(me); source.append("silent-tile")  # own tile never lights up
        else:
            labels.append(None); source.append(None)
    if embs is not None:
        cents = {}
        for spk in set(l for l in labels if l):
            vs = [embs[i] for i, l in enumerate(labels) if l == spk and embs[i] is not None and source[i] == "video"]
            if spk == me and len(vs) < 3:
                vs += [embs[i] for i, l in enumerate(labels) if l == spk and embs[i] is not None]
            if len(vs) >= 3:
                c = np.mean(vs, axis=0)
                cents[spk] = c / np.linalg.norm(c)
        for i, l in enumerate(labels):
            if embs[i] is None or not cents:
                continue
            sims = {k: float(embs[i] @ c) for k, c in cents.items()}
            best = max(sims, key=sims.get)
            if l is None and sims[best] > 0.35:
                labels[i], source[i] = best, "voice"
            elif source[i] == "silent-tile" and best != me and sims[best] > sims.get(me, 0) + 0.1:
                labels[i], source[i] = best, "voice"  # layout hidden, not really me
    # isolated short non-video chunk between two same-speaker chunks = mid-sentence flip
    for i in range(1, len(chunks) - 1):
        dur = chunks[i][-1]["e"] - chunks[i][0]["s"]
        if source[i] != "video" and labels[i - 1] and labels[i - 1] == labels[i + 1] != labels[i] and dur < 3.5:
            labels[i], source[i] = labels[i - 1], "smoothed"
    # leftovers inherit the previous speaker
    prev = None
    for i in range(len(labels)):
        if labels[i] is None:
            labels[i], source[i] = prev or "?", "carry"
        prev = labels[i]
    for ch, l in zip(chunks, labels):
        for w in ch:
            w["spk"] = l
    return Counter(source)


def to_turns(words, gap=3.0):
    turns = []
    for w in words:
        spk = w.get("spk") or "?"
        if turns and turns[-1]["spk"] == spk and w["s"] - turns[-1]["e"] < gap:
            turns[-1]["text"] += w["w"]
            turns[-1]["e"] = w["e"]
        else:
            turns.append({"spk": spk, "s": w["s"], "e": w["e"], "text": w["w"]})
    return turns


def render(turns, glossary=None, raw=False):
    out = []
    for t in turns:
        txt = t["text"].strip() if raw else clean_text(t["text"], glossary or {})
        if txt:
            out.append(f"**[{ts(t['s'])}] {pretty(t['spk'])}:** {txt}")
    return "\n\n".join(out) + "\n"


# ---------- transcribe ----------

def cmd_transcribe(args):
    video = Path(args.file).expanduser()
    if not video.exists():
        sys.exit(f"not found: {video}")
    d = cache_dir(video)
    d.mkdir(parents=True, exist_ok=True)
    info = probe(video)
    md = d / "transcript.md"
    if md.exists() and not (args.force or args.names or args.me or args.glossary or args.regions):
        print(json.dumps({"transcript": str(md), "meta": str(d / "meta.json"), "cached": True}))
        return

    spk_file = d / "speakers.json"
    timeline, names = [], {}
    if info["video"] and not args.no_video:
        if spk_file.exists() and not args.force:
            timeline = json.loads(spk_file.read_text())
        else:
            print("detecting speakers from video...", file=sys.stderr)
            color = tuple(int(x) for x in args.highlight.split(","))
            if args.regions:
                timeline = detect_regions(video, info["video"], json.loads(Path(args.regions).read_text()), color, args.tol)
            else:
                timeline = detect_speakers(video, info["video"], color, args.tol)
            spk_file.write_text(json.dumps(timeline))
    known = [n.strip() for n in args.names.split(";")] if args.names else None
    names, people = canonical_names(timeline, known) if timeline else ({}, known or [])

    # names seen on screen sharpen ASR spelling
    prompt = ", ".join(people)
    if args.prompt:
        prompt = f"{args.prompt}. {prompt}" if prompt else args.prompt

    asr_file = d / f"asr-{args.model.split('/')[-1]}.json"
    if asr_file.exists() and not args.force:
        words = json.loads(asr_file.read_text())
    else:
        print(f"transcribing ({args.model})...", file=sys.stderr)
        wav = d / "audio.wav"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", str(wav)], check=True)
        words = run_asr(wav, args.model, args.language, prompt)
        asr_file.write_text(json.dumps(words, ensure_ascii=False))

    sources = {}
    if timeline:
        chunks = make_chunks(words)
        embs = None
        if not args.no_voice:
            wav = d / "audio.wav"
            if not wav.exists():
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", str(wav)], check=True)
            print("voiceprints...", file=sys.stderr)
            embs = embed_chunks(wav, chunks)
        sources = dict(label_chunks(chunks, timeline, names, people, args.me, embs))
    turns = to_turns(words)
    glossary = json.loads(Path(args.glossary).read_text()).get("glossary", {}) if args.glossary and Path(args.glossary).exists() else {}
    md.write_text(render(turns, glossary, args.raw))

    talk = defaultdict(float)
    for t in turns:
        talk[pretty(t["spk"])] += t["e"] - t["s"]
    frames_with_hl = sum(1 for e in timeline if e["speakers"])
    meta = {
        "duration": fmt_dur(info["duration"]),
        "people": [pretty(p) for p in people],
        "unmatched_ocr": sorted(k for k, v in names.items() if v is None)[:20],
        "talk_time": {k: fmt_dur(v) for k, v in sorted(talk.items(), key=lambda x: -x[1])},
        "highlight_coverage": round(frames_with_hl / len(timeline), 2) if timeline else 0,
        "turns": len(turns),
        "model": args.model,
    }
    (d / "audio.wav").unlink(missing_ok=True)
    meta["label_sources"] = sources
    (d / "meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False))
    print(json.dumps({"transcript": str(md), "meta": meta, "cached": False}, ensure_ascii=False))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("obs-dir"); p.add_argument("--refresh", action="store_true"); p.set_defaults(f=cmd_obs_dir)
    p = sub.add_parser("set-obs-dir"); p.add_argument("path"); p.set_defaults(f=cmd_set_obs_dir)
    p = sub.add_parser("list"); p.add_argument("-n", type=int, default=10); p.set_defaults(f=cmd_list)
    p = sub.add_parser("frames"); p.add_argument("file"); p.add_argument("-n", type=int, default=4); p.set_defaults(f=cmd_frames)
    p = sub.add_parser("transcribe")
    p.add_argument("file")
    p.add_argument("--language", default="es")
    p.add_argument("--model", default=MODEL)
    p.add_argument("--prompt", help="vocabulary hint (jargon, companies)")
    p.add_argument("--highlight", default=",".join(map(str, HIGHLIGHT)), help="active-speaker border RGB")
    p.add_argument("--tol", type=int, default=40)
    p.add_argument("--names", help="';'-separated attendee names as shown on tiles (improves OCR matching)")
    p.add_argument("--me", help="local user's name: speech with no highlighted tile is attributed to them")
    p.add_argument("--glossary", help="JSON file with {'glossary': {wrong: right}} (repo config)")
    p.add_argument("--raw", action="store_true", help="keep fillers/repetitions")
    p.add_argument("--regions", help="JSON [{name, bbox:[x0,y0,x1,y1]}] in source px, for fixed layouts without name labels")
    p.add_argument("--no-voice", action="store_true", help="skip voiceprint pass")
    p.add_argument("--no-video", action="store_true")
    p.add_argument("--force", action="store_true")
    p.set_defaults(f=cmd_transcribe)
    args = ap.parse_args()
    args.f(args)


if __name__ == "__main__":
    main()
