/**
 * ADVORA — MAIN JAVASCRIPT
 * Handles: hero scroll animation, carousel, modal, email reveal,
 *          scroll-reveal, navigation behaviour.
 */

'use strict';

// ============================================================
// CONFIGURATION  ← Edit these before launch
// ============================================================
const CONFIG = {
  // ⚠️  Replace with your real business email
  email: 'official.advora.studio@gmail.com',
  // linkedIn: 'https://www.linkedin.com/company/advora', // uncomment when ready

  totalFrames: 192,
  frameDir: 'assets/hero-frames/',
  frameName: (n) => `frame_${String(n).padStart(4, '0')}.png`,
  initialPreload: 30,  // frames loaded before animation starts

  videos: [
    { id: 'fragrance-01', title: 'Fragrance Campaign 01', category: 'Fragrance',           src: 'assets/videos/fragrance-01.mp4' },
    { id: 'fragrance-02', title: 'Fragrance Campaign 02', category: 'Fragrance',           src: 'assets/videos/fragrance-02.mp4' },
    { id: 'fragrance-03', title: 'Fragrance Campaign 03', category: 'Fragrance',           src: 'assets/videos/fragrance-03.mp4' },
    { id: 'mens-watch',   title: "Men's Luxury Watch",    category: 'Luxury Accessories',  src: 'assets/videos/mens-watch.mp4'   },
    { id: 'dog-harness',  title: 'Dog Harness Campaign',  category: 'Pet Products',        src: 'assets/videos/dog-harness.mp4'  },
    { id: 'interior-design', title: 'EDIT Design House',  category: 'Interior Design',     src: 'assets/videos/interior-design.mp4' },
  ],
};

// ============================================================
// UTILITY
// ============================================================
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================================
// HERO FRAME SEQUENCE — SCROLL DRIVEN
// ============================================================
class HeroAnimation {
  constructor() {
    this.canvas   = qs('#hero-canvas');
    if (!this.canvas) return;
    this.ctx      = this.canvas.getContext('2d', { alpha: false });
    this.stage    = qs('.hero-bg-stage');
    this.loadBar  = qs('.hero-loading-bar');
    this.heroText = qs('.hero-text');
    this.hint     = qs('.hero-scroll-hint');

    this.frames      = new Array(CONFIG.totalFrames).fill(null);
    this.loadedCount = 0;
    this.currentIdx  = 0;
    this.isReady     = false;
    this.reduced     = prefersReducedMotion();

    this._resizeBound  = this._onResize.bind(this);
    this._scrollBound  = this._onScroll.bind(this);
    this._ticking      = false;

    this._init();
  }

  _init() {
    this._resizeCanvas();
    window.addEventListener('resize', this._resizeBound, { passive: true });

    if (this.reduced) {
      // Show first frame statically, skip scroll animation
      this._loadFrame(1).then(img => { if (img) this._draw(img); });
      return;
    }

    this._preloadInitial(CONFIG.initialPreload).then(() => {
      this.isReady = true;
      if (this.loadBar) { this.loadBar.style.width = '100%'; }
      setTimeout(() => { if (this.loadBar) this.loadBar.style.opacity = '0'; }, 600);
      this._drawByIdx(0);
      window.addEventListener('scroll', this._scrollBound, { passive: true });
      this._loadRemaining(CONFIG.initialPreload + 1);
    });
  }

