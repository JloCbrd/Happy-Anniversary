/* ============================================================
   GAME: night-walk pixel game. She collects 10 hearts and runs to him.
   ============================================================ */

const gc = $('gc');
const g = gc.getContext('2d');
const LEN = 1500;   // world length in pixels
const GY = 150;     // ground line
const TOTAL = 10;   // hearts to collect (10 for the 10th)

let started = false, won = false, score = 0, frame = 0;
const P = { x: 20, y: GY - 16, vy: 0, onGround: true };   // her
const HIM = { x: LEN - 50 };
const K = { l: 0, r: 0 };                                  // held buttons
const hearts = Array.from({ length: TOTAL }, (_, i) => ({
  x: 150 + i * ((LEN - 330) / 9),
  y: i % 2 ? 105 : 130,          // alternate low / high (all reachable by jumping)
  got: false
}));
let sparks = [];

/* ---- Pixel art: each string is a row, each letter a palette color ---- */
const PAL = { h: '#3b2417', s: '#ffd9b8', e: '#17132b', c: '#ff9bb0', d: '#e8456f', b: '#6b3a2a',
              k: '#1d1a2b', t: '#4f8fe8', p: '#2b3a6b', r: '#e8456f', w: '#ffffff' };
const HER = [
  '..hhhhhh..', '.hhhhhhhh.', 'hhssssshh.', 'hhsesseshh', 'hhscsscshh', 'hh.ssss.hh', 'hh.dddd.hh',
  'hhddddddhh', '.hddddddh.', '..dddddd..', '.dddddddd.', '.dddddddd.', 'dddddddddd'];
const HER_LEGS = [['..ss..ss..', '..ss..ss..', '.bbb..bbb.'], ['...ss.ss..', '...ss.ss..', '..bbb.bbb.']];
const HIM_SPRITE = [
  '..kkkkkk..', '.kkkkkkkk.', '.kssssssk.', '.ksessesk.', '.kssssssk.', '...ssss...', '..tttttt..',
  '.tttttttt.', 'stttttttts', '.tttttttt.', '..pppppp..', '..pppppp..', '..pppppp..'];
const HIM_LEGS = [['..pp..pp..', '..pp..pp..', '.kkk..kkk.'], ['...pp.pp..', '...pp.pp..', '..kkk.kkk.']];
const HEART = ['.rr...rr.', 'rrrrrrrrr', 'rwrrrrrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....'];

// Draws a sprite at (x, y) using the palette; legs swap to look like walking.
function sprite(rows, x, y) {
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1); }
  }));
}
function character(body, legs, x, y, walking) {
  sprite(body, x, y);
  sprite(legs[walking && (frame >> 3) % 2 ? 1 : 0], x, y + 13);
}

/* ---- Scene ---- */
const sky = g.createLinearGradient(0, 0, 0, GY);
sky.addColorStop(0, '#120d1c');
sky.addColorStop(1, '#5a2250');

function drawScene(cam, t) {
  g.fillStyle = sky;
  g.fillRect(0, 0, 320, 180);

  // twinkling stars
  for (let i = 0; i < 45; i++) {
    g.globalAlpha = .3 + .7 * Math.abs(Math.sin(t / 700 + i));
    g.fillStyle = '#fbeef0';
    g.fillRect((i * 73 - cam * .08 + 3200) % 320, (i * 37) % 95, 1, 1);
  }
  g.globalAlpha = 1;

  // moon (crescent)
  g.fillStyle = '#f2b95e';
  g.beginPath(); g.arc(268, 34, 13, 0, 6.28); g.fill();
  g.fillStyle = '#2a1640';
  g.beginPath(); g.arc(274, 30, 12, 0, 6.28); g.fill();

  // skyline with warm windows (parallax)
  for (let b = 0; b < 30; b++) {
    const w = 16 + (b * 7) % 14, h = 30 + (b * 19) % 50;
    const x = ((b * 26 - cam * .4) % 780 + 780) % 780 - 40;
    g.fillStyle = '#241640';
    g.fillRect(x, GY - h, w, h);
    g.fillStyle = '#f2b95e';
    for (let j = 0; j < h - 8; j += 8) for (let i = 3; i < w - 3; i += 6) {
      if ((b + i + j) % 5 === 0) g.fillRect(x + i, GY - h + 4 + j, 2, 3);
    }
  }

  // ground + street lamps
  g.fillStyle = '#2a1840'; g.fillRect(0, GY, 320, 30);
  g.fillStyle = '#4a2d63'; g.fillRect(0, GY, 320, 2);
  for (let wx = 200; wx < LEN; wx += 260) {
    const x = wx - cam;
    if (x < -40 || x > 360) continue;
    const glow = g.createRadialGradient(x, GY - 38, 0, x, GY - 38, 38);
    glow.addColorStop(0, 'rgba(242,185,94,.45)'); glow.addColorStop(1, 'rgba(242,185,94,0)');
    g.fillStyle = glow; g.fillRect(x - 40, GY - 80, 80, 80);
    g.fillStyle = '#0c0814'; g.fillRect(x, GY - 36, 2, 36);
    g.fillStyle = '#f2b95e'; g.fillRect(x - 2, GY - 40, 6, 4);
  }
}

