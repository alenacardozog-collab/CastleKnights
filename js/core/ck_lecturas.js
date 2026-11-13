'use strict';
/* Notas y libros que se abren para leer (11/11, pedidos del dueño: "cuando agarremos notas o libros se abra una nota o libro para
   leer el contenido"; "las notas pueden estar en cofres regados por el mapa y los libros en lugares más habitados o interiores";
   "y siempre dan pistas o información sobre el lore, a veces entre NPC de lo que piensan o cosas así").
   - EL LECTOR: una NOTA es un pergamino suelto con su sello; un LIBRO se abre en dos páginas y se hojea con ← → (o haciendo
     clic en las esquinas), con el ruido de la hoja. T, ENTER o ESC lo cierran. El mundo queda en pausa mientras leés.
   - NOTAS EN LOS COFRES: al abrir un cofre sale una nota. Si el lugar tiene su nota (las de ck_notas.js), sale esa y ya no
     aparece tirada en el piso; si no, sale una de las notas sueltas de abajo (pensamientos de la gente, cartas, listas).
     Las notas del piso que quedan (lugares sin cofres) también se abren en el lector.
   - LIBROS EN LOS INTERIORES: biblioteca, aposentos del Rey, salón del trono, taberna, almacén, herrería y cocina tienen un libro
     apoyado en algún rincón (brilla de vez en cuando hasta que lo leés). T · Leer.
   - LIBROS DE LA HISTORIA: el Libro del Sello y el Códice de las Brumas se abren solos al conseguirlos.
   - Todo lo leído queda en el inventario (M → Inventario → "Notas y libros") para volver a leerlo.
   Se guarda en story.flags.lecturas (leídos), notas_cofre (qué nota salió de qué cofre) y libros_pos.
   Borrar su línea de index.html: las notas vuelven al cuadro de diálogo y los libros nuevos no aparecen. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const ESCENA = () => window.activeGameScene || (window.game && window.game.scene && window.game.scene.scenes.find(s => s.startCampaign));
  const son = (k, v, o) => { try { return typeof sfx !== 'undefined' && sfx.fx(k, v, o); } catch (e) { return false; } };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const st = S => (S && S._gameMode === 'campaign' && S.story) || null;
  const fl = s => (s.flags = s.flags || {});

  // ================================================================== los textos
  // notas sueltas: salen de los cofres de los lugares que no tienen nota propia (o cuando la propia ya salió)
  const NOTAS_COFRE = [
    { id: 'nc_mercader', t: 'Carta de un mercader', de: 'Tomás, el mercader', l: [
      '«Mira: si leés esto, ya sé que revolviste el cofre. No vayas al camino del norte. Las caravanas ya ni lo nombran.»',
      '«En la Frontera la sal vale el triple y los soldados pagan con promesas. Si me pasa algo, el libro de cuentas está en el almacén. Ahí también anoté quién me debe.»',
      '«Y no le hagas caso al buhonero Ruy. Dice que vio luces que cantan. Ruy ve de todo después de la tercera jarra.»'] },
    { id: 'nc_guardia', t: 'Pensamientos de un guardia', de: 'un guardia de la muralla', l: [
      'Tercera noche de guardia en la muralla. Desde acá arriba se ve todo el este.',
      'Hay una luz verde, quieta, donde dicen que está el monolito. No parpadea como un fuego. Late, como un corazón.',
      'El Capitán dice que es un fuego de orcos. Yo no le conté que la luz se apagó justo cuando dejé de mirarla.'] },
    { id: 'nc_herrero', t: 'Recibo de la herrería', de: 'Berto, el herrero', l: [
      '«Una (1) llave de hierro negro, para el portón de la Frontera. Encargo de la Corona. Pagada.»',
      'Debajo, con carbón y letra apurada: «Hice UNA sola. El molde lo rompí yo mismo. ¿Entonces de dónde sacó otra el encapuchado que vi salir por el portón?»'] },
    { id: 'nc_aby', t: 'Una carta sin destinatario', de: 'Aby', l: [
      '«No sé a quién le escribo. Capaz a vos, abuela, aunque ya no estés para leer.»',
      '«En Brumavieja la niebla no entró de golpe. Primero se callaron los perros. Después los grillos. Después la gente empezó a caminar dormida hacia el cementerio.»',
      '«Yo no me dormí. Por eso estoy acá. A veces pienso que hubiera sido más fácil.»'] },
    { id: 'nc_gorak', t: 'Marcas en un cuero', de: 'Gorak', l: [
      'Marcas de orco, torcidas, como de alguien que aprendió a escribir de grande.',
      '«Grushak dice: la voz verde da fuerza. Gorak dice: la voz verde da hambre. Gorak lo dijo en voz alta. Ahora Gorak come solo.»',
      '«Si un humano lee esto: el campeón Gorvak pelea con el escudo, pero mira siempre al jefe antes de pegar. El jefe le dice cuándo.»'] },
    { id: 'nc_oswin', t: 'Una oración copiada', de: 'el Padre Oswin', l: [
      '«Lo que no muere, se ata. Lo que se ata, se nombra. Lo que se nombra, se va.»',
      'En el margen: «Para el que tenga que usar el Libro del Sello: no alcanza con pegarle. Cuando caiga de rodillas, leé. Y no tardes, que no se queda abajo mucho tiempo.»'] },
    { id: 'nc_contrabando', t: 'Lista de un contrabandista', de: 'alguien sin nombre', l: [
      '«Sal, 4 bolsas. Hierro, 2 barras. Vino del sur, 1 tonel (para el sargento, así no mira).»',
      '«Si la barricada del paso está cerrada: por las galerías de la cueva se llega igual. Llevar antorcha. Y no tocar las paredes que brillan.»'] },
    { id: 'nc_pastor', t: 'Hoja de un pastor', de: 'Anselmo, el pastor', l: [
      '«Anoche la niebla me dijo mi nombre. Con la voz de mi hermana, que se murió hace diez inviernos.»',
      '«No fui. Me até al poste del corral con la soga de las ovejas. Si alguien encuentra esto y yo no estoy, no sigan las luces. Las luces mienten.»'] },
    { id: 'nc_lancent', t: 'Una nota arrugada', de: 'Lancent', l: [
      '«Cosas que no le voy a contar a nadie: 1. Le tengo miedo a la oscuridad. 2. El escudo de mi viejo me queda grande. 3. Ninguna de las anteriores.»',
      '«Mañana, de nuevo adelante. Si voy adelante nadie me ve la cara.»'] },
    { id: 'nc_horos', t: 'Apuntes de Horos', de: 'Horos', l: [
      '«El monolito no es una piedra: es una cerradura con tres guardas. Tres cristales la cierran: el verde, el de sangre y el de escarcha.»',
      '«El verde lo tiene lo que mandó en la niebla. El de escarcha, más allá del paso del norte, donde la princesa sueña con torres. El de sangre… todavía no sé. Me da miedo saber.»'] },
    { id: 'nc_mira', t: 'Una carta doblada en cuatro', de: 'Mira', l: [
      '«Papá: ya sé que me vas a retar. Fui hasta el campo del oeste a buscar a los de la aldea. No encontré a nadie, pero encontré huellas que van hacia Brumavieja y vuelven. Solas. Sin nadie que las haga.»',
      '«Le avisé al Capitán. Me dijo que me quede en casa. Me quedé en casa. Bueno, más o menos.»'] }
  ];
  // libros de los interiores
  const LIBROS = [
    { id: 'lb_cronica', zona: 'ed_biblioteca.main', t: 'Crónica del Reino del Roble', autor: 'Maestre Eloy', color: '#7a2418', p: [
      'Antes del Roble no había reino: había un bosque, un río y una piedra verde que los viejos no nombraban.',
      'Cuentan que una noche la piedra se abrió como un ojo, y del otro lado salió el Abismo. No era fuego ni agua: era hambre.',
      'Tres guerreros lo empujaron de vuelta y cerraron la piedra con tres cristales. Uno se quedó a cuidarla. Los otros dos se llevaron los cristales lejos, para que nadie pudiera juntarlos.',
      'Sobre el lugar donde descansaron levantaron el castillo. Por eso el Roble mira al este: para no perder de vista la piedra.',
      'Nota al margen, letra de Eloy: «Varek me preguntó una vez dónde estaban los cristales. Le dije que era una leyenda. Ojalá le hubiera mentido mejor.»'] },
    { id: 'lb_nieblas', zona: 'ed_biblioteca.main', t: 'Tratado de las nieblas', autor: 'Maestre Eloy', color: '#2f4f7a', p: [
      'De las nieblas comunes no hay que temer nada. De la niebla que baja del norte en verano, sí.',
      'Esta niebla no moja. Llama. Usa las voces de los que uno quiere, y casi siempre las de los muertos.',
      'Quien la sigue camina dormido hasta un lugar donde la tierra está floja: un cementerio, una ruina, un pozo viejo. Ahí la niebla se queda con algo. A veces devuelve el resto.',
      'Remedios: atarse, cantar fuerte, la ruda macho colgada en la puerta. Y la luz: la niebla no entra donde arde un fuego que alguien cuida.'] },
    { id: 'lb_aldric', zona: 'ed_aposentos_del_rey.main', t: 'Diario del Rey', autor: 'Aldric', color: '#4a2a6a', p: [
      'Lía volvió a soñar con las torres de hielo. Dice que alguien la llama desde arriba, con una voz que no es de hombre ni de mujer.',
      'Bruno quiere mandar soldados al norte. No tengo soldados para mandar. Tengo una muralla vieja, un portón y una llave.',
      'Varek era el mejor alumno que tuvo Eloy. Yo mismo le di permiso para entrar en la biblioteca de noche. Si lo que temo es cierto, la niebla entró al reino por la puerta que le abrí yo.',
      'Hoy llegó un forastero. Tiene la mirada de los que no saben que van a ser importantes. Ojalá esté a la altura. Ojalá yo también.'] },
    { id: 'lb_gestas', zona: 'ed_salon_del_trono_3.main', t: 'Las gestas de los Tres', autor: 'cantado por los juglares', color: '#8a6a1a', p: [
      'Canto primero: el del escudo, que no retrocedía. Decían que dormía parado para no tener que levantarse.',
      'Canto segundo: la de las dagas, que peleaba sin hacer ruido. Nadie la vio llegar, y nadie la vio irse.',
      'Canto tercero: el de las estrellas, que leía el cielo como un libro. Fue el que entendió que la piedra no se podía romper: sólo cerrar.',
      'Los juglares dicen que los Tres vuelven cuando la piedra se abre. Los viejos dicen que los juglares dicen cualquier cosa por una jarra.'] },
    { id: 'lb_cancionero', zona: 'ed_taberna_2.main', t: 'Cancionero de la taberna', autor: 'varios borrachos', color: '#6a3a1a', p: [
      '«Si la niebla te llama / no le contestes, hermano / que la niebla no tiene / ni corazón ni mano.» (copla de Anselmo)',
      '«Grushak tiene un hacha / tan grande como un portón / y le habla una piedra / que le come el corazón.» (anónima, tachada por el posadero)',
      'Anotado abajo, por el posadero: «Prohibido cantar la del Rey después de medianoche. Prohibido apostar a cuántos orcos baja el forastero. (Yo digo seis.)»'] },
    { id: 'lb_cuentas', zona: 'ed_tienda_de_viveres.main', t: 'Libro de cuentas del almacén', autor: 'Tomás', color: '#3a5a2a', p: [
      'Ruy el buhonero: debe 4 de bronce y una explicación por las velas que «se le cayeron al río».',
      'La Abuela Mirta: paga siempre con tortas fritas. No me quejo.',
      'Mira: se llevó pan, una soga y una lámpara. Dijo «para el campo». No volvió a la hora de la cena.',
      'Un encapuchado, el mes pasado: compró toda la ruda que tenía. Toda. Y pagó con una moneda que no es de este reino.'] },
    { id: 'lb_herrero', zona: 'ed_herreria.main', t: 'Manual del herrero', autor: 'Berto', color: '#4a4a52', p: [
      'Una piedra de afilar bien usada le saca un golpe más a cualquier espada. Dos piedras, dos golpes. Más de dos, y la hoja se quiebra.',
      'El hierro negro no se forja: se convence. Hay que calentarlo de noche y enfriarlo en agua de pozo viejo. No sé por qué funciona. Funciona.',
      'Una llave de hierro negro abre lo que fue cerrado con hierro negro. Por eso el portón de la Frontera y la jaula de la fortaleza orca tienen la misma cerradura. Eso no lo sabe nadie. Bueno, ahora vos.'] },
    { id: 'lb_recetas', zona: 'ed_cocina_real.main', t: 'Recetario de la cocinera', autor: 'Doña Pepa', color: '#8a3a2a', p: [
      'Guiso de lentejas para la guardia: lentejas, chorizo, paciencia. Al Capitán Bruno, doble, que después no rinde.',
      'Dulce de leche para la princesa Lía. Desde que sueña con torres no lo prueba. Le pongo canela igual, por si un día vuelve el hambre.',
      'El joven Varek comía de noche, solo, en la punta de la mesa. Siempre pedía pan negro y nunca lo terminaba. Lo dejaba sobre los libros, «para que no se vuelen las hojas».'] },
    { id: 'lb_aldea', zona: 'village', t: 'Registro de la aldea', autor: 'el alcalde', color: '#5a4a2a', p: [
      'Vecinos de la Aldea del Roble: ciento doce. Ovejas: cuatrocientas, más o menos. Gatos: uno, Garufa, que no es de nadie y es de todos.',
      'Anoche faltaron tres vecinos. Salieron al campo del oeste detrás de unas luces. El Capitán dice que manda a alguien.',
      'Se pide a los vecinos no dejar los fogones apagados de noche. Los viejos dicen que la niebla no entra donde arde un fuego que alguien cuida.'] }
  ];
  // los libros de la historia (los dan ck_libro_sello.js y ck_historia.js)
  const HISTORIA = {
    sello: { id: 'lb_sello', t: 'Libro del Sello', autor: 'la orden de Oswin', color: '#8a6a1a', p: [
      'Lo que ya está muerto no se mata. Se ata.',
      'Cuando el que no muere caiga de rodillas —y caerá, porque hasta lo muerto se cansa—, el portador del Sello se le acerca y lee. MANTENÉ la lectura (T) sin soltarla.',
      'Las letras se encienden una por una. Si el portador se distrae, el muerto se levanta con la mitad de su fuerza. Si termina, el nombre queda atado y la carne se suelta.',
      'Lo que dejó el muerto, guardalo. Lo que guardaba el muerto, también. Ninguna de las dos cosas es tuya.'] },
    codice: { id: 'lb_codice', t: 'Códice de las Brumas', autor: 'desconocido', color: '#3a2a5a', p: [
      'Las primeras páginas están en una lengua que nadie habla. Las letras se mueven cuando no las mirás.',
      '«La piedra es una cerradura. La cerradura tiene tres guardas. El verde se gana con la muerte. El de escarcha se gana con el sueño. El de sangre se gana con la traición.»',
      'Una página arrancada. En la siguiente, con letra humana, temblorosa: «Ya tengo el verde. Lo tuve siempre: era yo. Que me sellen, si pueden. Las otras dos guardas ya están en camino.»',
      'La última página está en blanco. Si la mirás mucho rato, aparece tu nombre.'] }
  };
  const TODOS = {}; NOTAS_COFRE.forEach(n => (TODOS[n.id] = Object.assign({ tipo: 'nota' }, n))); LIBROS.forEach(b => (TODOS[b.id] = Object.assign({ tipo: 'libro' }, b)));
  Object.values(HISTORIA).forEach(b => (TODOS[b.id] = Object.assign({ tipo: 'libro' }, b)));
  // las notas del piso de ck_notas.js también entran al registro
  const notaDeLugar = z => { const N = window.CK_NOTAS && window.CK_NOTAS.NOTAS; return N && N[z] ? { id: 'np_' + z, tipo: 'nota', t: N[z].t, l: N[z].l, de: '' } : null; };
  const obtener = id => TODOS[id] || (id && id.indexOf('np_') === 0 ? notaDeLugar(id.slice(3)) : null);

  // ================================================================== el lector
  const css = `
#ck-lector { position: absolute; inset: 0; z-index: 75; display: none; align-items: center; justify-content: center; background: radial-gradient(ellipse at center, rgba(10,6,4,.55), rgba(4,2,2,.86)); }
#ck-lector.on { display: flex; animation: cklFondo .25s ease-out; }
@keyframes cklFondo { from { opacity: 0; } to { opacity: 1; } }
#ck-lector .ayuda { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); font: 600 15px var(--ck2-f, Grenze, serif); color: #e8d8b8; text-shadow: 0 2px 0 #000; white-space: nowrap; }
#ck-lector .ayuda b { color: #ffd77a; }
/* la nota */
#ck-lector .nota { position: relative; width: min(560px, 88%); max-height: 84%; overflow: auto; padding: 34px 42px 30px; box-sizing: border-box; transform: rotate(-1.2deg);
  background: radial-gradient(ellipse at 30% 20%, #f8ecd0, #ead6a8 60%, #d8bd85); color: #2e1c0e; font-family: var(--ck2-f, Grenze, serif);
  box-shadow: 0 18px 40px rgba(0,0,0,.6), inset 0 0 40px rgba(120,80,30,.35); clip-path: polygon(0 2%, 3% 0, 30% 1.2%, 60% 0, 97% 1%, 100% 4%, 99% 40%, 100% 75%, 98% 100%, 70% 98.6%, 35% 100%, 2% 98.8%, 0 96%, 1% 60%);
  animation: cklNota .35s cubic-bezier(.2,1.2,.4,1); }
