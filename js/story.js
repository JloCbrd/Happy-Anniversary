

/* ============================================================
   STORY: builds the "Our story" polaroids from CONFIG.milestones.
   ============================================================ */

let storyBuilt = false;

function photoHTML(m) {
  const photos = m.photos || (m.photo ? [m.photo] : []);
  if (!photos.length) return '<div class="ph"><span>your photo here</span></div>';
  const imgs = photos.map(src => `<img src="${src}" alt="${m.title}">`).join('');
  return `<div class="ph${photos.length > 1 ? ' multi' : ''}" style="--n:${photos.length}">${imgs}</div>`;
}

// Creates one polaroid per milestone and drops them in while scrolling.
function buildStory() {
  if (storyBuilt) return;
  storyBuilt = true;

  $('sT').textContent = CONFIG.storyTitle;
  $('sS').textContent = CONFIG.storySub;

  $('msList').innerHTML = CONFIG.milestones.map((m, i) => `
    <article class="ms ${i % 2 ? 'r' : 'l'}">
      <div class="polaroid">
        <span class="tape"></span>
        <div class="ph">${m.photo ? `<img src="${m.photo}" alt="${m.title}">` : '<span>your photo here</span>'}</div>
        <p class="cap">${m.title}</p>
      </div>
      <div class="txt"><time>${m.date}</time><p>${m.text}</p></div>
    </article>`).join('');

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .2 });
  document.querySelectorAll('.ms').forEach(el => io.observe(el));
}

$('toJar').onclick = () => { show('jar'); buildJar(); };
