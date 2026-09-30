# shipreel.yml

Put `shipreel.yml` at the root of your repository (or `.shipreel.yml`, or `.github/shipreel.yml`). Every key is optional: on a Mac with Chrome and ffmpeg, no file is needed at all.

```yaml
# What every video should be like. Read before planning each one.
instructions: |
  Audience: engineers reviewing the PR. Lead with the user-facing change.
  Keep it under two minutes for small PRs.

video:
  max_seconds: 180        # refuses to render longer (build.mjs --force overrides)
  fps: 24
  crossfade: 0.6          # seconds, between scenes
  music: pad              # pad (synthesized, royalty-free) | none | path/to/track.mp3
  music_volume: 0.55
  max_mb: 9.5             # re-encodes until under this (GitHub's upload limit is 10 MB)

voice:
  engine: auto            # auto | say | piper | command
  say:                    # macOS
    voice: Samantha       # `say -v '?'` lists voices; premium voices sound better if installed
    rate: 178
  piper:                  # Linux or anywhere: https://github.com/rhasspy/piper
    model: ./voices/en_US-lessac-medium.onnx
    speaker: null
  command: null           # any engine: "my-tts --in {text_file} --out {out}"
  command_ext: wav

browser:
  path: auto              # auto finds Chrome, Chromium, Edge or Brave; or an absolute path
                          # (SHIPREEL_CHROME overrides both)

fonts:
  sans: auto              # the system stack: SF on macOS, Segoe on Windows, the default sans elsewhere
  mono: auto
  imports: []             # e.g. ["https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"]

app:                      # only for recording the UI
  url: http://localhost:3000
  viewport: { width: 1600, height: 1000 }
  login:
    path: /login          # where the sign-in form is
    check: /              # a page that redirects to `path` when signed out
    steps:
      - fill: 'input[type=email]'
        with: username
      - click: 'button[type=submit]'
      - fill: 'input[type=password]'
        with: password
      - click: 'button[type=submit]'
    settle: 4000          # ms to wait after the last step
  credentials:            # never a literal value
    username: { env: SHIPREEL_DEMO_USER }
    password: { file: .shipreel/credentials, line: 2 }   # keep this file git-ignored

pronounce:                # extra spoken-text rewrites
  kubectl: cube control

output:
  dir: .shipreel          # scenes, clips, renders and the browser profile; add it to .gitignore
```

## Login steps

`fill` (a selector, `with` a credential key), `click` (a selector), `press` (a key, such as `Enter`), `wait` (milliseconds or a selector). Each step can take `pause` (ms, default 600). Signing in happens once: the browser profile in `output.dir/.profile` keeps the session.

## Credentials

`{ env: NAME }` reads an environment variable; `{ file: path, line: N }` reads line N of a file relative to the config (keep it out of git). A plain string is refused, so a password can't end up committed.
