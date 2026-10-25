import { BOSS_REWARD, FINALE_PASS, FINALE_REWARD, firewallReached, type BossOutcome, type Firewall } from './boss';
import { cacheWithoutArea, type CacheEntry, type CacheFile } from './cache';
import { recordChoice, recordResult, type InterestMap } from './interest';
import {
  DEBRIS_COST,
  areaCost,
  initialUnlockedAreas,
  initialShop,
  trySpend,
  type AdMemory,
  type AgeGroup,
  type ShopState,
} from './monetization';
import {
  Pool,
  completeNode,
  createNetwork,
  growMissing,
  growWaiting,
  enterZone,
  reviewNode,
  unlockDebris,
  type SpawnContext,
} from './network';
import { ALBUM_REWARD, fullAlbums } from './albums';
import { riddleBonus } from './answers';
import {
  MAX_ENERGY,
  MAX_INTEGRITY,
  STREAK_FREEZES,
  VARIETY_WINDOW,
  boosted,
  rewardFor,
  streakAfter,
  varied,
  type Reward,
} from './rewards';
import { networkBonus } from './synapses';
import { seededRng } from './rng';
import { BASE_SKILL, updateSkill, type SkillMap } from './skill';
import { isDue } from './srs';
import { initialStory, storyFacts, type StoryState } from './story';
import { initialLeague, type LeagueState } from './league';
import { ROOT_QUESTIONS } from './content';
import { DEFAULT_LANG, type Lang } from './lang';
import { sectorOfArea } from './taxonomy';
import type { Answer, NetNode, NetworkState, Sector } from './types';
import { WALL_REACH, approachOf, type Breach } from './walls';

export interface PlayerProfile {
  name: string;
  birthYear: number;
  ageGroup: AgeGroup;
  /** Consent for personalised ads – only effective for adults. */
  consent: boolean;
  adFree: boolean;
  onboarded: boolean;
  /** The language of UI, story and questions. */
  lang: Lang;
}

export interface PlayerState {
  profile: PlayerProfile;
  network: NetworkState;
  skill: SkillMap;
  interest: InterestMap;
  xp: number;
  bits: number;
  gems: number;
  energy: number;
  /** When the energy last started to refill (null while it is full). */
  energyAt: number | null;
  integrity: number;
  streak: { count: number; lastDay: string | null; freezes: number };
  unlockedAreas: string[];
  /** The folder structure: folders filed from debris fields; see `cache.ts`. It stays. */
  archive: CacheEntry[];
  /** Up to three files per area, free to open in a question; emptied for the area after an attempt. */
  cache: CacheFile[];
  /** fragmentId → day first collected */
  codex: Record<string, string>;
  ownedCosmetics: string[];
  activeCosmetic: string;
  ads: AdMemory;
  /** Purchases, Plus and rewarded videos; see `shop.ts`. */
  shop: ShopState;
  stats: { correct: number; wrong: number; solved: number };
  /** Where the player is in the plot; see `story.ts`. */
  story: StoryState;
  /** The weekly league; see `league.ts`. */
  league: LeagueState;
  /** Areas of the last right answers, newest last (the variety bonus looks at them). */
  recentAreas: string[];
  /** Collection albums that are full and paid out; see `albums.ts`. */
  albums: string[];
}

/** Colours for the player's spark. `de` is the German name; the app shows the name of the player's language by id. */
export const COSMETICS: { id: string; de: string; color: string; cost: number }[] = [
  { id: 'cyan', de: 'Klassik-Blau', color: '#1CB0F6', cost: 0 },
  { id: 'lime', de: 'Limette', color: '#58CC02', cost: 60 },
  { id: 'rose', de: 'Funken-Rosa', color: '#FF86D0', cost: 90 },
  { id: 'gold', de: 'Archiv-Gold', color: '#FFC800', cost: 150 },
];

export function initialPlayer(
  pool: Pool,
  roots: Record<Sector, string> = ROOT_QUESTIONS,
): PlayerState {
  return {
    profile: {
      name: '',
      birthYear: 0,
      ageGroup: 'minor', // safest default until the age gate is passed
      consent: false,
      adFree: false,
      onboarded: false,
      lang: DEFAULT_LANG,
    },
    network: createNetwork(pool, roots),
    skill: {},
    interest: {},
    xp: 0,
    bits: 0,
    gems: 5,
    energy: MAX_ENERGY,
    energyAt: null,
    integrity: MAX_INTEGRITY,
    streak: { count: 0, lastDay: null, freezes: STREAK_FREEZES },
    unlockedAreas: initialUnlockedAreas(),
    archive: [],
    cache: [],
    codex: {},
    ownedCosmetics: ['cyan'],
    activeCosmetic: 'cyan',
    ads: { breaksSinceInterstitial: 0, lastAdAt: null, lastAppOpenAt: null },
    shop: initialShop(),
    stats: { correct: 0, wrong: 0, solved: 0 },
    story: initialStory(),
    league: initialLeague(),
    recentAreas: [],
    albums: [],
  };
}

