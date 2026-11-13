'use strict';
/* Panel de pruebas (10/11, pedido del dueño: "que me dejes spamear NPC y enemigos en el modo práctica, y testear niveles
   a ver cómo van"). En el modo práctica aparece el botón PRUEBAS (o F4) y abre un panel al costado:
   - BESTIAS: elegís cuál (todas las del juego, jefes incluidos) y cuántas (1 a 30) y aparecen alrededor del héroe.
     "Con llamador" convierte a la primera en el llamador de refuerzos de su especie (ck_refuerzos.js). "Quietas" las deja
     clavadas para mirarlas; "Borrar" las saca a todas. "Sin oleadas" frena las oleadas solas de la práctica.
   - SOLDADOS DEL REY (sólo dentro de un mapa): caballero, lancero, hachero, templario o arquero; pelean contra las bestias
     de su lado (el mismo sistema que los guardias del castillo). Sirve para armar peleas grandes.
   - HÉROE: invencible y vida llena.
   - PROBAR UN MAPA: elegís cualquier mapa del Taller y entrás a probarlo con el héroe de la práctica. Es una partida de
     prueba: NO SE GUARDA NADA (ni la historia ni las ranuras) mientras dure. "Volver a la práctica" la termina.
   - Arriba: cuántas bestias hay y a cuántos cuadros por segundo va el juego.
   (13/11, v3, pedido: "pon en el modo práctica para testear los mapas hechos y que funcionen interiores y zonas del mismo"):
   - La lista de mapas va por región (Aldea del Roble, El castillo, San Roque, Brumavieja y el norte, La frontera y los orcos,
     El Reino del Sello) y los interiores van con un punto debajo de su lugar. Suma la aldea (afuera), y el patio del castillo,
     la muralla, el patio de armas y Brumavieja se entran como en la campaña (son las zonas de antes con el dibujo nuevo).
   - "Todo abierto" (prendido): en la prueba se sacan los cierres de la historia (la Frontera hasta el Capítulo 1, el portón de
     la fortaleza orca, el Bosque Embrujado y las Tierras Orcas cerrados después de su capítulo, el portón del castillo en el
     Capítulo 3, la capilla de Brumavieja antes del Nigromante). Lo miran esos archivos con window.CK_LIBRE().
   - SALIDAS DE ACÁ: las salidas, portales y puertas con T del lugar donde estás; un botón te deja delante y la cruzás caminando
     (o con ▲, ▼ o T). "Salir a la aldea" sale de lugar en lugar hasta quedar afuera.
   Con ?pruebas_panel=1 en la dirección también se abre en la campaña (para el dueño). Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const SIEMPRE = /[?&]pruebas_panel=1/.test(location.search);
  const SOLDADOS = [['g_templar', 'Lancero del Rey'], ['g_archer', 'Arquero del Rey'], ['g_axeman', 'Hachero mercenario'], ['g_lancer', 'Jinete mercenario']];   // (10/11) Bruno es el único de espada y escudo
  const NO_GUARDAR = ['castleknight_save_v1', 'castleknight_ranuras_v1'];
  const st = { abierto: false, quietas: false, sinOleadas: true, invencible: false, prueba: false, libre: true };
  // (13/11) en la partida de prueba, "todo abierto" saca los cierres de la historia (los archivos que cierran pasos lo miran)
  window.CK_LIBRE = () => !!(st.prueba && st.libre);
  const escena = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const vivo = e => e && e.active && !e.isDead;
  const puede = S => S && S.gameStarted && (S._gameMode !== 'campaign' || st.prueba || SIEMPRE);

  // ------------------------------------------------------------------ partida de prueba: no se guarda nada
  const setItem0 = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    if (st.prueba && NO_GUARDAR.indexOf(k) >= 0) return;
    return setItem0.apply(this, arguments);
  };
  const g0 = P.saveStory;
  P.saveStory = function () { if (st.prueba) return; return g0.apply(this, arguments); };
  const c0 = P.startCampaign;
  P.startCampaign = function () { if (!this._ckPruebaArranca) st.prueba = false; return c0.apply(this, arguments); };
  const pr0 = P.startPractice;
  if (pr0) P.startPractice = function () { st.prueba = false; return pr0.apply(this, arguments); };

  // ------------------------------------------------------------------ (13/11) los lugares, por región (los interiores, debajo de su lugar)
  const REGIONES = [
    ['Aldea del Roble', ['_aldea', 'campos_del_roble', 'taberna_2', 'casa_grande', 'granero', 'tienda_de_viveres', 'casa_de_arriba']],
    ['El castillo', ['camino_al_castillo', '@castle:courtyard', 'salon_del_trono_3', 'aposentos_del_rey', 'biblioteca', 'cocina_real', 'herreria', 'jardin_real', '@castle:walls', '@castle:training']],
    ['San Roque del Molle', ['san_roque', 'posada_san_roque', 'posada_san_roque_arriba', 'herreria_san_roque', 'capilla_san_roque', 'casita_cerco_san_roque', 'casa_granjeros_san_roque', 'casa_pastor_san_roque', 'molino_san_roque']],
    ['Brumavieja y el norte', ['norte_del_roble', 'casa_quemada_norte', '@ruins', 'capilla_brumavieja', 'casa_peste', 'bosque_embrujado', 'cementerio_real']],
    ['La frontera y los orcos', ['bosque_de_la_frontera', 'claro_de_las_bestias', 'cueva_galerias', 'cueva_grutas', 'cueva_fosa', 'tierras_orcas', 'pueblo_orco', 'choza_orca', 'choza_chaman', 'casa_jefe_orco', 'fortaleza_orca', 'patio_fortaleza_orca', 'coliseo_orco', 'sendero_orco', 'afueras_orcas']],
    ['El Reino del Sello', ['mazmorra_sello']],
    ['Versiones anteriores', ['taberna_nueva', 'salon_del_trono_nuevo', 'patio_armas_nuevo']]
  ];
  const ADENTRO = { taberna_2: 1, casa_grande: 1, granero: 1, tienda_de_viveres: 1, casa_de_arriba: 1, salon_del_trono_3: 1, aposentos_del_rey: 1, biblioteca: 1,
    cocina_real: 1, herreria: 1, posada_san_roque: 1, posada_san_roque_arriba: 1, herreria_san_roque: 1, capilla_san_roque: 1, casita_cerco_san_roque: 1,
    casa_granjeros_san_roque: 1, casa_pastor_san_roque: 1, molino_san_roque: 1, casa_quemada_norte: 1, capilla_brumavieja: 1, casa_peste: 1,
    cueva_galerias: 1, cueva_grutas: 1, cueva_fosa: 1, choza_orca: 1, choza_chaman: 1, casa_jefe_orco: 1, patio_fortaleza_orca: 1 };
  // los lugares del juego que llevan el dibujo de un mapa del Taller pero siguen siendo la zona de antes (se entra como en la campaña)
  const VIEJOS = { '@castle:courtyard': ['patio_del_castillo', 'Patio del castillo'], '@castle:walls': ['muralla', 'La muralla'],
    '@castle:training': ['patio_de_armas', 'Patio de armas'], '@ruins': ['aldea_en_ruinas', 'Brumavieja (la aldea en ruinas)'] };
  const nombreMapa = k => {
    if (VIEJOS[k]) return VIEJOS[k][1]; const D = window.EDITOR_DATA, m = D && D.mapas && D.mapas[k]; return k === '_aldea' ? 'La aldea (afuera)' : m ? (m.titulo || m.nombre || k) : k; };
  const listaMapas = () => {
    const D = window.EDITOR_DATA; if (!D || !D.mapas) return '';
    const todos = Object.keys(D.mapas).filter(k => !D.mapas[k].origen), usados = {};
    let h = '';
    REGIONES.forEach(([reg, ks]) => {
      const hay = ks.filter(k => k === '_aldea' || VIEJOS[k] || D.mapas[k]); if (!hay.length) return;
      h += `<optgroup label="${reg}">` + hay.map(k => { usados[k] = 1; if (VIEJOS[k]) usados[VIEJOS[k][0]] = 1; return `<option value="${k}">${ADENTRO[k] ? '\u00a0\u00a0· ' : ''}${nombreMapa(k)}</option>`; }).join('') + '</optgroup>';
    });
    const otros = todos.filter(k => !usados[k]);
    if (otros.length) h += '<optgroup label="Otros">' + otros.map(k => `<option value="${k}">${nombreMapa(k)}</option>`).join('') + '</optgroup>';
    return h;
  };
  // las puertas que se abren con T (las arman otros archivos): [nombre, x, y] = el punto delante de la puerta (los pies)
  const PUERTAS_T = {
    san_roque: [['Posada', 586, 290], ['Herrería', 824, 350], ['Capilla', 392, 394], ['Casita del cerco', 961, 144], ['Casa de los granjeros', 953, 560],
      ['Casa del pastor', 486, 692], ['Molino', 1284, 574]],
    pueblo_orco: [['Choza del chamán', 125, 298], ['Casa del jefe', 785, 464], ['Choza', 180, 122], ['Choza', 393, 124], ['Choza', 612, 124], ['Choza', 815, 274], ['Choza', 205, 456]],
    norte_del_roble: [['Casa quemada', 985, 436], ['Casa en ruinas', 530, 440]],
    aldea_en_ruinas: [['Capilla', 522, 218], ['Casa en ruinas', 751, 420]]
  };
  const idDe = S => { const z = (S.currentZoneKey && S.currentZoneKey()) || ''; if (z === 'ruins.village') return 'aldea_en_ruinas'; const m = /^ed_([a-z0-9_]+)\./.exec(z); return m ? m[1] : ''; };
  // las salidas del lugar donde está el héroe (para ir hasta la puerta y cruzarla caminando)
  const salidas = S => {
    const c = S && S.currentInterior; if (!c || !c.area) return [];
    const a = c.area, cx = a.x + (a.w || 400) / 2, cy = a.y + (a.h || 300) / 2, out = [];
    const lindo = (t, to) => (t ? String(t).replace(/^[▲▼◀▶←→↑↓\s]+/, '') : '') || (to === 'outside' ? 'Afuera' : to);
    (a.exits || []).forEach(e => {
      // delante de la salida, del lado de adentro: las finitas a lo ancho (arriba/abajo) se miran de arriba o de abajo; las altas, de costado
      const ex = e.x + e.w / 2, ey = e.y + e.h / 2, ancha = e.w >= e.h;
      const x = ancha ? ex : ex + (cx > ex ? 1 : -1) * (e.w / 2 + 26), y = ancha ? ey + (cy > ey ? 1 : -1) * (e.h / 2 + 26) : ey;
      out.push({ t: lindo(e.hint, e.to), x, y, tecla: e.key, dir: ancha ? (cy > ey ? 'ArrowUp' : 'ArrowDown') : (cx > ex ? 'ArrowLeft' : 'ArrowRight') });
    });
    (a.portals || []).forEach(pt => out.push({ t: lindo(pt.hint, pt.to), x: pt.x, y: pt.y + 34, tecla: 'up' }));
    (PUERTAS_T[idDe(S)] || []).forEach(([t, x, y]) => out.push({ t: t + ' (T)', x: a.x + x, y: a.y + y, tecla: 't' }));
    return out;
  };
  // pasos que esperan a que termine cada cambio de lugar: [[cuándo, qué], …]
  const pasos = (S, lista, n) => {
    n = n || 0; if (!lista.length || n > 60) return;
    const [cuando, que] = lista[0];
    if (!cuando()) { S.time.delayedCall(250, () => pasos(S, lista, n + 1)); return; }
    try { que(); } catch (e) { console.warn('[pruebas]', e); }
    S.time.delayedCall(400, () => pasos(S, lista.slice(1), 0));
  };
  // a la aldea: se sale de lugar en lugar (cada mapa sale al de antes) hasta quedar afuera
  const aldea = (S, luego, n) => {
    n = n || 0;
    if (S._doorTransition) { if (n < 80) S.time.delayedCall(250, () => aldea(S, luego, n + 1)); return; }
    if (!S.currentInterior) { if (luego) S.time.delayedCall(200, () => { try { luego(); } catch (e) { console.warn('[pruebas]', e); } }); return; }
    if (n > 80) return;
    try { S.exitInterior(); } catch (e) {}
    S.time.delayedCall(250, () => aldea(S, luego, n + 1));
  };
  const irSalida = (S, i) => {
    const o = salidas(S)[i]; if (!o) return;
    try { S._areaSwitchHold = false; S.placePlayerFeetAt ? S.placePlayerFeetAt(o.x, o.y) : S.player.body.reset(o.x, o.y); } catch (e) {}
    S.createFloatingText(S.player.x, S.player.y - 50, o.tecla === 'walk' ? 'Caminá hacia la salida' : o.tecla === 't' ? 'T para entrar' : o.tecla === 'down' ? '▼ para pasar' : '▲ para pasar', 0xfde68a);
  };

  // ------------------------------------------------------------------ cosas que hace
  const alrededor = (S, i, n) => {
    const p = S.player, a = (i / Math.max(1, n)) * Math.PI * 2 + Math.random() * 0.6, d = 130 + Math.random() * 110;
    let x = p.x + Math.cos(a) * d, y = p.y + 20 + Math.sin(a) * d * 0.7;
    try {
      const G = S.currentInterior && S.navGrid && S.navGrid(true);
      if (G && S.navNearestCell) { const c = S.navNearestCell(G, x, y, 30); if (c) { x = G.x + c[0] * 8 + 4; y = G.y + c[1] * 8 + 4; } }
    } catch (e) {}
    return { x, y };
  };
  const bestias = (S, tipo, n, llamador) => {
    let hechas = 0;
    for (let i = 0; i < n; i++) {
      const q = alrededor(S, i, n), e = S.spawnEnemy(q.x, q.y - 26, tipo);
      if (!e) continue;
      if (S.currentInterior) e.zone = S.currentInterior.area.key;
      if (S.placeEnemyClear && !S.placeEnemyClear(e)) { e.destroy(); continue; }
      hechas++;
      if (i === 0 && llamador && window.CK_REFUERZOS) CK_REFUERZOS.hacer(S, e);
    }
    return hechas;
  };
  const soldados = (S, base, n) => {
    const c = S.currentInterior; if (!c || !c.area.actors) return 0;
    let hechos = 0;
    for (let i = 0; i < n; i++) {
      if (!S.textures.exists(base + '_idle')) break;
      const q = alrededor(S, i, n);
      const sp = S.add.sprite(q.x, q.y, base + '_idle').setOrigin(0.5, 0.61).setScale(1.2).setDepth(q.y);
      if (S.anims.exists(base + '_idle')) sp.play(base + '_idle');
      c.area.actors.push({ type: 'walker', sprite: sp, pts: [[q.x, q.y, 999999]], i: 0, wait: 999999, speed: 26, idle: base + '_idle', walk: base + '_walk',
        lines: ['¡Por el rey!', 'Listo para pelear.', '¡Que vengan!'], talkAt: 0, moving: false, role: S.actorRole ? S.actorRole(base + '_idle') : 'guard', hp: 5, maxHp: 5, _ckPrueba: true });
      (c.area.objs || []).push(sp);
      hechos++;
    }
    return hechos;
  };
  const borrar = S => {
    S.enemies && S.enemies.getChildren().slice().forEach(e => { try { if (e.hpBar) e.hpBar.destroy(); e.destroy(); } catch (er) {} });
    const c = S.currentInterior;
    if (c && c.area.actors) c.area.actors = c.area.actors.filter(a => { if (a._ckPrueba) { try { a.sprite.destroy(); } catch (er) {} return false; } return true; });
  };
  const irMapa = (S, id) => {
    if (!id) return;
    st.prueba = true;
    const entrar = () => {
      try {
        S.health = S.maxHealth;
        if (id === '_aldea') { aldea(S); return; }
        if (VIEJOS[id]) {                                   // como en la campaña: Brumavieja desde la aldea; el castillo desde el camino
          const zk = () => (S.currentZoneKey && S.currentZoneKey()) || '', listo = () => !S._doorTransition;
          if (id === '@ruins') { aldea(S, () => S.enterRuins()); return; }
          const area = id.split(':')[1];
          S.ckEntrar('camino_al_castillo');
          pasos(S, [[() => listo() && zk() === 'ed_camino_al_castillo.main', () => S.switchInteriorArea('courtyard')],
            [() => listo() && zk() === 'castle.courtyard', () => { if (area !== 'courtyard') S.switchInteriorArea(area); }]]);
          return;
        }
        S._doorTransition = false; S.ckEntrar(id);
      } catch (e) { console.warn('[pruebas]', e); }
    };
    if (S._gameMode !== 'campaign') {
      S._ckPruebaArranca = true;
      try { S.startCampaign(); } finally { S._ckPruebaArranca = false; }
      S.time.delayedCall(1400, () => {
        try { if (S.endIntro) S.endIntro(); } catch (e) {}
        document.querySelectorAll('.ck-intro,#ck-intro').forEach(el => el.remove());
        S.time.delayedCall(300, entrar);
      });
    } else entrar();
  };

  // ------------------------------------------------------------------ cada cuadro
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      if (st.quietas && this.enemies) this.enemies.getChildren().forEach(e => { if (vivo(e) && e.body) { e.setVelocity(0, 0); e.isAttacking = false; } });
      if (st.abierto) {
        const zk = this.currentZoneKey ? this.currentZoneKey() : '';
        if (st.prueba && zk !== st.zona && !this._doorTransition) { st.zona = zk; setTimeout(pintar, 50); }
        this._ckPrT = (this._ckPrT || 0) + 1;
        if (this._ckPrT % 15 === 0) {
          const i = document.getElementById('ckpp-info');
          if (i) i.textContent = `${this.enemies ? this.enemies.getChildren().filter(vivo).length : 0} bestias · ${Math.round(this.game.loop.actualFps)} cuadros/s` +
            (st.prueba ? ' · prueba (no se guarda)' : '');
        }
      }
      const b = document.getElementById('ckpp-boton');
      if (b) b.classList.toggle('on', puede(this) && !this.dialogOpen);
    } catch (e) {}
    return r;
  };
  const dp0 = P.damagePlayer;
  P.damagePlayer = function () { if (st.invencible && puede(this)) return; return dp0.apply(this, arguments); };
  const w0 = P.spawnEnemyWave;
  if (w0) P.spawnEnemyWave = function () { if (st.sinOleadas && this._gameMode !== 'campaign') return; return w0.apply(this, arguments); };

  // ------------------------------------------------------------------ el panel
  const css = `
#ckpp-boton{position:absolute;left:14px;top:226px;z-index:60;display:none;padding:5px 10px;font:12px MedievalSharp,serif;color:#fde68a;
  background:#2a1d14ee;border:2px solid #8a6a3a;border-radius:4px;cursor:pointer;letter-spacing:.5px}
#ckpp-boton.on{display:block} #ckpp-boton:hover{background:#3a2a1c}
#ckpp{position:absolute;right:12px;top:150px;z-index:61;width:270px;max-height:calc(100% - 300px);overflow:auto;display:none;padding:10px 12px;
  font:12px MedievalSharp,serif;color:#f3e6c8;background:#1c140eF2;border:2px solid #8a6a3a;border-radius:6px;box-shadow:0 4px 18px #000a}
#ckpp.on{display:block} #ckpp h3{margin:10px 0 5px;font-size:12px;color:#fbbf24;letter-spacing:1px;border-bottom:1px solid #5a442a;padding-bottom:2px}
#ckpp h3:first-of-type{margin-top:4px} #ckpp select,#ckpp input[type=number]{font:12px MedievalSharp,serif;background:#2d2016;color:#f3e6c8;border:1px solid #6b5232;border-radius:3px;padding:2px 3px}
#ckpp select{width:100%;margin-bottom:4px} #ckpp input[type=number]{width:52px}
#ckpp button{font:12px MedievalSharp,serif;margin:3px 3px 0 0;padding:3px 8px;color:#1c140e;background:#e8c47a;border:1px solid #8a6a3a;border-radius:3px;cursor:pointer}
#ckpp button.sec{background:#5a442a;color:#f3e6c8} #ckpp label{display:inline-flex;align-items:center;gap:4px;margin:3px 8px 0 0;cursor:pointer}
#ckpp .fila{display:flex;align-items:center;gap:6px;flex-wrap:wrap} #ckpp .nota{color:#b9a27c;font-size:11px;margin-top:3px}
#ckpp-info{color:#86efac;font-size:11px} #ckpp .x{position:absolute;right:8px;top:4px;cursor:pointer;color:#b9a27c}`;
  const opciones = (lista) => lista.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  const armar = () => {
    if (document.getElementById('ckpp')) return;
    const w = document.getElementById('game-wrapper') || document.body;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    const b = document.createElement('div'); b.id = 'ckpp-boton'; b.textContent = 'PRUEBAS · F4'; w.appendChild(b);
    const p = document.createElement('div'); p.id = 'ckpp'; w.appendChild(p);
    b.addEventListener('click', e => { e.stopPropagation(); alternar(); });
    p.addEventListener('keydown', e => e.stopPropagation());
    p.addEventListener('keyup', e => e.stopPropagation());
  };
  const pintar = () => {
    const p = document.getElementById('ckpp'), S = escena(); if (!p || !S) return;
    const tipos = Object.keys(ENEMY_TYPES).filter(k => S.textures.exists(k + '_idle')).map(k => [k, (ENEMY_TYPES[k].boss ? '★ ' : '') + ENEMY_TYPES[k].name]);
    const D = window.EDITOR_DATA, mapas = D && D.mapas ? Object.keys(D.mapas).filter(k => !D.mapas[k].origen).map(k => [k, D.mapas[k].titulo || D.mapas[k].nombre || k]).sort((a, b) => a[1].localeCompare(b[1])) : [];
    const enMapa = !!(S.currentInterior && S.currentInterior.area.actors);
    p.innerHTML = `<span class="x" data-a="cerrar">✕</span><div id="ckpp-info"></div>
      <h3>PROBAR UN MAPA</h3><select id="ckpp-mapa">${listaMapas()}</select>
      <div class="fila"><button data-a="ir">Ir a probar</button>${S._gameMode === 'campaign' && st.prueba ? '<button class="sec" data-a="volver">Volver a la práctica</button>' : ''}</div>
      <div class="fila"><label><input type="checkbox" data-c="libre" ${st.libre ? 'checked' : ''}> todo abierto (sin los cierres de la historia)</label></div>
      <div class="nota">Partida de prueba: mientras dure no se guarda nada. Las puertas, los interiores y las salidas andan como en la campaña: entrás y salís caminando. Los interiores van con un punto, debajo de su lugar.</div>
      ${st.prueba && S.currentInterior ? '<h3>SALIDAS DE ACÁ</h3>' + (salidas(S).length ? salidas(S).map((o, i) => `<button class="sec" data-a="salida" data-i="${i}">→ ${o.t}</button>`).join('') : '<div class="nota">Este lugar no tiene salidas propias (se sale por la puerta con T o por donde se entró).</div>') + '<div class="fila"><button class="sec" data-a="aldea">Salir a la aldea</button></div><div class="nota">Te deja delante de la salida: cruzala caminando (o con ▲ si es una puerta).</div>' : ''}
      <h3>BESTIAS</h3><select id="ckpp-tipo">${opciones(tipos)}</select>
      <div class="fila">Cuántas <input type="number" id="ckpp-n" value="5" min="1" max="30"><button data-a="bestias">Aparecer</button></div>
      <div class="fila"><label><input type="checkbox" id="ckpp-llama"> con llamador</label><label><input type="checkbox" data-c="quietas" ${st.quietas ? 'checked' : ''}> quietas</label>
      <label><input type="checkbox" data-c="sinOleadas" ${st.sinOleadas ? 'checked' : ''}> sin oleadas</label></div>
      <div class="fila"><button class="sec" data-a="borrar">Borrar todo</button></div>
      <h3>SOLDADOS DEL REY</h3><select id="ckpp-sol">${opciones(SOLDADOS)}</select>
      <div class="fila">Cuántos <input type="number" id="ckpp-ns" value="4" min="1" max="20"><button data-a="soldados" ${enMapa ? '' : 'disabled'}>Aparecer</button></div>
      <div class="nota">${enMapa ? 'Pelean de tu lado contra las bestias que tengan cerca.' : 'Sólo adentro de un mapa (abajo: Probar un mapa).'}</div>
      <h3>HÉROE</h3><div class="fila"><label><input type="checkbox" data-c="invencible" ${st.invencible ? 'checked' : ''}> invencible</label><button class="sec" data-a="vida">Vida llena</button></div>`;
    try {                                                       // la lista muestra el lugar donde estás
      const z = (S.currentZoneKey && S.currentZoneKey()) || '', viejo = { 'castle.courtyard': '@castle:courtyard', 'castle.walls': '@castle:walls', 'castle.training': '@castle:training', 'ruins.village': '@ruins' }[z];
      const m = /^ed_([a-z0-9_]+)\./.exec(z), sel = p.querySelector('#ckpp-mapa'), v = viejo || (m && m[1]) || (S.currentInterior ? '' : '_aldea');
      if (sel && v && sel.querySelector(`option[value="${v}"]`)) sel.value = v;
    } catch (e) {}
    p.querySelectorAll('[data-c]').forEach(c => c.addEventListener('change', () => { st[c.dataset.c] = c.checked; }));
    p.querySelectorAll('[data-a]').forEach(c => c.addEventListener('click', e => {
      e.stopPropagation();
      const S2 = escena(); if (!S2) return;
      const a = c.dataset.a, n = v => Math.max(1, Math.min(30, parseInt(document.getElementById(v).value, 10) || 1));
      if (a === 'cerrar') return alternar(false);
      if (a === 'bestias') { const k = bestias(S2, document.getElementById('ckpp-tipo').value, n('ckpp-n'), document.getElementById('ckpp-llama').checked); S2.createFloatingText(S2.player.x, S2.player.y - 50, `+${k} bestias`, 0xfca5a5); }
      if (a === 'soldados') { const k = soldados(S2, document.getElementById('ckpp-sol').value, n('ckpp-ns')); S2.createFloatingText(S2.player.x, S2.player.y - 50, `+${k} soldados`, 0x93c5fd); }
      if (a === 'borrar') borrar(S2);
      if (a === 'vida') { S2.health = S2.maxHealth; S2.updateHUD && S2.updateHUD(); }
      if (a === 'ir') { irMapa(S2, document.getElementById('ckpp-mapa').value); setTimeout(pintar, 2600); }
      if (a === 'volver') { st.prueba = false; S2.startPractice(); setTimeout(pintar, 800); }
      if (a === 'salida') { irSalida(S2, +c.dataset.i); }
      if (a === 'aldea') { aldea(S2); setTimeout(pintar, 3000); }
      try { c.blur(); S2.game.canvas.focus(); } catch (er) {}
    }));
  };
  const alternar = (q) => {
    const S = escena(); if (!S || (!puede(S) && q !== false)) return;
    armar(); st.abierto = q === undefined ? !st.abierto : q;
    const p = document.getElementById('ckpp'); if (!p) return;
    if (st.abierto) pintar();
    p.classList.toggle('on', st.abierto);
  };
  window.addEventListener('keydown', e => { if (e.key === 'F4') { e.preventDefault(); alternar(); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', armar); else armar();
  window.CK_PANEL_PRUEBAS = { st, bestias, soldados, borrar, irMapa, alternar, salidas, irSalida, REGIONES };
})();
