/* ============================================================
   LOGRAMO — SCROLL & MICRO INTERACTIONS (GSAP + ScrollTrigger)
   - Mobile sticky-stack cards
   - Horizontal drag scroll with velocity-based tilt
   - Team 3D entrance + mouse-follow
   - Video parallax tilt on hover
   - Hero parallax
   - Subtle hover lifts
   ============================================================ */
(function () {
  if (typeof gsap === 'undefined') return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  /* ============ MOBILE STICKY STACK ============
     Each child card sticks at top; as next card approaches, this one
     scales down + dims, creating a deck-of-cards feel.
  */
  function initStickyStack() {
    if (!isMobile() || !window.ScrollTrigger) return;
    document.querySelectorAll('[data-stack-mobile]').forEach(stack => {
      const cards = Array.from(stack.children);
      cards.forEach((card, i) => {
        gsap.set(card, { transformOrigin: 'center top' });
        if (i === cards.length - 1) return;
        const next = cards[i + 1];
        ScrollTrigger.create({
          trigger: next,
          start: 'top bottom',
          end: 'top 100px',
          scrub: true,
          onUpdate(self) {
            const p = self.progress;
            gsap.set(card, {
              scale: 1 - p * 0.05
            });
          }
        });
      });
    });
  }

  /* ============ HORIZONTAL DRAG SCROLL WITH TILT ============
     Cards in [data-h-drag] track the user's pointer velocity and
     tilt (rotateY) based on it, then ease back to flat.
  */
  function initDragScroll() {
    document.querySelectorAll('[data-h-drag]').forEach(track => {
      let isDown = false, startX = 0, startScroll = 0, lastX = 0, lastT = 0;
      let velocity = 0, raf, dragged = false, dragDist = 0;

      const cards = () => Array.from(track.children).filter(c => c.nodeType === 1);

      const applyTilt = (vx) => {
        const rect = track.getBoundingClientRect();
        const trackCenter = rect.left + rect.width / 2;
        cards().forEach(card => {
          const cr = card.getBoundingClientRect();
          const cardCenter = cr.left + cr.width / 2;
          const dxNorm = (cardCenter - trackCenter) / (rect.width / 2);
          const clamped = Math.max(-1.4, Math.min(1.4, dxNorm));
          // Velocity-driven sway + perspective tilt away from center
          const rotY = (vx * 0.6) + (clamped * -7);
          const rotX = -Math.abs(vx) * 0.18;
          gsap.to(card, {
            rotationY: rotY,
            rotationX: rotX,
            duration: 0.35,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        });
      };

      const settle = () => {
        gsap.to(cards(), {
          rotationY: 0, rotationX: 0,
          duration: 0.7, ease: 'power3.out',
          overwrite: 'auto'
        });
      };

      const decay = () => {
        velocity *= 0.9;
        if (Math.abs(velocity) < 0.08) { velocity = 0; settle(); return; }
        applyTilt(velocity);
        raf = requestAnimationFrame(decay);
      };

      track.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button !== 0) return;
        isDown = true; dragged = false; dragDist = 0;
        track.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startScroll = track.scrollLeft;
        lastX = e.clientX;
        lastT = performance.now();
        velocity = 0;
        cancelAnimationFrame(raf);
        track.classList.add('is-dragging');
      });

      track.addEventListener('pointermove', e => {
        if (!isDown) return;
        const now = performance.now();
        const dx = e.clientX - lastX;
        const dt = Math.max(1, now - lastT);
        velocity = -(dx / dt) * 16; // pixels per frame-ish
        lastX = e.clientX; lastT = now;
        const totalDx = e.clientX - startX;
        dragDist = Math.abs(totalDx);
        if (dragDist > 6) dragged = true;
        track.scrollLeft = startScroll - totalDx;
        applyTilt(velocity);
      });

      const end = (e) => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove('is-dragging');
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(decay);
      };
      track.addEventListener('pointerup', end);
      track.addEventListener('pointercancel', end);
      track.addEventListener('lostpointercapture', end);

      // Block accidental link/click after drag
      track.addEventListener('click', e => {
        if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
      }, true);

      // Wheel → horizontal scroll on desktop
      track.addEventListener('wheel', e => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          track.scrollLeft += e.deltaY;
          velocity = e.deltaY * 0.25;
          applyTilt(velocity);
          clearTimeout(track._wt);
          track._wt = setTimeout(() => { velocity = 0; settle(); }, 150);
        }
      }, { passive: false });
    });
  }

  /* ============ TEAM 3D REVEAL + MOUSE FOLLOW ============ */
  function initTeam() {
    const team = document.querySelector('.team-grid');
    if (!team) return;
    if (window.ScrollTrigger) {
      gsap.from(team.children, {
        scrollTrigger: { trigger: team, start: 'top 75%' },
        y: 80, opacity: 0, rotationX: 35, scale: 0.9,
        transformOrigin: 'center bottom',
        duration: 1, ease: 'power3.out',
        stagger: 0.16
      });
    }
    Array.from(team.children).forEach(card => {
      gsap.set(card, { transformStyle: 'preserve-3d' });
      const img = card.querySelector('.team-card__img');
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotationY: x * 12, rotationX: -y * 12, duration: 0.4, ease: 'power2.out' });
        if (img) gsap.to(img, { x: x * -10, y: y * -10, scale: 1.05, duration: 0.4 });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.7, ease: 'power3.out' });
        if (img) gsap.to(img, { x: 0, y: 0, scale: 1, duration: 0.7 });
      });
    });
  }

  /* ============ VIDEO TILT + PARALLAX THUMB ============ */
  function initVideoTilt() {
    document.querySelectorAll('[data-video-tilt] > *').forEach(card => {
      gsap.set(card, { transformStyle: 'preserve-3d' });
      const thumb = card.querySelector('.video-card__thumb');
      const play = card.querySelector('.video-card__play');
      const overlay = card.querySelector('.video-card__overlay');
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, { rotationY: x * 14, rotationX: -y * 14, scale: 1.03, duration: 0.4 });
        if (thumb) gsap.to(thumb, { x: x * -18, y: y * -18, scale: 1.12, duration: 0.5 });
        if (play) gsap.to(play, { x: x * 16, y: y * 16, scale: 1.1, duration: 0.4 });
        if (overlay) gsap.to(overlay, { x: x * 8, duration: 0.5 });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotationY: 0, rotationX: 0, scale: 1, duration: 0.7, ease: 'power3.out' });
        if (thumb) gsap.to(thumb, { x: 0, y: 0, scale: 1, duration: 0.7 });
        if (play) gsap.to(play, { x: 0, y: 0, scale: 1, duration: 0.6 });
        if (overlay) gsap.to(overlay, { x: 0, duration: 0.6 });
      });
    });

    // Pulsing play buttons (subtle)
    document.querySelectorAll('.video-card__play').forEach(p => {
      gsap.to(p, { scale: 1.08, duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    });
  }

  /* ============ HERO PARALLAX ============ */
  function initHeroParallax() {
    if (!window.ScrollTrigger) return;
    const heroImg = document.querySelector('.hero__img-wrap img');
    if (heroImg) {
      gsap.to(heroImg, {
        yPercent: 18, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }
    document.querySelectorAll('.hero__sticker').forEach((el, i) => {
      gsap.to(el, {
        y: -30 - i * 6, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ============ SUBTLE HOVER LIFT ============ */
  function initHoverLift() {
    const sel = '.path-card, .stat, .featured-post, .book-card, .article-card, .value-card, .for-card, .review-card';
    document.querySelectorAll(sel).forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (el.closest('[data-h-drag]')) return; // dragged tracks handle their own
        gsap.to(el, { y: -6, duration: 0.35, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => {
        if (el.closest('[data-h-drag]')) return;
        gsap.to(el, { y: 0, duration: 0.5, ease: 'power3.out' });
      });
    });

    // Buttons get a subtle bounce on click
    document.querySelectorAll('.btn').forEach(b => {
      b.addEventListener('mousedown', () => gsap.to(b, { scale: 0.96, duration: 0.1 }));
      b.addEventListener('mouseup', () => gsap.to(b, { scale: 1, duration: 0.25, ease: 'back.out(2)' }));
      b.addEventListener('mouseleave', () => gsap.to(b, { scale: 1, duration: 0.25 }));
    });
  }

  /* Marquee scroll-reaction removed — animation stays at constant CSS speed */

  /* ============ HORIZONTAL SCROLL AFFORDANCES ============
     Wrap each horizontal-scrolling track in a div, append a "Swipe →"
     hint pill, dot indicators, and a right-edge fade gradient. Hint
     fades out as soon as the user scrolls; dots update live; end-fade
     hides when scrolled to the end.
  */
  function initScrollAffordances() {
    const tracks = document.querySelectorAll('[data-h-drag], .video-grid');
    tracks.forEach(track => {
      // Only apply on small screens for video-grid (data-h-drag is always horizontal)
      const isVideo = track.classList.contains('video-grid');
      const cards = Array.from(track.children);
      if (cards.length < 2) return;

      // Wrap track in .h-scroll-wrap
      const wrap = document.createElement('div');
      wrap.className = 'h-scroll-wrap';
      track.parentNode.insertBefore(wrap, track);
      wrap.appendChild(track);

      // Hint pill
      const hint = document.createElement('div');
      hint.className = 'h-scroll-hint';
      hint.innerHTML = 'Desliza <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h14M13 6l6 6-6 6"/></svg>';
      wrap.appendChild(hint);

      // Dots — appended after the wrap so they sit centered below
      const dots = document.createElement('div');
      dots.className = 'h-scroll-dots';
      cards.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'h-scroll-dot' + (i === 0 ? ' is-active' : '');
        dots.appendChild(dot);
      });
      wrap.parentNode.insertBefore(dots, wrap.nextSibling);

      const updateState = () => {
        const sl = track.scrollLeft;
        const max = track.scrollWidth - track.clientWidth;
        if (sl > 8) wrap.classList.add('is-scrolled');
        else wrap.classList.remove('is-scrolled');
        if (sl >= max - 8) wrap.classList.add('is-at-end');
        else wrap.classList.remove('is-at-end');

        // Determine active card (the one whose center is closest to track center)
        const trackRect = track.getBoundingClientRect();
        const trackCenter = trackRect.left + trackRect.width / 2;
        let bestIdx = 0, bestDist = Infinity;
        cards.forEach((c, i) => {
          const cr = c.getBoundingClientRect();
          const dist = Math.abs((cr.left + cr.width / 2) - trackCenter);
          if (dist < bestDist) { bestDist = dist; bestIdx = i; }
        });
        Array.from(dots.children).forEach((d, i) => {
          d.classList.toggle('is-active', i === bestIdx);
        });
      };

      track.addEventListener('scroll', updateState, { passive: true });
      window.addEventListener('resize', updateState);
      updateState();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initStickyStack();
    initDragScroll();
    initScrollAffordances();
    initTeam();
    initVideoTilt();
    initHeroParallax();
    initHoverLift();
  });
})();
