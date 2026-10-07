'use strict';
/* Hero selection modal. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  // ===================================================
  // HERO SELECTION MODAL SYSTEM (Soldier & Wizard)
  // ===================================================

  openHeroSelectionModal(mode) {
    this.heroSelectionTargetMode = mode || 'practice';
    const modal = document.getElementById('hero-selection-modal');
    if (!modal) {
      if (mode === 'campaign') this.startCampaign();
      else this.startPractice();
      return;
    }

    const titleEl = document.getElementById('hero-modal-title');
    const subEl = document.getElementById('hero-modal-subtitle');
    if (titleEl) titleEl.textContent = 'SELECCIONA TU HÉROE';
    if (subEl) {
      subEl.textContent = mode === 'campaign'
        ? 'Modo Campaña — Capítulo 1: La niebla del norte'
        : 'Modo Práctica — Campo de Entrenamiento';
    }

    // Nobody is selected yet: both portraits show their calm pose
    this.selectHeroInModal(null);
    this.setBookPage(1, true);

    modal.classList.add('active');

    // Book intro: closed book -> cover swings open -> both hero pages are shown
    const box = modal.querySelector('.hero-selection-modal-box');
    if (box) {
      clearTimeout(this._bookTimer);
      box.classList.remove('book-opening');
      void box.offsetWidth;
      box.classList.add('book-opening');
      (this._bookSounds || []).forEach(clearTimeout);
      this._bookSounds = [
        setTimeout(() => { sfx.init(); sfx.fx('book_clasp', 0.9); }, 1300),
        setTimeout(() => sfx.fx('book_open', 0.9), 1540),
        setTimeout(() => sfx.fx('page_flip', 0.9), 2620)
      ];
      this._bookTimer = setTimeout(() => box.classList.remove('book-opening'), 4600);
      this.spawnBookParticles(box);
    }
  },

  selectHeroInModal(hero) {
    this.selectedHero = hero;
    const btnConfirm = document.getElementById('btn-hero-confirm');
    if (btnConfirm) {
      btnConfirm.disabled = !hero;
      btnConfirm.classList.toggle('is-disabled', !hero);
    }
    // Replay the "chosen" animation on the card that was just picked
    ['soldier', 'wizard', 'swordsman'].forEach(h => {
      const c = document.getElementById('hero-card-' + h);
      if (c) { c.classList.toggle('active', h === hero); c.setAttribute('aria-pressed', h === hero ? 'true' : 'false'); }
    });
    ['soldier', 'wizard', 'swordsman'].forEach(h => {
      const card = document.getElementById('hero-card-' + h);
      if (!card) return;
      card.classList.remove('just-picked');
      if (h === hero) {
        void card.offsetWidth;
        card.classList.add('just-picked');
      }
    });
    const cardSoldier = document.getElementById('hero-card-soldier');
    const cardWizard = document.getElementById('hero-card-wizard');
    if (cardSoldier) {
      const isSoldier = hero === 'soldier';
      cardSoldier.classList.toggle('active', isSoldier);
      cardSoldier.setAttribute('aria-pressed', isSoldier ? 'true' : 'false');
    }
    if (cardWizard) {
      const isWizard = hero === 'wizard';
      cardWizard.classList.toggle('active', isWizard);
      cardWizard.setAttribute('aria-pressed', isWizard ? 'true' : 'false');
    }
  },

  /**
   * Dust and sparkles for the book intro. Everything is plain DOM + CSS animation;
   * each particle only gets its own position / size / timing through CSS variables.
   */
  spawnBookParticles(box) {
    const layer = box.querySelector('.hero-book-fx');
    if (!layer) return;
    layer.innerHTML = '';
    const rnd = (a, b) => a + Math.random() * (b - a);
    const add = (cls, vars) => {
      const el = document.createElement('i');
      el.className = cls;
      Object.keys(vars).forEach(k => el.style.setProperty(k, vars[k]));
      layer.appendChild(el);
    };
    // motes drifting in the light while the book is presented
    for (let i = 0; i < 30; i++) {
      add('bk-mote', {
        '--x': rnd(18, 82).toFixed(1) + '%', '--y': rnd(-12, 96).toFixed(1) + '%', '--s': rnd(2, 4).toFixed(1) + 'px',
        '--dx': rnd(-26, 26).toFixed(0) + 'px', '--dy': rnd(-46, -12).toFixed(0) + 'px',
        '--d': rnd(2.4, 4.2).toFixed(2) + 's', '--delay': rnd(0, 1.6).toFixed(2) + 's', '--o': rnd(0.35, 0.85).toFixed(2)
      });
    }
    // puff of dust when the cover lifts (from the fore edge of the closed book)
    for (let i = 0; i < 16; i++) {
      add('bk-dust', {
        '--x': rnd(46, 74).toFixed(1) + '%', '--y': rnd(8, 92).toFixed(1) + '%', '--s': rnd(5, 12).toFixed(0) + 'px',
        '--dx': rnd(10, 90).toFixed(0) + 'px', '--dy': rnd(-40, 24).toFixed(0) + 'px',
        '--d': rnd(0.8, 1.4).toFixed(2) + 's', '--delay': (1.62 + rnd(0, 0.35)).toFixed(2) + 's'
      });
    }
    // golden sparkles once both heroes are on the page
    for (let i = 0; i < 18; i++) {
      const side = Math.random();
      add('bk-spark', {
        '--x': (side < 0.5 ? rnd(-3, 12) : rnd(88, 103)).toFixed(1) + '%', '--y': rnd(-4, 100).toFixed(1) + '%', '--s': rnd(5, 10).toFixed(0) + 'px',
        '--dy': rnd(-34, -10).toFixed(0) + 'px', '--d': rnd(0.7, 1.3).toFixed(2) + 's', '--delay': (3.85 + rnd(0, 0.55)).toFixed(2) + 's'
      });
    }
    clearTimeout(this._bookFxTimer);
    this._bookFxTimer = setTimeout(() => { layer.innerHTML = ''; }, 6200);
  },

  /**
   * Turn the book to a page (1: Lancent + Horos, 2: Aby + the locked hero).
   * A loose sheet swings over the spine and the heroes change when it stands upright.
   */
  setBookPage(page, instant) {
    const grid = document.querySelector('.hero-selection-grid');
    if (!grid) return;
    const cur = parseInt(grid.dataset.page || '1', 10);
    const apply = () => {
      grid.dataset.page = String(page);
      const num = document.getElementById('book-page-num');
      if (num) num.textContent = page + ' / 2';
      // a hero on a page that is no longer open cannot stay selected
      const card = this.selectedHero && document.getElementById('hero-card-' + this.selectedHero);
      if (card && !card.classList.contains('book-p' + page)) this.selectHeroInModal(null);
    };
    if (instant || cur === page || this._bookTurning) { if (!this._bookTurning) apply(); return; }
    this._bookTurning = true;
    const cls = page > cur ? 'turning-next' : 'turning-prev';
    grid.classList.add(cls);
    sfx.init(); sfx.fx('page_flip', 0.9);
    setTimeout(apply, 290);
    setTimeout(() => { grid.classList.remove(cls); this._bookTurning = false; }, 600);
  },

  confirmHeroSelection() {
    const modal = document.getElementById('hero-selection-modal');
    const hero = this.selectedHero || 'soldier';
    const box = modal && modal.querySelector('.hero-selection-modal-box');
    const card = document.getElementById('hero-card-' + hero);

    // Exit: the camera dives into the chosen hero's page, then the game starts behind a fade
    if (box && card && !this._bookLeaving) {
      this._bookLeaving = true;
      const b = box.getBoundingClientRect(), c = card.getBoundingClientRect();
      const zoom = parseFloat(getComputedStyle(box).zoom) || 1;
      box.style.transformOrigin = ((c.left + c.width / 2 - b.left) / zoom) + 'px ' + ((c.top + c.height * 0.36 - b.top) / zoom) + 'px';
      box.classList.remove('book-opening');
      box.classList.add('book-leaving');
      modal.classList.add('book-leaving-overlay');
      sfx.fx('book_enter', 0.9);
      setTimeout(() => {
        const veil = document.createElement('div');
        veil.className = 'book-veil';
        (document.getElementById('game-wrapper') || document.body).appendChild(veil);
        setTimeout(() => veil.remove(), 900);
        box.classList.remove('book-leaving');
        modal.classList.remove('book-leaving-overlay');
        box.style.transformOrigin = '';
        this._bookLeaving = false;
        this.finishHeroSelection(hero);
      }, 760);
      return;
    }
    this.finishHeroSelection(hero);
  },

  finishHeroSelection(hero) {
    const modal = document.getElementById('hero-selection-modal');
    if (modal) modal.classList.remove('active');
    this.playerHero = hero;

    if (this.heroSelectionTargetMode === 'campaign') {
      this.startCampaign();
    } else {
      this.startPractice();
    }
  },

  closeHeroSelectionModal() {
    (this._bookSounds || []).forEach(clearTimeout);
    const modal = document.getElementById('hero-selection-modal');
    if (modal) modal.classList.remove('active');
  },

  setupHeroSelectionModalListeners() {
    const cardSoldier = document.getElementById('hero-card-soldier');
    const cardWizard = document.getElementById('hero-card-wizard');
    const btnConfirm = document.getElementById('btn-hero-confirm');
    const btnCancel = document.getElementById('btn-hero-cancel');

    if (cardSoldier) {
      cardSoldier.onclick = () => {
        sfx.init();
        if (this.selectedHero !== 'soldier') sfx.playKnightGrunt();
        this.selectHeroInModal('soldier');
      };
    }
    if (cardWizard) {
      cardWizard.onclick = () => {
        sfx.init();
        if (this.selectedHero !== 'wizard') sfx.playWizardLaugh();
        this.selectHeroInModal('wizard');
      };
    }
    const cardAby = document.getElementById('hero-card-swordsman');
    if (cardAby) {
      cardAby.onclick = () => {
        sfx.init();
        if (this.selectedHero !== 'swordsman') sfx.fx('sword_swing1', 0.8, { rate: 1.3 });
        this.selectHeroInModal('swordsman');
      };
    }
    const cardLocked = document.getElementById('hero-card-locked');
    if (cardLocked) {
      cardLocked.onclick = () => {
        sfx.init(); sfx.fx('book_clasp', 0.7, { rate: 1.4 });
        cardLocked.classList.remove('shake'); void cardLocked.offsetWidth; cardLocked.classList.add('shake');
      };
    }
    const btnNext = document.getElementById('btn-book-next'), btnPrev = document.getElementById('btn-book-prev');
    if (btnNext) btnNext.onclick = () => this.setBookPage(2);
    if (btnPrev) btnPrev.onclick = () => this.setBookPage(1);
    if (btnConfirm) {
      btnConfirm.onclick = () => {
        if (!this.selectedHero || this._bookLeaving) return;
        sfx.init();
        this.confirmHeroSelection();
      };
    }
    if (btnCancel) {
      btnCancel.onclick = () => {
        sfx.init();
        this.closeHeroSelectionModal();
      };
    }
  }
});
