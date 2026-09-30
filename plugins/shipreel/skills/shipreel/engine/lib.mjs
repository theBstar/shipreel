// Scene helpers for shipreel videos. A scene is plain HTML on a 1920×1080 stage;
// these helpers produce the common pieces. Every element that animates carries
// timing attributes the engine reads (see references/scenes.md):
//   b   beat index the element appears on      o    offset in seconds after that beat
//   a   entrance: up | left | pop | fade | draw  out  beat to fade out on
//   hl  beats to highlight, "k" or "k-m"

export const C = {
  cyan: '#22d3ee', blue: '#5b9dff', violet: '#a78bfa', red: '#ff6b6b', green: '#34d399',
  amber: '#fbbf24', orange: '#e8845c', gray: '#8b93a7', ok: '#34d399', warn: '#fbbf24', bad: '#ff6b6b',
};
const col = c => C[c] || c;
const MK = Object.entries(C).map(([k, c]) => `<marker id="m-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`).join('');
export const DEFS = `<svg width="0" height="0" style="position:absolute"><defs>${MK}</defs></svg>`;

/** Escape text that came from outside (PR titles, commit messages, file names). */
export const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export const at = (o = {}) => `data-b="${o.b ?? 0}"${o.o ? ` data-o="${o.o}"` : ''}${o.out !== undefined ? ` data-out="${o.out}"` : ''}${o.hl ? ` data-hl="${o.hl}"` : ''} data-a="${o.a || 'pop'}"`;

/** A full-stage SVG layer for boxes, arrows, packets and labels. */
export const svg = inner => `<svg class="dg" width="1920" height="1080" viewBox="0 0 1920 1080">${inner}</svg>`;

/** A labelled box. `sub` may hold several lines separated by \n. */
export function box(x, y, w, h, c, title, sub = '', o = {}) {
  const k = col(c); const lines = sub ? sub.split('\n') : [];
  const ts = o.ts || 25, ss = o.ss || 18.5, lh = ss * 1.45;
  const total = ts + (lines.length ? 12 + lines.length * lh : 0);
  const y0 = y + h / 2 - total / 2 + ts * 0.8, cx = x + w / 2;
  let t = `<text x="${cx}" y="${y0}" text-anchor="middle" class="bt${o.monoT ? ' mono' : ''}" style="font-size:${ts}px">${title}</text>`;
  lines.forEach((l, i) => { t += `<text x="${cx}" y="${y0 + 12 + (i + 1) * lh - 2}" text-anchor="middle" class="bs${o.mono ? ' mono' : ''}" style="font-size:${ss}px">${l}</text>`; });
  return `<g ${at(o)} style="color:${k}"${o.id ? ` id="${o.id}"` : ''}><rect class="frame" x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${k}1c" stroke="${k}" stroke-width="2"/>${t}</g>`;
}

/** An arrow along an SVG path `d`. Give it an id to send packets along it. */
export const arrow = (id, d, c, o = {}) => `<path id="${id}" d="${d}" class="ar" stroke="${col(c)}" style="color:${col(c)}" ${o.dash ? 'stroke-dasharray="7 7"' : ''} marker-end="url(#m-${C[c] ? c : 'gray'})" data-a="${o.dash ? 'fade' : 'draw'}" data-b="${o.b ?? 0}"${o.o ? ` data-o="${o.o}"` : ''}${o.hl ? ` data-hl="${o.hl}"` : ''}/>`;

/** A glowing dot that travels along the arrow with id `path`, `rep` times. */
export const packet = (path, c, o = {}) => `<circle class="pk" r="${o.r || 9}" fill="${col(c)}" style="filter:drop-shadow(0 0 8px ${col(c)})" data-path="#${path}" data-b="${o.b ?? 0}" data-o="${o.o || 0.6}" data-dur="${o.dur || 1.3}" data-rep="${o.rep || 3}" data-gap="${o.gap || 0.5}"${o.rev ? ' data-rev="1"' : ''}/>`;

