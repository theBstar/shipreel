// The video in the README: what shipreel is, how to use it, how it works and how to customise it.
// Made with shipreel itself. Render it:
//   node plugins/shipreel/skills/shipreel/engine/build.mjs --scenes examples/explainer/scenes.mjs
import { title, header, svg, box, arrow, packet, label, card, code, chip, C } from '../../plugins/shipreel/skills/shipreel/engine/lib.mjs';

export const NAME = 'shipreel';
export const scenes = [];
const S = (t, html, beats, o = {}) => scenes.push({ title: t, html, beats, ...o });

// 0 — what it is
S('What it is', title({
  kicker: 'theBstar/shipreel · an agent skill',
  line1: 'Every pull request,', line2: 'a short film',
  lede: 'A narrated walkthrough of the change: diagrams, code and the real app, in about two and a half minutes.',
  chips: ['Claude Code', 'Codex', 'Cursor', 'any skills agent'],
}), ['This is shipreel: an agent skill that turns a pull request into a short narrated video, like this one.',
  'Reviewers watch the change, instead of reverse engineering the diff.']);

// 1 — what you get
const feat = (x, c, h, p, b) => card(x, 240, 400, 0, `<h3 style="color:${C[c]};font-size:30px">${h}</h3><p style="font-size:24px">${p}</p>`, { b, c });
S('What you get', header('01 · What you get', 'The change, explained') +
  feat(90, 'blue', 'Diagrams', 'Boxes, arrows and moving packets for how the pieces connect.', 0) +
  feat(530, 'amber', 'The code', 'The lines that matter, as a diff, never the whole file.', 0) +
  feat(970, 'green', 'Real footage', 'For UI changes, it signs in to your app and records the flow.', 1) +
  feat(1410, 'violet', 'Finish', 'Captions, crossfade cuts and a soft music bed.', 2) +
  card(90, 560, 1720, 0, `<p style="font-size:26px">About <b>150 seconds</b> · <b>free and local</b> · <b>zero setup on a Mac</b></p>`, { b: 2, c: 'cyan' }),
  ['Each video explains what changed and why, with animated diagrams and the code that matters.',
    'For a change with a user interface, it signs in to your app and records the real flow.',
    'Captions, cuts and a soft music bed come built in. It runs on your machine for free, and on a Mac there is nothing to set up.']);

// 2 — install and use
S('Install and use', header('02 · Install and use', 'One line to install, one line to ask') +
  code(90, 220, 1000, `$ npx skills add theBstar/shipreel

# or, in Claude Code
/plugin marketplace add theBstar/shipreel
/plugin install shipreel@shipreel`, { b: 0, size: 24, file: 'install' }) +
  card(1150, 220, 680, 0, `<p style="font-size:15px;color:var(--dim);margin-bottom:10px">then, to your agent</p><p style="font-size:32px;color:var(--fg)">“make a shipreel for PR&nbsp;123”</p>`, { b: 1, c: 'green' }),
  ['Install it into any agent that reads skills with npx skills add, or as a Claude Code plugin.',
    'Then ask your agent to make a shipreel for a pull request.']);

// 3 — what the agent does
const st = (x, c, t, s, b) => box(x, 330, 250, 160, c, t, s, { b, ts: 24, ss: 17 });
S('What the agent does', header('03 · The workflow', 'From diff to MP4') + svg(`
${arrow('w1', 'M340 410 L380 410', 'gray', { b: 0 })}${arrow('w2', 'M630 410 L670 410', 'gray', { b: 0, o: .3 })}${arrow('w3', 'M920 410 L960 410', 'gray', { b: 0, o: .6 })}
${arrow('w4', 'M1210 410 L1250 410', 'gray', { b: 1 })}${arrow('w5', 'M1500 410 L1540 410', 'gray', { b: 1, o: .3 })}
${st(90, 'cyan', 'Check', 'doctor: voice,\nbrowser, ffmpeg', 0)}
${st(380, 'blue', 'Read', 'the PR and\nits diff', 0)}
${st(670, 'violet', 'Plan', 'a few scenes,\none idea each', 0)}
${st(960, 'amber', 'Write', 'scenes and\nnarration', 1)}
${st(1250, 'orange', 'Check', 'still frames\nfor layout', 1)}
${st(1540, 'green', 'Render', 'an MP4 under\n10 MB', 1)}
${packet('w3', 'violet', { b: 0, o: 1, rep: 1 })}${packet('w5', 'green', { b: 1, o: 1, rep: 1 })}`) +
  card(90, 600, 1740, 0, `<p style="font-size:24px">You drop the file into the PR. GitHub only takes videos through its editor, so shipreel never uploads anything.</p>`, { b: 1, o: 1, c: 'green' }),
  ['The agent checks your machine, reads the pull request, and plans a few scenes around the ideas that matter.',
    'It writes the script from the code, shows you still frames to check, then renders an MP4 you drop into the pull request.']);

