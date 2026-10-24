import { describe, expect, it } from 'vitest';
import {
  BOSS_QUESTIONS,
  BRAIN_REVEAL,
  REVEAL_ID,
  leagueUnlocked,
  FINALE_PASS,
  FINALE_QUESTIONS,
  FINALE_REWARD,
  GUARDIANS,
  GUARDIAN_WAKE,
  MOCK_QUESTIONS,
  Pool,
  SECTORS,
  STORY_BEATS,
  canStartNode,
  catchUpStory,
  chapterOf,
  finaleQuestions,
  guardianLine,
  initialPlayer,
  markSeen,
  morphLine,
  pendingBeats,
  recordBoss,
  recordCorrect,
  recordFinale,
  sectorOfArea,
  storyFacts,
  storyLogs,
  type PlayerState,
} from './index';

const pool = new Pool(MOCK_QUESTIONS);
const DAY = '2026-10-01';

/** Plays with perfect answers: always the oldest open node, firewalls once the chapter asks for them. */
function play(steps: number, until?: (p: PlayerState) => boolean): PlayerState {
  let p = initialPlayer(pool);
  for (let i = 0; i < steps && !until?.(p); i++) {
    const ch = chapterOf(storyFacts(p, pool));
    if (ch.n === 3) {
      const fw = p.network.firewalls!.find((f) => !f.broken)!;
      p = recordBoss(p, pool, fw.id, BOSS_QUESTIONS).player;
      continue;
    }
    if (ch.n === 4) {
      p = recordFinale(p, pool, FINALE_QUESTIONS).player;
      continue;
    }
    const open = Object.values(p.network.nodes)
      .filter((n) => canStartNode(p, n.id, DAY) && n.state === 'open')
      .sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
    if (open.length === 0) break;
    p = recordCorrect(p, pool, open[0]!.id, DAY, 0).player;
  }
  return p;
}

describe('story', () => {
  it('has unique beats with text, and unique log files', () => {
    const ids = STORY_BEATS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    const logs = STORY_BEATS.flatMap((b) => (b.log ? [b.log.name] : []));
    expect(new Set(logs).size).toBe(logs.length);
    for (const b of STORY_BEATS) {
      expect(b.title.length, b.id).toBeGreaterThan(0);
      // short enough for one dialog: the story carries charm, never walls of text
      expect(b.text.length, b.id).toBeLessThanOrEqual(280);
    }
  });

  it('starts quiet and opens with chapter one', () => {
    const p = initialPlayer(pool);
    expect(pendingBeats(p, pool)).toEqual([]);
    expect(chapterOf(storyFacts(p, pool))).toMatchObject({ n: 1, done: 0, total: 4 });
  });

  it('the first right answer brings the first beat and log file', () => {
    const p = recordCorrect(initialPlayer(pool), pool, 'n0', DAY, 0).player;
    expect(pendingBeats(p, pool).map((b) => b.id)).toEqual(['first-link']);
    const seen = markSeen(p, 'first-link');
    expect(pendingBeats(seen, pool)).toEqual([]);
    expect(markSeen(seen, 'first-link')).toBe(seen);
    expect(storyLogs(seen).map((l) => l.name)).toEqual(['KERN_001.LOG']);
  });

  it('can be played from the first node to the ending with the built-in questions', () => {
    const chapters = new Set<number>();
    const p = play(400, (x) => {
      chapters.add(chapterOf(storyFacts(x, pool)).n);
      return x.story.finale;
    });
    expect(p.story.finale).toBe(true);
    expect([...chapters].sort()).toEqual([1, 2, 3, 4, 5]);
    const f = storyFacts(p, pool);
    for (const s of SECTORS) expect(f.bySector[s]).toBeGreaterThanOrEqual(GUARDIAN_WAKE);
    expect(chapterOf(f).n).toBe(5);
    const beats = pendingBeats(p, pool).map((b) => b.id);
    for (const id of ['four-roots', 'guardians', 'firewall-4']) expect(beats).toContain(id);
    // morph.ai's last words and the league wait for the reveal (the network is the player's brain)
    expect(beats).not.toContain('finale-won');
    expect(leagueUnlocked(p)).toBe(true);
    const after = pendingBeats(markSeen(p, REVEAL_ID), pool).map((b) => b.id);
    expect(after).toContain('finale-won');
    expect(after).toContain('league');
  });

  it('keeps the league closed until morph.ai is beaten', () => {
    const p = play(400, (x) => storyFacts(x, pool).finaleOpen);
    expect(leagueUnlocked(p)).toBe(false);
    expect(leagueUnlocked({ ...p, league: { ...p.league, playerId: 'joined-before' } })).toBe(true);
  });

  it('tells the reveal in short steps that end on the whole brain', () => {
    expect(BRAIN_REVEAL.length).toBeGreaterThan(3);
    for (const s of BRAIN_REVEAL) expect(s.text.length).toBeLessThanOrEqual(280);
    expect(BRAIN_REVEAL[0]!.zoom).toBeLessThan(0.5);
    expect(BRAIN_REVEAL[BRAIN_REVEAL.length - 1]).toMatchObject({ zoom: 1, brain: 1 });
    expect(BRAIN_REVEAL.some((s) => s.text.includes('Ich weiß, dass ich nichts weiß'))).toBe(true);
  });

  it('catches old saves up to the latest beat only', () => {
    const p = play(30);
    const pending = pendingBeats(p, pool);
    expect(pending.length).toBeGreaterThan(1);
    const caught = catchUpStory(p, pool);
    expect(pendingBeats(caught, pool)).toEqual([pending[pending.length - 1]]);
  });
});

