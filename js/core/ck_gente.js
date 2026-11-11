'use strict';
/* La gente del Roble (02/11, pedido del dueño): personalidad, charlas y guiños con tono de "medievo criollo".
   - Cada aldeano tiene nombre, oficio y forma de hablar. Con T charla en serio: la primera vez se presenta; después cuenta
     algo según cómo va la historia (6 tramos: inicio, camino, Brumavieja, victoria, Capítulo 2 y final), chismes de los
     otros vecinos, lo suyo de siempre y, si toca, algo de noche o con lluvia. Algunos reconocen al héroe elegido.
     Lo dicho se recuerda en story.flags.gente (no repiten lo mismo enseguida).
   - Mientras charlan con el héroe se quedan quietos y lo miran.
   - Charlas entre vecinos: si dos están cerca y el héroe pasa al lado, se dicen dos o tres cosas en globitos chicos.
   - Rutina nueva: la siesta. Al mediodía Anselmo, Mirta y Ramona se van a dormir un rato a su casa.
   - Eventos: con lluvia Mirta convida una torta frita (cura 1); al volver de vencer al Nigromante, Anselmo canta una payada
     en la plaza; de noche en Brumavieja anda la luz mala; de noche en la taberna se juega al truco.
   - Guiños para mirar con T: el tablón de anuncios (cambia con la historia), el mate olvidado en el bebedero, la pava de la
     fogata, y en otros lugares: la mano de truco, el locro, la miel del monte, la carreta, el «Varek estuvo aquí», el libro
     de yuyos, el mate del muñeco, la botella de agua del tocón y la taba de los orcos.
   Borrar su línea de index.html lo saca (los aldeanos vuelven al saludo de antes). Usa ck_escenas.js. */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof STORY_NPCS === 'undefined' || !window.CK_ESCENA) return;
  const P = MainGameScene.prototype, E = window.CK_ESCENA;
  const UNO = l => l[Math.floor(Math.random() * l.length)];
  const escena = () => window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(s => s.startCampaign));
  const nombreHeroe = S => { const h = (typeof HEROES !== 'undefined' && HEROES[S.playerHero]) || { name: 'forastero' }; return h.name.charAt(0) + h.name.slice(1).toLowerCase(); };
  /** {o/a} {el/la} {un forastero/una forastera} según el héroe; {h} su nombre. */
  const txt = (S, t) => String(t).replace(/\{h\}/g, nombreHeroe(S)).replace(/\{([^{}/]*)\/([^{}]*)\}/g, (m, a, b) => (S.playerHero === 'swordsman' ? b : a));
  const tramo = s => {
    const f = (s && s.flags) || {}, c2 = f.c2 || 0;
    if (c2 >= 9) return 'fin';
    if (c2 >= 1) return 'cap2';
    if (s.step >= 7) return 'victoria';
    if (s.step >= 4) return 'brumavieja';
    if (s.step >= 2) return 'camino';
    return 'inicio';
  };
  const esNoche = S => !!(S.isNight && S.isNight());
  const llueve = () => { try { return /lluvia|tormenta/.test(window.CK_CLIMA && CK_CLIMA.actual()); } catch (e) { return false; } };

  // ================================================================== QUIÉN ES QUIÉN
  const GENTE = {
    npc1: { nombre: 'Ciriaco, el leñero',
      pres: ['Ciriaco. Leñero.', 'Hablo poco. La leña no contesta y así nos llevamos bien.'],
      siempre: [['El espinillo da buena brasa. El sauce, ni para el mate.'], ['Si el humo sube derecho, mañana hay sol. Hoy sube torcido.'], ['Un hacha bien afilada no hace ruido. La gente tampoco.']],
      chismes: [['La Mirta me reta porque traigo la leña mojada. La leña viene como viene.'], ['Anselmo dice que de joven cortaba el doble que yo. De joven también mentía el doble.'], ['El Mateo me preguntó si sé algo de la niebla. Le dije que sí: que es húmeda.']],
      inicio: [['El castillo queda por el camino del sur. Pasás el puente. No tiene pérdida.', 'Salvo los lobos.']],
      camino: [['Los lobos del camino tienen hambre. Igual que yo. Pero yo no muerdo.']],
      brumavieja: [['A Brumavieja le vendía leña. Ya no me pagan. Pero tampoco me deben.']],
      victoria: [['Dicen que bajaste al Nigromante.', 'Mjm. Bien ahí.']],
      cap2: [['Orcos al este. Que vengan. El hacha la tengo afilada.']],
      fin: [['Volviste entero. Eso vale más que una medalla.']],
      noche: [['De noche no corto. El monte de noche es de otros.']],
      lluvia: [['Con lluvia no hay leña seca ni leñero contento.']],
      heroe: { soldier: ['Caballero.', '…', 'Lindo hacha no tenés. Lástima.'] } },
    npc3: { nombre: 'Don Eulalio, el yuyero',
      pres: ['¡Ah, cara nueva! Eulalio, para servirle. Yuyos, ungüentos y consejos; los dos primeros se cobran.', 'Esas pociones de colores que venden en la tienda son agua con azúcar y un poco de fe.'],
      siempre: [['Para el empacho, té de boldo. Para el mal de amores, también. No cura, pero entretiene.'], ['La peperina se junta a la mañana, cuando todavía tiene rocío. Después ya no tiene gracia.'], ['¿Le duele algo? No me diga. A ver la lengua… no, está bien, era para mirarle la cara.']],
      chismes: [['Doña Ramona viene todas las semanas por un ungüento para la espalda. La espalda la tiene bien; lo que quiere es charlar.'], ['La Clara me pidió algo para que el Tobi se anime a hablarle. Le di manzanilla. Para ella, que está nerviosa.'], ['Mirta dice que mis yuyos son cosa de brujas. Después me pide ruda para la puerta.']],
      inicio: [['Si va al castillo, salude a la cocinera de mi parte. Me debe un frasco de miel desde la otra luna.']],
      camino: [['Los que vuelven mordidos del camino vienen todos acá. Lave bien la herida y póngale llantén, aunque arda.']],
      brumavieja: [['Llévese una ramita de ruda para Brumavieja. A los muertos no sé, pero a los vivos les espanta el mal humor.']],
      victoria: [['Volvió entero, qué alegría. ¿Ve? La ruda funciona.', 'Bueno, y la espada también, un poquito.']],
      cap2: [['En la frontera crece la jarilla. Si ve una, tráigamela: los orcos la usan para curarse y yo quiero saber cómo.']],
      fin: [['Dicen que hay un orco bueno que se llama Gorak. Si viene, que pase por acá. Debe tener cada dolor de espalda…']],
      noche: [['De noche junto flores de luna. Las de día no sirven para los sueños.']],
      lluvia: [['¡Lluvia! Ahora salen los hongos. Los buenos y los otros. Aprenda a distinguirlos o aprenda a rezar.']],
      heroe: { wizard: ['Usted es mago, ¿no? Entonces sabe que la mitad de la magia es saber qué yuyo poner. La otra mitad es poner cara seria.'] } },
    npc4: { nombre: 'Doña Ramona, la chacarera',
      pres: ['Ramona, chacarera. Tengo tres vacas, un sembrado de maíz y una espalda que se queja más que mi marido.', 'Si alguna vez quiere un asado de verdad, avise con tiempo, que la leña la elige Ciriaco.'],
      siempre: [['Este año el maíz viene alto. Si la niebla no lo pudre, choclo para todos.'], ['Una vaca sabe que va a llover antes que el cielo. Se echan todas juntas, mire.'], ['El que no madruga, ordeña tarde. Y la vaca se enoja.']],
      chismes: [['Anselmo dice que de joven domó un caballo a los gritos. Yo lo conocí: el caballo era sordo.'], ['El yuyero me vende ungüento para la espalda. No me cura, pero me escucha.'], ['El Beto de los barriles come como tres peones. Lo vi terminarse una olla de carbonada solo.']],
      inicio: [['El Rey manda llamar gente de armas. Mi hijo quiso ir y lo encerré en el granero. Mejor así.']],
      camino: [['Una noche me faltó una ternera. Las huellas iban para el camino del castillo. Lobos, dicen. Yo digo lobo grande.']],
      brumavieja: [['¿Sabe lo del séptimo hijo varón? Si nace el séptimo, se hace lobizón. En Brumavieja había una familia con siete. Yo no digo nada.']],
      victoria: [['Cuando todo esto pase, asado en la plaza. Usted no paga. Bueno, trae el vino.']],
      cap2: [['Los orcos del este se llevan el ganado. Si ve vacas con mi marca, una erre torcida, son mías.']],
      fin: [['Volvieron dos vacas solas por el camino del este. Cosas de la frontera. Gracias, de parte de ellas.']],
      noche: [['De noche las vacas se juntan y miran al norte. Algo saben.']],
      lluvia: [['Llueve, por fin. El maíz se lo agradece; mis rodillas, no.']] },
    npc6: { nombre: 'Don Anselmo',
      pres: ['Anselmo, para servirle. Fui payador en mis tiempos: le cantaba a la feria de Brumavieja hasta que salía el sol.', 'Ahora canto poco. La voz se me fue con los dientes.'],
      siempre: [['El diablo sabe por diablo, pero más sabe por viejo. Me lo dijo mi abuelo, que era más viejo que el diablo.'], ['Antes, para ir al castillo, se tardaba medio día a caballo. Ahora también, pero el caballo se murió.'], ['El pozo de la aldea nunca se secó. Ni en la gran sequía, cuando hasta los sapos pedían agua.']],
      chismes: [['La Mirta y yo nos conocemos hace cincuenta inviernos. Hace cincuenta inviernos que me dice que no.'], ['Ese Mateo cuenta los chismes mal: les cambia el final. Un chisme bien contado tiene que tener respeto.'], ['Ciriaco no habla, pero cuando habla, la acierta. Es lo contrario de un payador.']],
      inicio: [['Brumavieja tenía la mejor feria del reino. Empanadas, carreras de sortija, payadas hasta el amanecer… y ahora, niebla.']],
      camino: [['En el camino del castillo, cuando yo era joven, había una pulpería. El pulpero fiaba. Por eso cerró.']],
      brumavieja: [['Si llega a la capilla de Brumavieja, mire el campanario. Ahí dejé mis iniciales a cuchillo, en la feria del año de la helada.'], ['Los viejos decían que debajo de esa capilla había una salamanca, una cueva donde se aprenden cosas que no se deben aprender.']],
      victoria: [['Le estoy componiendo unas décimas. Me falta una rima con su nombre. ¿No tiene otro nombre?']],
      cap2: [['Los orcos tienen sus propios cantores, ¿sabía? Cantan a los gritos. Como yo, pero con más dientes.']],
      fin: [['Ya tengo la payada completa. Diez décimas. Hoy no, que hay que llegar con la garganta fresca.']],
      noche: [['De noche las historias se cuentan solas. Lo difícil es que alguien se quede a escucharlas.']],
      lluvia: [['Con lluvia me duelen los huesos que me rompí de joven. Que fueron todos.']],
      heroe: { wizard: ['¡Horos! ¿Se acuerda de mí? La feria de Brumavieja, la payada contra el gaucho Ledesma… usted hizo llover en pleno sol.', 'Perdí la payada, pero gané la apuesta. Nunca le agradecí.'] } },
    npc7: { nombre: 'Abuela Mirta',
      otros: { wizard: [['Hay un mago viejo en el castillo que conocí de moza. Era buen mozo. Ahora es buen viejo.']] },
      pres: ['¡Ay, criatura, qué flac{o/a} que estás! Mirta. Me dicen todos abuela, aunque nietos tengo dos.', 'Si pasás de noche por el campo y ves una lucecita que flota, no la sigas. Es la luz mala.'],
      siempre: [['El agua para el mate no se hierve, criatura. Se calienta hasta que la pava canta bajito. Si hierve, se quema la yerba.'], ['Cuando yo era chica la niebla no bajaba del monte. Algo la está empujando, te digo yo.'], ['Ese fuego lo prendió mi marido hace cuarenta años y nunca se apagó. Bueno, una vez. No se lo digas a nadie.']],
      chismes: [['Anselmo me corteja desde que teníamos dientes de leche. Le digo que no por costumbre, ya.'], ['El Eulalio vende yuyos que no curan nada. A mí me compra la ruda; yo la ruda la tengo de verdad.'], ['El Tobi perdió el gato otra vez. Ese gato tiene más de siete vidas y se las gasta todas en el granero.']],
      inicio: [['¿Al castillo? Llevá algo de comer. En el castillo te dan banquete, pero tardan tanto en servir que se te pasa el hambre.']],
      camino: [['Los lobos bajan cuando tienen hambre o cuando los manda alguien. Estos tienen cara de mandados.']],
      brumavieja: [['En Brumavieja nació mi madre. Si pasás por la capilla, rezá un padrenuestro. Uno solo, que andás apurad{o/a}.'], ['Dicen que el séptimo hijo varón se vuelve lobizón las noches de luna. ¿Viste algo con mucho pelo? Ahí tenés.']],
      victoria: [['¡Volviste! Te voy a hacer pastelitos. ¿Membrillo o batata? Mentira, van los dos.']],
      cap2: [['¿Orcos? En mis tiempos les decíamos «los del este» y nadie iba para allá. Ahora vas vos. Abrigate.']],
      fin: [['Ya sé que sos {un héroe/una heroína}. Igual comé, que los héroes también se desmayan.']],
      noche: [['De noche se oyen cosas en el monte. Los viejos decían que es el Pombero. Yo digo que es el viento. Pero la puerta la tranco.']],
      lluvia: [['¡Llueve! Día de tortas fritas, criatura.']],
      heroe: { swordsman: ['Vos sos la nieta de la Rosaura, la de Brumavieja. ¡Tenés los mismos ojos bravos!', 'Tu abuela me vendía huevos. Los mejores del reino. Y los más caros.'],
        wizard: ['Usted es el mago que pasó por acá cuando yo era moza. No me mire así, que yo sí me acuerdo.'],
        soldier: ['Un caballero sin caballo. Eso sí que no se ve todos los días, criatura.'] } },
    npc10: { nombre: 'Beto, el de los barriles',
      otros: { soldier: [['El caballero ese, Lancent, me ayudó a cargar barriles. Cargó dos y se sentó. Para un caballero, es mucho.']] },
      pres: ['Beto, el de los barriles. Si algo pesa, me llaman a mí.', 'El Capitán Bruno manda y yo cargo. A fin de mes los dos cobramos poco.'],
      siempre: [['Un barril de vino pesa lo que tres bolsas de harina. Lo sé porque me los hacen cargar juntos.'], ['El mate amargo es para los que madrugan. El dulce, para los que tienen tiempo. Yo no tengo tiempo.'], ['¡Paso, que pesa! Ah, sos vos. Igual pesa.']],
      chismes: [['El Capitán me pidió que no cuente que se cayó del caballo en el desfile. No lo voy a contar. Pero se cayó.'], ['Tobi y yo vamos al pato los domingos. Él juega, yo agarro los caballos. Es como cargar barriles, pero relinchan.'], ['El Mateo me debe tres jarras de las apuestas de truco. Dice que me las paga cuando baje el precio. Nunca baja.']],
      inicio: [['Esta mañana llevé barriles al castillo. En la cocina dicen que el Rey no duerme desde lo de Brumavieja.']],
      camino: [['Un lobo me comió la vianda en el camino. Doña Rosa dice que me la comí yo. Las dos cosas pueden ser verdad.']],
      brumavieja: [['Desde que no llegan carretas del norte, cargo el doble. Si arreglás lo de Brumavieja, te invito un vino. Uno.']],
      victoria: [['¡Eh, {campeón/campeona}! El Capitán dice que peleás mejor que la mitad de sus reclutas. Yo digo que mejor que todos, pero no le digas.']],
      cap2: [['Me mandaron a cargar flechas para la frontera. Cajones y cajones de flechas. ¿Tan grandes son los orcos?']],
      fin: [['Los barriles del castillo ahora vuelven llenos de cerveza del este. Los orcos hacen una cerveza que te deja sordo. Muy rica.']],
      noche: [['De noche no cargo. Si me ves cargando de noche, es que alguien me pagó doble.']],
      lluvia: [['Con lluvia los barriles resbalan. Y yo atrás.']],
      heroe: { swordsman: ['Aby, ¿te acordás de mí? Te cargaba los bultos en la feria. Siento mucho lo de tu pueblo.'] } },
    npc12: { nombre: 'Tobi, el del granero',
      pres: ['¡Buenas! Tobi, del granero. Esta horquilla ya espantó tres lobos y un recaudador.', '¿No viste un gato atigrado? Se llama Garufa. Viene cuando lo llamás, o sea, nunca.'],
      siempre: [['El heno no se junta solo. Bueno, con viento sí, pero para cualquier lado.'], ['Si alguna vez jugás al pato, no te pongas delante del caballo. Me pasó. Gané, igual.'], ['Buena tierra la del Roble. Tirás un carozo y al año tenés un durazno.']],
      chismes: [['La Clara me saluda todas las mañanas. Bueno, saluda a todos. Pero a mí primero, creo.'], ['Mateo dice que vio un dragón. Era la vaca de Doña Ramona con un balde en la cabeza.'], ['La abuela Mirta me dio una torta frita una vez y desde entonces la quiero como a una tía.']],
      inicio: [['¿Vas al castillo? Fijate si ves a Garufa por el camino. A veces se va a cazar ratones a la cocina del Rey.']],
      camino: [['Si limpiás el camino de lobos, el domingo volvemos a jugar al pato en el campo de Anselmo.']],
      brumavieja: [['Garufa volvió ayer con olor a niebla. No sé dónde anduvo. No me quiso contar.']],
      victoria: [['¡Garufa apareció! Estaba en el techo del granero mirando para Brumavieja. Desde que fuiste, baja tranquilo.']],
      cap2: [['Me ofrecí para ir a la frontera y me dijeron que con una horquilla no alcanza. Les dije que con dos tampoco.']],
      fin: [['Garufa tuvo gatitos. O sea que Garufa es gata. Toda la vida equivocado.']],
      noche: [['De noche duermo en el granero con las vacas. Son buenas compañeras: no roncan. Bueno, un poco.']],
      lluvia: [['¡Cerrá el granero, que se moja el heno! Ah, no, vos no trabajás acá. Perdón.']] },
    npc13: { nombre: 'Mateo',
      otros: { wizard: [['¿Viste al mago viejo de la biblioteca? Dicen que ya estuvo por acá hace cuarenta años. No envejeció nada. Bueno, envejeció todo.']],
        swordsman: [['La espadachina pelirroja de la taberna le ganó a Beto pulseando. Beto dice que se dejó.']],
        soldier: [['Llegó un caballero al castillo que no tiene ni caballo. Dice que lo perdió en una apuesta. Me cae bien.']] },
      pres: ['¡Che, vos sos {el/la} que mandó llamar el Rey! Mateo, un gusto. Si querés saber algo de alguien, preguntame.', 'Si no querés saber, también te cuento, eh.'],
      siempre: [['¿Viste lo que cuesta la cerveza? Cada luna sube un cobre. A este paso vamos a pagar con gallinas.'], ['Mi primo, el de Villa Seca, dice que la niebla la mandan del castillo para cobrar más impuestos. Mi primo dice muchas cosas.'], ['¿Jugás al truco? Los viernes, en la taberna. Traé porotos para anotar y paciencia para perder.']],
      chismes: [['La Clara y el Tobi se miran como dos gatos en el techo. Ninguno maúlla. Yo ya aposté.'], ['Doña Rosa le pone agua al vino. Poquita. Lo justo para que dure hasta fin de mes.'], ['El Beto de los barriles dice que le debo tres jarras. Le debo dos. Y media.']],
      inicio: [['Dicen que en el castillo están desesperados. Si el Rey llama forasteros es porque sus caballeros no quieren ir. Yo tampoco iría.']],
      camino: [['Me contaron que el viajero de la fogata, el Ruy, sabe más de la niebla que el Rey. Y cobra menos.']],
      brumavieja: [['Mi primo vio luces en Brumavieja. La luz mala, dice. Mi primo también vio un dragón. Pero lo de las luces lo vieron otros.']],
      victoria: [['¡Ya lo sabe toda la aldea! Bueno, se lo conté yo, pero igual. ¡Le diste al Nigromante!']],
      cap2: [['Dicen que hay un orco que no es malo. Gorak. Yo no le creo a nadie que tenga los dientes para afuera.']],
      fin: [['Ahora todo el mundo habla de las Torres de Escarcha. Yo ya hablaba de eso antes, que conste.']],
      noche: [['De noche la taberna es otra cosa. Se canta, se juega al truco y alguien siempre termina llorando por amor.']],
      lluvia: [['Llueve y se le moja la ropa tendida a la Clara. Mirá cómo corre. ¿Le aviso? No, mejor miro.']],
      heroe: { soldier: ['¿Caballero? ¿Y el caballo? ¿Lo empeñaste? A mí me podés contar.'] } },
    npc14: { nombre: 'Clara, la lavandera',
      otros: { swordsman: [['La chica de Brumavieja, Aby, casi no habla. Le lavé la capa y estaba llena de ceniza.']] },
      pres: ['Clara. Lavo la ropa de media aldea: sé quién se cayó al barro, quién se volcó vino encima y quién llora en la almohada.', 'Y no lo cuento. Para eso está Mateo.'],
      siempre: [['La ropa blanca con ceniza y agua de lluvia queda como nueva. La negra también: no se nota la mugre.'], ['La tienda trae pociones nuevas cada tanto. La roja cura, la naranja también, pero cuesta más. Así es la vida.'], ['Cuidate en el camino al castillo. Los lobos no respetan a nadie, ni a los que tienen la ropa limpia.']],
      chismes: [['El Tobi me trajo flores ayer. Dijo que las encontró en el heno. Las arrancó del jardín de Don Eulalio, se nota.'], ['Mateo apuesta a todo. Una vez apostó a que no llovía y se le mojó la apuesta.'], ['Doña Rosa, la de la posada, es la que más sabe del pueblo. Pero ella no cuenta nada. Bueno, casi nada.']],
      inicio: [['El chasqui del castillo pasó esta mañana corriendo. Iba tan apurado que se le cayó el gorro en mi batea.']],
      camino: [['Lavé la capa de un guardia del castillo. Tenía mordidas de lobo hasta la rodilla. Cuidate.']],
      brumavieja: [['En Brumavieja yo tenía una amiga, la Aurelia. Vivía en la casa del molino. Si ves una cinta azul en la ventana, es la suya.']],
      victoria: [['¡Te lavo la capa gratis! No, en serio, dámela. Huele a cementerio.']],
      cap2: [['Los orcos tienen la ropa más sucia del reino. Si traen la paz, que traigan también jabón.']],
      fin: [['Mira, la hija del mercader, me trajo una tela roja del este. Para un vestido. Para el pato del domingo, ¿quién sabe?']],
      noche: [['De noche no lavo. El río de noche suena distinto, como si hablara.']],
      lluvia: [['¡La ropa! ¡Toda la ropa tendida! Perdoná, tengo que correr.']] }
  };

  // ================================================================== CHARLAS CON T
  const estado = (S, id) => {
    const f = (S.story.flags = S.story.flags || {});
    f.gente = f.gente || {};
    return (f.gente[id] = f.gente[id] || { v: 0, t: {}, i: 0, h: 0 });
  };
  const congelados = new Set();
  const npcDe = (S, id) => (S && S.campaignNPCs ? S.campaignNPCs.find(n => n.id === id) : null);
  const mirar = (S, npc) => {
    if (!npc || !npc.sprite || !S.player) return;
    npc.sprite.setFlipX(S.player.x < npc.sprite.x);
    const k = npc.id + '_idle';
    if (S.anims.exists(k)) npc.sprite.play(k, true);
  };
  const conversar = (S, id) => {
    const g = GENTE[id], st = S.story, e = estado(S, id), tr = tramo(st);
    congelados.add(id);
    mirar(S, npcDe(S, id));
    let out;
    if (!e.v) out = g.pres;
    else if (g.heroe && g.heroe[S.playerHero] && !e.h) { out = g.heroe[S.playerHero]; e.h = 1; }
    else if (id === 'npc7' && llueve() && S.time.now - (S._ckTorta || -1e9) > 240000) {
      S._ckTorta = S.time.now; S._ckDaTorta = true;
      out = ['¡Llueve! Día de tortas fritas. Tomá, criatura, que con la panza llena se pelea mejor.'];
    } else if (g[tr] && (e.t[tr] || 0) < g[tr].length) { out = g[tr][e.t[tr] || 0]; e.t[tr] = (e.t[tr] || 0) + 1; }
    else {
      const extra = [];
      if (esNoche(S) && g.noche) extra.push(...g.noche);
      if (llueve() && g.lluvia) extra.push(...g.lluvia);
      const otros = [];
      Object.keys(g.otros || {}).forEach(h => { if (h !== S.playerHero && (!window.CK_HEROES_NPC || CK_HEROES_NPC.siguen(S, h))) otros.push(...g.otros[h]); });
      const ronda = [...extra, ...otros, ...g.chismes, ...g.siempre, ...(g[tr] || [])];
      out = ronda[e.i % ronda.length];
      e.i++;
    }
    e.v++;
    return out.map(l => txt(S, l));
  };
  Object.keys(GENTE).forEach(id => {
    const g = GENTE[id];
    STORY_NPCS.push({
      id: 'g_' + id, zone: 'village', r: 30, name: g.nombre, face: id + '_villager',
      get x() { const S = escena(), n = npcDe(S, id); return n && n.sprite && n.sprite.visible && (!n.vida || n.vida.modo !== 'adentro') ? n.sprite.x : -99999; },
      get y() { const S = escena(), n = npcDe(S, id); return n && n.sprite ? n.sprite.y - 8 : -99999; },
      lines: () => conversar(escena(), id)
    });
  });
  const hablado0 = P.onTalked;
  P.onTalked = function (id) {
    if (typeof id === 'string' && id.indexOf('g_') === 0) {
      const k = id.slice(2);
      congelados.delete(k);
      if (k === 'npc7' && this._ckDaTorta) {
        this._ckDaTorta = false;
        this.health = Math.min(this.maxHealth, this.health + 1);
        if (this.updateHUD) this.updateHUD();
        this.createFloatingText(this.player.x, this.player.y - 46, '+1 VIDA · torta frita', 0xfcd34d);
      }
      if (this.saveStory) this.saveStory();
      return;
    }
    return hablado0 ? hablado0.apply(this, arguments) : undefined;
  };
  // los que están charlando no se mueven (se sacan un instante de la lista que los hace caminar)
  const npcs0 = P.updateNPCs;
  P.updateNPCs = function () {
    if (!congelados.size || !this.campaignNPCs) return npcs0.apply(this, arguments);
    if (!this.dialogOpen && !this._ckCharla) congelados.clear();
    // si aparece una bestia, la charla se corta: cada uno se va a su refugio
    if (!this.currentInterior && this.enemies && this.enemies.getChildren().some(e => e.active && !e.isDead)) congelados.clear();
    if (!congelados.size) return npcs0.apply(this, arguments);
    const todos = this.campaignNPCs;
    this.campaignNPCs = todos.filter(n => !congelados.has(n.id));
    try { return npcs0.apply(this, arguments); } finally { this.campaignNPCs = todos; }
  };

  // ================================================================== GUIÑOS PARA MIRAR
  const tablon = S => {
    const st = S.story, f = st.flags || {}, c2 = f.c2 || 0, l = [];
    l.push('«SE BUSCA gato atigrado. Responde (a veces) a Garufa. Preguntar por Tobi, en el granero.»');
    l.push('«Truco los viernes en la Taberna del Roble. Traer porotos. No se fía.»');
    if (st.step >= 2) l.push('«BANDO DEL REY: se prohíbe andar por el camino del castillo después del anochecer.»');
    if (st.step >= 4) l.push('«Don Eulalio ofrece ruda contra aparecidos. Precio de amigo.»');
    if (st.step >= 7) l.push('«¡Asado en la plaza cuando vuelva la paz! Organiza Doña Ramona. Leña: Ciriaco.»');
    if (c2 >= 1) l.push('«Se buscan brazos para cargar flechas a la frontera. Preguntar por Beto, el de los barriles.»');
    if (c2 >= 9) l.push('«El Rey paga bien por noticias de las Torres de Escarcha.»');
    return l.slice(-4);
  };
  const GUINOS = [
    { id: 'tablon', x: 268, y: 200, r: 26, name: 'Tablón de anuncios', etiqueta: 'Leer el tablón', lines: S => tablon(S) },
    { id: 'mate', x: 290, y: 402, r: 24, name: 'El bebedero', etiqueta: 'Mirar el bebedero',
      lines: () => ['En el borde del bebedero alguien olvidó un mate de calabaza. Todavía está tibio.', 'La bombilla tiene grabadas dos letras: «A» y «M». Anselmo y Mirta. O Mirta y Anselmo.'] },
    { id: 'pava', x: 254, y: 482, r: 26, name: 'La fogata', etiqueta: 'Mirar la fogata',
      lines: () => ['Una pava tiznada al costado de las brasas.', 'La abuela Mirta dice que el agua para el mate no tiene que hervir. Nadie se anima a contradecirla.'] }
  ];
  GUINOS.forEach(gn => STORY_NPCS.push({ id: 'v_' + gn.id, zone: 'village', x: gn.x, y: gn.y, r: gn.r, name: gn.name, etiqueta: gn.etiqueta, face: null, lines: () => gn.lines(escena()) }));
  const historia0 = P.updateStory;
  P.updateStory = function () {
    const r = historia0.apply(this, arguments);
    try {
      const pr = document.getElementById('ck-prompt');
      if (pr && pr.classList.contains('on') && !this.dialogOpen) {
        const hit = this.nearbyStoryNPC && this.nearbyStoryNPC();
        if (hit && hit.npc.etiqueta) pr.textContent = 'T · ' + hit.npc.etiqueta;
      }
    } catch (e) {}
    return r;
  };

  // en los otros lugares: cosas que se comentan al pasar (abajo, chiquito) y se leen con T
  const GUINOS_LUGAR = {
    ed_taberna_2: [
      { x: 307, y: 162, r: 24, lines: ['Sobre la mesa quedó una mano de truco a medio jugar, con el ancho de espadas boca arriba. Alguien cantó «falta envido» y se fue corriendo.'] },
      { x: 240, y: 124, r: 28, lines: ['Una olla de locro hierve desde la mañana. Doña Rosa no deja que nadie la destape antes del mediodía.'] }],
    ed_camino_al_castillo: [
      { x: 216, y: 220, r: 32, lines: ['En la puerta de la cabaña, un cartel tallado: «Se vende miel. Golpear fuerte, el apicultor es sordo».'] },
      { x: 755, y: 520, r: 30, lines: ['Una carreta con una rueda rota. En el pescante quedaron un poncho y una bota de vino vacía.'] }],
    ed_biblioteca: [
      { x: 132, y: 240, r: 26, lines: ['En el atril, «Tratado de yuyos y otras hierbas», de Don Eulalio. En el margen, con otra letra: «La peperina no cura el mal de ojo. —E.»'] }],
    ed_bosque_de_la_frontera: [
      { x: 338, y: 584, r: 30, lines: ['Al pie del tocón alguien dejó una botella con agua y una cinta roja. «Para que el que pase no tenga sed», dice un papelito.'] }],
    ed_pueblo_orco: [
      { x: 510, y: 325, r: 30, lines: ['Al lado del fogón quedó tirada una taba hecha con hueso de vaca. Los orcos chicos la juegan como los paisanos.'] }]
  };
  Object.keys(GUINOS_LUGAR).forEach(kind => {
    if (typeof INTERIOR_LAYOUTS === 'undefined' || !INTERIOR_LAYOUTS[kind]) return;
    const L = INTERIOR_LAYOUTS[kind];
    INTERIOR_LAYOUTS[kind] = function (kit) {
      const r = L.apply(this, arguments);
      try { const a = kit.areas && kit.areas.main; if (a) { a.talkers = a.talkers || []; GUINOS_LUGAR[kind].forEach(t => a.talkers.push(Object.assign({}, t))); } } catch (e) {}
      return r;
    };
  });
  // Brumavieja y el Patio de Armas son zonas viejas con el dibujo del Taller (ck_lugares_flow.js): sus guiños van aparte
  const enLayout = (kind, area, lista) => {
    if (typeof INTERIOR_LAYOUTS === 'undefined' || !INTERIOR_LAYOUTS[kind]) return;
    const L = INTERIOR_LAYOUTS[kind];
    INTERIOR_LAYOUTS[kind] = function (kit) {
      const r = L.apply(this, arguments);
      try { const a = kit.areas && kit.areas[area]; if (a) { a.talkers = a.talkers || []; lista.forEach(t => a.talkers.push(Object.assign({}, t))); } } catch (e) {}
      return r;
    };
  };
  enLayout('ruins', 'village', [
    { x: 470, y: 215, r: 28, lines: ['En la pared de la capilla alguien escribió con carbón: «VAREK ESTUVO AQUÍ». Abajo, más chiquito: «y se fue sin pagar las empanadas».'] },
    { x: 215, y: 490, r: 32, lines: ['La casa del molino. En la ventana todavía hay una cinta azul, descolorida por la niebla.'] }]);
  enLayout('castle', 'training', [
    { x: 467, y: 150, r: 26, lines: ['Alguien dejó un mate apoyado en el hombro del muñeco de práctica. «Así tiene compañía», dice el recluta.'] }]);

  // ================================================================== CHARLAS ENTRE VECINOS (globitos)
  const CHARLAS = {
    siempre: [
      { con: ['npc7', 'npc6'], l: [[0, '¿Otra vez el sombrero de los domingos, Anselmo?'], [1, 'Para verte a vos, Mirta, todos los días son domingo.'], [0, 'Hoy es martes y tenés barro hasta las rodillas.'], [1, 'Martes de gala, entonces.']] },
      { con: ['npc7', 'npc1'], l: [[0, 'Ciriaco, ¿esta leña está seca?'], [1, 'Mjm.'], [0, 'Está mojada.'], [1, 'Mjm.']] },
      { con: ['npc13', 'npc14'], l: [[0, '¿Supiste que el pan subió otra vez?'], [1, 'Mateo, el pan sube todas las lunas.'], [0, 'Por eso te digo. A este paso pagamos con gallinas.']] },
      { con: ['npc12', 'npc10'], l: [[0, '¿Vas al pato el domingo?'], [1, 'Si el Capitán no me hace cargar barriles…'], [0, 'Ese Capitán te tiene de mula.'], [1, 'Por lo menos me paga en yerba.']] },
      { con: ['npc4', 'npc6'], l: [[0, 'Anselmo, ¿usted cree que llueve?'], [1, 'Mis rodillas dicen que sí.'], [0, 'Mis vacas dicen que no.'], [1, 'Entonces llueve sobre las vacas.']] },
      { con: ['npc3', 'npc14'], l: [[0, 'Clara, para los nervios, manzanilla.'], [1, '¿Qué nervios?'], [0, 'Los que te agarran cuando pasa el Tobi.']] },
      { con: ['npc12', 'npc14'], l: [[0, 'Buen día, Clara.'], [1, 'Buen día, Tobi.'], [0, '…'], [1, '…'], [0, 'Bueno. Buen día.']] },
      { l: [[0, '¿Viste {un forastero/una forastera} por acá?'], [1, 'Dicen que viene de lejos.'], [0, 'Tiene cara de no haber desayunado.']] },
      { l: [[0, '¿Mate?'], [1, 'Amargo, si hay.'], [0, 'Hay, pero lavado.'], [1, 'Igual.']] }
    ],
    camino: [{ l: [[0, '¿Es cierto que hay lobos en el camino del castillo?'], [1, 'Mi cuñado vio tres. Uno le hizo señas.']] }],
    brumavieja: [
      { l: [[0, '¿Fue {el/la} forastero a Brumavieja?'], [1, 'Fue. Y por ahora volvió.']] },
      { con: ['npc7'], l: [[0, 'Anoche se vio la luz mala sobre Brumavieja.'], [1, '¡No digas eso, que después no duermo!']] }],
    victoria: [
      { l: [[0, '¿Es verdad que bajó al Nigromante de un solo golpe?'], [1, 'De dos, dicen. El primero fue para avisar.']] },
      { con: ['npc6'], l: [[0, 'Ya tengo la primera décima.'], [1, '¿Y cómo empieza?'], [0, '«Llegó {un forastero/una forastera} un día…»'], [1, 'Eso ya lo sabíamos todos, Anselmo.']] }],
    cap2: [{ l: [[0, 'Los orcos queman carretas en el este.'], [1, 'Y nosotros acá, tomando mate.'], [0, 'Alguien tiene que cuidar la yerba.']] }],
    fin: [{ l: [[0, '¿Las Torres de Escarcha? ¿Eso dónde queda?'], [1, 'Al norte del norte. Donde el frío tiene frío.']] }],
    noche: [{ l: [[0, '¿Escuchaste eso?'], [1, 'Es el viento.'], [0, 'El viento no aúlla.'], [1, 'Este sí.']] }]
  };
  const usadas = new Set();
  const elegirCharla = (S, a, b) => {
    const tr = tramo(S.story), lista = [...(CHARLAS[tr] || []), ...(esNoche(S) ? CHARLAS.noche : []), ...CHARLAS.siempre];
    const buenas = lista.filter(c => !usadas.has(c) && (!c.con || (c.con[0] === a.id && (!c.con[1] || c.con[1] === b.id)) || (c.con[0] === b.id && (!c.con[1] || c.con[1] === a.id))));
    const propias = buenas.filter(c => c.con);
    const c = propias.length ? UNO(propias) : UNO(buenas.filter(x => !x.con));
    if (!c) { usadas.clear(); return null; }
    usadas.add(c);
    const quien = c.con && c.con[0] === b.id ? [b, a] : [a, b];
    return c.l.map(([k, t]) => [quien[k], txt(S, t)]);
  };
  const charlar = async (S, a, b) => {
    const lineas = elegirCharla(S, a, b);
    if (!lineas) return;
    S._ckCharla = true;
    congelados.add(a.id); congelados.add(b.id);
    a.sprite.setFlipX(b.sprite.x < a.sprite.x); b.sprite.setFlipX(a.sprite.x < b.sprite.x);
    [a, b].forEach(n => { const k = n.id + '_idle'; if (S.anims.exists(k)) n.sprite.play(k, true); });
    for (const [n, t] of lineas) {
      if (S.currentInterior || S._ckEscena) break;
      await E.globo(S, n.sprite, t, 1300 + t.length * 38, 46);
      await E.esperar(180);
    }
    if (!S.dialogOpen) { congelados.delete(a.id); congelados.delete(b.id); }
    S._ckCharla = false;
  };
  const buscarCharla = S => {
    if (S.currentInterior || S.dialogOpen || S._ckEscena || S._ckCharla || !S.campaignNPCs || !S.player) return;
    if (S.time.now - (S._ckUltCharla || -1e9) < 24000) return;
    const libres = S.campaignNPCs.filter(n => n.sprite && n.sprite.visible && n.sprite.alpha > 0.9 && GENTE[n.id] && (!n.vida || n.vida.modo === 'ruta'));
    for (let i = 0; i < libres.length; i++)
      for (let j = i + 1; j < libres.length; j++) {
        const a = libres[i], b = libres[j];
        if (Phaser.Math.Distance.Between(a.sprite.x, a.sprite.y, b.sprite.x, b.sprite.y) > 78) continue;
        const mx = (a.sprite.x + b.sprite.x) / 2, my = (a.sprite.y + b.sprite.y) / 2;
        if (Phaser.Math.Distance.Between(mx, my, S.player.x, S.player.y) > 170) continue;
        S._ckUltCharla = S.time.now;
        charlar(S, a, b);
        return;
      }
  };

  // ================================================================== RUTINA: LA SIESTA
  const SIESTA = ['npc6', 'npc7', 'npc4'];
  const siesta = S => {
    const V = window.CK_VIDA;
    if (!V || !V.irA || S.currentInterior || !S.dayPhase) return;
    const p = S.dayPhase(), dia = Math.floor((S.dayClock || 0) / 300000);
    if (p < 0.24 || p > 0.3 || S._ckSiesta === dia) return;
    S._ckSiesta = dia;
    SIESTA.forEach(id => {
      const n = npcDe(S, id);
      if (!n || !n.vida || n.vida.modo !== 'ruta' || congelados.has(id)) return;
      const d = V.puertaDe(S, V.CASA[id] || 'casa');
      if (d && V.irA(S, n, d, 'casa')) E.globo(S, n.sprite, UNO(['Hora de la siesta…', 'Me voy a recostar un rato', 'La siesta es sagrada']), 2200, 46);
    });
  };

  // ================================================================== EVENTOS
  // la payada de Anselmo al volver de Brumavieja con el Nigromante vencido
  const payada = async S => {
    const f = S.story.flags;
    if (f.ev_payada || S.story.step < 7 || S.currentInterior) return;
    const an = npcDe(S, 'npc6');
    if (!an || !an.sprite.visible || (an.vida && an.vida.modo !== 'ruta')) return;
    f.ev_payada = true;
    if (S.saveStory) S.saveStory();
    congelados.add('npc6');
    const hecho = await E.correr(S, async () => {
      await E.camara(S, an.sprite.x, an.sprite.y - 20, 1100);
      mirar(S, an);
      await E.globo(S, an.sprite, '¡Silencio, que voy a cantar!', 1800, 46);
      const otros = S.campaignNPCs.filter(n => n !== an && n.sprite.visible && GENTE[n.id] && Phaser.Math.Distance.Between(n.sprite.x, n.sprite.y, an.sprite.x, an.sprite.y) < 220);
      await E.dialogo(S, 'Don Anselmo, payador', [
        'Pido permiso, señores, para cantar lo que vi:',
        txt(S, '{Un forastero/Una forastera} aquí llegó con lluvia y temores.'),
        'Bajó a la niebla, a lo oscuro, donde el muerto no descansa,',
        'y nos trajo la esperanza… y al Nigromante en apuro.',
        txt(S, 'Y si alguno me pregunta cómo se llama {el/la} valiente,'),
        txt(S, 'le digo: «{h}», mi gente… y que el vino no se junta.'),
        '¡Aplausos, que la rima costó!'
      ], 'npc6_villager');
      otros.slice(0, 3).forEach((n, k) => setTimeout(() => E.globo(S, n.sprite, UNO(['¡Bravo!', '¡Otra, otra!', '¡Eso, Anselmo!', 'La última no rimó…']), 1800, 46), k * 350));
      await E.esperar(1500);
    });
    congelados.delete('npc6');
    if (!hecho) f.ev_payada = false;
  };
  // el chisme del primer día, al salir de la posada
  const primerDia = S => {
    const f = S.story.flags;
    if (!f.intro || f.ev_chusma || S.currentInterior) return;
    const m = npcDe(S, 'npc13');
    if (!m || !m.sprite.visible || Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, S.player.x, S.player.y) > 210) return;
    f.ev_chusma = true;
    const c = npcDe(S, 'npc14');
    (async () => {
      await E.globo(S, m.sprite, txt(S, '¡Ahí sale {el/la} de la posada! ¡{El/La} que mandó llamar el Rey!'), 2800, 46);
      if (c && c.sprite.visible) await E.globo(S, c.sprite, txt(S, 'Dejal{o/a} tranquil{o/a}, Mateo, que recién se levanta.'), 2600, 46);
    })();
  };
  // la luz mala: de noche, en Brumavieja, una luz que flota y se escapa
  const luzMala = S => {
    const zona = S.currentZoneKey && S.currentZoneKey();
    const quiere = zona === 'ruins.village' && esNoche(S);
    if (!quiere) { if (S._ckLuz) { S._ckLuz.destroy(); S._ckLuz = null; } return; }
    const a = S.currentInterior.area;
    if (!S.textures.exists('ck_luzmala')) {
      const t = S.textures.createCanvas('ck_luzmala', 32, 32), c = t.getContext(), g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, 'rgba(230,255,220,1)'); g.addColorStop(0.3, 'rgba(150,255,170,0.55)'); g.addColorStop(1, 'rgba(80,200,120,0)');
      c.fillStyle = g; c.fillRect(0, 0, 32, 32); t.refresh();
    }
    if (!S._ckLuz || !S._ckLuz.active) {
      const SITIOS = [[160, 330], [300, 420], [820, 300], [880, 420], [620, 470], [90, 200]];
      const [x, y] = UNO(SITIOS);
      S._ckLuz = S.add.image(a.x + x, a.y + y, 'ck_luzmala').setBlendMode(Phaser.BlendModes.ADD).setDepth(29000).setAlpha(0);
      S.tweens.add({ targets: S._ckLuz, alpha: 0.85, duration: 1500 });
      S._ckLuz._ck = { x0: x, y0: y, t: Math.random() * 1000 };
    }
    const L = S._ckLuz, k = L._ck;
    k.t += S.game.loop.delta;
    L.setPosition(a.x + k.x0 + Math.sin(k.t / 1300) * 28, a.y + k.y0 + Math.sin(k.t / 700) * 10 - 14);
    L.setScale(0.8 + Math.sin(k.t / 260) * 0.12);
    if (!k.huye && Phaser.Math.Distance.Between(L.x, L.y, S.player.x, S.player.y) < 80) {
      k.huye = true;
      const f = S.story.flags;
      if (!f.ev_luzmala) {
        f.ev_luzmala = true;
        const n = window.CK_SIN_CARTELES_API;
        if (n) n.nota('La luz mala. Los viejos dicen que no hay que seguirla.');
      }
      S.tweens.add({ targets: L, alpha: 0, duration: 700, onComplete: () => { L.destroy(); if (S._ckLuz === L) S._ckLuz = null; } });
    }
  };
  // de noche, en la taberna: el truco
  const CANTOS = [['¡Envido!', '¡Quiero!', '¡Veintinueve!', 'Son buenas…'], ['¡Truco!', '¡Quiero retruco!', '¡Vale cuatro!', 'Me voy al mazo.'], ['Ancho de espadas, señores.', 'Uh. Me mataste.'],
    ['¿Viste {al forastero/a la forastera}? Pidió leche.', '¿Leche? ¿En una taberna?'], ['¡Falta envido!', 'No quiero. ¡No quiero!']];
  const truco = S => {
    if (S.currentZoneKey() !== 'ed_taberna_2.main' || S.dialogOpen || S._ckEscena) return;
    if (S.time.now - (S._ckTruco || -1e9) < (esNoche(S) ? 14000 : 32000)) return;
    const a = S.currentInterior.area;
    const gente = S.children.list.filter(o => o.active && o.visible && o.type === 'Sprite' && /^(npc5_villager|npc11_villager|ck_par_)/.test(o.texture.key) && o.x > a.x && o.x < a.x + a.w && o.y > a.y && o.y < a.y + a.h);
    if (gente.length < 2) return;
    S._ckTruco = S.time.now;
    let par = null;
    for (let i = 0; i < gente.length && !par; i++) for (let j = i + 1; j < gente.length; j++) if (Phaser.Math.Distance.Between(gente[i].x, gente[i].y, gente[j].x, gente[j].y) < 70) { par = [gente[i], gente[j]]; break; }
    if (!par) par = [gente[0], gente[1]];
    const c = UNO(CANTOS);
    (async () => { for (let i = 0; i < c.length; i++) { await E.globo(S, par[i % 2], txt(S, c[i]), 1500 + c[i].length * 30, 44); await E.esperar(120); } })();
  };

  // ================================================================== cada cuadro
  const upd0 = P.update;
  P.update = function () {
    const r = upd0.apply(this, arguments);
    if (this._gameMode !== 'campaign' || !this.story || this.isGamePaused) return r;
    try {
      this._ckGenteT = (this._ckGenteT || 0) + this.game.loop.delta;
      luzMala(this);
      if (this._ckGenteT < 400) return r;
      this._ckGenteT = 0;
      if (!this.currentInterior && !this._doorTransition) {
        buscarCharla(this);
        siesta(this);
        primerDia(this);
        if (!this._ckEscena && !this.dialogOpen) payada(this);
      } else truco(this);
    } catch (e) { console.warn('[gente]', e); }
    return r;
  };

  window.CK_GENTE = { GENTE, CHARLAS, GUINOS, GUINOS_LUGAR, tramo, conversar, congelados, txt };
})();
