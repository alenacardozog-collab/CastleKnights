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
   Con ?pruebas_panel=1 en la dirección también se abre en la campaña (para el dueño). Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const SIEMPRE = /[?&]pruebas_panel=1/.test(location.search);
  const SOLDADOS = [['g_templar', 'Lancero del Rey'], ['g_archer', 'Arquero del Rey'], ['g_axeman', 'Hachero mercenario'], ['g_lancer', 'Jinete mercenario']];   // (10/11) Bruno es el único de espada y escudo
  const NO_GUARDAR = ['castleknight_save_v1', 'castleknight_ranuras_v1'];
  const st = { abierto: false, quietas: false, sinOleadas: true, invencible: false, prueba: false };
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
    const entrar = () => { try { S.health = S.maxHealth; S.ckEntrar(id); } catch (e) { console.warn('[pruebas]', e); } };
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
      <h3>BESTIAS</h3><select id="ckpp-tipo">${opciones(tipos)}</select>
      <div class="fila">Cuántas <input type="number" id="ckpp-n" value="5" min="1" max="30"><button data-a="bestias">Aparecer</button></div>
      <div class="fila"><label><input type="checkbox" id="ckpp-llama"> con llamador</label><label><input type="checkbox" data-c="quietas" ${st.quietas ? 'checked' : ''}> quietas</label>
      <label><input type="checkbox" data-c="sinOleadas" ${st.sinOleadas ? 'checked' : ''}> sin oleadas</label></div>
      <div class="fila"><button class="sec" data-a="borrar">Borrar todo</button></div>
      <h3>SOLDADOS DEL REY</h3><select id="ckpp-sol">${opciones(SOLDADOS)}</select>
      <div class="fila">Cuántos <input type="number" id="ckpp-ns" value="4" min="1" max="20"><button data-a="soldados" ${enMapa ? '' : 'disabled'}>Aparecer</button></div>
      <div class="nota">${enMapa ? 'Pelean de tu lado contra las bestias que tengan cerca.' : 'Sólo adentro de un mapa (abajo: Probar un mapa).'}</div>
      <h3>HÉROE</h3><div class="fila"><label><input type="checkbox" data-c="invencible" ${st.invencible ? 'checked' : ''}> invencible</label><button class="sec" data-a="vida">Vida llena</button></div>
      <h3>PROBAR UN MAPA</h3><select id="ckpp-mapa">${opciones(mapas)}</select>
      <div class="fila"><button data-a="ir">Ir a probar</button>${S._gameMode === 'campaign' && st.prueba ? '<button class="sec" data-a="volver">Volver a la práctica</button>' : ''}</div>
      <div class="nota">Partida de prueba: mientras dure no se guarda nada.</div>`;
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
  window.CK_PANEL_PRUEBAS = { st, bestias, soldados, borrar, irMapa, alternar };
})();
