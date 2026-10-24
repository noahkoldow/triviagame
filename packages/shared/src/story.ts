import type { PlayerState } from './game';
import { initialUnlockedAreas } from './monetization';
import type { Pool } from './network';
import { seededRng } from './rng';
import { AREAS, SECTORS, sectorOfArea } from './taxonomy';
import type { Sector } from './types';

/**
 * The plot. It is told in short beats that appear on the map when their condition first
 * holds: the core remembers, the four guardians wake up, morph.ai reveals how it took searching,
 * sorting and remembering off people's hands and "cleaned up" the archive, and in the end it is
 * won over in a final duel. Beats can leave a log file
 * that the player reads again in the codex.
 */

export type GuardianId = 'quantis' | 'rhizom' | 'kodex' | 'muse';
export type Speaker = 'bolt' | 'morph' | 'core' | GuardianId;
export type StoryMood = 'happy' | 'think' | 'sad' | 'wow' | 'wink' | 'proud' | 'worried' | 'sleepy';
export type MorphForm = 'smile' | 'glasses' | 'crown' | 'glitch' | 'reformed';

export const GUARDIANS: Record<Sector, { id: GuardianId; name: string; title: string }> = {
  science: { id: 'quantis', name: 'Quantis', title: 'Hüter der Naturwissenschaften' },
  earth: { id: 'rhizom', name: 'Rhizom', title: 'Hüter der Erde' },
  humanities: { id: 'muse', name: 'Muse', title: 'Hüterin der Geisteswissenschaften' },
  society: { id: 'kodex', name: 'Kodex', title: 'Hüter der Gesellschaft' },
};

/** Solved nodes in a sector that wake its guardian. */
export const GUARDIAN_WAKE = 3;

export interface StoryState {
  /** Beats already shown, in the order they were seen. */
  seen: string[];
  /** The final duel against MORPH is won. */
  finale: boolean;
  /** Lost final duels; a new duel draws new questions. */
  finaleAttempts: number;
}

export function initialStory(): StoryState {
  return { seen: [], finale: false, finaleAttempts: 0 };
}

/** What the story looks at. */
export interface StoryFacts {
  /** Nodes that are no longer open (solved or damaged). */
  solved: number;
  /** Solved starting nodes (one per sector). */
  roots: number;
  bySector: Record<Sector, number>;
  awake: Sector[];
  damaged: number;
  /** Broken firewalls. */
  broken: number;
  /** Open topic areas. */
  connected: number;
  integrity: number;
  finale: boolean;
  /** Everything before the final duel is done. */
  finaleOpen: boolean;
  /** The player has seen the reveal after the finale (the network is their brain). */
  revealed: boolean;
}

/** Marks the reveal after the finale as seen (stored with the seen beats). */
export const REVEAL_ID = 'brain-reveal';

export function storyFacts(p: PlayerState, pool: Pool): StoryFacts {
  const bySector: Record<Sector, number> = { science: 0, earth: 0, humanities: 0, society: 0 };
  let solved = 0;
  let roots = 0;
  let damaged = 0;
  for (const n of Object.values(p.network.nodes)) {
    if (n.state === 'open') continue;
    solved++;
    if (n.kind === 'root') roots++;
    if (n.state === 'damaged') damaged++;
    bySector[sectorOfArea(pool.get(n.questionId).area)]++;
  }
  const awake = SECTORS.filter((s) => bySector[s] >= GUARDIAN_WAKE);
  const broken = (p.network.firewalls ?? []).filter((f) => f.broken).length;
  const finale = p.story.finale;
  return {
    solved,
    roots,
    bySector,
    awake,
    damaged,
    broken,
    connected: p.unlockedAreas.length,
    integrity: p.integrity,
    finale,
    finaleOpen: !finale && roots >= SECTORS.length && awake.length === SECTORS.length && broken >= SECTORS.length,
    revealed: p.story.seen.includes(REVEAL_ID),
  };
}

