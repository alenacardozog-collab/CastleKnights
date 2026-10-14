# Traspaso del proyecto — CastleKnight y su editor (Taller)

**Estado al 14 de octubre de 2026.** Este archivo es para que otra sesión de Claude (o el propio dueño) retome el trabajo **sin la conversación original**. Leelo entero antes de tocar nada.

- Hay una copia idéntica en `D:\Editor\TRASPASO.md` y en `D:\prueba\TRASPASO.md`. Cuando lo cambies, cambiá los dos.
- El detalle de todo lo hecho día por día (secciones 1–11 del archivo viejo) está en **`TRASPASO_historial.md`**, en las mismas carpetas. Acá va lo necesario para trabajar; allá, el porqué de cada cosa.
- Los scripts con los que se armó todo están en **`D:\Editor\trabajo\_scripts_ia\`**. La nube se borra entre sesiones: si hace falta un script, se sube desde ahí.

---

## 1. Reglas de oro (no negociables)

1. **Responder siempre en español rioplatense**, corto, con lo importante primero. El dueño escribe corto y directo.
2. **El juego tiene que abrir con doble clic** en `D:\prueba\index.html`. Nada de servidores ni instalaciones. Todo el arte va **embebido en base64** en `.js` (desde `file://` no se cargan imágenes sueltas).
3. **Respaldo antes de pisar cualquier archivo** de la PC. Va como zip en `D:\Editor\trabajo\_respaldo_editor\` con un nombre que diga qué había antes (`respaldo_antes_<cosa>_<fecha>.zip`).
4. **No hacer commits ni push** salvo que el dueño lo pida. Las dos carpetas son repos git suyos.
5. **Avisar antes de gastar créditos** de PixelLab, SpriteLab o ElevenLabs y decir cuánto. Si el dueño ya lo pidió explícitamente, se usa y se informa el gasto al final.
6. **Decir con honestidad qué se probó y qué no.** Todo lo "probado" es en una copia en la nube, **nunca en la PC del dueño**. Decirlo así.
7. **No tocar el estilo ni la escala del arte del juego.** 1 píxel de arte = 1 píxel del mapa. Héroe ≈ 20×26 px (28×25 con la escala 1,2 de los mapas del Taller).
8. **No quitar los metadatos C2PA** que la plataforma agrega a PNG y MP3 al llegar a la PC (pesan unos KB más; la imagen y el audio son idénticos).
9. **El dueño renombra/mueve/borra carpetas a mano.** Desde la nube solo se puede leer y escribir archivos; no hay permiso de borrado.
10. Lo nuevo del juego va **en archivos propios**, enganchado sin tocar los originales. Que sea reversible: borrar la línea de `index.html` lo saca.

## 2. Quién y para qué

- **Dueño:** animador 2D y 3D de Argentina, aprendiendo pixel art (Aseprite, Pyxel Edit).
- **Proyecto:** **CastleKnight**, RPG top-down en Phaser 3.80.1. Proyecto final de un curso; **entrega a fines de noviembre de 2026**.
- **Busca:** acabado profesional y **estética homogénea**. Por eso hay un editor propio (el Taller) y cada vez más arte se arma desde imágenes de IA reducidas a pixel art real.
- **Cómo trabaja:** pide de a tandas, a veces mientras se trabaja en otra. Quiere vistas previas antes de cerrar algo importante. Prueba en su PC y vuelve con "genial" o con lo que falla. A veces exporta desde el editor por su cuenta entre pedidos (ver 6.4).

## 3. Carpetas

| Dónde | Qué |
|---|---|
| `D:\prueba` | **El juego.** `index.html` (doble clic). `pruebas.html` = pruebas del juego (pide un clic para el audio). |
| `D:\Editor` | **El editor (Taller).** `editor.html` o `index.html` (iguales), en Chrome/Edge. `pruebas.html` = pruebas del editor. |
| `D:\Editor\juego\editor_loader.js` | Copia del cargador que el editor pone en el juego. Tiene que ser **idéntico** a `D:\prueba\js\editor_loader.js`. |
| `D:\Editor\trabajo\castleknight\proyecto.json` + `assets\*.png` | **El proyecto del editor**: todos los mapas y assets del Taller. Cada asset es un PNG con su id como nombre. |
| `D:\Editor\trabajo\<mapa>\` | Copias ordenadas de cada mapa armado: referencia, piezas, vista previa (taberna, taberna 2, salon del trono, salon del trono 3, patio_de_armas, camino al castillo). |
| `D:\Editor\trabajo\_respaldo_editor\` | Respaldos (zips) antes de cada entrega. |
| `D:\Editor\trabajo\_scripts_ia\` | Scripts del pipeline (ver sección 7). |
| `D:\Editor\trabajo\_musica\`, `_sonidos\` | Originales de ElevenLabs. |

`.gitignore` del editor ignora `trabajo/_*/`, `trabajo/**/respaldo/` y `versiones/`.

## 4. Qué hay hoy en el juego (recorrido de la campaña)

| Lugar | Mapa / archivo | Qué tiene |
|---|---|---|
| Aldea | juego original + `js/core/ck_vida.js` + **`js/core/ck_aldea.js` (dibujo nuevo)** | Aldeanos con rutina: van a la taberna o a su casa (entran por la puerta), de noche se guardan, huyen de bestias, reaccionan al héroe. Algunas noches merodea una bestia (desde el paso 1 de la historia). |
| Taberna | mapa del Taller `taberna_2` | La puerta de la taberna de la aldea lleva acá (`ck_mapas_nuevos.js`). Aldeanos que entraron se ven adentro. Fuego todavía pintado (sin animar). |
| **Camino al Castillo** | mapa `camino_al_castillo` + `js/core/ck_camino.js` | Se llega por el camino del sur de la aldea (`enterCastle`). 1436×758, dos niveles con riscos, río con puente, muelle, cabaña, fogata, mirador. Puente levadizo animado, foso con ondas, fogata animada, guardias, viajero, 13 pajaritos, humo de chimenea, ventana que se enciende de noche, 10 bestias (misión del paso 2). Portón → patio. |
| Patio del castillo | juego original (`castle.courtyard`) | La salida "▼" vuelve frente al puente del camino nuevo. La puerta "▲ Gran Salón" lleva al Salón del Trono 3. |
| **Salón del Trono 3** | mapa `salon_del_trono_3` + `ck_mapas_nuevos.js` + `ck_rey_assets.js` | Rey Aldric sentado en el trono (se levanta al hablarle, baja y pasea). Corte del salón viejo con sus textos (reina, princesa, Lady Mirena, templarios, caballeros, paje). Arcos a Aposentos del Rey (x 64) y Biblioteca (x 416). Llamas animadas. Salida → patio. |
| Aposentos, Biblioteca, demás salas | juego original | Sin cambios. |
| Ruinas | juego original | Cuervos que se espantan (`fx crows` en `area_effects.js`). |

**Mapas del Taller que existen pero no están conectados:** `taberna_nueva` (la original desde imagen), `salon_del_trono_nuevo` (Salón del Trono 2), `patio_armas_nuevo`. Se prueban con Probar/F7 del editor o `index.html?ck_zona=<id>`.

## 5. Cómo está armado el juego (lo que hay que saber para tocarlo)

### 5.1 `index.html`
- Scripts clásicos en orden. Phaser 3.80.1 por CDN.
- Hay un bloque `<!-- Taller (D:\Editor)... -->` … `<!-- /Taller -->` que **el editor reescribe en cada exportación** (cambia el `?v=` de `editor_data.js`, `editor_assets.js`, `ck_dialogo.js`, `ck_fx.js`, `editor_loader.js`).
- **Lo nuestro va DESPUÉS de `<!-- /Taller -->`** para que una exportación no lo borre. Hoy, en este orden:
  ```html
  <!-- /Taller -->
  <script src="js/core/ck_rey_assets.js?v=1"></script>
  <script src="js/core/ck_mapas_nuevos.js?v=2"></script>
  <script src="js/core/ck_vida.js?v=1"></script>
  <script src="js/core/ck_camino.js?v=1"></script>
  <script src="js/core/ck_camino_prof.js?v=1"></script>
  <script src="js/core/ck_historia.js?v=1"></script>
  <script src="js/core/ck_partidas.js?v=1"></script>
  <!-- Aldea redibujada (estilo del camino). Borrar esta línea vuelve a la aldea vieja. -->
  <script src="js/core/ck_aldea.js?v=1"></script>
  <script src="js/game.js?v=11.1"></script>
  ```

### 5.2 Mapas del Taller dentro del juego
- `editor_data.js` (`window.EDITOR_DATA = {mapas, assets, ...}`) y `editor_assets.js` (`window.EDITOR_ASSETS`, imágenes base64) los genera el editor.
- `editor_loader.js` convierte cada mapa en un "edificio" de tipo **`ed_<id>`**, zona **`ed_<id>.main`**: fondo, items (objetos, con `baseY` = pie → orden por profundidad), colisiones, luces, puntos, puertas (`destino: '_aldea'` = salida a la aldea), NPC y enemigos (los puntos de enemigo pasan a `ZONE_ENEMIES[zona]`).
- `this.ckEntrar(id, llegada)` entra a un mapa del Taller (llegada = `{x, y}` del mapa o nombre de un punto). `window.CK_EDITOR.indice[id]` tiene el índice del mapa.
- Objetos animados del editor: asset con `cuadros = {fw, fh, fps, bucle, vaiven}` sobre una tira horizontal (`a.w`/`a.h` = tamaño de la tira). Un objeto con `piso: true` se dibuja a profundidad 7.3 (sobre el fondo, debajo de todo lo demás).
- Luces del editor: con `encima: true` se dibujan sobre los objetos (las llamas brillan).

### 5.3 Ganchos que usamos (todos envuelven la función original y la llaman)
| Función de `MainGameScene.prototype` | Para qué la envolvemos |
|---|---|
| `buildInterior(door)` | Cambiar qué se arma detrás de una puerta (taberna → `taberna_2`; castillo → camino nuevo). Así se conservan sonidos de puerta y vuelta a la aldea. |
| `enterCastle()` | Marca `_ckCaminoPendiente` y llama al original: el primer `buildInterior` de castillo arma el camino nuevo. |
| `switchInteriorArea(nombre, llegada)` | Redirigir pasos entre salas: `throne` → salón 3, arcos → aposentos/biblioteca, `courtyard` desde el camino, `road` desde el patio. |
| `exitInterior()` | Salida del salón 3 → patio. |
| `onAreaShown(area)` / `onVillageShown()` | Crear/borrar lo nuestro por zona (rey, corte, puente, gente, pajaritos, cabaña). Siempre borrar al salir. |
| `updateInterior()` | Lógica por cuadro en interiores (puente, cabaña, pájaros). **`updateNPCs` no corre en interiores.** |
| `onEnemyDefeated(enemy)` | Las bestias del camino nuevo cuentan como `castle.road` para la misión. |
| `openDialog(nombre)` | El rey se levanta al hablarle. |
| `preload()` | Cargar texturas propias (o `textures.addBase64` como respaldo). |

Otras piezas útiles del juego: `area.talkers` (`{x, y, lines, r, talkAt}`, texto flotante al acercarse), `area.portals` (`{x, y, half, to, arrive, hint}`, ARRIBA para pasar; coordenadas de mundo = `area.x + x`), `area.actors` tipo `'walker'` (`pts [[x, y, espera]]`), `this.interiorObstacles` (grupo estático para colisiones propias), `STORY_NPCS`, `WORLD_MAP` (diario), `ZONE_ENEMIES`, `this.isNight()` y `this.dayPhase()` (día de 5 minutos; noche entre 0,62 y 0,92), `nightShade` a profundidad 27500 (lo que tenga que **iluminar de noche** va por encima, 27501+, con mezcla ADD), `window.CK_SONIDO.tocar('ev_pajaro', {vol, rate, pan})`.

### 5.4 Archivos nuestros del juego
| Archivo | Qué hace |
|---|---|
| `js/editor_loader.js` | Cargador del Taller (copia idéntica en `D:\Editor\juego\`). |
| `js/core/ck_sonido.js` | Motor de sonido (salas con eco, voces, pasos, ambientes). `CK_SALA_ED` da eco a mapas del Taller. |
| `js/core/ck_mapas_nuevos.js` | Taberna 2, Salón del Trono 3, arcos, rey, corte. |
| `js/core/ck_rey_assets.js` | Tira del rey sentado/levantándose (`window.CK_REY_SENTADO`). |
| `js/core/ck_vida.js` | Aldea viva (A* sobre grilla de 8 px, rutinas, huida, merodeador nocturno). `window.CK_VIDA`. |
| `js/core/ck_camino.js` | Camino al Castillo: entrada/salida, puente, gente, cabaña, pajaritos (`window.CK_CAMINO`). |
| `js/core/ck_pruebas.js` | Pruebas del juego (`pruebas.html`). |
| `js/dev_off.js` | Apaga el modo dev y fija las casas de la aldea. |

## 6. Workflow de trabajo (cómo se viene haciendo cada cosa)

### 6.1 Arranque de una sesión
1. Ver si la conversación está **vinculada a la PC** (herramientas `mcp__remote-devices__*`). `get_device_info` → carpetas conectadas `D:\prueba` y `D:\Editor`.
2. **Bajar a la nube** lo que se va a tocar con `device_stage_files` (llega a `/mnt/user-data/uploads/<carpeta>/...`). Trabajar sobre copias locales:
   - juego → `/home/claude/tj` (copia completa de `D:\prueba`; bajar lo que falte),
   - editor → `/home/claude/editor_nuevo`.
3. **Comparar** lo bajado con las copias locales (`cmp`) antes de editar: si el dueño exportó o tocó algo, **su versión manda** (ver 6.4).
4. Subir desde `D:\Editor\trabajo\_scripts_ia\` los scripts que hagan falta.

### 6.2 Entregar a la PC (siempre igual)
1. Armar todo en una carpeta de salida nueva bajo `/mnt/user-data/outputs/<tanda>/`.
2. **Respaldo primero:** zip de las versiones actuales de la PC (las bajadas en el paso 6.1) → `device_commit_files` a `D:\Editor\trabajo\_respaldo_editor\respaldo_antes_<cosa>.zip`.
3. `device_commit_files` con `expectedMtimeMs` (el `mtimeMs` que dio `device_stage_files`) para archivos existentes; máximo 50 por llamada. Si rechaza por mtime, **el dueño cambió el archivo: volver a bajarlo y mezclar**, nunca forzar.
4. **Verificar:** volver a bajar lo escrito y comparar byte a byte (`cmp`); los PNG, **por píxeles** (llegan con un bloque C2PA extra).
5. Actualizar este `TRASPASO.md` en las dos carpetas.
6. Contarle al dueño qué cambió, qué se probó (en la copia) y qué no.

### 6.3 Servidores y pruebas en la nube
- Antes de cada prueba: `bash srv.sh` (levanta el editor en `:8766` y el juego en `:8765`; los servidores se mueren entre comandos).
- **Phaser por CDN no carga desde la nube:** en Playwright, `page.route('**/phaser.min.js', ...)` sirviendo `js/phaser.min.js` local (está en `/home/claude/tj/js/phaser.min.js`; si no, se clona el repo de Phaser rama `v3.80.1`, carpeta `dist`).
- **Pruebas del juego:** `pjuego2.py` (abre `pruebas.html`, clic, lee `window.__resultado`). Hoy **17/17**.
- **Pruebas del editor:** `pr.py`. Hoy **49/49**.
- **Recorridos a medida:** `probar.py` / `probar_vida.py` (entran con `index.html?ck_zona=<id>`, mueven al héroe con `S.player.body.reset(area.x + x, area.y + y)`, cambian la hora con `S.dayClock`, sacan capturas a 960×600, que es 1:1).
- Formato: Prettier con `node /opt/node-tools/node_modules/prettier/bin/prettier.cjs --config editor_nuevo/.prettierrc.json --write <archivo>` (ancho 140, comillas simples).

### 6.4 Si el dueño exportó desde el editor
El editor reescribe `editor_data.js`, `editor_assets.js` y el bloque Taller de `index.html` (cambia el `?v=`). **Su exportación manda:** se baja, se adopta como base local y se vuelve a correr las pruebas. Lo nuestro (después de `/Taller`) sobrevive. Si un mapa nuestro no estaba en su proyecto, se vuelve a mezclar con `exportar_mapa.py` (ver 6.6) sobre SU `editor_data.js`.

### 6.5 Mapa nuevo a partir de una imagen de IA (taberna, salones)
1. **Escala:** las imágenes del dueño (Gemini / Google Flow, 2576×1438) son pixel art agrandado **×5,367** → 480×268 px de arte. A esa escala calzan con el juego. `periodo.py` mide el período; `reducir.py` reduce (fase por Fourier + mediana por bloque) y pasa fondo verde a transparente.
2. **Opción A — escena como fondo:** la imagen reducida es `m.fondo`; colisiones a mano/por zonas (`colisiones.py`). Rápido; los muebles no se mueven.
3. **Opción B — muebles movibles (Taberna 2, Salón 2):** `separar_*.py` recorta cada mueble con sus propios píxeles (máscara por contorno oscuro, apertura, relleno de muescas) y rellena debajo copiando la misma fila/grilla del mismo cuarto (piso en grilla de 16 px). Se restauran píxeles originales donde no hay pieza. Se borra el brillo pintado (lo da la luz). Cada mueble con colisión anclada (`MP.anclarCol(k, o)`).
4. **Opción C — compuesto/generado (Salón 3):** se compone el fondo con piezas del salón 2 en código y los objetos que falten se generan con PixelLab (`create_1_direction_object` con 1–3 imágenes de estilo en base64; la imagen de estilo más grande fija el tamaño: ≤42 px → 64 candidatos, ≤85 → 16).
5. **Armar en el editor sin ventana:** `datos.py` junta fondo + assets + objetos + luces + colisiones en `datos_in.json`; `correr.py` abre el editor en `:8766` con Playwright y ejecuta `armar_*.js` (usa la API `CK.nuevo`, `CK.asset.crear`, `CK.mapa.crear`, `MP.nuevaCapa`, `CK.luces.PRESETS`, puntos `aparicion` / `puerta` (`destino`) / `enemigo` (`tipo, radio, noche`)), saca vista previa y `out/datos.json`.
6. **Mezclar en el proyecto del dueño:** `unir_*.py` sobre el `proyecto.json` bajado de la PC: assets con prefijo propio (`t2_`, `st_`, `s3_`, `cc_`, `pa_`…), sin pisar ids existentes; PNG de cada asset a `proyecto/assets/`.
7. **Exportar al juego:** ver 6.6. Probar en la copia, entregar (6.2).

### 6.6 Exportar un mapa al juego sin pisar lo demás
`exportar_mapa.py <proyecto.json> <id1,id2> <editor_data.js de la PC> <editor_assets.js de la PC> <carpeta salida> <carpetas de PNG separadas por coma>` — carga los mapas en el editor sin ventana, usa `CK.juego.paquete()` y **mezcla** el resultado en los `editor_data.js` / `editor_assets.js` que se le pasan (lo exportado por el dueño queda igual).

### 6.7 Mapa grande desde una imagen de referencia (Camino al Castillo)
1. El dueño genera la **vista general** en Google Flow (prompts en 6.11). Si sale con zonas negras o poco espacio, se pide otra.
2. **No sirve pedirle a Flow "zoom por partes"**: reinterpreta y cambia proporciones. Lo que funcionó: **agrandar la misma imagen ×3 con PixelLab `edit_image`**.
   - Reducir la referencia a su grilla (≈480×268).
   - Cortar 6 cuadros de 170×170 px de arte solapados (x 0/155/310, y 0/98), cuantizados a 32 colores (pesan ~10 KB → base64 ~13 KB).
   - `edit_image` con `width/height: 510` y el texto "Redraw this exact same scene at 3x size with finer native pixel art detail. Same zoom level… Keep the composition, layout, proportions and positions IDENTICAL… Crisp 1-pixel pixel art, no blur, no new objects." **25 generaciones por cuadro.** Revisar cada resultado: a veces sale achicado con borde blanco o con algo más chico; se repite con otro `seed` y "Fill the canvas edge to edge, do not shrink".
   - `unir.py`: busca el corrimiento de cada cuadro contra la referencia agrandada, cose por el camino de menor diferencia, recorta los bordes sin cubrir y cuantiza a 96 colores. `registrar.py` sirve para detectar cuadros con otra escala.
   - Revisar costuras a mano (`grilla.py` hace zooms con grilla y coordenadas) y corregir: se borró un camino duplicado rellenando con `pasto.py`.
3. **Colisiones y alturas:** `clasificar.py` (celdas de 4 px: agua, camino, pasto, roca, copa, otro) → `colisiones.py` (pisable = pasto + camino + franja de arriba de las copas; escaleras, puentes y muelle a mano; castillo, foso, cabaña, troncos, carreta, cerca a mano; bordes cerrados salvo salidas; revisa que todo sea una sola zona conectada) → `piezas.py` (grilla de 8 px, saca motitas, une en rectángulos: ~650).
4. **Profundidad:** `piezas.py` recorta del mismo fondo los bosques, árboles sueltos y objetos con alfa por píxel; cada pieza va como objeto con el pie en su borde de abajo. Como es el mismo dibujo, de lejos no se nota; cuando el héroe pasa por detrás, la pieza lo tapa.
5. **Cosas que se animan aparte:** se borran del fondo (puente: se copia la franja de agua/orilla de al lado; llama de la fogata: se rellena con brasas) y van como objeto animado o por código.

### 6.8 Fuego, agua y otras animaciones
- **Llamas:** `animar.py` (`mascara_fuego`, `animar(a, n=6, solo_llama=…)`, `limpiar`): las puntas suben/bajan 1 px por columna con fase propia y el color titila. Sin chispas sueltas (se sacan grupos de < 4 px). Se borra la llama y el resplandor pintados del fondo y se pone el objeto animado encima; luz con `encima: true`.
- **Agua quieta:** `foso_ondas.py` (8 cuadros, los brillos y líneas oscuras se mecen 1–2 px por fila); objeto con `piso: true`.
- **Por código** (en el archivo del mapa): humo (partículas con textura suave creada en canvas), luz nocturna (gráficos + resplandor ADD a profundidad 27501, alfa según la hora), pájaros (sprites dibujados en canvas, 4 cuadros), puente levadizo (escala Y de -0,9 a 1 desde la bisagra, tinte, cadenas con `graphics`, bloqueo con zona estática).

### 6.9 Conectar un mapa del Taller a la campaña (patrón)
- Archivo propio después de `/Taller`; si el mapa no está en `EDITOR_DATA`, salir sin hacer nada.
- Redirigir con los ganchos de 5.3. Usar `irAlCastillo(s, sala, llegada)` (en `ck_mapas_nuevos.js`) o el patrón de `irAlPatio` en `ck_camino.js` para volver a salas del castillo.
- Gente y textos: sprites del juego (`g_templar_idle`, `g_knight_idle`, `npcN_villager` + `npcN_idle/walk`, escalas 1,2 / 1,3) + `area.talkers` + una zona estática de colisión por persona. Marcar lo agregado con `ck: true` y filtrarlo al recrear.
- Misión/diario: `WORLD_MAP` (sumar la zona), `STORY_NPCS` (mover a la zona nueva), `onEnemyDefeated` si la misión cuenta bestias de una zona.
- Agregar una prueba a `ck_pruebas.js`.

### 6.10 PixelLab — lo que hay que saber
- Las herramientas corren en la PC del dueño (`mcp__remote-devices__pixellab__*`). **Desde la nube no se llega a api.pixellab.ai ni a backblaze:** no se puede subir con `get_upload_url` ni bajar con la URL. Las imágenes van **inline en base64** y el resultado se toma del archivo de vista previa que deja la herramienta (`/root/.claude/projects/.../tool-results/mcp-remote-devices-blob-*.png`), que es la imagen real.
- **Copiar el base64 exacto** (imprimirlo con `cat` y pegarlo sin tocar). Un base64 mal copiado da error de validación; si pasa, volver a imprimir. Mantenerlo chico: cuantizar a 32 colores, recortar.
- `edit_image`: 10–25 generaciones (510×510 = 25), entradas hasta 512×512. `create_1_direction_object`: barato para tandas. `animate_image` libre deforma al personaje (fijar primer y último cuadro). Frente/espalda y humo salieron mal → hechos a mano/por código.
- `wait_for_jobs` a veces corta a los 60 s: usar `get_image(job_id)` y esperar.
- **Saldo:** ~1130 generaciones al 12/10 noche (después de la prueba de la aldea); se renuevan el **28 de octubre**.

### 6.11 Prompts para Google Flow (vista general de un mapa)
- Formato 16:9 (sale 2576×1438). Pedir "top-down 3/4 view pixel art game map, same style… crisp pixel art, no blur, no text, no UI, no characters, **no black areas, fill the whole image edge to edge**, walkable paths at least 3 character-widths wide, clear separation between walkable ground and blocked areas (water, cliffs, walls, dense trees)".
- Para agregar algo con la misma estética, adjuntar una imagen de referencia del juego.
- Hojas de objetos: "Pixel art sprite sheet on a flat solid pure green background (#00FF00), same style, palette and pixel size as the attached image, top-down 3/4 view. Each piece separated with green space around it, no shadows on the background, no text" + lista numerada de piezas.
- **No pedir zooms por partes** para unir: no respeta proporciones (ver 6.7).

### 6.12 Unificar la estética del juego (plan en curso, pedido del dueño 12/10)
El dueño quiere **todo el juego con la estética del Camino al Castillo**, de a poco, **manteniendo cada mapa como está en todo sentido** (misma forma, mismas puertas, misma lógica). Se empieza por la **aldea principal**.

**Lo que se probó y lo que se aprendió:**
- **Google Flow no sirve para "mismo mapa, otro estilo":** con la foto de la aldea + la del camino como referencias (prompt en `D:\Editor\trabajo\aldea_nueva\`), respetó la forma pero casi no cambió el estilo (pixel grueso, poco detalle). Si se le da más libertad, mueve casas y caminos.
- **PixelLab `edit_image` en modo referencia sí sirve:** `images_base64 = [parte de la aldea]`, `reference_image_base64 = [recorte del camino con un estilo parecido, p. ej. la cabaña (140, 30)-(332, 222)]`, texto: "Redraw the input map in the exact pixel art style of the reference image… Keep every building, path, tree, prop and wall exactly in the same position, size and shape… crisp 1-pixel pixel art, no blur, no new objects". Mismo tamaño de entrada y salida (192×192 → 192×192), **10 generaciones por parte**. Resultado (taberna): forma idéntica, texturas del camino (paja con hebras, piedra en bloques, madera con vetas, pasto con matas, contornos oscuros); quedó un poco más oscuro que el camino.
- **Pasar todo a la paleta del camino no conviene:** los techos de paja se vuelven naranjas (el camino no tiene paja amarilla). Igualar solo pasto, tierra y piedra; dejar la paja dorada.
- **Sacar la foto de la aldea sin personajes** (la de prueba tenía dos aldeanos horneados). Foto completa de la aldea: 640×640, con la cámara a zoom 1 y `game.renderer.snapshot` (ver `aldea_completa.png`).

**Aldea redibujada — HECHO el 13/10 (`js/core/ck_aldea.js`, ~750 KB, todo embebido):**
- Foto limpia (640×640, de día, sin NPC) → 16 partes de 192 px en grilla x/y = 0, 149, 299, 448, redibujadas con PixelLab `edit_image` modo referencia (referencia = 4 recortes del camino, semilla 777) → color por material (pasto, tierra, gris, agua, paja) igualado al camino usando las zonas del dibujo **original** → cosido con costuras de mínima diferencia. ~205 generaciones en total.
- En el juego (sólo campaña): capas y objetos viejos **ocultos pero vivos** (choques, puertas, aldeanos, misiones igual). Fondo nuevo a profundidad 0,5. Cada objeto viejo se reemplaza por un **recorte del fondo con su silueta** (alfa de la textura vieja +1 px), misma posición y profundidad → delante/detrás igual que antes.
- Agua: 4 cuadros de brillos que titilan. Fogata: llama repintada y animada (6 cuadros) + humo + resplandor. De noche: vidrios de 13 ventanas, halos y las 6 lámparas de los faroles. Las casas no tienen chimenea (no hay humo de chimenea).
- Se engancha en `createTiledMap('campaign_tiled_map')`; las texturas se cargan con `textures.addBase64`. Se borra al ir a Práctica.
- Scripts: `_scripts_ia/7_aldea/` (`captura.py`, `cmpcopy.py`, `color.py`, `coser.py`, `fogata.py`, `armar.py` + `ck_aldea.tpl.js`, `probar.py`). `armar.py` regenera `ck_aldea.js` desde `aldea_nueva.png`.
- Las puertas viejas quedan invisibles (no se ve la animación de abrir; el fundido tapa).

### 6.13 Pasar por delante y por detrás de forma natural (pedido del dueño 12/10)
Problema que vio el dueño en el Camino al Castillo: en algunos lugares el héroe queda **debajo de la sombra** de cosas (p. ej. la carreta) o tapado cuando está delante. Causa: cada pieza ordena por el **borde de abajo de su imagen**, que incluye la sombra; y algunas colisiones son más grandes que la base real. **HECHO el 13/10 en `js/core/ck_camino_prof.js`** (se aplica al armar el mapa en el juego, no toca los datos del editor): apoyo en el contacto (carreta 57, roble 134, árbol de la escalera 119, troncos, barriles, cerca; con `oy`), los 3 bosques partidos en ~100 franjas según la base de cada árbol (fin del tramo opaco de abajo, máx. 44 px), carreta y roble chocan sólo en su huella (se quitaron 27 rectángulos, se agregaron 2). En el editor (Probar) se sigue viendo como antes. Cómo se pensó:
- **Separar la sombra del objeto:** la sombra va al piso (siempre debajo del héroe); el objeto queda solo con su cuerpo.
- **Punto de apoyo en el contacto con el suelo** (ruedas de la carreta, base del tronco, postes de la cerca): pies del héroe arriba de esa línea → pasa por detrás; abajo → por delante. En el editor el objeto se ancla por su pie; si la imagen tiene sombra abajo, hornear con `ox/oy` o recortar la sombra.
- **Colisión = huella real** (ruedas y base de la carreta, tronco del árbol), así se puede pasar detrás de la caja o la copa sin atravesar el objeto.
- **Partir las piezas grandes** (bosques) en árboles o grupos chicos, cada uno con su base.
- **Lo que se pisa** (puentes, muelle, escaleras, caminos) siempre debajo.
- Aplicar en el camino: carreta, troncos de la fogata, cerca del mirador con banco y barril, barriles del muelle, roble, árboles sueltos, bordes de los bosques. Después, en cada mapa que se rehaga.


### 6.14 Más historia en el Capítulo 1 (14/10, `js/core/ck_historia.js`)
No cambia los números de paso (otros archivos y las partidas guardadas dependen de ellos): usa banderas en `story.flags`.
- Paso 3 (volver con Bruno): Bruno da el corazón y manda a la **Biblioteca** → **Maestre Eloy** (anciano `npc6`, al lado del escritorio, x 236 y 158) cuenta del **Códice de las Brumas** y de **Varek**, su aprendiz → **Tabernero** de la Taberna 2 (x 170 y 168) → **Ruy, el buhonero** (el viajero de la fogata del camino, x 690 y 404) da **sal bendita** y pasa al paso 4. Bandera `h` = 'eloy' / 'taberna' / 'ruy'; `sal`.
- Paso 4: Tobías nombra a Varek si tenés la sal. Paso 6: al acercarse a la capilla habla **la voz de Varek** (antes de que salga el jefe).
- Al vencer al Nigromante cae el **Códice** (`codice`); en el paso 7 hay que llevárselo a Eloy (`codice_ok`) antes que al Rey (el Rey no avanza sin eso). Con el capítulo terminado, Eloy da el **epílogo** (las Torres de Escarcha, pista del Capítulo 2; `epilogo`).
- Objetivo y marca dorada siguen las partes nuevas. Premios: XP y monedas en cada parte.
- Prueba: `_scripts_ia/8_castillo/probar_historia.py` recorre todo.

### 6.15 Castillo redibujado (EN PREPARACIÓN)
- Elegidos por el dueño: castillo primero, hasta 250 créditos. Plan: Patio (12 partes de 192) + Aposentos (4) + Biblioteca (4) = 200 créditos.
- `captura2.py` saca la foto **sólo con lo que se hornea** (sin luces ADD, ambiente MULTIPLY, partículas, animados ni personajes; regla en `regla.js`) y la máscara de cada objeto con profundidad (render a textura). `armar_castillo.py` + `ck_castillo.tpl.js` arman `js/core/ck_castillo.js`: oculta lo horneado del área (también al volver a mostrarla), pone el fondo nuevo y las piezas. Probado con la foto vieja como "dibujo nuevo": se ve idéntico.
- Falta: redibujar con PixelLab (referencias `ref_salas` = taberna 2 + salón 3, `ref_patio` = portón del camino + salón 3 + roble), igualar color, coser, poner en `nuevo/<area>.png`, armar y probar. PixelLab va por la PC del dueño: hace falta que esté conectada.


### 6.16 Partidas guardadas (14/10, `js/core/ck_partidas.js`)
- `localStorage['castleknight_ranuras_v1']` = 3 ranuras `{nombre, heroe, story, lugar:{zona,x,y}, fecha, tiempo}`. La primera vez migra las partidas viejas de `castleknight_save_v1` (una por héroe).
- Menú: botón **CONTINUAR** (se agrega arriba de CAMPAÑA si hay partidas; sigue la más reciente). **CAMPAÑA** abre la pantalla de ranuras (`#ck-ranuras`): continuar, nueva (pide nombre, después el libro de héroes) o borrar, con confirmación dentro de la pantalla. Se oculta el botón viejo "borrar progreso del héroe".
- Con una ranura activa, `loadSave`/`saveStory`/`deleteSave` usan la ranura; cada 5 s se guarda lugar y tiempo. Lugares que se restauran: aldea, mapas del Taller (`ckEntrar`), castillo y ruinas; dentro de una casa se guarda la puerta.
- Prueba: `_scripts_ia/8_castillo/probar_partidas.py`.
- **Lista de cambios sin integrar:** `CAMBIOS_PENDIENTES.md` (en la raíz del juego).

