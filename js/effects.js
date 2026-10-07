/* ==========================================================================
   effects.js — Neon Orb Canvas (with Mouse Repulsion) + Cursor Glow
   Portfolio: Martin Nguyen
   ==========================================================================
   CHANGES FROM v1:
   - Dots → Neon orbs (pink, blue, white, green) with canvas glow (shadowBlur)
   - Each orb has a base drift velocity it returns to after repulsion
   - Mouse repulsion: orbs gently scatter when cursor enters ~130 px radius
   - Cursor glow opacity reduced significantly (much more subtle)
   ========================================================================== */

(function () {
  'use strict';

  function lerp(a, b, t) { return a + (b - a) * t; }


  /* ==================================================================
     1. NEON ORB CANVAS — with mouse repulsion physics
  ================================================================== */

  function initCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'bg-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext('2d');

    /* ---- Neon colour palette ---- */
    /* EDIT: add/remove entries to change the colour mix            */
    const NEON_COLORS = [
      { r: 255, g:  20, b: 240 },   /* Neon pink                  */
      { r:   0, g: 200, b: 255 },   /* Cyan blue                  */
      { r: 127, g: 255, b:   0 },   /* Chartreuse green (accent)  */
      { r: 220, g: 220, b: 255 },   /* Near-white / cool white    */
      { r:  57, g: 255, b:  20 },   /* Neon lime                  */
      { r:   0, g: 130, b: 255 },   /* Cobalt blue                */
      { r: 255, g:  80, b: 180 },   /* Hot pink                   */
    ];

    /* ---- Physics constants ---- */
    const ORB_COUNT      = 85;   /* Total number of orbs                   */
    const REPEL_RADIUS   = 130;  /* px — how close mouse must be to repel  */
    const REPEL_STRENGTH = 0.9;  /* Repulsion force multiplier             */
    const MAX_SPEED      = 2.2;  /* Max px/frame after repulsion           */
    const DAMPING        = 0.95; /* Velocity decay per frame               */
    const BASE_SPEED     = 0.28; /* Gentle drift speed at rest             */
    const RETURN_LERP    = 0.018;/* How quickly orbs return to base vel    */

    /* ---- Shared mouse position (updated by mousemove) ---- */
    let mouseX = -9999;
    let mouseY = -9999;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    window.addEventListener('mouseleave', function () {
      mouseX = -9999;
      mouseY = -9999;
    });

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* ---- Orb factory ---- */
    function createOrb() {
      const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
      /* Each orb remembers its 'rest' velocity to drift back toward */
      const bvx = (Math.random() - 0.5) * BASE_SPEED * 2;
      const bvy = (Math.random() - 0.5) * BASE_SPEED * 2;
      return {
        x:     Math.random() * canvas.width,
        y:     Math.random() * canvas.height,
        r:     1.2 + Math.random() * 2.6,        /* Radius 1–4 px        */
        vx:    bvx,
        vy:    bvy,
        bvx:   bvx,                               /* Base velocity X      */
        bvy:   bvy,                               /* Base velocity Y      */
        phase: Math.random() * Math.PI * 2,       /* Pulse offset         */
        freq:  0.003 + Math.random() * 0.007,     /* Pulse frequency      */
        color: color,
      };
    }

    const orbs = Array.from({ length: ORB_COUNT }, createOrb);
    let frame = 0;

    /* ---- Easter Egg: Orb Collector State ---- */
    let collectedCount = 0;
    const COLLECT_GOAL = 10;
    let easterEggDone = false;
    let counterFadeTimeout = null;
    const targetEl       = document.getElementById('easter-egg-target');
    const counterEl      = document.getElementById('easter-egg-counter');
    const rewardBtn      = document.getElementById('secret-reward-btn');
    const polySvg        = targetEl ? targetEl.querySelector('.polyhedron-svg') : null;

    /* Keep-away zone: orbs gently steer away from the target when idling,
       but repulsion is light so pushing them in is smooth and responsive */
    const TARGET_REPEL_RADIUS   = 50;   /* px — compact keep-away radius            */
    const TARGET_REPEL_STRENGTH = 0.18; /* Gentle, subtle push outward               */
    const MOUSE_OVERRIDE_DIST   = 200;  /* Ample radius to disable keep-away when
                                           the user brings the mouse to guide orbs   */

    function showCounter() {
      if (!counterEl || easterEggDone) return;
      counterEl.classList.add('visible');
      if (counterFadeTimeout) clearTimeout(counterFadeTimeout);
      counterFadeTimeout = setTimeout(function () {
        counterEl.classList.remove('visible');
      }, 3000);
    }

    if (targetEl) {
      targetEl.addEventListener('mouseenter', function () {
        if (collectedCount > 0 && !easterEggDone) {
          showCounter();
        }
      });
    }

    /* Get the target's bounding box in client coords for collision */
    function getTargetBounds() {
      if (!polySvg) return null;
      var r = polySvg.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: r.width / 2 + 10 };
    }

    function pulseTarget() {
      if (!polySvg) return;
      polySvg.classList.remove('pulse-feedback');
      void polySvg.offsetWidth; /* force reflow to restart animation */
      polySvg.classList.add('pulse-feedback');
      polySvg.addEventListener('animationend', function handler() {
        polySvg.classList.remove('pulse-feedback');
        polySvg.removeEventListener('animationend', handler);
      });
    }

    function collectOrb(orb) {
      if (easterEggDone) return;
      collectedCount++;
      if (counterEl) {
        counterEl.textContent = collectedCount + '/' + COLLECT_GOAL;
        showCounter();
      }
      pulseTarget();

      /* Respawn the orb far away so it isn't collected again immediately */
      orb.x = Math.random() * canvas.width;
      orb.y = canvas.height + 100 + Math.random() * 200;

      if (collectedCount >= COLLECT_GOAL) {
        easterEggDone = true;
        if (counterFadeTimeout) clearTimeout(counterFadeTimeout);
        if (counterEl) {
          counterEl.style.display = 'none';
        }
        if (rewardBtn) {
          rewardBtn.classList.remove('hidden');
          rewardBtn.classList.add('show');
        }
      }
    }

    /* ---- Animation loop ---- */
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      /* Get target bounds once per frame for collision + repulsion */
      var tb = getTargetBounds();

      /* Is the mouse close enough to the target to override keep-away? */
      var mouseNearTarget = false;
      if (tb) {
        var mDx = mouseX - tb.cx;
        var mDy = mouseY - tb.cy;
        mouseNearTarget = Math.sqrt(mDx * mDx + mDy * mDy) < MOUSE_OVERRIDE_DIST;
      }

      for (var i = 0; i < orbs.length; i++) {
        var orb = orbs[i];

        /* -- Repulsion from mouse -- */
        var dx   = orb.x - mouseX;
        var dy   = orb.y - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPEL_RADIUS && dist > 0.5) {
          var force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
          orb.vx += (dx / dist) * force;
          orb.vy += (dy / dist) * force;
        } else {
          orb.vx = lerp(orb.vx, orb.bvx, RETURN_LERP);
          orb.vy = lerp(orb.vy, orb.bvy, RETURN_LERP);
        }

        /* -- Keep-away: repel orbs from the target zone unless mouse overrides -- */
        if (tb && !mouseNearTarget) {
          var tDx = orb.x - tb.cx;
          var tDy = orb.y - tb.cy;
          var tDist = Math.sqrt(tDx * tDx + tDy * tDy);
          if (tDist < TARGET_REPEL_RADIUS && tDist > 0.5) {
            var tForce = ((TARGET_REPEL_RADIUS - tDist) / TARGET_REPEL_RADIUS) * TARGET_REPEL_STRENGTH;
            orb.vx += (tDx / tDist) * tForce;
            orb.vy += (tDy / tDist) * tForce;
          }
        }

        /* -- Dampen -- */
        orb.vx *= DAMPING;
        orb.vy *= DAMPING;

        /* -- Clamp speed -- */
        var speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
        if (speed > MAX_SPEED) {
          orb.vx = (orb.vx / speed) * MAX_SPEED;
          orb.vy = (orb.vy / speed) * MAX_SPEED;
        }

        /* -- Move -- */
        orb.x += orb.vx;
        orb.y += orb.vy;

        /* -- Wrap edges -- */
        if (orb.x < -orb.r)                orb.x = canvas.width  + orb.r;
        if (orb.x > canvas.width  + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r)                orb.y = canvas.height + orb.r;
        if (orb.y > canvas.height + orb.r) orb.y = -orb.r;

        /* -- Easter Egg: Check collision with target -- */
        if (tb && !easterEggDone && mouseNearTarget) {
          var cdx = orb.x - tb.cx;
          var cdy = orb.y - tb.cy;
          var cDist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cDist < tb.radius) {
            collectOrb(orb);
          }
        }

        /* -- Pulsing opacity -- */
        var pulse = 0.3 + 0.7 * Math.abs(Math.sin(frame * orb.freq + orb.phase));
        var alpha = 0.55 * pulse;
        var cr = orb.color.r, cg = orb.color.g, cb = orb.color.b;

        /* -- Draw with neon glow (shadowBlur) -- */
        ctx.save();
        ctx.shadowBlur  = orb.r * 7;
        ctx.shadowColor = 'rgba(' + cr + ',' + cg + ',' + cb + ',0.75)';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + alpha + ')';
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(draw);
    }

    draw();
  }


  /* ==================================================================
     2. CURSOR GLOW — much more subtle than v1
        Opacity and spread both significantly reduced.
  ================================================================== */

  function initCursorGlow() {
    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    let targetX  = window.innerWidth  / 2;
    let targetY  = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    document.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      glow.classList.remove('hidden');
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      glow.classList.add('hidden');
    });
    document.addEventListener('mouseenter', function () {
      glow.classList.remove('hidden');
    });

    const LERP_FACTOR = 0.08; /* Slower lerp = silkier tail */

    function animateGlow() {
      currentX = lerp(currentX, targetX, LERP_FACTOR);
      currentY = lerp(currentY, targetY, LERP_FACTOR);
      glow.style.transform = `translate(${currentX}px, ${currentY}px)`;
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  }


  /* ==================================================================
     3. NAVBAR SCROLL
  ================================================================== */

  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    function onScroll() {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }


  /* ==================================================================
     4. MOBILE HAMBURGER
  ================================================================== */

  function initMobileMenu() {
    const hamburger  = document.querySelector('.navbar__hamburger');
    const mobileMenu = document.querySelector('.navbar__mobile-menu');
    if (!hamburger || !mobileMenu) return;

    function toggleMenu() {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      hamburger.setAttribute('aria-expanded', isOpen);
    }
    hamburger.addEventListener('click', toggleMenu);
    mobileMenu.querySelectorAll('.navbar__link').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }


  /* ==================================================================
     5. SCROLL FADE-IN (IntersectionObserver)
  ================================================================== */

  function initScrollFade() {
    const targets = document.querySelectorAll('.fade-in-up');
    if (!targets.length) return;
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { observer.observe(el); });
  }


  /* ==================================================================
     INIT
  ================================================================== */

  document.addEventListener('DOMContentLoaded', function () {
    initCanvas();
    initCursorGlow();
    initNavbarScroll();
    initMobileMenu();
    initScrollFade();
  });

}());
