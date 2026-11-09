'use strict';
/* El monolito del claro (08/11, pedido del dueño: "en el camino a la tierra de los orcos hay un espacio del mapa donde
   parece que brilla el sol en un círculo, como apuntando un lugar, al norte de ese mapa: poné un monolito ahí acorde a la
   estética y paleta de color, que no esté activo, pero cuando pasemos los 3 primeros capítulos ese sea el final y que
   active un desastre en el reino; eso lo escribo más adelante cuando escriba el lore").
   - Está en el Bosque de la Frontera, en el claro de luz del noroeste (donde termina el sendero). Arte de PixelLab
     recoloreado con la paleta de ese suelo (ck_monolito_arte.js). No se atraviesa (tiene su pie en las colisiones del mapa).
   - HOY ESTÁ DORMIDO: con T se lo mira y el héroe dice algo corto. No hace nada más.
   - PARA EL FINAL (cuando exista el Capítulo 3): la historia lo despierta con CK_MONOLITO.despertar(). Cambia al dibujo
     con las runas encendidas, tiembla la pantalla, da una luz violeta y queda guardado en la partida
     (story.flags.monolito = 'despierto'). Avisa con el evento 'ck-monolito' en window, para que el desastre del reino
     (el lore que falta) se enganche ahí sin tocar este archivo. También se despierta solo si la partida tiene
     story.flags.cap3_fin (la marca que va a poner el final del Capítulo 3).
   Probar: ?ck_monolito=despierto lo muestra despierto (sin guardar). Borrar la línea de index.html lo saca (y su pie). */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_MONOLITO_ARTE) return;
  const P = MainGameScene.prototype, D = window.EDITOR_DATA || {}, ARTE = window.CK_MONOLITO_ARTE;
  const MAPA = 'bosque_de_la_frontera', ZONA = 'ed_' + MAPA + '.main';
  const X = 150, Y = 120;          // la base, en coordenadas del mapa (centro del claro)
  const PIE = [X - 14, Y - 10, 28, 10];
  const CERCA = 46;
  const vista = (/[?&]ck_monolito=(\w+)/.exec(location.search) || [])[1];
  const MIRAR = [
    'Una piedra más vieja que el Roble. Tiene runas gastadas que nadie sabe leer.',
    'Está fría, aunque el sol le da de lleno. Y no se oye ni un pájaro alrededor.',
    'Las marcas parecen apuntar al cielo. Mejor no tocarla… todavía.'
  ];

  // el pie en las colisiones del mapa (así también lo esquivan las bestias y no caen cofres encima)
  const m = D.mapas && D.mapas[MAPA];
  if (m) { m.cols = m.cols || []; if (!m.cols.some(c => c[0] === PIE[0] && c[1] === PIE[1])) m.cols.push(PIE.slice()); }

  const despierto = S => vista === 'despierto' || !!(S.story && S.story.flags && (S.story.flags.monolito === 'despierto' || S.story.flags.cap3_fin));
  const texturas = S => {
    ['dormido', 'despierto'].forEach(k => { if (!S.textures.exists('ck_monolito_' + k) && !texturas['c' + k]) { texturas['c' + k] = 1; S.textures.addBase64('ck_monolito_' + k, ARTE[k]); } });
  };
  const listo = S => S.textures.exists('ck_monolito_dormido') && S.textures.exists('ck_monolito_despierto');

  const poner = S => {
    if (S._ckMono) { try { S._ckMono.destroy(); } catch (e) {} S._ckMono = null; }
    if (!S.currentZoneKey || S.currentZoneKey() !== ZONA || !S.currentInterior) return;
    texturas(S);
    if (!listo(S)) { S.time.delayedCall(120, () => poner(S)); return; }
    const a = S.currentInterior.area;
    const sp = S.add.image(a.x + X, a.y + Y + 2, despierto(S) ? 'ck_monolito_despierto' : 'ck_monolito_dormido').setOrigin(0.5, 1);
    sp.setDepth(Math.round(a.y + Y));
    S._ckMono = sp;
  };
  const a0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = a0.apply(this, arguments);
    try { poner(this); } catch (e) { console.warn('[monolito]', e); }
    return r;
  };

  // luz: despierto, una luz violeta que late (de noche se ve de lejos)
  const instalarLuz = () => {
    const L = window.CK_LUZ; if (!L || instalarLuz.ok) return; instalarLuz.ok = true;
    L.fuente((S, out) => {
      const sp = S._ckMono; if (!sp || !sp.active || sp.texture.key !== 'ck_monolito_despierto') return;
      const late = 0.8 + 0.2 * Math.sin(S.time.now / 520);
      out.push({ x: sp.x, y: sp.y - 40, c: [190, 90, 255], r: 120, f: 0.95 * late, titila: 1 });
    });
  };

  // ------------------------------------------------------------------ mirarlo con T
  const cerca = S => { const sp = S._ckMono, p = S.player; return sp && sp.active && p && p.body && Math.hypot(sp.x - p.body.center.x, sp.y - p.body.bottom) < CERCA; };
  const i0 = P.interact;
  P.interact = function () {
    try {
      if (!this.dialogOpen && !this._overlay && cerca(this)) {
        const t = despierto(this) ? 'Las runas arden. Algo se despertó… y no es bueno.' : MIRAR[((this._ckMonoN = (this._ckMonoN || 0) + 1) - 1) % MIRAR.length];
        if (window.CK_ESCENA && CK_ESCENA.globo) CK_ESCENA.globo(this, this.player, t, 3600, 50);
        else this.createFloatingText(this.player.x, this.player.y - 50, t, 0xcbd5e1);
        return;
      }
    } catch (e) {}
    return i0.apply(this, arguments);
  };
  const us0 = P.updateStory;
  P.updateStory = function () {
    const r = us0.apply(this, arguments);
    try {
      instalarLuz();
      const pr = document.getElementById('ck-prompt'), c = cerca(this) && !this.dialogOpen;
      if (pr && c && !pr.classList.contains('on')) { pr.textContent = 'T · Mirar el monolito'; pr.classList.add('on'); this._ckMonoCartel = true; }
      else if (pr && !c && this._ckMonoCartel) { this._ckMonoCartel = false; if (pr.textContent === 'T · Mirar el monolito') pr.classList.remove('on'); }
      // si la partida ya lo marcó (final del Capítulo 3) y se ve dormido, se despierta
      const sp = this._ckMono;
      if (sp && sp.active && despierto(this) && sp.texture.key === 'ck_monolito_dormido') sp.setTexture('ck_monolito_despierto');
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ para el final
  const despertar = () => {
    const S = window.activeGameScene || (window.game && game.scene.scenes.find(s => s.startCampaign));
    if (!S || !S.story) return false;
    S.story.flags = S.story.flags || {};
    const ya = S.story.flags.monolito === 'despierto';
    S.story.flags.monolito = 'despierto';
    if (S.saveStory) S.saveStory();
    const sp = S._ckMono;
    if (sp && sp.active) {
      sp.setTexture('ck_monolito_despierto');
      S.cameras.main.shake(900, 0.008);
      if (window.CK_LUZ) CK_LUZ.destello([200, 120, 255], 0.7, 700);
      try { if (typeof sfx !== 'undefined') sfx.fx('thunder_epic', 0.5, { rate: 0.5 }); } catch (e) {}
    }
    if (!ya) window.dispatchEvent(new CustomEvent('ck-monolito', { detail: { estado: 'despierto', escena: S } }));
    return true;
  };
  window.CK_MONOLITO = { MAPA, ZONA, X, Y, PIE, despertar, despierto: () => { const S = window.activeGameScene; return !!(S && despierto(S)); } };
})();
