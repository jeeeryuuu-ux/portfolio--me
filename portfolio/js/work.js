(() => {
  'use strict';

  const grid = document.querySelector('.work-grid');
  if (!grid) return; // Only run on the Work page.

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Project data ---------------------------------------------------------
     Bracketed placeholders follow the same [ALL_CAPS] convention as the rest
     of the site (see README.md → "Filling in your content") — search this
     file for "[" to find every one when you're ready to swap in real work. */
  const CATEGORIES = [
    { id: 'all', label: 'All work' },
    { id: 'web', label: 'Web apps' },
    { id: 'design-system', label: 'Design systems' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'open-source', label: 'Open source' },
    { id: 'experiment', label: 'Experiments' },
  ];

  const PROJECTS = [
    {
      id: 'p1',
      title: '[PROJECT_1_TITLE]',
      category: 'web',
      tags: ['Product', 'Web App'],
      year: '[2025]',
      role: '[Lead Frontend Engineer]',
      summary: '[PROJECT_1_DESCRIPTION — one or two sentences on the problem, your role, and the outcome.]',
      details:
        '[A longer paragraph on this project — the problem you were solving, key decisions you made, and the measurable outcome. Two to four sentences is plenty.]',
      stack: ['React', 'TypeScript', 'Node.js'],
      link: '[PROJECT_1_LINK]',
      image: '[PROJECT_1_IMAGE]',
      featured: true,
    },
    {
      id: 'p2',
      title: '[PROJECT_2_TITLE]',
      category: 'design-system',
      tags: ['Design System'],
      year: '[2024]',
      role: '[Design Systems Engineer]',
      summary: '[PROJECT_2_DESCRIPTION — one or two sentences on the problem, your role, and the outcome.]',
      details:
        '[What the system unified, how many teams/products adopted it, and the tooling you built around it (tokens, docs site, linting).]',
      stack: ['Figma Tokens', 'Storybook', 'CSS'],
      link: '[PROJECT_2_LINK]',
      image: '[PROJECT_2_IMAGE]',
      featured: false,
    },
    {
      id: 'p3',
      title: '[PROJECT_3_TITLE]',
      category: 'mobile',
      tags: ['Mobile', 'API'],
      year: '[2024]',
      role: '[Full-stack Developer]',
      summary: '[PROJECT_3_DESCRIPTION — one or two sentences on the problem, your role, and the outcome.]',
      details:
        '[The platform(s) shipped to, notable technical constraints, and how the API layer was structured.]',
      stack: ['React Native', 'GraphQL', 'PostgreSQL'],
      link: '[PROJECT_3_LINK]',
      image: '[PROJECT_3_IMAGE]',
      featured: false,
    },
    {
      id: 'p4',
      title: '[PROJECT_4_TITLE]',
      category: 'open-source',
      tags: ['Open Source'],
      year: '[2023]',
      role: '[Maintainer]',
      summary: '[PROJECT_4_DESCRIPTION — one or two sentences on the problem, your role, and the outcome.]',
      details:
        '[Adoption numbers if you have them — stars, downloads, dependents — plus what motivated you to build and open-source it.]',
      stack: ['TypeScript', 'Vite'],
      link: '[PROJECT_4_LINK]',
      image: '[PROJECT_4_IMAGE]',
      featured: false,
    },
    {
      id: 'p5',
      title: '[PROJECT_5_TITLE]',
      category: 'web',
      tags: ['Product', 'Dashboard'],
      year: '[2023]',
      role: '[Frontend Engineer]',
      summary: '[PROJECT_5_DESCRIPTION — one or two sentences on the problem, your role, and the outcome.]',
      details:
        '[What the dashboard surfaced, who used it day-to-day, and a performance or usability win worth naming.]',
      stack: ['Next.js', 'D3.js'],
      link: '[PROJECT_5_LINK]',
      image: '[PROJECT_5_IMAGE]',
      featured: false,
    },
    {
      id: 'p6',
      title: '[PROJECT_6_TITLE]',
      category: 'experiment',
      tags: ['Experiment', 'WebGL'],
      year: '[2022]',
      role: '[Creative Developer]',
      summary: '[PROJECT_6_DESCRIPTION — one or two sentences on the problem, your role, and the outcome.]',
      details:
        '[The idea you were testing, what you learned, and whether it shipped anywhere or stayed a prototype.]',
      stack: ['Three.js', 'GLSL'],
      link: '[PROJECT_6_LINK]',
      image: '[PROJECT_6_IMAGE]',
      featured: false,
    },
    {
      id: 'p7',
      title: '[PROJECT_7_TITLE]',
      category: 'design-system',
      tags: ['Design System', 'Accessibility'],
      year: '[2022]',
      role: '[Accessibility Engineer]',
      summary: '[PROJECT_7_DESCRIPTION — one or two sentences on the problem, your role, and the outcome.]',
      details:
        '[The compliance target (e.g. WCAG 2.1 AA), the audit process, and how fixes were rolled into the component library.]',
      stack: ['ARIA', 'Jest-axe'],
      link: '[PROJECT_7_LINK]',
      image: '[PROJECT_7_IMAGE]',
      featured: false,
    },
    {
      id: 'p8',
      title: '[PROJECT_8_TITLE]',
      category: 'open-source',
      tags: ['Open Source', 'CLI'],
      year: '[2021]',
      role: '[Author]',
      summary: '[PROJECT_8_DESCRIPTION — one or two sentences on the problem, your role, and the outcome.]',
      details:
        '[What workflow the CLI automates and why you built it instead of reaching for an existing tool.]',
      stack: ['Node.js', 'Commander.js'],
      link: '[PROJECT_8_LINK]',
      image: '[PROJECT_8_IMAGE]',
      featured: false,
    },
  ];

  /* ---- Render the filter chips ---------------------------------------------- */
  const chipsRow = document.querySelector('.filter-chips');
  if (chipsRow) {
    chipsRow.innerHTML = CATEGORIES.map(
      (cat, i) =>
        `<button type="button" class="filter-chip" data-category="${cat.id}" aria-pressed="${i === 0}">${cat.label}</button>`
    ).join('');
  }

  /* ---- Render the project cards ---------------------------------------------- */
  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  grid.innerHTML = PROJECTS.map(
    (p) => `
    <article class="project-card glass-card" data-id="${p.id}" data-category="${p.category}" data-title="${escapeHtml(p.title.toLowerCase())}" tabindex="0" role="button" aria-label="View details for ${escapeHtml(p.title)}">
      ${p.featured ? '<span class="badge project-card-featured">Featured</span>' : ''}
      <div class="project-thumb">
        <img src="${p.image}" alt="${escapeHtml(p.title)} preview" loading="lazy" onerror="this.remove()" />
      </div>
      <div class="project-tags">
        ${p.tags.map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join('')}
      </div>
      <div class="project-title">
        <h4>${escapeHtml(p.title)}</h4>
        <a href="${p.link}" aria-label="Open ${escapeHtml(p.title)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
          <svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg>
        </a>
      </div>
      <p class="project-desc">${escapeHtml(p.summary)}</p>
      <div class="project-card-footer">
        <span class="project-card-year">${escapeHtml(p.year)}</span>
        <button type="button" class="project-card-details-btn" data-open-project="${p.id}">View details</button>
      </div>
    </article>
  `
  ).join('');

  /* ---- Search + filter -------------------------------------------------------
     Both operate on the already-rendered DOM cards (hide/show via the
     `hidden` attribute), so they compose freely with the existing grid/list
     toggle in main.js — none of these features know about each other. */
  const searchInput = document.querySelector('#work-search-input');
  const countEl = document.querySelector('#work-count');
  const emptyEl = document.querySelector('#work-empty');
  const cards = Array.from(grid.querySelectorAll('.project-card'));

  let activeCategory = 'all';
  let query = '';

  const applyFilters = () => {
    let visible = 0;
    cards.forEach((card) => {
      const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
      const matchesQuery = !query || card.dataset.title.includes(query);
      const show = matchesCategory && matchesQuery;
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (countEl) {
      countEl.textContent = `Showing ${visible} of ${cards.length} project${cards.length === 1 ? '' : 's'}`;
    }
    if (emptyEl) emptyEl.hidden = visible !== 0;
  };

  applyFilters();

  chipsRow?.addEventListener('click', (event) => {
    const chip = event.target.closest('.filter-chip');
    if (!chip) return;
    chipsRow.querySelectorAll('.filter-chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    activeCategory = chip.dataset.category;
    applyFilters();
  });

  searchInput?.addEventListener('input', (event) => {
    query = event.target.value.trim().toLowerCase();
    applyFilters();
  });

  /* ---- Project detail modal --------------------------------------------------- */
  const modal = document.querySelector('#project-modal');
  const modalBody = document.querySelector('#project-modal-body');
  let lastFocused = null;

  const renderModal = (project) => {
    if (!modalBody) return;
    modalBody.innerHTML = `
      <div class="project-modal-thumb"></div>
      <div class="project-modal-tags">
        ${project.tags.map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join('')}
      </div>
      <h3 id="project-modal-title">${escapeHtml(project.title)}</h3>
      <div class="project-modal-meta">
        <span><strong>Role</strong> · ${escapeHtml(project.role)}</span>
        <span><strong>Year</strong> · ${escapeHtml(project.year)}</span>
      </div>
      <p>${escapeHtml(project.summary)}</p>
      <p>${escapeHtml(project.details)}</p>
      <div class="project-modal-stack">
        ${project.stack.map((s) => `<span class="badge">${escapeHtml(s)}</span>`).join('')}
      </div>
      <div class="project-modal-actions">
        <a class="btn btn-ghost" href="${project.link}" target="_blank" rel="noopener">Open project</a>
      </div>
    `;
  };

  const openModal = (id) => {
    const project = PROJECTS.find((p) => p.id === id);
    if (!project || !modal) return;
    renderModal(project);
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modal.querySelector('.project-modal-close')?.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  grid.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-project]');
    const card = event.target.closest('.project-card');
    if (trigger) {
      openModal(trigger.dataset.openProject);
    } else if (card && !event.target.closest('a')) {
      openModal(card.dataset.id);
    }
  });

  grid.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.project-card');
    if (!card) return;
    event.preventDefault();
    openModal(card.dataset.id);
  });

  modal?.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
  });

  /* ---- Animated stat counters ------------------------------------------------- */
  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length) {
    const animateCounter = (el) => {
      const target = parseInt(el.dataset.countTo, 10) || 0;
      const suffix = el.dataset.countSuffix || '';
      if (prefersReducedMotion) {
        el.textContent = `${target}${suffix}`;
        return;
      }
      const duration = 1200;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${Math.round(target * eased)}${suffix}`;
        if (progress < 1) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => counterObserver.observe(el));
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ---- Page-wide cinematic video backdrop reveal ------------------------------ */
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
})();
