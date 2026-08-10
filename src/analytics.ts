// Optional, opt-in, privacy-first analytics — zero backend, off by default.
//
// geez·art stores nothing and phones nothing home, and that stays true until a
// deployer explicitly enables a provider by adding ONE meta tag to index.html:
//
//   <meta name="geez-art:analytics" content='{"provider":"plausible","domain":"example.com"}'>
//   <meta name="geez-art:analytics" content='{"provider":"beacon","endpoint":"https://stats.example.com/e"}'>
//
// Providers:
//   - "plausible" — calls window.plausible() (Plausible's script must also be on
//     the page; see DEPLOY.md). Privacy-friendly, script-based, EU-hosted.
//   - "beacon"    — POSTs { event, props } JSON to any endpoint you control via
//     navigator.sendBeacon. Zero scripts; point it at a worker/collector later.
//
// With no tag present (the default), initAnalytics() leaves everything off and
// trackEvent() is a no-op — nothing loads, nothing sends, nothing breaks. So
// analytics never gates a release; it is purely additive at deploy time.

/// <reference types="vite/client" />

export interface AnalyticsConfig {
  provider: 'plausible' | 'beacon';
  /** Required for provider "plausible". */
  domain?: string;
  /** Required for provider "beacon": the collector URL. */
  endpoint?: string;
}

const META_NAME = 'geez-art:analytics';

let cfg: AnalyticsConfig | null = null;

/** Read the provider config from the page's meta tag (absent → analytics off). */
export function initAnalytics(): void {
  cfg = null;
  if (import.meta.env.DEV) {
    // Re-read after a test injects/edits the meta tag. Exposed before the early
    // return so the seam exists even when analytics are off.
    (window as unknown as { __reloadAnalytics?: () => void }).__reloadAnalytics = initAnalytics;
  }
  const el = document.querySelector(`meta[name="${META_NAME}"]`);
  if (!el) return;
  try {
    const parsed = JSON.parse(el.getAttribute('content') || '{}') as Partial<AnalyticsConfig>;
    if (parsed.provider === 'plausible' || parsed.provider === 'beacon') {
      cfg = { provider: parsed.provider, domain: parsed.domain, endpoint: parsed.endpoint };
    }
  } catch {
    cfg = null; // malformed config → stay silent; never break the app
  }
  // M12: a visitor who arrived via a shared image carries ?ref=share — measure
  // the viral loop's inbound when analytics are on.
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref) trackEvent('referral_visit', { ref });
}

/** True once a provider is configured — the UI can disclose it (L20). */
export function analyticsEnabled(): boolean {
  return cfg !== null;
}

/**
 * Fire-and-forget analytics event. Safe to call anywhere, any time: with no
 * provider configured this is a no-op, and provider errors are swallowed so
 * tracking can never take the app down.
 */
export function trackEvent(name: string, props?: Record<string, string>): void {
  if (!cfg) return;
  try {
    switch (cfg.provider) {
      case 'plausible': {
        const w = window as unknown as { plausible?: (e: string, o?: { props?: Record<string, string> }) => void };
        if (typeof w.plausible === 'function') w.plausible(name, { props: props ?? {} });
        break;
      }
      case 'beacon': {
        if (cfg.endpoint && navigator.sendBeacon) {
          const body = JSON.stringify({ event: name, props: props ?? {} });
          navigator.sendBeacon(cfg.endpoint, new Blob([body], { type: 'application/json' }));
        }
        break;
      }
    }
  } catch {
    /* tracking must never break the app */
  }
}
