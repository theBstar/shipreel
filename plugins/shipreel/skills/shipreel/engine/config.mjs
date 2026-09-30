// shipreel.yml: found in the current directory or any parent, or passed with
// --config. Every key is optional; the defaults below need nothing on a Mac.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export const DEFAULTS = {
  video: { max_seconds: 180, fps: 24, crossfade: 0.6, music: 'pad', music_volume: 0.55, max_mb: 9.5 },
  voice: { engine: 'auto', say: { voice: 'Samantha', rate: 178 } },
  browser: { path: 'auto' },
  fonts: {
    sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Inter, 'Helvetica Neue', Arial, sans-serif",
    mono: "'SF Mono', Menlo, 'JetBrains Mono', Consolas, 'DejaVu Sans Mono', monospace",
    imports: [],
  },
  app: { url: null, viewport: { width: 1600, height: 1000 }, login: null, credentials: {} },
  instructions: '',
  pronounce: {},
  output: { dir: '.shipreel' },
};

const NAMES = ['shipreel.yml', 'shipreel.yaml', '.shipreel.yml', '.github/shipreel.yml'];

export function findConfig(start = process.cwd()) {
  let dir = path.resolve(start);
  for (;;) {
    for (const n of NAMES) { const p = path.join(dir, n); if (fs.existsSync(p)) return p; }
    const up = path.dirname(dir);
    if (up === dir || fs.existsSync(path.join(dir, '.git'))) return null;
    dir = up;
  }
}

const merge = (a, b) => {
  if (b === undefined || b === null) return a;
  if (typeof a !== 'object' || a === null || Array.isArray(a) || typeof b !== 'object' || Array.isArray(b)) return b;
  const out = { ...a };
  for (const k of Object.keys(b)) out[k] = merge(a[k], b[k]);
  return out;
};

export function loadConfig(explicit) {
  const file = explicit || findConfig();
  const raw = file ? YAML.parse(fs.readFileSync(file, 'utf8')) || {} : {};
  const cfg = merge(DEFAULTS, raw);
  cfg.__file = file;
  cfg.__root = file ? path.dirname(file).replace(/\/\.github$/, '') : process.cwd();
  if (cfg.fonts.sans === 'auto') cfg.fonts.sans = DEFAULTS.fonts.sans;
  if (cfg.fonts.mono === 'auto') cfg.fonts.mono = DEFAULTS.fonts.mono;
  return cfg;
}

/**
 * A credential from `app.credentials.<key>`: `{ env: NAME }` or
 * `{ file: path, line: N }` (1-based; the file should be git-ignored).
 * Plain strings are refused so a password never lands in a committed file.
 */
export function credential(cfg, key) {
  const spec = cfg.app?.credentials?.[key];
  if (spec == null) throw new Error(`app.credentials.${key} is not set in shipreel.yml`);
  if (typeof spec === 'string') throw new Error(`app.credentials.${key} must be { env: NAME } or { file: path, line: N }, not a literal value`);
  if (spec.env) {
    const v = process.env[spec.env];
    if (!v) throw new Error(`environment variable ${spec.env} (app.credentials.${key}) is empty`);
    return v;
  }
  if (spec.file) {
    const p = path.resolve(cfg.__root, spec.file);
    const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
    const v = lines[(spec.line || 1) - 1];
    if (!v) throw new Error(`line ${spec.line || 1} of ${spec.file} is empty`);
    return v.replace(/\s+$/, '');
  }
  throw new Error(`app.credentials.${key}: use { env: NAME } or { file: path, line: N }`);
}

/** The spoken-text rewrite: the engine's defaults plus the project's `pronounce:` map. */
export function pronouncer(cfg, defaults) {
  const extra = Object.entries(cfg.pronounce || {}).map(([k, v]) => [new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), v]);
  const rules = [...extra, ...defaults];
  return s => rules.reduce((a, [re, r]) => a.replace(re, r), s);
}
