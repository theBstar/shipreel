# Scenes

A scenes file is an ES module that exports `scenes` (and optionally `NAME`, the output file name). Each scene is:

```js
{ title: 'Chapter title', html: '<…>', beats: ['line 1', 'line 2'],
  gap: [0, 4.5],        // optional: extra seconds of silence after each line
  minDur: 30,           // optional: hold the scene at least this long (clip scenes)
  clips: ['01_save'],   // required when the scene uses clip('01_save', …)
  transition: 'fade' }  // optional: the cut INTO this scene (ffmpeg xfade name)
```

The stage is 1920×1080. The bottom ~110 px carry the captions and progress bar; keep content above y ≈ 960.

## Timing attributes

Any element can animate. The helpers set these for you; in raw HTML write them yourself.

| Attribute | Meaning |
|---|---|
| `data-b="k"` | appears when narration line `k` starts |
| `data-o="0.4"` | …plus this many seconds |
| `data-a="up\|left\|pop\|fade\|draw"` | entrance (`draw` traces an SVG path) |
| `data-out="k"` | fades out when line `k` starts |
| `data-hl="k"` or `"k-m"` | glows during lines k…m |

## Helpers (`lib.mjs`)

| Helper | Draws |
|---|---|
| `title({ kicker, line1, line2, lede, chips, gradient })` | the opening card |
| `header(kicker, title)` | a scene heading, top left |
| `svg(inner)` | a full-stage SVG layer for the next four |
| `box(x, y, w, h, color, title, sub, o)` | a labelled box; `sub` lines split on `\n`; `o.monoT` for a code-style title |
| `arrow(id, d, color, o)` | an SVG path arrow; `o.dash` for dashed |
| `packet(arrowId, color, o)` | a dot travelling along an arrow; `o.rep` times |
| `label(x, y, text, o)` | small text in the SVG layer |
| `card(x, y, w, h, html, o)` | a panel of any HTML; `o.c` tints the border; `h` 0 for auto height |
| `code(x, y, w, text, o)` | a code panel; `+`/`-` lines coloured as a diff; `o.file` for a filename bar |
| `clip(name, kicker, { speed, from, o, tags })` | a screen recording, framed and centred; `tags: [[text, beat], …]` are callouts in the right margin |
| `chip(text, beat, offset)` | a pill |
| `esc(text)` | HTML-escape anything that came from the PR |

Colors (`C`): `cyan blue violet red green amber orange gray ok warn bad`, or any CSS color.

Every helper takes `o.b` (beat), `o.o` (offset), `o.hl` (highlight) and `o.a` (entrance).

## Composition that works

- One idea per scene; three to six elements on screen at the end of it.
- A diagram reads left to right, and packets show what moves where.
- Cards in a row: 540–860 px wide, starting at x = 90, gaps of 30–60.
- Code panels: at most ~14 lines, 19 px; show the lines that matter, not the file.
- Put the key sentence of a scene in a card near the bottom (y ≈ 600–700) so the eye lands on it.
- Screen recordings sit in a 1312×820 frame at x = 304; callout tags go in the right margin.

## Clip scenes

`clip()` plays `clips/<name>.webm` (next to the scenes file) from when its beat starts. Frames are extracted once to `clips/<name>/`. At `speed: 1` a 50-second clip needs the scene to last 50 seconds: set `minDur`, then use `gap` so each narration line starts when its moment is on screen. `build.mjs --timing` prints every line's start time; `--stills` shows the frame under each line.

To shorten a long recording (waiting for a slow step), cut it with ffmpeg first, e.g. real time for the first 14 s, then 50× for the rest:

```bash
ffmpeg -i in.webm -filter_complex "[0:v]trim=0:14,setpts=PTS-STARTPTS,fps=24[a];[0:v]trim=14,setpts=(PTS-STARTPTS)/50,fps=24[b];[a][b]concat=n=2:v=1[o]" -map "[o]" -c:v libvpx-vp9 -b:v 3M -deadline realtime -cpu-used 8 out.webm
```