### 6.17 Minimapa y mapa grande (14/10, `js/core/ck_minimapa.js`)
- Dibujos de cada zona hechos por código a partir de una foto del mapa (`_scripts_ia/9_minimapa/estilizar.py`: achica 1/4 afuera y 1/2 adentro, clasifica cada píxel en pasto, bosque, agua, camino, piedra, muro, madera, techo, alfombra u oscuro, y lo pinta con una paleta fija con contorno de tinta). `armar_minimapa.py` los embebe en base64 en `ck_minimapa.js` (sale de `ck_minimapa.tpl.js`).
- **Minimapa** abajo a la derecha (`#ck-minimapa`): flecha del héroe, `!` de la misión (usa la marca real si está en la zona), puntos rojos de enemigos, lugares descubiertos y flecha dorada en el borde hacia la misión o la salida que lleva a ella. Rueda o + / − para acercar, arrastrar para mirar, ◎ (o 5 s sin tocar) vuelve al héroe, clic abre el grande. Se esconde en diálogos y ventanas.
- **Mapa grande** con **M** (o clic, o la M del minimapa): pestañas con las zonas visitadas agrupadas (Aldea, Camino, Castillo, Ruinas), arrastrar / rueda / + − / ◎, nombres de los lugares, leyenda de lo descubierto (clic centra), cuántos faltan, y el objetivo con la salida a tomar. Usa `openOverlay('ck-mapa')` (pausa el juego; Esc o M cierran).
- **Niebla**: celdas de 16 px; afuera se destapa un radio de 120 px al caminar, adentro se ve toda la sala al entrar. Se guarda en `story.mapa[zona]` (bits en base64), o sea, con la partida.
- Datos para tocar: `Z` (zonas: dibujo, escala, tamaño, nombre, grupo), `L` (lugares por zona: nombre, x, y en píxeles del área, ícono, `va` = zona a la que lleva), `META_PASO` / `META_PARTE` (dónde es cada misión). La ruta a la misión sale sola de los `va` (búsqueda en anchura). **Al sumar un mapa:** foto → `estilizar.py` → agregar en `Z` y sus salidas en `L`.
- Prueba: `_scripts_ia/9_minimapa/probar.py`, `probar2.py`, `probar_guardar.py`.

