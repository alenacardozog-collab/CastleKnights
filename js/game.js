/* Bootstrap: Phaser config, game creation and the start menu. Everything else lives in js/core, js/config, js/maps and js/scene. */

// ==========================================
// 3. INITIALIZE PHASER 3 CONFIG
// ==========================================
const config = {
  type: Phaser.AUTO,
  parent: 'game-canvas-container',
  width: 960,
  height: 600,
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MainGameScene]
};

// Listen for fullscreen change to refresh scale
document.addEventListener('fullscreenchange', () => {
  if (window.game && window.game.scale) {
    setTimeout(() => {
      window.game.scale.refresh();
    }, 150);
  }
});

window.addEventListener('load', () => {
  window.game = new Phaser.Game(config);
});

// Early button listener for Start Menu so clicks work immediately even during preload
document.addEventListener('DOMContentLoaded', () => {
  if (typeof music !== 'undefined') {
    music.play('intro');
  }

  const btnPlay = document.getElementById('btn-menu-play');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (typeof sfx !== 'undefined') {
        sfx.init();
        sfx.fx('ui_click', 0.8, { minGap: 150 }) || sfx.playSwing();
      }
      if (window.activeGameScene && window.activeGameScene.openHeroSelectionModal) {
        window.activeGameScene.openHeroSelectionModal('practice');
      } else {
        window._pendingHeroMode = 'practice';
      }
    });
  }

  const btnCampaign = document.getElementById('btn-menu-campaign');
  if (btnCampaign) {
    btnCampaign.addEventListener('click', () => {
      if (typeof sfx !== 'undefined') {
        sfx.init();
        sfx.fx('ui_click', 0.8, { minGap: 150 }) || sfx.playSwing();
      }
      if (window.activeGameScene && window.activeGameScene.openHeroSelectionModal) {
        window.activeGameScene.openHeroSelectionModal('campaign');
      } else {
        window._pendingHeroMode = 'campaign';
      }
    });
  }

  const btnEditor = document.getElementById('btn-menu-editor');
  if (btnEditor) {
    btnEditor.addEventListener('click', () => {
      if (typeof sfx !== 'undefined') {
        sfx.init();
        sfx.fx('ui_click', 0.8, { minGap: 150 }) || sfx.playSwing();
      }
      if (window.activeGameScene && window.activeGameScene.openMapEditor) {
        window.activeGameScene.openMapEditor();
      } else {
        window._pendingAutoStart = 'editor';
      }
    });
  }

  const btnOptions = document.getElementById('btn-menu-options');
  if (btnOptions) {
    btnOptions.addEventListener('click', () => {
      if (typeof sfx !== 'undefined') {
        sfx.init();
        sfx.fx('ui_click', 0.8, { minGap: 150 }) || sfx.playAlert();
      }
      document.getElementById('options-modal')?.classList.add('active');
      if (typeof KeybindsManager !== 'undefined') KeybindsManager.renderUI();
      if (window.activeGameScene && window.activeGameScene.syncOptionsAudioUI) {
        window.activeGameScene.syncOptionsAudioUI();
      }
    });
  }

  const btnCloseOptions = document.getElementById('btn-close-options');
  if (btnCloseOptions) {
    btnCloseOptions.addEventListener('click', () => {
      document.getElementById('options-modal')?.classList.remove('active');
    });
  }

  const btnOptAudio = document.getElementById('btn-opt-audio');
  if (btnOptAudio) {
    btnOptAudio.addEventListener('click', () => {
      if (typeof sfx !== 'undefined') {
        sfx.init();
        sfx.enabled = !sfx.enabled;
        if (typeof music !== 'undefined') music.setEnabled(sfx.enabled);
        if (sfx.enabled) sfx.playSwing();
      }
      if (window.activeGameScene && window.activeGameScene.syncOptionsAudioUI) {
        window.activeGameScene.syncOptionsAudioUI();
      }
    });
  }

  const btnOptFullscreen = document.getElementById('btn-opt-fullscreen');
  if (btnOptFullscreen) {
    btnOptFullscreen.addEventListener('click', () => {
      if (window.activeGameScene && window.activeGameScene.toggleFullscreen) {
        window.activeGameScene.toggleFullscreen();
      }
    });
  }

  const btnExit = document.getElementById('btn-menu-exit');
  if (btnExit) {
    btnExit.addEventListener('click', () => {
      document.getElementById('exit-modal')?.classList.add('active');
    });
  }

  const btnCancelExit = document.getElementById('btn-cancel-exit');
  if (btnCancelExit) {
    btnCancelExit.addEventListener('click', () => {
      document.getElementById('exit-modal')?.classList.remove('active');
    });
  }
});