/** A small label inside an svg() layer. */
export const label = (x, y, s, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" class="lbl" style="${o.size ? `font-size:${o.size}px;` : ''}" ${at({ a: 'fade', ...o })}>${s}</text>`;

/** The scene heading: a small kicker line and a title. */
export const header = (kicker, title) => `<div class="hd" data-b="0" data-a="left"><div class="kick">${kicker}</div><h2>${title}</h2></div>`;

/** A positioned card holding any HTML. `o.c` tints its border. */
export const card = (x, y, w, h, inner, o = {}) => `<div class="card" style="left:${x}px;top:${y}px;width:${w}px;${h ? `height:${h}px;` : ''}${o.c ? `color:${col(o.c)};border-color:${col(o.c)}66;` : ''}${o.style || ''}" ${at({ a: 'up', ...o })}><div style="color:var(--fg)">${inner}</div></div>`;

/** A pill. */
export const chip = (t, b = 0, o = 0) => `<span class="chip" data-b="${b}" data-o="${o}" data-a="pop">${t}</span>`;

/** The opening card of a video. */
export const title = ({ kicker, line1, line2, lede, chips = [], gradient = 'linear-gradient(90deg,#22d3ee,#5b9dff 50%,#a78bfa)' }) => `
<div style="position:absolute;left:140px;top:230px;width:1200px">
  <div class="kick" data-b="0" data-a="left">${kicker}</div>
  <h1 data-b="0" data-o=".3" style="font-size:108px;margin:22px 0 0;line-height:1.02;letter-spacing:-.035em">${line1}<br><span style="background:${gradient};-webkit-background-clip:text;color:transparent">${line2}</span></h1>
  ${lede ? `<p data-b="1" style="font-size:32px;color:var(--muted);line-height:1.45;margin-top:38px;max-width:1080px">${lede}</p>` : ''}
  <div style="margin-top:34px">${chips.map((c, i) => chip(c, lede ? 1 : 0, (0.15 * i).toFixed(2))).join('')}</div>
</div>`;

/**
 * A screen recording, framed 16:10 and centred. `name` is a clip under the
 * scenes file's clips/ directory (clips/<name>.webm). `speed` plays it faster
 * than real time; `from` skips seconds at the start. `tags` are callouts in the
 * right margin: [text, beat].
 */
export const clip = (name, kicker, o = {}) => `
<div class="kick" style="position:absolute;left:304px;top:52px" data-b="0" data-a="left">${kicker}</div>
<div class="clipframe" style="left:304px;top:96px;width:1312px;height:820px" data-b="0" data-a="fade">
  <img data-clip="${name}" data-b="0" data-o="${o.o || 0}" data-from="${o.from || 0}" data-speed="${o.speed || 1}"></div>
${(o.tags || []).map(([t, b], i) => `<div class="tag" style="left:1640px;top:${140 + i * 80}px" data-b="${b}" data-a="pop">${t}</div>`).join('')}`;

/** A code panel. Lines starting with + or - are coloured as a diff. */
export const code = (x, y, w, text, o = {}) => {
  const lines = String(text).split('\n').map(l => {
    const cls = l.startsWith('+') ? 'add' : l.startsWith('-') ? 'del' : '';
    return `<div class="ln ${cls}">${esc(l) || '&nbsp;'}</div>`;
  }).join('');
  return `<div class="codepanel" style="left:${x}px;top:${y}px;width:${w}px;${o.size ? `font-size:${o.size}px;` : ''}" ${at({ a: 'up', ...o })}>${o.file ? `<div class="file">${esc(o.file)}</div>` : ''}${lines}</div>`;
};

// ---------- spoken text ----------
// Terms a speech engine reads badly, rewritten before synthesis. Projects add
// their own under `pronounce:` in shipreel.yml.
export const DEFAULT_PRONOUNCE = [
  [/#(\d+)/g, 'number $1'], [/\bAPIs\b/g, 'A P Is'], [/\bAPI\b/g, 'A P I'], [/\bUI\b/g, 'U I'], [/\bURLs?\b/g, m => m.length > 3 ? 'U R Ls' : 'U R L'],
  [/\bSQL\b/g, 'sequel'], [/\bJSONB\b/g, 'jason B'], [/\bJSON\b/g, 'jason'], [/\bYAML\b/g, 'yammel'], [/\bCLI\b/g, 'C L I'], [/\bSDK\b/g, 'S D K'],
  [/\bJWTs?\b/g, m => m.endsWith('s') ? 'J W Ts' : 'J W T'], [/\bOAuth\b/g, 'oh auth'], [/\bCSS\b/g, 'C S S'], [/\bHTML\b/g, 'H T M L'],
  [/\bPRs\b/g, 'P Rs'], [/\bPR\b/g, 'P R'], [/\bCI\b/g, 'C I'], [/\bLLMs?\b/g, m => m.endsWith('s') ? 'L L Ms' : 'L L M'], [/\bRBAC\b/g, 'R back'],
  [/\bPDFs?\b/g, m => m.endsWith('s') ? 'P D Fs' : 'P D F'], [/\bUUIDs?\b/g, m => m.endsWith('s') ? 'U U I Ds' : 'U U I D'], [/\bIDs\b/g, 'I Ds'], [/\bID\b/g, 'I D'],
  [/\b404\b/g, 'four oh four'], [/\b403\b/g, 'four oh three'], [/\b401\b/g, 'four oh one'], [/\b409\b/g, 'four oh nine'], [/\b429\b/g, 'four twenty nine'], [/\b500\b/g, 'five hundred'],
  [/\bRedis\b/g, 'Reddis'], [/\bnginx\b/gi, 'engine X'], [/\bkubectl\b/g, 'cube control'], [/\bPostgres\b/g, 'post gres'], [/\bsqlite\b/gi, 'sequel lite'],
];
