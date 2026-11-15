'use strict';
/* La Mazmorra del Sello: la llegada, las runas del portón y los puzzles nuevos (14/11, notas del dueño):
   - 131 "aca llegamos en cinematica por un portal, y luego el portal desaparece": la primera vez, el portal de Oswin se abre
     grande, escupe al héroe y se cierra detrás. Ya no está (ni su cartel): no hay vuelta atrás hasta el final.
   - 142 "q los puzzles solo abran 4 runas y q en las misiones principales, cuando encontremos notas y demas podamos decifrar
     las runas q faltan… cada que hagamos una bien la runa encendera y al tener todas explotaran junto con la entrada":
     LAS SIETE RUNAS DEL PORTÓN DE HUESOS (el del salón, una en cada barrote). Cuatro salen de los puzzles de la mazmorra
     y tres se descifran en la historia:
       · Runa de la Lava: al cruzar los pilares del río de lava.
       · Runa de los Reyes: dentro del obelisco del santuario (las cuatro coronas lo desarman; se rompe a golpes).
       · Runa de la Fragua: el puzzle nuevo de la fragua (abajo).
       · Runa de la Luz: cuando la luz santa quema el segundo obelisco, la luz vuelve y termina en el cristal (nota 134).
       · Runa del Hueso (Libro del Sello, al sellar al Nigromante), Runa de la Sangre (lo que dice Grushak y el cristal rojo)
         y Runa del Pilar (las notas de Eloy que lee Bruno en el campamento): apenas pasa eso en la historia aparece la
         runa para descifrar; se lee la pista y se elige el dibujo que describe (si se elige mal, se vuelve a leer).
     Las runas que se llevan se guardan como objetos de misión (Inventario, en M). Al acercarse al portón, cada una se
     enciende en su barrote; con las siete, estallan con el portón y se pasa. Con T en el portón: cuáles faltan y dónde.
   - 140 "cambia el puzzle de esta sala, que sea algo de ordenar piezas… y q avanzar desbloquee las siguientes etapas":
     LA ESPADA DE LA FRAGUA. Ya no hay placas de pinchos: cuatro pedestales con las piezas de una espada (pomo, mango,
     guarda y hoja) desordenadas, y en el piso, grabada, la espada entera. Con T se toma una pieza y se pone o se cambia en
     otro pedestal. Cada pieza en su lugar se traba, se ilumina su parte del grabado y se prende una luz de la reja del
     pasillo al criadero; con las cuatro la espada se arma, sale la Runa de la Fragua y la reja se abre (sin eso no se
     llega al criadero).
   - 137 "algun enemigo del infierno con proyectil nos pega desde afuera y eso nos empuja a la lava, podemos hacer parry
     con el bloquear para regresarle el proyectil": EL DIABLILLO DE FUEGO flota sobre la lava, al oeste del puente, y tira
     bolas de fuego al que cruza. Pegan y empujan: si el empujón cae en la lava, quema y vuelve a la losa. Con la parada
     (C) justo cuando llega, la bola vuelve y le pega a él; con tres, cae a la lava.
   - 134 "aca aparecen golems de infierno enemigos": los GÓLEMS DEL INFIERNO (PixelLab) salen de las grietas junto al
     cristal del criadero; uno más cuida la Runa de la Luz.
   Va después de ck_mazmorra_sello.js (y su arte) y de ck_mazmorra_final_arte.js. Borrar su línea de index.html vuelve a
   la mazmorra de antes (los dos obeliscos abren el portón). */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_MAZMORRA || !window.CK_MAZMORRA._t) return;
  const P = MainGameScene.prototype, MZ = window.CK_MAZMORRA, T = MZ._t, Z = MZ.Z;
  const ART = window.CK_MZ_FINAL_ARTE || {};
  const ADD = () => Phaser.BlendModes.ADD;
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const aqui = S => !!(S && zona(S) === Z && S.currentInterior && S.currentInterior.area);
  const fl = S => MZ.fl(S);
  const guardar = S => { try { S.saveStory && S.saveStory(); } catch (e) {} };
  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const R = (a, b) => a + Math.random() * (b - a);
  const vivo = e => e && e.active && !e.isDead;
  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const E = () => window.CK_ESCENA;
  const libre = () => !!(window.CK_LIBRE && CK_LIBRE());
  const runas = S => { const s = S && S.story; if (!s) return {}; s.flags = s.flags || {}; return (s.flags.runas = s.flags.runas || {}); };

  // ================================================================== el gólem del infierno (enemigo nuevo, hojas de 100 px)
  window.GAME_ASSETS_BASE64 = window.GAME_ASSETS_BASE64 || {};
  // (14/11) el Flame Golem del pack del dueño (Tiny RPG Character Asset Pack 02): ataque 1 puñetazo, ataque 2 golpe al piso
  if (typeof ENEMY_TYPES !== 'undefined' && ART.golem_infierno_idle && !ENEMY_TYPES.golem_infierno) {
    ['idle', 'walk', 'attack1', 'attack2', 'hurt', 'death'].forEach(a => { window.GAME_ASSETS_BASE64['golem_infierno_' + a] = ART['golem_infierno_' + a]; });
    ENEMY_TYPES.golem_infierno = { name: 'Gólem del infierno', frames: { idle: 6, walk: 12, attack1: 9, attack2: 9, hurt: 4, death: 6 }, hp: 8, speed: 52, dmg: 2, reach: 50,
      cd: 2000, hitAt: 380, xp: 40, coins: 9, scale: 1.3, sfx: ['ck_piedra_pesada', 'ck_piedra', 'ck_derrumbe', 0.85] };
  }

  // ================================================================== las runas
  // dibujo de cada runa en una grilla de 7 × 10 (líneas de punta a punta)
  const RUNAS = {
    hueso: { n: 'Runa del Hueso', g: [[[1, 0], [1, 9]], [[1, 2], [5, 5], [1, 8]]], mision: 1 },
    lava: { n: 'Runa de la Lava', g: [[[0, 7], [2, 3], [4, 7], [6, 3]], [[0, 9], [6, 9]]], donde: 'en el río de lava, al oeste: cruzá los pilares' },
    reyes: { n: 'Runa de los Reyes', g: [[[0, 8], [0, 3], [2, 5], [3, 2], [4, 5], [6, 3], [6, 8], [0, 8]]], donde: 'adentro del obelisco del santuario: prendé las cuatro coronas y rompelo' },
    sangre: { n: 'Runa de la Sangre', g: [[[3, 9], [3, 0]], [[3, 4], [0, 1]], [[3, 4], [6, 1]]], mision: 1 },
    fragua: { n: 'Runa de la Fragua', g: [[[3, 0], [3, 8]], [[1, 6], [5, 6]], [[2, 9], [4, 9]]], donde: 'en la fragua del este: armá la espada de los pedestales' },
    luz: { n: 'Runa de la Luz', g: [[[3, 1], [6, 4], [3, 7], [0, 4], [3, 1]], [[3, 9], [3, 9]], [[3, 4], [3, 4]]], donde: 'en el cristal del criadero: que la luz santa queme el obelisco' },
    pilar: { n: 'Runa del Pilar', g: [[[1, 0], [1, 9]], [[5, 0], [5, 9]], [[0, 8], [6, 2]]], mision: 1 }
  };
  const ORDEN = ['hueso', 'lava', 'reyes', 'sangre', 'fragua', 'luz', 'pilar'];
  const BARRAS = [685, 695, 706, 716, 728, 738, 750], BARRA_Y = 403, PORTON = { x: 719, y: 440 };
  // las tres de la historia: cuándo se pueden descifrar y qué dice la pista
  const MISION = {
    hueso: { puede: f => !!(f.cristales && f.cristales.verde), fuente: 'Del Libro del Sello',
      cita: '«Lo que el hueso guarda, el hueso lo cierra con la marca de la espina: una línea derecha y, pegada a su costado, una punta que muerde.»' },
    sangre: { puede: f => !!(f.cristales && f.cristales.rojo), fuente: 'Las últimas palabras de Grushak y el cristal rojo',
      cita: '«Su sangre… abre lo que está cerrado.» Adentro del cristal rojo se ve una marca: un tronco que se abre en dos ramas hacia arriba, como manos que piden.' },
    pilar: { puede: f => (f.c3 || 0) >= 2, fuente: 'Las notas de Eloy',
      cita: '«Tres pilares: el verde, el rojo… y el tercero no es de piedra.» En el margen, Eloy dibujó dos columnas cruzadas por un tajo en diagonal.' }
  };
  const cuantas = (S, v) => ORDEN.filter(id => (runas(S)[id] || 0) >= (v || 1)).length;

  /** La loseta de una runa (11 × 15), apagada (tallada en la piedra) o encendida (oro que brilla). */
  const texRuna = (S, id, on) => {
    const k = 'ckru_' + id + (on ? '_on' : '_off'); if (S.textures.exists(k)) return k;
    const W = 11, H = 15, t = S.textures.createCanvas(k, W, H), g = t.getContext();
    const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    r(0, 0, W, H, '#140d0e'); r(1, 1, W - 2, H - 2, on ? '#5a3420' : '#4a403c'); r(1, 1, W - 2, 1, on ? '#8a5a34' : '#6a5e58'); r(1, H - 2, W - 2, 1, '#2a201e');
    const pt = (x, y) => r(2 + x, 2 + y, 1, 1, on ? '#ffe08a' : '#1c1210');
    RUNAS[id].g.forEach(l => {
      for (let i = 0; i < l.length; i++) {
        const [x0, y0] = l[i], [x1, y1] = l[i + 1] || l[i];
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let j = 0; j <= n; j++) pt(Math.round(x0 + (x1 - x0) * j / n), Math.round(y0 + (y1 - y0) * j / n));
      }
    });
    t.refresh();
    return k;
  };
  /** La misma runa en grande, para el cartel de descifrar y el inventario. */
  const svgRuna = (id, col, tam) => {
    const z = tam || 54;
    const partes = RUNAS[id].g.map(l => l.length === 1 || (l.length === 2 && l[0][0] === l[1][0] && l[0][1] === l[1][1])
      ? `<rect x="${l[0][0]}" y="${l[0][1]}" width="1" height="1" fill="${col}"/>`
      : `<polyline points="${l.map(p => (p[0] + 0.5) + ',' + (p[1] + 0.5)).join(' ')}"/>`).join('');
    return `<svg viewBox="-1 -1 9 12" width="${z}" height="${Math.round(z * 12 / 9)}" style="image-rendering:pixelated"><g fill="none" stroke="${col}" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter">${partes}</g></svg>`;
  };

  /** Una runa nueva: sube brillando del lugar donde salió, vuela al héroe y queda como objeto de misión. */
  const dar = (S, id, x, y) => {
    const rr = runas(S); if (rr[id]) return false;
    rr[id] = 1; guardar(S);
    const k = texRuna(S, id, true);
    const halo = S.add.image(x, y, 'ckmz_halo').setTint(0xffc860).setBlendMode(ADD()).setScale(0.7).setAlpha(0.9).setDepth(29990);
    const sp = S.add.image(x, y, k).setScale(2).setDepth(30000);
    son('quest_done', 0.7) || son('magic_cast', 0.7);
    try { T.chispas(S, x, y, 14, 0xffd27a, 50); } catch (e) {}
    S.tweens.add({ targets: [sp, halo], y: y - 34, duration: 750, ease: 'Sine.easeOut', onComplete: () => {
      S.tweens.add({ targets: [sp, halo], x: S.player.x, y: S.player.y - 30, scale: 0.6, alpha: 0.2, duration: 650, ease: 'Quad.easeIn', onComplete: () => { sp.destroy(); halo.destroy(); } });
    } });
    S.time.delayedCall(600, () => S.player && S.createFloatingText(S.player.x, S.player.y - 60, '◆ ' + RUNAS[id].n.toUpperCase() + ' ◆', 0xfde68a));
    try { S.updateObjective && S.updateObjective(); } catch (e) {}
    S.time.delayedCall(1700, () => { try { T.nota(`Tenés la ${RUNAS[id].n} (${cuantas(S)}/7). Se enciende sola cuando te acercás al portón de huesos del salón`); } catch (e) {} });
    return true;
  };

  // ================================================================== descifrar (las tres de la historia)
  let dom = null, actual = null;
  const armarDom = () => {
    if (dom) return dom;
    const st = document.createElement('style');
    st.textContent = `#ck-runa{position:fixed;inset:0;z-index:400;display:none;align-items:center;justify-content:center;background:rgba(10,5,6,.74)}
#ck-runa.on{display:flex}
#ck-runa .pan{width:min(560px,92vw);background:#2a1d17;border:3px solid #8a6a3a;box-shadow:0 0 0 3px #120b08,0 10px 0 rgba(0,0,0,.45);padding:18px 22px 16px;color:#f3e6c8;font:17px 'CK Grenze',Georgia,serif;text-align:center}
#ck-runa h3{margin:0 0 2px;font-size:24px;letter-spacing:2px;color:#ffd27a}
#ck-runa .fu{font-size:14px;color:#c9a978;margin-bottom:10px}
#ck-runa .ci{font-style:italic;line-height:1.35;background:#1c130f;border:2px solid #4a3424;padding:10px 12px;margin-bottom:12px}
#ck-runa .ops{display:flex;gap:16px;justify-content:center;margin:6px 0 10px}
#ck-runa .op{background:#4a403c;border:3px solid #140d0e;box-shadow:inset 0 2px 0 #6a5e58;padding:8px 12px;cursor:pointer;transition:transform .08s}
#ck-runa .op:hover{transform:translateY(-2px);background:#564a45}
#ck-runa .op.mal{animation:ckRunaMal .35s;background:#5a2020}
#ck-runa .op.bien{background:#5a3420;box-shadow:0 0 18px #ffc860}
@keyframes ckRunaMal{25%{transform:translateX(-6px)}50%{transform:translateX(6px)}75%{transform:translateX(-4px)}}
#ck-runa .ms{min-height:22px;color:#fca5a5;margin-bottom:8px}
#ck-runa .ms.ok{color:#fde68a}
#ck-runa .luego{background:none;border:2px solid #8a6a3a;color:#c9a978;font:15px 'CK Grenze',Georgia,serif;padding:4px 14px;cursor:pointer}`;
    document.head.appendChild(st);
    dom = document.createElement('div'); dom.id = 'ck-runa';
    dom.innerHTML = '<div class="pan"><h3>Una runa por descifrar</h3><div class="fu"></div><div class="ci"></div><div class="ops"></div><div class="ms"></div>' +
      '<div style="font-size:14px;color:#a88c64;margin-bottom:8px">Elegí el dibujo que describe el texto</div><button class="luego">Más tarde</button></div>';
    (document.getElementById('game-wrapper') || document.body).appendChild(dom);
    dom.querySelector('.luego').onclick = () => { const S = actual && actual.S; if (S) { S._ckRunaPausa = S.time.now + 120000; S.closeOverlay && S.closeOverlay(); } };
    return dom;
  };
  const descifrar = (S, id) => {
    const M = MISION[id]; if (!M || runas(S)[id] || !S.openOverlay) return false;
    const d = armarDom();
    const ops = Object.keys(MISION).sort(() => Math.random() - 0.5);
    d.querySelector('.fu').textContent = M.fuente;
    d.querySelector('.ci').textContent = M.cita;
    d.querySelector('.ms').textContent = ''; d.querySelector('.ms').className = 'ms';
    d.querySelector('.ops').innerHTML = ops.map(o => `<div class="op" data-r="${o}">${svgRuna(o, '#f3e6c8')}</div>`).join('');
    if (!S.openOverlay('ck-runa')) return false;
    actual = { S, id };
    d.querySelectorAll('.op').forEach(el => el.onclick = () => {
      if (!actual || actual.listo) return;
      if (el.dataset.r !== id) {
        el.classList.remove('mal'); void el.offsetWidth; el.classList.add('mal');
        d.querySelector('.ms').textContent = 'No es esa… Leé otra vez lo que dice.';
        son('ui_error', 0.5) || son('sword_hit', 0.3, { rate: 0.6 });
        return;
      }
      actual.listo = true;
      el.classList.add('bien'); el.innerHTML = svgRuna(id, '#ffd27a');
      const ms = d.querySelector('.ms'); ms.className = 'ms ok';
      ms.textContent = `¡Descifrada! La ${RUNAS[id].n} es tuya: llevala al portón del Sello.`;
      son('quest_done', 0.8) || son('magic_cast', 0.7);
      runas(S)[id] = 1; guardar(S);
      try { S.updateObjective && S.updateObjective(); } catch (e) {}
      setTimeout(() => { try { if (S._overlay === 'ck-runa') S.closeOverlay(); } catch (e) {} actual = null;
        try { S.createFloatingText(S.player.x, S.player.y - 60, '◆ ' + RUNAS[id].n.toUpperCase() + ' ◆', 0xfde68a); } catch (e) {} }, 1700);
    });
    return true;
  };
  const pendiente = S => {
    const f = (S.story && S.story.flags) || {};
    return Object.keys(MISION).find(id => !runas(S)[id] && MISION[id].puede(f)) || null;
  };

  // ================================================================== el portón de huesos: las siete runas
  const armarPorton = (S, M, F) => {
    const a = M.a, U = M._ru;
    U.ranuras = {};
    if (F.reja) return;
    ORDEN.forEach((id, i) => {
      const on = (runas(S)[id] || 0) >= 2;
      const sp = S.add.image(a.x + BARRAS[i], a.y + BARRA_Y, texRuna(S, id, on)).setDepth(a.y + 437);
      const halo = S.add.image(sp.x, sp.y, 'ckmz_halo').setTint(0xffb050).setBlendMode(ADD()).setScale(0.32).setDepth(a.y + 436.5).setAlpha(on ? 0.7 : 0);
      if (on) S.tweens.add({ targets: halo, alpha: { from: 0.45, to: 0.85 }, duration: 900 + i * 60, yoyo: true, repeat: -1 });
      M.objs.push(sp, halo);
      U.ranuras[id] = { sp, halo };
    });
  };
  const encender = (S, id) => {
    const M = S._mz, U = M && M._ru, q = U && U.ranuras[id]; if (!q) return;
    runas(S)[id] = 2; guardar(S);
    q.sp.setTexture(texRuna(S, id, true));
    S.tweens.add({ targets: q.sp, scale: { from: 2, to: 1 }, duration: 380, ease: 'Back.easeOut' });
    q.halo.setAlpha(1); S.tweens.add({ targets: q.halo, alpha: { from: 0.45, to: 0.85 }, duration: 950, yoyo: true, repeat: -1, delay: 400 });
    son('magic_cast', 0.6, { rate: 1.2 }) || son('quest_done', 0.5);
    try { T.chispas(S, q.sp.x, q.sp.y, 8, 0xffd27a, 26); } catch (e) {}
    const n = cuantas(S, 2);
    S.createFloatingText(q.sp.x, q.sp.y - 26, `${RUNAS[id].n} (${n}/7)`, 0xfde68a);
    try { S.updateObjective && S.updateObjective(); } catch (e) {}
  };
  const estallar = S => {
    const M = S._mz, U = M && M._ru, F = fl(S); if (!U || U.estalla || F.reja) return;
    U.estalla = true;
    const a = M.a, es = E();
    const boom = () => {
      S.cameras.main.shake(900, 0.013); S.cameras.main.flash(420, 255, 210, 140);
      son('ck_derrumbe_pesado', 1) || son('ck_derrumbe', 1);
      for (let i = 0; i < 30; i++) {
        const x = a.x + R(672, 766), y = a.y + R(378, 430);
        const c = S.add.rectangle(x, y, R(3, 8), R(2, 4), Math.random() < 0.7 ? 0xe8dcc0 : 0xffc860).setDepth(a.y + 470).setAngle(R(0, 180));
        S.tweens.add({ targets: c, x: x + R(-120, 120), y: y + R(-40, 90), angle: R(-400, 400), duration: R(500, 900), ease: 'Quad.easeOut',
          onComplete: () => S.tweens.add({ targets: c, alpha: 0, delay: 900, duration: 400, onComplete: () => c.destroy() }) });
      }
      Object.values(U.ranuras).forEach(q => { try { q.sp.destroy(); q.halo.destroy(); } catch (e) {} });
      try { T.abrirHuesos(S, false); } catch (e) {}
      try { T.polvo(S, a.x + 719, a.y + 430, 22, 0x6a5a52); } catch (e) {}
    };
    if (!es || !es.correr) { boom(); return; }
    es.correr(S, async () => {
      await es.camara(S, 719, 410, 700);
      for (const id of ORDEN) {
        const q = U.ranuras[id]; if (!q) continue;
        q.halo.setTint(0xfff0c0); S.tweens.add({ targets: q.sp, scale: 1.6, duration: 120, yoyo: true });
        son('magic_cast', 0.35, { rate: 1.5 });
        await es.esperar(150);
      }
      S.cameras.main.shake(500, 0.004);
      await es.esperar(450);
      boom();
      await es.esperar(1100);
      es.seguir(S);
    }).then(() => { try { T.nota('Las siete runas estallaron con el portón de huesos. Arriba esperan las baldosas… y el Sello'); } catch (e) {} });
  };

  // ================================================================== la fragua: la espada de los pedestales
  const PIEZAS = ['pomo', 'mango', 'guarda', 'hoja'];
  const NOMBRE = { pomo: 'el pomo', mango: 'el mango', guarda: 'la guarda', hoja: 'la hoja' };
  const PED = [[1040, 600], [1084, 600], [1128, 600], [1172, 600]];
  const INICIO = ['guarda', 'hoja', 'pomo', 'mango'];
  const REJA_F = [1150, 484, 70, 14];
  const texFragua = S => {
    const T2 = S.textures;
    const lienzo = (k, w, h, fn) => { if (T2.exists(k)) return; const c = T2.createCanvas(k, w, h), g = c.getContext(); fn(g, (x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); }); c.refresh(); };
    lienzo('ckmzf_ped', 26, 24, (g, r) => {
      r(0, 4, 26, 20, '#120c0d'); r(1, 5, 24, 18, '#4a3e3a'); r(1, 5, 24, 6, '#6a5e58'); r(2, 6, 22, 1, '#857770'); r(1, 11, 24, 1, '#2a201e');
      r(3, 14, 2, 7, '#3a302c'); r(21, 14, 2, 7, '#3a302c'); r(0, 0, 26, 5, '#120c0d'); r(1, 1, 24, 3, '#5a4e48');
    });
    lienzo('ckmzf_pomo', 22, 14, (g, r) => { r(7, 3, 8, 8, '#1a1010'); r(8, 4, 6, 6, '#b07a30'); r(9, 4, 3, 2, '#f0c060'); r(10, 6, 2, 2, '#d02a20'); r(15, 6, 5, 2, '#1a1010'); r(15, 6, 5, 1, '#6a5040'); });
    lienzo('ckmzf_mango', 22, 14, (g, r) => { r(1, 4, 20, 6, '#1a1010'); r(2, 5, 18, 4, '#6a3a1e'); for (let x = 3; x < 20; x += 3) r(x, 5, 1, 4, '#3a1e0e'); r(2, 5, 18, 1, '#8a5a2e'); });
    lienzo('ckmzf_guarda', 22, 14, (g, r) => { r(8, 0, 6, 14, '#1a1010'); r(9, 1, 4, 12, '#9aa0aa'); r(9, 1, 1, 12, '#d8dde4'); r(9, 6, 4, 2, '#b07a30'); });
    lienzo('ckmzf_hoja', 22, 14, (g, r) => {
      r(0, 4, 18, 6, '#1a1010'); r(18, 5, 2, 4, '#1a1010'); r(20, 6, 2, 2, '#1a1010');
      r(1, 5, 17, 4, '#c8ccd4'); r(18, 6, 2, 2, '#c8ccd4'); r(1, 5, 17, 1, '#f2f4f8'); r(1, 8, 17, 1, '#ff9a40'); r(1, 7, 12, 1, '#9aa0aa');
    });
    lienzo('ckmzf_reja', 70, 26, (g, r) => {
      r(0, 6, 70, 4, '#0b0a0d'); r(0, 7, 70, 2, '#3d3c46'); r(0, 20, 70, 4, '#0b0a0d'); r(0, 21, 70, 2, '#3d3c46');
      for (let x = 2; x < 70; x += 6) { r(x, 0, 3, 26, '#0b0a0d'); r(x + 1, 0, 1, 26, '#55545f'); }
    });
  };
  const armarFragua = (S, M, F) => {
    const a = M.a, U = M._ru;
    // fuera las placas de pinchos (nota 140: el puzzle de la sala es otro)
    try { (M.puas || []).forEach(p => p.sp.destroy()); } catch (e) {}
    M.puas = []; M.puasProx = Infinity;
    texFragua(S);
    if (!F.forja) F.forja = { p: INICIO.slice(), ok: [0, 0, 0, 0], lleva: null };
    const Fo = F.forja;
    if (F.fragua) Fo.p = PIEZAS.slice(), Fo.ok = [1, 1, 1, 1], Fo.lleva = null;
    // el grabado del piso: la espada entera, una parte debajo de cada pedestal
    const gr = S.add.graphics().setDepth(a.y + 7.8).setBlendMode(ADD());
    M.objs.push(gr); U.grabado = gr;
    U.ped = PED.map(([x, y], i) => {
      const base = S.add.image(a.x + x, a.y + y, 'ckmzf_ped').setOrigin(0.5, 1).setDepth(a.y + y);
      const halo = S.add.image(a.x + x, a.y + y - 16, 'ckmz_halo').setTint(0xffb050).setBlendMode(ADD()).setScale(0.55, 0.4).setDepth(a.y + y - 0.5).setAlpha(Fo.ok[i] ? 0.6 : 0.28);   // un poco de luz: que se vean las piezas en la penumbra
      const pz = S.add.image(a.x + x, a.y + y - 26, 'ckmzf_' + (Fo.p[i] || 'pomo')).setDepth(a.y + y + 0.5).setVisible(!!Fo.p[i]);
      const z = S.add.zone(a.x + x, a.y + y - 5, 22, 10); S.physics.add.existing(z, true); S.interiorObstacles.add(z);
      S.tweens.add({ targets: pz, y: pz.y - 2, duration: 1100 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      M.objs.push(base, halo, pz, z);
      return { i, x, y, base, halo, pz };
    });
    const lleva = S.add.image(0, 0, 'ckmzf_pomo').setDepth(29000).setVisible(false);
    M.objs.push(lleva); U.lleva = lleva;
    // la reja del pasillo al criadero, con sus cuatro luces
    if (!F.rejaForja) {
      const [x, y, w, h] = REJA_F;
      const sp = S.add.image(a.x + x, a.y + y - 12, 'ckmzf_reja').setOrigin(0, 0).setDepth(a.y + y + h);
      const z = S.add.zone(a.x + x + w / 2, a.y + y + h / 2, w, h); S.physics.add.existing(z, true); S.interiorObstacles.add(z);
      const luces = [0, 1, 2, 3].map(i => S.add.circle(a.x + x + 14 + i * 14, a.y + y - 4, 2.5, Fo.ok[i] ? 0xffd27a : 0x5a1010).setDepth(a.y + y + h + 1));
      M.objs.push(sp, z, ...luces);
      U.rejaF = { sp, z, luces };
    }
    pintarGrabado(S);
  };
  const pintarGrabado = S => {
    const M = S._mz, U = M._ru, a = M.a, Fo = fl(S).forja, g = U.grabado; if (!g || !Fo) return;
    g.clear();
    const y = a.y + 618, X = PED.map(p => a.x + p[0]);
    const tramo = (i, fn) => { g.lineStyle(1.5, 0xffc860, Fo.ok[i] ? 0.85 : 0.22); fn(); };
    tramo(0, () => g.strokeCircle(X[0], y, 5));
    tramo(1, () => { g.strokeRect(X[0] + 6, y - 2, X[2] - X[0] - 10, 4); });
    tramo(2, () => { g.lineBetween(X[2] - 2, y - 9, X[2] - 2, y + 9); g.lineBetween(X[2] + 2, y - 9, X[2] + 2, y + 9); });
    tramo(3, () => { g.beginPath(); g.moveTo(X[2] + 4, y - 3); g.lineTo(X[3] + 26, y - 3); g.lineTo(X[3] + 34, y); g.lineTo(X[3] + 26, y + 3); g.lineTo(X[2] + 4, y + 3); g.strokePath(); });
  };
  const pedestalCerca = S => {
    const M = S._mz, U = M && M._ru; if (!U || !U.ped) return null;
    const p = pies(S), a = M.a;
    return U.ped.find(q => Math.abs(p.x - a.x - q.x) < 22 && p.y - a.y - q.y > -2 && p.y - a.y - q.y < 40) || null;
  };
  const usarPedestal = (S, q) => {
    const F = fl(S), Fo = F.forja, U = S._mz._ru;
    if (Fo.ok[q.i]) { S.createFloatingText(S.player.x, S.player.y - 50, 'Esa pieza ya encaja: no se mueve', 0xfde68a); return; }
    const tenia = Fo.p[q.i], llevo = Fo.lleva;
    if (!tenia && !llevo) return;
    Fo.p[q.i] = llevo; Fo.lleva = tenia || null;
    son('chest_open', 0.35, { rate: 1.6 }) || son('ui_click', 0.6);
    q.pz.setVisible(!!Fo.p[q.i]); if (Fo.p[q.i]) q.pz.setTexture('ckmzf_' + Fo.p[q.i]);
    U.lleva.setVisible(!!Fo.lleva); if (Fo.lleva) U.lleva.setTexture('ckmzf_' + Fo.lleva);
    if (Fo.p[q.i] === PIEZAS[q.i]) trabar(S, q);
    guardar(S);
  };
  const trabar = (S, q) => {
    const F = fl(S), Fo = F.forja, U = S._mz._ru, a = S._mz.a;
    Fo.ok[q.i] = 1;
    son('door_gate', 0.5, { rate: 1.4 }) || son('sword_hit', 0.6, { rate: 0.7 });
    son('magic_cast', 0.4, { rate: 1.3 });
    q.halo.setAlpha(0.6);
    try { T.chispas(S, q.pz.x, q.pz.y, 8, 0xffb050, 24); } catch (e) {}
    S.createFloatingText(q.pz.x, q.pz.y - 16, '¡Encaja ' + NOMBRE[PIEZAS[q.i]] + '!', 0xfde68a);
    if (U.rejaF) { U.rejaF.luces[q.i].setFillStyle(0xffd27a); S.tweens.add({ targets: U.rejaF.luces[q.i], scale: { from: 2.2, to: 1 }, duration: 300 }); }
    pintarGrabado(S);
    const n = Fo.ok.filter(Boolean).length;
    if (n < 4) { try { T.nota(`La espada de la fragua: ${n}/4 piezas en su lugar. Cada una prende una luz de la reja del pasillo al criadero`); } catch (e) {} return; }
    // las cuatro: la espada se arma sobre los pedestales, sale la runa y se abre la reja
    F.fragua = 1; guardar(S);
    const cx = a.x + 1106, cy = a.y + 548;
    const vol = U.ped.map((qq, i) => {
      const s2 = S.add.image(qq.pz.x, qq.pz.y, 'ckmzf_' + PIEZAS[i]).setDepth(30000);
      S.tweens.add({ targets: s2, x: cx - 30 + i * 20, y: cy, duration: 700, delay: 300 + i * 120, ease: 'Sine.easeInOut' });
      return s2;
    });
    S.time.delayedCall(1500, () => {
      S.cameras.main.flash(300, 255, 200, 120); S.cameras.main.shake(400, 0.006);
      son('ck_hachazo', 0.7) || son('sword_hit', 1, { rate: 0.6 });
      try { T.chispas(S, cx, cy, 24, 0xffb050, 60); } catch (e) {}
      vol.forEach(s2 => S.tweens.add({ targets: s2, alpha: 0, duration: 600, delay: 500, onComplete: () => s2.destroy() }));
      dar(S, 'fragua', cx, cy);
      abrirRejaF(S, true);
    });
  };
  const abrirRejaF = (S, anim) => {
    const F = fl(S), U = S._mz && S._mz._ru; F.rejaForja = 1; guardar(S);
    const r = U && U.rejaF; if (!r) return;
    U.rejaF = null;
    try { r.z.body.enable = false; S.interiorObstacles.remove(r.z); r.z.destroy(); } catch (e) {}
    S._navGrid = null;
    if (!anim) { [r.sp].concat(r.luces).forEach(o => o.destroy()); return; }
    S.time.delayedCall(900, () => {
      son('ck_cadenas', 0.8) || son('door_gate', 0.8);
      S.tweens.add({ targets: [r.sp].concat(r.luces), y: '-=26', alpha: 0, duration: 1300, ease: 'Quad.easeIn', onComplete: () => [r.sp].concat(r.luces).forEach(o => o.destroy()) });
      try { T.nota('Se abrió la reja del pasillo: al norte, el criadero y el cristal'); } catch (e) {}
    });
  };

  // ================================================================== el diablillo de fuego sobre la lava
  const TIRADOR = { x: 128, y: 560 };
  const CRUCE = [190, 470, 476, 640];               // dónde está el que cruza (los pilares, el puente y la losa)
  const enCruce = q => q.x > CRUCE[0] && q.x < CRUCE[2] && q.y > CRUCE[1] && q.y < CRUCE[3];
  const enLava = (S, x, y) => {
    const M = S._mz; if (!M || !M.lava) return false;
    return M.lava.getChildren().some(z => z.body && z.body.enable && x >= z.body.x && x <= z.body.right && y >= z.body.y && y <= z.body.bottom);
  };
  const armarTirador = (S, M, F) => {
    const U = M._ru, a = M.a; U.bolas = [];
    if (F.tirador || !S.textures.exists('demonio_menor_idle')) return;
    const x = a.x + TIRADOR.x, y = a.y + TIRADOR.y;
    const luz = S.add.image(x, y + 26, 'ckmz_halo').setTint(0xff7020).setBlendMode(ADD()).setScale(0.8, 0.35).setAlpha(0.7).setDepth(a.y + 9);
    const sp = S.add.sprite(x, y, 'demonio_menor_idle').setScale(1.35).setFlipX(false).setTint(0xffb070).setDepth(y + 40);
    if (S.anims.exists('demonio_menor_idle')) sp.play('demonio_menor_idle');
    S.tweens.add({ targets: sp, y: y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    S.tweens.add({ targets: luz, alpha: { from: 0.45, to: 0.85 }, duration: 600, yoyo: true, repeat: -1 });
    M.objs.push(sp, luz);
    U.imp = { sp, luz, vida: 3, prox: S.time.now + 2500, carga: 0 };
  };
  const tirar = S => {
    const M = S._mz, U = M._ru, im = U.imp; if (!im) return;
    const p = pies(S), x0 = im.sp.x + 12, y0 = im.sp.y - 4;
    const v = S.player.body ? S.player.body.velocity : { x: 0, y: 0 };
    const tx = p.x + v.x * 0.35, ty = p.y - 10 + v.y * 0.35, d = Math.max(1, Math.hypot(tx - x0, ty - y0)), vel = 165;
    const g = S.add.circle(x0, y0, 5, 0xffb040, 1).setDepth(30000).setBlendMode(ADD());
    const h = S.add.image(x0, y0, 'ckmz_halo').setTint(0xff6020).setBlendMode(ADD()).setScale(0.32).setDepth(29999);
    U.bolas.push({ g, h, x: x0, y: y0, vx: (tx - x0) / d * vel, vy: (ty - y0) / d * vel, vuelta: false, t: 0 });
    son('fireball', 0.5) || son('magic_cast', 0.45, { rate: 1.4 });
    if (!fl(S).avisoParada) { fl(S).avisoParada = 1; try { T.nota('Un diablillo de fuego dispara desde la lava. Apretá C (la parada) justo cuando te llega la bola y se la devolvés'); } catch (e) {} }
  };
  const moverBolas = (S, dt) => {
    const M = S._mz, U = M._ru, im = U.imp, now = S.time.now;
    U.bolas = U.bolas.filter(b => {
      b.t += dt; b.x += b.vx * dt / 1000; b.y += b.vy * dt / 1000;
      b.g.setPosition(b.x, b.y); b.h.setPosition(b.x, b.y);
      if (Math.random() < 0.5) { const c = S.add.circle(b.x, b.y, R(1.5, 3), 0xff8030, 0.8).setDepth(29998).setBlendMode(ADD()); S.tweens.add({ targets: c, alpha: 0, scale: 0.3, duration: 260, onComplete: () => c.destroy() }); }
      const fin = () => { b.g.destroy(); b.h.destroy(); return false; };
      if (b.t > 4000) return fin();
      if (b.vuelta) {
        if (im && Math.hypot(b.x - im.sp.x, b.y - im.sp.y) < 18) { pegarTirador(S); try { T.chispas(S, b.x, b.y, 10, 0xffa040, 26); } catch (e) {} return fin(); }
        return true;
      }
      const p = pies(S);
      if (Math.hypot(b.x - p.x, b.y - (p.y - 10)) < 13 && !S.isDead) {
        if (now <= (S.parryUntil || 0)) {                     // ¡parada!: la bola vuelve a quien la tiró
          S.parryUntil = 0;
          S.createFloatingText(S.player.x, S.player.y - 46, '¡PARADA! ¡DEVUELTA!', 0xbfdbfe);
          son('sword_hit', 0.9, { rate: 1.5 }); S.cameras.main.shake(100, 0.006);
          S.stamina = Math.min(S.maxStamina || 100, (S.stamina || 0) + 25); try { S.updateStaminaBar && S.updateStaminaBar(); } catch (e) {}
          if (im) { const d = Math.max(1, Math.hypot(im.sp.x - b.x, im.sp.y - b.y)); b.vx = (im.sp.x - b.x) / d * 280; b.vy = (im.sp.y - b.y) / d * 280; }
          else { b.vx = -b.vx; b.vy = -b.vy; }
          b.vuelta = true; b.g.setFillStyle(0x9fd8ff); b.h.setTint(0x6ab0ff); b.t = 0;
          return true;
        }
        if (S.isInvulnerable || S.isDashing) return true;
        empujon(S, b);
        try { T.chispas(S, b.x, b.y, 10, 0xff8030, 22); } catch (e) {}
        return fin();
      }
      return true;
    });
  };
  const empujon = (S, b) => {
    const M = S._mz, a = M.a, p = pies(S), d = Math.max(1, Math.hypot(b.vx, b.vy)), dx = b.vx / d, dy = b.vy / d;
    try { T.herir(S, 1, '¡FUEGO!'); } catch (e) {}
    const nx = p.x + dx * 30, ny = p.y + dy * 30;
    if (enLava(S, nx, ny) || enLava(S, p.x + dx * 16, p.y + dy * 16)) {
      // el empujón lo tira a la lava: quema y vuelve a la losa
      S.player.setTint(0xff7040);
      S.tweens.add({ targets: S.player, x: S.player.x + dx * 18, y: S.player.y + dy * 18, duration: 140 });
      S.createFloatingText(S.player.x, S.player.y - 60, '¡Te tiró a la lava!', 0xfca5a5);
      son('ck_lava', 0.6) || son('fireball', 0.6, { rate: 0.6 });
      S.time.delayedCall(420, () => {
        try { S.player.clearTint(); const L = T.SEGURO_LAVA; S.player.body.reset(a.x + L.x, a.y + L.y); } catch (e) {}
        S._mzHerido = 0; try { T.herir(S, 1); } catch (e) {}
      });
      return;
    }
    try { if (!S.navIsFree || S.navIsFree(nx, ny)) S.player.body.reset(S.player.x + dx * 18, S.player.y + dy * 18); } catch (e) {}
  };
  const pegarTirador = S => {
    const M = S._mz, U = M._ru, im = U.imp; if (!im) return;
    im.vida--;
    im.sp.setTintFill(0xffffff); S.time.delayedCall(90, () => im.sp.active && im.sp.setTint(0xffb070));
    son('ck_demonio_chillido', 0.6, { rate: 1.3 }) || son('sword_hit', 0.6);
    S.createFloatingText(im.sp.x, im.sp.y - 30, im.vida > 0 ? '¡Le diste!' : '¡Cae a la lava!', 0xfde68a);
    if (im.vida > 0) { im.prox = S.time.now + 2600; return; }
    U.imp = null; fl(S).tirador = 1; guardar(S);
    if (S.anims.exists('demonio_menor_death')) im.sp.play('demonio_menor_death');
    S.tweens.killTweensOf(im.sp);
    S.tweens.add({ targets: im.sp, y: im.sp.y + 24, scale: 0.8, alpha: 0, duration: 900, ease: 'Quad.easeIn', onComplete: () => { im.sp.destroy(); } });
    S.tweens.add({ targets: im.luz, alpha: 0, duration: 900, onComplete: () => im.luz.destroy() });
    S.time.delayedCall(700, () => { try { T.chispas(S, im.sp.x, im.sp.y + 20, 18, 0xff8030, 50); } catch (e) {} son('ck_demonio_muere', 0.5) || son('fireball', 0.5); });
  };
  const tirador = (S, q, now, dt) => {
    const U = S._mz._ru, im = U.imp;
    moverBolas(S, dt);
    if (!im || S.dialogOpen || S._ckEscena || S.isDead) return;
    im.sp.setFlipX(S.player.x < im.sp.x);
    if (!enCruce(q)) { im.prox = Math.max(im.prox, now + 900); return; }
    if (!im.carga && now > im.prox - 650) {                   // aviso: brilla y abre la boca
      im.carga = 1;
      if (S.anims.exists('demonio_menor_attack1')) im.sp.play('demonio_menor_attack1');
      S.tweens.add({ targets: im.luz, scaleX: 1.2, duration: 600, yoyo: true });
    }
    if (now > im.prox) {
      im.carga = 0; im.prox = now + R(2200, 2900);
      tirar(S);
      S.time.delayedCall(350, () => { if (im.sp.active && S.anims.exists('demonio_menor_idle')) im.sp.play('demonio_menor_idle'); });
    }
  };

  // ================================================================== la llegada por el portal (nota 131)
  const llegada = (S, M, F) => {
    const a = M.a, es = E();
    if (F.portalCerrado) { M.portal.oculto = true; return; }
    if (!es || !es.correr) { F.portalCerrado = 1; F.llego = 1; M.portal.oculto = true; guardar(S); return; }
    const L = MZ.LLEGADA, PT = MZ.PORTAL, px = a.x + PT.x, py = a.y + PT.y;
    M.portal.oculto = true;
    const g = S.add.graphics().setDepth(a.y + 641).setBlendMode(ADD());
    M.objs.push(g);
    const k = { r: 6, al: 1 };
    const pintar = () => {
      g.clear(); const t = S.time.now / 1000;
      [[1, 0.65, 1], [0.76, 0.45, -1.4], [0.52, 0.32, 2]].forEach(([f, al, v]) => {
        const rr = k.r * f;
        g.lineStyle(2.5, 0xffd27a, al * k.al); g.strokeEllipse(px, py, rr * 2, rr * 1.1);
        for (let j = 0; j < 10; j++) { const an = t * v * 2 + j * Math.PI / 5; g.fillStyle(0xfff2c0, al * k.al).fillRect(px + Math.cos(an) * rr - 1.5, py + Math.sin(an) * rr * 0.55 - 1.5, 3, 3); }
      });
      g.fillStyle(0xfff2c0, 0.25 * k.al).fillEllipse(px, py, k.r * 1.2, k.r * 0.66);
    };
    const ev = S.time.addEvent({ delay: 16, loop: true, callback: pintar });
    const s0x = S.player.scaleX, s0y = S.player.scaleY;
    S.player.setAlpha(0);
    try { S.player.body.reset(a.x + L.x, a.y + L.y); S.player.setVelocity(0, 0); S.player.body.enable = false; } catch (e) {}
    S.time.delayedCall(30, () => S.player && S.player.setAlpha(0));
    const suelto = () => { try { S.player.body.enable = true; S.player.body.reset(a.x + L.x, a.y + L.y); } catch (e) {} };
    // (espera a que se vaya la pantalla de carga: si no, la llegada pasa detrás de ella)
    const empezar = n => {
      if (!aqui(S) || S._mz !== M) { suelto(); S.player.setAlpha(1); ev.remove(); return; }
      if (n < 60 && document.querySelector('#ck-carga.on')) { S.player.setAlpha(0); S.time.delayedCall(100, () => empezar(n + 1)); return; }
      S.time.delayedCall(250, correr);
    };
    const correr = () => es.correr(S, async () => {
      S.player.setAlpha(0);
      await es.camara(S, PT.x, PT.y - 10, 300);
      son('ck_portal_abre', 0.9);
      S.cameras.main.flash(500, 255, 240, 200);
      await new Promise(r => S.tweens.add({ targets: k, r: 46, duration: 700, ease: 'Back.easeOut', onComplete: r }));
      // el portal lo escupe: aparece en el centro, salta y cae a la llegada
      S.player.setPosition(px, py).setScale(s0x * 0.3, s0y * 0.3).setAlpha(1);
      try { T.chispas(S, px, py, 24, 0xffe08a, 60); } catch (e) {}
      await new Promise(r => S.tweens.add({ targets: S.player, scaleX: s0x, scaleY: s0y, x: a.x + L.x, y: py + (L.y - PT.y) - 4, duration: 420, ease: 'Quad.easeOut', onComplete: r }));
      S.player.setScale(s0x, s0y); suelto();
      try { T.polvo(S, S.player.x, a.y + L.y, 12, 0x6a5a52); } catch (e) {}
      son('step_stone1', 0.6) || son('bone_hit', 0.4, { rate: 0.6 });
      await es.esperar(500);
      await es.globo(S, S.player, 'Huele a azufre… ¿Este es el Reino del Sello?', 2000);
      // y se cierra detrás
      son('ck_portal_abre', 0.6, { rate: 0.6 });
      await new Promise(r => S.tweens.add({ targets: k, r: 2, al: 0.2, duration: 650, ease: 'Back.easeIn', onComplete: r }));
      S.cameras.main.flash(200, 255, 220, 160);
      ev.remove(); g.clear();
      F.portalCerrado = 1; F.llego = 1; guardar(S);
      try { const ar = S.currentInterior.area; ar.talkers = (ar.talkers || []).filter(t => !/^El portal del Padre Oswin/.test(t.lines[0])); } catch (e) {}
      await es.globo(S, S.player, '¡El portal se cerró! No hay vuelta atrás…', 2200);
      es.seguir(S);
    }).then(() => { ev.remove(); g.clear(); if (S.player.body && !S.player.body.enable) suelto(); S.player.setAlpha(1).setScale(s0x, s0y); try { T.nota('El portal de Oswin se cerró detrás tuyo. El único camino es hacia el Sello'); } catch (e) {} });
    empezar(0);
  };

  // ================================================================== armar (cada vez que la mazmorra arma sus cosas)
  const armar = S => {
    const M = S._mz, F = fl(S), a = M.a;
    M._ru = { t0: S.time.now };
    // carteles: el del portal (si ya se cerró) y el de las placas de pinchos
    const ar = S.currentInterior.area;
    ar.talkers = (ar.talkers || []).filter(t => !(F.portalCerrado && /^El portal del Padre Oswin/.test(t.lines[0])));
    ar.talkers.forEach(t => {
      if (/^Placas de pinchos/.test(t.lines[0])) t.lines = ['Cuatro pedestales con las piezas de una espada. En el piso está grabada la espada entera: cada pieza va encima de su parte. Con T se toman y se cambian'];
      if (/^El Sello: un portón redondo/.test(t.lines[0])) t.lines = ['El Sello: un portón redondo, rajado, con luz roja que se escapa por las grietas. Algo respira del otro lado'];
    });
    armarPorton(S, M, F);
    armarFragua(S, M, F);
    armarTirador(S, M, F);
    llegada(S, M, F);
  };

  // ================================================================== cada cuadro
  const cartel = (S, txt) => {
    const pr = document.getElementById('ck-prompt'); if (!pr) return;
    if (txt) { if (pr.textContent !== txt || !pr.classList.contains('on')) { pr.textContent = txt; pr.classList.add('on'); } S._ckRuCartel = txt; }
    else if (S._ckRuCartel) { if (pr.textContent === S._ckRuCartel) pr.classList.remove('on'); S._ckRuCartel = null; }
  };
  const cercaPorton = S => {
    const M = S._mz; if (!M) return false;
    const p = pies(S); return !fl(S).reja && Math.abs(p.x - M.a.x - PORTON.x) < 70 && Math.abs(p.y - M.a.y - PORTON.y) < 36;
  };
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      const S = this;
      // descifrar: las tres runas de la historia, apenas se puede (en la campaña, fuera de las peleas y escenas)
      if (S._gameMode === 'campaign' && S.story && !libre() && S.gameStarted && S.time.now > (S._ckRunaProx || 0)) {
        S._ckRunaProx = S.time.now + 1000;
        const id = !S.dialogOpen && !S._overlay && !S._ckEscena && !S.isDead && S.time.now > (S._ckRunaPausa || 0) &&
          !(S.enemies && S.enemies.getChildren().some(e => vivo(e) && ((e.def && e.def.boss) || e.state === 'chase' || e.state === 'alerting'))) ? pendiente(S) : null;   // (15/11: tampoco con enemigos encima)
        if (id) {
          S._ckRunaVio = S._ckRunaVio || {};
          if (!S._ckRunaVio[id]) { S._ckRunaVio[id] = S.time.now; S.createFloatingText(S.player.x, S.player.y - 56, '◇ Una runa… se puede descifrar ◇', 0xfde68a); son('book_clasp', 0.5); }
          else if (S.time.now - S._ckRunaVio[id] > 1600) descifrar(S, id);
        }
      }
      const M = S._mz;
      if (!M || !aqui(S) || !S.player || !S.player.body || !S.gameStarted) return r;
      if (!M._ru) armar(S);
      const U = M._ru, F = fl(S), a = M.a, now = S.time.now, dt = Math.min(delta || 16, 120);
      const p = pies(S), q = { x: p.x - a.x, y: p.y - a.y };
      // runas de los puzzles
      if (F.lava && !runas(S).lava && !U.daLava) { U.daLava = 1; dar(S, 'lava', a.x + 300, a.y + 530); }
      if (F.obelisco_1 && !runas(S).reyes && !U.daReyes) { U.daReyes = 1; S.time.delayedCall(900, () => dar(S, 'reyes', a.x + 250, a.y + 190)); }
      if (F.obelisco_2 && !F.luzCristal && !U.daLuz) { U.daLuz = 1; luzAlCristal(S); }
      // el portón: las runas que se llevan se encienden; con las siete, estalla
      if (!F.reja && U.ranuras && !S.dialogOpen && !S._ckEscena) {
        const cerca = Math.hypot(q.x - PORTON.x, q.y - PORTON.y) < 110;
        if (cerca && now > (U.prendeProx || 0)) {
          const id = ORDEN.find(k => runas(S)[k] === 1);
          if (id) { U.prendeProx = now + 520; encender(S, id); }
          else if (cuantas(S, 2) === 7 && !U.estalla) S.time.delayedCall(500, () => estallar(S));
        }
      }
      // carteles de T
      if (!S.dialogOpen && !S._overlay) {
        const ped = pedestalCerca(S), Fo = F.forja;
        if (ped && Fo && !F.fragua) cartel(S, Fo.ok[ped.i] ? null : Fo.lleva ? (Fo.p[ped.i] ? 'T · Cambiar la pieza' : 'T · Poner ' + NOMBRE[Fo.lleva]) : (Fo.p[ped.i] ? 'T · Tomar ' + NOMBRE[Fo.p[ped.i]] : null));
        else if (cercaPorton(S)) cartel(S, 'T · Mirar las runas del portón');
        else cartel(S, null);
      }
      // la pieza que se lleva, arriba de la cabeza
      if (U.lleva) { const Fo = F.forja; U.lleva.setVisible(!!(Fo && Fo.lleva)); if (Fo && Fo.lleva) U.lleva.setPosition(S.player.x, S.player.y - S.player.displayHeight * 0.62 - 6 + Math.sin(now / 200) * 1.5); }
      // el diablillo de fuego
      tirador(S, q, now, dt);
      // los gólems del criadero, al entrar (una vez por visita, hasta vencerlos)
      if (!U.golems && !F.golems && q.x > 1015 && q.x < 1368 && q.y > 150 && q.y < 373 && ENEMY_TYPES.golem_infierno) {
        U.golems = 1;
        [[1100, 330], [1170, 340]].forEach(([x, y], i) => S.time.delayedCall(500 + i * 700, () => { const e = T.demonio(S, x, y, 'golem_infierno'); }));
        S.time.delayedCall(400, () => S.createFloatingText(S.player.x, S.player.y - 56, '¡Gólems del infierno!', 0xfca5a5));
      }
    } catch (e) { if (!P._ckRuErr) { P._ckRuErr = 1; console.warn('[mazmorra runas]', e); } }
    return r;
  };
  // la luz que quemó el obelisco vuelve y termina en el cristal: sale la Runa de la Luz (y un gólem que la cuida)
  const luzAlCristal = S => {
    const M = S._mz, a = M.a, F = fl(S), C = T.CRISTAL;
    const x0 = a.x + 1188, y0 = a.y + 250, x1 = a.x + C.x, y1 = a.y + C.y - 10;
    const g = S.add.graphics().setDepth(a.y + 390).setBlendMode(ADD()); M.objs.push(g);
    const k = { t: 0 };
    S.time.delayedCall(1800, () => {
      son('magic_cast', 0.7, { rate: 0.8 });
      S.tweens.add({ targets: k, t: 1, duration: 900, ease: 'Sine.easeIn', onUpdate: () => {
        g.clear(); const xe = x0 + (x1 - x0) * k.t, ye = y0 + (y1 - y0) * k.t;
        [[10, 0.15], [5, 0.3], [2, 0.95]].forEach(([w, al]) => g.lineStyle(w, 0xfff2c0, al).lineBetween(x0, y0, xe, ye));
        g.fillStyle(0xfff2c0, 0.9).fillCircle(xe, ye, 3);
      }, onComplete: () => {
        S.tweens.add({ targets: g, alpha: 0, duration: 700, onComplete: () => g.destroy() });
        const h = S.add.image(x1, y1, 'ckmz_halo').setTint(0xffe08a).setBlendMode(ADD()).setScale(0.3).setDepth(a.y + 391); M.objs.push(h);
        S.tweens.add({ targets: h, scale: 2.2, alpha: 0, duration: 900, onComplete: () => h.destroy() });
        S.cameras.main.flash(250, 255, 230, 160);
        F.luzCristal = 1; guardar(S);
        S.createFloatingText(x1, y1 - 30, 'La luz termina en el cristal…', 0xfde68a);
        S.time.delayedCall(700, () => dar(S, 'luz', x1, y1));
        if (ENEMY_TYPES.golem_infierno) S.time.delayedCall(1600, () => { T.demonio(S, 1120, 320, 'golem_infierno'); S.createFloatingText(S.player.x, S.player.y - 56, '¡Un gólem cuida el cristal!', 0xfca5a5); });
      } });
    });
  };
  // T: los pedestales y el portón
  const i0 = P.interact;
  P.interact = function () {
    try {
      if (aqui(this) && this._mz && this._mz._ru && !this.dialogOpen && !this._overlay && !this._ckEscena) {
        const F = fl(this), ped = pedestalCerca(this);
        if (ped && F.forja && !F.fragua) { usarPedestal(this, ped); return; }
        if (cercaPorton(this)) {
          const id = pendiente(this);
          if (id && !libre() && descifrar(this, id)) return;
          const rr = runas(this), n = cuantas(this, 2);
          const lin = [`Siete runas cierran el portón de huesos, una en cada barrote. Encendidas: ${n} de 7.`];
          ORDEN.forEach(k => { if ((rr[k] || 0) >= 2) return; lin.push(`${RUNAS[k].n}: ${rr[k] ? 'la tenés; se enciende al acercarte' : RUNAS[k].mision ? 'se descifra con algo que se aprende en el camino (' + MISION[k].fuente.toLowerCase() + ')' : RUNAS[k].donde}.`); });
          this.openDialog('El portón de huesos', lin);
          return;
        }
      }
    } catch (e) { console.warn('[mazmorra runas]', e); }
    return i0.apply(this, arguments);
  };
  // lo que se mata entre el gólem: la cuenta para que no vuelvan
  const ve0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const r = ve0 ? ve0.apply(this, arguments) : undefined;
    try {
      if (enemy && enemy.type === 'golem_infierno' && aqui(this)) {
        const quedan = this.enemies.getChildren().filter(e => vivo(e) && e.type === 'golem_infierno').length;
        if (!quedan) { fl(this).golems = 1; guardar(this); }
      }
    } catch (e) {}
    return r;
  };

  // ================================================================== el inventario (M): las runas como objetos de misión
  const inv = () => {
    try {
      const big = document.getElementById('ck-mapa'), box = big && big.classList.contains('ckd-inventario') && big.querySelector('.ckd-inv');
      const S = window.activeGameScene || (window.game && game.scene.scenes.find(s => s.startCampaign));
      if (box && S && S.story && !box.querySelector('.ckru-inv')) {
        const rr = runas(S), ids = ORDEN.filter(k => rr[k]);
        if (ids.length) {
          const d = document.createElement('div'); d.className = 'ckru-inv';
          d.innerHTML = `<h4>Runas del Sello <small style="font-size:14px;color:#8a6a4a;font-weight:600">${ids.length} de 7</small></h4><div class="ckd-grilla">` +
            ids.map(k => `<div class="ckd-cosa"><div class="ic" style="background:#2a1d17;display:flex;align-items:center;justify-content:center">${svgRuna(k, rr[k] >= 2 ? '#ffd27a' : '#f3e6c8', 22)}</div><div class="tx"><strong>${RUNAS[k].n}</strong><em>${rr[k] >= 2 ? 'Encendida en el portón' : 'Objeto de misión · para el portón del Sello'}</em></div></div>`).join('') + '</div>';
          box.appendChild(d);
        }
      }
    } catch (e) {}
    requestAnimationFrame(inv);
  };
  requestAnimationFrame(inv);

  window.CK_MZ_RUNAS = { RUNAS, ORDEN, MISION, runas, dar, descifrar, encender, estallar, texRuna, svgRuna, PED, PIEZAS, usarPedestal, abrirRejaF, TIRADOR, pegarTirador };
})();
