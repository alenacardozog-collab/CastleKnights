'use strict';
/* Música que sigue el momento (10/11, pedido del dueño: "música y sonidos a las situaciones que lo ameriten, que sigan la
   emoción del momento: cosas tranquilas, momentos de batalla con tambores orcos, reverberación para la cueva…").
   Temas nuevos de ElevenLabs en assets/Music/ (en bucle sin corte, misma sonoridad que los de antes):
   - orcos: tambores tribales lentos (Tierras Orcas, Pueblo, Fortaleza, Sendero, Afueras y el Claro de las Bestias);
   - cueva: casi sin música, un pulso grave con eco (la Cueva de Garra Negra);
   - coliseo: tambores y el ritmo del público orco (el Coliseo);
   - batalla_orca: tambores de guerra y cuernos; entra ENCIMA de cualquier lugar orco cuando hay pelea;
   - combate: cuerdas y timbales; entra cuando hay pelea en las tierras de los humanos;
   - fiesta y bosque_norte: listos para la fiesta del prólogo y el bosque del Nigromante (los usa la historia nueva).
   "Hay pelea" = dos o más bestias persiguiendo al héroe a menos de 380 px (o una grande); la música de batalla queda
   6 s después de la última, así no salta a cada rato. Los jefes siguen con su tema. Los cambios van con el fundido de
   siempre. La cueva y el coliseo, además, tienen su eco propio (ck_sonido.js: salas "cueva" y "arena").
   Borrar la línea de index.html vuelve a la música de antes. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const MAPA = {
    tierras_orcas: 'orcos', pueblo_orco: 'orcos', fortaleza_orca: 'orcos', patio_fortaleza_orca: 'orcos', sendero_orco: 'orcos',
    afueras_orcas: 'orcos', claro_de_las_bestias: 'orcos', cueva_galerias: 'cueva', coliseo_orco: 'coliseo'
  };
  const ORCO = /orc|tierras_orcas|claro_de_las_bestias|coliseo/;
  const NUEVOS = ['orcos', 'cueva', 'coliseo', 'batalla_orca', 'combate', 'fiesta', 'bosque_norte'];
  const QUEDA = 6000, RADIO = 380;
  window.CK_SALA_ED = Object.assign(window.CK_SALA_ED || {}, { ed_cueva_galerias: 'cueva', ed_coliseo_orco: 'arena' });

  const idDe = key => {
    const m = /^ed_([a-z0-9_]+)\./.exec(key || '');
    return m ? m[1] : '';
  };
  const enPelea = S => {
    if (!S.enemies || !S.player || S._gameMode !== 'campaign') return false;
    const p = S.player, now = S.time.now;
    let n = 0;
    S.enemies.getChildren().forEach(e => {
      if (!e.active || e.isDead || e.state !== 'chase') return;
      if (Math.hypot(e.x - p.x, e.y - p.y) > RADIO) return;
      n += e.def && (e.def.boss || (e.scale || 1) > 1.3) ? 2 : 1;
    });
    if (n >= 2) S._ckPeleaHasta = now + QUEDA;
    return now < (S._ckPeleaHasta || 0);
  };
  // los temas nuevos se cargan de entrada, así cuando hace falta ya están listos
  const precargar = S => {
    if (typeof music === 'undefined' || !music.audioElements) return;
    NUEVOS.forEach(n => {
      if (music.audioElements[n] !== undefined) return;
      const a = new Audio('assets/Music/' + n + '.mp3');
      a.loop = true; a.preload = 'auto'; a.volume = music.enabled ? music.volume : 0;
      a.addEventListener('error', () => { if (music.audioElements[n] === a) music.audioElements[n] = null; });
      a.addEventListener('canplaythrough', () => { if (S && S._zoneMusic === n && music.currentTrack !== n && S.playZoneMusic) S.playZoneMusic(n); });
      music.audioElements[n] = a;
    });
  };

  const m0 = P.musicForZone;
  P.musicForZone = function (key) {
    const base = m0.apply(this, arguments);
    try {
      if (!this._ckMusPre) { this._ckMusPre = true; precargar(this); }
      if (idDe(key) === 'coliseo_orco' && this._gameMode === 'campaign') return 'coliseo';   // en la arena manda su tema, con jefes y todo
      if (base === 'boss' || base === 'practica' || this._gameMode !== 'campaign') return base;
      if (this._ckMusicaFija) return this._ckMusicaFija;          // una escena puede pedir su tema (la historia nueva)
      const id = idDe(key), propia = MAPA[id] || base;
      if (propia === 'coliseo') return propia;                       // el coliseo ya es pelea de punta a punta
      if (enPelea(this)) {
        const tema = ORCO.test(id) ? 'batalla_orca' : 'combate';
        if (music.audioElements && music.audioElements[tema] !== null) return tema;
      }
      return music.audioElements && music.audioElements[propia] === null ? base : propia;
    } catch (e) { return base; }
  };
  window.CK_MUSICA_MOMENTOS = { MAPA, NUEVOS, enPelea, fijar: (S, tema) => { S._ckMusicaFija = tema || null; } };
})();
