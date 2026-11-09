/* ============================================================
   FINAL: the big question, the runaway "No" button, and the celebration.
   ============================================================ */

let tries = 0;
const no = $('no'), arena = $('arena');

// Moves the "No" button to a random spot so it can never be pressed.
function runAway(e) {
    e.preventDefault();
    tries++;
    const w = arena.clientWidth - no.offsetWidth, h = arena.clientHeight - no.offsetHeight;
    no.style.left = Math.random() * w + 'px';
    no.style.top = Math.random() * h + 'px';
    if (tries > 4)
        no.textContent = 'Nice try';
}

no.addEventListener('pointerenter', runAway);
no.addEventListener('pointerdown', runAway);
$('yes').onclick = () => {
    arena.style.display = 'none';
    $('fQ').style.display = 'none';
    $('fS').style.display = 'none';
    $('fDone').style.display = 'block';
    $('fDone').textContent = CONFIG.finalDone;
    for (let i = 0; i < 6; i++)
        setTimeout(() => burst(Math.random() * innerWidth, innerHeight * .5, 50), i * 250);
};
