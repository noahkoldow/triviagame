import type { Lang } from './lang';

export type Sector = 'science' | 'earth' | 'humanities' | 'society';

export type FragmentKind = 'key' | 'context' | 'decoy';

/**
 * What a file in a cache folder is: a note, a short article, an image (a chart the game draws),
 * a profile (a fact sheet of a thing, place or person), a quote from a source, or a mail.
 */
export type FileKind = 'note' | 'article' | 'image' | 'profile' | 'quote' | 'mail';

/** An image the game draws itself from a small description (no photos, no image model). */
export type ChartSpec =
  | { chart: 'bars'; title: string; unit?: string; items: { label: string; value: number }[] }
  | { chart: 'timeline'; title: string; events: { label: string; year: number }[] }
  | { chart: 'table'; title: string; columns: string[]; rows: string[][] }
  /** A value over the years, e.g. a concentration or a population. */
  | { chart: 'line'; title: string; unit?: string; points: { year: number; value: number }[] }
  /** Shares of a whole in percent; they add up to 100. */
  | { chart: 'pie'; title: string; items: { label: string; value: number }[] }
  /** Steps of a process; `cycle` leads the last step back to the first. */
  | { chart: 'flow'; title: string; steps: string[]; cycle?: boolean };

/** One file inside a cache folder. */
export interface FragmentFile {
  name: string;
  kind: FileKind;
  /** Notes, articles, quotes and mails; paragraphs of an article are separated by a blank line. */
  text?: string;
  /** Where an article comes from; who said or wrote a quote, and where. */
  source?: string;
  /** Profiles: label and value of every line. */
  fields?: [string, string][];
  /** Mails: sender and subject. */
  from?: string;
  subject?: string;
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

export type QuestionType = 'choice' | 'estimate' | 'order' | 'truefalse' | 'match' | 'cloze' | 'multi' | 'sort' | 'spot';

interface QuestionBase {
  id: string;
  /** Taxonomy area, e.g. "physics". Its sector is the main sector. */
  area: string;
  /**
   * The language a question from the server is written in. Built-in questions have none: they
   * exist in every language under the same id (German source, translations in `i18n/`).
   */
  lang?: Lang;
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

/** Several right options: the player has to pick all of them and nothing else. */
export interface MultiQuestion extends QuestionBase {
  type: 'multi';
  options: string[];
  /** Indices of the right options, ascending. */
  answers: number[];
}

/** Items to file into folders: every item belongs to exactly one group. */
export interface SortQuestion extends QuestionBase {
  type: 'sort';
  groups: string[];
  /** Each item with the index of its group. */
  items: [string, number][];
}

/** A short text of statements of which exactly one is wrong; the player finds it. */
export interface SpotQuestion extends QuestionBase {
  type: 'spot';
  lines: string[];
  /** Index of the wrong statement. */
  wrong: number;
}

export type Question =
  | ChoiceQuestion
  | MultiQuestion
  | SortQuestion
  | SpotQuestion
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
  | { type: 'cloze'; words: string[] }
  /** indices into the question's own (unshuffled) options */
  | { type: 'multi'; indices: number[] }
  /** item → the group index the player filed it in */
  | { type: 'sort'; groups: Record<string, number> }
  | { type: 'spot'; index: number };

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
  /** Links between two related areas the player knows well; see `synapses.ts`. */
  synapses?: import('./synapses').Synapse[];
  /** Failed synapse probes: pair id → the day of the last one and how many there were. */
  synapseTries?: Record<string, { day: string; attempts: number }>;
  /** Question ids already used by a node (solved or open). */
  usedQuestions: string[];
  /** Version of the placement rules the nodes were placed with (`LAYOUT_VERSION`); none before D60. */
  layout?: number;
}
