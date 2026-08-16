/*
 * Firestore stores image paths pointing into the public folder (e.g. "images/prica_1.jpg").
 * Without a leading slash the browser resolves them against the current route, so on
 * /card/:id or /image_view/:url they turn into /card/images/... and 404. Normalize to an
 * absolute path. Values already absolute, or full http(s) URLs, are passed through.
 */
const imagePath = (url) => {
  if (!url) return url;
  if (url.startsWith('/') || /^(https?:)?\/\//.test(url)) return url;
  return '/' + url;
};

export default imagePath;
