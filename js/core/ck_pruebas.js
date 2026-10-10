/* PRUEBAS DEL JUEGO: se abren con doble clic en pruebas.html (que abre index.html?pruebas=1).
   Recorren el juego solas: campaña, noche, taberna, castillo, ruinas y práctica, y revisan música, ambiente,
   eco por lugar, pasos, puertas, voces de diálogo y efectos con contorno. No guardan partida ni tocan nada.
   Necesitan un clic al empezar (el navegador no deja sonar audio sin un clic). Resultado en window.__resultado. */
'use strict';
(function () {
  if (!/[?&]pruebas=1/.test(location.search)) return;
  const lista = [], errores = [];
  const prueba = (nombre, fn) => lista.push({ nombre, fn });
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  const ok = (c, m) => { if (!c) throw new Error(m || 'no se cumplió'); };
  window.addEventListener('error', e => errores.push(e.message));
  const escena = () => game.scene.scenes.find(s => s.startCampaign);
  const S = () => window.CK_SONIDO || {};
  const hasta = async (cond, ms = 4000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (cond()) return true; await esperar(80); } return false; };
  const sonaron = desde => (S().log || []).slice(desde);

  prueba('El juego arranca y la campaña empieza', async () => { const s = escena(); ok(s, 'no está la escena principal'); s.startCampaign(); ok(await hasta(() => s._gameMode === 'campaign' && s.player), 'no arrancó la campaña'); await esperar(800); });
  prueba('Música de la aldea (día) y de noche', async () => {
    const s = escena(); s.dayClock = 0.1 * 300000; ok(await hasta(() => s._zoneMusic === 'village'), 'de día no suena la aldea (' + s._zoneMusic + ')');
    s.dayClock = 0.7 * 300000; ok(await hasta(() => s._zoneMusic === 'noche'), 'de noche no cambia a "noche"'); s.dayClock = 0.1 * 300000; await hasta(() => s._zoneMusic === 'village');
  });
  prueba('Archivos de música cargados', async () => { const E = music.audioElements, faltan = ['village', 'intro', 'castle', 'ruins', 'boss', 'taberna', 'noche', 'practica'].filter(k => !E[k] || E[k].error); ok(!faltan.length, 'no cargan: ' + faltan.join(', ')); });
  prueba('Sonido del Taller listo (54 sonidos)', async () => { ok(await hasta(() => S().listo, 6000), 'no terminó de cargar'); ok(Object.keys(S().buf).length >= 50, 'faltan sonidos: ' + Object.keys(S().buf || {}).length); });
  prueba('Voz y pluma al hablar con un NPC', async () => {
    const s = escena(), d = (S().log || []).length; s.openDialog('Rey Aldric', ['Bienvenido a mi reino, valiente guerrero. Hay mucho por hacer en estas tierras.'], null, 'king_idle'); await esperar(1500);
    const l = sonaron(d); ok(l.some(n => n === 'voz_rey'), 'no sonó la voz del rey'); ok(l.filter(n => n.indexOf('pluma') === 0).length > 3, 'casi no sonó la pluma');
    s._dlg.shown = 999; s._dlg.at = 0; s.advanceDialog(); await esperar(300); ok(!s._dlg, 'el diálogo no cerró'); s.dialogOpen = false;
  });
  prueba('Taberna: puertas, música, ambiente y eco', async () => {
    const s = escena(), d = (S().log || []).length, puerta = s.children.list.find(o => o._interiorKind === 'bar'); ok(puerta, 'no encontré la puerta de la taberna');
    s.enterInterior(puerta); ok(await hasta(() => s.currentInterior && s.currentInterior.building.kind === 'bar'), 'no entró'); await esperar(600);
    ok(s._zoneMusic === 'taberna', 'música: ' + s._zoneMusic); ok(S().sala === 'taberna', 'eco: ' + S().sala); ok(ambience.want.amb_taberna > 0, 'sin ambiente de taberna');
    const l = sonaron(d); ok(l.includes('puerta_abre') && l.includes('puerta_cierra'), 'no sonaron las puertas');
    s.exitInterior(); ok(await hasta(() => !s.currentInterior), 'no salió'); await esperar(500);
  });
  prueba('Castillo: salón del trono con eco grande y pasos de piedra', async () => {
    const s = escena(); s.enterCastle(); ok(await hasta(() => s.currentInterior && s.currentInterior.building.kind === 'castle'), 'no entró al castillo'); await esperar(500);
    s.switchInteriorArea('courtyard'); await hasta(() => s.currentInterior.areaName === 'courtyard'); await esperar(500); s.switchInteriorArea('throne'); ok(await hasta(() => s.currentInterior.areaName === 'throne'), 'no llegó al salón'); await esperar(500);
    ok(S().sala === 'salon', 'eco: ' + S().sala); ok(s._zoneMusic === 'castle', 'música: ' + s._zoneMusic);
    const d = (S().log || []).length; sfx.fx('step_stone1', 0.5); ok(sonaron(d).some(n => n.indexOf('step_stone_') === 0), 'el paso de piedra no usa los sonidos nuevos');
  });
  prueba('Ruinas: música, viento y eco', async () => {
    const s = escena(); s.currentInterior = null; s.enterRuins(); ok(await hasta(() => s.currentInterior && s.currentInterior.building.kind === 'ruins'), 'no entró a las ruinas'); await esperar(600);
    ok(s._zoneMusic === 'ruins', 'música: ' + s._zoneMusic); ok(S().sala === 'ruinas', 'eco: ' + S().sala); ok(ambience.want.amb_ruinas > 0, 'sin viento de ruinas');
  });
  prueba('Práctica: música y ambiente de campo', async () => { const s = escena(); s.startPractice(); ok(await hasta(() => s._zoneMusic === 'practica'), 'música: ' + s._zoneMusic); ok(await hasta(() => ambience.want.amb_aldea_dia > 0), 'sin ambiente'); });
  prueba('Efectos con contorno (ck_fx)', async () => {
    const f = Object.assign(JSON.parse(JSON.stringify(CKFx.plantillas.humo)), { contorno: { grosor: 2, color: '#ff00ff' } }), s = CKFx.crear(f, { semilla: 3 }); for (let i = 0; i < 60; i++) s.paso(1 / 60);
    const c = document.createElement('canvas'); c.width = c.height = 120; const x = c.getContext('2d'); s.dibujar(x, 60, 90, null); const d = x.getImageData(0, 0, 120, 120).data; let m = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 60 && d[i + 2] > 200) m++; ok(m > 20, 'no se ve el contorno');
  });
  prueba('Sin errores en la consola', async () => ok(!errores.length, errores.join(' / ')));

  const correr = async () => {
    const caja = document.createElement('div'); caja.style.cssText = 'position:fixed;right:12px;top:12px;width:440px;max-height:80vh;overflow:auto;z-index:99999;background:#24272c;color:#e9e7e2;border:1px solid #4a505a;border-radius:10px;padding:12px;font:13px Segoe UI,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)';
    caja.innerHTML = '<b>Pruebas del juego…</b>'; document.body.append(caja); const res = [];
    for (const t of lista) { const f = document.createElement('div'); f.style.padding = '3px 0'; f.textContent = '… ' + t.nombre; caja.append(f);
      try { await t.fn(); res.push({ nombre: t.nombre, ok: true }); f.textContent = '✔ ' + t.nombre; f.style.color = '#5fc27e'; }
      catch (e) { res.push({ nombre: t.nombre, ok: false, error: e.message }); f.textContent = '✘ ' + t.nombre + ' — ' + e.message; f.style.color = '#e8644f'; } }
    const mal = res.filter(r => !r.ok).length; caja.firstChild.textContent = mal ? mal + ' prueba(s) fallaron de ' + res.length : 'Todo bien: ' + res.length + ' pruebas'; caja.firstChild.style.color = mal ? '#e8644f' : '#5fc27e';
    window.__resultado = { total: res.length, fallas: mal, res };
  };
  // un clic para que el navegador deje sonar el audio; después corre solo
  window.addEventListener('load', () => {
    const b = document.createElement('button'); b.textContent = 'Clic acá para empezar las pruebas del juego'; b.style.cssText = 'position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);z-index:99999;padding:18px 28px;font:600 18px Segoe UI,sans-serif;background:#e8b83a;color:#1d1a10;border:0;border-radius:10px;cursor:pointer';
    b.id = 'ck-empezar-pruebas'; b.onclick = () => { b.remove(); try { sfx.init(); if (window.CK_SONIDO && CK_SONIDO.iniciar) CK_SONIDO.iniciar(); } catch (e) { } setTimeout(correr, 300); };
    setTimeout(() => document.body.append(b), 1500);
  });
})();
