'use strict';
/* Latar luar angkasa: nebula, bintang berkelip, planet kecil, dan komet yang lewat. */
(() => {
  const c = document.getElementById('sky'); if (!c) return;
  const x = c.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, stars = [], comets = [], next = 1500;
  function size() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
    stars = Array.from({ length: Math.round(W * H / 5500) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + .3, p: Math.random() * 6.28, s: Math.random() * 1.5 + .5 }));
    if (still) frame(0);
  }
  function neb(cx, cy, r, col) {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  }
  function planet(cx, cy, r) {
    const g = x.createRadialGradient(cx - r / 3, cy - r / 3, r / 6, cx, cy, r);
    g.addColorStop(0, '#ffb86b'); g.addColorStop(1, '#a8325e');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 6.28); x.fill();
    x.strokeStyle = 'rgba(255,230,180,.55)'; x.lineWidth = 3;
    x.beginPath(); x.ellipse(cx, cy, r * 1.7, r * .4, -.35, 0, 6.28); x.stroke();
  }
  function frame(t) {
    const g = x.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#050818'); g.addColorStop(.5, '#16124f'); g.addColorStop(1, '#2a1a63');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    neb(W * .2, H * .25, W * .6, 'rgba(120,80,255,.22)');
    neb(W * .85, H * .75, W * .6, 'rgba(255,90,170,.14)');
    neb(W * .6, H * .08, W * .4, 'rgba(60,170,255,.12)');
    planet(W * .88, H * .14, Math.min(W, 600) * .045);
    for (const s of stars) {
      x.globalAlpha = .35 + .65 * Math.abs(Math.sin(t / 1000 * s.s + s.p));
      x.fillStyle = '#fff'; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.28); x.fill();
    }
    x.globalAlpha = 1;
    if (!still && t > next) {
      comets.push({ x: W * (.4 + Math.random() * .6), y: -20, vx: -(4 + Math.random() * 3), vy: 2.5 + Math.random() * 2 });
      next = t + 3500 + Math.random() * 5000;
    }
    for (const m of comets) {
      const a = Math.atan2(m.vy, m.vx), tx = m.x - Math.cos(a) * 95, ty = m.y - Math.sin(a) * 95;
      const l = x.createLinearGradient(m.x, m.y, tx, ty);
      l.addColorStop(0, 'rgba(255,255,255,.95)'); l.addColorStop(.3, 'rgba(150,200,255,.5)'); l.addColorStop(1, 'rgba(150,200,255,0)');
      x.strokeStyle = l; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(m.x, m.y); x.lineTo(tx, ty); x.stroke();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(m.x, m.y, 3.2, 0, 6.28); x.fill();
      m.x += m.vx; m.y += m.vy;
    }
    comets = comets.filter(m => m.x > -120 && m.y < H + 120);
    if (!still) requestAnimationFrame(frame);
  }
  addEventListener('resize', size);
  size();
  if (!still) requestAnimationFrame(frame);
})();
