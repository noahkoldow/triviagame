import type { PlayerState } from './game';
import { STORY_DE } from './i18n/story.de';
import { STORY_EN } from './i18n/story.en';
import { STORY_ES } from './i18n/story.es';
import { STORY_FR } from './i18n/story.fr';
import type { Lang } from './lang';
import { initialUnlockedAreas } from './monetization';
import type { Pool } from './network';
import { seededRng } from './rng';
import { synapseSpots } from './synapses';
import { AREAS, SECTORS, sectorOfArea } from './taxonomy';
import type { Sector } from './types';
import { OUTER_ZONES, WALL_SIGHT, approachOf } from './walls';

/**
 * The plot. It is told in short beats that appear on the map when their condition first
 * holds: the core remembers, the four guardians wake up, morph.ai reveals how it took searching,
 * sorting and remembering off people's hands and "cleaned up" the archive, and in the end it is
 * won over in a final duel. Beats can leave a log file
 * that the player reads again in the codex.
 *
 * The firewalls are foreshadowed before they are fought: Bolt notices the first wall that comes
 * out of the fog, every guardian names the two areas of its sector locked behind it, before
 * each fight morph.ai and the guardian trade words about the area behind the wall
 * (`wallVoices`), and after the third broken wall the core picks up morph.ai preparing the final
 * duel. In a fight the awake guardian stands beside the player and reacts to every answer
 * (`guardianFightLine`); it gives no bonus, it is company.
 *
 * This file holds the logic; the words are in `i18n/story.<lang>.ts`, one file per language.
 */

export type GuardianId = 'quantis' | 'rhizom' | 'kodex' | 'muse';
export type Speaker = 'bolt' | 'morph' | 'core' | GuardianId;
export type StoryMood = 'happy' | 'think' | 'sad' | 'wow' | 'wink' | 'proud' | 'worried' | 'sleepy';
export type MorphForm = 'smile' | 'glasses' | 'crown' | 'glitch' | 'reformed';

/** The guardians keep their names in every language; their titles are in `StoryText`. */
export const GUARDIANS: Record<Sector, { id: GuardianId; name: string }> = {
  science: { id: 'quantis', name: 'Quantis' },
  earth: { id: 'rhizom', name: 'Rhizom' },
  humanities: { id: 'muse', name: 'Muse' },
  society: { id: 'kodex', name: 'Kodex' },
};

/** Solved nodes in a sector that wake its guardian. */
export const GUARDIAN_WAKE = 3;

/** Before the finale opens, this many areas (all twelve) need this many answered nodes each (D76). */
export const FINALE_AREAS = 12;
export const FINALE_AREA_NODES = 3;

/** Everything the story says, in one language. */
export interface StoryText {
  guardianTitles: Record<GuardianId, string>;
  chapters: {
    restart: { title: string; goal: string };
    guardians: { title: string; goal: (wake: number) => string };
    firewalls: { title: string; goal: string };
    finale: { title: string; goal: string; prepare: (nodes: number, areas: number) => string };
    endless: { title: string; connect: (areas: number) => string; milestone: (next: number) => string };
  };
  /** By beat id; a beat that leaves a log file has `log` in every language. */
  beats: Record<string, { title: string; text: string; log?: { name: string; text: string } }>;
  /** One text per step of the reveal (`REVEAL_STEPS`). */
  reveal: string[];
  morphWrong: string[];
  morphReformed: string[];
  guardianCorrect: Record<GuardianId, string[]>;
  /** In a wall fight the guardian of the sector fights beside the player and reacts to every answer. */
  guardianFight: Record<GuardianId, { hit: string[]; hurt: string[]; breach: string }>;
  /** Before a fight, by the area behind the wall (every outer area): morph.ai's taunt and its guardian's answer. */
  walls: Record<string, { morph: string; guardian: string }>;
  /** Bolt's answer while the guardian of the sector still sleeps. */
  wallBolt: string;
  /** What morph.ai says at the start of each phase of the final duel, by its sector (D76). */
  finalePhases: Record<Sector, string>;
}

export const STORY_TEXT: Record<Lang, StoryText> = { de: STORY_DE, en: STORY_EN, fr: STORY_FR, es: STORY_ES };

