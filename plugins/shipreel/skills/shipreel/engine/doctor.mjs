#!/usr/bin/env node
// Check this machine can render: config, ffmpeg, a browser, a voice, and (if
// set) the app credentials. Prints what it found; never prints a credential.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadConfig, credential } from './config.mjs';
import { resolveBrowser } from './adapters/browser.mjs';
import { resolveVoice } from './adapters/voice.mjs';

const args = process.argv.slice(2);
const cfgPath = args[args.indexOf('--config') + 1];
let failed = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m, hint) => { failed++; console.log(`  ✗ ${m}${hint ? `\n      ${hint}` : ''}`); };
const tryIt = (label, fn, hint) => { try { const r = fn(); ok(r ? `${label}: ${r}` : label); } catch (e) { bad(`${label}: ${e.message.split('\n')[0]}`, hint); } };

console.log('shipreel doctor');
const cfg = loadConfig(args.includes('--config') ? cfgPath : undefined);
cfg.__file ? ok(`config: ${cfg.__file}`) : ok('config: none found, using defaults (add shipreel.yml to change them)');
const major = +process.versions.node.split('.')[0];
major >= 18 ? ok(`node ${process.versions.node}`) : bad(`node ${process.versions.node}`, 'Node 18 or newer is required.');
tryIt('ffmpeg', () => execSync('ffmpeg -hide_banner -version').toString().split('\n')[0].replace('ffmpeg version ', ''),
  process.platform === 'darwin' ? 'brew install ffmpeg' : 'apt-get install ffmpeg (or your package manager)');
tryIt('browser', () => resolveBrowser(cfg.browser));
tryIt('voice', () => {
  const v = resolveVoice(cfg.voice);
  const f = path.join(os.tmpdir(), `shipreel-doctor.${v.ext}`);
  v.synth('Shipreel is ready.', f);
  if (!fs.existsSync(f) || fs.statSync(f).size < 1000) throw new Error('the engine produced no audio');
  return v.name;
});
tryIt('puppeteer-core', () => { execSync('node -e "import(\'puppeteer-core\')"', { cwd: path.dirname(new URL(import.meta.url).pathname) }); return 'installed'; },
  'Run `npm install` in the engine directory.');
if (cfg.app?.url) {
  ok(`app: ${cfg.app.url}`);
  for (const k of Object.keys(cfg.app.credentials || {})) tryIt(`credential "${k}"`, () => { credential(cfg, k); return 'set'; });
} else {
  ok('app: not set (fine for diagram-only videos; set app.url to record the UI)');
}
console.log(failed ? `\n${failed} problem(s).` : '\nReady.');
process.exit(failed ? 1 : 0);
