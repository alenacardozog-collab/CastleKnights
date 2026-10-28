'use strict';
/* Música y sonidos nuevos (24/10, pedido del dueño; hechos con ElevenLabs).
   - Camino al Castillo: tema propio (assets/Music/camino.mp3, laúd y flauta, 72 s en bucle). Antes sonaba la canción de la aldea.
   - Patio de armas nuevo: el tema del castillo (antes también la de la aldea).
   - Sonidos nuevos en assets/audio/sfx/: ck_antorcha_on / _off (antorcha), ck_jarras (brindis en la taberna), ck_inicio (espada
     al abrir el menú de la portada), ck_explosion, ck_grito, ck_paso, ck_nova, ck_dagas (habilidades nuevas) y ck_habilidad
     (al aprender un nodo). Los archivos que los usan ya los piden por nombre; si falta uno, suena el de antes.
   Borrar la línea de index.html vuelve a la música de antes (los sonidos siguen, son archivos sueltos). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const POR_MAPA = { 'ed_camino_al_castillo.main': 'camino', 'ed_patio_armas_nuevo.main': 'castle' };
  const m0 = P.musicForZone;
  P.musicForZone = function (key) {
    const base = m0.apply(this, arguments);
    if (base === 'boss') return base;
    return POR_MAPA[key] || base;
  };
  // los temas nuevos no tienen versión sintetizada: si el archivo terminó de cargar después de entrar, arrancan acá
  let acc = 0;
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      const ahora = Date.now();
      if (ahora - acc < 800) return r;
      acc = ahora;
      const t = this._zoneMusic;
      if (this._gameMode === 'campaign' && t === 'camino' && typeof music !== 'undefined' && music.audioElements) {
        const el = music.audioElements[t];
        if (el && el.readyState >= 3 && music.currentTrack !== t) this.playZoneMusic(t);
      }
    } catch (e) {}
    return r;
  };
  window.CK_MUSICA_NUEVA = { POR_MAPA };
})();
