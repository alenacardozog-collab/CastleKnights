'use strict';
/* Jugabilidad de las notas de prueba (14/11, pedido del dueño: "te deje todas las notas de los arreglos del juego, terminalas").
   Cada parte dice de qué nota viene:
   - ARAÑITAS: un bicho nuevo y chico (dibujado por código) que sale de los huesos que se rompen en la Fosa (82). Lo que se
     rompe y cómo está en ck_terreno_rompible.js v2 (62, 80, 83, 114, 115, 117, 122, 123, 132).
   - Galerías: las piedras del derrumbe con el recorte limpio, caen apareciendo desde el techo y suenan más pesadas (75);
     monedas y joyas tiradas en el botín que se juntan pisándolas (78).
   - La Fosa: el derrumbe de los cazadores, al romperse, deja las piedras un rato en el piso y después se van, y el lugar
     queda libre (83).
   - San Roque: más animales: vacas, perros (ladran si te acercás) y chanchos (59).
   - Bosque de la Frontera: el cofre del campamento se muda a otro lugar (70).
   - Claro de las Bestias: las bestias salen de la guarida del árbol caído (72).
   - Mazmorra del Sello: los pinchos de la fragua envenenan (135); las coronas de los reyes se explican mejor (139).
   Borrar su línea de index.html lo saca. */
