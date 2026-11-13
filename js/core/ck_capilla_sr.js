'use strict';
/* La capilla de San Roque por dentro (12/11, pedido del dueño: "la capilla", con las tres capas de Nano Banana Pro).
   (v2, "esta es la capilla, reemplazala y quitá la anterior"): mapa del Taller capilla_san_roque (480×268, piezas ed_csr2_*),
   nave larga de izquierda a derecha con tres vitrales, el altar con la estatua de San Roque en el ábside de la izquierda, ocho
   bancos, macetas, la pila de agua bendita, el atril y la cuerda de la campana. La entrada es por la derecha, bajo el
   campanario, que por fuera da a la plaza.
   - En San Roque, T al costado este de la capilla (392,394) entra; el pasillo de la derecha vuelve ahí.
   - El cartel de afuera ("chiquita y bien cuidada") pasa a las tumbas del costado.
   - Adentro: el padre Eusebio junto al altar, la luz de las velas y del rosetón, carteles, minimapa, pantalla de carga.
   Va DESPUÉS de ck_san_roque.js. Borrar su línea de index.html cierra la capilla (el mapa queda sin uso). */
window.CK_CAPILLA_SR_MINI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAABDCAMAAABgBzGOAAAAwFBMVEXt06XjxpzewZnXvpnUupbRtZDKtJXGr5LCq43ApIS3poy2oYayoYmwnYevm4Orm4e0k3iqloCnloKnkHqjk4GhkX+gj32gi3ibjoCajH6Zi32ZinyZh3eViHyUhXmPhnyoe2OVfGmQgniQdGGMgniMgHeMfHKMcF2IfneIfXSHenOFe3SAe3WDdm6FbmB9cWtybWWHYk57XU5yX1hyVEdmWVNjTkdYRkFKQD0oIyICBAMBAgMAAgEBAQEAAQIAAAHn1/6NAAASEUlEQVR42q1ZaWOiwLZ0jci+L7IJAoLIoqBxJpnM//9Xt05jlnnvfrydxJAWu7rqrE1mH3/e3z+e4+3t7fffv2+/fz0er/fXx+P+OcbnuP8c/23mer1+z72+Pl7/GY/H4/fH2wQ1A+77N+zbX6C+fi91G6fVru3xeLxcv8flcjkeDjR5+THXHg/HlmamPQELL/fbj50A+I1hzf58MX77+E2wdMfQd8VwHwrbsyRe5DebzQpj87LhMHgeL5uX1XKxWK7WL9MMvjcbDpO46wV/iZZtF7d770dDISqSZPm+191fPxn/CwxcaEN4uq77bRQVgc7Tii8vq/V2C+iXlw3D5rCRxZLjVvPlms3w0xzuWuMmthklKKKoiZQ24ERR5EUvSf3uB/D7U2oy7y9o09qioiuKpLdBUFjABV/CTfZb0FmB9IYJsFhunf12MQdFIPPY3Mtyye2T7XK5YsrwZhEEjb05BOCPLyVKzYZJ/TYxnoCfuPdUgi5AnoAlTqQll6vt/gBkaLsGACmwmG+TZL/fzufTXl42q8UCdx2S7WpB9/CcmDpBY3IHB6j0badWOwG//QD+gFs9HoMuyrqiA1qUGydISWgovdg6B1U9OOs5IXMctjJff01B7A1NLdhUsudg+Q3E55PAbnQejEVRArBZ2MT448n4/an1G+x7MxVJVpjSklw4QcSRgVfzlXrYG/v9QV3MF2TCl/ViAQR1v08wxSy/Ws4XuAvjaOADUIDng8AoREi94SUwkABcPH7//fhhY4w3CH13FN0EqKhLeC3MICCnATsOqCSssX4CgzCmHIdNkeFJ+9XzLoeDt5NnR4Ge8gDmSGqsWpg/gf+8fzBcEC503QSmpCuiooiFDWBYD0uutf3W0LZ7YzNbLJew8HwGlK1sYIpZmbYyw15UFVMOpuByHBc4dgFgB+ShNq8w5/oBTFKD8ONm6zbMK0tkY0lMdDuA22BJSL2fq9v53lnPiAxNLZ39TFVn+wM3m1OcTcDzrTrf77k5U4ELbL3gOQIWKTqUSPlX6o+J8KMwQVhWIDOQJamQDAJeEfBWfTHUl70K4BVz6flSVV/Y93oG+VfIJrO1uqe7VObq0JoLDKkQeZKatBaVQiLgt48/DPiDMggRvvu2IiuyRnwVTeQLUXNgOwDPECdL11wSMEScptT9wjQXmJoDeIndzRBzK8teshjD/jYbRxOfUnPEGLsg4D9/P3P1E7h1bNOGxLKEzcmimAqGM3kNoXCKtd2rKwL+nNrKyna/f+6FgDFlKhyTmiURxxC/bEyUI6n4fzaGawW2bGiSTDGHqBOFRDAMAC+hKxivAcEYL9YvhALgNX2r38Draeof4JQBcxNwQMDfufrp04Ntyhpci6FKCLyE14wXKgUktbpOggllsWa6zpGVsZctSb1ck9Vn9Af8T52kRjKzZSHgN4lDCZTcK/iH8dvH+x+mtKFptiayQVFHwA5LSFhGMNZhvHZkAENpknouqGvPXcsstNerNabWuMs110YwAXOcLfOJwCUOZTEQFguZAX/majgXZY+DoxmaDKUFiTk/n8gOGFMYA1iFNbeGQF69ZkE7BzFMqQaTmigTY0yp6jOzwrkMKeG5o8PoArmwGubVE+MPuDUBOwIoywIRlli8B5ggqZEt5hxLholMutIcszEbk9Trp1fToPw9X1AaNQwpIuApfyCT6cWP6sRaH/iWwBmyxm4hqVEcAmGy8Woxo5LPqv4ETJkLHNlYc/NnaNPUdNd2An7RNDEVOSqLDFhkCeTt929qdX4zqQF8X89VWZ4Y87zApNY0khpG3mzXHLelb5YeCQbX2y1Nbeck/iT1eo370Awwr+Y4g+KYTxKeVUVJDBSS+jk+gYfFjNtQME32+LIx5aQ5G6hMGIwwZbPFYvphkc2AZzP8gQl6WULpjeNIEacdLtK0ohjpzeNrsAQC4HYJqVBSnsjk/LJmUGe1ZMi0HGApfTyDe0JgQrPbCHkauJGceoO0EPDasVVYQRalVCm++0hi/Of996OBVEgELNRZ6yYnsmFQQ8Nh6YVCSAvW+iQCcQbZ5X41m6aQxbE9pgylc9y42RoqCpqUips24kQUPFeXC724DbdhGj+B6QMCoQq8rhkA1rZmWRyERezyUG9JFXFpjNJqyivqlcMkav6KH/erNUHPlheV+K42TmdsA0MIpE0b8FJ8xtARTrlpos/Ai8KA/z6BWRuD0m8EXdq0spEErpuFvYBPyVtBEGQ1SS6jYxiaIKjG4aJuVcw5STvuZQOeqar7i4EbkbH6vgsSR24is0HjUbpxfD41dpMqum5R2f8CLp4RsoRfcol1zvpBMK5t5TbdcOj7W0vN+/GCNn28TM39ZbzgN5p6Nnc8Ppv7Q4KvQ4uPDIMjfCoLyrf7YBYRehzX/GL8MQFPJY9zjtdsh88lydAORTtc22vbtgf6GS6Hyzjgqh2Oe2DTVXvFfnAH0C77A84XwD1eGVySfFq0v5F128GDzGjplCcwbFygwaGKvt4axwstPQyHtoiux+M1sdvjJbAjf+d2F8A1cRSFzXFP70TRrrjS2SYNfD+67PeXg2nbjk3nmKEBYFk3dVU1t9utOwPdVibYbxsXC2K85FT0a0EAMYfC9ywlOR5bW08PqaaZsm6nRKbZ+bYdHLCFRLNt0yOQi+c4tp4QsKYZhpW2l1sXlXWZd11X581to5hhf+4ttDcktPntXEggiwXaSQNeogdga1uOvt3KtqVhkGexeQAXlmEYzoEYayY2BNOOV9/BHhiwhGJj22EUhmmaVfm5qfOsa1642eFW9pY08RW/gZcrYbNJ2kDUZOzJsk0r2CfCVtYsXZNRPQCsawHBtb5tEfBlTEzH0PyWgFMHAqOUXI5gbAdeBHOkVVWXZZk3dX8f2+IOxrYiKvq/UnMyx6lt0wQSCAaBnyTHS6Kp0D0KjK3MKAs2AzZtQzaIO64s3Wfn0sA2LBtzDNhA2wifiLKsLLMsq+uyGV7vfX3ufEDiRPgTOJA36gGfDARFQndtHtfCeOCOiSkrvENBTEOGU99bhYDhdSMBmy4Ij6MP7tqB/FuAfWQUGNNyvTArc4Yed48+Ls89AUuS+VNqQxCOiXM4GIIk4PgkyjNtHHEQEXhTseUJlzcux+u9lSxTdgiu1cHYu16u99FHEyFToF9RtAQCJoO5YRiXAM6z5hXANQGjlfwpdSsIyTWAXwjwJN3yzZcZ93pXZ5zM66aFVcnQYjJeR+SBKPUSOvMPOH1bER3+R3iZrOHZwXhFAjNs3bK90At3uzAsy3Nd18PrkNXnPni61g+pZfna2QLHUVE2ZNt4mcmXqzHjZd63fROzEvqihKpLq2iGVdCThVbGEd6mZx6jRoxpC9dJadt3Pde33F1ohVC7wzt9VvaBThZGEtG/pNacITdR1ykpY/PacnbZjxcCtr0oACEA68W9qe+9aVkAbqo7pDZN/95ltxsLunsXDQOJo5teunNdz/N2oUucS+StLquHtimKpum6pvm28XGIbPJcDPiJwYAPM86QtCjzTUkWNEnXXdht5wLY8jwY0bZ818KcBx6WpltIhyCE35bLRuh5IcSGlbsa/n2+jcihlD1vty/gZOx85Amek8BYwyFipu7HPWMcpaHErAwXdkMwiUIv9bGiT+uSB+1c0w4Q3tiIj3s8d0dcs5i+wjir4zqDl53P/fCsGj+A21sT2ZBTkCQm9Qu6xtVsxuuiFQX2FEye5VphityAX8TJwsvOAkFUHF0zPYMSj+l+DvB1Q9pGGcZQHRENzc9neinLL+Bh6CIbQQBs2TENWZjxG7Qx6PGRCgxSQXNCyyPG3o4taJkgb/mh61lWZFmmjRRuR2QEgO2ewLhx5+ZZHlFgoWJQTCOhZPEncD/0lY1TKjXXtmYF+mFpOLPZ9qjIdhrZZHvZDHXPjQAM5p4Xubsd1t7t/Mj1U2D6sLwJwW2UMR+4Oy+OyQxxmKenEIEVZQjlGi/oCrLZG/Xz6DJvXe66pkaNhGzolnK5HpbL43jgFT+NHPI6Tdm5OzP0QAfWtYiT6/k7fMOZSHmPEiWqPAjgTnx5IalDXJsYHwoJuATpOP5mfLvVdZVHNkWsGeFRSItHXsPj0Ymmm+eaANdC5GBrrr/bYTUi5U0BQwLgD7xYFqQ29cCzIwqjp4VBNktDSB4SoBtT+s4yBvwHwEOHQgJfhad6fhQp6fTY9ISsmKY4SCLvWyDgppcmzMMdXCy9Fi4WhPrhpcVucljdQSNgBSZZH0Bpuov8MA2j2IXld3me1dWuzMA8Lklqan3u8PFzBxHwzNGLUldEarrd7mMh6lEVIpfamq6Tt7RjANK4MNsxgd4UXsV4NPEpHxV5PHheYNvIWl5MMZx64BLHlD5hYmwihNpdfT7P6CSD1ue1h5X7U5ziE26UWnrapAjAPlJMvzpVSPg+skJ0bMdr4CKkiuNxBGPf3cXtcbwfLQ+tT4uKlZh+5NkA9GISOs5C18+IZU7hVGNNanW7ngHjaSK8q7/15wztQl7nKVKVyLoyF71o2uS2ZxPJ04hClIbxzm1ghmuBq11KD4hb7MUrqFocdhFqAwjCneFPIEtOBa5VhkCCjPQFLWdvn8CE3KGOlHmee2m2C5FtwrCuEHtVkeZkVOT6IzV7oR82eDp9bcMTIgVX41DnoXeitq/Fu7u4jnOgZXWWx9k5Iy5RnuZx//j1OWZveBJBz0/7ATXtVKF2RmGRZj1G19FL38dFhDYEwFFxwdLFDo5dXAjYo+1cCJh8I2JzLpovt0ox0IFE+IVsmcKtIwb8fVokxmTkWzdeh4qAs6go4JYxC1TY0NSrNAow0jSgTr5h/RQD2eVY/sB6rnAXhMcnsJ+fGHBeRux3FOV5RMADOx//ppcv4HvdDV1V102V56f+xxi6pqf106iqIlq6Qe+YNsS9z05ZnFOXOWS0PAMmc9bNCRzypknTHN0P/Z3maP2G52PjP/Tw5Z2M/P4L9RX57Hyuqvx0opLZNafTqeoqei0o1QI9o6W7rEmjhhj3cQpPY8DwjKqkd4dzXp0a/JGXJ3hLCJ8BYl5WeXOqbxMwQU6MychEtzrXRLhI4U11DLSo8HZIwwGsGqYQmwHHp1N0Isv2ETEiqW8ALkpqdIdTURTMxBX0zlLaUZVntGyeD/Tw5Z2RpsdN75OR0YZW6PrhfXla5MUJwe5HqY2ygYZVs5zA8UnMyxAXp5yArwP2WNSsvYUceU3vXpu8KJiJsQx7KQCKkZ7yjID/sEeZz+fVeBADyogl0jfHLivo5HvUytnU0zgOfuBeAL6ON8BVHXWZtxoswBMdIIzadOyqPxWQOq+yit7MyooMV1YNSDWQ+i89tX37flBOlHOYuD6XaXwu4ijLfR9l3Z8qIvVyGhRH/3q/xTgiwMa4ypAVqhZX96Y5NbQZXFWAOp1rQFK7gxhuwAhOWzVP53pnwB9Pyn9/3bu8OZcViuUZmSNKAwdJ19aF7XSKoDPM1N5Sr9zQ1a0CXof4v99xJMzZ3L0u4Y4ALikZATjK6BiTQ++KwuljggPjjy/Kd4hNKfzWx4jbfmgL3TFNeUstOmt9ZOqmAYyy092BcctQcBr2LKWuiny6omA4EWgNcErQGeHDtdKKEsj7O3tOTcB/Pv8p8UDzem46ZNLbqQnOiF/bbUoTkDgb0OnATlDEXocYTtC/DvhXXJxlaYO5+/10IuAbrmBKCsaOXgmeTm7ISzUOqyQ12Zh59QT7fKAJUzUNtZ+n/ux2FcJluOEZGcGSoU0d/noiT82rJoYNyYQwXVljOiei5anrTjicNXCWhiX+iu7JS0Iuy4EYM6W/gD//EdNXFZL2cAoGC9RtHOJ7ElmYKKPkBbYfxTSyPEUrkyGQYT+snZMXY9TPASwQZe0G2ZjuSgn4bRqQ+uMJzNR+vTX9OPYVzhzXcTDboR90jZ1P0LIH8Djb81Hf4hjVOmaFPab2EXmKZaoyp0aS+RWJXFVsT2e6ARki/8n4/ceY/ol7G3rYZzge713Y4QGLh8KEJxxIBgWAfeag6IypdMdlDvSMUIgxmZQs3DQUl2Q2+rM5N7QTHN0aBvzx/vF/gYH8/P/xDcVh6E8dXpu0gN+QrzY4+BQF5Zii66cTEBt9x8DYTEe1tHsOdsXe7aZ3mdQfLJAImF19/ID+9fgxXh//yzH9T+L9/e0/Nafaqq6uTxgAAAAASUVORK5CYII=';
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined' || !window.CK_SAN_ROQUE) return;
  const D = window.EDITOR_DATA || {}, CAP = 'capilla_san_roque';
  if (!D.mapas || !D.mapas[CAP] || !INTERIOR_LAYOUTS['ed_' + CAP]) return;
  const SR = window.CK_SAN_ROQUE, ID = SR.ID, Z = SR.Z, ZC = 'ed_' + CAP + '.main';
  const P = MainGameScene.prototype;
  const PUERTA = { x: 392, y: 394 }, LLEGA = { x: 444, y: 180 };
  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const enPuerta = S => {
    if (!S.currentZoneKey || S.currentZoneKey() !== Z || !S.currentInterior || !S.currentInterior.area || !S.player) return false;
    const a = S.currentInterior.area, p = pies(S);
    return Math.hypot(p.x - (a.x + PUERTA.x), p.y - (a.y + PUERTA.y)) < 28;
  };

  // ------------------------------------------------------------------ entrar (T al costado este) y salir (el pasillo de la derecha)
  const i0 = P.interact;
  P.interact = function () {
    try {
      if (!this._overlay && !this.dialogOpen && this._gameMode === 'campaign' && enPuerta(this)) {
        if (!this._doorTransition && this.ckEntrar) this.ckEntrar(CAP, LLEGA);
        return;
      }
    } catch (e) { console.warn('[capilla san roque]', e); }
    return i0.apply(this, arguments);
  };
  const sw0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    if (nombre === 'sr_capilla_salir' && this._gameMode === 'campaign') {
      if (!this._doorTransition && this.ckEntrar) this.ckEntrar(ID, { x: PUERTA.x + 12, y: PUERTA.y });
      return;
    }
    return sw0.apply(this, arguments);
  };
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      if (!this.currentZoneKey || this.currentZoneKey() !== Z) { if (this._ckCsrCartel) this._ckCsrCartel = false; return r; }
      const pr = document.getElementById('ck-prompt');
      const txt = this.dialogOpen ? '' : enPuerta(this) ? 'T · Entrar a la capilla' : '';
      if (pr && txt && (!pr.classList.contains('on') || this._ckCsrCartel)) { pr.textContent = txt; pr.classList.add('on'); this._ckCsrCartel = true; }
      else if (pr && !txt && this._ckCsrCartel) { this._ckCsrCartel = false; if (pr.textContent === 'T · Entrar a la capilla') pr.classList.remove('on'); }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ San Roque: el cartel de afuera, a las tumbas
  const LS = INTERIOR_LAYOUTS['ed_' + ID];
  if (LS) INTERIOR_LAYOUTS['ed_' + ID] = function (kit) {
    const r = LS.apply(this, arguments), a = kit.areas && kit.areas.main;
    try { (a && a.talkers || []).forEach(t => { if (/^La capilla de San Roque/.test((t.lines && t.lines[0]) || '')) { t.x = 210; t.y = 468; t.r = 36; } }); } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ adentro
  const LC = INTERIOR_LAYOUTS['ed_' + CAP];
  INTERIOR_LAYOUTS['ed_' + CAP] = function (kit) {
    const r = LC.apply(this, arguments), a = kit.areas && kit.areas.main;
    if (a) {
      ['talkers', 'exits', 'actors', 'fx'].forEach(k => (a[k] = a[k] || []));
      a.ambient = [['amb_fire', 0.08]];
      a.exits.push({ x: 466, y: 150, w: 14, h: 48, key: 'walk', to: 'sr_capilla_salir', hint: '▶ Salir' });
      a.actors.push({ type: 'walker', key: 'g_priest_idle', idle: 'g_priest_idle', walk: 'g_priest_walk', scale: 1.25, ox: 0.5, oy: 0.61, speed: 18,
        pts: [[166, 190, 1e12]], lines: ['Padre Eusebio: Bienvenido a la casa de San Roque, el patrono de los peregrinos y de los enfermos.',
          'Padre Eusebio: Dicen que en Brumavieja la peste levantó a los muertos. Acá rezamos para que la niebla no baje del norte.',
          'Padre Eusebio: El perro de la estatua le llevaba pan al santo cuando estaba enfermo. Por eso va siempre con él.'] });
      const habla = (x, y, lines, rr) => a.talkers.push({ x, y, r: rr || 18, lines });
      habla(116, 220, ['El altar, sobre su escalón: un mantel blanco, una vela y la estatua de San Roque con su perro'], 22);
      habla(392, 108, ['La cuerda de la campana. Mejor no tocarla: se oye en todo el valle'], 16);
      habla(415, 130, ['La pila de agua bendita y un libro de oraciones abierto en el atril'], 18);
      habla(100, 250, ['Macetas con violetas y margaritas. Las riegan todos los días'], 18);
      habla(250, 166, ['Ocho bancos de madera, gastados de tantas misas'], 18);
      a.fx.push({ type: 'dust', x: 60, y: 30, w: 380, h: 200 });
    }
    return r;
  };

  // ------------------------------------------------------------------ luz, minimapa, carga, profundidad
  const instalar = () => {
    if (instalar.ok) return; instalar.ok = true;
    try { window.CK_SALA_ED = Object.assign(window.CK_SALA_ED || {}, { ['ed_' + CAP]: 'casa' }); } catch (e) {}
    try { const C = window.CK_PANTALLA_CARGA; if (C && C.REGION) C.REGION.unshift([/^capilla_san_roque$/, 'San Roque del Molle']); } catch (e) {}
    try { if (window.CK_PROF_ENTEROS && !CK_PROF_ENTEROS.test('ed_csr_x')) window.CK_PROF_ENTEROS = new RegExp(CK_PROF_ENTEROS.source.replace(')_', '|csr)_')); } catch (e) {}
    if (window.CK_LUZ && CK_LUZ.fuente) CK_LUZ.fuente((S, out) => {
      if (!S.currentZoneKey || S.currentZoneKey() !== ZC || !S.currentInterior || !S.currentInterior.area) return;
      const a = S.currentInterior.area, t = (S.time && S.time.now) || 0;
      [[165, 40], [240, 40], [315, 40]].forEach(([x, y]) => out.push({ x: a.x + x, y: a.y + y, c: [255, 210, 140], r: 70, f: 0.45 }));
      out.push({ x: a.x + 36, y: a.y + 110, c: [255, 220, 160], r: 50, f: 0.35 });
      const f = 0.9 + 0.06 * Math.sin(t / 110) + 0.04 * Math.sin(t / 47);
      out.push({ x: a.x + 122, y: a.y + 124, c: [255, 190, 110], r: 36, f: 0.55 * f });
    });
    try {
      const MM = window.CK_MINIMAPA;
      if (MM && MM.Z) MM.Z[ZC] = { img: CAP, esc: 4, w: 480, h: 268, ext: 0, n: 'Capilla de San Roque', g: 'San Roque del Molle' };
      if (MM && MM.dibujo) MM.dibujo(CAP, window.CK_CAPILLA_SR_MINI);
    } catch (e) {}
  };
  document.addEventListener('DOMContentLoaded', instalar);
})();
