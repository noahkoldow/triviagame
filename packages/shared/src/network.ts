import { createFirewalls, wallTarget, type Firewall } from './boss';
import { pickArea, type InterestMap } from './interest';
import { areaDistance } from './links';
import {
  LINK_REACH,
  MAX_LINK,
  MIN_GAP,
  linksCross,
  placeNode,
  rootPosition,
  polar,
  sectorDistance,
  settle,
  type Link,
} from './layout';
import { type Rng } from './rng';
import { targetDifficulty, BASE_SKILL, type SkillMap } from './skill';
import { markDamaged, applyReview } from './srs';
import type { Synapse } from './synapses';
import { SECTORS, sectorOfArea } from './taxonomy';
import type { NetNode, NetworkState, Question, Sector, Vec3 } from './types';
import { CORE_ZONE, clampToZone, moveBreach, traceVia, zoneOf, zoneOfArea, zoneRoute, type Breach } from './walls';

/** How strongly a new node leans toward the wall its branch is growing to. */
const WALL_PULL = { deepen: 0.7, bridge: 0.4 };
/** Version of the placement rules; a map placed with older ones is repaired once (`relayout`). */
export const LAYOUT_VERSION = 3;

export class Pool {
  readonly byId = new Map<string, Question>();
  /** Its own copy: the app refills the list when the language changes, the source array stays whole. */
  readonly list: Question[];
  constructor(list: Question[]) {
    this.list = [...list];
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
    firewalls: createFirewalls(),
    layout: LAYOUT_VERSION,
  };
}