@keyframes cklNota { from { transform: rotate(-6deg) translateY(30px) scale(.9); opacity: 0; } to { transform: rotate(-1.2deg); opacity: 1; } }
#ck-lector .nota h2 { margin: 0 0 4px; font-size: 27px; font-weight: 700; color: #4a1a0c; }
#ck-lector .nota .de { font-size: 15px; font-style: italic; color: #7a5a3a; margin-bottom: 14px; }
#ck-lector .nota p { margin: 0 0 12px; font-size: 19px; line-height: 1.38; }
#ck-lector .nota .ckl-sello { position: absolute; right: 22px; bottom: 16px; width: 46px; height: 46px; border-radius: 50% !important; background: radial-gradient(circle at 40% 35%, #d84a3a, #8a1a12 70%); box-shadow: 0 2px 0 rgba(0,0,0,.35), inset 0 0 0 4px rgba(0,0,0,.18); }
#ck-lector .nota .ckl-sello::after { content: '✦'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(255,220,200,.6); font-size: 20px; }
#ck-lector .nota .cuenta { margin-top: 18px; font-size: 14px; color: #8a6a4a; }
/* el libro */
#ck-lector .libro { position: relative; width: min(860px, 94%); aspect-ratio: 16 / 10; max-height: 84%; display: flex; perspective: 1600px; animation: cklLibro .4s cubic-bezier(.2,1.2,.4,1); }
@keyframes cklLibro { from { transform: scale(.85) translateY(30px); opacity: 0; } to { transform: none; opacity: 1; } }
#ck-lector .libro::before { content: ''; position: absolute; inset: -14px -16px -18px; background: var(--tapa, #7a2418); border-radius: 8px; box-shadow: 0 20px 40px rgba(0,0,0,.65), inset 0 0 0 3px rgba(0,0,0,.35), inset 0 0 0 7px rgba(255,220,150,.25); z-index: 0; }
#ck-lector .pag { position: relative; z-index: 1; flex: 1 1 50%; box-sizing: border-box; padding: 34px 36px 40px; overflow: hidden; color: #2e1c0e; font-family: var(--ck2-f, Grenze, serif);
  background: linear-gradient(90deg, #f3e4c2, #f8eed6 70%, #e4cf9e); }
#ck-lector .pag.izq { border-radius: 4px 0 0 4px; background: linear-gradient(270deg, #d9c08a, #f3e4c2 8%, #f8eed6 70%, #efe0bc); }
#ck-lector .pag.der { border-radius: 0 4px 4px 0; background: linear-gradient(90deg, #d9c08a, #f3e4c2 8%, #f8eed6 70%, #efe0bc); }
#ck-lector .pag h2 { margin: 0 0 4px; font-size: 26px; color: #4a1a0c; line-height: 1.1; }
#ck-lector .pag .de { font-size: 14px; font-style: italic; color: #7a5a3a; margin-bottom: 14px; }
#ck-lector .pag p { margin: 0; font-size: 21px; line-height: 1.45; }
body:has(#ck-lector.on) #ck-ayuda, body:has(#ck-lector.on) #ck-nota, body:has(#ck-lector.on) #ck-recoge { display: none !important; }
#ck-lector .pag p::first-letter { font-size: 1.9em; font-weight: 700; color: #7a2418; float: left; line-height: .9; margin: 4px 6px 0 0; }
#ck-lector .pag .num { position: absolute; bottom: 12px; left: 0; right: 0; text-align: center; font-size: 14px; color: #8a6a4a; }
#ck-lector .pag .fin { margin-top: 18px; text-align: center; color: #8a6a4a; font-size: 18px; }
#ck-lector .pag.vacia::after { content: '❦'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 46px; color: rgba(120,80,40,.25); }
#ck-lector .hoja { position: absolute; z-index: 3; top: 0; bottom: 0; width: 50%; transform-origin: left center; left: 50%; background: linear-gradient(90deg, #e4cf9e, #f8eed6); pointer-events: none; backface-visibility: hidden; }
#ck-lector .hoja.va { animation: cklHoja .45s ease-in-out forwards; }
#ck-lector .hoja.vuelve { transform-origin: right center; left: 0; animation: cklHojaV .45s ease-in-out forwards; }
@keyframes cklHoja { from { transform: rotateY(0); } to { transform: rotateY(-180deg); } }
@keyframes cklHojaV { from { transform: rotateY(0); } to { transform: rotateY(180deg); } }
#ck-lector .flecha { position: absolute; z-index: 4; top: 50%; width: 44px; height: 44px; margin-top: -22px; border-radius: 50%; border: 2px solid #1a0f08; background: #f3e4c2; color: #4a1a0c;
  font: 700 24px/40px var(--ck2-f, serif); text-align: center; cursor: pointer; box-shadow: 0 3px 0 rgba(0,0,0,.4); user-select: none; }
#ck-lector .flecha.izq { left: -34px; } #ck-lector .flecha.der { right: -34px; }
#ck-lector .flecha.no { opacity: .25; cursor: default; }
@media (max-width: 700px) { #ck-lector .pag { padding: 18px 16px 30px; } #ck-lector .pag p { font-size: 15px; } #ck-lector .pag h2 { font-size: 19px; } #ck-lector .nota p { font-size: 16px; } }
`;
  let caja = null, actual = null, hoja = 0, alCerrar = null;
  const host = () => document.fullscreenElement || document.getElementById('game-wrapper') || document.body;
  const armar = () => {
    if (!document.getElementById('ckl-css')) { const s = document.createElement('style'); s.id = 'ckl-css'; s.textContent = css; document.head.append(s); }
    if (!caja) { caja = document.createElement('div'); caja.id = 'ck-lector'; caja.addEventListener('pointerdown', e => { if (e.target === caja) cerrar(); }); }
    if (caja.parentElement !== host()) host().appendChild(caja);
  };
  const pintarNota = (x, extra) => {
    caja.innerHTML = `<div class="nota"><h2>${esc(x.t)}</h2>${x.de ? `<div class="de">de ${esc(x.de)}</div>` : '<div class="de">&nbsp;</div>'}` +
      x.l.map(l => `<p>${esc(l)}</p>`).join('') + (extra ? `<div class="cuenta">${esc(extra)}</div>` : '') + '<div class="ckl-sello"></div></div>' +
      '<div class="ayuda"><b>T</b> o <b>ESC</b> para guardar la nota</div>';
  };
  // las páginas del libro, de a dos: la primera izquierda lleva el título
  const paginas = x => [{ titulo: true }].concat(x.p.map(t => ({ t }))).concat([{ fin: true }]);
  const pintarLibro = (x, voltea) => {
    const P_ = paginas(x), n = P_.length, i = hoja * 2;
    const una = (pg, k) => {
      if (!pg) return `<div class="pag ${k} vacia"></div>`;
      const num = `<div class="num">${(P_.indexOf(pg) + 1)}</div>`;
      if (pg.titulo) return `<div class="pag ${k}"><h2>${esc(x.t)}</h2><div class="de">${esc(x.autor || '')}</div><p>${esc(x.p[0] ? '' : '')}</p>${num}</div>`.replace('<p></p>', '');
      if (pg.fin) return `<div class="pag ${k}"><div class="fin">— Fin —</div>${num}</div>`;
      return `<div class="pag ${k}"><p>${esc(pg.t)}</p>${num}</div>`;
    };
    const ult = Math.ceil(n / 2) - 1;
    caja.innerHTML = `<div class="libro" style="--tapa:${x.color || '#7a2418'}">${una(P_[i], 'izq')}${una(P_[i + 1], 'der')}` +
      `<div class="flecha izq${hoja <= 0 ? ' no' : ''}">‹</div><div class="flecha der${hoja >= ult ? ' no' : ''}">›</div>` +
      (voltea ? `<div class="hoja ${voltea}"></div>` : '') + '</div>' +
      `<div class="ayuda"><b>← →</b> pasar la hoja · <b>T</b> o <b>ESC</b> cerrar</div>`;
    caja.querySelector('.flecha.izq').onclick = () => pasar(-1);
    caja.querySelector('.flecha.der').onclick = () => pasar(1);
  };
  const pasar = d => {
    if (!actual || actual.tipo !== 'libro') return;
    const ult = Math.ceil(paginas(actual).length / 2) - 1, h = Math.max(0, Math.min(ult, hoja + d));
    if (h === hoja) return;
    hoja = h; son('page_flip', 0.6, { rate: 0.9 + Math.random() * 0.2 });
    pintarLibro(actual, d > 0 ? 'va' : 'vuelve');
  };
  const cola = [];
  const abrir = (S, x, extra, fin) => {
    if (!x || !S) return false;
    armar();
    if (caja.classList.contains('on')) { if (!cola.some(c => c.x.id === x.id) && (!actual || actual.id !== x.id)) cola.push({ S, x, extra, fin }); return true; }
    if (S._overlay && S._overlay !== 'ck-lector') return false;
    if (!S._overlay && S.openOverlay && !S.openOverlay('ck-lector')) return false;
    actual = x; hoja = 0; alCerrar = fin || null;
    if (x.tipo === 'libro') { pintarLibro(x); son('book_open', 0.6) || son('page_flip', 0.6); }
    else { pintarNota(x, extra); son('page_flip', 0.7); }
    caja.classList.add('on');
    // queda leído
    const s = st(S); if (s) { const f = fl(s); f.lecturas = f.lecturas || {}; if (!f.lecturas[x.id]) { f.lecturas[x.id] = Date.now(); S.saveStory && S.saveStory(); } }
    return true;
  };
  const cerrar = () => {
    if (!caja || !caja.classList.contains('on')) return;
    caja.classList.remove('on'); actual = null;
    const S = ESCENA(); if (S && S._overlay === 'ck-lector' && S.closeOverlay) S.closeOverlay();
    son('book_clasp', 0.4);
    const f = alCerrar; alCerrar = null; if (f) try { f(); } catch (e) {}
    if (cola.length) { const c = cola.shift(); setTimeout(() => esperarLibre(c.S, () => abrir(c.S, c.x, c.extra, c.fin)), 350); }
  };
  // closeOverlay de otro lado (por ejemplo ESC del juego): el lector también se va
  const co0 = P.closeOverlay;
  if (co0) P.closeOverlay = function () { const era = this._overlay === 'ck-lector'; const r = co0.apply(this, arguments); if (era && caja) { caja.classList.remove('on'); actual = null; } return r; };
  window.addEventListener('keydown', e => {
    if (!caja || !caja.classList.contains('on')) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') pasar(1);
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') pasar(-1);
    else if (k === 'Escape' || k === 't' || k === 'T' || k === 'Enter' || k === ' ') cerrar();
    else return;
    e.preventDefault(); e.stopImmediatePropagation();
  }, true);

  // ================================================================== las notas del piso (ck_notas.js) se abren en el lector
  const od0 = P.openDialog;
  P.openDialog = function (name, lines, onEnd, face) {
    try {
      const N = window.CK_NOTAS && window.CK_NOTAS.NOTAS;
      if (N && !face && Array.isArray(lines) && /Notas encontradas/.test(lines[lines.length - 1] || '')) {
        const z = Object.keys(N).find(k => N[k].t === name);
        if (z) { const x = notaDeLugar(z); if (abrir(this, x, lines[lines.length - 1].replace(/[()]/g, ''), onEnd)) return; }
      }
    } catch (e) {}
    return od0.apply(this, arguments);
  };

  // ================================================================== notas en los cofres
  const R = () => window.CK_ROMPIBLES;
  const notaParaCofre = (S, zona) => {
    const s = st(S), f = fl(s), leidas = f.notas || {}, lect = f.lecturas || {};
    if (window.CK_NOTAS && window.CK_NOTAS.NOTAS[zona] && !leidas[zona]) return { x: notaDeLugar(zona), lugar: zona };
    const n = NOTAS_COFRE.find(n => !lect[n.id]);
    return n ? { x: TODOS[n.id] } : null;
  };
  // se mira en cada cuadro: un cofre que pasa a abierto (por T, por trampa, por lo que sea) larga su nota
  const engancharCofres = () => {};
  const revisarCofres = S => {
    const L = S._ckRomp; if (!L || !L.length) return;
    const s = st(S); if (!s) return;
    L.forEach(o => {
      if (!o.cofre) return;
      if (o._ckl === undefined) { o._ckl = !!o.abierto; return; }        // los que ya estaban abiertos al llegar, no
      if (o._ckl || !o.abierto) return;
      o._ckl = true;
      const f = fl(s); f.notas_cofre = f.notas_cofre || {};
      if (f.notas_cofre[o.cofre]) return;
      const zona = S.currentZoneKey ? S.currentZoneKey() : '';
      const q = notaParaCofre(S, zona); if (!q || !q.x) return;
      f.notas_cofre[o.cofre] = q.x.id;
      if (q.lugar) { f.notas = f.notas || {}; f.notas[q.lugar] = true; }
      S.saveStory && S.saveStory();
      // si lo abriste vos con T, la nota se abre; si se abrió de otra forma (un golpe, una trampa), queda guardada y avisa
      if (Date.now() - ultT < 2500) setTimeout(() => esperarLibre(S, () => abrir(S, q.x, 'Estaba en el cofre')), 750);
      else try { window.CK_TEXTOS && CK_TEXTOS.avisar({ k: 'nota:' + q.x.id, n: 1, txt: () => 'Nota: ' + q.x.t + ' (M → Inventario)', ic: 'libro' }); } catch (e) {}
    });
  };
  // en el modo de pruebas automáticas (?pruebas=1) nada se abre solo: las pruebas apretan T para hablar y lo cerrarían
  const PRUEBAS = /[?&]pruebas=1/.test(location.search);
  const esperarLibre = (S, f, n, g) => {
    if (PRUEBAS) return;
    n = n || 0; if (g === undefined) g = gen;
    if (g !== gen) return;
    if (!S.player || n > 60) return;
    if (S.dialogOpen || S._overlay || S._ckEscena || S._cutscene || S._doorTransition) { setTimeout(() => esperarLibre(S, f, n + 1, g), 300); return; }
    f();
  };

  // ================================================================== libros en los interiores
  const texLibro = (S, color) => {
    const key = 'ckl_libro_' + color.replace('#', '');
    if (S.textures.exists(key)) return key;
    const c = document.createElement('canvas'); c.width = 13; c.height = 10; const g = c.getContext('2d');
    const px = (col, r) => { g.fillStyle = col; r.forEach(([x, y, w = 1, h = 1]) => g.fillRect(x, y, w, h)); };
    px('#1a0f08', [[1, 1, 11, 1], [0, 2, 1, 7], [12, 2, 1, 6], [1, 9, 11, 1]]);
    px(color, [[1, 2, 11, 6]]);
    px('#f1e2bf', [[1, 8, 11, 1], [11, 3, 1, 5]]);
    px('#e2b04a', [[3, 4, 6, 1], [3, 6, 4, 1]]);
    px('rgba(255,255,255,.35)', [[1, 2, 11, 1]]);
    S.textures.addCanvas(key, c);
    return key;
  };
  const quitarLibros = S => { (S._ckLibros || []).forEach(o => { [o.sp, o.brillo].forEach(x => x && x.active && x.destroy()); if (o.ev) o.ev.remove(); }); S._ckLibros = []; };
  const ponerLibros = S => {
    quitarLibros(S);
    const s = st(S); if (!s || !S.player) return;
    const zona = S.currentZoneKey(), aca = LIBROS.filter(b => b.zona === zona); if (!aca.length) return;
    const f = fl(s), pos = (f.libros_pos = f.libros_pos || {}), lect = f.lecturas || {};
    const a = S.currentInterior ? S.currentInterior.area : { x: 0, y: 0 };
    aca.forEach((b, i) => {
      if (!pos[b.id]) {
        // un rincón al que se llega caminando (el mismo buscador de ck_notas.js); que dos libros o la nota no queden pegados
        const otros = aca.filter(o => pos[o.id]).map(o => pos[o.id]).concat(f.notas_pos && f.notas_pos[zona] ? [f.notas_pos[zona]] : []);
        let p = null, cualquiera = null;
        for (let k = 0; k < 24 && window.CK_NOTAS && window.CK_NOTAS.elegir; k++) {
          const q = window.CK_NOTAS.elegir(S, zona); if (q && !cualquiera) cualquiera = q;
          if (q && !otros.some(o => Math.hypot(o.x - q.x, o.y - q.y) < 40)) { p = q; break; }
        }
        if (!p && cualquiera) {
          // corrido a un costado que se pueda pisar y lejos de lo que ya hay
          const libre = (x, y) => !S.navIsFree || S.navIsFree(a.x + x, a.y + y);
          for (const [dx, dy] of [[44, 0], [-44, 0], [0, 40], [0, -40], [64, 0], [-64, 0], [44, 40], [-44, 40]]) {
            const q = { x: cualquiera.x + dx, y: cualquiera.y + dy };
            if (libre(q.x, q.y) && !otros.some(o => Math.hypot(o.x - q.x, o.y - q.y) < 40)) { p = q; break; }
          }
        }
        if (!p) return;
        pos[b.id] = p; S.saveStory && S.saveStory();
      }
      const x = a.x + pos[b.id].x, y = a.y + pos[b.id].y;
      const sp = S.add.image(x, y, texLibro(S, b.color)).setOrigin(0.5, 1).setDepth(y - 3).setAngle(i % 2 ? 6 : -5).setScale(1.35);
      const brillo = S.add.star(x + 3, y - 8, 4, 1, 3.5, 0xfff6c0).setDepth(y - 2).setAlpha(0).setBlendMode(1);
      const ev = lect[b.id] ? null : S.time.addEvent({ delay: 2300 + i * 400, loop: true, callback: () => { if (brillo.active) S.tweens.add({ targets: brillo, alpha: { from: 0, to: 0.95 }, angle: 90, duration: 380, yoyo: true }); } });
      S._ckLibros.push({ b, x, y, sp, brillo, ev });
    });
  };
  const libroCerca = S => {
    const b = S.player && S.player.body; if (!b) return null;
    return (S._ckLibros || []).find(o => Math.hypot(o.x - b.center.x, o.y - b.bottom) < 26) || null;
  };
  let ultT = 0;
  const i0 = P.interact;
  P.interact = function () {
    ultT = Date.now();
    try {
      if (!this.dialogOpen && !this._overlay && !(this.nearbyStoryNPC && this.nearbyStoryNPC())) {
        const o = libroCerca(this);
        if (o) { if (o.ev) { o.ev.remove(); o.ev = null; } abrir(this, TODOS[o.b.id]); return; }
      }
    } catch (e) { console.warn('[lecturas]', e); }
    return i0.apply(this, arguments);
  };
  const us0 = P.updateStory;
  P.updateStory = function () {
    const r = us0.apply(this, arguments);
    try {
      // las notas del lugar que todavía tiene cofres cerrados no van al piso: salen del cofre
      const n = this._ckNota, Rr = R();
      if (n && Rr && Rr.COFRES[n.zona] && (this._ckRomp || []).some(o => o.cofre && !o.abierto)) {
        [n.sp, n.brillo].forEach(o => o && o.active && o.destroy()); if (n.ev) n.ev.remove(); this._ckNota = null;
      }
      revisarCofres(this); revisarHistoria(this);
      const o = !this.dialogOpen && !this._overlay && libroCerca(this), pr = document.getElementById('ck-prompt');
      if (o && pr) { pr.textContent = 'T · Leer «' + o.b.t + '»'; pr.classList.add('on'); this._ckLibroPrompt = true; }
      else if (this._ckLibroPrompt && pr) { this._ckLibroPrompt = false; if (/^T · Leer «/.test(pr.textContent)) pr.classList.remove('on'); }
    } catch (e) {}
    return r;
  };
  const cuando = S => {
    quitarLibros(S);
    const z = S.currentZoneKey(), t0 = Date.now();
    const iv = setInterval(() => {
      if (!S.player || S.currentZoneKey() !== z || Date.now() - t0 > 12000) { clearInterval(iv); return; }
      if (S._doorTransition || document.querySelector('.ck-carga.on, #ck-carga.on')) return;
      clearInterval(iv);
      try { ponerLibros(S); } catch (e) { console.warn('[lecturas]', e); }
    }, 400);
  };
  ['onAreaShown', 'onVillageShown'].forEach(k => {
    const f0 = P[k];
    if (f0) P[k] = function () { const r = f0.apply(this, arguments); try { cuando(this); engancharCofres(); } catch (e) {} return r; };
  });

  // ================================================================== los libros de la historia se abren solos
  // (se mira la marca que deja la historia al darlos: flags.libro_sello y flags.codice; sin tocar createFloatingText)
  const vistos = {};
  const revisarHistoria = S => {
    const s = st(S); if (!s) return;
    const f = fl(s), L = f.lecturas || {};
    [['libro_sello', HISTORIA.sello], ['codice', HISTORIA.codice]].forEach(([k, x]) => {
      if (!f[k]) { vistos[k] = false; return; }
      if (vistos[k] === undefined) { vistos[k] = true; return; }        // ya lo tenía al cargar la partida
      if (vistos[k] || L[x.id]) { vistos[k] = true; return; }
      vistos[k] = true;
      setTimeout(() => esperarLibre(S, () => abrir(S, TODOS[x.id])), 1600);
    });
  };

  // al empezar otra partida o volver al menú: lo pendiente se descarta y el lector se cierra
  ['startCampaign', 'returnToStartMenu', 'startPractice'].forEach(k => {
    const f0 = P[k];
    if (typeof f0 === 'function') P[k] = function () { cola.length = 0; if (caja && caja.classList.contains('on')) { caja.classList.remove('on'); actual = null; if (this._overlay === 'ck-lector') { try { this.closeOverlay(); } catch (e) { this._overlay = null; } } } return f0.apply(this, arguments); };
  });
  let gen = 0;
  ['startCampaign', 'returnToStartMenu'].forEach(k => { const f0 = P[k]; if (typeof f0 === 'function') P[k] = function () { gen++; return f0.apply(this, arguments); }; });

  // ================================================================== para el inventario
  const leidas = S => {
    const s = st(S); if (!s) return [];
    const L = (fl(s).lecturas) || {}, N = (fl(s).notas) || {};
    const ids = Object.keys(L);
    Object.keys(N).forEach(z => { const id = 'np_' + z; if (!L[id] && notaDeLugar(z)) ids.push(id); });
    return ids.map(obtener).filter(Boolean).sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'libro' ? -1 : 1));
  };
  const total = () => NOTAS_COFRE.length + LIBROS.length + Object.keys(HISTORIA).length + ((window.CK_NOTAS && window.CK_NOTAS.TOTAL) || 0);
  window.CK_LECTURAS = { abrir: (S, id) => abrir(S || ESCENA(), obtener(id)), cerrar, leidas, total, NOTAS_COFRE, LIBROS, HISTORIA };
})();
