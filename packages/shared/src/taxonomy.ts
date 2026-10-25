import type { Lang } from './lang';
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
  fr: string;
  es: string;
  /** What belongs to the area (in English, as the model prompts are); the AI picks its topics inside this scope. */
  scope: string;
}

/** Three areas per sector; the first of each sector is open from the start. */
export const AREAS: Area[] = [
  {
    id: 'physics',
    sector: 'science',
    de: 'Naturwissenschaften',
    en: 'Natural sciences',
    fr: 'Sciences naturelles',
    es: 'Ciencias naturales',
    scope: 'relativity, the structure of atoms, the periodic table, basic laws of physics such as gravity, light and sound, chemical reactions',
  },
  {
    id: 'biomedicine',
    sector: 'science',
    de: 'Biologie & Medizin',
    en: 'Biology & medicine',
    fr: 'Biologie & médecine',
    es: 'Biología y medicina',
    scope: 'the human body (organs, genetics), evolution, ecosystems, animals and plants, basics of health',
  },
  {
    id: 'technology',
    sector: 'science',
    de: 'Technologie & IT',
    en: 'Technology & IT',
    fr: 'Technologie & informatique',
    es: 'Tecnología e informática',
    scope: 'how the internet works, artificial intelligence, digitalisation, major inventions of humankind',
  },
  {
    id: 'geography',
    sector: 'earth',
    de: 'Topographie',
    en: 'Topography',
    fr: 'Topographie',
    es: 'Topografía',
    scope: 'continents, oceans, the longest rivers, the highest mountain ranges, capitals and borders around the world',
  },
  {
    id: 'climate',
    sector: 'earth',
    de: 'Klima & Umwelt',
    en: 'Climate & environment',
    fr: 'Climat & environnement',
    es: 'Clima y medio ambiente',
    scope: 'climate zones, climate change, plate tectonics (earthquakes, volcanoes), sustainability',
  },
  {
    id: 'astronomy',
    sector: 'earth',
    de: 'Astronomie',
    en: 'Astronomy',
    fr: 'Astronomie',
    es: 'Astronomía',
    scope: 'our solar system, planets, stars, galaxies, the origin of the universe',
  },
  {
    id: 'history',
    sector: 'humanities',
    de: 'Geschichte',
    en: 'History',
    fr: 'Histoire',
    es: 'Historia',
    scope: 'the great eras (antiquity, middle ages, modern times), the world wars, the French Revolution, important historical figures',
  },
  {
    id: 'arts',
    sector: 'humanities',
    de: 'Kunst, Literatur & Musik',
    en: 'Art, literature & music',
    fr: 'Art, littérature & musique',
    es: 'Arte, literatura y música',
    scope: 'classical periods (Renaissance, Baroque, Romanticism), world-famous works (Goethe, Shakespeare, Cervantes, Molière, Da Vinci), the history of music, languages',
  },
  {
    id: 'philosophy',
    sector: 'humanities',
    de: 'Philosophie & Religion',
    en: 'Philosophy & religion',
    fr: 'Philosophie & religion',
    es: 'Filosofía y religión',
    scope: 'the major world religions, ancient thinkers (Socrates, Plato), modern movements (Enlightenment, existentialism)',
  },
  {
    id: 'politics',
    sector: 'society',
    de: 'Politik & Staatskunde',
    en: 'Politics & civics',
    fr: 'Politique & institutions',
    es: 'Política e instituciones',
    scope: 'democratic values, forms of government, the structure of the EU, the United Nations, outlines of geopolitical conflicts',
  },
  {
    id: 'economy',
    sector: 'society',
    de: 'Wirtschaft & Finanzen',
    en: 'Economy & finance',
    fr: 'Économie & finance',
    es: 'Economía y finanzas',
    scope: 'supply and demand, inflation, globalisation, tax and monetary systems',
  },
  {
    id: 'law',
    sector: 'society',
    de: 'Recht & Gesellschaft',
    en: 'Law & society',
    fr: 'Droit & société',
    es: 'Derecho y sociedad',
    scope: 'fundamental rights, the structure of the legal system, important social and sociological developments',
  },
];

const BY_ID = new Map(AREAS.map((a) => [a.id, a]));

export function areaById(id: string): Area {
  const a = BY_ID.get(id);
  if (!a) throw new Error(`Unknown area: ${id}`);
  return a;
}

/** The name of an area in the player's language. */
export function areaName(id: string, lang: Lang): string {
  return areaById(id)[lang];
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