// 4 — how it works
S('How it works', header('04 · The engine', 'HTML in, film out') + svg(`
${arrow('e1', 'M590 400 L660 400', 'cyan', { b: 0 })}${arrow('e2', 'M970 400 L1040 400', 'blue', { b: 1 })}${arrow('e3', 'M1350 400 L1420 400', 'violet', { b: 2 })}
${arrow('e4', 'M1575 480 L1575 580', 'amber', { b: 2, o: .5 })}
${box(280, 320, 310, 160, 'cyan', 'scenes.mjs', 'HTML on a 1920×1080 stage\n+ a narration line per beat', { b: 0, monoT: 1, ss: 16 })}
${box(660, 320, 310, 160, 'blue', 'voice adapter', 'say · Piper\n· any command', { b: 1 })}
${box(1040, 320, 310, 160, 'violet', 'headless Chrome', 'every frame, in step\nwith the voice', { b: 1, o: .4 })}
${box(1420, 320, 310, 160, 'amber', 'ffmpeg', 'crossfades between scenes', { b: 2 })}
${box(1420, 580, 310, 150, 'green', 'MP4', 'music ducked · loudness\nnormalised · under 10 MB', { b: 2, o: .8 })}
${packet('e1', 'cyan', { b: 0, o: 1, rep: 2 })}${packet('e2', 'blue', { b: 1, o: .6, rep: 2 })}${packet('e3', 'violet', { b: 2, rep: 2 })}`),
  ['Under the hood, a scene is plain HTML on a sixteen by nine stage, plus a line of narration for each beat.',
    'A voice adapter speaks each line, and headless Chrome renders every frame in step with it.',
    'Ffmpeg crossfades the scenes, ducks an ambient pad under the voice, and keeps the file under GitHub\'s ten megabyte limit.']);

// 5 — customising
S('Customising it', header('05 · shipreel.yml', 'Every key optional') +
  code(90, 220, 980, `instructions: |
  Audience: reviewers. Lead with the user-facing change.
video:
  optimal_seconds: 150      # a guideline, not a wall
voice:
  engine: piper             # say · piper · command
app:
  url: http://localhost:3000
  credentials:
    password: { env: DEMO_PASSWORD }
pronounce:
  kubectl: cube control`, { b: 0, size: 21, file: 'shipreel.yml' }) +
  card(1130, 220, 700, 0, `<ul><li data-b="1">a brief for every video</li><li data-b="1" data-o=".2">a target length</li><li data-b="2">voice, browser and fonts as adapters</li><li data-b="2" data-o=".2">your app and its sign-in</li><li data-b="3">your project's words</li></ul>`, { b: 1, c: 'violet' }),
  ['Everything is optional, in one shipreel yml file.',
    'Give every video a brief, and a target length: a hundred and fifty seconds by default, a guideline, not a wall.',
    'Swap the voice, browser or fonts with an adapter, and point it at your app, with credentials from the environment, never the file.',
    'And teach it how to say your project\'s words.']);

// 6 — principles and install
S('Get it', header('06 · By design', 'Honest, cheap, clean') +
  card(90, 230, 540, 0, `<h3 style="color:${C.blue}">Facts from the code</h3><p>Current behaviour, and what a reviewer should check.</p>`, { b: 0, c: 'blue' }) +
  card(690, 230, 540, 0, `<h3 style="color:${C.amber}">Asks before it spends</h3><p>Local and free by default; any paid step is estimated first.</p>`, { b: 0, o: .3, c: 'amber' }) +
  card(1290, 230, 540, 0, `<h3 style="color:${C.green}">Your repo stays clean</h3><p>No videos committed, no media branches.</p>`, { b: 0, o: .6, c: 'green' }) +
  code(90, 560, 1740, `$ npx skills add theBstar/shipreel`, { b: 1, size: 30 }) +
  `<div style="position:absolute;left:90px;top:700px;font-size:28px;color:var(--muted)" data-b="1" data-o=".5" data-a="fade">github.com/theBstar/shipreel</div>`,
  ['Every claim comes from the code, it asks before spending anything, and it never puts media in your repository.',
    'Install it with npx skills add, theBstar slash shipreel, and make your next pull request easy to review.']);
