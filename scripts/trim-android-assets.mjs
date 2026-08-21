/**
 * Removes the full-resolution AR masters from the Android assets.
 *
 * `cap sync` copies the whole of dist into the native project, but the app
 * loads everything from samobornt.web.app, so those assets are never read —
 * and the three scans alone put ~177 MB of unreadable files in the APK. Even
 * if the app did fall back to them, the masters are only ever requested by the
 * desktop branch in the AR pages (data-src-full behind isDesktop), which the
 * Android app never takes; and script.js drops back to the optimized model if
 * a master fails to load.
 *
 * A master is recognised by having an optimized sibling: samoborcek.glb goes
 * because samoborcek.opt.glb is there to serve in its place. kremsnita.glb and
 * i_love_samobor.glb have no such sibling — they are the only model their
 * scene has — so they stay. Nothing here touches dist, where the masters are
 * still deployed for desktop browsers.
 *
 * Runs after `cap sync`; `npm run sync:android` does the whole sequence.
 */
import { readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const AR_ROOT = "android-capacitor/app/src/main/assets/public/ar";
const SUFFIX = ".glb";
const OPTIMIZED = ".opt.glb";

if (!existsSync(AR_ROOT)) {
  console.error(`trim-android-assets: ${AR_ROOT} is missing — run "cap sync" first.`);
  process.exit(1);
}

const mb = (bytes) => `${(bytes / 1048576).toFixed(1).padStart(6)} MB`;

let removed = 0;
let freed = 0;
let kept = 0;

for (const entry of readdirSync(AR_ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = join(AR_ROOT, entry.name);
  const models = readdirSync(dir).filter((name) => name.endsWith(SUFFIX));

  for (const model of models) {
    if (model.endsWith(OPTIMIZED)) continue;

    const optimized = model.slice(0, -SUFFIX.length) + OPTIMIZED;
    const size = statSync(join(dir, model)).size;

    if (!models.includes(optimized)) {
      kept += 1;
      console.log(`  keep   ${mb(size)}  ${entry.name}/${model} — the only model this scene has`);
      continue;
    }

    rmSync(join(dir, model));
    removed += 1;
    freed += size;
    console.log(`  remove ${mb(size)}  ${entry.name}/${model} — ${optimized} ships instead`);
  }
}

console.log(
  removed === 0
    ? `trim-android-assets: nothing to remove; ${kept} scene(s) ship their only model`
    : `trim-android-assets: removed ${removed} master(s), ${mb(freed).trim()} out of the APK`
);
