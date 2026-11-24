'use strict';
/* Capítulo 3, segunda parte: el castillo (23/11, mensaje del dueño: "cuando limpiamos las zonas de la infestación de los
   demonios tenemos que volver al castillo y éste ya nos deja entrar; es cuando el rey está escondido en su habitación.
   Tenemos que limpiar el castillo también en todas las instancias: patio, jardín, muro y patio de armas. La herrería y la
   panadería están cerradas porque se ocultaron los aldeanos allí. Luego pasamos al salón del trono donde aparece el último
   boss demonio de esta instancia, que es el que tiene caballo, y vemos caballeros negros derrotados en el salón y el
   consejero del rey nos pide ayuda; derrotamos a los enemigos y el consejero nos da las gracias. Podemos tener la opción de
   derrotarlo o dejarlo ir humillado: si decidimos pelear, lo derrotamos de un golpe en una escena épica pero chistosa.
   Luego, al entrar a la habitación del rey, éste se sorprende de vernos, dice que somos su más fiel guerrero pero ya no le
   creemos nada; nos dice que nos dará lo que queramos y nos da el cristal que nos permite ir al reino de los demonios.
   Aparece el mago del castillo y nos dice que vayamos a su biblioteca; ahí él hace el ritual y nos manda, y luego pasa todo
   lo de la mazmorra de los demonios").
   - c3 = 4 (el reino quedó limpio, ck_capitulo3.js v8): el portón del castillo se abre. Adentro, el castillo arde: el patio,
     el jardín, la muralla y el patio de armas tienen demonios (c3 = 5); cada lugar queda libre al vencerlos a todos (los
     vencidos no vuelven). La herrería y la cocina (la panadería del castillo) están trancadas: adentro está la gente.
   - Con los cuatro libres se abre el Gran Salón: caballeros negros caídos por el piso, Sir Gaspar acorralado pidiendo
     ayuda, demonios y MORVANE, el Caballero Negro (el del caballo), con su presentación. Al vencerlos, Gaspar agradece y se
     elige: DERROTARLO (de un solo golpe: una escena épica… y ridícula) o DEJARLO IR (humillado). (c3 = 6)
   - En los Aposentos del Rey: el Rey, escondido, se sorprende, adula ("mi más fiel guerrero"), ofrece lo que sea y da el
     CRISTAL DEL PORTAL. Entra el Maestre Eloy: "vení a mi biblioteca". (c3 = 7)
   - En la Biblioteca, con T a Eloy: el ritual (un círculo de runas y un portal de pixelfx) y el héroe pasa a la Mazmorra del
     Sello (c3 = 8). De ahí sigue lo de la mazmorra (ck_mazmorra_sello.js, ck_mazmorra_final.js).
   - Mientras dura (c3 4 a 7) la gente no anda por el patio, el jardín, la muralla ni el patio de armas (los guardias que
     quedan pelean con los demonios), y en el Gran Salón no están el Rey en el trono ni la corte (c3 4 a 8).
   - Las escenas del salón y de la biblioteca pasan en el medio de la sala: si el héroe quedó contra la puerta, un fundido
     corto lo acerca. El cartel de la elección espera lo que haga falta (va fuera de la escena, con el héroe quieto).
   Va después de ck_capitulo3.js, ck_consejero.js, ck_reino_criaturas.js y ck_capitulo3_arte.js. Borrar su línea de
   index.html deja el castillo cerrado al final del reino (como antes: "Fin de la primera parte"). */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_CAPITULO3) return;
  const P = MainGameScene.prototype, C3 = window.CK_CAPITULO3;
  const E = () => window.CK_ESCENA;
  const R = (a, b) => a + Math.random() * (b - a);
  const UNO = a => a[Math.floor(Math.random() * a.length)];
  const fl = s => (s.flags = s.flags || {});
  const c3 = s => (s && s.flags && s.flags.c3) || 0;
  const zonaDe = S => (S.currentZoneKey && S.currentZoneKey()) || '';
  const area = S => (S.currentInterior ? S.currentInterior.area : { x: 0, y: 0, w: 640, h: 640 });
  const pies = S => { const b = S.player && S.player.body; return b ? { x: b.center.x, y: b.bottom } : { x: S.player.x, y: S.player.y }; };
  const vivo = e => e && e.active && !e.isDead;
  const sonar = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const nombre = S => { const h = (typeof HEROES !== 'undefined' && (HEROES[S.playerHero] || HEROES.soldier)) || { name: 'HÉROE' }; return h.name.charAt(0) + h.name.slice(1).toLowerCase(); };
  const libre = () => !!(window.CK_LIBRE && window.CK_LIBRE());
  window.CK_CAPITULO3_CASTILLO = true;   // (ck_capitulo3.js: el portón se abre y Bruno no corta la historia)

  // ------------------------------------------------------------------ los lugares del castillo
  const LUGARES = {
    'castle.courtyard': { n: 'El patio', k: 'patio', bichos: ['demonio_lancero', 'demonio_garra', 'demonio_sabueso', 'demonio_bruja', 'demonio_escudo', 'demonio_garra', 'demonio_menor', 'demonio_menor'] },
    'ed_jardin_real.main': { n: 'El jardín', k: 'jardin', bichos: ['demonio_bruja', 'demonio_coagulo', 'demonio_garra', 'demonio_lava', 'demonio_bruja', 'demonio_coagulo', 'demonio_menor'] },
    'castle.walls': { n: 'La muralla', k: 'muro', bichos: ['demonio_arquero', 'demonio_murcielago', 'demonio_arquero', 'demonio_murcielago', 'demonio_lancero', 'demonio_menor'] },
    'castle.training': { n: 'El patio de armas', k: 'armas', bichos: ['demonio_escudo', 'demonio_lancero', 'demonio_tridente', 'demonio_escudo', 'demonio_sangre', 'demonio_tridente', 'demonio_menor'] }
  };
  const ORDEN = Object.keys(LUGARES);
  const SALON = 'ed_salon_del_trono_3.main', APOSENTOS = 'ed_aposentos_del_rey.main', BIBLIO = 'ed_biblioteca.main';
  const est = (s, z) => { const f = fl(s), c = f.castillo || (f.castillo = {}), k = LUGARES[z].k; return c[k] || (c[k] = { m: [], ok: false }); };
  const libres = s => ORDEN.filter(z => est(s, z).ok).length;
  const enCastillo = s => { const n = c3(s); return n >= 4 && n <= 5 && !fl(s).cap3_fin; };
  const OBJ = {
    4: 'El portón del castillo se abrió: entrá',
    5: s => `Limpiá el castillo de demonios: el patio, el jardín, la muralla y el patio de armas (${libres(s)}/4)` + (libres(s) >= 4 ? ' · el Gran Salón se abrió' : ''),
    6: 'El Rey se escondió en sus aposentos (por el Gran Salón)',
    7: 'El Maestre Eloy te espera en la biblioteca (por el Gran Salón)',
    8: 'La Mazmorra del Sello: rescatá a la princesa Elia'
  };
  const paso = (S, n, txt) => {
    const f = fl(S.story); f.c3 = n;
    if (txt) S.createFloatingText(S.player.x, S.player.y - 46, txt, 0xfde68a);
    S.createFloatingText(S.player.x, S.player.y - 64, '✦ NUEVO OBJETIVO ✦', 0xfde68a);
    sonar('quest_done', 0.6);
    S.updateObjective(); S.saveStory();
  };
  const objs = S => (S._ccObj = S._ccObj || []);
  const limpiarObjs = S => { (S._ccObj || []).forEach(o => { try { if (o && o.active) o.destroy(); } catch (e) {} }); S._ccObj = []; };
  const hud = S => {
    let h = document.getElementById('ck-c3-hud');
    const z = zonaDe(S), L = LUGARES[z], s = S.story;
    if (!L || c3(s) !== 5) { if (h && S._ccHud) { h.style.display = 'none'; S._ccHud = false; } return; }
    if (!h) {
      h = document.createElement('div'); h.id = 'ck-c3-hud';
      h.style.cssText = 'position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:60;pointer-events:none;font-family:"CK Grenze",Georgia,serif;' +
        'color:#ffe4c8;background:rgba(40,6,4,.78);border:1px solid #c2410c;border-radius:6px;padding:4px 12px;font-size:14px;letter-spacing:.06em;text-shadow:0 1px 2px #000;white-space:nowrap';
      (document.getElementById('game-wrapper') || document.body).appendChild(h);
    }
    const e3 = est(s, z), quedan = L.bichos.length - e3.m.length;
    h.textContent = e3.ok ? '✔ ' + L.n.toUpperCase() + ' · LIBRE · CASTILLO ' + libres(s) + '/4' : '🔥 ' + L.n.toUpperCase() + ' · DEMONIOS ' + quedan + ' · CASTILLO ' + libres(s) + '/4';
    h.style.borderColor = e3.ok ? '#65a30d' : '#c2410c'; h.style.display = ''; S._ccHud = true;
  };

  // ------------------------------------------------------------------ los demonios de cada lugar
  const lugarLibre = (S, cerca) => {
    const a = area(S), p = pies(S), w = a.w || 640, h = a.h || 480;
    for (let k = 0; k < 60; k++) {
      const x = a.x + R(0.12, 0.88) * w, y = a.y + R(0.2, 0.88) * h;
      if (Math.hypot(x - p.x, y - p.y) < (cerca ? 90 : 150)) continue;
      if (S.navIsFree && !S.navIsFree(x, y, true)) continue;
      if (S.navPath && !S.navPath(p.x, p.y, x, y, 4000, true)) continue;
      return { x, y };
    }
    return null;
  };
  const armar = S => {
    const z = zonaDe(S), L = LUGARES[z], s = S.story;
    if (!L || c3(s) !== 5) return;
    const e3 = est(s, z);
    S._ccCapa = e3.ok ? 0.3 : 0.85;
    hud(S);
    if (e3.ok) return;
    const IV = window.CK_INFIERNO_VIVO; if (IV && IV.texturas) IV.texturas(S);
    L.bichos.forEach((t, i) => {
      const k = 'c' + i; if (e3.m.indexOf(k) >= 0 || !ENEMY_TYPES[t]) return;
      S.time.delayedCall(600 + i * R(260, 480), () => {
        if (zonaDe(S) !== z) return;
        const q = lugarLibre(S); if (!q) return;
        const marcar = e => { if (!e) return; e.zone = z; e._ccSlot = k; e._ccZ = z; e._ckSinSusto = true; };
        if (IV && IV.grieta && S._ckiv) IV.grieta(S, q.x, q.y, t, 700, marcar);
        else marcar(S.spawnEnemy(q.x, q.y, t));
      });
    });
  };
  // ("la herrería y la panadería están cerradas porque se ocultaron los aldeanos allí") mientras dura esto (c3 4 a 7) la gente
  // no anda por el patio, el jardín, la muralla ni el patio de armas: está encerrada. Los guardias que quedan pelean con los
  // demonios (como los soldados del Camino). Se llama al llegar y cada tanto (la rutina de la gente podía volver a mostrarlos).
  const gente = S => {
    const z = zonaDe(S), n = c3(S.story); if (!LUGARES[z] || n < 4 || n > 7) return;
    const ok = est(S.story, z).ok;
    (S.campaignNPCs || []).forEach(p => { const sp = p && p.sprite; if (sp && sp.active && sp.visible) { sp.setVisible(false); p._ccOculto = true; } });
    (((S.currentInterior || {}).area || {}).actors || []).forEach(a => {
      if (!a || !a.sprite || !a.sprite.active) return;
      if (a.role === 'guard' || a.role === 'archer') { if (!ok) a._ckAliado = true; return; }
      if (a.sprite.visible) { a.sprite.setVisible(false); a._ccOculto = true; }
    });
  };
  // El Gran Salón mientras dura esto (c3 4 a 8): el Rey se escondió en sus aposentos y la corte huyó. Se sacan el Rey del trono
  // y la corte que pone ck_mapas_nuevos.js (la Reina, la princesa Lía, Lady Mirena, los guardias y el paje, con sus charlas);
  // cualquier otra persona del mapa queda oculta y callada. Al volver con el capítulo terminado, todo vuelve a estar.
  const vaciarSalon = S => {
    const n = c3(S.story); if (zonaDe(S) !== SALON || n < 4 || n > 8 || fl(S.story).cap3_fin) return;
    const k = S._ckRey; if (k) { [k.sentado, k.de_pie, k.cartel].forEach(o => { try { if (o) o.destroy(); } catch (e) {} }); S._ckRey = null; }
    (S._ckCorte || []).forEach(o => { try { if (o) o.destroy(); } catch (e) {} }); S._ckCorte = null;
    const a = area(S); if (!a) return;
    a.talkers = (a.talkers || []).filter(t => !t.ck);
    a.actors = (a.actors || []).filter(t => { if (!t.ck) return true; try { if (t.sprite) t.sprite.destroy(); } catch (e) {} return false; });
    a.actors.forEach(t => { if (t.sprite && t.sprite.active && t.sprite.visible) { t.sprite.setVisible(false); t._ccOculto = true; t.lines = []; } });
  };
  const comprobar = (S, z) => {
    const L = LUGARES[z], s = S.story; if (!L || c3(s) !== 5) return;
    const e3 = est(s, z); if (e3.ok || e3.m.length < L.bichos.filter(t => ENEMY_TYPES[t]).length) return;
    e3.ok = true; S.saveStory(); S.updateObjective(); hud(S);
    S._ccCapa = 0.3;
    S.time.delayedCall(800, () => {
      if (!S.player) return;
      sonar('quest_done', 0.7, { rate: 0.9 });
      const n = libres(s);
      S.showZoneTitle(L.n + ': libre de demonios', n >= 4 ? 'El Gran Salón se abrió' : 'Castillo ' + n + ' de 4');
    });
  };

  // ------------------------------------------------------------------ el Gran Salón: Gaspar, los caballeros caídos y Morvane
  const MORVANE = 'demonio_j_caballero';
  const CAIDOS = [[150, 260, true], [196, 330, false], [300, 300, true], [356, 250, false], [120, 380, false], [380, 360, true]];
  const salon = async S => {
    const e = E(), s = S.story, f = fl(s); if (!e || S._ccSalon) return;
    if (c3(s) !== 5 || libres(s) < 4 || f.gaspar_fin) return;
    S._ccSalon = true;
    const a = area(S), k = S.player.scaleY / 1.2;
    S._ccCapa = 0.7;
    // los caballeros negros caídos (los mercenarios de Gaspar)
    const tex = S.textures.exists('mercenario_death') ? 'mercenario_death' : 'g_axeman_death';
    CAIDOS.forEach(([x, y, fx]) => {
      if (!S.textures.exists(tex)) return;
      const sp = S.add.sprite(a.x + x, a.y + y, tex, Math.max(0, S.textures.get(tex).frameTotal - 2)).setOrigin(0.5, 0.6).setScale(1.2 * k).setFlipX(fx).setDepth(a.y + y - 6).setTint(0xb0a0a0);
      objs(S).push(sp);
    });
    const G = window.CK_GASPAR;
    const gaspar = S._ccGaspar = G ? G.poner(S, a.x + 240, a.y + 150, { escala: 1.2 * k }) : null;
    if (gaspar) { gaspar._ckAnim = 'ck_gaspar'; objs(S).push(gaspar); if (S._ckGasparSp && S._ckGasparSp !== gaspar) S._ckGasparSp.setVisible(false); }
    let jefe = null;
    const ok = await e.correr(S, async () => {
      await e.camara(S, 240, 170, 900);
      if (gaspar) { gaspar.setTint(0xd8c0c0); S.tweens.add({ targets: gaspar, x: gaspar.x + 2, duration: 80, yoyo: true, repeat: 7 }); }
      await e.dialogo(S, 'Sir Gaspar', ['¡¿Quién…?! ¡Vos! ¡Ayuda! ¡Por el amor del Roble, ayudame!', 'Mis hombres… todos… ¡Esa cosa a caballo los barrió como hojas!'], 'ck_gaspar_idle');
      // Morvane y su escolta salen del fuego
      sonar('ck_demonio_rugido', 0.9, { rate: 0.6 }); S.cameras.main.shake(700, 0.008);
      const IV = window.CK_INFIERNO_VIVO;
      [[150, 200, 'demonio_lancero'], [330, 210, 'demonio_lancero'], [180, 290, 'demonio_escudo'], [310, 290, 'demonio_escudo']].forEach(([x, y, t], i) => S.time.delayedCall(300 + i * 250, () => {
        if (zonaDe(S) !== SALON || !ENEMY_TYPES[t]) return;
        const m = en => { if (en) { en.zone = SALON; en._ccSalon = true; en._ckSinSusto = true; } };
        if (IV && IV.grieta && S._ckiv) IV.grieta(S, a.x + x, a.y + y, t, 600, m); else m(S.spawnEnemy(a.x + x, a.y + y, t));
      }));
      await e.esperar(1400);
      if (ENEMY_TYPES[MORVANE]) {
        jefe = S.spawnEnemy(a.x + 240, a.y + 230, MORVANE);
        if (jefe) { jefe.zone = SALON; jefe._ccSalon = true; jefe._ckSinSusto = true; jefe._rcJefe = true; S.cameras.main.flash(260, 255, 60, 30); }
      }
      await e.camara(S, 240, 220, 600);
      await e.esperar(900);
    });
    if (!ok || zonaDe(S) !== SALON) { S._ccSalon = false; return; }
    S._ccPelea = { t0: S.time.now };
    if (window.CK_MUSICA_MOMENTOS) window.CK_MUSICA_MOMENTOS.fijar(S, 'boss');
    (S.enemies ? S.enemies.getChildren() : []).filter(x => vivo(x) && x._ccSalon).forEach(x => S.alertEnemy && S.alertEnemy(x));
  };
  const peleaSalonCuadro = S => {
    const P2 = S._ccPelea; if (!P2 || P2.fin || zonaDe(S) !== SALON) return;
    // Gaspar se cubre (no lo atacan: está detrás del trono)
    const quedan = (S.enemies ? S.enemies.getChildren() : []).filter(x => vivo(x) && x._ccSalon).length;
    if (quedan === 0 && S.time.now - P2.t0 > 3000) { P2.fin = true; S.time.delayedCall(1200, () => gracias(S)); }
  };

  // ------------------------------------------------------------------ la elección (un cartel con dos botones)
  const CSS = `#ck-elige{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);z-index:9000;display:flex;gap:14px;font-family:'CK Grenze',Grenze,Georgia,serif}
#ck-elige button{min-width:220px;padding:10px 18px 8px;background:rgba(14,10,8,.92);color:#f6f0e4;border:1px solid #b0263f;box-shadow:0 0 0 1px #000,0 6px 0 rgba(0,0,0,.45);
  font:700 19px 'CK Grenze',Grenze,Georgia,serif;letter-spacing:.06em;cursor:pointer;border-radius:0}
#ck-elige button.sel,#ck-elige button:hover{background:#3a0f1c;border-color:#e2b04a;color:#ffe9b0}
#ck-elige small{display:block;font:600 12px 'CK Grenze',Grenze,Georgia,serif;letter-spacing:.12em;color:#c9a978;margin-top:3px}
#ck-elige-tit{position:absolute;left:50%;bottom:calc(22% + 70px);transform:translateX(-50%);z-index:9000;font:700 15px 'CK Grenze',Grenze,Georgia,serif;letter-spacing:.24em;color:#e2b04a;text-shadow:0 2px 0 #000;text-transform:uppercase;white-space:nowrap}`;
  const elegir = (S, titulo, ops) => new Promise(r => {
    if (!document.getElementById('ck-elige-css')) { const st = document.createElement('style'); st.id = 'ck-elige-css'; st.textContent = CSS; document.head.appendChild(st); }
    const host = document.getElementById('game-wrapper') || document.body;
    const t = document.createElement('div'); t.id = 'ck-elige-tit'; t.textContent = titulo;
    const box = document.createElement('div'); box.id = 'ck-elige';
    let sel = 0, listo = false;
    const bs = ops.map((o, i) => { const b = document.createElement('button'); b.innerHTML = o.t + '<small>' + (i + 1) + ' · ' + o.d + '</small>'; b.onclick = () => fin(i); box.appendChild(b); return b; });
    const pintar = () => bs.forEach((b, i) => b.classList.toggle('sel', i === sel));
    const tecla = ev => {
      if (ev.key === 'ArrowLeft' || ev.key === 'a' || ev.key === 'A') { sel = 0; pintar(); }
      else if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') { sel = ops.length - 1; pintar(); }
      else if (ev.key === '1' || ev.key === '2') fin(+ev.key - 1);
      else if (ev.key === 'Enter' || ev.key === 't' || ev.key === 'T' || ev.key === ' ') fin(sel);
      else return;
      ev.preventDefault(); ev.stopPropagation();
    };
    const fin = i => { if (listo) return; listo = true; window.removeEventListener('keydown', tecla, true); box.remove(); t.remove(); S._overlay = null; sonar('ui_click', 0.8); r(i); };
    host.appendChild(t); host.appendChild(box); pintar();
    S._overlay = 'ck_elige';
    setTimeout(() => window.addEventListener('keydown', tecla, true), 250);
    window.CK_ELEGIR_ACTUAL = fin;           // (para las pruebas)
  });

  // ------------------------------------------------------------------ Gaspar agradece; se elige
  const gracias = async S => {
    const e = E(), a = area(S), g = S._ccGaspar, f = fl(S.story);
    if (window.CK_MUSICA_MOMENTOS) window.CK_MUSICA_MOMENTOS.fijar(S, null);
    await e.correr(S, async () => {
      // se encuentran en el medio del salón: si el héroe quedó contra la puerta de abajo (o un costado), un fundido corto lo
      // trae (si no, la cámara topa con el borde y el diálogo tapa a los dos)
      const pm = pies(S), mx = Phaser.Math.Clamp(pm.x - a.x, 130, (a.w || 480) - 150), my = Phaser.Math.Clamp(pm.y - a.y, 230, (a.h || 600) - 200);
      if (Math.abs(pm.x - a.x - mx) > 6 || Math.abs(pm.y - a.y - my) > 6) {
        const cam = S.cameras.main;
        await new Promise(r => { cam.fadeOut(260, 0, 0, 0); S.time.delayedCall(300, r); });
        S.placePlayerFeetAt(a.x + mx, a.y + my);
        await e.camara(S, mx + 19, my - 30, 10);
        cam.fadeIn(300, 0, 0, 0);
      } else await e.camara(S, mx + 19, my - 30, 500);
      if (g && g.active) { g.clearTint(); await e.caminar(S, g, mx + 38, my, 70); g.setFlipX(true); }
      S.player.setFlipX(false);
      await e.dialogo(S, 'Sir Gaspar', ['Gracias… gracias. Te debo la vida, elegido.', 'Yo… yo sólo cumplía órdenes, ¿entendés? El Rey quería abrir esa piedra. Yo nada más… traje las piedras.',
        'Dejame ir. Me voy del reino esta misma noche y nunca más me ves.'], 'ck_gaspar_idle');
    });
    // la elección va fuera de la escena (CK_ESCENA.correr se suelta sola a los 90 s y el cartel puede esperar lo que haga falta):
    // el héroe queda quieto igual, con las franjas puestas
    S._ckEscena = true; document.body.classList.add('ck-escena'); if (e.franjas) e.franjas(true);
    if (S.player.setVelocity) S.player.setVelocity(0, 0);
    const eleccion = await elegir(S, '¿Qué hacés con Sir Gaspar?', [{ t: '⚔ Derrotarlo', d: 'que pague lo que hizo' }, { t: '🕊 Dejarlo ir', d: 'humillado, sin nada' }]);
    S._ckEscena = false;
    await e.correr(S, async () => { if (eleccion === 0) await unGolpe(S, g); else await humillado(S, g); });
    f.gaspar_fin = eleccion === 0 ? 'derrotado' : 'perdonado';
    S._ccPelea = null; S._ccCapa = 0.35;
    paso(S, 6, eleccion === 0 ? 'SIR GASPAR, DE UN GOLPE' : 'SIR GASPAR SE FUE');
    S.showZoneTitle('Los aposentos del Rey', 'Se escondió detrás de esa puerta');
  };
  /** DERROTARLO: la escena épica… y ridícula. Gaspar desenvaina con floritura, todo se pone lento, un solo tajo, él vuela
      girando, aterriza de cabeza, el yelmo rueda y quedan estrellitas. */
  const unGolpe = async (S, g) => {
    const e = E(), cam = S.cameras.main, a = area(S);
    if (!g || !g.active) return;
    await e.dialogo(S, 'Sir Gaspar', ['¡¿Qué?! ¡¿Así me pagás?!', 'Muy bien. ¡Que el reino entero vea cómo pelea un verdadero caballero! ¡EN GUARDIA!'], 'ck_gaspar_idle');
    // la floritura: gira la espada, pose, el viento le mueve la capa
    g.play('ck_gaspar_attack', true); S.tweens.add({ targets: g, angle: { from: -8, to: 8 }, duration: 160, yoyo: true, repeat: 3 });
    sonar('sword_swing2', 0.7, { rate: 0.8 }); await e.esperar(400); sonar('sword_swing2', 0.7, { rate: 1.1 }); await e.esperar(400);
    g.setAngle(0); g.play('ck_gaspar_idle', true);
    e.globo(S, g, '¡Ja! ¡JA!', 1000);
    // se pone lento: zoom, franjas, un latido
    const z0 = cam.zoom;
    S.tweens.add({ targets: cam, zoom: z0 * 1.35, duration: 700, ease: 'Sine.easeInOut' });
    cam.pan((S.player.x + g.x) / 2, (S.player.y + g.y) / 2 - 20, 700, 'Sine.easeInOut');
    sonar('ck_latido', 0.8) || sonar('thunder_strike', 0.3, { rate: 0.5 });
    await e.esperar(1100);
    // el tajo: el héroe cruza como un rayo, estela y corte en X
    const x0 = S.player.x, xg = g.x;
    for (let i = 0; i < 5; i++) {
      const c = S.add.sprite(x0 + (xg - x0) * i / 5, S.player.y, S.player.texture.key, S.player.frame.name).setOrigin(S.player.originX, S.player.originY)
        .setScale(S.player.scaleX, S.player.scaleY).setFlipX(S.player.flipX).setTintFill(0xffffff).setAlpha(0.5 - i * 0.08).setDepth(S.player.depth - 1);
      objs(S).push(c); S.tweens.add({ targets: c, alpha: 0, duration: 500, delay: i * 40, onComplete: () => c.destroy() });
    }
    S.player.x = xg + 46; S.player.setFlipX(true);
    if (S.player.body) S.player.body.reset(S.player.x, S.player.y);
    sonar('sword_hit', 1, { rate: 0.6 }); sonar('ck_habilidad', 0.6);
    const vx = window.CK_VFX; if (vx) { vx.fx(S, 'pfx_corte_x', g.x, g.y - 20, { escala: 1.4, prof: 27600 }); vx.fx(S, 'pfx_critico_blanco', g.x, g.y - 22, { escala: 1.2, prof: 27601 }); }
    // el cuadro de impacto: todo blanco y quieto un instante
    cam.flash(160, 255, 255, 255);
    S.tweens.timeScale = 0.05; S.anims.globalTimeScale = 0.05;
    await e.esperar(650);
    S.tweens.timeScale = 1; S.anims.globalTimeScale = 1;
    S.tweens.add({ targets: cam, zoom: z0, duration: 500 });
    // vuela girando, aterriza de cabeza
    g.play('ck_gaspar_hurt', true); g.clearTint();
    const gx0 = g.x, gy0 = g.y, dest = { x: gx0 - 120, y: gy0 + 30 }, k = { t: 0 };
    sonar('ck_grito', 0.6, { rate: 1.5 });
    await new Promise(r => S.tweens.add({ targets: k, t: 1, duration: 1100, ease: 'Sine.easeInOut',
      onUpdate: () => { g.setPosition(gx0 + (dest.x - gx0) * k.t, gy0 + (dest.y - gy0) * k.t - Math.sin(k.t * Math.PI) * 120).setAngle(k.t * 900).setDepth(g.y + 40); }, onComplete: r }));
    g.setAngle(180); g.anims.stop();
    cam.shake(300, 0.01); sonar('bone_hit', 0.9, { rate: 0.6 });
    // el yelmo sale rodando
    const yelmo = S.add.circle(g.x, g.y + 8, 5, 0x2a2a34).setStrokeStyle(2, 0x8a8a99).setDepth(g.depth + 1); objs(S).push(yelmo);
    S.tweens.add({ targets: yelmo, x: g.x - 70, angle: 720, duration: 1200, ease: 'Quad.easeOut' });
    S.tweens.add({ targets: yelmo, y: g.y - 10, duration: 200, yoyo: true, ease: 'Quad.easeOut' });
    // las estrellitas
    const est = S.add.text(g.x, g.y + 18, '✦  ✦  ✦', { fontFamily: 'Georgia', fontSize: '14px', color: '#ffe08a', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(27650); objs(S).push(est);
    S.tweens.add({ targets: est, angle: 360, duration: 1400, repeat: -1 });
    S.tweens.add({ targets: g, y: g.y + 2, duration: 160, yoyo: true, repeat: 6 });     // las piernas que patalean
    await e.esperar(900);
    e.globo(S, g, '…mi peinado…', 1800);
    await e.esperar(1600);
    await e.dialogo(S, nombre(S), ['…Un golpe. Uno.'], S.player.texture.key);
    await e.esperar(400);
    S._ccGasparTirado = true;
  };
  /** DEJARLO IR: se va… y se tropieza con su capa. */
  const humillado = async (S, g) => {
    const e = E(), a = area(S);
    if (!g || !g.active) return;
    await e.dialogo(S, nombre(S), ['Andate. Sin caballo, sin espada y sin oro.', 'Y que todo el reino sepa lo que hiciste.'], S.player.texture.key);
    await e.dialogo(S, 'Sir Gaspar', ['…', 'Esto… esto no termina acá.'], 'ck_gaspar_idle');
    g.play('ck_gaspar_walk', true); g.setFlipX(true);
    await e.caminar(S, g, g.x - a.x - 50, g.y - a.y + 30, 50);
    // se pisa la capa
    sonar('bone_hit', 0.6, { rate: 0.8 });
    S.tweens.add({ targets: g, angle: g.flipX ? -84 : 84, duration: 180 });
    await e.esperar(300);
    e.globo(S, g, '¡¡AY!!', 1100);
    await e.esperar(1200);
    S.tweens.add({ targets: g, angle: 0, duration: 260 });
    await e.esperar(400);
    e.globo(S, g, '…nadie vio eso.', 1400);
    g.play('ck_gaspar_walk', true);
    await e.caminar(S, g, 240, 470, 70);
    g.setVisible(false);
  };

  // ------------------------------------------------------------------ los aposentos: el Rey y el cristal; entra Eloy
  const aposentos = async S => {
    const e = E(), s = S.story, f = fl(s); if (!e || S._ccRey || c3(s) !== 6) return;
    S._ccRey = true;
    const a = area(S), k = S.player.scaleY / 1.2, w = a.w || 400, h = a.h || 300;
    const rx = w * 0.62, ry = h * 0.5;
    const rey = S.add.sprite(a.x + rx, a.y + ry, 'king_idle').setOrigin(0.54, 0.61).setScale(1.2 * k).setDepth(a.y + ry).setFlipX(true);
    rey._ckAnim = 'kingprueba'; if (S.anims.exists('kingprueba_idle')) rey.play('kingprueba_idle'); objs(S).push(rey);
    const ok = await e.correr(S, async () => {
      await e.camara(S, rx - 30, ry - 20, 800);
      S.tweens.add({ targets: rey, x: rey.x + 2, duration: 70, yoyo: true, repeat: 5 });
      sonar('ck_grito', 0.4, { rate: 1.4 });
      await e.dialogo(S, 'Rey Aldric', ['¡¿Quién anda ahí?! ¡Guardias! ¡GUARDIAS…!', '…¿Vos? ¡Ah! ¡Ah, sos vos! ¡' + nombre(S) + '! ¡Mi más fiel guerrero!',
        'Sabía que vendrías. Siempre lo supe. Gaspar… Gaspar me engañó, ¿entendés? Todo fue cosa suya.'], 'king_idle');
      await e.globo(S, S.player, '…', 1400);
      await e.dialogo(S, 'Rey Aldric', ['Esa cara… No me creés. Bien. Bien, bien.', 'Lo que quieras. Oro, tierras, un título… la mitad del reino.',
        'Y esto. Tomá. Es lo que querías, ¿no? El cristal del portal: con él se llega al otro lado… donde está mi hija.'], 'king_idle');
      // el cristal
      const c = S.add.star(rey.x - 16, rey.y - 30, 5, 4, 9, 0x8a1ab0).setStrokeStyle(2, 0x2a0638).setDepth(27600); objs(S).push(c);
      sonar('heal', 0.5, { rate: 0.6 });
      S.tweens.add({ targets: c, angle: 360, duration: 1200 });
      await new Promise(r => S.tweens.add({ targets: c, x: S.player.x, y: S.player.y - 24, duration: 1000, ease: 'Sine.easeInOut', onComplete: r }));
      S.tweens.add({ targets: c, scale: 0.3, alpha: 0, duration: 300, onComplete: () => c.destroy() });
      S.createFloatingText(S.player.x, S.player.y - 60, '◆ CRISTAL DEL PORTAL ◆', 0xd08cff);
      sonar('quest_done', 0.7);
      (f.cristales = f.cristales || {}).portal = true; S.saveStory();
      await e.esperar(800);
      // entra el Maestre Eloy
      const eloy = E().actor(S, S.textures.exists('npc6_villager') ? 'npc6_villager' : 'npc1_villager', 40, h - 30, { escala: 1.3 * k });
      objs(S).push(eloy);
      await e.caminar(S, eloy, rx - 110, ry + 20, 40);
      eloy.setFlipX(false);
      await e.dialogo(S, 'Maestre Eloy', ['Majestad.', '…Muchacho. Con ese cristal se puede abrir el paso al otro lado. Yo sé cómo.',
        'Vení a mi biblioteca. Ahí hago el ritual y te mando. La princesa no tiene mucho tiempo.'], 'npc6_villager');
      await e.dialogo(S, 'Rey Aldric', ['¡Sí, sí, vayan! Tráiganla… y díganle que su padre… que su padre…'], 'king_idle');
      await e.caminar(S, eloy, 40, h - 30, 55);
      eloy.setVisible(false);
    });
    S._ccRey = false;
    if (!ok) return;
    paso(S, 7, 'EL CRISTAL DEL PORTAL');
  };

  // ------------------------------------------------------------------ la biblioteca: el ritual de Eloy → la Mazmorra
  const ritualEloy = async S => {
    const e = E(); if (!e || S._ccEloy) return;
    S._ccEloy = true;
    const a = area(S), C = window.CK_CAPITULO3;
    // el ritual va en el medio de la sala, sobre la alfombra redonda (antes, donde estuviera el héroe: contra la puerta de
    // abajo quedaba medio fuera de cuadro)
    const cx = (a.w || 480) / 2, cy = (a.h || 400) * 0.6, p = { x: a.x + cx, y: a.y + cy };
    await e.correr(S, async () => {
      const cam = S.cameras.main;
      await new Promise(r => { cam.fadeOut(260, 0, 0, 0); S.time.delayedCall(300, r); });
      S.placePlayerFeetAt(p.x, p.y);
      await e.camara(S, cx, cy - 30, 10);
      cam.fadeIn(300, 0, 0, 0);
      await e.dialogo(S, 'Maestre Eloy', ['Parate ahí, en el medio. No te muevas.', 'El cristal abre la puerta; yo la sostengo. Del otro lado vas a estar solo.',
        'Buscá a la princesa. Y si ves al que está detrás de todo esto… no lo mires a los ojos.'], 'npc6_villager');
      const vx = window.CK_VFX;
      if (vx) { const r = vx.fx(S, 'pfx_c3_runas', p.x, p.y + 4, { escala: 1.3, prof: p.y - 4, suma: true }); if (r) objs(S).push(r); }
      sonar('magic_cast', 0.7, { rate: 0.8 }) || sonar('heal', 0.6, { rate: 0.7 });
      S.cameras.main.shake(900, 0.004);
      await e.esperar(1400);
      const po = C && C.portalFx ? C.portalFx(S, p.x, p.y + 6, 0.9, p.y + 2) : null;
      if (vx) { const c = vx.fx(S, 'pfx_c3_columna', p.x, p.y + 6, { escala: 1.1, prof: 27610, suma: true }); if (c) objs(S).push(c); }
      await e.esperar(900);
      S.tweens.add({ targets: S.player, alpha: 0, scaleX: S.player.scaleX * 0.2, scaleY: S.player.scaleY * 1.6, duration: 700, ease: 'Quad.easeIn' });
      sonar('ck_portal_abre', 0.9, { rate: 0.8 });
      S.cameras.main.flash(400, 200, 120, 255);
      await e.esperar(900);
    });
    S._ccEloy = false;
    S.tweens.killTweensOf(S.player); S.player.setAlpha(1);
    const k = S.player._ckEscVal || S.player.scaleX; S.player.setScale(Math.abs(S.player.scaleY) < 0.01 ? 1.2 : S.player.scaleX);
    paso(S, 8, 'LA MAZMORRA DEL SELLO');
    S.ckEntrar('mazmorra_sello');
  };
  if (typeof STORY_NPCS !== 'undefined') {
    const eloy = STORY_NPCS.find(n => n.id === 'eloy');
    if (eloy) {
      const l0 = eloy.lines;
      eloy.lines = (s, hero) => {
        if (c3(s) === 7) return ['El cristal… sí. Parate en el medio de la sala cuando estés listo, y hablame.'];
        if (c3(s) >= 8) return ['Que la luz te acompañe del otro lado, muchacho.'];
        return l0(s, hero);
      };
    }
  }

  // ------------------------------------------------------------------ enganches
  const sw0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombreA) {
    try {
      const s = this.story, n = c3(s);
      if (this._gameMode === 'campaign' && s && !libre() && n >= 4 && n <= 5 && !fl(s).cap3_fin) {
        const z = zonaDe(this);
        // la herrería y la cocina, trancadas: la gente se escondió ahí
        if ((nombreA === 'armory' || nombreA === 'kitchen') && /^castle\.courtyard$/.test(z)) {
          if (!this._ccTranca || this.time.now - this._ccTranca > 2600) {
            this._ccTranca = this.time.now;
            this.createFloatingText(this.player.x, this.player.y - 46, nombreA === 'armory' ? 'Trancado. Adentro: «¡No abran! ¡Hay demonios afuera!»' : 'Trancado. Huele a pan… y se oye llorar a un chico.', 0xfca5a5);
            sonar('door_locked', 0.6);
          }
          return;
        }
        // el Gran Salón, cerrado hasta limpiar el castillo
        if (nombreA === 'throne' && n === 5 && libres(s) < 4) {
          if (!this._ccTranca || this.time.now - this._ccTranca > 2600) {
            this._ccTranca = this.time.now;
            this.createFloatingText(this.player.x, this.player.y - 46, 'La puerta del Gran Salón no cede. Primero, el castillo (' + libres(s) + '/4).', 0xfca5a5);
          }
          return;
        }
      }
    } catch (e) {}
    const r = sw0.apply(this, arguments);
    try {
      const s = this.story;
      if (this._gameMode === 'campaign' && s && c3(s) === 4 && nombreA === 'courtyard') {
        const S = this;
        S.time.delayedCall(1200, () => {
          if (zonaDe(S) !== 'castle.courtyard' || c3(S.story) !== 4) return;
          paso(S, 5, 'EL CASTILLO ARDE');
          S.showZoneTitle('El castillo', 'Limpiá el patio, el jardín, la muralla y el patio de armas');
          armar(S);
        });
      }
    } catch (e) {}
    return r;
  };
  const al0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = al0 ? al0.apply(this, arguments) : undefined;
    try {
      const S = this; limpiarObjs(S); S._ccCapa = undefined; S._ccSalon = false; S._ccPelea = null; S._ccRey = false;
      if (S._gameMode !== 'campaign' || !S.story) return r;
      const z = zonaDe(S), n = c3(S.story);
      gente(S); vaciarSalon(S);
      S.time.delayedCall(700, () => {
        if (zonaDe(S) !== z) return;
        try {
          gente(S); vaciarSalon(S);
          if (LUGARES[z] && n === 5) armar(S);
          else hud(S);
          if (z === SALON && n === 5 && libres(S.story) >= 4) S.time.delayedCall(300, () => salon(S));
          if (z === SALON && n >= 6 && S._ckGasparSp) S._ckGasparSp.setVisible(false);
          if (z === APOSENTOS && n === 6) S.time.delayedCall(400, () => aposentos(S));
        } catch (e) { console.warn('[castillo]', e); }
      });
    } catch (e) {}
    return r;
  };
  const ve0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy) {
    const r = ve0 ? ve0.apply(this, arguments) : undefined;
    try {
      if (enemy && enemy._ccSlot && enemy._ccZ && LUGARES[enemy._ccZ]) {
        const e3 = est(this.story, enemy._ccZ);
        if (e3.m.indexOf(enemy._ccSlot) < 0) { e3.m.push(enemy._ccSlot); this.saveStory(); }
        hud(this); comprobar(this, enemy._ccZ);
      }
    } catch (e) {}
    return r;
  };
  const np0 = P.nearbyStoryNPC;
  P.nearbyStoryNPC = function () {
    const r = np0.apply(this, arguments);
    try {
      const n = this.story && c3(this.story);
      if (r && r.npc && r.npc.id === 'king' && zonaDe(this) === SALON && n >= 4 && n <= 8 && !fl(this.story).cap3_fin) return null;
    } catch (e) {}
    return r;
  };
  const ta0 = P.onTalked;
  P.onTalked = function (id) {
    try {
      const s = this.story;
      if (id === 'eloy' && c3(s) === 7 && zonaDe(this) === BIBLIO) { ritualEloy(this); return; }
      if (id === 'bruno_c3' && c3(s) === 4) {
        this.openDialog('Capitán Bruno', ['El portón está abierto. Adentro el castillo arde: el patio, el jardín, la muralla, el patio de armas.',
          'Dicen que la gente se encerró en la herrería y en la cocina. Y el Rey… el Rey se escondió en sus aposentos.', 'Entrá. Yo cuido el portón.'], null, 'g_knight_idle');
        return;
      }
    } catch (e) { console.warn('[castillo]', e); }
    return ta0.apply(this, arguments);
  };
  const ob0 = P.updateObjective;
  P.updateObjective = function () {
    const r = ob0.apply(this, arguments);
    try {
      const s = this.story, n = c3(s), t = document.querySelector('#ck-objective .ck-obj-text');
      if (t && n >= 4 && n <= 8 && OBJ[n] && !fl(s).cap3_fin) t.textContent = typeof OBJ[n] === 'function' ? OBJ[n](s) : OBJ[n];
    } catch (e) {}
    return r;
  };
  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try {
      const S = this, s = S.story;
      if (S._gameMode !== 'campaign' || !s || !S.player) return r;
      // el rojo del castillo (ck_capitulo3.js lo dibuja con su capa fija)
      if (S._ccCapa !== undefined && !S._ckiv) { if (window.CK_INFIERNO_VIVO && CK_INFIERNO_VIVO.est) CK_INFIERNO_VIVO.est(S); }
      if (S._ccCapa !== undefined) S._c3CapaFija = S._ccCapa;
      else if (S._c3CapaFijaCC) S._c3CapaFija = undefined;
      S._c3CapaFijaCC = S._ccCapa !== undefined;
      if (S._ccPelea) peleaSalonCuadro(S);
      if (S._ccHud && (!S._ccHudT || S.time.now - S._ccHudT > 600)) { S._ccHudT = S.time.now; hud(S); }
      if (!S._ccGenteT || S.time.now - S._ccGenteT > 700) { S._ccGenteT = S.time.now; gente(S); }
    } catch (e) { if (!P._ccErr) { P._ccErr = 1; console.warn('[castillo]', e); } }
    return r;
  };
  window.CK_CASTILLO_C3 = { LUGARES, ORDEN, est, libres, armar, salon, gracias, aposentos, ritualEloy, elegir };
})();
