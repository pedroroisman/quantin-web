import posthog from "posthog-js";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, props?: Record<string, unknown>) {
  // PostHog
  posthog.capture(event, props);

  // GA4
  if (typeof window.gtag === "function") {
    window.gtag("event", event, props ?? {});
  }
}

export function identify(userId: string, props?: Record<string, unknown>) {
  posthog.identify(userId, props);
}
