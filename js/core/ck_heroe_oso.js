'use strict';
/* Cuarto héroe: URSO, el oso blanco (03/11, pedido del dueño: "un cuarto personaje… una bestia que sacamos de la zona de
   las bestias"; después: "que sea desbloqueable de una misión, blanco en su pelaje y con las animaciones como los demás").
   - MISIÓN "El oso de la jaula" (Capítulo 2, Tierras Orcas, junto al camino del norte; después irá al Claro de las Bestias):
     su propia raza, la manada de Garra Negra, lo tiene enjaulado.
     Hablándole (T) cuenta que la llave la tiene Garra Negra, el jefe de su manada (hombres oso oscuros y lobos). Al vencerlo cae la llave;
     con la llave, T en la jaula lo libera. Desde ahí se lo puede elegir en el Libro de Héroes (queda guardado en el
     navegador para todas las partidas, castleknight_oso_libre) y en la práctica.
   - Hasta entonces, en el libro aparece con candado y el requisito.
   - Hojas: las del Hombre Oso con el pelaje blanco (oso_blanco/blanquear.py) + de frente y de espaldas quieto, caminar y los
     tres ataques (PixelLab), como los otros héroes.
   - Su recurso es la FURIA: se llena despacio sola y mucho más pegando. Es más lento y pega más fuerte.
   - J: zarpazo (el tercero seguido hace 2). K: doble zarpazo (2 + 2). Espacio: embestida corta. C: parada.
     De base: Q Rugido (aturde a los de alrededor) y E Remolino de garras.
   - Árbol (H) con 3 ramas: Furia (Garras afiladas, Sed de sangre, Frenesí, Desgarro), Tierra (Piel de piedra, Pisotón,
     Montaña, Avalancha) y Bosque (Miel, Mordisco, Espíritu del bosque, Hibernar). Todo se equipa en Q E R F.
   Borrar sus 2 líneas de index.html lo saca del libro (y la jaula queda vacía y abierta). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof HEROES === 'undefined' || !window.CK_HABILIDADES || !window.CK_EQUIPO) return;
  const P = MainGameScene.prototype;
  const HB = window.CK_HABILIDADES, EQ = window.CK_EQUIPO, ARTE = window.CK_OSO_ARTE || {};
  const EP = () => window.CK_EPICO || {};
  const R = (a, b) => a + Math.random() * (b - a);
  const OSO = 'bear', LAMINA = 'werebear';
  const ANIMS = { idle: [6, 7, -1], walk: [8, 10, -1], attack1: [9, 18, 0], attack2: [13, 18, 0], attack3: [9, 14, 0], hurt: [4, 12, 0], death: [4, 8, 0] };

  HEROES[OSO] = { name: 'URSO', short: 'OSO', portrait: ARTE.retrato || 'assets/UI/portraits/orc.png', frame: 'assets/UI/icons/card_frame_soldier.png',
    color: 0xbfe6ff, hurt: 'beast_hurt', death: 'beast_death' };

  // Garra Negra: el jefe de la manada de hombres oso oscuros (PixelLab), carcelero de Urso. Sus hojas van a GAME_ASSETS_BASE64
  // (como las de los otros enemigos) y el tipo se define antes de que el juego cargue las hojas.
  if (ARTE.jefe && typeof ENEMY_TYPES !== 'undefined' && !ENEMY_TYPES.werebear_jefe) {
    window.GAME_ASSETS_BASE64 = window.GAME_ASSETS_BASE64 || {};
    const fr = {};
    Object.keys(ARTE.jefe.hojas).forEach(a => { window.GAME_ASSETS_BASE64['werebear_jefe_' + a] = ARTE.jefe.hojas[a]; fr[a] = ARTE.jefe.n[a]; });
    ENEMY_TYPES.werebear_jefe = { name: 'Garra Negra', frames: fr, hp: 12, speed: 82, dmg: 2, reach: 62, cd: 1700, hitAt: 430, xp: 60, coins: 15,
      sfx: ['beast_growl', 'beast_hurt', 'beast_death', 0.7] };
  }

  // ------------------------------------------------------------------ hojas (oso blanco, de costado + de frente y de espaldas)
  const HOJAS = ARTE.hojas || {};
  const DIR = { idle: [4, 6, -1], walk: [8, 10, -1], attack1: [8, 16, 0], attack2: [8, 12, 0], attack3: [8, 12, 0] };
  const pre0 = P.preload;
  P.preload = function () {
    if (pre0) pre0.apply(this, arguments);
    try { Object.keys(HOJAS).forEach(k => { if (!this.textures.exists(k)) this.load.spritesheet(k, HOJAS[k], { frameWidth: 100, frameHeight: 100 }); }); } catch (e) { console.warn('[oso]', e); }
  };
  const registrar = S => {
    Object.keys(ANIMS).forEach(a => {
      const key = OSO + '_' + a, tx = LAMINA + '_' + a;
      if (!S.textures.exists(key) && S.textures.exists(tx)) S.textures.addSpriteSheet(key, S.textures.get(tx).getSourceImage(), { frameWidth: 100, frameHeight: 100 });
      if (S.anims.exists(key) || !S.textures.exists(key)) return;
      const [n, rate, rep] = ANIMS[a], tot = S.textures.get(key).frameTotal - 1;
      S.anims.create({ key, frames: S.anims.generateFrameNumbers(key, { start: 0, end: Math.max(0, Math.min(n, tot) - 1) }), frameRate: rate, repeat: rep });
    });
    Object.keys(DIR).forEach(a => ['front', 'back'].forEach(v => {
      const key = OSO + '_' + a + '_' + v;
      if (S.anims.exists(key) || !S.textures.exists(key)) return;
      const [n, rate, rep] = DIR[a], tot = S.textures.get(key).frameTotal;
      S.anims.create({ key, frames: S.anims.generateFrameNumbers(key, { start: 0, end: Math.min(n, tot) - 1 }), frameRate: rate, repeat: rep });
    }));
  };
  // mirando arriba o abajo: la versión de frente / de espaldas
  const ha0 = P.heroAnim;
  P.heroAnim = function (key) {
    if (this.playerHero === OSO && this.facingV && typeof key === 'string' && /^bear_(idle|walk|attack1|attack2|attack3)$/.test(key)) {
      const k = key + '_' + this.facingV; if (this.anims.exists(k)) return k;
    }
    return ha0.apply(this, arguments);
  };
  const cr0 = P.create;
  P.create = function () {
    try { registrar(this); } catch (e) { console.warn('[oso]', e); }
    return cr0.apply(this, arguments);
  };
  const ponerOso = S => {
    if (S.playerHero !== OSO || !S.player) return;
    registrar(S);
    S.player.setTexture(OSO + '_idle');
    if (S.anims.exists(OSO + '_idle')) S.player.play(OSO + '_idle');
    if (S.setPlayerIndoorScale) S.setPlayerIndoorScale(S.player.scaleX > 1.5);
  };
  // el oso es una bestia: un poco más grande que los otros héroes (el pie queda igual)
  const GRANDE = 1.15;
  const es0 = P.setPlayerIndoorScale;
  if (es0) P.setPlayerIndoorScale = function () {
    const r = es0.apply(this, arguments);
    try {
      const p = this.player;
      if (this.playerHero === OSO && p && p.body) { const s = p.scaleX * GRANDE, k = 1.2 / s * (p.scaleX > 1.5 ? 1.2 / 1.2 : 1), w = 16 * 1.2 / s, h = 8 * 1.2 / s; p.setScale(s); p.body.setSize(w, h); p.body.setOffset(50 - w / 2, 60 - h); }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ desbloqueo (para todas las partidas)
  const CLAVE = 'castleknight_oso_libre';
  const libre = () => { try { return localStorage.getItem(CLAVE) === '1'; } catch (e) { return false; } };
  const liberar = () => { try { localStorage.setItem(CLAVE, '1'); } catch (e) {} pintarTarjeta(); pintarBoton(); };

  // ------------------------------------------------------------------ el libro de héroes: la página 2
  const tarjeta = () => {
    const c = document.getElementById('hero-card-locked');
    if (!c || c.dataset.hero === OSO) return;
    c.id = 'hero-card-' + OSO; c.dataset.hero = OSO; c.className = 'hero-select-card book-p2';
    c.removeAttribute('aria-disabled'); c.setAttribute('tabindex', '0'); c.setAttribute('role', 'button'); c.setAttribute('aria-pressed', 'false'); c.title = '';
    c.innerHTML = `<div class="hero-card-frame-wrapper frame-bear">
        <img src="${HEROES[OSO].portrait}" class="hero-card-portrait" alt="Urso, el hombre oso">
        <img src="${HEROES[OSO].portrait}" class="hero-card-portrait hero-card-portrait-action" alt="">
        <span class="hero-card-check">✓</span></div>
      <div class="hero-card-info"><h3 class="hero-card-name">Urso</h3><div class="hero-card-class">Oso Blanco · Furia del Norte</div>
        <div class="hero-card-stats">
          <div class="hero-stat-row"><span class="stat-label"><img src="assets/UI/pix/sword.png" class="px-ico" alt=""> Combate:</span><span class="stat-val">Garras & Colmillos</span></div>
          <div class="hero-stat-row"><span class="stat-label"><img src="assets/UI/pix/shield.png" class="px-ico" alt=""> Defensa:</span><span class="stat-val">Piel Dura & Rugido</span></div>
          <div class="hero-stat-row"><span class="stat-label"><img src="assets/UI/pix/bolt.png" class="px-ico" alt=""> Habilidad:</span><span class="stat-val">Furia, Pisotón & Avalancha</span></div>
        </div></div>`;
    if (!document.getElementById('ck-oso-css')) {
      const st = document.createElement('style'); st.id = 'ck-oso-css';
      st.textContent = `
#hero-card-bear { cursor: pointer;
  background: radial-gradient(circle at 20% 14%, rgba(255,255,255,.85) 0 1px, transparent 2px), radial-gradient(circle at 78% 26%, rgba(200,235,255,.8) 0 1px, transparent 2px), radial-gradient(circle at 66% 72%, rgba(255,255,255,.7) 0 1px, transparent 2px), radial-gradient(circle at 12% 64%, rgba(200,235,255,.7) 0 1px, transparent 2px), linear-gradient(180deg, #1e3a58 0%, #13263e 55%, #0a1424 100%) !important;
  border: 4px solid #a8d4f0 !important; box-shadow: 0 0 0 2px #06101c, inset 0 0 0 2px #06101c, inset 0 0 0 3px #4e7aa0, inset 0 0 28px rgba(0, 0, 0, 0.7) !important; }
#hero-card-bear .hero-card-frame-wrapper { border: 5px solid #d8f0ff !important; box-shadow: 0 0 0 2px #06101c, inset 0 0 0 2px #06101c, 0 6px 0 rgba(0, 0, 0, 0.45), 0 0 18px rgba(120, 200, 255, 0.4) !important;
  background: radial-gradient(circle at 50% 30%, #3a6a92 0%, #08121e 78%) !important; }
#hero-card-bear .hero-card-name { font-family: 'AntiquityPrint', 'Pirata One', 'MedievalSharp', serif !important; font-size: clamp(30px, 5.6vh, 52px) !important; letter-spacing: 6px !important; text-transform: uppercase !important;
  color: #eaf6ff !important; -webkit-text-fill-color: #eaf6ff; background: none !important; text-shadow: 0 2px 0 #4e7aa0, 0 4px 0 #06101c, 0 0 16px rgba(120, 200, 255, 0.7) !important; padding-top: 4px !important; }
#hero-card-bear .hero-card-info > .hero-card-name::after { content: ''; display: block; height: 8px; margin: 6px auto; width: 40%;
  background: repeating-linear-gradient(100deg, transparent 0 6px, #cfeaff 6px 9px, transparent 9px 16px); }
#hero-card-bear .hero-card-class { color: #a8d4f0 !important; }
#hero-card-bear .hero-card-stats { border-color: #4e7aa0 !important; background: rgba(4, 10, 20, 0.5) !important; opacity: 1 !important; }
#hero-card-bear .stat-label, #hero-card-bear .stat-val { opacity: 1 !important; }
#hero-card-bear.oso-bloq { cursor: not-allowed; background: repeating-linear-gradient(135deg, #2a2a30 0 10px, #24242a 10px 20px) !important; border-color: #5d5d68 !important; }
#hero-card-bear.oso-bloq .hero-card-frame-wrapper { border-color: #6d6d78 !important; background: radial-gradient(circle at 50% 30%, #3a3a44 0%, #0c0c10 78%) !important; position: relative; overflow: hidden; }
#hero-card-bear.oso-bloq .hero-card-name { color: #8d8d99 !important; -webkit-text-fill-color: #8d8d99; text-shadow: 0 3px 0 #0e0e12 !important; }
#hero-card-bear.oso-bloq .hero-card-class { color: #a3a3ad !important; }
#hero-card-bear.oso-bloq .hero-card-info > .hero-card-name::after { opacity: .3; }
#hero-card-bear.shake .hero-lock { animation: lockShake 0.42s ease-in-out; }
#hero-card-bear.active { box-shadow: 0 0 0 2px #06101c, 0 0 0 5px #e0f4ff, 0 0 30px rgba(120, 200, 255, 0.75), inset 0 0 0 2px #06101c, inset 0 0 0 3px #4e7aa0 !important; }`;
      document.head.append(st);
    }
    const elegir = () => {
      const S = window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
      if (!S) return;
      if (!libre() && S.heroSelectionTargetMode !== 'practice') { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); try { sfx.fx('door_locked', 0.7) || sfx.fx('sword_hit', 0.4, { rate: 0.6 }); } catch (e) {} return; }
      try { if (S.selectedHero !== OSO) sfx.fx('beast_growl', 0.9, { rate: 0.8 }); } catch (e) {}
      S.selectHeroInModal(OSO);
    };
    c.addEventListener('click', elegir);
    c.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); elegir(); } });
  };
  // bloqueada: silueta, candado y el requisito (con las clases de la tarjeta bloqueada que ya tenía el libro)
  const pintarTarjeta = () => {
    const c = document.getElementById('hero-card-' + OSO); if (!c) return;
    const S = window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(x => x.startCampaign));
    const ok = libre() || !!(S && S.heroSelectionTargetMode === 'practice' && S._ckLibroAbierto);   // en la práctica, siempre
    c.classList.toggle('oso-bloq', !ok);
    c.title = ok ? '' : 'Héroe por desbloquear';
    c.querySelectorAll('.hero-card-portrait').forEach(im => im.classList.toggle('hero-locked-shape', !ok));
    let lk = c.querySelector('.hero-lock');
    if (!ok && !lk) { lk = document.createElement('span'); lk.className = 'hero-lock'; lk.innerHTML = '<span class="hero-lock-shackle"></span><span class="hero-lock-body"></span>'; c.querySelector('.hero-card-frame-wrapper').appendChild(lk); }
    if (lk) lk.style.display = ok ? 'none' : '';
    c.querySelector('.hero-card-name').textContent = ok ? 'Urso' : '? ? ?';
    c.querySelector('.hero-card-class').textContent = ok ? 'Oso Blanco · Furia del Norte' : 'Héroe por desbloquear';
    const v = c.querySelectorAll('.stat-val'), l = c.querySelectorAll('.stat-label');
    const T = ok ? [['Combate:', 'Garras & Colmillos'], ['Defensa:', 'Piel Dura & Rugido'], ['Habilidad:', 'Furia, Pisotón & Avalancha']]
      : [['Estado:', 'Preso de su manada'], ['Misión:', 'El oso de la jaula'], ['Dónde:', 'Tierras Orcas (Cap. 2)']];
    T.forEach(([a, b], i) => { if (l[i]) l[i].lastChild.textContent = ' ' + a; if (v[i]) v[i].textContent = b; });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { tarjeta(); pintarTarjeta(); }); else { tarjeta(); pintarTarjeta(); }
  // al abrir el libro se vuelve a pintar: en la práctica Urso se puede elegir aunque siga preso
  const abrir0 = P.openHeroSelectionModal;
  if (abrir0) P.openHeroSelectionModal = function () { const r = abrir0.apply(this, arguments); try { this._ckLibroAbierto = true; pintarTarjeta(); } catch (e) {} return r; };
  const sel0 = P.selectHeroInModal;
  if (sel0) P.selectHeroInModal = function (hero) {
    const r = sel0.apply(this, arguments);
    try { const c = document.getElementById('hero-card-' + OSO); if (c) { const on = hero === OSO; c.classList.toggle('active', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); c.classList.remove('just-picked'); if (on) { void c.offsetWidth; c.classList.add('just-picked'); } } } catch (e) {}
    return r;
  };

  // práctica: botón para cambiar al oso (junto a Soldado, Mago y Aby)
  const boton = () => {
    const aby = document.getElementById('btn-hero-swordsman');
    if (!aby || document.getElementById('btn-hero-' + OSO)) return;
    const b = aby.cloneNode(true); b.id = 'btn-hero-' + OSO; b.dataset.hero = OSO; b.title = 'Cambiar a Urso, el hombre oso';
    const t = [...b.childNodes].reverse().find(n => n.nodeType === 3 && n.textContent.trim()) || b.querySelector('span');
    if (t) t.textContent = ' OSO'; else b.textContent = 'OSO';
    b.classList.remove('active');
    b.onclick = () => { const S = window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign)); if (S) S.switchHero(OSO); };
    aby.parentNode.insertBefore(b, aby.nextSibling);
    pintarBoton();
  };
  // en la práctica Urso está siempre, aunque no lo hayas liberado (pedido del dueño, 03/11)
  function pintarBoton() { const b = document.getElementById('btn-hero-' + OSO); if (b) b.style.display = ''; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boton); else boton();
  const sw0 = P.switchHero;
  P.switchHero = function (h) { const r = sw0.apply(this, arguments); try { if (h === OSO) ponerOso(this); } catch (e) {} return r; };

  // ------------------------------------------------------------------ al empezar con el oso
  ['startCampaign', 'startPractice'].forEach(fn => {
    const f0 = P[fn]; if (!f0) return;
    P[fn] = function () { const r = f0.apply(this, arguments); try { ponerOso(this); } catch (e) { console.warn('[oso]', e); } return r; };
  });

  // ------------------------------------------------------------------ ayudas
  const cerca = EQ.cerca, pegar = EQ.pegar, anilloFx = EQ.anilloFx, son = EQ.son, dir = EQ.dir, pie = EQ.pie, luz = EQ.luz;
  const esOso = S => S.playerHero === OSO;
  const play = (S, a) => { const k = OSO + '_' + a; if (S.anims.exists(k)) S.player.play(k); };
  const alIdle = (S, ms) => S.time.delayedCall(ms, () => { if (!S.isDead && S.player.active && esOso(S)) { S.isAttacking = false; play(S, 'idle'); } });
  const delante = (S, d) => { const p = S.player, [dx, dy] = dir(S); return { x: p.x + dx * d, y: p.y + 6 + dy * d * 0.8, dx, dy }; };
  const golpeGarra = (S, dmg, rad, d) => {
    const f = delante(S, d || 30), crit = Math.random() < 0.1 * HB.rg(S, 'garras');
    let n = 0;
    cerca(S, f.x, f.y, rad || 40).forEach(e => { n++; pegar(S, e, dmg * (crit ? 2 : 1), S.player.x, S.player.y); if (S._ckFrenesi > S.time.now && EP().sangrar) EP().sangrar(S, e, 1200); });
    if (crit && n) { S.createFloatingText(f.x, f.y - 30, '¡CRÍTICO!', 0xffb04a); S.cameras.main.shake(90, 0.005); }
    return n;
  };
  const vel = S => (S._ckFrenesi > S.time.now ? 1.45 : 1);

  // ------------------------------------------------------------------ J, K y Espacio
  const at0 = P.performAttack;
  P.performAttack = function () {
    if (!esOso(this)) return at0.apply(this, arguments);
    if (this.combatLocked() || this.isAttacking || this.isDead) return;
    this.isAttacking = true;
    this._osoCadena = (this.time.now - (this._osoCadenaAt || 0) < 1000) ? (this._osoCadena || 0) + 1 : 1;
    this._osoCadenaAt = this.time.now;
    const fuerte = this._osoCadena % 3 === 0;
    // la cadena alterna los tres zarpazos (antes era siempre el mismo): izquierda, derecha y el fuerte con estocada
    const paso = (this._osoCadena - 1) % 3;
    play(this, ['attack1', 'attack2', 'attack3'][paso]); this.player.anims.timeScale = vel(this);
    son(fuerte ? 'sword_swing2' : 'sword_swing1', 0.7, { rate: 0.7 + paso * 0.06 });
    if (fuerte) { const [dx, dy] = dir(this), p = this.player; this.tweens.add({ targets: p, x: p.x + dx * 16, y: p.y + dy * 12, duration: 140 / vel(this), ease: 'Quad.easeOut' }); }
    this.time.delayedCall(260 / vel(this), () => {
      if (this.isDead) return;
      const n = golpeGarra(this, fuerte ? 2 : 1, 42, 28), V = window.CK_VFX;
      if (V) { const f = delante(this, 28); V.fx(this, 'garras', f.x, f.y - 10, { escala: fuerte ? 1.35 : 0.95, flip: (paso === 1) !== (this.facingDirection === 'left'), giro: paso === 2 ? -0.5 : 0 }); if (fuerte && n) { this.cameras.main.shake(110, 0.006); V.fx(this, 'golpe', f.x, f.y - 8, { escala: 1.2, tinte: 0xcfeeff }); } }
      if (n) son('beast_growl', 0.35, { rate: 1.3, minGap: 400 });
    });
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { this.player.anims.timeScale = 1; this.isAttacking = false; if (!this.isDead) play(this, 'idle'); });
  };
  const sp0 = P.performSpecialAttack;
  P.performSpecialAttack = function () {
    if (!esOso(this)) return sp0.apply(this, arguments);
    if (this.combatLocked() || this.isAttacking || this.isDead) return;
    if (this.time.now < (this._osoK || 0)) return;
    this._osoK = this.time.now + 1200 / vel(this);
    this.isAttacking = true; this.player.setVelocity(0, 0);
    play(this, 'attack3'); this.player.anims.timeScale = vel(this);
    [330, 560].forEach((t, i) => this.time.delayedCall(t / vel(this), () => {   // la segunda garra antes de que termine la animación (643 ms): a 700 no llegaba nunca (06/11)
      if (this.isDead || !this.isAttacking) return; son('sword_swing2', 0.7, { rate: 0.65 + i * 0.1 }); golpeGarra(this, 2, 46, 30);
      const V = window.CK_VFX; if (V) { const f = delante(this, 30); V.fx(this, 'garras', f.x, f.y - 10, { escala: 1.2, flip: i === 1, giro: i ? 0.4 : -0.4 }); if (i && window.CK_ONDAS) CK_ONDAS.estallido(this, 'tierra', f.x, f.y + 6, 40, 300); }
    }));
    this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => { this.player.anims.timeScale = 1; this.isAttacking = false; if (!this.isDead) play(this, 'idle'); });
  };
  const da0 = P.performDash;
  P.performDash = function () {
    if (!esOso(this)) return da0.apply(this, arguments);
    if (this.isDead || this.isDashing) return;
    const now = this.time.now;
    if (now - (this.lastDashTime || -1e9) < (this.dashCooldown || 600)) return;
    const cost = this.dashStaminaCost || 50;
    if (this.stamina < cost) { this.showLowStaminaWarning('Embestida'); return; }
    this.stamina = Math.max(0, this.stamina - cost); this.updateStaminaBar();
    this.isDashing = true; this.lastDashTime = now; this.isAttacking = false; this.isInvulnerable = true;
    let vx = 0, vy = 0;
    if ((this.keyMoveLeft && this.keyMoveLeft.isDown) || this.cursors.left.isDown) vx -= 1;
    if ((this.keyMoveRight && this.keyMoveRight.isDown) || this.cursors.right.isDown) vx += 1;
    if ((this.keyMoveUp && this.keyMoveUp.isDown) || this.cursors.up.isDown) vy -= 1;
    if ((this.keyMoveDown && this.keyMoveDown.isDown) || this.cursors.down.isDown) vy += 1;
    if (!vx && !vy) vx = this.facingDirection === 'left' ? -1 : 1;
    const m = Math.hypot(vx, vy); vx /= m; vy /= m;
    if (vx) { this.player.setFlipX(vx < 0); this.facingDirection = vx < 0 ? 'left' : 'right'; }
    this.player.setVelocity(vx * 400, vy * 400);
    play(this, 'walk'); this.player.anims.timeScale = 2;
    son('dash', 0.8, { rate: 0.75 });
    const ya = new Set();
    const ghost = this.time.addEvent({ delay: 50, repeat: 4, callback: () => {
      if (!this.player || this.isDead) return;
      const g = this.add.sprite(this.player.x, this.player.y, this.player.texture.key, this.player.frame.name).setFlipX(this.player.flipX).setScale(this.player.scaleX, this.player.scaleY).setAlpha(0.55).setTint(0xd8a060).setDepth(this.player.depth - 1);
      this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
      cerca(this, this.player.x, this.player.y, 30).forEach(e => { if (ya.has(e)) return; ya.add(e); pegar(this, e, 1, this.player.x, this.player.y, 'embestida'); });
    } });
    this.time.delayedCall(300, () => {
      if (!this.isDashing) return;
      this.isDashing = false; this.isInvulnerable = false; ghost.remove(); this.player.anims.timeScale = 1;
      if (!this.isDead) { this.player.setVelocity(0, 0); play(this, 'idle'); }
    });
  };

  // ------------------------------------------------------------------ furia: se llena despacio sola y pegando
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount) {
    const vivo = enemy && enemy.active && !enemy.isDead;
    const r = de0.apply(this, arguments);
    try {
      if (esOso(this) && vivo && amount > 0) {
        this.stamina = Math.min(this.maxStamina, this.stamina + 5 * Math.min(2, amount));
        if (enemy.isDead || !enemy.active) this.stamina = Math.min(this.maxStamina, this.stamina + 10 * HB.rg(this, 'sangre'));
        this.updateStaminaBar && this.updateStaminaBar();
      }
    } catch (e) {}
    return r;
  };
  const dp0 = P.damagePlayer;
  P.damagePlayer = function () {
    if (esOso(this) && !this.isInvulnerable && !this.isDead && HB.rg(this, 'piedra') && Math.random() < 0.1 * HB.rg(this, 'piedra')) {
      this.createFloatingText(this.player.x, this.player.y - 44, '¡PIEL DE PIEDRA!', 0xc0b090); son('sword_hit', 0.6, { rate: 0.6 });
      this.isInvulnerable = true; this.time.delayedCall(350, () => { this.isInvulnerable = false; }); return;
    }
    if (esOso(this) && this._osoHiberna > this.time.now) return;
    return dp0.apply(this, arguments);
  };
  const up0 = P.update;
  P.update = function (time, delta) {
    const antes = this.stamina;
    const r = up0.apply(this, arguments);
    try {
      if (!esOso(this) || !this.player) return r;
      // la furia sola sube a la mitad de velocidad (lo que sube pegando entra por damageEnemy)
      if (this.stamina > antes && !this._osoRegenOk) this.stamina = antes + (this.stamina - antes) * 0.5;
      // el caminar más lento y el frenesí
      if (this.player.body && !this.isDashing && !this._osoVelOk) {
        const v = this.player.body.velocity, k = this._ckFrenesi > time ? 1.15 : 0.9;
        this.player.body.setVelocity(v.x * k, v.y * k);
      }
      // la textura nunca queda la de otro héroe
      const ak = this.player.anims.currentAnim && this.player.anims.currentAnim.key;
      if (ak && !ak.startsWith(OSO + '_') && /^(soldier|wizard|swordsman)_/.test(ak)) play(this, /walk/.test(ak) ? 'walk' : 'idle');
      // montaña (+1 corazón) y miel (se cura de a poco)
      const H = HB.hab(this);
      if (H && HB.rg(this, 'montana') && !(H._osoMontana)) { H._osoMontana = 1; if (this.story) { this.story.maxHealth = Math.min(9, (this.story.maxHealth || this.maxHealth) + 1); this.maxHealth = this.story.maxHealth; } else this.maxHealth += 1; this.health = Math.min(this.maxHealth, this.health + 1); this.updateHUD && this.updateHUD(); }
      const miel = HB.rg(this, 'miel');
      if (miel && this.health < this.maxHealth && !this.isDead) {
        this._osoMiel = (this._osoMiel || 0) + (delta || 16);
        if (this._osoMiel > (40 - miel * 10) * 1000) { this._osoMiel = 0; this.health++; this.updateHUD && this.updateHUD(); this.createFloatingText(this.player.x, this.player.y - 40, '+1 MIEL', 0xffc040); }
      } else this._osoMiel = 0;
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ el árbol del oso
  HB.ARBOL[OSO] = { nombre: 'Urso', ramas: [
    { id: 'furia', nombre: 'Furia', color: '#a8321e', nodos: [
      { id: 'garras', n: 'Garras afiladas', ic: 'garra', max: 3, req: 0, d: r => `Los zarpazos tienen ${r * 10}% de chance de crítico (doble daño).` },
      { id: 'sangre', n: 'Sed de sangre', ic: 'sangre', max: 2, req: 1, d: r => `Cada bestia que matás te da ${r * 10} de furia más.` },
      { id: 'frenesi', n: 'Frenesí', ic: 'frenesi', max: 1, req: 2, tipo: 'a', d: () => 'Nueva: 8 s de frenesí: pega y camina más rápido y sus zarpazos hacen sangrar. 30 de furia, 20 s.' },
      { id: 'desgarro', n: 'Desgarro', ic: 'desgarro', max: 1, req: 3, tipo: 'a', d: () => 'Nueva: un zarpazo brutal adelante (3) que deja sangrando. 25 de furia, 6 s.' }] },
    { id: 'tierra', nombre: 'Tierra', color: '#7a6a50', nodos: [
      { id: 'piedra', n: 'Piel de piedra', ic: 'piedra', max: 3, req: 0, d: r => `${r * 10}% de chance de aguantar un golpe sin daño.` },
      { id: 'pisoton', n: 'Pisotón', ic: 'pisoton', max: 1, req: 1, tipo: 'a', d: () => 'Nueva: golpea el suelo y salen púas: 2 de daño alrededor y aturde 1,5 s. 35 de furia, 8 s.' },
      { id: 'montana', n: 'Montaña', ic: 'montana', max: 1, req: 2, d: () => '+1 corazón máximo.' },
      { id: 'avalancha', n: 'Avalancha', ic: 'avalancha', max: 1, req: 3, tipo: 'a', d: () => 'Nueva: tres rocas ruedan hacia adelante y aplastan lo que encuentran (2 cada una). 45 de furia, 12 s.' }] },
    { id: 'bosque', nombre: 'Bosque', color: '#3f7d3a', nodos: [
      { id: 'miel', n: 'Miel', ic: 'miel', max: 2, req: 0, d: r => `Se cura 1 corazón cada ${40 - r * 10} s.` },
      { id: 'mordisco', n: 'Mordisco', ic: 'mordisco', max: 1, req: 1, tipo: 'a', d: () => 'Nueva: muerde a la bestia de adelante (2) y se cura 1 corazón. 30 de furia, 10 s.' },
      { id: 'espiritu', n: 'Espíritu del bosque', ic: 'espiritu', max: 1, req: 2, tipo: 'a', d: () => 'Nueva: el espíritu del oso lo cura 2 corazones en 4 s y lo hace más rápido. 40 de furia, 25 s.' },
      { id: 'hibernar', n: 'Hibernar', ic: 'hibernar', max: 1, req: 3, tipo: 'a', d: () => 'Nueva: se acurruca 2 s sin recibir daño y se levanta con la furia llena y 1 corazón más. 20 de furia, 30 s.' }] }
  ] };
  Object.assign(HB.ACTIVAS, { frenesi: { cd: 20000, cost: 30 }, desgarro: { cd: 6000, cost: 25 }, pisoton: { cd: 8000, cost: 35 }, avalancha: { cd: 12000, cost: 45 },
    mordisco: { cd: 10000, cost: 30 }, espiritu: { cd: 25000, cost: 40 }, hibernar: { cd: 30000, cost: 20 } });

  const tx = (S, k, w, h, fn) => { if (S.textures.exists(k)) return; const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); S.textures.addCanvas(k, c); };
  Object.assign(HB.HACER, {
    frenesi(S) {
      son('beast_growl', 1, { rate: 0.7 }); S.cameras.main.shake(200, 0.006);
      S._ckFrenesi = S.time.now + 8000;
      const p = S.player; p.setTint(0xff9a80);
      const g = S.add.graphics().setBlendMode(1);
      const ev = S.time.addEvent({ delay: 40, loop: true, callback: () => {
        if (S.time.now > S._ckFrenesi || !p.active || !esOso(S)) { ev.remove(); g.destroy(); p.clearTint(); return; }
        g.clear().setDepth(p.depth - 1); g.fillStyle(0xff3a1a, 0.18 + Math.sin(S.time.now / 90) * 0.06); g.fillEllipse(p.x, p.y + 4, 46, 52);
      } });
      return 300;
    },
    desgarro(S) {
      play(S, 'attack2'); son('sword_swing2', 0.9, { rate: 0.55 });
      S.time.delayedCall(320, () => {
        const f = delante(S, 32);
        const g = S.add.graphics().setDepth(Math.round(f.y) + 30).setBlendMode(1);
        for (let i = -1; i <= 1; i++) { g.lineStyle(3, 0xff5a3a, 1); g.lineBetween(f.x - 14 + i * 8, f.y - 18, f.x + 8 + i * 8, f.y + 16); }
        S.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
        cerca(S, f.x, f.y, 44).forEach(e => { pegar(S, e, 3, S.player.x, S.player.y); EP().sangrar && EP().sangrar(S, e, 2500); });
        S.cameras.main.shake(120, 0.006);
      });
      return 620;
    },
    pisoton(S) {
      play(S, 'attack3'); son('beast_growl', 0.7, { rate: 0.6 });
      S.time.delayedCall(420, () => {
        const f = pie(S); anilloFx(S, f.x, f.y, 0xe0c090, 8, 96, 380, 5); S.cameras.main.shake(220, 0.01); son('ck_explosion', 0.6) || son('sword_hit', 0.9, { rate: 0.5 });
        cerca(S, f.x, f.y, 90).forEach(e => { pegar(S, e, 2, f.x, f.y, 'embestida'); EP().aturdir && EP().aturdir(S, e, 1500); });
      });
      return 760;
    },
    avalancha(S) {
      play(S, 'attack3'); son('beast_growl', 0.8, { rate: 0.5 });
      tx(S, 'ck_peña', 18, 16, g => { g.fillStyle = '#1b1517'; g.fillRect(2, 1, 14, 14); g.fillRect(0, 4, 18, 9); g.fillStyle = '#6a625a'; g.fillRect(2, 3, 14, 10); g.fillRect(1, 5, 16, 6); g.fillStyle = '#9a9084'; g.fillRect(4, 4, 6, 4); g.fillStyle = '#4a433e'; g.fillRect(10, 9, 5, 3); });
      const [dx, dy] = dir(S), p = S.player;
      [-0.35, 0, 0.35].forEach((a, i) => S.time.delayedCall(380 + i * 120, () => {
        const ca = Math.cos(a), sa = Math.sin(a), vx = dx * ca - dy * sa, vy = dx * sa + dy * ca;
        const o = S.add.image(p.x + vx * 20, p.y + 8 + vy * 16, 'ck_peña').setScale(2).setDepth(Math.round(p.y) + 10);
        const ya = new Set(); let t = 0;
        const ev = S.time.addEvent({ delay: 16, loop: true, callback: () => {
          t += 16; o.x += vx * 4.2; o.y += vy * 3.6; o.angle += 9; o.setDepth(Math.round(o.y) + 10);
          cerca(S, o.x, o.y, 22).forEach(e => { if (ya.has(e)) return; ya.add(e); pegar(S, e, 2, o.x, o.y); S.cameras.main.shake(60, 0.004); });
          if (t > 900) { ev.remove(); S.tweens.add({ targets: o, alpha: 0, duration: 150, onComplete: () => o.destroy() }); }
        } });
      }));
      return 720;
    },
    mordisco(S) {
      play(S, 'attack1'); son('beast_growl', 0.9, { rate: 1.1 });
      S.time.delayedCall(240, () => {
        const f = delante(S, 26), ls = cerca(S, f.x, f.y, 38);
        if (ls.length) { pegar(S, ls[0], 2, S.player.x, S.player.y); if (S.health < S.maxHealth) { S.health++; S.updateHUD && S.updateHUD(); S.createFloatingText(S.player.x, S.player.y - 40, '+1 VIDA', 0x22c55e); } }
        anilloFx(S, f.x, f.y, 0x9aff9a, 4, 24, 220, 2);
      });
      return 520;
    },
    espiritu(S) {
      son('ck_nova', 0.6, { rate: 0.7 }) || son('beast_growl', 0.6, { rate: 0.8 });
      const p = S.player, t0 = S.time.now;
      S._ckFrenesi = Math.max(S._ckFrenesi || 0, S.time.now + 4000);
      const fantasma = S.add.sprite(p.x, p.y, p.texture.key, p.frame.name).setTint(0x7dff9a).setAlpha(0.5).setScale(p.scaleX * 1.6, p.scaleY * 1.6).setBlendMode(1).setFlipX(p.flipX);
      S.tweens.add({ targets: fantasma, alpha: 0, y: p.y - 30, duration: 900, onComplete: () => fantasma.destroy() });
      let curado = 0;
      const ev = S.time.addEvent({ delay: 2000, repeat: 1, callback: () => { if (S.isDead || !esOso(S)) return; if (S.health < S.maxHealth) { S.health++; curado++; S.updateHUD && S.updateHUD(); S.createFloatingText(p.x, p.y - 40, '+1 VIDA', 0x22c55e); } luz(p.x, p.y, [130, 255, 150], 120, 300); } });
      return 200;
    },
    hibernar(S) {
      const p = S.player; play(S, 'hurt'); p.anims.pause && p.anims.pause();
      S._osoHiberna = S.time.now + 2000; son('beast_growl', 0.4, { rate: 0.5 });
      const z = S.add.text(p.x + 8, p.y - 30, 'z z', { fontFamily: 'CK Grenze, serif', fontSize: '18px', fontStyle: 'bold', color: '#ffffff', stroke: '#1b0f0a', strokeThickness: 4 }).setDepth(30000);
      S.tweens.add({ targets: z, y: p.y - 56, alpha: 0.2, duration: 2000, onComplete: () => z.destroy() });
      S.time.delayedCall(2000, () => {
        if (S.isDead) return; p.anims.resume && p.anims.resume();
        S.stamina = S.maxStamina; S.updateStaminaBar && S.updateStaminaBar();
        if (S.health < S.maxHealth) { S.health++; S.updateHUD && S.updateHUD(); }
        S.createFloatingText(p.x, p.y - 44, '¡DESPIERTO!', 0xffc040);
      });
      return 2000;
    }
  });

  // base: rugido (Q) y remolino de garras (E)
  Object.assign(EQ.BASE, {
    b_rugido: { h: OSO, n: 'Rugido', ic: 'rugido', d: 'De base: un rugido que aturde 1,5 s a las bestias de alrededor y las hace retroceder. 30 de furia, 8 s.', cost: 30, cdMs: 8000 },
    b_remolino: { h: OSO, n: 'Remolino de garras', ic: 'remolino_oso', d: 'De base: gira con las garras afuera y corta todo alrededor (1, tres veces). 30 de furia, 4 s.', cost: 30, cdMs: 4000 }
  });
  EQ.BASE_DE[OSO] = ['b_rugido', 'b_remolino'];
  Object.assign(EQ.hacerBase, {
    b_rugido(S) {
      const p = S.player; play(S, 'attack3'); son('beast_growl', 1, { rate: 0.6 }); S.cameras.main.shake(260, 0.008);
      [0, 120, 240].forEach(t => S.time.delayedCall(t, () => anilloFx(S, p.x, p.y - 4, 0xfff0d0, 10, 120, 420, 3)));
      cerca(S, p.x, p.y, 115).forEach(e => { EP().aturdir && EP().aturdir(S, e, 1500); if (e.body) { const a = Math.atan2(e.y - p.y, e.x - p.x); e.body.setVelocity(Math.cos(a) * 240, Math.sin(a) * 240); } });
      return 520;
    },
    b_remolino(S) {
      const p = S.player; play(S, 'attack2'); p.anims.timeScale = 1.4;
      for (let i = 0; i < 3; i++) S.time.delayedCall(120 + i * 200, () => { son('sword_swing1', 0.6, { rate: 0.7 + i * 0.1 }); anilloFx(S, p.x, p.y, 0xffb070, 8, 52, 200, 3); cerca(S, p.x, p.y, 54).forEach(e => pegar(S, e, 1, p.x, p.y)); });
      S.time.delayedCall(720, () => { p.anims.timeScale = 1; });
      return 700;
    }
  });
  EQ.ponerIconos && EQ.ponerIconos();

  // ================================================================== MISIÓN: el oso de la jaula
  // Por ahora en las Tierras Orcas, al pie del camino del norte que va a la zona de las bestias. Cuando llegue el mapa del
  // Claro de las Bestias (Flow), se cambia ZP y JAULA y listo.
  const ZP = 'ed_tierras_orcas', JAULA = { x: 590, y: 140 };
  const st = S => { const s = S.story; if (!s) return 0; s.flags = s.flags || {}; return s.flags.oso || 0; };   // 0 nada, 1 habló, 2 tiene la llave, 3 libre
  const ponerSt = (S, v) => { if (S.story) { S.story.flags.oso = v; S.saveStory && S.saveStory(); } };
  const nota = t => { try { window.CK_SIN_CARTELES_API && window.CK_SIN_CARTELES_API.nota(t); } catch (e) {} };
  const enPueblo = S => !!(S.currentZoneKey && S.currentZoneKey() === ZP + '.main' && S.currentInterior && S.currentInterior.area);
  const abierta = S => st(S) >= 3 || S.playerHero === OSO;
  // la jaula (dibujada por código): postes de madera, barrotes de hierro, techo de tablas; y la misma con la puerta abierta
  const texJaula = S => {
    const mk = (k, abre) => {
      if (S.textures.exists(k)) return;
      const c = document.createElement('canvas'); c.width = 46; c.height = 48; const g = c.getContext('2d');
      const r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
      r('#1b1210', 1, 44, 44, 4); r('#3a2a1c', 2, 44, 42, 3);                       // base
      r('#1b1210', 0, 4, 46, 7); r('#6a4a2c', 1, 5, 44, 5); r('#8a6438', 1, 5, 44, 1); r('#4a321e', 1, 9, 44, 1);   // techo
      [[1], [41]].forEach(([x]) => { r('#1b1210', x, 4, 5, 42); r('#7a5634', x + 1, 5, 3, 40); r('#9a7044', x + 1, 5, 1, 40); });  // postes
      for (let i = 0; i < 6; i++) { const x = 8 + i * 6; if (abre && i >= 2 && i <= 4) continue; r('#16161c', x, 10, 3, 34); r('#5a5e6a', x + 1, 10, 1, 34); }
      r('#16161c', 5, 26, 36, 3); r('#5a5e6a', 6, 27, 34, 1);                       // travesaño
      if (abre) { r('#16161c', 40, 12, 3, 30); r('#5a5e6a', 41, 12, 1, 30); }      // la puerta abierta, contra el poste
      else { r('#c9a24a', 22, 25, 4, 5); r('#1b1210', 23, 27, 2, 2); }             // candado
      S.textures.addCanvas(k, c);
    };
    mk('ck_jaula', false); mk('ck_jaula_abierta', true);
  };
  const pr1 = P.preload;
  P.preload = function () { if (pr1) pr1.apply(this, arguments); try { texJaula(this); } catch (e) {} };
  // la jaula en el mapa, con su choque
  const L0 = typeof INTERIOR_LAYOUTS !== 'undefined' && INTERIOR_LAYOUTS[ZP];
  if (L0) INTERIOR_LAYOUTS[ZP] = function (kit) {
    const r = L0.apply(this, arguments);
    try {
      const a = kit.areas && kit.areas.main;
      if (a) {
        a.items.push({ key: 'ck_jaula', x: JAULA.x, baseY: JAULA.y, scale: 1, _ckJaula: true });
        (a.colliders = a.colliders || []).push({ x: JAULA.x - 22, y: JAULA.y - 10, w: 44, h: 10 });
      }
    } catch (e) { console.warn('[jaula]', e); }
    return r;
  };
  let osoEnJaula = null, marca = null;
  const sacarOso = () => { if (osoEnJaula) { osoEnJaula.destroy(); osoEnJaula = null; } if (marca) { marca.destroy(); marca = null; } };
  const spriteJaula = S => S.children.list.find(o => o.texture && (o.texture.key === 'ck_jaula' || o.texture.key === 'ck_jaula_abierta') && o.active);
  const prepararJaula = S => {
    sacarOso();
    if (!enPueblo(S)) return;
    const a = S.currentInterior.area, j = spriteJaula(S);
    if (j && abierta(S)) j.setTexture('ck_jaula_abierta');
    if (abierta(S)) return;
    const x = a.x + JAULA.x, y = a.y + JAULA.y;
    osoEnJaula = S.add.sprite(x, y - 5, OSO + '_idle').setOrigin(0.5, 0.6).setScale(1.15).setDepth((j ? j.depth : y) - 0.5);
    if (S.anims.exists(OSO + '_idle')) osoEnJaula.play(OSO + '_idle');
    marca = S.add.text(x, y - 66, st(S) >= 2 ? '🔑' : '!', { fontFamily: "'CK Grenze', serif", fontSize: '22px', fontStyle: 'bold', color: '#ffe08a', stroke: '#1b0f0a', strokeThickness: 5 }).setOrigin(0.5).setDepth(30000);
    S.tweens.add({ targets: marca, y: y - 72, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (st(S) === 0 && !S._ckOsoAviso) { S._ckOsoAviso = true; S.time.delayedCall(1500, () => nota('Se oye un gruñido que viene de una jaula, junto al camino del norte…')); }
    if (st(S) === 1) carcelero(S);
  };
  // los carceleros: Garra Negra, el jefe de la manada (con la llave), dos hombres oso oscuros y un hombre lobo
  const carcelero = S => {
    if (!enPueblo(S) || st(S) !== 1) return;
    if (S.enemies.getChildren().some(e => e.active && !e.isDead && e._ckCarcelero)) return;
    const a = S.currentInterior.area, bx = a.x + JAULA.x, by = a.y + JAULA.y;
    [['werebear', -90, 70], ['werebear', 110, 60], ['werewolf', 30, 110]].forEach(([t, dx, dy]) => { const g = S.spawnEnemy(bx + dx, by + dy, t); if (g) g._ckManada = true; });
    const e = S.spawnEnemy(bx + 150, by + 20, ENEMY_TYPES.werebear_jefe ? 'werebear_jefe' : 'werebear');
    if (!e) return;
    e._ckCarcelero = true;
    const t = S.add.text(e.x, e.y - 50, 'Garra Negra', { fontFamily: "'CK Grenze', serif", fontSize: '14px', fontStyle: 'bold', color: '#ffe08a', stroke: '#1b0f0a', strokeThickness: 4 }).setOrigin(0.5).setDepth(30000);
    const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => { if (!e.active || e.isDead) { t.destroy(); ev.remove(); return; } t.setPosition(e.x, e.y - 56); } });
  };
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () { const r = ms0 ? ms0.apply(this, arguments) : undefined; try { prepararJaula(this); } catch (e) { console.warn('[jaula]', e); } return r; };
  const dm0 = P.damageEnemy;
  P.damageEnemy = function (enemy) {
    const r = dm0.apply(this, arguments);
    try {
      if (enemy && enemy._ckCarcelero && (enemy.isDead || !enemy.active) && st(this) === 1) {
        enemy._ckCarcelero = false; ponerSt(this, 2);
        this.createFloatingText(enemy.x, enemy.y - 40, '¡LA LLAVE DE LA JAULA!', 0xffe08a);
        try { sfx.fx('coin', 0.8) || sfx.playHeartPickup(); } catch (e) {}
        if (marca) marca.setText('🔑');
        nota('Tenés la llave: volvé a la jaula y apretá T');
      }
    } catch (e) {}
    return r;
  };
  // hablar con el oso (T)
  const ic0 = P.interact;
  P.interact = function () {
    try {
      if (!this._overlay && !this.dialogOpen && this._gameMode === 'campaign' && !this.isDead && enPueblo(this) && !abierta(this)) {
        const a = this.currentInterior.area, b = this.player.body;
        if (Phaser.Math.Distance.Between(b.center.x, b.bottom, a.x + JAULA.x, a.y + JAULA.y + 6) < 58) {
          const cara = OSO + '_idle';
          if (st(this) < 2) {
            this.openDialog('Urso', [
              '¡Eh, vos! No me mires así: no soy como ellos.',
              'Me llamo Urso. Vengo de los hielos del norte. Mi propia raza, la manada de Garra Negra, me tiene enjaulado porque no quise pelear para ellos.',
              'Ahora se pelean con los orcos por estas tierras y me quieren de carnada. La llave la tiene Garra Negra, el jefe: anda cerca, con sus lobos. Vencelo y traémela.'
            ], () => { if (st(this) < 1) ponerSt(this, 1); carcelero(this); nota('Misión: el oso de la jaula. Vencé a Garra Negra y traé la llave'); }, cara);
          } else {
            this.openDialog('Urso', [
              '¡La llave! Sabía que no eras como los demás.',
              '…¡Libre, por fin! Esta deuda no la olvido: cuando me necesites, voy a estar.',
              '(Urso ya se puede elegir en el Libro de Héroes)'
            ], () => soltar(this), cara);
          }
          return;
        }
      }
    } catch (e) { console.warn('[jaula]', e); }
    return ic0.apply(this, arguments);
  };
  const soltar = S => {
    ponerSt(S, 3); liberar();
    const j = spriteJaula(S); if (j) j.setTexture('ck_jaula_abierta');
    try { sfx.fx('door_open', 0.8) || sfx.fx('sword_hit', 0.5, { rate: 0.6 }); } catch (e) {}
    if (marca) { marca.destroy(); marca = null; }
    const o = osoEnJaula; osoEnJaula = null;
    if (o) {
      o.setDepth(o.y + 30);
      S.tweens.add({ targets: o, y: o.y + 40, duration: 500, onStart: () => S.anims.exists(OSO + '_walk_front') && o.play(OSO + '_walk_front'),
        onComplete: () => {
          S.createFloatingText(o.x, o.y - 40, '¡URSO SE SUMA!', 0xffe0b0);
          try { sfx.fx('beast_growl', 1, { rate: 0.8 }); } catch (e) {}
          S.tweens.add({ targets: o, x: o.x + 220, alpha: 0, duration: 1600, onStart: () => S.anims.exists(OSO + '_walk') && o.play(OSO + '_walk'), onComplete: () => o.destroy() });
        } });
    }
    nota('¡Urso se suma! Ya lo podés elegir en el Libro de Héroes');
  };

  window.CK_OSO = { OSO, ANIMS, libre, liberar, JAULA, st };
})();
