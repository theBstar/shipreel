// A short example: an imaginary PR that rate-limits a login endpoint.
// Render it:  node plugins/shipreel/skills/shipreel/engine/build.mjs --scenes examples/hello/scenes.mjs
import { title, header, svg, box, arrow, packet, label, card, code, C } from '../../plugins/shipreel/skills/shipreel/engine/lib.mjs';

export const NAME = 'hello-shipreel';
export const scenes = [];
const S = (t, html, beats, o = {}) => scenes.push({ title: t, html, beats, ...o });

S('Intro', title({
  kicker: 'example/api · PR #42 · feat/login-rate-limit',
  line1: 'Slow down', line2: 'password guessing',
  lede: 'Five failed logins from one address now wait a minute before the next try.',
  chips: ['1 middleware', '1 config key', '12 tests'],
}), ['This pull request rate-limits the login endpoint.',
  'After five failed attempts from one address, the next one waits a minute.']);

S('How it works', header('01 · The flow', 'Counted before the password is checked') + svg(`
${arrow('a1', 'M430 420 L620 420', 'cyan', { b: 0 })}${arrow('a2', 'M1000 420 L1190 420', 'green', { b: 1 })}
${arrow('a3', 'M810 500 C 810 640, 810 640, 810 700', 'red', { b: 2 })}
${box(120, 340, 310, 160, 'cyan', 'POST /login', 'email + password', { b: 0 })}
${box(620, 340, 380, 160, 'amber', 'rateLimit()', 'counts failures\nper address', { b: 0, o: 0.3, monoT: 1, hl: '1-2' })}
${box(1190, 340, 330, 160, 'green', 'checkPassword()', 'unchanged', { b: 1, monoT: 1 })}
${box(620, 700, 380, 130, 'red', '429 Too Many Requests', 'Retry-After: 60', { b: 2 })}
${packet('a1', 'cyan', { b: 0, o: 1 })}${packet('a2', 'green', { b: 1, rep: 2 })}${packet('a3', 'red', { b: 2, rep: 2 })}
${label(1100, 560, 'the sixth try', { b: 2, o: 0.5 })}`),
  ['Every login goes through a new middleware before the password is checked.',
    'Under the limit, nothing changes: the request carries on to the password check.',
    'Past it, the answer is a 429 with a Retry-After header, and the password is never checked.']);

S('The change', header('02 · The code', 'One middleware, one setting') +
  code(90, 220, 1000, `// src/middleware/rateLimit.ts
+export function rateLimit({ max = 5, windowSec = 60 } = {}) {
+  return async (req, res, next) => {
+    const key = \`login:\${req.ip}\`;
+    const n = await store.incr(key, windowSec);
+    if (n > max) return res.status(429).set('Retry-After', windowSec).end();
+    next();
+  };
+}`, { b: 0 }) +
  card(1150, 220, 680, 0, `<h3 style="color:${C.amber}">Configurable</h3><p><code>LOGIN_MAX_FAILURES</code> sets the limit; the default is five.</p>`, { b: 1, c: 'amber' }) +
  card(1150, 460, 680, 0, `<h3 style="color:${C.green}">Tested</h3><p>Twelve tests, including the window resetting after a minute.</p>`, { b: 2, c: 'green' }),
  ['The middleware keeps a counter per address that expires after the window.',
    'The limit is a setting, five by default.',
    'And twelve tests cover it, including the window resetting.']);
