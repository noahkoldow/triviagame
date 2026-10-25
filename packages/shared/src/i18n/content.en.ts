import type { QuestionText } from '../localize';

/** The built-in questions in English (source: `content.ts`). */
const SRC = 'Nexus Archive';

export const CONTENT_EN: Record<string, QuestionText> = {
  // ───────────── Science & technology ─────────────
  'sci-light': {
    topic: 'Speed of light',
    intro: 'Nothing in the universe is faster than light, yet even light needs time to cover a distance.',
    stem: 'Roughly how far does light travel in a vacuum in one second?',
    options: ['3,000 km', '30,000 km', '300,000 km', '3 million km'],
    f: [
      ['Distance', 'The Sun is about 150 million km away from Earth.'],
      ['Duration', 'Sunlight takes about 8 minutes, or roughly 500 seconds, to reach Earth.'],
      ['Moon', 'The Moon is about 384,000 km away on average; its light takes just over a second.'],
      ['Sound', 'In air, sound travels about 343 metres per second.'],
      ['Light-year', 'A light-year measures a period of exactly 365 days.'],
    ],
    why: '150 million km in ~500 s gives about 300,000 km/s. (A light-year, by the way, is a distance, not a time.)',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'The Sun is about 150 million km away from Earth.' },
        {
          name: 'Planets.png',
          kind: 'image',
          alt: 'Bar chart: distance of Mercury, Venus, Earth and Mars from the Sun in millions of kilometres.',
          chart: {
            chart: 'bars',
            title: 'Distance from the Sun',
            unit: 'million km',
            items: [
              { label: 'Mercury', value: 58 },
              { label: 'Venus', value: 108 },
              { label: 'Earth', value: 150 },
              { label: 'Mars', value: 228 },
            ],
          },
        },
        { name: 'Moonlight.txt', kind: 'note', text: 'The Moon does not shine by itself. It reflects the light of the Sun.' },
      ],
      2: [
        {
          name: 'Sunlight.txt',
          kind: 'article',
          source: SRC,
          text:
            'When you look at the Sun, you see it as it was a few minutes ago.\n\nIts light first has to reach us. That takes about 8 minutes, or roughly 500 seconds.\n\nHow fast light is can be worked out from distance and time: distance divided by time.\n\nThe light of the Moon, by contrast, is on its way for just over a second.',
        },
      ],
      4: [
        { name: 'Note.txt', kind: 'note', text: 'In air, sound travels about 343 metres per second.' },
        {
          name: 'Sound.png',
          kind: 'image',
          alt: 'Table: speed of sound in air, water and steel.',
          chart: {
            chart: 'table',
            title: 'Speed of sound',
            columns: ['Medium', 'm/s'],
            rows: [['Air', '343'], ['Water', '1,480'], ['Steel', '5,900']],
          },
        },
      ],
    },
  },
  'sci-relativity': {
    topic: 'Theory of relativity',
    intro: 'At the start of the 20th century, Einstein turned our ideas of space and time upside down.',
    stem: "According to Einstein's special theory of relativity, what is the same for every observer?",
    options: [
      'The time between two events',
      'The length of a rod',
      'The speed of light in a vacuum',
      'The speed of a train',
    ],
    f: [
      ['Clocks', 'Moving clocks run slower as seen by an observer at rest.'],
      ['Rods', 'Moving rods appear shortened in the direction of motion.'],
      ['Year', 'Einstein published the special theory of relativity in 1905.'],
      ['Formula', 'E = mc² describes how much energy is in a gram of water when you heat it.'],
    ],
    why: 'Time and length are relative, the speed of light in a vacuum is not: it is the same for every observer.',
  },
  'sci-gravwaves': {
    topic: 'Gravitational waves',
    intro: 'Violent events in space make space itself vibrate. For a few years now, this can be measured.',
    stem: 'In which year did the first directly detected gravitational-wave signal arrive at LIGO?',
    unit: '',
    f: [
      ['Signal', 'The signal of two merging black holes arrived in September 2015.'],
      ['Announcement', 'The detection was only announced in February 2016.'],
      ['Prediction', 'Einstein had predicted gravitational waves in 1916.'],
      ['Nobel Prize', 'The 2017 Nobel Prize in Physics for it went to Weiss, Barish and Thorne.'],
      ['Higgs', 'The Higgs particle was detected at CERN in 2012.'],
    ],
    why: 'The signal arrived on 14 September 2015; the announcement followed in 2016.',
  },
  'sci-water': {
    topic: 'Water & molecules',
    intro: 'Water is everywhere, and yet its structure is a little lesson in chemistry.',
    stem: 'What is a water molecule made of?',
    options: [
      '2 hydrogen atoms and 1 oxygen atom',
      '1 hydrogen atom and 2 oxygen atoms',
      '2 hydrogen atoms and 2 oxygen atoms',
      '3 hydrogen atoms',
    ],
    f: [
      ['Formula', 'The formula is H₂O: the subscript 2 belongs to hydrogen.'],
      ['Boiling point', 'At sea level, water boils at 100 °C.'],
      ['CO₂', 'Carbon dioxide consists of one carbon atom and two oxygen atoms.'],
      ['H₂O₂', 'Hydrogen peroxide (H₂O₂) is used for bleaching.'],
    ],
    why: 'H₂O: two hydrogen atoms (H) and one oxygen atom (O).',
  },
  'sci-ph': {
    topic: 'Acids & bases',
    intro: 'Lemon juice, soap, stomach acid: a scale measures how acidic or basic something is.',
    stem: 'What is true of a solution with a pH of 3?',
    options: ['It is acidic', 'It is neutral', 'It is basic', 'It cannot be measured'],
    f: [
      ['Scale', 'pH 7 is neutral, lower values are acidic, higher ones basic.'],
      ['Lemon', 'Lemon juice has a pH of about 2.'],
      ['Soap', 'Soapy water has a pH of about 10.'],
      ['Measuring', 'The pH value is given in grams per litre.'],
    ],
    why: 'Anything below pH 7 is acidic. The scale usually runs from 0 to 14.',
  },
  'sci-binary': {
    topic: 'Number systems',
    intro: 'Computers calculate with only two digits. Even so, any number can be built from them.',
    stem: 'Which decimal number equals the binary number 1011?',
    options: ['9', '11', '13', '15'],
    f: [
      ['Place values', 'In binary, the place values from the right are 1, 2, 4, 8, 16, …'],
      ['Byte', 'A byte consists of 8 bits.'],
      ['Hex', 'Hexadecimal uses 16 digits: 0–9 and A–F.'],
    ],
    why: '1·8 + 0·4 + 1·2 + 1·1 = 11.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'In binary, the place values from the right are 1, 2, 4, 8, 16, …' },
        {
          name: 'Places.png',
          kind: 'image',
          alt: 'Table: the four place values of a binary number from left to right: 8, 4, 2, 1.',
          chart: {
            chart: 'table',
            title: 'Place values (4 bits)',
            columns: ['Place', '4th', '3rd', '2nd', '1st'],
            rows: [['Value', '8', '4', '2', '1']],
          },
        },
      ],
    },
  },
  'sci-algo': {
    topic: 'Search algorithms',
    intro: 'Searching cleverly means not having to look at everything. Good methods save an enormous amount of time.',
    stem: 'What is the largest number of steps a binary search needs among 1,000 sorted entries?',
    unit: 'steps',
    f: [
      ['Halving', 'Binary search halves the search range at every step.'],
      ['Power of two', '2¹⁰ is 1,024, so more than 1,000.'],
      ['Linear', 'In the worst case, a linear search checks every entry.'],
      ['Quicksort', 'On average, quicksort sorts in n·log n steps.'],
    ],
    why: 'After 10 halvings one entry is left: 2¹⁰ = 1,024 ≥ 1,000.',
  },
  'sci-vaccine': {
    topic: 'History of vaccination',
    intro: 'Long before viruses were known, a country doctor found a way to prevent disease.',
    stem: 'Who developed the first vaccination in 1796, against smallpox?',
    options: ['Louis Pasteur', 'Edward Jenner', 'Robert Koch', 'Alexander Fleming'],
    f: [
      ['Observation', 'The English country doctor Edward Jenner noticed that milkmaids rarely caught smallpox.'],
      ['Cowpox', 'In 1796 he inoculated a boy with cowpox material; later it protected him from smallpox.'],
      ['Word', 'The word "vaccine" comes from Latin vacca, the cow.'],
      ['Rabies', 'Louis Pasteur developed a vaccine against rabies in 1885.'],
    ],
    why: 'Jenner founded vaccination. Pasteur later developed it further for other diseases.',
    files: {
      1: [
        {
          name: 'Jenner.txt',
          kind: 'article',
          source: SRC,
          text:
            'In the 18th century, smallpox killed many people. A country doctor in England noticed something: milkmaids who had caught the harmless cowpox from cows rarely fell ill with the dangerous human smallpox.\n\nThe doctor was called Edward Jenner. In 1796 he put material from a cowpox blister into small cuts on the arm of an eight-year-old boy.\n\nLater the boy stayed healthy when exposed to smallpox. The word vaccine comes from the Latin word for cow, vacca.',
        },
      ],
    },
  },
  'sci-penicillin': {
    topic: 'Antibiotics',
    intro: 'Sometimes great things come about by chance and an untidy lab bench.',
    stem: 'What did Alexander Fleming discover in his laboratory in 1928?',
    options: ['Penicillin', 'Insulin', 'X-rays', 'Blood groups'],
    f: [
      ['Mould', 'A mould grew on a bacterial culture, and the bacteria around it died.'],
      ['Fungus', 'The fungus belonged to the genus Penicillium.'],
      ['Nobel Prize', 'In 1945 Fleming shared the Nobel Prize in Medicine with Florey and Chain.'],
      ['Röntgen', 'Wilhelm Conrad Röntgen discovered X-rays in 1895.'],
    ],
    why: 'Fleming discovered the first antibiotic. It only became usable later, thanks to Florey and Chain.',
    files: {
      1: [
        {
          name: 'Discovery.txt',
          kind: 'article',
          source: SRC,
          text:
            'In 1928 the doctor Alexander Fleming was tidying up his laboratory in London. He found a forgotten dish of bacteria on which a mould had grown.\n\nAround the mould, the bacteria had died. Fleming concluded that the mould produces a substance that kills bacteria.\n\nOnly in the 1940s did Howard Florey and Ernst Chain manage to produce the drug in large quantities.',
        },
      ],
    },
  },

  // ───────────── Nature & world ─────────────
  'nat-photosynthesis': {
    topic: 'Photosynthesis',
    intro: 'Plants are little factories: they make their own food from light and air.',
    stem: 'Which gas do plants take in during photosynthesis?',
    options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Hydrogen'],
    f: [
      ['Sugar', 'Plants build sugar from carbon dioxide and water, releasing oxygen as they do.'],
      ['Chlorophyll', 'The green leaf pigment chlorophyll captures the light.'],
      ['Breathing', 'Animals and humans breathe in oxygen.'],
      ['Air', 'Air is about 78 % nitrogen.'],
    ],
    why: 'Photosynthesis: carbon dioxide + water + light → sugar + oxygen.',
    files: {
      1: [
        {
          name: 'Photosynthesis.txt',
          kind: 'article',
          source: SRC,
          text:
            'Plants feed themselves.\n\nThe green leaves contain the pigment chlorophyll. It captures sunlight and provides the energy.\n\nPlants take in carbon dioxide from the air and water from the soil. From these they build sugar, their building material and fuel.\n\nOxygen is produced as a by-product, and the plant releases it into the air.',
        },
        { name: 'Breathing.txt', kind: 'note', text: 'Animals and humans breathe in oxygen and breathe out carbon dioxide.' },
      ],
    },
  },
  'nat-chloroplast': {
    topic: 'The plant cell',
    intro: 'Inside plant cells there is a tiny solar factory.',
    stem: 'In which cell organelles does photosynthesis take place?',
    options: ['Mitochondria', 'Chloroplasts', 'Ribosomes', 'Nucleus'],
    f: [
      ['Chlorophyll', 'Chloroplasts contain chlorophyll and are found in plant cells.'],
      ['Powerhouse', 'Mitochondria are the "powerhouses" of the cell and gain energy through cellular respiration.'],
      ['Ribosomes', 'Ribosomes assemble proteins.'],
      ['Nucleus', 'The nucleus carries the genetic information in the form of chromosomes.'],
    ],
    why: 'Chloroplasts are where photosynthesis happens; mitochondria carry out cellular respiration.',
  },
  'nat-everest': {
    topic: 'Highest mountains',
    intro: "Earth's highest mountain has been measured again and again for decades.",
    stem: 'Roughly how high is Mount Everest (in metres)?',
    unit: 'm',
    f: [
      ['Survey', 'A joint survey by Nepal and China in 2020 found a height of 8,849 metres.'],
      ['Location', 'Everest lies in the Himalayas on the border between Nepal and China.'],
      ['K2', 'At 8,611 m, K2 is the second-highest mountain on Earth.'],
      ['Zugspitze', "At 2,962 m, the Zugspitze is Germany's highest mountain."],
    ],
    why: 'At 8,849 m, Everest is the highest mountain above sea level.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'A joint survey by Nepal and China in 2020 found a height of 8,849 metres.' },
        {
          name: 'Summits.png',
          kind: 'image',
          alt: 'Bar chart: height of the four highest mountains on Earth in metres. Everest, K2, Kangchenjunga, Lhotse.',
          chart: {
            chart: 'bars',
            title: 'The highest mountains',
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
    topic: 'Mountain building',
    intro: 'Mountains do not appear overnight but through forces that slowly move continents.',
    stem: 'How were the Himalayas formed?',
    options: [
      'By volcanoes on the sea floor',
      'By the collision of the Indian and Eurasian plates',
      'By an ice age',
      'By a meteorite impact',
    ],
    f: [
      ['Drift', 'The Indian Plate has been moving north for millions of years.'],
      ['Collision', 'It pushes into the Eurasian Plate and folds the rock into mountains.'],
      ['Growth', 'The Himalayas still grow by a few millimetres a year.'],
      ['Alps', 'The Alps formed when the African Plate collided with the Eurasian Plate.'],
    ],
    why: 'Two continental plates collide – neither sinks beneath the other, so the rock piles up.',
  },
  'nat-rainforest': {
    topic: 'Great rivers',
    intro: 'Some rivers are so mighty that they colour the sea far out from the coast.',
    stem: 'Which river carries the largest volume of water on Earth?',
    options: ['Nile', 'Amazon', 'Yangtze', 'Mississippi'],
    f: [
      ['Volume', 'The Amazon carries about a fifth of all the river water on Earth to the sea.'],
      ['Length', 'The Nile and the Amazon compete for the title of "longest river".'],
      ['Yangtze', 'The Yangtze is the longest river in Asia.'],
    ],
    why: 'Volume is not the same as length: the Amazon carries the most water.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'The Amazon carries about a fifth of all the river water on Earth to the sea.' },
        {
          name: 'Discharge.png',
          kind: 'image',
          alt: 'Bar chart: discharge of the Amazon, Congo, Ganges and Orinoco in thousands of cubic metres per second, rounded.',
          chart: {
            chart: 'bars',
            title: 'Discharge (rounded)',
            unit: '1,000 m³/s',
            items: [
              { label: 'Amazon', value: 209 },
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
    topic: 'Animal communication',
    intro: 'Bees communicate without words and so find the richest flowers.',
    stem: 'What is the "language" honeybees use to share food sources called?',
    options: ['Waggle dance', 'Waltz', 'Courtship dance', 'Rain dance'],
    f: [
      ['Researcher', 'Karl von Frisch decoded the dance and received the Nobel Prize for it in 1973.'],
      ['Signal', 'The angle to the vertical shows the direction relative to the sun; how long the waggling lasts shows the distance.'],
      ['Colony', 'In summer a bee colony has up to 50,000 bees.'],
      ['Ants', 'Ants communicate mainly through scents.'],
    ],
    why: 'The waggle dance encodes the direction and distance of a food source.',
  },
  'nat-octopus': {
    topic: 'Octopuses',
    intro: 'Octopuses are among the cleverest invertebrates and have an unusual body plan.',
    stem: 'How many hearts does an octopus have?',
    options: ['1', '2', '3', '8'],
    f: [
      ['Gill hearts', 'Two gill hearts pump blood through the gills.'],
      ['Systemic heart', 'Another heart supplies the rest of the body.'],
      ['Blood', 'Their blood is blue because it contains copper-based haemocyanin.'],
      ['Arms', 'Octopuses have eight arms; squid have ten.'],
    ],
    why: 'Two gill hearts plus one systemic heart: three hearts.',
  },
  'nat-climate': {
    topic: 'Greenhouse gases',
    intro: 'The climate is changing because certain gases hold heat in the atmosphere.',
    stem: 'Which greenhouse gas is produced mainly by burning fossil fuels?',
    options: ['Carbon dioxide', 'Argon', 'Neon', 'Nitrogen'],
    f: [
      ['Combustion', 'When coal, oil and gas burn, carbon combines with oxygen.'],
      ['Greenhouse effect', 'Greenhouse gases trap heat radiation in the atmosphere.'],
      ['Noble gas', 'Argon and neon are noble gases and hardly react.'],
    ],
    why: 'Carbon + oxygen → carbon dioxide (CO₂), the most important greenhouse gas released by humans.',
  },

  // ───────────── Culture & art ─────────────
  'cul-guitar': {
    topic: 'String instruments',
    intro: 'Guitars come in many shapes, but the classical instrument has a fixed design.',
    stem: 'How many strings does a standard guitar have?',
    options: ['4', '5', '6', '12'],
    f: [
      ['Tuning', 'Standard tuning is E–A–D–G–B–E: six strings.'],
      ['Violin', 'A violin has four strings.'],
      ['Bass', 'A classic electric bass also has four strings.'],
    ],
    why: 'A guitar has six strings. Twelve-string guitars double them in pairs.',
  },
  'cul-bach': {
    topic: 'Baroque music',
    intro: 'The Baroque produced music of astonishing order that pianists still practise today.',
    stem: 'Who wrote "The Well-Tempered Clavier"?',
    options: ['Johann Sebastian Bach', 'Wolfgang Amadeus Mozart', 'Ludwig van Beethoven', 'George Frideric Handel'],
    f: [
      ['Work', 'The work contains preludes and fugues in all 24 major and minor keys.'],
      ['Composer', 'The composer was Thomaskantor, cantor of St Thomas, in Leipzig.'],
      ['Era', 'It was written in the Baroque; Book I dates from 1722.'],
      ['Water', 'Handel wrote the "Water Music" for King George I.'],
    ],
    why: 'Bach, cantor of St Thomas in Leipzig, wrote two books, each with 24 preludes and fugues.',
    files: {
      2: [
        { name: 'Note.txt', kind: 'note', text: 'The composer was Thomaskantor, cantor of St Thomas, in Leipzig.' },
        {
          name: 'Leipzig.txt',
          kind: 'article',
          source: SRC,
          text:
            'He was born in Eisenach in 1685 and came from a family of musicians.\n\nIn Leipzig he led the choir of St Thomas Church for more than two decades. There he wrote a large part of his church music.\n\nHis works for keyboard instruments are still considered a benchmark for pianists today.',
        },
      ],
    },
  },
  'cul-mona': {
    topic: 'Renaissance painting',
    intro: "The world's most famous painting hangs in a Paris museum and smiles mysteriously.",
    stem: 'Who painted the Mona Lisa?',
    options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Botticelli'],
    f: [
      ['Painter', 'Leonardo da Vinci worked on the portrait from around 1503.'],
      ['Place', 'The painting hangs in the Louvre in Paris.'],
      ['Sistine', 'Michelangelo painted the ceiling of the Sistine Chapel.'],
    ],
    why: 'The Mona Lisa is a work by Leonardo da Vinci from the Italian High Renaissance.',
  },
  'cul-impression': {
    topic: 'Impressionism',
    intro: 'A fleeting impression at sunrise gave a whole art movement its name.',
    stem: 'Which painting by Claude Monet gave Impressionism its name?',
    options: ['Impression, Sunrise', 'Water Lilies', 'The Luncheon on the Grass', 'Rouen Cathedral'],
    f: [
      ['Mockery', 'In 1874 a critic mocked an exhibition as mere "Impressionists", after the title of one painting.'],
      ['Subject', 'The painting shows the harbour of Le Havre in the morning mist.'],
      ['Giverny', 'Monet later painted his water lilies in his garden at Giverny.'],
      ['Manet', '"The Luncheon on the Grass" is by Édouard Manet.'],
    ],
    why: '"Impression, soleil levant" (1872) gave the movement its name.',
  },
  'cul-faust': {
    topic: 'German classicism',
    intro: 'A scholar makes a pact with the devil: this drama is at the heart of German literature.',
    stem: 'Who wrote the drama "Faust"?',
    options: ['Friedrich Schiller', 'Johann Wolfgang von Goethe', 'Gotthold Ephraim Lessing', 'Bertolt Brecht'],
    f: [
      ["Life's work", 'Goethe worked on his "Faust" for more than 60 years.'],
      ['Robbers', 'Schiller wrote "The Robbers" and "William Tell".'],
      ['Nathan', 'Lessing wrote "Nathan the Wise".'],
    ],
    why: 'Goethe published Part One in 1808; Part Two only appeared after his death in 1832.',
  },
  'cul-grimm': {
    topic: 'Fairy tales & dictionaries',
    intro: 'The brothers did not only collect fairy tales; they dreamed of a great work about their own language.',
    stem: 'Which huge reference work did the Brothers Grimm start alongside their fairy tales?',
    options: ['The German Dictionary', 'The Brockhaus encyclopedia', 'The Duden', 'Meyers Konversations-Lexikon'],
    f: [
      ['Dictionary', 'In 1838 the Brothers Grimm began the "Deutsches Wörterbuch", a dictionary of German.'],
      ['Duration', 'It was only completed in 1961, more than a hundred years later.'],
      ['Duden', 'Konrad Duden published his spelling dictionary in 1880.'],
    ],
    why: "The Grimms' German Dictionary comprises 32 volumes.",
  },
  'cul-language': {
    topic: 'World languages',
    intro: 'There are thousands of languages, but some have far more speakers than others.',
    stem: 'Which language has the most native speakers worldwide?',
    options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'],
    f: [
      ['Mandarin', 'Mandarin has more than 900 million native speakers.'],
      ['English', 'English has about 380 million native speakers, but a great many second-language speakers.'],
      ['Spanish', 'Spanish has around 480 million native speakers.'],
      ['Diversity', 'Around 7,000 different languages are spoken on Earth.'],
    ],
    why: 'Mandarin leads in native speakers; English is the most widely learned second language.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'Mandarin has more than 900 million native speakers.' },
        {
          name: 'Speakers.png',
          kind: 'image',
          alt: 'Bar chart: native speakers of Mandarin, Spanish, English and Hindi in millions, rounded.',
          chart: {
            chart: 'bars',
            title: 'Native speakers (rounded)',
            unit: 'million',
            items: [
              { label: 'Mandarin', value: 940 },
              { label: 'Spanish', value: 485 },
              { label: 'English', value: 380 },
              { label: 'Hindi', value: 345 },
            ],
          },
        },
      ],
      2: [
        {
          name: 'English.txt',
          kind: 'article',
          source: SRC,
          text:
            'English is heard on every continent, in air traffic, in science and on the internet.\n\nPeople who learn English from early childhood have it as their native language: about 380 million people. On top of that come very many who learn it later as a second language.\n\nIn total more than a billion people speak it, but that says nothing about how many have it as their native language.',
        },
      ],
    },
  },

  // ───────────── History & society ─────────────
  'his-pyramid': {
    topic: 'Ancient Egypt',
    intro: 'More than 4,000 years ago the Egyptians built tombs that still stand today.',
    stem: 'For which pharaoh was the Great Pyramid of Giza built?',
    options: ['Tutankhamun', 'Khufu', 'Ramesses II', 'Akhenaten'],
    f: [
      ['Date', 'The Great Pyramid was built around 2560 BC.'],
      ['Name', 'Its builder was called Khufu in Egyptian, Cheops in Greek.'],
      ['Tomb', "Tutankhamun's tomb was discovered by Howard Carter in 1922."],
    ],
    why: 'Khufu (Cheops) had the largest of the three pyramids of Giza built.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'The Great Pyramid was built around 2560 BC.' },
        {
          name: 'Giza.txt',
          kind: 'article',
          source: SRC,
          text:
            'At Giza, on the edge of present-day Cairo, stand three great pyramids.\n\nThe largest was built as a tomb for a pharaoh of the 4th Dynasty. It was originally about 146 metres high and remained the tallest building in the world for thousands of years.\n\nThe stone blocks were moved into place with ramps and sledges.',
        },
      ],
    },
  },
  'his-rosetta': {
    topic: 'Hieroglyphs',
    intro: "For centuries nobody could read the pharaohs' script, until a find provided the key.",
    stem: 'Which find made it possible to decipher hieroglyphs?',
    options: ['The Rosetta Stone', 'The Ebers Papyrus', "Priam's Treasure", 'The Codex Sinaiticus'],
    f: [
      ['Trilingual', 'The stone bears the same text in hieroglyphs, Demotic and Ancient Greek.'],
      ['Discovery', 'It was found in 1799 near Rosetta in the Nile Delta.'],
      ['Decipherment', 'Jean-François Champollion made the breakthrough in 1822.'],
      ['Troy', 'Heinrich Schliemann excavated at Troy from 1870 onwards.'],
    ],
    why: 'The Greek text helped to understand the hieroglyphs. Champollion used it in 1822.',
  },
  'his-rome': {
    topic: 'End of antiquity',
    intro: 'A huge empire did not fall in a day, but one year is seen as the turning point.',
    stem: 'In which year is the Western Roman Empire considered to have fallen?',
    unit: 'AD',
    f: [
      ['Deposition', 'The general Odoacer deposed the last Western Roman emperor, Romulus Augustulus.'],
      ['Year', 'That happened in AD 476.'],
      ['Eastern Rome', 'The Eastern Roman Empire lasted until 1453.'],
      ['Division', 'The Roman Empire was finally split into East and West in 395.'],
    ],
    why: 'In 476 Odoacer deposed Romulus Augustulus; the Eastern Roman Empire lived on.',
  },
  'his-timeline': {
    topic: 'Chronology',
    intro: 'Understanding history means putting events in the right order.',
    stem: 'Put these events in chronological order (earliest → latest).',
    items: ['Building of the Great Pyramid', 'First Olympic Games', 'Death of Alexander the Great', 'Fall of Western Rome'],
    f: [
      ['Pyramid', 'Great Pyramid of Khufu: around 2560 BC.'],
      ['Olympia', 'First ancient Olympic Games: 776 BC.'],
      ['Alexander', 'Alexander the Great died in Babylon in 323 BC.'],
      ['Western Rome', 'End of the Western Roman Empire: AD 476.'],
      ['Wonder', 'The Great Pyramid is the only one of the Seven Wonders of the Ancient World still standing.'],
    ],
    why: '2560 BC → 776 BC → 323 BC → AD 476.',
  },
  'his-printing': {
    topic: 'Media revolution',
    intro: 'One invention made knowledge accessible to many and changed Europe profoundly.',
    stem: 'Who developed printing with movable type in Europe around 1450?',
    options: ['Johannes Gutenberg', 'Martin Luther', 'Albrecht Dürer', 'Leonardo da Vinci'],
    f: [
      ['Inventor', 'Johannes Gutenberg of Mainz cast letters in metal.'],
      ['Bible', 'The Gutenberg Bible was produced around 1452 to 1454.'],
      ['Consequences', 'Printing sped up the spread of the Reformation.'],
      ['Luther', 'Martin Luther translated the New Testament into German in 1522.'],
    ],
    why: "Gutenberg's printing with movable type made books available in large numbers for the first time.",
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'Johannes Gutenberg of Mainz cast letters in metal.' },
        {
          name: 'Before.txt',
          kind: 'article',
          source: SRC,
          text:
            'Before printing, books were copied by hand. That took months and was expensive, so only a few people owned books.\n\nAround 1450 a man from Mainz developed a method in which letters were cast one by one in metal and put together into pages.\n\nWith the printing press, many copies could be made of one page.',
        },
      ],
    },
  },
  'his-wall': {
    topic: 'Divided Germany',
    intro: 'For decades a wall divided a city, then events came thick and fast.',
    stem: 'In which year did the Berlin Wall fall?',
    unit: '',
    f: [
      ['Opening', 'On 9 November the border between East and West Berlin was opened.'],
      ['Construction', 'The wall had been built in 1961.'],
      ['Unity', 'Official reunification followed on 3 October 1990.'],
      ['Treaty', 'The Two Plus Four Agreement was concluded in 1990.'],
    ],
    why: 'The wall fell on 9 November 1989; unity followed a year later.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'On 9 November the border between East and West Berlin was opened.' },
        {
          name: 'Berlin.png',
          kind: 'image',
          alt: 'Timeline of Berlin: 1961 the wall is built, 1989 the border opens, 1990 reunification.',
          chart: {
            chart: 'timeline',
            title: 'Berlin and the Wall',
            events: [
              { label: 'Wall built', year: 1961 },
              { label: 'Border opened', year: 1989 },
              { label: 'Reunification', year: 1990 },
            ],
          },
        },
      ],
    },
  },
  'his-states': {
    topic: 'Federalism',
    intro: 'Germany is a federal country: its states have their own rights and governments.',
    stem: 'How many federal states (Länder) does Germany have?',
    options: ['12', '14', '16', '18'],
    f: [
      ['Territorial', 'There are 13 territorial states.'],
      ['City-states', 'In addition there are three city-states: Berlin, Hamburg and Bremen.'],
      ['Unity', 'Reunification added five new states.'],
    ],
    why: '13 territorial states plus three city-states make 16 federal states.',
  },
  'his-euro': {
    topic: 'European currency',
    intro: 'A common currency was meant to bring Europe closer together.',
    stem: 'In which year were euro notes and coins introduced?',
    unit: '',
    f: [
      ['Cash', 'Coins and notes went into circulation on 1 January.'],
      ['Year', 'That was the start of 2002.'],
      ['Non-cash', 'As non-cash money in accounts, the euro had existed since 1999.'],
      ['Maastricht', 'The Maastricht Treaty was signed in 1992.'],
    ],
    why: 'The euro was introduced as non-cash money in 1999; notes and coins followed in 2002.',
  },

  // ───────────── True or false ─────────────
  'tf-sound': {
    topic: 'Sound',
    intro: 'We hear music, voices and bangs: but what does sound actually need to reach us?',
    stem: 'True or false? Sound also travels through a vacuum.',
    f: [
      ['Medium', 'Sound needs matter such as air, water or solids to travel.'],
      ['Space', 'Space is almost empty, which is why you cannot hear a bang there.'],
      ['Waves', 'Sound is created when particles vibrate and push their neighbours.'],
      ['Moon', 'The Moon is about 384,000 km away from Earth.'],
    ],
    why: 'Sound is the vibration of matter. Without particles that can vibrate there is no sound, unlike light.',
  },
  'tf-spider': {
    topic: 'Arachnids',
    intro: 'Eight legs, webs and a bad reputation: which group of animals do spiders really belong to?',
    stem: 'True or false? Spiders are insects.',
    f: [
      ['Legs', 'Insects have six legs, spiders have eight.'],
      ['Body', 'Insects have three body sections, spiders only two.'],
      ['Web', 'Not all spiders build webs to catch prey.'],
    ],
    why: 'Spiders are arachnids: eight legs, two body sections and no antennae.',
  },
  'tf-piano': {
    topic: 'The piano',
    intro: 'The piano is considered the queen of instruments and has a fixed, well-known size.',
    stem: 'True or false? A standard piano has 88 keys.',
    f: [
      ['Keys', 'A piano has 52 white and 36 black keys.'],
      ['Range', 'The keys span just over seven octaves.'],
      ['Pedals', 'A grand piano usually has three pedals.'],
    ],
    why: '52 white plus 36 black keys make 88.',
  },
  'tf-olympia': {
    topic: 'Ancient Olympic Games',
    intro: 'The first Olympic Games were a religious festival for the gods of Greece.',
    stem: 'True or false? The Olympic Games of antiquity were held in Athens.',
    f: [
      ['Venue', 'The ancient games were held at Olympia in the Peloponnese.'],
      ['Time', 'They began in 776 BC and took place every four years.'],
      ['Athens', 'Athens was a powerful city and is considered the cradle of democracy.'],
    ],
    why: 'The games were named after the place: Olympia. Athens only hosted the first modern Games, in 1896.',
  },
  'tf-salt': {
    topic: 'Table salt',
    intro: 'Salt is in the sea, on the table and in every body. What is it made of chemically?',
    stem: 'True or false? Table salt is made of sodium and chlorine.',
    f: [
      ['Formula', 'Table salt has the chemical formula NaCl: sodium and chlorine.'],
      ['Ions', 'In a salt crystal, sodium and chloride ions are arranged in a lattice.'],
      ['Sea', 'Seawater contains about 3.5 per cent salt on average.'],
    ],
    why: 'NaCl: Na stands for sodium, Cl for chlorine. Together they form the salt we use every day.',
  },
  'tf-nile': {
    topic: 'The Nile',
    intro: "The Nile is Egypt's lifeline and flows through many countries of Africa.",
    stem: 'True or false? The Nile flows into the Mediterranean Sea.',
    f: [
      ['Mouth', 'The Nile flows north and enters the Mediterranean through a delta.'],
      ['Length', 'At around 6,600 kilometres it is one of the longest rivers on Earth.'],
      ['Sphinx', 'The Sphinx of Giza stands at the edge of the desert near Cairo.'],
    ],
    why: 'The Nile flows north through East Africa and ends in the Nile Delta on the Mediterranean.',
  },

  // ───────────── Matching ─────────────
  'mt-units': {
    topic: 'Physical units',
    intro: 'Measuring means comparing: every quantity has its own unit, you just have to match them correctly.',
    stem: 'Match each unit with the quantity it measures.',
    pairs: [
      ['Metre', 'Length'],
      ['Second', 'Time'],
      ['Kilogram', 'Mass'],
      ['Ampere', 'Electric current'],
    ],
    f: [
      ['Length, time', 'The metre measures length, the second measures time.'],
      ['Mass, current', 'The kilogram is the unit of mass, the ampere that of electric current.'],
      ['Newton', 'The newton is the unit of force.'],
    ],
    why: 'Metre (length), second (time), kilogram (mass) and ampere (electric current) are four base units.',
  },
  'mt-classes': {
    topic: 'Animal classes',
    intro: 'From the sea to the sky: animals can be sorted into classes by body plan and way of life.',
    stem: 'Match each animal with its class.',
    pairs: [
      ['Dolphin', 'Mammal'],
      ['Frog', 'Amphibian'],
      ['Eagle', 'Bird'],
      ['Shark', 'Fish'],
    ],
    f: [
      ['Dolphin', 'Dolphins breathe air and suckle their young: mammals.'],
      ['Frog', 'Frogs lay spawn in water and later live on land: amphibians.'],
      ['Shark', 'Sharks breathe through gills: fish.'],
      ['Whale', 'The blue whale is the largest animal on Earth.'],
    ],
    why: 'Despite its shape the dolphin is a mammal; the shark is a fish, the frog an amphibian and the eagle a bird.',
  },
  'mt-instruments': {
    topic: 'Instrument families',
    intro: 'Orchestras are arranged by instrument families. Which belongs where?',
    stem: 'Match each instrument with its family.',
    pairs: [
      ['Violin', 'Strings'],
      ['Trumpet', 'Brass'],
      ['Flute', 'Woodwind'],
      ['Timpani', 'Percussion'],
    ],
    f: [
      ['Bowed', 'String instruments are played with a bow, such as the violin and cello.'],
      ['Wind', 'Trumpet and trombone are brass, flute and clarinet are woodwind.'],
      ['Drums', 'Timpani and drums belong to the percussion section.'],
      ['Organ', 'The organ is considered the largest musical instrument.'],
    ],
    why: 'The flute counts as a woodwind instrument even though it is often made of metal today, because its sound is made at an edge.',
  },
  'mt-gods': {
    topic: 'Greek gods',
    intro: 'Each of the Greek gods had a realm of their own to watch over.',
    stem: 'Match each Greek god with their realm.',
    pairs: [
      ['Zeus', 'King of the gods'],
      ['Poseidon', 'Sea'],
      ['Athena', 'Wisdom'],
      ['Ares', 'War'],
    ],
    f: [
      ['Zeus, Poseidon', 'Zeus ruled as king of the gods, Poseidon over the sea.'],
      ['Athena, Ares', 'Athena was the goddess of wisdom, Ares the god of war.'],
      ['Olympus', 'Mount Olympus is the highest mountain in Greece.'],
    ],
    why: 'Zeus (king of the gods), Poseidon (sea), Athena (wisdom) and Ares (war) were gods of Olympus.',
  },
  'mt-capitals': {
    topic: 'Capitals',
    intro: 'Every country has a capital where its government and politics are based.',
    stem: 'Match each country with its capital.',
    pairs: [
      ['France', 'Paris'],
      ['Italy', 'Rome'],
      ['Spain', 'Madrid'],
      ['Poland', 'Warsaw'],
    ],
    f: [
      ['Western Europe', 'Paris is the capital of France, Madrid that of Spain.'],
      ['South and east', 'Rome is the capital of Italy, Warsaw that of Poland.'],
      ['Berlin', 'Berlin is the capital of Germany.'],
    ],
    why: 'Paris, Rome, Madrid and Warsaw are the capitals of France, Italy, Spain and Poland.',
  },
  'mt-words': {
    topic: 'Recognising languages',
    intro: 'A single word often reveals which language is being spoken. Do you know these words of thanks?',
    stem: 'Match each word with the language it comes from.',
    pairs: [
      ['Merci', 'French'],
      ['Gracias', 'Spanish'],
      ['Danke', 'German'],
      ['Grazie', 'Italian'],
    ],
    f: [
      ['Thanks', 'All four words mean "thank you".'],
      ['Romance', 'French, Spanish and Italian are Romance languages.'],
      ['Latin', 'The Romance languages developed from Latin.'],
    ],
    why: 'Merci is French, Gracias Spanish, Grazie Italian and Danke German.',
  },

  // ───────────── Gap text ─────────────
  'cl-lightsound': {
    topic: 'Light and sound',
    intro: 'Light is fast, sound is slow: that is why you notice the lightning first and the thunder later.',
    stem: 'Fill in the numbers.',
    text: 'In one second light travels about {0} kilometres, sound in air only about {1} metres.',
    answers: ['300,000', '340'],
    bank: ['300,000', '340', '30,000', '3,400'],
    f: [
      ['Light', 'At around 300,000 kilometres per second, light is the fastest thing there is.'],
      ['Sound', 'Sound in air manages about 340 metres per second.'],
      ['Thunderstorm', 'In a thunderstorm you see the lightning first.'],
    ],
    why: 'Light: about 300,000 km/s. Sound in air: about 340 m/s, which is why thunder follows lightning.',
  },
  'cl-photo': {
    topic: 'Gas exchange in plants',
    intro: 'Plants breathe differently from us: they exchange gases with the air and use them to make food.',
    stem: 'Fill in the missing words.',
    text: 'During photosynthesis, plants take in {0} and give off {1}.',
    answers: ['carbon dioxide', 'oxygen'],
    bank: ['carbon dioxide', 'oxygen', 'nitrogen', 'hydrogen'],
    f: [
      ['Intake', 'Plants take in carbon dioxide from the air.'],
      ['Output', 'Oxygen is produced as a by-product and released.'],
      ['Air', 'About 78 per cent of air is nitrogen.'],
    ],
    why: 'Plants take in carbon dioxide, use light to build sugar from it and give off oxygen.',
  },
  'cl-music': {
    topic: 'Counting music',
    intro: 'Music lives on numbers: from the number of notes to the size of an ensemble.',
    stem: 'Fill in the numbers as words.',
    text: 'A triad consists of {0} notes, a string quartet of {1} players.',
    answers: ['three', 'four'],
    bank: ['three', 'four', 'five', 'two'],
    f: [
      ['Triad', 'A triad is made up of three notes.'],
      ['Quartet', 'Quartet means four: two violins, viola and cello.'],
      ['Octave', 'An octave spans eight steps of the scale.'],
    ],
    why: 'Three notes make a triad, four players a string quartet.',
  },
  'cl-rome': {
    topic: 'Roman engineering',
    intro: 'The Romans were brilliant engineers and spread their language across Europe.',
    stem: 'Fill in the missing words.',
    text: 'The Romans carried water into their cities over {0}, and their language was {1}.',
    answers: ['aqueducts', 'Latin'],
    bank: ['aqueducts', 'Latin', 'pyramids', 'Greek'],
    f: [
      ['Water', 'Aqueducts are bridges that carried water into the cities.'],
      ['Language', 'Latin was the language of the Romans and spread widely across the empire.'],
      ['Egypt', 'The Egyptians built pyramids as tombs.'],
    ],
    why: 'The Romans built aqueducts for water and spoke Latin.',
  },
  'cl-price': {
    topic: 'Supply and demand',
    intro: 'Markets follow a simple rule: when something is more in demand, its price changes.',
    stem: 'Fill in the right word.',
    text: 'If demand increases while supply is unchanged, the price {0}.',
    answers: ['rises'],
    bank: ['rises', 'falls', 'stays the same'],
    f: [
      ['Demand', 'If more people want a good and there is no more of it, its price rises.'],
      ['Supply', 'If a good is offered more often, its price tends to fall.'],
      ['Gold', 'Gold has long been considered a store of value.'],
    ],
    why: 'More demand with the same supply makes a good scarcer, and the price rises.',
  },

  // ───────────── Society, politics & economy ─────────────
  'soc-eu': {
    topic: 'European Union',
    intro: 'Six founding countries have grown into a community that covers almost an entire continent.',
    stem: 'How many member states has the European Union had since the United Kingdom left?',
    options: ['25', '27', '28', '30'],
    f: [
      ['Enlargement', "With Croatia's accession in 2013 the EU grew to 28 member states."],
      ['Exit', 'The United Kingdom left the EU at the end of January 2020, so far the only country to do so.'],
      ['Founding', "In 1957 six countries signed the Treaties of Rome, the foundation of today's EU."],
      ['Council of Europe', 'The Council of Europe is not an EU institution and has 46 member states.'],
      ['Currency', 'Not all EU countries use the euro; Denmark, for example, keeps its krone.'],
    ],
    why: 'With Croatia there were exactly 28 states in 2013. Since the United Kingdom left in 2020 there have been 27.',
  },
  'soc-un': {
    topic: 'United Nations',
    intro: 'After the Second World War, countries joined forces to secure peace.',
    stem: 'Every member of the UN Security Council has a veto.',
    f: [
      ['Permanent', 'The Security Council has five permanent members: China, France, Russia, the United Kingdom and the USA.'],
      ['Elected', 'Ten further members are elected for two years each and cannot cast a veto.'],
      ['Founding', 'The United Nations was founded in 1945 after the Second World War.'],
      ['Headquarters', 'The headquarters of the United Nations is in New York.'],
      ['Members', 'Today 193 states belong to the United Nations.'],
    ],
    why: 'Only the five permanent members have a veto. The ten elected members do not.',
  },
  'soc-powers': {
    topic: 'Separation of powers',
    intro: 'In a democracy, power is shared among several bodies so that no one has too much of it.',
    stem: "Match each of Germany's constitutional bodies with the power it exercises.",
    pairs: [
      ['Bundestag (parliament)', 'Legislative'],
      ['Federal Government', 'Executive'],
      ['Federal Constitutional Court', 'Judiciary'],
    ],
    f: [
      ['Parliament', 'Parliament passes the laws; at federal level that is the Bundestag.'],
      ['Government', 'The government, led by the chancellor, implements the laws and runs the administration.'],
      ['Karlsruhe', "In Karlsruhe, Germany's highest court checks whether laws are compatible with the Basic Law."],
      ['Montesquieu', 'Montesquieu described three powers: the legislative, the executive and the judicial.'],
      ['Voting age', 'In Bundestag elections you can vote from the age of 18.'],
    ],
    why: 'The Bundestag passes laws (legislative), the Federal Government carries them out (executive) and the Federal Constitutional Court administers justice (judiciary).',
  },
  'soc-basic': {
    topic: 'Fundamental rights',
    intro: 'Before the Basic Law sets out the state and its authorities, it puts one principle first.',
    stem: "With which sentence does Article 1 of Germany's Basic Law begin?",
    options: [
      'Human dignity shall be inviolable.',
      'All persons shall be equal before the law.',
      'Arts and sciences shall be free.',
      'All Germans shall have the right to assemble.',
    ],
    f: [
      ['Article 1', 'Article 1 names the value the state must respect and protect: the dignity of every human being.'],
      ['Equality', 'The sentence "All persons shall be equal before the law" is in Article 3.'],
      ['Entry into force', 'The Basic Law came into force on 23 May 1949.'],
      ['President', 'The Federal President is elected for five years.'],
    ],
    why: 'Article 1 begins with "Human dignity shall be inviolable." Equality before the law is in Article 3, freedom of the arts in Article 5, freedom of assembly in Article 8.',
  },
  'soc-majority': {
    topic: 'Age of majority',
    intro: 'On one particular birthday, many rights and duties change all at once.',
    stem: 'At what age do you come of age in Germany?',
    unit: 'years',
    f: [
      ['Right to vote', 'Since 1975, people in Germany come of age at the age from which they may vote for the Bundestag.'],
      ['Federal election', 'You may vote in Bundestag elections if you have turned 18 by election day.'],
      ['Earlier', 'Before 1975 you only came of age in Germany at 21.'],
      ['Criminal law', 'In Germany you are criminally responsible from the age of 14.'],
      ['Driving', 'Accompanied driving is possible from the age of 17.'],
    ],
    why: 'Since 1975 you come of age in Germany at 18; before that, only at 21.',
  },
  'soc-court': {
    topic: 'Constitutional court',
    intro: 'A court makes sure that parliament and government also abide by the constitution.',
    stem: "Germany's Federal Constitutional Court has its seat in Berlin.",
    f: [
      ['Seat of court', 'The Federal Constitutional Court and the Federal Court of Justice have their seat in Karlsruhe.'],
      ['Beginnings', 'The Federal Constitutional Court began its work in 1951.'],
      ['Reichstag', 'Since 1999 the Bundestag has met in the Reichstag building in Berlin.'],
      ['Term of office', 'The judges of the Federal Constitutional Court are elected for twelve years.'],
    ],
    why: 'The Federal Constitutional Court sits in Karlsruhe. The Bundestag and the Federal Government work in Berlin.',
  },
  'soc-inflation': {
    topic: 'Inflation',
    intro: 'When prices rise, what your money is really worth changes.',
    stem: 'With inflation, the same amount of money buys more goods than before.',
    f: [
      ['Purchasing power', 'If the general price level rises, the purchasing power of money falls.'],
      ['Target', 'In the medium term, the European Central Bank aims for an inflation rate of 2 per cent.'],
      ['Deflation', 'If prices fall over a longer period, this is called deflation.'],
      ['Coins', 'Euro coins have a common European side and a national side.'],
    ],
    why: 'With inflation prices rise. So the same amount buys less, not more.',
  },

  // ───────────── Humanities: philosophy & religion ─────────────
  'hum-socrates': {
    topic: 'Ancient philosophy',
    intro: 'In ancient Athens, thinkers argued in the open street about justice, knowledge and the good life.',
    stem: 'Which Greek philosopher left no writings of his own and is known mainly through his pupil Plato?',
    options: ['Aristotle', 'Socrates', 'Epicurus', 'Pythagoras'],
    f: [
      ['Marketplace', 'Socrates held discussions in the marketplace of Athens and never wrote a book himself.'],
      ['Dialogues', 'Plato wrote dialogues in which his teacher asks questions as the main character.'],
      ['Academy', 'Plato founded the Academy in Athens, one of the first schools of philosophy.'],
      ['Alexander', 'Aristotle was a pupil of Plato and the teacher of Alexander the Great.'],
    ],
    why: 'Socrates wrote nothing down. What we know about him comes mainly from the dialogues of Plato.',
  },
  'hum-religions': {
    topic: 'World religions',
    intro: 'Many religions rest on holy scriptures that have been handed down over centuries.',
    stem: 'Match each religion with its central holy scripture.',
    pairs: [
      ['Christianity', 'Bible'],
      ['Islam', 'Quran'],
      ['Judaism', 'Torah'],
      ['Hinduism', 'Vedas'],
    ],
    f: [
      ['Revelation', 'According to Muslim belief, the Quran was revealed to the Prophet Muhammad.'],
      ['Five books', 'The Torah comprises the five books of Moses and is the foundation of Judaism.'],
      ['Sanskrit', 'The Vedas are among the oldest holy scriptures of Hinduism and are written in Sanskrit.'],
      ['Testaments', 'The Christian Bible consists of the Old and the New Testament.'],
      ['Buddha', 'Siddhartha Gautama, the Buddha, probably lived in India in the 5th century BC.'],
    ],
    why: 'Bible (Christianity), Quran (Islam), Torah (Judaism) and Vedas (Hinduism) are the central scriptures of these religions.',
  },

  // ───────────── Geography & Earth: astronomy & climate ─────────────
  'ear-planets': {
    topic: 'Solar system',
    intro: 'Eight planets orbit the Sun, each at its own distance.',
    stem: 'Order the planets by their distance from the Sun, nearest first.',
    items: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter'],
    f: [
      ['Inner', 'Mercury orbits closest to the Sun, followed by Venus.'],
      ['Red planet', 'Mars is the outer neighbour of Earth.'],
      ['Giant', 'Jupiter is the largest planet and orbits beyond the asteroid belt.'],
      ['Number', 'Since 2006, the solar system has been counted as having eight planets.'],
      ['Moon', "Earth's Moon is the fifth-largest moon in the solar system."],
    ],
    why: 'From the inside out: Mercury, Venus, Earth, Mars and then, beyond the asteroid belt, Jupiter.',
  },
  'ear-universe': {
    topic: 'Age of the universe',
    intro: 'Everything began with a tremendous event. Today we can say fairly precisely when.',
    stem: 'Roughly how old is the universe according to current measurements (in billions of years)?',
    unit: 'billion years',
    f: [
      ['Big Bang', 'Measurements of the cosmic background radiation date the Big Bang to about 13.8 billion years ago.'],
      ['Age of Earth', 'The Earth is about 4.5 billion years old.'],
      ['Light-year', 'A light-year is the distance light travels in one year.'],
      ['Sun', 'The Sun is expected to shine for about another five billion years.'],
    ],
    why: 'According to current measurements, the Big Bang was about 13.8 billion years ago, roughly three times as long as the Earth has existed.',
  },
  'ear-zones': {
    topic: 'Climate zones',
    intro: 'Depending on how far a place lies from the equator, its climate is completely different.',
    stem: 'Which climate zone is Germany in?',
    options: ['Tropics', 'Subtropics', 'Temperate zone', 'Polar zone'],
    f: [
      ['Seasons', 'Typical of Germany are four distinct seasons with mild summers and cool winters.'],
      ['Latitude', 'Germany lies roughly between 47 and 55 degrees north.'],
      ['Classification', 'Roughly, the Earth is divided into tropical, subtropical, temperate and polar zones.'],
      ['Sahara', 'The Sahara is the largest hot desert on Earth.'],
    ],
    why: 'Germany lies in the temperate zone: there are four seasons, and it is neither tropically hot nor polar cold.',
  },
};
