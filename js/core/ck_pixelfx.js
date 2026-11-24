'use strict';
/* Efectos de pixelfx (20/11, pedido del dueño: "clonar github.com/patch-gg/pixelfx y usarlo para el juego" y después
   "reemplaza los del juego con estos, que se vean profesional, usa pivotes ... que tengan la perspectiva para el juego").
   pixelfx es una biblioteca de efectos pixel art hechos con código (licencia MIT, Patch y Hugo Duprez). Sus efectos se
   hornearon a hojas (ck_pixelfx_arte.js). Los que pisan el suelo (anillos, círculos de runas, curar, golpes al piso,
   rayos, explosiones) se rehicieron con el piso en la perspectiva del juego (óvalo de 0,5 a 0,6, como los avisos rojos
   de los jefes); sangre, onda de corte, congelado y sangrando se hicieron nuevos con las mismas herramientas.
   - REEMPLAZAN, con el mismo nombre, a las 32 hojas de ck_vfx_arte.js (golpes, tajos, giros, explosiones, proyectiles,
     rayos, curar, runas, pinchos, estados). Las llamadas de ck_vfx.js y ck_estados.js no cambian.
   - PIVOTES: cada hoja trae su punto de apoyo (ax, ay): el punto del golpe en los impactos, el piso en los que nacen
     del suelo, la punta en los proyectiles, el centro del anillo en el giro. Los estados que van en la cabeza o el
     pecho se ubican con el contorno real del dibujo del personaje (no con un porcentaje de su alto).
   - DELANTE Y DETRÁS: el giro de espada trae dos hojas; la mitad de atrás del anillo pasa por detrás del héroe.
   - ESCALA: cada hoja trae "esc"; las de pixelfx están a su propio tamaño de píxel y se agrandan o achican aquí para
     ocupar en pantalla lo mismo que las de antes.
   - SE SUMAN (las que empiezan con pfx_): polvo cuando cae un enemigo vencido; y el AMBIENTE de cada mapa:
       · rayos de sol entre los árboles, de día (bosques, caminos, el jardín, las capillas y la biblioteca);
       · fuegos fatuos de noche donde da miedo (Cementerio, Bosque Embrujado, el pantano del Norte, la Aldea en ruinas,
         la Capilla de Brumavieja) y a toda hora en las cuevas; alumbran el piso con el motor de luz.
     Las hojas de los jefes (pfx_manos, pfx_oscura...) las usa ck_jefes_pixelfx.js.
   Va ENTRE ck_vfx_arte.js y ck_vfx.js en index.html (ck_vfx.js lee las hojas al cargar).
   ?ck_pfx=0 en la dirección deja todo como antes; ?ck_pfx=golpe,giro prueba sólo esas.
   Borrar las dos líneas de index.html lo deja como estaba. */