### 6.18 Motor de luz (14/10, `js/core/ck_luz.js`)
- Reemplaza la capa azul de la noche (`nightShade`, se oculta) por un **mapa de luz**: un canvas a media resolución que cada cuadro se llena con la oscuridad del momento y suma las luces con `lighter` (halo suave que cae como (1-d)², estirado ×1.3, filtro lineal; con `BANDAS` 5-8 vuelven los anillos); se dibuja encima de todo (profundidad 27500) en MULTIPLY. Todo lo que esté por debajo (personajes, lluvia, niebla) toma la luz.
- Oscuridad: **afuera** = noche (misma curva que `updateDayNight`) × clima (`CK_CLIMA.efecto()`), y `PENUMBRA` por zona (ruinas). **Adentro** = `AMB_SALA[zona]` (o `'*'`), que de noche baja hacia `NOCHE` según `NOCHE_SALA`; las luces de adentro están siempre prendidas.
- Fuentes automáticas: `CK_EDITOR.lucesVivas` (luces del editor con su color: **toda luz nueva del editor alumbra sola**); todo sprite aditivo cuya textura diga glow/brillo/resplandor/halo (`fx_glow` del castillo y las ruinas: color = tinte, fuerza = transparencia, así hereda el parpadeo); `_ckAldea` (ventanas, faroles, fogata); `POR_TEXTURA` (fireball, necro_bolt, campfire/fogata, antorcha/brasero/vela); carga del trueno; `thunderStrike` (luz + destello); `damageEnemy` (chispa).
- API: `CK_LUZ.agregar({x,y,c:[r,g,b],r,f,ms,sigue,curva})`, `CK_LUZ.destello(c,k,ms)` (relámpago), `CK_LUZ.AMB_SALA` / `PENUMBRA` (para ajustar en vivo). Ajustes arriba del archivo: `NOCHE`, `BANDAS`, `ALCANCE`, `AMB_SALA`, `NOCHE_SALA`, `PENUMBRA`, `COL`. Apagar: `?ck_sin_luz=1`.
- **Para que algo nuevo dé luz:** ponerle una luz en el editor, o un brillo aditivo (`fx_glow` con tinte), o sumar su textura a `POR_TEXTURA`.

