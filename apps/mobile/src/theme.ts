import { SECTOR_COLOR } from '@nexus/shared';

export const colors = {
  bg: '#070B16',
  panel: '#101827',
  panelHi: '#182236',
  line: '#26324A',
  text: '#E8EEF8',
  dim: '#8A97B1',
  accent: '#22D3EE',
  good: '#4ADE80',
  bad: '#F87171',
  warn: '#FBBF24',
  gem: '#A78BFA',
  bit: '#38BDF8',
  sector: SECTOR_COLOR,
};

export const radius = { sm: 10, md: 16, lg: 24 };

export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => {
    const x = (pa >> s) & 255;
    const y = (pb >> s) & 255;
    return Math.round(x + (y - x) * t);
  };
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}
