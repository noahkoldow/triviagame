import { createFirewalls } from './boss';
import type { PlayerState } from './game';
import { initialUnlockedAreas } from './monetization';
import { createOutposts } from './outposts';
import { SECTORS, isArea } from './taxonomy';
import type { Sector } from './types';

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
const OLD_SECTORS: Record<string, Sector> = { nature: 'earth', culture: 'humanities', history: 'society' };
const OLD_BEATS: Record<string, string> = {
  'wake-nature': 'wake-earth',
  'wake-culture': 'wake-humanities',
  'wake-history': 'wake-society',
};

/** The current id of an area, or undefined if it is unknown. */
export function migrateArea(id: string): string | undefined {
  return isArea(id) ? id : OLD_AREAS[id];
}

function migrateSector(id: string): Sector | undefined {
  return (SECTORS as string[]).includes(id) ? (id as Sector) : OLD_SECTORS[id];
}

function mapKeys<T>(m: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(m)) {
    const a = migrateArea(k);
    if (a && !(a in out)) out[a] = v;
  }
  return out;
}

/** Brings a loaded save up to the current taxonomy. Pure, and a no-op on current saves. */
export function migrateSave(p: PlayerState): PlayerState {
  const unlocked = [
    ...new Set([...initialUnlockedAreas(), ...p.unlockedAreas.map(migrateArea).filter((a): a is string => !!a)]),
  ];

  // firewalls keep their state; only their sector names change
  const oldFirewalls = p.network.firewalls ?? [];
  const firewalls = createFirewalls().map((fw) => {
    const old = oldFirewalls.find((o) => migrateSector(o.a) === fw.a && migrateSector(o.b) === fw.b);
    return old ? { ...fw, broken: old.broken, attempts: old.attempts } : fw;
  });

  // outposts are placed anew when they name areas that no longer exist
  const outpostsCurrent = (p.network.outposts ?? []).every((o) => isArea(o.area));
  const outposts = outpostsCurrent
    ? p.network.outposts
    : createOutposts(initialUnlockedAreas()).map((o) => ({ ...o, connected: unlocked.includes(o.area) }));

  return {
    ...p,
    unlockedAreas: unlocked,
    skill: mapKeys(p.skill),
    interest: mapKeys(p.interest),
    network: { ...p.network, firewalls, outposts },
    story: { ...p.story, seen: [...new Set(p.story.seen.map((id) => OLD_BEATS[id] ?? id))] },
  };
}