### 6.19 Clima (14/10, `js/core/ck_clima.js`)
- Climas `C`: despejado, nublado, lluvia, tormenta, nieve, niebla (cada uno: color que multiplica afuera, cuánto prende las luces, lluvia, nieve, niebla, viento, rayos). Pasa solo de uno a otro (`DURA` 80–170 s, `TRANSICION` 7 s) con `PESOS` por zona (normal / ruinas). Ruinas: nunca despejado (pasa a niebla); historia paso 6 en las ruinas = tormenta.
- Dibujo: partículas de gotas, salpicaduras y copos (texturas hechas por código) nacen en la vista y caen en el mundo; niebla = dos capas de ruido que se repite, pegadas al mundo y corridas por el viento. Todo en profundidad 27390–27451 (debajo del mapa de luz). Adentro no se ve.
- Tormenta: relámpago doble con `CK_LUZ.destello` y trueno con demora (`thunder_epic`/`thunder_strike` en tono grave). Sonido de lluvia y viento: ruido filtrado con `sfx.ctx` (volumen del juego; apagado y grave adentro).
- HUD: el clima se suma al recuadro del objetivo. Probar: `?ck_clima=<tipo>` (fijo), **F8** pasa al siguiente, `CK_CLIMA.poner(tipo, inmediato)` / `poner(null)` vuelve al azar.
- **Fuegos y lluvia:** con lluvia > 0.35 afuera, cada fuego de la zona (sprite cuya textura/animación diga fogata/campfire/cs_flame/flame/llama/hoguera) se apaga a su tiempo: pausa la animación, se esconde y en su lugar queda `ck_apagado_<textura>_<cuadro>` (la llama de arriba se borra y la de abajo queda carbón con brasas; si casi no queda nada, era solo la llama y no se dibuja nada), echa humo; sus brillos (`fx_glow` cercanos, resplandor y luz de noche de la aldea, luces del editor encima) bajan con él (en `postupdate`, sin pisar los parpadeos) y `CK_CLIMA.atenuar(x,y)` le avisa a `ck_luz.js`. Con lluvia < 0.12 se vuelven a prender. `CK_CLIMA.fuegos()` lista el estado.
- **Gotas en el piso:** salpicaduras animadas (`ck_salpica`, 4 cuadros) y anillos en el agua (`ck_onda`) en puntos al azar de la vista; si es agua lo dice `CK_MINIMAPA.terreno(zona,x,y)` (lee el dibujo del minimapa).
- Prueba y video: `_scripts_ia/10_luz/` (`probar_clima.py`, `demo_clima.py`, `probar_clima2.py`, `demo_clima2.py`).

