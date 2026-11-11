'use strict';
/* Terreno que se rompe peleando (10/11, pedido del dueño: "que algunas cosas del mapa se puedan romper para mejorar la
   movilidad: barricadas de madera y cosas así, no cajas, cosas del terreno que cuando se pelee se desgasten y se rompan").
   Las piezas de madera de los mapas del Taller (estacas, cercas, cercos, barandas, corrales, carretas, carretillas, tablas,
   lanzas clavadas, barricadas, empalizadas cortas, barriles, cajones y fardos de los dibujos) tienen vida:
   - cada golpe del héroe (espada, estocada, giro, magia) o de una bestia que pega al lado las sacude y saca astillas;
   - se van gastando a la vista: primero rajaduras, después rajaduras grandes y más oscuras;
   - al romperse vuelan los pedazos (del mismo dibujo), queda la base astillada en el piso y el paso se abre (choque
     afuera y el camino de las bestias se recalcula solo).
   En los lugares de peligro (tierras orcas, bosques, ruinas, cueva…) lo roto queda roto en la partida; en el castillo,
   la aldea y los lugares de gente, al volver a entrar ya lo arreglaron. Los muñecos y blancos de práctica no se rompen,
   ni lo que es parte de una pared o casa, ni las piezas más anchas que 230 px (la empalizada entera de un pueblo).
   Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  // qué se rompe y cuánto aguanta
  const TIPOS = [
    [/barricada|empalizada/, 7, 'pesado'],
    [/carreta|carretilla|carro\b|rueda_y/, 6, 'pesado'],
    [/estacas|lanzas_clavadas|cerca|cerco|baranda|corral|tabla_apoyada|tranquera|valla/, 4, 'madera'],
    [/barril|cajon|cajas|fardo|pila_de_paja|bolsas|lena\b|_lena|tronco_de_picar/, 3, 'liviano']
  ];
  const NUNCA = /cementerio|reja|hierro|muneco|diana|blanco|poste_golpes|poste_brazos|poste_anillas|muro|torre|casa|choza|capilla|molino|porton|arco|fuente|pozo|establo|cobertizo|caseta|carpa|totem|trono|jaula|balista|catapulta|fragua|altillo|mostrador|barra\b|ropero|cama|mesa|estante|armero|estandarte|bandera/;
  const MAX_ANCHO = 230;
  const GENTE = /castillo|patio|jardin|muralla|granero|^aldea$|camino_al_castillo|taberna|casa|cocina|cuarto|salon|biblioteca|herreria|tienda|aposento|capilla_real|campos/;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const azar = (a, b) => a + Math.random() * (b - a);

  const tipoDe = key => {
    if (!/^ed_/.test(key) || NUNCA.test(key)) return null;
    for (const t of TIPOS) if (t[0].test(key)) return t;
    return null;
  };
  const mapaDe = S => {
    const a = S.currentInterior && S.currentInterior.area, k = a && a.key || '';
    const m = /^ed_([a-z0-9_]+)\./.exec(k);
    return m ? m[1] : '';
  };
  const guardados = (S, id) => {
    const st = S.story; if (!st || !st.flags) return null;
    const f = st.flags.terrenoRoto || (st.flags.terrenoRoto = {});
    return f[id] || (f[id] = []);
  };

  // ------------------------------------------------------------------ dibujos gastados: rajaduras sobre la madera
  const fuente = (S, key) => {
    const T = S.textures.get(key), fr = T && T.get();
    if (!fr || !fr.source || !fr.source.image) return null;
    return { img: fr.source.image, x: fr.cutX, y: fr.cutY, w: fr.cutWidth, h: fr.cutHeight };
  };
  const semilla = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296); };
  const gastada = (S, key, nivel) => {
    const nk = `ckt_${key}_g${nivel}`;
    if (S.textures.exists(nk)) return nk;
    const f = fuente(S, key); if (!f) return null;
    const cv = document.createElement('canvas'); cv.width = f.w; cv.height = f.h;
    const g = cv.getContext('2d');
    g.drawImage(f.img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    g.globalCompositeOperation = 'source-atop';
    // oscurece un poco (golpeada, polvo)
    g.fillStyle = nivel > 1 ? 'rgba(30,18,8,0.22)' : 'rgba(30,18,8,0.1)';
    g.fillRect(0, 0, f.w, f.h);
    const r = semilla(key + nivel), n = nivel > 1 ? 9 : 4;
    for (let i = 0; i < n; i++) {
      let x = Math.floor(r() * f.w), y = Math.floor(f.h * (0.25 + r() * 0.65));
      const largo = 4 + Math.floor(r() * (nivel > 1 ? 14 : 8));
      g.fillStyle = 'rgba(28,16,6,0.85)';
      for (let k = 0; k < largo; k++) {
        g.fillRect(x, y, 1, 1);
        if (r() < 0.5) { g.fillStyle = 'rgba(222,190,140,0.5)'; g.fillRect(x + 1, y, 1, 1); g.fillStyle = 'rgba(28,16,6,0.85)'; }
        y += r() < 0.75 ? -1 : 0; x += r() < 0.5 ? -1 : 1;
      }
    }
    S.textures.addCanvas(nk, cv);
    return nk;
  };
  // pedazos del mismo dibujo y la base astillada que queda en el piso
  const pedazos = (S, key) => {
    const nk = `ckt_${key}_p`;
    if (S.textures.exists(nk + '0')) return S._ckTerrPed[key];
    const f = fuente(S, key); if (!f) return null;
    const cols = Math.max(2, Math.min(4, Math.round(f.w / 22))), filas = Math.max(2, Math.min(3, Math.round(f.h / 26)));
    const out = { lista: [], base: null, color: 0x7a5230 };
    const pw = Math.ceil(f.w / cols), ph = Math.ceil(f.h * 0.8 / filas);
    let i = 0, rr = 0, gg = 0, bb = 0, nn = 0;
    for (let fy = 0; fy < filas; fy++) for (let fx = 0; fx < cols; fx++) {
      const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.drawImage(f.img, f.x + fx * pw, f.y + fy * ph, pw, ph, 0, 0, pw, ph);
      // borde quebrado: se comen esquinas al azar
      g.globalCompositeOperation = 'destination-out';
      for (let k = 0; k < 5; k++) { const cx = Math.random() < 0.5 ? 0 : pw, cy = Math.random() < 0.5 ? 0 : ph; g.beginPath(); g.arc(cx, cy, 2 + Math.random() * pw * 0.35, 0, 7); g.fill(); }
      const d = g.getImageData(0, 0, pw, ph).data; let vis = 0;
      for (let p = 0; p < d.length; p += 16) if (d[p + 3] > 128) { vis++; rr += d[p]; gg += d[p + 1]; bb += d[p + 2]; nn++; }
      if (vis < 6) continue;
      S.textures.addCanvas(nk + i, cv); out.lista.push({ k: nk + i, ox: fx * pw + pw / 2, oy: fy * ph + ph / 2 }); i++;
    }
    if (nn) out.color = (Math.round(rr / nn) << 16) | (Math.round(gg / nn) << 8) | Math.round(bb / nn);
    // base: el 22 % de abajo, con el borde de arriba mordido
    const bh = Math.max(6, Math.round(f.h * 0.22)), cv = document.createElement('canvas'); cv.width = f.w; cv.height = bh;
    const g = cv.getContext('2d'); g.drawImage(f.img, f.x, f.y + f.h - bh, f.w, bh, 0, 0, f.w, bh);
    g.globalCompositeOperation = 'destination-out';
    for (let x = 0; x < f.w; x += 3) { const h = Math.random() * bh * 0.7; g.fillRect(x, 0, 3, h); }
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(30,18,8,0.25)'; g.fillRect(0, 0, f.w, bh);
    S.textures.addCanvas(nk + 'b', cv); out.base = { k: nk + 'b', h: bh, w: f.w };
    (S._ckTerrPed || (S._ckTerrPed = {}))[key] = out;
    return out;
  };

  // ------------------------------------------------------------------ armar la lista al entrar a una zona
  const limpiar = S => { S._ckTerr = []; };
  const armar = S => {
    limpiar(S);
    const a = S.currentInterior && S.currentInterior.area; if (!a || !a.objs) return;
    const id = mapaDe(S); if (!id) return;
    const persiste = !GENTE.test(id), rotos = persiste ? guardados(S, id) : null;
    const zonas = a.objs.filter(o => o.type === 'Zone' && o.body);
    const usadas = new Set();
    a.objs.forEach(o => {
      if (o.type !== 'Image' && o.type !== 'Sprite') return;
      const key = o.texture && o.texture.key; if (!key) return;
      const t = tipoDe(key); if (!t) return;
      if (o.displayWidth > MAX_ANCHO || o.displayWidth < 10) return;
      const bx0 = o.x - o.displayWidth * o.originX, bx1 = bx0 + o.displayWidth, by1 = o.y + o.displayHeight * (1 - o.originY), by0 = by1 - o.displayHeight;
      // sus choques: los de abajo del dibujo, que no se salgan mucho de él
      const mias = zonas.filter(z => {
        if (usadas.has(z)) return false;
        const b = z.body, cx = b.center.x, cy = b.center.y;
        if (cx < bx0 - 4 || cx > bx1 + 4 || cy < by0 + o.displayHeight * 0.35 || cy > by1 + 10) return false;
        return b.x > bx0 - 16 && b.right < bx1 + 16 && b.width < o.displayWidth + 30;
      });
      if (!mias.length) return;                     // no estorba: no hace falta romperlo
      const uid = key + '@' + Math.round(o.x - a.x) + ',' + Math.round(o.y - a.y);
      mias.forEach(z => usadas.add(z));
      const r = { uid, key, sp: o, zonas: mias, vida: t[1], max: t[1], peso: t[2], caja: { x0: bx0, x1: bx1, y0: by0, y1: by1 }, X: o.x };
      if (rotos && rotos.indexOf(uid) >= 0) { romper(S, r, true); return; }
      S._ckTerr.push(r);
    });
  };

  // ------------------------------------------------------------------ golpes
  const tocan = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const astillas = (S, r, n, x, y) => {
    for (let i = 0; i < n; i++) {
      const g = S.add.rectangle(x + azar(-8, 8), y + azar(-10, 6), Math.round(azar(2, 5)), 2, r.color || 0x7a5230).setDepth(r.caja.y1 + 2);
      S.tweens.add({ targets: g, x: g.x + azar(-30, 30), y: r.caja.y1 + azar(-4, 8), angle: azar(-200, 200), duration: azar(260, 460), ease: 'Quad.easeOut' });
      S.tweens.add({ targets: g, alpha: 0, delay: 1400, duration: 500, onComplete: () => g.destroy() });
    }
  };
  const pegar = (S, r, fuerza, desdeX) => {
    const now = S.time.now; if (r.roto || (r._ult && now - r._ult < 240)) return; r._ult = now;
    r.vida -= fuerza || 1;
    const ped = pedazos(S, r.key); if (ped) r.color = ped.color;
    const cx = Math.max(r.caja.x0 + 6, Math.min(r.caja.x1 - 6, desdeX !== undefined ? desdeX : (r.caja.x0 + r.caja.x1) / 2));
    const cy = r.caja.y1 - Math.min(30, (r.caja.y1 - r.caja.y0) * 0.4);
    astillas(S, r, r.peso === 'liviano' ? 4 : 6, cx, cy);
    if (r.vida <= 0) { romper(S, r, false); return; }
    son('ck_barricada_golpe', r.peso === 'pesado' ? 0.75 : 0.6, { minGap: 90, rate: r.peso === 'liviano' ? 1.25 : r.peso === 'pesado' ? 0.85 : 1 }) || son('sword_hit', 0.6, { rate: 0.7 });
    if (r.sp.active) {
      S.tweens.killTweensOf(r.sp);
      r.sp.x = r.X;
      S.tweens.add({ targets: r.sp, x: r.X + (desdeX !== undefined && desdeX > r.X ? -2 : 2), duration: 45, yoyo: true, repeat: 2, onComplete: () => { if (r.sp.active) r.sp.x = r.X; } });
      const nivel = r.vida <= r.max * 0.4 ? 2 : r.vida < r.max ? 1 : 0;
      if (nivel && nivel !== r.nivel) { const k = gastada(S, r.key, nivel); if (k) { r.sp.setTexture(k); r.nivel = nivel; } }
    }
  };
  const romper = (S, r, yaEstaba) => {
    r.roto = true;
    r.zonas.forEach(z => { try { S.interiorObstacles && S.interiorObstacles.remove(z); z.destroy(); } catch (e) {} });
    const ped = pedazos(S, r.key), sp = r.sp, esc = sp.scaleX || 1, fl = sp.flipX, ancho = sp.displayWidth || 40;
    // la base astillada queda en el piso
    if (ped && ped.base) {
      const b = S.add.image(sp.x, r.caja.y1, ped.base.k).setOrigin(0.5, 1).setScale(esc).setFlipX(fl).setDepth(r.caja.y1 - 20);
      const a = S.currentInterior && S.currentInterior.area; if (a && a.objs) a.objs.push(b);
    }
    if (!yaEstaba && ped) {
      ped.lista.forEach(p => {
        const lx = fl ? r.caja.x1 - p.ox * esc : r.caja.x0 + p.ox * esc, ly = r.caja.y0 + p.oy * esc;
        const q = S.add.image(lx, ly, p.k).setScale(esc).setFlipX(fl).setDepth(r.caja.y1 + 1);
        const dx = (lx - sp.x) * 0.6 + azar(-24, 24), suelo = r.caja.y1 + azar(-14, 10);
        S.tweens.add({ targets: q, x: lx + dx, duration: azar(380, 560), ease: 'Quad.easeOut' });
        S.tweens.add({ targets: q, y: { from: ly, to: ly - azar(10, 26) }, duration: 160, ease: 'Quad.easeOut', yoyo: false,
          onComplete: () => S.tweens.add({ targets: q, y: suelo, duration: azar(240, 360), ease: 'Bounce.easeOut' }) });
        S.tweens.add({ targets: q, angle: azar(-110, 110), scaleY: esc * 0.6, duration: 560, ease: 'Quad.easeOut', onComplete: () => q.setDepth(suelo - 20) });
        S.tweens.add({ targets: q, alpha: 0, delay: 9000 + Math.random() * 3000, duration: 1500, onComplete: () => q.destroy() });
      });
    }
    try { sp.destroy(); } catch (e) {}
    if (yaEstaba) return;
    const cx = (r.caja.x0 + r.caja.x1) / 2, cy = r.caja.y1 - 6;
    astillas(S, r, 10, cx, cy - 10);
    for (let i = 0; i < 7; i++) {
      const c = S.add.circle(cx + azar(-ancho / 2, ancho / 2), cy + azar(-6, 4), azar(5, 10), 0xb8a58a, 0.45).setDepth(r.caja.y1 + 3);
      S.tweens.add({ targets: c, y: c.y - azar(8, 22), scale: 2, alpha: 0, duration: azar(600, 1000), ease: 'Quad.easeOut', onComplete: () => c.destroy() });
    }
    S.cameras.main.shake(r.peso === 'pesado' ? 220 : 120, r.peso === 'pesado' ? 0.007 : 0.004);
    son('ck_barricada', r.peso === 'liviano' ? 0.55 : 0.8, { rate: r.peso === 'liviano' ? 1.3 : 1 }) || son('door_gate', 0.7, { rate: 0.8 });
    S._ckTerr = (S._ckTerr || []).filter(x => x !== r);
    const id = mapaDe(S);
    if (id && !GENTE.test(id)) { const l = guardados(S, id); if (l && l.indexOf(r.uid) < 0) { l.push(r.uid); S.saveStory && S.saveStory(); } }
  };
  const golpe = (S, rect, fuerza, desdeX) => (S._ckTerr || []).slice().forEach(r => { if (!r.roto && tocan(rect, r.caja)) pegar(S, r, fuerza, desdeX); });

  // el héroe
  const rectoHeroe = (S, extra) => {
    const H = window.CK_HITBOXES;
    if (H && H.rectoGolpe) { try { return H.rectoGolpe(S, extra || 0); } catch (e) {} }
    const p = S.player, izq = S.facingDirection === 'left';
    return izq ? { x0: p.x - 46, x1: p.x + 6, y0: p.y - 22, y1: p.y + 20 } : { x0: p.x - 6, x1: p.x + 46, y0: p.y - 22, y1: p.y + 20 };
  };
  ['checkMeleeHits', 'checkThrustHits', 'checkWizardMagicHits'].forEach(fn => {
    const f0 = P[fn]; if (!f0) return;
    P[fn] = function () {
      const r = f0.apply(this, arguments);
      try { if (this._ckTerr && this._ckTerr.length) golpe(this, rectoHeroe(this, fn === 'checkThrustHits' ? 30 : 0), 1, this.player.x); } catch (e) {}
      return r;
    };
  });
  const sp0 = P.checkSpinHits;
  if (sp0) P.checkSpinHits = function () {
    const r = sp0.apply(this, arguments);
    try { const p = this.player; if (this._ckTerr && this._ckTerr.length) golpe(this, { x0: p.x - 60, x1: p.x + 60, y0: p.y - 40, y1: p.y + 50 }, 1, p.x); } catch (e) {}
    return r;
  };
  // las bestias que pegan al lado de algo también lo gastan (las grandes y los jefes, el doble)
  const em0 = P.enemyMeleeAttack;
  if (em0) P.enemyMeleeAttack = function (enemy, def) {
    const m = em0.apply(this, arguments);
    try {
      if (this._ckTerr && this._ckTerr.length) this.time.delayedCall(m.hitAt + 10, () => {
        if (!enemy.active || enemy.isDead || !enemy.body) return;
        const b = enemy.body, izq = enemy.flipX, R = (def.reach || 30) + 6;
        const rect = izq ? { x0: b.center.x - R, x1: b.center.x, y0: b.bottom - 34, y1: b.bottom + 8 } : { x0: b.center.x, x1: b.center.x + R, y0: b.bottom - 34, y1: b.bottom + 8 };
        golpe(this, rect, def.boss || (enemy.scale || 1) > 1.3 ? 2 : 1, b.center.x);
      });
    } catch (e) {}
    return m;
  };

  const a0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = a0.apply(this, arguments);
    limpiar(this);
    this.time.delayedCall(250, () => { try { armar(this); } catch (e) { console.warn('[terreno rompible]', e); } });
    return r;
  };
  window.CK_TERRENO_ROMPIBLE = { TIPOS, lista: S => S._ckTerr || [], pegar, romper, armar };
})();
