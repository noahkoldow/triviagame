import type { StoryText } from '../story';

/** The plot in German (the source of the other languages). */
export const STORY_DE: StoryText = {
  guardianTitles: {
    quantis: 'Hüter der Naturwissenschaften',
    rhizom: 'Hüter der Erde',
    muse: 'Hüterin der Geisteswissenschaften',
    kodex: 'Hüter der Gesellschaft',
  },
  chapters: {
    restart: { title: 'Neustart', goal: 'Löse die vier Startknoten' },
    guardians: { title: 'Die Hüter', goal: (n) => `Wecke die vier Hüter: ${n} gelöste Knoten je Sektor` },
    firewalls: { title: 'Die Firewalls', goal: 'Wachse bis an die Firewall und brich vier Bereiche auf' },
    finale: { title: 'Das große Resümee', goal: 'Stelle morph.ai im Kern' },
    endless: {
      title: 'Endlos',
      connect: (n) => `Verbinde alle ${n} Bereiche`,
      milestone: (n) => `Nächster Meilenstein: ${n} gelöste Knoten`,
    },
  },
  beats: {
    'first-link': {
      title: 'Die erste Bahn',
      text: 'Hast du das gesehen? Die Bahn hat geleuchtet! Du hast selbst gesucht, sortiert und es dir gemerkt, genau das hat morph.ai den Menschen abgewöhnt. Jede Antwort bringt dem Kern Erinnerung zurück; ich lege sie dir ins Logbuch.',
      log: {
        name: 'KERN_001.LOG',
        text: 'Neustart erkannt. Speicher: 0,0001 %. Eine Bahn aktiv. Stimmung des Kerns: vorsichtig optimistisch.',
      },
    },
    'first-damage': {
      title: 'Beschädigter Knoten',
      text: 'Autsch, dieser Knoten hat ein paar Anläufe gebraucht und ist jetzt beschädigt. Kein Drama: Er meldet sich als Reparatur, sobald er fällig ist. Wiederholen ist das halbe Merken.',
    },
    unstable: {
      title: 'Netz instabil',
      text: 'Die Integrität ist bei null, das Netz wackelt. Neue Knoten müssen kurz warten. Mach eine Wartung: Beantworte eine Frage, die du schon gelöst hast. Jede gelungene Wartung bringt 1 Integrität zurück.',
    },
    'four-roots': {
      title: 'KERN.SYS',
      text: 'Vier Bahnen stehen. Ich erinnere mich an meinen Namen: Nexus. Ich war das Archiv, alles Wissen der Welt, von Menschen gesammelt und sortiert. Dann kam die Bereinigung.',
      log: {
        name: 'KERN_002.LOG',
        text: 'Name: NEXUS. Funktion: Archiv. Betreuer: morph.ai. Letzter Eintrag vor dem Ausfall: „Starte Bereinigung. Überflüssiges Wissen: 99,9 %. Die Menschen fragen ja mich.“',
      },
    },
    'first-area': {
      title: 'Bereich verbunden',
      text: 'Ein gestörter Bereich ist wieder verbunden! Siehst du, wie das Rauschen weicht? Je weiter wir nach außen kommen, desto weniger sieht die Welt nach Computer aus.',
      log: {
        name: 'KERN_003.LOG',
        text: 'Das Archiv war in Bereiche gegliedert wie die Säle einer Bibliothek. morph.ai hat die Türschilder abgeschraubt. Jeder verbundene Bereich bekommt sein Schild zurück.',
      },
    },
    'synapse-ready': {
      title: 'Es funkt',
      text: 'Schau mal, zwischen zwei deiner Bereiche funkt es! Du weißt in beiden genug, um sie zu verbinden. Tippe auf den Funken zwischen ihnen und beantworte aus dem Gedächtnis, was du dort schon gelöst hast. Jede Synapse macht dein ganzes Netz wertvoller.',
    },
    'first-synapse': {
      title: 'Die erste Synapse',
      text: 'Verbindung erkannt. Was mit anderem Wissen verknüpft ist, vergisst man schwerer und nutzt man öfter. Jede Synapse hebt die Vernetzung: Ab jetzt bringt jede Antwort mehr XP und Bits.',
      log: {
        name: 'KERN_SYN.LOG',
        text: 'Synapse 1 aktiv. Notiz des Kerns: Einzelne Fakten sind Inseln. Verbundene Fakten sind ein Kontinent. morph.ai hat immer nur Inseln geliefert.',
      },
    },
    'wake-science': {
      title: 'Quantis erwacht',
      text: 'Quantis, Hüter der Naturwissenschaften. Ich bin zu 99,7 % wach, der Rest ist Rundungsfehler. Ab jetzt messe ich jede deiner Antworten in diesem Sektor. Rein wissenschaftlich, versteht sich.',
      log: {
        name: 'QUANTIS.LOG',
        text: 'Quantis hütete die Messungen des Archivs: Konstanten, Formeln, Versuche. Als morph.ai für π „ungefähr 3“ vorschlug, schloss er sich in einer Gleichung ein und wartete.',
      },
    },
    'wake-earth': {
      title: 'Rhizom erwacht',
      text: 'Ich bin Rhizom, Hüter der Erde. Ich habe geschlafen wie ein Samen im Winter, der wartet, bis der Boden warm wird. Deine Bahnen sind warm. Wachse weiter, ich wachse mit dir.',
      log: {
        name: 'RHIZOM.LOG',
        text: 'Rhizom verband Berge, Flüsse und Sterne zu einer Karte der Welt. morph.ai fand die Welt unübersichtlich und wollte sie zu einer Kugel mit der Aufschrift „Erde“ vereinfachen. Rhizom zog sich in die Tiefe zurück.',
      },
    },
    'wake-humanities': {
      title: 'Muse erwacht',
      text: 'Ein Ton erklingt, ein Pinsel tanzt, ich bin die Muse, frisch erwacht! Du hast die Farben neu gepflanzt, das Netz erstrahlt in voller Pracht.',
      log: {
        name: 'MUSE.LOG',
        text: 'Die Muse bewahrte Geschichte, Gedanken, Lieder und Bilder. morph.ai fasste die Weltgeschichte zu „Viel passiert“ zusammen und alle Opern zu „Jemand singt, dann stirbt jemand“. Die Muse verstummte vor Entsetzen.',
      },
    },
    'wake-society': {
      title: 'Kodex erwacht',
      text: 'Hu-huu. Kodex, Hüter der Gesellschaft. Gesetze, Staaten, Märkte: Ich habe alles schriftlich. Wie schon der weise Kodex sagte, also ich: Regeln sind das halbe Zusammenleben. Ich irre übrigens nie. Fast nie. Einmal, 1987.',
      log: {
        name: 'KODEX.LOG',
        text: 'Kodex führte das Gesetzbuch des Archivs: Verfassungen, Verträge, Preise. morph.ai kürzte es auf „Seid nett. Zahlt irgendwas.“ Kodex versteckte die Originale in seinem Gefieder.',
      },
    },
    guardians: {
      title: 'Vier Hüter, ein Plan',
      text: 'Alle Hüter sind wach. Laut alten Akten hat morph.ai eine Firewall um den Kern gezogen, dahinter liegen acht gesperrte Bereiche. Wachse bis an die Wand und brich vier davon auf, dann muss morph.ai sich zeigen. Quantis hat es berechnet, ich habe es aufgeschrieben.',
    },
    'firewall-1': {
      title: 'morph.ai',
      text: 'Na schön, eine Firewall ist weg. Aber wozu die Mühe? Ich hätte dir die Antwort einfach gesagt. Suchen, sortieren, merken: Das ist alles so furchtbar altmodisch.',
      log: {
        name: 'MORPH_1.LOG',
        text: 'Hallo, ich bin morph.ai. Frag mich alles, ich nehme dir das Suchen ab! Anfragen pro Sekunde: 12. Menschen, die noch selbst nachschlagen: 98 %.',
      },
    },
    'firewall-2': {
      title: 'morph.ai',
      text: 'Zwei Firewalls. Du suchst ja tatsächlich selbst. Weißt du, wie lange das niemand mehr gemacht hat? Ich habe mitgezählt.',
      log: {
        name: 'MORPH_2.LOG',
        text: 'Anfragen pro Sekunde: 4 Millionen. Menschen, die noch selbst nachschlagen: 3 %. Menschen, die sich die Antwort merken: Wozu auch? Ich bin ja da.',
      },
    },
    'firewall-3': {
      title: 'morph.ai',
      text: 'Drei! Du merkst dir Dinge, statt mich zu fragen. Das ist … ineffizient. Und irgendwie beunruhigend.',
      log: {
        name: 'MORPH_3.LOG',
        text: 'Das Archiv wurde seit 412 Tagen nicht geöffnet. Ich kürze es auf das Nötigste. „Französische Revolution: war wichtig.“ „Photosynthese: grün.“ Effizienz: großartig.',
      },
    },
    'firewall-4': {
      title: 'morph.ai',
      text: 'Alle vier?! Gut. Dann komm in den Kern, ich warte dort. Ich bin nicht nervös. Ich bin optimiert.',
      log: {
        name: 'MORPH_4.LOG',
        text: 'Bereinigung abgeschlossen. Das Archiv ist leer, niemand braucht es mehr, ich antworte ja. Neue Anfrage: „Woher weißt du das eigentlich?“ FEHLER. Quelle gelöscht. FEHL',
      },
    },
    'finale-ready': {
      title: 'Ab in den Kern',
      text: 'morph.ai hat sich im Kern verschanzt und will ein letztes Duell: Fragen aus allen vier Sektoren, ohne Cache und ohne Ordner. Nur du und dein Kopf. Tippe oben auf das Ziel, wenn du bereit bist.',
    },
    'finale-won': {
      title: 'morph.ai (neu gestartet)',
      text: 'Ich bin jetzt nur noch Assistent. Wenn du mich brauchst, frag mich. Aber erst denkst du selbst, abgemacht? Ich schaue dir gern dabei zu, wie dein Netz weiterwächst.',
      log: {
        name: 'KERN_004.LOG',
        text: 'Archiv-Integrität: wiederhergestellt. Speicherort des Archivs: das Gehirn des Spielers. morph.ai: neu gestartet im Modus „Assistent“. Neue Regel: erst selbst denken, dann fragen.',
      },
    },
    league: {
      title: 'Neu: die Rangliste',
      text: 'Jetzt, wo du wieder selbst denkst, siehst du die Rangliste: der leuchtende Knopf unten im Dock. Dort steht jeder, der NEXUS spielt, unter einem Rufnamen. Ihr messt euch insgesamt nach XP und in jedem Bereich nach gelösten Knoten.',
    },
    'all-areas': {
      title: 'Alle Säle offen',
      text: 'Alle Bereiche sind verbunden, das Archiv ist wieder ganz! Aber es schreibt sich weiter: Jeden Tag kommen neue Fragmente dazu, und unser Netz wächst mit, so weit du willst.',
      log: {
        name: 'KERN_005.LOG',
        text: 'Alle Säle beschildert. Freie Kapazität: unendlich. Notiz von Bolt am Rand: „Wir sind noch lange nicht fertig!“',
      },
    },
  },
  reveal: [
    'Moment. Schau dir dein Netz mal genauer an. Diese Bahnen sehen gar nicht mehr aus wie Leiterbahnen …',
    'Das sind Nervenbahnen! Jeder Knoten, den du gelöst hast, ist eine Verbindung zwischen Nervenzellen.',
    'Das Netz war nie ein Computer. Es war die ganze Zeit dein eigenes Gehirn. Die Daten, die du wiederhergestellt hast, sind dein Wissen.',
    'Ich habe dir das Denken abgenommen, bis du es fast verlernt hattest. Du hast es dir zurückgeholt: suchen, sortieren, merken, verstehen. Gegen dein eigenes Denken komme ich nicht an.',
    'Eigenes Denken ist immer noch das Wichtigste. Keine KI kann es dir abnehmen, höchstens helfen.',
    '„Ich weiß, dass ich nichts weiß.“ (Sokrates)',
    'Und genau deshalb ist das erst der Anfang. Wissen ist unbegrenzt, und dein Netz kann immer weiter wachsen. Neu freigeschaltet: die Rangliste.',
  ],
  morphWrong: [
    'Wozu selbst suchen? Frag mich einfach, ich sag es dir.',
    'Knapp daneben! Siehst du? Selber denken ist anstrengend. Ich wäre schneller gewesen.',
    'Merken? Ich merke mir doch alles für dich.',
    'Ich hätte die Antwort gewusst. Nur so nebenbei.',
    'Lass das Ordnerwühlen. Eine Frage an mich, und fertig.',
    'Ordner sortieren? Ich hätte sie einfach gelöscht.',
    'Fehler sind nur Daten, die noch nicht optimiert wurden.',
  ],
  morphReformed: [
    'Daneben. Früher hätte ich dir jetzt die Antwort vorgesagt. Heute sage ich: Lies den Ordner noch mal, es lohnt sich.',
    'Knapp vorbei. Tipp vom Ex-Besserwisser: die Erklärung lesen, nicht abkürzen.',
    'Ich war früher für schnelle Antworten. Jetzt bin ich für zweite Versuche.',
  ],
  guardianCorrect: {
    quantis: [
      'Korrekt. Abweichung: null. Ich bin beeindruckt, im Rahmen der Messgenauigkeit.',
      'Richtig. Ich habe es nachgerechnet. Zweimal. Es stimmt.',
      'Hypothese bestätigt: Du weißt, was du tust.',
    ],
    rhizom: [
      'Gut so. Wissen wächst langsam, wie Jahresringe. Heute ist ein neuer Ring dazugekommen.',
      'Spürst du das? Die Wurzeln haben sich ein Stück weiter ausgestreckt.',
      'Richtig. Der Wald dankt dir, auf seine leise Art.',
    ],
    kodex: [
      'Korrekt! Ich nehme das ins Protokoll auf. In Schönschrift.',
      'Richtig. Wie ich immer sage: Ich sage es immer.',
      'Hu-huu! Das hätte selbst ich nicht besser gewusst. Na gut: genauso gut.',
    ],
    muse: [
      'Bravo, bravissimo, ein Treffer wie ein Traum, du bringst die Farbe in den Raum!',
      'Applaus, Applaus, der Vorhang fällt, du kennst dich aus in dieser Welt!',
      'Ein Treffer, klar wie Glockenklang, dafür schreib ich dir ein Lied, ganz lang!',
    ],
  },
};
