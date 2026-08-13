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
}

export const PALETTES: ArtPalette[] = [
  {
    id: 'mono',
    name: 'Mono',
    paper: '#FCF9F3', // parchment-100
    ink: '#15090B',   // umber ink
    accent: '#6C523D',
    gold: '#8f8f8f',
    teal: '#3a3a3a',
  },
  {
    id: 'manuscript',
    name: 'Parchment',
    paper: '#F5E9D1', // parchment-300
    ink: '#15090B',   // umber
    accent: '#A62F1E', // madder
    gold: '#C9962E',   // the illumination gold
    teal: '#1E8A5E',   // verdigris
  },
  {
    id: 'icon',
    name: 'Icon',
    paper: '#E6D6BC', // parchment-500
    ink: '#15090B',
    accent: '#A62F1E',
    gold: '#C9962E',
    teal: '#1E8A5E',
  },
  {
    id: 'church',
    name: 'Church mural',
    paper: '#F5E9D1', // parchment-300
    ink: '#15090B',
    accent: '#A62F1E',
    gold: '#C9962E',
    teal: '#1E8A5E',
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