export function ctxFor(p: PlayerState, pool: Pool, seed: string): SpawnContext {
  return {
    pool,
    unlockedAreas: p.unlockedAreas,
    skill: p.skill,
    interest: p.interest,
    rng: seededRng(seed),
  };
}

/**
 * The result of a firewall fight (`won`, see `wallFightState`). A won fight breaks the wall where
 * the network stands at it: a reward, a gap of a few cells, and the area behind opens with a
 * first node. Otherwise the network loses one integrity and the next fight draws new questions.
 */
export function recordBoss(p: PlayerState, pool: Pool, firewallId: string, won: boolean): BossOutcome {
  const fw = p.network.firewalls?.find((f) => f.id === firewallId);
  const at = fw && !fw.broken ? approachOf(Object.values(p.network.nodes), fw.area) : undefined;
  // a firewall the network has not grown to cannot be attacked
  if (!fw || !at || at.cells > WALL_REACH) {
    return { player: p, passed: false, spawned: [], areas: [] };
  }
  const passed = won;
  const firewalls = p.network.firewalls!.map((f) =>
    f.id === firewallId ? { ...f, broken: passed, attempts: passed ? f.attempts : f.attempts + 1 } : f,
  );
  let player: PlayerState = { ...p, network: { ...p.network, firewalls } };
  if (!passed) {
    return {
      player: { ...player, integrity: Math.max(0, p.integrity - 1), stats: { ...p.stats, wrong: p.stats.wrong + 1 } },
      passed: false,
      spawned: [],
      areas: [],
    };
  }
  player = {
    ...player,
    xp: p.xp + BOSS_REWARD.xp,
    bits: p.bits + BOSS_REWARD.bits,
    gems: p.gems + BOSS_REWARD.gems,
  };
  const opened = breakWall(player, pool, fw, { x: at.cell.x, y: at.cell.y, from: at.from }, at.node, `boss:${firewallId}`);
  return { player: opened.player, passed: true, spawned: opened.spawned, areas: [fw.area] };
}

/**
 * Opens the area behind a firewall through a gap at `breach`. With a pool a first node of the
 * area grows there from `parent`.
 */
function breakWall(
  p: PlayerState,
  pool: Pool | undefined,
  fw: Firewall,
  breach: Breach,
  parent: NetNode,
  seed: string,
  bought = false,
): { player: PlayerState; spawned: string[] } {
  const firewalls = p.network.firewalls!.map((f) =>
    f.id === fw.id ? { ...f, broken: true, breach, ...(bought ? { bought } : {}) } : f,
  );
  const unlockedAreas = p.unlockedAreas.includes(fw.area) ? p.unlockedAreas : [...p.unlockedAreas, fw.area];
  const player: PlayerState = { ...p, unlockedAreas, network: { ...p.network, firewalls } };
  if (!pool) return { player, spawned: [] };
  const c = enterZone(player.network, fw.area, breach, parent, ctxFor(player, pool, seed));
  return { player: { ...player, network: c.state }, spawned: c.node ? [c.node.id] : [] };
}

/** Areas whose wall the network stands at now but did not before (for the result of an answer). */
function newlyReached(before: NetworkState, after: NetworkState): string[] {
  const was = Object.values(before.nodes);
  const now = Object.values(after.nodes);
  return (after.firewalls ?? [])
    .filter((f) => !f.broken && firewallReached(now, f) && !firewallReached(was, f))
    .map((f) => f.area);
}

/**
 * New questions arrived in the pool: branches that had to wait for one grow now. This is what
 * keeps the network open-ended. Returns null when nothing grew.
 */
export function growWaitingNodes(p: PlayerState, pool: Pool, seed: string): { player: PlayerState; spawned: string[] } | null {
  const grown = growWaiting(p.network, ctxFor(p, pool, `wait:${seed}`));
  if (grown.spawned.length === 0) return null;
  return { player: { ...p, network: grown.state }, spawned: grown.spawned.map((n) => n.id) };
}

/** The player tapped a node: a strong interest signal for its area. */
export function chooseNode(p: PlayerState, pool: Pool, nodeId: string): PlayerState {
  const n = p.network.nodes[nodeId];
  if (!n || n.state !== 'open') return p;
  const area = pool.get(n.questionId).area;
  return { ...p, interest: recordChoice(p.interest, area) };
}

