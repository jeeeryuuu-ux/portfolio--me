(() => {
  "use strict";

  const STORAGE_KEY = "devness_intro_seen";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Development / review override via URL query param:
  // e.g. http://localhost:3000/?reset-intro or ?intro=1
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has("reset-intro") || searchParams.has("intro") || searchParams.has("cinematic")) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore storage errors */
    }
  }

  // Global helper for developers / reviewers to test first-visit intro at any time
  window.resetCinematicIntro = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.info("%c[DEVNESS Cinematic Intro] Intro reset. Reloading to experience first-visit sequence...", "color: #b6d9fc; font-weight: bold;");
      window.location.reload();
    } catch (err) {
      console.warn("Unable to reset intro state:", err);
    }
  };

  const isIntroSeen = () => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch (err) {
      return false;
    }
  };

  const markIntroSeen = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch (err) {
      /* ignore storage errors */
    }
  };

  // Check if we should run the first-visit intro
  const shouldRunIntro = !prefersReducedMotion && !isIntroSeen();

  const docEl = document.documentElement;
  const introEl = document.getElementById("cinematic-intro");
  const skipBtn = document.getElementById("intro-skip-btn");

  if (!shouldRunIntro) {
    // Returning visitor or reduced-motion: omit intro immediately
    docEl.classList.remove("cinematic-intro-active", "cinematic-intro-revealing");
    docEl.classList.add("cinematic-intro-done");
    if (introEl) introEl.remove();
    return;
  }

  // First visit: activate orchestration
  docEl.classList.add("cinematic-intro-active");

  const isMobile = window.innerWidth <= 768;
  const timeouts = [];
  let isCompleted = false;

  const safeTimeout = (fn, delay) => {
    const id = window.setTimeout(fn, delay);
    timeouts.push(id);
    return id;
  };

  const clearAllTimeouts = () => {
    timeouts.forEach((id) => window.clearTimeout(id));
    timeouts.length = 0;
  };

  const completeIntro = (fast = false) => {
    if (isCompleted) return;
    isCompleted = true;
    clearAllTimeouts();
    markIntroSeen();

    // Remove event listeners
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("scroll", onScrollCheck);
    window.removeEventListener("wheel", onWheelCheck);
    window.removeEventListener("touchmove", onTouchCheck);

    if (fast) {
      // Immediate fast-forward: bring everything into final place smoothly
      docEl.classList.add("cinematic-intro-revealing");
      if (introEl) {
        introEl.style.transition = "opacity 220ms ease, filter 220ms ease";
        introEl.style.opacity = "0";
        introEl.style.filter = "blur(4px)";
        window.setTimeout(() => {
          docEl.classList.remove("cinematic-intro-active", "cinematic-intro-revealing");
          docEl.classList.add("cinematic-intro-done");
          if (introEl) introEl.remove();
          document.dispatchEvent(new CustomEvent("cinematic-intro-complete", { detail: { fast: true } }));
        }, 220);
        return;
      }
    }

    docEl.classList.remove("cinematic-intro-active", "cinematic-intro-revealing");
    docEl.classList.add("cinematic-intro-done");
    if (introEl) introEl.remove();

    document.dispatchEvent(new CustomEvent("cinematic-intro-complete", { detail: { fast } }));
  };

  // Interruptibility handlers: user can skip anytime via ESC, Skip button, or scroll
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      completeIntro(true);
    }
  };

  const onScrollCheck = () => {
    if (window.scrollY > 30) {
      completeIntro(true);
    }
  };

  let touchStartY = null;
  const onTouchCheck = (e) => {
    if (!touchStartY && e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
      return;
    }
    if (touchStartY && e.touches.length > 0) {
      const diff = touchStartY - e.touches[0].clientY;
      if (Math.abs(diff) > 25) {
        completeIntro(true);
      }
    }
  };

  const onWheelCheck = (e) => {
    if (Math.abs(e.deltaY) > 20) {
      completeIntro(true);
    }
  };

  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("scroll", onScrollCheck, { passive: true });
  window.addEventListener("wheel", onWheelCheck, { passive: true });
  window.addEventListener("touchmove", onTouchCheck, { passive: true });

  if (skipBtn) {
    skipBtn.addEventListener("click", () => completeIntro(true));
  }

  // ---- TIMELINE ORCHESTRATION ----
  if (isMobile) {
    // Mobile sequence (~2.2s total)
    // 0.0s: Deep aperture, underlying live wallpaper faintly glowing
    // 0.2s: Atmosphere begins emerging, skip button appears
    safeTimeout(() => {
      if (introEl) introEl.classList.add("is-emerging", "is-ready");
    }, 200);

    // 0.6s: DEVNESS identity blooms into focus
    safeTimeout(() => {
      if (introEl) introEl.classList.add("is-identity");
    }, 600);

    // 1.3s: Identity dissolves, hero content staggers in
    safeTimeout(() => {
      if (introEl) introEl.classList.add("is-dissolving");
      docEl.classList.add("cinematic-intro-revealing");
    }, 1300);

    // 2.2s: Full reveal and interactive completion
    safeTimeout(() => {
      completeIntro(false);
    }, 2200);
  } else {
    // Desktop sequence (~3.5s total)
    // 0.0s: Deep aperture (near-black vignette), underlying live video already playing
    // 0.3s: Atmosphere begins emerging into light; skip button fades in
    safeTimeout(() => {
      if (introEl) introEl.classList.add("is-emerging", "is-ready");
    }, 300);

    // 0.9s: Soft cinematic atmospheric luminance sweep
    safeTimeout(() => {
      if (introEl) introEl.classList.add("is-sweeping");
    }, 900);

    // 1.1s: DEVNESS identity emerges in optical center with restrained blur-to-sharp
    safeTimeout(() => {
      if (introEl) introEl.classList.add("is-identity");
    }, 1100);

    // 1.9s: Identity gracefully dissolves upward into atmosphere; hero content staggers in
    safeTimeout(() => {
      if (introEl) introEl.classList.add("is-dissolving");
      docEl.classList.add("cinematic-intro-revealing");
    }, 1900);

    // 3.4s: Full reveal completes seamlessly; normal interaction state is active
    safeTimeout(() => {
      completeIntro(false);
    }, 3400);
  }

  // Developer informational tip
  console.info(
    "%c[DEVNESS Cinematic Intro]%c First-visit sequence running. Run %cresetCinematicIntro()%c in console to replay anytime.",
    "color: #b6d9fc; font-weight: bold;",
    "color: #9da7ba;",
    "color: #ffffff; background: #2f343e; padding: 2px 5px; border-radius: 3px; font-family: monospace;",
    "color: #9da7ba;"
  );
})();
