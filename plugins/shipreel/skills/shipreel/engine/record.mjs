// Screen recordings of the real app, for clip() scenes.
//
//   import { session } from '<engine>/record.mjs';
//   const s = await session();                 // opens the app, logs in if app.login is set
//   await s.goto('/orders');
//   const rec = await s.record('clips/01_orders.webm');
//   await s.click('button', /New order/);
//   await s.type('input[name=qty]', '12');
//   await s.waitForText(/Saved/);
//   await rec.stop();
//   await s.close();
//
// The browser profile lives in <output.dir>/.profile so a login survives
// between scripts. Credentials come from app.credentials and are never printed.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { loadConfig, credential } from './config.mjs';
import { resolveBrowser } from './adapters/browser.mjs';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function session({ config, headless = true } = {}) {
  const cfg = loadConfig(config);
  if (!cfg.app?.url) throw new Error('app.url is not set in shipreel.yml');
  const base = cfg.app.url.replace(/\/$/, '');
  const profile = path.resolve(cfg.__root, cfg.output.dir, '.profile');
  fs.mkdirSync(profile, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: resolveBrowser(cfg.browser), headless,
    userDataDir: profile, defaultViewport: cfg.app.viewport, args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  const url = p => (/^https?:/.test(p) ? p : base + (p.startsWith('/') ? p : '/' + p));

  const byText = async (sel, re) => (await page.evaluateHandle((sel, src, flags) => {
    const rx = new RegExp(src, flags);
    return [...document.querySelectorAll(sel)].find(e => rx.test((e.innerText || e.textContent || '').trim()) || rx.test(e.getAttribute('aria-label') || '')) || null;
  }, sel, re.source, re.flags)).asElement();

  const s = {
    page, browser, cfg,
    goto: async (p, wait = 1500) => { await page.goto(url(p), { waitUntil: 'networkidle2' }); await sleep(wait); },
    /** Click the first `sel` whose text or aria-label matches `re` (or a plain selector when `re` is omitted). */
    click: async (sel, re, pause = 900) => {
      const el = re ? await byText(sel, re) : await page.waitForSelector(sel, { timeout: 20000 });
      if (!el) throw new Error(`nothing matching ${sel} ${re}`);
      await el.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'smooth' })); await sleep(300);
      await el.hover(); await sleep(350); await el.click(); await sleep(pause);
    },
    /** Type like a person, so it reads on camera. */
    type: async (sel, text, delay = 45) => { const el = await page.waitForSelector(sel, { timeout: 20000 }); await el.click(); await page.keyboard.type(text, { delay }); },
    waitForText: async (re, timeout = 120000) => {
      await page.waitForFunction((src, flags) => new RegExp(src, flags).test(document.body.innerText), { timeout, polling: 1000 }, re.source, re.flags);
    },
    exists: async (sel, re) => Boolean(re ? await byText(sel, re) : await page.$(sel)),
    scroll: async (dy, pause = 1200) => { await page.mouse.wheel({ deltaY: dy }); await sleep(pause); },
    shot: p => page.screenshot({ path: p }),
    sleep,
    /** Start recording to a .webm (needs ffmpeg on PATH). Returns { stop() }. */
    record: async (file, lead = 1200) => {
      fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
      const rec = await page.screencast({ path: file }); await sleep(lead); return rec;
    },
    close: () => browser.close(),
  };

  await login(s);
  return s;
}

async function login(s) {
  const L = s.cfg.app.login;
  if (!L) { await s.goto('/'); return; }
  await s.goto(L.check || '/');
  const out = L.done_when?.url_not_includes ?? L.path ?? '/login';
  if (!s.page.url().includes(out)) return;             // the saved profile is still signed in
  await s.goto(L.path || '/login');
  for (const step of L.steps || []) {
    if (step.fill) {
      const value = credential(s.cfg, step.with);
      const el = await s.page.waitForSelector(step.fill, { timeout: 20000 });
      await el.click({ clickCount: 3 }); await el.type(value);
    } else if (step.click) {
      await (await s.page.waitForSelector(step.click, { timeout: 20000 })).click();
    } else if (step.press) {
      await s.page.keyboard.press(step.press);
    } else if (step.wait) {
      if (typeof step.wait === 'number') await sleep(step.wait);
      else await s.page.waitForSelector(step.wait, { timeout: 30000 });
    }
    await sleep(step.pause ?? 600);
  }
  await sleep(L.settle ?? 4000);
  if (s.page.url().includes(out)) throw new Error('Login did not complete: still on the login page. Check app.login.steps and the credentials.');
}
