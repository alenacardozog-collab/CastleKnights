'use strict';
/* Barra del héroe con el modelo de cada personaje y retrato vivo (03/11, pedido del dueño: "el UI de los personajes
   todavía está simplón; quiero que el mago sea con cosas referentes a mago, que sean modelos acordes a su personaje, y
   que los retratos mientras se juega tengan animaciones de daño o desgaste si perdimos mucha vida").
   - Marcos de PixelLab (ck_hud_tema_arte.js):
       Horos: marco de piedra azul con el báculo y su cristal, el libro de hechizos abierto y velas; placa de pergamino.
       Lancent: escudo de acero con oro, espadas cruzadas y cinta azul; placa de acero con remaches.
       Aby: corona de espinas y rosas con dos dagas cruzadas; placa de cuero con rosas.
       Urso: aro de madera con nieve, sogas y un hueso; placa de tronco con escarcha.
     Las ranuras también cambian según el héroe. El nombre, la vida y el recurso van sobre la placa.
   - Retrato vivo:
       al recibir un golpe se sacude, destella en rojo y le queda una grieta en el vidrio del retrato;
       con la mitad de la vida o menos aparece el retrato lastimado (PixelLab: moretones, cortes, sangre);
       con un tercio o menos late, pierde color, gotea sangre y se enrojecen los bordes de la pantalla;
       al curarse brilla en verde (y se borran algunas grietas); al morir queda gris;
       en las ultis (evento 'ck-ulti' de ck_vfx.js) brilla con el color del héroe.
   Va encima de ck_hud_heroe.js (usa su caja #ckh). Borrar las 2 líneas de index.html vuelve a la barra anterior. */
