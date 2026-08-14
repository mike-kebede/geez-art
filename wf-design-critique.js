// wf-design-critique.js — fan-out design review of the top band + overall layout.
// 4 lenses (hierarchy, consistency, craft, responsive) → one decisive apply-this plan.

export const meta = {
  name: 'design-critique',
  description: 'Fan-out design review: 4 lenses on the top band + layout, synthesized into concrete CSS/HTML changes',
  phases: [
    { title: 'Review', detail: '4 design lenses in parallel' },
    { title: 'Synthesize', detail: 'merge into an apply-this plan' },
  ],
}

const CONTEXT = `
geez-art (C:\\Users\\mike-work\\Desktop\\geez-art) is a zero-backend Vite+TS web app that turns photos/videos into mosaics of Ethiopic letters. It follows the Maleda Ethiopian-classical design language: parchment grounds (#FCF9F3/#F5E9D1), umber ink (#15090B), madder accent (#A62F1E), scarce gold (#C9962E), light + dark themes.

The user (a designer) says the current layout "doesn't look good" and wants it fixed with good design principles. The pain is the TOP ACTION BAND (src/style.css: the .controls / .controls-primary / .controls-secondary rules ~line 495-560; index.html: the <main class="stage"> structure ~line 95-215). It currently has a large bordered "Choose a photo or video" dropzone + a Share button on row 1, then Download/Invert/Colorful letters/Texture/Palette on row 2, plus a floating Share CTA that fades over the preview after 3s, plus a share popup (being added) centered over the preview. It reads disjointed and the chooser/share proportion has been repeatedly rejected.

The stage is a CSS grid: the top band spans full width (row 1), the showcase (the artwork, the hero) is the big left area below it, and the side-panel (Try an example + Letters picker + Advanced=Adjust sliders + More exports) is the right column. The band must not push the artwork too far down or crowd it. The user wants the chooser + Share to be the two focal actions but balanced, everything else quiet.

Read src/style.css, index.html, and src/app.ts as needed. This is a CODE review - the DOM/CSS is the source of truth. Give CONCRETE recommendations: exact CSS values (heights, gaps, radii, colors), what to remove/move, and the resulting visual hierarchy. No vague advice. Do not edit files.

YOUR JOB: review against YOUR lens below and return a structured report.
`

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['lens', 'problems', 'recommendations', 'verdict'],
  properties: {
    lens: { type: 'string' },
    problems: {
      type: 'array', items: {
        type: 'object', additionalProperties: false,
        required: ['issue', 'why', 'severity'],
        properties: { issue: { type: 'string' }, why: { type: 'string' }, severity: { type: 'string' } },
      },
    },
    recommendations: {
      type: 'array', items: {
        type: 'object', additionalProperties: false,
        required: ['what', 'how', 'files'],
        properties: { what: { type: 'string' }, how: { type: 'string' }, files: { type: 'array', items: { type: 'string' } } },
      },
    },
    verdict: { type: 'string' },
  },
}

phase('Review')
const LENSES = [
  {
    key: 'hierarchy',
    prompt:
      'Visual hierarchy: the band must have ONE clear primary action with correct size/emphasis ordering. The band mixes a giant bordered chooser, a Share button, small pills, a floating CTA, and a popup. Decide the cleanest hierarchy. Should the chooser be the empty-state CTA (big, centered, hero) instead of a toolbar item? How should the chooser + Share pair look so neither dwarfs the other?',
  },
  {
    key: 'consistency',
    prompt:
      'System consistency: spacing scale, border radii, control heights, alignment, and color usage across the top band + controls. List every inconsistent value you find (e.g. a 999px-radius pill beside an 18px-radius box, mismatched heights, uneven gaps) and give one consistent token set.',
  },
  {
    key: 'craft',
    prompt:
      'Overall craft: what exactly makes it look "not good"? Proportion, white space, visual weight, the focal-vs-secondary contrast, clutter, redundancy (e.g. Share in the topbar + band + float). Propose the cleanest arrangement of the top area and how it should relate to the artwork hero and the side panel.',
  },
  {
    key: 'responsive',
    prompt:
      'Responsive + touch: how should the top band, the side panel, and the share popup behave at 360-768px? The artwork must stay near the top. Give breakpoint-specific CSS (<=920px, <=620px, <=480px).',
  },
]
const results = await parallel(
  LENSES.map((l) => () =>
    agent(`${CONTEXT}\n\nLENS: ${l.key}\nTASK: ${l.prompt}`, { label: `design:${l.key}`, phase: 'Review', schema: SCHEMA }),
  ),
)
const nonEmpty = results.filter(Boolean)
log(`${nonEmpty.length}/${LENSES.length} design lenses returned`)

phase('Synthesize')
const plan = await agent(
  `${CONTEXT}\n\nMerge these ${nonEmpty.length} design reviews into ONE concrete "apply this" plan:\n` +
    `1. The FINAL layout for the top band + its relationship to the artwork hero and side panel.\n` +
    `2. Exact CSS changes (rule-by-rule with values).\n` +
    `3. Any HTML moves.\n` +
    `4. What to REMOVE.\n` +
    `Rank by impact. Be decisive - one coherent design, not a menu of options.\n\n` +
    `REVIEWS:\n${JSON.stringify(nonEmpty, null, 1)}`,
  { label: 'synthesize', phase: 'Synthesize' },
)
return plan
