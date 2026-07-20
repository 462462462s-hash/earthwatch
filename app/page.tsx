"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Activity, AlertTriangle, Globe, Zap, Check, ShieldAlert } from "lucide-react";
import Link from "next/link";

const EarthquakeMap = dynamic(() => import("./components/EarthquakeMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[350px] sm:h-[520px] rounded-2xl bg-[#0d0d1a] border border-orange-900/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-orange-400/60 text-xs sm:text-sm tracking-widest uppercase px-4 text-center">Loading live earthquake map...</span>
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
  "All", "Afghanistan", "Albania", "Algeria", "Andorra",
  "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
   "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize",
   "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina",
    "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso",
     "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
     "Central African Republic", "Chad", "Chile", "China", "Colombia",
     "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus",
     "Czech Republic", "Democratic Republic of the Congo", "Denmark",
      "Djibouti", "Dominica", "Dominican Republic", "East Timor",
       "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea",
       "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
        "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece",
        "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
         "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia",
         "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
          "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
           "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
            "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
             "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali",
              "Malta", "Marshall Islands", "Mauritania", "Mauritius",
               "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
               "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
               "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
                "Niger", "Nigeria", "North Korea", "North Macedonia",
                 "Norway", "Oman", "Pakistan", "Palau", "Palestine",
                 "Panama", "Papua New Guinea", "Paraguay", "Peru",
                 "Philippines", "Poland", "Portugal", "Qatar", "Romania",
                 "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
                 "Saint Vincent and the Grenadines", "Samoa", "San Marino",
                  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
                   "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
                   "Slovenia", "Solomon Islands", "Somalia", "South Africa",
                   "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan",
                    "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan",
                     "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago",
                      "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
                      "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
                       "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen",
                        "Zambia", "Zimbabwe"
];

const FAQ_ITEMS = [
  {
    q: "How often does Quake Hub update its earthquake data?",
    a: "Quake Hub polls the USGS real-time earthquake feed every 30 seconds, so newly detected seismic events typically appear on the live earthquake map within half a minute of being published.",
  },
  {
    q: "What magnitude of earthquake is considered dangerous?",
    a: "Earthquakes below magnitude 4.0 are usually minor and rarely felt. Magnitude 5.0+ events can cause moderate structural stress, while magnitude 6.0+ earthquakes are classified as critical anomalies capable of significant damage near the epicenter.",
  },
  {
    q: "Does Quake Hub track tsunami risk?",
    a: "Yes. Each earthquake record includes tsunami advisory status sourced directly from USGS alert levels, so you can quickly check whether a coastal seismic event carries an elevated tsunami threat.",
  },
  {
    q: "Can I filter earthquakes by country or region?",
    a: "Yes. Use the country selector in the navigation bar to filter the live earthquake tracker by country. The map will automatically fly to and highlight recent seismic activity within that region.",
  },
  {
    q: "Where does Quake Hub get its earthquake data from?",
    a: "All earthquake data is sourced from the United States Geological Survey (USGS) real-time seismic feed, one of the most trusted global sources for earthquake monitoring and reporting.",
  },
];

export default function Home() {
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

  const fetchData = async () => {
    try {
      const res = await fetch(`api/data`);
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
  };

  useEffect(() => {
    fetchData();
    const refreshInterval = setInterval(() => { fetchData(); }, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const filtered = useMemo(() => {
    return earthquakes.filter((e) => {
      return country === "All" || e.place.toLowerCase().includes(country.toLowerCase());
    });
  }, [earthquakes, country]);

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
        return {
          id: q.id,
          text: `M${q.magnitude.toFixed(1)} — ${q.place} — ${timeStr}`
        };
      });
  }, [earthquakes]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter((c) =>
      c.toLowerCase().startsWith(countrySearch.toLowerCase())
    );
  }, [countrySearch]);

  return (
    <div className="min-h-screen text-white pb-12 bg-[#060610] antialiased selection:bg-orange-500/30">
      
      {/* Google Search Console HTML Verification Meta Tag */}
      <meta name="google-site-verification" content="googlee957368efd2b5a38" />

      {/* Ticker / Navigation Blocks */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-9 flex items-center bg-gradient-to-r from-[#7c0a00] via-[#c0170a] to-[#7c0a00] border-b border-red-500/40 overflow-hidden group/ticker">
        <div className="flex items-center gap-1.5 px-3 shrink-0 h-full bg-[#3d0500] border-r border-orange-500/30 z-10">
          <Zap size={12} className="text-orange-300 animate-pulse" />
          <span className="text-orange-200 text-[10px] font-black tracking-widest">LIVE</span>
        </div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center" aria-label="Latest earthquake headlines ticker">
          <div className="flex whitespace-nowrap animate-ticker text-[11px] font-medium text-red-100 tracking-wide group-hover/ticker:pause-anim">
            {latestNewsObjects.length > 0 ? (
              [...latestNewsObjects, ...latestNewsObjects].map((item, i) => (
                <Link
                  key={`${item.id}-${i}`}
                  href={`/earthquake/${item.id}`}
                  className="mx-8 sm:mx-12 flex items-center gap-1.5 hover:text-orange-300 transition-colors cursor-pointer select-none"
                >
                  <span>⚡</span> {item.text}
                </Link>
              ))
            ) : (
              <span className="mx-8 opacity-60 text-xs">live seismic updates...</span>
            )}
          </div>
        </div>
      </div>

      <nav className="sticky top-9 z-50 flex justify-between items-center px-4 sm:px-6 py-3 bg-[#060610]/92 backdrop-blur-md border-b border-orange-500/15" aria-label="Main navigation">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500/15 border border-orange-500/30">
            <Activity size={16} className="text-orange-400" />
          </div>
          <div>
            <div className="text-sm font-black text-orange-300 tracking-[0.15em]">QUAKE</div>
            <div className="text-[10px] text-orange-500 tracking-[0.4em] font-medium -mt-0.5">HUB</div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-[#ffcc88] min-w-[140px] sm:min-w-[180px] transition-colors"
              onClick={() => setOpenCountry((v) => !v)}
              aria-label="Filter earthquakes by country"
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
                    onChange={(e) => setCountrySearch(e.target.value)}
                    aria-label="Search countries to filter earthquake map"
                  />
                </div>
                <div className="overflow-y-auto max-h-48 scrollbar-thin">
                  {filteredCountries.map((c) => (
                    <div
                      key={c}
                      className={`px-4 py-2 text-xs sm:text-sm cursor-pointer flex items-center gap-2 transition-colors hover:bg-white/[0.02] ${c === country ? "text-orange-400 bg-orange-500/10" : "text-[#aaa8c0]"}`}
                      onClick={() => {
                        setCountry(c);
                        setOpenCountry(false);
                        setCountrySearch("");
                      }}
                    >
                      {c === country && <Check size={12} className="text-orange-400 shrink-0" />}
                      <span className="truncate">{c}</span>
                    </div>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="px-4 py-3 text-xs text-orange-400/40 text-center">No results</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main id="main-content">
        <div className="relative overflow-hidden pt-9">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {[300, 500, 700, 900].map((size) => (
              <div
                key={size}
                className="absolute rounded-full border animate-pulse-slow"
                style={{
                  width: size,
                  height: size,
                  borderColor: `rgba(255,80,0,${0.06 - size * 0.00005})`,
                  animationDelay: `${size * 0.001}s`,
                }}
              />
            ))}
          </div>

          <div className="relative text-center pt-10 pb-8 sm:pt-14 sm:pb-10 px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold mb-4 sm:mb-6 tracking-widest bg-red-500/10 border border-red-500/30 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              GLOBAL OBSERVATORY ACTIVE
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-3 bg-gradient-to-br from-orange-500 via-amber-400 to-red-600 bg-clip-text text-transparent leading-[1.1]">
              QUAKE HUB
            </h1>
            <p className="text-orange-300/60 text-xs sm:text-sm tracking-widest font-medium px-4 max-w-md mx-auto sm:max-w-none">
               Live Earthquake Map &amp; Real-Time Seismic Tracker
            </p>
            {lastUpdated && (
              <p className="text-orange-600/50 text-[10px] mt-2 font-mono">
                Telemetry Feed Synchronized: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-6 pb-6 sm:pb-8 max-w-6xl mx-auto">
          {[
            { label: "Seismic Disruptions", value: filtered.length || "-", icon: <Activity size={16} />, color: "bg-amber-500/5 border-amber-500/20", text: "text-amber-400" },
            { label: "Severe Stress (M5+)", value: highRisk.length || "-", icon: <AlertTriangle size={16} />, color: "bg-orange-500/5 border-orange-500/20", text: "text-orange-400" },
            { label: "Critical Anomalies (M6+)", value: major.length || "-", icon: <Zap size={16} />, color: "bg-red-500/5 border-red-500/20", text: "text-red-400" },
            { label: "Tracking Matrix", value: "LIVE", icon: <Globe size={16} />, color: "bg-emerald-500/5 border-emerald-500/20", text: "text-emerald-400" },
          ].map((stat, i) => (
            <div key={i} className={`rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 border ${stat.color}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[10px] sm:text-xs text-orange-300/40 tracking-widest font-medium uppercase truncate m-0">{stat.label}</h3>
                <span className={`${stat.text} opacity-70 shrink-0`}>{stat.icon}</span>
              </div>
              <div className={`text-2xl sm:text-3xl font-black font-mono ${stat.text}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Map Container Interface */}
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
                      Lithospheric Stable Condition
                    </div>
                    <div className="text-[11px] text-emerald-100/70 leading-relaxed mt-0.5">
                      No active seismic anomalies discovered inside <span className="text-white font-semibold">{country}</span> during the current recording epoch.
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="px-4 py-3 bg-orange-500/[0.04] border-b border-orange-500/15 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <h2 className="text-[10px] text-orange-300/70 font-bold tracking-widest uppercase m-0">Live Earthquake Map — Geospatial Overlay</h2>
                {country !== "All" && (
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/15 border border-orange-500/30 text-orange-400 tracking-wider uppercase">
                     {country}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-mono text-orange-400/50">
                {[
                  { label: "M7+", color: "bg-[#ff2200]" },
                  { label: "M5+", color: "bg-[#ffaa00]" },
                  { label: "M4+", color: "bg-[#ffdd00]" },
                  { label: "M4", color: "bg-[#88cc44]" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <EarthquakeMap data={filtered} zoomSequence={zoomSequence} selectedCountry={country} />
          </div>
        </div>

        {/* Recent Earthquakes Reports */}
        <section className="px-4 sm:px-6 pb-8 max-w-6xl mx-auto">
          <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4">
            Recent Earthquake Reports
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {earthquakes
              .slice()
              .sort((a, b) => b.time - a.time)
              .slice(0, 30)
              .map((eq) => (
                <Link
                  key={eq.id}
                  href={`/earthquake/${encodeURIComponent(eq.id)}`}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-white/5 hover:border-orange-500/40 bg-white/[0.01] transition-colors text-xs"
                >
                  <span className="text-orange-300 font-bold font-mono">
                    M{eq.magnitude.toFixed(1)}
                  </span>
                  <span className="text-white/70 truncate flex-1 mx-2">{eq.place}</span>
                  <span className="text-orange-400/40 shrink-0">
                    {new Date(eq.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Link>
              ))}
          </div>
        </section>

        {/* SEO Text Core */}
        <section className="px-4 sm:px-6 py-8 max-w-4xl mx-auto space-y-6 text-[#aaa8c0] text-xs sm:text-sm leading-relaxed border-t border-orange-500/10 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">How to Track Earthquakes in Real-Time</h2>
              <p>
                Quake Hub syncs directly with the USGS real-time earthquake feed, tracking live seismic events across every continent. Use the live earthquake map to filter activity by country, view exact magnitude and depth, and follow breaking seismic alerts as they happen — all within a real-time earthquake tracker updated every 30 seconds.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">Understanding Earthquake Magnitude Scales</h2>
              <p>
                Earthquakes registering below magnitude 4.0 are often micro-earthquakes that go unnoticed, while incidents exceeding magnitude 5.0 represent high-stress releases capable of localized damage. Critical global earthquake alerts are broadcast via our live ticker feed whenever a seismic anomaly clears magnitude 6.0.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">Why Monitor Global Seismic Activity?</h2>
            <p>
              Real-time earthquake monitoring helps communities, researchers, and travelers stay informed about tectonic activity near fault lines and subduction zones. Quake Hub's live earthquake tracker aggregates USGS data on magnitude, hypocenter depth, tsunami advisory status, and felt reports so you can quickly assess seismic risk in any country, from the Pacific Ring of Fire to the Mediterranean and beyond.
            </p>
          </div>

          {/* FAQ Accordion Block */}
          <div>
            <h2 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-3">Frequently Asked Questions About Earthquake Tracking</h2>
            <div className="space-y-4">
              {FAQ_ITEMS.map((item) => (
                <div key={item.q}>
                  <h3 className="text-xs sm:text-sm font-bold text-white/90 mb-1">{item.q}</h3>
                  <p className="text-[11px] sm:text-xs text-orange-100/50">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Deck */}
      <footer className="text-center py-6 text-[9px] sm:text-xs text-orange-600/30 tracking-widest px-4 max-w-4xl mx-auto border-t border-orange-500/10">
        QUAKE HUB OBSERVATORY MATRIX • DATA FEED: INTEGRATED USGS DATASTREAMS • SILENT DATA POLL DEPLOYED: 30s INTERVAL
      </footer>

      {/* Global CSS Injectors */}
      <style jsx global>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 55s linear infinite;
          width: max-content;
        }
        .group\/ticker:hover .animate-ticker {
          animation-play-state: paused !important;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.01); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 5s ease-in-out infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}