export function guardianTitle(id: GuardianId, lang: Lang): string {
  return STORY_TEXT[lang].guardianTitles[id];
}

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
  /** Firewalls broken in a fight (bought gaps do not count). */
  broken: number;
  /** Areas with at least `FINALE_AREA_NODES` answered nodes. */
  areasReady: number;
  /** A standing firewall has come out of the fog (a node is within `WALL_SIGHT` cells of it). */
  wallSeen: boolean;
  /** Open topic areas. */
  connected: number;
  /** Synapses between areas, and pairs that could be joined now (see `synapses.ts`). */
  synapses: number;
  synapseReady: number;
  integrity: number;
  finale: boolean;
  /** Everything before the final duel is done. */
  finaleOpen: boolean;
  /** The player has seen the reveal after the finale (the network is their brain). */
  revealed: boolean;
}

/** Marks the reveal after the finale as seen (stored with the seen beats). */
export const REVEAL_ID = 'brain-reveal';
/** Marks that the player tapped the league in the dock after the reveal (stored with the seen beats). */
export const LEAGUE_NOTICED_ID = 'league-noticed';

/** After the reveal the league button glows until the player taps it once, so nobody misses it. */
export function leagueIsNew(p: PlayerState): boolean {
  return p.story.seen.includes(REVEAL_ID) && !p.story.seen.includes(LEAGUE_NOTICED_ID);
}

