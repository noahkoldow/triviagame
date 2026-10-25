import type { NetworkState } from './types';

/**
 * Collection albums (D61): themes that cut across the areas, made of built-in questions. An album
 * is full once every one of its questions is a solved node, which pays once. So a player who
 * explores many areas fills albums that a player staying in one area never completes. The names
 * are UI texts (`codex.albums` in the app).
 */
export interface Album {
  id: string;
  /** Built-in question ids; they exist in every language. */
  questions: string[];
}

export const ALBUMS: Album[] = [
  { id: 'antiquity', questions: ['his-pyramid', 'tf-olympia', 'mt-gods', 'hum-socrates', 'cl-rome'] },
  { id: 'sound', questions: ['tf-sound', 'cl-lightsound', 'cul-guitar', 'tf-piano', 'cul-bach'] },
  { id: 'breath', questions: ['nat-photosynthesis', 'cl-photo', 'nat-climate', 'ear-zones'] },
  { id: 'cosmos', questions: ['sci-light', 'sci-relativity', 'sci-gravwaves', 'ear-planets', 'ear-universe'] },
  { id: 'europe', questions: ['soc-eu', 'his-euro', 'his-wall', 'his-states'] },
  { id: 'code', questions: ['his-rosetta', 'his-printing', 'cul-grimm', 'sci-binary', 'sci-algo'] },
  { id: 'rules', questions: ['soc-powers', 'soc-basic', 'soc-court', 'soc-majority', 'soc-un'] },
  { id: 'earth', questions: ['nat-everest', 'nat-tectonic', 'tf-nile', 'nat-rainforest'] },
];

/** What a full album pays once. */
export const ALBUM_REWARD = { bits: 50, gems: 3 };

/** The questions of an album that are solved nodes. */
export function albumSolved(network: NetworkState, album: Album): string[] {
  const solved = new Set(Object.values(network.nodes).filter((n) => n.state !== 'open').map((n) => n.questionId));
  return album.questions.filter((q) => solved.has(q));
}

/** The albums whose questions are all solved. */
export function fullAlbums(network: NetworkState): string[] {
  return ALBUMS.filter((a) => albumSolved(network, a).length === a.questions.length).map((a) => a.id);
}