describe('finale', () => {
  it('stays closed until roots, guardians and firewalls are done', () => {
    const p = initialPlayer(pool);
    expect(recordFinale(p, pool, FINALE_QUESTIONS)).toEqual({ player: p, passed: false });
  });

  it('draws two questions per sector in turns, new ones per attempt', () => {
    const qs = finaleQuestions(pool, 0, {});
    expect(qs).toHaveLength(FINALE_QUESTIONS);
    expect(qs.map((q) => sectorOfArea(q.area))).toEqual([...SECTORS, ...SECTORS]);
    expect(new Set(qs.map((q) => q.id)).size).toBe(FINALE_QUESTIONS);
    const later = [1, 2, 3].map((a) => finaleQuestions(pool, a, {}).map((q) => q.id).join());
    expect(later.some((ids) => ids !== qs.map((q) => q.id).join())).toBe(true);
  });

  it('a lost duel costs integrity and counts; a won one ends the story', () => {
    const ready = play(400, (x) => storyFacts(x, pool).finaleOpen);
    expect(storyFacts(ready, pool).finaleOpen).toBe(true);
    const lost = recordFinale(ready, pool, FINALE_PASS - 1);
    expect(lost.passed).toBe(false);
    expect(lost.player.integrity).toBe(ready.integrity - 1);
    expect(lost.player.story.finaleAttempts).toBe(1);
    const won = recordFinale(ready, pool, FINALE_PASS);
    expect(won.passed).toBe(true);
    expect(won.player.story.finale).toBe(true);
    expect(won.player.gems).toBe(ready.gems + FINALE_REWARD.gems);
    expect(recordFinale(won.player, pool, FINALE_QUESTIONS).passed).toBe(false);
  });
});

describe('voices', () => {
  it('guardians speak only once awake', () => {
    const p = initialPlayer(pool);
    expect(guardianLine(p, pool, 'science', 'a')).toBeNull();
    const awake = play(400, (x) => storyFacts(x, pool).awake.includes('science'));
    const line = guardianLine(awake, pool, 'science', 'a');
    expect(line?.who).toBe(GUARDIANS.science.id);
    expect(line?.text.length).toBeGreaterThan(0);
    expect(guardianLine(awake, pool, 'science', 'a')).toEqual(line);
  });

  it('MORPH mocks before the ending and comforts after it', () => {
    const p = initialPlayer(pool);
    const before = morphLine(p, 'x');
    expect(morphLine(p, 'x')).toBe(before);
    const after = morphLine({ ...p, story: { ...p.story, finale: true } }, 'x');
    expect(after).not.toBe(before);
  });
});