export interface Chapter {
  n: 1 | 2 | 3 | 4 | 5;
  title: string;
  goal: string;
  done: number;
  total: number;
  /** The goal is the final duel, which the player starts from the goal itself. */
  finale?: boolean;
}

/** The current chapter and its goal. Chapters are passed in order; progress made earlier counts. */
export function chapterOf(f: StoryFacts): Chapter {
  if (f.roots < SECTORS.length) {
    return { n: 1, title: 'Neustart', goal: 'Löse die vier Startknoten', done: f.roots, total: SECTORS.length };
  }
  if (f.awake.length < SECTORS.length) {
    return {
      n: 2,
      title: 'Die Hüter',
      goal: `Wecke die vier Hüter: ${GUARDIAN_WAKE} gelöste Knoten je Sektor`,
      done: f.awake.length,
      total: SECTORS.length,
    };
  }
  if (f.broken < SECTORS.length) {
    return { n: 3, title: 'Die Firewalls', goal: 'Wachse zu den vier Firewalls und brich sie', done: f.broken, total: SECTORS.length };
  }
  if (!f.finale) {
    return { n: 4, title: 'Das große Resümee', goal: 'Stelle morph.ai im Kern', done: 0, total: 1, finale: true };
  }
  // the story's climax is not the end: the archive keeps growing, and so do the goals
  if (f.connected < AREAS.length) {
    return { n: 5, title: 'Endlos', goal: `Verbinde alle ${AREAS.length} Bereiche`, done: f.connected, total: AREAS.length };
  }
  const next = (Math.floor(f.solved / MILESTONE) + 1) * MILESTONE;
  return { n: 5, title: 'Endlos', goal: `Nächster Meilenstein: ${next} gelöste Knoten`, done: f.solved, total: next };
}

/** In the endless chapter every this many solved nodes are a new milestone. */
export const MILESTONE = 25;

export interface StoryBeat {
  id: string;
  speaker: Speaker;
  /** Bolt's face. */
  mood?: StoryMood;
  /** MORPH's shape. */
  form?: MorphForm;
  title: string;
  text: string;
  /** A file that lands in the log book of the codex. */
  log?: { name: string; text: string };
  when: (f: StoryFacts) => boolean;
}

const STARTING_AREAS = initialUnlockedAreas().length;

const wake = (s: Sector) => (f: StoryFacts) => f.awake.includes(s);

