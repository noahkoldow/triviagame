import { createFirewalls, wallTarget } from './boss';

/** How strongly a bridge leans toward a firewall it is growing to. */
const WALL_PULL = 0.6;
import { initialUnlockedAreas } from './monetization';
import { pickArea, type InterestMap } from './interest';
import { OUTPOST_REACH, areaDistance, createOutposts, steerTarget } from './outposts';
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
  return {
    nodes,
    usedQuestions: used,
    outposts: createOutposts(initialUnlockedAreas()),
    firewalls: createFirewalls(),
  };
}

export interface SpawnContext {
  pool: Pool;
  unlockedAreas: string[];
  skill: SkillMap;
  interest: InterestMap;
  rng: Rng;
  /** Area of the outpost this branch grows toward; questions drift toward it. */
  steerArea?: string;
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

/** Keeps only the candidates closest to the area the branch is growing toward. */
function steer(cands: Question[], area?: string): Question[] {
  if (!area || cands.length === 0) return cands;
  const best = Math.min(...cands.map((q) => areaDistance(q.area, area)));
  return cands.filter((q) => areaDistance(q.area, area) === best);
}

/** The suggested follow-ups that are in the pool (a suggestion may point to a question this device lacks). */
function known(ids: string[], pool: Pool): Question[] {
  return ids.flatMap((id) => {
    const q = pool.byId.get(id);
    return q ? [q] : [];
  });
}

export function pickDeepen(parent: Question, state: NetworkState, ctx: SpawnContext) {
  const used = new Set(state.usedQuestions);
  const ok = (q: Question) => !used.has(q.id) && ctx.unlockedAreas.includes(q.area);
  let cands = known(parent.deepen, ctx.pool).filter(ok);
  if (cands.length === 0) {
    cands = ctx.pool.list.filter(
      (q) => q.area === parent.area && ok(q) && q.difficulty >= parent.difficulty,
    );
  }
  // at the top of an area any fresh question of it still goes deeper than nothing
  if (cands.length === 0) cands = ctx.pool.list.filter((q) => q.area === parent.area && ok(q));
  const target = targetDifficulty(ctx.skill[parent.area] ?? BASE_SKILL) + 0;
  return closest(steer(cands, ctx.steerArea), Math.max(target, parent.difficulty));
}

export function pickBridge(
  parent: Question,
  state: NetworkState,
  ctx: SpawnContext,
  exclude: string[] = [],
) {
  const used = new Set([...state.usedQuestions, ...exclude]);
  const ok = (q: Question) => !used.has(q.id) && ctx.unlockedAreas.includes(q.area);
  let cands = known(parent.bridge, ctx.pool).filter(ok);
  if (cands.length === 0) {
    cands = ctx.pool.list.filter((q) => q.area !== parent.area && ok(q));
  }
  if (cands.length === 0) return undefined;
  const steered = steer(cands, ctx.steerArea);
  const areas = [...new Set(steered.map((q) => q.area))];
  const area = pickArea(areas, ctx.interest, exposureOf(state, ctx.pool), ctx.rng);
  const inArea = steered.filter((q) => q.area === area);
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
  pull = 0,
): { state: NetworkState; node: NetNode } {
  const sector = sectorOfArea(q.area);
  const existing = Object.values(state.nodes);
  // bridges reach for the borders: they lean toward a firewall the network has not reached yet;
  // deepenings (and bridges without such a wall) lean toward the next disturbed outpost
  const wall = kind === 'bridge' ? wallTarget(state.firewalls, existing, parent.pos, sector) : undefined;
  const out = steerTarget(state.outposts, parent.pos, sector);
  const target = wall
    ? { x: wall.x, y: wall.y, pull: WALL_PULL }
    : out && pull > 0
      ? { x: out.x, y: out.y, pull }
      : undefined;
  const id = nextId(state);
  const pos = placeNode({
    parent: parent.pos,
    kind,
    mainSector: sector,
    side: q.side,
    existing: existing.map((n) => n.pos),
    seed: `${id}:${q.id}`,
    target,
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
      ...state,
      nodes: { ...state.nodes, [id]: node },
      usedQuestions: [...state.usedQuestions, q.id],
    },
  };
}

/** Lets the questions of a branch drift toward the outpost it is growing to. */
function withSteer(state: NetworkState, node: NetNode, ctx: SpawnContext): SpawnContext {
  const sector = sectorOfArea(ctx.pool.get(node.questionId).area);
  const out = steerTarget(state.outposts, node.pos, sector);
  return out ? { ...ctx, steerArea: out.area } : ctx;
}

/** Connects an outpost: its area opens up and a (still disturbed) node appears there. */
export function connectOutpost(
  state: NetworkState,
  outpostId: string,
  parent: NetNode | undefined,
  ctx: SpawnContext,
): { state: NetworkState; node?: NetNode } {
  const o = state.outposts?.find((x) => x.id === outpostId && !x.connected);
  if (!o) return { state };
  const outposts = state.outposts!.map((x) => (x.id === outpostId ? { ...x, connected: true } : x));
  let next: NetworkState = { ...state, outposts };
  const used = new Set(state.usedQuestions);
  const cands = ctx.pool.list.filter((q) => q.area === o.area && !used.has(q.id));
  const q = closest(cands, targetDifficulty(ctx.skill[o.area] ?? BASE_SKILL));
  if (!q) return { state: next };
  const from =
    parent ??
    Object.values(state.nodes).sort(
      (a, b) => Math.hypot(a.pos.x - o.x, a.pos.y - o.y) - Math.hypot(b.pos.x - o.x, b.pos.y - o.y),
    )[0]!;
  const id = nextId(next);
  const node: NetNode = {
    id,
    questionId: q.id,
    parentId: from.id,
    kind: 'bridge',
    state: 'open',
    pos: { x: o.x, y: o.y, z: 0.5 },
    attempts: 0,
    box: 0,
  };
  next = { ...next, nodes: { ...next.nodes, [id]: node }, usedQuestions: [...next.usedQuestions, q.id] };
  return { state: next, node };
}

/** Outposts that a freshly placed node is close enough to connect. */
export function outpostsReachedBy(state: NetworkState, node: NetNode): string[] {
  return (state.outposts ?? [])
    .filter((o) => !o.connected && Math.hypot(o.x - node.pos.x, o.y - node.pos.y) <= OUTPOST_REACH)
    .map((o) => o.id);
}

/**
 * Marks a node as solved (or damaged when it needed many attempts) and spawns
 * its children: a deepening and a bridge (fewer after wrong answers). Locked debris
 * fields no longer spawn: the disturbed outposts took their place (see outposts.ts).
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
  ctx = withSteer(state, node, ctx);

  // wrong answers slow the network down: first try grows everything, the second
  // only the deepening, from the third on nothing until a repair run succeeds
  const withheld: ('deepen' | 'bridge')[] =
    node.kind === 'debris' ? [] : attempts >= 3 ? ['deepen', 'bridge'] : attempts === 2 ? ['bridge'] : [];
  let solved: NetNode = { ...node, attempts, state: 'solved', missing: withheld.length ? withheld : undefined };
  if (attempts >= 2) solved = markDamaged(solved, today);
  let next: NetworkState = { ...state, nodes: { ...state.nodes, [nodeId]: solved } };
  const spawned: NetNode[] = [];

  if (node.kind !== 'debris') {
    const kinds = (['deepen', 'bridge'] as const).filter((k) => !withheld.includes(k));
    const grown = growChildren(next, solved, parentQ, kinds, ctx);
    next = grown.state;
    spawned.push(...grown.spawned);
  }

  const closedCircle = node.kind === 'bridge' && closesCircle(next, solved);
  return { state: next, spawned, closedCircle };
}

/**
 * Grows the given children of a node. A child that finds no question yet is not lost: it is
 * remembered as `waiting` on the node and grows once new questions arrive (`growWaiting`).
 */
function growChildren(
  state: NetworkState,
  parent: NetNode,
  parentQ: Question,
  kinds: readonly ('deepen' | 'bridge')[],
  ctx: SpawnContext,
): { state: NetworkState; spawned: NetNode[] } {
  let next = state;
  const spawned: NetNode[] = [];
  const waiting: ('deepen' | 'bridge')[] = [];
  for (const kind of kinds) {
    const q = kind === 'deepen' ? pickDeepen(parentQ, next, ctx) : pickBridge(parentQ, next, ctx);
    if (!q) {
      waiting.push(kind);
      continue;
    }
    const r = addNode(next, parent, q, kind, {}, kind === 'deepen' ? 0.7 : 0.3);
    next = r.state;
    spawned.push(r.node);
  }
  const current = next.nodes[parent.id]!;
  const merged = [...new Set([...(current.waiting ?? []), ...waiting])];
  const updated: NetNode = { ...current, waiting: merged.length ? merged : undefined };
  return { state: { ...next, nodes: { ...next.nodes, [parent.id]: updated } }, spawned };
}

/** New questions arrived: every child that was waiting for one tries to grow again. */
export function growWaiting(state: NetworkState, ctx: SpawnContext): { state: NetworkState; spawned: NetNode[] } {
  let next = state;
  const spawned: NetNode[] = [];
  for (const node of Object.values(state.nodes)) {
    if (!node.waiting?.length) continue;
    const kinds = node.waiting;
    const cleared: NetNode = { ...next.nodes[node.id]!, waiting: undefined };
    next = { ...next, nodes: { ...next.nodes, [node.id]: cleared } };
    const grown = growChildren(next, cleared, ctx.pool.get(node.questionId), kinds, withSteer(next, cleared, ctx));
    next = grown.state;
    spawned.push(...grown.spawned);
  }
  return { state: next, spawned };
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
  ctx = withSteer(state, node, ctx);
  const cleared: NetNode = { ...node, missing: undefined };
  const next: NetworkState = { ...state, nodes: { ...state.nodes, [nodeId]: cleared } };
  return growChildren(next, cleared, parentQ, node.missing, ctx);
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
