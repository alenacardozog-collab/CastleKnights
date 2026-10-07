# Estructura del proyecto

El juego son **scripts clásicos** cargados en orden desde `index.html` (no módulos ES), a propósito: así
sigue funcionando al abrir `index.html` con doble clic. Todos comparten el mismo ámbito global.

Después de agregar, mover o borrar un archivo: **`npm run check`** (no abre el juego; avisa si rompiste algo).

## Mapa de carpetas

```
index.html              página + lista de <script> en orden de carga
js/
  game.js               arranque: config de Phaser y menú de inicio (siempre el último script)
  *_assets.js, *_data.js  arte embebido en base64 (generado, no se edita a mano)
  core/
    audio.js            efectos, música, ambientes, volúmenes
    keybinds.js         teclas configurables
  config/
    world_constants.js  qué casa es qué, listas de assets, hojas animadas, salidas entre mapas
    map_catalog.js      catálogo y datos del mapa de práctica / editor
  maps/
    layout_kit.js       buildInteriorLayout + helpers para escribir mapas (put, putc, place, portal, light…)
    interiors/          bar.js, tienda.js, granero.js, casa.js   (una casa por archivo)
    castle.js           todas las zonas del castillo
    ruins.js            la aldea en ruinas
    data/               castle_maps.js, ruins_map.js   posiciones de props y colisiones (legible, editable)
  scene/
    main_scene.js       clase MainGameScene: constructor, create, modos de juego, pausa, update
    assets_preload.js   carga de todas las imágenes, hojas, sonidos y mapas
    world/
      village_map.js    aldea y mapa de práctica (Tiled, capas, sombras)
      collisions.js     colisiones y obstáculos
      areas.js          motor de zonas: puertas, entrar/salir, construir y actualizar una zona, puente levadizo
      area_effects.js   llamas, clima, partículas, cuervos, actores del castillo
    characters/
      player.js         héroes: animaciones, controles, movimiento, daño
      combat.js         ataques y habilidades
      enemies.js        oleadas, IA, corazones
      npcs.js           aldeanos
    ui/
      hud.js            HUD, textos flotantes, opciones, botones de la página
      hero_select.js    selección de héroe
    editor/             editor de mapas y modo desarrollador
assets/                 imágenes y sonidos originales
tools/mapgen/           generadores de mapas (Python): ruins/build.py, castle/build.py, mapkit.py
scripts/check.js        verificación de la estructura (npm run check)
```

Los archivos de `js/scene/**` (salvo `main_scene.js`) agregan métodos a la escena con
`Object.assign(MainGameScene.prototype, { ... })`. Adentro se usa `this` igual que antes.

## Recetas

**Mover / quitar / agregar un objeto en las ruinas o en el castillo (camino, adarve, jardín)**
Editá `js/maps/data/ruins_map.js` o `castle_maps.js`: cada línea de `items` es
`[sprite, x, baseY, espejado, animación?]` y cada entrada de `cols` es un rectángulo sólido `[x, y, ancho, alto]`.
Ojo: las sombras están pintadas en la imagen del suelo; si movés algo grande la sombra queda en el lugar viejo.
Para rehacer suelo, sombras y datos juntos: `npm run build:ruins` / `npm run build:castle` (necesita Python con Pillow y numpy).

**Mover algo en una casa o en una sala del castillo**
Está en el archivo de ese lugar (`js/maps/interiors/*.js`, `js/maps/castle.js`) como llamadas
`put(...)`, `putc(...)`, `place(...)`: cambiá las coordenadas (x, baseY) o borrá la línea.

**Agregar un NPC que habla en una zona**
En el archivo del mapa: `person(area, 'soldier_idle', 'soldier_idle', x, y, { scale: 1.2 })` y
`talker(area, x, y, ['frase 1', 'frase 2'])` (en `ruins.js` el helper se llama `talk`).

**Agregar una casa nueva**
1. Creá `js/maps/interiors/<nombre>.js` copiando `bar.js` y registrá `INTERIOR_LAYOUTS.<nombre>`.
2. En `js/config/world_constants.js` asociá la casa en `HOUSE_INTERIORS`.
3. Agregá su `<script>` en `index.html` (grupo 4).

**Agregar un mapa exterior nuevo**
1. Layout en `js/maps/<mapa>.js` (mirá `ruins.js`: es el más corto).
2. Entrada desde la aldea: una constante de salida en `world_constants.js` y un `enter<Mapa>()` en `scene/world/areas.js` (copiar `enterRuins`).
3. Arte: lista de claves en `world_constants.js`; se carga en `scene/assets_preload.js`.

**Agregar un sprite animado (cuadros de PixelLab)**
Guardá la tira en `assets/...`, declarala en `MAP_SHEETS` (`world_constants.js`) con tamaño de cuadro y animación,
y usala en el mapa como item con `anim`.

**Agregar un efecto ambiental (lluvia, niebla, etc.)**
Un `else if (f.type === '...')` nuevo en `addAreaEffects` (`scene/world/area_effects.js`); se activa desde el mapa con
`area.fx.push({ type: '...', x, y, w, h })`.

**Agregar un sonido**
Copiá `<nombre>.mp3` a `assets/audio/sfx/`; no hay que registrarlo, se carga solo la primera vez que se usa: `sfx.fx('nombre', volumen)`.
Ambientes de zona: `ambient: [['amb_x', 0.5]]` en el área.

**Agregar un ataque o habilidad**
`scene/characters/combat.js`; la tecla se enlaza en `player.js` (`setupControls`) y se define en `core/keybinds.js`.

**Agregar un archivo de código**
Ponelo en la carpeta que corresponda, agregá su `<script>` en `index.html` en el grupo correcto y corré `npm run check`.
Si agrega métodos a la escena, usá el mismo `Object.assign(MainGameScene.prototype, { ... })`.

## Reglas para no romper nada
- No declares dos veces el mismo nombre global ni el mismo método de la escena: el segundo pisa al primero sin avisar (`npm run check` lo detecta).
- Respetá el orden de los grupos en `index.html`: arte → datos de mapas → core/config → layouts → escena → `game.js`.
- Al cambiar un archivo, subí su `?v=` en `index.html` para que el navegador no use la copia vieja.
- Los `*_assets.js` son generados: si cambiás un PNG de `assets/castle` o `assets/ruins`, regenerá con `npm run build:*`.
