export const MAX_INTEGRITY = 5;
export const MAX_ENERGY = 5;

export interface Reward {
  xp: number;
  bits: number;
  gems: number;
}

export interface RewardInput {
  difficulty: number;
  attempts: number; // attempts including the successful one
  rewinds: number;
  kind: 'root' | 'deepen' | 'bridge' | 'debris' | 'review';
  /** All key fragments were in the cache when answering, and the cache was not opened. */
  prepared?: boolean;
  /** A bridge that hits an already solved neighbourhood closes a circle. */
  closedCircle?: boolean;
}

export function rewardFor(i: RewardInput): Reward {
  const first = i.attempts <= 1;
  let xp = 10 * i.difficulty + (first ? 10 : 0);
  let bits = 5 + 3 * i.difficulty + (i.rewinds === 0 ? 3 : 0);
  let gems = 0;
  if (i.prepared) bits += 6;
  if (first && i.difficulty >= 4) gems += 1;
  if (i.closedCircle) {
    gems += 1;
    bits += 10;
  }
  if (i.kind === 'debris') {
    xp *= 2;
    bits *= 3;
  }
  if (i.kind === 'review') {
    xp = Math.round(xp / 2);
    gems = 0;
  }
  return { xp, bits, gems };
}

export function levelFromXp(xp: number): { level: number; into: number; next: number } {
  let level = 1;
  let need = 60;
  let left = xp;
  while (left >= need) {
    left -= need;
    level++;
    need = Math.round(need * 1.25);
  }
  return { level, into: left, next: need };
}

export function streakAfter(
  streak: number,
  lastDay: string | null,
  today: string,
  freezes: number,
): { streak: number; freezes: number } {
  if (!lastDay) return { streak: 1, freezes };
  if (lastDay === today) return { streak, freezes };
  const gap = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastDay}T00:00:00Z`)) / 86400000,
  );
  if (gap === 1) return { streak: streak + 1, freezes };
  if (gap > 1 && gap - 1 <= freezes) return { streak: streak + 1, freezes: freezes - (gap - 1) };
  return { streak: 1, freezes };
}
