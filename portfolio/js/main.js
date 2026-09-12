(() => {
  "use strict";

  // --- BACKEND API CONFIGURATION ---
  // Local development backend address
  const API_BASE = "http://localhost:3001";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Curtain-open — remove from flow once the entrance is done --------- */
  const curtain = document.querySelector(".curtain");
  if (curtain) {
    if (prefersReducedMotion) {
      curtain.remove();
    } else {
      window.setTimeout(() => curtain.remove(), 1300);
    }
  }

  /* ---- Scroll progress bar ------------------------------------------------ */
  const progressBar = document.querySelector("#scroll-progress-bar");
  const updateProgress = () => {
    if (!progressBar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${pct}%`;
  };

  /* ---- Ambient parallax on the background grid + spotlight --------------- */
  const bgGrid = document.querySelector(".bg-grid");
  const bgSpotlight = document.querySelector(".bg-spotlight");

  /* ---- Section background media (video, with an <img> fallback path
     still supported) — fade in once loaded, then drift gently on scroll.
     Parallax is applied to the .section-bg wrapper (not the media element),
     so it never collides with the Ken Burns scale animation that CSS runs
     on the media element itself — each transform lives on its own element,
     so nothing gets clobbered. */
  const bgPhotos = document.querySelectorAll(".section-bg-img");
  bgPhotos.forEach((img) => {
    const reveal = () => img.classList.add("is-loaded");
    if (img.complete && img.naturalWidth > 0) reveal();
    else img.addEventListener("load", reveal, { once: true });
  });

  const bgVideos = document.querySelectorAll(".section-bg-video");
  bgVideos.forEach((video) => {
    const reveal = () => video.classList.add("is-loaded");
    if (video.readyState >= 2) reveal();
    else video.addEventListener("loadeddata", reveal, { once: true });

    // Respect reduced-motion: keep the poster frame as a static image
    // instead of autoplaying footage.
    if (prefersReducedMotion) {
      video.removeAttribute("autoplay");
      video.pause();
    }
  });

  const parallaxLayers = Array.from(document.querySelectorAll("[data-parallax]"));

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateProgress();
      updateHeaderScrollState();
      if (!prefersReducedMotion) {
        const y = window.scrollY;
        if (bgGrid) bgGrid.style.transform = `translateY(${y * 0.06}px)`;
        if (bgSpotlight) bgSpotlight.style.transform = `translateY(${y * 0.15}px)`;

        parallaxLayers.forEach((layer) => {
          const speed = parseFloat(layer.dataset.parallax) || 0;
          const rect = layer.getBoundingClientRect();
          // Offset relative to the layer's own position in the viewport,
          // not raw page scroll — keeps the drift small and contained
          // instead of racing off within a short section.
          const offset = (rect.top - window.innerHeight / 2) * speed;
          layer.style.transform = `translateY(${offset}px)`;
        });
      }
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Animated stat counters — any [data-count-to] on any page ----------- */
  const counters = document.querySelectorAll("[data-count-to]");
  if (counters.length) {
    const animateCounter = (el) => {
      const target = parseInt(el.dataset.countTo, 10) || 0;
      const suffix = el.dataset.countSuffix || "";
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

    if ("IntersectionObserver" in window) {
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

  /* ---- Hero cursor-tracked ambient glow ------------------------------------ */
  const hero = document.querySelector(".hero");
  const heroGlow = document.querySelector(".hero-glow");
  if (hero && heroGlow && !prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      heroGlow.style.setProperty("--glow-x", `${x}%`);
      heroGlow.style.setProperty("--glow-y", `${y}%`);
      heroGlow.classList.add("is-active");
    });
    hero.addEventListener("pointerleave", () => heroGlow.classList.remove("is-active"));
  }

  /* ---- Magnetic hero CTA buttons — nudge toward the cursor ----------------- */
  const magneticButtons = document.querySelectorAll(".hero-cta-row .btn");
  if (magneticButtons.length && !prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
    const maxPull = 8;
    magneticButtons.forEach((btn) => {
      btn.addEventListener("pointermove", (event) => {
        const rect = btn.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        btn.style.transform = `translate(${px * maxPull * 2}px, ${py * maxPull * 2}px)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ---- Hero role line — typewriter cycling through a list of phrases ------- */
  const roleText = document.querySelector(".hero-role-text");
  if (roleText) {
    let phrases = [];
    try {
      phrases = JSON.parse(roleText.dataset.typewriter || "[]");
    } catch (err) {
      phrases = [];
    }

    if (phrases.length) {
      if (prefersReducedMotion) {
        roleText.textContent = phrases[0];
      } else {
        let phraseIndex = 0;
        let charIndex = 0;
        let deleting = false;

        const tick = () => {
          const current = phrases[phraseIndex];

          if (!deleting) {
            charIndex += 1;
            roleText.textContent = current.slice(0, charIndex);
            if (charIndex === current.length) {
              deleting = true;
              window.setTimeout(tick, 1600);
              return;
            }
            window.setTimeout(tick, 45);
          } else {
            charIndex -= 1;
            roleText.textContent = current.slice(0, charIndex);
            if (charIndex === 0) {
              deleting = false;
              phraseIndex = (phraseIndex + 1) % phrases.length;
              window.setTimeout(tick, 300);
              return;
            }
            window.setTimeout(tick, 25);
          }
        };

        window.setTimeout(tick, 700);
      }
    }
  }

  /* ---- Hero card 3D tilt, following the pointer -------------------------- */
  const heroCards = document.querySelector(".hero-cards");
  if (heroCards && !prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
    const tilts = heroCards.querySelectorAll(".hero-card-tilt");
    heroCards.addEventListener("pointermove", (event) => {
      const rect = heroCards.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      tilts.forEach((tilt) => {
        tilt.style.setProperty("--tilt-y", `${px * 10}deg`);
        tilt.style.setProperty("--tilt-x", `${py * -10}deg`);
      });
    });
    heroCards.addEventListener("pointerleave", () => {
      tilts.forEach((tilt) => {
        tilt.style.setProperty("--tilt-y", "0deg");
        tilt.style.setProperty("--tilt-x", "0deg");
      });
    });
  }

  /* ---- Project card cursor-tracked glow ----------------------------------- */
  if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".project-card").forEach((card) => {
      const shine = document.createElement("span");
      shine.className = "card-shine";
      shine.setAttribute("aria-hidden", "true");
      card.appendChild(shine);

      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const mx = ((event.clientX - rect.left) / rect.width) * 100;
        const my = ((event.clientY - rect.top) / rect.height) * 100;
        shine.style.setProperty("--mx", `${mx}%`);
        shine.style.setProperty("--my", `${my}%`);
      });
    });
  }

  /* ---- Header: scroll morph + active-link spotlight indicator ------------- */
  const siteHeader = document.querySelector("[data-site-header]");
  const navLinksEl = document.querySelector(".nav-links");
  const navIndicator = document.querySelector(".nav-indicator");
  const navLinkEls = Array.from(document.querySelectorAll(".nav-links a"));

  const HEADER_SCROLL_THRESHOLD = 24;
  const updateHeaderScrollState = () => {
    siteHeader?.classList.toggle("is-scrolled", window.scrollY > HEADER_SCROLL_THRESHOLD);
  };

  const moveIndicatorTo = (link) => {
    if (!navIndicator || !navLinksEl || !link) return;
    const navRect = navLinksEl.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    navIndicator.style.setProperty("--indicator-x", `${linkRect.left - navRect.left}px`);
    navIndicator.style.setProperty("--indicator-w", `${linkRect.width}px`);
    navIndicator.classList.add("is-visible");
  };

  const showActiveIndicator = () => {
    const active = navLinksEl?.querySelector("a[aria-current='page']");
    if (active) moveIndicatorTo(active);
    else navIndicator?.classList.remove("is-visible");
  };

  if (navLinksEl && navIndicator) {
    window.requestAnimationFrame(showActiveIndicator);
    window.addEventListener("resize", showActiveIndicator);

    if (window.matchMedia("(hover: hover)").matches) {
      navLinkEls.forEach((link) => {
        link.addEventListener("mouseenter", () => moveIndicatorTo(link));
      });
      navLinksEl.addEventListener("mouseleave", showActiveIndicator);
    }
  }

  // Scroll-spy for the single-page anchors (Skills / Contact on index.html);
  // Work / About are separate pages and already carry a static aria-current.
  const scrollSpySections = ["skills", "contact"].map((id) => document.getElementById(id)).filter(Boolean);
  if (scrollSpySections.length && navLinksEl && "IntersectionObserver" in window) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinkEls.forEach((link) => {
            if (link.getAttribute("href") === `#${entry.target.id}`) {
              link.setAttribute("aria-current", "page");
            } else {
              link.removeAttribute("aria-current");
            }
          });
          showActiveIndicator();
        });
      },
      { threshold: 0.5 }
    );
    scrollSpySections.forEach((section) => spyObserver.observe(section));
  }

  /* ---- Scroll reveal ------------------------------------------------------ */
  const revealTargets = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealTargets.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---- Selected-work view toggle (grid / list) ---------------------------- */
  const viewButtons = document.querySelectorAll("[data-view]");
  const workGrid = document.querySelector(".work-grid");

  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      viewButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      workGrid?.classList.toggle("is-list", view === "list");
    });
  });

  /* ---- Contact form — front-end-only stub ---------------------------------
     No backend is wired up. Swap the "simulated submit" below for a real
     POST to your form endpoint (see the Implementation Guide in README.md). */
  const contactForm = document.querySelector("#contact-form");
  const formStatus = document.querySelector("#form-status");
  const contactFormWrap = document.querySelector("[data-contact-form-wrap]");
  const contactSuccess = document.querySelector("[data-contact-success]");

  // Reason chips
  const reasonChips = document.querySelectorAll(".reason-chip");
  const reasonInput = document.querySelector("#contact-reason");
  reasonChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      reasonChips.forEach((c) => {
        c.classList.remove("is-selected");
        c.setAttribute("aria-checked", "false");
      });
      chip.classList.add("is-selected");
      chip.setAttribute("aria-checked", "true");
      if (reasonInput) reasonInput.value = chip.dataset.reason || "";
    });
  });

  // Character counter for the message field
  const messageField = document.querySelector("#message");
  const charCount = document.querySelector("[data-char-count]");
  const charCounter = document.querySelector("[data-char-counter]");
  messageField?.addEventListener("input", () => {
    const len = messageField.value.length;
    const max = parseInt(messageField.getAttribute("maxlength") || "0", 10);
    if (charCount) charCount.textContent = String(len);
    charCounter?.classList.toggle("is-near-limit", max > 0 && len >= max * 0.9);
  });

  // Inline validation
  const validators = {
    name: (field) => field.value.trim().length > 0,
    email: (field) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim()),
    message: (field) => field.value.trim().length > 0,
  };

  const setFieldError = (field, hasError) => {
    const wrap = field.closest(".field-floating");
    wrap?.classList.toggle("has-error", hasError);
  };

  const validateField = (field) => {
    const validator = validators[field.name];
    if (!validator) return true;
    const valid = validator(field);
    setFieldError(field, !valid);
    return valid;
  };

  ["name", "email", "message"].forEach((fieldName) => {
    const field = contactForm?.querySelector(`#${fieldName}`);
    field?.addEventListener("blur", () => validateField(field));
    field?.addEventListener("input", () => {
      const wrap = field.closest(".field-floating");
      if (wrap?.classList.contains("has-error")) validateField(field);
    });
  });

  const resetContactForm = () => {
    contactForm?.reset();
    if (charCount) charCount.textContent = "0";
    charCounter?.classList.remove("is-near-limit");
    contactForm?.querySelectorAll(".field-floating").forEach((wrap) => wrap.classList.remove("has-error"));
    reasonChips.forEach((c, i) => {
      c.classList.toggle("is-selected", i === 0);
      c.setAttribute("aria-checked", String(i === 0));
    });
    if (reasonInput && reasonChips[0]) reasonInput.value = reasonChips[0].dataset.reason || "";
    if (formStatus) {
      formStatus.textContent = "";
      formStatus.removeAttribute("data-tone");
    }
  };

  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fields = ["name", "email", "message"]
      .map((name) => contactForm.querySelector(`#${name}`))
      .filter(Boolean);
    const allValid = fields.map((field) => validateField(field)).every(Boolean);

    if (!allValid) {
      if (formStatus) {
        formStatus.textContent = "Please fix the highlighted fields.";
        formStatus.setAttribute("data-tone", "error");
      }
      fields.find((field) => field.closest(".field-floating")?.classList.contains("has-error"))?.focus();
      return;
    }

    const submitBtn = contactForm.querySelector(".contact-submit");
    const submitLabel = submitBtn?.querySelector(".contact-submit-label");
    const originalLabel = submitLabel?.textContent;
    if (submitBtn) submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = "Sending…";
    if (formStatus) {
      formStatus.textContent = "Sending your message…";
      formStatus.removeAttribute("data-tone");
    }

    // Real API submission
    // Configure API_BASE for your deployment:
    // - Local dev: "http://localhost:3001" (with backend running)
    // - Production: "https://your-backend-domain.com" or "" for same-origin

    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactForm.querySelector("#name").value.trim(),
          email: contactForm.querySelector("#email").value.trim().toLowerCase(),
          message: contactForm.querySelector("#message").value.trim(),
          reason: reasonInput.value,
        }),
      });

      const data = await response.json();

      if (submitBtn) submitBtn.disabled = false;
      if (submitLabel && originalLabel) submitLabel.textContent = originalLabel;

      if (response.ok && data.success) {
        if (formStatus) {
          formStatus.textContent = data.message || "Message sent — I'll reply within a couple of days.";
          formStatus.setAttribute("data-tone", "success");
        }

        window.setTimeout(() => {
          if (contactFormWrap && contactSuccess) {
            contactForm.hidden = true;
            contactSuccess.hidden = false;
          }
        }, 250);
      } else {
        // Handle API errors (validation, rate limit, server error)
        const errorMessage = data.error || "Failed to send message. Please try again.";
        if (formStatus) {
          formStatus.textContent = errorMessage;
          formStatus.setAttribute("data-tone", "error");
        }

        // Re-enable form for retry
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel && originalLabel) submitLabel.textContent = originalLabel;

        // If rate limited, show retry-after info
        if (response.status === 429 && data.retryAfter) {
          console.warn(`Rate limited. Retry after ${data.retryAfter} seconds`);
        }
      }
    } catch (error) {
      // Network error or unexpected failure
      console.error("Contact form submission error:", error);
      if (submitBtn) submitBtn.disabled = false;
      if (submitLabel && originalLabel) submitLabel.textContent = originalLabel;
      if (formStatus) {
        formStatus.textContent = "Network error. Please check your connection and try again.";
        formStatus.setAttribute("data-tone", "error");
      }
    }
  });

  document.querySelector("[data-contact-reset]")?.addEventListener("click", () => {
    if (contactSuccess) contactSuccess.hidden = true;
    if (contactForm) contactForm.hidden = false;
    resetContactForm();
    contactForm?.querySelector("#name")?.focus();
  });

  // Copy-to-clipboard for the email quick-connect method
  const copyEmailLink = document.querySelector("[data-copy-email]");
  copyEmailLink?.addEventListener("click", (event) => {
    const email = copyEmailLink.dataset.email;
    const hint = copyEmailLink.querySelector("[data-copy-hint]");
    if (!email || !hint || !navigator.clipboard) return; // fall back to the mailto: link
    event.preventDefault();
    const original = hint.textContent;
    navigator.clipboard
      .writeText(email)
      .then(() => {
        hint.textContent = "Copied";
        window.setTimeout(() => {
          hint.textContent = original;
        }, 1600);
      })
      .catch(() => {
        window.location.href = `mailto:${email}`;
      });
  });

  // Local time indicator in the contact info card
  const contactClockText = document.querySelector("[data-contact-clock-text]");
  if (contactClockText) {
    const CONTACT_TIMEZONE = "Asia/Kolkata"; // TODO: set this to your own IANA timezone
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: CONTACT_TIMEZONE,
      });
      const updateClock = () => {
        contactClockText.textContent = `${formatter.format(new Date())} local time`;
      };
      updateClock();
      window.setInterval(updateClock, 30000);
    } catch (err) {
      contactClockText.closest(".contact-clock")?.remove();
    }
  }

  /* ---- Footer year --------------------------------------------------------- */
  const yearEl = document.querySelector("#current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
