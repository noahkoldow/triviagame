import { describe, expect, it } from 'vitest';
import { MOCK_QUESTIONS, Pool, initialPlayer, recordCorrect } from './index';

const pool = new Pool(MOCK_QUESTIONS);

describe('locked debris fields', () => {
  it('the first one shows up within the first few solved nodes', () => {
    let p = initialPlayer(pool);
    let solved = 0;
    let firstAt = -1;
    for (let i = 0; i < 12; i++) {
      const open = Object.values(p.network.nodes).find((n) => n.state === 'open' && !n.locked && n.kind !== 'debris');
      if (!open) break;
      p = recordCorrect(p, pool, open.id, '2026-10-01', 0).player;
      solved++;
      if (firstAt < 0 && Object.values(p.network.nodes).some((n) => n.locked)) firstAt = solved;
    }
    expect(firstAt).toBeGreaterThan(0);
    expect(firstAt).toBeLessThanOrEqual(3);
  });

  it('are children of a solved node, so the map can connect them', () => {
    let p = initialPlayer(pool);
    for (let i = 0; i < 4; i++) {
      const open = Object.values(p.network.nodes).find((n) => n.state === 'open' && !n.locked && n.kind !== 'debris');
      if (!open) break;
      p = recordCorrect(p, pool, open.id, '2026-10-01', 0).player;
    }
    for (const n of Object.values(p.network.nodes).filter((x) => x.locked)) {
      expect(n.parentId).not.toBeNull();
      expect(p.network.nodes[n.parentId!]!.state).not.toBe('open');
    }
  });
});