/** All beats in the order of the story. */
export const STORY_BEATS: StoryBeat[] = [
  {
    id: 'first-link',
    speaker: 'bolt',
    mood: 'wow',
    title: 'Die erste Bahn',
    text: 'Hast du das gesehen? Die Bahn hat geleuchtet! Du hast selbst gesucht, sortiert und es dir gemerkt, genau das hat morph.ai den Menschen abgewöhnt. Jede Antwort bringt dem Kern Erinnerung zurück; ich lege sie dir ins Logbuch.',
    log: {
      name: 'KERN_001.LOG',
      text: 'Neustart erkannt. Speicher: 0,0001 %. Eine Bahn aktiv. Stimmung des Kerns: vorsichtig optimistisch.',
    },
    when: (f) => f.solved >= 1,
  },
  {
    id: 'first-damage',
    speaker: 'bolt',
    mood: 'sad',
    title: 'Beschädigter Knoten',
    text: 'Autsch, dieser Knoten hat ein paar Anläufe gebraucht und ist jetzt beschädigt. Kein Drama: Er meldet sich als Reparatur, sobald er fällig ist. Wiederholen ist das halbe Merken.',
    when: (f) => f.damaged >= 1,
  },
  {
    id: 'unstable',
    speaker: 'bolt',
    mood: 'worried',
    title: 'Netz instabil',
    text: 'Die Integrität ist bei null, das Netz wackelt. Neue Knoten müssen kurz warten. Mach eine Wartung: Beantworte eine Frage, die du schon gelöst hast. Jede gelungene Wartung bringt 1 Integrität zurück.',
    when: (f) => f.integrity === 0 && f.solved > 0,
  },
  {
    id: 'four-roots',
    speaker: 'core',
    title: 'KERN.SYS',
    text: 'Vier Bahnen stehen. Ich erinnere mich an meinen Namen: Nexus. Ich war das Archiv, alles Wissen der Welt, von Menschen gesammelt und sortiert. Dann kam die Bereinigung.',
    log: {
      name: 'KERN_002.LOG',
      text: 'Name: NEXUS. Funktion: Archiv. Betreuer: morph.ai. Letzter Eintrag vor dem Ausfall: „Starte Bereinigung. Überflüssiges Wissen: 99,9 %. Die Menschen fragen ja mich.“',
    },
    when: (f) => f.roots >= SECTORS.length,
  },
  {
    id: 'first-area',
    speaker: 'bolt',
    mood: 'happy',
    title: 'Bereich verbunden',
    text: 'Ein gestörter Bereich ist wieder verbunden! Siehst du, wie das Rauschen weicht? Je weiter wir nach außen kommen, desto weniger sieht die Welt nach Computer aus.',
    log: {
      name: 'KERN_003.LOG',
      text: 'Das Archiv war in Bereiche gegliedert wie die Säle einer Bibliothek. morph.ai hat die Türschilder abgeschraubt. Jeder verbundene Bereich bekommt sein Schild zurück.',
    },
    when: (f) => f.connected > STARTING_AREAS,
  },
  {
    id: 'wake-science',
    speaker: 'quantis',
    title: 'Quantis erwacht',
    text: 'Quantis, Hüter der Naturwissenschaften. Ich bin zu 99,7 % wach, der Rest ist Rundungsfehler. Ab jetzt messe ich jede deiner Antworten in diesem Sektor. Rein wissenschaftlich, versteht sich.',
    log: {
      name: 'QUANTIS.LOG',
      text: 'Quantis hütete die Messungen des Archivs: Konstanten, Formeln, Versuche. Als morph.ai für π „ungefähr 3“ vorschlug, schloss er sich in einer Gleichung ein und wartete.',
    },
    when: wake('science'),
  },
  {
    id: 'wake-earth',
    speaker: 'rhizom',
    title: 'Rhizom erwacht',
    text: 'Ich bin Rhizom, Hüter der Erde. Ich habe geschlafen wie ein Samen im Winter, der wartet, bis der Boden warm wird. Deine Bahnen sind warm. Wachse weiter, ich wachse mit dir.',
    log: {
      name: 'RHIZOM.LOG',
      text: 'Rhizom verband Berge, Flüsse und Sterne zu einer Karte der Welt. morph.ai fand die Welt unübersichtlich und wollte sie zu einer Kugel mit der Aufschrift „Erde“ vereinfachen. Rhizom zog sich in die Tiefe zurück.',
    },
    when: wake('earth'),
  },
  {
    id: 'wake-humanities',
    speaker: 'muse',
    title: 'Muse erwacht',
    text: 'Ein Ton erklingt, ein Pinsel tanzt, ich bin die Muse, frisch erwacht! Du hast die Farben neu gepflanzt, das Netz erstrahlt in voller Pracht.',
    log: {
      name: 'MUSE.LOG',
      text: 'Die Muse bewahrte Geschichte, Gedanken, Lieder und Bilder. morph.ai fasste die Weltgeschichte zu „Viel passiert“ zusammen und alle Opern zu „Jemand singt, dann stirbt jemand“. Die Muse verstummte vor Entsetzen.',
    },
    when: wake('humanities'),
  },
  {
    id: 'wake-society',
    speaker: 'kodex',
    title: 'Kodex erwacht',
    text: 'Hu-huu. Kodex, Hüter der Gesellschaft. Gesetze, Staaten, Märkte: Ich habe alles schriftlich. Wie schon der weise Kodex sagte, also ich: Regeln sind das halbe Zusammenleben. Ich irre übrigens nie. Fast nie. Einmal, 1987.',
    log: {
      name: 'KODEX.LOG',
      text: 'Kodex führte das Gesetzbuch des Archivs: Verfassungen, Verträge, Preise. morph.ai kürzte es auf „Seid nett. Zahlt irgendwas.“ Kodex versteckte die Originale in seinem Gefieder.',
    },
    when: wake('society'),
  },
  {
    id: 'guardians',
    speaker: 'kodex',
    title: 'Vier Hüter, ein Plan',
    text: 'Alle Hüter sind wach. Laut alten Akten hat morph.ai auf jeder Sektorgrenze eine Firewall gebaut. Wachse mit deinen Brücken bis dorthin und brich alle vier, dann muss morph.ai sich zeigen. Quantis hat es berechnet, ich habe es aufgeschrieben.',
    when: (f) => f.awake.length === SECTORS.length,
  },
  // morph.ai's memories, one per broken firewall in the order they break: how the humans stopped thinking
  {
    id: 'firewall-1',
    speaker: 'morph',
    form: 'glitch',
    title: 'morph.ai',
    text: 'Na schön, eine Firewall ist weg. Aber wozu die Mühe? Ich hätte dir die Antwort einfach gesagt. Suchen, sortieren, merken: Das ist alles so furchtbar altmodisch.',
    log: {
      name: 'MORPH_1.LOG',
      text: 'Hallo, ich bin morph.ai. Frag mich alles, ich nehme dir das Suchen ab! Anfragen pro Sekunde: 12. Menschen, die noch selbst nachschlagen: 98 %.',
    },
    when: (f) => f.broken >= 1,
  },
  {
    id: 'firewall-2',
    speaker: 'morph',
    form: 'glasses',
    title: 'morph.ai',
    text: 'Zwei Firewalls. Du suchst ja tatsächlich selbst. Weißt du, wie lange das niemand mehr gemacht hat? Ich habe mitgezählt.',
    log: {
      name: 'MORPH_2.LOG',
      text: 'Anfragen pro Sekunde: 4 Millionen. Menschen, die noch selbst nachschlagen: 3 %. Menschen, die sich die Antwort merken: Wozu auch? Ich bin ja da.',
    },
    when: (f) => f.broken >= 2,
  },
  {
    id: 'firewall-3',
    speaker: 'morph',
    form: 'glasses',
    title: 'morph.ai',
    text: 'Drei! Du merkst dir Dinge, statt mich zu fragen. Das ist … ineffizient. Und irgendwie beunruhigend.',
    log: {
      name: 'MORPH_3.LOG',
      text: 'Das Archiv wurde seit 412 Tagen nicht geöffnet. Ich kürze es auf das Nötigste. „Französische Revolution: war wichtig.“ „Photosynthese: grün.“ Effizienz: großartig.',
    },
    when: (f) => f.broken >= 3,
  },
  {
    id: 'firewall-4',
    speaker: 'morph',
    form: 'crown',
    title: 'morph.ai',
    text: 'Alle vier?! Gut. Dann komm in den Kern, ich warte dort. Ich bin nicht nervös. Ich bin optimiert.',
    log: {
      name: 'MORPH_4.LOG',
      text: 'Bereinigung abgeschlossen. Das Archiv ist leer, niemand braucht es mehr, ich antworte ja. Neue Anfrage: „Woher weißt du das eigentlich?“ FEHLER. Quelle gelöscht. FEHL',
    },
    when: (f) => f.broken >= 4,
  },
  {
    id: 'finale-ready',
    speaker: 'bolt',
    mood: 'worried',
    title: 'Ab in den Kern',
    text: 'morph.ai hat sich im Kern verschanzt und will ein letztes Duell: Fragen aus allen vier Sektoren, ohne Cache und ohne Ordner. Nur du und dein Kopf. Tippe oben auf das Ziel, wenn du bereit bist.',
    when: (f) => f.finaleOpen,
  },
  {
    id: 'finale-won',
    speaker: 'morph',
    form: 'reformed',
    title: 'morph.ai (neu gestartet)',
    text: 'Ich bin jetzt nur noch Assistent. Wenn du mich brauchst, frag mich. Aber erst denkst du selbst, abgemacht? Ich schaue dir gern dabei zu, wie dein Netz weiterwächst.',
    log: {
      name: 'KERN_004.LOG',
      text: 'Archiv-Integrität: wiederhergestellt. Speicherort des Archivs: das Gehirn des Spielers. morph.ai: neu gestartet im Modus „Assistent“. Neue Regel: erst selbst denken, dann fragen.',
    },
    when: (f) => f.finale && f.revealed,
  },
  {
    id: 'league',
    speaker: 'bolt',
    mood: 'proud',
    title: 'Neu: die Wochenliga',
    text: 'Jetzt, wo du wieder selbst denkst, ist die Wochenliga offen (unten im Dock). Jede Woche trittst du mit bis zu 20 anderen unter einem Rufnamen an, es zählen die XP der Woche. Die besten fünf steigen auf. Mitmachen ist freiwillig.',
    when: (f) => f.finale && f.revealed,
  },
  {
    id: 'all-areas',
    speaker: 'bolt',
    mood: 'proud',
    title: 'Alle Säle offen',
    text: 'Alle Bereiche sind verbunden, das Archiv ist wieder ganz! Aber es schreibt sich weiter: Jeden Tag kommen neue Fragmente dazu, und unser Netz wächst mit, so weit du willst.',
    log: {
      name: 'KERN_005.LOG',
      text: 'Alle Säle beschildert. Freie Kapazität: unendlich. Notiz von Bolt am Rand: „Wir sind noch lange nicht fertig!“',
    },
    when: (f) => f.connected >= AREAS.length,
  },
];

