/**
 * Sight documents keep their coordinates as strings, e.g.
 * location: { lat: "45.803525", long: "15.713745" }. Returns them as numbers,
 * or null when a sight has no usable position, so callers can leave out the
 * map actions rather than sending the camera to the middle of the ocean.
 */
export default function sightLocation(location) {
  if (!location || typeof location !== "object") return null;

  const lat = Number(location.lat ?? location.latitude);
  const long = Number(location.long ?? location.lng ?? location.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(long)) return null;
  if (Math.abs(lat) > 90 || Math.abs(long) > 180) return null;

  return { lat, long };
}
