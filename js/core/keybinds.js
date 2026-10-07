/* Rebindable controls: defaults, storage and the KeybindsManager used by the options menu. */

// ==========================================
// 1.5 KEYBOARD KEYBINDINGS MANAGER (CASTLEKNIGHT)
// ==========================================
const KEYBINDS_STORAGE_KEY = 'CASTLEKNIGHT_KEYBINDS';

const DEFAULT_KEYBINDS = {
  moveUp: 'W',
  moveDown: 'S',
  moveLeft: 'A',
  moveRight: 'D',
  attack: 'J',
  special: 'K',
  dash: 'SPACE',
  run: 'SHIFT',
  spin: 'E',
  ultimate: 'Q',
  heroSoldier: '1',
  heroWizard: '2',
  devMode: 'F2',
  hitboxes: 'P'
};

const KEYBIND_DEFINITIONS = [
  { id: 'moveUp', label: 'Mover Arriba', desc: 'Desplazarse al norte (W / Flecha Arriba)' },
  { id: 'moveDown', label: 'Mover Abajo', desc: 'Desplazarse al sur (S / Flecha Abajo)' },
  { id: 'moveLeft', label: 'Mover Izquierda', desc: 'Desplazarse al oeste (A / Flecha Izquierda)' },
  { id: 'moveRight', label: 'Mover Derecha', desc: 'Desplazarse al este (D / Flecha Derecha)' },
  { id: 'attack', label: 'Ataque Principal', desc: 'Combo melee de espada / Hechizo arcano (J)' },
  { id: 'special', label: 'Ataque Especial', desc: 'Disparo con arco / Bola de Fuego (K)' },
  { id: 'run', label: 'Correr', desc: 'Mantener para correr más rápido (Shift)' },
  { id: 'dash', label: 'Dash Evasivo', desc: 'Deslizamiento rápido o Teletransporte (Espacio) — Usa 50% Stamina' },
  { id: 'spin', label: 'Giro / Trueno', desc: 'Lancent: torbellino doble (35% Stamina) — Horos: trueno en área (45% Stamina)' },
  { id: 'ultimate', label: 'Habilidad Especial', desc: 'Lancent: lluvia de flechas — Horos: trueno (mantener para cargar hasta 3 s) — 45% Stamina' },
  { id: 'heroSoldier', label: 'Seleccionar Soldado', desc: 'Cambiar de personaje al Caballero (1)' },
  { id: 'heroWizard', label: 'Seleccionar Mago', desc: 'Cambiar de personaje al Mago Arcano (2)' },
  { id: 'devMode', label: 'Modo Desarrollador', desc: 'Herramientas de hitboxes y spawns (F2)' },
  { id: 'hitboxes', label: 'Ver Hitboxes', desc: 'Alternar visualizacion de colisiones (P)' }
];

function resolvePhaserKeyCode(keyName) {
  if (!keyName) return Phaser.Input.Keyboard.KeyCodes.W;
  const upper = String(keyName).toUpperCase().trim();

  if (upper === 'SPACE' || upper === 'ESPACIO' || upper === ' ') return Phaser.Input.Keyboard.KeyCodes.SPACE;
  if (upper === 'SHIFT') return Phaser.Input.Keyboard.KeyCodes.SHIFT;
  if (upper === 'CTRL' || upper === 'CONTROL') return Phaser.Input.Keyboard.KeyCodes.CTRL;
  if (upper === 'ALT') return Phaser.Input.Keyboard.KeyCodes.ALT;
  if (upper === 'ENTER') return Phaser.Input.Keyboard.KeyCodes.ENTER;
  if (upper === 'ESC' || upper === 'ESCAPE') return Phaser.Input.Keyboard.KeyCodes.ESC;
  if (upper === 'TAB') return Phaser.Input.Keyboard.KeyCodes.TAB;
  if (upper === 'BACKSPACE') return Phaser.Input.Keyboard.KeyCodes.BACKSPACE;
  if (upper === 'DELETE' || upper === 'SUPR') return Phaser.Input.Keyboard.KeyCodes.DELETE;

  if (upper === 'ARROWUP' || upper === 'UP' || upper === 'FLECHA ARRIBA') return Phaser.Input.Keyboard.KeyCodes.UP;
  if (upper === 'ARROWDOWN' || upper === 'DOWN' || upper === 'FLECHA ABAJO') return Phaser.Input.Keyboard.KeyCodes.DOWN;
  if (upper === 'ARROWLEFT' || upper === 'LEFT' || upper === 'FLECHA IZQ' || upper === 'FLECHA IZQUIERDA') return Phaser.Input.Keyboard.KeyCodes.LEFT;
  if (upper === 'ARROWRIGHT' || upper === 'RIGHT' || upper === 'FLECHA DER' || upper === 'FLECHA DERECHA') return Phaser.Input.Keyboard.KeyCodes.RIGHT;

  const digits = { '0': 'ZERO', '1': 'ONE', '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE', '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINE' };
  if (digits[upper] && Phaser.Input.Keyboard.KeyCodes[digits[upper]] !== undefined) {
    return Phaser.Input.Keyboard.KeyCodes[digits[upper]];
  }

  if (/^F\d+$/.test(upper) && Phaser.Input.Keyboard.KeyCodes[upper] !== undefined) {
    return Phaser.Input.Keyboard.KeyCodes[upper];
  }

  if (Phaser.Input.Keyboard.KeyCodes[upper] !== undefined) {
    return Phaser.Input.Keyboard.KeyCodes[upper];
  }

  return Phaser.Input.Keyboard.KeyCodes.W;
}

