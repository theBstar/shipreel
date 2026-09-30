// Narration. Each adapter turns one line of text into an audio file.
//   say      macOS's built-in voices. The default on a Mac: nothing to install.
//   piper    Piper (https://github.com/rhasspy/piper), free and local. Needs a model file.
//   command  any other engine: a shell command with {text_file} and {out} placeholders,
//            e.g. a Kokoro or cloud TTS script of your own.
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';

const has = bin => { try { execSync(`command -v ${bin}`, { stdio: 'ignore' }); return true; } catch { return false; } };

export function resolveVoice(cfg = {}) {
  let engine = cfg.engine || 'auto';
  if (engine === 'auto') {
    if (process.platform === 'darwin' && has('say')) engine = 'say';
    else if (has('piper') && cfg.piper?.model) engine = 'piper';
    else if (cfg.command) engine = 'command';
    else throw new Error('No voice engine. On macOS `say` is used automatically. Elsewhere set voice.engine '
      + 'to piper (with voice.piper.model) or command in shipreel.yml.');
  }
  if (engine === 'say') {
    const v = cfg.say?.voice || 'Samantha', r = String(cfg.say?.rate || 178);
    return { name: `say:${v}:${r}`, ext: 'aiff', synth: (text, out) => execFileSync('say', ['-v', v, '-r', r, '-o', out, text]) };
  }
  if (engine === 'piper') {
    const model = cfg.piper?.model;
    if (!model || !fs.existsSync(model)) throw new Error(`voice.piper.model not found: ${model}`);
    const extra = cfg.piper?.speaker != null ? ['--speaker', String(cfg.piper.speaker)] : [];
    return { name: `piper:${model}:${cfg.piper?.speaker ?? ''}`, ext: 'wav',
      synth: (text, out) => execFileSync('piper', ['--model', model, '--output_file', out, ...extra], { input: text }) };
  }
  if (engine === 'command') {
    const tpl = cfg.command;
    if (!tpl || !tpl.includes('{out}')) throw new Error('voice.command needs an {out} placeholder (and {text_file} for the text).');
    return { name: `command:${tpl}`, ext: cfg.command_ext || 'wav',
      synth: (text, out) => { const tf = out + '.txt'; fs.writeFileSync(tf, text);
        execSync(tpl.replaceAll('{text_file}', JSON.stringify(tf)).replaceAll('{out}', JSON.stringify(out)), { stdio: 'ignore' }); } };
  }
  throw new Error(`Unknown voice.engine: ${engine}`);
}
