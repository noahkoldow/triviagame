import { recordChoice, recordResult, type InterestMap } from './interest';
import {
  DEBRIS_COST,
  areaCost,
  initialUnlockedAreas,
  trySpend,
  type AdState,
  type AgeGroup,
} from './monetization';
import {
  Pool,
  completeNode,
  createNetwork,
  reviewNode,
  unlockDebris,
  type SpawnContext,
} from './network';
import { MAX_ENERGY, MAX_INTEGRITY, rewardFor, streakAfter, type Reward } from './rewards';
import { seededRng } from './rng';
import { BASE_SKILL, updateSkill, type SkillMap } from './skill';
import { isDue } from './srs';
import { ROOT_QUESTIONS } from './content';
import type { NetworkState, Sector } from './types';

export interface PlayerProfile {
  name: string;
  birthYear: number;
  ageGroup: AgeGroup;
  /** Consent for personalised ads – only effective for adults. */
  consent: boolean;
  adFree: boolean;
  onboarded: boolean;
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
  integrity: number;
  streak: { count: number; lastDay: string | null; freezes: number };
  unlockedAreas: string[];
  /** fragmentId → day first collected */
  codex: Record<string, string>;
  ownedCosmetics: string[];
  activeCosmetic: string;
  ads: Pick<AdState, 'wrongSinceInterstitial' | 'lastInterstitialAt'>;
  stats: { correct: number; wrong: number; solved: number };
}

export const COSMETICS: { id: string; de: string; color: string; cost: number }[] = [
  { id: 'cyan', de: 'Klassik-Cyan', color: '#22D3EE', cost: 0 },
  { id: 'lime', de: 'Neon-Limette', color: '#A3E635', cost: 60 },
  { id: 'rose', de: 'Funken-Rosa', color: '#FB7185', cost: 90 },
  { id: 'gold', de: 'Archiv-Gold', color: '#FBBF24', cost: 150 },
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
    },
    network: createNetwork(pool, roots),
    skill: {},
    interest: {},
    xp: 0,
    bits: 0,
    gems: 5,
    energy: MAX_ENERGY,
    integrity: MAX_INTEGRITY,
    streak: { count: 0, lastDay: null, freezes: 2 },
    unlockedAreas: initialUnlockedAreas(),
    codex: {},
    ownedCosmetics: ['cyan'],
    activeCosmetic: 'cyan',
    ads: { wrongSinceInterstitial: 0, lastInterstitialAt: null },
    stats: { correct: 0, wrong: 0, solved: 0 },
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
    skill: {
      ...p.skill,
      [q.area]: updateSkill(p.skill[q.area] ?? BASE_SKILL, q.difficulty, false),
    },
    interest: recordResult(p.interest, q.area, false),
    ads: { ...p.ads, wrongSinceInterstitial: p.ads.wrongSinceInterstitial + 1 },
    stats: { ...p.stats, wrong: p.stats.wrong + 1 },
  };
}

export function noteInterstitialShown(p: PlayerState, now: number): PlayerState {
  return { ...p, ads: { wrongSinceInterstitial: 0, lastInterstitialAt: now } };
}

export interface CorrectResult {
  player: PlayerState;
  spawned: string[];
  reward: Reward;
  closedCircle: boolean;
}

function collect(p: PlayerState, pool: Pool, questionId: string, today: string) {
  const codex = { ...p.codex };
  for (const f of pool.get(questionId).fragments) {
    if (f.kind !== 'decoy' && !codex[f.id]) codex[f.id] = today;
  }
  return codex;
}

export function recordCorrect(
  p: PlayerState,
  pool: Pool,
  nodeId: string,
  today: string,
  rewinds: number,
): CorrectResult {
  const n = p.network.nodes[nodeId];
  if (!n || n.state !== 'open') {
    return { player: p, spawned: [], reward: { xp: 0, bits: 0, gems: 0 }, closedCircle: false };
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
  let reward = rewardFor({
    difficulty: q.difficulty,
    attempts,
    rewinds,
    kind: n.kind,
    closedCircle: grown.closedCircle,
  });
  if (p.integrity === 0) {
    reward = { xp: Math.round(reward.xp / 2), bits: Math.round(reward.bits / 2), gems: 0 };
  }
  const st = streakAfter(p.streak.count, p.streak.lastDay, today, p.streak.freezes);
  const player: PlayerState = {
    ...p,
    network: grown.state,
    xp: p.xp + reward.xp,
    bits: p.bits + reward.bits,
    gems: p.gems + reward.gems,
    energy: Math.min(MAX_ENERGY, p.energy + 1),
    integrity: Math.min(MAX_INTEGRITY, p.integrity + 1),
    streak: { count: st.streak, lastDay: today, freezes: st.freezes },
    skill: {
      ...p.skill,
      [q.area]: updateSkill(p.skill[q.area] ?? BASE_SKILL, q.difficulty, attempts === 1),
    },
    interest: recordResult(p.interest, q.area, true),
    codex: collect(p, pool, q.id, today),
    stats: { ...p.stats, correct: p.stats.correct + 1, solved: p.stats.solved + 1 },
  };
  return {
    player,
    spawned: grown.spawned.map((s) => s.id),
    reward,
    closedCircle: grown.closedCircle,
  };
}

export function recordReviewResult(
  p: PlayerState,
  pool: Pool,
  nodeId: string,
  correct: boolean,
  today: string,
): { player: PlayerState; reward: Reward } {
  const n = p.network.nodes[nodeId];
  if (!n || n.state !== 'damaged') return { player: p, reward: { xp: 0, bits: 0, gems: 0 } };
  const q = pool.get(n.questionId);
  const reward = correct
    ? rewardFor({ difficulty: q.difficulty, attempts: 1, rewinds: 0, kind: 'review' })
    : { xp: 0, bits: 0, gems: 0 };
  return {
    reward,
    player: {
      ...p,
      network: reviewNode(p.network, nodeId, correct, today),
      xp: p.xp + reward.xp,
      bits: p.bits + reward.bits,
      skill: {
        ...p.skill,
        [q.area]: updateSkill(p.skill[q.area] ?? BASE_SKILL, q.difficulty, correct),
      },
    },
  };
}

export function dueReviews(p: PlayerState, today: string): string[] {
  return Object.values(p.network.nodes)
    .filter((n) => isDue(n, today))
    .map((n) => n.id);
}

export function spendRewind(p: PlayerState): PlayerState | null {
  return p.energy > 0 ? { ...p, energy: p.energy - 1 } : null;
}

export function unlockArea(p: PlayerState, areaId: string): PlayerState | null {
  if (p.unlockedAreas.includes(areaId)) return null;
  const r = trySpend(p.gems, areaCost(areaId));
  if (!r.ok) return null;
  return { ...p, gems: r.balance, unlockedAreas: [...p.unlockedAreas, areaId] };
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