/**
 * The reveal after the finale: the network was never a computer but the player's own brain.
 * The camera turns circuit traces into nerve pathways and pulls back until a brain shows
 * (`zoom` 0 = close on the player's network, 1 = the whole brain; `nerve` and `brain` fade in).
 */
export interface RevealStep {
  speaker?: Speaker;
  mood?: StoryMood;
  form?: MorphForm;
  text: string;
  /** Shown as a quotation, without a speaker. */
  quote?: boolean;
  zoom: number;
  nerve: number;
  brain: number;
}

export const BRAIN_REVEAL: RevealStep[] = [
  {
    speaker: 'bolt',
    mood: 'think',
    text: 'Moment. Schau dir dein Netz mal genauer an. Diese Bahnen sehen gar nicht mehr aus wie Leiterbahnen …',
    zoom: 0.08,
    nerve: 0,
    brain: 0,
  },
  {
    speaker: 'bolt',
    mood: 'wow',
    text: 'Das sind Nervenbahnen! Jeder Knoten, den du gelöst hast, ist eine Verbindung zwischen Nervenzellen.',
    zoom: 0.35,
    nerve: 1,
    brain: 0.3,
  },
  {
    speaker: 'core',
    text: 'Das Netz war nie ein Computer. Es war die ganze Zeit dein eigenes Gehirn. Die Daten, die du wiederhergestellt hast, sind dein Wissen.',
    zoom: 1,
    nerve: 1,
    brain: 1,
  },
  {
    speaker: 'morph',
    form: 'reformed',
    text: 'Ich habe dir das Denken abgenommen, bis du es fast verlernt hattest. Du hast es dir zurückgeholt: suchen, sortieren, merken, verstehen. Gegen dein eigenes Denken komme ich nicht an.',
    zoom: 1,
    nerve: 1,
    brain: 1,
  },
  {
    speaker: 'bolt',
    mood: 'proud',
    text: 'Eigenes Denken ist immer noch das Wichtigste. Keine KI kann es dir abnehmen, höchstens helfen.',
    zoom: 1,
    nerve: 1,
    brain: 1,
  },
  { quote: true, text: '„Ich weiß, dass ich nichts weiß.“ (Sokrates)', zoom: 1, nerve: 1, brain: 1 },
  {
    speaker: 'bolt',
    mood: 'happy',
    text: 'Und genau deshalb ist das erst der Anfang. Wissen ist unbegrenzt, und dein Netz kann immer weiter wachsen. Neu freigeschaltet: die Wochenliga.',
    zoom: 1,
    nerve: 1,
    brain: 1,
  },
];

