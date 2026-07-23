// Shared plumbing for every D3 chart component: a responsive SVG root and a
// single reusable tooltip element, so all charts share identical chrome.

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_MARGIN: ChartMargin = { top: 16, right: 16, bottom: 28, left: 44 };

/**
 * Creates (or reuses) an SVG inside `container`, sized to the container's
 * current width and the given height, and re-renders `draw` on resize.
 */
export function responsiveSvg(
  container: HTMLElement,
  height: number,
  draw: (svg: SVGSVGElement, width: number, height: number) => void,
): void {
  container.innerHTML = "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(height));
  container.appendChild(svg);

  const render = () => {
    const width = container.clientWidth;
    if (width === 0) return;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = "";
    draw(svg, width, height);
  };

  render();
  const observer = new ResizeObserver(() => render());
  observer.observe(container);
}

let sharedTooltip: HTMLDivElement | null = null;

export function getTooltip(): HTMLDivElement {
  if (sharedTooltip) return sharedTooltip;
  const el = document.createElement("div");
  el.className = "chart-tooltip";
  document.body.appendChild(el);
  sharedTooltip = el;
  return el;
}

export function showTooltip(x: number, y: number, html: string): void {
  const tip = getTooltip();
  tip.innerHTML = html;
  tip.style.left = `${x + 12}px`;
  tip.style.top = `${y + 12}px`;
  tip.classList.add("visible");
}

export function hideTooltip(): void {
  sharedTooltip?.classList.remove("visible");
}

export function renderEmptyState(container: HTMLElement, message: string): void {
  container.innerHTML = `<p class="empty-state">${message}</p>`;
}