export function recordWrong(p: PlayerState, pool: Pool, nodeId: string): PlayerState {
  const n = p.network.nodes[nodeId];
  if (!n) return p;
  const q = pool.get(n.questionId);
  return {
    ...p,
    network: {
      ...p.network,
      nodes: { ...p.network.nodes, [nodeId]: { ...n, attempts: n.attempts + 1 } },
    },
    integrity: Math.max(0, p.integrity - 1),
    cache: cacheWithoutArea(p.cache, pool, q.area),
    skill: {
      ...p.skill,
      [q.area]: updateSkill(p.skill[q.area] ?? BASE_SKILL, q.difficulty, false),
    },
    interest: recordResult(p.interest, q.area, false),
    stats: { ...p.stats, wrong: p.stats.wrong + 1 },
  };
}

export interface CorrectResult {
  player: PlayerState;
  spawned: string[];
  reward: Reward;
  closedCircle: boolean;
  /** A file of every key fragment was in the cache and the folder structure stayed closed. */
  prepared: boolean;
  /** Areas whose wall the network reached with this answer: their firewall can be attacked now. */
  reachedWalls: string[];
  /** What raised the reward: the synapses (0.05 each) and the variety of the last answers. */
  bonus: { network: number; variety: boolean };
  /** Collection albums this answer filled (each paid `ALBUM_REWARD` on top). */
  albums: string[];
}

function collect(p: PlayerState, pool: Pool, questionId: string, today: string) {
  const codex = { ...p.codex };
  for (const f of pool.get(questionId).fragments) {
    if (f.kind !== 'decoy' && !codex[f.id]) codex[f.id] = today;
  }
  return codex;
}

/**
 * A right answer at an open node. `answer` is what the player gave; a riddle solved with clues
 * still closed pays extra bits (`riddleBonus`).
 */
export function recordCorrect(
  p: PlayerState,
  pool: Pool,
  nodeId: string,
  today: string,
  rewinds: number,
  answer?: Answer,
): CorrectResult {
  const n = p.network.nodes[nodeId];
  if (!n || n.state !== 'open') {
    return { player: p, spawned: [], reward: { xp: 0, bits: 0, gems: 0 }, closedCircle: false, prepared: false, reachedWalls: [], bonus: { network: 0, variety: false }, albums: [] };
  }
  const q = pool.get(n.questionId);
  const attempts = n.attempts + 1;
  const grown = completeNode(
    p.network,
    nodeId,
    attempts,
    today,
    ctxFor(p, pool, `${nodeId}:${attempts}`),
  );
  const keys = q.fragments.filter((f) => f.kind === 'key');
  const prepared =
    rewinds === 0 &&
    keys.length > 0 &&
    keys.every((k) => p.cache.some((c) => c.questionId === q.id && c.fragmentId === k.id));
  let reward = rewardFor({
    difficulty: q.difficulty,
    attempts,
    rewinds,
    kind: n.kind,
    closedCircle: grown.closedCircle,
    prepared,
  });
  reward = { ...reward, bits: reward.bits + riddleBonus(q, answer) };
  if (p.integrity === 0) {
    reward = { xp: Math.round(reward.xp / 2), bits: Math.round(reward.bits / 2), gems: 0 };
  }
  // breadth pays: every synapse raises the reward, and so do varied areas in the last answers
  const recentAreas = [...(p.recentAreas ?? []), q.area].slice(-VARIETY_WINDOW);
  const bonus = { network: networkBonus(p), variety: varied(recentAreas) };
  reward = boosted(reward, bonus.network, bonus.variety);
  const st = streakAfter(p.streak.count, p.streak.lastDay, today, p.streak.freezes);
  const solvedNow: PlayerState = {
    ...p,
    network: grown.state,
    xp: p.xp + reward.xp,
    bits: p.bits + reward.bits,
    gems: p.gems + reward.gems,
    integrity: Math.min(MAX_INTEGRITY, p.integrity + 1),
    streak: { count: st.streak, lastDay: today, freezes: st.freezes },
    skill: {
      ...p.skill,
      [q.area]: updateSkill(p.skill[q.area] ?? BASE_SKILL, q.difficulty, attempts === 1),
    },
    interest: recordResult(p.interest, q.area, true),
    cache: cacheWithoutArea(p.cache, pool, q.area),
    codex: collect(p, pool, q.id, today),
    stats: { ...p.stats, correct: p.stats.correct + 1, solved: p.stats.solved + 1 },
    recentAreas,
  };
  // collection albums this answer filled pay once
  const albums = fullAlbums(solvedNow.network).filter((id) => !(p.albums ?? []).includes(id));
  const player: PlayerState = albums.length
    ? {
        ...solvedNow,
        bits: solvedNow.bits + ALBUM_REWARD.bits * albums.length,
        gems: solvedNow.gems + ALBUM_REWARD.gems * albums.length,
        albums: [...(p.albums ?? []), ...albums],
      }
    : solvedNow;
  return {
    player,
    spawned: grown.spawned.map((s) => s.id),
    reward,
    closedCircle: grown.closedCircle,
    prepared,
    reachedWalls: newlyReached(p.network, player.network),
    bonus,
    albums,
  };
}

