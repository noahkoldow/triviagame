import { describe, expect, it } from 'vitest';
import {
  LANGS,
  REVEAL_STEPS,
  STORY_CUES,
  STORY_TEXT,
  brainReveal,
  storyBeats,
  firewallReached,
  REVEAL_ID,
  LEAGUE_NOTICED_ID,
  leagueIsNew,
  leagueUnlocked,
  FINALE_PASS,
  FINALE_QUESTIONS,
  FINALE_REWARD,
  GUARDIANS,
  GUARDIAN_WAKE,
  MOCK_QUESTIONS,
  Pool,
  SECTORS,
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

/**
 * Plays with perfect answers: always the oldest open node; a firewall once the chapter asks for
 * it and the network has grown there (until then it keeps solving nodes).
 */
function play(steps: number, until?: (p: PlayerState) => boolean): PlayerState {
  let p = initialPlayer(pool);
  for (let i = 0; i < steps && !until?.(p); i++) {
    const ch = chapterOf(storyFacts(p, pool), 'de');
    const wall =
      ch.n === 3 ? p.network.firewalls!.find((f) => !f.broken && firewallReached(Object.values(p.network.nodes), f)) : undefined;
    if (wall) {
      p = recordBoss(p, pool, wall.id, true).player;
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
  it('has unique beats with text, and unique log files, in every language', () => {
    const ids = STORY_CUES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    const withLog = storyBeats('de').filter((b) => b.log).map((b) => b.id);
    for (const lang of LANGS) {
      const text = STORY_TEXT[lang];
      // exactly the beats of the story, and the same ones leave a log file
      expect(Object.keys(text.beats).sort(), lang).toEqual([...ids].sort());
      const beats = storyBeats(lang);
      expect(beats.filter((b) => b.log).map((b) => b.id), lang).toEqual(withLog);
      const logs = beats.flatMap((b) => (b.log ? [b.log.name] : []));
      expect(new Set(logs).size, lang).toBe(logs.length);
      for (const b of beats) {
        expect(b.title.length, `${lang} ${b.id}`).toBeGreaterThan(0);
        // short enough for one dialog: the story carries charm, never walls of text
        expect(b.text.length, `${lang} ${b.id}`).toBeLessThanOrEqual(280);
      }
      expect(text.reveal, lang).toHaveLength(REVEAL_STEPS.length);
      expect(text.morphWrong.length, lang).toBeGreaterThan(2);
      expect(text.morphReformed.length, lang).toBeGreaterThan(1);
      for (const g of Object.values(text.guardianCorrect)) expect(g.length, lang).toBeGreaterThan(1);
    }
  });

  it('speaks the player’s language', () => {
    const de = recordCorrect(initialPlayer(pool), pool, 'n0', DAY, 0).player;
    const fr = { ...de, profile: { ...de.profile, lang: 'fr' as const } };
    expect(pendingBeats(fr, pool)[0]!.title).toBe(STORY_TEXT.fr.beats['first-link']!.title);
    expect(pendingBeats(fr, pool)[0]!.text).not.toBe(pendingBeats(de, pool)[0]!.text);
    expect(storyLogs(markSeen(fr, 'first-link'), 'es').map((l) => l.name)).toEqual(['NUCLEO_001.LOG']);
    expect(chapterOf(storyFacts(de, pool), 'en').goal).toBe('Solve the four starting nodes');
    expect(STORY_TEXT.fr.morphWrong).toContain(morphLine(fr, 'x'));
  });

  it('starts quiet and opens with chapter one', () => {
    const p = initialPlayer(pool);
    expect(pendingBeats(p, pool)).toEqual([]);
    expect(chapterOf(storyFacts(p, pool), 'de')).toMatchObject({ n: 1, done: 0, total: 4 });
  });

  it('the first right answer brings the first beat and log file', () => {
    const p = recordCorrect(initialPlayer(pool), pool, 'n0', DAY, 0).player;
    expect(pendingBeats(p, pool).map((b) => b.id)).toEqual(['first-link']);
    const seen = markSeen(p, 'first-link');
    expect(pendingBeats(seen, pool)).toEqual([]);
    expect(markSeen(seen, 'first-link')).toBe(seen);
    expect(storyLogs(seen, 'de').map((l) => l.name)).toEqual(['KERN_001.LOG']);
  });

  it('can be played from the first node to the ending with the built-in questions', () => {
    const chapters = new Set<number>();
    const p = play(400, (x) => {
      chapters.add(chapterOf(storyFacts(x, pool), 'de').n);
      return x.story.finale;
    });
    expect(p.story.finale).toBe(true);
    expect([...chapters].sort()).toEqual([1, 2, 3, 4, 5]);
    const f = storyFacts(p, pool);
    for (const s of SECTORS) expect(f.bySector[s]).toBeGreaterThanOrEqual(GUARDIAN_WAKE);
    expect(chapterOf(f, 'de').n).toBe(5);
    const beats = pendingBeats(p, pool).map((b) => b.id);
    for (const id of ['four-roots', 'guardians', 'firewall-4']) expect(beats).toContain(id);
    // morph.ai's last words and the league wait for the reveal (the network is the player's brain)
    expect(beats).not.toContain('finale-won');
    expect(leagueUnlocked(p)).toBe(true);
    const after = pendingBeats(markSeen(p, REVEAL_ID), pool).map((b) => b.id);
    expect(after).toContain('finale-won');
    expect(after).toContain('league');
  });

  it('keeps the ranking hidden until morph.ai is beaten, though everybody is on it', () => {
    const p = play(400, (x) => storyFacts(x, pool).finaleOpen);
    expect(leagueUnlocked(p)).toBe(false);
    expect(leagueUnlocked({ ...p, league: { ...p.league, playerId: 'registered' } })).toBe(false);
  });

  it('lets the league button glow after the reveal until it is tapped', () => {
    const p = play(400, (x) => x.story.finale);
    expect(leagueIsNew(p)).toBe(false);
    const revealed = markSeen(p, REVEAL_ID);
    expect(leagueIsNew(revealed)).toBe(true);
    expect(leagueIsNew(markSeen(revealed, LEAGUE_NOTICED_ID))).toBe(false);
  });

  it('tells the reveal in short steps that end on the whole brain', () => {
    const steps = brainReveal('de');
    expect(steps.length).toBeGreaterThan(3);
    for (const lang of LANGS) for (const s of brainReveal(lang)) expect(s.text.length, lang).toBeLessThanOrEqual(280);
    expect(steps[0]!.zoom).toBeLessThan(0.5);
    expect(steps[steps.length - 1]).toMatchObject({ zoom: 1, brain: 1 });
    expect(steps.some((s) => s.text.includes('Ich weiß, dass ich nichts weiß'))).toBe(true);
    expect(brainReveal('en').some((s) => s.quote && s.text.includes('I know that I know nothing'))).toBe(true);
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
