/**
 * Ethiopian classical-art design data.
 *
 * Pure data module: these palettes power both the app UI skin and the mosaic
 * color presets. Now drawn from the MALEDA design-language tokens
 * (dev/maleda-design-language/tokens.css) — parchment grounds, umber ink,
 * madder red, the illumination gold, verdigris. The default "Parchment"
 * preset is the canonical Maleda painting palette. No DOM, no dependencies.
 */

export interface ArtPalette {
  id: string;
  name: string;
  paper: string;
  ink: string;
  accent: string;
  gold: string;
  teal: string;
  /**
   * The pigments this preset's COLORIZED mosaic is allowed to use — every
   * source cell maps to its NEAREST pigment. Drawn from the Maleda wheel
   * (madder 38.7° → ochre → saffron → gold 80.7°, one cool counterpoint
   * verdigris 159.3°, umber/ink for depth); the 180–270° zone stays empty —
   * no pinks, blues, or purples can ever appear.
   */
  pigments: string[];
}

/** The canonical Maleda warm set — parchment lights through madder/ochre/
 *  saffron/gold to verdigris and umber/ink depth. */
const PIGMENTS_MANUSCRIPT = [
  '#FCF9F3', '#F5E9D1', '#F0DFBD', // parchment-100/300, pale gold
  '#E8A33D', '#E46F30', '#C9962E', // saffron, ochre, gold
  '#A62F1E', '#651E15',            // madder, deep madder
  '#1E8A5E', '#1A5039',            // verdigris, deep verdigris
  '#6C523D', '#573928', '#3A2016', // umber ladder
  '#15090B',                       // ink
];

export const PALETTES: ArtPalette[] = [
  {
    id: 'mono',
    name: 'Mono',
    paper: '#FCF9F3', // parchment-100
    ink: '#15090B',   // umber ink
    accent: '#6C523D',
    gold: '#8f8f8f',
    teal: '#3a3a3a',
    pigments: ['#FCF9F3', '#D9D2C4', '#A79E8B', '#6E6553', '#3A3329', '#15090B'], // grayscale
  },
  {
    id: 'manuscript',
    name: 'Parchment',
    paper: '#F5E9D1', // parchment-300
    ink: '#15090B',   // umber
    accent: '#A62F1E', // madder
    gold: '#C9962E',   // the illumination gold
    teal: '#1E8A5E',   // verdigris
    pigments: PIGMENTS_MANUSCRIPT,
  },
  {
    id: 'icon',
    name: 'Icon',
    paper: '#E6D6BC', // parchment-500
    ink: '#15090B',
    accent: '#A62F1E',
    gold: '#C9962E',
    teal: '#1E8A5E',
    pigments: ['#F5E9D1', '#F0DFBD', '#E8C46A', '#C9962E', '#A62F1E', '#651E15', '#1E8A5E', '#573928', '#15090B'],
  },
  {
    id: 'church',
    name: 'Church mural',
    paper: '#F5E9D1', // parchment-300
    ink: '#15090B',
    accent: '#A62F1E',
    gold: '#C9962E',
    teal: '#1E8A5E',
    pigments: ['#F5E9D1', '#E1C488', '#C9962E', '#A62F1E', '#7A1F14', '#1A5039', '#3A2016', '#15090B'],
  },
];

export const DEFAULT_PALETTE: ArtPalette = PALETTES[1]; // "manuscript"

export function cssVars(p: ArtPalette): Record<string, string> {
  return {
    '--paper': p.paper,
    '--ink': p.ink,
    '--accent': p.accent,
    '--gold': p.gold,
    '--teal': p.teal,
  };
}
