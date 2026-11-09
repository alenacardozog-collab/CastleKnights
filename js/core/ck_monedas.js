'use strict';
/* Monedas de bronce, plata y oro (10/11, pedido del dueño: "100 monedas de bronce generan 1 de plata y 100 de plata una
   de oro; dependiendo de la dificultad que vayamos avanzando se encontrarán mejores recompensas").
   - La partida guarda lo mismo de siempre (story.coins = todo en bronce); acá sólo cambia cómo se muestra:
     1234 = 12 de plata y 34 de bronce; 10000 = 1 de oro. En el HUD, el objetivo, la tienda y los "+N" que saltan.
   - Premios según la zona: las bestias de los lugares más difíciles dejan más (Brumavieja ×1,25, Bosque de la Frontera
     ×1,5, Tierras Orcas ×1,75, Pueblo Orco ×2, Fortaleza ×2,5). Los precios no cambian.
   Borrar su línea de index.html lo deja como antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;

  // ------------------------------------------------------------------ partir y mostrar
  const partir = n => { n = Math.max(0, Math.floor(n || 0)); return { oro: Math.floor(n / 10000), plata: Math.floor((n % 10000) / 100), bronce: n % 100 }; };
  const html = n => {
    const p = partir(n), out = [];
    if (p.oro) out.push(`<i class="ckm o" title="oro"></i>${p.oro}`);
    if (p.plata) out.push(`<i class="ckm p" title="plata"></i>${p.plata}`);
    if (p.bronce || !out.length) out.push(`<i class="ckm b" title="bronce"></i>${p.bronce}`);
    return '<span class="ckm-v">' + out.join(' ') + '</span>';
  };
  /** "+1 plata 20 bronce" (para los textos que saltan, que no llevan íconos). */
  const texto = n => {
    const p = partir(n), out = [];
    if (p.oro) out.push(p.oro + ' oro');
    if (p.plata) out.push(p.plata + ' plata');
    if (p.bronce || !out.length) out.push(p.bronce + ' bronce');
    return out.join(' ');
  };

  const css = () => {
    if (document.getElementById('ck-monedas-css')) return;
    const coin = (a, b, c) => `radial-gradient(circle at 38% 34%, ${a} 0 18%, ${b} 21% 58%, ${c} 61% 100%)`;
    const st = document.createElement('style');
    st.id = 'ck-monedas-css';
    st.textContent = `
i.ckm { display: inline-block !important; width: .9em !important; height: .9em !important; border: 2px solid #1b0f0a !important; border-radius: 50% !important; box-sizing: border-box !important; vertical-align: -.1em !important; margin: 0 .18em 0 .1em !important; padding: 0 !important; box-shadow: none !important; flex: none !important; }
i.ckm.b { background: ${coin('#ffd0a0', '#c07a3a', '#6e3a14')} !important; }
i.ckm.p { background: ${coin('#ffffff', '#c8d2dc', '#6a7684')} !important; }
i.ckm.o { background: ${coin('#fff3b0', '#f0c040', '#9a6a10')} !important; }
.ckm-v { white-space: nowrap; }
.ckm-on > i:not(.ckm) { display: none !important; }
.ckm-on > img.px-ico { display: none !important; }`;
    document.head.appendChild(st);
  };

  // los números de monedas del HUD (los escriben ck_hud_heroe, ck_hud_tema y ck_ui_castillo con textContent):
  // cuando aparecen como número pelado, se cambian por las tres monedas
  const SPANS = '#ckh .cab .mon > span, .mon > span, .ck2-monedas > span, [data-k="monedas"]';
  // algunos HUD vuelven a escribir el número en cada cuadro: el span aprende a dibujar las monedas solo
  // (se le cambia textContent a ese elemento; lo que escriban, si es un número, se muestra con las tres monedas)
  const TC = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  const enseñar = sp => {
    if (sp._ckm) return;
    sp._ckm = true;
    let ultimo = null;
    Object.defineProperty(sp, 'textContent', {
      configurable: true,
      get() { return ultimo !== null ? String(ultimo) : TC.get.call(this); },
      set(v) {
        const t = String(v == null ? '' : v).trim();
        if (/^\d+$/.test(t)) { if (ultimo !== +t) { ultimo = +t; css(); this.innerHTML = html(ultimo); } }
        else { ultimo = null; TC.set.call(this, v); }
      }
    });
    if (sp.parentElement) sp.parentElement.classList.add('ckm-on');
    const t = (TC.get.call(sp) || '').trim();
    if (/^\d+$/.test(t)) sp.textContent = t;
  };
  const repasar = () => {
    try { document.querySelectorAll(SPANS).forEach(enseñar); } catch (e) {}
  };
  setInterval(repasar, 250);

  // el objetivo: <span><img coin> N</span>
  const obj0 = P.updateObjective;
  P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      const purse = document.querySelector('#ck-objective .ck-obj-purse');
      const sp = purse && purse.querySelector('span');
      if (sp && sp.querySelector('img') && this.story) { css(); sp.innerHTML = html(this.story.coins); }
    } catch (e) {}
    return r;
  };

  // la tienda: lo que tenés y los precios
  const tienda0 = P.renderShop;
  P.renderShop = function () {
    const r = tienda0.apply(this, arguments);
    try {
      const el = document.getElementById('ck-shop');
      if (el && this.story) {
        css();
        const purse = el.querySelector('.ck-shop-purse');
        if (purse) purse.innerHTML = 'Tenés ' + html(this.story.coins);
        el.querySelectorAll('button[data-id]').forEach(b => { const m = /^(\d+)\s*◉$/.exec(b.textContent.trim()); if (m) b.innerHTML = html(+m[1]); });
      }
    } catch (e) {}
    return r;
  };

  // "+N monedas" que saltan
  const flot0 = P.createFloatingText;
  P.createFloatingText = function (x, y, txt) {
    if (typeof txt === 'string') {
      const m = /^\+(\d+) monedas$/.exec(txt);
      if (m) arguments[2] = '+' + texto(+m[1]);
    }
    return flot0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ mejores premios en los lugares difíciles
  const TIER = [
    [/^ruins\./, 1.25],
    [/^ed_bosque_de_la_frontera\./, 1.5],
    [/^ed_tierras_orcas\./, 1.75],
    [/^ed_pueblo_orco\./, 2],
    [/^ed_fortaleza_orca\./, 2.5]
  ];
  const factor = zona => { for (const [re, k] of TIER) if (re.test(zona || '')) return k; return 1; };
  const der0 = P.onEnemyDefeated;
  P.onEnemyDefeated = function (enemy, def) {
    try {
      const k = factor(enemy && enemy.zone || (this.currentZoneKey && this.currentZoneKey()));
      if (k !== 1 && def && def.coins) arguments[1] = Object.assign({}, def, { coins: Math.max(1, Math.round(def.coins * k)) });
    } catch (e) {}
    return der0.apply(this, arguments);
  };

  window.CK_MONEDAS = { partir, html, texto, factor, TIER };
})();
