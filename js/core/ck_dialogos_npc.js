'use strict';
/* Lo que dicen los NPC (10/11, pedido del dueño: "que los diálogos de los NPC que saltan sean los de la burbuja nueva, y que
   cuando interactuás con ellos sea como antes, donde sale su foto"; "el Capitán Bruno es el que nos entrena").
   - SOLOS, al pasar cerca (los carteles que saltan: la gente del castillo, los aldeanos, los guardias, el Rey, los que
     comentan algo en los mapas): en vez de la línea chica de abajo o de nada, una burbuja de ck_globos.js sobre la cabeza
     del que habla, con su "pop". Cada uno habla como mucho cada 9 s, y sólo si el héroe está cerca.
     Los avisos que no salen de una persona (▲ Entrar, salidas, comentarios de objetos) siguen en la línea de abajo.
   - CON T (interactuar): el cuadro de diálogo de antes, con la foto (ck_ui_sutil.js ya no lo pasa a globo).
   - El caballero que entrena en el Patio de Armas se llama Capitán Bruno también cuando se le habla con T.
   Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const SIEMPRE = /^[-+]\d|VIDA|BLOQUE|NIVEL|exp\b|monedas|LLAVE|CÓDICE|OBJETIVO|CORAZÓN|PARADA|CARGA|^[▲▼◀▶]/;
  const GENTE = /villager|^g_|^npc|king|captain|capitan|soldier|knight|guard|priest|monk|merchant|mercader|wizard|swordsman|archer|tabernero|rosa|_idle$|_walk$/i;
  const ESPERA = 9000;
  const limpio = s => String(s || '').replace(/\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}]️?/gu, '').replace(/^[^:]{2,24}: /, '').trim();

  // el personaje que está parado donde sale el cartel (el cartel se pone unos 40-60 px arriba de sus pies)
  const quien = (S, x, y) => {
    const L = S.children && S.children.list; if (!L) return null;
    let mejor = null, dm = 1e9;
    for (let i = 0; i < L.length; i++) {
      const o = L[i];
      if (!o || !o.active || !o.visible || o.alpha < 0.3 || o === S.player || (o.type !== 'Sprite' && o.type !== 'Image')) continue;
      const k = o.texture && o.texture.key;
      if (!k || !GENTE.test(k) || /^ed_|^fx_|^ck_antorcha|_arma|_proj|_bolt/.test(k)) continue;
      if (S.enemies && S.enemies.contains && S.enemies.contains(o)) continue;
      const dx = Math.abs(o.x - x), dy = o.y - y;
      if (dx > 34 || dy < 10 || dy > 90) continue;
      const d = dx + Math.abs(dy - 50) * 0.5;
      if (d < dm) { dm = d; mejor = o; }
    }
    return mejor;
  };
  const instalar = () => {
    const E = window.CK_ESCENA;
    const f0 = P.createFloatingText;
    P.createFloatingText = function (x, y, msg) {
      const modo = this._ckCartel;
      if (modo && E && E.globo && !SIEMPRE.test(String(msg)) && this.player && !this.dialogOpen) {
        try {
          const sp = quien(this, x, y);
          if (sp) {
            const now = this.time.now;
            const lejos = Phaser.Math.Distance.Between(this.player.x, this.player.y, sp.x, sp.y) > 150;
            if (lejos || (sp._ckDijo && now - sp._ckDijo < ESPERA)) return null;
            sp._ckDijo = now;
            const t = limpio(msg);
            if (t) E.globo(this, sp, t, 1400 + t.length * 40);
            return null;
          }
        } catch (e) { console.warn('[dialogos]', e); }
      }
      return f0.apply(this, arguments);
    };
  };
  // después de ck_sin_carteles.js (que también se instala al terminar de cargar), así la burbuja va primero
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instalar); else instalar();

  // ------------------------------------------------------------------ el Capitán Bruno, el que entrena
  const enPatioArmas = S => {
    const c = S.currentInterior, k = c && c.building && c.building.kind;
    return k === 'ed_patio_de_armas' || (k === 'castle' && c.areaName === 'training');
  };
  const n0 = P.nameForTexture;
  P.nameForTexture = function (key) {
    if (key === 'g_knight_idle' && enPatioArmas(this)) return 'Capitán Bruno';
    return n0.apply(this, arguments);
  };
  window.CK_DIALOGOS_NPC = { quien };
})();