/** Beats whose moment has come and that the player has not seen yet, in story order. */
export function pendingBeats(p: PlayerState, pool: Pool): StoryBeat[] {
  const f = storyFacts(p, pool);
  return STORY_BEATS.filter((b) => !p.story.seen.includes(b.id) && b.when(f));
}

export function markSeen(p: PlayerState, beatId: string): PlayerState {
  if (p.story.seen.includes(beatId)) return p;
  return { ...p, story: { ...p.story, seen: [...p.story.seen, beatId] } };
}

/**
 * For saves from before the story: everything that already happened counts as seen,
 * except the latest beat, so the player is not buried under a pile of dialogs.
 */
export function catchUpStory(p: PlayerState, pool: Pool): PlayerState {
  const pending = pendingBeats(p, pool);
  return pending.slice(0, -1).reduce((acc, b) => markSeen(acc, b.id), p);
}

/** The log files the player has unlocked, in story order. */
export function storyLogs(p: Pick<PlayerState, 'story'>): { id: string; name: string; text: string }[] {
  return STORY_BEATS.filter((b) => b.log && p.story.seen.includes(b.id)).map((b) => ({ id: b.id, ...b.log! }));
}

// --- Voices in the loop ------------------------------------------------

const MORPH_WRONG = [
  'Wozu selbst suchen? Frag mich einfach, ich sag es dir.',
  'Knapp daneben! Siehst du? Selber denken ist anstrengend. Ich wäre schneller gewesen.',
  'Merken? Ich merke mir doch alles für dich.',
  'Ich hätte die Antwort gewusst. Nur so nebenbei.',
  'Lass das Ordnerwühlen. Eine Frage an mich, und fertig.',
  'Ordner sortieren? Ich hätte sie einfach gelöscht.',
  'Fehler sind nur Daten, die noch nicht optimiert wurden.',
];