(function () {
  const ARTE = window.CK_PIXELFX_ARTE, V = window.CK_VFX_ARTE;
  if (!ARTE || !V || !V.hojas || typeof Phaser === 'undefined') return;
  let q = null;
  try { q = new URLSearchParams(location.search).get('ck_pfx'); } catch (e) {}
  if (q === '0') return;
  const ACTIVOS = q ? q.split(',') : Object.keys(ARTE.hojas).filter(k => !ARTE.hojas[k].solo);
  const ESC = {}, ORIG = {}, USA = {}, ATRAS = {};
  ACTIVOS.forEach(k => {
    const h = ARTE.hojas[k];
    if (!h || h.solo) return;
    if (V.hojas[k]) ORIG[k] = V.hojas[k];
    else if (!/^pfx_/.test(k)) return;
    V.hojas[k] = h; ESC['ckfx_' + k] = h.esc || 1; USA[k] = true;
    if (h.atras && ARTE.hojas[h.atras]) { V.hojas[h.atras] = ARTE.hojas[h.atras]; ESC['ckfx_' + h.atras] = h.esc || 1; ATRAS['ckfx_' + k] = h.atras; }
  });

  // ------------------------------------------------------------------ escala propia y mitad de atrás
  const F = Phaser.GameObjects.GameObjectFactory.prototype, sp0 = F.sprite;
  const gemelo = (S, s, kb) => {
    const VX = window.CK_VFX, key = VX && VX.listo && VX.listo(S, kb);
    if (!key) return;
    const b = sp0.call(S.add, s.x, s.y, key, 0);
    const upd = () => {
      if (!s.active || !b.active) { S.events.off('postupdate', upd); if (b.active) b.destroy(); return; }
      b.setPosition(s.x, s.y).setOrigin(s.originX, s.originY).setRotation(s.rotation).setAlpha(s.alpha).setVisible(s.visible);
      b.scaleX = s.scaleX; b.scaleY = s.scaleY;
      if (b.blendMode !== s.blendMode) b.setBlendMode(s.blendMode);
      if (s.isTinted) b.setTint(s.tintTopLeft); else if (b.isTinted) b.clearTint();
      if (s.frame && b.frame && b.frame.name !== s.frame.name && b.texture.has(s.frame.name)) b.setFrame(s.frame.name);
      b.setDepth(s.depth - 32);                    // detrás de quien está parado en el medio del anillo
    };
    upd(); S.events.on('postupdate', upd);
  };
  F.sprite = function (x, y, key) {
    const s = sp0.apply(this, arguments);
    const e = ESC[key];
    if (s && e) {
      if (e !== 1) {
        const ss = s.setScale;
        s.setScale = function (a, b) { return ss.call(this, a * e, (b === undefined ? a : b) * e); };
        s.setScale(1);
      }
      if (ATRAS[key]) { const S = this.scene; S.time.delayedCall(0, () => { try { gemelo(S, s, ATRAS[key]); } catch (er) {} }); }
    }
    return s;
  };
  window.CK_PIXELFX = { activos: Object.keys(USA), ESC, ORIG, USA };
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const R = (a, b) => a + Math.random() * (b - a);

  // ------------------------------------------------------------------ contorno real del dibujo (para cabeza y pecho)
  const CAJAS = new Map();
  const cajaCuadro = fr => {
    const k = fr.texture.key + '#' + fr.name;
    if (CAJAS.has(k)) return CAJAS.get(k);
    let r = null;
    try {
      const src = fr.source && fr.source.image, w = fr.cutWidth, h = fr.cutHeight;
      if (src && w && h) {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d'); g.drawImage(src, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
        const d = g.getImageData(0, 0, w, h).data;
        let y0 = -1, y1 = -1;
        for (let y = 0; y < h && y0 < 0; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 60) { y0 = y; break; }
        for (let y = h - 1; y >= 0 && y1 < 0; y--) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 60) { y1 = y; break; }
        const ty = (fr.data && fr.data.trim && fr.data.spriteSourceSize) ? fr.data.spriteSourceSize.y : 0;
        if (y0 >= 0) r = { y0: y0 + ty, y1: y1 + ty, H: fr.realHeight || h };
      }
    } catch (e) { r = null; }
    CAJAS.set(k, r);
    return r;
  };
  // arriba y alto del dibujo en el mundo
  const contorno = o => {
    if (!o || !o.frame) return null;
    const c = cajaCuadro(o.frame); if (!c) return null;
    const sy = Math.abs(o.scaleY || 1), top0 = o.y - c.H * o.originY * sy;
    return { top: top0 + c.y0 * sy, h: (c.y1 - c.y0 + 1) * sy };
  };
  // dónde va cada estado: sobre la cabeza, en la cabeza, en el pecho o en el centro del cuerpo
  const LUGAR = { st_aturdido: 'sobre', st_marca: 'sobre', st_lento: 'cabeza', st_sangra: 'pecho', escudo: 'centro', st_bosque: 'centro' };
  // (21/11, ajustes del dueño en el editor de habilidades) los estados, corridos unos px de donde caen (x, y)
  const CORRE = { st_marca: [2, 6], escudo: [3, -3], st_mejora: [2, -1], aura_furia: [2, -2], st_bosque: [3, -7], st_lento: [2, -4] };
  // (21/11, "los efectos se ven por encima del personaje y no por detrás, acomodar según corresponda") las marcas en el piso
  // (grietas, círculos de runas) van debajo de los que están parados ahí, salvo que la habilidad diga otra profundidad
  const PISO = { suelo: 1, runas: 1 };
  const envolverVfx = () => {
    const VX = window.CK_VFX;
    if (!VX || VX._pfx) return;
    VX._pfx = true;
    const fx0 = VX.fx;
    VX.fx = function (S, k, x, y, o) {
      try {
        const L = LUGAR[k], C = CORRE[k];
        if (o && o.sigue && C) { o = Object.assign({}, o); o.dx = (o.dx || 0) + C[0]; o.dy0 = C[1]; }
        else if (o && !o.sigue && PISO[k] && o.prof === undefined) { o = Object.assign({}, o); o.prof = Math.round(y) - 18; }
        if (L && USA[k] && o && o.sigue) {
          const t = o.sigue, b = contorno(t);
          if (b) {
            o = Object.assign({}, o);
            o.dy = L === 'sobre' ? b.top - t.y - (k === 'st_marca' ? 9 : 4)
              : L === 'cabeza' ? b.top + b.h * 0.16 - t.y
              : L === 'pecho' ? b.top + b.h * 0.4 - t.y
              : b.top + b.h * 0.52 - t.y;
          }
        }
        if (o && o.dy0 != null) { o = Object.assign({}, o); o.dy = (o.dy || 0) + o.dy0; delete o.dy0; }
      } catch (e) {}
      return fx0.call(this, S, k, x, y, o);
    };
  };

  // ------------------------------------------------------------------ polvo cuando cae un enemigo vencido
  const VUELAN = /bat|murcielago|coagulo|demonio_fuego|demonio_ojo|_j_ojo|fantasma/;
  if (USA.pfx_polvo) {
    const d0 = P.onEnemyDefeated;
    P.onEnemyDefeated = function (enemy) {
      const r = d0 ? d0.apply(this, arguments) : undefined;
      try {
        const S = this, VX = window.CK_VFX;
        if (VX && enemy && !VUELAN.test(enemy.type || '')) {
          const f = VX.pie(enemy), k = Math.min(1.8, Math.max(0.8, (enemy.displayHeight || 60) / 70));
          S.time.delayedCall(380, () => VX.fx(S, 'pfx_polvo', f.x, f.y + 2, { escala: k, prof: Math.round(f.y) + 2 }));
        }
      } catch (e) {}
      return r;
    };
  }

  // ------------------------------------------------------------------ ambiente de cada mapa
  // rayos de sol: [fuerza]; sólo de día
  const RAYOS = {
    'ed_camino_al_castillo.main': 0.45, 'ed_bosque_de_la_frontera.main': 0.45, 'ed_norte_del_roble.main': 0.38,
    'ed_claro_de_las_bestias.main': 0.42, 'ed_jardin_real.main': 0.35, 'castle.garden': 0.35, 'village': 0.24,
    'ed_san_roque.main': 0.24, 'ed_campos_del_roble.main': 0.18,
    'ed_capilla_san_roque.main': 0.4, 'ed_capilla_brumavieja.main': 0.22, 'ed_biblioteca.main': 0.3, 'castle.library': 0.3
  };
  // fuegos fatuos: [cuántos, a toda hora]
  const FATUOS = {
    'ed_cementerio_real.main': [5], 'ed_bosque_embrujado.main': [6], 'ed_norte_del_roble.main': [3], 'ed_aldea_en_ruinas.main': [3],
    'ruins.village': [3], 'ed_capilla_brumavieja.main': [2], 'ed_casa_peste.main': [2],
    'ed_cueva_galerias.main': [3, 1], 'ed_cueva_grutas.main': [3, 1]
    // (23/11, nota 27 del dueño en La Fosa: "quita los fuegos fatuos de esta dungeon"): la Fosa ya no tiene
  };
  const zona = S => { try { return (S.currentZoneKey && S.currentZoneKey()) || ''; } catch (e) { return ''; } };
  const noche = S => { try { return !!(S.isNight && S.isNight()); } catch (e) { return false; } };
  const limpiar = S => { (S._pfxAmb || []).forEach(o => { try { S.tweens.killTweensOf(o); o.destroy(); } catch (e) {} }); S._pfxAmb = []; S._pfxFatuos = []; };
  const caja = S => {
    const c = S.currentInterior, a = c && c.area;
    if (a) return { x: a.x, y: a.y, w: a.w || a.width || 640, h: a.h || a.height || 400 };
    const b = S.physics && S.physics.world && S.physics.world.bounds;
    return b ? { x: b.x, y: b.y, w: b.width, h: b.height } : null;
  };
  const armar = S => {
    limpiar(S);
    const VX = window.CK_VFX, z = zona(S), n = noche(S);
    S._pfxFirma = z + '|' + n;
    if (!VX || !S.player || S._ckEscena === 'portada') return;
    const fa = FATUOS[z], A = caja(S);
    if (USA.pfx_fatuo && fa && A && (n || fa[1])) {
      for (let i = 0; i < fa[0]; i++) {
        const x = A.x + R(0.1, 0.9) * A.w, y = A.y + R(0.15, 0.88) * A.h;
        const s = VX.fx(S, 'pfx_fatuo', x, y, { escala: R(0.8, 1), suma: true });
        if (!s) continue;
        s.anims.setProgress(Math.random());
        S.tweens.add({ targets: s, x: x + R(-70, 70), y: y + R(-45, 45), duration: R(6000, 11000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        S._pfxAmb.push(s); S._pfxFatuos.push(s);
      }
    }
    const fr = RAYOS[z];
    if (USA.pfx_rayos && fr && !n) {
      const key = VX.listo(S, 'pfx_rayos'); if (!key) return;
      try { S.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR); } catch (e) {}   // luz suave, sin escalones
      const cam = S.cameras.main, h = ARTE.hojas.pfx_rayos;
      const s = S.add.sprite(cam.width / 2, cam.height / 2, key, 0).setScrollFactor(0).setDepth(15000)
        .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      s.play(key); s.anims.setProgress(Math.random());
      const ajustar = () => {
        if (!s.active) return S.events.off('postupdate', ajustar);
        s.setScale(Math.max(cam.width / h.fw, cam.height / h.fh) / cam.zoom * 1.04).setPosition(cam.width / 2, cam.height / 2);
      };
      ajustar(); S.events.on('postupdate', ajustar);
      S.tweens.add({ targets: s, alpha: fr, duration: 1500 });
      S._pfxAmb.push(s);
    }
  };
  // los fuegos fatuos alumbran el piso
  try {
    if (window.CK_LUZ && CK_LUZ.fuente) CK_LUZ.fuente((S, L) => { (S._pfxFatuos || []).forEach(s => { if (s.active && s.visible) L.push({ x: s.x, y: s.y + 6, c: [120, 220, 255], r: 58, f: 0.75 }); }); });
  } catch (e) {}
  ['onAreaShown', 'onVillageShown'].forEach(n => {
    const a0 = P[n];
    if (typeof a0 !== 'function') return;
    P[n] = function () {
      const r = a0.apply(this, arguments);
      try { const S = this; limpiar(S); S._pfxFirma = ''; S.time.delayedCall(600, () => { try { armar(S); } catch (e) { console.warn('[pixelfx]', e); } }); } catch (e) {}
      return r;
    };
  });
  // envolver CK_VFX cuando ya existe; y si cambia la hora (día ↔ noche) sin cambiar de mapa, rearmar el ambiente
  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try {
      envolverVfx();
      const now = this.time.now;
      if (this.gameStarted && this.player && now > (this._pfxMira || 0)) {
        this._pfxMira = now + 2500;
        if (this._pfxFirma !== zona(this) + '|' + noche(this) && !this._doorTransition) armar(this);
      }
    } catch (e) {}
    return r;
  };
  window.CK_PIXELFX.armarAmbiente = armar;
  window.CK_PIXELFX.contorno = contorno;
  window.CK_PIXELFX.CORRE = CORRE;
})();
