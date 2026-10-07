#!/usr/bin/env node
/**
 * Safety net for the project structure. Run after adding, moving or deleting files:  npm run check
 * It does not open the game; it catches the mistakes that would break it at load time:
 *   - a <script> in index.html whose file is missing, or a code file that no <script> loads
 *   - syntax errors
 *   - the same global (const / class / function) or the same MainGameScene method defined twice
 *   - a house, map prop, asset key or sprite sheet that points to something that does not exist
 */
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.join(__dirname, '..') + path.sep;
const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);
const read = f => fs.readFileSync(ROOT + f, 'utf8');
const exists = f => fs.existsSync(ROOT + f);

// ---- 1. scripts of index.html
const html = read('index.html');
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1]).filter(s => !/^https?:/.test(s)).map(s => s.split('?')[0]);
scripts.forEach(s => { if (!exists(s)) err(`index.html loads ${s} but the file does not exist`); });
const dupTags = scripts.filter((s, i) => scripts.indexOf(s) !== i);
dupTags.forEach(s => err(`index.html loads ${s} twice`));
const walk = d => fs.readdirSync(ROOT + d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(d + '/' + e.name) : e.name.endsWith('.js') ? [d + '/' + e.name] : []);
walk('js').forEach(f => { if (!scripts.includes(f)) err(`${f} is not loaded by index.html (add its <script> or delete the file)`); });
const order = (a, b, why) => { const i = scripts.findIndex(s => a.test(s)), j = scripts.findIndex(s => b.test(s)); if (i > -1 && j > -1 && i > j) err(`script order: ${why}`); };
order(/maps\/data\//, /config\/world_constants/, 'js/maps/data/* must load before js/config/world_constants.js');
order(/maps\/layout_kit/, /maps\/(interiors\/|castle|ruins)/, 'js/maps/layout_kit.js must load before the layouts');
order(/scene\/main_scene/, /scene\/(world|characters|ui|editor|assets_preload)/, 'js/scene/main_scene.js must load before the other scene files');
if (scripts[scripts.length - 1] !== 'js/game.js') err('js/game.js (bootstrap) must be the last script');

// ---- 2. syntax
const code = scripts.filter(s => exists(s));
code.forEach(s => { const r = cp.spawnSync(process.execPath, ['--check', ROOT + s], { encoding: 'utf8' }); if (r.status !== 0) err(`syntax error in ${s}:\n${r.stderr.split('\n').slice(0, 4).join('\n')}`); });

// ---- 3. duplicated globals and scene methods
const small = code.filter(s => fs.statSync(ROOT + s).size < 200000);       // skip the big base64 blobs
const globals = Object.create(null), methods = Object.create(null);
const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'function', 'return']);
small.forEach(s => {
  const src = read(s);
  const mixin = /Object\.assign\(MainGameScene\.prototype/.test(src);      // feature files only add methods (their column-0 text is inside template strings)
  if (!mixin) for (const m of src.matchAll(/^(?:const|let|var|class|function)\s+([A-Za-z_$][\w$]*)/gm)) (globals[m[1]] = globals[m[1]] || []).push(s);
  if (/Object\.assign\(MainGameScene\.prototype/.test(src) || /class MainGameScene/.test(src)) {
    for (const m of src.matchAll(/^  (?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/gm)) if (!KEYWORDS.has(m[1])) (methods[m[1]] = methods[m[1]] || []).push(s);
  }
});
Object.entries(globals).forEach(([n, fl]) => { if (fl.length > 1) err(`global "${n}" is declared in more than one file: ${fl.join(', ')}`); });
Object.entries(methods).forEach(([n, fl]) => { if (fl.length > 1) err(`MainGameScene method "${n}" is defined more than once: ${fl.join(', ')} (the last one silently wins)`); });

// ---- 4. data that points to files
try {
  const ctx = { window: {}, console }; ctx.window.window = ctx.window; vm.createContext(ctx);
  const load = ['js/maps/data/castle_maps.js', 'js/maps/data/ruins_map.js', 'js/config/world_constants.js'].filter(exists).map(read).join('\n');
  const C = vm.runInContext(load + '\n;({ HOUSE_INTERIORS, CASTLE_ASSET_KEYS, CASTLE_SHEETS, RUINS_ASSET_KEYS, INTERIOR_ASSET_KEYS, MAP_SHEETS, RUINS_MAP: window.RUINS_MAP, CASTLE_MAPS: window.CASTLE_MAPS })', ctx);
  const layouts = new Set(code.filter(s => /js\/maps\//.test(s)).flatMap(s => [...read(s).matchAll(/INTERIOR_LAYOUTS\.(\w+)\s*=/g)].map(m => m[1])));
  Object.entries(C.HOUSE_INTERIORS).forEach(([h, k]) => { if (!layouts.has(k)) err(`HOUSE_INTERIORS: ${h} -> "${k}" but no layout registers INTERIOR_LAYOUTS.${k}`); });
  ['castle', 'ruins', 'casa'].forEach(k => { if (!layouts.has(k)) err(`layout "${k}" is missing (js/maps)`); });
  C.CASTLE_ASSET_KEYS.concat(Object.keys(C.CASTLE_SHEETS)).forEach(k => { if (!exists(`assets/castle/${k}.png`)) err(`castle asset "${k}" has no file assets/castle/${k}.png`); });
  C.RUINS_ASSET_KEYS.forEach(k => { if (!exists(`assets/ruins/${k}.png`)) err(`ruins asset "${k}" has no file assets/ruins/${k}.png`); });
  Object.entries(C.MAP_SHEETS).forEach(([k, sh]) => { if (!exists(sh.file)) err(`MAP_SHEETS.${k}: file ${sh.file} does not exist`); });
  const anims = new Set(Object.values(C.MAP_SHEETS).flatMap(sh => Object.keys(sh.anims)));
  const csKeys = new Set(C.CASTLE_ASSET_KEYS.map(k => 'cs_' + k).concat(Object.keys(C.MAP_SHEETS)));
  const ruKeys = new Set(C.RUINS_ASSET_KEYS.map(k => 'ru_' + k).concat(Object.keys(C.MAP_SHEETS)));
  const village = new Set(exists('assets/map2/Art') ? walk2('assets/map2/Art').map(f => path.basename(f, '.png')) : []);
  function walk2(d) { return fs.readdirSync(ROOT + d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk2(d + '/' + e.name) : e.name.endsWith('.png') ? [d + '/' + e.name] : []); }
  const checkMap = (name, M, has, w, h) => {
    (M.items || []).forEach(([k, x, y, f, a], i) => {
      if (!has(k)) err(`${name}: item ${i} uses sprite "${k}" which is not a known asset`);
      if (a && !anims.has(a)) err(`${name}: item ${i} uses animation "${a}" which MAP_SHEETS does not define`);
      if (x < -40 || y < -10 || x > w + 40 || y > h + 60) warn(`${name}: item ${i} "${k}" at ${x},${y} is outside the map (${w}x${h})`);
    });
    (M.cols || []).forEach((c, i) => { if (c.length !== 4 || c[2] <= 0 || c[3] <= 0) err(`${name}: collider ${i} is not [x, y, w, h] with a positive size`); });
  };
  if (C.RUINS_MAP) checkMap('ruins', C.RUINS_MAP, k => ruKeys.has('ru_' + k), C.RUINS_MAP.w, C.RUINS_MAP.h);
  Object.entries((C.CASTLE_MAPS || {}).maps || {}).forEach(([n, M]) => checkMap('castle.' + n, M, k => csKeys.has(k) || village.has(k), M.w, M.h));
} catch (e) { err('could not evaluate the constants / map data: ' + e.message); }

// ---- report
const kb = code.reduce((a, s) => a + fs.statSync(ROOT + s).size, 0) / 1024;
console.log(`checked ${scripts.length} scripts (${kb.toFixed(0)} KB), ${Object.keys(methods).length} scene methods, ${Object.keys(globals).length} globals`);
warns.forEach(w => console.log('  warning: ' + w));
if (errors.length) { errors.forEach(e => console.log('  ERROR: ' + e)); console.log(`\n${errors.length} problem(s) found`); process.exit(1); }
console.log('OK — structure is consistent');
