'use strict';
/* Lo nuevo en el panel de PRUEBAS (F4) (21/11, pedido del dueño: "cuando termines carga todo en las pruebas las animaciones
   nuevas de todo"). Suma al final del panel de ck_panel_pruebas.js tres partes:
   - HABILIDADES NUEVAS · HÉROES: las de Lancent, Horos, Urso y Aby que se rehicieron (tandas 2a y 2b). Se elige, se elige hacia
     dónde mira el héroe (◀ ▲ ▼ ▶: para ver que se lancen bien en cada dirección) y "Usar" la usa gratis y sin espera (cambia
     de héroe si hace falta). "Cargada" la usa manteniendo la tecla 2 s (onda de acero y misiles arcanos). "Muñeco" pone un
     orco quieto adelante para ver cómo le pega.
   - ANIMACIONES NUEVAS · HÉROES: las de PixelLab y las armadas (de frente y de espaldas, el báculo de color): "Ver" la hace
     una vez en el héroe.
   - HABILIDADES NUEVAS · JEFES: todas las de los jefes de la tanda 3 y las animaciones de PixelLab de Taurax y Kragmor;
     "Probar" trae al jefe al lado y la hace (el héroe queda invencible mientras se prueba si está marcado "invencible").
   v2 (22/11): las de las notas del 22/11 (lluvia de flechas, anillo de llamas, trueno cargable hasta el máximo, el remolino
   de Urso) y el combo nuevo de Aby (Slice combo).
   No toca ck_panel_pruebas.js: mira cuando el panel se dibuja y agrega su parte. Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const escena = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const vivo = e => e && e.active && !e.isDead;
  const HEROES = { soldier: 'Lancent', wizard: 'Horos', bear: 'Urso', swordsman: 'Aby' };
  // [id, héroe, nombre, cargable]
  const HABS = [
    ['grito', 'soldier', 'Grito de guerra'], ['salto', 'soldier', 'Salto aplastante'], ['onda', 'soldier', 'Onda de acero', 1], ['golpe_escudo', 'soldier', 'Golpe de escudo'], ['b_lluvia', 'soldier', 'Lluvia de flechas (22/11)'],
    ['nova', 'wizard', 'Nova arcana'], ['triple_fuego', 'wizard', 'Tres soles'], ['b_escarcha', 'wizard', 'Ráfaga helada'], ['tormenta', 'wizard', 'Tormenta eléctrica'],
    ['prision', 'wizard', 'Prisión de hielo'], ['lanza', 'wizard', 'Lanza de hielo'], ['misiles', 'wizard', 'Misiles arcanos', 1], ['drenaje', 'wizard', 'Drenaje vital'], ['meteoro', 'wizard', 'Meteoro'], ['anillo', 'wizard', 'Anillo de llamas (22/11)'], ['b_trueno', 'wizard', 'Trueno (22/11)', 1],
    ['pisoton', 'bear', 'Pisotón'], ['mordisco', 'bear', 'Mordisco'], ['b_remolino', 'bear', 'Remolino de garras'], ['desgarro', 'bear', 'Desgarro (abrazo de oso)'], ['avalancha', 'bear', 'Avalancha'], ['espiritu', 'bear', 'Espíritu del bosque'],
    ['relampago', 'swordsman', 'Relámpago'], ['slice', 'swordsman', 'Slice combo (22/11, nueva)']
  ];
  // [clave de la animación, héroe, nombre]
  const ANIMS = [
    ['bear_attack_mordisco', 'bear', 'Urso · mordisco (PixelLab)'], ['bear_attack_pisoton_lento', 'bear', 'Urso · pisotón (PixelLab)'], ['bear_attack_rugido_largo', 'bear', 'Urso · rugido (PixelLab)'],
    ['bear_attack_abrazo', 'bear', 'Urso · abrazo de oso (PixelLab)'], ['bear_attack3_front_pis', 'bear', 'Urso · pisotón de frente'], ['bear_attack3_back_pis', 'bear', 'Urso · pisotón de espaldas'],
    ['bear_attack3_front_ava', 'bear', 'Urso · avalancha de frente'], ['bear_attack3_back_ava', 'bear', 'Urso · avalancha de espaldas'],
    ['bear_attack2_carga', 'bear', 'Urso · remolino: la carga (22/11)'], ['soldier_attack_lluvia_carga', 'soldier', 'Lancent · lluvia: apunta 1 s (22/11)'],
    ['soldier_attack_hombro', 'soldier', 'Lancent · golpe de hombro (PixelLab)'], ['soldier_dash_front', 'soldier', 'Lancent · golpe de escudo de frente'], ['soldier_dash_back', 'soldier', 'Lancent · golpe de escudo de espaldas'],
    ['wizard_attack1_hb_azul_carga', 'wizard', 'Horos · báculo azul (carga)'], ['wizard_attack1_hb_violeta_carga', 'wizard', 'Horos · báculo violeta (carga)'],
    ['wizard_attack1_hb_verde', 'wizard', 'Horos · báculo verde'], ['wizard_attack1_hb_fuego_carga', 'wizard', 'Horos · tres soles (carga)'], ['wizard_attack2_hb_fuego', 'wizard', 'Horos · tres soles (lanza)']
  ];
  // [jefe, nombre, tipo, cómo se prueba]
  const col = k => ['coliseo', k];
  const J = [
    ['Grushak', 'Arroja el hacha (al 25 %; sin hacha en la mano)', 'orc_warlord', 'hacha'],
    ['Garra Negra', 'Zarpazos (golpe común)', 'werebear_jefe', 'golpe'], ['Garra Negra', 'Salto', 'werebear_jefe', ['esp', 'salto']], ['Garra Negra', 'Zarpazo fuerte', 'werebear_jefe', ['esp', 'zarpazo2']], ['Garra Negra', 'Rugido y frenesí (a la mitad)', 'werebear_jefe', ['dano', 0.55]],
    ['Gran Esqueleto', 'Golpe a la tierra', 'skeleton_great', ['esp', 'tierra']], ['Gran Esqueleto', 'Espinas de hueso', 'skeleton_great', ['esp', 'pfx_espinas']],
    ['El Nigromante', 'Manos de la tumba', 'necromancer', ['esp', 'pfx_manos']],
    ['Gorvak', 'Tajo (golpe común)', 'orc_campeon', 'golpe'], ['Gorvak', 'Salto aplastante', 'orc_campeon', col('salto')], ['Gorvak', 'Muro de escudo y embestida', 'orc_campeon', col('escudo')], ['Gorvak', 'Cuchilla giratoria', 'orc_campeon', col('cuchilla')],
    ['Kragmor', 'Puñetazo (golpe común)', 'bestia_kragmor', 'golpe'], ['Kragmor', 'Embestida', 'bestia_kragmor', col('embestida')], ['Kragmor', 'Golpe sísmico', 'bestia_kragmor', col('sismo')], ['Kragmor', 'Lluvia de piedras (agarra la roca y la tira, PixelLab)', 'bestia_kragmor', col('piedras')],
    ['Ulrak', 'Lanzazo (golpe común)', 'cazador_ulrak', 'golpe'], ['Ulrak', 'Andanada de lanzas', 'cazador_ulrak', col('andanada')], ['Ulrak', 'Carga del huargo', 'cazador_ulrak', col('cargaHuargo')], ['Ulrak', 'Aullido', 'cazador_ulrak', col('aullido')],
    ['Malakar', 'Rayos del Sello', 'brujo_sello', ['esp', 'pfx_rayos']],
    ['Azrath', 'Lluvia de fuego', 'demonio_sello', ['mz', 'lluvia']], ['Azrath', 'Onda de fuego', 'demonio_sello', ['mz', 'onda']], ['Azrath', 'Estallido de fuego', 'demonio_sello', ['esp', 'pfx_oscura']],
    ['Orbath', 'Rayos y corona', 'demonio_j_ojo', ['rc', 'corona']], ['Orbath', 'Ojos que persiguen', 'demonio_j_ojo', ['esp', 'pfx_estrellas']],
    ['Fauces', 'Zarpazos (golpe común)', 'demonio_j_sabueso', 'golpe'], ['Fauces', 'Embestida y mordisco', 'demonio_j_sabueso', ['rc', 'embestida', 200]], ['Fauces', 'Aliento de fuego', 'demonio_j_sabueso', ['esp', 'pfx_aliento']], ['Fauces', 'Se divide (lastimado)', 'demonio_j_sabueso', ['dano', 0.7]],
    ['Seravel', 'Siega (congela)', 'demonio_j_segadora', ['esp', 'pfx_siega']],
    ['Taurax', 'Embestida (te empuja)', 'demonio_j_minotauro', ['rc', 'embestida', 200]], ['Taurax', 'Pisotón de brasa (se alza y pisa, PixelLab)', 'demonio_j_minotauro', ['esp', 'pfx_pisoton']],
    ['Gromm', 'Martillazo de fuego', 'demonio_j_martillo', ['rc', 'onda']],
    ['Morvane', 'Pilares de fuego', 'demonio_j_caballero', ['rc', 'pilares']]
  ];
  const st = { hab: 'grito', anim: ANIMS[0][0], jefe: 0, mira: 'der', muneco: true };

  // ------------------------------------------------------------------ héroe
  const cambiarHeroe = (S, h) => { if (!h || S.playerHero === h) return false; try { const m = S._gameMode; S._gameMode = 'libre'; S.switchHero(h); S._gameMode = m; } catch (e) {} return true; };
  const DIRS = { der: [1, 0], izq: [-1, 0], aba: [0, 1], arr: [0, -1] };
  const mirar = S => {
    const [fx, fy] = DIRS[st.mira] || [1, 0], p = S.player; if (!p) return;
    if (fx) S.facingDirection = fx < 0 ? 'left' : 'right';
    S.facingV = fy > 0 ? 'front' : fy < 0 ? 'back' : null; p.setFlipX(S.facingDirection === 'left');
    const k = S.heroAnim ? S.heroAnim(S.playerHero + '_idle') : S.playerHero + '_idle'; if (S.anims.exists(k) && !S.isAttacking) p.play(k, true);
  };
  const muneco = S => {
    (S._ckPnMuneco || []).forEach(e => { try { if (e.hpBar) e.hpBar.destroy(); if (e.nameTag) e.nameTag.destroy(); e.destroy(); } catch (er) {} });
    S._ckPnMuneco = [];
    if (!st.muneco) return;
    const [fx, fy] = DIRS[st.mira] || [1, 0], p = S.player; S._ckPermitirBestias = true;
    const e = S.spawnEnemy(p.x + fx * 70, p.y + fy * 55, 'orc'); if (!e) return;
    e.maxHp = e.hp = 999; e.attackCooldown = 1e12; e.def = Object.assign({}, e.def, { speed: 0 }); if (e.nameTag) e.nameTag.setVisible(false);
    S._ckPnMuneco.push(e);
  };
  const usar = (S, id) => {
    const E = window.CK_EQUIPO || {}, H = (window.CK_HABILIDADES || {}).HACER || {}, B = E.BASE && E.BASE[id];
    S.lastSpinTime = 0; S.lastRainTime = 0; S.lastThunderTime = 0; if (S._ckCdBase) S._ckCdBase[id] = 0; if (S._ckCd) S._ckCd[id] = 0;
    if (S.maxStamina) S.stamina = S.maxStamina; if (S.maxMana) S.mana = S.maxMana;
    if (B && B.usar) { B.usar(S, 'R'); return true; }
    let ms;
    if (E.hacerBase && E.hacerBase[id]) ms = E.hacerBase[id](S);
    else if (H[id]) { try { E.texturas && E.texturas(S); } catch (er) {} ms = H[id](S); }
    else return false;
    if (ms === -1 || ms < 0) return false;
    if (ms > 0) { S.isAttacking = true; S.player.setVelocity(0, 0); S.time.delayedCall(ms, () => { S.isAttacking = false; }); }
    return true;
  };
  const usarHab = (S, cargada) => {
    const h = HABS.find(x => x[0] === st.hab); if (!h) return;
    const cambia = cambiarHeroe(S, h[1]);
    S.time.delayedCall(cambia ? 320 : 30, () => {
      try {
        if (S.isAttacking || S.isDashing || S.isSpinning) { S.createFloatingText(S.player.x, S.player.y - 50, 'esperá que termine', 0xfde68a); return; }
        mirar(S); muneco(S);
        S.time.delayedCall(st.muneco ? 250 : 0, () => {
          mirar(S);
          S._thunderTestHold = 0;
          if (cargada && h[0] === 'b_trueno') { S._thunderTestHold = 2300; S.time.delayedCall(3200, () => { S._thunderTestHold = 0; }); }      // (v2) el trueno: mantenido 2,3 s (carga máxima)
          else if (cargada) { const hasta = S.time.now + 2000; S._ckCargaPrueba = { id: h[0], k: { get isDown() { return S.time.now < hasta; } } }; S.time.delayedCall(2600, () => { S._ckCargaPrueba = null; }); }
          if (!usar(S, h[0])) S.createFloatingText(S.player.x, S.player.y - 50, 'no se pudo usar acá', 0xfca5a5);
        });
      } catch (e) { console.warn('[pruebas nuevas]', e); }
    });
  };
  const verAnim = S => {
    const a = ANIMS.find(x => x[0] === st.anim); if (!a) return;
    const cambia = cambiarHeroe(S, a[1]);
    S.time.delayedCall(cambia ? 320 : 30, () => {
      try {
        // las armadas al vuelo (báculo de color, de frente y de espaldas) se arman la primera vez que se usan: se fuerza
        const HB = window.CK_HOROS_BACULO; if (HB && HB.armar && a[1] === 'wizard') HB.armar(S);
        if (!S.anims.exists(a[0])) { S.createFloatingText(S.player.x, S.player.y - 50, 'todavía no está: usá una vez su habilidad', 0xfca5a5); return; }
        const p = S.player, A = S.anims.get(a[0]), ms = Math.round(A.frames.length / (A.frameRate || 10) * 1000) + 150;
        if (/_front_|_front$/.test(a[0])) S.facingV = 'front'; else if (/_back_|_back$/.test(a[0])) S.facingV = 'back'; else S.facingV = null;
        S.isAttacking = true; p.setVelocity(0, 0); p.play(a[0], true);
        S.time.delayedCall(ms, () => { S.isAttacking = false; mirar(S); });
      } catch (e) { console.warn('[pruebas nuevas]', e); }
    });
  };

  // ------------------------------------------------------------------ jefes
  const traer = (S, tipo) => {
    S._ckPermitirBestias = true;
    const p = S.player, C = window.CK_COLISEO;
    let e = null;
    if (C && C.JEFES && C.JEFES[tipo] && C.probar) { e = C.probar(S, tipo); if (e) { e.x = p.x + 120; e.y = p.y; } }
    else e = S.spawnEnemy(p.x + 120, p.y, tipo);
    if (!e) return null;
    e.attackCooldown = S.time.now + 1200; e.nextSummon = S.time.now + 60000; e.state = 'chase'; if (e._ckc) e._ckc.prox = S.time.now + 60000;
    (S._ckPnJefes = S._ckPnJefes || []).push(e);
    return e;
  };
  const probarJefe = S => {
    const j = J[st.jefe]; if (!j) return;
    const [, , tipo, como] = j;
    // el que ya está (del mismo tipo) se reusa; si no, se trae
    const C = window.CK_COLISEO;
    let e = (S._ckPnJefes || []).filter(x => vivo(x) && x.type === tipo).pop();
    const nuevo = !e; if (!e) e = traer(S, tipo);
    if (!e) { S.createFloatingText(S.player.x, S.player.y - 50, 'no se pudo traer', 0xfca5a5); return; }
    S.time.delayedCall(nuevo ? 1000 : 50, () => {
      if (!vivo(e)) return;
      try {
        e.setVelocity(0, 0); e._ckEsp = 0; e.isAttacking = false; if (e.state !== 'ck_busca') e.state = 'chase';
        const E = window.CK_ESPECIALES, R = window.CK_REINO_CRIATURAS, M = window.CK_MZ_FINAL, JP = window.CK_JEFES_PEDIDOS;
        if (como === 'golpe') { e.x = S.player.x + (e.x < S.player.x ? -42 : 42); e.y = S.player.y; e.attackCooldown = 0; return; }
        if (como === 'hacha') { e._ckFases = e._ckFases || {}; e._ckFases.pisoton = true; e._ckHachaAt = S.time.now + 7000; if (JP && JP.hacha) JP.hacha(S, e); return; }
        if (como[0] === 'coliseo') { if (C && C.hab && C.hab[como[1]]) { if (e._ckc) e._ckc.ocupado = false; C.hab[como[1]](S, e); } return; }
        if (como[0] === 'esp') { if (E && E.HACER[como[1]]) E.HACER[como[1]](S, e); return; }
        if (como[0] === 'mz') { if (M && M[como[1]]) M[como[1]](S, e); return; }
        if (como[0] === 'rc') { if (como[2]) { e.x = S.player.x + como[2]; e.y = S.player.y; } if (R && R.ESP && R.ESP[como[1]]) R.ESP[como[1]](S, e); return; }
        if (como[0] === 'dano') { S.damageEnemy(e, Math.ceil(e.hp * como[1]), S.player.x, S.player.y); return; }
      } catch (er) { console.warn('[pruebas nuevas] jefe', er); S.createFloatingText(S.player.x, S.player.y - 50, 'error: ver la consola', 0xfca5a5); }
    });
  };
  const sacarJefes = S => { (S._ckPnJefes || []).forEach(e => { try { if (e.hpBar) e.hpBar.destroy(); if (e.nameTag) e.nameTag.destroy(); e.destroy(); } catch (er) {} }); S._ckPnJefes = []; };

  // ------------------------------------------------------------------ la parte del panel
  const opc = (lista, sel) => lista.map(([v, t]) => `<option value="${v}" ${String(v) === String(sel) ? 'selected' : ''}>${t}</option>`).join('');
  const html = () => {
    const habs = Object.keys(HEROES).map(h => `<optgroup label="${HEROES[h]}">${opc(HABS.filter(x => x[1] === h).map(x => [x[0], x[2] + (x[3] ? ' · cargable' : '')]), st.hab)}</optgroup>`).join('');
    const jefes = []; J.forEach((j, i) => { let g = jefes.find(x => x[0] === j[0]); if (!g) jefes.push(g = [j[0], []]); g[1].push([i, j[1]]); });
    const h = HABS.find(x => x[0] === st.hab) || [];
    const fl = (d, t) => `<button class="${st.mira === d ? '' : 'sec'}" data-pn="mira" data-d="${d}">${t}</button>`;
    return `<h3>HABILIDADES NUEVAS · HÉROES</h3><select id="ckpn-hab">${habs}</select>
      <div class="fila">Mira ${fl('izq', '◀')}${fl('arr', '▲')}${fl('aba', '▼')}${fl('der', '▶')}</div>
      <div class="fila"><button data-pn="usar">Usar</button>${h[3] ? '<button data-pn="cargada">Cargada (2 s)</button>' : ''}<label><input type="checkbox" data-pc="muneco" ${st.muneco ? 'checked' : ''}> muñeco adelante</label></div>
      <div class="nota">Gratis y sin espera; cambia de héroe si hace falta. Probá cada dirección: el golpe, el efecto y la animación tienen que ir hacia donde mira.</div>
      <h3>ANIMACIONES NUEVAS · HÉROES</h3><select id="ckpn-anim">${opc(ANIMS.map(a => [a[0], a[2]]), st.anim)}</select>
      <div class="fila"><button data-pn="ver">Ver</button></div>
      <h3>HABILIDADES NUEVAS · JEFES</h3><select id="ckpn-jefe">${jefes.map(([n, l]) => `<optgroup label="${n}">${opc(l, st.jefe)}</optgroup>`).join('')}</select>
      <div class="fila"><button data-pn="jefe">Probar</button><button class="sec" data-pn="sacar">Sacar jefes</button></div>
      <div class="nota">Trae al jefe al lado (o usa el que ya está) y la hace. Marcá "invencible" (abajo, HÉROE) para mirar tranquilo.</div>`;
  };
  const poner = p => {
    if (!p || p.querySelector('#ckpn')) return;
    const d = document.createElement('div'); d.id = 'ckpn'; d.innerHTML = html();
    const info = p.querySelector('#ckpp-info'); if (info && info.nextSibling) p.insertBefore(d, info.nextSibling); else p.appendChild(d);      // (arriba de todo: es lo nuevo)
    const sel = (id, k, num) => { const s = d.querySelector(id); if (s) s.addEventListener('change', () => { st[k] = num ? +s.value : s.value; if (k === 'hab') redibujar(p); }); };
    sel('#ckpn-hab', 'hab'); sel('#ckpn-anim', 'anim'); sel('#ckpn-jefe', 'jefe', true);
    d.querySelectorAll('[data-pc]').forEach(c => c.addEventListener('change', () => { st[c.dataset.pc] = c.checked; }));
    d.querySelectorAll('[data-pn]').forEach(c => c.addEventListener('click', e => {
      e.stopPropagation();
      const S = escena(); if (!S || !S.player) return;
      const a = c.dataset.pn;
      if (a === 'mira') { st.mira = c.dataset.d; mirar(S); redibujar(p); }
      if (a === 'usar') usarHab(S, false);
      if (a === 'cargada') usarHab(S, true);
      if (a === 'ver') verAnim(S);
      if (a === 'jefe') probarJefe(S);
      if (a === 'sacar') sacarJefes(S);
      try { c.blur(); S.game.canvas.focus(); } catch (er) {}
    }));
  };
  const redibujar = p => { const d = p.querySelector('#ckpn'); if (d) d.remove(); poner(p); };
  // el panel se vuelve a dibujar entero cada tanto (innerHTML): se mira y se vuelve a poner la parte
  const mirarPanel = () => {
    const p = document.getElementById('ckpp');
    if (!p) { setTimeout(mirarPanel, 500); return; }
    poner(p);
    new MutationObserver(() => { if (!p.querySelector('#ckpn')) poner(p); }).observe(p, { childList: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mirarPanel); else mirarPanel();
  window.CK_PRUEBAS_NUEVAS = { st, HABS, ANIMS, J, usarHab, verAnim, probarJefe, sacarJefes };
})();