### 6.20 Nieve que se acumula (14/10, `js/core/ck_nieve.js`)
- `A` (0..1) sube mientras nieva (`JUNTA` 45 s hasta todo blanco) y baja al parar (`DERRITE` 100 s). Por zona de afuera se arman (en segundo plano, `PRESUPUESTO` ms por cuadro) tres dibujos del piso a partir del suelo (aldea: `ck_aldea_fondo`; editor: `ed_suelo_*`) y una "tapa" por cada pieza (casas, árboles, cercas: bordes de arriba de 2-4 px, techos de paja casi enteros, puntitos en las copas). La nieve copia las sombras del dibujo de abajo. Etapas en `ETAPAS`; qué se cubre primero en `umbralPiso` (pasto y techos, después piedra, caminos y bordes oscuros; el agua nunca).
- Piso nevado: profundidad del suelo +0.05 (aldea, debajo del agua animada) o +0.28 (editor: encima de los brillos del piso, debajo del foso). Tapas: profundidad de la pieza +0.001; se ven solo si la pieza se ve.
- Castillo y ruinas: sin dibujo de suelo de una pieza, por ahora reciben solo las tapas de sus objetos. Probar: `?ck_clima=nieve`, `CK_NIEVE.poner(1)`.

### 6.21 Vida y detalles (14/10, `ck_fauna.js`, `ck_detalles.js`, `ck_heroe_fx.js`)
- **Dónde va cada cosa:** `CK_MINIMAPA.terreno(zona, x, y)` devuelve el terreno del dibujo del minimapa ('agua', 'pasto', 'bosque', 'camino', 'piedra', 'muro', 'madera', 'techo', 'alfombra', 'borde'). Todo lo de abajo lo usa; al sumar un mapa con su dibujo de minimapa, la fauna y los charcos se ubican solos.
- **`ck_fauna.js`:** tabla `FAUNA` por zona (cuántas bandadas de aves/palomas/cuervos, mariposas, luciérnagas, peces, ranas, gallinas, gato, murciélagos). Datos de la aldea en `ALDEA` (corrales, gallinero, lugares del gato). Todo dibujado en lienzos (`ckf_*`). Las luciérnagas van encima de la oscuridad (27510) y suman luz con `CK_LUZ.fuente`. Sonidos por código en `CK_SINTE` (grillo, rana, cacareo, maullido, chillido, chapuzón; pájaros y cuervos con los clips del Taller), ubicados por lado y distancia. Los pájaros del Camino siguen siendo los de `ck_camino.js`.
- **`ck_detalles.js`:** huellas (cada 9 px; nieve 22 s, barro 12 s, tierra 6 s), `CK_DETALLES.mojado` (0..1, sube con lluvia en 25 s, se seca en 60 s), charcos (hasta 14 por zona en 'camino'; reflejan la luz más fuerte de `CK_LUZ.ultimas()`, les caen gotas, salpican al pisarlos), ráfagas con hojas y polvo, chimeneas de la aldea (3, dibujadas por código; humo de noche, de mañana y con frío, encima de la oscuridad), destellos y bruma en el agua, sombras del sol (héroe, gente, bestias; a la altura del piso). Profundidad del piso por zona en `PISO`/`profPiso` (aldea 0.58, mapas del editor 7.29); castillo y ruinas no tienen huellas ni charcos por ahora.
- **`ck_heroe_fx.js`:** aliento (nieve, nevado o noche afuera), mojado (tinte azulado que no pisa otros tintes, gotitas), nevado (8 copitos en cabeza y hombros; el dash los sacude), polvo según el piso al correr y en el dash. Estado en `CK_HEROE_FX.estado`.
- Prueba: `_scripts_ia/11_vida/` (`probar.py`, `cerca.py` arma la hoja de detalles de cerca, `demo.py`).

