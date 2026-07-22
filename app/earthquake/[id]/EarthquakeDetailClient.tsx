"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Activity, Globe, Compass, ShieldAlert, ListTree,
  Newspaper, ExternalLink, MapPin,
} from "lucide-react";
import Link from "next/link";
import ShareButtons from "@/app/components/Sharebuttons";
import SiteFooter from "@/app/components/SiteFooter";

type EarthquakeDetails = {
  id: string;
  place: string;
  magnitude: number;
  time: number;
  lat: number;
  lon: number;
  depth: number;
  city: string;
  country: string;
  region: string;
  tsunami?: number;
  felt?: number;
  alert?: string | null;
  significance?: number;
};

type NewsArticle = {
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  source: string;
};

function getMagColor(mag: number) {
  if (mag >= 7) return "#ff2200";
  if (mag >= 6) return "#ff6600";
  if (mag >= 5) return "#ffaa00";
  if (mag >= 4) return "#ffdd00";
  return "#88cc44";
}

function getAlertColor(alert: string | null) {
  if (alert === "red")    return { bg: "bg-red-500/20",    border: "border-red-500/40",    text: "text-red-400",    label: "RED — Major Impact" };
  if (alert === "orange") return { bg: "bg-orange-500/20", border: "border-orange-500/40", text: "text-orange-400", label: "ORANGE — Significant Impact" };
  if (alert === "yellow") return { bg: "bg-yellow-500/20", border: "border-yellow-500/40", text: "text-yellow-400", label: "YELLOW — Minor Impact" };
  if (alert === "green")  return { bg: "bg-green-500/20",  border: "border-green-500/40",  text: "text-green-400",  label: "GREEN — Minimal Impact" };
  return null;
}

function parseUSGSPlace(raw: string): { city: string; country: string; region: string } {
  if (!raw) return { city: "", country: "", region: "" };
  const stripped = raw
    .replace(/^\d+\s*km\s+[A-Z]+\s+of\s+/i, "")
    .replace(/^off the coast of\s+/i, "")
    .replace(/^near the coast of\s+/i, "")
    .replace(/^near\s+/i, "")
    .trim();
  const parts = stripped.split(",").map(p => p.trim()).filter(Boolean);
  const city    = parts[0] || "";
  const country = parts[parts.length - 1] || "";
  const region  = parts.length > 1 ? parts.slice(0, -1).join(", ") : city;
  return { city, country, region };
}

function buildFallbackRecordUrl(eq: EarthquakeDetails) {
  return `https://earthquake.usgs.gov/earthquakes/eventpage/${eq.id}/executive`;
}

