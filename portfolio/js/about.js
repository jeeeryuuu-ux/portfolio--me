(() => {
  'use strict';

  // Only run on the About page.
  if (!document.querySelector('.about-hero')) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Page-wide cinematic video backdrop reveal --------------------------- */
  const pageBgVideo = document.querySelector('.page-bg-video');
  if (pageBgVideo) {
    const reveal = () => pageBgVideo.classList.add('is-loaded');
    if (pageBgVideo.readyState >= 2) reveal();
    else pageBgVideo.addEventListener('loadeddata', reveal, { once: true });
    if (prefersReducedMotion) {
      pageBgVideo.removeAttribute('autoplay');
      pageBgVideo.pause();
    }
  }

  /* ---- Animated stat counters now live in main.js (shared across pages,
     since the hero on index.html uses the same [data-count-to] pattern). --- */

  /* ---- Journey tabs: experience / education --------------------------------- */
  const journeyTabs = document.querySelectorAll('[data-journey-tab]');
  journeyTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.journeyTab;
      journeyTabs.forEach((t) => t.setAttribute('aria-pressed', String(t === tab)));
      document.querySelectorAll('[data-journey-panel]').forEach((panel) => {
        const isMatch = panel.dataset.journeyPanel === target;
        panel.hidden = !isMatch;
        panel.classList.toggle('is-active', isMatch);
      });
    });
  });

  /* ---- Skills: category filter chips ---------------------------------------- */
  const skillFilters = document.querySelectorAll('[data-skill-filter]');
  const skillCards = document.querySelectorAll('.skill-card');

  const revealSkillBar = (card) => {
    const fill = card.querySelector('.skill-bar-fill');
    if (!fill || fill.dataset.animated === 'true') return;
    const value = fill.dataset.skillValue || '0';
    fill.dataset.animated = 'true';
    window.requestAnimationFrame(() => {
      fill.style.width = `${value}%`;
    });
  };

  skillFilters.forEach((chip) => {
    chip.addEventListener('click', () => {
      const category = chip.dataset.skillFilter;
      skillFilters.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      skillCards.forEach((card) => {
        const show = category === 'all' || card.dataset.skillCategory === category;
        card.classList.toggle('is-shown', show);
        if (show) revealSkillBar(card);
      });
    });
  });

  // Animate bars for cards already visible on scroll-into-view, even before
  // any filter click.
  if ('IntersectionObserver' in window && skillCards.length) {
    const skillObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealSkillBar(entry.target);
            skillObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    skillCards.forEach((card) => skillObserver.observe(card));
  } else {
    skillCards.forEach(revealSkillBar);
  }

  /* ---- Shine cards (values grid) — cursor-tracked glow, same pattern as
     project cards on the Work page --------------------------------------- */
  if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.shine-card').forEach((card) => {
      const shine = document.createElement('span');
      shine.className = 'card-shine';
      shine.setAttribute('aria-hidden', 'true');
      card.appendChild(shine);

      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const mx = ((event.clientX - rect.left) / rect.width) * 100;
        const my = ((event.clientY - rect.top) / rect.height) * 100;
        shine.style.setProperty('--mx', `${mx}%`);
        shine.style.setProperty('--my', `${my}%`);
      });
    });
  }

  /* ---- Flip cards (Beyond the screen) ---------------------------------------- */
  document.querySelectorAll('[data-flip-card]').forEach((card) => {
    card.addEventListener('click', () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
    });
  });

  /* ---- Testimonial carousel ---------------------------------------------------- */
  const track = document.querySelector('#testimonial-track');
  if (track) {
    const slides = Array.from(track.children);
    const dotsWrap = document.querySelector('#testimonial-dots');
    const prevBtn = document.querySelector('#testimonial-prev');
    const nextBtn = document.querySelector('#testimonial-next');
    let index = 0;
    let autoplayId = null;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'testimonial-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Show testimonial ${i + 1}`);
      dot.setAttribute('aria-current', String(i === 0));
      dot.addEventListener('click', () => goTo(i));
      dotsWrap?.appendChild(dot);
    });

    const dots = dotsWrap ? Array.from(dotsWrap.children) : [];

    function render() {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      render();
    }

    function next() {
      goTo(index + 1);
    }

    function prev() {
      goTo(index - 1);
    }

    prevBtn?.addEventListener('click', () => {
      prev();
      restartAutoplay();
    });
    nextBtn?.addEventListener('click', () => {
      next();
      restartAutoplay();
    });

    function startAutoplay() {
      if (prefersReducedMotion || slides.length < 2) return;
      autoplayId = window.setInterval(next, 6000);
    }

    function stopAutoplay() {
      if (autoplayId) window.clearInterval(autoplayId);
      autoplayId = null;
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    const carousel = document.querySelector('.testimonial-carousel');
    carousel?.addEventListener('pointerenter', stopAutoplay);
    carousel?.addEventListener('pointerleave', startAutoplay);

    render();
    startAutoplay();
  }

  /* ---- FAQ accordion ------------------------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-question');
    question?.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      // Close any other open item for a single-open accordion feel.
      item.parentElement?.querySelectorAll('.faq-item.is-open').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('is-open', !isOpen);
      question.setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();
