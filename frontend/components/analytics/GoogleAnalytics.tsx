"use client";

import Script from "next/script";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

// Analytics helper functions
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

export function trackPageView(url: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID!, {
      page_path: url,
    });
  }
}

export function trackSignUpClick(plan?: string) {
  trackEvent("sign_up_click", "conversion", plan || "free");
}

export function trackPricingView() {
  trackEvent("view_pricing", "engagement");
}

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}
