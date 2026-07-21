"use client";
import Link from "next/link";
import ShareButtons from "./Sharebuttons";

/**
 * Server-renderable footer (no "use client" needed — nothing here is
 * interactive except the ShareButtons island, which carries its own directive).
 * Uses <address> + itemProp microdata so Google can parse your NAP
 * (Name / Address / Phone) consistently — this matters a lot for local SEO
 * and is a prerequisite most link-building / citation strategies rely on.
 */
export default function SiteFooter() {
  return (
    <footer
      itemScope
      itemType="https://schema.org/Organization"
      className="text-center py-8 text-orange-600/30 tracking-widest px-4 max-w-4xl mx-auto border-t border-orange-500/10 space-y-5"
    >
      <meta itemProp="name" content="Quake Hub" />

      <div className="flex flex-col items-center gap-3">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-orange-400/50">
          Follow &amp; Share Quake Hub
        </span>
        <ShareButtons showFollowLinks className="!gap-2" />
      </div>

      <address
        itemProp="address"
        itemScope
        itemType="https://schema.org/PostalAddress"
        className="not-italic text-[10px] sm:text-xs text-orange-500/40 leading-relaxed"
      >
        <span itemProp="streetAddress">I8/4</span>,{" "}
        <span itemProp="addressLocality">Islamabad</span>,{" "}
        <span itemProp="addressCountry">Pakistan</span>
        <br />
        Phone:{" "}
        <a
          href="tel:+923485580418"
          itemProp="telephone"
          className="text-orange-400/60 hover:text-orange-300 underline underline-offset-2"
        >
          +92 348 5580418
        </a>
      </address>

      <nav aria-label="Legal and site links" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] sm:text-xs">
        <Link href="/" className="text-orange-500/50 hover:text-orange-300 underline underline-offset-2">
          Live Earthquake Map
        </Link>
        <a href="/llms.txt" className="text-orange-500/50 hover:text-orange-300 underline underline-offset-2">
          llms.txt
        </a>
      </nav>

      <p className="text-[9px] sm:text-xs text-orange-600/30">
        QUAKE HUB OBSERVATORY MATRIX • DATA FEED: INTEGRATED USGS DATASTREAMS • POLL INTERVAL: 30s
      </p>
    </footer>
  );
}