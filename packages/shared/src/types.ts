export type Sector = 'science' | 'earth' | 'humanities' | 'society';

export type FragmentKind = 'key' | 'context' | 'decoy';

export type FileKind = 'note' | 'article' | 'image';

/** An image the game draws itself from a small description (no photos, no image model). */
export type ChartSpec =
  | { chart: 'bars'; title: string; unit?: string; items: { label: string; value: number }[] }
  | { chart: 'timeline'; title: string; events: { label: string; year: number }[] }
  | { chart: 'table'; title: string; columns: string[]; rows: string[][] };

/** One file inside a cache folder: a note, a short article or an image. */
export interface FragmentFile {
  name: string;
  kind: FileKind;
  /** Notes and articles; paragraphs of an article are separated by a blank line. */
  text?: string;
  /** Where an article comes from. */
  source?: string;
  /** Images. */
  chart?: ChartSpec;
  /** What an image shows, for screen readers and for the search. */
  alt?: string;
}

export interface Fragment {
  id: string;
  /** Short label shown on the debris piece so players can choose what to collect. */
  hint: string;
  text: string;
  kind: FragmentKind;
  /** What lies in the folder in a question. Without files the folder holds one note with `text`. */
  files?: FragmentFile[];
}

export type QuestionType = 'choice' | 'estimate' | 'order' | 'truefalse' | 'match' | 'cloze';

interface QuestionBase {
  id: string;
  /** Taxonomy area, e.g. "physics". Its sector is the main sector. */
  area: string;
  /** Secondary sector weights (0..1), e.g. medicine → { nature: 0.25 }. */
  side?: Partial<Record<Sector, number>>;
  /** Short keyword shown before the question ("Lichtgeschwindigkeit"); it must not give the answer away. */
  topic: string;
  /** One or two sentences about the topic, shown under the keyword; must not give the answer away. */
  intro: string;
  stem: string;
  fragments: Fragment[];
  explanation: string;
  /** 1 (easy) .. 5 (hard) */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Candidate follow-up question ids. */
  deepen: string[];
  bridge: string[];
}

export interface ChoiceQuestion extends QuestionBase {
  type: 'choice';
  options: string[];
  answer: number;
}

export interface EstimateQuestion extends QuestionBase {
  type: 'estimate';
  answer: number;
  /** Relative tolerance, e.g. 0.1 = ±10 %. */
  tolerance: number;
  unit: string;
}

export interface OrderQuestion extends QuestionBase {
  type: 'order';
  /** Items in the correct order. */
  items: string[];
}

/** A statement that is either true or false; the statement is the `stem`. */
export interface TrueFalseQuestion extends QuestionBase {
  type: 'truefalse';
  answer: boolean;
}

/** Pairs to connect: each left item belongs to exactly one right item. */
export interface MatchQuestion extends QuestionBase {
  type: 'match';
  pairs: [string, string][];
}

/**
 * A sentence with gaps. `text` marks them as {0}, {1}, …; `answers` are the right words in order;
 * `bank` holds all words to choose from, the wrong ones included.
 */
export interface ClozeQuestion extends QuestionBase {
  type: 'cloze';
  text: string;
  answers: string[];
  bank: string[];
}

export type Question =
  | ChoiceQuestion
  | EstimateQuestion
  | OrderQuestion
  | TrueFalseQuestion
  | MatchQuestion
  | ClozeQuestion;

export type Answer =
  | { type: 'choice'; index: number }
  | { type: 'estimate'; value: number }
  | { type: 'order'; items: string[] }
  | { type: 'truefalse'; value: boolean }
  /** left item → the right item the player connected it to */
  | { type: 'match'; pairs: Record<string, string> }
  | { type: 'cloze'; words: string[] };

export type NodeKind = 'root' | 'deepen' | 'bridge' | 'debris';
export type NodeState = 'open' | 'solved' | 'damaged';

export interface Vec3 {
  x: number;
  y: number;
  /** Layer depth for the 2.5D look (0 = core plane). */
  z: number;
}

export interface NetNode {
  id: string;
  questionId: string;
  parentId: string | null;
  kind: NodeKind;
  state: NodeState;
  pos: Vec3;
  attempts: number;
  /** Debris fields are locked until opened with gems. */
  locked?: boolean;
  /** Children that were withheld because of wrong answers; they grow after a successful repair. */
  missing?: ('deepen' | 'bridge')[];
  /** Children that found no question yet; they grow as soon as new questions arrive (open end). */
  waiting?: ('deepen' | 'bridge')[];
  /** Leitner box for damaged nodes (1..4). */
  box: number;
  /** ISO day (YYYY-MM-DD) when a damaged node is due again. */
  dueDay?: string;
  /** ISO day of the last maintenance of a solved node (once a day it can win back integrity). */
  maintainedOn?: string;
}

export interface NetworkState {
  nodes: Record<string, NetNode>;
  /** The walls around the outer areas, and where they are broken; see `boss.ts` and `walls.ts`. */
  firewalls?: import('./boss').Firewall[];
  /** Question ids already used by a node (solved or open). */
  usedQuestions: string[];
}
