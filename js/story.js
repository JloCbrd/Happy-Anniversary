

/* ============================================================
   STORY: builds the "Our story" polaroids from CONFIG.milestones.
   ============================================================ */

let storyBuilt = false;

function photoHTML(m) {
  // Use "photos: [...]" for several pictures, or "photo: '...'" for one.
  const photos = (m.photos && m.photos.length) ? m.photos : (m.photo ? [m.photo] : []);
  if (!photos.length) return '<div class="ph"><span>your photo here</span></div>';
  const imgs = photos.map(src => `<img src="${src}" alt="${m.title}" loading="lazy">`).join('');
  if (photos.length === 1) return `<div class="ph">${imgs}</div>`;
  const dots = photos.map((_, i) => `<span class="${i ? '' : 'on'}"></span>`).join('');
  return `<div class="ph multi">
      <div class="track">${imgs}</div>
      <button class="nav prev" type="button" aria-label="Previous photo">&#8249;</button>
      <button class="nav next" type="button" aria-label="Next photo">&#8250;</button>
      <div class="dots">${dots}</div>
    </div>`;
}

// Makes each multi-photo polaroid swipeable, with arrows and dots.
function initCarousels() {
  document.querySelectorAll('.ph.multi').forEach(ph => {
    const track = ph.querySelector('.track');
    const dots = ph.querySelectorAll('.dots span');
    const count = dots.length;
    const index = () => Math.round(track.scrollLeft / track.clientWidth);
    const go = i => track.scrollTo({ left: ((i + count) % count) * track.clientWidth, behavior: 'smooth' });

    track.addEventListener('scroll', () => {
      const i = index();
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    }, { passive: true });

    ph.querySelector('.prev').onclick = () => go(index() - 1);
    ph.querySelector('.next').onclick = () => go(index() + 1);
  });
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
        ${photoHTML(m)}
        <p class="cap">${m.title}</p>
      </div>
      <div class="txt"><time>${m.date}</time><p>${m.text}</p></div>
    </article>`).join('');

  initCarousels();

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .2 });
  document.querySelectorAll('.ms').forEach(el => io.observe(el));
}

$('toJar').onclick = () => { show('jar'); buildJar(); };
