"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";

type Earthquake = {
  id: string;
  place: string;
  magnitude: number;
  time: number;
  lat: number;
  lon: number;
  depth?: number;
};

type Props = {
  data: Earthquake[];
  zoomSequence?: Earthquake[];
  selectedCountry?: string;
};

const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  "Afghanistan": [33.9391, 67.7100], "Albania": [41.1533, 20.1683], "Algeria": [28.0339, 1.6596],
  "Andorra": [42.5063, 1.5218], "Angola": [-11.2027, 17.8739], "Antigua and Barbuda": [17.0608, -61.7964],
  "Argentina": [-38.4161, -63.6167], "Armenia": [40.0691, 45.0382], "Australia": [-25.2744, 133.7751],
  "Austria": [47.5162, 14.5501], "Azerbaijan": [40.1431, 47.5769], "Bahamas": [25.0343, -77.3963],
  "Bahrain": [26.0667, 50.5577], "Bangladesh": [23.6850, 90.3563], "Barbados": [13.1939, -59.5432],
  "Belarus": [53.7098, 27.9534], "Belgium": [50.5039, 4.4699], "Belize": [17.1899, -88.4976],
  "Benin": [9.3077, 2.3158], "Bhutan": [27.5142, 90.4336], "Bolivia": [-16.2902, -63.5887],
  "Bosnia and Herzegovina": [43.9159, 17.6791], "Botswana": [-22.3285, 24.6849], "Brazil": [-14.2350, -51.9253],
  "Brunei": [4.5353, 114.7277], "Bulgaria": [42.7339, 25.4858], "Burkina Faso": [12.2383, -1.5616],
  "Burundi": [-3.3731, 29.9189], "Cabo Verde": [16.0021, -24.0132], "Cambodia": [12.5657, 104.9910],
  "Cameroon": [7.3697, 12.3547], "Canada": [56.1304, -106.3468], "Central African Republic": [6.6111, 20.9394],
  "Chad": [15.4542, 18.7322], "Chile": [-35.6751, -71.5430], "China": [35.8617, 104.1954],
  "Colombia": [4.5709, -74.2973], "Comoros": [-11.8750, 43.8722], "Congo": [-0.2280, 15.8277],
  "Costa Rica": [9.7489, -83.7534], "Croatia": [45.1000, 15.2000], "Cuba": [21.5218, -77.7812],
  "Cyprus": [35.1264, 33.4299], "Czech Republic": [49.8175, 15.4730], "Democratic Republic of the Congo": [-4.0383, 21.7587],
  "Denmark": [56.2639, 9.5018], "Djibouti": [11.8251, 42.5903], "Dominica": [15.4149, -61.3705],
  "Dominican Republic": [18.7357, -70.1627], "East Timor": [-8.8742, 125.7275], "Ecuador": [-1.8312, -78.1834],
  "Egypt": [26.8206, 30.8025], "El Salvador": [13.7942, -88.8965], "Equatorial Guinea": [1.6508, 10.2679],
  "Eritrea": [15.1794, 39.7823], "Estonia": [58.5953, 25.0136], "Eswatini": [-26.5225, 31.4659],
  "Ethiopia": [9.1450, 40.4897], "Fiji": [-17.7134, 178.0650], "Finland": [61.9241, 25.7482],
  "France": [46.2276, 2.2137], "Gabon": [-0.8037, 11.6094], "Gambia": [13.4432, -15.3101],
  "Georgia": [42.3154, 43.3569], "Germany": [51.1657, 10.4515], "Ghana": [7.9465, -1.0232],
  "Greece": [39.0742, 21.8243], "Grenada": [12.1165, -61.6790], "Guatemala": [15.7835, -90.2308],
  "Guinea": [9.9456, -9.6966], "Guinea-Bissau": [11.8037, -15.1804], "Guyana": [4.8604, -58.9301],
  "Haiti": [18.9712, -72.2852], "Honduras": [15.1999, -86.2419], "Hungary": [47.1625, 19.5033],
  "Iceland": [64.9631, -19.0208], "India": [20.5937, 78.9629], "Indonesia": [-0.7893, 113.9213],
  "Iran": [32.4279, 53.6880], "Iraq": [33.2232, 43.6793], "Ireland": [53.4129, -8.2439],
  "Israel": [31.0461, 34.8516], "Italy": [41.8719, 12.5674], "Ivory Coast": [7.5400, -5.5471],
  "Jamaica": [18.1096, -77.2975], "Japan": [36.2048, 138.2529], "Jordan": [30.5852, 36.2384],
  "Kazakhstan": [48.0196, 66.9237], "Kenya": [-0.0236, 37.9062], "Kiribati": [-3.3704, -168.7340],
  "Kuwait": [29.3117, 47.4818], "Kyrgyzstan": [41.2044, 74.7661], "Laos": [19.8563, 102.4955],
  "Latvia": [56.8796, 24.6032], "Lebanon": [33.8547, 35.8623], "Lesotho": [-29.6099, 28.2336],
  "Liberia": [6.4281, -9.4295], "Libya": [26.3351, 17.2283], "Liechtenstein": [47.1660, 9.5554],
  "Lithuania": [55.1694, 23.8813], "Luxembourg": [49.8153, 6.1296], "Madagascar": [-18.7669, 46.8691],
  "Malawi": [-13.2543, 34.3015], "Malaysia": [4.2105, 101.9758], "Maldives": [3.2028, 73.2207],
  "Mali": [17.5707, -3.9962], "Malta": [35.9375, 14.3754], "Marshall Islands": [7.1315, 171.1845],
  "Mauritania": [21.0079, -10.9408], "Mauritius": [-20.3484, 57.5522], "Mexico": [23.6345, -102.5528],
  "Micronesia": [7.4256, 150.5508], "Moldova": [47.4116, 28.3699], "Monaco": [43.7384, 7.4246],
  "Mongolia": [46.8625, 103.8467], "Montenegro": [42.7087, 19.3744], "Morocco": [31.7917, -7.0926],
  "Mozambique": [-18.6657, 35.5296], "Myanmar": [21.9162, 95.9560], "Namibia": [-22.9576, 18.4904],
  "Nauru": [-0.5228, 166.9315], "Nepal": [28.3949, 84.1240], "Netherlands": [52.1326, 5.2913],
  "New Zealand": [-40.9006, 174.8860], "Nicaragua": [12.8654, -85.2072], "Niger": [17.6078, 8.0817],
  "Nigeria": [9.0820, 8.6753], "North Korea": [40.3399, 127.5101], "North Macedonia": [41.6086, 21.7453],
  "Norway": [60.4720, 8.4689], "Oman": [21.5126, 55.9233], "Pakistan": [30.3753, 69.3451],
  "Palau": [7.5150, 134.5825], "Palestine": [31.9522, 35.2332], "Panama": [8.5380, -80.7821],
  "Papua New Guinea": [-6.3150, 143.9555], "Paraguay": [-23.4425, -58.4438], "Peru": [-9.1900, -75.0152],
  "Philippines": [12.8797, 121.7740], "Poland": [51.9194, 19.1451], "Portugal": [39.3999, -8.2245],
  "Qatar": [25.3548, 51.1839], "Romania": [45.9432, 24.9668], "Russia": [61.5240, 105.3188],
  "Rwanda": [-1.9403, 29.8739], "Saint Kitts and Nevis": [17.3578, -62.7830], "Saint Lucia": [13.9094, -60.9789],
  "Saint Vincent and the Grenadines": [12.9843, -61.2872], "Samoa": [-13.7590, -172.1046],
  "San Marino": [43.9424, 12.4578], "Sao Tome and Principe": [0.1864, 6.6131], "Saudi Arabia": [23.8859, 45.0792],
  "Senegal": [14.4974, -14.4524], "Serbia": [44.0165, 21.0059], "Seychelles": [-4.6796, 55.4920],
  "Sierra Leone": [8.4606, -11.7799], "Singapore": [1.3521, 103.8198], "Slovakia": [48.6690, 19.6990],
  "Slovenia": [46.1512, 14.9955], "Solomon Islands": [-9.6457, 160.1562], "Somalia": [5.1521, 46.1996],
  "South Africa": [-30.5595, 22.9375], "South Korea": [35.9078, 127.7669], "South Sudan": [6.8770, 31.3070],
  "Spain": [40.4637, -3.7492], "Sri Lanka": [7.8731, 80.7718], "Sudan": [12.8628, 30.2176],
  "Suriname": [3.9193, -56.0278], "Sweden": [60.1282, 18.6435], "Switzerland": [46.8182, 8.2275],
  "Syria": [34.8021, 38.9968], "Tajikistan": [38.8610, 71.2761], "Tanzania": [-6.3690, 34.8888],
  "Thailand": [15.8700, 100.9925], "Togo": [8.6195, 0.8248], "Tonga": [-21.1789, -175.1982],
  "Trinidad and Tobago": [10.6918, -61.2225], "Tunisia": [33.8869, 9.5375], "Turkey": [38.9637, 35.2433],
  "Turkmenistan": [38.9697, 59.5563], "Tuvalu": [-7.1095, 177.6493], "Uganda": [1.3733, 32.2903],
  "Ukraine": [48.3794, 31.1656], "United Arab Emirates": [23.4241, 53.8478], "United Kingdom": [55.3781, -3.4360],
  "United States": [37.0902, -95.7129], "Uruguay": [-32.5228, -55.7658], "Uzbekistan": [41.3775, 64.5853],
  "Vanuatu": [-15.3767, 166.9592], "Vatican City": [41.9029, 12.4534], "Venezuela": [6.4238, -66.5897],
  "Vietnam": [14.0583, 108.2772], "Yemen": [15.5527, 48.5164], "Zambia": [-13.1339, 27.8493],
  "Zimbabwe": [-19.0154, 29.1549]
};