export interface SpawnContext {
  pool: Pool;
  unlockedAreas: string[];
  skill: SkillMap;
  interest: InterestMap;
  rng: Rng;
  /** The area behind the wall this branch grows toward; questions drift toward it. */
  steerArea?: string;
  /** Where the branch grows from: its topics come from what one link can reach from there. */
  from?: { x: number; y: number };
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

/**
 * How far a trace from `from` has to run to reach the land of `area`: through the gaps on the way
 * into its zone, and in the core zone on into the wedge of its sector. Infinity when no gap leads
 * there; a way to a gap that would cross another trace counts as far.
 */
function reachOf(state: NetworkState, links: Link[], from: { x: number; y: number }, area: string): number {
  const zone = zoneOfArea(area);
  const route = zoneRoute(breachesOf(state.firewalls, state.synapses), zoneOf(from.x, from.y), zone);
  if (!route) return Infinity;
  let at = from;
  let d = 0;
  for (const gap of route) {
    d += Math.hypot(gap.x - at.x, gap.y - at.y);
    if (links.some((l) => linksCross({ a: at, b: gap }, l))) d += LINK_REACH;
    at = gap;
  }
  return zone === CORE_ZONE ? d + sectorDistance(at, sectorOfArea(area)) : d;
}

/** Measures candidate topics from where a branch grows (`from` unset: every topic is near). */
function reacher(state: NetworkState, from?: { x: number; y: number }) {
  if (!from) return () => 0;
  let links: Link[] | undefined;
  const memo = new Map<string, number>();
  return (area: string) => {
    let d = memo.get(area);
    if (d === undefined) {
      links ??= linksOf(state);
      d = reachOf(state, links, from, area);
      memo.set(area, d);
    }
    return d;
  };
}

/** The candidates one link can reach. */
function inReach(cands: Question[], reach: (area: string) => number): Question[] {
  return cands.filter((q) => reach(q.area) <= LINK_REACH);
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
  // a suggestion of another topic only when it is in reach; the own topic is always right here
  let cands = inReach(known(parent.deepen, ctx.pool).filter(ok), reacher(state, ctx.from));
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
  // a bridge leads into a topic next to it (D60): a suggested one, else any in reach. With none in
  // reach it stays in its own topic for now; without that it waits for new questions rather than
  // run a long way across the map
  const reach = reacher(state, ctx.from);
  let cands = inReach(known(parent.bridge, ctx.pool).filter(ok), reach);
  if (cands.length === 0) cands = inReach(ctx.pool.list.filter((q) => q.area !== parent.area && ok(q)), reach);
  if (cands.length === 0) cands = ctx.pool.list.filter((q) => q.area === parent.area && ok(q));
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

/** The gaps in the walls (broken firewalls and synapses), for routes between zones. */
export function breachesOf(firewalls: Firewall[] | undefined, synapses: Synapse[] = []): { area: string; breach: Breach }[] {
  return [
    ...(firewalls ?? []).flatMap((f) => (f.breach ? [{ area: f.area, breach: f.breach }] : [])),
    ...synapses.flatMap((s) => (s.gap ? [s.gap] : [])),
  ];
}

/**
 * Where a child in `zone` grows from: the parent itself in the same zone, otherwise the spot just
 * behind the last gap on the way there, so the branch passes through the wall and not over it.
 */
function growFrom(state: NetworkState, parent: Vec3, zone: string): Vec3 {
  const route = zoneRoute(breachesOf(state.firewalls, state.synapses), zoneOf(parent.x, parent.y), zone);
  const gap = route?.[route.length - 1];
  return gap ? { ...clampToZone(gap, zone), z: parent.z } : parent;
}

/** The traces the map draws, piece by piece: every node to its parent (through the gaps), roots to the core. */
function linksOf(state: NetworkState): Link[] {
  const gaps = breachesOf(state.firewalls, state.synapses);
  const out: Link[] = [];
  for (const n of Object.values(state.nodes)) {
    const a = n.parentId ? state.nodes[n.parentId]?.pos : { x: 0, y: 0 };
    if (!a) continue;
    const pts = [a, ...traceVia(gaps, a, n.pos), n.pos];
    for (let i = 1; i < pts.length; i++) out.push({ a: pts[i - 1]!, b: pts[i]! });
  }
  return out;
}

/** Where a new node of question `q` grows next to `parent`. */
function positionFor(
  state: NetworkState,
  parent: NetNode,
  q: Question,
  kind: 'deepen' | 'bridge' | 'debris',
  id: string,
): Vec3 {
  const sector = sectorOfArea(q.area);
  const zone = zoneOfArea(q.area);
  const existing = Object.values(state.nodes);
  const from = growFrom(state, parent.pos, zone);
  // branches reach for the walls: they lean toward a firewall the network has not reached yet
  const wall = kind === 'debris' ? undefined : wallTarget(state.firewalls, existing, from, sector);
  const target = wall ? { x: wall.x, y: wall.y, pull: WALL_PULL[kind as 'deepen' | 'bridge'] } : undefined;
  return placeNode({
    parent: from,
    // behind a gap the trace has come far enough: a short step on into the area
    kind: from === parent.pos ? kind : 'deepen',
    mainSector: sector,
    side: q.side,
    existing: existing.map((n) => n.pos),
    links: linksOf(state),
    seed: `${id}:${q.id}`,
    target,
    zone,
  });
}

function addNode(
  state: NetworkState,
  parent: NetNode,
  q: Question,
  kind: 'deepen' | 'bridge' | 'debris',
  extra: Partial<NetNode> = {},
): { state: NetworkState; node: NetNode } {
  const id = nextId(state);
  const pos = positionFor(state, parent, q, kind, id);
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

/** Lets the questions of a branch drift toward the area behind the wall it is growing to. */
function withSteer(state: NetworkState, node: NetNode, ctx: SpawnContext): SpawnContext {
  const sector = sectorOfArea(ctx.pool.get(node.questionId).area);
  const wall = wallTarget(state.firewalls, Object.values(state.nodes), node.pos, sector);
  return wall ? { ...ctx, steerArea: wall.firewall.area } : ctx;
}

/**
 * The wall around `area` broke at `breach`: a first (open) node of that area appears right behind
 * the gap, grown from `parent`. Opening the area itself is up to the caller.
 */
export function enterZone(
  state: NetworkState,
  area: string,
  breach: Breach,
  parent: NetNode,
  ctx: SpawnContext,
): { state: NetworkState; node?: NetNode } {
  const used = new Set(state.usedQuestions);
  const cands = ctx.pool.list.filter((q) => q.area === area && !used.has(q.id));
  const q = closest(cands, targetDifficulty(ctx.skill[area] ?? BASE_SKILL));
  if (!q) return { state };
  const id = nextId(state);
  const at = settle(
    clampToZone(breach, zoneOfArea(area)),
    zoneOfArea(area),
    Object.values(state.nodes).map((n) => n.pos),
  );
  const node: NetNode = {
    id,
    questionId: q.id,
    parentId: parent.id,
    kind: 'bridge',
    state: 'open',
    pos: { x: at.x, y: at.y, z: 0.5 },
    attempts: 0,
    box: 0,
  };
  return { state: { ...state, nodes: { ...state.nodes, [id]: node }, usedQuestions: [...state.usedQuestions, q.id] }, node };
}

/**
 * Marks a node as solved (or damaged when it needed many attempts) and spawns
 * its children: a deepening and a bridge (fewer after wrong answers). Locked debris
 * fields no longer spawn: the areas behind the walls took their place (see walls.ts).
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
  ctx = { ...ctx, from: parent.pos };
  for (const kind of kinds) {
    const q = kind === 'deepen' ? pickDeepen(parentQ, next, ctx) : pickBridge(parentQ, next, ctx);
    if (!q) {
      waiting.push(kind);
      continue;
    }
    const r = addNode(next, parent, q, kind);
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

/**
 * Repairs a map from before D60, once. In the order the nodes grew, a node whose topic its parent
 * cannot reach hangs on the nearest node that can (links only decide what the map draws and
 * which circles close); a node whose link is then short, free and crosses nothing keeps its
 * place, every other one is placed anew. A wall only counts as open from the first node behind
 * it on, as it was while the map grew. Maps from before the zones grew (layout 3) get their
 * breaches (and synapse gaps) moved onto the bigger walls first; nodes that now lie in the wrong zone are placed anew.
 */
export function relayout(old: NetworkState, pool: Pool): NetworkState {
  if ((old.layout ?? 1) >= LAYOUT_VERSION) return old;
  const state: NetworkState = {
    ...old,
    firewalls: old.firewalls?.map((f) => (f.breach ? { ...f, breach: moveBreach(f.area, f.breach) } : f)),
    synapses: old.synapses?.map((s) => (s.gap ? { ...s, gap: { ...s.gap, breach: moveBreach(s.gap.area, s.gap.breach) } } : s)),
  };
  const order = Object.values(state.nodes).sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
  const entered = new Set<string>();
  const nodes: Record<string, NetNode> = {};
  for (const n of order) {
    const q = pool.byId.get(n.questionId);
    if (!n.parentId || !nodes[n.parentId] || !q || n.kind === 'root') {
      nodes[n.id] = n;
      continue;
    }
    const view: NetworkState = {
      ...state,
      nodes,
      firewalls: state.firewalls?.map((f) => (f.broken && !entered.has(f.area) ? { ...f, broken: false, breach: undefined } : f)),
    };
    const links = linksOf(view);
    const reaches = (from: NetNode) => reachOf(view, links, from.pos, q.area) <= LINK_REACH;
    const parent = reaches(nodes[n.parentId]!)
      ? nodes[n.parentId]!
      : (Object.values(nodes)
          .sort((a, b) => Math.hypot(a.pos.x - n.pos.x, a.pos.y - n.pos.y) - Math.hypot(b.pos.x - n.pos.x, b.pos.y - n.pos.y))
          .find(reaches) ?? nodes[n.parentId]!);
    const zone = zoneOfArea(q.area);
    const from = growFrom(view, parent.pos, zone);
    const fits =
      parent.id === n.parentId &&
      zoneOf(n.pos.x, n.pos.y) === zone &&
      Math.hypot(n.pos.x - from.x, n.pos.y - from.y) <= MAX_LINK &&
      Object.values(nodes).every((e) => Math.hypot(e.pos.x - n.pos.x, e.pos.y - n.pos.y) >= MIN_GAP - 1) &&
      !links.some((l) => linksCross({ a: from, b: n.pos }, l));
    nodes[n.id] = { ...n, parentId: parent.id, pos: fits ? n.pos : positionFor(view, parent, q, n.kind, n.id) };
    entered.add(zone);
  }
  return { ...state, nodes, layout: LAYOUT_VERSION };
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
