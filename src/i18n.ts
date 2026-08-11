// Lightweight single-language i18n: a toggle switches the ENTIRE UI between
// English-only and Amharic-only (no bilingual duplication).
//
// The Amharic for the core strings (empty state, share hint, video capability
// hint, consent line) was verified by a panel of 3 native linguists in Aug
// 2026. The remaining Amharic is best-effort and marked with "pending native
// review" — the app owner is a native Amharic reader and can correct any of it.

export type Lang = 'en' | 'am';

let currentLang: Lang = 'en';

export function setLang(l: Lang): void {
  currentLang = l;
  document.documentElement.lang = l;
}

export function getLang(): Lang {
  return currentLang;
}

/** Every i18n key — F25: a typo in a t() call is now a compile error. */
/** Translate a key for the current language, falling back to English. */
export function t(key: I18nKey): string {
  const en = STRINGS.en[key];
  const am = STRINGS.am[key];
  if (currentLang === 'am') return am ?? en ?? key;
  return en ?? key;
}

// Every user-visible string, keyed by language. data-i18n="key" attributes in
// index.html are re-rendered by applyLang(); dynamic strings call t(key).
const enDict = {
    // static (data-i18n)
    skipLink: 'Skip to artwork',
    statusLoading: 'Loading the Ethiopic font…',
    shareTop: 'Share',
    sourceChip: 'source',
    langAria: 'Language',
    zoomOutAria: 'Zoom out',
    zoomInAria: 'Zoom in',
    zoomResetAria: 'Fit to width',
    mosaicAriaEmpty: 'Ethiopic letter mosaic — add a photo to create one.',
    mosaicAriaStart: 'Mosaic of Ethiopic letters,',
    mosaicAriaDistinct: 'distinct letters,',
    mosaicAriaSample: 'Fidel text sample:',
    emptyTitle: 'Choose a photo or video',
    emptySub:
      'It becomes a mosaic of Ethiopian letters — a picture from far, letters up close. Free, and nothing is uploaded.',
    pickerTitle: 'Pick your letters',
    pickerSub: 'Choose which letters appear — only the ones you tap will be used.',
    dropzoneMain: 'Choose a photo or video',
    dropzoneSub: 'tap to pick a photo or video',
    groupStart: 'Start',
    clearBtn: 'Clear',
    exampleBtn: 'Try an example',
    groupExport: 'Export',
    dlPng: 'Download PNG',
    copyLink: 'Copy link',
    advancedSummary: 'Advanced',
    groupAdjust: 'Adjust',
    sliderDetail: 'Detail',
    sliderContrast: 'Contrast',
    sliderEdges: 'Edges',
    invert: 'Invert',
    colorize: 'Colorful letters',
    texture: 'Texture',
    paletteLabel: 'Palette',
    ditherScatter: 'Scatter',
    ditherOrdered: 'Even',
    ditherFs: 'Grainy',
    attribution: 'Colors inspired by the manuscript and mural tradition of the Ethiopian Orthodox Church.',
    groupLetters: 'Letters',
    mixBtn: 'Randomize letters',
    alphabetLabel: 'Alphabet',
    charsetCommon: 'Common Amharic',
    charsetAll: 'Full set',
    charsetDense: 'Dense only',
    charsetLight: 'Light only',
    charsetCustom: 'Pick your own',
    pickerHint: 'Tap a family to use it. Tap',
    pickerHint2: 'to pick individual letters.',
    pickAll: 'Use all',
    pickNone: 'Use none',
    allLetters: 'All letters',
    of: 'of',
    letters: 'letters',
    addPhotoToSee: 'add a photo to see them',
    groupMore: 'More exports',
    dlVideo: 'Download video',
    dlGif: 'Download GIF',
    copyText: 'Copy as text',
    dlHtml: 'Save as HTML',
    videoCapHint: "Video export isn't supported on this device — grab a GIF instead.",
    shareHint: 'Ready — hit Share. Only the mosaic is shared — not your original — and nothing goes to geez·art’s servers.',
    footerRespect: 'Made with respect for the Ethiopic script,',
    consent: 'If a photo shows a real person, ask before sharing it.',
    privacySummary: 'Privacy & parents',
    privacyBody:
      'Everything runs on your device: your photo or video is never uploaded, and this page makes no server requests. Controller: the site operator. Data: none — all processing is on-device, and nothing is stored or retained. Optional analytics are off by default and only send anonymous event counts if the site owner enables them. For parents: no accounts, no cookies, no tracking — a child’s photo never leaves their device. Please ask before sharing a real person’s picture.',

    // palette names (t('palette_' + id))
    palette_mono: 'Mono',
    palette_manuscript: 'Parchment',
    palette_icon: 'Icon',
    palette_church: 'Church mural',
    // dynamic (t())
    statPrefix: 'Your picture —',
    setupError: 'Setup error:',
    shareText: 'Turn your photo into Ethiopic letters —',
    reading: 'Reading your photo…',
    loadingVideo: 'Loading video…',
    analyticsDisclosure: 'This site uses anonymous analytics, enabled by the site owner.',
    ready: 'Ready',
    rendering: 'Rendering…',
    preparing: 'Preparing the letters…',
    customReady: 'Custom letters ready',
    noLetters: 'No letters selected — tap some in the picker.',
    somethingWrong: 'Something went wrong — try reloading.',
    pictureReady: 'Your picture is ready!',
    copied: 'Copied',
    copyFailed: "Couldn't copy — try again.",
    shared: 'Shared — just the mosaic, not your original, and nothing is uploaded',
    saved: 'Saved — only the mosaic is shared; your photo never leaves your device',
    shareCancelled: 'Share cancelled — nothing was sent.',
    recording: 'Recording a few seconds…',
    videoSaved: 'Video saved',
    videoFailed: "Couldn't record the video.",
    makingGif: 'Making a GIF…',
    gifSaved: 'GIF saved',
    gifFailed: "Couldn't make the GIF — try again.",
    randomized: 'Randomized',
    pictureFailed: "We couldn't read that picture — try another one.",
    heicFailed:
      "That's a HEIC photo — your browser can't open it. Convert it to JPG or PNG (or screenshot it) and drop it again.",
    videoReadFailed: "We couldn't read that video — try another one.",
    preparingShare: 'Preparing…',
    playing: 'Playing — the filter is live',
    interrupted: 'Something interrupted the filter — try the video again.',
    tooLarge: 'That file is over 200 MB — try a smaller one.',
    buildFailed: "Couldn't build that file — try again.",
    buildLetterSetFailed: "Couldn't build that letter set.",
    play: 'Play',
    pause: 'Pause',
    downloadReplay: 'Download',
    closeReplay: 'Close',
    toggleFamily: 'Toggle this family',
    pickIndividual: 'Pick individual letters',
    letterName: 'Letter U+',
    familyPartial: 'Letter family partially selected — tap to toggle all',
    zoomPanAria: 'Zoomed artwork — use the arrow keys to pan',
    noLettersAria: 'Ethiopic letter mosaic — no letters selected',
    showcaseAria: 'Mosaic preview',
    controlsAria: 'Controls',
    rampPreviewAria: 'Letters in use',
};