function getMagColor(mag: number) {
  if (mag >= 7) return "#ff2200";
  if (mag >= 6) return "#ff6600";
  if (mag >= 5) return "#ffaa00";
  if (mag >= 4) return "#ffdd00";
  return "#88cc44";
}

function getMagRadius(mag: number) {
  if (mag >= 7) return 22;
  if (mag >= 6) return 16;
  if (mag >= 5) return 12;
  if (mag >= 4) return 9;
  return 6;
}

export default function EarthquakeMap({ data, zoomSequence, selectedCountry }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const zoomTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const router = useRouter();

  // 1. Initialize Map Frame
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 18, subdomains: "abcd" }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.control
      .attribution({ position: "bottomleft", prefix: false })
      .addAttribution('© <a href="https://carto.com">CARTO</a> | USGS')
      .addTo(map);

    // Create a unified LayerGroup to manage markers collectively
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Fixed hidden dimension layout issues on load
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersGroupRef.current = null;
    };
  }, []);

  // 2. Handle Dynamic Camera Sequence safely
  useEffect(() => {
    const map = mapInstanceRef.current;
    
    // Clean up older asynchronous cycle operations immediately on dependency shift
    zoomTimersRef.current.forEach(clearTimeout);
    zoomTimersRef.current = [];

    if (!map) return;

    if (!selectedCountry || selectedCountry === "All") {
      map.flyTo([20, 0], 2, { duration: 1.2 });
      return;
    }

    if (!zoomSequence || zoomSequence.length === 0) {
      const targetCoords = COUNTRY_COORDINATES[selectedCountry];
      if (targetCoords) {
        map.flyTo(targetCoords, 5, { duration: 1.5 });

        const backOutTimer = setTimeout(() => {
          // Verify component is still mounted and context exists before calling
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([20, 0], 2, { duration: 1.5 });
          }
        }, 3000);

        zoomTimersRef.current.push(backOutTimer);
      } else {
        map.flyTo([20, 0], 2, { duration: 1.2 });
      }
      return;
    }

    if (zoomSequence.length === 1) {
      map.flyTo([zoomSequence[0].lat, zoomSequence[0].lon], 6, { duration: 1.5 });
      return;
    }

    zoomSequence.forEach((eq, index) => {
      const timer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([eq.lat, eq.lon], 6, { duration: 1.2 });
        }
      }, index * 2000);
      zoomTimersRef.current.push(timer);
    });

    return () => {
      zoomTimersRef.current.forEach(clearTimeout);
      zoomTimersRef.current = [];
    };
  }, [zoomSequence, selectedCountry]);

  // 3. Handle markers rendering via Layer Groups
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear everything instantly inside the layer container instead of loop element drops
    markersGroup.clearLayers();

    data.forEach((eq) => {
      const color = getMagColor(eq.magnitude);
      const radius = getMagRadius(eq.magnitude);
      const mins = Math.max(1, Math.floor((Date.now() - eq.time) / 60000));
      const timeStr = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;

      const customHTML = `
        <div class="quake-node-group" style="width: ${radius * 2}px; height: ${radius * 2}px;">
          <div class="quake-dot" style="
            width: ${radius * 2}px; 
            height: ${radius * 2}px; 
            background: ${color}73; 
            border: 1.5px solid ${color};
          "></div>
          
          <div class="hover-bridge" style="bottom: ${radius * 2 - 5}px;"></div>

          <div class="quake-hover-card" style="bottom: ${radius * 2 + 10}px;">
            <div style="color: ${color}; font-size: 18px; font-weight: 900; letter-spacing: -0.5px;">M${eq.magnitude.toFixed(1)}</div>
            <div style="color: rgba(255,255,255,0.8); font-size: 12px; margin: 4px 0 2px; line-height: 1.4;">${eq.place}</div>
            <div style="color: rgba(255,150,50,0.5); font-size: 11px;">${timeStr}${eq.depth != null ? ` · ${eq.depth.toFixed(1)} km deep` : ""}</div>
            <div style="color: rgba(255,150,50,0.35); font-size: 10px; margin-top: 6px; border-top: 1px solid rgba(255,100,0,0.15); padding-top: 6px;">
              Click for full details & news →
            </div>
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: customHTML,
        className: "leaflet-custom-marker-wrapper",
        iconSize: [radius * 2, radius * 2],
        iconAnchor: [radius, radius],
      });

      const interactionMarker = L.marker([eq.lat, eq.lon], { icon: markerIcon });

      interactionMarker.on("click", () => {
        router.push(`/earthquake/${encodeURIComponent(eq.id)}`);
      });

      // Add directly into our controlled subset layer instance
      markersGroup.addLayer(interactionMarker);
    });
  }, [data, router]);

  return (
    <>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "520px", background: "#060610", overflow: "hidden" }}
      />
      
      <style jsx global>{`
        .leaflet-custom-marker-wrapper {
          overflow: visible !important;
          z-index: 500 !important;
        }
        .leaflet-custom-marker-wrapper:hover {
          z-index: 99999 !important;
        }
        .quake-node-group {
          position: relative;
          cursor: pointer;
        }
        .quake-dot {
          border-radius: 50%;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .hover-bridge {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 190px;
          height: 25px;
          background: transparent;
          display: none;
          z-index: 10;
        }
        .quake-hover-card {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          background: #0f0f22;
          border-radius: 10px;
          padding: 10px 14px;
          color: white;
          font-family: system-ui, sans-serif;
          min-width: 190px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.85);
          display: none;
          z-index: 200000 !important;
          pointer-events: auto !important;
        }
        .quake-node-group:hover .quake-hover-card,
        .quake-node-group:hover .hover-bridge {
          display: block !important;
        }
        .quake-node-group:hover .quake-dot {
          background-color: rgba(255, 255, 255, 0.25) !important; /* Fixed broken background-opacity fallback */
          transform: scale(1.1);
        }
        .quake-node-group:hover .quake-hover-card {
          border: 1px solid rgba(255, 110, 0, 0.35);
        }
      `}</style>
    </>
  );
}