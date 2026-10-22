import type { NetNode } from './types';

/** Leitner intervals in days per box. */
export const BOX_DAYS = [0, 1, 3, 7, 14];

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function markDamaged(node: NetNode, today: string): NetNode {
  return { ...node, state: 'damaged', box: 1, dueDay: addDays(today, BOX_DAYS[1]!) };
}

export function isDue(node: NetNode, today: string): boolean {
  return node.state === 'damaged' && !!node.dueDay && node.dueDay <= today;
}

/** Result of a repair run on a damaged node. */
export function applyReview(node: NetNode, correct: boolean, today: string): NetNode {
  if (!correct) return { ...node, box: 1, dueDay: addDays(today, BOX_DAYS[1]!) };
  const box = node.box + 1;
  if (box >= BOX_DAYS.length) return { ...node, state: 'solved', box: 0, dueDay: undefined };
  return { ...node, box, dueDay: addDays(today, BOX_DAYS[box]!) };
}
