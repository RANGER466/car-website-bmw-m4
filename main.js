/**
 * NOCTIS — main.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Plain vanilla JS. No frameworks, no build step.
 * Sections: Grain · Cursor · FrameSequence · Preloader · Nav · Hero ·
 *           Statement · Dismantle · Lineup · Reserve · Line-reveals · rAF
 *
 * Requires: config.js (window.NOCTIS_CONFIG) loaded before this file.
 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════════════════════════════════════
     GLOBALS / HELPERS
  ══════════════════════════════════════════════════════════════════════════ */
  const CFG = window.NOCTIS_CONFIG;
  if (!CFG) { console.error('[NOCTIS] config.js not loaded'); return; }

  const isMobile      = () => window.innerWidth < 768;
  const isTouch       = window.matchMedia('(pointer: coarse)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR           = Math.min(window.devicePixelRatio || 1, 2);

  const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp   = (a, b, t)   => a + (b - a) * t;
  const pad3   = n => String(Math.floor(clamp(n, 0, 999))).padStart(3, '0');
  const fix1   = n => n.toFixed(1);

  /** Build a frame URL. Template uses {n} for the zero-padded frame number. */
  function frameUrl(template, index1, digits) {
    return template.replace('{n}', String(index1).padStart(digits, '0'));
  }

  /**
   * Scroll progress for a tall wrapper element.
   * Returns 0 when the wrapper's top is at the viewport top,
   * 1 when the wrapper's bottom minus innerHeight is at the viewport top.
   */
  function sectionProgress(wrapper) {
    const rect = wrapper.getBoundingClientRect();
    return clamp(-rect.top / (wrapper.offsetHeight - window.innerHeight), 0, 1);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     LINE REVEAL SETUP
     Wraps each .reveal-line's text in .line-mask > .line-inner so we can
     slide the inner element up without clipping the containing element.
  ══════════════════════════════════════════════════════════════════════════ */
  function setupLineReveals() {
    document.querySelectorAll('.reveal-lines').forEach(container => {
      container.querySelectorAll('.reveal-line').forEach((line, i) => {
        const inner = document.createElement('span');
        inner.className = 'line-inner';
        inner.style.transitionDelay = (i * 0.08) + 's';
        // Move all child nodes into inner
        while (line.firstChild) inner.appendChild(line.firstChild);
        const mask = document.createElement('span');
        mask.className = 'line-mask';
        mask.appendChild(inner);
        line.appendChild(mask);
      });
    });
  }
  setupLineReveals();

  function revealLines(el) {
    if (!el) return;
    el.querySelectorAll('.line-inner').forEach(n => n.classList.add('is-revealed'));
  }
  function hideLines(el) {
    if (!el) return;
    el.querySelectorAll('.line-inner').forEach(n => n.classList.remove('is-revealed'));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     FILM GRAIN
  ══════════════════════════════════════════════════════════════════════════ */
  (function initGrain() {
    const canvas = document.getElementById('grain-canvas');
    if (!canvas) return;
    const ctx      = canvas.getContext('2d');
    const { tileSize, fps } = CFG.grain;

    // Bake a random noise tile once into an offscreen canvas
    const tile  = document.createElement('canvas');
    tile.width  = tile.height = tileSize;
    const tCtx  = tile.getContext('2d');
    const data  = tCtx.createImageData(tileSize, tileSize);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      data.data[i] = data.data[i+1] = data.data[i+2] = v;
      data.data[i+3] = 255;
    }
    tCtx.putImageData(data, 0, 0);

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    let last = 0;
    const msPerFrame = 1000 / fps;

    function drawGrain(now) {
      requestAnimationFrame(drawGrain);
      if (now - last < msPerFrame) return;
      last = now;
      const ox = (Math.random() * tileSize) | 0;
      const oy = (Math.random() * tileSize) | 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let x = -ox; x < canvas.width + tileSize; x += tileSize) {
        for (let y = -oy; y < canvas.height + tileSize; y += tileSize) {
          ctx.drawImage(tile, x, y);
        }
      }
    }
    requestAnimationFrame(drawGrain);
  })();

  /* ══════════════════════════════════════════════════════════════════════════
     CUSTOM CURSOR — desktop / pointer:fine only
  ══════════════════════════════════════════════════════════════════════════ */
  (function initCursor() {
    if (isTouch || prefersReduced) return;

    const cursor = document.getElementById('cursor');
    const dot    = document.getElementById('cursor-dot');
    const label  = document.getElementById('cursor-label');
    if (!cursor) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cx = mx, cy = my;

    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    // State machine: '' | 'link'
    function setState(state, text) {
      cursor.className = state ? 'is-' + state : '';
      label.textContent = text || '';
    }

    // Determine cursor state from hovered element
    document.addEventListener('mouseover', e => {
      const tgt = e.target;

      // Lineup slide — special label
      const slide = tgt.closest('.lineup-slide');
      if (slide) {
        const isOpen = slide.getAttribute('aria-expanded') === 'true';
        setState('link', isOpen ? 'CONFIGURE' : 'OPEN');
        return;
      }

      // Any interactive element with an explicit label
      const interactive = tgt.closest('[data-cursor-label]');
      if (interactive) {
        setState('link', interactive.dataset.cursorLabel);
        return;
      }

      // Generic links and buttons
      if (tgt.closest('a, button')) {
        setState('link', '');
        return;
      }

      setState('', '');
    });

    // Mousedown flash
    document.addEventListener('mousedown', () => {
      cursor.classList.add('is-pressed');
      setTimeout(() => cursor.classList.remove('is-pressed'), 120);
    });

    // rAF lerp loop
    function tick() {
      requestAnimationFrame(tick);
      cx = lerp(cx, mx, CFG.cursor.lerpSpeed);
      cy = lerp(cy, my, CFG.cursor.lerpSpeed);
      cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
    }
    tick();
  })();

  /* ══════════════════════════════════════════════════════════════════════════
     FRAME SEQUENCE ENGINE
     Manages a pool of Image objects, lerps between frames, and draws
     cover-fit (landscape) or contain-fit (portrait) on a <canvas>.
  ══════════════════════════════════════════════════════════════════════════ */
  class FrameSequence {
    constructor({ id, canvas, frameCount, path, pathMobile, frameDigits }) {
      this.id         = id;
      this.canvas     = canvas;
      this.ctx        = canvas.getContext('2d');
      this.frameCount = frameCount;
      this.path       = path;
      this.pathMobile = pathMobile;
      this.digits     = frameDigits;

      this.imgs       = new Array(frameCount).fill(null);  // Image objects
      this.ready      = new Array(frameCount).fill(false); // loaded flags

      this.targetF    = 0;    // target frame index (0-based integer)
      this.currentF   = 0;    // interpolated frame (float)
      this.drawnF     = -1;   // last rendered frame index

      this._resizeCanvas();
      window.addEventListener('resize', () => {
        this._resizeCanvas();
        // Redraw immediately so resize doesn't flash blank
        const img = this._nearestLoaded(this.drawnF >= 0 ? this.drawnF : 0);
        if (img) this._draw(img);
      }, { passive: true });
    }

    _resizeCanvas() {
      const c = this.canvas;
      const w = c.offsetWidth;
      const h = c.offsetHeight;
      if (!w || !h) return;
      c.width  = w * DPR;
      c.height = h * DPR;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale
    }

    /** Load a single frame (1-based index). Returns Promise. */
    loadFrame(index1) {
      return new Promise(resolve => {
        const i   = index1 - 1;
        if (this.ready[i]) { resolve(this.imgs[i]); return; }

        const url = isMobile()
          ? frameUrl(this.pathMobile, index1, this.digits)
          : frameUrl(this.path, index1, this.digits);

        const img = new Image();
        const done = () => {
          this.imgs[i]  = img;
          this.ready[i] = true;
          resolve(img);
        };
        img.onload  = () => img.decode ? img.decode().then(done).catch(done) : done();
        img.onerror = () => resolve(null);
        img.src     = url;
      });
    }

    /** Load a contiguous range [start1, end1] (1-based, inclusive).
        Calls onProgress(loaded, total) after each frame. Returns Promise. */
    async loadRange(start1, end1, onProgress) {
      for (let i = start1; i <= end1; i++) {
        await this.loadFrame(i);
        onProgress && onProgress(i - start1 + 1, end1 - start1 + 1);
      }
    }

    /** Load all frames after `after1` in the background. */
    loadRest(after1, onDone) {
      this.loadRange(after1 + 1, this.frameCount).then(onDone);
    }

    /** Return nearest already-loaded frame to index (0-based). */
    _nearestLoaded(idx) {
      if (this.ready[idx]) return this.imgs[idx];
      for (let d = 1; d < this.frameCount; d++) {
        if (idx - d >= 0 && this.ready[idx - d]) return this.imgs[idx - d];
        if (idx + d < this.frameCount && this.ready[idx + d]) return this.imgs[idx + d];
      }
      return null;
    }

    /** Draw an image with cover (landscape) or contain (portrait) fit. */
    _draw(img) {
      if (!img) return;
      const { canvas: c, ctx } = this;
      const cw = c.width, ch = c.height;
      const iw = img.naturalWidth  || img.width  || 1;
      const ih = img.naturalHeight || img.height || 1;
      const portrait = window.innerHeight > window.innerWidth;

      ctx.clearRect(0, 0, cw, ch);

      if (portrait) {
        // CONTAIN — full image visible, background fills empty bars
        ctx.fillStyle = '#07080A';
        ctx.fillRect(0, 0, cw, ch);
        const scale = Math.min(cw / iw, ch / ih);
        const dw = iw * scale, dh = ih * scale;
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      } else {
        // COVER — fills viewport, centre-crop
        const scale = Math.max(cw / iw, ch / ih);
        const dw = iw * scale, dh = ih * scale;
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      }
    }

    /** Set the target frame from a scroll progress value (0–1). */
    setProgress(p) {
      this.targetF = Math.round(clamp(p, 0, 1) * (this.frameCount - 1));
    }

    /** Draw a specific frame immediately (bypasses lerp). 1-based index. */
    drawFrame(index1) {
      const img = this._nearestLoaded(index1 - 1);
      if (img) { this._draw(img); this.drawnF = index1 - 1; }
    }

    /** Called each rAF. Lerp current → target, redraw only when frame changes. */
    tick() {
      this.currentF += (this.targetF - this.currentF) * CFG.frameLerp;
      const f = Math.round(this.currentF);
      if (f === this.drawnF) return;
      this.drawnF = f;
      const img = this._nearestLoaded(f);
      if (img) this._draw(img);
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     CREATE SEQUENCES EARLY (before preloader Promise resolves)
  ══════════════════════════════════════════════════════════════════════════ */
  const heroCanvas     = document.getElementById('hero-canvas');
  const dismantleCanvas= document.getElementById('dismantle-canvas');

  const heroSeq = heroCanvas ? new FrameSequence({
    id: 'hero', canvas: heroCanvas,
    frameCount: CFG.hero.frameCount,
    path: CFG.hero.path, pathMobile: CFG.hero.pathMobile,
    frameDigits: CFG.hero.frameDigits,
  }) : null;

  const dismantleSeq = dismantleCanvas ? new FrameSequence({
    id: 'dismantle', canvas: dismantleCanvas,
    frameCount: CFG.dismantle.frameCount,
    path: CFG.dismantle.path, pathMobile: CFG.dismantle.pathMobile,
    frameDigits: CFG.dismantle.frameDigits,
  }) : null;

  /* Apply wrapper heights from config (before sticky activates) */
  const heroWrapper     = document.getElementById('hero');
  const dismantleWrapper= document.getElementById('dismantle');
  if (heroWrapper)      heroWrapper.style.height      = CFG.heroHeight      + 'vh';
  if (dismantleWrapper) dismantleWrapper.style.height = CFG.dismantleHeight + 'vh';

  /* ══════════════════════════════════════════════════════════════════════════
     PRELOADER
  ══════════════════════════════════════════════════════════════════════════ */
  (function initPreloader() {
    const el  = document.getElementById('preloader');
    const bar = document.getElementById('preloader-bar');
    const cnt = document.getElementById('preloader-counter');
    if (!el) return;

    function setPercent(pct) {
      if (bar) bar.style.width = pct + '%';
      if (cnt) cnt.textContent = pad3(pct);
      el.setAttribute('aria-label', `Loading NOCTIS — ${Math.round(pct)} percent`);
    }

    function reveal() {
      // 1) Flash bar to white
      el.classList.add('is-flash');
      setTimeout(() => {
        el.classList.remove('is-flash');
        // 2) Fade out preloader
        el.classList.add('is-hidden');
        el.addEventListener('transitionend', () => {
          el.style.display = 'none';
        }, { once: true });

        // 3) Continue loading hero frames in background, then dismantle
        if (heroSeq) {
          heroSeq.loadRest(CFG.preloaderInitialFrames, () => {
            dismantleSeq && dismantleSeq.loadRange(1, CFG.dismantle.frameCount);
          });
        } else {
          dismantleSeq && dismantleSeq.loadRange(1, CFG.dismantle.frameCount);
        }
      }, 300);
    }

    if (!heroSeq) {
      setPercent(100);
      setTimeout(reveal, 400);
      return;
    }

    // Load first N frames, then reveal
    const total = CFG.preloaderInitialFrames;
    heroSeq.loadRange(1, total, (done) => {
      setPercent(Math.round((done / total) * 100));
    }).then(() => {
      setPercent(100);
      heroSeq.drawFrame(1); // show first frame before reveal
      setTimeout(reveal, 200);
    });
  })();

  /* ══════════════════════════════════════════════════════════════════════════
     NAVIGATION — hide on scroll-down, show on scroll-up
  ══════════════════════════════════════════════════════════════════════════ */
  (function initNav() {
    const nav    = document.getElementById('main-nav');
    const toggle = document.querySelector('.nav-toggle');
    const drawer = document.getElementById('nav-drawer');
    const closeBtn = document.querySelector('.nav-drawer-close');
    if (!nav) return;

    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      nav.classList.toggle('is-hidden', y > lastY && y > 100);
      lastY = y;
    }, { passive: true });

    function openDrawer() {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      closeBtn && closeBtn.focus();
    }
    function closeDrawer() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }

    toggle  && toggle.addEventListener('click', openDrawer);
    closeBtn && closeBtn.addEventListener('click', closeDrawer);

    drawer && drawer.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', closeDrawer)
    );

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });
  })();

  /* ══════════════════════════════════════════════════════════════════════════
     §1 HERO — scroll-scrubbed sequence + chapters + HUD
  ══════════════════════════════════════════════════════════════════════════ */
  (function initHero() {
    if (!heroSeq || !heroWrapper) return;

    const progressBar  = document.getElementById('hero-progress');
    const hudChapterEl = document.getElementById('hud-chapter-num');
    const hudSpeedEl   = document.getElementById('hud-speed');
    const hudDistEl    = document.getElementById('hud-dist');
    const chapters     = CFG.heroChapters;
    let   activeChIdx  = -2; // -2 = unset, -1 = none

    function updateChapters(p) {
      let newIdx = -1;
      for (let i = 0; i < chapters.length; i++) {
        if (p >= chapters[i].in && p <= chapters[i].out) { newIdx = i; break; }
      }
      if (newIdx === activeChIdx) return;

      // Hide previous chapter
      if (activeChIdx >= 0) {
        const prev = document.getElementById('hero-' + chapters[activeChIdx].id);
        if (prev) {
          prev.classList.remove('is-visible');
          prev.setAttribute('aria-hidden', 'true');
          hideLines(prev);
        }
      }

      // Show new chapter
      if (newIdx >= 0) {
        const el = document.getElementById('hero-' + chapters[newIdx].id);
        if (el) {
          el.classList.add('is-visible');
          el.setAttribute('aria-hidden', 'false');
          revealLines(el);
        }
        if (hudChapterEl) hudChapterEl.textContent = String(newIdx + 1).padStart(2, '0');
      }

      activeChIdx = newIdx;
    }

    function updateHUD(p) {
      if (hudSpeedEl) hudSpeedEl.textContent = pad3(p * CFG.hud.maxSpeed);
      if (hudDistEl)  hudDistEl.textContent  = fix1(p * CFG.hud.maxDistance);
    }

    function updateEndFade(p) {
      // Canvas fades to black over last 5% of hero scroll
      if (heroCanvas) heroCanvas.style.opacity = p >= 0.95
        ? String(1 - ((p - 0.95) / 0.05))
        : '1';
    }

    let lastP = -1;
    function onScroll() {
      const p = sectionProgress(heroWrapper);
      if (Math.abs(p - lastP) < 0.0004) return;
      lastP = p;

      heroSeq.setProgress(p);
      if (progressBar) progressBar.style.width = (p * 100) + '%';
      updateChapters(p);
      updateHUD(p);
      updateEndFade(p);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ══════════════════════════════════════════════════════════════════════════
     §2 STATEMENT — word-by-word opacity reveal driven by scroll
  ══════════════════════════════════════════════════════════════════════════ */
  (function initStatement() {
    const section = document.getElementById('statement');
    if (!section) return;
    const words = Array.from(section.querySelectorAll('.word'));
    if (!words.length) return;

    let lastLit = -1;
    function update() {
      const rect = section.getBoundingClientRect();
      // progress: 0 when top enters viewport, 1 when mostly visible
      const p    = clamp((window.innerHeight - rect.top) / (window.innerHeight * 0.9), 0, 1);
      const lit  = Math.round(p * words.length);
      if (lit === lastLit) return;
      lastLit = lit;
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  })();

  /* ══════════════════════════════════════════════════════════════════════════
     §3 DISMANTLE — scroll-scrubbed sequence + callouts
  ══════════════════════════════════════════════════════════════════════════ */
  (function initDismantle() {
    if (!dismantleWrapper) return;

    const stage       = document.getElementById('dismantle-stage');
    const progressBar = document.getElementById('dismantle-progress');
    const calloutsEl  = document.getElementById('dismantle-callouts');
    const titleEl     = document.querySelector('.dismantle-title');

    // Build callout DOM from config
    if (calloutsEl) {
      CFG.dismantleCallouts.forEach(c => {
        const el = document.createElement('div');
        el.className = 'callout';
        el.id        = 'callout-' + c.id;
        el.style.left = c.x + '%';
        el.style.top  = c.y + '%';
        el.innerHTML  = `
          <div class="callout-dot" aria-hidden="true"></div>
          <div class="callout-line" aria-hidden="true"></div>
          <div class="callout-body">
            <span class="hud-text callout-label">${c.label}</span>
            <span class="callout-desc">${c.text}</span>
          </div>`;
        calloutsEl.appendChild(el);
      });
    }

    // Reveal section title when dismantle enters viewport
    if (titleEl) {
      const obs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { revealLines(titleEl); obs.disconnect(); }
      }, { threshold: 0.05 });
      obs.observe(dismantleWrapper);
    }

    let lastP = -1;
    function onScroll() {
      const p = sectionProgress(dismantleWrapper);
      if (Math.abs(p - lastP) < 0.0004) return;
      lastP = p;

      if (dismantleSeq) dismantleSeq.setProgress(p);
      if (progressBar) progressBar.style.width = (p * 100) + '%';

      // Show/hide callouts
      CFG.dismantleCallouts.forEach(c => {
        const el = document.getElementById('callout-' + c.id);
        if (el) el.classList.toggle('is-visible', p >= c.showAfterProgress);
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ══════════════════════════════════════════════════════════════════════════
     §4 LINEUP ACCORDION
  ══════════════════════════════════════════════════════════════════════════ */
  (function initLineup() {
    const container = document.getElementById('lineup-slides');
    if (!container) return;

    /* ── Build slide DOM ── */
    CFG.lineup.forEach((car, idx) => {
      const slide = document.createElement('div');
      slide.className = 'lineup-slide';
      slide.id        = 'slide-' + car.id;
      slide.setAttribute('role',         'tab');
      slide.setAttribute('tabindex',     '0');
      slide.setAttribute('aria-expanded', idx === 0 ? 'true' : 'false');
      slide.setAttribute('aria-label',    `${car.number} ${car.name} — ${car.tagline}`);

      const swatchesHTML = car.swatches.map((col, si) =>
        `<button class="swatch${si === 0 ? ' is-active' : ''}"
                 style="background:${col}"
                 aria-label="Colour option ${si + 1}"
                 tabindex="-1"></button>`
      ).join('');

      const isConceptCar = car.accel === '—';
      const specsHTML = isConceptCar
        ? `<div class="slide-spec">
             <span class="hud-text slide-spec-label">RANGE</span>
             <span class="hud-text slide-spec-value">${car.range}</span>
           </div>`
        : `<div class="slide-spec">
             <span class="hud-text slide-spec-label">RANGE</span>
             <span class="hud-text slide-spec-value">${car.range}</span>
           </div>
           <div class="slide-spec">
             <span class="hud-text slide-spec-label">0–100</span>
             <span class="hud-text slide-spec-value">${car.accel}</span>
           </div>
           <div class="slide-spec">
             <span class="hud-text slide-spec-label">POWER</span>
             <span class="hud-text slide-spec-value">${car.power}</span>
           </div>`;

      slide.innerHTML = `
        <div class="slide-closed">
          <span class="hud-text slide-number">${car.number}</span>
          <img class="slide-img-closed"
               src="${car.img}"
               alt=""
               aria-hidden="true"
               loading="lazy"
               width="400" height="225" />
          <span class="slide-name-vert">${car.name}</span>
        </div>
        <div class="slide-open" aria-hidden="${idx === 0 ? 'false' : 'true'}">
          <div class="slide-floor" aria-hidden="true"></div>
          <img class="slide-open-img"
               src="${car.img}"
               alt="${car.alt}"
               loading="lazy"
               width="1600" height="900" />
          <h3 class="display-text slide-open-name">${car.name}</h3>
          <p class="body-text slide-tagline">${car.tagline}</p>
          <div class="slide-specs">${specsHTML}</div>
          <div class="slide-swatches">${swatchesHTML}</div>
          <a href="#reserve" class="text-link slide-cta" data-cursor-label="CONFIGURE">Configure →</a>
        </div>`;

      container.appendChild(slide);
    });

    const slides = Array.from(container.querySelectorAll('.lineup-slide'));
    let openIdx   = 0;
    let hoverTimer= null;

    function openSlide(idx) {
      if (idx === openIdx && slides[idx].getAttribute('aria-expanded') === 'true') return;

      slides.forEach((s, i) => {
        const isOpen = i === idx;
        s.setAttribute('aria-expanded', String(isOpen));
        const openPanel = s.querySelector('.slide-open');
        if (openPanel) openPanel.setAttribute('aria-hidden', String(!isOpen));
      });

      openIdx = idx;
    }

    // Desktop hover with debounce
    if (!isTouch) {
      slides.forEach((slide, idx) => {
        slide.addEventListener('mouseenter', () => {
          clearTimeout(hoverTimer);
          hoverTimer = setTimeout(() => openSlide(idx), CFG.lineupHoverDebounce);
        });
        slide.addEventListener('mouseleave', () => clearTimeout(hoverTimer));
      });
    }

    // Click / tap / keyboard activation
    slides.forEach((slide, idx) => {
      slide.addEventListener('click', () => openSlide(idx));
      slide.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openSlide(idx);
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          slides[Math.min(idx + 1, slides.length - 1)].focus();
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          slides[Math.max(idx - 1, 0)].focus();
        }
        if (e.key === 'Home') { e.preventDefault(); slides[0].focus(); }
        if (e.key === 'End')  { e.preventDefault(); slides[slides.length - 1].focus(); }
      });
    });

    // Swatch clicks
    container.addEventListener('click', e => {
      const swatch = e.target.closest('.swatch');
      if (!swatch) return;
      const parentSlide = swatch.closest('.lineup-slide');
      if (!parentSlide) return;
      parentSlide.querySelectorAll('.swatch').forEach(s => s.classList.remove('is-active'));
      swatch.classList.add('is-active');
      e.stopPropagation(); // don't re-open the slide
    });

    // Rise-in entrance animation (staggered)
    const lineupSection = document.getElementById('lineup');
    if (lineupSection) {
      const obs = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        slides.forEach((s, i) => {
          setTimeout(() => s.classList.add('is-visible'), i * 80);
        });
        obs.disconnect();
      }, { threshold: 0.1 });
      obs.observe(lineupSection);
    }

    // Reveal lineup header headline
    const lineupHeader = document.querySelector('.lineup-header .reveal-lines');
    if (lineupHeader) {
      const obs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { revealLines(lineupHeader.parentElement); obs.disconnect(); }
      }, { threshold: 0.2 });
      obs.observe(lineupHeader);
    }

    // Open GT-E by default
    openSlide(0);
  })();

  /* ══════════════════════════════════════════════════════════════════════════
     §5 RESERVE
  ══════════════════════════════════════════════════════════════════════════ */
  (function initReserve() {
    // Reveal headline when section enters view
    const section = document.getElementById('reserve');
    if (!section) return;

    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        revealLines(section);
        obs.disconnect();
      }
    }, { threshold: 0.2 });
    obs.observe(section);

    // Reserve button feedback
    const btn = section.querySelector('.reserve-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        const lbl = btn.querySelector('.reserve-label');
        if (lbl) {
          lbl.textContent = 'COMING SOON';
          btn.disabled = true;
          setTimeout(() => {
            lbl.textContent = 'RESERVE YOUR NOCTIS';
            btn.disabled = false;
          }, 2500);
        }
      });
    }
  })();

  /* ══════════════════════════════════════════════════════════════════════════
     GENERIC INTERSECTION REVEALS — non-pinned sections
  ══════════════════════════════════════════════════════════════════════════ */
  (function initRevealObserver() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          revealLines(entry.target.closest('section') || entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    // Target reveal-lines containers NOT inside pinned scroll-wrappers
    document.querySelectorAll(
      '.section-statement .reveal-lines, .section-reserve .reveal-lines, #site-footer .reveal-lines'
    ).forEach(el => obs.observe(el));
  })();

  /* ══════════════════════════════════════════════════════════════════════════
     GLOBAL rAF LOOP — ticks both frame sequences
  ══════════════════════════════════════════════════════════════════════════ */
  (function startLoop() {
    function loop() {
      requestAnimationFrame(loop);
      heroSeq      && heroSeq.tick();
      dismantleSeq && dismantleSeq.tick();
    }
    requestAnimationFrame(loop);
  })();

  /* ══════════════════════════════════════════════════════════════════════════
     PREFERS-REDUCED-MOTION — static frame display
  ══════════════════════════════════════════════════════════════════════════ */
  if (prefersReduced) {
    const rm = CFG.reducedMotion;

    // Show all hero chapters statically
    CFG.heroChapters.forEach(ch => {
      const el = document.getElementById('hero-' + ch.id);
      if (el) {
        el.classList.add('is-visible');
        el.setAttribute('aria-hidden', 'false');
        revealLines(el);
      }
    });

    // Draw hero first frame
    if (heroSeq) {
      heroSeq.loadFrame(1).then(img => { if (img) heroSeq._draw(img); });
    }

    // Draw dismantle first frame
    if (dismantleSeq) {
      dismantleSeq.loadFrame(1).then(img => { if (img) dismantleSeq._draw(img); });
    }

    // Instant reveal all text
    document.querySelectorAll('.line-inner').forEach(el => el.classList.add('is-revealed'));
    document.querySelectorAll('.word').forEach(el => el.classList.add('is-lit'));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     CONSOLE SIGNATURE
  ══════════════════════════════════════════════════════════════════════════ */
  console.log(
    '%c NOCTIS %c Drive the Night',
    'background:#07080A;color:#CFE3FF;font-family:monospace;padding:3px 8px;border:1px solid #CFE3FF;',
    'color:#8A8F98;font-family:monospace;'
  );

}); // end DOMContentLoaded
