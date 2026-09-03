/**
 * Removes every Google Play reference from the assets packaged into the IPA.
 *
 * App Review rejected the build under guideline 2.3.10: a pointer to another
 * app store counts as information about a third-party platform that is
 * irrelevant to App Store users. Settings.jsx already hides the link at
 * runtime, which is what the reviewer sees, since the shell loads
 * samobornt.web.app rather than its own copy of the app. This handles the other
 * half — the strings themselves, which `cap sync` copies into the bundle where
 * a scan of the binary would still turn them up, even though nothing renders
 * them. The web build and the Android app keep the link and are untouched.
 *
 * Three references ship: the badge image (used only by the README, but it sits
 * in public/ so it is copied along with everything else), the "Get it on Google
 * Play" label in each translation file, and the listing URL in the minified
 * bundle. The service worker precaches the badge by name, so its manifest entry
 * goes too — deleting the file and leaving the entry would fail the install.
 *
 * Runs after `cap sync ios`; `npm run sync:ios` does the whole sequence. Safe
 * to run twice: a second pass simply finds nothing left to remove.
 */
import { readdirSync, readFileSync, writeFileSync, rmSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_ROOT = "ios-capacitor/App/App/public";
const BADGE = "images/google_play_badge.png";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.strukovnasamobor.samobornt";
const I18N_KEY = "googlePlay";

const escapeRegExp = (literal) => literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

if (!existsSync(PUBLIC_ROOT)) {
  console.error(`trim-ios-assets: ${PUBLIC_ROOT} is missing — run "cap sync ios" first.`);
  process.exit(1);
}

let changes = 0;
const done = (message) => {
  changes += 1;
  console.log(`  ${message}`);
};

// 1. The badge image, and the precache entry that would outlive it.
const badgePath = join(PUBLIC_ROOT, BADGE);
if (existsSync(badgePath)) {
  const size = statSync(badgePath).size;
  rmSync(badgePath);
  done(`removed ${BADGE} (${(size / 1024).toFixed(1)} kB)`);
}

const swPath = join(PUBLIC_ROOT, "sw.js");
if (existsSync(swPath)) {
  const before = readFileSync(swPath, "utf8");
  // Workbox writes the manifest as {url:"…",revision:"…"} entries in one array.
  // The entry goes with the comma that follows it; if it was the last one that
  // comma sat in front instead, and the fixup below closes the gap. Minified
  // output has no trailing commas of its own, so ",]" can only be ours.
  const entry = new RegExp(`\\{url:"${escapeRegExp(BADGE)}",revision:"[^"]*"\\},?`, "g");
  const after = before.replace(entry, "").replaceAll(",]", "]");
  if (after !== before) {
    writeFileSync(swPath, after);
    done("removed the badge from the sw.js precache manifest");
  }
}

// 2. The translated label, in every language the app ships.
const i18nRoot = join(PUBLIC_ROOT, "i18n");
if (existsSync(i18nRoot)) {
  for (const name of readdirSync(i18nRoot).filter((f) => f.endsWith(".json"))) {
    const file = join(i18nRoot, name);
    const strings = JSON.parse(readFileSync(file, "utf8"));
    if (!(I18N_KEY in strings)) continue;
    const label = strings[I18N_KEY];
    delete strings[I18N_KEY];
    writeFileSync(file, `${JSON.stringify(strings, null, 2)}\n`);
    done(`removed "${label}" from i18n/${name}`);
  }
}

// 3. What the minifier left in the bundle: the listing URL, and the key the
// link is filed under. Both are rewritten in place rather than cut out, so the
// object stays valid — the runtime filter means it is never rendered on iOS,
// and the label it would look up is gone from the translations above anyway.
const BUNDLE_REWRITES = [
  [PLAY_URL, ""],
  [`"${I18N_KEY}"`, '"storeListing"'],
];

const assetsRoot = join(PUBLIC_ROOT, "assets");
if (existsSync(assetsRoot)) {
  for (const name of readdirSync(assetsRoot).filter((f) => f.endsWith(".js"))) {
    const file = join(assetsRoot, name);
    const before = readFileSync(file, "utf8");
    let after = before;
    for (const [from, to] of BUNDLE_REWRITES) after = after.split(from).join(to);
    if (after === before) continue;
    writeFileSync(file, after);
    done(`rewrote the listing URL and key in assets/${name}`);
  }
}

// 4. Nothing above is anchored to anything Vite promises to keep stable, so
// prove the result rather than trust it: a bundle name, a minifier or a new
// translation could quietly put a reference back, and a red build here is far
// cheaper than another rejection.
const TEXT = [".js", ".json", ".html", ".css", ".webmanifest", ".txt"];
const FORBIDDEN = /play\.google|google[\s._-]*play/i;

const survivors = [];
const scan = (dir) => {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) {
      scan(path);
    } else if (FORBIDDEN.test(item.name)) {
      survivors.push(`${path} (filename)`);
    } else if (TEXT.some((ext) => item.name.endsWith(ext))) {
      const match = readFileSync(path, "utf8").match(FORBIDDEN);
      if (match) survivors.push(`${path} ("${match[0]}")`);
    }
  }
};
scan(PUBLIC_ROOT);

if (survivors.length > 0) {
  console.error("trim-ios-assets: Google Play references still in the bundle —");
  for (const survivor of survivors) console.error(`  ${survivor}`);
  console.error("Guideline 2.3.10 rejects these. Teach this script about them before shipping.");
  process.exit(1);
}

console.log(
  changes === 0
    ? "trim-ios-assets: no Google Play references in the bundle"
    : `trim-ios-assets: ${changes} Google Play reference(s) taken out of the bundle`
);
