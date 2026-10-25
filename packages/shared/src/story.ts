import type { PlayerState } from './game';
import { STORY_DE } from './i18n/story.de';
import { STORY_EN } from './i18n/story.en';
import { STORY_ES } from './i18n/story.es';
import { STORY_FR } from './i18n/story.fr';
import type { Lang } from './lang';
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

/** Everything the story says, in one language. */
export interface StoryText {
  guardianTitles: Record<GuardianId, string>;
  chapters: {
    restart: { title: string; goal: string };
    guardians: { title: string; goal: (wake: number) => string };
    firewalls: { title: string; goal: string };
    finale: { title: string; goal: string };
    endless: { title: string; connect: (areas: number) => string; milestone: (next: number) => string };
  };
  /** By beat id; a beat that leaves a log file has `log` in every language. */
  beats: Record<string, { title: string; text: string; log?: { name: string; text: string } }>;
  /** One text per step of the reveal (`REVEAL_STEPS`). */
  reveal: string[];
  morphWrong: string[];
  morphReformed: string[];
  guardianCorrect: Record<GuardianId, string[]>;
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
/** Marks that the player tapped the league in the dock after the reveal (stored with the seen beats). */
export const LEAGUE_NOTICED_ID = 'league-noticed';

/** After the reveal the league button glows until the player taps it once, so nobody misses it. */
export function leagueIsNew(p: PlayerState): boolean {
  return p.story.seen.includes(REVEAL_ID) && !p.story.seen.includes(LEAGUE_NOTICED_ID);
}

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
  const broken = (p.network.firewalls ?? []).filter((f) => f.broken && !f.bought).length;
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
  if (!f.finale) {
    return { n: 4, ...c.finale, done: 0, total: 1, finale: true };
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
  { id: 'wake-science', speaker: 'quantis', when: wake('science') },
  { id: 'wake-earth', speaker: 'rhizom', when: wake('earth') },
  { id: 'wake-humanities', speaker: 'muse', when: wake('humanities') },
  { id: 'wake-society', speaker: 'kodex', when: wake('society') },
  { id: 'guardians', speaker: 'kodex', when: (f) => f.awake.length === SECTORS.length },
  // morph.ai's memories, one per broken firewall in the order they break: how the humans stopped thinking
  { id: 'firewall-1', speaker: 'morph', form: 'glitch', when: (f) => f.broken >= 1 },
  { id: 'firewall-2', speaker: 'morph', form: 'glasses', when: (f) => f.broken >= 2 },
  { id: 'firewall-3', speaker: 'morph', form: 'glasses', when: (f) => f.broken >= 3 },
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
