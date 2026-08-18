/**
 * ONE-TIME MIGRATION SCRIPT
 *
 * Merges the flat, per-language collections `sights_hr` and `sights_en` into the
 * unified `sights` collection, where every document keeps all its translations
 * inside the field itself (the shape documents 1 and 2 already use):
 *
 *   title | shortDescription | longDescription : { hr, en }
 *   imgUrl : { "0": "/images/x.jpg", "1": ... }   (map keyed by index, leading slash)
 *
 * Rules:
 *  - Documents 1 and 2 are already filled in by hand and are skipped entirely.
 *  - `location` is never written: the coordinates already in `sights` were
 *    curated separately and differ from the lat/long in the source collections.
 *  - The source collections are ordered differently from `sights` for two pairs:
 *    sights 9 <- source 10, sights 10 <- source 9, sights 13 <- source 14,
 *    sights 14 <- source 13 (see ID_MAP).
 *
 * Usage:  node migrate-sights.mjs --dry     (preview, writes nothing)
 *         node migrate-sights.mjs --write   (perform the writes)
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD2HHdI_LTk8nE8_b1CgvnOPBhDE5mry68",
  authDomain: "samobornt.firebaseapp.com",
  projectId: "samobornt",
  storageBucket: "samobornt.appspot.com",
  messagingSenderId: "230354547904",
  appId: "1:230354547904:web:db9b329bdf4f7a0239e925",
  measurementId: "G-57QD07SEB4"
};

const WRITE = process.argv.includes('--write');
const SKIP_IDS = new Set(['1', '2']);        // already completed by hand
const ID_MAP = { '9': '10', '10': '9', '13': '14', '14': '13' };  // sights id -> source id

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const fetchAll = async (name) => {
  const snap = await getDocs(collection(db, name));
  return new Map(snap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
};

const text = (v) => (typeof v === 'string' ? v.trim() : '');

// source imgUrl is an array of "images/x.jpg"; target is a map keyed by index
// with an absolute path, matching documents 1 and 2
const toImgMap = (arr) => {
  if (!Array.isArray(arr)) return null;
  const map = {};
  arr.filter(Boolean).forEach((path, i) => {
    map[String(i)] = path.startsWith('/') ? path : `/${path}`;
  });
  return Object.keys(map).length ? map : null;
};

const [hr, en, sights] = await Promise.all([
  fetchAll('sights_hr'), fetchAll('sights_en'), fetchAll('sights')
]);

console.log(`sights_hr: ${hr.size} | sights_en: ${en.size} | sights: ${sights.size}`);
console.log(WRITE ? '\n*** WRITE MODE ***\n' : '\n*** DRY RUN (no writes) ***\n');

const problems = [];
const planned = [];

for (const id of [...sights.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
  if (SKIP_IDS.has(id)) { console.log(`${id.padStart(2)}  SKIP (already filled in)`); continue; }

  const srcId = ID_MAP[id] ?? id;
  const h = hr.get(srcId);
  const e = en.get(srcId);
  const target = sights.get(id);

  if (!h || !e) { problems.push(`${id}: no source document ${srcId} in sights_hr/sights_en`); continue; }

  // the few titles already in `sights` tell us the intended pairing - verify it
  const existingHrTitle = text(target.title?.hr);
  if (existingHrTitle && existingHrTitle !== text(h.name)) {
    problems.push(`${id}: existing title.hr "${existingHrTitle}" != sights_hr/${srcId} name "${text(h.name)}" - pairing looks wrong, skipped`);
    continue;
  }

  const payload = {
    title: { hr: text(h.name), en: text(e.name) },
    shortDescription: { hr: text(h.shortDescription), en: text(e.shortDescription) },
    longDescription: { hr: text(h.longDescription), en: text(e.longDescription) },
  };

  const imgUrl = toImgMap(h.imgUrl) ?? toImgMap(e.imgUrl);
  if (imgUrl) payload.imgUrl = imgUrl;
  else problems.push(`${id}: no imgUrl in source ${srcId}`);

  for (const [field, value] of Object.entries(payload)) {
    if (field === 'imgUrl') continue;
    if (!value.hr) problems.push(`${id}: empty hr ${field}`);
    if (!value.en) problems.push(`${id}: empty en ${field}`);
  }

  const mark = srcId === id ? '   ' : ` <-${srcId.padStart(2)}`;
  console.log(`${id.padStart(2)}${mark}  ${payload.title.hr}  /  ${payload.title.en}  [${Object.keys(imgUrl ?? {}).length} img]`);

  planned.push({ id, payload });
}

if (problems.length) {
  console.log('\n--- WARNINGS ---');
  problems.forEach((p) => console.log('  ! ' + p));
}

if (!WRITE) {
  console.log(`\n${planned.length} documents would be updated (location left untouched). Re-run with --write.`);
  process.exit(0);
}

// merge:true so the existing `location` field (and anything else) is preserved
for (const { id, payload } of planned) {
  await setDoc(doc(db, 'sights', id), payload, { merge: true });
  console.log(`written: sights/${id}`);
}
console.log(`\nDone. ${planned.length} documents updated.`);
process.exit(0);
