/**
 * Global Sound Toggle & Background Video Audio Controller
 * Manages mute/unmute state for hero and section background videos.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'portfolio_sound_state';
  const DEFAULT_VOLUME = 0.5;

  // Retrieve stored state or default to muted (best practice for web UX and autoplay policies)
  let isMuted = true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'unmuted') {
      // Browsers restrict audio before first user interaction,
      // so we wait for explicit interaction if user previously unmuted
      isMuted = false;
    }
  } catch (e) {
    isMuted = true;
  }

  // Toast notification element
  let toastEl = null;
  let toastTimeout = null;

  function createToast() {
    if (toastEl) return toastEl;
    toastEl = document.createElement('div');
    toastEl.className = 'sound-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    toastEl.innerHTML = `
      <svg class="sound-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
      <span class="sound-toast-text"></span>
    `;
    document.body.appendChild(toastEl);
    return toastEl;
  }

  function showToast(message) {
    const toast = createToast();
    const textEl = toast.querySelector('.sound-toast-text');
    if (textEl) textEl.textContent = message;

    toast.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2200);
  }

  // Get all hero and section background video elements
  function getBgVideos() {
    return Array.from(document.querySelectorAll('.section-bg-video, .page-bg-video'));
  }

  // Determine which background video is currently active in the viewport
  function getActiveVideo(videos) {
    if (videos.length === 0) return null;
    if (videos.length === 1) return videos[0];

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    let bestVideo = videos[0];
    let maxVisibleHeight = -1;

    videos.forEach((video) => {
      const rect = video.getBoundingClientRect();
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(viewportHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      if (visibleHeight > maxVisibleHeight) {
        maxVisibleHeight = visibleHeight;
        bestVideo = video;
      }
    });

    return bestVideo;
  }

  // Update background video audio states
  function syncVideoAudio() {
    const videos = getBgVideos();
    if (videos.length === 0) return;

    if (isMuted) {
      // Fully mute all background videos
      videos.forEach((video) => {
        video.muted = true;
      });
      return;
    }

    // When unmuted: identify the video currently in view to focus audio
    const activeVideo = getActiveVideo(videos);

    videos.forEach((video) => {
      if (video === activeVideo) {
        video.muted = false;
        video.volume = DEFAULT_VOLUME;
        // Ensure video is playing so audio plays smoothly
        if (video.paused) {
          video.play().catch(() => {});
        }
      } else {
        // Other videos that are offscreen remain silent to avoid audio clash
        video.muted = true;
      }
    });
  }

  // Update all sound toggle UI buttons
  function updateUI() {
    const buttons = document.querySelectorAll('[data-sound-toggle], .sound-toggle-btn');
    const label = isMuted ? 'Unmute background video sound' : 'Mute background video sound';

    buttons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(!isMuted));
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      btn.classList.toggle('is-unmuted', !isMuted);
    });
  }

  // Toggle function
  function toggleSound(triggerToast = true) {
    isMuted = !isMuted;

    try {
      localStorage.setItem(STORAGE_KEY, isMuted ? 'muted' : 'unmuted');
    } catch (e) {}

    updateUI();
    syncVideoAudio();

    if (triggerToast) {
      showToast(isMuted ? 'Background audio muted' : 'Background audio unmuted');
    }
  }

  // Set up scroll listener with debounce to switch active video audio as user scrolls
  let scrollTicking = false;
  function handleScroll() {
    if (isMuted || scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      syncVideoAudio();
      scrollTicking = false;
    });
  }

  // Initialization
  function init() {
    const buttons = document.querySelectorAll('[data-sound-toggle], .sound-toggle-btn');
    buttons.forEach((btn) => {
      // Remove any existing duplicate listeners
      btn.removeEventListener('click', btn._soundToggleHandler);
      btn._soundToggleHandler = (e) => {
        e.preventDefault();
        toggleSound(true);
      };
      btn.addEventListener('click', btn._soundToggleHandler);
    });

    // Ensure all background videos start with muted = true
    const videos = getBgVideos();
    videos.forEach((video) => {
      video.muted = true;
      video.volume = DEFAULT_VOLUME;
    });

    // If previously saved as unmuted, we can prepare on first interaction
    if (!isMuted) {
      updateUI();
      // Listen for first interaction to satisfy browser autoplay audio policy
      const enableAudioOnGesture = () => {
        if (!isMuted) {
          syncVideoAudio();
        }
        window.removeEventListener('click', enableAudioOnGesture);
        window.removeEventListener('keydown', enableAudioOnGesture);
        window.removeEventListener('touchstart', enableAudioOnGesture);
      };
      window.addEventListener('click', enableAudioOnGesture, { once: true });
      window.addEventListener('keydown', enableAudioOnGesture, { once: true });
      window.addEventListener('touchstart', enableAudioOnGesture, { once: true });
    } else {
      updateUI();
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose sound toggle API on window for testing or programmatic control
  window.portfolioSound = {
    isMuted: () => isMuted,
    toggle: toggleSound,
    mute: () => { if (!isMuted) toggleSound(false); },
    unmute: () => { if (isMuted) toggleSound(false); },
    sync: syncVideoAudio
  };
})();