(function () {
  if (typeof MainGameScene === 'undefined') return;
  const P = MainGameScene.prototype;
  window.CK_NOTAS_JUEGO_ARTE = {"aranita": {"aranita_idle": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAABkCAYAAACoy2Z3AAAC10lEQVR4Xu3asW4TMRgH8AN1YEQMUScGxMDIk/AQfTAegifpyIAYmKoOzN1AjuJgGftiFys4ud9Pipo2uuvpvvv7s++yLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMCFeHEhxwl02r25/VXa5PHng9wzxM2QvfwnAjIX9Ti/cM5DQ4g/4xGE39/ubmsHtN8m/bC2H8a5xnxM30AEZC7qMYe0YcSBKR2gYvP48O79/oC/fv92PPDDZ8fGkzad9L2VSr+t5WPapWxaiFIZ1wIS/Hh82C/VS12/NGNjnXrMo1aLeF2n2UgbRyrkI5fnRQNpt9V8TLkCGRGQIG8eMSC1pSRtTSSe254Bq1SP0syX5ylNlmLzuFuejjv9vLzaN4/YZL4sT8unw99ODYLIR+7lpVwUpwISQhKDEgMSQnK/e30MS36fmDb57ZLaQJMOWC31COIst1Rf/pZfw/H8rV3boWnEVy40j9BE0lrE9yZabbacj+lWIKUgpLecShd1CEdNDMjHwmClobQrhaS2dWs9+HelZyHpCqNFyEhKM++31Xxc5AqkdP92TQyIGdU46crhufUo3XNXo7qWCU84p+F1qibh8/QVOPfjbCUfU61AWgNyKPPa1xS7mwxltdtVaa0OYemqhwe0Y9TOY6xJ6b+Utqk9LxxzlNdr6/mYqoG0XuyBgJxPR2NvGrDWZrq+IbfeyHuqrkmfx5bzMU0DyYvQspweEZCW4vNHbcaVNPVumka/lnyMIB99tpaPqZ+BjGgQUWlfI/d/jeIglZ+nkYNK6YFt6W9bVjvfI69f+egnH8scDWTkgAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMDcfgNu0NSnf+H54QAAAABJRU5ErkJggg==", "aranita_walk": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAABkCAYAAABaQU4jAAADEElEQVR4Xu3cMW4TQRQG4AVRpEQUVqoUEQUlJ+EQHIxDcBJKCpQiVZSCOh1oLDYZ1jNmZrVi33q/T4qiJLZx/PvPvrzFGQYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADYnlfbu8svDu+uf5Xu/+PPh01/X1slj1jkEYs8YpFHLJeYx5tYD/Gp9KCngWl8P14ifXxzuK7d/eN18i/Wboc+8ohFHrHIIxZ5xLK3PMJuevIgSk+Rcbj6cPv++OXvdz/+utj948Nxk1WaiksDG+fJIxZ5xCKPWOQRy17zCLnBqoUxDkb5cDUdrKZbq/zj8fq1VSRtQ1a6VJ7R3DxG8uijHzHlW3b9WI9+xLTHfryOGcWp0jZqHK4+D0/Pb0naXqWDfnr7dnj7vO2anmakzbQYtR9gvXkk46ncUr6004/16Ed8+rGePfcj3AarNATlp/RK244vw1X12fNpuBq+Dk/Dx8LBvPRvUVYqSe2xas2DfvoRk37EoB8x7bUfm9xgpQ1VjzRkJU5FLSffPM3NY/pbpS3WfPljNzcP/ViOfsSiH7HspR+hNlgtG6Xs1YHnXkXYfZDh/OZqevDNs/qTSVce/pRGP/2Ip3a6XD/+P/2IZ+/9CDVgldQOxONBvfU60wHBtqRdxw+upjzObUq8wrOPfqxPP+LSj/XtuR9hBqxpCC2nK5bYgrSEz4vabyTJ3DwMVf+mH9ugH+vQj23YWz9C/x+suQfs1q3Wkrd/icYht/ZHW5f4nkubxNLnOLXk87d0W0ve/iXSj9iWfP7qRz/9GGIMWLZIUKcfoB8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADsz28xEiT6n2lOPAAAAABJRU5ErkJggg==", "aranita_attack1": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAABkCAYAAACoy2Z3AAADU0lEQVR4Xu3bMW4UMRQA0AFRUCKKKBUFoqDkJByCg3EITkJJgSioohTU6UCO4vDj2BNvxsl6d9+Tos1ONM7E3u/v75ksCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABP7+zt+d/0W/JrlI7VvmpXtdYOcFheHdbl8tzShH/55+JFTB45CaTj6ft3Z+ety7p3bpmEYvvAYbmeGKAlJoty8k9y8vj4/sP1+x+/ft5p6vflxe37nHDya/5BTlA8vVoFmRgDHuOgKxDB8HxipVBWHil5lImjpty+ipWNCWycPFZldddbLWatdtjmmOat6ROIYNifsu/j+3hVOXl8Wa5uD39dXl9XH7lC+bZcLZ9vjuUVr+2rsda2G5O1avHmZ/eqwzjZGa9+pzJvTZtABMOcWqunJCWNlpQ8UhL5NOefdfBayX3XarEc33z+2rjz36nNWy9nHPy1YChXUmn129o+qQVDOl8w9CtXnXmrKb3G+xs9UhKpKe+JMEatX2O1mCrGXDXmajFVIt/P3txWK6qO3eU+i7GyZd7KZpy3pq1ASg8FQ7a2ddJKTDzOTYCsPYV15yZ6Uj7RxXa1JJ+OrX3ee6vFeG8qPgSx/aqPT+zvPNmPmLdy3LS2xfZpugRSW/G0nt6JSaMlbp3EFUEMsObJJ6w1+dQmq2VZqv/zUd4Yn3EFdYxq2yjxflSPslqsTYTcV/b9sW/5TpdAWuIH+LHBUEtOtPX2lyeo9qdnjML47FQtJj3t01ZUbav9X8pJvPbY+yzjMlUC6emULcHAvGyPjNNK6HnLsfabaue0bqiPu9Lj0VOxb9nyndVUCaT3g50IhufVCpAtJI1tehZcpVZyYbue8dhl3lrb/poldqZJIGXn9+yXjwiGnkE/NT2rqa3sqY/XEzMjiJmHtWIoLH53NkvSiKZ8jDcbkSDW2hrZ/rHZxyQhqfRrjc/Iz3StrZHtH4v4xFX8m0bGUC02ZoiXKRLIyI4GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgbv8Aeh7pcbVL9WUAAAAASUVORK5CYII=", "aranita_hurt": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAYAAADDhn8LAAACHklEQVR4Xu3ZMW7UQBQGYIMotkQUq1QUiILT0HCDnAAoOAQF4gTcgIaTUFIgCqooBfV2oLdiLDPMkLGw0DP5PsmK1pFHG7/5/WacaQIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAg3NnzbTg+uPje+v7X3652/Xft1ZvXb5v1ePnq+W7rcTd7MUoI6jDE54fHi6l1tILTG4d1SgjqMMTnXj1awemNk03aZMeEjk7QmuwhihGePHp8/vnpy+df7u3X66tzJ2ldX87rNONiQkcnaE320Xr0ri/nM3aalB2kF44yoZfhiGDU4SjqcJTre6GjrReOMqFH61GHq1zfC10GKQPS21fUE7sE43I6zUeI7lHa/cfj/bmAJXgZbvzetbpBqcez6TQfdT1eLOpRgpf5XqQLSGsS37Qkejcd5qP2dDpMH6bT+XTpIDrJuNYkvmlJ9H46zEctfhcBCqWDZO4k6QLSs9xPRIdYI0ISLK22s+wga+sRIQmZl1bFve1u2d8bWQItNtbntyY9a4vG70aWQMun//9Yj1QBaem9afp5fvj/IK0Nu46yXu9NU2tPUrSuaW3YM3aUNAGpu8fI5O2FZ42RrnUb1d1jZPL2wrPGSNf6l1LvQbYIQNEaa8vxb4MtAvCnrrLl+FtJERBP8VyyPcUBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9uQHCtA1GBLAqXgAAAAASUVORK5CYII=", "aranita_death": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAABkCAYAAACoy2Z3AAAC4ElEQVR4Xu3aPXLTQBgGYMFQUFNkUlEwFJSchENwsByC01AwFFSZFNTpYNZ47WUjyauVZK/s56kSJ8qPXul7tZt0HQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADPdvbv/U/Mlao/jqPYc1h53aa8v/QMA9WoHT+1xjHv6/fgqP7e157r2uHN6c85vtrShExxCXPp7cZo8zi8OrPSa73vtlJCd+4apmi+QeGHnF3h4//3d/dDv++JmGPo6TCMPKFuFxEK+5kJvtkDSwohPtukTbiyPTx8+7tL8/vPHIdX9x3YBpsfkb3viKiePdtUMqJTVx2Vt+fw3+TeQ9Ck3jTYO/LQ8QnGk5ZHfGH3Hb2FvsUUxl/TJKvyctXlE8pivb+99yJYH1lZMySO3pXyaXYHk+gKJxfG1ez58+kP3tvv19HgYat+65+7L/rWhYmJcet7isF8ijyB9et7SjdO60gHmnJ9HaR5b01yB9F3Q+ZDJT3IojSGhPEKJfN4Pq3RouXnK5VtYY6uG0jxYVt+Q6vs7YXjAsupbX20eW9pab65AhqRhpCuMEqFEAoWxnGzffewfGl6IeeQ32Ny9/FsXS2Hkn0t20o/HMtnS0NqKW8ijqQIpGfDJhT46tMKNwXxD235pVvtMJuVhYK3jVHnkwue7V9Zz7Xk0VSB9hgZNHFqlx+RL9mvdk1zDhGIvymNs+8QqZJ6pq3Plsa5rz6OZAsmH1NiQiZZ4ii0ZjhwNrUiC2jyUxjLS1Xm+VZWLxVGbGafdQh7NFEjpSqJW34qj7zX+L4u+YliydMdyMdzq5INr7XuLcdecRxMFsuRAAv5RwG2RBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA0V/WpCtTuTft6QAAAABJRU5ErkJggg=="}, "perro": {"ck_perro_idle": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAANCAYAAADBo8xmAAAA2klEQVR4XmNgIBGoSYn8J1ELVoDLHEaQapDkrWdvwGxCAJtBxOpFBrjMgTuiJ8bkf8mSM3gdBTIkzUmBwchAjeHchVtw8wnpQwf4zGGCKZ617wGhwIGHBMgxHZtuwNWDLABhkKcIGsKA3xyUECEmfYBCCBmAHCbEwwF3LDFmgAAuczAchK6QGAAKXeR0BIsSUgHIHBZsmkBpBBdATjtRZQ1gZSVLfLCmPXLMISuE0EMEV6IlBLCZA0/UgwVgBDUxiZKYcoda5oABzDBkQ7GJEQLkmDPoomzQOQgAn8x6G0ww6FcAAAAASUVORK5CYII=", "ck_perro_walk": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAAANCAYAAAAKeCiYAAABEUlEQVR4XmNgIBGoSYn8J1ELVjBUzGEEuR7k2FvP3oDZhAA2jxGrFxngM2cwuQceKD0xJv9LlpzBG0ggh6c5KTAYGagxnLtwC+5fQvrQATHmDBb3MMEcP2vfA0KJB55SQIHTsekGXD3IwyAM8hRBQxjwmzPY3IOSYogpF0ApCBmAAkqIhwMeeMSYAQKEzIFlfUIBTsgcSt2DEUDoFhIDQKkPuRyCZSFSwWA0hwWbJ0BlDC6AXPZElTWAlZUs8cFadg0Hc8hKQegxjasQJgSGgjnwQnoUYAcYWYOYQo2Yds9wNQel9kD2JIxNjMdhAJsebGKEwKAyBz0AYG0cZE8QG0jU8hiuKp9Yd1ASYaNlEAEAALiuDBQenCwsAAAAAElFTkSuQmCC"}, "rocas": {"roca_1": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAATCAYAAAB/TkaLAAAEOUlEQVR4XoWUW2/UVhSFv2MfX+dKJgmEwEBShZKAVGgpAiH1sX2g4olf0Z/IW1GlvhQBgZaWKLeSzOQymYzn4hnbx+dUNi195EhHtrW31t5ee60tfnr6A8ayEAKUUqjckCtBkin+PjwiSzOiaITyAgOwUHXF+tqXVCoeaTrDtjTalCEcKcnzHJkDlhEYYTGJp3SPTtjf+4CptT5mFscLqLk20WDIKZjTl28+hb67syZ830Nrg1KGXBukwSLTBsd2mMQzjk7PSkDHZLRaLR48eMDVa9cYDAYEnk+n0+HN603ebm7iSIvnrzDfP7wrcp1itCZLU2SaKnIDnaNDDg46zKzAbKxe5+t731CpVzECEpUR1qq4rs/ipcs8rNbwfJ/93V3qYcCzX1+ataWWmJ+7AAKktF18x+Ovsz3GRpqnTx5z89Y60XBEmqUYYz7ePCdJh2R5xsLFizz+8QmvX7/i+c/P6XUOCzpMvdYQ860mVpor+tGIXpyZCxUf6Tr0+n2kI7GlLLkrQIt327YJggBlNL3+GWGlSr3RpFJt0PRcXrzfMUIIZDSc8GbnwJjplPX731KtNxlGY4Qlmc0S0jRhNpthWQLHcXBdF0sIMp3RbLV4+OgRL397wWg0KBuYTMbIeJp8/BjHDKNRKZ/cKAb7+yRJguO4WJbBcWQpuSzLyH0fpTJylROEQSmp7uER1YUWmcqR291TYycJtUadRqPBaDSiVq/h2JJxNmZ+fo5Go0mea1KVlg0Evo+0bcbjCacnJ4zHYyzLKmO+51OSZrSF43l4nsfZ2RlxHLO4OE+73abZrJdTL0C10OXwLAO1Voter1/y3Ww2Oe52SlClNCV8wdskHtPvnaGVYjgclskXGk3CMCRXGUql2IUPbFl2VfCtDSVF0zgm15qGlPyy+YeRq4sLYgcM8YxX737/5JRLS5eI4yl+4JQWtm2rtGBRLAx8zvsREothNGQYRYRhhUgp1ttLwsqNpmKEIPRZubwsCtSvbm7QOz4hHo8RopCSg+t4VMMqYVChe9Dl6KDD1vsttre28cMAWQlYW14Slm0hCx6Xl5eYJTOh/x1EMYTpZMbWn+85Pj6h0ahjO075F8WC2dveIYoiOoedUkKpqHD/9i2RpFOMyZC+7xJ6IePJhLd7+2bOD9nd20WIAsRgHxyyfPkKfhDQ6/VwHYfe6THdbgcpwKlWuL16TWTZFJ1n2JZA2sJgdFYuh/WrV8S7DwfGy6FgxHFdkmHGKIpL4Z+f9wtfg1E06jVGWcZGe1kUakqyGbJYoeXWQ6OyrKwibMPKYkskNszNNZmohErgIYRmMOgzm47KGwZuCXhv44ZwHLuMe46DlJKiQuE+RCE8obExVCo+t1ba4mhwzt31myJKpnyx0sYKJO2ry3iNOhNtuHNjRWitKJrCGAQCow3/L+HPnNX29TL3v+fnzj+qdjCz+PIhgQAAAABJRU5ErkJggg==", "roca_2": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAdCAYAAAAkXAW5AAAIz0lEQVR4Xo1Xa48cRxU91VX9mpmemZ31etcb27tehGwSTEgIJDhCPIQwEnwEPsA3/iASIh8sBQmQIoIdWQlrxyGOHbN+ZF8zvdPT0896oHt7nYQPoPRqdjW91VXn3nvOubfF73/7a9BlnYVwFoCDdYCAQBBGOD5OcWf3LuiOFp7jxV/h+sX1H4m6qVBXNYxuAUh4ngSkh1vv3cbsOMW1N3+AP7z1Ryja1YFOdXB8uEeQEAYhiqLA7u4ujPD58N/95ldoXINRMoRk4I7X9OI+snmGP7/9NvYeP0aSJHjrxl/4mV9e/6FoG42m1ZBK8Yf27vX66EURh6PgKYCzIGCtAYSHKIoZyjs3P3AQPq698Spe+saLkEqiqCWatiTkfDlhsCxzeIHEG9e+j8vpFdx89x+ArnH+wgv4042/8so3v/uqkNbBFA2qooYQEoKiJhDLokIQKARSIQgDKF9yVH+/9b578/VX8Z3XXkNRLVFWS7gaEMIDhOGHjbUgtFrX8FWItY0z2N7ZwsbGOhbzOe7euYs6m2GQDPDOrduu7weibTVO5nNsrG/AONGBODpOMUoSTEYjxHEPfujjxtt/c9UyxerZNRhnMJ+fIIwDRm6dZu50pXOgbRTV2lnUbYl23iDuh1hZuYAgCDhh8yzD/GgKjCduf++poEwnwxHiMDzNRF4h8GIsZIUsL3D7/dtOSoerL38bo9EQ8/wEMqDUCeYAvI479EsIwcAkIWFSC0A6mKZFltcYTob42c+vgzjx4Yf38OmjPeDiC25+OBPlskJZFKecgECxLLHIcuwfP3aP9v6NV66+jJ/8+KcQ0mFZLOAxQ6gUdBrFTwA8OD4Y8DzBGLjCzkKGCgGpQUgo6UO3Blvb29jYPI+b797iVdPpVMT9uHteej60tsiyJd9Yn5zDeDxB2xoI5xHz+ABjuhKA6GABogMBIjlrB1hBtx2MMbC8tssUIVssMqRpinSWYjwe8Tlt2yLP8g6EEj6iOEbRzFy9tNhYP8eb7+7eQVVVSAaDbjOhYA2VgrLi8T3nBDyPgH5hH3Q4h0r8sRZN21AK2YeqssTK6irOrZ1DkASOuMIgmqbC/GTGX7L5HFJ4WD+zzjL65JMH0NogScZQvg9FRKOInej4QEAIn/RYJfSRUkJKBel5KMsK+wcHODg85ACCXh+tsagbzeedLE5BzGYHOMmP3MHTKTzhYTRKTqWqMJul+OD9XSyXS6ytnkG/lyAIQo7eWeIG8eE5Xzx2ROFRdiQcJPJFwXInThhHkjbo9XpcksVJgfFqwmlTZZUjiCNEcQgpPVjhUNYFjNVMvsViifsfP4CSAcaTER9M963VnbnBwFFGiCTOgyS5El+sh7Yh2VpI5TOHjDaw0sJaB2u6bDCItm0YxPb2RYxXxuj1e9CmhRCOo4yiiN3t3r17bMfDcYLxeAwVKEgpUFUFtG4R+CEkFKzWWMxz5IsSeV7CVwGDIJlSJijbFCzt+yUQFYAhrly+AhJ8ls2ZUMQFjpoehMfEOjg6RDqf4tOHFiuTMdbWzzD7KcVVUUJ7BrrSeLz3BFKF8MMedF3DGCIqeYqE1hpVU8C5znU5E+PVs24QRhgMBqiaCh4R7tQL6rZl9OyKSkIpxfxLswzTdIr05ATD4QCTyYSNh6qTpieYZQsEvoY5WbBPxFEfUp2WigJjz/tCUYpuErqiXHYHilPZUXIl2ZJD3TSwCLjurbUIezHOjtaxublJqeLMBXEfxWLBHFKKvMegrltIZSGURN/vQfmKAwp8H2FEe6wAF+G8vpKiMmSrd7ktk8Se69y05EqAcQ5lWaOoalRVzYfv7OzA933uDwS83+/DeZIlaDXJuGtwdV1zkASqaWr4gUQ/jhGECgfzFA/3HgmvJjMBcDQ9wiLPGCmxl7LFcwYEGTCnUAlgnAwxHg7h2BkNmrplubZac+ugX1XTgrolgSO1OO1QlxVnlDlR1Wib+nNOeMRWuiiqumpQNXXndq2FM47t1WjqnI5tnBQyiAcdca1hsJQNUhL1IDJXUg1974YY6iEC2tBQw+MKssUced4ZFRPzub8P+mREAeq66RoiuZ+gp7ppy1mHqq1wdDhjslnXclRRHHEATWOQTlMe52i2IDVQpsgbGuKZcCjSAtODfXy2/4zBfA6CNH4yzQTOwgUqQC/pdaVwolMEHVDXsNqw86VpxgQOQ+K0xTLP2QeMttAVzZLcKniPKAihZYu6WmJ6fIzDg30Q5VZWRvCCCS5f2hIP9x5BkbziOEHeVNjf38eFYAtRJJlQzmrotmWfoO5IUREoIiu5JmXCUE9gzngQbOddCanRKSFR5ktk2Yx70vkXNpmYxKkHT/ahqOdQOVZXVxH4MZ4+eyammDvyAhpAndGwjiQL+FxMoCxKrnVIY6Dyu+lKOG5YbNWdrKCkZIc8PjpAOptiOEywtXURvi/R1iV27z/E1Ss7goLqOMEjfotk0Cf7FU8+23MeDKQneD6g9NWmRFnVaHQNJxxniWxb0eE8YxropuMIGZ0UAvNFhtn0GNRKsqpzyNt3PuJDX/zaBWF0A3FqB0opYm7Duu31aebTYu+zp25tmKA1mklKi8lDGm2xvrHO7yNEOko/jX304/vUvgWWVYXlopP62toEx9kC589NxJ2P77tL588IFoK18COfByHOBKXIk+TphrOR9CJsQIh/7T37rxedtVGCw2nKEYdhCN3U0FbDFx7iKOKm15Ql0umULXp7ewtKCgZBPNk6NxE0Y8RxhDCM2D25jPzeQRzniC0z3pcBfM/H61evcM3eu3fffe9bL6EoK5hWY55O8dHdBr4UaIxBoDzuO51yptC6wXA4YdLd+fgBNs+MWY3ckUMCEDK/qLUPk+FzEJbTSISybQPjfJr5uu8WeOXyjrj5z7vum1+/hFlRYpIMUOQ5KlieO2vPgzUtlApRaAv4AaaLnD/bm6tULY6exnt6pQgCH9kiw9HhFIcHx52kv7CM/3/tXNx25PP093+tpP9/1f2+fP0HpmXzLiXHYm0AAAAASUVORK5CYII="}};
  const ARTE = window.CK_NOTAS_JUEGO_ARTE;
  const zonaDe = S => (S && S.currentZoneKey && S.currentZoneKey()) || '';
  const son = (k, v, o) => { try { return sfx.fx(k, v, o); } catch (e) { return false; } };
  const azar = (a, b) => a + Math.random() * (b - a);
  const pies = S => ({ x: S.player.body ? S.player.body.center.x : S.player.x, y: S.player.body ? S.player.body.bottom : S.player.y });
  const Z = {
    galerias: 'ed_cueva_galerias.main', fosa: 'ed_cueva_fosa.main', sanRoque: 'ed_san_roque.main', frontera: 'ed_bosque_de_la_frontera.main',
    claro: 'ed_claro_de_las_bestias.main', mazmorra: 'ed_mazmorra_sello.main'
  };

  // ================================================================== 1. arañitas (82)
  window.GAME_ASSETS_BASE64 = window.GAME_ASSETS_BASE64 || {};
  Object.keys(ARTE.aranita).forEach(k => { window.GAME_ASSETS_BASE64[k] = ARTE.aranita[k]; });
  if (typeof ENEMY_TYPES !== 'undefined' && !ENEMY_TYPES.aranita)
    ENEMY_TYPES.aranita = { name: 'Arañita', frames: { idle: 4, walk: 6, attack1: 4, hurt: 2, death: 4 }, hp: 1, speed: 112, dmg: 1, reach: 30,
      cd: 1100, hitAt: 200, xp: 3, coins: 0, scale: 1.1, sfx: ['ck_aranas', 'slime_hit', 'slime_death', 1.5] };

  // ================================================================== 2. texturas al arrancar
  const cargar = (S, k, src, fw, fh) => new Promise(ok => {
    if (S.textures.exists(k)) return ok();
    const im = new Image();
    im.onload = () => { try { if (!S.textures.exists(k)) { if (fw) S.textures.addSpriteSheet(k, im, { frameWidth: fw, frameHeight: fh }); else S.textures.addImage(k, im); } } catch (e) {} ok(); };
    im.onerror = () => ok(); im.src = src;
  });
  const create0 = P.create;
  P.create = function () {
    const r = create0.apply(this, arguments);
    const S = this;
    try {
      // las piedras del derrumbe, recortadas (ck_trampas_suelo.js busca 'cktsu_roca_1/2': si ya existen, usa éstas)
      Object.keys(ARTE.rocas).forEach(k => cargar(S, 'cktsu_' + k, ARTE.rocas[k]));
      // el perro
      cargar(S, 'ck_perro_idle', ARTE.perro.ck_perro_idle, 18, 13).then(() => {
        if (S.textures.exists('ck_perro_idle') && !S.anims.exists('ck_perro_idle')) S.anims.create({ key: 'ck_perro_idle', frames: S.anims.generateFrameNumbers('ck_perro_idle', { start: 0, end: 1 }), frameRate: 3, repeat: -1 });
      });
      cargar(S, 'ck_perro_walk', ARTE.perro.ck_perro_walk, 18, 13).then(() => {
        if (S.textures.exists('ck_perro_walk') && !S.anims.exists('ck_perro_walk')) S.anims.create({ key: 'ck_perro_walk', frames: S.anims.generateFrameNumbers('ck_perro_walk', { start: 0, end: 3 }), frameRate: 9, repeat: -1 });
      });
    } catch (e) { console.warn('[notas juego] texturas', e); }
    return r;
  };

  // ================================================================== 3. el derrumbe suena más pesado (75)
  if (typeof sfx !== 'undefined' && sfx.fx && !sfx._ckNJ) {
    const fx0 = sfx.fx.bind(sfx); sfx._ckNJ = true;
    sfx.fx = function (n, v, o) {
      try {
        const z = zonaDe(window.activeGameScene);
        if (/^ed_cueva_/.test(z) || z === Z.mazmorra) {
          if (n === 'ck_piedra') { fx0('ck_piedra_pesada', Math.min(1, (v === undefined ? 0.8 : v) * 1.2), o); return fx0('ck_piedra', (v === undefined ? 0.8 : v) * 0.6, o); }
          if (n === 'ck_derrumbe') { fx0('ck_derrumbe_pesado', 0.85, o); return true; }
        }
      } catch (e) {}
      return fx0(n, v, o);
    };
  }
  // las piedras que caen aparecen desde arriba (no se dibujan encima del techo de la cueva): mientras caen se van haciendo visibles
  const vigilarPiedras = S => {
    S.children.list.forEach(o => {
      if (o._ckNJroca || !o.texture || !/^cktsu_roca_/.test(o.texture.key)) return;
      o._ckNJroca = true;
      o.setAlpha(0);
      S.tweens.add({ targets: o, alpha: 1, duration: 170, ease: 'Quad.easeIn' });
    });
  };

  // ================================================================== 4. animales en San Roque (59)
  const animales = a => {
    const w = (key, idle, walk, sc, oy, pts, lines, speed) => a.actors.push({ type: 'walker', key, idle, walk, scale: sc, ox: 0.5, oy, speed, pts, lines, _ckAnimal: true });
    // vacas: dos en el pasto abierto junto a la granja del norte, una frente al molino (del otro lado del río)
    w('int_cow_idle', 'cow_idle', 'cow_walk', 1.25, 0.94, [[730, 90, 5200], [772, 128, 4200], [716, 150, 4800]], ['Muuu… 🐄', 'La vaca te mira masticando, sin apuro'], 9);
    w('int_cow_idle', 'cow_idle', 'cow_walk', 1.2, 0.94, [[790, 52, 4600], [806, 96, 5200], [764, 70, 3800]], ['Muuu 🐄'], 8);
    w('int_cow_idle', 'cow_idle', 'cow_walk', 1.2, 0.94, [[1292, 604, 5000], [1330, 618, 4400], [1304, 628, 3600]], ['La vaca mueve la cola y sigue comiendo pasto'], 8);
    // perros: uno en la plaza, otro va y viene por el camino del sur
    w('ck_perro_idle', 'ck_perro_idle', 'ck_perro_walk', 1.25, 1, [[700, 380, 2600], [760, 410, 1600], [640, 420, 2200], [720, 470, 1800]], ['¡Guau! 🐶', 'El perro te huele las botas y mueve la cola'], 34);
    w('ck_perro_idle', 'ck_perro_idle', 'ck_perro_walk', 1.15, 1, [[575, 560, 1800], [590, 650, 2400], [575, 740, 2000], [562, 610, 1400]], ['¡Guau, guau!'], 40);
    // chanchos adentro del corral de la casita
    w('ck_cerdo_idle', 'ck_cerdo_idle', 'ck_cerdo_walk', 0.9, 0.95, [[340, 660, 3000], [380, 670, 2600], [360, 645, 2400]], ['Oinc 🐷'], 12);
    w('ck_cerdo_idle', 'ck_cerdo_idle', 'ck_cerdo_walk', 0.85, 0.95, [[402, 652, 2600], [420, 672, 3000], [392, 676, 2200]], ['El chancho hoza en el barro'], 11);
  };
  if (typeof INTERIOR_LAYOUTS !== 'undefined' && INTERIOR_LAYOUTS.ed_san_roque) {
    const L0 = INTERIOR_LAYOUTS.ed_san_roque;
    INTERIOR_LAYOUTS.ed_san_roque = function (kit) {
      const r = L0.apply(this, arguments);
      try { const a = kit.areas && kit.areas.main; if (a) { a.actors = a.actors || []; animales(a); } } catch (e) { console.warn('[notas juego] animales', e); }
      return r;
    };
  }
  // ladran y mugen cuando el héroe se acerca
  const voces = S => {
    const now = S.time.now; if (S._ckNJvoz && now < S._ckNJvoz) return;
    const p = pies(S);
    const cerca = S.children.list.find(o => o.texture && o.visible && /^(ck_perro_|int_cow_)/.test(o.texture.key) && Math.hypot(o.x - p.x, o.y - p.y) < 70);
    if (!cerca) return;
    S._ckNJvoz = now + 6000 + Math.random() * 5000;
    if (/perro/.test(cerca.texture.key)) son('ck_perro', 0.45); else son('ck_vaca', 0.4);
  };

  // ================================================================== 5. el cofre del campamento de la Frontera (70)
  const COFRE_FUERA = { [Z.frontera]: { caja: [860, 296, 930, 354], a: [735, 292] } };   // al lado del estandarte de la carpa de la izquierda
  const moverCofre = S => {
    const z = zonaDe(S), c = COFRE_FUERA[z], st = S.story; if (!c || !st || !st.flags) return;
    const pos = st.flags.cofres_pos3 && st.flags.cofres_pos3[z]; if (!pos) return;
    const ab = st.flags.cofres || {};
    let cambio = false;
    pos.forEach((q, i) => {
      if (ab[z + '#' + i]) return;
      if (q[0] > c.caja[0] && q[0] < c.caja[2] && q[1] > c.caja[1] && q[1] < c.caja[3]) { pos[i] = c.a.slice(); cambio = true; }
    });
    if (cambio) { try { S.saveStory && S.saveStory(); } catch (e) {} }
    return cambio;
  };

  // ================================================================== 6. la guarida del Claro (72)
  const GUARIDA = { x: 356, y: 486 };
  const sz0 = P.spawnZoneEnemies;
  if (sz0) P.spawnZoneEnemies = function (area) {
    const r = sz0.apply(this, arguments);
    try {
      if (area && area.key === Z.claro && this.enemies) {
        const S = this, a = area, dx = a.x + GUARIDA.x, dy = a.y + GUARIDA.y;
        const lista = this.enemies.getChildren().filter(e => e.active && !e.isDead && e.zone === area.key && e.def && !e.def.boss && !e.def.flying && e.body);
        lista.forEach((e, i) => {
          if (i % 3 === 2) return;                    // algunas ya andan por el claro
          const tx = e.x, ty = e.y, alto = e.body.bottom - e.y;
          e.setVisible(false); e.body.enable = false; e._ckNJsale = true;
          S.time.delayedCall(900 + i * 1300, () => {
            if (!e.active || e.isDead || zonaDe(S) !== Z.claro) return;
            e.setPosition(dx, dy - alto).setVisible(true).setAlpha(0);
            S.tweens.add({ targets: e, alpha: 1, duration: 350 });
            const d = Math.hypot(tx - e.x, ty - e.y), dur = Math.max(500, d / 70 * 1000);
            if (e.anims && S.anims.exists(e.type + '_walk')) e.play(e.type + '_walk', true);
            e.setFlipX(tx < e.x);
            S.tweens.add({ targets: e, x: tx, y: ty, duration: dur, ease: 'Sine.easeOut', onComplete: () => {
              if (!e.active) return; e.body.enable = true; e.body.reset(tx, ty); e._ckNJsale = false;
              if (e.anims && S.anims.exists(e.type + '_idle')) e.play(e.type + '_idle', true);
            } });
            if (i < 3) son('ck_f_lobo', 0.35) || son('beast_growl', 0.35);
          });
        });
      }
    } catch (e) { console.warn('[notas juego] guarida', e); }
    return r;
  };

  // ================================================================== 7. tesoro en el botín de las Galerías (78)
  const TESORO = [[946, 252], [962, 262], [978, 248], [994, 266], [1008, 254], [1024, 268], [958, 274], [1040, 256], [1016, 278], [984, 280]];
  const texMoneda = S => {
    if (S.textures.exists('ckna_monedas')) return;
    const t = S.textures.createCanvas('ckna_monedas', 9, 6), g = t.getContext();
    const p = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    p('#5a3c08', 0, 2, 5, 4); p('#e8b830', 1, 2, 3, 3); p('#fff2a0', 1, 2, 1, 1);
    p('#5a3c08', 4, 0, 5, 4); p('#f4c840', 5, 0, 3, 3); p('#fff6b8', 5, 0, 1, 1);
    p('#3a1a40', 3, 4, 2, 2); p('#c058ff', 3, 4, 1, 1);
    t.refresh();
  };
  const ponerTesoro = S => {
    const a = S.currentInterior.area, st = S.story; if (!st) return;
    st.flags = st.flags || {}; const ya = (st.flags.tesoro_galerias = st.flags.tesoro_galerias || []);
    texMoneda(S);
    S._ckNJtesoro = TESORO.map(([x, y], i) => {
      if (ya.indexOf(i) >= 0) return null;
      const sp = S.add.image(a.x + x, a.y + y, 'ckna_monedas').setOrigin(0.5, 1).setDepth(a.y + y - 1).setScale(1.1);
      S.tweens.add({ targets: sp, alpha: { from: 1, to: 0.75 }, duration: 600 + i * 40, yoyo: true, repeat: -1 });
      return { sp, i, x: a.x + x, y: a.y + y };
    }).filter(Boolean);
  };
  const juntarTesoro = S => {
    const L = S._ckNJtesoro; if (!L || !L.length) return;
    const p = pies(S), st = S.story;
    L.forEach(t => {
      if (t.ok || Math.hypot(t.x - p.x, (t.y - p.y) * 1.3) > 12) return;
      t.ok = true;
      const n = 3 + ((Math.random() * 5) | 0);
      st.coins += n; (st.flags.tesoro_galerias = st.flags.tesoro_galerias || []).push(t.i);
      S.createFloatingText(t.x, t.y - 20, `+${n} monedas`, 0xfcd34d); son('coin', 0.5);
      S.tweens.add({ targets: t.sp, y: t.sp.y - 14, alpha: 0, duration: 300, onComplete: () => t.sp.destroy() });
      S.updateObjective && S.updateObjective(); S.saveStory && S.saveStory();
    });
    S._ckNJtesoro = L.filter(t => !t.ok);
  };

  // ================================================================== 8. el derrumbe de la Fosa (83)
  const vigilarDerrumbe = S => {
    const L = S._ckTSu; if (!L) return;
    L.forEach(t => {
      if (t.tipo !== 'barricada' || t.id !== 'derrumbe_cazadores') return;
      if (!t.rota && t.sp && t.sp.active && !t._ckNJfoto) t._ckNJfoto = { key: t.sp.texture.key, x: t.sp.x, y: t.sp.y, ox: t.sp.originX, oy: t.sp.originY, sx: t.sp.scaleX, sy: t.sp.scaleY, fl: t.sp.flipX };
      if (t.rota && t._ckNJfoto && !t._ckNJhecho) {
        t._ckNJhecho = true;
        const f = t._ckNJfoto;
        // piedras del mismo dibujo que quedan un rato y se van
        try {
          const fr = S.textures.getFrame(f.key), w = fr.cutWidth, h = fr.cutHeight, cols = 4, filas = 3;
          for (let fy = 0; fy < filas; fy++) for (let fx = 0; fx < cols; fx++) {
            const k = 'ckna_derr_' + fx + '_' + fy;
            if (!S.textures.exists(k)) { const c = S.textures.createCanvas(k, Math.ceil(w / cols), Math.ceil(h / filas)); c.getContext().drawImage(fr.source.image || fr.source.canvas, fr.cutX + fx * w / cols, fr.cutY + fy * h / filas, w / cols, h / filas, 0, 0, w / cols, h / filas); c.refresh(); }
            const x0 = f.x - w * f.sx * f.ox + (fx + 0.5) * w / cols * f.sx, y0 = f.y - h * f.sy * f.oy + (fy + 0.5) * h / filas * f.sy;
            const suelo = f.y - azar(0, 18);
            const q = S.add.image(x0, y0, k).setScale(f.sx * 0.9).setDepth(suelo);
            S.tweens.add({ targets: q, x: x0 + azar(-20, 20), y: suelo, angle: azar(-60, 60), scale: f.sx * 0.6, duration: azar(350, 600), ease: 'Bounce.easeOut' });
            S.tweens.add({ targets: q, alpha: 0, delay: 6000 + Math.random() * 3000, duration: 1500, onComplete: () => q.destroy() });
          }
        } catch (e) {}
        son('ck_derrumbe_pesado', 0.7);
        // el dibujo de las piedras en el suelo se borra
        try {
          const T = window.CK_TERRENO_ROMPIBLE;
          if (T && T.borrarDelSuelo) {
            const sp = S.add.image(f.x, f.y, f.key).setOrigin(f.ox, f.oy).setScale(f.sx, f.sy).setFlipX(f.fl).setVisible(false);
            T.borrarDelSuelo(S, { sp }); sp.destroy();
          }
        } catch (e) {}
      }
    });
  };

  // ================================================================== 9. Mazmorra: veneno de los pinchos (135) y las coronas (139)
  const VENENO = { golpes: 3, cada: 1400 };
  const envenenar = S => {
    const now = S.time.now;
    S._ckNJveneno = { hasta: now + VENENO.golpes * VENENO.cada + 100, prox: now + VENENO.cada };
    son('ck_veneno', 0.6);
    if (S.player && S.player.setTint) S.player.setTint(0x9cff7a);
    try { S.createFloatingText(S.player.x, S.player.y - 64, '¡VENENO!', 0x86efac); } catch (e) {}
  };
  const cft0 = P.createFloatingText;
  if (cft0) P.createFloatingText = function (x, y, msg) {
    const r = cft0.apply(this, arguments);
    try { if (msg === '¡PINCHOS!' && zonaDe(this) === Z.mazmorra) envenenar(this); } catch (e) {}
    return r;
  };
  const vivirVeneno = S => {
    const V = S._ckNJveneno; if (!V) return;
    const now = S.time.now;
    if (now > V.hasta || S.isDead) { S._ckNJveneno = null; if (S.player && S.player.clearTint) S.player.clearTint(); return; }
    if (S.player && S.player.setTint) S.player.setTint((Math.floor(now / 160) % 2) ? 0x9cff7a : 0xd8ffcc);
    if (now >= V.prox) {
      V.prox = now + VENENO.cada;
      try { if (S.health > 1) { S.damagePlayer(1); S.createFloatingText(S.player.x, S.player.y - 50, '-1 veneno', 0x86efac); } } catch (e) {}
      // burbujitas verdes
      for (let i = 0; i < 4; i++) { const b = S.add.circle(S.player.x + azar(-8, 8), S.player.y - azar(0, 20), 2, 0x86efac, 0.8).setDepth(S.player.depth + 1); S.tweens.add({ targets: b, y: b.y - 16, alpha: 0, duration: 600, onComplete: () => b.destroy() }); }
    }
  };
  // coronas: un cartel la primera vez que se entra al santuario y, mientras no se resuelve, cuántas van
  const SANTUARIO = [72, 150, 420, 373];
  const cartel = () => {                              // un cartelito arriba al centro (dentro del contenedor del juego: se ve en pantalla completa)
    let d = document.getElementById('ck-nj-coronas');
    if (!d) {
      d = document.createElement('div'); d.id = 'ck-nj-coronas';
      d.style.cssText = 'position:absolute;left:calc(50% - 90px);top:10px;transform:translateX(-50%);z-index:60;pointer-events:none;font:12px Georgia,serif;color:#fde68a;background:rgba(20,12,10,.85);border:1px solid #8a6a3a;border-radius:6px;padding:6px 12px;text-align:center;line-height:1.45;display:none;width:max-content;max-width:min(420px,calc(100% - 360px))';   // entre el minimapa y el objetivo
      (document.getElementById('game-wrapper') || document.body).appendChild(d);
    }
    return d;
  };
  const ayudaCoronas = S => {
    const a = S.currentInterior.area, p = pies(S), x = p.x - a.x, y = p.y - a.y;
    const st = S.story, mz = st && st.flags && st.flags.mz;
    const dentro = x > SANTUARIO[0] && x < SANTUARIO[2] && y > SANTUARIO[1] && y < SANTUARIO[3];
    const d = cartel();
    if (!dentro || !mz || mz.coronasOk) { d.style.display = 'none'; return; }
    const co = mz.coronas || [0, 0, 0, 0], n = co.filter(v => v).length;
    const html = `<b>LAS CORONAS DE LOS REYES</b> &nbsp; ${co.map(v => `<span style="color:${v ? '#ffd27a' : '#6b5a4a'}">♛</span>`).join(' ')} &nbsp; (${n}/4)<br>` +
      'Golpeá a un rey: cambia su corona <b>y la de sus dos vecinos</b>. Hay que dejar las cuatro encendidas.';
    if (d._h !== html) { d.innerHTML = html; d._h = html; }
    d.style.display = 'block';
    if (!mz.coronasAyuda) {
      mz.coronasAyuda = 1; try { S.saveStory && S.saveStory(); } catch (e) {}
      try { S.createFloatingText(S.player.x, S.player.y - 70, 'Pista: probá golpear a cada rey una sola vez', 0xfde68a); } catch (e) {}
    }
  };
  const ocultarCartel = () => { const d = document.getElementById('ck-nj-coronas'); if (d) d.style.display = 'none'; };

  // ================================================================== 10. enganches
  const ms0 = P.onAreaShown;
  P.onAreaShown = function () {
    try { moverCofre(this); } catch (e) {}                     // antes de que ck_rompibles ponga los cofres
    const r = ms0 ? ms0.apply(this, arguments) : undefined;
    const S = this;
    // partida nueva: los lugares se eligen al entrar; si eligió el de la nota, se corre y se vuelven a poner
    if (COFRE_FUERA[zonaDe(S)]) S.time.delayedCall(800, () => { try { if (S.currentInterior && moverCofre(S) && window.CK_ROMPIBLES) { CK_ROMPIBLES.limpiar(S); CK_ROMPIBLES.poblar(S); } } catch (e) {} });
    try {
      if (S._ckNJtesoro) { S._ckNJtesoro.forEach(t => { try { t.sp.destroy(); } catch (e) {} }); S._ckNJtesoro = null; }
      ocultarCartel();
      if (zonaDe(S) === Z.galerias) S.time.delayedCall(300, () => { if (zonaDe(S) === Z.galerias && S.currentInterior) ponerTesoro(S); });
    } catch (e) { console.warn('[notas juego]', e); }
    return r;
  };
  const u0 = P.update;
  P.update = function (time, delta) {
    const r = u0 ? u0.apply(this, arguments) : undefined;
    try {
      const S = this, z = zonaDe(S);
      if (!S.player || !S.currentInterior) { ocultarCartel(); return r; }
      vivirVeneno(S);
      if ((S._ckNJc = (S._ckNJc || 0) + 1) % 6) return r;      // lo demás, cada 6 cuadros
      if (/^ed_cueva_/.test(z)) vigilarPiedras(S);
      if (z === Z.galerias) juntarTesoro(S);
      if (z === Z.fosa) vigilarDerrumbe(S);
      if (z === Z.sanRoque) voces(S);
      if (z === Z.mazmorra) ayudaCoronas(S); else ocultarCartel();
    } catch (e) {}
    return r;
  };
  window.CK_NOTAS_JUEGO = { Z, GUARIDA, TESORO, COFRE_FUERA, VENENO, envenenar };
})();
