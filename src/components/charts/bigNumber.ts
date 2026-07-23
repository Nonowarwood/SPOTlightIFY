// Animated count-up for hero stats — the "one big number" beat every page opens with.

export function animateBigNumber(
  el: HTMLElement,
  target: number,
  formatter: (n: number) => string,
  durationMs = 900,
): void {
  const start = performance.now();
  const from = 0;

  function tick(now: number) {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / durationMs);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = from + (target - from) * eased;
    el.textContent = formatter(value);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = formatter(target);
  }

  requestAnimationFrame(tick);
}
