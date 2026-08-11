// wf-rubric-audit.js — 12 persona reviewers, each graded against an industry-standard rubric.
// Round 2 of the critic fan-out: round 1 was free-form; round 2 is rubric-grounded.

export const meta = {
  name: 'rubric-audit',
  description: '12 persona reviewers grade geez-art against industry-standard rubrics (WCAG, OWASP, Core Web Vitals, AARRR, …)',
  phases: [
    { title: 'Audit', detail: '12 rubric-graded persona reviews in parallel' },
    { title: 'Synthesize', detail: 'one agent merges, dedupes, and ranks the findings' },
  ],
}

const CONTEXT = `
geez-art — a zero-backend, client-side web app (Vite + TypeScript, vanilla DOM) that turns photos and
videos into mosaics of Ge'ez/Ethiopic fidel letters. Product goal: a free viral "filter" for the Ethiopian
+ diaspora audience (send a pic, friend taps the URL baked into the image, makes their own, shares onward).
Source root: C:\\Users\\mike-work\\Desktop\\geez-art.

App runs two ways right now:
- Dev server: http://localhost:5199 (may be briefly busy — the author's Playwright suite uses it; a quick
  HTTP GET of the page is fine, do not hammer it, and do NOT run the full test suite yourself).
- Production build: \`npm run build\` → dist/ is clean (tsc + vite build green).

DEPLOYMENT IS DELIBERATELY PARKED by the user. Anything that only manifests on a live URL (og:image
preview, CSP enforcement, share-card rendering, DNS) is "deploy-blocked", not a fixable bug.

THIS IS A RE-AUDIT (round 3). Two prior rounds of 12 persona reviews surfaced ~60 findings; the author has
since fixed the tractable ones. Fixed-and-verified (do NOT re-report as new; you may mark them PASS if the
code confirms them):
- Round 2: aspect-ratio math; EXIF single-source orientation; ≤1600px source + video-frame downscaling;
  decode-time resize (createImageBitmap) for 12MP photos; 4000px output-height cap; self-contained HTML
  export (embedded Ethiopic font); og-image.png 1200×630 + absolute-URL og/twitter meta +
  summary_large_image + JSON-LD; CSP + nosniff + X-Frame-Options + frame-ancestors + base-uri +
  form-action + /assets cache-control; dev-only test hooks; video audio capture; replay blob-URL cleanup;
  three-tap default (Advanced disclosure); sticky share bar; bilingual Amharic (share hint preserved,
  empty-state synced); static halo; church attribution; a11y fixes (zoom keyboard panning, slider
  aria-labels, touch targets ≥44px, focus re-home, focus contrast, mosaic text alternative, picker
  aria-pressed, skip link, announce-on-ready, neutral mosaic name); iOS video-export fallback (GIF hint);
  HEIC friendly error; opt-in analytics seam with share-outcome/funnel events; runtime-derived share URL;
  share-path downscale; colored-atlas renderer for colorize; adaptive video fps; GIF long-edge cap +
  failure honesty; empty-ramp blanking; lazy picker; lazy gifenc; dead code removed; "Try an example"
  loads the icon-classical sample; privacy & parents notice; favicon gold harmonized; palette-driven frame
  accent.
- Round 3 (just committed): CSP now allows blob: media (media-src 'self' blob: + img-src blob:) so video
  mode + replay survive production headers (was a release-blocker — now covered by a dist-based test that
  serves the real artifact with real headers); share band stamped at FINAL resolution (downscale-first)
  so the URL CTA is legible; video/GIF exports carry the URL band (paintBrandedCapture); 4000px cap now
  holds for very tall sources (cols reduced first); 64KB JPEG header probe so 12MP decode-time resize
  engages; ramp measurement yields to the event loop; color-atlas 3-entry LRU; audio stays unmuted for
  the full recording window; videoBitsPerSecond applies to mp4 too + recording downscaled ≤1280;
  empty-MIME .heic reaches the friendly error + video routing by extension; share-sheet cancel reports
  "cancelled"; zero-upload network-interception test; DEPLOY.md analytics/CSP reconciliation.
- Round 3.5 (just committed): LANGUAGE TOGGLE — the whole UI switches between English-only and
  Amharic-only via a topbar selector (src/i18n.ts dictionary; data-i18n re-rendering; dynamic t() calls);
  all Amharic verified by two 3-linguist panels. Video/GIF watermark is now a URL-only English band sized
  to fit (no overflow). Export buttons wrap two-per-row. M5 device-aware default detail. M7 palettes
  govern colorful mode (cell colors blended toward palette ink). M12 referral ?ref=share on the image
  band + referral_visit event. L20 in-page analytics disclosure; L21 expanded privacy note; L24 solid
  surfaces; L25 status copy; L26 hero-fidel gold; L27 PWA manifest + icons; L30 dist perf-budget test.
- Round 3.6 (just committed): F1 color-atlas rows keyed by SORTED color position (wrong-color bug);
  F2 video load-generation token (double-load race); F3 video-mode column clamp (140); F4 color atlas
  decoupled from cellPx (fixed reference size, drawImage scales); F5 willReadFrequently on source/frame
  canvases; F6/F8/F9/F24/F27/F28 Amharic-mode completeness (Noto Ethiopic in chrome stack, ARIA
  names/titles follow the toggle, source chip + stat line + palette names + setup-error localized,
  analytics disclosure survives toggles, terminology, pickerHint span); F7 shareText localized; F10/F21
  bare band URL + ref in the share link; F13 CSP hardening (script-src, Permissions-Policy, COOP);
  F15 48px touch targets; F19 lang/palette persistence + Amharic auto-detect; F25 typed t() keys;
  F42 dead bilingual CSS removed.
- Round 3.7 (just committed): videoGen supersede race closed (any teardown
  invalidates in-flight loads); Detail slider MAX capped at 240 on coarse/low-mem;
  dynamic ARIA (picker tiles, zoom-pan, partial-family, no-letters) localized and
  re-applied on toggle; replay Close focus deferred a rAF; Amharic footerRespect
  joins the decorative ፊደል; reduced-motion pauses AFTER the first frame and
  disables exports.
- Round 3.8 (just committed): status line no longer stuck on "Loading…" after a
  language toggle; two hardcoded live-region strings routed through t();
  M5 guard widened to all coarse-pointer devices (6-8GB Androids); color atlas is
  now a FIXED 64-level index built once per palette (no per-frame rebuild in
  colorful video); clipboard sleep → event poll; videoGen supersede race test
  (DEV stall seam); DEPLOY.md analytics privacy/COPPA warnings; picker per-letter
  aria re-applied on toggle.
- Round 3.9 (just committed): video-supersede ERROR/TIMEOUT path respects the
  generation token (no fresh-state clobber); recordings cancelled on
  Clear/teardown; non-text contrast ≥3:1 (--hairline #a89c8a); showcase/
  controls/ramp-preview ARIA localized; boot status localized; video-frame cap
  512px; exporters use the loop's effective fps; share TEXT carries a per-share
  referral token (band stays bare).
- Round 3.10 (just committed): video-audio via 0-gain MediaStreamDestination tap;
  share CTA .catch; getSourcePass pre-downsamples to ~2× grid (first-drop INP);
  Amharic zoom-out label fixed (ያሳንሱ); --hairline to ~3:1 + off-tile border;
  lang-toggle/checkbox 48px; topbar status ellipsis; Copy-link action + referral
  undercount doc; mobile (Pixel 7) test project.
- Round 3.11 (just committed): video-export audio CORRECTED — one MediaElementSource
  per video load, source→dest direct (no 0-gain), ctx.close on teardown, export
  buttons disabled at entry; atlas caches keyed by ramp identity (cp fingerprint);
  desktop still-render col cap by deviceMemory; canonical link; mp4-first
  recording; status full-width row ≤480px; persistence test.
- Round 3.12 (just committed): video-audio FINALLY correct — element UNMUTED for
  MediaElementSource capture (muted attenuates to RMS 0), speakers silenced via a
  0-gain tap to ctx.destination; recordCanvas rejects on recorder error and races
  a 5s guard (no stranded export buttons).
- Round 3.13 (just committed): topbar lang-toggle width leak fixed; family-tile
  48px + picker grid 100px cells; GIF band stamped at GIF-final 480px; static
  Ethiopic woff2 preload in head; recording repaint throttled; video render
  clamped by total cell count (~20k); zoomPanAria Amharic corrected; ?demo=1
  auto-demo.
- Round 3.14 (just committed): video-download test asserts real container + size
  floor; still renders get a total-cell budget (25-40k); superseded video loads
  revoke only their OWN url; Download PNG is branded; drops work on the giant
  fidel + loaded mosaic + never navigate; replay focus moves in/out correctly.
- Round 3.15 (just committed): recordCanvas stops only its own video tracks (a
  second export no longer silent); picker tile/expand accessible names +
  toggle refresh; og-image regenerated from a real mosaic render (was 90%
  blank); band height snapped even; L30 budget 34KB; I18nKey enforced from the
  en dict.

Test suite: tests/e2e.spec.ts — 74 Playwright tests expected green (Chromium; the suite builds dist and
validates it under the real CSP headers). Read the file to assess COVERAGE; the author is running it, so
do not execute it.

Grade the CURRENT code fresh against your rubric and give an honest 0-100 score. Re-reporting an already
fixed item as a NEW finding is a mistake; noting "previously FAIL, now PASS" in a criterion verdict is
encouraged. Find genuinely remaining issues only.

YOUR JOB: review the codebase (and, if useful, the page) against the rubric for YOUR persona below.
Report ONLY findings that are NEW, BROKEN, or genuinely UNADDRESSED. For each finding give:
rubric criterion, verdict (PASS/FAIL/WARN), severity (info/low/medium/high/critical), evidence
(file:line or URL), and a concrete recommendation. Do not edit any files. Return the structured result.
`

