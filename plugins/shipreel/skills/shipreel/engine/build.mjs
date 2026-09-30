#!/usr/bin/env node
// Render a scenes file to an MP4.
//
//   node build.mjs --scenes <file.mjs> [--out <dir>] [--config <shipreel.yml>]
//                  [--timing] [--stills] [--only 0,2] [--conc 3] [--force]
//
// --timing  print scene lengths and beat times, render nothing
// --stills  render one PNG per beat (plus the end frame) to check layouts
// --only    render just these scenes (no final cut)
// --force   allow a video longer than video.max_seconds
//
// Pipeline: narration per beat (voice adapter) → frames from headless Chrome
// (one screenshot per frame, deterministic) → per-scene video → crossfade cut →
// ambient pad ducked under the voice → loudness-normalised MP4 under video.max_mb.
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { loadConfig, pronouncer } from './config.mjs';
import { resolveBrowser } from './adapters/browser.mjs';
import { resolveVoice } from './adapters/voice.mjs';
import { css } from './theme.mjs';
import { DEFS, DEFAULT_PRONOUNCE } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const flag = k => args.includes(k);
const scenesFile = opt('--scenes');
if (!scenesFile) { console.error('usage: build.mjs --scenes <file.mjs> [--out dir] [--timing|--stills|--only 0,1]'); process.exit(2); }

const cfg = loadConfig(opt('--config'));
const mod = await import(pathToFileURL(path.resolve(scenesFile)).href);
const scenes = mod.scenes;
const NAME = mod.NAME || path.basename(scenesFile).replace(/\.m?js$/, '');
const SCENES_DIR = path.dirname(path.resolve(scenesFile));
const out = path.resolve(opt('--out') || path.join(SCENES_DIR, 'out'));
fs.mkdirSync(path.join(out, 'aud'), { recursive: true });

const V = cfg.video, FPS = +V.fps, W = 1920, H = 1080, XF = +V.crossfade;
const PAUSE = 0.35, LEAD = 0.7, TAIL = 1.1;
const ONLY = opt('--only'), STILLS = flag('--stills');
const voice = resolveVoice(cfg.voice);
const toSpoken = pronouncer(cfg, DEFAULT_PRONOUNCE);
const dur = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const ff = a => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a], { stdio: ['ignore', 'inherit', 'inherit'] });
const clipsDir = path.join(SCENES_DIR, 'clips');

// 0. clip frames: clips/<name>.webm → clips/<name>/f%05d.jpg (once)
for (const sc of scenes) for (const c of sc.clips || []) {
  const dir = path.join(clipsDir, c);
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); ff(['-i', path.join(clipsDir, `${c}.webm`), '-vf', `fps=${FPS}`, '-q:v', '3', `${dir}/f%05d.jpg`]); }
}

// 1. narration, cached per line
const timing = scenes.map((sc, si) => {
  const beats = []; let t = LEAD; const files = [];
  sc.beats.forEach((txt, bi) => {
    const f = path.join(out, 'aud', `s${si}_b${bi}.${voice.ext}`), kf = f + '.key', sp = toSpoken(txt), key = `${voice.name}|${sp}`;
    if (!(fs.existsSync(f) && fs.existsSync(kf) && fs.readFileSync(kf, 'utf8') === key)) { voice.synth(sp, f); fs.writeFileSync(kf, key); }
    beats.push(t); files.push({ f, t }); t += dur(f) + PAUSE + (sc.gap?.[bi] || 0);
  });
  return { beats, dur: Math.max(t - PAUSE + TAIL, sc.minDur || 0), files };
});
const total = timing.reduce((a, b) => a + b.dur, 0) - XF * (scenes.length - 1);
console.log(`${NAME}: ${total.toFixed(1)} s | ${timing.map(x => x.dur.toFixed(0)).join(' ')}`);
if (flag('--timing')) { timing.forEach((x, i) => console.log(i, scenes[i].title, '|', x.beats.map(b => b.toFixed(1)).join(' '))); process.exit(0); }
if (total > +V.max_seconds && !flag('--force')) {
  console.error(`Too long: ${total.toFixed(0)} s is over video.max_seconds (${V.max_seconds}). Tighten the narration, or pass --force.`);
  process.exit(3);
}

