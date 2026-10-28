'use strict';
/* Antorcha (24/10, pedido del dueño): una ranura más en la barra rápida.
   - Se compra (20 monedas) en la Tienda de Víveres, el puesto del mercado del castillo y el Posadero.
   - L la prende y la apaga. No se dibuja en el personaje: alumbra alrededor del héroe (luz cálida que titila) y se nota
     de noche, en las salas en penumbra y con tormenta.
   - Se gasta: encendida dura 5 minutos (la barrita de la ranura lo muestra). Al final se achica y titila más; cuando se
     consume, si tenés otra se prende sola. Apagada no se gasta. Con lluvia afuera alumbra un poco menos.
   - La primera noche aparece una ayuda que la explica.
   Borrar la línea de index.html la saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const DURA = 300000, PRECIO = 20, RADIO = 118, COLOR = [255, 158, 78];
  window.CK_ANTORCHA_CFG = { DURA, PRECIO, RADIO };

  // ------------------------------------------------------------------ tienda (cuando ya cargó todo)
  const instalarTienda = () => {
    if (typeof SHOP_ITEMS !== 'undefined' && !SHOP_ITEMS.find(i => i.id === 'torch'))
      SHOP_ITEMS.splice(2, 0, { id: 'torch', name: 'Antorcha', price: PRECIO, desc: 'Alumbra alrededor en la oscuridad. Encendida dura 5 min. Tecla L.', stock: true });
    const T = window.CK_TIENDAS && window.CK_TIENDAS.TIENDAS;
    if (T) T.forEach(t => { if (/Víveres|mercado|Posadero/.test(t.nombre) && !t.vende.includes('torch')) t.vende.splice(2, 0, 'torch'); });
    const A = window.CK_AYUDAS && window.CK_AYUDAS.AYUDAS;
    if (A && !A.antorcha) A.antorcha = () => 'De noche se ve poco: comprá una <b>antorcha</b> en la tienda y prendela con <b>L</b>';
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarTienda); else instalarTienda();

  // ------------------------------------------------------------------ estado (se guarda con la partida)
  const st = S => {
    const s = S.story;
    if (!s) return null;
    s.inv = s.inv || {};
    if (s.inv.torch === undefined) s.inv.torch = 0;
    s.torch = s.torch || { left: 0, on: false };
    return s;
  };
  const aviso = (S, t) => { if (window.CK_SIN_CARTELES_API) window.CK_SIN_CARTELES_API.nota(t); else if (S.player) S.createFloatingText(S.player.x, S.player.y - 44, t, 0xfde68a); };
  const sonar = k => { try { if (typeof sfx !== 'undefined') sfx.fx(k, 0.55, { minGap: 200 }); } catch (e) {} };

  P.ckAntorcha = function () {
    if (this._gameMode !== 'campaign' || this.isDead || this.dialogOpen || this._overlay || this.isGamePaused) return;
    const s = st(this);
    if (!s) return;
    const t = s.torch;
    if (t.on) { t.on = false; aviso(this, 'Apagás la antorcha'); sonar('ck_antorcha_off'); }
    else if (t.left > 0) { t.on = true; aviso(this, 'Prendés la antorcha'); sonar('ck_antorcha_on'); }
    else if (s.inv.torch > 0) { s.inv.torch--; t.left = DURA; t.on = true; aviso(this, 'Prendés una antorcha nueva'); sonar('ck_antorcha_on'); }
    else { aviso(this, 'No tenés antorchas: se compran en la tienda'); return; }
    this.saveStory && this.saveStory();
    pintar(this);
  };

  // ------------------------------------------------------------------ luz
  let parpa = 0;
  const instalarLuz = () => {
    if (!window.CK_LUZ || instalarLuz.ok) return;
    instalarLuz.ok = true;
    window.CK_LUZ.fuente((S, out) => {
      const s = S.story;
      if (!s || !s.torch || !s.torch.on || !S.player || !S.player.active || S._gameMode !== 'campaign') return;
      const b = S.player.body, x = b ? b.center.x : S.player.x, y = b ? b.center.y - 8 : S.player.y;
      const t = S.time.now, fin = Math.min(1, s.torch.left / 30000);         // los últimos 30 s se va apagando
      const lluvia = window.CK_CLIMA && window.CK_CLIMA.estado && (!S.currentInterior || S.currentInterior.area.outdoor) ? window.CK_CLIMA.estado.act.lluvia : 0;
      const ti = 0.5 * Math.sin(t * 0.011) + 0.3 * Math.sin(t * 0.027 + 1.3) + 0.2 * Math.sin(t * 0.061 + 2.1);
      const k = (0.94 + 0.06 * ti * (2 - fin)) * (0.55 + 0.45 * fin) * (1 - 0.18 * lluvia);
      out.push({ x, y, r: RADIO * k, c: COLOR, f: 0.95 * (0.7 + 0.3 * fin) });
      out.push({ x, y: y - 4, r: RADIO * 0.38 * k, c: [255, 214, 150], f: 0.55 });
    });
  };

  // ------------------------------------------------------------------ ranura en la barra rápida
  let caja = null;
  const icono = (() => {
    const c = document.createElement('canvas'); c.width = 25; c.height = 24;
    const g = c.getContext('2d'), p = (col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // palo
    for (let i = 0; i < 12; i++) { p('#2a1608', 13 - Math.floor(i / 3), 11 + i, 3, 1); p('#7a4a22', 14 - Math.floor(i / 3), 11 + i, 1, 1); }
    // cabeza con trapo
    p('#2a1608', 11, 8, 7, 5); p('#6b5038', 12, 9, 5, 3); p('#8f6e4e', 12, 9, 5, 1);
    // llama
    p('#7a1f08', 11, 2, 7, 6); p('#e8501c', 12, 2, 5, 6); p('#ff9a2e', 13, 3, 3, 5); p('#ffe08a', 14, 5, 1, 3); p('#e8501c', 14, 0, 1, 2); p('#ff9a2e', 15, 1, 1, 1);
    return c.toDataURL();
  })();
  const css = () => {
    if (document.getElementById('ck-ant-css')) return;
    const A = window.CK_UI2_ARTE || {};
    const u = n => (A[n] ? 'url("' + A[n] + '")' : 'none');
    const s = document.createElement('style'); s.id = 'ck-ant-css';
    s.textContent = `#ck-antorcha{position:absolute;left:calc(50% + 122px);bottom:30px;width:70px;height:94px;z-index:40;pointer-events:none;display:none;
      background:${u('ranura_rapida')} 0 0/100% 100% no-repeat;image-rendering:pixelated;transition:opacity .2s}
      #ck-antorcha.on{display:block} body.ck2-dlg #ck-antorcha{opacity:0}
      #ck-antorcha i{position:absolute;left:10px;top:20px;width:50px;height:48px;background:url("${icono}") 0 0/100% 100% no-repeat;image-rendering:pixelated;filter:grayscale(.75) brightness(.7)}
      #ck-antorcha.prendida i{filter:none;animation:ckAntLlama .9s ease-in-out infinite alternate}
      @keyframes ckAntLlama{from{filter:brightness(1)}to{filter:brightness(1.25) drop-shadow(0 0 6px rgba(255,150,60,.9))}}
      #ck-antorcha b{position:absolute;left:50%;bottom:-18px;transform:translateX(-50%);width:34px;height:20px;line-height:20px;text-align:center;
        background:${u('etiqueta_tecla')} 0 0/100% 100%;image-rendering:pixelated;font:700 14px 'CK Grenze',Grenze,serif;color:#f3e6c8}
      #ck-antorcha span{position:absolute;right:8px;bottom:14px;font:700 17px 'CK Grenze',Grenze,serif;color:#fff;text-shadow:0 2px 0 #000,0 0 3px #000}
      #ck-antorcha em{position:absolute;left:12px;right:12px;top:12px;height:5px;background:rgba(0,0,0,.55);border:1px solid #1b0f0a}
      #ck-antorcha em::after{content:'';position:absolute;left:0;top:0;bottom:0;width:var(--q,0%);background:linear-gradient(90deg,#c2410c,#fbbf24)}`;
    document.head.append(s);
  };
  const pintar = S => {
    const s = st(S);
    if (!s) return;
    css();
    const host = document.getElementById('game-wrapper') || document.body;
    if (!caja) { caja = document.createElement('div'); caja.id = 'ck-antorcha'; caja.innerHTML = '<em></em><i></i><span></span><b>L</b>'; caja.title = 'Antorcha'; }
    if (caja.parentElement !== host) host.appendChild(caja);
    const q = document.getElementById('ck-quick');
    caja.classList.toggle('on', !!(q && q.classList.contains('on')) && S._gameMode === 'campaign');
    caja.classList.toggle('prendida', !!s.torch.on);
    caja.querySelector('span').textContent = s.inv.torch;
    caja.querySelector('em').style.setProperty('--q', Math.round(100 * s.torch.left / DURA) + '%');
    caja.querySelector('em').style.visibility = s.torch.left > 0 ? 'visible' : 'hidden';
  };

  const q0 = P.updateQuickBar;
  P.updateQuickBar = function () { const r = q0.apply(this, arguments); try { pintar(this); } catch (e) {} return r; };
  const i0 = P.initExtras;
  P.initExtras = function () {
    const r = i0.apply(this, arguments);
    try {
      st(this); instalarLuz();
      if (!this._ckAntKey) { this._ckAntKey = true; this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L).on('down', () => this.ckAntorcha()); }
      pintar(this);
    } catch (e) { console.warn('[antorcha]', e); }
    return r;
  };
  const e0 = P.endExtras;
  P.endExtras = function () { const r = e0.apply(this, arguments); if (caja) caja.classList.remove('on'); return r; };

  let acum = 0;
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      const s = this.story;
      if (this._gameMode !== 'campaign' || !s || !s.torch) return r;
      if (s.torch.on && !this.isGamePaused && !this.dialogOpen && !this._overlay) {
        s.torch.left -= Math.min(delta || 16, 100);
        if (s.torch.left <= 0) {
          s.torch.left = 0; s.torch.on = false;
          if (s.inv.torch > 0) { s.inv.torch--; s.torch.left = DURA; s.torch.on = true; aviso(this, 'La antorcha se consumió: prendés otra'); }
          else aviso(this, 'La antorcha se consumió');
          sonar('ck_antorcha_off');
          this.saveStory && this.saveStory();
        }
      }
      // la primera noche, la ayuda
      if (window.CK_AYUDAS && this.isNight && this.isNight() && !(s.flags && s.flags.ayudas && s.flags.ayudas.antorcha) && window.CK_AYUDAS.AYUDAS.antorcha) window.CK_AYUDAS.ayudar(this, 'antorcha');
      if ((acum += delta || 16) > 500) { acum = 0; pintar(this); }
    } catch (e) {}
    return r;
  };
  window.CK_ANTORCHA = { pintar, DURA };
})();
