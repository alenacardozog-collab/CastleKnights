# Historial del proyecto — CastleKnight y su editor

> Este es el traspaso viejo completo (día por día, hasta el 12 de octubre de 2026). El traspaso que hay que leer primero es `TRASPASO.md`; acá está el detalle y el porqué de cada cosa.

Estado al 10 de octubre de 2026 (madrugada). Este archivo es para que otra sesión de Claude (o el propio dueño) retome el trabajo sin la conversación original. Leelo entero antes de tocar nada. Hay una copia idéntica en `D:\Editor` y en `D:\prueba`.

---

## 1. Quién y para qué

- **Dueño:** animador 2D y 3D, de Argentina. Habla en español rioplatense, escribe corto y directo. Está aprendiendo pixel art (Aseprite, Pyxel Edit).
- **Proyecto:** **CastleKnight**, un RPG top-down en Phaser 3. Es el proyecto final de un curso.
- **Entrega:** fines de noviembre de 2026.
- **Qué busca:** acabado profesional y una **estética homogénea** en todo el juego. No quiere depender de pagar créditos de IA para cada asset; por eso se construyó un editor propio.
- **Cómo trabaja:** pide las cosas de a tandas, a veces mientras se trabaja en otra. Quiere vistas previas antes de que se guarde algo importante. Valora que se le diga con honestidad qué se probó y qué no. **Responder siempre en español** (una vez se le contestó en inglés y lo marcó).

## 2. Las dos carpetas (las dos son repos git del dueño)

| Carpeta | Qué es |
|---|---|
| `D:\prueba` | El juego. Tiene que seguir abriendo con doble clic en `index.html` (sin servidor). `npm run check` verifica la estructura. |
| `D:\Editor` | El editor ("AcePixelStudio"). Se abre con doble clic en `editor.html` (o `index.html`, que es igual) en Chrome o Edge. |

No hagas commits ni push salvo que lo pida. Cada cambio queda pendiente de commit para que él lo revise.

**`index.html` y `editor.html` del editor:** siguen siendo dos archivos casi iguales (el dueño no decidió todavía si dejar uno). Si agregás un `<script>`, agregalo en los dos. Ya están sincronizados.

## 3. El editor (`D:\Editor`)

- HTML + JavaScript clásico, sin módulos ni build. Todo cuelga de `CK`. Textos en español rioplatense. Cada botón con tooltip (`CK.btn({ tip, desc })`).
- Corre desde `file://`. Guarda en IndexedDB y en disco con la File System Access API (carpetas "editor" y "juego").
- Archivos: `editor.html` (lista de scripts), `js/core/*` (núcleo), `js/secciones/*` (una por sección), `juego/editor_loader.js` (el cargador que se copia al juego), `herramientas/` (CLI de Node), `docs/Manual_Taller_CastleKnight.pdf` (desactualizado).
- **Nuevo hoy — `js/core/animjuego.js` + pestaña Animar → Juego:** lee las hojas de sprites embebidas en el juego (sin ejecutar su código: busca los `data:image/png` y los `load.spritesheet(...)`), las trae como hoja del proyecto, se retocan cuadro a cuadro en Pixel art y "Devolver al juego" reemplaza la imagen en el mismo `.js` (todas sus apariciones) y en el PNG si existe, con respaldo en `trabajo/<proyecto>/respaldo/`. El botón "Devolver al juego" también está en Pixel art, al lado de la tira de cuadros. Encuentra 57 animaciones y ~457 imágenes sueltas. Probado de punta a punta en copia (traer → pintar → devolver → el archivo del juego queda válido y con la imagen nueva).
- `.gitignore`: ignora `trabajo/_*/` (carpetas de trabajo y respaldos), `trabajo/**/respaldo/` y `versiones/`.

## 4. El juego (`D:\prueba`)

- Scripts clásicos cargados en orden desde `index.html`. Phaser 3.80.1 por CDN. El arte va embebido en base64 (desde `file://` no se cargan imágenes sueltas). **Arte nuevo también tiene que ir embebido.**
- Guía de estructura: `docs/ESTRUCTURA.md` (tiene una sección "Taller" con todo lo agregado).

### Lo que agrega el Taller (todo reversible; borrar el archivo lo saca)

