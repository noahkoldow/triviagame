/** Non-persisted hand-off between the node screen and the map. */
let recent: string[] = [];

export function setRecentlySpawned(ids: string[]) {
  recent = ids;
}

/** Adds nodes that grew in the background (waiting branches) without dropping the others. */
export function addRecentlySpawned(ids: string[]) {
  recent = [...recent, ...ids.filter((id) => !recent.includes(id))];
}

export function takeRecentlySpawned(): string[] {
  const r = recent;
  recent = [];
  return r;
}

/** The node whose debris field the map should open next (after a wrong answer). */
let debrisReturn: string | null = null;

export function setDebrisReturn(nodeId: string | null) {
  debrisReturn = nodeId;
}

export function takeDebrisReturn(): string | null {
  const r = debrisReturn;
  debrisReturn = null;
  return r;
}

/** Bolt's hint after a rewarded second chance, kept until the node is solved. */
const hints = new Map<string, string>();

export function setHint(nodeId: string, text: string) {
  hints.set(nodeId, text);
}

export function getHint(nodeId: string): string | null {
  return hints.get(nodeId) ?? null;
}

export function clearHint(nodeId: string) {
  hints.delete(nodeId);
}
