// The scenes shipreel wrote for its own PR #1, rendered with the skill as-is.
// Render it:  node plugins/shipreel/skills/shipreel/engine/build.mjs --scenes examples/pr-1/scenes.mjs
import { title, header, svg, box, arrow, packet, label, card, code, C } from '../../plugins/shipreel/skills/shipreel/engine/lib.mjs';

export const NAME = 'shipreel-pr-1';
export const scenes = [];
const S = (t, html, beats, o = {}) => scenes.push({ title: t, html, beats, ...o });

S('Intro', title({
  kicker: 'theBstar/shipreel · PR #1 · feat/optimal-length',
  line1: 'A target,', line2: 'not a wall',
  lede: 'Video length becomes a guideline: aim for 150 seconds, go longer only when the change needs it.',
  chips: ['video.optimal_seconds', '150 s default', '7 files'],
}), ['This pull request changes how shipreel thinks about video length.',
  'Instead of a hard limit, there is now an optimal length to aim for: a hundred and fifty seconds by default.']);

S('Before and after', header('01 · The rule', 'A note instead of a refusal') + svg(`
${arrow('a1', 'M500 360 L700 360', 'gray', { b: 0 })}${arrow('a2', 'M500 620 L700 620', 'green', { b: 1 })}
${box(120, 290, 380, 140, 'gray', 'max_seconds: 180', 'hard limit', { b: 0, monoT: 1 })}
${box(700, 290, 560, 140, 'red', 'refuses to render', 'unless --force', { b: 0, o: .4 })}
${box(120, 550, 380, 140, 'green', 'optimal_seconds: 150', 'a guideline', { b: 1, monoT: 1, hl: '1-2' })}
${box(700, 550, 560, 140, 'ok', 'renders, and prints a note', '"12 s over the optimal length"', { b: 1, o: .4 })}
${packet('a2', 'green', { b: 1, o: 1, rep: 2 })}
${label(310, 480, 'before', { b: 0 })}${label(310, 740, 'now', { b: 1 })}`),
  ['Before, video max seconds was a wall. Past three minutes, the build refused to render unless you forced it.',
    'Now the build always renders, and prints a note when a video runs past the optimal length.']);

S('Why', header('02 · Why', 'Compact beats complete') +
  card(90, 230, 840, 0, `<h3 style="color:${C.amber}">Attention drops</h3><p>Past two or three minutes, people stop watching. The target keeps videos short by default.</p>`, { b: 0, c: 'amber' }) +
  card(990, 230, 840, 0, `<h3 style="color:${C.green}">Small PR, short video</h3><p>The skill budgets about 350 words for 150 seconds, and doesn't fill time a small change doesn't need.</p>`, { b: 1, c: 'green' }) +
  card(90, 560, 1740, 0, `<p style="font-size:24px">Going longer is allowed, when the change truly needs it, and the agent says so.</p>`, { b: 2, c: 'blue' }),
  ['People lose interest past two or three minutes, so the target keeps videos compact.',
    'The skill now budgets about three hundred and fifty words, and a small change gets a short video. Like this one.',
    'Longer is still allowed when a change really needs it.']);

S('Review', header('03 · Reviewing it', 'Seven files, one idea') +
  code(90, 220, 1100, `// engine/build.mjs
-if (total > +V.max_seconds && !flag('--force')) {
-  console.error(\`Too long: …\`); process.exit(3);
-}
+const over = total - +V.optimal_seconds;
+if (over > 0) console.log(\`Note: \${over} s over the optimal length …\`);`, { b: 0, size: 20 }) +
  card(1250, 220, 580, 0, `<ul><li data-b="1"><code>config.mjs</code>: the default</li><li data-b="1" data-o=".2"><code>SKILL.md</code>: how to plan</li><li data-b="1" data-o=".4">references, README, example</li></ul>`, { b: 1, c: 'violet' }),
  ['The core is five lines in the build script: the refusal becomes a note.',
    'The rest is the default in the config, and the docs that tell the agent how to plan for it.']);