(function () {
  if (typeof document === 'undefined') return;
  const AR = window.CK_HUD_TEMA_ARTE;
  const HUD = window.CK_HUD_HEROE;
  if (!AR || !HUD || !HUD.caja) return;
  const caja = HUD.caja;
  const HEROE = h => (h === 'swordsman' || h === 'wizard' || h === 'bear' ? h : 'soldier');
  const ESCENA = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const u = k => (AR[k] ? 'url("' + AR[k] + '")' : 'none');

  // dónde va el retrato dentro del marco (px de pantalla, el marco mide 192) y cómo es cada placa
  const CFG = {
    wizard: { cara: [32, 34, 128], placa: { t: 10, l: 54, r: 298, tinta: '#3b2314', sombra: '0 1px 0 rgba(255,236,200,.6)' }, glow: '#b06cff', c1: '#0d0a26', c2: '#2c2668', rec: 'drop' },
    soldier: { cara: [32, 26, 128, 0.8], placa: { t: 15, l: 40, r: 312 }, glow: '#ffd25a', c1: '#0a1424', c2: '#2a3e5c', rec: 'rayo' },
    swordsman: { cara: [32, 22, 128], placa: { t: 15, l: 34, r: 318 }, glow: '#ff4a7a', c1: '#1a0610', c2: '#4a1426', rec: 'hoja' },
    bear: { cara: [32, 30, 128], placa: { t: 31, l: 34, r: 318 }, glow: '#9fe0ff', c1: '#0a1626', c2: '#2a4a6a', rec: 'garra' }
  };

  // íconos chiquitos de las barras, dibujados a píxel (corazón, gota, rayo, hoja, garra)
  const PIX = {
    corazon: ['.11.11.', '1221221', '1222221', '.12221.', '..121..', '...1...'],
    drop: ['...1...', '..121..', '.12221.', '1223221', '1222221', '.12221.', '..111..'],
    rayo: ['...111', '..121.', '.121..', '12221.', '..121.', '.121..', '11....'],
    hoja: ['....11', '...121', '..1221', '.12221', '1221..', '11....'],
    garra: ['1.1.1.', '21212.', '.2.2.2', '1.1.1.', '21212.', '.2.2.2']
  };
  const COLP = { corazon: ['#1b0a0a', '#ff4a5a', '#ffd0d4'], drop: ['#081028', '#4aa0ff', '#e0f4ff'], rayo: ['#2a1a04', '#ffd04a', '#fff6c0'], hoja: ['#06200f', '#3ad07a', '#c8ffd8'], garra: ['#2a0e04', '#ff8a2a', '#ffe0b0'] };
  const icono = k => {
    const P = PIX[k], c = document.createElement('canvas'); c.width = P[0].length; c.height = P.length;
    const g = c.getContext('2d');
    P.forEach((f, y) => [...f].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = COLP[k][+ch - 1] || COLP[k][1]; g.fillRect(x, y, 1, 1); }));
    return c.toDataURL();
  };
  const IC = {}; Object.keys(PIX).forEach(k => (IC[k] = icono(k)));

  const css = `
#ckh.tema .med { width: 192px; height: 192px; }
#ckh.tema .med > .fondo, #ckh.tema .med > img.cara { display: none; }
#ckh.tema .med .marco { z-index: 3; background-size: 100% 100%; }
#ckh.tema .med .niv { z-index: 4; bottom: -6px; }
#ckh .vent { position: absolute; inset: 0; z-index: 1; -webkit-mask: var(--ckt-mask) 0 0 / 100% 100% no-repeat; mask: var(--ckt-mask) 0 0 / 100% 100% no-repeat; display: none; }
#ckh.tema .vent { display: block; }
#ckh .vent .f { position: absolute; inset: 0; background: radial-gradient(circle at 50% 40%, var(--ckh-c2) 0%, var(--ckh-c1) 72%); }
#ckh .vent img { position: absolute; image-rendering: pixelated; transition: opacity .6s, filter .6s; }
#ckh .vent img.c2 { opacity: 0; }
#ckh .vent canvas { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; pointer-events: none; }
#ckh .vent .rojo { position: absolute; inset: 0; background: radial-gradient(circle, rgba(255,40,40,.15), rgba(200,0,0,.75)); opacity: 0; mix-blend-mode: multiply; }
#ckh .vent .rojo.va { animation: cktRojo .45s ease-out; }
@keyframes cktRojo { 0% { opacity: 1; } 100% { opacity: 0; } }
#ckh .vent .verde { position: absolute; inset: 0; background: radial-gradient(circle, rgba(120,255,160,.55), rgba(40,200,90,0)); opacity: 0; mix-blend-mode: screen; }
#ckh .vent .verde.va { animation: cktVerde .9s ease-out; }
@keyframes cktVerde { 0% { opacity: 0; } 25% { opacity: 1; } 100% { opacity: 0; } }
#ckh.tema .med.golpe { animation: cktGolpe .32s linear; }
@keyframes cktGolpe { 0% { transform: translate(0,0); } 15% { transform: translate(-6px,2px) rotate(-2deg); } 30% { transform: translate(5px,-3px) rotate(1.5deg); } 45% { transform: translate(-4px,1px); } 60% { transform: translate(3px,2px); } 80% { transform: translate(-1px,-1px); } 100% { transform: none; } }
#ckh.tema .med.critico .vent img { filter: saturate(.55) brightness(.9); }
#ckh.tema .med.critico { animation: cktLate 1s ease-in-out infinite; }
#ckh.tema .med.critico.golpe { animation: cktGolpe .32s linear; }
@keyframes cktLate { 0%, 100% { transform: scale(1); } 12% { transform: scale(1.035); } 24% { transform: scale(1); } 36% { transform: scale(1.025); } }
#ckh.tema .med.muerto .vent img { filter: grayscale(1) brightness(.6) !important; }
#ckh.tema .med .brillo { position: absolute; inset: -10px; z-index: 0; border-radius: 50%; opacity: 0; background: radial-gradient(circle, var(--ckt-glow) 0%, transparent 68%); pointer-events: none; }
#ckh.tema .med.ulti .brillo { animation: cktUlti 1.2s ease-out; }
#ckh.tema .med.ulti .vent img { animation: cktUltiCara 1.2s ease-out; }
@keyframes cktUlti { 0% { opacity: 0; transform: scale(.8); } 20% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0; transform: scale(1.25); } }
@keyframes cktUltiCara { 0% { filter: brightness(1); } 15% { filter: brightness(2.2) saturate(1.5); } 100% { filter: brightness(1); } }
#ckh.tema .med.cura .brillo { --ckt-glow: #5aff8a; animation: cktUlti .9s ease-out; }
#ckh .placa { display: none; position: relative; width: 352px; height: 112px; background: 0 0 / 100% 100% no-repeat; image-rendering: pixelated; filter: drop-shadow(0 4px 4px rgba(0,0,0,.5)); }
#ckh.tema .placa { display: block; }
#ckh.tema .cab, #ckh.tema .barra { display: none !important; }
#ckh.tema .der { gap: 0; }
#ckh .placa .nom { position: absolute; top: 0; left: 0; font-weight: 700; font-size: 21px; letter-spacing: .5px; white-space: nowrap; }
#ckh .placa .mon { position: absolute; top: 0; display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 17px; color: #ffe08a; text-shadow: 0 2px 0 #000, 0 0 4px #000; }
#ckh .placa .mon i { width: 16px; height: 16px; background: radial-gradient(circle at 40% 35%, #fff3b0 0 20%, #f0c040 22% 60%, #9a6a10 62% 100%); border: 2px solid #1b0f0a; border-radius: 50%; box-sizing: border-box; }
#ckh .placa .tb { position: absolute; height: 18px; background: #120a0c; box-shadow: inset 0 0 0 2px #050304, inset 0 3px 0 2px rgba(0,0,0,.45), 0 1px 0 rgba(255,255,255,.12); }
#ckh .placa .tb .ic { position: absolute; left: -2px; top: 50%; width: 21px; height: 21px; transform: translate(-100%, -50%); background: 0 50% / contain no-repeat; image-rendering: pixelated; }
#ckh .placa .tb .ll { position: absolute; left: 2px; right: 2px; top: 2px; bottom: 2px; background: 0 0 / 100% 100% no-repeat; image-rendering: pixelated; clip-path: inset(0 var(--vacio, 0%) 0 0); transition: clip-path .25s ease-out; }
#ckh .placa .tb .ll.at { background: #f3ead9; opacity: .55; transition: clip-path .6s ease-in .25s; }
#ckh .placa .tb .tx { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff; text-shadow: 0 1px 0 #000, 0 0 3px #000; letter-spacing: .5px; }
#ckh .placa .tb.baja .ll:not(.at) { animation: ckhLate .8s ease-in-out infinite; }
#ckh.tema .fila { margin-top: 2px; }
#ckh.tema .ran { width: 80px; height: 80px; }
#ckh.tema .ran img, #ckh.tema .ran .cd { left: 8px; top: 8px; width: 64px; height: 64px; }
#ckh.tema .ran.vacia::after { left: 8px; top: 8px; width: 64px; height: 64px; }
#ckh.tema .ran .seg { top: 26px; }
#ckh .estados { position: absolute; left: 4px; bottom: calc(100% + 6px); display: flex; gap: 6px; pointer-events: none; }
#ck-vig { position: absolute; inset: 0; z-index: 40; pointer-events: none; opacity: 0; background: radial-gradient(ellipse at center, transparent 55%, rgba(150,0,0,.55) 100%); transition: opacity .5s; }
#ck-vig.on { animation: cktVig 1s ease-in-out infinite; }
@keyframes cktVig { 0%, 100% { opacity: .35; } 12% { opacity: .85; } 30% { opacity: .4; } 40% { opacity: .7; } }
#ck-vig.golpe { animation: cktVigG .4s ease-out; }
@keyframes cktVigG { 0% { opacity: .9; } 100% { opacity: 0; } }
`;
  const st = document.createElement('style'); st.id = 'ckt-css'; st.textContent = css; document.head.append(st);

  // piezas nuevas dentro de la caja de ck_hud_heroe.js
  const med = caja.querySelector('.med'), der = caja.querySelector('.der');
  const vent = document.createElement('div'); vent.className = 'vent';
  vent.innerHTML = '<div class="f"></div><img class="c1" alt=""><img class="c2" alt=""><canvas width="96" height="96"></canvas><div class="rojo"></div><div class="verde"></div>';
  const brillo = document.createElement('div'); brillo.className = 'brillo';
  med.insertBefore(vent, med.firstChild); med.insertBefore(brillo, med.firstChild);
  const placa = document.createElement('div'); placa.className = 'placa';
  placa.innerHTML = '<span class="nom"></span><span class="mon"><i></i><span></span></span>' +
    '<div class="tb vida"><i class="ic"></i><div class="ll at"></div><div class="ll"></div><div class="tx"></div></div>' +
    '<div class="tb rec"><i class="ic"></i><div class="ll"></div><div class="tx"></div></div>';
  der.insertBefore(placa, der.firstChild);
  const estados = document.createElement('div'); estados.className = 'estados'; caja.appendChild(estados);
  const vig = document.createElement('div'); vig.id = 'ck-vig';
  const q = s => caja.querySelector(s);
  const c1 = vent.querySelector('img.c1'), c2 = vent.querySelector('img.c2'), cv = vent.querySelector('canvas'), gx = cv.getContext('2d');
  const rojo = vent.querySelector('.rojo'), verde = vent.querySelector('.verde');

  // ------------------------------------------------------------------ grietas y sangre (en el "vidrio" del retrato)
  let grietas = [];
  const R = (a, b) => a + Math.random() * (b - a);
  const nuevaGrieta = () => {
    // una grieta en zigzag que sale de un borde, con dos ramitas
    const lado = Math.floor(Math.random() * 4), p = [];
    let x = lado === 0 ? R(20, 76) : lado === 1 ? 95 : lado === 2 ? R(20, 76) : 0;
    let y = lado === 0 ? 0 : lado === 1 ? R(20, 76) : lado === 2 ? 95 : R(20, 76);
    const ang = Math.atan2(48 - y, 48 - x) + R(-0.5, 0.5), largo = R(16, 34);
    p.push([x, y]);
    for (let i = 0; i < 6; i++) { x += Math.cos(ang + R(-0.6, 0.6)) * largo / 6; y += Math.sin(ang + R(-0.6, 0.6)) * largo / 6; p.push([x, y]); }
    const ramas = [2, 4].map(i => { const a = ang + (Math.random() < 0.5 ? -1 : 1) * R(0.6, 1.2); return [p[i], [p[i][0] + Math.cos(a) * R(4, 9), p[i][1] + Math.sin(a) * R(4, 9)]]; });
    grietas.push({ p, ramas });
    if (grietas.length > 7) grietas.shift();
  };
  const linea = (x0, y0, x1, y1, col) => {
    gx.fillStyle = col; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    for (let i = 0; i <= n; i++) gx.fillRect(Math.round(x0 + (x1 - x0) * i / (n || 1)), Math.round(y0 + (y1 - y0) * i / (n || 1)), 1, 1);
  };
  let gotas = [];
  const pintarMarcas = (v, t) => {
    gx.clearRect(0, 0, 96, 96);
    grietas.forEach(g => {
      for (let i = 1; i < g.p.length; i++) { linea(g.p[i - 1][0] + 1, g.p[i - 1][1] + 1, g.p[i][0] + 1, g.p[i][1] + 1, 'rgba(0,0,0,.55)'); linea(g.p[i - 1][0], g.p[i - 1][1], g.p[i][0], g.p[i][1], 'rgba(235,245,255,.8)'); }
      g.ramas.forEach(([a, b]) => linea(a[0], a[1], b[0], b[1], 'rgba(220,235,255,.6)'));
    });
    if (v <= 0.34 && v > 0) {
      // gotas de sangre que bajan desde arriba
      if (gotas.length < 5 && Math.random() < 0.02) gotas.push({ x: R(24, 72) | 0, y: 14, v: R(0.04, 0.09), l: R(4, 9) | 0 });
      gotas.forEach(d => { d.y += d.v * 16; gx.fillStyle = 'rgba(130,0,8,.85)'; gx.fillRect(d.x, 14, 2, d.y - 14); gx.fillStyle = 'rgba(190,10,20,.95)'; gx.fillRect(d.x, d.y, 2, 2); gx.fillRect(d.x - 1, d.y + 1, 4, 2); });
      gotas = gotas.filter(d => d.y < 90);
      gx.fillStyle = 'rgba(120,0,6,.8)'; for (let x = 18; x < 78; x += 3) gx.fillRect(x, 14, 3, 1 + ((x * 7) % 3));
    } else gotas = [];
  };

  // ------------------------------------------------------------------ pintar al cambiar de héroe
  let visto = null, ultVida = null, ultMax = null, ultCura = 0;
  const pintar = (S, h) => {
    const a = HEROE(h), C = CFG[a], D = (typeof HEROES !== 'undefined' && HEROES[h]) || {};
    caja.classList.toggle('tema', !!AR['emb_' + a]);
    med.querySelector('.marco').style.backgroundImage = u('emb_' + a);
    med.style.setProperty('--ckt-mask', u('mascara_' + a));
    med.style.setProperty('--ckt-glow', C.glow);
    vent.style.setProperty('--ckh-c1', C.c1); vent.style.setProperty('--ckh-c2', C.c2);
    const [x, y, s, k] = C.cara, w = s * (k || 1);
    [c1, c2].forEach(im => { im.style.left = (x + (s - w) / 2) + 'px'; im.style.top = y + 'px'; im.style.width = w + 'px'; im.style.height = w + 'px'; im.style.imageRendering = k ? 'auto' : 'pixelated'; });
    const img = document.getElementById('hud-portrait-img');
    c1.src = D.portrait || (img && img.src) || '';
    c2.src = AR['herido_' + a] || c1.src;
    placa.style.backgroundImage = u('placa_' + a);
    const P = C.placa, nom = placa.querySelector('.nom'), mon = placa.querySelector('.mon');
    nom.textContent = D.name ? D.name.charAt(0) + D.name.slice(1).toLowerCase() : '';
    nom.style.left = P.l + 'px'; nom.style.top = (P.t + 1) + 'px'; nom.style.color = P.tinta || '#f3ead9';
    nom.style.textShadow = P.sombra || '0 2px 0 #000, 0 0 6px #000';
    mon.style.right = (352 - P.r) + 'px'; mon.style.top = (P.t + 4) + 'px';
    const [tv, tr] = placa.querySelectorAll('.tb'), izq = P.l + 24;
    [[tv, P.t + 30], [tr, P.t + 55]].forEach(([b, t]) => { b.style.left = izq + 'px'; b.style.width = (P.r - izq) + 'px'; b.style.top = t + 'px'; });
    tv.querySelector('.ic').style.backgroundImage = 'url(' + IC.corazon + ')';
    tr.querySelector('.ic').style.backgroundImage = 'url(' + IC[C.rec] + ')';
    const H0 = window.CK_HUD_HEROE_ARTE || {};
    tv.querySelector('.ll:not(.at)').style.backgroundImage = H0.relleno_vida ? 'url("' + H0.relleno_vida + '")' : 'linear-gradient(#ff6a6a,#b01c28)';
    tr.querySelector('.ll').style.backgroundImage = H0['relleno_rec_' + a] ? 'url("' + H0['relleno_rec_' + a] + '")' : 'linear-gradient(#6ab0ff,#1c4ab0)';
    caja.querySelectorAll('.ran').forEach(r => { r.style.backgroundImage = u('ranura_' + a); });
    grietas = []; gotas = []; ultVida = null;
  };
  const reiniciar = (el, cl) => { el.classList.remove(cl); void el.offsetWidth; el.classList.add(cl); };
  window.addEventListener('ck-ulti', () => { if (caja.classList.contains('tema')) reiniciar(med, 'ulti'); });

  const cuadro = () => {
    try {
      const S = ESCENA();
      if (vig.parentElement !== caja.parentElement && caja.parentElement) caja.parentElement.appendChild(vig);
      const on = caja.classList.contains('on') && S && S.player;
      if (!on) { vig.classList.remove('on'); vig.style.opacity = 0; }
      if (on) {
        const h = S.playerHero;
        if (h !== visto) { visto = h; pintar(S, h); }
        if (!caja.classList.contains('tema')) { requestAnimationFrame(cuadro); return; }
        const hp = S.health || 0, mx = S.maxHealth || 1, v = Math.max(0, Math.min(1, hp / mx));
        const m = S.maxStamina > 0 ? Math.max(0, Math.min(1, S.stamina / S.maxStamina)) : 1;
        // barras de la placa
        const [tv, tr] = placa.querySelectorAll('.tb');
        tv.querySelectorAll('.ll').forEach(e => e.style.setProperty('--vacio', (100 - v * 100) + '%'));
        tr.querySelector('.ll').style.setProperty('--vacio', (100 - m * 100) + '%');
        tv.querySelector('.tx').textContent = hp + ' / ' + mx;
        tr.querySelector('.tx').textContent = Math.round(S.stamina || 0) + ' / ' + Math.round(S.maxStamina || 100);
        tv.classList.toggle('baja', v <= 0.34);
        const s = S.story || {}, mon = placa.querySelector('.mon');
        mon.style.display = S._gameMode === 'campaign' ? '' : 'none'; mon.querySelector('span').textContent = s.coins || 0;
        // golpes y curas
        if (ultVida !== null && ultMax === mx) {
          if (hp < ultVida) {
            reiniciar(med, 'golpe'); reiniciar(rojo, 'va'); nuevaGrieta();
            if (v > 0.34) reiniciar(vig, 'golpe');
          } else if (hp > ultVida) {
            reiniciar(verde, 'va'); reiniciar(med, 'cura'); ultCura = performance.now();
            grietas.splice(0, Math.ceil(grietas.length / 2));
          }
        }
        if (v >= 1 && grietas.length && performance.now() - ultCura > 400) grietas = [];
        ultVida = hp; ultMax = mx;
        // desgaste
        c2.style.opacity = v <= 0.5 && hp > 0 ? 1 : 0;
        c1.style.opacity = v <= 0.5 && hp > 0 ? 0 : 1;
        cv.style.opacity = 0.35 + 0.65 * (1 - v);
        const crit = v <= 0.34 && hp > 0;
        med.classList.toggle('critico', crit);
        med.classList.toggle('muerto', hp <= 0 || !!S.isDead);
        if (crit && !vig.classList.contains('on')) { vig.classList.remove('golpe'); vig.classList.add('on'); }
        if (!crit) vig.classList.remove('on');
        pintarMarcas(v, performance.now());
      }
    } catch (e) { if (!cuadro._av) { cuadro._av = 1; console.warn('[hud tema]', e); } }
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
  window.CK_HUD_TEMA = { caja, estados, pintar, IC };
})();
