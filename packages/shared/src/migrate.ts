import { createFirewalls, type Firewall } from './boss';
import type { PlayerState } from './game';
import { settle } from './layout';
import { initialUnlockedAreas } from './monetization';
import { relayout, type Pool } from './network';
import { isArea } from './taxonomy';
import type { NetNode, NetworkState } from './types';
import { CORE_ZONE, OUTER_ZONES, WALL_RADIUS, wallBetween, zoneOfArea } from './walls';

/**
 * Saves from before the 12-area taxonomy (D44) name areas, sectors and story beats that no
 * longer exist. These tables say where each old one went; questions keep their ids.
 */
const OLD_AREAS: Record<string, string> = {
  chemistry: 'physics',
  computing: 'technology',
  medicine: 'biomedicine',
  biology: 'biomedicine',
  animals: 'biomedicine',
  music: 'arts',
  literature: 'arts',
  art: 'arts',
  language: 'arts',
  antiquity: 'history',
  modern: 'history',
};
const OLD_BEATS: Record<string, string> = {
  'wake-nature': 'wake-earth',
  'wake-culture': 'wake-humanities',
  'wake-history': 'wake-society',
};

/** The current id of an area, or undefined if it is unknown. */
export function migrateArea(id: string): string | undefined {
  return isArea(id) ? id : OLD_AREAS[id];
}

function mapKeys<T>(m: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(m)) {
    const a = migrateArea(k);
    if (a && !(a in out)) out[a] = v;
  }
  return out;
}

/**
 * Saves from before the walls (D58) had four firewalls on the sector borders, outposts, and
 * nodes anywhere in their sector. Nodes move into the zone of their area (with a pool), and
 * every outer area that was already open gets a broken wall with a gap in the ring.
 */
function toWalls(network: NetworkState, unlocked: string[], pool?: Pool): NetworkState {
  const { outposts: _outposts, ...rest } = network as NetworkState & { outposts?: unknown };
  const nodes: Record<string, NetNode> = {};
  const placed: { x: number; y: number }[] = [];
  const order = Object.values(network.nodes).sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
  for (const n of order) {
    const q = pool?.byId.get(n.questionId);
    const at = q && n.kind !== 'root' ? settle(n.pos, zoneOfArea(q.area), placed) : n.pos;
    nodes[n.id] = { ...n, pos: { ...n.pos, x: at.x, y: at.y } };
    placed.push(at);
  }
  const firewalls = createFirewalls().map((fw): Firewall => {
    if (!unlocked.includes(fw.area)) return fw;
    // the gap opens in the ring where the area comes closest to the core
    const own = Object.values(nodes)
      .filter((n) => pool?.byId.get(n.questionId)?.area === fw.area)
      .sort((a, b) => Math.hypot(a.pos.x, a.pos.y) - Math.hypot(b.pos.x, b.pos.y))[0];
    const z = OUTER_ZONES.find((o) => o.area === fw.area)!;
    const mid = (z.from + z.to) / 2;
    const toward = own?.pos ?? { x: Math.cos(mid) * WALL_RADIUS, y: Math.sin(mid) * WALL_RADIUS };
    const cell = wallBetween(fw.area, CORE_ZONE).sort(
      (a, b) => Math.hypot(a.x - toward.x, a.y - toward.y) - Math.hypot(b.x - toward.x, b.y - toward.y),
    )[0]!;
    return { ...fw, broken: true, breach: { x: cell.x, y: cell.y, from: CORE_ZONE } };
  });
  return { ...rest, nodes, firewalls };
}

/** Brings a loaded save up to the current taxonomy and map. Pure, and a no-op on current saves. */
export function migrateSave(p: PlayerState, pool?: Pool): PlayerState {
  const unlocked = [
    ...new Set([...initialUnlockedAreas(), ...p.unlockedAreas.map(migrateArea).filter((a): a is string => !!a)]),
  ];

  const walled = (p.network.firewalls ?? []).length > 0 && p.network.firewalls!.every((f) => typeof f.area === 'string');
  const walls = walled ? p.network : toWalls(p.network, unlocked, pool);
  // maps from before D60 are repaired once, so no link runs across the map any more
  const network = pool ? relayout(walls, pool) : walls;

  // before D49 the cache held whole folders: they move into the folder structure
  const oldFolders = (p.cache as unknown as { questionId: string; fragmentId: string; file?: unknown }[]).filter(
    (c) => typeof c.file !== 'string',
  );
  const archive = [...(p.archive ?? [])];
  for (const c of oldFolders) {
    if (!archive.some((a) => a.questionId === c.questionId && a.fragmentId === c.fragmentId)) {
      archive.push({ questionId: c.questionId, fragmentId: c.fragmentId });
    }
  }

  return {
    ...p,
    archive,
    cache: oldFolders.length ? p.cache.filter((c) => typeof c.file === 'string') : p.cache,
    unlockedAreas: unlocked,
    skill: mapKeys(p.skill),
    interest: mapKeys(p.interest),
    network,
    story: { ...p.story, seen: [...new Set(p.story.seen.map((id) => OLD_BEATS[id] ?? id))] },
  };
}
