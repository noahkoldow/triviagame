import type { QuestionText } from '../localize';

/** The built-in questions in French (source: `content.ts`). */
const SRC = 'Archives Nexus';

export const CONTENT_FR: Record<string, QuestionText> = {
  // ───────────── Sciences et technique ─────────────
  'sci-light': {
    topic: 'Vitesse de la lumière',
    intro: 'Rien dans l’Univers n’est plus rapide que la lumière, mais elle aussi a besoin de temps pour parcourir une distance.',
    stem: 'Quelle distance la lumière parcourt-elle environ en une seconde dans le vide ?',
    options: ['3 000 km', '30 000 km', '300 000 km', '3 millions de km'],
    f: [
      ['Distance', 'Le Soleil se trouve à environ 150 millions de km de la Terre.'],
      ['Durée', 'La lumière du Soleil met environ 8 minutes, soit près de 500 secondes, pour atteindre la Terre.'],
      ['Lune', 'La Lune est en moyenne à environ 384 000 km ; sa lumière met un peu plus d’une seconde.'],
      ['Son', 'Dans l’air, le son parcourt environ 343 mètres par seconde.'],
      ['Année-lumière', 'Une année-lumière mesure une durée d’exactement 365 jours.'],
    ],
    why: '150 millions de km en ~500 s donnent environ 300 000 km/s. (Une année-lumière est d’ailleurs une distance, pas une durée.)',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'Le Soleil se trouve à environ 150 millions de km de la Terre.' },
        {
          name: 'Planètes.png',
          kind: 'image',
          alt: 'Diagramme en barres : distance de Mercure, Vénus, la Terre et Mars au Soleil, en millions de kilomètres.',
          chart: {
            chart: 'bars',
            title: 'Distance au Soleil',
            unit: 'millions de km',
            items: [
              { label: 'Mercure', value: 58 },
              { label: 'Vénus', value: 108 },
              { label: 'Terre', value: 150 },
              { label: 'Mars', value: 228 },
            ],
          },
        },
        { name: 'Clair de lune.txt', kind: 'note', text: 'La Lune ne brille pas par elle-même. Elle renvoie la lumière du Soleil.' },
      ],
      2: [
        {
          name: 'Lumière solaire.txt',
          kind: 'article',
          source: SRC,
          text:
            'Quand tu regardes le Soleil, tu le vois tel qu’il était il y a quelques minutes.\n\nSa lumière doit d’abord nous parvenir. Il lui faut environ 8 minutes, soit près de 500 secondes.\n\nLa vitesse de la lumière se calcule à partir de la distance et du temps : la distance divisée par le temps.\n\nLa lumière de la Lune, elle, ne voyage qu’un peu plus d’une seconde.',
        },
      ],
      4: [
        { name: 'Note.txt', kind: 'note', text: 'Dans l’air, le son parcourt environ 343 mètres par seconde.' },
        {
          name: 'Son.png',
          kind: 'image',
          alt: 'Tableau : vitesse du son dans l’air, l’eau et l’acier.',
          chart: {
            chart: 'table',
            title: 'Vitesse du son',
            columns: ['Milieu', 'm/s'],
            rows: [['Air', '343'], ['Eau', '1 480'], ['Acier', '5 900']],
          },
        },
      ],
    },
  },
  'sci-relativity': {
    topic: 'Théorie de la relativité',
    intro: 'Au début du XXe siècle, Einstein a bouleversé notre idée de l’espace et du temps.',
    stem: 'Selon la relativité restreinte d’Einstein, qu’est-ce qui est identique pour tous les observateurs ?',
    options: [
      'Le temps entre deux événements',
      'La longueur d’une tige',
      'La vitesse de la lumière dans le vide',
      'La vitesse d’un train',
    ],
    f: [
      ['Horloges', 'Les horloges en mouvement ralentissent pour un observateur au repos.'],
      ['Tiges', 'Les tiges en mouvement paraissent raccourcies dans le sens du mouvement.'],
      ['Année', 'Einstein a publié la relativité restreinte en 1905.'],
      ['Formule', 'E = mc² décrit l’énergie contenue dans un gramme d’eau quand on le chauffe.'],
    ],
    why: 'Le temps et les longueurs sont relatifs, pas la vitesse de la lumière dans le vide : elle est la même pour tout observateur.',
  },
  'sci-gravwaves': {
    topic: 'Ondes gravitationnelles',
    intro: 'Des événements violents dans l’espace font vibrer l’espace lui-même. Depuis peu, on sait le mesurer.',
    stem: 'En quelle année le premier signal d’ondes gravitationnelles détecté directement est-il arrivé à LIGO ?',
    unit: '',
    f: [
      ['Signal', 'Le signal de deux trous noirs en fusion est arrivé en septembre 2015.'],
      ['Annonce', 'La détection n’a été annoncée qu’en février 2016.'],
      ['Prédiction', 'Einstein avait prédit les ondes gravitationnelles en 1916.'],
      ['Prix Nobel', 'Le prix Nobel de physique 2017 a récompensé Weiss, Barish et Thorne pour cette découverte.'],
      ['Higgs', 'Le boson de Higgs a été détecté au CERN en 2012.'],
    ],
    why: 'Le signal est arrivé le 14 septembre 2015 ; l’annonce a suivi en 2016.',
  },
  'sci-water': {
    topic: 'L’eau et ses molécules',
    intro: 'L’eau est partout, et pourtant sa structure est une petite leçon de chimie.',
    stem: 'De quoi se compose une molécule d’eau ?',
    options: [
      '2 atomes d’hydrogène et 1 atome d’oxygène',
      '1 atome d’hydrogène et 2 atomes d’oxygène',
      '2 atomes d’hydrogène et 2 atomes d’oxygène',
      '3 atomes d’hydrogène',
    ],
    f: [
      ['Formule', 'La formule est H₂O : le 2 en indice se rapporte à l’hydrogène.'],
      ['Ébullition', 'Au niveau de la mer, l’eau bout à 100 °C.'],
      ['CO₂', 'Le dioxyde de carbone se compose d’un atome de carbone et de deux atomes d’oxygène.'],
      ['H₂O₂', 'L’eau oxygénée (H₂O₂) sert à blanchir.'],
    ],
    why: 'H₂O : deux atomes d’hydrogène (H) et un atome d’oxygène (O).',
  },
  'sci-ph': {
    topic: 'Acides et bases',
    intro: 'Jus de citron, savon, acide gastrique : une échelle mesure à quel point une chose est acide ou basique.',
    stem: 'Que peut-on dire d’une solution de pH 3 ?',
    options: ['Elle est acide', 'Elle est neutre', 'Elle est basique', 'Elle n’est pas mesurable'],
    f: [
      ['Échelle', 'Un pH de 7 est neutre, en dessous c’est acide, au-dessus basique.'],
      ['Citron', 'Le jus de citron a un pH d’environ 2.'],
      ['Savon', 'L’eau savonneuse a un pH d’environ 10.'],
      ['Mesure', 'Le pH s’exprime en grammes par litre.'],
    ],
    why: 'Tout ce qui est en dessous de pH 7 est acide. L’échelle va généralement de 0 à 14.',
  },
  'sci-binary': {
    topic: 'Systèmes de numération',
    intro: 'Les ordinateurs ne calculent qu’avec deux chiffres. On peut pourtant en construire n’importe quel nombre.',
    stem: 'Quel nombre décimal correspond au nombre binaire 1011 ?',
    options: ['9', '11', '13', '15'],
    f: [
      ['Positions', 'En binaire, les valeurs des positions sont, depuis la droite, 1, 2, 4, 8, 16, …'],
      ['Octet', 'Un octet se compose de 8 bits.'],
      ['Hexa', 'L’hexadécimal utilise 16 chiffres : 0–9 et A–F.'],
    ],
    why: '1·8 + 0·4 + 1·2 + 1·1 = 11.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'En binaire, les valeurs des positions sont, depuis la droite, 1, 2, 4, 8, 16, …' },
        {
          name: 'Positions.png',
          kind: 'image',
          alt: 'Tableau : les quatre valeurs de position d’un nombre binaire, de gauche à droite : 8, 4, 2, 1.',
          chart: {
            chart: 'table',
            title: 'Valeurs de position (4 bits)',
            columns: ['Position', '4e', '3e', '2e', '1re'],
            rows: [['Valeur', '8', '4', '2', '1']],
          },
        },
      ],
    },
  },
  'sci-algo': {
    topic: 'Algorithmes de recherche',
    intro: 'Qui cherche intelligemment n’a pas besoin de tout parcourir. De bonnes méthodes font gagner énormément de temps.',
    stem: 'Combien d’étapes une recherche dichotomique nécessite-t-elle au maximum parmi 1 000 entrées triées ?',
    unit: 'étapes',
    f: [
      ['Moitié', 'La recherche dichotomique divise la zone de recherche par deux à chaque étape.'],
      ['Puissance de 2', '2¹⁰ vaut 1 024, soit plus que 1 000.'],
      ['Linéaire', 'Dans le pire des cas, une recherche linéaire vérifie toutes les entrées.'],
      ['Quicksort', 'En moyenne, le tri rapide trie en n·log n étapes.'],
    ],
    why: 'Après 10 divisions par deux, il reste une entrée : 2¹⁰ = 1 024 ≥ 1 000.',
  },
  'sci-vaccine': {
    topic: 'Histoire de la vaccination',
    intro: 'Bien avant qu’on connaisse les virus, un médecin de campagne trouva un moyen de prévenir les maladies.',
    stem: 'Qui mit au point la première vaccination en 1796, contre la variole ?',
    options: ['Louis Pasteur', 'Edward Jenner', 'Robert Koch', 'Alexander Fleming'],
    f: [
      ['Observation', 'Le médecin de campagne anglais Edward Jenner remarqua que les vachères attrapaient rarement la variole.'],
      ['Vaccine', 'En 1796, il inocula à un garçon de la matière de vaccine, la variole des vaches ; elle le protégea ensuite de la variole.'],
      ['Mot', 'Le mot « vaccin » vient du latin vacca, la vache.'],
      ['Rage', 'Louis Pasteur mit au point un vaccin contre la rage en 1885.'],
    ],
    why: 'Jenner fonda la vaccination. Pasteur la développa plus tard pour d’autres maladies.',
    files: {
      1: [
        {
          name: 'Jenner.txt',
          kind: 'article',
          source: SRC,
          text:
            'Au XVIIIe siècle, la variole tuait beaucoup de gens. En Angleterre, un médecin de campagne remarqua une chose : les vachères qui avaient attrapé la vaccine, une maladie bénigne des vaches, tombaient rarement malades de la dangereuse variole humaine.\n\nCe médecin s’appelait Edward Jenner. En 1796, il plaça de la matière tirée d’une pustule de vaccine dans de petites entailles sur le bras d’un garçon de huit ans.\n\nPlus tard, le garçon resta en bonne santé face à la variole. Le mot vaccin vient du mot latin pour vache, vacca.',
        },
      ],
    },
  },
  'sci-penicillin': {
    topic: 'Antibiotiques',
    intro: 'Parfois, de grandes choses naissent du hasard et d’une paillasse mal rangée.',
    stem: 'Qu’a découvert Alexander Fleming dans son laboratoire en 1928 ?',
    options: ['La pénicilline', 'L’insuline', 'Les rayons X', 'Les groupes sanguins'],
    f: [
      ['Moisissure', 'Une moisissure poussa sur une culture de bactéries, et les bactéries autour d’elle moururent.'],
      ['Champignon', 'Le champignon appartenait au genre Penicillium.'],
      ['Prix Nobel', 'En 1945, Fleming reçut le prix Nobel de médecine avec Florey et Chain.'],
      ['Röntgen', 'Wilhelm Conrad Röntgen découvrit les rayons X en 1895.'],
    ],
    why: 'Fleming découvrit le premier antibiotique. Il ne devint utilisable que plus tard, grâce à Florey et Chain.',
    files: {
      1: [
        {
          name: 'Découverte.txt',
          kind: 'article',
          source: SRC,
          text:
            'En 1928, le médecin Alexander Fleming rangeait son laboratoire à Londres. Il trouva une boîte de bactéries oubliée sur laquelle une moisissure avait poussé.\n\nAutour de la moisissure, les bactéries étaient mortes. Fleming en conclut que la moisissure produit une substance qui tue les bactéries.\n\nCe n’est que dans les années 1940 que Howard Florey et Ernst Chain parvinrent à produire le médicament en grande quantité.',
        },
      ],
    },
  },

  // ───────────── Nature et monde ─────────────
  'nat-photosynthesis': {
    topic: 'Photosynthèse',
    intro: 'Les plantes sont de petites usines : elles fabriquent leur propre nourriture à partir de lumière et d’air.',
    stem: 'Quel gaz les plantes absorbent-elles pendant la photosynthèse ?',
    options: ['Le dioxyde de carbone', 'L’oxygène', 'L’azote', 'L’hydrogène'],
    f: [
      ['Sucre', 'Les plantes fabriquent du sucre à partir de dioxyde de carbone et d’eau, en rejetant de l’oxygène.'],
      ['Chlorophylle', 'La chlorophylle, le pigment vert des feuilles, capte la lumière.'],
      ['Respiration', 'Les animaux et les humains inspirent de l’oxygène.'],
      ['Air', 'L’air est composé à environ 78 % d’azote.'],
    ],
    why: 'Photosynthèse : dioxyde de carbone + eau + lumière → sucre + oxygène.',
    files: {
      1: [
        {
          name: 'Photosynthèse.txt',
          kind: 'article',
          source: SRC,
          text:
            'Les plantes se nourrissent elles-mêmes.\n\nLes feuilles vertes contiennent un pigment, la chlorophylle. Elle capte la lumière du soleil et fournit l’énergie.\n\nLes plantes absorbent le dioxyde de carbone de l’air et l’eau du sol. Avec cela, elles fabriquent du sucre, leur matériau de construction et leur carburant.\n\nL’oxygène est un sous-produit que la plante rejette dans l’air.',
        },
        { name: 'Respiration.txt', kind: 'note', text: 'Les animaux et les humains inspirent de l’oxygène et expirent du dioxyde de carbone.' },
      ],
    },
  },
  'nat-chloroplast': {
    topic: 'La cellule végétale',
    intro: 'Dans les cellules des plantes se cache une minuscule centrale solaire.',
    stem: 'Dans quels organites cellulaires la photosynthèse a-t-elle lieu ?',
    options: ['Les mitochondries', 'Les chloroplastes', 'Les ribosomes', 'Le noyau'],
    f: [
      ['Chlorophylle', 'Les chloroplastes contiennent la chlorophylle et se trouvent dans les cellules végétales.'],
      ['Centrale', 'Les mitochondries sont les « centrales énergétiques » de la cellule et produisent de l’énergie par la respiration cellulaire.'],
      ['Ribosomes', 'Les ribosomes assemblent les protéines.'],
      ['Noyau', 'Le noyau porte l’information génétique sous forme de chromosomes.'],
    ],
    why: 'Les chloroplastes sont le siège de la photosynthèse ; les mitochondries assurent la respiration cellulaire.',
  },
  'nat-everest': {
    topic: 'Les plus hauts sommets',
    intro: 'La plus haute montagne de la Terre est mesurée encore et encore depuis des décennies.',
    stem: 'Quelle est la hauteur approximative du mont Everest (en mètres) ?',
    unit: 'm',
    f: [
      ['Mesure', 'Une mesure commune du Népal et de la Chine a donné en 2020 une hauteur de 8 849 mètres.'],
      ['Situation', 'L’Everest se trouve dans l’Himalaya, à la frontière entre le Népal et la Chine.'],
      ['K2', 'Avec 8 611 m, le K2 est la deuxième plus haute montagne de la Terre.'],
      ['Zugspitze', 'Avec 2 962 m, la Zugspitze est la plus haute montagne d’Allemagne.'],
    ],
    why: 'Avec 8 849 m, l’Everest est la plus haute montagne au-dessus du niveau de la mer.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'Une mesure commune du Népal et de la Chine a donné en 2020 une hauteur de 8 849 mètres.' },
        {
          name: 'Sommets.png',
          kind: 'image',
          alt: 'Diagramme en barres : hauteur des quatre plus hautes montagnes de la Terre en mètres. Everest, K2, Kangchenjunga, Lhotse.',
          chart: {
            chart: 'bars',
            title: 'Les plus hautes montagnes',
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
    topic: 'Formation des montagnes',
    intro: 'Les montagnes n’apparaissent pas du jour au lendemain, mais sous l’effet de forces qui déplacent lentement les continents.',
    stem: 'Comment l’Himalaya s’est-il formé ?',
    options: [
      'Par des volcans au fond de la mer',
      'Par la collision des plaques indienne et eurasienne',
      'Par une période glaciaire',
      'Par l’impact d’une météorite',
    ],
    f: [
      ['Dérive', 'La plaque indienne se déplace vers le nord depuis des millions d’années.'],
      ['Collision', 'Elle heurte la plaque eurasienne et plisse la roche en montagnes.'],
      ['Croissance', 'L’Himalaya grandit encore de quelques millimètres par an.'],
      ['Alpes', 'Les Alpes sont nées de la collision de la plaque africaine avec la plaque eurasienne.'],
    ],
    why: 'Deux plaques continentales entrent en collision – aucune ne plonge sous l’autre, la roche s’empile.',
  },
  'nat-rainforest': {
    topic: 'Grands fleuves',
    intro: 'Certains fleuves sont si puissants qu’ils colorent la mer loin au large.',
    stem: 'Quel fleuve a le plus grand débit d’eau du monde ?',
    options: ['Le Nil', 'L’Amazone', 'Le Yangzi Jiang', 'Le Mississippi'],
    f: [
      ['Débit', 'L’Amazone apporte à la mer environ un cinquième de toute l’eau des fleuves de la Terre.'],
      ['Longueur', 'Le Nil et l’Amazone se disputent le titre de « plus long fleuve ».'],
      ['Yangzi', 'Le Yangzi Jiang est le plus long fleuve d’Asie.'],
    ],
    why: 'Le débit n’est pas la longueur : c’est l’Amazone qui charrie le plus d’eau.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'L’Amazone apporte à la mer environ un cinquième de toute l’eau des fleuves de la Terre.' },
        {
          name: 'Débit.png',
          kind: 'image',
          alt: 'Diagramme en barres : débit de l’Amazone, du Congo, du Gange et de l’Orénoque en milliers de mètres cubes par seconde, arrondi.',
          chart: {
            chart: 'bars',
            title: 'Débit (arrondi)',
            unit: '1 000 m³/s',
            items: [
              { label: 'Amazone', value: 209 },
              { label: 'Congo', value: 41 },
              { label: 'Gange', value: 38 },
              { label: 'Orénoque', value: 37 },
            ],
          },
        },
      ],
    },
  },
  'nat-bee': {
    topic: 'Communication animale',
    intro: 'Les abeilles communiquent sans mots et trouvent ainsi les fleurs les plus riches.',
    stem: 'Comment appelle-t-on le « langage » par lequel les abeilles indiquent une source de nourriture ?',
    options: ['La danse frétillante', 'La valse', 'La parade nuptiale', 'La danse de la pluie'],
    f: [
      ['Chercheur', 'Karl von Frisch a décodé cette danse et a reçu pour cela le prix Nobel en 1973.'],
      ['Signal', 'L’angle par rapport à la verticale indique la direction par rapport au soleil, la durée du frétillement la distance.'],
      ['Colonie', 'En été, une colonie compte jusqu’à 50 000 abeilles.'],
      ['Fourmis', 'Les fourmis communiquent surtout par des odeurs.'],
    ],
    why: 'La danse frétillante code la direction et la distance d’une source de nourriture.',
  },
  'nat-octopus': {
    topic: 'Les pieuvres',
    intro: 'Les pieuvres comptent parmi les invertébrés les plus intelligents et ont une anatomie étonnante.',
    stem: 'Combien de cœurs une pieuvre (poulpe) possède-t-elle ?',
    options: ['1', '2', '3', '8'],
    f: [
      ['Cœurs branchiaux', 'Deux cœurs branchiaux pompent le sang à travers les branchies.'],
      ['Cœur systémique', 'Un autre cœur irrigue le reste du corps.'],
      ['Sang', 'Leur sang est bleu car il contient de l’hémocyanine, riche en cuivre.'],
      ['Bras', 'Les pieuvres ont huit bras, les calmars dix.'],
    ],
    why: 'Deux cœurs branchiaux plus un cœur systémique : trois cœurs.',
  },
  'nat-climate': {
    topic: 'Gaz à effet de serre',
    intro: 'Le climat change parce que certains gaz retiennent la chaleur dans l’atmosphère.',
    stem: 'Quel gaz à effet de serre provient surtout de la combustion des énergies fossiles ?',
    options: ['Le dioxyde de carbone', 'L’argon', 'Le néon', 'L’azote'],
    f: [
      ['Combustion', 'Quand on brûle du charbon, du pétrole ou du gaz, le carbone se lie à l’oxygène.'],
      ['Effet de serre', 'Les gaz à effet de serre retiennent le rayonnement thermique dans l’atmosphère.'],
      ['Gaz rare', 'L’argon et le néon sont des gaz rares et ne réagissent presque pas.'],
    ],
    why: 'Carbone + oxygène → dioxyde de carbone (CO₂), le principal gaz à effet de serre émis par l’être humain.',
  },

  // ───────────── Culture et art ─────────────
  'cul-guitar': {
    topic: 'Instruments à cordes',
    intro: 'Les guitares ont mille formes, mais la structure de l’instrument classique est fixée.',
    stem: 'Combien de cordes a une guitare standard ?',
    options: ['4', '5', '6', '12'],
    f: [
      ['Accordage', 'L’accordage standard est mi–la–ré–sol–si–mi : six cordes.'],
      ['Violon', 'Un violon a quatre cordes.'],
      ['Basse', 'Une basse électrique classique a aussi quatre cordes.'],
    ],
    why: 'Une guitare a six cordes. Les guitares à douze cordes les doublent par paires.',
  },
  'cul-bach': {
    topic: 'Musique baroque',
    intro: 'Le baroque a produit une musique d’un ordre étonnant que les pianistes travaillent encore aujourd’hui.',
    stem: 'Qui a écrit « Le Clavier bien tempéré » ?',
    options: ['Jean-Sébastien Bach', 'Wolfgang Amadeus Mozart', 'Ludwig van Beethoven', 'Georg Friedrich Haendel'],
    f: [
      ['Œuvre', 'L’œuvre contient des préludes et fugues dans les 24 tonalités majeures et mineures.'],
      ['Compositeur', 'Le compositeur était cantor de Saint-Thomas à Leipzig.'],
      ['Époque', 'Elle date du baroque ; le premier livre fut achevé en 1722.'],
      ['Eau', 'Haendel a écrit la « Water Music » pour le roi George Ier.'],
    ],
    why: 'Bach, cantor de Saint-Thomas à Leipzig, a écrit deux livres de 24 préludes et fugues chacun.',
    files: {
      2: [
        { name: 'Note.txt', kind: 'note', text: 'Le compositeur était cantor de Saint-Thomas à Leipzig.' },
        {
          name: 'Leipzig.txt',
          kind: 'article',
          source: SRC,
          text:
            'Il est né en 1685 à Eisenach, dans une famille de musiciens.\n\nÀ Leipzig, il a dirigé pendant plus de vingt ans le chœur de l’église Saint-Thomas. C’est là qu’il a écrit une grande partie de sa musique sacrée.\n\nSes œuvres pour instruments à clavier restent aujourd’hui une référence pour les pianistes.',
        },
      ],
    },
  },
  'cul-mona': {
    topic: 'Peinture de la Renaissance',
    intro: 'Le tableau le plus célèbre du monde est exposé dans un musée parisien et sourit mystérieusement.',
    stem: 'Qui a peint la Joconde ?',
    options: ['Michel-Ange', 'Léonard de Vinci', 'Raphaël', 'Botticelli'],
    f: [
      ['Peintre', 'Léonard de Vinci travailla au portrait à partir de 1503 environ.'],
      ['Lieu', 'Le tableau est exposé au Louvre, à Paris.'],
      ['Sixtine', 'Michel-Ange a peint le plafond de la chapelle Sixtine.'],
    ],
    why: 'La Joconde est une œuvre de Léonard de Vinci, de la haute Renaissance italienne.',
  },
  'cul-impression': {
    topic: 'Impressionnisme',
    intro: 'Une impression fugace au lever du jour a donné son nom à tout un mouvement artistique.',
    stem: 'Quel tableau de Claude Monet a donné son nom à l’impressionnisme ?',
    options: ['Impression, soleil levant', 'Les Nymphéas', 'Le Déjeuner sur l’herbe', 'La Cathédrale de Rouen'],
    f: [
      ['Moquerie', 'En 1874, un critique se moqua d’une exposition en traitant ses peintres de simples « impressionnistes », d’après le titre d’un tableau.'],
      ['Motif', 'Le tableau montre le port du Havre dans la brume du matin.'],
      ['Giverny', 'Monet peignit plus tard ses nymphéas dans son jardin de Giverny.'],
      ['Manet', '« Le Déjeuner sur l’herbe » est d’Édouard Manet.'],
    ],
    why: '« Impression, soleil levant » (1872) a donné son nom au mouvement.',
  },
  'cul-faust': {
    topic: 'Classicisme allemand',
    intro: 'Un savant conclut un pacte avec le diable : ce drame est au cœur de la littérature allemande.',
    stem: 'Qui est l’auteur du drame « Faust » ?',
    options: ['Friedrich Schiller', 'Johann Wolfgang von Goethe', 'Gotthold Ephraim Lessing', 'Bertolt Brecht'],
    f: [
      ['Œuvre d’une vie', 'Goethe a travaillé plus de 60 ans à son « Faust ».'],
      ['Brigands', 'Schiller a écrit « Les Brigands » et « Guillaume Tell ».'],
      ['Nathan', 'Lessing a écrit « Nathan le Sage ».'],
    ],
    why: 'Goethe publia la première partie en 1808 ; la seconde ne parut qu’après sa mort, en 1832.',
  },
  'cul-grimm': {
    topic: 'Contes et dictionnaires',
    intro: 'Les frères ne recueillirent pas que des contes : ils rêvaient d’une grande œuvre sur leur propre langue.',
    stem: 'Quel immense ouvrage de référence les frères Grimm ont-ils commencé en plus de leurs contes ?',
    options: ['Le Dictionnaire allemand', 'L’encyclopédie Brockhaus', 'Le Duden', 'Le lexique de Meyer'],
    f: [
      ['Dictionnaire', 'En 1838, les frères Grimm commencèrent le « Deutsches Wörterbuch », un dictionnaire de l’allemand.'],
      ['Durée', 'Il ne fut achevé qu’en 1961, plus de cent ans plus tard.'],
      ['Duden', 'Konrad Duden publia son dictionnaire d’orthographe en 1880.'],
    ],
    why: 'Le Dictionnaire allemand des Grimm compte 32 volumes.',
  },
  'cul-language': {
    topic: 'Langues du monde',
    intro: 'Il existe des milliers de langues, mais certaines ont bien plus de locuteurs que d’autres.',
    stem: 'Quelle langue compte le plus de locuteurs natifs dans le monde ?',
    options: ['L’anglais', 'L’espagnol', 'Le chinois mandarin', 'L’hindi'],
    f: [
      ['Mandarin', 'Le mandarin compte plus de 900 millions de locuteurs natifs.'],
      ['Anglais', 'L’anglais compte environ 380 millions de locuteurs natifs, mais énormément de locuteurs en langue seconde.'],
      ['Espagnol', 'L’espagnol compte environ 480 millions de locuteurs natifs.'],
      ['Diversité', 'Environ 7 000 langues différentes sont parlées sur Terre.'],
    ],
    why: 'Le mandarin est en tête pour les locuteurs natifs ; l’anglais est la langue seconde la plus apprise.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'Le mandarin compte plus de 900 millions de locuteurs natifs.' },
        {
          name: 'Locuteurs.png',
          kind: 'image',
          alt: 'Diagramme en barres : locuteurs natifs du mandarin, de l’espagnol, de l’anglais et de l’hindi, en millions, arrondi.',
          chart: {
            chart: 'bars',
            title: 'Locuteurs natifs (arrondi)',
            unit: 'millions',
            items: [
              { label: 'Mandarin', value: 940 },
              { label: 'Espagnol', value: 485 },
              { label: 'Anglais', value: 380 },
              { label: 'Hindi', value: 345 },
            ],
          },
        },
      ],
      2: [
        {
          name: 'Anglais.txt',
          kind: 'article',
          source: SRC,
          text:
            'On entend l’anglais sur tous les continents, dans le trafic aérien, dans la science et sur Internet.\n\nCeux qui l’apprennent dès la petite enfance l’ont pour langue maternelle : environ 380 millions de personnes. S’y ajoutent de très nombreuses personnes qui l’apprennent plus tard comme langue seconde.\n\nAu total, plus d’un milliard de personnes le parlent, mais cela ne dit rien du nombre de ses locuteurs natifs.',
        },
      ],
    },
  },

  // ───────────── Histoire et société ─────────────
  'his-pyramid': {
    topic: 'Égypte ancienne',
    intro: 'Il y a plus de 4 000 ans, les Égyptiens ont bâti des tombeaux qui tiennent encore debout.',
    stem: 'Pour quel pharaon la grande pyramide de Gizeh a-t-elle été construite ?',
    options: ['Toutânkhamon', 'Khéops', 'Ramsès II', 'Akhenaton'],
    f: [
      ['Date', 'La grande pyramide fut construite vers 2560 av. J.-C.'],
      ['Nom', 'Son bâtisseur s’appelait Khoufou en égyptien, Khéops en grec.'],
      ['Tombe', 'La tombe de Toutânkhamon fut découverte par Howard Carter en 1922.'],
    ],
    why: 'Khéops (Khoufou) fit construire la plus grande des trois pyramides de Gizeh.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'La grande pyramide fut construite vers 2560 av. J.-C.' },
        {
          name: 'Gizeh.txt',
          kind: 'article',
          source: SRC,
          text:
            'À Gizeh, aux portes du Caire actuel, se dressent trois grandes pyramides.\n\nLa plus grande fut bâtie comme tombeau pour un pharaon de la IVe dynastie. Elle mesurait à l’origine environ 146 mètres et resta pendant des millénaires le plus haut édifice du monde.\n\nLes blocs de pierre furent mis en place à l’aide de rampes et de traîneaux.',
        },
      ],
    },
  },
  'his-rosetta': {
    topic: 'Hiéroglyphes',
    intro: 'Pendant des siècles, personne ne sut lire l’écriture des pharaons, jusqu’à ce qu’une découverte en livre la clé.',
    stem: 'Quelle découverte a permis de déchiffrer les hiéroglyphes ?',
    options: ['La pierre de Rosette', 'Le papyrus Ebers', 'Le trésor de Priam', 'Le Codex Sinaiticus'],
    f: [
      ['Trilingue', 'La pierre porte le même texte en hiéroglyphes, en démotique et en grec ancien.'],
      ['Découverte', 'Elle fut trouvée en 1799 près de Rosette, dans le delta du Nil.'],
      ['Déchiffrement', 'Jean-François Champollion fit la percée en 1822.'],
      ['Troie', 'Heinrich Schliemann fouilla Troie à partir de 1870.'],
    ],
    why: 'Le texte grec a aidé à comprendre les hiéroglyphes. Champollion s’en servit en 1822.',
  },
  'his-rome': {
    topic: 'Fin de l’Antiquité',
    intro: 'Un immense empire ne s’effondre pas en un jour, mais une année est considérée comme le tournant.',
    stem: 'En quelle année l’Empire romain d’Occident est-il considéré comme tombé ?',
    unit: 'apr. J.-C.',
    f: [
      ['Déposition', 'Le chef militaire Odoacre déposa le dernier empereur romain d’Occident, Romulus Augustule.'],
      ['Année', 'Cela se passa en 476 apr. J.-C.'],
      ['Rome d’Orient', 'L’Empire romain d’Orient dura jusqu’en 1453.'],
      ['Partage', 'L’Empire romain fut définitivement partagé entre Orient et Occident en 395.'],
    ],
    why: 'En 476, Odoacre déposa Romulus Augustule ; l’Empire romain d’Orient subsista.',
  },
  'his-timeline': {
    topic: 'Chronologie',
    intro: 'Comprendre l’histoire, c’est remettre les événements dans le bon ordre.',
    stem: 'Range ces événements dans l’ordre chronologique (du plus ancien au plus récent).',
    items: [
      'Construction de la pyramide de Khéops',
      'Premiers Jeux olympiques',
      'Mort d’Alexandre le Grand',
      'Chute de Rome d’Occident',
    ],
    f: [
      ['Pyramide', 'Pyramide de Khéops : vers 2560 av. J.-C.'],
      ['Olympie', 'Premiers Jeux olympiques antiques : 776 av. J.-C.'],
      ['Alexandre', 'Alexandre le Grand mourut à Babylone en 323 av. J.-C.'],
      ['Rome d’Occident', 'Fin de l’Empire romain d’Occident : 476 apr. J.-C.'],
      ['Merveille', 'La pyramide de Khéops est la seule des sept merveilles du monde antique encore debout.'],
    ],
    why: '2560 av. J.-C. → 776 av. J.-C. → 323 av. J.-C. → 476 apr. J.-C.',
  },
  'his-printing': {
    topic: 'Révolution des médias',
    intro: 'Une invention a rendu le savoir accessible au plus grand nombre et a profondément changé l’Europe.',
    stem: 'Qui a mis au point vers 1450 l’imprimerie à caractères mobiles en Europe ?',
    options: ['Johannes Gutenberg', 'Martin Luther', 'Albrecht Dürer', 'Léonard de Vinci'],
    f: [
      ['Inventeur', 'Johannes Gutenberg, de Mayence, coulait des lettres en métal.'],
      ['Bible', 'La Bible de Gutenberg fut imprimée entre 1452 et 1454 environ.'],
      ['Conséquences', 'L’imprimerie accéléra la diffusion de la Réforme.'],
      ['Luther', 'Martin Luther traduisit le Nouveau Testament en allemand en 1522.'],
    ],
    why: 'L’imprimerie à caractères mobiles de Gutenberg rendit pour la première fois les livres disponibles en masse.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'Johannes Gutenberg, de Mayence, coulait des lettres en métal.' },
        {
          name: 'Avant.txt',
          kind: 'article',
          source: SRC,
          text:
            'Avant l’imprimerie, les livres étaient copiés à la main. Cela prenait des mois et coûtait cher : peu de gens possédaient des livres.\n\nVers 1450, un habitant de Mayence mit au point un procédé où les lettres étaient coulées une à une en métal, puis assemblées en pages.\n\nAvec la presse à imprimer, on pouvait tirer de nombreux exemplaires d’une même page.',
        },
      ],
    },
  },
  'his-wall': {
    topic: 'L’Allemagne divisée',
    intro: 'Pendant des décennies, un mur a coupé une ville en deux, puis les événements se sont précipités.',
    stem: 'En quelle année le mur de Berlin est-il tombé ?',
    unit: '',
    f: [
      ['Ouverture', 'Le 9 novembre, la frontière entre Berlin-Est et Berlin-Ouest fut ouverte.'],
      ['Construction', 'Le mur avait été construit en 1961.'],
      ['Unité', 'La réunification officielle suivit le 3 octobre 1990.'],
      ['Traité', 'Le traité « Deux plus Quatre » fut conclu en 1990.'],
    ],
    why: 'Le mur est tombé le 9 novembre 1989 ; l’unité a suivi un an plus tard.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'Le 9 novembre, la frontière entre Berlin-Est et Berlin-Ouest fut ouverte.' },
        {
          name: 'Berlin.png',
          kind: 'image',
          alt: 'Frise chronologique de Berlin : 1961 construction du mur, 1989 ouverture de la frontière, 1990 réunification.',
          chart: {
            chart: 'timeline',
            title: 'Berlin et le Mur',
            events: [
              { label: 'Construction du mur', year: 1961 },
              { label: 'Frontière ouverte', year: 1989 },
              { label: 'Réunification', year: 1990 },
            ],
          },
        },
      ],
    },
  },
  'his-states': {
    topic: 'Fédéralisme',
    intro: 'L’Allemagne est un État fédéral : ses Länder ont leurs propres droits et gouvernements.',
    stem: 'Combien de Länder (États fédérés) l’Allemagne compte-t-elle ?',
    options: ['12', '14', '16', '18'],
    f: [
      ['Territoriaux', 'Il y a 13 Länder territoriaux.'],
      ['Villes-États', 'S’y ajoutent trois villes-États : Berlin, Hambourg et Brême.'],
      ['Unité', 'La réunification a ajouté cinq nouveaux Länder.'],
    ],
    why: '13 Länder territoriaux plus trois villes-États font 16 Länder.',
  },
  'his-euro': {
    topic: 'Monnaie européenne',
    intro: 'Une monnaie commune devait rapprocher davantage l’Europe.',
    stem: 'En quelle année les pièces et billets en euros ont-ils été introduits ?',
    unit: '',
    f: [
      ['Espèces', 'Pièces et billets furent mis en circulation un 1er janvier.'],
      ['Année', 'C’était au début de l’année 2002.'],
      ['Virements', 'L’euro existait déjà depuis 1999 comme monnaie scripturale, sur les comptes et pour les virements.'],
      ['Maastricht', 'Le traité de Maastricht fut signé en 1992.'],
    ],
    why: 'L’euro a été introduit en 1999 comme monnaie scripturale ; les pièces et billets ont suivi en 2002.',
  },

  // ───────────── Vrai ou faux ─────────────
  'tf-sound': {
    topic: 'Le son',
    intro: 'Nous entendons de la musique, des voix et des détonations : mais de quoi le son a-t-il besoin pour nous parvenir ?',
    stem: 'Vrai ou faux ? Le son se propage aussi dans le vide.',
    f: [
      ['Milieu', 'Le son a besoin de matière comme l’air, l’eau ou les solides pour se propager.'],
      ['Espace', 'L’espace est presque vide : c’est pourquoi on n’y entend aucune détonation.'],
      ['Ondes', 'Le son naît quand des particules vibrent et poussent leurs voisines.'],
      ['Lune', 'La Lune est à environ 384 000 km de la Terre.'],
    ],
    why: 'Le son est une vibration de la matière. Sans particules capables de vibrer, il n’y a pas de son, contrairement à la lumière.',
  },
  'tf-spider': {
    topic: 'Les arachnides',
    intro: 'Huit pattes, des toiles et une mauvaise réputation : à quel groupe d’animaux les araignées appartiennent-elles vraiment ?',
    stem: 'Vrai ou faux ? Les araignées sont des insectes.',
    f: [
      ['Pattes', 'Les insectes ont six pattes, les araignées huit.'],
      ['Corps', 'Les insectes ont trois parties du corps, les araignées seulement deux.'],
      ['Toile', 'Toutes les araignées ne tissent pas de toile pour attraper leurs proies.'],
    ],
    why: 'Les araignées sont des arachnides : huit pattes, deux parties du corps et pas d’antennes.',
  },
  'tf-piano': {
    topic: 'Le piano',
    intro: 'Le piano passe pour le roi des instruments et a une taille fixe et bien connue.',
    stem: 'Vrai ou faux ? Un piano standard a 88 touches.',
    f: [
      ['Touches', 'Un piano a 52 touches blanches et 36 noires.'],
      ['Étendue', 'Les touches couvrent un peu plus de sept octaves.'],
      ['Pédales', 'Un piano à queue a généralement trois pédales.'],
    ],
    why: '52 touches blanches plus 36 noires font 88.',
  },
  'tf-olympia': {
    topic: 'Jeux olympiques antiques',
    intro: 'Les premiers Jeux olympiques étaient une fête religieuse en l’honneur des dieux de la Grèce.',
    stem: 'Vrai ou faux ? Les Jeux olympiques de l’Antiquité avaient lieu à Athènes.',
    f: [
      ['Lieu', 'Les jeux antiques se déroulaient à Olympie, dans le Péloponnèse.'],
      ['Époque', 'Ils commencèrent en 776 av. J.-C. et avaient lieu tous les quatre ans.'],
      ['Athènes', 'Athènes était une cité puissante et passe pour le berceau de la démocratie.'],
    ],
    why: 'Les jeux tiraient leur nom du lieu : Olympie. Athènes n’accueillit que les premiers Jeux modernes, en 1896.',
  },
  'tf-salt': {
    topic: 'Le sel de cuisine',
    intro: 'Le sel est dans la mer, sur la table et dans chaque corps. De quoi est-il fait chimiquement ?',
    stem: 'Vrai ou faux ? Le sel de cuisine est composé de sodium et de chlore.',
    f: [
      ['Formule', 'Le sel de cuisine a pour formule chimique NaCl : sodium et chlore.'],
      ['Ions', 'Dans un cristal de sel, les ions sodium et chlorure sont disposés en réseau.'],
      ['Mer', 'L’eau de mer contient en moyenne environ 3,5 % de sel.'],
    ],
    why: 'NaCl : Na pour sodium, Cl pour chlore. Ensemble, ils forment le sel que nous utilisons chaque jour.',
  },
  'tf-nile': {
    topic: 'Le Nil',
    intro: 'Le Nil est l’artère vitale de l’Égypte et traverse de nombreux pays d’Afrique.',
    stem: 'Vrai ou faux ? Le Nil se jette dans la Méditerranée.',
    f: [
      ['Embouchure', 'Le Nil coule vers le nord et se jette dans la Méditerranée par un delta.'],
      ['Longueur', 'Avec environ 6 600 kilomètres, c’est l’un des plus longs fleuves de la Terre.'],
      ['Sphinx', 'Le Sphinx de Gizeh se dresse au bord du désert, près du Caire.'],
    ],
    why: 'Le Nil coule vers le nord à travers l’Afrique de l’Est et se termine dans son delta, sur la Méditerranée.',
  },

  // ───────────── Associer ─────────────
  'mt-units': {
    topic: 'Unités physiques',
    intro: 'Mesurer, c’est comparer : chaque grandeur a son unité, il suffit de bien les associer.',
    stem: 'Relie chaque unité à la grandeur qu’elle mesure.',
    pairs: [
      ['Mètre', 'Longueur'],
      ['Seconde', 'Temps'],
      ['Kilogramme', 'Masse'],
      ['Ampère', 'Intensité électrique'],
    ],
    f: [
      ['Longueur, temps', 'Le mètre mesure la longueur, la seconde le temps.'],
      ['Masse, courant', 'Le kilogramme est l’unité de masse, l’ampère celle de l’intensité électrique.'],
      ['Newton', 'Le newton est l’unité de force.'],
    ],
    why: 'Mètre (longueur), seconde (temps), kilogramme (masse) et ampère (intensité électrique) sont quatre unités de base.',
  },
  'mt-classes': {
    topic: 'Classes d’animaux',
    intro: 'De la mer jusqu’au ciel : on classe les animaux selon leur anatomie et leur mode de vie.',
    stem: 'Relie chaque animal à sa classe.',
    pairs: [
      ['Dauphin', 'Mammifère'],
      ['Grenouille', 'Amphibien'],
      ['Aigle', 'Oiseau'],
      ['Requin', 'Poisson'],
    ],
    f: [
      ['Dauphin', 'Les dauphins respirent de l’air et allaitent leurs petits : ce sont des mammifères.'],
      ['Grenouille', 'Les grenouilles pondent dans l’eau et vivent plus tard sur terre : ce sont des amphibiens.'],
      ['Requin', 'Les requins respirent par des branchies : ce sont des poissons.'],
      ['Baleine', 'La baleine bleue est le plus grand animal de la Terre.'],
    ],
    why: 'Malgré sa forme, le dauphin est un mammifère ; le requin est un poisson, la grenouille un amphibien et l’aigle un oiseau.',
  },
  'mt-instruments': {
    topic: 'Familles d’instruments',
    intro: 'L’orchestre est organisé par familles d’instruments. Qui va avec qui ?',
    stem: 'Relie chaque instrument à sa famille.',
    pairs: [
      ['Violon', 'Cordes frottées'],
      ['Trompette', 'Cuivres'],
      ['Flûte', 'Bois'],
      ['Timbales', 'Percussions'],
    ],
    f: [
      ['Archet', 'Les instruments à cordes frottées se jouent avec un archet, comme le violon et le violoncelle.'],
      ['Vents', 'La trompette et le trombone font partie des cuivres, la flûte et la clarinette des bois.'],
      ['Tambours', 'Les timbales et les tambours font partie des percussions.'],
      ['Orgue', 'L’orgue passe pour le plus grand instrument de musique.'],
    ],
    why: 'La flûte fait partie des bois, même si elle est souvent en métal aujourd’hui, car son son naît sur une arête.',
  },
  'mt-gods': {
    topic: 'Dieux grecs',
    intro: 'Chacun des dieux grecs veillait sur un domaine qui lui était propre.',
    stem: 'Relie chaque dieu grec à son domaine.',
    pairs: [
      ['Zeus', 'Roi des dieux'],
      ['Poséidon', 'Mer'],
      ['Athéna', 'Sagesse'],
      ['Arès', 'Guerre'],
    ],
    f: [
      ['Zeus, Poséidon', 'Zeus régnait comme roi des dieux, Poséidon sur la mer.'],
      ['Athéna, Arès', 'Athéna était la déesse de la sagesse, Arès le dieu de la guerre.'],
      ['Olympe', 'L’Olympe est la plus haute montagne de Grèce.'],
    ],
    why: 'Zeus (roi des dieux), Poséidon (mer), Athéna (sagesse) et Arès (guerre) étaient des dieux de l’Olympe.',
  },
  'mt-capitals': {
    topic: 'Capitales',
    intro: 'Chaque pays a une capitale où siègent le gouvernement et la vie politique.',
    stem: 'Relie chaque pays à sa capitale.',
    pairs: [
      ['France', 'Paris'],
      ['Italie', 'Rome'],
      ['Espagne', 'Madrid'],
      ['Pologne', 'Varsovie'],
    ],
    f: [
      ['Europe de l’Ouest', 'Paris est la capitale de la France, Madrid celle de l’Espagne.'],
      ['Sud et Est', 'Rome est la capitale de l’Italie, Varsovie celle de la Pologne.'],
      ['Berlin', 'Berlin est la capitale de l’Allemagne.'],
    ],
    why: 'Paris, Rome, Madrid et Varsovie sont les capitales de la France, de l’Italie, de l’Espagne et de la Pologne.',
  },
  'mt-words': {
    topic: 'Reconnaître les langues',
    intro: 'Un seul mot révèle souvent la langue parlée. Connais-tu ces mots de remerciement ?',
    stem: 'Relie chaque mot à la langue d’où il vient.',
    pairs: [
      ['Merci', 'Français'],
      ['Gracias', 'Espagnol'],
      ['Danke', 'Allemand'],
      ['Grazie', 'Italien'],
    ],
    f: [
      ['Remerciement', 'Les quatre mots signifient « merci ».'],
      ['Langues romanes', 'Le français, l’espagnol et l’italien sont des langues romanes.'],
      ['Latin', 'Les langues romanes sont issues du latin.'],
    ],
    why: 'Merci est français, Gracias espagnol, Grazie italien et Danke allemand.',
  },

  // ───────────── Texte à trous ─────────────
  'cl-lightsound': {
    topic: 'Lumière et son',
    intro: 'La lumière est rapide, le son est lent : c’est pourquoi on voit l’éclair avant d’entendre le tonnerre.',
    stem: 'Complète les nombres.',
    text: 'En une seconde, la lumière parcourt environ {0} kilomètres, le son dans l’air seulement environ {1} mètres.',
    answers: ['300 000', '340'],
    bank: ['300 000', '340', '30 000', '3 400'],
    f: [
      ['Lumière', 'Avec environ 300 000 kilomètres par seconde, la lumière est ce qu’il y a de plus rapide.'],
      ['Son', 'Dans l’air, le son parcourt environ 340 mètres par seconde.'],
      ['Orage', 'Pendant un orage, on voit d’abord l’éclair.'],
    ],
    why: 'Lumière : environ 300 000 km/s. Son dans l’air : environ 340 m/s, c’est pourquoi le tonnerre suit l’éclair.',
  },
  'cl-photo': {
    topic: 'Échanges gazeux des plantes',
    intro: 'Les plantes ne respirent pas comme nous : elles échangent des gaz avec l’air et en tirent leur nourriture.',
    stem: 'Complète les mots manquants.',
    text: 'Pendant la photosynthèse, les plantes absorbent {0} et rejettent {1}.',
    answers: ['le dioxyde de carbone', 'l’oxygène'],
    bank: ['le dioxyde de carbone', 'l’oxygène', 'l’azote', 'l’hydrogène'],
    f: [
      ['Absorption', 'Les plantes absorbent le dioxyde de carbone de l’air.'],
      ['Rejet', 'L’oxygène est un sous-produit qu’elles rejettent.'],
      ['Air', 'Environ 78 % de l’air est de l’azote.'],
    ],
    why: 'Les plantes absorbent le dioxyde de carbone, en fabriquent du sucre grâce à la lumière et rejettent de l’oxygène.',
  },
  'cl-music': {
    topic: 'Compter en musique',
    intro: 'La musique vit de nombres : du nombre de notes à la taille d’un ensemble.',
    stem: 'Complète les nombres en toutes lettres.',
    text: 'Un accord parfait se compose de {0} notes, un quatuor à cordes de {1} musiciens.',
    answers: ['trois', 'quatre'],
    bank: ['trois', 'quatre', 'cinq', 'deux'],
    f: [
      ['Accord', 'Un accord parfait se compose de trois notes.'],
      ['Quatuor', 'Quatuor signifie quatre : deux violons, un alto et un violoncelle.'],
      ['Octave', 'Une octave couvre huit degrés de la gamme.'],
    ],
    why: 'Trois notes forment un accord parfait, quatre musiciens un quatuor à cordes.',
  },
  'cl-rome': {
    topic: 'Techniques romaines',
    intro: 'Les Romains étaient de grands ingénieurs et ont répandu leur langue dans toute l’Europe.',
    stem: 'Complète les mots manquants.',
    text: 'Les Romains amenaient l’eau dans leurs villes par des {0}, et leur langue était le {1}.',
    answers: ['aqueducs', 'latin'],
    bank: ['aqueducs', 'latin', 'pyramides', 'grec'],
    f: [
      ['Eau', 'Les aqueducs sont des ponts par lesquels l’eau arrivait dans les villes.'],
      ['Langue', 'Le latin était la langue des Romains et se répandit largement dans l’empire.'],
      ['Égypte', 'Les Égyptiens bâtissaient des pyramides comme tombeaux.'],
    ],
    why: 'Les Romains construisaient des aqueducs pour l’eau et parlaient latin.',
  },
  'cl-price': {
    topic: 'L’offre et la demande',
    intro: 'Les marchés suivent une règle simple : quand une chose est plus demandée, son prix change.',
    stem: 'Complète avec le bon mot.',
    text: 'Si la demande augmente et que l’offre ne change pas, le prix {0}.',
    answers: ['monte'],
    bank: ['monte', 'baisse', 'reste stable'],
    f: [
      ['Demande', 'Si plus de gens veulent un bien et qu’il n’y en a pas davantage, son prix monte.'],
      ['Offre', 'Si un bien est proposé plus souvent, son prix a plutôt tendance à baisser.'],
      ['Or', 'L’or est depuis longtemps considéré comme une valeur refuge.'],
    ],
    why: 'Plus de demande pour une offre égale rend un bien plus rare, et le prix monte.',
  },

  // ───────────── Société, politique et économie ─────────────
  'soc-eu': {
    topic: 'Union européenne',
    intro: 'Six pays fondateurs sont devenus une communauté qui couvre presque tout un continent.',
    stem: 'Combien d’États membres l’Union européenne compte-t-elle depuis la sortie du Royaume-Uni ?',
    options: ['25', '27', '28', '30'],
    f: [
      ['Élargissement', 'Avec l’adhésion de la Croatie en 2013, l’UE est passée à 28 États membres.'],
      ['Sortie', 'Le Royaume-Uni a quitté l’UE fin janvier 2020, seul pays à l’avoir fait jusqu’ici.'],
      ['Fondation', 'En 1957, six États signèrent les traités de Rome, base de l’UE actuelle.'],
      ['Strasbourg', 'Le Conseil de l’Europe, à Strasbourg, n’est pas une institution de l’UE et compte 46 États membres.'],
      ['Monnaie', 'Tous les pays de l’UE n’utilisent pas l’euro ; le Danemark, par exemple, garde sa couronne.'],
    ],
    why: 'Avec la Croatie, il y avait exactement 28 États en 2013. Depuis la sortie du Royaume-Uni en 2020, ils sont 27.',
  },
  'soc-un': {
    topic: 'Nations unies',
    intro: 'Après la Seconde Guerre mondiale, des États se sont unis pour garantir la paix.',
    stem: 'Au Conseil de sécurité de l’ONU, chaque membre dispose d’un droit de veto.',
    f: [
      ['Permanents', 'Le Conseil de sécurité compte cinq membres permanents : la Chine, la France, la Russie, le Royaume-Uni et les États-Unis.'],
      ['Élus', 'Dix autres membres sont élus pour deux ans et ne peuvent pas opposer de veto.'],
      ['Fondation', 'Les Nations unies ont été fondées en 1945, après la Seconde Guerre mondiale.'],
      ['Siège', 'Le siège des Nations unies se trouve à New York.'],
      ['Membres', 'Aujourd’hui, 193 États sont membres des Nations unies.'],
    ],
    why: 'Seuls les cinq membres permanents ont un droit de veto. Les dix membres élus ne l’ont pas.',
  },
  'soc-powers': {
    topic: 'Séparation des pouvoirs',
    intro: 'En démocratie, le pouvoir est réparti entre plusieurs organes pour que personne n’en ait trop.',
    stem: 'Relie chaque organe constitutionnel allemand au pouvoir qu’il exerce.',
    pairs: [
      ['Bundestag (parlement)', 'Législatif'],
      ['Gouvernement fédéral', 'Exécutif'],
      ['Cour constitutionnelle fédérale', 'Judiciaire'],
    ],
    f: [
      ['Parlement', 'Le parlement vote les lois ; au niveau fédéral, c’est le Bundestag.'],
      ['Gouvernement', 'Le gouvernement, dirigé par le chancelier ou la chancelière, applique les lois et dirige l’administration.'],
      ['Karlsruhe', 'À Karlsruhe, la plus haute juridiction allemande vérifie que les lois respectent la Loi fondamentale.'],
      ['Montesquieu', 'Montesquieu a décrit trois pouvoirs : le législatif, l’exécutif et le judiciaire.'],
      ['Âge du vote', 'Aux élections du Bundestag, on peut voter dès 18 ans.'],
    ],
    why: 'Le Bundestag vote les lois (législatif), le gouvernement fédéral les applique (exécutif) et la Cour constitutionnelle fédérale rend la justice (judiciaire).',
  },
  'soc-basic': {
    topic: 'Droits fondamentaux',
    intro: 'Avant d’organiser l’État et ses autorités, la Loi fondamentale place un principe en tête.',
    stem: 'Par quelle phrase commence l’article 1 de la Loi fondamentale allemande ?',
    options: [
      'La dignité de l’être humain est intangible.',
      'Tous les êtres humains sont égaux devant la loi.',
      'L’art et la science sont libres.',
      'Tous les Allemands ont le droit de se réunir.',
    ],
    f: [
      ['Article 1', 'L’article 1 nomme la valeur que l’État doit respecter et protéger : la dignité de chaque être humain.'],
      ['Égalité', 'La phrase « Tous les êtres humains sont égaux devant la loi » figure à l’article 3.'],
      ['Entrée en vigueur', 'La Loi fondamentale est entrée en vigueur le 23 mai 1949.'],
      ['Président', 'Le président fédéral est élu pour cinq ans.'],
    ],
    why: 'L’article 1 commence par « La dignité de l’être humain est intangible. » L’égalité devant la loi figure à l’article 3, la liberté de l’art à l’article 5, la liberté de réunion à l’article 8.',
  },
  'soc-majority': {
    topic: 'Majorité',
    intro: 'À un anniversaire bien précis, beaucoup de droits et de devoirs changent d’un coup.',
    stem: 'À quel âge devient-on majeur en Allemagne ?',
    unit: 'ans',
    f: [
      ['Droit de vote', 'Depuis 1975, on devient majeur en Allemagne à l’âge où l’on peut voter aux élections du Bundestag.'],
      ['Élections', 'Peut voter aux élections du Bundestag quiconque a 18 ans révolus le jour du scrutin.'],
      ['Avant', 'Avant 1975, on ne devenait majeur en Allemagne qu’à 21 ans.'],
      ['Pénal', 'En Allemagne, la responsabilité pénale commence à 14 ans.'],
      ['Conduite', 'La conduite accompagnée est possible dès 17 ans.'],
    ],
    why: 'Depuis 1975, on est majeur en Allemagne à 18 ans ; auparavant, seulement à 21 ans.',
  },
  'soc-court': {
    topic: 'Cour constitutionnelle',
    intro: 'Une cour veille à ce que le parlement et le gouvernement respectent eux aussi la constitution.',
    stem: 'La Cour constitutionnelle fédérale allemande siège à Berlin.',
    f: [
      ['Siège', 'La Cour constitutionnelle fédérale et la Cour fédérale de justice siègent à Karlsruhe.'],
      ['Débuts', 'La Cour constitutionnelle fédérale a commencé ses travaux en 1951.'],
      ['Reichstag', 'Depuis 1999, le Bundestag siège dans le bâtiment du Reichstag à Berlin.'],
      ['Mandat', 'Les juges de la Cour constitutionnelle fédérale sont élus pour douze ans.'],
    ],
    why: 'La Cour constitutionnelle fédérale siège à Karlsruhe. Le Bundestag et le gouvernement fédéral travaillent à Berlin.',
  },
  'soc-inflation': {
    topic: 'Inflation',
    intro: 'Quand les prix augmentent, ce que vaut réellement ton argent change.',
    stem: 'Avec l’inflation, on obtient plus de marchandises qu’avant pour la même somme.',
    f: [
      ['Pouvoir d’achat', 'Quand le niveau général des prix monte, le pouvoir d’achat de la monnaie baisse.'],
      ['Objectif', 'À moyen terme, la Banque centrale européenne vise un taux d’inflation de 2 %.'],
      ['Déflation', 'Quand les prix baissent pendant longtemps, on parle de déflation.'],
      ['Pièces', 'Les pièces en euros ont une face européenne commune et une face nationale.'],
    ],
    why: 'Avec l’inflation, les prix montent. Pour la même somme, on obtient donc moins, pas plus.',
  },

  // ───────────── Sciences humaines : philosophie et religion ─────────────
  'hum-socrates': {
    topic: 'Philosophie antique',
    intro: 'Dans l’Athènes antique, des penseurs débattaient en pleine rue de justice, de savoir et de vie bonne.',
    stem: 'Quel philosophe grec n’a laissé aucun écrit et est surtout connu par son élève Platon ?',
    options: ['Aristote', 'Socrate', 'Épicure', 'Pythagore'],
    f: [
      ['Agora', 'Socrate discutait sur l’agora d’Athènes et n’écrivit jamais de livre.'],
      ['Dialogues', 'Platon écrivit des dialogues où son maître, personnage principal, pose des questions.'],
      ['Académie', 'Platon fonda à Athènes l’Académie, l’une des premières écoles de philosophie.'],
      ['Alexandre', 'Aristote fut l’élève de Platon et le précepteur d’Alexandre le Grand.'],
    ],
    why: 'Socrate n’a rien écrit. Ce que nous savons de lui vient surtout des dialogues de Platon.',
  },
  'hum-religions': {
    topic: 'Religions du monde',
    intro: 'Beaucoup de religions reposent sur des écritures saintes transmises au fil des siècles.',
    stem: 'Relie chaque religion à son écriture sainte principale.',
    pairs: [
      ['Christianisme', 'Bible'],
      ['Islam', 'Coran'],
      ['Judaïsme', 'Torah'],
      ['Hindouisme', 'Védas'],
    ],
    f: [
      ['Révélation', 'Selon la foi musulmane, le Coran a été révélé au prophète Mahomet.'],
      ['Cinq livres', 'La Torah comprend les cinq livres de Moïse et constitue le fondement du judaïsme.'],
      ['Sanskrit', 'Les Védas comptent parmi les plus anciennes écritures saintes de l’hindouisme et sont rédigés en sanskrit.'],
      ['Testaments', 'La Bible chrétienne se compose de l’Ancien et du Nouveau Testament.'],
      ['Bouddha', 'Siddhartha Gautama, le Bouddha, vécut probablement en Inde au Ve siècle av. J.-C.'],
    ],
    why: 'Bible (christianisme), Coran (islam), Torah (judaïsme) et Védas (hindouisme) sont les écritures centrales de ces religions.',
  },

  // ───────────── Géographie et Terre : astronomie et climat ─────────────
  'ear-planets': {
    topic: 'Système solaire',
    intro: 'Huit planètes tournent autour du Soleil, chacune à sa propre distance.',
    stem: 'Classe les planètes selon leur distance au Soleil, la plus proche d’abord.',
    items: ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter'],
    f: [
      ['Intérieur', 'Mercure tourne au plus près du Soleil, suivie de Vénus.'],
      ['Planète rouge', 'Mars est le voisin extérieur de la Terre.'],
      ['Géante', 'Jupiter est la plus grande planète et tourne au-delà de la ceinture d’astéroïdes.'],
      ['Nombre', 'Depuis 2006, on compte huit planètes dans le système solaire.'],
      ['Lune', 'La Lune est le cinquième plus grand satellite du système solaire.'],
    ],
    why: 'De l’intérieur vers l’extérieur : Mercure, Vénus, la Terre, Mars puis, au-delà de la ceinture d’astéroïdes, Jupiter.',
  },
  'ear-universe': {
    topic: 'Âge de l’Univers',
    intro: 'Tout a commencé par un événement colossal. On peut aujourd’hui dire assez précisément quand.',
    stem: 'Quel âge a l’Univers environ, d’après les mesures actuelles (en milliards d’années) ?',
    unit: 'milliards d’années',
    f: [
      ['Big Bang', 'Les mesures du rayonnement cosmologique datent le Big Bang d’il y a environ 13,8 milliards d’années.'],
      ['Âge de la Terre', 'La Terre a environ 4,5 milliards d’années.'],
      ['Année-lumière', 'Une année-lumière est la distance que la lumière parcourt en un an.'],
      ['Soleil', 'Le Soleil devrait encore briller environ cinq milliards d’années.'],
    ],
    why: 'D’après les mesures actuelles, le Big Bang remonte à environ 13,8 milliards d’années, soit environ trois fois l’âge de la Terre.',
  },
  'ear-zones': {
    topic: 'Zones climatiques',
    intro: 'Selon la distance qui sépare un lieu de l’équateur, le climat y est tout autre.',
    stem: 'Dans quelle zone climatique se trouve l’Allemagne ?',
    options: ['Les tropiques', 'Les subtropiques', 'La zone tempérée', 'La zone polaire'],
    f: [
      ['Saisons', 'L’Allemagne connaît quatre saisons marquées, avec des étés doux et des hivers frais.'],
      ['Latitude', 'L’Allemagne se situe à peu près entre 47 et 55 degrés de latitude nord.'],
      ['Classement', 'On divise grossièrement la Terre en zones tropicale, subtropicale, tempérée et polaire.'],
      ['Sahara', 'Le Sahara est le plus grand désert chaud de la Terre.'],
    ],
    why: 'L’Allemagne se trouve dans la zone tempérée : il y a quatre saisons, et il n’y fait ni une chaleur tropicale ni un froid polaire.',
  },
  'ear-greenhouse': {
    topic: 'Effet de serre',
    intro: 'Quelques gaz de l’air agissent comme les vitres d’une serre : ils retiennent la chaleur.',
    stem: 'Lesquels de ces gaz sont des gaz à effet de serre ? Plusieurs réponses sont justes.',
    options: ['Dioxyde de carbone', 'Azote', 'Méthane', 'Oxygène', 'Protoxyde d’azote'],
    f: [
      ['Deux atomes', 'Les gaz formés de deux atomes identiques, comme l’azote (N₂) et l’oxygène (O₂), laissent passer presque librement le rayonnement thermique.'],
      ['Mesures', 'Depuis 1958, on mesure sur le Mauna Loa la quantité de dioxyde de carbone dans l’air ; elle augmente, et la Terre se réchauffe.'],
      ['Vaches & champs', 'Le méthane des estomacs de bovins et le protoxyde d’azote des champs fertilisés retiennent bien plus la chaleur que la même quantité de dioxyde de carbone.'],
      ['Vapeur d’eau', 'La vapeur d’eau retient aussi la chaleur ; c’est même le gaz à effet de serre le plus répandu.'],
      ['Trou d’ozone', 'Le trou d’ozone au-dessus de l’Antarctique est dû surtout aux CFC des bombes aérosol et des réfrigérateurs.'],
    ],
    why: 'Le dioxyde de carbone, le méthane et le protoxyde d’azote retiennent le rayonnement thermique. L’azote et l’oxygène forment ensemble 99 % de l’air, mais laissent la chaleur filer presque librement vers l’espace.',
    files: {
      1: [
        { name: 'Note.txt', kind: 'note', text: 'Les gaz formés de deux atomes identiques, comme l’azote (N₂) et l’oxygène (O₂), laissent passer presque librement le rayonnement thermique.' },
        {
          name: 'Air.png',
          kind: 'image',
          alt: 'Diagramme circulaire : parts de l’azote, de l’oxygène, de l’argon et des autres gaz dans l’air sec.',
          chart: {
            chart: 'pie',
            title: 'Air sec',
            items: [
              { label: 'Azote', value: 78 },
              { label: 'Oxygène', value: 21 },
              { label: 'Argon', value: 0.9 },
              { label: 'Autres gaz', value: 0.1 },
            ],
          },
        },
      ],
      2: [
        {
          name: 'Mauna_Loa.png',
          kind: 'image',
          alt: 'Courbe : dioxyde de carbone dans l’air, mesuré sur le Mauna Loa, de 1960 à 2020 en ppm.',
          chart: {
            chart: 'line',
            title: 'Dioxyde de carbone dans l’air',
            unit: 'ppm',
            points: [
              { year: 1960, value: 317 },
              { year: 1980, value: 339 },
              { year: 2000, value: 370 },
              { year: 2010, value: 390 },
              { year: 2020, value: 414 },
            ],
          },
        },
        {
          name: 'Station.eml',
          kind: 'mail',
          from: 'Rhizom',
          subject: 'La courbe du Mauna Loa',
          text: 'Depuis 1958, une station sur le volcan Mauna Loa mesure la quantité de dioxyde de carbone dans l’air. Depuis, la courbe ne connaît qu’une direction, et la Terre se réchauffe avec elle.',
        },
      ],
      3: [
        { name: 'Note.txt', kind: 'note', text: 'Le méthane des estomacs de bovins et le protoxyde d’azote des champs fertilisés retiennent bien plus la chaleur que la même quantité de dioxyde de carbone.' },
        {
          name: 'Effet_de_serre.png',
          kind: 'image',
          alt: 'L’effet de serre en quatre étapes, du Soleil à l’air plus chaud.',
          chart: {
            chart: 'flow',
            title: 'Effet de serre',
            steps: ['Le soleil chauffe le sol', 'Le sol rayonne de la chaleur', 'Les gaz à effet de serre en retiennent', 'L’air se réchauffe'],
          },
        },
      ],
    },
  },
  'sci-classes': {
    topic: 'Classes d’animaux',
    intro: 'Certains animaux ressemblent à d’autres, mais appartiennent à une tout autre classe.',
    stem: 'Range chaque animal dans le bon dossier.',
    groups: ['Mammifères', 'Oiseaux', 'Reptiles'],
    items: ['Baleine', 'Chauve-souris', 'Manchot', 'Autruche', 'Crocodile', 'Tortue'],
    f: [
      ['Baleine', 'Les baleines respirent avec des poumons, mettent bas des petits vivants et les nourrissent de lait.'],
      ['Chauve-souris', 'Les chauves-souris volent, mais elles ont des poils au lieu de plumes et allaitent leurs petits.'],
      ['Plumes', 'Tous les oiseaux ont des plumes et pondent des œufs, même ceux qui ne volent pas, comme le manchot et l’autruche.'],
      ['Écailles', 'Les reptiles comme les crocodiles et les tortues ont une peau sèche avec des écailles ou des plaques cornées et pondent sur la terre ferme.'],
      ['Requin', 'Les requins sont des poissons : ils respirent avec des branchies, même s’ils ressemblent aux dauphins.'],
    ],
    why: 'La baleine et la chauve-souris allaitent leurs petits, le manchot et l’autruche ont des plumes, le crocodile et la tortue portent écailles et plaques cornées : ce sont des reptiles.',
    files: {
      1: [
        {
          name: 'Baleine.inf',
          kind: 'profile',
          fields: [
            ['Classe', 'Mammifères'],
            ['Respiration', 'Poumons'],
            ['Petits', 'nés vivants, allaités'],
            ['Habitat', 'Mer'],
          ],
        },
        { name: 'Note.txt', kind: 'note', text: 'Les baleines respirent avec des poumons, mettent bas des petits vivants et les nourrissent de lait.' },
      ],
      3: [
        {
          name: 'Manchots.eml',
          kind: 'mail',
          from: 'Bolt',
          subject: 'Question manchot',
          text: 'Je croyais que les manchots étaient des poissons, tellement ils nagent bien. Faux ! Ils ont des plumes, pondent des œufs et sont des oiseaux. Ils ne volent que sous l’eau, dit Rhizom.',
        },
        {
          name: 'Autruche.inf',
          kind: 'profile',
          fields: [
            ['Classe', 'Oiseaux'],
            ['Vole', 'non'],
            ['Taille', 'jusqu’à 2,7 m'],
            ['Œufs', 'les plus gros de tous les oiseaux'],
          ],
        },
      ],
    },
  },
  'soc-un-assembly': {
    topic: 'Assemblée générale de l’ONU',
    intro: 'Après la Seconde Guerre mondiale, des États se sont unis pour préserver la paix.',
    stem: 'Ce compte rendu sur les Nations Unies contient une erreur. Quelle phrase est fausse ?',
    lines: [
      'Les Nations Unies ont été fondées en 1945.',
      'Leur siège se trouve à New York.',
      'Le Conseil de sécurité compte cinq membres permanents avec droit de veto.',
      'À l’Assemblée générale, chaque pays a autant de voix qu’il a d’habitants.',
    ],
    f: [
      ['Charte', 'La Charte des Nations Unies a été signée en juin 1945 à San Francisco et est entrée en vigueur en octobre 1945.'],
      ['Assemblée générale', 'À l’Assemblée générale, chaque État membre a exactement une voix, qu’il soit grand ou petit.'],
      ['Conseil', 'Les cinq membres permanents du Conseil de sécurité peuvent bloquer toute résolution par leur veto.'],
      ['Siège', 'Le siège des Nations Unies se trouve au bord de l’East River, à New York.'],
      ['Prédécesseur', 'La Société des Nations, un prédécesseur, a été fondée en 1920 ; les États-Unis n’y ont jamais adhéré.'],
    ],
    why: 'À l’Assemblée générale, la règle est : un État, une voix. Les autres phrases sont justes : fondées en 1945, siège à New York, cinq membres permanents avec droit de veto au Conseil de sécurité.',
    files: {
      1: [
        {
          name: 'Preambule.txt',
          kind: 'quote',
          text: 'Nous, peuples des Nations Unies, résolus à préserver les générations futures du fléau de la guerre …',
          source: 'Charte des Nations Unies, préambule, 1945',
        },
        { name: 'Note.txt', kind: 'note', text: 'La Charte des Nations Unies a été signée en juin 1945 à San Francisco et est entrée en vigueur en octobre 1945.' },
      ],
      2: [
        {
          name: 'Assemblee_generale.inf',
          kind: 'profile',
          fields: [
            ['Membres', '193 États'],
            ['Voix', 'une par État'],
            ['Siège', 'New York'],
            ['Session', 'chaque année dès septembre'],
          ],
        },
      ],
      3: [
        {
          name: 'Conseil_de_securite.eml',
          kind: 'mail',
          from: 'Kodex',
          subject: 'Les cinq permanents',
          text: 'La Chine, la France, la Russie, le Royaume-Uni et les États-Unis siègent en permanence au Conseil de sécurité et ont un droit de veto. Dix autres pays sont élus pour deux ans.',
        },
      ],
    },
  },
};
