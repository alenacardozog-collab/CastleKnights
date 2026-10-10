'use strict';
/* HUD and DOM interface: floating texts, hearts/stamina, game over, fullscreen, options and the bindings of the page buttons. (methods of MainGameScene) */

Object.assign(MainGameScene.prototype, {
  /**
   * Floating damage & combat popups
   */
  createFloatingText(x, y, message, color = 0xffffff) {
    const txt = this.add.text(x, y, message, {
      fontFamily: 'Pixuf, MedievalSharp, monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      fill: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(30000); // above houses/trees (they use depth = world y)

    this.tweens.add({
      targets: txt,
      y: y - 32,
      alpha: 0,
      duration: 650,
      ease: 'Power1',
      onComplete: () => txt.destroy()
    });
  },

  /**
   * Update the DOM HUD (Hero Portrait, Ornate Frame, Health Bar, Pixel Hearts, Mana, Stats)
   */
  updateHUD() {
    // 1. Update Player Card: Portrait, Frame, Name
    const portraitImg = document.getElementById('hud-portrait-img');
    const portraitFrame = document.getElementById('hud-portrait-frame');
    const heroName = document.getElementById('hud-hero-name');
    if (portraitImg) {
      portraitImg.src = (HEROES[this.playerHero] || HEROES.soldier).portrait;
    }
    if (portraitFrame) {
      portraitFrame.src = (HEROES[this.playerHero] || HEROES.soldier).frame;
    }
    if (heroName) {
      heroName.textContent = (HEROES[this.playerHero] || HEROES.soldier).name;
    }

    // 2. Health Bar Fill & Pixel Hearts
    const hpFill = document.getElementById('hud-hp-fill');
    if (hpFill) {
      const pct = Math.max(0, Math.min(100, (this.health / this.maxHealth) * 100));
      hpFill.style.width = `${pct}%`;
    }

    // one heart icon per point of maximum health (it grows with levels and rewards)
    const heartsRow = document.querySelector('.hud-hearts-row');
    if (heartsRow) {
      for (let i = heartsRow.children.length + 1; i <= this.maxHealth; i++) {
        const img = document.createElement('img');
        img.id = `hud-heart-${i}`; img.className = 'hud-pixel-heart'; img.alt = 'Vida ' + i;
        heartsRow.appendChild(img);
      }
      Array.from(heartsRow.children).forEach((el, i) => { el.style.display = i < this.maxHealth ? '' : 'none'; });
    }
    for (let i = 1; i <= this.maxHealth; i++) {
      const heartImg = document.getElementById(`hud-heart-${i}`);
      if (heartImg) {
        heartImg.src = i <= this.health ? 'assets/UI/icons/heart_full.png' : 'assets/UI/icons/heart_empty.png';
        heartImg.classList.toggle('lost', i > this.health);
      }
    }

    // 3. Stamina / Energy Bar Fill & Styling
    const manaFill = document.getElementById('hud-mana-fill');
    const manaContainer = document.getElementById('hud-mana-container');
    if (manaFill) {
      const staminaPct = Math.max(0, Math.min(100, (this.stamina / this.maxStamina) * 100));
      manaFill.style.width = `${staminaPct}%`;
      if (this.playerHero === 'swordsman') {
        manaFill.style.background = 'linear-gradient(180deg, #fda4af 0%, #f43f5e 50%, #9f1239 100%)';
        manaFill.style.boxShadow = '0 0 6px rgba(244, 63, 94, 0.6)';
        if (manaContainer) manaContainer.title = `Aguante (Espadachina): ${Math.round(this.stamina)}% | Dash: 50%, Danza de filos: 35%`;
      } else if (this.playerHero === 'wizard') {
        manaFill.style.background = 'linear-gradient(180deg, #c084fc 0%, #9333ea 50%, #6b21a8 100%)';
        manaFill.style.boxShadow = '0 0 6px rgba(168, 85, 247, 0.6)';
        if (manaContainer) manaContainer.title = `Energía Arcana: ${Math.round(this.stamina)}% | Dash: 50%`;
      } else {
        manaFill.style.background = 'linear-gradient(180deg, #facc15 0%, #eab308 50%, #ca8a04 100%)';
        manaFill.style.boxShadow = '0 0 6px rgba(234, 179, 8, 0.6)';
        if (manaContainer) manaContainer.title = `Stamina (Guerrero): ${Math.round(this.stamina)}% | Dash: 50%, Giro: 35%`;
      }
    }

    // 4. Update switcher active class
    document.querySelectorAll('.hero-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.hero === this.playerHero);
    });

    // 5. Legacy Candle Souls State (compatibility)
    for (let i = 1; i <= 3; i++) {
      const iconEl = document.getElementById(`heart-${i}`);
      if (!iconEl) continue;
      if (i <= this.health) {
        iconEl.textContent = '🕯️';
        iconEl.classList.remove('lost');
        iconEl.classList.add('full');
      } else {
        iconEl.textContent = '💨'; // Extinguished smoke
        iconEl.classList.remove('full');
        iconEl.classList.add('lost');
      }
    }

    // Stats or peaceful lobby display
    const statsBadge = document.querySelector('.stats-badge');
    let lobbyBadge = document.getElementById('hud-lobby-badge');
    if (this._gameMode === 'campaign') {
      if (statsBadge) statsBadge.style.display = 'none';
      if (!lobbyBadge && statsBadge && statsBadge.parentNode) {
        lobbyBadge = document.createElement('div');
        lobbyBadge.id = 'hud-lobby-badge';
        lobbyBadge.className = 'stats-badge lobby-peace-badge';
        lobbyBadge.innerHTML = '<span><img src="assets/UI/pix/flag.png" class="px-ico" alt=""> CAMPAÑA · CAP. 1</span>';
        statsBadge.parentNode.insertBefore(lobbyBadge, statsBadge.nextSibling);
      }
      if (lobbyBadge) lobbyBadge.style.display = 'flex';
    } else {
      if (statsBadge) statsBadge.style.display = '';
      if (lobbyBadge) lobbyBadge.style.display = 'none';
    }

    const killsEl = document.getElementById('stat-kills');
    const scoreEl = document.getElementById('stat-score');
    if (killsEl) killsEl.textContent = this.kills;
    if (scoreEl) scoreEl.textContent = this.score;
  },

  /**
   * Fast real-time update of stamina bar fill width during regen and consumption
   */
  updateStaminaBar() {
    const manaFill = document.getElementById('hud-mana-fill');
    if (manaFill) {
      const staminaPct = Math.max(0, Math.min(100, (this.stamina / this.maxStamina) * 100));
      manaFill.style.width = `${staminaPct}%`;
    }
  },

  /**
   * Triggers visual warning, audio alert and floating text when stamina is insufficient
   */
  showLowStaminaWarning(skillName = 'Habilidad') {
    const now = this.time.now;
    if (this.lastLowStaminaWarning && now - this.lastLowStaminaWarning < 600) return;
    this.lastLowStaminaWarning = now;

    // Floating text popup above player
    if (this.player && this.player.active) {
      const label = this.playerHero === 'wizard' ? '¡Sin Energía!' : '¡Sin Stamina!';
      this.createFloatingText(this.player.x, this.player.y - 38, label, 0xfacc15);
    }

    // Audio cue
    sfx.playAlert();

    // Visual shake on HUD stamina container
    const container = document.getElementById('hud-mana-container') || document.querySelector('.hud-mana-container');
    if (container) {
      container.classList.remove('stamina-shake');
      void container.offsetWidth; // force CSS reflow
      container.classList.add('stamina-shake');
      setTimeout(() => container.classList.remove('stamina-shake'), 400);
    }
  },

  /**
   * Show Game Over Modal
   */
  showGameOverModal() {
    const elapsedSecs = Math.floor((Date.now() - this.gameStartTime) / 1000);
    document.getElementById('final-kills').textContent = this.kills;
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-time').textContent = `${elapsedSecs}s`;

    const modal = document.getElementById('game-over-modal');
    if (modal) modal.classList.add('active');
  },

  /**
   * Fullscreen toggle support (True full screen display)
   */
  toggleFullscreen() {
    const wrapper = document.getElementById('game-wrapper');
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (wrapper && wrapper.requestFullscreen) {
        wrapper.requestFullscreen().catch(() => { });
      } else if (wrapper && wrapper.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else {
        this.scale.stopFullscreen();
      }
    }
  },

  /**
   * Helper to sync Sound button icons and labels across UI
   */
  syncOptionsAudioUI() {
    const icon = document.getElementById('sound-icon');
    if (icon) icon.innerHTML = sfx.enabled ? '<img src="assets/UI/pix/sound_on.png" class="px-ico" alt="">' : '<img src="assets/UI/pix/sound_off.png" class="px-ico" alt="">';

    const optIcon = document.getElementById('opt-sound-icon');
    if (optIcon) optIcon.innerHTML = sfx.enabled ? '<img src="assets/UI/pix/sound_on.png" class="px-ico px-ico-lg" alt="">' : '<img src="assets/UI/pix/sound_off.png" class="px-ico px-ico-lg" alt="">';

    const optStatus = document.getElementById('opt-sound-status');
    if (optStatus) {
      optStatus.textContent = sfx.enabled ? 'Sonido activado (clic para silenciar)' : 'Sonido silenciado (clic para activar)';
    }

    const optBadge = document.getElementById('opt-sound-badge');
    if (optBadge) {
      optBadge.textContent = sfx.enabled ? 'ON' : 'OFF';
      optBadge.style.color = sfx.enabled ? '#ffd700' : '#e2e8f0';
    }
  },

  /**
   * Wire DOM buttons (Sound, Fullscreen, Restart, Character Switchers, Menus & Modals)
   */
  bindDOMElements() {
    // -------------------------------------------------------------
    // FULLSCREEN ON FIRST INTERACTION
    // -------------------------------------------------------------
    const autoFullscreenHandler = () => {
      this.enterFullscreen();
    };
    window.addEventListener('click', autoFullscreenHandler, { once: true });
    window.addEventListener('keydown', autoFullscreenHandler, { once: true });

    // -------------------------------------------------------------
    // START MENU BUTTONS
    // -------------------------------------------------------------
    const btnPlay = document.getElementById('btn-menu-play');
    if (btnPlay) {
      btnPlay.onclick = () => {
        sfx.init();
        sfx.fx('ui_click', 0.8, { minGap: 150 }) || sfx.playSwing();
        this.openHeroSelectionModal('practice');
      };
    }

    const btnCampaign = document.getElementById('btn-menu-campaign');
    if (btnCampaign) {
      btnCampaign.onclick = () => {
        sfx.init();
        sfx.fx('ui_click', 0.8, { minGap: 150 }) || sfx.playSwing();
        this.openHeroSelectionModal('campaign');
      };
    }

    // Connect Hero Selection Modal buttons & cards
    this.setupHeroSelectionModalListeners();

    const btnMenuEditor = document.getElementById('btn-menu-editor');
    if (btnMenuEditor) {
      btnMenuEditor.onclick = () => {
        sfx.init();
        sfx.fx('ui_click', 0.8, { minGap: 150 }) || sfx.playSwing();
        this.openMapEditor();
      };
    }

    const btnMenuOptions = document.getElementById('btn-menu-options');
    if (btnMenuOptions) {
      btnMenuOptions.onclick = () => {
        sfx.init();
        sfx.fx('ui_click', 0.8, { minGap: 150 }) || sfx.playAlert();
        document.getElementById('options-modal')?.classList.add('active');
        this.syncOptionsAudioUI();
        KeybindsManager.renderUI();
      };
    }

    const btnMenuExit = document.getElementById('btn-menu-exit');
    if (btnMenuExit) {
      btnMenuExit.onclick = () => {
        sfx.init();
        sfx.fx('ui_click', 0.8, { minGap: 150 }) || sfx.playAlert();
        document.getElementById('exit-modal')?.classList.add('active');
      };
    }

    // -------------------------------------------------------------
    // UNIFIED OPTIONS (AUDIO, FULLSCREEN, KEYBINDINGS)
    // -------------------------------------------------------------
    const btnOptAudio = document.getElementById('btn-opt-audio');
    if (btnOptAudio) {
      btnOptAudio.onclick = () => {
        sfx.init();
        sfx.enabled = !sfx.enabled;
        music.setEnabled(sfx.enabled);
        if (sfx.enabled) sfx.playSwing();
        this.syncOptionsAudioUI();
      };
    }

    const btnOptFullscreen = document.getElementById('btn-opt-fullscreen');
    if (btnOptFullscreen) {
      btnOptFullscreen.onclick = () => {
        this.toggleFullscreen();
      };
    }

    const btnCloseOptions = document.getElementById('btn-close-options');
    if (btnCloseOptions) {
      btnCloseOptions.onclick = () => {
        sfx.init();
        sfx.playAlert();
        document.getElementById('options-modal')?.classList.remove('active');
      };
    }

    const btnResetKeybinds = document.getElementById('btn-reset-keybinds');
    if (btnResetKeybinds) {
      btnResetKeybinds.onclick = () => {
        sfx.init();
        sfx.playHit();
        KeybindsManager.reset();
      };
    }

    // -------------------------------------------------------------
    // EXIT CONFIRMATION & FAREWELL MODALS
    // -------------------------------------------------------------
    const btnConfirmExit = document.getElementById('btn-confirm-exit');
    if (btnConfirmExit) {
      btnConfirmExit.onclick = () => {
        sfx.init();
        sfx.playAlert();
        document.getElementById('exit-modal')?.classList.remove('active');
        try { window.close(); } catch (e) { }
        this.returnToStartMenu();
      };
    }

    const btnCancelExit = document.getElementById('btn-cancel-exit');
    if (btnCancelExit) {
      btnCancelExit.onclick = () => {
        sfx.init();
        document.getElementById('exit-modal')?.classList.remove('active');
        this.returnToStartMenu();
      };
    }

    const btnFarewellReturn = document.getElementById('btn-farewell-return');
    if (btnFarewellReturn) {
      btnFarewellReturn.onclick = () => {
        document.getElementById('farewell-modal')?.classList.remove('active');
        this.returnToStartMenu();
      };
    }

    // -------------------------------------------------------------
    // IN-GAME PAUSE MENU & HUD MENU BUTTONS
    // -------------------------------------------------------------
    const triggerMenuModal = () => {
      sfx.init();
      if (!this.gameStarted) {
        document.getElementById('options-modal')?.classList.add('active');
        this.syncOptionsAudioUI();
        KeybindsManager.renderUI();
      } else {
        this.pauseGame();
      }
    };

    const btnHudMenu = document.getElementById('btn-hud-menu-btn');
    if (btnHudMenu) btnHudMenu.onclick = triggerMenuModal;

    const btnHudExit = document.getElementById('btn-hud-exit-btn');
    if (btnHudExit) {
      btnHudExit.onclick = () => {
        sfx.init();
        sfx.playAlert();
        this.returnToStartMenu();
      };
    }

    const btnTopMenu = document.getElementById('btn-top-menu');
    if (btnTopMenu) btnTopMenu.onclick = triggerMenuModal;

    const btnPauseResume = document.getElementById('btn-pause-resume');
    if (btnPauseResume) {
      btnPauseResume.onclick = () => {
        this.resumeGame();
      };
    }

    const btnPauseOptions = document.getElementById('btn-pause-options');
    if (btnPauseOptions) {
      btnPauseOptions.onclick = () => {
        document.getElementById('options-modal')?.classList.add('active');
        this.syncOptionsAudioUI();
        KeybindsManager.renderUI();
      };
    }

    const handleGameRestart = () => {
      sfx.init();
      sfx.playSwing();
      ['game-over-modal', 'pause-modal'].forEach(id => {
        document.getElementById(id)?.classList.remove('active');
      });
      if (this._gameMode === 'campaign') {
        this.startCampaign();
      } else {
        this.startPractice();
      }
    };

    const btnPauseRestart = document.getElementById('btn-pause-restart');
    if (btnPauseRestart) {
      btnPauseRestart.onclick = handleGameRestart;
    }

    const btnPauseMainMenu = document.getElementById('btn-pause-mainmenu');
    if (btnPauseMainMenu) {
      btnPauseMainMenu.onclick = () => {
        sfx.init();
        sfx.playAlert();
        this.returnToStartMenu();
      };
    }

    // -------------------------------------------------------------
    // GAME OVER MODAL RETURN BUTTON
    // -------------------------------------------------------------
    const btnGameOverMenu = document.getElementById('btn-gameover-menu');
    if (btnGameOverMenu) {
      btnGameOverMenu.onclick = () => {
        sfx.init();
        sfx.playAlert();
        this.returnToStartMenu();
      };
    }

    // -------------------------------------------------------------
    // GLOBAL ESCAPE KEY HANDLER
    // -------------------------------------------------------------
    if (!window._castleKnightEscBound) {
      window._castleKnightEscBound = true;
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (KeybindsManager.activeListeningAction) return;

          const optionsModal = document.getElementById('options-modal');
          const exitModal = document.getElementById('exit-modal');
          const farewellModal = document.getElementById('farewell-modal');
          const pauseModal = document.getElementById('pause-modal');

          if (optionsModal?.classList.contains('active')) {
            optionsModal.classList.remove('active');
            return;
          }
          if (exitModal?.classList.contains('active')) {
            exitModal.classList.remove('active');
            return;
          }
          if (farewellModal?.classList.contains('active')) {
            farewellModal.classList.remove('active');
            window.activeGameScene?.returnToStartMenu();
            return;
          }
          if (pauseModal?.classList.contains('active')) {
            window.activeGameScene?.resumeGame();
            return;
          }

          if (window.activeGameScene && window.activeGameScene.gameStarted && !window.activeGameScene.isDead) {
            window.activeGameScene.pauseGame();
          }
        }
      });
    }

    // Sound button
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.onclick = () => {
        sfx.init();
        sfx.enabled = !sfx.enabled;
        music.setEnabled(sfx.enabled);
        const icon = document.getElementById('sound-icon');
        if (icon) icon.innerHTML = sfx.enabled ? '<img src="assets/UI/pix/sound_on.png" class="px-ico" alt="">' : '<img src="assets/UI/pix/sound_off.png" class="px-ico" alt="">';
        this.syncOptionsAudioUI();
      };
    }

    // Fullscreen button
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.onclick = () => {
        sfx.init();
        this.toggleFullscreen();
      };
    }

    // Character switchers
    const btnSoldier = document.getElementById('btn-hero-soldier');
    const btnWizard = document.getElementById('btn-hero-wizard');
    if (btnSoldier) btnSoldier.onclick = () => this.switchHero('soldier');
    if (btnWizard) btnWizard.onclick = () => this.switchHero('wizard');
    const btnAby = document.getElementById('btn-hero-swordsman');
    if (btnAby) btnAby.onclick = () => this.switchHero('swordsman');

    // Ready for combat button ("¡ESTOY LISTO!")
    const btnReadyCombat = document.getElementById('btn-ready-combat');
    if (btnReadyCombat) {
      btnReadyCombat.onclick = (e) => {
        e.stopPropagation();
        this.triggerStartCombat();
      };
    }

    // Restart button
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.onclick = handleGameRestart;
    }

    // Bind Developer Mode Toolbar and Inspector
    this.bindDevModeDOMElements();
  }
});
