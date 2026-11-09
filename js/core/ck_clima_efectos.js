'use strict';
/* El clima y la luna se sienten en la pelea (08/11, pedido del dueño: "que la luna llena potencie a los lobos, que el
   invierno ralentice al personaje y enemigos y otros enemigos se vean beneficiados").
   Vale sólo afuera (adentro de casas y salas no llueve ni nieva). Cuando cambia, una nota chica avisa qué pasa.
   - LUNA LLENA (de noche, ver ck_dia_noche.js): hombres lobo y huargos un 20 % más rápidos, atacan más seguido (cd ×0,8)
     y los que aparecen esa noche tienen 30 % más de vida.
   - NIEVE (el invierno): el héroe camina un 15 % más lento y casi todas las bestias también; los limos, un 30 % (se
     hielan). Lobos, huargos y osos tienen pelaje: con nieve andan un 5 % MÁS rápido (juntando luna y nieve, nunca más de +25 %). A los esqueletos el frío no les hace
     nada.
   - LLUVIA: los limos están en su salsa: 30 % más rápidos y los que aparecen, con 50 % más de vida.
   - TORMENTA: lo de la lluvia para los limos, y además los murciélagos +20 % de velocidad y los esqueletos +15 % y
     atacan más seguido (cd ×0,9): la tormenta despierta a los muertos.
   Los números están en TABLA (abajo). Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const TOPE = 1.25;
  const LOBOS = /^(werewolf|warg)$/, PELAJE = /^(werewolf|warg|werebear|werebear_jefe)$/, HUESOS = /^(skeleton|skeleton_armored|skeleton_great|skeleton_archer)$/;
  // cada efecto: { vel, cd } multiplicadores por tipo de bestia; heroe: multiplicador de la velocidad del héroe
  const TABLA = {
    luna: { tipos: t => (LOBOS.test(t) ? { vel: 1.2, cd: 0.8, vida: 1.3 } : null), nota: 'Luna llena: los lobos andan más rápidos y más bravos' },
    nieve: {
      heroe: 0.85,
      tipos: t => (PELAJE.test(t) ? { vel: 1.05 } : HUESOS.test(t) ? null : t === 'slime' ? { vel: 0.7 } : { vel: 0.85 }),
      nota: 'Nieve: todos andan más lento… menos lobos y osos, que tienen pelaje'
    },
    lluvia: { tipos: t => (t === 'slime' ? { vel: 1.3, vida: 1.5 } : null), nota: 'Lluvia: los limos se ponen contentos (más rápidos y duros)' },
    tormenta: {
      tipos: t => (t === 'slime' ? { vel: 1.3, vida: 1.5 } : t === 'bat' ? { vel: 1.2 } : HUESOS.test(t) ? { vel: 1.15, cd: 0.9 } : null),
      nota: 'Tormenta: los muertos y los murciélagos se agitan'
    }
  };
  const afuera = S => (window.CK_AFUERA ? window.CK_AFUERA(S) : !S.currentInterior || S.currentInterior.area.outdoor);
  const clima = () => { try { return window.CK_CLIMA ? CK_CLIMA.actual() : 'despejado'; } catch (e) { return 'despejado'; } };
  /** los efectos que valen ahora (lista de claves de TABLA) */
  const activos = S => {
    if (!S || S._gameMode !== 'campaign' || !afuera(S)) return [];
    const l = [], c = clima();
    if (TABLA[c]) l.push(c);
    if (S.ckLunaLlena && S.ckLunaLlena()) l.push('luna');
    return l;
  };
  const para = (lista, tipo) => {
    const m = { vel: 1, cd: 1, vida: 1 };
    lista.forEach(k => { const x = TABLA[k].tipos(tipo); if (x) { m.vel *= x.vel || 1; m.cd *= x.cd || 1; m.vida *= x.vida || 1; } });
    m.vel = Math.min(TOPE, m.vel);   // luna llena y nieve juntas: como mucho +25 %
    return m;
  };
  const nota = t => { try { if (window.CK_SIN_CARTELES_API) CK_SIN_CARTELES_API.nota(t); } catch (e) {} };

  // ------------------------------------------------------------------ bestias: se ajusta por proporción (convive con
  // dificultad, roles y fases de jefe, que también multiplican def.speed y def.cd)
  const ajustar = (e, m) => {
    const a = e._ckClimaM || { vel: 1, cd: 1 };
    if (Math.abs(a.vel - m.vel) < 1e-3 && Math.abs(a.cd - m.cd) < 1e-3) return;
    e.def = Object.assign({}, e.def, { speed: (e.def.speed / a.vel) * m.vel, cd: Math.round((e.def.cd / a.cd) * m.cd) });
    e._ckClimaM = { vel: m.vel, cd: m.cd };
  };
  const se0 = P.spawnEnemy;
  P.spawnEnemy = function () {
    const e = se0.apply(this, arguments);
    try {
      if (e && e.def && !e.def.boss && this._gameMode === 'campaign') {
        const m = para(activos(this), e.type);
        if (m.vida > 1) { e.maxHp = e.hp = Math.round(e.maxHp * m.vida * 4) / 4; if (!e.hpBar && e.maxHp > 2) { e.hpBar = this.add.graphics().setDepth(26000); e.once('destroy', () => e.hpBar && e.hpBar.destroy()); } }
        ajustar(e, m);
      }
    } catch (er) {}
    return e;
  };

  // ------------------------------------------------------------------ cada medio segundo: ¿cambió algo?
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      if (this._gameMode !== 'campaign' || !this.enemies) return r;
      this._ckCeT = (this._ckCeT || 0) + (delta || 16);
      if (this._ckCeT < 500) return r;
      this._ckCeT = 0;
      const l = activos(this), k = l.join('+');
      if (k !== this._ckCeK) {
        // nota sólo de lo que empieza (y no al entrar a una sala)
        const antes = (this._ckCeK || '').split('+');
        if (this._ckCeK !== undefined) l.filter(x => !antes.includes(x)).forEach(x => nota(TABLA[x].nota));
        this._ckCeK = k;
      }
      this.enemies.getChildren().forEach(e => { if (e.active && e.def && !e.isDead && !e.def.boss) ajustar(e, para(l, e.type)); });
      const h = l.reduce((m, x) => m * (TABLA[x].heroe || 1), 1);
      this._ckClimaHeroe = h;
    } catch (e) { if (!P._ckCeAv) { P._ckCeAv = 1; console.warn('[clima_efectos]', e); } }
    return r;
  };
  // el héroe: se frena la velocidad que dejó el movimiento (no el dash ni los empujones)
  const mv0 = P.handlePlayerMovement;
  P.handlePlayerMovement = function () {
    const r = mv0.apply(this, arguments);
    const h = this._ckClimaHeroe;
    if (h && h !== 1 && this.player && this.player.body && !this.isDashing && !this.isSpinning && !this.isAttacking && !this._doorTransition && !this.dialogOpen) {
      const v = this.player.body.velocity;
      if (v.x || v.y) this.player.setVelocity(v.x * h, v.y * h);
    }
    return r;
  };

  window.CK_CLIMA_EFECTOS = { TABLA, activos: () => activos(window.activeGameScene), para };
})();
