// Which Chrome to drive. `browser.path: auto` (the default) looks in the usual
// places, so a Mac with Chrome in /Applications needs no setup.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CANDIDATES = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  ],
  linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/usr/bin/microsoft-edge'],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
};

export function resolveBrowser(cfg = {}) {
  const wanted = process.env.SHIPREEL_CHROME || (cfg.path && cfg.path !== 'auto' ? cfg.path : null);
  if (wanted) {
    if (!fs.existsSync(wanted)) throw new Error(`browser.path does not exist: ${wanted}`);
    return wanted;
  }
  const found = (CANDIDATES[process.platform] || []).find(p => fs.existsSync(p));
  if (!found) {
    throw new Error('No Chrome, Chromium, Edge or Brave found. Install one, or set browser.path in shipreel.yml '
      + '(or SHIPREEL_CHROME). On Linux: `npx @puppeteer/browsers install chrome@stable` also works.');
  }
  return found;
}
