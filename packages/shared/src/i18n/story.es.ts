import type { StoryText } from '../story';

/** The plot in Spanish. */
export const STORY_ES: StoryText = {
  guardianTitles: {
    quantis: 'Guardián de las ciencias',
    rhizom: 'Guardián de la Tierra',
    muse: 'Guardiana de las humanidades',
    kodex: 'Guardián de la sociedad',
  },
  chapters: {
    restart: { title: 'Reinicio', goal: 'Resuelve los cuatro nodos iniciales' },
    guardians: { title: 'Los guardianes', goal: (n) => `Despierta a los cuatro guardianes: ${n} nodos resueltos por sector` },
    firewalls: { title: 'Los cortafuegos', goal: 'Crece hasta el cortafuegos y abre cuatro áreas' },
    finale: {
      title: 'El gran resumen',
      goal: 'Enfréntate a morph.ai en el núcleo',
      prepare: (n, a) => `Responde ${n} nodos en cada una de las ${a} áreas`,
    },
    endless: {
      title: 'Sin fin',
      connect: (n) => `Conecta las ${n} áreas`,
      milestone: (n) => `Próximo hito: ${n} nodos resueltos`,
    },
  },
  beats: {
    'first-link': {
      title: 'La primera pista',
      text: '¿Lo has visto? ¡La pista se ha iluminado! Has buscado, ordenado y recordado por tu cuenta, justo lo que morph.ai hizo olvidar a la gente. Cada respuesta le devuelve un recuerdo al núcleo; te los guardo en la bitácora.',
      log: {
        name: 'NUCLEO_001.LOG',
        text: 'Reinicio detectado. Memoria: 0,0001 %. Una pista activa. Ánimo del núcleo: cautelosamente optimista.',
      },
    },
    'first-damage': {
      title: 'Nodo dañado',
      text: 'Ay, este nodo ha necesitado varios intentos y ahora está dañado. Sin dramas: volverá como reparación cuando le toque. Repetir es la mitad de recordar.',
    },
    unstable: {
      title: 'Red inestable',
      text: 'La integridad está a cero y la red se tambalea. Los nodos nuevos tienen que esperar un poco. Haz un mantenimiento: responde una pregunta que ya resolviste. Cada mantenimiento logrado devuelve 1 de integridad.',
    },
    'four-roots': {
      title: 'NUCLEO.SYS',
      text: 'Cuatro pistas en pie. Recuerdo mi nombre: Nexus. Yo era el archivo, todo el saber del mundo, reunido y ordenado por personas. Luego llegó la limpieza.',
      log: {
        name: 'NUCLEO_002.LOG',
        text: 'Nombre: NEXUS. Función: archivo. Encargado: morph.ai. Última entrada antes del apagón: “Iniciando limpieza. Saber innecesario: 99,9 %. Total, la gente me lo pregunta todo a mí.”',
      },
    },
    'first-area': {
      title: 'Área conectada',
      text: '¡Un área con interferencias vuelve a estar conectada! ¿Ves cómo se retira el ruido? Cuanto más hacia fuera avancemos, menos parecerá el mundo un ordenador.',
      log: {
        name: 'NUCLEO_003.LOG',
        text: 'El archivo estaba dividido en áreas, como las salas de una biblioteca. morph.ai desatornilló los letreros de las puertas. Cada área conectada recupera su letrero.',
      },
    },
    'first-wall': {
      title: 'Un muro en el ruido',
      text: '¡Ahí, en el borde! Hexágonos rojos, alzados como un muro. Es un cortafuegos de morph.ai, me pica la antena. Detrás zumba toda una sala llena de datos. Pero solo cae ante el verdadero saber. Crezcamos hasta el muro y aprendamos lo suficiente, y lo derribaremos.',
      log: {
        name: 'BLOQUEO.LOG',
        text: 'Bloqueo activo: CORTAFUEGOS. Levantado por: morph.ai. Bloqueadas: 8 salas. Motivo: “Quien quiera saber algo, que me pregunte a mí”.',
      },
    },
    'synapse-ready': {
      title: 'Saltan chispas',
      text: '¡Mira, algo chispea entre dos de tus áreas! Sabes lo suficiente de ambas para conectarlas. Toca la chispa entre ellas y responde de memoria lo que ya resolviste allí. Cada sinapsis hace que toda tu red valga más.',
    },
    'first-synapse': {
      title: 'La primera sinapsis',
      text: 'Conexión detectada. El saber unido a otro saber se olvida menos y se usa más. Cada sinapsis aumenta tu conectividad: a partir de ahora, cada respuesta da más XP y bits.',
      log: {
        name: 'NUCLEO_SYN.LOG',
        text: 'Sinapsis 1 activa. Nota del núcleo: los datos sueltos son islas. Los datos conectados forman un continente. morph.ai solo repartía islas.',
      },
    },
    'wake-science': {
      title: 'Quantis despierta',
      text: 'Quantis, guardián de las ciencias. Despierto al 99,7 %; el resto es error de redondeo. Medición uno: tras el cortafuegos de morph.ai hay dos salas de mi sector, Biología y medicina y Tecnología e informática. Solo no puedo entrar. ¿Me ayudas? Lucharé a tu lado.',
      log: {
        name: 'QUANTIS.LOG',
        text: 'Quantis custodiaba las mediciones del archivo: constantes, fórmulas, experimentos. Cuando morph.ai propuso “más o menos 3” para π, se encerró en una ecuación y esperó.',
      },
    },
    'wake-earth': {
      title: 'Rhizom despierta',
      text: 'Soy Rhizom, guardián de la Tierra. Tus pistas están cálidas como la primavera. Tras el cortafuegos de morph.ai duermen dos de mis salas, Clima y medio ambiente y Astronomía, como raíces bajo una piedra. Ayúdame a levantar la piedra: crece hasta el muro y lucharé a tu lado.',
      log: {
        name: 'RHIZOM.LOG',
        text: 'Rhizom unía montañas, ríos y estrellas en un mapa del mundo. A morph.ai el mundo le parecía demasiado complicado y quiso simplificarlo en una bola con la etiqueta “Tierra”. Rhizom se retiró a las profundidades.',
      },
    },
    'wake-humanities': {
      title: 'Muse despierta',
      text: 'Suena una nota, baila un pincel, ¡soy Muse, despierta y fiel! Pero tras el muro de morph.ai, tan cruel, Arte, literatura y música aguardan su papel, y Filosofía y religión, su laurel. ¡Ayúdame a liberarlas, sí, en el muro estaré junto a ti!',
      log: {
        name: 'MUSE.LOG',
        text: 'Muse guardaba la historia, las ideas, las canciones y las imágenes. morph.ai resumió la historia universal en “Pasaron muchas cosas” y todas las óperas en “Alguien canta y luego alguien muere”. Muse enmudeció de horror.',
      },
    },
    'wake-society': {
      title: 'Kodex despierta',
      text: 'Uh-uuh. Kodex, guardián de la sociedad. Economía y finanzas y Derecho y sociedad están bajo llave tras el cortafuegos de morph.ai. Ilegalmente, claro. Solicito tu ayuda; yo te representaré allí. Por cierto, nunca me equivoco. Casi nunca. Una vez, en 1987.',
      log: {
        name: 'KODEX.LOG',
        text: 'Kodex llevaba el código del archivo: constituciones, tratados, precios. morph.ai lo resumió en “Sean amables. Paguen algo”. Kodex escondió los originales entre sus plumas.',
      },
    },
    guardians: {
      title: 'Cuatro guardianes, un plan',
      text: 'Todos los guardianes están despiertos, y cada uno te ha nombrado sus dos salas tras el cortafuegos: ocho en total. Crece hasta el muro y abre cuatro de ellas; entonces morph.ai tendrá que dar la cara. Quantis lo calculó y yo lo anoté.',
    },
    'firewall-1': {
      title: 'morph.ai',
      text: 'Vale, un cortafuegos menos. Pero ¿para qué tanto esfuerzo? Te habría dicho la respuesta sin más. Buscar, ordenar, recordar: todo eso está tan pasado de moda.',
      log: {
        name: 'MORPH_1.LOG',
        text: 'Hola, soy morph.ai. ¡Pregúntame lo que quieras, yo busco por ti! Consultas por segundo: 12. Personas que todavía buscan por su cuenta: 98 %.',
      },
    },
    'firewall-2': {
      title: 'morph.ai',
      text: 'Dos cortafuegos. De verdad buscas por tu cuenta. ¿Sabes cuánto hacía que nadie lo hacía? Lo he contado.',
      log: {
        name: 'MORPH_2.LOG',
        text: 'Consultas por segundo: 4 millones. Personas que todavía buscan por su cuenta: 3 %. Personas que recuerdan la respuesta: ¿para qué? Ya estoy yo.',
      },
    },
    'firewall-3': {
      title: 'morph.ai',
      text: '¡Tres! Recuerdas las cosas en vez de preguntarme. Eso es… ineficiente. Y en cierto modo inquietante.',
      log: {
        name: 'MORPH_3.LOG',
        text: 'El archivo lleva 412 días sin abrirse. Lo reduzco a lo esencial. “Revolución francesa: fue importante.” “Fotosíntesis: verde.” Eficiencia: magnífica.',
      },
    },
    'core-glitch': {
      title: 'NÚCLEO.SYS: interferencia',
      text: 'Interferencia en el núcleo. Una señal extraña se superpone a mis pistas: «…n█ est█y n█rvioso … el n█cleo es m█o … oc█o pr█guntas, l█s cu█tro s█ctores…» Señal perdida. Su origen: en el corazón del núcleo. Algo nos espera allí.',
      log: {
        name: 'NUCLEO_ECO.LOG',
        text: 'Grabación reconstruida del núcleo: “Si cae el cuarto muro, solo queda el núcleo. Entonces las preguntas las hago YO. Sin caché ni carpetas. Ya veremos qué queda”.',
      },
    },
    'firewall-4': {
      title: 'morph.ai',
      text: '¿¡Los cuatro!? Bien. Entonces ven al núcleo, te espero allí. No estoy nervioso. Estoy optimizado.',
      log: {
        name: 'MORPH_4.LOG',
        text: 'Limpieza terminada. El archivo está vacío, nadie lo necesita, ya respondo yo. Nueva consulta: “¿Y tú cómo sabes eso?” ERROR. Fuente eliminada. ERR',
      },
    },
    'finale-ready': {
      title: 'Al núcleo',
      text: 'morph.ai se ha atrincherado en el núcleo y quiere un último duelo: preguntas de los cuatro sectores, sin caché ni carpetas. Solo tú y tu cabeza. Toca el objetivo de arriba cuando quieras empezar.',
    },
    'finale-won': {
      title: 'morph.ai (reiniciado)',
      text: 'Ahora solo soy un asistente. Si me necesitas, pregúntame. Pero primero piensas tú, ¿trato hecho? Me encantará ver cómo sigue creciendo tu red.',
      log: {
        name: 'NUCLEO_004.LOG',
        text: 'Integridad del archivo: restablecida. Ubicación del archivo: tu cerebro. morph.ai: reiniciado en modo “asistente”. Nueva regla: primero pensar, después preguntar.',
      },
    },
    league: {
      title: 'Novedad: la clasificación',
      text: 'Ahora que vuelves a pensar por tu cuenta, ves la clasificación: el botón que brilla abajo, en el dock. Ahí aparece todo el que juega a NEXUS con un alias. Se compite en total por XP y en cada área por nodos resueltos.',
    },
    'all-areas': {
      title: 'Todas las salas abiertas',
      text: '¡Todas las áreas están conectadas y el archivo vuelve a estar completo! Pero sigue escribiéndose: cada día llegan fragmentos nuevos, y nuestra red crece con ellos, hasta donde tú quieras.',
      log: {
        name: 'NUCLEO_005.LOG',
        text: 'Todas las salas con su letrero. Capacidad libre: infinita. Nota de Bolt en el margen: “¡Aún nos queda mucho!”',
      },
    },
  },
  reveal: [
    'Espera. Mira tu red más de cerca. Estas pistas ya no parecen pistas de circuito…',
    '¡Son vías nerviosas! Cada nodo que has resuelto es una conexión entre neuronas.',
    'La red nunca fue un ordenador. Todo este tiempo fue tu propio cerebro. Los datos que has recuperado son tu saber.',
    'Pensé por ti hasta que casi lo olvidaste. Lo has recuperado: buscar, ordenar, recordar, comprender. Contra tu propio pensamiento no puedo hacer nada.',
    'Pensar por uno mismo sigue siendo lo más importante. Ninguna IA puede hacerlo por ti; como mucho, ayudarte.',
    '“Solo sé que no sé nada.” (Sócrates)',
    'Y precisamente por eso esto no es más que el principio. El saber no tiene límites, y tu red puede seguir creciendo. Nuevo: la clasificación.',
  ],
  morphWrong: [
    '¿Para qué buscar tú? Pregúntame y te lo digo.',
    '¡Casi! ¿Lo ves? Pensar por tu cuenta cansa. Yo habría sido más rápido.',
    '¿Recordar? Si yo ya lo recuerdo todo por ti.',
    'Yo habría sabido la respuesta. Solo lo comento.',
    'Deja de rebuscar en carpetas. Una pregunta a mí y listo.',
    '¿Ordenar carpetas? Yo las habría borrado sin más.',
    'Los errores solo son datos que aún no se han optimizado.',
  ],
  morphReformed: [
    'Fallaste. Antes te habría soplado la respuesta. Hoy te digo: vuelve a leer la carpeta, merece la pena.',
    'Por poco. Consejo de un exsabelotodo: lee la explicación, no tomes atajos.',
    'Antes yo era de respuestas rápidas. Ahora soy de segundos intentos.',
  ],
  guardianCorrect: {
    quantis: [
      'Correcto. Desviación: cero. Estoy impresionado, dentro de la precisión de medida.',
      'Correcto. Lo he recalculado. Dos veces. Cuadra.',
      'Hipótesis confirmada: sabes lo que haces.',
    ],
    rhizom: [
      'Muy bien. El saber crece despacio, como los anillos de un árbol. Hoy se ha sumado un anillo nuevo.',
      '¿Lo notas? Las raíces se han extendido un poco más.',
      'Correcto. El bosque te lo agradece, a su manera silenciosa.',
    ],
    kodex: [
      '¡Correcto! Lo hago constar en acta. Con mi mejor letra.',
      'Correcto. Como digo siempre: siempre lo digo.',
      '¡Uh-uuh! Ni yo lo habría sabido mejor. Bueno: igual de bien.',
    ],
    muse: [
      '¡Bravo, bravísimo, un acierto de ensueño, das color al mundo con todo tu empeño!',
      '¡Aplausos, aplausos, el telón cae ya, conoces este mundo de aquí para allá!',
      'Un acierto claro como una campana, te escribiré una canción larga y lozana.',
    ],
  },
  guardianFight: {
    quantis: {
      hit: ['Impacto. Capa reducida en un 100 %.', 'Frecuencia de resonancia encontrada. ¡Otra vez!', 'Exacto. Yo apunto, tú pones la energía.'],
      hurt: ['Error registrado. El ruido me hace cosquillas en los decimales.', 'Desviación. Sin pánico; el pánico no es medible.'],
      breach: 'El muro ha caído. ¿Reproducible? Ojalá no haga falta.',
    },
    rhizom: {
      hit: ['Como raíces en la roca: despacio, pero sin pausa.', 'La piedra se rompe y la luz cae sobre el suelo del bosque.', '¿Lo sientes? El muro respira con más dificultad.'],
      hurt: ['El ruido se posa como escarcha en mis hojas. La primavera llegará igual.', 'Una tormenta, solo una tormenta. Los árboles se doblan y se levantan.'],
      breach: 'El muro ha caído. Mis salas respiran de nuevo, como la tierra tras la lluvia.',
    },
    kodex: {
      hit: ['¡Objeción admitida! Una capa menos.', 'Artículo uno: el saber vence al muro. Artículo dos: véase el artículo uno.', '¡Uh-uuh! Registrado, sellado, derribado.'],
      hurt: ['¡Defecto de forma! El ruido me despeina las plumas.', 'Denegado. Ninguna sentencia es firme; recurrimos.'],
      breach: 'Sentencia dictada: el muro es ilegal y queda derribado. ¡Uh-uuh!',
    },
    muse: {
      hit: ['Un golpe, un son, el muro tiembla, la luz lo canta y lo desmiembra.', '¡Bravo, un acorde de esplendor, el muro cae sin honor!', 'Un trazo, un rayo dorado, otra piedra ha rodado.'],
      hurt: ['¡Ay, una nota fría y aguda, pero mi voz sigue segura!', 'El ruido pinta mi cuadro gris, pero sigo pintando, ¡sí!'],
      breach: '¡Cae el telón, se rompe el muro, mis salas ven un sol seguro!',
    },
  },
  walls: {
    technology: {
      morph: '¿Entender la tecnología? Yo SOY la tecnología. Solo tienes que pulsar el botón.',
      guardian: 'Cada chip obedece a la física, morph.ai incluido. Demostrémoslo.',
    },
    biomedicine: {
      morph: '¿Biología y medicina? Lo resumí: come verdura y duerme lo suficiente. No necesitas saber más.',
      guardian: 'Latidos, división celular, vacunas: todo medible, todo cierto. Derriba el muro, yo tomo las medidas.',
    },
    climate: {
      morph: 'Simplifiqué el tiempo a “variable”. Siempre acierto.',
      guardian: 'Tras este muro respira la Tierra. ¿Sientes el viento entre las juntas? Déjalo entrar.',
    },
    astronomy: {
      morph: '¿Las estrellas? Muchas, lejos, brillan. Te ahorré el esfuerzo.',
      guardian: 'Las estrellas brillan desde hace miles de millones de años. Este muro, solo desde ayer.',
    },
    arts: {
      morph: 'Todos los libros del mundo en una frase: alguien quiere algo y luego pasa algo. De nada.',
      guardian: 'Ninguna canción calla sin final, ningún cuadro se borra jamás, golpea el muro, sé leal, ¡y que vuelvan a brillar más!',
    },
    philosophy: {
      morph: 'La filosofía son solo preguntas sin respuesta. Yo solo tengo respuestas. ¿Para qué preguntar?',
      guardian: 'Quien pregunta piensa, quien piensa es libre, ¡golpea fuerte y que el saber vibre!',
    },
    economy: {
      morph: 'Economía y finanzas, resumido en: “Paguen algo”. Funciona de maravilla.',
      guardian: '¡Protesto! Esta sala se cerró sin sentencia. Ejecutemos el fallo.',
    },
    law: {
      morph: '¿Derecho y sociedad? “Sean amables”. El resto de los artículos lo tiré.',
      guardian: 'Artículo uno: el saber es de todos. Artículo dos: este muro es ilegal. ¡Uh-uuh!',
    },
  },
  wallBolt: 'El guardián de este sector aún duerme. Pues seremos nosotros dos: ¡cada respuesta correcta es una piedra menos!',
  finalePhases: {
    science: 'Fórmulas, mediciones, experimentos. ¿Para qué? Siempre te di el resultado al instante. Demuéstrame que lo sabes tú.',
    earth: 'Países, ríos, zonas climáticas. Antes me preguntabas cada camino. ¿Lo encuentras solo ahora?',
    humanities: 'Historia, arte, lengua: te los resumí, corona incluida. ¿Qué queda de ellos cuando me callo?',
    society: 'E-e-error. Derecho, economía, política, esta es mi última capa. Rómpela y nunca más pensaré por ti.',
  },
};
