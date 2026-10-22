export type SkillMap = Record<string, number>;

export const BASE_SKILL = 1000;
const K = 32;

export function questionRating(difficulty: number): number {
  return 800 + difficulty * 200;
}

export function expected(skill: number, rating: number): number {
  return 1 / (1 + Math.pow(10, (rating - skill) / 400));
}

export function updateSkill(skill: number, difficulty: number, correct: boolean): number {
  const e = expected(skill, questionRating(difficulty));
  return Math.round(skill + K * ((correct ? 1 : 0) - e));
}

/** Difficulty (1..5) at which the player has about a 50 % chance. */
export function targetDifficulty(skill: number): 1 | 2 | 3 | 4 | 5 {
  const d = Math.round((skill - 800) / 200);
  return Math.min(5, Math.max(1, d)) as 1 | 2 | 3 | 4 | 5;
}