| Archivo | Para qué |
|---|---|
| `js/editor_loader.js` | Cargador (copia idéntica en `D:\Editor\juego\`). Lee lo exportado por el editor, los paseantes de la aldea y el escenario de práctica. Envuelve `preload`, `create`, `update`, `updateStory`, `startPractice`, `startCampaign`, `musicForZone` y `music.play` sin tocar (y carga `ck_sonido.js`) los archivos del juego. |
| `js/maps/data/editor_prueba.js` | Panadero y herrero paseando por la aldea, 4 direcciones + idle. Escala 0,6667. Solo visibles en la aldea (no en Práctica ni en interiores). |
| `js/maps/data/editor_practica.js` | Escenario del **modo práctica** (ver sección 6). |
| `js/core/ck_dialogo.js`, `ck_fx.js`, `js/maps/data/editor_data.js`, `editor_assets.js` | Charla de NPC, partículas, y lo que exporta el editor (hoy vacío). |
| `js/dev_off.js` | Apaga el modo dev (pedido del dueño). Borrar su línea en `index.html` lo vuelve a encender. |
| `assets/taller/` | Fuentes: 107 objetos (`props/prop_###.png`), la casa, su humo y su puerta, vistas previas. |
| `assets/characters/panadero/`, `herrero/` | Hojas finales de los dos NPC nuevos (walk 8 cuadros, idle 4 cuadros, por dirección, con `.json`). |

- `scripts/check.js` se ajustó para reconocer los archivos que el cargador inyecta con `document.write` (antes los daba como error). Pasa "OK".
- **Optimización:** las imágenes embebidas de `assets_data.js`, `chars_assets.js`, `castle_assets.js`, `ruins_assets.js`, `map_assets_base64.js`, `interior_assets.js`, `hero_*`, `king_assets.js` se recomprimieron sin pérdida (verificado píxel a píxel): 7,6 MB → 5,9 MB. Respaldo de los originales en `D:\Editor\trabajo\_respaldo_juego\optimizacion\`.

## 5. Personajes nuevos (panadero y herrero)

- Láminas generadas por IA → limpiadas con el pipeline del editor: tamaño real, paleta común, contorno de 1 px, pulido de silueta (sin píxeles sueltos, espinas ni bultos).
- **Escala 0,6667:** con el zoom 1,5 de la aldea y de Práctica da 1 píxel de dibujo por píxel de pantalla. Con 0,6 el juego se comía filas (por eso "un ojo negro" y "cabeza cortada" que vio el dueño).
- **Caminata de frente y espalda:** hecha por capas (piernas alternan, brazo contrario, rebote de 1 px). La de PixelLab deformaba el cuerpo. **Perfil:** panadero = su 3/4 de PixelLab (pies corregidos); herrero = perfil de PixelLab. Ojo: el este del panadero es 3/4 y el del herrero perfil puro (se nota lado a lado).
- **Idle:** respiración de 4 cuadros a 5 fps. El de perfil del panadero sale del cuadro con piernas juntas.
- El dueño mandó una lámina nueva del panadero de frente (8 poses). Está convertida en `D:\Editor\trabajo\_panadero_walk\panadero_walk_sur_lamina.png` y comparada en `preview_lamina_vs_actual.gif`: tiene más vida pero la IA redibuja el gorro y la cara en cada cuadro. **No respondió si la usa.**

## 6. Modo práctica: campo de entrenamiento (hoy)

- Suelo armado en tiempo de ejecución con los tilesets de la aldea (`Tileset_Ground` y `Tileset_Road`, embebidos en el archivo): pasto con las mismas variantes que la aldea y plaza + caminos con bordes correctos (autotile aprendido de los caminos reales de la aldea: 39 configuraciones).
- 67 objetos de `assets/taller` acomodados alrededor de una plaza central despejada para el combate: casa al norte, patio con caseta y heno, herrería, carpas, fogón, arquería, muñecos y armeros al sur. 55 colisiones.
- **Casa animada:** humo en bucle (12 cuadros, dibujado cuadro a cuadro: el de PixelLab parecía piedras y se descartó) y puerta de 6 cuadros que se abre al acercarse el héroe y se cierra al alejarse (dibujada en el editor: la hoja se angosta sobre la bisagra y muestra el interior oscuro).
- Práctica pasa a zoom 1,5 (antes 1,45) para que el pixel art quede nítido.
- Probado en copia: arma todo, sin errores; campaña sigue igual y limpia lo de práctica.
- Las posiciones están en `editor_practica.js` (`objetos: [{img, x, y, solido:[w,h]}]`, `y` = donde apoya).

## 7. Assets extraídos (hoy)

- Lámina de objetos de campamento (versión con damero y versión PNG fondo negro): forma sacada del PNG, color del JPG (mejor), sombras pegadas quitadas y reemplazadas por una elipse semitransparente igual para todos, paleta común, huecos y partes "vistas a través" (soportes de armas, techo de la caseta) resueltas.
- Casa: grilla exacta de 6 px; dos versiones (`casa_con_base.png` con su isla de pasto; `casa.png` sola con sombra). Humo sacado del dibujo (va animado aparte).
- Pendientes de retoque a mano: `prop_009` (soporte de armas, manchas grises), grupos que vinieron pegados en la lámina (027 pila de cajas, 028 corral).

## 7b. Música (9 de octubre)

- Compuesta con ElevenLabs (`compose_music`, 11 generaciones). Originales y pruebas en `D:\Editor\trabajo\_musica\` (`zonas\` tiene los bucles por zona).
- **Bucles:** el punto de corte se busca con un script (tempo por autocorrelación, cortes en compases enteros, ajuste a la muestra, fundido de 40 ms). Volumen parejo con ganancia fija (sin compresión dinámica, para que no salte el nivel en la costura). MP3 160 kbps. Chrome recorta el relleno del MP3, así que el bucle no deja hueco (medido: < 1 ms).
- **Archivos en `assets/Music/`:** `IntroSong.mp3` (menú), `villageSong.mp3` (aldea de día), `noche.mp3` (aldea de noche), `taberna.mp3` (interior `bar`), `castle.mp3`, `ruins.mp3`, `boss.mp3` (los nombres que el juego ya buscaba) y `practica.mp3`. Los dos originales del juego están en `D:\Editor\trabajo\_respaldo_juego\musica\`.
- **Menú:** a pedido del dueño volvió la canción original (`IntroSong.mp3`); la del menú de ElevenLabs quedó en `_musica\zonas\menu_loop.mp3`.
- **Práctica:** se usó la variante B más lenta (`practica_b_lenta_loop.mp3`, ~94 BPM). La C (90 BPM) está en `_musica` por si el dueño prefería esa: basta con copiarla encima de `practica.mp3`.
- **Código (`editor_loader.js`, sección 7):** `musicForZone` devuelve `taberna` dentro del bar y `noche` en la aldea de noche. Precarga los temas y cambia de tema con un fundido (0,7 s sale, 0,9 s entra) en vez del corte seco. Práctica arranca `practica`.
- Probado en copia (Chromium sin pantalla): cada zona activa su tema, el fundido funciona y no hay errores. **No se escuchó**: falta que el dueño confirme cómo suena.
- Los MP3 que llegan a la PC pesan ~5,8 KB más (metadatos C2PA en la etiqueta ID3); el audio es idéntico.

## 7c. Sonido del Taller (9 de octubre)

- **Archivos:** `js/core/ck_sonido.js` (motor) y `js/maps/data/editor_sonidos.js` (54 sonidos cortos embebidos en base64, 854 KB), inyectados por `editor_loader.js`. Ambientes nuevos en `assets/audio/sfx/`: `amb_aldea_dia`, `amb_aldea_noche`, `amb_taberna`, `amb_granero`, `amb_ruinas`.
- **Por qué embebidos:** desde `file://` Chrome no deja pasar archivos de audio por Web Audio (sale silencio), y la reverberación necesita Web Audio.
- **Reverberación por lugar:** respuesta al impulso generada en el momento (11 salas: aire, bosque, casa, taberna, granero, piedra, patio, salón del trono, cocina, madera, ruinas), elegida por zona. Pasa por ella lo nuevo: pasos, voces, pluma, puertas, respiración y eventos. Los sonidos de combate siguen igual (secos).
- **Diálogos:** cada línea suena con una voz balbuceada según el personaje (rey, reina, princesa, soldado, monje, viejo, vieja, mujer, aldeano, jovial, joven; se elige por nombre o cara) y una pluma que raspa mientras se escribe el texto. La voz dura lo que tarda en escribirse la línea y se corta si se saltea.
- **Respiración:** con poca energía (<30 %) o con 1 corazón. Soldado y Aby = joven (Aby un poco más agudo), mago = viejo, orco = orco.
- **Pasos:** 13 pasos de piedra nuevos al azar (castillo, tienda); pasto, madera y tierra son los de antes, ahora con la sala.
- **Puertas y mapas:** casas = abre + cierra; castillo/ruinas y áreas abiertas = transición; puertas entre salas del castillo sin chirrido = abre/cierra; la puerta de la casa de práctica ahora cierra con su sonido (antes pedía `door_open`, que no existe).
- **Ambientes:** aldea de día con pájaros sueltos, de noche grillos y búho, taberna con risas, granero con vaca, ruinas con viento y cuervos, casa/tienda con fuego bajo. El castillo usa los que ya tenía.
- Originales de ElevenLabs en `D:\Editor\trabajo\_sonidos\` (y `voces\`), recortes en `recortados.zip`, script de corte `proc.py`. Se gastaron 32 generaciones de efectos. La voz por texto (TTS) no se puede: a la clave le falta el permiso `voices_read`.
- Probado en copia (Chromium sin pantalla): se decodifican los 54, cada zona pone su sala y su ambiente, voces/pluma/respiración/puertas/pasos disparan. **No se escuchó.**

## 7d. Editor: tarea 2 (9 de octubre)

- **Clic derecho en todo el editor** (`js/core/menu.js`, nuevo): menú con acciones rápidas. Funciona sobre cualquier asset de cualquier galería (abrir en Pixel/Animar, renombrar, duplicar, carpeta, etiquetas, categoría, bajar PNG, borrar con deshacer), sobre los cuadros de la línea de tiempo, la vista de Animar, el lienzo de Pixel (con herramientas de selección), los cuadros y las capas de Pixel, las poses y la Biblioteca.
- **Biblioteca** (`js/secciones/biblioteca.js`, nueva, en el riel debajo de Estilo): todo el proyecto por categoría (sprites, animaciones, personajes, efectos, mapas, tiles), con carpetas y subcarpetas (campo `carpeta` en assets, fx, mapas y poses), búsqueda por nombre, carpeta o etiqueta, orden, miniaturas que se animan al pasar el mouse, ficha con vista grande y "dónde se usa". Selección múltiple con Ctrl/Mayús; F2 renombra; Supr borra; soltar archivos importa.
- **Animar** (`anim.js` reescrito):
  - **Vista con zoom**: rueda, + / −, 0 = ver todo, barra espaciadora, botón del medio o arrastrar para moverse. Grilla de píxeles, papel cebolla en pausa y fondos.
  - **Línea de tiempo**: arrastrar para reordenar, borde derecho para alargar un cuadro (duración propia en `cuadros.dur`, ms por cuadro; Mayús sin redondear), Ctrl+D, Ctrl+C/V, Supr, Alt+flechas para mover, soltar PNG para insertar, menú de clic derecho. Todo con deshacer. Las duraciones salen en el JSON de atlas, en el GIF y en el juego (el cargador las pasa a Phaser como `duration` por cuadro).
  - **Efectos para probar**: se superponen efectos del proyecto, plantillas u hojas de efecto (`a.fxPrueba`), con posición (o "Ubicar con el mouse"), tamaño, delante/detrás y cuadro de inicio. "Guardar con los efectos" hornea una hoja nueva.
  - **Sprites a poses** (pestaña Personaje, o el botón de la izquierda): se eligen archivos o una carpeta y se reparten solos por el nombre (acción, dirección, número de cuadro; también tiras). Muestra una tabla para corregir antes de crear; los que no entiende quedan sin marcar. Alinea por los pies y deja todo el personaje del mismo tamaño. Acción nueva "Correr".
- **Pixel art**: herramienta **Transformar (T o Ctrl+T)** con manijas: esquinas escalan (Mayús: proporcional), bordes estiran, afuera o la manija de arriba rotan (Mayús: de a 15°), adentro mueve; Enter aplica, Esc cancela. Menú con rotar 90/180/45/15, escalar ×2/×3/½, voltear, "Transformar con números…" y "Giro limpio (RotSprite)" (Scale2x ×3 antes de girar). Nunca inventa colores.
- **FX con contorno**: en Efectos, bloque "Contorno" (grosor 1–8, color, esquinas redondeadas o cuadradas, opacidad) y en cada capa de partículas "El del efecto / Sin contorno / Uno propio". Lo dibuja `fxsim.js` (se copió igual a `D:\prueba\js\core\ck_fx.js`), así que se ve igual en el juego.
- `gif.js` acepta duraciones por cuadro (`delays`). `exportar.js` exporta `dur`.
- Respaldos de lo que había: `D:\Editor\trabajo\_respaldo_editor\tarea2\` y `_respaldo_juego\tarea2\`.
- Probado en copia con Chromium sin pantalla (todas las secciones abren sin errores; línea de tiempo, efectos, poses, biblioteca, transformar y contorno funcionando). **No probado en la PC del dueño.**

## 7e. Editor: orden del código y pruebas (9 de octubre, bloque 1)

- Todo el JS del editor quedó formateado con Prettier (`.prettierrc.json`: ancho 140, comillas simples).
- Los scripts se cargan desde una sola lista: `js/cargar.js`. `editor.html`, `index.html` y `pruebas.html` solo incluyen ese archivo. **Un archivo nuevo se agrega ahí.**
- Animar y Pixel art están partidos en carpetas (`js/secciones/anim/` y `js/secciones/pixel/`), que comparten `CK._anim` y `CK._pixel`. `anim.js` y `pixel.js` quedaron vacíos: se pueden borrar a mano.
- **Pruebas:** doble clic en `D:\Editor\pruebas.html` y en `D:\prueba\pruebas.html` (este último pide un clic para el audio). Salen en verde o rojo.

## 7f. Editor: ventanas, capas, marcar para animar y tiles (9–10 de octubre)

- **Secciones en pestañas arriba** (barra horizontal). Clic derecho sobre una pestaña: "Abrir en una ventana aparte", o arrastrarla hacia abajo. La ventana se mueve desde su barra y se encaja en la mitad izquierda, la derecha o la pantalla completa (soltándola contra un costado, o con los botones de la barra). Así se trabajan dos secciones a la vez. Recuerda dónde estaba cada ventana. "Secciones a la izquierda, como antes" (clic derecho) vuelve al riel vertical.
- **Otra pantalla:** clic derecho en la pestaña → "Llevar a otra pantalla" (o el botón del monitor en la barra de una ventana interna). La sección pasa a una ventana del navegador aparte que se arrastra al segundo monitor; al cerrarla vuelve sola a la principal. Recuerda en qué lugar y de qué tamaño estaba. Los menús, diálogos, avisos e indicadores salen en la ventana donde se trabaja (`CK.doc()`); las teclas se reenvían a la principal; las animaciones usan `CK.raf` para seguir andando aunque la principal esté minimizada. Código: `CK.aOtraPantalla` en `app.js`. Si el navegador bloquea ventanas emergentes, hay que permitirlas para esa página.
- **Botón Volver** (flecha antes del nombre del proyecto, o Alt + ←): vuelve a la sección anterior.
- Código: `js/app.js` (`CK.flotar`, `CK.pegarSeccion`, `CK.volver`, `CK.seccionVisible(id)`). Las secciones usan `CK.seccionVisible('x')` en lugar de `CK.seccion_actual === 'x'`, porque ahora puede haber dos a la vez. Las teclas van a la sección con foco (`CK.foco`).
- **Paneles con pestañas apiladas**: Propiedades, Capas y los demás se ven uno debajo del otro y se recorren con la rueda, sin hacer clic en cada pestaña. Se siguen pudiendo despegar.
- **Capas con carpetas** (`js/core/capas.js`, en Mapa y Pixel art): arrastrar para subir o bajar, soltar sobre una carpeta para meterla, clic derecho para crear o sacar de una carpeta. En Efectos, las filas de la línea de tiempo se arrastran por el nombre.
- **FX visibles en el mapa:** los puntos de efecto se dibujan en vivo en el editor de mapas (antes no se veían).
- **Marcar para animar** (`js/core/marca_anim.js`): la herramienta M del mapa abre una ventana con el dibujo grande, un pincel gris semitransparente (tamaño y opacidad), goma, balde (marca toda la parte del mismo color), Todo / Nada / Invertir, deshacer, y la nota escrita. La zona se guarda en `marca.mascara = { w, h, rle }`. En Animar → Generar se ve "Zona marcada" con "Editar zona" y "Mover solo lo marcado": `PIX.animate(..., { mascara })` mueve solo lo pintado y lo demás queda igual en todos los cuadros. La zona también sale en Notas para Claude y en el JSON de exportación (`zona`).
- **Tiles más profesional:**
  - **Importar tiles** (`js/core/tiles.js`, en Texturas → Tileset, en la lista de Guardadas y en la capa de Tiles del mapa): corta hojas PNG con tamaño, margen y separación (adivina el tamaño); quita piezas vacías o repetidas; lleva al tile y a la paleta del proyecto; acepta varias imágenes juntas.
  - **Texturas → Tileset**: ver la hoja con números, elegir piezas (Mayús y Ctrl), girar, espejar, duplicar, correr antes o después, borrar, pieza vacía, sumar piezas de otra hoja, quitar repetidas, columnas y zoom. Muestra la pieza elegida repetida 3 × 3 para ver las costuras. **Si cambia el orden o se borra una pieza, lo pintado en los mapas se acomoda solo**, con deshacer. Los tilesets de bordes automáticos (wang16) no se reordenan.
  - **Mapa, capa de Tiles**: arrastrar en el selector elige un bloque de piezas (sello) que se pinta como patrón; girar (R) y espejar (F, Mayús + F) lo que se pinta; Alt + clic en el mapa toma la pieza; vista previa de las piezas bajo el cursor; zoom del selector. El giro se guarda en los bits altos de cada celda (`CK.mapa.TXF`: pieza + 1 en los 12 bits de abajo, 4096 espejo horizontal, 8192 vertical, 16384 giro). El juego no cambia, porque el suelo se exporta horneado en PNG.
- ~~Dos estilos de interfaz / Taller medieval~~: **sacado el 10 de octubre** a pedido del dueño (no le gustó). `css/tema_taller.css` quedó vacío (no se puede borrar desde la nube); ya no lo enlaza ningún html. Ver 7g.
- Respaldo de lo que había: `D:\Editor\trabajo\_respaldo_editor\antes_ventanas_tiles.zip`.
- Pruebas del editor: 14 de 14 en verde (`pruebas.html`; se sumaron volver/ventanas, zona de animación y tiles). Probado con Chromium sin pantalla, por http y abriendo el archivo directo. **No probado en la PC del dueño.**

## 7g. Editor: los 30 puntos (10 de octubre)

Respaldo de lo que había antes: `D:\Editor\trabajo\_respaldo_editor\respaldo_antes_de_todo_20261010.zip` (incluye los dos archivos del juego).

- ~~**Jugar**~~ (el juego dentro del editor): **sacado el 10 de octubre a la noche** a pedido del dueño. `js/secciones/jugar.js` quedó vacío (no se puede borrar desde la nube). Probar / F5 volvió a abrir el juego en otra pestaña (`CK.juego.probar`, `CK.juego.direccionPrueba`), empezando en el último mapa abierto. Ver 7h.
- **Eventos por cuadro** (`js/secciones/anim/eventos.js`): en la línea de tiempo de Animar, a cada cuadro se le pone sonido, fx, golpe o aviso. Se exportan en `D.eventos`; el juego los dispara con un parche en `Phaser.Animations.AnimationState.prototype.setCurrentFrame` dentro de `editor_loader.js` (anota en `window.CK_EVENTOS`).
- **Interfaz** (`js/core/tema.js`, botón de la barra, `localStorage ck_interfaz_v2`): Modo simple / completo (en simple se ocultan `.avanzado` y se pliegan los "Ajuste fino" con `CK.masOpciones` / `CK.plegar`), Tamaño 90–140 % (zoom del documento), Cursores elegantes (SVG propios → PNG 1x/2x, `CK.cur(nombre, herr)`), ver recorridos y Ver errores.
- **Mismas teclas** para las mismas herramientas en Mapa, Pixel y Texturas; **hoja de atajos** con `?` (se arma sola con los `[data-tecla]` de la sección, con buscador).
- **Secciones hermanas** (`FAMILIAS` en `app.js`): Texturas+Convertir y Revisor+Notas comparten pestaña con botoncitos para pasar.
- **Aprender** (`js/core/guia.js`): recorrido guiado la primera vez en cada sección (no aparece con `navigator.webdriver` ni en pruebas.html), 23 recetas "¿Cómo hago…?", proyecto de ejemplo ("Ejemplo para practicar"), pantallas vacías que explican (`CK.vacioSobre`), textos más claros.
- **Buscador Ctrl+K** (`js/core/buscador.js`): secciones, botones, assets, mapas, fx, NPC y recetas.
- **Historial** (botón en la barra): lista de pasos; clic para volver a uno (`CK.irAlPaso`).
- **FX en dos niveles** (`js/secciones/fx_simple.js`): "Lo principal" (intensidad, tamaño, velocidad, duración, tono sobre `e.base`/`e.macro`), elegidores con dibujos, Variar y "probadas"; todo lo de antes en "Ajuste fino". El exportador quita `base` y `macro`. Igual idea en Texturas, Animar → Generar y NPC.
- **Autotile para cualquier tileset** (`js/core/tiles.js`, Texturas → Tileset → "Bordes automáticos"): arma un wang16 (`bordes_<nombre>`) desde 16 piezas sueltas (adivina), desde 47 o desde una hoja de RPG Maker (`TL.desdeRPGMaker`).
- **Seguridad** (`js/core/seguridad.js`): copias automáticas cada 10 min (12 en IndexedDB + `versiones/auto_*.json`, 20), aviso de dos pestañas con el mismo proyecto (BroadcastChannel), recuperar tras cierre inesperado, errores amables (`ck_errores_v1`, `trabajo/errores.txt`).
- **Revisar antes de exportar**: la ventana Exportar muestra "Qué va a cambiar en el juego" (nuevos/cambiados/quitados contra `ultimaExportacion`) y "Para revisar antes".
- **Deshacer más liviano**: las imágenes guardan solo la diferencia (`CK.difLienzo`/`aplicarDif`), los datos se reconcilian en el lugar (`CK.reconciliar`) sin perder referencias.
- **Mapas grandes y proyectos pesados**: se dibuja solo lo visible y se repinta solo la zona tocada de los tiles; las imágenes se cargan de a 8 con progreso. Un mapa de 200×200 con 4000 objetos pinta en ~3 ms.
- **Manual nuevo:** `docs/Manual_Taller_CastleKnight.pdf` (41 páginas, 25 secciones, capturas nuevas).
- **Pruebas:** editor 33 de 33 (http y archivo directo); juego 12 de 12 (se sumó eventos por cuadro). Probado con Chromium sin pantalla. **No probado en la PC del dueño.**

## 7h. Editor: luces, Modificar, sugerencias al crear (10 de octubre, noche)

Respaldo de lo que había antes: `D:\Editor\trabajo\_respaldo_editor\respaldo_antes_luces_20261010.zip` (incluye los dos archivos del juego y el manual anterior).

- **Arreglo FX:** tocar "Las partículas llevan contorno" (o cualquier cosa que redibuja el panel) cerraba el "Ajuste fino" en modo simple. Ahora `CK.masOpciones` recuerda qué quedó abierto (por sección y título) y el panel de FX conserva el scroll.
- **Sin Jugar** (ver arriba). Probar abre otra pestaña.
- **Luces** (`js/core/luces.js`): formas redonda, foco (cono), rectángulo, tira, anillo y haz de sol; color y color del borde, alcance, intensidad, suavizado, centro brillante, escalones pixel, dirección (ruedita) y apertura, ancho/alto/grosor, parpadeo, pulso, mezcla suave, "por encima de los objetos", "sigue al héroe" y "apunta hacia donde camina". 15 tipos de fábrica con dibujo (antorcha, vela, fogata, farol, ventana, luna, rayo de sol, foco, magia, cristal, lava, neón, aura y linterna del héroe, escalonada). "Guardar como luz mía" → `CK.P.luces` (aparece en Biblioteca → Luces, se modifica en una ventana con vista previa). Más luces ambiente en la pestaña Mapa (noche cerrada, cueva, tormenta, bosque).
  - Una luz **sin `forma`** es una luz vieja y se dibuja exactamente como antes (editor y juego). Al tocar algo nuevo pasa a `forma: 'punto'`.
  - **El dibujo es el mismo en el editor y en el juego:** el bloque entre `/*<luz-nucleo>*/` y `/*</luz-nucleo>*/` de `js/core/luces.js` está copiado tal cual en `juego/editor_loader.js` (hay una prueba que lo compara). Si se cambia uno, hay que copiar el bloque al otro.
  - En el juego: `P.ckLuces(area)` arma una textura por tipo de luz (canvas → `textures.addCanvas`), imagen con mezcla ADD o SCREEN, profundidad 7.26 (piso) o encima de todo; `lucesCuadro` (en `P.update`) hace parpadeo, pulso y seguir al héroe (gira con la velocidad del cuerpo). Las luces viejas siguen por `kit.light`.
  - Se exportan con todas sus propiedades (`CK.luces.props`).
- **Mapa → poner de la biblioteca en un punto** (`CK.mapa.ponerDeBib(q, o)`, `MP.elegirDeBib`): con un punto o luz elegido, botón en Propiedades; elige luces (tuyas o de fábrica), NPC (pone la ficha y su retrato como sprite), efectos, objetos o prearmados, en ese lugar, con deshacer. Al colocar un punto de NPC o efecto se ofrece solo si hay hechos (se apaga con "No preguntar más", `localStorage ck_mapa_no_ofrecer`).
- **Biblioteca → Modificar** (`js/core/edicion.js`, `CK.edicion`): botón al pasar el mouse, en el panel y en el clic derecho. Abre en su sección (sprite → Pixel art; animación → Animar o Pixel; textura/tileset → Texturas; fx → FX; mapa → Mapa; personaje → Animar) con una barra abajo: Guardar cambios / Guardar como nuevo / Descartar. Antes de empezar saca una foto (datos, imagen, capas de Pixel art); "como nuevo" duplica lo actual y devuelve el original a la foto; todo con deshacer.
  - Arreglo de paso: FX ahora completa valores al recibir `datos` (antes un deshacer podía dejar el panel con un error).
- **Sugerencias al crear** (`js/core/sugerencias.js`): 11 tipos (personaje, enemigo chico y grande, objeto chico y mediano, árbol, casa, tile, efecto dibujado, ícono, retrato) con tamaño según el tile y el **alto del héroe** (nuevo en Estilo, `estilo.altoHeroe`, 30 por defecto). Vista previa sobre un pedazo del mapa del proyecto (o pasto de prueba), al lado del héroe (`estilo.heroeRef` o un asset llamado héroe/hero/knight…, o una figura del alto del héroe), a escala. Está en "Dibujo nuevo" de Pixel art, en "Crear nuevo" (Biblioteca e Inicio) y en la pestaña **Prueba** de Pixel art (en vivo mientras dibujás); "Ver en el mapa" en la Biblioteca para cualquier asset.
- 4 recetas nuevas en "¿Cómo hago…?" (luces, poner de la biblioteca, modificar, crear del tamaño justo).
- Manual actualizado (sin Jugar; con luces, Modificar, Crear nuevo, Prueba).
- **Pruebas:** editor 39 (6 nuevas); juego 13 (luces nuevas). Probado con Chromium sin pantalla. **No probado en la PC del dueño.**

## 7i. Editor de mapas y Animar: arreglos pedidos (11 de octubre)

Respaldo de lo que había antes: `D:\Editor\trabajo\_respaldo_editor\respaldo_antes_mapas_20261011.zip` (incluye el manual anterior).

- **Transform con giro:** la caja de selección y las asas giran con el objeto (alrededor de su pie). `desrotar(o, m)` en `mapa.js` lleva el mouse al espacio del objeto sin girar: así el asa que se toca y el escalado van en el sentido del objeto.
- **Colisiones ancladas** (`mapa.js`: `anclarCol`, `desanclarCol`, `sincronizarCols`, `reanclar`, `objetoDebajo`): una colisión del mapa puede llevar `ancla` (id del objeto) y su posición relativa sin escala (`ox, oy, ow, oh`). `sincronizarCols(m)` recalcula `x, y, w, h` desde el objeto (escala, espejo y giro del centro) en cada dibujo y al exportar. Mover o estirar a mano una colisión anclada recalcula la relativa. Las nuevas dibujadas con C sobre un objeto se anclan solas (opción en Propiedades, `localStorage ck_col_anclar`). Borrar un objeto borra sus colisiones ancladas; duplicarlo las duplica. Si el objeto ya no está, la colisión queda "suelta" (no se exporta) hasta desanclarla. Propiedades de colisión: nombre, Desanclar, Anclar al objeto de abajo, Ver el objeto. En Capas, lista "Colisiones del mapa".
- **Paneles:** cada pestaña apilada es una franja dorada y cada bloque un subtítulo con marca (solo CSS). Al cambiar la selección (lienzo o lista) el panel va a Propiedades (`tabs.ir('prop')`, que ahora también hace scroll en modo apilado — `espacio.js`).
- **Renombrar:** doble clic en la lista de objetos o de colisiones; campo Nombre en Propiedades (ya estaba para objetos). Luces y colisiones con nombre lo muestran en el lienzo.
- **Asas de luces en el lienzo** (`asasLuz`, `asaLuzEn`, arrastre `luz-asa`): punta (dirección + alcance) en foco y haz, apertura del foco, alcance, ancho, alto y giro de rectángulo y tira. Se reflejan en Propiedades (evento `mapa-prop`) y tienen deshacer.
- **Info del asset:** `CK.asset.info(a, o)` (una línea) y `CK.asset.ficha(a)` (nombre, tipo, tamaño, cuadros, carpeta, fechas, origen, en qué mapas). Pestaña **Info** en Pixel art, línea + botón Info en Animar → Hoja, y la cabecera de Propiedades de un objeto del mapa.
- **Animar → Guardar…** (`CK.edicion.guardarAsset(id, foto)`): al abrir una hoja se saca una foto; Guardar pregunta Sobrescribir o Guardar como copia (la copia lleva los cambios y la original vuelve a la foto, con deshacer). Generar: si ya existe una animación con ese nombre, pregunta sobrescribir o copia.
- **Atajos de resorte** (`app.js`, secciones con `herrTecla / herrActual / volverHerr`: Mapa y Pixel art): un toque deja la herramienta; mantener la tecla más de 280 ms la usa y al soltar vuelve a la anterior (si se está arrastrando, vuelve al soltar el mouse). Las repeticiones de tecla se ignoran.
- Manual actualizado (46 páginas). **Pruebas:** editor 44 (5 nuevas); juego 13 (sin cambios en el juego). Probado con Chromium sin pantalla. **No probado en la PC del dueño.**

## 7j. Girar y escalar sin deformar; botón Info (11 de octubre, tarde)

Respaldo: `D:\Editor\trabajo\_respaldo_editor\respaldo_antes_giro_20261011.zip` (incluye el cargador del juego).

- **`PIX.scale2x`, `PIX.ocho`, `PIX.transformarEn`, `PIX.transformar`** (`js/core/pix.js`): giro y escala para pixel art al estilo RotSprite: ×8 con Scale2x (guardado en un WeakMap), giro ahí y vuelta al tamaño con voto de 9 muestras por píxel (gana el color que más aparece; empate, el del centro). Con giros rectos y escalas enteras copia exacto. Nunca inventa colores.
- **Pixel art → Transformar:** usa eso de entrada (`Px.S.trSuave = true`; "Giro limpio" se puede apagar). Las esquinas escalan manteniendo la proporción; Mayús estira libre (antes era al revés).
- **Mapa:** un objeto girado en ángulo no recto o con escala no entera se dibuja con `cuadroLimpio` (cacheado por asset, cuadro, giro, escala y espejo); mientras se arrastra el asa de girar o escalar se usa el dibujo rápido de siempre.
- **Exportar:** el juego no sabía girar ni estirar distinto en X e Y (antes un objeto girado salía derecho en el juego). Ahora `pideHorneado(o)` decide y `hornearObjeto(o)` hornea todos los cuadros alineados por el pie; se exporta como `ed_<asset>_t<firma>` con `{ox, oy}` (punto de apoyo) en el item, y el cargador lo usa como origen (`it.ox / it.oy`). Las animaciones horneadas conservan fps, orden, duraciones y loop.
- **Info del asset:** ya no es una pestaña de Pixel art ni un botón del panel de Animar: es un botón "Info del asset" abajo a la izquierda del lienzo, encima de la tira de cuadros (Pixel) y de la línea de tiempo (Animar).
- **Pruebas:** editor 45 (1 nueva: sin colores nuevos, área parecida, 90° exacto, horneado al exportar). Juego 13.

## 7k. Tamaño de interfaz trabado (11 de octubre)

- `js/core/tema.js`: si el tamaño no es 100 % aparece un chip abajo, "Tamaño N % · volver a 100 % (Ctrl + Alt + 0)". Ctrl + Alt + 0 lo resetea siempre. Al cargar, un tamaño fuera de 80–150 % vuelve a 100 %.

## 7l. Patio de armas con las láminas del dueño (11 de octubre, noche)

Respaldo: `D:\Editor\trabajo\_respaldo_editor\respaldo_antes_patio_20261011.zip` (el `proyecto.json` y `mapa.js` anteriores).

- **Recorte:** 3 láminas con fondo magenta (suelos/vegetación, muros/torres, entrenamiento), estaban escaladas ×6 y ×5,36. Se redujeron a 1 píxel por píxel de arte (fase por Fourier + mediana por bloque), se limpió el borde magenta, se cuantizó a 96 colores y se cortaron en 187 piezas con nombre. Sombras violetas → sombra translúcida. Texturas de suelo recortadas al centro 64×64.
- **Dónde quedaron:** `D:\Editor\trabajo\patio_de_armas\<carpeta>\<nombre>.png` (campamento, cercos, deco, entrenamiento, herreria, madera, muros, puertas, rocas, suelos, torres, vegetacion) + `_laminas_originales`, `_catalogo.png`, `_vista_previa_patio.png`. En el proyecto: 193 assets `pa_*` (187 + 3 texturas repetibles + 3 tilesets wang16), carpeta de biblioteca `patio de armas/<carpeta>`.
- **Mapa nuevo** `patio_armas_nuevo` "Patio de armas (nuevo)", 44×30 tiles. El "Patio de armas" (`training`) del juego no se tocó. Capas: Pasto, Adoquín, Tierra (terreno), Suelo decorado, Objetos. Muralla con torres y portón abierto al sur; armería al norte, carpas al NE, ruedo con muñecos al centro, arquería al E, herrería al SO, provisiones al SE, fogata de guardia. Colisiones automáticas en sólidos + 4 de muralla y lados del portón (comprobado con BFS: se llega a todo, no se sale). Luces: 4 antorchas, fogata, fragua; ambiente `#ff9a5a` 0,16. Puntos: aparición "Entrada al patio", puerta "Salida a la aldea" (destino `_aldea`), NPC "Instructor".
- **`tileset.continuo`** (`mapa.js`): con 16 variantes, una celda llena usa la variante `1 + (i%4) + (j%4)*4`, así una textura 64×64 se ve entera en vez de pedazos al azar.
- **Scripts** (en la nube, no en la PC): `reducir.py`, `limpiar.py`, `cortar2.py`, `nombres.py`, `exportar.py`, `armar.js` (arma el mapa con la API del editor), `unir.py` (mezcla en el proyecto con prefijo `pa_`).
- Probado: cargado el proyecto mezclado en el editor de prueba (496 assets, 16 mapas), exportación sin errores (108 items, 93 colisiones, 6 luces, puerta). No probado en la PC ni jugado en el juego.

## 7m. Pintar, recta con Mayús, aplicar/descartar, vaciar, transformar y la casa (11 de octubre, tarde)

Respaldo: `D:\Editor\trabajo\_respaldo_editor\respaldo_antes_bugs_20261011.zip` (editor y los 3 archivos del juego).

- **Píxeles que volvían a su color** (`pixel/herramientas.js`): el píxel perfecto quitaba la esquina doble de una "L" devolviéndola al color de antes del trazo aunque el trazo ya hubiera pasado por ahí (cruces y vueltas atrás dejaban huecos). Ahora cuenta cuántas veces se pintó cada píxel en el trazo (`t.cuenta`) y solo devuelve los pintados una vez. Además "Editar en Aseprite" ya no recarga el archivo que escribe el propio editor al guardar (`CK._ultimaEscritura`), y `Px.S.ultimo` se borra al abrir otro dibujo.
- **Recta con Mayús** (lápiz y borrador): Mayús al apretar = recta desde el último punto con vista previa que se estira, se pinta al soltar; Mayús en medio de un trazo = recta desde ahí, al soltar Mayús sigue a mano alzada. Ctrl ajusta a pendientes limpias (1:0, 3:1, 2:1, 1:1, 1:2, 1:3) en múltiplos enteros (`Px.ajustarLinea`). Sin dobles en las esquinas.
- **Aplicar o descartar** (`js/core/aplicar.js`, nuevo; enganchado en `CK.ir`): con cambios pendientes, al cambiar de pestaña pregunta Aplicar / Descartar / Seguir editando. Descartar = `CK._poner` con `CK._aplicado` (JSON de lo último aplicado; se fija al abrir y al guardar) y las imágenes tocadas vuelven del navegador o de la carpeta. Con esto prendido no hay autoguardado, ni guardado al cerrar u ocultar, ni borrador de recuperación; al cerrar el navegador avisa y no guarda. Se apaga en Interfaz → "Preguntar antes de aplicar cambios" (`cfg.preguntar`). Excepciones: con una edición de Biblioteca abierta manda su barra; "Probar" y "Exportar" siguen guardando antes de exportar.
- **Vaciar el lienzo** (Pixel art: botón de la tira, Ctrl + Supr, menú del clic derecho; con selección vacía solo eso) y **Vaciar capa** en Mapa → Capas. Deshacibles.
- **Transformar**: en Pixel art, mientras se arrastra usa vecino más cercano con pasos sumados (~1 ms) una vez por cuadro de pantalla y el giro limpio (RotSprite, ~50 ms) solo al soltar; flechas: rápido ya y limpio a los 220 ms; Enter fija lo pendiente; el lienzo flotante se reusa. El paso de deshacer se llama "Transformar". En Mapa, escalar deja quieto el borde opuesto al asa (antes estiraba desde el centro y el asa de abajo no seguía al mouse), Ctrl = desde el centro, tamaños en píxeles enteros (Alt = de a 25 %), y funciona igual con el objeto girado.
- **Juego, casa grande de la aldea** (`js/dev_off.js`): el Estudio viejo (ya apagado) había guardado en el navegador un ajuste que agrandaba la casa; la puerta real quedaba en su lugar original y no se podía entrar. Las 4 casas y sus puertas ignoran ahora los ajustes del Estudio. `index.html` con `dev_off.js?v=2`.
- **Pruebas:** editor 48 (3 nuevas: trazo con cruce + recta + vaciar; transformar rápido/final; aplicar/descartar). Juego 14 (1 nueva: la casa con ajuste viejo, entrar y subir).
- **Después (mismo día): girar sin romper el dibujo y transformar desde la selección.** Al girar en ángulo no recto un dibujo con contorno de 1 píxel (borde de afuera ≥ 70 % de un color), `detectarBorde` saca ese borde, se gira solo el relleno y `rehacerBorde` dibuja un contorno nuevo de 1 píxel (vecinos en cruz); antes el contorno quedaba con huecos y tramos dobles. RotSprite queda apagado de entrada (`Px.S.trSuave = false`: redondeaba las esquinas de los dibujos chicos); se prende en el clic derecho → "Suavizar líneas". "Rehacer el contorno al girar" (`Px.S.trBorde`) también está en ese menú. Con Selección, Lazo, Varita o Mover la selección muestra asas (`Px.cajaSel`, `Px.manijasCaja`, `Px.asaEn`): agarrarlas empieza la transformación con la caja de la selección (`empezarTr({caja:'sel'})`); clic afuera la fija. Prueba nueva (editor 49).

## 7n. Taberna nueva desde una imagen de IA (11 de octubre, noche)

Respaldo: `D:\Editor\trabajo\_respaldo_editor\respaldo_antes_taberna_20261011.zip` (el `proyecto.json` anterior).

- **Imagen de referencia** (Gemini, JPG 2576×1438): es pixel art agrandado ×5,367 → 480×268 píxeles de arte (las láminas del dueño vienen todas a esa escala; las de suelos, a ×8). A esa escala calza con el juego (pasillo 34 px, héroe ~20 px), así que 1 píxel de arte = 1 píxel del mapa.
- **Mapa `taberna_nueva` "Taberna (nueva)"** (480×272): la escena es la imagen misma como `m.fondo` (asset `tb_taberna_escena`), con el negro de adentro del edificio pintado como tope de viga de madera (`herr/paredes.py`, en la nube). Colisiones: 59 rectángulos sacados de zonas caminables menos muebles (`herr/colisiones.py`); BFS con el cuerpo del héroe (19×10): se llega a todos los cuartos y no se sale. Pasos abiertos donde la imagen solo tenía líneas finas (cocina, cuarto izquierdo, dos cuartos de la derecha). Luces en antorchas, hogar, fogón y horno; ambiente `#3a2a4a` 0,32; música `taberna`; aparición, puerta a `_aldea`, NPC "Tabernero" (npc3). Nota en la escalera: falta el piso de arriba. No está conectada desde la aldea (se entra con Probar o F7).
- **Láminas** (fondo verde): limpias sin contornos rotos; 72 piezas `tb_*` en la Biblioteca, carpeta `taberna/<cocina|salon|dormitorio|comida|deco|alfombras|suelos>`, y copia ordenada en `D:\Editor\trabajo\taberna\` (+ originales, catálogo, vista previa). No se usaron en la escena (se vería distinto); quedan para otros interiores.
- Probado: armado en el editor de prueba y jugado en una copia del juego (aparición, choques, salida a la aldea). No probado en la PC.

## 7o. Taberna 2: copia editable de la taberna (12 de octubre)

Respaldo: `_respaldo_editor\respaldo_antes_taberna2_20261012.zip`.

- **Mapa `taberna_2` "Taberna 2"**: "Taberna (nueva)" queda intacta. Acá los 32 muebles son objetos movibles (assets `t2_*`, carpeta `taberna 2/muebles`), recortados con sus propios píxeles de la escena; cada uno lleva su colisión anclada (se mueve con él). Fondo `t2_taberna2_escena_vacia`: la escena sin muebles; debajo de cada mueble el piso/pared está rellenado copiando la misma fila del mismo cuarto (`herr/separar.py` en la nube). 28 colisiones fijas (paredes, horno, pileta, hogar).
- Sin mover nada se ve igual a la original, salvo el brillo pintado alrededor del fogón, que se borró (lo da la luz "Fogón del centro"). Si se mueve un mueble pegado a una pared, el relleno de la franja de yeso puede verse algo irregular.
- Copia ordenada en `D:\Editor\trabajo\taberna 2\`. Probado: editor de prueba (foto igual a la escena), misma zona caminable que la original (BFS) y jugado en una copia del juego (entra, choca, sale a la aldea). No probado en la PC.

## 7p. Salón del trono nuevo desde imagen de IA (12 de octubre)

Respaldo: `_respaldo_editor\respaldo_antes_trono_20261012.zip`.

- **Imagen** 2576×1438 = pixel art ×5,367 → 480×268 (misma escala que la taberna). Las láminas de objetos y tiles vienen con píxel más grueso (~×8); se bajaron igual a ×5,367 para que todo calce con la escena.
- **Mapa `salon_del_trono_nuevo` "Salón del Trono (nuevo)"** (480×272), mismo método que Taberna 2: fondo `st_trono_escena_vacia` + 29 objetos movibles recortados de la escena (trono, braseros, estandartes, armaduras, plantas, bancos, mesas, estantes, banquetas) con colisión anclada; 9 colisiones fijas (muros y las dos columnatas). El piso se rellenó con la grilla de 16 px (queda perfecto). Brillo pintado de los braseros borrado (lo dan las luces). 10 luces (8 antorchas + 2 braseros), ambiente `#2a2a4a` 0,25, música `castle`, aparición abajo y salida provisoria a `_aldea`.
- **Las columnatas son continuas como en la imagen**: desde la entrada no se llega a las naves laterales. Las puertas laterales son solo dibujo. Nota en el mapa; falta que el dueño decida si abrir pasos y a dónde llevan esas puertas.
- **Biblioteca**: 63 piezas extra de las láminas (`salon del trono/objetos|muros|tiles`): armadura con alabarda, columna, antorchas, tapiz, estandartes, candelabro, cofres, esquinas de alfombra, muros, pisos, estrados, escaleras, arcos. Copia en `D:\Editor\trabajo\salon del trono\` (+ originales, catálogo, vista previa). El "Gran Salón del Trono" viejo (`castle_throne`) no se tocó.
- Probado: editor de prueba y jugado en una copia del juego (aparece, sube por la alfombra hasta el trono y choca, sale). No probado en la PC.

## 7q. Salón del Trono 3, alargado y generado (12 de octubre)

Respaldo: `_respaldo_editor\respaldo_antes_trono3_20261012.zip`.

- **Mapa `salon_del_trono_3` "Salón del Trono 3"** (480×572, vertical como el castillo viejo). Fondo `s3_trono3_escena` compuesto en código con piezas del salón 2: pared del fondo + estrado (tal cual), piso repetido en su grilla de 16 px (alineado en fase, sin costuras), paredes laterales, muro de entrada y alfombra larga (`trono3/componer.py` en la nube).
- 72 objetos con colisión anclada: reusa 13 assets del salón 2 (`st_*`: trono, braseros, estandartes, tapiz, plantas, armaduras, mesas, bancos, estantes) y 18 nuevos `s3_*`: columna suelta (recortada de la columnata) y 16 objetos de **PixelLab** (una tanda de 16, costó 10 generaciones; estilo copiado de las piezas del salón): candelabro de pie, estatua de caballero, estatua de león, cofre real, armero, escudo de pared, brasero alto, mesita con copa, guardia con lanza, pedestal con orbe, atril, banco de terciopelo, jarrón, ciprés, tesoro, fuente.
- **Columnas sueltas con pasos entre ellas**: se llega a todo (BFS: el 100 % del piso libre es alcanzable). Guardia de honor a los lados de la alfombra. 14 luces. Salida provisoria a `_aldea`.
- Copia en `D:\Editor\trabajo\salon del trono 3\`. Probado: editor de prueba y jugado en una copia del juego (aparece, sube por la alfombra, cruza entre columnas, sale). No probado en la PC.

## 7r. Llamas animadas en los salones del trono 2 y 3 (12 de octubre)

Respaldo: `_respaldo_editor\respaldo_antes_llamas_20261012.zip` (proyecto.json + los 6 PNG que se reemplazaron).

- Animador propio (`fuego/animar.py`, en la nube): detecta los píxeles de fuego y arma 6 cuadros a 8 fps (la mitad de arriba de la llama sube/baja 1 px por columna con fase propia, el color titila, chispa cada tanto). El resto del objeto queda igual.
- **Braseros** (`st_brasero_izq/der`, usados en los salones 2 y 3), **candelabros de pie** y **braseros altos** (`s3_*`): el mismo asset pasó a tira de 6 cuadros con `cuadros` (los objetos del mapa no cambiaron; el alto creció 2 px arriba para que la llama suba).
- **Antorchas pintadas en el fondo**: se borró solo la llama del fondo (`st_trono_escena_vacia`, `s3_trono3_escena`) y se puso encima un objeto animado por antorcha, sin colisión: `st_llama_antorcha_1..8` en el salón 2, `s3_llama_antorcha_1..4` en el 3.
- **Salón 3**: 4 antorchas nuevas en las columnas sueltas del medio, del lado de la nave (`s3_antorcha_columna`, con su luz).
- **Limpieza (pedido del dueño):** sin chispas sueltas; cada cuadro saca los grupitos de menos de 4 píxeles; del fondo se borró también el resplandor/humito alrededor de cada llama y las chispitas cálidas sueltas de la pared. Todas las luces de los dos salones tienen `encima` (se dibujan sobre los objetos, así la llama brilla). Respaldo extra: `respaldo_antes_limpieza_llamas_20261012.zip`.
- Probado: en el juego (copia) el salón 3 tiene 18 objetos animándose y los cuadros avanzan; la foto del editor sale bien. No probado en la PC. Las tabernas no se tocaron (su fuego sigue pintado).

## 7s. Mapas nuevos dentro de la campaña y el Rey sentado en el trono (12 de octubre)

Respaldo: `_respaldo_editor\respaldo_antes_rey_20261012.zip` (index.html, editor_loader.js de juego y editor, ck_sonido.js, ck_pruebas.js).

- **`D:\prueba\js\core\ck_mapas_nuevos.js`** (nuevo; va en index.html **después** de `<!-- /Taller -->`, así las exportaciones del editor no lo pisan): la puerta de la taberna de la aldea arma "Taberna 2" en lugar de la vieja (misma puerta, mismos sonidos, vuelve a la aldea); la puerta "▲ Gran Salón" del patio lleva al "Salón del Trono 3" y su salida vuelve al patio (320, 182). Ambiente y eco de los salones viejos para los dos mapas (`CK_SALA_ED`, una línea en `ck_sonido.js`). El diario los cuenta como aldea y castillo. Si alguno de los dos mapas no está exportado, todo queda como antes.
- **El Rey Aldric** (`STORY_NPCS` 'king' pasa a la zona del salón nuevo): espera sentado en el trono (`ck_rey_assets.js`: tira de 4 cuadros 28×30 hecha con PixelLab a partir del rey del juego, ~10 generaciones; respira), al empezar a hablarle se levanta (2 cuadros), aparece el rey de costado y baja los escalones; cuando termina la charla recorre la nave por la alfombra con pausas; se para y mira al héroe si se le acerca; se le puede volver a hablar donde esté. Cada vez que se entra al salón está sentado de nuevo. No tiene colisión.
- **Arreglo del cargador** (`editor_loader.js`, en `D:\Editor\juego` y en el juego): con luces en un mapa, el bucle de efectos se cortaba (las luces viven en `ED.vivos` sin textura) y se salteaba el resto del cuadro: carteles "T · Hablar", puertas entre mapas del Taller y patrullas.
- Pendiente: los Aposentos del Rey y la Biblioteca se entraban desde el salón viejo; el nuevo no tiene esas puertas (hay que agregarlas al mapa si se quieren).
- Probado: pruebas del juego 15/15 (nueva: "Salón nuevo: el Rey espera sentado, se levanta al hablarle y sale al patio"), pruebas del editor 49/49. No probado en la PC.

## 7t. Corte del salón, arcos a Aposentos y Biblioteca, y aldea viva (12 de octubre)

Respaldo: `_respaldo_editor\respaldo_antes_vida_20261012.zip` (index.html, ck_mapas_nuevos.js, ck_pruebas.js, editor_data.js, editor_assets.js, proyecto.json, fondo del salón 3).

- **Salón del Trono 3 (mapa)**: dos arcos de piedra en la pared del fondo (x 64 y 416; horneados en `s3_trono3_escena`, hueco oscuro con degradé) en el lugar de los tapices; se quitaron los tapices y las mesas de arriba, las plantas pasaron a x 100/380, la guardia de lanzas a x 200/280 (deja pasar al paje). Se borraron dos antorchas duplicadas que habían quedado pintadas en la pared. El mapa se exportó al juego mezclándolo en `editor_data.js`/`editor_assets.js` (el resto de la exportación del dueño quedó igual).
- **`ck_mapas_nuevos.js`**: ARRIBA en cada arco lleva a los Aposentos del Rey / la Biblioteca del castillo; al volver se llega por el mismo arco. La corte del salón viejo, tal cual y con sus textos: Reina Elara y Princesa Lía junto al trono, Lady Mirena esperando audiencia (junto a la fuente), dos templarios al pie del estrado, dos caballeros en la entrada, el paje que cruza el salón con mensajes, y el "Inclinaos ante Su Majestad". Tienen colisión.
- **`ck_vida.js`** (nuevo, después de ck_mapas_nuevos en index.html): caminos A* sobre una grilla de 8 px de la aldea (obstáculos, agua y bajos). Cada aldeano (menos el posadero, que atiende) cada 45–100 s va a la taberna o a su casa, entra por la puerta (se abre), se queda 25–60 s y sale; de noche casi todos se guardan y salen a la mañana. Los que están en la taberna se ven adentro de "Taberna 2" caminando entre las mesas, se les puede hablar (con su nombre) y se van por la puerta. Si una bestia se acerca a menos de 130 px gritan y corren a la puerta más cercana que no esté del lado de la bestia; salen cuando no hay peligro. Se sobresaltan si el héroe ataca al lado, festejan si cae una bestia cerca, avisan si el héroe está herido. Desde el paso 1 de la historia, algunas noches (cada 2,5–4 min) una bestia (murciélago, limo u hombre lobo) merodea la aldea.
- Probado: pruebas del juego 16/16 (nueva: "Aldea viva…"), recorrido completo en una copia (arcos ida y vuelta, charla con la reina, aldeanos que entran a la taberna y se ven adentro, huida). No probado en la PC.

## 7u. Camino al Castillo nuevo, grande y con profundidad (12 de octubre)

Respaldo: `_respaldo_editor\respaldo_antes_camino_castillo.zip` (proyecto.json, index.html, ck_pruebas.js, editor_data.js, editor_assets.js).

- **Cómo se hizo**: la imagen de referencia del dueño (1376×768, unos 480×268 px de juego) se agrandó ×3 con PixelLab `edit_image`, en 6 cuadros de 170 px de arte → 510 px, solapados (8 llamadas, 200 créditos con dos repetidos: uno salió achicado con borde blanco y otro con el castillo más chico). Se cosieron ajustando el corrimiento de cada cuadro contra la referencia y cortando por el camino de menor diferencia; se recortó a **1436×758** y se pasó a 96 colores. Se borró a mano un tramo de camino duplicado al lado del foso. Todo en `D:\Editor\trabajo\camino al castillo\` (referencia, cuadros de PixelLab, mapa completo, vista previa, capturas del juego). Taller de trabajo local: `/tmp/claude-0/camino/` (unir.py, clasificar.py, colisiones.py, piezas.py, build/).
- **Mapa del editor "Camino al Castillo"** (id `camino_al_castillo`, assets `cc_*`): fondo `cc_camino_castillo_escena` (sin el puente levadizo, con agua debajo, y sin la llama de la fogata); 11 piezas de profundidad recortadas del mismo dibujo (bosques de la cabaña, del norte y del sur, roble, árbol de la escalera, carreta, troncos, cerca del mirador con banco y barril, barriles del muelle) que tapan al héroe cuando pasa por detrás; animados: `cc_foso` (ondas sutiles del agua del foso, 8 cuadros, va como piso) y `cc_fogata` (6 cuadros) con luz de fogata. 650 colisiones del terreno: los riscos separan los dos niveles y solo se sube por la escalera de piedra o la escalera lateral; el río se cruza por el puente; el muelle se pisa. 10 bestias (3 solo de noche) puestas como puntos de enemigo del mapa. Llegada al oeste (x 60, y 434) y salida "◀ Volver a la aldea" en el borde oeste.
- **`js/core/ck_camino.js`** (nuevo, último script después de `/Taller`): `enterCastle` (el camino del sur de la aldea) ahora arma este mapa; el portón (ARRIBA arriba del puente) lleva al patio, y la salida del patio vuelve frente al puente. El puente levadizo funciona como el viejo (alzado tapando el portón, baja cuando el héroe se acerca, polvo y temblor al apoyarse, bloqueo mientras está alzado) pero con el tablero del dibujo nuevo (embebido en el archivo) y cadenas desde la pared. Guardias del portón, viajero de la fogata (npc2) y mirador con sus textos. Las bestias de este mapa cuentan para la misión del camino (paso 2) como las del camino viejo; el diario lo marca como "Camino del castillo".
- **Pruebas**: `ck_pruebas.js` acepta el camino nuevo en la prueba del castillo y suma "Camino nuevo al castillo…" (puente baja, portón → patio → vuelta). Pruebas del juego **17/17**; recorrido en una copia (llegada, puente, portón, patio, vuelta, salida a la aldea, escalera). Archivos verificados byte a byte en la PC (PNG por píxeles). No probado en la PC.
- Nota: el camino de abajo a la derecha (detrás de los riscos) queda como decorado, no se llega. El Phaser del CDN no carga desde la nube; las pruebas locales usan `js/phaser.min.js`.

- **Agregado (12 de octubre, noche)** en `ck_camino.js`: 13 pajaritos amigables (azulejo, petirrojo, jilguero y gorrión; dibujados por código, 4 cuadros) que picotean, saltan, miran a los lados y cantan (`ev_pajaro`) si el héroe anda cerca; cuando se acerca a menos de 44 px vuelan en arco a otro de 20 posaderos (no desaparecen) y cada 15–40 s cambian de lugar solos; de noche duermen (no se ven). La cabaña: humo de la chimenea (partículas) y, al caer la noche, la ventana se enciende de a poco (vidrios cálidos con titileo, resplandor y un poco de luz en el piso frente a la puerta), por encima de la sombra de la noche para que ilumine; se apaga al amanecer. Respaldo: `_respaldo_editor\respaldo_ck_camino_antes_pajaros.zip`. Pruebas 17/17. El dueño había exportado desde el editor antes (index.html `?v=mv5vx1om`); se respetó esa exportación.

## 8. Pendientes

1. **Panadero de frente:** ¿usar la lámina nueva? (retocar gorro y cara en 3–4 cuadros).
2. **Perfil del panadero** para que coincida con el del herrero (~1 generación de PixelLab).
3. **NPC de verdad:** los paseantes no tienen colisión ni diálogo; pasarlos a fichas de NPC del editor.
4. **Reemplazar los NPC viejos** con esta estética: definir cuáles y tamaño final (hoy ~35 px vs héroe ~30 px).
5. **Botones del editor para automatizar** lo que hoy se hizo con scripts: "lámina → objetos", "lámina → animación", "pulir silueta" (el dueño lo pidió implícitamente al decir "usá el editor").
6. ~~Manual PDF desactualizado~~ hecho el 10 de octubre.
6d. **Para después de la entrega** (pedido del dueño): rampas de color / dither / papel cebolla de varios cuadros en Pixel art, botones de "lámina → objetos / animación", sección Sonido completa; en el juego: NPC de verdad, carga por zonas, una sola fuente de arte.
6c. **Renombrar carpetas** (pedido del dueño): `D:\Editor` → `AceSpriteStudio`, `D:\prueba` → `CastleKhights` (¿o CastleKnights?). Desde acá no se puede mover; hacerlo a mano. El juego usa rutas relativas; en el editor hay que volver a elegir la carpeta del juego.
6b. **Música:** confirmar práctica (B lenta o C) y escuchar las costuras de aldea y castillo (las de menor similitud, ~0,86).
7. `index.html` vs `editor.html` en el editor: esperar decisión.
8. **Orden pendiente que no se pudo hacer desde acá** (la conexión con la PC no permite borrar ni mover archivos):
   - `D:\prueba\assets\sfx_*_20261007_*.mp3` (3 archivos sueltos en la raíz de assets, no los usa el código): mover a `assets/audio/sfx/` o borrar.
   - `D:\prueba\scripts\`: hay muchos scripts viejos de depuración (`capture_*`, `test_*`, `diagnose_*`, `verify_*`, `check_*` salvo `check.js`); se podrían mover a `scripts/viejos/`.
   - `D:\prueba\TRASPASO.md` y `D:\Editor\TRASPASO.md` son el mismo archivo: quizás dejar uno solo.

## 9. Problemas conocidos — leer antes de entregar archivos

- **Copia a la PC:** usar siempre una carpeta de salida nueva por entrega, `force: true` o `expectedMtimeMs`, y después comparar (mejor: volver a bajar el archivo y comparar byte a byte o píxel a píxel).
- **Los PNG que llegan a la PC pesan ~5,8 KB más:** la plataforma les agrega un bloque `caBX` (credenciales de contenido C2PA). La imagen es idéntica. No quitarlo.
- **Sin borrar ni mover:** desde la nube solo se puede leer y escribir archivos en la PC; no hay terminal ni permiso de borrado.
- **"Quitar halo"** en Convertir se sacó: no reintroducirlo.
- **PixelLab:** `animate_image` libre afina al personaje; fijar primer y último cuadro ayuda. Para frente/espalda y para humo dio malos resultados. Saldo 1360 generaciones (se renuevan el 28 de octubre). Los base64 largos copiados a mano a veces se corrompen: si falla, re-codificar.
- **Built-in browser** no abre `file://`: las pruebas se hacen en copia con Playwright.
- El contenedor no alcanza jsdelivr ni la API de PixelLab directamente; Phaser se baja con `git clone --sparse` del repo de Phaser (rama `v3.80.1`, carpeta `dist`).

## 10. Cómo se venía probando

- **Juego:** copia de `js/`, `index.html` y css servida por HTTP, con `phaser.min.js` local; Playwright entra al menú (Espacio), elige modo, `hero-card-soldier` → `btn-hero-confirm`. Para ver el pixel art real: viewport 960×600 (canvas 1:1) y zoom de cámara 1,5. Para `npm run check` en la copia hay que recrear el árbol de `assets/` (archivos vacíos con los mismos nombres), porque verifica que existan.
- **Editor:** servido por HTTP, `showDirectoryPicker` simulado con OPFS; la carpeta "juego" se llena con los `.js` del juego.
- Todo lo que se da por "probado" fue en esas copias, **nunca en la PC del dueño**. Decirlo así.

## 11. Convenciones

- El juego abre con doble clic. Nada de servidores ni instalaciones.
- No tocar archivos originales del juego salvo pedido explícito (hoy: optimización y `check.js`, con respaldo). Lo nuevo va en archivos propios.
- Respaldo antes de reescribir. Cambios reversibles y explicar cómo deshacerlos.
- Avisar antes de gastar créditos de PixelLab, SpriteLab o ElevenLabs (si el dueño lo pide explícitamente, se usa y se informa el gasto).
- Informar con honestidad qué se verificó y qué no. Responder en español rioplatense, corto y con lo importante primero.
