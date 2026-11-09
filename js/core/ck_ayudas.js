'use strict';
/* Carteles de ayuda de una sola vez (23/10, pulido del Capítulo 1): en los primeros minutos aparecen abajo, al lado de la
   barra rápida, solo cuando hacen falta y una sola vez por partida (quedan marcados en story.flags.ayudas):
   - al empezar: cómo moverse y correr;
   - la primera bestia cerca: atacar, ataque especial y esquivar (con las teclas que tenga configuradas el jugador);
   - la primera vez que pierde vida: la poción;
   - las primeras monedas: las tiendas;
   - al pasar a otra zona: el mapa.
   Borrar la línea de index.html los saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const tecla = id => {
    try { return KeybindsManager.formatKeyDisplay(KeybindsManager.get(id)); } catch (e) { return id; }
  };
  const AYUDAS = {
    mover: () => `Moverse: <b>flechas</b> o <b>WASD</b> · Correr: mantené <b>${tecla('run')}</b>`,
    pelear: () => `¡Una bestia! Atacar: <b>${tecla('attack')}</b> · Especial: <b>${tecla('special')}</b> · Esquivar: <b>${tecla('dash')}</b>`,
    pocion: () => 'Te lastimaron: tomá una poción con <b>Z</b> (el elixir con <b>X</b>)',
    monedas: () => 'Las monedas se gastan en las tiendas: acercate y apretá <b>T</b>',
    mapa: () => 'Con <b>M</b> se abre el mapa, con el camino a la misión en dorado'
  };

  let caja = null, cola = [], mostrando = false;
  const css = () => {
    if (document.getElementById('ck-ayuda-css')) return;
    const st = document.createElement('style'); st.id = 'ck-ayuda-css';
    // medido desde abajo del cuadro del juego (no de la ventana): queda arriba de la línea chica y del cartel "T · …"
    // aunque la página tenga otro alto o esté corrida (antes tapaba la barra rápida)
    st.textContent = `#ck-ayuda{position:absolute;left:50%;bottom:222px;transform:translate(-50%,8px);z-index:99999;pointer-events:none;
      max-width:min(560px,calc(100vw - 32px));padding:8px 16px;border-radius:6px;background:rgba(28,22,16,.88);color:#f3e6c8;
      border:2px solid #8a6a3c;box-shadow:0 6px 18px rgba(0,0,0,.45);font:600 16px Grenze,Georgia,serif;letter-spacing:.2px;
      text-align:center;opacity:0;transition:opacity .35s, transform .35s}
      #ck-ayuda.on{opacity:1;transform:translate(-50%,0)} #ck-ayuda b{color:#ffd77a}`;
    document.head.append(st);
  };
  const siguiente = () => {
    if (mostrando || !cola.length) return;
    css();
    if (!caja) { caja = document.createElement('div'); caja.id = 'ck-ayuda'; }
    // dentro del contenedor del juego: si está en pantalla completa, lo de afuera no se ve
    const donde = document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
    if (caja.parentElement !== donde) donde.append(caja);
    mostrando = true;
    caja.innerHTML = cola.shift();
    requestAnimationFrame(() => caja.classList.add('on'));
    setTimeout(() => { caja.classList.remove('on'); setTimeout(() => { mostrando = false; siguiente(); }, 450); }, 5200);
  };
  const ayudar = (S, k) => {
    const st = S.story;
    if (!st || S._gameMode !== 'campaign') return;
    const f = (st.flags = st.flags || {}), hecho = (f.ayudas = f.ayudas || {});
    if (hecho[k]) return;
    hecho[k] = true;
    cola.push(AYUDAS[k]());
    siguiente();
  };

  const u0 = P.update;
  P.update = function (time) {
    const r = u0.apply(this, arguments);
    try {
      if (this._gameMode !== 'campaign' || !this.story || !this.player || this.dialogOpen || this._overlay || this._doorTransition || this._ckEscena) return r;   // _ckEscena: intro y escenas (ck_escenas.js)
      const H = this.story.flags && this.story.flags.ayudas;
      this._ckAyT = this._ckAyT || time;
      if (time - this._ckAyT > 2500 && !(H && H.mover)) ayudar(this, 'mover');
      if (!(H && H.pelear) && this.enemies) {
        const p = this.player;
        if (this.enemies.getChildren().some(e => e.active && !e.isDead && Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y) < 200)) ayudar(this, 'pelear');
      }
      if (!(H && H.pocion) && this.health < this.maxHealth && this.health > 0) ayudar(this, 'pocion');
      if (!(H && H.monedas) && (this.story.coins || 0) > 0) ayudar(this, 'monedas');
      const z = this.currentZoneKey ? this.currentZoneKey() : '';
      if (!this._ckAyZ) this._ckAyZ = z;
      else if (z !== this._ckAyZ && !(H && H.mapa)) ayudar(this, 'mapa');
    } catch (e) {}
    return r;
  };
  window.CK_AYUDAS = { AYUDAS, ayudar };
})();
