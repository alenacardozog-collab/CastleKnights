'use strict';
/* La princesa Elia te sigue hasta el castillo (15/11, nota 47 del dueño: "aparecemos afuera del pueblo orco con la princesa
   y la escoltamos al castillo mientras ella nos tira frases que no entendemos").
   Al salir del coliseo por la reja de abajo (ck_coliseo_historia.js), story.flags.escolta = true: Elia aparece al lado del
   héroe en cada mapa y lo sigue caminando (si queda lejos, lo alcanza). Cada tanto dice algo en una lengua que nadie
   entiende (desde que tocó el cristal rojo de Grushak), y a veces el héroe se queda pensando qué dijo.
   Al llegar al castillo (el patio, el salón o cualquier sala del castillo) se termina: "¡Padre!" y queda
   story.flags.escoltada = true. Si el héroe muere o sale al menú, al volver sigue la escolta.
   Borrar la línea de index.html lo saca (la historia sigue igual, sin la princesa caminando al lado). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const R = (a, b) => a + Math.random() * (b - a);
  const UNO = l => l[Math.floor(Math.random() * l.length)];
  const fl = s => (s.flags = s.flags || {});
  const zona = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const CASTILLO = /^castle\.|^ed_(patio_del_castillo|salon_del_trono|patio_de_armas|patio_armas|muralla|jardin_real|aposentos|biblioteca|cocina_real|herreria)/;
  const FRASES = [
    'Vel’ma sorath… ¿kenai durú?', 'Ashka mira tel, hó vennar!', 'Núm eloth… sar’ta im brael.', 'Oré, oré… thalassi ven duur.',
    '¡Kai! Ennoth vara, ennoth vara…', 'Sielva nar’koth… ¿ime tuvé?', 'Haaa… lunné, lunné ostra kel.', 'Draveth un sombral, Aldric… Aldric…'
  ];
  const HEROE = ['¿Qué dijo?', 'No entiendo ni una palabra…', '¿Eso es… élfico?', 'Desde lo del cristal habla raro.', 'Ya llegamos, princesa. Aguantá.'];
  const activa = S => { const s = S && S._gameMode === 'campaign' && S.story; return !!(s && fl(s).escolta && !fl(s).escoltada); };
  const quitar = S => { if (S._ckEsc) { try { S._ckEsc.sp.destroy(); } catch (e) {} S._ckEsc = null; } };

  const poner = S => {
    quitar(S);
    if (!activa(S) || !S.player || !S.textures.exists('npc8_villager')) return;
    const p = S.player, b = p.body, x = (b ? b.center.x : p.x) - 24, y = (b ? b.bottom : p.y) + 4;
    const sp = S.add.sprite(x, y, 'npc8_villager').setOrigin(0.5, 1).setScale(1.3).setDepth(y);
    if (S.anims.exists('npc8_idle')) sp.play('npc8_idle');
    S._ckEsc = { sp, habla: S.time.now + R(4000, 7000), camina: false };
    S.updateObjective && S.updateObjective();
    if (CASTILLO.test(zona(S))) S.time.delayedCall(900, () => llegar(S));
  };
  const llegar = S => {
    const s = S.story, f = s && fl(s); if (!f || f.escoltada || !S._ckEsc) return;
    f.escoltada = true; f.escolta = false; S.saveStory && S.saveStory();
    const E = window.CK_ESCENA, sp = S._ckEsc.sp;
    if (E && E.globo) E.globo(S, sp, '¡Padre! ¡Estoy en casa! …Por fin te entiendo, ¿no? Ese cristal me nubló la lengua.', 4200);
    S.time.delayedCall(4600, () => { if (S._ckEsc && S._ckEsc.sp === sp) { S.tweens.add({ targets: sp, alpha: 0, duration: 700, onComplete: () => quitar(S) }); } });
    S.updateObjective && S.updateObjective();
  };

  const a0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = a0 ? a0.apply(this, arguments) : undefined;
    try { const S = this; S.time.delayedCall(200, () => poner(S)); } catch (e) {}
    return r;
  };
  const v0 = P.onVillageShown;
  if (v0) P.onVillageShown = function () {
    const r = v0.apply(this, arguments);
    try { const S = this; S.time.delayedCall(200, () => poner(S)); } catch (e) {}
    return r;
  };
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      const S = this, E = S._ckEsc;
      if (!E) { if (activa(S) && S.player && !S._doorTransition && (S._ckEscN = (S._ckEscN || 0) + 1) % 60 === 0) poner(S); return r; }
      if (!activa(S) && !(S.story && fl(S.story).escoltada)) { quitar(S); return r; }
      const sp = E.sp; if (!sp.active || !S.player || !S.player.body) { S._ckEsc = null; return r; }
      const b = S.player.body, dt = Math.min(50, delta || 16) / 1000;
      // el lugar: un poco atrás del héroe (del lado contrario adonde mira)
      const atras = S.facingDirection === 'left' ? 1 : -1;
      const tx = b.center.x + atras * 22, ty = b.bottom + 2;
      const dx = tx - sp.x, dy = ty - sp.y, d = Math.hypot(dx, dy);
      if (d > 260) { sp.setPosition(tx, ty); }
      else if (d > 6) {
        const v = Math.min(d * 3.2, d > 60 ? 190 : 110) * dt;
        sp.x += dx / d * v; sp.y += dy / d * v;
        if (Math.abs(dx) > 1) sp.setFlipX(dx < 0);
        if (!E.camina && S.anims.exists('npc8_walk')) { sp.play('npc8_walk', true); E.camina = true; }
      } else if (E.camina) { E.camina = false; if (S.anims.exists('npc8_idle')) sp.play('npc8_idle', true); }
      sp.setDepth(sp.y - 0.5);
      // habla cada tanto (y a veces el héroe contesta)
      if (time > E.habla && !S.dialogOpen && !S._ckEscena) {
        E.habla = time + R(9000, 15000);
        const G = window.CK_ESCENA;
        if (G && G.globo) {
          G.globo(S, sp, UNO(FRASES), 2600, 40);
          if (Math.random() < 0.45) S.time.delayedCall(2900, () => S.player && G.globo(S, S.player, UNO(HEROE), 2200));
        }
      }
      if (CASTILLO.test(zona(S)) && !fl(S.story).escoltada) llegar(S);
    } catch (e) {}
    return r;
  };
  // el cartel de objetivo, mientras dura
  const obj0 = P.updateObjective;
  P.updateObjective = function () {
    const r = obj0.apply(this, arguments);
    try {
      if (!activa(this)) return r;
      const el = document.querySelector('#ck-objective .ck-obj-text');
      if (el) el.textContent = 'Escoltá a la princesa Elia hasta el castillo del Rey (te sigue de cerca)';
    } catch (e) {}
    return r;
  };
  window.CK_ESCOLTA = { activa, poner, quitar, FRASES };
})();
