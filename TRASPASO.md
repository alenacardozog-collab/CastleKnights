# Traspaso del proyecto — CastleKnight y su editor

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
- Respaldo de lo que había: `D:\Editor\trabajo\_respaldo_editor\antes_ventanas_tiles.zip`.
- Pruebas del editor: 14 de 14 en verde (`pruebas.html`; se sumaron volver/ventanas, zona de animación y tiles). Probado con Chromium sin pantalla, por http y abriendo el archivo directo. **No probado en la PC del dueño.**

## 8. Pendientes

1. **Panadero de frente:** ¿usar la lámina nueva? (retocar gorro y cara en 3–4 cuadros).
2. **Perfil del panadero** para que coincida con el del herrero (~1 generación de PixelLab).
3. **NPC de verdad:** los paseantes no tienen colisión ni diálogo; pasarlos a fichas de NPC del editor.
4. **Reemplazar los NPC viejos** con esta estética: definir cuáles y tamaño final (hoy ~35 px vs héroe ~30 px).
5. **Botones del editor para automatizar** lo que hoy se hizo con scripts: "lámina → objetos", "lámina → animación", "pulir silueta" (el dueño lo pidió implícitamente al decir "usá el editor").
6. **Manual PDF desactualizado** (falta todo lo de la última semana).
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
