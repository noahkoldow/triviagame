import { describe, expect, it } from 'vitest';
import {
  LANGS,
  REVEAL_STEPS,
  STORY_CUES,
  STORY_TEXT,
  brainReveal,
  storyBeats,
  firewallReady,
  REVEAL_ID,
  LEAGUE_NOTICED_ID,
  leagueIsNew,
  leagueUnlocked,
  FINALE_AREAS,
  FINALE_AREA_NODES,
  FINALE_PHASE_PASS,
  FINALE_PHASE_QUESTIONS,
  FINALE_REWARD,
  GUARDIANS,
  GUARDIAN_WAKE,
  MOCK_QUESTIONS,
  Pool,
  SECTORS,
  canStartNode,
  catchUpStory,
  chapterOf,
  finalePhaseLine,
  finalePhaseState,
  finalePhases,
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
  WALL_AREAS,
  areaName,
  wallVoices,
  wallAlly,
  guardianFightLine,
  hallsOf,
  type PlayerState,
} from './index';
import { servedPool } from './served.testutil';

const pool = servedPool();
const DAY = '2026-10-01';

/**
 * Plays with perfect answers: always the oldest open node; a firewall once the chapter asks for
 * it and the network has grown there (until then it keeps solving nodes).
 */
function play(steps: number, until?: (p: PlayerState) => boolean): PlayerState {
  let p = initialPlayer(pool);
  for (let i = 0; i < steps && !until?.(p); i++) {
    const ch = chapterOf(storyFacts(p, pool), 'de');
    // walls stay a goal while the finale waits for knowledge in every area
    const wall =
      ch.n === 3 || (ch.n === 4 && !ch.finale) ? p.network.firewalls!.find((f) => firewallReady(Object.values(p.network.nodes), p.network.firewalls, f)) : undefined;
    if (wall) {
      p = recordBoss(p, pool, wall.id, true, '2026-10-01').player;
      continue;
    }
    if (ch.finale) {
      p = recordFinale(p, pool, SECTORS.length).player;
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
      // every wall has its own words, short enough to sit above a question
      expect(Object.keys(text.walls).sort(), lang).toEqual([...WALL_AREAS].sort());
      for (const w of [...Object.values(text.walls).flatMap((x) => [x.morph, x.guardian]), text.wallBolt]) {
        expect(w.length, lang).toBeGreaterThan(0);
        expect(w.length, lang).toBeLessThanOrEqual(160);
      }
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

  it('can be played from the first node to the ending once the server refills the areas', () => {
    const chapters = new Set<number>();
    const p = play(800, (x) => {
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
    const p = play(800, (x) => storyFacts(x, pool).finaleOpen);
    expect(leagueUnlocked(p)).toBe(false);
    expect(leagueUnlocked({ ...p, league: { ...p.league, playerId: 'registered' } })).toBe(false);
  });

  it('lets the league button glow after the reveal until it is tapped', () => {
    const p = play(800, (x) => x.story.finale);
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

describe('foreshadowing the firewalls', () => {
  it('Bolt notices the first wall out of the fog, before any is broken', () => {
    expect(storyFacts(initialPlayer(pool), pool).wallSeen).toBe(false);
    // the ring lies a good way out: the first answers do not reach it yet
    const first = recordCorrect(initialPlayer(pool), pool, 'n0', DAY, 0).player;
    expect(storyFacts(first, pool).wallSeen).toBe(false);
    expect(pendingBeats(first, pool).map((b) => b.id)).toEqual(['first-link']);
    const p = play(800, (x) => storyFacts(x, pool).wallSeen);
    // the beat waits for a second answer, so it does not land on top of the first one
    expect(storyFacts(p, pool).solved).toBeGreaterThanOrEqual(2);
    expect(storyFacts(p, pool).broken).toBe(0);
    expect(pendingBeats(p, pool).map((b) => b.id)).toContain('first-wall');
    // once a wall is broken the moment has passed
    const late = play(800, (x) => storyFacts(x, pool).broken >= 1);
    expect(pendingBeats(late, pool).map((b) => b.id)).not.toContain('first-wall');
  });

  it('every guardian names the two locked areas of its sector when it wakes', () => {
    for (const lang of LANGS) {
      for (const s of SECTORS) {
        const text = STORY_TEXT[lang].beats[`wake-${s}`]!.text.toLowerCase();
        const locked = hallsOf(s);
        expect(locked).toHaveLength(2);
        expect(locked.every((a) => WALL_AREAS.includes(a))).toBe(true);
        // the Muse rhymes, so it may name an area by its first word only
        for (const a of locked) expect(text, `${lang} ${s} ${a}`).toContain(areaName(a, lang).split(/[ ,]/)[0]!.toLowerCase());
      }
    }
  });

  it('the map shows the halls while a guardian wakes', () => {
    const focus = storyBeats('de').filter((b) => b.focus);
    expect(focus.map((b) => b.id)).toEqual(SECTORS.map((s) => `wake-${s}`));
    for (const b of focus) expect(b.id).toBe(`wake-${b.focus}`);
  });

  it('the core overhears morph.ai after the third wall, until the finale is won', () => {
    const three = play(800, (x) => storyFacts(x, pool).broken >= 3);
    const beats = pendingBeats(three, pool).map((b) => b.id);
    expect(beats.indexOf('core-glitch')).toBe(beats.indexOf('firewall-3') + 1);
    const won = play(800, (x) => x.story.finale);
    expect(pendingBeats(won, pool).map((b) => b.id)).not.toContain('core-glitch');
  });

  it('before a fight morph.ai taunts and the guardian answers, Bolt while it sleeps', () => {
    const p = initialPlayer(pool);
    const asleep = wallVoices(p, pool, 'astronomy');
    expect(asleep.morph).toBe(STORY_TEXT.de.walls.astronomy!.morph);
    expect(asleep.ally).toEqual({ who: 'bolt', name: 'Bolt', text: STORY_TEXT.de.wallBolt });
    const awake = play(800, (x) => storyFacts(x, pool).awake.includes('earth'));
    const en = { ...awake, profile: { ...awake.profile, lang: 'en' as const } };
    expect(wallVoices(en, pool, 'astronomy').ally).toEqual({
      who: GUARDIANS.earth.id,
      name: GUARDIANS.earth.name,
      text: STORY_TEXT.en.walls.astronomy!.guardian,
    });
  });

  it('the awake guardian fights beside the player and reacts in every language', () => {
    expect(wallAlly(initialPlayer(pool), pool, 'astronomy')).toBeNull();
    const awake = play(800, (x) => storyFacts(x, pool).awake.includes('earth'));
    expect(wallAlly(awake, pool, 'climate')).toEqual({ who: GUARDIANS.earth.id, name: GUARDIANS.earth.name });
    for (const lang of LANGS) {
      for (const g of Object.values(GUARDIANS)) {
        const words = STORY_TEXT[lang].guardianFight[g.id];
        expect(words.hit.length, `${lang} ${g.id}`).toBeGreaterThan(1);
        expect(words.hurt.length, `${lang} ${g.id}`).toBeGreaterThan(1);
        expect(guardianFightLine(lang, g.id, 'hit', 7)).toBe(words.hit[7 % words.hit.length]);
        expect(guardianFightLine(lang, g.id, 'breach', 0)).toBe(words.breach);
      }
    }
  });
});

describe('finale', () => {
  it('stays closed until roots, guardians, firewalls and every area are done', () => {
    const p = initialPlayer(pool);
    expect(recordFinale(p, pool, SECTORS.length)).toEqual({ player: p, passed: false });
    // four walls are not enough: every area needs its answered nodes first (D76)
    const walls = play(800, (x) => storyFacts(x, pool).broken >= SECTORS.length);
    const f = storyFacts(walls, pool);
    expect(f.areasReady).toBeLessThan(FINALE_AREAS);
    expect(f.finaleOpen).toBe(false);
    const ch = chapterOf(f, 'de');
    expect(ch).toMatchObject({ n: 4, done: f.areasReady, total: FINALE_AREAS });
    expect(ch.finale).toBeUndefined();
    expect(ch.goal).toContain(String(FINALE_AREA_NODES));
  });

  it('draws three questions per sector in four phases, new ones per attempt', () => {
    const phases = finalePhases(pool, 0, {}, []);
    expect(phases.map((ph) => ph.sector)).toEqual(SECTORS);
    for (const ph of phases) {
      expect(ph.questions).toHaveLength(FINALE_PHASE_QUESTIONS);
      for (const q of ph.questions) expect(sectorOfArea(q.area)).toBe(ph.sector);
      expect(ph.filed).toEqual([]);
    }
    const ids = phases.flatMap((ph) => ph.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
    const later = [1, 2, 3].map((a) => finalePhases(pool, a, {}, []).flatMap((ph) => ph.questions.map((q) => q.id)).join());
    expect(later.some((x) => x !== ids.join())).toBe(true);
  });

  it('asks the second question of a phase from a filed folder', () => {
    const q = pool.list.find((x) => sectorOfArea(x.area) === 'earth')!;
    const phases = finalePhases(pool, 0, {}, [{ questionId: q.id }]);
    const earth = phases.find((ph) => ph.sector === 'earth')!;
    expect(earth.filed).toEqual([q.id]);
    expect(earth.questions[1]!.id).toBe(q.id);
    expect(phases.find((ph) => ph.sector === 'science')!.filed).toEqual([]);
  });

  it('wins a phase with two right answers and loses it with two wrong ones or the clock', () => {
    expect(FINALE_PHASE_PASS).toBe(2);
    expect(finalePhaseState([])).toBe('on');
    expect(finalePhaseState([true, true])).toBe('won');
    expect(finalePhaseState([false, true])).toBe('on');
    expect(finalePhaseState([false, true, true])).toBe('won');
    expect(finalePhaseState([true, false, false])).toBe('lost');
    expect(finalePhaseState([true], true)).toBe('lost');
  });

  it('a lost duel costs integrity and counts; a won one ends the story', () => {
    const ready = play(800, (x) => storyFacts(x, pool).finaleOpen);
    expect(storyFacts(ready, pool).finaleOpen).toBe(true);
    expect(storyFacts(ready, pool).areasReady).toBe(FINALE_AREAS);
    const lost = recordFinale(ready, pool, SECTORS.length - 1);
    expect(lost.passed).toBe(false);
    expect(lost.player.integrity).toBe(ready.integrity - 1);
    expect(lost.player.story.finaleAttempts).toBe(1);
    const won = recordFinale(ready, pool, SECTORS.length);
    expect(won.passed).toBe(true);
    expect(won.player.story.finale).toBe(true);
    expect(won.player.gems).toBe(ready.gems + FINALE_REWARD.gems);
    expect(recordFinale(won.player, pool, SECTORS.length).passed).toBe(false);
  });

  it('morph.ai speaks at every phase in every language', () => {
    for (const lang of LANGS) for (const s of SECTORS) expect(finalePhaseLine(lang, s).length).toBeGreaterThan(0);
  });
});

describe('voices', () => {
  it('guardians speak only once awake', () => {
    const p = initialPlayer(pool);
    expect(guardianLine(p, pool, 'science', 'a')).toBeNull();
    const awake = play(800, (x) => storyFacts(x, pool).awake.includes('science'));
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
