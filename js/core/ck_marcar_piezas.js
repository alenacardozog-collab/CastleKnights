'use strict';
/* Marcar piezas mal recortadas (03/11, pedido del dueño). Herramienta para el dueño, no para el jugador.
   - F9 prende y apaga el modo. Se camina normal; el clic ya no ataca, nadie te lastima y las bestias se quedan quietas.
   - Cada pieza del Taller que está en pantalla se ve con un borde fino amarillo.
   - Clic sobre una pieza que se ve mal (trae piso pegado, tapa al héroe donde no debe): queda marcada en rojo.
     Otro clic la desmarca. Clic donde no hay pieza: marca ese punto (cruz roja), para avisar de algo que no es una pieza.
   - "Descargar lista" baja piezas_marcadas.json (va a Descargas). Esa lista es la que hay que pasarle a Claude.
   - Las marcas quedan guardadas en el navegador aunque cierres el juego; "Borrar todo" las limpia.
   Borrar su línea de index.html la saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const CLAVE = 'ck_piezas_marcadas';
  let marcas = [];
  try { marcas = JSON.parse(localStorage.getItem(CLAVE) || '[]') || []; } catch (e) { marcas = []; }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(marcas)); } catch (e) {} };
  const id = m => m.mapa + '|' + m.pieza + '|' + m.x + '|' + m.y;

  const css = () => {
    if (document.getElementById('ck-marcar-css')) return;
    const st = document.createElement('style'); st.id = 'ck-marcar-css';
    st.textContent = `#ck-marcar { position: fixed; left: 12px; bottom: 12px; z-index: 99990; background: rgba(28,22,16,.92); color: #f3e6c8;
  border: 2px solid #8a6a3c; border-radius: 8px; padding: 10px 12px; font: 13px/1.35 Georgia, serif; max-width: 360px; }
#ck-marcar b { color: #fde68a; } #ck-marcar button { margin: 6px 6px 0 0; font: 600 12px Georgia, serif; padding: 4px 10px; cursor: pointer;
  background: #5b3f22; color: #fde68a; border: 1px solid #a07a44; border-radius: 4px; }`;
    document.head.appendChild(st);
  };
  const panel = S => {
    css();
    let el = document.getElementById('ck-marcar');
    if (!S._ckMarcando) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div'); el.id = 'ck-marcar';
      el.innerHTML = '<b>Marcar piezas</b> (F9 para salir) · las bestias no atacan<br>Clic sobre una pieza mal recortada para marcarla. Otro clic la desmarca.<br><span class="n"></span><br>' +
        '<button class="baj">Descargar lista</button><button class="bor">Borrar todo</button>';
      el.querySelector('.baj').onclick = () => {
        const b = new Blob([JSON.stringify({ fecha: new Date().toISOString(), marcas }, null, 1)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'piezas_marcadas.json'; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      };
      el.querySelector('.bor').onclick = () => { if (confirmar()) { marcas = []; guardar(); dibujar(S); } };
      (document.fullscreenElement || document.getElementById('game-wrapper') || document.body).appendChild(el);
    }
    const aca = marcas.filter(m => m.mapa === zona(S)).length;
    el.querySelector('.n').textContent = `Marcadas: ${marcas.length} en total, ${aca} en este mapa.`;
  };
  // sin ventanas del navegador (frenan el juego): "Borrar todo" pide un segundo clic
  let ultimoBorrar = 0;
  const confirmar = () => { const t = Date.now(); if (t - ultimoBorrar < 2500) return true; ultimoBorrar = t;
    const b = document.querySelector('#ck-marcar .bor'); if (b) { b.textContent = '¿Seguro? Clic otra vez'; setTimeout(() => { b.textContent = 'Borrar todo'; }, 2500); } return false; };
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : 'village');
  const area = S => (S.currentInterior ? S.currentInterior.area : { x: 0, y: 0 });
  const piezas = S => S.children.list.filter(o => o.visible && o.texture && typeof o.texture.key === 'string' && /^(ru_)?ed_/.test(o.texture.key) &&
    !/^(ru_)?ed_suelo/.test(o.texture.key) && o.displayWidth > 2 && o.displayWidth < 900);
  const dibujar = S => {
    if (!S._ckMarcaG || !S._ckMarcaG.active) S._ckMarcaG = S.add.graphics().setDepth(29990);
    const g = S._ckMarcaG; g.clear();
    if (!S._ckMarcando) return;
    const a = area(S), z = zona(S), cam = S.cameras.main.worldView;
    piezas(S).forEach(o => {
      const b = o.getBounds(); if (!Phaser.Geom.Rectangle.Overlaps(b, cam)) return;
      const k = o.texture.key.replace(/^ru_/, '');
      const marcada = marcas.some(m => m.mapa === z && m.pieza === k);
      g.lineStyle(marcada ? 2 : 1, marcada ? 0xff3b30 : 0xfde047, marcada ? 1 : 0.55).strokeRect(b.x, b.y, b.width, b.height);
    });
    marcas.filter(m => m.mapa === z && m.tipo === 'punto').forEach(m => {
      g.lineStyle(2, 0xff3b30, 1); g.lineBetween(a.x + m.x - 6, a.y + m.y - 6, a.x + m.x + 6, a.y + m.y + 6); g.lineBetween(a.x + m.x + 6, a.y + m.y - 6, a.x + m.x - 6, a.y + m.y + 6);
    });
    panel(S);
  };
  const clic = (S, p) => {
    const wx = p.worldX, wy = p.worldY, a = area(S), z = zona(S);
    const bajo = piezas(S).filter(o => o.getBounds().contains(wx, wy)).filter(o => {
      try {
        const fx = (wx - o.getTopLeft().x) / o.scaleX, fy = (wy - o.getTopLeft().y) / o.scaleY;
        const px = o.flipX ? o.frame.width - 1 - fx : fx;
        return S.textures.getPixelAlpha(Math.floor(px), Math.floor(fy), o.texture.key, o.frame.name) > 0;
      } catch (e) { return true; }
    }).sort((u, v) => v.depth - u.depth);
    let m;
    if (bajo.length) {
      const o = bajo[0];
      m = { mapa: z, tipo: 'pieza', pieza: o.texture.key.replace(/^ru_/, ''), x: Math.round(o.x - a.x), y: Math.round(o.y - a.y),
        donde: { x: Math.round(wx - a.x), y: Math.round(wy - a.y) } };
      // las piezas anchas se dibujan en columnas (ck_profundidad): se marca la pieza entera, por su nombre
      const i = marcas.findIndex(q => q.mapa === m.mapa && q.pieza === m.pieza);
      if (i >= 0) marcas = marcas.filter(q => !(q.mapa === m.mapa && q.pieza === m.pieza)); else marcas.push(m);
    } else {
      m = { mapa: z, tipo: 'punto', x: Math.round(wx - a.x), y: Math.round(wy - a.y) };
      const i = marcas.findIndex(q => q.tipo === 'punto' && q.mapa === z && Math.hypot(q.x - m.x, q.y - m.y) < 10);
      if (i >= 0) marcas.splice(i, 1); else marcas.push(m);
    }
    guardar(); dibujar(S);
  };

  // con F9 prendido nadie lastima al héroe y las bestias se quedan quietas (para poder marcar tranquilo)
  const dano0 = P.damagePlayer;
  if (dano0) P.damagePlayer = function () { if (this._ckMarcando) return; return dano0.apply(this, arguments); };
  const enem0 = P.updateEnemies;
  if (enem0) P.updateEnemies = function () {
    if (!this._ckMarcando) return enem0.apply(this, arguments);
    if (!this.enemies) return;
    this.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead || !e.body) return;
      e.setVelocity(0, 0);
      const k = e.type + '_idle';
      if (this.anims.exists(k) && (!e.anims.currentAnim || e.anims.currentAnim.key !== k)) e.play(k, true);
    });
  };
  ['performAttack', 'performSpecialAttack'].forEach(k => {
    const f0 = P[k]; if (!f0) return;
    P[k] = function () { if (this._ckMarcando) return; return f0.apply(this, arguments); };
  });
  const create0 = P.create;
  P.create = function () {
    const r = create0.apply(this, arguments);
    try {
      this.input.keyboard.on('keydown-F9', () => { this._ckMarcando = !this._ckMarcando; dibujar(this); panel(this); });
      this.input.on('pointerdown', p => { if (this._ckMarcando && !this.dialogOpen) clic(this, p); });
      this.time.addEvent({ delay: 250, loop: true, callback: () => { if (this._ckMarcando) dibujar(this); } });
    } catch (e) { console.warn('[marcar piezas]', e); }
    return r;
  };
  window.CK_MARCAR = { lista: () => marcas, id };
})();
