// The stage stylesheet. Fonts come from config (fonts.sans / fonts.mono); the
// defaults use the system stack, so macOS gets SF and Linux gets whatever
// sans-serif it has, with nothing to install.

export function css({ sans, mono, imports = [] }) {
  return `${imports.map(u => `@import url('${u}');`).join('\n')}
:root{--fg:#e8ecf5;--muted:#aeb7cb;--dim:#7c8aa8;--bg:#0b1020;--panel:#121a31;--line:#26335a;--sans:${sans};--mono:${mono}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg)}
#stage{width:1920px;height:1080px;position:relative;overflow:hidden;font-family:var(--sans);color:var(--fg);
 background:radial-gradient(1400px 800px at 75% 10%,#172244 0%,var(--bg) 62%)}
.scene{position:absolute;inset:0}
.hd{position:absolute;left:90px;top:52px}
.kick{font-size:21px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);font-weight:600}
.hd h2{margin:6px 0 0;font-size:52px;font-weight:700;letter-spacing:-.015em}
svg.dg{position:absolute;left:0;top:0}
.bt{font-size:25px;font-weight:700;fill:#eef2fb;font-family:var(--sans)}
.bs{font-size:18.5px;fill:var(--muted);font-family:var(--sans)}
.mono,.mono *{font-family:var(--mono)}
.lbl{font-size:17px;fill:#9aa4ba;font-family:var(--mono)}
.ar{fill:none;stroke-width:2.5}
g.hl rect.frame{stroke-width:4.5px;filter:drop-shadow(0 0 18px currentColor)}
path.hl{stroke-width:5px;filter:drop-shadow(0 0 10px currentColor)}
.card{position:absolute;background:#121a31e6;border:1.5px solid var(--line);border-radius:18px;padding:22px 28px}
.card h3{margin:0 0 12px;font-size:27px;font-weight:700}
.card p,.card li{font-size:21px;line-height:1.45;color:#c4cbdb;margin:0}
.card ul,.card ol{margin:0;padding-left:24px}.card li{margin:6px 0}
.card.hl{box-shadow:0 0 0 2.5px currentColor,0 0 36px -6px currentColor}
code,.code{font-family:var(--mono);font-size:.88em;color:#e9d7a6}
.chip{display:inline-block;padding:7px 14px;margin:5px 6px 5px 0;border-radius:999px;background:#1b2544;border:1px solid #2d3b66;font-size:19px;color:#d6dcea}
.codepanel{position:absolute;background:#0d1426;border:1.5px solid var(--line);border-radius:14px;padding:18px 0;font-family:var(--mono);font-size:19px;line-height:1.55;overflow:hidden}
.codepanel .file{padding:0 22px 12px;margin-bottom:10px;border-bottom:1px solid var(--line);color:var(--dim);font-size:16px}
.codepanel .ln{padding:0 22px;white-space:pre;color:#c9d1e3}
.codepanel .ln.add{background:#34d39918;color:#a7f3d0}.codepanel .ln.del{background:#ff6b6b18;color:#fecaca}
.clipframe{position:absolute;border-radius:16px;overflow:hidden;box-shadow:0 30px 80px -20px #000c,0 0 0 1.5px #2d3b66}
.clipframe img{display:block;width:100%;height:100%;object-fit:cover}
.tag{position:absolute;max-width:262px;line-height:1.3;padding:8px 14px;border-radius:999px;background:#0b1020e6;border:1.5px solid #34d39988;color:#c9f5e4;font-size:20px;font-weight:600}
#caption{position:absolute;left:0;right:0;bottom:6px;height:104px;display:flex;align-items:center;justify-content:center;padding:0 240px;font-size:27px;line-height:1.35;color:#d3d9e8;text-align:center;
 background:linear-gradient(to bottom,transparent,rgba(6,9,20,.92) 45%)}
#progbar{position:absolute;left:0;right:0;bottom:0;height:6px;background:#ffffff12}#prog{height:100%;background:linear-gradient(90deg,#22d3ee,#5b9dff,#a78bfa)}
`;
}
