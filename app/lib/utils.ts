export function getEarthquakeSlug(eq: { id: string; place?: string; magnitude?: number }) {
  if (!eq) return "/";
  
  // 1. Format Magnitude (e.g. 5.2 -> m5-2)
  const mag = typeof eq.magnitude === "number" ? `m${eq.magnitude.toFixed(1).replace(".", "-")}-` : "";
  
  // 2. Clean Place String (e.g. "12km NNE of Tokyo, Japan" -> "tokyo-japan")
  const cleanPlace = (eq.place || "")
    .toLowerCase()
    .replace(/^\d+\s*km\s+[a-z]+\s+of\s+/i, "")
    .replace(/^off the coast of\s+/i, "")
    .replace(/^near the coast of\s+/i, "")
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .trim()
    .replace(/\s+/g, "-");        // Replace spaces with hyphens

  const locationSlug = cleanPlace ? `${cleanPlace}-` : "";

  // Output: /earthquake/m5-2-tokyo-japan-us6000thvq
  return `/earthquake/${mag}${locationSlug}${eq.id}`;
}