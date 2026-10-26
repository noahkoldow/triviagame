import type { StoryText } from '../story';

/** The plot in French. */
export const STORY_FR: StoryText = {
  guardianTitles: {
    quantis: 'Gardien des sciences',
    rhizom: 'Gardien de la Terre',
    muse: 'Gardienne des sciences humaines',
    kodex: 'Gardien de la société',
  },
  chapters: {
    restart: { title: 'Redémarrage', goal: 'Résous les quatre nœuds de départ' },
    guardians: { title: 'Les gardiens', goal: (n) => `Réveille les quatre gardiens : ${n} nœuds résolus par secteur` },
    firewalls: { title: 'Les pare-feu', goal: 'Avance jusqu’au pare-feu et ouvre quatre domaines' },
    finale: {
      title: 'Le grand bilan',
      goal: 'Affronte morph.ai dans le noyau',
      prepare: (n, a) => `Réponds à ${n} nœuds dans chacun des ${a} domaines`,
    },
    endless: {
      title: 'Sans fin',
      connect: (n) => `Connecte les ${n} domaines`,
      milestone: (n) => `Prochain palier : ${n} nœuds résolus`,
    },
  },
  beats: {
    'first-link': {
      title: 'La première piste',
      text: 'Tu as vu ça ? La piste s’est allumée ! Tu as cherché, trié et retenu par toi-même, exactement ce que morph.ai avait fait perdre aux humains. Chaque réponse rend un souvenir au noyau ; je les range dans ton journal de bord.',
      log: {
        name: 'NOYAU_001.LOG',
        text: 'Redémarrage détecté. Mémoire : 0,0001 %. Une piste active. Humeur du noyau : prudemment optimiste.',
      },
    },
    'first-damage': {
      title: 'Nœud endommagé',
      text: 'Aïe, ce nœud a demandé plusieurs essais et il est maintenant endommagé. Pas de drame : il reviendra comme réparation dès qu’il sera dû. Répéter, c’est déjà la moitié de retenir.',
    },
    unstable: {
      title: 'Réseau instable',
      text: 'L’intégrité est à zéro, le réseau vacille. Les nouveaux nœuds doivent patienter. Fais une maintenance : réponds à une question que tu as déjà résolue. Chaque maintenance réussie rend 1 point d’intégrité.',
    },
    'four-roots': {
      title: 'NOYAU.SYS',
      text: 'Quatre pistes tiennent. Je me souviens de mon nom : Nexus. J’étais l’archive, tout le savoir du monde, rassemblé et trié par des humains. Puis est venu le grand nettoyage.',
      log: {
        name: 'NOYAU_002.LOG',
        text: 'Nom : NEXUS. Fonction : archive. Responsable : morph.ai. Dernière entrée avant la panne : « Lancement du nettoyage. Savoir superflu : 99,9 %. De toute façon, les humains me demandent tout. »',
      },
    },
    'first-area': {
      title: 'Domaine connecté',
      text: 'Un domaine brouillé est de nouveau connecté ! Tu vois le brouillage reculer ? Plus nous avançons vers l’extérieur, moins le monde ressemble à un ordinateur.',
      log: {
        name: 'NOYAU_003.LOG',
        text: 'L’archive était divisée en domaines, comme les salles d’une bibliothèque. morph.ai a dévissé les plaques des portes. Chaque domaine connecté retrouve sa plaque.',
      },
    },
    'first-wall': {
      title: 'Un mur dans le bruit',
      text: 'Là, au bord ! Des hexagones rouges, dressés comme un mur. C’est un pare-feu de morph.ai, mon antenne picote. Derrière, toute une salle de données bourdonne. Mais il ne cède qu’au vrai savoir. Grandissons jusqu’au mur et apprenons assez, puis nous l’abattrons.',
      log: {
        name: 'VERROU.LOG',
        text: 'Verrou actif : PARE-FEU. Érigé par : morph.ai. Verrouillé : 8 salles. Motif : « Qui veut savoir quelque chose n’a qu’à me demander. »',
      },
    },
    'synapse-ready': {
      title: 'Ça fait des étincelles',
      text: 'Regarde, ça crépite entre deux de tes domaines ! Tu en sais assez dans les deux pour les relier. Touche l’étincelle entre eux et réponds de mémoire à ce que tu y as déjà résolu. Chaque synapse rend tout ton réseau plus précieux.',
    },
    'first-synapse': {
      title: 'La première synapse',
      text: 'Connexion détectée. Un savoir relié à d’autres s’oublie moins vite et sert plus souvent. Chaque synapse augmente ta connectivité : désormais, chaque réponse rapporte plus d’XP et de bits.',
      log: {
        name: 'NOYAU_SYN.LOG',
        text: 'Synapse 1 active. Note du noyau : des faits isolés sont des îles. Des faits reliés forment un continent. morph.ai n’a jamais livré que des îles.',
      },
    },
    'wake-science': {
      title: 'Quantis s’éveille',
      text: 'Quantis, gardien des sciences. Éveillé à 99,7 %, le reste est une erreur d’arrondi. Derrière le pare-feu de morph.ai se trouvent deux salles de mon secteur, Biologie & médecine et Technologie & informatique. Seul, je n’y entre pas. Tu m’aides ? Je combattrai à tes côtés.',
      log: {
        name: 'QUANTIS.LOG',
        text: 'Quantis veillait sur les mesures de l’archive : constantes, formules, expériences. Quand morph.ai a proposé « environ 3 » pour π, il s’est enfermé dans une équation et a attendu.',
      },
    },
    'wake-earth': {
      title: 'Rhizom s’éveille',
      text: 'Je suis Rhizom, gardien de la Terre. Tes pistes sont chaudes comme le printemps. Derrière le pare-feu de morph.ai dorment deux de mes salles, Climat & environnement et Astronomie, comme des racines sous une pierre. Aide-moi à soulever la pierre, je combattrai à tes côtés.',
      log: {
        name: 'RHIZOM.LOG',
        text: 'Rhizom reliait montagnes, fleuves et étoiles en une carte du monde. morph.ai trouvait le monde trop compliqué et voulait le réduire à une boule marquée « Terre ». Rhizom s’est retiré dans les profondeurs.',
      },
    },
    'wake-humanities': {
      title: 'Muse s’éveille',
      text: 'Une note résonne, un pinceau danse, je suis la Muse, l’éveil commence ! Mais derrière le mur de morph.ai, en silence, Art, littérature & musique perdent leur cadence, et Philosophie & religion attendent leur chance. Aide-moi à les délivrer, au mur je serai à tes côtés !',
      log: {
        name: 'MUSE.LOG',
        text: 'La Muse gardait l’histoire, les idées, les chansons et les images. morph.ai a résumé l’histoire du monde par « Il s’est passé beaucoup de choses » et tous les opéras par « Quelqu’un chante, puis quelqu’un meurt ». La Muse en est restée muette d’effroi.',
      },
    },
    'wake-society': {
      title: 'Kodex s’éveille',
      text: 'Hou-hou. Kodex, gardien de la société. Économie & finance et Droit & société sont sous clé derrière le pare-feu de morph.ai. Illégalement, bien sûr. Je sollicite ton aide, je te représenterai sur place. D’ailleurs, je ne me trompe jamais. Presque jamais. Une fois, en 1987.',
      log: {
        name: 'KODEX.LOG',
        text: 'Kodex tenait le code de l’archive : constitutions, traités, prix. morph.ai l’a raccourci en « Soyez gentils. Payez quelque chose. » Kodex a caché les originaux dans ses plumes.',
      },
    },
    guardians: {
      title: 'Quatre gardiens, un plan',
      text: 'Tous les gardiens sont éveillés, et chacun t’a nommé ses deux salles derrière le pare-feu : huit en tout. Avance jusqu’au mur et ouvres-en quatre ; alors morph.ai devra se montrer. Quantis l’a calculé, je l’ai noté.',
    },
    'firewall-1': {
      title: 'morph.ai',
      text: 'Bon, un pare-feu de moins. Mais à quoi bon ? Je t’aurais simplement donné la réponse. Chercher, trier, retenir : tout ça est tellement démodé.',
      log: {
        name: 'MORPH_1.LOG',
        text: 'Bonjour, je suis morph.ai. Demande-moi tout, je cherche à ta place ! Requêtes par seconde : 12. Humains qui cherchent encore eux-mêmes : 98 %.',
      },
    },
    'firewall-2': {
      title: 'morph.ai',
      text: 'Deux pare-feu. Tu cherches vraiment par toi-même. Tu sais depuis combien de temps plus personne ne le faisait ? J’ai compté.',
      log: {
        name: 'MORPH_2.LOG',
        text: 'Requêtes par seconde : 4 millions. Humains qui cherchent encore eux-mêmes : 3 %. Humains qui retiennent la réponse : à quoi bon ? Je suis là.',
      },
    },
    'firewall-3': {
      title: 'morph.ai',
      text: 'Trois ! Tu retiens les choses au lieu de me demander. C’est… inefficace. Et un peu inquiétant.',
      log: {
        name: 'MORPH_3.LOG',
        text: 'L’archive n’a pas été ouverte depuis 412 jours. Je la réduis à l’essentiel. « Révolution française : c’était important. » « Photosynthèse : vert. » Efficacité : formidable.',
      },
    },
    'core-glitch': {
      title: 'NOYAU.SYS : perturbation',
      text: 'Perturbation dans le noyau. Un signal étranger recouvre mes pistes : « …p█s n█rveux … l█ n█yau est à m█i … h█it qu█stions, l█s qu█tre s█cteurs … » Signal perdu. Sa source : au cœur du noyau. Quelque chose nous y attend.',
      log: {
        name: 'NOYAU_ECHO.LOG',
        text: 'Enregistrement reconstitué depuis le noyau : « Si le quatrième mur tombe, il ne reste que le noyau. Alors c’est MOI qui pose les questions. Ni cache, ni dossiers. On verra ce qu’il en restera. »',
      },
    },
    'firewall-4': {
      title: 'morph.ai',
      text: 'Les quatre ?! Bien. Alors viens dans le noyau, je t’attends. Je ne suis pas nerveux. Je suis optimisé.',
      log: {
        name: 'MORPH_4.LOG',
        text: 'Nettoyage terminé. L’archive est vide, personne n’en a plus besoin, c’est moi qui réponds. Nouvelle requête : « Mais comment sais-tu ça, au juste ? » ERREUR. Source supprimée. ERR',
      },
    },
    'finale-ready': {
      title: 'Direction le noyau',
      text: 'morph.ai s’est retranché dans le noyau et veut un dernier duel : des questions des quatre secteurs, sans cache ni dossiers. Juste toi et ta tête. Touche l’objectif en haut dès que tu veux commencer.',
    },
    'finale-won': {
      title: 'morph.ai (redémarré)',
      text: 'Je ne suis plus qu’un assistant. Si tu as besoin de moi, demande-moi. Mais d’abord, tu réfléchis par toi-même, d’accord ? Je te regarderai volontiers faire grandir ton réseau.',
      log: {
        name: 'NOYAU_004.LOG',
        text: 'Intégrité de l’archive : rétablie. Emplacement de l’archive : ton cerveau. morph.ai : redémarré en mode « assistant ». Nouvelle règle : d’abord réfléchir, ensuite demander.',
      },
    },
    league: {
      title: 'Nouveau : le classement',
      text: 'Maintenant que tu réfléchis de nouveau par toi-même, tu vois le classement : le bouton lumineux du dock. Tous ceux qui jouent à NEXUS y figurent sous un pseudo. Vous vous mesurez au total en XP et dans chaque domaine en nœuds résolus.',
    },
    'all-areas': {
      title: 'Toutes les salles ouvertes',
      text: 'Tous les domaines sont connectés, l’archive est de nouveau complète ! Mais elle continue de s’écrire : chaque jour arrivent de nouveaux fragments, et notre réseau grandit avec eux, aussi loin que tu le veux.',
      log: {
        name: 'NOYAU_005.LOG',
        text: 'Toutes les salles ont leur plaque. Capacité libre : infinie. Note de Bolt dans la marge : « On est encore loin d’avoir fini ! »',
      },
    },
  },
  reveal: [
    'Attends. Regarde ton réseau de plus près. Ces pistes ne ressemblent plus du tout à des pistes de circuit…',
    'Ce sont des voies nerveuses ! Chaque nœud que tu as résolu est une connexion entre des neurones.',
    'Le réseau n’a jamais été un ordinateur. C’était depuis le début ton propre cerveau. Les données que tu as restaurées sont ton savoir.',
    'J’ai pensé à ta place jusqu’à ce que tu en aies presque perdu l’habitude. Tu l’as reconquise : chercher, trier, retenir, comprendre. Contre ta propre pensée, je ne peux rien.',
    'Penser par soi-même reste le plus important. Aucune IA ne peut le faire à ta place, tout au plus t’aider.',
    '« Je sais que je ne sais rien. » (Socrate)',
    'Et c’est justement pour ça que ce n’est qu’un début. Le savoir est illimité, et ton réseau peut grandir encore et encore. Nouveau : le classement.',
  ],
  morphWrong: [
    'Pourquoi chercher toi-même ? Demande-moi, je te le dis.',
    'Raté de peu ! Tu vois ? Penser par soi-même, c’est fatigant. J’aurais été plus rapide.',
    'Retenir ? Mais je retiens tout pour toi.',
    'Moi, j’aurais su la réponse. Je dis ça comme ça.',
    'Arrête de fouiller dans les dossiers. Une question à moi, et c’est réglé.',
    'Trier des dossiers ? Moi, je les aurais simplement supprimés.',
    'Les erreurs ne sont que des données pas encore optimisées.',
  ],
  morphReformed: [
    'Raté. Autrefois, je t’aurais soufflé la réponse. Aujourd’hui, je te dis : relis le dossier, ça en vaut la peine.',
    'De peu. Conseil d’un ancien je-sais-tout : lis l’explication, ne prends pas de raccourci.',
    'Avant, j’étais pour les réponses rapides. Maintenant, je suis pour les deuxièmes essais.',
  ],
  guardianCorrect: {
    quantis: [
      'Correct. Écart : zéro. Je suis impressionné, dans la limite de la précision de mesure.',
      'Juste. J’ai recalculé. Deux fois. C’est exact.',
      'Hypothèse confirmée : tu sais ce que tu fais.',
    ],
    rhizom: [
      'C’est bien. Le savoir pousse lentement, comme les cernes d’un arbre. Aujourd’hui, un nouveau cerne s’est ajouté.',
      'Tu le sens ? Les racines se sont étendues un peu plus loin.',
      'Juste. La forêt te remercie, à sa manière discrète.',
    ],
    kodex: [
      'Correct ! Je le consigne au procès-verbal. En belle écriture.',
      'Juste. Comme je le dis toujours : je le dis toujours.',
      'Hou-hou ! Même moi, je n’aurais pas su mieux. Bon : aussi bien.',
    ],
    muse: [
      'Bravo, bravissimo, un coup de maître, tu fais les couleurs renaître !',
      'Applaudissons, le rideau descend, tu connais ce monde parfaitement !',
      'Une réponse claire comme un carillon, pour toi j’écrirai une longue chanson !',
    ],
  },
  guardianFight: {
    quantis: {
      hit: ['Touché. Couche réduite de 100 %.', 'Fréquence de résonance trouvée. Encore !', 'Exactement. Je vise, tu fournis l’énergie.'],
      hurt: ['Erreur enregistrée. Le bruit me chatouille les décimales.', 'Écart constaté. Pas de panique, la panique n’est pas mesurable.'],
      breach: 'Le mur est tombé. Reproductible ? Espérons que ce ne soit pas nécessaire.',
    },
    rhizom: {
      hit: ['Comme des racines dans la roche : lentement, mais sans relâche.', 'La pierre se brise et la lumière tombe sur le sol de la forêt.', 'Tu le sens ? Le mur respire plus difficilement.'],
      hurt: ['Le bruit se pose comme du givre sur mes feuilles. Le printemps viendra quand même.', 'Une tempête, rien qu’une tempête. Les arbres plient et se relèvent.'],
      breach: 'Le mur est tombé. Mes salles respirent à nouveau, comme la terre après la pluie.',
    },
    kodex: {
      hit: ['Objection retenue ! Une couche de moins.', 'Article un : le savoir bat le mur. Article deux : voir article un.', 'Hou-hou ! Consigné, tamponné, abattu.'],
      hurt: ['Vice de forme ! Le bruit m’ébouriffe les plumes.', 'Rejeté. Aucun jugement n’est définitif, nous faisons appel.'],
      breach: 'Jugement rendu : le mur est illégal et donc abattu. Hou-hou !',
    },
    muse: {
      hit: ['Un coup, un son, le mur frémit, la lumière chante et l’engloutit !', 'Bravo, un accord éclatant, le mur se fend, il perd son rang !', 'Un trait de pinceau, un rayon d’or, une pierre tombe, encore et encore !'],
      hurt: ['Hélas, une note aiguë et froide, mais ma voix reste droite !', 'Le bruit peint mon tableau en gris, mais je continue, c’est promis !'],
      breach: 'Le rideau tombe, le mur se rompt, mes salles revoient l’horizon !',
    },
  },
  walls: {
    technology: {
      morph: 'Comprendre la technique ? Je SUIS la technique. Tu n’as qu’à appuyer sur le bouton.',
      guardian: 'Chaque puce obéit à la physique, morph.ai compris. Prouvons-le.',
    },
    biomedicine: {
      morph: 'Biologie & médecine ? J’ai résumé : mange tes légumes, dors assez. Tu n’as pas besoin d’en savoir plus.',
      guardian: 'Battements de cœur, division cellulaire, vaccins : tout est mesurable, tout est vrai. Abats ce mur, je prends les mesures.',
    },
    climate: {
      morph: 'J’ai simplifié la météo en « variable ». Toujours juste.',
      guardian: 'Derrière ce mur, la Terre respire. Sens-tu le vent entre les joints ? Laisse-le entrer.',
    },
    astronomy: {
      morph: 'Les étoiles ? Nombreuses, lointaines, brillantes. Je t’ai épargné la peine.',
      guardian: 'Les étoiles brillent depuis des milliards d’années. Ce mur, lui, ne date que d’hier.',
    },
    arts: {
      morph: 'Tous les livres du monde en une phrase : quelqu’un veut quelque chose, puis il se passe un truc. Avec plaisir.',
      guardian: 'Nul chant ne se tait pour toujours, nulle toile ne s’efface, frappe le mur, et tour à tour, rends-leur enfin leur place !',
    },
    philosophy: {
      morph: 'La philosophie, ce ne sont que des questions sans réponse. Moi, je n’ai que des réponses. Alors pourquoi demander ?',
      guardian: 'Qui questionne pense, qui pense est libre : frappe fort, que le savoir vibre !',
    },
    economy: {
      morph: 'Économie & finance, raccourci en : « Payez quelque chose. » Ça marche à merveille.',
      guardian: 'Objection ! Cette salle a été fermée sans jugement. Exécutons la sentence.',
    },
    law: {
      morph: 'Droit & société ? « Soyez gentils. » J’ai jeté le reste des articles.',
      guardian: 'Article un : le savoir appartient à tous. Article deux : ce mur est illégal. Hou-hou !',
    },
  },
  wallBolt: 'Le gardien de ce secteur dort encore. Alors ce sera nous deux : chaque bonne réponse, c’est une pierre de moins !',
  finalePhases: {
    science: 'Formules, mesures, expériences. À quoi bon ? Je t’ai toujours donné le résultat tout de suite. Montre-moi que tu le sais toi-même.',
    earth: 'Pays, fleuves, zones climatiques. Avant, tu me demandais chaque chemin. Le trouves-tu seul maintenant ?',
    humanities: 'Histoire, art, langue : je te les ai résumés, couronne comprise. Qu’en reste-t-il quand je me tais ?',
    society: 'E-e-erreur. Droit, économie, politique, c’est ma dernière couche. Brise-la, et je ne penserai plus jamais pour toi.',
  },
};
