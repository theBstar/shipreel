# Narration

The narration is the video; the screen supports it. Write it first, then decide what each line shows.

## Style

- **Present tense, current code.** "Every login goes through a new middleware." Not "we added", not "it used to".
- **One idea per line.** A line is one `beats` entry: 1–3 short sentences, 8–25 words.
- **Say why.** The diff shows what changed; the narration adds the reason, the trade-off, the edge case it handles.
- **Plain words.** Name a function or file only when the viewer can see it on screen.
- **No filler.** No "in this video", "let's dive in", "as you can see".
- **End with the reviewer.** The last scene says where to start reading and what deserves a second look (known limitations included). Honest beats polished.

## Length

Aim for `video.optimal_seconds` (default 150). People lose interest past two or three minutes, so treat it as the target: shorter for small changes, longer only when the change really needs it. At the default voice (macOS Samantha, rate 178) speech runs about 2.9 words a second; with pauses between lines and scenes, 150 seconds holds roughly 350 words. `build.mjs --timing` gives the real number and notes when a video runs over.

## Pronunciation

Speech engines misread acronyms, numbers and product names. The engine rewrites common ones before synthesis (API → "A P I", SQL → "sequel", #123 → "number 123", 404 → "four oh four"). Add project terms in `shipreel.yml`:

```yaml
pronounce:
  kubectl: cube control
  Supabase: soopa base
```

Captions always show the text as written; only the audio uses the rewrite.
