'use strict';
/* La práctica entra directo (22/11, pedido del dueño: "en el modo práctica no me hagas la animación del libro para entrar,
   que entre directo").
   - PRÁCTICA (en el menú) ya no abre el Libro de Héroes con su animación: arranca la práctica con el último héroe que se
     usó ahí (o con Lancent la primera vez). Adentro se cambia de héroe como siempre (los botones de arriba a la derecha).
   - Urso sólo si ya está libre. La campaña sigue con el libro.
   Se recuerda en localStorage (ck_heroe_practica). Borrar su línea de index.html vuelve a abrir el libro. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const K = 'ck_heroe_practica', HEROES_OK = ['soldier', 'wizard', 'swordsman', 'bear', 'orc'];
  const leer = () => { try { return localStorage.getItem(K) || ''; } catch (e) { return ''; } };
  const recordar = h => { try { if (h) localStorage.setItem(K, h); } catch (e) {} };
  const puede = (S, h) => {
    if (HEROES_OK.indexOf(h) < 0) return false;
    if (h === 'bear') { const O = window.CK_OSO; try { return !!(O && O.libre && O.libre()); } catch (e) { return false; } }
    if (h === 'orc') { try { return !!(S.heroUnlocked && S.heroUnlocked()); } catch (e) { return false; } }
    return true;
  };
  const abrir0 = P.openHeroSelectionModal;
  P.openHeroSelectionModal = function (mode) {
    if ((mode || 'practice') !== 'practice') return abrir0.apply(this, arguments);
    let h = leer(); if (!puede(this, h)) h = puede(this, this.playerHero) ? this.playerHero : 'soldier';
    this.heroSelectionTargetMode = 'practice';
    try { if (typeof sfx !== 'undefined') sfx.init(); } catch (e) {}
    if (this.finishHeroSelection) this.finishHeroSelection(h);
    else { this.playerHero = h; this.startPractice(); }
  };
  // el último héroe de la práctica (al entrar y al cambiar adentro)
  const pr0 = P.startPractice;
  if (pr0) P.startPractice = function () { recordar(this.playerHero); return pr0.apply(this, arguments); };
  const sw0 = P.switchHero;
  if (sw0) P.switchHero = function (h) { const r = sw0.apply(this, arguments); try { if (this._gameMode === 'practice' && !(window.CK_PANEL_PRUEBAS && CK_PANEL_PRUEBAS.st && CK_PANEL_PRUEBAS.st.prueba)) recordar(this.playerHero); } catch (e) {} return r; };
  window.CK_PRACTICA_DIRECTA = { leer };
})();
