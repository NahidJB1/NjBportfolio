/* ============================================
   NJB PORTFOLIO — MAIN JS
   Minimal / Clean
   ============================================ */

'use strict';

/* ===== LOAD GLOBALS ===== */
async function loadGlobals() {
  try {
    const [headerRes, footerRes] = await Promise.all([
      fetch('/assets/header.html'),
      fetch('/assets/footer.html')
    ]);
    const headerHtml = await headerRes.text();
    const footerHtml = await footerRes.text();
    
    document.getElementById('header-placeholder').outerHTML = headerHtml;
    document.getElementById('footer-placeholder').outerHTML = footerHtml;

    // Initialize nav events AFTER injection
    if(typeof initNav === 'function') initNav();
  } catch (error) {
    console.error('Error loading global components:', error);
  }
}
loadGlobals();

/* ===== LOADER ===== */
(function initLoader() {
  const loader = document.getElementById('loader');
  const bar = document.getElementById('loaderBar');
  const loaderText = document.getElementById('loaderText');

  // If no loader on this page, skip
  if (!loader) return;

  const steps = [
    { pct: 30, text: 'Loading...' },
    { pct: 70, text: 'Almost there...' },
    { pct: 100, text: '' },
  ];

  let i = 0;
  function nextStep() {
    if (i >= steps.length) {
      setTimeout(() => {
        loader.classList.add('hidden');
        document.querySelectorAll('.reveal-up, .reveal-fade').forEach(el => el.classList.add('loaded'));
      }, 200);
      return;
    }
    const s = steps[i++];
    if (bar) bar.style.width = s.pct + '%';
    if (loaderText) loaderText.textContent = s.text;
    setTimeout(nextStep, i === steps.length ? 300 : 200);
  }
  setTimeout(nextStep, 150);
})();

/* ===== NAVIGATION ===== */
function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!nav || !hamburger || !mobileMenu) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }, { passive: true });
}

/* ===== TYPEWRITER ROLES ===== */
(function initTypewriter() {
  const el = document.getElementById('roleDynamic');
  if (!el) return;
  const roles = ['Full-Stack Solutions', 'Beautiful Interfaces', 'Scalable Platforms', 'Award-winning Apps'];
  let ri = 0, ci = 0, deleting = false;

  function type() {
    const current = roles[ri];
    if (!deleting) {
      el.textContent = current.slice(0, ++ci);
      if (ci === current.length) {
        deleting = true;
        setTimeout(type, 1800);
        return;
      }
    } else {
      el.textContent = current.slice(0, --ci);
      if (ci === 0) {
        deleting = false;
        ri = (ri + 1) % roles.length;
      }
    }
    setTimeout(type, deleting ? 45 : 80);
  }
  setTimeout(type, 1200);
})();

/* ===== SCROLL REVEAL ===== */
(function initScrollReveal() {
  const targets = document.querySelectorAll('.scroll-reveal, .section-label, .section-title');
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => { el.classList.add('visible'); });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), idx * 60);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach(el => io.observe(el));
})();

/* ===== COUNTER ANIMATION ===== */
(function initCounters() {
  const stats = document.querySelectorAll('.stat-number');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (!el.dataset.target) return;
        const target = +el.dataset.target;
        if (isNaN(target)) return;
        let current = 0;
        const step = target / 40;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.ceil(current);
          if (current >= target) clearInterval(timer);
        }, 30);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  stats.forEach(s => io.observe(s));
})();

/* ===== SMOOTH ANCHOR SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ===== CRAFT PAGE LOGIC ===== */
(function initCraftPages() {
  // Fix navigation links for subpages
  const isCraftPage = window.location.pathname.includes('/projects/');
  if (!isCraftPage) return;

  // Wait for the header to be injected by loadGlobals()
  setTimeout(() => {
    document.querySelectorAll('.nav-link, .mobile-link').forEach(link => {
      const href = link.getAttribute('href');
      // If the link is just a hash (e.g. "#community"), force it to absolute index path
      if (href && href.startsWith('#')) {
        link.setAttribute('href', '/' + href);
      }
    });
  }, 500); // Small delay ensures DOM is populated
})();

/* ===== LIGHTBOX ===== */
(function initLightbox() {
  const lb = document.createElement('div');
  lb.id = 'craft-lightbox';
  lb.innerHTML = `
    <div class="craft-lightbox-content">
      <img id="craft-lightbox-img" src="" alt="">
      <div id="craft-lightbox-caption"></div>
      <button id="craft-lightbox-close" aria-label="Close">&times;</button>
    </div>
  `;
  document.body.appendChild(lb);

  const imgEl = document.getElementById('craft-lightbox-img');
  const capEl = document.getElementById('craft-lightbox-caption');
  const closeBtn = document.getElementById('craft-lightbox-close');

  const openLightbox = (src, caption) => {
    imgEl.src = src;
    capEl.innerHTML = caption || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { if(!lb.classList.contains('open')) imgEl.src = ''; }, 300);
  };

  const galleryImgs = document.querySelectorAll('.craft-gallery img, .hackathon-gallery img, .gallery-img-wrapper img');
  galleryImgs.forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      const wrapper = img.closest('.craft-img-wrapper, .gallery-card');
      const captionEl = wrapper ? wrapper.querySelector('.craft-img-caption, .gallery-desc') : null;
      const caption = captionEl ? captionEl.innerHTML : img.alt;
      openLightbox(img.src, caption);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target.classList.contains('craft-lightbox-content')) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lb.classList.contains('open')) closeLightbox();
  });
})();