class KeybindsManager {
  static bindings = { ...DEFAULT_KEYBINDS };
  static activeListeningAction = null;
  static initialized = false;

  static init() {
    if (this.initialized) {
      this.renderUI();
      return;
    }
    this.initialized = true;

    try {
      const stored = localStorage.getItem(KEYBINDS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.bindings = { ...DEFAULT_KEYBINDS, ...parsed };
        // Older saves had Dash on Shift; Shift is now Run and Dash moved to Space
        if (parsed.dash === 'SHIFT' && !parsed.run) this.bindings.dash = 'SPACE';
      }
    } catch (e) {
      console.warn('Error reading keybinds from storage:', e);
      this.bindings = { ...DEFAULT_KEYBINDS };
    }

    this.renderUI();
    this.setupGlobalKeyListener();
    this.updateControlsFooter();
  }

  static get(action) {
    return this.bindings[action] || DEFAULT_KEYBINDS[action] || 'W';
  }

  static set(action, key) {
    this.bindings[action] = String(key).toUpperCase();
    try {
      localStorage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(this.bindings));
    } catch (e) { }
    this.renderUI();
    this.updateControlsFooter();
    if (window.activeGameScene) {
      window.activeGameScene.rebindControls();
    }
  }

  static reset() {
    this.bindings = { ...DEFAULT_KEYBINDS };
    try {
      localStorage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(this.bindings));
    } catch (e) { }
    this.renderUI();
    this.updateControlsFooter();
    if (window.activeGameScene) {
      window.activeGameScene.rebindControls();
    }
  }

  static formatKeyDisplay(keyStr) {
    if (!keyStr) return '---';
    const upper = String(keyStr).toUpperCase();
    if (upper === ' ' || upper === 'SPACE') return 'ESPACIO';
    if (upper === 'ARROWUP') return 'FLECHA ARRIBA';
    if (upper === 'ARROWDOWN') return 'FLECHA ABAJO';
    if (upper === 'ARROWLEFT') return 'FLECHA IZQ';
    if (upper === 'ARROWRIGHT') return 'FLECHA DER';
    if (upper === 'SHIFT') return 'SHIFT';
    if (upper === 'CONTROL') return 'CTRL';
    if (upper === 'ALT') return 'ALT';
    if (upper === 'ENTER') return 'ENTER';
    return upper;
  }

  static renderUI() {
    const grid = document.getElementById('keybinds-grid');
    if (!grid) return;
    grid.innerHTML = '';

    KEYBIND_DEFINITIONS.forEach(def => {
      const row = document.createElement('div');
      row.className = 'keybind-row';

      const info = document.createElement('div');
      info.className = 'keybind-info';

      const label = document.createElement('span');
      label.className = 'keybind-label';
      label.textContent = def.label;

      const desc = document.createElement('span');
      desc.className = 'keybind-desc';
      desc.textContent = def.desc;

      info.appendChild(label);
      info.appendChild(desc);

      const btn = document.createElement('button');
      btn.className = 'keybind-btn';
      btn.dataset.action = def.id;
      btn.textContent = this.formatKeyDisplay(this.get(def.id));

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startListening(def.id, btn);
      });

      row.appendChild(info);
      row.appendChild(btn);
      grid.appendChild(row);
    });
  }

  static startListening(action, btnEl) {
    document.querySelectorAll('.keybind-btn.listening').forEach(el => {
      el.classList.remove('listening');
      const act = el.dataset.action;
      el.textContent = this.formatKeyDisplay(this.get(act));
    });

    this.activeListeningAction = action;
    btnEl.classList.add('listening');
    btnEl.textContent = 'PULSA TECLA...';
  }

  static setupGlobalKeyListener() {
    window.addEventListener('keydown', (e) => {
      if (!this.activeListeningAction) return;

      if (e.key === 'Escape') {
        this.cancelListening();
        return;
      }

      if (e.key === 'F5' || e.key === 'F12' || e.key === 'F11') return;

      e.preventDefault();
      e.stopPropagation();

      let keyToSet = e.key;
      if (e.code.startsWith('Key')) keyToSet = e.code.replace('Key', '');
      else if (e.code.startsWith('Digit')) keyToSet = e.code.replace('Digit', '');
      else if (e.code === 'Space') keyToSet = 'SPACE';
      else if (e.code.startsWith('Arrow')) keyToSet = e.code;
      else if (e.code.includes('Shift')) keyToSet = 'SHIFT';
      else if (e.code.includes('Control')) keyToSet = 'CTRL';
      else if (e.code.includes('Alt')) keyToSet = 'ALT';

      this.set(this.activeListeningAction, keyToSet);
      this.activeListeningAction = null;
      sfx.playAlert();
    }, true);

    window.addEventListener('click', (e) => {
      if (this.activeListeningAction && !e.target.closest('.keybind-btn')) {
        this.cancelListening();
      }
    });
  }

  static cancelListening() {
    if (!this.activeListeningAction) return;
    this.activeListeningAction = null;
    this.renderUI();
  }

  static updateControlsFooter() {
    const footer = document.querySelector('.controls-bar');
    if (!footer) return;

    const moveW = this.formatKeyDisplay(this.get('moveUp'));
    const moveA = this.formatKeyDisplay(this.get('moveLeft'));
    const moveS = this.formatKeyDisplay(this.get('moveDown'));
    const moveD = this.formatKeyDisplay(this.get('moveRight'));
    const atk = this.formatKeyDisplay(this.get('attack'));
    const spc = this.formatKeyDisplay(this.get('special'));
    const dsh = this.formatKeyDisplay(this.get('dash'));
    const run = this.formatKeyDisplay(this.get('run'));
    const spn = this.formatKeyDisplay(this.get('spin'));
    const ult = this.formatKeyDisplay(this.get('ultimate'));
    const sld = this.formatKeyDisplay(this.get('heroSoldier'));
    const wiz = this.formatKeyDisplay(this.get('heroWizard') || '2');
    const dev = this.formatKeyDisplay(this.get('devMode'));
    const hit = this.formatKeyDisplay(this.get('hitboxes'));

    footer.innerHTML = `
      <div class="control-pill">
        <span class="key-cap">${moveW}</span>
        <span class="key-cap">${moveA}</span>
        <span class="key-cap">${moveS}</span>
        <span class="key-cap">${moveD}</span>
        <span>MOVERSE</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${atk}</span> / <span class="key-cap">CLICK IZQ</span>
        <span>ATACAR</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${spc}</span> / <span class="key-cap">CLICK DER</span>
        <span>ESPECIAL</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${run}</span>
        <span>CORRER</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${dsh}</span>
        <span>DASH</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${spn}</span>
        <span>GIRO</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${ult}</span>
        <span>HABILIDAD</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${sld}</span> / <span class="key-cap">${wiz}</span>
        <span>HEROE</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">F</span>
        <span>FULLSCREEN</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${dev}</span>
        <span>MODO DEV</span>
      </div>
      <div class="control-pill">
        <span class="key-cap">${hit}</span>
        <span>HITBOXES</span>
      </div>
    `;
  }
}
