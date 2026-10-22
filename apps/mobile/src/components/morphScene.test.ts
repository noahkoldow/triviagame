import { describe, expect, it, vi } from 'vitest';

vi.mock('@shopify/react-native-skia', () => {
  const builder = () => ({
    moveTo: () => undefined,
    lineTo: () => undefined,
    close: () => undefined,
    detach: () => ({}),
  });
  return { Skia: { PathBuilder: { Make: builder } } };
});
vi.mock('react-native-reanimated', () => ({ useReducedMotion: () => false }));

describe('intro scene component', () => {
  it('loads: its module-level paths are built without errors', async () => {
    const m = await import('./MorphScene');
    expect(typeof m.MorphScene).toBe('function');
  });
});
