'use strict';
/* Editor de habilidades (21/11, pedido del dueño: "una parte para probar, marcar y decirte cómo quiero que sean, el retraso
   que deben tener y qué agregar o quitar, también mostrar de dónde deben salir"). En el modo práctica aparece el botón
   HABILIDADES (o F6), debajo de PRUEBAS, y abre un panel al costado con cuatro pestañas:
   - JEFES: las 8 habilidades nuevas de ck_jefes_pixelfx.js. "Traer al jefe" lo pone delante, quieto; "Probar" la tira.
     Se cambia cada cuánto la usa, cuánto avisa antes, el radio, el daño, qué efecto y de qué tamaño, de dónde sale
     ("Marcar" y un clic en el juego) y se suman o quitan capas de efecto.
   - HÉROES: las habilidades de Lancent, Aby, Horos y Urso. Cada una es una lista de capas (qué efecto, cuándo, cuántas
     veces, desde dónde, cuánto adelante, tamaño, color, luz...) que se pueden cambiar, sumar, quitar y ordenar. Los
     proyectiles (bola de fuego, lanza, esquirlas, misiles, roca, onda) también: efecto, tamaño y de dónde salen.
   - EFECTOS: los 43 efectos sueltos con su dibujo: tamaño, velocidad y punto de apoyo (un clic en el dibujo).
   - NOTAS: notas generales y la lista de todo lo que se cambió.
   Todo se ve EN VIVO y queda guardado en el juego (localStorage, también en la campaña). "Exportar" baja el archivo
   ajustes_habilidades.json (y "Copiar" lo copia) para pasárselo a Claude y dejarlo fijo en el código.
   v5 (21/11): la pestaña EFECTOS no se muestra (confundía) y ya no se eligen ni suman efectos: sólo se editan las
   habilidades que tiene cada personaje; lo que se quiera agregar va en una nota. "Enemigos y jefes": los 15 jefes y los 31
   enemigos, cada uno con lo que puede hacer (golpe, embestida, escudo, tirador, aullido) y sus números. En la línea de
   tiempo cada barra se mueve (el medio) y se corta (sus bordes blancos: "salta" el comienzo, "dura"/"corte" el final).
   v6 (21/11): las habilidades de jefes y enemigos que están en su código ya no se graban en video: se LEEN del juego (qué
   dibuja, cuadro a cuadro) y se arman en el escenario en capas editables como las de los héroes (cuándo sale, cortar,
   correr, tamaño, opacidad, color, luz, delante/detrás, quitar). "▶ En el juego" la hace con esos cambios.
   v7 (21/11): héroes y jefes se ven en el lugar de verdad (el mapa donde se prueba, de fondo) y con su animación de verdad:
   el editor les hace usar la habilidad una vez y lee al personaje, a quien golpea (el muñeco o el héroe) y los números de
   daño. Los enemigos comunes siguen como estaban.
   v8 (21/11): sin las sombras que dibujaba el editor (los dibujos ya traen la suya); todas las habilidades de los héroes
   (también las dagas de Aby y las que sólo se pueden ver: lluvia, danza, trueno, leídas enteras del juego); lo que ya quedó
   fijo en el juego se saca de los ajustes guardados.
   v9 (21/11): con ck_heroes_pedidos.js (las habilidades de los héroes rehechas con anticipación, cargas y animaciones nuevas)
   se lee también todo lo que esa parte dibuja (partículas, contornos, colmillos, cráter...), las capas editables se dibujan
   cuando de verdad salen (después de la anticipación) y donde está el héroe en ese momento (si saltó, donde cayó).
   v10 (21/11): "＋ Anotar habilidad nueva" (héroes y enemigos/jefes): nombre, qué hace, animación, efectos y cuándo la usa;
   quedan en la lista del personaje y en Notas, y salen en Exportar (habilidades_nuevas). En pantalla completa (y en la
   chica) el escenario se dibuja con zoom entero y alineado al píxel, y el fondo se saca del mapa a su tamaño real (1 píxel
   del juego = 1 píxel de la foto) y más grande: ya no queda sin fondo a los costados ni se ven los píxeles desparejos.
   v11 (21/11): los textos de "qué hace" de las habilidades de los jefes que se rehicieron (tanda 3 y 4: Grushak arroja el hacha,
   Kragmor tira la roca, Ulrak aúlla sin lobos, Fauces se divide, etc.).
   v12 (22/11): el esquema de las habilidades de jefes con pixelfx usa el color de la marca del juego: las manos del nigromante
   con la marca del piso verde (no roja), el estallido oscuro con runas de fuego y sin círculo, y los ojos sin marca en el piso.
   Aby suma el Slice combo (ck_aby_combo.js) a su lista de habilidades.
   Con ?editor_hab=1 en la dirección también se abre en la campaña. Borrar la línea de index.html lo saca (y los ajustes
   guardados dejan de aplicarse). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof Phaser === 'undefined') return;
  const P = MainGameScene.prototype;
  const CLAVE = 'ck_ajustes_habilidades_v1';
  const SIEMPRE = /[?&]editor_hab=1/.test(location.search);
  const escena = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const VX = () => window.CK_VFX, JP = () => window.CK_JEFES_PIXELFX, PFX = () => window.CK_PIXELFX;
  const HB = () => window.CK_HABILIDADES || {}, EQ = () => window.CK_EQUIPO || {};
  const hojas = () => (window.CK_VFX_ARTE && CK_VFX_ARTE.hojas) || {};
  const R = (a, b) => a + Math.random() * (b - a);
  const vivo = e => e && e.active && !e.isDead;
  const copia = o => JSON.parse(JSON.stringify(o));
  const hex = n => '#' + ('000000' + (n >>> 0).toString(16)).slice(-6);
  const deHex = s => parseInt(String(s).replace('#', ''), 16);

  // ================================================================== lo que se guarda
  let AJ = { version: 1, efectos: {}, jefes: {}, heroes: {}, proyectiles: {}, estados: {}, marcas: [], tipos: {}, especiales: {}, fases: {}, otras: {}, roles: {}, capasJ: {}, notas: '' };
  try { const t = localStorage.getItem(CLAVE); if (t) { const o = JSON.parse(t); if (o && o.version === 1) AJ = Object.assign(AJ, o); } } catch (e) {}
  let tG = 0;
  const guardar = () => { clearTimeout(tG); tG = setTimeout(() => {
    try { localStorage.setItem(CLAVE, JSON.stringify(AJ)); avisar('guardado ✓'); }
    catch (e) {                                                  // si las fotos de las notas no entran, se guarda sin ellas (quedan en el archivo de Exportar)
      try { localStorage.setItem(CLAVE, JSON.stringify(Object.assign({}, AJ, { marcas: (AJ.marcas || []).map(m => Object.assign({}, m, { foto: null })) }))); avisar('guardado sin las fotos de las notas: exportá para no perderlas'); }
      catch (e2) { avisar('no se pudo guardar'); }
    }
  }, 300); };

  // ================================================================== EFECTOS: tamaño, velocidad, punto de apoyo
  const DEF_EF = {};
  Object.keys(hojas()).forEach(k => {
    const h = hojas()[k]; if (h.solo || /_atras$/.test(k)) return;
    const P2 = PFX(); DEF_EF[k] = { esc: (P2 && P2.ESC && P2.ESC['ckfx_' + k]) || 1, ax: h.ax, ay: h.ay, fps: h.fps };
  });
  const SUELO = /^(suelo|runas|curar|haz|rayo|pinchos|st_quemar|st_hielo|aura_furia|st_mejora|pfx_manos|pfx_espina|pfx_oscura|pfx_estrellas|pfx_pisoton|pfx_polvo|pfx_siega|pfx_fatuo)$/;
  const efOf = k => Object.assign({}, DEF_EF[k], AJ.efectos[k] || {});
  const aplicarEfecto = k => {
    const H = hojas(), h = H[k]; if (!h || !DEF_EF[k]) return;
    const a = efOf(k), P2 = PFX();
    [h, h.atras && H[h.atras]].forEach((x, i) => {
      if (!x) return;
      x.ax = a.ax; x.ay = a.ay; x.fps = Math.max(1, a.fps);
      if (P2 && P2.ESC) P2.ESC['ckfx_' + (i ? h.atras : k)] = a.esc;
    });
  };

  // ================================================================== JEFES
  const NOMBRE_JEFE = { necromancer: 'Nigromante', skeleton_great: 'Gran Esqueleto', brujo_sello: 'Malakar', demonio_sello: 'Azrath', demonio_j_ojo: 'Orbath', demonio_j_sabueso: 'Fauces', demonio_j_segadora: 'Seravel', demonio_j_minotauro: 'Taurax' };
  // los campos de cada habilidad: [clave, etiqueta, unidad, paso]
  const CAMPOS_J = [['cada', 'Cada cuánto la usa', 'ms', 500], ['aviso', 'Avisa antes', 'ms', 50], ['radio', 'Radio de la marca', 'px', 2], ['dano', 'Daño', 'corazones', 1],
    ['escala', 'Tamaño del efecto', '×', 0.05], ['dmin', 'La usa desde', 'px', 10], ['dmax', 'hasta', 'px', 10],
    ['cantidad', 'Cuántas', '', 1], ['paso', 'Separación', 'px', 2], ['entre', 'Tiempo entre una y otra', 'ms', 10], ['lento', 'Te deja lento', 'ms', 100],
    ['ancho', 'Ancho de la franja', 'px', 2], ['dura', 'Cuánto dura', 'ms', 50], ['alcance', 'Alcance adelante', 'px', 2], ['desdeVida', 'Desde (vida que le queda)', '0-1', 0.05]];
  const jOf = k => { const J = JP(); return J ? J.AJ(k) : {}; };
  const aplicarJefe = k => { const J = JP(); if (J) J.poner(k, AJ.jefes[k] ? copia(AJ.jefes[k]) : null); };
  const tocarJefe = (k, campo, v) => { AJ.jefes[k] = AJ.jefes[k] || {}; if (v == null || (campo === 'corte' && !v)) delete AJ.jefes[k][campo]; else AJ.jefes[k][campo] = v; if (!Object.keys(AJ.jefes[k]).length) delete AJ.jefes[k]; aplicarJefe(k); guardar(); };

  // ================================================================== HÉROES: cada habilidad como lista de capas
  // capa: ef (efecto, o @onda:tipo, @ulti, @temblor), ret (ms), n (veces), cada (ms), en (pie|pecho|centro|cabeza), ad (adelante, px),
  //       avz (avanza por vez), dx, dy, az/azy (al azar), esc, sube (crece por vez), tin (color), alfa, suma (luz), vel, girar, voltear,
  //       sigue, detras, dura (ms), unaVez, enem (en cada enemigo a menos de X px), pro (profundidad respecto del piso), radio, fuerza
  const C = (ef, o) => Object.assign({ ef }, o || {});
  const DESP = {
    b_torbellino: [C('giro', { en: 'pie', dy: -14, esc: 1.15 }), C('giro', { en: 'pie', dy: -14, esc: 1.3, alfa: 0.6, vel: 0.8 })],
    onda: [], explosiva: [], marca: [], b_escarcha: [],
    grito: [C('haz', { en: 'pie', esc: 0.9, alfa: 0.85 }), C('@onda:luz', { en: 'pie', radio: 95, dura: 420 })],
    cargado: [C('carga', { en: 'centro', ad: 16, dy: -4, esc: 0.8, tin: 0xffd25a, suma: true, vel: 1.4 })],
    salto: [C('suelo', { ret: 390, en: 'pie', esc: 0.75, pro: -6 }), C('@onda:tierra', { ret: 390, en: 'pie', radio: 90, dura: 360 })],
    golpe_escudo: [C('critico', { ret: 140, en: 'centro', ad: 30, dy: 6, esc: 1.1, tin: 0xbfdbfe, suma: true })],
    b_pirueta: [C('humo', { en: 'centro', dy: 6, esc: 0.6, tin: 0xffc0d0 }), C('tajo_veloz', { en: 'centro', ad: 40, esc: 0.7, tin: 0xff9ab8, girar: true })],
    remolino: [C('giro', { n: 5, cada: 300, en: 'pie', dy: -12, esc: 0.95, tin: 0xff9ab8 })],
    paso: [C('humo', { en: 'centro', dy: 4, esc: 0.75 })],
    tajo: [C('tajo_x', { ret: 90, en: 'centro', ad: 30, dy: 4, esc: 1.1 })],
    relampago: [C('tajo_veloz', { en: 'centro', ad: 65, esc: 1, tin: 0x9fd8ff, girar: true, suma: true }), C('chispa_rayo', { ret: 150, en: 'pie', dy: -10, esc: 1.2, suma: true })],
    anillo: [C('runas', { en: 'centro', dy: 10, esc: 0.95, tin: 0xff9a4a, alfa: 0.55, suma: true, sigue: true, detras: true, dura: 2900 })],
    ventisca: [C('runas', { en: 'centro', dy: 10, esc: 1.4, tin: 0x9fd8ff, alfa: 0.4, suma: true, sigue: true, detras: true, dura: 3900 }),
      C('hielo_roto', { n: 8, cada: 450, en: 'centro', dy: 5, az: 90, azy: 55, esc: 0.5, alfa: 0.8 })],
    prision: [C('hielo_roto', { en: 'centro', esc: 1.6 }), C('pinchos', { ret: 200, enem: 125, dy: 2, esc: 0.8 })],
    nova: [C('hielo_roto', { en: 'centro', esc: 1.5, tin: 0xd8ccff, suma: true }), C('runas', { en: 'pie', esc: 1.1, alfa: 0.6, suma: true, unaVez: true, vel: 2 })],
    lanza: [C('carga', { en: 'centro', dy: -6, esc: 0.6, tin: 0x9fd8ff, suma: true, vel: 2 })],
    triple_fuego: [C('carga', { en: 'centro', dy: -6, esc: 0.7, tin: 0xffa04a, suma: true, vel: 2 })],
    misiles: [C('runas', { en: 'pie', esc: 0.7, alfa: 0.6, suma: true, unaVez: true, vel: 2 })],
    escudo_arcano: [C('carga', { en: 'centro', dy: -4, esc: 0.9, tin: 0xd8a0ff, suma: true, vel: 2 })],
    drenaje: [C('curar', { ret: 450, en: 'centro', dy: 10, esc: 1.1 })],
    meteoro: [C('runas', { en: 'centro', ad: 110, dy: 12, esc: 0.8, tin: 0xff6a2a, alfa: 0.7, suma: true, dura: 600, pro: -8 }),
      C('fuego_explosion', { ret: 650, en: 'centro', ad: 110, dy: 2, esc: 1.2 }), C('suelo', { ret: 650, en: 'centro', ad: 110, dy: 12, esc: 0.9, pro: -6 }),
      C('@onda:fuego', { ret: 650, en: 'centro', ad: 110, dy: 12, radio: 90, dura: 450 }), C('@onda:tierra', { ret: 650, en: 'centro', ad: 110, dy: 12, radio: 70, dura: 400 }),
      C('@ulti', { ret: 650, en: 'centro', ad: 110, dy: 12, esc: 0.8 })],
    tormenta: [C('@ulti', { en: 'pie', esc: 0.8 }), C('runas', { en: 'centro', dy: 10, esc: 1.6, tin: 0x9fd8ff, alfa: 0.35, suma: true, sigue: true, detras: true, dura: 3000 })],
    b_rugido: [C('@ulti', { en: 'pie', esc: 1 }), C('@onda:hielo', { en: 'pie', radio: 120, dura: 450 }), C('@onda:acero', { en: 'pie', radio: 90, dura: 350 }), C('hielo_roto', { en: 'centro', dy: -8, esc: 1.8, alfa: 0.8 })],
    b_remolino: [C('giro', { n: 3, cada: 260, en: 'pie', dy: -14, esc: 1.1, tin: 0xcfeeff }), C('garras', { n: 3, cada: 260, en: 'pie', dy: -18, az: 20, esc: 0.8, alterna: true })],
    frenesi: [C('carga', { en: 'centro', dy: -6, esc: 1, tin: 0xff6a2a, suma: true, vel: 2 })],
    desgarro: [C('garras', { ret: 120, en: 'centro', ad: 30, dy: -4, esc: 1.4, voltear: true }), C('sangre', { ret: 120, en: 'centro', ad: 34, esc: 1 })],
    pisoton: [C('suelo', { ret: 260, en: 'pie', esc: 1.05, pro: -6 }), C('@onda:tierra', { ret: 260, en: 'pie', radio: 100, dura: 420 }), C('@temblor', { ret: 260, dura: 200, fuerza: 0.01 })],
    avalancha: [C('@ulti', { en: 'pie', esc: 1.1 }), C('pinchos', { n: 5, ret: 230, cada: 110, en: 'pie', ad: 34, avz: 34, dy: 4, esc: 0.98, sube: 0.08 }),
      C('@onda:hielo', { n: 5, ret: 230, cada: 110, en: 'pie', ad: 34, avz: 34, radio: 36, dura: 300 }), C('suelo', { ret: 670, en: 'pie', ad: 170, esc: 0.9, pro: -6 })],
    mordisco: [C('critico', { ret: 150, en: 'centro', ad: 26, esc: 1, tin: 0xff6a6a }), C('sangre', { ret: 150, en: 'centro', ad: 28, esc: 1.1 })],
    espiritu: [C('haz', { en: 'pie', esc: 0.8, tin: 0x7dff9a })],
    hibernar: [C('curar', { ret: 2000, en: 'centro', dy: 10, esc: 1.3 })]
  };
  const HEROES = {
    soldier: ['Lancent', ['b_torbellino', 'onda', 'grito', 'cargado', 'salto', 'golpe_escudo', 'explosiva']],
    swordsman: ['Aby', ['b_pirueta', 'remolino', 'paso', 'tajo', 'relampago', 'marca', 'dagas', 'slice']],          // (v12) slice: el combo nuevo (ck_aby_combo.js)
    wizard: ['Horos', ['ataque', 'anillo', 'ventisca', 'prision', 'nova', 'lanza', 'triple_fuego', 'misiles', 'escudo_arcano', 'drenaje', 'b_escarcha', 'meteoro', 'tormenta']],
    bear: ['Urso', ['b_rugido', 'b_remolino', 'frenesi', 'desgarro', 'pisoton', 'avalancha', 'mordisco', 'espiritu', 'hibernar']]
  };
  // proyectiles: textura vieja → [nombre, efecto y tamaño de antes]
  const PROY = { wizard_fireball: ['Bola de fuego', 'fuego_bola', 0.55], ck_lanza_hielo: ['Lanza de hielo', 'hielo_lanza', 0.6], ck_esquirla: ['Esquirlas', 'hielo_lanza', 0.32],
    ck_misil: ['Misil arcano', 'arcano_misil', 0.55], ck_roca: ['Roca del meteoro', 'fuego_bola', 1.1, 'La roca cae del cielo hasta el punto del meteoro: de ella se cambia el efecto y el tamaño.'], ck_onda: ['Onda de acero', 'onda', 0.55] };
  const PROY_DE = { ataque: 'wizard_fireball', triple_fuego: 'wizard_fireball', lanza: 'ck_lanza_hielo', b_escarcha: 'ck_esquirla', misiles: 'ck_misil', meteoro: 'ck_roca', onda: 'ck_onda' };
  const NOMBRE_H = { ataque: 'Ataque (bola de fuego)', b_rugido: 'Rugido', b_remolino: 'Remolino de garras' };
  const nombreHab = id => {
    if (NOMBRE_H[id]) return NOMBRE_H[id];
    const E = EQ(); if (E.BASE && E.BASE[id]) return E.BASE[id].n;
    const A = HB().ARBOL || {};
    for (const h in A) for (const r of A[h].ramas || []) for (const n of r.nodos || []) if (n.id === id) return n.n;
    return id.replace(/^b_/, '').replace(/_/g, ' ');
  };
  const SIN_EDITAR = { b_lluvia: 'soldier', b_danza: 'swordsman', b_trueno: 'wizard' };   // su efecto va dentro de ck_vfx.js
  const heroeDe = id => Object.keys(HEROES).find(h => HEROES[h][1].includes(id)) || SIN_EDITAR[id] || null;
  const capasDe = id => (AJ.heroes[id] && AJ.heroes[id].capas) || copia(DESP[id] || []);
  const dir = S => { try { return HB().dirV ? HB().dirV(S) : [S.facingDirection === 'left' ? -1 : 1, 0]; } catch (e) { return [S.facingDirection === 'left' ? -1 : 1, 0]; } };
  const base = (S, c, o) => { const V = VX(); o = o || S.player; return c.en === 'pie' ? V.pie(o) : c.en === 'pecho' ? V.pecho(o) : c.en === 'cabeza' ? V.cabeza(o) : { x: o.x, y: o.y }; };
  const punto = (S, c, i, azar) => {
    const [fx, fy] = dir(S), b = base(S, c), izq = fx < 0 || (fx === 0 && S.player.flipX);
    const ad = (c.ad || 0) + (i || 0) * (c.avz || 0);
    return { x: b.x + fx * ad + (izq ? -1 : 1) * (c.dx || 0) + (azar ? R(-1, 1) * (c.az || 0) : 0),
      y: b.y + fy * ad * 0.8 + (c.dy || 0) + (azar ? R(-1, 1) * (c.azy || 0) : 0), fx, fy, izq };
  };
  const correrCapa = (S, c) => {
    const n = Math.max(1, Math.round(c.n || 1));
    for (let i = 0; i < n; i++) S.time.delayedCall(Math.max(0, (c.ret || 0) + i * (c.cada || 0)), () => {
      const V = VX(); if (!S.player || !V) return;
      const q = punto(S, c, i, true), esc = (c.esc || 1) + i * (c.sube || 0);
      if (c.ef === '@ulti') return V.ulti(S, S.playerHero, q.x, q.y, esc);
      if (c.ef === '@temblor') return S.cameras.main.shake(c.dura || 200, c.fuerza || 0.01);
      if (/^@onda:/.test(c.ef)) return window.CK_ONDAS && CK_ONDAS.estallido(S, c.ef.slice(6), q.x, q.y, c.radio || 80, c.dura || 400);
      const o = { escala: esc, alfa: c.alfa != null ? c.alfa : 1, suma: !!c.suma, vel: c.vel || 1 };
      if (c.tin != null) o.tinte = c.tin;
      if (c.girar) o.giro = Math.atan2(q.fy, q.fx);
      if (c.voltear) o.flip = q.izq;
      if (c.alterna) o.flip = (i % 2 === 1) !== !!o.flip;
      if (c.dura) o.dura = c.dura;
      if (c.unaVez) o.unaVez = true;
      // cortado el comienzo: arranca más adelante en su animación
      const arranca = sp => { if (!sp || !c.salta || !sp.anims || !sp.anims.currentAnim) return sp; try { const H = hojas()[c.ef], fps = H.fps * (c.vel || 1); sp.play({ key: sp.anims.currentAnim.key, frameRate: fps, repeat: H.loop && !c.unaVez ? -1 : 0, startFrame: Math.min(H.n - 1, Math.floor(c.salta / 1000 * fps)) }); } catch (er) {} return sp; };
      const lado = c.lado || (c.detras ? 'detras' : null), pone = r => lado === 'delante' ? (r.depth || 0) + 3 : lado === 'detras' ? (r.depth || 0) - 3 : null;   // delante o detrás del personaje
      if (c.pro != null) o.prof = Math.round(q.y) + c.pro;
      if (pone(S.player) != null) o.prof = pone(S.player);
      if (c.enem) {
        const p = S.player;
        S.enemies.getChildren().forEach(e => {
          if (!vivo(e) || Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) > c.enem) return;
          const g = V.pie(e), y = g.y + (c.dy || 0);
          arranca(V.fx(S, c.ef, g.x + (c.dx || 0), y, Object.assign({}, o, c.pro != null ? { prof: Math.round(y) + c.pro } : {}, pone(e) != null ? { prof: pone(e) } : {})));
        });
        return;
      }
      if (c.sigue) { const p = S.player; Object.assign(o, { sigue: p, dx: q.x - p.x, dy: q.y - p.y, detras: lado === 'detras' }); delete o.prof; return arranca(V.fx(S, c.ef, 0, 0, o)); }
      arranca(V.fx(S, c.ef, q.x, q.y, o));
    });
  };
  const ORIG_DESP = {};
  // que todas tengan su "después" (así ck_vfx.js las envuelve al arrancar y las capas cambiadas siempre se ven)
  try { const V = VX(); if (V && V.DESPUES) Object.keys(HEROES).forEach(h => HEROES[h][1].forEach(id => { if (id !== 'ataque' && !V.DESPUES[id]) V.DESPUES[id] = () => {}; })); } catch (e) {}
  const aplicarHeroe = id => {
    const V = VX(); if (!V || !V.DESPUES || id === 'ataque') return;
    if (!(id in ORIG_DESP)) ORIG_DESP[id] = V.DESPUES[id] || null;
    if (AJ.heroes[id] && AJ.heroes[id].capas) V.DESPUES[id] = S => { (AJ.heroes[id].capas || []).forEach(c => { try { correrCapa(S, c); } catch (e) {} }); };
    else if (ORIG_DESP[id]) V.DESPUES[id] = ORIG_DESP[id];
  };
  const tocarHeroe = (id, capas) => { AJ.heroes[id] = Object.assign(AJ.heroes[id] || {}, { capas }); aplicarHeroe(id); guardar(); };

  // ---------------------------------------------------------------- proyectiles: efecto, tamaño y de dónde salen
  let captura = null, ultimoFx = null;
  const F = Phaser.GameObjects.GameObjectFactory.prototype, sp0 = F.sprite, img0 = F.image;
  F.sprite = function (x, y, key) {
    const s = sp0.apply(this, arguments);
    if (typeof key === 'string' && key.indexOf('ckfx_') === 0) { ultimoFx = s; if (captura) captura.push(s); }
    return s;
  };
  const ultimaSalida = {};                                   // dónde salió el último de cada uno (para marcar la salida)
  const ajustarProy = (S, o, key, sprites) => {
    if (!o || !PROY[key]) return;
    const [fx, fy] = dir(S), izq = fx < 0 || (fx === 0 && S.player && S.player.flipX);
    const a = AJ.proyectiles[key];
    if (a && (a.ad || a.dy) && !PROY[key][3]) {
      const nx = o.x + fx * (a.ad || 0), ny = o.y + fy * (a.ad || 0) * 0.8 + (a.dy || 0);
      if (o.body && o.body.reset) { const vx = o.body.velocity.x, vy = o.body.velocity.y; o.body.reset(nx, ny); o.body.setVelocity(vx, vy); }
      else o.setPosition(nx, ny);
    }
    if (S.player) ultimaSalida[key] = { rx: o.x - S.player.x, ry: o.y - S.player.y, izq, fx, fy, ad: (a && a.ad) || 0, dy: (a && a.dy) || 0 };
    if (!a || (!a.ef && a.esc == null)) return;
    const s = (sprites || []).find(z => z && z.active && z.texture && z.texture.key === 'ckfx_' + PROY[key][1]);
    if (!s) return;
    if (!a.ef || a.ef === PROY[key][1]) { s.setScale(a.esc != null ? a.esc : PROY[key][2]); return; }
    // otro efecto: el de antes queda invisible (sigue llevando el golpe al morir) y el nuevo viaja con el proyectil
    s.setVisible(false);
    const V = VX(), n = V && V.fx(S, a.ef, o.x, o.y, { escala: a.esc != null ? a.esc : PROY[key][2], prof: 30001 });
    if (!n) { s.setVisible(true); return; }
    const upd = () => {
      if (!n.active) return S.events.off('postupdate', upd);
      if (!o.active) { S.events.off('postupdate', upd); n.destroy(); return; }
      n.setPosition(o.x, o.y);
      const v = o.body ? o.body.velocity : null;
      if (v && (v.x || v.y)) n.setRotation(Math.atan2(v.y, v.x)); else n.setRotation(o.rotation || 0);
    };
    S.events.on('postupdate', upd);
  };
  const engancharProy = S => {
    if (!S.projectiles || !S.projectiles._ckFx || S.projectiles._ckEd) return;
    S.projectiles._ckEd = true;
    const c1 = S.projectiles.create;
    S.projectiles.create = function (x, y, key) {
      captura = []; let o;
      try { o = c1.apply(this, arguments); } finally { const cap = captura; captura = null; try { ajustarProy(S, o, key, cap); } catch (e) {} }
      return o;
    };
  };
  F.image = function (x, y, key) {
    const o = img0.apply(this, arguments);
    try {
      if ((key === 'ck_misil' || key === 'ck_roca') && this.scene && this.scene.startCampaign) {
        const S = this.scene; S.time.delayedCall(0, () => { try { ajustarProy(S, o, key, [ultimoFx]); } catch (e) {} });
      }
    } catch (e) {}
    return o;
  };

  // ================================================================== ESTADOS: aturdido, quemado, congelado... y los del héroe
  // (21/11, pedido: "dejame editar los efectos de estado, tipo los stunes y demás"). ck_estados.js lee DEB/BUF cada vez que
  // aparece un estado: el efecto, el tamaño, la opacidad y si va detrás se cambian ahí. Dónde va (con el contorno del dibujo,
  // como ck_pixelfx.js), el corrimiento, el color, la luz y la velocidad van con una envoltura de CK_VFX.fx que sólo toca a
  // los estados cambiados (ck_pixelfx.js envuelve CK_VFX.fx después, en el primer cuadro: esta queda adentro y manda).
  const ES = () => window.CK_ESTADOS || null;
  const NOM_EST = { quemado: 'Quemado', congelado: 'Congelado', aturdido: 'Aturdido (stun)', sangrando: 'Sangrando', lento: 'Lento', marcado: 'Marcado', escudo: 'Escudo arcano', furia: 'Furia', grito: 'Grito de guerra', bosque: 'Espíritu del bosque' };
  const LUGAR0 = { st_aturdido: 'sobre', st_marca: 'sobre', st_lento: 'cabeza', st_sangra: 'pecho', escudo: 'centro', st_bosque: 'centro' };
  const DEF_EST = {};
  (() => {
    const E = ES(); if (!E) return;
    [['DEB', E.DEB], ['BUF', E.BUF]].forEach(([g, T]) => Object.keys(T || {}).forEach(k => {
      const D = T[k]; if (!D.fx) return;
      const pfx = PFX() && PFX().USA && PFX().USA[D.fx], en = pfx && LUGAR0[D.fx] ? LUGAR0[D.fx] : D.en;
      const C = (PFX() && PFX().CORRE && PFX().CORRE[D.fx]) || [0, 0];         // lo corrido que ya quedó fijo en ck_pixelfx.js
      DEF_EST[k] = { g, fx: D.fx, esc: D.esc, en, dx: C[0], dy: (D.fx === 'st_marca' && en === 'sobre' ? -5 : 0) + C[1], alfa: D.alfa != null ? D.alfa : 1,
        detras: D.detras != null ? !!D.detras : g === 'DEB' ? D.en === 'pie' : false, vel: 1, suma: false, ic: D.ic };
    }));
  })();
  // lo que ya quedó fijo en el juego (21/11) se saca de los ajustes guardados, para que no se sume dos veces
  (() => {
    let cambio = false; const J = JP();
    if (J) Object.keys(AJ.jefes || {}).forEach(k => { const a = AJ.jefes[k], d = J.DEF[k]; if (!a || !d) return; Object.keys(a).forEach(c => { if (c !== 'notas' && JSON.stringify(a[c]) === JSON.stringify(d[c])) { delete a[c]; cambio = true; } }); if (!Object.keys(a).length) delete AJ.jefes[k]; });
    Object.keys(AJ.estados || {}).forEach(k => { const a = AJ.estados[k], d = DEF_EST[k]; if (!a || !d) return; ['dx', 'dy'].forEach(c => { if (a[c] != null && a[c] === d[c]) { delete a[c]; cambio = true; } }); if (!Object.keys(a).length) delete AJ.estados[k]; });
    // la grieta del salto (archivo del 21/11): estaba corrida 73 px porque el editor no movía al héroe con el salto (cae 70 px
    // adelante); ahora sí, así que queda donde cae (+3)
    const sa = AJ.heroes && AJ.heroes.salto && AJ.heroes.salto.capas && AJ.heroes.salto.capas[0];
    if (sa && sa.ef === 'suelo' && sa.dx === 73) { sa.dx = 3; cambio = true; }
    if (cambio) try { localStorage.setItem(CLAVE, JSON.stringify(AJ)); } catch (e) {}
  })();
  const estOf = k => Object.assign({}, DEF_EST[k], AJ.estados[k] || {});
  const cambiosEst = k => Object.keys(AJ.estados[k] || {}).some(c => c !== 'notas');
  const EST_HOJA = {};                                         // hoja → estado (sólo los cambiados)
  const aplicarEstado = k => {
    const E = ES(), D0 = DEF_EST[k]; if (!E || !D0) return;
    const T = E[D0.g][k], a = cambiosEst(k) ? estOf(k) : D0;
    T.fx = a.fx; T.esc = a.esc; if (D0.g === 'BUF') { T.alfa = a.alfa; T.detras = a.detras; }
    Object.keys(EST_HOJA).forEach(h => { if (EST_HOJA[h] === k) delete EST_HOJA[h]; });
    if (cambiosEst(k)) EST_HOJA[a.fx] = k;
  };
  // dónde va un estado en un personaje del juego: a los pies, o con el contorno real de su dibujo
  const dyEstado = (t, en) => {
    const h = t.displayHeight || 60;
    if (en === 'pie') return t.body ? t.body.bottom - t.y : h * 0.1;
    const b = PFX() && PFX().contorno ? PFX().contorno(t) : null;
    if (b) return en === 'sobre' ? b.top - t.y - 4 : en === 'cabeza' ? b.top + b.h * 0.16 - t.y : en === 'pecho' ? b.top + b.h * 0.4 - t.y : b.top + b.h * 0.52 - t.y;
    return en === 'sobre' ? -h * 0.38 : en === 'cabeza' ? -h * 0.3 : en === 'pecho' ? -h * 0.1 : -h * 0.05;
  };
  (() => {
    const V = VX(); if (!V || V._ckEdEst) return; V._ckEdEst = true;
    const f0 = V.fx;
    V.fx = function (S, k, x, y, o) {
      try {
        const id = EST_HOJA[k];
        if (id && o && o.sigue) {
          const a = estOf(id), t = o.sigue;
          o = Object.assign({}, o, { dy: dyEstado(t, a.en) + (a.dy || 0), dx: a.dx || 0, alfa: a.alfa, detras: !!a.detras, vel: a.vel || 1, suma: !!a.suma });
          if (a.tin != null) o.tinte = a.tin; else delete o.tinte;
        }
      } catch (e) {}
      return f0.call(this, S, k, x, y, o);
    };
  })();

  // ================================================================== aplicar todo al arrancar
  const aplicarTodo = () => {
    Object.keys(AJ.efectos).forEach(aplicarEfecto);
    Object.keys(AJ.jefes).forEach(aplicarJefe);
    Object.keys(AJ.heroes).forEach(aplicarHeroe);
    Object.keys(AJ.estados || {}).forEach(aplicarEstado);
    try { aplicarJefesTodo(); } catch (e) {}
  };

  // ================================================================== el estado del panel
  const st = { abierto: false, tab: 'jefes', jefe: 'pfx_manos', heroe: 'wizard', hab: 'nova', capa: 0, ef: 'golpe', est: 'aturdido', jefeTipo: 'necromancer', jefeHab: 'pfx_manos', marcar: null, repetir: 0, invencible: true, quieto: true, soloTiene: true, mas: false };
  const puede = S => S && S.gameStarted && (S._gameMode !== 'campaign' || SIEMPRE || (window.CK_PANEL_PRUEBAS && CK_PANEL_PRUEBAS.st.prueba));
  let nAviso = 0;
  const avisar = t => { const el = document.getElementById('ckeh-estado'); if (!el) return; el.textContent = t; const n = ++nAviso; setTimeout(() => { if (n === nAviso && el) el.textContent = ''; }, 2500); };

  // ---------------------------------------------------------------- el muñeco y el jefe de prueba
  const quitarPrueba = S => { (S._ckEdCosas || []).forEach(e => { try { if (e.hpBar) e.hpBar.destroy(); if (e.nameTag) e.nameTag.destroy(); e.destroy(); } catch (er) {} }); S._ckEdCosas = []; };
  // quieto = estado 'rising' (el juego lo deja parado y sin atacar); al probar pasa a 'chase' y después vuelve
  const quieto = (S, e) => {
    if (!e) return;
    e.hp = e.maxHp = 99999; e._ckEdPrueba = true; e._ckEdNace = S.time.now;
    try { if (S.placeEnemyClear) S.placeEnemyClear(e); } catch (er) {}
    e.state = st.quieto ? 'rising' : 'chase';
    if (st.quieto && e.body) e.body.setVelocity(0, 0);
  };
  const munieco = S => {
    quitarPrueba(S); S._ckPermitirBestias = true;
    const [fx] = dir(S), p = S.player, e = S.spawnEnemy(p.x + (fx < 0 ? -70 : 70), p.y, 'orc');
    if (!e) return null;
    quieto(S, e); e.setFlipX(fx > 0); S._ckEdCosas = [e]; return e;
  };
  const traerJefe = S => {
    const k = st.jefe, J = JP(); if (!J) return null;
    quitarPrueba(S); S._ckPermitirBestias = true;
    // a la izquierda del héroe: el panel tapa el lado derecho de la pantalla
    const t = J.DEF[k].jefe, p = S.player, lado = -1, lejos = /espinas|rayos|estrellas|manos/.test(k) ? 130 : 70;
    const e = S.spawnEnemy(p.x + lado * lejos, p.y - 4, t);
    if (!e) { avisar('no se pudo traer al jefe'); return null; }
    quieto(S, e); e.setFlipX(lado > 0); S._ckEdCosas = [e]; return e;
  };
  // mientras está quieto: que no use nada por su cuenta (ni especiales ni invocar)
  const calmar = S => {
    const now = S.time.now, PL = (window.CK_ESPECIALES && CK_ESPECIALES.PLAN) || {};
    (S._ckEdCosas || []).forEach(e => {
      if (!vivo(e)) return;
      const libre = e._ckEdProbando > now, pelea = e._ckEdPelea > now;
      if (libre) {                                                // haciendo la habilidad que se prueba: que la haga entera, pero sólo esa
        const cd = e._ckEspCd || (e._ckEspCd = {}); e._ckEspVio = e._ckEspVio || now;
        (PL[e.type] || []).forEach(f => { cd[f[0]] = Math.max(cd[f[0]] || 0, now + 2000); });
        if (e._ckc && !e._ckc.ocupado) e._ckc.prox = Math.max(e._ckc.prox || 0, now + 2000);
        e.nextSummon = Math.max(e.nextSummon || 0, now + 2000); e.attackCooldown = Math.max(e.attackCooldown || 0, now + 300);
        return;
      }
      if (st.quieto || pelea) {                                  // que no use especiales por su cuenta (ningún archivo)
        const cd = e._ckEspCd || (e._ckEspCd = {}); e._ckEspVio = e._ckEspVio || now;
        (PL[e.type] || []).forEach(f => { cd[f[0]] = now + 60000; });
        if (e._ckc && !e._ckc.ocupado) e._ckc.prox = now + 60000;
        e._rcEsp = Math.max(e._rcEsp || 0, now + 60000);
      }
      if (pelea) { if (e.state === 'rising') e.state = 'chase'; return; }
      if (st.quieto) {
        if (!e._ckEsp && e.state === 'chase' && !(e._ckc && e._ckc.ocupado)) { e.state = 'rising'; e.isAttacking = false; }
        if (e.state === 'rising' && e.body) e.body.setVelocity(0, 0);
        e.nextSummon = now + 60000;
      } else if (e.state === 'rising') e.state = 'chase';
    });
  };
  const jefeDePrueba = S => (S._ckEdCosas || []).find(e => vivo(e) && JP() && e.type === JP().DEF[st.jefe].jefe);
  const cambiarHeroe = (S, h) => { if (!h || S.playerHero === h) return; try { const m = S._gameMode; S._gameMode = 'libre'; S.switchHero(h); S._gameMode = m; } catch (e) {} };

  // ---------------------------------------------------------------- probar
  const probarJefe = S => {
    let e = jefeDePrueba(S) || traerJefe(S); if (!e) return;
    const E = window.CK_ESPECIALES;
    if (!E || !E.HACER[st.jefe]) { avisar('las habilidades todavía no se engancharon'); return; }
    const k = st.jefe, espera = Math.max(50, 900 - (S.time.now - (e._ckEdNace || 0)));   // recién traído: que termine de aparecer
    e._ckEdProbando = S.time.now + espera + 200;
    S.time.delayedCall(espera, () => {
      if (!vivo(e)) return;
      e.state = 'chase'; e._ckEsp = 0; e.isAttacking = false;
      if (window.CK_PANEL_PRUEBAS && st.invencible) CK_PANEL_PRUEBAS.st.invencible = true;
      E.HACER[k](S, e);
    });
  };
  const idle = S => { try { const k = S.heroAnim ? S.heroAnim(S.playerHero + '_idle') : S.playerHero + '_idle'; if (S.anims.exists(k)) S.player.play(k, true); } catch (e) {} };
  // usarla de verdad, como con su tecla pero sin costo ni espera
  const usar = (S, id) => {
    const E = EQ(), H = HB().HACER || {}, B = E.BASE && E.BASE[id];
    S.lastSpinTime = 0; S.lastRainTime = 0; if (S._ckCdBase) S._ckCdBase[id] = 0; if (S._ckCd) S._ckCd[id] = 0;
    if (B && B.usar) { B.usar(S, 'R'); return true; }
    let ms;
    if (E.hacerBase && E.hacerBase[id]) ms = E.hacerBase[id](S);
    else if (H[id]) { try { E.texturas && E.texturas(S); } catch (er) {} ms = H[id](S); }
    else return false;
    if (ms === -1 || ms < 0) return false;
    if (ms > 0) { S.isAttacking = true; S.player.setVelocity(0, 0); S.time.delayedCall(ms, () => { S.isAttacking = false; if (!S.isDead && S.player.active) idle(S); }); }
    return true;
  };
  const probarHeroe = (S, solo) => {
    const id = st.hab, cambia = S.playerHero !== heroeDe(id); cambiarHeroe(S, heroeDe(id));
    S.time.delayedCall(cambia ? 260 : 30, () => {
      try {
        if (S.isAttacking || S.isDashing || S.isSpinning) { avisar('esperá a que termine la anterior'); return; }
        if (S.maxStamina) S.stamina = S.maxStamina; S.updateStaminaBar && S.updateStaminaBar();
        const D = VX().DESPUES;
        if (solo) { if (id !== 'ataque' && D[id]) D[id](S); return; }
        if (id === 'ataque') { S.castFireball(); return; }
        if (!usar(S, id)) { D[id] && D[id](S); avisar('no se pudo usar acá: se ve sólo el efecto'); }
      } catch (e) { console.warn('[editor hab]', e); }
    });
  };
  const probarEfecto = S => {
    const k = st.ef, V = VX(); if (!V) return;
    let e = (S._ckEdCosas || []).find(vivo) || munieco(S);
    const g = e ? (SUELO.test(k) ? V.pie(e) : V.pecho(e)) : V.pie(S.player);
    const h = hojas()[k];
    const s = V.fx(S, k, g.x, g.y, { escala: 1 });
    if (s && h && h.loop) S.time.delayedCall(2200, () => { if (s.active) s.destroy(); });
  };
  // un estado de verdad, 4 segundos: al muñeco (los de los enemigos) o al héroe (los suyos)
  const probarEstado = S => {
    const k = st.est, D0 = DEF_EST[k]; if (!D0) return;
    const now = S.time.now, ms = 4000;
    if (D0.g === 'BUF') {
      if (S._ckBuf && S._ckBuf[k]) { try { S._ckBuf[k].destroy(); } catch (e) {} delete S._ckBuf[k]; }
      ({ escudo: () => { S._ckEscudo = { golpes: 2, hasta: now + ms }; }, furia: () => { S._ckFrenesi = now + ms; }, grito: () => { S._ckGrito = now + ms; }, bosque: () => { S._ckEspiritu = now + ms; } }[k] || (() => {}))();
      return;
    }
    const e = (S._ckEdCosas || []).find(vivo) || munieco(S); if (!e) return;
    if (e._ckSt && e._ckSt.fx[k]) { try { e._ckSt.fx[k].destroy(); } catch (er) {} delete e._ckSt.fx[k]; }
    ({ quemado: () => { e._ckFuego = { hasta: now + ms }; }, congelado: () => { e._ckHielo = now + ms; }, aturdido: () => { e._ckAturdido = now + ms; }, sangrando: () => { e._ckSangre = now + ms; }, lento: () => { e._ckLento = now + ms; }, marcado: () => { e._ckMarca = now + ms; } }[k] || (() => {}))();
  };
  const probar = (S, solo) => { if (st.tab === 'jefes') { if (esPfx(st.jefeHab)) probarJefe(S); else verJefe(S); } else if (st.tab === 'heroes') probarHeroe(S, solo); else if (st.tab === 'efectos') probarEfecto(S); else if (st.tab === 'estados') probarEstado(S); };

  // ================================================================== TODOS LOS JEFES y sus habilidades
  // (21/11, pedido: "me faltan los jefes npc, quiero que estén todos y que se vean sus habilidades también"). Los 15 jefes del
  // juego. Las habilidades nuevas (pfx_) se ven y se editan en el escenario como antes. Las demás están escritas en el código de
  // cada jefe (ck_jefes_especiales.js, ck_jefes_fases.js, ck_coliseo.js, ck_reino_criaturas.js, ck_mazmorra_final.js,
  // ck_garra_sombra.js): para verlas, el editor trae al jefe, la hace de verdad y la GRABA del juego (el lienzo del juego,
  // alrededor del jefe y el héroe, 20 cuadros por segundo); el escenario muestra la grabación con su línea de tiempo y se le
  // pueden marcar notas encima. Los números que esos archivos dejan a mano (vida, daño, cada cuánto, las fases) se editan.
  const ORDEN_JEFES = ['orc_warlord', 'werebear_jefe', 'necromancer', 'skeleton_great', 'orc_campeon', 'bestia_kragmor', 'cazador_ulrak', 'brujo_sello', 'demonio_sello',
    'demonio_j_ojo', 'demonio_j_sabueso', 'demonio_j_segadora', 'demonio_j_minotauro', 'demonio_j_martillo', 'demonio_j_caballero'];
  Object.assign(NOMBRE_JEFE, { orc_warlord: 'Grushak', werebear_jefe: 'Garra Negra', orc_campeon: 'Gorvak', bestia_kragmor: 'Kragmor', cazador_ulrak: 'Ulrak y Colmillo', demonio_j_martillo: 'Gromm', demonio_j_caballero: 'Morvane' });
  const TIPOS_ET = () => (typeof ENEMY_TYPES !== 'undefined' ? ENEMY_TYPES : {});
  const nomTipo = t => { const D = TIPOS_ET()[t]; return (D && D.name) || NOMBRE_JEFE[t] || t; };
  // [id, nombre, qué hace, cómo se hace (pelea | esp | col | rc | mz | fase), qué llama, cuánto grabar, más]
  const Hb = (id, n, d, k, f, ms, x) => Object.assign({ id, n, d, k, f, ms: ms || 3400 }, x || {});
  const CATALOGO = {
    orc_warlord: [Hb('pelea', 'Golpes y escudo', 'Su hachazo de cerca; a veces para tus golpes con el escudo. Llama orcos acorazados cada tanto.', 'pelea', null, 5500),
      Hb('enojo', 'Enojo y embestida (a la mitad de la vida)', 'Se pone rojo, se mueve y pega más rápido, llama a dos orcos y empieza a embestir como el jabalí.', 'fase', 0.49, 6000, { fase: 'GRUSHAK', campos: ['enojo'] }),
      Hb('pisoton', 'Arroja el hacha (al 25 % de la vida)', 'Marca en rojo donde estás y arroja el hacha girando: se clava en el piso (lo parte) y va a buscarla, sin hacha en la mano. Cada 7 s.', 'fase', 0.24, 6500, { fase: 'GRUSHAK', campos: ['pisoton', 'cada', 'aviso', 'radio', 'dano'] })],
    werebear_jefe: [Hb('pelea', 'Zarpazos', 'Se agacha (cada vez un tiempo distinto, con más anticipación) y se tira encima con un zarpazo de garra y una onda de polvo; a veces encadena otro.', 'pelea', null, 5000),
      Hb('aullido', 'Aullido', 'Aúlla con los brazos abiertos: te deja lento.', 'esp', 'aullido'), Hb('salto', 'Salto', 'Si te alejás, se agacha y salta hacia donde estás; la sombra en el piso marca dónde cae y el piso se parte en sus pies.', 'esp', 'salto', 3800),
      Hb('zarpazo2', 'Zarpazo fuerte', 'Se carga, pega con peso (frena un instante) y deja zarpazos y polvo. Saca 2 corazones.', 'esp', 'zarpazo2'),
      Hb('sombra', 'Sombra', 'Se funde con la oscuridad y aparece de golpe a tu espalda. Sólo donde hay penumbra (de noche o en la cueva).', 'esp', 'sombra', 4000),
      Hb('furia', 'Rugido y frenesí (a la mitad de la vida)', 'Ruge 2 s (ondas, te empuja lejos), llama a dos huargos y recién después ataca, más seguido.', 'fase', 0.49, 5500, { fase: 'GARRA', campos: ['enojo'] })],
    necromancer: [Hb('pelea', 'Bastonazo, hechizos y muertos', 'De cerca, el bastón; de lejos, el hechizo que cae donde estás. Levanta esqueletos cada tanto.', 'pelea', null, 6500),
      Hb('velo', 'Velo de niebla (al 50 % y al 20 %)', 'Se vuelve intangible mientras sus muertos estén en pie; cuando caen (o se acaba el tiempo) queda aturdido y recibe más daño.', 'fase', 0.49, 6500, { fase: 'NIGRO', campos: ['corte1', 'corte2', 'maximo', 'aturde'] })],
    skeleton_great: [Hb('pelea', 'Golpes', 'Sus golpes de cerca con el arma.', 'pelea', null, 5000), Hb('tierra', 'Golpe a la tierra', '1,1 s levantando el arma (polvo de hueso que se junta); golpea el piso: grietas, escombros y astillas de hueso.', 'esp', 'tierra')],
    orc_campeon: [Hb('pelea', 'Tajo', 'El golpe común, un tajo limpio sin onda (amarillo: se para con C).', 'pelea', null, 5000), Hb('salto', 'Salto aplastante', 'Se agacha 1 s juntando polvo, marca un círculo rojo donde estás, salta y cae ahí partiendo el piso.', 'col', 'salto', 3000),
      Hb('escudo', 'Muro de escudo', 'Se pone en guardia 1,2 s (de frente no le entra nada) y arremete con el escudo.', 'col', 'escudo', 3500),
      Hb('cuchilla', 'Cuchilla giratoria', 'Tira una cuchilla orca curva, que va y vuelve (amarillo). Desde la mitad de la vida.', 'col', 'cuchilla', 3500)],
    bestia_kragmor: [Hb('pelea', 'Puñetazo', 'Su golpe común (amarillo): parte el piso con polvo, grietas y piedritas.', 'pelea', null, 5000), Hb('embestida', 'Embestida', 'Marca una franja hacia vos y carga en línea recta dejando pisadas que quiebran el piso; si se da contra la pared queda atontado.', 'col', 'embestida', 3800),
      Hb('sismo', 'Golpe sísmico', 'Golpea el piso (se parte) y salen tres ondas de piedras y polvo que lastiman al pasar.', 'col', 'sismo', 3800), Hb('piedras', 'Lluvia de piedras', 'Golpea el piso, sale una roca, la agarra, la sube al pecho y te la arroja; al caer se parte y tres pedazos caen alrededor. Desde la mitad de la vida.', 'col', 'piedras', 3500)],
    cazador_ulrak: [Hb('pelea', 'Lanzazo', 'Su golpe común (amarillo): la estocada con su destello, sin onda.', 'pelea', null, 5000), Hb('andanada', 'Andanada', 'Se aleja, apunta (tres líneas) y tira tres lanzas en abanico.', 'col', 'andanada', 3500),
      Hb('carga', 'Carga del huargo', 'Cruza la arena de punta a punta dos veces, con un eco de velocidad.', 'col', 'cargaHuargo', 4500), Hb('aullido', 'Aullido', 'No llama huargos: se pone más rápido y recibe la mitad del daño unos segundos. Desde la mitad de la vida.', 'col', 'aullido', 3200)],
    brujo_sello: [Hb('pelea', 'Bastonazo, hechizos y diablillos', 'De cerca, el bastón; de lejos, el hechizo que cae donde estás; llama diablillos. En su arena, además, desaparece en humo y aparece en otro lado.', 'pelea', null, 6000)],
    demonio_sello: [Hb('pelea', 'Zarpazos', 'Sus zarpazos, que se avisan.', 'pelea', null, 5000), Hb('lluvia', 'Lluvia de fuego', 'Marcas rojas tenues (sin borde) donde caen bolas de fuego con estela; estallan y dejan fuego unos segundos.', 'mz', 'lluvia', 2400), Hb('onda', 'Onda de fuego', 'Un anillo de fuego de partículas que se abre (sin la onda roja del piso): se salta con el paso rápido o alejándose.', 'mz', 'onda', 2600)],
    demonio_j_ojo: [Hb('pelea', 'Mirada y rayos', 'Sus ataques de siempre (de cerca y a distancia).', 'pelea', null, 5000), Hb('corona', 'Rayos y corona', 'Se carga 1,6 s (energía, contorno rojo, el aro que se cierra) y dispara rayos largos que cruzan el lugar.', 'rc', 'corona', 3500)],
    demonio_j_sabueso: [Hb('pelea', 'Zarpazos', 'Sólo zarpazos (sin la onda roja). No llama perros: al 66 % y al 33 % se le desprende uno más chico, y cada uno se parte en dos al morir.', 'pelea', null, 4500), Hb('embestida', 'Embestida', 'Toma carrera, embiste y termina con un mordisco.', 'rc', 'embestida', 3500)],
    demonio_j_segadora: [Hb('pelea', 'Guadañazos', 'Sus golpes de guadaña.', 'pelea', null, 4500), Hb('parpadeo', 'Se esfuma', 'Se esfuma y aparece a tus espaldas.', 'rc', 'parpadeo', 3500)],
    demonio_j_minotauro: [Hb('pelea', 'Hachazos', 'Sus golpes de cerca.', 'pelea', null, 4500), Hb('embestida', 'Embestida', 'La embestida, más pesada: si te alcanza te empuja lejos.', 'rc', 'embestida', 3500)],
    demonio_j_martillo: [Hb('pelea', 'Martillazos', 'Sus golpes de cerca.', 'pelea', null, 4500), Hb('onda', 'Martillazo de fuego', 'Levanta el martillo y lo sostiene; al golpear, un anillo de fuego y una onda de partículas de fuego.', 'rc', 'onda', 3500)],
    demonio_j_caballero: [Hb('pelea', 'Espadazos', 'Sus golpes de cerca.', 'pelea', null, 4500), Hb('pilares', 'Pilares de fuego', 'Clava la espada y abre pilares de fuego hasta vos (avisan con brasas, sin círculos).', 'rc', 'pilares', 4000)]
  };
  // (21/11, tarde: "coloca también de los npc enemigos y jefes todas sus habilidades, lo que pueden hacer y golpear") los
  // enemigos comunes: su golpe (o lo que tiran), lo que llaman, y su papel de ck_roles.js (embestida, escudo, tirador, aullido)
  const NOM_ESP = { zarpazo1: 'Zarpazo', zarpazo2: 'Zarpazo fuerte', giro: 'Giro con el hacha', tierra: 'Golpe a la tierra', aullido: 'Aullido', salto: 'Salto', sombra: 'Sombra' };
  const DESC_ESP = { zarpazo1: 'Un zarpazo de cerca, que se avisa.', giro: 'Gira con el hacha y golpea todo alrededor.', tierra: 'Golpea el piso y lastima alrededor.' };
  const habsEnemigo = t => {
    const D = TIPOS_ET()[t] || {}, R = window.CK_ROLES, rol = R && R.ROLES && R.ROLES[t], l = [];
    const que = [D.ranged ? (D.meleeToo ? 'de cerca te pega y de lejos te tira' : 'te tira desde lejos') : 'te pega de cerca', D.summon ? 'llama a otros cada tanto' : '', D.block ? 'a veces para tus golpes' : ''].filter(Boolean).join('; ');
    l.push(Hb('pelea', D.ranged ? (D.meleeToo ? 'Golpe y disparo' : 'Disparo') : 'Golpe', 'Lo que hace siempre: ' + que + '.', 'pelea', null, 4500));
    if (rol === 'carga') l.push(Hb('carga', 'Embestida', 'De lejos se planta, rasca el piso, brilla en naranja y sale disparado en línea recta; si choca contra algo queda aturdido.', 'rol', 'carga', 3000, { rolN: 'CARGA' }));
    if (rol === 'escudo') l.push(Hb('escudo', 'Escudo', 'Para los golpes que le vienen de frente; al tercero (o a un golpe pesado, o a una parada tuya justo) se le rompe la guardia.', 'pelea', null, 4500, { rolN: 'ESCUDO' }));
    if (rol === 'tirador') l.push(Hb('tirador', 'Tirador', 'Si te acercás a menos de 100 px, retrocede para volver a tirarte.', 'pelea', null, 4500, { rolN: 'TIRADOR' }));
    if (rol === 'aullido' || rol === 'grito') l.push(Hb('aullido', rol === 'grito' ? 'Grito de guerra' : 'Aullido', 'La primera vez que te ve se frena, aúlla y avisa a los suyos cerca, que van más rápido unos segundos.', 'rol', 'aullido', 2600, { rolN: 'AULLA' }));
    ((window.CK_ESPECIALES && CK_ESPECIALES.PLAN[t]) || []).forEach(f => { if (!/^pfx_/.test(f[0])) l.push(Hb(f[0], NOM_ESP[f[0]] || f[0], DESC_ESP[f[0]] || 'Un golpe especial.', 'esp', f[0])); });
    return l;
  };
  const FAMILIAS = [['Orcos', t => /^orc/.test(t)], ['No muertos', t => /^(skeleton|zombie|ghost|fantasma)/.test(t)], ['Bestias', t => /^(slime|bat|were|warg|boar|aranita|lobo|oso)/.test(t)], ['Demonios', t => /^(demonio|golem)/.test(t)], ['Otros', () => true]];
  // las habilidades de un jefe: las de su código + las nuevas de pixelfx
  const habsDe = t => {
    const l = (CATALOGO[t] || habsEnemigo(t)).slice(), J = JP();
    if (J) Object.keys(J.DEF).forEach(k => { if (J.DEF[k].jefe === t) l.push(Hb(k, J.DEF[k].nombre, 'Habilidad nueva (pixelfx): se ve y se edita en el escenario.', 'pfx', k)); });
    return l;
  };
  const esPfx = id => !!(JP() && JP().DEF[id]);
  const habSel = () => habsDe(st.jefeTipo).find(h => h.id === st.jefeHab) || habsDe(st.jefeTipo)[0];
  const claveJefe = () => esPfx(st.jefeHab) ? st.jefeHab : st.jefeTipo + ':' + st.jefeHab;

  // ---------------------------------------------------------------- números que se pueden tocar
  const DEF_TIPO = {}, DEF_ESP = {}, DEF_FASE = {};
  const leer = (o, ruta) => ruta.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const escribir = (o, ruta, v) => { const r = ruta.split('.'), u = r.pop(), d = r.reduce((a, k) => (a == null ? undefined : a[k]), o); if (d != null) d[u] = v; };
  const CAMPOS_T = ['hp', 'dmg', 'cd', 'hitAt', 'reach', 'speed', 'block', 'summon.every', 'summon.max', 'ranged.range', 'ranged.speed'];
  const aplicarTipo = t => {
    const D = TIPOS_ET()[t]; if (!D) return;
    if (!DEF_TIPO[t]) { DEF_TIPO[t] = {}; CAMPOS_T.forEach(c => { const v = leer(D, c); if (v != null) DEF_TIPO[t][c] = v; }); }
    const a = AJ.tipos[t] || {};
    Object.keys(DEF_TIPO[t]).forEach(c => escribir(D, c, a[c] != null ? a[c] : DEF_TIPO[t][c]));
  };
  const aplicarEsp = id => {
    const [t, k] = id.split(':'), E = window.CK_ESPECIALES, f = E && E.PLAN[t] && E.PLAN[t].find(x => x[0] === k); if (!f) return;
    if (!DEF_ESP[id]) DEF_ESP[id] = { cada: f[1], dmin: f[2], dmax: f[3] };
    const a = Object.assign({}, DEF_ESP[id], AJ.especiales[id] || {}); f[1] = a.cada; f[2] = a.dmin; f[3] = a.dmax;
  };
  const faseObj = n => window.CK_JEFES_FASES && CK_JEFES_FASES[n];
  const leerFase = (F, c) => c === 'corte1' ? F.cortes && F.cortes[0] : c === 'corte2' ? F.cortes && F.cortes[1] : F[c];
  const aplicarFase = n => {
    const F = faseObj(n); if (!F) return;
    if (!DEF_FASE[n]) DEF_FASE[n] = JSON.parse(JSON.stringify(F));
    const a = AJ.fases[n] || {}, D = DEF_FASE[n];
    Object.keys(D).forEach(c => { if (c !== 'cortes') F[c] = a[c] != null ? a[c] : D[c]; });
    if (D.cortes) F.cortes = [a.corte1 != null ? a.corte1 : D.cortes[0], a.corte2 != null ? a.corte2 : D.cortes[1]];
  };
  const DEF_ROL = {};
  const aplicarRol = n => {
    const R = window.CK_ROLES, O = R && R[n]; if (!O) return;
    if (!DEF_ROL[n]) DEF_ROL[n] = Object.assign({}, O);
    const a = AJ.roles[n] || {}; Object.keys(DEF_ROL[n]).forEach(c => { O[c] = a[c] != null ? a[c] : DEF_ROL[n][c]; });
  };
  const CAMPOS_ROL = { CARGA: ['min', 'max', 'prep', 'corre', 'vel', 'cd', 'aturde'], ESCUDO: ['aguante', 'rota', 'quieto', 'vuelve'], TIRADOR: ['cerca'], AULLA: ['radio', 'quieto', 'mas', 'dura'] };
  const aplicarJefesTodo = () => {
    Object.keys(AJ.roles || {}).forEach(aplicarRol);
    Object.keys(AJ.tipos || {}).forEach(aplicarTipo);
    Object.keys(AJ.especiales || {}).forEach(aplicarEsp);
    Object.keys(AJ.fases || {}).forEach(aplicarFase);
  };

  // ---------------------------------------------------------------- traer al jefe (cualquiera) y LEER lo que hace
  // (21/11, pedido: "las habilidades me muestran una preview en video, quiero poder editar; lo de los jefes y enemigos también,
  // no que grabes una preview"). Ya no se graba un video: el editor trae al personaje, le hace hacer la habilidad una vez y LEE
  // lo que el juego dibuja, cuadro a cuadro: cada cosa nueva (dibujos con su cuadro de animación, figuras, dibujos a mano y
  // textos: dónde está, tamaño, giro, opacidad, color, luz, profundidad), el jefe y el héroe, y el temblor de la cámara. Eso se
  // agrupa en CAPAS (lo que nace junto, de la misma función del código y con el mismo dibujo: "Grietas", "Escombros ×12",
  // "Marca en el piso"...) y el escenario lo vuelve a dibujar con los cambios de cada capa: cuándo sale, cortarla al principio
  // o al final, correrla, tamaño, opacidad, color, luz, por delante o por detrás del jefe, o quitarla (AJ.capasJ).
  // "▶ en el juego" la hace de verdad con esos cambios (en el juego sólo se puede atrasar, no adelantar). Para que quede
  // siempre así, "Exportar" lleva cada capa con la función y el archivo de donde sale (jefes_capas).
  const LECT = {};                                              // tipo:habilidad → lo leído (sólo en memoria)
  const jefeTipoDePrueba = (S, t) => (S._ckEdCosas || []).find(e => vivo(e) && e.type === t);
  const traerTipo = (S, t, lejos) => {
    quitarPrueba(S); S._ckPermitirBestias = true;
    const partes = new Set(), junto = o => partes.add(o); S.sys.events.on('addedtoscene', junto);
    const p = S.player, e = S.spawnEnemy(p.x - (lejos || 90), p.y - 4, t);
    setTimeout(() => S.sys.events.off('addedtoscene', junto), 900);
    if (!e) { S.sys.events.off('addedtoscene', junto); avisar('no se pudo traer a ' + nomTipo(t)); return null; }
    e._ckEdPartes = partes;
    quieto(S, e); e.setFlipX(false); S._ckEdCosas = [e];
    if (e.nameTag) e.nameTag.setVisible(false);
    return e;
  };
  const hacerHab = (S, e, h) => {
    const now = S.time.now; e.state = 'chase'; e._ckEsp = 0; e.isAttacking = false;
    if (st.invencible && window.CK_PANEL_PRUEBAS) CK_PANEL_PRUEBAS.st.invencible = true;
    if (h.k === 'pelea') { e._ckEdPelea = now + h.ms; e.nextSummon = now + 600; return true; }
    e._ckEdProbando = now + h.ms;
    try {
      if (h.k === 'fase') { e.hp = Math.floor(e.maxHp * h.f); return true; }
      if (h.k === 'esp') { const E = window.CK_ESPECIALES; if (E && E.HACER[h.f]) { E.HACER[h.f](S, e); return true; } }
      if (h.k === 'col') { const C2 = window.CK_COLISEO; if (C2 && C2.hab && C2.hab[h.f]) { e._ckc = e._ckc || { prox: 0, mitad: true, ultimo: '' }; e._ckc.mitad = true; C2.hab[h.f](S, e); return true; } }
      if (h.k === 'rc') { const R2 = window.CK_REINO_CRIATURAS; if (R2 && R2.ESP && R2.ESP[h.f]) { R2.ESP[h.f](S, e); return true; } }
      if (h.k === 'mz') { const M = window.CK_MZ_FINAL; if (M && M[h.f]) { M[h.f](S, e); return true; } }
      if (h.k === 'pfx') { const E = window.CK_ESPECIALES; if (E && E.HACER[h.f]) { E.HACER[h.f](S, e); return true; } }
      if (h.k === 'rol') {
        const R = window.CK_ROLES;
        if (h.f === 'carga' && R && R.empezarCarga) { R.empezarCarga(S, e); return true; }
        if (h.f === 'aullido' && S.alertEnemy) { e.state = 'idle'; e._ckAullo = false; S.alertEnemy(e); return true; }
      }
    } catch (er) { console.warn('[editor hab] jefe', h.id, er); }
    avisar('esta habilidad no está cargada acá'); return false;
  };
  // al terminar: lo que llamó (muertos, orcos, huargos) se va y el jefe vuelve a estar entero y quieto
  const terminarPrueba = (S, e, antes) => {
    try { S.enemies.getChildren().slice().forEach(o => { if (!antes.has(o) && o !== e && vivo(o)) { if (o.hpBar) o.hpBar.destroy(); if (o.nameTag) o.nameTag.destroy(); o.destroy(); } }); } catch (er) {}
    if (vivo(e)) { e._ckEdPelea = 0; e._ckEdProbando = 0; e.hp = e.maxHp; }
  };

  // ---- quién dibujó cada cosa: la primera función de la pila que no es de Phaser ni del editor
  const creador = pila => {
    const l = String(pila || '').split('\n'); let r = null;
    for (let i = 1; i < l.length; i++) {
      const s = l[i]; if (/phaser|ck_editor_habilidades|<anonymous>:|\(native\)/i.test(s)) continue;
      const m = s.match(/at\s+(?:new\s+)?([^\s(]+)\s+\((.*?):(\d+):\d+\)/) || s.match(/at\s+()(.*?):(\d+):\d+/); if (!m) continue;
      const arch = (m[2] || '').split('/').pop().split('?')[0], fn0 = (m[1] || '').split('.').pop().replace(/^<|>$/g, ''), fn = /^(anonymous|Object|eval)$/.test(fn0) ? '' : fn0;
      if (!r) r = { fn, arch, lin: +m[3], noms: [] };
      if (fn && r.noms.length < 8) r.noms.push(fn);
    }
    return r || { fn: '', arch: '', lin: 0, noms: [] };
  };
  // (los enemigos cambian su "type" por el suyo: 'orc', 'skeleton_great'...; por eso se mira la clase)
  const conTextura = o => !!(o.frame && o.texture && window.Phaser && (o instanceof Phaser.GameObjects.Sprite || o instanceof Phaser.GameObjects.Image));
  const firma = (o, cr) => (cr.fn || cr.arch + ':' + cr.lin) + '|' + o.type + (conTextura(o) ? ':' + String(o.texture.key).replace(/[\d_]+$/, '') : '');
  // lo que nace junto (sin más de 120 ms entre uno y otro), de la misma función y con el mismo dibujo, es una capa
  const lote = (L, cnt, sig, ahora, o) => {
    const u = L[sig];
    if (u && ahora - u.t <= 120) { u.t = ahora; u.n++; return u; }
    cnt[sig] = (cnt[sig] || 0) + 1;
    return (L[sig] = { key: sig + '#' + cnt[sig], t: ahora, nace: ahora, ax: o.type === 'Graphics' ? null : o.x, ay: o.type === 'Graphics' ? null : o.y, n: 1 });
  };
  const cajaDe = (a, b) => ({ x0: Math.min(a.x, b.x) - 200, x1: Math.max(a.x, b.x) + 200, y0: Math.min(a.y, b.y) - 230, y1: Math.max(a.y, b.y) + 150 });
  const dentro = (o, c) => o.type === 'Graphics' || (o.x >= c.x0 && o.x <= c.x1 && o.y >= c.y0 && o.y <= c.y1);
  // el centro de un dibujo a mano (Graphics), para correrlo o agrandarlo desde ahí
  const centroCB = cb => {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const p = (x, y, r) => { r = r || 0; if (!isFinite(x) || !isFinite(y)) return; x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r); };
    for (let i = 0; i < (cb || []).length; i++) {
      const c = cb[i];
      if (c === 0) { p(cb[i + 1], cb[i + 2], cb[i + 3]); i += 7; } else if (c === 6) i += 3; else if (c === 7) i += 2;
      else if (c === 3) { p(cb[i + 1], cb[i + 2]); p(cb[i + 1] + cb[i + 3], cb[i + 2] + cb[i + 4]); i += 4; }
      else if (c === 10 || c === 11) { p(cb[i + 1], cb[i + 2]); p(cb[i + 3], cb[i + 4]); p(cb[i + 5], cb[i + 6]); i += 6; }
      else if (c === 4 || c === 5) { p(cb[i + 1], cb[i + 2]); i += 2; } else if (c === 16 || c === 17) i += 2; else if (c === 18) i += 1; else if (c === 21) i += 5; else if (c === 22) i += 6;
    }
    return x0 > x1 ? null : { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  };

  // ---- leer: cada cuadro, cómo está cada cosa
  const foto = (o, t, a0, ult) => {
    const s = { t, x: o.x - a0.x, y: o.y - a0.y, sx: o.scaleX, sy: o.scaleY, r: o.rotation || 0, a: o.alpha, v: o.visible ? 1 : 0, d: o.depth, bm: o.blendMode || 0 };
    if (o.flipX) s.fx = 1; if (o.flipY) s.fy = 1;
    if (conTextura(o)) {
      s.k = o.texture.key; s.fr = o.frame.name; s.ox = o.displayOriginX; s.oy = o.displayOriginY;
      if (o.isTinted) { s.ti = o.tintTopLeft; if (o.tintFill) s.tf = 1; }
    } else if (o.type === 'Graphics') {
      const cb = o.commandBuffer || [];
      s.cb = ult && ult.cb && ult.cb.length === cb.length && ult.cb.every((v, i) => v === cb[i]) ? ult.cb : cb.slice();
    } else if (o.type === 'Text') {
      const k = o.text + '|' + o.style.color + '|' + o.style.fontSize;
      s.im = ult && ult.imk === k ? ult.im : (() => { try { const c = document.createElement('canvas'); c.width = o.canvas.width; c.height = o.canvas.height; c.getContext('2d').drawImage(o.canvas, 0, 0); return c; } catch (e) { return null; } })();
      s.imk = k; s.w = o.width; s.h = o.height; s.ox = o.displayOriginX; s.oy = o.displayOriginY;
    } else if (o.isFilled !== undefined) {                               // figuras: elipse, círculo, rectángulo, polígono...
      s.ox = o.displayOriginX; s.oy = o.displayOriginY; s.fi = o.isFilled ? 1 : 0; s.fc = o.fillColor; s.fa = o.fillAlpha; s.st = o.isStroked ? 1 : 0; s.sc = o.strokeColor; s.sa = o.strokeAlpha; s.lw = o.lineWidth; s.cl = o.closePath ? 1 : 0;
      if (o.type === 'Rectangle') { s.w = o.width; s.h = o.height; }
      else if (o.type === 'Arc') { s.ra = o.radius; s.a0 = (o.startAngle || 0) * Math.PI / 180; s.a1 = (o.endAngle == null ? 360 : o.endAngle) * Math.PI / 180; s.ac = o.anticlockwise ? 1 : 0; }
      else s.pd = ult && ult.pdRef === o.pathData ? ult.pd : (o.pathData ? Array.from(o.pathData) : null);
      s.pdRef = o.pathData;
    } else s.no = 1;                                                     // algo que el editor no sabe dibujar
    return s;
  };
  const igual = (a, b) => b && a.v === b.v && a.x === b.x && a.y === b.y && a.sx === b.sx && a.sy === b.sy && a.r === b.r && a.a === b.a && a.d === b.d && a.fr === b.fr && a.ti === b.ti && a.cb === b.cb && a.im === b.im && a.pd === b.pd && a.fx === b.fx && a.bm === b.bm && a.fc === b.fc && a.sc === b.sc && a.ra === b.ra && a.w === b.w;
  const capturar = (S, e, h, clave, F) => {
    const p = S.player, V = VX(), pe = V.pie(e), a0 = { x: pe.x, y: pe.y }, caja = cajaDe(a0, V.pie(p));
    const C = { clave, ms: h.ms, nombre: h.n, cosas: {}, capas: [], temblor: [], fin: h.ms, a0, fondo: F || null };
    const antes = new Set(S.enemies.getChildren()), t0 = S.time.now, ids = new Map(), lotes = {}, cnt = {}, lim0 = Error.stackTraceLimit;
    let nid = 0, ultT = -99;
    const seguir = (o, quien, lt, cr) => { const id = ++nid; ids.set(o, id); C.cosas[id] = { id, tipo: o.type, quien, capa: lt ? lt.key : null, cr, nace: S.time.now - t0, muere: null, f: [] }; return id; };
    seguir(e, 'jefe'); seguir(p, 'heroe');
    (e._ckEdPartes || []).forEach(o => { if (o && o !== e && o.active && !ids.has(o)) seguir(o, 'parte'); });
    const nuevo = o => {
      try {
        if (!o || ids.has(o) || o === e || o === p || !dentro(o, caja)) return;
        const cr = creador(new Error().stack), lt = lote(lotes, cnt, firma(o, cr), S.time.now - t0, o);
        seguir(o, 'cosa', lt, cr);
      } catch (er) {}
    };
    Error.stackTraceLimit = 40;
    S.sys.events.on('addedtoscene', nuevo);
    const tomar = () => {
      const t = S.time.now - t0; if (t - ultT < 30) return; ultT = t;
      const fuera = new Set(); try { S.enemies.getChildren().forEach(x => { if (x.hpBar) fuera.add(x.hpBar); if (x.nameTag) fuera.add(x.nameTag); }); } catch (er) {}
      ids.forEach((id, o) => {
        const c = C.cosas[id]; if (c.muere != null) return;
        if (!o.active || !o.scene) { c.muere = t; return; }
        if (fuera.has(o) || o.scrollFactorX === 0) { c.fuera = 1; return; }
        const u = c.f[c.f.length - 1], s = foto(o, t, a0, u);
        if (c.quien === 'jefe' || c.quien === 'heroe') { const q = V.pie(o); s.px = q.x - a0.x; s.py = q.y - a0.y; }
        if (!igual(s, u) || c.quien === 'jefe' || c.quien === 'heroe') c.f.push(s);
      });
      const sh = S.cameras.main.shakeEffect; C.temblor.push({ t, f: sh && sh.isRunning ? (sh.intensity ? sh.intensity.x : 0.01) : 0 });
    };
    S.game.events.on('postrender', tomar);
    VP.leer = { clave }; VP.cuadro = null;
    const ok = hacerHab(S, e, h);
    setTimeout(() => {
      S.game.events.off('postrender', tomar); S.sys.events.off('addedtoscene', nuevo); Error.stackTraceLimit = lim0;
      terminarPrueba(S, e, antes);
      if (ok) { armarCapas(S, C); LECT[clave] = C; }
      VP.leer = null; VP.t = 0; VP.play = true; VP.cuadro = null;
      pintar();
    }, h.ms);
  };

  // ---- las capas: nombre, cuándo nace y muere, y su punto de apoyo
  const NOM_FN = { grieta: 'Grietas', escombros: 'Escombros', onda: 'Onda', ondaVoz: 'Onda del grito', zona: 'Marca en el piso', aro: 'Marca en el piso', carga: 'Brillo que junta', anticipar: 'Aviso (se agacha)',
    sombraCaida: 'Sombra donde cae', tajo: 'Tajo', estela: 'Estela', chispas: 'Chispas', flecha: 'Flecha', roca: 'Roca', rastro: 'Rastro', franjaViva: 'Franja de aviso', ondaViva: 'Onda que avanza',
    estallido: 'Estallido', createFloatingText: 'Texto', humo: 'Humo', puff: 'Humo', fx: 'Efecto', polvo: 'Polvo', marca: 'Marca', rayo: 'Rayo', brasa: 'Brasas', fuego: 'Fuego', spawnEnemy: 'Llama a',
    poner: 'Polvo de la onda', capa: 'Estallido', lento: 'Lento', pilar: 'Pilar', pilares: 'Pilares', corona: 'Corona', lluvia: 'Lluvia', parpadeo: 'Se esfuma', embestida: 'Embestida', sismo: 'Sismo',
    piedras: 'Piedras', andanada: 'Flechas', cuchilla: 'Cuchilla', salto: 'Salto', escudo: 'Escudo', aullido: 'Aullido', velo: 'Velo', grito: 'Grito', giro: 'Giro', golpeTierra: 'Golpe a la tierra' };
  const nomColor = c => {
    if (c == null) return '';
    const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx < 50) return 'negro'; if (mx - mn < 28) return mx > 200 ? 'blanco' : 'gris'; if ((mx - mn) / mx < 0.3) return mx > 160 ? 'claro' : 'pardo';
    let hu = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; hu = (hu * 60 + 360) % 360;
    return hu < 15 || hu >= 340 ? 'rojo' : hu < 40 ? (mx < 150 ? 'marrón' : 'naranja') : hu < 65 ? 'amarillo' : hu < 160 ? 'verde' : hu < 200 ? 'celeste' : hu < 255 ? 'azul' : hu < 290 ? 'violeta' : 'rosa';
  };
  const colorDe = (c, s) => {
    if (!s) return null;
    if (s.ti != null) return s.ti;
    if (s.fi) return s.fc; if (s.st) return s.sc;
    let mejor = null, vm = -1;                                         // en un dibujo a mano: el color más vivo que usa
    if (s.cb) for (let i = 0; i < s.cb.length; i++) {
      const c = s.cb[i] === 7 ? s.cb[i + 1] : s.cb[i] === 6 ? s.cb[i + 2] : null; if (c == null) continue;
      const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, v = Math.max(r, g, b) - Math.min(r, g, b) + Math.max(r, g, b) * 0.3; if (v > vm) { vm = v; mejor = c; }
    }
    return mejor;
  };
  const armarCapas = (S, C) => {
    const porK = {}, ene = new Set(); try { S.enemies.getChildren().forEach(x => ene.add(x.type)); } catch (er) {}
    Object.values(C.cosas).forEach(c => {
      if (c.muere == null) c.muere = C.fin;
      if (c.quien !== 'cosa' || c.fuera || !c.f.length || c.f.every(s => !s.v || s.no)) return;
      (porK[c.capa] = porK[c.capa] || []).push(c);
    });
    C.capas = Object.keys(porK).map(key => {
      const l = porK[key], c0 = l[0], s0 = c0.f.find(s => s.v) || c0.f[0], cr = c0.cr || {};
      let ax = s0.x, ay = s0.y;
      if (c0.tipo === 'Graphics') { const q = centroCB((c0.f.find(s => s.cb && s.cb.length) || s0).cb); ax = (q ? q.x : 0) + s0.x; ay = (q ? q.y : 0) + s0.y; }
      const tex = s0.k ? String(s0.k) : '', ef = /^ckfx_/.test(tex) ? tex.slice(5) : '';
      const fnN = (cr.noms || []).find(f => NOM_FN[f]);
      let nom = ef ? nomEf(ef) : (fnN && NOM_FN[fnN]) || (c0.tipo === 'Text' ? 'Texto' : c0.tipo === 'Graphics' ? 'Dibujo' : c0.tipo === 'Ellipse' ? 'Elipse' : c0.tipo === 'Arc' ? 'Círculos' : c0.tipo === 'Rectangle' ? 'Rectángulos' : tex ? 'Dibujo «' + tex.replace(/^ck[a-z]*_/, '') + '»' : c0.tipo);
      if (TIPOS_ET()[c0.tipo]) nom = 'Llama a ' + nomTipo(c0.tipo);
      const col = nomColor(colorDe(c0, (c0.tipo === 'Graphics' && c0.f.find(s => s.cb && s.cb.length)) || s0)); if (col && col !== 'negro' && !ef && !/Llama/.test(nom) && c0.tipo !== 'Text') nom += ' ' + col;
      if (c0.tipo === 'Text' && s0.imk) nom = 'Texto «' + s0.imk.split('|')[0].slice(0, 14) + '»';
      return { key, nombre: nom, n: l.length, ids: l.map(c => c.id), nace: Math.min(...l.map(c => c.nace)), muere: Math.max(...l.map(c => c.muere)), ax, ay, fn: cr.fn, arch: cr.arch, lin: cr.lin, tipo: c0.tipo };
    }).sort((a, b) => a.nace - b.nace || a.key.localeCompare(b.key));
    // nombres repetidos: qué es cada una y cuál vez
    const TIPO_N = { Arc: 'círculos', Rectangle: 'cuadraditos', Ellipse: 'elipses', Graphics: 'trazos', Sprite: 'dibujo', Image: 'dibujo', Text: 'texto' }, vistos = {};
    C.capas.forEach(L => { const otras = C.capas.filter(x => x.nombre === L.nombre); if (otras.some(x => x.tipo !== L.tipo)) L.nombre += ' (' + (TIPO_N[L.tipo] || L.tipo) + ')'; });
    C.capas.forEach(L => { vistos[L.nombre] = (vistos[L.nombre] || 0) + 1; if (vistos[L.nombre] > 1) L.nombre += ' · ' + vistos[L.nombre] + 'ª'; });
    // lo que se ve: para encuadrar
    let x0 = -40, x1 = 40, y0 = -70, y1 = 20;
    const sum = (x, y, r) => { x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r); };
    Object.values(C.cosas).forEach(c => { if (c.quien === 'jefe' || c.quien === 'heroe') c.f.forEach((s, i) => { if (!(i % 10)) { sum(s.x, s.y - 40, 30); sum(s.px || s.x, s.py || s.y, 10); } }); });
    C.capas.forEach(L => sum(L.ax, L.ay, 24));
    const cj = { x0: -260, x1: 260, y0: -260, y1: 160 };
    C.b = { x0: Math.max(cj.x0, x0), x1: Math.min(cj.x1, x1), y0: Math.max(cj.y0, y0), y1: Math.min(cj.y1, y1) };
    // hasta cuándo pasa algo: lo último que se ve de las capas o lo último que se mueve el personaje (su animación, dónde está)
    let ult = 0;
    Object.values(C.cosas).forEach(c => {
      if (c.quien === 'cosa' && !c.fuera && c.f.length) ult = Math.max(ult, c.muere);
      if (c.quien === 'jefe') for (let i = 1; i < c.f.length; i++) { const a = c.f[i], b = c.f[i - 1]; if (a.k !== b.k || (a.fr !== b.fr && !/_idle$/.test(String(a.k))) || Math.abs(a.x - b.x) > 0.5 || Math.abs(a.y - b.y) > 0.5) ult = Math.max(ult, a.t); }
    });
    C.fin = Math.max(600, Math.min(C.ms, ult + 400));
  };

  // ---- los cambios de cada capa (AJ.capasJ[tipo:habilidad][capa])
  const edDe = (clave, key) => (AJ.capasJ[clave] && AJ.capasJ[clave][key]) || {};
  const edCap = key => { const c = claveJefe(); AJ.capasJ[c] = AJ.capasJ[c] || {}; return (AJ.capasJ[c][key] = AJ.capasJ[c][key] || {}); };
  const limpiarCap = () => {
    const c = claveJefe(), A = AJ.capasJ[c]; if (!A) return;
    Object.keys(A).forEach(k => {
      const e = A[k]; Object.keys(e).forEach(x => { if (e[x] == null || e[x] === false) delete e[x]; });
      if (e.esc === 1) delete e.esc; if (e.alfa === 1) delete e.alfa; ['dt', 'sa', 'dx', 'dy'].forEach(x => { if (e[x] === 0) delete e[x]; });
      if (!Object.keys(e).length) delete A[k];
    });
    if (!Object.keys(A).length) delete AJ.capasJ[c];
  };
  const capaLeida = key => { const C = LECT[claveJefe()]; return C && C.capas.find(L => L.key === key); };
  const vidaCapa = L => Math.max(30, L.muere - L.nace);

  // ---- en el juego, con los cambios: lo que nace mientras la hace se reconoce igual que al leerla y se corre, agranda,
  // atrasa, corta o esconde al dibujarse (las animaciones y movimientos de cada cosa se frenan mientras está atrasada)
  const envolver = (S, e, o, ed, lt, t0) => {
    const dtp = Math.max(0, ed.dt || 0), nace = t0 + lt.nace;
    const vis = () => { if (ed.fuera) return false; const v = S.time.now - nace - dtp; if ((dtp || ed.sa) && v < (ed.sa || 0)) return false; if (ed.co != null && v > ed.co) return false; return true; };
    const w0 = o.willRender; o.willRender = function (cam) { return vis() && w0.call(this, cam); };
    if (dtp) {
      const quietos = new Set(); let anim = false;
      const frenar = () => { try { S.tweens.getTweensOf(o).forEach(tw => { if (!tw.isPaused()) { tw.pause(); quietos.add(tw); } }); if (o.anims && o.anims.isPlaying) { o.anims.pause(); anim = true; } } catch (er) {} };
      S.time.delayedCall(0, frenar); S.time.delayedCall(40, frenar);
      S.time.delayedCall(dtp, () => { quietos.forEach(tw => { try { tw.resume(); } catch (er) {} }); try { if (anim && o.anims) o.anims.resume(); } catch (er) {} });
    }
    const esc = ed.esc || 1;
    if (ed.dx || ed.dy || esc !== 1 || (ed.alfa != null && ed.alfa !== 1) || ed.col != null || ed.luz) ['renderWebGL', 'renderCanvas'].forEach(nm => {
      const r0 = o[nm]; if (typeof r0 !== 'function') return;
      o[nm] = function (rd, src, cam, pm) {
        const x = src.x, y = src.y, sx = src.scaleX, sy = src.scaleY, a = src.alpha, bm = src.blendMode; let ti = null, fc = null, sc = null;
        try {
          if (lt.ax == null && src.type === 'Graphics') { const q = centroCB(src.commandBuffer); if (q) { lt.ax = q.x + x; lt.ay = q.y + y; } }
          const ax = lt.ax != null ? lt.ax : x, ay = lt.ay != null ? lt.ay : y;
          src.x = ax + (x - ax) * esc + (ed.dx || 0); src.y = ay + (y - ay) * esc + (ed.dy || 0);
          if (esc !== 1) { src.scaleX = sx * esc; src.scaleY = sy * esc; }
          if (ed.alfa != null && ed.alfa !== 1) src.alpha = a * ed.alfa;
          if (ed.luz) src.blendMode = 1;
          if (ed.col != null) {
            if (src.isFilled !== undefined) { fc = src.fillColor; sc = src.strokeColor; src.fillColor = ed.col; src.strokeColor = ed.col; }
            else if (src.setTint && src.tintTopLeft !== undefined) { ti = [src.tintTopLeft, src.tintTopRight, src.tintBottomLeft, src.tintBottomRight, src.tintFill]; src.setTint(ed.col); }
          }
        } catch (er) {}
        r0.call(this, rd, src, cam, pm);
        try {
          src.x = x; src.y = y; if (esc !== 1) { src.scaleX = sx; src.scaleY = sy; } if (src.alpha !== a) src.alpha = a; if (src.blendMode !== bm) src.blendMode = bm;
          if (ti) { src.tintTopLeft = ti[0]; src.tintTopRight = ti[1]; src.tintBottomLeft = ti[2]; src.tintBottomRight = ti[3]; src.tintFill = ti[4]; }
          if (fc != null) { src.fillColor = fc; src.strokeColor = sc; }
        } catch (er) {}
      };
    });
    if (ed.lado === 'delante' || ed.lado === 'detras') {
      const pon = () => { if (!o.active || !vivo(e)) { S.events.off('update', pon); return; } const d = e.depth + (ed.lado === 'delante' ? 3 : -3); if (o.depth !== d) o.setDepth(d); };
      S.time.delayedCall(0, pon); S.events.on('update', pon);
    }
  };
  const conCambios = (S, e, clave, ms) => {
    const A = AJ.capasJ[clave]; if (!A || !Object.keys(A).length) return () => {};
    const V = VX(), t0 = S.time.now, caja = cajaDe(V.pie(e), V.pie(S.player)), lotes = {}, cnt = {}, lim0 = Error.stackTraceLimit;
    const nuevo = o => {
      try {
        if (!o || o === e || o === S.player || !dentro(o, caja)) return;
        const lt = lote(lotes, cnt, firma(o, creador(new Error().stack)), S.time.now - t0, o), ed = A[lt.key];
        if (ed) envolver(S, e, o, ed, lt, t0);
      } catch (er) {}
    };
    Error.stackTraceLimit = 40; S.sys.events.on('addedtoscene', nuevo);
    let on = true; const fin = () => { if (!on) return; on = false; S.sys.events.off('addedtoscene', nuevo); Error.stackTraceLimit = lim0; };
    setTimeout(fin, ms + 200); return fin;
  };

  // ---- leer (la primera vez sola, o con "⟳ Leer de nuevo") y hacerla en el juego con los cambios
  const prepararJefe = (S, h, listo) => {
    const t = st.jefeTipo;
    let e = h.k !== 'fase' && jefeTipoDePrueba(S, t);
    if (!e) e = traerTipo(S, t, h.k === 'pelea' || h.k === 'fase' ? 80 : 110);
    if (!e) return false;
    const espera = Math.max(60, 950 - (S.time.now - (e._ckEdNace || 0)));
    S.time.delayedCall(espera, () => listo(e));
    return true;
  };
  const leerJefe = S => {
    const h = habSel(); if (!h) return;
    if (h.k === 'pfx') { st.jefe = h.id; probarJefe(S); return; }
    if (VP.leer) { avisar('esperá: está leyendo'); return; }
    const clave = claveJefe();
    VP.leer = { clave }; VP.cuadro = null;
    if (!prepararJefe(S, h, e => {
      if (!vivo(e)) { VP.leer = null; pintar(); return; }
      if (!esJefe(st.jefeTipo)) { capturar(S, e, h, clave); return; }                   // los jefes: también el lugar de verdad
      pedirFondo(S, F => { if (vivo(e)) capturar(S, e, h, clave, F); else { VP.leer = null; pintar(); } });
    })) VP.leer = null;
  };
  const verJefe = S => {
    const h = habSel(); if (!h) return;
    if (h.k === 'pfx') { st.jefe = h.id; probarJefe(S); return; }
    if (VP.leer) { avisar('esperá: está leyendo'); return; }
    const clave = claveJefe();
    prepararJefe(S, h, e => {
      if (!vivo(e)) return;
      const antes = new Set(S.enemies.getChildren()), fin = conCambios(S, e, clave, h.ms);
      if (!hacerHab(S, e, h)) { fin(); return; }
      setTimeout(() => terminarPrueba(S, e, antes), h.ms);
    });
  };

  // ---------------------------------------------------------------- el escenario de una habilidad leída del juego
  const armarLeida = () => {
    const t = st.jefeTipo, h = habSel(), clave = claveJefe(), C = LECT[clave];
    const nada = { espera: true, leyendo: !!VP.leer, it: [], man: [], filas: [{ txt: h ? h.n : '' }], actores: [{ tipo: t, x: 0, y: 0, flip: false, ataque: false }], centro: { x: 0, y: -14 } };
    if (VP.leer || !C) return nada;
    if (!C.capas.some(L => L.key === st.capJ)) st.capJ = C.capas[0] ? C.capas[0].key : null;
    const it = [{ tipo: 'cuerpo', t0: 0, dur: C.fin, fila: 0 }], filas = [{ txt: TIPOS_ET()[t] && ORDEN_JEFES.includes(t) ? 'el jefe' : 'el personaje' }], man = [];
    C.capas.forEach((L, i) => {
      const ed = edDe(clave, L.key), vida = vidaCapa(L), sa = ed.sa || 0, co = ed.co != null ? ed.co : vida;
      filas.push({ txt: (ed.fuera ? '✕ ' : (i + 1) + ' ') + L.nombre, cap: L.key });
      it.push({ tipo: 'capJ', t0: Math.max(0, L.nace + (ed.dt || 0) + sa), dur: Math.max(30, co - sa), fila: i + 1, fuera: !!ed.fuera, drag: { cap: L.key }, cortes: { cap: L.key } });
      const vivaAhora = VP.t >= L.nace + (ed.dt || 0) + sa && VP.t <= L.nace + (ed.dt || 0) + co;
      if (!ed.fuera && (vivaAhora || L.key === st.capJ)) {
        const esc = ed.esc || 1;
        man.push({ tipo: 'capJ', ci: i, key: L.key, x: L.ax + (ed.dx || 0), y: L.ay + (ed.dy || 0), txt: String(i + 1), sel: L.key === st.capJ, esc });
      }
    });
    return { cap: C, clave, it, man, filas, actores: [], fondo: esJefe(t) && C.fondo ? { F: C.fondo, ox: C.a0.x, oy: C.a0.y } : null, centro: { x: (C.b.x0 + C.b.x1) / 2, y: (C.b.y0 + C.b.y1) / 2 } };
  };
  // dibujar una cosa leída, como la dibuja Phaser (con los cambios de su capa)
  const FRAMES = new Map(), TINTAS = new Map();
  const frameDe = (S, k, f) => { const id = k + '|' + f; if (!FRAMES.has(id)) { let fr = null; try { fr = S.textures.getFrame(k, f); } catch (e) {} FRAMES.set(id, fr); } return FRAMES.get(id); };
  const tintado = (fr, col, llena) => {
    const id = fr.texture.key + '|' + fr.name + '|' + col + '|' + (llena ? 1 : 0); let c = TINTAS.get(id);
    if (!c) {
      if (TINTAS.size > 400) TINTAS.clear();
      c = document.createElement('canvas'); c.width = Math.max(1, fr.cutWidth); c.height = Math.max(1, fr.cutHeight);
      const g = c.getContext('2d'); g.drawImage(fr.source.image, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight);
      g.globalCompositeOperation = llena ? 'source-in' : 'multiply'; g.fillStyle = hex(col); g.fillRect(0, 0, c.width, c.height);
      if (!llena) { g.globalCompositeOperation = 'destination-in'; g.drawImage(fr.source.image, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight); }
      TINTAS.set(id, c);
    }
    return c;
  };
  const BLEND = { 1: 'lighter', 2: 'multiply', 3: 'screen' };
  const repetirCB = (g, cb, col, alfa) => {
    const c = (v, a) => rgba(col != null ? col : v, a);
    g.beginPath();
    for (let i = 0; i < cb.length; i++) {
      switch (cb[i]) {
        case 0: g.arc(cb[i + 1], cb[i + 2], cb[i + 3], cb[i + 4], cb[i + 5], cb[i + 6]); i += 7; break;
        case 6: g.lineWidth = cb[i + 1]; g.strokeStyle = c(cb[i + 2], cb[i + 3]); i += 3; break;
        case 7: g.fillStyle = c(cb[i + 1], cb[i + 2]); i += 2; break;
        case 1: g.beginPath(); break; case 2: g.closePath(); break; case 8: g.fill(); break; case 9: g.stroke(); break;
        case 3: g.fillRect(cb[i + 1], cb[i + 2], cb[i + 3], cb[i + 4]); i += 4; break;
        case 10: g.beginPath(); g.moveTo(cb[i + 1], cb[i + 2]); g.lineTo(cb[i + 3], cb[i + 4]); g.lineTo(cb[i + 5], cb[i + 6]); g.closePath(); g.fill(); i += 6; break;
        case 11: g.beginPath(); g.moveTo(cb[i + 1], cb[i + 2]); g.lineTo(cb[i + 3], cb[i + 4]); g.lineTo(cb[i + 5], cb[i + 6]); g.closePath(); g.stroke(); i += 6; break;
        case 4: g.lineTo(cb[i + 1], cb[i + 2]); i += 2; break; case 5: g.moveTo(cb[i + 1], cb[i + 2]); i += 2; break;
        case 14: g.save(); break; case 15: g.restore(); break;
        case 16: g.translate(cb[i + 1], cb[i + 2]); i += 2; break; case 17: g.scale(cb[i + 1], cb[i + 2]); i += 2; break; case 18: g.rotate(cb[i + 1]); i += 1; break;
        case 21: i += 5; break; case 22: i += 6; break;
      }
    }
  };
  const fotoEn = (c, tau) => { const F = c.f; let lo = 0, hi = F.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (F[m].t <= tau) { r = m; lo = m + 1; } else hi = m - 1; } return r < 0 ? null : F[r]; };
  const dibCosa = (g, S, K, s, tipo, L, ed) => {
    const esc = (ed && ed.esc) || 1, ax = L ? L.ax : s.x, ay = L ? L.ay : s.y;
    const X = ax + (s.x - ax) * esc + ((ed && ed.dx) || 0), Y = ay + (s.y - ay) * esc + ((ed && ed.dy) || 0);
    const col = ed && ed.col != null ? ed.col : null;
    g.save();
    g.globalAlpha = Math.max(0, Math.min(1, s.a * (ed && ed.alfa != null ? ed.alfa : 1)));
    const bl = ed && ed.luz ? 'lighter' : BLEND[s.bm]; if (bl) g.globalCompositeOperation = bl;
    g.translate(K.X(X), K.Y(Y)); if (s.r) g.rotate(s.r); g.scale(s.sx * esc * K.Z, s.sy * esc * K.Z);
    if (s.k) {
      const fr = /^__(MISSING|DEFAULT)/.test(s.k) ? null : frameDe(S, s.k, s.fr);
      if (fr && fr.source && fr.source.image) {
        const tin = col != null ? col : s.ti != null ? s.ti : null, llena = col == null && !!s.tf;
        let im = fr.source.image, cx = fr.cutX, cy = fr.cutY; if (tin != null && tin !== 0xffffff) { im = tintado(fr, tin, llena); cx = 0; cy = 0; }
        g.translate(-s.ox, -s.oy); if (s.fx) { g.translate(fr.realWidth, 0); g.scale(-1, 1); } if (s.fy) { g.translate(0, fr.realHeight); g.scale(1, -1); }
        g.drawImage(im, cx, cy, fr.cutWidth, fr.cutHeight, fr.x, fr.y, fr.cutWidth, fr.cutHeight);
      }
    } else if (s.cb) repetirCB(g, s.cb, col);
    else if (s.im) g.drawImage(s.im, -s.ox, -s.oy, s.w, s.h);
    else if (s.fi != null) {
      g.beginPath();
      if (tipo === 'Rectangle') g.rect(-s.ox, -s.oy, s.w, s.h);
      else if (tipo === 'Arc') { g.arc(s.ra - s.ox, s.ra - s.oy, s.ra, s.a0, s.a1, !!s.ac); if (s.cl) g.closePath(); }
      else if (s.pd && s.pd.length > 3) { g.moveTo(s.pd[0] - s.ox, s.pd[1] - s.oy); for (let i = 2; i < s.pd.length; i += 2) g.lineTo(s.pd[i] - s.ox, s.pd[i + 1] - s.oy); if (s.cl) g.closePath(); }
      if (s.fi) { g.fillStyle = rgba(col != null ? col : s.fc, s.fa); g.fill(); }
      if (s.st) { g.lineWidth = s.lw; g.strokeStyle = rgba(col != null ? col : s.sc, s.sa); g.stroke(); }
    }
    g.restore();
  };
  // todo lo leído en el momento t (para dibujar ordenado por profundidad con lo demás)
  const cosasLeidas = (cosas, g, S, K, E, t) => {
    const C = E.cap, porKey = {}; C.capas.forEach((L, i) => { porKey[L.key] = L; });
    const jefe = Object.values(C.cosas).find(c => c.quien === 'jefe'), dJefe = () => { const s = jefe && fotoEn(jefe, t); return s ? s.d : 0; };
    Object.values(C.cosas).forEach(c => {
      if (c.fuera) return;
      if (c.quien === 'parte') { if (tau0(c, t)) { const s = fotoEn(c, t); if (s && s.v && !s.no) cosas.push({ d: s.d, f: () => dibCosa(g, S, K, s, c.tipo, null, null) }); } return; }
      if (c.quien !== 'cosa') {
        const s = fotoEn(c, t); if (!s) return;
        const m = cuerpoDe(c.quien === 'heroe' ? ((escena() && escena().playerHero) || 'soldier') : st.jefeTipo, c.quien === 'heroe');
        if (s.v) cosas.push({ d: s.d, f: () => dibCosa(g, S, K, s, c.tipo, null, null) });
        return;
      }
      const L = porKey[c.capa]; if (!L) return;
      const ed = edDe(E.clave, L.key); if (ed.fuera) return;
      const tau = t - (ed.dt || 0); if (tau < c.nace || tau > c.muere) return;
      const v = tau - L.nace; if (ed.sa && v < ed.sa) return; if (ed.co != null && v > ed.co) return;
      const s = fotoEn(c, tau); if (!s || !s.v || s.no) return;
      const d = ed.lado === 'delante' ? dJefe() + 3 : ed.lado === 'detras' ? dJefe() - 3 : s.d;
      cosas.push({ d, f: () => dibCosa(g, S, K, s, c.tipo, L, ed) });
    });
  };
  const intentosA = {};
  const autoLeer = S => {
    if (!S || !st.abierto || VP.leerA || VP.leer || VP.nota) return;
    let clave = null, hacer = null;
    if (st.tab === 'heroes' && st.hab) { clave = st.hab + ':' + VP.mira; hacer = () => leerHeroe(S, st.hab); }
    else if (st.tab === 'jefes' && esPfx(st.jefeHab)) { clave = st.jefeHab; hacer = () => leerPfx(S, st.jefeHab); }
    if (clave && !LECT_A[clave] && !intentosA[clave]) { intentosA[clave] = 1; hacer(); return; }
    if ((st.tab === 'heroes' || (st.tab === 'jefes' && esPfx(st.jefeHab))) && !(clave && LECT_A[clave])) fondoAlDia(S);
  };
  const tau0 = (c, t) => t >= c.nace && (c.muere == null || t <= c.muere);
  const temblorLeido = (C, t) => { const T = C.temblor; let f = 0; for (let i = 0; i < T.length && T[i].t <= t; i++) f = T[i].f; return f; };

  // ================================================================== EL LUGAR Y LA ANIMACIÓN DE VERDAD (héroes y jefes)
  // (21/11, pedido: "se sigue viendo raro al editar: que los personajes tengan la preview de la animación de sus habilidades,
  // que se vea como se usa en el juego y cómo afecta el entorno, sólo los jugadores principales y los jefes; los demás como
  // están"). Dos cosas:
  // - EL LUGAR: el escenario usa de fondo el mapa de verdad donde se prueba (una foto del juego sin personajes ni carteles:
  //   se esconden un cuadro, se copia el lienzo del juego y se vuelven a mostrar), en vez de la cuadrícula.
  // - LA ANIMACIÓN: para cada habilidad de un héroe (y cada dirección) y para las nuevas de los jefes, el editor se la hace
  //   usar una vez en el juego, contra un muñeco, y lee cuadro a cuadro al personaje (su animación de verdad, adónde se
  //   mueve), al muñeco o al héroe (cómo lo golpea: el destello, el empujón) y los números de daño, y el temblor. Las capas
  //   editables siguen siendo las de siempre: lo leído es lo que las rodea, como en el juego.
  // Los enemigos comunes quedan como estaban.
  const pedirFondo = (S, cb) => {
    const ocultos = [], cam = S.cameras.main; let z0 = null;
    const pre = () => {
      // (v10) a zoom 1: el mapa a su tamaño real (1 píxel del juego = 1 de la foto) y bastante más grande que lo que se ve
      try { if (cam.zoom !== 1) { z0 = cam.zoom; cam.setZoom(1); } } catch (er) {}
      const tapar = o => { if (o && o.visible) { o.visible = false; ocultos.push(o); } };
      try {
        tapar(S.player);
        S.enemies.getChildren().forEach(e => { tapar(e); tapar(e.hpBar); tapar(e.nameTag); (e._ckEdPartes || []).forEach(tapar); });
        S.children.list.forEach(o => { if (o.scrollFactorX === 0) tapar(o); });
      } catch (er) {}
    };
    const post = () => {
      let r = null;
      try {
        const cv = S.game.canvas, k = cv.width / S.scale.width, wv = cam.worldView;
        const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(wv.width * cam.zoom * k)); c.height = Math.max(1, Math.round(wv.height * cam.zoom * k));
        c.getContext('2d').drawImage(cv, cam.x * k, cam.y * k, c.width, c.height, 0, 0, c.width, c.height);
        r = { im: c, x: wv.x, y: wv.y, w: wv.width, h: wv.height, en: { x: S.player.x, y: S.player.y }, cuando: Date.now() };
      } catch (er) {}
      ocultos.forEach(o => { try { o.visible = true; } catch (er) {} });
      try { if (z0 != null) cam.setZoom(z0); } catch (er) {}
      cb(r);
    };
    S.game.events.once('prerender', pre); S.game.events.once('postrender', post);
  };
  let FONDO = null, fondoPidiendo = false;
  const fondoAlDia = S => {                                        // el de los héroes y las nuevas: se vuelve a sacar si el héroe se movió
    if (fondoPidiendo || VP.leer || VP.leerA || !S || !S.player) return;
    if (S.isAttacking || S.isDashing || S.isSpinning) return;
    if (FONDO && Math.hypot(FONDO.en.x - S.player.x, FONDO.en.y - S.player.y) < 24) return;
    fondoPidiendo = true; pedirFondo(S, F => { fondoPidiendo = false; if (F) FONDO = F; });
  };
  const dibFondo = (g, K, f) => {
    if (!f || !f.F || !f.F.im) return false;
    g.save(); g.imageSmoothingEnabled = false;
    g.drawImage(f.F.im, K.X(f.F.x - f.ox), K.Y(f.F.y - f.oy), f.F.w * K.Z, f.F.h * K.Z);
    g.restore(); return true;
  };
  const esJefe = t => ORDEN_JEFES.includes(t);

  // ---- leer a los personajes mientras la usan
  const LECT_A = {};                                              // héroe: id:mira · nueva de jefe: pfx_… → lo leído
  const leerActores = (S, quienes, origen, disparar, termino, listo, todo) => {
    pedirFondo(S, F => {
      const R = { cosas: {}, temblor: [], fondo: F, o: { x: origen.x, y: origen.y }, fin: 0 };
      const ids = new Map(), t0 = S.time.now, V = VX(); let nid = 0, ultT = -99, hecho = false;
      const seguir = (o, quien) => { if (!o || ids.has(o)) return; const id = ++nid; ids.set(o, id); R.cosas[id] = { id, tipo: o.type, quien, nace: S.time.now - t0, muere: null, f: [] }; };
      quienes.forEach(([o, q]) => seguir(o, q));
      const caja = cajaDe(origen, origen);
      const nuevo = o => { try { if (!o || o.scrollFactorX === 0) return; if (o.type === 'Text') seguir(o, 'texto'); else if ((todo || S._ckPedCrea > 0) && dentro(o, caja) && !quienes.some(q => q[0] === o)) seguir(o, 'cosa'); } catch (er) {} };
      S.sys.events.on('addedtoscene', nuevo);
      const tomar = () => {
        const t = S.time.now - t0; if (hecho || t - ultT < 30) return; ultT = t;
        ids.forEach((id, o) => {
          const c = R.cosas[id]; if (c.muere != null) return;
          if (!o.active || !o.scene) { c.muere = t; return; }
          if (o.scrollFactorX === 0) { c.fuera = 1; return; }
          const u = c.f[c.f.length - 1], s = foto(o, t, R.o, u);
          if (c.quien !== 'texto' && c.quien !== 'cosa') { const q = V.pie(o); s.px = q.x - R.o.x; s.py = q.y - R.o.y; c.f.push(s); }
          else if (!igual(s, u)) c.f.push(s);
        });
        const sh = S.cameras.main.shakeEffect; R.temblor.push({ t, f: sh && sh.isRunning ? (sh.intensity ? sh.intensity.x : 0.01) : 0 });
        if (termino(t)) cerrar(t);
      };
      const cerrar = t => {
        if (hecho) return; hecho = true;
        S.game.events.off('postrender', tomar); S.sys.events.off('addedtoscene', nuevo);
        Object.values(R.cosas).forEach(c => { if (c.muere == null) c.muere = t; });
        R.fin = Math.max(600, t); listo(R);
      };
      S.game.events.on('postrender', tomar);
      try { disparar(); } catch (er) { console.warn('[editor hab] leer', er); cerrar(0); }
      setTimeout(() => cerrar(S.time.now - t0), 7000);
    });
  };
  // un héroe: contra un muñeco puesto donde está el del escenario, mirando hacia donde mira el escenario
  const leerHeroe = (S, id) => {
    if (!S || VP.leerA || VP.leer || id === 'ataque' && !S.castFireball) return;
    const mira = VP.mira, clave = id + ':' + mira, cambia = S.playerHero !== heroeDe(id);
    VP.leerA = { clave }; cambiarHeroe(S, heroeDe(id));
    S.time.delayedCall(cambia ? 320 : 40, () => {
      try {
        if (S.isAttacking || S.isDashing || S.isSpinning) { VP.leerA = null; return; }
        quitarPrueba(S); S._ckPermitirBestias = true;
        const p = S.player, [fx, fy] = dirM();
        S.facingDirection = fx < 0 ? 'left' : 'right'; S.facingV = fy > 0 ? 'front' : fy < 0 ? 'back' : null; p.setFlipX(fx < 0);
        const e = S.spawnEnemy(p.x + fx * 72, p.y + fy * 60, 'orc');
        if (e) { quieto(S, e); e.setFlipX(fx > 0); S._ckEdCosas = [e]; if (e.nameTag) e.nameTag.setVisible(false); }
        S.time.delayedCall(950, () => {
          if (!S.player || !S.player.active) { VP.leerA = null; return; }
          let ocupado = 0;
          leerActores(S, [[S.player, 'heroe']].concat(e ? [[e, 'enemigo']] : []), { x: S.player.x, y: S.player.y },
            () => {
              if (S.maxStamina) S.stamina = S.maxStamina;
              S.facingDirection = fx < 0 ? 'left' : 'right'; S.facingV = fy > 0 ? 'front' : fy < 0 ? 'back' : null;
              if (id === 'ataque') S.castFireball(); else if (!usar(S, id)) { const D = VX().DESPUES; if (D[id]) D[id](S); }
            },
            t => { const k = S.player.anims && S.player.anims.currentAnim ? S.player.anims.currentAnim.key : ''; if (S.isAttacking || S.isSpinning || S.isDashing || !/idle/.test(k)) ocupado = t; return (t > 1300 && t - ocupado > 700) || t > 5200; },
            R => { R.quien = heroeDe(id); R.todo = !(DESP[id] && DESP[id].length); LECT_A[clave] = R; VP.leerA = null; quitarPrueba(S); if (st.tab === 'heroes') { VP.t = 0; VP.play = true; } pintar(); }, !(DESP[id] && DESP[id].length));
        });
      } catch (er) { VP.leerA = null; }
    });
  };
  // una habilidad nueva de un jefe (pfx_): el jefe la hace de verdad y se lee cómo se mueve él y cómo te pega
  const leerPfx = (S, k) => {
    const E = window.CK_ESPECIALES; if (!S || VP.leerA || VP.leer || !E || !E.HACER[k]) return;
    VP.leerA = { clave: k };
    const e = jefeDePrueba(S) || traerJefe(S); if (!e) { VP.leerA = null; return; }
    const espera = Math.max(60, 950 - (S.time.now - (e._ckEdNace || 0))), A = jOf(k);
    S.time.delayedCall(espera, () => {
      if (!vivo(e)) { VP.leerA = null; return; }
      const ms = Math.min(5200, (A.aviso || 900) + (A.entre || 0) * Math.max(0, (A.cantidad || 1) - 1) + 1700);
      leerActores(S, [[e, 'jefe'], [S.player, 'heroe']], { x: e.x, y: e.y },
        () => { e._ckEdProbando = S.time.now + ms; e.state = 'chase'; e._ckEsp = 0; e.isAttacking = false; if (window.CK_PANEL_PRUEBAS && st.invencible) CK_PANEL_PRUEBAS.st.invencible = true; E.HACER[k](S, e); },
        t => t > ms,
        R => { R.quien = JP().DEF[k].jefe; const ph = Object.values(R.cosas).find(c => c.quien === 'heroe'); R.heroe0 = ph && ph.f[0] ? { x: ph.f[0].x, y: ph.f[0].y } : null; LECT_A[k] = R; VP.leerA = null; if (vivo(e)) { e._ckEdProbando = 0; e.hp = e.maxHp; } if (st.tab === 'jefes') { VP.t = 0; VP.play = true; } pintar(); });
    });
  };
  // dibujar a los leídos: el personaje (con su sombra), el muñeco o el héroe, y los números
  const cosasActores = (cosas, g, S, K, R, t, corre) => {
    const T = Math.min(t, R.fin);
    Object.values(R.cosas).forEach(c => {
      if (c.fuera) return;
      const d = (corre && corre[c.quien]) || { x: 0, y: 0 };
      if (c.quien === 'texto' || c.quien === 'cosa') { if (T < c.nace || T > c.muere) return; const s = fotoEn(c, T); if (s && s.v) cosas.push({ d: c.quien === 'cosa' ? s.d - R.o.y + P0 + 12 : s.d, f: () => dibCosa(g, S, K, Object.assign({}, s, { x: s.x + d.x, y: s.y + d.y }), c.tipo, null, null) }); return; }
      if (T > c.muere + 30) return;
      const s = fotoEn(c, T) || c.f[0]; if (!s) return;
      const q = Object.assign({}, s, { x: s.x + d.x, y: s.y + d.y });
      const m = cuerpoDe(c.quien === 'heroe' ? ((escena() && escena().playerHero) || 'soldier') : c.quien === 'enemigo' ? 'orc' : (R.quien || 'orc'), c.quien === 'heroe');
      if (s.v) cosas.push({ d: Math.round(s.py + d.y) + P0, f: () => dibCosa(g, S, K, q, c.tipo, null, null) });
    });
  };

  // ---------------------------------------------------------------- marcar con un clic en el juego
  const alMundo = (S, ev) => {
    const c = S.game.canvas, r = c.getBoundingClientRect();
    const px = (ev.clientX - r.left) * (S.scale.width / r.width), py = (ev.clientY - r.top) * (S.scale.height / r.height);
    return S.cameras.main.getWorldPoint(px, py);
  };
  let tragar = 0;
  ['mousedown', 'mouseup', 'pointerup', 'touchstart', 'touchend'].forEach(t => window.addEventListener(t, ev => {
    const S = escena(); if (!S || !S.game || ev.target !== S.game.canvas) return;
    if (performance.now() - tragar < 450) ev.stopPropagation();   // que el clic de marcar no le llegue al juego
  }, true));
  window.addEventListener('pointerdown', ev => {
    if (!st.marcar || !st.abierto) return;
    const S = escena(); if (!S || !S.game || ev.target !== S.game.canvas) return;
    ev.stopPropagation(); ev.preventDefault(); tragar = performance.now();
    const w = alMundo(S, ev), m = st.marcar; st.marcar = null;
    try {
      if (m.tipo === 'jefe') {
        const e = jefeDePrueba(S); if (!e) { avisar('primero traé al jefe'); return; }
        const a = VX().pie(e), izq = e.flipX;
        tocarJefe(st.jefe, 'origen', { dx: Math.round((w.x - a.x) * (izq ? -1 : 1)), dy: Math.round(w.y - a.y) });
      } else if (m.tipo === 'capa') {
        const capas = capasDe(st.hab), c = capas[st.capa]; if (!c) return;
        const izq = dir(S)[0] < 0 || (dir(S)[0] === 0 && S.player.flipX), b = base(S, c);
        c.ad = 0; c.avz = c.avz || 0; c.dx = Math.round((w.x - b.x) * (izq ? -1 : 1)); c.dy = Math.round(w.y - b.y);
        tocarHeroe(st.hab, capas);
      } else if (m.tipo === 'proy') {
        const key = PROY_DE[st.hab], u = ultimaSalida[key]; if (!u) { avisar('primero tiralo una vez'); return; }
        const a = AJ.proyectiles[key] = AJ.proyectiles[key] || {};
        // la salida de antes (sin el corrimiento) y la nueva marcada, las dos respecto del héroe y mirando como cuando lo tiró
        const p = S.player, izqA = dir(S)[0] < 0 || (dir(S)[0] === 0 && p.flipX), sg = izqA === u.izq ? 1 : -1;
        const wx = (w.x - p.x) * sg, wy = w.y - p.y, x0 = u.rx - u.fx * u.ad, y0 = u.ry - u.fy * u.ad * 0.8 - u.dy;
        a.ad = Math.round(u.fx !== 0 ? (wx - x0) * u.fx : (wy - y0) / (u.fy * 0.8 || 1)); a.dy = Math.round(u.fx !== 0 ? (wy - y0) : 0);
        u.rx = wx; u.ry = wy; u.ad = a.ad; u.dy = a.dy;
        guardar();
      }
      avisar('marcado ✓');
    } catch (e) { console.warn('[editor hab]', e); }
    pintar();
  }, true);

  // ---------------------------------------------------------------- la cruz que muestra el punto marcado
  const cruz = S => {
    if (!S._ckEdCruz || !S._ckEdCruz.scene) S._ckEdCruz = S.add.graphics().setDepth(40000);
    const g = S._ckEdCruz; g.clear();
    if (!st.abierto) return;
    const pts = [], M = st.marcar && st.marcar.tipo, ROJA = 0xff4a4a;
    try {
      if (st.tab === 'jefes') { const e = jefeDePrueba(S), A = jOf(st.jefe); if (e && A.origen) { const a = VX().pie(e); pts.push({ x: a.x + (e.flipX ? -1 : 1) * A.origen.dx, y: a.y + A.origen.dy, col: M === 'jefe' ? ROJA : 0xfde047 }); } }
      else if (st.tab === 'heroes') {
        const c = st.hab !== 'ataque' && capasDe(st.hab)[st.capa];
        if (c && c.ef !== '@temblor' && !c.enem) { const q = punto(S, c, 0, false); pts.push({ x: q.x, y: q.y, col: M === 'capa' ? ROJA : 0xfde047 }); }
        const k = PROY_DE[st.hab], u = k && !PROY[k][3] && ultimaSalida[k];
        if (u && S.player) { const izqA = dir(S)[0] < 0 || (dir(S)[0] === 0 && S.player.flipX), sg = izqA === u.izq ? 1 : -1; pts.push({ x: S.player.x + u.rx * sg, y: S.player.y + u.ry, col: M === 'proy' ? ROJA : 0x67e8f9 }); }
      }
    } catch (e) {}
    pts.forEach(q => {
      g.lineStyle(1, 0x000000, 0.8).strokeCircle(q.x, q.y, 6).lineBetween(q.x - 10, q.y, q.x + 10, q.y).lineBetween(q.x, q.y - 10, q.x, q.y + 10);
      g.lineStyle(1, q.col, 1).strokeCircle(q.x, q.y, 5).lineBetween(q.x - 9, q.y, q.x + 9, q.y).lineBetween(q.x, q.y - 9, q.x, q.y + 9);
    });
  };

  // ================================================================== ESCENARIO: el personaje, la habilidad y su vista previa
  // (21/11, pedido: "ponme en un canvas con el personaje la habilidad y la previsualización y después que me deje editarla allí")
  // Un lienzo aparte, sin mapa ni obstáculos: se dibujan los mismos sprites del juego y las mismas hojas de efectos con los
  // mismos números (punto de apoyo, tamaño, color, luz, giro, delante/detrás), en bucle. Abajo, la línea de tiempo.
  // Se edita ahí: arrastrar los puntos (de dónde sale cada capa, la salida del proyectil, el origen y el radio del golpe del
  // jefe, el punto de apoyo de un efecto), la rueda cambia el tamaño, y en la línea de tiempo se arrastran las barras para
  // cambiar cuándo sale cada cosa (el retraso, cada cuánto, cuánto avisa el jefe).
  const ESC_H = { soldier: 1.2, swordsman: 1.2, wizard: 1.2, bear: 1.656 };
  const ESC_E = { orc: 1.45, necromancer: 1.5, skeleton_great: 1.35, brujo_sello: 1.45, demonio_sello: 2, demonio_j_ojo: 2.6, demonio_j_sabueso: 2.1, demonio_j_segadora: 1.75, demonio_j_minotauro: 1.85 };
  const COL_H = { soldier: 0xffd25a, swordsman: 0xff4a7a, wizard: 0xb06cff, bear: 0x9fe0ff };
  const DIST0 = { pfx_manos: 130, pfx_espinas: 150, pfx_rayos: 130, pfx_oscura: 70, pfx_estrellas: 130, pfx_aliento: 100, pfx_siega: 55, pfx_pisoton: 70 };
  // de dónde sale cada proyectil (mirando a la derecha, respecto del héroe) y a qué velocidad
  const SALIDA = { wizard_fireball: [26, -6, 420], ck_lanza_hielo: [22, -4, 380], ck_esquirla: [22, -6, 340], ck_onda: [22, -4, 330], ck_misil: [0, -4, 160] };
  const ANGULOS = { ataque: [0], triple_fuego: [0, -0.24, 0.24], b_escarcha: [-0.35, -0.12, 0.12, 0.35], lanza: [0], onda: [0], misiles: [-0.6, 0, 0.6] };
  const IMPACTO_P = { wizard_fireball: ['fuego_explosion', 0.42], ck_lanza_hielo: ['hielo_roto', 0.6], ck_esquirla: ['hielo_roto', 0.6] };
  const SQ = 0.6, P0 = 1000, ROJO = 0xff3030, ROJO0 = ROJO;
  const VP = { t: 0, play: true, vel: 1, zoom: { jefes: 2, heroes: 3, efectos: 3 }, manual: {}, mira: 'der', total: 1500, ult: 0, arr: null, dist: {}, raf: 0, sobre: null, esc: null };
  const IMGS = {}, TIN = {};
  const azar = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rgba = (n, a) => `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  const escHoja = k => (PFX() && PFX().ESC && PFX().ESC['ckfx_' + k]) || 1;
  const imagen = k => {
    const h = hojas()[k]; if (!h) return null;
    let im = IMGS[k]; if (!im) { im = IMGS[k] = new Image(); im.src = h.src; }
    return im.complete && im.naturalWidth ? im : null;
  };
  const tenida = (k, tin) => {
    const im = imagen(k); if (!im || tin == null || tin === 0xffffff) return im;
    const key = k + '|' + tin; let c = TIN[key];
    if (!c) {
      c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      g.globalCompositeOperation = 'multiply'; g.fillStyle = hex(tin); g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(im, 0, 0);
      TIN[key] = c;
    }
    return c;
  };
  const cuerpoDe = (tipo, heroe) => { const s = heroe ? (ESC_H[tipo] || 1.2) : (ESC_E[tipo] || 1.45); return { s, pieY: 10 * s, dh: 100 * s }; };
  const dirM = () => VP.mira === 'izq' ? [-1, 0] : VP.mira === 'abajo' ? [0, 1] : VP.mira === 'arriba' ? [0, -1] : [1, 0];
  const baseM = (c, m) => c.en === 'pie' ? { x: 0, y: m.pieY } : c.en === 'pecho' ? { x: 0, y: -m.dh * 0.06 } : c.en === 'cabeza' ? { x: 0, y: -m.dh * 0.24 } : { x: 0, y: 0 };
  const puntoM = (c, i, rnd, m) => {
    const [fx, fy] = dirM(), b = baseM(c, m), izq = fx < 0, ad = (c.ad || 0) + (i || 0) * (c.avz || 0);
    const r1 = rnd ? rnd() * 2 - 1 : 0, r2 = rnd ? rnd() * 2 - 1 : 0;
    return { x: b.x + fx * ad + (izq ? -1 : 1) * (c.dx || 0) + r1 * (c.az || 0), y: b.y + fy * ad * 0.8 + (c.dy || 0) + r2 * (c.azy || 0), fx, fy, izq };
  };
  // cuánto dura en pantalla un efecto (como en ck_vfx.js: sin bucle se borra al terminar; con "dura" se apaga en 200 ms)
  const durEf = (k, o) => {
    const h = hojas()[k]; if (!h) return 500;
    const vuelta = Math.max(30, h.n / (h.fps * (o.vel || 1)) * 1000 - (o.salta || 0)), una = !h.loop || o.unaVez;
    if (o.dura) return Math.min(o.dura + 200, una ? vuelta : 1e9);
    return una ? vuelta : 1600;
  };
  const ef = (k, x, y, o, t0, fila, d, extra) => Object.assign({ tipo: 'ef', k, x, y, o, t0, dur: durEf(k, o), fila, d: d != null ? d : Math.round(y) + P0 + 30, bucle: !!(hojas()[k] && hojas()[k].loop && !o.unaVez && !o.dura) }, extra || {});

  // ---------------------------------------------------------------- lo que hay en el escenario, según la pestaña
  const armarHeroe = () => {
    const id = st.hab, h = heroeDe(id), m = cuerpoDe(h, true), capas = id === 'ataque' ? [] : capasDe(id), it = [], man = [], filas = [];
    const [fx, fy] = dirM(), izq = fx < 0;
    const ene = { tipo: 'orc', x: fx * 72, y: fy * 60 }, em = cuerpoDe('orc');
    // (v9) con ck_heroes_pedidos.js las capas salen después de la anticipación, y donde está el héroe en ese momento (leído)
    const PED = window.CK_HEROES_PEDIDOS, dem = (PED && PED.DEMORA && PED.DEMORA[id]) || 0, RA0 = LECT_A[id + ':' + VP.mira];
    const hq = RA0 && Object.values(RA0.cosas).find(c => c.quien === 'heroe' && c.f.length);
    const vaH = t => { if (!hq) return { x: 0, y: 0 }; const s = fotoEn(hq, t) || hq.f[hq.f.length - 1], s0 = hq.f[0]; return { x: s.x - s0.x, y: s.y - s0.y }; };
    capas.forEach((c, ci) => {
      filas.push({ txt: (ci + 1) + ' ' + c.ef.replace(/^@onda:/, 'onda ').replace(/^@/, ''), capa: ci });
      const n = Math.max(1, Math.round(c.n || 1));
      for (let i = 0; i < n; i++) {
        const t0 = Math.max(0, (c.ret || 0) + i * (c.cada || 0)) + dem, rnd = azar(ci * 97 + i * 13 + 7), q = puntoM(c, i, rnd, m), esc = (c.esc || 1) + i * (c.sube || 0);
        if (!c.enem) { const v = vaH(t0); q.x += v.x; q.y += v.y; }
        const drag = { capa: ci, inst: i };
        if (c.ef === '@temblor') { it.push({ tipo: 'temblor', t0, dur: c.dura || 200, f: c.fuerza || 0.01, fila: ci, drag }); continue; }
        if (c.ef === '@ulti') {
          it.push({ tipo: 'ulti', t0, dur: 640, f: esc, col: COL_H[h], fila: ci, drag });
          it.push(ef('carga', q.x, q.y - 18, { escala: 1.6, tin: COL_H[h], suma: true, vel: 1.6 }, t0, ci, null, { drag }));
          continue;
        }
        if (/^@onda:/.test(c.ef)) { const ms = Math.max(180, c.dura || 400); it.push({ tipo: 'onda', t0, dur: ms + 650, ms, r: Math.max(16, c.radio || 80), el: c.ef.slice(6), x: q.x, y: q.y, semilla: ci * 31 + i + 1, fila: ci, drag }); continue; }
        if (!hojas()[c.ef]) continue;
        const o = { escala: esc, alfa: c.alfa != null ? c.alfa : 1, suma: !!c.suma, vel: c.vel || 1, tin: c.tin, dura: c.dura, unaVez: c.unaVez, salta: c.salta };
        if (c.girar) o.giro = Math.atan2(q.fy, q.fx);
        let flip = c.voltear ? q.izq : false; if (c.alterna && i % 2 === 1) flip = !flip; o.flip = flip;
        const lugares = c.enem ? (Math.hypot(ene.x, ene.y) <= c.enem ? [{ x: ene.x + (c.dx || 0), y: ene.y + em.pieY + (c.dy || 0) }] : []) : [q];
        lugares.forEach(l => {
          const lado = c.lado || (c.detras ? 'detras' : null), ref = c.enem ? ene.y + em.pieY + P0 : m.pieY + P0;
          let d = c.pro != null ? Math.round(l.y) + P0 + c.pro : c.sigue ? m.pieY + P0 + (lado === 'detras' ? -1 : 2) : null;
          if (lado === 'delante') d = c.sigue ? m.pieY + P0 + 2 : ref + 3; else if (lado === 'detras') d = c.sigue ? m.pieY + P0 - 1 : ref - 3;
          it.push(ef(c.ef, l.x, l.y, o, t0, ci, d, { drag, cortes: { capa: ci, inst: i } }));
        });
      }
      if (c.ef !== '@temblor' && !c.enem) { const q = puntoM(c, 0, null, m), v = vaH((c.ret || 0) + dem); q.x += v.x; q.y += v.y; man.push({ tipo: 'capa', ci, x: q.x, y: q.y, txt: String(ci + 1), sel: ci === st.capa }); }
    });
    // proyectiles
    const key = PROY_DE[id];
    if (key && !(PED && PED.REHECHAS && PED.REHECHAS.includes(id))) {                 // (las rehechas se leen del juego)
      const a = AJ.proyectiles[key] || {}, d = PROY[key], k = a.ef || d[1], escP = a.esc != null ? a.esc : d[2], fila = filas.length;
      filas.push({ txt: 'proyectil' });
      if (key === 'ck_roca') {
        const tx = fx * 110, ty = 12 + fy * 90;
        it.push({ tipo: 'roca', k, esc: escP, x0: tx - 160, y0: ty - 300, x1: tx, y1: ty - 8, t0: 0, dur: 650, fila });
      } else {
        const sb = SALIDA[key] || [20, -4, 340];
        const bx = fx !== 0 ? fx * sb[0] : 0, by = fx !== 0 ? sb[1] : (fy > 0 ? 30 : -22) * m.s / 1.2;
        const sx = bx + fx * (a.ad || 0), sy = by + fy * (a.ad || 0) * 0.8 + (a.dy || 0), a0 = Math.atan2(fy, fx);
        (ANGULOS[id] || [0]).forEach((ang, i) => {
          const t0 = key === 'ck_misil' ? i * 90 : 0;
          if (key === 'ck_misil') it.push({ tipo: 'misil', k, esc: escP, x0: sx, y0: sy, ang, izq, t0, dur: 900, objetivo: { x: ene.x, y: ene.y }, fila });
          else {
            const v = sb[2], dur = Math.min(700, 230 / v * 1000);
            it.push({ tipo: 'bala', k, esc: escP, x0: sx, y0: sy, vx: Math.cos(a0 + ang) * v, vy: Math.sin(a0 + ang) * v, t0, dur, fila, onda: key === 'ck_onda' });
            const imp = IMPACTO_P[key];
            if (imp && i === 0) it.push(ef(imp[0], sx + Math.cos(a0) * v * dur / 1000, sy + Math.sin(a0) * v * dur / 1000, { escala: imp[1] }, t0 + dur, fila));
          }
        });
        man.push({ tipo: 'proy', key, x: sx, y: sy, base: { x: bx, y: by }, fx, fy });
      }
    }
    const RA = LECT_A[id + ':' + VP.mira];                              // su animación de verdad, leída del juego
    if (RA) { filas.push({ txt: HEROES[h][0] + ' (juego)' }); it.push({ tipo: 'cuerpo', t0: 0, dur: RA.fin, fila: filas.length - 1 }); }
    const fondo = RA && RA.fondo ? { F: RA.fondo, ox: RA.o.x, oy: RA.o.y } : FONDO ? { F: FONDO, ox: FONDO.en.x, oy: FONDO.en.y } : null;
    return { it, man, filas, actores: RA ? [] : [{ tipo: h, heroe: true, x: 0, y: 0, flip: izq, ataque: true }, { tipo: 'orc', x: ene.x, y: ene.y, flip: !izq && fx !== 0 ? true : false }], lectA: RA, fondo, centro: { x: fx * 34, y: -6 + fy * 22 }, vacio: !RA && !capas.length && !key };
  };

  const armarJefe = () => {
    const J = JP(); if (!J) return null;
    const k = st.jefe, A = jOf(k), D0 = J.DEF[k], tipo = D0.jefe, mb = cuerpoDe(tipo), it = [], man = [], filas = [];
    const dist = VP.dist[k] != null ? VP.dist[k] : DIST0[k], pies = { x: 0, y: mb.pieY }, hp = { x: dist, y: 12 }, hc = { x: dist, y: 12 - 4.8 };
    const orig = o => ({ x: (o && o.dx) || 0, y: mb.pieY + ((o && o.dy) || 0) });
    const AV = A.aviso, RAD = A.radio, fila = txt => { filas.push({ txt }); return filas.length - 1; };
    const fAviso = fila('aviso'), fGolpe = fila('golpe'), fExtra = (A.extras || []).map((c, xi) => fila('capa ' + (xi + 1)));
    const zona = (x, y, r, t0, t1, extra) => it.push(Object.assign({ tipo: 'zona', x, y, r, t0, t1, dur: t1 - t0 + 260, d: 9, fila: fAviso, drag: { aviso: 1 } }, extra || {}));
    const sello = (x, y, r, t0, ms, tin, siempre) => { if ((A.sello || siempre) && hojas().runas) it.push(ef('runas', x, y, { escala: r / (46 * escHoja('runas')), tin: tin || 0xff4a3a, suma: true, alfa: 0.7, dura: ms }, t0, fAviso, Math.round(y) + P0 - 40)); };
    const carga = (col, ms) => it.push({ tipo: 'carga', x: 0, y: -10, col, t0: 0, dur: ms, d: 1e6, fila: fAviso });
    const extras = (gx, gy, tg) => (A.extras || []).forEach((c, xi) => {
      if (!c || !c.efecto || !hojas()[c.efecto]) return;
      const fx = fExtra[xi], b = c.donde === 'jefe' ? orig(A.origen) : { x: gx, y: gy }, x = b.x + (c.dx || 0), y = b.y + (c.dy || 0);
      it.push(ef(c.efecto, x, y, { escala: c.escala || 1, tin: c.tinte, suma: !!c.suma, alfa: c.alfa != null ? c.alfa : 1, dura: c.dura }, tg + Math.max(0, c.retraso || 0), fx, lado(c.lado, c.donde === 'jefe' ? false : !!A.deHeroe, null, y), { drag: { extra: xi }, cortes: { extra: xi } }));
    });
    // delante o detrás: del héroe (las que caen donde estás) o del jefe (las que salen de él), como en el juego
    const hm = cuerpoDe((escena() && escena().playerHero) || 'soldier', true), refD = deH => deH ? hp.y - 12 + hm.pieY + P0 : mb.pieY + P0;
    const lado = (l, deH, d0, y) => l === 'delante' ? refD(deH) + 3 : l === 'detras' ? refD(deH) - 3 : d0 != null ? d0 : Math.round(y) + P0 + 30;
    const golpe = (kk, x, y, o, t0, d, extra) => { if (A.corte && kk === A.efecto) o.dura = o.dura ? Math.min(o.dura, A.corte) : A.corte; it.push(ef(kk, x, y, o, t0, fGolpe, lado(A.lado, !!A.deHeroe, d, y), Object.assign({ principal: true }, kk === A.efecto ? { cortes: { corte: 1 } } : {}, extra || {}))); };
    let zc = null;                                                            // la marca principal (para el radio)
    if (k === 'pfx_manos') {
      carga(0x5dff7a, AV); zona(hp.x, hp.y, RAD, 0, AV, { col: 0x3fe06a }); sello(hp.x, hp.y, RAD, 0, AV, 0x4aff78); zc = hp;     // (v12) verde, como en el juego
      golpe(A.efecto, hp.x, hp.y + 2, { escala: A.escala }, AV, Math.round(hp.y) + P0 + 4); extras(hp.x, hp.y, AV);
    } else if (k === 'pfx_espinas') {
      const og = A.origen || {}, o = orig({ dx: 0, dy: og.dy }), ang = Math.atan2(hp.y - o.y, hp.x - o.x), cx = Math.cos(ang), cy = Math.sin(ang), d0 = og.dx || 0;
      const N = Math.max(1, Math.round(A.cantidad)), PASO = A.paso, ENT = A.entre;
      it.push({ tipo: 'franja', x0: o.x + cx * d0, y0: o.y + cy * d0, x1: o.x + cx * (d0 + PASO * N), y1: o.y + cy * (d0 + PASO * N), w: A.ancho, t0: 0, t1: AV, dur: AV + 200, d: 9, fila: fAviso, drag: { aviso: 1 } });
      for (let i = 0; i < N; i++) {
        const x = o.x + cx * (d0 + PASO * (i + 0.5)), y = o.y + cy * (d0 + PASO * (i + 0.5));
        golpe(A.efecto, x, y + 2, { escala: A.escala + i * 0.05 }, AV + i * ENT, Math.round(y) + P0 + 3, i ? { drag: { entre: i } } : null);
        if (!i) extras(x, y, AV);
      }
      man.push({ tipo: 'origen', x: o.x + cx * d0, y: o.y + cy * d0, espinas: { o, cx, cy } });
    } else if (k === 'pfx_rayos') {
      const N = Math.max(1, Math.round(A.cantidad)), CADA = A.entre, rnd = azar(5);
      for (let i = 0; i < N; i++) {
        const t = i * CADA, x = hp.x + (rnd() * 20 - 10), y = hp.y + (rnd() * 12 - 6);
        zona(x, y, RAD, t, t + AV, i ? { drag: { entre: i } } : null); sello(x, y, RAD, t, AV); if (!i) zc = { x, y };
        golpe(A.efecto, x, y, { escala: A.escala, suma: true }, t + AV, Math.round(y) + P0 + 4);
        golpe('chispa_rayo', x, y - 8, { escala: 0.9, suma: true }, t + AV);
        extras(x, y, t + AV);
      }
    } else if (k === 'pfx_oscura' || k === 'pfx_pisoton') {
      const a = orig(A.origen); carga(k === 'pfx_oscura' ? 0xff7a2a : 0xff6a2a, AV); zc = a;
      if (k === 'pfx_oscura') sello(a.x, a.y, RAD * 0.92, 0, AV, 0xff7a2a, true); else zona(a.x, a.y, RAD, 0, AV);      // (v12) el estallido: runas de fuego, sin círculo rojo
      golpe(A.efecto, a.x, a.y, { escala: A.escala }, AV, Math.round(a.y) + P0 + 30);
      if (k === 'pfx_oscura') { /* (v12) sin la onda del piso, como en el juego */ }
      else { it.push({ tipo: 'onda', t0: AV, dur: 1100, ms: 450, r: RAD, el: 'fuego', x: a.x, y: a.y, semilla: 4, fila: fGolpe }); it.push({ tipo: 'onda', t0: AV, dur: 1030, ms: 380, r: RAD * 0.8, el: 'tierra', x: a.x, y: a.y, semilla: 5, fila: fGolpe }); }
      it.push({ tipo: 'temblor', t0: AV, dur: k === 'pfx_oscura' ? 420 : 320, f: k === 'pfx_oscura' ? 0.012 : 0.011, fila: fGolpe });
      extras(a.x, a.y, AV);
      man.push({ tipo: 'origen', x: a.x, y: a.y });
    } else if (k === 'pfx_estrellas') {
      carga(0xd08cff, AV); zc = hp;                                  // (v12) los ojos que persiguen salen de él: sin marca en el piso
      extras(hp.x, hp.y, AV + 350);
    } else if (k === 'pfx_aliento') {
      const b = orig(A.origen), ang = Math.atan2(hc.y - b.y, hc.x - b.x), L = A.radio, c = Math.cos(ang), s = Math.sin(ang);
      it.push({ tipo: 'franja', x0: b.x, y0: b.y + 14, x1: b.x + c * L, y1: b.y + 14 + s * L, w: A.ancho, t0: 0, t1: AV, dur: AV + 200, d: 9, fila: fAviso, drag: { aviso: 1 } });
      golpe(A.efecto, b.x, b.y, { escala: A.escala, giro: ang, dura: A.dura, flipY: c < 0 }, AV, Math.round(b.y) + P0 + 40);
      extras(b.x + c * L * 0.6, b.y + s * L * 0.6, AV);
      man.push({ tipo: 'origen', x: b.x, y: b.y }, { tipo: 'largo', x: b.x + c * L, y: b.y + 14 + s * L, b: { x: b.x, y: b.y + 14 } });
    } else if (k === 'pfx_siega') {
      const fxp = pies.x + A.alcance; zona(fxp, pies.y, RAD, 0, AV); zc = { x: fxp, y: pies.y };
      const o = orig(A.origen); golpe(A.efecto, o.x, o.y, { escala: A.escala }, AV, Math.round(o.y) + P0 + 30);
      extras(fxp, pies.y, AV);
      man.push({ tipo: 'origen', x: o.x, y: o.y }, { tipo: 'alcance', x: fxp, y: pies.y + RAD * SQ + 4 });
    }
    if (D0.origen && !man.some(m => m.tipo === 'origen')) { const o = orig(A.origen); man.push({ tipo: 'origen', x: o.x, y: o.y }); }
    if (zc) man.push({ tipo: 'radio', x: zc.x + RAD, y: zc.y, c: zc });
    man.push({ tipo: 'heroe', x: hp.x, y: hp.y + 8 });
    const RA = LECT_A[k], h0 = RA && RA.heroe0, cH = h0 ? { x: dist - h0.x, y: -h0.y } : null;   // el jefe y vos, leídos del juego
    if (RA) { filas.push({ txt: (NOMBRE_JEFE[tipo] || 'el jefe') + ' (juego)' }); it.push({ tipo: 'cuerpo', t0: 0, dur: RA.fin, fila: filas.length - 1 }); }
    const fondo = RA && RA.fondo ? { F: RA.fondo, ox: RA.o.x, oy: RA.o.y } : FONDO ? { F: FONDO, ox: FONDO.en.x - dist, oy: FONDO.en.y } : null;
    return { it, man, filas, actores: RA ? [] : [{ tipo, x: 0, y: 0, flip: false, ataque: true }, { tipo: (escena() && escena().playerHero) || 'soldier', heroe: true, x: dist, y: 0, flip: true }],
      lectA: RA, corre: cH ? { heroe: cH, texto: cH } : null, fondo, centro: { x: dist / 2, y: -14 }, rango: [A.dmin, A.dmax, mb.pieY] };
  };

  const armarEfecto = () => {
    const k = st.ef, h = hojas()[k]; if (!h) return null;
    const em = cuerpoDe('orc'), suelo = SUELO.test(k), y = suelo ? em.pieY : -em.dh * 0.06, a = efOf(k);
    const it = [ef(k, 0, y, { escala: 1, unaVez: false }, 0, 0, Math.round(y) + P0 + (suelo ? -6 : 30))];
    it[0].dur = h.loop ? Math.max(1200, h.n / h.fps * 1000 * 2) : h.n / h.fps * 1000;
    return { it, man: [{ tipo: 'apoyo', x: 0, y, k }], filas: [{ txt: k }], actores: [{ tipo: 'orc', x: 0, y: 0, flip: false }], centro: { x: 0, y: -6 }, cuadros: { n: h.n, fps: a.fps } };
  };
  // dónde va un estado en el muñeco del escenario (el mismo contorno del dibujo que usa el juego)
  const contornoEscena = (tipo, heroe) => {
    const S = escena(); if (!S || !PFX() || !PFX().contorno) return null;
    const key = heroe && S.heroAnim ? S.heroAnim(tipo + '_idle') : tipo + '_idle';
    if (!S.anims.exists(key)) return null;
    const fr = S.anims.get(key).frames[0].frame;
    return PFX().contorno({ frame: fr, y: 0, originY: 0.5, scaleY: cuerpoDe(tipo, heroe).s });
  };
  const dyEscena = (tipo, heroe, en) => {
    const m = cuerpoDe(tipo, heroe); if (en === 'pie') return m.pieY;
    const b = contornoEscena(tipo, heroe), h = m.dh;
    if (b) return en === 'sobre' ? b.top - 4 : en === 'cabeza' ? b.top + b.h * 0.16 : en === 'pecho' ? b.top + b.h * 0.4 : b.top + b.h * 0.52;
    return en === 'sobre' ? -h * 0.38 : en === 'cabeza' ? -h * 0.3 : en === 'pecho' ? -h * 0.1 : -h * 0.05;
  };
  const armarEstado = () => {
    const k = st.est, a = estOf(k); if (!DEF_EST[k] || !hojas()[a.fx]) return null;
    const S = escena(), heroe = a.g === 'BUF', tipo = heroe ? ((S && S.playerHero) || 'soldier') : 'orc', m = cuerpoDe(tipo, heroe);
    const x = a.dx || 0, y = dyEscena(tipo, heroe, a.en) + (a.dy || 0), h = hojas()[a.fx];
    const o = { escala: heroe ? a.esc : a.esc * Math.min(1.4, m.s / 1.2), alfa: a.alfa, suma: !!a.suma, vel: a.vel || 1, tin: a.tin };
    const e = ef(a.fx, x, y, o, 0, 0, m.pieY + P0 + (a.detras ? -1 : 2));
    e.dur = h.loop ? 2400 : h.n / (h.fps * (a.vel || 1)) * 1000; e.bucle = false;
    return { it: [e], man: [{ tipo: 'estado', x, y }], filas: [{ txt: NOM_EST[k] || k }], actores: [{ tipo, heroe, x: 0, y: 0, flip: false }], centro: { x: 0, y: -10 },
      icono: heroe ? null : { ic: a.ic, y: -m.dh * 0.42 - 6 } };
  };
  const armarEscena = () => {
    try { return st.tab === 'jefes' ? (esPfx(st.jefeHab) ? armarJefe() : armarLeida()) : st.tab === 'heroes' ? armarHeroe() : st.tab === 'efectos' ? armarEfecto() : st.tab === 'estados' ? armarEstado() : null; }
    catch (e) { console.warn('[editor hab] escenario', e); return null; }
  };

  // ---------------------------------------------------------------- dibujar
  const lienzo = (id, alto) => {
    const c = document.getElementById(id); if (!c) return null;
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1, w = Math.max(50, Math.round(r.width)), h = alto || Math.max(50, Math.round(r.height));
    if (alto && c.style.height !== alto + 'px') c.style.height = alto + 'px';
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = false;
    return { c, g, w, h };
  };
  // la cámara: centrada en lo que hay (sin la caída de la roca) y, si no entra, un poco más lejos; quieta mientras se arrastra
  const encuadre = (L, E) => {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const sum = (x, y, r) => { r = r || 0; x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r * SQ); y1 = Math.max(y1, y + r * SQ); };
    E.actores.forEach(a => { const m = cuerpoDe(a.tipo, a.heroe); sum(a.x - 14, a.y - m.dh * 0.22); sum(a.x + 14, a.y + m.pieY + 4); });
    E.man.forEach(m => sum(m.x, m.y));
    if (E.icono) sum(0, E.icono.y - 8);
    if (E.cap) { sum(E.cap.b.x0, E.cap.b.y0); sum(E.cap.b.x1, E.cap.b.y1); }
    if (E.lectA) Object.values(E.lectA.cosas).forEach(c => {                 // los personajes leídos del juego
      if (c.quien === 'texto' || c.quien === 'cosa' || !c.f.length) return; const d = (E.corre && E.corre[c.quien]) || { x: 0, y: 0 };
      [c.f[0], c.f[Math.floor(c.f.length / 2)]].forEach(s => { sum(s.x + d.x - 16, s.y + d.y - 34); sum(s.x + d.x + 16, (s.py != null ? s.py : s.y) + d.y + 6); });
    });
    E.it.forEach(e => {
      if (e.tipo === 'ef' || e.tipo === 'onda') sum(e.x, e.y, e.tipo === 'onda' ? e.r * 0.6 : 10);
      else if (e.tipo === 'zona') sum(e.x, e.y, e.r);
      else if (e.tipo === 'franja') { sum(e.x0, e.y0); sum(e.x1, e.y1); }
      else if (e.tipo === 'bala') { sum(e.x0, e.y0); sum(e.x0 + e.vx * e.dur / 1000, e.y0 + e.vy * e.dur / 1000); }
      else if (e.tipo === 'roca') sum(e.x1, e.y1);
    });
    const zu = VP.zoom[st.tab] || 3, zf = Math.min((L.w - 60) / Math.max(1, x1 - x0), (L.h - 70) / Math.max(1, y1 - y0));
    return { c: { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }, Z: VP.manual[st.tab] ? zu : Math.max(1, Math.min(VP.full ? 6 : 4, Math.floor(zf))) };   // (v10) entero: los píxeles parejos
  };
  const camara = (L, E) => {
    if (!VP.arr || !VP.cuadro) VP.cuadro = encuadre(L, E);
    const Z = VP.cuadro.Z, C = VP.cuadro.c, ox = Math.round(L.w / 2 - C.x * Z), oy = Math.round(L.h / 2 - C.y * Z);   // (v10) alineado al píxel
    return { Z, X: x => ox + x * Z, Y: y => oy + y * Z, mx: px => (px - ox) / Z, my: py => (py - oy) / Z }; };
  const cuadro = (S, key, ms, bucle) => {
    if (!key || !S.anims.exists(key)) return null;
    const a = S.anims.get(key), n = a.frames.length; if (!n) return null;
    let f = Math.floor(ms / 1000 * (a.frameRate || 10)); f = bucle ? f % n : Math.min(n - 1, f);
    return a.frames[f].frame;
  };
  const actor = (g, S, K, a, t) => {
    const ha = k => a.heroe && S.heroAnim ? S.heroAnim(k) : k;
    let fr = null;
    if (a.ataque) { const at = ha(a.tipo + '_attack2'); if (S.anims.exists(at)) { const an = S.anims.get(at); if (t < an.frames.length / (an.frameRate || 10) * 1000) fr = cuadro(S, at, t, false); } }
    if (!fr) fr = cuadro(S, ha(a.tipo + '_idle'), VP.reloj || 0, true);
    const m = cuerpoDe(a.tipo, a.heroe), x = K.X(a.x), y = K.Y(a.y);
    // (21/11, "todos tienen 2 sombras, las del sprite y las que generaste vos, dejar una sola") sólo la del dibujo
    if (!fr || !fr.source || !fr.source.image) return;
    g.save(); g.translate(x, y); g.scale(m.s * K.Z * (a.flip ? -1 : 1), m.s * K.Z);
    g.drawImage(fr.source.image, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, -fr.cutWidth / 2, -fr.cutHeight / 2, fr.cutWidth, fr.cutHeight);
    g.restore();
  };
  const hoja = (g, K, k, x, y, f, o, alfa) => {
    const h = hojas()[k], im = tenida(k, o.tin); if (!h || !im) return null;
    const col = f % h.cols, row = Math.floor(f / h.cols), s = (o.escala || 1) * escHoja(k) * K.Z;
    g.save(); g.globalAlpha = Math.max(0, Math.min(1, alfa)); if (o.suma) g.globalCompositeOperation = 'lighter';
    g.translate(K.X(x), K.Y(y)); if (o.giro) g.rotate(o.giro); g.scale(s * (o.flip ? -1 : 1), s * (o.flipY ? -1 : 1));
    g.drawImage(im, col * h.fw, row * h.fh, h.fw, h.fh, -h.ax, -h.ay, h.fw, h.fh);
    g.restore();
    return { x0: K.X(x) - h.ax * s, y0: K.Y(y) - h.ay * s, w: h.fw * s, h: h.fh * s };
  };
  const cuadroEf = (k, o, tau) => {
    const h = hojas()[k]; if (!h) return -1;
    let f = Math.floor((tau + (o.salta || 0)) / 1000 * h.fps * (o.vel || 1));
    if (!h.loop || o.unaVez) { if (f >= h.n) return -1; } else f %= h.n;
    return f;
  };
  const PALS = () => (window.CK_ONDAS && CK_ONDAS.PAL) || {};
  const ondaDib = (g, K, e, tau) => {
    const P = PALS()[e.el] || PALS().acero || ['#ffffff', '#dddddd'], rnd = azar(e.semilla * 7919 + 3), N = Math.round(16 + e.r * 0.22), luz = /fuego|luz|trueno|arcano|acero|filo/.test(e.el);
    g.save(); if (luz) g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) {
      const a = i / N * 6.283 + (rnd() - 0.5) * 0.5, f = 0.55 + rnd() * 0.5, vida = 450 + rnd() * 400, col = P[Math.floor(rnd() * Math.min(P.length, 4))], tam = 1 + Math.floor(rnd() * 3), alto = 6 + rnd() * 10;
      if (tau > vida) continue;
      const u = Math.min(1, tau / e.ms), d = e.r * f * (1 - (1 - u) * (1 - u)), v = tau / vida;
      const z = /tierra|hielo/.test(e.el) ? Math.sin(v * Math.PI) * alto : e.el === 'fuego' ? v * 10 : 0;
      g.globalAlpha = 1 - v; g.fillStyle = col;
      g.fillRect(K.X(e.x + Math.cos(a) * d) - tam * K.Z / 2, K.Y(e.y + Math.sin(a) * d * SQ - z) - tam * K.Z / 2, tam * K.Z, tam * K.Z);
    }
    g.restore();
  };
  const zonaDib = (g, K, e, tau) => {
    const ms = e.t1 - e.t0, R = e.r * K.Z, ROJO = e.col != null ? e.col : ROJO0;          // (v12) con el color de la marca del juego
    g.save(); g.translate(K.X(e.x), K.Y(e.y)); g.scale(1, SQ);
    if (tau <= ms) {
      const u = tau / ms, si = 1 - Math.cos(u * Math.PI / 2);
      g.fillStyle = rgba(ROJO, 0.08); g.beginPath(); g.arc(0, 0, R, 0, 6.3); g.fill();
      g.fillStyle = rgba(ROJO, 0.25 + 0.3 * u); g.beginPath(); g.arc(0, 0, R * si, 0, 6.3); g.fill();
      g.strokeStyle = rgba(ROJO, 0.95); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, R, 0, 6.3); g.stroke();
      const v = (tau % 480) / 480; g.strokeStyle = rgba(ROJO, v * 0.8); g.beginPath(); g.arc(0, 0, R * (1.25 - 0.25 * v * v), 0, 6.3); g.stroke();
    } else { g.fillStyle = `rgba(255,255,255,${0.55 * (1 - (tau - ms) / 260)})`; g.beginPath(); g.arc(0, 0, R, 0, 6.3); g.fill(); }
    g.restore();
  };
  const franjaDib = (g, K, e, tau) => {
    const ms = e.t1 - e.t0, L = Math.hypot(e.x1 - e.x0, e.y1 - e.y0) * K.Z, w = e.w * K.Z, a = Math.atan2(e.y1 - e.y0, e.x1 - e.x0);
    g.save(); g.translate(K.X(e.x0), K.Y(e.y0)); g.rotate(a); g.globalAlpha = tau <= ms ? 1 : Math.max(0, 1 - (tau - ms) / 200);
    g.fillStyle = rgba(ROJO, 0.12); g.fillRect(0, -w / 2, L, w);
    g.fillStyle = rgba(ROJO, 0.3); g.fillRect(0, -w / 2, L * (1 - Math.cos(Math.min(1, tau / ms) * Math.PI / 2)), w);
    g.fillStyle = rgba(ROJO, 0.95); for (let x = 0; x < L; x += 8 * K.Z / 2) { g.fillRect(x, -w / 2, 5 * K.Z / 2, 2); g.fillRect(x, w / 2 - 2, 5 * K.Z / 2, 2); }
    g.restore();
  };
  const cargaDib = (g, K, e, tau) => {
    const rnd = azar(11), n = 14;
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = hex(e.col);
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.3, d = 40 + rnd() * 30, t0 = i * (e.dur / n) * 0.6, u = (tau - t0) / (e.dur * 0.55);
      if (u < 0 || u > 1) continue;
      const q = u * u, x = e.x + Math.cos(a) * d * (1 - q), y = e.y + Math.sin(a) * d * 0.7 * (1 - q), s = (1 - 0.6 * q) * 3 * K.Z;
      g.globalAlpha = Math.min(1, (tau - t0) / 80); g.fillRect(K.X(x) - s / 2, K.Y(y) - s / 2, s, s);
    }
    g.restore();
  };
  const balaPos = (e, tau) => {
    if (e.tipo === 'roca') { const u = Math.min(1, tau / e.dur), q = u * u; return { x: e.x0 + (e.x1 - e.x0) * q, y: e.y0 + (e.y1 - e.y0) * q, rot: u * 6.283 }; }
    if (e.tipo === 'misil') {                                          // como en ck_habilidades_equipo.js: sale hacia arriba y busca al blanco
      let vx = Math.cos(e.ang - Math.PI / 2) * 160 * (e.izq ? -1 : 1), vy = Math.sin(e.ang - Math.PI / 2) * 160, x = e.x0, y = e.y0;
      for (let s = 0; s < tau; s += 16) {
        const a = Math.atan2(e.objetivo.y - y, e.objetivo.x - x); vx += Math.cos(a) * 26; vy += Math.sin(a) * 26;
        const sp = Math.hypot(vx, vy); if (sp > 320) { vx *= 320 / sp; vy *= 320 / sp; }
        x += vx * 0.016; y += vy * 0.016;
        if (Math.hypot(e.objetivo.x - x, e.objetivo.y - y) < 16) return null;
      }
      return { x, y, rot: Math.atan2(vy, vx) };
    }
    return { x: e.x0 + e.vx * tau / 1000, y: e.y0 + e.vy * tau / 1000, rot: Math.atan2(e.vy, e.vx) };
  };
  const manija = (g, K, m, sobre) => {
    const x = K.X(m.x), y = K.Y(m.y), grande = m.sel || sobre;
    const col = m.tipo === 'proy' ? '#67e8f9' : m.tipo === 'radio' || m.tipo === 'largo' || m.tipo === 'alcance' ? '#ff6a5a' : m.tipo === 'heroe' ? '#86efac' : (m.tipo === 'capa' || m.tipo === 'capJ') && !m.sel ? '#e8dcc0' : '#fde047';
    g.save(); g.lineWidth = 2; g.strokeStyle = '#000'; g.fillStyle = col;
    if (m.tipo === 'radio' || m.tipo === 'largo' || m.tipo === 'alcance') { const s = grande ? 6 : 5; g.fillRect(x - s, y - s, s * 2, s * 2); g.strokeRect(x - s, y - s, s * 2, s * 2); }
    else if (m.tipo === 'heroe') { g.beginPath(); g.moveTo(x, y - 7); g.lineTo(x + 7, y); g.lineTo(x, y + 7); g.lineTo(x - 7, y); g.closePath(); g.fill(); g.stroke(); }
    else if (m.tipo === 'apoyo') {
      [[4, '#000'], [2, col]].forEach(([lw, c]) => { g.lineWidth = lw; g.strokeStyle = c; g.beginPath(); g.moveTo(x - 14, y); g.lineTo(x - 4, y); g.moveTo(x + 4, y); g.lineTo(x + 14, y); g.moveTo(x, y - 14); g.lineTo(x, y - 4); g.moveTo(x, y + 4); g.lineTo(x, y + 14); g.stroke(); g.beginPath(); g.arc(x, y, 2, 0, 6.3); g.stroke(); });
    }
    else {
      const r = grande ? 8 : 6.5; g.globalAlpha = m.sel || sobre ? 1 : 0.85;
      g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); g.stroke();
      g.fillStyle = '#1c140e'; g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(m.txt || (m.tipo === 'proy' ? '➤' : '✚'), x, y + 0.5);
    }
    g.restore();
  };
  const textoManija = (m, arrastrando) => {
    try {
      if (m.tipo === 'capJ') { const L = capaLeida(m.key), ed = edDe(claveJefe(), m.key); return arrastrando ? `corrida ${ed.dx || 0} · alto ${ed.dy || 0}` : `${m.ci + 1} · ${L ? L.nombre : ''}: arrastrala · rueda: tamaño (${ed.esc || 1})`; }
      if (m.tipo === 'capa') { const c = capasDe(st.hab)[m.ci] || {}; return arrastrando ? `adelante ${c.ad || 0} · corrido ${c.dx || 0} · alto ${c.dy || 0}` : `Capa ${m.ci + 1} · ${nomEf(c.ef)}: arrastrala · rueda: tamaño (${c.esc || 1})`; }
      if (m.tipo === 'proy') { const a = AJ.proyectiles[m.key] || {}; return arrastrando ? `sale más adelante ${a.ad || 0} · más alto ${a.dy || 0}` : 'Salida del proyectil: arrastrala adonde tiene que nacer'; }
      if (m.tipo === 'origen') { const o = jOf(st.jefe).origen || {}; return arrastrando ? `adelante ${o.dx || 0} · alto ${o.dy || 0}` : 'De dónde sale el golpe: arrastrala'; }
      if (m.tipo === 'radio') return arrastrando ? `radio ${jOf(st.jefe).radio} px` : 'Radio de la marca roja: arrastralo';
      if (m.tipo === 'largo') return arrastrando ? `largo ${jOf(st.jefe).radio} px` : 'Largo del fuego: arrastralo';
      if (m.tipo === 'alcance') return arrastrando ? `alcance ${jOf(st.jefe).alcance} px` : 'Alcance adelante: arrastralo';
      if (m.tipo === 'heroe') return arrastrando ? `distancia ${VP.dist[st.jefe]} px` : 'Vos: arrastrá para ver el golpe a otra distancia (no se guarda)';
      if (m.tipo === 'apoyo') { const a = efOf(st.ef); return arrastrando ? `apoyo ${a.ax}, ${a.ay}` : 'Arrastrá el dibujo para mover el punto de apoyo'; }
      if (m.tipo === 'estado') { const a = estOf(st.est); return arrastrando ? `corrido ${a.dx || 0} · alto ${a.dy || 0}` : `${NOM_EST[st.est]}: arrastralo · rueda: tamaño (${a.esc})`; }
    } catch (e) {}
    return '';
  };
  const etiqueta = (g, K, L, m, t) => {
    if (!t) return;
    g.save(); g.font = '11px sans-serif';
    const w = g.measureText(t).width + 10, x = Math.max(4, Math.min(L.w - w - 4, K.X(m.x) + 12)), y = Math.max(4, Math.min(L.h - 22, K.Y(m.y) - 26));
    g.fillStyle = 'rgba(20,14,9,.88)'; g.fillRect(x, y, w, 18); g.strokeStyle = '#8a6a3a'; g.strokeRect(x + 0.5, y + 0.5, w - 1, 17);
    g.fillStyle = '#fde68a'; g.textBaseline = 'middle'; g.fillText(t, x + 5, y + 9.5); g.restore();
  };
  const NOMBRE_MAN = { capJ: 'una capa: arrastrala o rueda para el tamaño', capa: 'de dónde sale', proy: 'salida del proyectil', origen: 'de dónde sale', radio: 'radio de la marca', largo: 'largo del fuego', alcance: 'alcance adelante', heroe: 'dónde está el héroe (sólo para ver)', estado: 'dónde va el estado', apoyo: 'punto de apoyo: arrastrá el dibujo' };

  const dibujar = () => {
    const S = escena(); if (!S || !st.abierto || st.tab === 'notas') return;
    const L = lienzo('ckeh-lienzo'); if (!L) return;
    const E = VP.esc = armarEscena(), g = L.g;
    g.fillStyle = '#4d3f2a'; g.fillRect(0, 0, L.w, L.h);
    if (!E) { g.fillStyle = '#e8dcc0'; g.font = '13px MedievalSharp, serif'; g.fillText(st.tab === 'jefes' ? 'Las habilidades de jefes no están cargadas.' : 'No hay nada para mostrar.', 16, 26); return; }
    const K = camara(L, E), t = VP.t;
    // el piso: el lugar de verdad (héroes y jefes) o la cuadrícula de 16 px del juego
    autoLeer(S);
    const conFondo = (st.tab === 'heroes' || (st.tab === 'jefes' && esJefe(st.jefeTipo))) && dibFondo(g, K, E.fondo);
    if (!conFondo) {
      g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 1;
      const x0 = K.mx(0), x1 = K.mx(L.w), y0 = K.my(0), y1 = K.my(L.h);
      for (let x = Math.floor(x0 / 16) * 16; x < x1; x += 16) { g.beginPath(); g.moveTo(Math.round(K.X(x)) + 0.5, 0); g.lineTo(Math.round(K.X(x)) + 0.5, L.h); g.stroke(); }
      for (let y = Math.floor(y0 / 16) * 16; y < y1; y += 16) { g.beginPath(); g.moveTo(0, Math.round(K.Y(y)) + 0.5); g.lineTo(L.w, Math.round(K.Y(y)) + 0.5); g.stroke(); }
    }
    // temblor
    let sh = E.cap ? temblorLeido(E.cap, t) : E.lectA ? temblorLeido(E.lectA, Math.min(t, E.lectA.fin)) : 0; E.it.forEach(e => { const tau = t - e.t0; if (tau < 0 || tau > e.dur) return; if (e.tipo === 'temblor') sh = Math.max(sh, e.f); if (e.tipo === 'ulti' && tau < 380 * e.f) sh = Math.max(sh, 0.011 * e.f); });
    g.save(); if (sh) g.translate((Math.random() * 2 - 1) * sh * L.w * 0.6, (Math.random() * 2 - 1) * sh * L.h * 0.6);
    // el alcance del jefe (desde / hasta)
    if (E.rango) {
      const [dmin, dmax, py] = E.rango, y = K.Y(py + 2);
      g.strokeStyle = 'rgba(134,239,172,.45)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(K.X(dmin), y); g.lineTo(K.X(dmax), y); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(134,239,172,.7)'; g.fillRect(K.X(dmin) - 1, y - 4, 2, 8); g.fillRect(K.X(dmax) - 1, y - 4, 2, 8);
    }
    // todo lo que se ve, por profundidad (como en el juego: más abajo, más adelante)
    const cosas = [];
    E.actores.forEach(a => cosas.push({ d: Math.round(a.y + cuerpoDe(a.tipo, a.heroe).pieY) + P0, f: () => actor(g, S, K, a, t) }));
    if (E.cap) cosasLeidas(cosas, g, S, K, E, t);                   // lo leído del juego (jefes y enemigos), con sus cambios
    if (E.lectA) cosasActores(cosas, g, S, K, E.lectA, t, E.corre);   // el personaje y a quien golpea, leídos del juego
    let caja = null;
    E.it.forEach(e => {
      const tau = t - e.t0; if (tau < 0 || tau > e.dur) return;
      if (e.tipo === 'ef') {
        const f = cuadroEf(e.k, e.o, tau); if (f < 0) return;
        let alfa = e.o.alfa != null ? e.o.alfa : 1; if (e.o.dura && tau > e.o.dura) alfa *= Math.max(0, 1 - (tau - e.o.dura) / 200);
        const h = hojas()[e.k];
        if (h && h.atras && hojas()[h.atras]) cosas.push({ d: e.d - 32, f: () => hoja(g, K, h.atras, e.x, e.y, f, e.o, alfa) });
        cosas.push({ d: e.d, f: () => { const b = hoja(g, K, e.k, e.x, e.y, f, e.o, alfa); if (st.tab === 'efectos') caja = b; } });
      } else if (e.tipo === 'onda') cosas.push({ d: Math.round(e.y) + P0 + 31, f: () => ondaDib(g, K, e, tau) });
      else if (e.tipo === 'zona') cosas.push({ d: 9, f: () => zonaDib(g, K, e, tau) });
      else if (e.tipo === 'franja') cosas.push({ d: 9, f: () => franjaDib(g, K, e, tau) });
      else if (e.tipo === 'carga') cosas.push({ d: 1e6, f: () => cargaDib(g, K, e, tau) });
      else if (e.tipo === 'bala' || e.tipo === 'roca' || e.tipo === 'misil') {
        const q = balaPos(e, tau); if (!q) return;
        const h = hojas()[e.k]; if (!h) return;
        const f = Math.floor(tau / 1000 * h.fps) % h.n;
        cosas.push({ d: 30001 + P0, f: () => hoja(g, K, e.k, q.x, q.y, f, { escala: e.esc, giro: q.rot }, 1) });
      }
    });
    if (E.icono && window.CK_VFX_ARTE && CK_VFX_ARTE.iconos && CK_VFX_ARTE.iconos[E.icono.ic]) cosas.push({ d: 1e7, f: () => {      // el ícono arriba de la cabeza, como en el juego
      const k = 'ic:' + E.icono.ic; let im = IMGS[k]; if (!im) { im = IMGS[k] = new Image(); im.src = CK_VFX_ARTE.iconos[E.icono.ic]; }
      if (!im.complete || !im.naturalWidth) return; const w = im.naturalWidth * 0.42 * K.Z, h = im.naturalHeight * 0.42 * K.Z;
      g.drawImage(im, K.X(0) - w / 2, K.Y(E.icono.y) - h / 2, w, h);
    } });
    cosas.sort((a, b) => a.d - b.d).forEach(c => { try { c.f(); } catch (er) {} });
    g.restore();
    // ulti: el destello y la pantalla que se oscurece
    E.it.forEach(e => {
      const tau = t - e.t0; if (e.tipo !== 'ulti' || tau < 0 || tau > e.dur) return;
      if (tau < 110) { g.fillStyle = rgba(e.col, 0.45 * (1 - tau / 110)); g.fillRect(0, 0, L.w, L.h); }
      if (tau > 120) { g.fillStyle = `rgba(0,0,0,${0.42 * Math.max(0, 1 - (tau - 120) / 520)})`; g.fillRect(0, 0, L.w, L.h); }
    });
    // la caja del dibujo (efectos) y las manijas
    if (caja) { g.save(); g.strokeStyle = 'rgba(253,224,71,.5)'; g.setLineDash([3, 3]); g.strokeRect(caja.x0, caja.y0, caja.w, caja.h); g.restore(); VP.caja = caja; }
    E.man.forEach(m => manija(g, K, m, VP.sobre === m.tipo + (m.ci != null ? m.ci : '')));
    // la indicación al lado de la manija: qué es y, mientras se arrastra, los números
    const mm = VP.arr ? VP.arr.m : VP.sobreM;
    if (mm) { const q = VP.arr ? (E.man.find(m => m.tipo === mm.tipo && m.ci === mm.ci) || mm) : E.man.find(m => m.tipo === mm.tipo && m.ci === mm.ci && m.key === mm.key); if (q) etiqueta(g, K, L, q, textoManija(q, !!VP.arr)); }
    dibujarMarcas(g, K, L);
    if (E.leyendo || E.espera) {
      const tx = E.leyendo ? '● leyendo del juego lo que hace… (unos segundos)' : 'Tocá "⟳ Leer del juego": la hace una vez y queda acá en capas para editar.';
      g.save(); g.font = '12px MedievalSharp, serif'; const w = g.measureText(tx).width + 16;
      g.fillStyle = E.leyendo ? 'rgba(160,90,20,.92)' : 'rgba(20,14,9,.88)'; g.fillRect(8, L.h - 30, w, 22); g.fillStyle = '#fff'; g.fillText(tx, 16, L.h - 15); g.restore();
    }
    if (VP.leerA) { const tx = '● leyendo la animación del juego…'; g.save(); g.font = '12px MedievalSharp, serif'; const w = g.measureText(tx).width + 16; g.fillStyle = 'rgba(160,90,20,.92)'; g.fillRect(8, L.h - 30, w, 22); g.fillStyle = '#fff'; g.fillText(tx, 16, L.h - 15); g.restore(); }
    if (E.vacio) { g.fillStyle = '#e8dcc0'; g.font = '12px MedievalSharp, serif'; g.fillText('Esta habilidad no tiene capas propias: usá "Probar en el juego".', 12, L.h - 12); }
    // la hora
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(L.w - 74, 6, 68, 18); g.fillStyle = '#fde68a'; g.font = '11px sans-serif'; g.textAlign = 'right'; g.fillText((t / 1000).toFixed(2).replace('.', ',') + ' s', L.w - 12, 19); g.textAlign = 'left';
    VP.K = K; VP.L = L;
    tiempo(E);
  };

  // ---------------------------------------------------------------- la línea de tiempo
  const T_IZQ = 86;
  const tiempo = E => {
    const filas = E.filas || [], L = lienzo('ckeh-tiempo', 20 + Math.max(1, filas.length) * 15 + 4); if (!L) return;
    const g = L.g, tot = VP.total = Math.max(900, Math.ceil((E.it.reduce((m, e) => Math.max(m, e.t0 + Math.min(e.dur, e.bucle ? 1200 : e.dur)), 0) + 250) / 100) * 100);
    const X = ms => T_IZQ + (L.w - T_IZQ - 8) * ms / tot;
    g.fillStyle = '#1a120c'; g.fillRect(0, 0, L.w, L.h);
    g.fillStyle = '#b9a27c'; g.font = '10px sans-serif'; g.strokeStyle = 'rgba(255,255,255,.12)';
    for (let ms = 0; ms <= tot; ms += 100) { const x = Math.round(X(ms)) + 0.5; g.beginPath(); g.moveTo(x, ms % 500 ? 12 : 8); g.lineTo(x, L.h); g.stroke(); if (!(ms % 500)) g.fillText((ms / 1000).toString().replace('.', ',') + ' s', x + 2, 10); }
    filas.forEach((f, i) => {
      const y = 18 + i * 15, sel = (st.tab === 'heroes' && f.capa === st.capa) || (f.cap && f.cap === st.capJ);
      g.fillStyle = sel ? '#fde047' : '#e8dcc0'; g.font = '11px MedievalSharp, serif'; g.fillText(f.txt.length > 14 ? f.txt.slice(0, 13) + '…' : f.txt, 4, y + 10);
    });
    VP.barras = [];
    E.it.forEach(e => {
      if (e.fila == null) return;
      const y = 18 + e.fila * 15, x0 = X(e.t0), x1 = X(Math.min(tot, e.t0 + Math.min(e.dur, e.bucle ? 1200 : e.dur)));
      const col = e.tipo === 'zona' || e.tipo === 'franja' || e.tipo === 'carga' ? '#e0483a' : e.drag && e.drag.extra != null ? '#7ab8e8' : st.tab === 'heroes' && e.fila === st.capa ? '#fde047' : e.drag && e.drag.cap && e.drag.cap === st.capJ ? '#fde047' : e.tipo === 'cuerpo' ? '#7a6a4a' : e.tipo === 'temblor' ? '#a08060' : '#c9a25a';
      g.fillStyle = col; g.globalAlpha = e.fuera ? 0.25 : 0.9; g.fillRect(x0, y + 2, Math.max(3, x1 - x0), 10); g.globalAlpha = 1;
      if (e.bucle) { g.fillStyle = '#1a120c'; g.fillText('∞', x1 - 9, y + 11); }
      const izq = !!(e.cortes && (e.cortes.capa != null || e.cortes.cap)), der = !!e.cortes;
      if (izq) { g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(x0, y + 2, 2, 10); } else if (e.drag) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x0, y + 2, 2, 10); }
      if (der) { g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(Math.max(x0 + 3, x1) - 2, y + 2, 2, 10); }
      if (e.drag || e.cortes) VP.barras.push({ x0, x1: Math.max(x0 + 6, x1), y0: y + 1, y1: y + 13, e, izq, der });
    });
    const xp = X(Math.min(VP.t, tot)); g.strokeStyle = '#fde047'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xp, 0); g.lineTo(xp, L.h); g.stroke();
    VP.TX = { X, ms: px => (px - T_IZQ) / (L.w - T_IZQ - 8) * tot };
  };

  // ---------------------------------------------------------------- editar arrastrando
  const enMundo = (ev, id) => { const c = document.getElementById(id), r = c.getBoundingClientRect(); return { px: ev.clientX - r.left, py: ev.clientY - r.top }; };
  const buscarManija = (px, py) => {
    const E = VP.esc, K = VP.K; if (!E || !K) return null;
    let mejor = null, dm = 11;
    E.man.forEach(m => { const d = Math.hypot(K.X(m.x) - px, K.Y(m.y) - py); if (d < dm && m.tipo !== 'apoyo') { dm = d; mejor = m; } });
    if (!mejor && st.tab === 'efectos' && VP.caja) { const b = VP.caja; if (px >= b.x0 && px <= b.x0 + b.w && py >= b.y0 && py <= b.y0 + b.h) mejor = E.man[0]; }
    return mejor;
  };
  const redondo = (v, p) => +(Math.round(v / (p || 1)) * (p || 1)).toFixed(3);
  const mover = (a, dx, dy, w) => {                                         // dx, dy: cuánto se movió desde que se agarró (en px del juego)
    const m = a.m;
    if (m.tipo === 'capJ') { const ed = edCap(m.key), k0 = a.k0 || {}; ed.dx = Math.round((k0.dx || 0) + dx); ed.dy = Math.round((k0.dy || 0) + dy); limpiarCap(); guardar(); return; }
    if (m.tipo === 'capa') {
      const capas = capasDe(st.hab), c = capas[m.ci], c0 = a.c0; if (!c) return;
      const [fx, fy] = dirM();
      if (fx !== 0) { c.dx = Math.round((c0.dx || 0) + dx * (fx < 0 ? -1 : 1)); c.dy = Math.round((c0.dy || 0) + dy); }
      else { c.dx = Math.round((c0.dx || 0) + dx); c.ad = Math.round((c0.ad || 0) + dy / (0.8 * fy)); }
      tocarHeroe(st.hab, capas);
    } else if (m.tipo === 'proy') {
      const pr = AJ.proyectiles[m.key] = AJ.proyectiles[m.key] || {}, nx = m.x + dx - m.base.x, ny = m.y + dy - m.base.y;
      if (m.fx !== 0) { pr.ad = Math.round(nx * m.fx); pr.dy = Math.round(ny); } else { pr.ad = Math.round(ny / (0.8 * m.fy)); pr.dy = 0; }
      guardar();
    } else if (m.tipo === 'origen') {
      const J = JP(), mb = cuerpoDe(J.DEF[st.jefe].jefe);
      if (m.espinas) { const q = { x: m.x + dx, y: m.y + dy }, o = m.espinas.o; tocarJefe(st.jefe, 'origen', { dx: Math.round((q.x - o.x) * m.espinas.cx + (q.y - o.y) * m.espinas.cy), dy: Math.round(q.y - mb.pieY - ((q.x - o.x) * m.espinas.cx + (q.y - o.y) * m.espinas.cy) * m.espinas.cy) }); }
      else tocarJefe(st.jefe, 'origen', { dx: Math.round(m.x + dx), dy: Math.round(m.y + dy - mb.pieY) });
    } else if (m.tipo === 'radio') { const q = { x: m.x + dx, y: m.y + dy }; tocarJefe(st.jefe, 'radio', Math.max(8, Math.round(Math.hypot(q.x - m.c.x, (q.y - m.c.y) / SQ)))); }
    else if (m.tipo === 'largo') { const q = { x: m.x + dx, y: m.y + dy }; tocarJefe(st.jefe, 'radio', Math.max(20, Math.round(Math.hypot(q.x - m.b.x, q.y - m.b.y)))); }
    else if (m.tipo === 'alcance') tocarJefe(st.jefe, 'alcance', Math.max(0, Math.round(m.x + dx)));
    else if (m.tipo === 'heroe') VP.dist[st.jefe] = Math.max(16, Math.min(460, Math.round(m.x + dx)));
    else if (m.tipo === 'estado') { const a0 = a.es0; AJ.estados[st.est] = Object.assign(AJ.estados[st.est] || {}, { dx: Math.round((a0.dx || 0) + dx), dy: Math.round((a0.dy || 0) + dy) }); aplicarEstado(st.est); guardar(); }
    else if (m.tipo === 'apoyo') {
      const k = m.k, a0 = a.ef0, s = (a0.esc || 1);
      AJ.efectos[k] = Object.assign(AJ.efectos[k] || {}, { ax: redondo(a0.ax - dx / s, 0.5), ay: redondo(a0.ay - dy / s, 0.5) });
      aplicarEfecto(k); guardar();
    }
  };
  // cortar: el final ("dura": se apaga 200 ms) o el comienzo ("salta": empieza más adelante en su animación)
  const vueltaDe = (k, vel, salta) => { const h = hojas()[k]; return h ? { ms: h.n / (h.fps * (vel || 1)) * 1000 - (salta || 0), una: !h.loop } : { ms: 600, una: true }; };
  const cortarFin = (D, k, o, unaVez) => { const v = vueltaDe(k, o.vel, o.salta); return (v.una || unaVez) && D >= v.ms - 15 ? null : Math.max(1, redondo(D - 200, 10)); };
  const moverTiempo = (b, dms) => {                                       // b: lo que se agarró (la barra y cómo estaba)
    if (b.modo === 'der' || b.modo === 'izq') {
      const e = b.b.e, k = e.cortes || {}, D = b.dur0 + dms;
      if (k.capa != null) {
        const capas = capasDe(st.hab), c = capas[k.capa], c0 = b.c0; if (!c) return;
        if (b.modo === 'der') { const v = cortarFin(D, c.ef, c, c.unaVez); if (v == null) delete c.dura; else c.dura = v; }
        else {
          const tope = Math.max(0, vueltaDe(c.ef, c.vel, 0).ms - 60), sa = Math.max(0, Math.min(tope, redondo((c0.salta || 0) + dms, 10))), d2 = sa - (c0.salta || 0);
          if (sa) c.salta = sa; else delete c.salta;
          c.ret = Math.max(0, (c0.ret || 0) + d2);
          if (c0.dura) c.dura = Math.max(1, c0.dura - d2);
        }
        tocarHeroe(st.hab, capas); return;
      }
      if (k.cap) {                                                          // una capa leída del juego
        const L = capaLeida(k.cap); if (!L) return;
        const ed = edCap(k.cap), k0 = b.k0 || {}, vida = vidaCapa(L), sa0 = k0.sa || 0, co0 = k0.co != null ? k0.co : vida;
        if (b.modo === 'der') { const co = redondo(sa0 + D, 10); if (co >= vida - 15) delete ed.co; else ed.co = Math.max(sa0 + 30, co); }
        else { const sa = Math.max(0, Math.min(co0 - 30, redondo(sa0 + dms, 10))); if (sa) ed.sa = sa; else delete ed.sa; }
        limpiarCap(); guardar(); return;
      }
      if (k.corte) { const v = cortarFin(D, e.k, e.o, false); tocarJefe(st.jefe, 'corte', v); return; }
      if (k.extra != null) { const ex = copia(b.j0.extras || []), c = ex[k.extra]; if (!c) return; const v = cortarFin(D, c.efecto, c, false); if (v == null) delete c.dura; else c.dura = v; tocarJefe(st.jefe, 'extras', ex); return; }
      return;
    }
    const d = b.b.e.drag, s = 10;
    if (d.cap) { const L = capaLeida(d.cap); if (!L) return; const ed = edCap(d.cap); ed.dt = Math.max(-L.nace, Math.min(5000, redondo(((b.k0 || {}).dt || 0) + dms, s))); limpiarCap(); guardar(); return; }
    if (d.capa != null) {
      const capas = capasDe(st.hab), c = capas[d.capa], c0 = b.c0; if (!c) return;
      if (!d.inst) c.ret = Math.max(0, redondo((c0.ret || 0) + dms, s)); else c.cada = Math.max(0, redondo((c0.cada || 0) + dms / d.inst, s));
      tocarHeroe(st.hab, capas);
    } else if (d.aviso) tocarJefe(st.jefe, 'aviso', Math.max(100, redondo(b.j0.aviso + dms, s)));
    else if (d.extra != null) { const ex = copia(b.j0.extras || []); if (!ex[d.extra]) return; ex[d.extra].retraso = Math.max(0, redondo((ex[d.extra].retraso || 0) + dms, s)); tocarJefe(st.jefe, 'extras', ex); }
    else if (d.entre) tocarJefe(st.jefe, 'entre', Math.max(0, redondo(b.j0.entre + dms / d.entre, s)));
  };
  const rueda = (signo, ev) => {
    if (ev.shiftKey) { VP.zoom[st.tab] = Math.max(1, Math.min(6, (VP.cuadro ? VP.cuadro.Z : VP.zoom[st.tab] || 3) + (signo > 0 ? 0.5 : -0.5))); VP.manual[st.tab] = true; return; }
    const f = signo > 0 ? 1.08 : 1 / 1.08;
    if (st.tab === 'heroes') {
      const m = VP.sobreM;
      if (m && m.tipo === 'proy') { const pr = AJ.proyectiles[m.key] = AJ.proyectiles[m.key] || {}; pr.esc = redondo((pr.esc != null ? pr.esc : PROY[m.key][2]) * f, 0.01); guardar(); return; }
      const capas = capasDe(st.hab), c = capas[m && m.tipo === 'capa' ? m.ci : st.capa]; if (!c || /^@(temblor|onda)/.test(c.ef)) return;
      c.esc = redondo((c.esc || 1) * f, 0.01); tocarHeroe(st.hab, capas);
    } else if (st.tab === 'jefes' && !esPfx(st.jefeHab)) { const m = VP.sobreM, key = m && m.tipo === 'capJ' ? m.key : st.capJ; if (!key || !capaLeida(key)) return; const ed = edCap(key); ed.esc = Math.max(0.1, Math.min(6, redondo((ed.esc || 1) * f, 0.01))); limpiarCap(); guardar(); }
    else if (st.tab === 'jefes') { const A = jOf(st.jefe); tocarJefe(st.jefe, 'escala', redondo(A.escala * f, 0.01)); }
    else if (st.tab === 'efectos') { const a = efOf(st.ef); AJ.efectos[st.ef] = Object.assign(AJ.efectos[st.ef] || {}, { esc: redondo(a.esc * f, 0.01) }); aplicarEfecto(st.ef); guardar(); }
    else if (st.tab === 'estados') { const a = estOf(st.est); AJ.estados[st.est] = Object.assign(AJ.estados[st.est] || {}, { esc: redondo(a.esc * f, 0.01) }); aplicarEstado(st.est); guardar(); }
  };
  let tPintar = 0;
  const pintarLuego = () => { clearTimeout(tPintar); tPintar = setTimeout(pintar, 250); };
  const engancharLienzos = () => {
    const cv = document.getElementById('ckeh-lienzo'), tl = document.getElementById('ckeh-tiempo'); if (!cv || cv._ok) return; cv._ok = 1;
    cv.addEventListener('pointerdown', ev => {
      const { px, py } = enMundo(ev, 'ckeh-lienzo');
      if (VP.nota && VP.K) {                                       // marcando una nota: trazo libre
        ev.preventDefault(); cv.setPointerCapture(ev.pointerId);
        VP.nota.actual = { c: VP.nota.col, p: [[VP.K.mx(px), VP.K.my(py)]] }; VP.nota.trazos.push(VP.nota.actual); return;
      }
      const ins = (VP.insignias || []).find(b => Math.hypot(b.x - px, b.y - py) < 10);
      if (ins) { ev.preventDefault(); const mk = (AJ.marcas || []).find(x => x.id === ins.id); VP.marcaSel = VP.marcaSel === ins.id ? null : ins.id; if (mk) { VP.t = mk.t; VP.play = false; pintarBarra(); } return; }
      const m = buscarManija(px, py); if (!m) { if (VP.marcaSel) VP.marcaSel = null; return; }
      ev.preventDefault(); cv.setPointerCapture(ev.pointerId);
      if (m.tipo === 'capa' && st.capa !== m.ci) { st.capa = m.ci; pintarLuego(); }
      if (m.tipo === 'capJ' && st.capJ !== m.key) { st.capJ = m.key; pintarLuego(); }
      const capa = m.tipo === 'capa' ? capasDe(st.hab)[m.ci] : null;
      VP.arr = { m, px, py, c0: capa ? copia(capa) : null, k0: m.tipo === 'capJ' ? copia(edDe(claveJefe(), m.key)) : null, ef0: st.tab === 'efectos' ? efOf(st.ef) : null, es0: st.tab === 'estados' ? estOf(st.est) : null };
    });
    cv.addEventListener('pointermove', ev => {
      const { px, py } = enMundo(ev, 'ckeh-lienzo'), K = VP.K; if (!K) return;
      if (VP.nota) { cv.style.cursor = 'crosshair'; const a = VP.nota.actual; if (a) { const q = [K.mx(px), K.my(py)], u = a.p[a.p.length - 1]; if (Math.hypot(q[0] - u[0], q[1] - u[1]) > 1 / K.Z) a.p.push(q); } return; }
      if (VP.arr) { mover(VP.arr, (px - VP.arr.px) / K.Z, (py - VP.arr.py) / K.Z); return; }
      const ins = (VP.insignias || []).find(b => Math.hypot(b.x - px, b.y - py) < 10); VP.sobreMarca = ins ? ins.id : null;
      if (ins) { cv.style.cursor = 'pointer'; cv.title = 'nota: clic para verla en su momento'; return; }
      const m = buscarManija(px, py); VP.sobreM = m; VP.sobre = m ? m.tipo + (m.ci != null ? m.ci : '') : null;
      cv.style.cursor = m ? 'grab' : 'default'; cv.title = m ? NOMBRE_MAN[m.tipo] + (m.tipo === 'capa' || m.tipo === 'capJ' ? ' (capa ' + (m.ci + 1) + ')' : '') : '';
    });
    const soltarL = () => { if (VP.nota && VP.nota.actual) { VP.nota.actual = null; pintarNotaForm(); return; } if (VP.arr) { VP.arr = null; pintarLuego(); } };
    cv.addEventListener('pointerleave', () => { if (!VP.arr) { VP.sobreM = null; VP.sobre = null; } });
    cv.addEventListener('pointerup', soltarL); cv.addEventListener('pointercancel', soltarL);
    cv.addEventListener('wheel', ev => { ev.preventDefault(); ev.stopPropagation(); rueda(ev.deltaY < 0 ? 1 : -1, ev); pintarLuego(); }, { passive: false });
    tl.addEventListener('pointerdown', ev => {
      const { px, py } = enMundo(ev, 'ckeh-tiempo'); ev.preventDefault(); tl.setPointerCapture(ev.pointerId);
      const b = (VP.barras || []).slice().reverse().find(b => px >= b.x0 - 2 && px <= b.x1 + 2 && py >= b.y0 && py <= b.y1);
      if (b) {
        const d = b.e.drag || {}, k = b.e.cortes || {}, ci = d.capa != null ? d.capa : k.capa;
        const modo = b.der && Math.abs(px - b.x1) <= 5 ? 'der' : b.izq && Math.abs(px - b.x0) <= 5 ? 'izq' : b.e.drag ? 'mover' : null;
        if (ci != null && st.capa !== ci) { st.capa = ci; pintarLuego(); }
        const ck = d.cap || k.cap; if (ck && st.capJ !== ck) { st.capJ = ck; pintarLuego(); }
        if (!modo) return;
        VP.arrT = { b, px, modo, dur0: Math.min(b.e.dur, b.e.bucle ? 1200 : b.e.dur), c0: ci != null ? copia(capasDe(st.hab)[ci]) : null, j0: st.tab === 'jefes' && esPfx(st.jefeHab) ? copia(jOf(st.jefe)) : null, k0: ck ? copia(edDe(claveJefe(), ck)) : null };
        return;
      }
      const f = (VP.esc && VP.esc.filas || [])[Math.floor((py - 18) / 15)];
      if (px < T_IZQ && f && f.capa != null) { st.capa = f.capa; pintarLuego(); return; }
      if (px < T_IZQ && f && f.cap) { st.capJ = f.cap; pintarLuego(); return; }
      VP.play = false; VP.arrT = { scrub: true }; if (VP.TX) VP.t = Math.max(0, Math.min(VP.total, VP.TX.ms(px))); pintarBarra();
    });
    tl.addEventListener('pointermove', ev => {
      const { px, py } = enMundo(ev, 'ckeh-tiempo'), a = VP.arrT;
      if (!a) {
        const b = (VP.barras || []).find(b => px >= b.x0 - 2 && px <= b.x1 + 2 && py >= b.y0 && py <= b.y1);
        const borde = b && ((b.der && Math.abs(px - b.x1) <= 5) || (b.izq && Math.abs(px - b.x0) <= 5));
        tl.style.cursor = borde ? 'ew-resize' : b && b.e.drag ? 'grab' : 'pointer';
        tl.title = borde ? 'arrastrá el borde para cortarla' : b && b.e.drag ? 'arrastrala para cambiar cuándo sale' : 'clic: ver ese momento';
        return;
      }
      if (a.scrub) { if (VP.TX) VP.t = Math.max(0, Math.min(VP.total, VP.TX.ms(px))); return; }
      if (VP.TX) moverTiempo(a, VP.TX.ms(px) - VP.TX.ms(a.px));
    });
    const soltarT = () => { if (VP.arrT) { const b = !VP.arrT.scrub; VP.arrT = null; if (b) pintarLuego(); } };
    tl.addEventListener('pointerup', soltarT); tl.addEventListener('pointercancel', soltarT);
  };
  const htmlBarra = () => {
    const mira = st.tab === 'heroes' ? `<span class="sep"></span>${[['izq', '←'], ['der', '→'], ['arriba', '↑'], ['abajo', '↓']].map(([k, t]) => `<button class="mini ${VP.mira === k ? '' : 'sec'}" data-v="mira:${k}" title="mira hacia ${k === 'der' ? 'la derecha' : k === 'izq' ? 'la izquierda' : k}">${t}</button>`).join('')}` : '';
    return `<button class="mini" data-v="play">${VP.play ? '❚❚' : '▶'}</button>${[0.25, 0.5, 1].map(v => `<button class="mini ${VP.vel === v ? '' : 'sec'}" data-v="vel:${v}">${String(v).replace('.', ',')}×</button>`).join('')}
      <span class="sep"></span><button class="mini sec" data-v="zoom:-1" title="alejar">－</button><button class="mini sec" data-v="zoom:1" title="acercar">＋</button>${mira}
      <span class="sep"></span><button class="mini" data-a="probar" title="usarla de verdad en el juego">▶ en el juego</button>
      <span class="sep"></span><button class="mini ${VP.nota ? 'on' : ''}" data-v="nota" title="marcar sobre el escenario y escribir cómo lo querés (tecla N)">✎ Nota</button><button class="mini sec" data-v="vernotas" title="mostrar u ocultar las notas marcadas">${VP.verNotas === false ? '○' : '◉'} notas</button>
      <span class="sep"></span><button class="mini sec" data-v="full" title="${VP.full ? 'volver al tamaño de antes' : 'el editor ocupa toda la pantalla'}">${VP.full ? '⤡ achicar' : '⤢ pantalla completa'}</button>`;
  };
  const pintarBarra = () => {
    const b = document.getElementById('ckeh-barra'); if (!b) return;
    b.innerHTML = htmlBarra();
    b.querySelectorAll('[data-v]').forEach(x => x.onclick = e => {
      e.stopPropagation(); const [k, v] = x.dataset.v.split(':');
      if (k === 'play') { VP.play = !VP.play; if (VP.play && VP.t >= VP.total) VP.t = 0; }
      if (k === 'vel') VP.vel = +v;
      if (k === 'zoom') { VP.zoom[st.tab] = Math.max(1, Math.min(6, (VP.cuadro ? VP.cuadro.Z : VP.zoom[st.tab] || 3) + (+v) * 0.5)); VP.manual[st.tab] = true; }
      if (k === 'mira') VP.mira = v;
      if (k === 'nota') return notaModo(!VP.nota);
      if (k === 'vernotas') VP.verNotas = VP.verNotas === false;
      if (k === 'full') return pantallaCompleta();
      pintarBarra();
    });
    b.querySelectorAll('[data-a=probar]').forEach(x => x.onclick = e => { e.stopPropagation(); const S = escena(); if (!S) return; if (VP.full && !(st.tab === 'jefes' && !esPfx(st.jefeHab))) pantallaCompleta(false, true); probar(S, false); });
    const ay = document.getElementById('ckeh-ayuda');
    VP.ayuda0 = st.tab === 'jefes' && !esPfx(st.jefeHab) ? 'Leída del juego, en capas: arrastrá el número de una capa para correrla; rueda sobre ella: su tamaño. Abajo, cada barra: arrastrala para cambiar cuándo sale y sus bordes blancos para cortarla.'
      : st.tab === 'jefes' ? 'Arrastrá: ✚ de dónde sale · ■ el radio · ◆ el héroe (para ver a otra distancia). Rueda: tamaño del efecto. Abajo: arrastrá la barra roja para cambiar el aviso y las de las capas para moverlas; los bordes blancos, para cortarlas.'
      : st.tab === 'heroes' ? 'Arrastrá los números (de dónde sale cada capa) y ➤ (la salida del proyectil); rueda sobre uno: su tamaño. Abajo, cada barra: arrastrala para cambiar cuándo sale (la segunda, cada cuánto) y sus bordes blancos para cortarla.'
      : st.tab === 'estados' ? 'Arrastrá la ✚ para mover el estado; rueda: su tamaño. Arriba de la cabeza se ve el ícono, como en el juego. "▶ en el juego" se lo pone 4 segundos al muñeco (o al héroe).'
      : 'Arrastrá el dibujo para mover el punto de apoyo (la cruz queda donde el juego pone el efecto). Rueda: tamaño. Abajo: clic para ver un cuadro.';
    if (ay && !ay.classList.contains('tip')) ay.textContent = VP.ayuda0;
  };
  const bucle = ts => {
    VP.raf = 0;
    if (!st.abierto || st.tab === 'notas') return;
    const dt = VP.ult ? Math.min(100, ts - VP.ult) : 16; VP.ult = ts;
    VP.reloj = (VP.reloj || 0) + dt;
    if (VP.play) { VP.t += dt * VP.vel; if (VP.t > VP.total + 350) VP.t = 0; }
    try { dibujar(); } catch (e) { if (!VP.av) { VP.av = 1; console.warn('[editor hab] escenario', e); } }
    VP.raf = requestAnimationFrame(bucle);
  };
  const arrancarEscenario = () => { if (!VP.raf && st.abierto && st.tab !== 'notas') { VP.ult = 0; VP.raf = requestAnimationFrame(bucle); } };
  // ---------------------------------------------------------------- notas marcadas sobre el escenario (como las notas del mapa)
  // (21/11, pedido: "en notas déjame marcar sobre el efecto como las notas del mapa, marcar y poner una nota de cómo quiero que
  // sea"). "✎ Nota" o la N: se congela el escenario en ese momento, se marca con el mouse (rojo, amarillo, celeste), se elige
  // qué es y se escribe. Se guarda con los trazos (en px del juego, respecto del personaje), el momento, una foto chica del
  // escenario y el texto; se ven numeradas en el escenario y en la pestaña Notas, y salen en el archivo de Exportar.
  const TIPOS_N = [['tamano', 'Tamaño'], ['lugar', 'Lugar'], ['tiempo', 'Tiempo'], ['color', 'Color'], ['dibujo', 'Dibujo'], ['otro', 'Otro']];
  const COLORES_N = [['#ff3b30', 'rojo'], ['#ffd60a', 'amarillo'], ['#5ac8fa', 'celeste']];
  const claveDe = tab => tab === 'jefes' ? claveJefe() : tab === 'heroes' ? st.hab : tab === 'estados' ? st.est : st.ef;
  const nombreItem = (tab, clave) => {
    try {
      if (tab === 'jefes') {
        if (clave.indexOf(':') > 0) { const [t, id] = clave.split(':'), h = habsDe(t).find(x => x.id === id); return (NOMBRE_JEFE[t] || nomTipo(t)) + ' · ' + (h ? h.n : id); }
        const D = JP() && JP().DEF[clave]; return D ? (NOMBRE_JEFE[D.jefe] || D.jefe) + ' · ' + D.nombre : clave;
      }
      if (tab === 'heroes') return ((HEROES[heroeDe(clave)] || [''])[0]) + ' · ' + nombreHab(clave);
      if (tab === 'estados') return 'Estado · ' + (NOM_EST[clave] || clave);
      return 'Efecto · ' + nomEf(clave);
    } catch (e) { return clave; }
  };
  const marcasDe = (tab, clave) => (AJ.marcas || []).filter(m => m.tab === tab && m.clave === clave);
  const segs = ms => (ms / 1000).toFixed(2).replace('.', ',') + ' s';
  const tipoN = k => (TIPOS_N.find(x => x[0] === k) || ['', 'Otro'])[1];
  const htmlMarcas = (tab, clave) => {
    const l = marcasDe(tab, clave);
    return `<div class="grupo">Notas marcadas acá (${l.length}) <small>"✎ Nota" o la N: marcá en el escenario</small></div>` + (l.length
      ? l.map((m, i) => `<div class="marca"><b class="num">${i + 1}</b><span>${segs(m.t)} · ${tipoN(m.tipo)}: ${comillas(m.texto) || '(sin texto)'}</span><button class="mini sec" data-m-ir="${m.id}">Ver</button><button class="mini sec" data-m-x="${m.id}" title="borrar esta nota">✕</button></div>`).join('')
      : '<div class="nota">Todavía ninguna.</div>');
  };
  const notaModo = on => {
    if (on && st.tab === 'notas') return;
    VP.nota = on ? { tab: st.tab, clave: claveDe(st.tab), trazos: [], actual: null, col: (VP.nota && VP.nota.col) || '#ff3b30', tipo: 'tamano', t: VP.t, texto: '' } : null;
    if (on) { VP.play = false; VP.marcaSel = null; }
    const p = document.getElementById('ckeh'); if (p) p.classList.toggle('anotando', !!VP.nota);
    pintarNotaForm(); pintarBarra();
    if (on) setTimeout(() => { const ta = document.getElementById('ckeh-notatexto'); if (ta) ta.blur(); }, 0);
  };
  const guardarTexto = () => { const ta = document.getElementById('ckeh-notatexto'); if (ta && VP.nota) VP.nota.texto = ta.value; };
  const htmlNotaForm = () => `<div class="fila"><b style="color:#fde68a">✎ Nota en ${segs(VP.nota.t)}</b><span class="nota" style="margin:0">marcá con el mouse, sobre el escenario, lo que querés cambiar</span></div>
    <div class="fila">${COLORES_N.map(([c, n]) => `<button class="mini col ${VP.nota.col === c ? 'sel' : ''}" data-nc="${c}" title="${n}" style="background:${c}">&nbsp;</button>`).join('')}
      <button class="mini sec" data-nf="deshacer">↶ Deshacer</button><button class="mini sec" data-nf="limpiar">Borrar trazos</button><span class="nota" style="margin:0">${VP.nota.trazos.length} trazo${VP.nota.trazos.length === 1 ? '' : 's'}</span></div>
    <div class="fila"><span class="nota" style="margin:0">Qué es:</span>${TIPOS_N.map(([k, t]) => `<button class="mini ${VP.nota.tipo === k ? '' : 'sec'}" data-nt="${k}">${t}</button>`).join('')}</div>
    <textarea id="ckeh-notatexto" placeholder="Cómo lo querés (por ejemplo: que salga del bastón, más arriba; que dure menos; más chico)">${comillas(VP.nota.texto || '')}</textarea>
    <div class="fila"><button data-nf="guardar">Guardar nota</button><button class="sec" data-nf="cancelar">Cancelar (Esc)</button></div>`;
  const pintarNotaForm = () => {
    const f = document.getElementById('ckeh-notaform'); if (!f) return;
    if (!VP.nota) { f.innerHTML = ''; return; }
    f.innerHTML = htmlNotaForm();
    f.querySelectorAll('[data-nc]').forEach(b => b.onclick = e => { e.stopPropagation(); guardarTexto(); VP.nota.col = b.dataset.nc; pintarNotaForm(); });
    f.querySelectorAll('[data-nt]').forEach(b => b.onclick = e => { e.stopPropagation(); guardarTexto(); VP.nota.tipo = b.dataset.nt; pintarNotaForm(); });
    f.querySelectorAll('[data-nf]').forEach(b => b.onclick = e => {
      e.stopPropagation(); guardarTexto(); const a = b.dataset.nf;
      if (a === 'guardar') return guardarNota();
      if (a === 'cancelar') return notaModo(false);
      if (a === 'deshacer') VP.nota.trazos.pop();
      if (a === 'limpiar') VP.nota.trazos = [];
      pintarNotaForm();
    });
    const ta = document.getElementById('ckeh-notatexto'); if (ta) ta.oninput = () => { VP.nota.texto = ta.value; };
  };
  const guardarNota = () => {
    const n = VP.nota; if (!n) return;
    guardarTexto();
    if (!n.trazos.length && !(n.texto || '').trim()) { avisar('marcá algo o escribí la nota'); return; }
    let foto = null;
    try { const c = document.getElementById('ckeh-lienzo'), k = Math.min(1, 480 / c.width), o = document.createElement('canvas'); o.width = Math.round(c.width * k); o.height = Math.round(c.height * k); o.getContext('2d').drawImage(c, 0, 0, o.width, o.height); foto = o.toDataURL('image/jpeg', 0.72); } catch (e) { foto = null; }
    AJ.marcas = AJ.marcas || [];
    AJ.marcas.push({ id: Date.now(), tab: n.tab, clave: n.clave, nombre: nombreItem(n.tab, n.clave), t: Math.round(n.t), mira: n.tab === 'heroes' ? VP.mira : undefined,
      trazos: n.trazos.map(s => ({ c: s.c, p: s.p.map(q => [Math.round(q[0] * 2) / 2, Math.round(q[1] * 2) / 2]) })), tipo: n.tipo, texto: (n.texto || '').trim(), foto, fecha: new Date().toISOString() });
    VP.nota = null; const p = document.getElementById('ckeh'); if (p) p.classList.remove('anotando');
    guardar(); pintar(); avisar('nota guardada ✓');
  };
  const irMarca = id => {
    const m = (AJ.marcas || []).find(x => String(x.id) === String(id)); if (!m) return;
    notaModo(false);
    st.tab = m.tab;
    if (m.tab === 'jefes') {
      if (m.clave.indexOf(':') > 0) { const [t, id] = m.clave.split(':'); st.jefeTipo = t; st.jefeHab = id; }
      else { st.jefe = m.clave; st.jefeHab = m.clave; st.jefeTipo = JP() && JP().DEF[m.clave] ? JP().DEF[m.clave].jefe : st.jefeTipo; }
    }
    else if (m.tab === 'heroes') { st.heroe = heroeDe(m.clave) || st.heroe; if (!listaHabs(escena(), st.heroe).editables.includes(m.clave)) st.soloTiene = false; st.hab = m.clave; st.capa = 0; if (m.mira) VP.mira = m.mira; }
    else if (m.tab === 'estados') st.est = m.clave;
    else st.ef = m.clave;
    VP.t = m.t; VP.play = false; VP.marcaSel = m.id; VP.cuadro = null; st.scroll = 0;
    pintar();
  };
  const trazo = (g, K, s, alfa) => {
    if (!s.p.length) return;
    g.save(); g.globalAlpha = alfa; g.lineJoin = g.lineCap = 'round';
    [[6.5, 'rgba(0,0,0,.55)'], [3.5, s.c]].forEach(([w, c]) => {
      g.lineWidth = w; g.strokeStyle = c; g.beginPath(); g.moveTo(K.X(s.p[0][0]), K.Y(s.p[0][1]));
      if (s.p.length === 1) g.lineTo(K.X(s.p[0][0]) + 0.1, K.Y(s.p[0][1]));
      s.p.forEach(q => g.lineTo(K.X(q[0]), K.Y(q[1]))); g.stroke();
    });
    g.restore();
  };
  const dibujarMarcas = (g, K, L) => {
    VP.insignias = [];
    if (VP.verNotas !== false && !VP.nota) marcasDe(st.tab, claveDe(st.tab)).forEach((m, i) => {
      const sel = VP.marcaSel === m.id || VP.sobreMarca === m.id, cerca = Math.abs(VP.t - m.t) < 260;
      m.trazos.forEach(s => trazo(g, K, s, sel || cerca ? 1 : 0.55));
      const q = m.trazos.length && m.trazos[0].p.length ? { x: K.X(m.trazos[0].p[0][0]) - 9, y: K.Y(m.trazos[0].p[0][1]) - 9 } : { x: 14 + i * 22, y: 36 };
      g.save(); g.fillStyle = sel ? '#ffd60a' : '#ff3b30'; g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.arc(q.x, q.y, 8, 0, 6.3); g.fill(); g.stroke();
      g.fillStyle = sel ? '#1c140e' : '#fff'; g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), q.x, q.y + 0.5); g.restore();
      VP.insignias.push({ id: m.id, x: q.x, y: q.y });
      if (sel) { const t = `${i + 1} · ${segs(m.t)} · ${tipoN(m.tipo)}: ${m.texto || '(sin texto)'}`; etiqueta(g, { X: () => q.x, Y: () => q.y + 18 }, L, { x: 0, y: 0 }, t.length > 90 ? t.slice(0, 88) + '…' : t); }
    });
    if (VP.nota) {
      VP.nota.trazos.forEach(s => trazo(g, K, s, 1));
      g.save(); g.fillStyle = 'rgba(255,59,48,.9)'; g.fillRect(6, 6, 108, 18); g.fillStyle = '#fff'; g.font = '11px sans-serif'; g.fillText('✎ marcando · ' + segs(VP.nota.t), 11, 19); g.restore();
    }
  };

  // ---------------------------------------------------------------- pantalla completa
  const pantallaCompleta = (q, dejarNavegador) => {
    const p = document.getElementById('ckeh'); if (!p) return;
    VP.full = q === undefined ? !VP.full : q;
    p.classList.toggle('full', VP.full);
    try {
      const w = document.getElementById('game-wrapper') || document.documentElement;
      if (VP.full && !document.fullscreenElement && w.requestFullscreen) w.requestFullscreen().then(() => { VP.fsNav = true; }).catch(() => {});
      else if (!VP.full && VP.fsNav && document.fullscreenElement && !dejarNavegador) { VP.fsNav = false; document.exitFullscreen().catch(() => {}); }
      if (dejarNavegador) VP.fsNav = false;
    } catch (e) {}
    VP.cuadro = null; pintar();
  };
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && VP.fsNav) { VP.fsNav = false; if (VP.full) pantallaCompleta(false); } });


  // ================================================================== el panel
  const css = `
#ckeh-boton{position:absolute;left:14px;top:256px;z-index:60;display:none;padding:5px 10px;font:12px MedievalSharp,serif;color:#fde68a;
  background:#2a1d14ee;border:2px solid #8a6a3a;border-radius:4px;cursor:pointer;letter-spacing:.5px}
#ckeh-boton.on{display:block} #ckeh-boton:hover{background:#3a2a1c}
#ckeh{position:absolute;right:12px;top:12px;z-index:9500;width:900px;max-width:calc(100% - 24px);height:calc(100% - 24px);max-height:720px;box-sizing:border-box;display:none;
  flex-direction:column;padding:8px 10px 10px;font:12px MedievalSharp,serif;color:#f3e6c8;background:#1c140e;border:2px solid #8a6a3a;border-radius:6px;box-shadow:0 4px 18px #000a}
#ckeh.on{display:flex} #ckeh h2{margin:0 0 6px;font-size:13px;color:#fbbf24;letter-spacing:1px}
#ckeh .cuerpo{display:flex;gap:12px;flex:1;min-height:0} #ckeh-izq{flex:0 0 540px;display:flex;flex-direction:column;min-height:0;overflow:hidden}
#ckeh-der{flex:1;min-width:280px;overflow:auto;padding-right:4px} #ckeh.notas #ckeh-izq{display:none}
#ckeh-lienzo{display:block;width:100%;flex:1 1 0;min-height:250px;border:1px solid #6b5232;border-radius:3px;touch-action:none}
#ckeh-tiempo{display:block;width:100%;flex:0 0 auto;margin-top:5px;border:1px solid #6b5232;border-radius:3px;cursor:pointer;touch-action:none}
#ckeh-barra{margin:0 0 5px} #ckeh-barra .sep{width:8px} #ckeh-ayuda{line-height:1.35;min-height:30px;padding:4px 6px;border-radius:3px;margin-top:4px}
#ckeh-ayuda.tip{background:#2d2016;color:#fde68a;border:1px solid #6b5232}
#ckeh .br{display:grid;grid-template-columns:108px 1fr 52px 26px 18px;gap:4px;align-items:center;margin:3px 0}
#ckeh .br .et{font-size:11px;line-height:1.15} #ckeh .br .et i{font-style:normal;display:inline-block;margin-left:3px;width:12px;height:12px;line-height:12px;text-align:center;border-radius:50%;background:#5a442a;color:#f3e6c8;font-size:9px;cursor:help}
#ckeh .br input[type=range]{width:100%;min-width:60px;accent-color:#e8c47a;margin:0;cursor:pointer} #ckeh .br input[type=number]{width:48px;box-sizing:border-box} #ckeh .br .u{font-weight:normal;color:#b9a27c;font-size:10px}
#ckeh .br.cambio .et{color:#86efac} #ckeh .br .re{padding:0 3px;margin:0;background:#5a442a;color:#86efac;font-size:12px;line-height:16px} #ckeh .br select.ancho2{grid-column:span 4;width:100%}
#ckeh .grupo{margin:8px 0 3px;color:#e8c47a;font-size:11px;letter-spacing:.6px;text-transform:uppercase;border-bottom:1px solid #3d2e1e;padding-bottom:1px}
#ckeh .grupo small{color:#b9a27c;text-transform:none;letter-spacing:0;margin-left:4px;font-size:10.5px} #ckeh .grupo .der{float:right;margin:0;text-transform:none;letter-spacing:0;font-size:11px;color:#f3e6c8}
#ckeh .pjs,#ckeh .habs{display:flex;flex-wrap:wrap;gap:4px} #ckeh .pj{margin:0;background:#3a2a1c;color:#f3e6c8} #ckeh .pj.sel{background:#e8c47a;color:#1c140e}
#ckeh .hab{display:flex;align-items:center;justify-content:space-between;gap:4px;width:calc(50% - 2px);box-sizing:border-box;margin:0;text-align:left;background:#2d2016;color:#f3e6c8;border:1px solid #5a442a}
#ckeh .hab.sel{background:#e8c47a;color:#1c140e;border-color:#fbbf24} #ckeh .hab .tc{font-size:10px;background:#1c140e;color:#fde68a;border-radius:2px;padding:0 4px} #ckeh .hab[disabled]{opacity:.4;cursor:not-allowed}
#ckeh .pasos{display:flex;gap:3px 8px;flex-wrap:wrap;font-size:10.5px;color:#b9a27c;margin:0 0 4px;padding:4px 6px;background:#241911;border-radius:3px}
#ckeh .pasos b{display:inline-block;width:13px;height:13px;line-height:13px;text-align:center;border-radius:50%;background:#8a6a3a;color:#1c140e;font-size:9px;margin-right:2px}
#ckeh details summary{cursor:pointer;color:#e8c47a;font-size:11px;margin:7px 0 2px} #ckeh small.cambio{color:#86efac}
#ckeh.full{position:fixed;left:0;top:0;right:0;bottom:0;width:auto;height:auto;max-width:none;max-height:none;border-radius:0;border-width:0;padding:10px 16px;z-index:9900}
#ckeh.full #ckeh-izq{flex:1 1 auto} #ckeh.full #ckeh-der{flex:0 0 430px} #ckeh:focus{outline:none} #ckeh.notas #ckeh-der{flex:1 1 auto;max-width:900px}
#ckeh-notaform{display:none;margin-top:5px;padding:6px 8px;background:#241911;border:1px solid #8a6a3a;border-radius:3px}
#ckeh.anotando #ckeh-notaform{display:block} #ckeh.anotando #ckeh-tiempo,#ckeh.anotando #ckeh-ayuda{display:none} #ckeh.anotando #ckeh-lienzo{cursor:crosshair;border-color:#ff3b30}
#ckeh-notaform textarea{min-height:46px;margin-top:4px} #ckeh button.col{width:24px;height:18px;padding:0;border:2px solid #1c140e} #ckeh button.col.sel{outline:2px solid #fde68a}
#ckeh .marca{display:grid;grid-template-columns:18px 1fr auto auto;gap:4px;align-items:center;margin:3px 0;font-size:11px}
#ckeh .marca .num{display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;border-radius:50%;background:#ff3b30;color:#fff;font-size:10px}
#ckeh .marca.grande{grid-template-columns:160px 1fr;align-items:start;border:1px solid #3d2e1e;border-radius:3px;padding:5px;margin:5px 0} #ckeh .marca.grande.sinfoto{grid-template-columns:1fr}
#ckeh .marca.grande img{width:160px;border-radius:2px;display:block}
@media (max-width:980px){#ckeh{height:auto;overflow:auto} #ckeh .cuerpo{flex-direction:column} #ckeh-izq{flex:none} #ckeh-lienzo{flex:none;height:330px} #ckeh-der{overflow:visible}}
#ckeh h3{margin:9px 0 4px;font-size:12px;color:#fbbf24;letter-spacing:1px;border-bottom:1px solid #5a442a;padding-bottom:2px}
#ckeh select,#ckeh input,#ckeh textarea{font:12px MedievalSharp,serif;background:#2d2016;color:#f3e6c8;border:1px solid #6b5232;border-radius:3px;padding:2px 3px}
#ckeh select{max-width:100%} #ckeh input[type=number]{width:58px} #ckeh input[type=color]{width:34px;height:20px;padding:0}
#ckeh textarea{width:100%;box-sizing:border-box;min-height:46px;resize:vertical}
#ckeh .nuevaform{border:1px solid #8a6a32;border-radius:3px;padding:6px 8px;margin:8px 0;background:#241a12} #ckeh label.campo{display:block;margin:5px 0;color:#e8d5b0}
#ckeh label.campo input,#ckeh label.campo textarea,#ckeh label.campo select{display:block;margin-top:2px;box-sizing:border-box} #ckeh .fila.nuevas{flex-wrap:wrap;gap:4px}
#ckeh button{font:12px MedievalSharp,serif;margin:3px 3px 0 0;padding:3px 7px;color:#1c140e;background:#e8c47a;border:1px solid #8a6a3a;border-radius:3px;cursor:pointer}
#ckeh button.sec{background:#5a442a;color:#f3e6c8} #ckeh button.on{background:#ff6a4a;color:#fff} #ckeh button.mini{padding:0 5px;margin:0}
#ckeh .tabs button{background:#3a2a1c;color:#f3e6c8} #ckeh .tabs button.sel{background:#e8c47a;color:#1c140e}
#ckeh label{display:inline-flex;align-items:center;gap:3px;margin:2px 7px 0 0;cursor:pointer}
#ckeh .fila{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin:2px 0} #ckeh .nota{color:#b9a27c;font-size:11px;margin-top:3px}
#ckeh .campo{display:grid;grid-template-columns:1fr auto auto;gap:4px;align-items:center;margin:2px 0} #ckeh .campo span.u{color:#b9a27c;font-size:10px;min-width:44px}
#ckeh.mirando{opacity:.07;pointer-events:none;transition:opacity .25s} #ckeh .cambio{color:#86efac} #ckeh .capa{border:1px solid #5a442a;border-radius:4px;padding:3px 5px;margin:4px 0;background:#241911}
#ckeh .capa.sel{border-color:#fbbf24} #ckeh .capa .cab{display:flex;align-items:center;gap:4px;cursor:pointer}
#ckeh .grid{display:grid;grid-template-columns:auto 62px auto 62px;gap:3px 5px;align-items:center;margin-top:3px;font-size:11px}
#ckeh .grid select.ancho{grid-column:span 3;width:100%} #ckeh .x{position:absolute;right:8px;top:4px;cursor:pointer;color:#b9a27c} #ckeh-estado{color:#86efac;font-size:11px;margin-left:6px}
`;
  const opciones = (lista, sel) => lista.map(([v, t]) => `<option value="${v}" ${String(v) === String(sel) ? 'selected' : ''}>${t}</option>`).join('');
  const listaEfectos = () => Object.keys(hojas()).filter(k => !hojas()[k].solo && !/_atras$/.test(k)).sort((a, b) => (/^pfx_/.test(a) - /^pfx_/.test(b)) || a.localeCompare(b));
  // ---------------------------------------------------------------- nombres claros de los efectos
  const NOMBRE_EF = { golpe: 'Golpe', critico: 'Golpe crítico', tajo_x: 'Tajo en cruz', tajo_veloz: 'Tajo veloz', garras: 'Zarpazo', giro: 'Giro (anillo)', suelo: 'Golpe al suelo', onda: 'Onda de corte', sangre: 'Sangre', humo: 'Humo',
    fuego_bola: 'Bola de fuego', fuego_explosion: 'Explosión de fuego', hielo_lanza: 'Lanza de hielo', hielo_roto: 'Estallido de hielo', pinchos: 'Pinchos de hielo', arcano_misil: 'Misil arcano', rayo: 'Rayo', chispa_rayo: 'Chispa eléctrica',
    carga: 'Brillo de carga', runas: 'Círculo de runas', haz: 'Haz de luz', curar: 'Curación', escudo: 'Escudo', aura_furia: 'Aura de furia',
    st_quemar: 'Quemado', st_hielo: 'Congelado', st_aturdido: 'Aturdido', st_sangra: 'Sangrando', st_mejora: 'Mejora', st_lento: 'Lento', st_marca: 'Marca', st_bosque: 'Espíritu del bosque',
    pfx_polvo: 'Polvo', pfx_fatuo: 'Fuego fatuo', pfx_rayos: 'Rayos de sol', pfx_manos: 'Manos de la tumba', pfx_espina: 'Espina de hueso', pfx_oscura: 'Estallido oscuro', pfx_estrellas: 'Lluvia de estrellas', pfx_aliento: 'Aliento de fuego', pfx_siega: 'Siega', pfx_pisoton: 'Pisotón de brasa' };
  const ONDA_N = { tierra: 'tierra', fuego: 'fuego', hielo: 'hielo', luz: 'luz', acero: 'acero', trueno: 'trueno', arcano: 'magia', filo: 'pétalos' };
  const nomEf = k => /^@onda:/.test(k) ? 'Onda de ' + (ONDA_N[k.slice(6)] || k.slice(6)) : k === '@ulti' ? 'Destello de ulti' : k === '@temblor' ? 'Temblor de pantalla' : (NOMBRE_EF[k] || k);
  const GRUPOS_EF = [['Golpes', /^(golpe|critico|tajo_x|tajo_veloz|garras|giro|suelo|onda|sangre|humo)$/], ['Magia', /^(fuego_|hielo_|pinchos|arcano|rayo|chispa|carga|runas|haz|curar|escudo|aura)/], ['Estados', /^st_/], ['Jefes y ambiente', /^pfx_/]];
  const optsEf = (sel, especiales, marcas) => {
    const l = listaEfectos(), usados = new Set(), nom = k => nomEf(k) + (marcas && marcas[k] ? ' ✎' : '');
    let h = GRUPOS_EF.map(([g, re]) => { const x = l.filter(k => re.test(k) && !usados.has(k)); x.forEach(k => usados.add(k)); return x.length ? `<optgroup label="${g}">${opciones(x.map(k => [k, nom(k)]), sel)}</optgroup>` : ''; }).join('');
    const resto = l.filter(k => !usados.has(k)); if (resto.length) h += `<optgroup label="Otros">${opciones(resto.map(k => [k, nom(k)]), sel)}</optgroup>`;
    if (especiales) h += `<optgroup label="Especiales">${opciones(['@onda:tierra', '@onda:fuego', '@onda:hielo', '@onda:luz', '@onda:acero', '@onda:trueno', '@onda:arcano', '@onda:filo', '@ulti', '@temblor'].map(k => [k, nomEf(k)]), sel)}</optgroup>`;
    return h;
  };
  const num = (id, v, paso, cambio) => `<input type="number" data-n="${id}" value="${v == null ? '' : Math.round(v * 1000) / 1000}" step="${paso || 1}" class="${cambio ? 'cambio' : ''}">`;

  // ---------------------------------------------------------------- las barras: [nombre, mínimo, máximo, paso, unidad, para qué sirve]
  const BARRA = {
    'c:ret': ['Cuándo sale', 0, 3000, 10, 'ms', 'Cuánto espera desde que usás la habilidad hasta que aparece esta capa. 1000 ms = 1 segundo.'],
    'c:n': ['Veces', 1, 12, 1, '', 'Cuántas veces sale esta capa (por ejemplo, una fila de 5 pinchos).'],
    'c:cada': ['Cada cuánto', 0, 1000, 10, 'ms', 'Si sale varias veces: el tiempo entre una y la siguiente.'],
    'c:ad': ['Adelante', -80, 220, 1, 'px', 'Cuánto más adelante del héroe sale, hacia donde mira (también si mira arriba o abajo).'],
    'c:dx': ['Corrido', -80, 80, 1, 'px', 'Lo corre hacia adelante o atrás; se da vuelta solo cuando el héroe mira al otro lado.'],
    'c:dy': ['Alto', -100, 80, 1, 'px', 'Más arriba (negativo) o más abajo (positivo).'],
    'c:esc': ['Tamaño', 0.1, 3, 0.01, '×', '1 = el tamaño normal del efecto. También con la rueda del mouse sobre su número en el escenario.'],
    'c:alfa': ['Opacidad', 0, 1, 0.05, '', '1 = se ve entero; 0,5 = medio transparente.'],
    'c:vel': ['Velocidad', 0.25, 3, 0.05, '×', 'Qué tan rápido pasa la animación. 2 = el doble de rápido.'],
    'k:dt': ['Cuándo sale', -5000, 5000, 10, 'ms', 'Más tarde (+) o más temprano (−) que en el juego. También arrastrando su barra, abajo. En el juego sólo se puede atrasar.'],
    'k:sa': ['Corta el comienzo', 0, 5000, 10, 'ms', 'No se ve el principio: aparece más adelante en su animación. También con el borde izquierdo de su barra.'],
    'k:co': ['Dura', 0, 8000, 10, 'ms', 'Hasta cuándo se ve (desde que nace). Al máximo: entera. También con el borde derecho de su barra.'],
    'k:dx': ['Corrida', -300, 300, 1, 'px', 'Hacia los lados. También arrastrando su número en el escenario.'],
    'k:dy': ['Alto', -300, 300, 1, 'px', 'Negativo: más arriba. También arrastrando su número en el escenario.'],
    'k:esc': ['Tamaño', 0.1, 4, 0.01, '×', 'Más grande o más chica (también la rueda sobre su número).'],
    'k:alfa': ['Opacidad', 0, 1, 0.05, '', '0 = invisible, 1 = como en el juego.'],
    'c:salta': ['Corta el comienzo', 0, 2000, 10, 'ms', 'Se saltea el principio de su animación (también arrastrando el borde izquierdo de su barra, abajo).'],
    'j:corte': ['Corta el final', 0, 3000, 10, 'ms', '0 = entero. Se apaga a esta altura de su animación (también arrastrando el borde derecho de la barra "golpe", abajo).'],
    'x:dura': ['Corta el final', 0, 3000, 10, 'ms', '0 = entera. Se apaga a esta altura (también arrastrando el borde derecho de su barra, abajo).'],
    'c:dura': ['Cuánto dura', 0, 5000, 50, 'ms', 'Para los que dan vueltas (círculos, auras): cuánto quedan antes de apagarse. 0 = lo que dura su animación.'],
    'c:sube': ['Crece cada vez', -0.3, 0.5, 0.01, '×', 'Si sale varias veces: cuánto más grande sale cada una.'],
    'c:avz': ['Avanza cada vez', -60, 80, 1, 'px', 'Si sale varias veces: cuánto más adelante sale cada una.'],
    'c:az': ['Al azar ↔', 0, 150, 1, 'px', 'Lo corre un poco al azar a los costados cada vez que sale.'],
    'c:azy': ['Al azar ↕', 0, 150, 1, 'px', 'Lo corre un poco al azar arriba y abajo cada vez que sale.'],
    'c:enem': ['Sobre enemigos a', 0, 300, 5, 'px', 'Si es más que 0, sale encima de cada enemigo que esté a menos de esa distancia, en vez de en el héroe.'],
    'c:pro': ['Profundidad fina', -60, 60, 1, '', 'Sólo con "Se dibuja: automático". Negativo = detrás de los que están cerca (como pegado al piso); positivo = delante. Vacío = automático.'],
    'c:radio': ['Radio', 16, 240, 2, 'px', 'Hasta dónde llegan las partículas de la onda.'],
    'j:cada': ['Cada cuánto la usa', 2000, 20000, 250, 'ms', 'El jefe la vuelve a usar después de este tiempo (enojado, un poco antes).'],
    'j:aviso': ['Avisa antes', 100, 3000, 50, 'ms', 'Cuánto dura la marca roja antes del golpe: más tiempo = más fácil de esquivar. También en la barra roja de abajo.'],
    'j:radio': ['Radio de la marca', 8, 220, 1, 'px', 'El tamaño de la marca roja: si estás adentro cuando cae, te pega. También con el ■ rojo del escenario.'],
    'j:dano': ['Daño', 0, 5, 1, '♥', 'Cuántos corazones saca si te pega.'],
    'j:escala': ['Tamaño del efecto', 0.1, 3, 0.01, '×', 'El tamaño del dibujo del golpe (no cambia dónde pega: eso es el radio). También con la rueda en el escenario.'],
    'j:dmin': ['La usa desde', 0, 400, 5, 'px', 'Distancia mínima entre el jefe y vos para que la use (la línea verde del escenario).'],
    'j:dmax': ['La usa hasta', 0, 500, 5, 'px', 'Distancia máxima para que la use (la línea verde del escenario).'],
    'j:cantidad': ['Cuántas', 1, 12, 1, '', 'Cuántas espinas o rayos tira.'],
    'j:paso': ['Separación', 8, 80, 1, 'px', 'La distancia entre una espina y la siguiente.'],
    'j:entre': ['Entre una y otra', 0, 1000, 10, 'ms', 'Cuánto espera entre una y la siguiente.'],
    'j:lento': ['Te deja lento', 0, 5000, 100, 'ms', 'Si te pega, cuánto tiempo quedás lento. 0 = nada.'],
    'j:ancho': ['Ancho de la franja', 8, 120, 2, 'px', 'El ancho de la franja roja (y de lo que pega).'],
    'j:dura': ['Cuánto dura', 200, 3000, 50, 'ms', 'Cuánto tiempo sale el fuego.'],
    'j:alcance': ['Alcance adelante', 0, 150, 1, 'px', 'Qué tan adelante del jefe cae el golpe (el ■ de abajo de la marca en el escenario).'],
    'j:desdeVida': ['Desde qué vida', 0, 1, 0.05, '', '0,5 = la empieza a usar cuando le queda la mitad de la vida; 1 = desde el principio.'],
    'j:odx': ['Adelante', -80, 200, 1, 'px', 'De dónde sale: cuánto adelante de los pies del jefe, hacia vos. También con la ✚ del escenario.'],
    'j:ody': ['Alto', -140, 60, 1, 'px', 'De dónde sale: más arriba (negativo) o más abajo.'],
    'x:retraso': ['Cuándo', 0, 2000, 10, 'ms', 'Cuánto después del golpe aparece esta capa. También arrastrando su barra celeste abajo.'],
    'x:escala': ['Tamaño', 0.1, 3, 0.01, '×', 'El tamaño de esta capa.'],
    'x:dx': ['Adelante', -120, 120, 1, 'px', 'La corre hacia adelante (hacia vos) o hacia atrás.'],
    'x:dy': ['Alto', -120, 80, 1, 'px', 'Más arriba (negativo) o más abajo.'],
    'p:esc': ['Tamaño', 0.1, 3, 0.01, '×', 'El tamaño del dibujo del proyectil.'],
    'p:ad': ['Sale más adelante', -40, 80, 1, 'px', 'Se suma a donde sale hoy, hacia donde mira el héroe. También arrastrando la ➤ del escenario.'],
    'p:dy': ['Sale más alto', -60, 40, 1, 'px', 'Negativo = más arriba (la punta del bastón, la mano).'],
    't:hp': ['Vida', 1, 200, 1, '', 'Cuánta vida tiene (vale para los que aparezcan desde ahora).'],
    't:dmg': ['Daño', 0, 5, 1, '♥', 'Cuántos corazones saca su golpe común.'],
    't:cd': ['Entre golpe y golpe', 300, 5000, 50, 'ms', 'Cuánto espera entre un ataque común y el siguiente.'],
    't:reach': ['Alcance del golpe', 16, 160, 1, 'px', 'Desde qué distancia te pega de cerca.'],
    't:speed': ['Velocidad', 10, 240, 1, '', 'Qué tan rápido camina.'],
    't:summon.every': ['Llama ayuda cada', 2000, 40000, 500, 'ms', 'Cada cuánto llama a los suyos (muertos, orcos, diablillos...).'],
    't:summon.max': ['Cuántos a la vez', 0, 10, 1, '', 'Cuántos de los que llama puede haber vivos a la vez.'],
    't:ranged.range': ['Alcance a distancia', 40, 600, 5, 'px', 'Desde qué distancia te tira el hechizo o la flecha.'],
    't:ranged.speed': ['Velocidad del disparo', 40, 600, 5, '', 'Qué tan rápido vuela lo que tira.'],
    't:hitAt': ['Cuándo pega', 50, 1500, 10, 'ms', 'Cuánto tarda el golpe en llegar desde que empieza a pegar (más = se ve venir).'],
    't:block': ['Para golpes', 0, 1, 0.05, '', 'Qué parte de tus golpes para (0,15 = uno de cada siete, más o menos).'],
    'r:CARGA.min': ['Embiste desde', 0, 300, 5, 'px', 'Distancia mínima para embestir.'], 'r:CARGA.max': ['Embiste hasta', 50, 500, 5, 'px', 'Distancia máxima para embestir.'],
    'r:CARGA.prep': ['Avisa antes', 100, 2000, 25, 'ms', 'Cuánto rasca el piso y brilla antes de salir.'], 'r:CARGA.corre': ['Corre durante', 100, 2000, 20, 'ms', 'Cuánto dura la carrera.'],
    'r:CARGA.vel': ['Velocidad', 60, 700, 10, '', 'Qué tan rápido embiste.'], 'r:CARGA.cd': ['Cada cuánto', 1000, 20000, 250, 'ms', 'Cada cuánto puede volver a embestir.'],
    'r:CARGA.aturde': ['Si choca, aturdido', 0, 5000, 100, 'ms', 'Cuánto queda aturdido si se da contra algo.'],
    'r:ESCUDO.aguante': ['Golpes que para', 1, 10, 1, '', 'Cuántos golpes de frente aguanta antes de que se le rompa la guardia.'], 'r:ESCUDO.rota': ['Guardia rota', 0, 6000, 100, 'ms', 'Cuánto queda sin poder parar.'],
    'r:ESCUDO.quieto': ['Queda quieto', 0, 3000, 50, 'ms', 'Cuánto se queda quieto cuando se le rompe la guardia.'], 'r:ESCUDO.vuelve': ['La guardia vuelve', 500, 12000, 250, 'ms', 'Sin recibir golpes, cuánto tarda en volver a parar.'],
    'r:TIRADOR.cerca': ['Retrocede si estás a', 20, 300, 5, 'px', 'Si te acercás a menos de esto, se aleja para volver a tirarte.'],
    'r:AULLA.radio': ['Avisa a los que están a', 50, 900, 10, 'px', 'Hasta dónde llega el aullido.'], 'r:AULLA.quieto': ['Se frena', 0, 3000, 50, 'ms', 'Cuánto se queda quieto aullando.'],
    'r:AULLA.mas': ['Más rápidos', 1, 2, 0.05, '×', 'Cuánto más rápido van los que escucharon.'], 'r:AULLA.dura': ['Durante', 500, 15000, 250, 'ms', 'Cuánto les dura.'],
    'q:cada': ['Cada cuánto la usa', 1000, 40000, 250, 'ms', 'El jefe la vuelve a usar después de este tiempo (enojado, un poco antes).'],
    'q:dmin': ['La usa desde', 0, 500, 5, 'px', 'Distancia mínima entre el jefe y vos para que la use.'],
    'q:dmax': ['La usa hasta', 0, 600, 5, 'px', 'Distancia máxima para que la use.'],
    'f:enojo': ['Se enoja con', 0.05, 0.95, 0.05, 'de vida', '0,5 = cuando le queda la mitad de la vida.'],
    'f:pisoton': ['Pisotón desde', 0.05, 0.95, 0.05, 'de vida', '0,25 = cuando le queda un cuarto de la vida.'],
    'f:cada': ['Pisotón cada', 1000, 30000, 250, 'ms', 'Cada cuánto pisa.'],
    'f:aviso': ['Avisa antes', 100, 3000, 50, 'ms', 'Cuánto dura la marca roja antes del golpe.'],
    'f:radio': ['Radio', 20, 220, 1, 'px', 'El tamaño de la marca roja.'],
    'f:dano': ['Daño', 0, 5, 1, '♥', 'Cuántos corazones saca.'],
    'f:corte1': ['Primer velo', 0.05, 0.95, 0.05, 'de vida', '0,5 = se vuelve intangible cuando le queda la mitad de la vida.'],
    'f:corte2': ['Segundo velo', 0.05, 0.95, 0.05, 'de vida', 'La segunda vez.'],
    'f:maximo': ['El velo dura hasta', 2000, 40000, 500, 'ms', 'Si no matás a sus muertos, el velo se rompe solo a este tiempo.'],
    'f:aturde': ['Queda aturdido', 0, 8000, 100, 'ms', 'Cuánto queda aturdido cuando se rompe el velo.'],
    's:dx': ['Corrido', -40, 40, 1, 'px', 'Lo corre a un costado. También arrastrando la ✚ del escenario.'],
    's:dy': ['Alto', -60, 60, 1, 'px', 'Más arriba (negativo) o más abajo, desde donde va.'],
    's:esc': ['Tamaño', 0.1, 3, 0.01, '×', 'El tamaño del estado (en los enemigos grandes se agranda un poco solo, como en el juego). También con la rueda.'],
    's:alfa': ['Opacidad', 0, 1, 0.05, '', '1 = se ve entero; 0,5 = medio transparente.'],
    's:vel': ['Velocidad', 0.25, 3, 0.05, '×', 'Qué tan rápido pasa su animación.'],
    'e:esc': ['Tamaño', 0.1, 3, 0.01, '×', 'El tamaño de este efecto en todo el juego (en todas las habilidades que lo usan).'],
    'e:fps': ['Velocidad', 2, 60, 1, 'c/s', 'Cuadros por segundo de su animación, en todo el juego.'],
    'e:ax': ['Apoyo ↔', 0, 100, 0.5, 'px', 'El punto del dibujo que va justo donde el juego lo pone (la cruz). También arrastrando el dibujo en el escenario.'],
    'e:ay': ['Apoyo ↕', 0, 100, 0.5, 'px', 'El punto del dibujo que va justo donde el juego lo pone (la cruz).']
  };
  const fmt = v => v == null || isNaN(v) ? '' : String(Math.round(v * 1000) / 1000);
  const comillas = t => String(t || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const barra = (id, v, cambiado, extra) => {
    const [g, c] = id.split(':'), D = BARRA[(/^x\d+$/.test(g) ? 'x' : g) + ':' + c] || [c, 0, 100, 1, '', ''];
    const B = Object.assign({ et: D[0], min: D[1], max: D[2], paso: D[3], u: D[4], ayuda: D[5] }, extra || {});
    const val = v == null || isNaN(v) ? (B.def != null ? B.def : B.min <= 0 && B.max >= 0 ? 0 : B.min) : v, vr = Math.max(B.min, Math.min(B.max, val));
    return `<div class="br${cambiado ? ' cambio' : ''}" data-ayuda="${comillas(B.et + '|' + B.ayuda)}"><span class="et">${B.et}${B.ayuda ? `<i title="${comillas(B.ayuda)}">?</i>` : ''}</span>`
      + `<input type="range" data-r="${id}" min="${B.min}" max="${B.max}" step="${B.paso}" value="${vr}"><input type="number" data-n="${id}" step="${B.paso}" value="${(v == null || isNaN(v)) && B.vacio ? '' : fmt(val)}">`
      + `<b class="u">${B.u}</b>${cambiado ? `<button class="re" data-re="${id}" title="Volver a como estaba">↺</button>` : '<span></span>'}</div>`;
  };
  const pasos = t => `<div class="pasos">${(t === 'efectos' ? ['elegí el efecto', 'miralo a la izquierda', 'corregí con las barras o arrastrando el dibujo', '"Exportar" y me lo pasás']
    : t === 'estados' ? ['elegí el estado', 'miralo a la izquierda', 'corregí con las barras o arrastrando la ✚', '"Exportar" y me lo pasás']
    : [t === 'jefes' ? 'elegí el enemigo o jefe' : 'elegí el personaje', 'la habilidad', 'mirala a la izquierda', 'corregí con las barras, arrastrando o en la línea de tiempo', '"Exportar" y me lo pasás']).map((x, i) => `<span><b>${i + 1}</b> ${x}</span>`).join('')}</div>`;

  // ---------------------------------------------------------------- qué habilidades tiene cada héroe
  const tieneSet = (S, h) => { try { const E = EQ(); if (!E.aprendidas || !S) return null; return new Set(E.aprendidas(S, h).concat(h === 'wizard' ? ['ataque'] : [])); } catch (e) { return null; } };
  const teclasDe = (S, h) => { const o = {}; try { const E = EQ(), r = E.ranuras ? E.ranuras(S, h) : [], T = E.TECLAS || ['Q', 'E', 'R', 'F']; (r || []).forEach((id, i) => { if (id) o[id] = T[i]; }); } catch (e) {} return o; };
  const listaHabs = (S, h) => {
    const T = st.soloTiene ? tieneSet(S, h) : null, ok = id => !T || T.has(id);
    return { editables: HEROES[h][1].filter(ok), sin: Object.keys(SIN_EDITAR).filter(x => SIN_EDITAR[x] === h && ok(x)) };
  };

  const marcaHabJefe = (t, x) => (x.k === 'pfx' ? AJ.jefes[x.id] : (AJ.otras[t + ':' + x.id] || AJ.capasJ[t + ':' + x.id] || (x.k === 'esp' && AJ.especiales[t + ':' + x.f]) || (x.k === 'fase' && AJ.fases[x.fase]) || (x.k === 'pelea' && AJ.tipos[t]) || (x.rolN && AJ.roles[x.rolN]))) || (AJ.marcas || []).some(m => m.tab === 'jefes' && m.clave === (x.k === 'pfx' ? x.id : t + ':' + x.id));
  const htmlJefes = () => {
    const t = st.jefeTipo, habs = habsDe(t);
    if (!habs.some(x => x.id === st.jefeHab)) st.jefeHab = habs[0].id;
    const hs = habSel();
    const T = TIPOS_ET(), resto = Object.keys(T).filter(x => !ORDEN_JEFES.includes(x)), usados = new Set();
    const op = x => [x, (NOMBRE_JEFE[x] || nomTipo(x)) + (habsDe(x).some(y => marcaHabJefe(x, y)) ? ' ✎' : '')];
    const grupos = `<optgroup label="Jefes">${opciones(ORDEN_JEFES.filter(x => T[x] || CATALOGO[x]).map(op), t)}</optgroup>` + FAMILIAS.map(([n, f]) => {
      const xs = resto.filter(x => !usados.has(x) && f(x)).sort((a, b) => nomTipo(a).localeCompare(nomTipo(b))); xs.forEach(x => usados.add(x));
      return xs.length ? `<optgroup label="${n}">${opciones(xs.map(op), t)}</optgroup>` : '';
    }).join('');
    let h = pasos('jefes') + `<div class="grupo">Personaje <small>${ORDEN_JEFES.length} jefes y ${resto.length} enemigos</small></div><select data-s="tipo" style="width:100%">${grupos}</select>
      <div class="grupo">Qué puede hacer ${NOMBRE_JEFE[t] || nomTipo(t)}</div><div class="habs">${habs.map(x => `<button class="hab ${x.id === hs.id ? 'sel' : ''}" data-hab="${x.id}" title="${comillas(x.d)}"><span>${x.n}${marcaHabJefe(t, x) ? ' ✎' : ''}</span>${x.k === 'pfx' ? '<span class="tc" title="se edita en el escenario">nueva</span>' : LECT[t + ':' + x.id] ? '<span class="tc" title="ya está leída del juego">✓</span>' : ''}</button>`).join('')}</div>${htmlNuevas('enemigo:' + t)}`;
    if (hs.k !== 'pfx') return h + htmlJefeOtra(t, hs);
    const J = JP(); if (!J) return h + '<div class="nota">Las habilidades de jefes (ck_jefes_pixelfx.js) no están cargadas.</div>';
    st.jefe = hs.id;
    const k = st.jefe, A = jOf(k), D = J.DEF[k], cam = AJ.jefes[k] || {};
    h += `<div class="fila" style="margin-top:6px"><button data-a="traer">Traer al jefe</button><button data-a="probar">▶ Probar en el juego</button><button class="${st.repetir ? 'on' : 'sec'}" data-a="repetir">⟳ repetir</button><button class="sec" data-a="limpiar">Sacar</button><button class="sec" data-a="leer-a" title="volver a leer del juego su animación y cómo te pega">⟳ Leer del juego</button></div>
      <div class="fila"><label><input type="checkbox" data-c="invencible" ${st.invencible ? 'checked' : ''}> héroe invencible</label><label><input type="checkbox" data-c="quieto" ${st.quieto ? 'checked' : ''}> jefe quieto</label></div>`;
    const b = (c, extra) => D[c] === undefined ? '' : barra('j:' + c, A[c], c in cam, extra);
    h += `<div class="grupo">Cuándo <small>el aviso rojo y cada cuánto la usa</small></div>${b('aviso')}${b('entre')}${b('cada')}${b('dmin')}${b('dmax')}${b('desdeVida')}`;
    h += `<div class="grupo">Dónde pega <small>la marca roja y cuánto saca</small></div>${b('radio', k === 'pfx_aliento' ? { et: 'Largo del fuego', max: 300, ayuda: 'Hasta dónde llega el fuego desde la boca. También con el ■ rojo del escenario.' } : null)}${b('ancho')}${b('alcance')}${b('cantidad')}${b('paso')}${b('dura')}${b('dano')}${b('lento')}`;
    if (D.origen) { const oc = 'origen' in cam; h += `<div class="grupo">De dónde sale <small>o arrastrá la ✚ del escenario</small></div>${barra('j:odx', A.origen.dx, oc)}${barra('j:ody', A.origen.dy, oc)}`; }
    const quien = A.deHeroe ? 'del héroe' : 'del jefe';
    h += `<div class="grupo">Cómo se ve <small>${comillas(nomEf(A.efecto))}</small></div>${b('escala')}${barra('j:corte', A.corte || 0, !!A.corte)}
      <div class="br" data-ayuda="Se dibuja|Por delante o por detrás ${quien} (en esta habilidad, el personaje de referencia es ${quien === 'del héroe' ? 'el héroe, porque cae donde estás' : 'el jefe, porque sale de él'}). Automático = según la altura, como el resto del juego."><span class="et${'lado' in cam && cam.lado ? ' cambio' : ''}">Se dibuja<i title="por delante o por detrás ${quien}">?</i></span><select class="ancho2" data-s="j:lado">${opciones([['auto', 'automático (según la altura)'], ['delante', 'por delante ' + quien], ['detras', 'por detrás ' + quien]], A.lado || 'auto')}</select></div>`;
    if (D.sello !== undefined) h += `<label><input type="checkbox" data-c="j:sello" ${A.sello ? 'checked' : ''}> círculo de runas rojo debajo de la marca</label>`;
    h += `<div class="grupo">Capas que se suman <small>efectos extra en el golpe o en el jefe</small></div>`;
    (A.extras || []).forEach((c, i) => {
      h += `<div class="capa"><div class="cab"><b>${i + 1}</b> ${nomEf(c.efecto)} <span style="margin-left:auto"><button class="mini sec" data-a="x-quitar" data-i="${i}">✕ quitar</button></span></div>
        <div class="br"><span class="et">Dónde</span><select class="ancho2" data-x="${i}:donde">${opciones([['golpe', 'en el golpe'], ['jefe', 'en el jefe']], c.donde || 'golpe')}</select></div>
        <div class="br"><span class="et">Se dibuja</span><select class="ancho2" data-x="${i}:lado">${opciones([['auto', 'automático'], ['delante', 'por delante ' + (c.donde === 'jefe' || !A.deHeroe ? 'del jefe' : 'del héroe')], ['detras', 'por detrás ' + (c.donde === 'jefe' || !A.deHeroe ? 'del jefe' : 'del héroe')]], c.lado || 'auto')}</select></div>
        ${barra('x' + i + ':retraso', c.retraso || 0)}${barra('x' + i + ':dura', c.dura || 0)}${barra('x' + i + ':escala', c.escala || 1)}${barra('x' + i + ':dx', c.dx || 0)}${barra('x' + i + ':dy', c.dy || 0)}
        <div class="fila"><label>color <input type="color" data-x="${i}:tinte" value="${c.tinte != null ? hex(c.tinte) : '#ffffff'}"></label><label><input type="checkbox" data-x="${i}:sintinte" ${c.tinte == null ? 'checked' : ''}>sin color</label><label><input type="checkbox" data-x="${i}:suma" ${c.suma ? 'checked' : ''}>brilla (luz)</label></div></div>`;
    });
    h += `${(A.extras || []).length ? '' : '<div class="nota">No tiene. Si querés sumarle algo, escribilo en "Cómo lo querés".</div>'}${htmlMarcas('jefes', k)}
      <div class="grupo">Cómo lo querés <small>lo que no se pueda con las barras, escribímelo</small></div><textarea data-t="j">${(cam.notas || '').replace(/</g, '&lt;')}</textarea>
      <div class="fila"><button class="sec" data-a="restaurar-j">Volver todo a como estaba</button></div>`;
    return h;
  };

  // una habilidad de un jefe o enemigo que está en su código: se lee del juego y se edita en capas
  const htmlJefeOtra = (t, h) => {
    const clave = t + ':' + h.id, nota = (AJ.otras[clave] || {}).notas || '', C = LECT[clave];
    let o = `<div class="fila" style="margin-top:6px"><button data-a="probar" title="la hace de verdad en el juego, con tus cambios">▶ En el juego</button><button class="sec" data-a="leer" title="volver a leer del juego cómo es ahora">⟳ Leer del juego</button><button class="sec" data-a="limpiar">Sacar</button>
        <label><input type="checkbox" data-c="invencible" ${st.invencible ? 'checked' : ''}> héroe invencible</label></div>
      <div class="nota" style="color:#e8dcc0">${comillas(h.d)}</div>`;
    if (h.k === 'pelea') {
      aplicarTipo(t); const D = TIPOS_ET()[t], d = DEF_TIPO[t] || {}, a = AJ.tipos[t] || {};
      const cs = CAMPOS_T.filter(c => d[c] != null);
      if (D && cs.length) o += `<details ${st.numsAbiertos ? 'open' : ''} data-nums><summary>Sus números (vida, daño, alcance…)</summary>` + cs.map(c => barra('t:' + c, leer(D, c), a[c] != null && a[c] !== d[c])).join('') + '</details>';
    }
    if (h.k === 'esp') {
      const id = t + ':' + h.f; aplicarEsp(id); const d = DEF_ESP[id];
      if (d) { const c2 = AJ.especiales[id] || {}, a = Object.assign({}, d, c2); o += `<div class="grupo">Cuándo la usa</div>${barra('q:cada', a.cada, 'cada' in c2)}${barra('q:dmin', a.dmin, 'dmin' in c2)}${barra('q:dmax', a.dmax, 'dmax' in c2)}`; }
    }
    if (h.k === 'fase') {
      const F = faseObj(h.fase);
      if (F) { aplicarFase(h.fase); const a = AJ.fases[h.fase] || {}; o += `<div class="grupo">Sus números</div>` + h.campos.map(c => barra('f:' + c, leerFase(F, c), a[c] != null)).join(''); }
    }
    if (h.rolN && window.CK_ROLES && CK_ROLES[h.rolN]) {
      aplicarRol(h.rolN); const O = CK_ROLES[h.rolN], a = AJ.roles[h.rolN] || {};
      o += `<div class="grupo">Números de ${h.n.toLowerCase()} <small>valen para todos los que lo hacen</small></div>` + CAMPOS_ROL[h.rolN].filter(c => O[c] != null).map(c => barra('r:' + h.rolN + '.' + c, O[c], a[c] != null)).join('');
    }
    // las capas: lo que se ve, leído del juego
    if (!C) o += `<div class="grupo">Lo que se ve</div><div class="nota">${VP.leer ? 'Leyendo del juego… (el personaje la hace una vez, detrás del editor)' : 'Todavía no está leída: tocá "⟳ Leer del juego".'}</div>`;
    else {
      const A = AJ.capasJ[clave] || {};
      o += `<div class="grupo">Lo que se ve <small>${C.capas.length} capa${C.capas.length === 1 ? '' : 's'}, leídas del juego: elegí una y cambiala</small></div>`;
      if (!C.capas.length) o += '<div class="nota">No dibuja nada aparte del personaje (sólo su animación).</div>';
      C.capas.forEach((L, i) => {
        const ed = A[L.key] || {}, sel = L.key === st.capJ, cam = Object.keys(ed).length > 0, vida = vidaCapa(L);
        o += `<div class="capa ${sel ? 'sel' : ''}"><div class="cab" data-kc="${comillas(L.key)}"><b>${i + 1}</b> <span${ed.fuera ? ' style="text-decoration:line-through;opacity:.6"' : ''}>${comillas(L.nombre)}${L.n > 1 ? ' ×' + L.n : ''}</span><small style="opacity:.7">${segs(L.nace)}</small>${cam ? ' <span class="cambio">✎</span>' : ''}
          <span style="margin-left:auto"><button class="mini sec" data-a="k-fuera" data-k="${comillas(L.key)}">${ed.fuera ? '↺ ponerla' : '✕ quitar'}</button></span></div>`;
        if (sel && !ed.fuera) {
          const b = (c, v, extra) => barra('k:' + c, v, ed[c] != null, extra);
          o += `${b('dt', ed.dt || 0, { min: -Math.floor(L.nace / 10) * 10 })}${b('sa', ed.sa || 0, { max: Math.round(vida) })}${b('co', ed.co != null ? ed.co : Math.round(vida), { max: Math.max(100, Math.round(vida)) })}
            ${b('dx', ed.dx || 0)}${b('dy', ed.dy || 0)}${b('esc', ed.esc || 1)}${b('alfa', ed.alfa != null ? ed.alfa : 1)}
            <div class="fila"><label>color <input type="color" data-k2="col" value="${ed.col != null ? hex(ed.col) : '#ffffff'}"></label><label><input type="checkbox" data-k3="sincol" ${ed.col == null ? 'checked' : ''}>como en el juego</label><label><input type="checkbox" data-k3="luz" ${ed.luz ? 'checked' : ''}>brilla (luz)</label></div>
            <div class="br" data-ayuda="Se dibuja|Por delante o por detrás del personaje que la hace. Automático = como en el juego."><span class="et${ed.lado ? ' cambio' : ''}">Se dibuja<i title="por delante o por detrás">?</i></span><select class="ancho2" data-k2="lado">${opciones([['auto', 'como en el juego'], ['delante', 'por delante del personaje'], ['detras', 'por detrás del personaje']], ed.lado || 'auto')}</select></div>
            <div class="fila"><span class="nota" style="margin:0;opacity:.75">en el código: ${comillas(L.fn || '¿?')} · ${comillas(L.arch)}${L.lin ? ':' + L.lin : ''}</span>${cam ? '<button class="mini sec" data-a="k-volver" style="margin-left:auto">↺ como en el juego</button>' : ''}</div>`;
        }
        o += '</div>';
      });
      o += `<div class="nota">Lo que cambies se ve acá y con "▶ En el juego" (en el juego sólo se puede atrasar, no adelantar). Para que quede siempre así: "Exportar" y me lo pasás. Si querés agregarle algo, dejalo en una nota.</div>`;
    }
    o += htmlMarcas('jefes', clave) + `<div class="grupo">Cómo lo querés <small>lo que no se pueda con las barras, escribímelo</small></div><textarea data-t="o">${nota.replace(/</g, '&lt;')}</textarea>`;
    if (AJ.capasJ[clave]) o += `<div class="fila"><button class="sec" data-a="k-todo">Volver todas las capas a como en el juego</button></div>`;
    return o;
  };

  const htmlCapa = (c, i, id) => {
    const d = (DESP[id] || [])[i], cam = !!(AJ.heroes[id] && AJ.heroes[id].capas), dif = k => cam && JSON.stringify(c[k]) !== JSON.stringify(d ? d[k] : undefined);
    const b = (k, extra) => barra('c:' + k, c[k], dif(k), extra);
    const onda = /^@onda:/.test(c.ef);
    let h = '';
    if (c.ef !== '@temblor') h += `<div class="br"><span class="et">Sale desde</span><select class="ancho2" data-c2="en">${opciones([['pie', 'los pies'], ['pecho', 'el pecho'], ['centro', 'el centro'], ['cabeza', 'la cabeza']], c.en || 'centro')}</select></div>`;
    h += `<div class="grupo">Cuándo <small>o en la línea de tiempo: arrastrá la barra para moverla y sus bordes para cortarla</small></div>${b('ret')}${b('n', { def: 1 })}${(c.n || 1) > 1 ? b('cada') : ''}${/^@/.test(c.ef) ? '' : b('salta', { def: 0 })}`;
    if (c.ef !== '@temblor') h += `<div class="grupo">Dónde <small>o arrastrá el ${i + 1} en el escenario</small></div>${b('ad')}${b('dx')}${b('dy')}`;
    if (onda) h += `<div class="grupo">La onda</div>${b('radio', { def: 80 })}${b('dura', { et: 'Cuánto tarda', min: 180, max: 1500, paso: 10, def: 400, ayuda: 'Lo que tarda la onda en abrirse.' })}`;
    else if (c.ef === '@temblor') h += `<div class="grupo">El temblor</div>${b('dura', { et: 'Cuánto dura', min: 50, max: 1500, paso: 10, def: 200, ayuda: 'Cuánto tiempo tiembla la pantalla.' })}${b('fuerza', { et: 'Fuerza', min: 0, max: 0.03, paso: 0.001, def: 0.01, u: '', ayuda: 'Qué tan fuerte tiembla.' })}`;
    else if (c.ef === '@ulti') h += `<div class="grupo">El destello</div>${b('esc', { et: 'Fuerza', def: 1, max: 2, ayuda: 'Cuánto tiembla la pantalla con el destello.' })}`;
    else {
      h += `<div class="grupo">Cómo se ve <small>rueda sobre el ${i + 1}: tamaño</small></div>${b('esc', { def: 1 })}${b('alfa', { def: 1 })}${b('vel', { def: 1 })}${b('dura', { def: 0 })}
        <div class="fila"><label>color <input type="color" data-c2="tin" value="${c.tin != null ? hex(c.tin) : '#ffffff'}"></label><label><input type="checkbox" data-c3="sintin" ${c.tin == null ? 'checked' : ''}>sin color</label>
        ${[['suma', 'brilla (luz)'], ['girar', 'apunta hacia donde mira'], ['voltear', 'se da vuelta con el héroe']].map(([k, t]) => `<label><input type="checkbox" data-c3="${k}" ${c[k] ? 'checked' : ''}>${t}</label>`).join('')}</div>
        <div class="br" data-ayuda="Se dibuja|Por delante o por detrás ${c.enem ? 'de cada enemigo' : 'del héroe'}. Automático = según la altura, como el resto del juego."><span class="et${dif('lado') || dif('detras') ? ' cambio' : ''}">Se dibuja<i title="por delante o por detrás del personaje">?</i></span><select class="ancho2" data-c2="lado">${opciones([['auto', 'automático (según la altura)'], ['delante', 'por delante ' + (c.enem ? 'del enemigo' : 'del héroe')], ['detras', 'por detrás ' + (c.enem ? 'del enemigo' : 'del héroe')]], c.lado || (c.detras ? 'detras' : 'auto'))}</select></div>
        <details ${st.mas ? 'open' : ''} data-mas><summary>Más opciones</summary>${(c.n || 1) > 1 ? b('sube', { def: 0 }) + b('avz', { def: 0 }) : ''}${b('az', { def: 0 })}${b('azy', { def: 0 })}${b('enem', { def: 0 })}${b('pro', { vacio: true, def: 0 })}
        <div class="fila">${[['alterna', 'alterna el lado cada vez'], ['sigue', 'sigue al héroe'], ['unaVez', 'da una sola vuelta']].map(([k, t]) => `<label><input type="checkbox" data-c3="${k}" ${c[k] ? 'checked' : ''}>${t}</label>`).join('')}</div></details>`;
    }
    return h;
  };

  const htmlHeroes = () => {
    const S = escena(), hh = st.heroe, L = listaHabs(S, hh), tk = teclasDe(S, hh);
    if (!L.editables.includes(st.hab) && !L.sin.includes(st.hab)) { st.hab = L.editables[0] || HEROES[hh][1][0]; st.capa = 0; }
    const id = st.hab, capas = capasDe(id), cambiado = !!(AJ.heroes[id] && AJ.heroes[id].capas);
    const marca = x => AJ.heroes[x] || (PROY_DE[x] && AJ.proyectiles[PROY_DE[x]]) ? ' ✎' : '';
    let h = pasos('heroes') + `<div class="grupo">Personaje</div><div class="pjs">${Object.keys(HEROES).map(x => `<button class="pj ${x === hh ? 'sel' : ''}" data-pj="${x}" ${S && S.playerHero === x ? 'title="el que estás usando"' : ''}>${HEROES[x][0]}${S && S.playerHero === x ? ' ●' : ''}</button>`).join('')}</div>
      <div class="grupo">Habilidades de ${HEROES[hh][0]} <label class="der"><input type="checkbox" data-c="soloTiene" ${st.soloTiene ? 'checked' : ''}> sólo las que tiene</label></div>
      <div class="habs">${L.editables.map(x => `<button class="hab ${x === id ? 'sel' : ''}" data-hab="${x}"><span>${nombreHab(x)}${marca(x)}</span>${tk[x] ? `<span class="tc" title="la tiene en la tecla ${tk[x]}">${tk[x]}</span>` : ''}</button>`).join('')}${L.sin.map(x => `<button class="hab ${x === id ? 'sel' : ''}" data-hab="${x}" title="Su efecto está dentro del código: se ve leído del juego (para cambiarlo, dejá una nota)"><span>${nombreHab(x)}${marca(x)}</span><span class="tc" title="se ve leída del juego">ver</span>${tk[x] ? `<span class="tc">${tk[x]}</span>` : ''}</button>`).join('')}</div>
      <div class="nota">${st.soloTiene ? 'Se ven las que tiene aprendidas (las de base y las del árbol, tecla H). Destildá "sólo las que tiene" para ver todas.' : 'Se ven todas las de ' + HEROES[hh][0] + '.'} La letra es la tecla donde la tiene puesta.</div>${htmlNuevas('heroe:' + hh)}
      <div class="fila" style="margin-top:6px"><button data-a="probar">▶ Probar en el juego</button><button class="sec" data-a="solo">Sólo el efecto</button><button class="${st.repetir ? 'on' : 'sec'}" data-a="repetir">⟳ repetir</button><button class="sec" data-a="munieco">Muñeco</button><button class="sec" data-a="limpiar">Sacar</button><button class="sec" data-a="leer-a" title="volver a leer del juego su animación y lo que golpea">⟳ Leer del juego</button></div>`;
    if (id !== 'ataque') {
      h += `<div class="grupo">Capas de ${nombreHab(id)} ${cambiado ? '<small class="cambio">(cambiadas)</small>' : '<small>los efectos que se ven, en orden</small>'}</div>`;
      const PED = window.CK_HEROES_PEDIDOS;
      if (!capas.length) h += PED && PED.REHECHAS && PED.REHECHAS.includes(id) ? '<div class="nota">Sus efectos están en el código (ck_heroes_pedidos.js): se ven leídos del juego, con su animación. Podés sumarle capas encima.</div>'
        : '<div class="nota">Esta habilidad no tiene efecto propio (usa el del proyectil o el del golpe). Podés sumarle una capa.</div>';
      capas.forEach((c, i) => {
        const sel = i === st.capa;
        h += `<div class="capa ${sel ? 'sel' : ''}"><div class="cab" data-a="capa" data-i="${i}"><b>${i + 1}</b> ${nomEf(c.ef)} <span class="nota">${c.ret ? c.ret + ' ms' : 'al toque'}${c.n > 1 ? ' · ' + c.n + ' veces' : ''}</span>
          <span style="margin-left:auto"><button class="mini sec" data-a="c-quitar" data-i="${i}" title="quitar esta capa">✕</button></span></div>`;
        if (sel) h += htmlCapa(c, i, id);
        h += '</div>';
      });
      h += `<div class="nota">¿Querés sumarle otra cosa o cambiar un efecto por otro? Escribilo en "Cómo lo querés" (o marcalo con ✎ Nota).</div>`;
    }
    const key = PROY_DE[id];
    if (key) {
      const a = AJ.proyectiles[key] || {}, d = PROY[key];
      h += `<div class="grupo">Proyectil · ${d[0]} <small>${comillas(nomEf(a.ef || d[1]))}${d[3] ? '' : ' · o arrastrá la ➤ del escenario'}</small></div>${barra('p:esc', a.esc != null ? a.esc : d[2], 'esc' in a)}`;
      h += d[3] ? `<div class="nota">${d[3]}</div>` : barra('p:ad', a.ad || 0, 'ad' in a) + barra('p:dy', a.dy || 0, 'dy' in a);
    }
    const nt = (AJ.heroes[id] && AJ.heroes[id].notas) || '';
    h += `${htmlMarcas('heroes', id)}<div class="grupo">Cómo lo querés <small>lo que no se pueda con las barras, escribímelo</small></div><textarea data-t="h">${nt.replace(/</g, '&lt;')}</textarea>
      <div class="fila"><button class="sec" data-a="restaurar-h">Volver todo a como estaba</button></div>`;
    return h;
  };

  const htmlEfectos = () => {
    const k = st.ef, a = efOf(k), cam = AJ.efectos[k] || {}, h0 = hojas()[k] || {};
    return pasos('efectos') + `<div class="grupo">Efecto</div><select data-s="ef" style="width:100%">${optsEf(k, false, AJ.efectos)}</select>
      <div class="nota">${nomEf(k)} (${k})${h0.id ? ' · de pixelfx: ' + h0.id : ''} · ${h0.n || 0} cuadros${h0.loop ? ', en bucle' : ''}. Lo que cambies acá vale para todas las habilidades que lo usan.</div>
      ${barra('e:esc', a.esc, 'esc' in cam)}${barra('e:fps', a.fps, 'fps' in cam)}
      <div class="grupo">Punto de apoyo <small>o arrastrá el dibujo en el escenario</small></div>${barra('e:ax', a.ax, 'ax' in cam, { max: h0.fw || 100 })}${barra('e:ay', a.ay, 'ay' in cam, { max: h0.fh || 100 })}
      <div class="fila"><button data-a="probar">▶ Probar en el juego</button><button class="${st.repetir ? 'on' : 'sec'}" data-a="repetir">⟳ repetir</button><button class="sec" data-a="limpiar">Sacar</button></div>
      ${htmlMarcas('efectos', k)}<div class="grupo">Cómo lo querés</div><textarea data-t="e">${(cam.notas || '').replace(/</g, '&lt;')}</textarea>
      <div class="fila"><button class="sec" data-a="restaurar-e">Volver todo a como estaba</button></div>`;
  };

  const htmlEstados = () => {
    const k = st.est, D0 = DEF_EST[k]; if (!D0) return '<div class="nota">Los estados (ck_estados.js) no están cargados.</div>';
    const a = estOf(k), cam = AJ.estados[k] || {};
    const chip = x => `<button class="hab ${x === k ? 'sel' : ''}" data-est="${x}"><span>${NOM_EST[x] || x}${AJ.estados[x] ? ' ✎' : ''}</span></button>`;
    const enem = Object.keys(DEF_EST).filter(x => DEF_EST[x].g === 'DEB'), her = Object.keys(DEF_EST).filter(x => DEF_EST[x].g === 'BUF');
    const b = (c, extra) => barra('s:' + c, a[c], c in cam && cam[c] !== D0[c], extra);
    return pasos('estados') + `<div class="grupo">En los enemigos</div><div class="habs">${enem.map(chip).join('')}</div>
      <div class="grupo">En el héroe</div><div class="habs">${her.map(chip).join('')}</div>
      <div class="fila" style="margin-top:6px"><button data-a="probar">▶ Probar en el juego</button><button class="sec" data-a="munieco">Muñeco</button><button class="sec" data-a="limpiar">Sacar</button></div>
      <div class="nota">"Probar" se lo pone 4 segundos ${D0.g === 'DEB' ? 'al muñeco' : 'al héroe'}. Cuánto dura de verdad lo decide cada habilidad: si querés cambiarlo, escribímelo abajo.</div>
      <div class="grupo">Qué se ve <small>${comillas(nomEf(a.fx))}</small></div>
      <div class="br" data-ayuda="Dónde va|Sobre la cabeza (como las estrellas del aturdido), en la cabeza, en el pecho, en el centro del cuerpo o a los pies. Se ubica con el contorno real del dibujo de cada personaje, así queda bien en los chicos y en los grandes."><span class="et${'en' in cam && cam.en !== D0.en ? ' cambio' : ''}">Dónde va<i title="Se ubica con el contorno real del dibujo de cada personaje.">?</i></span><select class="ancho2" data-s="s:en">${opciones([['sobre', 'sobre la cabeza'], ['cabeza', 'en la cabeza'], ['pecho', 'en el pecho'], ['centro', 'en el centro del cuerpo'], ['pie', 'a los pies']], a.en)}</select></div>
      <div class="grupo">Ajuste fino <small>o arrastrá la ✚ del escenario</small></div>${b('dx')}${b('dy')}
      <div class="grupo">Cómo se ve <small>rueda sobre la ✚: tamaño</small></div>${b('esc')}${b('alfa')}${b('vel')}
      <div class="fila"><label>color <input type="color" data-s2="tin" value="${a.tin != null ? hex(a.tin) : '#ffffff'}"></label><label><input type="checkbox" data-s3="sintin" ${a.tin == null ? 'checked' : ''}>sin color</label><label><input type="checkbox" data-s3="suma" ${a.suma ? 'checked' : ''}>brilla (luz)</label></div>
      <div class="br" data-ayuda="Se dibuja|Por delante o por detrás del personaje que tiene el estado. Así venía: ${D0.detras ? 'por detrás' : 'por delante'}."><span class="et${'lado' in cam || 'detras' in cam ? ' cambio' : ''}">Se dibuja<i title="por delante o por detrás del personaje">?</i></span><select class="ancho2" data-s="s:lado">${opciones([['delante', 'por delante del personaje'], ['detras', 'por detrás del personaje']], a.detras ? 'detras' : 'delante')}</select></div>
      ${htmlMarcas('estados', k)}
      <div class="grupo">Cómo lo querés <small>lo que no se pueda con las barras, escribímelo</small></div><textarea data-t="s">${(cam.notas || '').replace(/</g, '&lt;')}</textarea>
      <div class="fila"><button class="sec" data-a="restaurar-s">Volver todo a como estaba</button></div>`;
  };

  // ---------------------------------------------------------------- poner un valor (barra o número) y volverlo a como estaba
  const ponerValor = (id, v) => {
    const [g, c] = id.split(':');
    if (isNaN(v) && c !== 'pro') return;
    if (g === 'j') {
      if (c === 'odx' || c === 'ody') { const o = Object.assign({ dx: 0, dy: 0 }, jOf(st.jefe).origen); o[c === 'odx' ? 'dx' : 'dy'] = v; tocarJefe(st.jefe, 'origen', o); }
      else tocarJefe(st.jefe, c, v);
    } else if (/^x\d+$/.test(g)) {
      const i = +g.slice(1), ex = copia(jOf(st.jefe).extras || []); if (!ex[i]) return; ex[i][c] = v; tocarJefe(st.jefe, 'extras', ex);
    } else if (g === 'c') {
      const capas = capasDe(st.hab), cp = capas[st.capa]; if (!cp) return;
      if (c === 'pro' && isNaN(v)) delete cp.pro; else cp[c] = c === 'n' ? Math.max(1, Math.round(v)) : v;
      tocarHeroe(st.hab, capas);
    } else if (g === 'p') {
      const key = PROY_DE[st.hab]; AJ.proyectiles[key] = Object.assign(AJ.proyectiles[key] || {}, { [c]: v }); guardar();
    } else if (g === 'e') {
      AJ.efectos[st.ef] = Object.assign(AJ.efectos[st.ef] || {}, { [c]: v }); aplicarEfecto(st.ef); guardar();
    } else if (g === 's') {
      AJ.estados[st.est] = Object.assign(AJ.estados[st.est] || {}, { [c]: v }); aplicarEstado(st.est); guardar();
    } else if (g === 't') {
      const t = st.jefeTipo; AJ.tipos[t] = Object.assign(AJ.tipos[t] || {}, { [c]: c === 'hp' || c === 'dmg' || c === 'summon.max' ? Math.round(v) : v }); aplicarTipo(t); guardar();
    } else if (g === 'q') {
      const id = st.jefeTipo + ':' + habSel().f; AJ.especiales[id] = Object.assign(AJ.especiales[id] || {}, { [c]: v }); aplicarEsp(id); guardar();
    } else if (g === 'f') {
      const n = habSel().fase; if (!n) return; AJ.fases[n] = Object.assign(AJ.fases[n] || {}, { [c]: v }); aplicarFase(n); guardar();
    } else if (g === 'r') {
      const [n, k] = c.split('.'); AJ.roles[n] = Object.assign(AJ.roles[n] || {}, { [k]: v }); aplicarRol(n); guardar();
    } else if (g === 'k') {
      const L = capaLeida(st.capJ); if (!L) return; const ed = edCap(st.capJ);
      if (c === 'co') { if (v >= vidaCapa(L) - 15) delete ed.co; else ed.co = Math.max((ed.sa || 0) + 30, v); } else ed[c] = v;
      limpiarCap(); guardar();
    }
  };
  const volverValor = id => {
    const [g, c] = id.split(':');
    if (g === 'j') {
      const a = AJ.jefes[st.jefe]; if (!a) return;
      if (c === 'odx' || c === 'ody') { if (a.origen) { const D = JP().DEF[st.jefe].origen || { dx: 0, dy: 0 }, k = c === 'odx' ? 'dx' : 'dy'; a.origen = Object.assign({}, a.origen, { [k]: D[k] }); if (a.origen.dx === D.dx && a.origen.dy === D.dy) delete a.origen; } }
      else delete a[c];
      aplicarJefe(st.jefe); guardar();
    } else if (g === 'c') {
      const capas = capasDe(st.hab), cp = capas[st.capa], d = (DESP[st.hab] || [])[st.capa]; if (!cp) return;
      if (d && d[c] != null) cp[c] = d[c]; else delete cp[c];
      tocarHeroe(st.hab, capas);
    } else if (g === 'p') { const a = AJ.proyectiles[PROY_DE[st.hab]]; if (a) { delete a[c]; guardar(); } }
    else if (g === 'e') { const a = AJ.efectos[st.ef]; if (a) { delete a[c]; aplicarEfecto(st.ef); guardar(); } }
    else if (g === 's') { const a = AJ.estados[st.est]; if (a) { delete a[c]; if (!Object.keys(a).length) delete AJ.estados[st.est]; aplicarEstado(st.est); guardar(); } }
    else if (g === 't') { const t = st.jefeTipo, a = AJ.tipos[t]; if (a) { delete a[c]; if (!Object.keys(a).length) delete AJ.tipos[t]; aplicarTipo(t); guardar(); } }
    else if (g === 'q') { const id = st.jefeTipo + ':' + habSel().f, a = AJ.especiales[id]; if (a) { delete a[c]; if (!Object.keys(a).length) delete AJ.especiales[id]; aplicarEsp(id); guardar(); } }
    else if (g === 'f') { const n = habSel().fase, a = n && AJ.fases[n]; if (a) { delete a[c]; if (!Object.keys(a).length) delete AJ.fases[n]; aplicarFase(n); guardar(); } }
    else if (g === 'r') { const [n, k] = c.split('.'), a = AJ.roles[n]; if (a) { delete a[k]; if (!Object.keys(a).length) delete AJ.roles[n]; aplicarRol(n); guardar(); } }
    else if (g === 'k') { const ed = edDe(claveJefe(), st.capJ); delete ed[c]; limpiarCap(); guardar(); }
  };
  // indicaciones: al pasar por una barra, su explicación aparece abajo del escenario
  const mostrarAyuda = t => {
    const ay = document.getElementById('ckeh-ayuda'); if (!ay) return;
    if (!t) { ay.classList.remove('tip'); ay.textContent = VP.ayuda0 || ''; return; }
    const [et, tx] = t.split('|'); ay.classList.add('tip'); ay.innerHTML = `<b>${comillas(et)}:</b> ${comillas(tx || '')}`;
  };

  const resumen = () => {
    const l = [];
    Object.keys(AJ.jefes).forEach(k => l.push('Jefe · ' + (JP() && JP().DEF[k] ? JP().DEF[k].nombre : k)));
    Object.keys(AJ.heroes).forEach(k => l.push('Héroe · ' + nombreHab(k)));
    (AJ.nuevas || []).forEach(n => l.push('Habilidad nueva · ' + (n.quien || nomQuien(n.para)) + ' · ' + (n.nombre || 'sin nombre')));
    Object.keys(AJ.proyectiles).forEach(k => l.push('Proyectil · ' + (PROY[k] ? PROY[k][0] : k)));
    Object.keys(AJ.efectos).forEach(k => l.push('Efecto · ' + nomEf(k)));
    Object.keys(AJ.estados || {}).forEach(k => l.push('Estado · ' + (NOM_EST[k] || k)));
    Object.keys(AJ.tipos || {}).forEach(t => l.push('Jefe · ' + (NOMBRE_JEFE[t] || t) + ' · sus números'));
    Object.keys(AJ.especiales || {}).forEach(id => { const [t, k] = id.split(':'); l.push('Jefe · ' + (NOMBRE_JEFE[t] || t) + ' · ' + k); });
    Object.keys(AJ.fases || {}).forEach(n => l.push('Jefe · fases de ' + n));
    Object.keys(AJ.capasJ || {}).forEach(k => { const [t, id] = k.split(':'), h = habsDe(t).find(x => x.id === id); l.push((NOMBRE_JEFE[t] || nomTipo(t)) + ' · ' + (h ? h.n : id) + ' · ' + Object.keys(AJ.capasJ[k]).length + ' capa(s)'); });
    Object.keys(AJ.roles || {}).forEach(n => l.push('Enemigos · ' + ({ CARGA: 'embestida', ESCUDO: 'escudo', TIRADOR: 'tirador', AULLA: 'aullido' }[n] || n)));
    return l;
  };
  // ---------------------------------------------------------------- (v10) anotar habilidades nuevas para un personaje
  // (21/11, pedido: "un botón para anotar nuevas habilidades en caso de querer meter más a los personajes u enemigos")
  const NUEVA_CAMPOS = [['nombre', 'Nombre', 'input', 'cómo se llama'],
    ['hace', 'Qué hace', 'area', 'qué hace en el juego: a quién le pega, cuánto, si empuja, aturde, cura, cuánto dura...'],
    ['anim', 'Animación', 'area', 'cómo se mueve el personaje: anticipación, el golpe, la pose (o qué animación suya usar)'],
    ['efectos', 'Efectos y colores', 'area', 'qué se ve: partículas, ondas, luz, colores, sonido'],
    ['cuando', 'Cuándo la usa', 'input', 'tecla, cada cuánto, a qué distancia, en qué fase de la pelea']];
  const quienAhora = () => st.tab === 'heroes' ? 'heroe:' + st.heroe : 'enemigo:' + st.jefeTipo;
  const nomQuien = q => { const [g, t] = String(q || '').split(':'); return g === 'heroe' ? (HEROES[t] ? HEROES[t][0] : t) : (NOMBRE_JEFE[t] || nomTipo(t)); };
  const nuevasDe = q => (AJ.nuevas || []).filter(n => n.para === q);
  const htmlNuevas = q => `<div class="fila nuevas" style="margin-top:4px">${nuevasDe(q).map(n => `<button class="mini sec" data-nv="${comillas(n.id)}" title="${comillas(n.hace)}">✚ ${comillas(n.nombre || 'sin nombre')}</button>`).join('')}<button class="mini" data-a="nueva-hab" title="anotá una habilidad que querés que tenga ${comillas(nomQuien(q))}">＋ Anotar habilidad nueva</button></div>`;
  const formNueva = idEd => {
    const der = document.getElementById('ckeh-der'); if (!der) return;
    const viejo = document.getElementById('ckeh-nueva'); if (viejo) viejo.remove();
    const n = (AJ.nuevas || []).find(x => x.id === idEd) || { para: quienAhora() };
    const T = TIPOS_ET(), ops = Object.keys(HEROES).map(h => ['heroe:' + h, HEROES[h][0] + ' (héroe)'])
      .concat(ORDEN_JEFES.filter(x => T[x] || CATALOGO[x]).map(x => ['enemigo:' + x, (NOMBRE_JEFE[x] || nomTipo(x)) + ' (jefe)']))
      .concat(Object.keys(T).filter(x => !ORDEN_JEFES.includes(x)).sort((a, b) => nomTipo(a).localeCompare(nomTipo(b))).map(x => ['enemigo:' + x, nomTipo(x)]));
    const caja = document.createElement('div'); caja.id = 'ckeh-nueva'; caja.className = 'nuevaform';
    caja.innerHTML = `<h3>${idEd ? 'HABILIDAD NUEVA ANOTADA' : 'ANOTAR UNA HABILIDAD NUEVA'}</h3>
      <div class="nota">Contame cómo la querés y la hago en una próxima tanda. Queda guardada acá y sale en "Exportar".</div>
      <label class="campo">Para<select data-nf2="para" style="width:100%">${opciones(ops, n.para)}</select></label>
      ${NUEVA_CAMPOS.map(([k, et, tipo, ph]) => `<label class="campo">${et}${tipo === 'area' ? `<textarea data-nf2="${k}" placeholder="${comillas(ph)}" style="min-height:54px">${comillas(n[k])}</textarea>` : `<input data-nf2="${k}" placeholder="${comillas(ph)}" value="${comillas(n[k])}" style="width:100%">`}</label>`).join('')}
      <div class="fila"><button data-nf2b="ok">Guardar</button><button class="sec" data-nf2b="no">Cancelar</button>${idEd ? '<button class="sec" data-nf2b="x">Borrar</button>' : ''}</div>`;
    der.appendChild(caja); caja.scrollIntoView({ block: 'nearest' });
    caja.querySelectorAll('input,textarea,select').forEach(x => x.addEventListener('keydown', e => e.stopPropagation()));   // (que las teclas no muevan al héroe)
    const leer = () => { const o = {}; caja.querySelectorAll('[data-nf2]').forEach(x => { o[x.dataset.nf2] = x.value.trim(); }); return o; };
    caja.querySelector('[data-nf2b=no]').onclick = e => { e.stopPropagation(); caja.remove(); };
    const bx = caja.querySelector('[data-nf2b=x]'); if (bx) bx.onclick = e => { e.stopPropagation(); AJ.nuevas = (AJ.nuevas || []).filter(x => x.id !== idEd); guardar(); pintar(); avisar('borrada'); };
    caja.querySelector('[data-nf2b=ok]').onclick = e => {
      e.stopPropagation(); const o = leer();
      if (!o.nombre && !o.hace) { avisar('poné al menos el nombre o qué hace'); return; }
      AJ.nuevas = AJ.nuevas || [];
      const v = Object.assign({}, n, o, { quien: nomQuien(o.para), fecha: new Date().toISOString() });
      if (!v.id) { v.id = 'n' + Date.now().toString(36); AJ.nuevas.push(v); } else AJ.nuevas = AJ.nuevas.map(x => (x.id === v.id ? v : x));
      guardar(); pintar(); avisar('anotada ✓');
    };
  };
  const htmlNotas = () => {
    const l = resumen(), M = AJ.marcas || [];
    return `<h3>NOTAS MARCADAS EN EL ESCENARIO (${M.length})</h3>` + (M.length ? M.map(m => `<div class="marca grande${m.foto ? '' : ' sinfoto'}">${m.foto ? `<img src="${m.foto}" alt="">` : ''}<div><b>${comillas(m.nombre)}</b><div class="nota">${segs(m.t)} · ${tipoN(m.tipo)}${m.mira ? ' · mirando ' + ({ der: '→', izq: '←', arriba: '↑', abajo: '↓' }[m.mira] || '') : ''}</div><div style="margin:3px 0">${comillas(m.texto) || '(sin texto)'}</div>
      <div class="fila"><button class="mini" data-m-ir="${m.id}">Ir</button><button class="mini sec" data-m-x="${m.id}">Borrar</button></div></div></div>`).join('')
      : '<div class="nota">Todavía ninguna. En cualquier pestaña: "✎ Nota" (o la tecla N), marcá con el mouse sobre el escenario lo que querés cambiar y escribí cómo lo querés.</div>') + `
      <h3>HABILIDADES NUEVAS ANOTADAS (${(AJ.nuevas || []).length})</h3>${(AJ.nuevas || []).length ? AJ.nuevas.map(n => `<div class="marca grande sinfoto"><div><b>${comillas(n.quien || nomQuien(n.para))} · ${comillas(n.nombre || 'sin nombre')}</b>${NUEVA_CAMPOS.slice(1).filter(([k]) => n[k]).map(([k, et]) => `<div class="nota"><b>${et}:</b> ${comillas(n[k])}</div>`).join('')}<div class="fila"><button class="mini" data-nv="${comillas(n.id)}">Editar</button></div></div></div>`).join('') : '<div class="nota">Ninguna. En Héroes o en Enemigos y jefes: "＋ Anotar habilidad nueva" debajo de la lista de habilidades del personaje.</div>'}
      <h3>NOTAS GENERALES</h3><textarea data-t="g" style="min-height:120px">${(AJ.notas || '').replace(/</g, '&lt;')}</textarea>
      <h3>LO QUE CAMBIASTE (${l.length})</h3>${l.length ? '<div class="nota">' + l.join('<br>') + '</div>' : '<div class="nota">Todavía nada.</div>'}
      <div class="nota" style="margin-top:8px">Todo esto queda guardado en el juego. Para pasármelo: "Exportar" (baja ajustes_habilidades.json) o "Copiar" y lo pegás en el chat.</div>`;
  };

  const pintar = () => {
    const p = document.getElementById('ckeh'); if (!p) return;
    const S = escena();
    if (!document.getElementById('ckeh-der')) {
      p.innerHTML = `<div id="ckeh-cab"></div><div class="cuerpo"><div id="ckeh-izq"><div id="ckeh-barra" class="fila"></div><canvas id="ckeh-lienzo"></canvas><div id="ckeh-notaform"></div>
        <canvas id="ckeh-tiempo"></canvas><div class="nota" id="ckeh-ayuda"></div></div><div id="ckeh-der"></div></div>`;
      engancharLienzos();
    }
    const tab = (t, n) => `<button class="${st.tab === t ? 'sel' : ''}" data-tab="${t}">${n}</button>`;
    if (VP.nota && (VP.nota.tab !== st.tab || VP.nota.clave !== claveDe(st.tab))) notaModo(false);   // cambió lo elegido: la nota a medias se descarta
    const cuerpo = st.tab === 'jefes' ? htmlJefes() : st.tab === 'heroes' ? htmlHeroes() : st.tab === 'efectos' ? htmlEfectos() : st.tab === 'estados' ? htmlEstados() : htmlNotas();
    document.getElementById('ckeh-cab').innerHTML = `<span class="x" data-a="cerrar">✕</span><h2>EDITOR DE HABILIDADES<span id="ckeh-estado"></span></h2>
      <div class="fila tabs">${tab('jefes', 'Enemigos y jefes')}${tab('heroes', 'Héroes')}${tab('estados', 'Estados')}${tab('notas', 'Notas' + ((AJ.marcas || []).length ? ' (' + AJ.marcas.length + ')' : ''))}</div>`;
    const d = document.getElementById('ckeh-der');
    d.innerHTML = `${cuerpo}<h3>PASÁRMELO</h3><div class="fila"><button data-a="exportar">Exportar</button><button class="sec" data-a="copiar">Copiar</button><button class="sec" data-a="importar">Importar</button><button class="sec" data-a="borrar-todo">Borrar todos los cambios</button></div>`;
    d.scrollTop = st.scroll || 0;
    p.classList.toggle('notas', st.tab === 'notas'); p.classList.toggle('full', !!VP.full);
    if (!VP.arr) { VP.sobreM = null; VP.sobre = null; }
    const sigue = VP.ayudaId && p.querySelector(`[data-r="${VP.ayudaId}"]`);       // si el mouse sigue sobre la misma barra, su indicación queda
    if (sigue) mostrarAyuda(sigue.parentNode.dataset.ayuda); else { VP.ayudaId = null; mostrarAyuda(null); }
    pintarBarra();
    conectar(p, S);
    arrancarEscenario();
  };

  // ---------------------------------------------------------------- lo que hace cada control
  const conectar = (p, S) => {
    const der = document.getElementById('ckeh-der'); if (der) der.onscroll = () => { st.scroll = der.scrollTop; };
    p.querySelectorAll('[data-tab]').forEach(b => b.onclick = e => { e.stopPropagation(); st.tab = b.dataset.tab; st.marcar = null; st.scroll = 0; VP.t = 0; VP.cuadro = null; VP.ayudaId = null; pintar(); });
    p.querySelectorAll('[data-s]').forEach(s => s.onchange = () => {
      const v = s.value, k = s.dataset.s;
      if (k !== 'j:efecto') { VP.t = 0; VP.cuadro = null; VP.play = true; }
      if (k === 'jefe') { st.jefe = v; st.scroll = 0; }
      else if (k === 'heroe') { st.heroe = v; st.hab = HEROES[v][1][0]; st.capa = 0; }
      else if (k === 'hab') { st.hab = v; st.capa = 0; }
      else if (k === 'ef') st.ef = v;
      else if (k === 'j:efecto') tocarJefe(st.jefe, 'efecto', v);
      else if (k === 'tipo') { st.jefeTipo = v; st.jefeHab = habsDe(v)[0].id; st.scroll = 0; }
      else if (k === 'j:lado') tocarJefe(st.jefe, 'lado', v === 'auto' ? null : v);
      else if (k === 's:lado') { AJ.estados[st.est] = Object.assign(AJ.estados[st.est] || {}, { detras: v === 'detras', lado: v }); aplicarEstado(st.est); guardar(); }
      else if (k.indexOf('s:') === 0) { AJ.estados[st.est] = Object.assign(AJ.estados[st.est] || {}, { [k.slice(2)]: v }); aplicarEstado(st.est); guardar(); }
      pintar();
    });
    p.querySelectorAll('[data-n]').forEach(inp => inp.onchange = () => { ponerValor(inp.dataset.n, parseFloat(inp.value)); pintar(); });
    // las barras: se ve en vivo mientras se arrastra; al soltar se redibuja el panel
    p.querySelectorAll('[data-r]').forEach(r => {
      r.oninput = () => { const v = parseFloat(r.value), n = r.parentNode.querySelector('[data-n]'); if (n) n.value = fmt(v); ponerValor(r.dataset.r, v); };
      r.onchange = () => pintar();
    });
    p.querySelectorAll('[data-re]').forEach(b => b.onclick = e => { e.stopPropagation(); volverValor(b.dataset.re); pintar(); });
    p.querySelectorAll('[data-pj]').forEach(b => b.onclick = e => {
      e.stopPropagation(); const v = b.dataset.pj; VP.t = 0; VP.cuadro = null; VP.play = true; st.scroll = 0;
      if (st.tab === 'heroes') { st.heroe = v; st.hab = null; st.capa = 0; }
      else { st.jefeTipo = v; st.jefeHab = habsDe(v)[0].id; }
      pintar();
    });
    p.querySelectorAll('[data-hab]').forEach(b => b.onclick = e => {
      e.stopPropagation(); VP.t = 0; VP.cuadro = null; VP.play = true;
      if (st.tab === 'heroes') { st.hab = b.dataset.hab; st.capa = 0; pintar(); return; }
      st.jefeHab = b.dataset.hab; if (esPfx(st.jefeHab)) st.jefe = st.jefeHab;
      pintar();
      const S3 = escena(); if (S3 && !esPfx(st.jefeHab) && !LECT[claveJefe()]) leerJefe(S3);   // la primera vez se lee sola
    });
    p.querySelectorAll('details[data-mas]').forEach(d => d.ontoggle = () => { st.mas = d.open; });
    p.querySelectorAll('details[data-nums]').forEach(d => d.ontoggle = () => { st.numsAbiertos = d.open; });
    p.querySelectorAll('[data-kc]').forEach(b => b.onclick = e => { e.stopPropagation(); st.capJ = b.dataset.kc; pintar(); });
    p.querySelectorAll('[data-k2]').forEach(inp => inp.onchange = () => {
      if (!capaLeida(st.capJ)) return; const ed = edCap(st.capJ), c = inp.dataset.k2;
      if (c === 'col') ed.col = deHex(inp.value); else if (c === 'lado') { if (inp.value === 'auto') delete ed.lado; else ed.lado = inp.value; }
      limpiarCap(); guardar(); pintar();
    });
    p.querySelectorAll('[data-k3]').forEach(inp => inp.onchange = () => {
      if (!capaLeida(st.capJ)) return; const ed = edCap(st.capJ), c = inp.dataset.k3;
      if (c === 'sincol') { if (inp.checked) delete ed.col; else ed.col = 0xffffff; } else if (c === 'luz') ed.luz = inp.checked;
      limpiarCap(); guardar(); pintar();
    });
    p.querySelectorAll('[data-est]').forEach(b => b.onclick = e => { e.stopPropagation(); st.est = b.dataset.est; VP.t = 0; VP.cuadro = null; VP.play = true; pintar(); });
    p.querySelectorAll('[data-s2]').forEach(inp => inp.onchange = () => { AJ.estados[st.est] = Object.assign(AJ.estados[st.est] || {}, { tin: deHex(inp.value) }); aplicarEstado(st.est); guardar(); pintar(); });
    p.querySelectorAll('[data-s3]').forEach(inp => inp.onchange = () => {
      const c = inp.dataset.s3, a = AJ.estados[st.est] = AJ.estados[st.est] || {};
      if (c === 'sintin') { if (inp.checked) a.tin = null; else a.tin = 0xffffff; } else a[c] = inp.checked;
      aplicarEstado(st.est); guardar(); pintar();
    });
    p.querySelectorAll('[data-m-ir]').forEach(b => b.onclick = e => { e.stopPropagation(); irMarca(b.dataset.mIr); });
    p.querySelectorAll('[data-m-x]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      if (!b.dataset.ok) { b.dataset.ok = 1; const t0 = b.textContent; b.textContent = '¿Seguro?'; setTimeout(() => { if (b) { delete b.dataset.ok; b.textContent = t0; } }, 2500); return; }
      AJ.marcas = (AJ.marcas || []).filter(m => String(m.id) !== String(b.dataset.mX)); guardar(); pintar();
    });
    p.querySelectorAll('[data-ayuda]').forEach(el => {
      const ver = () => { const r = el.querySelector('[data-r]'); VP.ayudaId = r ? r.dataset.r : null; mostrarAyuda(el.dataset.ayuda); };
      el.addEventListener('mouseenter', ver); el.addEventListener('focusin', ver);
      el.addEventListener('mouseleave', () => { VP.ayudaId = null; mostrarAyuda(null); });
    });
    p.querySelectorAll('[data-x]').forEach(inp => inp.onchange = () => {
      const [i, c] = inp.dataset.x.split(':'), ex = copia(jOf(st.jefe).extras || []); if (!ex[+i]) return;
      if (c === 'tinte') ex[+i].tinte = deHex(inp.value);
      else if (c === 'sintinte') { if (inp.checked) delete ex[+i].tinte; else ex[+i].tinte = 0xffffff; }
      else if (c === 'suma') ex[+i].suma = inp.checked;
      else if (c === 'lado') { if (inp.value === 'auto') delete ex[+i].lado; else ex[+i].lado = inp.value; }
      else ex[+i][c] = inp.value;
      tocarJefe(st.jefe, 'extras', ex); pintar();
    });
    p.querySelectorAll('[data-c2]').forEach(inp => inp.onchange = () => {
      const capas = capasDe(st.hab), cp = capas[st.capa]; if (!cp) return;
      const c = inp.dataset.c2; cp[c] = c === 'tin' ? deHex(inp.value) : inp.value;
      if (c === 'lado') { delete cp.detras; if (inp.value === 'auto') delete cp.lado; }
      if (c === 'ef' && /^@onda:/.test(cp.ef)) { if (cp.radio == null) cp.radio = 80; if (cp.dura == null) cp.dura = 400; }
      if (c === 'ef' && cp.ef === '@temblor') { if (cp.dura == null) cp.dura = 200; if (cp.fuerza == null) cp.fuerza = 0.01; }
      tocarHeroe(st.hab, capas); pintar();
    });
    p.querySelectorAll('[data-p]').forEach(inp => inp.onchange = () => {
      const key = PROY_DE[st.hab]; if (!key) return;
      const a = AJ.proyectiles[key] = AJ.proyectiles[key] || {};
      if (inp.value === PROY[key][1]) delete a.ef; else a.ef = inp.value;
      guardar(); pintar();
    });
    p.querySelectorAll('[data-c3]').forEach(inp => inp.onchange = () => {
      const capas = capasDe(st.hab), cp = capas[st.capa]; if (!cp) return;
      const c = inp.dataset.c3;
      if (c === 'sintin') { if (inp.checked) delete cp.tin; else cp.tin = 0xffffff; } else cp[c] = inp.checked;
      tocarHeroe(st.hab, capas); pintar();
    });
    p.querySelectorAll('[data-c]').forEach(inp => inp.onchange = () => {
      const c = inp.dataset.c;
      if (c === 'j:sello') { tocarJefe(st.jefe, 'sello', inp.checked); return; }
      st[c] = inp.checked;
      if (c === 'invencible' && window.CK_PANEL_PRUEBAS) CK_PANEL_PRUEBAS.st.invencible = inp.checked;
      if (c === 'soloTiene') { VP.t = 0; VP.cuadro = null; pintar(); }
    });
    p.querySelectorAll('[data-t]').forEach(t => t.oninput = () => {
      const g = t.dataset.t, v = t.value;
      if (g === 'g') AJ.notas = v;
      else if (g === 'j') { AJ.jefes[st.jefe] = Object.assign(AJ.jefes[st.jefe] || {}, { notas: v }); }
      else if (g === 'h') { AJ.heroes[st.hab] = Object.assign(AJ.heroes[st.hab] || {}, { notas: v }); if (!AJ.heroes[st.hab].capas) { /* sólo notas: la habilidad queda como está */ } }
      else if (g === 'e') { AJ.efectos[st.ef] = Object.assign(AJ.efectos[st.ef] || {}, { notas: v }); }
      else if (g === 's') { AJ.estados[st.est] = Object.assign(AJ.estados[st.est] || {}, { notas: v }); }
      else if (g === 'o') { const k = st.jefeTipo + ':' + st.jefeHab; AJ.otras[k] = Object.assign(AJ.otras[k] || {}, { notas: v }); if (!v) delete AJ.otras[k]; }
      guardar();
    });
    p.querySelectorAll('[data-nv]').forEach(b => b.onclick = e => { e.stopPropagation(); formNueva(b.dataset.nv); });
    p.querySelectorAll('[data-a]').forEach(b => b.onclick = e => {
      e.stopPropagation();
      const S2 = escena(); if (!S2) return;
      const a = b.dataset.a, i = +b.dataset.i;
      if (a === 'cerrar') return alternar(false);
      if (a === 'nueva-hab') return formNueva(null);
      if (a === 'probar') { if (VP.full) pantallaCompleta(false, true); probar(S2, false); mirarJuego(st.tab === 'jefes' ? (habSel() ? habSel().ms : 3000) + 1100 : st.tab === 'estados' ? 4200 : 2600); }
      if (a === 'leer') { leerJefe(S2); pintar(); }
      if (a === 'leer-a') { const k = st.tab === 'heroes' ? st.hab + ':' + VP.mira : st.jefeHab; delete LECT_A[k]; delete intentosA[k]; FONDO = null; pintar(); }
      if (a === 'k-fuera') { const k = b.dataset.k; if (capaLeida(k)) { const ed = edCap(k); ed.fuera = !ed.fuera; st.capJ = k; limpiarCap(); guardar(); pintar(); } }
      if (a === 'k-volver') { const A = AJ.capasJ[claveJefe()]; if (A) { delete A[st.capJ]; limpiarCap(); guardar(); pintar(); } }
      if (a === 'k-todo') { if (!b.dataset.ok) { b.dataset.ok = 1; b.textContent = '¿Seguro? Clic otra vez'; return; } delete AJ.capasJ[claveJefe()]; guardar(); pintar(); }
      if (a === 'solo') probar(S2, true);
      if (a === 'repetir') { st.repetir = st.repetir ? 0 : 1; pintar(); }
      if (a === 'traer') traerJefe(S2);
      if (a === 'ver') verJefe(S2);
      if (a === 'munieco') munieco(S2);
      if (a === 'limpiar') quitarPrueba(S2);
      if (a === 'marcar-jefe') { st.marcar = st.marcar ? null : { tipo: 'jefe' }; pintar(); }
      if (a === 'marcar-capa') { st.marcar = st.marcar ? null : { tipo: 'capa' }; pintar(); }
      if (a === 'marcar-proy') { st.marcar = st.marcar ? null : { tipo: 'proy' }; pintar(); }
      if (a === 'x-sumar') { const ex = copia(jOf(st.jefe).extras || []); ex.push({ efecto: 'chispa_rayo', retraso: 0, donde: 'golpe', escala: 1, dx: 0, dy: 0, suma: true }); tocarJefe(st.jefe, 'extras', ex); pintar(); }
      if (a === 'x-quitar') { const ex = copia(jOf(st.jefe).extras || []); ex.splice(i, 1); tocarJefe(st.jefe, 'extras', ex); pintar(); }
      if (a === 'restaurar-j') { const n = AJ.jefes[st.jefe] && AJ.jefes[st.jefe].notas; delete AJ.jefes[st.jefe]; if (n) AJ.jefes[st.jefe] = { notas: n }; aplicarJefe(st.jefe); guardar(); pintar(); }
      if (a === 'capa') { st.capa = i; pintar(); }
      if (a === 'subir' || a === 'bajar') { const c = capasDe(st.hab), j = a === 'subir' ? i - 1 : i + 1; if (j < 0 || j >= c.length) return; [c[i], c[j]] = [c[j], c[i]]; st.capa = j; tocarHeroe(st.hab, c); pintar(); }
      if (a === 'c-quitar') { const c = capasDe(st.hab); c.splice(i, 1); st.capa = Math.max(0, Math.min(st.capa, c.length - 1)); tocarHeroe(st.hab, c); pintar(); }
      if (a === 'c-sumar') { const c = capasDe(st.hab); c.push(C('golpe', { en: 'centro', ad: 30, esc: 1 })); st.capa = c.length - 1; tocarHeroe(st.hab, c); pintar(); }
      if (a === 'restaurar-h') { const n = AJ.heroes[st.hab] && AJ.heroes[st.hab].notas; delete AJ.heroes[st.hab]; if (n) AJ.heroes[st.hab] = { notas: n }; delete AJ.proyectiles[PROY_DE[st.hab]]; aplicarHeroe(st.hab); guardar(); pintar(); }
      if (a === 'restaurar-s') { const n = AJ.estados[st.est] && AJ.estados[st.est].notas; delete AJ.estados[st.est]; if (n) AJ.estados[st.est] = { notas: n }; aplicarEstado(st.est); guardar(); pintar(); }
      if (a === 'restaurar-e') { const n = AJ.efectos[st.ef] && AJ.efectos[st.ef].notas; delete AJ.efectos[st.ef]; if (n) AJ.efectos[st.ef] = { notas: n }; aplicarEfecto(st.ef); guardar(); pintar(); }
      if (a === 'exportar') exportar(true);
      if (a === 'copiar') exportar(false);
      if (a === 'importar') importar();
      if (a === 'borrar-todo') { if (!confirmar(b)) return; const viejo = AJ; AJ = { version: 1, efectos: {}, jefes: {}, heroes: {}, proyectiles: {}, estados: {}, marcas: viejo.marcas || [], tipos: {}, especiales: {}, fases: {}, otras: viejo.otras || {}, roles: {}, capasJ: {}, notas: viejo.notas || '' }; Object.keys(viejo.tipos || {}).forEach(aplicarTipo); Object.keys(viejo.roles || {}).forEach(aplicarRol); Object.keys(viejo.especiales || {}).forEach(aplicarEsp); Object.keys(viejo.fases || {}).forEach(aplicarFase); Object.keys(viejo.efectos).forEach(aplicarEfecto); Object.keys(viejo.jefes).forEach(aplicarJefe); Object.keys(viejo.heroes).forEach(aplicarHeroe); Object.keys(viejo.estados || {}).forEach(aplicarEstado); guardar(); pintar(); }
      try { b.blur(); const pn = document.getElementById('ckeh'); if (pn && st.abierto) pn.focus({ preventScroll: true }); } catch (er) {}
    });
  };
  // "▶ en el juego": el editor se aparta (casi transparente, sin tapar los clics) mientras se ve la prueba; un clic o Esc lo trae
  let tMirar = 0;
  const mirarJuego = ms => {
    const p = document.getElementById('ckeh'); if (!p) return;
    const volver = () => { clearTimeout(tMirar); p.classList.remove('mirando'); window.removeEventListener('pointerdown', volver, true); window.removeEventListener('keydown', volver, true); };
    clearTimeout(tMirar); p.classList.add('mirando'); tMirar = setTimeout(volver, ms);
    setTimeout(() => { window.addEventListener('pointerdown', volver, true); window.addEventListener('keydown', volver, true); }, 300);
  };
  // "Borrar todo" pide un segundo clic (sin ventanas del navegador)
  const confirmar = b => { if (b.dataset.ok) return true; b.dataset.ok = 1; b.textContent = '¿Seguro? Clic otra vez'; setTimeout(() => { if (b) { delete b.dataset.ok; b.textContent = 'Borrar todos los cambios'; } }, 3000); return false; };

  // ---------------------------------------------------------------- pasarlo: exportar, copiar, importar
  const paquete = () => {
    const J = JP(), out = { juego: 'Valcairn', que: 'ajustes de habilidades (editor F6)', fecha: new Date().toISOString(), version: 1,
      notas: AJ.notas || '', jefes: {}, heroes: {}, proyectiles: AJ.proyectiles, efectos: AJ.efectos, estados: {},
      marcas: (AJ.marcas || []).map(m => ({ id: m.id, donde: m.nombre, tab: m.tab, clave: m.clave, momento_s: +(m.t / 1000).toFixed(2), mira: m.mira, tipo: tipoN(m.tipo), texto: m.texto,
        trazos: m.trazos, fecha: m.fecha, foto: m.foto })) };
    Object.keys(AJ.estados || {}).forEach(k => { out.estados[k] = Object.assign({ nombre: NOM_EST[k] || k, hoja_original: DEF_EST[k] && DEF_EST[k].fx }, AJ.estados[k]); });
    out.jefes_numeros = {}; Object.keys(AJ.tipos || {}).forEach(t => { out.jefes_numeros[t] = Object.assign({ nombre: nomTipo(t), antes: DEF_TIPO[t] }, AJ.tipos[t]); });
    out.jefes_especiales = {}; Object.keys(AJ.especiales || {}).forEach(id => { out.jefes_especiales[id] = Object.assign({ antes: DEF_ESP[id] }, AJ.especiales[id]); });
    out.jefes_fases = {}; Object.keys(AJ.fases || {}).forEach(n => { out.jefes_fases[n] = Object.assign({ antes: DEF_FASE[n] }, AJ.fases[n]); });
    out.enemigos_roles = {}; Object.keys(AJ.roles || {}).forEach(n => { out.enemigos_roles[n] = Object.assign({ antes: DEF_ROL[n] }, AJ.roles[n]); });
    out.jefes_capas = {}; Object.keys(AJ.capasJ || {}).forEach(k => {
      const [t, id] = k.split(':'), h = habsDe(t).find(x => x.id === id), C = LECT[k], A = AJ.capasJ[k];
      out.jefes_capas[k] = { nombre: (NOMBRE_JEFE[t] || nomTipo(t)) + ' · ' + (h ? h.n : id), capas: Object.keys(A).map(key => {
        const L = C && C.capas.find(x => x.key === key), i = C ? C.capas.indexOf(L) : -1;
        return Object.assign({ capa: key, numero: i >= 0 ? i + 1 : undefined, nombre: L ? L.nombre + (L.n > 1 ? ' ×' + L.n : '') : undefined, funcion: L ? L.fn : undefined, archivo: L ? L.arch + ':' + L.lin : undefined,
          en_el_juego: L ? { nace_ms: Math.round(L.nace), dura_ms: Math.round(vidaCapa(L)), x: Math.round(L.ax), y: Math.round(L.ay), cantidad: L.n } : undefined }, A[key]);
      }) };
    });
    out.jefes_notas = {}; Object.keys(AJ.otras || {}).forEach(k => { const [t, id] = k.split(':'), h = habsDe(t).find(x => x.id === id); out.jefes_notas[k] = Object.assign({ nombre: (NOMBRE_JEFE[t] || t) + ' · ' + (h ? h.n : id) }, AJ.otras[k]); });
    Object.keys(AJ.jefes).forEach(k => { out.jefes[k] = Object.assign({ nombre: J && J.DEF[k] ? NOMBRE_JEFE[J.DEF[k].jefe] + ' · ' + J.DEF[k].nombre : k }, AJ.jefes[k]); });
    Object.keys(AJ.heroes).forEach(k => { out.heroes[k] = Object.assign({ nombre: nombreHab(k), heroe: heroeDe(k) }, AJ.heroes[k]); });
    out.habilidades_nuevas = (AJ.nuevas || []).map(n => Object.assign({ quien: nomQuien(n.para) }, n));
    return JSON.stringify(out, null, 1);
  };
  const exportar = bajar => {
    const t = paquete();
    const aMano = () => { try { const x = document.createElement('textarea'); x.value = t; x.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(x); x.select(); document.execCommand('copy'); x.remove(); } catch (e) {} };
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(aMano); else aMano(); } catch (e) { aMano(); }
    if (bajar) {
      try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'application/json' })); a.download = 'ajustes_habilidades.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); avisar('bajado ✓ (y copiado)'); } catch (e) { avisar('no se pudo bajar'); }
    } else avisar('copiado ✓');
  };
  const importar = () => {
    const p = document.getElementById('ckeh'); if (!p) return;
    const caja = document.createElement('div');
    caja.innerHTML = `<h3>IMPORTAR</h3><textarea id="ckeh-imp" style="min-height:90px" placeholder="Pegá acá el archivo de ajustes"></textarea><div class="fila"><button data-i="ok">Cargar</button><button class="sec" data-i="no">Cancelar</button></div>`;
    const der = document.getElementById('ckeh-der') || p; der.appendChild(caja); der.scrollTop = der.scrollHeight;
    caja.querySelector('[data-i=no]').onclick = e => { e.stopPropagation(); caja.remove(); };
    caja.querySelector('[data-i=ok]').onclick = e => {
      e.stopPropagation();
      try {
        const o = JSON.parse(document.getElementById('ckeh-imp').value);
        ['efectos', 'jefes', 'heroes', 'proyectiles', 'estados'].forEach(g => { AJ[g] = AJ[g] || {}; Object.keys(o[g] || {}).forEach(k => { const v = Object.assign({}, o[g][k]); delete v.nombre; delete v.heroe; delete v.hoja_original; AJ[g][k] = v; }); });
        [['jefes_numeros', 'tipos'], ['jefes_especiales', 'especiales'], ['jefes_fases', 'fases'], ['jefes_notas', 'otras'], ['enemigos_roles', 'roles']].forEach(([de, a]) => { AJ[a] = AJ[a] || {}; Object.keys(o[de] || {}).forEach(k => { const v = Object.assign({}, o[de][k]); delete v.nombre; delete v.antes; AJ[a][k] = v; }); });
        Object.keys(o.jefes_capas || {}).forEach(k => { AJ.capasJ[k] = AJ.capasJ[k] || {}; (o.jefes_capas[k].capas || []).forEach(c => { const v = Object.assign({}, c); ['capa', 'numero', 'nombre', 'funcion', 'archivo', 'en_el_juego'].forEach(x => delete v[x]); if (c.capa) AJ.capasJ[k][c.capa] = v; }); });
        (o.marcas || []).forEach(m => { AJ.marcas = AJ.marcas || []; if (AJ.marcas.some(x => String(x.id) === String(m.id))) return;
          AJ.marcas.push({ id: m.id || Date.now() + Math.random(), tab: m.tab, clave: m.clave, nombre: m.donde || m.nombre, t: Math.round((m.momento_s || 0) * 1000), mira: m.mira, tipo: (TIPOS_N.find(x => x[1] === m.tipo || x[0] === m.tipo) || ['otro'])[0], texto: m.texto || '', trazos: m.trazos || [], foto: m.foto || null, fecha: m.fecha }); });
        if (o.notas) AJ.notas = o.notas;
        (o.habilidades_nuevas || []).forEach(n => { AJ.nuevas = AJ.nuevas || []; if (n && n.id && !AJ.nuevas.some(x => x.id === n.id)) AJ.nuevas.push(n); });
        aplicarTodo(); guardar(); pintar(); avisar('cargado ✓');
      } catch (er) { avisar('ese texto no es un archivo de ajustes'); }
    };
  };

  // ---------------------------------------------------------------- abrir y cerrar
  const armar = () => {
    if (document.getElementById('ckeh')) return;
    const w = document.getElementById('game-wrapper') || document.body;
    const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    const b = document.createElement('div'); b.id = 'ckeh-boton'; b.textContent = 'HABILIDADES · F6'; w.appendChild(b);
    const p = document.createElement('div'); p.id = 'ckeh'; w.appendChild(p);
    b.addEventListener('click', e => { e.stopPropagation(); alternar(); });
    p.tabIndex = -1;
    p.addEventListener('keydown', e => {                          // N: marcar una nota; Esc: cancelarla
      const escribe = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
      if (e.key === 'Escape' && VP.nota) { e.preventDefault(); notaModo(false); }
      else if (!escribe && (e.key === 'n' || e.key === 'N') && st.tab !== 'notas') { e.preventDefault(); notaModo(!VP.nota); }
    });
    p.addEventListener('pointerdown', e => { if (!/INPUT|TEXTAREA|SELECT|BUTTON|OPTION/.test(e.target.tagName)) try { p.focus({ preventScroll: true }); } catch (er) {} });
    ['keydown', 'keyup', 'keypress'].forEach(t => p.addEventListener(t, e => e.stopPropagation()));
    ['pointerdown', 'mousedown', 'wheel'].forEach(t => p.addEventListener(t, e => e.stopPropagation()));
  };
  const alternar = q => {
    const S = escena(); if (!S || (!puede(S) && q !== false)) return;
    armar(); st.abierto = q === undefined ? !st.abierto : q;
    if (!st.abierto) { st.marcar = null; st.repetir = 0; if (VP.nota) notaModo(false); if (VP.full) pantallaCompleta(false); try { S.game.canvas.focus(); } catch (e) {} }
    else {
      if (HEROES[S.playerHero] && st.heroe !== S.playerHero) { st.heroe = S.playerHero; if (!HEROES[st.heroe][1].includes(st.hab)) { st.hab = HEROES[st.heroe][1][0]; st.capa = 0; } }   // abre en el héroe que estás usando
      if (st.invencible && window.CK_PANEL_PRUEBAS) CK_PANEL_PRUEBAS.st.invencible = true;
    }
    const p = document.getElementById('ckeh'); if (!p) return;
    if (st.abierto) pintar();
    p.classList.toggle('on', st.abierto);
    if (st.abierto) try { p.focus({ preventScroll: true }); } catch (e) {}
  };
  window.addEventListener('keydown', e => { if (e.key === 'F6') { e.preventDefault(); alternar(); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', armar); else armar();

  // ---------------------------------------------------------------- cada cuadro: proyectiles, la cruz, repetir, el botón
  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try {
      engancharProy(this);
      calmar(this);
      if (!VP.tiposOk && this.gameStarted) { VP.tiposOk = true; try { aplicarJefesTodo(); } catch (e) {} }
      if (st.abierto && !puede(this)) alternar(false);              // se salió de la práctica: se cierra
      if (st.abierto) {
        cruz(this);
        if (st.repetir && this.time.now > (st.proxima || 0)) { st.proxima = this.time.now + (st.tab === 'jefes' ? 4200 : 2600); probar(this, false); }
      } else if (this._ckEdCruz) this._ckEdCruz.clear();
      const b = document.getElementById('ckeh-boton');
      if (b) b.classList.toggle('on', puede(this) && !this.dialogOpen);
    } catch (e) {}
    return r;
  };
  // para las pruebas: dónde está cada manija y cada barra en la pantalla
  const enPantalla = () => {
    const c = document.getElementById('ckeh-lienzo'), t = document.getElementById('ckeh-tiempo'), K = VP.K, E = VP.esc; if (!c || !K || !E) return null;
    const r = c.getBoundingClientRect(), rt = t.getBoundingClientRect();
    return { man: E.man.map(m => ({ tipo: m.tipo, ci: m.ci, x: r.left + K.X(m.x), y: r.top + K.Y(m.y) })), lienzo: { x: r.left, y: r.top, w: r.width, h: r.height },
      barras: (VP.barras || []).map(b => ({ x: rt.left + b.x0 + 4, y: rt.top + (b.y0 + b.y1) / 2, x0: rt.left + b.x0, x1: rt.left + b.x1, izq: b.izq, der: b.der, cortes: b.e.cortes, drag: b.e.drag, t0: b.e.t0, dur: b.e.dur, k: b.e.k })), tiempo: { x: rt.left, y: rt.top, w: rt.width, h: rt.height }, ms: VP.TX ? px => VP.TX.X(px) : null, total: VP.total };
  };
  aplicarTodo();
  window.CK_EDITOR_HAB = { st, GRABS: LECT, LECT, LECT_A, fondo: () => FONDO, habsDe, ORDEN_JEFES, AJ: () => AJ, DESP, HEROES, PROY, alternar, pintar, probar, exportar: paquete, aplicarTodo, VP, enPantalla, TX: () => VP.TX };
})();
