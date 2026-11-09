'use strict';
/* Estados a la vista (03/11, pedido del dueño: "que las habilidades muestren el estado de buff o debuff").
   Referencias: barras de estado de WoW / Terraria / Diablo — íconos chicos sobre la cabeza del enemigo, efecto animado
   sobre el cuerpo y, para el héroe, una fila de íconos con el tiempo que queda (se vacía como un reloj).
   - Enemigos (debuff, borde rojo): quemado (llamas en los pies), congelado (cristales), aturdido (estrellas sobre la
     cabeza), sangrando (gotas), lento (flechas azules hacia abajo), marcado (calaveras; Marca de muerte de Aby).
     Arriba de la cabeza, la fila de íconos; titilan en el último segundo.
   - Héroe (buff, borde dorado): Escudo arcano (burbuja y los golpes que aguanta), Furia/Frenesí (aura de fuego atrás),
     Grito de guerra (flechas de mejora), Espíritu del bosque (aura verde), Hibernar, Coraza de escarcha lista.
     La fila va arriba de la barra del héroe (ck_hud_tema.js) con los segundos que quedan.
   Usa los efectos de ck_vfx.js y los íconos de PixelLab de ck_vfx_arte.js. Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_VFX_ARTE) return;
  const P = MainGameScene.prototype;
  const IC = window.CK_VFX_ARTE.iconos;
  const IMG = {}; Object.keys(IC).forEach(k => { const im = new Image(); im.src = IC[k]; IMG[k] = im; });
  const tex = (S, k) => { const key = 'ckic_' + k; if (!S.textures.exists(key)) { const im = IMG[k]; if (!im || !im.complete || !im.naturalWidth) return null; S.textures.addImage(key, im); } return key; };

  // enemigo: estado → [efecto, dónde (pie|cabeza|pecho), escala, ícono, nombre]
  const DEB = {
    quemado: { fx: 'st_quemar', en: 'pie', esc: 0.55, ic: 'quemado', fin: e => e._ckFuego && e._ckFuego.hasta },
    congelado: { fx: 'st_hielo', en: 'pie', esc: 0.9, ic: 'congelado', fin: e => e._ckHielo },
    aturdido: { fx: 'st_aturdido', en: 'cabeza', esc: 0.75, ic: 'aturdido', fin: e => e._ckAturdido },
    sangrando: { fx: 'st_sangra', en: 'pecho', esc: 0.7, ic: 'sangrando', fin: e => e._ckSangre },
    lento: { fx: 'st_lento', en: 'pie', esc: 0.55, ic: 'lento', fin: e => e._ckLento },
    marcado: { fx: 'st_marca', en: 'cabeza', esc: 0.6, ic: 'marcado', fin: e => e._ckMarca }
  };
  const ORDEN = Object.keys(DEB);
  const lugar = (e, en) => {
    const h = e.displayHeight || 60;
    if (en === 'pie') return e.body ? e.body.bottom - e.y : h * 0.1;
    if (en === 'cabeza') return -h * 0.3;
    return -h * 0.1;
  };
  const cuadroEnemigos = S => {
    const V = window.CK_VFX; if (!V || !S.enemies) return;
    const now = S.time.now;
    S.enemies.getChildren().forEach(e => {
      const vivo = e.active && !e.isDead;
      const st = e._ckSt || (e._ckSt = { fx: {}, ic: {} });
      const activos = [];
      ORDEN.forEach(k => {
        const D = DEB[k], hasta = vivo ? (D.fin(e) || 0) : 0, on = hasta > now;
        if (on) activos.push([k, hasta - now]);
        if (on && !st.fx[k]) st.fx[k] = V.fx(S, D.fx, e.x, e.y, { escala: D.esc * Math.min(1.4, (e.scaleX || 1) / 1.2), sigue: e, dy: lugar(e, D.en), detras: D.en === 'pie' });
        if (!on && st.fx[k]) { try { st.fx[k].destroy(); } catch (er) {} delete st.fx[k]; }
      });
      // íconos arriba de la cabeza
      const y = e.y - (e.displayHeight || 60) * 0.42 - 6, n = activos.length;
      Object.keys(st.ic).forEach(k => { if (!activos.find(a => a[0] === k)) { st.ic[k].destroy(); delete st.ic[k]; } });
      activos.forEach(([k, resto], i) => {
        let im = st.ic[k];
        if (!im) { const key = tex(S, DEB[k].ic); if (!key) return; im = st.ic[k] = S.add.image(0, 0, key).setScale(0.42).setDepth(30010); }
        im.setPosition(e.x + (i - (n - 1) / 2) * 15, y);
        im.setAlpha(resto < 1000 ? (Math.floor(now / 120) % 2 ? 0.35 : 1) : 1);
      });
      if (!vivo && !n) { e._ckSt = null; }
    });
  };

  // héroe: buff → [efecto o null, dónde, escala, ícono, fin(), resto(), etiqueta]
  const BUF = {
    escudo: { fx: 'escudo', en: 'pecho', esc: 0.75, ic: 'escudo', fin: S => S._ckEscudo && S._ckEscudo.golpes > 0 ? S._ckEscudo.hasta : 0, n: S => (S._ckEscudo && S._ckEscudo.golpes) || '', total: 8000, nom: 'Escudo arcano' },
    furia: { fx: 'aura_furia', en: 'pie', esc: 0.45, ic: 'furia', fin: S => S._ckFrenesi || 0, total: 8000, nom: 'Furia', detras: true, alfa: 0.6 },
    grito: { fx: 'st_mejora', en: 'pie', esc: 0.7, ic: 'grito', fin: S => S._ckGrito || 0, total: 8000, nom: 'Grito de guerra (+1 daño)' },
    bosque: { fx: 'st_bosque', en: 'pecho', esc: 0.8, ic: 'regenera', fin: S => S._ckEspiritu || 0, total: 4000, nom: 'Espíritu del bosque', detras: true, alfa: 0.6 },
    hiberna: { fx: null, ic: 'hiberna', fin: S => S._osoHiberna || 0, total: 2000, nom: 'Hibernando' },
    coraza: { fx: null, ic: 'coraza', fin: S => { const HB = window.CK_HABILIDADES; return HB && HB.rg && HB.rg(S, 'coraza') && S.time.now > (S._ckCorazaAt || 0) ? S.time.now + 1e9 : 0; }, nom: 'Coraza de escarcha lista' }
  };
  const fila = () => (window.CK_HUD_TEMA && window.CK_HUD_TEMA.estados) || null;
  const css = `
#ckh .estados .est { position: relative; width: 38px; height: 38px; background: rgba(12,8,6,.85); box-shadow: 0 0 0 2px #000, inset 0 0 0 2px #e8b84a; image-rendering: pixelated; }
#ckh .estados .est.mal { box-shadow: 0 0 0 2px #000, inset 0 0 0 2px #e0304a; }
#ckh .estados .est img { position: absolute; left: 3px; top: 3px; width: 32px; height: 32px; image-rendering: pixelated; }
#ckh .estados .est .rel { position: absolute; inset: 2px; background: conic-gradient(rgba(0,0,0,.62) var(--g, 0deg), transparent 0); }
#ckh .estados .est b { position: absolute; right: 2px; bottom: 0; font: 700 13px var(--ck2-f, serif); color: #fff; text-shadow: 0 1px 0 #000, 0 0 3px #000; }
#ckh .estados .est.titila { animation: ckeTit .24s steps(2) infinite; }
@keyframes ckeTit { 50% { opacity: .35; } }
`;
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);
  const EL = {};
  const cuadroHeroe = S => {
    const V = window.CK_VFX, p = S.player; if (!V || !p) return;
    const now = S.time.now, cont = fila();
    S._ckBuf = S._ckBuf || {};
    if (S._ckEscudoG && S._ckEscudoG.visible) S._ckEscudoG.setVisible(false);   // la burbuja de PixelLab reemplaza al anillo viejo
    Object.keys(BUF).forEach(k => {
      const D = BUF[k], hasta = !S.isDead ? (D.fin(S) || 0) : 0, on = hasta > now;
      if (D.fx) {
        if (on && !S._ckBuf[k]) S._ckBuf[k] = V.fx(S, D.fx, p.x, p.y, { escala: D.esc, sigue: p, dy: lugar(p, D.en), detras: !!D.detras, alfa: D.alfa });
        if (!on && S._ckBuf[k]) { try { S._ckBuf[k].destroy(); } catch (e) {} delete S._ckBuf[k]; }
      }
      if (!cont) return;
      let el = EL[k];
      if (on && !el) { el = EL[k] = document.createElement('div'); el.className = 'est'; el.title = D.nom; el.innerHTML = '<img alt=""><div class="rel"></div><b></b>'; el.querySelector('img').src = IC[D.ic]; cont.appendChild(el); }
      if (!on && el) { el.remove(); delete EL[k]; }
      if (on && el) {
        const resto = hasta - now, tot = D.total || 0;
        el.style.setProperty('--g', tot ? Math.max(0, Math.min(360, (1 - resto / tot) * 360)) + 'deg' : '0deg');
        const n = D.n ? D.n(S) : (tot && resto < 60000 ? Math.ceil(resto / 1000) : '');
        el.querySelector('b').textContent = n;
        el.classList.toggle('titila', !!tot && resto < 1200);
      }
    });
  };
  // el Espíritu del bosque no deja marca: se la ponemos
  const marcar = () => { const H = window.CK_HABILIDADES && window.CK_HABILIDADES.HACER; if (!H || !H.espiritu || H.espiritu._ckEst) return; const f0 = H.espiritu; H.espiritu = function (S) { const r = f0.apply(this, arguments); try { if (r !== -1) S._ckEspiritu = S.time.now + 4000; } catch (e) {} return r; }; H.espiritu._ckEst = true; Object.keys(f0).forEach(k => (H.espiritu[k] = f0[k])); };

  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try { if (this.gameStarted && this.player) { marcar(); cuadroEnemigos(this); cuadroHeroe(this); } } catch (e) { if (!P._ckEstAv) { P._ckEstAv = 1; console.warn('[estados]', e); } }
    return r;
  };
  window.CK_ESTADOS = { DEB, BUF };
})();
