import type { QuestionText } from '../localize';

/** The built-in questions in Spanish (source: `content.ts`). */
const SRC = 'Archivo Nexus';

export const CONTENT_ES: Record<string, QuestionText> = {
  // ───────────── Ciencia y técnica ─────────────
  'sci-light': {
    topic: 'Velocidad de la luz',
    intro: 'Nada en el universo es más rápido que la luz, pero también ella necesita tiempo para recorrer una distancia.',
    stem: '¿Qué distancia recorre la luz en el vacío en un segundo, aproximadamente?',
    options: ['3000 km', '30 000 km', '300 000 km', '3 millones de km'],
    f: [
      ['Distancia', 'El Sol está a unos 150 millones de km de la Tierra.'],
      ['Duración', 'La luz del Sol tarda unos 8 minutos, es decir, unos 500 segundos, en llegar a la Tierra.'],
      ['Luna', 'La Luna está de media a unos 384 000 km; su luz tarda algo más de un segundo.'],
      ['Sonido', 'En el aire, el sonido recorre unos 343 metros por segundo.'],
      ['Año luz', 'Un año luz mide un periodo de exactamente 365 días.'],
    ],
    why: '150 millones de km en ~500 s dan unos 300 000 km/s. (Por cierto, un año luz es una distancia, no un tiempo.)',
    files: {
      1: [
        { name: 'Nota.txt', kind: 'note', text: 'El Sol está a unos 150 millones de km de la Tierra.' },
        {
          name: 'Planetas.png',
          kind: 'image',
          alt: 'Gráfico de barras: distancia de Mercurio, Venus, la Tierra y Marte al Sol, en millones de kilómetros.',
          chart: {
            chart: 'bars',
            title: 'Distancia al Sol',
            unit: 'millones de km',
            items: [
              { label: 'Mercurio', value: 58 },
              { label: 'Venus', value: 108 },
              { label: 'Tierra', value: 150 },
              { label: 'Marte', value: 228 },
            ],
          },
        },
        { name: 'Luz de luna.txt', kind: 'note', text: 'La Luna no brilla por sí misma. Refleja la luz del Sol.' },
      ],
      2: [
        {
          name: 'Luz solar.txt',
          kind: 'article',
          source: SRC,
          text:
            'Cuando miras el Sol, lo ves tal como era hace unos minutos.\n\nSu luz primero tiene que llegar hasta nosotros. Tarda unos 8 minutos, es decir, unos 500 segundos.\n\nLa velocidad de la luz se calcula a partir de la distancia y el tiempo: la distancia dividida entre el tiempo.\n\nLa luz de la Luna, en cambio, viaja solo algo más de un segundo.',
        },
      ],
      4: [
        { name: 'Nota.txt', kind: 'note', text: 'En el aire, el sonido recorre unos 343 metros por segundo.' },
        {
          name: 'Sonido.png',
          kind: 'image',
          alt: 'Tabla: velocidad del sonido en el aire, el agua y el acero.',
          chart: {
            chart: 'table',
            title: 'Velocidad del sonido',
            columns: ['Medio', 'm/s'],
            rows: [['Aire', '343'], ['Agua', '1480'], ['Acero', '5900']],
          },
        },
      ],
    },
  },
  'sci-relativity': {
    topic: 'Teoría de la relatividad',
    intro: 'A principios del siglo XX, Einstein puso patas arriba nuestra idea del espacio y el tiempo.',
    stem: 'Según la relatividad especial de Einstein, ¿qué es igual para todos los observadores?',
    options: [
      'El tiempo entre dos sucesos',
      'La longitud de una varilla',
      'La velocidad de la luz en el vacío',
      'La velocidad de un tren',
    ],
    f: [
      ['Relojes', 'Los relojes en movimiento van más lentos para un observador en reposo.'],
      ['Varillas', 'Las varillas en movimiento parecen acortadas en la dirección del movimiento.'],
      ['Año', 'Einstein publicó la relatividad especial en 1905.'],
      ['Fórmula', 'E = mc² describe cuánta energía hay en un gramo de agua cuando se calienta.'],
    ],
    why: 'El tiempo y la longitud son relativos; la velocidad de la luz en el vacío no: es la misma para cualquier observador.',
  },
  'sci-gravwaves': {
    topic: 'Ondas gravitacionales',
    intro: 'Sucesos violentos en el espacio hacen vibrar el propio espacio. Desde hace pocos años se puede medir.',
    stem: '¿En qué año llegó a LIGO la primera señal de ondas gravitacionales detectada directamente?',
    unit: '',
    f: [
      ['Señal', 'La señal de dos agujeros negros fusionándose llegó en septiembre de 2015.'],
      ['Anuncio', 'La detección no se anunció hasta febrero de 2016.'],
      ['Predicción', 'Einstein había predicho las ondas gravitacionales en 1916.'],
      ['Premio Nobel', 'El Premio Nobel de Física de 2017 fue para Weiss, Barish y Thorne por este hallazgo.'],
      ['Higgs', 'El bosón de Higgs se detectó en el CERN en 2012.'],
    ],
    why: 'La señal llegó el 14 de septiembre de 2015; el anuncio siguió en 2016.',
  },
  'sci-water': {
    topic: 'Agua y moléculas',
    intro: 'El agua está en todas partes y, aun así, su estructura es una pequeña lección de química.',
    stem: '¿De qué está formada una molécula de agua?',
    options: [
      '2 átomos de hidrógeno y 1 de oxígeno',
      '1 átomo de hidrógeno y 2 de oxígeno',
      '2 átomos de hidrógeno y 2 de oxígeno',
      '3 átomos de hidrógeno',
    ],
    f: [
      ['Fórmula', 'La fórmula es H₂O: el 2 en subíndice corresponde al hidrógeno.'],
      ['Ebullición', 'Al nivel del mar, el agua hierve a 100 °C.'],
      ['CO₂', 'El dióxido de carbono consta de un átomo de carbono y dos de oxígeno.'],
      ['H₂O₂', 'El agua oxigenada (H₂O₂) se usa para blanquear.'],
    ],
    why: 'H₂O: dos átomos de hidrógeno (H) y uno de oxígeno (O).',
  },
  'sci-ph': {
    topic: 'Ácidos y bases',
    intro: 'Zumo de limón, jabón, ácido gástrico: una escala mide lo ácido o básico que es algo.',
    stem: '¿Qué se puede decir de una disolución con un pH de 3?',
    options: ['Es ácida', 'Es neutra', 'Es básica', 'No se puede medir'],
    f: [
      ['Escala', 'Un pH de 7 es neutro; los valores menores son ácidos y los mayores, básicos.'],
      ['Limón', 'El zumo de limón tiene un pH de aproximadamente 2.'],
      ['Jabón', 'El agua jabonosa tiene un pH de aproximadamente 10.'],
      ['Medición', 'El pH se expresa en gramos por litro.'],
    ],
    why: 'Todo lo que está por debajo de pH 7 es ácido. La escala suele ir de 0 a 14.',
  },
  'sci-binary': {
    topic: 'Sistemas de numeración',
    intro: 'Los ordenadores calculan solo con dos cifras. Aun así, con ellas se puede formar cualquier número.',
    stem: '¿Qué número decimal corresponde al número binario 1011?',
    options: ['9', '11', '13', '15'],
    f: [
      ['Posiciones', 'En binario, los valores de posición desde la derecha son 1, 2, 4, 8, 16, …'],
      ['Byte', 'Un byte consta de 8 bits.'],
      ['Hex', 'El sistema hexadecimal usa 16 cifras: 0–9 y A–F.'],
    ],
    why: '1·8 + 0·4 + 1·2 + 1·1 = 11.',
    files: {
      1: [
        { name: 'Nota.txt', kind: 'note', text: 'En binario, los valores de posición desde la derecha son 1, 2, 4, 8, 16, …' },
        {
          name: 'Posiciones.png',
          kind: 'image',
          alt: 'Tabla: los cuatro valores de posición de un número binario, de izquierda a derecha: 8, 4, 2, 1.',
          chart: {
            chart: 'table',
            title: 'Valores de posición (4 bits)',
            columns: ['Posición', '4.ª', '3.ª', '2.ª', '1.ª'],
            rows: [['Valor', '8', '4', '2', '1']],
          },
        },
      ],
    },
  },
  'sci-algo': {
    topic: 'Algoritmos de búsqueda',
    intro: 'Quien busca con astucia no necesita revisarlo todo. Los buenos métodos ahorran muchísimo tiempo.',
    stem: '¿Cuántos pasos necesita como máximo una búsqueda binaria entre 1000 entradas ordenadas?',
    unit: 'pasos',
    f: [
      ['Mitad', 'La búsqueda binaria divide a la mitad la zona de búsqueda en cada paso.'],
      ['Potencia de 2', '2¹⁰ es 1024, es decir, más de 1000.'],
      ['Lineal', 'En el peor caso, una búsqueda lineal revisa todas las entradas.'],
      ['Quicksort', 'De media, quicksort ordena en n·log n pasos.'],
    ],
    why: 'Tras 10 divisiones a la mitad queda una sola entrada: 2¹⁰ = 1024 ≥ 1000.',
  },
  'sci-vaccine': {
    topic: 'Historia de la vacunación',
    intro: 'Mucho antes de que se conocieran los virus, un médico rural encontró una forma de prevenir enfermedades.',
    stem: '¿Quién desarrolló en 1796 la primera vacuna, contra la viruela?',
    options: ['Louis Pasteur', 'Edward Jenner', 'Robert Koch', 'Alexander Fleming'],
    f: [
      ['Observación', 'El médico rural inglés Edward Jenner notó que las ordeñadoras rara vez enfermaban de viruela.'],
      ['Viruela bovina', 'En 1796 inoculó a un niño material de viruela bovina; más tarde, eso lo protegió de la viruela humana.'],
      ['Palabra', 'La palabra “vacuna” viene del latín vacca, la vaca.'],
      ['Rabia', 'Louis Pasteur desarrolló una vacuna contra la rabia en 1885.'],
    ],
    why: 'Jenner fundó la vacunación. Pasteur la desarrolló más tarde para otras enfermedades.',
    files: {
      1: [
        {
          name: 'Jenner.txt',
          kind: 'article',
          source: SRC,
          text:
            'En el siglo XVIII, la viruela mataba a mucha gente. En Inglaterra, un médico rural se dio cuenta de algo: las ordeñadoras que se habían contagiado de la inofensiva viruela bovina rara vez enfermaban de la peligrosa viruela humana.\n\nEl médico se llamaba Edward Jenner. En 1796 introdujo material de una pústula de viruela bovina en pequeños cortes en el brazo de un niño de ocho años.\n\nMás tarde, el niño siguió sano frente a la viruela humana. La palabra vacuna viene del latín vacca, vaca.',
        },
      ],
    },
  },
  'sci-penicillin': {
    topic: 'Antibióticos',
    intro: 'A veces, las grandes cosas surgen por casualidad y gracias a una mesa de laboratorio desordenada.',
    stem: '¿Qué descubrió Alexander Fleming en su laboratorio en 1928?',
    options: ['La penicilina', 'La insulina', 'Los rayos X', 'Los grupos sanguíneos'],
    f: [
      ['Moho', 'En un cultivo de bacterias creció un moho, y a su alrededor las bacterias murieron.'],
      ['Hongo', 'El hongo pertenecía al género Penicillium.'],
      ['Premio Nobel', 'En 1945, Fleming recibió el Nobel de Medicina junto con Florey y Chain.'],
      ['Röntgen', 'Wilhelm Conrad Röntgen descubrió los rayos X en 1895.'],
    ],
    why: 'Fleming descubrió el primer antibiótico. Solo más tarde, gracias a Florey y Chain, se pudo utilizar.',
    files: {
      1: [
        {
          name: 'Descubrimiento.txt',
          kind: 'article',
          source: SRC,
          text:
            'En 1928, el médico Alexander Fleming estaba ordenando su laboratorio en Londres. Encontró una placa olvidada con bacterias sobre la que había crecido un moho.\n\nAlrededor del moho, las bacterias habían muerto. Fleming dedujo que el moho produce una sustancia que mata las bacterias.\n\nHasta la década de 1940, Howard Florey y Ernst Chain no lograron producir el medicamento en grandes cantidades.',
        },
      ],
    },
  },

  // ───────────── Naturaleza y mundo ─────────────
  'nat-photosynthesis': {
    topic: 'Fotosíntesis',
    intro: 'Las plantas son pequeñas fábricas: producen su propio alimento a partir de luz y aire.',
    stem: '¿Qué gas absorben las plantas durante la fotosíntesis?',
    options: ['Dióxido de carbono', 'Oxígeno', 'Nitrógeno', 'Hidrógeno'],
    f: [
      ['Azúcar', 'Las plantas forman azúcar a partir de dióxido de carbono y agua, y liberan oxígeno.'],
      ['Clorofila', 'La clorofila, el pigmento verde de las hojas, capta la luz.'],
      ['Respiración', 'Los animales y las personas inhalan oxígeno.'],
      ['Aire', 'Alrededor del 78 % del aire es nitrógeno.'],
    ],
    why: 'Fotosíntesis: dióxido de carbono + agua + luz → azúcar + oxígeno.',
    files: {
      1: [
        {
          name: 'Fotosíntesis.txt',
          kind: 'article',
          source: SRC,
          text:
            'Las plantas se alimentan solas.\n\nEn las hojas verdes está el pigmento clorofila. Capta la luz del sol y aporta la energía.\n\nLas plantas toman dióxido de carbono del aire y agua del suelo. Con ello fabrican azúcar, su material de construcción y su combustible.\n\nComo subproducto se forma oxígeno, que la planta libera al aire.',
        },
        { name: 'Respiración.txt', kind: 'note', text: 'Los animales y las personas inhalan oxígeno y exhalan dióxido de carbono.' },
      ],
    },
  },
  'nat-chloroplast': {
    topic: 'La célula vegetal',
    intro: 'Dentro de las células de las plantas hay una diminuta fábrica solar.',
    stem: '¿En qué orgánulos celulares tiene lugar la fotosíntesis?',
    options: ['Mitocondrias', 'Cloroplastos', 'Ribosomas', 'Núcleo celular'],
    f: [
      ['Clorofila', 'Los cloroplastos contienen la clorofila y se encuentran en las células vegetales.'],
      ['Central', 'Las mitocondrias son las “centrales eléctricas” de la célula y obtienen energía mediante la respiración celular.'],
      ['Ribosomas', 'Los ribosomas ensamblan proteínas.'],
      ['Núcleo', 'El núcleo celular contiene la información genética en forma de cromosomas.'],
    ],
    why: 'Los cloroplastos son el lugar de la fotosíntesis; las mitocondrias realizan la respiración celular.',
  },
  'nat-everest': {
    topic: 'Las montañas más altas',
    intro: 'La montaña más alta de la Tierra se vuelve a medir una y otra vez desde hace décadas.',
    stem: '¿Qué altura tiene aproximadamente el Everest (en metros)?',
    unit: 'm',
    f: [
      ['Medición', 'Una medición conjunta de Nepal y China dio en 2020 una altura de 8849 metros.'],
      ['Ubicación', 'El Everest está en el Himalaya, en la frontera entre Nepal y China.'],
      ['K2', 'Con 8611 m, el K2 es la segunda montaña más alta de la Tierra.'],
      ['Zugspitze', 'Con 2962 m, el Zugspitze es la montaña más alta de Alemania.'],
    ],
    why: 'Con 8849 m, el Everest es la montaña más alta sobre el nivel del mar.',
    files: {
      1: [
        { name: 'Nota.txt', kind: 'note', text: 'Una medición conjunta de Nepal y China dio en 2020 una altura de 8849 metros.' },
        {
          name: 'Cumbres.png',
          kind: 'image',
          alt: 'Gráfico de barras: altura de las cuatro montañas más altas de la Tierra en metros. Everest, K2, Kangchenjunga, Lhotse.',
          chart: {
            chart: 'bars',
            title: 'Las montañas más altas',
            unit: 'm',
            items: [
              { label: 'Everest', value: 8849 },
              { label: 'K2', value: 8611 },
              { label: 'Kangchenjunga', value: 8586 },
              { label: 'Lhotse', value: 8516 },
            ],
          },
        },
      ],
    },
  },
  'nat-tectonic': {
    topic: 'Formación de montañas',
    intro: 'Las montañas no surgen de la noche a la mañana, sino por fuerzas que mueven lentamente los continentes.',
    stem: '¿Cómo se formó el Himalaya?',
    options: [
      'Por volcanes del fondo marino',
      'Por el choque de la placa India con la Euroasiática',
      'Por una glaciación',
      'Por el impacto de un meteorito',
    ],
    f: [
      ['Deriva', 'La placa India se desplaza hacia el norte desde hace millones de años.'],
      ['Colisión', 'Choca con la placa Euroasiática y pliega la roca formando montañas.'],
      ['Crecimiento', 'El Himalaya todavía crece unos pocos milímetros al año.'],
      ['Alpes', 'Los Alpes se formaron por el choque de la placa Africana con la Euroasiática.'],
    ],
    why: 'Dos placas continentales chocan: ninguna se hunde bajo la otra, y la roca se apila.',
  },
  'nat-rainforest': {
    topic: 'Grandes ríos',
    intro: 'Algunos ríos son tan caudalosos que tiñen el mar hasta muy lejos de la costa.',
    stem: '¿Qué río lleva el mayor caudal de agua de la Tierra?',
    options: ['Nilo', 'Amazonas', 'Yangtsé', 'Misisipi'],
    f: [
      ['Caudal', 'El Amazonas lleva al mar aproximadamente una quinta parte de toda el agua de los ríos de la Tierra.'],
      ['Longitud', 'El Nilo y el Amazonas se disputan el título de “río más largo”.'],
      ['Yangtsé', 'El Yangtsé es el río más largo de Asia.'],
    ],
    why: 'Caudal no es lo mismo que longitud: el Amazonas es el que más agua lleva.',
    files: {
      1: [
        {
          name: 'Nota.txt',
          kind: 'note',
          text: 'El Amazonas lleva al mar aproximadamente una quinta parte de toda el agua de los ríos de la Tierra.',
        },
        {
          name: 'Caudal.png',
          kind: 'image',
          alt: 'Gráfico de barras: caudal del Amazonas, el Congo, el Ganges y el Orinoco en miles de metros cúbicos por segundo, redondeado.',
          chart: {
            chart: 'bars',
            title: 'Caudal (redondeado)',
            unit: '1000 m³/s',
            items: [
              { label: 'Amazonas', value: 209 },
              { label: 'Congo', value: 41 },
              { label: 'Ganges', value: 38 },
              { label: 'Orinoco', value: 37 },
            ],
          },
        },
      ],
    },
  },
  'nat-bee': {
    topic: 'Comunicación animal',
    intro: 'Las abejas se comunican sin palabras y así encuentran las flores más ricas.',
    stem: '¿Cómo se llama el “lenguaje” con el que las abejas melíferas indican fuentes de alimento?',
    options: ['Danza del meneo', 'Vals', 'Danza nupcial', 'Danza de la lluvia'],
    f: [
      ['Investigador', 'Karl von Frisch descifró la danza y recibió por ello el Premio Nobel en 1973.'],
      ['Señal', 'El ángulo respecto a la vertical indica la dirección respecto al sol; la duración del meneo, la distancia.'],
      ['Colmena', 'En verano, una colmena tiene hasta 50 000 abejas.'],
      ['Hormigas', 'Las hormigas se comunican sobre todo mediante olores.'],
    ],
    why: 'La danza del meneo codifica la dirección y la distancia de una fuente de alimento.',
  },
  'nat-octopus': {
    topic: 'Pulpos',
    intro: 'Los pulpos están entre los invertebrados más listos y tienen un cuerpo muy peculiar.',
    stem: '¿Cuántos corazones tiene un pulpo?',
    options: ['1', '2', '3', '8'],
    f: [
      ['Branquiales', 'Dos corazones branquiales bombean la sangre a través de las branquias.'],
      ['Sistémico', 'Otro corazón abastece al resto del cuerpo.'],
      ['Sangre', 'Su sangre es azul porque contiene hemocianina, rica en cobre.'],
      ['Brazos', 'Los pulpos tienen ocho brazos; los calamares, diez.'],
    ],
    why: 'Dos corazones branquiales más un corazón sistémico: tres corazones.',
  },
  'nat-climate': {
    topic: 'Gases de efecto invernadero',
    intro: 'El clima cambia porque ciertos gases retienen el calor en la atmósfera.',
    stem: '¿Qué gas de efecto invernadero se produce sobre todo al quemar combustibles fósiles?',
    options: ['Dióxido de carbono', 'Argón', 'Neón', 'Nitrógeno'],
    f: [
      ['Combustión', 'Al quemar carbón, petróleo y gas, el carbono se une al oxígeno.'],
      ['Efecto invernadero', 'Los gases de efecto invernadero retienen la radiación térmica en la atmósfera.'],
      ['Gas noble', 'El argón y el neón son gases nobles y apenas reaccionan.'],
    ],
    why: 'Carbono + oxígeno → dióxido de carbono (CO₂), el principal gas de efecto invernadero liberado por el ser humano.',
  },

  // ───────────── Cultura y arte ─────────────
  'cul-guitar': {
    topic: 'Instrumentos de cuerda',
    intro: 'Hay guitarras de muchas formas, pero la estructura del instrumento clásico está fijada.',
    stem: '¿Cuántas cuerdas tiene una guitarra estándar?',
    options: ['4', '5', '6', '12'],
    f: [
      ['Afinación', 'La afinación estándar es mi–la–re–sol–si–mi: seis cuerdas.'],
      ['Violín', 'Un violín tiene cuatro cuerdas.'],
      ['Bajo', 'Un bajo eléctrico clásico también tiene cuatro cuerdas.'],
    ],
    why: 'Una guitarra tiene seis cuerdas. Las guitarras de doce cuerdas las duplican por pares.',
  },
  'cul-bach': {
    topic: 'Música barroca',
    intro: 'El Barroco produjo una música de un orden asombroso que los pianistas siguen practicando hoy.',
    stem: '¿Quién escribió “El clave bien temperado”?',
    options: ['Johann Sebastian Bach', 'Wolfgang Amadeus Mozart', 'Ludwig van Beethoven', 'Georg Friedrich Händel'],
    f: [
      ['Obra', 'La obra contiene preludios y fugas en las 24 tonalidades mayores y menores.'],
      ['Compositor', 'El compositor fue cantor de Santo Tomás en Leipzig.'],
      ['Época', 'Se escribió en el Barroco; el primer libro es de 1722.'],
      ['Agua', 'Händel escribió la “Música acuática” para el rey Jorge I.'],
    ],
    why: 'Bach, cantor de Santo Tomás en Leipzig, escribió dos libros con 24 preludios y fugas cada uno.',
    files: {
      2: [
        { name: 'Nota.txt', kind: 'note', text: 'El compositor fue cantor de Santo Tomás en Leipzig.' },
        {
          name: 'Leipzig.txt',
          kind: 'article',
          source: SRC,
          text:
            'Nació en 1685 en Eisenach y procedía de una familia de músicos.\n\nEn Leipzig dirigió durante más de dos décadas el coro de la iglesia de Santo Tomás. Allí escribió gran parte de su música sacra.\n\nSus obras para instrumentos de teclado siguen siendo hoy una referencia para los pianistas.',
        },
      ],
    },
  },
  'cul-mona': {
    topic: 'Pintura renacentista',
    intro: 'El cuadro más famoso del mundo cuelga en un museo de París y sonríe de forma enigmática.',
    stem: '¿Quién pintó la Mona Lisa?',
    options: ['Miguel Ángel', 'Leonardo da Vinci', 'Rafael', 'Botticelli'],
    f: [
      ['Pintor', 'Leonardo da Vinci trabajó en el retrato desde aproximadamente 1503.'],
      ['Lugar', 'El cuadro cuelga en el Louvre, en París.'],
      ['Sixtina', 'Miguel Ángel pintó el techo de la Capilla Sixtina.'],
    ],
    why: 'La Mona Lisa (La Gioconda) es una obra de Leonardo da Vinci del Alto Renacimiento italiano.',
  },
  'cul-impression': {
    topic: 'Impresionismo',
    intro: 'Una impresión fugaz al amanecer dio nombre a todo un movimiento artístico.',
    stem: '¿Qué cuadro de Claude Monet dio nombre al impresionismo?',
    options: ['Impresión, sol naciente', 'Nenúfares', 'Almuerzo sobre la hierba', 'La catedral de Ruan'],
    f: [
      ['Burla', 'En 1874, un crítico se burló de una exposición llamando a sus autores simples “impresionistas”, por el título de un cuadro.'],
      ['Motivo', 'El cuadro muestra el puerto de Le Havre en la neblina de la mañana.'],
      ['Giverny', 'Monet pintó más tarde sus nenúfares en su jardín de Giverny.'],
      ['Manet', '“Almuerzo sobre la hierba” es de Édouard Manet.'],
    ],
    why: '“Impression, soleil levant” (1872) dio nombre al movimiento.',
  },
  'cul-faust': {
    topic: 'Clasicismo alemán',
    intro: 'Un erudito sella un pacto con el diablo: este drama está en el corazón de la literatura alemana.',
    stem: '¿Quién escribió el drama “Fausto”?',
    options: ['Friedrich Schiller', 'Johann Wolfgang von Goethe', 'Gotthold Ephraim Lessing', 'Bertolt Brecht'],
    f: [
      ['Obra de su vida', 'Goethe trabajó más de 60 años en su “Fausto”.'],
      ['Bandidos', 'Schiller escribió “Los bandidos” y “Guillermo Tell”.'],
      ['Natán', 'Lessing escribió “Natán el Sabio”.'],
    ],
    why: 'Goethe publicó la primera parte en 1808; la segunda no apareció hasta después de su muerte, en 1832.',
  },
  'cul-grimm': {
    topic: 'Cuentos y diccionarios',
    intro: 'Los hermanos no solo recopilaron cuentos: soñaban con una gran obra sobre su propia lengua.',
    stem: '¿Qué enorme obra de consulta comenzaron los hermanos Grimm además de sus cuentos?',
    options: ['El Diccionario alemán', 'La enciclopedia Brockhaus', 'El Duden', 'El léxico de Meyer'],
    f: [
      ['Diccionario', 'En 1838, los hermanos Grimm comenzaron el “Deutsches Wörterbuch”, un diccionario del alemán.'],
      ['Duración', 'No se terminó hasta 1961, más de cien años después.'],
      ['Duden', 'Konrad Duden publicó su diccionario ortográfico en 1880.'],
    ],
    why: 'El Diccionario alemán de los Grimm consta de 32 volúmenes.',
  },
  'cul-language': {
    topic: 'Lenguas del mundo',
    intro: 'Hay miles de lenguas, pero algunas tienen muchos más hablantes que otras.',
    stem: '¿Qué lengua tiene más hablantes nativos en el mundo?',
    options: ['Inglés', 'Español', 'Chino mandarín', 'Hindi'],
    f: [
      ['Mandarín', 'El mandarín tiene más de 900 millones de hablantes nativos.'],
      ['Inglés', 'El inglés tiene unos 380 millones de hablantes nativos, pero muchísimos hablantes como segunda lengua.'],
      ['Español', 'El español tiene unos 480 millones de hablantes nativos.'],
      ['Diversidad', 'En la Tierra se hablan unas 7000 lenguas distintas.'],
    ],
    why: 'El mandarín lidera en hablantes nativos; el inglés es la segunda lengua más aprendida.',
    files: {
      1: [
        { name: 'Nota.txt', kind: 'note', text: 'El mandarín tiene más de 900 millones de hablantes nativos.' },
        {
          name: 'Hablantes.png',
          kind: 'image',
          alt: 'Gráfico de barras: hablantes nativos de mandarín, español, inglés e hindi, en millones, redondeado.',
          chart: {
            chart: 'bars',
            title: 'Hablantes nativos (redondeado)',
            unit: 'millones',
            items: [
              { label: 'Mandarín', value: 940 },
              { label: 'Español', value: 485 },
              { label: 'Inglés', value: 380 },
              { label: 'Hindi', value: 345 },
            ],
          },
        },
      ],
      2: [
        {
          name: 'Inglés.txt',
          kind: 'article',
          source: SRC,
          text:
            'El inglés se oye en todos los continentes, en el tráfico aéreo, en la ciencia y en internet.\n\nQuien lo aprende desde la primera infancia lo tiene como lengua materna: unos 380 millones de personas. A ellos se suman muchísimos que lo aprenden más tarde como segunda lengua.\n\nEn total lo hablan más de mil millones de personas, pero eso no dice nada de cuántas lo tienen como lengua materna.',
        },
      ],
    },
  },

  // ───────────── Historia y sociedad ─────────────
  'his-pyramid': {
    topic: 'Antiguo Egipto',
    intro: 'Hace más de 4000 años, los egipcios construyeron tumbas que siguen en pie.',
    stem: '¿Para qué faraón se construyó la Gran Pirámide de Guiza?',
    options: ['Tutankamón', 'Keops', 'Ramsés II', 'Akenatón'],
    f: [
      ['Fecha', 'La Gran Pirámide se construyó hacia el 2560 a. C.'],
      ['Nombre', 'Su constructor se llamaba Jufu en egipcio y Keops en griego.'],
      ['Tumba', 'La tumba de Tutankamón la descubrió Howard Carter en 1922.'],
    ],
    why: 'Keops (Jufu) mandó construir la mayor de las tres pirámides de Guiza.',
    files: {
      1: [
        { name: 'Nota.txt', kind: 'note', text: 'La Gran Pirámide se construyó hacia el 2560 a. C.' },
        {
          name: 'Guiza.txt',
          kind: 'article',
          source: SRC,
          text:
            'En Guiza, a las afueras de la actual El Cairo, se alzan tres grandes pirámides.\n\nLa mayor se construyó como tumba para un faraón de la IV dinastía. Medía originalmente unos 146 metros y fue durante milenios el edificio más alto del mundo.\n\nLos bloques de piedra se colocaron con rampas y trineos.',
        },
      ],
    },
  },
  'his-rosetta': {
    topic: 'Jeroglíficos',
    intro: 'Durante siglos nadie supo leer la escritura de los faraones, hasta que un hallazgo dio la clave.',
    stem: '¿Qué hallazgo permitió descifrar los jeroglíficos?',
    options: ['La piedra de Rosetta', 'El papiro Ebers', 'El tesoro de Príamo', 'El Códice Sinaítico'],
    f: [
      ['Trilingüe', 'La piedra lleva el mismo texto en jeroglíficos, demótico y griego antiguo.'],
      ['Hallazgo', 'Se encontró en 1799 cerca de Rosetta, en el delta del Nilo.'],
      ['Desciframiento', 'Jean-François Champollion logró el avance decisivo en 1822.'],
      ['Troya', 'Heinrich Schliemann excavó en Troya a partir de 1870.'],
    ],
    why: 'El texto griego ayudó a entender los jeroglíficos. Champollion lo aprovechó en 1822.',
  },
  'his-rome': {
    topic: 'Fin de la Antigüedad',
    intro: 'Un imperio enorme no cayó en un día, pero un año se considera el punto de inflexión.',
    stem: '¿En qué año se considera que cayó el Imperio romano de Occidente?',
    unit: 'd. C.',
    f: [
      ['Deposición', 'El caudillo Odoacro depuso al último emperador romano de Occidente, Rómulo Augústulo.'],
      ['Año', 'Ocurrió en el año 476 d. C.'],
      ['Oriente', 'El Imperio romano de Oriente perduró hasta 1453.'],
      ['División', 'El Imperio romano se dividió definitivamente en Oriente y Occidente en 395.'],
    ],
    why: 'En 476, Odoacro depuso a Rómulo Augústulo; el Imperio romano de Oriente siguió existiendo.',
  },
  'his-timeline': {
    topic: 'Cronología',
    intro: 'Entender la historia es poner los acontecimientos en el orden correcto.',
    stem: 'Ordena estos acontecimientos cronológicamente (del más antiguo al más reciente).',
    items: [
      'Construcción de la pirámide de Keops',
      'Primeros Juegos Olímpicos',
      'Muerte de Alejandro Magno',
      'Caída de Roma de Occidente',
    ],
    f: [
      ['Pirámide', 'Pirámide de Keops: hacia el 2560 a. C.'],
      ['Olimpia', 'Primeros Juegos Olímpicos antiguos: 776 a. C.'],
      ['Alejandro', 'Alejandro Magno murió en Babilonia en el 323 a. C.'],
      ['Roma Occidental', 'Fin del Imperio romano de Occidente: 476 d. C.'],
      ['Maravilla', 'La pirámide de Keops es la única de las siete maravillas del mundo antiguo que sigue en pie.'],
    ],
    why: '2560 a. C. → 776 a. C. → 323 a. C. → 476 d. C.',
  },
  'his-printing': {
    topic: 'Revolución de los medios',
    intro: 'Un invento hizo el saber accesible a muchos y cambió Europa a fondo.',
    stem: '¿Quién desarrolló hacia 1450 la imprenta de tipos móviles en Europa?',
    options: ['Johannes Gutenberg', 'Martín Lutero', 'Alberto Durero', 'Leonardo da Vinci'],
    f: [
      ['Inventor', 'Johannes Gutenberg, de Maguncia, fundía letras en metal.'],
      ['Biblia', 'La Biblia de Gutenberg se imprimió aproximadamente entre 1452 y 1454.'],
      ['Consecuencias', 'La imprenta aceleró la difusión de la Reforma.'],
      ['Lutero', 'Martín Lutero tradujo el Nuevo Testamento al alemán en 1522.'],
    ],
    why: 'La imprenta de tipos móviles de Gutenberg hizo que los libros estuvieran disponibles en masa por primera vez.',
    files: {
      1: [
        { name: 'Nota.txt', kind: 'note', text: 'Johannes Gutenberg, de Maguncia, fundía letras en metal.' },
        {
          name: 'Antes.txt',
          kind: 'article',
          source: SRC,
          text:
            'Antes de la imprenta, los libros se copiaban a mano. Eso llevaba meses y era caro; por eso pocas personas tenían libros.\n\nHacia 1450, un habitante de Maguncia desarrolló un método en el que las letras se fundían una a una en metal y se componían en páginas.\n\nCon la prensa se podían hacer muchas copias de una misma página.',
        },
      ],
    },
  },
  'his-wall': {
    topic: 'La división de Alemania',
    intro: 'Durante décadas, un muro dividió una ciudad; luego los acontecimientos se precipitaron.',
    stem: '¿En qué año cayó el Muro de Berlín?',
    unit: '',
    f: [
      ['Apertura', 'El 9 de noviembre se abrió la frontera entre Berlín Este y Berlín Oeste.'],
      ['Construcción', 'El muro se había construido en 1961.'],
      ['Unidad', 'La reunificación oficial llegó el 3 de octubre de 1990.'],
      ['Tratado', 'El Tratado Dos más Cuatro se firmó en 1990.'],
    ],
    why: 'El muro cayó el 9 de noviembre de 1989; la unidad llegó un año después.',
    files: {
      1: [
        { name: 'Nota.txt', kind: 'note', text: 'El 9 de noviembre se abrió la frontera entre Berlín Este y Berlín Oeste.' },
        {
          name: 'Berlín.png',
          kind: 'image',
          alt: 'Cronología de Berlín: 1961 construcción del muro, 1989 apertura de la frontera, 1990 reunificación.',
          chart: {
            chart: 'timeline',
            title: 'Berlín y el Muro',
            events: [
              { label: 'Construcción del muro', year: 1961 },
              { label: 'Frontera abierta', year: 1989 },
              { label: 'Reunificación', year: 1990 },
            ],
          },
        },
      ],
    },
  },
  'his-states': {
    topic: 'Federalismo',
    intro: 'Alemania es un Estado federal: sus estados tienen derechos y gobiernos propios.',
    stem: '¿Cuántos estados federados (Länder) tiene Alemania?',
    options: ['12', '14', '16', '18'],
    f: [
      ['Territoriales', 'Hay 13 estados territoriales.'],
      ['Ciudades-estado', 'Además hay tres ciudades-estado: Berlín, Hamburgo y Bremen.'],
      ['Unidad', 'Con la reunificación se sumaron cinco estados nuevos.'],
    ],
    why: '13 estados territoriales más tres ciudades-estado suman 16 estados federados.',
  },
  'his-euro': {
    topic: 'Moneda europea',
    intro: 'Una moneda común debía acercar más a los países de Europa.',
    stem: '¿En qué año se introdujeron los billetes y monedas de euro?',
    unit: '',
    f: [
      ['Efectivo', 'Monedas y billetes entraron en circulación un 1 de enero.'],
      ['Año', 'Fue a comienzos de 2002.'],
      ['Dinero bancario', 'Como dinero bancario, el euro ya existía desde 1999.'],
      ['Maastricht', 'El Tratado de Maastricht se firmó en 1992.'],
    ],
    why: 'El euro se introdujo en 1999 como dinero bancario; el efectivo llegó en 2002.',
  },

  // ───────────── Verdadero o falso ─────────────
  'tf-sound': {
    topic: 'El sonido',
    intro: 'Oímos música, voces y estallidos: pero ¿qué necesita el sonido para llegar hasta nosotros?',
    stem: '¿Verdadero o falso? El sonido también se propaga en el vacío.',
    f: [
      ['Medio', 'El sonido necesita materia, como aire, agua o sólidos, para propagarse.'],
      ['Espacio', 'El espacio está casi vacío; por eso allí no se oye ningún estallido.'],
      ['Ondas', 'El sonido se produce cuando las partículas vibran y empujan a sus vecinas.'],
      ['Luna', 'La Luna está a unos 384 000 km de la Tierra.'],
    ],
    why: 'El sonido es la vibración de la materia. Sin partículas que puedan vibrar no hay sonido, a diferencia de la luz.',
  },
  'tf-spider': {
    topic: 'Arácnidos',
    intro: 'Ocho patas, telarañas y mala fama: ¿a qué grupo de animales pertenecen realmente las arañas?',
    stem: '¿Verdadero o falso? Las arañas son insectos.',
    f: [
      ['Patas', 'Los insectos tienen seis patas; las arañas, ocho.'],
      ['Cuerpo', 'Los insectos tienen tres partes del cuerpo; las arañas, solo dos.'],
      ['Telaraña', 'No todas las arañas tejen telarañas para cazar.'],
    ],
    why: 'Las arañas son arácnidos: ocho patas, dos partes del cuerpo y sin antenas.',
  },
  'tf-piano': {
    topic: 'El piano',
    intro: 'El piano se considera el rey de los instrumentos y tiene un tamaño fijo y conocido.',
    stem: '¿Verdadero o falso? Un piano estándar tiene 88 teclas.',
    f: [
      ['Teclas', 'Un piano tiene 52 teclas blancas y 36 negras.'],
      ['Registro', 'Las teclas abarcan algo más de siete octavas.'],
      ['Pedales', 'Un piano de cola suele tener tres pedales.'],
    ],
    why: '52 teclas blancas más 36 negras suman 88.',
  },
  'tf-olympia': {
    topic: 'Juegos Olímpicos antiguos',
    intro: 'Los primeros Juegos Olímpicos eran una fiesta religiosa en honor de los dioses de Grecia.',
    stem: '¿Verdadero o falso? Los Juegos Olímpicos de la Antigüedad se celebraban en Atenas.',
    f: [
      ['Lugar', 'Los juegos antiguos se celebraban en Olimpia, en el Peloponeso.'],
      ['Época', 'Comenzaron en el 776 a. C. y se celebraban cada cuatro años.'],
      ['Atenas', 'Atenas era una ciudad poderosa y se considera la cuna de la democracia.'],
    ],
    why: 'Los juegos tomaban su nombre del lugar: Olimpia. Atenas solo organizó los primeros Juegos modernos, en 1896.',
  },
  'tf-salt': {
    topic: 'La sal de mesa',
    intro: 'La sal está en el mar, en la mesa y en todos los cuerpos. ¿De qué está hecha químicamente?',
    stem: '¿Verdadero o falso? La sal de mesa está formada por sodio y cloro.',
    f: [
      ['Fórmula', 'La sal de mesa tiene la fórmula química NaCl: sodio y cloro.'],
      ['Iones', 'En un cristal de sal, los iones de sodio y de cloruro forman una red.'],
      ['Mar', 'El agua de mar contiene de media un 3,5 % de sal.'],
    ],
    why: 'NaCl: Na significa sodio, y Cl, cloro. Juntos forman la sal que usamos cada día.',
  },
  'tf-nile': {
    topic: 'El Nilo',
    intro: 'El Nilo es la arteria vital de Egipto y atraviesa muchos países de África.',
    stem: '¿Verdadero o falso? El Nilo desemboca en el mar Mediterráneo.',
    f: [
      ['Desembocadura', 'El Nilo fluye hacia el norte y desemboca en el Mediterráneo formando un delta.'],
      ['Longitud', 'Con unos 6600 kilómetros, es uno de los ríos más largos de la Tierra.'],
      ['Esfinge', 'La Esfinge de Guiza está al borde del desierto, cerca de El Cairo.'],
    ],
    why: 'El Nilo fluye hacia el norte a través de África oriental y termina en su delta, en el Mediterráneo.',
  },

  // ───────────── Relacionar ─────────────
  'mt-units': {
    topic: 'Unidades físicas',
    intro: 'Medir es comparar: cada magnitud tiene su unidad, solo hay que relacionarlas bien.',
    stem: 'Une cada unidad con la magnitud que mide.',
    pairs: [
      ['Metro', 'Longitud'],
      ['Segundo', 'Tiempo'],
      ['Kilogramo', 'Masa'],
      ['Amperio', 'Intensidad eléctrica'],
    ],
    f: [
      ['Longitud, tiempo', 'El metro mide la longitud; el segundo, el tiempo.'],
      ['Masa, corriente', 'El kilogramo es la unidad de masa; el amperio, la de intensidad eléctrica.'],
      ['Newton', 'El newton es la unidad de fuerza.'],
    ],
    why: 'Metro (longitud), segundo (tiempo), kilogramo (masa) y amperio (intensidad eléctrica) son cuatro unidades básicas.',
  },
  'mt-classes': {
    topic: 'Clases de animales',
    intro: 'Del mar al cielo: los animales se clasifican según su anatomía y su forma de vida.',
    stem: 'Une cada animal con su clase.',
    pairs: [
      ['Delfín', 'Mamífero'],
      ['Rana', 'Anfibio'],
      ['Águila', 'Ave'],
      ['Tiburón', 'Pez'],
    ],
    f: [
      ['Delfín', 'Los delfines respiran aire y amamantan a sus crías: son mamíferos.'],
      ['Rana', 'Las ranas ponen sus huevos en el agua y después viven en tierra: son anfibios.'],
      ['Tiburón', 'Los tiburones respiran por branquias: son peces.'],
      ['Ballena', 'La ballena azul es el animal más grande de la Tierra.'],
    ],
    why: 'Pese a su forma, el delfín es un mamífero; el tiburón es un pez, la rana un anfibio y el águila un ave.',
  },
  'mt-instruments': {
    topic: 'Familias de instrumentos',
    intro: 'Las orquestas se ordenan por familias de instrumentos. ¿Qué va con qué?',
    stem: 'Une cada instrumento con su familia.',
    pairs: [
      ['Violín', 'Cuerda frotada'],
      ['Trompeta', 'Viento metal'],
      ['Flauta', 'Viento madera'],
      ['Timbal', 'Percusión'],
    ],
    f: [
      ['Arco', 'Los instrumentos de cuerda frotada se tocan con arco, como el violín y el violonchelo.'],
      ['Viento', 'La trompeta y el trombón son de viento metal; la flauta y el clarinete, de viento madera.'],
      ['Tambores', 'Los timbales y los tambores pertenecen a la percusión.'],
      ['Órgano', 'El órgano se considera el instrumento musical más grande.'],
    ],
    why: 'La flauta es de viento madera aunque hoy suele ser de metal, porque su sonido se produce en un bisel.',
  },
  'mt-gods': {
    topic: 'Dioses griegos',
    intro: 'Cada uno de los dioses griegos velaba por un ámbito propio.',
    stem: 'Une cada dios griego con su ámbito.',
    pairs: [
      ['Zeus', 'Rey de los dioses'],
      ['Poseidón', 'Mar'],
      ['Atenea', 'Sabiduría'],
      ['Ares', 'Guerra'],
    ],
    f: [
      ['Zeus, Poseidón', 'Zeus reinaba como rey de los dioses; Poseidón, sobre el mar.'],
      ['Atenea, Ares', 'Atenea era la diosa de la sabiduría; Ares, el dios de la guerra.'],
      ['Olimpo', 'El Olimpo es la montaña más alta de Grecia.'],
    ],
    why: 'Zeus (rey de los dioses), Poseidón (mar), Atenea (sabiduría) y Ares (guerra) eran dioses del Olimpo.',
  },
  'mt-capitals': {
    topic: 'Capitales',
    intro: 'Cada país tiene una capital donde tienen su sede el gobierno y la política.',
    stem: 'Une cada país con su capital.',
    pairs: [
      ['Francia', 'París'],
      ['Italia', 'Roma'],
      ['España', 'Madrid'],
      ['Polonia', 'Varsovia'],
    ],
    f: [
      ['Europa occidental', 'París es la capital de Francia; Madrid, la de España.'],
      ['Sur y este', 'Roma es la capital de Italia; Varsovia, la de Polonia.'],
      ['Berlín', 'Berlín es la capital de Alemania.'],
    ],
    why: 'París, Roma, Madrid y Varsovia son las capitales de Francia, Italia, España y Polonia.',
  },
  'mt-words': {
    topic: 'Reconocer idiomas',
    intro: 'Una sola palabra suele revelar qué idioma se habla. ¿Conoces estas palabras de agradecimiento?',
    stem: 'Une cada palabra con el idioma del que procede.',
    pairs: [
      ['Merci', 'Francés'],
      ['Gracias', 'Español'],
      ['Danke', 'Alemán'],
      ['Grazie', 'Italiano'],
    ],
    f: [
      ['Agradecimiento', 'Las cuatro palabras significan “gracias”.'],
      ['Romances', 'El francés, el español y el italiano son lenguas romances.'],
      ['Latín', 'Las lenguas romances proceden del latín.'],
    ],
    why: 'Merci es francés, Gracias español, Grazie italiano y Danke alemán.',
  },

  // ───────────── Completar huecos ─────────────
  'cl-lightsound': {
    topic: 'Luz y sonido',
    intro: 'La luz es rápida y el sonido, lento: por eso primero se ve el relámpago y luego se oye el trueno.',
    stem: 'Completa los números.',
    text: 'En un segundo, la luz recorre unos {0} kilómetros; el sonido en el aire, solo unos {1} metros.',
    answers: ['300 000', '340'],
    bank: ['300 000', '340', '30 000', '3400'],
    f: [
      ['Luz', 'Con unos 300 000 kilómetros por segundo, la luz es lo más rápido que existe.'],
      ['Sonido', 'El sonido en el aire recorre unos 340 metros por segundo.'],
      ['Tormenta', 'En una tormenta, primero se ve el relámpago.'],
    ],
    why: 'Luz: unos 300 000 km/s. Sonido en el aire: unos 340 m/s; por eso el trueno sigue al relámpago.',
  },
  'cl-photo': {
    topic: 'Intercambio de gases',
    intro: 'Las plantas no respiran como nosotros: intercambian gases con el aire y con ellos fabrican su alimento.',
    stem: 'Completa las palabras que faltan.',
    text: 'En la fotosíntesis, las plantas absorben {0} y liberan {1}.',
    answers: ['dióxido de carbono', 'oxígeno'],
    bank: ['dióxido de carbono', 'oxígeno', 'nitrógeno', 'hidrógeno'],
    f: [
      ['Absorción', 'Las plantas toman dióxido de carbono del aire.'],
      ['Liberación', 'Como subproducto se forma oxígeno, que las plantas liberan.'],
      ['Aire', 'Alrededor del 78 % del aire es nitrógeno.'],
    ],
    why: 'Las plantas absorben dióxido de carbono, con la luz fabrican azúcar a partir de él y liberan oxígeno.',
  },
  'cl-music': {
    topic: 'Contar en música',
    intro: 'La música vive de los números: desde el número de notas hasta el tamaño de un conjunto.',
    stem: 'Completa los números con letras.',
    text: 'Una tríada se compone de {0} notas; un cuarteto de cuerda, de {1} músicos.',
    answers: ['tres', 'cuatro'],
    bank: ['tres', 'cuatro', 'cinco', 'dos'],
    f: [
      ['Tríada', 'Una tríada está formada por tres notas.'],
      ['Cuarteto', 'Cuarteto significa cuatro: dos violines, viola y violonchelo.'],
      ['Octava', 'Una octava abarca ocho grados de la escala.'],
    ],
    why: 'Tres notas forman una tríada; cuatro músicos, un cuarteto de cuerda.',
  },
  'cl-rome': {
    topic: 'Ingeniería romana',
    intro: 'Los romanos fueron grandes ingenieros y extendieron su lengua por toda Europa.',
    stem: 'Completa las palabras que faltan.',
    text: 'Los romanos llevaban el agua a sus ciudades mediante {0}, y su lengua era el {1}.',
    answers: ['acueductos', 'latín'],
    bank: ['acueductos', 'latín', 'pirámides', 'griego'],
    f: [
      ['Agua', 'Los acueductos son puentes por los que el agua llegaba a las ciudades.'],
      ['Lengua', 'El latín era la lengua de los romanos y se extendió por todo el imperio.'],
      ['Egipto', 'Los egipcios construían pirámides como tumbas.'],
    ],
    why: 'Los romanos construyeron acueductos para el agua y hablaban latín.',
  },
  'cl-price': {
    topic: 'Oferta y demanda',
    intro: 'Los mercados siguen una regla sencilla: cuando algo se demanda más, su precio cambia.',
    stem: 'Completa con la palabra correcta.',
    text: 'Si la demanda aumenta y la oferta no cambia, el precio {0}.',
    answers: ['sube'],
    bank: ['sube', 'baja', 'se mantiene'],
    f: [
      ['Demanda', 'Si más personas quieren un bien y no hay más cantidad, su precio sube.'],
      ['Oferta', 'Si un bien se ofrece más, su precio tiende a bajar.'],
      ['Oro', 'El oro se considera desde hace mucho un valor refugio.'],
    ],
    why: 'Más demanda con la misma oferta hace que un bien sea más escaso, y el precio sube.',
  },

  // ───────────── Sociedad, política y economía ─────────────
  'soc-eu': {
    topic: 'Unión Europea',
    intro: 'Seis países fundadores se han convertido en una comunidad que abarca casi todo un continente.',
    stem: '¿Cuántos Estados miembros tiene la Unión Europea desde la salida del Reino Unido?',
    options: ['25', '27', '28', '30'],
    f: [
      ['Ampliación', 'Con la adhesión de Croacia en 2013, la UE llegó a 28 Estados miembros.'],
      ['Salida', 'El Reino Unido abandonó la UE a finales de enero de 2020, el único país que lo ha hecho hasta ahora.'],
      ['Fundación', 'En 1957, seis Estados firmaron los Tratados de Roma, la base de la UE actual.'],
      ['Consejo de Europa', 'El Consejo de Europa no es una institución de la UE y tiene 46 Estados miembros.'],
      ['Moneda', 'No todos los países de la UE usan el euro; Dinamarca, por ejemplo, mantiene su corona.'],
    ],
    why: 'Con Croacia eran exactamente 28 Estados en 2013. Desde la salida del Reino Unido en 2020 son 27.',
  },
  'soc-un': {
    topic: 'Naciones Unidas',
    intro: 'Tras la Segunda Guerra Mundial, varios Estados se unieron para asegurar la paz.',
    stem: 'En el Consejo de Seguridad de la ONU, todos los miembros tienen derecho de veto.',
    f: [
      ['Permanentes', 'El Consejo de Seguridad tiene cinco miembros permanentes: China, Francia, Rusia, el Reino Unido y Estados Unidos.'],
      ['Elegidos', 'Otros diez miembros se eligen por dos años y no pueden ejercer el veto.'],
      ['Fundación', 'Las Naciones Unidas se fundaron en 1945, tras la Segunda Guerra Mundial.'],
      ['Sede', 'La sede de las Naciones Unidas está en Nueva York.'],
      ['Miembros', 'Hoy forman parte de las Naciones Unidas 193 Estados.'],
    ],
    why: 'Solo los cinco miembros permanentes tienen derecho de veto. Los diez miembros elegidos no.',
  },
  'soc-powers': {
    topic: 'Separación de poderes',
    intro: 'En una democracia, el poder se reparte entre varios órganos para que nadie tenga demasiado.',
    stem: 'Une cada órgano constitucional alemán con el poder que ejerce.',
    pairs: [
      ['Bundestag (parlamento)', 'Legislativo'],
      ['Gobierno federal', 'Ejecutivo'],
      ['Tribunal Constitucional Federal', 'Judicial'],
    ],
    f: [
      ['Parlamento', 'El parlamento aprueba las leyes; a nivel federal es el Bundestag.'],
      ['Gobierno', 'El gobierno, encabezado por el canciller o la canciller, aplica las leyes y dirige la administración.'],
      ['Karlsruhe', 'En Karlsruhe, el tribunal más alto de Alemania comprueba si las leyes respetan la Ley Fundamental.'],
      ['Montesquieu', 'Montesquieu describió tres poderes: el legislativo, el ejecutivo y el judicial.'],
      ['Edad de voto', 'En las elecciones al Bundestag se puede votar a partir de los 18 años.'],
    ],
    why: 'El Bundestag aprueba las leyes (legislativo), el Gobierno federal las ejecuta (ejecutivo) y el Tribunal Constitucional Federal imparte justicia (judicial).',
  },
  'soc-basic': {
    topic: 'Derechos fundamentales',
    intro: 'Antes de ordenar el Estado y sus autoridades, la Ley Fundamental pone un principio al frente.',
    stem: '¿Con qué frase empieza el artículo 1 de la Ley Fundamental alemana?',
    options: [
      'La dignidad humana es intangible.',
      'Todas las personas son iguales ante la ley.',
      'El arte y la ciencia son libres.',
      'Todos los alemanes tienen derecho a reunirse.',
    ],
    f: [
      ['Artículo 1', 'El artículo 1 nombra el valor que el Estado debe respetar y proteger: la dignidad de cada ser humano.'],
      ['Igualdad', 'La frase “Todas las personas son iguales ante la ley” está en el artículo 3.'],
      ['Entrada en vigor', 'La Ley Fundamental entró en vigor el 23 de mayo de 1949.'],
      ['Presidente', 'El presidente federal es elegido por cinco años.'],
    ],
    why: 'El artículo 1 empieza con “La dignidad humana es intangible.” La igualdad ante la ley está en el artículo 3, la libertad artística en el 5 y la libertad de reunión en el 8.',
  },
  'soc-majority': {
    topic: 'Mayoría de edad',
    intro: 'En un cumpleaños concreto cambian de golpe muchos derechos y deberes.',
    stem: '¿A qué edad se alcanza la mayoría de edad en Alemania?',
    unit: 'años',
    f: [
      ['Derecho de voto', 'Desde 1975, en Alemania se alcanza la mayoría de edad a la edad a la que se puede votar al Bundestag.'],
      ['Elecciones', 'Puede votar al Bundestag quien haya cumplido 18 años el día de las elecciones.'],
      ['Antes', 'Antes de 1975, en Alemania no se era mayor de edad hasta los 21 años.'],
      ['Penal', 'En Alemania, la responsabilidad penal empieza a los 14 años.'],
      ['Conducir', 'La conducción acompañada es posible a partir de los 17 años.'],
    ],
    why: 'Desde 1975, en Alemania se es mayor de edad a los 18 años; antes, a los 21.',
  },
  'soc-court': {
    topic: 'Tribunal Constitucional',
    intro: 'Un tribunal vela por que también el parlamento y el gobierno respeten la constitución.',
    stem: 'El Tribunal Constitucional Federal de Alemania tiene su sede en Berlín.',
    f: [
      ['Sede', 'El Tribunal Constitucional Federal y el Tribunal Federal de Justicia tienen su sede en Karlsruhe.'],
      ['Comienzos', 'El Tribunal Constitucional Federal empezó a trabajar en 1951.'],
      ['Reichstag', 'Desde 1999, el Bundestag se reúne en el edificio del Reichstag, en Berlín.'],
      ['Mandato', 'Los jueces del Tribunal Constitucional Federal son elegidos por doce años.'],
    ],
    why: 'El Tribunal Constitucional Federal tiene su sede en Karlsruhe. El Bundestag y el Gobierno federal trabajan en Berlín.',
  },
  'soc-inflation': {
    topic: 'Inflación',
    intro: 'Cuando los precios suben, cambia lo que realmente vale tu dinero.',
    stem: 'Con la inflación, con la misma cantidad de dinero se compran más bienes que antes.',
    f: [
      ['Poder adquisitivo', 'Si sube el nivel general de precios, baja el poder adquisitivo del dinero.'],
      ['Objetivo', 'A medio plazo, el Banco Central Europeo aspira a una tasa de inflación del 2 %.'],
      ['Deflación', 'Si los precios bajan durante un periodo largo, se habla de deflación.'],
      ['Monedas', 'Las monedas de euro tienen una cara europea común y una cara nacional.'],
    ],
    why: 'Con la inflación, los precios suben. Con la misma cantidad se compra menos, no más.',
  },

  // ───────────── Humanidades: filosofía y religión ─────────────
  'hum-socrates': {
    topic: 'Filosofía antigua',
    intro: 'En la antigua Atenas, los pensadores discutían en plena calle sobre la justicia, el saber y la vida buena.',
    stem: '¿Qué filósofo griego no dejó escritos propios y se conoce sobre todo por su discípulo Platón?',
    options: ['Aristóteles', 'Sócrates', 'Epicuro', 'Pitágoras'],
    f: [
      ['Ágora', 'Sócrates discutía en el ágora de Atenas y nunca escribió un libro.'],
      ['Diálogos', 'Platón escribió diálogos en los que su maestro hace preguntas como personaje principal.'],
      ['Academia', 'Platón fundó en Atenas la Academia, una de las primeras escuelas de filosofía.'],
      ['Alejandro', 'Aristóteles fue discípulo de Platón y maestro de Alejandro Magno.'],
    ],
    why: 'Sócrates no escribió nada. Lo que sabemos de él procede sobre todo de los diálogos de Platón.',
  },
  'hum-religions': {
    topic: 'Religiones del mundo',
    intro: 'Muchas religiones se basan en escrituras sagradas transmitidas a lo largo de los siglos.',
    stem: 'Une cada religión con su escritura sagrada principal.',
    pairs: [
      ['Cristianismo', 'Biblia'],
      ['Islam', 'Corán'],
      ['Judaísmo', 'Torá'],
      ['Hinduismo', 'Vedas'],
    ],
    f: [
      ['Revelación', 'Según la fe musulmana, el Corán fue revelado al profeta Mahoma.'],
      ['Cinco libros', 'La Torá comprende los cinco libros de Moisés y es la base del judaísmo.'],
      ['Sánscrito', 'Los Vedas están entre las escrituras sagradas más antiguas del hinduismo y están escritos en sánscrito.'],
      ['Testamentos', 'La Biblia cristiana consta del Antiguo y del Nuevo Testamento.'],
      ['Buda', 'Siddhartha Gautama, el Buda, vivió probablemente en la India en el siglo V a. C.'],
    ],
    why: 'Biblia (cristianismo), Corán (islam), Torá (judaísmo) y Vedas (hinduismo) son las escrituras centrales de estas religiones.',
  },

  // ───────────── Geografía y Tierra: astronomía y clima ─────────────
  'ear-planets': {
    topic: 'Sistema solar',
    intro: 'Ocho planetas giran alrededor del Sol, cada uno a su propia distancia.',
    stem: 'Ordena los planetas según su distancia al Sol, el más cercano primero.',
    items: ['Mercurio', 'Venus', 'Tierra', 'Marte', 'Júpiter'],
    f: [
      ['Interior', 'Mercurio es el que gira más cerca del Sol; después viene Venus.'],
      ['Planeta rojo', 'Marte es el vecino exterior de la Tierra.'],
      ['Gigante', 'Júpiter es el planeta más grande y gira más allá del cinturón de asteroides.'],
      ['Número', 'Desde 2006 se cuentan ocho planetas en el sistema solar.'],
      ['Luna', 'La Luna es el quinto satélite más grande del sistema solar.'],
    ],
    why: 'De dentro hacia fuera: Mercurio, Venus, la Tierra, Marte y, más allá del cinturón de asteroides, Júpiter.',
  },
  'ear-universe': {
    topic: 'Edad del universo',
    intro: 'Todo empezó con un acontecimiento colosal. Hoy se puede decir con bastante precisión cuándo.',
    stem: '¿Qué edad tiene aproximadamente el universo según las mediciones actuales (en miles de millones de años)?',
    unit: 'mil millones de años',
    f: [
      ['Big Bang', 'Las mediciones de la radiación cósmica de fondo sitúan el Big Bang hace unos 13 800 millones de años.'],
      ['Edad de la Tierra', 'La Tierra tiene unos 4500 millones de años.'],
      ['Año luz', 'Un año luz es la distancia que recorre la luz en un año.'],
      ['Sol', 'Se espera que el Sol brille todavía unos cinco mil millones de años más.'],
    ],
    why: 'Según las mediciones actuales, el Big Bang ocurrió hace unos 13 800 millones de años, unas tres veces la edad de la Tierra.',
  },
  'ear-zones': {
    topic: 'Zonas climáticas',
    intro: 'Según lo lejos que esté un lugar del ecuador, su clima es completamente distinto.',
    stem: '¿En qué zona climática se encuentra Alemania?',
    options: ['Trópicos', 'Subtrópicos', 'Zona templada', 'Zona polar'],
    f: [
      ['Estaciones', 'En Alemania son típicas cuatro estaciones marcadas, con veranos suaves e inviernos frescos.'],
      ['Latitud', 'Alemania está más o menos entre los 47 y los 55 grados de latitud norte.'],
      ['Clasificación', 'A grandes rasgos, la Tierra se divide en zonas tropical, subtropical, templada y polar.'],
      ['Sahara', 'El Sahara es el mayor desierto cálido de la Tierra.'],
    ],
    why: 'Alemania está en la zona templada: hay cuatro estaciones y no hace ni un calor tropical ni un frío polar.',
  },
};
