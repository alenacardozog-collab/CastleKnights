/* Generado por el Taller CastleKnight (D:\Editor). Se reescribe en cada exportación: no editar a mano. */
window.EDITOR_DATA = {
 "hecho": "Taller CastleKnight",
 "v": 2,
 "guardado": 1791583979215,
 "tile": 16,
 "assets": {
  "ed_t_log_d2": {
   "w": 34,
   "h": 34
  },
  "ed_t_log_v": {
   "w": 13,
   "h": 40
  },
  "ed_t_log_d1": {
   "w": 34,
   "h": 34
  }
 },
 "mapas": {
  "mapa_nuevo": {
   "nombre": "Mapa nuevo",
   "titulo": "Mapa nuevo",
   "w": 640,
   "h": 480,
   "suelo": "ed_suelo_mapa_nuevo",
   "superficie": "grass",
   "items": [
    [
     "cs_t_arrowpost",
     67,
     87,
     0,
     ""
    ],
    [
     "cs_t_barrel",
     124,
     83,
     0,
     ""
    ],
    [
     "cs_t_barrel",
     133,
     96,
     0,
     ""
    ],
    [
     "cs_t_log_h",
     232,
     234,
     0,
     ""
    ],
    [
     "ed_t_log_d2",
     271,
     259,
     0,
     ""
    ],
    [
     "ed_t_log_v",
     282,
     310,
     0,
     ""
    ],
    [
     "cs_t_log_h",
     268,
     335,
     0,
     ""
    ],
    [
     "cs_t_log_h",
     227,
     352,
     0,
     ""
    ],
    [
     "ed_t_log_d2",
     189,
     343,
     0,
     ""
    ],
    [
     "ed_t_log_v",
     178,
     300,
     0,
     ""
    ],
    [
     "cs_t_tent",
     254,
     145,
     0,
     "",
     {
      "escala": 1.25
     }
    ]
   ],
   "cols": [
    [
     376,
     104,
     32,
     8
    ],
    [
     296,
     120,
     8,
     16
    ],
    [
     208,
     128,
     24,
     8
    ],
    [
     288,
     128,
     8,
     16
    ],
    [
     216,
     136,
     72,
     8
    ],
    [
     288,
     216,
     80,
     8
    ],
    [
     296,
     224,
     32,
     8
    ],
    [
     320,
     232,
     16,
     8
    ],
    [
     328,
     240,
     8,
     16
    ],
    [
     336,
     248,
     8,
     16
    ],
    [
     344,
     256,
     32,
     8
    ],
    [
     368,
     264,
     32,
     8
    ]
   ],
   "luces": [
    {
     "x": 260,
     "y": 237,
     "radio": 116,
     "color": "#927f63",
     "fuerza": 0.55,
     "parpadeo": 0
    }
   ],
   "ambiente": null,
   "aparicion": null,
   "puntos": {},
   "puertas": [],
   "npcs": [
    {
     "x": 98,
     "y": 371,
     "npc": "",
     "aspecto": "npc1",
     "nombre": "",
     "escala": 0,
     "flip": false
    }
   ],
   "enemigos": [],
   "fx": [
    {
     "x": 691,
     "y": 132,
     "fx": "llama_suave"
    }
   ],
   "entrada": {
    "x": 1,
    "y": 0,
    "r": 14
   },
   "musica": "",
   "sonido": []
  },
  "training": {
   "nombre": "Patio de armas",
   "origen": {
    "tipo": "juego",
    "archivo": "js/maps/data/castle_maps.js",
    "ancla": "window.CASTLE_MAPS.maps.training",
    "clave": "training"
   }
  }
 },
 "npcs": {},
 "fx": {
  "tajo_de_espada": {
   "nombre": "Tajo de espada",
   "dur": 0.3,
   "bucle": false,
   "capas": [
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Filo",
     "forma": "anillo",
     "ancho": 44,
     "alto": 30,
     "rafaga": 34,
     "tasa": 0,
     "vida": [
      0.12,
      0.26
     ],
     "vel": [
      20,
      60
     ],
     "radial": true,
     "apertura": 20,
     "freno": 6,
     "tam": [
      3,
      1
     ],
     "colores": [
      "#ffffff",
      "#dfe9f2",
      "#8fb3c9"
     ],
     "colorSuave": true,
     "figura": "linea",
     "estirar": 1.5,
     "suavizado": true,
     "curvaAlfa": "entrada",
     "alfa": [
      1,
      0
     ],
     "mezcla": "luz",
     "angulo": -90,
     "gravX": 0,
     "gravY": 0,
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaTam": "lineal",
     "curvaColor": "lineal",
     "aparece": 0,
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "turbulencia": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0,
     "ritmo": "constante"
    },
    {
     "tipo": "destello",
     "nombre": "Destello",
     "inicio": 0,
     "fin": 0.06,
     "color": "#ffffff",
     "fuerza": 0.2
    }
   ],
   "id": "tajo_de_espada"
  },
  "subir_de_nivel": {
   "nombre": "Subir de nivel",
   "dur": 1.3,
   "bucle": false,
   "capas": [
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Columna",
     "forma": "circulo",
     "ancho": 22,
     "alto": 8,
     "tasa": 60,
     "fin": 0.8,
     "vida": [
      0.4,
      0.8
     ],
     "vel": [
      50,
      110
     ],
     "angulo": -90,
     "apertura": 6,
     "tam": [
      2,
      1
     ],
     "colores": [
      "#ffffff",
      "#f6d573",
      "#e8b83a"
     ],
     "colorSuave": true,
     "figura": "linea",
     "estirar": 1,
     "mezcla": "luz",
     "ritmo": "pico",
     "rafaga": 0,
     "gravX": 0,
     "gravY": 0,
     "freno": 0,
     "alfa": [
      1,
      1
     ],
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaTam": "lineal",
     "curvaAlfa": "lineal",
     "curvaColor": "lineal",
     "suavizado": false,
     "aparece": 0,
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "turbulencia": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0,
     "radial": false
    },
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Anillo",
     "rafaga": 1,
     "tasa": 0,
     "vida": [
      0.6,
      0.6
     ],
     "vel": [
      0,
      0
     ],
     "tam": [
      4,
      30
     ],
     "colores": [
      "#fff7d6",
      "#f6d573"
     ],
     "alfa": [
      1,
      0
     ],
     "curvaTam": "salida",
     "figura": "anillo",
     "suavizado": true,
     "mezcla": "luz",
     "forma": "punto",
     "ancho": 0,
     "alto": 0,
     "angulo": -90,
     "apertura": 30,
     "gravX": 0,
     "gravY": 0,
     "freno": 0,
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaAlfa": "lineal",
     "curvaColor": "lineal",
     "colorSuave": false,
     "aparece": 0,
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "turbulencia": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0,
     "radial": false,
     "ritmo": "constante",
     "estirar": 0,
     "oculta": true
    },
    {
     "tipo": "emisor",
     "inicio": 0.2,
     "nombre": "Estrellas",
     "rafaga": 12,
     "tasa": 0,
     "vida": [
      0.5,
      0.9
     ],
     "vel": [
      40,
      90
     ],
     "angulo": -90,
     "apertura": 120,
     "gravY": 90,
     "tam": [
      2,
      1
     ],
     "colores": [
      "#ffffff",
      "#f6d573"
     ],
     "figura": "estrella",
     "curvaTam": "pico",
     "forma": "punto",
     "ancho": 0,
     "alto": 0,
     "gravX": 0,
     "freno": 0,
     "alfa": [
      1,
      1
     ],
     "mezcla": "normal",
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaAlfa": "lineal",
     "curvaColor": "lineal",
     "colorSuave": false,
     "suavizado": false,
     "aparece": 0,
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "turbulencia": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0,
     "radial": false,
     "ritmo": "constante",
     "estirar": 0,
     "oculta": true
    },
    {
     "tipo": "luz",
     "nombre": "Luz",
     "inicio": 0,
     "color": "#ffe08a",
     "radio": [
      14,
      60
     ],
     "fuerza": 0.6,
     "apagar": true,
     "curva": "salida"
    }
   ],
   "id": "subir_de_nivel"
  },
  "llama_suave": {
   "nombre": "Llama suave",
   "dur": 1.4,
   "bucle": true,
   "capas": [
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Llama",
     "forma": "linea",
     "ancho": 6,
     "tasa": 30,
     "vida": [
      0.4,
      0.75
     ],
     "vel": [
      16,
      30
     ],
     "angulo": -90,
     "apertura": 18,
     "turbulencia": 12,
     "tam": [
      6,
      1
     ],
     "colores": [
      "#fff3c4",
      "#f2c14e",
      "#e0803c",
      "#b8483c"
     ],
     "colorSuave": true,
     "curvaTam": "entrada",
     "alfa": [
      0.9,
      0
     ],
     "curvaAlfa": "tardia",
     "figura": "circulo",
     "suavizado": true,
     "mezcla": "luz",
     "alto": 0,
     "rafaga": 0,
     "gravX": 0,
     "gravY": 0,
     "freno": 0,
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaColor": "lineal",
     "aparece": 0,
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0,
     "radial": false,
     "ritmo": "constante",
     "estirar": 0
    },
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Brasas",
     "tasa": 4,
     "vida": [
      0.6,
      1.2
     ],
     "vel": [
      26,
      50
     ],
     "angulo": -90,
     "apertura": 50,
     "onda": 14,
     "tam": [
      1,
      1
     ],
     "colores": [
      "#f6d573",
      "#e0803c"
     ],
     "curvaAlfa": "tardia",
     "alfa": [
      1,
      0
     ],
     "forma": "punto",
     "ancho": 0,
     "alto": 0,
     "rafaga": 0,
     "gravX": 0,
     "gravY": 0,
     "freno": 0,
     "figura": "pixel",
     "mezcla": "normal",
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaTam": "lineal",
     "curvaColor": "lineal",
     "colorSuave": false,
     "suavizado": false,
     "aparece": 0,
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "turbulencia": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0,
     "radial": false,
     "ritmo": "constante",
     "estirar": 0
    },
    {
     "tipo": "luz",
     "nombre": "Resplandor",
     "inicio": 0,
     "color": "#ffb04a",
     "radio": [
      46,
      46
     ],
     "fuerza": 0.55,
     "parpadeo": 2
    }
   ],
   "id": "llama_suave"
  },
  "tajo_de_espada_2": {
   "nombre": "Tajo de espada",
   "dur": 0.3,
   "bucle": false,
   "capas": [
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Filo",
     "forma": "anillo",
     "ancho": 44,
     "alto": 30,
     "rafaga": 34,
     "tasa": 0,
     "vida": [
      0.12,
      0.26
     ],
     "vel": [
      20,
      60
     ],
     "radial": true,
     "apertura": 20,
     "freno": 6,
     "tam": [
      3,
      1
     ],
     "colores": [
      "#ffffff",
      "#dfe9f2",
      "#8fb3c9"
     ],
     "colorSuave": true,
     "figura": "linea",
     "estirar": 1.5,
     "suavizado": true,
     "curvaAlfa": "entrada",
     "alfa": [
      1,
      0
     ],
     "mezcla": "luz",
     "angulo": -90,
     "gravX": 0,
     "gravY": 0,
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaTam": "lineal",
     "curvaColor": "lineal",
     "aparece": 0,
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "turbulencia": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0,
     "ritmo": "constante"
    },
    {
     "tipo": "destello",
     "nombre": "Destello",
     "inicio": 0,
     "fin": 0.06,
     "color": "#ffffff",
     "fuerza": 0.2
    }
   ],
   "id": "tajo_de_espada_2"
  },
  "nube_de_veneno": {
   "nombre": "Nube de veneno",
   "dur": 2,
   "bucle": true,
   "capas": [
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Nube",
     "forma": "circulo",
     "ancho": 26,
     "alto": 10,
     "tasa": 9,
     "vida": [
      1,
      1.8
     ],
     "vel": [
      6,
      14
     ],
     "angulo": -90,
     "apertura": 60,
     "turbulencia": 7,
     "tam": [
      6,
      13
     ],
     "colores": [
      "#a6cf5e",
      "#74a84a",
      "#2f4a2c"
     ],
     "colorSuave": true,
     "alfa": [
      0.5,
      0
     ],
     "aparece": 0.2,
     "figura": "humo",
     "suavizado": true,
     "rafaga": 0,
     "gravX": 0,
     "gravY": 0,
     "freno": 0,
     "mezcla": "normal",
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaTam": "lineal",
     "curvaAlfa": "lineal",
     "curvaColor": "lineal",
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0,
     "radial": false,
     "ritmo": "constante",
     "estirar": 0
    },
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Burbujas",
     "forma": "circulo",
     "ancho": 24,
     "alto": 8,
     "tasa": 6,
     "vida": [
      0.5,
      0.9
     ],
     "vel": [
      14,
      26
     ],
     "angulo": -90,
     "apertura": 10,
     "tam": [
      1,
      3
     ],
     "colores": [
      "#d6f29a"
     ],
     "figura": "anillo",
     "curvaTam": "salida",
     "rafaga": 0,
     "gravX": 0,
     "gravY": 0,
     "freno": 0,
     "alfa": [
      1,
      1
     ],
     "mezcla": "normal",
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaAlfa": "lineal",
     "curvaColor": "lineal",
     "colorSuave": false,
     "suavizado": false,
     "aparece": 0,
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "turbulencia": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0,
     "radial": false,
     "ritmo": "constante",
     "estirar": 0
    }
   ],
   "id": "nube_de_veneno"
  },
  "chispas_electricas": {
   "nombre": "Chispas eléctricas",
   "dur": 0.6,
   "bucle": true,
   "capas": [
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Arcos",
     "forma": "circulo",
     "ancho": 14,
     "tasa": 34,
     "vida": [
      0.06,
      0.16
     ],
     "vel": [
      70,
      190
     ],
     "apertura": 360,
     "radial": true,
     "turbulencia": 60,
     "tam": [
      2,
      1
     ],
     "colores": [
      "#ffffff",
      "#bfe9ff",
      "#58a6ff"
     ],
     "figura": "linea",
     "estirar": 1,
     "mezcla": "luz",
     "ritmo": "pulso",
     "alto": 0,
     "rafaga": 0,
     "angulo": -90,
     "gravX": 0,
     "gravY": 0,
     "freno": 0,
     "alfa": [
      1,
      1
     ],
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaTam": "lineal",
     "curvaAlfa": "lineal",
     "curvaColor": "lineal",
     "colorSuave": false,
     "suavizado": false,
     "aparece": 0,
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0
    },
    {
     "tipo": "luz",
     "nombre": "Chispazo",
     "inicio": 0,
     "color": "#8fd0ff",
     "radio": [
      26,
      34
     ],
     "fuerza": 0.5,
     "parpadeo": 4,
     "curva": "pulso"
    }
   ],
   "id": "chispas_electricas"
  },
  "hojas_que_caen": {
   "nombre": "Hojas que caen",
   "dur": 4,
   "bucle": true,
   "capas": [
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Hojas",
     "forma": "linea",
     "ancho": 200,
     "y": -70,
     "tasa": 5,
     "vida": [
      3,
      4.4
     ],
     "vel": [
      16,
      28
     ],
     "angulo": 80,
     "apertura": 30,
     "onda": 26,
     "turbulencia": 5,
     "gravY": 6,
     "tam": [
      3,
      3
     ],
     "tamAzar": 0.3,
     "colores": [
      "#a6cf5e",
      "#f2c14e",
      "#e0803c"
     ],
     "curvaColor": "escalones",
     "figura": "rombo",
     "aparece": 0.08,
     "alto": 0,
     "rafaga": 0,
     "gravX": 0,
     "freno": 0,
     "alfa": [
      1,
      1
     ],
     "mezcla": "normal",
     "x": 0,
     "giro": 0,
     "curvaTam": "lineal",
     "curvaAlfa": "lineal",
     "colorSuave": false,
     "suavizado": false,
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "rebote": 0,
     "suelo": 40,
     "radial": false,
     "ritmo": "constante",
     "estirar": 0
    }
   ],
   "id": "hojas_que_caen"
  },
  "humo_suave": {
   "nombre": "Humo suave",
   "dur": 2.4,
   "bucle": true,
   "capas": [
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Humo",
     "forma": "linea",
     "ancho": 8,
     "tasa": 11,
     "vida": [
      1.6,
      2.6
     ],
     "vel": [
      10,
      18
     ],
     "angulo": -90,
     "apertura": 22,
     "turbulencia": 9,
     "tam": [
      5,
      15
     ],
     "tamAzar": 0.3,
     "colores": [
      "#bdb4a3",
      "#93897a",
      "#6b6258"
     ],
     "colorSuave": true,
     "alfa": [
      0.55,
      0
     ],
     "aparece": 0.15,
     "curvaAlfa": "entrada",
     "curvaTam": "salida",
     "figura": "humo",
     "suavizado": true,
     "alto": 0,
     "rafaga": 0,
     "gravX": 0,
     "gravY": 0,
     "freno": 0,
     "mezcla": "normal",
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaColor": "lineal",
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "rebote": 0,
     "suelo": 40,
     "radial": false,
     "ritmo": "constante",
     "estirar": 0
    }
   ],
   "id": "humo_suave",
   "contorno": {
    "grosor": 1,
    "color": "#74a84a",
    "forma": "redondo",
    "alfa": 0.1
   },
   "vista": {
    "x": 134,
    "y": 116
   }
  },
  "portal": {
   "nombre": "Portal",
   "dur": 2,
   "bucle": true,
   "capas": [
    {
     "tipo": "emisor",
     "inicio": 0.1,
     "nombre": "Remolino",
     "forma": "anillo",
     "ancho": 84,
     "alto": 42,
     "tasa": 46,
     "vida": [
      0.05,
      1.2
     ],
     "vel": [
      0,
      4
     ],
     "apertura": 165,
     "orbita": 220,
     "atraccion": 26,
     "tam": [
      7,
      2
     ],
     "colores": [
      "#f5f1e6",
      "#c9b47a",
      "#a6cf5e",
      "#5d7a9a"
     ],
     "colorSuave": true,
     "curvaTam": "salida",
     "estela": 3,
     "mezcla": "luz",
     "rafaga": 0,
     "angulo": -30,
     "gravX": 230,
     "gravY": -90,
     "freno": 5.5,
     "alfa": [
      1,
      1
     ],
     "figura": "cruz",
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaAlfa": "lineal",
     "curvaColor": "lineal",
     "suavizado": false,
     "aparece": 0.45,
     "turbulencia": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0,
     "radial": false,
     "ritmo": "constante",
     "estirar": 0
    },
    {
     "tipo": "emisor",
     "inicio": 0,
     "nombre": "Centro",
     "tasa": 14,
     "vida": [
      0.5,
      0.9
     ],
     "vel": [
      0,
      3
     ],
     "apertura": 360,
     "tam": [
      9,
      15
     ],
     "colores": [
      "#b48cf2",
      "#5d4bd6"
     ],
     "alfa": [
      0.5,
      0
     ],
     "figura": "brillo",
     "mezcla": "luz",
     "curvaAlfa": "suave",
     "forma": "punto",
     "ancho": 0,
     "alto": 0,
     "rafaga": 0,
     "angulo": -90,
     "gravX": 0,
     "gravY": 0,
     "freno": 0,
     "x": 0,
     "y": 0,
     "giro": 0,
     "curvaTam": "lineal",
     "curvaColor": "lineal",
     "colorSuave": false,
     "suavizado": false,
     "aparece": 0,
     "estela": 0,
     "orbita": 0,
     "atraccion": 0,
     "turbulencia": 0,
     "rebote": 0,
     "suelo": 40,
     "tamAzar": 0,
     "radial": false,
     "ritmo": "constante",
     "estirar": 0
    },
    {
     "tipo": "luz",
     "nombre": "Resplandor",
     "inicio": 0,
     "color": "#8a6cf0",
     "radio": [
      44,
      44
     ],
     "fuerza": 0.5,
     "parpadeo": 2
    }
   ],
   "id": "portal",
   "vista": {
    "x": 112,
    "y": 86
   }
  }
 },
 "misiones": [
  {
   "id": "paralax",
   "nombre": "paralax",
   "descripcion": "",
   "requiere": "",
   "pasos": [
    {
     "tipo": "hablar",
     "texto": "Hablá con …"
    },
    {
     "tipo": "derrotar",
     "texto": "Vencé a un enemigo"
    }
   ],
   "recompensa": {
    "monedas": 0,
    "exp": 0,
    "bandera": ""
   }
  }
 ],
 "alias": []
};
