# Cambios pendientes de integrar en D:\prueba

Lista de lo que está hecho y probado en la nube y de cuándo se copió a la PC. **14/10: integrados 1, 2 y 4 a 8** (respaldo `respaldo_antes_integrar_20261014.zip`). Al integrar: respaldo zip de `index.html` en `D:\Editor\trabajo\_respaldo_editor\`, copiar los archivos, agregar las líneas a `index.html` (después de `ck_camino_prof.js`), y tachar acá.

| # | Fecha | Qué | Archivos | Línea en index.html | Probado |
|---|---|---|---|---|---|
| 1 | 14/10 ✔ integrado | **Más historia en el Capítulo 1**: Eloy (Biblioteca), Tabernero, Ruy (fogata del camino), voz de Varek, Códice de las Brumas, epílogo con pista del Cap. 2 | `js/core/ck_historia.js` (nuevo) | `<script src="js/core/ck_historia.js?v=1"></script>` | Recorrido completo de la historia + 17 pruebas del juego |
| 2 | 14/10 ✔ integrado | **Partidas guardadas**: botón CONTINUAR en el menú, 3 ranuras con nombre (continuar / nueva / borrar), guardado automático de la historia, el lugar y el tiempo jugado; las partidas viejas pasan solas a las ranuras | `js/core/ck_partidas.js` (nuevo) | `<script src="js/core/ck_partidas.js?v=1"></script>` (después de `ck_historia.js`) | Nueva partida con nombre → cerrar → CONTINUAR vuelve al mismo mapa y lugar con el mismo avance; migración de partida vieja; escribir el nombre con teclado; 17 pruebas |
| 4 | 14/10 ✔ integrado | **Minimapa + mapa grande (M)**: dibujo en píxeles de cada zona, héroe, misión, enemigos, niebla que se destapa al explorar (se guarda con la partida), zoom y arrastre, leyenda de lugares descubiertos, camino a la misión | `js/core/ck_minimapa.js` (nuevo) | `<script src="js/core/ck_minimapa.js?v=1"></script>` (después de `ck_partidas.js`) | Aldea, camino, patio, biblioteca, salón, ruinas; abrir/cerrar con M, clic y Esc; zoom y arrastre; se esconde en diálogos; guardar → CONTINUAR conserva lo explorado; 17 pruebas + historia + partidas |
| 5 | 14/10 ✔ integrado | **Motor de luz** (aprobado, halo suave): mapa de luz en todo el juego. Afuera: noche y clima; adentro: cada sala en penumbra (más de noche) con velas, chimeneas y antorchas alumbrando; ruinas siempre en penumbra. Fuentes automáticas: luces del editor (también las que se agreguen), todos los brillos del juego (`fx_glow`: antorchas, braseros, candelabros), aldea, fogatas, habilidades | `js/core/ck_luz.js` (nuevo) | `<script src="js/core/ck_luz.js?v=1"></script>` (después de `ck_minimapa.js`) | Aldea, camino, patio de noche, aposentos, biblioteca, taberna, ruinas; bola de fuego y rayo; 17 pruebas + historia + minimapa. Apagar: `?ck_sin_luz=1` |
| 6 | 14/10 ✔ integrado | **Clima**: despejado, nublado, lluvia, tormenta (relámpagos que iluminan todo + truenos), nieve y niebla; cambia solo cada 1½–3 min con transición; ruinas tiran a niebla/tormenta y la capilla del Nigromante siempre con tormenta; nubes y tormenta oscurecen y prenden las luces de día; lluvia y viento con sonido hecho por código (apagado adentro); clima en el recuadro del objetivo | `js/core/ck_clima.js` (nuevo) | `<script src="js/core/ck_clima.js?v=1"></script>` (después de `ck_luz.js`) | Los 6 climas de día y lluvia de noche en la aldea, ruinas, cambios y relámpago; 17 pruebas. Probar: `?ck_clima=tormenta` o F8 |
| 7 | 14/10 ✔ integrado | **Clima, segunda parte**: con lluvia fuerte las fogatas, braseros y antorchas de afuera se apagan de a uno (llama fuera, carbón con brasas dibujado por código, humo, sin luz) y se vuelven a prender cuando para; gotas que rompen en el piso (corona de 4 cuadros) y anillos en el agua según el dibujo del mapa; **nieve que se acumula**: piso, techos, copas, cercas y piedras se van cubriendo en 3 etapas, quedan manchas y caminos a la vista, y se derrite al parar | `js/core/ck_clima.js` (actualizado), `js/core/ck_nieve.js` (nuevo), `js/core/ck_minimapa.js` (actualizado: `terreno()`), `js/core/ck_luz.js` (actualizado) | `<script src="js/core/ck_nieve.js?v=1"></script>` (después de `ck_clima.js`) | Fogata de Ruy y de la aldea, braseros del patio; salpicaduras contadas; nieve en aldea y camino; 17 pruebas + historia |
| 8 | 14/10 ✔ integrado | **Vida y detalles** (todo por código): pájaros y palomas que se espantan, mariposas, luciérnagas que alumbran, peces bajo el agua que saltan, ranas que croan y se tiran al agua, gallinas que escapan, gato que se muda con la lluvia y de noche va a la fogata, murciélagos y cuervos; grillos y sonidos ubicados. Huellas (nieve, barro, tierra), charcos con reflejos y salpicaduras, hojas y polvo con el viento, chimeneas con humo, destellos y bruma en el agua, sombras del sol según la hora. Héroe: aliento con frío, mojado que gotea, copitos de nieve, polvo al correr y en el dash | `js/core/ck_fauna.js`, `js/core/ck_detalles.js`, `js/core/ck_heroe_fx.js` (nuevos); `ck_minimapa.js` y `ck_luz.js` (actualizados) | `ck_fauna.js`, `ck_detalles.js`, `ck_heroe_fx.js` (en ese orden, después de `ck_nieve.js`) | Aldea y camino de día, tarde, noche, lluvia y nieve; 17 pruebas (una corrida con fallas sueltas que no se repitieron en dos corridas más) + historia + partidas. **Probar en la PC que ande fluido** |
| 9 | 14/10 ✔ integrado | **Ajustes del clima**: sin lluvia adentro (goteras), lluvia que pega en techos, piso, agua y copas con su profundidad, chorritos de los aleros, rayos que caen en zonas transitables, ríos congelados con la nieve, chimeneas solo las dibujadas, huellas más suaves | `ck_luz.js`, `ck_clima.js`, `ck_nieve.js`, `ck_fauna.js`, `ck_detalles.js`, `ck_heroe_fx.js` | (las mismas líneas) | Taberna con tormenta (sin lluvia, con goteras), aldea y camino con lluvia, rayos, ríos congelados en aldea y camino; 17 pruebas + historia |
| 3 | — | **Castillo redibujado** (Patio, Aposentos, Biblioteca) | `js/core/ck_castillo.js` (se arma con `armar_castillo.py`) | (todavía no) | Falta redibujar con PixelLab (~200 créditos); el armado ya está probado con el dibujo viejo |

Ojo al integrar: en la PC el juego se abre con doble clic (file://); las imágenes embebidas en base64 dejan leer sus píxeles, pero si alguna textura viene de un archivo suelto, su nieve y su fogata apagada se saltean (sin error).

También: `TRASPASO.md` actualizado (copiar a `D:\prueba` y `D:\Editor`), scripts nuevos en `_scripts_ia\8_castillo\` y `_scripts_ia\9_minimapa\`. Arreglo menor en `ck_partidas.js`: al continuar una partida dentro del camino o el castillo, la vuelta a la aldea cae en la salida sur (x 540).

## Anotado para hacer (14/10)

**UI más pulida:** en espera de ver la UI real (en la nube faltan las imágenes de `assets/UI`): conectar la PC o mandar capturas del HUD, el menú y un diálogo.

**Pulido propuesto (en orden sugerido):**
1. Cierre del Capítulo 1: pantalla de resumen (tiempo, bestias, monedas, nivel), créditos y adelanto del Capítulo 2.
2. Diario de la historia: página del libro que se escribe sola con lo que va pasando.
3. Primeros minutos guiados: carteles de una sola vez ("T para hablar", "Espacio para atacar"…).
4. Sensación de golpe: parpadeo al recibir daño, micro-pausa al pegar, números de daño, monedas que saltan.
5. 2–3 misiones secundarias cortas en la aldea.
6. Estética: castillo (preparado), después ruinas e interiores.
7. Sonido para Eloy, Ruy y Varek, y música del final.
8. Partida completa de punta a punta midiendo tiempo y dificultad.
9. Probar en otra PC (doble clic, tiempo de carga).
10. Paquete de entrega: zip limpio, LEEME para el curso, GIF o video.

**Transiciones coherentes entre mapas (el dueño va a sumar mapas y dar indicaciones; se corrige después):**
- Regla: se aparece del lado por el que se viene. Si salís de un mapa por el sur, entrás al otro por el norte, y al volver aparecés en el mismo borde por el que saliste.
- Hoy está mal, por ejemplo:
  - Aldea → Camino al Castillo: se sale por el sur de la aldea y se aparece en el **oeste** del camino. Al volver por el oeste del camino se aparece en el **sur** de la aldea.
  - Patio del Castillo → Patio de Armas: se sale por la puerta **oeste** del patio y se aparece **abajo** del Patio de Armas.
- Idea para hacerlo bien: una tabla única de conexiones (mapa, borde o puerta de salida → mapa, punto de llegada y borde de llegada) y una prueba automática que la recorra y avise cuando un borde no coincide. Así, al agregar mapas, se carga la conexión en un solo lugar.
