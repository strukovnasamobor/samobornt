// The embedded rontomap frame holds the map tiles, not this app: they live in
// that origin's own cache, which this page cannot reach across origins. So the
// preparation is asked for with a "prepare-offline" command and reported back
// over postMessage, and this store is where Map.jsx puts what comes back so the
// toast can render it.
//
// "ready" is remembered per features collection rather than globally: the two
// languages are two different collections, and preparing one says nothing about
// the other.
const STORAGE_PREFIX = "snt:mapOffline:";

// One object, replaced rather than mutated. useSyncExternalStore compares
// snapshots with Object.is, so handing back a fresh object every call would
// re-render without end - the reference has to stay put between changes.
let snapshot = { phase: "idle", done: 0, total: 0, percent: 0 };

const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

function set(next) {
  snapshot = next;
  emit();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getMapOfflineStatus = () => snapshot;

export function isMapPrepared(collectionId) {
  if (!collectionId) return false;
  try {
    return localStorage.getItem(STORAGE_PREFIX + collectionId) === "ready";
  } catch {
    // private mode or storage disabled: treat as not prepared, and the flag
    // below simply never sticks
    return false;
  }
}

export function markPreparing({ done = 0, total = 0, percent = 0 } = {}) {
  set({ phase: "preparing", done, total, percent });
}

export function markReady(collectionId) {
  if (collectionId) {
    try {
      localStorage.setItem(STORAGE_PREFIX + collectionId, "ready");
    } catch {
      // nothing to do - it just gets prepared again next launch
    }
  }
  set({ phase: "ready", done: 0, total: 0, percent: 100 });
}

// Deliberately not remembered: a failed sweep should be retried next launch,
// because the map genuinely is not available offline yet.
export function markError() {
  set({ phase: "idle", done: 0, total: 0, percent: 0 });
}
