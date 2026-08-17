/**
 * imgUrl is stored as a map keyed by index ("0", "1", ...) rather than a true
 * array, so normalise it to an ordered list before rendering. Also accepts a
 * real array, in case documents are migrated later.
 */
export default function imageUrls(imgUrl) {
  if (Array.isArray(imgUrl)) return imgUrl.filter(Boolean);
  if (!imgUrl || typeof imgUrl !== "object") return [];

  return Object.keys(imgUrl)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((key) => imgUrl[key])
    .filter(Boolean);
}
