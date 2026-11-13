'use strict';
/* Textos flotantes prolijos (11/11, pedido del dueño: "cuando agarramos algún objeto que no salga la tipografía esa rara; la del
   daño y demás, ponela más profesional").
   Se pone por fuera de todos los createFloatingText (se instala al final, cuando ya cargó todo):
   - LO QUE AGARRÁS (pociones, vida, monedas, experiencia, llaves, libros, cristales): ya no sale una palabra gigante en el mapa,
     sino un aviso chico a la derecha, arriba de los objetos, con su ícono y el nombre bien escrito ("Poción roja ×2",
     "+15 monedas", "+40 de experiencia", "Llave de la capilla"). Si agarrás varias iguales seguidas, se suman en el mismo aviso.
   - EL DAÑO: números nítidos (se dibujan a 3× para que no se vean borrosos al agrandar la pantalla), con contorno oscuro, sombra,
     un saltito al aparecer y un leve corrimiento para que dos golpes seguidos no se pisen. Los críticos, más grandes y dorados.
   - LOS GRITOS Y ESTADOS (¡BLOQUEO!, ¡CRÍTICO!, ¡TRAMPA!…): más chicos y espaciados, con la misma letra del juego.
   Borrar su línea de index.html vuelve a los textos de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const IC = () => window.CK_ICONOS_HEROE || {};
  const cap = t => { t = String(t).toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };
  const sinEmoji = t => String(t).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]️?/gu, '').replace(/[✦◆]/g, '').trim();

  // ------------------------------------------------------------------ qué es cada mensaje
  const COSAS = [
    [/^\+\s*(\d+)\s+POCI[ÓO]N(ES)?$/i, n => ({ k: 'pocion', n: +n, txt: c => 'Poción roja' + (c > 1 ? ' ×' + c : ''), ic: 'pocion' })],
    [/^\+\s*(\d+)\s+ELIXIR(ES)?$/i, n => ({ k: 'elixir', n: +n, txt: c => 'Elixir dorado' + (c > 1 ? ' ×' + c : ''), ic: 'elixir' })],
    [/^\+\s*(\d+)\s+ANTORCHAS?$/i, n => ({ k: 'antorcha', n: +n, txt: c => 'Antorcha' + (c > 1 ? ' ×' + c : ''), ic: 'antorcha' })],
    [/^\+\s*(\d+)\s+VIDA$/i, n => ({ k: 'vida', n: +n, txt: c => '+' + c + ' de vida', ic: 'corazon' })],
    [/^\+\s*1\s+CORAZ[ÓO]N M[ÁA]XIMO$/i, () => ({ k: 'corazonmax', n: 1, txt: () => '+1 corazón máximo', ic: 'corazon' })],
    [/^\+\s*(\d+)\s+monedas?$/i, n => ({ k: 'monedas', n: +n, txt: c => '+' + c + ' monedas', moneda: true })],
    [/^\+\s*(\d+)\s+(exp|xp|experiencia)$/i, n => ({ k: 'xp', n: +n, txt: c => '+' + c + ' de experiencia', xp: true })],
    [/^¡?VIDA COMPLETA!?$/i, () => ({ k: 'vidacompleta', n: 1, txt: () => 'Vida completa', ic: 'corazon' })],
    [/^🗝️?\s*(.+)$/u, t => ({ k: 'llave:' + t, n: 1, txt: () => cap(sinEmoji(t)), ic: 'llave' })],
    [/^📖\s*(.+)$/u, t => ({ k: 'libro:' + t, n: 1, txt: () => cap(sinEmoji(t)), ic: 'libro' })],
    [/^◆\s*(CRISTAL .+?)\s*◆$/u, t => ({ k: 'cristal:' + t, n: 1, txt: () => cap(t), ic: 'cristal' })],
    [/^¡LA LLAVE DE LA JAULA!$/i, () => ({ k: 'llavejaula', n: 1, txt: () => 'Llave de la jaula', ic: 'llave' })]
  ];
  COSAS.push([/^Cofre (\d+) de (\d+)$/i, (n, m) => ({ k: 'cofre', n: 1, txt: () => 'Cofre ' + n + ' de ' + m, ic: 'cofre' })]);
  const una = m => { for (const [re, f] of COSAS) { const r = m.match(re); if (r) return f(r[1], r[2]); } return null; };
  // un mensaje puede traer varias cosas juntas ("+23 monedas · +1 POCIÓN"): sólo si TODAS se entienden
  const cosa = msg => {
    const partes = String(msg).split(/\s+·\s+/).map(x => x.trim()).filter(Boolean);
    const L = partes.map(una);
    return L.length && L.every(Boolean) ? L : null;
  };

  // ------------------------------------------------------------------ el aviso de lo que agarrás (DOM, arriba de los objetos)
  const css = `
#ck-recoge { position: absolute; right: 14px; bottom: 140px; z-index: 9100; display: flex; flex-direction: column-reverse; align-items: flex-end; gap: 6px; pointer-events: none; }
#ck-recoge .it { display: flex; align-items: center; gap: 9px; padding: 4px 14px 5px 6px; min-width: 150px; justify-content: flex-start;
  background: linear-gradient(90deg, rgba(14,10,12,.0), rgba(14,10,12,.86) 18%, rgba(14,10,12,.9)); border-right: 3px solid var(--ckr-c, #e2b04a);
  font-family: var(--ck2-f, 'CK Grenze', Grenze, serif); font-weight: 700; font-size: 17px; color: #f6ecd8; text-shadow: 0 2px 0 #000; letter-spacing: .3px;
  animation: ckrEntra .28s cubic-bezier(.2,1.3,.4,1) both; transition: opacity .4s, transform .4s; }
#ck-recoge .it.va { opacity: 0; transform: translateX(24px); }
#ck-recoge .it.mas { animation: ckrMas .3s ease-out; }
#ck-recoge .it .ic { position: relative; flex: 0 0 30px; width: 30px; height: 30px; background: #1f1712; border: 2px solid #000; box-shadow: inset 0 0 0 1px rgba(255,236,200,.25); }
#ck-recoge .it .ic img { position: absolute; inset: 2px; width: 22px; height: 22px; image-rendering: pixelated; }
#ck-recoge .it .ic.moneda::after { content: ''; position: absolute; inset: 6px; border-radius: 50%; border: 2px solid #1b0f0a; background: radial-gradient(circle at 40% 35%, #fff3b0 0 20%, #f0c040 22% 60%, #9a6a10 62%); }
#ck-recoge .it .ic.xp::after { content: '✦'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #9fd0ff; font-size: 18px; text-shadow: 0 0 6px #5aa0ff; }
#ck-recoge .it .ic.llave::after { content: ''; position: absolute; left: 6px; top: 7px; width: 7px; height: 7px; border: 3px solid #f0c040; border-radius: 50%; box-shadow: 1px 1px 0 #000; }
#ck-recoge .it .ic.llave::before { content: ''; position: absolute; left: 14px; top: 12px; width: 11px; height: 3px; background: #f0c040; box-shadow: 6px 3px 0 -0px #f0c040, 1px 1px 0 #000; }
#ck-recoge .it .ic.cofre::after { content: ''; position: absolute; left: 5px; top: 8px; width: 16px; height: 11px; background: linear-gradient(180deg, #a86a2a 0 45%, #7a4a1a 45%); border: 2px solid #2a1608; box-shadow: inset 0 3px 0 -1px #e2b04a; }
#ck-recoge .it .ic.cristal::after { content: ''; position: absolute; left: 8px; top: 5px; width: 10px; height: 16px; background: linear-gradient(135deg, #d8ffe8, #3ad07a 50%, #126a3a); clip-path: polygon(50% 0, 100% 35%, 50% 100%, 0 35%); }
@keyframes ckrEntra { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: none; } }
@keyframes ckrMas { 40% { transform: scale(1.08); filter: brightness(1.4); } }
body.ck-cine #ck-recoge, body.ck-escena #ck-recoge { opacity: 0; }
body.ck-movil #ck-recoge { bottom: auto; top: 150px; right: 8px; transform: scale(.8); transform-origin: 100% 0; }
`;
  let caja = null;
  const vivos = {};
  const avisar = c => {
    if (!document.getElementById('ckr-css')) { const s = document.createElement('style'); s.id = 'ckr-css'; s.textContent = css; document.head.append(s); }
    const host = document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
    if (!caja) { caja = document.createElement('div'); caja.id = 'ck-recoge'; }
    if (caja.parentElement !== host) host.appendChild(caja);
    let v = vivos[c.k];
    if (v && v.el.isConnected && !v.el.classList.contains('va')) {
      v.n += c.n; v.el.querySelector('span').textContent = c.txt(v.n);
      v.el.classList.remove('mas'); void v.el.offsetWidth; v.el.classList.add('mas');
      clearTimeout(v.t);
    } else {
      const el = document.createElement('div'); el.className = 'it';
      const I = IC(), img = c.ic && !/^(llave|cristal|cofre)$/.test(c.ic) && I[c.ic] ? `<img src="${I[c.ic]}" alt="">` : '';
      el.innerHTML = `<div class="ic${c.moneda ? ' moneda' : ''}${c.xp ? ' xp' : ''}${c.ic === 'llave' ? ' llave' : ''}${c.ic === 'cristal' ? ' cristal' : ''}${c.ic === 'cofre' ? ' cofre' : ''}">${img}</div><span></span>`;
      el.style.setProperty('--ckr-c', c.moneda ? '#e2b04a' : c.xp ? '#7fb0ff' : c.ic === 'corazon' ? '#e0483a' : c.ic === 'pocion' ? '#e0483a' : '#c9a55a');
      v = vivos[c.k] = { el, n: c.n };
      el.querySelector('span').textContent = c.txt(v.n);
      caja.appendChild(el);
      while (caja.children.length > 5) caja.firstChild.remove();
    }
    v.t = setTimeout(() => { v.el.classList.add('va'); setTimeout(() => { v.el.remove(); if (vivos[c.k] === v) delete vivos[c.k]; }, 420); }, 2300);
  };

  // ------------------------------------------------------------------ el estilo de los textos que quedan en el mapa
  const RES = 4;
  const recientes = [];
  const estilizar = (S, t, msg, x, y) => {
    const m = String(msg).trim(), num = /^[-+]?\d+$/.test(m), grito = !num;
    const color = t.style && t.style.color;
    t.setResolution && t.setResolution(RES);
    t.setFontFamily("'CK Grenze', Grenze, Georgia, serif");
    t.setFontStyle('bold');
    if (num) {
      const n = Math.abs(+m), grande = n >= 3;
      t.setFontSize(grande ? 16 : 13);
      t.setStroke('#140a08', 4);
    } else {
      const largo = m.length > 18;
      t.setFontSize(largo ? 9 : 10);
      t.setStroke('#140a08', 3);
      if (t.setLetterSpacing) t.setLetterSpacing(/^[¡A-ZÁÉÍÓÚÑ !¿?·-]+$/.test(m) ? 0.8 : 0.2);
    }
    t.setShadow(0, 2, 'rgba(0,0,0,.55)', 0, true, true);
    if (color) t.setColor(color);
    // que dos textos seguidos en el mismo lugar no se pisen
    const now = S.time.now;
    for (let i = recientes.length - 1; i >= 0; i--) if (now - recientes[i].t > 380 || !recientes[i].o.active) recientes.splice(i, 1);
    const cerca = recientes.filter(r => Math.abs(r.x - x) < 40 && Math.abs(r.y - y) < 18).length;
    if (cerca) { t.y -= cerca * (num ? 14 : 18); if (num) t.x += (cerca % 2 ? 12 : -12); }
    recientes.push({ x, y, t: now, o: t });
    // el movimiento: sube rápido y frena, se queda nítido un rato y recién después se apaga (antes se iba apagando desde el arranque)
    S.tweens.killTweensOf(t);
    t.setAlpha(1).setScale(num ? 1.4 : 0.85);
    const y0 = t.y;
    S.tweens.add({ targets: t, scale: 1, duration: num ? 180 : 160, ease: 'Back.easeOut' });
    S.tweens.add({ targets: t, y: y0 - (num ? 22 : 18), duration: 620, ease: 'Cubic.easeOut' });
    S.tweens.add({ targets: t, alpha: 0, delay: num ? 480 : 900, duration: 260, onComplete: () => t.destroy() });
  };

  const instalar = () => {
    const f0 = P.createFloatingText;
    P.createFloatingText = function (x, y, msg, color) {
      try {
        const c = cosa(msg);
        if (c && this._gameMode) { c.forEach((x, i) => setTimeout(() => avisar(x), i * 140)); return null; }
      } catch (e) {}
      const antes = this.children ? this.children.list.length : 0;
      const r = f0.apply(this, arguments);
      try {
        const L = this.children.list;
        for (let i = L.length - 1; i >= antes && i >= 0; i--) {
          const o = L[i];
          if (o && o.type === 'Text' && !o._ckTx) { o._ckTx = true; estilizar(this, o, o.text, x, y); }
        }
      } catch (e) {}
      return r;
    };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar); else instalar();
  window.CK_TEXTOS = { avisar, cosa };
})();
