'use strict';
/* Letra de píxel para los avisos y los textos que saltan (23/11, pedido del dueño: "quiero que cambies la tipografia de como
   sale cuando puedes interactuar con algo o cuando algo pasa q salen unas letras de colores azules rojos y eso… no me gusta
   como se ve hay q pulirlo"; de 10 ejemplos eligió la opción 3, "Pixuf · pixel limpio").
   - EL AVISO DE ABAJO ("T · Hablar con…", "T · Entrar…", "T · Usar la cama…": todos los que escriben en #ck-prompt): una
     pastilla oscura con esquinas de píxel, la tecla en un cuadrito ámbar y el texto en Pixuf, crema. El texto del aviso no se
     toca (los archivos lo comparan para prenderlo y apagarlo): se copia a dos atributos y se dibuja con ::before (la tecla)
     y ::after (lo demás). Queda un poco más arriba que el de antes (18 px) para no tapar el contador de flechas.
   - LOS TEXTOS QUE SALTAN (golpes, crítico, daño al héroe, bloqueo, estados, avisos de la historia; todo lo que pasa por
     createFloatingText): Pixuf en tamaños de su grilla (la letra es de 8 px: 8 para las palabras, 16 para los números y 24
     para los golpes grandes y dorados), sin negrita falsa, con borde oscuro y sombra dura hacia abajo. Los colores fuertes
     (rojo, azul, verde, celeste, amarillo...) pasan a una paleta apagada según su tono: rojo ladrillo, ámbar, oro claro,
     verde, celeste grisáceo y lila. Los adornos que la letra no tiene (✦, ⚔, ✓) se sacan.
   - Lo que se AGARRA (el aviso de la derecha, ck_textos.js) va con la misma letra.
   - CK_LETRA.pastilla(escena, x, y, tecla, texto): la misma pastilla del aviso, pero en el mapa (la usa el cartel de
     guardado, ck_totems.js, arriba del cartel).
   Va al final de index.html (después de ck_textos.js y de los demás que cambian createFloatingText). Borrar su línea vuelve a
   la letra de antes. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof Phaser === 'undefined') return;
  const P = MainGameScene.prototype;
  const FUENTE = 'Pixuf, monospace';
  const PAL = { blanco: '#ffffff', crema: '#f2e6cc', rojo: '#f26a58', ambar: '#ffb83d', oro: '#ffe08a', verde: '#a3dd6e', celeste: '#a8cbe8', lila: '#c9a6f0' };
  const OSCURO = '#0f0a06';
  try { document.fonts && document.fonts.load && document.fonts.load('16px Pixuf'); } catch (e) {}

  // ------------------------------------------------------------------ colores: cada tono fuerte a uno de la paleta
  const hex = c => {
    if (typeof c === 'number') return c;
    const m = /^#?([0-9a-f]{6})$/i.exec(String(c || '').trim()); return m ? parseInt(m[1], 16) : null;
  };
  const hsl = n => {
    const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
    return [h, s, l];
  };
  const colorDe = (c, num, txt) => {
    if (/CR[IÍ]TICO/i.test(txt)) return PAL.ambar;
    const n = hex(c); if (n === null) return num ? PAL.blanco : PAL.crema;
    const [h, s, l] = hsl(n);
    if (s < 0.18 || l > 0.94) return num ? PAL.blanco : PAL.crema;
    if (h >= 340 || h < 18) return PAL.rojo;
    if (h < 68) return l > 0.74 ? PAL.oro : PAL.ambar;
    if (h < 165) return PAL.verde;
    if (h < 258) return PAL.celeste;
    return PAL.lila;
  };
  const limpiar = t => String(t).replace(/[✦✓]|⚔️?|️/g, '').replace(/\s{2,}/g, ' ').trim();

  // ------------------------------------------------------------------ los textos que saltan
  const pixelar = (t, msg) => {
    if (!t || t._ckPx) return; t._ckPx = true;
    const m = limpiar(msg), num = /^[-+−]?\d+$/.test(m);
    if (m !== t.text) t.setText(m);
    const col = colorDe(t.style && t.style.color, num, m);
    const grande = num && (col === PAL.ambar || col === PAL.oro || Math.abs(parseInt(m.replace('−', '-'), 10)) >= 10);
    t.setFontFamily(FUENTE); t.setFontStyle('normal');
    t.setFontSize(num ? (grande ? 24 : 16) : 8);
    t.setStroke(OSCURO, num ? (grande ? 6 : 4) : 3);
    t.setShadow(0, num ? 2 : 1, OSCURO, 0, true, true);
    if (t.setLetterSpacing) t.setLetterSpacing(0);
    t.setColor(col);
    if (t.setResolution) t.setResolution(4);
  };
  const instalar = () => {
    const f0 = P.createFloatingText;
    P.createFloatingText = function (x, y, msg) {
      const antes = this.children ? this.children.list.length : 0;
      const r = f0.apply(this, arguments);
      try {
        const L = this.children.list;
        for (let i = L.length - 1; i >= antes && i >= 0; i--) { const o = L[i]; if (o && o.type === 'Text' && !o._ckPx) pixelar(o, o.text); }
      } catch (e) {}
      return r;
    };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar); else instalar();

  // ------------------------------------------------------------------ el aviso de abajo (#ck-prompt) y lo que se agarra
  const css = `
html body #ck-prompt.ckpx { font-size: 0 !important; color: transparent !important; text-shadow: none !important; border: 0 !important; border-image: none !important;
  border-radius: 0 !important; background: #1a1410 !important; padding: 5px 11px 5px 5px !important; display: flex !important; align-items: center; gap: 9px;
  white-space: nowrap; line-height: 1; translate: 0 -18px; box-shadow: 0 -2px 0 #4b3a28, 0 2px 0 #4b3a28, -2px 0 0 #4b3a28, 2px 0 0 #4b3a28, 0 6px 0 rgba(0, 0, 0, .5) !important; }
html body #ck-prompt.ckpx::before { content: attr(data-k); display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; min-width: 22px; height: 22px;
  padding: 0 4px 3px; background: #f0b44a; color: #1a1008; box-shadow: inset 0 -3px 0 #a86f1c; font: 16px/1 Pixuf, monospace; -webkit-font-smoothing: none; }
html body #ck-prompt.ckpx[data-k=""]::before { display: none; }
html body #ck-prompt.ckpx::after { content: attr(data-l); font: 16px/1 Pixuf, monospace; color: #f2e6cc; -webkit-font-smoothing: none; }
html body #ck-recoge .it { font-family: Pixuf, monospace !important; font-weight: 400 !important; font-size: 16px !important; letter-spacing: 0 !important;
  text-shadow: 0 2px 0 #000 !important; -webkit-font-smoothing: none; }
`;
  const estilo = () => { if (!document.getElementById('ck-letra-pixel-css')) { const s = document.createElement('style'); s.id = 'ck-letra-pixel-css'; s.textContent = css; document.head.appendChild(s); } };
  const TECLA = /^([A-ZÑ0-9]|Esc|Espacio|Enter|Shift|Tab)\s*·\s*(.+)$/;
  const copiar = el => {
    const t = (el.textContent || '').trim(), m = TECLA.exec(t);
    const k = m ? m[1] : '', l = m ? m[2] : t;
    if (el.getAttribute('data-k') !== k) el.setAttribute('data-k', k);
    if (el.getAttribute('data-l') !== l) el.setAttribute('data-l', l);
  };
  let vigilado = null;
  const vigilar = () => {
    const el = document.getElementById('ck-prompt');
    if (!el) return;
    if (el === vigilado) return;
    estilo(); vigilado = el;
    el.classList.add('ckpx'); copiar(el);
    new MutationObserver(() => copiar(el)).observe(el, { childList: true, characterData: true, subtree: true });
  };
  // (#ck-prompt lo arma la historia al empezar: se busca de a ratos)
  setInterval(vigilar, 700);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { estilo(); vigilar(); }); else { estilo(); vigilar(); }

  // ------------------------------------------------------------------ la pastilla en el mapa (cartel de guardado)
  // x, y: el centro de abajo de la pastilla (en el mundo). Devuelve un contenedor (setAlpha, setDepth, destroy).
  const pastilla = (S, x, y, tecla, texto) => {
    const c = S.add.container(x, y);
    const lab = S.add.text(0, 0, texto, { fontFamily: FUENTE, fontSize: '8px', color: PAL.crema }).setResolution(4).setOrigin(0, 1);
    const kt = S.add.text(0, 0, tecla, { fontFamily: FUENTE, fontSize: '8px', color: '#1a1008' }).setResolution(4).setOrigin(0.5, 1);
    const K = 10, PADL = 2, GAP = 3, PADR = 4, H = 12;
    const w = Math.ceil(PADL + K + GAP + lab.width + PADR), x0 = -Math.round(w / 2), y0 = -H - 2;
    const g = S.add.graphics();
    g.fillStyle(0x000000, 0.5).fillRect(x0, y0 + 2, w, H);                       // sombra dura
    g.fillStyle(0x4b3a28, 1).fillRect(x0 + 1, y0 - 1, w - 2, H + 2).fillRect(x0 - 1, y0 + 1, w + 2, H - 2);   // borde con esquinas de píxel
    g.fillStyle(0x1a1410, 1).fillRect(x0, y0, w, H);                                // fondo
    g.fillStyle(0xa86f1c, 1).fillRect(x0 + PADL, y0 + 1, K, K);                      // la tecla
    g.fillStyle(0xf0b44a, 1).fillRect(x0 + PADL, y0 + 1, K, K - 2);
    kt.setPosition(x0 + PADL + K / 2, y0 + 1 + K - 2);
    lab.setPosition(x0 + PADL + K + GAP, y0 + H - 2);
    c.add([g, kt, lab]);
    return c;
  };

  window.CK_LETRA = { FUENTE, PAL, colorDe, pixelar, pastilla };
})();