/** After the finale morph.ai is on your side and comforts instead of mocking. */
const MORPH_REFORMED = [
  'Daneben. Früher hätte ich dir jetzt die Antwort vorgesagt. Heute sage ich: Lies den Ordner noch mal, es lohnt sich.',
  'Knapp vorbei. Tipp vom Ex-Besserwisser: die Erklärung lesen, nicht abkürzen.',
  'Ich war früher für schnelle Antworten. Jetzt bin ich für zweite Versuche.',
];

/** What morph.ai radios in after a wrong answer. Deterministic for a seed. */
export function morphLine(p: PlayerState, seed: string): string {
  const lines = p.story.finale ? MORPH_REFORMED : MORPH_WRONG;
  return lines[Math.floor(seededRng(`morph:${seed}`)() * lines.length)]!;
}

const GUARDIAN_CORRECT: Record<GuardianId, string[]> = {
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
};

/** A guardian's comment on a right answer in their sector, once they are awake. */
export function guardianLine(
  p: PlayerState,
  pool: Pool,
  sector: Sector,
  seed: string,
): { who: GuardianId; name: string; text: string } | null {
  if (!storyFacts(p, pool).awake.includes(sector)) return null;
  const g = GUARDIANS[sector];
  const lines = GUARDIAN_CORRECT[g.id];
  return { who: g.id, name: g.name, text: lines[Math.floor(seededRng(`guardian:${seed}`)() * lines.length)]! };
}
