'use strict';
/* Fantasmas chicos en las ruinas (12/11, pedido del dueño: "generá fantasmas en las ruinas, con PixelLab, de manera tiny, que
   aparezcan en interiores").
   - Arte de PixelLab (16×16, del tamaño y el trazo de la gente chica del juego; copia en trabajo\nuevos_flow\fantasmas\):
     seis aldeanos muertos por la peste: la aldeana del pañuelo, el nene con la muñeca, el viejo de capucha, el guardia con la
     lanza, el granjero del sombrero y la madre con el bebé. Se dibujan a 1,3 como la gente, medio transparentes.
   - ADENTRO (la casa de la peste, la capilla de Brumavieja y la casa quemada del Norte del Roble): cada tanto uno se asoma
     en un rincón, flota despacio de un lugar a otro y se pierde. De noche salen más seguido. Hasta 3 por visita.
   - AFUERA, sólo de noche: en Brumavieja (la aldea en ruinas) y en el Cementerio Real, cerca del héroe pero no encima.
   - Si te acercás, susurra algo (en cursiva, celeste) y se desvanece. No son enemigos: no pegan ni se les pega.
   - Brillan apenas (una luz fría de CK_LUZ) y suenan: ck_fantasma_aparece y ck_fantasma_susurro (ElevenLabs, en
     assets/audio/sfx/).
   Va después de ck_secretos.js. Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const ARTE = ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAByElEQVR4nGPkFZRhoASw4JLg07T6D2Mz8fMyfDixk5FoA/h1zP4fOrgczt969wVDVx7Df2yGMKJ7AaQ5ra8PYjo7A8PDdx8Zyu10wHwH7SCG9y/OMuJ1ASOPIIOgACsDDwcng700PwMDgyxczqCqlOH5lSv/b8xqgRvChG6AkLIKw5Wnb+BO94xIZzj49CPDtR8/GR6ePMyArBmrC97dvcOgIy3CIC3Aw1BaOZMhp7WR4cuP7wx1waUMRIUBCHArGf4/dnoDmL3k7GOG2XXNYM1cMjb/vz05gmIIEwMWwMzOydC88ijDna9/GdYuXM5QNqkJbCi6ZqwGsHCL/5+5ZwHDuaNHGWas2sNgZG3NoC4hyjDn8EqUtIHVAKXo7P9nH51imDR3A0NwfCSDiakWg6q2HEPXhJUM1pyc4ARF0AUrrjxmeHh4H4OsBB+DpCAfWEzZVo9BzyuFQdMznIFgILJJyfxffuIQnP/0wxeGQ0euMGzv6Wa4fmYTg0VMJcOzbUvgYYFhACiw/HtbGOSFQImIgYGXkxVMg8IhN6OOQdvJjkFeSJRhTlIg2BCs0QgKC3ZeLhSxn5+/MYiKyzCc7KtEiQmsBpACAMTQlOiQmZfDAAAAAElFTkSuQmCC","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABiUlEQVR4nGPkFZRhoAQwUaSbGgaw4JIQsHD/z8DEzcDw7yuY/+HETkaiDeBUkP2f2lTL8OXrZ7jY5ITr/1k+PmIk6AV+HbP/9Su2MAjz8TKsnjKdgYebl0FeUoqhcvUyhj8yOv8JGsAqLsGw98hJhrefPjOUtDYzzCoqYrhx9wHYQBEZacJeeLN3E+Ohy0f+Rx07Bhdr8jRiMNQ2Z2BQtGDgYmf//+3nT0a8sfDz1TvG0vQyhpdvfjKk9fUx2JnZMlSVBjFMTddg4BQSxu8FWAz4JCWDnX7/ziMGHmklBglhPrAcyCAFFYX/OA0QsHD/XzGhi0FUVBiMt3aVM0j6RjD0Lz7A8ODTD4bJ07aADcRpAAjs2bwbbDMI2CTXMPx//4lBISiHoal5AUPGko0MApIIAxix5QVQVIL8DgPzO7sYfr98wWBW3cxwfs5UcEDjNQAEBKyC/pt6ujMcmdvCkNA/i+H7t18MGyZPw0iROPPCh2PrGO/euMQgae0HTlCcXGxYkzNOFxALAMhjiLmQKmb1AAAAAElFTkSuQmCC","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB40lEQVR4nGPkFZRhoASw4JPkE5T/D2N/ev+QkSQDOHkE/idung5mv/vxjWFTUvn/j4/uYhjChE0zt5Lh/6rThxiE+PjBmkHAtaeKgUNC8T9IDlktI3oYMDNz/5/66CKK2Pyp8xjePHrI8OX9D4aXW9cy4nUBh7waQ0VwNgPzr88Me44eBLMtvGwYDP2cGH6+/YLhWiZ0AZY/nxg0vZwZlLn4GdxNjRj+M/0Ciz++cJchviefQdw7GL8XOCQU/2+7uJfh1p9/DNfv32LwV9VgmH/5HMOxBesZ3tx7xvDx2H78Xvjx4j5joKkrmK0jLcmw8fYNsGY9B3uGn/ce4PeCgIU7OJQ1chPgYqCYAAFhHgGGycfXMSjHRP/HakDKilX/i+d3M7BICDDIyksx7Ny+j+HZ528M23buAwfg6pYehhc/mBlE9DWwu2BORBjjVEdfMHv3hCUMPApCDKvmLwcbBg4sHkEGCY6/DBd75+H2wscvH8GB9OvSeTA/Ii2NQVcDYiO7MA9DiW86w8mrB8BexRoLoOT7n0cQHJCgsEhZ1IoRaCva5zIomZsziHJJMWwqiWFEyQvfv3xg5FdQ+//jxX2Gr/fOM544fvY/03d2sNzDl4/AtIK+OsPxujJ4VGKkA1IBAIc/rUVxpfvOAAAAAElFTkSuQmCC","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB90lEQVR4nGPkFZRhoAQwIXP4dcz+oyvgYmf/T5QB4t7B/9NmzkSR5FYy/J+97wRWg7G64NfbL3DFHBKK/1MmTGJ4/eARQ1pfH5iPzQBG5DAAaU5o62VYUFXM4JpVABaTlpFl4OJnZPjzk4FhWkYuw9d75xmxuoAfqllZgZ+BgY+b4fDWtWBxkGEbDp9n+PUDuy+YYIyPV04xzuntY2gMDmJwjUll+PH+HVgc5JJ3xw8wsHGgWIzdC9z2gf+/HlzPyC4m9L9o9SaG50/eMkjKCIPl+sNjGeaf3cmQ4+DF8Pb2HYRpvIIycHz09ev/opq2/+/9+/tfIiD3f+LyQ//1c9r/q8Tk/5//+B1YDlk9CDMhOyc8KJ2h6MQGBi+3TIas6mIGHn5uBjsvNwZuAQmGx5//4g8DEPgjLM2wonoWw49Ptxhev4Y4X1RUmCE4PpJhXkIoQ9eujQz8Vo4oocmCzGmf3MhQZ+PK8OHTS8ZrV67+377sLFgcHKCishBXfPqKOxC52Nn/K0tIMVx+eB8ckAvOn2C4+vgpw7LJa8Dyb+9fYzi0eQGDW1wRw8uta8EBiWIAKLWpsjOADUhYuvH/k3cPGEz1jFFsXDlrOZiWl9Vh2N+RyYhiAMyQHy/ug03XbJkM9u//Ry8RTpYTZ7hekwuPRgwDSAUADKO+2btP8ZYAAAAASUVORK5CYII=","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABuElEQVR4nGPkFZRhoASw4JMUkNL9D6I5/n1iePHiISPRBoiY6P7//YOTYceWDoZH746DxeLtuv9///IBwxBGdC8ISTH8j1xWxXB04wG42M+v7AycMooM17vWMaAbwohsgFFB0X8hZXkwO836C8OOq58ZLG3Cwfydp8+B6e1TtzB8PbieEacLYK5QiW9j4JPiZjja28PQuWkrw96jZxj2rNjMEJqWwMDJxcYwPdCTEWsYiJjo/t+7cwucn3j3IYOOOA+DfZgzw6W9BxgWRPvj9gIM8KWW/2/JjQZrBIF99x8y9JdPQnE63lj4NLuTsf/98/8RuWkMH959Zjh76jzD72dvsCllYMImyK9j9t8+MJhh745DDN+//WKQlJNgOH1iCQObqu1/ggZw2wf+z5raB2YbmxkySMoIg9lWQQUMO44sZFAMifuP14DQtASwzTLKfAwCQrxgL0hJSDKIifIS54UF0f6MV4+dZhDjEmZQkuNm0FSWBhskqqrB4BtWzHB/zSJGZFdgjQUQACkCBaKkIB+KeH9TD9gwEDjVXsWI0wAQMKtsg9v05/sbBhZOEXCAbsxMwp8SSQEAyyeSyPjC5DIAAAAASUVORK5CYII=","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABy0lEQVR4nGPkFZRhoASw4JLgl1P+/51dioH1/3uGr3euMJJkgJSrx/8TK2fD+Zpmnv9xGcKCLsCtovM/urSGYdmtdwwff35mePjuI8P1U9sZdA0c/n98dBfDECZ0AVYRaQZhPl4GLi5GBlcNKQY9SRmG6ZcfMly+cICB2z7wP0EDQODtp89g+srLLwzNMdEM/Oy8DO///2MQl5FiICoMhPl4GXTEeRgik0oZXIqLGPACXkEZMJb1TP4ftOPq/3v//v6XMPUA06d//QJjs8qJ/9e8/fLftKTlP0w9DDPBDPr/5T1Dj5sGgyAjEzgccuccYnj4+RdDkH8mg0+QP8O1e28YGFl5cbuAV1CGQcY26L+whjPY1vf//4PZU2++BbtG3TYWw3YQZkE2jFtSiOHyobUMd37/ZshduZvh9LVdYHFTixiGX7cPY00HTMgcfmVdBveqSWB2fpADQ3hZO0PHjgMM1Ws7sEYhCDCi5wV+HbP/WmEhDPdOnmRYPq8bLj7n2HWGE2u2MdxbOpXRJiLl/5EVc8AuwjAABAQs3P8f3DoLa6xFVE9hEFXUY2Bn/s6wuySNEasBIGBWN/k/M8t3DPHjdWUoYYHTAGIBAKj+rYq6xPvbAAAAAElFTkSuQmCC"];
  const IMG = ARTE.map(src => { const im = new Image(); im.src = src; return im; });
  const P = MainGameScene.prototype;
  const Z = id => 'ed_' + id + '.main';
  const LUGARES = {
    [Z('casa_peste')]: { adentro: true, puntos: [[126, 128], [92, 160], [118, 178], [396, 196], [240, 96], [320, 150], [196, 122]],
      frases: ['…¿volvió mamá?…', '…no bajes al sótano…', '…tengo frío…', '…cerrá la puerta, que entran…', '…la sopa se enfrió…'] },
    [Z('capilla_brumavieja')]: { adentro: true, puntos: [[240, 118], [140, 124], [340, 124], [60, 200], [420, 210], [240, 200], [168, 236]],
      frases: ['…recen por nosotros…', '…la campana dejó de sonar…', '…el de la capa negra dijo que volveríamos…', '…acá adentro no entraban… hasta que entraron…'] },
    [Z('casa_quemada_norte')]: { adentro: true, puntos: [[200, 64], [240, 100], [290, 150], [226, 170], [160, 200], [300, 205]],
      frases: ['…vinieron con las luces…', '…¿viste a mi hijo? Bajó al sótano…', '…el fuego ya no quema…', '…luces verdes en el cielo…'] },
    'ruins.village': { noche: true,
      frases: ['…la niebla nos trajo…', '…no sigas al norte…', '…¿quién anda ahí?…', '…esta era mi casa…', '…¿ya amanece?…'] },
    [Z('cementerio_real')]: { noche: true,
      frases: ['…los reyes no duermen…', '…cuidado con las runas…', '…nadie trae flores ya…', '…shh… que no te oigan…'] }
  };
  const ESCALA = 1.3, ALFA = 0.72, MAX_VISITA = 3;
  const azar = (a, b) => a + Math.random() * (b - a);
  const uno = arr => arr[Math.floor(Math.random() * arr.length)];
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const zona = S => (S.currentZoneKey && S.currentZoneKey()) || '';
  const noche = S => { try { return !!(S.isNight && S.isNight()); } catch (e) { return false; } };
  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const tex = S => IMG.map((im, i) => {
    const key = 'ckfan_' + i;
    if (!S.textures.exists(key) && im.complete && im.naturalWidth) { try { S.textures.addImage(key, im); } catch (e) {} }
    return S.textures.exists(key) ? key : null;
  }).filter(Boolean);

  // ------------------------------------------------------------------ un fantasma
  const quitar = (S, f) => { f.fin = true; try { f.sp.destroy(); } catch (e) {} S._ckFan = (S._ckFan || []).filter(q => q !== f); };
  const desvanecer = (S, f, rapido) => {
    if (f.yendo) return; f.yendo = true;
    S.tweens.add({ targets: f.sp, alpha: 0, y: f.sp.y - 10, duration: rapido ? 650 : 1300, ease: 'Sine.easeIn', onComplete: () => quitar(S, f) });
  };
  const susurrar = (S, f, L) => {
    if (f.hablo) return; f.hablo = true;
    son('ck_fantasma_susurro', 0.45, { rate: azar(0.92, 1.08) });
    const t = S.add.text(f.x, f.y - 30, uno(L.frases), { fontFamily: "'CK Grenze', Georgia, serif", fontSize: '13px', fontStyle: 'italic', color: '#cfe6ff', stroke: '#0b1420', strokeThickness: 3 })
      .setOrigin(0.5, 1).setDepth(30000).setAlpha(0);
    S.tweens.add({ targets: t, alpha: 1, y: t.y - 6, duration: 500, ease: 'Sine.easeOut' });
    S.tweens.add({ targets: t, alpha: 0, y: t.y - 16, delay: 2300, duration: 700, onComplete: () => t.destroy() });
    S.time.delayedCall(350, () => { if (!f.fin) desvanecer(S, f, true); });
  };
  const aparecer = (S, L, z) => {
    const keys = tex(S); if (!keys.length || !S.player) return false;
    const a = S.currentInterior && S.currentInterior.area; if (!a) return false;
    const p = pies(S);
    let x0, y0, x1, y1;
    if (L.adentro) {
      const lejos = L.puntos.filter(([x, y]) => Math.hypot(a.x + x - p.x, a.y + y - p.y) > 60); if (!lejos.length) return false;
      [x0, y0] = uno(lejos);
      const otros = L.puntos.filter(([x, y]) => (x !== x0 || y !== y0) && Math.hypot(x - x0, y - y0) < 220);
      [x1, y1] = otros.length ? uno(otros) : [x0 + azar(-60, 60), y0 + azar(-30, 30)];
      x0 += a.x; y0 += a.y; x1 += a.x; y1 += a.y;
    } else {
      // afuera: entre 110 y 170 px del héroe, en un lugar que se pueda pisar; cruza un poco de costado
      let ok = false;
      for (let i = 0; i < 12 && !ok; i++) {
        const ang = Math.random() * Math.PI * 2, d = azar(110, 170);
        x0 = p.x + Math.cos(ang) * d; y0 = p.y + Math.sin(ang) * d * 0.7;
        ok = !S.navIsFree || S.navIsFree(x0, y0);
        const t = ang + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
        x1 = x0 + Math.cos(t) * azar(60, 110); y1 = y0 + Math.sin(t) * azar(30, 60);
      }
      if (!ok) return false;
    }
    const sp = S.add.image(x0, y0, uno(keys)).setOrigin(0.5, 1).setScale(ESCALA).setAlpha(0).setDepth(y0 + 4);
    const f = { sp, x: x0, y: y0, x1, y1, L, z, t0: S.time.now, vida: azar(7000, 10000), fase: Math.random() * 6 };
    (S._ckFan = S._ckFan || []).push(f);
    S.tweens.add({ targets: sp, alpha: ALFA, duration: 1200, ease: 'Sine.easeOut' });
    son('ck_fantasma_aparece', 0.4, { rate: azar(0.9, 1.1) });
    return true;
  };
  // cada cuadro: flota hacia su destino, sube y baja, titila; si el héroe se acerca, susurra y se va
  const mover = (S, f, dt) => {
    if (f.fin || !f.sp.active) return;
    const dx = f.x1 - f.x, dy = f.y1 - f.y, d = Math.hypot(dx, dy), v = 13 * dt / 1000;
    if (d > 1) { f.x += dx / d * Math.min(v, d); f.y += dy / d * Math.min(v, d); if (Math.abs(dx) > 2) f.sp.setFlipX(dx < 0); }
    const t = (S.time.now - f.t0) / 1000;
    // con la noche o la penumbra prendidas (CK_LUZ), por encima de la oscuridad (27500): brillan en lo oscuro
    f.sp.setPosition(f.x, f.y - 3 - Math.sin(t * 2.2 + f.fase) * 2.2).setDepth(S._ckFanOscuro ? 27550 + f.y / 10000 : f.y + 4);
    if (!f.yendo && f.sp.alpha > 0.3) f.sp.setAlpha(ALFA * (0.82 + 0.18 * Math.sin(t * 5.3 + f.fase)));
    const p = pies(S);
    if (!f.yendo && Math.hypot(p.x - f.x, p.y - f.y) < 36) susurrar(S, f, f.L);
    else if (!f.yendo && (S.time.now - f.t0 > f.vida || d <= 1)) desvanecer(S, f, false);
  };

  // ------------------------------------------------------------------ cuándo salen
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0.apply(this, arguments);
    try {
      const S = this, lista = S._ckFan || [];
      const z = zona(S), L = LUGARES[z];
      try { S._ckFanOscuro = !!(window.CK_LUZ && CK_LUZ.ultimas && CK_LUZ.ultimas().length); } catch (e) { S._ckFanOscuro = false; }
      lista.slice().forEach(f => { if (f.z !== z) quitar(S, f); else mover(S, f, Math.min(delta || 16, 50)); });
      if (!L || S._gameMode !== 'campaign' || !S.gameStarted || S.dialogOpen || S._ckEscena || S.isDead || !S.player) return r;
      if (L.noche && !noche(S)) return r;
      const now = S.time.now;
      if (S._ckFanZona !== z) { S._ckFanZona = z; S._ckFanVeces = 0; S._ckFanProx = now + azar(2500, 6000); return r; }
      if (now < (S._ckFanProx || 0) || lista.length >= (L.adentro ? 1 : 2) || (L.adentro && S._ckFanVeces >= MAX_VISITA)) return r;
      const ok = aparecer(S, L, z);
      if (ok) S._ckFanVeces++;
      const n = noche(S) ? 0.6 : 1;
      S._ckFanProx = now + (ok ? (L.adentro ? azar(9000, 17000) : azar(12000, 24000)) * n : 2000);
    } catch (e) { if (!P._ckFanAv) { P._ckFanAv = 1; console.warn('[fantasmas]', e); } }
    return r;
  };
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () {
    const r = ms0 ? ms0.apply(this, arguments) : undefined;
    try { (this._ckFan || []).slice().forEach(f => quitar(this, f)); this._ckFanZona = null; tex(this); } catch (e) {}
    return r;
  };
  // la luz fría de cada uno
  const luz = () => {
    if (!window.CK_LUZ || !CK_LUZ.fuente || luz.ok) return; luz.ok = 1;
    CK_LUZ.fuente((S, out) => { (S._ckFan || []).forEach(f => { if (!f.fin && f.sp.active) out.push({ x: f.sp.x, y: f.sp.y - 10, c: [160, 200, 255], r: 26, f: 0.5 * f.sp.alpha }); }); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', luz); else luz();
  window.CK_FANTASMAS = { LUGARES, aparecer: S => { const L = LUGARES[zona(S)]; return L ? aparecer(S, L, zona(S)) : false; } };
})();
