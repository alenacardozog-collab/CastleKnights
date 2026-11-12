'use strict';
/* Barras de vida y nombres con personalidad (10/11, pedido del dueño: "que sus barras de vida y nombres aparezcan mejor
   que como están, dales personalidad").
   - ENEMIGOS COMUNES: la barrita roja plana pasa a ser una barra pixel con marco, brillo arriba, sombra abajo, una
     rayita por cada corazón de vida y el "rastro" del daño (la parte que se pierde queda clara un instante y se va
     vaciando, como en los juegos de pelea). El color dice qué es: rojo los orcos y la gente, verde ácido los no
     muertos, ámbar las bestias. Las veteranas llevan el marco dorado. Si pasan 4 s sin recibir golpes, se aclara.
   - JEFES: en vez de la barrita violeta sobre la cabeza, una barra grande abajo de la pantalla (tipo Dark Souls /
     Hollow Knight) con el nombre en su tipografía (la misma de su presentación, ck_presentaciones.js), su título,
     el color de su tema, el rastro del daño, la marca de la segunda fase al 50 % y un temblor con cada golpe.
     Aparece cuando el jefe entra en pelea y se rompe y desaparece cuando cae.
   - NOMBRES DE LA GENTE: los carteles de nombre de los aldeanos pasan a una letra medieval con contorno marrón.
   Va después de ck_presentaciones.js (si no está, los jefes usan la letra orca). Borrar su línea de index.html deja
   las barras de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const PR = () => window.CK_PRESENTACIONES;

  const NO_MUERTO = /skel|necro|zomb|ghoul|wraith|lich|bone|ghost|fantasma|espectro|esquel|muert/i;
  const BESTIA = /warg|wolf|lobo|boar|jabal|bear|oso|spider|ara(ñ|n)a|bestia|rat|bat|slime|gorila|huargo/i;
  const COLOR = {
    rojo: { luz: 0xff8a6e, base: 0xd8342c, sombra: 0x7a1414, fondo: 0x2a0b0b },
    verde: { luz: 0xd4ffa8, base: 0x79d64e, sombra: 0x2f6b25, fondo: 0x0d1f0f },
    ambar: { luz: 0xffd28a, base: 0xe8902a, sombra: 0x8a4b10, fondo: 0x2a1606 }
  };
  const colorDe = e => NO_MUERTO.test(e.type || '') ? COLOR.verde : BESTIA.test(e.type || '') ? COLOR.ambar : COLOR.rojo;

  // ------------------------------------------------------------------ barras chicas
  const dibujar = (S, e, now) => {
    const g = e.hpBar, def = e.def || {};
    const k = Math.max(0, Math.min(1, e.hp / e.maxHp));
    if (e._ckbK === undefined) { e._ckbK = k; e._ckbRastro = k; e._ckbUlt = -1e9; }
    if (k < e._ckbK - 1e-4) { e._ckbUlt = now; e._ckbDesde = now + 380; }
    if (k > e._ckbK) e._ckbRastro = k;
    e._ckbK = k;
    if (e._ckbRastro > k && now > (e._ckbDesde || 0)) e._ckbRastro = Math.max(k, e._ckbRastro - 0.0012 * (S.game.loop.delta || 16));
    g.clear();
    if (k >= 1 || e.hp <= 0) { g.setAlpha(1); return; }
    const C = colorDe(e), max = e.maxHp, jefe = !!def.boss;
    const w = jefe ? 46 : Math.max(20, Math.min(36, Math.round(14 + max * 3))), h = 4;
    const bx = Math.round(e.x - w / 2), by = Math.round(e.y - (jefe ? 52 : 34));
    g.setAlpha(now - e._ckbUlt > 4000 ? 0.45 : 1);
    // marco (dorado si es veterana)
    g.fillStyle(e._ckVeterana ? 0xd4a017 : 0x000000, e._ckVeterana ? 1 : 0.9); g.fillRect(bx - 1, by - 1, w + 2, h + 2);
    if (!e._ckVeterana) { g.fillStyle(0x000000, 0.35); g.fillRect(bx, by + h + 1, w + 1, 1); }
    g.fillStyle(C.fondo, 1); g.fillRect(bx, by, w, h);
    // rastro del daño
    const wr = Math.round(w * e._ckbRastro), wv = Math.round(w * k);
    if (wr > wv) { g.fillStyle(0xfff0b8, 1); g.fillRect(bx + wv, by, wr - wv, h); }
    // vida: base, brillo arriba, sombra abajo (blanca un instante al recibir el golpe)
    if (wv > 0) {
      const blanco = now - e._ckbUlt < 90;
      g.fillStyle(blanco ? 0xffffff : C.base, 1); g.fillRect(bx, by, wv, h);
      if (!blanco) {
        g.fillStyle(C.luz, 1); g.fillRect(bx, by, wv, 1);
        g.fillStyle(C.sombra, 1); g.fillRect(bx, by + h - 1, wv, 1);
      }
    }
    // una rayita por corazón
    if (max > 1 && max <= 12) {
      g.fillStyle(0x000000, 0.55);
      for (let i = 1; i < max; i++) { const x = bx + Math.round(w * i / max); g.fillRect(x, by, 1, h); }
    }
  };

  // ------------------------------------------------------------------ barra de jefe (abajo de la pantalla)
  let cssOk = false;
  const css = () => {
    if (cssOk) return; cssOk = true;
    const st = document.createElement('style'); st.id = 'ckb-css';
    st.textContent = `
#ckb-jefe { position: fixed; z-index: 7400; pointer-events: none; transform: translate(-50%, -30px); opacity: 0; transition: opacity .35s, transform .45s cubic-bezier(.2,1.2,.4,1); }
#ckb-jefe.on { opacity: 1; transform: translate(-50%, 0); }
#ckb-jefe.cae { opacity: 0; transform: translate(-50%, -8px) scale(1.04); transition: opacity .9s .5s, transform 1.2s .3s; }
#ckb-jefe .ckb-cab { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin: 0 6px 3px; }
#ckb-jefe .ckb-nom { display: flex; align-items: flex-end; filter: drop-shadow(0 2px 0 #000); }
#ckb-jefe .ckb-nom canvas { image-rendering: pixelated; display: block; }
body.ckb-jefe-on #ck-reloj { opacity: 0 !important; }
#ckb-jefe .ckb-tit { font: 15px 'Pirata One', MedievalSharp, serif; color: #f3e6c8; letter-spacing: .04em; text-shadow: 0 2px 0 #000; opacity: .9; white-space: nowrap; }
#ckb-jefe .ckb-marco { position: relative; height: 16px; background: #120707; border: 2px solid #000; outline: 2px solid var(--borde); box-shadow: 0 0 0 4px #000, 0 6px 14px rgba(0,0,0,.6), inset 0 2px 0 rgba(0,0,0,.6); }
#ckb-jefe .ckb-marco::before, #ckb-jefe .ckb-marco::after { content: ''; position: absolute; top: 50%; width: 10px; height: 10px; background: var(--acento); border: 2px solid #000; transform: translateY(-50%) rotate(45deg); z-index: 3; }
#ckb-jefe .ckb-marco::before { left: -13px; } #ckb-jefe .ckb-marco::after { right: -13px; }
#ckb-jefe .ckb-rastro, #ckb-jefe .ckb-vida { position: absolute; left: 0; top: 0; bottom: 0; }
#ckb-jefe .ckb-rastro { background: #fff0b8; transition: width .7s .4s cubic-bezier(.4,0,.6,1); }
#ckb-jefe .ckb-vida { background: var(--relleno); transition: width .12s; box-shadow: inset 0 3px 0 rgba(255,255,255,.35), inset 0 -3px 0 rgba(0,0,0,.35); }
#ckb-jefe .ckb-vida.golpe { background: #fff; }
#ckb-jefe .ckb-seg { position: absolute; inset: 0; background: repeating-linear-gradient(90deg, transparent 0 calc(10% - 2px), rgba(0,0,0,.45) calc(10% - 2px) 10%); z-index: 2; }
#ckb-jefe .ckb-fase { position: absolute; left: 50%; top: -5px; bottom: -5px; width: 4px; margin-left: -2px; background: var(--acento); border: 1px solid #000; z-index: 2; }
#ckb-jefe.fase2 .ckb-fase { opacity: .35; }
#ckb-jefe.tiembla { animation: ckbTiembla .16s linear; }
@keyframes ckbTiembla { 25% { translate: -3px 1px; } 50% { translate: 3px -1px; } 75% { translate: -2px 0; } }
`;
    document.head.appendChild(st);
  };
  // (11/11, "no coloques algo genérico": los jefes que no están en el elenco de las presentaciones tienen igual su nombre
  // con tipografía propia y su título; Garra Negra, el jefe de los osos, no llevaba boss:true y caía en la barrita chica)
  const EXTRA = {
    werebear_jefe: { nombre: 'GARRA NEGRA', titulo: 'Señor de los osos', fuente: 'hueso', colores: ['#fff0d8', '#d08a3a', '#5a2a0a'], contorno: '#1a0c04', col: 'ambar', acento: '#e8902a', borde: '#4a2a10' }
  };
  const esJefe = e => !!((e.def && e.def.boss) || EXTRA[e.type] || (window.CK_JEFES_FX && CK_JEFES_FX.JEFES && CK_JEFES_FX.JEFES[e.type]));
  const RELLENO = { rojo: 'linear-gradient(180deg,#ff8a6e,#d8342c 45%,#7a1414)', verde: 'linear-gradient(180deg,#d4ffa8,#79d64e 45%,#2f6b25)', ambar: 'linear-gradient(180deg,#ffd28a,#e8902a 45%,#8a4b10)' };
  let barra = null;
  const crearBarra = (S, e) => {
    css();
    const pr = PR(), c = (pr && pr.POR_TIPO[e.type]) || null, x = EXTRA[e.type];
    const el = document.createElement('div'); el.id = 'ckb-jefe';
    const nom = document.createElement('div'); nom.className = 'ckb-nom';
    const tit = document.createElement('div'); tit.className = 'ckb-tit';
    const cab = document.createElement('div'); cab.className = 'ckb-cab'; cab.append(nom, tit);
    const marco = document.createElement('div'); marco.className = 'ckb-marco';
    const rastro = document.createElement('div'); rastro.className = 'ckb-rastro';
    const vida = document.createElement('div'); vida.className = 'ckb-vida';
    const seg = document.createElement('div'); seg.className = 'ckb-seg';
    const fase = document.createElement('div'); fase.className = 'ckb-fase';
    marco.append(rastro, vida, seg, fase);
    el.append(cab, marco);
    const def = e.def || {}, nombre = c ? c.nombre : (def.name || def.nombre || 'Jefe').split(',')[0];
    if (pr) {
      const wb = Math.min(560, innerWidth * 0.46), txt = c ? c.nombre : x ? x.nombre : nombre, fu = c ? c.fuente : x ? x.fuente : 'orco';
      const esc = pr.anchoNombre(fu, txt.toUpperCase()) * 2 <= wb * 0.62 ? 2 : 1;
      if (c || !x || !pr.nombreEn) pr.pintarNombre(nom, c ? c.id : null, txt, esc);
      else pr.nombreEn(nom, fu, txt.toUpperCase().replace(/Ñ/g, 'N').replace(/[^A-Z ]/g, ''), x.colores, x.contorno, esc);
    } else { nom.textContent = nombre; nom.style.font = "18px 'Pirata One', MedievalSharp, serif"; nom.style.color = '#ffd6c4'; }
    tit.textContent = c ? c.titulo : x ? x.titulo : ((def.name || '').split(',')[1] || '').trim();
    const col = c ? (c.tema === 'niebla' ? 'verde' : c.id === 'kragmor' || c.id === 'ulrak' ? 'ambar' : 'rojo') : x ? x.col : (NO_MUERTO.test(e.type) ? 'verde' : BESTIA.test(e.type) ? 'ambar' : 'rojo');
    el.style.setProperty('--relleno', c && c.tema === 'niebla' && c.id === 'nigro' ? 'linear-gradient(180deg,#e2b8ff,#9b4dde 45%,#4a1a78)' : RELLENO[col]);
    el.style.setProperty('--acento', c ? c.acento : x ? x.acento : '#e0483a');
    el.style.setProperty('--borde', c ? c.banda[1] : x ? x.borde : '#3a1010');
    document.body.classList.add('ckb-jefe-on');
    (document.getElementById('game-wrapper') || document.body).appendChild(el);
    barra = { S, e, el, vida, rastro, k: 1, ult: e.hp };
    ubicar();
    requestAnimationFrame(() => el.classList.add('on'));
  };
  const ubicar = () => {
    if (!barra) return;
    let r = { left: 0, top: 0, width: innerWidth, height: innerHeight };
    try { const cv = barra.S.game.canvas; const q = cv.getBoundingClientRect(); if (q.width > 50) r = q; } catch (e) {}
    // arriba al centro, entre el minimapa y el objetivo (abajo están la ficha del héroe y la barra de habilidades)
    const w = Math.round(Math.min(560, r.width * 0.46));
    Object.assign(barra.el.style, { left: Math.round(r.left + r.width / 2) + 'px', top: Math.round(r.top + 10) + 'px', width: w + 'px' });
    return w;
  };
  addEventListener('resize', ubicar);
  const quitarBarra = (cae) => {
    if (!barra) return;
    const el = barra.el; barra = null; document.body.classList.remove('ckb-jefe-on');
    if (cae) { el.querySelector('.ckb-vida').style.width = '0%'; el.classList.add('cae'); setTimeout(() => el.remove(), 1700); }
    else { el.classList.remove('on'); setTimeout(() => el.remove(), 450); }
  };
  const actualizarBarra = (S) => {
    const b = barra, e = b.e;
    if (!e.active || e.isDead || e.hp <= 0) { quitarBarra(true); return; }
    const zona = S.currentZoneKey ? S.currentZoneKey() : '';
    if (b.zona === undefined) b.zona = zona;
    if (b.zona !== zona || S._gameMode !== 'campaign') { quitarBarra(false); return; }
    const k = Math.max(0, Math.min(1, e.hp / e.maxHp));
    if (Math.abs(k - b.k) > 1e-4) {
      b.vida.style.width = (k * 100).toFixed(2) + '%';
      b.rastro.style.width = (k * 100).toFixed(2) + '%';
      if (k < b.k) {
        b.el.classList.remove('tiembla'); void b.el.offsetWidth; b.el.classList.add('tiembla');
        b.vida.classList.add('golpe'); setTimeout(() => b.vida.classList.remove('golpe'), 70);
      }
      b.k = k;
      b.el.classList.toggle('fase2', k <= 0.5);
    }
    if (!b.puesto) { b.vida.style.width = b.rastro.style.width = (k * 100).toFixed(2) + '%'; b.puesto = true; }
    const pr = PR(), dlg = S.dialogOpen || (pr && pr.activa());
    b.el.style.visibility = dlg ? 'hidden' : '';
  };
  const enPelea = (S, e) => {
    if (!e.active || e.isDead || !e.visible || e.alpha < 0.6) return false;
    const v = S.cameras.main.worldView;
    if (!Phaser.Geom.Rectangle.Contains(v, e.x, e.y)) return false;
    return e.state === 'chase' || e.hp < e.maxHp || Phaser.Math.Distance.Between(e.x, e.y, S.player.x, S.player.y) < 260;
  };

  // ------------------------------------------------------------------ cartelitos de nombre
  const estiloNombre = t => {
    if (!t || t._ckb) return; t._ckb = true;
    try {
      t.setStyle({ fontFamily: "MedievalSharp, Pixuf, serif", fontSize: '11px', color: '#fff0c2', stroke: '#2b1608', strokeThickness: 4 });
      t.setShadow(0, 2, 'rgba(0,0,0,.65)', 0, true, false);
    } catch (e) {}
  };

  // ------------------------------------------------------------------ en cada cuadro, después de todo lo demás
  const ue0 = P.updateEnemies;
  P.updateEnemies = function () {
    const r = ue0.apply(this, arguments);
    try {
      const now = this.time.now, jefes = [];
      this.enemies.getChildren().forEach(e => {
        if (!e.active || e.isDead) return;
        const def = e.def || {};
        const jefe = esJefe(e);
        if (jefe) jefes.push(e);
        if (e.hpBar) {
          if (jefe) e.hpBar.clear();            // los jefes nunca llevan la barrita sobre la cabeza: su barra es la grande
          else dibujar(this, e, now);
        }
        if (e.nameTag) e.nameTag.setVisible(!jefe);
      });
      if (barra) actualizarBarra(this);
      if (!barra && this._gameMode === 'campaign' && this.player) {
        const pr = PR();
        const j = !(pr && (pr.activa() || pr.tapado())) && jefes.find(e => enPelea(this, e));
        if (j) crearBarra(this, j);
      }
      if ((this._ckbNom || 0) < now && this.campaignNPCs) { this._ckbNom = now + 1000; this.campaignNPCs.forEach(n => estiloNombre(n.nameTag)); }
    } catch (er) { console.warn('[barras]', er); }
    return r;
  };
  // al salir de la partida o morir, la barra se va
  ['returnToStartMenu', 'startCampaign'].forEach(k => {
    const f0 = MainGameScene.prototype[k];
    if (typeof f0 === 'function') MainGameScene.prototype[k] = function () { quitarBarra(false); return f0.apply(this, arguments); };
  });
  window.CK_BARRAS = { quitar: () => quitarBarra(false), activa: () => barra && barra.e };
})();
