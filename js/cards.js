/* ==========================================================================
   cards.js — Tab Switching, Card Stagger, Modal System, Tilt
   Portfolio: Martin Nguyen
   ==========================================================================
   CHANGES FROM v1:
   - Cards now open a full modal on click instead of navigating directly
   - Modal shows: title, tag, description, YouTube embed, "Watch on YouTube"
   - If a card has no data-youtube, it falls back to opening data-link in new tab
   - Card tilt preserved
   ========================================================================== */

(function () {
  'use strict';


  /* ==================================================================
     1. TAB SWITCHING & CARD REVEAL (unchanged from v1)
  ================================================================== */

  function initTabs() {
    const tabBtns   = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    if (!tabBtns.length) return;

    function revealCards(panel) {
      const cards = panel.querySelectorAll('.card-stagger');
      cards.forEach(function (card) {
        card.classList.add('no-transition');
        card.classList.remove('is-visible');
      });
      void panel.offsetWidth;
      cards.forEach(function (card, i) {
        card.classList.remove('no-transition');
        card.style.setProperty('--stagger', i);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            card.classList.add('is-visible');
          });
        });
      });
    }

    function activateTab(targetId, animate) {
      tabBtns.forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.tab === targetId);
        btn.setAttribute('aria-selected', btn.dataset.tab === targetId ? 'true' : 'false');
      });
      tabPanels.forEach(function (panel) {
        const isTarget = panel.dataset.panel === targetId;
        panel.classList.toggle('active', isTarget);
        if (isTarget && animate) {
          revealCards(panel);
        } else if (isTarget && !animate) {
          panel.querySelectorAll('.card-stagger').forEach(function (card) {
            card.classList.add('no-transition', 'is-visible');
            requestAnimationFrame(function () { card.classList.remove('no-transition'); });
          });
        }
      });
    }

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { activateTab(btn.dataset.tab, true); });
    });

    const defaultBtn = document.querySelector('.tab-btn.active');
    if (defaultBtn) activateTab(defaultBtn.dataset.tab, false);

    window.portfolioActivateTab = activateTab;
  }


  /* ==================================================================
     2. HERO CTA BUTTON
  ================================================================== */

  function initCtaButton() {
    const ctaBtn = document.querySelector('.btn-cta[data-scroll-to]');
    if (!ctaBtn) return;
    ctaBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(ctaBtn.getAttribute('data-scroll-to'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () {
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab && window.portfolioActivateTab) {
          window.portfolioActivateTab(activeTab.dataset.tab, true);
        }
      }, 350);
    });
  }


  /* ==================================================================
     3. MODAL SYSTEM
     ==================================================================
     Opens when a card is clicked.
     Card data attributes:
       data-modal-title         — heading shown in modal
       data-modal-tag           — category label badge
       data-modal-date          — year / date badge
       data-modal-role          — role in the spec table
       data-modal-platform      — platform in the spec table
       data-modal-overview      — paragraph in OVERVIEW section
       data-modal-contributions — pipe-separated (|) list of contributions
       data-youtube             — YouTube video ID (opens in new tab)
       data-ext-link            — external URL (Itch.io, Figma, etc.)
       data-ext-label           — button label for external link
       data-modal-thumb         — image URL for media preview
  ================================================================== */

  /* ---- Cached DOM references ---- */
  let modal          = null;
  let modalBox       = null;
  let mTitle         = null;
  let mTag           = null;
  let mDiscipline    = null;
  let mTeam          = null;
  let mDate          = null;
  let mRole          = null;
  let mPlatform      = null;
  let mOverview      = null;
  let mContributions = null;
  let mVideoWrap     = null;
  let mIframe        = null;
  let mMediaImg      = null;
  let mYtLink        = null;
  let mExtLink       = null;
  let mExtText       = null;
  let mClose         = null;
  let mDuration      = null;
  let mPrograms      = null;
  let mContribTitle  = null;

  function cacheModalRefs() {
    modal          = document.getElementById('card-modal');
    modalBox       = document.getElementById('modal-box');
    mTitle         = document.getElementById('modal-title');
    mTag           = document.getElementById('modal-tag');
    mDiscipline    = document.getElementById('modal-discipline');
    mTeam          = document.getElementById('modal-team');
    mDate          = document.getElementById('modal-date');
    mRole          = document.getElementById('modal-role');
    mPlatform      = document.getElementById('modal-platform');
    mOverview      = document.getElementById('modal-overview');
    mContributions = document.getElementById('modal-contributions');
    mContribTitle  = document.getElementById('modal-contributions-title');
    mVideoWrap     = document.getElementById('modal-video-wrap');
    mIframe        = document.getElementById('modal-iframe');
    mMediaImg      = document.getElementById('modal-media-img');
    mYtLink        = document.getElementById('modal-yt-link');
    mExtLink       = document.getElementById('modal-ext-link');
    mExtText       = document.getElementById('modal-ext-text');
    mClose         = document.getElementById('modal-close');
    mDuration      = document.getElementById('modal-duration');
    mPrograms      = document.getElementById('modal-programs');
  }

  /**
   * openModal - populate and show the modal with structured data from card.
   * @param {HTMLElement} card
   */
  function openModal(card) {
    if (!modal) return;

    const title        = card.dataset.modalTitle || card.querySelector('.card__title')?.textContent || 'Project Details';
    const tag          = card.dataset.modalTag || card.querySelector('.card__tag')?.textContent || '';
    const rawDate      = card.dataset.modalDate || card.querySelector('.card__date')?.textContent || '';
    const date         = rawDate.replace(/[\[\]]/g, '').replace(/^Date:\s*/i, '');
    const role         = card.dataset.modalRole || 'Game Designer & UI/UX';
    const platform     = card.dataset.modalPlatform || 'PC';
    const team         = card.dataset.modalTeam || '';
    const overview     = card.dataset.modalOverview || card.dataset.modalDesc || card.querySelector('.card__desc')?.textContent || '';
    const contribStr   = card.dataset.modalContributions || '';
    const duration     = card.dataset.modalDuration || '';
    const programs     = card.dataset.modalPrograms || '';
    const ytId         = card.dataset.youtube || '';
    const extUrl       = card.dataset.extLink || card.dataset.link || '';
    const extLabel     = card.dataset.extLabel || 'View Project ↗';

    /* Populate header text */
    if (mTitle) mTitle.textContent = title;
    if (mTag) {
      mTag.textContent = tag;
      mTag.style.display = tag ? 'inline-block' : 'none';
    }
    if (mDate) {
      mDate.textContent = date;
      mDate.style.display = date ? 'inline-block' : 'none';
    }

    /* Populate spec rows: ROLE, PLATFORM, GENRE, TEAM SIZE */
    if (mRole) mRole.textContent = role;
    if (mPlatform) mPlatform.textContent = platform;
    if (mDiscipline) mDiscipline.textContent = tag;
    if (mTeam) mTeam.textContent = team;
    if (mDuration) {
      mDuration.textContent = duration;
      mDuration.closest('.modal-spec-row').style.display = duration ? 'flex' : 'none';
    }
    if (mPrograms) {
      mPrograms.textContent = programs;
      mPrograms.closest('.modal-spec-row').style.display = programs ? 'flex' : 'none';
    }

    /* Populate OVERVIEW */
    if (mOverview) mOverview.textContent = overview;

    /* Dynamic section header: EXPERIENCE for skills, KEY CONTRIBUTIONS for projects */
    const isSkillCard = card.closest('#panel-skillset') !== null ||
                        (card.querySelector('.card__date')?.textContent || '').toLowerCase().includes('skill') ||
                        (card.dataset.modalTag || '').toLowerCase().includes('skill');
    if (mContribTitle) {
      mContribTitle.textContent = isSkillCard ? 'EXPERIENCE' : 'KEY CONTRIBUTIONS';
    }

    /* Populate KEY CONTRIBUTIONS / EXPERIENCE list — highlight program names */
    if (mContributions) {
      mContributions.innerHTML = '';
      const items = contribStr ? contribStr.split('|') : [];
      /* Build a list of program names to highlight from the programs data */
      const programNames = programs ? programs.split(',').map(function(p) { return p.trim(); }).filter(Boolean) : [];
      if (items.length > 0) {
        items.forEach(function (text) {
          const trimmed = text.trim();
          if (!trimmed) return;
          const li = document.createElement('li');
          /* Highlight program names with a glimmer span */
          let html = trimmed;
          programNames.forEach(function (prog) {
            if (prog) {
              var regex = new RegExp('(' + prog.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + ')', 'gi');
              html = html.replace(regex, '<span class="program-highlight">$1</span>');
            }
          });
          li.innerHTML = html;
          mContributions.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.textContent = 'Designed game systems, mechanics, and interactive user interfaces.';
        mContributions.appendChild(li);
      }
    }

    /* Handle Video / Media: Fully functional YouTube iframe embed (click to play, no autoplay) */
    if (ytId && ytId !== '') {
      if (mIframe) {
        mIframe.src = 'https://www.youtube-nocookie.com/embed/' + ytId + '?autoplay=0&rel=0&modestbranding=1';
        mIframe.style.display = 'block';
      }
      if (mMediaImg) {
        mMediaImg.style.display = 'none';
      }
      if (mYtLink) {
        mYtLink.href = 'https://www.youtube.com/watch?v=' + ytId;
        mYtLink.style.display = 'inline-flex';
      }
    } else {
      if (mIframe) {
        mIframe.src = '';
        mIframe.style.display = 'none';
      }
      if (mYtLink) {
        mYtLink.style.display = 'none';
      }
      /* Fallback graphic image for projects without YouTube videos */
      if (mMediaImg) {
        let thumbSrc = card.dataset.modalThumb;
        if (!thumbSrc) {
          const cardImg = card.querySelector('.card__thumb-img');
          if (cardImg) thumbSrc = cardImg.getAttribute('src');
        }
        if (thumbSrc) {
          mMediaImg.src = thumbSrc;
          mMediaImg.alt = title;
          mMediaImg.style.display = 'block';
        } else {
          mMediaImg.style.display = 'none';
        }
      }
    }

    /* Handle external link button (Itch.io, Figma, Sketchfab, MuseScore, Thales, etc.) */
    /* If extUrl is just a redundant link to YouTube when ytId is already present, suppress duplicate button */
    if (mExtLink) {
      const isRedundantYt = ytId && extUrl && (
        extUrl.includes('youtube.com') ||
        extUrl.includes('youtu.be') ||
        (extLabel && extLabel.toLowerCase().includes('youtube'))
      );
      if (extUrl && extUrl !== '#' && extUrl !== '' && !isRedundantYt) {
        mExtLink.href = extUrl;
        if (mExtText) {
          mExtText.textContent = extLabel;
        } else {
          mExtLink.textContent = extLabel;
        }
        mExtLink.style.display = 'inline-flex';
      } else {
        mExtLink.style.display = 'none';
      }
    }

    /* Show modal */
    modal.classList.add('open');
    document.body.style.overflow = 'hidden'; /* Lock scroll */

    /* Focus the close button for keyboard users */
    requestAnimationFrame(function () {
      if (mClose) mClose.focus();
    });
  }

  /**
   * closeModal — hide the modal and stop video playback
   */
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    /* Clear iframe src after fade-out to stop audio from playing in background */
    if (mIframe) {
      setTimeout(function () {
        mIframe.src = '';
      }, 250);
    }
  }

  function initModal() {
    cacheModalRefs();
    if (!modal) return;

    /* Close on × button */
    if (mClose) mClose.addEventListener('click', closeModal);

    /* Close on overlay click (clicking outside the box) */
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    /* Close on ESC key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }


  /* ==================================================================
     4. CARD CLICK → MODAL (replaces old direct-link behaviour)
  ================================================================== */

  function initCardClicks() {
    document.querySelectorAll('.card').forEach(function (card) {
      /* Keyboard accessibility */
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');

      function handleActivate() {
        const ytId    = card.dataset.youtube;
        const hasDesc = card.dataset.modalTitle;

        if (ytId || hasDesc) {
          /* Open modal */
          openModal(card);
        } else {
          /* Fallback: open the data-link in a new tab */
          const url = card.dataset.link;
          if (url && url !== '#') {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }
      }

      card.addEventListener('click', handleActivate);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate();
        }
      });
    });
  }


  /* ==================================================================
     5. MOUSE-TRACKING CARD TILT (preserved from v1)
  ================================================================== */

  function initCardTilt() {
    const MAX_TILT = 6;
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect  = card.getBoundingClientRect();
        const normX = (e.clientX - rect.left)  / rect.width  - 0.5;
        const normY = (e.clientY - rect.top)   / rect.height - 0.5;
        const tiltX = normY * MAX_TILT * -1;
        const tiltY = normX * MAX_TILT;
        card.style.transform =
          `translateY(-4px) scale(1.01) perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }


  /* ==================================================================
     INIT
  ================================================================== */

  document.addEventListener('DOMContentLoaded', function () {
    initTabs();
    initCtaButton();
    initModal();
    initCardClicks();
    initCardTilt();
  });

}());
