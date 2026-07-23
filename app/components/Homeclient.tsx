"use client";

import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import dynamic from "next/dynamic";
import { Activity, AlertTriangle, Globe, Zap, Check, ShieldAlert } from "lucide-react";
import Link from "next/link";
import ShareButtons from "./Sharebuttons";
import SiteFooter from "./SiteFooter";
import { FAQ_ITEMS } from "../lib/seo";

const EarthquakeMap = dynamic(() => import("./EarthquakeMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] sm:h-[520px] rounded-2xl bg-[#0d0d1a] border border-orange-900/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-orange-400/60 text-xs sm:text-sm tracking-widest uppercase px-4 text-center">
          Loading live global earthquake map...
        </span>
      </div>
    </div>
  ),
});

type Earthquake = {
  id: string;
  place: string;
  magnitude: number;
  time: number;
  lat: number;
  lon: number;
  depth?: number;
};

const ALL_COUNTRIES = [
  "All", "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso",
  "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic",
  "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba",
  "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti",
  "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
  "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
  "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan",
  "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe",
];

/* ---------------------------------------------------------------------------
 * Helper Utilities for SEO Slugs
 * ------------------------------------------------------------------------- */
function createSeoSlug(eq: Earthquake): string {
  const placeSlug = eq.place
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `m${eq.magnitude.toFixed(1)}-earthquake-${placeSlug}-${eq.id}`;
}

/* ---------------------------------------------------------------------------
 * Memoized subcomponents
 * ------------------------------------------------------------------------- */

