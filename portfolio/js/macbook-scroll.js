(() => {
  'use strict';

  const mount = document.querySelector('[data-macbook-mount]');
  if (!mount) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Build the DOM once -------------------------------------------------
     Kept out of about.html so the markup-heavy keyboard doesn't bloat the
     page source; everything here is static/decorative, no user input. */

  const kbRow = (keys) =>
    `<div class="ms-kb-row">${keys
      .map(
        ([label, wide]) =>
          `<div class="ms-key${wide ? ` ms-key--${wide}` : ''}"><div class="ms-key-inner">${label}</div></div>`
      )
      .join('')}</div>`;

  const fRow = [
    ['esc'], ['F1'], ['F2'], ['F3'], ['F4'], ['F5'], ['F6'],
    ['F7'], ['F8'], ['F9'], ['F10'], ['F11'], ['F12'], ['', 'blank'],
  ];
  const numRow = [
    ['`'], ['1'], ['2'], ['3'], ['4'], ['5'], ['6'],
    ['7'], ['8'], ['9'], ['0'], ['-'], ['='], ['delete', 'wide'],
  ];
  const qRow = [
    ['tab', 'wide'], ['Q'], ['W'], ['E'], ['R'], ['T'], ['Y'],
    ['U'], ['I'], ['O'], ['P'], ['['], [']'],
  ];
  const aRow = [
    ['caps', 'wide'], ['A'], ['S'], ['D'], ['F'], ['G'], ['H'],
    ['J'], ['K'], ['L'], [';'], ['return', 'wide'],
  ];
  const zRow = [
    ['shift', 'wide'], ['Z'], ['X'], ['C'], ['V'], ['B'], ['N'],
    ['M'], [','], ['.'], ['shift', 'wide'],
  ];
  const bottomRow = [
    ['fn'], ['ctrl'], ['opt'], ['cmd'], ['', 'space'], ['cmd'], ['opt'],
  ];

  mount.innerHTML = `
    <p class="ms-heading" data-ms-heading><span>↓ scroll to open ↓</span></p>
    <div class="ms-lid">
      <div class="ms-lid-closed">
        <div class="ms-lid-closed-inner"><span class="ms-lid-logo">DP</span></div>
      </div>
      <div class="ms-lid-screen" data-ms-screen>
        <div class="ms-lid-screen-bg"></div>
        <div class="ms-screen-video-wrap">
          <video
            class="ms-screen-video"
            data-ms-video
            poster="assets/video/about-macbook-screen-poster.jpg"
            muted
            loop
            playsinline
            preload="auto"
          >
            <source src="assets/video/about-macbook-screen.webm" type="video/webm" />
            <source src="assets/video/about-macbook-screen.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
    <div class="ms-base">
      <div class="ms-base-hinge"><span></span></div>
      <div class="ms-base-row">
        <div class="ms-speaker-grid"></div>
        <div class="ms-keyboard">
          ${kbRow(fRow)}
          ${kbRow(numRow)}
          ${kbRow(qRow)}
          ${kbRow(aRow)}
          ${kbRow(zRow)}
          ${kbRow(bottomRow)}
        </div>
        <div class="ms-speaker-grid"></div>
      </div>
      <div class="ms-trackpad"></div>
      <div class="ms-base-lip"></div>
      <div class="ms-base-badge">Built with care, shipped with confidence</div>
    </div>
  `;

  const scene = mount.closest('.ms-scene') || mount;
  const screenEl = mount.querySelector('[data-ms-screen]');
  const headingEl = mount.querySelector('[data-ms-heading]');
  const lidEl = mount.querySelector('.ms-lid');
  const videoEl = mount.querySelector('[data-ms-video]');

  /* ---- Screen video — play once loaded; keep it a still poster frame
     for reduced-motion users, same convention as the page-wide bg video. */
  if (videoEl) {
    videoEl.load(); // sources were injected via innerHTML — force the resource selection algorithm to run
    if (prefersReducedMotion) {
      videoEl.pause();
    } else {
      const tryPlay = () => videoEl.play().catch(() => {});
      if (videoEl.readyState >= 2) tryPlay();
      else videoEl.addEventListener('loadeddata', tryPlay, { once: true });
    }
  }

  if (prefersReducedMotion || !screenEl) return; // CSS handles the static open state

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const mapRange = (v, inMin, inMax, outMin, outMax) => {
    if (inMax === inMin) return outMax;
    const t = clamp((v - inMin) / (inMax - inMin), 0, 1);
    return outMin + t * (outMax - outMin);
  };

  let isMobile = window.innerWidth < 768;
  let translateMax = 1500; // px, rescaled below to the rendered lid width
  const REF_WIDTH = 512; // 32rem reference the ratio was tuned against

  const measure = () => {
    isMobile = window.innerWidth < 768;
    const w = lidEl ? lidEl.getBoundingClientRect().width : REF_WIDTH;
    translateMax = (w / REF_WIDTH) * 1500;
  };
  measure();

  let ticking = false;

  const apply = () => {
    ticking = false;
    const rect = scene.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(rect.height, 1), 0, 1);

    const scaleXTarget = isMobile ? 1 : 1.5;
    const scaleYTarget = isMobile ? 1 : 1.5;

    const scaleX = mapRange(progress, 0, 0.3, 1.2, scaleXTarget);
    const scaleY = mapRange(progress, 0, 0.3, 0.6, scaleYTarget);
    const rotate = mapRange(progress, 0.1, 0.3, -28, 0);
    const translateY = mapRange(progress, 0, 1, 0, translateMax);

    screenEl.style.transform =
      `scaleX(${scaleX}) scaleY(${scaleY}) rotateX(${rotate}deg) translateY(${translateY}px)`;

    if (headingEl) {
      const opacity = mapRange(progress, 0, 0.2, 1, 0);
      const y = mapRange(progress, 0, 0.3, 0, 100);
      headingEl.style.opacity = String(opacity);
      headingEl.style.transform = `translateY(${y}px)`;
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(apply);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    onScroll();
  });
  apply();
})();
