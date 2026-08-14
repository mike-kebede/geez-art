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

App runs three ways right now:
- LIVE: https://geez-art.mike-kebede.workers.dev — this is the primary target. Review the deployed site
  (the author verified it boots: status Ready, demo renders, CSP/headers served, no console errors).
  The runtime share URL is origin-derived; the SEO meta + og-image band now point at this domain.
- Dev server: http://localhost:5199 (may be briefly busy — the author's Playwright suite uses it; a quick
  HTTP GET of the page is fine, do not hammer it, and do NOT run the full test suite yourself).
- Production build: \`npm run build\` → dist/ is clean (tsc + vite build green).

DEPLOYMENT IS LIVE (un-parked by the user on 2026-08-13) at the workers.dev URL above. Things that only
manifest on a live URL are now CHECKABLE against that URL, not "deploy-blocked". The user owns a Hostinger
domain and may add a custom subdomain later; until then workers.dev is canonical. Note: there is NO custom
domain, NO attribution-short-domain redirect, and the analytics provider is not configured.

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
- Round 3.16 (just committed): static font-preload deleted (dead hash) — injects
  the module URL; share-band test asserts gold CTA pixels; GIF byte budget;
  analytics disclosure "enabled by the site owner"; controls panel max-height;
  DEPLOY referral note corrected (100% miss); render debounce 250ms; WebView
  muted-autoplay fallback.
- Round 3.17 (just committed): demo photo replaces the procedural example;
  HTML export attributed; audioCtx resumed pre-export; &demo=1 in share links;
  coarse/no-deviceMemory still-render cap; nested drop-zone stopPropagation;
  CSP harness sentinel; 12 Amharic corrections from a 3-linguist pass.
- Round 3.18 (just committed): photo supersede token; color atlas warmed at
  idle; Detail slider max derived from the cell budget; PWA icons regenerated
  with the Ethiopic font loaded (were black tiles).
- Round 3.19 (just committed): photo supersede TWO-WAY (clearAll bumps photoGen);
  color atlas warmed DIRECTLY at idle; iOS share falls back to native text share
  + download; busy cues for photo/video load.
- VERIFIED: the round-3.17 "CSP style-src blocks CSSOM on Firefox/WebKit" HIGH
  is a FALSE POSITIVE — Firefox boots dist under the real headers, reaches
  Ready, zero page errors, photo renders. CSP stands; no unsafe-inline needed.
- VERIFIED (round-3.19 audit's A1 HIGH "demo.png 97% black" is a FALSE
  POSITIVE / stale): the committed public/demo.png measures 99.9% of pixels
  above luminance 40, meanLum 119, fully opaque, with real tonal structure
  (verified 4 ways incl. in-app source-pass probe). The demo image was already
  the user's chosen image, committed since Iteration-13; no replacement was
  needed. The legitimate residual concern is that ALL mosaics render parchment-
  light (glyphs cover ~1/3 of each cell) — a renderer-wide property, not a
  demo-only regression; contrast/boldness is an open design lever.
- A8 verified: PWA icons regenerated with the Ethiopic font loaded — fidel
  strokes now visible (8.6% bright-ivory pixels over brick, gold ring), was
  ~99% black. og-image verified non-blank (mosaic + brand band) but light.
- GIF-export test flakes under heavy CPU load (passes isolated in 5.6s) — not a
  regression; re-run isolated before treating it as one.
- Round 3.20 (just committed): all nine round-3.19 findings now closed. A1 demo
  "97% black" = false positive (file is a real image, verified 4 ways). A2/A3/A4
  verified present in code (photoGen supersede, atlas warm at idle, slider max
  from budget). A5 domain single-sourced via SITE_URL (index.html SEO meta is
  deploy-facing by design). A6 referral rides share-sheet TEXT link, bare URL on
  image band — documented tradeoff (image-only forwards lose attribution
  without a backend). A8 icons regenerated (fidel visible). A9 og-image verified
  non-blank. A7 "works offline" claim softened to the accurate no-upload promise
  (SW path documented; adding a SW is the option to reclaim the claim).
- Round 3.21 (in progress, fixes for the 88/100 re-audit): F2 renderer boldness —
  glyph weight raised 400→700 consistently in BOTH the density measurement and
  the render atlas (fonts.ts GLYPH_WEIGHT); tripled dark ink (2.7%→7.4%).
  F5 exifr skipped for signature-known formats (PNG/GIF/WebP can't carry EXIF) —
  the 75KB lazy chunk no longer rides the ?demo=1 first pick. F6 og-image
  regenerated from a bold MONO render on a deep-ink card + dark-ink assertion in
  make-og-image.mjs (fails loudly below 5%). F10 audio-track assertion in the
  video-export test (WebM A_OPUS/A_VORBIS, MP4 mp4a/soun). F18 ?demo=1 landing
  test under real dist/CSP (ephemeral port). F11 idle status uses opacity not
  visibility (live region stays in the a11y tree). F13 slider tooltips + Fit
  label localized. F14 Trusted Types header (only innerHTML sink → replaceChildren).
  F15 CORP same-origin header. F25 cell budgets hoisted to limits.ts + the 40-col
  floor removed (budget now ALWAYS bounds cells). F27 recorder ext derived from
  actual rec.mimeType. F29 empty-fidel gold #a67a22 (3.6:1). F36 summary display
  duplicate removed. DEFERRED: F26 font-subset imports (low value), F30
  title/description Amharic (needs native review — same block as F20-F22).
- Round 3.26 (user critique): the colorize mosaic previously painted in raw
  source colors (arbitrary RGB — oranges/reds/pinks breaking the Maleda wheel).
  FIXED: the colorize path now maps every cell to its NEAREST MALEDA PIGMENT
  (palette.ts pigments[] per preset; colorAtlasFor builds one atlas row per
  pigment; cellPalette does nearest-pigment). The mosaic paints only in the
  manuscript pigments (madder·ochre·saffron·gold·verdigris·umber·ink·parchment)
  — 0% blue-dominant, ~93% within pigment theory (rest = anti-aliased edges).
  Also: DEFAULT charset is now "Pick your own" (custom) — the picker starts with
  the common Amharic set pre-selected and OPEN, so glyphs like ጨ can be tapped
  off instead of dominating.
- Round 3.27 (user batch): zoom-out disabled at fit (was a dead no-op); brand is
  language-dependent ("geez.art" / "ግዕዝ ጥበብ" in Bela); copy-text & save-HTML
  disabled during video; the mesob woven-star replaced the tibeb lozenge and sits
  TOP-BAR beside the wordmark as brand mark + busy "gaze" pulse; Share now hands
  off the actual VIDEO file + text for video sources (shareBlob); GIF long-edge
  cap raised 480 -> 960px (~9MB — real-size but sendable; full-1280 was 14MB).
  Round 3.29 (critic tail + domain): M6 service worker (network-first HTML,
  cache-first hashed assets; worker-src 'self'). L1 GIF paint loop throttled to
  ~10fps. L2 source-chip holds an 80px thumbnail not the full-res frame.
  L5 replay video gets a localized aria-label. L6 focus restored after the
  native file chooser. L7 half-built AudioContext is closed, not orphaned.
  L9 og-image re-encoded as JPEG (256KB vs 1MB). Share card now captured with
  html-to-image (toBlob) - the exchange.et-style in-app card (mosaic + parchment
  footer + brand + CTA), shared with the video/photo + text. NO domain is
  hardcoded anywhere: SITE_URL is origin-derived; the SEO/OG meta uses
  %VITE_SITE_URL% build-time injection (.env) and the og-image generator reads
  SITE_URL from env. Brand name standardized to "geez.art".
  Round 3.28: MONO is now the default palette (frame mount stays Maleda gold);
  the Letters group (alphabet selector + picker + randomize) moved OUT of
  Advanced to the top of the controls; the randomizer now picks ~10 letters
  stratified across density deciles from the chosen alphabet (was ~60% of all
  glyphs, and pure-random clustered to 5-7 distinct); the favicon/logo is the
  GOLD ፊ on the mesob (was mistakenly madder red); zoom controls compact +
  semi-transparent; NO em dashes anywhere (English or Amharic); PWA icons +
  tab icon = the ፊ-on-mesob mark.
- Round 3.25 (user request): FULL MALEDA DESIGN-LANGUAGE RESTYLE
  (dev/maleda-design-language/ — tokens.css is canonical). Parchment gallery
  walls + umber ink; the mosaic is now hung as a GILDED PAINTING (gold mount +
  parchment mat on .frame/.frame-inner); tibeb-spine footer; eye-dot status gaze
  (gold ready / pulse busy); weave loader during boot; dark umber theme with a
  topbar toggle (persisted); Inter dropped — Noto Sans Ethiopic is the UI voice
  for both scripts; Bela Bereka added for Amharic DISPLAY fidel (ግዕዝ wordmark,
  empty-state ፊደል); mosaic glyphs stay Noto Sans Ethiopic (ramp measured there);
  mosaic presets re-tuned to Maleda hexes (default = parchment-300/umber/madder/
  gold/verdigris); share-band + og-image + icons use Maleda gold #C9962E and
  umber #15090B; the ፊ favicon is UNCHANGED. Restraint: gold pulled back to ≤3%
  (button hovers now madder). 2 new e2e tests (theme toggle persist, eye-dot
  pulse + tibeb).
- Round 3.23 (user request): default Detail slider lowered to 100 (was 170; coarse
  default too). The flat-area variety hash now rotates a per-render seed (RenderOpts
  .seed) so a uniform region's letter mix is FRESH every still render instead of
  freezing one set forever (the recurring ጨ); video frames pin seed 0 so the
  texture doesn't boil frame-to-frame. Verified: two identical re-renders differ.
  Round 3.24 (user follow-up): the variety window is now density-dependent
  (varietyWindowAt: 0.05 light → 0.09 dense) so DENSE regions reshuffle visibly
  too — 63-68% of dense cells change per render (was ~18% imperceptible) while
  mid-tone subject edges stay tight (16-19%). Tonal fidelity holds (coarse 0.53).
- Round 3.22 (in progress, fixes for the 89/100 live-site audit): M5 glyph-size
  geometry fixed — the atlas now draws glyphs at ~1.4x cellPx (GLYPH_SCALE) to
  match the measurement ratio (was ~0.71x, so ink stayed ~1/3 of a cell). Default
  dark ink 7.4% -> 19.1%, meanLum 216 -> 184, structure correlation UP. M1 color
  atlas is now a real 4-slot LRU and the idle warm pre-builds ALL palettes (palette
  switch no longer pays the ~15k-fillText build). L8 #mosaic canvas resize guarded
  (video mode no longer clears+reinitializes ~17MB every frame). M2 __forceRecorderFail
  seam + tests (videoFailed/gifFailed flash + export buttons re-enable). M3
  __stallPhotoDecode seam + photo-to-photo and Clear-during-decode race tests. M4
  Amharic analytics disclosure now carries the third-party-provider clause. L16
  copyLink register -> polite. L17 spelling normalized to standard ሥዕል/መሣሪያ (the
  ሠ/ሰ/ሣ family still needs a definitive native review).

Test suite: tests/e2e.spec.ts — 80 Playwright tests, all GREEN in the latest run (Chromium; the suite
builds dist and validates it under the real CSP headers). Read the file to assess COVERAGE; the author
is running it, so do not execute it.

CURRENT STATE (round 3.30, 2026-08-14): all round-3.29 fixes are STAGED but UNCOMMITTED + UNDEPLOYED
(holding for the user's go). The 80-test suite is green. Outstanding: the user flagged the right-side
controls panel as "hiding capabilities" and wants a layout answer; and deployment is pending a Hostinger
CNAME for a custom subdomain (workers.dev is still the live canonical URL). Round 3.29 items to treat as
FIXED: photo supersede two-way (clear bumps photoGen); color atlas warmed directly at idle; iOS share
falls back to native text share + download; busy cues for photo/video load; html-to-image share card
(mosaic + parchment footer + brand + CTA) handed to the native share sheet alongside the actual
video/photo file + text (t.me/wa.me URLs cannot carry files — native sheet is the only path);
platform share buttons fire the native sheet; service worker (network-first HTML, cache-first hashed
assets; worker-src 'self'); L1 GIF paint ~10fps; L2 source-chip 80px thumbnail; L6 focus restore after
file chooser; L7 half-built AudioContext closed; L9 og-image JPEG 256KB; FULL Ethiopic set verified
(326 syllables + 9 punct + 20 numbers; numbers/punct grouped, not 7-blocks); Mono = default palette;
Letters group out of Advanced (alphabet + picker + randomize on top); randomizer picks ~10 stratified
across density deciles; gold ፊ favicon; SITE_URL origin-derived (nothing hardcoded); Maleda restyle
(gold mount, parchment mat, tibeb footer, eye-dot status, weave loader, dark theme toggle, Bela Bereka
display fidel, mono default).

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
    key: 'maleda',
    persona: 'Maleda Design-Language Compliance Auditor',
    rubric:
      'THE MALEDA ETHIOPIAN CLASSICAL DESIGN LANGUAGE — dev/maleda-design-language/tokens.css is canonical; ' +
      'DESIGN-LANGUAGE.md. Grade the CURRENT implementation against it: (1) parchment grounds + umber ink tokens ' +
      'used consistently in both themes; (2) the gilded painting (gold mount + parchment mat on .frame/.frame-inner) ' +
      'is the only framed surface; (3) the tibeb spine footer, one quiet recurrence; (4) the mesob brand mark ROTATES ' +
      'while busy — it must NOT carry an eyePulse opacity-fade (the eye-dot gaze is a separate element); (5) the weave ' +
      'loader (verdigris·saffron·madder triangles) appears only during boot; (6) gold pulled back to ≤3% (scarce — no ' +
      'gold hovers/borders on buttons); (7) madder is the single action color; (8) the single-signature rule (the ' +
      'mosaic is the hero, nothing crowds it); (9) restraint — nothing reads template/AI-default; (10) dark umber theme ' +
      'matches tokens. Read tokens.css + DESIGN-LANGUAGE.md + src/style.css + index.html and grade PASS/FAIL/WARN per ' +
      'criterion with an honest 0-100 score. Flag every concrete violation with file:line.',
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