// 2. the page: every scene on one stage, shown one at a time by engine.js
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css(cfg.fonts)}</style></head><body>
<div id="stage">${DEFS}${scenes.map((s, i) => `<section class="scene" id="sc${i}">${s.html}</section>`).join('\n')}
<div id="caption"></div><div id="progbar"><div id="prog"></div></div></div>
<script>${fs.readFileSync(path.join(HERE, 'engine.js'), 'utf8')}</script></body></html>`;
fs.writeFileSync(path.join(out, 'page.html'), html);

const executablePath = resolveBrowser(cfg.browser);
const launch = () => puppeteer.launch({ executablePath, headless: true, protocolTimeout: 900000,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--disable-gpu', '--allow-file-access-from-files'] });
const frameCounts = Object.fromEntries(scenes.flatMap(s => (s.clips || []).map(c => [c, fs.readdirSync(path.join(clipsDir, c)).length])));

async function paint(page, si, t, cap) {
  await page.evaluate(async (si, t, c, root, fps) => {
    window.__render(si, t, c);
    const s = document.getElementById('sc' + si); const waits = []; const beats = window.__beats[si];
    for (const img of s.querySelectorAll('img[data-clip]')) {
      const t0 = beats[+img.dataset.b || 0] + parseFloat(img.dataset.o || 0);
      const from = parseFloat(img.dataset.from || 0), sp = parseFloat(img.dataset.speed || 1), n = +img.dataset.frames;
      const k = Math.min(n, Math.max(1, Math.round((from + Math.max(0, t - t0) * sp) * fps) + 1));
      const src = `file://${root}/${img.dataset.clip}/f${String(k).padStart(5, '0')}.jpg`;
      if (img.getAttribute('src') !== src) { img.setAttribute('src', src); waits.push(img.decode().catch(() => {})); }
    }
    await Promise.all(waits);
  }, si, t, cap, clipsDir, FPS);
}

async function renderScene(si) {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.join(out, 'page.html')).href, { waitUntil: 'load' });
    await page.evaluate(async (tm, fc) => {
      await document.fonts.ready; window.__setup(tm); window.__beats = tm.map(x => x.beats);
      document.querySelectorAll('img[data-clip]').forEach(i => { i.dataset.frames = fc[i.dataset.clip]; });
    }, timing.map(x => ({ beats: x.beats, dur: x.dur })), frameCounts);
    const tm = timing[si];
    const chunk = x => { if (x.length <= 112) return [x]; const mid = x.length / 2; let best = -1;
      for (const m of x.matchAll(/[,:;—] /g)) if (best < 0 || Math.abs(m.index - mid) < Math.abs(best - mid)) best = m.index;
      if (best < 25 || best > x.length - 25) return [x]; return [...chunk(x.slice(0, best + 1)), ...chunk(x.slice(best + 2))]; };
    const sents = scenes[si].beats.map(b => b.split(/(?<=[.!?])\s+/).flatMap(chunk));
    const capAt = t => { let k = -1; tm.beats.forEach((b, i) => { if (t >= b - 0.05) k = i; }); if (k < 0) return '';
      const end = k + 1 < tm.beats.length ? tm.beats[k + 1] - PAUSE - (scenes[si].gap?.[k] || 0) : tm.dur - TAIL;
      if (t > end + 0.3) return ''; const bd = Math.max(0.5, end - tm.beats[k]);
      const ss = sents[k]; const tot = ss.reduce((a, x) => a + x.length, 0); let acc = 0; const f = (t - tm.beats[k]) / bd;
      for (const x of ss) { acc += x.length / tot; if (f < acc) return x; } return ss[ss.length - 1]; };
    if (STILLS) {
      for (let k = 0; k <= tm.beats.length; k++) { const t = k < tm.beats.length ? tm.beats[k] + 1.2 : tm.dur - 0.05;
        await paint(page, si, t, capAt(t)); await page.screenshot({ path: path.join(out, `still_${si}_${k}.png`) }); }
      return;
    }
    const aud = path.join(out, 'aud', `scene${si}.wav`), inputs = [], filt = [];
    tm.files.forEach((x, i) => { inputs.push('-i', x.f); filt.push(`[${i}]aresample=48000,adelay=${Math.round(x.t * 1000)}:all=1[a${i}]`); });
    ff([...inputs, '-filter_complex', filt.join(';') + ';' + tm.files.map((_, i) => `[a${i}]`).join('') +
      `amix=inputs=${tm.files.length}:normalize=0,apad=whole_dur=${tm.dur}[o]`, '-map', '[o]', '-t', String(tm.dur), '-ac', '2', '-ar', '48000', aud]);
    const tmp = path.join(out, `scene${si}.tmp.mov`);
    const p = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-i', aud,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'pcm_s16le', '-shortest', tmp]);
    const n = Math.ceil(tm.dur * FPS);
    for (let f = 0; f < n; f++) { const t = f / FPS; await paint(page, si, t, capAt(t));
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 }); if (!p.stdin.write(buf)) await new Promise(r => p.stdin.once('drain', r)); }
    p.stdin.end(); await new Promise(r => p.on('close', r));
    fs.renameSync(tmp, path.join(out, `scene${si}.mov`)); console.log('scene', si, 'rendered', n, 'frames');
  } finally { await browser.close(); }
}

const todo = scenes.map((_, i) => i).filter(i => ONLY === undefined || ONLY.split(',').map(Number).includes(i));
const q = todo.filter(i => STILLS || !fs.existsSync(path.join(out, `scene${i}.mov`)));
await Promise.all(Array.from({ length: +(opt('--conc') || 3) }, async () => { while (q.length) { const i = q.shift();
  for (let a = 0; a < 3; a++) { try { await renderScene(i); break; } catch (e) { console.log('scene', i, 'attempt', a + 1, 'failed:', e.message); if (a === 2) throw e; } } } }));
