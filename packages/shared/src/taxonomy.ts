import type { Sector } from './types';

/** The four sectors in their ring order around the core; neighbours share a firewall. */
export const SECTORS: Sector[] = ['science', 'earth', 'humanities', 'society'];

/** Angle (radians) of each sector around the core. Ring: science – earth – humanities – society. */
export const SECTOR_ANGLE: Record<Sector, number> = {
  science: -Math.PI / 2,
  earth: 0,
  humanities: Math.PI / 2,
  society: Math.PI,
};

export const SECTOR_COLOR: Record<Sector, string> = {
  science: '#1CB0F6',
  earth: '#58CC02',
  humanities: '#CE82FF',
  society: '#FFC800',
};

export interface Area {
  id: string;
  sector: Sector;
  de: string;
  en: string;
  /** What belongs to the area; the AI picks its topics inside this scope. */
  scope: string;
}

/** Three areas per sector; the first of each sector is open from the start. */
export const AREAS: Area[] = [
  {
    id: 'physics',
    sector: 'science',
    de: 'Naturwissenschaften',
    en: 'Natural sciences',
    scope: 'Relativitätstheorie, Aufbau der Atome, Periodensystem, physikalische Grundgesetze wie die Gravitation, Licht und Schall, chemische Reaktionen',
  },
  {
    id: 'biomedicine',
    sector: 'science',
    de: 'Biologie & Medizin',
    en: 'Biology & medicine',
    scope: 'Aufbau des menschlichen Körpers (Organe, Genetik), Evolution, Ökosysteme, Tiere und Pflanzen, Grundlagen der Gesundheit',
  },
  {
    id: 'technology',
    sector: 'science',
    de: 'Technologie & IT',
    en: 'Technology & IT',
    scope: 'Funktionsweise des Internets, Künstliche Intelligenz, Digitalisierung, wichtige Erfindungen der Menschheit',
  },
  {
    id: 'geography',
    sector: 'earth',
    de: 'Topographie',
    en: 'Topography',
    scope: 'Kontinente, Ozeane, die längsten Flüsse, die höchsten Gebirge, Hauptstädte und Ländergrenzen weltweit',
  },
  {
    id: 'climate',
    sector: 'earth',
    de: 'Klima & Umwelt',
    en: 'Climate & environment',
    scope: 'Klimazonen, Klimawandel, Plattentektonik (Erdbeben, Vulkane), Nachhaltigkeit',
  },
  {
    id: 'astronomy',
    sector: 'earth',
    de: 'Astronomie',
    en: 'Astronomy',
    scope: 'Unser Sonnensystem, Planeten, Sterne, Galaxien, Entstehung des Universums',
  },
  {
    id: 'history',
    sector: 'humanities',
    de: 'Geschichte',
    en: 'History',
    scope: 'Große Epochen (Antike, Mittelalter, Neuzeit), Weltkriege, Französische Revolution, wichtige historische Persönlichkeiten',
  },
  {
    id: 'arts',
    sector: 'humanities',
    de: 'Kunst, Literatur & Musik',
    en: 'Art, literature & music',
    scope: 'Klassische Epochen (Renaissance, Barock, Romantik), weltberühmte Werke (Goethe, Shakespeare, Da Vinci), Geschichte der Musik, Sprachen',
  },
  {
    id: 'philosophy',
    sector: 'humanities',
    de: 'Philosophie & Religion',
    en: 'Philosophy & religion',
    scope: 'Die großen Weltreligionen, antike Denker (Sokrates, Platon), moderne Strömungen (Aufklärung, Existenzialismus)',
  },
  {
    id: 'politics',
    sector: 'society',
    de: 'Politik & Staatskunde',
    en: 'Politics & civics',
    scope: 'Demokratische Grundwerte, Staatsformen, Aufbau der EU, Vereinte Nationen, Grundzüge geopolitischer Konflikte',
  },
  {
    id: 'economy',
    sector: 'society',
    de: 'Wirtschaft & Finanzen',
    en: 'Economy & finance',
    scope: 'Angebot und Nachfrage, Inflation, Globalisierung, Steuer- und Geldsystem',
  },
  {
    id: 'law',
    sector: 'society',
    de: 'Recht & Gesellschaft',
    en: 'Law & society',
    scope: 'Grundrechte, Aufbau des Rechtssystems, wichtige gesellschaftliche und soziologische Entwicklungen',
  },
];

const BY_ID = new Map(AREAS.map((a) => [a.id, a]));

export function areaById(id: string): Area {
  const a = BY_ID.get(id);
  if (!a) throw new Error(`Unknown area: ${id}`);
  return a;
}

export function isArea(id: string): boolean {
  return BY_ID.has(id);
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