  _resizeCanvas() {
    if (!this.canvas) return;
    const w = this.stage ? this.stage.clientWidth  : window.innerWidth;
    const h = this.stage ? this.stage.clientHeight : window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.frames[this.currentIdx]) this._draw(this.frames[this.currentIdx]);
  }

  _onResize() {
    // Debounce
    clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => this._resizeCanvas(), 150);
  }

  _loadFrame(fileIdx) {
    const arrIdx = fileIdx - 1;
    if (this.frames[arrIdx]) return Promise.resolve(this.frames[arrIdx]);
    return new Promise(resolve => {
      const img = new Image();
      img.decoding = 'async';
      img.onload  = () => { this.frames[arrIdx] = img; this.loadedCount++; resolve(img); };
      img.onerror = () => resolve(null);
      img.src = CONFIG.frameDir + CONFIG.frameName(fileIdx);
    });
  }

  async _preloadInitial(count) {
    const tasks = [];
    for (let i = 1; i <= Math.min(count, CONFIG.totalFrames); i++) {
      tasks.push(this._loadFrame(i));
      if (this.loadBar) {
        this.loadBar.style.width = `${(i / count) * 95}%`;
      }
    }
    await Promise.all(tasks);
  }

  _loadRemaining(startIdx) {
    let i = startIdx;
    const next = () => {
      if (i > CONFIG.totalFrames) return;
      this._loadFrame(i++).then(() => {
        const cb = window.requestIdleCallback
          ? (fn) => requestIdleCallback(fn, { timeout: 300 })
          : (fn) => setTimeout(fn, 20);
        cb(next);
      });
    };
    setTimeout(next, 400);
  }

  _draw(img) {
    if (!img) return;
    const cw = this.stage ? this.stage.clientWidth  : window.innerWidth;
    const ch = this.stage ? this.stage.clientHeight : window.innerHeight;
    const iw = img.naturalWidth  || 1280;
    const ih = img.naturalHeight || 720;
    const scale = Math.min(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, cw, ch);
    this.ctx.drawImage(img, dx, dy, dw, dh);
  }

  _drawByIdx(idx) {
    const img = this.frames[idx];
    if (img) {
      this._draw(img);
    } else {
      // On-demand fallback
      this._loadFrame(idx + 1).then(img => { if (img) this._draw(img); });
    }
  }

  _onScroll() {
    if (this._ticking) return;
    this._ticking = true;
    requestAnimationFrame(() => {
      this._update();
      this._ticking = false;
    });
  }

  _update() {
    if (!this.isReady) return;

    const scrollTop   = window.scrollY;
    const totalScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress    = Math.max(0, Math.min(1, scrollTop / totalScroll));

    const targetIdx   = Math.round(progress * (CONFIG.totalFrames - 1));
    if (targetIdx !== this.currentIdx) {
      this.currentIdx = targetIdx;
      this._drawByIdx(targetIdx);
    }

    // Fade hero copy as user scrolls past the opening screen
    if (this.heroText) {
      this.heroText.classList.toggle('faded', scrollTop > window.innerHeight * 0.18);
    }
    if (this.hint) {
      this.hint.style.opacity = scrollTop > 40 ? '0' : '1';
    }
  }
}

// ============================================================
// VIDEO CAROUSEL — Infinite marquee + scroll-link + drag
// ============================================================
class VideoCarousel {
  constructor() {
    this.track    = qs('.carousel-track');
    this.viewport = qs('.carousel-viewport');
    if (!this.track || !this.viewport) return;

    this.reduced      = prefersReducedMotion();
    this.origItems    = qsa('.carousel-item', this.track);
    this.itemW        = 0;
    this.gap          = 24;
    this.halfW        = 0;        // width of original set (loop point)

    // Marquee position (auto-advance)
    this.marqX        = 0;
    this.marqSpeed    = this.reduced ? 0 : 0.6; // px/frame
    this.marqRunning  = !this.reduced;

    // Nav offset (from prev/next buttons or drag)
    this.navOff       = 0;
    this.navTarget    = 0;

    // Current total offset rendered
    this.renderX      = 0;

    this.dragging     = false;
    this.dragStartX   = 0;
    this.dragStartM   = 0;

    this.lastScrollY  = window.scrollY;
    this.rafId        = null;

    this._duplicateItems();
    this._bindVideoHover();
    this._bindEvents();
    this._loop();
  }

