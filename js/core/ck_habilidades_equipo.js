'use strict';
/* Habilidades que se desbloquean y se equipan (03/11, pedido del dueño: "que el mago tenga más habilidades de magia, y que
   sean desbloqueables y luego equipables, igual para el caballero y la otra").
   - 4 RANURAS: Q, E, R y F. Cada héroe trae dos habilidades de base (arrancan en Q y E) y las del árbol (H) se aprenden con
     puntos y después se ponen en la ranura que uno quiera. J, K, Espacio y C siguen igual. F ya no es pantalla completa:
     pasó a F11.
   - En el árbol (H) aparece abajo la fila "Equipadas": elegí una habilidad aprendida (del árbol o de las de base) y apretá
     Q, E, R o F (o hacé clic en la ranura) para ponerla ahí. Si ya estaba en otra ranura, se cambian de lugar.
   - Habilidades nuevas:
       Horos: Anillo de llamas, Meteoro, Ventisca, Prisión de hielo, Tormenta eléctrica y una rama nueva, ARCANO (Flujo
       arcano, Misiles arcanos, Sabiduría, Escudo arcano, Drenaje vital). De base: Trueno y Ráfaga helada.
       Lancent: Disparo cargado, Salto aplastante, Golpe de escudo. De base: Lluvia de flechas y Torbellino.
       Aby: Tajo cruzado, Marca de muerte, Relámpago. De base: Danza de filos y Pirueta.
       Oso (ck_heroe_oso.js): su árbol entero vive acá también (Furia, Tierra, Bosque).
   - Íconos de PixelLab para todos los nodos (ck_hud_heroe_arte.js).
   Se guarda en story.hab.ranuras (y en la práctica, aparte). Borrar la línea de index.html deja todo como antes (R). */
