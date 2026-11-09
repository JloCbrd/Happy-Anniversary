/* ============================================================
   UTILS: shared helpers ($, show) and the heart burst effect.
   ============================================================ */

const $ = id => document.getElementById(id);

// Shows one page (section) and hides the others.
const show = id => {
  document.querySelectorAll('section').forEach(s => s.classList.remove('on'));
  $(id).classList.add('on');
  window.scrollTo(0, 0);
};

/* ---- Heart burst (full-screen canvas on top of everything) ---- */
const fx = $('fx');
const fc = fx.getContext('2d');
const BURST_COLORS = ['#e8456f', '#f2b95e', '#fbeef0', '#ff8fb1'];
let parts = [];

// Keeps the effects canvas the same size as the screen.
function fit() {
  fx.width = innerWidth;
  fx.height = innerHeight;
}
fit();
addEventListener('resize', fit);

// Draws a vector heart centered on (x, y), s = size.
function drawHeart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * .9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * .2, x - s * .7, y - s * 1.1, x, y - s * .4);
  ctx.bezierCurveTo(x + s * .7, y - s * 1.1, x + s * 1.4, y - s * .2, x, y + s * .9);
  ctx.fill();
}

// Shoots n hearts out of (x, y).
function burst(x, y, n = 40) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, s = 2 + Math.random() * 5;
    parts.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3,
      life: 90 + Math.random() * 40,
      color: BURST_COLORS[Math.floor(Math.random() * 4)],
      size: 5 + Math.random() * 8
    });
  }
}

(function loop() {
  fc.clearRect(0, 0, fx.width, fx.height);
  parts = parts.filter(p => p.life-- > 0);
  parts.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += .12;
    fc.globalAlpha = Math.min(1, p.life / 30);
    fc.fillStyle = p.color;
    drawHeart(fc, p.x, p.y, p.size);
  });
  fc.globalAlpha = 1;
  requestAnimationFrame(loop);
})();