  _duplicateItems() {
    // Clone original items for seamless loop
    this.origItems.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('[tabindex]').forEach(el => el.setAttribute('tabindex', '-1'));
      this.track.appendChild(clone);
    });
    // Set up lazy video loading on all items (original + clone)
    this._setupLazyVideos();
  }

  _setupLazyVideos() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: load all
      qsa('video[data-src]', this.track).forEach(v => {
        v.src = v.dataset.src;
        v.load();
      });
      return;
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const v = qs('video', entry.target);
        if (v && v.dataset.src) {
          v.src = v.dataset.src;
          delete v.dataset.src;
        }
        obs.unobserve(entry.target);
      });
    }, { root: this.viewport, rootMargin: '400px' });
    qsa('.carousel-item', this.track).forEach(item => obs.observe(item));
  }

  _bindVideoHover() {
    // Hover → muted preview play; leave → pause
    this.track.addEventListener('mouseenter', e => {
      const card = e.target.closest('.video-card');
      if (!card) return;
      const v = qs('video', card);
      if (v && v.paused) v.play().catch(() => {});
    }, true);

    this.track.addEventListener('mouseleave', e => {
      const card = e.target.closest('.video-card');
      if (!card) return;
      const v = qs('video', card);
      if (v && !v.paused) v.pause();
    }, true);
  }

  _measure() {
    const item = qs('.carousel-item', this.track);
    if (!item) return;
    this.itemW = item.offsetWidth;
    this.halfW = this.origItems.length * (this.itemW + this.gap);
  }

  _applyX(x) {
    if (this.halfW > 0) {
      x = ((x % this.halfW) + this.halfW) % this.halfW;
    }
    this.renderX = x;
    this.track.style.transform = `translateX(${-x}px)`;
  }

  _loop() {
    this._measure();

    // Ease nav offset
    this.navOff += (this.navTarget - this.navOff) * 0.07;

    // Advance marquee
    if (this.marqRunning && !this.dragging) {
      this.marqX += this.marqSpeed;
    }

    this._applyX(this.marqX + this.navOff);
    this.rafId = requestAnimationFrame(() => this._loop());
  }

  navigate(dir) {
    this.navTarget += dir * (this.itemW + this.gap);
  }

  _bindEvents() {
    qs('#reel-prev')?.addEventListener('click', () => this.navigate(-1));
    qs('#reel-next')?.addEventListener('click', () => this.navigate(1));

    // Keyboard on viewport
    this.viewport.setAttribute('tabindex', '0');
    this.viewport.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); this.navigate(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); this.navigate(1); }
    });

    // Mouse drag
    this.viewport.addEventListener('mousedown', e => this._dragStart(e.clientX));
    window.addEventListener('mousemove', e => { if (this.dragging) this._dragMove(e.clientX); });
    window.addEventListener('mouseup',   () => this._dragEnd());

    // Touch
    this.viewport.addEventListener('touchstart', e => this._dragStart(e.touches[0].clientX), { passive: true });
    this.viewport.addEventListener('touchmove',  e => { if (this.dragging) this._dragMove(e.touches[0].clientX); }, { passive: true });
    this.viewport.addEventListener('touchend',   () => this._dragEnd());

    // Scroll-link
    if (!this.reduced) {
      window.addEventListener('scroll', () => {
        const dy = window.scrollY - this.lastScrollY;
        this.lastScrollY = window.scrollY;
        const section = qs('.section-reel');
        if (!section) return;
        const r = section.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          this.marqX += dy * 0.35;
        }
      }, { passive: true });
    }
  }

  _dragStart(x) {
    this.dragging    = true;
    this.dragStartX  = x;
    this.dragStartM  = this.marqX;
    this.viewport.style.cursor = 'grabbing';
  }

  _dragMove(x) {
    this.marqX = this.dragStartM + (this.dragStartX - x);
  }

  _dragEnd() {
    this.dragging = false;
    this.viewport.style.cursor = '';
  }
}