### 6.24 Repositorios y .gitignore (14/10)
- Los dos proyectos ya son repos públicos en GitHub (rama `main`): `D:\prueba` → **CastleKnights**, `D:\Editor` → **AcePixelStudio**.
- **Juego** (`D:\prueba\.gitignore`): no se suben `node_modules/`, logs, temporales, cachés de IA/IDE, `*_backup.*`, `tools/mapgen/*/work/`, los packs de origen que el juego no usa (`assets/raw/`, `assets/characters/nuevos/`) ni los `assets/sfx_*.mp3` sueltos. `TRASPASO.md`, `TRASPASO_historial.md` y `CAMBIOS_PENDIENTES.md` **sí** se suben acá. README actualizado (estructura, cómo jugar con doble clic).
- **Editor** (`D:\Editor\.gitignore`): no se suben las copias de `TRASPASO*.md`, `trabajo/errores.txt`, las carpetas `trabajo/_*` (respaldos, borradores de música y sonidos, sprites a medio hacer) **salvo `trabajo/_scripts_ia/`**, las `versiones/` de cada proyecto ni el proyecto de prueba `trabajo/asdasd/`. Sí se suben `trabajo/castleknight` (los mapas) y las carpetas de arte de cada mapa.
- **Para subir:** doble clic en `D:\Editor\trabajo\_scripts_ia\12_repositorio\preparar_subida.bat`: en los dos repos deja de seguir lo ignorado (sin borrar nada de la PC), agrega lo nuevo, abre la lista en el Bloc de notas y pregunta si hace commit + push. Al agregar carpetas nuevas de borradores, que empiecen con `_` dentro de `trabajo/` para que no se suban.

