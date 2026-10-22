import type { Sector } from './types';

export const SECTORS: Sector[] = ['science', 'nature', 'culture', 'history'];

/** Angle (radians) of each sector around the core. Ring: science–nature–culture–history. */
export const SECTOR_ANGLE: Record<Sector, number> = {
  science: -Math.PI / 2,
  nature: 0,
  culture: Math.PI / 2,
  history: Math.PI,
};

export const SECTOR_COLOR: Record<Sector, string> = {
  science: '#1CB0F6',
  nature: '#58CC02',
  culture: '#CE82FF',
  history: '#FFC800',
};

export interface Area {
  id: string;
  sector: Sector;
  de: string;
  en: string;
}

export const AREAS: Area[] = [
  { id: 'physics', sector: 'science', de: 'Physik', en: 'Physics' },
  { id: 'chemistry', sector: 'science', de: 'Chemie', en: 'Chemistry' },
  { id: 'computing', sector: 'science', de: 'Informatik', en: 'Computing' },
  { id: 'medicine', sector: 'science', de: 'Medizin', en: 'Medicine' },
  { id: 'biology', sector: 'nature', de: 'Biologie', en: 'Biology' },
  { id: 'geography', sector: 'nature', de: 'Geografie', en: 'Geography' },
  { id: 'climate', sector: 'nature', de: 'Klima & Erde', en: 'Climate & Earth' },
  { id: 'animals', sector: 'nature', de: 'Tiere', en: 'Animals' },
  { id: 'music', sector: 'culture', de: 'Musik', en: 'Music' },
  { id: 'literature', sector: 'culture', de: 'Literatur', en: 'Literature' },
  { id: 'art', sector: 'culture', de: 'Kunst', en: 'Art' },
  { id: 'language', sector: 'culture', de: 'Sprache', en: 'Language' },
  { id: 'antiquity', sector: 'history', de: 'Antike', en: 'Antiquity' },
  { id: 'modern', sector: 'history', de: 'Neuzeit', en: 'Modern times' },
  { id: 'politics', sector: 'history', de: 'Politik & Recht', en: 'Politics & law' },
  { id: 'economy', sector: 'history', de: 'Wirtschaft', en: 'Economy' },
];

const BY_ID = new Map(AREAS.map((a) => [a.id, a]));

export function areaById(id: string): Area {
  const a = BY_ID.get(id);
  if (!a) throw new Error(`Unknown area: ${id}`);
  return a;
}

export function sectorOfArea(id: string): Sector {
  return areaById(id).sector;
}

export function areasOfSector(sector: Sector): Area[] {
  return AREAS.filter((a) => a.sector === sector);
}

/** Neighbouring sectors in the ring. */
export function neighbours(sector: Sector): [Sector, Sector] {
  const i = SECTORS.indexOf(sector);
  return [SECTORS[(i + 3) % 4]!, SECTORS[(i + 1) % 4]!];
}
