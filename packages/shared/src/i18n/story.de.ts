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
    'first-wall': {
      title: 'Eine Wand im Rauschen',
      text: 'Da, am Rand! Rote Hexagons, hochgezogen wie eine Mauer. Das ist eine Firewall von morph.ai, meine Antenne kribbelt. Dahinter summt ein ganzer Saal voller Daten. Wachsen wir bis direkt an die Wand, können wir sie angreifen.',
      log: {
        name: 'SPERRE.LOG',
        text: 'Sperre aktiv: FIREWALL. Errichtet von: morph.ai. Gesperrt: 8 Säle. Begründung: „Wer etwas wissen will, fragt ja mich.“',
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
      text: 'Quantis, Hüter der Naturwissenschaften. Zu 99,7 % wach, der Rest ist Rundungsfehler. Messung eins: Hinter morph.ais Firewall liegen zwei Säle meines Sektors, Biologie & Medizin und Technologie & IT. Allein komme ich nicht hinein. Hilfst du mir? Ich kämpfe an deiner Seite.',
      log: {
        name: 'QUANTIS.LOG',
        text: 'Quantis hütete die Messungen des Archivs: Konstanten, Formeln, Versuche. Als morph.ai für π „ungefähr 3“ vorschlug, schloss er sich in einer Gleichung ein und wartete.',
      },
    },
    'wake-earth': {
      title: 'Rhizom erwacht',
      text: 'Ich bin Rhizom, Hüter der Erde. Deine Bahnen sind warm wie Frühling. Jenseits von morph.ais Firewall schlafen zwei meiner Säle, Klima & Umwelt und Astronomie, wie Wurzeln unter einem Stein. Hilf mir, den Stein zu heben: Wachse bis an die Wand, und ich kämpfe an deiner Seite.',
      log: {
        name: 'RHIZOM.LOG',
        text: 'Rhizom verband Berge, Flüsse und Sterne zu einer Karte der Welt. morph.ai fand die Welt unübersichtlich und wollte sie zu einer Kugel mit der Aufschrift „Erde“ vereinfachen. Rhizom zog sich in die Tiefe zurück.',
      },
    },
    'wake-humanities': {
      title: 'Muse erwacht',
      text: 'Ein Ton erklingt, ein Pinsel tanzt, ich bin die Muse, frisch erwacht! Doch hinter morph.ais Wand verschanzt schweigt Kunst, Literatur & Musik in tiefer Nacht, und Philosophie & Religion hält dort stumme Wacht. Komm, hilf mir, sie zu befrein, an der Wand werd ich bei dir sein!',
      log: {
        name: 'MUSE.LOG',
        text: 'Die Muse bewahrte Geschichte, Gedanken, Lieder und Bilder. morph.ai fasste die Weltgeschichte zu „Viel passiert“ zusammen und alle Opern zu „Jemand singt, dann stirbt jemand“. Die Muse verstummte vor Entsetzen.',
      },
    },
    'wake-society': {
      title: 'Kodex erwacht',
      text: 'Hu-huu. Kodex, Hüter der Gesellschaft. Hinter morph.ais Firewall Wirtschaft & Finanzen sowie Recht & Gesellschaft, unter Verschluss. Rechtswidrig, versteht sich. Ich beantrage deine Hilfe, ich vertrete dich vor Ort. Ich irre übrigens nie. Fast nie. Einmal, 1987.',
      log: {
        name: 'KODEX.LOG',
        text: 'Kodex führte das Gesetzbuch des Archivs: Verfassungen, Verträge, Preise. morph.ai kürzte es auf „Seid nett. Zahlt irgendwas.“ Kodex versteckte die Originale in seinem Gefieder.',
      },
    },
    guardians: {
      title: 'Vier Hüter, ein Plan',
      text: 'Alle Hüter sind wach, und jeder hat dir seine zwei Säle hinter der Firewall genannt: acht sind es. Wachse bis an die Wand und brich vier davon auf, dann muss morph.ai sich zeigen. Quantis hat es berechnet, ich habe es aufgeschrieben.',
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
    'core-glitch': {
      title: 'KERN.SYS: Störung',
      text: 'Störung im Kern. Ein fremdes Signal überlagert meine Bahnen: »…n█cht n█rvös … d█r K█rn g█hört m█r … ach█ Fr█gen, al█e v█er S█ktoren …« Signal verloren. Die Quelle: mitten im Kern. Dort wartet etwas auf uns.',
      log: {
        name: 'KERN_ECHO.LOG',
        text: 'Rekonstruierte Aufzeichnung aus dem Kern: „Fällt die vierte Wand, bleibt nur der Kern. Dann stelle ICH die Fragen. Kein Cache, keine Ordner. Mal sehen, was dann noch übrig ist.“',
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
  guardianFight: {
    quantis: {
      hit: ['Treffer. Schicht um 100 % reduziert.', 'Resonanzfrequenz gefunden. Noch einmal!', 'Exakt. Ich ziele, du lieferst die Energie.'],
      hurt: ['Fehler registriert. Das Rauschen kitzelt meine Nachkommastellen.', 'Abweichung. Kein Grund zur Panik, Panik ist nicht messbar.'],
      breach: 'Die Wand ist gefallen. Reproduzierbar? Hoffentlich nicht nötig.',
    },
    rhizom: {
      hit: ['Wie Wurzeln durch Fels: langsam, aber unaufhaltsam.', 'Der Stein bricht, und Licht fällt auf den Waldboden.', 'Spürst du es? Die Wand atmet schwerer.'],
      hurt: ['Das Rauschen legt sich wie Frost auf meine Blätter. Der Frühling kommt trotzdem.', 'Ein Sturm, nur ein Sturm. Bäume biegen sich und stehen wieder auf.'],
      breach: 'Die Wand ist gefallen. Meine Säle atmen wieder, wie Erde nach dem Regen.',
    },
    kodex: {
      hit: ['Einspruch stattgegeben! Eine Schicht weniger.', 'Paragraf eins: Wissen schlägt Wand. Paragraf zwei: siehe Paragraf eins.', 'Hu-huu! Protokolliert, gestempelt, eingerissen.'],
      hurt: ['Formfehler! Das Rauschen zerzaust mir die Federn.', 'Abgelehnt. Kein Urteil ist endgültig, wir gehen in Berufung.'],
      breach: 'Urteil verkündet: Die Wand ist rechtswidrig und hiermit eingerissen. Hu-huu!',
    },
    muse: {
      hit: ['Ein Schlag, ein Klang, die Mauer bebt, weil Kunst in jedem Strahle lebt!', 'Bravo, ein Akkord aus Licht, die Wand zerspringt, sie hält dich nicht!', 'Ein Pinselstrich, ein Strahl aus Gold, ein Stein, der von der Mauer rollt!'],
      hurt: ['O weh, ein Misston, schrill und kalt, doch meine Stimme hat noch Halt!', 'Das Rauschen färbt mein Bild ganz grau, doch ich mal weiter, ganz genau!'],
      breach: 'Der Vorhang fällt, die Mauer bricht, und meine Säle sehn das Licht!',
    },
  },
  walls: {
    technology: {
      morph: 'Technik verstehen? Ich BIN die Technik. Du musst nur auf den Knopf drücken.',
      guardian: 'Jeder Chip gehorcht der Physik, auch morph.ai. Beweisen wir es.',
    },
    biomedicine: {
      morph: 'Biologie & Medizin? Hab ich zusammengefasst: Iss Gemüse, schlaf genug. Mehr musst du nicht wissen.',
      guardian: 'Herzschlag, Zellteilung, Impfstoffe: alles messbar, alles wahr. Reiß die Wand ein, ich protokolliere.',
    },
    climate: {
      morph: 'Das Wetter habe ich auf „wechselhaft“ vereinfacht. Stimmt immer.',
      guardian: 'Hinter dieser Wand atmet die Erde. Spürst du den Wind durch die Fugen? Lass ihn herein.',
    },
    astronomy: {
      morph: 'Die Sterne? Viele, weit weg, leuchten. Ich habe dir die Mühe erspart.',
      guardian: 'Die Sterne leuchten seit Milliarden Jahren. Diese Wand steht erst seit gestern.',
    },
    arts: {
      morph: 'Alle Bücher der Welt in einem Satz: Jemand will etwas, dann passiert was. Gern geschehen.',
      guardian: 'Kein Lied verstummt für alle Zeit, kein Bild verblasst im Glanz, reiß ein die Wand, mach dich bereit, und hol sie zurück in den Tanz!',
    },
    philosophy: {
      morph: 'Philosophie sind nur Fragen ohne Antworten. Ich habe nur Antworten. Wozu da noch fragen?',
      guardian: 'Wer fragt, der denkt, wer denkt, ist frei, schlag zu, dann ist die Mauer vorbei!',
    },
    economy: {
      morph: 'Wirtschaft & Finanzen hab ich gekürzt auf: „Zahlt irgendwas.“ Klappt prima.',
      guardian: 'Einspruch! Dieser Saal wurde ohne Beschluss gesperrt. Vollstrecken wir das Urteil.',
    },
    law: {
      morph: 'Recht & Gesellschaft? „Seid nett.“ Den Rest der Paragrafen habe ich entsorgt.',
      guardian: 'Paragraf eins: Wissen gehört allen. Paragraf zwei: Diese Wand ist rechtswidrig. Hu-huu!',
    },
  },
  wallBolt: 'Der Hüter dieses Sektors schläft noch. Dann eben wir zwei: Jede richtige Antwort ist ein Stein weniger!',
};