// ============================================================
// VIDEO MODAL LIGHTBOX
// ============================================================
class VideoModal {
  constructor() {
    this.modal   = qs('.video-modal');
    this.video   = qs('.modal-video');
    this.image   = qs('.modal-image');
    this.closeEl = qs('.modal-close');
    if (!this.modal) return;

    this.isOpen   = false;
    this.prevFocus = null;

    this.closeEl?.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', e => { if (e.target === this.modal) this.close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Delegate: clicks and keyboard activation on video or static-image cards
    document.addEventListener('click', e => {
      const videoCard = e.target.closest('.video-card[data-video-src]');
      if (videoCard) { this.openVideo(videoCard.dataset.videoSrc, videoCard.dataset.videoTitle); return; }
      const imgCard = e.target.closest('.static-card[data-image-src]');
      if (imgCard) this.openImage(imgCard.dataset.imageSrc, imgCard.dataset.imageTitle);
    });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const videoCard = e.target.closest('.video-card[data-video-src]');
      if (videoCard) { e.preventDefault(); this.openVideo(videoCard.dataset.videoSrc, videoCard.dataset.videoTitle); return; }
      const imgCard = e.target.closest('.static-card[data-image-src]');
      if (imgCard) { e.preventDefault(); this.openImage(imgCard.dataset.imageSrc, imgCard.dataset.imageTitle); }
    });
  }

  openVideo(src, title) {
    if (!this.modal || !this.video) return;
    this.prevFocus = document.activeElement;
    this.modal.classList.remove('is-image');
    if (this.image) { this.image.src = ''; this.image.alt = ''; }
    this.video.src = src;
    this.video.load();
    this.video.play().catch(() => {});
    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.isOpen = true;
    this.closeEl?.focus();
  }

  openImage(src, title) {
    if (!this.modal || !this.image) return;
    this.prevFocus = document.activeElement;
    if (this.video) { this.video.pause(); this.video.src = ''; }
    this.modal.classList.add('is-image');
    this.image.src = src;
    this.image.alt = title || 'Static advertisement preview';
    this.modal.classList.add('open');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.isOpen = true;
    this.closeEl?.focus();
  }

  close() {
    if (!this.modal) return;
    if (this.video) { this.video.pause(); this.video.src = ''; }
    if (this.image) { this.image.src = ''; this.image.alt = ''; }
    this.modal.classList.remove('open', 'is-image');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this.isOpen = false;
    this.prevFocus?.focus();
  }
}

// ============================================================
// EMAIL REVEAL
// ============================================================
function initEmailReveal() {
  const btn    = qs('#cta-contact-btn');
  const reveal = qs('#email-reveal');
  const link   = qs('#email-link');
  if (!btn || !reveal) return;

  if (link) {
    link.href = `mailto:${CONFIG.email}`;
    link.textContent = CONFIG.email;
  }

  const toggle = () => {
    const visible = reveal.classList.toggle('visible');
    btn.setAttribute('aria-expanded', String(visible));
    if (visible && link) link.focus();
  };

  btn.addEventListener('click', toggle);
  btn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
}

// ============================================================
// NAVIGATION — scroll state + mobile hamburger
// ============================================================
function initNav() {
  const nav        = qs('.site-nav');
  const hamburger  = qs('.nav-hamburger');
  const navLinks   = qs('.nav-links');

  if (nav) {
    const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
    });
    // Close on nav link click (mobile)
    navLinks.addEventListener('click', e => {
      if (e.target.closest('a')) navLinks.classList.remove('open');
    });
  }

  // Mark active link
  const path = window.location.pathname;
  qsa('.nav-link').forEach(a => {
    try {
      const ap = new URL(a.href, location.origin).pathname;
      const isHome = (path === '/' || path.endsWith('/index.html')) && (ap === '/' || ap.endsWith('/index.html'));
      const match  = ap === path || isHome;
      if (match) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
    } catch (_) {}
  });
}

// ============================================================
// SCROLL REVEAL
// ============================================================
function initReveal() {
  if (prefersReducedMotion()) {
    qsa('.reveal').forEach(el => el.classList.add('in-view'));
    return;
  }
  if (!('IntersectionObserver' in window)) {
    qsa('.reveal').forEach(el => el.classList.add('in-view'));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px 100px 0px' });
  qsa('.reveal').forEach(el => obs.observe(el));
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  initEmailReveal();

  // Portfolio page only
  if (qs('#hero-canvas')) {
    new HeroAnimation();
    new VideoCarousel();
    new VideoModal();
  }
});
