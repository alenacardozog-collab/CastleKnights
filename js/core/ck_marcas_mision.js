'use strict';
/* Marcas de misión sobre los personajes (11/11, pedido del dueño: "los íconos de misiones sobre los personajes, que estén
   mejor alineados y mejor hechos").
   Antes eran un "!" de texto puesto con una altura fija (54, 62 o 78 px arriba del punto del NPC): según el dibujo quedaba
   flotando lejos, metido en la cabeza o corrido de costado. Ahora:
   - Íconos de PixelLab: escudo rojo con corona y "!" para quien sigue la HISTORIA; rombo azul con "!" dorado para quien tiene una
     misión SECUNDARIA para darte; rombo con "?" cuando la misión está lista para entregar.
   - Se pegan al personaje de verdad: busca el sprite que está debajo de la marca vieja, mide dónde empieza su dibujo (sin el
     aire transparente del cuadro) y pone el ícono centrado justo arriba de la cabeza, con un vaivén suave.
   - Las marcas viejas de texto quedan escondidas (siguen existiendo, así el minimapa sabe dónde está la misión).
   Borrar su línea de index.html vuelve a los "!" de texto. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const ARTE = {"excl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADrElEQVR4nNVXbUhTYRQ+97rNLxaYMmP47bZwukTnULKMEnKKIVqU9sNASiIwoi//VD9S+lH9kKQIrR8iYUYpgZQm9qX+CLNIRfMDZEOkTCkkP3IXb5xj97rNrbapWQcO9333nvc8z/l4733HSFgGNlLYDUWH/52AJkbPo67GB+NpD+i0av5OPkfj/bdnYGx8gvlrBDQqNX//hAQkqVdpznWeh/xbHAyNDDPrXgKddhl8ruUkKY5rCzkIUSrcL4eEZVzWhDgN31Oh5fu7mvjm0wrez9uLFMf4G65pNRreHZ/gCXh3eRQBa2OTSDfLfUQSuBYREuwyCXAX/F6hHJ3z+u1ZfHJaHimO8bcrRi+RBO5ZEwIJDtKOUe/LP0OKc8xAvGGXTTlcJQHugGOUCI5A5pER0s8NaWQjEEMbd0iwv+v2mqPL3Z53cwpi9Wkg9fOnde+eIlIUy/d5esoDw8jmcPU07fHNuAH4rkBfznBYZ+dcADfXFcHOMhPE6DMgLDqJFGWsf8yhQ1yP1O2B5EujtBdJoC/06RIBnd05x8gRXBkWI9rgHEkJguOI8GhxjrbxKZliJtAX+nT0nmDtwe0j1yXngETiY7PJmowg8i1x9JwYHyVFG3VCFvkQSDw67r+iHBLriclkhvZnHCQF1MC7/inwkUnFNXSqUEaK8/TcU3C3qmKJeHKOuIZ21k/00dJhgvTQGmjrMIHJtOwTxdG3gL+8l4VwhR/oEkMhpXQQIlQJAJZp8A1S2RgOdLfQs+RgNvRbVDbAHDcPo73PobVUCR+HvoBpYhbKXwAsWBaZPzUhc71TCt8m58AnOBLaL4bDJ3OfmGKhBAg+WpdKWvmgSVxDYIEcgsujl8qFPu3BnRGA6ZkfzLk2HlprW4AL1cPLsijoffNYXB83D6CzFfuE6IffPyHiCN719DUcq58ln46wWHAiyPZaTyC8rW+kTFQf8qOUCg0pk7IQWdBJag2OkVfmSkXwkkaLw8jduQ/w2BPpBXnw9cMr8VhylhkbI4nUn8CRqCrdCG11DQ5r7gkB2OTvzZ9NtcCBI0aapxS30RETOh9LIoAbMtPEyJ2l3W0CKDIpy1/YDZCoDaQ5ZkK9bYcYuVDzhzXNLkXu0ZUsRKngi+MmxXLgmw4Fux2bFdOO3e5K5B4RsM5EtnErzAXEEpGpyTmn53zN74QLlkWmqi8ImpoHaR5lMBC4s3O+btdy2a9MoHgS+aoJoAhfN0//E6CsisBaCLuh6P8CgZ8syQnioKuc0wAAAABJRU5ErkJggg==", "preg": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD4klEQVR4nO1Xa0gUURQ+oytIGGooPSxKkSQxKlFMe0gPf0hBYtgD7PGjKJAyKfFPRVh/IqyUgl6Y1UYPKwwLpQ0rM0yMTQkM8fWjtjTNXWuzwmziO3Kn2dnZdXapX/XBMLN3zz3fOd85994Zon8dkr8T01NzZPXvJ42Vfvky+TNpUXKmXFOxwmUsI9cpP2uukf56AOmpOUxeXHzJZdxi3kKZW0Nkf5UwTD7cfkY+X5gqR02d43Jh7GvXNTlpXrpLaf44eX6OOzmuKZNj5byshWyj7Q9vCDBKfv98Mp0qKacb9f00+nOE4uOTaVJojHIFBgTR7cYBunrhEtWas8moEpJR8j1FlVRjdTLZ4FA330dHvyl2Q853PNZvb6fVSeF08mgOrdrePO7qMBlpOGR+74WdIsPjmLyz4SDJP4bY5ufIJ8U+dsU5VgK2s8tuUa25gFZu8L46pPHIC4sqqKppiCVva2tmcnvPI9054dHLKDrtAAcKJdamRtDRI9lelZC8kaOeh8wOip2VQO3dL6m7fh853lgVO/PNFr7nrpvvMj9501O+o1cOb46k3J27aeWGy6SnhElvk0HNsc6v1DnYCQBp1XILEqC0+il1PM5XgsMcUa4Dl/uppaOULOatuvuESUtuMa/hml+p+8xjcTELqH9gkJ0W7b+j2IrABJEeQkOmcXOihDNLyrknlmR/kF+0PpHcAoiaOofJ71Vep9LqMXJIP2gfpsDAYCaqavpNBEVE12vVUWwCg5VVc/zuIMXPLqf6mxspZqlN7u3rlNwUAPmE4CDObm5C2tigfVj5XzgTzyBHXwBd1od8z9jTwgGpoZ4HDo8lAIa/jUkL9No+khZwBoDcenW5UvfnVhvXG4HrzRNAgh53wgeNXxQDb04AZBk2I5Gfyy6+YnKUydM80TNVjxwu45L6B/ogMzGEspaF0Y6St0q2eoCkm5aH8TNWC+DJHrZn904nS5OTt3JRf7cAABwq2EoRxLZjPZyVJ6fqzDzZoVQXCqN1yQG3wwgG2PNrGj5T2a7p7EAPIEZWcK5tOi05fN1qcLiR6wYA2N6/lnCyoSfgQBuEcCyAQDzZIHP4gk+fjuNejRLqzQYZw7FAw0uniwqw9Sa74dPQxkrEykQRnOW2Y+1KreFYAM8iAJE5ghqPHDD0/obVkZUSSulJwVRwus/tnUC8C6i7HTX3JLvPAYjVsX5pJGWkhPASFfu8OHjUmVc8HD9zAYl8gFYJNU7kTaZnrd8NZ+5XAEIJvGhkLp5IahhpuD/yXdDb1ylVNQXJpqDfPD9GZF5qvpIDfn9EQAl0PnoAd19k/w9S4Rdh7F4alFmOsgAAAABJRU5ErkJggg==", "principal": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADTUlEQVR4nNVXXUgUURQ+s85OZtoPwYawiq6YLkVS+ORD9FZEhUovQQVJ4UMFpqKUggSKbagYaWBkQj30kKlZgfRUUSo9GEGxhliihviHkVvp7trEOXLHOz+7O7OuD30w3Nkz5+75znfPmXsHwAJysjLkWPhEBbfLKY8+3i3jyAfjA+I9+mwYif0ZDvlti4sCMEKMFHvGEzQDmxVnXyAOBgZm4cOTayp7vOCH21cS6ZlVCGYdmay24CJ03thOtnR3JY3fvB4aC6tXwB9Ypnvv10nT/x0WKClb27+f2klivFBu/F1xWKILlwDtaEPfzNRkU7UgaA3aSa2XZcg7VAWy/wccOHWHMpTsmxQ7ov9VHVxo8pP9dO4MlF1tJv+nvS1w/ZF6lT9+GRXCEnC7nHLdWTvkn6xWbD2dtVD1IED3lxa2wF1HUJGaBz5rTvpJ9x0VmxXiiLHRNjhStggj41ORCTRclCA7VaQ13nOihuylM4m6gH67WmEpICj2lh2/SBEs2Mb6EijMTzYkYNP9KwC8fjmpy4zHrqICaHL4KAi7WOaMCM7hVWq7NwaiGKeLJWoNq9XrlIs5W8qZQhqn73fTWPOiHT731qvmZR2tVhGceNilet7t3Qkj4/rOEI0UQOm0YMERS7KktB7fjipfO5iCzchoVGBWMeSbj56AZKAAj2BwBdIy1haJV8OoOGOuQKJ9BWIFMRoFsAYYhseDuuyZ/KhUVASsorzVTy02uDwHYLF8bJEcwmXBZ583sWQtspUamOZaECWOtEQ8tAW67hoY8s1Drg8gO79BsR2cWt0nooEYWoEElY3WdwMgmlGA+ppblf6UeOjzJCg1UHIrvAqzczhZv5khIhYhVrfZt1o0EM10wZtkuy5D3FoZjLLHOesi8O79AqS7AYZ7yukwcazyt9Ju4VoOA6NqHaWSsg1TIIOtGGF4cMRjGWvF5561YpyaDsK5m38Ms2YZ9zUmUVDcfgvcq0v3bMQR8qAqhEzFgAhuu6yvURH2ksLsGFGWMQsaKrApAloixzNnoPh8mqIGHkSRhKcoHgYHviv+GBzt2uOXEQSwAJ7I3n3boLF3K3TVxqmyxhbWnnxjDrfLSed+/jvB6idZTJCj+Tj9L/EP5wKux/MdW4cAAAAASUVORK5CYII="};
  const KEY = { principal: 'ckmm_principal', excl: 'ckmm_excl', preg: 'ckmm_preg' };
  const cargar = S => {
    if (S._ckmmCarga) return; S._ckmmCarga = true;
    Object.keys(KEY).forEach(k => {
      if (S.textures.exists(KEY[k])) return;
      const im = new Image(); im.onload = () => { try { if (!S.textures.exists(KEY[k])) S.textures.addImage(KEY[k], im); } catch (e) {} }; im.src = ARTE[k];
    });
  };
  // dónde empieza el dibujo de cada cuadro (filas transparentes de arriba), medido una vez
  const alto = {};
  const cv = document.createElement('canvas'), g = cv.getContext('2d', { willReadFrequently: true });
  const opaco = (S, sp) => {
    const f = sp.frame; if (!f || !f.source || !f.source.image) return null;
    const k = sp.texture.key + ':' + f.name;
    if (alto[k] !== undefined) return alto[k];
    try {
      const w = f.cutWidth, h = f.cutHeight; cv.width = w; cv.height = h; g.clearRect(0, 0, w, h);
      g.drawImage(f.source.image, f.cutX, f.cutY, w, h, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data;
      let top = 0, x0 = w, x1 = 0;
      outer: for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { top = y; break outer; }
      for (let y = top; y < Math.min(h, top + 6); y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
      alto[k] = { top, cx: x0 <= x1 ? (x0 + x1) / 2 : w / 2, w, h };
    } catch (e) { alto[k] = null; }
    return alto[k];
  };
  // el personaje que está debajo de una marca vieja
  const debajo = (S, mx, my) => {
    let mejor = null, md = 1e9;
    S.children.list.forEach(o => {
      if (o.type !== 'Sprite' || !o.visible || !o.active || o.alpha < 0.3 || o === S.player || (o.texture && /^ckmm_|^ck_luz|^fx_|niebla|humo/.test(o.texture.key))) return;
      if (S.enemies && o.isDead !== undefined && S.enemies.contains && S.enemies.contains(o)) return;
      const b = o.getBounds(); if (b.width > 140 || b.height > 160 || b.width < 6) return;
      const cx = b.centerX, dx = Math.abs(cx - mx); if (dx > 34) return;
      const dy = b.bottom - my; if (dy < 10 || dy > 140) return;
      const d = dx * 2 + Math.abs(dy - 60) * 0.5;
      if (d < md) { md = d; mejor = o; }
    });
    return mejor;
  };
  const icono = (S, store, clave) => {
    let im = store[clave];
    if (!im || !im.active) {
      if (!S.textures.exists(KEY[clave])) return null;
      im = store[clave] = S.add.image(0, 0, KEY[clave]).setOrigin(0.5, 1).setDepth(29600).setScale(0.6);
    }
    return im;
  };
  const poner = (S, im, viejo) => {
    if (!viejo || !viejo.active || !viejo.visible) { im.setVisible(false); return; }
    viejo.setAlpha(0);
    let x = viejo.x, y = viejo.y;
    const sp = debajo(S, viejo.x, viejo.y);
    if (sp) {
      const o = opaco(S, sp), b = sp.getBounds();
      if (o) {
        const sx = Math.abs(sp.scaleX) || 1, sy = Math.abs(sp.scaleY) || 1;
        y = b.top + o.top * sy - 3;
        x = sp.flipX ? b.right - o.cx * sx : b.left + o.cx * sx;
        // el centro del cuerpo, no el de la primera fila (un sombrero o una espada la corren de costado)
        x = (x + b.centerX) / 2;
      } else { x = b.centerX; y = b.top - 2; }
    }
    const t = S.time.now;
    im.setVisible(true).setPosition(Math.round(x), Math.round(y + Math.sin(t / 260) * 1.6));
    im.setScale(0.6 * (1 + Math.sin(t / 520) * 0.04));
  };
  const u0 = P.update;
  P.update = function () {
    const r = u0.apply(this, arguments);
    try {
      if (!this.gameStarted || !this.children) return r;
      cargar(this);
      const st = this._ckmm = this._ckmm || { p: {}, h: [] };
      // la de la historia
      const q = this._questMark;
      const ip = icono(this, st.p, 'principal');
      if (ip) poner(this, ip, q && q.visible && q.text === '!' ? q : null);
      // las de las misiones secundarias (ck_heroes_npc.js)
      const L = this._ckHeroesNpc || [];
      L.forEach((o, i) => {
        const m = o.marca, s = st.h[i] = st.h[i] || {};
        const clave = m && m.text === '?' ? 'preg' : 'excl';
        Object.keys(s).forEach(k => { if (k !== clave && s[k] && s[k].active) s[k].setVisible(false); });
        const im = icono(this, s, clave); if (!im) return;
        poner(this, im, m && m.visible ? m : null);
      });
      for (let i = L.length; i < st.h.length; i++) Object.values(st.h[i] || {}).forEach(im => im && im.active && im.setVisible(false));
      const dlg = this.dialogOpen || this._ckEscena || this._cutscene;
      if (dlg) { if (ip) ip.setVisible(false); st.h.forEach(s => Object.values(s).forEach(im => im && im.active && im.setVisible(false))); }
    } catch (e) {}
    return r;
  };
  window.CK_MARCAS = { debajo, opaco };
})();
