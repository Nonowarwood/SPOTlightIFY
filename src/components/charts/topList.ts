import { renderEmptyState } from "./chart-utils.ts";

export interface TopListItem {
  label: string;
  sublabel?: string;
  value: number;
  imageUrl?: string | null;
}

export type TopListShape = "circle" | "square";

/** Ranked list, Apple Music / Screen Time style: artwork, label over a thin
 *  single-accent progress bar, right-aligned value, hairline separators. */
export function renderTopList(
  container: HTMLElement,
  items: TopListItem[],
  formatValue: (n: number) => string,
  shape: TopListShape = "square",
): void {
  if (items.length === 0) {
    renderEmptyState(container, "Pas encore assez de données.");
    return;
  }

  const max = Math.max(...items.map((i) => i.value));
  container.innerHTML = "";
  const list = document.createElement("ol");
  list.className = "top-list";

  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "top-list-row";

    const rank = document.createElement("span");
    rank.className = "top-list-rank tabular";
    rank.textContent = String(i + 1);

    const thumb = document.createElement("span");
    thumb.className = `top-list-thumb top-list-thumb--${shape}`;
    if (item.imageUrl) {
      const img = document.createElement("img");
      img.src = item.imageUrl;
      img.alt = "";
      img.loading = "lazy";
      thumb.appendChild(img);
    } else {
      thumb.textContent = item.label.charAt(0).toUpperCase();
    }

    const labels = document.createElement("span");
    labels.className = "top-list-labels";
    const barPct = (item.value / max) * 100;
    labels.innerHTML = `<span class="top-list-label">${escapeHtml(item.label)}</span>${
      item.sublabel ? `<span class="top-list-sublabel">${escapeHtml(item.sublabel)}</span>` : ""
    }<span class="top-list-bar-track"><span class="top-list-bar" style="width:0%"></span></span>`;
    requestAnimationFrame(() => {
      const bar = labels.querySelector<HTMLElement>(".top-list-bar");
      if (bar) bar.style.width = `${barPct}%`;
    });

    const value = document.createElement("span");
    value.className = "top-list-value tabular";
    value.textContent = formatValue(item.value);

    li.append(rank, thumb, labels, value);
    list.appendChild(li);
  });

  container.appendChild(list);
  injectStylesOnce();
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

let stylesInjected = false;
function injectStylesOnce(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .top-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    .top-list-row {
      display: grid;
      grid-template-columns: 1.4rem 2.75rem minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.9rem;
      padding: 0.7rem 0.15rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      transition: background-color 0.2s ease;
    }
    .top-list-row:last-child { border-bottom: none; }
    .top-list-row:hover { background: rgba(255, 255, 255, 0.035); }
    .top-list-rank { color: var(--color-text-faint); font-size: 0.8rem; text-align: center; }
    .top-list-thumb {
      width: 2.75rem; height: 2.75rem; flex-shrink: 0; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-weight: 600; font-size: 1rem;
      background: rgba(255, 255, 255, 0.07);
      color: var(--color-text-muted);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .top-list-thumb--square { border-radius: 10px; }
    .top-list-thumb--circle { border-radius: 999px; }
    .top-list-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .top-list-labels { display: flex; flex-direction: column; min-width: 0; gap: 0.15rem; }
    .top-list-label { font-size: 0.92rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .top-list-sublabel { font-size: 0.76rem; color: var(--color-text-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .top-list-bar-track {
      height: 3px; margin-top: 0.3rem; max-width: 320px;
      background: rgba(255, 255, 255, 0.08); border-radius: 999px; overflow: hidden;
    }
    .top-list-bar {
      display: block; height: 100%; border-radius: 999px;
      background: color-mix(in srgb, var(--color-cat-1) 85%, white);
      transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .top-list-value { font-size: 0.82rem; color: var(--color-text-muted); padding-left: 0.5rem; }
  `;
  document.head.appendChild(style);
}
