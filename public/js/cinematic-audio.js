/**
 * ==========================================================================
 * CINEMATIC AUDIO SYSTEM
 * Continuous, ultra-minimal studio soundtrack library for DEVNESS Portfolio.
 * Implements dual-deck crossfading, curated soundtrack library,
 * shuffle capability, and luxury floating control conforming to DESIGN.md.
 * ==========================================================================
 */

(function () {
  'use strict';

  // Centralized Curated Soundtrack Library
  const TRACKS = [
    {
      id: 'treasure',
      title: 'Treasure',
      artist: 'Bruno Mars',
      desc: 'Bruno Mars · Funk-pop groove · 116 BPM',
      file: 'assets/audio/treasure.mp3',
      type: 'audio/mpeg',
      featured: true
    },
    {
      id: 'honeypie',
      title: 'Honeypie',
      artist: 'JAWNY',
      desc: 'JAWNY · Instrumental edition · 115 BPM',
      file: 'assets/audio/honeypie-instrumental.mp3',
      type: 'audio/mpeg',
      featured: true
    },
    {
      id: 'never-be-alone',
      title: 'Never Be Alone',
      artist: 'Shadrow',
      desc: 'Shadrow · Synth-pop electronic groove',
      file: 'assets/audio/never-be-alone.mp3',
      type: 'audio/mpeg',
      featured: true
    }
  ];

  // Storage keys
  const STORAGE_KEY_VOL = 'portfolio_audio_volume';
  const STORAGE_KEY_ENABLED = 'portfolio_audio_enabled';
  const STORAGE_KEY_TRACK = 'portfolio_audio_track';
  const STORAGE_KEY_SHUFFLE = 'portfolio_audio_shuffle';

  // State
  let isEnabled = false;
  let isPlaying = false;
  let isMuted = false;
  let isActivating = false;
  let isPanelOpen = false;
  let isShuffle = false;
  let currentTrackIdx = 0;
  let volume = 0.25; // Default 25% (subtle, non-intrusive)
  let previousVolume = 0.25;

  // Dual-deck audio players for seamless crossfading
  const deckA = new Audio();
  const deckB = new Audio();
  deckA.preload = 'auto';
  deckB.preload = 'auto';
  deckA.loop = false; // Sequential playlist playback
  deckB.loop = false;

  let activeDeck = 'A'; // 'A' or 'B'
  let crossfadeTimer = null;

  // DOM Elements
  let systemContainer = null;
  let triggerBtn = null;
  let panel = null;
  let playPauseBtn = null;
  let prevBtn = null;
  let nextBtn = null;
  let shuffleBtn = null;
  let muteBtn = null;
  let volSlider = null;
  let volVal = null;
  let trackTitleEl = null;
  let trackArtistEl = null;
  let trackDescEl = null;
  let trackBadgeEl = null;
  let introPill = null;
  let triggerLabelText = null;
  let triggerLabelSubtext = null;

  function init() {
    // Read persisted preferences
    try {
      const savedVol = localStorage.getItem(STORAGE_KEY_VOL);
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          volume = parsed;
          previousVolume = parsed > 0 ? parsed : 0.25;
        }
      }

      const savedShuffle = localStorage.getItem(STORAGE_KEY_SHUFFLE);
      if (savedShuffle !== null) {
        isShuffle = savedShuffle === 'true';
      }

      const savedTrack = localStorage.getItem(STORAGE_KEY_TRACK);
      if (savedTrack) {
        const found = TRACKS.findIndex(t => t.id === savedTrack);
        if (found !== -1) {
          currentTrackIdx = found;
        }
      }
    } catch (e) {
      console.warn('Audio storage error', e);
    }

    // Render DOM structure
    buildDOM();

    // Attach listeners
    attachEventListeners();

    // Setup deck listeners for automatic playlist advancement
    deckA.addEventListener('ended', onTrackEnded);
    deckB.addEventListener('ended', onTrackEnded);

    // Page Entry Experience: subtle intro pill after 1.8s
    scheduleIntroPill();
  }

  function buildDOM() {
    // Avoid double creation
    if (document.getElementById('cinematic-audio-system')) return;

    systemContainer = document.createElement('div');
    systemContainer.id = 'cinematic-audio-system';
    systemContainer.className = 'cinematic-audio-system';
    systemContainer.setAttribute('data-cinematic-audio', '');

    const track = TRACKS[currentTrackIdx];
    const volPercent = Math.round(volume * 100);

    systemContainer.innerHTML = `
      <!-- Floating Audio Panel -->
      <div id="cinematic-audio-panel" class="cinematic-audio-panel" role="region" aria-label="Cinematic Audio Panel" aria-hidden="true">
        <div class="audio-panel-header">
          <div class="audio-panel-brand">
            <span class="audio-panel-pulse-dot" aria-hidden="true"></span>
            <span class="audio-panel-title">CINEMATIC AUDIO</span>
          </div>
          <button class="audio-panel-close-btn" type="button" aria-label="Close audio panel" id="audio-panel-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Current Track Display -->
        <div class="audio-panel-track-info">
          <div class="audio-track-status">
            <span class="audio-transmission-label">NOW PLAYING</span>
            <span class="audio-track-badge" id="audio-track-badge">FEATURED SOUNDTRACK</span>
          </div>
          <div class="audio-track-name" id="audio-track-title">${track.title}</div>
          <div class="audio-track-artist" id="audio-track-artist">${track.artist}</div>
          <div class="audio-track-desc" id="audio-track-desc">${track.desc}</div>
        </div>

        <!-- Volume Slider Group -->
        <div class="audio-panel-volume-group">
          <button class="audio-vol-icon-btn" type="button" aria-label="Toggle mute" id="audio-mute-btn" title="Toggle mute">
            <svg class="audio-vol-icon vol-high" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
            <svg class="audio-vol-icon vol-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          </button>
          <div class="audio-vol-slider-wrap">
            <input type="range" min="0" max="100" value="${volPercent}" class="audio-vol-slider" id="audio-vol-slider" aria-label="Audio volume" />
          </div>
          <span class="audio-vol-val" id="audio-vol-val">${volPercent}%</span>
        </div>

        <!-- Minimal Transport Controls with Shuffle -->
        <div class="audio-panel-controls">
          <button class="audio-ctrl-btn audio-shuffle-btn ${isShuffle ? 'is-active' : ''}" type="button" aria-label="Toggle shuffle mode" id="audio-shuffle-btn" aria-pressed="${isShuffle ? 'true' : 'false'}" title="${isShuffle ? 'Shuffle: Active' : 'Shuffle: Off'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
          </button>
          <button class="audio-ctrl-btn audio-prev-btn" type="button" aria-label="Previous soundtrack" id="audio-prev-btn" title="Previous track">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="19 20 9 12 19 4 19 20"></polygon>
              <line x1="5" y1="19" x2="5" y2="5"></line>
            </svg>
          </button>
          <button class="audio-ctrl-btn audio-play-btn" type="button" aria-label="Play or pause soundtrack" id="audio-panel-play-btn" title="Play / Pause">
            <svg class="audio-ctrl-icon-play" viewBox="0 0 24 24" fill="currentColor"><polygon points="7 4 19 12 7 20 7 4"></polygon></svg>
            <svg class="audio-ctrl-icon-pause" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>
          </button>
          <button class="audio-ctrl-btn audio-next-btn" type="button" aria-label="Next soundtrack" id="audio-next-btn" title="Next track">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </button>
        </div>

        <!-- Featured Soundtracks Quick Selector -->
        <div class="audio-playlist-wrap">
          <div class="audio-playlist-header">
            <span class="audio-playlist-label">FEATURED SOUNDTRACKS</span>
            <span class="audio-playlist-count">${TRACKS.length} TRACKS</span>
          </div>
          <div class="audio-playlist-list" id="audio-playlist-list" role="listbox" aria-label="Featured soundtracks">
            ${TRACKS.map((t, idx) => `
              <button 
                type="button" 
                class="audio-playlist-item ${idx === currentTrackIdx ? 'is-active' : ''}" 
                data-track-idx="${idx}"
                role="option"
                aria-selected="${idx === currentTrackIdx ? 'true' : 'false'}"
                id="audio-track-item-${t.id}"
              >
                <span class="audio-playlist-dot" aria-hidden="true"></span>
                <div class="audio-playlist-meta">
                  <span class="audio-playlist-title">${t.title}</span>
                  <span class="audio-playlist-artist">${t.artist}</span>
                </div>
                <span class="audio-playlist-badge">SOUNDTRACK</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Continuous Playback Status Footer -->
        <div class="audio-panel-footer">
          <div class="audio-mode-status">
            <span class="audio-mode-dot" aria-hidden="true"></span>
            <span class="audio-mode-text">Continuous Soundtrack Flow</span>
          </div>
        </div>
      </div>

      <!-- Floating Trigger Button -->
      <button
        id="cinematic-audio-trigger"
        class="cinematic-audio-trigger"
        type="button"
        aria-label="Soundtrack (Silent) - Click to activate cinematic audio"
        aria-pressed="false"
        aria-expanded="false"
        data-cinematic-trigger
      >
        <!-- Silent state icon + 4-bar visualizer -->
        <span class="audio-trigger-icon-wrap" aria-hidden="true">
          <svg class="audio-trigger-icon-silent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke-dasharray="2 3"></path>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
          <span class="audio-visualizer-bars">
            <span class="audio-bar bar-1"></span>
            <span class="audio-bar bar-2"></span>
            <span class="audio-bar bar-3"></span>
            <span class="audio-bar bar-4"></span>
          </span>
        </span>

        <!-- Hover Expansion Label -->
        <span class="audio-trigger-label" aria-hidden="true">
          <span class="audio-trigger-text">SOUNDTRACK</span>
          <span class="audio-trigger-subtext">OFF</span>
        </span>

        <!-- One-time Intro Pill -->
        <span class="audio-intro-pill" id="audio-intro-pill" aria-hidden="true">Cinematic audio ready</span>
      </button>
    `;

    document.body.appendChild(systemContainer);

    // Cache elements
    triggerBtn = document.getElementById('cinematic-audio-trigger');
    panel = document.getElementById('cinematic-audio-panel');
    playPauseBtn = document.getElementById('audio-panel-play-btn');
    prevBtn = document.getElementById('audio-prev-btn');
    nextBtn = document.getElementById('audio-next-btn');
    shuffleBtn = document.getElementById('audio-shuffle-btn');
    muteBtn = document.getElementById('audio-mute-btn');
    volSlider = document.getElementById('audio-vol-slider');
    volVal = document.getElementById('audio-vol-val');
    trackTitleEl = document.getElementById('audio-track-title');
    trackArtistEl = document.getElementById('audio-track-artist');
    trackDescEl = document.getElementById('audio-track-desc');
    trackBadgeEl = document.getElementById('audio-track-badge');
    introPill = document.getElementById('audio-intro-pill');
    triggerLabelText = triggerBtn.querySelector('.audio-trigger-text');
    triggerLabelSubtext = triggerBtn.querySelector('.audio-trigger-subtext');
  }

  function attachEventListeners() {
    // Main Trigger Click
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissIntroPill();

      if (!isEnabled) {
        // Initial activation experience: micro transition + slow fade-in
        activateSoundtrack();
      } else {
        // Toggle panel
        togglePanel();
      }
    });

    // Close Panel Button
    const closeBtn = document.getElementById('audio-panel-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closePanel();
      });
    }

    // Play / Pause in panel
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
      });
    }

    // Playlist item clicks
    const playlistList = document.getElementById('audio-playlist-list');
    if (playlistList) {
      playlistList.addEventListener('click', (e) => {
        const item = e.target.closest('.audio-playlist-item');
        if (!item) return;
        e.stopPropagation();
        const idx = parseInt(item.getAttribute('data-track-idx'), 10);
        if (!isNaN(idx) && idx >= 0 && idx < TRACKS.length) {
          if (!isEnabled) {
            currentTrackIdx = idx;
            activateSoundtrack();
          } else {
            crossfadeToTrack(idx);
          }
        }
      });
    }

    // Prev / Next track
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stepTrack(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleNextTrack();
      });
    }

    // Shuffle Toggle
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleShuffle();
      });
    }

    // Mute Button
    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMute();
      });
    }

    // Volume Slider
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        setVolume(val);
      });
    }

    // Dismiss panel when clicking outside
    document.addEventListener('click', (e) => {
      if (isPanelOpen && !systemContainer.contains(e.target)) {
        closePanel();
      }
    });

    // Keyboard support: Escape closes panel, Space toggles playback when focused
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isPanelOpen) {
        closePanel();
        triggerBtn.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Audio Playback & Dual-Deck Crossfade Engine
     ------------------------------------------------------------------------ */

  function activateSoundtrack() {
    if (isActivating) return;
    isActivating = true;

    // Visual activation micro-transition
    triggerBtn.classList.add('is-activating');
    triggerBtn.setAttribute('aria-label', 'Activating soundtrack...');

    // Prepare active deck
    const track = TRACKS[currentTrackIdx];
    const primaryDeck = activeDeck === 'A' ? deckA : deckB;
    primaryDeck.src = track.file;
    primaryDeck.volume = 0; // Start at 0 for gentle luxury fade-in

    primaryDeck.play().then(() => {
      isEnabled = true;
      isPlaying = true;
      isMuted = false;

      // Update UI state
      triggerBtn.classList.add('is-active', 'is-playing');
      triggerBtn.classList.remove('is-activating');
      triggerBtn.setAttribute('aria-pressed', 'true');
      triggerBtn.setAttribute('aria-label', `Soundtrack: ${track.title} by ${track.artist} (Playing)`);
      if (triggerLabelSubtext) triggerLabelSubtext.textContent = 'ON';
      panel.classList.add('is-playing');

      // Persist enabled state
      try {
        localStorage.setItem(STORAGE_KEY_ENABLED, 'true');
      } catch (err) {}

      // Fade-in audio smoothly over 1200ms
      fadeAudio(primaryDeck, 0, volume, 1200, () => {
        isActivating = false;
      });

      updateTrackDisplay();
    }).catch((err) => {
      console.warn('Playback prevented or interrupted:', err);
      triggerBtn.classList.remove('is-activating');
      isActivating = false;
    });
  }

  function togglePlayPause() {
    if (!isEnabled) {
      activateSoundtrack();
      return;
    }

    const currentDeck = activeDeck === 'A' ? deckA : deckB;

    if (isPlaying) {
      // Smooth fade-out before pausing (400ms)
      fadeAudio(currentDeck, currentDeck.volume, 0, 400, () => {
        currentDeck.pause();
        isPlaying = false;
        triggerBtn.classList.remove('is-playing');
        panel.classList.remove('is-playing');
        triggerBtn.setAttribute('aria-label', `Soundtrack: Paused`);
        if (triggerLabelSubtext) triggerLabelSubtext.textContent = 'PAUSED';
      });
    } else {
      currentDeck.play().then(() => {
        isPlaying = true;
        triggerBtn.classList.add('is-playing');
        panel.classList.add('is-playing');
        triggerBtn.setAttribute('aria-label', `Soundtrack: ${TRACKS[currentTrackIdx].title} by ${TRACKS[currentTrackIdx].artist} (Playing)`);
        if (triggerLabelSubtext) triggerLabelSubtext.textContent = 'ON';
        fadeAudio(currentDeck, 0, isMuted ? 0 : volume, 600);
      }).catch(console.warn);
    }
  }

  function toggleMute() {
    isMuted = !isMuted;
    const currentDeck = activeDeck === 'A' ? deckA : deckB;

    if (isMuted) {
      previousVolume = volume > 0 ? volume : 0.25;
      systemContainer.classList.add('is-muted');
      triggerBtn.classList.add('is-muted');
      fadeAudio(currentDeck, currentDeck.volume, 0, 300);
      if (volVal) volVal.textContent = '0%';
      if (volSlider) volSlider.value = '0';
    } else {
      systemContainer.classList.remove('is-muted');
      triggerBtn.classList.remove('is-muted');
      volume = previousVolume;
      fadeAudio(currentDeck, 0, volume, 400);
      const pct = Math.round(volume * 100);
      if (volVal) volVal.textContent = `${pct}%`;
      if (volSlider) volSlider.value = String(pct);
    }
  }

  function setVolume(val) {
    volume = Math.max(0, Math.min(1, val));
    const currentDeck = activeDeck === 'A' ? deckA : deckB;

    if (volume === 0) {
      isMuted = true;
      systemContainer.classList.add('is-muted');
      triggerBtn.classList.add('is-muted');
      currentDeck.volume = 0;
    } else {
      if (isMuted) {
        isMuted = false;
        systemContainer.classList.remove('is-muted');
        triggerBtn.classList.remove('is-muted');
      }
      previousVolume = volume;
      currentDeck.volume = volume;
    }

    const pct = Math.round(volume * 100);
    if (volVal) volVal.textContent = `${pct}%`;
    if (volSlider) volSlider.value = String(pct);

    try {
      localStorage.setItem(STORAGE_KEY_VOL, volume.toFixed(3));
    } catch (err) {}
  }

  function toggleShuffle() {
    isShuffle = !isShuffle;
    if (shuffleBtn) {
      shuffleBtn.classList.toggle('is-active', isShuffle);
      shuffleBtn.setAttribute('aria-pressed', isShuffle ? 'true' : 'false');
      shuffleBtn.setAttribute('title', isShuffle ? 'Shuffle: Active' : 'Shuffle: Off');
    }
    try {
      localStorage.setItem(STORAGE_KEY_SHUFFLE, String(isShuffle));
    } catch (err) {}
  }

  function handleNextTrack() {
    if (isShuffle && TRACKS.length > 1) {
      let nextIdx;
      do {
        nextIdx = Math.floor(Math.random() * TRACKS.length);
      } while (nextIdx === currentTrackIdx);
      crossfadeToTrack(nextIdx);
    } else {
      stepTrack(1);
    }
  }

  function onTrackEnded() {
    if (!isPlaying) return;
    handleNextTrack();
  }

  function crossfadeToTrack(newIdx) {
    if (newIdx === currentTrackIdx && isPlaying) return;
    currentTrackIdx = newIdx;
    const newTrack = TRACKS[currentTrackIdx];

    updateTrackDisplay();

    if (!isPlaying) {
      // Just set source on active deck without auto-starting
      const curDeck = activeDeck === 'A' ? deckA : deckB;
      curDeck.src = newTrack.file;
      return;
    }

    // Perform smooth 1200ms crossfade between Deck A and Deck B
    const outgoingDeck = activeDeck === 'A' ? deckA : deckB;
    const incomingDeck = activeDeck === 'A' ? deckB : deckA;
    activeDeck = activeDeck === 'A' ? 'B' : 'A';

    incomingDeck.src = newTrack.file;
    incomingDeck.volume = 0;

    incomingDeck.play().then(() => {
      const targetVol = isMuted ? 0 : volume;
      const duration = 1200; // 1.2s smooth crossfade
      const startTime = performance.now();
      const startOutVol = outgoingDeck.volume;

      if (crossfadeTimer) cancelAnimationFrame(crossfadeTimer);

      function stepCrossfade(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Smooth cosine ease for crossfade curve (equal power)
        const inVol = targetVol * Math.sin(progress * (Math.PI / 2));
        const outVol = startOutVol * Math.cos(progress * (Math.PI / 2));

        incomingDeck.volume = Math.max(0, Math.min(1, inVol));
        outgoingDeck.volume = Math.max(0, Math.min(1, outVol));

        if (progress < 1) {
          crossfadeTimer = requestAnimationFrame(stepCrossfade);
        } else {
          outgoingDeck.pause();
          outgoingDeck.volume = 0;
          incomingDeck.volume = targetVol;
          crossfadeTimer = null;
        }
      }

      crossfadeTimer = requestAnimationFrame(stepCrossfade);
    }).catch((err) => {
      console.warn('Crossfade play error:', err);
    });
  }

  function stepTrack(direction) {
    let nextIdx = currentTrackIdx + direction;
    if (nextIdx >= TRACKS.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = TRACKS.length - 1;
    crossfadeToTrack(nextIdx);
  }

  function fadeAudio(audioEl, fromVol, toVol, durationMs, onComplete) {
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min(1, (now - startTime) / durationMs);
      // Ease in-out
      const eased = 0.5 * (1 - Math.cos(Math.PI * progress));
      audioEl.volume = Math.max(0, Math.min(1, fromVol + (toVol - fromVol) * eased));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        audioEl.volume = toVol;
        if (typeof onComplete === 'function') onComplete();
      }
    }

    requestAnimationFrame(step);
  }

  function updateTrackDisplay() {
    const track = TRACKS[currentTrackIdx];
    if (trackTitleEl) trackTitleEl.textContent = track.title;
    if (trackArtistEl) trackArtistEl.textContent = track.artist;
    if (trackDescEl) trackDescEl.textContent = track.desc;
    if (trackBadgeEl) trackBadgeEl.textContent = 'FEATURED SOUNDTRACK';
    if (triggerBtn && isPlaying) {
      triggerBtn.setAttribute('aria-label', `Soundtrack: ${track.title} by ${track.artist} (Playing)`);
    }

    // Sync playlist item highlights
    const items = document.querySelectorAll('.audio-playlist-item');
    items.forEach((btn, idx) => {
      const isActive = idx === currentTrackIdx;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    try {
      localStorage.setItem(STORAGE_KEY_TRACK, track.id);
    } catch (err) {}
  }

  /* ------------------------------------------------------------------------
     Panel UI Management
     ------------------------------------------------------------------------ */

  function togglePanel() {
    if (isPanelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function openPanel() {
    isPanelOpen = true;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    triggerBtn.setAttribute('aria-expanded', 'true');
    triggerBtn.classList.add('is-expanded');
  }

  function closePanel() {
    isPanelOpen = false;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    triggerBtn.setAttribute('aria-expanded', 'false');
    triggerBtn.classList.remove('is-expanded');
  }

  /* ------------------------------------------------------------------------
     Intro Pill (One-time subtle pulse on page entry)
     ------------------------------------------------------------------------ */

  function scheduleIntroPill() {
    setTimeout(() => {
      if (!isEnabled && introPill) {
        introPill.classList.add('is-visible');

        // Auto-dismiss after 4.2 seconds
        setTimeout(() => {
          dismissIntroPill();
        }, 4200);
      }
    }, 1800);
  }

  function dismissIntroPill() {
    if (introPill && introPill.classList.contains('is-visible')) {
      introPill.classList.remove('is-visible');
      setTimeout(() => {
        if (introPill && introPill.parentNode) {
          introPill.parentNode.removeChild(introPill);
          introPill = null;
        }
      }, 400);
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
