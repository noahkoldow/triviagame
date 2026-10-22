import { pickArea, type InterestMap } from './interest';
import { placeNode, rootPosition, polar } from './layout';
import { seededRng, type Rng } from './rng';
import { targetDifficulty, BASE_SKILL, type SkillMap } from './skill';
import { markDamaged, applyReview } from './srs';
import { SECTORS, sectorOfArea } from './taxonomy';
import type { NetNode, NetworkState, Question, Sector } from './types';

export class Pool {
  readonly byId = new Map<string, Question>();
  constructor(public readonly list: Question[]) {
    for (const q of list) this.byId.set(q.id, q);
  }
  get(id: string): Question {
    const q = this.byId.get(id);
    if (!q) throw new Error(`Unknown question ${id}`);
    return q;
  }
}

export function createNetwork(pool: Pool, roots: Record<Sector, string>): NetworkState {
  const nodes: Record<string, NetNode> = {};
  const used: string[] = [];
  SECTORS.forEach((s, i) => {
    const q = pool.get(roots[s]);
    const id = `n${i}`;
    nodes[id] = {
      id,
      questionId: q.id,
      parentId: null,
      kind: 'root',
      state: 'open',
      pos: rootPosition(s),
      attempts: 0,
      box: 0,
    };
    used.push(q.id);
  });
  return { nodes, usedQuestions: used };
}

export interface SpawnContext {
  pool: Pool;
  unlockedAreas: string[];
  skill: SkillMap;
  interest: InterestMap;
  rng: Rng;
}

export function exposureOf(state: NetworkState, pool: Pool): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of Object.values(state.nodes)) {
    if (n.state === 'open') continue;
    const area = pool.get(n.questionId).area;
    out[area] = (out[area] ?? 0) + 1;
  }
  return out;
}

function closest(cands: Question[], target: number): Question | undefined {
  let best: Question | undefined;
  for (const c of cands) {
    if (!best || Math.abs(c.difficulty - target) < Math.abs(best.difficulty - target)) best = c;
  }
  return best;
}

export function pickDeepen(parent: Question, state: NetworkState, ctx: SpawnContext) {
  const used = new Set(state.usedQuestions);
  const ok = (q: Question) => !used.has(q.id) && ctx.unlockedAreas.includes(q.area);
  let cands = parent.deepen.map((id) => ctx.pool.get(id)).filter(ok);
  if (cands.length === 0) {
    cands = ctx.pool.list.filter(
      (q) => q.area === parent.area && ok(q) && q.difficulty >= parent.difficulty,
    );
  }
  const target = targetDifficulty(ctx.skill[parent.area] ?? BASE_SKILL) + 0;
  return closest(cands, Math.max(target, parent.difficulty));
}

export function pickBridge(
  parent: Question,
  state: NetworkState,
  ctx: SpawnContext,
  exclude: string[] = [],
) {
  const used = new Set([...state.usedQuestions, ...exclude]);
  const ok = (q: Question) => !used.has(q.id) && ctx.unlockedAreas.includes(q.area);
  let cands = parent.bridge.map((id) => ctx.pool.get(id)).filter(ok);
  if (cands.length === 0) {
    cands = ctx.pool.list.filter((q) => q.area !== parent.area && ok(q));
  }
  if (cands.length === 0) return undefined;
  const areas = [...new Set(cands.map((q) => q.area))];
  const area = pickArea(areas, ctx.interest, exposureOf(state, ctx.pool), ctx.rng);
  const inArea = cands.filter((q) => q.area === area);
  // bridges start one step easier than the player's level so exploring feels good
  const target = Math.max(1, targetDifficulty(ctx.skill[area] ?? BASE_SKILL) - 1);
  return closest(inArea, target);
}

function nextId(state: NetworkState): string {
  return `n${Object.keys(state.nodes).length}`;
}

function addNode(
  state: NetworkState,
  parent: NetNode,
  q: Question,
  kind: 'deepen' | 'bridge' | 'debris',
  extra: Partial<NetNode> = {},
): { state: NetworkState; node: NetNode } {
  const id = nextId(state);
  const pos = placeNode({
    parent: parent.pos,
    kind,
    mainSector: sectorOfArea(q.area),
    side: q.side,
    existing: Object.values(state.nodes).map((n) => n.pos),
    seed: `${id}:${q.id}`,
  });
  const node: NetNode = {
    id,
    questionId: q.id,
    parentId: parent.id,
    kind,
    state: 'open',
    pos,
    attempts: 0,
    box: 0,
    ...extra,
  };
  return {
    node,
    state: {
      nodes: { ...state.nodes, [id]: node },
      usedQuestions: [...state.usedQuestions, q.id],
    },
  };
}

/** Chance that a solved node reveals a (locked) debris field. */
export const DEBRIS_CHANCE = 0.25;

