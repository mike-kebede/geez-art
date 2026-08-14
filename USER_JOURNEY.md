# geez art — User Journey (test it as a real user)

Open http://localhost:5199 (or the live URL) and walk through the flows below
in order. For each step: **do** the action, then **check** the expected result.
If anything doesn't match, that's a bug - report the step number and what you saw.

---

## Journey 1 — First visit (empty state)

| # | Do | Check |
|---|---|---|
| 1.1 | Load the page (no photo) | Topbar: brand "geez art", mesob mark, status. The gilded frame holds a big ፊደል empty state that says "Choose a photo or video". Two pills sit above it: `Choose a photo or video` (outlined) and `Share` (filled madder). The Share is disabled (dashed, dimmed) - you can't share nothing. |
| 1.2 | Watch the mesob during load | The mesob **rotates** while fonts load, then stops. No spin when idle. |
| 1.3 | Right panel | Has: `Try an example`, Export (Download PNG / Download video / Download GIF / Copy as text / Save as HTML), Letters, Look (Invert / Colorful letters / Texture / Palette), Advanced (Adjust sliders). |

## Journey 2 — Make a photo mosaic

| # | Do | Check |
|---|---|---|
| 2.1 | Click `Choose a photo or video`, pick a photo | The mosaic renders in the frame. The stat line under it shows the letter count + palette. The Share pill becomes enabled (solid madder). Download PNG enabled. |
| 2.2 | Hover the Choose pill | It tints **madder** (same as other buttons), never white. |
| 2.3 | Try `Try an example` (right panel, top) | Loads the demo photo into a mosaic. |
| 2.4 | Click `Clear` (right panel, top) | Back to the empty state; mosaic gone; Share disabled again. |

## Journey 3 — Play with the letters

| # | Do | Check |
|---|---|---|
| 3.1 | Letters group → the picker grid | Family tiles (ሀ, ለ, ሐ...) show selection state: madder-tinted = fully on, gold border = partly selected, muted = off. "238 of 355 letters" is a plain status (not clickable); `Use all` / `Use none` are buttons. |
| 3.2 | Tap a family tile | The whole family toggles on/off; the mosaic re-renders with the new letters. |
| 3.3 | Tap the `+` on a family | Individual letters expand; tap one to toggle it. The `+` turns `−`. |
| 3.4 | `Pick 10 random letters` | The picker selects ~10 letters across the density range; the mosaic re-renders. |
| 3.5 | `Use none` then a few letters | The mosaic uses ONLY those letters. |

## Journey 4 — Tune the look

| # | Do | Check |
|---|---|---|
| 4.1 | Look → `Palette` | Pick Parchment / Mono / Icon / Church mural. The description under it changes per palette; the mosaic recolors. Default is **Parchment**. |
| 4.2 | Look → `Texture` | Scatter / Even / Grainy change the dithering. |
| 4.3 | Look → `Invert`, `Colorful letters` | Checkboxes change the mosaic. |
| 4.4 | Advanced → Adjust sliders | Detail / Contrast / Edges update the mosaic live. |

## Journey 5 — Export

| # | Do | Check |
|---|---|---|
| 5.1 | Export → `Download PNG` | Downloads a PNG with the "geez art" brand band + the site URL. |
| 5.2 | Export → `Copy as text` | Copies the fidel-letter grid. |
| 5.3 | Export → `Save as HTML` | Downloads a self-contained HTML (letters + the URL credit). |

## Journey 6 — Share (the viral loop)

| # | Do | Check |
|---|---|---|
| 6.1 | Click `Share` | A popup unfurls **from the Share button** with: Share options → Telegram / WhatsApp / X. |
| 6.2 | Click elsewhere / press Esc | The popup closes. |
| 6.3 | Click Share → `Telegram` | Native share sheet opens with the share card (mosaic + brand + "make yours at {url}") and a Telegram-flavored caption + the link. Pick Telegram. |
| 6.4 | Click Share → `WhatsApp` | Same, with the WhatsApp-flavored caption. |
| 6.5 | Click Share → `X / Twitter` | Same, with the X-flavored caption. |
| 6.6 | After sharing | Status shows "Shared". The captions for the three targets are NOT identical. |

## Journey 7 — Video

| # | Do | Check |
|---|---|---|
| 7.1 | Choose a **video** | The mosaic animates; `Pause` appears (right panel top); Download video + Download GIF appear in Export. |
| 7.2 | Pause / Play | Toggles the animation. |
| 7.3 | Export → `Download video` | Downloads the video (WebM/MP4). **No replay window pops open** - download only. |
| 7.4 | Export → `Download GIF` | Downloads an animated GIF (≤ ~960px, sendable size). |
| 7.5 | Share while a video is loaded | Share hands off the actual video file + share card. |

## Journey 8 — Language & theme

| # | Do | Check |
|---|---|---|
| 8.1 | Topbar language dropdown → አማ | The whole UI switches to Amharic (brand, labels, status, picker, share hint). |
| 8.2 | Toggle back to EN | Returns to English. |
| 8.3 | Topbar ☀ button | Switches light ↔ dark umber theme; persists after reload. |
| 8.4 | Reload | Language + palette choices persist. |

## Journey 9 — Mobile (phone viewport or DevTools)

| # | Do | Check |
|---|---|---|
| 9.1 | Narrow the window ≤ 920px | Order becomes: artwork first → the two pills → side panel. The painting stays near the top. |
| 9.2 | On a phone, Share | The popup becomes a bottom sheet (full-width, slides from the bottom). |

---

## What to check on EVERY screen

- No console errors (F12 → Console should be empty of red).
- Nothing spins except the mesob during load (which rotates) - no random loading spinners.
- The painting (mosaic) is the hero - nothing crowds or overlaps it.
- No em dashes (—) anywhere; the brand is "geez art" (never "geez.art").
- Gold appears rarely (the frame mount, the eye) - not on every button.
