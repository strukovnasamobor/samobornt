import { registerSW } from "virtual:pwa-register";

// Tracks the very first service worker install, which is the one that carries
// the whole precache - around 105 entries including five AR scenes of 10-12 MB
// - and so is long enough that an unexplained wait looks like a broken app.
//
// Three states with one direction of travel: idle -> installing -> done, and
// "done" is terminal. The worker announces itself through several channels that
// can arrive in any order, and a terminal end state is what stops a late "it is
// installing" from turning the message back on and stranding it there.
let status = "idle";

const listeners = new Set();
let watchdogId = null;

const emit = () => listeners.forEach((listener) => listener());

function markInstalling() {
  if (status !== "idle") return;
  status = "installing";
  emit();
}

function markDone() {
  if (status === "done") return;
  status = "done";
  if (watchdogId !== null) {
    clearInterval(watchdogId);
    watchdogId = null;
  }
  emit();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// A boolean rather than an object: useSyncExternalStore compares snapshots with
// Object.is, and a fresh object every call would re-render without end.
export const getIsPrecaching = () => status === "installing";

// "installed" means the precache is written, "activated" that it is serving,
// and "redundant" that the install failed - a connection dropped partway
// through one of the 12 MB scenes, say. All three end the wait; only
// "installing" is still work in progress.
function watchWorker(worker) {
  if (!worker) return;

  const onStateChange = () => {
    if (worker.state === "installing") return;
    worker.removeEventListener("statechange", onStateChange);
    markDone();
  };

  worker.addEventListener("statechange", onStateChange);
  // The worker may have moved on between reading it off the registration and
  // attaching the listener, and that transition is never replayed.
  onStateChange();
}

// Last line of defence. It re-reads the registration rather than counting
// seconds, because a first precache over a weak connection can legitimately run
// for many minutes and a stopwatch would hide the message while it is still
// true.
function startWatchdog() {
  if (status !== "installing") return;

  watchdogId = setInterval(() => {
    navigator.serviceWorker.getRegistration().then((registration) => {
      const finished =
        !registration ||
        registration.active ||
        (!registration.installing && !registration.waiting);
      if (finished) markDone();
    });
  }, 15000);
}

export function startPrecacheStatusTracking() {
  registerSW({
    onRegisteredSW(_swUrl, registration) {
      // registration.active is the only dependable "this app has already been
      // made offline-capable once" signal. It belongs to the registration
      // rather than to this page, so unlike navigator.serviceWorker.controller
      // it survives a hard reload, which leaves the page uncontrolled even
      // though a worker is active. It is also non-null while an update
      // installs, which is why a new deploy never shows the message.
      if (!registration || registration.active) return markDone();

      markInstalling();

      const worker = registration.installing ?? registration.waiting;
      if (worker) {
        watchWorker(worker);
      } else {
        // register() resolved before the browser attached the installing
        // worker: wait for the one updatefound and pick it up from there.
        registration.addEventListener(
          "updatefound",
          () => watchWorker(registration.installing),
          { once: true },
        );
      }

      startWatchdog();
    },

    // The plugin's own first-install signal. A hide signal only - it never
    // shows the message, because it also fires spuriously after a hard reload,
    // where workbox reads a null controller and concludes "not an update".
    onOfflineReady: markDone,

    // The script 404s, the browser refuses to register one (Firefox private
    // browsing), or workbox-window fails to load. Nothing is being precached.
    onRegisterError: markDone,

    // Deliberately no onNeedReload: leaving it unset is what keeps the plugin's
    // own window.location.reload() when an updated worker activates.
  });

  // clientsClaim() is on, so the first install claims this page the moment it
  // activates. This is the hide signal that still works in a second tab opened
  // mid-install, where updatefound has already fired, workbox never sees a
  // statechange, and onOfflineReady is therefore never called.
  navigator.serviceWorker?.addEventListener("controllerchange", markDone);
}