export type I18nKey = keyof typeof enDict;

export const STRINGS: { en: typeof enDict; am: Record<I18nKey, string> } = {
  en: enDict,
  am: {
    // static (data-i18n) — core strings linguist-verified; the rest pending native review
    skipLink: 'ወደ ሥዕሉ ይዝለሉ',
    statusLoading: 'የኢትዮጵያ ፊደል በመጫን ላይ…',
    shareTop: 'ያጋሩ',
    sourceChip: 'ምንጭ',
    langAria: 'ቋንቋ',
    zoomOutAria: 'ያሳንሱ', // F-5: reduce, not 'magnify-then-close'
    zoomInAria: 'ያጉሉ',
    zoomResetAria: 'ከስፋቱ ጋር አስተካክሉ',
    mosaicAriaEmpty: 'የኢትዮጵያ ፊደላት ሞዛይክ — ለመስራት ምስል ይጨምሩ።',
    mosaicAriaStart: 'የኢትዮጵያ ፊደላት ሞዛይክ፣',
    mosaicAriaDistinct: 'የተለያዩ ፊደላት፣',
    mosaicAriaSample: 'የፊደል ጽሑፍ ናሙና፡',
    emptyTitle: 'ምስል ወይም ቪዲዮ ይምረጡ',
    emptySub:
      'የኢትዮጵያ ፊደላት ሞዛይክ ይቀየራል — ከሩቅ ሲታይ ምስል፣ በቅርብ ሲታይ ፊደላት። ነፃ ነው፣ ምንም አይሰቀልም።',
    pickerTitle: 'ፊደሎችዎን ይምረጡ',
    pickerSub: 'የትኞቹ ፊደላት እንደሚታዩ ይምረጡ — የሚነኩዋቸው ብቻ ጥቅም ላይ ይውላሉ።',
    dropzoneMain: 'ምስል ወይም ቪዲዮ ይምረጡ',
    dropzoneSub: 'ምስል ወይም ቪዲዮ ለመምረጥ ይንኩ',
    groupStart: 'ይጀምሩ',
    clearBtn: 'ያጽዱ',
    exampleBtn: 'ምሳሌ ይሞክሩ',
    groupExport: 'ያስወጡ',
    dlPng: 'PNG ያውርዱ',
    copyLink: 'አገናኝ ቅዳ',
    advancedSummary: 'የላቀ',
    groupAdjust: 'ያስተካክሉ',
    sliderDetail: 'ዝርዝር',
    sliderContrast: 'ንጽጽር',
    sliderEdges: 'ጠርዝ',
    invert: 'ተገላቢጦሽ',
    colorize: 'ባለቀለም ፊደላት',
    texture: 'ሸካራነት',
    paletteLabel: 'ቀለም ስብስብ',
    ditherScatter: 'ተበታትኖ',
    ditherOrdered: 'እኩል',
    ditherFs: 'ጥራጥሬ',
    attribution: 'ከኢትዮጵያ ኦርቶዶክስ ቤተክርስቲያን የብራናና የግድግድ ሥዕል ባህል የተነሳሱ ቀለሞች።',
    groupLetters: 'ፊደላት',
    mixBtn: 'ፊደላትን በዘፈቀደ ይቀይሩ',
    alphabetLabel: 'ፊደላት',
    charsetCommon: 'የተለመደ አማርኛ',
    charsetAll: 'ሙሉ ስብስብ',
    charsetDense: 'ጥቅጥቅ ብቻ',
    charsetLight: 'ቀላል ብቻ',
    charsetCustom: 'የራስዎን ይምረጡ',
    pickerHint: 'ቤተሰብን ለመጠቀም ይንኩ።',
    pickerHint2: 'ነጠላ ፊደላት ለመምረጥ።',
    pickAll: 'ሁሉን ይጠቀሙ',
    pickNone: 'አንዳቸውንም አይጠቀሙ',
    allLetters: 'ሁሉም ፊደላት',
    of: 'ከ',
    letters: 'ፊደላት',
    addPhotoToSee: 'ለማየት ምስል ይጨምሩ',
    groupMore: 'ተጨማሪ ማስወጫዎች',
    dlVideo: 'ቪዲዮ ያውርዱ',
    dlGif: 'GIF ያውርዱ',
    copyText: 'እንደ ጽሑፍ ይቅዱ',
    dlHtml: 'HTML ያስቀምጡ',
    videoCapHint: 'ቪዲዮ ማስወጣት በዚህ መሳሪያ የሚደገፍ አይደለም — GIF ይውሰዱ።',
    shareHint:
      'ዝግጁ ነው — ያጋሩ። የሚጋራው ሞዛይኩ ብቻ ነው፣ የመጀመሪያው ምስልዎ አይጋራም፤ ወደ አገልጋይም አይላክም።',
    footerRespect: 'ለኢትዮጵያ ፊደል በአክብሮት የተሰራ፣', // #6: ፣ joins the decorative ፊደል. — ። stranded a fragment
    consent: 'ፎቶ ላይ እውነተኛ ሰው ካለ፣ ከማጋራትዎ በፊት ይጠይቁ።',
    privacySummary: 'ግላዊነት እና ወላጆች',
    privacyBody:
      'ሁሉም በመሣሪያዎ ላይ ይሰራል፤ ፎቶዎ ወይም ቪዲዮዎ በጭራሽ አይሰቀልም፣ ይህ ገጽም የአገልጋይ ጥያቄ አያደርግም። ተቆጣጣሪ፡ የገጹ ባለቤት። መረጃ፡ የለም — ሁሉም ሂደት በመሣሪያው ላይ ነው፣ ምንም አይከማችም። አማራጭ ስታቲስቲክስ በነባሪ ጠፍቷል — የገጹ ባለቤት ካስቻለው ብቻ ማንነት-አልባ ቆጠራ ይላካል። ለወላጆች፡ መለያ የለም፣ ኩኪ የለም፣ ክትትል የለም — የልጅዎ ፎቶ መሣሪያውን አይለቅም። የእውነተኛ ሰው ፎቶ ከማጋራትዎ በፊት ይጠይቁ።',

    // palette names (t('palette_' + id))
    palette_mono: 'ሞኖ',
    palette_manuscript: 'ብራና',
    palette_icon: 'አዶ',
    palette_church: 'የቤተክርስቲያን የግድግዳ ሰዕል',
    // dynamic (t()) — pending native review
    statPrefix: 'ምስልዎ —',
    setupError: 'የማዋቀር ስህተት፡',
    shareText: 'ፎቶዎን ወደ ኢትዮጵያ ፊደላት ይቀይሩ —',
    reading: 'ፎቶዎን በማንበብ ላይ…',
    loadingVideo: 'ቪዲዮ በመጫን ላይ…',
    analyticsDisclosure: 'ይህ ጣቢያ ማንነት አልባ ስታቲስቲክስ ይጠቀማል፣ በጣቢያው ባለቤት የተነቃ።',
    ready: 'ዝግጁ',
    rendering: 'እየተሰራ ነው…',
    preparing: 'ፊደላትን በማዘጋጀት ላይ…',
    customReady: 'የተበጁ ፊደላት ዝግጁ ናቸው',
    noLetters: 'ምንም ፊደል አልተመረጠም — በመራጩ ውስጥ ይንኩ።',
    somethingWrong: 'የሆነ ችግር ተፈጠረ — ገጹን እንደገና ለመጫን ይሞክሩ።',
    pictureReady: 'ምስልዎ ዝግጁ ነው!',
    copied: 'ተቀድቷል',
    copyFailed: 'መቅዳት አልተቻለም — እንደገና ይሞክሩ።',
    shared: 'ተጋርቷል — ሞዛይኩ ብቻ፣ ዋናው ምስልዎ አይደለም፣ ምንም አልተሰቀለም',
    saved: 'ተቀምጧል — ሞዛይኩ ብቻ ተጋርቷል፤ ፎቶዎ መሰሪያዎን አይለቅም', // ሣ→ሰ
    shareCancelled: 'ማጋራት ተሰርዟል — ምንም አልተላከም።',
    recording: 'ጥቂት ሰከንዶችን በመቅረጽ ላይ…',
    videoSaved: 'ቪዲዮ ተቀምጧል',
    videoFailed: 'ቪዲዮውን መቅረጽ አልተቻለም።',
    makingGif: 'GIFን በመስራት ላይ…',
    gifSaved: 'GIF ተቀምጧል',
    gifFailed: 'GIF መስራት አልተቻለም — እንደገና ይሞክሩ።',
    randomized: 'በዘፈቀደ ተደባልቋል',
    pictureFailed: 'ምስሉን ማንበብ አልተቻለም — ሌላ ይሞክሩ።',
    heicFailed:
      'ይህ የHEIC ፎቶ ነው — አሳሽዎ ሊከፍተው አልቻለም። ወደ JPG ወይም PNG ቀይረው (ወይም ቅጽበታዊ ማያ ገጽ ይያዙ) እንደገና ይጣሉት።',
    videoReadFailed: 'ቪዲዮውን ማንበብ አልተቻለም — ሌላ ይሞክሩ።',
    preparingShare: 'በመዘጋጀት ላይ…',
    playing: 'በመጫወት ላይ — ማጣሪያው ንቁ ነው',
    interrupted: 'የማጣሪያው ሂደት ተቋርጧል — ቪዲዮውን እንደገና ይሞክሩ።',
    tooLarge: 'ፋይሉ ከ200 ሜባ ይበልጣል — ትንሽ ፋይል ይሞክሩ።',
    buildFailed: 'ፋይሉን መስራት አልተቻለም — እንደገና ይሞክሩ።',
    buildLetterSetFailed: 'የፊደል ስብስብ መገንባት አልተቻለም።',
    play: 'ያጫውቱ',
    pause: 'ያቁሙ',
    downloadReplay: 'ያውርዱ',
    closeReplay: 'ይዝጉ',
    toggleFamily: 'ይህን ቤተሰብ ይቀይሩ',
    pickIndividual: 'ነጠላ ፊደላት ይምረጡ',
    letterName: 'ፊደል U+',
    familyPartial: 'ቤተሰብ በከፊል ተመርጧል — ሁሉንም ለመቀየር ይንኩ',
    zoomPanAria: 'የተስፋፋ ሰዕል — ለማንቀሳቀስ የቀስት ቁልፎችን ይጠቀሙ', // ሥ→ሰ // M7: መሳፈር = to board/ride — wrong verb root
    noLettersAria: 'የኢትዮጵያ ፊደላት ሞዛይክ — ምንም ፊደል አልተመረጠም',
    showcaseAria: 'የሞዛይክ ቅድመ-እይታ',
    controlsAria: 'መቆጣጠሪያዎች',
    rampPreviewAria: 'በጥቅም ላይ ያሉ ፊደላት',
  },
};
