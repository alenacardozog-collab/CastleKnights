'use strict';
/* Reloj de sol (10/11, pedido del dueño: "que se pueda comprar un reloj tipo de sol, que al equipárselo deje ver los
   horarios del mapa"). Ícono de PixelLab.
   - Se compra una vez (60 monedas) en la Tienda de Víveres, el puesto del mercado del patio y el Posadero.
   - Queda equipado: arriba a la izquierda, debajo del minimapa, aparece el reloj con la hora del juego (el día va de las
     6 a las 20, la noche de las 20 a las 6), el momento (mañana, tarde, atardecer, noche, amanecer) y los horarios del
     lugar: si las tiendas están abiertas y hasta cuándo, cuánto falta para la noche o para el día, y la luna llena.
   - Con O se guarda y se vuelve a sacar. De noche, bajo techo o sin sol no marca la hora exacta ("de noche no da
     sombra"): sólo dice que es de noche y cuánto falta para el amanecer (pero las tiendas sí).
   Borrar su línea de index.html lo saca (si ya se compró, queda en la partida sin usar). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const PRECIO = 60, ICONO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAVCAYAAABc6S4mAAAC40lEQVR4XqVVTUhUYRQ944ya/UlljlCKaaCgZclMEYGh2M+qwFAJWrQpWki1CARBpIxWQQQuRFsYCGKiUCv7IdGKfkZEQcEBM5tKZsxJLK0mGyfOffO93tPxCXbgwdP3fefee+65d4D/wPFcV4SPFUXcWvlJ/LB5y1qvW4PkoedHI08u7bfMnnCslkIsCeovpAOYw63H9tWuxw6gSBvOhJBR8k+GX5PzqKj7jQL3HHzP/Diy2wbAFXk02s+XmDBVoIiN2g55NuoXa5tm5BvJJ4IO9I7Zcf9aAirqtEbHCqRHJrmWcZqQzk5MoPtFEi7X5MPv+4Lapo8mcs94WAK7s+w4cDgJU6PfUdWWuCyIuMhIHgjsgutKJ3KK3EJO3L73wVTV++lFzP4AescSkJyZCe9nJxLzDomkS3um21RlfufmMD51XcTOskZdmq8h7Ril6fHGoWfEjsHJBDTfKMRg/7gkwCpTczdha+KiqRc25WfKkpaxXT4yiMq+ur4fLQ3bdPLpbxHJ/OoxTSI66XThgk5anLNokipmAIXurjdyocOjtYqy+IIO7En/I3+nbLZhnyvLlHHOjoA4TTXdNMnMnI/CibKD4hY2kmTZaTYU54XlneB3Vt3eGpDHCLqtumRvxLICBW+fx3SZoAliITk8rFfApssc9HVMo6gcGIryMBvVAysy1a/Ks06phOTtD+YBxEsF56qCmovoaTqEh+gII7lRMiPU/3mWdwjOwju/tp5Onp9B29CA1gNqzEaGRl6JY2g5Y3ZEa8treYygdDzbWLNO7t7ttSF5vXZCTbV0i1al7VhJuTsiM0Fw6FQw+p0WLS3J1mNwJ3E/URZmThN0DsSbplnfRU+HwyjNZyVhpHinhKTy1Dyc7g3yXuBOjRJrpJSjr8Mh9wiSK3mMMG1BVQnB/aI1DJL5SqBl1fBZLjsjGIgjf71sQcb/7cufy/i5jxSxUfOlWHGPq96smHoUVr8FxF/Od31UNyx0NgAAAABJRU5ErkJggg==';
  const H = window.CK_HORARIOS || { ABRE: 0.94, CIERRA: 0.56 };
  // dayPhase → hora (0..24): amanecer 0,92–1 = 6–7 h; día 0–0,52 = 7–18 h; atardecer 0,52–0,62 = 18–20 h; noche 0,62–0,92 = 20–6 h
  const TRAMOS = [[0, 0.52, 7, 18], [0.52, 0.62, 18, 20], [0.62, 0.92, 20, 30], [0.92, 1, 6, 7]];
  const hora = p => { for (const [a, b, h0, h1] of TRAMOS) if (p >= a && p < b) return (h0 + (p - a) / (b - a) * (h1 - h0)) % 24; return 7; };
  const hhmm = h => { const m = Math.floor((h % 1) * 60 / 10) * 10; return Math.floor(h) + ':' + String(m).padStart(2, '0'); };
  // (11/11, pedido del dueño: "la hora está en números romanos y la representa el reloj solar")
  const romano = n => { n = Math.floor(n) || 24; let s = ''; [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']].forEach(([v, r]) => { while (n >= v) { s += r; n -= v; } }); return s; };
  const momento = p => p < 0.18 ? 'Mañana' : p < 0.36 ? 'Mediodía' : p < 0.52 ? 'Tarde' : p < 0.62 ? 'Atardecer' : p < 0.92 ? 'Noche' : 'Amanecer';
  const hasta = (h0, h1) => { let d = h1 - h0; if (d < 0) d += 24; const hs = Math.floor(d), ms = Math.round((d - hs) * 60 / 10) * 10; return hs ? (hs + ' h' + (ms ? ' ' + ms + ' min' : '')) : (ms || 10) + ' min'; };

  const instalarTienda = () => {
    if (typeof SHOP_ITEMS !== 'undefined' && !SHOP_ITEMS.find(i => i.id === 'reloj'))
      SHOP_ITEMS.push({ id: 'reloj', name: 'Reloj de sol', price: PRECIO, desc: 'Muestra la hora y los horarios del lugar. Tecla O para guardarlo o sacarlo.', max: 1, stat: 'reloj' });
    const T = window.CK_TIENDAS && window.CK_TIENDAS.TIENDAS;
    if (T) T.forEach(t => { if (/Víveres|mercado|Posadero/i.test(t.nombre) && !t.vende.includes('reloj')) t.vende.push('reloj'); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalarTienda); else instalarTienda();
  const st = S => { const s = S.story; if (!s) return null; s.up = s.up || {}; if (s.up.reloj === undefined) s.up.reloj = 0; s.flags = s.flags || {}; return s; };
  const tiene = S => { const s = st(S); return !!(s && s.up.reloj > 0); };

  // ------------------------------------------------------------------ el reloj en pantalla
  let caja = null;
  const css = () => {
    if (document.getElementById('ck-reloj-css')) return;
    const A = window.CK_UI2_ARTE || {};
    const s = document.createElement('style'); s.id = 'ck-reloj-css';
    s.textContent = `#ck-reloj{position:absolute;left:10px;top:222px;z-index:39;display:none;align-items:center;gap:7px;padding:5px 10px 5px 6px;pointer-events:none;
      background:linear-gradient(180deg,#f1dcb0,#d9bb82);border:2px solid #3a2414;box-shadow:0 0 0 2px #7a5230 inset,0 3px 4px rgba(0,0,0,.45);
      font-family:var(--ck2-f,Georgia,serif);color:#3a2414;line-height:1.1;max-width:230px}
      #ck-reloj.on{display:flex} body.ck2-dlg #ck-reloj{opacity:.25}
      #ck-reloj i{flex:none;width:48px;height:42px;background:url("${ICONO}") 0 0/100% 100% no-repeat;image-rendering:pixelated;position:relative}
      #ck-reloj i::after{content:'';position:absolute;left:50%;top:52%;width:2px;height:15px;background:#1b0f0a;transform-origin:50% 0;transform:rotate(var(--ang,0deg));opacity:var(--som,1)}
      #ck-reloj b{display:block;font-size:19px;font-weight:700}
      #ck-reloj b small{font-size:13px;font-weight:600;color:#7a2e14;margin-left:5px}
      #ck-reloj span{display:block;font-size:12px;font-weight:600;color:#5a3a24}`;
    document.head.appendChild(s);
  };
  const pintar = S => {
    if (!S || S._gameMode !== 'campaign' || !S.story) { if (caja) caja.classList.remove('on'); return; }
    css();
    const host = document.getElementById('game-wrapper') || document.body;
    if (!caja) { caja = document.createElement('div'); caja.id = 'ck-reloj'; caja.innerHTML = '<i></i><div><b></b><span class="a"></span><span class="b"></span></div>'; }
    if (caja.parentElement !== host) host.appendChild(caja);
    const s = st(S), ver = tiene(S) && !s.flags.reloj_guardado && !!document.querySelector('#ck-quick.on');
    caja.classList.toggle('on', ver);
    if (!ver) return;
    const p = S.dayPhase ? S.dayPhase() : 0.2, h = hora(p), noche = p >= 0.62 && p < 0.92;
    const sol = !noche && (!S.currentInterior || (window.CK_AFUERA ? window.CK_AFUERA(S) : S.currentInterior.area.outdoor));
    const ang = ((h - 12) / 12) * 120;          // la sombra gira de -60° (6 h) a +80° (20 h)
    caja.querySelector('i').style.setProperty('--ang', (180 + ang) + 'deg');
    caja.querySelector('i').style.setProperty('--som', sol ? 1 : 0);
    caja.querySelector('b').innerHTML = (sol ? 'Hora ' + romano(h) : (noche ? 'Noche' : '—')) + '<small>' + (sol ? momento(p) : noche ? '☾' : 'sin sol') + '</small>';
    // horarios
    const abre = hora(H.ABRE), cierra = hora(H.CIERRA), abierto = p >= H.ABRE || p < H.CIERRA;
    const a = abierto ? 'Tiendas abiertas hasta la hora ' + romano(Math.round(cierra)) : 'Tiendas cerradas · abren a la hora ' + romano(Math.round(abre));
    let b = noche ? 'Amanece en ' + hasta(h, 6) : 'Anochece en ' + hasta(h, 20);
    if (S.ckLunaLlena && S.ckLunaLlena()) b = '◯ Luna llena: los lobos andan bravos';
    else if (!noche && p >= 0.45 && S.ckLunaLlena && window.CK_DIA_NOCHE && CK_DIA_NOCHE.lunaHoy && CK_DIA_NOCHE.lunaHoy(S)) b += ' · luna llena';
    caja.querySelector('.a').textContent = a;
    caja.querySelector('.b').textContent = b;
  };
  const guardar = S => {
    if (S._gameMode !== 'campaign' || !tiene(S) || S.dialogOpen || S._overlay) return;
    const s = st(S); s.flags.reloj_guardado = !s.flags.reloj_guardado;
    try { window.CK_SIN_CARTELES_API && CK_SIN_CARTELES_API.nota(s.flags.reloj_guardado ? 'Guardás el reloj de sol' : 'Sacás el reloj de sol'); } catch (e) {}
    S.saveStory && S.saveStory(); pintar(S);
  };
  const i0 = P.initExtras;
  P.initExtras = function () {
    const r = i0.apply(this, arguments);
    try {
      st(this);
      if (!this._ckRelojKey) { this._ckRelojKey = true; this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O).on('down', () => guardar(this)); }
      pintar(this);
    } catch (e) { console.warn('[reloj]', e); }
    return r;
  };
  const b0 = P.buyItem;
  P.buyItem = function (id) {
    if (id === 'reloj' && this.story) st(this);
    const r = b0.apply(this, arguments);
    if (id === 'reloj' && tiene(this)) { this.story.flags.reloj_guardado = false; try { window.CK_SIN_CARTELES_API && CK_SIN_CARTELES_API.nota('Reloj de sol equipado · O para guardarlo'); } catch (e) {} pintar(this); }
    return r;
  };
  const e0 = P.endExtras;
  P.endExtras = function () { const r = e0.apply(this, arguments); if (caja) caja.classList.remove('on'); return r; };
  let acum = 0;
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    if ((acum += delta || 16) > 400) { acum = 0; try { pintar(this); } catch (e) {} }
    return r;
  };
  window.CK_RELOJ = { hora, hhmm, romano, momento, pintar };
})();