const RUBRICS = [
  {
    key: 'performance',
    persona: 'Web Performance Engineer',
    rubric:
      'Google Core Web Vitals (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1) + bundle/task budgets. ' +
      'Assess: main-bundle weight (app JS ~68 kB, Ethiopic woff2 ~198 kB, exifr lazy chunk), font loading ' +
      'strategy (preload vs fontsource), initial render path, debounced re-render, sprite-atlas blitting, ' +
      '≤1600px source downscaling, and any jank on low-end CPUs. Use the built dist/ if you want to audit ' +
      'what actually ships.',
  },
  {
    key: 'a11y',
    persona: 'Accessibility Auditor',
    rubric:
      'WCAG 2.2 Level AA (all 4 principles; 1.4.3 contrast ≥ 4.5:1, 1.4.4 resize, 2.1.1 keyboard, 2.4.7 ' +
      'focus-visible, 3.3.1 errors, 4.1.2 name/role/value) + axe-core-style automated checks. Check the ' +
      'sliders, picker (aria-pressed), details/summary keyboard path, skip link, zoom controls, live region ' +
      '(role=status), mosaic aria-label, and reduced-motion handling.',
  },
  {
    key: 'security',
    persona: 'Security Reviewer',
    rubric:
      'OWASP Web Security Testing Guide v4.2 / Top 10 (2021). Assess: XSS surfaces (innerHTML usage), CSP ' +
      'adequacy in public/_headers, file-input handling (paths, types, HEIC), blob-URL lifecycle, third-party ' +
      'network calls (should be ZERO at runtime), dependency CVEs (run \`npm audit --omit=dev\`), and ' +
      'clickjacking/nosniff/referrer headers.',
  },
  {
    key: 'mobile',
    persona: 'Mobile & Low-End Device Critic',
    rubric:
      'Nielsen 10 Usability Heuristics scored with severity ratings (0=cosmetic … 4=usability catastrophe), ' +
      'plus Material touch-target guidance (≥48×48dp) and 4G + low-end-CPU throttling lens. Focus: the ' +
      'three-tap flow, 12MP photo handling on a low-end Android, video mode, and whether anything freezes.',
  },
  {
    key: 'seo-share',
    persona: 'SEO / Share / Viral-Loop Specialist',
    rubric:
      'Google Search Essentials + Open Graph + Twitter Card specs + WhatsApp/Telegram link-preview behavior. ' +
      'Check: meta/og tags, og:image 1200×630 ≥ 2×, the URL baked into shared images (is it legible post-' +
      'compression, is it the final domain), SITE_URL placeholder, crawlability, and any structured data. ' +
      'Flag everything that is deploy-blocked separately.',
  },
  {
    key: 'qa',
    persona: 'QA / Test Engineer',
    rubric:
      'ISTQB defect-severity classification (critical/major/minor/cosmetic) + risk-based test design. Assess ' +
      'coverage in tests/e2e.spec.ts against every control/input/export: empty states, HEIC, forced-iOS video ' +
      'fallback, analytics opt-in, error paths, and any untested affordance. Note flake risk (timeouts, ' +
      'toDataURL comparisons).',
  },
  {
    key: 'l10n',
    persona: 'Amharic Localization Linguist',
    rubric:
      'ISO 17100 / MQM-style TQA (accuracy, fluency, terminology, completeness). Verify every Amharic string ' +
      'in index.html and src/app.ts for correctness, register, script fidelity, and consistency (e.g. the ' +
      '"Choose vs ይምረጡ" pairing). Check the empty-state, share-hint, video-capability hint, and footer strings. ' +
      'If you are not fluent, mark the claim as unverified rather than guessing.',
  },
  {
    key: 'privacy',
    persona: 'Privacy Reviewer',
    rubric:
      'GDPR principles (data minimization, purpose limitation, transparency) + ISO 27701 + COPPA/children lens ' +
      '(the app has a kids angle) + Google Play data-safety framing. Verify: zero third-party requests at ' +
      'runtime, analytics off by default and opt-in, the accuracy of the "nothing is uploaded" claim, and whether ' +
      'any personal data (photos) is ever transmitted or stored.',
  },
  {
    key: 'code-quality',
    persona: 'Frontend Code-Quality Reviewer',
    rubric:
      'Google JavaScript Style Guide + strict TypeScript (noUnusedLocals/Parameters on) + cyclomatic ' +
      'complexity / maintainability + SOLID-lite. Check: dead code, error handling, event-listener hygiene ' +
      '(zombie listeners, object-URL leaks), magic numbers, the DEV-gated test hooks (do they stay out of ' +
      'production?), and import hygiene in the bundle.',
  },
  {
    key: 'design',
    persona: 'Design / Craft Reviewer',
    rubric:
      'Nielsen heuristics + Laws of UX + Microsoft Inclusive Design + WCAG non-text contrast; brand ' +
      'consistency with the Ethiopian classical-art direction (church-mural palette, single brick accent, ' +
      'quiet chrome). Evaluate the single-signature rule (the mosaic is the hero), typography pairing ' +
      '(Inter + Noto Ethiopic), the empty-state, and whether any element reads as template/AI-default.',
  },
  {
    key: 'growth',
    persona: 'Growth / Product Critic (viral loop)',
    rubric:
      'AARRR pirate metrics: Acquisition, Activation, Retention, Referral, Revenue. Audit the loop as a ' +
      'non-technical user: does the shared image carry a clear CTA + URL? ≤3 taps to first result? Is the ' +
      'filter "faddish" enough to share? What would break the loop at scale (cost, CORS, CDN)?',
  },
  {
    key: 'media',
    persona: 'Video / Multimedia Engineer',
    rubric:
      'Media-encoding best practices: WebM/MP4 codec + container correctness, GIF size (≤480px cap, palette ' +
      'quantization), fps/duration tradeoffs, audio-track handling, and device compatibility (iOS lacks ' +
      'canvas.captureStream). Verify the new fallback actually routes to GIF + hint, and that exports are ' +
      'WhatsApp/Telegram-friendly in size.',
  },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['persona', 'rubricName', 'score', 'findings', 'overall'],
  properties: {
    persona: { type: 'string' },
    rubricName: { type: 'string' },
    score: { type: 'number' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['criterion', 'verdict', 'severity', 'evidence', 'recommendation'],
        properties: {
          criterion: { type: 'string' },
          verdict: { type: 'string', enum: ['PASS', 'FAIL', 'WARN'] },
          severity: { type: 'string', enum: ['info', 'low', 'medium', 'high', 'critical'] },
          evidence: { type: 'string' },
          recommendation: { type: 'string' },
        },
      },
    },
    overall: { type: 'string' },
  },
}