(function () {
  if (typeof MainGameScene === 'undefined' || !window.CK_HABILIDADES) return;
  const P = MainGameScene.prototype;
  const HB = window.CK_HABILIDADES, ARBOL = HB.ARBOL, ACT = HB.ACTIVAS, HACER = HB.HACER;
  const EP = () => window.CK_EPICO || {};
  const R = (a, b) => a + Math.random() * (b - a);
  const TECLAS = ['Q', 'E', 'R', 'F'];

  // ================================================================== árboles: nodos nuevos
  const rama = (h, id) => ARBOL[h] && ARBOL[h].ramas.find(r => r.id === id);
  const sumar = (h, id, nodos) => { const r = rama(h, id); if (r) nodos.forEach(n => { if (!r.nodos.find(x => x.id === n.id)) r.nodos.push(n); }); };
  sumar('soldier', 'arco', [{ id: 'cargado', n: 'Disparo cargado', max: 1, req: 5, tipo: 'a', d: () => 'Nueva: una flecha dorada que atraviesa todo lo que encuentra y hace 3. 35 de aguante, 7 s.' }]);
  sumar('soldier', 'espada', [{ id: 'salto', n: 'Salto aplastante', max: 1, req: 5, tipo: 'a', d: () => 'Nueva: salta hacia adelante y al caer golpea alrededor (2) y aturde. 40 de aguante, 9 s.' }]);
  sumar('soldier', 'guardia', [{ id: 'golpe_escudo', n: 'Golpe de escudo', max: 1, req: 5, tipo: 'a', d: () => 'Nueva: un golpe con el escudo que empuja y aturde 2 s a los de adelante (1). 25 de aguante, 6 s.' }]);
  sumar('swordsman', 'danza', [{ id: 'tajo', n: 'Tajo cruzado', max: 1, req: 4, tipo: 'a', d: () => 'Nueva: dos cortes en cruz adelante (2 y 1) que hacen sangrar. 30 de aguante, 6 s.' }]);
  sumar('swordsman', 'filo', [{ id: 'marca', n: 'Marca de muerte', max: 1, req: 5, tipo: 'a', d: () => 'Nueva: marca a la bestia más cercana; el próximo golpe que le des hace el triple. 20 de aguante, 12 s.' }]);
  sumar('swordsman', 'sombra', [{ id: 'relampago', n: 'Relámpago', max: 1, req: 4, tipo: 'a', d: () => 'Nueva: cruza como un rayo hacia adelante y lastima (1) a todo lo que atraviesa; al final, una descarga (2). 30 de aguante, 7 s.' }]);
  sumar('wizard', 'fuego', [
    { id: 'anillo', n: 'Anillo de llamas', max: 1, req: 4, tipo: 'a', d: () => 'Nueva: un anillo de fuego alrededor durante 3 s que quema (1 cada medio segundo) a lo que entre. 40 de maná, 12 s.' },
    { id: 'meteoro', n: 'Meteoro', max: 1, req: 5, tipo: 'a', d: () => 'Nueva: una roca ardiente cae adelante: 3 de daño alrededor y deja brasas. 50 de maná, 14 s.' }]);
  sumar('wizard', 'hielo', [
    { id: 'ventisca', n: 'Ventisca', max: 1, req: 4, tipo: 'a', d: () => 'Nueva: 4 s de tormenta de nieve alrededor: frena mucho y hace 1 por segundo. 40 de maná, 14 s.' },
    { id: 'prision', n: 'Prisión de hielo', max: 1, req: 5, tipo: 'a', d: () => 'Nueva: congela a todas las bestias cercanas 2,5 s (1 de daño). 45 de maná, 16 s.' }]);
  sumar('wizard', 'tormenta', [{ id: 'tormenta', n: 'Tormenta eléctrica', max: 1, req: 4, tipo: 'a', d: () => 'Nueva: durante 3 s caen seis rayos sobre las bestias cercanas (2 cada uno). 45 de maná, 15 s.' }]);
  if (ARBOL.wizard && !rama('wizard', 'arcano'))
    ARBOL.wizard.ramas.push({ id: 'arcano', nombre: 'Arcano', color: '#8a3ab0', nodos: [
      { id: 'flujo', n: 'Flujo arcano', max: 3, req: 0, d: r => `Todas las habilidades equipadas se recargan ${r * 8}% más rápido.` },
      { id: 'misiles', n: 'Misiles arcanos', max: 1, req: 1, tipo: 'a', d: () => 'Nueva: tres misiles violetas que buscan solos a las bestias más cercanas (1 cada uno). 25 de maná, 4 s.' },
      { id: 'sabio', n: 'Sabiduría', max: 2, req: 2, d: r => `+${r * 15} de maná máximo.` },
      { id: 'escudo_arcano', n: 'Escudo arcano', max: 1, req: 3, tipo: 'a', d: () => 'Nueva: una burbuja que aguanta los próximos dos golpes (dura 8 s). 35 de maná, 18 s.' },
      { id: 'drenaje', n: 'Drenaje vital', max: 1, req: 4, tipo: 'a', d: () => 'Nueva: le roba la vida a la bestia más cercana: 2 de daño y te cura 1 corazón. 40 de maná, 15 s.' }] });
  Object.assign(ACT, {
    cargado: { cd: 7000, cost: 35 }, salto: { cd: 9000, cost: 40 }, golpe_escudo: { cd: 6000, cost: 25 },
    tajo: { cd: 6000, cost: 30 }, marca: { cd: 12000, cost: 20 }, relampago: { cd: 7000, cost: 30 },
    anillo: { cd: 12000, cost: 40 }, meteoro: { cd: 14000, cost: 50 }, ventisca: { cd: 14000, cost: 40 }, prision: { cd: 16000, cost: 45 },
    tormenta: { cd: 15000, cost: 45 }, misiles: { cd: 4000, cost: 25 }, escudo_arcano: { cd: 18000, cost: 35 }, drenaje: { cd: 15000, cost: 40 }
  });

  // íconos de cada nodo (los dibujos de PixelLab en CK_ICONOS_HEROE; si faltan, ck_habilidades dibuja los de código)
  const IC = {
    punta: 'punta', triple: 'triple', perfora: 'perfora', lluvia: 'lluvia', explosiva: 'explosiva', cargado: 'cargado',
    filo: 'espada', torbellino: 'torbellino', embestida: 'dash', gracia: 'gracia', onda: 'onda', salto: 'salto',
    vigor: 'vigor', aliento: 'aliento', hierro: 'hierro', corazon: 'corazon', grito: 'cuerno', golpe_escudo: 'golpe_escudo',
    ritmo: 'sables', amplia: 'danza', rafaga: 'estocada', remolino: 'remolino', tajo: 'tajo',
    ojo: 'ojo', herida: 'herida', dagas: 'dagas', filo_dagas: 'dagas', marca: 'marca',
    pies: 'pies', esquiva: 'dash', contra: 'contra', paso: 'sombra', relampago: 'relampago',
    llama: 'llama', estallido: 'estallido', brasas: 'brasas', triple_fuego: 'tres_soles', anillo: 'anillo', meteoro: 'meteoro',
    helado: 'hielo', quema: 'frio_quema', lanza: 'lanza_hielo', coraza: 'coraza_hielo', ventisca: 'ventisca', prision: 'prision',
    carga: 'rayo', mente: 'mente', cadena: 'cadena', nova: 'nova', tormenta: 'tormenta',
    flujo: 'flujo', misiles: 'misiles', sabio: 'libro', escudo_arcano: 'escudo_arcano', drenaje: 'drenaje'
  };
  const ponerIconos = () => Object.keys(ARBOL).forEach(h => ARBOL[h].ramas.forEach(r => r.nodos.forEach(n => { if (IC[n.id]) n.ic = IC[n.id]; })));
  ponerIconos();

  // ================================================================== habilidades de base (siempre están)
  const enfriado = (S, ultimo, cd) => Math.max(0, Math.min(1, (cd - (S.time.now - (ultimo || -1e9))) / cd));
  const BASE = {
    b_lluvia: { h: 'soldier', n: 'Lluvia de flechas', ic: 'lluvia', d: 'De base: una lluvia de flechas sobre la zona de adelante. 45 de aguante, 3 s.',
      usar: S => S.performArrowRain(), cd: S => enfriado(S, S.lastRainTime, 3000) },
    b_torbellino: { h: 'soldier', n: 'Torbellino', ic: 'torbellino', d: 'De base: gira con la espada y corta todo alrededor. 35 de aguante.',
      usar: S => S.performSpin(), cd: S => enfriado(S, S.lastSpinTime, S.spinCooldown || 1200) },
    b_danza: { h: 'swordsman', n: 'Danza de filos', ic: 'danza', d: 'De base: una danza de espadas que corta alrededor. 35 de aguante.',
      usar: S => S.performBladeDance(), cd: S => enfriado(S, S.lastSpinTime, S.spinCooldown || 1200) },
    b_pirueta: { h: 'swordsman', n: 'Pirueta', ic: 'pirueta', d: 'De base: un salto girando hacia adelante que corta a los que pasa (1). 25 de aguante, 3 s.',
      cost: 25, cdMs: 3000 },
    b_trueno: { h: 'wizard', n: 'Trueno', ic: 'trueno', d: 'De base: mantené la tecla para cargar el trueno (hasta 3 s); más carga, más lejos y más daño. 45 de maná.',
      usar: (S, k) => { S._ckTeclaTrueno = k; S.performThunder(); }, cd: S => enfriado(S, S.lastThunderTime, 2500) },
    b_escarcha: { h: 'wizard', n: 'Ráfaga helada', ic: 'rafaga_helada', d: 'De base: un abanico de esquirlas de hielo adelante (1 cada una) que frena. 30 de maná, 3 s.',
      cost: 30, cdMs: 3000 }
  };
  const BASE_DE = { soldier: ['b_lluvia', 'b_torbellino'], swordsman: ['b_danza', 'b_pirueta'], wizard: ['b_trueno', 'b_escarcha'] };
  const esBase = id => !!BASE[id];

  // ================================================================== ayudas para las habilidades nuevas
  const vivas = S => S.enemies.getChildren().filter(e => e.active && !e.isDead);
  const cerca = (S, x, y, r) => vivas(S).filter(e => Phaser.Math.Distance.Between(x, y, e.x, e.y) <= r);
  const masCerca = (S, x, y, r) => { let m = null, d0 = r; vivas(S).forEach(e => { const d = Phaser.Math.Distance.Between(x, y, e.x, e.y); if (d < d0) { d0 = d; m = e; } }); return m; };
  const pegar = (S, e, dmg, x, y, fuente) => { const fa = S._ckFuente; S._ckFuente = fuente || fa; try { S.damageEnemy(e, dmg, x, y); } finally { S._ckFuente = fa; } };
  const luz = (x, y, c, r, ms) => { try { window.CK_LUZ && window.CK_LUZ.agregar({ x, y, c, r, f: 1, ms, curva: 'cae' }); } catch (e) {} };
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const anim = (S, k) => { const a = S.heroAnim ? S.heroAnim(k) : k; if (S.anims.exists(a)) S.player.play(a); else if (S.anims.exists(k)) S.player.play(k); };
  const dir = S => HB.dirV ? HB.dirV(S) : [S.facingDirection === 'left' ? -1 : 1, 0];
  const pie = S => { const b = S.player.body; return b ? { x: b.center.x, y: b.bottom } : { x: S.player.x, y: S.player.y + 12 }; };
  const anilloFx = (S, x, y, col, r0, r1, ms, grosor) => {
    const c = S.add.circle(x, y, r0).setStrokeStyle(grosor || 3, col, 1).setDepth(Math.round(y) + 20).setBlendMode(1);
    S.tweens.add({ targets: c, radius: r1, alpha: 0, duration: ms, onComplete: () => c.destroy() });
  };
  const rayoFx = (S, x, y) => {
    const g = S.add.graphics().setDepth(Math.round(y) + 40).setBlendMode(1);
    let px = x + R(-10, 10), py = y - 220;
    g.lineStyle(3, 0xfff6b0, 1).beginPath().moveTo(px, py);
    while (py < y) { py += R(18, 30); px = x + R(-12, 12); g.lineTo(px, Math.min(py, y)); }
    g.strokePath(); g.lineStyle(1, 0xffffff, 1).strokePath();
    S.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
    luz(x, y, [255, 245, 170], 140, 260);
  };
  const tex = (S, k, w, h, fn) => { if (S.textures.exists(k)) return; const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); S.textures.addCanvas(k, c); };
  const texturas = S => {
    HB.texturas && HB.texturas(S);
    tex(S, 'ck_flecha_oro', 20, 5, g => { g.fillStyle = '#7a4a10'; g.fillRect(0, 2, 14, 1); g.fillStyle = '#ffd25a'; g.fillRect(2, 1, 12, 3); g.fillStyle = '#fff6c0'; g.fillRect(14, 0, 4, 5); g.fillRect(18, 2, 2, 1); });
    tex(S, 'ck_misil', 10, 10, g => { g.fillStyle = '#5a1e8a'; g.fillRect(2, 2, 6, 6); g.fillStyle = '#c070ff'; g.fillRect(3, 3, 4, 4); g.fillStyle = '#ffffff'; g.fillRect(4, 4, 2, 2); });
    tex(S, 'ck_esquirla', 12, 5, g => { g.fillStyle = '#7fc8ff'; g.fillRect(0, 1, 9, 3); g.fillStyle = '#e8f8ff'; g.fillRect(2, 2, 8, 1); g.fillRect(9, 1, 3, 3); });
    tex(S, 'ck_roca', 16, 16, g => { g.fillStyle = '#2a1a10'; g.fillRect(3, 2, 10, 12); g.fillRect(2, 4, 12, 8); g.fillStyle = '#e8501c'; g.fillRect(4, 3, 8, 10); g.fillRect(3, 5, 10, 6); g.fillStyle = '#ffb04a'; g.fillRect(5, 5, 4, 4); g.fillStyle = '#fff0a0'; g.fillRect(6, 6, 2, 2); });
  };
  const proyectil = (S, key, vel, ck, opt) => (HB.disparo ? HB.disparo(S, key, vel, ck, opt) : null);

  // ================================================================== qué hace cada habilidad nueva (devuelve ms quieto, -1 = no salió)
  Object.assign(HACER, {
    cargado(S) {
      anim(S, 'soldier_attack3'); son('bow_shot', 0.9, { rate: 0.8 });
      S.time.delayedCall(260, () => { const o = proyectil(S, 'ck_flecha_oro', 520, { dmg: 3, atraviesa: true, fuente: 'flecha', snd: 'arrow_hit' }, { escala: 1.6, w: 20, h: 12 }); if (o) luz(o.x, o.y, [255, 220, 120], 70, 400); });
      return 420;
    },
    salto(S) {
      const p = S.player, [dx, dy] = dir(S);
      anim(S, 'soldier_attack2'); son('sword_swing2', 0.7, { rate: 0.8 });
      S.isInvulnerable = true;
      S.tweens.add({ targets: p, x: p.x + dx * 70, y: p.y + dy * 60, duration: 380, ease: 'Sine.easeOut' });
      S.tweens.add({ targets: p, scaleY: p.scaleY * 1.12, duration: 190, yoyo: true });
      S.time.delayedCall(390, () => {
        S.isInvulnerable = false;
        const f = pie(S); anilloFx(S, f.x, f.y, 0xe0c090, 8, 90, 360, 4); S.cameras.main.shake(160, 0.008); son('ck_explosion', 0.6) || son('sword_hit', 0.9, { rate: 0.6 });
        cerca(S, f.x, f.y, 84).forEach(e => { pegar(S, e, 2, f.x, f.y, 'embestida'); EP().aturdir && EP().aturdir(S, e, 1000); });
      });
      return 520;
    },
    golpe_escudo(S) {
      const p = S.player, [dx, dy] = dir(S), cx = p.x + dx * 30, cy = p.y + 6 + dy * 24;
      anim(S, 'soldier_attack1'); son('sword_hit', 0.8, { rate: 0.7 });
      S.time.delayedCall(140, () => {
        anilloFx(S, cx, cy, 0xbfdbfe, 6, 40, 240, 3);
        cerca(S, cx, cy, 46).forEach(e => { pegar(S, e, 1, p.x, p.y, 'embestida'); EP().aturdir && EP().aturdir(S, e, 2000); if (e.body) e.body.setVelocity(dx * 260, dy * 260); });
      });
      return 320;
    },
    tajo(S) {
      const p = S.player, [dx, dy] = dir(S), cx = p.x + dx * 30, cy = p.y + 4 + dy * 24;
      anim(S, 'swordsman_attack1');
      [0, 170].forEach((t, i) => S.time.delayedCall(t + 90, () => {
        son('sword_swing1', 0.7, { rate: 1.3 - i * 0.2 });
        const g = S.add.graphics().setDepth(Math.round(cy) + 30).setBlendMode(1);
        g.lineStyle(3, 0xff6a8a, 1); const s = i ? -1 : 1; g.lineBetween(cx - 18, cy - 16 * s, cx + 18, cy + 16 * s); g.lineStyle(1, 0xffffff, 1); g.lineBetween(cx - 16, cy - 14 * s, cx + 16, cy + 14 * s);
        S.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
        cerca(S, cx, cy, 40).forEach(e => { pegar(S, e, i ? 1 : 2, p.x, p.y); EP().sangrar && EP().sangrar(S, e, 1800); });
      }));
      return 420;
    },
    marca(S) {
      const p = S.player, e = masCerca(S, p.x, p.y, 220);
      if (!e) { window.CK_SIN_CARTELES_API && window.CK_SIN_CARTELES_API.nota('No hay ninguna bestia cerca para marcar'); return -1; }
      son('ck_nova', 0.5, { rate: 1.4 }) || son('sword_swing2', 0.5);
      e._ckMarca = S.time.now + 8000;
      tex(S, 'ck_marca_tx', 9, 9, g => { g.fillStyle = '#1b0f0a'; g.fillRect(2, 0, 5, 9); g.fillRect(0, 2, 9, 5); g.fillStyle = '#e0304a'; g.fillRect(3, 1, 3, 7); g.fillRect(1, 3, 7, 3); g.fillStyle = '#ffe0e6'; g.fillRect(4, 4, 1, 1); });
      const m = S.add.image(e.x, e.y - 34, 'ck_marca_tx').setDepth(30000).setScale(2);
      const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => { if (!e.active || e.isDead || !e._ckMarca || S.time.now > e._ckMarca) { m.destroy(); ev.remove(); e._ckMarca = 0; return; } m.setPosition(e.x, e.y - 36 + Math.sin(S.time.now / 160) * 2); } });
      return 120;
    },
    relampago(S) {
      const p = S.player, [dx, dy] = dir(S), x0 = p.x, y0 = p.y;
      son('ck_rayo', 0.6) || son('thunder_strike', 0.4, { rate: 1.6 });
      S.isInvulnerable = true;
      const dist = 130, x1 = x0 + dx * dist, y1 = y0 + dy * dist * 0.8;
      const g = S.add.graphics().setDepth(Math.round(y0) + 30).setBlendMode(1);
      g.lineStyle(4, 0x9fd8ff, 1).beginPath().moveTo(x0, y0);
      for (let i = 1; i <= 6; i++) g.lineTo(x0 + (x1 - x0) * i / 6 + R(-6, 6), y0 + (y1 - y0) * i / 6 + R(-8, 8));
      g.strokePath(); S.tweens.add({ targets: g, alpha: 0, duration: 380, onComplete: () => g.destroy() });
      S.tweens.add({ targets: p, x: x1, y: y1, duration: 140, onComplete: () => {
        S.isInvulnerable = false; if (S.unstickPlayer) S.unstickPlayer();
        rayoFx(S, p.x, p.y + 10); cerca(S, p.x, p.y, 60).forEach(e => pegar(S, e, 2, p.x, p.y, 'paso'));
      } });
      const ya = new Set();
      const ev = S.time.addEvent({ delay: 20, repeat: 7, callback: () => cerca(S, p.x, p.y, 34).forEach(e => { if (ya.has(e)) return; ya.add(e); pegar(S, e, 1, p.x, p.y); }) });
      luz(x1, y1, [160, 210, 255], 160, 380);
      return 200;
    },
    anillo(S) {
      const p = S.player; anim(S, 'wizard_attack1'); son('fire_cast', 0.8, { rate: 0.8 });
      const g = S.add.graphics().setBlendMode(1), t0 = S.time.now, DUR = 3000, RAD = 70, ult = new Map();
      const ev = S.time.addEvent({ delay: 40, loop: true, callback: () => {
        const t = S.time.now - t0; if (t > DUR || !p.active) { ev.remove(); g.destroy(); return; }
        const f = pie(S); g.clear().setDepth(Math.round(f.y) + 2);
        for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + t / 500, r = RAD + Math.sin(t / 90 + i) * 3; const fx = f.x + Math.cos(a) * r, fy = f.y - 6 + Math.sin(a) * r * 0.6;
          g.fillStyle(i % 2 ? 0xff7a1a : 0xffc14d, 0.85); g.fillRect(fx - 2, fy - 5 - (i % 3) * 2, 4, 6 + (i % 3) * 2); g.fillStyle(0xfff0a0, 0.9); g.fillRect(fx - 1, fy - 2, 2, 2); }
        cerca(S, f.x, f.y, RAD + 10).forEach(e => { if (S.time.now - (ult.get(e) || 0) < 500) return; ult.set(e, S.time.now); pegar(S, e, 1, f.x, f.y, 'fuego'); });
        if (Math.random() < 0.3) luz(f.x, f.y, [255, 150, 60], 160, 200);
      } });
      return 300;
    },
    meteoro(S) {
      const p = S.player, [dx, dy] = dir(S), tx = p.x + dx * 110, ty = p.y + 12 + dy * 90;
      anim(S, 'wizard_attack2'); son('fire_cast', 0.9, { rate: 0.6 }); texturas(S);
      const som = S.add.ellipse(tx, ty, 10, 5, 0x000000, 0.35).setDepth(Math.round(ty) - 1);
      S.tweens.add({ targets: som, scaleX: 7, scaleY: 7, duration: 650 });
      const r = S.add.image(tx - 160, ty - 300, 'ck_roca').setScale(3).setDepth(30000);
      S.tweens.add({ targets: r, x: tx, y: ty - 8, angle: 360, duration: 650, ease: 'Quad.easeIn', onComplete: () => {
        r.destroy(); som.destroy();
        HB.explosion ? HB.explosion(S, tx, ty, 72, 3, 0xff8a3d) : cerca(S, tx, ty, 72).forEach(e => pegar(S, e, 3, tx, ty, 'fuego'));
        cerca(S, tx, ty, 80).forEach(e => EP().quemar && EP().quemar(S, e, 2500));
        HB.brasas && HB.brasas(S, tx, ty + 6); S.cameras.main.shake(260, 0.012);
      } });
      return 450;
    },
    ventisca(S) {
      const p = S.player; anim(S, 'wizard_attack1'); son('ice_cast', 0.8, { rate: 0.6 });
      const g = S.add.graphics().setDepth(30000), t0 = S.time.now, DUR = 4000, RAD = 110, ult = new Map(), copos = [];
      for (let i = 0; i < 46; i++) copos.push({ a: R(0, 6.3), r: R(10, RAD), v: R(1.5, 3.5), s: R(1, 2.5) | 0 });
      const ev = S.time.addEvent({ delay: 40, loop: true, callback: () => {
        const t = S.time.now - t0; if (t > DUR || !p.active) { ev.remove(); g.destroy(); return; }
        g.clear(); const al = Math.min(1, t / 300, (DUR - t) / 400);
        g.fillStyle(0xd8f0ff, 0.12 * al); g.fillEllipse(p.x, p.y + 6, RAD * 2, RAD * 1.3);
        copos.forEach(c => { c.a += c.v * 0.02; const x = p.x + Math.cos(c.a) * c.r, y = p.y + 6 + Math.sin(c.a) * c.r * 0.65; g.fillStyle(0xffffff, 0.9 * al); g.fillRect(x, y, c.s + 1, c.s + 1); });
        cerca(S, p.x, p.y, RAD).forEach(e => { e._ckLento = S.time.now + 600; e._ckLentoK = 0.35; if (S.time.now - (ult.get(e) || 0) < 1000) return; ult.set(e, S.time.now); pegar(S, e, 1, p.x, p.y, 'hielo'); });
      } });
      return 300;
    },
    prision(S) {
      const p = S.player; anim(S, 'wizard_attack1'); son('ice_cast', 0.9, { rate: 0.5 });
      anilloFx(S, p.x, p.y + 6, 0xbfe9ff, 10, 130, 420, 4); luz(p.x, p.y, [170, 220, 255], 220, 500);
      S.time.delayedCall(200, () => cerca(S, p.x, p.y, 125).forEach(e => { pegar(S, e, 1, p.x, p.y); if (e.active && !e.isDead && EP().congelar) EP().congelar(S, e, 2500); }));
      return 380;
    },
    tormenta(S) {
      const p = S.player; anim(S, 'wizard_attack1'); son('thunder_hold', 0.5);
      for (let i = 0; i < 6; i++) S.time.delayedCall(250 + i * 480, () => {
        if (!p.active) return;
        const ls = cerca(S, p.x, p.y, 220); const e = ls.length ? ls[Math.floor(Math.random() * ls.length)] : null;
        const x = e ? e.x : p.x + R(-120, 120), y = e ? e.y + 10 : p.y + R(-80, 80);
        rayoFx(S, x, y); son('thunder_strike', 0.5, { minGap: 80 }) || son('ck_rayo', 0.5);
        cerca(S, x, y, 30).forEach(o => pegar(S, o, 2, x, y, 'trueno'));
      });
      return 300;
    },
    misiles(S) {
      const p = S.player; anim(S, 'wizard_attack1'); son('ck_nova', 0.5, { rate: 1.6 }) || son('ice_cast', 0.6, { rate: 1.5 }); texturas(S);
      const blancos = vivas(S).sort((a, b) => Phaser.Math.Distance.Between(p.x, p.y, a.x, a.y) - Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y)).slice(0, 3);
      [-0.6, 0, 0.6].forEach((ang, i) => S.time.delayedCall(i * 90, () => {
        const e0 = blancos[i % Math.max(1, blancos.length)];
        const o = S.add.image(p.x, p.y - 4, 'ck_misil').setScale(1.6).setDepth(30000).setBlendMode(1);
        let vx = Math.cos(ang - Math.PI / 2) * 160 * (S.facingDirection === 'left' ? -1 : 1), vy = Math.sin(ang - Math.PI / 2) * 160, vida = 0;
        const ev = S.time.addEvent({ delay: 16, loop: true, callback: () => {
          vida += 16; const e = e0 && e0.active && !e0.isDead ? e0 : masCerca(S, o.x, o.y, 260);
          if (e) { const a = Math.atan2(e.y - o.y, e.x - o.x); vx += Math.cos(a) * 26; vy += Math.sin(a) * 26; const sp = Math.hypot(vx, vy), mx = 320; if (sp > mx) { vx *= mx / sp; vy *= mx / sp; } }
          o.x += vx * 0.016; o.y += vy * 0.016;
          if (vida % 48 < 16) { const t = S.add.circle(o.x, o.y, 3, 0xc070ff, 0.6).setDepth(29999).setBlendMode(1); S.tweens.add({ targets: t, alpha: 0, scale: 0.2, duration: 220, onComplete: () => t.destroy() }); }
          const h = e && Phaser.Math.Distance.Between(o.x, o.y, e.x, e.y) < 16;
          if (h || vida > 2200) { ev.remove(); if (h) { pegar(S, e, 1, o.x, o.y, 'nova'); anilloFx(S, o.x, o.y, 0xd8a0ff, 3, 18, 200, 2); } o.destroy(); }
        } });
      }));
      return 260;
    },
    escudo_arcano(S) {
      const p = S.player; son('ck_nova', 0.6, { rate: 0.8 }) || son('ice_cast', 0.6);
      S._ckEscudo = { golpes: 2, hasta: S.time.now + 8000 };
      if (S._ckEscudoG) S._ckEscudoG.destroy();
      const g = S._ckEscudoG = S.add.graphics().setBlendMode(1);
      const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => {
        const E = S._ckEscudo;
        if (!E || E.golpes <= 0 || S.time.now > E.hasta || !p.active) { ev.remove(); g.destroy(); if (S._ckEscudoG === g) S._ckEscudoG = null; if (E && S.time.now > E.hasta) S._ckEscudo = null; return; }
        g.clear().setDepth(p.depth + 1); const r = 22 + Math.sin(S.time.now / 140) * 1.5;
        g.lineStyle(2, 0xd8a0ff, 0.55 + 0.2 * E.golpes); g.strokeEllipse(p.x, p.y - 2, r * 2, r * 2.2); g.fillStyle(0xb070ff, 0.12); g.fillEllipse(p.x, p.y - 2, r * 2, r * 2.2);
      } });
      return 150;
    },
    drenaje(S) {
      const p = S.player, e = masCerca(S, p.x, p.y, 200);
      if (!e) { window.CK_SIN_CARTELES_API && window.CK_SIN_CARTELES_API.nota('No hay ninguna bestia cerca'); return -1; }
      anim(S, 'wizard_attack1'); son('ck_nova', 0.6, { rate: 0.6 }) || son('ice_cast', 0.6, { rate: 0.5 });
      const g = S.add.graphics().setDepth(30000).setBlendMode(1), t0 = S.time.now;
      const ev = S.time.addEvent({ delay: 30, loop: true, callback: () => {
        const t = S.time.now - t0; if (t > 600 || !e.active) { ev.remove(); g.destroy(); return; }
        g.clear(); for (let i = 0; i < 3; i++) { g.lineStyle(2 - i * 0.5, i ? 0x7dff9a : 0xff4a6a, 0.8); g.beginPath(); g.moveTo(e.x, e.y - 6); for (let k = 1; k <= 8; k++) g.lineTo(e.x + (p.x - e.x) * k / 8 + Math.sin(t / 50 + k + i) * 5, e.y - 6 + (p.y - 6 - e.y + 6) * k / 8 + Math.cos(t / 60 + k) * 4); g.strokePath(); }
      } });
      S.time.delayedCall(450, () => {
        pegar(S, e, 2, p.x, p.y);
        if (S.health < S.maxHealth) { S.health = Math.min(S.maxHealth, S.health + 1); S.updateHUD && S.updateHUD(); S.createFloatingText(p.x, p.y - 40, '+1 VIDA', 0x22c55e); }
        luz(p.x, p.y, [120, 255, 150], 120, 300);
      });
      return 500;
    }
  });

  // escudo arcano: aguanta golpes enteros; marca de muerte: el próximo golpe hace el triple
  const dp0 = P.damagePlayer;
  P.damagePlayer = function (amount) {
    const E = this._ckEscudo;
    if (E && E.golpes > 0 && this.time.now < E.hasta && !this.isInvulnerable && !this.isDead) {
      E.golpes--; this.createFloatingText(this.player.x, this.player.y - 44, '¡ESCUDO!', 0xd8a0ff); son('sword_hit', 0.6, { rate: 1.6 });
      this.isInvulnerable = true; this.time.delayedCall(400, () => { this.isInvulnerable = false; }); return;
    }
    return dp0.apply(this, arguments);
  };
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount) {
    if (enemy && enemy._ckMarca && this.time.now < enemy._ckMarca && amount > 0) {
      enemy._ckMarca = 0; arguments[1] = amount * 3;
      this.createFloatingText(enemy.x, enemy.y - 46, '¡MARCA!', 0xff4a6a); this.cameras.main.shake(120, 0.006);
    }
    return de0.apply(this, arguments);
  };
  // sabiduría: más maná
  const sm0 = P.ckStaminaMax;
  if (sm0) P.ckStaminaMax = function () { return sm0.apply(this, arguments) + HB.rg(this, 'sabio') * 15; };

  // bases que no venían en el juego: pirueta (Aby) y ráfaga helada (Horos)
  const hacerBase = {
    b_pirueta(S) {
      const p = S.player, [dx, dy] = dir(S);
      anim(S, 'swordsman_attack2'); son('sword_swing1', 0.7, { rate: 1.2 });
      S.isInvulnerable = true;
      const ya = new Set();
      S.tweens.add({ targets: p, x: p.x + dx * 80, y: p.y + dy * 64, duration: 300, ease: 'Sine.easeOut', onUpdate: () => cerca(S, p.x, p.y, 40).forEach(e => { if (ya.has(e)) return; ya.add(e); pegar(S, e, 1, p.x, p.y); }),
        onComplete: () => { S.isInvulnerable = false; S.unstickPlayer && S.unstickPlayer(); } });
      anilloFx(S, p.x, p.y, 0xff9ab8, 6, 34, 300, 2);
      return 330;
    },
    b_escarcha(S) {
      const p = S.player, d = dir(S); anim(S, 'wizard_attack1'); son('ice_cast', 0.7, { rate: 1.2 }); texturas(S);
      [-0.35, -0.12, 0.12, 0.35].forEach(a => { const v = HB.rotarDir ? HB.rotarDir(d, a) : d; proyectil(S, 'ck_esquirla', 340, { dmg: 1, frena: true, fuente: 'hielo', snd: 'ice_hit' }, { dir: v, escala: 1.4, w: 12, h: 10, vida: 600 }); });
      return 280;
    }
  };

  // ================================================================== ranuras
  const H = S => HB.hab(S);
  const aprendidas = (S, h) => {
    const out = (BASE_DE[h] || []).slice();
    const A = ARBOL[h]; if (!A) return out;
    A.ramas.forEach(r => r.nodos.forEach(n => { if (n.tipo === 'a' && HB.rg(S, n.id, h)) out.push(n.id); }));
    return out;
  };
  const ranuras = (S, h) => {
    h = h || S.playerHero;
    const X = H(S); if (!X) return [null, null, null, null];
    X.ranuras = X.ranuras || {};
    let r = X.ranuras[h];
    if (!r) {
      r = [null, null, null, null];
      (BASE_DE[h] || []).forEach((id, i) => (r[i] = id));
      if (X.activa && X.activa[h]) r[2] = X.activa[h];          // la que estaba en R sigue en R
      X.ranuras[h] = r;
    }
    // lo que se desaprendió (práctica, devolver puntos) se saca; lo nuevo aprendido entra solo en el primer hueco
    const ok = aprendidas(S, h);
    for (let i = 0; i < 4; i++) if (r[i] && !ok.includes(r[i])) r[i] = null;
    X._vistas = X._vistas || {}; const vistas = X._vistas[h] = X._vistas[h] || {};
    ok.forEach(id => { if (vistas[id]) return; vistas[id] = 1; if (!r.includes(id)) { const i = r.indexOf(null); if (i >= 0) r[i] = id; } });
    return r;
  };
  const poner = (S, i, id) => {
    const r = ranuras(S); const j = r.indexOf(id);
    if (j >= 0) r[j] = r[i];
    r[i] = id; HB.guardar && HB.guardar(S);
  };
  const def = (h, id) => {
    if (BASE[id]) return { n: BASE[id].n, ic: BASE[id].ic, d: BASE[id].d, base: true };
    const x = HB.nodo(h, id); return x ? { n: x.n.n, ic: x.n.ic, d: x.n.d(1), color: x.rama.color } : null;
  };
  const icono = (h, id) => { const d = def(h, id); if (!d) return ''; return (window.CK_ICONOS_HEROE && window.CK_ICONOS_HEROE[d.ic]) || HB.icono(d.ic, d.color || '#7d6650'); };
  // cuánto le falta para estar lista (0 = lista, 1 = recién usada)
  const espera = (S, id) => {
    if (!id) return 0;
    if (BASE[id]) { if (BASE[id].cd) return BASE[id].cd(S); return enfriado(S, (S._ckCdBase || {})[id], BASE[id].cdMs || 3000); }
    const A = ACT[id], fin = S._ckCd && S._ckCd[id]; if (!A || !fin) return 0;
    return Math.max(0, Math.min(1, (fin - S.time.now) / (A.cd * (S._ckCdK && S._ckCdK[id] || 1))));
  };
  const costo = id => (BASE[id] ? BASE[id].cost || 0 : (ACT[id] && ACT[id].cost) || 0);

  const usarRanura = (S, i, key) => {
    if (!HB.activo(S) || !S.gameStarted || S.isDead || S._overlay || S.isGamePaused || S.dialogOpen) return;
    const id = ranuras(S)[i];
    if (!id) { window.CK_SIN_CARTELES_API && window.CK_SIN_CARTELES_API.nota(TECLAS[i] + ': ranura vacía. Equipá una habilidad en el árbol (H)'); return; }
    const B = BASE[id];
    if (B && B.usar) { B.usar(S, key); return; }
    if (B) {   // bases nuevas: costo y espera propios
      if (S.combatLocked() || S.isAttacking || S.isDashing || S.isSpinning) return;
      S._ckCdBase = S._ckCdBase || {};
      if (espera(S, id) > 0) return;
      if (S.stamina < B.cost) { S.showLowStaminaWarning && S.showLowStaminaWarning(B.n); return; }
      const ms = hacerBase[id](S); if (ms < 0) return;
      S.stamina = Math.max(0, S.stamina - B.cost); S.updateStaminaBar && S.updateStaminaBar();
      S._ckCdBase[id] = S.time.now;
      if (ms > 0) { S.isAttacking = true; S.player.setVelocity(0, 0); S.time.delayedCall(ms, () => { S.isAttacking = false; if (!S.isDead && S.player.active) anim(S, S.playerHero + '_idle'); }); }
      return;
    }
    texturas(S);
    const antes = S._ckCd && S._ckCd[id];
    S.ckUsarHabilidad(id, TECLAS[i]);
    // flujo arcano: la espera se acorta
    const k = 1 - 0.08 * HB.rg(S, 'flujo');
    if (k < 1 && S._ckCd && S._ckCd[id] && S._ckCd[id] !== antes) { const A = ACT[id]; S._ckCd[id] = S.time.now + A.cd * k; S._ckCdK = S._ckCdK || {}; S._ckCdK[id] = k; }
  };

  // ------------------------------------------------------------------ teclas: Q y E dejan de ir directo a lo de siempre
  const NADA = { isDown: false, _justDown: false, _justUp: false, on() { return this; }, off() { return this; }, removeAllListeners() {} };
  const teclas = S => {
    if (!S.input || !S.input.keyboard) return;
    const KB = typeof KeybindsManager !== 'undefined' ? KeybindsManager : null, K = Phaser.Input.Keyboard.KeyCodes, kc = n => (typeof resolvePhaserKeyCode === 'function' ? resolvePhaserKeyCode(n) : K[n]);
    const cod = [kc(KB ? KB.get('ultimate') : 'Q'), kc(KB ? KB.get('spin') : 'E'), K.R, K.F];
    S.keySpin = NADA; S.keyUltimate = NADA;          // el update de la escena ya no dispara el giro ni el trueno solos
    if (S.keyF && S.keyF !== S._ckF11) { S.keyF.removeAllListeners(); }
    if (!S._ckF11) { S._ckF11 = S.input.keyboard.addKey(K.F11); S._ckF11.on('down', ev => { try { ev && ev.originalEvent && ev.originalEvent.preventDefault(); } catch (e) {} S.toggleFullscreen && S.toggleFullscreen(); }); }
    S._ckRanTeclas = S._ckRanTeclas || [];
    S._ckRanTeclas.forEach(k => k.removeAllListeners && k.removeAllListeners('down'));
    S._ckRanTeclas = cod.map((c, i) => { const k = S.input.keyboard.addKey(c); k.on('down', () => { try { sfx.init && sfx.init(); } catch (e) {} if (S.devModeEnabled) return; usarRanura(S, i, k); }); return k; });
  };
  const rb0 = P.rebindControls;
  P.rebindControls = function () { const r = rb0.apply(this, arguments); try { teclas(this); } catch (e) { console.warn('[ranuras]', e); } return r; };
  // R ahora es la ranura 3 (ck_habilidades la sigue registrando: no hace nada)
  P.ckHabilidadR = function () {};
  // el trueno se carga mientras se mantiene la tecla de su ranura
  const tc0 = P.updateThunderCharge;
  P.updateThunderCharge = function () {
    const c = this.thunderCharge;
    if (c && this._ckTeclaTrueno) { const held = this.time.now - c.start; this._thunderTestHold = this._ckTeclaTrueno.isDown ? held + 1000 : 0; }
    const r = tc0.apply(this, arguments);
    if (!this.thunderCharge && this._ckTeclaTrueno) { this._ckTeclaTrueno = null; this._thunderTestHold = 0; }
    return r;
  };

  // ------------------------------------------------------------------ la fila "Equipadas" en la ventana del árbol
  const css = () => {
    if (document.getElementById('ck-equipo-css')) return;
    const AR = window.CK_HUD_HEROE_ARTE || {}, u = n => (AR[n] ? 'url("' + AR[n] + '")' : 'none');
    const s = document.createElement('style'); s.id = 'ck-equipo-css';
    s.textContent = `
#ck-habilidades .ck-win{width:min(1060px,97vw)!important}
#ck-habilidades .hb-cols[style*="--ramas:4"] .hb-n{font-size:14px}
#ck-habilidades .hb-nodo{padding:2px 6px!important}
#ck-habilidades .hb-ic{flex:0 0 50px!important;width:50px!important;height:48px!important}
#ck-habilidades .hb-ic img{left:9px!important;top:8px!important;width:32px!important;height:32px!important}
#ck-habilidades .hb-equipo{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin:8px 0 2px;flex-wrap:wrap}
#ck-habilidades .hb-equipo .t{font-family:var(--ck2-f,Grenze,serif);font-weight:700;font-size:16px;color:#2b1a10;margin-right:4px}
#ck-habilidades .hb-ran{position:relative;width:76px;height:76px;cursor:pointer;background:${u('ranura_soldier')} 0 0/100% 100%;image-rendering:pixelated}
#ck-habilidades .hb-ran img{position:absolute;left:6px;top:6px;width:64px;height:64px;image-rendering:pixelated}
#ck-habilidades .hb-ran b{position:absolute;left:50%;bottom:-12px;transform:translateX(-50%);width:32px;height:22px;line-height:22px;text-align:center;background:${u('tecla_soldier')} 0 0/100% 100%;image-rendering:pixelated;font:700 14px var(--ck2-f,serif);color:#f3ead9}
#ck-habilidades .hb-ran.vacia img{display:none}
#ck-habilidades .hb-ran:hover{filter:brightness(1.15)}
#ck-habilidades .hb-ran.lista{outline:3px solid #e9b04a;outline-offset:1px;animation:ckEqLate .7s ease-in-out infinite alternate}
@keyframes ckEqLate{to{outline-color:#fff0b0}}
#ck-habilidades .hb-bases{display:flex;gap:8px;align-items:center;margin-left:14px}
#ck-habilidades .hb-base{position:relative;width:52px;height:52px;cursor:pointer;background:${u('ranura_soldier')} 0 0/100% 100%;image-rendering:pixelated}
#ck-habilidades .hb-base img{position:absolute;left:4px;top:4px;width:44px;height:44px;image-rendering:pixelated}
#ck-habilidades .hb-base.sel{outline:3px solid #c9862b}
#ck-habilidades .hb-equipo small{font-family:var(--ck2-f,serif);font-size:13px;color:#5a3a24;width:100%;text-align:center}`;
    document.head.append(s);
  };
  let elegidaBase = null;
  const heroeArte = h => (h === 'swordsman' || h === 'wizard' || h === 'bear' ? h : 'soldier');
  const pintarEquipo = S => {
    const win = document.getElementById('ck-habilidades'); if (!win || !win.classList.contains('on')) return;
    css();
    let fila = win.querySelector('.hb-equipo');
    if (!fila) { fila = document.createElement('div'); fila.className = 'hb-equipo'; const d = win.querySelector('.hb-desc'); d.parentNode.insertBefore(fila, d.nextSibling); }
    const h = S.playerHero, r = ranuras(S), AR = window.CK_HUD_HEROE_ARTE || {}, ha = heroeArte(h);
    const bg = AR['ranura_' + ha] ? `background-image:url('${AR['ranura_' + ha]}')` : '';
    const tk = AR['tecla_' + ha] ? `background-image:url('${AR['tecla_' + ha]}')` : '';
    const sel = seleccion(S);
    fila.innerHTML = '<span class="t">Equipadas:</span>' + r.map((id, i) =>
      `<div class="hb-ran${id ? '' : ' vacia'}${sel ? ' lista' : ''}" data-i="${i}" style="${bg}" title="${id ? def(h, id).n : 'Vacía'}"><img src="${id ? icono(h, id) : ''}" alt=""><b style="${tk}">${TECLAS[i]}</b></div>`).join('') +
      '<div class="hb-bases"><span class="t">De base:</span>' + (BASE_DE[h] || []).map(id =>
        `<div class="hb-base${elegidaBase === id ? ' sel' : ''}" data-id="${id}" style="${bg}" title="${def(h, id).n}"><img src="${icono(h, id)}" alt=""></div>`).join('') + '</div>' +
      `<small>${sel ? `Apretá Q, E, R o F (o tocá una ranura) para poner <b>${def(h, sel).n}</b> ahí` : 'Elegí una habilidad NUEVA que ya aprendiste (o una de base) y apretá Q, E, R o F para equiparla'}</small>`;
    fila.querySelectorAll('.hb-ran').forEach(el => el.onclick = () => { const id = seleccion(S); if (!id) return; poner(S, +el.dataset.i, id); elegidaBase = null; refrescar(S); });
    fila.querySelectorAll('.hb-base').forEach(el => el.onclick = () => { elegidaBase = elegidaBase === el.dataset.id ? null : el.dataset.id; refrescar(S); });
    // en cada nodo NUEVO: qué tecla tiene
    win.querySelectorAll('.hb-nodo').forEach(el => {
      const rm = ARBOL[h].ramas[+el.dataset.r], n = rm && rm.nodos[+el.dataset.i];
      const icd = el.querySelector('.hb-ic'); if (!n || !icd) return;
      icd.querySelectorAll('.hb-r').forEach(x => x.remove());
      const j = r.indexOf(n.id);
      if (j >= 0) { const t = document.createElement('span'); t.className = 'hb-r'; t.textContent = TECLAS[j]; icd.appendChild(t); }
    });
    // el botón viejo "Equipar en R" (si lo hay) ya no hace falta
    const eq = win.querySelector('.hb-equipar'); if (eq) eq.style.display = 'none';
    const ay = win.querySelector('.hb-ayuda'); if (ay) ay.textContent = ay.textContent.replace(/Las habilidades NUEVAS se usan con R/, 'H o Esc: cerrar · Las habilidades NUEVAS se equipan en Q, E, R o F');
  };
  // qué habilidad está elegida para equipar: una de base marcada, o el nodo NUEVO aprendido que está seleccionado
  const seleccion = S => {
    if (elegidaBase && (BASE_DE[S.playerHero] || []).includes(elegidaBase)) return elegidaBase;
    const win = document.getElementById('ck-habilidades'); const el = win && win.querySelector('.hb-nodo.sel');
    if (!el) return null;
    const rm = ARBOL[S.playerHero].ramas[+el.dataset.r], n = rm && rm.nodos[+el.dataset.i];
    return n && n.tipo === 'a' && HB.rg(S, n.id) ? n.id : null;
  };
  const refrescar = S => { try { HB.pintar(S); } catch (e) {} pintarEquipo(S); };
  const tg0 = P.toggleHabilidades;
  P.toggleHabilidades = function () {
    const r = tg0.apply(this, arguments);
    elegidaBase = null;
    try {
      const win = document.getElementById('ck-habilidades');
      if (win && !win._ckEq) {
        win._ckEq = true;
        new MutationObserver(() => { if (win._ckPintando) return; win._ckPintando = true; try { pintarEquipo(this); } finally { win._ckPintando = false; } })
          .observe(win.querySelector('.hb-cols'), { childList: true });
        window.addEventListener('keydown', ev => {
          if (!win.classList.contains('on')) return;
          const i = TECLAS.indexOf((ev.key || '').toUpperCase());
          if (i < 0) return;
          const S = window.activeGameScene || this, id = seleccion(S);
          ev.preventDefault(); ev.stopImmediatePropagation();
          if (!id) return;
          poner(S, i, id); elegidaBase = null; refrescar(S);
        }, true);
      }
      pintarEquipo(this);
    } catch (e) { console.warn('[equipo]', e); }
    return r;
  };

  // al empezar la campaña o la práctica: teclas y ranuras al día
  ['initExtras', 'startPractice'].forEach(fn => {
    const f0 = P[fn]; if (!f0) return;
    P[fn] = function () { const r = f0.apply(this, arguments); try { ponerIconos(); teclas(this); ranuras(this); } catch (e) { console.warn('[ranuras]', e); } return r; };
  });

  window.CK_EQUIPO = { TECLAS, BASE, BASE_DE, ranuras, poner, def, icono, espera, costo, usarRanura, aprendidas, hacerBase, ponerIconos, cerca, pegar, anilloFx, rayoFx, luz, son, anim, dir, pie, texturas, tex };
})();
