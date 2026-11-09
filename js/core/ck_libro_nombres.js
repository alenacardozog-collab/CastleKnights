'use strict';
/* Nombres de Aby y de Urso en el Libro de Héroes con su propio diseño (03/11, pedido del dueño: "modificá la tipografía
   acorde para su portada, como la de Lancent y Horos que son distintivas al personaje").
   - ABY: letras finas como hojas de espada, inclinadas, del rosa al carmesí, con el filo brillando.
   - URSO: runas talladas en hielo (S de rayo, O en rombo), con escarcha y zarpazos.
   Dibujadas a píxel (15_arreglos/hud_heroe/nombres.py); el texto sigue ahí (para lectores de pantalla), sólo no se ve.
   Borrar la línea de index.html vuelve a la letra de antes. */
(function () {
  if (typeof document === 'undefined') return;
  const N = {"aby": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAAVCAYAAADb2McgAAACGElEQVR4nO1WsWobQRB9F4zSXlClgAqlCdzhNBFKEVDjImXAhQs3Kgwp9AEGd0pl8AeoSKfGGP1AukDUJJgERECCqJCEBbIawRW2OdysCzHn2bnZPbsIgZBX3c2+mfdmbvfugH8FxhjzN/WDIoIxxsRPn1mx8W2S5UWlsLAB4ksur+Nb3yoSCIIgiEqhGS1mwOUacaOe49CahrhRR1QKDQnyOjxOBjWdJ0UmtUn5phc36kClfN/A+Q+VR/GoFBppUMJrkienn78hHU7w89OpajYdTpAOJxuj1RpQKVuxrAm2xmtxDfm0nCalQcLrD/sWj6/TmhZ7LJ/vV++eHC1mWB/3rNig3UGz27Fi12xaWg4XjKu1jDNob+oQn+rKA6VO8iEnVuMM2h3LoGxGimvQOGoSnebfrSMAwO6XMwCbKfliGoinnWKeJ3kc1uOW01mtljlRX6w9HmTGv75rAQC6UTOLkwnSkbVck87tSRIgERICYMWkGW6Eg+KuLcTziCPNqgdnniQAgJPlr5yp3pv3KpeKkxCPa7l0ffj8lcWTmk6THK5PmgbvS75acxrWjKkmucD85sopLtfk/Wgxw8ftHSumNSrzfCffmiQX6CdTp3g/mebM7IUvAMCZ72rCxXOaBICL2zS7lt3xNe2e8P1mqea78oren+qeJBEO+lIcvHxbyPUJ8zquXAnnf2HRv95DDGko0vmPP4k7qPuV3gKsw2gAAAAASUVORK5CYII=", "urso": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAATCAYAAADf0S5lAAACXElEQVR4nO1Wv2vbQBR+Cpka7LnYg8FzGjDW4MlJp2bLmEKngOnYLMlUOuYPSAodiqFky5p4CJkKzdJBJqakkCnCiDNFHUwk2mAwXIfy5HdP7yS7zpDQfCA43o/vvk8n3R3A/4Ifv7W+TzzTYhEHhVLdmPjpE8ex5eJB1+ExjnjQdTiPBImb13z69ku/WW9m1ojECD6JlKMxjkKpnuJAYZw3a16pzsaNWMh1OgWKZReKZTcZR8pLhNC6rZUlB01hDmuxn4PX2bgRhqHh6O8jQcrxGIoajiYTc2ytLDlU5HA06YsHXYeuolRHuSVThqH+zRj6N2NRiJSrVF0jFikPvlx8hUrVneqN98IxVKqukcN/xVZXqbrQC8eGKbrx3Mknh+iFpmH+83KROKYPBdY1aw2Dr1lrGKboxrNICa7CW6tYKffx7DM0aw2IlAdHl3EysWSGijy6jAnvJPf6xXOjltYhH+6wV+Gt0Ssa+h5EVkNSDmPvTpURz9pWpU9xu30s9s6qB+AOPrnt9jHstzYAIH8HigddBx+MYQ9yzAtjha79n8m4UKpreoDSnFS/39qA67dtiJQHxbKb9EuT0n/p1YcedPZaAJBe2Vn1ALAV6uy1QPlB6k1HygPlB8nECOUHoPzA6F/b7aSE28ys7XasZv5FTwp4Cq/unCSnstZar+6cpE5orMMc78cx78ninEdPrqnlzQOttdbLmwdiM9ZgnvfTqwo3Y+OcRw8itSng0vfPD+HZy/fQPz804nmgdXxHi5Q3M+eseqyE9A1IzXm3ZN4/za06C3l6HvFQ8AcC71e1oJJNLgAAAABJRU5ErkJggg=="};
  const css = `
#hero-card-swordsman .hero-card-name { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important;
  background: url("${N.aby}") center 0 / 123px 63px no-repeat !important; image-rendering: pixelated; min-height: 66px; }
#hero-card-bear:not(.oso-bloq) .hero-card-name { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important;
  background: url("${N.urso}") center 4px / 156px 57px no-repeat !important; image-rendering: pixelated; min-height: 66px;
  filter: drop-shadow(0 0 10px rgba(140, 210, 255, 0.55)); }`;
  const st = document.createElement('style'); st.id = 'ck-libro-nombres-css'; st.textContent = css;
  (document.head || document.documentElement).append(st);
  window.CK_LIBRO_NOMBRES = N;
})();