// ==========================================
// START MENU v2: press-any-key gate, keyboard / sword selector, fireflies
// (plain DOM, independent from the Phaser scene)
// ==========================================
(function setupStartMenu() {
  const overlay = document.getElementById('start-menu-overlay');
  if (!overlay) return;
  const nav = overlay.querySelector('.start-menu-nav');
  const cursor = document.getElementById('sm-cursor');
  const buttons = () => Array.from(overlay.querySelectorAll('.start-menu-btn'));
  let index = 0;

  // fireflies and embers
  const flies = document.getElementById('sm-flies');
  if (flies) {
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < 26; i++) {
      const el = document.createElement('i');
      const ember = i % 4 === 0;
      const vars = {
        '--x': rnd(2, 98).toFixed(1) + '%', '--y': rnd(ember ? 55 : 30, 96).toFixed(1) + '%', '--s': rnd(2, 4).toFixed(1) + 'px',
        '--dx': rnd(-60, 60).toFixed(0) + 'px', '--dy': rnd(ember ? -160 : -70, ember ? -60 : 30).toFixed(0) + 'px',
        '--d': rnd(6, 13).toFixed(1) + 's', '--delay': rnd(-12, 0).toFixed(1) + 's', '--o': rnd(0.45, 0.95).toFixed(2)
      };
      if (ember) { vars['--c'] = '#ffb056'; vars['--g'] = 'rgba(255, 140, 50, 0.7)'; }
      else if (i % 3 === 0) { vars['--c'] = '#d9ffb0'; vars['--g'] = 'rgba(190, 255, 140, 0.6)'; }
      Object.keys(vars).forEach(k => el.style.setProperty(k, vars[k]));
      flies.appendChild(el);
    }
  }

  const menuActive = () => !overlay.classList.contains('hidden') && overlay.style.display !== 'none' &&
    !document.querySelector('.modal-overlay.active');

  const select = (i, viaKeyboard) => {
    const list = buttons();
    if (!list.length) return;
    const prev = index;
    index = (i + list.length) % list.length;
    if (index !== prev || !list[index].classList.contains('is-selected')) { if (overlay.classList.contains('sm-ready')) sfx.fx('ui_hover', 0.45, { minGap: 50 }); }
    list.forEach((b, n) => b.classList.toggle('is-selected', n === index));
    const b = list[index];
    if (cursor && nav) {
      const nr = nav.getBoundingClientRect(), br = b.getBoundingClientRect();
      const zoom = nr.width / (nav.offsetWidth || nr.width) || 1;
      cursor.style.transform = 'translate(' + ((br.left - nr.left) / zoom - 40) + 'px, ' + ((br.top - nr.top + br.height / 2) / zoom - 17) + 'px)';
      cursor.classList.add('is-on');
    }
    if (viaKeyboard) { try { b.focus({ preventScroll: true }); } catch (e) { } }
    else if (document.activeElement && document.activeElement !== b && document.activeElement.classList && document.activeElement.classList.contains('start-menu-btn')) document.activeElement.blur();
  };

  // the whole block grows with the screen so it never looks lost on a big monitor
  const fit = () => {
    const h = overlay.clientHeight || 720, w = overlay.clientWidth || 1280;
    const k = Math.max(0.72, Math.min(1.7, Math.min(h / 680, w / 1100)));
    overlay.style.setProperty('--sm-scale', k.toFixed(3));
  };
  fit();

  const open = () => {
    if (overlay.classList.contains('sm-open')) return;
    overlay.classList.remove('sm-wait');
    overlay.classList.add('sm-open');
    setTimeout(() => { select(0); overlay.classList.add('sm-ready'); }, 2100);    // once the cascade has landed
  };

  // logo forges in first, then the prompt
  setTimeout(() => { if (!overlay.classList.contains('sm-open')) overlay.classList.add('sm-wait'); }, 4000);

  window.addEventListener('keydown', (ev) => {
    if (!menuActive()) return;
    if (!overlay.classList.contains('sm-open')) { open(); ev.preventDefault(); return; }
    const k = ev.key;
    if (k === 'ArrowDown' || k === 's' || k === 'S') { select(index + 1, true); ev.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') { select(index - 1, true); ev.preventDefault(); }
    else if (k === 'Enter') {
      const b = buttons()[index];
      // always activate it ourselves: the game captures Enter, so the browser's own button activation never fires
      if (b) { ev.preventDefault(); b.click(); }
    }
  }, true);
  overlay.addEventListener('pointerdown', () => { if (!overlay.classList.contains('sm-open')) open(); });
  overlay.addEventListener('pointermove', (ev) => {
    if (!overlay.classList.contains('sm-open')) return;
    const b = ev.target && ev.target.closest && ev.target.closest('.start-menu-btn');
    if (b) { const n = buttons().indexOf(b); if (n >= 0 && n !== index) select(n); else if (n === index && !b.classList.contains('is-selected')) select(n); }
  });
  const refit = () => { fit(); if (overlay.classList.contains('sm-open')) select(index); };
  window.addEventListener('resize', refit);
  document.addEventListener('fullscreenchange', () => setTimeout(refit, 60));
})();
