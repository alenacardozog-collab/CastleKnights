'use strict';
/* Carteles de guardado (ex tótems de guardado).
   v1 (22/11, pedido del dueño: "necesito tótems de checkpoint para guardar partida y pociones también que puedan tener
   guardado, pulí más el sistema de guardado"): un tótem de piedra en cada mapa de la campaña.
   v2 (23/11, pedido del dueño: "quita los totem y pon los carteles de guardado, pero no los esparzas por todo el mapa
   ponlos en lugares especificos q si antes de la pelea de un jefe o en la taberna y asi, q no todos los carteles sean
   iguales q sean acorde al lugar dopnde se coloque"):
   - Ya no hay tótems. Hay 10 CARTELES DE GUARDADO, sólo en lugares elegidos (la taberna, la posada, los campamentos y antes
     de cada jefe), al costado de caminos, cabañas o paredes (donde no estorban al pasar), y cada uno es distinto, hecho
     para su lugar y con sus colores (PixelLab, después ajustados a la paleta del lugar):
       · Taberna del Roble (adentro, al lado de la puerta) ... pizarra de la taberna con un chopp y una vela
       · Camino al Castillo (antes de la Limo Madre) ......... poste del camino con dos faroles
       · Brumavieja (antes del Gran Esqueleto y la capilla) .. cruz de piedra gastada con un farol pálido
       · San Roque (frente a la posada) ...................... poste de la posada con farol y maceta de flores
       · Sendero Orco (campamento, antes de la batalla) ...... poste del ejército con el escudo real y una antorcha
       · Pueblo Orco (a la entrada, antes de Gorak) .......... tablón orco con cráneo de cuernos y farol
       · La Fosa (antes de Garra Negra) ...................... tablón con una runa encendida y un farol, entre piedras
       · Patio de la Fortaleza (antes de Grushak) ............ estandarte de guerra rojo con un brasero
       · Bosque de la Frontera (campamento de Bruno) ......... cartel de madera con enredadera y farol
       · Mazmorra del Sello (antes del sello) ................ losa de piedra con el sello violeta encendido
     Cada uno tiene su brillo, su luz de noche y sus chispas (brasas, luciérnagas, bruma o motas mágicas).
   - Cerca aparece "T · Guardar". Con T se abre su ventana ("Punto de guardado · <lugar>"):
       · GUARDAR PARTIDA: guarda todo en la ranura (ck_partidas.js v2: la historia, este lugar, el héroe, la vida, las
         pociones) y descansa: vida y aguante llenos. Al CONTINUAR (o "Reiniciar") se vuelve acá, frente al cartel. No se
         puede con bestias encima.
       · POCIONES GUARDADAS: se dejan pociones y elixires en un cartel y se sacan desde cualquier otro (es un solo baúl, va
         en la partida: story.flags.baul).
   - Las CAMAS (las de la taberna, con el reloj de sol, y la del Rey) guardan de verdad otra vez: usan guardarDescanso
     (ck_camas.js v2, ck_salas_castillo.js v6). Con ck_partidas v2, S.saveStory() ya no escribía nada.
   - Si hay cosas sin guardar, SALIR (arriba o en la pausa) y REINICIAR PARTIDA preguntan antes.
   - En una partida de prueba (PRUEBAS, F4) el cartel funciona pero no escribe nada.
   v3 (23/11, el dueño eligió la letra de píxel, opción 3): el "T · Guardar" de arriba del cartel es la pastilla de
   ck_letra_pixel.js (CK_LETRA.pastilla: fondo oscuro, esquinas de píxel, la tecla en ámbar, letra Pixuf).
   Necesita ck_partidas.js v2. Borrar su línea de index.html saca los carteles y la partida vuelve a guardarse sola, como
   antes (ck_partidas.js mira window.CK_TOTEMS, que se sigue llamando así; CK_CARTELES es lo mismo). */