/**
 * Marks a node as solved (or damaged when it needed many attempts) and spawns
 * its two children: a deepening and a bridge, plus occasionally a debris field.
 */
export function completeNode(
  state: NetworkState,
  nodeId: string,
  attempts: number,
  today: string,
  ctx: SpawnContext,
): { state: NetworkState; spawned: NetNode[]; closedCircle: boolean } {
  const node = state.nodes[nodeId];
  if (!node) throw new Error(`Unknown node ${nodeId}`);
  if (node.state !== 'open') return { state, spawned: [], closedCircle: false };
  const parentQ = ctx.pool.get(node.questionId);

  // wrong answers slow the network down: first try grows everything, the second
  // only the deepening, from the third on nothing until a repair run succeeds
  const withheld: ('deepen' | 'bridge')[] =
    node.kind === 'debris' ? [] : attempts >= 3 ? ['deepen', 'bridge'] : attempts === 2 ? ['bridge'] : [];
  let solved: NetNode = { ...node, attempts, state: 'solved', missing: withheld.length ? withheld : undefined };
  if (attempts >= 2) solved = markDamaged(solved, today);
  let next: NetworkState = { ...state, nodes: { ...state.nodes, [nodeId]: solved } };
  const spawned: NetNode[] = [];

  if (node.kind !== 'debris') {
    if (!withheld.includes('deepen')) {
      const dq = pickDeepen(parentQ, next, ctx);
      if (dq) {
        const r = addNode(next, solved, dq, 'deepen');
        next = r.state;
        spawned.push(r.node);
      }
    }
    if (!withheld.includes('bridge')) {
      const bq = pickBridge(parentQ, next, ctx);
      if (bq) {
        const r = addNode(next, solved, bq, 'bridge');
        next = r.state;
        spawned.push(r.node);
      }
    }
    const drng = seededRng(`debris:${nodeId}`);
    if (attempts <= 1 && drng() < DEBRIS_CHANCE) {
      const sector = sectorOfArea(parentQ.area);
      const used = new Set(next.usedQuestions);
      const cands = ctx.pool.list.filter((q) => !used.has(q.id) && sectorOfArea(q.area) === sector);
      const pick = cands[Math.floor(drng() * cands.length)];
      if (pick) {
        const r = addNode(next, solved, pick, 'debris', { locked: true });
        next = r.state;
        spawned.push(r.node);
      }
    }
  }

  const closedCircle = node.kind === 'bridge' && closesCircle(next, solved);
  return { state: next, spawned, closedCircle };
}

/** A bridge ‘closes a circle’ when it ends up close to a solved node of another branch. */
export function closesCircle(state: NetworkState, node: NetNode, radius = 110): boolean {
  return Object.values(state.nodes).some(
    (n) =>
      n.id !== node.id &&
      n.id !== node.parentId &&
      n.parentId !== node.id &&
      n.state !== 'open' &&
      Math.hypot(n.pos.x - node.pos.x, n.pos.y - node.pos.y) < radius &&
      polar(n.pos).r > 0,
  );
}

/** After a successful repair the children that were withheld grow. */
export function growMissing(
  state: NetworkState,
  nodeId: string,
  ctx: SpawnContext,
): { state: NetworkState; spawned: NetNode[] } {
  const node = state.nodes[nodeId];
  if (!node?.missing?.length) return { state, spawned: [] };
  const parentQ = ctx.pool.get(node.questionId);
  const cleared: NetNode = { ...node, missing: undefined };
  let next: NetworkState = { ...state, nodes: { ...state.nodes, [nodeId]: cleared } };
  const spawned: NetNode[] = [];
  if (node.missing.includes('deepen')) {
    const dq = pickDeepen(parentQ, next, ctx);
    if (dq) {
      const r = addNode(next, cleared, dq, 'deepen');
      next = r.state;
      spawned.push(r.node);
    }
  }
  if (node.missing.includes('bridge')) {
    const bq = pickBridge(parentQ, next, ctx);
    if (bq) {
      const r = addNode(next, cleared, bq, 'bridge');
      next = r.state;
      spawned.push(r.node);
    }
  }
  return { state: next, spawned };
}

export function unlockDebris(state: NetworkState, nodeId: string): NetworkState {
  const n = state.nodes[nodeId];
  if (!n || !n.locked) return state;
  return { ...state, nodes: { ...state.nodes, [nodeId]: { ...n, locked: false } } };
}

export function reviewNode(
  state: NetworkState,
  nodeId: string,
  correct: boolean,
  today: string,
): NetworkState {
  const n = state.nodes[nodeId];
  if (!n) return state;
  return { ...state, nodes: { ...state.nodes, [nodeId]: applyReview(n, correct, today) } };
}
