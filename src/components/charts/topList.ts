import { categoricalColor } from "../../lib/theme.ts";
import { renderEmptyState } from "./chart-utils.ts";

export interface TopListItem {
  label: string;
  sublabel?: string;
  value: number;
  imageUrl?: string | null;
}

export type TopListShape = "circle" | "square";

/** Ranked horizontal-bar list (top artists/tracks/albums/genres), with a
 *  thumbnail per row — a photo when available, otherwise a colored initial. */
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
    li.style.setProperty("--accent", categoricalColor(i));

    const rank = document.createElement("span");
    rank.className = "top-list-rank";
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
      thumb.style.background = `color-mix(in srgb, ${categoricalColor(i)} 28%, var(--color-card))`;
      thumb.style.color = categoricalColor(i);
    }

    const labels = document.createElement("span");
    labels.className = "top-list-labels";
    labels.innerHTML = `<span class="top-list-label">${escapeHtml(item.label)}</span>${
      item.sublabel ? `<span class="top-list-sublabel">${escapeHtml(item.sublabel)}</span>` : ""
    }`;

    const barTrack = document.createElement("span");
    barTrack.className = "top-list-bar-track";
    const bar = document.createElement("span");
    bar.className = "top-list-bar";
    bar.style.background = categoricalColor(i);
    bar.style.width = "0%";
    barTrack.appendChild(bar);
    requestAnimationFrame(() => {
      bar.style.width = `${(item.value / max) * 100}%`;
    });

    const value = document.createElement("span");
    value.className = "top-list-value tabular";
    value.textContent = formatValue(item.value);

    li.append(rank, thumb, labels, value, barTrack);
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
    .top-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.65rem; }
    .top-list-row {
      display: grid;
      grid-template-columns: 1.5rem 2.5rem minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.75rem;
      padding: 0.3rem;
      border-left: 2px solid transparent;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }
    .top-list-row:hover { background: var(--color-card-hover); border-left-color: var(--accent); }
    .top-list-rank { color: var(--color-text-faint); font-size: 0.8rem; text-align: right; }
    .top-list-rank::before { content: "#"; }
    .top-list-thumb {
      width: 2.5rem; height: 2.5rem; flex-shrink: 0; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1rem;
      border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
    }
    .top-list-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.85); }
    .top-list-labels { display: flex; flex-direction: column; min-width: 0; }
    .top-list-label { font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .top-list-sublabel { font-size: 0.75rem; color: var(--color-text-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .top-list-sublabel::before { content: "// "; }
    .top-list-bar-track { grid-column: 2 / -1; height: 3px; background: var(--color-border); overflow: hidden; }
    .top-list-bar { display: block; height: 100%; transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
    .top-list-value { font-size: 0.8rem; color: var(--color-text-muted); }
  `;
  document.head.appendChild(style);
}
