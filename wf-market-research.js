// wf-market-research.js — fan-out market research: would Ethiopians (or the
// diaspora) pay for a fidel-photo filter app, and what is the realistic model?
// 4 research lenses → one synthesized verdict.

export const meta = {
  name: 'market-research',
  description: 'Fan-out market research on whether Ethiopians/diaspora would pay for a fidel photo-filter web app',
  phases: [
    { title: 'Research', detail: '4 market lenses in parallel' },
    { title: 'Synthesize', detail: 'merge into a verdict + realistic monetization model' },
  ],
}

const CONTEXT = `
geez-art is a free, zero-backend web app that turns photos/videos into mosaics of Ge'ez/Ethiopic fidel
letters. Target audience: the Ethiopian + diaspora community. It has a built-in viral loop (users share a
branded mosaic image; friends tap the URL baked in and make their own). It currently makes no money. The
owner is skeptical that anyone IN ETHIOPIA would pay for it, and wants honest market research.

Use WebSearch/WebFetch. Cite sources. Be specific with numbers and dates where possible. Be brutally
honest - the owner would rather hear the truth than a rosy guess. Do not edit files.
`

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['lens', 'findings', 'verdict'],
  properties: {
    lens: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['claim', 'evidence', 'confidence'],
        properties: {
          claim: { type: 'string' },
          evidence: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
    verdict: { type: 'string' },
  },
}

phase('Research')
const LENSES = [
  {
    key: 'ethiopia-demand',
    prompt:
      'Would consumers IN Ethiopia pay for a creative photo-filter web app (like a fidel-letter mosaic filter)? Research: (1) Ethiopia per-capita income + smartphone penetration + mobile data cost; (2) the mobile-money / telebirr ecosystem and whether in-app digital payments for small amounts are practical there; (3) app-purchase culture in Ethiopia (do people pay for apps, or is it free/ad-driven?); (4) any evidence of willingness to pay for creative/digital/cultural tools in-country. Give a straight answer: would an Ethiopia-based user pay $2-5 for this, yes/no, with the numbers to back it.',
  },
  {
    key: 'diaspora-demand',
    prompt:
      'Would the ETHIOPIAN DIASPORA (US, UK, Canada, Europe, Australia, Gulf) pay for a cultural identity app like a Ge\'ez fidel photo-filter? Research: (1) diaspora size + disposable income + existing spending on Ethiopian cultural products (coffee brands, music, clothing, events); (2) examples of diaspora-facing digital products that charge (language apps, Amharic content subscriptions, cultural e-commerce); (3) typical price points they accept for premium digital tools; (4) whether a $3-7 one-time "premium render / no watermark" would convert in this segment. Give a straight answer with numbers.',
  },
  {
    key: 'benchmark',
    prompt:
      'Benchmark: what do comparable photo-filter / creative web apps actually charge, and what do they earn? Research: (1) the industry norm for photo filters (free + ads vs freemium vs paid) - e.g. Prisma, Facetune, Picsart, VSCO pricing; (2) typical freemium conversion rates (0.5-5%?) for consumer creative tools; (3) any Amharic/Ethiopian creative or filter apps and how they monetize; (4) realistic revenue for a viral filter with ~10K-1M monthly users. Give concrete price points and conversion math.',
  },
  {
    key: 'model-fit',
    prompt:
      'Given the Ethiopian market reality (likely low willingness to pay in-country) AND a diaspora with money AND a viral loop, which monetization model actually fits? Evaluate: (1) freemium premium render via Lemon Squeezy/Stripe; (2) sponsor/"presented by" slot baked into the shared mosaic (coffee/diaspora brands); (3) print-on-demand posters; (4) Ko-fi/donations; (5) ads. Rank them for THIS product and audience. Also address: how does a zero-backend web app get discovered by the diaspora (the real buyers) vs in-Ethiopia users (the viral spreaders)? Recommend a concrete first revenue experiment with a cost/effort estimate.',
  },
]
const results = await parallel(
  LENSES.map((l) => () =>
    agent(`${CONTEXT}\n\nLENS: ${l.key}\nTASK: ${l.prompt}`, { label: `market:${l.key}`, phase: 'Research', schema: SCHEMA }),
  ),
)
const nonEmpty = results.filter(Boolean)
log(`${nonEmpty.length}/${LENSES.length} market lenses returned`)

phase('Synthesize')
const report = await agent(
  `${CONTEXT}\n\nMerge these ${nonEmpty.length} market-research reports into ONE honest final answer:\n` +
    `1. WOULD ETHIOPIANS PAY? A clear yes/no with the key numbers.\n` +
    `2. IF NOT ETHIOPIA, WHO PAYS? (diaspora? sponsors? nobody?)\n` +
    `3. THE REALISTIC FIRST MOVE: the single best revenue experiment (concrete, with expected $ range and effort).\n` +
    `4. What to NOT waste time on.\n` +
    `Be decisive and honest - no optimism bias.\n\nRESEARCH:\n${JSON.stringify(nonEmpty, null, 1)}`,
  { label: 'synthesize', phase: 'Synthesize' },
)
return report