### 6.23 Minimapa con siluetas planas (14/10, refinado)
- Los dibujos del minimapa salen de `estilizar3.py` (en `_scripts_ia/9_minimapa/`; reemplaza a `estilizar2.py`): un color plano por terreno, sin contornos ni textura. Limpieza: voto de vecinos dos veces, afuera se sacan las manchitas oscuras y los charquitos de agua sueltos (< 24 px), el borde pasto/bosque se suaviza, y cada casa es una sola silueta (techo + paredes). Volumen: sombra suave (×0.82) uno o dos píxeles abajo a la derecha de lo alto (bosque, paredes, techos) y luz (×1.12+6) en el borde de arriba de techos y copas. `armar_minimapa.py` toma `min3/*.png`.
- La paleta (`TERRENOS` en `ck_minimapa.tpl.js`) tiene cada color base más su versión en sombra y en luz, todas con el mismo nombre de terreno: `CK_MINIMAPA.terreno()` sigue devolviendo el terreno correcto para la lluvia, los aleros, la fauna, los charcos y el hielo. **Si se cambia la paleta en `estilizar3.py`, cambiarla igual en `BASE` del tpl.**

### 6.22 Ajustes del clima (14/10, tarde)
- **Adentro / afuera:** los mapas del editor vienen todos marcados `outdoor: true`; ahora manda `CK_AFUERA(S)` (en `ck_luz.js`): son salas las de `INTERIORES` (taberna 2, salón 3 y sus versiones viejas), las de `AMB_SALA`, o cualquier mapa del editor con `interior: true`. Todo el clima, la luz, la fauna y los detalles lo usan. **Al sumar un mapa interior del editor, agregarlo a `INTERIORES`.**
- **Lluvia que pega en las cosas:** ya no es una capa encima de todo. Cada gota elige un punto (piso, agua, techo o copa) y cae hasta ahí; se dibuja en 14 franjas de profundidad, así que las casas y árboles tapan las gotas que caen detrás. Las que caen en un techo van arriba de todo. Rompen en coronitas (piso, techos) o anillos (agua; si está congelada, corona). Las copas de los árboles atajan la mitad. Chorritos de los bordes de los techos (`aleros()`, sacados del minimapa).
- **Goteras:** adentro, si llueve afuera, 2-3 lugares donde gotea del techo con sonido y se junta un charquito que se seca después.
- **Rayos al suelo** en la tormenta (cada 4-11 s): aviso de luz en el piso, descarga quebrada con ramas, luz y destello, chispas, temblor, trueno fuerte y marca quemada que se borra; nunca a menos de 60 px del héroe; a las bestias de al lado les saca 2 de vida.
- **Ríos congelados** (`ck_nieve.js`): con bastante nieve el agua del suelo se cubre de hielo (celeste con vetas, grietas y nieve en la orilla); `CK_NIEVE.hielo()` 0..1. Peces y ranas desaparecen.
- **Chimeneas:** se sacaron las agregadas; humo solo en las dibujadas en los mapas (`CHIMENEAS` en `ck_detalles.js`; por ahora la cabaña del camino).
- **Huellas** más chicas y suaves.
- **Nieve en los árboles** (`mascaraNieve` en `ck_nieve.js`): en las hojas se posa en el borde de arriba de cada mata (donde arriba hay sombra más oscura), en manchones de ruido y engordada un píxel hacia abajo; ya no en rayitas. Los bosques del camino están partidos en franjas por `ck_camino_prof.js` (ahora expone `window.CK_PARTES`): su nieve se calcula sobre el dibujo entero y se recorta a cada franja, así los cortes no aparecen como líneas rectas.

## 7. Scripts guardados (`D:\Editor\trabajo\_scripts_ia\`)
Tienen rutas de la nube (`/tmp/claude-0/...`) adentro: ajustarlas al subirlos.

