import { SECTOR_COLOR } from '@nexus/shared';

export const colors = {
  bg: '#131F24',
  panel: '#1F2C33',
  panelHi: '#2B3B44',
  line: '#37464F',
  text: '#F1F7FB',
  dim: '#8FA3AD',
  accent: '#1CB0F6',
  primary: '#58CC02',
  good: '#58CC02',
  bad: '#FF4B4B',
  warn: '#FF9600',
  gem: '#CE82FF',
  bit: '#1CB0F6',
  sector: SECTOR_COLOR,
};

/** Darker shade used for the thick "3D" bottom edge of buttons, cards and map objects. */
export function shade(hex: string, amount = 0.28): string {
  return mix(hex, "#000000", amount);
}

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