if (STILLS) { console.log('stills in', out); process.exit(0); }
if (ONLY !== undefined) process.exit(0);

// 3. the cut: crossfade scenes (video xfade + audio acrossfade)
const n = scenes.length, ins = [], vf = [], af = []; let off = 0;
const TR = ['fade', 'smoothleft', 'fade', 'fadeblack', 'smoothup', 'fade', 'circleopen', 'fade', 'smoothleft', 'fade'];
for (let i = 0; i < n; i++) ins.push('-i', path.join(out, `scene${i}.mov`));
let v = '[0:v]', a = '[0:a]';
for (let i = 1; i < n; i++) {
  off += timing[i - 1].dur - XF; const tr = scenes[i].transition || TR[i % TR.length];
  vf.push(`${v}[${i}:v]xfade=transition=${tr}:duration=${XF}:offset=${off.toFixed(3)}[v${i}]`); v = `[v${i}]`;
  af.push(`${a}[${i}:a]acrossfade=d=${XF}:c1=tri:c2=tri[a${i}]`); a = `[a${i}]`;
}
const cut = path.join(out, 'cut.mov');
if (n > 1) ff([...ins, '-filter_complex', [...vf, ...af].join(';'), '-map', v, '-map', a, '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'pcm_s16le', cut]);
else fs.copyFileSync(path.join(out, 'scene0.mov'), cut);
const T = dur(cut);

// 4. music: a synthesized ambient pad (Am9 → Fmaj7 → Cmaj7 → G6, 8 s a chord, equal-power
//    crossfades), or your own track (video.music: path), ducked under the voice.
const final = path.join(out, `${NAME}.mp4`);
const encode = crf => {
  let musicIn = null;
  if (V.music === 'pad') {
    const CH = [[110, 164.81, 196, 246.94, 261.63], [87.31, 130.81, 164.81, 220, 261.63], [130.81, 196, 246.94, 329.63, 392], [98, 146.83, 196, 246.94, 329.63]];
    const pad = det => CH.map((f5, k) => `pow(cos(PI/2*min(abs(mod(t/8,4)-${k}),4-abs(mod(t/8,4)-${k}))),2)*(${f5.map(f => `sin(2*PI*${(f + det).toFixed(2)}*t)+0.21*sin(2*PI*${(f * 2 - det).toFixed(2)}*t)`).join('+')})`).join('+');
    musicIn = path.join(out, 'music.wav');
    ff(['-f', 'lavfi', '-i', `aevalsrc=exprs='0.05*(${pad(0.35)})*(0.85+0.15*sin(2*PI*0.07*t))'|'0.05*(${pad(-0.35)})*(0.85+0.15*sin(2*PI*0.05*t+1))':s=48000:d=${(T + 1).toFixed(2)}`,
      '-af', `lowpass=f=1600,aecho=0.8:0.6:90|170:0.35|0.25,afade=t=in:d=3,afade=t=out:st=${Math.max(0, T - 4).toFixed(2)}:d=4,volume=${V.music_volume}`, musicIn]);
  } else if (V.music && V.music !== 'none') {
    musicIn = path.resolve(cfg.__root, V.music);
  }
  const vcodec = crf ? ['-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p'] : ['-c:v', 'copy'];
  if (musicIn) {
    const loop = V.music === 'pad' ? [] : ['-stream_loop', '-1'];
    ff(['-i', cut, ...loop, '-i', musicIn, '-filter_complex',
      `[1:a]volume=${V.music === 'pad' ? 1 : V.music_volume},afade=t=out:st=${Math.max(0, T - 4).toFixed(2)}:d=4[m];[0:a]asplit=2[vo][sc];[m][sc]sidechaincompress=threshold=0.015:ratio=8:attack=25:release=450:makeup=1[bed];[vo][bed]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=9[mix]`,
      '-map', '0:v', '-map', '[mix]', ...vcodec, '-c:a', 'aac', '-b:a', '192k', '-t', T.toFixed(3), '-movflags', '+faststart', final]);
  } else {
    ff(['-i', cut, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9', ...vcodec, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final]);
  }
};
encode(null);
for (const crf of [23, 26, 29]) { if (fs.statSync(final).size / 1048576 <= +V.max_mb) break; encode(crf); }

let acc = 0; const ch = scenes.map((s, i) => { const l = `${new Date(acc * 1000).toISOString().substr(14, 5)} ${s.title}`; acc += timing[i].dur - XF; return l; });
fs.writeFileSync(path.join(out, 'chapters.txt'), ch.join('\n') + '\n');
console.log(ch.join('\n'));
console.log(`wrote ${final} · ${dur(final).toFixed(1)} s · ${(fs.statSync(final).size / 1048576).toFixed(1)} MB`);
