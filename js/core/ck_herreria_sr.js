'use strict';
/* La herrería de San Roque por dentro (12/11, pedido del dueño: "la herrería", con las tres capas de Nano Banana Pro).
   Mapa del Taller herreria_san_roque (480×268, piezas ed_hsr_*): fragua encendida en la pared del fondo, yunque en el medio,
   barriles (uno con agua para templar), piedra de afilar, mesa de trabajo, armeros con espadas y hachas, carbón y hierros.
   - En San Roque, T en la puerta de la herrería (824,350) entra; se sale por el hueco de abajo, al centro, y se vuelve a la
     puerta. El cartel de afuera ("el yunque todavía está tibio") pasa al yunque de la vereda.
   - Adentro: el herrero martillando junto al yunque (chispas), que vende piedra de afilar (ck_tiendas.js); la luz de la
     fragua que titila; carteles; minimapa; pantalla de carga de San Roque.
   Va DESPUÉS de ck_san_roque.js. Borrar su línea de index.html cierra la herrería (el mapa queda sin uso). */
window.CK_HERRERIA_SR_MINI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAABDCAMAAABgBzGOAAAAwFBMVEWPcF1qXFZoV1BXVVRkT0ZUT09RTk9OTE9sRjViRThZRT5WQDlOSUtPQ0FJRUpHQUZiPDBVPDZOPjhOPDdMPThLPDdLOzdJPTlJOzdJPDZJOjdJOjVHOzhCPEJVNzBONTJLNTJJNzRJMjFENzVEMjE/NDg5MztHLSpCLCw7LC8yKjMzJSscExcQDBIODBIQCxIPCxMPCxIPCxEPChEOCxMOCxIOCxEOChENCxENChAMChANCRAMCRALCRAKCQ8KCA8HPucSAAAR80lEQVR42rVZW5uquLYVEZCLUIigchGBQBFpZaFHEcuq+v//ao8ZrLW6+zyc/XLycQ1JRuZtzACTz+fz3J6H5+cnrh6PBy6ejx7HL9wPj+fjiepPekxlOJ8/Pz5QicdUvqjV5+fjc+jHKjwcBjQfLpcP9B8ej/5C7cTwH9T+8+v5/f0cJqjpb+fhSzwAshgeozwItO8/hmHo+wfGoodD316oGc0TM0I1GmN0ghBze3z0/dBjrP7So+EHRkCPL5oc4GiiX1/fnwB+EvDz8+MhZoQrjPEx9JdB4PWX9nLBfr7dcXvp+3Pbtj3V98Pjdhn6OxpdoLCxirpcqNnQi9bY+vZ4bD8eAlggfX2NQJD4W1yNKiOxvn8XVNHcnuIR3X+TtOL6+fmn2ZOaifafJMzPM4J5iu6i7kllVMsITJdCv+Ojx/df7/9XqX+f6p/L+ufR76t/dGi/acbPD/jQYyDFAhi2FBqGW308P/vvv97+H8r7+ZvcBqh3ghuANhllHW388SDc3av1fD4edV1/wyU2fY6ruaif/xl1/rr+U6XrqHu10uc04nsL5OFxv8NZICoOE7I2vPVBBhoEbp2zHCVNcdjv832a0vaOQ/q6znO2xxNRMva7kei1F12p0ViDh+/vb4Q8fDxu59sZTgh0EU6PMYg+Ie/ubfde2YmlWpaq2jiptqpq2BXbsm3HUmzHUSzbSTRbRrVs23KVqIqjKGigqA46OBbtqoYz6vDMdnhOyF/3e0tRMdy723B7qRpRPdyFvMyuLM0xjJVpLJeGYXjYTcORFcdxbNlOnMTCdSIrqqKoqmwpCZ4pOMsy3cuqIiu4wbxlRUMd5uMkzoh8bEFVt9vt2N0IGDREYTTi1rbmyLKV2snCtZzFW56k+lu+W8iyo1kAdqxElqZJBQSxKXKSTGUJZ5nwMQEcNUUWc9BwALjqaCUhHz/b2/1+7Y4ot4nQMjjwLvTMLFuDoh3u2Al3tKQ+VEnB6ga6VO1ExRgJDQ31AkwWcHalKAtTd13XNPduaC7XiiXPDMu2DHPhaDBUAsM4qUA+Cdi2PV4nj6fgjmG0r6VZUCMmnnBbrQCt5Iq6yFUZanYsocepJMmVRtKOMmqVLBnwRAafavJwl5WKPJ3OXMfUZ/oKAltWAodI0h0hX3sB3N0nRNqglBHXsVWYRIM/WaFiLVJVVVO4jGulB+4eAr2pIdls6lSkXEwAUktKtZgai0WSlJwOcAJZm02lnaMrkmkmGALCwzNLkrn9PHZd175U/Xz5M7M1W7MWDhlvkUE4F7bKIZin5AeWHuodr99SV5LKBJgSREeBrpOpNJ3NksVCscmvLcmyZoA0dVMPNdhZS5QkwaOd0PbxeoXQ1wnx5SuO4Puqlm0cTFJe5IglExESAhwRBFsfSudwWHgzyGgR6mw6Jb1LcmIA2FjDlRM1QazBlWeG4wA5SBQgW5ajyoWirnek7fuxHYGBLPw5hw0V1XjnCaBkJVQ0K7c0ER+wU5XYlaPEyQyathJJWlhTgEIr0Hgym0jGbKmQ5ktFs9HBthVJS+BVkFeFV0/kYqGqSU4c9gDu6dcE/PnVQt4cdGBZJeMcHqxp8EyEqErAFDR2ReZbLIzZbDK1bNL0ZCwAdwA+mxkzZTpF0CWJmCn5nizB4PAXR5IcJQwQevkoc/cCPu4QvxT4Zt0ktgM4MJUgBHgGuSWUmFiWtZhCzAlMqPzAErIM6aYTCc8wAgLHUcEgKmjItiayJqF7JckL2c4WijbKfD2fjhNk78/jLkW4qAv3rUzgK6qNqNUWigp+Ai+BAjESMZNM3gSkZEqIc9pxkByhdngYGAtOhIZ7WVJlotWSy2tDSyQEi6KtFoqV1Lvd8SEkxprouPNIz1megg+1qoKHyKqpewfXKF09LQ3XgELtZCY8eeY4kkCcjMjk5ECeubsAwUXRraaGXC5dnprpzswz6NtWEyBnC7BQvjsOHUn80X9AYuAauQv+kJPDAV4sq+nOO6S70jMzvk8NuJDtzEjgCWJjFHfyktux4dVIhW+uNBW0orpZ2RTLOlsUbJ15FsJJydayZQcLVfMg8fl8nHwIYNOezXYGcC1JOxwqyjt5mRycNcSvFklgykT9CCDIZtnJ5B/FsTJK0287vlDIzxUrXcihY+W2FjNt7SGZwWAm0RJL7GB3fPa3XxMsGQHsWfl7Tm7kyPbhcCCiSxX7oMiHRKlkZbEkooKWLQgNT5Pmf+SFje33N90tOKJchJis5AC21RRpbiVvUoX4XUtMIs7GXu6On31/mvTDhYCN97SQJCQzJ6kgpS1b+wIS4wbOqS4RpPJMmlXImVNEz3T+R965V5R5g9keqoNFegEB7BO7sDXP0ZxSW5sJ6EzT7MUSnORoEVSNzDjBEvR53OX5zAAtJMQyBAwWSstEFAVp3jPAUsqsSjQnAaX+U9OLhcozzpum5IqCmSLu0rVTwFktecGtlYdQgbfLchxQnGYEfIfEPUmcN5JMYW4nSIflocq8PM15yXLO03HJ43oeaBP0UHGL9C5CeiooU3be3V1KK0xOgh8QHXlasz2r9wyrqLQuJ6AxWbKdWMF0dsf+dj1NsGIH8L4EC0qSbTlOeYDeOGMpKxuWsSJDyfesLBlANfg252hmYQjFQGDSwqTkdc0Yr3kDdaM0eZ3nNUNljYEwAYnWSJIm88yRATzcSeILxfHSgrhEbBYQipIXMUuhPV6icM4Z9F5mMAGWIAkriREla7VYLBUJ4sslY9QKvHeoKgGcQ2Neig3Cs5jJSn2g1QlYUV2+VD0ylyeA5UQpeFxWZRHHkEBgjiXNsiCi0HKSpIglykpNvcvrRnhxGUUFAQtNQ1/Nvvndk9esiOKiZolF6UNRIfFzuF0ng7DxKLFsZSwuyrIqUBjQ4yjebtfbTVGslksAV01lO6wkeprmru7quWCMktqTfwngpjnwYrPdxBG2cIOBCpbX+gqrVqxX1Cg9Pm/3K1TdI0l4QEXgB7wQBRIUEQ0W4Souou3W90wGNUKRULWN5KXUrrtz95TF7DILAs/zMogNZOyvMag77Zsir+tZYlPGI+d6AQuuTsilPTbiFtsf1DAMNxHGwLjLqCTcpgxXmbc0TUOnYrquF4S4peJteVHGTMyZkKMsIxGKqN7XDbwDudq2PUjcA3gYgcEqFuOxv91Gcbz1txByu92IbbVdr6FpKjgR4vxfRR9xzaW/wgBFEYp+8RbQGCWOGHy7ORiMlpFEmSAQsvENNs6QCGHfdRET5NrfEO7WjyJ/6/sYbukB1hSCES5Bz0CWEi22CNp4IS/RmjqiV7B9DRKGDKVumIk1nWX7RJkXqPrcCq5eBAy9Yn/t+5uNT52AV5Qrf7V6iTvimgSqL2iJSdyB3fwjM3RCZYtevu9hB34QRDViHD6XNiGWusRc91s36bsWlJnZDH61oZaQVoCHfhBuNgEh03gj9o+i9aJ6lUNIGtCFyMuVt1qhc7wJglECTN/fBhGUnTa83vO1LVR9vwP4dqYVCHD9eLXyg2K93mDbYPNXGz9YoyxX65fco8ACOhO42Xij66PAS3+92oZxDMx4TYrDIFvIs+J6Dvo0+ZK8+jFcusnw6L/B1WxdFPusiPx4vQLuFhOm2WLWOENngb8aJdYJhcD2B5KX6y9gfQRerqjpFvMEqi9sTGb3WZbyojZSHgtVXyg7kVfnRZTi3cfdFwQbC6/YbgKofQN9+cLiK2FjXX+FUWknWHpWniumQsCjhQOfIMm6G3JscrQteARMzt5ZWnAG57r37aTHGyuA+d5FZ3eXxQjdMIamwg1doQtBw2YQ+w+y6aaljai2k733mgvCeLVCPx8GDkOgwq+jAJEFKgijbcl1sGcOFiOJsfS5vYAhMHXPi1CUTRy+CvA31DuE9pd/RDZYmbkZ4+7rXl8uPQgJ0/zuGI9jEAuFWchdFymvCHPh1cdJe74NSIscL5o0KGiGcCjw4dYEuA22YUB6h7VW8Go0+gH/WzFG+oBZAziUT4034bagnhGIJKQ08paTxHsChqrPZ7w5AnhhkK0Mp/jNmmQeoEcsEh6C8TYbQV0m4Rt/wx89eiP8CQIHCN5t4PmRXwgqFLjRlpL2nkUAHvChboIvAwOpOnaQs2ynZlGRp2D/AplF5IhCWRdbuoIqQooMQC/pTVA3X3xFBdYl38AOxsQpenUQmIK3i6KpsaAgiQe8mU+u5+5OwDsXHOO576xg+zhJ9lBKltEGZoT6o5fh0GbpessfvBeDI0+QGcM4y8IsoGVPmu332T7LGQ7M2yNbZGHJ9zUXwLSuRoZ6QNVNJrzExQrH0yjHruqCGjO8FU0M/pIgjALf88aApuKKnBQGLx+iNn6hz1x3Poa3mbs4JsZ8JpSHJRjnuZC4nVy604MkrvAmaJjOoeAmvelpZk7ZxeeTyVQxTOaT0nwPtvY8+K6ApxmsYoRaQL4UgZQFcK7vdvMUUihKiiCfm6Fm6gyuBslraAOLPbLx/Xq7H92cN6Vj20nDN9zD57i3nVFyIiEuTdQqTAuQgE/5AsEsCuUscS4oZ4oHfkQ5NSpc3XbMVJ+7xC3zuYuPE9oMnuoXjPL93sW7E2x86673R7PDag3ZmvP1ljv0FqzYTRV7S5ZjGW/knJhoJQDGbAGugMwerOuvRSWQkcjXhZ0Uppc4WZrO3XS/RAbRF46zNvZrzxNdM7fp2zO4usXHkON3A9IsOStj36/x0oTVwr6uSrasXbgvFquCrynRAcSjZc5Iy4LDPYINVl6BpXFi24Wup6lpJy6l6QTA5sKYz7OtR3Za5bvmG7iXdtKJL08fQKZRiyAAh2E1ZbqMZ9AOr10ktLTA0B4Nj74B5SoIut4Q+IqSF81nta4crH/LYkf6rSpvbtprc64j++OY07RXS+B+tKJMIG87ysxGI/KC/NsMeIg4KWD8nGED948aBZjIkWRZIfbqZ1G0ouVvUjJ9JvLVuENqyuCzvXAJkld854KNR+Du+AWZA2SSFavw+RMrR9g1WCGZNS47NIzUun1lZX+9HF2aYKGBF3Bs4Xsp1vsMH3MZreXpCy92vAHt3znWBX62az6B23XnCwED/2XnPXxlGTYMC3rWFFDudp83jct5QbhLpOrXKmgsnsBb/tQVDj41WVXR/LvQUpuD+eFX38f23HXXGwgENr4CvOuvQtvIfwVv6gYLkiiItgj4xm2KIBIxGoiQQgzDv2iO8Bds5G8UTizBe5RT0Sqn4QIRR3qL5A2i1wvYrnkC6Ny11/uVJBbl3F5Oo50DH3SL5VfgUWYpGM8ZIpR4Cewvogp+gqeeH5JpfC8AMBQOYHySKnnI83oP7YKmxu/qaYpXOOYxt/4+Xnvgdlc49OQq5O3AnifhYUX0r8IYHcdqWjDHa1BaTOuMUCxtxjSKZ8X4rhTz9/+lbLzACj2Tcumz3pVUfeu6C5aa5+P1JuwMdid+B6/v/15wO1aI14qMhWOy27C950VeRF1SemFBYqB31j8F0qKG4qjrbvAs5GFh4/aKbwLQ9eVC3+w/m/z9vyn179fBpv6vOuTNN3z5fCb73keJ4VZQwBW/xVBxxG+5V/mkwzDggH9vw1M86PElX/ze+/6r+UuU5q/vywf9U6I/K8MHNRub0o+mn03cHeHO5Fj9rTuSjQEMzbfdDdO4XSm2Trhrf11vZI1fV/q+TLF3pXISR3z2PZ2PrzIMv67d6XT6dTp13el6Oh3p4ogPlkdq2t274y/IhS/UqO6Q/ZGZMCZU3V06IfLpTPoWPwyOIrLvJ5xP5/YEnI7cAm2utxtx7K8T3ufF76t+gI8QGmBO4txSy+NJzJgoiry4Pd9PhIEK9AVjtbTYQwWsDfVD9gtNlqTD6XyiMc70dflGg4lqKi0ExwC/aIM4mNe1+x+hiPE5ySeai3gRPc6vnoKsWpo7ZSf0OXevPn+7IGqBwtureD7qmko7Nrme2m40zcsAo1LQjv7ydN2rlcCDLruTABY1Io7PFxoVr+fY6NfrhVBwCa+nQw/D367kj5iDGP8+grwKeYMoFCWkILTCJY19fukI9zQufBgjUsE0KEng9297+SlnmuqZLi50oh/D/flyJ0NgtuLpS3mY+6kTKiW5b9d+lO18bH8Udj5fqNOlE2BiAPyLbsVVe/wP1EmpFMLSV48AAAAASUVORK5CYII=';
(function () {
  if (typeof MainGameScene === 'undefined' || typeof INTERIOR_LAYOUTS === 'undefined' || !window.CK_SAN_ROQUE) return;
  const D = window.EDITOR_DATA || {}, HERR = 'herreria_san_roque';
  if (!D.mapas || !D.mapas[HERR] || !INTERIOR_LAYOUTS['ed_' + HERR]) return;
  const SR = window.CK_SAN_ROQUE, ID = SR.ID, Z = SR.Z, ZH = 'ed_' + HERR + '.main';
  const P = MainGameScene.prototype;
  const PUERTA = { x: 824, y: 350 }, LLEGA = { x: 240, y: 200 }, YUNQUE_AFUERA = { x: 880, y: 392 };
  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const enPuerta = S => {
    if (!S.currentZoneKey || S.currentZoneKey() !== Z || !S.currentInterior || !S.currentInterior.area || !S.player) return false;
    const a = S.currentInterior.area, p = pies(S);
    return Math.hypot(p.x - (a.x + PUERTA.x), p.y - (a.y + PUERTA.y)) < 28;
  };

  // ------------------------------------------------------------------ entrar (T en la puerta) y salir (el hueco de abajo)
  const i0 = P.interact;
  P.interact = function () {
    try {
      if (!this._overlay && !this.dialogOpen && this._gameMode === 'campaign' && enPuerta(this)) {
        if (!this._doorTransition && this.ckEntrar) this.ckEntrar(HERR, LLEGA);
        return;
      }
    } catch (e) { console.warn('[herrería san roque]', e); }
    return i0.apply(this, arguments);
  };
  const sw0 = P.switchInteriorArea;
  P.switchInteriorArea = function (nombre) {
    if (nombre === 'sr_herreria_salir' && this._gameMode === 'campaign') {
      if (!this._doorTransition && this.ckEntrar) this.ckEntrar(ID, { x: PUERTA.x, y: PUERTA.y + 12 });
      return;
    }
    return sw0.apply(this, arguments);
  };
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      if (!this.currentZoneKey || this.currentZoneKey() !== Z) { if (this._ckHsrCartel) this._ckHsrCartel = false; return r; }
      const pr = document.getElementById('ck-prompt');
      const txt = this.dialogOpen ? '' : enPuerta(this) ? 'T · Entrar a la herrería' : '';
      if (pr && txt && (!pr.classList.contains('on') || this._ckHsrCartel)) { pr.textContent = txt; pr.classList.add('on'); this._ckHsrCartel = true; }
      else if (pr && !txt && this._ckHsrCartel) { this._ckHsrCartel = false; if (pr.textContent === 'T · Entrar a la herrería') pr.classList.remove('on'); }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ San Roque: el cartel de afuera, al yunque de la vereda
  const LS = INTERIOR_LAYOUTS['ed_' + ID];
  if (LS) INTERIOR_LAYOUTS['ed_' + ID] = function (kit) {
    const r = LS.apply(this, arguments), a = kit.areas && kit.areas.main;
    try {
      (a && a.talkers || []).forEach(t => { if (/^La herrería/.test((t.lines && t.lines[0]) || '')) { t.x = YUNQUE_AFUERA.x; t.y = YUNQUE_AFUERA.y; t.r = 30; } });
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ adentro
  const LH = INTERIOR_LAYOUTS['ed_' + HERR];
  INTERIOR_LAYOUTS['ed_' + HERR] = function (kit) {
    const r = LH.apply(this, arguments), a = kit.areas && kit.areas.main;
    if (a) {
      ['talkers', 'exits', 'actors', 'fx'].forEach(k => (a[k] = a[k] || []));
      a.ambient = [['amb_fire', 0.4]];
      a.exits.push({ x: 222, y: 228, w: 36, h: 22, key: 'walk', to: 'sr_herreria_salir', hint: '▼ Salir' });
      a.actors.push({ type: 'smith', key: 'npc1_villager', idle: 'npc1_idle', scale: 1.3, x: 198, y: 168, hitX: 220, hitY: 142,
        lines: ['Herrero: ¡Pase, pase! Cuidado con la fragua, que muerde.', 'Herrero: Una piedra de afilar y la espada corta como el primer día.',
          'Herrero: Del otro lado del puente se oyen tambores. Yo por las dudas tengo hachas de sobra.'] });
      const habla = (x, y, lines, rr) => a.talkers.push({ x, y, r: rr || 18, lines });
      habla(90, 232, ['El barril del agua para templar. Todavía humea'], 18);
      habla(138, 236, ['La piedra de afilar, gastada de tanto uso'], 16);
      habla(370, 240, ['La mesa de trabajo: martillos, limas y un par de herraduras a medio hacer'], 20);
      habla(240, 118, ['La fragua. El calor se siente desde la puerta'], 20);
      a.fx.push({ type: 'dust', x: 40, y: 110, w: 400, h: 120 });
    }
    return r;
  };

  // ------------------------------------------------------------------ tienda, luz, minimapa, carga, profundidad
  const instalar = () => {
    if (instalar.ok) return; instalar.ok = true;
    try { if (window.CK_TIENDAS && CK_TIENDAS.TIENDAS) CK_TIENDAS.TIENDAS.push({ zona: /^ed_herreria_san_roque\./, nombre: 'Herrería', vende: ['whet'], x: 206, y: 180, r: 40 }); } catch (e) {}
    try { window.CK_SALA_ED = Object.assign(window.CK_SALA_ED || {}, { ['ed_' + HERR]: 'casa' }); } catch (e) {}
    try { const C = window.CK_PANTALLA_CARGA; if (C && C.REGION) C.REGION.unshift([/^herreria_san_roque$/, 'San Roque del Molle']); } catch (e) {}
    try { if (window.CK_PROF_ENTEROS && !CK_PROF_ENTEROS.test('ed_hsr_x')) window.CK_PROF_ENTEROS = new RegExp(CK_PROF_ENTEROS.source.replace(')_', '|hsr)_')); } catch (e) {}
    if (window.CK_LUZ && CK_LUZ.fuente) CK_LUZ.fuente((S, out) => {
      if (!S.currentZoneKey || S.currentZoneKey() !== ZH || !S.currentInterior || !S.currentInterior.area) return;
      const a = S.currentInterior.area, t = (S.time && S.time.now) || 0;
      const f = 0.88 + 0.08 * Math.sin(t / 90) + 0.04 * Math.sin(t / 37);
      out.push({ x: a.x + 240, y: a.y + 90, c: [255, 150, 70], r: 120, f: 0.9 * f });
      out.push({ x: a.x + 240, y: a.y + 150, c: [255, 170, 90], r: 70, f: 0.45 * f });
    });
    try {
      const MM = window.CK_MINIMAPA;
      if (MM && MM.Z) MM.Z[ZH] = { img: HERR, esc: 4, w: 480, h: 268, ext: 0, n: 'Herrería de San Roque', g: 'San Roque del Molle' };
      if (MM && MM.dibujo) MM.dibujo(HERR, window.CK_HERRERIA_SR_MINI);
    } catch (e) {}
  };
  document.addEventListener('DOMContentLoaded', instalar);
})();
