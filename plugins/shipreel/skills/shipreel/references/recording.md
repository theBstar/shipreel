# Recording the UI

For a change with a user interface, real footage beats any diagram. `record.mjs` drives the app in headless Chrome and records `.webm` clips.

## Before you start

- `app.url` in `shipreel.yml` must point at a running app: local dev, or a preview deployment.
- If the app needs a sign-in, `app.login` describes the steps and `app.credentials` says where the username and password come from (environment variables, or a git-ignored file). Never ask the user to paste a password into the chat, and never print one.
- **Data on screen.** If the account shows real customer or personal data, tell the user before recording and let them choose: a demo account, a question or view that only shows aggregates, or no recording.
- **Cost.** If the flow triggers paid work (an LLM call, a paid API, warehouse queries), estimate it and ask first.

## A recording script

Write one small script per clip next to the scenes file, and run it with `node`:

```js
import { session } from '/abs/path/to/engine/record.mjs';
const s = await session();                     // signs in on first use; the profile is kept
await s.goto('/settings/billing');
const rec = await s.record(new URL('./clips/02_billing.webm', import.meta.url).pathname);
await s.click('button', /Change plan/);
await s.click('[role=option]', /^Team$/);
await s.waitForText(/Plan updated/, 60000);
await s.sleep(2500);                           // let the result sit on screen
await rec.stop();
await s.close();
```

`session()` helpers: `goto(path)`, `click(selector, /text/)` (matches visible text or aria-label; scrolls and hovers first so the cursor path reads on camera), `type(selector, text)` (types like a person), `waitForText(/re/)`, `exists(selector, /re/)`, `scroll(dy)`, `shot(file)`, `sleep(ms)`, and `page` for anything else (it is a Puppeteer page).

## Lessons that save a re-take

- **Find selectors first.** Take a screenshot (`s.shot('x.png')`) and list buttons (`s.page.$$eval('button', b => b.map(x => x.textContent.trim()))`) before scripting the take.
- **Buttons may be icon-only.** Match on `aria-label` or a `data-testid`, not only visible text.
- **Slow steps.** Record the whole wait, then cut it with ffmpeg into a time-lapse (see scenes.md) and say so on screen with a tag ("sped up 50×").
- **First-load glitches.** A panel that errors on its first open in development (for example React StrictMode running an effect twice) may be fine on reload. Record after a warm-up load, and report the glitch to the user as a finding rather than hiding it.
- **Check every clip** with a contact sheet before building the scene, and trim a clip that ends on something misleading.
- **Keep the viewport** at `app.viewport` (default 1600×1000); the frame in the video is 16:10.
