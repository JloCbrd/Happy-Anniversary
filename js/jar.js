/* ============================================================
   JAR: jar of envelopes (Matter.js physics) + opened-letter overlay.
   ============================================================ */

let jarBuilt = false;

// Sets up the physics world, envelopes, tap handling and drawing.
function buildJar() {
    if (jarBuilt)
        return;
    jarBuilt = true;
    const { Engine, Runner, Bodies, Composite, Body } = Matter;
    const eng = Engine.create(), cv = $('jarc'), c = cv.getContext('2d');
    const W = 300, H = 380, L = 50, R = 250, B = 360, N = CONFIG.reasons.length, need = Math.min(8, N);
    $('cnt').textContent = '0 / ' + N;
    const wall = x => Bodies.rectangle(x, 0, 10, 800, { isStatic: true });
    Composite.add(eng.world, [wall(L - 5), wall(R + 5), Bodies.rectangle(150, B + 5, 220, 10, { isStatic: true })]);
    const hs = [];
    let read = 0;
    CONFIG.reasons.forEach((r, i) => setTimeout(() => {
        const b = Bodies.rectangle(L + 25 + Math.random() * (R - L - 50), -30, 36, 26, {
            restitution: .35, friction: .4, angle: Math.random() * 3
        });
        b.reason = r;
        b.read = false;
        hs.push(b);
        Composite.add(eng.world, b);
    }, i * 300));
    const ff = Array.from({ length: 16 }, () => ({
        x: L + Math.random() * 200, y: 60 + Math.random() * 290, p: Math.random() * 6, s: .2 + Math.random() * .4
    }));
    const heart = (x, y, s) => {
        c.beginPath();
        c.moveTo(x, y + s * .9);
        c.bezierCurveTo(x - s * 1.4, y - s * .2, x - s * .7, y - s * 1.1, x, y - s * .4);
        c.bezierCurveTo(x + s * .7, y - s * 1.1, x + s * 1.4, y - s * .2, x, y + s * .9);
        c.fill();
    };
    $('shake').onclick = () => hs.forEach(b => Body.setVelocity(b, { x: (Math.random() - .5) * 14, y: -10 - Math.random() * 8 }));
    cv.addEventListener('pointerdown', e => {
        const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
        let best = null, bd = 28;
        hs.forEach(b => {
            const d = Math.hypot(b.position.x - x, b.position.y - y);
            if (d < bd) {
                bd = d;
                best = b;
            }
        });
        if (!best)
            return;
        Composite.remove(eng.world, best);
        hs.splice(hs.indexOf(best), 1);
        read++;
        $('cnt').textContent = read + ' / ' + N;
        if (read >= need)
            $('toFinal').style.display = 'inline-block';
        const ov = $('ov'), lt = ov.querySelector('.lt');
        ov.style.setProperty('--dx', (e.clientX - innerWidth / 2) + 'px');
        ov.style.setProperty('--dy', (e.clientY - innerHeight / 2) + 'px');
        $('ovt').textContent = best.reason;
        lt.style.animation = 'none';
        void lt.offsetWidth;
        lt.style.animation = '';
        ov.className = 'on';
        setTimeout(() => ov.classList.add('open'), 750);
        setTimeout(() => ov.classList.add('show'), 1300);
    });
    $('ovc').onclick = () => {
        $('ov').className = '';
        if (read === N) {
            $('cnt').textContent = 'All ' + N + ' found';
            $('note').textContent = 'The jar is empty now, but my reasons never run out.';
            burst(innerWidth / 2, innerHeight / 2, 80);
        }
    };
    Runner.run(Runner.create(), eng);
    const body = () => {
        c.beginPath();
        c.roundRect(L - 10, 44, R - L + 20, B - 34, [10, 10, 38, 38]);
    };
    (function draw() {
        c.clearRect(0, 0, W, H);
        body();
        c.fillStyle = 'rgba(190,210,255,.10)';
        c.fill();
        ff.forEach(f => {
            f.p += .02;
            f.x = Math.min(R - 8, Math.max(L + 8, f.x + Math.sin(f.p) * f.s));
            f.y = Math.min(B - 8, Math.max(60, f.y + Math.cos(f.p * .7) * f.s));
            const a = .4 + .6 * Math.abs(Math.sin(f.p * 2)), gr = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, 9);
            gr.addColorStop(0, 'rgba(255,230,140,' + a + ')');
            gr.addColorStop(1, 'rgba(255,230,140,0)');
            c.fillStyle = gr;
            c.fillRect(f.x - 9, f.y - 9, 18, 18);
        });
        hs.forEach(b => {
            c.save();
            c.translate(b.position.x, b.position.y);
            c.rotate(b.angle);
            c.fillStyle = '#ff8fb1';
            c.fillRect(-18, -13, 36, 26);
            c.fillStyle = '#ff6f9c';
            c.beginPath();
            c.moveTo(-18, -13);
            c.lineTo(18, -13);
            c.lineTo(0, 2);
            c.fill();
            c.strokeStyle = '#e0527f';
            c.lineWidth = 1.5;
            c.strokeRect(-18, -13, 36, 26);
            c.fillStyle = '#b01e3c';
      c.beginPath();
      c.arc(0, 1, 5, 0, 6.28);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)';
      c.fillRect(-2, -1, 2, 2);
            c.restore();
        });
        body();
        c.strokeStyle = 'rgba(225,235,255,.85)';
        c.lineWidth = 4;
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,.12)';
        c.fillRect(L + 2, 70, 8, 200);
        c.fillStyle = '#f2b95e';
        c.beginPath();
        c.roundRect(L - 18, 32, R - L + 36, 16, 8);
        c.fill();
        c.fillStyle = '#e8456f';
        c.beginPath();
        c.ellipse(138, 28, 12, 7, -.4, 0, 6.28);
        c.fill();
        c.beginPath();
        c.ellipse(162, 28, 12, 7, .4, 0, 6.28);
        c.fill();
        c.beginPath();
        c.arc(150, 29, 5, 0, 6.28);
        c.fill();
        requestAnimationFrame(draw);
    })();
}

$('toFinal').onclick = () => {
    show('final');
    $('fQ').textContent = CONFIG.finalQ;
    $('fS').textContent = CONFIG.finalSub;
};
