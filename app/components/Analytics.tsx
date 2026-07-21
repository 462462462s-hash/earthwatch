import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js).
 *
 * Setup:
 * 1. Create a free GA4 property at https://analytics.google.com and grab your
 *    Measurement ID (looks like "G-XXXXXXXXXX").
 * 2. Add it to your environment as NEXT_PUBLIC_GA_MEASUREMENT_ID (e.g. in
 *    .env.local and in your host's env settings — Vercel, etc).
 * 3. Render <Analytics /> once, in your ROOT layout (app/layout.tsx), so it
 *    loads a single time across every route instead of being duplicated per page.
 *
 * strategy="afterInteractive" defers the script until after the page is
 * interactive, so it does not block or slow down First Contentful Paint /
 * Largest Contentful Paint on mobile.
 */
export default function Analytics() {
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}