/* NJB Portfolio — interactions
   Kept intentionally light: no custom cursor, no canvas particles, no
   fake boot-loader. Everything here degrades gracefully if JS is slow
   or blocked — content is already visible in the HTML. */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky header ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileScrim = document.getElementById('mobileScrim');

  function closeMenu() {
    navToggle && navToggle.classList.remove('is-open');
    mobileMenu && mobileMenu.classList.remove('is-open');
    mobileScrim && mobileScrim.classList.remove('is-open');
  }
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', open);
      mobileScrim && mobileScrim.classList.toggle('is-open', open);
    });
    mobileScrim && mobileScrim.addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }

  /* ---------- Active nav link on scroll ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => navObserver.observe(s));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal-up, .reveal-fade, .scroll-reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in-view'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ---------- Stat count-up ---------- */
  const statEls = document.querySelectorAll('.stat-number[data-target]');
  function animateCount(el) {
    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
    if (prefersReducedMotion) { el.textContent = target; return; }
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (statEls.length && 'IntersectionObserver' in window) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    statEls.forEach(el => statObserver.observe(el));
  } else {
    statEls.forEach(el => { el.textContent = el.getAttribute('data-target'); });
  }

  /* ---------- Typed role effect ---------- */
  const roleEl = document.getElementById('roleDynamic');
  const roles = ['Full-Stack Applications', 'Clean User Interfaces', 'Scalable Systems', 'Digital Experiences'];
  if (roleEl) {
    if (prefersReducedMotion) {
      roleEl.textContent = roles[0];
    } else {
      let roleIndex = 0, charIndex = 0, deleting = false;
      function typeTick() {
        const word = roles[roleIndex];
        if (!deleting) {
          charIndex++;
          roleEl.textContent = word.slice(0, charIndex);
          if (charIndex === word.length) {
            deleting = true;
            setTimeout(typeTick, 1400);
            return;
          }
        } else {
          charIndex--;
          roleEl.textContent = word.slice(0, charIndex);
          if (charIndex === 0) {
            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
          }
        }
        setTimeout(typeTick, deleting ? 35 : 60);
      }
      typeTick();
    }
  }

  /* ---------- Footer year / back to top ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const toTop = document.getElementById('toTop');
  if (toTop) {
    toTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }
});
