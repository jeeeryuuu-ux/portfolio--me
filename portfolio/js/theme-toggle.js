/**
 * Skiper 26 Theme Toggle Engine for Vanilla JS + View Transitions API
 * Inspired by Skiper UI / rudrodip theme-toggle-effect
 */
(() => {
  'use strict';

  const STORAGE_THEME_KEY = 'portfolio_theme';
  const STORAGE_VARIANT_KEY = 'portfolio_theme_variant';
  const STORAGE_START_KEY = 'portfolio_theme_start';
  const STORAGE_BLUR_KEY = 'portfolio_theme_blur';

  // Config defaults
  let currentTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'dark';
  let variant = localStorage.getItem(STORAGE_VARIANT_KEY) || 'circle';
  let start = localStorage.getItem(STORAGE_START_KEY) || 'center';
  let blur = localStorage.getItem(STORAGE_BLUR_KEY) === 'true';

  const styleId = 'theme-transition-styles';

  const updateStyleSheet = (css) => {
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  };

  const getPositionCoords = (pos, buttonCoords) => {
    if (pos === 'button-origin' && buttonCoords) {
      return { cx: `${buttonCoords.x}px`, cy: `${buttonCoords.y}px` };
    }
    switch (pos) {
      case 'top-left':
        return { cx: '0%', cy: '0%' };
      case 'top-right':
        return { cx: '100%', cy: '0%' };
      case 'bottom-left':
        return { cx: '0%', cy: '100%' };
      case 'bottom-right':
        return { cx: '100%', cy: '100%' };
      case 'top-center':
        return { cx: '50%', cy: '0%' };
      case 'bottom-center':
        return { cx: '50%', cy: '100%' };
      default:
        return { cx: '50%', cy: '50%' };
    }
  };

  const createAnimation = (animVariant, animStart, animBlur, buttonCoords) => {
    const isDark = currentTheme === 'dark';
    const blurFilter = animBlur ? 'filter: blur(8px);' : '';
    const blurMid = animBlur ? '50% { filter: blur(4px); }' : '';
    const blurEnd = animBlur ? 'filter: blur(0px);' : '';
    const viewNewBlur = animBlur ? 'filter: blur(2px);' : '';

    if (animVariant === 'rectangle') {
      const getClipPath = (dir) => {
        switch (dir) {
          case 'bottom-up':
            return {
              from: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
              to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            };
          case 'top-down':
            return {
              from: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
              to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            };
          case 'left-right':
            return {
              from: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
              to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            };
          case 'right-left':
            return {
              from: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
              to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            };
          default:
            return {
              from: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
              to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            };
        }
      };

      const clip = getClipPath(animStart);
      return `
        ::view-transition-group(root) {
          animation-duration: 0.65s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
        ::view-transition-new(root) {
          animation-name: reveal-rectangle;
          ${viewNewBlur}
        }
        ::view-transition-old(root) {
          animation: none;
          z-index: -1;
        }
        @keyframes reveal-rectangle {
          from {
            clip-path: ${clip.from};
            ${blurFilter}
          }
          ${blurMid}
          to {
            clip-path: ${clip.to};
            ${blurEnd}
          }
        }
      `;
    }

    if (animVariant === 'polygon') {
      const isTopRight = animStart === 'top-right';
      const polyFrom = isTopRight
        ? 'polygon(150% -71%, 250% 71%, 250% 71%, 150% -71%)'
        : 'polygon(50% -71%, -50% 71%, -50% 71%, 50% -71%)';
      const polyTo = isTopRight
        ? 'polygon(150% -71%, 250% 71%, 50% 171%, -71% 50%)'
        : 'polygon(50% -71%, -50% 71%, 50% 171%, 171% 50%)';

      return `
        ::view-transition-group(root) {
          animation-duration: 0.7s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
        ::view-transition-new(root) {
          animation-name: reveal-polygon;
          ${viewNewBlur}
        }
        ::view-transition-old(root) {
          animation: none;
          z-index: -1;
        }
        @keyframes reveal-polygon {
          from {
            clip-path: ${polyFrom};
            ${blurFilter}
          }
          ${blurMid}
          to {
            clip-path: ${polyTo};
            ${blurEnd}
          }
        }
      `;
    }

    // Default: circle and circle-blur
    let origin;
    if (animStart === 'button-origin' && buttonCoords) {
      origin = `${buttonCoords.x}px ${buttonCoords.y}px`;
    } else {
      const coords = getPositionCoords(animStart, buttonCoords);
      origin = `${coords.cx} ${coords.cy}`;
    }

    const maxRadius = animStart === 'center' ? '120%' : '160%';
    const duration = animVariant === 'circle-blur' ? '0.75s' : '0.65s';

    return `
      ::view-transition-group(root) {
        animation-duration: ${duration};
        animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
      }
      ::view-transition-new(root) {
        animation-name: reveal-circle;
        ${animVariant === 'circle-blur' || animBlur ? 'filter: blur(2px);' : ''}
      }
      ::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      @keyframes reveal-circle {
        from {
          clip-path: circle(0% at ${origin});
          ${animVariant === 'circle-blur' || animBlur ? 'filter: blur(10px);' : ''}
        }
        ${animVariant === 'circle-blur' || animBlur ? '50% { filter: blur(5px); }' : ''}
        to {
          clip-path: circle(${maxRadius} at ${origin});
          ${animVariant === 'circle-blur' || animBlur ? 'filter: blur(0px);' : ''}
        }
      }
    `;
  };

  const applyThemeDOM = (themeName) => {
    currentTheme = themeName;
    const isDark = themeName === 'dark';
    document.documentElement.setAttribute('data-theme', themeName);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    localStorage.setItem(STORAGE_THEME_KEY, themeName);

    // Update aria labels
    document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  };

  const toggleTheme = (triggerElement = null) => {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';

    let buttonCoords = null;
    if (triggerElement && triggerElement.getBoundingClientRect) {
      const rect = triggerElement.getBoundingClientRect();
      buttonCoords = {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      };
    }

    const css = createAnimation(variant, start, blur, buttonCoords);
    updateStyleSheet(css);

    const switchFn = () => applyThemeDOM(nextTheme);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || prefersReducedMotion) {
      switchFn();
      return;
    }

    document.startViewTransition(switchFn);
  };

  // Build Options Panel
  const initOptionsPanel = () => {
    if (document.querySelector('.theme-options-panel')) return;

    const panel = document.createElement('div');
    panel.className = 'theme-options-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Theme Animation Options');
    panel.innerHTML = `
      <div class="theme-options-header" data-drag-handle>
        <div class="theme-options-grip">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="9" r="1"></circle>
            <circle cx="19" cy="9" r="1"></circle>
            <circle cx="5" cy="9" r="1"></circle>
            <circle cx="12" cy="15" r="1"></circle>
            <circle cx="19" cy="15" r="1"></circle>
            <circle cx="5" cy="15" r="1"></circle>
          </svg>
          <span class="theme-options-title">Animation Options</span>
        </div>
        <button class="theme-options-close" type="button" aria-label="Close options" data-options-close>×</button>
      </div>

      <div class="theme-options-row">
        <span class="theme-options-label">variant :</span>
        <div class="theme-options-chips" data-opt-variant>
          <button type="button" class="theme-opt-chip" data-val="circle">circle</button>
          <button type="button" class="theme-opt-chip" data-val="rectangle">rectangle</button>
          <button type="button" class="theme-opt-chip" data-val="polygon">polygon</button>
          <button type="button" class="theme-opt-chip" data-val="circle-blur">circle-blur</button>
        </div>
      </div>

      <div class="theme-options-row">
        <span class="theme-options-label">blur :</span>
        <div class="theme-options-chips" data-opt-blur>
          <button type="button" class="theme-opt-chip" data-val="false">off</button>
          <button type="button" class="theme-opt-chip" data-val="true">on</button>
        </div>
      </div>

      <div class="theme-options-row" data-start-row>
        <span class="theme-options-label">start :</span>
        <div class="theme-options-chips" data-opt-start>
          <!-- populated dynamically -->
        </div>
      </div>

      <div class="theme-options-footer">
        <button type="button" class="theme-options-preview-btn" data-preview-toggle>Preview Toggle</button>
      </div>
    `;

    document.body.appendChild(panel);

    const startChipsContainer = panel.querySelector('[data-opt-start]');

    const renderStartOptions = () => {
      let options = [];
      if (variant === 'rectangle') {
        options = ['bottom-up', 'top-down', 'left-right', 'right-left'];
      } else if (variant === 'polygon') {
        options = ['top-left', 'top-right'];
      } else {
        // circle & circle-blur
        options = ['center', 'button-origin', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
      }

      if (!options.includes(start)) {
        start = options[0];
        localStorage.setItem(STORAGE_START_KEY, start);
      }

      startChipsContainer.innerHTML = options
        .map(
          (opt) =>
            `<button type="button" class="theme-opt-chip ${opt === start ? 'is-active' : ''}" data-val="${opt}">${opt}</button>`
        )
        .join('');

      startChipsContainer.querySelectorAll('.theme-opt-chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          start = btn.dataset.val;
          localStorage.setItem(STORAGE_START_KEY, start);
          renderStartOptions();
        });
      });
    };

    const updatePanelChips = () => {
      panel.querySelectorAll('[data-opt-variant] .theme-opt-chip').forEach((c) => {
        c.classList.toggle('is-active', c.dataset.val === variant);
      });
      panel.querySelectorAll('[data-opt-blur] .theme-opt-chip').forEach((c) => {
        c.classList.toggle('is-active', c.dataset.val === String(blur));
      });
      renderStartOptions();
    };

    panel.querySelectorAll('[data-opt-variant] .theme-opt-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        variant = btn.dataset.val;
        localStorage.setItem(STORAGE_VARIANT_KEY, variant);
        updatePanelChips();
      });
    });

    panel.querySelectorAll('[data-opt-blur] .theme-opt-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        blur = btn.dataset.val === 'true';
        localStorage.setItem(STORAGE_BLUR_KEY, String(blur));
        updatePanelChips();
      });
    });

    panel.querySelector('[data-options-close]')?.addEventListener('click', () => {
      panel.classList.remove('is-open');
      document.querySelectorAll('[data-theme-options-toggle]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    });

    panel.querySelector('[data-preview-toggle]')?.addEventListener('click', () => {
      toggleTheme(panel);
    });

    // Simple drag behavior
    const handle = panel.querySelector('[data-drag-handle]');
    let isDragging = false;
    let startX, startY, initX, initY;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      initX = rect.left;
      initY = rect.top;
      panel.style.transition = 'none';

      const onMouseMove = (moveEvent) => {
        if (!isDragging) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        panel.style.left = `${Math.max(10, Math.min(window.innerWidth - rect.width - 10, initX + dx))}px`;
        panel.style.top = `${Math.max(10, Math.min(window.innerHeight - rect.height - 10, initY + dy))}px`;
        panel.style.right = 'auto';
      };

      const onMouseUp = () => {
        isDragging = false;
        panel.style.transition = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    updatePanelChips();
  };

  const setupThemeControls = () => {
    // Apply saved theme state
    applyThemeDOM(currentTheme);

    // Bind all theme toggle buttons
    document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        toggleTheme(btn);
      });
    });

    // Bind options toggle button
    document.querySelectorAll('[data-theme-options-toggle]').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        initOptionsPanel();
        const panel = document.querySelector('.theme-options-panel');
        if (!panel) return;
        const isOpen = panel.classList.contains('is-open');
        panel.classList.toggle('is-open', !isOpen);
        trigger.setAttribute('aria-expanded', String(!isOpen));
      });
    });

    // Close options panel when clicking outside
    document.addEventListener('click', (e) => {
      const panel = document.querySelector('.theme-options-panel');
      if (panel && panel.classList.contains('is-open')) {
        if (!panel.contains(e.target) && !e.target.closest('[data-theme-options-toggle]')) {
          panel.classList.remove('is-open');
          document.querySelectorAll('[data-theme-options-toggle]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
        }
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeControls);
  } else {
    setupThemeControls();
  }
})();