/**
 * A repair run on a damaged node. A right answer heals it (solved again) and lets the withheld
 * children grow. Only a repair that is due pays (reward, 1 integrity, skill); an early one heals
 * for free, so answering the question again right after the damage earns nothing.
 */
export function recordReviewResult(
  p: PlayerState,
  pool: Pool,
  nodeId: string,
  correct: boolean,
  today: string,
): { player: PlayerState; reward: Reward; spawned: string[]; due: boolean } {
  const n = p.network.nodes[nodeId];
  if (!n || n.state !== 'damaged') return { player: p, reward: { xp: 0, bits: 0, gems: 0 }, spawned: [], due: false };
  const q = pool.get(n.questionId);
  const due = isDue(n, today);
  const reward =
    correct && due
      ? rewardFor({ difficulty: q.difficulty, attempts: 1, rewinds: 0, kind: 'review' })
      : { xp: 0, bits: 0, gems: 0 };
  const reviewed = reviewNode(p.network, nodeId, correct, today);
  const grown = correct
    ? growMissing(reviewed, nodeId, ctxFor(p, pool, `${nodeId}:repair`))
    : { state: reviewed, spawned: [] };
  const base: PlayerState = {
    ...p,
    network: grown.state,
    integrity: correct && due ? Math.min(MAX_INTEGRITY, p.integrity + 1) : p.integrity,
  };
  return {
    reward,
    due,
    spawned: grown.spawned.map((s) => s.id),
    player: {
      ...base,
      cache: cacheWithoutArea(p.cache, pool, q.area),
      xp: p.xp + reward.xp,
      bits: p.bits + reward.bits,
      skill: due
        ? { ...p.skill, [q.area]: updateSkill(p.skill[q.area] ?? BASE_SKILL, q.difficulty, correct) }
        : p.skill,
    },
  };
}

/** Solved nodes that can be maintained today: answering one again wins back integrity (once a day each). */
export function maintenanceTargets(p: PlayerState, today: string): string[] {
  return Object.values(p.network.nodes)
    .filter((n) => n.state === 'solved' && n.maintainedOn !== today)
    .map((n) => n.id);
}

/**
 * Integrity 0 makes the network unstable: new nodes wait until a repair or maintenance has
 * won integrity back. Only while such a way exists, so the game can never lock up.
 */
export function isUnstable(p: PlayerState, today: string): boolean {
  return p.integrity === 0 && (maintenanceTargets(p, today).length > 0 || dueReviews(p, today).length > 0);
}

/**
 * Maintenance: the player answers a solved node's question again, from memory, without the
 * cache. Right gives 1 integrity; either way the node is done for today (no guessing twice).
 */
export function recordMaintenance(
  p: PlayerState,
  pool: Pool,
  nodeId: string,
  correct: boolean,
  today: string,
): PlayerState {
  const n = p.network.nodes[nodeId];
  if (!n || n.state !== 'solved' || n.maintainedOn === today) return p;
  const q = pool.get(n.questionId);
  return {
    ...p,
    network: { ...p.network, nodes: { ...p.network.nodes, [nodeId]: { ...n, maintainedOn: today } } },
    integrity: correct ? Math.min(MAX_INTEGRITY, p.integrity + 1) : p.integrity,
    skill: { ...p.skill, [q.area]: updateSkill(p.skill[q.area] ?? BASE_SKILL, q.difficulty, correct) },
  };
}

/**
 * The final duel against MORPH, open once all chapters before it are done. Won: the story
 * reaches its ending and pays big. Lost: one integrity, and the next duel brings new questions.
 */
