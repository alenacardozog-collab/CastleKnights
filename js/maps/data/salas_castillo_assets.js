/* Arte integrado de las salas del castillo (antes traía el piso y los muebles de los Aposentos del Rey desde su imagen
   original y los ponía encima del mapa del Taller al cargar). Desde el 27/10 ese arte ya está DENTRO del proyecto del
   Taller (piso ap_escena y cada mueble ap_*), así lo que se ve en el editor es lo mismo que en el juego y los choques
   se calculan sobre el dibujo real. Queda vacío a propósito: js/core/ck_salas_castillo.js lo sigue leyendo sin problema. */
window.CK_SALAS_ARTE = {};