const MetricGrid = memo(function MetricGrid({
  total, highRisk, major,
}: { total: number; highRisk: number; major: number }) {
  const stats = [
    { label: "Live Earthquakes Tracked", value: total || "-", icon: <Activity size={16} />, color: "bg-amber-500/5 border-amber-500/20", text: "text-amber-400" },
    { label: "Severe Earthquakes (M5+)", value: highRisk || "-", icon: <AlertTriangle size={16} />, color: "bg-orange-500/5 border-orange-500/20", text: "text-orange-400" },
    { label: "Critical Seismic Alerts (M6+)", value: major || "-", icon: <Zap size={16} />, color: "bg-red-500/5 border-red-500/20", text: "text-red-400" },
    { label: "Real-Time Telemetry Status", value: "LIVE", icon: <Globe size={16} />, color: "bg-emerald-500/5 border-emerald-500/20", text: "text-emerald-400" },
  ];
  return (
    <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 pb-6 sm:pb-8 max-w-6xl mx-auto list-none">
      {stats.map((stat, i) => (
        <li key={i} className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 border ${stat.color}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10px] sm:text-xs text-orange-300/60 tracking-wider font-semibold uppercase truncate m-0">{stat.label}</h3>
            <span className={`${stat.text} opacity-70 shrink-0`}>{stat.icon}</span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${stat.text}`}>{stat.value}</div>
        </li>
      ))}
    </ul>
  );
});

const Ticker = memo(function Ticker({ items }: { items: { id: string; text: string; slug: string; place: string; mag: string }[] }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-9 flex items-center bg-gradient-to-r from-[#7c0a00] via-[#c0170a] to-[#7c0a00] border-b border-red-500/40 overflow-hidden group">
      <div className="flex items-center gap-1.5 px-3 shrink-0 h-full bg-[#3d0500] border-r border-orange-500/30 z-10">
        <Zap size={12} className="text-orange-300 animate-pulse" />
        <span className="text-orange-200 text-[10px] font-black tracking-widest">LIVE USGS FEED</span>
      </div>
      <div className="flex-1 overflow-hidden relative h-full flex items-center" aria-label="Latest live earthquake headlines ticker">
        <div className="flex whitespace-nowrap animate-ticker text-[11px] font-medium text-red-100 tracking-wide">
          {items.length > 0 ? (
            [...items, ...items].map((item, i) => (
              <Link
                key={`${item.id}-${i}`}
                href={`/earthquake/${item.slug}`}
                title={`Magnitude ${item.mag} earthquake reported in ${item.place}`}
                className="mx-8 sm:mx-12 flex items-center gap-1.5 hover:text-orange-300 transition-colors cursor-pointer select-none"
              >
                <span>⚡</span> {item.text}
              </Link>
            ))
          ) : (
            <span className="mx-8 opacity-60 text-xs">Syncing live seismic telemetry...</span>
          )}
        </div>
      </div>
    </div>
  );
});

const RecentReports = memo(function RecentReports({ earthquakes }: { earthquakes: Earthquake[] }) {
  const recent = useMemo(
    () => earthquakes.slice().sort((a, b) => b.time - a.time).slice(0, 30),
    [earthquakes]
  );
  return (
    <section className="px-4 sm:px-6 pb-8 max-w-6xl mx-auto" aria-labelledby="recent-reports-heading">
      <h2 id="recent-reports-heading" className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4">
        Recent Earthquakes Today &amp; Real-Time USGS Alerts
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none">
        {recent.map((eq) => {
          const slug = createSeoSlug(eq);
          return (
            <li key={eq.id}>
              <Link
                href={`/earthquake/${slug}`}
                title={`Detailed seismic analysis for Magnitude ${eq.magnitude.toFixed(1)} quake in ${eq.place}`}
                className="flex items-center justify-between gap-2 p-3 rounded-xl border border-white/5 hover:border-orange-500/40 bg-white/[0.01] transition-colors text-xs"
              >
                <span className="text-orange-300 font-bold font-mono">M{eq.magnitude.toFixed(1)}</span>
                <span className="text-white/70 truncate flex-1 mx-2">{eq.place}</span>
                <time dateTime={new Date(eq.time).toISOString()} className="text-orange-400/40 shrink-0">
                  {new Date(eq.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </time>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

const Hero = memo(function Hero() {
  return (
    <div className="relative overflow-hidden pt-9">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" aria-hidden="true">
        {[400, 800].map((size) => (
          <div
            key={size}
            className="absolute rounded-full border animate-pulse-slow"
            style={{ width: size, height: size, borderColor: `rgba(255,80,0,${0.06 - size * 0.00005})` }}
          />
        ))}
      </div>
      <div className="relative text-center pt-10 pb-8 sm:pt-14 sm:pb-10 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold mb-4 sm:mb-6 tracking-widest bg-red-500/10 border border-red-500/30 text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          USGS REAL-TIME DATA STREAM
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-3 bg-gradient-to-br from-orange-500 via-amber-400 to-red-600 bg-clip-text text-transparent leading-[1.1]">
          Quake Hub – Live Earthquake Map &amp; Real-Time Seismic Tracker
        </h1>
        <p className="text-orange-300/70 text-xs sm:text-sm tracking-wide font-medium px-4 max-w-2xl mx-auto">
          Monitor verified USGS seismic activity globally on an interactive, real-time earthquake tracker. View tremors, epicenter depths, and fault line alerts instantly.
        </p>
      </div>
    </div>
  );
});

const LastUpdated = memo(function LastUpdated({ date }: { date: Date | null }) {
  if (!date) return null;
  return (
    <p className="text-orange-600/50 text-[10px] -mt-4 mb-4 text-center font-mono">
      Data Stream Updated: <time dateTime={date.toISOString()}>{date.toLocaleTimeString()}</time>
    </p>
  );
});

type NavBarProps = {
  country: string;
  openCountry: boolean;
  countrySearch: string;
  filteredCountries: string[];
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onToggleOpen: () => void;
  onSearchChange: (v: string) => void;
  onSelectCountry: (c: string) => void;
};

const NavBar = memo(function NavBar({
  country, openCountry, countrySearch, filteredCountries, dropdownRef,
  onToggleOpen, onSearchChange, onSelectCountry,
}: NavBarProps) {
  return (
    <nav className="sticky top-9 z-50 bg-[#060610]/95 backdrop-blur-md border-b border-orange-500/15" aria-label="Main navigation">
      <div className="flex justify-between items-center px-4 sm:px-6 py-3">
        <Link href="/" className="flex items-center gap-3 group" title="Quake Hub Home Page">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/15 border border-orange-500/30 group-hover:border-orange-500/60 transition-colors">
            <Activity size={16} className="text-orange-400" />
          </div>
          <div>
            <div className="text-sm font-black text-orange-300 tracking-[0.15em]">QUAKE</div>
            <div className="text-[10px] text-orange-500 tracking-[0.4em] font-medium -mt-0.5">HUB</div>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ShareButtons className="hidden sm:flex" />

          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-[#ffcc88] min-w-[140px] sm:min-w-[180px] transition-colors"
              onClick={onToggleOpen}
              aria-label="Filter earthquakes by country"
              aria-expanded={openCountry}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Globe size={14} className="shrink-0" />
                <span className="truncate">{country}</span>
              </div>
              <span className={`text-[10px] transition-transform duration-200 ${openCountry ? "rotate-180" : ""}`}>▼</span>
            </button>

            {openCountry && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0f0f22] border border-orange-500/25 rounded-xl shadow-2xl overflow-hidden z-[120]">
                <div className="p-2 border-b border-white/5">
                  <input
                    autoFocus
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-white/5 outline-none text-white placeholder-orange-400/40"
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={(e) => onSearchChange(e.target.value)}
                    aria-label="Search countries to filter earthquake map"
                  />
                </div>
                <div className="overflow-y-auto max-h-48 scrollbar-thin">
                  {filteredCountries.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-full text-left px-4 py-2 text-xs sm:text-sm cursor-pointer flex items-center gap-2 transition-colors hover:bg-white/[0.02] ${c === country ? "text-orange-400 bg-orange-500/10" : "text-[#aaa8c0]"}`}
                      onClick={() => onSelectCountry(c)}
                    >
                      {c === country && <Check size={12} className="text-orange-400 shrink-0" />}
                      <span className="truncate">{c}</span>
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="px-4 py-3 text-xs text-orange-400/40 text-center">No results</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sm:hidden flex justify-center py-2.5 px-4 border-t border-orange-500/10 bg-[#060610]/80">
        <ShareButtons />
      </div>
    </nav>
  );
});

export default function HomeClient() {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [country, setCountry] = useState("All");
  const [openCountry, setOpenCountry] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const MAX_DATA = 500;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenCountry(false);
        setCountrySearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/data`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (!data?.earthquakes) return;

      const newItems: Earthquake[] = [];
      data.earthquakes.forEach((eq: Earthquake) => {
        if (seenIds.current.has(eq.id)) return;
        seenIds.current.add(eq.id);
        newItems.push(eq);
      });

      if (newItems.length) {
        setEarthquakes((prev) => [...newItems, ...prev].slice(0, MAX_DATA));
      }
      setLastUpdated(new Date());
    } catch (err: unknown) {
      console.error("Telemetry collection disruption:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval) return;
      interval = setInterval(fetchData, 30000);
    };
    const stop = () => {
      if (interval) clearInterval(interval);
      interval = null;
    };
    const handleVisibility = () => {
      if (document.hidden) stop();
      else { fetchData(); start(); }
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData]);

  const filtered = useMemo(
    () => earthquakes.filter((e) => country === "All" || e.place.toLowerCase().includes(country.toLowerCase())),
    [earthquakes, country]
  );

  const zoomSequence = useMemo(() => {
    if (country === "All") return undefined;
    return [...filtered].sort((a, b) => b.time - a.time).slice(0, 10);
  }, [filtered, country]);

  const highRisk = useMemo(() => filtered.filter((e) => e.magnitude >= 5), [filtered]);
  const major = useMemo(() => filtered.filter((e) => e.magnitude >= 6), [filtered]);

  const latestNewsObjects = useMemo(() => {
    return earthquakes
      .slice()
      .sort((a, b) => b.time - a.time)
      .slice(0, 12)
      .map((q) => {
        const mins = Math.max(1, Math.floor((Date.now() - q.time) / 60000));
        const timeStr = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
        const slug = createSeoSlug(q);
        const mag = q.magnitude.toFixed(1);
        return {
          id: q.id,
          text: `M${mag} — ${q.place} — ${timeStr}`,
          slug,
          place: q.place,
          mag,
        };
      });
  }, [earthquakes]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter((c) => c.toLowerCase().startsWith(countrySearch.toLowerCase()));
  }, [countrySearch]);

  const toggleOpen = useCallback(() => setOpenCountry((v) => !v), []);
  const selectCountry = useCallback((c: string) => {
    setCountry(c);
    setOpenCountry(false);
    setCountrySearch("");
  }, []);

  return (
    <div className="min-h-screen text-white pb-12 bg-[#060610] antialiased selection:bg-orange-500/30">
      <Ticker items={latestNewsObjects} />

      <NavBar
        country={country}
        openCountry={openCountry}
        countrySearch={countrySearch}
        filteredCountries={filteredCountries}
        dropdownRef={dropdownRef}
        onToggleOpen={toggleOpen}
        onSearchChange={setCountrySearch}
        onSelectCountry={selectCountry}
      />

      <main id="main-content">
        <Hero />
        <LastUpdated date={lastUpdated} />

        <MetricGrid total={filtered.length} highRisk={highRisk.length} major={major.length} />

        <div className="px-4 sm:px-6 pb-12 max-w-6xl mx-auto relative z-10">
          <div className="rounded-2xl border border-orange-500/20 overflow-hidden bg-[#0d0d1a]/50 relative">
            {filtered.length === 0 && country !== "All" && (
              <div className="absolute inset-x-0 bottom-8 mx-auto z-[400] max-w-md px-4 pointer-events-none animate-fade-in-up">
                <div className="bg-[#090914]/90 backdrop-blur-md border border-emerald-500/30 p-4 rounded-xl shadow-2xl flex items-start gap-3.5">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 shrink-0 animate-pulse">
                    <ShieldAlert size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      No Active Earthquakes Detected
                    </div>
                    <div className="text-[11px] text-emerald-100/70 leading-relaxed mt-0.5">
                      No seismic activity found in <span className="text-white font-semibold">{country}</span> during this tracking window.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 py-3 bg-orange-500/[0.04] border-b border-orange-500/15 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <h2 className="text-[10px] sm:text-xs text-orange-300/80 font-bold tracking-widest uppercase m-0">Global USGS Telemetry Feed</h2>
                {country !== "All" && (
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/15 border border-orange-500/30 text-orange-400 tracking-wider uppercase">
                    {country}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-mono text-orange-400/50">
                {[
                  { label: "M7+", color: "bg-[#ff2200]", href: "/earthquakes/magnitude-7-plus" },
                  { label: "M5+", color: "bg-[#ffaa00]", href: "/earthquakes/magnitude-5-plus" },
                  { label: "M4+", color: "bg-[#ffdd00]", href: "/earthquakes/magnitude-4-plus" },
                  { label: "M4", color: "bg-[#88cc44]", href: "/earthquakes/minor" },
                ].map((item) => (
                  <Link 
                    key={item.label} 
                    href={item.href}
                    className="flex items-center gap-1.5 hover:text-orange-300 transition-colors"
                    title={`View all ${item.label} earthquakes`}
                  >
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <EarthquakeMap data={filtered} zoomSequence={zoomSequence} selectedCountry={country} />
          </div>
        </div>

        <RecentReports earthquakes={earthquakes} />

        <section className="px-4 sm:px-6 py-8 max-w-4xl mx-auto space-y-6 text-[#aaa8c0] text-xs sm:text-sm leading-relaxed border-t border-orange-500/10 mt-6" aria-labelledby="seo-heading">
          <h2 id="seo-heading" className="sr-only">About Quake Hub — Live Earthquake Map and Real-Time Seismic Monitoring</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">How to Track Global Seismic Activity</h3>
              <p>
                Quake Hub syncs directly with the USGS real-time earthquake feed to log tectonic shifts continuously. Use the live earthquake map to inspect epicenter coordinates, hypocenter depths, and localized magnitudes across any region — all within a real-time earthquake tracker updated every 30 seconds.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">Understanding USGS Magnitude Scales</h3>
              <p>
                Minor seismic events usually register below magnitude 4.0. Tremors exceeding magnitude 5.0 denote severe ground motion capable of structural damage, while critical alerts broadcast whenever an event surpasses magnitude 6.0.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">Why Monitor Fault Line Activity with Quake Hub?</h3>
            <p>
              Real-time earthquake monitoring helps emergency teams, researchers, and residents stay aware of active tectonic shifts. Quake Hub's live earthquake tracker aggregates verified USGS data on magnitude, depth, tsunami advisory status, and felt reports across every continent.
            </p>
          </div>

          <div itemScope itemType="https://schema.org/FAQPage">
            <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-3">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {FAQ_ITEMS.map((item) => (
                <div key={item.q} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <h4 itemProp="name" className="text-xs sm:text-sm font-bold text-white/90 mb-1">{item.q}</h4>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text" className="text-[11px] sm:text-xs text-orange-100/60">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <style jsx global>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-ticker { animation: ticker 55s linear infinite; width: max-content; }
        .group:hover .animate-ticker { animation-play-state: paused !important; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.01); } }
        .animate-pulse-slow { animation: pulse-slow 5s ease-in-out infinite; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .animate-ticker, .animate-pulse-slow, .animate-fade-in-up, .animate-pulse, .animate-ping, .animate-spin {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}