/** Non-persisted hand-off between the node screen and the map. */
let recent: string[] = [];

export function setRecentlySpawned(ids: string[]) {
  recent = ids;
}

export function takeRecentlySpawned(): string[] {
  const r = recent;
  recent = [];
  return r;
}
