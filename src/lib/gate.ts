// Shared between PassphraseGate and every chart script. This is a deterrent,
// not real security — see spotlightify-data's README and this project's for
// the actual privacy boundary (aggregate-only data, private raw repo).

const STORAGE_KEY = "spotlightify_unlocked";
const UNLOCK_EVENT = "spotlightify:unlocked";

export function isUnlocked(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
}

export function markUnlocked(): void {
  localStorage.setItem(STORAGE_KEY, "1");
  window.dispatchEvent(new CustomEvent(UNLOCK_EVENT));
}

/** Unlocks for this page load only — doesn't persist, so a fresh visit re-gates. */
export function unlockWithoutPersisting(): void {
  window.dispatchEvent(new CustomEvent(UNLOCK_EVENT));
}

/** Calls `callback` once the gate is unlocked — immediately if already unlocked. */
export function onUnlock(callback: () => void): void {
  if (isUnlocked()) {
    callback();
    return;
  }
  window.addEventListener(UNLOCK_EVENT, () => callback(), { once: true });
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
