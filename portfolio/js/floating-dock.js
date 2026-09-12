/**
 * Floating Dock — vanilla JS port of the React/Framer-Motion FloatingDock.
 * Desktop: icons magnify toward the cursor's x-position, spring-like via a
 * short cubic-bezier transition on width/height (no physics dependency).
 * Mobile: a bottom-right toggle expands a vertical stack of the same links.
 */
(() => {
  'use strict';

  const dock = document.querySelector('[data-floating-dock]');
  if (!dock) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasHover = window.matchMedia('(hover: hover)').matches;

  /* ---- Desktop magnification ------------------------------------------- */
  const desktopDock = dock.querySelector('.floating-dock-desktop');
  const desktopIcons = desktopDock ? Array.from(desktopDock.querySelectorAll('.floating-dock-icon')) : [];

  const BASE_SIZE = 40;
  const MAX_SIZE = 68;
  const FALLOFF = 140; // px of mouse distance over which magnification decays

  const magnify = (distance) => {
    const d = Math.min(Math.abs(distance), FALLOFF);
    const t = 1 - d / FALLOFF;
    return BASE_SIZE + (MAX_SIZE - BASE_SIZE) * t;
  };

  if (desktopDock && desktopIcons.length && hasHover && !prefersReducedMotion) {
    desktopDock.addEventListener('mousemove', (event) => {
      const mouseX = event.clientX;
      desktopIcons.forEach((icon) => {
        const rect = icon.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        icon.style.setProperty('--dock-size', `${magnify(mouseX - center)}px`);
      });
    });

    desktopDock.addEventListener('mouseleave', () => {
      desktopIcons.forEach((icon) => icon.style.removeProperty('--dock-size'));
    });
  }

  /* ---- Mobile expand/collapse -------------------------------------------- */
  const mobileToggle = dock.querySelector('.floating-dock-mobile-toggle');
  const mobileItems = dock.querySelector('.floating-dock-mobile-items');

  const setMobileOpen = (open) => {
    if (!mobileItems || !mobileToggle) return;
    mobileItems.classList.toggle('is-open', open);
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Close quick navigation' : 'Open quick navigation');
  };

  mobileToggle?.addEventListener('click', () => {
    setMobileOpen(!mobileItems.classList.contains('is-open'));
  });

  mobileItems?.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => setMobileOpen(false))
  );

  document.addEventListener('click', (event) => {
    if (!mobileItems?.classList.contains('is-open')) return;
    if (dock.contains(event.target)) return;
    setMobileOpen(false);
  });

})();
