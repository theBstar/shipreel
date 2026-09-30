# Working on shipreel

Instructions for coding agents (and people) changing this repository.

## Layout

- `plugins/shipreel/skills/shipreel/`: the skill. `SKILL.md` is what a user's agent follows; `references/` holds the details it loads on demand; `engine/` is the renderer (Node, Puppeteer, ffmpeg).
- `.claude-plugin/marketplace.json` and `plugins/shipreel/.claude-plugin/plugin.json`: the Claude Code marketplace and plugin manifests.
- `examples/`: scenes files that render as-is. `examples/explainer/` holds the repository's only media: the README video and its preview GIF.

## Checks before a pull request

```bash
npm install --prefix plugins/shipreel/skills/shipreel/engine
node plugins/shipreel/skills/shipreel/engine/doctor.mjs
node plugins/shipreel/skills/shipreel/engine/build.mjs --scenes examples/hello/scenes.mjs --stills
claude plugin validate .
```

Look at the stills in `examples/hello/out/`. CI renders them on macOS.

## Rules

- **Dogfood:** make a shipreel video for your own PR with the skill as it stands, and fix what gets in the way. Keep the video out of the repository; the repository's own `shipreel.yml` is the config to use.
- **No media in repositories**: not in this one (beyond the README video in `examples/explainer/`), and the skill must never put any in a user's. When shipreel changes in a way the video should show, re-render it from `examples/explainer/scenes.mjs` rather than adding another.
- **Generic only:** no names of companies, customers or private projects in code, docs, examples or commit messages. CI fails the build on a private denylist.
- **Keep the defaults zero-setup on macOS**; anything else goes behind a `shipreel.yml` key with an adapter.
- **Docs follow the code:** when behaviour changes, update `SKILL.md`, the reference it belongs to, the README and `shipreel.example.yml` in the same PR. Describe the current behaviour, not its history.
- **Bump `version`** in `plugins/shipreel/.claude-plugin/plugin.json` for every release, or installed copies won't update.
