/* ==========================================================================
   Ismam Zaman Shuptoo — Personal Profile Passport
   script.js — scroll reveals, role-strip cycling, page-dot navigation
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal, .page-head');
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('in');
    });
  }, { threshold: 0.18 });
  revealEls.forEach((el) => revealIO.observe(el));

  /* ---------- role strip cycling ----------
     Measures each role line's own height/offset so the strip works correctly
     whether the text sits on one line (desktop) or wraps to two (small phones) —
     this is what keeps the role text from ever spilling past the card border. */
  const strip = document.querySelector('.role-strip');
  const track = document.getElementById('roleTrack');

  if (strip && track) {
    const items = Array.from(track.children);
    let active = 0;

    const goTo = (index) => {
      const item = items[index];
      strip.style.height = item.offsetHeight + 'px';
      track.style.transform = `translateY(-${item.offsetTop}px)`;
    };

    // set initial height before first paint-ish
    goTo(active);

    setInterval(() => {
      active = (active + 1) % items.length;
      goTo(active);
    }, 2600);

    // recalc on resize/orientation change so a reflow (e.g. text re-wrapping)
    // never leaves the strip clipped at the wrong height
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => goTo(active), 150);
    }, { passive: true });
  }

  /* ---------- page-dot navigation ---------- */
  const sectionIds = ['cover', 'bio', 'ventures', 'education', 'gallery', 'contact'];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  const navBtns = document.querySelectorAll('#pagenav button');
  const pagenav = document.getElementById('pagenav');

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  if (sections.length && navBtns.length) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = sections.indexOf(entry.target);
          if (idx > -1) {
            navBtns.forEach((b) => b.classList.remove('active'));
            navBtns[idx].classList.add('active');
          }
        }
      });
    }, { threshold: 0.5 });
    sections.forEach((s) => navIO.observe(s));
  }

  if (pagenav) {
    window.addEventListener('scroll', () => {
      pagenav.classList.toggle('show', window.scrollY > 80);
    }, { passive: true });
  }

  /* ---------- achievements gallery lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (lightbox && lightboxImg && galleryItems.length) {
    const openLightbox = (src, caption) => {
      lightboxImg.src = src;
      lightboxImg.alt = caption || '';
      lightboxCaption.textContent = caption || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    };

    galleryItems.forEach((item) => {
      item.addEventListener('click', () => {
        openLightbox(item.dataset.full, item.dataset.caption);
      });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }
});