(function () {
  if (typeof MainGameScene === 'undefined' || typeof Phaser === 'undefined') return;
  const P = MainGameScene.prototype;
  // el dibujo de cada estilo (48×64, PixelLab, con la paleta de su lugar)
  const ARTE = {
    taberna: 'data:image/png;base64,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',
    camino: 'data:image/png;base64,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',
    bruma: 'data:image/png;base64,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',
    posada: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAABACAYAAABcIPRGAAAEd0lEQVR4XtWaO2sVURSF50qECBeJWFiIRkliI+KjiCDBSqJwEfEBFuI/sAmITeo0Njb+DCVYRNTGJo0hSFJoYQwxiJ0QCSkCipF1whp3juex9zzUfBC8d3LvzFr7deZM7IyfOlrsZvbsZvGgrw0Dfd2BLf+8Pza+dVq5VpMnpfCxy1fK086+fLEdqe7AVhsmGjMAgVI4OTN0oFhYXmsyTjtotAc2Pr4pT94/cNC9blM8MBlAlOVPKKwsGSBft0WyhELNePHqjWL9/WsX2VhdIxOzLZaNJJoBiEP94kdC8ax3ZqStCOdIlhDrN2QE5eGbA6FjRFOCVrI9kGpC/C5kLgSNXbp9p+geO1eOVt9Ursd8sgY4SWJGcFz+TmaNGZGj9Ov882Lj09topmCQZjVmogaw6KQWnlSpSHyDklD2YJCZlSUZGiggu5DRBE/ACNed75rvaxZBVQlZ0Fw0lb3u8Pls2UoaN5AC2cxFHmuItjxVJRQDYmJ1GcP/fKjHFpYLt/74xPox2wO5iFpNSHKGNHev6hLiySzp9cHqnVvoUgZD1MoAsJYSmhR1DjPy7hXI8Uly+wh1BlKEazm+B6AJrhFsbJjiFArtLUI0YsAKIu9PI7xnRmhCQysGUnUeEk9yI7aRDORu7mK1nBM582jUfcTvixytZKAKvYk5Z8KaBbOBVHloRywaNDRSYcKKaYxu3woUtXdfskxo2hp5YsqAXDlDK7C/F9DAUardGPmoM0DBJ8evuXOsfviMjUmth1UQH1rQLKgyAPGnb95y53336hnFu/cyE5pbaU4pisfeumr5AJUBguhjPzt44kiZiVDjpgSxebnSsqFpjGifKalLaPHpE3dubsiRCf+iIJUFKWpseGehYPXFMes60NH8fYDPPf2oIHo4xhs6OVG05STx7394vdC9FlFngM+Bpu6NuO9OPl4yR0sKCU2xUNmkxKt7ACdBRCl+qb9XvpYXsDQjn3rIf/3pkxPvhoj/pRwQr8FihmgE+5imEBjZnNHoD06nNjAbsJj4G6hLaH5xpdObWNtxH1Ql5U2jNgD+B8E+JgMhOA4nDw8WM/3rTQc4S6UeIBAP4VzAepv7K02fOlQyAOH77p7d2nv9uIs6hBMYiqF5XG7FbAAiIBw8mPtZir9w/9COa/vrAI3hu/ip80RPoroXitV+LNpTX1ajGXk4+jtm36dXag+GSk3M6FGoNJJrZGRNGsw9ectRuYRYRlI8hLF0WCqEJUbx/D6oU06mEpIXogCUAZGicBzTSTY4kRkAddYXcwlJkRJfPHDZGCpKEzL6NF5HvMtersaInD4x4f5xiKSJKnenGtQGXKSmV/54JuRnBKLlMbxeiJRZE5h6INZwEBnrBSB/J6lbPsA8hfwdFBrVFyjfx8Q3hbqEtHAz37bwsje1wmKE/iwEqjyVqIK5hFJGSOhhV1vUMuA3Yer/Rfg00cDAPIV8qtwGNCW+0hRqK5JVqVVCxBJRy2c1NGIAaIRpPmOl9hiVtCEwR2MZ+FfsegO/ABQUk1YLcfEJAAAAAElFTkSuQmCC',
    campamento: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAABACAYAAABcIPRGAAAFRUlEQVR4Xu2af2hVZRjHn9396N45ne2Kdb02NRWXqUSY/TPUUkdxAx2hWJAGQX9cSCUkiiEUEQX6RyMQpCIkKGh/aEQkpTBlRDkZQ40MdXcMr9Nyrs25O5lw4vsen9O7s/P7vGfHgR+43HvuOfee5/u+z/O8z3nft2xXbiVNZxLT2XjwQEDcVERhwHhNVks/uVb89cAfp6hypFgWxX0idSEYPloai8pugymJgSXN72pRKVEuAO7DxpZ6TouPb60/F5X96gXILGpsFof5lu7pKaDQcSQywxmlLvRvdq1mlXHwHc5FoUaZgFnPvqLNLp6yTZc4F0Uwl4WphRCwt2sX04yhyxNyvRzIQO4V+ZyK8cHTQFaxqllbuHgZjZVGaHysJIwqlUZFrl+2dCmVSlnkfC1dV0cDN2/S+L3sA1KPr6HqVFLjMUE+x2I42JOpGro1+A9db//S88DnSUB1Kkm9l/8y0iI4uK6X8rSQrpw5Zrj2lZ7/vbzzzkbqPHCD8i2nSZdsz7WrReO/569+weXqiXhyIbNLeAUinnnouNfLDfy4lrIgtiKI8X7x5ELmIMQxesWupbjHrAJchq/z0+JmIu0BBLgTYQxnfAtAqzqB8QDnn9j0GiWqkuJSp/zPZXdQfAtAzgfm1mt+v01DukVqBX/+8jX1/XrU+Ax3eWT9G5NG47Alt28Bdnx3YI+RCkUKvbNR9BbeGTnlmmnNjQcqNXwLsPJbOc0Ko5u+EGPAJ9sv0vK5hQkizCkZJTe+62+oD+RFvgVYwXGB1mYXQwn94aEEHX5nJu1veckQYY4hjNRolMyFvkACPKVRN9hog6YtdLv7ljjs7+uiEx2ziKhKHNfPz9JwcfI/7v6x0nP5IKNEAOd7Bq1/+KOniH4+SnSB6FiXbjwwBy1cqNKthRxQIqC29mG6O6TfhcuHfd+g1XeIgk/mxsAAzQ5hsBlPtZAbcmBy1uEywnwMOBGoGImV9ACXFjBu24aZdP7cWer8W0+fLz9XQ+WJMip06M1gNj4sSnqAcatazTUVSnImaBArSaMMDLR7Jrb6Pmjul1EqwC9y7m9tzQUaiZXEgF/0sqFX9ECm/mkxVhBeAbhveiDWkdgvCFgO+H0NXaIX8ocSVEkWQ7QLsfYAQL0kRuyAxCZAzko7uzcEfjqLJYhlUI2mU0nLAs8LsfUAQBGIOafh378NVImCWHsA86VWpbUfYu0BFSgXYFUPudVIYVAuQGbJuq1hbPNEpAIunWzzZEQYlAuwq0bDGOmEcgFTzQMBMtryzVpUi3l2KOsBGD6jWp/MnUqUCQBX+/snT3JFjFIBcaBMAKYXJ00xSmA0fvT5NwM9905JGrXK/wyMx6j83uai8p0roXsAwcsvKxE8G91bKNAHbWmxDqxyxT6wgLrGHRoXafMyGdHYVkUbu9XQ0CD1FPSJLKzeLMjtMX4fBt8CYCRa/Hr3CeO+yD5ucIxgleaxNTl6u+mi8RNeVwuCJwEwml98E7hGbUOjOFyxcpXjvbft/dQ4j99VVFXR/p8Wic/433xju3EPv2JcBTi5hZz3sRKTWf2iMBR7Hw5ifeDeY+PJ4z9MEIF9ROXlFTQnnRbXiJkJIrFiifUDP88PrgLskNMmZqM//j5LoyP6qgxoH3zd+Azf/+rzz8QxxwRKbSxu4KEeYI/E3HkLaO+m33x5kufZafNWSjNwByxsO61EcgvjQV60/KvDYlrR3AN3zx7xXH57FmAGgtB62IaDrIIWxFYbtKrdjhPeoiODa/1srzETWIAVTr7LosIYa4VSAXEQOIjvF/4DGclT9zmromwAAAAASUVORK5CYII=',
    orco: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAABACAYAAABcIPRGAAAFO0lEQVR4XtVa34tUVRz/7hqWtmqrkJvGZNFSOpqYOAuxoLQQJv2AIOjBCh+CehAi/wTffBCfJEgQ0QdhQdBi8aEJhSGYFRPDscJoQ0rdoBbbUjN143PGz3LmeH7de88d2g9c9t47Z875fL6/zo/ZnlfWVWQuo3cukweSCZjfPzDjM0bo87xIIgDkBp/oC3IoQ0QSAVmQWkRhASR06epfQR0xXsqKwgKAWGIxIrMiiQASC4UHhMaKjUUSAboXbCL0JE/thYdilbpwe+paDwiCGKyLvy5P4DO0LzqmjiQe0EkxRN7/4EN10TtlkE86kUEESOIa2vaO6nz90Avy1vYdycNGR+EQIhA2sPj0zX9keMum2fe4X7TgYfV86LNPZ1KHUDIBwMmvL8iqp56Uxqkzs6TxbutLa+XYl81Moa/nkU90khzQ0Rw7Kr/+cVNOf/O9eg3ywPTEuQ4iIOi72OdzQy97y3MyD8BKk63GDOIfIpjA9fEL8sv5hsqL5thR74JPR21kq3ocr5/0ei6XALrX5lqQB1kk8Pnmt1JbNyj/3hH13gTarVy6QI4dOSiLnt6gPq5VKyqPQsSJzAL02LTVe5RRkH1+5WNIWlWFJlsNGXntzQ7+9S+Oq3YsuwO3LrUt3hJ1j/eVjSNy+WzdW8V6fDsyG0GCkxZBCzLeV23cIo/2LZTW6TF5e8k8Gb1+t6MN233+xp/y+onF3jDxJbHTAyAPq7ks8NHuPara0P1IUh0/nz2lHvce2N9+vWunjE6cUyLMtkXg9ACtr1uWIAF6wbQ+LG4DvGDC5QH2aVYvE8EcIFmdJK24d9MV5X6XRUnYJUgH+kTs968ZbudCoPoQQQHLq8Ny48bfudzO2DehW1f36jQerrbLpl5GEQ2uPAgKQAVJDZvHKGr1M8vlu58m1QWYxSJzCMXAzAGEjhk2DCezrZlX4xOdIyqveBD0AFxJa5iDuZ4BPWH1e9P6n5xZISLu/XRo8ResQgCT1rSerQoBecpkiKgLQQ+QPOYEzJ6cOXXXZiFMorGrzRCCAkju497DUpfFhTYnupXzWtyEcznNAVBGgX333n3gy9wmoq1JiOFmmwhTwusBLpExID3gspxt3WSS99XzvAhuaLK4Wj/zQejxArBkKAPBHCDaIXTcywEh5SIaKpd5ES0Aq9IYYG1knr61D7PCZ6d5EC0gBB5woZ3r9C1LOMYimAPm6bMtWU0gec3Va1nwCiDZ6uZtamvIkhoSkWViK4pgCLU3HGPSuj9SzBawmwgKQFLqlSW0f+02ggKwLDZJxyZj6v2vDd4cAFGu7bE5j9kadhvBKkQMntgu722e6ja/IIIhpLwgAzOj989uYsOnWwgKAGJI+0prmWU1OoT+r0guAMfhgL4SJUITYB4kF/BD8yt1EMBzHfNQNzWiciArpi421IIO8wBXsWXNCck9AFx7ZHBWM+7L3FaW4gGz6szZKsRELtMDpYQQAeKsShSx7MVXo38ni0ESAdU1zz5AioSv/Na5/FjxeL9qb/tOHmTKgayDIoRsx5K9lZriWhWxeqN18cfo/6eIEkDiHBi4d3k8j8HUPMGw0vvTQWExQrwCTOJ5SXNmJnH0Q/J6n3xnesgnxHo6DeIu6/hE6KcR5sRF8nmBcW1CnEnsIuoSBuj/kaXX/hTkXfD+TmyLfcLnCZ/ILOAYvhDy5gC/aFYLELQldFHiplF8xImoKmR2REEgvKRvvlyv1AoleIylXYgSYEL3DKcpvNOF+ZDH0kkFEKZnXCGnA6vT3zNMVCF4k3gu4D9s78aLqVS/pAAAAABJRU5ErkJggg==',
    cueva: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAABACAYAAABcIPRGAAAEc0lEQVR4Xu2az0tUURTHj/kjEEOIJKfGCCOKCCLITbNpES1c2aaNhLjMNkKCCUWLAgtKBFGXMoTrXLmIiDa2UWgj/QFlWVgLUSRNmfje8TxPd+5798zT51OYDwzz49158z33/Li/pqq2uo4OM0cOs3hQMSBtKh5Im4oH0qbigSgmJl4W2q5dLSTppaqkRuKNkVYjPJdvNPpn5z5VJWFIoiEE8TNdy0noDkjUAOmBpKhJ6saSnvudRNQZ5MLjgRf0dLDfNBl4NEyDz3qpc3WMJht6zDMbrgk7dQ4gpvEDLqQghoXwd8ZGJ53f/bq4RC2ZptBrP74tROZOWQZwTHNiJg2M2zMD7HLYuLZQon+5Puv8nPFdB2jDXtEYoE5iGY8u8WFM3ztmLtnPPjZ+LXp7H6hDSHqgHAOkeNA+vhKpHR5gNEms9sBuMKJvdESKh3ApHuHTfDrrHcXVBqA3cNOksL0aVpls1AZgXsM3lT2l5sOUt+niQmlh8KE2QFJuDmi5eHynpaYCAbUBGJjihBBXHwbvozzIv+Gr/4y6Cl0521yoO5ExP3C5cd3bqSySa7r0WtR4ML98NLi3xgj1XGj2QT3l8mRu2pLRzfFRy1syGSOIRUNgS33xvQtcA1pvqw2IAzwm4d4Nm/9oRUvKMoAHFoSDdHU5iLAoqfGakLHRG3Crg4iG1PHJI3dYUsYR60JVhSCm7sJQMK1993mp6ualJu8oCbQDUlxUBhxkvAZgBEY1wYKGH/DI0lp1yRQ7Dbw5gJVU75M+wnoKr5HAjbRCVE80n+DcSIvXAFSesdGdiiEHKF8iYi0ctpTcK7whBLA1YsJo+4FJly858Z2kxQOvBxiEES/UQft49MyxuJh3L+T3EpUHQOf174SxwAgzY0I0+9H7wGuAqfeW4MmPp2j6zd1g+zBNvAYwEB14QgFyIOltRZUHJNIIfp02Xg8gVOjtVDEHkJbsie0twDD2a/PLawDEQ0z77ddWFVqhtldraTvAX0ZRdWa6xiiXz9KZ59iVGKYBI3tn5ZQmqiUl5j5ISBkWvkU35k3c3td2N6gGMkwn6uYo2GjyTSH2E5UBzEESzviTWMl+HOi52LUBZr0w0lrgqYPvVBJt0YYfyv4JRZXEYbjEcsLKa/IzOTrvxQlmWTkgscXz4v3LQ/yBCkes/1ctiV3NsAsdN79ie8DedcD6wC61QO71uNYQ8nocI2J5oHiIXTz/zeWLB3RY5Ew29G8PesXDbRYnhUdtXsETaKs52GDUBsiByQ4Ps9OWzZqpBsLD7nWOew6dk7Wb9PvPFm1Wu0dzeFdrRGgIobqwlagwMvkwvcBnLLRma50y2dK9TnsLMar3Jeyx4vkyUXd3X+hRq9MA9IBrQW73JARtrK7QufOtkeIgKEjy93eCGa3sBBs7X8I8UmKA/JOG7EH7NeDElYfZUb1si5LHqdJIhj/jZ1eSlxjg6n2XeDbAxmUAYv7nX3W6mZDk/JCvgW1E7DJ6UNj1VCJtKgakTcUDaXPoPfAPVI1nYqOL15MAAAAASUVORK5CYII=',
    fortaleza: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAABACAYAAABcIPRGAAAERElEQVR4Xu2a3UtUQRjGZ02lMheCLqKLCEwKjdgCtfSiD9ALL0IE66Io6w+oe/8A7+sfyKIEE8Qg9qJAKuhDA5NEb0zwQqqLvBG3oC/jmfU9vc7O7sycnVlP4A+Wo67sPs+8z3ycmZNqaDgq/meq/mfxoDqUgbWqmnX67D1/fqZCfU8QAxDff/VypHno/sP1UCa8GeAtfq6zC6JF2+l2MfnmdajG9xchiB95cDsSeunKLXGooVH8+PU7qHgQtBPXVu8IbiDlYxil+CD3iI5KqPx7rcDFvj4pHlcV3j984yVCaOFHo6OyAriqLd7d3S1NhDDiJUIA4tBxvy7MyzFfFYv3wNLigrz6ipWXCtgIgnC8UKWb+3d5i5U3A8THayKagdWZGMLTT8fEaldvZKLcWHmbyIjD94Rx2QATA52rYjXVL3++8yVvOk6svFaA8k9Q7nUMPktvqgaideNA2rkiXg2o7K6r04rnoAIgX4nv0rRLrIIaiAM6Okzsa2yyqob3PlAuEE9DLQ3HpfpG0Ap8y+Wc/VAFAF+SFyOogTigtakCWJqYRqagEbLpxDp6e3rE55UVsbe+Xrx88rhkOySuAsTsi4nUztpaYxETa8CWbQMhqK6pkR9L11IksgLZkWHjeopIpAHCxkiiDdiwbcAFrDZ9U7EK0JLAt4mKGQCmdU0cghhQb0hcblBc8W4AYrEYA/MfZuQV+0IHMy3RzT5i5CtK3vaFOJrt9YL4UFWwU0HAlGvMgi2ndXukHAj1ES3vESJwa0ivUpQbpSAV2LirMh4x8SrENRKsAnFwzT9IhIG4rZ8IA3FanZOICpQzS8cygD3MOBkvRjlVcDYA8dhZ1m2jq5Ta3PWF0zCKiWfg7vn8dw+PG0/j+RZhKKwrQGucwesTWi26WbUSFbAyQOdf07NzBeKxlsHLdVvcF0YDEI/VJOJwIbcsoghtQCtLvAd8rG9cMBogYIJAjHDCQq0PYATPSHAq0QesltN8jT82Pq5tIBjMZrPyPXWlWc4wacLaAHXI1pOZgs+cms7fuADdOfGWG6Bs81GFDiLUmBRb54cyYZwHinVKmHnbPi9OiSZpUDVyoqUtqsr7d5ObOrhPM8YI0RDKBarjO73XdDwT3QfroAdBKHLqsWwcjBWgmxNqNRjSjS4Qz+G/0839Wi4ncGhxtqNV/uvQ4r+bHur8riashlEunr6ABOpmW/wNoulFLC1/Eul0/ux4amZOHuLhc1TzLlgZoE6MK56D49A5GLUy9QcSxvsCeP5qSl5bM80FFYszCRr7QHPHmajV6QE+XTx0f9NF6tiRRtkHKEZUDQIN4dLJSxqgFtGVWG1BRIK3LP1OqP+vEw5cxANjBXh8uBEcYvNWLAaMcPGqMUDxcxVvbYDgGeVmIJALI8E6sVwwEUc4YVUBHdyM+jiZiXIEqxjngWJwEUsb47lPYbbENsDZCuHEX1i6B4QcDeFcAAAAAElFTkSuQmCC',
    bosque: 'data:image/png;base64,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',
    sello: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAABACAYAAABcIPRGAAAE8klEQVR4XtWaO2hUQRSGZ5MFwUKjhaAExBBQECFKOkHQMoraCClstdJOsLG0Uezs7AUhCiqonYJgF6IgQoQYCYQIKTSmsEqM/BP+9exkzsyZ+/DxwXKTva/znjMz29k2MOD+Z/5v6Z1rV4Gro9c2Xkyub7Tp4T/iASjSlhKtKQChJ8ZveblxbEuJbhuWkcJrXLl4JuqVVy9f+1s+LK12LLIVKxB7ce6lz6eve1mg2N25O53jh/arITW0Y5dbWf3mDu/bsWFRolNSRjWrgccPnvrj4tpARwuXme6UezO70Ek9B7ydfu+VsHiiKAfwYI3zk2fdzj1Dbrj7U7XusbULSSPESHkLmD2Qs1qTwFALc5+9Qb4vr3ivas83eyBl/TaBEimKkzhEU+zo+JHepSnlw+vk/xZqKwByL9XON+FVcwgR+dK6AkCx1DMQ//i0EkJ4cc7ydWAC47i4tKo+qtgDrNNNCa95IWd50kgOSE6vPdlirWfdc1u+k8SUWF93bvfeIT8yuyY8wJFRszwEjwkPeK4kZyC8BXMIoS/RBNAED7kxNm9SgsYCaD1aS2IAoSRs3CRsqwHaiZnpqagnq+SV2QMxLMIDqRSUgRIa7GytNJbEFFJaWwqP8/KcLMP8myGKCpRrIUiRB2RsSutrwgMITcFT1xFr+SRmD6CtzY2cJAwZKhLLj7qYFdCIWVWGys13I1tyhWAShHlEiDV8gCmESqxfF7YQVkwK1CFWcWQoxcaWEg/UDqEYYay3EfvFSRwSlkVJWEoBciFV/2NYViUaC6GUlWWiN+2NygpgiST0Qix0+F2p9a1UzgHf03SnnJveHKwoqGZheQ3uw6pDE9TyAK2ay4dQeLB/9EAT8lf3AIE1oYimhPSI9xg70u6UL5fzH+t5onIIAQpPwRBOGryW9wHMtvBBOEGRwUFXNAaAWgqAlz/uuVPbL/cJFoM5g4bQTxMF8MTJUyd8a8FmzjqY1VYAwsy436GR8oDsZiVUiEKXdKRZBWQfFLOeBN4gXCZnqMhjDqv1gbkK0XqaFUMB5XWpewDPh6FlwayAxKqE9IZG6lkWsiEUI2ep3HlSV/iiEAqtiZfXESB2b5XnFYUQLItyiPkwa3iVl1a5RyMbQuHLwlZZVpu6VHmWyQOcNcmOUq5K0BvyKGkzJ7IewKRieHllA83XxNjmxrWkZDXNsmj19cuKeV0UJBXgxp72Yi4TWmIarQI+GuHc2DIbA+ouZbgriRfEJiUPP932TVgOy+iKFgLL6lpTF1OqzwNVtlJzwlOgkv5GUxa79zQUlel5wCL8o/tP3cjBAz7uEVapkCAMDesMLCZ8WAQQsqoCqU0IVJ7cbouV1HskWn5RgV4IWR546WHHPBWEl+TGBxTv2wgZT287cbcepPKnp0CuVS4FArx1I323yf9T5ZdVD4KjrErCMpsdB9pC87ilJEuiI3Eq4azJCMJrS4UDuSoX9QBKH5EvLV05xnNCJRACqGRN0adALA+qNFiAqwzh+o9cRmEepAqINGaMXgixLEGJ0G1ak5YjtngF69MrPtETP6JiCHEQxBGyyRG5LwdwAp/YD4xK4jdmBAkUs+SSXGKBESFXKJtahaIbzH7Lf8Atzi70DettwTbEW1z5uYH5J2dV0X7zpo07+B6Wh5dyu/SgdQVSQDkZmiwY1lb6ryvQBKYp5b/MLw8tzgU5Aco/AAAAAElFTkSuQmCC'
  };
  // cómo es cada uno: pie = fila de abajo del dibujo; luz = dónde está la llama o el farol (en el dibujo); c = color de la
  // luz; halo = color del brillo; ch = colores de las chispas; tipo = brasa / luciernaga / niebla / magia; letra y borde
  // del "T · Guardar"
  const ESTILOS = {
    taberna:    { pie: 62, luz: [22, 6],  c: [255, 196, 120], r: 70, halo: 0xffc46b, ch: [0xffe2a0, 0xffa84a], tipo: 'brasa',      letra: '#ffe2a8', borde: '#2a1606' },
    camino:     { pie: 62, luz: [22, 27], c: [255, 214, 140], r: 80, halo: 0xffd98a, ch: [0xfff3a8, 0xd8ff8a], tipo: 'luciernaga', letra: '#fff0bf', borde: '#1f2a10' },
    bruma:      { pie: 62, luz: [35, 25], c: [200, 232, 255], r: 75, halo: 0xbfe8ff, ch: [0xdcecff, 0xb8c8d8], tipo: 'niebla',     letra: '#e2f2ff', borde: '#10161e' },
    posada:     { pie: 61, luz: [12, 33], c: [255, 200, 120], r: 70, halo: 0xffcf7a, ch: [0xffe7a6, 0xffb35a], tipo: 'brasa',      letra: '#ffe8b8', borde: '#2a1606' },
    campamento: { pie: 62, luz: [32, 33], c: [255, 170, 80],  r: 80, halo: 0xffa94a, ch: [0xffd27a, 0xff8a2a], tipo: 'brasa',      letra: '#ffe0a0', borde: '#1a1208' },
    orco:       { pie: 63, luz: [10, 39], c: [255, 120, 60],  r: 75, halo: 0xff7a3a, ch: [0xffb070, 0xff5a2a], tipo: 'brasa',      letra: '#ffc09a', borde: '#2a0806' },
    cueva:      { pie: 57, luz: [12, 38], c: [255, 160, 70],  r: 85, halo: 0xff9a3c, ch: [0xffd07a, 0xff8a2a], tipo: 'brasa',      letra: '#ffd8a0', borde: '#1a0e06' },
    fortaleza:  { pie: 62, luz: [13, 45], c: [255, 110, 50],  r: 85, halo: 0xff6a2a, ch: [0xffb060, 0xff4a1a], tipo: 'brasa',      letra: '#ffb898', borde: '#240606' },
    bosque:     { pie: 63, luz: [13, 39], c: [220, 255, 150], r: 75, halo: 0xd8ff8a, ch: [0xe8ff9a, 0xb8f070], tipo: 'luciernaga', letra: '#e6ffc0', borde: '#0e2010' },
    sello:      { pie: 62, luz: [22, 28], c: [190, 120, 255], r: 85, halo: 0xb070ff, ch: [0xe2c4ff, 0xa45cff, 0xffffff], tipo: 'magia', letra: '#ead4ff', borde: '#1a0830' }
  };
  // dónde hay cartel (del área del mapa) y de qué estilo: sólo en estos lugares
  const CARTELES = {
    'ed_taberna_2.main':             { x: 204, y: 236, e: 'taberna' },      // adentro, contra la pared a la izquierda de la puerta
    'ed_camino_al_castillo.main':    { x: 330, y: 402, e: 'camino' },       // al borde del camino, junto al cruce (antes de la Limo Madre)
    'ruins.village':                 { x: 470, y: 440, e: 'bruma' },        // Brumavieja: contra la casa en ruinas, al borde de la plaza
    'ed_san_roque.main':             { x: 738, y: 292, e: 'posada' },       // en el pasto, al lado de los barriles de la posada
    'ed_sendero_orco.main':          { x: 60,  y: 292, e: 'campamento' },   // al costado del sendero, cerca de la entrada (antes de la batalla)
    'ed_pueblo_orco.main':           { x: 140, y: 116, e: 'orco' },         // contra la choza de piedra, al borde del camino de arena (antes de Gorak)
    'ed_cueva_fosa.main':            { x: 690, y: 252, e: 'cueva' },        // contra la pared de roca (antes de Garra Negra)
    'ed_patio_fortaleza_orca.main':  { x: 130, y: 100, e: 'fortaleza' },    // junto al brasero de la izquierda, contra el muro (antes de Grushak)
    'ed_bosque_de_la_frontera.main': { x: 452, y: 390, e: 'bosque' },       // apoyado en la leña del campamento de Bruno
    'ed_mazmorra_sello.main':        { x: 722, y: 528, e: 'sello' }         // al fondo de la primera sala, delante de los cráneos (antes del sello)
  };
  const ESC = 0.72, CERCA = 34;
  const vivo = e => e && e.active && !e.isDead;
  const R = (a, b) => a + Math.random() * (b - a);
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const PT = () => window.CK_PARTIDAS;
  const sinG = S => (PT() && PT().sinGuardar ? PT().sinGuardar(S) : !!(S && S._ckSinGuardar));   // (lo que importa, no lo que el juego anota solo)
  const zonaDe = S => (S.currentZoneKey ? S.currentZoneKey() : '');
  const prueba = () => !!(window.CK_PANEL_PRUEBAS && CK_PANEL_PRUEBAS.st && CK_PANEL_PRUEBAS.st.prueba);

  // ------------------------------------------------------------------ texturas
  const KEY = e => 'ck_cartel_' + e;
  const imgs = {};
  Object.keys(ARTE).forEach(e => { const im = new Image(); im.src = ARTE[e]; imgs[e] = im; });   // (se decodifican ya)
  // el brillo: un círculo que se desvanece hacia afuera (se tiñe con el color de cada cartel)
  const BRILLO = 'ck_cartel_brillo';
  const brillo = S => {
    if (S.textures.exists(BRILLO)) return;
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    S.textures.addCanvas(BRILLO, c);
  };
  const textura = (S, e) => {
    if (S.textures.exists(KEY(e))) return true;
    const im = imgs[e]; if (!im || !im.complete || !im.naturalWidth) return false;
    S.textures.addImage(KEY(e), im); return true;
  };

  // ------------------------------------------------------------------ poner y sacar
  const quitar = S => { const t = S._ckTotem; if (t) { [t.sp, t.halo, t.cartel].forEach(o => { try { o && o.destroy(); } catch (e) {} }); if (t.ev) t.ev.remove(); } S._ckTotem = null; };
  const chispa = (S, t) => {
    const E = t.E, col = E.ch[Math.floor(Math.random() * E.ch.length)];
    if (E.tipo === 'brasa') {
      const q = S.add.rectangle(t.lx + R(-3, 3), t.ly + R(-2, 2), 2, 2, col, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(t.y + 2);
      S.tweens.add({ targets: q, y: q.y - R(14, 26), x: q.x + R(-6, 6), alpha: 0, duration: R(700, 1100), onComplete: () => q.destroy() });
    } else if (E.tipo === 'luciernaga') {
      const q = S.add.rectangle(t.x + R(-22, 22), t.y - R(4, 38), 2, 2, col, 1).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(t.y + 2);
      S.tweens.add({ targets: q, x: q.x + R(-12, 12), y: q.y - R(4, 14), duration: R(1600, 2400), onComplete: () => q.destroy() });
      S.tweens.add({ targets: q, alpha: 1, duration: R(500, 800), yoyo: true, hold: R(100, 500) });
    } else if (E.tipo === 'niebla') {
      const q = S.add.ellipse(t.x + R(-18, 14), t.y - R(1, 8), R(8, 14), R(3, 5), col, 1).setAlpha(0).setDepth(t.y - 1);
      S.tweens.add({ targets: q, x: q.x + R(8, 20), duration: R(2000, 2800), onComplete: () => q.destroy() });
      S.tweens.add({ targets: q, alpha: 0.28, duration: R(700, 1000), yoyo: true, hold: R(300, 700) });
    } else {   // magia: motas que suben dando vueltas
      const q = S.add.rectangle(t.lx + R(-8, 8), t.ly + R(-6, 8), 2, 2, col, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(t.y + 2);
      const d = R(900, 1400), x0 = q.x, a0 = R(0, 6.28);
      S.tweens.addCounter({ from: 0, to: 1, duration: d, onUpdate: tw => { const k = tw.getValue(); if (!q.active) return; q.x = x0 + Math.sin(a0 + k * 7) * 4; q.y -= 0.35; q.alpha = 1 - k; }, onComplete: () => q.destroy() });
    }
  };
  const poner = (S, intento) => {
    quitar(S);
    if (S._gameMode !== 'campaign' || !S.story) return;
    const z = zonaDe(S), def = CARTELES[z]; if (!def) return;
    const E = ESTILOS[def.e]; if (!E) return;
    if (!textura(S, def.e)) { if ((intento || 0) < 20) S.time.delayedCall(150, () => { if (zonaDe(S) === z) poner(S, (intento || 0) + 1); }); return; }
    const c = S.currentInterior, a = c ? c.area : null;
    const x = (a ? a.x : 0) + def.x, y = (a ? a.y : 0) + def.y;
    const sp = S.add.image(x, y, KEY(def.e)).setOrigin(0.5, E.pie / 64).setScale(ESC).setDepth(y);
    sp._ckfv = true;   // (ck_fuegos_vivos.js no le pone llamas animadas encima: el cartel ya tiene su brillo)
    const lx = x + (E.luz[0] - 24) * ESC, ly = y + (E.luz[1] - E.pie) * ESC;
    // (un brillo suave alrededor de la llama, que late)
    brillo(S);
    const halo = S.add.image(lx, ly, BRILLO).setTint(E.halo).setAlpha(0.45).setScale(0.75).setBlendMode(Phaser.BlendModes.ADD).setDepth(y + 1);
    S.tweens.add({ targets: halo, alpha: 0.22, scale: 0.95, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // (v3) el aviso es la pastilla de píxel de ck_letra_pixel.js (la tecla en ámbar); sin ese archivo, el rótulo de antes
    const cartel = (window.CK_LETRA && CK_LETRA.pastilla ? CK_LETRA.pastilla(S, x, y - 46, 'T', 'Guardar')
      : S.add.text(x, y - 50, 'T · Guardar', { fontFamily: 'MedievalSharp, serif', fontSize: '11px', color: E.letra, stroke: E.borde, strokeThickness: 3 }).setOrigin(0.5, 1))
      .setDepth(29000).setAlpha(0);
    const t = { sp, halo, cartel, x, y, lx, ly, z, e: def.e, E, ax: a ? a.x : 0, ay: a ? a.y : 0,
      claro: [16, 8, 0].reduce((v, k) => v | (Math.round(((E.halo >> k) & 255) * 0.6 + 255 * 0.4) << k), 0) };   // (el brillo, 40 % hacia el blanco)
    t.ev = S.time.addEvent({ delay: E.tipo === 'luciernaga' ? 700 : E.tipo === 'niebla' ? 560 : E.tipo === 'magia' ? 340 : 420, loop: true,
      callback: () => { if (sp.active) chispa(S, t); } });
    S._ckTotem = t;
  };
  const cerca = S => {
    const t = S._ckTotem, p = S.player; if (!t || !p || !t.sp.active) return false;
    const b = p.body, px = b ? b.center.x : p.x, py = b ? b.bottom : p.y + 12;
    return Math.hypot(px - t.x, (py - t.y) * 1.3) < CERCA;
  };
  // la luz de noche (y en los lugares oscuros)
  const luz = () => { try { window.CK_LUZ && CK_LUZ.fuente && CK_LUZ.fuente((S, lista) => { const t = S && S._ckTotem; if (t && t.sp.active) lista.push({ x: t.lx, y: t.ly, c: t.E.c, r: t.E.r, f: 0.8 }); }); } catch (e) {} };
  luz();

  const ver0 = P.onAreaShown;
  P.onAreaShown = function () { const r = ver0 ? ver0.apply(this, arguments) : undefined; try { this.time.delayedCall(80, () => poner(this)); } catch (e) {} return r; };
  const ald0 = P.onVillageShown;
  P.onVillageShown = function () { const r = ald0 ? ald0.apply(this, arguments) : undefined; try { this.time.delayedCall(80, () => poner(this)); } catch (e) {} return r; };
  // al empezar o continuar no siempre se llama a onAreaShown: se pone igual (si después se va a otro mapa, se saca solo)
  const ini0 = P.initStory;
  if (ini0) P.initStory = function () { const r = ini0.apply(this, arguments); try { this.time.delayedCall(700, () => { if (!this._ckTotem) poner(this); }); } catch (e) {} return r; };
  ['startPractice', 'returnToStartMenu', 'endStory'].forEach(k => { const f0 = P[k]; if (typeof f0 === 'function') P[k] = function () { try { quitar(this); cerrarMenu(this); } catch (e) {} return f0.apply(this, arguments); }; });

  const up0 = P.update;
  P.update = function () {
    const r = up0.apply(this, arguments);
    try {
      const t = this._ckTotem;
      if (t) {
        if (!t.sp.active || zonaDe(this) !== t.z) { quitar(this); return r; }
        const c = cerca(this) && !this.dialogOpen && !this._overlay && !this._ckEscena;
        t.cartel.setAlpha(c ? 1 : 0);
        t.halo.setTint(c ? t.claro : t.E.halo);   // (cerca: la llama brilla un poco más clara)
      }
    } catch (e) {}
    return r;
  };

  // ------------------------------------------------------------------ la ventana
  const css = `
#ck-totem { position: absolute; inset: 0; z-index: 70; display: none; align-items: center; justify-content: center; background: rgba(8, 6, 4, 0.72); font-family: var(--ui-font); }
#ck-totem.on { display: flex; }
#ck-totem .ck-win { width: min(500px, 92%); }
#ck-totem .ckt-info { text-align: center; font-size: 13px; color: #6b4a1c; margin: 0 0 10px; }
#ck-totem .ckt-guardar { display: block; width: 100%; padding: 10px; margin: 4px 0 6px; cursor: pointer; font-family: inherit; font-size: 18px; color: #fff6e2;
  background: linear-gradient(180deg, #8a5a2b, #5a3412); border: 3px solid #2a1606; box-shadow: inset 0 0 0 1px #ffd89a; }
#ck-totem .ckt-guardar:hover:not(:disabled) { filter: brightness(1.12); }
#ck-totem .ckt-guardar:disabled { filter: grayscale(.7) brightness(.85); cursor: not-allowed; }
#ck-totem .ckt-nota { text-align: center; font-size: 12px; color: #7a1c14; min-height: 15px; }
#ck-totem .ckt-dos { display: flex; gap: 6px; flex: none; }
#ck-totem .ckt-dos button { min-width: 66px; padding: 5px 10px; font-family: inherit; font-size: 14px; cursor: pointer; color: #f6ead2;
  background: linear-gradient(180deg, #7a5434, #4f331d); border: 2px solid #2a1606; box-shadow: inset 0 1px 0 rgba(255, 230, 180, .35); }
#ck-totem .ckt-dos button:hover:not(:disabled) { filter: brightness(1.15); }
#ck-totem .ckt-dos button:disabled { opacity: .4; cursor: default; }
#ck-totem .ckt-fila { display: flex; align-items: center; gap: 10px; padding: 6px 2px; border-bottom: 1px solid rgba(90, 50, 20, .22); }
#ck-totem .ckt-fila:last-child { border-bottom: 0; }
#ck-totem .ckt-nom { flex: 1; min-width: 0; }
#ck-totem .ckt-nom b { display: block; font-size: 16px; color: #3a2208; white-space: nowrap; }
#ck-totem .ckt-nom span { display: block; font-size: 12px; color: #6b4a1c; white-space: nowrap; }
#ck-totem .ckt-cant { flex: none; font-size: 12px; line-height: 1.35; color: #4a2a0c; text-align: right; white-space: nowrap; }
#ck-totem .ckt-cant b { font-size: 14px; }
`;
  const asegurarUI = () => {
    let el = document.getElementById('ck-totem');
    if (!document.getElementById('ck-totem-css')) { const st = document.createElement('style'); st.id = 'ck-totem-css'; st.textContent = css; document.head.appendChild(st); }
    const host = document.getElementById('game-wrapper') || document.body;
    if (!el) {
      el = document.createElement('div'); el.id = 'ck-totem';
      el.innerHTML = '<div class="ck-win"><h3>Punto de guardado</h3><p class="ckt-info"></p><button class="ckt-guardar">Guardar partida y descansar</button><div class="ckt-nota"></div>' +
        '<h4>Pociones guardadas en los carteles</h4><div class="ckt-baul"></div><button class="ck-close">Cerrar (T / Esc)</button></div>';
      host.appendChild(el);
    } else if (el.parentElement !== host) host.appendChild(el);
    return el;
  };
  const hace = ms => { const m = Math.floor(ms / 60000); return m < 1 ? 'recién' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.floor(m / 60) + ' h' : 'hace ' + Math.floor(m / 1440) + ' días'; };
  const nombreLugar = S => {
    const z = zonaDe(S), mm = window.CK_MINIMAPA && CK_MINIMAPA.Z && CK_MINIMAPA.Z[z], a = S.currentInterior && S.currentInterior.area;
    return (mm && mm.n) || (a && a.title) || (z === 'village' ? 'Aldea del Roble' : 'el camino');
  };
  const baul = s => { const f = (s.flags = s.flags || {}); return (f.baul = f.baul || { potion: 0, elixir: 0 }); };
  const bestiasEncima = S => (S.enemies ? S.enemies.getChildren().some(e => vivo(e) && !e._ckAliado && e.state === 'chase' && Math.hypot(e.x - S.player.x, e.y - S.player.y) < 230) : false);
  const pintar = (S, nota) => {
    const el = asegurarUI(), s = S.story; if (!s) return;
    const r = PT() && PT().ranura && PT().ranura();
    el.querySelector('h3').textContent = 'Punto de guardado · ' + nombreLugar(S);
    el.querySelector('.ckt-info').textContent = prueba() ? 'Partida de prueba: el cartel no guarda nada.'
      : r && r.story && r.story.savedAt ? 'Último guardado: ' + hace(Date.now() - r.story.savedAt) + (sinG(S) ? ' · hay cosas sin guardar' : '') : 'Guardá acá para volver a este punto al continuar.';
    const enc = bestiasEncima(S);
    const bt = el.querySelector('.ckt-guardar'); bt.disabled = enc;
    el.querySelector('.ckt-nota').textContent = nota || (enc ? 'No se puede guardar con bestias encima.' : '');
    const B = baul(s), inv = s.inv || (s.inv = { potion: 0, elixir: 0 });
    el.querySelector('.ckt-baul').innerHTML = [['potion', 'Poción roja', 'Cura 1 corazón · Z'], ['elixir', 'Elixir', 'Vida completa · X']].map(([k, n, d]) =>
      `<div class="ckt-fila"><div class="ckt-nom"><b>${n}</b><span>${d}</span></div><div class="ckt-cant">Llevás <b>${inv[k] || 0}</b><br>Guardadas <b>${B[k] || 0}</b></div>` +
      `<div class="ckt-dos"><button data-b="dejar" data-k="${k}" ${inv[k] ? '' : 'disabled'}>Dejar</button><button data-b="sacar" data-k="${k}" ${B[k] ? '' : 'disabled'}>Sacar</button></div></div>`).join('');
    el.querySelectorAll('[data-b]').forEach(b => { b.onclick = () => mover(S, b.dataset.b, b.dataset.k); });
    bt.onclick = () => guardar(S);
    el.querySelector('.ck-close').onclick = () => S.closeOverlay && S.closeOverlay();
  };
  const mover = (S, que, k) => {
    const s = S.story, B = baul(s), inv = s.inv;
    if (que === 'dejar' && inv[k] > 0) { inv[k]--; B[k] = (B[k] || 0) + 1; }
    else if (que === 'sacar' && B[k] > 0) { B[k]--; inv[k] = (inv[k] || 0) + 1; }
    else return;
    S._ckSinGuardar = true;
    son('ui_click', 0.6, { minGap: 60 });
    try { S.updateQuickBar && S.updateQuickBar(); S.updateHUD && S.updateHUD(); } catch (e) {}
    pintar(S);
  };
  // guardar la ranura ahora (en el lugar dado o donde está el héroe). true si quedó guardado.
  const guardarYa = (S, lugar) => {
    if (PT() && PT().guardarAqui && PT().activa && PT().activa() !== null) return PT().guardarAqui(S, lugar);
    try { S.saveStory(); return true; } catch (e) { return false; }
  };
  // dónde aparece el héroe al continuar: delante del cartel o, si ahí hay pared, al costado (un lugar libre)
  const libre = (S, x, y) => { try { if (!S.navIsFree) return true; return [[0, 0], [-8, 0], [8, 0], [0, -6]].every(([dx, dy]) => S.navIsFree(x + dx, y + dy)); } catch (e) { return true; } };
  const llegada = (S, t) => {
    for (const [dx, dy] of [[0, 24], [0, 20], [-24, 4], [24, 4], [0, -22], [-32, -2], [32, -2]]) {   // (todos a mano: aparece "T · Guardar")
      const x = t.x + dx, y = t.y + dy;
      if (libre(S, x, y)) return { zona: t.z, x: Math.round(x - t.ax), y: Math.round(y - t.ay) };
    }
    return { zona: t.z, x: Math.round(t.x - t.ax), y: Math.round(t.y - t.ay + 30) };
  };
  const guardar = S => {
    if (!S.story || bestiasEncima(S)) return pintar(S);
    const t = S._ckTotem, lugar = t ? llegada(S, t) : null;   // (al continuar, parado junto al cartel)
    S.health = S.maxHealth; if (S.maxStamina) S.stamina = S.maxStamina;
    const ok = guardarYa(S, lugar);
    try { S.updateHUD && S.updateHUD(); S.updateStaminaBar && S.updateStaminaBar(); } catch (e) {}
    if (t) efecto(S, t);
    const J = window.CK_SONIDOS_JEFES; if (!(J && J.tocar && J.tocar('jf_guardado', 0.9))) son('quest_done', 0.8);
    S.createFloatingText(S.player.x, S.player.y - 50, ok ? '✦ PARTIDA GUARDADA ✦' : 'Prueba: no se guarda', ok ? 0xffe2a0 : 0xfde68a);
    pintar(S, ok ? 'Guardado. Vida y aguante llenos.' : '');
  };
  // las camas (ck_camas.js, ck_salas_castillo.js): guardar al dormir, donde está el héroe
  const guardarDescanso = S => { try { return guardarYa(S); } catch (e) { return false; } };
  const efecto = (S, t) => {
    const E = t.E;
    const anillo = S.add.ellipse(t.x, t.y - 2, 20, 8).setStrokeStyle(2, E.halo, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(t.y + 3);
    S.tweens.add({ targets: anillo, scaleX: 5, scaleY: 5, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => anillo.destroy() });
    for (let i = 0; i < 22; i++) {
      const q = S.add.rectangle(t.x + R(-14, 14), t.y - R(0, 40), 2, 2, i % 3 ? E.ch[i % E.ch.length] : 0xffffff, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(t.y + 4);
      S.tweens.add({ targets: q, y: q.y - R(30, 60), alpha: 0, duration: R(600, 1200), delay: R(0, 200), onComplete: () => q.destroy() });
    }
    S.tweens.add({ targets: t.halo, scaleX: 2.4, scaleY: 2.4, duration: 220, yoyo: true, onComplete: () => { try { t.halo.setScale(0.75); } catch (e) {} } });
    try { window.CK_LUZ && CK_LUZ.agregar && CK_LUZ.agregar({ x: t.lx, y: t.ly, c: E.c, r: 140, f: 1, ms: 700, curva: 'cae' }); } catch (e) {}
  };
  const abrirMenu = S => {
    asegurarUI();
    if (!S.openOverlay || !S.openOverlay('ck-totem')) return false;
    son('book_open', 0.4, { rate: 1.3 });
    pintar(S); return true;
  };
  const cerrarMenu = S => { const el = document.getElementById('ck-totem'); if (el) el.classList.remove('on'); if (S && S._overlay === 'ck-totem') S._overlay = null; };

  const it0 = P.interact;
  P.interact = function () {
    try {
      if (!this._overlay && !this.dialogOpen && !this._ckEscena && this._gameMode === 'campaign' && cerca(this) && !this.isDead) { if (abrirMenu(this)) return; }
    } catch (e) { console.warn('[carteles de guardado]', e); }
    return it0.apply(this, arguments);
  };

  // ------------------------------------------------------------------ avisos
  // la ventana de SALIR avisa si hay cosas sin guardar
  const vigilarSalir = () => {
    const m = document.getElementById('exit-modal'); if (!m) { setTimeout(vigilarSalir, 800); return; }
    new MutationObserver(() => {
      try {
        if (!m.classList.contains('active')) return;
        const S = window.activeGameScene, sin = S && S._gameMode === 'campaign' && S.story && sinG(S);
        let p = m.querySelector('#ck-sin-guardar');
        if (!p) { p = document.createElement('p'); p.id = 'ck-sin-guardar'; p.className = 'modal-subtitle'; p.style.cssText = 'color:#ffb4a0;font-weight:bold'; const sub = m.querySelector('.modal-subtitle'); (sub ? sub.parentNode : m.querySelector('.modal-card')).insertBefore(p, sub ? sub.nextSibling : null); }
        p.textContent = sin ? 'Ojo: lo que hiciste desde el último guardado no quedó guardado.' : '';
        p.style.display = sin ? '' : 'none';
      } catch (e) {}
    }).observe(m, { attributes: true, attributeFilter: ['class'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vigilarSalir); else vigilarSalir();
  // SALIR y REINICIAR en el juego: si hay cosas sin guardar, preguntan antes (se mira antes que el botón haga lo suyo)
  const BOTONES = { 'btn-hud-exit-btn': 'salir', 'btn-pause-mainmenu': 'salir', 'btn-pause-restart': 'reiniciar' };
  let pasar = false;
  const cssAviso = `
#ck-totem-aviso { position: absolute; inset: 0; z-index: 9000; display: none; align-items: center; justify-content: center; background: rgba(4, 6, 10, 0.7); font-family: var(--ui-font); }
#ck-totem-aviso.on { display: flex; }
#ck-totem-aviso .ck-win { width: min(440px, 92%); text-align: center; }
#ck-totem-aviso p { margin: 0 0 14px; font-size: 15px; color: #4a2a0c; }
#ck-totem-aviso .ckt-dos { display: flex; gap: 8px; justify-content: center; }
#ck-totem-aviso button { padding: 8px 16px; font-family: inherit; font-size: 16px; cursor: pointer; }
#ck-totem-aviso button.si { color: #fff3ea; background: linear-gradient(180deg, #a5432f, #6e2316); border: 2px solid #2a0c06; }
`;
  const preguntar = (que, seguir) => {
    if (!document.getElementById('ck-totem-aviso-css')) { const st = document.createElement('style'); st.id = 'ck-totem-aviso-css'; st.textContent = cssAviso; document.head.appendChild(st); }
    let el = document.getElementById('ck-totem-aviso');
    if (!el) { el = document.createElement('div'); el.id = 'ck-totem-aviso'; el.innerHTML = '<div class="ck-win"><h3>Sin guardar</h3><p></p><div class="ckt-dos"><button class="si"></button><button class="no">Volver al juego</button></div></div>'; }
    const host = document.fullscreenElement || document.getElementById('game-wrapper') || document.body; if (el.parentElement !== host) host.appendChild(el);
    el.querySelector('p').textContent = que === 'salir'
      ? 'Lo que hiciste desde el último guardado no quedó guardado. Si salís ahora, al continuar volvés al último cartel de guardado (o cama) que usaste.'
      : 'Reiniciar te lleva al último cartel de guardado (o cama) que usaste: lo que hiciste desde entonces se pierde.';
    el.querySelector('.si').textContent = que === 'salir' ? 'Salir igual' : 'Reiniciar igual';
    const cerrar = () => { el.classList.remove('on'); document.removeEventListener('keydown', tecla, true); };
    const tecla = e => { if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(); } };
    el.querySelector('.si').onclick = () => { cerrar(); seguir(); };
    el.querySelector('.no').onclick = cerrar;
    document.addEventListener('keydown', tecla, true);
    el.classList.add('on');
    setTimeout(() => { try { el.querySelector('.no').focus(); } catch (e) {} }, 30);
  };
  document.addEventListener('click', e => {
    try {
      if (pasar) return;
      const b = e.target && e.target.closest && e.target.closest('#btn-hud-exit-btn, #btn-pause-mainmenu, #btn-pause-restart'); if (!b) return;
      const S = window.activeGameScene;
      if (!S || S._gameMode !== 'campaign' || !S.story || !sinG(S)) return;
      if (!(PT() && PT().activa && PT().activa() !== null)) return;
      if (prueba()) return;
      e.preventDefault(); e.stopImmediatePropagation();
      preguntar(BOTONES[b.id], () => { pasar = true; try { b.click(); } finally { pasar = false; } });
    } catch (er) {}
  }, true);
  // el consejo de la pantalla de carga
  try {
    const C = window.CK_PANTALLA_CARGA && CK_PANTALLA_CARGA.CONSEJOS;
    if (Array.isArray(C)) { const i = C.findIndex(t => /se guarda sola/.test(t)); if (i >= 0) C[i] = 'La partida se guarda en los carteles de guardado (T): en la taberna, la posada, los campamentos y antes de cada jefe. Dormir en una cama también guarda. CONTINUAR te deja en el último que usaste.'; }
  } catch (e) {}

  window.CK_TOTEMS = window.CK_CARTELES = { CARTELES, ESTILOS, TOTEMS: CARTELES, poner, quitar, cerca, guardar, guardarDescanso, abrirMenu, preguntar, llegada };
})();