export function storyFacts(p: PlayerState, pool: Pool): StoryFacts {
  const bySector: Record<Sector, number> = { science: 0, earth: 0, humanities: 0, society: 0 };
  const byArea = new Map<string, number>();
  let solved = 0;
  let roots = 0;
  let damaged = 0;
  for (const n of Object.values(p.network.nodes)) {
    if (n.state === 'open') continue;
    solved++;
    if (n.kind === 'root') roots++;
    if (n.state === 'damaged') damaged++;
    const area = pool.get(n.questionId).area;
    bySector[sectorOfArea(area)]++;
    byArea.set(area, (byArea.get(area) ?? 0) + 1);
  }
  const areasReady = [...byArea.values()].filter((x) => x >= FINALE_AREA_NODES).length;
  const awake = SECTORS.filter((s) => bySector[s] >= GUARDIAN_WAKE);
  const firewalls = p.network.firewalls ?? [];
  const broken = firewalls.filter((f) => f.broken && !f.bought).length;
  const nodes = Object.values(p.network.nodes);
  const wallSeen = firewalls.some((f) => !f.broken && (approachOf(nodes, f.area)?.cells ?? Infinity) <= WALL_SIGHT);
  const finale = p.story.finale;
  return {
    solved,
    roots,
    bySector,
    awake,
    damaged,
    broken,
    areasReady,
    wallSeen,
    connected: p.unlockedAreas.length,
    synapses: p.network.synapses?.length ?? 0,
    synapseReady: synapseSpots(p, pool).length,
    integrity: p.integrity,
    finale,
    finaleOpen:
      !finale && roots >= SECTORS.length && awake.length === SECTORS.length && broken >= SECTORS.length && areasReady >= FINALE_AREAS,
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
export function chapterOf(f: StoryFacts, lang: Lang): Chapter {
  const c = STORY_TEXT[lang].chapters;
  if (f.roots < SECTORS.length) {
    return { n: 1, ...c.restart, done: f.roots, total: SECTORS.length };
  }
  if (f.awake.length < SECTORS.length) {
    return { n: 2, title: c.guardians.title, goal: c.guardians.goal(GUARDIAN_WAKE), done: f.awake.length, total: SECTORS.length };
  }
  if (f.broken < SECTORS.length) {
    return { n: 3, ...c.firewalls, done: f.broken, total: SECTORS.length };
  }
  // the great recap: knowledge in every area first, then the duel
  if (!f.finale && f.areasReady < FINALE_AREAS) {
    return { n: 4, title: c.finale.title, goal: c.finale.prepare(FINALE_AREA_NODES, FINALE_AREAS), done: f.areasReady, total: FINALE_AREAS };
  }
  if (!f.finale) {
    return { n: 4, title: c.finale.title, goal: c.finale.goal, done: 0, total: 1, finale: true };
  }
  // the story's climax is not the end: the archive keeps growing, and so do the goals
  if (f.connected < AREAS.length) {
    return { n: 5, title: c.endless.title, goal: c.endless.connect(AREAS.length), done: f.connected, total: AREAS.length };
  }
  const next = (Math.floor(f.solved / MILESTONE) + 1) * MILESTONE;
  return { n: 5, title: c.endless.title, goal: c.endless.milestone(next), done: f.solved, total: next };
}

/** In the endless chapter every this many solved nodes are a new milestone. */
export const MILESTONE = 25;

/** When and by whom a beat is told; its words are in `StoryText.beats`. */
interface BeatCue {
  id: string;
  speaker: Speaker;
  /** Bolt's face. */
  mood?: StoryMood;
  /** MORPH's shape. */
  form?: MorphForm;
  /** The map zooms out to the two areas of this sector behind the firewall while the beat is shown. */
  focus?: Sector;
  when: (f: StoryFacts) => boolean;
}

/** A beat as the player sees it, in their language. */
export interface StoryBeat extends BeatCue {
  title: string;
  text: string;
  /** A file that lands in the log book of the codex. */
  log?: { name: string; text: string };
}

const STARTING_AREAS = initialUnlockedAreas().length;

const wake = (s: Sector) => (f: StoryFacts) => f.awake.includes(s);

/** All beats in the order of the story. */
export const STORY_CUES: BeatCue[] = [
  { id: 'first-link', speaker: 'bolt', mood: 'wow', when: (f) => f.solved >= 1 },
  { id: 'first-damage', speaker: 'bolt', mood: 'sad', when: (f) => f.damaged >= 1 },
  { id: 'unstable', speaker: 'bolt', mood: 'worried', when: (f) => f.integrity === 0 && f.solved > 0 },
  { id: 'four-roots', speaker: 'core', when: (f) => f.roots >= SECTORS.length },
  { id: 'first-area', speaker: 'bolt', mood: 'happy', when: (f) => f.connected > STARTING_AREAS },
  // the first wall out of the fog (the ring around the core shows early, so not on top of the
  // first beat); once one is broken the moment has passed
  { id: 'first-wall', speaker: 'bolt', mood: 'worried', when: (f) => f.wallSeen && f.solved >= 2 && f.broken === 0 },
  // breadth pays: connected knowledge is worth more
  { id: 'synapse-ready', speaker: 'bolt', mood: 'wow', when: (f) => f.synapseReady > 0 && f.synapses === 0 },
  { id: 'first-synapse', speaker: 'core', when: (f) => f.synapses >= 1 },
  // every guardian names the two halls of its sector behind the firewall and asks for help; the
  // map shows where they lie
  { id: 'wake-science', speaker: 'quantis', focus: 'science', when: wake('science') },
  { id: 'wake-earth', speaker: 'rhizom', focus: 'earth', when: wake('earth') },
  { id: 'wake-humanities', speaker: 'muse', focus: 'humanities', when: wake('humanities') },
  { id: 'wake-society', speaker: 'kodex', focus: 'society', when: wake('society') },
  { id: 'guardians', speaker: 'kodex', when: (f) => f.awake.length === SECTORS.length },
  // morph.ai's memories, one per broken firewall in the order they break: how the humans stopped thinking
  { id: 'firewall-1', speaker: 'morph', form: 'glitch', when: (f) => f.broken >= 1 },
  { id: 'firewall-2', speaker: 'morph', form: 'glasses', when: (f) => f.broken >= 2 },
  { id: 'firewall-3', speaker: 'morph', form: 'glasses', when: (f) => f.broken >= 3 },
  // one wall to go: the core overhears morph.ai preparing the final duel
  { id: 'core-glitch', speaker: 'core', when: (f) => f.broken >= 3 && !f.finale },
  { id: 'firewall-4', speaker: 'morph', form: 'crown', when: (f) => f.broken >= 4 },
  { id: 'finale-ready', speaker: 'bolt', mood: 'worried', when: (f) => f.finaleOpen },
  { id: 'finale-won', speaker: 'morph', form: 'reformed', when: (f) => f.finale && f.revealed },
  { id: 'league', speaker: 'bolt', mood: 'proud', when: (f) => f.finale && f.revealed },
  { id: 'all-areas', speaker: 'bolt', mood: 'proud', when: (f) => f.connected >= AREAS.length },
];

/** The beats with their words in one language. */
export function storyBeats(lang: Lang): StoryBeat[] {
  const words = STORY_TEXT[lang].beats;
  return STORY_CUES.map((cue) => ({ ...cue, ...words[cue.id]! }));
}

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

/** The steps of the reveal without their words (`StoryText.reveal` has one text per step). */
export const REVEAL_STEPS: Omit<RevealStep, 'text'>[] = [
  { speaker: 'bolt', mood: 'think', zoom: 0.08, nerve: 0, brain: 0 },
  { speaker: 'bolt', mood: 'wow', zoom: 0.35, nerve: 1, brain: 0.3 },
  { speaker: 'core', zoom: 1, nerve: 1, brain: 1 },
  { speaker: 'morph', form: 'reformed', zoom: 1, nerve: 1, brain: 1 },
  { speaker: 'bolt', mood: 'proud', zoom: 1, nerve: 1, brain: 1 },
  { quote: true, zoom: 1, nerve: 1, brain: 1 },
  { speaker: 'bolt', mood: 'happy', zoom: 1, nerve: 1, brain: 1 },
];

export function brainReveal(lang: Lang): RevealStep[] {
  const words = STORY_TEXT[lang].reveal;
  return REVEAL_STEPS.map((s, i) => ({ ...s, text: words[i]! }));
}

/** Beats whose moment has come and that the player has not seen yet, in story order and the player's language. */
export function pendingBeats(p: PlayerState, pool: Pool): StoryBeat[] {
  const f = storyFacts(p, pool);
  return storyBeats(p.profile.lang).filter((b) => !p.story.seen.includes(b.id) && b.when(f));
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
export function storyLogs(p: Pick<PlayerState, 'story'>, lang: Lang): { id: string; name: string; text: string }[] {
  return storyBeats(lang)
    .filter((b) => b.log && p.story.seen.includes(b.id))
    .map((b) => ({ id: b.id, ...b.log! }));
}

// --- Voices in the loop ------------------------------------------------

/** What morph.ai radios in after a wrong answer; after the finale it is on your side and comforts instead of mocking. Deterministic for a seed. */
export function morphLine(p: PlayerState, seed: string): string {
  const text = STORY_TEXT[p.profile.lang];
  const lines = p.story.finale ? text.morphReformed : text.morphWrong;
  return lines[Math.floor(seededRng(`morph:${seed}`)() * lines.length)]!;
}

/** A guardian's comment on a right answer in their sector, once they are awake. */
export function guardianLine(
  p: PlayerState,
  pool: Pool,
  sector: Sector,
  seed: string,
): { who: GuardianId; name: string; text: string } | null {
  if (!storyFacts(p, pool).awake.includes(sector)) return null;
  const g = GUARDIANS[sector];
  const lines = STORY_TEXT[p.profile.lang].guardianCorrect[g.id];
  return { who: g.id, name: g.name, text: lines[Math.floor(seededRng(`guardian:${seed}`)() * lines.length)]! };
}

/** The guardian who fights beside the player at the firewall of `area`, or none while it still sleeps. */
export function wallAlly(p: PlayerState, pool: Pool, area: string): { who: GuardianId; name: string } | null {
  const sector = sectorOfArea(area);
  if (!storyFacts(p, pool).awake.includes(sector)) return null;
  const g = GUARDIANS[sector];
  return { who: g.id, name: g.name };
}

/**
 * Who speaks before a fight at the firewall of `area`: morph.ai taunts with what it "cleaned up"
 * there, and the guardian of the sector answers, or Bolt while the guardian still sleeps.
 */
export function wallVoices(
  p: PlayerState,
  pool: Pool,
  area: string,
): { morph: string; ally: { who: GuardianId | 'bolt'; name: string; text: string } } {
  const text = STORY_TEXT[p.profile.lang];
  const words = text.walls[area]!;
  const g = wallAlly(p, pool, area);
  const ally = g
    ? { who: g.who, name: g.name, text: words.guardian }
    : { who: 'bolt' as const, name: 'Bolt', text: text.wallBolt };
  return { morph: words.morph, ally };
}

/**
 * What a guardian says in a wall fight after an answer: `hit` for a right one, `hurt` when
 * morph.ai's noise strikes back, `breach` when the wall falls. `n` picks among the lines.
 */
/** morph.ai's words at the start of a phase of the final duel (D76). */
export function finalePhaseLine(lang: Lang, sector: Sector): string {
  return STORY_TEXT[lang].finalePhases[sector];
}

export function guardianFightLine(lang: Lang, who: GuardianId, kind: 'hit' | 'hurt' | 'breach', n: number): string {
  const words = STORY_TEXT[lang].guardianFight[who];
  if (kind === 'breach') return words.breach;
  const lines = words[kind];
  return lines[n % lines.length]!;
}

/** The areas behind a firewall, which `StoryText.walls` covers. */
export const WALL_AREAS = OUTER_ZONES.map((z) => z.area);

/** The two areas of a sector behind the firewall, which its guardian names when it wakes. */
export function hallsOf(sector: Sector): string[] {
  return WALL_AREAS.filter((a) => sectorOfArea(a) === sector);
}
