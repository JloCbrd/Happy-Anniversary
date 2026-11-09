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
    const dpr = Math.min(window.devicePixelRatio || 1, 3);   // sharp on phone screens
    cv.width = W * dpr;
    cv.height = H * dpr;
    $('cnt').textContent = '0 / ' + N;
    // Thick walls/floor so fast envelopes can't tunnel through them.
    const wall = x => Bodies.rectangle(x, 0, 30, 800, { isStatic: true });
    Composite.add(eng.world, [wall(L - 15), wall(R + 15), Bodies.rectangle(150, B + 15, 260, 30, { isStatic: true })]);
    // Lid: added only after every envelope has dropped in, so nothing can fly out of the jar.
    let ready = false;
    setTimeout(() => {
        Composite.add(eng.world, Bodies.rectangle(150, 54, 260, 20, { isStatic: true }));
        ready = true;
    }, N * 300 + 1600);
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
    // Shake show: sparkles, excited fireflies, golden glass glow, a hopping lid.
    let excite = 0, shine = 0, lidT = -1e4, shakes = 0;
    const sparks = [];
    const SPARK_COLORS = ['#ffe08a', '#fff3c4', '#ff8fb1', '#ffffff'];
    const sparkBurst = (x, y, n, spread = 2.4) => {
        for (let i = 0; i < n; i++) {
            const a = -Math.PI / 2 + (Math.random() - .5) * spread, v = 1.5 + Math.random() * 4.5;
            sparks.push({
                x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
                life: 45 + Math.random() * 45, max: 90, s: 1.5 + Math.random() * 2.5,
                col: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)]
            });
        }
    };
    const HINTS = [
        'Something is glowing in there… tap it \u2728',
        'The jar picked one just for you \u2661',
        'Hehe, shake all you want. I have plenty more.',
        'This one has your name on it…'
    ];
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
    // Safety net: if an envelope ever ends up outside the jar, put it back inside.
    const rescue = () => hs.forEach(b => {
        const p = b.position;
        if (p.x < L || p.x > R || p.y > B || (ready && p.y < 62) || !isFinite(p.x + p.y)) {
            Body.setPosition(b, { x: L + 30 + Math.random() * (R - L - 60), y: 150 + Math.random() * 100 });
            Body.setVelocity(b, { x: 0, y: 0 });
        }
    });
    setInterval(rescue, 250);

    // Shake: the jar wobbles, envelopes tumble around inside, and the jar "picks" one for her.
    let lastShake = 0;
    const doShake = () => {
        const now = Date.now();
        if (!ready || !hs.length || now - lastShake < 900)
            return;
        lastShake = now;
        const jw = $('jarwrap');
        jw.classList.remove('wobble');
        void jw.offsetWidth;
        jw.classList.add('wobble');
        hs.forEach(b => {
            Body.setVelocity(b, { x: (Math.random() - .5) * 8, y: -5 - Math.random() * 4 });
            Body.setAngularVelocity(b, (Math.random() - .5) * .4);
        });
        const pick = hs[Math.floor(Math.random() * hs.length)];
        Body.setVelocity(pick, { x: 0, y: -11 });
        pick.glow = performance.now() + 5000;
        // the show
        excite = 1;
        shine = 1;
        lidT = performance.now();
        sparkBurst(150, 46, 34);
        const r = cv.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height * .12, 22);
        if (navigator.vibrate)
            navigator.vibrate([40, 30, 70]);
        const note = $('note');
        note.textContent = HINTS[shakes++ % HINTS.length];
        note.classList.remove('pop');
        void note.offsetWidth;
        note.classList.add('pop');
    };
    $('shake').onclick = () => {
        doShake();
        enableMotionShake();
    };

    // Bonus: really shaking the phone works too (iPhone asks permission on the first button tap).
    let motionOn = false;
    function enableMotionShake() {
        if (motionOn || typeof DeviceMotionEvent === 'undefined')
            return;
        const attach = () => {
            motionOn = true;
            addEventListener('devicemotion', e => {
                const a = e.accelerationIncludingGravity;
                if (!a || !$('jar').classList.contains('on'))
                    return;
                if (Math.hypot(a.x || 0, a.y || 0, a.z || 0) > 25)
                    doShake();
            });
        };
        try {
            if (typeof DeviceMotionEvent.requestPermission === 'function')
                DeviceMotionEvent.requestPermission().then(r => { if (r === 'granted') attach(); }).catch(() => {});
            else
                attach();
        } catch (err) { }
    }
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
        if (read < N)
            $('note').textContent = '';
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
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.clearRect(0, 0, W, H);
        excite = Math.max(0, excite - .008);
        shine = Math.max(0, shine - .01);
        body();
        c.fillStyle = 'rgba(190,210,255,.10)';
        c.fill();
        if (shine > 0) {
            c.fillStyle = 'rgba(255,224,138,' + (.2 * shine) + ')';
            c.fill();
        }
        ff.forEach(f => {
            const sp = f.s * (1 + excite * 10), rad = 9 + excite * 6;
            f.p += .02 + excite * .08;
            f.x = Math.min(R - 8, Math.max(L + 8, f.x + Math.sin(f.p) * sp));
            f.y = Math.min(B - 8, Math.max(60, f.y + Math.cos(f.p * .7) * sp));
            const a = Math.min(1, .4 + .6 * Math.abs(Math.sin(f.p * 2)) + excite * .5), gr = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
            gr.addColorStop(0, 'rgba(255,230,140,' + a + ')');
            gr.addColorStop(1, 'rgba(255,230,140,0)');
            c.fillStyle = gr;
            c.fillRect(f.x - rad, f.y - rad, rad * 2, rad * 2);
        });
        hs.forEach(b => {
            c.save();
            c.translate(b.position.x, b.position.y);
            c.rotate(b.angle);
            if (b.glow && b.glow > performance.now()) {
                c.shadowColor = '#ffe08a';
                c.shadowBlur = 14 + 8 * Math.sin(performance.now() / 120);
            }
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
            if (b.glow && b.glow > performance.now()) {
                const t = performance.now() / 260;
                c.fillStyle = '#fff3c4';
                for (let k = 0; k < 3; k++) {
                    c.beginPath();
                    c.arc(Math.cos(t + k * 2.09) * 28, Math.sin(t + k * 2.09) * 21, 2.4, 0, 6.28);
                    c.fill();
                }
                if (Math.random() < .35)
                    sparks.push({ x: b.position.x, y: b.position.y, vx: (Math.random() - .5) * .8, vy: -.3 - Math.random() * .6, life: 40, max: 90, s: 1.6, col: '#ffe08a' });
            }
            c.restore();
        });
        body();
        c.strokeStyle = shine > 0 ? 'rgba(255,240,190,.95)' : 'rgba(225,235,255,.85)';
        c.lineWidth = 4;
        c.shadowColor = 'rgba(255,224,138,' + shine + ')';
        c.shadowBlur = 26 * shine;
        c.stroke();
        c.shadowBlur = 0;
        c.fillStyle = 'rgba(255,255,255,.12)';
        c.fillRect(L + 2, 70, 8, 200);
        // Lid + bow: hops and rattles when shaken
        const lt = performance.now() - lidT, k = lt < 800 ? 1 - lt / 800 : 0;
        c.save();
        c.translate(150, 40);
        c.rotate(Math.sin(lt / 70) * k * .12);
        c.translate(-150, -40 - Math.abs(Math.sin(lt / 110)) * k * 22);
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
        c.restore();
        // Sparkles
        for (let n = sparks.length - 1; n >= 0; n--) {
            const p = sparks[n];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += .06;
            if (--p.life <= 0) {
                sparks.splice(n, 1);
                continue;
            }
            c.globalAlpha = Math.min(1, p.life / 30);
            c.fillStyle = p.col;
            c.shadowColor = p.col;
            c.shadowBlur = 8;
            c.beginPath();
            c.arc(p.x, p.y, p.s, 0, 6.28);
            c.fill();
        }
        c.globalAlpha = 1;
        c.shadowBlur = 0;
        requestAnimationFrame(draw);
    })();
}

$('toFinal').onclick = () => {
    show('final');
    $('fQ').textContent = CONFIG.finalQ;
    $('fS').textContent = CONFIG.finalSub;
};
