/**
 * Ethiopian classical-art design data.
 *
 * Pure data module: these palettes power both the app UI skin and the mosaic
 * color presets. Flat, saturated, warm — drawn from church murals and
 * manuscript illumination (parchment grounds, deep Ethiopian reds, ochre
 * golds, muted teals). No DOM, no dependencies.
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
    paper: '#ffffff',
    ink: '#111111',
    accent: '#5a5a5a',
    gold: '#8f8f8f',
    teal: '#3a3a3a',
  },
  {
    id: 'manuscript',
    name: 'Parchment',
    paper: '#f3ecdd',
    ink: '#2a1a12',
    accent: '#8a2b1d',
    gold: '#b98a2f',
    teal: '#1f5c58',
  },
  {
    id: 'icon',
    name: 'Icon',
    paper: '#e8dcc0',
    ink: '#241510',
    accent: '#a3271d',
    gold: '#c9a13a',
    teal: '#21655f',
  },
  {
    id: 'church',
    name: 'Church mural',
    paper: '#efe6d2',
    ink: '#24150f',
    accent: '#7a1f14',
    gold: '#cfab55',
    teal: '#1d5a52',
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