function drawHeartPixels(x, y, color) {
  PAL.r = color;
  sprite(HEART, x, y);
  PAL.r = '#e8456f';
}

/* ---- Game loop ---- */
function startGame() {
  if (started) return;
  started = true;
  requestAnimationFrame(tick);
}

function setScore(text) { $('score').textContent = text; }

function update() {
  P.x = Math.max(0, P.x + (K.r - K.l) * 2);
  P.vy += .45;
  P.y += P.vy;
  if (P.y >= GY - 16) { P.y = GY - 16; P.vy = 0; P.onGround = true; }
  if (K.l || K.r) frame++;

  hearts.forEach(h => {
    if (!h.got && Math.abs(h.x - P.x - 5) < 10 && Math.abs(h.y - P.y - 8) < 14) {
      h.got = true;
      score++;
      setScore(`Hearts ${score}/${TOTAL}`);
      for (let i = 0; i < 8; i++) sparks.push({ x: h.x + 4, y: h.y + 4, vx: (Math.random() - .5) * 3, vy: -Math.random() * 2.5, life: 24 });
    }
  });

  if (P.x >= HIM.x - 14) {
    if (score < TOTAL) {                    // not all hearts yet: hold her back
      P.x = HIM.x - 15;
      setScore(`Hearts ${score}/${TOTAL}. Go back for the rest!`);
    } else {
      won = true;
      setScore(`You found me! ${TOTAL}/${TOTAL}`);
      $('nextGame').style.display = 'block';
      const r = gc.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 60);
    }
  }
}

function tick() {
  const t = Date.now();
  if (!won) update();
  const cam = Math.min(Math.max(P.x - 100, 0), LEN - 320);

  drawScene(cam, t);
  hearts.forEach((h, i) => { if (!h.got) drawHeartPixels(h.x - cam, h.y + Math.sin(t / 300 + i) * 2, '#e8456f'); });
  sparks = sparks.filter(s => s.life-- > 0);
  sparks.forEach(s => {
    s.x += s.vx; s.y += s.vy;
    g.fillStyle = '#f2b95e';
    g.fillRect(s.x - cam, s.y, 2, 2);
  });

  character(HIM_SPRITE, HIM_LEGS, HIM.x - cam, GY - 16, false);
  drawHeartPixels(HIM.x - cam + 1, GY - 28 + Math.sin(t / 250) * 2, won ? '#f2b95e' : '#e8456f');
  character(HER, HER_LEGS, P.x - cam, P.y, P.onGround && (K.l || K.r));
  requestAnimationFrame(tick);
}

/* ---- Controls ---- */
// Wires a button so fn(1) runs while pressed and fn(0) when released.
function hold(id, fn) {
  const b = $(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); fn(1); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => fn(0)));
}
function jump() { if (P.onGround) { P.vy = -6.2; P.onGround = false; } }

hold('bl', v => K.l = v);
hold('br', v => K.r = v);
hold('bj', v => { if (v) jump(); });

addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') K.l = 1;
  if (e.key === 'ArrowRight') K.r = 1;
  if (e.key === 'ArrowUp' || e.key === ' ') { jump(); e.preventDefault(); }
});
addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') K.l = 0;
  if (e.key === 'ArrowRight') K.r = 0;
});

$('nextGame').onclick = () => { startMusic(); show('story'); buildStory(); };   // music begins here and plays to the end
