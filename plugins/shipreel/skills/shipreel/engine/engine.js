// Deterministic timeline engine. window.__render(sceneIdx, t) paints scene at time t (s).
// Elements inside a scene:
//   data-b="k" [data-o="0.5"]   appear at start of beat k (+offset s)
//   data-a="fade|up|left|pop|draw|none"  entrance animation (default up)
//   data-out="k"                 fade out at beat k
//   data-hl="k[-m]"              highlight (glow) during beats k..m
//   <circle class="pk" data-path="#id" data-b="k" data-dur="1.2" data-rep="3">  packet moving along path
(function () {
  const D = 0.55;
  const ease = x => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
  let scenes = [], timing = [];
  window.__setup = (tm) => {
    timing = tm; // [{beats:[start,...], dur}]
    scenes = [...document.querySelectorAll('.scene')];
    scenes.forEach(s => s.querySelectorAll('[data-a="draw"]').forEach(p => {
      if (p.getTotalLength) { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.dataset.len = L; }
    }));
  };
  function bt(si, spec) {
    const b = timing[si].beats; const k = parseInt(spec, 10);
    return k >= b.length ? timing[si].dur : b[k];
  }
  window.__render = (si, t, caption) => {
    scenes.forEach((s, i) => s.style.display = i === si ? 'block' : 'none');
    const s = scenes[si];
    const cap = document.getElementById('caption');
    if (cap) cap.textContent = caption || '';
    const prog = document.getElementById('prog');
    if (prog) prog.style.width = (100 * (si + t / timing[si].dur) / scenes.length) + '%';
    s.querySelectorAll('[data-b]').forEach(el => {
      if (el.classList.contains('pk')) return;
      const t0 = bt(si, el.dataset.b) + parseFloat(el.dataset.o || 0);
      let p = ease((t - t0) / D);
      let op = p;
      if (el.dataset.out !== undefined) {
        const t1 = bt(si, el.dataset.out);
        op *= 1 - ease((t - t1) / D);
      }
      const a = el.dataset.a || 'up';
      const isSvg = el instanceof SVGElement && el.tagName !== 'svg';
      if (a === 'draw') {
        el.style.strokeDashoffset = el.dataset.len * (1 - ease((t - t0) / 1.0));
        let o = t < t0 ? 0 : 1;
        if (el.dataset.out !== undefined) o *= 1 - ease((t - bt(si, el.dataset.out)) / D);
        el.style.opacity = o;
        return;
      }
      el.style.opacity = op;
      let tr = '';
      if (a === 'up') tr = `translateY(${(1 - p) * 24}px)`;
      else if (a === 'left') tr = `translateX(${(1 - p) * -30}px)`;
      else if (a === 'pop') tr = `scale(${0.85 + 0.15 * p})`;
      if (isSvg) { el.style.transformBox = 'fill-box'; el.style.transformOrigin = 'center'; }
      el.style.transform = tr;
    });
    s.querySelectorAll('[data-hl]').forEach(el => {
      const [a, b] = el.dataset.hl.split('-');
      const t0 = bt(si, a), t1 = b !== undefined ? bt(si, b) : timing[si].dur + 1;
      const on = t >= t0 && t < t1;
      el.classList.toggle('hl', on);
    });
    s.querySelectorAll('.pk').forEach(el => {
      const path = s.querySelector(el.dataset.path);
      const t0 = bt(si, el.dataset.b) + parseFloat(el.dataset.o || 0);
      const dur = parseFloat(el.dataset.dur || 1.2), rep = parseInt(el.dataset.rep || 1, 10);
      const gap = parseFloat(el.dataset.gap || 0.4);
      const lt = t - t0; const cyc = dur + gap; const n = Math.floor(lt / cyc);
      if (lt < 0 || n >= rep || lt - n * cyc > dur) { el.style.opacity = 0; return; }
      let f = (lt - n * cyc) / dur; f = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      if (el.dataset.rev) f = 1 - f;
      const L = path.getTotalLength(); const pt = path.getPointAtLength(f * L);
      el.setAttribute('cx', pt.x); el.setAttribute('cy', pt.y); el.style.opacity = 1;
    });
  };
})();
