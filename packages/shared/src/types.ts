export type Sector = 'science' | 'nature' | 'culture' | 'history';

export type FragmentKind = 'key' | 'context' | 'decoy';

export interface Fragment {
  id: string;
  /** Short label shown on the debris piece so players can choose what to collect. */
  hint: string;
  text: string;
  kind: FragmentKind;
}

export type QuestionType = 'choice' | 'estimate' | 'order';

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

export type Question = ChoiceQuestion | EstimateQuestion | OrderQuestion;

export type Answer =
  | { type: 'choice'; index: number }
  | { type: 'estimate'; value: number }
  | { type: 'order'; items: string[] };

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
  /** Leitner box for damaged nodes (1..4). */
  box: number;
  /** ISO day (YYYY-MM-DD) when a damaged node is due again. */
  dueDay?: string;
}

export interface NetworkState {
  nodes: Record<string, NetNode>;
  /** Disturbed topic areas scattered on the map; see `outposts.ts`. */
  outposts?: import('./outposts').Outpost[];
  /** Bosses on the borders between sectors; see `boss.ts`. */
  firewalls?: import('./boss').Firewall[];
  /** Question ids already used by a node (solved or open). */
  usedQuestions: string[];
}
