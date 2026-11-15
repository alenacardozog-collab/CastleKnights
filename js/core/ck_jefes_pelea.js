'use strict';
/* Peleas con más peso (14/11, notas del dueño 90 y 91, en la Fosa: "quita el nombre encima de los personajes q ya salen la barra
   de vida enorme como los jefes, dale mas sonidos de foley a sus movimientos como swoosh de zarpazos y asi, tambien q no sean
   tan debiles y que tengan patrones con mas anticipacion y movimientos veloces, para q no se vea robotico y repetitivo";
   "q las peleas sean mas contundentes, que los npc jefes tengan su leitmotiv y musica acorde a su raza y pelea pero que nos de
   toques de accion y emocion, me faltan los carteles de pelea al encontrar al jefe como garra negra").
   - LEITMOTIV DE JEFE (ElevenLabs, assets/Music/jefe_*.mp3, en bucle sin corte, al volumen de los demás temas): mientras un
     jefe está en pelea cerca suena el de su raza, también en el Coliseo:
       · jefe_bestia: tambores tribales, metales graves y cantos guturales (Garra Negra, Kragmor, Ulrak y Colmillo, huargos jefe);
       · jefe_orco: tambores de guerra, cuernos y el coro del público (Gorvak, Grushak, el Caudillo, campeones orcos);
       · jefe_muerto: coro, órgano y campanas (el Nigromante, el Gran Esqueleto);
       · jefe_demonio: órgano, metales distorsionados y percusión de hierro (los demonios, el brujo, los gólems del infierno).
   - CARTEL DE PELEA para Garra Negra (como las presentaciones de los demás jefes): su retrato (PixelLab), letras que caen,
     franja rota y su aullido. Sale la primera vez que se lo enfrenta.
   - Sin nombres flotantes sobre los jefes: el nombre ya está en la barra grande de abajo.
   - GOLPES CONTUNDENTES contra un jefe: impacto grave (ElevenLabs) y un temblor corto de la cámara.
   - LAS BESTIAS (hombre oso, hombre lobo, huargo y Garra Negra): zarpazos y mordiscos que suenan (ElevenLabs); antes de pegar
     se agachan un tiempo distinto cada vez (se las ve venir) y se tiran encima de golpe, un salto corto y rápido hacia el
     héroe; a veces encadenan un segundo zarpazo; el tiempo entre ataques varía. En la Cueva tienen un 60 % más de vida.
   - Los aliados de una pelea (Urso contra Garra Negra, marcados con _ckAliado) pelean aunque sea la campaña.
   Borrar la línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const azar = (a, b) => a + Math.random() * (b - a);
  const vivo = e => e && e.active && !e.isDead;
  const idDe = S => { const m = /^ed_([a-z0-9_]+)\./.exec((S.currentZoneKey && S.currentZoneKey()) || ''); return m ? m[1] : ''; };

  // ================================================================== jefes: quién es y de qué raza
  const EXTRA = { werebear_jefe: 1, bestia_kragmor: 1, cazador_ulrak: 1, orc_campeon: 1, orc_warlord: 1 };
  const esJefe = e => !!(e && ((e.def && e.def.boss) || EXTRA[e.type] || (window.CK_JEFES_FX && CK_JEFES_FX.JEFES && CK_JEFES_FX.JEFES[e.type]) || e._ckJefe));
  const RAZA = [
    [/demon|warlock|brujo|golem|infierno/, 'jefe_demonio'],
    [/necro|skeleton|esqueleto|lich|muerto|fantasma/, 'jefe_muerto'],
    [/werebear|bear|oso|warg|huargo|wolf|lobo|kragmor|gorila|ulrak|colmillo|bestia/, 'jefe_bestia'],
    [/orc|orco|caudillo|gorvak|grushak/, 'jefe_orco']
  ];
  const temaDe = e => { const t = (e.type || '') + ' ' + ((e.def && e.def.name) || '').toLowerCase(); const r = RAZA.find(q => q[0].test(t)); return e._ckTema || (r ? r[1] : 'jefe_orco'); };
  const TEMAS = ['jefe_bestia', 'jefe_orco', 'jefe_muerto', 'jefe_demonio'];
  const jefeEnPelea = S => {
    if (!S.enemies || !S.player) return null;
    let mejor = null, d0 = 1e9;
    S.enemies.getChildren().forEach(e => {
      if (!vivo(e) || !esJefe(e) || e.state === 'dormant' || !e.visible) return;
      const d = Math.hypot(e.x - S.player.x, e.y - S.player.y);
      if (d < 620 && (e.state === 'chase' || d < 320) && d < d0) { d0 = d; mejor = e; }
    });
    return mejor;
  };
  // ================================================================== 1. el leitmotiv
  const precargar = () => {
    if (typeof music === 'undefined' || !music.audioElements) return;
    TEMAS.forEach(n => {
      if (music.audioElements[n] !== undefined) return;
      const a = new Audio('assets/Music/' + n + '.mp3');
      a.loop = true; a.preload = 'auto'; a.volume = music.enabled ? music.volume : 0;
      a.addEventListener('error', () => { if (music.audioElements[n] === a) music.audioElements[n] = null; });
      music.audioElements[n] = a;
    });
  };
  const mf0 = P.musicForZone;
  if (mf0) P.musicForZone = function (key) {
    const base = mf0.apply(this, arguments);
    try {
      if (!this._ckJpPre) { this._ckJpPre = true; precargar(); }
      if (this._gameMode !== 'campaign') return base;
      const now = this.time ? this.time.now : 0;
      const e = jefeEnPelea(this);
      if (e) { this._ckJpTema = temaDe(e); this._ckJpHasta = now + 4000; }
      const t = now < (this._ckJpHasta || 0) ? this._ckJpTema : null;
      if (t && typeof music !== 'undefined' && music.audioElements && music.audioElements[t] !== null) return t;
    } catch (er) {}
    return base;
  };

  // ================================================================== 2. el cartel de pelea de Garra Negra
  const RETRATO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAocklEQVR4nO1dC7AcVZnuO9MCyTUQgyQkrKiRh4D4QpEs4bEJIIhQioiYcjEWKAWChRslrGiVW5pdgmaXRZSFlTJm2cgrusuuIgpIeFRQISghICFcAtkEQngE4g0PZ+7d+k/31/c//5zT5/TrTt8wX9WtvjPT093T/Z/v/O/TNzQ0HPTQQ7fQ6NqZe+ihJ4A9dBs9Buyhq+gJYA9dRU8Ae+gqegLYQ1fRE8AeuoqeAPbQVfQEsIeuoieAPXQVPQHsoavoCWAPXUXY3dNvn2g2G14ZHu32UF/wOkdPAEfjJof6bW61WqNx2jGBngCWiB133EFjvgPefbDa7rzLpKB/3Hj1/+DL24IVd/5SY8p2QSbk5+XCPRYYtieAo8B4ELyq0BrDjNrXS0gtjh3DWOdrRoK37/7vN+5HTMjx+xW3eAtPoy8MGs10YdvnHfsEb+ifGPxlcIt6veaxNbVnwh4DloFmqAQj681spQgTCZzaNoNgqB29h20aIHxpbFwnbNcMSLrRaOhE0OX22OOt6vXEXaeo7cOrVgZDw60OwZp19InalLwi1gmBGYcdazzPSy8+r71e/cDvnNfGBfDVV1+rHRNu135AxUrxA+gGE5iEjxgtDY2Y+cpA3dlvu2VApZM1w+DyBfPU68/PX1gpA4JpwYDAtm2DavvCC8+q7Q5hXzAUNNVUSsI5I2Y6yWw2TN39r5xGDVnb9/3+DvX/1q0j03FdrePtkgFb8ZiasvvU0TmfpyHxWmtY7SuZ0RckdFzwSNjg3sFrwvjx/eqP0Ah0xTGsjehFCLvBTFXpIjg+pp7JkyeqP3rdDVcFhAAMKPGSg/mI8UxMR++ZBA/Y74CDNF1UGicyUtNNRmx0g5kqQ+wGMY78MaAPVeU7lJZxnRgxHG1rtAomIuaDcJOgrbnv5+r/wW2tYHDL5krOB9cLx4YNT6it1AUlECFxwcaQsH6lUXPkrBONDPqn9QPq9W6TJik/IfkLTZGUbljJ4Whao1VNg5xZOfNpwtcu8dzNUBkSJAB59bky0Giy38bY38WeJIQdxxIzxnZhBYMpblp6iXp99CnnVKJzQKcZ+OPN2vvvPOhYZXUWHdkyxkvgVq+0dgH5+bS3TM91/tUGfx8J/9Rpe6j/+3faUW3XDgyoAYHz7jl9P6OfEQw4+Mqrartp04bU80viKPP5VcuA8aicMOGNQdUw6XitdrMUhuL+REQjuL/OZWxUgUbQCia3h6IXgy8n7zU8RCNhwFc2seO11WB1CV+ZfsrKBBDMN2/uyVUcvkO3nH/GqcbP6YEMlXB8gsnPJ4HPoQsCeZlP6oxbntukMdY3t0U64uzXYoLeMbKGJ258Qqkl8joko/JBC+Hj6pItIlNWFo+6hqAKNEOjTkE/zCee6YuqXStjOcsk14yRwVAsiwkrEUCMoo9/wjyCysaZ535Oe33F936U6zjSP/amN73ZuB/3r+X53Bc7x9kz0hqeMiXS/eZuGwy2bnk2WDYhUgESvDoiYCYmk35D4LZf36ipLE8OPKy2YFJk2xAjk2unDCZsjHX2GE0/FhkTMCjqgK0UahPWLwfNNlX5P02WdB6UenWcQUbD8avOUcC9YrJu05ivqC7nws4iX5C/T6yFWPCTjz2oLFgw4dnxfps2xjpfLJQfmnlUKuNJYH9YzVKHhNA98tDK0lSpRmWsZBGMbvrNxir6WTo/d59IkOExFER6dpm6tknnIx8kEUBRogmrEL55p59a6bQMK/unV323FB0PbhQCTbFVM10W9BtivhTrNTmaoR4c9MHDC53rqGNOUtunnv6/hPF8wnpjIhumbD9SGogRso5QLozdRr/n1Fk1OJvSNMxfFyWVUqUhik22U9mxNdwqbj3Fbp5x48Lg5ZdbTgNFZkZzHY8LXFnWK7Bx/YAyFGw1IhLS2rUJINgP+9N5CO981we0z4sKMHRO6KZUw0LCJ3XFWjHgUDsltJdiseUFCWEaVP5dij5UJ6u27kAibZkoVSLo4ngo6JlnIn2BcvIIC+adrrbzF15R/Fyx597EgPAL/svia4MwaCbWok3gqmA+gtQlwSjQrVzw3U9CMp/UF6V/DyD/ns0STwqkWhHzlqULjmqS3KRJ5fiOCDQFp02/BBnb3F7Zbvz4/kK/zdeXigygMlGpAN595z1qi4gIUuRhGGTNQ8P+KtLCvvHgH6IR/a73RtkfHKbpt2orF0kJ3bKmB2PG40yH3EE+jSJ7aPFZ31Hbb6+4XUvzShIv4tc89xA+waIC2dU0YTWiHFViphBflpgyHZ+zQ52s3LLgYr9osLaCRkD/DFsTNCh5I/5GHMuP9Pmh9kjeo/QqjHynJgKYlnYPgwH5gcfNOc/IhNJqTS42Y1IrdM4LL75CXReyVZBVklX3s+l2/HMu4KQnEVOk6VVFgN8B6xfgzEfC97UZkdU69/Kvqu3093xY2x/vB2fpr8GMy19cp7Z3P7RW3X/UO5eRDdOoQ2w2jc3oePij6Eqe41dei1JDdu3faUdVBmpCcj9zokxLuNSMaPLvpUVCjjpmptque3y99v5ZFy7SpmToKf++cL62H3TIEz8bMeeNP46YFDDpgFQX8r6/Pl5jwKwRD1/GpDw7nqaP7BEwoLROn8pp5crrQuazzbqVwqYc9H1BsOYPN49kjreHE6b83sN/UNv7bv9P7Xv7vPfD2mCuZT5gXrZJdA4SQqXclnM9/ePDUbOCpYogM0ZkOWVR0O/xYV3TM2k061EgXKoAYkQona7d6mDCW351l/aa/HTKVdJuBUNUO3LtCKO5XCwm2KxhXMfCH16jRUKgs0lmA7PkhcycRsRC6oJTM/oFoYMS6Lqh+4H5KFPaR0dWRhz5aTc+pb1PVnCURR6xOOmKnCkhyGOjJsQz6qGYT41G//QNuikYwa5wHGHSrrsU0tnAnBN39bPSSf8yZawUZb/xImlCO/ZOO3p7BqSQ0vRLQhe1f1N7GNmzihS76gQwJU9v0VURE2FkARiRk6eZW2rgcxI+umnwMx562CFqi9eIvOA4n5xzkhaBgZ8ODzSN8Uy6oi1TGQ8XffkAMCyYjvd4ycOE0PmApzZuiHTnDMYB6aozTzhDEcCBU96i3vvjJp0RO+570FaFXmWi6wyYF3l0GCjjebJkMp8rw/EHC3ZAIMGjEJkv4DxWjNnsFCj4WaVAk7qUxW/b/bpgoQuC+W669jK1fce+e2c6ntRZLv3uvwUbnn42mHd+VG8MSAaUNSKLFt+gveax4jQmlP42yYCSSVG9JrNhbD1fXrJ0QpDHtdX7ZgEJ4Xum6DMNMSD376HjBIyrKnrIVB8JqYAJt279s9qS8OUBKvZoOil7RPugyn7RvjBFMDqmcHp2rVZH6HNsMSDQbuVmPonHHnlUbb/9D7ofEEwIBvzZsogh7llxr/Y5cNLpX/FiQt/OBpKp4I/z7QXj6+8DwIDv2z3S4TiThc1IX4sylPQWIqb9aSBut71hoqr7+oHXLlPvvrGIhiEZQLlSlD81So/zuvdl9s6pQ2cE/jxXrfh5h1O4CMCgYDRYv4sujhhWYuF3v67lJwJfnvspzT9oQ9asFrJKiXG4vzHP8bZ4+CNJyE6Yvq/xM7z/j5TJbPh81ab1yiDrZn/AagrTue+oBg73/om7Rf8IAXy9o1UD0i9VAGWdrexWlTeyAcgIB15jKzsk8HgwBxgzL2yxYYTGdpk40disSDLi+NgP6ROJyRJGtDFiHVFNXTDl7NWA+eqM0c6cCWv6PEqxguHvg88I+X7S2k3LXM6zny9cvWKkDmjrgmXLhpGMJdkK3eoRAiMmzCqA29gxpT/yt3fdonRBZLPYQLogPSNYwfc/HWUljXkdMMlUDsYmonLR7FkmfP+q2W98/B3TuSJfZpiZCX3WLakapckM79Nn8/O5GO3WX96mtrOPnWX8/PqlP00ynHle24Lzz1QFT7bvrX88yug99bTo+jY9HUVU1j4a+eno+0Wq9aRwwMqFrjdhgq4TkpVMGBqOBq5PJEaey+RSkpnMxHgcMt8vckZ3lzbGKmlpjJWl2g7CVxVc7Cadwi1D+pRkOR/GNHU3Tc4RD9TRjtePmg6ITgew8i6+IKrFACNR5IKnTEkmtOl8YMSzLlg4chPjm8aD5eh5fPrJf6Nlv9gs4nvuiFYSAsCEPF/Q9NBdGdFcF4QQ+ZRMvmBp7Wvr4ACYIiNc0JBtRJnMnAEVMxqEb7uNhJDw+eTtudhObQv2IvFxhpdhoXarPqSF5Sr60hkQPaFp280oUKkCiJFs0sVI+CTDyewWzog0VYL5bCD9KcvyAtAhAeiSEpy9fBjPZrTg/TQDwtSPEPeRMyP97+pRTeAZzPw9YrxEJ1Ts1w7uv/O/1UvUzHQDlbRnKwM+67yVsbZFGTfeJqjdYMGWpf5jiK0l0q01QUoXwGSlcEvkw+XPQ74eYrTY3zdS8ba37p2J+Z5/7sWRWpT2cHDo/ntp+z2wcUvHKpNciIrWitgiIxLy/Re3bNGsZ6wP8qcH71XXB10QvaBlLccFB8/W639j4H53MyRXLBJCIypeHLAqT3uWzGJfazi1gxdjiDrV+Q5RWhUzdDGdj/V+N4WsYMR+sTabbwxXAtYupl1ktax45DGlIFOBNVeU5VpnX/3Cx426J477m18tV9vrbotrSATzSSxfvda4IpELUneU9bmyLnm8Z1MhXytZWsXUzy9Bu5XU0nCjpNvZMIVjwVXpE0+90kiEzsdK89EZ6TA+0w1n8zK7AJh61IwviWVdgqx+e7upeRTqkA2TiwGJ+Ujwvr/gfCPz5I35wipe9UD0vrSCYfWSQJKQ/HTxJan+Q/j3qBaFH+eIA3QG3GP3N2sp/nh9w/LfKlcFnMUuK1SuGedjtWaZRtOYEIJM5Zm7TpuelIHyYnhZCoCM6jEZC07zvJcNMBLYlqZklx7HUWikdylTOAs4i1I98p6GxuZ1qEMpLICwem1ljbA20yIRaTFfWMWz4+0aS2zXFuH4xX/dqL1H1i4BOiR0Juh4YELJfHh98hEfSnRHHyHOynyAy0/oAu//57t/XZBZByRFdqysPq4q/lXVf5dTPkYBDdXVwI+t6/T8MumAsHovXzBPvf7OlT/TPh8YWGMMB8EfhQgHjIas+X62yAmw/PYVanvVDb9J1s+l6rDdpuxp3B/986RVDCYElt56j9Uq5lEQ3xXTs2JDCmOZFs3mbGjrs0ix9L+0Rj/223EtpVq9Yhl707TlY62WBdWuIoX98jCBnOaq9BVu85iSTUvSpgmf3KfbCLPofqfMinqwHPhuMFfEgOueeNRrmiP2y8J8sJI/e9631Xa3SZOCqTsNKRcNz36RICaW/QB5NgsiGsjDu/uRdcrYkExoKnwn5pARibKxzbICO3RYvA8dVnUuHbZ3ke2mlVuKDuhSwGGRGum+Ty8KKpKPx4WvbKuXukOlduPqi6I9qg8LRSUK9kbOg/EssUGCDC1bR9Q6I9MchIxiCaRJ8SmNhJFiwyR8SIGyZSwDMhaMjgZf+MRRWhcsipSQIF505TL1mtbM5ddiYz4XEyYRkNVrkzR9U3YJrPjPz1+otvJ8vtk0NoDhbLFiGwlMmaZHWnAc1bk2DLuS7+dCueYQy7jAaCyrGN3Ehpvj/8vw6Et9qw5RgvEZBDiNweuMQle95LKvqe3Mj8xVDwxdsGz1uWAOQDLiNUuuUXoXWaHDk/cJLvvhv6r3r77qP7T9KEaMmCaHZAzfLvgQPqljUUcHPoDk9YMlYaXi+5RNgzqQPNjDYkVLa5gYG806pW7Kp2v63mgtIF6ZH9DFCGWpH3CB9D2jN3nkIIPHNuLzljvavieL2m3ohvoVxioPjwqRfjqWMmRS/YCo91XTaruVxF5lZ9K377N36nQrmYP8hzSFAj9a+n1tP/qcQkq/vOEHScYuAToZhA9WqBSivOt/yPpd9LSRNSQUo+ZeAZO/kKOoX3CD7HofCx78sfBKHHLcXGNNi+wdXSerOHUKjpZNiMx6evCwYJ8c3CHYs/+1ZOGZLHre88/HyZWvNDQhdIFnccgO+jKU5erlLIHv80TUPIwm64urjIkPGWLhVZ+/CnhJzpzZhyjdDHl1G59+NtgYMyAJoax6IyuVplJpNV+9JLJal10d6XaPr4n6/H1uzhfV9jOnfULzKyK2K2+q9L+B8VyChxUeiV0pa0QiL/PBX4jrhO5IVj3dn6NPOScXE25gzMfrn7944cXGCBD6L9L5eA0JrPw6xYC9BJB7y3mg3sReWareslrGMtyUtXMBgM71JuEzXR+iNnCg++rBeSz/bYbfpLJ+4mUsTBnfmE2ACRPemFzHWLGKnVdJ0zCYDBGJ6674ptahFMwFhoROd+FF0Uo711+zRG2hQ5pAQk0Moyy6OKryjUVXqqlmKvNv5dHxbLUc6GbPmck09YL5AGRWT58eZWYPDET+Q+kvJNCgNE2N3E+Xmk3TbgWXXzRf8xp8KxY8VPWhswOHLZGW9Mesq5R21QqmYD6AEUojDaMtDWTJ0p/PaCRGpYfUkf1cQfU+mLBj5UfL0qMye7iMbOKyYsitYXs9jLSGs5ax1oQBR+70po1PaA0fD5nxAU23I78dn36uWx5FMlT4KuUcPJZp6irvgm+1mk/GMjEwXC+yh7Ss6SAGJXYDQ0k8/JBeGwNAF1sV65rAgTOO1z63hdYo35KuEQyots0wuOt/fhikAbrg5k1P1qYlcejT9Yo/HNNCJWnxWZ8RV/W98PWLRQsl8tX4opZzNgYjQc5y7SY9r58NWL4CFAmIK+sb51arHLHMbdc11UX4vBiQhPCkueclN4am5MEtm7V1P2TrB8R0Vf8Wpc+Z2/zLns6ubvKmLvSmfDgXpJ8MRknU2JtZv/EyBVmtV3TxB0Mhy4aYnuLWchVQADrkXu89Pgj7Wom1jdVEF8S630c+dqISXOiWaM9GESkX6uak9s6GUaEvwX5cF8KWRw64/lgV8lat0YPAX9qxbDmDpgdJv53/ftwTeBAk8fRbrOWOBFNaIssQSpPZ6VI3rVNdsw2hT69nMIbq/h401RpjHQfqG/HrEWNG0ZPhaKkAukmG4h7ofjbmk2uqScAaxsrk3M9HkDFa6bCWnUaDx6I8QvjZpsSZ1LLellanxBRsAl8VlI5HERLTDPBgSvUgTav4nk1w4S2AbucKK9aN/QjmISh0H/wgrElmSnqUViJNXVqhjMGarUIVkatUmixbFzNUoSPZDjkujiZJqOaVlsgGUtxM67n51CPbBk43YP71se4jIXUhuR4GrEZTLJJ/Ljsp+DKf6X0qN3wp/p9YcGL/iK4YVcO1khCbS/Dk75PMJyGFm4SChAN1yPI+qKyU4SA484JFama4KY5cSNB1k7ozRUR8oFOSDkjngfC5alHy5Bd23QjxqZfADUCLibSUnyiuXH7skupebYv8yfNXAannkhDKftMd1+JwSw1ZyhusnU7HMIxShu4DLuuPf57GLtBRwISoH+6I8Tp0Phts6+3CApc9mG3M5mI8uR/NAMRU0BnviLNSUIcMHRNdrGw9YyQwkGXmNgBdOyuICdFpq9YCSA9uhzA7ZbimOKxfBuRxoWTBaHj96fpfaxk6kIrpmfsAZbOlIqtQefW6EbNZlrWFq0aYtt6HCz4r/Jj2I12GrLz9DswW8ciKqh2uyMpJIhtxTxvpQAYTkqqA1dYJx33qHKVvY12V3d/ydu172Bdb6Nwfm/sVNZCz/jzEftHTuw7QpaxNugn1+6v2pGMlUyMLuDCQf847AtQyVxKmCVeyLkhKh33XbFQXXVKXhGYYDLVawdQp6bqfLZ3JprPIzyUj5tX98oL8eFl0Phvk9xGxCDK2Ank5TmOz5T9ywWvEj4wEHP7T1Q/8rsPvyY0fGVKtU0a0Fgmpa+HKWAHdP34P0ZmKw8diN0EeK0u/mzr1gpHIdWXkbyuCqhnPN/OXrFNjRMQBWpuNdDH0ZJZMCGsfLdG40HEdcEPcm0bqxjbvA6x5nI86oHJ2kwRCVu9I4VLw+lktc3tHmuUO9cQ2m0gGbInptmyvAK6jG50cfFAJN2fNWC4K+P9suqeLEYnROD4086hU5rMBzIQOpT4IxYIy/DgcxKY2nRXMCOHf/PyIkNe1I4KRAeusK2RB1t+Bfi9ex+7Lb0Hy6VfGg8eNy77SgJxWSTWS6lHd9Xrjk7IV/eStt8XqkVVDqyIzJEykgSdOwEoGwDxwfyyYF62F9/cXX6Xpgi5IPyBY77g552k1JllAv1M+lzolG7wurWBVFZZB6Y4ykdPvAVmh8ph59CqTFTyU00CIMriDMY1Q64BggY35wHASB33w8EQnIzZ95KGV2uf0mh70Ucek95J24bZf6z2hEeb61rwvJFkjPoD/DesFy+yS5zYOBC/1T0yEFMe1rS/s42qhfcJYVfigY6Vzm86q/IIp3phu+ftUP0nWrBSzkel6QlMKVpmZtHQs3nGAgAuTndtNfrM0mPS2LN3zJYzJn7FiT8muMqMnbzYPpuIJORsY4XdTTNdWyVcHoBVw2syqesMQA9JOtr56UpeDtWmyylxCxH1jD6/SmXHW0X6Mdcuv9FUvgRt/fIkxwRORBluVmgSYDfl88OsBWGXyoMM+qhzC0986XSXCyvsldTHoinn9j89tHNDqmW2Z5JhhymLAtNgxN/hgbcte4pT/yMmCX1fYTQu4ykyYMkGjGHl/tgiEq9vCaCMcheeJc5ji3pz1eB9rydjJKxNNgumkFeuKod5+W6duRoDCbBM80un4FIf6YOiQJoUbPVPSGO4X/3ur9ho9oROgXIA12ARIh0XK1cL5nR0ICHB9yPslGRDMJ3XFnS3uGQBWebd6u4CxwISo6kNXrsNPiPpBviGMmO/ma6PsHvTEwcwEa593Zih9mNAUC0FRBUlxqw2s0J0GZVW246QIJmy89kG5S1geYd6MK+17fPBZ9BWXjw4FUds7wj7zSgeqZyP1zmYiZcv35Lp0mDa/S+vXNlJlJOHUWdl0Gwlaoy1oNkeYj/2IKCOEhDkMjpwV6YxLbrrfeBx8n3Q0wsATutXuyvhG/h0A6xcZycrgaY7ofDDepNUP5oTfELrbRuFFkPdX+iNtq4VK0GxWxDiRVizvkobaHnoGP1/6PfUaW7RrQZ9CAP0kkfdITAiCKU0HLDPW6GJKU3cG67EM07YagR4PSPnZ4p9lYlpbPp/NGV5U521kyCAvci75u0yy4ZuN45o51JFdXeVtwGqLGBk2oH8eWnhgRaWsUyhuhLSWkV0js0+gQ1K+HM8KybK+B/kVMcIBuaK7dFthiiErkFqo2fyG02JdEUxoi2WTFZ6oNSkDB3mBRWHzJhw/59zoGthrmgWgg7//oAPV9tfXXaZ9LkFMSJ4J1b2/yIX6xi47escwRT/MEIUpMrVwp2gW1GmducYoXYqtVlneE9szw1Rs88nyPpJhnoaP0PlOFZ1CJePxrlfKeIiNkrPP/nLq8X9//0Maw/r2jpERCFOkxhW6Qt8+ElTEfFGrAd3PVvebnEMtZBMGhxweRYRc2G3SJM2/B8jBBl2WGz7c/1gWYL1ygqHnhpmAmM1UbwPBmjBBfx89hCbtuova7rf/fvnzAVUIqdn20vl47Qc9FNVjpgRGybL2bcf0mKIbIY1d6VoeMVaT8CWp8CWsMzwkrlV2fagaqusW1bfEjanyFHvRMVJXocpyQSPMF62jK/Hw6g3BM81Gh7/qS1/6O+P+P/jBpSMX6tlmAuArgXdcx6qVybFMmSEya0ZOJ7BaZSwZfsbohtoLgtTx2DN6ev3jqe2L3xD7EcHw0AXpOul3pFnr5ACXuh9+U95OqAih/dP5pye6HV0/VfGB+U33Fvdn8uQZanvXLxZr68iY0JAjOa2BjZpCU5hvsH9c7ohAHv2mjFXAEaukm+6b6+fT9ct0nKoq0UKDXltmZpNv728Ttm79c+rnHTogbWXsV1mRfZ3d4XnPZNA0n2LBfJde+s/G76EJ99lnf0l7f9myZdpAkCON63p5i3y0JkDxA4Q1J5kP2TLozRIZUZ0PBdc5/wx9dYCV961K/qdzkZ+QBH+/jHXRJubmGdFYKUkaa/D1Zo0Nw2onq5jfH1sWkEv4sLbfjy/5up0BTa9dQLQDwmfqvYwbwlkgTZcompGjGI16IntYzbya7fnnXkzdF/qM7bipLMciPFVYtI1mxM40sFXhuqjS8wV9x1cdyuKVMD3T0OaW4ExoA7rF73vgwVoEAIz2x1sj5jhs/7dp38OqlGBI0gWTUF17pDMoju+yfuk66Xo13bM90nnBlplNuhapDFg3xMZ8ErLXDM4L5vvM6X+rfU6MoQSzydrVZcAGS/crZOnQlu7fKUeYdXO6jzTWZdTLlxHlylg8DY1+z4WLrlLnRx4m1i2BXxA6M2Y1LOmhiKmIrqCm3dinR2Ek314sqaOG+QjpwvPGejGCfWK0vnqrsuIzdFGV360i47xB95w6WnjmQYKhi0a+suizJruBhFAxdtoIg04jIx0YUQRqYjT7yJnq//tW3GzMOpFCJHVDHB9d9a+57d74orPdJBNTkoU5zVLHDAZB3pqN8Uj3Mw2EJE+w3VLT3lHHRPcBsB0P3exnnnCGpgtisMgYtKnPYJpODuA+yv2Uzh60VfYKCYFrYKx/fF30T8yA6GtIVjG8F2kCiVVUr1x2i/odXCfOVRfMHwY3Ojp8fLEvzFtPoP3hP4uZ0Pe7edvPFu3iT9+XfjLAtHaH5h9sWzJvoMfFvz2vPpzmsSDGxOfQl31YkUdJksb19L2c67mExHppeWZpku3y72HkUXZLqx0G55wb6Ya33n5XBxPyER3pfv7ds3yr7sAwiDjA3yeXvLIxH2YIxUCxr4wY5PsLzjdGTNY+2nlf6XhYZwWQMWAyzkj4ZMwazGeLvdN9U87jWLBMzMffx2v8DqnbYmDfuy7yNLwn9vNBt9OQ4nhPGJQNTNxzxYA2azGznsAugjOLygds2tOOTOeuQ7WXk/kKZgANqUiD5TOTrumhd2U1cpTLJqW6jtjXVG9M8d7kuXpGfcDkJHyYHUJTB1M+KnxaqXUw2PJ7OxZ8IYomZuQRD3jw5YiOHnz5CrttlUyJxN8nwGcKYilkBsuYLyICiIFyaPHVgNwk7utWz4V5ByTAZKqvo2E/yXwStuIo/F4Za0ayAWLlZAWTIMPah78Qut7w5Ch/cdvKtUoIOxiQQ/NTtdMjHzbYRlOkL3WvkgvC52R28tc5Bp5fPiH5R/WVkHzQEMf2mQ2q6MXpqxfy6/O5DjCgikCRlHPrl1M4Vvjh2S0+UNkgYRhZte1WcPa5I/4+AnRBGSHh1nUVQDAfjJ/45+T1x0LDdT7CEQfspa2RRzURXJ+zWb2AaVVLVyIsIUp1D5yQM8lNK6PnZWNE3GuXkSNVJunnQ9GRLVObVkulc6EqEIwZZUgxqOkx/rPN674Ckpj2KdYR4q9Zj10W6AZgdSH+V2akIql9yBgHDjPq31mPb7PcRwPc7RPaeh6HKb/IFeMFPvnJORrzIUKC18pQYTcCHnZX5CMrbJnGJiuTvw/dS1bDIZ8NTCChx4wxpba8OzUA5A8kAQbzSoDJMFNJ0Lp0EfYyqBgk5GYfIO4DHwQUc19yU2QNn3bc+wIbyFjhNTrkeTARC7p2Gf2AkYuhPDrq7KnSNteS1qZ19oi+mIcpeIRIvc6oRw8xPbwqb0BSFCSYVls7j82EmIZ9q/+wn62ZaZKhbvswi6HgqgnBNLR5s57VcrKIXZaxcI0JckTLBwyrnOvC0BdNCbS2+mMwX7TKAKr3mh3rCbt0xQaLTpieA3Ry+PywGKLL6sX7igGHzb3A+VJe3A+LrCMSqEuvjjLVF8c64ISJ0fmxXp902+C+o7OD9lutN8EwanPX4IqsDJ+1cKuAvA4Iom1h6MzHZzpkpEsPp/rIWsP2KE6SzZMWzchR+abWfM4Yk/ZNebOxo8quaVti0tB1ZG8YX2GjEYp8QMloeeG73ojcT36OLBmX7oeMGPnaFab7xqIrk4Ek3TYkHHvFViH8hJQZDSuQC+YLLzyr5TzyLG3OgGC+l56LrhW6Id6XwPucIX1WwHLNfrjPp5z5TbXFPaZ7RoNJxt5xPtRl8yycRpHBj7568ubz/D8bRkPfyxJDlQ5qes1zHE1Qn1EBtyVLxvo9tZC3n4qTt77XdPxu33Nja5VXW0N9Mk+MJJYkGX4/aWUlVi3z79HDUB0NyOaavney7+bnRrJi7/vdPc4RmocZbZ/L1TxtTImpQzIhqtCI6UzAesIyewUMtuSyr2l+QkQG1LRKuYFBFE+W+ZIqiygFqzatV9tDdzVbv8k5YtgY0gbMEOjvmLXDrek5jFyTIKs0SZYrcIMtE1+hQBkVb2VGSWD88FHpYkXOhBBGmraU3hozomTGNJ/h4JbN1szohi2eTCls20m3Wt6D28TK2juudWfBhIoZmZuB+/fowRx7/EeVxXv99Usz+Q0BxKRN2Rmu79msWhI8V/3s2oEBzQIFXDoTgdcRH3FkVBUG3HPHHSNWsmI+8n827TqzZ8TJhjKXdaX7BkbjK9Tjsyw1LKbqvELrhEi3ilTa89Yk2BjW53tFWLTqzgNqNkH2cgl1w90CzQxZa5RtchByqwSdUn370F17zVL10KAr2aZgdDr49KdPU9uf/GSJ9jnXUXiVWlbYer7YmI/X3wJ0bjCeK8kVtRgL4loIABESRExkXqAtK2WDp67Gc/7S9pEo6md16eCAlJ+02pOOq0SiJaYxG5Un6VqCqei1ZMbMlrVHL8HRgGuKUdkcFYRUWw4hoYxp1wzRze6znEBc16kJIO/xy9uSdVjDSo+JQEJIOl+iAxp+OHq8vC1mQBu4jtnwKP72hWsFJVjJUuBgkMjpBt+zdUztyAtcfENQBHeL+4+V4NNgGxhVpsIhUxzw6chgDcWlKbWKoVRzxujrYLwyLbcsPQCL9tsrc1UAE7Lel1BMlR1TbgH9cTQ6bMnlYdNg3EvqhBIz9n2H0RoGHlj9p1Sdz2ckkmC4rHJfSD8dVkVy9Qm0MZ+t9/RHPjpbe43VLwlpVWwbPHQ/ijSBCV1WrkstgLcgS59EE6TunKcrf6oUVOWLUqPDI0ZaFtC7uEy9yHcqUxngJWgTr4mbUvQelc6EOVlZrRPigupk2Wf3ByLvDwDjSQYELZPfMPETtlvWfDZ0UACKMqEvJPPamFjl67G6W5k5TkJCgmrrmb1BMB//Xlbg+ZgCB/L+PrAx8uPx+LPPAJXTKgiqyHokXsMYlrEcOar3mwdLyh8HnTGKBoxdRN79TowU7fcFrYzs1xo2eyOciFWhHZgHwTetbmS9D7OApX63oBfAiwHRZ05bsCXOAuEjTjIeXgOIjIAxlR8RSzm0h61MeOdD67RlGorqLoDL3+nLuLbjmPIkTfre3YL5TExrW2nINXOhMy2HZFgIYDfWFfYioCQ5MmY/k/DlOjk7Xlp2CL+BVfu3fDJ5fJCFGVq8FsVw7rz6msopJMKIq/xkbB/7KHQpMpPKgDxLxlapbwKYD4wHSF2RPieXjmZVG3QWqQvarme0IZkJsNVwALx3dhbGzRJhGCvwHuq589JS+uG5/I1pIaS6rjNXVRfUbp2nFgyYVReS0wiEDzHjgw4+pMM/SDdUs649mXA0rGQb00vjSjKfrY4ajuVD49+H35XlPvMV3ruhu5WFSlsUJKlNbXdjRun59wVvElQ1pBvCFec0uUTU90ho2SANMyYJJILvcV/HJAPC6sUUaVsPQwK9ppFFwheq5tOtKULCndNJ0x7WW5AzpIsRwQ4+bgxTl3yf/dV1erpJfHXCN2W8z2DmsawL/j/AHQR+Yy1TpgAAAABJRU5ErkJggg==';
  const presentar = () => {
    const PR = window.CK_PRESENTACIONES, A = window.CK_PRES_ARTE;
    if (!PR || !A || PR.POR_ID.garra) return;
    const c = { id: 'garra', nombre: 'GARRA NEGRA', etiqueta: 'Jefe', titulo: 'Señor de la manada', lado: 'enemigo', fuente: 'orco', tema: 'golpe',
      tipos: ['werebear_jefe'], colores: ['#ffe2d6', '#e0452f', '#4a0d0a'], contorno: '#0c0403', banda: ['#140707', '#3e1210'], acento: '#ff5a3c', resp: 'ck_f_garra_aullido' };
    A.retratos.garra = RETRATO;
    PR.ELENCO.push(c); PR.POR_ID.garra = c; PR.POR_TIPO.werebear_jefe = c;
  };
  presentar();

  // ================================================================== 3. sin nombres flotantes; bestias más duras en la Cueva
  const CUEVA = /^cueva_(fosa|grutas|galerias)$/;
  const BESTIA = { werebear: 'ck_f_zarpazo', werewolf: 'ck_f_zarpazo', warg: 'ck_f_mordisco', werebear_jefe: 'ck_f_zarpazo2' };
  const se0 = P.spawnEnemy;
  P.spawnEnemy = function (x, y, tipo) {
    const e = se0.apply(this, arguments);
    try {
      if (e && esJefe(e) && e.nameTag) { e.nameTag.destroy(); e.nameTag = null; }
      if (e && BESTIA[e.type] && CUEVA.test(idDe(this)) && !e._ckJpDura) {
        e._ckJpDura = true;
        if (e.type !== 'werebear_jefe') e.maxHp = e.hp = Math.round((e.maxHp || e.hp || 2) * 1.6 * 4) / 4;
      }
    } catch (er) {}
    return e;
  };

  // ================================================================== 4. golpes contundentes contra los jefes
  const de0 = P.damageEnemy;
  P.damageEnemy = function (enemy, amount) {
    const antes = enemy && enemy.hp;
    const r = de0.apply(this, arguments);
    try {
      if (enemy && esJefe(enemy) && antes !== undefined && enemy.hp < antes) {
        son('ck_f_impacto', 0.5, { minGap: 140, rate: 0.9 + Math.random() * 0.2 });
        if (!enemy.isDead) this.cameras.main.shake(90, 0.0035);
      }
    } catch (er) {}
    return r;
  };

  // ================================================================== 5. las bestias: anticipación que varía, embestida, zarpazos con sonido
  const ag0 = P.ckAvisoGolpe;
  P.ckAvisoGolpe = function (enemy, def, heavy, hitAt, anim, swing) {
    const k = BESTIA[enemy.type];
    if (!k) return ag0 ? ag0.apply(this, arguments) : (enemy.play(anim), 0);
    const S = this, jefe = enemy.type === 'werebear_jefe';
    let warn;
    if (jefe && ag0) warn = ag0.apply(this, arguments);     // el jefe conserva su aviso (zona en el piso, carga)
    else {
      // se agacha: un poco más bajo y ancho, y se pone colorado; cada vez un tiempo distinto
      warn = Math.round(azar(heavy ? 300 : 200, heavy ? 520 : 400));
      const sx = enemy.scaleX, sy = enemy.scaleY;
      enemy.setTint(heavy ? 0xff8a7a : 0xffc0a8);
      S.tweens.add({ targets: enemy, scaleY: sy * 0.9, scaleX: sx * 1.06, duration: warn * 0.7, ease: 'Quad.easeOut',
        onComplete: () => { if (enemy.active) S.tweens.add({ targets: enemy, scaleY: sy, scaleX: sx, duration: 90 }); } });
      S.time.delayedCall(warn, () => { if (!vivo(enemy) || enemy.swingId !== swing) { if (enemy.active) { enemy.clearTint(); enemy.setScale(sx, sy); } return; } enemy.clearTint(); enemy.play(anim); });
    }
    // el tiempo entre ataques no es siempre el mismo
    enemy.attackCooldown += Math.round(azar(0, 650));
    // la embestida: un salto corto y rápido hacia su blanco justo antes de pegar
    S.time.delayedCall(Math.max(0, warn - 110), () => {
      if (!vivo(enemy) || enemy.swingId !== swing || !enemy.body) return;
      const t = S.enemyTarget ? S.enemyTarget(enemy) : { x: S.player.x, y: S.player.y };
      const dx = t.x - enemy.x, dy = t.y - enemy.y, d = Math.hypot(dx, dy) || 1;
      const L = Math.min(jefe ? 34 : 24, Math.max(0, d - 22));
      if (L < 6) return;
      const nx = enemy.x + dx / d * L, ny = enemy.y + dy / d * L;
      if (S.navIsFree && enemy.body && !S.navIsFree(nx, ny + (enemy.body.bottom - enemy.y))) return;
      S.tweens.add({ targets: enemy, x: nx, y: ny, duration: 110, ease: 'Quad.easeOut' });
      try { if (window.CK_JEFES_FX && CK_JEFES_FX.rastro) CK_JEFES_FX.rastro(S, enemy, 160); } catch (er) {}
    });
    // el zarpazo (o el mordisco) se oye justo cuando corta el aire
    S.time.delayedCall(warn + Math.max(0, hitAt - 90), () => { if (vivo(enemy) && enemy.swingId === swing) son(k, 0.62, { minGap: 90, rate: azar(0.92, 1.08) }); });
    // a veces encadena un segundo zarpazo (los osos y Garra Negra)
    if (k !== 'ck_f_mordisco' && Math.random() < (jefe ? 0.4 : 0.28)) {
      const t2 = warn + hitAt + Math.round(azar(170, 260));
      S.time.delayedCall(t2, () => {
        if (!vivo(enemy) || enemy.swingId !== swing || S.isDead) return;
        if (S.anims.exists(anim)) enemy.play(anim, true);
        son(k, 0.55, { minGap: 60, rate: azar(1.02, 1.15) });
        S.time.delayedCall(Math.max(90, Math.round(hitAt * 0.6)), () => {
          if (!vivo(enemy) || enemy.swingId !== swing || S.isDead) return;
          const t = S.enemyTarget ? S.enemyTarget(enemy) : { x: S.player.x, y: S.player.y, fx: S.player.x, fy: S.player.y };
          const td = Math.hypot(t.x - enemy.x, t.y - enemy.y);
          if (td > (def.reach || 40) + 6) return;
          if (t.npc) { try { S.npcTakeHit(t.npc, 1, enemy); } catch (er) {} } else { try { S.damagePlayer(1); } catch (er) {} }
        });
      });
    }
    return warn;
  };

  // ================================================================== 6. los aliados de una pelea (Urso) sí salen a pelear
  // (ck_ajustes_juego.js no deja que los guardias peleen en la campaña; un actor con _ckAliado pelea igual, como en la batalla)
  const da0 = P.updateActorDanger;
  if (da0) P.updateActorDanger = function (a) {
    if (a && a._ckAliado && this._gameMode === 'campaign') {
      this._gameMode = 'ck_aliado';
      try { return da0.apply(this, arguments); } finally { this._gameMode = 'campaign'; }
    }
    return da0.apply(this, arguments);
  };

  window.CK_JEFES_PELEA = { TEMAS, RAZA, temaDe, esJefe, jefeEnPelea, BESTIA };
})();
