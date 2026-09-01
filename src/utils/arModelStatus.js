// The AR models Quick Look shows on iOS live in the native app's own cache,
// not in the service worker, so their download progress cannot come from
// precacheStatus. This store is where arModelPrefetch puts what the QuickLook
// plugin reports, so the toast can render it - same shape and rules as
// mapOfflineStatus.
//
// Deliberately nothing is remembered across launches: the native cache is the
// source of truth, and the plugin's prefetch resolves instantly with nothing
// to report when every file is already there. A stored "done" flag would only
// go stale when iOS purges the cache under storage pressure.

// One object, replaced rather than mutated. useSyncExternalStore compares
// snapshots with Object.is, so handing back a fresh object every call would
// re-render without end - the reference has to stay put between changes.
let snapshot = { phase: "idle", completed: 0, total: 0 };

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

export const getArModelStatus = () => snapshot;

export function markPrefetching({ completed = 0, total = 0 } = {}) {
  set({ phase: "prefetching", completed, total });
}

export function markDone() {
  set({ phase: "done", completed: 0, total: 0 });
}

// A failed download is retried next launch, because the models genuinely are
// not all available offline yet.
export function markError() {
  set({ phase: "idle", completed: 0, total: 0 });
}
