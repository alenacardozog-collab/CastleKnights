'use strict';
/* Árbol de habilidades (24/10, pedido del dueño).
   Cada héroe tiene 3 ramas según su rol. Se gana 1 punto por nivel (y uno de arranque). Los nodos suben de rango
   (●○○) y algunos desbloquean habilidades nuevas: proyectiles, golpes y sistemas de combate. Las habilidades nuevas se
   usan con R (la que esté marcada con R en el árbol; la última que se desbloquea queda puesta sola).
   - H abre el árbol (y desde la pausa: "Habilidades"). Flechas para moverse, Enter para subir el nodo, H o Esc cierra.
   - Para subir un nodo hacen falta puntos gastados en esa rama (el número del candado).
   - Cada héroe tiene sus puntos y su árbol; el nivel es el de la partida. Se guarda en story.hab.
   - Restablecer: en la ventana, "Devolver puntos" cuesta monedas (25 × nivel) y devuelve todo para repartir de nuevo.
   Datos: ARBOL (abajo). Efectos: los envoltorios de daño, golpes, proyectiles y aguante, más las habilidades de R.
   - MODO PRÁCTICA (v2, 24/10): el árbol también se abre en la práctica, sin puntos ni requisitos: se sube o se quita
     cualquier nodo, "Rama completa" llena la rama elegida y "Vaciar todo" la deja en cero. Lo elegido se guarda aparte
     (localStorage castleknight_practica_hab, por héroe) y no toca ninguna partida.
   Borrar la línea de index.html lo saca (la partida guarda lo repartido por si se vuelve a poner). */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const R = (a, b) => a + Math.random() * (b - a);

  // ================================================================== datos
  // tipo: 'p' pasiva con rangos, 'a' habilidad nueva (tecla R). req = puntos gastados en la rama antes de poder tomarlo.
  // ic = dibujo del ícono, d(r) = descripción en el rango r (1..max)
  const ARBOL = {
    soldier: {
      nombre: 'Lancent', ramas: [
        { id: 'arco', nombre: 'Arquero', color: '#3f7d3a', nodos: [
          { id: 'punta', n: 'Punta de acero', ic: 'flecha', max: 3, req: 0, d: r => `Cada flecha tiene ${r * 30}% de chance de hacer +1 de daño.` },
          { id: 'triple', n: 'Flecha triple', ic: 'triple', max: 1, req: 1, d: () => 'El disparo con arco suelta tres flechas en abanico.' },
          { id: 'perfora', n: 'Flecha perforante', ic: 'perfora', max: 2, req: 2, d: r => `Las flechas atraviesan ${r} enemigo${r > 1 ? 's' : ''} antes de clavarse.` },
          { id: 'lluvia', n: 'Lluvia cerrada', ic: 'lluvia', max: 2, req: 3, d: r => `La lluvia de flechas cae con ${r * 5} flechas más y cubre más lugar.` },
          { id: 'explosiva', n: 'Flecha explosiva', ic: 'explosion', max: 1, req: 4, tipo: 'a', d: () => 'Nueva (R): una flecha que estalla al pegar y lastima a todos alrededor (2 de daño). 40 de aguante, 8 s.' }
        ] },
        { id: 'espada', nombre: 'Espadachín', color: '#8a2b22', nodos: [
          { id: 'filo', n: 'Filo templado', ic: 'espada', max: 3, req: 0, d: r => `Los espadazos tienen ${r * 10}% de chance de crítico (doble daño).` },
          { id: 'torbellino', n: 'Torbellino veloz', ic: 'giro', max: 2, req: 1, d: r => `El giro cuesta ${r * 8} menos de aguante y se recarga ${r * 25}% más rápido.` },
          { id: 'embestida', n: 'Embestida', ic: 'bota', max: 1, req: 2, d: () => 'El dash lastima (1) a cada enemigo que atraviesa.' },
          { id: 'gracia', n: 'Golpe de gracia', ic: 'corazon', max: 1, req: 3, d: () => 'Rematar con la espada devuelve 12 de aguante.' },
          { id: 'onda', n: 'Onda de acero', ic: 'onda', max: 1, req: 4, tipo: 'a', d: () => 'Nueva (R): un tajo que lanza una onda cortante; atraviesa a todos (2 de daño). 35 de aguante, 6 s.' }
        ] },
        { id: 'guardia', nombre: 'Guardián', color: '#4b5d7a', nodos: [
          { id: 'vigor', n: 'Vigor', ic: 'brazo', max: 3, req: 0, d: r => `+${r * 15} de aguante máximo.` },
          { id: 'aliento', n: 'Segundo aliento', ic: 'viento', max: 2, req: 1, d: r => `El aguante se recupera ${r * 25}% más rápido.` },
          { id: 'hierro', n: 'Piel de hierro', ic: 'escudo', max: 2, req: 2, d: r => `${r * 12}% de chance de aguantar un golpe sin daño.` },
          { id: 'corazon', n: 'Corazón valiente', ic: 'corazon', max: 1, req: 3, d: () => '+1 corazón máximo.' },
          { id: 'grito', n: 'Grito de guerra', ic: 'cuerno', max: 1, req: 4, tipo: 'a', d: () => 'Nueva (R): empuja a los enemigos cercanos y por 8 s cada golpe hace +1. 30 de aguante, 20 s.' }
        ] }
      ]
    },
    swordsman: {
      nombre: 'Aby', ramas: [
        { id: 'danza', nombre: 'Danza', color: '#9b2f5a', nodos: [
          { id: 'ritmo', n: 'Ritmo', ic: 'espadas', max: 3, req: 0, d: r => `El tercer golpe seguido hace +${r === 3 ? 2 : 1} de daño${r > 1 ? ' y la cadena dura más' : ''}.` },
          { id: 'amplia', n: 'Danza amplia', ic: 'giro', max: 2, req: 1, d: r => `La danza de filos llega ${r * 20}% más lejos y cuesta ${r * 6} menos de aguante.` },
          { id: 'rafaga', n: 'Ráfaga', ic: 'estocada', max: 1, req: 2, d: () => 'Las estocadas pegan cuatro veces y la última hace +1.' },
          { id: 'remolino', n: 'Remolino de acero', ic: 'remolino', max: 1, req: 3, tipo: 'a', d: () => 'Nueva (R): gira 1,5 s cortando todo alrededor (1 de daño cada 0,3 s). 40 de aguante, 9 s.' }
        ] },
        { id: 'filo', nombre: 'Filo', color: '#a07018', nodos: [
          { id: 'ojo', n: 'Ojo de halcón', ic: 'ojo', max: 3, req: 0, d: r => `Todos sus golpes tienen ${r * 8}% de chance de crítico (doble daño).` },
          { id: 'herida', n: 'Herida abierta', ic: 'gota', max: 2, req: 1, d: r => `Los críticos sangran: ${r} de daño más un momento después.` },
          { id: 'dagas', n: 'Dagas arrojadizas', ic: 'daga', max: 1, req: 2, tipo: 'a', d: () => 'Nueva (R): tira tres dagas en abanico (1 de daño cada una). 25 de aguante, 4 s.' },
          { id: 'filo_dagas', n: 'Dagas afiladas', ic: 'daga', max: 2, req: 3, d: r => `Las dagas hacen +1 de daño${r > 1 ? ' y salen cinco' : ''}.` }
        ] },
        { id: 'sombra', nombre: 'Sombra', color: '#3d3a5c', nodos: [
          { id: 'pies', n: 'Pies ligeros', ic: 'bota', max: 3, req: 0, d: r => `Camina y corre ${r * 6}% más rápido.` },
          { id: 'esquiva', n: 'Esquiva', ic: 'viento', max: 2, req: 1, d: r => `El dash se recarga ${r * 20}% antes y cuesta ${r * 8} menos de aguante.` },
          { id: 'contra', n: 'Contragolpe', ic: 'escudo', max: 1, req: 2, d: () => 'Una parada (C) a tiempo le devuelve 2 de daño al que pegó.' },
          { id: 'paso', n: 'Paso de sombra', ic: 'sombra', max: 1, req: 3, tipo: 'a', d: () => 'Nueva (R): aparece detrás de la bestia más cercana y la apuñala (2 de daño). 30 de aguante, 7 s.' }
        ] }
      ]
    },
    wizard: {
      nombre: 'Horos', ramas: [
        { id: 'fuego', nombre: 'Fuego', color: '#b4441a', nodos: [
          { id: 'llama', n: 'Llama viva', ic: 'llama', max: 3, req: 0, d: r => `Cada bola de fuego tiene ${r * 30}% de chance de hacer +1 de daño.` },
          { id: 'estallido', n: 'Estallido', ic: 'explosion', max: 2, req: 1, d: r => `La explosión llega ${r * 20} px más lejos.` },
          { id: 'brasas', n: 'Suelo en brasas', ic: 'llama', max: 1, req: 2, d: () => 'La explosión deja brasas 2,5 s que queman (1 por segundo).' },
          { id: 'triple_fuego', n: 'Tres soles', ic: 'triple', max: 1, req: 3, tipo: 'a', d: () => 'Nueva (R): tres bolas de fuego en abanico. 45 de aguante, 8 s.' }
        ] },
        { id: 'hielo', nombre: 'Escarcha', color: '#2f6f98', nodos: [
          { id: 'helado', n: 'Toque helado', ic: 'copo', max: 3, req: 0, d: r => `El hechizo de hielo frena a las bestias ${[0, 25, 40, 55][r]}% por 2 s.` },
          { id: 'quema', n: 'Frío que quema', ic: 'gota', max: 2, req: 1, d: r => `Contra bestias frenadas, el hielo tiene ${r * 50}% de chance de +1.` },
          { id: 'lanza', n: 'Lanza de hielo', ic: 'lanza', max: 1, req: 2, tipo: 'a', d: () => 'Nueva (R): una lanza que atraviesa todo, hace 2 y frena. 35 de aguante, 6 s.' },
          { id: 'coraza', n: 'Coraza de escarcha', ic: 'escudo', max: 1, req: 3, d: () => 'Cada 25 s una capa de hielo aguanta un golpe entero.' }
        ] },
        { id: 'tormenta', nombre: 'Tormenta', color: '#6b5aa8', nodos: [
          { id: 'carga', n: 'Carga rápida', ic: 'rayo', max: 3, req: 0, d: r => `El trueno se carga ${r * 15}% más rápido.` },
          { id: 'mente', n: 'Mente clara', ic: 'viento', max: 2, req: 1, d: r => `El aguante se recupera ${r * 25}% más rápido.` },
          { id: 'cadena', n: 'Rayo en cadena', ic: 'cadena', max: 1, req: 2, d: () => 'El trueno salta a dos bestias cercanas (1 de daño).' },
          { id: 'nova', n: 'Nova arcana', ic: 'nova', max: 1, req: 3, tipo: 'a', d: () => 'Nueva (R): una onda alrededor que empuja lejos y hace 1. 30 de aguante, 10 s.' }
        ] }
      ]
    }
  };
  const ACTIVAS = { explosiva: { cd: 8000, cost: 40 }, onda: { cd: 6000, cost: 35 }, grito: { cd: 20000, cost: 30 }, remolino: { cd: 9000, cost: 40 },
    dagas: { cd: 4000, cost: 25 }, paso: { cd: 7000, cost: 30 }, triple_fuego: { cd: 8000, cost: 45 }, lanza: { cd: 6000, cost: 35 }, nova: { cd: 10000, cost: 30 } };
  const nodo = (h, id) => { const A = ARBOL[h]; if (!A) return null; for (const r of A.ramas) for (const n of r.nodos) if (n.id === id) return { n, rama: r }; return null; };

  // ================================================================== estado
  // práctica: un árbol aparte, libre, que se guarda en el navegador
  const KP = 'castleknight_practica_hab';
  let PRAC = null;
  const practica = S => S._gameMode === 'practice';
  const activo = S => S._gameMode === 'campaign' || S._gameMode === 'practice';
  const habPractica = () => {
    if (!PRAC) { try { PRAC = JSON.parse(localStorage.getItem(KP) || 'null'); } catch (e) {} PRAC = PRAC && typeof PRAC === 'object' ? PRAC : {}; }
    PRAC.activa = PRAC.activa || {};
    return PRAC;
  };
  const guardarPractica = () => { try { localStorage.setItem(KP, JSON.stringify(PRAC || {})); } catch (e) {} };
  const hab = S => {
    if (practica(S)) return habPractica();
    const s = S.story; if (!s) return null; s.hab = s.hab || { activa: {} }; s.hab.activa = s.hab.activa || {}; return s.hab;
  };
  const guardar = S => { if (practica(S)) guardarPractica(); else S.saveStory && S.saveStory(); };
  // corazón valiente en la práctica: la vida máxima es la de siempre + el nodo
  const vidaPractica = S => { if (!practica(S)) return; const mx = 3 + (del(S, S.playerHero).corazon || 0); const ant = S.maxHealth || 3; if (ant !== mx) { S.maxHealth = mx; S.health = mx > ant ? S.health + (mx - ant) : Math.min(S.health, mx); S.updateHUD && S.updateHUD(); } };
  const del = (S, h) => { const H = hab(S); if (!H) return {}; return (H[h] = H[h] || {}); };
  const rg = (S, id, h) => { h = h || S.playerHero; if (!activo(S) || !ARBOL[h]) return 0; return del(S, h)[id] || 0; };
  const gastados = (S, h, ramaId) => { const t = del(S, h); const A = ARBOL[h]; let n = 0; A.ramas.forEach(r => { if (ramaId && r.id !== ramaId) return; r.nodos.forEach(x => (n += t[x.id] || 0)); }); return n; };
  const puntos = (S, h) => Math.max(0, ((S.story && S.story.level) || 1) - 1 + 1 - gastados(S, h));
  const puede = (S, h, rama, n) => { const r = del(S, h)[n.id] || 0; if (practica(S)) return r < n.max; return r < n.max && puntos(S, h) > 0 && gastados(S, h, rama.id) >= n.req; };
  const abiertoN = (S, h, rama, n) => practica(S) || gastados(S, h, rama.id) >= n.req;
  const subir = (S, h, id) => {
    const x = nodo(h, id); if (!x || !puede(S, h, x.rama, x.n)) return false;
    const t = del(S, h); t[id] = (t[id] || 0) + 1;
    if (x.n.tipo === 'a') hab(S).activa[h] = id;          // la habilidad nueva queda puesta en R
    if (id === 'corazon' && t[id] === 1 && S.story) { S.story.maxHealth = Math.min(8, S.story.maxHealth + 1); S.maxHealth = S.story.maxHealth; S.health = Math.min(S.maxHealth, S.health + 1); S.updateHUD && S.updateHUD(); }
    aplicar(S); guardar(S);
    return true;
  };
  // práctica: bajar un rango, llenar una rama entera, vaciar todo
  const bajar = (S, h, id) => {
    const x = nodo(h, id), t = del(S, h); if (!practica(S) || !x || !t[id]) return false;
    t[id]--;
    if (!t[id]) {
      delete t[id];
      if (hab(S).activa[h] === id) {   // queda en R otra habilidad nueva que tenga aprendida, si hay
        let otra = null; ARBOL[h].ramas.forEach(rm => rm.nodos.forEach(n => { if (n.tipo === 'a' && t[n.id]) otra = n.id; }));
        hab(S).activa[h] = otra;
      }
    }
    aplicar(S); guardar(S); return true;
  };
  const llenarRama = (S, h, ri) => {
    const rama = ARBOL[h] && ARBOL[h].ramas[ri]; if (!practica(S) || !rama) return false;
    const t = del(S, h); rama.nodos.forEach(n => { t[n.id] = n.max; if (n.tipo === 'a') hab(S).activa[h] = n.id; });
    aplicar(S); guardar(S); return true;
  };
  const vaciar = S => { const H = hab(S); H[S.playerHero] = {}; H.activa[S.playerHero] = null; aplicar(S); guardar(S); };

  // ================================================================== estadísticas
  P.ckStaminaMax = function () {
    const s = this.story || { level: 1 }, up = s.up || {};
    return 100 + ((s.level || 1) - 1) * 5 + (up.sta || 0) * 20 + rg(this, 'vigor') * 15;
  };
  const aplicar = S => {
    if (!S.player) return;
    const b = S._ckBase || (S._ckBase = { regen: S.staminaRegenRate || 18, dashCd: S.dashCooldown || 600, spinCd: S.spinCooldown || 1200, spinCost: S.spinStaminaCost || 35, dashCost: S.dashStaminaCost || 50, walk: S.playerSpeed || 115, run: S.playerRunSpeed || 180 });
    if (!activo(S)) { Object.assign(S, { staminaRegenRate: b.regen, dashCooldown: b.dashCd, spinCooldown: b.spinCd, spinStaminaCost: b.spinCost, dashStaminaCost: b.dashCost, playerSpeed: b.walk, playerRunSpeed: b.run }); return; }
    S.staminaRegenRate = b.regen * (1 + 0.25 * (rg(S, 'aliento') + rg(S, 'mente')));
    S.spinCooldown = b.spinCd * (1 - 0.25 * rg(S, 'torbellino'));
    S.spinStaminaCost = b.spinCost - 8 * rg(S, 'torbellino') - 6 * rg(S, 'amplia');
    S.dashCooldown = b.dashCd * (1 - 0.2 * rg(S, 'esquiva'));
    S.dashStaminaCost = b.dashCost - 8 * rg(S, 'esquiva');
    const pies = 1 + 0.06 * rg(S, 'pies');
    S.playerSpeed = b.walk * pies; S.playerRunSpeed = b.run * pies;
    vidaPractica(S);
    const mx = S.ckStaminaMax();
    if (mx !== S.maxStamina) { S.maxStamina = mx; S.stamina = Math.min(S.stamina, mx); S.updateStaminaBar && S.updateStaminaBar(); }
    pintarRanura(S);
  };

  // ================================================================== daño: de dónde viene y cuánto suma
  const conFuente = (nombre, fuente) => {
    const o = P[nombre]; if (typeof o !== 'function') return;
    P[nombre] = function () {
      const antes = this._ckFuente; this._ckFuente = typeof fuente === 'function' ? fuente.apply(this, arguments) : fuente;
      try { return o.apply(this, arguments); } finally { this._ckFuente = antes; }
    };
  };
  conFuente('checkMeleeHits', function (o) { return this._bladeDance ? 'danza' : this._ckRemolino ? 'remolino' : (this.playerHero === 'swordsman' && o && o.damage >= 2) ? 'pesado' : 'golpe'; });
  conFuente('checkThrustHits', 'estocada');
  conFuente('checkWizardMagicHits', 'hielo');
  conFuente('checkSpinHits', 'giro');
  conFuente('thunderStrike', 'trueno');
  conFuente('tryParry', 'parada');

  const ESPADA = /golpe|pesado|danza|estocada|giro|remolino|parada|embestida|onda|paso/;
  const d0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount, sx, sy) {
    if (!activo(this) || !enemy || enemy.isDead || !ARBOL[this.playerHero]) return d0.apply(this, arguments);
    const f = this._ckFuente || '', h = this.playerHero;
    let a = amount, crit = false;
    if (f === 'flecha' && Math.random() < 0.3 * rg(this, 'punta')) a += 1;
    if (f === 'fuego' && Math.random() < 0.3 * rg(this, 'llama')) a += 1;
    if (f === 'pesado') a += [0, 1, 1, 2][rg(this, 'ritmo')];
    if (f === 'hielo' && enemy._ckLento > this.time.now && Math.random() < 0.5 * rg(this, 'quema')) a += 1;
    if (this._ckGrito > this.time.now) a += 1;
    let pc = 0;
    if (h === 'soldier' && ESPADA.test(f)) pc = 0.1 * rg(this, 'filo');
    if (h === 'swordsman') pc = 0.08 * rg(this, 'ojo');
    if (pc && Math.random() < pc) { a *= 2; crit = true; }
    const r = d0.call(this, enemy, a, sx, sy);
    try {
      if (crit) {
        this.createFloatingText(enemy.x, enemy.y - 36, '¡CRÍTICO!', 0xffc14d);
        const hr = rg(this, 'herida');
        if (hr && enemy.active) this.time.delayedCall(700, () => { if (enemy.active && !enemy.isDead) { const fa = this._ckFuente; this._ckFuente = 'herida'; d0.call(this, enemy, hr, enemy.x, enemy.y - 1); this._ckFuente = fa; } });
      }
      if (f === 'hielo' && rg(this, 'helado')) { enemy._ckLento = this.time.now + 2000; enemy._ckLentoK = 1 - [0, 0.25, 0.4, 0.55][rg(this, 'helado')]; }
      if (enemy.isDead && ESPADA.test(f) && rg(this, 'gracia')) { this.stamina = Math.min(this.maxStamina, this.stamina + 12); this.updateStaminaBar && this.updateStaminaBar(); }
    } catch (e) {}
    return r;
  };

  // golpes que se aguantan / escudo de escarcha
  const dp0 = P.damagePlayer;
  P.damagePlayer = function (amount) {
    if (activo(this) && !this.isInvulnerable && !this.isDead && !this.dialogOpen && !this._doorTransition && this.player) {
      const p = this.player;
      if (rg(this, 'coraza') && this.time.now > (this._ckCorazaAt || 0)) {
        this._ckCorazaAt = this.time.now + 25000;
        this.createFloatingText(p.x, p.y - 44, '¡BLOQUEADO!', 0x9fd8ff);
        const c = this.add.circle(p.x, p.y, 20, 0x9fd8ff, 0.35).setDepth(p.depth + 2);
        this.tweens.add({ targets: c, radius: 34, alpha: 0, duration: 300, onComplete: () => c.destroy() });
        try { sfx.fx('ice_cast', 0.6, { rate: 1.3 }); } catch (e) {}
        this.isInvulnerable = true; this.time.delayedCall(400, () => { this.isInvulnerable = false; });
        return;
      }
      if (Math.random() < 0.12 * rg(this, 'hierro')) {
        this.createFloatingText(p.x, p.y - 44, '¡BLOQUEO!', 0xcbd5e1);
        try { sfx.fx('sword_hit', 0.6, { rate: 0.8 }); } catch (e) {}
        this.isInvulnerable = true; this.time.delayedCall(350, () => { this.isInvulnerable = false; });
        return;
      }
    }
    return dp0.apply(this, arguments);
  };
  const tp0 = P.tryParry;
  P.tryParry = function () {
    const r = tp0.apply(this, arguments);
    if (r && rg(this, 'contra')) {
      const p = this.player; let best = null, bd = 100;
      this.enemies.getChildren().forEach(e => { if (!e.active || e.isDead) return; const d = Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y); if (d < bd) { bd = d; best = e; } });
      if (best) { const fa = this._ckFuente; this._ckFuente = 'parada'; this.damageEnemy(best, 2, p.x, p.y); this._ckFuente = fa; }
    }
    return r;
  };

  // ================================================================== proyectiles
  const nuevos = (S, fn) => { const antes = new Set(S.projectiles.getChildren()); fn(); return S.projectiles.getChildren().filter(o => !antes.has(o)); };
  const girar = (o, ang) => {
    const v = o.body.velocity, c = Math.cos(ang), s = Math.sin(ang);
    const vx = v.x * c - v.y * s, vy = v.x * s + v.y * c;
    o.body.setVelocity(vx, vy);
    o.setRotation(Math.atan2(vy, vx) - (o.flipX ? Math.PI : 0));
  };
  const sa0 = P.shootArrow;
  P.shootArrow = function () {
    if (!activo(this) || this.playerHero !== 'soldier' || this._ckSinExtra) return sa0.apply(this, arguments);
    const tri = rg(this, 'triple');
    const ls = nuevos(this, () => { sa0.apply(this, arguments); if (tri) { sa0.apply(this, arguments); sa0.apply(this, arguments); } });
    if (tri && ls.length === 3) { girar(ls[1], -0.2); girar(ls[2], 0.2); }
    const pf = rg(this, 'perfora');
    ls.forEach(a => { a._ckPerfora = pf; a._ckGolpeados = new Set(); });
    return ls[0];
  };
  const hp0 = P.handleProjectileHitEnemy;
  P.handleProjectileHitEnemy = function (pr, enemy) {
    if (!pr.active || !enemy.active || enemy.isDead) return;
    const ck = pr._ck;
    if (ck) {                                           // proyectiles de las habilidades nuevas
      pr._ckGolpeados = pr._ckGolpeados || new Set();
      if (pr._ckGolpeados.has(enemy)) return;
      pr._ckGolpeados.add(enemy);
      const fa = this._ckFuente; this._ckFuente = ck.fuente;
      try {
        if (ck.explota) { explosion(this, pr.x, pr.y, ck.explota, 2, 0xff8a3d); pr.destroy(); return; }
        this.damageEnemy(enemy, ck.dmg, pr.x, pr.y);
        if (ck.frena) { enemy._ckLento = this.time.now + 2500; enemy._ckLentoK = 0.45; }
        try { sfx.fx(ck.snd || 'sword_hit', 0.6, { minGap: 60 }); } catch (e) {}
        if (!ck.atraviesa) pr.destroy();
      } finally { this._ckFuente = fa; }
      return;
    }
    if (pr.isFireball) {
      const x = pr.x, y = pr.y;
      const fa = this._ckFuente; this._ckFuente = 'fuego';
      try { hp0.apply(this, arguments); } finally { this._ckFuente = fa; }
      const est = rg(this, 'estallido');
      if (est && this.playerHero === 'wizard') {
        const rad = 65 + est * 20;
        const ring = this.add.circle(x, y, 20).setStrokeStyle(3, 0xffa94d, 0.9).setDepth(16);
        this.tweens.add({ targets: ring, radius: rad, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
        this._ckFuente = 'fuego';
        this.enemies.getChildren().slice().forEach(e => { if (!e.active || e.isDead || e === enemy) return; const d = Phaser.Math.Distance.Between(x, y, e.x, e.y); if (d > 65 && d <= rad) this.damageEnemy(e, 1, x, y); });
        this._ckFuente = fa;
      }
      if (rg(this, 'brasas') && this.playerHero === 'wizard') brasas(this, x, y + 8);
      return;
    }
    // flecha
    const pf = pr._ckPerfora || 0;
    if (pf > 0 && pr._ckGolpeados) {
      if (pr._ckGolpeados.has(enemy)) return;
      pr._ckGolpeados.add(enemy);
      const fa = this._ckFuente; this._ckFuente = 'flecha';
      this.damageEnemy(enemy, 1, pr.x, pr.y); this._ckFuente = fa;
      try { sfx.fx('sword_hit', 0.6, { minGap: 60 }); } catch (e) {}
      pr._ckPerfora = pf - 1;
      return;
    }
    const fa = this._ckFuente; this._ckFuente = 'flecha';
    try { return hp0.apply(this, arguments); } finally { this._ckFuente = fa; }
  };

  const explosion = (S, x, y, rad, dmg, col) => {
    const c = S.add.circle(x, y, 10, col, 0.85).setDepth(Math.round(y) + 30);
    S.tweens.add({ targets: c, radius: rad, alpha: 0, duration: 300, onComplete: () => c.destroy() });
    S.cameras.main.shake(140, 0.006);
    try { sfx.fx('ck_explosion', 0.85) || sfx.fx('fire_hit', 0.8); } catch (e) {}
    if (window.CK_LUZ) window.CK_LUZ.agregar({ x, y, c: [255, 150, 60], r: rad * 2, f: 1, ms: 300, curva: 'cae' });
    S.enemies.getChildren().slice().forEach(e => { if (!e.active || e.isDead) return; if (Phaser.Math.Distance.Between(x, y, e.x, e.y) <= rad + 8) S.damageEnemy(e, dmg, x, y); });
  };
  const brasas = (S, x, y) => {
    const g = S.add.graphics().setDepth(Math.round(y) - 2);
    const t0 = S.time.now, DUR = 2500, RAD = 34;
    const golpeado = new Map();
    const ev = S.time.addEvent({ delay: 50, loop: true, callback: () => {
      const t = S.time.now - t0;
      if (t > DUR || !g.active) { ev.remove(); g.destroy(); return; }
      g.clear();
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7 + t * 0.002, d = (i % 3) * 10 + 6;
        g.fillStyle(i % 2 ? 0xff7a1a : 0xffc14d, 0.75 * (1 - t / DUR));
        g.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.5 - (t / 60 + i * 3) % 6), 2, 3);
      }
      S.enemies.getChildren().forEach(e => {
        if (!e.active || e.isDead) return;
        if (Phaser.Math.Distance.Between(x, y, e.x, e.y + 10) > RAD) return;
        if (S.time.now - (golpeado.get(e) || 0) < 1000) return;
        golpeado.set(e, S.time.now);
        const fa = S._ckFuente; S._ckFuente = 'fuego'; S.damageEnemy(e, 1, x, y); S._ckFuente = fa;
      });
    } });
    if (window.CK_LUZ) window.CK_LUZ.agregar({ x, y, c: [255, 120, 40], r: 70, f: 0.8, ms: DUR, curva: 'cae' });
  };

  // ================================================================== cada cuadro: frío, dash que lastima, carga del trueno
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      if (!activo(this) || !this.player || !ARBOL[this.playerHero]) return r;
      const now = this.time.now;
      // bestias frenadas por el hielo
      this.enemies && this.enemies.getChildren().forEach(e => {
        if (!e.active || !e.body) return;
        if (e._ckLento > now) { e.body.velocity.x *= e._ckLentoK || 0.6; e.body.velocity.y *= e._ckLentoK || 0.6; if (!e._ckTinteHielo) { e._ckTinteHielo = true; e.setTint && e.setTint(0xa8dcff); } }
        else if (e._ckTinteHielo) { e._ckTinteHielo = false; e.clearTint && e.clearTint(); }
      });
      // embestida
      if (this.isDashing && rg(this, 'embestida')) {
        const p = this.player, tok = this.lastDashTime;
        this.enemies.getChildren().forEach(e => {
          if (!e.active || e.isDead || e._ckEmbestida === tok) return;
          if (Phaser.Math.Distance.Between(p.x, p.y + 6, e.x, e.y) < 30) { e._ckEmbestida = tok; const fa = this._ckFuente; this._ckFuente = 'embestida'; this.damageEnemy(e, 1, p.x, p.y); this._ckFuente = fa; }
        });
      }
      // carga rápida del trueno: el tiempo cargado corre más rápido
      const tc = this.thunderCharge, cr = rg(this, 'carga');
      if (tc && cr) tc.start -= (delta || 16) * 0.15 * cr;
      // ranura de R: la recarga
      if ((this._ckRanAcc = (this._ckRanAcc || 0) + (delta || 16)) > 150) { this._ckRanAcc = 0; pintarRanura(this); }
    } catch (e) { if (!this._ckHabErr) { this._ckHabErr = true; console.warn('[habilidades]', e); } }
    return r;
  };

  // lluvia cerrada: más flechas → la lluvia se vuelve a tirar con menos flechas alrededor
  const ar0 = P.performArrowRain;
  P.performArrowRain = function () {
    const antes = this.lastRainTime;
    const r = ar0.apply(this, arguments);
    const lv = rg(this, 'lluvia');
    if (lv && this.lastRainTime !== antes) {
      const p = this.player, cx = p.body ? p.body.center.x : p.x, cy = p.body ? p.body.bottom : p.y + 12;
      this.time.delayedCall(1150, () => lluviaExtra(this, cx, cy, lv * 5, 58 + lv * 18));
    }
    return r;
  };
  const lluviaExtra = (S, cx, cy, n, RAD) => {
    const hasArrow = S.textures.exists('arrow');
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2, dist = Math.sqrt(Math.random()) * RAD;
      const tx = Math.round(cx + Math.cos(ang) * dist), ty = Math.round(cy + Math.sin(ang) * dist * 0.75);
      S.time.delayedCall(i * 60 + Math.random() * 40, () => {
        const sx = tx - 34, sy = ty - 230, rot = Math.atan2(ty - sy, tx - sx);
        const a = hasArrow ? S.add.image(sx, sy, 'arrow').setRotation(rot) : S.add.rectangle(sx, sy, 12, 2, 0xfde68a).setRotation(rot);
        a.setDepth(ty + 40);
        S.tweens.add({ targets: a, x: tx - 5, y: ty - 8, duration: 240, ease: 'Quad.easeIn', onComplete: () => {
          a.setDepth(ty);
          S.enemies && S.enemies.getChildren().slice().forEach(e => { if (!e.active || e.isDead) return; const ex = e.body ? e.body.center.x : e.x, ey = e.body ? e.body.bottom : e.y + 12; if (Math.hypot(ex - tx, (ey - ty) / 0.75) <= 15) { const fa = S._ckFuente; S._ckFuente = 'flecha'; S.damageEnemy(e, 1, tx, ty - 20); S._ckFuente = fa; } });
          S.tweens.add({ targets: a, alpha: 0, delay: 450, duration: 250, onComplete: () => a.destroy() });
        } });
      });
    }
  };
  // ritmo: la cadena de Aby dura más
  const pa0 = P.performAttack;
  P.performAttack = function () {
    if (this.playerHero === 'swordsman' && rg(this, 'ritmo') >= 2 && this.abyChainAt) this.abyChainAt += 300;   // ventana de 900 → 1200 ms
    return pa0.apply(this, arguments);
  };
  // ráfaga: una cuarta estocada
  const ps0 = P.performSpecialAttack;
  P.performSpecialAttack = function () {
    const ib = this.isAttacking;
    const r = ps0.apply(this, arguments);
    if (!ib && this.isAttacking && this.playerHero === 'swordsman' && rg(this, 'rafaga')) {
      this.time.delayedCall(720, () => { if (this.isDead || !this.isAttacking) return; try { sfx.fx('sword_swing1', 0.6, { rate: 1.8 }); } catch (e) {} this.checkThrustHits(2); });
    }
    return r;
  };
  // danza amplia: los golpes de la danza llegan más lejos
  const cm0 = P.checkMeleeHits;
  P.checkMeleeHits = function (o) {
    if (this._bladeDance && rg(this, 'amplia') && o) o = Object.assign({}, o, { radius: Math.round(o.radius * (1 + 0.2 * rg(this, 'amplia'))) });
    return cm0.call(this, o);
  };
  // rayo en cadena
  const ts0 = P.thunderStrike;
  P.thunderStrike = function (level) {
    const r = ts0.apply(this, arguments);
    if (rg(this, 'cadena') && this.player) {
      const p = this.player, cx = p.x, cy = p.y;
      const info = this.thunderLevelInfo(level) || { radius: 60 };
      const lejos = this.enemies.getChildren().filter(e => e.active && !e.isDead).map(e => [e, Phaser.Math.Distance.Between(cx, cy, e.x, e.y)]).filter(([, d]) => d > info.radius && d < info.radius + 140).sort((a, b) => a[1] - b[1]).slice(0, 2);
      lejos.forEach(([e], i) => this.time.delayedCall(180 + i * 120, () => {
        if (!e.active || e.isDead) return;
        const g = this.add.graphics().setDepth(e.depth + 5);
        g.lineStyle(2, 0xe0f2fe, 1); g.beginPath(); g.moveTo(cx, cy - 10);
        for (let k = 1; k <= 6; k++) g.lineTo(cx + (e.x - cx) * k / 6 + (k < 6 ? R(-8, 8) : 0), cy - 10 + (e.y - cy) * k / 6 + (k < 6 ? R(-8, 8) : 0));
        g.strokePath();
        this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
        const fa = this._ckFuente; this._ckFuente = 'trueno'; this.damageEnemy(e, 1, cx, cy); this._ckFuente = fa;
      }));
    }
    return r;
  };

  // ================================================================== habilidades nuevas (R)
  const texturas = S => {
    const mk = (k, w, h, fn) => { if (S.textures.exists(k)) return; const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); S.textures.addCanvas(k, c); };
    const p = (g, col, pts) => { g.fillStyle = col; pts.forEach(([x, y, w = 1, h = 1]) => g.fillRect(x, y, w, h)); };
    mk('ck_onda', 14, 22, g => { p(g, '#e8f6ff', [[6, 0, 2, 2], [8, 2, 2, 3], [9, 5, 2, 12], [8, 17, 2, 3], [6, 20, 2, 2]]); p(g, '#7fc8ff', [[5, 2, 3, 2], [6, 4, 3, 2], [7, 6, 2, 10], [6, 16, 3, 2], [5, 18, 3, 2]]); p(g, '#3a7fc0', [[4, 6, 3, 10]]); });
    mk('ck_daga', 13, 5, g => { p(g, '#3a2414', [[0, 1, 4, 3]]); p(g, '#c9a24a', [[4, 0, 1, 5]]); p(g, '#e6edf2', [[5, 1, 7, 3]]); p(g, '#ffffff', [[5, 1, 6, 1], [12, 2, 1, 1]]); p(g, '#8a96a0', [[5, 3, 7, 1]]); });
    mk('ck_lanza_hielo', 22, 7, g => { p(g, '#bfe9ff', [[0, 3, 15, 1]]); p(g, '#e8f8ff', [[2, 2, 12, 3]]); p(g, '#7fc8ff', [[3, 4, 12, 1]]); p(g, '#ffffff', [[15, 1, 3, 5], [18, 2, 2, 3], [20, 3, 2, 1]]); p(g, '#9fd8ff', [[0, 0, 2, 2], [0, 5, 2, 2], [3, 1, 1, 1], [3, 5, 1, 1]]); });
  };
  const dirV = S => S.facingV === 'front' ? [0, 1] : S.facingV === 'back' ? [0, -1] : [S.facingDirection === 'left' ? -1 : 1, 0];
  const disparo = (S, key, vel, ck, opt = {}) => {
    const p = S.player, [dx, dy] = opt.dir || dirV(S);
    const x = p.x + dx * 22, y = p.y + 6 + dy * 18;
    const o = S.projectiles.create(x, y, key);
    o.isFireball = false; o._ck = ck;
    o.setScale(opt.escala || 1.2).setRotation(Math.atan2(dy, dx)).setDepth(Math.max(10, Math.round(y + 16)));
    o.body.setAllowGravity(false);
    o.body.setSize(opt.w || 16, opt.h || 16);
    o.body.setVelocity(dx * vel, dy * vel);
    S.time.delayedCall(opt.vida || 1800, () => { if (o.active) o.destroy(); });
    return o;
  };
  const rotarDir = (d, a) => [d[0] * Math.cos(a) - d[1] * Math.sin(a), d[0] * Math.sin(a) + d[1] * Math.cos(a)];
  const HACER = {
    explosiva(S) {
      S.player.play(S.heroAnim('soldier_attack3'));
      try { sfx.fx('bow_shot', 0.8); } catch (e) {}
      S.time.delayedCall(220, () => {
        const ls = nuevos(S, () => { S._ckSinExtra = true; try { S.shootArrow(); } finally { S._ckSinExtra = false; } });
        ls.forEach(a => { a._ck = { fuente: 'flecha', explota: 52 }; a.setTint(0xff9a3d); });
      });
      return 520;
    },
    onda(S) {
      S.player.play('soldier_attack2');
      try { sfx.fx('sword_swing2', 0.8, { rate: 0.9 }); } catch (e) {}
      S.time.delayedCall(160, () => { const o = disparo(S, 'ck_onda', 330, { fuente: 'onda', dmg: 2, atraviesa: true }, { w: 18, h: 26 }); o.setBlendMode(1); });
      return 450;
    },
    grito(S) {
      const p = S.player;
      S._ckGrito = S.time.now + 8000;
      try { sfx.fx('ck_grito', 0.85) || sfx.fx('orc_attack', 0.7, { rate: 1.25 }); } catch (e) {}
      S.cameras.main.shake(200, 0.006);
      const ring = S.add.circle(p.x, p.y + 6, 12).setStrokeStyle(4, 0xffd27a, 0.9).setDepth(p.depth + 2);
      S.tweens.add({ targets: ring, radius: 95, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
      S.enemies.getChildren().forEach(e => { if (!e.active || e.isDead) return; const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y); if (d < 95) { const a = Math.atan2(e.y - p.y, e.x - p.x); e.body.setVelocity(Math.cos(a) * 260, Math.sin(a) * 260); } });
      S.createFloatingText(p.x, p.y - 48, '+1 DAÑO · 8 s', 0xffd27a);
      p.setTint(0xffe2a0); S.time.delayedCall(8000, () => p.active && p.clearTint());
      return 0;
    },
    remolino(S) {
      const p = S.player;
      S._ckRemolino = true; S.isInvulnerable = true;
      const t0 = S.time.now;
      const anim = S.anims.exists('swordsman_attack2') ? 'swordsman_attack2' : null;
      try { sfx.fx('spin', 0.8, { rate: 1.3 }); } catch (e) {}
      const ev = S.time.addEvent({ delay: 300, repeat: 4, callback: () => {
        if (S.isDead) return;
        if (anim && (!p.anims.isPlaying || p.anims.currentAnim.key !== anim)) p.play(anim);
        S.checkMeleeHits({ reach: 0, radius: 64, damage: 1 });
        const ring = S.add.circle(p.x, p.y + 8, 14).setStrokeStyle(3, 0xfda4af, 0.8).setDepth(p.depth + 1);
        S.tweens.add({ targets: ring, radius: 64, alpha: 0, duration: 240, onComplete: () => ring.destroy() });
        try { sfx.fx('sword_swing1', 0.5, { rate: 1.4 }); } catch (e) {}
      } });
      S.time.delayedCall(1550, () => { S._ckRemolino = false; S.isInvulnerable = false; });
      return 1500;
    },
    dagas(S) {
      const n = rg(S, 'filo_dagas') >= 2 ? 5 : 3, dmg = 1 + (rg(S, 'filo_dagas') ? 1 : 0);
      S.player.play('swordsman_attack1');
      try { sfx.fx('ck_dagas', 0.8) || sfx.fx('sword_swing1', 0.7, { rate: 1.7 }); } catch (e) {}
      S.time.delayedCall(140, () => {
        const d = dirV(S);
        for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 0.18; disparo(S, 'ck_daga', 420, { fuente: 'daga', dmg }, { dir: rotarDir(d, a), w: 12, h: 12, vida: 1300 }); }
      });
      return 380;
    },
    paso(S) {
      const p = S.player;
      let best = null, bd = 150;
      S.enemies.getChildren().forEach(e => { if (!e.active || e.isDead) return; const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y); if (d < bd) { bd = d; best = e; } });
      if (!best) { S.createFloatingText(p.x, p.y - 44, 'No hay bestias cerca', 0xcbd5e1); return -1; }
      const lado = best.flipX ? 1 : -1;                    // detrás: del lado contrario al que mira
      const fx = S.add.circle(p.x, p.y, 16, 0x2d2a4a, 0.7).setDepth(p.depth + 1);
      S.tweens.add({ targets: fx, alpha: 0, scale: 0.3, duration: 260, onComplete: () => fx.destroy() });
      p.setPosition(best.x + lado * 26, best.y + 2);
      if (p.body) p.body.reset(p.x, p.y);
      S.facingDirection = lado > 0 ? 'left' : 'right'; p.setFlipX(lado > 0);
      p.play('swordsman_attack1');
      try { sfx.fx('ck_paso', 0.8) || sfx.fx('sword_swing2', 0.8, { rate: 1.4 }); } catch (e) {}
      S.isInvulnerable = true; S.time.delayedCall(400, () => { S.isInvulnerable = false; });
      S.time.delayedCall(120, () => { if (best.active && !best.isDead) { const fa = S._ckFuente; S._ckFuente = 'paso'; S.damageEnemy(best, 2, p.x, p.y); S._ckFuente = fa; } });
      return 380;
    },
    triple_fuego(S) {
      S.player.play('wizard_attack2');
      try { sfx.fx('fire_cast', 0.8); } catch (e) {}
      S.time.delayedCall(230, () => {
        const ls = nuevos(S, () => { S.castFireball(); S.castFireball(); S.castFireball(); });
        if (ls.length === 3) { girar(ls[1], -0.24); girar(ls[2], 0.24); }
      });
      return 600;
    },
    lanza(S) {
      S.player.play('wizard_attack1');
      try { sfx.fx('ice_cast', 0.8, { rate: 0.85 }); } catch (e) {}
      S.time.delayedCall(180, () => { const o = disparo(S, 'ck_lanza_hielo', 380, { fuente: 'hielo', dmg: 2, atraviesa: true, frena: true, snd: 'ice_cast' }, { w: 20, h: 12, vida: 1600 }); o.setBlendMode(1); });
      return 420;
    },
    nova(S) {
      const p = S.player;
      S.player.play('wizard_attack1');
      try { sfx.fx('ck_nova', 0.85) || sfx.fx('ice_cast', 0.8, { rate: 0.6 }); } catch (e) {}
      const ring = S.add.circle(p.x, p.y + 6, 10, 0xb39dff, 0.35).setStrokeStyle(4, 0xd8ccff, 1).setDepth(p.depth + 2).setBlendMode(1);
      S.tweens.add({ targets: ring, radius: 90, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
      if (window.CK_LUZ) window.CK_LUZ.agregar({ x: p.x, y: p.y, c: [190, 160, 255], r: 180, f: 1, ms: 380, curva: 'cae' });
      const fa = S._ckFuente; S._ckFuente = 'nova';
      S.enemies.getChildren().slice().forEach(e => { if (!e.active || e.isDead) return; const d = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y); if (d < 92) { S.damageEnemy(e, 1, p.x, p.y); if (e.active && e.body) { const a = Math.atan2(e.y - p.y, e.x - p.x); e.body.setVelocity(Math.cos(a) * 320, Math.sin(a) * 320); } } });
      S._ckFuente = fa;
      return 380;
    }
  };
  P.ckHabilidadR = function () {
    const H = hab(this), id = H && H.activa[this.playerHero];
    return this.ckUsarHabilidad(id, 'R');
  };
  // usar una habilidad aprendida por su id (R, o las ranuras Q E R F de ck_habilidades_equipo.js)
  P.ckUsarHabilidad = function (id, tecla) {
    if (!activo(this) || !this.gameStarted || this.combatLocked() || this.isDead || this.isAttacking || this.isDashing || this.isSpinning || this._overlay || this.isGamePaused) return;
    const h = this.playerHero;
    if (!id || !rg(this, id) || !HACER[id] || !ACTIVAS[id]) { if (window.CK_SIN_CARTELES_API) window.CK_SIN_CARTELES_API.nota((tecla || 'R') + ': todavía no tenés una habilidad ahí (árbol de habilidades: H)'); return; }
    const A = ACTIVAS[id], now = this.time.now;
    this._ckCd = this._ckCd || {};
    if (now < (this._ckCd[id] || 0)) return;
    if (this.stamina < A.cost) { this.showLowStaminaWarning && this.showLowStaminaWarning(nodo(h, id).n.n); return; }
    texturas(this);
    const bloquea = HACER[id](this);
    if (bloquea < 0) return;
    this.stamina = Math.max(0, this.stamina - A.cost); this.updateStaminaBar && this.updateStaminaBar();
    this._ckCd[id] = now + A.cd;
    if (bloquea > 0) {
      this.isAttacking = true; this.player.setVelocity(0, 0);
      this.time.delayedCall(bloquea, () => { this.isAttacking = false; if (!this.isDead && this.player.active) { const k = this.heroAnim ? this.heroAnim(this.playerHero + '_idle') : this.playerHero + '_idle'; if (this.anims.exists(k)) this.player.play(k, true); } });
    }
    pintarRanura(this);
  };

  // ================================================================== íconos (por código, 16x16)
  const ICONOS = {};
  const icono = (k, col) => {
    if (window.CK_ICONOS_HEROE && window.CK_ICONOS_HEROE[k]) return window.CK_ICONOS_HEROE[k];
    const key = k + col;
    if (ICONOS[key]) return ICONOS[key];
    const c = document.createElement('canvas'); c.width = 16; c.height = 16;
    const g = c.getContext('2d'), p = (cl, x, y, w = 1, h = 1) => { g.fillStyle = cl; g.fillRect(x, y, w, h); };
    const O = '#2b1a10', C = col, L = '#f6e7c8', M = '#c9a24a', G = '#9aa6b0', W = '#e8eef2';
    const linea = (x0, y0, x1, y1, cl) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) p(cl, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)); };
    const D = {
      flecha: () => { linea(2, 13, 11, 4, O); linea(3, 13, 12, 4, M); p(W, 11, 2, 3, 2); p(W, 12, 4, 2, 2); p(O, 14, 2, 1, 4); p(C, 1, 12, 2, 2); p(C, 3, 14, 2, 1); },
      triple: () => { [[2, 12, 10, 4], [4, 14, 12, 6], [1, 9, 8, 2]].forEach(([a, b, c2, d]) => { linea(a, b, c2, d, M); p(W, c2, d - 1, 2, 2); }); },
      perfora: () => { linea(1, 8, 13, 8, M); p(W, 13, 7, 2, 3); p(C, 6, 4, 3, 9); p(O, 6, 4, 1, 9); p(M, 7, 8, 1, 1); },
      lluvia: () => { for (let i = 0; i < 4; i++) { linea(3 + i * 3, 2 + (i % 2) * 2, 1 + i * 3, 9 + (i % 2) * 2, M); p(W, 1 + i * 3, 10 + (i % 2) * 2, 1, 2); } p(C, 1, 14, 14, 1); },
      explosion: () => { p('#ffd27a', 5, 5, 6, 6); p('#ff8a3d', 3, 6, 10, 4); p('#ff8a3d', 6, 3, 4, 10); p('#c2410c', 2, 2, 2, 2); p('#c2410c', 12, 2, 2, 2); p('#c2410c', 2, 12, 2, 2); p('#c2410c', 12, 12, 2, 2); p(L, 7, 7, 2, 2); },
      espada: () => { linea(3, 13, 12, 4, W); linea(4, 13, 13, 4, G); p(M, 2, 10, 4, 1); p(M, 5, 11, 1, 3); p(O, 1, 14, 2, 1); p(C, 2, 13, 2, 1); },
      espadas: () => { linea(2, 13, 12, 3, W); linea(13, 13, 3, 3, W); p(M, 3, 10, 3, 1); p(M, 10, 10, 3, 1); p(C, 1, 14, 3, 1); p(C, 12, 14, 3, 1); },
      giro: () => { for (let a = 0; a < 6.0; a += 0.25) p(a < 3 ? W : C, Math.round(8 + Math.cos(a) * (6 - a / 2)), Math.round(8 + Math.sin(a) * (6 - a / 2))); p(M, 7, 7, 2, 2); },
      bota: () => { p(O, 5, 2, 5, 10); p(C, 6, 3, 3, 9); p(O, 5, 11, 9, 3); p(C, 6, 11, 7, 2); p(L, 2, 6, 2, 1); p(L, 1, 9, 3, 1); },
      corazon: () => { p(O, 2, 4, 5, 6); p(O, 9, 4, 5, 6); p(O, 4, 9, 8, 3); p(O, 6, 12, 4, 2); p('#d93a3a', 3, 5, 3, 4); p('#d93a3a', 10, 5, 3, 4); p('#d93a3a', 5, 8, 6, 3); p('#d93a3a', 7, 11, 2, 2); p('#ff9a9a', 4, 5, 1, 1); },
      onda: () => { for (let y = 2; y < 14; y++) { const x = Math.round(10 - Math.abs(y - 8) * 0.6); p('#7fc8ff', x - 2, y, 2, 1); p(W, x, y, 1, 1); } },
      brazo: () => { p(O, 3, 6, 10, 6); p('#e0a070', 4, 7, 8, 4); p('#e0a070', 9, 3, 4, 5); p(O, 9, 2, 4, 1); p(C, 4, 11, 8, 2); },
      viento: () => { linea(1, 5, 11, 5, W); p(W, 12, 4, 2, 1); linea(3, 9, 14, 9, L); linea(1, 13, 9, 13, W); p(C, 10, 12, 2, 1); },
      escudo: () => { p(O, 3, 2, 10, 9); p(O, 5, 11, 6, 2); p(O, 7, 13, 2, 1); p(C, 4, 3, 8, 8); p(C, 6, 11, 4, 1); p(M, 7, 3, 2, 9); p(L, 4, 3, 1, 3); },
      cuerno: () => { p(O, 2, 9, 3, 4); p(M, 3, 10, 2, 2); linea(4, 9, 12, 3, M); linea(5, 11, 13, 5, M); p(O, 12, 2, 3, 4); p(L, 13, 3, 1, 2); },
      estocada: () => { linea(1, 8, 14, 8, W); linea(1, 9, 13, 9, G); p(M, 3, 6, 1, 5); p(C, 1, 7, 2, 3); p(W, 9, 5, 4, 1); p(W, 10, 11, 4, 1); },
      remolino: () => { for (let a = 0; a < 12.5; a += 0.3) p(a < 6 ? W : C, Math.round(8 + Math.cos(a) * a / 2), Math.round(8 + Math.sin(a) * a / 2)); },
      ojo: () => { p(O, 2, 6, 12, 5); p(L, 3, 7, 10, 3); p(C, 6, 6, 4, 5); p(O, 7, 7, 2, 3); p(W, 8, 7, 1, 1); p(O, 4, 4, 8, 1); },
      gota: () => { p(O, 6, 2, 4, 3); p(O, 4, 5, 8, 7); p(O, 5, 12, 6, 2); p(C, 7, 3, 2, 3); p(C, 5, 6, 6, 6); p(C, 6, 12, 4, 1); p(L, 6, 7, 1, 2); },
      daga: () => { linea(5, 11, 13, 3, W); linea(6, 11, 14, 3, G); p(M, 3, 9, 4, 1); p(M, 4, 10, 1, 3); p(O, 1, 13, 3, 2); p(C, 2, 12, 2, 2); },
      sombra: () => { p('#2d2a4a', 4, 3, 8, 11); p('#4a4670', 5, 4, 6, 4); p('#ff5577', 6, 6, 1, 1); p('#ff5577', 9, 6, 1, 1); p(C, 2, 13, 12, 2); },
      llama: () => { p('#7a1f08', 4, 5, 8, 9); p('#e8501c', 5, 4, 6, 10); p('#ff9a2e', 6, 6, 4, 7); p('#ffe08a', 7, 9, 2, 4); p('#e8501c', 7, 2, 2, 2); p('#e8501c', 10, 3, 1, 2); },
      copo: () => { linea(8, 1, 8, 15, W); linea(1, 8, 15, 8, W); linea(3, 3, 13, 13, '#9fd8ff'); linea(13, 3, 3, 13, '#9fd8ff'); p(C, 7, 7, 3, 3); },
      lanza: () => { linea(1, 14, 11, 4, '#9fd8ff'); linea(2, 14, 12, 4, W); p(W, 11, 2, 3, 3); p(W, 13, 1, 2, 2); p(C, 1, 12, 2, 2); },
      rayo: () => { p('#fef08a', 8, 1, 3, 4); p('#fef08a', 6, 5, 4, 2); p('#fef08a', 7, 7, 4, 2); p('#fef08a', 5, 9, 3, 4); p(W, 5, 13, 2, 2); p(O, 11, 1, 1, 4); },
      cadena: () => { [[2, 5], [6, 8], [10, 5], [13, 9]].forEach(([x, y], i) => p(i % 2 ? '#fef08a' : W, x, y, 2, 2)); linea(3, 6, 7, 9, '#fef08a'); linea(7, 9, 11, 6, '#fef08a'); linea(11, 6, 14, 10, '#fef08a'); },
      nova: () => { for (let a = 0; a < 6.3; a += 0.4) { p('#d8ccff', Math.round(8 + Math.cos(a) * 6), Math.round(8 + Math.sin(a) * 6)); p(C, Math.round(8 + Math.cos(a) * 3), Math.round(8 + Math.sin(a) * 3)); } p(W, 7, 7, 2, 2); }
    };
    (D[k] || D.espada)();
    return (ICONOS[key] = c.toDataURL());
  };

  // ================================================================== ventana
  let win = null, sel = { r: 0, i: 0 };
  const css = () => {
    if (document.getElementById('ck-hab-css')) return;
    const A = window.CK_UI2_ARTE || {}, u = n => (A[n] ? 'url("' + A[n] + '")' : 'none');
    const s = document.createElement('style'); s.id = 'ck-hab-css';
    s.textContent = `
#ck-habilidades{position:absolute;inset:0;z-index:72;display:none;align-items:center;justify-content:center;background:rgba(6,4,10,.74)}
#ck-habilidades.on{display:flex}
#ck-habilidades .ck-win{width:min(900px,96vw);max-height:94vh;overflow:auto;box-sizing:border-box;padding:6px 18px 12px;display:flex;flex-direction:column;align-items:center}
#ck-habilidades h3{margin:2px 0 0!important}
#ck-habilidades .hb-cab{display:flex;gap:18px;align-items:center;justify-content:center;font-family:var(--ck2-f,Grenze,serif);font-size:17px;color:#4a3020;margin:2px 0 8px}
#ck-habilidades .hb-cab b{color:#7a2418;font-size:21px}
#ck-habilidades .hb-cols{display:grid;grid-template-columns:repeat(var(--ramas,3),1fr);gap:12px;width:100%}
#ck-habilidades .hb-rama{display:flex;flex-direction:column;align-items:center;gap:0;padding:4px 4px 8px;background:rgba(120,80,40,.10);border:2px solid rgba(90,58,30,.35)}
#ck-habilidades .hb-tit{font-family:var(--ck2-f,Grenze,serif);font-weight:700;font-size:15px;color:#2b1a10;padding:2px 30px 2px 12px;margin:2px 0 6px;
  border:solid transparent;border-width:8px 40px 8px 16px;border-image:${u('cinta')} 4 20 4 8 fill / 8px 40px 8px 16px stretch;image-rendering:pixelated;white-space:nowrap}
#ck-habilidades .hb-tit small{font-weight:600;color:#5a3a24;margin-left:4px}
#ck-habilidades .hb-nodo{position:relative;display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;padding:3px 6px;cursor:pointer;border:2px solid transparent}
#ck-habilidades .hb-nodo + .hb-nodo::before{content:'';position:absolute;left:33px;top:-8px;width:2px;height:10px;background:#8a5a2c}
#ck-habilidades .hb-nodo.sel{border-color:#c9862b;background:rgba(255,230,170,.35);box-shadow:0 0 10px rgba(255,190,90,.5)}
#ck-habilidades .hb-ic{position:relative;flex:0 0 56px;width:56px;height:54px;background:${u('ranura_pergamino')} 0 0/100% 100% no-repeat;image-rendering:pixelated}
#ck-habilidades .hb-ic img{position:absolute;left:10px;top:9px;width:36px;height:36px;image-rendering:pixelated}
#ck-habilidades .hb-nodo.cerrado .hb-ic img{filter:grayscale(1) brightness(.6);opacity:.7}
#ck-habilidades .hb-nodo.cerrado .hb-n{color:#7d6650}
#ck-habilidades .hb-ic .hb-cand{position:absolute;right:-4px;bottom:-4px;min-width:18px;height:18px;line-height:18px;border-radius:9px;background:#2b1a10;color:#f6e7c8;font:700 11px var(--ck2-f,serif);text-align:center}
#ck-habilidades .hb-ic .hb-r{position:absolute;left:-6px;top:-6px;width:20px;height:20px;line-height:20px;text-align:center;background:${u('etiqueta_tecla')} 0 0/100% 100%;font:700 12px var(--ck2-f,serif);color:#f6e7c8;image-rendering:pixelated}
#ck-habilidades .hb-txt{display:flex;flex-direction:column;align-items:flex-start;min-width:0}
#ck-habilidades .hb-n{font-family:var(--ck2-f,Grenze,serif);font-weight:700;font-size:16px;color:#2b1a10;line-height:1.05;text-align:left}
#ck-habilidades .hb-n i{font-style:normal;font-size:11px;color:#fff;background:#7a2418;padding:0 4px;margin-left:4px;vertical-align:2px}
#ck-habilidades .hb-pips{font-size:13px;letter-spacing:2px;color:#7a2418}
#ck-habilidades .hb-pips .v{color:#b8a080}
#ck-habilidades .hb-desc{min-height:52px;width:100%;box-sizing:border-box;margin:10px 0 6px;padding:6px 12px;background:rgba(255,245,220,.5);border:2px solid rgba(90,58,30,.4);
  font-family:var(--ck2-f,Grenze,serif);font-size:16px;color:#3a2414;text-align:center}
#ck-habilidades .hb-desc b{color:#7a2418}
#ck-habilidades .hb-bot{display:flex;gap:14px;justify-content:center;align-items:center;flex-wrap:wrap}
#ck-habilidades .hb-bot button{margin:0!important;vertical-align:middle;font-size:16px!important;padding:0 6px 2px!important;min-width:150px;height:44px;cursor:pointer}
#ck-habilidades .hb-bot button:disabled{filter:grayscale(.8) brightness(.7)!important;opacity:.8;cursor:default}
#ck-habilidades .hb-ayuda{font-family:var(--ck2-f,serif);font-size:13px;color:#5a3a24;margin-top:6px}
#ck-hab-r{position:absolute;left:calc(50% + 196px);bottom:30px;width:70px;height:94px;z-index:40;pointer-events:none;display:none;background:${u('ranura_rapida')} 0 0/100% 100% no-repeat;image-rendering:pixelated;transition:opacity .2s}
#ck-hab-r.on{display:block} body.ck2-dlg #ck-hab-r{opacity:0}
#ck-hab-r.suelta{left:auto;right:150px;bottom:26px}
#ck-hab-r img{position:absolute;left:14px;top:22px;width:42px;height:42px;image-rendering:pixelated}
#ck-hab-r .cd{position:absolute;left:12px;top:20px;width:46px;height:46px;background:rgba(10,6,4,.68);transform-origin:bottom;transform:scaleY(var(--cd,0))}
#ck-hab-r b{position:absolute;left:50%;bottom:-18px;transform:translateX(-50%);width:34px;height:20px;line-height:20px;text-align:center;background:${u('etiqueta_tecla')} 0 0/100% 100%;image-rendering:pixelated;font:700 14px 'CK Grenze',Grenze,serif;color:#f3e6c8}
#ck-hab-r.vacio img{opacity:.25;filter:grayscale(1)}
.ck-hab-punto{position:absolute;right:-6px;top:-6px;min-width:20px;height:20px;line-height:20px;border-radius:10px;background:#d97706;color:#fff;font:700 12px 'CK Grenze',Grenze,serif;text-align:center;box-shadow:0 0 8px rgba(255,170,60,.9);animation:ckHabPunto 1.2s ease-in-out infinite alternate}
@keyframes ckHabPunto{from{transform:scale(.9)}to{transform:scale(1.12)}}`;
    document.head.append(s);
  };
  const pintar = S => {
    const h = S.playerHero, A = ARBOL[h];
    if (!win || !A) return;
    const t = del(S, h), act = hab(S).activa[h];
    const pts = puntos(S, h);
    const pr = practica(S);
    win.classList.toggle('practica', pr);
    win.querySelector('.hb-cab').innerHTML = pr ? `<span>${A.nombre} · <b>práctica</b></span><span>Elegí lo que quieras: sin puntos ni candados</span>`
      : `<span>${A.nombre} · nivel ${S.story.level}</span><span>Puntos para repartir: <b>${pts}</b></span>`;
    win.querySelector('.hb-cols').style.setProperty('--ramas', A.ramas.length);
    win.querySelector('.hb-cols').innerHTML = A.ramas.map((rama, ri) => {
      const g = gastados(S, h, rama.id);
      return `<div class="hb-rama"><div class="hb-tit">${rama.nombre}<small>(${g})</small></div>` + rama.nodos.map((n, ni) => {
        const r = t[n.id] || 0, abierto = abiertoN(S, h, rama, n);
        const pips = Array.from({ length: n.max }, (_, k) => k < r ? '●' : '<span class="v">○</span>').join('');
        return `<div class="hb-nodo${abierto ? '' : ' cerrado'}${sel.r === ri && sel.i === ni ? ' sel' : ''}" data-r="${ri}" data-i="${ni}">` +
          `<div class="hb-ic"><img src="${icono(n.ic, rama.color)}" alt="">${abierto ? '' : `<span class="hb-cand">${n.req}</span>`}${n.tipo === 'a' && act === n.id && r ? '<span class="hb-r">R</span>' : ''}</div>` +
          `<div class="hb-txt"><div class="hb-n">${n.n}${n.tipo === 'a' ? '<i>NUEVA</i>' : ''}</div><div class="hb-pips">${pips}</div></div></div>`;
      }).join('') + '</div>';
    }).join('');
    const rama = A.ramas[sel.r], n = rama && rama.nodos[sel.i];
    if (n) {
      const r = t[n.id] || 0, abierto = abiertoN(S, h, rama, n);
      let txt = `<b>${n.n}</b> — ${n.d(Math.max(1, r))}`;
      if (r < n.max && r > 0) txt += `<br>Siguiente rango: ${n.d(r + 1)}`;
      if (!abierto) txt += `<br>Se abre con ${n.req} punto${n.req > 1 ? 's' : ''} en ${rama.nombre}.`;
      win.querySelector('.hb-desc').innerHTML = txt;
      const bt = win.querySelector('.hb-subir');
      bt.disabled = !puede(S, h, rama, n);
      bt.textContent = r >= n.max ? 'Completo' : pr ? 'Subir (Enter)' : !abierto ? 'Cerrado' : pts ? 'Aprender (Enter)' : 'Sin puntos';
      const bb = win.querySelector('.hb-bajar'), bl = win.querySelector('.hb-llena');
      bb.style.display = bl.style.display = pr ? '' : 'none';
      bb.disabled = !r;
      bl.textContent = `Rama completa: ${rama.nombre}`;
      bl.disabled = rama.nodos.every(x => (t[x.id] || 0) >= x.max);
      const be = win.querySelector('.hb-equipar');
      be.style.display = n.tipo === 'a' && r && act !== n.id ? '' : 'none';
    }
    const rb = win.querySelector('.hb-reset');
    if (pr) { rb.textContent = 'Vaciar todo'; rb.disabled = gastados(S, h) === 0; }
    else {
      const costo = 25 * S.story.level;
      rb.textContent = `Devolver puntos (${costo} ◉)`;
      rb.disabled = gastados(S, h) === 0 || (S.story.coins || 0) < costo;
    }
    win.querySelector('.hb-ayuda').textContent = pr ? 'Flechas: elegir · Enter: subir · Retroceso: quitar · Las habilidades NUEVAS se usan con R'
      : 'Flechas: elegir · Enter: aprender · Las habilidades NUEVAS se usan con R';
    win.querySelectorAll('.hb-nodo').forEach(el => { el.onclick = () => { sel = { r: +el.dataset.r, i: +el.dataset.i }; pintar(S); }; el.ondblclick = () => { aprender(S); }; });
  };
  const sonarAprender = () => { try { sfx.fx('ck_habilidad', 0.7) || sfx.fx('level_up', 0.5, { rate: 1.3 }); } catch (e) {} };
  const quitar = S => { const n = ARBOL[S.playerHero].ramas[sel.r].nodos[sel.i]; if (bajar(S, S.playerHero, n.id)) { try { sfx.fx('ui_click', 0.5, { rate: 0.8 }); } catch (e) {} pintar(S); pintarRanura(S); } };
  const aprender = S => {
    const h = S.playerHero, A = ARBOL[h], n = A.ramas[sel.r].nodos[sel.i];
    if (subir(S, h, n.id)) {
      try { sfx.fx('ck_habilidad', 0.7) || sfx.fx('level_up', 0.5, { rate: 1.3 }); } catch (e) {}
      pintar(S); avisoPuntos(S); pintarRanura(S);
    }
  };
  P.toggleHabilidades = function () {
    if (this._overlay === 'ck-habilidades') { this.closeOverlay(); return; }
    if (!ARBOL[this.playerHero] || !(this._gameMode === 'campaign' ? this.story : practica(this) && this.gameStarted)) return;
    css();
    const host = document.getElementById('game-wrapper') || document.body;
    if (!win) {
      win = document.createElement('div'); win.id = 'ck-habilidades';
      win.innerHTML = '<div class="ck-win"><h3>Habilidades</h3><div class="hb-cab"></div><div class="hb-cols"></div><div class="hb-desc"></div>' +
        '<div class="hb-bot"><button class="ck2-piedra hb-subir">Aprender</button><button class="ck2-piedra hb-bajar">Quitar uno</button><button class="ck2-piedra hb-equipar">Poner en R</button><button class="ck2-piedra hb-llena">Rama completa</button><button class="ck2-piedra hb-reset">Devolver puntos</button><button class="ck-close">Cerrar (H / Esc)</button></div>' +
        '<div class="hb-ayuda">Flechas: elegir · Enter: aprender · Las habilidades NUEVAS se usan con R</div></div>';
      host.appendChild(win);
    }
    if (win.parentElement !== (document.fullscreenElement || host)) (document.fullscreenElement || host).appendChild(win);
    if (practica(this)) {   // openOverlay es sólo de la campaña: en la práctica se pausa igual, a mano
      if (this._overlay || this.isDead || this.isGamePaused || this.studioOn) return;
      this._overlay = 'ck-habilidades'; this.isGamePaused = true; this.physics.world.pause(); this.player.setVelocity(0, 0); win.classList.add('on');
    } else if (!this.openOverlay('ck-habilidades')) return;
    const S = this;
    win.querySelector('.ck-close').onclick = () => S.closeOverlay();
    win.querySelector('.hb-subir').onclick = () => aprender(S);
    win.querySelector('.hb-equipar').onclick = () => { const n = ARBOL[S.playerHero].ramas[sel.r].nodos[sel.i]; hab(S).activa[S.playerHero] = n.id; guardar(S); pintar(S); pintarRanura(S); };
    win.querySelector('.hb-bajar').onclick = () => quitar(S);
    win.querySelector('.hb-llena').onclick = () => { if (llenarRama(S, S.playerHero, sel.r)) { sonarAprender(); pintar(S); pintarRanura(S); } };
    win.querySelector('.hb-reset').onclick = () => {
      if (practica(S)) { vaciar(S); pintar(S); pintarRanura(S); return; }
      const costo = 25 * S.story.level; if ((S.story.coins || 0) < costo) return;
      const t = del(S, S.playerHero);
      if (t.corazon) { S.story.maxHealth = Math.max(3, S.story.maxHealth - 1); S.maxHealth = S.story.maxHealth; S.health = Math.min(S.health, S.maxHealth); S.updateHUD && S.updateHUD(); }
      hab(S)[S.playerHero] = {}; hab(S).activa[S.playerHero] = null; S.story.coins -= costo;
      aplicar(S); S.saveStory && S.saveStory(); S.updateObjective && S.updateObjective(); pintar(S); avisoPuntos(S);
    };
    sel = sel.r < 3 ? sel : { r: 0, i: 0 };
    pintar(this);
    try { sfx.fx('book_open', 0.5); } catch (e) {}
  };
  // teclado dentro de la ventana
  window.addEventListener('keydown', e => {
    const S = window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(x => x.startCampaign));
    if (!S || S._overlay !== 'ck-habilidades') return;
    const A = ARBOL[S.playerHero]; if (!A) return;
    const k = e.key;
    let mov = true;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') sel.r = (sel.r + 2) % 3;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') sel.r = (sel.r + 1) % 3;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') sel.i = Math.max(0, sel.i - 1);
    else if (k === 'ArrowDown' || k === 's' || k === 'S') sel.i = sel.i + 1;
    else if (k === 'Enter' || k === ' ') { aprender(S); mov = false; }
    else if ((k === 'Backspace' || k === 'Delete') && practica(S)) { quitar(S); mov = false; }
    else if (k === 'Escape' && practica(S)) { S.closeOverlay(); }
    else if (k === 'h' || k === 'H') { S.closeOverlay(); }
    else return;
    sel.i = Math.min(sel.i, A.ramas[sel.r].nodos.length - 1);
    e.preventDefault(); e.stopImmediatePropagation();
    if (mov) { try { sfx.fx('ui_hover', 0.35, { minGap: 40 }); } catch (er) {} }
    pintar(S);
  }, true);

  // ================================================================== ranura R en la barra y aviso de puntos
  let ran = null;
  const pintarRanura = S => {
    if (!S || !(S.story || practica(S))) return;
    css();
    const host = document.getElementById('game-wrapper') || document.body;
    if (!ran) { ran = document.createElement('div'); ran.id = 'ck-hab-r'; ran.innerHTML = '<img alt=""><span class="cd"></span><b>R</b>'; }
    if (ran.parentElement !== host) host.appendChild(ran);
    const q = document.getElementById('ck-quick'), h = S.playerHero, A = ARBOL[h];
    const id = A && hab(S).activa[h], x = id && nodo(h, id);
    ran.classList.toggle('on', !!A && (practica(S) ? !!S.gameStarted && !S.isDead : !!(q && q.classList.contains('on')) && S._gameMode === 'campaign'));
    ran.classList.toggle('suelta', practica(S));
    ran.classList.toggle('vacio', !x || !rg(S, id));
    ran.querySelector('img').src = x ? icono(x.n.ic, x.rama.color) : icono('estocada', '#7d6650');
    const cd = id && S._ckCd && S._ckCd[id] ? Math.max(0, (S._ckCd[id] - S.time.now) / ACTIVAS[id].cd) : 0;
    ran.querySelector('.cd').style.setProperty('--cd', cd.toFixed(3));
    ran.title = x ? x.n.n : 'Sin habilidad nueva';
  };
  const avisoPuntos = S => {
    const ant = document.getElementById('ck-hab-aviso');
    const pts = ARBOL[S.playerHero] && S._gameMode === 'campaign' ? puntos(S, S.playerHero) : 0;
    // el puntito naranja va sobre el botón de menú del HUD
    const btn = document.querySelector('.btn-hud-menu') || document.getElementById('btn-hud-menu');
    if (btn) {
      let b = btn.querySelector('.ck-hab-punto');
      if (pts > 0) { if (!b) { b = document.createElement('span'); b.className = 'ck-hab-punto'; btn.style.position = btn.style.position || 'relative'; btn.appendChild(b); } b.textContent = pts; b.title = 'Puntos de habilidad: H'; }
      else if (b) b.remove();
    }
    if (ant) ant.remove();
  };
  P.ckAvisoPuntos = function () { avisoPuntos(this); };

  // ================================================================== enganches con el juego
  const g0 = P.gainXP;
  P.gainXP = function () {
    const nv = this.story && this.story.level;
    const r = g0.apply(this, arguments);
    try {
      if (this.story && this.story.level !== nv) {
        this.maxStamina = this.ckStaminaMax(); this.stamina = this.maxStamina; this.updateStaminaBar && this.updateStaminaBar();   // (antes, subir de nivel borraba el tónico)
        avisoPuntos(this);
        if (window.CK_SIN_CARTELES_API) this.time.delayedCall(1200, () => window.CK_SIN_CARTELES_API.nota('Nuevo punto de habilidad: apretá H'));
      }
    } catch (e) {}
    return r;
  };
  const b0 = P.buyItem;
  P.buyItem = function (id) { const r = b0.apply(this, arguments); try { if (id === 'tonic') { this.maxStamina = this.ckStaminaMax(); this.updateStaminaBar && this.updateStaminaBar(); } } catch (e) {} return r; };
  const i0 = P.initExtras;
  P.initExtras = function () {
    const r = i0.apply(this, arguments);
    try {
      hab(this); this._ckBase = null; aplicar(this); avisoPuntos(this);
      this.stamina = this.maxStamina;
      if (!this._ckHabKeys) {
        this._ckHabKeys = true;
        const K = Phaser.Input.Keyboard.KeyCodes;
        this.input.keyboard.addKey(K.H).on('down', () => { if (this._overlay && this._overlay !== 'ck-habilidades') return; this.toggleHabilidades(); });
        this.input.keyboard.addKey(K.R).on('down', () => this.ckHabilidadR());
      }
    } catch (e) { console.warn('[habilidades]', e); }
    return r;
  };
  const sw0 = P.switchHero;
  P.switchHero = function () {
    if (this._ckBase) { Object.assign(this, { staminaRegenRate: this._ckBase.regen, dashCooldown: this._ckBase.dashCd, spinCooldown: this._ckBase.spinCd, spinStaminaCost: this._ckBase.spinCost, dashStaminaCost: this._ckBase.dashCost, playerSpeed: this._ckBase.walk, playerRunSpeed: this._ckBase.run }); }
    const r = sw0.apply(this, arguments);
    try { this._ckBase = null; aplicar(this); avisoPuntos(this); } catch (e) {}
    return r;
  };
  const e0 = P.endExtras;
  P.endExtras = function () { const r = e0.apply(this, arguments); if (ran) ran.classList.remove('on'); try { this._ckBase && aplicar(this); } catch (e) {} return r; };

  // botón "Habilidades" en la pausa
  const botonPausa = () => {
    const acc = document.querySelector('#pause-modal .pause-actions');
    if (!acc || document.getElementById('btn-pause-habilidades')) return;
    const b = document.createElement('button');
    b.id = 'btn-pause-habilidades'; b.className = 'dev-btn';
    b.innerHTML = '<span>HABILIDADES (H)</span>';
    b.onclick = () => {
      const S = window.activeGameScene || (window.game && game.scene && game.scene.scenes.find(x => x.startCampaign));
      const res = document.getElementById('btn-pause-resume');
      if (res) res.click();
      if (S) setTimeout(() => S.toggleHabilidades(), 60);
    };
    const op = document.getElementById('btn-pause-options');
    acc.insertBefore(b, op || null);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', botonPausa); else botonPausa();

  // práctica: el árbol libre también vale acá (H para abrirlo, R para la habilidad nueva)
  const teclas = S => {
    if (S._ckHabKeys) return;
    S._ckHabKeys = true;
    const K = Phaser.Input.Keyboard.KeyCodes;
    S.input.keyboard.addKey(K.H).on('down', () => { if (S._overlay && S._overlay !== 'ck-habilidades') return; S.toggleHabilidades(); });
    S.input.keyboard.addKey(K.R).on('down', () => S.ckHabilidadR());
  };
  const sp0 = P.startPractice;
  if (sp0)
    P.startPractice = function () {
      const r = sp0.apply(this, arguments);
      try {
        teclas(this); this._ckBase = null; this.maxHealth = 3; aplicar(this); this.stamina = this.maxStamina; this.updateStaminaBar && this.updateStaminaBar(); pintarRanura(this);
        if (window.CK_SIN_CARTELES_API) this.time.delayedCall(1500, () => window.CK_SIN_CARTELES_API.nota('Práctica: H abre el árbol de habilidades para probar las ramas que quieras'));
      } catch (e) { console.warn('[habilidades]', e); }
      return r;
    };

  window.CK_HABILIDADES = { ARBOL, ACTIVAS, HACER, rg, puntos, gastados, subir, aplicar, icono, activo, practica, bajar, llenarRama, vaciar,
    hab, nodo, guardar, texturas, disparo, explosion, brasas, dirV, rotarDir, pintar: S => pintar(S), pintarRanura: S => pintarRanura(S) };
})();