export function recordFinale(
  p: PlayerState,
  pool: Pool,
  correct: number,
): { player: PlayerState; passed: boolean } {
  if (!storyFacts(p, pool).finaleOpen) return { player: p, passed: false };
  if (correct < FINALE_PASS) {
    return {
      passed: false,
      player: {
        ...p,
        integrity: Math.max(0, p.integrity - 1),
        story: { ...p.story, finaleAttempts: p.story.finaleAttempts + 1 },
        stats: { ...p.stats, wrong: p.stats.wrong + 1 },
      },
    };
  }
  return {
    passed: true,
    player: {
      ...p,
      xp: p.xp + FINALE_REWARD.xp,
      bits: p.bits + FINALE_REWARD.bits,
      gems: p.gems + FINALE_REWARD.gems,
      story: { ...p.story, finale: true },
    },
  };
}

export function dueReviews(p: PlayerState, today: string): string[] {
  return Object.values(p.network.nodes)
    .filter((n) => isDue(n, today))
    .map((n) => n.id);
}

/** Minutes it takes for one point of energy to come back. */
export const ENERGY_REGEN_MS = 20 * 60 * 1000;

/** Adds the energy that has refilled since it last started to (pure; pass the current time). */
export function regenEnergy(p: PlayerState, now: number): PlayerState {
  if (p.energy >= MAX_ENERGY) return p.energyAt === null ? p : { ...p, energyAt: null };
  const base = p.energyAt ?? now;
  const gained = Math.floor((now - base) / ENERGY_REGEN_MS);
  if (gained <= 0) return p.energyAt === null ? { ...p, energyAt: now } : p;
  const energy = Math.min(MAX_ENERGY, p.energy + gained);
  return { ...p, energy, energyAt: energy >= MAX_ENERGY ? null : base + gained * ENERGY_REGEN_MS };
}

/** Milliseconds until the next point of energy, or null while it is full. */
export function msToNextEnergy(p: PlayerState, now: number): number | null {
  if (p.energy >= MAX_ENERGY || p.energyAt === null) return null;
  return Math.max(0, p.energyAt + ENERGY_REGEN_MS - now);
}

/** Opens the folder structure in a question: costs energy (the app passes `structureOpenCost`). */
export function spendRewind(p: PlayerState, now: number = Date.now(), cost = 1): PlayerState | null {
  const r = regenEnergy(p, now);
  if (r.energy < cost) return null;
  return { ...r, energy: r.energy - cost, energyAt: r.energyAt ?? now };
}

/** While the network is unstable new nodes stay closed; repairs are always allowed. */
export function canStartNode(p: PlayerState, nodeId: string, today: string): boolean {
  const n = p.network.nodes[nodeId];
  if (!n || n.locked) return false;
  if (n.state === 'damaged') return true;
  return n.state === 'open' && !isUnstable(p, today);
}

export const HEAL_COST = 3;

/** Restores the network's integrity completely for gems. */
export function healIntegrity(p: PlayerState): PlayerState | null {
  if (p.integrity >= MAX_INTEGRITY) return null;
  const r = trySpend(p.gems, HEAL_COST);
  if (!r.ok) return null;
  return { ...p, gems: r.balance, integrity: MAX_INTEGRITY };
}

/**
 * Buys an area with gems. Its wall opens where the network comes closest to it (no fight, so the
 * story does not count it); with a pool a first node of the area grows behind the gap.
 */
export function unlockArea(p: PlayerState, areaId: string, pool?: Pool): PlayerState | null {
  if (p.unlockedAreas.includes(areaId)) return null;
  const r = trySpend(p.gems, areaCost(areaId));
  if (!r.ok) return null;
  const paid: PlayerState = { ...p, gems: r.balance };
  const fw = paid.network.firewalls?.find((f) => f.area === areaId && !f.broken);
  const at = fw ? approachOf(Object.values(paid.network.nodes), areaId) : undefined;
  if (!fw || !at) return { ...paid, unlockedAreas: [...paid.unlockedAreas, areaId] };
  return breakWall(paid, pool, fw, { x: at.cell.x, y: at.cell.y, from: at.from }, at.node, `buy:${areaId}`, true).player;
}

export function openDebris(p: PlayerState, nodeId: string): PlayerState | null {
  const n = p.network.nodes[nodeId];
  if (!n || !n.locked) return null;
  const r = trySpend(p.gems, DEBRIS_COST);
  if (!r.ok) return null;
  return { ...p, gems: r.balance, network: unlockDebris(p.network, nodeId) };
}

export function buyCosmetic(p: PlayerState, id: string): PlayerState | null {
  const c = COSMETICS.find((x) => x.id === id);
  if (!c || p.ownedCosmetics.includes(id)) return null;
  const r = trySpend(p.bits, c.cost);
  if (!r.ok) return null;
  return { ...p, bits: r.balance, ownedCosmetics: [...p.ownedCosmetics, id], activeCosmetic: id };
}

export function grantGems(p: PlayerState, n: number): PlayerState {
  return { ...p, gems: p.gems + n };
}