function buildOsmEmbedUrl(lat: number, lon: number) {
  const delta = 1.5;
  const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join("%2C");
  return `https://openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function EarthquakeDetailMain() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [eq, setEq]                 = useState<EarthquakeDetails | null>(null);
  const [loading, setLoading]         = useState(true);
  const [news, setNews]               = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [searchLabel, setSearchLabel] = useState("");

  useEffect(() => {
    const rawId = params?.id || searchParams.get("id");
    const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : "";
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        const res = await fetch(
          `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${id}.geojson`
        );
        if (!res.ok) throw new Error("Failed to load earthquake data.");

        const data  = await res.json();
        const props = data?.properties || {};
        const geom  = data?.geometry?.coordinates || [0, 0, 0];
        const { city, country, region } = parseUSGSPlace(props.place || "");

        const eqData: EarthquakeDetails = {
          id:           data.id,
          place:        props.place || "Unknown Location",
          magnitude:    props.mag ?? 0,
          time:         props.time,
          lon:          geom[0] ?? 0,
          lat:          geom[1] ?? 0,
          depth:        geom[2] ?? 0,
          city:         city    || "Unknown",
          country:      country || "",
          region:       region  || city || "Unknown",
          tsunami:      props.tsunami === 1 || props.tsunami === true ? 1 : 0,
          felt:         props.felt  ?? 0,
          alert:        props.alert ?? null,
          significance: props.sig ?? 0,
        };

        setEq(eqData);
        setLoading(false);

        setNewsLoading(true);
        setSearchLabel(eqData.region || eqData.country || eqData.city);

        try {
          const qs = new URLSearchParams({
            city:      eqData.city,
            country:   eqData.country,
            region:    eqData.region,
            magnitude: String(eqData.magnitude),
            eventTime: String(eqData.time),
          });

          const newsRes  = await fetch(`/api/scrape?${qs}`);
          const newsData = await newsRes.json();

          if (newsData.success && newsData.data?.length > 0) {
            const mapped: NewsArticle[] = newsData.data.map((item: any) => ({
              title:       item.headline || "Earthquake Update",
              description: item.mediaFeeds?.[0]?.alt || "",
              url:         item.url || "#",
              imageUrl:    item.mediaFeeds?.[0]?.src || null,
              source:      item.source || "News",
            }));
            setNews(mapped);
          } else {
            setNews([]);
          }
        } catch (e) {
          console.error("News fetch error:", e);
          setNews([]);
        } finally {
          setNewsLoading(false);
        }

      } catch (err) {
        console.error("Detail fetch error:", err);
        setLoading(false);
      }
    };

    fetchDetail();
  }, [params, searchParams]);

  // SEO: Dynamic Document Title
  useEffect(() => {
    if (eq) {
      document.title = `M${eq.magnitude.toFixed(1)} Earthquake — ${eq.place} | Quake Hub Real-Time Reports`;
    }
  }, [eq]);

  // SEO: Dynamic Schema.org JSON-LD Structured Data
  const jsonLdData = useMemo(() => {
    if (!eq) return null;

    const eventSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: `M${eq.magnitude.toFixed(1)} Earthquake — ${eq.place}`,
      startDate: eq.time ? new Date(eq.time).toISOString() : undefined,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: eq.place,
        geo: {
          "@type": "GeoCoordinates",
          latitude: eq.lat,
          longitude: eq.lon,
        },
      },
      hasMap: `https://openstreetmap.org/?mlat=${eq.lat}&mlon=${eq.lon}#map=8/${eq.lat}/${eq.lon}`,
      description: `Magnitude ${eq.magnitude.toFixed(1)} earthquake registered near ${eq.city || eq.place}${eq.country ? `, ${eq.country}` : ""} at a depth of ${eq.depth.toFixed(1)} km. Real-time seismic report and news updates.`,
      publisher: {
        "@type": "Organization",
        name: "Quake Hub",
        url: "https://quakehub.com",
      }
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://quakehub.com"
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Earthquakes",
          item: "https://quakehub.com/earthquakes"
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `M${eq.magnitude.toFixed(1)} - ${eq.place}`,
          item: `https://quakehub.com/earthquake/${eq.id}`
        }
      ]
    };

    return [eventSchema, breadcrumbSchema];
  }, [eq]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060610] text-white flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-orange-400/60 text-xs tracking-widest uppercase text-center animate-pulse">
          Loading live seismic report...
        </p>
      </div>
    );
  }

  if (!eq) {
    return (
      <div className="min-h-screen bg-[#060610] text-white flex flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldAlert className="text-red-500 w-12 h-12" />
        <h1 className="text-red-400 font-bold text-sm sm:text-base uppercase tracking-wider">
          EVENT CORRUPTION: SEISMIC ID NOT FOUND
        </h1>
        <Link href="/" className="text-xs text-orange-400 underline tracking-widest uppercase">
          Return to the Live Earthquake Map
        </Link>
      </div>
    );
  }

  const magColor   = getMagColor(eq.magnitude);
  const alertStyle = getAlertColor(eq.alert ?? null);
  const newsWithImages = news.filter(a => a.imageUrl);
  const newsTextOnly   = news.filter(a => !a.imageUrl);

  const locationLabel = eq.country ? `${eq.region}, ${eq.country}` : eq.place;
  const shareTitle = `M${eq.magnitude.toFixed(1)} Earthquake — ${eq.place} | Quake Hub`;

  const listRecords = [
    <>Earthquake event tracking identification signature: <span className="text-orange-400 font-bold font-mono bg-orange-500/10 px-1 rounded">{eq.id}</span>.</>,
    <>Seismic magnitude rating: <span className="text-orange-400 font-black font-mono">M{eq.magnitude.toFixed(1)}</span> registered at <span className="text-orange-400 font-bold">{locationLabel}</span>.</>,
    <>Detection timestamp: <span className="text-orange-400 font-bold font-mono">{eq.time ? new Date(eq.time).toUTCString() : "unconfirmed window"}</span>.</>,
    <>Epicenter geographic coordinates: Latitude <span className="text-orange-400 font-bold font-mono">{eq.lat.toFixed(4)}°</span>, Longitude <span className="text-orange-400 font-bold font-mono">{eq.lon.toFixed(4)}°</span>.</>,
    <>Hypocenter depth (crust rupture): <span className="text-orange-400 font-bold font-mono">{eq.depth.toFixed(1)} km</span> beneath surface target.</>,
    <>Localized impact area: <span className="text-orange-400 font-bold">{eq.city || "unmapped coordinates"}</span>.</>,
    <>Community felt reports: <span className="text-orange-400 font-bold font-mono">{eq.felt?.toLocaleString() ?? "0"}</span> submissions.</>,
    <>USGS impact significance score: <span className="text-orange-400 font-bold font-mono">{eq.significance ?? "0"}</span>.</>,
    <>Tsunami hazard evaluation: <span className={eq.tsunami === 1 ? "text-red-400 font-bold animate-pulse" : "text-orange-400 font-bold"}>{eq.tsunami === 1 ? "Active tsunami threat advisory" : "No active tsunami hazard discovered"}</span>.</>,
    <>PAGER alert status: <span className="text-orange-400 font-bold">{alertStyle ? alertStyle.label : "None / Unclassified"}</span>.</>
  ];

  return (
    <main className="min-h-screen text-white pb-16 antialiased bg-[#060610]">
      {jsonLdData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      )}

      {/* Accessible Navigation Header */}
      <nav aria-label="Breadcrumbs" className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-14 bg-[#060610]/80 backdrop-blur-md border-b border-orange-500/15">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-bold text-orange-400/80 hover:text-orange-300 transition-colors uppercase tracking-wider"
          aria-label="Go back to live earthquake map"
        >
          <ArrowLeft size={14} /> Back <span className="hidden xs:inline">to Live Earthquake Map</span>
        </button>
        <ShareButtons title={shareTitle} />
      </nav>

      <article className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-4 sm:space-y-6" itemScope itemType="https://schema.org/Event">

        {/* Hero Header Section */}
        <header className="border border-orange-500/20 rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-white/[0.02] to-transparent">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-orange-500/10 border border-orange-500/30 text-orange-400 tracking-wider uppercase truncate max-w-[180px] sm:max-w-none">
                  ID: {eq.id}
                </span>
                {eq.tsunami === 1 && (
                  <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-red-500/20 border border-red-500/40 text-red-400 tracking-wider uppercase animate-pulse">
                    ⚠️ Tsunami Risk
                  </span>
                )}
                {alertStyle && (
                  <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold ${alertStyle.bg} border ${alertStyle.border} ${alertStyle.text} tracking-wider uppercase`}>
                    {alertStyle.label}
                  </span>
                )}
              </div>
              <h1 itemProp="name" className="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tight break-words leading-tight">
                M{eq.magnitude.toFixed(1)} Earthquake — {eq.place}
              </h1>
              <p className="text-orange-400/40 text-[10px] sm:text-xs mt-1.5 tracking-widest leading-relaxed">
                DETECTION TIMELOCK:{" "}
                <time dateTime={eq.time ? new Date(eq.time).toISOString() : undefined} itemProp="startDate">
                  {eq.time ? new Date(eq.time).toUTCString() : "UNKNOWN TIME"}
                </time>
              </p>
            </div>
            <div className="flex items-center gap-4 self-start md:self-auto bg-white/5 p-3 sm:p-4 rounded-xl border border-white/5 w-full md:w-auto justify-between md:justify-start shrink-0">
              <div className="text-left md:text-right">
                <div className="text-[9px] sm:text-[10px] text-orange-400/40 tracking-widest font-bold uppercase">RICHTER SCALE</div>
                <div className="text-xs sm:text-sm font-semibold text-white/90">Magnitude</div>
              </div>
              <div
                className="text-2xl sm:text-3xl md:text-4xl font-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-center min-w-[75px] sm:min-w-[90px]"
                style={{ backgroundColor: `${magColor}20`, color: magColor, border: `1px solid ${magColor}50` }}
              >
                M{eq.magnitude.toFixed(1)}
              </div>
            </div>
          </div>
        </header>

        {/* Epicenter & Geographical Data */}
        <section aria-labelledby="seismic-metrics-heading">
          <h2 id="seismic-metrics-heading" className="text-xs text-orange-300/80 font-bold tracking-widest uppercase mb-3">
            Epicenter & Seismic Telemetry Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4" itemProp="location" itemScope itemType="https://schema.org/Place">
            
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] sm:text-xs text-orange-300/40 tracking-widest font-medium uppercase m-0">Epicenter Region</h3>
                <Globe size={16} className="text-orange-400/60 shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] sm:text-xs text-orange-400/40">Target City / Zone</div>
                <div itemProp="name" className="text-base sm:text-lg font-bold text-orange-300 truncate">{eq.city}</div>
                {eq.country && eq.country !== eq.city && (
                  <div className="text-[10px] sm:text-xs text-orange-400/40 mt-0.5 truncate">{eq.country}</div>
                )}
              </div>
            </div>

            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4" itemProp="geo" itemScope itemType="https://schema.org/GeoCoordinates">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] sm:text-xs text-orange-300/40 tracking-widest font-medium uppercase m-0">Coordinates</h3>
                <Compass size={16} className="text-orange-400/60 shrink-0" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0">
                  <div className="text-[9px] sm:text-[10px] text-orange-400/40 tracking-wider">LATITUDE</div>
                  <div itemProp="latitude" className="text-sm sm:text-base font-mono font-bold text-white truncate">{eq.lat.toFixed(4)}°</div>
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] sm:text-[10px] text-orange-400/40 tracking-wider">LONGITUDE</div>
                  <div itemProp="longitude" className="text-sm sm:text-base font-mono font-bold text-white truncate">{eq.lon.toFixed(4)}°</div>
                </div>
              </div>
            </div>

            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 sm:col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] sm:text-xs text-orange-300/40 tracking-widest font-medium uppercase m-0">Hypocenter Depth</h3>
                <Activity size={16} className="text-orange-400/60 shrink-0" />
              </div>
              <div>
                <div className="text-[9px] sm:text-[10px] text-orange-400/40 tracking-wider">CRUST PENETRATION</div>
                <div className="text-xl sm:text-2xl font-black font-mono text-orange-400">
                  {eq.depth.toFixed(1)} <span className="text-xs font-normal">KM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shaking Stats */}
        <section aria-label="Community impact and alert status" className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-3 sm:p-4">
            <h3 className="text-[9px] sm:text-[10px] text-orange-400/40 tracking-widest uppercase mb-1 truncate m-0">Felt Reports</h3>
            <div className="text-lg sm:text-xl font-black font-mono text-white">{eq.felt?.toLocaleString() ?? "0"}</div>
            <div className="text-[9px] sm:text-[10px] text-orange-400/30 mt-0.5 line-clamp-1">reported shaking</div>
          </div>
          <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-3 sm:p-4">
            <h3 className="text-[9px] sm:text-[10px] text-orange-400/40 tracking-widest uppercase mb-1 truncate m-0">Significance</h3>
            <div className="text-lg sm:text-xl font-black font-mono text-white">{eq.significance ?? "—"}</div>
            <div className="text-[9px] sm:text-[10px] text-orange-400/30 mt-0.5 line-clamp-1">USGS impact index</div>
          </div>
          <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-3 sm:p-4 col-span-2 md:col-span-1">
            <h3 className="text-[9px] sm:text-[10px] text-orange-400/40 tracking-widest uppercase mb-1 truncate m-0">Tsunami Risk</h3>
            <div className={`text-lg sm:text-xl font-black font-mono ${eq.tsunami === 1 ? "text-red-400" : "text-green-400"}`}>
              {eq.tsunami === 1 ? "ACTIVE" : "NONE"}
            </div>
            <div className="text-[9px] sm:text-[10px] text-orange-400/30 mt-0.5 line-clamp-1">advisory status</div>
          </div>
        </section>

        {/* Natural Language Event Summary (SEO Optimized Copy) */}
        <section className="border border-orange-500/10 rounded-2xl p-4 sm:p-5 bg-white/[0.01]">
          <h2 className="text-xs text-orange-300/80 font-bold tracking-widest uppercase mb-2">
            Earthquake Overview: M{eq.magnitude.toFixed(1)} near {eq.place}
          </h2>
          <p itemProp="description" className="text-[11px] sm:text-xs text-orange-100/60 leading-relaxed">
            A magnitude {eq.magnitude.toFixed(1)} earthquake was officially recorded near {eq.city || eq.place}
            {eq.country ? `, ${eq.country}` : ""} at a depth of {eq.depth.toFixed(1)} km.
            {eq.tsunami === 1
              ? " The USGS and tsunami warning centers have flagged an active advisory for coastal sectors. Check local emergency services for official evacuation directions."
              : " No active tsunami warnings have been triggered by this event."}{" "}
            {eq.felt && eq.felt > 0
              ? `To date, over ${eq.felt.toLocaleString()} independent felt reports have been logged by citizens in surrounding regions.`
              : "No community felt reports have been submitted for this tremor yet."} Access live seismic monitoring tools and real-time earthquake feeds on the Quake Hub platform.
          </p>
        </section>

        {/* News & Map Feed Section */}
        <section className="border border-orange-500/15 rounded-2xl overflow-hidden" aria-labelledby="news-feed-heading">
          <div className="px-4 py-3 sm:px-5 sm:py-4 bg-orange-500/[0.04] border-b border-orange-500/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Newspaper size={14} className="text-orange-400/60 shrink-0" />
              <h2 id="news-feed-heading" className="text-xs text-orange-300/80 font-bold tracking-widest uppercase truncate m-0">
                Live Earthquake News & Reports for {searchLabel || eq.place}
              </h2>
            </div>
            <span className="text-[10px] text-orange-400/40 font-mono shrink-0">{news.length} articles</span>
          </div>

          {newsLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-4">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-orange-400/50 text-xs tracking-widest uppercase text-center">
                Scanning Global Seismic News Sources...
              </p>
            </div>
          ) : news.length === 0 ? (
            <div className="p-4 sm:p-5">
              <p className="text-orange-400/40 text-[10px] sm:text-xs tracking-widest uppercase mb-3 text-center">
                No syndicated news articles found for <span className="text-orange-400/60">{searchLabel}</span> — showing official USGS map record:
              </p>
              <a
                href={buildFallbackRecordUrl(eq)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View full USGS earthquake event record for magnitude ${eq.magnitude.toFixed(1)} near ${eq.place}`}
                className="group block relative rounded-xl overflow-hidden border-2 border-orange-500/30 hover:border-orange-500/70 transition-all duration-300 bg-[#0a0a14] cursor-pointer shadow-lg shadow-orange-500/0 hover:shadow-orange-500/20"
              >
                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-500/15 border-b border-orange-500/30">
                  <MapPin size={13} className="text-orange-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-bold text-orange-300 tracking-wide">
                    Tap to open official earthquake bulletin & fault maps
                  </span>
                  <ExternalLink size={11} className="text-orange-400 shrink-0" />
                </div>
                <div className="relative w-full h-56 sm:h-72">
                  <iframe
                    src={buildOsmEmbedUrl(eq.lat, eq.lon)}
                    className="w-full h-full border-0 pointer-events-none transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                    title={`Interactive geographic map centered on epicenter near ${eq.place} at coordinates ${eq.lat.toFixed(2)}, ${eq.lon.toFixed(2)}`}
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500 text-[#0a0a14] text-[9px] sm:text-[10px] font-bold tracking-wide shadow-lg animate-pulse">
                    <ExternalLink size={10} />
                    Clickable
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14]/95 via-[#0a0a14]/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 px-3 py-3 sm:px-4 sm:py-3.5">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white truncate">
                      <MapPin size={14} className="text-orange-400 shrink-0" />
                      <span className="truncate">{eq.place}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-[#0a0a14] bg-orange-400 group-hover:bg-orange-300 transition-colors px-2.5 py-1.5 rounded-lg shrink-0">
                      View Event Page <ExternalLink size={11} />
                    </div>
                  </div>
                </div>
              </a>
            </div>
          ) : (
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
              {newsWithImages.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {newsWithImages.slice(0, 6).map((article, i) => (
                    <a
                      key={article.url}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Read report: ${article.title}`}
                      className={`group relative rounded-xl overflow-hidden border border-white/5 hover:border-orange-500/40 transition-all duration-300 bg-[#0a0a14] flex flex-col ${i === 0 ? "sm:col-span-2 lg:col-span-2" : ""}`}
                    >
                      <div className="relative overflow-hidden w-full h-36 sm:h-40 md:h-44">
                        <img
                          src={article.imageUrl!}
                          alt={`${article.title} - ${article.source} coverage on earthquake M${eq.magnitude.toFixed(1)} near ${eq.place}`}
                          className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          loading="lazy"
                          decoding="async"
                          width={600}
                          height={340}
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/40 to-transparent" />
                        <div className="absolute top-2.5 left-2.5 max-w-[85%]">
                          <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold bg-orange-500/80 text-white tracking-wider uppercase block truncate">
                            {article.source}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1 justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-white leading-snug group-hover:text-orange-300 transition-colors line-clamp-3">
                            {article.title}
                          </h3>
                          {article.description && (
                            <p className="text-[10px] text-orange-400/40 leading-relaxed line-clamp-2">{article.description}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                          <div className="flex items-center gap-1 text-[9px] text-orange-400/50 group-hover:text-orange-300 transition-colors">
                            Read full story <ExternalLink size={9} />
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
              {newsTextOnly.length > 0 && (
                <div className="space-y-2">
                  {newsTextOnly.slice(0, 8).map(article => (
                    <a
                      key={article.url}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Read coverage from ${article.source}: ${article.title}`}
                      className="group flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-white/5 hover:border-orange-500/30 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-200"
                    >
                      <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <Newspaper size={13} className="text-orange-400/60" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <span className="text-[9px] sm:text-[10px] font-bold text-orange-400/70 block truncate">{article.source}</span>
                        <h4 className="text-xs font-semibold text-white/90 group-hover:text-orange-300 transition-colors line-clamp-2 leading-snug">
                          {article.title}
                        </h4>
                        {article.description && (
                          <p className="text-[10px] text-orange-400/40 leading-relaxed line-clamp-1">{article.description}</p>
                        )}
                      </div>
                      <ExternalLink size={12} className="text-white/20 group-hover:text-orange-400/60 transition-colors self-center shrink-0 ml-1" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Complete Event Technical Log */}
        <section className="border border-orange-500/15 rounded-2xl overflow-hidden bg-white/[0.01]" aria-labelledby="event-log-heading">
          <div className="px-4 py-3 sm:px-5 sm:py-4 bg-orange-500/[0.04] border-b border-orange-500/10 flex items-center gap-2">
            <ListTree size={14} className="text-orange-400/60 shrink-0" />
            <h2 id="event-log-heading" className="text-xs text-orange-300/80 font-bold tracking-widest uppercase m-0">
              Technical Seismic Record Logs & Data Parameters
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            <ul className="list-disc list-inside space-y-3.5 text-xs sm:text-sm text-white/70 font-medium tracking-wide">
              {listRecords.map((statement, idx) => (
                <li key={idx} className="marker:text-orange-500/40 leading-relaxed pl-1">
                  {statement}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="flex justify-center pt-2">
          <ShareButtons title={shareTitle} />
        </div>
      </article>

      <div className="mt-10">
        <SiteFooter />
      </div>
    </main>
  );
}

export default function EarthquakeDetailClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060610] text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <EarthquakeDetailMain />
    </Suspense>
  );
}