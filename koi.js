// ASCII koi. Each fish is painted once as a top-down image, bent along a swimming
// spine every frame, and sampled into characters by coverage, tone and colour.
(() => {
  const canvas = document.getElementById('pond');
  const ctx = canvas.getContext('2d');
  const CW = 6.6, CH = 11;              // character cell, px
  const RAMP = ' .`,:;~-+=*#%$@';
  const SLICES = 32;                    // spine samples per fish
  const SW = 300, SH = 150, SC = SH / 2; // sprite size; nose at x = SW, tail at x = 0
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

  let W, H, cols, rows, dpr, accR, accG, accB, accA, accN;
  function resize() {
    // full device resolution (3x on most phones), and a CSS size that matches the drawing exactly,
    // so the browser never stretches the canvas when the mobile address bar shows or hides
    dpr = Math.min(devicePixelRatio || 1, 3);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / CW); rows = Math.ceil(H / CH);
    const n = cols * rows;
    accR = new Float32Array(n); accG = new Float32Array(n); accB = new Float32Array(n);
    accA = new Float32Array(n); accN = new Uint16Array(n);
  }

  // ---------- painting a koi ----------
  // pattern colour follows the page accent: <html data-accent="blue"> or the default orange-red
  const RED = document.documentElement.dataset.accent === 'blue'
    ? ['#4A5BD9', '#3F4FCB', '#5A6BE3']
    : ['#E0502A', '#D9461F', '#E8642F'];
  function bodyPath(g) {
    g.beginPath();
    g.moveTo(300, SC);
    g.bezierCurveTo(299, SC - 17, 274, SC - 29, 228, SC - 30);
    g.bezierCurveTo(182, SC - 31, 142, SC - 16, 104, SC - 7);
    g.lineTo(104, SC + 7);
    g.bezierCurveTo(142, SC + 16, 182, SC + 31, 228, SC + 30);
    g.bezierCurveTo(274, SC + 29, 299, SC + 17, 300, SC);
    g.closePath();
  }
  // a see-through fin with rays fanning out from its root
  function fin(g, path, root, tips, tint) {
    g.save();
    path(); g.fillStyle = tint; g.fill();
    g.clip();
    g.strokeStyle = 'rgba(150,140,128,.55)'; g.lineWidth = 1.4;
    for (const [x, y] of tips) { g.beginPath(); g.moveTo(root[0], root[1]); g.lineTo(x, y); g.stroke(); }
    g.restore();
  }
  function paintKoi(breed, seed) {
    const cv = document.createElement('canvas');
    cv.width = SW; cv.height = SH;
    const g = cv.getContext('2d');
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;

    // tail: two long lobes with a soft notch, rays from the tail stem
    fin(g, () => {
      g.beginPath();
      g.moveTo(112, SC - 6);
      g.bezierCurveTo(80, SC - 14, 40, SC - 30, 2, SC - 46);
      g.quadraticCurveTo(22, SC - 14, 30, SC);
      g.quadraticCurveTo(22, SC + 14, 2, SC + 46);
      g.bezierCurveTo(40, SC + 30, 80, SC + 14, 112, SC + 6);
      g.closePath();
    }, [112, SC], Array.from({ length: 13 }, (_, i) => {
      const a = -1 + i / 6;
      return [10 + Math.abs(a) * -6 + 18 * (1 - Math.abs(a)), SC + a * 46];
    }), breed === 'ogon' ? 'rgba(232,160,70,.5)' : 'rgba(236,230,220,.52)');

    // pectoral fins (large, rounded) and pelvic fins (small)
    for (const k of [-1, 1]) {
      fin(g, () => {
        g.beginPath();
        g.ellipse(212, SC + k * 44, 30, 15, k * -0.55, 0, TAU);
      }, [236, SC + k * 26], Array.from({ length: 7 }, (_, i) => {
        const a = k * -0.55 + Math.PI + (i - 3) * 0.28;
        return [212 + Math.cos(a) * 34, SC + k * 44 + Math.sin(a) * 34 * k];
      }), 'rgba(236,230,220,.5)');
      fin(g, () => {
        g.beginPath();
        g.ellipse(150, SC + k * 25, 15, 7, k * -0.6, 0, TAU);
      }, [160, SC + k * 16], [[136, SC + k * 32], [140, SC + k * 26], [146, SC + k * 34]], 'rgba(236,230,220,.55)');
    }

    // body: cream scales, shaded darker toward the flanks
    g.save();
    bodyPath(g); g.clip();
    const shade = g.createLinearGradient(0, SC - 32, 0, SC + 32);
    shade.addColorStop(0, '#CFC8BC'); shade.addColorStop(0.3, '#F5F1E9');
    shade.addColorStop(0.5, '#FBF8F2'); shade.addColorStop(0.7, '#F5F1E9'); shade.addColorStop(1, '#CFC8BC');
    g.fillStyle = shade; g.fillRect(0, 0, SW, SH);

    // markings
    const blob = (x, y, rx, ry, color) => {
      g.fillStyle = color; g.beginPath();
      // wobbly outline so patches don't look like ellipses
      for (let i = 0; i <= 24; i++) {
        const a = i / 24 * TAU, w = 1 + 0.18 * Math.sin(a * 3 + rnd() * 6) + 0.1 * Math.sin(a * 5);
        const px = x + Math.cos(a) * rx * w, py = y + Math.sin(a) * ry * w;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.fill();
    };
    if (breed === 'ogon') {
      const gold = g.createLinearGradient(0, SC - 32, 0, SC + 32);
      gold.addColorStop(0, '#D9822E'); gold.addColorStop(0.5, '#F2A54A'); gold.addColorStop(1, '#D9822E');
      g.fillStyle = gold; g.fillRect(0, 0, SW, SH);
    } else if (breed === 'tancho') {
      blob(268, SC, 15, 13, RED[0]);
    } else {
      // kohaku / sanke: a head patch and two or three saddles down the back
      blob(270 - rnd() * 8, SC + (rnd() - 0.5) * 6, 20 + rnd() * 8, 17 + rnd() * 6, RED[0]);
      let x = 232;
      const n = 2 + Math.floor(rnd() * 2);
      for (let i = 0; i < n; i++) {
        const w = 18 + rnd() * 16;
        blob(x - w, SC + (rnd() - 0.5) * 14, w, 20 + rnd() * 10, RED[i % RED.length]);
        x -= w * 2 + 6 + rnd() * 16;
      }
      if (breed === 'sanke') for (let i = 0; i < 5; i++) blob(130 + rnd() * 120, SC + (rnd() - 0.5) * 36, 4 + rnd() * 6, 3 + rnd() * 5, '#26231F');
    }
    // dorsal ridge
    g.strokeStyle = 'rgba(120,108,96,.35)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(214, SC); g.lineTo(132, SC); g.stroke();
    g.restore();

    // eyes
    g.fillStyle = '#1E1C1A';
    for (const k of [-1, 1]) { g.beginPath(); g.arc(281, SC + k * 13, 3.6, 0, TAU); g.fill(); }
    return g.getImageData(0, 0, SW, SH).data;
  }

  // ---------- fish ----------
  const FLOCK = [['kohaku', 1.2], ['sanke', 1.02], ['tancho', 0.9], ['kohaku', 0.8]];
  const fish = [];
  const mouse = { x: -999, y: -999 };
  const ripples = [];

  function makeFish(i) {
    const [breed, size] = FLOCK[i % FLOCK.length];
    const scale = size * (W < 700 ? 0.62 : 1) * rand(0.95, 1.05);
    const len = SW * scale;
    // best-of-many spawn: far from the fish already placed
    let x = 0, y = 0, far = -1;
    for (let k = 0; k < 30; k++) {
      const cx = rand(0.2 * W, 0.8 * W), cy = rand(0.2 * H, 0.8 * H);
      const d = Math.min(...fish.map(o => Math.hypot(o.x - cx, o.y - cy)), Infinity);
      if (d > far) { far = d; x = cx; y = cy; }
    }
    const a = rand(0, TAU);
    const path = [];
    for (let k = 0; k <= 80; k++) path.push({ x: x - Math.cos(a) * len * k / 80, y: y - Math.sin(a) * len * k / 80 });
    return {
      img: paintKoi(breed, Math.floor(rand(1, 2e9))), scale, len,
      x, y, a, speed: len * 0.06, path, step: len / 80,
      wander: 0, turnMem: 0,
      burst: 0, nextBurst: rand(0.5, 3), stroke: rand(0, TAU), amp: 0.3, effort: 0
    };
  }

  // text blocks marked data-koi-avoid, in viewport px with a little padding
  let avoid = [];
  function readAvoid() {
    avoid = [...document.querySelectorAll('[data-koi-avoid]')].map(el => {
      const r = el.getBoundingClientRect();
      return { l: r.left - 24, r: r.right + 24, t: r.top - 18, b: r.bottom + 18 };
    }).filter(b => b.b > 0 && b.t < H);
  }
  const under = (x, y) => avoid.some(b => x > b.l && x < b.r && y > b.t && y < b.b);

  // Burst and coast: a few tail strokes push the fish forward, then it glides and slows.
  // Turning is limited per body length travelled, so a slow fish can't pivot on the spot.
  function swim(f, dt, time) {
    const L = f.len;
    f.wander = clamp(f.wander + (Math.random() - 0.5) * dt * 1.6, -0.7, 0.7);
    let dx = Math.cos(f.a) + 0.8 * Math.cos(f.a + f.wander), dy = Math.sin(f.a) + 0.8 * Math.sin(f.a + f.wander);
    let startled = false;
    for (const b of avoid) {
      const nx = clamp(f.x, b.l, b.r), ny = clamp(f.y, b.t, b.b);
      const ox = f.x - nx, oy = f.y - ny, od = Math.hypot(ox, oy), reach = 0.7 * L;
      if (od === 0) { dy += f.y < (b.t + b.b) / 2 ? -4 : 4; }
      else if (od < reach) { const w = (1 - od / reach) * 3.5; dx += ox / od * w; dy += oy / od * w; }
    }
    for (const o of fish) {
      if (o === f) continue;
      for (let k = 0; k < o.path.length; k += 16) {
        const p = o.path[k], ox = f.x - p.x, oy = f.y - p.y, od = Math.hypot(ox, oy), room = 0.8 * L;
        if (od < room && od > 0) { const w = (1 - od / room) * 1.6; dx += ox / od * w; dy += oy / od * w; }
      }
    }
    const md = Math.hypot(mouse.x - f.x, mouse.y - f.y);
    if (md < 130) { dx += (f.x - mouse.x) / md * 3; dy += (f.y - mouse.y) / md * 3; startled = true; }
    // stay in frame: look a little ahead and turn back well before the edge
    const ax = f.x + Math.cos(f.a) * 0.4 * L, ay = f.y + Math.sin(f.a) * 0.4 * L, m = Math.min(0.55 * L, 0.22 * Math.min(W, H));
    const push = Math.max(m - ax, ax - (W - m), m - ay, ay - (H - m));
    let nearEdge = false;
    if (push > 0) {
      const e = 5 * clamp(push / m, 0, 1), cx = W / 2 - f.x, cy = H / 2 - f.y, cd = Math.hypot(cx, cy) || 1;
      dx += cx / cd * e; dy += cy / cd * e; nearEdge = true;
    }
    // a gentle pull back toward the middle when drifting far out
    const ox = (f.x - W / 2) / (W / 2), oy = (f.y - H / 2) / (H / 2), off = Math.hypot(ox, oy);
    if (off > 0.55) { dx -= ox / off * (off - 0.55) * 1.2; dy -= oy / off * (off - 0.55) * 1.2; }
    // remembered turning makes another lap the same way less attractive
    const want = wrap(Math.atan2(dy, dx) - f.a) - f.turnMem * 0.25;

    // tail strokes: start a burst when coasting has slowed the fish, or when startled
    if (f.burst <= 0 && (time > f.nextBurst || startled)) {
      f.burst = startled ? rand(0.9, 1.3) : rand(1.2, 2.4);
      f.nextBurst = time + f.burst + rand(1.5, 3.5);
    }
    const bursting = f.burst > 0;
    f.burst -= dt;
    // effort eases in and out, so strokes build up and fade instead of switching on
    f.effort = damp(f.effort, bursting ? (startled ? 1.4 : 1) : 0, bursting ? 1.6 : 0.8, dt);
    const thrust = f.effort * 0.2 * L;
    f.speed += (thrust - f.speed * 0.35) * dt;           // thrust against drag
    f.speed = clamp(f.speed, 0.05 * L, 0.5 * L);
    f.amp = 0.3 + 0.7 * Math.min(1, f.effort);
    f.stroke += dt * TAU * (0.8 + 1.1 * Math.min(1, f.effort));

    // curvature in radians per body length travelled
    const travel = (reduce ? 0.3 : 1) * f.speed * dt;
    const maxTurn = (startled ? 3.2 : nearEdge ? 2.6 : 1.8) * travel / L;
    const turn = clamp(want, -maxTurn, maxTurn);
    f.a += turn;
    f.turnMem = (f.turnMem + turn) * Math.exp(-dt * 0.15);
    f.x += Math.cos(f.a) * travel; f.y += Math.sin(f.a) * travel;

    // the rear body takes the path the head already swam
    const head = f.path[0];
    let moved = Math.hypot(f.x - head.x, f.y - head.y);
    if (moved >= f.step) {
      while (moved >= f.step) {
        const k = f.step / moved, h = f.path[0];
        f.path.unshift({ x: h.x + (f.x - h.x) * k, y: h.y + (f.y - h.y) * k });
        moved -= f.step;
      }
      f.path.length = 81;
    }
  }

  // spine slices: points along the swum path, plus a travelling wave toward the tail
  function spine(f) {
    const out = [];
    const n = f.path.length - 1;
    for (let i = 0; i <= SLICES; i++) {
      const u = i / SLICES;                               // 0 nose, 1 tail tip
      const pf = u * n, k = Math.min(n - 1, Math.floor(pf)), t = pf - k;
      const p = k === 0 ? { x: f.x, y: f.y } : f.path[k], q = f.path[k + 1];
      const x = p.x + (q.x - p.x) * t, y = p.y + (q.y - p.y) * t;
      const ang = Math.atan2(p.y - q.y, p.x - q.x);
      // the skull barely moves; the wave grows toward the tail and travels backward
      const wave = f.amp * f.len * 0.055 * Math.pow(u, 1.8) * Math.sin(f.stroke - u * 4.2);
      out.push({ x: x - Math.sin(ang) * wave, y: y + Math.cos(ang) * wave, ang });
    }
    for (let i = 0; i < SLICES; i++) out[i].ang = Math.atan2(out[i].y - out[i + 1].y, out[i].x - out[i + 1].x);
    out[SLICES].ang = out[SLICES - 1].ang;
    return out;
  }

  // ---------- drawing ----------
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    const taken = new Uint8Array(cols * rows);
    // biggest fish first so it sits on top
    for (const f of [...fish].sort((a, b) => b.len - a.len)) {
      const sp = spine(f), touched = [];
      // walk the painted koi in ~2px steps and drop each sample into its character cell
      const nU = Math.ceil(f.len / 2), half = SC * f.scale, nV = Math.ceil(2 * half / 2);
      for (let iu = 0; iu <= nU; iu++) {
        const u = iu / nU, pf = u * SLICES, i = Math.min(SLICES - 1, Math.floor(pf)), t = pf - i;
        const a = sp[i], b = sp[i + 1];
        const x0 = a.x + (b.x - a.x) * t, y0 = a.y + (b.y - a.y) * t;
        const ang = a.ang + wrap(b.ang - a.ang) * t, nx = -Math.sin(ang), ny = Math.cos(ang);
        const sx = Math.round((SW - 1) * (1 - u));
        for (let iv = 0; iv <= nV; iv++) {
          const d = -half + iv * 2, sy = Math.round(SC + d / f.scale);
          if (sy < 0 || sy >= SH) continue;
          const x = x0 + nx * d, y = y0 + ny * d;
          if (x < 0 || y < 0 || x >= W || y >= H) continue;
          const k = Math.floor(y / CH) * cols + Math.floor(x / CW);
          if (taken[k]) continue;
          const o = (sy * SW + sx) * 4, al = f.img[o + 3] / 255;
          if (!accN[k]) touched.push(k);
          accN[k]++;
          if (al > 0) { accR[k] += f.img[o] * al; accG[k] += f.img[o + 1] * al; accB[k] += f.img[o + 2] * al; accA[k] += al; }
        }
      }
      for (const k of touched) {
        const A = accA[k], n = accN[k];
        const R = A ? accR[k] / A : 0, G = A ? accG[k] / A : 0, B = A ? accB[k] / A : 0;
        accR[k] = accG[k] = accB[k] = accA[k] = accN[k] = 0;
        const cov = A / Math.max(n, 6);
        if (cov < 0.3) continue;
        taken[k] = 1;
        const lum = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
        const sat = (Math.max(R, G, B) - Math.min(R, G, B)) / 255;
        // fins are see-through, so coverage^1.5 keeps them lighter than the body
        const dens = clamp(Math.pow(cov, 1.5) * (0.4 + 0.5 * (1 - lum) + 0.15 * sat), 0, 1);
        const ch = RAMP[Math.max(1, Math.round(dens * (RAMP.length - 1)))];
        let color;
        if (sat > 0.18) color = `rgb(${R * 0.92 | 0},${G * 0.85 | 0},${B * 0.85 | 0})`;
        else { const v = clamp(lum * 150 - 25, 30, 135) | 0; color = `rgb(${v},${v - 3},${v - 8})`; }
        const c = k % cols, r = (k / cols) | 0, x = c * CW + CW / 2, y = r * CH + CH / 2;
        ctx.globalAlpha = (0.45 + 0.55 * Math.min(1, cov)) * (under(x, y) ? 0.2 : 1);
        ctx.fillStyle = color;
        ctx.fillText(ch, x, y + 0.5);
      }
    }
    ctx.globalAlpha = 1;

    // cursor ripples
    for (const rp of ripples) {
      const steps = Math.max(16, Math.floor(rp.r * 0.8)), seen = new Set();
      for (let i = 0; i < steps; i++) {
        const a = i / steps * TAU, c = Math.floor((rp.x + Math.cos(a) * rp.r) / CW), r = Math.floor((rp.y + Math.sin(a) * rp.r * 0.9) / CH);
        const key = c + ',' + r; if (seen.has(key)) continue; seen.add(key);
        ctx.fillStyle = `rgba(38,37,35,${rp.life * 0.4})`;
        ctx.fillText(Math.abs(Math.cos(a)) > 0.7 ? '|' : Math.abs(Math.sin(a)) > 0.7 ? '-' : Math.cos(a) * Math.sin(a) > 0 ? '\\' : '/', c * CW + CW / 2, r * CH + CH / 2);
      }
    }
  }

  // fixed-size steps keep bursts and turns the same at any refresh rate
  let last = performance.now(), acc = 0, drawn = false;
  const STEP = 1 / 60;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    readAvoid();
    while (acc >= STEP) {
      const time = now / 1000;
      for (const f of fish) swim(f, STEP, time);
      for (const rp of ripples) { rp.r += 60 * STEP; rp.life -= 0.8 * STEP; }
      acc -= STEP;
    }
    for (let i = ripples.length - 1; i >= 0; i--) if (ripples[i].life <= 0) ripples.splice(i, 1);
    // once the pond is dimmed behind the content, redraw at half rate to save battery
    if (scrollY < innerHeight || (drawn = !drawn)) draw();
    requestAnimationFrame(frame);
  }

  addEventListener('pointermove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (Math.random() < 0.03) ripples.push({ x: e.clientX, y: e.clientY, r: 4, life: 0.5 });
  });
  addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  addEventListener('resize', resize);

  resize();
  const count = W < 700 ? 3 : 4;
  for (let i = 0; i < count; i++) fish.push(makeFish(i));
  document.getElementById('fishCount').textContent = count;
  requestAnimationFrame(frame);
})();