| Carpeta | Scripts |
|---|---|
| `1_imagen_a_mapa` | `periodo.py` (mide el agrandado), `reducir.py` (a 1 color por píxel de arte; verde → transparente), `paredes.py` (rellena negro de muros), `colisiones.py` (zonas → rectángulos), `cortar.py` / `exportar.py` (lámina verde → piezas con nombre). |
| `2_separar_objetos` | `separar_taberna.py`, `separar_trono.py` (muebles fuera de la escena con relleno), `colisiones_trono.py`. |
| `3_agrandar_con_pixellab` | `unir.py` (coser cuadros), `registrar.py`, `clasificar.py`, `colisiones.py`, `piezas.py` (profundidad + rectángulos), `pasto.py` (rellenar con pasto), `grilla.py` (zoom con grilla). |
| `4_fuego_y_agua` | `animar.py` (llamas), `antorchas.py`, `aplicar.py` (ejemplo de aplicar a un proyecto), `foso_ondas.py`. |
| `5_editor_y_exportar` | `datos.py`, `correr.py`, `armar_trono3.js`, `armar_camino.js` (armar en el editor), `unir.py` / `unir_camino.py` (mezclar en el proyecto), `exportar_mapa.py` (mezclar en el juego). |
| `7_aldea` | Ver 6.12 (aldea redibujada). |
| `8_castillo` | Ver 6.14 y 6.15 (`captura.py`, `captura2.py`, `regla.js`, `preparar.py`, `armar_castillo.py`, `ck_castillo.tpl.js`, `comparar.py`, `probar_historia.py`, `probar_partidas.py`). |
| `12_repositorio` | Ver 6.24 (`preparar_subida.bat`). |
| `9_minimapa` | Ver 6.17 y 6.23 (`zonas.py`, `captura_zonas.py`, `estilizar.py`, `estilizar2.py`, `estilizar3.py`, `ck_minimapa.tpl.js`, `armar_minimapa.py`, `probar.py`, `probar2.py`, `probar_guardar.py`). |
| `10_luz` | Ver 6.18 y 6.19 (`probar.py`, `demo.py`, `probar_clima.py`, `demo_clima.py`). |
| `11_vida` | Ver 6.21 (`probar.py`, `cerca.py`, `demo.py`). |
| `6_pruebas` | `srv.sh`, `pjuego2.py` (juego), `pr.py` (editor), `probar.py`, `probar_vida.py` (recorridos del camino). |

## 8. Referencia rápida de los mapas nuevos

**Taberna 2 (`taberna_2`, 480×272):** 32 muebles `t2_*` movibles con colisión anclada; fondo `t2_taberna2_escena_vacia`; entrada desde la puerta de la taberna; lugares de aldeanos en `ck_vida.js` (`LUGARES_TABERNA`, puerta en 240, 258).

**Salón del Trono 3 (`salon_del_trono_3`, 480×572):** fondo `s3_trono3_escena` (con los arcos horneados en x 64 y 416); trono en (240, 73); pie del estrado (240, 104); llegada desde el patio abajo; arcos → `kingroom` / `library` (llegada en x 64 / 416, y 86). Salida → patio (320, 182).

**Camino al Castillo (`camino_al_castillo`, 1436×758):**
- Llegada (60, 434). Salida a la aldea: borde oeste (x -4..32, y 408..458).
- Puente levadizo: centro x 1189, bisagra y 357, punta y 425, ancho 46; agua del foso entre y 372 y 418; cadenas desde y 303. Portón: portal en (1189, 352). Vuelta desde el patio: (1189, 440).
- Escalera principal x 808–864, y 262–428. Escalera lateral en diagonal de (1062–1118, 452) a (1000–1062, 648).
- Cabaña: chimenea (184, 78); vidrios de la ventana (209–222, 136–146); luz en el piso (216, 206).
- Fogata (645, 356). Viajero (690, 404). Guardias (1153 y 1225, 452). Mirador (808, 596).
- Assets `cc_*`: escena, 11 piezas de profundidad, `cc_fogata` (6 cuadros 50×54), `cc_foso` (8 cuadros 392×288, piso).
- El camino de abajo a la derecha, detrás de los riscos, es decorado (no se llega).

## 9. Pendientes y preguntas abiertas

**Preguntas al dueño sin respuesta:**
1. NPC del puente/camino que reaccionen a las bestias (él dijo "luego probamos eso"). Propuesta: guardias pelean, gente se esconde. ¿Los guardias hacen daño de verdad?
2. Merodeador nocturno de la aldea (`ck_vida.js`): ¿dejarlo, sacarlo o más raro?
3. Piso de arriba de la taberna (la escalera no lleva a nada).
4. Puertas laterales del "Salón del Trono (nuevo)": ¿abrir pasos y a dónde?
5. ¿Hacer transitable el camino de abajo a la derecha del Camino al Castillo?
6. Panadero de frente: ¿usar la lámina nueva? Perfil del panadero para que coincida con el herrero.

**Para hacer:**
- Ver la lista de pulido y **transiciones coherentes entre mapas** en `CAMBIOS_PENDIENTES.md` (se aparece del lado por el que se viene; hoy aldea sur → camino oeste y patio oeste → patio de armas abajo están mal; el dueño va a dar indicaciones al sumar mapas).
- **Unificar la estética:** aldea hecha (13/10). Faltan castillo, ruinas, interiores.
- Seguir con el método de la aldea en los demás mapas viejos (castillo, ruinas, interiores).
- Fuego de las tabernas todavía pintado (se puede animar como en los salones).
- NPC de verdad para los paseantes (fichas del editor con diálogo y colisión). Reemplazar NPC viejos con la estética nueva.
- Botones del editor para "lámina → objetos / animación" y "pulir silueta" (hoy se hace con scripts).
- Para después de la entrega: rampas de color, dither, papel cebolla de varios cuadros, sección Sonido completa, carga por zonas, una sola fuente de arte.
- Renombrar carpetas (a mano): `D:\Editor` → `AceSpriteStudio`, `D:\prueba` → `CastleKnights` (confirmar nombre). En el editor hay que volver a elegir la carpeta del juego.
- Música: confirmar la de práctica (B lenta o C) y escuchar las costuras.
- `index.html` vs `editor.html` del editor: decidir si queda uno.
- Orden que no se puede hacer desde la nube: 3 `sfx_*_20261007_*.mp3` sueltos en `D:\prueba\assets\`; scripts viejos de depuración en `D:\prueba\scripts\`; archivos vaciados que quedaron (`css/tema_taller.css`, `js/secciones/jugar.js`, `anim.js`, `pixel.js` del editor).

## 10. Problemas conocidos
- Un archivo rechazado por mtime al entregar = el dueño lo cambió. Bajarlo de nuevo y mezclar.
- Los PNG/MP3 que llegan a la PC no son byte a byte iguales (C2PA): comparar por píxeles / audio.
- Built-in browser no abre `file://`; las pruebas se hacen en la nube con Playwright.
- `wait_for_jobs` de PixelLab corta a los 60 s (no es error del trabajo).
- El clasificador de seguridad de la nube a veces no responde y bloquea comandos un rato: esperar y reintentar; mientras, avanzar con lectura/edición de archivos.
- **"Quitar halo"** en Convertir se sacó: no reintroducirlo.
- Las luces del editor se dibujan igual en editor y juego: el bloque `/*<luz-nucleo>*/` de `js/core/luces.js` está copiado en `juego/editor_loader.js` (hay una prueba que lo compara).
