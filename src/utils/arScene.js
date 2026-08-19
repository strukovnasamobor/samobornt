/**
 * An AR scene is a folder under public/ar holding its own index.html. Documents
 * point at one with a path like "/ar/i_love_samobor/", under `ar` on the newer
 * ones and `arUrl` on the older ones, so both are read and reduced to the bare
 * folder name. Returns null for a sight that has no scene.
 */
export default function arScene(sight) {
  const path = sight?.ar ?? sight?.arUrl;
  if (typeof path !== "string") return null;

  const scene = path
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^ar\//, "")
    .replace(/\/index\.html$/, "");

  return scene || null;
}