phase('Audit')
const results = await parallel(
  RUBRICS.map((r) => () =>
    agent(
      `${CONTEXT}\n\nPERSONA: ${r.persona}\nRUBRIC: ${r.rubric}\n\nGrade the app against this rubric. ` +
      `Return PASS/FAIL/WARN per criterion you checked, only NEW or BROKEN items as FAIL/WARN, a 0-100 score, ` +
      `and a 2-3 sentence overall.`,
      { label: `audit:${r.key}`, phase: 'Audit', schema: FINDINGS_SCHEMA },
    ),
  ),
)

const nonEmpty = results.filter(Boolean)
log(`${nonEmpty.length}/${RUBRICS.length} persona audits returned`)

phase('Synthesize')
const report = await agent(
  `${CONTEXT}\n\nBelow are the structured audit results from ${nonEmpty.length} personas. Merge them into ONE ` +
  `final review report:\n` +
  `1. DEDUPE: collapse the same issue reported by multiple personas into one finding.\n` +
  `2. RANK by severity (critical → high → medium → low → info), and separate the list into two sections: ` +
  `"FIXABLE NOW" (code can address today) and "DEPLOY-BLOCKED" (only manifests once live).\n` +
  `3. For each finding keep: persona(s), rubric criterion, severity, evidence, recommendation.\n` +
  `4. Include a per-persona scorecard (name + 0-100 + verdict line) computed from the audit results.\n` +
  `5. End with an OVERALL SCORE (weighted 0-100), a top-5 "fix these first" list, and an honest overall ` +
  `verdict: release-ready or not, and what a 5/5 (or the next score tier) would require.\n\n` +
  `AUDIT RESULTS:\n${JSON.stringify(nonEmpty, null, 1)}`,
  { label: 'synthesize', phase: 'Synthesize' },
)

return report
