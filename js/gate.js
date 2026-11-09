/* ============================================================
   GATE: password letter, wax-seal opening, floating hearts
   and fireflies, mouse tilt, and the music button.
   ============================================================ */

const gate = $('gate');
const dateInputs = ['pm', 'pd', 'py'].map($);   // month, day, year

/* ---- Date fields: digits only, jump to the next box when full ---- */
dateInputs.forEach((input, i) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '');
    if (input.value.length === input.maxLength && dateInputs[i + 1]) dateInputs[i + 1].focus();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') tryOpen();
    if (e.key === 'Backspace' && !input.value && dateInputs[i - 1]) dateInputs[i - 1].focus();
  });
});

// Reads the three boxes as YYYY-MM-DD, like CONFIG.firstMeet.
function enteredDate() {
  const [m, d, y] = dateInputs.map(i => i.value);
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// Correct date: the seal cracks, the letter lifts away, the game starts.
// Wrong date: the page shakes and she gets a hint.
function tryOpen() {
  if (gate.classList.contains('opening')) return;

  if (enteredDate() !== CONFIG.firstMeet) {
    $('err').textContent = 'Hmm, that’s not it, pretty. Think back to that day.';
    gate.classList.remove('shake');
    void gate.offsetWidth;            // restart the shake animation
    gate.classList.add('shake');
    return;
  }

  gate.classList.add('opening');
  const r = $('open').getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, 50);
  setTimeout(() => {
    clearInterval(floaters);
    show('game');
    startGame();
    gate.classList.remove('opening');
  }, 1300);
}

$('open').onclick = tryOpen;

/* ---- The letter tilts toward the cursor, a soft light follows it ---- */
const letter = document.querySelector('.letter');
gate.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  letter.style.setProperty('--ry', x * 8 + 'deg');
  letter.style.setProperty('--rx', -y * 6 + 'deg');
  gate.style.setProperty('--mx', e.clientX + 'px');
  gate.style.setProperty('--my', e.clientY + 'px');
});

/* ---- Floating hearts (2 of 3) and fireflies (1 of 3) ---- */
const HEART_COLORS = ['#e8456f', '#f2b95e', '#ff8fb1'];

function spawnFloater(preRoll = 0) {
  const s = document.createElement('span');
  const firefly = Math.random() < .35;
  s.className = firefly ? 'ff' : 'fh';
  s.style.left = Math.random() * 100 + '%';
  s.style.setProperty('--s', (firefly ? 3 + Math.random() * 4 : 12 + Math.random() * 22) + 'px');
  if (firefly) {
    s.style.top = 40 + Math.random() * 60 + '%';
    s.style.setProperty('--dx', (Math.random() - .5) * 160 + 'px');
  } else {
    s.style.color = HEART_COLORS[Math.floor(Math.random() * 3)];
    s.style.animationDuration = 7 + Math.random() * 5 + 's';
  }
  s.style.animationDelay = -preRoll + 's';     // negative delay = already mid-flight
  gate.appendChild(s);
  setTimeout(() => s.remove(), 13000);
}

for (let i = 0; i < 14; i++) spawnFloater(Math.random() * 7);   // fill the screen at load
const floaters = setInterval(() => { if (gate.classList.contains('on')) spawnFloater(); }, 600);

/* ---- Optional background music (set CONFIG.music to an mp3 path) ---- */
const audio = new Audio();
if (CONFIG.music) {
  audio.src = CONFIG.music;
  audio.loop = true;
  $('music').style.display = 'block';
  $('music').onclick = () => (audio.paused ? audio.play().catch(() => {}) : audio.pause());
}
